import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Image, ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { AdminHeader } from '../../components/admin/AdminHeader';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import api from '../../services/api';
interface Farmer {
  id: string;
  name: string;
  farm: string;
  location: string;
  status: string;
  profilePhoto?: string | null;
}
export const AdminFarmersScreen: React.FC = () => {
  const [userType, setUserType] = useState<'Farmers' | 'Customers'>('Farmers');
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState<{ [key: string]: number }>({});
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const initialTab = route.params?.initialTab;

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const tabs = ['All', 'Active', 'Blocked', 'Inactive'];
  const [isBlockModalVisible, setIsBlockModalVisible] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [blockUntilDate, setBlockUntilDate] = useState('');
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);

  const parseDateFromDDMMYYYY = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }
    return new Date('invalid');
  };

  const isValidBlockDate = () => {
    const regex = /^\d{2}-\d{2}-\d{4}$/;
    if (!regex.test(blockUntilDate)) return false;
    const targetDate = parseDateFromDDMMYYYY(blockUntilDate);
    if (isNaN(targetDate.getTime())) return false;
    const today = new Date();
    return targetDate.getTime() > today.getTime();
  };

  const calculateDurationDays = () => {
    const targetDate = parseDateFromDDMMYYYY(blockUntilDate);
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // We use useFocusEffect to call fetchFarmers instead of this useEffect

  const fetchFarmers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/farmers');
      if (response.data && response.data.data) {
        const mappedFarmers = response.data.data.map((f: any) => ({
          id: f.farmerId,
          name: f.name || 'Unknown Farmer',
          farm: f.farmName || 'No Farm Name',
          location: `${f.village || ''}, ${f.state || ''}`.replace(/^, | , $/g, '').trim(),
          status: f.status === 'ACTIVE' ? 'Active' : (f.status === 'PENDING' ? 'Pending' : (f.status === 'INACTIVE' ? 'Blocked' : 'Inactive')),
          profilePhoto: f.profilePhoto,
        }));
        setFarmers(mappedFarmers);
        fetchUnreadCounts();
      }
    } catch (error) {
      console.error('Failed to fetch farmers:', error);
      Alert.alert('Error', 'Failed to fetch farmers from backend.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCounts = async () => {
    try {
      const countsRes = await api.get('/support/admin/unread-counts');
      if (countsRes.data && countsRes.data.data) {
        setUnreadCounts(countsRes.data.data);
      }
    } catch (e) {
      console.error('Failed to fetch support unread counts:', e);
    }
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/customers');
      if (res.data && res.data.data) {
        setCustomers(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (userType === 'Farmers') {
        fetchFarmers();
        const interval = setInterval(() => {
          fetchUnreadCounts();
        }, 5000);
        return () => clearInterval(interval);
      } else {
        fetchCustomers();
      }
    }, [userType])
  );
  const filteredFarmers = farmers.filter(f => {
    if (activeTab !== 'All' && f.status !== activeTab) return false;
    if (searchQuery && !f.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredCustomers = customers.filter(c => {
    const statusMap: any = { 'ACTIVE': 'Active', 'BLOCKED': 'Blocked', 'INACTIVE': 'Inactive' };
    const normalizedStatus = statusMap[c.status] || 'Inactive';
    if (activeTab !== 'All' && normalizedStatus !== activeTab) return false;
    if (searchQuery && !c.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const CustomerAvatar = ({ item }: { item: any }) => {
    const defaultUri = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'Unknown')}&background=17212F&color=F5C16C&size=100&bold=true`;
    return (
      <View style={styles.avatar}>
        <Image
          source={{ uri: defaultUri }}
          style={styles.profileImage}
        />
      </View>
    );
  };

  const renderCustomerItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.farmerCard} onPress={() => navigation.navigate('AdminCustomerDetails', { customerId: item.customerId })}>
      <View style={styles.cardLeft}>
        <CustomerAvatar item={item} />
        <View>
          <Text style={styles.farmerName}>{item.name || 'Unknown'}</Text>
          <Text style={styles.location}>{item.state ? `${item.state}` : ''}{item.village ? `, ${item.village}` : ''}</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <StatusBadge status={item.status === 'ACTIVE' ? 'Active' : (item.status === 'BLOCKED' ? 'Blocked' : 'Inactive')} />
      </View>
    </TouchableOpacity>
  );

  const FarmerAvatar = ({ item }: { item: any }) => {
    const defaultUri = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=17212F&color=F5C16C&size=100&bold=true`;
    return (
      <View style={styles.avatar}>
        <Image
          source={{ uri: defaultUri }}
          style={styles.profileImage}
        />
      </View>
    );
  };
  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.farmerCard} onPress={() => navigation.navigate('AdminFarmerDetails', { farmerId: item.id })}>
      <View style={styles.cardLeft}>
        <FarmerAvatar item={item} />
        <View>
          <Text style={styles.farmerName}>{item.name}</Text>
          <Text style={styles.farmName}>{item.farm}</Text>
          <Text style={styles.location}>{item.location}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {item.status === 'Blocked' && (
          <TouchableOpacity 
            onPress={() => navigation.navigate('AdminSupportChatScreen', { farmerId: item.id, farmerName: item.name })}
            style={{ marginRight: 16, position: 'relative' }}
          >
            <Ionicons name="chatbubbles" size={32} color="#7C3AED" />
            {unreadCounts[item.id] > 0 && (
              <View style={{
                position: 'absolute',
                top: -4,
                right: -4,
                backgroundColor: '#EF4444',
                borderRadius: 10,
                minWidth: 18,
                height: 18,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1.5,
                borderColor: '#FFFFFF'
              }}>
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 4 }}>
                  {unreadCounts[item.id] > 99 ? '99+' : unreadCounts[item.id]}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        <View style={styles.cardRight}>
          <StatusBadge status={item.status} />
          <TouchableOpacity 
          style={styles.blockBtn}
          onPress={() => {
            const newStatus = item.status === 'Blocked' ? 'ACTIVE' : 'INACTIVE';
            const actionText = item.status === 'Blocked' ? 'Unblock' : 'Block';
            
            if (newStatus === 'INACTIVE') {
              setSelectedFarmer(item);
              setBlockReason('');
              setBlockUntilDate('');
              setIsBlockModalVisible(true);
            } else {
              Alert.alert(
                `${actionText} Farmer`,
                `Are you sure you want to ${actionText.toLowerCase()} this farmer?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: actionText, 
                    style: 'default',
                    onPress: async () => {
                      try {
                        await api.put(`/admin/farmers/${item.id}/unblock`);
                        fetchFarmers();
                      } catch (error) {
                        Alert.alert('Error', `Failed to ${actionText.toLowerCase()} farmer.`);
                      }
                    } 
                  }
                ]
              );
            }
          }}
        >
          <Text style={styles.blockBtnText}>{item.status === 'Blocked' ? 'Unblock' : 'Block'}</Text>
        </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
  return (
    <View style={styles.container}>
      <AdminHeader showBackButton />
      <View style={styles.headerArea}>
        <Text style={styles.screenTitle}>{route.params?.title || 'Users'}</Text>
        <View style={styles.userTypeToggle}>
          <TouchableOpacity 
            style={[styles.toggleBtn, userType === 'Farmers' && styles.activeToggleBtn]} 
            onPress={() => setUserType('Farmers')}
          >
            <Text style={[styles.toggleText, userType === 'Farmers' && styles.activeToggleText]}>Farmers</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, userType === 'Customers' && styles.activeToggleBtn]} 
            onPress={() => setUserType('Customers')}
          >
            <Text style={[styles.toggleText, userType === 'Customers' && styles.activeToggleText]}>Customers</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={userType === 'Farmers' ? 'Search farmers...' : 'Search customers...'}
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>
      <View style={styles.tabsContainer}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#F5C16C" />
        </View>
      ) : (
        <FlatList
          data={userType === 'Farmers' ? filteredFarmers : filteredCustomers}
          keyExtractor={item => userType === 'Farmers' ? item.id : item.customerId?.toString()}
          renderItem={userType === 'Farmers' ? renderItem : renderCustomerItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No {userType.toLowerCase()} found.</Text>
          }
        />
      )}

      <Modal
        visible={isBlockModalVisible}
        transparent={true}
        animationType="fade"
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Block Farmer</Text>
              <TouchableOpacity onPress={() => setIsBlockModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalDescription}>
              Please provide a reason for blocking {selectedFarmer?.name}. This reason will be shown to the farmer.
            </Text>

            <TextInput
              style={styles.reasonInput}
              placeholder="Enter block reason..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              value={blockReason}
              onChangeText={setBlockReason}
            />

            <Text style={styles.inputLabel}>Block Until Date (DD-MM-YYYY)</Text>
            <TextInput
              style={styles.dateInput}
              placeholder="e.g. 31-12-2026"
              placeholderTextColor="#9CA3AF"
              value={blockUntilDate}
              onChangeText={setBlockUntilDate}
              maxLength={10}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalCancelBtn]} 
                onPress={() => setIsBlockModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalBlockBtn, (!blockReason.trim() || !isValidBlockDate()) && { opacity: 0.5 }]}
                disabled={!blockReason.trim() || !isValidBlockDate()}
                onPress={async () => {
                  if (!selectedFarmer || !blockReason.trim() || !isValidBlockDate()) return;
                  try {
                    const days = calculateDurationDays();
                    await api.put(`/admin/farmers/${selectedFarmer.id}/block`, { 
                      reason: blockReason.trim(), 
                      durationDays: days 
                    });
                    setIsBlockModalVisible(false);
                    fetchFarmers();
                  } catch (error) {
                    Alert.alert('Error', 'Failed to block farmer.');
                  }
                }}
              >
                <Text style={styles.modalBlockBtnText}>Confirm Block</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F1E6' },
  headerArea: { padding: 16, paddingBottom: 8 },
  screenTitle: { fontSize: 18, fontWeight: 'bold', color: '#1B2430', marginBottom: 16 },
  userTypeToggle: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeToggleBtn: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeToggleText: {
    color: '#1B2430',
  },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 12, height: 44,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#1B2430' },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16 },
  tabButton: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 16, marginRight: 8, backgroundColor: '#FFFFFF' },
  activeTabButton: { backgroundColor: '#17212F' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  activeTabText: { color: '#F5C16C' },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  farmerCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5C16C', justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden' },
  profileImage: { width: '100%', height: '100%' },
  farmerName: { fontSize: 14, fontWeight: 'bold', color: '#1B2430', marginBottom: 2 },
  farmName: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  location: { fontSize: 10, color: '#9CA3AF' },
  cardRight: { alignItems: 'flex-end' },
  fab: {
    position: 'absolute', bottom: 24, right: 16, left: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#F5C16C', borderRadius: 12, paddingVertical: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  fabText: { fontSize: 14, fontWeight: 'bold', color: '#17212F', marginLeft: 8 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', color: '#6B7280', marginTop: 40 },
  blockBtn: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#F87171',
  },
  blockBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 16,
    lineHeight: 20,
  },
  reasonInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    height: 100,
    textAlignVertical: 'top',
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  dateInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  modalCancelBtn: {
    backgroundColor: '#F3F4F6',
  },
  modalCancelBtnText: {
    color: '#4B5563',
    fontWeight: '600',
  },
  modalBlockBtn: {
    backgroundColor: '#EF4444',
  },
  modalBlockBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
export default AdminFarmersScreen;

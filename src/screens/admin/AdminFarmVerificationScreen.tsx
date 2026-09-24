import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { AdminHeader } from '../../components/admin/AdminHeader';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getVerificationFarmers } from '../../services/adminService';

export const AdminFarmVerificationScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();
  const tabs = ['Pending', 'Verified', 'Rejected'];

  useFocusEffect(
    useCallback(() => {
      fetchFarmers();
    }, [])
  );

  const fetchFarmers = async () => {
    try {
      setLoading(true);
      const res = await getVerificationFarmers();
      if (res && res.data) {
        // Map AdminFarmVerificationListResponse to Verification item format
        const mapped = res.data.map((f: any) => {
          let mappedStatus = 'Pending';
          if (f.status === 'VERIFIED') mappedStatus = 'Verified';
          else if (f.status === 'REJECTED') mappedStatus = 'Rejected';
          
          return {
            id: f.farmerId,
            farmer: f.farmerName || 'Unknown',
            farm: f.farmName || 'Unnamed Farm',
            date: f.verificationRequestedOn ? new Date(f.verificationRequestedOn).toLocaleDateString() : 'Recent',
            status: mappedStatus
          };
        });
        setVerifications(mapped);
      }
    } catch (error) {
      console.error('Error fetching verification farmers', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVerifications = verifications.filter(v => {
    if (activeTab === 'Verified' && v.status !== 'Verified') return false;
    if (activeTab === 'Pending' && v.status !== 'Pending') return false;
    if (activeTab === 'Rejected' && v.status !== 'Rejected') return false;
    if (searchQuery && !v.farm.toLowerCase().includes(searchQuery.toLowerCase()) && !v.farmer.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });
  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.verificationCard} onPress={() => navigation.navigate('AdminFarmVerificationDetails', { verificationId: item.id })}>
      <View style={styles.cardLeft}>
        <View style={styles.imagePlaceholder}>
          <Ionicons name="leaf" size={28} color="#10B981" />
        </View>
        <View>
          <Text style={styles.farmName}>{item.farm}</Text>
          <Text style={styles.farmerName}>{item.farmer}</Text>
          <Text style={styles.date}>{item.date}</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <StatusBadge status={item.status} />
        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" style={styles.chevron} />
      </View>
    </TouchableOpacity>
  );
  return (
    <View style={styles.container}>
      <AdminHeader showBackButton />
      <View style={styles.headerArea}>
        <Text style={styles.screenTitle}>Farm Verification</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search farms..."
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
        <ActivityIndicator size="large" color="#F5C16C" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredVerifications}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 50, color: '#6B7280' }}>No farmers found.</Text>}
        />
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F1E6' },
  headerArea: { padding: 16, paddingBottom: 8 },
  screenTitle: { fontSize: 24, fontWeight: 'bold', color: '#1B2430', marginBottom: 16 },
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
  verificationCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center' },
  imagePlaceholder: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  farmName: { fontSize: 14, fontWeight: 'bold', color: '#1B2430', marginBottom: 4 },
  farmerName: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  date: { fontSize: 10, color: '#9CA3AF' },
  cardRight: { flexDirection: 'row', alignItems: 'center' },
  chevron: { marginLeft: 8 },
});
export default AdminFarmVerificationScreen;

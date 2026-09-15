import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Image, ActivityIndicator, Alert } from 'react-native';
import { AdminHeader } from '../../components/admin/AdminHeader';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { useNavigation } from '@react-navigation/native';
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
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();
  const tabs = ['All', 'Active', 'Pending', 'Blocked', 'Inactive'];
  useEffect(() => {
    fetchFarmers();
  }, []);
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
      }
    } catch (error) {
      console.error('Failed to fetch farmers:', error);
      Alert.alert('Error', 'Failed to fetch farmers from backend.');
    } finally {
      setLoading(false);
    }
  };
  const filteredFarmers = farmers.filter(f => {
    if (activeTab !== 'All' && f.status !== activeTab) return false;
    if (searchQuery && !f.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });
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
      <View style={styles.cardRight}>
        <StatusBadge status={item.status} />
      </View>
    </TouchableOpacity>
  );
  return (
    <View style={styles.container}>
      <AdminHeader />
      <View style={styles.headerArea}>
        <Text style={styles.screenTitle}>Farmers</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search farmers..."
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
          data={filteredFarmers}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No farmers found.</Text>
          }
        />
      )}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={24} color="#17212F" />
        <Text style={styles.fabText}>Add Farmer</Text>
      </TouchableOpacity>
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
});
export default AdminFarmersScreen;

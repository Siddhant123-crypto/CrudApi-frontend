import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { AdminHeader } from '../../components/admin/AdminHeader';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { useNavigation } from '@react-navigation/native';

const mockVerifications = [
  { id: '1', farmer: 'Rahul Patil', farm: 'Green Valley Farm', date: '03 Sep, 10:30 AM', status: 'Verified' },
  { id: '2', farmer: 'Amit Kumar', farm: 'Fresh Farm', date: '02 Sep, 09:15 AM', status: 'Pending' },
  { id: '3', farmer: 'Ravi Sharma', farm: 'Sharma Farm', date: '01 Sep, 04:20 PM', status: 'Rejected' },
  { id: '4', farmer: 'Suresh Yadav', farm: 'Yadav Farm', date: '31 Aug, 11:00 AM', status: 'Verified' },
];

export const AdminFarmVerificationScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation<any>();

  const tabs = ['All', 'Verified', 'Pending', 'Rejected'];

  const filteredVerifications = mockVerifications.filter(v => {
    if (activeTab !== 'All' && v.status !== activeTab) return false;
    if (searchQuery && !v.farm.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.verificationCard} onPress={() => navigation.navigate('AdminFarmVerificationDetails', { verificationId: item.id })}>
      <View style={styles.cardLeft}>
        <View style={styles.imagePlaceholder}>
          <Ionicons name="image-outline" size={24} color="#6B7280" />
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
      <AdminHeader />
      
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

      <FlatList
        data={filteredVerifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
  imagePlaceholder: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  farmName: { fontSize: 14, fontWeight: 'bold', color: '#1B2430', marginBottom: 4 },
  farmerName: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  date: { fontSize: 10, color: '#9CA3AF' },
  cardRight: { flexDirection: 'row', alignItems: 'center' },
  chevron: { marginLeft: 8 },
});

export default AdminFarmVerificationScreen;

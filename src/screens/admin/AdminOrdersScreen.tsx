import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { AdminHeader } from '../../components/admin/AdminHeader';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { useNavigation } from '@react-navigation/native';

const mockOrders = [
  { id: '#ORD-123', customer: 'Rahul Patil', amount: '₹850', date: '02 Sep, 2:30 PM', status: 'Delivered' },
  { id: '#ORD-122', customer: 'Sneha Sharma', amount: '₹650', date: '02 Sep, 11:15 AM', status: 'Processing' },
  { id: '#ORD-121', customer: 'Amit Kumar', amount: '₹1,250', date: '01 Sep, 5:40 PM', status: 'Pending' },
  { id: '#ORD-120', customer: 'Pooja Singh', amount: '₹430', date: '01 Sep, 1:20 PM', status: 'Cancelled' },
];

export const AdminOrdersScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation<any>();

  const tabs = ['All', 'Pending', 'Processing', 'Delivered', 'Cancelled'];

  const filteredOrders = mockOrders.filter(o => {
    if (activeTab !== 'All' && o.status !== activeTab) return false;
    if (searchQuery && !o.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.orderCard} onPress={() => navigation.navigate('AdminOrderDetails', { orderId: item.id })}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBg}>
            <Ionicons name="bag-handle-outline" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.orderId}>{item.id}</Text>
        </View>
        <Text style={styles.amount}>{item.amount}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.customer}>{item.customer}</Text>
        <View style={styles.contentRight}>
          <Text style={styles.date}>{item.date}</Text>
          <StatusBadge status={item.status} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <AdminHeader />
      
      <View style={styles.headerArea}>
        <Text style={styles.screenTitle}>Orders</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FlatList
        data={tabs}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
        keyExtractor={item => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.tabButton, activeTab === item && styles.activeTabButton]}
            onPress={() => setActiveTab(item)}
          >
            <Text style={[styles.tabText, activeTab === item && styles.activeTabText]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={filteredOrders}
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
  tabsContainer: { paddingHorizontal: 16, marginBottom: 16, maxHeight: 32 },
  tabButton: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 16, marginRight: 8, backgroundColor: '#FFFFFF', height: 32, justifyContent: 'center' },
  activeTabButton: { backgroundColor: '#17212F' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  activeTabText: { color: '#F5C16C' },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  orderCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBg: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#17212F', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  orderId: { fontSize: 16, fontWeight: 'bold', color: '#1B2430' },
  amount: { fontSize: 16, fontWeight: 'bold', color: '#17212F' },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  customer: { fontSize: 14, color: '#6B7280' },
  contentRight: { alignItems: 'flex-end' },
  date: { fontSize: 10, color: '#9CA3AF', marginBottom: 4 },
});

export default AdminOrdersScreen;

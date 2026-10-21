import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { ADMIN_THEME } from '../../constants/adminTheme';
import {
  AdminPageBackground,
  AdminHeader,
  AdminChip,
  AdminListRow,
  AdminEmptyState,
  AdminListSkeleton,
  UserIcon,
} from '../../components/admin';

export const AdminCustomersScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();
  const tabs = ['All', 'ACTIVE', 'INACTIVE', 'BLOCKED'];

  useEffect(() => {
    fetchCustomers();
  }, []);

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

  const filteredCustomers = customers.filter((c) => {
    if (activeTab !== 'All' && c.status !== activeTab) return false;
    if (searchQuery && !c.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const renderItem = ({ item }: { item: any }) => {
    const statusText =
      item.status === 'ACTIVE' ? 'Active' : item.status === 'BLOCKED' ? 'Blocked' : 'Inactive';
    const location = [item.state, item.village].filter(Boolean).join(', ');

    return (
      <AdminListRow
        title={item.name || 'Unknown'}
        subtitle={location || 'Customer account'}
        avatarText={item.name || 'U'}
        badgeStatus={statusText}
        onPress={() => navigation.navigate('AdminCustomerDetails', { customerId: item.customerId })}
      />
    );
  };

  return (
    <AdminPageBackground>
      <AdminHeader
        variant="tab"
        showBackButton={true}
        title="Customers"
        subtitle="Customer accounts management"
        showSearch={true}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search customers..."
      />

      {/* STATUS TABS */}
      <View style={styles.statusChipsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusChipsScroll}>
          {tabs.map((tab) => (
            <AdminChip
              key={tab}
              label={tab === 'All' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
              active={activeTab === tab}
              onPress={() => setActiveTab(tab)}
              style={styles.statusChip}
            />
          ))}
        </ScrollView>
      </View>

      {/* LIST OR SKELETON */}
      {loading ? (
        <AdminListSkeleton />
      ) : (
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item) => item.customerId?.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <AdminEmptyState
              icon={<UserIcon size={46} color={ADMIN_THEME.colors.indigo} strokeWidth={1.8} />}
              title="No customers found"
              subtitle={
                searchQuery
                  ? `No customers matching "${searchQuery}".`
                  : 'There are currently no customers in this status.'
              }
            />
          }
        />
      )}
    </AdminPageBackground>
  );
};

export default AdminCustomersScreen;

const styles = StyleSheet.create({
  statusChipsRow: {
    marginTop: 14,
    marginBottom: 10,
  },
  statusChipsScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  statusChip: {
    marginRight: 0,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 130,
  },
});

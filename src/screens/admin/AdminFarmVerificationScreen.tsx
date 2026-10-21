import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, ScrollView } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getVerificationFarmers } from '../../services/adminService';
import { ADMIN_THEME } from '../../constants/adminTheme';
import {
  AdminPageBackground,
  AdminHeader,
  AdminChip,
  AdminListRow,
  AdminEmptyState,
  AdminListSkeleton,
  ShieldCheckIcon,
} from '../../components/admin';

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
        const mapped = res.data.map((f: any) => {
          let mappedStatus = 'Pending';
          if (f.status === 'VERIFIED') mappedStatus = 'Verified';
          else if (f.status === 'REJECTED') mappedStatus = 'Rejected';

          return {
            id: f.farmerId,
            farmer: f.farmerName || 'Unknown',
            farm: f.farmName || 'Unnamed Farm',
            date: f.verificationRequestedOn
              ? new Date(f.verificationRequestedOn).toLocaleDateString()
              : 'Recent',
            status: mappedStatus,
            verifiedBy: f.verifiedBy,
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

  const filteredVerifications = verifications.filter((v) => {
    if (activeTab === 'Verified' && v.status !== 'Verified') return false;
    if (activeTab === 'Pending' && v.status !== 'Pending') return false;
    if (activeTab === 'Rejected' && v.status !== 'Rejected') return false;
    if (
      searchQuery &&
      !v.farm.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !v.farmer.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const renderItem = ({ item }: { item: any }) => {
    const subtitle = item.farmer ? `Farmer: ${item.farmer} • ${item.date}` : item.date;
    const metaText = item.status === 'Verified' && item.verifiedBy ? `✓ Verified by: ${item.verifiedBy}` : undefined;

    return (
      <AdminListRow
        title={item.farm}
        subtitle={subtitle}
        metaText={metaText}
        avatarText={item.farm}
        badgeStatus={item.status}
        onPress={() =>
          navigation.navigate('AdminFarmVerificationDetails', { verificationId: item.id })
        }
      />
    );
  };

  return (
    <AdminPageBackground>
      <AdminHeader
        variant="tab"
        showBackButton={true}
        title="Farm Verification"
        subtitle="Review and approve farm verification requests"
        showSearch={true}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search farms or farmers..."
      />

      {/* STATUS TABS */}
      <View style={styles.statusChipsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusChipsScroll}>
          {tabs.map((tab) => (
            <AdminChip
              key={tab}
              label={tab}
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
          data={filteredVerifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <AdminEmptyState
              icon={<ShieldCheckIcon size={46} color={ADMIN_THEME.colors.indigo} strokeWidth={1.8} />}
              title="No verification requests"
              subtitle={
                searchQuery
                  ? `No verification requests matching "${searchQuery}".`
                  : `There are currently no ${activeTab.toLowerCase()} verification requests.`
              }
            />
          }
        />
      )}
    </AdminPageBackground>
  );
};

export default AdminFarmVerificationScreen;

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

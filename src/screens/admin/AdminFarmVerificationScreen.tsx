import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View, StyleSheet, FlatList, ScrollView, Text } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getVerificationFarmers } from '../../services/adminService';
import { refreshFarmVerificationPendingCount } from '../../hooks/useFarmVerificationPendingCount';
import { ADMIN_THEME, AdminFonts } from '../../constants/adminTheme';
import {
  AdminPageBackground,
  AdminHeader,
  AdminChip,
  AdminListRow,
  AdminEmptyState,
  AdminListSkeleton,
  AdminBadge,
  ShieldCheckIcon,
} from '../../components/admin';

export const AdminFarmVerificationScreen: React.FC = () => {
  const { t } = useTranslation();
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
      refreshFarmVerificationPendingCount();
      const res = await getVerificationFarmers();
      if (res && res.data) {
        const mapped = res.data.map((f: any) => {
          let mappedStatus = 'Pending';
          if (f.status === 'VERIFIED') mappedStatus = 'Verified';
          else if (f.status === 'REJECTED') mappedStatus = 'Rejected';

          const submissionDate = f.lastSubmittedAt || f.verificationRequestedOn;

          return {
            id: f.farmerId,
            farmer: f.farmerName || 'Unknown',
            farm: f.farmName || 'Unnamed Farm',
            date: submissionDate
              ? new Date(submissionDate).toLocaleDateString()
              : 'Recent',
            status: mappedStatus,
            verifiedBy: f.verifiedBy,
            submissionType: f.submissionType || 'NEW',
            lastSubmittedAt: submissionDate,
          };
        });

        // Sort most recently submitted first
        mapped.sort((a: any, b: any) => {
          const aTime = a.lastSubmittedAt ? new Date(a.lastSubmittedAt).getTime() : 0;
          const bTime = b.lastSubmittedAt ? new Date(b.lastSubmittedAt).getTime() : 0;
          return bTime - aTime;
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
    const isUpdated = item.submissionType === 'UPDATED';

    return (
      <AdminListRow
        title={item.farm}
        subtitle={subtitle}
        metaText={metaText}
        avatarText={item.farm}
        rightElement={
          <View style={styles.badgeColumn}>
            <AdminBadge status={item.status} />
            {item.status === 'Pending' && (
              <View style={[styles.typeBadge, isUpdated ? styles.updatedBadge : styles.newBadge]}>
                <Text style={[styles.typeBadgeText, isUpdated ? styles.updatedBadgeText : styles.newBadgeText]}>
                  {isUpdated ? 'Updated' : 'New'}
                </Text>
              </View>
            )}
          </View>
        }
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
        title={t('admin.farmVerification', 'Farm Verification')}
        subtitle={t('admin.verificationSubtitle', 'Review and approve farm verification requests')}
        showSearch={true}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t('admin.searchProductFarmer', 'Search farms or farmers...')}
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
              title={t('admin.noVerificationRequests', 'No verification requests')}
              subtitle={
                searchQuery
                  ? t('admin.noVerificationDesc', `No verification requests matching "${searchQuery}".`)
                  : t('admin.noVerificationDesc', `There are currently no ${activeTab.toLowerCase()} verification requests.`)
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
  badgeColumn: {
    alignItems: 'flex-end',
    gap: 4,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  newBadge: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  updatedBadge: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FDBA74',
  },
  typeBadgeText: {
    fontFamily: AdminFonts.bold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  newBadgeText: {
    color: '#1D4ED8',
  },
  updatedBadgeText: {
    color: '#C2410C',
  },
});

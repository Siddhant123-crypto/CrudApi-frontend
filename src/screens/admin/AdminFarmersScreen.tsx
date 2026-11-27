import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import api, { hasActiveAuthToken, isAuthOrCanceledError } from '../../services/api';
import { ADMIN_THEME, AdminFonts } from '../../constants/adminTheme';
import { isValidBlockUntilDate, calculateBlockDurationDays } from '../../utils/blockDateUtils';
import {
  AdminPageBackground,
  AdminHeader,
  AdminChip,
  AdminListRow,
  AdminBadge,
  AdminEmptyState,
  AdminListSkeleton,
  AdminOutlineButton,
  AdminDangerButton,
  AdminInput,
  UsersIcon,
  ChatIcon,
  BanIcon,
  CheckIcon,
} from '../../components/admin';

interface Farmer {
  id: string;
  name: string;
  farm: string;
  location: string;
  status: string;
  profilePhoto?: string | null;
  isSelfDeactivated?: boolean;
  inactiveReason?: string | null;
  inactiveSince?: string | null;
  inactiveSource?: string | null;
  blockReason?: string | null;
}

export const AdminFarmersScreen: React.FC = () => {
  const { t } = useTranslation();
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

  useFocusEffect(
    useCallback(() => {
      if (initialTab) {
        setUserType('Farmers');
        setActiveTab(initialTab);
      }
    }, [initialTab])
  );

  const tabs = ['All', 'Active', 'Blocked', 'Inactive'];
  const [isBlockModalVisible, setIsBlockModalVisible] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [blockUntilDate, setBlockUntilDate] = useState('');
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);

  const isValidBlockDate = () => isValidBlockUntilDate(blockUntilDate);

  const showBlockDateError = blockUntilDate.trim().length > 0 && !isValidBlockDate();

  const calculateDurationDays = () => calculateBlockDurationDays(blockUntilDate);

  const fetchFarmers = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await api.get('/admin/farmers');
      if (response.data && response.data.data) {
        const mappedFarmers = response.data.data.map((f: any) => {
          const isBlocked = !!f.blockReason || !!f.blockedUntil;
          const isSelfDeactivated = (f.status === 'INACTIVE' || f.isActive === false) && !isBlocked;
          return {
            id: f.farmerId,
            name: f.name || 'Unknown Farmer',
            farm: f.farmName || 'No Farm Name',
            location: `${f.village || ''}, ${f.state || ''}`.replace(/^, | , $/g, '').trim(),
            status:
              f.status === 'ACTIVE' && f.isActive !== false
                ? 'Active'
                : f.status === 'PENDING'
                ? 'Pending'
                : isBlocked
                ? 'Blocked'
                : 'Inactive',
            isSelfDeactivated,
            inactiveReason: f.inactiveReason,
            inactiveSince: f.inactiveSince,
            inactiveSource: f.inactiveSource,
            blockReason: f.blockReason,
            profilePhoto: f.profilePhoto,
          };
        });
        setFarmers(mappedFarmers);
        if (!silent) fetchUnreadCounts();
      }
    } catch (error) {
      if (isAuthOrCanceledError(error)) return;
      if (!silent) {
        console.error('Failed to fetch farmers:', error);
        Alert.alert(t('common.error'), t('admin.failedFetchFarmers'));
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchUnreadCounts = async () => {
    if (!hasActiveAuthToken()) return;
    try {
      const countsRes = await api.get('/support/admin/unread-counts');
      if (countsRes.data && countsRes.data.data && countsRes.data.data.userCounts) {
        setUnreadCounts(countsRes.data.data.userCounts);
      }
    } catch (e) {
      if (isAuthOrCanceledError(e)) return;
      if (__DEV__) {
        console.log('Support unread counts poll skipped:', (e as any)?.message || e);
      }
    }
  };

  const fetchCustomers = async (silent = false) => {
    if (!hasActiveAuthToken()) return;
    try {
      if (!silent) setLoading(true);
      const res = await api.get('/admin/customers');
      if (res.data && res.data.data) {
        setCustomers(res.data.data);
      }
    } catch (error) {
      if (isAuthOrCanceledError(error)) return;
      console.error('Failed to fetch customers:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (userType === 'Farmers') {
        fetchFarmers();
        fetchCustomers(true);
        const interval = setInterval(() => {
          if (hasActiveAuthToken()) {
            fetchUnreadCounts();
          }
        }, 5000);
        return () => clearInterval(interval);
      } else {
        fetchCustomers();
        fetchFarmers(true);
      }
    }, [userType])
  );

  const filteredFarmers = farmers.filter((f) => {
    if (activeTab !== 'All' && f.status !== activeTab) return false;
    if (searchQuery && !f.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredCustomers = customers.filter((c) => {
    const statusMap: any = { ACTIVE: 'Active', BLOCKED: 'Blocked', INACTIVE: 'Inactive' };
    const normalizedStatus = statusMap[c.status] || 'Inactive';
    if (activeTab !== 'All' && normalizedStatus !== activeTab) return false;
    if (searchQuery && !c.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const renderFarmerItem = ({ item }: { item: Farmer }) => {
    return (
      <AdminListRow
        title={item.name}
        subtitle={item.isSelfDeactivated && item.inactiveReason ? `Reason: ${item.inactiveReason}` : item.farm}
        metaText={item.location}
        avatarText={item.name}
        avatarUri={item.profilePhoto ? item.profilePhoto : undefined}
        onPress={() => navigation.navigate('AdminFarmerDetails', { farmerId: item.id })}
        rightElement={
          <View style={styles.rowRightActions}>
            {/* 1) Status Pill matching Farmer Details */}
            <View
              style={[
                styles.statusPillWrapper,
                item.status === 'Blocked'
                  ? styles.statusBlockedShadow
                  : item.isSelfDeactivated
                  ? styles.statusBlockedShadow
                  : styles.statusActiveShadow,
              ]}
            >
              <LinearGradient
                colors={
                  item.status === 'Blocked'
                    ? ['#EF4444', '#DC2626']
                    : item.isSelfDeactivated
                    ? ['#F59E0B', '#D97706']
                    : item.status === 'Inactive'
                    ? ['#6B7280', '#4B5563']
                    : ['#10B981', '#059669']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.statusPillGradient}
              >
                <View style={styles.statusDotWhite} />
                <Text style={styles.statusTextWhite}>
                  {item.isSelfDeactivated
                    ? 'SELF-DEACTIVATED'
                    : item.status
                    ? item.status.toUpperCase()
                    : 'ACTIVE'}
                </Text>
              </LinearGradient>
            </View>

            {/* 2) Action Button Row (Block / Unblock / Activate / Chat) */}
            <View style={styles.actionButtonsRow}>
              {item.status === 'Blocked' && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    navigation.navigate('AdminSupportChatScreen', {
                      farmerId: item.id,
                      farmerName: item.name,
                    })
                  }
                  style={styles.chatButtonWrapper}
                >
                  <LinearGradient
                    colors={['#4F5BD5', '#3540AE']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.chatButtonGradient}
                  >
                    <Ionicons name="chatbubble-ellipses" size={17} color="#FFFFFF" />
                  </LinearGradient>
                  {unreadCounts[item.id] > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>
                        {unreadCounts[item.id] > 99 ? '99+' : unreadCounts[item.id]}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}

              {item.status === 'Blocked' ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.unblockButtonWrapper}
                  onPress={() => {
                    Alert.alert(
                      t('admin.unblockFarmer'),
                      t('admin.unblockFarmerConfirm'),
                      [
                        { text: t('common.cancel'), style: 'cancel' },
                        {
                          text: t('admin.unblock'),
                          style: 'default',
                          onPress: async () => {
                            try {
                              await api.put(`/admin/farmers/${item.id}/unblock`);
                              fetchFarmers();
                            } catch (error) {
                              Alert.alert(t('common.error'), t('admin.failedUnblockFarmer'));
                            }
                          },
                        },
                      ]
                    );
                  }}
                >
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionGradient}
                  >
                    <CheckIcon size={11} color="#FFFFFF" strokeWidth={2.4} />
                    <Text style={styles.actionGradientText}>{t('admin.unblock')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : item.isSelfDeactivated || item.status === 'Inactive' ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.unblockButtonWrapper}
                  onPress={() => {
                    Alert.alert(
                      t('admin.activateFarmer'),
                      t('admin.activateFarmerConfirm', { name: item.name }),
                      [
                        { text: t('common.cancel'), style: 'cancel' },
                        {
                          text: t('admin.activate'),
                          style: 'default',
                          onPress: async () => {
                            try {
                              await api.put(`/admin/farmers/${item.id}/activate`);
                              Alert.alert(t('common.success'), t('admin.farmerActivatedSuccess'));
                              fetchFarmers();
                            } catch (error) {
                              Alert.alert(t('common.error'), t('admin.failedActivateFarmer'));
                            }
                          },
                        },
                      ]
                    );
                  }}
                >
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionGradient}
                  >
                    <CheckIcon size={11} color="#FFFFFF" strokeWidth={2.4} />
                    <Text style={styles.actionGradientText}>{t('admin.activate')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.blockButtonWrapper}
                  onPress={() => {
                    setSelectedFarmer(item);
                    setBlockReason('');
                    setBlockUntilDate('');
                    setIsBlockModalVisible(true);
                  }}
                >
                  <LinearGradient
                    colors={['#FF4D4D', '#DC2626']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionGradient}
                  >
                    <BanIcon size={11} color="#FFFFFF" strokeWidth={2.4} />
                    <Text style={styles.actionGradientText}>{t('admin.block')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </View>
        }
      />
    );
  };

  const renderCustomerItem = ({ item }: { item: any }) => {
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

  const isBlockReady = Boolean(blockReason.trim()) && isValidBlockDate();

  return (
    <AdminPageBackground>
      {/* 1) THEMED ADMIN TAB HEADER */}
      <AdminHeader
        variant="tab"
        title="Users"
        subtitle="Manage farmers and customers"
        showSearch={true}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={userType === 'Farmers' ? 'Search farmers...' : 'Search customers...'}
      />

      {/* 2) ROLE CHIPS ROW */}
      <View style={styles.roleChipsRow}>
        <AdminChip
          label={t('admin.farmers')}
          count={farmers.length}
          active={userType === 'Farmers'}
          onPress={() => setUserType('Farmers')}
          style={styles.roleChip}
        />
        <AdminChip
          label={t('admin.customers')}
          count={customers.length}
          active={userType === 'Customers'}
          onPress={() => setUserType('Customers')}
          style={styles.roleChip}
        />
      </View>

      {/* 3) STATUS FILTER CHIPS */}
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

      {/* 4) LIST OR SKELETON */}
      {loading ? (
        <AdminListSkeleton />
      ) : (
        <FlatList
          data={userType === 'Farmers' ? filteredFarmers : filteredCustomers}
          keyExtractor={(item) => (userType === 'Farmers' ? item.id : item.customerId?.toString())}
          renderItem={userType === 'Farmers' ? (renderFarmerItem as any) : renderCustomerItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <AdminEmptyState
              icon={<UsersIcon size={46} color={ADMIN_THEME.colors.indigo} strokeWidth={1.8} />}
              title={`No ${userType.toLowerCase()} found`}
              subtitle={
                searchQuery
                  ? `No results matching "${searchQuery}". Try a different keyword.`
                  : `There are currently no ${userType.toLowerCase()} in this status tab.`
              }
            />
          }
        />
      )}

      {/* 5) BLOCK FARMER MODAL */}
      <Modal visible={isBlockModalVisible} transparent={true} animationType="fade">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <View style={styles.modalIconCircle}>
                    <BanIcon size={20} color="#DC2626" strokeWidth={2.4} />
                  </View>
                  <Text style={styles.modalTitle}>{t('admin.blockFarmer')}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIsBlockModalVisible(false)}
                  style={styles.modalCloseBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalDescription}>
                {t('admin.blockFarmerDesc', { name: selectedFarmer?.name || '' })}
              </Text>

              <AdminInput
                label={t('admin.blockReason')}
                required
                placeholder={t('admin.enterBlockReason')}
                multiline
                numberOfLines={4}
                value={blockReason}
                onChangeText={setBlockReason}
              />

              <AdminInput
                label={t('admin.blockUntilDate')}
                required
                placeholder={t('admin.egDate')}
                value={blockUntilDate}
                onChangeText={setBlockUntilDate}
                maxLength={16}
                autoCapitalize="none"
                autoCorrect={false}
                error={showBlockDateError ? t('admin.egDate') : undefined}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setIsBlockModalVisible(false)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.cancelGradient}
                  >
                    <Text style={styles.modalCancelBtnText}>{t('common.cancel')}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalConfirmBtn,
                    isBlockReady ? styles.modalConfirmBtnActive : styles.modalConfirmBtnFaint,
                  ]}
                  disabled={!isBlockReady}
                  activeOpacity={0.8}
                  onPress={async () => {
                    if (!selectedFarmer || !isBlockReady) return;
                    try {
                      const days = calculateDurationDays();
                      await api.put(`/admin/farmers/${selectedFarmer.id}/block`, {
                        reason: blockReason.trim(),
                        durationDays: days,
                      });
                      setIsBlockModalVisible(false);
                      fetchFarmers();
                    } catch (error) {
                      Alert.alert(t('common.error'), t('admin.failedBlockFarmer'));
                    }
                  }}
                >
                  <LinearGradient
                    key={isBlockReady ? 'btn-active' : 'btn-faint'}
                    colors={
                      isBlockReady
                        ? (['#EF4444', '#DC2626'] as const)
                        : (['#FEE2E2', '#FECACA'] as const)
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.confirmGradient,
                      !isBlockReady && styles.confirmGradientFaint,
                    ]}
                  >
                    <BanIcon
                      size={14}
                      color={isBlockReady ? '#FFFFFF' : '#DC2626'}
                      strokeWidth={2.4}
                    />
                    <Text
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                      style={[
                        styles.modalConfirmBtnText,
                        !isBlockReady && styles.modalConfirmBtnTextFaint,
                      ]}
                    >
                      {t('admin.confirmBlock')}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </AdminPageBackground>
  );
};

export default AdminFarmersScreen;

const styles = StyleSheet.create({
  roleChipsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 14,
    gap: 10,
  },
  roleChip: {
    flex: 1,
  },
  statusChipsRow: {
    marginTop: 12,
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
    paddingBottom: 130, // Section spec: nothing hides behind the floating bottom nav
  },
  rowRightActions: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 5,
  },
  statusPillWrapper: {
    borderRadius: 999,
  },
  statusActiveShadow: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 3,
    elevation: 2,
  },
  statusBlockedShadow: {
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 3,
    elevation: 2,
  },
  statusPillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 9.5,
    paddingVertical: 3.5,
    borderRadius: 999,
    gap: 5,
  },
  statusDotWhite: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  statusTextWhite: {
    fontFamily: AdminFonts.bold,
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chatButtonWrapper: {
    position: 'relative',
    borderRadius: 999,
    shadowColor: '#4F5BD5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.32,
    shadowRadius: 3,
    elevation: 3,
  },
  chatButtonGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    paddingHorizontal: 3,
    zIndex: 10,
    elevation: 4,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: AdminFonts.bold,
  },
  blockButtonWrapper: {
    borderRadius: 999,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 3,
    elevation: 2,
  },
  unblockButtonWrapper: {
    borderRadius: 999,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 3,
    elevation: 2,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 11,
    paddingVertical: 4.5,
    borderRadius: 999,
    gap: 4,
  },
  actionGradientText: {
    fontFamily: AdminFonts.bold,
    fontSize: 10.5,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 19, 38, 0.72)',
    justifyContent: 'center',
    padding: 20,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.18)',
    ...ADMIN_THEME.shadows.card,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  modalIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: AdminFonts.heading,
    fontSize: 20,
    color: ADMIN_THEME.colors.ink,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDescription: {
    fontFamily: AdminFonts.regular,
    fontSize: 13,
    color: ADMIN_THEME.colors.textSecondary,
    marginBottom: 16,
    lineHeight: 19,
  },
  farmerHighlightText: {
    fontFamily: AdminFonts.bold,
    color: ADMIN_THEME.colors.ink,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
  },
  cancelGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  modalCancelBtnText: {
    fontFamily: AdminFonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  modalConfirmBtn: {
    flex: 1.25,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
  },
  modalConfirmBtnActive: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 5,
    elevation: 5,
  },
  modalConfirmBtnFaint: {
    backgroundColor: '#FEE2E2',
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    gap: 6,
  },
  confirmGradientFaint: {
    borderWidth: 1.2,
    borderColor: '#FCA5A5',
    borderRadius: 14,
  },
  modalConfirmBtnText: {
    fontFamily: AdminFonts.bold,
    fontSize: 13.5,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  modalConfirmBtnTextFaint: {
    color: '#DC2626',
  },
});

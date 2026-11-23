import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Platform,
  Modal,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import api, { BASE_URL } from '../../services/api';
import { ADMIN_THEME, AdminFonts } from '../../constants/adminTheme';
import {
  AdminPageBackground,
  AdminHeader,
  AdminCard,
  AdminBadge,
  AdminOutlineButton,
  AdminDangerButton,
  AdminInput,
  ChatIcon,
  PhoneIcon,
  MailIcon,
  LocationIcon,
  UserIcon,
  BanIcon,
} from '../../components/admin';

export const AdminFarmerDetailsScreen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { farmerId } = route.params;
  const [loading, setLoading] = useState(true);
  const [farmer, setFarmer] = useState<any>(null);
  const [sales, setSales] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isBlockModalVisible, setIsBlockModalVisible] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [blockUntilDate, setBlockUntilDate] = useState('');

  const parseDateFromDDMMYYYY = (dateStr: string) => {
    const parts = dateStr.trim().split(/[-/]/);
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      if (!isNaN(d) && !isNaN(m) && !isNaN(y) && m >= 0 && m <= 11 && d >= 1 && d <= 31 && y > 1900) {
        return new Date(y, m, d, 0, 0, 0, 0);
      }
    }
    return new Date('invalid');
  };

  const isValidBlockDate = () => {
    const trimmed = blockUntilDate.trim();
    const regex = /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/;
    if (!regex.test(trimmed)) return false;
    const targetDate = parseDateFromDDMMYYYY(trimmed);
    if (isNaN(targetDate.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return targetDate.getTime() > today.getTime();
  };

  const calculateDurationDays = () => {
    const targetDate = parseDateFromDDMMYYYY(blockUntilDate.trim());
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  useEffect(() => {
    fetchFarmerData();
  }, [farmerId]);

  const fetchFarmerData = async () => {
    try {
      setLoading(true);
      const [farmerRes, salesRes, productsRes, ordersRes] = await Promise.allSettled([
        api.get(`/admin/farmers/${farmerId}`),
        api.get(`/admin/farmers/${farmerId}/sales`),
        api.get(`/admin/products/farmer/${farmerId}`),
        api.get(`/admin/orders/farmer/${farmerId}`),
      ]);
      if (farmerRes.status === 'fulfilled' && farmerRes.value.data?.data) {
        setFarmer(farmerRes.value.data.data);
      }
      if (salesRes.status === 'fulfilled' && salesRes.value.data?.data) {
        setSales(salesRes.value.data.data);
      }
      if (productsRes.status === 'fulfilled' && productsRes.value.data?.data) {
        setProducts(productsRes.value.data.data);
      }
      if (ordersRes.status === 'fulfilled' && ordersRes.value.data?.data) {
        setOrders(ordersRes.value.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch farmer details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProfileImage = () => {
    if (farmer?.profilePhoto) {
      if (farmer.profilePhoto.startsWith('http')) {
        return farmer.profilePhoto;
      }
      return `${BASE_URL}/user/image/${farmer.profilePhoto}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(farmer?.name || 'Unknown')}&background=E8EBFF&color=4F5BD5&size=150&bold=true`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getProductImage = (item: any) => {
    if (item.productPhoto) {
      if (item.productPhoto.startsWith('http')) {
        return item.productPhoto;
      }
      return `${BASE_URL}/product/image/${item.productPhoto}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(item.productName || 'Product')}&background=F4F6FB&color=4F5BD5`;
  };

  const renderProductItem = ({ item }: { item: any }) => (
    <View style={styles.productCard}>
      <Image source={{ uri: getProductImage(item) }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>
          {item.productName}
        </Text>
        <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
      </View>
    </View>
  );

  const renderOrderItem = ({ item }: { item: any }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Order #{item.orderId?.substring(0, 8)}</Text>
        <AdminBadge status={item.orderStatus} />
      </View>
      <Text style={styles.customerName}>Customer: {item.customerName || 'Unknown'}</Text>
      <View style={styles.orderBottomRow}>
        <Text style={styles.orderAmount}>Total: {formatCurrency(item.totalAmount)}</Text>
        <Text style={styles.orderDate}>{new Date(item.orderDate).toLocaleDateString()}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <AdminPageBackground>
        <AdminHeader variant="inner" title={t('admin.farmerDetails')} />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={ADMIN_THEME.colors.indigo} />
        </View>
      </AdminPageBackground>
    );
  }

  if (!farmer) {
    return (
      <AdminPageBackground>
        <AdminHeader variant="inner" title={t('admin.farmerDetails')} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('admin.farmerNotFound')}</Text>
        </View>
      </AdminPageBackground>
    );
  }

  const isBlocked = Boolean(farmer.blockReason || farmer.blockedUntil || farmer.status === 'BLOCKED' || farmer.status === 'Blocked');
  const isSelfDeactivated = !isBlocked && (farmer.status === 'INACTIVE' || farmer.status === 'Inactive' || farmer.isActive === false || farmer.inactiveSource === 'SELF_DEACTIVATION');
  const isBlockReady = Boolean(blockReason.trim()) && isValidBlockDate();

  return (
    <AdminPageBackground>
      <AdminHeader
        variant="inner"
        title={t('admin.farmerDetails')}
        titleAlign="left"
        titleStyle={styles.headerTitle}
        rightAction={
          <TouchableOpacity
            style={styles.headerChatBtn}
            onPress={() =>
              navigation.navigate('AdminMessage', {
                preSelectedUserEmail: farmer.email,
                preSelectedUserName: farmer.name,
                preSelectedRole: 'FARMER',
              })
            }
          >
            <ChatIcon size={20} color={ADMIN_THEME.colors.gold} strokeWidth={2} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 70 },
        ]}
      >
        {/* 1) PROFILE ADMIN CARD */}
        <AdminCard style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: getProfileImage() }} style={styles.profileImage} />
          </View>
          <Text style={styles.farmerName}>{farmer.name}</Text>
          <Text style={styles.farmerEmail}>{farmer.email || t('admin.noEmailRegistered')}</Text>
          {farmer.farmName ? <Text style={styles.farmNameText}>{farmer.farmName}</Text> : null}

          <View style={styles.profileBadgeAndActionRow}>
            {/* Highlighted Status Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                if (isBlocked) {
                  Alert.alert(
                    t('admin.blockedByAdmin'),
                    t('admin.farmerBlockedDesc', { reason: farmer.blockReason || t('admin.policyViolation') }),
                    [{ text: t('common.ok'), style: 'default' }]
                  );
                } else if (isSelfDeactivated) {
                  Alert.alert(
                    t('admin.selfDeactivatedTitle'),
                    t('admin.selfDeactivatedDesc', {
                      reason: farmer.inactiveReason || t('admin.noReasonSpecified'),
                      since: farmer.inactiveSince ? new Date(farmer.inactiveSince).toLocaleString() : 'N/A',
                    }),
                    [{ text: t('common.ok'), style: 'default' }]
                  );
                } else {
                  Alert.alert(
                    t('admin.farmerActive'),
                    t('admin.farmerActiveDesc'),
                    [{ text: t('common.ok'), style: 'default' }]
                  );
                }
              }}
              style={[
                styles.statusWrapper,
                farmer.status === 'ACTIVE'
                  ? styles.activeShadow
                  : isBlocked
                  ? styles.blockShadow
                  : styles.pendingShadow,
              ]}
            >
              <LinearGradient
                colors={
                  farmer.status === 'ACTIVE'
                    ? ['#10B981', '#059669']
                    : isBlocked
                    ? ['#EF4444', '#DC2626']
                    : isSelfDeactivated
                    ? ['#F59E0B', '#D97706']
                    : ['#6B7280', '#4B5563']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.statusIndicatorGradient}
              >
                <View style={styles.statusIndicatorDotWhite} />
                <Text style={styles.statusIndicatorTextWhite}>
                  {farmer.status === 'ACTIVE'
                    ? t('status.active')
                    : isBlocked
                    ? t('status.blocked')
                    : isSelfDeactivated
                    ? t('status.selfDeactivated')
                    : farmer.status || t('status.inactive')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Block / Unblock / Activate Action Buttons */}
            {isBlocked ? (
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.actionButtonWrapper, styles.unblockShadow]}
                onPress={() => {
                  Alert.alert(t('admin.unblockFarmer'), t('admin.unblockFarmerConfirm'), [
                    { text: t('common.cancel'), style: 'cancel' },
                    {
                      text: t('admin.unblock'),
                      style: 'default',
                      onPress: async () => {
                        try {
                          await api.put(`/admin/farmers/${farmer.farmerId || farmer.id}/unblock`);
                          fetchFarmerData();
                        } catch (error) {
                          Alert.alert(t('common.error'), t('admin.failedUnblockFarmer'));
                        }
                      },
                    },
                  ]);
                }}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionButtonGradient}
                >
                  <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>{t('admin.unblockFarmer')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : isSelfDeactivated ? (
              <View style={styles.selfDeactivatedActionsRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.actionButtonWrapper, styles.unblockShadow]}
                  onPress={() => {
                    Alert.alert(
                      t('admin.activateFarmer'),
                      t('admin.activateFarmerConfirm', { name: farmer.name }),
                      [
                        { text: t('common.cancel'), style: 'cancel' },
                        {
                          text: t('admin.activate'),
                          style: 'default',
                          onPress: async () => {
                            try {
                              await api.put(`/admin/farmers/${farmer.farmerId || farmer.id}/activate`);
                              Alert.alert(t('common.success'), t('admin.farmerActivatedSuccess'));
                              fetchFarmerData();
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
                    style={styles.actionButtonGradient}
                  >
                    <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>{t('admin.activateFarmer')}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.actionButtonWrapper, styles.blockShadow]}
                  onPress={() => {
                    setBlockReason('');
                    setBlockUntilDate('');
                    setIsBlockModalVisible(true);
                  }}
                >
                  <LinearGradient
                    colors={['#EF4444', '#DC2626']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionButtonGradient}
                  >
                    <Ionicons name="ban-outline" size={15} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>{t('admin.block')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.actionButtonWrapper, styles.blockShadow]}
                onPress={() => {
                  setBlockReason('');
                  setBlockUntilDate('');
                  setIsBlockModalVisible(true);
                }}
              >
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionButtonGradient}
                >
                  <Ionicons name="ban-outline" size={15} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>{t('admin.blockFarmer')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </AdminCard>

        {/* SELF-DEACTIVATION DETAILS CARD */}
        {(isSelfDeactivated || farmer.inactiveReason) && (
          <AdminCard style={styles.deactivationCard}>
            <View style={styles.deactivationHeaderRow}>
              <Ionicons name="information-circle" size={22} color="#D97706" />
              <Text style={styles.deactivationCardTitle}>{t('admin.selfDeactivationDetails')}</Text>
            </View>
            <View style={styles.deactivationBody}>
              <Text style={styles.deactivationLabel}>{t('admin.reasonGivenByFarmer')}</Text>
              <View style={styles.deactivationReasonBox}>
                <Text style={styles.deactivationReasonText}>
                  {farmer.inactiveReason || t('admin.noReasonSpecified')}
                </Text>
              </View>
              {farmer.inactiveSince && (
                <View style={styles.deactivationMetaRow}>
                  <Text style={styles.deactivationMetaLabel}>{t('admin.deactivatedAt')}</Text>
                  <Text style={styles.deactivationMetaValue}>
                    {new Date(farmer.inactiveSince).toLocaleString()}
                  </Text>
                </View>
              )}
              <View style={styles.deactivationMetaRow}>
                <Text style={styles.deactivationMetaLabel}>{t('admin.eventSource')}</Text>
                <Text style={styles.deactivationMetaValue}>
                  {farmer.inactiveSource || 'SELF_DEACTIVATION'}
                </Text>
              </View>
              <View style={styles.deactivationNoticeBanner}>
                <Ionicons name="alert-circle-outline" size={16} color="#B45309" />
                <Text style={styles.deactivationNoticeText}>
                  {t('admin.farmerProductsHidden')}
                </Text>
              </View>
            </View>
          </AdminCard>
        )}

        {/* 2) FULL INFORMATION */}
        <AdminCard style={styles.infoCard}>
          <Text style={styles.sectionTitle}>{t('admin.fullInformation')}</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <UserIcon size={18} color={ADMIN_THEME.colors.indigo} strokeWidth={2} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>{t('common.name')}</Text>
              <Text style={styles.infoValue}>{farmer.name || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <MailIcon size={18} color={ADMIN_THEME.colors.indigo} strokeWidth={2} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>{t('common.email')}</Text>
              <Text style={styles.infoValue}>{farmer.email || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <PhoneIcon size={18} color={ADMIN_THEME.colors.indigo} strokeWidth={2} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>{t('admin.phoneNumber')}</Text>
              <Text style={styles.infoValue}>{farmer.mobile || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <LocationIcon size={18} color={ADMIN_THEME.colors.indigo} strokeWidth={2} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>{t('common.address')}</Text>
              <Text style={styles.infoValue}>{farmer.address || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <LocationIcon size={18} color={ADMIN_THEME.colors.indigo} strokeWidth={2} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>{t('admin.stateAndVillage')}</Text>
              <Text style={styles.infoValue}>
                {[farmer.village, farmer.state].filter(Boolean).join(', ') || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRowLast}>
            <View style={styles.infoIconBox}>
              <LocationIcon size={18} color={ADMIN_THEME.colors.indigo} strokeWidth={2} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>{t('admin.pincode')}</Text>
              <Text style={styles.infoValue}>{farmer.postalCode || 'N/A'}</Text>
            </View>
          </View>
        </AdminCard>

        {/* 3) SALES STATISTICS */}
        <AdminCard style={styles.statsCard}>
          <Text style={styles.sectionTitle}>{t('admin.salesStatistics')}</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{products.length}</Text>
              <Text style={styles.statLabel}>{t('admin.totalProducts')}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{sales?.totalProductsSold || 0}</Text>
              <Text style={styles.statLabel}>{t('admin.productsSold')}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{sales?.totalOrders || 0}</Text>
              <Text style={styles.statLabel}>{t('admin.totalOrders')}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{formatCurrency(sales?.totalRevenue || 0)}</Text>
              <Text style={styles.statLabel}>{t('admin.revenue')}</Text>
            </View>
          </View>
        </AdminCard>

        {/* 4) PRODUCTS CATALOG */}
        <AdminCard style={styles.catalogCard}>
          <Text style={styles.sectionTitle}>{t('admin.productsCatalog')}</Text>
          {products.length > 0 ? (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={products}
              keyExtractor={(item) => item.productId}
              renderItem={renderProductItem}
              contentContainerStyle={{ paddingVertical: 6 }}
            />
          ) : (
            <Text style={styles.emptyTextSmall}>{t('admin.noProductsListedByFarmer')}</Text>
          )}
        </AdminCard>

        {/* 5) RECENT ORDERS */}
        <AdminCard style={styles.ordersCard}>
          <Text style={styles.sectionTitle}>{t('admin.recentOrders')}</Text>
          {orders.length > 0 ? (
            orders.slice(0, 5).map((order) => (
              <React.Fragment key={order.orderId}>
                {renderOrderItem({ item: order })}
              </React.Fragment>
            ))
          ) : (
            <Text style={styles.emptyTextSmall}>No orders yet.</Text>
          )}
        </AdminCard>
      </ScrollView>

      {/* BLOCK MODAL */}
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
                {t('admin.blockFarmerDesc', { name: farmer?.name })}
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
                maxLength={10}
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
                    if (!farmer || !isBlockReady) return;
                    try {
                      const days = calculateDurationDays();
                      await api.put(`/admin/farmers/${farmer.farmerId || farmer.id}/block`, {
                        reason: blockReason.trim(),
                        durationDays: days,
                      });
                      setIsBlockModalVisible(false);
                      fetchFarmerData();
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

export default AdminFarmerDetailsScreen;

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontFamily: AdminFonts.medium,
    color: ADMIN_THEME.colors.textSecondary,
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 19.5,
    lineHeight: 25,
  },
  headerChatBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 14,
  },

  // 1) Profile Card
  profileCard: {
    alignItems: 'center',
    paddingVertical: 22,
    paddingHorizontal: 16,
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: ADMIN_THEME.colors.indigoTint,
    ...ADMIN_THEME.shadows.card,
    marginBottom: 12,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  farmerName: {
    fontFamily: AdminFonts.heading,
    fontSize: 17.5,
    lineHeight: 23,
    color: ADMIN_THEME.colors.ink,
    textAlign: 'center',
  },
  farmerEmail: {
    marginTop: 3,
    fontFamily: AdminFonts.regular,
    fontSize: 13,
    color: ADMIN_THEME.colors.textSecondary,
    textAlign: 'center',
  },
  farmNameText: {
    marginTop: 2,
    fontFamily: AdminFonts.semiBold,
    fontSize: 13,
    color: ADMIN_THEME.colors.indigo,
    textAlign: 'center',
  },
  profileBadgeAndActionRow: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    rowGap: 10,
    columnGap: 10,
    width: '100%',
    paddingHorizontal: 4,
  },
  selfDeactivatedActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    rowGap: 8,
    columnGap: 10,
    width: '100%',
  },
  statusWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  activeShadow: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  pendingShadow: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  statusIndicatorGradient: {
    height: 36,
    paddingHorizontal: 13,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statusIndicatorDotWhite: {
    width: 6.5,
    height: 6.5,
    borderRadius: 3.25,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  statusIndicatorTextWhite: {
    fontFamily: AdminFonts.bold,
    fontSize: 11.5,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  actionButtonWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  blockShadow: {
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  unblockShadow: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonGradient: {
    height: 36,
    paddingHorizontal: 13,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  actionButtonText: {
    fontFamily: AdminFonts.semiBold,
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  actionBtnCompact: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: ADMIN_THEME.radius.pill,
  },

  // 2) Information Card
  infoCard: {
    padding: 16,
  },
  sectionTitle: {
    fontFamily: AdminFonts.heading,
    fontSize: 18,
    color: ADMIN_THEME.colors.ink,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: ADMIN_THEME.colors.divider,
  },
  infoRowLast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: ADMIN_THEME.colors.indigoTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontFamily: AdminFonts.regular,
    fontSize: 11.5,
    color: ADMIN_THEME.colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontFamily: AdminFonts.semiBold,
    fontSize: 13.5,
    color: ADMIN_THEME.colors.ink,
  },

  // 3) Statistics Card
  statsCard: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statBox: {
    width: '48%',
    backgroundColor: ADMIN_THEME.colors.inputBg,
    borderRadius: ADMIN_THEME.radius.input,
    padding: 14,
    borderWidth: 1,
    borderColor: ADMIN_THEME.colors.cardBorder,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: AdminFonts.heading,
    fontSize: 20,
    color: ADMIN_THEME.colors.ink,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: AdminFonts.medium,
    fontSize: 11.5,
    color: ADMIN_THEME.colors.textSecondary,
    textAlign: 'center',
  },

  // 4) Catalog Card
  catalogCard: {
    padding: 16,
  },
  productCard: {
    width: 140,
    marginRight: 12,
    backgroundColor: ADMIN_THEME.colors.inputBg,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ADMIN_THEME.colors.cardBorder,
  },
  productImage: {
    width: '100%',
    height: 90,
    backgroundColor: '#E5E7EB',
  },
  productInfo: {
    padding: 8,
  },
  productName: {
    fontFamily: AdminFonts.bold,
    fontSize: 13,
    color: ADMIN_THEME.colors.ink,
  },
  productPrice: {
    marginTop: 2,
    fontFamily: AdminFonts.bold,
    fontSize: 12.5,
    color: ADMIN_THEME.colors.indigo,
  },

  // 5) Orders Card
  ordersCard: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: ADMIN_THEME.colors.inputBg,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: ADMIN_THEME.colors.cardBorder,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderId: {
    fontFamily: AdminFonts.bold,
    fontSize: 13,
    color: ADMIN_THEME.colors.ink,
  },
  customerName: {
    fontFamily: AdminFonts.regular,
    fontSize: 12,
    color: ADMIN_THEME.colors.textSecondary,
    marginBottom: 4,
  },
  orderBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  orderAmount: {
    fontFamily: AdminFonts.bold,
    fontSize: 13,
    color: ADMIN_THEME.colors.ink,
  },
  orderDate: {
    fontFamily: AdminFonts.regular,
    fontSize: 11,
    color: ADMIN_THEME.colors.muted,
  },
  emptyTextSmall: {
    fontFamily: AdminFonts.regular,
    fontSize: 13,
    color: ADMIN_THEME.colors.textSecondary,
    marginVertical: 10,
  },

  // Modal
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
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 5,
    elevation: 5,
  },
  modalConfirmBtnFaint: {
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmGradient: {
    flex: 1,
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
  deactivationCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    marginBottom: 16,
  },
  deactivationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  deactivationCardTitle: {
    fontSize: 16,
    fontFamily: AdminFonts.bold,
    color: '#92400E',
  },
  deactivationBody: {
    gap: 8,
  },
  deactivationLabel: {
    fontSize: 13,
    fontFamily: AdminFonts.semiBold,
    color: '#78350F',
  },
  deactivationReasonBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  deactivationReasonText: {
    fontSize: 14,
    color: '#1F2937',
    fontFamily: AdminFonts.regular,
    lineHeight: 20,
  },
  deactivationMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  deactivationMetaLabel: {
    fontSize: 12.5,
    fontFamily: AdminFonts.medium,
    color: '#78350F',
  },
  deactivationMetaValue: {
    fontSize: 12.5,
    fontFamily: AdminFonts.semiBold,
    color: '#92400E',
  },
  deactivationNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  deactivationNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    fontFamily: AdminFonts.medium,
  },
});

import React, { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
  StatusBar,
  AppState,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { getAdminDashboardSummary } from '../../services/adminService';
import { hasActiveAuthToken, isAuthOrCanceledError } from '../../services/api';
import { normalizeDashboardSummary, NormalizedAdminDashboardData } from '../../utils/adminDashboardUtils';
import { refreshFarmVerificationPendingCount } from '../../hooks/useFarmVerificationPendingCount';
import { ADMIN_THEME } from '../../constants/adminTheme';
import { AdminPageBackground } from '../../components/admin/AdminPageBackground';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { RevenueCard } from '../../components/admin/RevenueCard';
import { StatCard } from '../../components/admin/StatCard';
import { OrderStatusCard } from '../../components/admin/OrderStatusCard';
import { AdminSectionHeader } from '../../components/admin/AdminSectionHeader';
import { RecentOrderRow, OrderItemData } from '../../components/admin/RecentOrderRow';
import { QuickActionTile } from '../../components/admin/QuickActionTile';
import { CalendarIcon, HeadsetIcon } from '../../components/admin/AdminIcons';

export const AdminDashboardScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { width: screenWidth } = useWindowDimensions();
  const { user } = useAuth();
  const { adminSupportUnreadCount, adminSupportUnassignedCount } = useNotification();

  const [refreshing, setRefreshing] = useState(false);
  const [periodIndex, setPeriodIndex] = useState(0);
  const periods = ['This month', 'Last month', 'This year'];

  const [dashboardData, setDashboardData] = useState<NormalizedAdminDashboardData>({
    totalFarmers: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    recentOrders: [],
  });
  const fetchInFlightRef = useRef<Promise<void> | null>(null);

  const fetchData = useCallback(async () => {
    if (!hasActiveAuthToken()) return;
    if (fetchInFlightRef.current) {
      return fetchInFlightRef.current;
    }

    const request = (async () => {
      try {
        refreshFarmVerificationPendingCount();
        const res = await getAdminDashboardSummary();
        if (res && res.data) {
          setDashboardData(normalizeDashboardSummary(res.data));
        }
      } catch (error) {
        if (isAuthOrCanceledError(error)) return;
        console.error('Error fetching admin dashboard summary:', error);
      } finally {
        fetchInFlightRef.current = null;
      }
    })();

    fetchInFlightRef.current = request;
    return request;
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();

      // Keep Admin dashboard synced while open if farmers, customers, products, or orders change
      const pollInterval = setInterval(() => {
        if (hasActiveAuthToken()) {
          fetchData();
        }
      }, 10000);

      const appStateSub = AppState.addEventListener('change', (nextState) => {
        if (nextState === 'active' && hasActiveAuthToken()) {
          fetchData();
        }
      });

      return () => {
        clearInterval(pollInterval);
        appStateSub.remove();
      };
    }, [fetchData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handlePeriodPress = () => {
    setPeriodIndex((prev) => (prev + 1) % periods.length);
  };

  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Calculate card width for 2-column main stat cards: (screenWidth - 32 padding - 10 gap) / 2
  const statCardWidth = (screenWidth - 32 - 10) / 2;

  // Real recent orders from backend GET /admin/dashboard (never hardcoded mock data)
  const recentOrders: OrderItemData[] = (dashboardData.recentOrders || []).map((o: any, idx: number) => ({
    id: String(o.orderId || o.id || idx),
    orderNumber: o.orderNumber
      ? (String(o.orderNumber).startsWith('#') ? String(o.orderNumber) : `#${o.orderNumber}`)
      : `#${String(o.orderId || '').substring(0, 8)}`,
    customerName: o.customerName || 'Customer',
    amount: `₹${Number(o.totalAmount || 0).toLocaleString('en-IN')}`,
    status: String(o.status || 'PENDING').toUpperCase() as any,
  }));

  const adminName = user?.name ? user.name : 'Admin';

  return (
    <AdminPageBackground>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4F5BD5']}
            tintColor="#4F5BD5"
          />
        }
      >
        {/* 1) HEADER (scrolls with content) */}
        <AdminHeader variant="dashboard" />

        {/* 2) CONTENT AREA: horizontal padding 16 */}
        <View style={styles.contentArea}>
          {/* 3) GREETING AND TOP CHIPS */}
          <View style={styles.greetingSection}>
            <Text style={styles.greetingTitle} numberOfLines={1}>
              Hello, {adminName}
            </Text>
            <Text style={styles.greetingSubtitle} numberOfLines={1}>
              Here's what's happening today
            </Text>

            <View style={styles.chipsRow}>
              {/* a) Date chip */}
              <View style={styles.dateChip}>
                <CalendarIcon size={16} color={ADMIN_THEME.colors.indigo} strokeWidth={1.9} />
                <Text style={styles.dateText}>{currentDate}</Text>
              </View>

              {/* b) Support button */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.supportButtonShadow}
                onPress={() => navigation.navigate('AdminSupportInbox')}
              >
                <LinearGradient
                  colors={ADMIN_THEME.colors.goldButtonGradient}
                  start={{ x: 0.2, y: 0 }}
                  end={{ x: 0.8, y: 1 }}
                  style={styles.supportButtonGradient}
                >
                  <HeadsetIcon size={16} color={ADMIN_THEME.colors.ink} strokeWidth={2} />
                  <Text style={styles.supportText}>{t('admin.support', 'Support')}</Text>
                  {(adminSupportUnreadCount > 0 || adminSupportUnassignedCount > 0) && (
                    <View style={styles.supportBadge}>
                      <Text style={styles.supportBadgeText}>
                        {adminSupportUnreadCount + adminSupportUnassignedCount > 99
                          ? '99+'
                          : adminSupportUnreadCount + adminSupportUnassignedCount}
                      </Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* 4) REVENUE CARD (hero) */}
          <RevenueCard
            revenue={
              typeof dashboardData.totalRevenue === 'number'
                ? `₹${dashboardData.totalRevenue.toLocaleString('en-IN')}`
                : dashboardData.totalRevenue || '₹0'
            }
            period={periods[periodIndex]}
            onPeriodPress={handlePeriodPress}
            growthText={`${dashboardData.completedOrders ?? 0} ${t('orders.statusDelivered', 'Delivered')}`}
            isGrowthPositive={true}
          />

          {/* 5) MAIN STAT CARDS (2 x 2 grid) */}
          <View style={styles.mainStatsGrid}>
            <StatCard
              title={t('admin.farmers', 'Farmers')}
              value={dashboardData.totalFarmers ?? 0}
              type="farmers"
              cardWidth={statCardWidth}
              onPress={() => navigation.navigate('AdminFarmers')}
            />
            <StatCard
              title={t('admin.customers', 'Customers')}
              value={dashboardData.totalCustomers ?? 0}
              type="customers"
              cardWidth={statCardWidth}
              onPress={() => navigation.navigate('AdminCustomers')}
            />
            <StatCard
              title={t('admin.allProducts', 'Products')}
              value={dashboardData.totalProducts ?? 0}
              type="products"
              cardWidth={statCardWidth}
              onPress={() => navigation.navigate('AdminProducts')}
            />
            <StatCard
              title={t('admin.allOrders', 'Orders')}
              value={dashboardData.totalOrders ?? 0}
              type="orders"
              cardWidth={statCardWidth}
              onPress={() => navigation.navigate('AdminOrders')}
            />
          </View>

          {/* 6) ORDER STATUS CARDS (3 equal cards) */}
          <View style={styles.orderStatusRow}>
            <OrderStatusCard
              type="pending"
              count={dashboardData.pendingOrders ?? 0}
              label={t('orders.statusPending', 'Pending')}
              onPress={() => navigation.navigate('AdminOrders', { status: 'Pending' })}
            />
            <OrderStatusCard
              type="completed"
              count={dashboardData.completedOrders ?? 0}
              label={t('orders.statusDelivered', 'Delivered')}
              onPress={() => navigation.navigate('AdminOrders', { status: 'Delivered' })}
            />
            <OrderStatusCard
              type="cancelled"
              count={dashboardData.cancelledOrders ?? 0}
              label={t('orders.statusCancelled', 'Cancelled')}
              onPress={() => navigation.navigate('AdminOrders', { status: 'Cancelled' })}
            />
          </View>

          {/* 7) SECTION HEADER: Recent orders */}
          <AdminSectionHeader
            title={t('admin.recentOrders', 'Recent orders')}
            actionText={t('common.viewAll', 'View all')}
            onActionPress={() => navigation.navigate('AdminOrders')}
          />

          {/* 8) RECENT ORDERS CARD */}
          <View style={styles.recentOrdersCard}>
            {recentOrders.length === 0 ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <Text style={{ color: ADMIN_THEME.colors.textSecondary, fontSize: 13 }}>
                  {t('orders.noOrdersTitle', 'No recent orders yet')}
                </Text>
              </View>
            ) : (
              recentOrders.map((order, index) => (
                <RecentOrderRow
                  key={order.id}
                  order={order}
                  isLast={index === recentOrders.length - 1}
                  onPress={() =>
                    navigation.navigate('AdminOrderDetails', { orderId: order.id })
                  }
                />
              ))
            )}
          </View>

          {/* 9) SECTION HEADER: Quick actions */}
          <AdminSectionHeader title={t('admin.quickActions', 'Quick actions')} />

          {/* QUICK ACTIONS HORIZONTAL SCROLLVIEW */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickActionsScroll}
            contentContainerStyle={styles.quickActionsContent}
          >
            <QuickActionTile
              label={t('admin.allUsers', 'All users')}
              type="users"
              onPress={() => navigation.navigate('AdminFarmers')}
            />
            <QuickActionTile
              label={t('admin.allProducts', 'All products')}
              type="products"
              onPress={() => navigation.navigate('AdminProducts')}
            />
            <QuickActionTile
              label={t('admin.addCategory', 'Add category')}
              type="category"
              onPress={() => navigation.navigate('AdminCategories')}
            />
            <QuickActionTile
              label={t('admin.allOrders', 'All orders')}
              type="orders"
              onPress={() => navigation.navigate('AdminOrders')}
            />
          </ScrollView>
        </View>
      </ScrollView>
    </AdminPageBackground>
  );
};

export default AdminDashboardScreen;

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 120, // Section spec: nothing hides behind the floating bottom nav
  },
  contentArea: {
    paddingHorizontal: 16,
  },
  greetingSection: {
    marginTop: 16,
  },
  greetingTitle: {
    fontFamily: ADMIN_THEME.fonts.serif,
    fontSize: 18.5,
    lineHeight: 25,
    color: ADMIN_THEME.colors.ink,
  },
  greetingSubtitle: {
    marginTop: 3,
    fontFamily: ADMIN_THEME.fonts.regular,
    fontSize: 12.5,
    color: ADMIN_THEME.colors.textSecondary,
  },
  chipsRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateChip: {
    height: 35,
    paddingHorizontal: 12,
    borderRadius: ADMIN_THEME.radius.chip,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ADMIN_THEME.colors.card,
    borderWidth: 1,
    borderColor: ADMIN_THEME.colors.cardBorder,
    ...ADMIN_THEME.shadows.dateChip,
  },
  dateText: {
    fontFamily: ADMIN_THEME.fonts.semiBold,
    fontSize: 12,
    color: ADMIN_THEME.colors.ink,
  },
  supportButtonShadow: {
    borderRadius: ADMIN_THEME.radius.chip,
    ...ADMIN_THEME.shadows.supportButton,
  },
  supportButtonGradient: {
    height: 35,
    paddingHorizontal: 14,
    borderRadius: ADMIN_THEME.radius.chip,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    position: 'relative',
  },
  supportText: {
    fontFamily: ADMIN_THEME.fonts.bold,
    fontSize: 12,
    color: ADMIN_THEME.colors.ink,
  },
  supportBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 4,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  supportBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: ADMIN_THEME.fonts.bold,
  },
  mainStatsGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  orderStatusRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  recentOrdersCard: {
    paddingVertical: 2,
    paddingHorizontal: 14,
    borderRadius: ADMIN_THEME.radius.recentOrdersCard,
    backgroundColor: ADMIN_THEME.colors.card,
    borderWidth: 1,
    borderColor: ADMIN_THEME.colors.cardBorder,
    ...ADMIN_THEME.shadows.card,
  },
  quickActionsScroll: {
    marginHorizontal: -16,
  },
  quickActionsContent: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 10,
  },
});

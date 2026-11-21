import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../services/api';
import { getProductImageUrl } from '../services/productService';
import { getFarmerItemsStatus } from '../services/orderService';
import { OrderEmptyState } from '../components/orders/OrderEmptyState';
import { OrderSkeleton } from '../components/orders/OrderSkeleton';
import { FarmerPaymentBadge } from '../components/orders/FarmerPaymentBadge';
import { FARMER_THEME } from '../constants/farmerTheme';
import { FarmerPageBackground } from '../components/farmer/FarmerPageBackground';
import { FarmerHeader } from '../components/farmer/FarmerHeader';
import { FarmerCard } from '../components/farmer/FarmerCard';
import { FarmerChip, FarmerBadge } from '../components/farmer/FarmerUI';
import { useTranslation } from 'react-i18next';
import { formatOrderStatus, formatPaymentMethod } from '../utils/statusUtils';
import { formatCurrency, formatDate } from '../utils/formatters';

const FarmerOrdersScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');

  const tabs = [
    { id: 'All', label: t('farmer.allOrders', 'All'), statuses: [] },
    { id: 'New', label: t('farmer.pendingOrders', 'New'), statuses: ['PENDING'] },
    { id: 'Confirmed', label: t('farmer.confirmedOrders', 'Confirmed'), statuses: ['CONFIRMED'] },
    { id: 'Processing', label: t('status.processing', 'Processing'), statuses: ['PROCESSING'] },
    { id: 'Delivery', label: t('farmer.dispatchedOrders', 'Delivery'), statuses: ['OUT_FOR_DELIVERY'] },
    { id: 'Completed', label: t('status.delivered', 'Completed'), statuses: ['DELIVERED'] },
    { id: 'Cancelled', label: t('status.cancelled', 'Cancelled'), statuses: ['CANCELLED'] },
  ];

  const fetchOrders = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const response = await api.get('/order/farmer');
      setOrders(response.data.reverse());
    } catch (error) {
      console.log('Error fetching farmer orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const { refreshUnreadCount, farmerNewOrdersCount } = useNotification();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchOrders();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    // Mark farmer orders as seen when they view the New tab
    if (filter === 'New' && farmerNewOrdersCount > 0) {
      api
        .put('/order/farmer/mark-orders-seen')
        .then(() => {
          refreshUnreadCount();
        })
        .catch((err) => console.log('Error marking orders as seen', err));
    }
  }, [filter, farmerNewOrdersCount]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders(true);
  };

  const getFilteredOrders = () => {
    let filtered = orders;
    if (filter !== 'All') {
      const activeTab = tabs.find((t) => t.id === filter);
      if (activeTab) {
        filtered = orders.filter((o) => {
          const fStatus = o.status === 'CANCELLED' ? 'CANCELLED' : getFarmerItemsStatus(o.items || []);
          return activeTab.statuses.includes(fStatus);
        });
      }
    }

    return [...filtered].sort((a, b) => {
      const statusA = getFarmerItemsStatus(a.items || []);
      const statusB = getFarmerItemsStatus(b.items || []);

      if (statusA === 'PENDING' && statusB !== 'PENDING') return -1;
      if (statusA !== 'PENDING' && statusB === 'PENDING') return 1;

      const dateA = a.createdOn ? new Date(a.createdOn).getTime() : 0;
      const dateB = b.createdOn ? new Date(b.createdOn).getTime() : 0;
      return dateB - dateA;
    });
  };

  const getBadgeVariant = (status: string): 'warning' | 'error' | 'success' | 'info' => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'CANCELLED':
        return 'error';
      case 'CONFIRMED':
      case 'DELIVERED':
        return 'success';
      case 'PROCESSING':
      case 'OUT_FOR_DELIVERY':
      default:
        return 'info';
    }
  };

  const renderOrderCard = ({ item }: { item: any }) => {
    const mainItem = item.items && item.items.length > 0 ? item.items[0] : null;
    const moreItemsCount = item.items ? item.items.length - 1 : 0;
    const rawImageUrl =
      mainItem?.imageUrl || mainItem?.productPhoto || mainItem?.product?.productPhoto;
    const imageUrl = rawImageUrl ? getProductImageUrl(rawImageUrl) : null;
    const fStatus = item.status === 'CANCELLED' ? 'CANCELLED' : getFarmerItemsStatus(item.items || []);
    const isNew = fStatus === 'PENDING';
    const isCancelled = fStatus === 'CANCELLED';

    const orderIdLabel = `${t('orders.orderNumber', 'Order #').replace('{{id}}', '')}${
      item.orderNumber ? item.orderNumber.substring(0, 12) : item.orderId.substring(0, 8)
    }`;

    return (
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('FarmerOrderDetails', {
            orderId: item.orderId,
            initialOrder: item,
          })
        }
        activeOpacity={0.85}
        style={styles.cardTouchable}
      >
        <FarmerCard
          style={
            isCancelled
              ? { ...styles.orderCard, ...styles.cancelledOrderCard }
              : styles.orderCard
          }
        >
          {/* Header Row: Order ID + Status Badge */}
          <View style={styles.cardHeader}>
            <View style={styles.orderIdRow}>
              {isNew && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>{t('status.pending', 'NEW')}</Text>
                </View>
              )}
              {isCancelled && (
                <Ionicons
                  name="close-circle"
                  size={18}
                  color="#DC2626"
                  style={{ marginRight: 6 }}
                />
              )}
              <Text style={[styles.orderNumber, isCancelled && styles.cancelledOrderNumber]}>
                {orderIdLabel}
              </Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.orderDate}>
                {item.createdOn ? formatDate(item.createdOn) : ''}
              </Text>
              {isCancelled ? (
                <View style={styles.cancelledSignBadge}>
                  <Ionicons name="close-circle" size={13} color="#DC2626" style={{ marginRight: 4 }} />
                  <Text style={styles.cancelledSignText}>
                    {formatOrderStatus('CANCELLED', t)}
                  </Text>
                </View>
              ) : (
                <FarmerBadge
                  label={formatOrderStatus(fStatus, t)}
                  variant={getBadgeVariant(fStatus)}
                  size="sm"
                />
              )}
            </View>
          </View>

          {/* Customer & Address Row */}
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{t('orders.customer', 'Ordered by')}: {item.customerName}</Text>
            <Text style={styles.deliveryLocation} numberOfLines={1}>
              {item.village || item.deliveryAddress?.split(',')[0]}
            </Text>
          </View>

          {/* Payment Status Pill */}
          <View style={styles.paymentBadgeContainer}>
            <FarmerPaymentBadge
              paymentMethod={item.paymentMethod}
              paymentStatus={item.paymentStatus}
            />
          </View>

          <View style={styles.divider} />

          {/* Product Summary & Total Amount */}
          <View style={styles.productRow}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.productImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="leaf-outline" size={22} color={FARMER_THEME.colors.emeraldPrimary} />
              </View>
            )}
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={1}>
                {mainItem?.productName || 'Product'}
              </Text>
              {moreItemsCount > 0 && (
                <View style={styles.moreItemsBadge}>
                  <Ionicons name="layers-outline" size={12} color={FARMER_THEME.colors.forestGreen} />
                  <Text style={styles.moreItemsText}>
                    +{moreItemsCount} {t('orders.moreItems', 'more item(s)')}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.amountContainer}>
              <Text style={styles.totalAmount}>{formatCurrency(item.totalAmount)}</Text>
              <View style={styles.paymentMethodPill}>
                <Text style={styles.paymentMethod}>{formatPaymentMethod(item.paymentMethod, t)}</Text>
              </View>
            </View>
          </View>

          {/* Cancellation Reason Banner directly on cancelled order card */}
          {isCancelled && (
            <View style={styles.cancelReasonBanner}>
              <View style={styles.cancelReasonHeader}>
                <Ionicons name="close-circle" size={15} color="#DC2626" style={{ marginRight: 6 }} />
                <Text style={styles.cancelReasonLabel}>
                  {t('orders.cancellationReason', 'Cancellation Reason')}
                </Text>
              </View>
              <Text style={styles.cancelReasonText}>
                {item.cancellationReason && item.cancellationReason.trim().length > 0
                  ? item.cancellationReason
                  : t('orders.noReasonProvided', 'No specific reason provided by the customer.')}
              </Text>
            </View>
          )}
        </FarmerCard>
      </TouchableOpacity>
    );
  };

  return (
    <FarmerPageBackground>
      {/* Tab FarmerHeader */}
      <FarmerHeader
        variant="tab"
        title={t('farmer.ordersTitle', 'Order Management')}
        subtitle={t('farmer.manageOrders', 'Track & fulfill incoming customer orders')}
        onBackPress={() => {
          if (navigation?.canGoBack()) {
            navigation.goBack();
          } else {
            navigation?.navigate('Home');
          }
        }}
      />

      {/* Segmented FarmerChip Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {tabs.map((tab) => {
            const isActive = filter === tab.id;
            return (
              <View key={tab.id} style={styles.tabChipWrapper}>
                <FarmerChip
                  label={tab.label}
                  selected={isActive}
                  onPress={() => setFilter(tab.id)}
                  style={styles.filterChip}
                />
                {tab.id === 'New' && (farmerNewOrdersCount || 0) > 0 && (
                  <View style={styles.newTabDot} />
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Orders List / Skeletons */}
      {loading ? (
        <OrderSkeleton variant="farmer" />
      ) : (
        <FlatList
          data={getFilteredOrders()}
          keyExtractor={(item) => item.orderId}
          renderItem={renderOrderCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[FARMER_THEME.colors.emeraldPrimary]}
            />
          }
          ListEmptyComponent={
            <OrderEmptyState
              variant="farmer"
              title={t('orders.noOrdersTitle', 'No Orders Found')}
              subtitle={t('orders.noOrdersSubtitle', "You don't have any orders in this category right now.")}
            />
          }
        />
      )}
    </FarmerPageBackground>
  );
};

const styles = StyleSheet.create({
  tabsWrapper: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: FARMER_THEME.colors.cardBorder,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabChipWrapper: {
    position: 'relative',
    marginRight: 8,
  },
  filterChip: {
    marginRight: 0,
  },
  newTabDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: FARMER_THEME.colors.goldDot,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#082419',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 130, // Clearance for bottom nav
  },
  cardTouchable: {
    marginBottom: 14,
  },
  orderCard: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  orderIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  newBadge: {
    backgroundColor: FARMER_THEME.colors.goldDot,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  newBadgeText: {
    color: '#082419',
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 9.5,
  },
  orderNumber: {
    fontSize: 15,
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#0E3B29',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  orderDate: {
    fontFamily: FARMER_THEME.fonts.regular,
    fontSize: 11.5,
    color: FARMER_THEME.colors.sageText,
    marginBottom: 4,
  },
  customerInfo: {
    marginTop: 2,
  },
  customerName: {
    fontFamily: FARMER_THEME.fonts.semiBold,
    fontSize: 14,
    color: '#1B2A22',
  },
  deliveryLocation: {
    fontFamily: FARMER_THEME.fonts.regular,
    fontSize: 12.5,
    color: FARMER_THEME.colors.sageText,
    marginTop: 2,
  },
  paymentBadgeContainer: {
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: FARMER_THEME.colors.divider,
    marginVertical: 12,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: FARMER_THEME.colors.cardBorder,
  },
  placeholderImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: FARMER_THEME.colors.pastelGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: FARMER_THEME.colors.cardBorder,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontFamily: FARMER_THEME.fonts.semiBold,
    fontSize: 14,
    color: '#0E3B29',
  },
  moreItemsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FARMER_THEME.colors.pastelGreen,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: FARMER_THEME.colors.cardBorder,
  },
  moreItemsText: {
    fontFamily: FARMER_THEME.fonts.medium,
    fontSize: 11,
    color: FARMER_THEME.colors.forestGreen,
    marginLeft: 4,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  totalAmount: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 16,
    color: '#1B2A22',
  },
  paymentMethodPill: {
    backgroundColor: FARMER_THEME.colors.pastelGreen,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
    borderWidth: 1,
    borderColor: FARMER_THEME.colors.cardBorder,
  },
  paymentMethod: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 10,
    color: FARMER_THEME.colors.forestGreen,
  },
  cancelledOrderCard: {
    borderColor: '#FCA5A5',
    borderWidth: 1.2,
    backgroundColor: '#FFFBFB',
  },
  cancelledOrderNumber: {
    color: '#991B1B',
  },
  cancelledSignBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  cancelledSignText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 11,
    color: '#DC2626',
  },
  cancelReasonBanner: {
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelReasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cancelReasonLabel: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 12,
    color: '#B91C1C',
  },
  cancelReasonText: {
    fontFamily: FARMER_THEME.fonts.medium,
    fontSize: 12.5,
    color: '#7F1D1D',
    lineHeight: 18,
  },
});

export default FarmerOrdersScreen;

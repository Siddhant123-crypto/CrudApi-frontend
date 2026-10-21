import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
  Alert,
  AppState,
  AppStateStatus,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {useFocusEffect} from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../services/api';
import {getProductImageUrl} from '../services/productService';
import { OrderStatusBadge } from '../components/orders/OrderStatusBadge';
import { PaymentStatusBadge } from '../components/orders/PaymentStatusBadge';
import { OrderEmptyState } from '../components/orders/OrderEmptyState';
import { OrderSkeleton } from '../components/orders/OrderSkeleton';
import { startOnlinePayment, getPaymentErrorMessage, syncPayment } from '../services/paymentService';
import { PAYMENT_MESSAGES } from '../constants/paymentMessages';
import { PageBackground } from '../components/ui/PageBackground';
import { ThemedHeader } from '../components/ui/ThemedHeader';
import { ThemedChip } from '../components/ui/ThemedChip';
import { Card } from '../components/ui/Card';
import { THEME } from '../constants/theme';
import { ChevronRightIcon } from '../components/CustomerIcons';

const formatDisplayPrice = (val: any) => {
  const num = Number(val);
  if (isNaN(num)) return val ?? '0';
  if (num % 1 === 0) {
    return String(Math.round(num));
  }
  return num.toFixed(2).replace(/\.00$/, '').replace(/(\.[0-9])0$/, '$1');
};

const CustomerOrdersScreen = ({navigation}: any) => {
  const {user} = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('Ongoing');
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const tabs = ['Ongoing', 'Delivered', 'Cancelled'];

  const fetchOrders = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const [activeResponse, historyResponse] = await Promise.all([
        api.get('/order/customer/my-orders'),
        api.get('/order/customer/order-history')
      ]);
      const combined = [...activeResponse.data, ...historyResponse.data];
      combined.sort((a, b) => {
        const dateA = new Date(a.createdOn || 0).getTime();
        const dateB = new Date(b.createdOn || 0).getTime();
        return dateB - dateA;
      });
      setOrders(combined);
    } catch (error) {
      console.log('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const fetchAndSync = async () => {
        await fetchOrders();
        // After loading, silently sync any unpaid online non-cancelled orders
        if (!isMounted) return;
        try {
          const [activeRes] = await Promise.all([
            api.get('/order/customer/my-orders'),
          ]);
          const allActive: any[] = activeRes.data || [];
          const eligible = allActive.filter(
            (o: any) =>
              o.paymentMethod === 'ONLINE' &&
              o.paymentStatus !== 'PAID' &&
              o.status !== 'CANCELLED'
          );
          if (eligible.length > 0) {
            let anyChanged = false;
            await Promise.all(
              eligible.map(async (o: any) => {
                const res = await syncPayment(o.orderId);
                if (res?.paid) anyChanged = true;
              })
            );
            if (anyChanged && isMounted) {
              fetchOrders(true);
            }
          }
        } catch {
          // Sync errors are non-fatal; do not disturb the UI
        }
      };

      fetchAndSync();

      const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active' && isMounted) {
          fetchOrders(true);
        }
      });

      return () => {
        isMounted = false;
        subscription.remove();
      };
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders(true);
  };

  const getFilteredOrders = () => {
    if (filter === 'All') return orders;
    if (filter === 'Ongoing' || filter === 'Active') {
      return orders.filter(
        o =>
          o.status === 'PENDING' ||
          o.status === 'CONFIRMED' ||
          o.status === 'PROCESSING' ||
          o.status === 'OUT_FOR_DELIVERY'
      );
    }
    if (filter === 'Delivered') return orders.filter(o => o.status === 'DELIVERED');
    if (filter === 'Cancelled') return orders.filter(o => o.status === 'CANCELLED');
    return orders;
  };

  const handlePayNow = async (orderItem: any) => {
    if (payingOrderId) return;
    setPayingOrderId(orderItem.orderId);
    try {
      const result = await startOnlinePayment(orderItem, user);
      if (result.success) {
        navigation.navigate('PaymentSuccess', {
          orderId: result.orderId || orderItem.orderId,
          orderNumber: result.orderNumber || orderItem.orderNumber,
          totalAmount: result.totalAmount || orderItem.totalAmount,
          paymentId: result.paymentId,
          isTestMode: result.isTestMode,
        });
      } else if (result.status === 'VERIFY_FAILED') {
        Alert.alert(
          'Payment Status',
          result.message || PAYMENT_MESSAGES.VERIFICATION_PROBLEM,
          [
            {
              text: 'View Details',
              onPress: () => navigation.navigate('CustomerOrderDetails', {orderId: orderItem.orderId}),
            },
            {
              text: 'OK',
              onPress: () => fetchOrders(true),
            },
          ]
        );
        fetchOrders(true);
      } else if (result.status === 'CANCELLED') {
        Alert.alert('Payment Cancelled', result.message || PAYMENT_MESSAGES.PAYMENT_CANCELLED);
      } else {
        Alert.alert('Payment Failed', result.message || PAYMENT_MESSAGES.PAYMENT_FAILED);
      }
    } catch (err: any) {
      Alert.alert('Payment Error', getPaymentErrorMessage(err));
    } finally {
      setPayingOrderId(null);
    }
  };

  const renderOrderCard = ({item}: {item: any}) => {
    const mainItem = item.items && item.items.length > 0 ? item.items[0] : null;
    const moreItemsCount = item.items ? item.items.length - 1 : 0;
    const rawImageUrl = mainItem?.imageUrl || mainItem?.productPhoto || mainItem?.product?.productPhoto;
    const imageUrl = rawImageUrl
      ? getProductImageUrl(rawImageUrl)
      : null;

    return (
      <Card
        style={styles.orderCard}
        onPress={() => navigation.navigate('CustomerOrderDetails', {orderId: item.orderId})}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.orderNumber}>
            Order #{item.orderNumber ? item.orderNumber.substring(0, 12) : item.orderId.substring(0, 8)}
          </Text>
          <Text style={styles.orderDate}>
            {item.createdOn ? new Date(item.createdOn).toLocaleDateString() : ''}
          </Text>
        </View>

        <View style={styles.cardBody}>
          {imageUrl ? (
            <Image source={{uri: imageUrl}} style={styles.productImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={{ fontSize: 24 }}>🌾</Text>
            </View>
          )}
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={1}>
              {mainItem?.productName || 'Product'}
            </Text>
            {moreItemsCount > 0 && (
              <View style={styles.moreItemsBadge}>
                <Ionicons name="layers-outline" size={13} color={THEME.colors.accent} />
                <Text style={styles.moreItemsText}>+{moreItemsCount} more item{moreItemsCount > 1 ? 's' : ''}</Text>
              </View>
            )}
            <Text style={styles.totalAmount}>₹{formatDisplayPrice(item.totalAmount)}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.badgeRow}>
            <OrderStatusBadge status={item.status} variant="customer" />
            {item.paymentMethod === 'ONLINE' && item.paymentStatus && (
              <PaymentStatusBadge status={item.paymentStatus} variant="customer" />
            )}
          </View>
          <View style={styles.actionsRow}>
            {item.paymentMethod === 'ONLINE' &&
              item.status !== 'CANCELLED' &&
              (item.paymentStatus === 'PENDING' || item.paymentStatus === 'FAILED') && (
                <TouchableOpacity
                  style={[styles.payNowSmallBtn, payingOrderId === item.orderId && styles.disabledBtn]}
                  onPress={() => handlePayNow(item)}
                  disabled={payingOrderId === item.orderId}
                  activeOpacity={0.8}
                >
                  {payingOrderId === item.orderId ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.payNowSmallBtnText}>Pay Now</Text>
                  )}
                </TouchableOpacity>
              )}
            <View style={styles.viewDetailsBtn}>
              <Text style={styles.viewDetailsText}>Details</Text>
              <ChevronRightIcon size={14} color={THEME.colors.accent} />
            </View>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <PageBackground style={styles.container}>
      {/* Themed Header (Tab Variant) */}
      <ThemedHeader
        variant="tab"
        title="My Orders"
        subtitle="Track and manage your orders"
      />

      {/* Segmented ThemedChip Tabs */}
      <View style={styles.tabsWrapper}>
        <View style={styles.tabsContainer}>
          {tabs.map(tab => (
            <ThemedChip
              key={tab}
              label={tab}
              selected={filter === tab}
              onPress={() => setFilter(tab)}
              style={styles.tabChip}
              textStyle={styles.tabChipText}
            />
          ))}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <OrderSkeleton variant="customer" />
      ) : (
        <FlatList
          data={getFilteredOrders()}
          keyExtractor={item => item.orderId}
          renderItem={renderOrderCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[THEME.colors.accent]}
              tintColor={THEME.colors.accent}
            />
          }
          ListEmptyComponent={
            <OrderEmptyState
              variant="customer"
              title={`No ${filter} orders found`}
              subtitle="Looks like you don't have any orders here yet."
              buttonTitle="Start Shopping"
              onButtonPress={() => navigation.navigate('Home')}
            />
          }
        />
      )}
    </PageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsWrapper: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabChip: {
    flex: 1,
    height: 38,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabChipText: {
    fontSize: 12.5,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 130, // For the bottom nav
  },
  orderCard: {
    marginBottom: 14,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 13.5,
    fontFamily: THEME.fonts.bold,
    color: THEME.colors.textHeading,
  },
  orderDate: {
    fontSize: 12.5,
    fontFamily: THEME.fonts.medium,
    color: THEME.colors.textMuted,
  },
  cardBody: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'center',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 14,
    marginRight: 14,
    backgroundColor: '#FFF1DE',
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: '#FFF1DE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 15,
    fontFamily: THEME.fonts.bold,
    color: THEME.colors.textHeading,
  },
  moreItemsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.chipBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radius.pill,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  moreItemsText: {
    fontSize: 11.5,
    fontFamily: THEME.fonts.semiBold,
    color: THEME.colors.accent,
    marginLeft: 4,
  },
  totalAmount: {
    fontSize: 16,
    fontFamily: THEME.fonts.serif,
    color: THEME.colors.accentDeep,
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.divider,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payNowSmallBtn: {
    backgroundColor: THEME.colors.accentDeep,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radius.smallButtons,
    marginRight: 10,
    shadowColor: THEME.colors.accentDeep,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  payNowSmallBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: THEME.fonts.bold,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailsText: {
    fontSize: 13,
    fontFamily: THEME.fonts.semiBold,
    color: THEME.colors.accent,
  },
});

export default CustomerOrdersScreen;


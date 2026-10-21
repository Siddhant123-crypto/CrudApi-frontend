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

const FarmerOrdersScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');

  const tabs = [
    { id: 'All', label: 'All', statuses: [] },
    { id: 'New', label: 'New', statuses: ['PENDING'] },
    { id: 'Confirmed', label: 'Confirmed', statuses: ['CONFIRMED'] },
    { id: 'Processing', label: 'Processing', statuses: ['PROCESSING'] },
    { id: 'Delivery', label: 'Delivery', statuses: ['OUT_FOR_DELIVERY'] },
    { id: 'Completed', label: 'Completed', statuses: ['DELIVERED'] },
    { id: 'Cancelled', label: 'Cancelled', statuses: ['CANCELLED'] },
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
          const fStatus = getFarmerItemsStatus(o.items || []);
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
    const fStatus = getFarmerItemsStatus(item.items || []);
    const isNew = fStatus === 'PENDING';

    const orderIdLabel = `Order #${
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
        <FarmerCard style={styles.orderCard}>
          {/* Header Row: Order ID + Status Badge */}
          <View style={styles.cardHeader}>
            <View style={styles.orderIdRow}>
              {isNew && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              )}
              <Text style={styles.orderNumber}>{orderIdLabel}</Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.orderDate}>
                {item.createdOn ? new Date(item.createdOn).toLocaleDateString() : ''}
              </Text>
              <FarmerBadge
                label={fStatus}
                variant={getBadgeVariant(fStatus)}
                size="sm"
              />
            </View>
          </View>

          {/* Customer & Address Row */}
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>Ordered by: {item.customerName}</Text>
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
                    +{moreItemsCount} more item{moreItemsCount > 1 ? 's' : ''}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.amountContainer}>
              <Text style={styles.totalAmount}>₹{item.totalAmount?.toFixed(2)}</Text>
              <View style={styles.paymentMethodPill}>
                <Text style={styles.paymentMethod}>{item.paymentMethod}</Text>
              </View>
            </View>
          </View>
        </FarmerCard>
      </TouchableOpacity>
    );
  };

  return (
    <FarmerPageBackground>
      {/* Tab FarmerHeader */}
      <FarmerHeader
        variant="tab"
        title="Order Management"
        subtitle="Track & fulfill incoming customer orders"
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
              title="No Orders Found"
              subtitle="You don't have any orders in this category right now."
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
});

export default FarmerOrdersScreen;

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
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {useFocusEffect} from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../services/api';
import {getProductImageUrl} from '../services/productService';
import { OrderStatusBadge } from '../components/orders/OrderStatusBadge';
import { OrderEmptyState } from '../components/orders/OrderEmptyState';
import { OrderSkeleton } from '../components/orders/OrderSkeleton';

const CustomerOrdersScreen = ({navigation}: any) => {
  const {user} = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All'); // All, Active, Delivered, Cancelled

  const tabs = ['All', 'Active', 'Delivered', 'Cancelled'];

  const fetchOrders = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const [activeResponse, historyResponse] = await Promise.all([
        api.get('/order/customer/my-orders'),
        api.get('/order/customer/order-history')
      ]);
      const combined = [...activeResponse.data, ...historyResponse.data];
      // Sort by some criteria if needed, or just reverse the combined list assuming order ID or created date
      combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
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
      fetchOrders();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders(true);
  };

  const getFilteredOrders = () => {
    if (filter === 'All') return orders;
    if (filter === 'Active') {
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

  const renderOrderCard = ({item}: {item: any}) => {
    const mainItem = item.items && item.items.length > 0 ? item.items[0] : null;
    const moreItemsCount = item.items ? item.items.length - 1 : 0;

    const rawImageUrl = mainItem?.imageUrl || mainItem?.productPhoto || mainItem?.product?.productPhoto;
    const imageUrl = rawImageUrl
      ? getProductImageUrl(rawImageUrl)
      : null;

    return (
      <TouchableOpacity 
        style={styles.orderCard} 
        onPress={() => navigation.navigate('CustomerOrderDetails', {orderId: item.orderId})}
        activeOpacity={0.8}
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
            <View style={styles.placeholderImage}><Text>🌾</Text></View>
          )}

          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={1}>
              {mainItem?.productName || 'Product'}
            </Text>
            {moreItemsCount > 0 && (
              <Text style={styles.moreItemsText}>+ {moreItemsCount} more item(s)</Text>
            )}
            <Text style={styles.totalAmount}>₹{item.totalAmount?.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <OrderStatusBadge status={item.status} />
          <View style={styles.viewDetailsBtn}>
            <Text style={styles.viewDetailsText}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color="#1B5E20" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, filter === tab && styles.tabBtnActive]}
            onPress={() => setFilter(tab)}>
            <Text style={[styles.tabText, filter === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <OrderSkeleton />
      ) : (
        <FlatList
          data={getFilteredOrders()}
          keyExtractor={item => item.orderId}
          renderItem={renderOrderCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1B5E20']} />
          }
          ListEmptyComponent={
            <OrderEmptyState 
              title={`No ${filter !== 'All' ? filter : ''} orders found`}
              subtitle="Looks like you don't have any orders here yet."
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#2D983A',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backBtn: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  tabBtnActive: {
    backgroundColor: '#1B5E20',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#86EFAC',
    shadowColor: '#1B5E20',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  orderDate: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  cardBody: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 16,
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  moreItemsText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1B5E20',
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B5E20',
    marginRight: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
    marginBottom: 24,
  },
  shopBtn: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  shopBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default CustomerOrdersScreen;

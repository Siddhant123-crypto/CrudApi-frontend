import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../services/api';
import {getProductImageUrl} from '../services/productService';
import { getFarmerItemsStatus } from '../services/orderService';
import { OrderEmptyState } from '../components/orders/OrderEmptyState';
import { OrderSkeleton } from '../components/orders/OrderSkeleton';
const FarmerOrdersScreen = ({navigation}: any) => {
  const {user} = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');
  const tabs = [
    {id: 'All', label: 'All', statuses: []},
    {id: 'New', label: 'New', statuses: ['PENDING']},
    {id: 'Confirmed', label: 'Confirmed', statuses: ['CONFIRMED']},
    {id: 'Processing', label: 'Processing', statuses: ['PROCESSING']},
    {id: 'Delivery', label: 'Delivery', statuses: ['OUT_FOR_DELIVERY']},
    {id: 'Completed', label: 'Completed', statuses: ['DELIVERED']},
    {id: 'Cancelled', label: 'Cancelled', statuses: ['CANCELLED']},
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
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchOrders();
    });
    return unsubscribe;
  }, [navigation]);
  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders(true);
  };
  const getFilteredOrders = () => {
    if (filter === 'All') return orders;
    const activeTab = tabs.find(t => t.id === filter);
    if (!activeTab) return orders;
    return orders.filter(o => {
      const fStatus = getFarmerItemsStatus(o.items || []);
      return activeTab.statuses.includes(fStatus);
    });
  };
  const renderOrderCard = ({item}: {item: any}) => {
    const mainItem = item.items && item.items.length > 0 ? item.items[0] : null;
    const moreItemsCount = item.items ? item.items.length - 1 : 0;
    const rawImageUrl = mainItem?.imageUrl || mainItem?.productPhoto || mainItem?.product?.productPhoto;
    const imageUrl = rawImageUrl
      ? getProductImageUrl(rawImageUrl)
      : null;
    const fStatus = getFarmerItemsStatus(item.items || []);
    const isCancelled = fStatus === 'CANCELLED';
    const isAccepted = fStatus !== 'PENDING' && !isCancelled;
    const isNew = fStatus === 'PENDING';
    return (
      <TouchableOpacity
        style={[
          styles.orderCard,
          isNew && styles.orderCardNew,
          isAccepted && { backgroundColor: '#F1F8E9', borderColor: '#4CAF50' },
          isCancelled && { backgroundColor: '#FFEBEE', borderColor: '#F44336' }
        ]}
        onPress={() => navigation.navigate('FarmerOrderDetails', {orderId: item.orderId, initialOrder: item})}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            {isNew && <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>}
            <Text style={styles.orderNumber}>
              Order #{item.orderNumber ? item.orderNumber.substring(0, 12) : item.orderId.substring(0, 8)}
            </Text>
          </View>
          <View style={{alignItems: 'flex-end'}}>
            <Text style={styles.orderDate}>
              {item.createdOn ? new Date(item.createdOn).toLocaleDateString() : ''}
            </Text>
            <View style={[
              styles.statusBadge,
              fStatus === 'PENDING' && { backgroundColor: '#FFF3E0' },
              fStatus === 'CANCELLED' && { backgroundColor: '#FFCDD2' },
              (fStatus !== 'PENDING' && fStatus !== 'CANCELLED') && { backgroundColor: '#C8E6C9' }
            ]}>
              <Text style={[
                styles.statusText,
                fStatus === 'PENDING' && { color: '#F57C00' },
                fStatus === 'CANCELLED' && { color: '#C62828' },
                (fStatus !== 'PENDING' && fStatus !== 'CANCELLED') && { color: '#2E7D32' }
              ]}>{fStatus}</Text>
            </View>
          </View>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.customerInfo}>
            <View style={{flex: 1}}>
              <Text style={styles.customerName}>Ordered by: {item.customerName}</Text>
              <Text style={styles.deliveryLocation} numberOfLines={1}>
                {item.village || item.deliveryAddress?.split(',')[0]}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.productRow}>
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
                <View style={styles.moreItemsBadge}>
                  <Ionicons name="layers-outline" size={13} color="#1E88E5" />
                  <Text style={styles.moreItemsText}>+{moreItemsCount} more item{moreItemsCount > 1 ? 's' : ''}</Text>
                </View>
              )}
            </View>
            <View style={styles.amountContainer}>
              <Text style={styles.totalAmount}>₹{item.totalAmount?.toFixed(2)}</Text>
              <Text style={styles.paymentMethod}>{item.paymentMethod}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  return (
    <View style={styles.container}>
      <View style={[styles.header, {flexDirection: 'row', alignItems: 'center'}]}>
        <TouchableOpacity style={{padding: 4}} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back-outline" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {marginLeft: 16}]}>Order Management</Text>
      </View>
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 12}}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabBtn, filter === tab.id && styles.tabBtnActive]}
              onPress={() => setFilter(tab.id)}>
              <Text style={[styles.tabText, filter === tab.id && styles.tabTextActive]}>{tab.label}</Text>
              {}
            </TouchableOpacity>
          ))}
        </ScrollView>
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
              title="No Orders Found"
              subtitle="You don't have any orders in this category right now."
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#1E5631',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    backgroundColor: '#F3F4F6',
  },
  tabBtnActive: {
    backgroundColor: '#1E5631',
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
    borderWidth: 2,
    borderColor: '#86EFAC',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  orderCardNew: {
    borderColor: '#34D399',
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  newBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  newBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  orderDate: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardBody: {
    backgroundColor: 'transparent',
    paddingTop: 8,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  deliveryLocation: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 12,
  },
  placeholderImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  moreItemsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  moreItemsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E88E5',
    marginLeft: 4,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1B5E20',
  },
  paymentMethod: {
    fontSize: 10,
    color: '#4B5563',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});
export default FarmerOrdersScreen;

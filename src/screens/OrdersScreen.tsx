import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useAuth} from '../context/AuthContext';
import Ionicons from '@expo/vector-icons/Ionicons';

export interface Order {
  orderId: string;
  productId: string;
  productName: string;
  category: string;
  price: number;
  unit: string;
  quantity: number;
  totalPrice: number;
  status: 'Pending' | 'Dispatched' | 'Delivered';
  customerId: string;
  customerName: string;
  farmerId: string;
  orderDate: string;
}

const OrdersScreen = () => {
  const {user} = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const storedOrders = await AsyncStorage.getItem('@farm2home_orders');
      if (storedOrders) {
        const parsedOrders: Order[] = JSON.parse(storedOrders);

        // Filter based on user role
        if (user?.role === 'FARMER') {
          const farmerOrders = parsedOrders.filter(
            order => order.farmerId === user.farmerId,
          );
          setOrders(farmerOrders.reverse()); // latest first
        } else {
          const customerOrders = parsedOrders.filter(
            order => order.customerId === user?.userId,
          );
          setOrders(customerOrders.reverse());
        }
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.log('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, nextStatus: 'Dispatched' | 'Delivered') => {
    try {
      const storedOrders = await AsyncStorage.getItem('@farm2home_orders');
      if (storedOrders) {
        const parsedOrders: Order[] = JSON.parse(storedOrders);
        const updated = parsedOrders.map(order => {
          if (order.orderId === orderId) {
            return {...order, status: nextStatus};
          }
          return order;
        });

        await AsyncStorage.setItem('@farm2home_orders', JSON.stringify(updated));
        Alert.alert('Status Updated', `Order status has been updated to ${nextStatus}.`);
        loadOrders();
      }
    } catch (error) {
      console.log('Error updating order status:', error);
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const renderStatusBadge = (status: string) => {
    let color = '#FFA000';
    let bgColor = '#FFF8E1';

    if (status === 'Dispatched') {
      color = '#1E88E5';
      bgColor = '#E3F2FD';
    } else if (status === 'Delivered') {
      color = '#43A047';
      bgColor = '#E8F5E9';
    }

    return (
      <View style={[styles.statusBadge, {backgroundColor: bgColor}]}>
        <Text style={[styles.statusText, {color: color}]}>{status}</Text>
      </View>
    );
  };

  const renderOrderItem = ({item}: {item: Order}) => {
    const isFarmer = user?.role === 'FARMER';

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>ID: {item.orderId.substring(0, 8).toUpperCase()}</Text>
            <Text style={styles.orderDate}>{new Date(item.orderDate).toLocaleDateString()}</Text>
          </View>
          {renderStatusBadge(item.status)}
        </View>

        <View style={styles.productInfo}>
          <View style={styles.productDetails}>
            <Text style={styles.productName}>{item.productName}</Text>
            <Text style={styles.productCategory}>{item.category} • ₹{item.price}/{item.unit}</Text>
            <Text style={styles.quantityText}>Quantity: {item.quantity} {item.unit}(s)</Text>
          </View>
          <Text style={styles.totalPrice}>₹{item.totalPrice.toFixed(2)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.footerRow}>
          <View style={styles.partyDetails}>
            <Text style={styles.partyLabel}>{isFarmer ? 'Customer' : 'Farmer'}</Text>
            <Text style={styles.partyValue}>{isFarmer ? item.customerName : 'Local Farmer'}</Text>
          </View>

          {isFarmer && item.status !== 'Delivered' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                if (item.status === 'Pending') {
                  updateOrderStatus(item.orderId, 'Dispatched');
                } else if (item.status === 'Dispatched') {
                  updateOrderStatus(item.orderId, 'Delivered');
                }
              }}>
              <Text style={styles.actionButtonText}>
                {item.status === 'Pending' ? 'Dispatch' : 'Deliver'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadOrders}>
          <Ionicons name="refresh" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#1B5E20" />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item.orderId}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color="#BDBDBD" />
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptySubtitle}>
                {user?.role === 'FARMER'
                  ? 'Orders placed for your products will appear here.'
                  : 'Start purchasing fresh items from the Home screen.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  refreshBtn: {
    padding: 8,
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
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#424242',
  },
  orderDate: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  productInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    padding: 12,
    borderRadius: 10,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
  },
  productCategory: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  quantityText: {
    fontSize: 12,
    color: '#616161',
    fontWeight: '500',
    marginTop: 4,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1B5E20',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  partyDetails: {
    flex: 1,
  },
  partyLabel: {
    fontSize: 11,
    color: '#9E9E9E',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  partyValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginTop: 2,
  },
  actionButton: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#424242',
    marginTop: 16,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    paddingHorizontal: 30,
    lineHeight: 20,
  },
});

export default OrdersScreen;

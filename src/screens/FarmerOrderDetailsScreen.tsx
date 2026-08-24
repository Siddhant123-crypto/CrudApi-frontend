import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../services/api';
import {getProductImageUrl} from '../services/productService';
import { OrderStatusBadge } from '../components/orders/OrderStatusBadge';
import { OrderTimeline } from '../components/orders/OrderTimeline';

const FarmerOrderDetailsScreen = ({route, navigation}: any) => {
  const {orderId, initialOrder} = route.params;
  const [order, setOrder] = useState<any>(initialOrder || null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchOrderDetails = async () => {
    try {
      const response = await api.get(`/order/${orderId}`);
      setOrder(response.data);
    } catch (error) {
      console.log('Error fetching order details:', error);
      if (!initialOrder) {
        Alert.alert('Error', 'Failed to load order details');
        navigation.goBack();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      if (newStatus === 'CONFIRMED') {
        await api.put(`/order/${orderId}/accept`);
        Alert.alert('Success', 'Order accepted successfully');
      } else if (newStatus === 'CANCELLED') {
        await api.put(`/order/${orderId}/farmer-cancel`);
        Alert.alert('Success', 'Order declined successfully');
      } else {
        await api.put(`/order/${orderId}/status?status=${newStatus}`);
        Alert.alert('Success', `Order status updated to ${newStatus}`);
      }
      fetchOrderDetails();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1B5E20" />
      </View>
    );
  }

  if (!order) return null;

  const getAvailableActions = () => {
    if (order.status === 'PENDING') {
      return (
        <>
          <TouchableOpacity 
            style={[styles.actionBtn, {backgroundColor: '#10B981', flex: 1, marginRight: 8}]} 
            onPress={() => updateStatus('CONFIRMED')}
            disabled={updating}>
            <Text style={styles.actionBtnText}>Accept Order</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, {backgroundColor: '#EF4444', flex: 1, marginLeft: 8}]} 
            onPress={() => updateStatus('CANCELLED')}
            disabled={updating}>
            <Text style={styles.actionBtnText}>Decline</Text>
          </TouchableOpacity>
        </>
      );
    }
    if (order.status === 'CONFIRMED') {
      return (
        <TouchableOpacity 
          style={[styles.actionBtn, {backgroundColor: '#8B5CF6', width: '100%'}]} 
          onPress={() => updateStatus('PROCESSING')}
          disabled={updating}>
          <Text style={styles.actionBtnText}>Start Processing</Text>
        </TouchableOpacity>
      );
    }
    if (order.status === 'PROCESSING') {
      return (
        <TouchableOpacity 
          style={[styles.actionBtn, {backgroundColor: '#F59E0B', width: '100%'}]} 
          onPress={() => updateStatus('OUT_FOR_DELIVERY')}
          disabled={updating}>
          <Text style={styles.actionBtnText}>Mark as Out for Delivery</Text>
        </TouchableOpacity>
      );
    }
    if (order.status === 'OUT_FOR_DELIVERY') {
      return (
        <TouchableOpacity 
          style={[styles.actionBtn, {backgroundColor: '#3B82F6', width: '100%'}]} 
          onPress={() => updateStatus('DELIVERED')}
          disabled={updating}>
          <Text style={styles.actionBtnText}>Confirm Delivery</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Customer Product Detail
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Customer Details */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="person-circle" size={40} color="#1B5E20" />
            <View style={{marginLeft: 12}}>
              <Text style={styles.customerName}>{order.customerName}</Text>
              <Text style={styles.customerMobile}>{order.customerMobile}</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.addressRow}>
            <Ionicons name="location" size={20} color="#6B7280" style={{marginTop: 2}} />
            <View style={{marginLeft: 8, flex: 1}}>
              <Text style={styles.addressText}>{order.deliveryAddress}</Text>
              <Text style={styles.addressText}>{order.village}, {order.state} {order.postalCode}</Text>
            </View>
          </View>
        </View>

        {/* Status Card */}
        <View style={styles.card}>
          <Text style={[styles.sectionTitle, {marginBottom: 16}]}>Current Status</Text>
          <OrderTimeline status={order.status} />
        </View>

        {/* Cancellation Reason Card (if cancelled) */}
        {order.status === 'CANCELLED' && (
          <View style={[styles.card, {borderColor: '#FCA5A5', backgroundColor: '#FEF2F2'}]}>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
              <Ionicons name="warning" size={20} color="#DC2626" />
              <Text style={styles.cancellationReasonTitle}>Cancellation Reason</Text>
            </View>
            <Text style={styles.cancellationReasonText}>
              {order.cancellationReason || 'No specific reason provided by the customer.'}
            </Text>
          </View>
        )}

        {/* Ordered Items */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Ordered Items</Text>
          {order.items.map((item: any, index: number) => {
            const imageUrl = item.imageUrl ? getProductImageUrl(item.imageUrl) : null;
            return (
              <View key={index} style={[styles.itemRow, index > 0 && styles.itemRowBorder]}>
                {imageUrl ? (
                  <Image source={{uri: imageUrl}} style={styles.itemImage} />
                ) : (
                  <View style={styles.placeholderImage}><Text>🌾</Text></View>
                )}
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.productName}</Text>
                  <Text style={styles.itemMeta}>{item.quantity} {item.unit} x ₹{item.price}</Text>
                </View>
                <Text style={styles.itemTotal}>₹{item.subtotal.toFixed(2)}</Text>
              </View>
            );
          })}
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{order.totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        <View style={{height: 100}} />
      </ScrollView>

      {/* Action Buttons */}
      {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
        <View style={styles.bottomBar}>
          {updating ? (
            <View style={{padding: 16, alignItems: 'center'}}>
              <ActivityIndicator color="#1B5E20" />
            </View>
          ) : (
            <View style={styles.actionsRow}>
              {getAvailableActions()}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4', // Cream green
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start', // Align left
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#2D983A',
  },
  backBtn: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  customerMobile: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 2,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  cancellationReasonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#991B1B',
    marginLeft: 8,
  },
  cancellationReasonText: {
    fontSize: 14,
    color: '#7F1D1D',
    lineHeight: 22,
    fontWeight: '500',
  },
  
  // Items
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  itemRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  placeholderImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  itemMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1B5E20',
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default FarmerOrderDetailsScreen;

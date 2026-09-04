import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {useAuth} from '../context/AuthContext';
import {getProductImageUrl} from '../services/productService';
import api from '../services/api';

const CheckoutScreen = ({route, navigation}: any) => {
  const {orderItems, totalAmount} = route.params || {};
  const {user} = useAuth();

  const [loading, setLoading] = useState(false);
  
  const [address, setAddress] = useState('');
  const [village, setVillage] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [state, setState] = useState('Maharashtra');

  if (!orderItems || orderItems.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No items to checkout.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handlePlaceOrder = async () => {
    if (!address.trim() || !village.trim() || !postalCode.trim() || !state.trim()) {
      Alert.alert('Missing Info', 'Please fill in all address fields.');
      return;
    }

    setLoading(true);
    try {
      const items = orderItems.map((item: any) => ({
        productId: item.product.productId,
        quantity: item.quantity,
      }));

      const payload = {
        paymentMethod: 'COD', // Assuming COD for now
        deliveryAddress: address,
        village,
        postalCode,
        state,
        items,
      };

      const response = await api.post('/order/create', payload);
      
      if (response.status === 201 || response.status === 200) {
        navigation.replace('OrderSuccess', {
          orderNumber: response.data.response.orderNumber,
          totalAmount: response.data.response.totalAmount,
        });
      } else {
        throw new Error('Unexpected response');
      }
    } catch (error: any) {
      console.log('Error placing order:', error.response?.data || error.message);
      Alert.alert(
        'Order Failed',
        error.response?.data?.message || 'Failed to place the order. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Order Items Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {orderItems.map((item: any, index: number) => {
            const imageUrl = item.product.productPhoto
              ? getProductImageUrl(item.product.productPhoto)
              : null;
            return (
              <View key={index} style={styles.itemCard}>
                {imageUrl ? (
                  <Image source={{uri: imageUrl}} style={styles.itemImage} />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Text>🌾</Text>
                  </View>
                )}
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.product.productName}</Text>
                  <Text style={styles.itemSub}>
                    {item.quantity} {item.product.unit} x ₹{item.product.price}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>
                  ₹{(item.product.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Delivery Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Address</Text>
              <TextInput
                style={styles.input}
                placeholder="House No, Street, Landmark"
                value={address}
                onChangeText={setAddress}
                multiline
              />
            </View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, {flex: 1, marginRight: 10}]}>
                <Text style={styles.label}>Village/City</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Village"
                  value={village}
                  onChangeText={setVillage}
                />
              </View>
              <View style={[styles.inputGroup, {flex: 1}]}>
                <Text style={styles.label}>Postal Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="PIN"
                  value={postalCode}
                  onChangeText={setPostalCode}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>State</Text>
              <TextInput
                style={styles.input}
                placeholder="State"
                value={state}
                onChangeText={setState}
              />
            </View>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={[styles.card, styles.paymentCard]}>
            <Ionicons name="cash-outline" size={24} color="#2563EB" style={{marginRight: 12}} />
            <Text style={styles.paymentText}>Cash on Delivery (COD)</Text>
            <Ionicons name="checkmark-circle" size={24} color="#2563EB" style={{marginLeft: 'auto'}} />
          </View>
        </View>

        <View style={{height: 100}} />
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomBar}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalAmount}>₹{totalAmount.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.placeOrderBtn, loading && {opacity: 0.7}]}
          onPress={handlePlaceOrder}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.placeOrderText}>Place Order</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#1E3A8A',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 16,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 12,
  },
  placeholderImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  itemSub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#2563EB',
    borderWidth: 1.5,
    backgroundColor: '#EFF6FF',
  },
  paymentText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  placeOrderBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  placeOrderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default CheckoutScreen;

import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useAuth} from '../context/AuthContext';
import {getProductImageUrl} from '../services/productService';

const ProductDetailScreen = ({route, navigation}: any) => {
  const {product} = route.params;
  const {user} = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [ordering, setOrdering] = useState(false);

  const imageUrl = product.productPhoto
    ? getProductImageUrl(product.productPhoto)
    : null;

  const handlePlaceOrder = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to place an order.');
      return;
    }

    setOrdering(true);
    try {
      const orderId = 'ord_' + Math.random().toString(36).substr(2, 9);
      const newOrder = {
        orderId,
        productId: product.productId,
        productName: product.productName,
        category: product.category,
        price: product.price,
        unit: product.unit,
        quantity,
        totalPrice: product.price * quantity,
        status: 'Pending',
        customerId: user.userId,
        customerName: user.name,
        farmerId: product.farmerId,
        orderDate: new Date().toISOString(),
      };

      const storedOrders = await AsyncStorage.getItem('@farm2home_orders');
      const parsedOrders = storedOrders ? JSON.parse(storedOrders) : [];
      parsedOrders.push(newOrder);
      await AsyncStorage.setItem('@farm2home_orders', JSON.stringify(parsedOrders));

      Alert.alert(
        'Order Placed! 🎉',
        `Successfully placed order for ${quantity} ${product.unit}(s) of ${product.productName}.`,
        [
          {
            text: 'View Orders',
            onPress: () => {
              navigation.navigate('Orders');
            },
          },
          {
            text: 'Continue Shopping',
            onPress: () => {
              navigation.goBack();
            },
          },
        ],
      );
    } catch (error) {
      console.log('Error placing order:', error);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setOrdering(false);
    }
  };

  const isCustomer = user?.role === 'USER';

  return (
    <View style={{flex: 1, backgroundColor: '#FFFFFF'}}>
      <ScrollView style={styles.container}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image source={{uri: imageUrl}} style={styles.image} />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderEmoji}>🌾</Text>
              <Text style={styles.placeholderText}>No image available</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoContainer}>
          {/* Category */}
          {product.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{product.category}</Text>
            </View>
          )}

          {/* Name & Price */}
          <Text style={styles.productName}>{product.productName}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>
              ₹{product.price?.toFixed(2) || '0.00'}
            </Text>
            {product.unit && (
              <Text style={styles.unit}>per {product.unit}</Text>
            )}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Farmer Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Farmer Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Name</Text>
              <Text style={styles.detailValue}>
                {product.farmerName || 'N/A'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>
                {product.farmerAddress || 'N/A'}
              </Text>
            </View>
          </View>

          {/* Description */}
          {product.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}

          {/* Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Active</Text>
              <Text
                style={[
                  styles.statusBadge,
                  product.isActive ? styles.activeBadge : styles.inactiveBadge,
                ]}>
                {product.isActive ? 'Yes' : 'No'}
              </Text>
            </View>
            {product.status && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status</Text>
                <Text style={styles.detailValue}>{product.status}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Customer Action Area */}
      {isCustomer && (
        <View style={styles.actionContainer}>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityBtn}
              onPress={() => setQuantity(q => Math.max(1, q - 1))}>
              <Text style={styles.quantityBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantityValue}>{quantity}</Text>
            <TouchableOpacity
              style={styles.quantityBtn}
              onPress={() => setQuantity(q => q + 1)}>
              <Text style={styles.quantityBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.buyBtn}
            onPress={handlePlaceOrder}
            disabled={ordering}>
            <Text style={styles.buyBtnText}>
              Place Order (₹{(product.price * quantity).toFixed(2)})
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  imageContainer: {
    height: 280,
    backgroundColor: '#F5F5F5',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
  },
  placeholderEmoji: {
    fontSize: 64,
  },
  placeholderText: {
    fontSize: 14,
    color: '#9E9E9E',
    marginTop: 8,
  },
  infoContainer: {
    padding: 20,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  categoryText: {
    color: '#1B5E20',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#212121',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1B5E20',
  },
  unit: {
    fontSize: 15,
    color: '#757575',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#424242',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  detailLabel: {
    fontSize: 14,
    color: '#757575',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    maxWidth: '60%',
    textAlign: 'right',
  },
  description: {
    fontSize: 14,
    color: '#616161',
    lineHeight: 22,
  },
  statusBadge: {
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  activeBadge: {
    backgroundColor: '#E8F5E9',
    color: '#1B5E20',
  },
  inactiveBadge: {
    backgroundColor: '#FFEBEE',
    color: '#D32F2F',
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    marginRight: 14,
  },
  quantityBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#616161',
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    paddingHorizontal: 12,
  },
  buyBtn: {
    flex: 1,
    backgroundColor: '#1B5E20',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ProductDetailScreen;

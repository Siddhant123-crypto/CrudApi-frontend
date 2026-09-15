import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CartItemResponse } from '../types';
import { BASE_URL } from '../services/api';
import QuantitySelector from './QuantitySelector';
import { useCart } from '../context/CartContext';
import { useNavigation } from '@react-navigation/native';
interface CartItemCardProps {
  item: CartItemResponse;
}
const CartItemCard: React.FC<CartItemCardProps> = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();
  const navigation = useNavigation<any>();
  const handleIncrease = () => {
    updateQuantity(item.productId, item.quantity + 1);
  };
  const handleDecrease = () => {
    if (item.quantity > 1) {
      updateQuantity(item.productId, item.quantity - 1);
    }
  };
  const handleRemove = () => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeFromCart(item.productId) }
      ]
    );
  };
  const handleProductPress = () => {
    const product = {
      productId: item.productId,
      productName: item.productName,
      price: item.price,
      unit: item.unit,
      productPhoto: item.imageUrl,
    };
    navigation.navigate('ProductDetail', { product });
  };
  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={handleProductPress} activeOpacity={0.9}>
        <Image
          source={
            item.imageUrl
              ? { uri: `${BASE_URL}/product/image/${item.imageUrl}` }
              : { uri: 'https://placehold.co/100x100/E8F5E2/2E9B32?text=Product' }
          }
          style={styles.image}
          resizeMode="cover"
        />
      </TouchableOpacity>
      <View style={styles.infoContainer}>
        <View style={styles.titleRow}>
          <TouchableOpacity onPress={handleProductPress} activeOpacity={0.7} style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={2}>{item.productName}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleRemove} style={styles.removeBtn}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleProductPress} activeOpacity={0.9}>
          <Text style={styles.unitText}>{item.unit}</Text>
          <Text style={styles.priceText}>₹{item.price}</Text>
        </TouchableOpacity>
        <View style={styles.bottomRow}>
          <QuantitySelector
            quantity={item.quantity}
            onIncrease={handleIncrease}
            onDecrease={handleDecrease}
          />
          <Text style={styles.subtotalText}>₹{item.subtotal}</Text>
        </View>
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginRight: 8,
  },
  removeBtn: {
    padding: 4,
  },
  unitText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E3A8A',
    marginTop: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  subtotalText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A8A',
  },
});
export default CartItemCard;

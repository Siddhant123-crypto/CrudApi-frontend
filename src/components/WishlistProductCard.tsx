import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { WishlistResponse } from '../types';
import { BASE_URL } from '../services/api';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { StarRating } from './reviews/StarRating';
interface WishlistProductCardProps {
  item: WishlistResponse;
  onPress: () => void;
}
const WishlistProductCard: React.FC<WishlistProductCardProps> = ({ item, onPress }) => {
  const { toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.95}>
      <View style={styles.imageContainer}>
        <Image
          source={
            item.productPhoto
              ? { uri: `${BASE_URL}/product/image/${item.productPhoto}` }
              : { uri: 'https://placehold.co/200x200/E8F5E2/2E9B32?text=Fresh' }
          }
          style={styles.image}
          resizeMode="cover"
        />
        <TouchableOpacity
          style={styles.heartBtn}
          onPress={() => toggleWishlist(item.productId)}
        >
          <Ionicons name="heart" size={22} color="#E53935" />
        </TouchableOpacity>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2}>{item.productName}</Text>
        <Text style={styles.category}>{item.category}</Text>
        <View style={styles.ratingRow}>
          <StarRating rating={Math.round(item.averageRating || 0)} size={12} disabled={true} />
          <Text style={styles.ratingText}> {item.averageRating ? item.averageRating.toFixed(1) : 'New'}</Text>
        </View>
        <View style={styles.bottomRow}>
          <Text style={styles.priceText}>
            ₹{item.price}
            <Text style={styles.unitText}> / {item.unit.toLowerCase()}</Text>
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addToCartBtn}
          onPress={() => addToCart(item.productId, 1)}
        >
          <Ionicons name="cart-outline" size={18} color="#FFFFFF" />
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    flex: 1,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 140,
    width: '100%',
    backgroundColor: '#F9F9F9',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  heartBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoContainer: {
    padding: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 11,
    color: '#757575',
    marginLeft: 4,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  unitText: {
    fontSize: 12,
    color: '#757575',
    fontWeight: 'normal',
  },
  addToCartBtn: {
    flexDirection: 'row',
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 6,
  },
});
export default WishlistProductCard;

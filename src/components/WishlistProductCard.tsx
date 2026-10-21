import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import Svg, { Defs, RadialGradient as SvgRadialGradient, Stop, Rect } from 'react-native-svg';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { WishlistResponse } from '../types';
import { BASE_URL } from '../services/api';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { StarRating } from './reviews/StarRating';
import { THEME } from '../constants/theme';
import { HeartIcon } from './CustomerIcons';

interface WishlistProductCardProps {
  item: WishlistResponse;
  onPress: () => void;
  onLongPress?: () => void;
  isSelected?: boolean;
}

const WishlistProductCard: React.FC<WishlistProductCardProps> = ({
  item,
  onPress,
  onLongPress,
  isSelected = false,
}) => {
  const { toggleWishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleAddToCart = async () => {
    const success = await addToCart(item.productId, 1);
    if (success) {
      await removeFromWishlist(item.productId, false);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        THEME.shadows.card,
        isSelected && styles.selectedCard,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.92}
    >
      {/* Image tile with radial peach gradient */}
      <View style={styles.imageContainer}>
        <Svg width="100%" height={126} style={StyleSheet.absoluteFillObject}>
          <Defs>
            <SvgRadialGradient
              id={`wishGrad-${item.productId}`}
              cx="0.5"
              cy="0.38"
              r="0.6"
            >
              <Stop offset="0%" stopColor={THEME.colors.tileRadialStart} />
              <Stop offset="55%" stopColor={THEME.colors.tileRadialMiddle} />
              <Stop offset="100%" stopColor={THEME.colors.tileRadialEnd} />
            </SvgRadialGradient>
          </Defs>
          <Rect
            x={0}
            y={0}
            width="100%"
            height={126}
            fill={`url(#wishGrad-${item.productId})`}
          />
        </Svg>

        <Image
          source={
            item.productPhoto
              ? { uri: `${BASE_URL}/product/image/${item.productPhoto}` }
              : { uri: 'https://placehold.co/200x200/FFF1DE/B8470F?text=Fresh' }
          }
          style={styles.image}
          resizeMode="contain"
        />

        <TouchableOpacity
          style={styles.heartBtn}
          onPress={() => toggleWishlist(item.productId)}
          activeOpacity={0.8}
        >
          <HeartIcon size={17} color={THEME.colors.heartActive} fill={THEME.colors.heartActive} />
        </TouchableOpacity>

        {isSelected && (
          <View style={styles.checkmarkContainer}>
            <Ionicons name="checkmark-circle" size={24} color={THEME.colors.success} />
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {item.productName}
        </Text>
        <Text style={styles.category} numberOfLines={1}>
          {item.category}
        </Text>

        <View style={styles.ratingRow}>
          <StarRating rating={Math.round(item.averageRating || 0)} size={11} disabled={true} variant="customer" />
          <Text style={styles.ratingText}>
            {' '}{item.averageRating ? item.averageRating.toFixed(1) : '4.0'}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.priceText}>
            ₹{item.price}
            <Text style={styles.unitText}> / {item.unit?.toLowerCase()}</Text>
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addToCartBtn}
          onPress={handleAddToCart}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={THEME.colors.ctaOrangeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addToCartGradient}
          >
            <Ionicons name="cart-outline" size={16} color={THEME.colors.white} style={{ marginRight: 6 }} />
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.cardBg,
    borderRadius: THEME.radius.cards,
    marginBottom: 12,
    flex: 1,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    overflow: 'hidden',
    padding: 8,
  },
  selectedCard: {
    borderColor: THEME.colors.accent,
    borderWidth: 2,
    backgroundColor: THEME.colors.selectedBg,
  },
  imageContainer: {
    position: 'relative',
    height: 126,
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 90,
    height: 76,
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: THEME.colors.white,
    borderRadius: 12,
  },
  infoContainer: {
    paddingTop: 10,
    paddingHorizontal: 4,
  },
  title: {
    fontFamily: THEME.fonts.bold,
    fontSize: 14.5,
    color: THEME.colors.textHeading,
    marginBottom: 2,
  },
  category: {
    fontFamily: THEME.fonts.semiBold,
    fontSize: 11,
    color: THEME.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginLeft: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  priceText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 17,
    color: THEME.colors.textBase,
  },
  unitText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12,
    color: THEME.colors.textSecondary,
  },
  addToCartBtn: {
    height: 38,
    borderRadius: THEME.radius.smallButtons,
    overflow: 'hidden',
  },
  addToCartGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 13,
    color: THEME.colors.white,
  },
});

export default WishlistProductCard;

import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import Svg, { Defs, RadialGradient as SvgRadialGradient, Stop, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { getProductImageUrl } from '../services/productService';
import { Product } from '../types';
import { formatAddedTime } from '../utils/dateUtils';
import { THEME } from '../constants/theme';
import { HeartIcon, PlusIcon } from './CustomerIcons';

interface ProductCardProps {
  product: Product | any;
  onPress: () => void;
  variant?: 'default' | 'customer';
  onWishlistToggle?: () => void;
  isWishlisted?: boolean;
  onAddToCart?: () => void;
}

const formatDisplayPrice = (val: any) => {
  const num = Number(val);
  if (isNaN(num)) return val ?? '0';
  if (num % 1 === 0) {
    return String(Math.round(num));
  }
  return num.toFixed(2).replace(/\.00$/, '').replace(/(\.[0-9])0$/, '$1');
};

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  variant = 'default',
  onWishlistToggle,
  isWishlisted = false,
  onAddToCart,
}) => {
  const imageUrl = product.productPhoto
    ? getProductImageUrl(product.productPhoto)
    : product.imageUrl
    ? getProductImageUrl(product.imageUrl)
    : null;
  const addedTimeStr = formatAddedTime(product.createdOn, product.addedTime);

  // ─── CUSTOMER DASHBOARD THEMED VARIANT ───────────────────────────────────
  if (variant === 'customer') {
    return (
      <TouchableOpacity
        style={styles.customerCard}
        onPress={onPress}
        activeOpacity={0.88}
      >
        {/* Image Tile with peach radial gradient */}
        <View style={styles.customerImageTile}>
          <Svg width="100%" height={126} style={StyleSheet.absoluteFillObject}>
            <Defs>
              <SvgRadialGradient
                id={`prodGrad-${product.productId}`}
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
              fill={`url(#prodGrad-${product.productId})`}
            />
          </Svg>

          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.customerProductImage}
              resizeMode="contain"
            />
          ) : (
            <Text style={{ fontSize: 46 }}>🌱</Text>
          )}

          {/* Wishlist Heart Button */}
          {onWishlistToggle && (
            <TouchableOpacity
              style={styles.customerHeartButton}
              onPress={onWishlistToggle}
              activeOpacity={0.8}
            >
              <HeartIcon
                size={17}
                color={THEME.colors.accent}
                strokeWidth={1.9}
                fill={isWishlisted ? THEME.colors.accent : 'none'}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Product Name */}
        <Text style={styles.customerProductName} numberOfLines={1}>
          {product.productName}
        </Text>

        {/* Unit */}
        <Text style={styles.customerProductUnit}>
          1 {product.unit || 'KG'}
        </Text>

        {/* Bottom Row: Price + Rating & Add button */}
        <View style={styles.customerBottomRow}>
          <View style={styles.customerPriceColumn}>
            <Text
              style={styles.customerPrice}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              ₹{formatDisplayPrice(product.price)}
            </Text>
            <View style={styles.customerRatingRow}>
              <Text style={styles.customerRatingStar}>★</Text>
              <Text style={styles.customerRatingText}>
                {' '}{product.averageRating ? product.averageRating.toFixed(1) : '4.0'}
              </Text>
            </View>
          </View>

          {/* Add Button */}
          {onAddToCart && (
            <TouchableOpacity
              style={styles.customerAddButton}
              onPress={onAddToCart}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={THEME.colors.ctaOrangeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.customerAddGradient}
              >
                <PlusIcon size={18} color={THEME.colors.white} strokeWidth={2.4} />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // ─── DEFAULT VARIANT (Farmer & Other Screens Unchanged) ─────────────────
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>🌾</Text>
          </View>
        )}
        {product.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{product.category}</Text>
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.productName} numberOfLines={1}>
          {product.productName}
        </Text>
        {product.farmerName && (
          <Text style={styles.farmerName} numberOfLines={1}>
            by {product.farmerName}
          </Text>
        )}
        {addedTimeStr && (
          <Text style={styles.addedTimeText} numberOfLines={1}>
            Added: {addedTimeStr}
          </Text>
        )}
        <View style={styles.priceRow}>
          <Text style={styles.price} numberOfLines={1}>
            ₹{formatDisplayPrice(product.price)}
          </Text>
          {product.unit && (
            <Text style={styles.unit}>/ {product.unit}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Default variant styles
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    marginHorizontal: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    flex: 1,
  },
  imageContainer: {
    height: 140,
    backgroundColor: '#F5F5F5',
    position: 'relative',
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
    backgroundColor: '#EFF6FF',
  },
  placeholderText: {
    fontSize: 40,
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(30, 58, 138, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoContainer: {
    padding: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  farmerName: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  addedTimeText: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  unit: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 4,
  },

  // Customer themed variant styles (exact match to dashboard)
  customerCard: {
    flex: 1,
    margin: 6,
    padding: 10,
    borderRadius: THEME.radius.cards,
    backgroundColor: THEME.colors.cardBg,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    ...THEME.shadows.card,
  },
  customerImageTile: {
    height: 126,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerProductImage: {
    width: 100,
    height: 80,
  },
  customerHeartButton: {
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
        shadowOpacity: 0.10,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  customerProductName: {
    fontFamily: THEME.fonts.bold,
    fontSize: 15,
    color: THEME.colors.textHeading,
    marginTop: 10,
    marginHorizontal: 2,
  },
  customerProductUnit: {
    fontFamily: THEME.fonts.semiBold,
    fontSize: 11.5,
    letterSpacing: 0.46,
    color: THEME.colors.textMuted,
    textTransform: 'uppercase',
    marginTop: 2,
    marginHorizontal: 2,
  },
  customerBottomRow: {
    marginTop: 8,
    marginHorizontal: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  customerPriceColumn: {
    flex: 1,
  },
  customerPrice: {
    fontFamily: THEME.fonts.bold,
    fontSize: 18,
    color: THEME.colors.textBase,
  },
  customerRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  customerRatingStar: {
    fontSize: 12,
    color: THEME.colors.star,
  },
  customerRatingText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12,
    color: THEME.colors.textSecondary,
  },
  customerAddButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    overflow: 'hidden',
    ...THEME.shadows.primaryButton,
  },
  customerAddGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ProductCard;

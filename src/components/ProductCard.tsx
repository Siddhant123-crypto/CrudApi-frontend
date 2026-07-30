import React from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet} from 'react-native';
import {getProductImageUrl} from '../services/productService';
import {Product} from '../types';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({product, onPress}) => {
  const imageUrl = product.productPhoto
    ? getProductImageUrl(product.productPhoto)
    : null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}>
      {/* Product Image */}
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={{uri: imageUrl}} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>🌾</Text>
          </View>
        )}
        {/* Category Badge */}
        {product.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{product.category}</Text>
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.productName} numberOfLines={1}>
          {product.productName}
        </Text>

        {product.farmerName && (
          <Text style={styles.farmerName} numberOfLines={1}>
            by {product.farmerName}
          </Text>
        )}

        <View style={styles.priceRow}>
          <Text style={styles.price}>
            ₹{product.price?.toFixed(2) || '0.00'}
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    marginHorizontal: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
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
    backgroundColor: '#E8F5E9',
  },
  placeholderText: {
    fontSize: 40,
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(27, 94, 32, 0.85)',
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
    color: '#212121',
    marginBottom: 4,
  },
  farmerName: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1B5E20',
  },
  unit: {
    fontSize: 13,
    color: '#757575',
    marginLeft: 4,
  },
});

export default ProductCard;

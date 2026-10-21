import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CartItemResponse } from '../types';
import { BASE_URL } from '../services/api';
import QuantitySelector from './QuantitySelector';
import { useCart } from '../context/CartContext';
import { useNavigation } from '@react-navigation/native';
import { THEME } from '../constants/theme';
import { Card } from './ui/Card';

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
        { text: 'Remove', style: 'destructive', onPress: () => removeFromCart(item.productId) },
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
    <Card style={styles.card}>
      <TouchableOpacity
        onPress={handleProductPress}
        activeOpacity={0.9}
        style={styles.imageTileContainer}
      >
        <Svg width={84} height={84} style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id={`cartRadial-${item.productId}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={THEME.colors.tileRadialStart} />
              <Stop offset="65%" stopColor={THEME.colors.tileRadialMiddle} />
              <Stop offset="100%" stopColor={THEME.colors.tileRadialEnd} />
            </RadialGradient>
          </Defs>
          <Rect
            x="0"
            y="0"
            width="84"
            height="84"
            rx="18"
            fill={`url(#cartRadial-${item.productId})`}
          />
        </Svg>
        <Image
          source={
            item.imageUrl
              ? { uri: `${BASE_URL}/product/image/${item.imageUrl}` }
              : { uri: 'https://placehold.co/100x100/FFF1DE/B8470F?text=Product' }
          }
          style={styles.image}
          resizeMode="cover"
        />
      </TouchableOpacity>

      <View style={styles.infoContainer}>
        <View style={styles.titleRow}>
          <TouchableOpacity
            onPress={handleProductPress}
            activeOpacity={0.7}
            style={{ flex: 1 }}
          >
            <Text style={styles.title} numberOfLines={2}>
              {item.productName}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleRemove}
            style={styles.removeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={19} color={THEME.colors.error} />
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
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 14,
    marginBottom: 14,
    borderRadius: THEME.radius.cards,
  },
  imageTileContainer: {
    width: 84,
    height: 84,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  image: {
    width: '100%',
    height: '100%',
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
    fontFamily: THEME.fonts.bold,
    fontSize: 15,
    color: THEME.colors.textHeading,
    marginRight: 6,
  },
  removeBtn: {
    padding: 2,
  },
  unitText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12.5,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  priceText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 15,
    color: THEME.colors.accent,
    marginTop: 3,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  subtotalText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 16,
    color: THEME.colors.textBase,
  },
});

export default CartItemCard;

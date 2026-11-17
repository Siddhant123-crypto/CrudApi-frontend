import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import CartItemCard from '../components/CartItemCard';
import EmptyState from '../components/EmptyState';
import { useNavigation } from '@react-navigation/native';
import { THEME } from '../constants/theme';
import { PageBackground } from '../components/ui/PageBackground';
import { ThemedHeader } from '../components/ui/ThemedHeader';
import { Card } from '../components/ui/Card';
import { StickyCheckoutBar } from '../components/ui/StickyCheckoutBar';
import { formatCurrency, formatNumber } from '../utils/formatters';

const CartScreen = () => {
  const { t } = useTranslation();
  const { cart, isLoading, refreshCart, clearCart } = useCart();
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshCart();
    setRefreshing(false);
  };

  const handleClearCart = () => {
    Alert.alert(
      t('cart.clearCartTitle', 'Clear Cart'),
      t('cart.clearCartConfirm', 'Are you sure you want to remove all items from your cart?'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        { text: t('cart.clearAll', 'Clear All'), style: 'destructive', onPress: clearCart },
      ]
    );
  };

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) return;
    navigation.navigate('Checkout', {
      orderItems: cart.items.map(item => ({
        product: {
          productId: item.productId,
          productName: item.productName,
          price: item.price,
          unit: item.unit,
          productPhoto: item.imageUrl,
        },
        quantity: item.quantity,
      })),
      totalAmount: cart.totalAmount,
    });
  };

  if (isLoading && !refreshing && !cart) {
    return (
      <PageBackground>
        <ThemedHeader title={t('cart.myCart', 'My Cart')} titleAlign="left" titleStyle={styles.headerTitle} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.colors.accentDeep} />
        </View>
      </PageBackground>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <PageBackground>
        <ThemedHeader title={t('cart.myCart', 'My Cart')} titleAlign="left" titleStyle={styles.headerTitle} />
        <EmptyState
          title={t('cart.emptyCartTitle', 'Your cart is empty')}
          subtitle={t('cart.emptyCartSubtitle', "Looks like you haven't added anything to your cart yet.")}
          buttonText={t('cart.startShopping', 'Start Shopping')}
          onButtonPress={() => navigation.navigate('Home')}
          iconName="cart-outline"
        />
      </PageBackground>
    );
  }

  return (
    <PageBackground>
      <ThemedHeader
        title={t('cart.myCart', 'My Cart')}
        titleAlign="left"
        titleStyle={styles.headerTitle}
        rightIcon={<Ionicons name="trash-outline" size={20} color={THEME.colors.white} />}
        onRightPress={handleClearCart}
      />

      <FlatList
        data={cart.items}
        keyExtractor={item => item.cartItemId}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <CartItemCard item={item} />}
        ListFooterComponent={
          <Card style={styles.billCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('cart.totalItems', 'Total Items')}</Text>
              <Text style={styles.summaryValue}>{formatNumber(cart.totalItems)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>{t('cart.subtotal', 'Subtotal')}</Text>
              <Text style={styles.totalValue}>{formatCurrency(cart.totalAmount)}</Text>
            </View>
          </Card>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[THEME.colors.accentDeep]}
          />
        }
      />

      <StickyCheckoutBar
        label={t('cart.totalAmount', 'Total Amount')}
        total={cart.totalAmount}
        buttonTitle={t('cart.checkout', 'Checkout')}
        onPress={handleCheckout}
      />
    </PageBackground>
  );
};

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: THEME.spacing.pageHorizontal,
    paddingTop: 16,
    paddingBottom: 40,
  },
  billCard: {
    marginTop: 8,
    marginBottom: 16,
    padding: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontFamily: THEME.fonts.medium,
    fontSize: 14,
    color: THEME.colors.textSecondary,
  },
  summaryValue: {
    fontFamily: THEME.fonts.bold,
    fontSize: 14,
    color: THEME.colors.textHeading,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.divider,
    marginVertical: 10,
  },
  totalRow: {
    paddingTop: 4,
  },
  totalLabel: {
    fontFamily: THEME.fonts.serif,
    fontSize: 18,
    color: THEME.colors.textHeading,
  },
  totalValue: {
    fontFamily: THEME.fonts.bold,
    fontSize: 20,
    color: THEME.colors.textBase,
  },
});

export default CartScreen;

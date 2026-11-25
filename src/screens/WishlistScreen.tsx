import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { cartService } from '../services/cartService';
import { wishlistService } from '../services/wishlistService';
import WishlistProductCard from '../components/WishlistProductCard';
import EmptyState from '../components/EmptyState';
import SuccessModal from '../components/SuccessModal';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { THEME } from '../constants/theme';
import { PageBackground } from '../components/ui/PageBackground';
import { ThemedHeader } from '../components/ui/ThemedHeader';

const WishlistScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { wishlist, isLoading, refreshWishlist } = useWishlist();
  const { refreshCart, cartCount } = useCart();
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useFocusEffect(
    useCallback(() => {
      refreshWishlist();
    }, [refreshWishlist])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshWishlist();
    setSelectedProducts([]);
    setRefreshing(false);
  };

  const navigateToProduct = (product: any) => {
    navigation.navigate('ProductDetail', { product });
  };

  const toggleSelection = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handlePressProduct = (item: any) => {
    if (selectedProducts.length > 0) {
      toggleSelection(item.productId);
    } else {
      navigateToProduct(item);
    }
  };

  const handleLongPressProduct = (item: any) => {
    if (selectedProducts.length === 0) {
      toggleSelection(item.productId);
    }
  };

  const handleAddSelectedToCart = async () => {
    setMenuVisible(false);
    if (selectedProducts.length === 0 || isProcessing) return;

    setIsProcessing(true);
    try {
      let addedCount = 0;
      let lastErrorMessage = '';

      for (let i = 0; i < selectedProducts.length; i++) {
        const id = selectedProducts[i];
        try {
          await cartService.addToCart(id, 1);
          try {
            await wishlistService.removeFromWishlist(id);
          } catch (removeErr) {
            console.log('Error removing added item from wishlist:', removeErr);
          }
          addedCount++;
        } catch (addErr: any) {
          console.log('Error adding wishlist item to cart:', id, addErr?.response?.data || addErr);
          lastErrorMessage =
            addErr?.response?.data?.message ||
            addErr?.response?.data?.error ||
            lastErrorMessage;
        }
      }

      if (addedCount > 0) {
        await Promise.all([refreshCart(), refreshWishlist()]);
        setSuccessMessage(
          t('wishlist.itemsAdded', {
            count: addedCount,
            defaultValue: `${addedCount} items have been added to your cart successfully!`
          })
        );
        setShowSuccessModal(true);
      } else {
        await refreshWishlist();
        Alert.alert(
          t('common.error', 'Error'),
          lastErrorMessage || t('cart.failedAddToCart', 'Failed to add items to cart.')
        );
      }
      setSelectedProducts([]);
    } catch (error: any) {
      console.log('Error bulk adding to cart', error);
      Alert.alert(
        t('common.error', 'Error'),
        error?.response?.data?.message || t('cart.failedAddToCart', 'Failed to add some items to cart.')
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteSelectedFromWishlist = async () => {
    setMenuVisible(false);
    if (selectedProducts.length === 0 || isProcessing) return;
    setIsProcessing(true);
    try {
      let deletedCount = 0;
      for (let i = 0; i < selectedProducts.length; i++) {
        const id = selectedProducts[i];
        try {
          await wishlistService.removeFromWishlist(id);
          deletedCount++;
        } catch (err) {
          console.log('Error removing item from wishlist:', id, err);
        }
      }

      await refreshWishlist();
      setSelectedProducts([]);

      if (deletedCount > 0) {
        setSuccessMessage(t('wishlist.removedSuccess', 'Removed from product wishlist'));
        setShowSuccessModal(true);
      } else {
        Alert.alert(t('common.error', 'Error'), t('wishlist.removeFailed', 'Failed to remove from wishlist'));
      }
    } catch (error) {
      console.log('Error bulk deleting wishlist items:', error);
      Alert.alert(t('common.error', 'Error'), t('wishlist.removeFailed', 'Failed to remove from wishlist'));
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading && !refreshing && wishlist.length === 0) {
    return (
      <PageBackground>
        <ThemedHeader
          variant="tab"
          title={t('wishlist.title', 'Wishlist')}
          subtitle={t('wishlist.subtitle', 'Your saved favorites')}
          titleStyle={{ fontSize: 21 }}
          showCart
          cartCount={cartCount}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.colors.accentDeep} />
        </View>
      </PageBackground>
    );
  }

  if (wishlist.length === 0) {
    return (
      <PageBackground>
        <ThemedHeader
          variant="tab"
          title={t('wishlist.title', 'Wishlist')}
          subtitle={t('wishlist.subtitle', 'Your saved favorites')}
          titleStyle={{ fontSize: 21 }}
          showCart
          cartCount={cartCount}
        />
        <EmptyState
          title={t('wishlist.emptyTitle', 'Your wishlist is empty')}
          subtitle={t('wishlist.emptySubtitle', 'Save your favorite farm fresh products here for later.')}
          buttonText={t('wishlist.exploreProducts', 'Explore Products')}
          onButtonPress={() => navigation.navigate('Home')}
          iconName="heart-outline"
        />
      </PageBackground>
    );
  }

  const headerRightAction =
    selectedProducts.length > 0 ? (
      <TouchableOpacity
        style={styles.menuTriggerBtn}
        onPress={() => setMenuVisible(true)}
        disabled={isProcessing}
        activeOpacity={0.8}
        accessibilityRole="button"
      >
        {isProcessing ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Ionicons name="ellipsis-vertical" size={22} color="#FFFFFF" />
        )}
      </TouchableOpacity>
    ) : null;

  return (
    <PageBackground>
      <ThemedHeader
        variant="tab"
        title={selectedProducts.length > 0 ? t('wishlist.selectedCount', { count: selectedProducts.length, defaultValue: `${selectedProducts.length} Selected` }) : t('wishlist.title', 'Wishlist')}
        subtitle={selectedProducts.length > 0 ? t('wishlist.bulkActions', 'Bulk actions available') : t('wishlist.subtitle', 'Your saved favorites')}
        titleStyle={{ fontSize: 21 }}
        rightAction={headerRightAction}
        showCart={selectedProducts.length === 0}
        cartCount={cartCount}
        showBell={selectedProducts.length === 0}
      />

      <FlatList
        data={wishlist}
        keyExtractor={item => item.wishlistId}
        contentContainerStyle={styles.listContent}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <WishlistProductCard
            item={item}
            onPress={() => handlePressProduct(item)}
            onLongPress={() => handleLongPressProduct(item)}
            isSelected={selectedProducts.includes(item.productId)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[THEME.colors.accentDeep]}
          />
        }
      />

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.dropdownBackdrop} onPress={() => setMenuVisible(false)}>
          <View style={[styles.dropdownMenu, { top: insets.top + 56 }]}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={handleAddSelectedToCart}
              activeOpacity={0.75}
            >
              <Ionicons
                name="cart-outline"
                size={19}
                color={THEME.colors.accentDeep}
                style={styles.dropdownIcon}
              />
              <Text style={styles.dropdownItemText}>
                {t('product.addToCart', 'Add to Cart')}
              </Text>
            </TouchableOpacity>

            <View style={styles.dropdownDivider} />

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={handleDeleteSelectedFromWishlist}
              activeOpacity={0.75}
            >
              <Ionicons name="trash-outline" size={19} color="#DC2626" style={styles.dropdownIcon} />
              <Text style={[styles.dropdownItemText, styles.dropdownDeleteText]}>
                {t('common.delete', 'Delete')}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <SuccessModal
        visible={showSuccessModal}
        message={successMessage}
        onClose={() => setShowSuccessModal(false)}
      />
    </PageBackground>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 15,
    paddingTop: 16,
    paddingBottom: 130, // Space for bottom navigation bar
  },
  menuTriggerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  dropdownMenu: {
    position: 'absolute',
    right: 16,
    minWidth: 185,
    backgroundColor: '#FFFDF8',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0E1CF',
    paddingVertical: 6,
    shadowColor: '#2B1105',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  dropdownIcon: {
    marginRight: 12,
  },
  dropdownItemText: {
    fontFamily: THEME.fonts.semiBold,
    fontSize: 14.5,
    color: '#3B1A0E',
  },
  dropdownDeleteText: {
    color: '#DC2626',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#F0E1CF',
    marginHorizontal: 12,
  },
});

export default WishlistScreen;

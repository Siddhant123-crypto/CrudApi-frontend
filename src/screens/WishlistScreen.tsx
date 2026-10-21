import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import WishlistProductCard from '../components/WishlistProductCard';
import EmptyState from '../components/EmptyState';
import SuccessModal from '../components/SuccessModal';
import { useNavigation } from '@react-navigation/native';
import { THEME } from '../constants/theme';
import { PageBackground } from '../components/ui/PageBackground';
import { ThemedHeader } from '../components/ui/ThemedHeader';
import { GoldButton } from '../components/ui/Buttons';

const WishlistScreen = () => {
  const { wishlist, isLoading, refreshWishlist, removeFromWishlist } = useWishlist();
  const { addToCart, cartCount } = useCart();
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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
    if (selectedProducts.length === 0) return;
    setIsAdding(true);
    try {
      let addedCount = 0;
      for (let i = 0; i < selectedProducts.length; i++) {
        const id = selectedProducts[i];
        const success = await addToCart(id, 1, false);
        if (success) {
          await removeFromWishlist(id, false);
          addedCount++;
        }
      }

      if (addedCount > 0) {
        setSuccessMessage(`${addedCount} items have been added to your cart successfully!`);
        setShowSuccessModal(true);
      } else {
        Alert.alert('Error', 'Failed to add items to cart.');
      }
      setSelectedProducts([]);
    } catch (error) {
      console.log('Error bulk adding to cart', error);
      Alert.alert('Error', 'Failed to add some items to cart.');
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading && !refreshing && wishlist.length === 0) {
    return (
      <PageBackground>
        <ThemedHeader
          variant="tab"
          title="Wishlist"
          subtitle="Your saved favorites"
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
          title="Wishlist"
          subtitle="Your saved favorites"
          titleStyle={{ fontSize: 21 }}
          showCart
          cartCount={cartCount}
        />
        <EmptyState
          title="Your wishlist is empty"
          subtitle="Save your favorite farm fresh products here for later."
          buttonText="Explore Products"
          onButtonPress={() => navigation.navigate('Home')}
          iconName="heart-outline"
        />
      </PageBackground>
    );
  }

  const headerRightAction =
    selectedProducts.length > 0 ? (
      <GoldButton
        title={isAdding ? 'Adding...' : `Add (${selectedProducts.length})`}
        onPress={handleAddSelectedToCart}
        disabled={isAdding}
      />
    ) : null;

  return (
    <PageBackground>
      <ThemedHeader
        variant="tab"
        title={selectedProducts.length > 0 ? `${selectedProducts.length} Selected` : 'Wishlist'}
        subtitle={selectedProducts.length > 0 ? 'Bulk actions available' : 'Your saved favorites'}
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
});

export default WishlistScreen;

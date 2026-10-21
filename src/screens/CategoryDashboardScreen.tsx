import React, { useState, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../services/api';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { THEME } from '../constants/theme';
import { PageBackground } from '../components/ui/PageBackground';
import { ThemedHeader } from '../components/ui/ThemedHeader';
import { ThemedChip } from '../components/ui/ThemedChip';
import { ThemedEmptyState } from '../components/ui/ThemedEmptyState';
import ProductCard from '../components/ProductCard';
import { SearchIcon, CloseIcon } from '../components/CustomerIcons';

const PRICE_PRESETS = [
  { label: 'All', min: 0, max: 99999 },
  { label: '₹10–50', min: 10, max: 50 },
  { label: '₹50–100', min: 50, max: 100 },
  { label: '₹100–200', min: 100, max: 200 },
  { label: '₹200–500', min: 200, max: 500 },
  { label: '₹500–1000', min: 500, max: 1000 },
  { label: '₹1000+', min: 1000, max: 99999 },
];

interface ProductItem {
  productId: string;
  productName: string;
  price: number;
  productPhoto: string | null;
  status: string;
  isDelete: boolean;
  category: string;
  farmerName?: string;
  qty?: number;
  unit?: string;
  averageRating?: number;
  reviewCount?: number;
}

export default function CategoryDashboardScreen({ route, navigation }: any) {
  const { category } = route.params;
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToCart, cartCount } = useCart();
  const [allProducts, setAllProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [activePriceIndex, setActivePriceIndex] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      fetchCategoryProducts();
    }, [category])
  );

  const fetchCategoryProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/product/getAll');
      const raw: ProductItem[] = Array.isArray(response.data) ? response.data : [];
      const visible = raw.filter(
        p =>
          p.isDelete !== true &&
          p.status !== 'DELETED' &&
          (category === 'All Products' || p.category?.toLowerCase() === category.toLowerCase())
      );
      setAllProducts(visible);
    } catch (error) {
      console.log(`Error fetching products for ${category}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const openProduct = (productId: string) => {
    const product = allProducts.find(p => p.productId === productId);
    if (product) {
      if (product.status === 'INACTIVE') {
        Alert.alert('Inactive', 'This product is inactive');
        return;
      }
      navigation.navigate('ProductDetail', { product });
    }
  };

  const activePreset = PRICE_PRESETS[activePriceIndex];
  const displayedProducts = allProducts.filter(p => {
    const name = p.productName || '';
    const farmer = p.farmerName || '';
    const searchTerm = searchText.toLowerCase();
    const matchesSearch =
      name.toLowerCase().includes(searchTerm) || farmer.toLowerCase().includes(searchTerm);
    const inPriceRange = p.price >= activePreset.min && p.price <= activePreset.max;
    return matchesSearch && inPriceRange;
  });

  return (
    <PageBackground>
      <ThemedHeader
        title={category}
        titleAlign="left"
        showCart
        cartCount={cartCount}
        onCartPress={() => navigation.navigate('Cart')}
      />

      {/* Search Input */}
      <View style={styles.searchWrapper}>
        <View style={[styles.searchContainer, searchFocused && styles.searchContainerFocused]}>
          <SearchIcon size={18} color={THEME.colors.textMuted} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search in ${category}...`}
            placeholderTextColor={THEME.colors.placeholder}
            value={searchText}
            onChangeText={setSearchText}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearBtn}>
              <CloseIcon size={16} color={THEME.colors.textMuted} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Price Presets */}
      <View style={styles.priceFilterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.priceChipsScroll}
        >
          {PRICE_PRESETS.map((preset, index) => (
            <ThemedChip
              key={preset.label}
              label={preset.label}
              selected={index === activePriceIndex}
              onPress={() => setActivePriceIndex(index)}
              style={styles.chipSpacing}
            />
          ))}
        </ScrollView>
      </View>

      {/* Results Count Bar */}
      <View style={styles.resultsBar}>
        <Text style={styles.resultsText}>
          {displayedProducts.length} product{displayedProducts.length !== 1 ? 's' : ''} available
        </Text>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={THEME.colors.accentDeep} />
        </View>
      ) : displayedProducts.length === 0 ? (
        <ThemedEmptyState
          icon={<Ionicons name="basket-outline" size={48} color={THEME.colors.accent} />}
          title="No products found"
          subtitle="Try adjusting your search or price filters"
          buttonTitle="Clear Filters"
          onButtonPress={() => {
            setSearchText('');
            setActivePriceIndex(0);
          }}
        />
      ) : (
        <FlatList
          data={displayedProducts}
          keyExtractor={item => item.productId}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              variant="customer"
              onPress={() => openProduct(item.productId)}
              onWishlistToggle={() => toggleWishlist(item.productId)}
              isWishlisted={isInWishlist(item.productId)}
              onAddToCart={() => addToCart(item.productId, 1)}
            />
          )}
        />
      )}
    </PageBackground>
  );
}

const styles = StyleSheet.create({
  searchWrapper: {
    paddingHorizontal: THEME.spacing.pageHorizontal,
    marginTop: 14,
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: THEME.radius.inputs,
    backgroundColor: THEME.colors.cardBg,
    borderWidth: 1.5,
    borderColor: THEME.colors.inputBorder,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchContainerFocused: {
    borderColor: THEME.colors.inputBorderFocused,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: THEME.fonts.medium,
    fontSize: 14,
    color: THEME.colors.textBase,
  },
  clearBtn: {
    padding: 4,
  },
  priceFilterWrapper: {
    marginBottom: 8,
  },
  priceChipsScroll: {
    paddingHorizontal: THEME.spacing.pageHorizontal,
    gap: 8,
  },
  chipSpacing: {
    marginRight: 6,
  },
  resultsBar: {
    paddingHorizontal: THEME.spacing.pageHorizontal,
    marginBottom: 8,
  },
  resultsText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12.5,
    color: THEME.colors.textSecondary,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 40,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

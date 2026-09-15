import React, { useState, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api, { BASE_URL } from '../services/api';
import { StarRating } from '../components/reviews/StarRating';
import { useWishlist } from '../context/WishlistContext';
const { width } = Dimensions.get('window');
const PRODUCT_CARD_WIDTH = width / 2 - 24;
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
  const [allProducts, setAllProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [activePriceIndex, setActivePriceIndex] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: category,
      headerStyle: {
        backgroundColor: '#1E3A8A',
        elevation: 6,
        shadowColor: '#1E3A8A',
        shadowOpacity: 0.3,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
      },
    });
  }, [navigation, category]);
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
          p.category?.toLowerCase() === category.toLowerCase()
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
    const matchesSearch = name.toLowerCase().includes(searchText.toLowerCase());
    const inPriceRange = p.price >= activePreset.min && p.price <= activePreset.max;
    return matchesSearch && inPriceRange;
  });
  const renderProduct = ({ item }: { item: ProductItem }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.productCard}
      onPress={() => openProduct(item.productId)}
    >
      {item.status === 'INACTIVE' && (
        <View style={styles.inactiveLabel}>
          <Text style={styles.inactiveLabelText}>Inactive</Text>
        </View>
      )}
      <View style={styles.imageContainer}>
        <Image
          source={
            item.productPhoto
              ? { uri: `${BASE_URL}/product/image/${item.productPhoto}` }
              : require('../../assets/adaptive-icon.png')
          }
          style={styles.productImage}
          resizeMode="cover"
        />
        <View style={styles.freshTag}>
          <Text style={styles.freshTagText}>Fresh</Text>
        </View>
        <TouchableOpacity
          style={styles.heartIcon}
          onPress={() => toggleWishlist(item.productId)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isInWishlist(item.productId) ? "heart" : "heart-outline"}
            size={18}
            color={isInWishlist(item.productId) ? "#E53935" : "#E74C3C"}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>
          {item.productName}
        </Text>
        <Text style={styles.productFarmer} numberOfLines={1}>
          🌾 {item.farmerName || 'Local Farmer'}
        </Text>
        <View style={styles.ratingRow}>
          <StarRating rating={Math.round(item.averageRating || 0)} size={12} disabled={true} />
          <Text style={styles.ratingText}>{item.averageRating ? item.averageRating.toFixed(1) : 'New'}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>₹{item.price}</Text>
          <Text style={styles.productUnit}>/{item.unit || 'kg'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
  return (
    <View style={styles.container}>
      {}
      <View style={styles.searchWrapper}>
        <View style={[styles.searchContainer, searchFocused && styles.searchContainerFocused]}>
          <View style={styles.searchIconCircle}>
            <Ionicons name="search" size={18} color="#FFFFFF" />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder={`Search in ${category}...`}
            placeholderTextColor="#9CA69E"
            value={searchText}
            onChangeText={setSearchText}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={20} color="#9CA69E" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      {}
      <View style={styles.priceFilterWrapper}>
        <View style={styles.priceFilterHeader}>
          <Ionicons name="pricetag" size={16} color="#1E3A8A" />
          <Text style={styles.priceFilterTitle}>Price Filter</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.priceButtonsScroll}
        >
          {PRICE_PRESETS.map((preset, index) => {
            const isActive = index === activePriceIndex;
            return (
              <TouchableOpacity
                key={preset.label}
                style={[styles.priceChip, isActive && styles.priceChipActive]}
                onPress={() => setActivePriceIndex(index)}
                activeOpacity={0.75}
              >
                <Text style={[styles.priceChipText, isActive && styles.priceChipTextActive]}>
                  {preset.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      {}
      <View style={styles.resultsBar}>
        <Text style={styles.resultsText}>
          {displayedProducts.length} product{displayedProducts.length !== 1 ? 's' : ''} found
        </Text>
      </View>
      {}
      {loading ? (
        <ActivityIndicator size="large" color="#1E3A8A" style={{ marginTop: 50 }} />
      ) : displayedProducts.length === 0 ? (
        <View style={styles.emptyBox}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="leaf-outline" size={40} color="#1E3A8A" />
          </View>
          <Text style={styles.emptyTitle}>No products found</Text>
          <Text style={styles.emptySubtitle}>Try adjusting your filters</Text>
        </View>
      ) : (
        <FlatList
          data={displayedProducts}
          keyExtractor={item => item.productId}
          renderItem={renderProduct}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    height: 52,
    borderRadius: 16,
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  searchContainerFocused: {
    borderColor: '#1E3A8A',
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 12,
  },
  searchIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '500',
    color: '#1A2E1C',
  },
  clearBtn: {
    padding: 4,
  },
  priceFilterWrapper: {
    marginTop: 12,
    paddingBottom: 4,
  },
  priceFilterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  priceFilterTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2E1C',
    marginLeft: 6,
  },
  priceButtonsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  priceChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  priceChipActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  priceChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4A5D4D',
  },
  priceChipTextActive: {
    color: '#FFFFFF',
  },
  resultsBar: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  resultsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7F6E',
  },
  listContent: {
    paddingHorizontal: 10,
    paddingBottom: 30,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    width: PRODUCT_CARD_WIDTH,
    borderRadius: 18,
    marginHorizontal: 6,
    marginBottom: 16,
    shadowColor: '#0D3B13',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
    overflow: 'hidden',
  },
  inactiveLabel: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#E03B3B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 10,
  },
  inactiveLabelText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  imageContainer: {
    width: '100%',
    height: 150,
    backgroundColor: '#EDF5EE',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  freshTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#16A34A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  freshTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heartIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121912',
    marginBottom: 3,
  },
  productFarmer: {
    fontSize: 11,
    color: '#687168',
    marginBottom: 5,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7F6E',
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  productPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  productUnit: {
    fontSize: 12,
    color: '#687168',
    marginLeft: 2,
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2E1C',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8A938D',
  },
});

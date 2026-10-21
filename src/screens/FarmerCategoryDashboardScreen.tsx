import React, { useState, useCallback } from 'react';
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
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import api, { BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StarRating } from '../components/reviews/StarRating';
import { FARMER_THEME } from '../constants/farmerTheme';
import { FarmerPageBackground } from '../components/farmer/FarmerPageBackground';
import { FarmerHeader } from '../components/farmer/FarmerHeader';
import { FarmerCard } from '../components/farmer/FarmerCard';
import { FarmerBadge, FarmerEmptyState } from '../components/farmer/FarmerUI';

const { width } = Dimensions.get('window');
const PRODUCT_CARD_WIDTH = (width - 44) / 2;

interface ProductItem {
  productId: string;
  productName: string;
  price: number;
  productPhoto: string | null;
  status: string;
  isDelete: boolean;
  category: string;
  farmerId: string;
  farmerName?: string;
  qty?: number;
  unit?: string;
  averageRating?: number;
  reviewCount?: number;
}

export default function FarmerCategoryDashboardScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { category } = route.params;
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchFarmerCategoryProducts();
    }, [category, user?.farmerId])
  );

  const fetchFarmerCategoryProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/product/getAll');
      const raw: ProductItem[] = Array.isArray(response.data) ? response.data : [];
      const visible = raw.filter(
        (p) =>
          p.isDelete !== true &&
          p.status !== 'DELETED' &&
          p.category?.toLowerCase() === category.toLowerCase() &&
          p.farmerId === user?.farmerId
      );
      setProducts(visible);
    } catch (error) {
      console.log('Error fetching category products:', error);
      Alert.alert('Error', 'Could not load products for this category.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (product: ProductItem) => {
    navigation.navigate('AddProduct', { product });
  };

  const handleDeleteProduct = (productId: string) => {
    Alert.alert('Delete Product', 'Are you sure you want to delete this product?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/product/delete/${productId}`);
            fetchFarmerCategoryProducts();
          } catch (error) {
            console.log('Error deleting product', error);
            Alert.alert('Error', 'Could not delete product');
          }
        },
      },
    ]);
  };

  const filteredProducts = products.filter((p) =>
    p.productName.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderProductItem = ({ item }: { item: ProductItem }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => navigation.navigate('FarmerProductDetail', { product: item })}
      style={styles.cardTouchable}
    >
      <FarmerCard style={styles.productCard}>
        {/* Status Badge */}
        <View style={styles.badgeContainer}>
          <FarmerBadge
            variant={item.status === 'INACTIVE' ? 'error' : 'success'}
            label={item.status === 'INACTIVE' ? 'Inactive' : 'Active'}
            size="sm"
          />
        </View>

        {/* Sage Radial Image Container (#FFFFFF -> #EEF4E2 -> #D6E6C9) */}
        <View style={styles.imageContainer}>
          <LinearGradient
            colors={['#FFFFFF', '#EEF4E2', '#D6E6C9']}
            start={{ x: 0.1, y: 0.1 }}
            end={{ x: 0.9, y: 0.9 }}
            style={styles.imageGradient}
          >
            {item.productPhoto ? (
              <Image
                source={{ uri: `${BASE_URL}/product/image/${item.productPhoto}` }}
                style={styles.productImage}
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="leaf-outline" size={36} color={FARMER_THEME.colors.emeraldPrimary} />
            )}
          </LinearGradient>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.productTitle} numberOfLines={1}>
            {item.productName}
          </Text>

          <View style={styles.ratingRow}>
            <StarRating rating={item.averageRating || 0} size={12} variant="farmer" disabled />
            <Text style={styles.reviewCountText}>({item.reviewCount || 0})</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>₹{item.price}</Text>
            {item.unit && <Text style={styles.unitText}>/ {item.unit.toLowerCase()}</Text>}
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => handleEditProduct(item)}
              activeOpacity={0.8}
            >
              <Ionicons name="pencil-outline" size={16} color={FARMER_THEME.colors.forestGreen} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDeleteProduct(item.productId)}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={16} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>
      </FarmerCard>
    </TouchableOpacity>
  );

  return (
    <FarmerPageBackground>
      {/* Inner FarmerHeader */}
      <FarmerHeader
        variant="inner"
        title={category}
        titleAlign="left"
        onBackPress={() => navigation.goBack()}
      />

      {/* Themed Search Bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={18}
            color={FARMER_THEME.colors.sageText}
            style={styles.searchIcon}
          />
          <TextInput
            placeholder={`Search in ${category}...`}
            placeholderTextColor={FARMER_THEME.colors.sageText}
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={FARMER_THEME.colors.sageText} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={FARMER_THEME.colors.emeraldPrimary} />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.productId}
          renderItem={renderProductItem}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <FarmerEmptyState
              icon={<Ionicons name="leaf-outline" size={54} color={FARMER_THEME.colors.emeraldPrimary} />}
              title="No Products Found"
              subtitle={
                searchText.length > 0
                  ? `No products matched "${searchText}".`
                  : `You haven't added any products to ${category} yet.`
              }
              buttonTitle="Add Product to Category"
              onButtonPress={() => navigation.navigate('AddProduct', { category })}
              style={{ marginTop: 40 }}
            />
          }
        />
      )}

      {/* Floating Action Button (FAB) in Harvest Gold */}
      <TouchableOpacity
        style={[
          styles.fab,
          { bottom: Math.max(insets.bottom, 16) + 38 },
        ]}
        onPress={() => navigation.navigate('AddProduct', { category })}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#082419" />
      </TouchableOpacity>
    </FarmerPageBackground>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: FARMER_THEME.colors.cardBorder,
    ...FARMER_THEME.shadows.card,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: FARMER_THEME.typography.fontFamilyRegular,
    fontSize: 14,
    color: FARMER_THEME.colors.forestGreen,
    height: '100%',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 110,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardTouchable: {
    width: PRODUCT_CARD_WIDTH,
  },
  productCard: {
    padding: 0,
    overflow: 'hidden',
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
  },
  imageContainer: {
    width: '100%',
    height: 124,
    overflow: 'hidden',
  },
  imageGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    padding: 12,
  },
  productTitle: {
    fontFamily: FARMER_THEME.typography.fontFamilyBold,
    fontSize: 14,
    color: FARMER_THEME.colors.forestGreen,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewCountText: {
    fontFamily: FARMER_THEME.typography.fontFamilyRegular,
    fontSize: 11,
    color: FARMER_THEME.colors.sageText,
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  productPrice: {
    fontFamily: FARMER_THEME.typography.fontSerifBold,
    fontSize: 16,
    color: FARMER_THEME.colors.forestGreen,
  },
  unitText: {
    fontFamily: FARMER_THEME.typography.fontFamilyRegular,
    fontSize: 11,
    color: FARMER_THEME.colors.sageText,
    marginLeft: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: FARMER_THEME.colors.cardBorder,
    paddingTop: 8,
    gap: 8,
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: FARMER_THEME.colors.pastelGreen,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: FARMER_THEME.colors.cardBorder,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  fab: {
    position: 'absolute',
    bottom: 50,
    right: 20,
    backgroundColor: FARMER_THEME.colors.harvestGold,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: FARMER_THEME.colors.harvestGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});

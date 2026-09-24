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
import { useAuth } from '../context/AuthContext';
import { StarRating } from '../components/reviews/StarRating';
const { width } = Dimensions.get('window');
const PRODUCT_CARD_WIDTH = width / 2 - 24;
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
  const { category } = route.params;
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: category,
      headerStyle: {
        backgroundColor: '#1E5631',
        elevation: 6,
        shadowColor: '#1E5631',
        shadowOpacity: 0.3,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        height: 80,
      },
      headerTintColor: '#FFFFFF',
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 16, marginRight: 16 }}>
          <Ionicons name="chevron-back-outline" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      ),
      headerTitleStyle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
      },
    });
  }, [navigation, category]);
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
        p =>
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
  const filteredProducts = products.filter(p =>
    p.productName.toLowerCase().includes(searchText.toLowerCase())
  );
  const renderProductItem = ({ item }: { item: ProductItem }) => (
    <TouchableOpacity
      style={styles.productCard}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('FarmerProductDetail', { product: item })}
    >
      {item.status === 'INACTIVE' && (
        <View style={styles.inactiveBadge}>
          <Text style={styles.inactiveText}>Inactive</Text>
        </View>
      )}
      <View style={styles.imageContainer}>
        <Image
          source={
            item.productPhoto
              ? { uri: `${BASE_URL}/product/image/${item.productPhoto}` }
              : { uri: 'https://placehold.co/400x300/1A1A2E/FFFFFF?text=No+Image' }
          }
          style={styles.productImage}
          resizeMode="cover"
        />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.productTitle} numberOfLines={1}>{item.productName}</Text>
        <View style={styles.ratingRow}>
          <StarRating rating={item.averageRating || 0} size={14} />
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
          >
            <Ionicons name="create-outline" size={20} color="#2E9E44" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDeleteProduct(item.productId)}
          >
            <Ionicons name="trash-outline" size={20} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#176B2C" />
      </View>
    );
  }
  return (
    <View style={styles.container}>
      {}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#64748B" style={styles.searchIcon} />
          <TextInput
            placeholder="Search my products..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.productId}
        renderItem={renderProductItem}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="leaf-outline" size={60} color="#B8DDBB" />
            <Text style={styles.emptyTitle}>No Products Found</Text>
            <Text style={styles.emptySubtitle}>You haven't added any products to this category yet.</Text>
          </View>
        }
      />
      {/* FAB for Adding Product */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddProduct', { category: category })}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Match dashboard theme
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#1E5631', // Match Header
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    height: '100%',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100, // Space for FAB
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productCard: {
    width: PRODUCT_CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#EAF6D8',
  },
  inactiveBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 10,
  },
  inactiveText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  imageContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#F1FAF2',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    padding: 12,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#172117',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewCountText: {
    fontSize: 12,
    color: '#647064',
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E9E44',
  },
  unitText: {
    fontSize: 12,
    color: '#647064',
    marginLeft: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  editBtn: {
    padding: 6,
    backgroundColor: '#EAF6D8',
    borderRadius: 8,
  },
  deleteBtn: {
    padding: 6,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#176B2C',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#647064',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: '#F5A623',
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

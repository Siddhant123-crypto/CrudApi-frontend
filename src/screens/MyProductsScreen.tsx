import React, { useCallback, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  Platform,
  ActivityIndicator,
  FlatList,
  Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api, { BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_SIZE = Math.min(110, Math.max(96, SCREEN_WIDTH * 0.26));

// ─── Types ───────────────────────────────────────────────────────────────────
interface Product {
  // The backend returns `productId` as the primary key field
  productId: string;
  productName: string;
  category: string;
  price: number;
  quantity: number;
  unit: string;
  description?: string;
  productPhoto?: string;
  productVideo?: string;
  status: string;
  isActive?: boolean;
  isDelete?: boolean;
  createdOn?: string;
  updatedOn?: string;
  farmerId?: string;
  averageRating?: number;
  reviewCount?: number;
  harvestDate?: string;
}

// ─── Screen ───────────────────────────────────────────────────────────────────
const MyProductsScreen = ({ navigation }: any) => {
  const { user } = useAuth();

  const [products, setProducts]   = useState<Product[]>([]);
  const [loading, setLoading]     = useState(true);
  const [hasError, setHasError]   = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filter, setFilter]       = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // ── Fetch on every screen focus (covers: add → back, edit → back) ──────────
  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [user?.farmerId]),
  );

  const fetchProducts = async () => {
    if (!user?.farmerId) {
      console.log('MY PRODUCTS: No farmerId in user context:', JSON.stringify(user));
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setHasError(false);

      console.log('MY PRODUCTS FARMER ID:', user.farmerId);
      console.log('MY PRODUCTS URL:', `${BASE_URL}/product/farmer/${user.farmerId}`);

      const response = await api.get(`/product/farmer/${user.farmerId}`);

      console.log('MY PRODUCTS COUNT (raw):', Array.isArray(response.data) ? response.data.length : 'NOT AN ARRAY - type: ' + typeof response.data);
      console.log('MY PRODUCTS API RESPONSE:', JSON.stringify(response.data));

      const raw: Product[] = Array.isArray(response.data) ? response.data : [];

      // Safety net: only hide truly deleted items.
      // Do NOT filter by productVideo — products without video must still show.
      const visible = raw.filter(
        (p) => p.isDelete !== true && p.status !== 'DELETED',
      );

      console.log('MY PRODUCTS COUNT (after delete-filter):', visible.length);
      console.log('MY PRODUCTS productIds:', visible.map(p => p.productId));

      setProducts(visible);
    } catch (error) {
      console.log('MY PRODUCTS ERROR:', error);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  // ── Stats (computed from all non-deleted products) ────────────────────────
  const totalProducts   = products.length;
  const activeProducts  = products.filter((p) => p.status === 'ACTIVE').length;
  const inactiveProducts = products.filter((p) => p.status === 'INACTIVE' || p.status === 'INACTIVE').length;
  const totalStock      = products.reduce((sum, p) => sum + (p.quantity || 0), 0);

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const search = searchText.toLowerCase();
      const matchesSearch =
        (p.productName || '').toLowerCase().includes(search) ||
        (p.category || '').toLowerCase().includes(search);

      const matchesFilter =
        filter === 'ALL' ||
        (filter === 'ACTIVE'   && p.status === 'ACTIVE') ||
        (filter === 'INACTIVE' && (p.status === 'INACTIVE'));

      return matchesSearch && matchesFilter;
    });
  }, [products, searchText, filter]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleEdit = (product: Product) => {
    // Navigate to AddProduct with the full product object so it pre-fills fields
    navigation?.navigate('AddProduct', { product });
  };

  const handleDelete = (product: Product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.productName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDelete(product),
        },
      ],
    );
  };

  const confirmDelete = async (product: Product) => {
    try {
      await api.delete(`/product/delete/${product.productId}`);
      setProducts((prev) => prev.filter((p) => p.productId !== product.productId));
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to delete product. Please try again.';
      Alert.alert('Error', msg);
    }
  };

  const handlePlayVideo = (videoFilename: string) => {
    const videoUrl = `${BASE_URL}/product/video/${videoFilename}`;
    Linking.openURL(videoUrl).catch(() =>
      Alert.alert('Error', 'Could not open video. Please try again.'),
    );
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      // Optimistic update
      const newStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      setProducts((prev) => prev.map((p) => p.productId === product.productId ? { ...p, status: newStatus, isActive: newStatus === 'ACTIVE' } : p));
      
      await api.patch(`/product/toggleStatus/${product.productId}`);
    } catch (error: any) {
      // Revert on error
      const oldStatus = product.status;
      setProducts((prev) => prev.map((p) => p.productId === product.productId ? { ...p, status: oldStatus, isActive: oldStatus === 'ACTIVE' } : p));
      Alert.alert('Error', 'Failed to update product status.');
    }
  };

  // ── Render helpers ────────────────────────────────────────────────────────
  const photoUrl = (filename?: string) =>
    filename
      ? `${BASE_URL}/product/image/${filename}`
      : null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Unknown';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  // ── Product card ──────────────────────────────────────────────────────────
  const renderProduct = ({ item: product }: { item: Product }) => {
    const imgUri = photoUrl(product.productPhoto);
    const hasVideo = !!product.productVideo;
    const isActive = product.status === 'ACTIVE';

    return (
      <View style={[
        styles.productCard, 
        isActive ? { backgroundColor: '#F4F9F1', borderColor: '#E8F5E2', borderWidth: 1 } 
                 : { backgroundColor: '#FFF5F5', borderColor: '#FFEBEB', borderWidth: 1 }
      ]}>
        {!isActive && (
          <View style={styles.inactiveLabel}>
            <Text style={styles.inactiveLabelText}>Inactive</Text>
          </View>
        )}
        <View style={styles.cardBody}>

          {/* Image + video badge */}
          <TouchableOpacity
            style={styles.imageContainer}
            activeOpacity={hasVideo ? 0.8 : 1}
            onPress={() => hasVideo && handlePlayVideo(product.productVideo!)}
          >
            <Image
              source={
                imgUri
                  ? { uri: imgUri }
                  : { uri: 'https://placehold.co/200x200/E8F5E2/2E9B32?text=No+Image' }
              }
              style={[styles.productImage, !isActive && { opacity: 0.7 }]}
              resizeMode="cover"
            />
            {hasVideo && (
              <View style={styles.videoBadge}>
                <Ionicons name="play" size={10} color="#FFFFFF" />
                <Text style={styles.videoTime}> Video</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Details column */}
          <View style={styles.productDetails}>

            {/* Name + Status */}
            <View style={styles.nameStatusRow}>
              <Text style={styles.productName} numberOfLines={2}>
                {product.productName}
              </Text>
              <View style={[styles.statusBadge, isActive ? styles.activeBadge : styles.inactiveBadge]}>
                <View style={[styles.statusDot, isActive ? styles.activeDot : styles.inactiveDot]} />
                <Text style={[styles.statusText, isActive ? styles.activeText : styles.inactiveText]}>
                  {isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>

            {/* Category */}
            <View style={styles.categoryRow}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{product.category}</Text>
              </View>
              {product.averageRating !== undefined && product.averageRating !== null && product.reviewCount ? (
                <View style={[styles.categoryBadge, { marginLeft: 8, backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="star" size={12} color="#D97706" style={{ marginRight: 2 }} />
                  <Text style={[styles.categoryText, { color: '#D97706' }]}>
                    {product.averageRating.toFixed(1)} ({product.reviewCount})
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Info grid */}
            <View style={styles.infoGrid}>
              <View style={styles.infoLeft}>
                <Text style={styles.priceText}>
                  <Text style={styles.priceValue}>₹{product.price}</Text>
                  {' '}/ {product.unit}
                </Text>
                <View style={styles.dateRow}>
                  <Ionicons name="calendar-outline" size={12} color="#6C746D" />
                  <Text style={styles.infoDate}> Added {formatDate(product.createdOn)}</Text>
                </View>
              </View>

              <View style={styles.infoDivider} />

              <View style={styles.infoMiddle}>
                <Text style={styles.stockValue}>{product.quantity} {product.unit}</Text>
                <Text style={styles.stockLabel}>Available</Text>
              </View>
            </View>

            <View style={styles.actionRight}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleToggleStatus(product)}>
                  <View style={[styles.actionIconCircle, !isActive && styles.activeStatusIconCircle]}>
                    <Ionicons name={isActive ? "pause-outline" : "play-outline"} size={16} color={isActive ? "#F5A623" : "#2E9B32"} />
                  </View>
                  <Text style={styles.actionBtnText}>{isActive ? 'Inactive' : 'Active'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} onPress={() => handleEdit(product)}>
                  <View style={styles.actionIconCircle}>
                    <Ionicons name="pencil-outline" size={16} color="#6C746D" />
                  </View>
                  <Text style={styles.actionBtnText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} onPress={() => navigation?.navigate('FarmerProductReviews', { product })}>
                  <View style={[styles.actionIconCircle, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="star-outline" size={16} color="#D97706" />
                  </View>
                  <Text style={styles.actionBtnText}>Reviews</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(product)}>
                  <View style={[styles.actionIconCircle, styles.deleteIconCircle]}>
                    <Ionicons name="trash-outline" size={16} color="#E03B3B" />
                  </View>
                  <Text style={styles.actionBtnText}>Delete</Text>
                </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // ── Empty / error / loading states ────────────────────────────────────────
  const renderEmpty = () => {
    if (loading) return null; // FlatList won't call this while loading
    if (hasError) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="cloud-offline-outline" size={38} color="#E03B3B" />
          </View>
          <Text style={styles.emptyTitle}>Unable to Load Products</Text>
          <Text style={styles.emptyText}>Check your connection and try again.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchProducts}>
            <Ionicons name="refresh" size={16} color="#FFFFFF" />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Ionicons name="cube-outline" size={38} color="#66A866" />
        </View>
        <Text style={styles.emptyTitle}>No Products Yet</Text>
        <Text style={styles.emptyText}>
          {searchText || filter !== 'ALL'
            ? 'No products match your search or filter.'
            : "You haven't added any active products."}
        </Text>
        {!searchText && filter === 'ALL' && (
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => navigation?.navigate('AddProduct')}
          >
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.retryText}>Add Product</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ── Header for FlatList (stats + search) ─────────────────────────────────
  const ListHeader = () => (
    <>
      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, styles.solidGreenIcon]}>
            <Ionicons name="cube" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.statNumber}>{totalProducts}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, styles.solidGreenIcon]}>
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.statNumber}>{activeProducts}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, styles.solidYellowIcon]}>
            <Ionicons name="pause" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.statNumber}>{inactiveProducts}</Text>
          <Text style={styles.statLabel}>Inactive</Text>
        </View>

        <View style={[styles.statCard, { marginRight: 0 }]}>
          <View style={[styles.statIcon, styles.transparentIcon]}>
            <Ionicons name="leaf" size={22} color="#2E9B32" />
          </View>
          <Text style={styles.statNumber}>
            {totalStock}
            <Text style={styles.stockUnit}> KG</Text>
          </Text>
          <Text style={styles.statLabel}>Stock</Text>
        </View>
      </View>

      {/* Search + filter */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#2D983A" />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search products..."
            placeholderTextColor="#6C746D"
            style={styles.searchInput}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color="#9DA89E" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            if (filter === 'ALL')      { setFilter('ACTIVE');   return; }
            if (filter === 'ACTIVE')   { setFilter('INACTIVE'); return; }
            setFilter('ALL');
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.filterText}>
            {filter === 'ALL' ? 'Filter' : filter === 'ACTIVE' ? 'Active' : 'Inactive'}
          </Text>
          <Ionicons name="caret-down" size={12} color="#172018" />
        </TouchableOpacity>
      </View>

      {/* Active filter chip */}
      {filter !== 'ALL' && (
        <View style={styles.activeFilterRow}>
          <Text style={styles.activeFilterText}>
            Showing {filter.toLowerCase()} products
          </Text>
          <TouchableOpacity onPress={() => setFilter('ALL')} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Ionicons name="close-circle" size={18} color="#2E9B32" />
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  // ── Root render ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => navigation?.goBack()}
              style={styles.menuButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-back-outline" size={28} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.titleBlock}>
              <Text style={styles.headerTitle} numberOfLines={1}>My Products</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                Manage your added products
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation?.navigate('AddProduct')}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Product</Text>
          </TouchableOpacity>
        </View>

        {/* ── LOADING ── */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E9B32" />
            <Text style={styles.loadingText}>Loading your products...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            keyExtractor={(item, index) => item.productId ? String(item.productId) : String(index)}
            renderItem={renderProduct}
            ListHeaderComponent={<ListHeader />}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        )}

      </View>
    </SafeAreaView>
  );
};

export default MyProductsScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: '#1E5631', // updated
    paddingTop: Platform.OS === 'android' ? 16 : 0,
  },

  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // updated
  },

  listContent: {
    paddingBottom: 24,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  loadingText: {
    color: '#6C746D',
    fontSize: 14,
  },

  // ── HEADER ──────────────────────────────────────────────────────────────
  header: {
    backgroundColor: '#1E5631', // updated
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 28 : 16,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },

  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },

  menuButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },

  titleBlock: {
    flex: 1,
    minWidth: 0,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF', // text on dark green
    flexShrink: 1,
  },

  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#E2E8F0', // lighter text on dark green
  },

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5A623', // Orange yellow
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    flexShrink: 0,
  },

  addButtonText: {
    marginLeft: 6,
    color: '#FFFFFF', // updated
    fontSize: 13,
    fontWeight: '700',
  },

  // ── STATS ────────────────────────────────────────────────────────────────
  statsRow: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  statCard: {
    flex: 1,
    height: 105,
    borderRadius: 18,
    padding: 8,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#1B5E20',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },

  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  solidGreenIcon:  { backgroundColor: '#2E9B32' },
  solidYellowIcon: { backgroundColor: '#F5A623' },
  transparentIcon: { backgroundColor: '#E8F5E9', elevation: 3 },

  statNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#172018',
  },

  stockUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6C746D',
  },

  statLabel: {
    marginTop: 3,
    fontSize: 10,
    color: '#6C746D',
    fontWeight: '600',
    textAlign: 'center',
  },

  // ── SEARCH + FILTER ──────────────────────────────────────────────────────
  searchRow: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },

  searchBox: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8E4D4',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    elevation: 2,
    shadowColor: '#6C746D',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#172018',
    paddingVertical: 0,
  },

  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8E4D4',
    elevation: 2,
    shadowColor: '#6C746D',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    flexShrink: 0,
  },

  filterText: {
    marginRight: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#172018',
  },

  activeFilterRow: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#E8F5E2',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  activeFilterText: {
    color: '#2E9B32',
    fontSize: 13,
    fontWeight: '600',
  },

  productCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 14,
    padding: 14,
    elevation: 3,
    shadowColor: '#6C746D',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
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

  cardBody: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },

  imageContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE + 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E8F5E2',
    flexShrink: 0,
  },

  productImage: {
    width: '100%',
    height: '100%',
  },

  videoBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },

  videoTime: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },

  productDetails: {
    flex: 1,
    paddingLeft: 14,
    justifyContent: 'space-between',
  },

  nameStatusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  productName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#172018',
    lineHeight: 21,
    marginRight: 8,
  },

  categoryRow: {
    marginTop: 4,
    marginBottom: 8,
    flexDirection: 'row',
  },

  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E8F5E2',
  },

  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2E9B32',
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  activeBadge:   { backgroundColor: '#E8F5E2' },
  inactiveBadge: { backgroundColor: '#FFF3D4' },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    marginRight: 4,
  },

  activeDot:   { backgroundColor: '#2E9B32' },
  inactiveDot: { backgroundColor: '#B57900' },

  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },

  activeText:   { color: '#2E9B32' },
  inactiveText: { color: '#B57900' },

  infoGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },

  infoLeft: { flex: 1 },

  priceText: {
    fontSize: 13,
    color: '#172018',
    fontWeight: '500',
    marginBottom: 6,
  },

  priceValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2E9B32',
  },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  infoDate: {
    fontSize: 11,
    color: '#6C746D',
  },

  infoDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#D8E4D4',
    marginHorizontal: 10,
  },

  infoMiddle: {
    alignItems: 'flex-start',
    paddingRight: 10,
    flex: 1,
  },

  stockValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#172018',
  },

  stockLabel: {
    fontSize: 11,
    color: '#6C746D',
    marginTop: 2,
  },

  actionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },

  actionBtn: {
    alignItems: 'center',
  },

  actionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8E4D4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    backgroundColor: '#FFFFFF',
  },

  deleteIconCircle: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FFF5F5',
  },

  activeStatusIconCircle: {
    borderColor: '#E8F5E2',
    backgroundColor: '#F4F9F1',
  },

  actionBtnText: {
    fontSize: 10,
    color: '#6C746D',
    fontWeight: '500',
  },

  // ── EMPTY / ERROR STATE ──────────────────────────────────────────────────
  emptyContainer: {
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#E8F5E2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '800',
    color: '#172018',
  },

  emptyText: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 13,
    color: '#6C746D',
  },

  retryBtn: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E9B32',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
    elevation: 4,
    shadowColor: '#2E9B32',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
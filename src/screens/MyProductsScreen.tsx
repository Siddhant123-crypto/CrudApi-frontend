import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  ActivityIndicator,
  FlatList,
  Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import api, { BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';

import { FARMER_THEME } from '../constants/farmerTheme';
import { FarmerPageBackground } from '../components/farmer/FarmerPageBackground';
import { FarmerHeader } from '../components/farmer/FarmerHeader';
import { FarmerCard } from '../components/farmer/FarmerCard';
import { FarmerInput } from '../components/farmer/FarmerInput';
import {
  FarmerChip,
  FarmerBadge,
  FarmerStatCard,
  FarmerEmptyState,
} from '../components/farmer/FarmerUI';
import {
  FarmerSmallAddButton,
  FarmerOutlineButton,
} from '../components/farmer/FarmerButtons';
import {
  SearchIcon,
  CloseCircleIcon,
  EditIcon,
  TrashIcon,
  StarIcon,
} from '../components/farmer/FarmerIcons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Product {
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

const MyProductsScreen = ({ navigation, route }: any) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [searchText, setSearchText] = useState(route?.params?.searchQuery || '');
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [user?.farmerId])
  );

  useEffect(() => {
    const query = route?.params?.searchQuery;
    if (query !== undefined && query !== null) {
      setSearchText(query);
    }
  }, [route?.params?.searchQuery]);

  const fetchProducts = async () => {
    if (!user?.farmerId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setHasError(false);
      const response = await api.get(`/product/farmer/${user.farmerId}`);
      const raw: Product[] = Array.isArray(response.data) ? response.data : [];
      const visible = raw.filter(
        (p) => p.isDelete !== true && p.status !== 'DELETED'
      );
      setProducts(visible);
    } catch (error) {
      console.log('MY PRODUCTS ERROR:', error);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.status === 'ACTIVE').length;
  const inactiveProducts = products.filter((p) => p.status === 'INACTIVE').length;
  const totalStock = products.reduce((sum, p) => sum + (p.quantity || 0), 0);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const search = searchText.toLowerCase();
      const matchesSearch =
        (p.productName || '').toLowerCase().includes(search) ||
        (p.category || '').toLowerCase().includes(search);
      const matchesFilter =
        filter === 'ALL' ||
        (filter === 'ACTIVE' && p.status === 'ACTIVE') ||
        (filter === 'INACTIVE' && p.status === 'INACTIVE');
      return matchesSearch && matchesFilter;
    });
  }, [products, searchText, filter]);

  const handleEdit = (product: Product) => {
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
      ]
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
      Alert.alert('Error', 'Could not open video. Please try again.')
    );
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      const newStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      setProducts((prev) =>
        prev.map((p) =>
          p.productId === product.productId
            ? { ...p, status: newStatus, isActive: newStatus === 'ACTIVE' }
            : p
        )
      );
      await api.patch(`/product/toggleStatus/${product.productId}`);
    } catch (error: any) {
      const oldStatus = product.status;
      setProducts((prev) =>
        prev.map((p) =>
          p.productId === product.productId
            ? { ...p, status: oldStatus, isActive: oldStatus === 'ACTIVE' }
            : p
        )
      );
      Alert.alert('Error', 'Failed to update product status.');
    }
  };

  const photoUrl = (filename?: string) =>
    filename ? `${BASE_URL}/product/image/${filename}` : null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Unknown';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderProduct = ({ item: product }: { item: Product }) => {
    const imgUri = photoUrl(product.productPhoto);
    const hasVideo = !!product.productVideo;
    const isActive = product.status === 'ACTIVE';

    return (
      <FarmerCard style={styles.productCard}>
        <View style={styles.cardTopRow}>
          {/* Sage Radial/Linear Image Tile */}
          <TouchableOpacity
            style={styles.imageTileWrapper}
            activeOpacity={hasVideo ? 0.8 : 0.95}
            onPress={() => hasVideo && handlePlayVideo(product.productVideo!)}
          >
            <LinearGradient
              colors={['#FFFFFF', '#EEF4E2', '#D6E6C9']}
              style={styles.imageGradient}
            >
              {imgUri ? (
                <Image
                  source={{ uri: imgUri }}
                  style={[styles.productImage, !isActive && styles.inactiveImage]}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholderBox}>
                  <Ionicons name="leaf-outline" size={26} color={FARMER_THEME.colors.primaryGreen} />
                </View>
              )}
            </LinearGradient>

            {hasVideo && (
              <View style={styles.videoBadge}>
                <Ionicons name="play" size={9} color="#FFFFFF" />
                <Text style={styles.videoTime}>Video</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Product Info */}
          <View style={styles.productDetails}>
            <View style={styles.nameBadgeRow}>
              <Text
                style={styles.productName}
                numberOfLines={2}
                maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
              >
                {product.productName}
              </Text>
              <FarmerBadge
                label={isActive ? 'Active' : 'Inactive'}
                variant={isActive ? 'success' : 'error'}
                size="sm"
              />
            </View>

            <View style={styles.categoryRatingRow}>
              <View style={styles.categoryPill}>
                <Text
                  style={styles.categoryText}
                  maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                >
                  {product.category}
                </Text>
              </View>

              {product.averageRating !== undefined &&
              product.averageRating !== null &&
              product.reviewCount ? (
                <View style={styles.ratingPill}>
                  <StarIcon size={10} color={FARMER_THEME.colors.star} filled />
                  <Text
                    style={styles.ratingPillText}
                    maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                  >
                    {product.averageRating.toFixed(1)} ({product.reviewCount})
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Price and Stock Row */}
            <View style={styles.priceStockRow}>
              <Text
                style={styles.priceText}
                maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
              >
                ₹{product.price}{' '}
                <Text style={styles.unitText}>/ {product.unit}</Text>
              </Text>

              <Text
                style={styles.stockText}
                maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
              >
                {product.quantity} {product.unit} left
              </Text>
            </View>

            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={11} color={FARMER_THEME.colors.textMuted} />
              <Text
                style={styles.dateText}
                maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
              >
                Added {formatDate(product.createdOn)}
              </Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.cardDivider} />

        {/* Action Buttons Row */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.toggleBtn]}
            onPress={() => handleToggleStatus(product)}
            activeOpacity={0.75}
          >
            <Ionicons
              name={isActive ? 'pause-outline' : 'play-outline'}
              size={13}
              color={isActive ? FARMER_THEME.colors.warning : FARMER_THEME.colors.primaryGreen}
            />
            <Text
              style={[
                styles.actionBtnText,
                { color: isActive ? FARMER_THEME.colors.warning : FARMER_THEME.colors.primaryGreen },
              ]}
              maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
            >
              {isActive ? 'Pause' : 'Activate'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleEdit(product)}
            activeOpacity={0.75}
          >
            <EditIcon size={13} color={FARMER_THEME.colors.primaryGreen} strokeWidth={2} />
            <Text
              style={styles.actionBtnText}
              maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
            >
              Edit
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation?.navigate('FarmerProductReviews', { product })}
            activeOpacity={0.75}
          >
            <StarIcon size={12} color={FARMER_THEME.colors.star} filled />
            <Text
              style={styles.actionBtnText}
              maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
            >
              Reviews
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteActionBtn]}
            onPress={() => handleDelete(product)}
            activeOpacity={0.75}
          >
            <TrashIcon size={13} color={FARMER_THEME.colors.error} strokeWidth={2} />
            <Text
              style={[styles.actionBtnText, { color: FARMER_THEME.colors.error }]}
              maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
            >
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </FarmerCard>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    if (hasError) {
      return (
        <FarmerEmptyState
          icon={<Ionicons name="cloud-offline-outline" size={44} color={FARMER_THEME.colors.error} />}
          title="Unable to Load Products"
          subtitle="Check your internet connection and try again."
          buttonTitle="Retry"
          onButtonPress={fetchProducts}
        />
      );
    }
    return (
      <FarmerEmptyState
        icon={<Ionicons name="cube-outline" size={44} color={FARMER_THEME.colors.primaryGreen} />}
        title="No Products Found"
        subtitle={
          searchText || filter !== 'ALL'
            ? 'No products match your current search or filter.'
            : "You haven't listed any farm products yet."
        }
        buttonTitle={!searchText && filter === 'ALL' ? 'Add Product' : undefined}
        onButtonPress={() => navigation?.navigate('AddProduct')}
      />
    );
  };

  const ListHeader = () => (
    <View style={styles.listHeaderContainer}>
      {/* 4 Stat Cards */}
      <View style={styles.statsGrid}>
        <FarmerStatCard
          value={totalProducts}
          label="Total"
          icon={<Ionicons name="cube-outline" size={16} color={FARMER_THEME.colors.primaryGreen} />}
          iconBg={FARMER_THEME.colors.pastelGreen}
          style={styles.statCard}
          compact
        />
        <FarmerStatCard
          value={activeProducts}
          label="Active"
          icon={<Ionicons name="checkmark-circle-outline" size={16} color={FARMER_THEME.colors.success} />}
          iconBg={FARMER_THEME.colors.pastelLime}
          style={styles.statCard}
          compact
        />
        <FarmerStatCard
          value={inactiveProducts}
          label="Inactive"
          icon={<Ionicons name="pause-circle-outline" size={16} color={FARMER_THEME.colors.warning} />}
          iconBg={FARMER_THEME.colors.pastelYellow}
          style={styles.statCard}
          compact
        />
        <FarmerStatCard
          value={totalStock}
          subLabel="KG"
          label="Stock"
          icon={<Ionicons name="leaf-outline" size={16} color={FARMER_THEME.colors.tealGreen} />}
          iconBg={FARMER_THEME.colors.pastelTeal}
          style={styles.statCard}
          compact
        />
      </View>

      {/* Search Input Row */}
      <View style={styles.searchRow}>
        <FarmerInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search products by name or category..."
          leftIcon={<SearchIcon size={18} color={FARMER_THEME.colors.primaryGreen} strokeWidth={2} />}
          rightIcon={
            searchText.length > 0 ? (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <CloseCircleIcon size={18} color={FARMER_THEME.colors.placeholder} />
              </TouchableOpacity>
            ) : undefined
          }
          containerStyle={{ marginBottom: 0, flex: 1 }}
        />
      </View>

      {/* Filter Chips */}
      <View style={styles.filterChipsRow}>
        <FarmerChip
          label="All"
          count={totalProducts}
          selected={filter === 'ALL'}
          onPress={() => setFilter('ALL')}
        />
        <FarmerChip
          label="Active"
          count={activeProducts}
          selected={filter === 'ACTIVE'}
          onPress={() => setFilter('ACTIVE')}
        />
        <FarmerChip
          label="Inactive"
          count={inactiveProducts}
          selected={filter === 'INACTIVE'}
          onPress={() => setFilter('INACTIVE')}
        />
      </View>
    </View>
  );

  return (
    <FarmerPageBackground>
      {/* Header */}
      <FarmerHeader
        variant="tab"
        title="My Products"
        subtitle="Manage stock, prices & status"
        onBackPress={() => {
          if (navigation?.canGoBack()) {
            navigation.goBack();
          } else {
            navigation?.navigate('Home');
          }
        }}
        onNotificationPress={() => navigation?.navigate('Notifications')}
        rightComponent={
          <FarmerSmallAddButton
            onPress={() => navigation?.navigate('AddProduct')}
          />
        }
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={FARMER_THEME.colors.primaryGreen} />
          <Text
            style={styles.loadingText}
            maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
          >
            Loading your products...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item, index) =>
            item.productId ? String(item.productId) : String(index)
          }
          renderItem={renderProduct}
          ListHeaderComponent={<ListHeader />}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </FarmerPageBackground>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: FARMER_THEME.fonts.medium,
    fontSize: 14,
    color: FARMER_THEME.colors.textSecondary,
  },
  listContent: {
    paddingHorizontal: FARMER_THEME.spacing.pagePadding,
    paddingTop: 12,
    paddingBottom: FARMER_THEME.spacing.tabBottomPadding,
    gap: 10,
  },
  listHeaderContainer: {
    marginBottom: 4,
    gap: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  statCard: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 7,
    paddingHorizontal: 2,
  },
  searchRow: {
    marginTop: 0,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 0,
  },
  productCard: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    gap: 10,
  },
  imageTileWrapper: {
    width: 82,
    height: 82,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: FARMER_THEME.colors.cardBorder,
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
  inactiveImage: {
    opacity: 0.65,
  },
  placeholderBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(14,59,41,0.85)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  videoTime: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 8.5,
    color: '#FFFFFF',
  },
  productDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  nameBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 6,
  },
  productName: {
    fontFamily: FARMER_THEME.fonts.serif,
    fontSize: 14,
    color: FARMER_THEME.colors.headings,
    flex: 1,
    lineHeight: 18,
  },
  categoryRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  categoryPill: {
    backgroundColor: FARMER_THEME.colors.inputBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: FARMER_THEME.colors.inputBorder,
  },
  categoryText: {
    fontFamily: FARMER_THEME.fonts.medium,
    fontSize: 10,
    color: FARMER_THEME.colors.textSecondary,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4DD',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2.5,
  },
  ratingPillText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 10,
    color: FARMER_THEME.colors.warning,
  },
  priceStockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 3,
  },
  priceText: {
    fontFamily: FARMER_THEME.fonts.serif,
    fontSize: 15,
    color: FARMER_THEME.colors.headings,
  },
  unitText: {
    fontFamily: FARMER_THEME.fonts.regular,
    fontSize: 11,
    color: FARMER_THEME.colors.textSecondary,
  },
  stockText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 11,
    color: FARMER_THEME.colors.primaryGreen,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  dateText: {
    fontFamily: FARMER_THEME.fonts.regular,
    fontSize: 10,
    color: FARMER_THEME.colors.textMuted,
  },
  cardDivider: {
    height: 1,
    backgroundColor: FARMER_THEME.colors.divider,
    marginVertical: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 5,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5.5,
    borderRadius: 10,
    backgroundColor: FARMER_THEME.colors.inputBg,
    borderWidth: 1,
    borderColor: FARMER_THEME.colors.inputBorder,
    gap: 3,
  },
  toggleBtn: {
    backgroundColor: '#FFFFFF',
  },
  deleteActionBtn: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FDE6E2',
  },
  actionBtnText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 10.5,
    color: FARMER_THEME.colors.headings,
  },
});

export default MyProductsScreen;

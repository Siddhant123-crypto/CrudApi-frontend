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
import api, { BASE_URL, resolveMediaUrl } from '../services/api';
import { getProductImageUrl } from '../services/productService';
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
import { useTranslation } from 'react-i18next';
import { formatCategory } from '../utils/categoryUtils';
import { formatDate } from '../utils/formatters';

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
  const { t } = useTranslation();
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
    const currentFarmerId = user?.farmerId || (user as any)?.id || (user as any)?.userId;
    if (!currentFarmerId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setHasError(false);
      const response = await api.get(`/product/farmer/${currentFarmerId}`);
      let raw: Product[] = Array.isArray(response.data) ? response.data : [];
      if (raw.length === 0) {
        const allRes = await api.get('/product/getAll').catch(() => ({ data: [] }));
        const all: Product[] = Array.isArray(allRes.data) ? allRes.data : [];
        raw = all.filter(
          (p: any) => p.farmerId === currentFarmerId || (user?.email && p.createdBy === user?.name)
        );
      }
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
      t('farmer.deleteProductTitle', 'Delete Product'),
      `${t('farmer.deleteProductConfirm', 'Are you sure you want to delete this product?')} "${product.productName}"`,
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('common.delete', 'Delete'),
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
      const msg = error?.response?.data?.message || t('errors.generic', 'Failed to delete product. Please try again.');
      Alert.alert(t('common.error', 'Error'), msg);
    }
  };

  const handlePlayVideo = (videoFilename: string) => {
    const videoUrl = resolveMediaUrl(videoFilename) || `${BASE_URL}/product/video/${videoFilename}`;
    Linking.openURL(videoUrl).catch(() =>
      Alert.alert(t('common.error', 'Error'), t('errors.generic', 'Could not open video. Please try again.'))
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
      Alert.alert(t('common.error', 'Error'), t('errors.generic', 'Failed to update product status.'));
    }
  };

  const photoUrl = (filename?: string) =>
    filename ? getProductImageUrl(filename) : null;

  const formatDisplayDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return formatDate(dateStr);
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
                <Text style={styles.videoTime}>{t('farmer.video', 'Video')}</Text>
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
                label={isActive ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                variant={isActive ? 'success' : 'error'}
                size="sm"
              />
            </View>

            <View style={styles.categoryRatingRow}>
              <View style={styles.categoryLeftGroup}>
                <View style={styles.categoryPill}>
                  <Text
                    style={styles.categoryText}
                    numberOfLines={1}
                    maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                  >
                    {formatCategory(product.category, t)}
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

              <TouchableOpacity
                style={styles.reviewsPillBtn}
                onPress={() => navigation?.navigate('FarmerProductReviews', { product })}
                activeOpacity={0.75}
              >
                <StarIcon size={11} color={FARMER_THEME.colors.star} filled />
                <Text
                  style={styles.reviewsPillText}
                  numberOfLines={1}
                  maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                >
                  {t('product.reviews', 'Reviews')}
                </Text>
              </TouchableOpacity>
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
                {product.quantity} {product.unit} {t('product.inStock', 'left')}
              </Text>
            </View>

            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={11} color={FARMER_THEME.colors.textMuted} />
              <Text
                style={styles.dateText}
                maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
              >
                {t('farmer.added', 'Added')} {formatDisplayDate(product.createdOn)}
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
              {isActive ? t('farmer.pause', 'Pause') : t('farmer.activate', 'Activate')}
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
              numberOfLines={1}
              maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
            >
              {t('common.edit', 'Edit')}
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
              numberOfLines={1}
              maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
            >
              {t('common.delete', 'Delete')}
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
          title={t('errors.serverError', 'Unable to Load Products')}
          subtitle={t('errors.networkError', 'Check your internet connection and try again.')}
          buttonTitle={t('common.retry', 'Retry')}
          onButtonPress={fetchProducts}
        />
      );
    }
    return (
      <FarmerEmptyState
        icon={<Ionicons name="cube-outline" size={44} color={FARMER_THEME.colors.primaryGreen} />}
        title={t('farmer.noProductsTitle', 'No Products Found')}
        subtitle={
          searchText || filter !== 'ALL'
            ? t('farmer.noMatchingProducts', 'No products match your current search or filter.')
            : t('farmer.noProducts', "You haven't listed any farm products yet.")
        }
        buttonTitle={!searchText && filter === 'ALL' ? t('farmer.addProductTitle', 'Add Product') : undefined}
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
          label={t('farmer.filterAll', 'Total')}
          icon={<Ionicons name="cube-outline" size={16} color={FARMER_THEME.colors.primaryGreen} />}
          iconBg={FARMER_THEME.colors.pastelGreen}
          style={styles.statCard}
          compact
        />
        <FarmerStatCard
          value={activeProducts}
          label={t('common.active', 'Active')}
          icon={<Ionicons name="checkmark-circle-outline" size={16} color={FARMER_THEME.colors.success} />}
          iconBg={FARMER_THEME.colors.pastelLime}
          style={styles.statCard}
          compact
        />
        <FarmerStatCard
          value={inactiveProducts}
          label={t('common.inactive', 'Inactive')}
          icon={<Ionicons name="pause-circle-outline" size={16} color={FARMER_THEME.colors.warning} />}
          iconBg={FARMER_THEME.colors.pastelYellow}
          style={styles.statCard}
          compact
        />
        <FarmerStatCard
          value={totalStock}
          subLabel={t('common.kg', 'KG')}
          label={t('product.inStock', 'Stock')}
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
          placeholder={t('farmer.searchPlaceholder', 'Search products by name or category...')}
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
          label={t('farmer.filterAll', 'All')}
          count={totalProducts}
          selected={filter === 'ALL'}
          onPress={() => setFilter('ALL')}
        />
        <FarmerChip
          label={t('farmer.filterActive', 'Active')}
          count={activeProducts}
          selected={filter === 'ACTIVE'}
          onPress={() => setFilter('ACTIVE')}
        />
        <FarmerChip
          label={t('farmer.filterInactive', 'Inactive')}
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
        title={t('farmer.myProductsTitle', 'My Products')}
        subtitle={t('farmer.manageProducts', 'Manage stock, prices & status')}
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
            {t('common.loading', 'Loading your products...')}
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
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 4,
  },
  categoryLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    gap: 5,
  },
  reviewsPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9EC',
    borderWidth: 1,
    borderColor: '#F3DC9B',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
    flexShrink: 0,
  },
  reviewsPillText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 10,
    color: FARMER_THEME.colors.headings,
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
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: FARMER_THEME.colors.inputBg,
    borderWidth: 1,
    borderColor: FARMER_THEME.colors.inputBorder,
    gap: 4,
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

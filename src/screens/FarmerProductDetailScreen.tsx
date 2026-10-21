import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  getProductImageUrl,
  getProductById,
  getProductVideoUrl,
  updateProduct,
} from '../services/productService';
import { getProductReviews } from '../services/reviewService';
import { StarRating } from '../components/reviews/StarRating';
import { MediaViewerModal } from '../components/reviews/MediaViewerModal';
import { Review } from '../types';
import { formatAddedTime } from '../utils/dateUtils';
import { FARMER_THEME } from '../constants/farmerTheme';
import { FarmerPageBackground } from '../components/farmer/FarmerPageBackground';
import { FarmerHeader } from '../components/farmer/FarmerHeader';
import { FarmerCard } from '../components/farmer/FarmerCard';
import { FarmerStatCard, FarmerBadge, FarmerStickyBar, FarmerEmptyState } from '../components/farmer/FarmerUI';

const { width } = Dimensions.get('window');

const formatPrice = (val: any) => {
  if (val === undefined || val === null) return '0';
  const num = Number(val);
  if (isNaN(num)) return '0';
  return num % 1 === 0 ? num.toString() : num.toFixed(2);
};

const FarmerProductDetailScreen = ({ route, navigation }: any) => {
  const { product } = route.params;
  const [productData, setProductData] = useState<any>(product);
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(true);
  const [mediaModalVisible, setMediaModalVisible] = useState(false);
  const [mediaModalUrl, setMediaModalUrl] = useState<string | null>(null);
  const [mediaModalIsVideo, setMediaModalIsVideo] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const handleToggleActive = () => {
    const nextStatus = !productData.isActive;
    const actionText = nextStatus ? 'activate' : 'deactivate';
    Alert.alert(
      `${nextStatus ? 'Activate' : 'Deactivate'} Product`,
      `Are you sure you want to ${actionText} "${productData.productName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: nextStatus ? 'Activate' : 'Deactivate',
          style: nextStatus ? 'default' : 'destructive',
          onPress: async () => {
            setUpdatingStatus(true);
            try {
              await updateProduct(productData.productId, {
                ...productData,
                isActive: nextStatus,
              });
              setProductData((prev: any) => ({ ...prev, isActive: nextStatus }));
              Alert.alert('Success', `Product has been ${nextStatus ? 'activated' : 'deactivated'} successfully.`);
            } catch (err: any) {
              console.log('Error toggling product status:', err);
              Alert.alert('Error', err.response?.data?.message || `Failed to ${actionText} product.`);
            } finally {
              setUpdatingStatus(false);
            }
          },
        },
      ]
    );
  };

  const fetchProductAndReviews = async () => {
    try {
      const updatedProduct = await getProductById(product.productId);
      setProductData(updatedProduct);
      const reviews = await getProductReviews(product.productId);
      setReviewsList(reviews);
    } catch (error) {
      console.log('Error fetching product details/reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProductAndReviews();
    }, [product.productId])
  );

  const imageUrl = productData.productPhoto
    ? getProductImageUrl(productData.productPhoto)
    : null;

  return (
    <FarmerPageBackground>
      {/* Inner FarmerHeader with back arrow & left aligned title */}
      <FarmerHeader
        variant="inner"
        title="Product Details"
        titleAlign="left"
        titleStyle={{ marginLeft: 16, fontSize: 17 }}
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity
            style={styles.glassHeaderBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AddProduct', { product: productData })}
          >
            <Ionicons name="pencil" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Large Sage Image Card (#FFFFFF -> #EEF4E2 -> #D6E6C9) */}
        <View style={styles.imageCardWrapper}>
          <LinearGradient
            colors={['#FFFFFF', '#EEF4E2', '#D6E6C9']}
            start={{ x: 0.1, y: 0.1 }}
            end={{ x: 0.9, y: 0.9 }}
            style={styles.imageCardGradient}
          >
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.productHeroImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="leaf-outline" size={64} color={FARMER_THEME.colors.emeraldPrimary} />
                <Text style={styles.placeholderText}>No photo available</Text>
              </View>
            )}

            {/* Organic Tag Overlay */}
            <View style={styles.organicTagOverlay}>
              <Ionicons name="leaf" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.organicTagText}>100% Farm Fresh</Text>
            </View>

            {/* Status Badge Overlay */}
            <View style={styles.statusBadgeOverlay}>
              <FarmerBadge
                variant={productData.isActive ? 'success' : 'error'}
                label={productData.isActive ? 'Active' : 'Inactive'}
                size="md"
              />
            </View>
          </LinearGradient>
        </View>

        {/* Title, Rating, & Price */}
        <FarmerCard style={styles.headerInfoCard}>
          <Text style={styles.productName}>{productData.productName}</Text>

          <View style={styles.ratingRow}>
            <StarRating
              rating={productData.averageRating || 0}
              size={15}
              disabled
              variant="farmer"
            />
            <Text style={styles.ratingNumber}>
              {productData.averageRating !== undefined && productData.averageRating !== null
                ? productData.averageRating.toFixed(1)
                : '0.0'}
            </Text>
            <Text style={styles.reviewCount}>
              ({productData.reviewCount || 0} reviews)
            </Text>
          </View>

          <View style={styles.priceContainer}>
            <View style={styles.priceRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <Text style={styles.priceText}>{formatPrice(productData.price)}</Text>
              <Text style={styles.unitText}>/ {productData.unit || 'KG'}</Text>
            </View>
            {formatAddedTime(productData.createdOn, productData.addedTime) && (
              <View style={styles.addedBadge}>
                <Ionicons
                  name="time-outline"
                  size={12}
                  color={FARMER_THEME.colors.sageText}
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.addedTimeText} numberOfLines={1}>
                  Added {formatAddedTime(productData.createdOn, productData.addedTime)}
                </Text>
              </View>
            )}
          </View>
        </FarmerCard>

        {/* Product Stats Grid with FarmerStatCard */}
        <Text style={styles.sectionHeaderTitle}>QUICK SPECIFICATIONS</Text>
        <View style={styles.statsGrid}>
          <FarmerStatCard
            label="Category"
            value={productData.category || 'N/A'}
            icon={<Ionicons name="grid" size={18} color={FARMER_THEME.colors.emeraldPrimary} />}
            iconBg={FARMER_THEME.colors.pastelGreen}
            style={styles.statCardItem}
          />
          <FarmerStatCard
            label="Available Stock"
            value={`${productData.quantity ?? 0} ${productData.unit || 'KG'}`}
            icon={<Ionicons name="cube" size={18} color="#C98A0C" />}
            iconBg={FARMER_THEME.colors.pastelGold}
            style={styles.statCardItem}
          />
        </View>

        <View style={styles.statsGrid}>
          <FarmerStatCard
            label="Harvest Date"
            value={productData.harvestDate || 'Freshly Harvested'}
            icon={<Ionicons name="calendar" size={18} color="#0D9488" />}
            iconBg={FARMER_THEME.colors.pastelMint}
            style={styles.statCardItem}
          />
          <FarmerStatCard
            label="Listing Status"
            value={productData.isActive ? 'Live on Store' : 'Hidden'}
            icon={<Ionicons name="radio-button-on" size={18} color={productData.isActive ? '#15803D' : '#DC2626'} />}
            iconBg={productData.isActive ? '#DCFCE7' : '#FEE2E2'}
            style={styles.statCardItem}
          />
        </View>

        {/* Product Description */}
        <Text style={styles.sectionHeaderTitle}>DESCRIPTION</Text>
        <FarmerCard style={styles.descriptionCard}>
          <Text style={styles.descriptionContent}>
            {productData.description || 'No description provided for this farm product.'}
          </Text>
        </FarmerCard>

        {/* Customer Photos & Reviews with FarmerCard & stars #F0A020 */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>CUSTOMER PHOTOS & REVIEWS</Text>
          {reviewsList.length > 0 && (
            <TouchableOpacity
              onPress={() => navigation.navigate('FarmerProductReviews', { product: productData })}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllReviewsLink}>View All ({reviewsList.length})</Text>
            </TouchableOpacity>
          )}
        </View>

        <FarmerCard style={styles.reviewsCard}>
          {reviewsLoading ? (
            <ActivityIndicator size="small" color={FARMER_THEME.colors.emeraldPrimary} style={{ marginVertical: 20 }} />
          ) : reviewsList.length === 0 ? (
            <FarmerEmptyState
              icon={<Ionicons name="chatbox-ellipses-outline" size={40} color={FARMER_THEME.colors.sageText} />}
              title="No customer reviews yet"
              subtitle="Reviews and customer photos will appear here once buyers place orders."
            />
          ) : (
            <View style={styles.mediaGalleryContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {reviewsList.flatMap((review) =>
                  (review.media || []).map((m) => {
                    const isVideo = m.mediaType === 'VIDEO';
                    const url = isVideo ? getProductVideoUrl(m.mediaUrl) : getProductImageUrl(m.mediaUrl);
                    return (
                      <TouchableOpacity
                        key={m.mediaId}
                        activeOpacity={0.8}
                        onPress={() => {
                          setMediaModalIsVideo(isVideo);
                          setMediaModalUrl(url);
                          setSelectedReview(review);
                          setMediaModalVisible(true);
                        }}
                        style={styles.galleryMediaWrapper}
                      >
                        {isVideo ? (
                          <View style={styles.galleryVideoContainer}>
                            <Ionicons name="play-circle" size={32} color="#FFFFFF" style={{ zIndex: 2 }} />
                            <View style={styles.videoOverlay} />
                          </View>
                        ) : (
                          <Image source={{ uri: url }} style={styles.galleryThumbnail} />
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>

              <TouchableOpacity
                style={styles.readAllReviewsBtn}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('FarmerProductReviews', { product: productData })}
              >
                <Ionicons name="reader-outline" size={16} color={FARMER_THEME.colors.forestGreen} style={{ marginRight: 6 }} />
                <Text style={styles.readAllReviewsBtnText}>
                  Read All {reviewsList.length} Customer Reviews
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </FarmerCard>
      </ScrollView>

      {/* Sticky Farmer Bottom Bar */}
      <FarmerStickyBar style={styles.bottomBarContainer}>
        <View style={styles.farmerButtonsRow}>
          {/* Edit Product Button */}
          <TouchableOpacity
            style={styles.editBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('AddProduct', { product: productData })}
          >
            <LinearGradient
              colors={FARMER_THEME.colors.primaryBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.editBtnGradient}
            >
              <Ionicons name="pencil" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text numberOfLines={1} style={styles.editBtnText}>
                Edit Product
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Deactivate / Activate Button */}
          <TouchableOpacity
            style={[
              styles.toggleStatusBtn,
              productData.isActive ? styles.deactivateBtn : styles.activateBtn,
            ]}
            activeOpacity={0.85}
            onPress={handleToggleActive}
            disabled={updatingStatus}
          >
            {updatingStatus ? (
              <ActivityIndicator
                size="small"
                color={productData.isActive ? '#DC2626' : '#15803D'}
              />
            ) : (
              <View style={styles.toggleStatusContent}>
                <Ionicons
                  name="power"
                  size={15}
                  color={productData.isActive ? '#DC2626' : '#15803D'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.toggleStatusText,
                    productData.isActive ? styles.deactivateText : styles.activateText,
                  ]}
                >
                  {productData.isActive ? 'Deactivate' : 'Activate'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.helpTextRow}>
          <Ionicons name="information-circle-outline" size={13} color={FARMER_THEME.colors.sageText} />
          <Text style={styles.helpText}>You can update stock, price and media at any time.</Text>
        </View>
      </FarmerStickyBar>

      <MediaViewerModal
        visible={mediaModalVisible}
        mediaUrl={mediaModalUrl}
        isVideo={mediaModalIsVideo}
        review={selectedReview}
        onClose={() => {
          setMediaModalVisible(false);
          setMediaModalUrl(null);
          setMediaModalIsVideo(false);
          setSelectedReview(null);
        }}
      />
    </FarmerPageBackground>
  );
};

const styles = StyleSheet.create({
  glassHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 150,
  },
  imageCardWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: FARMER_THEME.colors.cardBorder,
    marginBottom: 16,
    ...FARMER_THEME.shadows.card,
  },
  imageCardGradient: {
    width: '100%',
    height: 290,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productHeroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontFamily: FARMER_THEME.typography.fontFamilyRegular,
    fontSize: 13,
    color: FARMER_THEME.colors.sageText,
    marginTop: 8,
  },
  organicTagOverlay: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    backgroundColor: 'rgba(8, 36, 25, 0.78)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  organicTagText: {
    color: '#FFFFFF',
    fontFamily: FARMER_THEME.typography.fontFamilyMedium,
    fontSize: 12,
  },
  statusBadgeOverlay: {
    position: 'absolute',
    top: 14,
    right: 14,
  },
  headerInfoCard: {
    marginBottom: 14,
    padding: 16,
  },
  productName: {
    fontFamily: FARMER_THEME.typography.fontSerifBold,
    fontSize: 18,
    color: FARMER_THEME.colors.forestGreen,
    marginBottom: 6,
    lineHeight: 24,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  ratingNumber: {
    fontFamily: FARMER_THEME.typography.fontFamilyBold,
    fontSize: 13,
    color: FARMER_THEME.colors.forestGreen,
    marginLeft: 6,
  },
  reviewCount: {
    fontFamily: FARMER_THEME.typography.fontFamilyRegular,
    fontSize: 12,
    color: FARMER_THEME.colors.sageText,
    marginLeft: 4,
  },
  priceContainer: {
    borderTopWidth: 1,
    borderTopColor: FARMER_THEME.colors.cardBorder,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    rowGap: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currencySymbol: {
    fontFamily: FARMER_THEME.typography.fontSerifBold,
    fontSize: 16,
    color: FARMER_THEME.colors.forestGreen,
    marginRight: 2,
  },
  priceText: {
    fontFamily: FARMER_THEME.typography.fontSerifBold,
    fontSize: 22,
    color: FARMER_THEME.colors.forestGreen,
  },
  unitText: {
    fontFamily: FARMER_THEME.typography.fontFamilyMedium,
    fontSize: 13,
    color: FARMER_THEME.colors.sageText,
    marginLeft: 4,
  },
  addedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3FAF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2EFE6',
  },
  addedTimeText: {
    fontFamily: FARMER_THEME.typography.fontFamilyRegular,
    fontSize: 11,
    color: FARMER_THEME.colors.sageText,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  sectionHeaderTitle: {
    fontFamily: FARMER_THEME.typography.fontFamilyBold,
    fontSize: 12,
    color: FARMER_THEME.colors.forestGreen,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 8,
  },
  viewAllReviewsLink: {
    fontFamily: FARMER_THEME.typography.fontFamilySemiBold,
    fontSize: 12,
    color: FARMER_THEME.colors.emeraldPrimary,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCardItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  descriptionCard: {
    marginBottom: 14,
    padding: 14,
  },
  descriptionContent: {
    fontFamily: FARMER_THEME.typography.fontFamilyRegular,
    fontSize: 13,
    color: '#2C3E35',
    lineHeight: 20,
  },
  reviewsCard: {
    marginBottom: 20,
    padding: 16,
  },
  mediaGalleryContainer: {
    marginTop: 4,
  },
  galleryMediaWrapper: {
    marginRight: 12,
    borderRadius: 14,
    overflow: 'hidden',
    width: 90,
    height: 90,
    borderWidth: 1,
    borderColor: FARMER_THEME.colors.cardBorder,
  },
  galleryThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  galleryVideoContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 1,
  },
  readAllReviewsBtn: {
    marginTop: 14,
    backgroundColor: FARMER_THEME.colors.pastelGreen,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: FARMER_THEME.colors.cardBorder,
  },
  readAllReviewsBtnText: {
    color: FARMER_THEME.colors.forestGreen,
    fontFamily: FARMER_THEME.typography.fontFamilySemiBold,
    fontSize: 13,
  },
  bottomBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 22,
  },
  farmerButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  editBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    overflow: 'hidden',
    marginRight: 8,
    shadowColor: '#145238',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  editBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  editBtnText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 13.5,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  toggleStatusBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    marginLeft: 8,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  deactivateBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  activateBtn: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  toggleStatusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleStatusText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 13.5,
    letterSpacing: 0.2,
  },
  deactivateText: {
    color: '#DC2626',
  },
  activateText: {
    color: '#15803D',
  },
  helpTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  helpText: {
    fontFamily: FARMER_THEME.typography.fontFamilyRegular,
    fontSize: 10.5,
    color: FARMER_THEME.colors.sageText,
    marginLeft: 4,
  },
});

export default FarmerProductDetailScreen;

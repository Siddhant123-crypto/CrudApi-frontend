import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Linking,
  ActivityIndicator,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api, {BASE_URL} from '../services/api';
import {getProductImageUrl, getProductById, getProductVideoUrl} from '../services/productService';
import {getProductReviews} from '../services/reviewService';
import {StarRating} from '../components/reviews/StarRating';
import {MediaViewerModal} from '../components/reviews/MediaViewerModal';
import {Review} from '../types';

const {width} = Dimensions.get('window');

const FarmerProductDetailScreen = ({route, navigation}: any) => {
  const {product} = route.params;

  const [productData, setProductData] = useState<any>(product);
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(true);

  // Media Viewer state
  const [mediaModalVisible, setMediaModalVisible] = useState(false);
  const [mediaModalUrl, setMediaModalUrl] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back-outline" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          My Product Details
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 100}}>
        {/* Header Image Section */}
        <View style={styles.headerImageContainer}>
          {imageUrl ? (
            <Image source={{uri: imageUrl}} style={styles.headerImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={{fontSize: 50}}>🌾</Text>
            </View>
          )}

          {/* Organic Tag */}
          <View style={styles.organicTagOverlay}>
            <Ionicons name="leaf" size={14} color="#FFF" style={{marginRight: 4}} />
            <Text style={styles.organicTagText}>Organic</Text>
          </View>
        </View>

        {/* Content Container (Overlaps Image) */}
        <View style={styles.contentContainer}>
          {/* Title & Rating */}
          <Text style={styles.productName}>{productData.productName}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color="#FFC107" />
            <Text style={styles.ratingText}>
              {" "}
              {productData.averageRating !== undefined && productData.averageRating !== null
                ? productData.averageRating.toFixed(1)
                : "0.0"}{" "}
              <Text style={styles.reviewCount}>
                ({productData.reviewCount || 0} reviews)
              </Text>
            </Text>
          </View>

          {/* Price & Status */}
          <View style={styles.priceStatusRow}>
            <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
              <Text style={styles.price}>₹{productData.price?.toFixed(2) || '0.00'}</Text>
              <Text style={styles.unit}> / {productData.unit || 'KG'}</Text>
            </View>
            <View style={[styles.statusBadge, productData.isActive ? styles.statusActive : styles.statusInactive]}>
              <Text style={[styles.statusText, productData.isActive ? styles.statusActiveText : styles.statusInactiveText]}>
                {productData.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          {/* Tags */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsContainer}>
            <View style={styles.tag}>
              <Ionicons name="nutrition-outline" size={14} color="#1E3A8A" />
              <Text style={styles.tagText}>Fresh & Healthy</Text>
            </View>
            <View style={styles.tag}>
              <Ionicons name="leaf-outline" size={14} color="#1E3A8A" />
              <Text style={styles.tagText}>100% Organic</Text>
            </View>
          </ScrollView>

          {/* Product Details Card */}
          <Text style={styles.sectionTitle}>Product Details</Text>
          <View style={styles.card}>
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Ionicons name="grid-outline" size={16} color="#1E3A8A" />
                <Text style={styles.detailLabel}>Category</Text>
              </View>
              <Text style={styles.detailValue}>{productData.category || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Ionicons name="cube-outline" size={16} color="#1E3A8A" />
                <Text style={styles.detailLabel}>Available Quantity</Text>
              </View>
              <Text style={styles.detailValue}>{productData.quantity} {productData.unit || 'KG'}</Text>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Ionicons name="calendar-clear-outline" size={16} color="#1E3A8A" />
                <Text style={styles.detailLabel}>Harvest Date</Text>
              </View>
              <Text style={styles.detailValue}>{productData.harvestDate || 'Freshly Harvested'}</Text>
            </View>
            <View style={[styles.detailRow, {borderBottomWidth: 0, alignItems: 'flex-start', marginTop: 8}]}>
              <View style={styles.detailLabelContainer}>
                <Ionicons name="document-text-outline" size={16} color="#1E3A8A" />
                <Text style={styles.detailLabel}>Description</Text>
              </View>
              <Text style={[styles.detailValue, {flex: 1, textAlign: 'right', lineHeight: 20}]}>
                {productData.description || 'No description provided.'}
              </Text>
            </View>
          </View>

          {/* Customer Reviews Section */}
          <Text style={styles.sectionTitle}>Customer Photos & Videos</Text>
          <View style={styles.reviewsSection}>
            {reviewsLoading ? (
              <ActivityIndicator size="small" color="#1E3A8A" style={{ marginVertical: 20 }} />
            ) : reviewsList.length === 0 ? (
              <View style={styles.emptyReviewsContainer}>
                <Ionicons name="chatbox-ellipses-outline" size={40} color="#9CA3AF" />
                <Text style={styles.emptyReviewsText}>No reviews yet for this product.</Text>
              </View>
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
                            if (isVideo) {
                              Linking.openURL(url).catch(() =>
                                Alert.alert('Error', 'Could not play video. Please try again.')
                              );
                            } else {
                              setMediaModalUrl(url);
                              setSelectedReview(review);
                              setMediaModalVisible(true);
                            }
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
                  style={styles.viewAllBtn}
                  onPress={() => navigation.navigate('FarmerProductReviews', { product: productData })}
                >
                  <Text style={styles.viewAllBtnText}>Read All {reviewsList.length} Reviews</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

        </View>
      </ScrollView>

      {/* Bottom Action Area */}
      <View style={styles.farmerBottomBar}>
        <View style={styles.farmerButtonsRow}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => navigation.navigate('AddProduct', {product: productData})}
          >
            <Ionicons name="pencil" size={18} color="#2E7D32" style={{marginRight: 8}} />
            <Text style={styles.editButtonText}>Edit Product</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.deactivateButton}>
            <Ionicons name="power" size={18} color="#FFF" style={{marginRight: 8}} />
            <Text style={styles.deactivateButtonText}>Deactivate</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.helpTextRow}>
          <Ionicons name="information-circle-outline" size={14} color="#757575" />
          <Text style={styles.helpText}>You can edit product details anytime.</Text>
        </View>
      </View>

      <MediaViewerModal
        visible={mediaModalVisible}
        imageUrl={mediaModalUrl}
        review={selectedReview}
        onClose={() => {
          setMediaModalVisible(false);
          setMediaModalUrl(null);
          setSelectedReview(null);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#1E5631',
  },
  backBtn: {
    padding: 4,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
  },
  headerImageContainer: {
    width: '100%',
    height: 320,
    position: 'relative',
    backgroundColor: '#E0E0E0',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C8E6C9',
  },
  organicTagOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    backgroundColor: 'rgba(27, 94, 32, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  organicTagText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  contentContainer: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 24,
    marginTop: -30,
    minHeight: 500,
  },
  productName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  reviewCount: {
    fontWeight: '400',
    color: '#6B7280',
  },
  priceStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  price: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  unit: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusInactive: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusActiveText: {
    color: '#166534',
  },
  statusInactiveText: {
    color: '#991B1B',
  },
  tagsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  tagText: {
    fontSize: 12,
    color: '#1E3A8A',
    fontWeight: '600',
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 8,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  reviewsSection: {
    marginBottom: 30,
  },
  emptyReviewsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  emptyReviewsText: {
    color: '#9CA3AF',
    marginTop: 8,
    fontSize: 14,
  },
  mediaGalleryContainer: {
    marginTop: 8,
  },
  galleryMediaWrapper: {
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    width: 100,
    height: 100,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  galleryThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  galleryVideoContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 1,
  },
  viewAllBtn: {
    marginTop: 16,
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  viewAllBtnText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 14,
  },
  farmerBottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  farmerButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 14,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  editButtonText: {
    color: '#2E7D32',
    fontWeight: '700',
    fontSize: 15,
  },
  deactivateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
    marginLeft: 8,
  },
  deactivateButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  helpTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  helpText: {
    fontSize: 12,
    color: '#757575',
    marginLeft: 4,
  },
});

export default FarmerProductDetailScreen;

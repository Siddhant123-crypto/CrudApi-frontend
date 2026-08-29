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
  TextInput,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useAuth} from '../context/AuthContext';
import {getProductImageUrl, getProductById, getProductVideoUrl} from '../services/productService';
import {getProductReviews} from '../services/reviewService';
import {StarRating} from '../components/reviews/StarRating';
import {ReviewCard} from '../components/reviews/ReviewCard';
import {MediaViewerModal} from '../components/reviews/MediaViewerModal';
import {Review} from '../types';
import {useFocusEffect} from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api, {BASE_URL} from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const {width} = Dimensions.get('window');
const PRODUCT_CARD_WIDTH = width * 0.4; // Slightly smaller for horizontal scroll

// Preset price buttons
const PRICE_PRESETS = [
  { label: 'All', min: 0, max: 99999 },
  { label: '₹10–50', min: 10, max: 50 },
  { label: '₹50–100', min: 50, max: 100 },
  { label: '₹100–200', min: 100, max: 200 },
  { label: '₹200–500', min: 200, max: 500 },
  { label: '₹500–1000', min: 500, max: 1000 },
  { label: '₹1000+', min: 1000, max: 99999 },
];

const ProductDetailScreen = ({route, navigation}: any) => {
  const {product} = route.params;
  const {user} = useAuth();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [ordering, setOrdering] = useState(false);

  const [productData, setProductData] = useState<any>(product);
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(true);

  // Media Viewer state
  const [mediaModalVisible, setMediaModalVisible] = useState(false);
  const [mediaModalUrl, setMediaModalUrl] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  // Similar Products state
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [similarLoading, setSimilarLoading] = useState<boolean>(true);

  // Filters
  const [searchText, setSearchText] = useState('');
  const [activePriceIndex, setActivePriceIndex] = useState(0); // 0 = "All"
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [categoryDropdownVisible, setCategoryDropdownVisible] = useState(false);

  const fetchSimilarProducts = async (currentId: string) => {
    try {
      setSimilarLoading(true);
      const res = await api.get('/product/getAll');
      const raw: any[] = Array.isArray(res.data) ? res.data : [];
      const similar = raw.filter((p: any) => 
        p.isDelete !== true && 
        p.status !== 'DELETED' && 
        p.status !== 'INACTIVE' && 
        p.productId !== currentId
      );
      setSimilarProducts(similar); // Show all other active products
    } catch (error) {
      console.log('Error fetching similar products:', error);
    } finally {
      setSimilarLoading(false);
    }
  };

  const fetchProductAndReviews = async () => {
    try {
      const updatedProduct = await getProductById(product.productId);
      setProductData(updatedProduct);

      const reviews = await getProductReviews(product.productId);
      setReviewsList(reviews);

      if (updatedProduct) {
        fetchSimilarProducts(product.productId);
      }
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

  const handleGoToCart = () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to add items to cart.');
      return;
    }
    addToCart(productData.productId, quantity);
    navigation.navigate('Cart');
  };

  const handleBuyNow = () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to place an order.');
      return;
    }
    
    const orderItems = [{
      product: productData,
      quantity: quantity
    }];
    const totalAmount = productData.price * quantity;

    navigation.navigate('Checkout', { orderItems, totalAmount });
  };

  const isCustomer = user?.role === 'USER';
  const isFarmer = user?.role === 'FARMER';
  
  const availableCategories = [
    'All',
    'Vegetable',
    'Leafy Vegetable',
    'Fruit',
    'Grains',
    'Dairy',
    'Wild Forest Vegetable',
    'Root Vegetable'
  ];

  const displayedSimilarProducts = similarProducts.filter(p => {
    const activePreset = PRICE_PRESETS[activePriceIndex];
    const name = p.productName || '';
    const matchesSearch = name.toLowerCase().includes(searchText.toLowerCase());
    const inPriceRange = p.price >= activePreset.min && p.price <= activePreset.max;
    const categoryMatch = selectedCategoryFilter === 'All' || p.category?.toLowerCase() === selectedCategoryFilter.toLowerCase();
    return matchesSearch && inPriceRange && categoryMatch;
  });

  return (
    <View style={styles.container}>
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

          {/* Top Bar (Heart only) */}
          <View style={styles.topBar}>
            {isCustomer && (
              <TouchableOpacity style={styles.iconButton} onPress={() => toggleWishlist(productData.productId)}>
                <Ionicons name={isInWishlist(productData.productId) ? "heart" : "heart-outline"} size={24} color={isInWishlist(productData.productId) ? "#FF5252" : "#FFF"} />
              </TouchableOpacity>
            )}
          </View>

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
          <View style={styles.authorRow}>
            <Text style={styles.authorText}>by {productData.farmerName || 'Farmer'}</Text>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" style={{marginLeft: 4}} />
          </View>
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
            <View style={styles.tag}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#1E3A8A" />
              <Text style={styles.tagText}>Pesticide Free</Text>
            </View>
          </ScrollView>

          {/* Farmer Details Card */}
          <Text style={styles.sectionTitle}>Farmer Details</Text>
          <View style={styles.card}>
            <View style={styles.farmerCardContent}>
              <View style={styles.farmerAvatarPlaceholder}>
                <Ionicons name="person" size={32} color="#9E9E9E" />
              </View>
              <View style={styles.farmerInfo}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={styles.farmerName}>{productData.farmerName || 'Farmer Name'}</Text>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" style={{marginLeft: 4}} />
                </View>
                <Text style={styles.farmerSubtitle}>Experienced Farmer</Text>
                
                <View style={styles.iconRow}>
                  <Ionicons name="location-outline" size={14} color="#757575" />
                  <Text style={styles.iconText}>{productData.farmerAddress || 'Nashik, Maharashtra'}</Text>
                </View>
                <View style={styles.iconRow}>
                  <Ionicons name="calendar-outline" size={14} color="#757575" />
                  <Text style={styles.iconText}>Member since Jan 2025</Text>
                </View>
              </View>
            </View>
          </View>

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
                <Text style={styles.detailLabel}>Quantity</Text>
              </View>
              <Text style={styles.detailValue}>{productData.quantity} {productData.unit || 'KG'} Available</Text>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Ionicons name="ribbon-outline" size={16} color="#1E3A8A" />
                <Text style={styles.detailLabel}>Quality</Text>
              </View>
              <Text style={styles.detailValue}>Premium</Text>
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
                {productData.description || 'Fresh and naturally ripened. Rich in nutrients and great for health.'}
              </Text>
            </View>
          </View>

          {/* Location Card */}
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.locationCard}>
            <View style={styles.locationInfo}>
              <Ionicons name="location" size={28} color="#1E3A8A" style={{marginRight: 10}} />
              <View>
                <Text style={styles.locationCity}>{productData.farmerAddress?.split(',')[0] || 'Nashik'}, Nashik</Text>
                <Text style={styles.locationSub}>Near Panchavati</Text>
              </View>
            </View>
            {/* A dummy map background pattern can go here */}
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
                              import('react-native').then(({ Linking, Alert }) => {
                                Linking.openURL(url).catch(() =>
                                  Alert.alert('Error', 'Could not play video. Please try again.')
                                );
                              });
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
                <TouchableOpacity style={styles.viewAllBtn}>
                  <Text style={styles.viewAllBtnText}>Read All {reviewsList.length} Reviews</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Similar Products Section */}
          {similarProducts.length > 0 && (
            <View style={styles.similarSection}>
              <Text style={styles.sectionTitle}>Explore More Products</Text>
              
              {/* ─── PREMIUM SEARCH BAR AND CATEGORY FILTER ─── */}
              <View style={styles.searchWrapper}>
                <View style={[styles.searchContainer, searchFocused && styles.searchContainerFocused]}>
                  <View style={styles.searchIconCircle}>
                    <Ionicons name="search" size={18} color="#FFFFFF" />
                  </View>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search..."
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

                <TouchableOpacity 
                  style={styles.categoryFilterBtn} 
                  onPress={() => setCategoryDropdownVisible(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="options-outline" size={18} color="#2563EB" />
                  <Text style={styles.categoryFilterBtnText} numberOfLines={1}>
                    {selectedCategoryFilter}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color="#2563EB" style={{marginLeft: 2}} />
                </TouchableOpacity>
              </View>

              {/* ─── PRICE FILTER BUTTONS ─── */}
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

              {similarLoading ? (
                <ActivityIndicator size="small" color="#1E3A8A" style={{ marginVertical: 20 }} />
              ) : (
                <View style={styles.similarGridContainer}>
                  {displayedSimilarProducts.map((item) => (
                    <TouchableOpacity
                      key={item.productId}
                      activeOpacity={0.9}
                      style={styles.similarCard}
                      onPress={() => navigation.push('ProductDetail', { product: item })}
                    >
                      <View style={styles.similarImageContainer}>
                        <Image
                          source={
                            item.productPhoto
                              ? { uri: `${BASE_URL}/product/image/${item.productPhoto}` }
                              : { uri: 'https://placehold.co/200x200/E8F5E2/2E9B32?text=Fresh' }
                          }
                          style={styles.similarImage}
                          resizeMode="cover"
                        />
                        <View style={styles.freshTag}>
                          <Text style={styles.freshTagText}>Fresh</Text>
                        </View>
                      </View>
                      <View style={styles.similarInfo}>
                        <Text style={styles.similarProductName} numberOfLines={1}>
                          {item.productName}
                        </Text>
                        <Text style={styles.similarProductFarmer} numberOfLines={1}>
                          🌾 {item.farmerName || 'Local Farmer'}
                        </Text>
                        <View style={styles.similarRatingRow}>
                          <StarRating rating={Math.round(item.averageRating || 0)} size={10} disabled={true} />
                          <Text style={styles.similarRatingText}>
                            {item.averageRating ? item.averageRating.toFixed(1) : 'New'}
                          </Text>
                        </View>
                        <View style={styles.similarPriceRow}>
                          <Text style={styles.similarProductPrice}>₹{item.price}</Text>
                          <Text style={styles.similarProductUnit}>/{item.unit || 'kg'}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

        </View>
      </ScrollView>

      {/* Bottom Action Area */}
      {isCustomer && (
        <View style={styles.bottomBar}>
          {/* Quantity Selector Row */}
          <View style={styles.bottomTopRow}>
            <View style={styles.quantityContainer}>
              <TouchableOpacity style={styles.quantityBtn} onPress={() => setQuantity(q => Math.max(1, q - 1))}>
                <Text style={styles.quantityBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{quantity}</Text>
              <TouchableOpacity style={styles.quantityBtn} onPress={() => setQuantity(q => q + 1)}>
                <Text style={styles.quantityBtnText}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.totalPriceText}>₹{(productData.price * quantity).toFixed(2)}</Text>
          </View>

          {/* Flipkart-style Buttons Row */}
          <View style={styles.actionButtonsRow}>
            {/* Go to Cart — left */}
            <TouchableOpacity style={styles.goToCartBtn} onPress={handleGoToCart} activeOpacity={0.8}>
              <Ionicons name="cart-outline" size={18} color="#F59E0B" style={{marginRight: 6}} />
              <Text style={styles.goToCartBtnText}>Go to Cart</Text>
            </TouchableOpacity>

            {/* Buy Now — right */}
            <TouchableOpacity style={styles.buyNowBtn} onPress={handleBuyNow} disabled={ordering} activeOpacity={0.85}>
              <Ionicons name="flash" size={18} color="#FFF" style={{marginRight: 6}} />
              <Text style={styles.buyNowBtnText}>Buy Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isFarmer && (
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
      )}

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

      {/* Category Dropdown Modal */}
      <Modal
        visible={categoryDropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCategoryDropdownVisible(false)}
      >
        <TouchableOpacity 
          style={styles.dropdownOverlay} 
          activeOpacity={1} 
          onPress={() => setCategoryDropdownVisible(false)}
        >
          <View style={styles.dropdownContainer}>
            <Text style={styles.dropdownTitle}>Select Category</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {availableCategories.map(cat => (
                <TouchableOpacity 
                  key={cat} 
                  style={styles.dropdownItem} 
                  onPress={() => { 
                    setSelectedCategoryFilter(cat); 
                    setCategoryDropdownVisible(false); 
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText, 
                    selectedCategoryFilter === cat && styles.dropdownItemTextActive
                  ]}>
                    {cat}
                  </Text>
                  {selectedCategoryFilter === cat && (
                    <Ionicons name="checkmark" size={18} color="#1E3A8A" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  topBar: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
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
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  authorText: {
    fontSize: 15,
    color: '#4B5563',
    fontWeight: '500',
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
  farmerCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  farmerAvatarPlaceholder: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  farmerInfo: {
    flex: 1,
  },
  farmerName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  farmerSubtitle: {
    fontSize: 13,
    color: '#1E3A8A',
    fontWeight: '600',
    marginBottom: 8,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  iconText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
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
    width: 120,
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
  locationCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  locationCity: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  locationSub: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 12,
  },
  bottomTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  totalPriceText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
  },
  quantityBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityBtnText: {
    fontSize: 20,
    color: '#374151',
    fontWeight: '600',
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 12,
    color: '#111827',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  goToCartBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 13,
    backgroundColor: '#FFFBEB',
  },
  goToCartBtnText: {
    color: '#D97706',
    fontSize: 15,
    fontWeight: '700',
  },
  buyNowBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 13,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  buyNowBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  // Legacy — unused but kept to avoid any reference errors
  buyBtn: {
    flex: 1,
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  farmerBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  farmerButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2E7D32',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingVertical: 14,
    marginRight: 10,
  },
  editButtonText: {
    color: '#2E7D32',
    fontSize: 15,
    fontWeight: '700',
  },
  deactivateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1B5E20',
    borderRadius: 12,
    paddingVertical: 14,
    marginLeft: 10,
  },
  deactivateButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  helpTextRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  reviewsSection: {
    marginTop: 8,
  },
  emptyReviewsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginVertical: 10,
  },
  emptyReviewsText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  mediaGalleryContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 40,
  },
  galleryMediaWrapper: {
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  galleryThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  galleryVideoContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
  },
  viewAllBtn: {
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  viewAllBtnText: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: 14,
  },
  
  /* ── Similar Products ── */
  similarSection: {
    marginTop: 10,
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  searchContainerFocused: {
    borderColor: '#1E3A8A',
    shadowOpacity: 0.15,
  },
  searchIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#2C3E50',
    fontWeight: '500',
    paddingVertical: 8,
  },
  clearBtn: {
    padding: 8,
  },
  categoryFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 50, // Match search input height approximately
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  categoryFilterBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
    marginLeft: 6,
    maxWidth: 70, // Keep it compact
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    width: '80%',
    maxHeight: '60%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '500',
  },
  dropdownItemTextActive: {
    color: '#1E3A8A',
    fontWeight: '700',
  },
  priceFilterWrapper: {
    marginBottom: 16,
  },
  priceFilterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  priceFilterTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2C3E50',
    marginLeft: 6,
  },
  priceButtonsScroll: {
    paddingRight: 16,
    paddingBottom: 8,
  },
  priceChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 2,
  },
  priceChipActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
    elevation: 4,
    shadowOpacity: 0.2,
  },
  priceChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7F8C8D',
  },
  priceChipTextActive: {
    color: '#FFFFFF',
  },
  similarGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  similarCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  similarImageContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#EDF5EE',
    position: 'relative',
  },
  similarImage: {
    width: '100%',
    height: '100%',
  },
  freshTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  freshTagText: {
    color: '#16A34A',
    fontSize: 10,
    fontWeight: '700',
  },
  similarInfo: {
    padding: 12,
  },
  similarProductName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#121912',
    marginBottom: 3,
  },
  similarProductFarmer: {
    fontSize: 10,
    color: '#687168',
    marginBottom: 5,
  },
  similarRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  similarRatingText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7F6E',
    marginLeft: 4,
  },
  similarPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  similarProductPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  similarProductUnit: {
    fontSize: 11,
    color: '#687168',
    marginLeft: 2,
  },
});

export default ProductDetailScreen;

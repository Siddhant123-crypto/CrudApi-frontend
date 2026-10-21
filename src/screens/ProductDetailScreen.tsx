import React, {useState, useCallback, useRef, useLayoutEffect} from 'react';
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
  Animated,
  Pressable,
  Share,
  Platform,
} from 'react-native';
import Svg, { Defs, RadialGradient as SvgRadialGradient, Stop, Rect } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useAuth} from '../context/AuthContext';
import {getProductImageUrl, getProductById, getProductVideoUrl} from '../services/productService';
import {getProductReviews} from '../services/reviewService';
import {StarRating} from '../components/reviews/StarRating';
import {ReviewCard} from '../components/reviews/ReviewCard';
import {MediaViewerModal} from '../components/reviews/MediaViewerModal';
import {Review} from '../types';
import {formatAddedTime} from '../utils/dateUtils';
import {useFocusEffect} from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import api, {BASE_URL} from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { THEME } from '../constants/theme';
import { PageBackground } from '../components/ui/PageBackground';
import { ThemedHeader } from '../components/ui/ThemedHeader';
import { Card } from '../components/ui/Card';
import { PrimaryButton, MaroonButton } from '../components/ui/Buttons';
import { ThemedBadge } from '../components/ui/ThemedBadge';
import { HeartIcon, ShareIcon } from '../components/CustomerIcons';
import ProductCard from '../components/ProductCard';

const formatDisplayPrice = (val: any) => {
  const num = Number(val);
  if (isNaN(num)) return val ?? '0';
  if (num % 1 === 0) {
    return String(Math.round(num));
  }
  return num.toFixed(2).replace(/\.00$/, '').replace(/(\.[0-9])0$/, '$1');
};

const {width} = Dimensions.get('window');
const PRODUCT_CARD_WIDTH = width * 0.4;
const PRICE_PRESETS = [
  { label: 'All', min: 0, max: 99999 },
  { label: '₹10–50', min: 10, max: 50 },
  { label: '₹50–100', min: 50, max: 100 },
  { label: '₹100–200', min: 100, max: 200 },
  { label: '₹200–500', min: 200, max: 500 },
  { label: '₹500–1000', min: 500, max: 1000 },
  { label: '₹1000+', min: 1000, max: 99999 },
];

interface AnimatedButtonProps {
  onPress: () => void;
  style: any;
  activeScale?: number;
  disabled?: boolean;
  children: React.ReactNode;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  onPress,
  style,
  activeScale = 0.93,
  disabled = false,
  children,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: activeScale,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 8,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={{ flex: 1 }}
    >
      {({ pressed }) => (
        <Animated.View
          style={[
            style,
            {
              transform: [{ scale }],
              opacity: disabled ? 0.6 : pressed ? 0.82 : 1,
            },
          ]}
        >
          {children}
        </Animated.View>
      )}
    </Pressable>
  );
};

const ProductDetailScreen = ({route, navigation}: any) => {
  const insets = useSafeAreaInsets();
  const {product} = route.params;
  const {user} = useAuth();
  const { addToCart, cart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [quantity, setQuantity] = useState(0);
  const [goToCartLoading, setGoToCartLoading] = useState(false);
  const [buyNowLoading, setBuyNowLoading] = useState(false);
  const [productData, setProductData] = useState<any>(product);
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(true);
  const [mediaModalVisible, setMediaModalVisible] = useState(false);
  const [mediaModalUrl, setMediaModalUrl] = useState<string | null>(null);
  const [mediaModalIsVideo, setMediaModalIsVideo] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [similarLoading, setSimilarLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState('');
  const [activePriceIndex, setActivePriceIndex] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [categoryDropdownVisible, setCategoryDropdownVisible] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${productData?.productName || 'Fresh Produce'} on Farm2Home!`,
      });
    } catch (e) {
      console.log('Share error:', e);
    }
  };

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
      setSimilarProducts(similar);
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
  const handleGoToCart = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to add items to cart.');
      return;
    }
    const finalQuantity = quantity === 0 ? 1 : quantity;
    if (quantity === 0) setQuantity(1);

    const alreadyInCart = cart?.items?.some((i: any) => i.productId === productData.productId);

    if (alreadyInCart) {
      navigation.navigate('Cart');
      return;
    }

    setGoToCartLoading(true);
    try {
      await addToCart(productData.productId, finalQuantity, false);
    } catch (err) {
      console.log('Error adding to cart before navigating:', err);
    } finally {
      setGoToCartLoading(false);
      navigation.navigate('Cart');
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to place an order.');
      return;
    }
    const finalQuantity = quantity === 0 ? 1 : quantity;
    if (quantity === 0) setQuantity(1);

    setBuyNowLoading(true);

    const rawPrice = productData.price;
    const price = typeof rawPrice === 'number' ? rawPrice : parseFloat(rawPrice) || 0;
    const totalAmount = parseFloat((price * finalQuantity).toFixed(2));

    const orderItems = [{
      product: {
        productId: productData.productId,
        productName: productData.productName || 'Product',
        price: price,
        unit: productData.unit || 'kg',
        productPhoto: productData.productPhoto || null,
      },
      quantity: finalQuantity,
    }];

    setTimeout(() => {
      setBuyNowLoading(false);
      navigation.navigate('Checkout', { orderItems, totalAmount });
    }, 120);
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
    <PageBackground>
      <ThemedHeader
        title="Product Details"
        titleAlign="left"
        titleStyle={styles.headerTitle}
        rightAction={
          <View style={styles.headerGlassActions}>
            {isCustomer && (
              <TouchableOpacity
                style={styles.headerGlassBtn}
                onPress={() => toggleWishlist(productData.productId)}
                activeOpacity={0.8}
              >
                <HeartIcon
                  size={19}
                  color={isInWishlist(productData.productId) ? THEME.colors.heartActive : THEME.colors.white}
                  fill={isInWishlist(productData.productId) ? THEME.colors.heartActive : 'none'}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.headerGlassBtn}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <ShareIcon size={18} color={THEME.colors.white} />
            </TouchableOpacity>
          </View>
        }
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: isCustomer ? 130 : 60}}>
        {/* Large Peach Radial Hero Image Card */}
        <View style={styles.heroCardWrapper}>
          <Card style={styles.heroCard} bordered={false}>
            <Svg width="100%" height={250} style={StyleSheet.absoluteFillObject}>
              <Defs>
                <SvgRadialGradient id="prodHeroGrad" cx="0.5" cy="0.4" r="0.6">
                  <Stop offset="0%" stopColor={THEME.colors.tileRadialStart} />
                  <Stop offset="55%" stopColor={THEME.colors.tileRadialMiddle} />
                  <Stop offset="100%" stopColor={THEME.colors.tileRadialEnd} />
                </SvgRadialGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height={250} rx={24} fill="url(#prodHeroGrad)" />
            </Svg>

            {imageUrl ? (
              <Image source={{uri: imageUrl}} style={styles.heroImage} resizeMode="contain" />
            ) : (
              <Text style={{fontSize: 60}}>🌱</Text>
            )}

            <View style={styles.organicTagOverlay}>
              <Ionicons name="leaf" size={13} color={THEME.colors.success} style={{marginRight: 4}} />
              <Text style={styles.organicTagText}>100% Fresh & Organic</Text>
            </View>
          </Card>
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.productName}>{productData.productName}</Text>
          <View style={styles.authorRow}>
            <Text style={styles.authorText}>by {productData.farmerName || 'Farmer'}</Text>
            <Ionicons name="checkmark-circle" size={16} color={THEME.colors.success} style={{marginLeft: 4}} />
          </View>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color={THEME.colors.star} />
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

          <View style={styles.priceStatusRow}>
            <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
              <Text style={styles.price}>
                ₹{formatDisplayPrice(productData.price)}
              </Text>
              <Text style={styles.unit}> / {productData.unit || 'KG'}</Text>
            </View>
            <ThemedBadge
              label={productData.isActive ? 'Active' : 'Inactive'}
              variant={productData.isActive ? 'success' : 'neutral'}
            />
          </View>
          {}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsContainer}>
            <View style={styles.tag}>
              <Ionicons name="nutrition-outline" size={14} color={THEME.colors.accentDeep} />
              <Text style={styles.tagText}>Fresh & Healthy</Text>
            </View>
            <View style={styles.tag}>
              <Ionicons name="leaf-outline" size={14} color={THEME.colors.accentDeep} />
              <Text style={styles.tagText}>100% Organic</Text>
            </View>
            <View style={styles.tag}>
              <Ionicons name="shield-checkmark-outline" size={14} color={THEME.colors.accentDeep} />
              <Text style={styles.tagText}>Pesticide Free</Text>
            </View>
          </ScrollView>
          {}
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
          {}
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
            {formatAddedTime(productData.createdOn, productData.addedTime) && (
              <View style={styles.detailRow}>
                <View style={styles.detailLabelContainer}>
                  <Ionicons name="time-outline" size={16} color="#1E3A8A" />
                  <Text style={styles.detailLabel}>Added</Text>
                </View>
                <Text style={styles.detailValue}>{formatAddedTime(productData.createdOn, productData.addedTime)}</Text>
              </View>
            )}
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
          {}
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.locationCard}>
            <View style={styles.locationInfo}>
              <View style={styles.locationPinBox}>
                <Ionicons name="location" size={20} color={THEME.colors.accentDeep} />
              </View>
              <View style={{marginLeft: 12, flex: 1}}>
                <Text style={styles.locationCity}>{productData.farmerAddress?.split(',')[0] || 'Nashik'}, Nashik</Text>
                <Text style={styles.locationSub}>Near Panchavati</Text>
              </View>
            </View>
          </View>
          {}
          <Text style={styles.sectionTitle}>Customer Photos & Videos</Text>
          <View style={styles.reviewsSection}>
            {reviewsLoading ? (
              <ActivityIndicator size="small" color={THEME.colors.accentDeep} style={{ marginVertical: 20 }} />
            ) : reviewsList.length === 0 ? (
              <View style={styles.emptyReviewsContainer}>
                <Ionicons name="chatbox-ellipses-outline" size={40} color={THEME.colors.textMuted} />
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
                <TouchableOpacity style={styles.viewAllBtn}>
                  <Text style={styles.viewAllBtnText}>Read All {reviewsList.length} Reviews</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          {}
          {similarProducts.length > 0 && (
            <View style={styles.similarSection}>
              <Text style={styles.sectionTitle}>Explore More Products</Text>
              {}
              <View style={styles.searchWrapper}>
                <View style={[styles.searchContainer, searchFocused && styles.searchContainerFocused]}>
                  <View style={styles.searchIconCircle}>
                    <Ionicons name="search" size={17} color="#FFFFFF" />
                  </View>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search..."
                    placeholderTextColor={THEME.colors.placeholder}
                    value={searchText}
                    onChangeText={setSearchText}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                  />
                  {searchText.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearBtn}>
                      <Ionicons name="close-circle" size={18} color={THEME.colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.categoryFilterBtn}
                  onPress={() => setCategoryDropdownVisible(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="options-outline" size={17} color={THEME.colors.accentDeep} />
                  <Text style={styles.categoryFilterBtnText} numberOfLines={1}>
                    {selectedCategoryFilter}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color={THEME.colors.accentDeep} style={{marginLeft: 2}} />
                </TouchableOpacity>
              </View>
              {}
              <View style={styles.priceFilterWrapper}>
                <View style={styles.priceFilterHeader}>
                  <Ionicons name="pricetag" size={15} color={THEME.colors.accentDeep} />
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
                <ActivityIndicator size="small" color={THEME.colors.accentDeep} style={{ marginVertical: 20 }} />
              ) : (
                <View style={styles.similarGridContainer}>
                  {displayedSimilarProducts.map((item) => (
                    <View key={item.productId} style={styles.similarCardWrapper}>
                      <ProductCard
                        product={item}
                        variant="customer"
                        onPress={() => navigation.push('ProductDetail', { product: item })}
                        onWishlistToggle={() => toggleWishlist(item.productId)}
                        isWishlisted={isInWishlist(item.productId)}
                        onAddToCart={() => addToCart(item.productId, 1)}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
      {}
      {isCustomer && (
        <View style={[styles.themedStickyBar, { paddingBottom: Math.max(insets.bottom + 10, 26) }]}>
          <View style={styles.bottomBarRow}>
            {/* Quantity Stepper */}
            <View style={styles.quantityStepper}>
              <TouchableOpacity
                style={styles.stepperActionBtn}
                onPress={() => setQuantity(q => Math.max(0, q - 1))}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={14} color={THEME.colors.selectedText} />
              </TouchableOpacity>
              <Text style={styles.stepperQuantityText}>{quantity === 0 ? 1 : quantity}</Text>
              <TouchableOpacity
                style={styles.stepperActionBtn}
                onPress={() => setQuantity(q => (q === 0 ? 2 : q + 1))}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={14} color={THEME.colors.selectedText} />
              </TouchableOpacity>
            </View>

            {/* Add to Cart Button */}
            <View style={{ flex: 1.15 }}>
              <PrimaryButton
                title={goToCartLoading ? 'Adding...' : 'Add to Cart'}
                onPress={handleGoToCart}
                loading={goToCartLoading}
                style={{ height: 46 }}
                contentStyle={{ paddingHorizontal: 6 }}
                textStyle={{ fontSize: 13, letterSpacing: 0 }}
              />
            </View>

            {/* Buy Now Button */}
            <View style={{ flex: 1 }}>
              <MaroonButton
                title={buyNowLoading ? 'Please wait...' : 'Buy Now'}
                onPress={handleBuyNow}
                loading={buyNowLoading}
                style={{ height: 46 }}
                contentStyle={{ paddingHorizontal: 6 }}
                textStyle={{ fontSize: 13, letterSpacing: 0 }}
              />
            </View>
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
      {}
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
    </PageBackground>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  headerGlassActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerGlassBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: THEME.colors.headerGlassBorder,
    backgroundColor: THEME.colors.headerGlassBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCardWrapper: {
    paddingHorizontal: THEME.spacing.pageHorizontal,
    marginTop: 14,
  },
  heroCard: {
    width: '100%',
    height: 250,
    borderRadius: THEME.radius.cards,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 0,
    ...THEME.shadows.card,
  },
  heroImage: {
    width: '80%',
    height: 200,
  },
  organicTagOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.successBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.radius.pill,
    borderWidth: 1,
    borderColor: '#C6E8D0',
  },
  organicTagText: {
    fontFamily: THEME.fonts.bold,
    color: THEME.colors.success,
    fontSize: 11,
  },
  headerTitle: {
    fontSize: 18,
  },
  themedStickyBar: {
    backgroundColor: THEME.colors.cardBg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: THEME.colors.cardBorder,
    paddingTop: 14,
    paddingBottom: 28,
    paddingHorizontal: 16,
    ...THEME.shadows.stickyBar,
  },
  bottomBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.cardBg,
    borderRadius: THEME.radius.pill,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    padding: 2,
  },
  stepperActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: THEME.colors.selectedBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQuantityText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 13.5,
    color: THEME.colors.textBase,
    paddingHorizontal: 6,
    minWidth: 22,
    textAlign: 'center',
  },
  contentContainer: {
    backgroundColor: 'transparent',
    paddingHorizontal: THEME.spacing.pageHorizontal,
    paddingTop: 16,
    minHeight: 500,
  },
  productName: {
    fontFamily: THEME.fonts.bold,
    fontSize: 21,
    color: THEME.colors.textHeading,
    lineHeight: 26,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  authorText: {
    fontFamily: THEME.fonts.semiBold,
    fontSize: 13,
    color: THEME.colors.textSecondary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  ratingText: {
    fontFamily: THEME.fonts.semiBold,
    fontSize: 12.5,
    color: THEME.colors.textSecondary,
  },
  reviewCount: {
    fontFamily: THEME.fonts.regular,
    color: THEME.colors.textMuted,
  },
  priceStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 14,
  },
  price: {
    fontFamily: THEME.fonts.serif,
    fontSize: 24,
    color: THEME.colors.textBase,
  },
  unit: {
    fontFamily: THEME.fonts.medium,
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginLeft: 4,
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
    marginBottom: 20,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#FBDDB8',
  },
  tagText: {
    fontSize: 11.5,
    color: THEME.colors.accentDeep,
    fontFamily: THEME.fonts.bold,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 16.5,
    fontFamily: THEME.fonts.bold,
    color: THEME.colors.textHeading,
    marginBottom: 12,
    marginTop: 8,
  },
  card: {
    backgroundColor: THEME.colors.cardBg,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  farmerCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.cardBg,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  farmerAvatarPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFF4E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#FBDDB8',
  },
  farmerInfo: {
    flex: 1,
  },
  farmerName: {
    fontSize: 16,
    fontFamily: THEME.fonts.bold,
    color: THEME.colors.textHeading,
  },
  farmerSubtitle: {
    fontSize: 12.5,
    color: THEME.colors.accentDeep,
    fontFamily: THEME.fonts.semiBold,
    marginBottom: 6,
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
    fontSize: 13.5,
    color: '#4B5563',
    marginLeft: 8,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13.5,
    color: '#111827',
    fontWeight: '600',
  },
  locationCard: {
    backgroundColor: THEME.colors.cardBg,
    borderRadius: 16,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    ...THEME.shadows.card,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
    flex: 1,
  },
  locationPinBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFF1DE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  locationCity: {
    fontSize: 14.5,
    fontFamily: THEME.fonts.bold,
    color: THEME.colors.textHeading,
  },
  locationSub: {
    fontSize: 12.5,
    fontFamily: THEME.fonts.medium,
    color: THEME.colors.textSecondary,
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
    paddingBottom: 60,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 12,
    zIndex: 999,
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  goToCartBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 13,
    backgroundColor: '#FFFBEB',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  goToCartBtnText: {
    color: '#D97706',
    fontSize: 15,
    fontWeight: '700',
  },
  buyNowBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 13,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },
  buyNowBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
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
    paddingBottom: 60,
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
    backgroundColor: THEME.colors.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 28,
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
    backgroundColor: '#FFF4E8',
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FBDDB8',
  },
  viewAllBtnText: {
    color: THEME.colors.accentDeep,
    fontFamily: THEME.fonts.bold,
    fontSize: 13.5,
  },
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
    backgroundColor: THEME.colors.cardBg,
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  searchContainerFocused: {
    borderColor: THEME.colors.accent,
    shadowOpacity: 0.12,
  },
  searchIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: THEME.colors.accentDeep,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: THEME.fonts.medium,
    color: THEME.colors.textBase,
    paddingVertical: 6,
  },
  clearBtn: {
    padding: 8,
  },
  categoryFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.cardBg,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 48,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  categoryFilterBtnText: {
    fontSize: 13,
    fontFamily: THEME.fonts.bold,
    color: THEME.colors.accentDeep,
    marginLeft: 6,
    maxWidth: 70,
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
    color: THEME.colors.accentDeep,
    fontFamily: THEME.fonts.bold,
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
    fontSize: 13.5,
    fontFamily: THEME.fonts.bold,
    color: THEME.colors.textHeading,
    marginLeft: 6,
  },
  priceButtonsScroll: {
    paddingRight: 16,
    paddingBottom: 8,
  },
  priceChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: THEME.colors.cardBg,
    marginRight: 8,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 2,
  },
  priceChipActive: {
    backgroundColor: THEME.colors.accentDeep,
    borderColor: THEME.colors.accentDeep,
    elevation: 4,
    shadowOpacity: 0.2,
  },
  priceChipText: {
    fontSize: 12.5,
    fontFamily: THEME.fonts.semiBold,
    color: THEME.colors.textSecondary,
  },
  priceChipTextActive: {
    color: '#FFFFFF',
    fontFamily: THEME.fonts.bold,
  },
  similarGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    paddingTop: 8,
  },
  similarCardWrapper: {
    width: '50%',
  },
});
export default ProductDetailScreen;

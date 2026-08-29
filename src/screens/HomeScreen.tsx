import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  TextInput,
  Alert,
  Linking,
  ActivityIndicator,
  Dimensions,
  Modal,
} from 'react-native';

import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import api, { BASE_URL } from '../services/api';
import { StarRating } from '../components/reviews/StarRating';
import { getUserById } from '../services/userService';

const { width: screenWidth } = Dimensions.get('window');
const BANNER_WIDTH = screenWidth - 40;

// ─── Types ───────────────────────────────────────────────────────────────────
interface ProductItem {
  productId: string;
  productName: string;
  category: string;
  price: number;
  unit: string;
  productPhoto?: string;
  productVideo?: string;
  status: string;
  isDelete?: boolean;
  averageRating?: number;
  reviewCount?: number;
  description?: string;
  harvestDate?: string;
}

const CustomerDashboard = ({ navigation }: any) => {
  const { logout, user } = useAuth();
  const { cartCount, addToCart } = useCart();
  const { wishlist, toggleWishlist, isInWishlist } = useWishlist();
  const [currentBanner, setCurrentBanner] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [allProducts, setAllProducts] = useState<ProductItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isFilteredView, setIsFilteredView] = useState(false);
  const [locationText, setLocationText] = useState('Nashik, Maharashtra');
  const bannerScrollRef = useRef<ScrollView>(null);
  const searchInputRef = useRef<TextInput>(null);

  const focusSearchInput = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        if (user?.userId) {
          const profile = await getUserById(user.userId);
          if (profile && profile.village) {
            setLocationText(`${profile.village}, ${profile.state || 'Maharashtra'}`);
          }
        }
      } catch (error) {
        console.log('Error fetching user location for header:', error);
      }
    };
    fetchUserLocation();
  }, [user]);
  
  // Filter states
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterState, setFilterState] = useState('');
  const [filterVillage, setFilterVillage] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const bannerImages = [
    require('../../assets/vagis1.png'),
    require('../../assets/vagis2.png'),
    require('../../assets/vagis3.png'),
  ];

  // Colorful categories — fixed names to match icons
  const categories = [
    { name: 'Vegetable',       icon: 'leaf',       color: '#10B981', bg: '#E6F4EA' },
    { name: 'Fruit',           icon: 'nutrition',  color: '#F59E0B', bg: '#FFF3E0' },
    { name: 'Root Vegetable',  icon: 'rose',       color: '#EC4899', bg: '#FCE4EC' },
    { name: 'Grains',          icon: 'basket',     color: '#D97706', bg: '#FEF3C7' },
    { name: 'Wild Veggies',    icon: 'flower',     color: '#8B5CF6', bg: '#F3E5F5' },
    { name: 'Dairy',           icon: 'water',      color: '#3B82F6', bg: '#DBEAFE' },
  ];

  // ── Fetch all products on focus ─────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      fetchAllProducts();
    }, [])
  );

  const fetchAllProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await api.get('/product/getAll');
      const raw: ProductItem[] = Array.isArray(response.data) ? response.data : [];
      const visible = raw.filter(p => p.isDelete !== true && p.status !== 'DELETED');
      setAllProducts(visible);
      setIsFilteredView(false);
    } catch (error) {
      console.log('Error fetching all products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  // ── Banner auto-slide ──────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner(prev => {
        const next = prev === bannerImages.length - 1 ? 0 : prev + 1;
        if (bannerScrollRef.current) {
          bannerScrollRef.current.scrollTo({ x: next * BANNER_WIDTH, animated: true });
        }
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const handleBackPress = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes', onPress: () => logout() },
      ],
      { cancelable: true }
    );
  };

  const handleSearch = async () => {
    const term = searchText.trim().toLowerCase();
    if (!term) {
      fetchAllProducts();
      return;
    }
    try {
      setLoadingProducts(true);
      // Try API search
      const response = await api.get(`/product/search?keyword=${searchText}`);
      let results: ProductItem[] = Array.isArray(response.data) ? response.data : [];
      results = results.filter(p => p.isDelete !== true && p.status !== 'DELETED');

      // Fallback: If API returns empty, search locally in currently loaded products
      if (results.length === 0) {
        console.log('API search returned empty. Doing local search fallback...');
        const localResponse = await api.get('/product/getAll');
        const rawList: ProductItem[] = Array.isArray(localResponse.data) ? localResponse.data : [];
        results = rawList.filter(p => 
          p.isDelete !== true && 
          p.status !== 'DELETED' &&
          (p.productName?.toLowerCase().includes(term) || 
           p.description?.toLowerCase().includes(term) || 
           p.category?.toLowerCase().includes(term))
        );
      }

      setAllProducts(results);
      setIsFilteredView(true);
    } catch (error) {
      console.log('Error searching products, trying local fallback:', error);
      // Local fallback on API error
      try {
        const localResponse = await api.get('/product/getAll');
        const rawList: ProductItem[] = Array.isArray(localResponse.data) ? localResponse.data : [];
        const results = rawList.filter(p => 
          p.isDelete !== true && 
          p.status !== 'DELETED' &&
          (p.productName?.toLowerCase().includes(term) || 
           p.description?.toLowerCase().includes(term) || 
           p.category?.toLowerCase().includes(term))
        );
        setAllProducts(results);
        setIsFilteredView(true);
      } catch (fallbackError) {
        console.log('Local fallback failed too:', fallbackError);
        Alert.alert('Error', 'Failed to search products');
      }
    } finally {
      setLoadingProducts(false);
    }
  };

  const applyFilters = async () => {
    setShowFilterModal(false);
    setLoadingProducts(true);
    try {
      let results: ProductItem[] = [];
      let fetchDone = false;

      // 1. Check Location
      if (filterState) {
        fetchDone = true;
        let farmersEndpoint = `/farmer/state/${filterState}`;
        if (filterVillage) {
          farmersEndpoint = `/farmer/nearby?state=${filterState}&village=${filterVillage}`;
        }
        const farmerRes = await api.get(farmersEndpoint);
        const farmers = Array.isArray(farmerRes.data) ? farmerRes.data : [];
        
        let locProducts: ProductItem[] = [];
        for (const f of farmers) {
          try {
            const fpRes = await api.get(`/product/farmer/${f.farmerId || f.id}`);
            const fp = Array.isArray(fpRes.data) ? fpRes.data : [];
            locProducts = [...locProducts, ...fp];
          } catch(e) {}
        }
        results = locProducts;
      }

      // 2. Check Category + Price
      if (filterCategory && minPrice && maxPrice) {
        const cpRes = await api.get(`/product/filter?category=${filterCategory}&minPrice=${minPrice}&maxPrice=${maxPrice}`);
        const cpProds = Array.isArray(cpRes.data) ? cpRes.data : [];
        results = fetchDone ? results.filter(p => cpProds.some(c => c.productId === p.productId)) : cpProds;
        fetchDone = true;
      } else if (minPrice && maxPrice) {
        const pRes = await api.get(`/product/price?minPrice=${minPrice}&maxPrice=${maxPrice}`);
        const pProds = Array.isArray(pRes.data) ? pRes.data : [];
        results = fetchDone ? results.filter(p => pProds.some(c => c.productId === p.productId)) : pProds;
        fetchDone = true;
      } else if (filterCategory) {
        if (!fetchDone) {
          const res = await api.get('/product/getAll');
          const raw: ProductItem[] = Array.isArray(res.data) ? res.data : [];
          results = raw;
        }
        results = results.filter(p => p.category?.toLowerCase() === filterCategory.toLowerCase());
        fetchDone = true;
      }

      if (!fetchDone) {
        fetchAllProducts();
        return;
      }

      const visible = results.filter(p => p.isDelete !== true && p.status !== 'DELETED');
      setAllProducts(visible);
      setIsFilteredView(true);
      
    } catch (error) {
      console.log('Error applying filters:', error);
      Alert.alert('Error', 'Failed to apply filters');
    } finally {
      setLoadingProducts(false);
    }
  };

  const clearFilters = () => {
    setFilterState('');
    setFilterVillage('');
    setFilterCategory('');
    setMinPrice('');
    setMaxPrice('');
    setSearchText('');
    setShowFilterModal(false);
    fetchAllProducts();
  };

  const openCategory = (category: string) => {
    navigation.navigate('CategoryDashboard', { category });
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

  const openOrders = () => navigation.navigate('Orders');
  const openProfile = () => navigation.navigate('Profile');

  const openAllProducts = () => {
    Alert.alert('Coming Soon', 'Full products list will be available soon.');
  };

  const handlePlayVideo = (videoFilename: string) => {
    const videoUrl = `${BASE_URL}/product/video/${videoFilename}`;
    Linking.openURL(videoUrl).catch(() =>
      Alert.alert('Error', 'Could not open video. Please try again.')
    );
  };

  // ── Derived lists ───────────────────────────────────
  const videoProducts = allProducts.filter(p => !!p.productVideo);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >

          {/* =====================
              UNIFIED HEADER BLOCK
          ===================== */}
          <View style={styles.headerBlock}>
            {/* Top location & actions row */}
            <View style={styles.headerTopRow}>
              {/* Back Arrow */}
              <TouchableOpacity onPress={handleBackPress} style={styles.backButton} activeOpacity={0.8}>
                <Ionicons name="arrow-back" size={26} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.locationContainer}>
                <Ionicons name="location" size={24} color="#FFFFFF" style={{ marginRight: 6 }} />
                <View style={styles.locationTextContainer}>
                  <Text style={styles.deliverToText}>Deliver to</Text>
                  <TouchableOpacity 
                    style={styles.locationNameRow}
                    onPress={() => navigation.navigate('Profile')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.locationNameText} numberOfLines={1}>
                      {locationText}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.headerActions}>
                {/* Bell notification */}
                <TouchableOpacity 
                  style={styles.headerIconButton} 
                  onPress={() => Alert.alert('Notifications', 'No new notifications.')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="notifications-outline" size={26} color="#FFFFFF" />
                  <View style={styles.notificationBadge}>
                    <Text style={styles.badgeText}>2</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.headerIconButton} 
                  onPress={() => navigation.navigate('Cart')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="cart-outline" size={26} color="#FFFFFF" />
                  {cartCount > 0 && (
                    <View style={styles.cartBadge}>
                      <Text style={styles.badgeText}>{cartCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* SEARCH BOX */}
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={20} color="#64748B" onPress={handleSearch} style={{ marginRight: 8 }} />
              <TextInput
                ref={searchInputRef}
                value={searchText}
                onChangeText={setSearchText}
                onSubmitEditing={handleSearch}
                placeholder="Search for products..."
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
              />
              <TouchableOpacity 
                onPress={() => setShowFilterModal(true)}
                accessibilityLabel="Product Filter"
              >
                <Ionicons name="options-outline" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.mainContentCard}>

          {/* =====================
              BANNER
          ===================== */}
          <View style={styles.bannerContainer}>
            <ScrollView
              ref={bannerScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const newIndex = Math.round(e.nativeEvent.contentOffset.x / BANNER_WIDTH);
                setCurrentBanner(newIndex);
              }}
            >
              {bannerImages.map((img, idx) => (
                <Image
                  key={idx}
                  source={img}
                  style={{ width: BANNER_WIDTH, height: 175 }}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            
            {/* OVERLAY & CONTENT ON TOP OF IMAGE */}
            <View style={[StyleSheet.absoluteFillObject, styles.bannerOverlayContainer]} pointerEvents="none">
              <View style={styles.bannerOverlay} />
              
              <View style={styles.bannerContent}>
                <View style={styles.bannerTag}>
                  <Text style={styles.bannerTagText}>FRESH & HEALTHY</Text>
                </View>
                <Text style={styles.bannerTitle}>Farm Fresh</Text>
                <Text style={styles.bannerTitle}>Goodness</Text>
                <Text style={styles.bannerDescription}>
                  Handpicked • Natural • Chemical Free
                </Text>
                <TouchableOpacity style={styles.shopButton} onPress={openAllProducts}>
                  <Text style={styles.shopButtonText}>Shop Now</Text>
                  <Ionicons name="arrow-forward" size={18} color="#263D20" />
                </TouchableOpacity>
              </View>

              <View style={styles.dotsContainer} pointerEvents="auto">
                {bannerImages.map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      setCurrentBanner(index);
                      bannerScrollRef.current?.scrollTo({ x: index * BANNER_WIDTH, animated: true });
                    }}
                    style={[styles.dot, index === currentBanner && styles.activeDot]}
                  />
                ))}
              </View>
            </View>
          </View>

          {/* =====================
              CATEGORIES (colorful)
          ===================== */}
          <View style={styles.categorySection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Categories</Text>
              </View>
              <TouchableOpacity onPress={openAllProducts} style={styles.viewAllRow}>
                <Text style={styles.viewAllText}>View all</Text>
                <Ionicons name="chevron-forward" size={16} color="#2563EB" style={{ marginLeft: 2 }} />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {categories.map((category, index) => {
                return (
                  <TouchableOpacity
                    key={category.name}
                    style={styles.categoryCard}
                    onPress={() => openCategory(category.name)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.categoryIconBox,
                        { 
                          backgroundColor: category.bg, 
                          borderColor: category.color,
                          borderWidth: 1.5,
                        },
                      ]}
                    >
                      <Ionicons
                        name={category.icon as any}
                        size={20}
                        color={category.color}
                      />
                    </View>
                    <Text style={styles.categoryText} numberOfLines={1}>
                      {category.name === 'Root Vegetable' ? 'Root Veg' : category.name === 'Wild Veggies' ? 'Wild Veg' : category.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* =====================
              FARMER SHORTS (YouTube-style horizontal videos)
          ===================== */}
          {videoProducts.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.sectionTitle}>🎬 Farmer Shorts</Text>
                </View>
                <TouchableOpacity style={styles.viewAllRow} onPress={openAllProducts}>
                  <Text style={styles.viewAllText}>View All</Text>
                  <Ionicons name="chevron-forward" size={18} color="#2563EB" />
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.shortsScroll}
                decelerationRate="fast"
                snapToInterval={155}
                snapToAlignment="start"
              >
                {videoProducts.map(product => (
                  <TouchableOpacity
                    key={`video-${product.productId}`}
                    style={styles.shortCard}
                    activeOpacity={0.85}
                    onPress={() => {
                      if (product.status === 'INACTIVE') {
                        Alert.alert('Inactive', 'This product is inactive');
                        return;
                      }
                      handlePlayVideo(product.productVideo!);
                    }}
                  >
                    {product.status === 'INACTIVE' && (
                      <View style={styles.inactiveLabel}>
                        <Text style={styles.inactiveLabelText}>Inactive</Text>
                      </View>
                    )}
                    {/* Thumbnail */}
                    <Image
                      source={
                        product.productPhoto
                          ? { uri: `${BASE_URL}/product/image/${product.productPhoto}` }
                          : { uri: 'https://placehold.co/140x240/1A1A2E/FFFFFF?text=Video' }
                      }
                      style={styles.shortThumbnail}
                      resizeMode="cover"
                    />

                    {/* Dark gradient overlay */}
                    <View style={styles.shortOverlay} />

                    {/* Play button */}
                    <View style={styles.shortPlayBtn}>
                    <View style={styles.shortPlayCircle}>
                        <Ionicons name="play" size={20} color="#FFFFFF" />
                      </View>
                    </View>

                    {/* Shorts badge */}
                    <View style={styles.shortsBadge}>
                      <Ionicons name="videocam" size={10} color="#FF0000" />
                      <Text style={styles.shortsBadgeText}> Shorts</Text>
                    </View>

                    {/* Title */}
                    <Text style={styles.shortTitle} numberOfLines={2}>
                      {product.productName}
                    </Text>

                    {/* Price */}
                    <Text style={styles.shortPrice}>₹{product.price}/{product.unit?.toLowerCase()}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {/* =====================
              PRODUCT FEEDS / SEARCH RESULTS
          ===================== */}
          {loadingProducts ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#1E3A8A" />
              <Text style={styles.loadingText}>Loading products...</Text>
            </View>
          ) : isFilteredView ? (
            /* SEARCH RESULTS VIEW */
            <View style={{ marginBottom: 20 }}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.sectionTitle}>Search Results</Text>
                </View>
              </View>

              <ScrollView
                horizontal={false}
                contentContainerStyle={styles.searchResultsGrid}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.searchResultsGridInner}>
                  {allProducts.map(product => (
                    <TouchableOpacity
                      key={product.productId}
                      style={[styles.premiumProductCard, { width: '45%', marginHorizontal: '2.5%', marginBottom: 16 }]}
                      onPress={() => openProduct(product.productId)}
                      activeOpacity={0.9}
                    >
                      {/* Image Container with light backdrop */}
                      <View style={styles.premiumImageContainer}>
                        <Image
                          source={
                            product.productPhoto
                              ? { uri: `${BASE_URL}/product/image/${product.productPhoto}` }
                              : { uri: 'https://placehold.co/150x120/F8FAFC/1E3A8A?text=Fresh' }
                          }
                          style={styles.premiumProductImage}
                          resizeMode="contain"
                        />
                        
                        {/* Wishlist Heart Icon */}
                        <TouchableOpacity 
                          style={styles.premiumHeartBtn}
                          onPress={() => toggleWishlist(product.productId)}
                        >
                          <Ionicons 
                            name={isInWishlist(product.productId) ? "heart" : "heart-outline"} 
                            size={18} 
                            color={isInWishlist(product.productId) ? "#EF4444" : "#64748B"} 
                          />
                        </TouchableOpacity>
                      </View>

                      {/* Info Container */}
                      <View style={styles.premiumInfoContainer}>
                        <Text style={styles.premiumProductName} numberOfLines={1}>
                          {product.productName}
                        </Text>
                        <Text style={styles.premiumProductUnit}>
                          1 {product.unit || 'KG'}
                        </Text>
                        
                        <View style={styles.premiumPriceRatingRow}>
                          <View style={styles.premiumPriceCol}>
                            <Text style={styles.premiumProductPrice}>₹{product.price}</Text>
                            <View style={styles.premiumRatingRow}>
                              <Ionicons name="star" size={12} color="#F59E0B" />
                              <Text style={styles.premiumRatingText}>
                                {product.averageRating ? product.averageRating.toFixed(1) : '4.6'}
                              </Text>
                            </View>
                          </View>
                          
                          {/* ADD BUTTON */}
                          <TouchableOpacity
                            style={styles.premiumAddBtn}
                            onPress={() => addToCart(product.productId, 1)}
                          >
                            <Ionicons name="add" size={20} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          ) : (
            /* NORMAL DASHBOARD VIEW */
            <>
              {/* Fresh Vegetables Section */}
              <View style={{ marginBottom: 20 }}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Text style={styles.sectionTitle}>Fresh Vegetables</Text>
                  </View>
                  <TouchableOpacity onPress={() => openCategory('Vegetable')} style={styles.viewAllRow}>
                    <Text style={styles.viewAllText}>View all</Text>
                    <Ionicons name="chevron-forward" size={16} color="#2563EB" style={{ marginLeft: 2 }} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.premiumProductScroll}
                >
                  {allProducts
                    .filter(p => p.category?.toLowerCase() === 'vegetable' && p.isDelete !== true && p.status !== 'DELETED')
                    .map(product => (
                      <TouchableOpacity
                        key={product.productId}
                        style={styles.premiumProductCard}
                        onPress={() => openProduct(product.productId)}
                        activeOpacity={0.9}
                      >
                        {/* Image Container with light backdrop */}
                        <View style={styles.premiumImageContainer}>
                          <Image
                            source={
                              product.productPhoto
                                ? { uri: `${BASE_URL}/product/image/${product.productPhoto}` }
                                : { uri: 'https://placehold.co/150x120/F8FAFC/1E3A8A?text=Fresh' }
                            }
                            style={styles.premiumProductImage}
                            resizeMode="contain"
                          />
                          
                          {/* Wishlist Heart Icon */}
                          <TouchableOpacity 
                            style={styles.premiumHeartBtn}
                            onPress={() => toggleWishlist(product.productId)}
                          >
                            <Ionicons 
                              name={isInWishlist(product.productId) ? "heart" : "heart-outline"} 
                              size={18} 
                              color={isInWishlist(product.productId) ? "#EF4444" : "#64748B"} 
                            />
                          </TouchableOpacity>
                        </View>

                        {/* Info Container */}
                        <View style={styles.premiumInfoContainer}>
                          <Text style={styles.premiumProductName} numberOfLines={1}>
                            {product.productName}
                          </Text>
                          <Text style={styles.premiumProductUnit}>
                            1 {product.unit || 'KG'}
                          </Text>
                          
                          <View style={styles.premiumPriceRatingRow}>
                            <View style={styles.premiumPriceCol}>
                              <Text style={styles.premiumProductPrice}>₹{product.price}</Text>
                              <View style={styles.premiumRatingRow}>
                                <Ionicons name="star" size={12} color="#F59E0B" />
                                <Text style={styles.premiumRatingText}>
                                  {product.averageRating ? product.averageRating.toFixed(1) : '4.6'}
                                </Text>
                              </View>
                            </View>
                            
                            {/* ADD BUTTON */}
                            <TouchableOpacity
                              style={styles.premiumAddBtn}
                              onPress={() => addToCart(product.productId, 1)}
                            >
                              <Ionicons name="add" size={20} color="#FFFFFF" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </View>

              {/* FREE DELIVERY BANNER */}
              <View style={styles.deliveryBanner}>
                <View style={styles.deliveryLeftRow}>
                  <Ionicons name="bicycle-outline" size={32} color="#2563EB" />
                  <View style={styles.deliveryTextCol}>
                    <Text style={styles.deliveryTitle}>Free Delivery</Text>
                    <Text style={styles.deliverySubtitle}>On order above ₹499</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.deliveryShopBtn} onPress={openAllProducts}>
                  <Text style={styles.deliveryShopBtnText}>Shop Now</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {isFilteredView && (
            <TouchableOpacity 
              style={styles.backToDashButton} 
              onPress={clearFilters}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
              <Text style={styles.backToDashText}>Back to Dashboard</Text>
            </TouchableOpacity>
          )}

          <View style={styles.bottomGap} />
          </View>
        </ScrollView>

      {/* FILTER MODAL */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#4A564E" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.filterSectionTitle}>Location</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="State (e.g. Maharashtra)"
                value={filterState}
                onChangeText={setFilterState}
              />
              <TextInput
                style={styles.filterInput}
                placeholder="Village"
                value={filterVillage}
                onChangeText={setFilterVillage}
              />

              <Text style={styles.filterSectionTitle}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 15}}>
                {categories.map(c => (
                  <TouchableOpacity
                    key={c.name}
                    style={[
                      styles.filterChip,
                      filterCategory === c.name && styles.filterChipActive
                    ]}
                    onPress={() => setFilterCategory(filterCategory === c.name ? '' : c.name)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      filterCategory === c.name && styles.filterChipTextActive
                    ]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.filterSectionTitle}>Price Range (₹)</Text>
              <View style={styles.priceRow}>
                <TextInput
                  style={[styles.filterInput, {flex: 1, marginRight: 10, marginBottom: 0}]}
                  placeholder="Min"
                  keyboardType="numeric"
                  value={minPrice}
                  onChangeText={setMinPrice}
                />
                <TextInput
                  style={[styles.filterInput, {flex: 1, marginBottom: 0}]}
                  placeholder="Max"
                  keyboardType="numeric"
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.resetButton} onPress={clearFilters}>
                <Text style={styles.resetButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      </View>
    </SafeAreaView>
  );
};

export default CustomerDashboard;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1E3A8A',
  },

  container: {
    flex: 1,
    backgroundColor: '#1E3A8A',
  },

  backToDashButton: {
    flexDirection: 'row',
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 4,
  },

  backToDashText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  scrollContent: {
    paddingBottom: 105,
  },

  // =====================
  // HEADER
  // =====================

  // HEADER
  // =====================

  headerBlock: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },

  backButton: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
  },

  mainContentCard: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 16,
    flex: 1,
  },

  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },

  locationTextContainer: {
    flexDirection: 'column',
  },

  deliverToText: {
    fontSize: 11,
    color: '#BFDBFE',
    fontWeight: '600',
  },

  locationNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },

  locationNameText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
    maxWidth: 160,
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerIconButton: {
    marginLeft: 18,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },

  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },

  badgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },

  searchInput: {
    flex: 1,
    marginHorizontal: 8,
    fontSize: 14,
    color: '#0F172A',
    padding: 0,
  },

  // =====================
  // CATEGORIES
  // =====================

  categorySection: {
    marginTop: 20,
  },

  categoryScroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
  },

  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: 58,
    height: 82,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },

  activeCategoryCard: {},

  categoryIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  categoryText: {
    marginTop: 6,
    fontSize: 9,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    maxWidth: 54,
  },

  activeIndicator: {
    marginTop: 5,
    width: '100%',
    height: 3,
    borderRadius: 2,
  },

  // =====================
  // BANNER
  // =====================

  bannerContainer: {
    marginHorizontal: 20,
    marginTop: 17,
    borderRadius: 22,
    overflow: 'hidden',
    height: 175,
    position: 'relative',
  },

  bannerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },

  bannerOverlayContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },

  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9, 42, 11, 0.25)',
  },

  bannerContent: {
    width: '57%',
    paddingLeft: 20,
    zIndex: 2,
  },

  bannerTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },

  bannerTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },

  bannerTitle: {
    marginTop: 4,
    color: '#FFFFFF',
    fontSize: 27,
    lineHeight: 30,
    fontWeight: '900',
  },

  bannerDescription: {
    marginTop: 9,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  shopButton: {
    marginTop: 15,
    alignSelf: 'flex-start',
    minHeight: 41,
    paddingHorizontal: 16,
    borderRadius: 21,
    backgroundColor: '#FFD02A',
    flexDirection: 'row',
    alignItems: 'center',
  },

  shopButtonText: {
    color: '#27391F',
    fontSize: 13,
    fontWeight: '800',
    marginRight: 5,
  },

  dotsContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.55)',
    marginHorizontal: 4,
  },

  activeDot: {
    width: 9,
    height: 9,
    backgroundColor: '#FFFFFF',
  },

  // =====================
  // SECTION HEADERS
  // =====================

  sectionHeader: {
    marginTop: 23,
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#162018',
  },

  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  viewAllText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '700',
  },

  // =====================
  // FARMER SHORTS
  // =====================

  shortsScroll: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 6,
  },

  shortCard: {
    width: 140,
    height: 235,
    borderRadius: 18,
    overflow: 'hidden',
    marginRight: 14,
    backgroundColor: '#1A1A2E',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    position: 'relative',
  },

  shortThumbnail: {
    width: '100%',
    height: '100%',
  },

  shortOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 18,
  },

  shortPlayBtn: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  shortPlayCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  shortsBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },

  shortsBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },

  shortTitle: {
    position: 'absolute',
    bottom: 30,
    left: 10,
    right: 10,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  shortPrice: {
    position: 'absolute',
    bottom: 12,
    left: 10,
    color: '#FFD02A',
    fontSize: 11,
    fontWeight: '800',
  },

  // =====================
  // PRODUCTS
  // =====================

  productScroll: {
    paddingHorizontal: 20,
    paddingTop: 13,
    paddingBottom: 2,
  },

  productCard: {
    width: 200,
    marginRight: 13,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EAEFEB',
    elevation: 4,
    shadowColor: '#667367',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    paddingBottom: 12,
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

  productImageWrapper: {
    width: '100%',
    height: 160,
    position: 'relative',
  },

  productImage: {
    width: '100%',
    height: '100%',
  },

  freshBadge: {
    position: 'absolute',
    top: 11,
    left: 11,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#16A34A',
  },

  freshBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  productInfo: {
    paddingHorizontal: 12,
    paddingTop: 10,
  },

  productName: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
    color: '#121912',
  },

  productFarmer: {
    marginTop: 3,
    fontSize: 11,
    color: '#687168',
  },

  productCategory: {
    marginTop: 3,
    fontSize: 11,
    color: '#1E3A8A',
    fontWeight: '600',
  },

  ratingRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },

  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3F4841',
  },

  priceText: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '900',
    color: '#1A291C',
  },

  priceUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: '#667069',
  },

  addButton: {
    marginHorizontal: 10,
    marginTop: 10,
    minHeight: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#F59E0B',
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addButtonText: {
    marginLeft: 5,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // =====================
  // LOADING / EMPTY
  // =====================

  loadingBox: {
    paddingVertical: 30,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },

  loadingText: {
    color: '#6C746D',
    fontSize: 14,
  },

  emptyProductsBox: {
    width: 280,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyProductsText: {
    marginTop: 12,
    color: '#8A938D',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },

  bottomGap: {
    height: 30,
  },

  // =====================
  // BOTTOM NAV (kept in style for layout compatibility)
  // =====================

  bottomNavigation: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 9,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6ECE5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    elevation: 10,
    shadowColor: '#596659',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
  },

  bottomNavItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  bottomNavText: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
    color: '#68706A',
  },

  bottomNavActiveText: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '800',
    color: '#278D36',
  },

  bottomIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 50,
    height: 3,
    borderRadius: 3,
    backgroundColor: '#2D9C39',
  },

  // =====================
  // MODAL & FILTERS
  // =====================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#112017',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#263329',
    marginTop: 15,
    marginBottom: 10,
  },
  filterInput: {
    backgroundColor: '#F5F7F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#233126',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8F5D8',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F7F5',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E8F5D8',
  },
  filterChipActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  filterChipText: {
    fontSize: 13,
    color: '#4A564E',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingBottom: 20,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2563EB',
    alignItems: 'center',
    marginRight: 10,
  },
  resetButtonText: {
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '700',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    marginLeft: 10,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // =====================
  // PREMIUM PRODUCTS
  // =====================

  premiumProductScroll: {
    paddingLeft: 20,
    paddingRight: 10,
    paddingTop: 14,
    paddingBottom: 6,
  },

  premiumProductCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: 165,
    marginRight: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },

  premiumImageContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },

  premiumProductImage: {
    width: '85%',
    height: '85%',
  },

  premiumHeartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },

  premiumInfoContainer: {
    marginTop: 8,
  },

  premiumProductName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },

  premiumProductUnit: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  premiumPriceRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },

  premiumPriceCol: {
    flexDirection: 'column',
  },

  premiumProductPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },

  premiumRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },

  premiumRatingText: {
    fontSize: 11,
    color: '#64748B',
    marginLeft: 3,
    fontWeight: '600',
  },

  premiumAddBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchResultsGrid: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
  },

  searchResultsGridInner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },

  // =====================
  // DELIVERY BANNER
  // =====================

  deliveryBanner: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 40,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },

  deliveryLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  deliveryTextCol: {
    marginLeft: 12,
  },

  deliveryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },

  deliverySubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  deliveryShopBtn: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },

  deliveryShopBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
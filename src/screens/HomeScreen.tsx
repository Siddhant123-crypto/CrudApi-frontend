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
import api, { BASE_URL } from '../services/api';

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
}

const CustomerDashboard = ({ navigation }: any) => {
  const { logout, user } = useAuth();
  const [currentBanner, setCurrentBanner] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [allProducts, setAllProducts] = useState<ProductItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isFilteredView, setIsFilteredView] = useState(false);
  const bannerScrollRef = useRef<ScrollView>(null);
  
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
    { name: 'Vegetable',       icon: 'leaf-outline',       color: '#4CAF50', bg: '#E8F5E9' },
    { name: 'Fruit',           icon: 'nutrition-outline',  color: '#FF9800', bg: '#FFF3E0' },
    { name: 'Root Vegetable',  icon: 'aperture-outline',   color: '#E91E63', bg: '#FCE4EC' },
    { name: 'Grains',          icon: 'basket-outline',     color: '#FFC107', bg: '#FFFDE7' },
    { name: 'Wild Veggies',    icon: 'flower-outline',     color: '#9C27B0', bg: '#F3E5F5' },
    { name: 'Dairy',           icon: 'water-outline',      color: '#03A9F4', bg: '#E1F5FE' },
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
    if (!searchText.trim()) {
      fetchAllProducts();
      return;
    }
    try {
      setLoadingProducts(true);
      const response = await api.get(`/product/search?keyword=${searchText}`);
      const raw: ProductItem[] = Array.isArray(response.data) ? response.data : [];
      const visible = raw.filter(p => p.isDelete !== true && p.status !== 'DELETED');
      setAllProducts(visible);
      setIsFilteredView(true);
    } catch (error) {
      console.log('Error searching products:', error);
      Alert.alert('Error', 'Failed to search products');
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
              HEADER STRIP
          ===================== */}
          <View style={styles.topGreenStrip}>
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerActions}>
              {/* NOTIFICATION */}
              <TouchableOpacity
                style={styles.headerIconButton}
                onPress={() => Alert.alert('Notifications', 'No new notifications.')}
              >
                <Ionicons name="notifications-outline" size={22} color="#263329" />
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>3</Text>
                </View>
              </TouchableOpacity>

              {/* CART */}
              <TouchableOpacity
                style={styles.headerIconButton}
                onPress={() => Alert.alert('Cart', 'Your cart is empty.')}
              >
                <Ionicons name="cart-outline" size={22} color="#263329" />
                <View style={styles.cartBadge}>
                  <Text style={styles.badgeText}>2</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* =====================
              HEADER / SEARCH
          ===================== */}
          <View style={styles.header}>
            <Text style={styles.greeting}>
              Hello, {user?.name || 'Customer'}!
            </Text>
            <Text style={styles.subtitle}>Fresh from farms, straight to you</Text>

            {/* SEARCH */}
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={24} color="#2D983A" onPress={handleSearch} />
              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                onSubmitEditing={handleSearch}
                placeholder="Search products..."
                placeholderTextColor="#8A938D"
                style={styles.searchInput}
              />
              <TouchableOpacity 
                onPress={() => setShowFilterModal(true)}
                accessibilityLabel="Product Filter"
              >
                <Ionicons name="options-outline" size={24} color="#2D983A" />
              </TouchableOpacity>
            </View>
          </View>

          {/* =====================
              CATEGORIES (colorful)
          ===================== */}
          <View style={styles.categorySection}>
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
                        { backgroundColor: category.bg, borderColor: category.bg },
                      ]}
                    >
                      <Ionicons
                        name={category.icon as any}
                        size={26}
                        color={category.color}
                      />
                    </View>
                    <Text style={styles.categoryText}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

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
                  <Ionicons name="chevron-forward" size={18} color="#208A35" />
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
              CATEGORY WISE FEEDS
          ===================== */}
          {loadingProducts ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#2D983A" />
              <Text style={styles.loadingText}>Loading products...</Text>
            </View>
          ) : (
            categories.map(category => {
              const categoryProducts = allProducts.filter(p => 
                p.category?.toLowerCase() === category.name.toLowerCase() && !!p.productPhoto
              );

              if (categoryProducts.length === 0) return null;

              return (
                <View key={category.name} style={{ marginBottom: 20 }}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleRow}>
                      <Text style={styles.sectionTitle}>Fresh {category.name}</Text>
                    </View>
                    <TouchableOpacity onPress={() => openCategory(category.name)} style={styles.viewAllRow}>
                      <Text style={styles.viewAllText}>View All</Text>
                      <Ionicons name="chevron-forward" size={18} color="#208A35" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.productScroll}
                  >
                    {categoryProducts.map(product => (
                      <View key={product.productId} style={styles.productCard}>
                        {product.status === 'INACTIVE' && (
                          <View style={styles.inactiveLabel}>
                            <Text style={styles.inactiveLabelText}>Inactive</Text>
                          </View>
                        )}
                        <TouchableOpacity
                          activeOpacity={0.95}
                          onPress={() => openProduct(product.productId)}
                        >
                          <View style={styles.productImageWrapper}>
                            <Image
                              source={
                                product.productPhoto
                                  ? { uri: `${BASE_URL}/product/image/${product.productPhoto}` }
                                  : { uri: 'https://placehold.co/200x200/E8F5E2/2E9B32?text=Fresh' }
                              }
                              style={styles.productImage}
                              resizeMode="cover"
                            />
                            <View style={styles.freshBadge}>
                              <Text style={styles.freshBadgeText}>Fresh</Text>
                            </View>
                            <TouchableOpacity style={styles.favoriteButton}>
                              <Ionicons name="heart-outline" size={21} color="#26332A" />
                            </TouchableOpacity>
                          </View>

                          <View style={styles.productInfo}>
                            <Text style={styles.productName} numberOfLines={2}>
                              {product.productName}
                            </Text>
                            <Text style={styles.productFarmer}>
                              by {(product as any).farmerName || 'Farmer'}
                            </Text>
                            <Text style={styles.productCategory}>{product.category}</Text>
                            <View style={styles.ratingRow}>
                              <Ionicons name="star" size={13} color="#F4B400" />
                              <Ionicons name="star" size={13} color="#F4B400" />
                              <Ionicons name="star" size={13} color="#F4B400" />
                              <Ionicons name="star" size={13} color="#F4B400" />
                              <Ionicons name="star-half" size={13} color="#F4B400" />
                              <Text style={styles.ratingText}> 4.5</Text>
                            </View>
                            <Text style={styles.priceText}>
                              ₹{product.price}.00
                              <Text style={styles.priceUnit}>
                                {' '}/ {product.unit?.toLowerCase() || 'kg'}
                              </Text>
                            </Text>
                          </View>
                        </TouchableOpacity>
                        
                        {/* ADD BUTTON */}
                        <TouchableOpacity
                          style={styles.addButton}
                          onPress={() => openProduct(product.productId)}
                        >
                          <Ionicons name="cart-outline" size={19} color="#258D36" />
                          <Text style={styles.addButtonText}>Add to Cart</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              );
            })
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
    backgroundColor: '#FFFFFF',
  },

  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  backToDashButton: {
    flexDirection: 'row',
    backgroundColor: '#2D983A',
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

  topGreenStrip: {
    backgroundColor: '#2D983A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 28,
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerIconButton: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 9,
    position: 'relative',
  },

  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: -1,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ED3D3D',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cartBadge: {
    position: 'absolute',
    top: 0,
    right: -1,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#2E983A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },

  header: {
    backgroundColor: '#E8F5D8',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  greeting: {
    marginTop: 22,
    fontSize: 29,
    fontWeight: '800',
    color: '#112017',
  },

  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#4A564E',
  },

  // Search — no filter icon
  searchBox: {
    marginTop: 20,
    minHeight: 59,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    paddingLeft: 16,
    paddingRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#62705F',
    shadowOpacity: 0.12,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
  },

  searchInput: {
    flex: 1,
    marginHorizontal: 9,
    paddingVertical: 0,
    fontSize: 14,
    color: '#233126',
  },

  // =====================
  // CATEGORIES (colorful)
  // =====================

  categorySection: {
    marginTop: 16,
  },

  categoryScroll: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },

  categoryCard: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
    paddingBottom: 5,
  },

  activeCategoryCard: {},

  categoryIconBox: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  categoryText: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '600',
    color: '#4C564F',
    textAlign: 'center',
    maxWidth: 60,
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
    color: '#228D36',
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
    backgroundColor: '#2D9C3C',
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
    color: '#2D983A',
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
    borderColor: '#B9DDB6',
    backgroundColor: '#F6FCF3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addButtonText: {
    marginLeft: 5,
    color: '#278D36',
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
    backgroundColor: '#2D983A',
    borderColor: '#2D983A',
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
    borderColor: '#2D983A',
    alignItems: 'center',
    marginRight: 10,
  },
  resetButtonText: {
    color: '#2D983A',
    fontSize: 15,
    fontWeight: '700',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#2D983A',
    alignItems: 'center',
    marginLeft: 10,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
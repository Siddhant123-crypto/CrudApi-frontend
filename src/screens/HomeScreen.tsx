import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Linking,
  ActivityIndicator,
  Dimensions,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
  AppState,
  LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Path,
  Circle,
  Rect,
  Ellipse,
  Line,
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient as SvgRadialGradient,
  Stop,
} from 'react-native-svg';
import { useFonts, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useNotification } from '../context/NotificationContext';
import api, { BASE_URL } from '../services/api';
import { getUserById } from '../services/userService';
import {
  MenuIcon,
  PinIcon,
  ChevronDownIcon,
  BellIcon,
  CartIcon,
  SearchIcon,
  SlidersIcon,
  HeartIcon,
  PlusIcon,
  ArrowRightIcon,
  BikeIcon,
  PlayIcon,
} from '../components/CustomerIcons';

const { width: screenWidth } = Dimensions.get('window');
const BANNER_WIDTH = screenWidth - 40;

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
  farmerState?: string;
  farmerVillage?: string;
}

const getStateAbbreviation = (stateName: string) => {
  if (!stateName) return '';
  const stateMap: { [key: string]: string } = {
    'andhra pradesh': 'AP', 'arunachal pradesh': 'AR', 'assam': 'AS', 'bihar': 'BR',
    'chhattisgarh': 'CG', 'goa': 'GA', 'gujarat': 'GJ', 'haryana': 'HR',
    'himachal pradesh': 'HP', 'jharkhand': 'JH', 'karnataka': 'KA', 'kerala': 'KL',
    'madhya pradesh': 'MP', 'maharashtra': 'MH', 'manipur': 'MN', 'meghalaya': 'ML',
    'mizoram': 'MZ', 'nagaland': 'NL', 'odisha': 'OR', 'punjab': 'PB',
    'rajasthan': 'RJ', 'sikkim': 'SK', 'tamil nadu': 'TN', 'telangana': 'TG',
    'tripura': 'TR', 'uttar pradesh': 'UP', 'uttarakhand': 'UK', 'west bengal': 'WB',
    'andaman and nicobar islands': 'AN', 'chandigarh': 'CH', 'delhi': 'DL',
    'jammu and kashmir': 'JK', 'ladakh': 'LA', 'lakshadweep': 'LD', 'puducherry': 'PY',
  };
  const lowerState = stateName.toLowerCase().trim();
  return stateMap[lowerState] || stateName.substring(0, 3).toUpperCase();
};

const PASTEL_COLORS = ['#FFE3DC', '#E3EEFF', '#DDF3E4', '#E4F5D6', '#FFF0CC', '#F3E3D3'];

const getCategoryEmoji = (name: string) => {
  const n = (name || '').toLowerCase();
  if (n.includes('fruit')) return '🍎';
  if (n.includes('dairy') || n.includes('milk')) return '🥛';
  if (n.includes('wild') || n.includes('forest')) return '🌿';
  if (n.includes('veg')) return '🥬';
  if (n.includes('grain') || n.includes('wheat') || n.includes('rice')) return '🌾';
  if (n.includes('pulse') || n.includes('dal') || n.includes('bean')) return '🫘';
  return '🌱';
};

// ─── REUSABLE COMPONENTS ───────────────────────────────────────────────────

const SectionHeader = ({
  title,
  actionText,
  onPress,
}: {
  title: string;
  actionText: string;
  onPress: () => void;
}) => (
  <View style={styles.sectionHeaderRow}>
    <Text style={styles.sectionHeaderTitle}>{title}</Text>
    <TouchableOpacity
      style={styles.sectionHeaderLink}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.sectionHeaderLinkText}>{actionText}</Text>
      <ArrowRightIcon size={14} color="#B8470F" strokeWidth={2.4} />
    </TouchableOpacity>
  </View>
);

const HERO_IMAGES = [
  require('../../assets/vagis1.png'),
  require('../../assets/vagis2.png'),
  require('../../assets/vagis3.png'),
];

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────

const CustomerDashboard = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const { logout, user } = useAuth();
  const { unreadCount } = useNotification();
  const { cartCount, addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const isFocused = useIsFocused();
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const activeBannerRef = useRef(0);
  activeBannerRef.current = activeBannerIndex;

  const [bannerWidth, setBannerWidth] = useState(Dimensions.get('window').width - 40);

  const bannerOpacities = useRef([
    new Animated.Value(1),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const dotWidths = useRef([
    new Animated.Value(22),
    new Animated.Value(6),
    new Animated.Value(6),
  ]).current;

  const bannerTimerRef = useRef<NodeJS.Timeout | null>(null);

  const switchBanner = useCallback((nextIndex: number) => {
    const prevIndex = activeBannerRef.current;
    if (prevIndex === nextIndex) return;

    setActiveBannerIndex(nextIndex);

    bannerOpacities.forEach((op, idx) => {
      if (idx !== nextIndex && idx !== prevIndex) {
        op.setValue(0);
      }
    });

    Animated.parallel([
      Animated.timing(bannerOpacities[nextIndex], {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(bannerOpacities[prevIndex], {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.parallel(
      dotWidths.map((w, i) =>
        Animated.timing(w, {
          toValue: i === nextIndex ? 22 : 6,
          duration: 300,
          useNativeDriver: false,
        })
      )
    ).start();
  }, [bannerOpacities, dotWidths]);

  const startBannerTimer = useCallback(() => {
    if (bannerTimerRef.current) {
      clearInterval(bannerTimerRef.current);
    }
    bannerTimerRef.current = setInterval(() => {
      const next = (activeBannerRef.current + 1) % HERO_IMAGES.length;
      switchBanner(next);
    }, 3000);
  }, [switchBanner]);

  const stopBannerTimer = useCallback(() => {
    if (bannerTimerRef.current) {
      clearInterval(bannerTimerRef.current);
      bannerTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && isFocused) {
        startBannerTimer();
      } else {
        stopBannerTimer();
      }
    });

    if (isFocused && AppState.currentState === 'active') {
      startBannerTimer();
    } else {
      stopBannerTimer();
    }

    return () => {
      subscription.remove();
      stopBannerTimer();
    };
  }, [isFocused, startBannerTimer, stopBannerTimer]);

  const handleDotPress = (index: number) => {
    switchBanner(index);
    startBannerTimer();
  };

  const onBannerLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0 && Math.abs(width - bannerWidth) > 1) {
      setBannerWidth(width);
    }
  };

  const [searchText, setSearchText] = useState('');
  const [allProducts, setAllProducts] = useState<ProductItem[]>([]);
  const [searchResults, setSearchResults] = useState<ProductItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isFilteredView, setIsFilteredView] = useState(false);
  const [locationText, setLocationText] = useState('Sinner, MH');
  const [categories, setCategories] = useState<any[]>([]);

  const mainScrollRef = useRef<ScrollView>(null);
  const searchInputRef = useRef<TextInput>(null);

  // Filter Modal state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterState, setFilterState] = useState('');
  const [filterVillage, setFilterVillage] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const fetchUserLocation = async () => {
    try {
      if (user?.userId) {
        const profile = await getUserById(user.userId);
        if (profile) {
          if (profile.status === 'INACTIVE' && profile.blockReason) {
            Alert.alert(
              'Account Blocked',
              `Your account has been blocked by the admin.\n\nReason: ${profile.blockReason}`,
              [{ text: 'OK', onPress: () => logout() }]
            );
            return;
          }
          if (profile.village) {
            const rawState = profile.state || 'Maharashtra';
            const shortState = getStateAbbreviation(rawState);
            setLocationText(`${profile.village}, ${shortState}`);
          }
        }
      }
    } catch (error) {
      console.log('Error fetching user location for header:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (res.data && res.data.data) {
        setCategories(res.data.data.filter((c: any) => c.isActive));
      }
    } catch (error) {
      console.log('Error fetching categories:', error);
    }
  };

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

  useFocusEffect(
    useCallback(() => {
      fetchAllProducts();
      fetchCategories();
      fetchUserLocation();
    }, [user])
  );


  const handleSearch = async () => {
    const term = searchText.trim().toLowerCase();
    if (!term) {
      fetchAllProducts();
      return;
    }
    try {
      setLoadingProducts(true);
      const response = await api.get(`/product/search?keyword=${searchText}`);
      let results: ProductItem[] = Array.isArray(response.data) ? response.data : [];
      results = results.filter(p => p.isDelete !== true && p.status !== 'DELETED');
      if (results.length === 0) {
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
      setSearchResults(results);
      setIsFilteredView(true);
    } catch (error) {
      console.log('Error searching products, trying local fallback:', error);
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
        setSearchResults(results);
        setIsFilteredView(true);
      } catch (fallbackError) {
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
      const res = await api.get('/product/getAll');
      let results: ProductItem[] = Array.isArray(res.data) ? res.data : [];

      if (filterState) {
        const lowerState = filterState.toLowerCase().trim();
        results = results.filter(p => p.farmerState && p.farmerState.toLowerCase().includes(lowerState));
      }

      if (filterVillage) {
        const lowerVillage = filterVillage.toLowerCase().trim();
        results = results.filter(p => {
          if (!p.farmerVillage) return false;
          const v = p.farmerVillage.toLowerCase();
          return v.includes(lowerVillage) ||
            (lowerVillage === 'sinner' && v.includes('sinnar')) ||
            (lowerVillage === 'sinnar' && v.includes('sinner'));
        });
      }

      if (filterCategory) {
        const lowerCat = filterCategory.toLowerCase().trim();
        results = results.filter(p => p.category && p.category.toLowerCase().trim() === lowerCat);
      }

      if (minPrice) {
        const min = parseFloat(minPrice);
        if (!isNaN(min)) {
          results = results.filter(p => p.price >= min);
        }
      }

      if (maxPrice) {
        const max = parseFloat(maxPrice);
        if (!isNaN(max)) {
          results = results.filter(p => p.price <= max);
        }
      }

      const visible = results.filter(p => p.isDelete !== true && p.status !== 'DELETED');
      setSearchResults(visible);
      setIsFilteredView(true);
    } catch (error) {
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
    setSearchResults([]);
    setIsFilteredView(false);
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

  const videoProducts = allProducts.filter(p => !!p.productVideo);
  const vegetableProducts = allProducts.filter(
    p => p.category?.toLowerCase() === 'vegetable' && p.isDelete !== true && p.status !== 'DELETED'
  );

  const displayedProducts = isFilteredView ? searchResults : vegetableProducts;

  if (!fontsLoaded) {
    return null;
  }

  const headerPaddingTop = Math.max(insets.top + 6, 50);

  return (
    <View style={styles.screenRoot}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

      {/* Page Background: vertical LinearGradient #FBF5EA (top) -> #F6EFE2 (bottom) */}
      <LinearGradient
        colors={['#FBF5EA', '#F6EFE2']}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        ref={mainScrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >
        {/* ─── 1) HEADER ────────────────────────────────────────────── */}
        <View style={[styles.headerContainer, { paddingTop: headerPaddingTop }]}>
          <LinearGradient
            colors={['#A23A14', '#3B1008']}
            start={{ x: 0.3, y: 0 }}
            end={{ x: 0.7, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Decorative Circles */}
          <Svg
            width="100%"
            height={208 + insets.top}
            viewBox="0 0 390 208"
            preserveAspectRatio="xMidYMid slice"
            style={StyleSheet.absoluteFillObject}
          >
            <Circle cx={350} cy={30} r={110} fill="#F59E3A" opacity={0.2} />
            <Circle cx={20} cy={190} r={70} fill="#FFC15E" opacity={0.16} />
          </Svg>

          {/* Top Row: Menu, Deliver to, Bell, Cart */}
          <View style={styles.headerTopRow}>
            {/* a) Menu button */}
            <TouchableOpacity
              style={styles.headerGlassButton}
              onPress={() => navigation.navigate('CustomerMenu')}
              activeOpacity={0.8}
            >
              <MenuIcon size={22} color="#FFFFFF" strokeWidth={1.9} />
            </TouchableOpacity>

            {/* b) Location block */}
            <TouchableOpacity
              style={styles.locationBlock}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.8}
            >
              <Text style={styles.deliverToLabel}>Deliver to</Text>
              <View style={styles.locationTextRow}>
                <PinIcon size={16} color="#F5B870" strokeWidth={2} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {locationText}
                </Text>
                <ChevronDownIcon size={16} color="#FFFFFF" strokeWidth={2.2} />
              </View>
            </TouchableOpacity>

            {/* c) Bell button */}
            <TouchableOpacity
              style={styles.headerGlassButton}
              onPress={() => navigation.navigate('Notifications')}
              activeOpacity={0.8}
            >
              <BellIcon size={22} color="#FFFFFF" strokeWidth={1.9} />
              {unreadCount > 0 && <View style={styles.notificationDot} />}
            </TouchableOpacity>

            {/* d) Cart button */}
            <TouchableOpacity
              style={styles.headerGlassButton}
              onPress={() => navigation.navigate('Cart')}
              activeOpacity={0.8}
            >
              <CartIcon size={22} color="#FFFFFF" strokeWidth={1.9} />
              {cartCount > 0 && (
                <LinearGradient
                  colors={['#F59A4A', '#D9651B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cartBadge}
                >
                  <Text style={styles.cartBadgeText}>{cartCount}</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={styles.searchBarContainer}>
            <SearchIcon size={20} color="#B8470F" strokeWidth={2} />
            <TextInput
              ref={searchInputRef}
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
              placeholder="Search for fresh products..."
              placeholderTextColor="#8E9A90"
              style={styles.searchInput}
            />
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowFilterModal(true)}
              activeOpacity={0.8}
            >
              <SlidersIcon size={20} color="#B8470F" strokeWidth={1.9} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── CONTENT AREA (horizontal padding 20) ────────────────── */}
        <View style={styles.contentArea}>
          {/* ─── 3) HERO BANNER ────────────────────────────────────── */}
          <View style={styles.heroBannerCard} onLayout={onBannerLayout}>
            {/* Background Images with cross-fade */}
            {HERO_IMAGES.map((imgSource, idx) => {
              const asset = Image.resolveAssetSource(imgSource);
              const imgWidth = asset?.width || 350;
              const imgHeight = asset?.height || 190;
              const scale = Math.max(bannerWidth / imgWidth, 190 / imgHeight);
              const renderWidth = imgWidth * scale;
              const renderHeight = imgHeight * scale;
              const renderTop = (190 - renderHeight) / 2;

              return (
                <Animated.Image
                  key={idx}
                  source={imgSource}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: renderTop,
                    width: renderWidth,
                    height: renderHeight,
                    opacity: bannerOpacities[idx],
                  }}
                  resizeMode="cover"
                  onError={(err) => console.log('Banner image failed to load:', idx, err)}
                />
              );
            })}

            {/* Dark Left Overlay for Text Readability */}
            <LinearGradient
              colors={['rgba(43,14,6,0.94)', 'rgba(43,14,6,0.55)', 'rgba(43,14,6,0)']}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none"
            />

            {/* Banner Text & Button (stationary on top) */}
            <View style={styles.heroBannerTextBlock}>
              <View style={styles.heroChip}>
                <Text style={styles.heroChipText}>FRESH TODAY</Text>
              </View>
              <Text style={styles.heroTitle}>Farm Fresh{'\n'}Goodness</Text>
              <Text style={styles.heroSubtitle}>
                Handpicked • Natural • Chemical free
              </Text>
              <TouchableOpacity
                style={styles.heroShopButtonContainer}
                onPress={() => navigation.navigate('CategoryDashboard', { category: 'Vegetable' })}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#FFD36B', '#F2A31F']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroShopButtonGradient}
                >
                  <Text style={styles.heroShopButtonText}>Shop now</Text>
                  <ArrowRightIcon size={14} color="#3B1A0E" strokeWidth={2.4} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Pagination dots */}
          <View style={styles.paginationDotsRow}>
            {HERO_IMAGES.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleDotPress(index)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Animated.View
                  style={[
                    styles.paginationDot,
                    {
                      width: dotWidths[index],
                      backgroundColor: activeBannerIndex === index ? '#C2561A' : '#E6D5C0',
                    },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* ─── 4 & 5) CATEGORIES ─────────────────────────────────── */}
          <SectionHeader
            title="Categories"
            actionText="All products"
            onPress={() => navigation.navigate('CategoryDashboard', { category: 'All Products' })}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.bleedingScroll}
            contentContainerStyle={styles.categoriesContentContainer}
          >
            {(categories.length > 0 ? categories : [
              { name: 'Fruit' },
              { name: 'Dairy' },
              { name: 'Wild forest' },
              { name: 'Vegetable' },
              { name: 'Grains' },
              { name: 'Pulses' },
            ]).map((category, index) => {
              const pastelBg = PASTEL_COLORS[index % PASTEL_COLORS.length];
              const emoji = getCategoryEmoji(category.name);

              return (
                <TouchableOpacity
                  key={category.categoryId || category.name || index}
                  style={styles.categoryTile}
                  onPress={() => openCategory(category.name)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.categoryIconBox, { backgroundColor: pastelBg }]}>
                    <Text style={{ fontSize: 26 }}>{emoji}</Text>
                  </View>
                  <Text style={styles.categoryLabel} numberOfLines={1}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ─── 6) FARMER SHORTS ──────────────────────────────────── */}
          <SectionHeader
            title="Farmer shorts"
            actionText="Watch all"
            onPress={() => navigation.navigate('FarmerShorts')}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.bleedingScroll}
            contentContainerStyle={styles.shortsContentContainer}
          >
            {(videoProducts.length > 0 ? videoProducts : [
              { productId: 'demo-1', productName: 'Fresh tomatoes', farmerVillage: 'Farmer', category: 'Vegetable', price: 0, unit: '', status: 'ACTIVE' },
              { productId: 'demo-2', productName: 'Onion harvest', farmerVillage: 'Farmer', category: 'Vegetable', price: 0, unit: '', status: 'ACTIVE' },
              { productId: 'demo-3', productName: 'Wheat crops', farmerVillage: 'Farmer', category: 'Grain', price: 0, unit: '', status: 'ACTIVE' },
            ] as ProductItem[]).map((product, idx) => {
              const gradientStops = [
                ['#F7B267', '#B4551B', '#2E170A'],
                ['#F2A6A0', '#B8505A', '#3E1A22'],
                ['#F5D27A', '#C98A1B', '#3A2606'],
              ][idx % 3];

              return (
                <TouchableOpacity
                  key={product.productId || idx}
                  style={styles.shortCard}
                  activeOpacity={0.88}
                  onPress={() => {
                    if (product.status === 'INACTIVE') {
                      Alert.alert('Inactive', 'This product is inactive');
                      return;
                    }
                    navigation.navigate('FarmerShorts');
                  }}
                >
                  {/* Background Gradient */}
                  <LinearGradient
                    colors={gradientStops as [string, string, string]}
                    start={{ x: 0.3, y: 0 }}
                    end={{ x: 0.7, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />

                  {/* If product has photo, render as background */}
                  {product.productPhoto ? (
                    <Image
                      source={{ uri: `${BASE_URL}/product/image/${product.productPhoto}` }}
                      style={StyleSheet.absoluteFillObject}
                      resizeMode="cover"
                    />
                  ) : null}

                  {/* Sunlight glow on top */}
                  <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
                    <Defs>
                      <SvgRadialGradient id={`shortsGlow-${idx}`} cx="0.72" cy="0.22" r="0.48">
                        <Stop offset="0%" stopColor="#FFE8AA" stopOpacity={0.6} />
                        <Stop offset="100%" stopColor="#FFE8AA" stopOpacity={0} />
                      </SvgRadialGradient>
                    </Defs>
                    <Rect x={0} y={0} width="100%" height="100%" fill={`url(#shortsGlow-${idx})`} />
                  </Svg>

                  {/* "Shorts" badge */}
                  <View style={styles.shortsBadge}>
                    <View style={styles.shortsBadgeDot} />
                    <Text style={styles.shortsBadgeText}>Shorts</Text>
                  </View>

                  {/* Play button */}
                  <View style={styles.shortPlayButton}>
                    <PlayIcon size={20} fill="#FFFFFF" />
                  </View>

                  {/* Bottom overlay */}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.6)']}
                    style={styles.shortBottomOverlay}
                  >
                    <Text style={styles.shortTitle} numberOfLines={1}>
                      {product.productName}
                    </Text>
                    <Text style={styles.shortFarmerSubtitle} numberOfLines={1}>
                      🌾 Farmer
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ─── 7) FRESH VEGETABLES ───────────────────────────────── */}
          <SectionHeader
            title="Fresh vegetables"
            actionText="View all"
            onPress={() => openCategory('Vegetable')}
          />

          {loadingProducts ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#B8470F" />
              <Text style={styles.loadingText}>Loading products...</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.bleedingScroll}
              contentContainerStyle={styles.productsContentContainer}
            >
              {(displayedProducts.length > 0 ? displayedProducts : [
                {
                  productId: 'sample-1',
                  productName: 'Desi cauliflower',
                  unit: 'KG',
                  price: 65,
                  averageRating: 4.0,
                  category: 'Vegetable',
                  status: 'ACTIVE',
                },
                {
                  productId: 'sample-2',
                  productName: 'Methi',
                  unit: 'BUNDLE',
                  price: 20,
                  averageRating: 4.6,
                  category: 'Vegetable',
                  status: 'ACTIVE',
                },
              ] as ProductItem[]).map((product) => {
                const wishlisted = isInWishlist(product.productId);

                return (
                  <TouchableOpacity
                    key={product.productId}
                    style={styles.productCard}
                    onPress={() => openProduct(product.productId)}
                    activeOpacity={0.9}
                  >
                    {/* Image Tile */}
                    <View style={styles.productImageTile}>
                      {/* Radial gradient background */}
                      <Svg width="100%" height={126} style={StyleSheet.absoluteFillObject}>
                        <Defs>
                          <SvgRadialGradient
                            id={`prodGrad-${product.productId}`}
                            cx="0.5"
                            cy="0.38"
                            r="0.6"
                          >
                            <Stop offset="0%" stopColor="#FFFFFF" />
                            <Stop offset="55%" stopColor="#FFF1DE" />
                            <Stop offset="100%" stopColor="#FBDDB8" />
                          </SvgRadialGradient>
                        </Defs>
                        <Rect
                          x={0}
                          y={0}
                          width="100%"
                          height={126}
                          fill={`url(#prodGrad-${product.productId})`}
                        />
                      </Svg>

                      {/* Product Image */}
                      {product.productPhoto ? (
                        <Image
                          source={{ uri: `${BASE_URL}/product/image/${product.productPhoto}` }}
                          style={styles.productImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <Text style={{ fontSize: 52 }}>🥬</Text>
                      )}

                      {/* Wishlist Heart Button */}
                      <TouchableOpacity
                        style={styles.productHeartButton}
                        onPress={() => toggleWishlist(product.productId)}
                        activeOpacity={0.8}
                      >
                        <HeartIcon
                          size={17}
                          color="#B8470F"
                          strokeWidth={1.9}
                          fill={wishlisted ? '#B8470F' : 'none'}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Name */}
                    <Text style={styles.productName} numberOfLines={1}>
                      {product.productName}
                    </Text>

                    {/* Unit */}
                    <Text style={styles.productUnit}>
                      1 {product.unit || 'KG'}
                    </Text>

                    {/* Bottom Row: Price + Rating & Add button */}
                    <View style={styles.productBottomRow}>
                      <View style={styles.productPriceColumn}>
                        <Text style={styles.productPrice}>₹{product.price}</Text>
                        <View style={styles.productRatingRow}>
                          <Text style={styles.productRatingStar}>★</Text>
                          <Text style={styles.productRatingText}>
                            {' '}{product.averageRating ? product.averageRating.toFixed(1) : '4.0'}
                          </Text>
                        </View>
                      </View>

                      {/* Add Button */}
                      <TouchableOpacity
                        style={styles.productAddButtonContainer}
                        onPress={() => addToCart(product.productId, 1)}
                        activeOpacity={0.85}
                      >
                        <LinearGradient
                          colors={['#F59A4A', '#D9651B']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.productAddButtonGradient}
                        >
                          <PlusIcon size={20} color="#FFFFFF" strokeWidth={2.4} />
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* ─── 8) FREE DELIVERY BANNER ───────────────────────────── */}
          <LinearGradient
            colors={['#FFF4DD', '#F8EBD2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.freeDeliveryContainer}
          >
            <View style={styles.freeDeliveryIconBox}>
              <BikeIcon size={28} color="#B8470F" strokeWidth={1.8} />
            </View>

            <View style={styles.freeDeliveryTextCol}>
              <Text style={styles.freeDeliveryTitle}>Free delivery</Text>
              <Text style={styles.freeDeliverySubtitle}>On orders above ₹499</Text>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('CategoryDashboard', { category: 'All Products' })}
              activeOpacity={0.85}
              style={styles.freeDeliveryShopBtnContainer}
            >
              <LinearGradient
                colors={['#C2561A', '#7A2A0C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.freeDeliveryShopBtnGradient}
              >
                <Text style={styles.freeDeliveryShopBtnText}>Shop now</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>

          {isFilteredView && (
            <TouchableOpacity style={styles.backToDashButton} onPress={clearFilters}>
              <Text style={styles.backToDashText}>Back to Dashboard</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* ─── FILTER MODAL ─────────────────────────────────────────── */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Products</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.filterSectionTitle}>Location</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="State (e.g. Maharashtra)"
                value={filterState}
                onChangeText={setFilterState}
                placeholderTextColor="#8E9A90"
              />
              <TextInput
                style={styles.filterInput}
                placeholder="Village"
                value={filterVillage}
                onChangeText={setFilterVillage}
                placeholderTextColor="#8E9A90"
              />

              <Text style={styles.filterSectionTitle}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
                {categories.map((c) => (
                  <TouchableOpacity
                    key={c.name}
                    style={[
                      styles.filterChip,
                      filterCategory === c.name && styles.filterChipActive,
                    ]}
                    onPress={() => setFilterCategory(filterCategory === c.name ? '' : c.name)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        filterCategory === c.name && styles.filterChipTextActive,
                      ]}
                    >
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.filterSectionTitle}>Price Range (₹)</Text>
              <View style={styles.priceRow}>
                <TextInput
                  style={[styles.filterInput, { flex: 1, marginRight: 10, marginBottom: 0 }]}
                  placeholder="Min"
                  keyboardType="numeric"
                  value={minPrice}
                  onChangeText={setMinPrice}
                  placeholderTextColor="#8E9A90"
                />
                <TextInput
                  style={[styles.filterInput, { flex: 1, marginBottom: 0 }]}
                  placeholder="Max"
                  keyboardType="numeric"
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                  placeholderTextColor="#8E9A90"
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
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

// ─── STYLES ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: '#FBF5EA',
  },
  scrollContent: {
    paddingBottom: 130, // generous bottom padding so content is never hidden behind floating nav
  },

  // Header
  headerContainer: {
    width: '100%',
    minHeight: 208,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingBottom: 22,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerGlassButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationBlock: {
    flex: 1,
  },
  deliverToLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.66,
    color: '#FFD9A0',
  },
  locationTextRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
    maxWidth: 160,
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#F59A4A',
    borderWidth: 2,
    borderColor: '#6B2410',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  cartBadgeText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    color: '#FFFFFF',
  },

  // Search Bar
  searchBarContainer: {
    marginTop: 18,
    height: 56,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 16,
    paddingRight: 9,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.22,
        shadowRadius: 28,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#3B1A0E',
    paddingVertical: 0,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FFEBD6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Content Area
  contentArea: {
    paddingHorizontal: 20,
  },

  // Hero Banner
  heroBannerCard: {
    marginTop: 16,
    height: 190,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#2B0E06',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(90, 30, 10, 1)',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.38,
        shadowRadius: 38,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  heroBannerTextBlock: {
    position: 'absolute',
    top: 14,
    left: 18,
    width: 220,
  },
  heroChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  heroChipText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9,
    letterSpacing: 1.2,
    color: '#FFE2A8',
  },
  heroTitle: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 22,
    lineHeight: 25,
    color: '#FFFFFF',
    marginTop: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  heroSubtitle: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
  },
  heroShopButtonContainer: {
    marginTop: 8,
    alignSelf: 'flex-start',
    height: 32,
    borderRadius: 10,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#F2A31F',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 18,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  heroShopButtonGradient: {
    height: 32,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroShopButtonText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 12,
    color: '#3B1A0E',
  },

  // Pagination Dots
  paginationDotsRow: {
    marginTop: 8,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E6D5C0',
  },
  paginationDotActive: {
    width: 22,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C2561A',
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  sectionHeaderTitle: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 18,
    lineHeight: 22,
    color: '#3B1A0E',
  },
  sectionHeaderLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionHeaderLinkText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 12,
    color: '#B8470F',
  },

  // Horizontal Bleeding Lists
  bleedingScroll: {
    marginHorizontal: -20,
  },
  categoriesContentContainer: {
    paddingHorizontal: 20,
    gap: 12,
    paddingTop: 2,
    paddingBottom: 4,
  },

  // Categories
  categoryTile: {
    width: 80,
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 6,
    borderRadius: 22,
    backgroundColor: '#FFFDF8',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(90, 40, 15, 1)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  categoryIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11.5,
    color: '#3B1A0E',
    marginTop: 8,
    textAlign: 'center',
  },

  // Farmer Shorts
  shortsContentContainer: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 4,
  },
  shortCard: {
    width: 158,
    height: 236,
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(90, 40, 15, 1)',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  shortsBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  shortsBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FF5B4D',
  },
  shortsBadgeText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11,
    color: '#FFFFFF',
  },
  shortPlayButton: {
    position: 'absolute',
    top: 84,
    left: 55,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortBottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 34,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  shortTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  shortFarmerSubtitle: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
  },

  // Fresh Vegetables
  productsContentContainer: {
    paddingHorizontal: 20,
    gap: 12,
    paddingTop: 2,
    paddingBottom: 4,
  },
  productCard: {
    width: 164,
    padding: 10,
    borderRadius: 24,
    backgroundColor: '#FFFDF8',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(90, 40, 15, 1)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.09,
        shadowRadius: 24,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  productImageTile: {
    height: 126,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: 100,
    height: 76,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(120, 50, 10, 1)',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.30,
        shadowRadius: 8,
      },
    }),
  },
  productHeartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.10,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  productName: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15,
    color: '#3B1A0E',
    marginTop: 12,
    marginHorizontal: 2,
  },
  productUnit: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11.5,
    letterSpacing: 0.46,
    color: '#8A6F5C',
    textTransform: 'uppercase',
    marginTop: 2,
    marginHorizontal: 2,
  },
  productBottomRow: {
    marginTop: 8,
    marginHorizontal: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  productPriceColumn: {
    flex: 1,
  },
  productPrice: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 19,
    color: '#2A1710',
  },
  productRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  productRatingStar: {
    fontSize: 12,
    color: '#F0A020',
  },
  productRatingText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    color: '#7A6350',
  },
  productAddButtonContainer: {
    width: 38,
    height: 38,
    borderRadius: 13,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#D9651B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  productAddButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Free Delivery Banner
  freeDeliveryContainer: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EBD9B3',
  },
  freeDeliveryIconBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(90, 40, 15, 1)',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.10,
        shadowRadius: 14,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  freeDeliveryTextCol: {
    flex: 1,
  },
  freeDeliveryTitle: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 18,
    color: '#3B1A0E',
  },
  freeDeliverySubtitle: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12.5,
    color: '#7A6350',
    marginTop: 2,
  },
  freeDeliveryShopBtnContainer: {
    height: 40,
    borderRadius: 14,
    overflow: 'hidden',
  },
  freeDeliveryShopBtnGradient: {
    height: 40,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freeDeliveryShopBtnText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
  },

  // Search Results / Filter Helpers
  backToDashButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 22,
    backgroundColor: '#C2561A',
    borderRadius: 16,
    alignSelf: 'center',
  },
  backToDashText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  loadingBox: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    color: '#7A6350',
    marginTop: 8,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFDF8',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 20,
    color: '#3B1A0E',
  },
  modalCloseText: {
    fontSize: 20,
    color: '#7A6350',
    fontWeight: '700',
  },
  filterSectionTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    color: '#3B1A0E',
    marginTop: 10,
    marginBottom: 8,
  },
  filterInput: {
    height: 46,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBD9B3',
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#3B1A0E',
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F5EFE6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#FFE7CC',
    borderWidth: 1,
    borderColor: '#C2561A',
  },
  filterChipText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    color: '#7A6350',
  },
  filterChipTextActive: {
    color: '#C2561A',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  priceRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  resetButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EBD9B3',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  resetButtonText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    color: '#7A6350',
  },
  applyButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#C2561A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});

export default CustomerDashboard;

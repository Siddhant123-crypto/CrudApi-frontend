import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Image,
  ScrollView,
  RefreshControl,
  Alert,
  TextInput,
  Linking,
  SafeAreaView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { getAllProducts, getProductImageUrl } from '../services/productService';
import { getFarmerOrders, acceptOrder, farmerCancelOrder, getFarmerItemsStatus } from '../services/orderService';
import { BASE_URL } from '../services/api';

const categories = [
  { name: 'Vegetable', icon: 'leaf-outline', bg: '#E6F4EA', color: '#1E8E3E' },
  { name: 'Fruit', icon: 'nutrition-outline', bg: '#FCE8E6', color: '#D93025' },
  { name: 'Root Veg', icon: 'flower-outline', bg: '#FCEFE2', color: '#E8710A' },
  { name: 'Grains', icon: 'basket-outline', bg: '#FFF0D4', color: '#F9AB00' },
  { name: 'Wild Veg', icon: 'rose-outline', bg: '#F3E8FD', color: '#9334E6' },
  { name: 'Dairy', icon: 'water-outline', bg: '#E8F0FE', color: '#1A73E8' },
];

const FarmerDashboardScreen = ({ navigation }: any) => {
  const { user, logout, setInitialAuthRoute } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [allGlobalProducts, setAllGlobalProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [searchText, setSearchText] = useState('');

  const carouselImages = [
    require('../../assets/vagis4.png'),
    require('../../assets/vagis5.png'),
    require('../../assets/vagis6.png'),
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    try {
      const [allProducts, farmerOrders] = await Promise.all([
        getAllProducts(),
        getFarmerOrders()
      ]);
      setAllGlobalProducts(allProducts);
      const myProducts = allProducts.filter((p: any) => p.farmerId === user?.farmerId);
      setProducts(myProducts);
      setOrders(farmerOrders);
    } catch (error) {
      console.log('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [user?.farmerId])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await acceptOrder(orderId);
      Alert.alert('Success', 'Order accepted successfully');
      fetchData();
    } catch (error) {
      console.log('Error accepting order:', error);
      Alert.alert('Error', 'Could not accept order');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      await farmerCancelOrder(orderId);
      Alert.alert('Success', 'Order rejected successfully');
      fetchData();
    } catch (error) {
      console.log('Error rejecting order:', error);
      Alert.alert('Error', 'Could not reject order');
    }
  };

  const openCategory = (categoryName: string) => {
    navigation.navigate('FarmerCategoryDashboard', { category: categoryName });
  };

  const handlePlayVideo = (videoFilename: string) => {
    const videoUrl = `${BASE_URL}/product/video/${videoFilename}`;
    Linking.openURL(videoUrl).catch(() =>
      Alert.alert('Error', 'Could not open video. Please try again.')
    );
  };

  const videoProducts = allGlobalProducts.filter(p => !!p.productVideo);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#176B2C']} />}
        >
          {/* =========================
              CURVED HEADER (Green Theme)
          ========================= */}
          <View style={styles.headerBlock}>
            <View style={styles.headerTopRow}>
              <TouchableOpacity 
                onPress={async () => {
                  setInitialAuthRoute('NewUserLogin');
                  await logout();
                }}
                style={styles.backButton}
              >
                <Ionicons name="chevron-back-outline" size={28} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.locationContainer}>
                <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.locationTextContainer}>
                  <Text style={styles.locationNameText} numberOfLines={1}>
                    Welcome, {user?.name || 'Farmer'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.headerIconButton} onPress={() => Alert.alert('Notifications', 'No new notifications.')}>
                <Ionicons name="notifications-outline" size={26} color="#FFFFFF" />
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>2</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* SEARCH BOX INSIDE CURVED HEADER */}
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={20} color="#64748B" style={{ marginRight: 8 }} />
              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Search your products..."
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
              />
            </View>
          </View>

          <View style={styles.mainContentCard}>
            
            <View style={styles.contentPadding}>
              
              {/* =========================
                  BANNER
              ========================= */}
              <ImageBackground
                source={carouselImages[currentImageIndex]}
                style={styles.promoCardBg}
                imageStyle={styles.promoCardImage}
                resizeMode="cover"
              >
                <View style={styles.promoOverlay} />
                <View style={styles.promoContentWrapper}>
                  <View style={styles.promoTextContent}>
                    <Text style={[styles.promoTitle, { color: '#FFF' }]}>Farm Performance</Text>
                    <Text style={[styles.promoSubtitle, { color: '#E8F5E9' }]}>Manage your stock & orders</Text>
                    <TouchableOpacity 
                        style={styles.promoButton}
                        onPress={() => navigation.navigate('AddProduct')} 
                    >
                      <Text style={styles.promoButtonText}>Add Product</Text>
                      <Ionicons name="add" size={16} color="#000" style={{marginLeft: 4}} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.carouselDotsContainer}>
                  {carouselImages.map((_, index) => (
                    <View key={index} style={[styles.carouselDot, currentImageIndex === index ? styles.carouselDotActive : styles.carouselDotInactive]} />
                  ))}
                </View>
              </ImageBackground>

              {/* =====================
                  CATEGORIES
              ===================== */}
              <View style={styles.categorySection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Farm Categories</Text>
                </View>
                <View style={styles.categoryGridContainer}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category.name}
                      style={styles.categoryWrap}
                      onPress={() => openCategory(category.name)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.categoryCard, { borderColor: category.color }]}>
                        <Ionicons name={category.icon as any} size={22} color={category.color} />
                      </View>
                      <Text style={styles.categoryText} numberOfLines={1}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* =====================
                  QUICK ACTIONS
              ===================== */}
              <View style={styles.quickActionsSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Quick Actions</Text>
                </View>
                <View style={styles.quickActionsContainer}>
                  <TouchableOpacity style={styles.actionWrap} onPress={() => navigation.navigate('AddProduct')}>
                    <View style={styles.actionCard}>
                      <View style={[styles.actionIconBox, { backgroundColor: '#E6F4EA' }]}>
                        <Ionicons name="add" size={24} color="#1E8E3E" />
                      </View>
                      <Text style={styles.actionLabel}>Add</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionWrap} onPress={() => navigation.navigate('MyFarm')}>
                    <View style={styles.actionCard}>
                      <View style={[styles.actionIconBox, { backgroundColor: '#E8F0FE' }]}>
                        <Ionicons name="leaf" size={24} color="#1A73E8" />
                      </View>
                      <Text style={styles.actionLabel}>My Product</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionWrap} onPress={() => navigation.navigate('Orders')}>
                    <View style={styles.actionCard}>
                      <View style={[styles.actionIconBox, { backgroundColor: '#FFF0D4' }]}>
                        <Ionicons name="receipt" size={24} color="#F9AB00" />
                      </View>
                      <Text style={styles.actionLabel}>Orders</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionWrap} onPress={() => navigation.navigate('Market')}>
                    <View style={styles.actionCard}>
                      <View style={[styles.actionIconBox, { backgroundColor: '#F3E8FD' }]}>
                        <Ionicons name="storefront" size={24} color="#9334E6" />
                      </View>
                      <Text style={styles.actionLabel}>Market</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* =====================
                  FARMER SHORTS
              ===================== */}
              {videoProducts.length > 0 && (
                <View style={styles.shortsSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>🎬 Farmer Shorts</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shortsScroll} decelerationRate="fast" snapToInterval={155} snapToAlignment="start">
                    {videoProducts.map(product => (
                      <TouchableOpacity
                        key={`video-${product.productId}`}
                        style={styles.shortCard}
                        activeOpacity={0.85}
                        onPress={() => handlePlayVideo(product.productVideo!)}
                      >
                        <Image
                          source={
                            product.productPhoto
                              ? { uri: `${BASE_URL}/product/image/${product.productPhoto}` }
                              : { uri: 'https://placehold.co/140x240/1A1A2E/FFFFFF?text=Video' }
                          }
                          style={styles.shortThumbnail}
                          resizeMode="cover"
                        />
                        <View style={styles.shortOverlay} />
                        <View style={styles.shortPlayBtn}>
                          <View style={styles.shortPlayCircle}>
                            <Ionicons name="play" size={20} color="#FFFFFF" />
                          </View>
                        </View>
                        <View style={styles.shortsBadge}>
                          <Ionicons name="videocam" size={10} color="#FF0000" />
                          <Text style={styles.shortsBadgeText}> Shorts</Text>
                        </View>
                        <Text style={styles.shortTitle} numberOfLines={2}>{product.productName}</Text>
                        <Text style={styles.shortPrice}>₹{product.price}/{product.unit?.toLowerCase()}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}


              {/* =====================
                  RECENT ORDERS
              ===================== */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Recent Orders</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.ordersList}>
                {orders.filter(o => getFarmerItemsStatus(o.items || []) === 'PENDING').length === 0 ? (
                  <Text style={{ textAlign: 'center', color: '#888', marginTop: 10 }}>No new orders found.</Text>
                ) : (
                  orders.filter(o => getFarmerItemsStatus(o.items || []) === 'PENDING').slice(0, 5).map((order) => {
                    const fStatus = getFarmerItemsStatus(order.items || []);
                    const isCancelled = fStatus === 'CANCELLED';
                    const isAccepted = fStatus !== 'PENDING' && !isCancelled;
                    const isPending = fStatus === 'PENDING';

                    const mainItem = order.items && order.items.length > 0 ? order.items[0] : null;
                    const rawImageUrl = mainItem?.imageUrl || mainItem?.productPhoto || mainItem?.product?.productPhoto;
                    const resolvedImageUrl = rawImageUrl ? getProductImageUrl(rawImageUrl) : null;

                    return (
                      <TouchableOpacity 
                        key={order.orderId} 
                        style={[
                          styles.orderCardItem,
                          isAccepted && { backgroundColor: '#F1F8E9', borderColor: '#4CAF50' },
                          isCancelled && { backgroundColor: '#FFEBEE', borderColor: '#F44336' }
                        ]}
                        onPress={() => navigation.navigate('FarmerOrderDetails', {orderId: order.orderId, initialOrder: order})}
                        activeOpacity={0.8}
                      >
                        {isAccepted && (
                          <View style={styles.statusMarkAbs}>
                            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                          </View>
                        )}
                        {isCancelled && (
                          <View style={styles.statusMarkAbs}>
                            <Ionicons name="close-circle" size={24} color="#F44336" />
                          </View>
                        )}

                        <View style={styles.orderCardTopRow}>
                          <Image 
                            source={{ uri: resolvedImageUrl || 'https://cdn-icons-png.flaticon.com/512/1147/1147805.png' }} 
                            style={styles.orderProductImage} 
                          />
                          <View style={styles.orderDetails}>
                            <Text style={styles.orderProductName}>{mainItem?.productName || 'Product'}</Text>
                            <Text style={styles.orderMeta}>Order #{order.orderNumber ? order.orderNumber.substring(0, 12) : order.orderId.substring(0, 8)}</Text>
                            <Text style={styles.orderMeta}>Total: ₹{order.totalAmount}</Text>
                          </View>
                          <View style={styles.orderStatusCol}>
                            <Text style={styles.customerName}>Ordered by: {order.customerName || 'Customer'}</Text>
                            <View style={[styles.statusBadgePending, 
                                isAccepted && { backgroundColor: '#C8E6C9' },
                                isCancelled && { backgroundColor: '#FFCDD2' }
                            ]}>
                                <Text style={[styles.statusTextPending,
                                  isAccepted && { color: '#2E7D32' },
                                  isCancelled && { color: '#C62828' }
                                ]}>{fStatus}</Text>
                            </View>
                          </View>
                        </View>

                        {(isPending || isAccepted) && (
                          <View style={styles.orderActionsRow}>
                              {isPending && (
                                <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAcceptOrder(order.orderId)}>
                                  <Text style={styles.acceptBtnText}>Accept</Text>
                                </TouchableOpacity>
                              )}
                              {(isPending || isAccepted) && (
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancelOrder(order.orderId)}>
                                  <Text style={styles.cancelBtnText}>Reject</Text>
                                </TouchableOpacity>
                              )}
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>

            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1E5631',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  headerBlock: {
    backgroundColor: '#1E5631',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 40,
    zIndex: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 10,
  },
  locationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationNameText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  headerIconButton: {
    position: 'relative',
    padding: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#176B2C',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: 'bold',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30, // more pill-shaped
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
    fontSize: 14,
    color: '#0F172A',
    height: '100%',
  },
  mainContentCard: {
    flex: 1,
    backgroundColor: '#FFFFFF', // matching the white background below the curve
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    marginTop: -25, // this pulls the white card up over the green header to create the curve
    zIndex: 20,
  },
  contentPadding: {
    paddingHorizontal: 20,
  },
  promoCardBg: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 28,
    height: 180, // Increased height
    backgroundColor: '#1E5631', // matching the header color as requested
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  promoCardImage: {
    borderRadius: 20,
  },
  promoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9, 42, 11, 0.4)',
  },
  promoContentWrapper: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
  },
  promoTextContent: {
    flex: 1,
    justifyContent: 'center',
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  promoSubtitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  promoButton: {
    backgroundColor: '#FFD02A', 
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  promoButtonText: {
    color: '#27391F',
    fontSize: 12,
    fontWeight: '800',
  },
  carouselDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
  },
  carouselDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  carouselDotActive: {
    backgroundColor: '#FFF',
    width: 8,
    height: 8,
  },
  carouselDotInactive: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  categorySection: {
    marginBottom: 4, // Reduced from 24 to bring Quick Actions up
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E5631',
  },
  categoryGridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  categoryWrap: {
    alignItems: 'center',
    width: '16%', // roughly 1/6th to fit all evenly
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderBottomWidth: 3, // slightly smaller 3D depth for a smaller icon
    width: 48, // made small enough to fit 6 on screen
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  categoryText: {
    fontSize: 9, // smaller text to fit
    color: '#334155',
    fontWeight: '700',
    textAlign: 'center',
  },
  quickActionsSection: {
    marginBottom: 28,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionWrap: {
    flex: 1,
    alignItems: 'center',
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderBottomWidth: 5, // 3D effect depth
    borderColor: '#E2E8F0',
    borderBottomColor: '#CBD5E1',
    width: '90%',
    aspectRatio: 0.9,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '700',
    textAlign: 'center',
  },
  shortsSection: {
    marginBottom: 24,
  },
  shortsScroll: {
    gap: 12,
  },
  shortCard: {
    width: 140,
    height: 240,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    position: 'relative',
  },
  shortThumbnail: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  shortOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  shortPlayBtn: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shortPlayCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  shortsBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  shortsBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  shortTitle: {
    position: 'absolute',
    bottom: 28,
    left: 10,
    right: 10,
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  shortPrice: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  viewAllText: {
    color: '#176B2C',
    fontWeight: '700',
    fontSize: 12,
  },
  ordersList: {
    gap: 12,
  },
  orderCardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'column',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  orderCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusMarkAbs: {
    position: 'absolute',
    top: -8,
    left: -8,
    backgroundColor: '#FFF',
    borderRadius: 12,
    zIndex: 10,
  },
  orderActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    gap: 10,
  },
  acceptBtn: {
    backgroundColor: '#176B2C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  acceptBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  cancelBtn: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA'
  },
  cancelBtnText: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 12,
  },
  orderProductImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F1F5F9',
  },
  orderDetails: {
    flex: 1,
  },
  orderProductName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  orderMeta: {
    fontSize: 12,
    color: '#64748B',
  },
  orderStatusCol: {
    alignItems: 'flex-end',
  },
  customerName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  statusBadgePending: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusTextPending: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase'
  }
});

export default FarmerDashboardScreen;

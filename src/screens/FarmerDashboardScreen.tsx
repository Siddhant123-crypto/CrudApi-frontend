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
  TextInput
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { getAllProducts, getProductImageUrl } from '../services/productService';
import { getFarmerOrders, acceptOrder, farmerCancelOrder } from '../services/orderService';
import { BASE_URL } from '../services/api';

const FarmerDashboardScreen = ({ navigation }: any) => {
  const { user, logout, setInitialAuthRoute } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [searchText, setSearchText] = useState('');

  const carouselImages = [
    require('../../assets/vagis1.png'),
    require('../../assets/vagis2.png'),
    require('../../assets/vagis3.png'),
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

  const totalEarnings = products.reduce((acc, curr) => acc + (curr.price * 10), 0); // Mock data for earnings

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1B5E20']} />}
      >
        {/* =========================
            HEADER STRIP
        ========================= */}
        <View style={styles.topGreenStrip}>
          <TouchableOpacity 
            onPress={async () => {
              setInitialAuthRoute('NewUserLogin');
              await logout();
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => Alert.alert('Notifications', 'No new notifications')} style={styles.headerIconButton}>
              <Ionicons name="notifications-outline" size={22} color="#FFF" />
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>3</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* =========================
            HEADER
        ========================= */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Hello, {user?.name || 'Farmer'}!
          </Text>
          <Text style={styles.subtitle}>
            Grow Quality, Earn Trust
          </Text>

          {/* SEARCH */}
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={24} color="#2D983A" />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search your products..."
              placeholderTextColor="#8A938D"
              style={styles.searchInput}
            />
          </View>
        </View>

        {/* Stats Card Overlapping Hero */}
        <View style={styles.statsCardContainer}>
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <View style={styles.statIconWrapper}>
                 <Ionicons name="basket" size={20} color="#4CAF50" />
              </View>
              <Text style={styles.statValue}>{products.length > 0 ? products.length : '12'}</Text>
              <Text style={styles.statLabel}>Products</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.statIconWrapper}>
                 <Ionicons name="bag-handle" size={20} color="#FFC107" />
              </View>
              <Text style={styles.statValue}>28</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.statIconWrapper}>
                 <Ionicons name="eye" size={20} color="#2196F3" />
              </View>
              <Text style={styles.statValue}>350</Text>
              <Text style={styles.statLabel}>Views</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.statIconWrapper}>
                 <Text style={{color: '#4CAF50', fontWeight: 'bold', fontSize: 16}}>₹</Text>
              </View>
              <Text style={styles.statValue}>12,450</Text>
              <Text style={styles.statLabel}>Earnings</Text>
            </View>
          </View>
        </View>

        <View style={styles.contentPadding}>
          {/* Fresh Produce Promo Banner */}
          <ImageBackground
             source={carouselImages[currentImageIndex]}
             style={styles.promoCardBg}
             imageStyle={styles.promoCardImage}
             resizeMode="cover"
          >
             <View style={styles.promoOverlay} />
             <View style={styles.promoContentWrapper}>
               <View style={styles.promoTextContent}>
                  <Text style={[styles.promoTitle, { color: '#FFF' }]}>Fresh Produce</Text>
                  <Text style={[styles.promoSubtitle, { color: '#E8F5E9' }]}>From My Farm</Text>
                  <Text style={[styles.promoSubtitle, { color: '#E8F5E9' }]}>To Your Table</Text>
                  <TouchableOpacity 
                     style={styles.promoButton}
                     onPress={() => navigation.navigate('Products')} 
                  >
                    <Text style={styles.promoButtonText}>View My Products</Text>
                    <Ionicons name="arrow-forward" size={16} color="#FFF" style={{marginLeft: 4}} />
                  </TouchableOpacity>
               </View>
             </View>
             
             {/* Carousel Dots */}
             <View style={styles.carouselDotsContainer}>
                {carouselImages.map((_, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.carouselDot, 
                      currentImageIndex === index ? styles.carouselDotActive : styles.carouselDotInactive
                    ]} 
                  />
                ))}
             </View>
          </ImageBackground>

          {/* Quick Actions */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsContainer}>
             <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('AddProduct')}>
                <View style={[styles.actionIconBg, {backgroundColor: '#E8F5E9'}]}>
                   <Ionicons name="add" size={28} color="#2E7D32" />
                </View>
                <Text style={styles.actionLabel}>Add Product</Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Products')}>
                <View style={[styles.actionIconBg, {backgroundColor: '#E3F2FD'}]}>
                   <Ionicons name="storefront" size={24} color="#1976D2" />
                </View>
                <Text style={styles.actionLabel}>My Products</Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Orders')}>
                <View style={[styles.actionIconBg, {backgroundColor: '#FFF3E0'}]}>
                   <Ionicons name="receipt" size={24} color="#F57C00" />
                </View>
                <Text style={styles.actionLabel}>Orders</Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Earnings')}>
                <View style={[styles.actionIconBg, {backgroundColor: '#F3E5F5'}]}>
                   <Ionicons name="pie-chart" size={24} color="#7B1FA2" />
                </View>
                <Text style={styles.actionLabel}>Analytics</Text>
             </TouchableOpacity>
          </View>

          {/* Recent Orders */}
          <View style={styles.sectionHeaderRow}>
             <Text style={styles.sectionTitle}>Recent Orders</Text>
             <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
                <Text style={styles.viewAllText}>View All</Text>
             </TouchableOpacity>
          </View>

          <View style={styles.ordersList}>
             {orders.length === 0 ? (
               <Text style={{ textAlign: 'center', color: '#888', marginTop: 10 }}>No recent orders found.</Text>
             ) : (
               orders.slice(0, 5).map((order) => {
                 const isCancelled = order.status === 'CANCELLED';
                 const isAccepted = order.status !== 'PENDING' && !isCancelled;
                 const isPending = order.status === 'PENDING';

                 const mainItem = order.items && order.items.length > 0 ? order.items[0] : null;
                 const rawImageUrl = mainItem?.imageUrl || mainItem?.productPhoto || mainItem?.product?.productPhoto;
                 const resolvedImageUrl = rawImageUrl ? getProductImageUrl(rawImageUrl) : null;

                 return (
                  <TouchableOpacity 
                     key={order.orderId} 
                     style={[
                      styles.orderCard,
                      isAccepted && { backgroundColor: '#F1F8E9', borderColor: '#4CAF50' }, // faint green
                      isCancelled && { backgroundColor: '#FFEBEE', borderColor: '#F44336' } // faint red
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
                              ]}>{order.status}</Text>
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
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },
  scrollContent: {
    paddingBottom: 100, // Space for bottom nav
  },
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
    backgroundColor: 'rgba(255,255,255,0.2)',
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
    marginTop: 10,
    fontSize: 26,
    fontWeight: '600',
    color: '#112017',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#4A564E',
  },
  searchBox: {
    marginTop: 20,
    minHeight: 59,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    paddingLeft: 16,
    paddingRight: 7,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#62705F',
    shadowOpacity: 0.12,
    shadowRadius: 7,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },
  searchInput: {
    flex: 1,
    marginHorizontal: 9,
  },
  searchButton: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#2D983A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCardContainer: {
    paddingHorizontal: 16,
    marginTop: -20, // Pull up to overlap header
  },
  statsCard: {
    backgroundColor: '#E8F5E9', // Cream green
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#81C784',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconWrapper: {
    marginBottom: 8,
  },
  statValue: {
    color: '#1B5E20', // Dark green for contrast
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#2E7D32', // Medium green for contrast
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.1)', // Darker divider for contrast
  },
  contentPadding: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  promoCardBg: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    backgroundColor: '#FFF',
    elevation: 6,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  promoCardImage: {
    borderRadius: 16,
  },
  promoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  promoContentWrapper: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 28, // extra padding for dots
  },
  carouselDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 12,
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
    borderRadius: 4,
  },
  carouselDotInactive: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  promoTextContent: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  promoSubtitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  promoButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  promoButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 16,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8F5E9',
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 6,
    elevation: 8,
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  actionIconBg: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  actionLabel: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    color: '#2E7D32',
    fontWeight: '600',
    fontSize: 14,
  },
  ordersList: {
    gap: 12,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#86EFAC',
    padding: 16,
    flexDirection: 'column',
    elevation: 6,
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    position: 'relative',
  },
  orderCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusMarkAbs: {
    position: 'absolute',
    top: -10,
    left: -10,
    backgroundColor: '#FFF',
    borderRadius: 12,
    zIndex: 10,
  },
  orderActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 12,
    gap: 10,
  },
  acceptBtn: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  acceptBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  cancelBtn: {
    backgroundColor: '#F44336',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  orderProductImage: {
    width: 50,
    height: 50,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#EEEEEE',
  },
  orderDetails: {
    flex: 1,
  },
  orderProductName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  orderMeta: {
    fontSize: 13,
    color: '#757575',
  },
  orderStatusCol: {
    alignItems: 'flex-end',
  },
  customerName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 6,
  },
  statusBadgeDelivered: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statusTextDelivered: {
    color: '#2E7D32',
    fontSize: 11,
    fontWeight: 'bold',
  },
  statusBadgePending: {
    backgroundColor: '#FFF3E0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statusTextPending: {
    color: '#F57C00',
    fontSize: 11,
    fontWeight: 'bold',
  }
});

export default FarmerDashboardScreen;

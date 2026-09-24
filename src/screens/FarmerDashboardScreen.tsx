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
  SafeAreaView,
  Modal
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Video, ResizeMode } from 'expo-av';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { getAllProducts, getProductImageUrl } from '../services/productService';
import { getFarmerOrders, acceptOrder, farmerCancelOrder, getFarmerItemsStatus } from '../services/orderService';
import { getFarmerById } from '../services/farmerService';
import api, { BASE_URL } from '../services/api';
import FarmerWeatherWidget from '../components/FarmerWeatherWidget';

const FarmerDashboardScreen = ({ navigation }: any) => {
  const { unreadCount } = useNotification();
  const { user, logout, setInitialAuthRoute } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [allGlobalProducts, setAllGlobalProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [isBlockedModalVisible, setIsBlockedModalVisible] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [blockedUntil, setBlockedUntil] = useState<string | null>(null);
  const [supportUnreadCount, setSupportUnreadCount] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const getCategoryStyles = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('veg')) return { icon: 'leaf-outline', color: '#1E8E3E', bg: '#E6F4EA' };
    if (n.includes('fruit')) return { icon: 'nutrition-outline', color: '#D93025', bg: '#FCE8E6' };
    if (n.includes('root')) return { icon: 'flower-outline', color: '#E8710A', bg: '#FCEFE2' };
    if (n.includes('grain')) return { icon: 'basket-outline', color: '#F9AB00', bg: '#FFF0D4' };
    if (n.includes('dairy') || n.includes('milk')) return { icon: 'water-outline', color: '#1A73E8', bg: '#E8F0FE' };
    if (n.includes('spice')) return { icon: 'flame-outline', color: '#EA4335', bg: '#FCE8E6' };
    return { icon: 'grid-outline', color: '#9334E6', bg: '#F3E8FD' };
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
      const [allProducts, farmerOrders, farmerDetails] = await Promise.all([
        getAllProducts(),
        getFarmerOrders(),
        user?.farmerId ? getFarmerById(user.farmerId).catch(() => null) : Promise.resolve(null)
      ]);
      
      if (farmerDetails) {
        if (farmerDetails.status === 'INACTIVE' && farmerDetails.blockReason) {
          setBlockReason(farmerDetails.blockReason);
          if (farmerDetails.blockedUntil) {
            setBlockedUntil(new Date(farmerDetails.blockedUntil).toLocaleDateString());
          }
          try {
            const unreadRes = await api.get('/support/unread-count');
            if (unreadRes.data && unreadRes.data.data) {
              setSupportUnreadCount(unreadRes.data.data);
            }
          } catch (e) {
            console.log('Error fetching unread support count', e);
          }
          setIsBlockedModalVisible(true);
          return;
        }
      }

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
      fetchCategories();
    }, [user?.farmerId])
  );
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isBlockedModalVisible) {
      interval = setInterval(async () => {
        try {
          const unreadRes = await api.get('/support/unread-count');
          if (unreadRes.data && unreadRes.data.data !== undefined) {
            setSupportUnreadCount(unreadRes.data.data);
          }
        } catch (e) {
          console.log('Error fetching unread support count', e);
        }
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isBlockedModalVisible]);

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
          {}
          <View style={styles.headerBlock}>
            <View style={styles.headerTopRow}>
              <TouchableOpacity
                onPress={() => navigation.navigate('FarmerMenu')}
                style={styles.backButton}
              >
                <Ionicons name="menu" size={28} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={[styles.locationContainer, { alignItems: 'flex-start', marginLeft: 10 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="location" size={20} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={{ flexDirection: 'row', alignItems: 'center' }} activeOpacity={0.8}>
                    <Text style={styles.locationNameText} numberOfLines={1}>
                      {user?.name || 'Farmer'}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color="#FFFFFF" style={{ marginLeft: 3 }} />
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity style={styles.headerIconButton} onPress={() => navigation.navigate('Notifications')}>
                <Ionicons name="notifications-outline" size={26} color="#FFFFFF" />
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
            {}
            {!isSearchExpanded ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity 
                  style={styles.searchIconCollapsed}
                  onPress={() => setIsSearchExpanded(true)}
                >
                  <Ionicons name="search-outline" size={22} color="#1E5631" />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <FarmerWeatherWidget />
                </View>
              </View>
            ) : (
              <View style={styles.searchBox}>
                <TouchableOpacity 
                  onPress={() => {
                    setSearchText('');
                    setIsSearchExpanded(false);
                  }}
                  style={styles.searchBoxBackBtn}
                >
                  <Ionicons name="arrow-back" size={20} color="#1E5631" />
                </TouchableOpacity>
                <TextInput
                  value={searchText}
                  onChangeText={setSearchText}
                  placeholder="Search your products..."
                  placeholderTextColor="#94A3B8"
                  style={styles.searchInput}
                  returnKeyType="search"
                  autoFocus
                  onBlur={() => {
                    if (!searchText.trim()) {
                      setIsSearchExpanded(false);
                    }
                  }}
                  onSubmitEditing={() => {
                    if (searchText.trim()) {
                      navigation.navigate('MyProducts', { searchQuery: searchText.trim() });
                      setSearchText('');
                      setIsSearchExpanded(false);
                    } else {
                      setIsSearchExpanded(false);
                    }
                  }}
                />
                <TouchableOpacity 
                  onPress={() => {
                    setSearchText('');
                    setIsSearchExpanded(false);
                  }} 
                  style={{ padding: 4 }}
                >
                  <Ionicons name="close-circle" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            )}
          </View>
          <View style={styles.mainContentCard}>
            <View style={styles.contentPadding}>
              
              {/* Promo Banner */}
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

              {/* Category Section */}
              <View style={styles.categorySection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Farm Categories</Text>
                </View>
                <View style={styles.categoryGridContainer}>
                  {categories.map((category) => {
                    const stylesObj = getCategoryStyles(category.name);
                    return (
                      <TouchableOpacity
                        key={category.categoryId || category.name}
                        style={styles.categoryWrap}
                        onPress={() => openCategory(category.name)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.categoryCard, { borderColor: stylesObj.color }]}>
                          <Ionicons name={stylesObj.icon as any} size={22} color={stylesObj.color} />
                        </View>
                        <Text style={styles.categoryText} numberOfLines={1} adjustsFontSizeToFit>
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              {}
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
                      <Text style={styles.actionLabel} numberOfLines={1} adjustsFontSizeToFit>Add</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionWrap} onPress={() => navigation.navigate('MyProducts')}>
                    <View style={styles.actionCard}>
                      <View style={[styles.actionIconBox, { backgroundColor: '#E8F0FE' }]}>
                        <Ionicons name="leaf" size={24} color="#1A73E8" />
                      </View>
                      <Text style={styles.actionLabel} numberOfLines={2} adjustsFontSizeToFit>My Product</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionWrap} onPress={() => navigation.navigate('Orders')}>
                    <View style={styles.actionCard}>
                      <View style={[styles.actionIconBox, { backgroundColor: '#FFF0D4' }]}>
                        <Ionicons name="receipt" size={24} color="#F9AB00" />
                      </View>
                      <Text style={styles.actionLabel} numberOfLines={1} adjustsFontSizeToFit>Orders</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionWrap} onPress={() => navigation.navigate('Market')}>
                    <View style={styles.actionCard}>
                      <View style={[styles.actionIconBox, { backgroundColor: '#F3E8FD' }]}>
                        <Ionicons name="storefront" size={24} color="#9334E6" />
                      </View>
                      <Text style={styles.actionLabel} numberOfLines={1} adjustsFontSizeToFit>Market</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
              {}
                <View style={styles.shortsSection}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>🎬 Farmer Shorts</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('FarmerShorts')}>
                      <Text style={styles.viewAllText}>View All</Text>
                    </TouchableOpacity>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shortsScroll} decelerationRate="fast" snapToInterval={155} snapToAlignment="start">
                    {videoProducts.map(product => (
                      <TouchableOpacity
                        key={`video-${product.productId}`}
                        style={styles.shortCard}
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate('FarmerShorts')}
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
                        <Text style={styles.shortTitle} numberOfLines={2}>@{product.farmerName || 'Farmer'}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              {}
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
      <Modal
        visible={isBlockedModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="warning" size={48} color="#EF4444" />
            </View>
            <Text style={styles.modalTitle}>Account Blocked</Text>
            <Text style={styles.modalMessage}>
              Your account has been blocked by the admin. You can no longer access the farmer dashboard or perform actions.
            </Text>
            
            <View style={styles.reasonContainer}>
              <Text style={styles.reasonLabel}>Reason for Block:</Text>
              <Text style={styles.reasonText}>{blockReason}</Text>
            </View>

            {blockedUntil && (
              <View style={[styles.reasonContainer, { marginTop: 4 }]}>
                <Text style={styles.reasonLabel}>Blocked Until:</Text>
                <Text style={styles.reasonText}>{blockedUntil}</Text>
              </View>
            )}

            <View style={{ width: '100%', gap: 8, marginTop: 16 }}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: '#2D983A', position: 'relative' }]} 
                onPress={() => {
                  setIsBlockedModalVisible(false);
                  navigation.navigate('FarmerSupportChatScreen');
                }}
              >
                <Ionicons name="notifications-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.modalButtonText}>Contact Admin</Text>
                {supportUnreadCount > 0 && (
                  <View style={{
                    marginLeft: 8,
                    backgroundColor: '#EF4444',
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 10,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' }}>
                      {supportUnreadCount > 99 ? '99+' : supportUnreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: '#EF4444' }]} 
                onPress={() => {
                  setIsBlockedModalVisible(false);
                  logout();
                }}
              >
                <Ionicons name="log-out-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.modalButtonText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  modalIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 4,
    borderColor: '#FEE2E2',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 13,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  reasonContainer: {
    backgroundColor: '#F3F4F6',
    width: '100%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  reasonLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  modalButton: {
    backgroundColor: '#EF4444',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
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
    paddingBottom: 35,
    zIndex: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
  searchIconCollapsed: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingRight: 16,
    paddingLeft: 4,
    height: 50,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  searchBoxBackBtn: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#E6F4EA',
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    height: '100%',
  },
  mainContentCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    marginTop: -15,
    zIndex: 20,
  },
  contentPadding: {
    paddingHorizontal: 20,
  },
  promoCardBg: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
    height: 140,
    backgroundColor: '#1E5631',
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
    marginBottom: 12,
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
    width: '16%',
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderBottomWidth: 3,
    width: 48,
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
    fontSize: 9,
    color: '#334155',
    fontWeight: '700',
    textAlign: 'center',
  },
  quickActionsSection: {
    marginBottom: 20,
    marginTop: -8,
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
    borderBottomWidth: 5,
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
    fontSize: 9,
    color: '#334155',
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 1,
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

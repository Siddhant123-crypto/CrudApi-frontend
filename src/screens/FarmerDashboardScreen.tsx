import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Modal,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { getAllProducts } from '../services/productService';
import { getFarmerOrders, getFarmerItemsStatus } from '../services/orderService';
import { getFarmerById } from '../services/farmerService';
import api, { BASE_URL } from '../services/api';

import { FARMER_THEME } from '../constants/farmerTheme';
import { FarmerHeader } from '../components/farmer/FarmerHeader';
import { FarmerHeroBanner } from '../components/farmer/FarmerHeroBanner';
import { FarmerSectionHeader } from '../components/farmer/FarmerSectionHeader';
import { FarmerCategoryTile } from '../components/farmer/FarmerCategoryTile';
import { QuickActionTile } from '../components/farmer/QuickActionTile';
import { FarmerShortCard } from '../components/farmer/FarmerShortCard';
import { FarmerEmptyOrders } from '../components/farmer/FarmerEmptyOrders';
import { FarmerOrderCard } from '../components/farmer/FarmerOrderCard';
import {
  PlusIcon,
  LeafIcon,
  ReceiptIcon,
  StoreIcon,
} from '../components/farmer/FarmerIcons';

const SAMPLE_CATEGORIES = [
  { name: 'Fruit' },
  { name: 'Dairy' },
  { name: 'Wild forest' },
  { name: 'Vegetable' },
  { name: 'Grains' },
  { name: 'Pulses' },
];

const SAMPLE_SHORTS = [
  { id: 'short-1', handle: '@larry wang', thumbnail: require('../../assets/vagis4.png') },
  { id: 'short-2', handle: '@janesha patil', thumbnail: require('../../assets/vagis5.png') },
  { id: 'short-3', handle: '@ramesh kumar', thumbnail: require('../../assets/vagis6.png') },
];

export const FarmerDashboardScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotification();
  const { user, logout } = useAuth();

  const [, setProducts] = useState<any[]>([]);
  const [allGlobalProducts, setAllGlobalProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [weatherRefreshTrigger, setWeatherRefreshTrigger] = useState(0);

  // Admin block modal state
  const [isBlockedModalVisible, setIsBlockedModalVisible] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [blockedUntil, setBlockedUntil] = useState<string | null>(null);
  const [supportUnreadCount, setSupportUnreadCount] = useState(0);

  // Categories state
  const [categories, setCategories] = useState<any[]>([]);

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

  const fetchData = async () => {
    try {
      const [allProducts, farmerOrders, farmerDetails] = await Promise.all([
        getAllProducts(),
        getFarmerOrders(),
        user?.farmerId ? getFarmerById(user.farmerId).catch(() => null) : Promise.resolve(null),
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

      setAllGlobalProducts(allProducts || []);
      const myProducts = (allProducts || []).filter((p: any) => p.farmerId === user?.farmerId);
      setProducts(myProducts);
      setOrders(farmerOrders || []);
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
    setWeatherRefreshTrigger((prev) => prev + 1);
    await fetchData();
    await fetchCategories();
    setRefreshing(false);
  }, []);

  const openCategory = (categoryName: string) => {
    navigation.navigate('FarmerCategoryDashboard', { category: categoryName });
  };

  const handleSearchSubmit = () => {
    if (searchText.trim()) {
      navigation.navigate('MyProducts', { searchQuery: searchText.trim() });
      setSearchText('');
    }
  };

  const videoProducts = allGlobalProducts.filter((p) => !!p.productVideo);
  const pendingOrders = orders.filter((o) => getFarmerItemsStatus(o.items || []) === 'PENDING');
  const displayCategories = categories.length > 0 ? categories : SAMPLE_CATEGORIES;

  return (
    <View style={styles.screenWrapper}>
      {/* Vertical Page Background LinearGradient */}
      <LinearGradient
        colors={FARMER_THEME.colors.pageBgGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 128 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[FARMER_THEME.colors.primaryGreen]}
            tintColor={FARMER_THEME.colors.primaryGreen}
          />
        }
      >
        {/* 1) HEADER (scrolls with content) */}
        <FarmerHeader
          farmName={user?.name || 'Larry Wang'}
          onMenuPress={() => navigation.navigate('FarmerMenu')}
          onLocationPress={() => navigation.navigate('Profile')}
          unreadCount={unreadCount}
          onNotificationPress={() => navigation.navigate('Notifications')}
          searchValue={searchText}
          onSearchChange={setSearchText}
          onSearchSubmit={handleSearchSubmit}
          searchLoading={loading}
          weatherRefreshTrigger={weatherRefreshTrigger}
        />

        {/* 2) CONTENT AREA */}
        <View style={styles.contentArea}>
          {/* 3) HERO BANNER */}
          <FarmerHeroBanner
            onAddProductPress={() => navigation.navigate('AddProduct')}
          />

          {/* 4) FARM CATEGORIES SECTION */}
          <FarmerSectionHeader title="Farm categories" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.bleedScroll}
            contentContainerStyle={styles.categoryContent}
          >
            {displayCategories.map((category: any, idx: number) => (
              <FarmerCategoryTile
                key={category.categoryId || category.name || idx}
                name={category.name}
                index={idx}
                iconUrl={category.iconUrl}
                onPress={() => openCategory(category.name)}
              />
            ))}
          </ScrollView>

          {/* 5) QUICK ACTIONS SECTION */}
          <FarmerSectionHeader title="Quick actions" />
          <View style={styles.quickActionsRow}>
            <QuickActionTile
              label="Add"
              boxBg="#DDF3E4"
              icon={<PlusIcon size={20} color="#17663F" strokeWidth={1.9} />}
              onPress={() => navigation.navigate('AddProduct')}
            />
            <QuickActionTile
              label="My product"
              boxBg="#E4F5D6"
              icon={<LeafIcon size={20} color="#2F7A3A" strokeWidth={1.9} />}
              onPress={() => navigation.navigate('MyProducts')}
            />
            <QuickActionTile
              label="Orders"
              boxBg="#FFF0CC"
              icon={<ReceiptIcon size={20} color="#C98A1B" strokeWidth={1.9} />}
              onPress={() => navigation.navigate('Orders')}
            />
            <QuickActionTile
              label="Market"
              boxBg="#D7F0EC"
              icon={<StoreIcon size={20} color="#1F7F78" strokeWidth={1.9} />}
              onPress={() => navigation.navigate('Market')}
            />
          </View>

          {/* 6) FARMER SHORTS SECTION */}
          <FarmerSectionHeader
            title="Farmer shorts"
            linkText="Watch all"
            onLinkPress={() => navigation.navigate('FarmerShorts')}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.bleedScroll}
            contentContainerStyle={styles.shortsContent}
          >
            {videoProducts.length > 0
              ? videoProducts.map((product, idx) => (
                  <FarmerShortCard
                    key={`video-${product.productId || idx}`}
                    id={product.productId}
                    handle={product.farmerName || user?.name || 'larry wang'}
                    thumbnailUrl={
                      product.productPhoto
                        ? `${BASE_URL}/product/image/${product.productPhoto}`
                        : null
                    }
                    index={idx}
                    onPress={() => navigation.navigate('FarmerShorts')}
                  />
                ))
              : SAMPLE_SHORTS.map((short, idx) => (
                  <FarmerShortCard
                    key={short.id}
                    handle={short.handle}
                    thumbnailUrl={short.thumbnail}
                    index={idx}
                    onPress={() => navigation.navigate('FarmerShorts')}
                  />
                ))}
          </ScrollView>

          {/* 7) RECENT ORDERS SECTION */}
          <FarmerSectionHeader
            title="Recent orders"
            linkText="View all"
            onLinkPress={() => navigation.navigate('Orders')}
          />
          {pendingOrders.length === 0 ? (
            <FarmerEmptyOrders />
          ) : (
            <View style={styles.ordersListContainer}>
              {pendingOrders.slice(0, 5).map((order) => {
                const fStatus = getFarmerItemsStatus(order.items || []);
                const mainItem = order.items && order.items.length > 0 ? order.items[0] : null;
                return (
                  <FarmerOrderCard
                    key={order.orderId}
                    orderId={order.orderId}
                    orderNumber={order.orderNumber}
                    customerName={order.customerName}
                    itemSummary={mainItem?.productName}
                    amount={order.totalAmount}
                    status={fStatus}
                    onPress={() =>
                      navigation.navigate('FarmerOrderDetails', {
                        orderId: order.orderId,
                        initialOrder: order,
                      })
                    }
                  />
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Admin Blocked Modal */}
      <Modal
        visible={isBlockedModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Glowing Shield / Warning Icon */}
            <View style={styles.modalGlowRing}>
              <LinearGradient
                colors={['#EF4444', '#B91C1C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalIconGradient}
              >
                <Ionicons name="shield-outline" size={26} color="#FFFFFF" />
              </LinearGradient>
            </View>

            {/* Micro Status Chip */}
            <View style={styles.modalStatusPill}>
              <Ionicons name="alert-circle" size={13} color="#DC2626" />
              <Text style={styles.modalStatusPillText}>RESTRICTED ACCESS</Text>
            </View>

            {/* Title & Message */}
            <Text style={styles.modalTitle}>Account Blocked</Text>
            <Text style={styles.modalMessage}>
              Your account access has been restricted by the administration. You can contact support to review and restore your access.
            </Text>

            {/* Notice Snapshot Box */}
            <View style={styles.blockSnapshotCard}>
              <View style={styles.snapshotRow}>
                <View style={styles.snapshotIconBox}>
                  <Ionicons name="document-text-outline" size={16} color="#17663F" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.snapshotLabel}>Reason for Block</Text>
                  <Text style={styles.snapshotValue}>{blockReason || 'Account suspended by administrator'}</Text>
                </View>
              </View>

              {blockedUntil ? (
                <>
                  <View style={styles.snapshotDivider} />
                  <View style={styles.snapshotRow}>
                    <View style={styles.snapshotIconBox}>
                      <Ionicons name="calendar-outline" size={16} color="#17663F" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.snapshotLabel}>Blocked Until</Text>
                      <Text style={styles.snapshotValue}>{blockedUntil}</Text>
                    </View>
                  </View>
                </>
              ) : null}
            </View>

            {/* Action Buttons */}
            <View style={styles.modalButtonStack}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.contactAdminBtn}
                onPress={() => {
                  setIsBlockedModalVisible(false);
                  navigation.navigate('FarmerSupportChatScreen');
                }}
              >
                <LinearGradient
                  colors={['#2FA66B', '#145238']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.btnGradient}
                >
                  <Ionicons name="chatbubbles-outline" size={19} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.btnText}>Contact Admin</Text>
                  {supportUnreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>
                        {supportUnreadCount > 99 ? '99+' : supportUnreadCount}
                      </Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.logoutBtn}
                onPress={() => {
                  setIsBlockedModalVisible(false);
                  logout();
                }}
              >
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.btnGradient}
                >
                  <Ionicons name="log-out-outline" size={19} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.btnText}>Log Out</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: FARMER_THEME.colors.pageBgTop,
  },
  scrollContent: {
    paddingBottom: 160, // ensures nothing hides behind the floating bottom nav
  },
  contentArea: {
    paddingHorizontal: 20,
  },
  bleedScroll: {
    marginHorizontal: -20,
  },
  categoryContent: {
    paddingHorizontal: 20,
    gap: 12,
    paddingTop: 2,
    paddingBottom: 6,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  shortsContent: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 4,
  },
  ordersListContainer: {
    marginTop: 2,
  },

  // Blocked modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 32, 26, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 22,
    width: '100%',
    maxWidth: 345,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#DCE8DF',
    ...Platform.select({
      ios: {
        shadowColor: '#0E3B29',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  modalGlowRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalIconGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  modalStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 999,
    gap: 5,
    marginBottom: 10,
  },
  modalStatusPillText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 10.5,
    color: '#B91C1C',
    letterSpacing: 0.5,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: FARMER_THEME.fonts.serif,
    color: FARMER_THEME.colors.headings,
    marginBottom: 6,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 13.5,
    fontFamily: FARMER_THEME.fonts.regular,
    color: FARMER_THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19.5,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  blockSnapshotCard: {
    width: '100%',
    backgroundColor: '#F5FBF7',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D3E5D8',
    padding: 13,
    marginBottom: 16,
  },
  snapshotRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  snapshotIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E6F4EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  snapshotLabel: {
    fontFamily: FARMER_THEME.fonts.medium,
    fontSize: 11,
    color: '#5C6B60',
    marginBottom: 2,
  },
  snapshotValue: {
    fontFamily: FARMER_THEME.fonts.semiBold,
    fontSize: 13.5,
    color: '#0E3B29',
  },
  snapshotDivider: {
    height: 1,
    backgroundColor: '#E2ECE5',
    marginVertical: 10,
  },
  modalButtonStack: {
    width: '100%',
    gap: 10,
  },
  contactAdminBtn: {
    width: '100%',
    height: 48,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#17663F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutBtn: {
    width: '100%',
    height: 48,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 3,
  },
  btnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  btnText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 14.5,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  unreadBadge: {
    marginLeft: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6.5,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: FARMER_THEME.fonts.bold,
  },
});

export default FarmerDashboardScreen;

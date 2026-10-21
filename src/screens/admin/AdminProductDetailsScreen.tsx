import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import api, { BASE_URL } from '../../services/api';
import { ADMIN_THEME, AdminFonts } from '../../constants/adminTheme';
import {
  AdminPageBackground,
  AdminHeader,
  AdminCard,
  AdminBadge,
  AdminEmptyState,
  ChatIcon,
  LeafIcon,
  UserIcon,
  TagIcon,
  CubeIcon,
  CalendarIcon,
  ClockIcon,
} from '../../components/admin';
import { formatAddedTime } from '../../utils/dateUtils';

export const AdminProductDetailsScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { productId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [buyersCount, setBuyersCount] = useState<number>(0);
  const [ordersCount, setOrdersCount] = useState<number>(0);

  useEffect(() => {
    if (productId) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [productId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productRes, ordersRes] = await Promise.all([
        api.get(`/admin/products/${productId}`),
        api.get('/admin/orders'),
      ]);
      if (productRes.data?.data) {
        setProduct(productRes.data.data);
      }
      if (ordersRes.data?.data) {
        const allOrders = ordersRes.data.data;
        let productOrders = 0;
        const uniqueCustomers = new Set<string>();
        allOrders.forEach((order: any) => {
          const hasProduct = order.items?.some((item: any) => item.productId === productId);
          if (hasProduct) {
            productOrders++;
            if (order.customerId) uniqueCustomers.add(order.customerId);
          }
        });
        setOrdersCount(productOrders);
        setBuyersCount(uniqueCustomers.size);
      }
    } catch (error) {
      console.error('Failed to fetch product details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProductImage = () => {
    if (product?.productPhoto) {
      if (product.productPhoto.startsWith('http')) {
        return product.productPhoto;
      }
      return `${BASE_URL}/product/image/${product.productPhoto}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(product?.productName || 'Product')}&background=F1F3FA&color=4F5BD5&size=200`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <AdminPageBackground>
        <AdminHeader variant="inner" title="Product Details" showBackButton={true} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={ADMIN_THEME.colors.indigo} />
        </View>
      </AdminPageBackground>
    );
  }

  if (!product) {
    return (
      <AdminPageBackground>
        <AdminHeader variant="inner" title="Product Details" showBackButton={true} />
        <AdminEmptyState
          icon={<CubeIcon size={40} color={ADMIN_THEME.colors.indigo} />}
          title="Product not found"
          subtitle="The requested product could not be located."
        />
      </AdminPageBackground>
    );
  }

  const statusMapped =
    product.status === 'APPROVED'
      ? 'Active'
      : product.status === 'REJECTED'
      ? 'Blocked'
      : product.status === 'PENDING'
      ? 'Pending'
      : product.status || 'Active';

  return (
    <AdminPageBackground>
      {/* 1) INNER ADMIN HEADER */}
      <AdminHeader variant="inner" title="Product Details" showBackButton={true} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 2) LARGE IMAGE SHOWCASE CARD (radial/pastel tile #FFFFFF -> #F1F3FA -> #E3E7F2) */}
        <AdminCard style={styles.showcaseCard}>
          <LinearGradient
            colors={['#FFFFFF', '#F1F3FA', '#E3E7F2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.largeImageTile}
          >
            {product.productPhoto ? (
              <Image source={{ uri: getProductImage() }} style={styles.productHeroImage} />
            ) : (
              <LeafIcon size={52} color={ADMIN_THEME.colors.indigo} />
            )}
          </LinearGradient>

          <Text style={styles.productTitle}>{product.productName}</Text>
          <Text style={styles.categoryBadge}>{product.category || 'General'}</Text>

          <View style={styles.badgeRow}>
            <AdminBadge status={statusMapped} size="medium" />
          </View>

          {/* Price in Fraunces 600 28 */}
          <View style={styles.priceContainer}>
            <Text style={styles.priceHeading}>
              {formatCurrency(product.price)}
            </Text>
            <Text style={styles.priceUnit}> / {product.unit || 'kg'}</Text>
          </View>
        </AdminCard>

        {/* 3) FULL INFORMATION IN ADMINCARD */}
        <AdminCard style={styles.infoCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Full Information</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.chatButton}
              onPress={() =>
                navigation.navigate('AdminMessage', {
                  preSelectedUserId: product.farmerUserId,
                  preSelectedUserName: product.farmerName,
                  preSelectedRole: 'FARMER',
                })
              }
            >
              <ChatIcon size={20} color={ADMIN_THEME.colors.indigo} />
            </TouchableOpacity>
          </View>

          {/* Farmer Name */}
          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <UserIcon size={18} color={ADMIN_THEME.colors.indigo} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Farmer Name</Text>
              <Text style={styles.infoValue}>{product.farmerName || 'N/A'}</Text>
            </View>
          </View>

          {/* Price Details */}
          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <TagIcon size={18} color={ADMIN_THEME.colors.indigo} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Price Details</Text>
              <Text style={styles.infoValue}>
                {formatCurrency(product.price)} / {product.unit || 'kg'}
              </Text>
            </View>
          </View>

          {/* Available Stock */}
          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <CubeIcon size={18} color={ADMIN_THEME.colors.indigo} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Available Stock</Text>
              <Text style={styles.infoValue}>
                {product.quantity || 0} {product.unit || 'kg'}
              </Text>
            </View>
          </View>

          {/* Harvest Date */}
          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <CalendarIcon size={18} color={ADMIN_THEME.colors.indigo} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Harvest Date</Text>
              <Text style={styles.infoValue}>
                {product.harvestDate
                  ? new Date(product.harvestDate).toLocaleDateString()
                  : 'N/A'}
              </Text>
            </View>
          </View>

          {/* Added Time */}
          {formatAddedTime(product.createdOn, product.addedTime) ? (
            <View style={styles.infoRow}>
              <View style={styles.iconCircle}>
                <ClockIcon size={18} color={ADMIN_THEME.colors.indigo} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Added</Text>
                <Text style={styles.infoValue}>
                  {formatAddedTime(product.createdOn, product.addedTime)}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Description */}
          <View style={[styles.infoRow, { alignItems: 'flex-start' }]}>
            <View style={[styles.iconCircle, { marginTop: 2 }]}>
              <LeafIcon size={18} color={ADMIN_THEME.colors.indigo} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Description</Text>
              <Text style={styles.descriptionValue}>
                {product.description || 'No description provided for this product.'}
              </Text>
            </View>
          </View>
        </AdminCard>

        {/* 4) PRODUCT ACTIVITY STATS */}
        <AdminCard style={styles.activityCard}>
          <Text style={styles.sectionTitle}>Product Activity</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{buyersCount}</Text>
              <Text style={styles.statLabel}>Total Buyers</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{ordersCount}</Text>
              <Text style={styles.statLabel}>Total Orders</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {product.averageRating?.toFixed(1) || '0.0'}
              </Text>
              <Text style={styles.statLabel}>Avg Rating</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{product.reviewCount || 0}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>
        </AdminCard>
      </ScrollView>
    </AdminPageBackground>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },
  showcaseCard: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  largeImageTile: {
    width: 140,
    height: 140,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E3E7F2',
    marginBottom: 14,
  },
  productHeroImage: {
    width: '100%',
    height: '100%',
  },
  productTitle: {
    fontSize: 20,
    fontFamily: AdminFonts.bold,
    color: ADMIN_THEME.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryBadge: {
    fontSize: 12,
    fontFamily: AdminFonts.semiBold,
    color: ADMIN_THEME.colors.indigo,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  badgeRow: {
    marginBottom: 14,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginTop: 2,
  },
  priceHeading: {
    fontFamily: AdminFonts.heading,
    fontSize: 28,
    color: ADMIN_THEME.colors.textPrimary,
  },
  priceUnit: {
    fontFamily: AdminFonts.medium,
    fontSize: 15,
    color: ADMIN_THEME.colors.textMuted,
  },
  infoCard: {
    padding: 16,
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: ADMIN_THEME.colors.divider,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: AdminFonts.bold,
    color: ADMIN_THEME.colors.textPrimary,
  },
  chatButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ADMIN_THEME.colors.indigoPastel,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#F8F9FD',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDF0F8',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ADMIN_THEME.colors.indigoPastel,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: AdminFonts.medium,
    color: ADMIN_THEME.colors.textMuted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: AdminFonts.semiBold,
    color: ADMIN_THEME.colors.textPrimary,
  },
  descriptionValue: {
    fontSize: 13.5,
    fontFamily: AdminFonts.regular,
    color: ADMIN_THEME.colors.textSecondary,
    lineHeight: 20,
  },
  activityCard: {
    padding: 16,
    marginBottom: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  statBox: {
    width: '48%',
    backgroundColor: '#0E1726',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontFamily: AdminFonts.heading,
    color: ADMIN_THEME.colors.gold,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: AdminFonts.medium,
    color: '#D4DCF0',
    textAlign: 'center',
  },
});

export default AdminProductDetailsScreen;

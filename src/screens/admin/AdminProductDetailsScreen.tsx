import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api, { BASE_URL } from '../../services/api';
import { StatusBadge } from '../../components/admin/StatusBadge';
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
        api.get(`/admin/orders`)
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
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(product?.productName || 'Product')}&background=F5C16C&color=17212F&size=150&bold=true`;
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
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#F5C16C" />
      </View>
    );
  }
  if (!product) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product Details</Text>
        </View>
        <Text style={styles.emptyText}>Product not found.</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {}
        <View style={styles.profileSection}>
          <View style={styles.imageContainer}>
            {product.productPhoto ? (
               <Image source={{ uri: getProductImage() }} style={styles.productImage} />
            ) : (
               <View style={styles.imagePlaceholder}>
                 <Ionicons name="leaf" size={48} color="#F5C16C" />
               </View>
            )}
          </View>
          <Text style={styles.productName}>{product.productName}</Text>
          <Text style={styles.categoryName}>{product.category || 'General'}</Text>
          <View style={styles.statusBadgeContainer}>
            <StatusBadge status={product.status === 'APPROVED' ? 'Active' : (product.status === 'REJECTED' ? 'Blocked' : (product.status === 'PENDING' ? 'Pending' : product.status))} />
          </View>
        </View>
        {}
        <View style={styles.section3D}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Full Information</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AdminMessage', { 
              preSelectedUserId: product.farmerUserId, 
              preSelectedUserName: product.farmerName,
              preSelectedRole: 'FARMER'
            })}>
              <Ionicons name="chatbubbles" size={26} color="#7C3AED" />
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="person-circle-outline" size={22} color="#F5C16C" style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Farmer Name</Text>
              <Text style={styles.infoValue}>{product.farmerName || 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="pricetag-outline" size={22} color="#F5C16C" style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Price Details</Text>
              <Text style={styles.infoValue}>{formatCurrency(product.price)} / {product.unit || 'kg'}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="cube-outline" size={22} color="#F5C16C" style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Available Stock</Text>
              <Text style={styles.infoValue}>{product.quantity || 0} {product.unit || 'kg'}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={22} color="#F5C16C" style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Harvest Date</Text>
              <Text style={styles.infoValue}>{product.harvestDate ? new Date(product.harvestDate).toLocaleDateString() : 'N/A'}</Text>
            </View>
          </View>
          <View style={[styles.infoRow, { alignItems: 'flex-start' }]}>
            <Ionicons name="document-text-outline" size={22} color="#F5C16C" style={[styles.infoIcon, { marginTop: 2 }]} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Description</Text>
              <Text style={[styles.infoValue, { fontSize: 15, lineHeight: 22, fontWeight: '500' }]}>
                {product.description || 'No description provided for this product.'}
              </Text>
            </View>
          </View>
        </View>
        {}
        <View style={styles.section3D}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Product Activity</Text>
          </View>
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
              <Text style={styles.statValue}>{product.averageRating?.toFixed(1) || '0.0'}</Text>
              <Text style={styles.statLabel}>Avg Rating</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{product.reviewCount || 0}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 16,
    backgroundColor: '#17212F',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    marginBottom: 16,
    zIndex: 10,
  },
  backButton: { marginRight: 16, padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', letterSpacing: 0.5 },
  scrollContent: { paddingBottom: 40 },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  imageContainer: {
    width: 90, height: 90, borderRadius: 16,
    backgroundColor: '#F5C16C',
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 3, borderColor: '#17212F',
    shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8,
  },
  productImage: { width: '100%', height: '100%' },
  imagePlaceholder: { width: '100%', height: '100%', backgroundColor: '#17212F', justifyContent: 'center', alignItems: 'center' },
  productName: { fontSize: 18, fontWeight: 'bold', color: '#1B2430', marginBottom: 4, textAlign: 'center', paddingHorizontal: 10 },
  categoryName: { fontSize: 12, color: '#4B5563', marginBottom: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  statusBadgeContainer: { flexDirection: 'row', justifyContent: 'center' },
  section3D: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#17212F' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, backgroundColor: '#F9FAFB', padding: 10, borderRadius: 10 },
  infoIcon: { marginRight: 12 },
  infoTextContainer: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#6B7280', marginBottom: 2, fontWeight: '600' },
  infoValue: { fontSize: 14, color: '#111827', fontWeight: 'bold' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statBox: {
    width: '47%', backgroundColor: '#17212F',
    padding: 12, borderRadius: 12, marginBottom: 12,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 6,
  },
  statValue: { fontSize: 18, fontWeight: '900', color: '#F5C16C', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#E5E7EB', fontWeight: '600', textAlign: 'center' },
  emptyText: { textAlign: 'center', color: '#6B7280', marginTop: 40, fontSize: 18, fontWeight: '500' },
});
export default AdminProductDetailsScreen;

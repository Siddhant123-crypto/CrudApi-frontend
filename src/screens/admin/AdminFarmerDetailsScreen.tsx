import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, TouchableOpacity, FlatList, Platform } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api, { BASE_URL } from '../../services/api';
import { StatusBadge } from '../../components/admin/StatusBadge';
export const AdminFarmerDetailsScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { farmerId } = route.params;
  const [loading, setLoading] = useState(true);
  const [farmer, setFarmer] = useState<any>(null);
  const [sales, setSales] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  useEffect(() => {
    fetchFarmerData();
  }, [farmerId]);
  const fetchFarmerData = async () => {
    try {
      setLoading(true);
      const [farmerRes, salesRes, productsRes, ordersRes] = await Promise.all([
        api.get(`/admin/farmers/${farmerId}`),
        api.get(`/admin/farmers/${farmerId}/sales`),
        api.get(`/admin/products/farmer/${farmerId}`),
        api.get(`/admin/orders/farmer/${farmerId}`)
      ]);
      if (farmerRes.data?.data) setFarmer(farmerRes.data.data);
      if (salesRes.data?.data) setSales(salesRes.data.data);
      if (productsRes.data?.data) setProducts(productsRes.data.data);
      if (ordersRes.data?.data) setOrders(ordersRes.data.data);
    } catch (error) {
      console.error('Failed to fetch farmer details:', error);
    } finally {
      setLoading(false);
    }
  };
  const getProfileImage = () => {
    if (farmer?.profilePhoto) {
      if (farmer.profilePhoto.startsWith('http')) {
        return farmer.profilePhoto;
      }
      return `${BASE_URL}/user/image/${farmer.profilePhoto}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(farmer?.name || 'Unknown')}&background=F5C16C&color=17212F&size=150&bold=true`;
  };
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#F5C16C" />
      </View>
    );
  }
  if (!farmer) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Farmer Details</Text>
        </View>
        <Text style={styles.emptyText}>Farmer not found.</Text>
      </View>
    );
  }
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };
  const getProductImage = (item: any) => {
    if (item.productPhoto) {
      if (item.productPhoto.startsWith('http')) {
        return item.productPhoto;
      }
      return `${BASE_URL}/product/image/${item.productPhoto}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(item.productName || 'Product')}&background=E5E7EB&color=6B7280`;
  };
  const renderProductItem = ({ item }: { item: any }) => (
    <View style={styles.productCard}>
      <Image
        source={{ uri: getProductImage(item) }}
        style={styles.productImage}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.productName}</Text>
        <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
      </View>
    </View>
  );
  const renderOrderItem = ({ item }: { item: any }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Order #{item.orderId?.substring(0, 8)}</Text>
        <Text style={[styles.orderStatus, { color: item.orderStatus === 'DELIVERED' ? '#2D983A' : '#F5C16C' }]}>
          {item.orderStatus}
        </Text>
      </View>
      <Text style={styles.customerName}>Customer: {item.customerName || 'Unknown'}</Text>
      <Text style={styles.orderAmount}>Total: {formatCurrency(item.totalAmount)}</Text>
      <Text style={styles.orderDate}>{new Date(item.orderDate).toLocaleDateString()}</Text>
    </View>
  );
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Farmer Details</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: getProfileImage() }} style={styles.profileImage} />
          </View>
          <Text style={styles.farmerName}>{farmer.name}</Text>
          <Text style={styles.farmerEmail}>{farmer.email}</Text>
          <View style={styles.statusBadgeContainer}>
            <StatusBadge status={farmer.status === 'ACTIVE' ? 'Active' : (farmer.status === 'PENDING' ? 'Pending' : (farmer.status === 'INACTIVE' ? 'Blocked' : 'Inactive'))} />
          </View>
        </View>
        {}
        <View style={styles.section3D}>
          <Text style={styles.sectionTitle}>Full Information</Text>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={22} color="#F5C16C" style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{farmer.name || 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={22} color="#F5C16C" style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{farmer.email || 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={22} color="#F5C16C" style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Mobile No.</Text>
              <Text style={styles.infoValue}>{farmer.mobile || 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={22} color="#F5C16C" style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{farmer.address || 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="map-outline" size={22} color="#F5C16C" style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>State & Village</Text>
              <Text style={styles.infoValue}>{farmer.state || 'N/A'}, {farmer.village || 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="navigate-circle-outline" size={22} color="#F5C16C" style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Postal Code</Text>
              <Text style={styles.infoValue}>{farmer.postalCode || 'N/A'}</Text>
            </View>
          </View>
        </View>
        {}
        <View style={styles.section3D}>
          <Text style={styles.sectionTitle}>Sales Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{products.length}</Text>
              <Text style={styles.statLabel}>Total Products</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{sales?.totalProductsSold || 0}</Text>
              <Text style={styles.statLabel}>Products Sold</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{sales?.totalOrders || 0}</Text>
              <Text style={styles.statLabel}>Total Orders</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{formatCurrency(sales?.totalRevenue || 0)}</Text>
              <Text style={styles.statLabel}>Revenue</Text>
            </View>
          </View>
        </View>
        {}
        <View style={styles.section3D}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Products Catalog</Text>
          </View>
          {products.length > 0 ? (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={products}
              keyExtractor={(item) => item.productId}
              renderItem={renderProductItem}
              contentContainerStyle={{ paddingVertical: 8 }}
            />
          ) : (
            <Text style={styles.emptyTextSmall}>No products listed by this farmer.</Text>
          )}
        </View>
        {}
        <View style={styles.section3D}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
          </View>
          {orders.length > 0 ? (
            orders.slice(0, 5).map((order) => (
              <React.Fragment key={order.orderId}>
                {renderOrderItem({ item: order })}
              </React.Fragment>
            ))
          ) : (
            <Text style={styles.emptyTextSmall}>No orders yet.</Text>
          )}
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
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', letterSpacing: 0.5 },
  scrollContent: { paddingBottom: 40 },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  avatarContainer: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: '#F5C16C',
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 4, borderColor: '#17212F',
    shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8,
  },
  profileImage: { width: '100%', height: '100%' },
  farmerName: { fontSize: 26, fontWeight: 'bold', color: '#1B2430', marginBottom: 6 },
  farmerEmail: { fontSize: 16, color: '#4B5563', marginBottom: 16, fontWeight: '500' },
  statusBadgeContainer: { flexDirection: 'row', justifyContent: 'center' },
  section3D: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#17212F', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12 },
  infoIcon: { marginRight: 16 },
  infoTextContainer: { flex: 1 },
  infoLabel: { fontSize: 14, color: '#6B7280', marginBottom: 4, fontWeight: '600' },
  infoValue: { fontSize: 17, color: '#111827', fontWeight: 'bold' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statBox: {
    width: '47%', backgroundColor: '#17212F',
    padding: 20, borderRadius: 16, marginBottom: 16,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 6,
  },
  statValue: { fontSize: 24, fontWeight: '900', color: '#F5C16C', marginBottom: 8 },
  statLabel: { fontSize: 14, color: '#E5E7EB', fontWeight: '600', textAlign: 'center' },
  productCard: {
    width: 140, backgroundColor: '#FFFFFF',
    borderRadius: 16, marginRight: 16,
    borderWidth: 1, borderColor: '#F3F4F6',
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 4,
  },
  productImage: { width: '100%', height: 120 },
  productInfo: { padding: 12 },
  productName: { fontSize: 15, fontWeight: 'bold', color: '#1B2430', marginBottom: 6 },
  productPrice: { fontSize: 15, color: '#2D983A', fontWeight: '800' },
  orderCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderId: { fontSize: 16, fontWeight: 'bold', color: '#17212F' },
  orderStatus: { fontSize: 14, fontWeight: 'bold' },
  customerName: { fontSize: 15, color: '#4B5563', marginBottom: 6, fontWeight: '500' },
  orderAmount: { fontSize: 16, fontWeight: '800', color: '#1B2430', marginBottom: 4 },
  orderDate: { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },
  emptyText: { textAlign: 'center', color: '#6B7280', marginTop: 40, fontSize: 18, fontWeight: '500' },
  emptyTextSmall: { textAlign: 'center', color: '#9CA3AF', marginVertical: 16, fontSize: 15, fontStyle: 'italic' },
});
export default AdminFarmerDetailsScreen;

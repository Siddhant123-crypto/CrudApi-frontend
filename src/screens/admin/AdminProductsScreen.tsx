import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Image, ActivityIndicator } from 'react-native';
import { AdminHeader } from '../../components/admin/AdminHeader';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { useNavigation } from '@react-navigation/native';
import api, { BASE_URL } from '../../services/api';

export const AdminProductsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();

  const tabs = ['All', 'APPROVED', 'PENDING', 'REJECTED'];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/products');
      if (res.data && res.data.data) {
        setProducts(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    if (activeTab !== 'All' && p.status !== activeTab) return false;
    if (searchQuery && !p.productName?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getProductImage = (item: any) => {
    if (item.productPhoto) {
      if (item.productPhoto.startsWith('http')) {
        return item.productPhoto;
      }
      return `${BASE_URL}/product/image/${item.productPhoto}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(item.productName || 'Product')}&background=F3F4F6&color=6B7280`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.productCard} onPress={() => navigation.navigate('AdminProductDetails', { productId: item.productId })}>
      {item.productPhoto ? (
        <Image source={{ uri: getProductImage(item) }} style={styles.productImage} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="leaf" size={24} color="#F5C16C" />
        </View>
      )}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.productName}>{item.productName}</Text>
          <StatusBadge status={item.status === 'APPROVED' ? 'Active' : (item.status === 'REJECTED' ? 'Blocked' : (item.status === 'PENDING' ? 'Pending' : item.status))} />
        </View>
        <Text style={styles.farmerName}>{item.farmerName || 'Unknown Farmer'}</Text>
        <Text style={styles.price}>{formatCurrency(item.price)} / {item.unit || 'unit'}</Text>
        <Text style={styles.stock}>Stock: {item.quantity || 0} {item.unit || 'units'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <AdminHeader />
      
      <View style={styles.headerArea}>
        <Text style={styles.screenTitle}>Products</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.tabsContainer}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'All' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#17212F" />
        </View>
      ) : filteredProducts.length > 0 ? (
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item.productId?.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No products found.</Text>
        </View>
      )}

      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={24} color="#17212F" />
        <Text style={styles.fabText}>Add Product</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F1E6' },
  headerArea: { padding: 16, paddingBottom: 8 },
  screenTitle: { fontSize: 24, fontWeight: 'bold', color: '#1B2430', marginBottom: 16 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 12, height: 44,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#1B2430' },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16 },
  tabButton: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 16, marginRight: 8, backgroundColor: '#FFFFFF' },
  activeTabButton: { backgroundColor: '#17212F' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  activeTabText: { color: '#F5C16C' },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  productCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  imagePlaceholder: {
    width: 60, height: 60, borderRadius: 12, backgroundColor: '#17212F',
    justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  productImage: {
    width: 60, height: 60, borderRadius: 12, marginRight: 16,
    borderWidth: 1, borderColor: '#F3F4F6'
  },
  cardContent: { flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  productName: { fontSize: 16, fontWeight: 'bold', color: '#1B2430', flex: 1, marginRight: 8 },
  farmerName: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  price: { fontSize: 14, fontWeight: '700', color: '#17212F', marginBottom: 2 },
  stock: { fontSize: 12, color: '#9CA3AF' },
  fab: {
    position: 'absolute', bottom: 30, right: 16, left: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#F5C16C', borderRadius: 12, paddingVertical: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  fabText: { fontSize: 14, fontWeight: 'bold', color: '#17212F', marginLeft: 8 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#6B7280', fontSize: 16 },
});

export default AdminProductsScreen;

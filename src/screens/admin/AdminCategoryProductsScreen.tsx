import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Image, ActivityIndicator, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { useNavigation, useRoute } from '@react-navigation/native';
import api, { BASE_URL } from '../../services/api';
export const AdminCategoryProductsScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { category } = route.params || { category: 'Products' };
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchCategoryProducts();
  }, [category]);
  const fetchCategoryProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/products/filter?category=${encodeURIComponent(category)}`);
      if (res.data && res.data.data) {
        setProducts(res.data.data);
      }
    } catch (error) {
      console.error(`Failed to fetch products for category ${category}:`, error);
    } finally {
      setLoading(false);
    }
  };const filteredProducts = products.filter(p => {
    if (searchQuery && !p.productName?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });const getProductImage = (item: any) => {
    if (item.productPhoto) {
      if (item.productPhoto.startsWith('http')) {
        return item.productPhoto;
      }return `${BASE_URL}/product/image/${item.productPhoto}`;
    }return `https://ui-avatars.com/api/?name=${encodeURIComponent(item.productName || 'Product')}&background=F3F4F6&color=6B7280`;
  };const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.productCard} onPress={() => navigation.navigate('AdminProductDetails', { productId: item.productId })}>
      {item.productPhoto ? (<Image source={{ uri: getProductImage(item) }} style={styles.productImage} />
      ) : (<View style={styles.imagePlaceholder}>
          <Ionicons name="leaf" size={24} color="#F5C16C" />
        </View>
      )}<View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.productName} numberOfLines={1}>{item.productName}</Text>
          <StatusBadge status={item.status === 'APPROVED' ? 'Active' : (item.status === 'REJECTED' ? 'Blocked' : (item.status === 'PENDING' ? 'Pending' : item.status))} />
        </View>
        <Text style={styles.farmerName}>{item.farmerName || 'Unknown Farmer'}</Text>
        <Text style={styles.price}>{formatCurrency(item.price)} / {item.unit || 'unit'}</Text>
        <Text style={styles.stock}>Stock: {item.quantity || 0} {item.unit || 'units'}</Text>
      </View>
    </TouchableOpacity>
  );return (
    <View style={styles.container}>
      {}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{category}</Text>
      </View>
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search in ${category}...`}
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
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
          <Text style={styles.emptyText}>No products found in {category}.</Text>
        </View>
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F1E6' },
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
  },backButton: { marginRight: 16, padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', letterSpacing: 0.5 },
  searchSection: { paddingHorizontal: 16, marginBottom: 16 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 12, height: 44,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#1B2430' },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  productCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },imagePlaceholder: {
    width: 60, height: 60, borderRadius: 12, backgroundColor: '#17212F',
    justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },productImage: {
    width: 60, height: 60, borderRadius: 12, marginRight: 16,
    borderWidth: 1, borderColor: '#F3F4F6'
  },cardContent: { flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  productName: { fontSize: 16, fontWeight: 'bold', color: '#1B2430', flex: 1, marginRight: 8 },
  farmerName: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  price: { fontSize: 14, fontWeight: '700', color: '#17212F', marginBottom: 2 },
  stock: { fontSize: 12, color: '#9CA3AF' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { color: '#6B7280', fontSize: 16, textAlign: 'center' },
});export default AdminCategoryProductsScreen;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import api, { BASE_URL } from '../../services/api';
import { ADMIN_THEME, AdminFonts } from '../../constants/adminTheme';
import {
  AdminPageBackground,
  AdminHeader,
  AdminChip,
  AdminBadge,
  AdminEmptyState,
  AdminListSkeleton,
  LeafIcon,
  CubeIcon,
} from '../../components/admin';

export const AdminProductsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();
  const tabs = ['All', 'Active', 'Inactive'];

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
    if (activeTab === 'All' && p.isActive !== true) return false;
    if (activeTab === 'Active' && p.isActive !== true) return false;
    if (activeTab === 'Inactive' && p.isActive !== false) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchProduct = p.productName?.toLowerCase().includes(q);
      const matchFarmer = p.farmerName?.toLowerCase().includes(q);
      if (!matchProduct && !matchFarmer) return false;
    }
    return true;
  });

  const getProductImage = (item: any) => {
    if (item.productPhoto) {
      if (item.productPhoto.startsWith('http')) {
        return item.productPhoto;
      }
      return `${BASE_URL}/product/image/${item.productPhoto}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(item.productName || 'Product')}&background=F1F3FA&color=4F5BD5`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.productCard}
      onPress={() => navigation.navigate('AdminProductDetails', { productId: item.productId })}
    >
      {/* Pastel Image Tile: #FFFFFF -> #F1F3FA -> #E3E7F2 */}
      <LinearGradient
        colors={['#FFFFFF', '#F1F3FA', '#E3E7F2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.imageTile}
      >
        {item.productPhoto ? (
          <Image source={{ uri: getProductImage(item) }} style={styles.productImage} />
        ) : (
          <LeafIcon size={26} color={ADMIN_THEME.colors.indigo} />
        )}
      </LinearGradient>

      {/* Content */}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.productName} numberOfLines={1}>
            {item.productName}
          </Text>
          <AdminBadge status={item.isActive ? 'Active' : 'Inactive'} size="small" />
        </View>

        <Text style={styles.farmerName} numberOfLines={1}>
          {item.farmerName || 'Unknown Farmer'}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>
            {formatCurrency(item.price)}{' '}
            <Text style={styles.unitText}>/ {item.unit || 'unit'}</Text>
          </Text>
          <Text style={styles.stock}>
            Stock: {item.quantity || 0} {item.unit || 'units'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <AdminPageBackground>
      {/* 1) TAB ADMIN HEADER WITH SEARCH */}
      <AdminHeader
        variant="tab"
        title="Products"
        subtitle="All products & inventory"
        showBackButton={true}
        showSearch={true}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by product or farmer..."
      />

      {/* 2) CHIP CATEGORY / STATUS FILTERS */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {tabs.map(tab => (
            <AdminChip
              key={tab}
              label={tab === 'All' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
              active={activeTab === tab}
              onPress={() => setActiveTab(tab)}
            />
          ))}
        </ScrollView>
      </View>

      {/* 3) PRODUCT LIST */}
      {loading ? (
        <AdminListSkeleton rows={5} />
      ) : filteredProducts.length > 0 ? (
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item.productId?.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <AdminEmptyState
          icon={<CubeIcon size={36} color={ADMIN_THEME.colors.indigo} />}
          title="No products found"
          subtitle="No products matched your search or status filter."
        />
      )}
    </AdminPageBackground>
  );
};

const styles = StyleSheet.create({
  filterSection: {
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 130, // Required: floating tab bar clearance
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ADMIN_THEME.colors.cardBg,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: ADMIN_THEME.colors.cardBorder,
    shadowColor: ADMIN_THEME.shadows.card.shadowColor,
    shadowOffset: ADMIN_THEME.shadows.card.shadowOffset,
    shadowOpacity: ADMIN_THEME.shadows.card.shadowOpacity,
    shadowRadius: ADMIN_THEME.shadows.card.shadowRadius,
    elevation: ADMIN_THEME.shadows.card.elevation,
  },
  imageTile: {
    width: 62,
    height: 62,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E3E7F2',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  productName: {
    flex: 1,
    fontSize: 14.5,
    fontFamily: AdminFonts.bold,
    color: ADMIN_THEME.colors.textPrimary,
    marginRight: 8,
  },
  farmerName: {
    fontSize: 12.5,
    fontFamily: AdminFonts.regular,
    color: '#5B6580',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 15.5,
    fontFamily: AdminFonts.bold,
    color: ADMIN_THEME.colors.textPrimary,
  },
  unitText: {
    fontSize: 12,
    fontFamily: AdminFonts.medium,
    color: ADMIN_THEME.colors.textMuted,
  },
  stock: {
    fontSize: 12,
    fontFamily: AdminFonts.medium,
    color: ADMIN_THEME.colors.textMuted,
  },
});

export default AdminProductsScreen;

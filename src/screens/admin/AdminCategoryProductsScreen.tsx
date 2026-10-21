import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import api, { BASE_URL } from '../../services/api';
import { ADMIN_THEME, AdminFonts } from '../../constants/adminTheme';
import {
  AdminPageBackground,
  AdminHeader,
  AdminBadge,
  AdminEmptyState,
  AdminListSkeleton,
  SearchIcon,
  LeafIcon,
  CubeIcon,
} from '../../components/admin';

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
      const res = await api.get(
        `/admin/products/filter?category=${encodeURIComponent(category)}`
      );
      if (res.data && res.data.data) {
        setProducts(res.data.data);
      }
    } catch (error) {
      console.error(`Failed to fetch products for category ${category}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    if (searchQuery && !p.productName?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
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
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      item.productName || 'Product'
    )}&background=F1F3FA&color=4F5BD5`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const renderItem = ({ item }: { item: any }) => {
    const statusText =
      item.status === 'APPROVED'
        ? 'Active'
        : item.status === 'REJECTED'
        ? 'Blocked'
        : item.status === 'PENDING'
        ? 'Pending'
        : item.status || (item.isActive ? 'Active' : 'Inactive');

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.productCard}
        onPress={() =>
          navigation.navigate('AdminProductDetails', { productId: item.productId })
        }
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
            <AdminBadge status={statusText} size="small" />
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
  };

  return (
    <AdminPageBackground>
      {/* 1) INNER ADMIN HEADER */}
      <AdminHeader variant="inner" title={category} showBackButton={true} />

      {/* 2) THEMED SEARCH BAR */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <SearchIcon size={18} color={ADMIN_THEME.colors.indigo} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search in ${category}...`}
            placeholderTextColor={ADMIN_THEME.colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
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
          subtitle={`No products found in ${category}.`}
        />
      )}
    </AdminPageBackground>
  );
};

const styles = StyleSheet.create({
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: ADMIN_THEME.colors.cardBorder,
    shadowColor: ADMIN_THEME.shadows.card.shadowColor,
    shadowOffset: ADMIN_THEME.shadows.card.shadowOffset,
    shadowOpacity: ADMIN_THEME.shadows.card.shadowOpacity,
    shadowRadius: ADMIN_THEME.shadows.card.shadowRadius,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontFamily: AdminFonts.regular,
    color: ADMIN_THEME.colors.textPrimary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
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

export default AdminCategoryProductsScreen;

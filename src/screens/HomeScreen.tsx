import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import FilterModal, { FilterCriteria } from '../components/FilterModal';
import {useAuth} from '../context/AuthContext';
import {getAllProducts, searchProducts} from '../services/productService';

const HomeScreen = ({navigation}: any) => {
  const {user, logout} = useAuth();
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<any>(null);
  const [activeFilters, setActiveFilters] = useState<FilterCriteria | null>(null);

  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState<'State' | 'Village' | 'Category' | 'Price'>('State');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await getAllProducts();
      setAllProducts(data);
      applyFiltersAndSearch(data, searchQuery, activeFilters);
    } catch (error) {
      console.log('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSearch = (dataList: any[], searchStr: string, filters: FilterCriteria | null) => {
    let result = dataList;

    // Apply search locally if dataList is allProducts and we have a searchStr
    // Actually, backend search is better. We assume dataList already has search applied if searchStr is present.
    // Wait, let's just filter the passed dataList.

    if (filters) {
      if (filters.state && filters.state.trim().length > 0) {
        result = result.filter(p => {
          const st = p.farmerState || p.farmerAddress || '';
          return st.toLowerCase().includes(filters.state.trim().toLowerCase());
        });
      }
      if (filters.village && filters.village.trim().length > 0) {
        result = result.filter(p => {
          const vil = p.farmerVillage || p.farmerAddress || '';
          return vil.toLowerCase().includes(filters.village.trim().toLowerCase());
        });
      }
      if (filters.categories && filters.categories.length > 0) {
        const lowerSelectedCats = filters.categories.map(c => c.toLowerCase());
        result = result.filter(p => lowerSelectedCats.includes((p.category || '').toLowerCase()));
      }
      result = result.filter(p => {
        const price = Number(p.price) || 0;
        // Don't filter by minPrice if it's the default 10 and they didn't explicitly select price?
        // Let's just strictly filter by the range. If they have a product < 10, it's filtered out.
        // Let's use 0 as the absolute minimum to be safe if max is untouched.
        const minP = filters.minPrice || 0;
        if (price < minP) return false;
        if (filters.maxPrice < 500 && price > filters.maxPrice) return false;
        return true;
      });
    }

    setProducts(result);
  };

  const executeSearchAndFilter = async (text: string, currentFilters: FilterCriteria | null) => {
    try {
      let baseData = allProducts;
      if (text.trim().length > 0) {
        baseData = await searchProducts(text.trim());
      }
      applyFiltersAndSearch(baseData, text, currentFilters);
    } catch (error) {
      console.log('Search/Filter error:', error);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);

    if (searchTimeout) clearTimeout(searchTimeout);

    const timeout = setTimeout(() => {
      executeSearchAndFilter(text, activeFilters);
    }, 500);

    setSearchTimeout(timeout);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setSearchQuery('');
    setActiveFilters(null); // Clear filters on refresh
    await fetchProducts();
    setRefreshing(false);
  }, []);

  const renderProduct = ({item, index}: any) => (
    <View style={[styles.cardWrapper, index % 2 === 0 ? {marginRight: 6} : {marginLeft: 6}]}>
      <ProductCard
        product={item}
        onPress={() => navigation.navigate('ProductDetail', {product: item})}
      />
    </View>
  );

  if (loading) {
    return <LoadingSpinner message="Loading products..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Alert.alert(
              'Exit Dashboard',
              'Are you sure you want to go back to the role selection screen?',
              [
                {text: 'Cancel', style: 'cancel'},
                {text: 'Yes', onPress: () => logout()},
              ]
            );
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name || 'User'} </Text>
          <Text style={styles.subtitle}>
            Find fresh products from local farmers
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#9E9E9E"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('');
              fetchProducts();
            }}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
          <TouchableOpacity 
            style={styles.filterChip} 
            activeOpacity={0.7} 
            onPress={() => {
              setActiveFilterTab('State');
              setIsFilterVisible(true);
            }}>
            <Ionicons name="location-outline" size={16} color="#1B5E20" style={styles.filterIcon} />
            <Text style={styles.filterText}>State</Text>
            <Ionicons name="chevron-down" size={14} color="#757575" style={styles.dropdownIcon} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.filterChip} 
            activeOpacity={0.7}
            onPress={() => {
              setActiveFilterTab('Village');
              setIsFilterVisible(true);
            }}>
            <Ionicons name="home-outline" size={16} color="#1B5E20" style={styles.filterIcon} />
            <Text style={styles.filterText}>Village</Text>
            <Ionicons name="chevron-down" size={14} color="#757575" style={styles.dropdownIcon} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.filterChip} 
            activeOpacity={0.7}
            onPress={() => {
              setActiveFilterTab('Category');
              setIsFilterVisible(true);
            }}>
            <Ionicons name="grid-outline" size={16} color="#1B5E20" style={styles.filterIcon} />
            <Text style={styles.filterText}>Category</Text>
            <Ionicons name="chevron-down" size={14} color="#757575" style={styles.dropdownIcon} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.filterChip} 
            activeOpacity={0.7}
            onPress={() => {
              setActiveFilterTab('Price');
              setIsFilterVisible(true);
            }}>
            <Ionicons name="pricetag-outline" size={16} color="#1B5E20" style={styles.filterIcon} />
            <Text style={styles.filterText}>Price</Text>
            <Ionicons name="chevron-down" size={14} color="#757575" style={styles.dropdownIcon} />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Products Grid */}
      <FlatList
        data={products}
        keyExtractor={item => item.productId?.toString() || Math.random().toString()}
        renderItem={renderProduct}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1B5E20']}
            tintColor="#1B5E20"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🌱</Text>
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptySubtitle}>
              Pull down to refresh or try a different search
            </Text>
          </View>
        }
      />

      {/* Filter Modal */}
      <FilterModal 
        visible={isFilterVisible} 
        onClose={() => setIsFilterVisible(false)} 
        initialTab={activeFilterTab}
        onApply={(criteria) => {
          setActiveFilters(criteria);
          // Pass the newly created criteria directly to avoid stale state issues!
          executeSearchAndFilter(searchQuery, criteria);
        }} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    marginBottom: 10,
    alignSelf: 'flex-start',
    padding: 4,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#C8E6C9',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 14,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#212121',
  },
  clearText: {
    fontSize: 18,
    color: '#9E9E9E',
    padding: 4,
  },
  filterContainer: {
    marginTop: 18,
    marginBottom: 8,
  },
  filterScrollContent: {
    paddingHorizontal: 20,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20, // pill shape
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filterIcon: {
    marginRight: 6,
  },
  filterText: {
    fontSize: 14,
    color: '#424242',
    fontWeight: '600',
  },
  dropdownIcon: {
    marginLeft: 4,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },
  cardWrapper: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#424242',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
  },
});

export default HomeScreen;

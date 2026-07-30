import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import {useAuth} from '../context/AuthContext';
import {getAllProducts} from '../services/productService';

const FarmerDashboardScreen = ({navigation}: any) => {
  const {user, logout} = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFarmerProducts = async () => {
    try {
      const allProducts = await getAllProducts();
      // Filter products belonging to the logged-in farmer
      const myProducts = allProducts.filter(
        (p: any) => p.farmerId === user?.farmerId,
      );
      setProducts(myProducts);
    } catch (error) {
      console.log('Error fetching farmer products:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFarmerProducts();
    }, [user?.farmerId])
  );


  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFarmerProducts();
    setRefreshing(false);
  }, []);

  const renderProduct = ({item, index}: any) => (
    <View style={[styles.cardWrapper, index % 2 === 0 ? {marginRight: 6} : {marginLeft: 6}]}>
      <ProductCard
        product={item}
        onPress={() =>
          navigation.navigate('ProductDetail', {product: item})
        }
      />
    </View>
  );

  if (loading) {
    return <LoadingSpinner message="Loading your products..." />;
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
          <Text style={styles.greeting}>
            Welcome, {user?.name || 'Farmer'} 🌾
          </Text>
          <Text style={styles.subtitle}>Manage your products</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{products.length}</Text>
          <Text style={styles.statLabel}>Total Products</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {products.filter((p: any) => p.isActive).length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
      </View>

      {/* Product List */}
      <FlatList
        data={products}
        keyExtractor={item =>
          item.productId?.toString() || Math.random().toString()
        }
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
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>No products yet</Text>
            <Text style={styles.emptySubtitle}>
              Your products will appear here
            </Text>
          </View>
        }
      />

      {/* Add Product FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddProduct')}
        activeOpacity={0.85}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: -10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1B5E20',
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '600',
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 80, // added padding for FAB
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#1B5E20',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  fabIcon: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '300',
    lineHeight: 34,
  },
});

export default FarmerDashboardScreen;

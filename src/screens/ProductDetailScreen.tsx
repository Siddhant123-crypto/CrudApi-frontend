import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useAuth} from '../context/AuthContext';
import {getProductImageUrl} from '../services/productService';
import Ionicons from '@expo/vector-icons/Ionicons';

const {width} = Dimensions.get('window');

const ProductDetailScreen = ({route, navigation}: any) => {
  const {product} = route.params;
  const {user} = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [ordering, setOrdering] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const imageUrl = product.productPhoto
    ? getProductImageUrl(product.productPhoto)
    : null;

  const handlePlaceOrder = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to place an order.');
      return;
    }

    setOrdering(true);
    try {
      const orderId = 'ord_' + Math.random().toString(36).substr(2, 9);
      const newOrder = {
        orderId,
        productId: product.productId,
        productName: product.productName,
        category: product.category,
        price: product.price,
        unit: product.unit,
        quantity,
        totalPrice: product.price * quantity,
        status: 'Pending',
        customerId: user.userId,
        customerName: user.name,
        farmerId: product.farmerId,
        orderDate: new Date().toISOString(),
      };

      const storedOrders = await AsyncStorage.getItem('@farm2home_orders');
      const parsedOrders = storedOrders ? JSON.parse(storedOrders) : [];
      parsedOrders.push(newOrder);
      await AsyncStorage.setItem('@farm2home_orders', JSON.stringify(parsedOrders));

      Alert.alert(
        'Order Placed! 🎉',
        `Successfully placed order for ${quantity} ${product.unit}(s) of ${product.productName}.`,
        [
          {text: 'View Orders', onPress: () => navigation.navigate('Orders')},
          {text: 'Continue Shopping', onPress: () => navigation.goBack()},
        ],
      );
    } catch (error) {
      console.log('Error placing order:', error);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setOrdering(false);
    }
  };

  const isCustomer = user?.role === 'USER';
  const isFarmer = user?.role === 'FARMER';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 100}}>
        {/* Header Image Section */}
        <View style={styles.headerImageContainer}>
          {imageUrl ? (
            <Image source={{uri: imageUrl}} style={styles.headerImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={{fontSize: 50}}>🌾</Text>
            </View>
          )}

          {/* Top Bar (Back & Heart) */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            {isCustomer && (
              <TouchableOpacity style={styles.iconButton} onPress={() => setIsLiked(!isLiked)}>
                <Ionicons name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? "#FF5252" : "#FFF"} />
              </TouchableOpacity>
            )}
          </View>

          {/* Organic Tag */}
          <View style={styles.organicTagOverlay}>
            <Ionicons name="leaf" size={14} color="#FFF" style={{marginRight: 4}} />
            <Text style={styles.organicTagText}>Organic</Text>
          </View>
        </View>

        {/* Content Container (Overlaps Image) */}
        <View style={styles.contentContainer}>
          {/* Title & Rating */}
          <Text style={styles.productName}>{product.productName}</Text>
          <View style={styles.authorRow}>
            <Text style={styles.authorText}>by {product.farmerName || 'Farmer'}</Text>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" style={{marginLeft: 4}} />
          </View>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color="#FFC107" />
            <Text style={styles.ratingText}> 4.8 <Text style={styles.reviewCount}>(120 reviews)</Text></Text>
          </View>

          {/* Price & Status */}
          <View style={styles.priceStatusRow}>
            <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
              <Text style={styles.price}>₹{product.price?.toFixed(2) || '0.00'}</Text>
              <Text style={styles.unit}> / {product.unit || 'KG'}</Text>
            </View>
            <View style={[styles.statusBadge, product.isActive ? styles.statusActive : styles.statusInactive]}>
              <Text style={[styles.statusText, product.isActive ? styles.statusActiveText : styles.statusInactiveText]}>
                {product.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          {/* Tags */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsContainer}>
            <View style={styles.tag}>
              <Ionicons name="nutrition-outline" size={14} color="#2E7D32" />
              <Text style={styles.tagText}>Fresh & Healthy</Text>
            </View>
            <View style={styles.tag}>
              <Ionicons name="leaf-outline" size={14} color="#2E7D32" />
              <Text style={styles.tagText}>100% Organic</Text>
            </View>
            <View style={styles.tag}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#2E7D32" />
              <Text style={styles.tagText}>Pesticide Free</Text>
            </View>
          </ScrollView>

          {/* Farmer Details Card */}
          <Text style={styles.sectionTitle}>Farmer Details</Text>
          <View style={styles.card}>
            <View style={styles.farmerCardContent}>
              <View style={styles.farmerAvatarPlaceholder}>
                <Ionicons name="person" size={32} color="#9E9E9E" />
              </View>
              <View style={styles.farmerInfo}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={styles.farmerName}>{product.farmerName || 'Farmer Name'}</Text>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" style={{marginLeft: 4}} />
                </View>
                <Text style={styles.farmerSubtitle}>Experienced Farmer</Text>
                
                <View style={styles.iconRow}>
                  <Ionicons name="location-outline" size={14} color="#757575" />
                  <Text style={styles.iconText}>{product.farmerAddress || 'Nashik, Maharashtra'}</Text>
                </View>
                <View style={styles.iconRow}>
                  <Ionicons name="calendar-outline" size={14} color="#757575" />
                  <Text style={styles.iconText}>Member since Jan 2025</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Product Details Card */}
          <Text style={styles.sectionTitle}>Product Details</Text>
          <View style={styles.card}>
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Ionicons name="grid-outline" size={16} color="#4CAF50" />
                <Text style={styles.detailLabel}>Category</Text>
              </View>
              <Text style={styles.detailValue}>{product.category || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Ionicons name="cube-outline" size={16} color="#4CAF50" />
                <Text style={styles.detailLabel}>Quantity</Text>
              </View>
              <Text style={styles.detailValue}>120 {product.unit || 'KG'} Available</Text>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Ionicons name="ribbon-outline" size={16} color="#4CAF50" />
                <Text style={styles.detailLabel}>Quality</Text>
              </View>
              <Text style={styles.detailValue}>Premium</Text>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Ionicons name="calendar-clear-outline" size={16} color="#4CAF50" />
                <Text style={styles.detailLabel}>Harvest Date</Text>
              </View>
              <Text style={styles.detailValue}>30 July 2026</Text>
            </View>
            <View style={[styles.detailRow, {borderBottomWidth: 0, alignItems: 'flex-start', marginTop: 8}]}>
              <View style={styles.detailLabelContainer}>
                <Ionicons name="document-text-outline" size={16} color="#4CAF50" />
                <Text style={styles.detailLabel}>Description</Text>
              </View>
              <Text style={[styles.detailValue, {flex: 1, textAlign: 'right', lineHeight: 20}]}>
                {product.description || 'Fresh and naturally ripened. Rich in nutrients and great for health.'}
              </Text>
            </View>
          </View>

          {/* Location Card */}
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.locationCard}>
            <View style={styles.locationInfo}>
              <Ionicons name="location" size={28} color="#2E7D32" style={{marginRight: 10}} />
              <View>
                <Text style={styles.locationCity}>{product.farmerAddress?.split(',')[0] || 'Nashik'}, Maharashtra</Text>
                <Text style={styles.locationSub}>Near Panchavati</Text>
              </View>
            </View>
            {/* A dummy map background pattern can go here */}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Area */}
      {isCustomer && (
        <View style={styles.bottomBar}>
          <View style={styles.quantityContainer}>
            <TouchableOpacity style={styles.quantityBtn} onPress={() => setQuantity(q => Math.max(1, q - 1))}>
              <Text style={styles.quantityBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantityValue}>{quantity}</Text>
            <TouchableOpacity style={styles.quantityBtn} onPress={() => setQuantity(q => q + 1)}>
              <Text style={styles.quantityBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.buyBtn} onPress={handlePlaceOrder} disabled={ordering}>
            <Text style={styles.buyBtnText}>Place Order (₹{(product.price * quantity).toFixed(2)})</Text>
          </TouchableOpacity>
        </View>
      )}

      {isFarmer && (
        <View style={styles.farmerBottomBar}>
          <View style={styles.farmerButtonsRow}>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => navigation.navigate('AddProduct', {product})}
            >
              <Ionicons name="pencil" size={18} color="#2E7D32" style={{marginRight: 8}} />
              <Text style={styles.editButtonText}>Edit Product</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.deactivateButton}>
              <Ionicons name="power" size={18} color="#FFF" style={{marginRight: 8}} />
              <Text style={styles.deactivateButtonText}>Deactivate</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.helpTextRow}>
            <Ionicons name="information-circle-outline" size={14} color="#757575" />
            <Text style={styles.helpText}>You can edit product details anytime.</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerImageContainer: {
    width: '100%',
    height: 320,
    position: 'relative',
    backgroundColor: '#E0E0E0',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C8E6C9',
  },
  topBar: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  organicTagOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    backgroundColor: 'rgba(27, 94, 32, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  organicTagText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  contentContainer: {
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 24,
    marginTop: -30,
    minHeight: 500,
  },
  productName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  authorText: {
    fontSize: 15,
    color: '#4B5563',
    fontWeight: '500',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  reviewCount: {
    fontWeight: '400',
    color: '#6B7280',
  },
  priceStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  price: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1B5E20',
  },
  unit: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusInactive: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusActiveText: {
    color: '#166534',
  },
  statusInactiveText: {
    color: '#991B1B',
  },
  tagsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  tagText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  farmerCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  farmerAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  farmerInfo: {
    flex: 1,
  },
  farmerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  farmerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  iconText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
  },
  detailLabel: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 8,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  locationCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 16,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  locationCity: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  locationSub: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginRight: 16,
  },
  quantityBtn: {
    width: 40,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityBtnText: {
    fontSize: 20,
    color: '#4B5563',
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 12,
  },
  buyBtn: {
    flex: 1,
    backgroundColor: '#1B5E20',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  farmerBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  farmerButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2E7D32',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingVertical: 14,
    marginRight: 10,
  },
  editButtonText: {
    color: '#2E7D32',
    fontSize: 15,
    fontWeight: '700',
  },
  deactivateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1B5E20',
    borderRadius: 12,
    paddingVertical: 14,
    marginLeft: 10,
  },
  deactivateButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  helpTextRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
});

export default ProductDetailScreen;

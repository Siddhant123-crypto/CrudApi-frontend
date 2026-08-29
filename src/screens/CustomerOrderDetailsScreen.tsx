import React, {useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  TextInput,
  AppState,
  AppStateStatus,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../services/api';
import {getProductImageUrl} from '../services/productService';
import { OrderTimeline } from '../components/orders/OrderTimeline';
import { OrderStatusBadge } from '../components/orders/OrderStatusBadge';
import { ReviewForm } from '../components/reviews/ReviewForm';
import { StarRating } from '../components/reviews/StarRating';
import { getProductReviews, deleteReview } from '../services/reviewService';

const CustomerOrderDetailsScreen = ({route, navigation}: any) => {
  const {orderId} = route.params;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  
  const [editReasonModalVisible, setEditReasonModalVisible] = useState(false);
  const [editReasonText, setEditReasonText] = useState('');
  const [editingReason, setEditingReason] = useState(false);

  const [reviews, setReviews] = useState<Record<string, any>>({});
  const [reviewFormVisible, setReviewFormVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const appState = useRef(AppState.currentState);

  const fetchReviewsForOrderItems = async (orderData: any) => {
    if (orderData && orderData.status === 'DELIVERED') {
      try {
        const reviewsMap: Record<string, any> = {};
        await Promise.all(
          orderData.items.map(async (item: any) => {
            if (item.productId) {
              const productReviews = await getProductReviews(item.productId);
              const reviewForThisOrder = productReviews.find(
                (r: any) => r.orderId === orderData.orderId
              );
              if (reviewForThisOrder) {
                reviewsMap[item.productId] = reviewForThisOrder;
              }
            }
          })
        );
        setReviews(reviewsMap);
      } catch (error) {
        console.log('Error fetching order reviews:', error);
      }
    }
  };

  const fetchOrderDetails = async (isSilent = false) => {
    // Only show full loading indicator on first load
    if (!isSilent && !order) {
      setLoading(true);
    }
    try {
      const response = await api.get(`/order/${orderId}`);
      setOrder(response.data);
      await fetchReviewsForOrderItems(response.data);
    } catch (error) {
      console.log('Error fetching order details:', error);
      if (!isSilent) {
        Alert.alert('Error', 'Failed to load order details');
        navigation.goBack();
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      
      // 1. Fetch immediately on focus
      fetchOrderDetails(false);

      // 2. Start polling interval
      const intervalId = setInterval(() => {
        if (appState.current === 'active' && isMounted) {
          fetchOrderDetails(true); // Silent refresh
        }
      }, 10000);

      // 3. Handle AppState changes
      const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
        if (appState.current.match(/inactive|background/) && nextAppState === 'active' && isMounted) {
          // Immediately fetch when coming back to foreground
          fetchOrderDetails(true);
        }
        appState.current = nextAppState;
      });

      // 4. Cleanup
      return () => {
        isMounted = false;
        clearInterval(intervalId);
        subscription.remove();
      };
    }, [orderId])
  );

  const handleCancelOrder = () => {
    setCancelModalVisible(true);
  };

  const confirmCancelOrder = async () => {
    setCancelling(true);
    try {
      const queryParams = cancelReason.trim() ? `?reason=${encodeURIComponent(cancelReason.trim())}` : '';
      await api.put(`/order/${orderId}/cancel${queryParams}`);
      Alert.alert('Success', 'Order cancelled successfully');
      setCancelModalVisible(false);
      fetchOrderDetails(); // Refresh details to show cancelled status
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const handleEditReason = () => {
    setEditReasonText(order?.cancellationReason || '');
    setEditReasonModalVisible(true);
  };

  const submitEditReason = async () => {
    if (!editReasonText.trim()) {
      Alert.alert('Validation Error', 'Reason cannot be empty');
      return;
    }
    setEditingReason(true);
    try {
      const queryParams = `?reason=${encodeURIComponent(editReasonText.trim())}`;
      await api.put(`/order/${orderId}/cancel-reason${queryParams}`);
      Alert.alert('Success', 'Cancellation reason updated');
      setEditReasonModalVisible(false);
      fetchOrderDetails();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update reason');
    } finally {
      setEditingReason(false);
    }
  };

  const handleDeleteReview = (reviewId: string, productId: string) => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete your review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReview(reviewId);
              Alert.alert('Success', 'Review deleted successfully');
              const updatedReviews = { ...reviews };
              delete updatedReviews[productId];
              setReviews(updatedReviews);
            } catch (error: any) {
              console.log('Error deleting review:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete review');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  if (!order) return null;



  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Order #{order.orderNumber ? order.orderNumber.substring(0, 12) : order.orderId.substring(0, 8)}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Status Timeline */}
        <View style={styles.card}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
            <Text style={styles.sectionTitle}>Overall Order Status</Text>
            <OrderStatusBadge status={order.status} />
          </View>
          <OrderTimeline status={order.status} />
        </View>

        {/* Cancellation Reason Card (if cancelled) */}
        {order.status === 'CANCELLED' && (
          <View style={[styles.card, {borderColor: '#FCA5A5', backgroundColor: '#FEF2F2'}]}>
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8}}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Ionicons name="warning" size={20} color="#DC2626" />
                <Text style={styles.cancellationReasonTitle}>Cancellation Reason</Text>
              </View>
              <TouchableOpacity onPress={handleEditReason} style={{padding: 4}}>
                <Ionicons name="pencil" size={18} color="#DC2626" />
              </TouchableOpacity>
            </View>
            <Text style={styles.cancellationReasonText}>
              {order.cancellationReason || 'You cancelled this order without providing a reason.'}
            </Text>
          </View>
        )}

        {/* Ordered Items */}
        <View style={styles.highlightedCard}>
          <Text style={styles.sectionTitle}>Ordered Items</Text>
          {order.items.map((item: any, index: number) => {
            const imageUrl = item.imageUrl ? getProductImageUrl(item.imageUrl) : null;
            return (
              <View key={index} style={[styles.itemRowContainer, index > 0 && styles.itemRowBorder]}>
                <View style={styles.itemRow}>
                  {imageUrl ? (
                    <Image source={{uri: imageUrl}} style={styles.itemImage} />
                  ) : (
                    <View style={styles.placeholderImage}><Text>🌾</Text></View>
                  )}
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.productName}</Text>
                    <Text style={styles.itemFarmer}>Farmer: {item.farmerName || 'Local Farmer'}</Text>
                    <Text style={styles.itemMeta}>{item.quantity} {item.unit} x ₹{item.price}</Text>
                    <View style={{marginTop: 6}}>
                      <OrderStatusBadge status={item.status} />
                    </View>
                  </View>
                  <Text style={styles.itemTotal}>₹{item.subtotal.toFixed(2)}</Text>
                </View>

                {/* Review status / action */}
                {item.status === 'DELIVERED' && (
                  <View style={styles.reviewActionContainer}>
                    {reviews[item.productId] ? (
                      <View style={styles.reviewedBox}>
                        <View style={styles.reviewedHeader}>
                          <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                          <Text style={styles.reviewedText}>You reviewed this product</Text>
                        </View>
                        <View style={styles.reviewedContent}>
                          <StarRating rating={reviews[item.productId].rating} size={14} disabled={true} />
                          {reviews[item.productId].reviewText ? (
                            <Text style={styles.reviewedTextSnippet} numberOfLines={1}>
                              "{reviews[item.productId].reviewText}"
                            </Text>
                          ) : null}
                        </View>
                        <View style={styles.reviewedActions}>
                          <TouchableOpacity
                            style={styles.reviewEditBtn}
                            onPress={() => {
                              setSelectedProduct(item);
                              setReviewFormVisible(true);
                            }}
                          >
                            <Text style={styles.reviewEditBtnText}>Edit Review</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.reviewDeleteBtn}
                            onPress={() => handleDeleteReview(reviews[item.productId].reviewId, item.productId)}
                          >
                            <Text style={styles.reviewDeleteBtnText}>Delete</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.notReviewedBox}>
                        <Text style={styles.ratePrompt}>How was this product?</Text>
                        <View style={styles.rateActionRow}>
                          <StarRating
                            rating={0}
                            size={20}
                            onRatingChange={(newRating) => {
                              setSelectedProduct({ ...item, productId: item.productId, initialRating: newRating });
                              setReviewFormVisible(true);
                            }}
                          />
                          <TouchableOpacity
                            style={styles.writeReviewBtn}
                            onPress={() => {
                              setSelectedProduct(item);
                              setReviewFormVisible(true);
                            }}
                          >
                            <Text style={styles.writeReviewBtnText}>Write a review</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Delivery Address */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={20} color="#6B7280" style={{marginTop: 2}} />
            <View style={{marginLeft: 12, flex: 1}}>
              <Text style={styles.addressText}>{order.deliveryAddress}</Text>
              <Text style={styles.addressText}>{order.village}, {order.state} {order.postalCode}</Text>
            </View>
          </View>
        </View>

        {/* Payment Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Payment Method</Text>
            <Text style={styles.summaryValue}>{order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Amount</Text>
            <Text style={styles.summaryTotal}>₹{order.totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        <View style={{height: 40}} />
      </ScrollView>

      {/* Cancel Order Button */}
      {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={styles.cancelBtn} 
            onPress={handleCancelOrder}
          >
             <Text style={styles.cancelBtnText}>Cancel Order</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Cancel Reason Modal */}
      <Modal
        visible={cancelModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel Order</Text>
            <Text style={styles.modalSubtitle}>Are you sure you want to cancel this order? Please tell us why.</Text>
            
            <TextInput
              style={styles.reasonInput}
              placeholder="Reason for cancellation (optional)"
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelBtn} 
                onPress={() => setCancelModalVisible(false)}
                disabled={cancelling}
              >
                <Text style={styles.modalCancelBtnText}>Keep Order</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalConfirmBtn} 
                onPress={confirmCancelOrder}
                disabled={cancelling}
              >
                {cancelling ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Cancel Order</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Reason Modal */}
      <Modal
        visible={editReasonModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditReasonModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Cancellation Reason</Text>
            <Text style={styles.modalSubtitle}>Update your reason for cancelling this order.</Text>
            
            <TextInput
              style={styles.reasonInput}
              placeholder="Reason for cancellation (optional)"
              value={editReasonText}
              onChangeText={setEditReasonText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelBtn} 
                onPress={() => setEditReasonModalVisible(false)}
                disabled={editingReason}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalConfirmBtn} 
                onPress={submitEditReason}
                disabled={editingReason}
              >
                {editingReason ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {selectedProduct && (
        <ReviewForm
          visible={reviewFormVisible}
          orderId={order.orderId}
          productId={selectedProduct.productId}
          productName={selectedProduct.productName}
          existingReview={reviews[selectedProduct.productId]}
          onClose={() => {
            setReviewFormVisible(false);
            setSelectedProduct(null);
          }}
          onSubmitSuccess={(newReview) => {
            setReviewFormVisible(false);
            setSelectedProduct(null);
            setReviews((prev) => ({
              ...prev,
              [newReview.productId]: newReview,
            }));
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#1E3A8A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E3A8A',
  },
  backBtn: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  highlightedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  cancellationReasonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#991B1B',
    marginLeft: 8,
  },
  cancellationReasonText: {
    fontSize: 14,
    color: '#7F1D1D',
    lineHeight: 22,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  
  // Timeline
  timelineContainer: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 50,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
    width: 20,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  timelineDotActive: {
    backgroundColor: '#10B981', // green
  },
  timelineDotInactive: {
    backgroundColor: '#E5E7EB',
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  timelineDotCurrent: {
    backgroundColor: '#1B5E20',
    borderWidth: 4,
    borderColor: '#A7F3D0',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: -4,
    marginBottom: -4,
    zIndex: 1,
  },
  timelineLineActive: {
    backgroundColor: '#10B981',
  },
  timelineLineInactive: {
    backgroundColor: '#E5E7EB',
  },
  timelineRight: {
    flex: 1,
    paddingBottom: 20,
    justifyContent: 'flex-start',
    paddingTop: 1,
  },
  timelineText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  timelineTextCurrent: {
    fontWeight: '700',
    color: '#1B5E20',
  },
  timelineTextInactive: {
    color: '#9CA3AF',
  },
  
  // Items
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  itemRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  placeholderImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  itemFarmer: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
    marginTop: 2,
  },
  itemMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  
  // Details
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  summaryTotal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E3A8A',
  },

  bottomBar: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#EF4444',
  },
  cancelBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 20,
    lineHeight: 20,
  },
  reasonInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#111827',
    minHeight: 100,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  modalCancelBtnText: {
    color: '#4B5563',
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#EF4444',
    marginLeft: 8,
  },
  modalConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  itemRowContainer: {
    paddingVertical: 12,
  },
  reviewActionContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginTop: 8,
  },
  reviewedBox: {
    width: '100%',
  },
  reviewedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
    marginLeft: 6,
  },
  reviewedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  reviewedTextSnippet: {
    fontSize: 13,
    color: '#4B5563',
    fontStyle: 'italic',
    marginLeft: 8,
    flex: 1,
  },
  reviewedActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
  },
  reviewEditBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginRight: 8,
  },
  reviewEditBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  reviewDeleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  reviewDeleteBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  notReviewedBox: {
    width: '100%',
  },
  ratePrompt: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 6,
  },
  rateActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  writeReviewBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  writeReviewBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default CustomerOrderDetailsScreen;

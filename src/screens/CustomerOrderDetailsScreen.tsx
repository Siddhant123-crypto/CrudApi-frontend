import React, {useState, useCallback, useRef, useEffect} from 'react';
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
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../services/api';
import {getProductImageUrl} from '../services/productService';
import { OrderTimeline } from '../components/orders/OrderTimeline';
import { OrderStatusBadge } from '../components/orders/OrderStatusBadge';
import { PaymentStatusBadge } from '../components/orders/PaymentStatusBadge';
import { ReviewForm } from '../components/reviews/ReviewForm';
import { StarRating } from '../components/reviews/StarRating';
import { getProductReviews, deleteReview } from '../services/reviewService';
import { useAuth } from '../context/AuthContext';
import { startOnlinePayment, getPaymentErrorMessage, syncPayment } from '../services/paymentService';
import { PAYMENT_MESSAGES } from '../constants/paymentMessages';
import { PageBackground } from '../components/ui/PageBackground';
import { ThemedHeader } from '../components/ui/ThemedHeader';
import { Card } from '../components/ui/Card';
import { PrimaryButton, OutlineButton } from '../components/ui/Buttons';
import { THEME } from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const formatDisplayPrice = (val: any) => {
  const num = Number(val);
  if (isNaN(num)) return val ?? '0';
  if (num % 1 === 0) {
    return String(Math.round(num));
  }
  return num.toFixed(2).replace(/\.00$/, '').replace(/(\.[0-9])0$/, '$1');
};

const CustomerOrderDetailsScreen = ({route, navigation}: any) => {
  const insets = useSafeAreaInsets();
  const {user} = useAuth();
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
  const [remainingTime, setRemainingTime] = useState<string | null>(null);
  const [isCancellableTime, setIsCancellableTime] = useState<boolean>(false);
  const [isPaying, setIsPaying] = useState<boolean>(false);
  const appState = useRef(AppState.currentState);
  const isPaidOnline = order?.paymentMethod !== 'COD' && order?.paymentStatus === 'PAID';
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

      const fetchAndSync = async () => {
        await fetchOrderDetails(false);
        if (!isMounted) return;
        // Silently sync if this order is an unpaid online non-cancelled order
        try {
          const res = await api.get(`/order/${orderId}`);
          const latestOrder = res.data;
          if (
            latestOrder &&
            latestOrder.paymentMethod === 'ONLINE' &&
            latestOrder.paymentStatus !== 'PAID' &&
            latestOrder.status !== 'CANCELLED'
          ) {
            const syncRes = await syncPayment(orderId);
            if (syncRes?.paid && isMounted) {
              fetchOrderDetails(true);
            }
          }
        } catch {
          // Sync errors are non-fatal; do not disturb the UI
        }
      };

      fetchAndSync();

      const intervalId = setInterval(() => {
        if (appState.current === 'active' && isMounted) {
          fetchOrderDetails(true);
        }
      }, 10000);
      const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
        if (appState.current.match(/inactive|background/) && nextAppState === 'active' && isMounted) {
          fetchOrderDetails(true);
        }
        appState.current = nextAppState;
      });
      return () => {
        isMounted = false;
        clearInterval(intervalId);
        subscription.remove();
      };
    }, [orderId])
  );

  useEffect(() => {
    if (!order || !order.createdOn) {
      setIsCancellableTime(false);
      return;
    }

    if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') {
      setIsCancellableTime(false);
      return;
    }

    const updateTimer = () => {
      let createdStr = order.createdOn;
      
      let createdTime: number;
      if (createdStr.includes('T')) {
        // e.g., "2026-10-08T10:00:00"
        const [datePart, timePart] = createdStr.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes, seconds] = timePart.split(':').map(Number);
        createdTime = new Date(year, month - 1, day, hours, minutes, Math.floor(seconds || 0)).getTime();
      } else {
        createdTime = new Date(createdStr).getTime();
      }
      const now = new Date().getTime();
      const tenHoursInMillis = 10 * 60 * 60 * 1000;
      const deadline = createdTime + tenHoursInMillis;
      const remaining = deadline - now;

      if (remaining <= 0) {
        setIsCancellableTime(false);
        setRemainingTime(null);
        return false;
      } else {
        setIsCancellableTime(true);
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        
        const formatZero = (num: number) => (num < 10 ? `0${num}` : num);
        setRemainingTime(
          hours > 0
            ? `${formatZero(hours)}:${formatZero(minutes)}:${formatZero(seconds)}`
            : `${formatZero(minutes)}:${formatZero(seconds)}`
        );
        return true;
      }
    };

    if (!updateTimer()) return;

    const intervalId = setInterval(() => {
      if (!updateTimer()) {
        clearInterval(intervalId);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [order]);
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
      fetchOrderDetails();
    } catch (error: any) {
      if (
        error.response?.status === 409 ||
        error.response?.data?.message?.includes('Paid online order cannot be cancelled')
      ) {
        Alert.alert(
          'Cancel Not Allowed',
          PAYMENT_MESSAGES.CANCEL_PAID_ONLINE_NOTICE
        );
      } else {
        Alert.alert('Error', error.response?.data?.message || 'Failed to cancel order');
      }
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

  const handlePayNow = async () => {
    if (isPaying || !order) return;
    setIsPaying(true);
    try {
      const result = await startOnlinePayment(order, user);
      if (result.success) {
        navigation.navigate('PaymentSuccess', {
          orderId: result.orderId || order.orderId,
          orderNumber: result.orderNumber || order.orderNumber,
          totalAmount: result.totalAmount || order.totalAmount,
          paymentId: result.paymentId,
          isTestMode: result.isTestMode,
        });
      } else if (result.status === 'VERIFY_FAILED') {
        Alert.alert(
          'Payment Status',
          result.message || PAYMENT_MESSAGES.VERIFICATION_PROBLEM
        );
        fetchOrderDetails(true);
      } else if (result.status === 'CANCELLED') {
        Alert.alert('Payment Cancelled', result.message || PAYMENT_MESSAGES.PAYMENT_CANCELLED);
      } else {
        Alert.alert('Payment Failed', result.message || PAYMENT_MESSAGES.PAYMENT_FAILED);
      }
    } catch (err: any) {
      const msg = getPaymentErrorMessage(err);
      if (msg.includes('already paid') || msg.includes('ho chuka hai')) {
        Alert.alert('Payment Successful', msg);
        fetchOrderDetails(true);
      } else {
        Alert.alert('Payment Error', msg);
      }
    } finally {
      setIsPaying(false);
    }
  };

  if (loading) {
    return (
      <PageBackground style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.colors.accent} />
      </PageBackground>
    );
  }
  if (!order) return null;

  return (
    <PageBackground style={styles.container}>
      {/* Inner ThemedHeader */}
      <ThemedHeader
        variant="inner"
        title={`Order #${order.orderNumber ? order.orderNumber.substring(0, 12) : order.orderId.substring(0, 8)}`}
        titleStyle={styles.headerTitle}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Overall Order Status Card */}
        <Card style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeaderTitle}>Overall Order Status</Text>
            <OrderStatusBadge status={order.status} variant="customer" />
          </View>
          <OrderTimeline status={order.status} variant="customer" />

          {/* Track Order Action (if confirmed/out for delivery) */}
          {order.status !== 'CANCELLED' && order.status !== 'PENDING' && (
            <View style={{ marginTop: 16 }}>
              <OutlineButton
                title="Track Order"
                onPress={() => navigation.navigate('CustomerOrderTracking', { orderId: order.orderId })}
              />
            </View>
          )}
        </Card>

        {/* Cancellation Reason Card (if cancelled) */}
        {order.status === 'CANCELLED' && (
          <Card style={[styles.card, styles.cancellationCard]}>
            <View style={styles.cancellationHeader}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Ionicons name="warning" size={20} color={THEME.colors.error} />
                <Text style={styles.cancellationReasonTitle}>Cancellation Reason</Text>
              </View>
              {(!order.cancellationReason || !order.cancellationReason.includes('Cancelled by Farmer:')) && (
                <TouchableOpacity onPress={handleEditReason} style={{padding: 4}}>
                  <Ionicons name="pencil" size={18} color={THEME.colors.accentDeep} />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.cancellationReasonText}>
              {order.cancellationReason || 'This order was cancelled without providing a reason.'}
            </Text>
          </Card>
        )}

        {/* Ordered Items Card */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Ordered Items</Text>
          {order.items.map((item: any, index: number) => {
            const imageUrl = item.imageUrl ? getProductImageUrl(item.imageUrl) : null;
            return (
              <View key={index} style={[styles.itemRowContainer, index > 0 && styles.itemRowBorder]}>
                <View style={styles.itemRow}>
                  {imageUrl ? (
                    <Image source={{uri: imageUrl}} style={styles.itemImage} />
                  ) : (
                    <View style={styles.placeholderImage}>
                      <Text style={{ fontSize: 20 }}>🌾</Text>
                    </View>
                  )}
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={2}>{item.productName}</Text>
                    <Text style={styles.itemFarmer}>Farmer: {item.farmerName || 'Local Farmer'}</Text>
                    <Text style={styles.itemMeta}>{item.quantity} {item.unit} × ₹{formatDisplayPrice(item.price)}</Text>
                    <View style={styles.itemBadgeRow}>
                      <OrderStatusBadge status={item.status} variant="customer" />
                    </View>
                  </View>
                  <View style={styles.itemPriceCol}>
                    <Text style={styles.itemTotal}>₹{formatDisplayPrice(item.subtotal)}</Text>
                  </View>
                </View>

                {/* Review Action */}
                {item.status === 'DELIVERED' && (
                  <View style={styles.reviewActionContainer}>
                    {reviews[item.productId] ? (
                      <View style={styles.reviewedBox}>
                        <View style={styles.reviewedHeader}>
                          <Ionicons name="checkmark-circle" size={16} color={THEME.colors.success} />
                          <Text style={styles.reviewedText}>You reviewed this product</Text>
                        </View>
                        <View style={styles.reviewedContent}>
                          <StarRating rating={reviews[item.productId].rating} size={14} disabled={true} variant="customer" />
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
                            variant="customer"
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
        </Card>

        {/* Delivery Details Card */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>
          <View style={styles.detailRow}>
            <View style={styles.locationIconBox}>
              <Ionicons name="location-outline" size={20} color={THEME.colors.accent} />
            </View>
            <View style={{marginLeft: 12, flex: 1}}>
              <Text style={styles.addressText}>{order.deliveryAddress}</Text>
              <Text style={styles.addressSubText}>{order.village}, {order.state} {order.postalCode}</Text>
            </View>
          </View>
        </Card>

        {/* Payment Details Card */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Payment Method</Text>
            <Text style={styles.summaryValue} numberOfLines={2}>
              {order.paymentMethod === 'COD'
                ? 'Cash on Delivery'
                : order.paymentMethod === 'ONLINE'
                ? 'Online Payment (Razorpay)'
                : order.paymentMethod || 'N/A'}
            </Text>
          </View>
          {order.paymentMethod !== 'COD' && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Payment Status</Text>
              <PaymentStatusBadge status={order.paymentStatus} variant="customer" />
            </View>
          )}
          <View style={[styles.summaryRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <Text style={styles.summaryLabelTotal}>Total Amount</Text>
            <Text style={styles.summaryTotal}>₹{formatDisplayPrice(order.totalAmount)}</Text>
          </View>

          {/* Paid status clear message */}
          {order.paymentStatus === 'PAID' && (
            <View style={styles.paidInfoBox}>
              <Ionicons name="checkmark-circle" size={18} color={THEME.colors.success} />
              <Text style={styles.paidInfoText}>Payment Verified & Paid</Text>
            </View>
          )}

          {/* Unpaid Online order: Pay Now button */}
          {order.paymentMethod === 'ONLINE' &&
            order.status !== 'CANCELLED' &&
            (order.paymentStatus === 'PENDING' || order.paymentStatus === 'FAILED') && (
              <View style={{ marginTop: 14 }}>
                <PrimaryButton
                  title={`Pay Now • ₹${formatDisplayPrice(order.totalAmount)}`}
                  onPress={handlePayNow}
                  loading={isPaying}
                  disabled={isPaying}
                />
              </View>
            )}
        </Card>

        {/* Padding so nothing is hidden */}
        <View style={{height: 140}} />
      </ScrollView>

      {/* Cancellation Action Bottom Bar */}
      {isCancellableTime && (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) + 14 }]}>
          {isPaidOnline ? (
            <View style={styles.paidOnlineNoticeContainer}>
              <Ionicons name="information-circle-outline" size={22} color={THEME.colors.accent} style={{ marginRight: 8 }} />
              <Text style={styles.paidOnlineNoticeText}>
                {PAYMENT_MESSAGES.CANCEL_PAID_ONLINE_NOTICE}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.cancelOrderButton}
              onPress={handleCancelOrder}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cancelGradientFill}
              >
                <Ionicons name="close-circle-outline" size={18} color="#FFFFFF" style={styles.cancelBtnIcon} />
                <Text style={styles.cancelButtonText}>Cancel Order</Text>
                {remainingTime && (
                  <View style={styles.cancelTimerBadge}>
                    <Ionicons name="time-outline" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.cancelTimerText}>{remainingTime}</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Cancel Confirmation Modal */}
      <Modal
        visible={cancelModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
          <View style={styles.modalOverlay}>
            <View style={styles.cancelModalContent}>
              <View style={styles.warningIconContainer}>
                <Ionicons name="warning-outline" size={36} color={THEME.colors.error} />
              </View>
              <Text style={styles.cancelModalTitle}>Cancel Order?</Text>
              <Text style={styles.cancelModalSubtitle}>Are you sure you want to cancel this order? This action cannot be undone. Please let us know why.</Text>
              <TextInput
                style={styles.cancelReasonInput}
                placeholder="Reason for cancellation (optional)"
                placeholderTextColor={THEME.colors.placeholder}
                value={cancelReason}
                onChangeText={setCancelReason}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <View style={styles.cancelModalActions}>
                <TouchableOpacity
                  style={styles.keepOrderModalBtn}
                  onPress={() => setCancelModalVisible(false)}
                  disabled={cancelling}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={THEME.colors.ctaOrangeGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.keepOrderGradientFill}
                  >
                    <Ionicons name="checkmark-circle-outline" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text numberOfLines={1} style={styles.keepOrderBtnText}>Keep Order</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelOrderModalBtn}
                  onPress={confirmCancelOrder}
                  disabled={cancelling}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#EF4444', '#DC2626']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cancelOrderGradientFill}
                  >
                    {cancelling ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <View style={styles.cancelOrderBtnContent}>
                        <Ionicons name="close-circle-outline" size={17} color="#FFFFFF" style={{ marginRight: 5 }} />
                        <Text numberOfLines={1} style={styles.cancelOrderBtnText}>Cancel Order</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Cancellation Reason Modal */}
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
              placeholderTextColor={THEME.colors.placeholder}
              value={editReasonText}
              onChangeText={setEditReasonText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <OutlineButton
                  title="Cancel"
                  onPress={() => setEditReasonModalVisible(false)}
                  disabled={editingReason}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <PrimaryButton
                  title={editingReason ? "Updating..." : "Update"}
                  onPress={submitEditReason}
                  loading={editingReason}
                  disabled={editingReason}
                />
              </View>
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
          variant="customer"
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
    </PageBackground>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 16.5,
  },
  card: {
    marginBottom: 14,
    padding: 18,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderTitle: {
    fontSize: 17,
    fontFamily: THEME.fonts.serif,
    color: THEME.colors.textHeading,
    flex: 1,
    marginRight: 12,
  },
  cancellationCard: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF6ED',
  },
  cancellationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cancellationReasonTitle: {
    fontSize: 15,
    fontFamily: THEME.fonts.bold,
    color: THEME.colors.error,
    marginLeft: 8,
  },
  cancellationReasonText: {
    fontSize: 13.5,
    fontFamily: THEME.fonts.medium,
    color: '#8A2E12',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: THEME.fonts.serif,
    color: THEME.colors.textHeading,
    marginBottom: 14,
  },
  itemRowContainer: {
    paddingVertical: 10,
  },
  itemRowBorder: {
    borderTopWidth: 1,
    borderTopColor: THEME.colors.divider,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  itemImage: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#FFF1DE',
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    marginRight: 12,
  },
  placeholderImage: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#FFF1DE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 15,
    fontFamily: THEME.fonts.bold,
    color: THEME.colors.textHeading,
    lineHeight: 20,
  },
  itemFarmer: {
    fontSize: 12.5,
    fontFamily: THEME.fonts.medium,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  itemMeta: {
    fontSize: 12.5,
    fontFamily: THEME.fonts.medium,
    color: THEME.colors.textMuted,
    marginTop: 3,
  },
  itemBadgeRow: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  itemPriceCol: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    marginLeft: 10,
    paddingTop: 2,
  },
  itemTotal: {
    fontSize: 16,
    fontFamily: THEME.fonts.bold,
    color: THEME.colors.accentDeep,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFF1DE',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  addressText: {
    fontSize: 14,
    fontFamily: THEME.fonts.bold,
    color: THEME.colors.textHeading,
    lineHeight: 20,
  },
  addressSubText: {
    fontSize: 13,
    fontFamily: THEME.fonts.medium,
    color: THEME.colors.textSecondary,
    marginTop: 3,
    lineHeight: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.divider,
  },
  summaryLabel: {
    fontSize: 13.5,
    fontFamily: THEME.fonts.medium,
    color: THEME.colors.textSecondary,
    flexShrink: 0,
  },
  summaryLabelTotal: {
    fontSize: 15,
    fontFamily: THEME.fonts.bold,
    color: THEME.colors.textHeading,
  },
  summaryValue: {
    fontSize: 13.5,
    fontFamily: THEME.fonts.bold,
    color: THEME.colors.textHeading,
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  summaryTotal: {
    fontSize: 19,
    fontFamily: THEME.fonts.serif,
    color: THEME.colors.accentDeep,
  },
  paidInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.successBg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: THEME.radius.inputs,
    marginTop: 14,
  },
  paidInfoText: {
    color: THEME.colors.success,
    fontSize: 13.5,
    fontFamily: THEME.fonts.bold,
    marginLeft: 8,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 14,
    backgroundColor: THEME.colors.cardBg,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.cardBorder,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 6,
  },
  cancelOrderButton: {
    borderRadius: THEME.radius.pill,
    overflow: 'hidden',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  cancelGradientFill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: THEME.radius.pill,
  },
  cancelBtnIcon: {
    marginRight: 6,
  },
  cancelButtonText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  cancelTimerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  cancelTimerText: {
    fontFamily: THEME.fonts.semiBold,
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  paidOnlineNoticeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF6ED',
    borderWidth: 1,
    borderColor: '#F59A4A',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: THEME.radius.inputs,
    width: '100%',
  },
  paidOnlineNoticeText: {
    color: THEME.colors.accentDeep,
    fontSize: 12.5,
    fontFamily: THEME.fonts.medium,
    flex: 1,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(42, 23, 16, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: THEME.colors.cardBg,
    borderRadius: THEME.radius.dialogs,
    padding: 22,
    width: '100%',
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    ...THEME.shadows.card,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: THEME.fonts.serif,
    color: THEME.colors.textHeading,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13.5,
    fontFamily: THEME.fonts.medium,
    color: THEME.colors.textSecondary,
    marginBottom: 16,
    lineHeight: 19,
  },
  reasonInput: {
    backgroundColor: THEME.colors.inputBg,
    borderWidth: 1,
    borderColor: THEME.colors.inputBorder,
    borderRadius: THEME.radius.inputs,
    padding: 14,
    fontSize: 14,
    fontFamily: THEME.fonts.medium,
    color: THEME.colors.textBase,
    minHeight: 100,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
  },
  cancelModalContent: {
    backgroundColor: THEME.colors.cardBg,
    borderRadius: THEME.radius.dialogs,
    paddingHorizontal: 20,
    paddingVertical: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    ...THEME.shadows.card,
  },
  warningIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  cancelModalTitle: {
    fontSize: 22,
    fontFamily: THEME.fonts.serif,
    color: THEME.colors.textHeading,
    marginBottom: 6,
    textAlign: 'center',
  },
  cancelModalSubtitle: {
    fontSize: 13.5,
    fontFamily: THEME.fonts.regular,
    color: THEME.colors.textSecondary,
    marginBottom: 20,
    lineHeight: 19,
    textAlign: 'center',
  },
  cancelReasonInput: {
    backgroundColor: THEME.colors.inputBg,
    borderWidth: 1,
    borderColor: THEME.colors.inputBorder,
    borderRadius: THEME.radius.inputs,
    padding: 14,
    fontSize: 14,
    fontFamily: THEME.fonts.medium,
    color: THEME.colors.textBase,
    minHeight: 90,
    width: '100%',
    marginBottom: 20,
  },
  cancelModalActions: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  keepOrderModalBtn: {
    flex: 1,
    height: 46,
    borderRadius: THEME.radius.inputs,
    overflow: 'hidden',
    ...THEME.shadows.primaryButton,
  },
  keepOrderGradientFill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  keepOrderBtnText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 13.5,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  cancelOrderModalBtn: {
    flex: 1,
    height: 46,
    borderRadius: THEME.radius.inputs,
    overflow: 'hidden',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelOrderGradientFill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  cancelOrderBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelOrderBtnText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 13.5,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  reviewActionContainer: {
    backgroundColor: '#FFF9F2',
    borderRadius: THEME.radius.inputs,
    borderWidth: 1,
    borderColor: THEME.colors.inputBorder,
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
    fontFamily: THEME.fonts.bold,
    color: THEME.colors.success,
    marginLeft: 6,
  },
  reviewedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  reviewedTextSnippet: {
    fontSize: 13,
    fontFamily: THEME.fonts.medium,
    color: THEME.colors.textSecondary,
    fontStyle: 'italic',
    marginLeft: 8,
    flex: 1,
  },
  reviewedActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.divider,
    paddingTop: 8,
  },
  reviewEditBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radius.smallButtons,
    backgroundColor: THEME.colors.chipBg,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    marginRight: 8,
  },
  reviewEditBtnText: {
    fontSize: 12,
    fontFamily: THEME.fonts.semiBold,
    color: THEME.colors.accent,
  },
  reviewDeleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radius.smallButtons,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  reviewDeleteBtnText: {
    fontSize: 12,
    fontFamily: THEME.fonts.semiBold,
    color: THEME.colors.error,
  },
  notReviewedBox: {
    width: '100%',
  },
  ratePrompt: {
    fontSize: 13,
    fontFamily: THEME.fonts.bold,
    color: THEME.colors.textHeading,
    marginBottom: 6,
  },
  rateActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  writeReviewBtn: {
    backgroundColor: THEME.colors.accentDeep,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: THEME.radius.smallButtons,
  },
  writeReviewBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: THEME.fonts.bold,
  },
});

export default CustomerOrderDetailsScreen;


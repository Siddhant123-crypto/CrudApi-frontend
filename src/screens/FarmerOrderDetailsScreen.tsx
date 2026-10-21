import React, { useState, useEffect } from 'react';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
import { getProductImageUrl } from '../services/productService';
import { getFarmerItemsStatus } from '../services/orderService';
import { OrderStatusBadge } from '../components/orders/OrderStatusBadge';
import { OrderTimeline } from '../components/orders/OrderTimeline';
import { FarmerPaymentBadge } from '../components/orders/FarmerPaymentBadge';
import { FARMER_THEME } from '../constants/farmerTheme';
import { FarmerPageBackground } from '../components/farmer/FarmerPageBackground';
import { FarmerHeader } from '../components/farmer/FarmerHeader';
import { FarmerCard } from '../components/farmer/FarmerCard';
import { FarmerStickyBar } from '../components/farmer/FarmerUI';
import {
  FarmerGoldButton,
  FarmerDeepButton,
  FarmerOutlineButton,
} from '../components/farmer/FarmerButtons';
import { FarmerSuccessModal } from '../components/farmer/FarmerSuccessModal';

const FarmerOrderDetailsScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { orderId, initialOrder } = route.params;
  const [order, setOrder] = useState<any>(initialOrder || null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successModalData, setSuccessModalData] = useState<{
    title: string;
    message: string;
    buttonText: string;
  }>({
    title: 'Order Accepted!',
    message: 'Order accepted successfully. You can now start preparing the fresh items.',
    buttonText: 'Awesome, Got it!',
  });

  const fetchOrderDetails = async () => {
    try {
      const response = await api.get(`/order/${orderId}`);
      setOrder(response.data);
    } catch (error) {
      console.log('Error fetching order details:', error);
      if (!initialOrder) {
        Alert.alert('Error', 'Failed to load order details');
        navigation.goBack();
      }
    } finally {
      setLoading(false);
    }
  };

  const { refreshUnreadCount } = require('../context/NotificationContext').useNotification();

  useEffect(() => {
    fetchOrderDetails();
    // Mark as seen if it's pending
    if (initialOrder && getFarmerItemsStatus(initialOrder.items || []) === 'PENDING') {
      api
        .put('/order/farmer/mark-orders-seen')
        .then(() => {
          refreshUnreadCount();
        })
        .catch((err) => console.log('Error marking orders as seen', err));
    }
  }, [orderId]);

  const fStatus = getFarmerItemsStatus(order?.items || []);

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      if (newStatus === 'CONFIRMED') {
        await api.put(`/order/${orderId}/accept`);
        setSuccessModalData({
          title: 'Order Accepted!',
          message: 'Order accepted successfully! You can now start preparing the fresh produce for the customer.',
          buttonText: 'Awesome, Got it!',
        });
        setSuccessModalVisible(true);
      } else if (newStatus === 'CANCELLED') {
        let url = `/order/${orderId}/farmer-cancel`;
        if (declineReason.trim()) {
          url += `?reason=${encodeURIComponent(declineReason.trim())}`;
        }
        await api.put(url);
        Alert.alert('Success', 'Order declined successfully');
        setShowDeclineModal(false);
        setDeclineReason('');
      } else {
        await api.put(`/order/${orderId}/status?status=${newStatus}`);
        const statusMap: Record<string, string> = {
          PROCESSING: 'Preparing Items',
          OUT_FOR_DELIVERY: 'Out for Delivery',
          DELIVERED: 'Delivered',
        };
        setSuccessModalData({
          title: 'Status Updated!',
          message: `Order status has been updated to "${statusMap[newStatus] || newStatus}" successfully.`,
          buttonText: 'Great, Continue',
        });
        setSuccessModalVisible(true);
      }
      fetchOrderDetails();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <FarmerPageBackground>
        <FarmerHeader
          variant="inner"
          title="Customer Product Detail"
          titleAlign="left"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={FARMER_THEME.colors.emeraldPrimary} />
        </View>
      </FarmerPageBackground>
    );
  }

  if (!order) return null;

  const getAvailableActions = () => {
    if (fStatus === 'PENDING') {
      return (
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={() => updateStatus('CONFIRMED')}
            disabled={updating}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={FARMER_THEME.colors.primaryBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.btnGradient}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text numberOfLines={1} style={styles.btnText}>Accept Order</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.declineBtn}
            onPress={() => setShowDeclineModal(true)}
            disabled={updating}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.btnGradient}
            >
              <Ionicons name="close-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text numberOfLines={1} style={styles.btnText}>Decline</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      );
    }
    if (fStatus === 'CONFIRMED') {
      return (
        <View style={{ width: '100%' }}>
          <FarmerDeepButton
            title="Start Processing"
            onPress={() => updateStatus('PROCESSING')}
            disabled={updating}
          />
        </View>
      );
    }
    if (fStatus === 'PROCESSING') {
      return (
        <View style={{ width: '100%' }}>
          <FarmerDeepButton
            title="Mark as Out for Delivery"
            onPress={() => updateStatus('OUT_FOR_DELIVERY')}
            disabled={updating}
          />
        </View>
      );
    }
    if (fStatus === 'OUT_FOR_DELIVERY') {
      return (
        <View style={{ width: '100%' }}>
          <FarmerDeepButton
            title="Confirm Delivery"
            onPress={() => updateStatus('DELIVERED')}
            disabled={updating}
          />
        </View>
      );
    }
    return null;
  };

  return (
    <FarmerPageBackground>
      {/* Inner FarmerHeader */}
      <FarmerHeader
        variant="inner"
        title="Customer Product Detail"
        titleAlign="left"
        subtitle={`Order #${order.orderNumber ? order.orderNumber.substring(0, 10) : order.orderId.substring(0, 8)}`}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Customer & Delivery Address Card */}
        <FarmerCard style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.avatarTile}>
              <Ionicons name="person" size={24} color={FARMER_THEME.colors.forestGreen} />
            </View>
            <View style={styles.customerHeaderInfo}>
              <Text style={styles.customerName}>{order.customerName}</Text>
              <Text style={styles.customerMobile}>{order.customerMobile}</Text>
            </View>
          </View>

          <View style={styles.paymentBadgeRow}>
            <FarmerPaymentBadge
              paymentMethod={order.paymentMethod}
              paymentStatus={order.paymentStatus}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.addressRow}>
            <View style={styles.addressIconTile}>
              <Ionicons name="location" size={16} color={FARMER_THEME.colors.forestGreen} />
            </View>
            <View style={styles.addressTextContainer}>
              <Text style={styles.addressText}>{order.deliveryAddress}</Text>
              <Text style={styles.addressSubText}>
                {order.village}, {order.state} {order.postalCode}
              </Text>
            </View>
          </View>
        </FarmerCard>

        {/* Current Status Timeline Card */}
        <FarmerCard style={styles.sectionCard}>
          <View style={styles.statusSectionHeader}>
            <Text style={styles.sectionTitle}>Current Status</Text>
            <OrderStatusBadge status={fStatus} variant="farmer" />
          </View>
          <OrderTimeline status={fStatus} isFarmer={true} variant="farmer" />
        </FarmerCard>

        {/* Cancellation Reason Card (if cancelled) */}
        {fStatus === 'CANCELLED' && (
          <FarmerCard style={styles.cancelledCard}>
            <View style={styles.cancellationHeader}>
              <Ionicons name="alert-circle" size={20} color="#C0392B" />
              <Text style={styles.cancellationReasonTitle}>Cancellation Reason</Text>
            </View>
            <Text style={styles.cancellationReasonText}>
              {order.cancellationReason || 'No specific reason provided by the customer.'}
            </Text>
          </FarmerCard>
        )}

        {/* Ordered Items & Bill Summary Card */}
        <FarmerCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Ordered Items</Text>
          {order.items &&
            order.items.map((item: any, index: number) => {
              const imageUrl = item.imageUrl ? getProductImageUrl(item.imageUrl) : null;
              return (
                <View
                  key={index}
                  style={[styles.itemRow, index > 0 && styles.itemRowBorder]}
                >
                  {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.itemImage} />
                  ) : (
                    <View style={styles.placeholderImage}>
                      <Ionicons name="leaf-outline" size={20} color={FARMER_THEME.colors.emeraldPrimary} />
                    </View>
                  )}
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.productName}</Text>
                    <Text style={styles.itemMeta}>
                      {item.quantity} {item.unit} x ₹{item.price}
                    </Text>
                    <View style={{ marginTop: 6 }}>
                      <OrderStatusBadge status={item.status} variant="farmer" />
                    </View>
                  </View>
                  <Text style={styles.itemTotal}>₹{item.subtotal?.toFixed(2)}</Text>
                </View>
              );
            })}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{order.totalAmount?.toFixed(2)}</Text>
          </View>

          <View style={styles.bottomPaymentBadgeRow}>
            <FarmerPaymentBadge
              paymentMethod={order.paymentMethod}
              paymentStatus={order.paymentStatus}
            />
          </View>
        </FarmerCard>
      </ScrollView>

      {/* Sticky Farmer Bottom Bar for Actions */}
      {fStatus !== 'DELIVERED' && fStatus !== 'CANCELLED' && (
        <FarmerStickyBar style={[styles.bottomBarContainer, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
          {updating ? (
            <View style={styles.updatingLoader}>
              <ActivityIndicator color={FARMER_THEME.colors.emeraldPrimary} />
            </View>
          ) : (
            getAvailableActions()
          )}
        </FarmerStickyBar>
      )}

      {/* Decline Reason Modal */}
      <Modal visible={showDeclineModal} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Decline Order</Text>
              <Text style={styles.modalSubtitle}>
                Please provide a reason for declining this order:
              </Text>
              <TextInput
                style={styles.reasonInput}
                placeholder="e.g. Out of stock, Cannot deliver to this area..."
                placeholderTextColor={FARMER_THEME.colors.placeholder}
                value={declineReason}
                onChangeText={setDeclineReason}
                multiline
                numberOfLines={3}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalBtnCancel}
                  onPress={() => {
                    setShowDeclineModal(false);
                    setDeclineReason('');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalBtnCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalBtnConfirm,
                    !declineReason.trim() && { opacity: 0.5 },
                  ]}
                  onPress={() => updateStatus('CANCELLED')}
                  disabled={!declineReason.trim() || updating}
                  activeOpacity={0.8}
                >
                  {updating ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.modalBtnConfirmText}>Decline Order</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Celebratory Farmer Success Modal */}
      <FarmerSuccessModal
        visible={successModalVisible}
        title={successModalData.title}
        message={successModalData.message}
        orderNumber={order?.id ? String(order.id) : String(orderId)}
        customerName={order?.customerName || order?.user?.fullName || order?.user?.name}
        buttonText={successModalData.buttonText}
        onClose={() => setSuccessModalVisible(false)}
      />
    </FarmerPageBackground>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 170, // Space for sticky bottom bar
  },
  sectionCard: {
    marginBottom: 14,
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarTile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: FARMER_THEME.colors.pastelGreen,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: FARMER_THEME.colors.cardBorder,
  },
  customerHeaderInfo: {
    marginLeft: 12,
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#0E3B29',
  },
  customerMobile: {
    fontSize: 13,
    color: FARMER_THEME.colors.sageText,
    fontFamily: FARMER_THEME.fonts.medium,
    marginTop: 2,
  },
  paymentBadgeRow: {
    marginTop: 10,
  },
  divider: {
    height: 1,
    backgroundColor: FARMER_THEME.colors.divider,
    marginVertical: 14,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressIconTile: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: FARMER_THEME.colors.pastelGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
    borderWidth: 1,
    borderColor: FARMER_THEME.colors.cardBorder,
  },
  addressTextContainer: {
    flex: 1,
  },
  addressText: {
    fontSize: 13.5,
    fontFamily: FARMER_THEME.fonts.medium,
    color: '#1B2A22',
    lineHeight: 20,
  },
  addressSubText: {
    fontSize: 12.5,
    fontFamily: FARMER_THEME.fonts.regular,
    color: FARMER_THEME.colors.sageText,
    marginTop: 2,
  },
  statusSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#0E3B29',
    marginBottom: 8,
  },
  cancelledCard: {
    marginBottom: 14,
    padding: 16,
    borderColor: '#FECACA',
    backgroundColor: '#FDE6E2',
  },
  cancellationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cancellationReasonTitle: {
    fontSize: 15,
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#C0392B',
    marginLeft: 8,
  },
  cancellationReasonText: {
    fontSize: 13.5,
    fontFamily: FARMER_THEME.fonts.regular,
    color: '#7F1D1D',
    lineHeight: 20,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  itemRowBorder: {
    borderTopWidth: 1,
    borderTopColor: FARMER_THEME.colors.cardBorder,
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: FARMER_THEME.colors.cardBorder,
  },
  placeholderImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: FARMER_THEME.colors.pastelGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: FARMER_THEME.colors.cardBorder,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontFamily: FARMER_THEME.fonts.semiBold,
    color: '#0E3B29',
  },
  itemMeta: {
    fontSize: 12.5,
    fontFamily: FARMER_THEME.fonts.regular,
    color: FARMER_THEME.colors.sageText,
    marginTop: 3,
  },
  itemTotal: {
    fontSize: 15,
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#1B2A22',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: FARMER_THEME.colors.cardBorder,
  },
  totalLabel: {
    fontSize: 15,
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#0E3B29',
  },
  totalValue: {
    fontSize: 20,
    fontFamily: FARMER_THEME.fonts.serifSemiBold,
    color: '#0E3B29',
  },
  bottomPaymentBadgeRow: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  bottomBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  acceptBtn: {
    flex: 1,
    height: 46,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#115C35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  declineBtn: {
    flex: 1,
    height: 46,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  btnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  btnText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  updatingLoader: {
    padding: 16,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6,32,26,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FBFEF9',
    borderRadius: 22,
    padding: 22,
    width: '100%',
    borderWidth: 1,
    borderColor: FARMER_THEME.colors.cardBorder,
    ...FARMER_THEME.shadows.card,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#0E3B29',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    fontFamily: FARMER_THEME.fonts.regular,
    color: FARMER_THEME.colors.sageText,
    marginBottom: 14,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: FARMER_THEME.colors.inputBorder,
    backgroundColor: FARMER_THEME.colors.inputBg,
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    fontFamily: FARMER_THEME.fonts.regular,
    color: '#1B2A22',
    textAlignVertical: 'top',
    height: 96,
    marginBottom: 18,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalBtnCancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FARMER_THEME.colors.cardBorder,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancelText: {
    color: FARMER_THEME.colors.sageText,
    fontSize: 14,
    fontFamily: FARMER_THEME.fonts.semiBold,
  },
  modalBtnConfirm: {
    backgroundColor: '#C0392B',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnConfirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FARMER_THEME.fonts.bold,
  },
});

export default FarmerOrderDetailsScreen;

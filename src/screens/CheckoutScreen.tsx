import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {useAuth} from '../context/AuthContext';
import {getProductImageUrl} from '../services/productService';
import {getUserById} from '../services/userService';
import {startOnlinePayment, getPaymentErrorMessage, isRazorpayTestKey} from '../services/paymentService';
import {PAYMENT_MESSAGES} from '../constants/paymentMessages';
import api from '../services/api';
import {PaymentMethod} from '../types';
import {canReuseOrder, parseCreatedTime} from '../utils/orderReuseUtils';
import {PageBackground} from '../components/ui/PageBackground';
import {ThemedHeader} from '../components/ui/ThemedHeader';
import {Card} from '../components/ui/Card';
import {MaroonButton} from '../components/ui/Buttons';
import {useTranslation} from 'react-i18next';
import {THEME} from '../constants/theme';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {getPaymentMessage} from '../utils/paymentMessageUtils';
import {mapApiError} from '../utils/errorUtils';
import {formatCurrency} from '../utils/formatters';

const CheckoutScreen = ({route, navigation}: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const {orderItems, totalAmount} = route.params || {};
  const {user} = useAuth();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [village, setVillage] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [state, setState] = useState('Maharashtra');

  // Payment method selection ('COD' | 'ONLINE')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ONLINE');

  // Track an already-created order so user can retry payment without creating duplicate orders
  const [pendingOrder, setPendingOrder] = useState<any>(null);
  const [paymentErrorNotice, setPaymentErrorNotice] = useState<string | null>(null);
  const [isTestMode, setIsTestMode] = useState<boolean>(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (user?.userId) {
          const res = await getUserById(user.userId);
          const userData = res?.response || res;
          if (userData) {
            if (userData.address) setAddress(userData.address);
            if (userData.village) setVillage(userData.village);
            if (userData.postalCode) setPostalCode(userData.postalCode);
            if (userData.state) setState(userData.state);
          }
        }
      } catch (error) {
        console.log('Error fetching user data in checkout:', error);
      }
    };
    fetchUserData();
  }, [user]);

  if (!orderItems || orderItems.length === 0) {
    return (
      <PageBackground style={styles.errorContainer}>
        <ThemedHeader variant="inner" title={t('checkout.checkout', 'Checkout')} onBackPress={() => navigation.goBack()} />
        <View style={styles.emptyContent}>
          <Text style={styles.errorText}>{t('checkout.noItems', 'No items to checkout.')}</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>{t('common.back', 'Go Back')}</Text>
          </TouchableOpacity>
        </View>
      </PageBackground>
    );
  }

  const executeOnlinePayment = async (orderToPay: any) => {
    setLoading(true);
    setPaymentErrorNotice(null);
    try {
      const result = await startOnlinePayment(orderToPay, user);
      if (typeof result.isTestMode === 'boolean') {
        setIsTestMode(result.isTestMode);
      }

      if (result.success) {
        setPendingOrder(null);
        // Reset navigation to PaymentSuccess so user cannot go back to checkout or payment sheet
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'PaymentSuccess',
              params: {
                orderId: result.orderId || orderToPay.orderId,
                orderNumber: result.orderNumber || orderToPay.orderNumber,
                totalAmount: result.totalAmount || orderToPay.totalAmount || totalAmount,
                paymentId: result.paymentId,
                isTestMode: result.isTestMode,
              },
            },
          ],
        });
      } else if (result.reason === 'VERIFY_FAILED') {
        // Payment went through on Razorpay, but verify call failed on server
        Alert.alert(
          t('payments.paymentStatus', 'Payment Status'),
          result.message || getPaymentMessage('VERIFICATION_PROBLEM', t),
          [
            {
              text: t('checkout.viewOrder', 'View Order'),
              onPress: () => {
                navigation.replace('CustomerOrderDetails', {orderId: orderToPay.orderId});
              },
            },
          ]
        );
      } else {
        // User cancelled or payment failed on Razorpay sheet
        const isCancelled = result.reason === 'CANCELLED';
        const msg = isCancelled
          ? (result.message || getPaymentMessage('PAYMENT_CANCELLED', t))
          : (result.message || getPaymentMessage('PAYMENT_FAILED', t));
        setPaymentErrorNotice(msg);
        Alert.alert(
          isCancelled ? t('payments.paymentCancelled', 'Payment Cancelled') : t('payments.paymentFailed', 'Payment Failed'),
          msg
        );
      }
    } catch (err: any) {
      console.log('Payment execution error:', err?.message);
      const msg = getPaymentErrorMessage(err);
      setPaymentErrorNotice(msg);
      Alert.alert(t('payments.paymentFailed', 'Payment Failed'), msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (loading) return; // Prevent double taps

    // If an order has already been created for this checkout and payment failed/cancelled,
    // retry payment directly for the SAME order id without creating a duplicate order
    if (pendingOrder) {
      await executeOnlinePayment(pendingOrder);
      return;
    }

    if (!address.trim() || !village.trim() || !postalCode.trim() || !state.trim()) {
      Alert.alert(t('common.error', 'Missing Info'), t('checkout.fillAllAddress', 'Please fill in all address fields.'));
      return;
    }

    setLoading(true);
    try {
      // Check if a matching pending unpaid ONLINE order already exists for this exact cart & address
      if (paymentMethod === 'ONLINE') {
        try {
          const myOrdersRes = await api.get('/order/customer/my-orders');
          const existingOrders = Array.isArray(myOrdersRes.data) ? myOrdersRes.data : [];
          const now = Date.now();
          const addressForm = {
            deliveryAddress: address,
            village,
            postalCode,
            state,
          };

          const matches = existingOrders.filter((o: any) =>
            canReuseOrder(o, orderItems, totalAmount, addressForm, now)
          );

          if (matches.length > 0) {
            // Pick the newest matching order
            matches.sort((a: any, b: any) => parseCreatedTime(b.createdOn) - parseCreatedTime(a.createdOn));
            const reusableOrder = matches[0];
            setPendingOrder(reusableOrder);
            await executeOnlinePayment(reusableOrder);
            return;
          }
        } catch (checkErr) {
          console.log('Error checking existing pending orders:', checkErr);
        }
      }

      const items = orderItems.map((item: any) => ({
        productId: item.product.productId,
        quantity: item.quantity,
      }));

      const payload = {
        paymentMethod: paymentMethod === 'ONLINE' ? 'ONLINE' : 'COD',
        deliveryAddress: address.trim(),
        village: village.trim(),
        postalCode: postalCode.trim(),
        state: state.trim(),
        items,
      };

      const response = await api.post('/order/create', payload);

      if (response.status === 201 || response.status === 200) {
        const createdOrder = response.data.response;

        if (paymentMethod === 'ONLINE') {
          // Store order in state so we can retry if needed without duplicating
          setPendingOrder(createdOrder);
          await executeOnlinePayment(createdOrder);
        } else {
          // Cash on Delivery success
          navigation.replace('OrderSuccess', {
            orderNumber: createdOrder.orderNumber,
            totalAmount: createdOrder.totalAmount,
          });
        }
      } else {
        throw new Error('Unexpected server response');
      }
    } catch (error: any) {
      console.log('Error placing order:', error.response?.data || error.message);
      Alert.alert(
        t('checkout.orderFailed', 'Order Failed'),
        mapApiError(error, t)
      );
    } finally {
      setLoading(false);
    }
  };

  const getButtonTitle = () => {
    if (pendingOrder) return getPaymentMessage('RETRY_BUTTON', t);
    if (paymentMethod === 'ONLINE') return getPaymentMessage('PAY_AND_ORDER_BUTTON', t);
    return getPaymentMessage('PLACE_ORDER_COD', t);
  };

  return (
    <PageBackground style={styles.container}>
      <ThemedHeader
        variant="inner"
        title={t('checkout.checkout', 'Checkout')}
        onBackPress={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Order Summary Card */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('cart.orderSummary', 'Order Summary')}</Text>
            <Card style={styles.cardContainer}>
              {orderItems.map((item: any, index: number) => {
                const imageUrl = item.product.productPhoto
                  ? getProductImageUrl(item.product.productPhoto)
                  : null;
                const isLast = index === orderItems.length - 1;

                return (
                  <TouchableOpacity 
                    key={index} 
                    style={[styles.itemCard, !isLast && styles.itemCardBorder]}
                    onPress={() => navigation.navigate('ProductDetail', { product: item.product })}
                    activeOpacity={0.7}
                  >
                    {imageUrl ? (
                      <Image source={{uri: imageUrl}} style={styles.itemImage} />
                    ) : (
                      <View style={styles.placeholderImage}>
                        <Text style={{ fontSize: 20 }}>🌾</Text>
                      </View>
                    )}
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemName} numberOfLines={1}>{item.product.productName}</Text>
                      <Text style={styles.itemSub}>
                        {item.quantity} {item.product.unit} x {formatCurrency(item.product.price)}
                      </Text>
                    </View>
                    <Text style={styles.itemTotal}>
                      {formatCurrency(item.product.price * item.quantity)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </Card>
          </View>

          {/* Delivery Details Card */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('checkout.deliveryAddress', 'Delivery Details')}</Text>
            <Card style={styles.cardContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('auth.address', 'Full Address')}</Text>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder={t('auth.addressPlaceholder', 'House No, Street, Landmark')}
                  placeholderTextColor={THEME.colors.placeholder}
                  value={address}
                  onChangeText={setAddress}
                  multiline
                  editable={!pendingOrder}
                />
              </View>
              <View style={styles.row}>
                <View style={[styles.inputGroup, {flex: 1, marginRight: 10}]}>
                  <Text style={styles.label}>{t('auth.village', 'Village/City')}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t('auth.villagePlaceholder', 'Village')}
                    placeholderTextColor={THEME.colors.placeholder}
                    value={village}
                    onChangeText={setVillage}
                    editable={!pendingOrder}
                  />
                </View>
                <View style={[styles.inputGroup, {flex: 1}]}>
                  <Text style={styles.label}>{t('auth.postalCode', 'Postal Code')}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t('auth.postalCodePlaceholder', 'PIN')}
                    placeholderTextColor={THEME.colors.placeholder}
                    value={postalCode}
                    onChangeText={setPostalCode}
                    keyboardType="numeric"
                    editable={!pendingOrder}
                  />
                </View>
              </View>
              <View style={[styles.inputGroup, { marginBottom: 0 }]}>
                <Text style={styles.label}>{t('auth.state', 'State')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.statePlaceholder', 'State')}
                  placeholderTextColor={THEME.colors.placeholder}
                  value={state}
                  onChangeText={setState}
                  editable={!pendingOrder}
                />
              </View>
            </Card>
          </View>

          {/* Payment Retry Banner (if previous attempt cancelled or failed) */}
          {pendingOrder && (
            <View style={styles.retryBanner}>
              <View style={styles.retryBannerHeader}>
                <Ionicons name="alert-circle" size={22} color={THEME.colors.accent} />
                <Text style={styles.retryBannerTitle}>{t('payments.orderCreatedAwaitingPayment', 'Order Created (Awaiting Payment)')}</Text>
              </View>
              <Text style={styles.retryBannerText}>
                {paymentErrorNotice || getPaymentMessage('PAYMENT_FAILED', t)}
              </Text>
              <Text style={styles.retryOrderNumber}>
                {t('orders.orderNumber', { id: pendingOrder.orderNumber ? pendingOrder.orderNumber.substring(0, 16) : pendingOrder.orderId?.substring(0, 8) })}
              </Text>
            </View>
          )}

          {/* Payment Method Card */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('checkout.paymentMethod', 'Payment Method')}</Text>
            <Card style={styles.cardContainer}>
              {/* Option 1: Online Payment (Razorpay) */}
              <TouchableOpacity
                style={[
                  styles.paymentOptionCard,
                  paymentMethod === 'ONLINE' && styles.paymentOptionCardSelected,
                ]}
                onPress={() => !pendingOrder && setPaymentMethod('ONLINE')}
                activeOpacity={0.8}
                disabled={!!pendingOrder}
              >
                <View style={styles.paymentOptionLeft}>
                  <View style={[styles.paymentIconBox, {backgroundColor: '#FFF1DE'}]}>
                    <Ionicons name="card-outline" size={22} color={THEME.colors.accentDeep} />
                  </View>
                  <View style={{marginLeft: 12, flex: 1}}>
                    <Text style={styles.paymentOptionTitle}>{t('checkout.onlinePayment', 'Online Payment')}</Text>
                    <Text style={styles.paymentOptionSubtitle}>{t('checkout.onlinePaymentDesc', 'UPI, Google Pay, PhonePe, Cards, NetBanking')}</Text>
                  </View>
                </View>
                <Ionicons
                  name={paymentMethod === 'ONLINE' ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={paymentMethod === 'ONLINE' ? THEME.colors.accentDeep : '#CDBBB0'}
                />
              </TouchableOpacity>

              {/* Test mode non-blocking info notice (test keys starting with rzp_test_ only) */}
              {paymentMethod === 'ONLINE' && isTestMode && (
                <View style={styles.testModeNotice}>
                  <Ionicons name="information-circle-outline" size={18} color="#D97706" style={{marginRight: 6, marginTop: 1}} />
                  <Text style={styles.testModeNoticeText}>
                    {getPaymentMessage('TEST_MODE_HINT', t)}
                  </Text>
                </View>
              )}

              {/* Option 2: Cash on Delivery (COD) */}
              <TouchableOpacity
                style={[
                  styles.paymentOptionCard,
                  styles.paymentOptionCardLast,
                  paymentMethod === 'COD' && styles.paymentOptionCardSelected,
                  pendingOrder && {opacity: 0.5},
                ]}
                onPress={() => !pendingOrder && setPaymentMethod('COD')}
                activeOpacity={0.8}
                disabled={!!pendingOrder}
              >
                <View style={styles.paymentOptionLeft}>
                  <View style={[styles.paymentIconBox, {backgroundColor: '#E3F3E8'}]}>
                    <Ionicons name="cash-outline" size={22} color={THEME.colors.success} />
                  </View>
                  <View style={{marginLeft: 12, flex: 1}}>
                    <Text style={styles.paymentOptionTitle}>{t('checkout.cashOnDelivery', 'Cash on Delivery (COD)')}</Text>
                    <Text style={styles.paymentOptionSubtitle}>{getPaymentMessage('COD_SUBTITLE', t)}</Text>
                  </View>
                </View>
                <Ionicons
                  name={paymentMethod === 'COD' ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={paymentMethod === 'COD' ? THEME.colors.accentDeep : '#CDBBB0'}
                />
              </TouchableOpacity>
            </Card>
          </View>

          <View style={{height: 140}} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky Bottom Bar with Total & MaroonButton */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, 16) },
          THEME.shadows.stickyBar,
        ]}
      >
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>{t('cart.totalAmount', 'Total Amount')}</Text>
          <Text style={styles.totalAmount}>{formatCurrency(totalAmount)}</Text>
        </View>
        <View style={styles.buttonWrapper}>
          <MaroonButton
            title={getButtonTitle()}
            onPress={handlePlaceOrder}
            loading={loading}
            disabled={loading}
          />
        </View>
      </View>
    </PageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: THEME.fonts.serif,
    color: THEME.colors.textHeading,
    marginBottom: 10,
    marginLeft: 4,
  },
  cardContainer: {
    padding: 18,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  itemCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.divider,
    marginBottom: 6,
    paddingBottom: 12,
  },
  itemImage: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FFF1DE',
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  placeholderImage: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FFF1DE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 14,
  },
  itemName: {
    fontSize: 15,
    fontFamily: THEME.fonts.bold,
    color: THEME.colors.textHeading,
  },
  itemSub: {
    fontSize: 13,
    fontFamily: THEME.fonts.medium,
    color: THEME.colors.textSecondary,
    marginTop: 3,
  },
  itemTotal: {
    fontSize: 16,
    fontFamily: THEME.fonts.serif,
    color: THEME.colors.accentDeep,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontFamily: THEME.fonts.semiBold,
    color: THEME.colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: THEME.colors.inputBg,
    borderWidth: 1,
    borderColor: THEME.colors.inputBorder,
    borderRadius: THEME.radius.inputs,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14.5,
    fontFamily: THEME.fonts.medium,
    color: THEME.colors.textBase,
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  retryBanner: {
    backgroundColor: '#FFF6ED',
    borderWidth: 1.5,
    borderColor: '#F59A4A',
    borderRadius: THEME.radius.smallCards,
    padding: 16,
    marginBottom: 20,
  },
  retryBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  retryBannerTitle: {
    fontSize: 14.5,
    fontFamily: THEME.fonts.bold,
    color: THEME.colors.accentDeep,
    marginLeft: 8,
  },
  retryBannerText: {
    fontSize: 13,
    fontFamily: THEME.fonts.regular,
    color: THEME.colors.textSecondary,
    lineHeight: 18,
  },
  retryOrderNumber: {
    fontSize: 12,
    fontFamily: THEME.fonts.bold,
    color: THEME.colors.accent,
    marginTop: 6,
  },
  testModeNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    marginTop: -4,
  },
  testModeNoticeText: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: THEME.fonts.medium,
    color: '#92400E',
    lineHeight: 18,
  },
  paymentOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.cardBg,
    borderWidth: 1.5,
    borderColor: THEME.colors.cardBorder,
    borderRadius: THEME.radius.inputs,
    padding: 14,
    marginBottom: 12,
  },
  paymentOptionCardLast: {
    marginBottom: 0,
  },
  paymentOptionCardSelected: {
    borderColor: THEME.colors.accentDeep,
    backgroundColor: '#FFF6ED',
  },
  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  paymentIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentOptionTitle: {
    fontSize: 14.5,
    fontFamily: THEME.fonts.bold,
    color: THEME.colors.textHeading,
  },
  paymentOptionSubtitle: {
    fontSize: 12,
    fontFamily: THEME.fonts.regular,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: THEME.colors.cardBg,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalContainer: {
    flex: 1,
    marginRight: 16,
  },
  totalLabel: {
    fontSize: 12.5,
    fontFamily: THEME.fonts.medium,
    color: THEME.colors.textSecondary,
  },
  totalAmount: {
    fontSize: 22,
    fontFamily: THEME.fonts.serif,
    color: THEME.colors.textHeading,
    marginTop: 2,
  },
  buttonWrapper: {
    flex: 1.3,
  },
  errorContainer: {
    flex: 1,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: THEME.fonts.medium,
    color: THEME.colors.textSecondary,
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: THEME.colors.accentDeep,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: THEME.radius.buttons,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontFamily: THEME.fonts.bold,
    fontSize: 15,
  },
});

export default CheckoutScreen;


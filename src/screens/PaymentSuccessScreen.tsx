import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  BackHandler,
  Animated,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { shortenId, formatPaymentDateTime } from '../utils/paymentFormatUtils';
import { PageBackground } from '../components/ui/PageBackground';
import { Card } from '../components/ui/Card';
import { PrimaryButton, OutlineButton } from '../components/ui/Buttons';
import { THEME } from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface PaymentSuccessParams {
  orderId: string;
  orderNumber?: string;
  totalAmount?: number;
  paymentId?: string;
  paidAt?: string;
  isTestMode?: boolean;
}

const PaymentSuccessScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const params: PaymentSuccessParams = route.params || {};
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);

  // Animation for green check icon (scale and opacity fade using built-in Animated API)
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  // Android hardware back goes to Home
  useEffect(() => {
    const onBackPress = () => {
      navigation.navigate(user?.role === 'FARMER' ? 'FarmerMain' : 'CustomerMain', {
        screen: user?.role === 'FARMER' ? 'Dashboard' : 'Home',
      });
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [navigation, user]);

  // If order details (amount, orderNumber) are missing from params, fetch them from backend
  useEffect(() => {
    const fetchMissingOrderDetails = async () => {
      if ((!params.totalAmount || !params.orderNumber) && params.orderId) {
        setLoading(true);
        try {
          const res = await api.get(`/order/${params.orderId}`);
          const fetched = res?.data?.response || res?.data;
          if (fetched) {
            setOrderData(fetched);
          }
        } catch (err) {
          console.log('[PaymentSuccess] Error fetching order details:', err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchMissingOrderDetails();
  }, [params.orderId, params.totalAmount, params.orderNumber]);

  const targetOrderId = params.orderId || orderData?.orderId;
  const resolvedOrderNumber = params.orderNumber || orderData?.orderNumber;
  const resolvedAmount =
    typeof params.totalAmount === 'number'
      ? params.totalAmount
      : typeof orderData?.totalAmount === 'number'
      ? orderData.totalAmount
      : 0;
  const resolvedPaymentId = params.paymentId || orderData?.transactionId;
  const resolvedPaidAt = params.paidAt || orderData?.updatedOn || orderData?.createdOn;

  const handleViewOrder = () => {
    if (targetOrderId) {
      navigation.navigate('CustomerOrderDetails', { orderId: targetOrderId });
    } else {
      navigation.navigate(user?.role === 'FARMER' ? 'FarmerMain' : 'CustomerMain', {
        screen: 'Orders',
      });
    }
  };

  const handleContinueShopping = () => {
    navigation.navigate(user?.role === 'FARMER' ? 'FarmerMain' : 'CustomerMain', {
      screen: user?.role === 'FARMER' ? 'Dashboard' : 'Home',
    });
  };

  return (
    <PageBackground style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top + 20, 50),
            paddingBottom: Math.max(insets.bottom + 20, 36),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.iconCircle,
              {
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
              },
            ]}
          >
            <Ionicons name="checkmark" size={54} color={THEME.colors.success} />
          </Animated.View>

          <Text style={styles.title}>Payment Successful!</Text>
          <Text style={styles.subtitle}>Thank you! Your order has been placed.</Text>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={THEME.colors.accent} />
              <Text style={styles.loadingText}>Loading payment details...</Text>
            </View>
          ) : (
            <Card style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.label}>Amount Paid</Text>
                <Text style={styles.amountValue}>₹{resolvedAmount.toFixed(2)}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.label}>Order Number</Text>
                <Text style={styles.value}>
                  {resolvedOrderNumber ? resolvedOrderNumber.substring(0, 16) : 'N/A'}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.label}>Payment ID</Text>
                <Text style={styles.valueMonospace}>{shortenId(resolvedPaymentId)}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.label}>Payment Method</Text>
                <Text style={styles.value}>Online Payment</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.label}>Date & Time</Text>
                <Text style={styles.valueSmall}>{formatPaymentDateTime(resolvedPaidAt)}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.label}>Status</Text>
                <View style={styles.statusBadge}>
                  <Ionicons name="checkmark" size={13} color={THEME.colors.success} style={{ marginRight: 4 }} />
                  <Text style={styles.statusBadgeText}>Paid</Text>
                </View>
              </View>

              {params.isTestMode && (
                <View style={styles.testModeNoteBox}>
                  <Ionicons name="information-circle-outline" size={14} color="#B45309" style={{ marginRight: 5 }} />
                  <Text style={styles.testModeNoteText}>
                    Test payment: no real money was charged.
                  </Text>
                </View>
              )}
            </Card>
          )}
        </View>

        <View style={styles.bottomActions}>
          <PrimaryButton
            title="View Order"
            onPress={handleViewOrder}
          />
          <OutlineButton
            title="Continue Shopping"
            onPress={handleContinueShopping}
            style={{ marginTop: 12 }}
          />
        </View>
      </ScrollView>
    </PageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    paddingTop: 10,
  },
  iconCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: THEME.colors.successBg,
    borderWidth: 2,
    borderColor: '#C8E9D2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: THEME.colors.success,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  title: {
    fontSize: 26,
    fontFamily: THEME.fonts.serif,
    color: THEME.colors.textHeading,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14.5,
    fontFamily: THEME.fonts.medium,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  loadingBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    fontFamily: THEME.fonts.medium,
    color: THEME.colors.textSecondary,
    marginTop: 8,
  },
  detailsCard: {
    width: '100%',
    padding: 20,
    backgroundColor: THEME.colors.cardBg,
    borderRadius: THEME.radius.cards,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.divider,
  },
  label: {
    fontSize: 13.5,
    fontFamily: THEME.fonts.medium,
    color: THEME.colors.textSecondary,
  },
  value: {
    fontSize: 14,
    fontFamily: THEME.fonts.bold,
    color: THEME.colors.textHeading,
  },
  valueSmall: {
    fontSize: 13,
    fontFamily: THEME.fonts.medium,
    color: THEME.colors.textSecondary,
  },
  valueMonospace: {
    fontSize: 13,
    fontFamily: THEME.fonts.bold,
    color: THEME.colors.textHeading,
    letterSpacing: 0.4,
  },
  amountValue: {
    fontSize: 18,
    fontFamily: THEME.fonts.serif,
    color: THEME.colors.accentDeep,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.successBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.radius.pill,
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: THEME.fonts.bold,
    color: THEME.colors.success,
  },
  testModeNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  testModeNoteText: {
    fontSize: 12,
    fontFamily: THEME.fonts.medium,
    color: '#92400E',
    flex: 1,
  },
  bottomActions: {
    width: '100%',
    paddingTop: 24,
  },
});

export default PaymentSuccessScreen;

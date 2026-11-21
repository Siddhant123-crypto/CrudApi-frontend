import React, {useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  BackHandler,
  ScrollView,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {useAuth} from '../context/AuthContext';
import {PageBackground} from '../components/ui/PageBackground';
import {Card} from '../components/ui/Card';
import {PrimaryButton, OutlineButton} from '../components/ui/Buttons';
import {THEME} from '../constants/theme';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

const OrderSuccessScreen = ({route, navigation}: any) => {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const {orderNumber, totalAmount} = route.params || {};
  const {user} = useAuth();

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        navigation.navigate('Home');
        return true;
      }
    );
    return () => backHandler.remove();
  }, [navigation]);

  const handleViewOrders = () => {
    navigation.navigate(
      user?.role === 'FARMER' ? 'FarmerMain' : 'CustomerMain',
      { screen: 'Orders' }
    );
  };

  const handleContinueShopping = () => {
    navigation.navigate(
      user?.role === 'FARMER' ? 'FarmerMain' : 'CustomerMain',
      { screen: user?.role === 'FARMER' ? 'Dashboard' : 'Home' }
    );
  };

  return (
    <PageBackground style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top + 30, 60),
            paddingBottom: Math.max(insets.bottom + 20, 40),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Large soft green success circle */}
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark" size={54} color={THEME.colors.success} />
          </View>

          <Text style={styles.title}>{t('checkout.orderSuccessTitle', 'Order Placed!')}</Text>
          <Text style={styles.subtitle}>
            {t('payments.codSubtitle', 'Pay with cash when your order is delivered.')}
          </Text>

          {/* Order Summary Card */}
          <Card style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.label}>{t('orders.orderId', 'Order Number')}</Text>
              <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
                {orderNumber ? orderNumber.substring(0, 16) : 'N/A'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.label}>{t('checkout.paymentMethod', 'Payment Method')}</Text>
              <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
                {t('checkout.cashOnDelivery', 'Cash on Delivery').replace(/\s*\(COD\)/i, '').trim()}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.label}>{t('cart.totalAmount', 'Total Amount')}</Text>
              <Text style={styles.amountValue} numberOfLines={1}>
                ₹{totalAmount?.toFixed(2) || '0.00'}
              </Text>
            </View>
          </Card>
        </View>

        {/* Action Buttons */}
        <View style={styles.bottomActions}>
          <PrimaryButton
            title={t('payments.viewMyOrders', 'View My Orders')}
            onPress={handleViewOrders}
          />
          <OutlineButton
            title={t('payments.continueShopping', 'Continue Shopping')}
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
    paddingTop: 20,
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
    marginBottom: 24,
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
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14.5,
    fontFamily: THEME.fonts.medium,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 16,
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
    paddingVertical: 10,
    gap: 12,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.divider,
  },
  label: {
    fontSize: 13.5,
    fontFamily: THEME.fonts.medium,
    color: THEME.colors.textSecondary,
    flexShrink: 0,
  },
  value: {
    flex: 1,
    fontSize: 14.5,
    fontFamily: THEME.fonts.bold,
    color: THEME.colors.textHeading,
    textAlign: 'right',
  },
  amountValue: {
    flex: 1,
    fontSize: 18,
    fontFamily: THEME.fonts.serif,
    color: THEME.colors.accentDeep,
    textAlign: 'right',
  },
  bottomActions: {
    width: '100%',
    paddingTop: 24,
  },
});

export default OrderSuccessScreen;


import { TFunction } from 'i18next';
import { PAYMENT_MESSAGES } from '../constants/paymentMessages';

/**
 * Returns localized payment message or falls back to PAYMENT_MESSAGES constant.
 */
export const getPaymentMessage = (
  key: keyof typeof PAYMENT_MESSAGES,
  t: TFunction
): string => {
  const mapping: Record<keyof typeof PAYMENT_MESSAGES, string> = {
    PAYMENT_CANCELLED: 'payments.paymentCancelled',
    PAYMENT_FAILED: 'payments.paymentFailed',
    PAYMENT_SUCCESS: 'payments.paymentSuccessful',
    ORDER_PLACED_SUCCESS: 'checkout.orderSuccessTitle',
    ALREADY_PAID: 'payments.alreadyPaid',
    NOT_YOUR_ORDER: 'payments.notYourOrder',
    ORDER_NOT_FOUND: 'payments.orderNotFound',
    ORDER_SET_TO_COD: 'payments.orderSetToCod',
    VERIFICATION_PROBLEM: 'payments.verificationProblem',
    GATEWAY_PROBLEM: 'payments.gatewayProblem',
    NETWORK_PROBLEM: 'payments.networkProblem',
    SESSION_EXPIRED: 'payments.sessionExpired',
    LOGIN_BUTTON: 'auth.signIn',
    CANCEL_PAID_ONLINE_NOTICE: 'payments.cancelPaidOnlineNotice',
    FARMER_BADGE_COD: 'payments.farmerBadgeCod',
    FARMER_BADGE_PAID_ONLINE: 'payments.farmerBadgePaidOnline',
    TEST_MODE_HINT: 'payments.testModeHint',
    PAY_BUTTON: 'payments.payNow',
    PAY_AND_ORDER_BUTTON: 'payments.payAndPlaceOrder',
    RETRY_BUTTON: 'payments.retryPayment',
    PLACE_ORDER_COD: 'payments.placeOrderCod',
    COD_SUBTITLE: 'payments.codSubtitle',
    GENERAL_PAYMENT_ERROR: 'payments.paymentFailed',
  };

  const i18nKey = mapping[key];
  if (i18nKey) {
    return t(i18nKey, PAYMENT_MESSAGES[key]);
  }
  return PAYMENT_MESSAGES[key];
};

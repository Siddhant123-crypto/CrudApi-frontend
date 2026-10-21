/**
 * Payment and Order user-facing message constants in simple English.
 */
export const PAYMENT_MESSAGES = {
  PAYMENT_CANCELLED: 'Payment was cancelled. You can try again anytime.',
  PAYMENT_FAILED: 'Payment failed. Please try again.',
  PAYMENT_SUCCESS: 'Payment Successful',
  ORDER_PLACED_SUCCESS: 'Order Placed Successfully!',
  ALREADY_PAID: 'This order is already paid.',
  NOT_YOUR_ORDER: 'This order does not belong to your account.',
  ORDER_NOT_FOUND: 'Order not found.',
  ORDER_SET_TO_COD: 'This order is set to Cash on Delivery.',
  VERIFICATION_PROBLEM:
    'We could not verify your payment yet. If money was deducted, your order will update shortly. Please check My Orders.',
  GATEWAY_PROBLEM: 'Could not connect to the payment gateway. Please try again in a moment.',
  NETWORK_PROBLEM: 'Could not reach the server. Check your internet connection and try again.',
  SESSION_EXPIRED: 'Your session may have expired. Please log in again.',
  LOGIN_BUTTON: 'Log in',
  CANCEL_PAID_ONLINE_NOTICE:
    'This order is already paid online. Please contact support to cancel it or request a refund.',
  FARMER_BADGE_COD: 'Cash on Delivery: collect cash on delivery',
  FARMER_BADGE_PAID_ONLINE: 'Paid online',
  TEST_MODE_HINT:
    'Test mode: enter success@razorpay as the UPI ID to simulate a successful payment, or failure@razorpay to simulate a failure. Do not tap the PhonePe or Google Pay icons; they work only in live mode.',
  PAY_BUTTON: 'Pay Now',
  PAY_AND_ORDER_BUTTON: 'Pay & Place Order',
  RETRY_BUTTON: 'Retry Payment',
  PLACE_ORDER_COD: 'Place Order (COD)',
  COD_SUBTITLE: 'Pay with cash when your order is delivered.',
  GENERAL_PAYMENT_ERROR: 'Payment could not be completed. Please try again.',
};

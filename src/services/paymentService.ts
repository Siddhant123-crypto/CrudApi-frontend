import api from './api';
import RazorpayCheckout from 'react-native-razorpay';
import { PAYMENT_CONFIG } from '../constants/payment';
import {
  CreatePaymentOrderResponse,
  VerifyPaymentPayload,
  PaymentFlowResult,
  SyncPaymentResponse,
  User,
} from '../types';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

import {
  isRazorpayTestKey,
  sanitizeContact,
  sanitizeEmail,
} from '../utils/paymentFormatUtils';
import { PAYMENT_MESSAGES } from '../constants/paymentMessages';

export { isRazorpayTestKey, sanitizeContact, sanitizeEmail };

export const getPaymentErrorMessage = (error: any): string => {
  if (!error) {
    return PAYMENT_MESSAGES.PAYMENT_FAILED;
  }

  // Handle client-side / Razorpay errors
  if (error?.code === 0 || error?.code === 2) {
    return PAYMENT_MESSAGES.PAYMENT_CANCELLED;
  }

  if (typeof error?.description === 'string' && error.description.trim().length > 0) {
    const desc = error.description.trim();
    if (desc.toLowerCase().includes('cancelled')) {
      return PAYMENT_MESSAGES.PAYMENT_CANCELLED;
    }
    if (!desc.includes('{') && !desc.includes('null')) {
      return `${PAYMENT_MESSAGES.PAYMENT_FAILED} (${desc})`;
    }
  }

  if (error?.message && typeof error.message === 'string') {
    if (
      error.message.includes('Internet ya server') ||
      error.message.includes('Server se connect') ||
      error.message.includes('Could not reach the server')
    ) {
      return PAYMENT_MESSAGES.NETWORK_PROBLEM;
    }
  }

  if (!error?.response) {
    // Network error or no server response
    return PAYMENT_MESSAGES.NETWORK_PROBLEM;
  }

  const rawMsg =
    typeof error?.response?.data === 'string'
      ? error.response.data
      : error?.response?.data?.message || error?.response?.data?.error || error?.message || '';

  if (rawMsg.includes('Not your order')) {
    return PAYMENT_MESSAGES.NOT_YOUR_ORDER;
  }
  if (rawMsg.includes('Order is already paid')) {
    return PAYMENT_MESSAGES.ALREADY_PAID;
  }
  if (rawMsg.includes('Order ID mismatch') || rawMsg.includes('Invalid payment signature')) {
    return PAYMENT_MESSAGES.VERIFICATION_PROBLEM;
  }
  if (rawMsg.includes('Error connecting to payment gateway')) {
    return PAYMENT_MESSAGES.GATEWAY_PROBLEM;
  }
  if (rawMsg.includes('Order not found')) {
    return PAYMENT_MESSAGES.ORDER_NOT_FOUND;
  }
  if (rawMsg.includes('Order is set to COD')) {
    return PAYMENT_MESSAGES.ORDER_SET_TO_COD;
  }
  if (rawMsg.includes('Unauthorized') || rawMsg.includes('User not found')) {
    return PAYMENT_MESSAGES.SESSION_EXPIRED;
  }

  return PAYMENT_MESSAGES.GENERAL_PAYMENT_ERROR;
};

/**
 * 1. Request backend to create/retrieve Razorpay order for an unpaid order.
 * Endpoint: POST /api/payment/create-order
 */
export const createPaymentOrder = async (orderId: string): Promise<CreatePaymentOrderResponse> => {
  const response = await api.post('/api/payment/create-order', { orderId });
  return response.data;
};

/**
 * 2. Verify payment signature with backend.
 * Endpoint: POST /api/payment/verify
 */
export const verifyPayment = async (payload: VerifyPaymentPayload): Promise<any> => {
  const response = await api.post('/api/payment/verify', payload);
  return response.data;
};

/**
 * Sync payment status with backend by querying Razorpay on the server side.
 * Safe to call after any non-success Razorpay outcome.
 * Endpoint: POST /api/payment/sync
 */
export const syncPayment = async (orderId: string): Promise<SyncPaymentResponse | null> => {
  try {
    const response = await api.post('/api/payment/sync', { orderId });
    return response.data as SyncPaymentResponse;
  } catch {
    return null;
  }
};

/**
 * 3. Complete online payment flow:
 * - Fetches Razorpay order details from backend (amount in paise, keyId, razorpayOrderId)
 * - Opens native Razorpay checkout UI with prefilled customer data
 * - On payment authorization, verifies the cryptographic signature with backend
 * - If verify call fails, polls order up to 5 times (3s apart) to check if already marked PAID
 * - Handles "Order is already paid" gracefully by treating as SUCCESS and refreshing order
 * - Handles cancellation, payment failure, and verification states gracefully
 * - Never logs keys, signatures, or full payment payloads
 */
export const startOnlinePayment = async (
  order: { orderId: string; orderNumber?: string; totalAmount?: number },
  user?: Partial<User> | null
): Promise<PaymentFlowResult> => {
  const orderId = order.orderId;

  try {
    // Step A: Request payment order parameters from backend
    let paymentOrder: CreatePaymentOrderResponse;
    try {
      paymentOrder = await createPaymentOrder(orderId);
    } catch (createErr: any) {
      const serverMsg = createErr?.response?.data?.message || '';
      if (serverMsg.includes('Order is already paid')) {
        return {
          success: true,
          orderId,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          status: 'SUCCESS',
          message: PAYMENT_MESSAGES.ALREADY_PAID,
        };
      }
      throw createErr;
    }

    if (!paymentOrder || !paymentOrder.razorpayOrderId || !paymentOrder.keyId) {
      throw new Error(PAYMENT_MESSAGES.GATEWAY_PROBLEM);
    }

    // Step B: Prepare user prefill info (only valid fields, never hardcoded, no null/undefined)
    const prefill: Record<string, string> = {};
    if (user?.name && typeof user.name === 'string' && user.name.trim().length > 0) {
      prefill.name = user.name.trim();
    }
    const cleanEmail = sanitizeEmail(user?.email);
    if (cleanEmail) {
      prefill.email = cleanEmail;
    }
    const cleanContact = sanitizeContact(user?.mobile);
    if (cleanContact) {
      prefill.contact = cleanContact;
    }

    // Step C: Prepare Razorpay checkout options (ensure required fields and no null/undefined)
    const options: any = {
      key: paymentOrder.keyId,
      amount: Number(paymentOrder.amount), // Exact amount in paise from backend
      currency: paymentOrder.currency || PAYMENT_CONFIG.CURRENCY,
      order_id: paymentOrder.razorpayOrderId,
      name: PAYMENT_CONFIG.APP_NAME || 'Farm2Home',
      description: PAYMENT_CONFIG.DESCRIPTION || 'Farm2Home Fresh Produce Order',
      theme: { color: PAYMENT_CONFIG.THEME_COLOR },
    };

    if (Object.keys(prefill).length > 0) {
      options.prefill = prefill;
    }

    // Step D: Open Razorpay native checkout modal
    let razorpayResponse: any;
    try {
      razorpayResponse = await RazorpayCheckout.open(options);
    } catch (razorpayError: any) {
      // Dev-safe compact logging without leaking key, token or secrets
      if (__DEV__) {
        const safeErrorLog = {
          code: razorpayError?.code,
          description: razorpayError?.description,
          reason: razorpayError?.reason,
          source: razorpayError?.source,
          step: razorpayError?.step,
          order_id: razorpayError?.metadata?.order_id || razorpayError?.order_id,
          payment_id: razorpayError?.metadata?.payment_id || razorpayError?.payment_id,
        };
        console.log('[RAZORPAY ERROR]', JSON.stringify(safeErrorLog));
      }

      // Check if user cancelled the sheet
      const isCancelled =
        razorpayError?.code === 0 ||
        razorpayError?.code === 2 ||
        (typeof razorpayError?.description === 'string' &&
          razorpayError.description.toLowerCase().includes('cancelled'));

      let displayMessage: string;
      if (isCancelled) {
        displayMessage = PAYMENT_MESSAGES.PAYMENT_CANCELLED;
      } else if (
        typeof razorpayError?.description === 'string' &&
        razorpayError.description.trim().length > 0 &&
        !razorpayError.description.includes('{') &&
        !razorpayError.description.includes('null')
      ) {
        displayMessage = `${PAYMENT_MESSAGES.PAYMENT_FAILED} (${razorpayError.description.trim()})`;
      } else {
        displayMessage = PAYMENT_MESSAGES.PAYMENT_FAILED;
      }

      // Sync check: even on cancel/error, Razorpay may have captured the payment
      const syncRes = await syncPayment(orderId);
      if (syncRes?.paid) {
        return {
          success: true,
          orderId,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          status: 'SUCCESS',
          message: 'Payment verified successfully.',
          paymentId: syncRes.razorpayPaymentId ?? undefined,
          isTestMode: isRazorpayTestKey(paymentOrder.keyId),
        };
      }

      return {
        success: false,
        orderId,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: isCancelled ? 'CANCELLED' : 'PAYMENT_FAILED',
        reason: isCancelled ? 'CANCELLED' : 'PAYMENT_FAILED',
        message: displayMessage,
        error: razorpayError,
        isTestMode: isRazorpayTestKey(paymentOrder.keyId),
      };
    }

    // Step E: Verify signature on backend
    try {
      await verifyPayment({
        orderId,
        razorpay_order_id: razorpayResponse.razorpay_order_id,
        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
        razorpay_signature: razorpayResponse.razorpay_signature,
      });

      return {
        success: true,
        orderId,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: 'SUCCESS',
        message: 'Payment verified successfully.',
        paymentId: razorpayResponse.razorpay_payment_id,
        isTestMode: isRazorpayTestKey(paymentOrder.keyId),
      };
    } catch (verifyError: any) {
      const verifyMsg = verifyError?.response?.data?.message || '';

      // If backend says order is already paid, treat as success immediately
      if (verifyMsg.includes('Order is already paid')) {
        return {
          success: true,
          orderId,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          status: 'SUCCESS',
          message: PAYMENT_MESSAGES.ALREADY_PAID,
          paymentId: razorpayResponse.razorpay_payment_id,
          isTestMode: isRazorpayTestKey(paymentOrder.keyId),
        };
      }

      // Step E.1: Razorpay succeeded but verify API failed (network or 5xx).
      // Poll GET /order/{orderId} up to 5 times, 3 seconds apart
      let isVerifiedViaPoll = false;
      for (let attempt = 1; attempt <= 5; attempt++) {
        await sleep(3000);
        try {
          const pollResponse = await api.get(`/order/${orderId}`);
          const polledOrder = pollResponse?.data?.response || pollResponse?.data;
          if (polledOrder && polledOrder.paymentStatus === 'PAID') {
            isVerifiedViaPoll = true;
            break;
          }
        } catch (pollErr) {
          // Continue to next polling attempt if network/server fluctuates
        }
      }

      if (isVerifiedViaPoll) {
        return {
          success: true,
          orderId,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          status: 'SUCCESS',
          message: 'Payment verified successfully.',
          paymentId: razorpayResponse.razorpay_payment_id,
          isTestMode: isRazorpayTestKey(paymentOrder.keyId),
        };
      }

      // Last resort: sync with backend to detect late captures
      const syncRes = await syncPayment(orderId);
      if (syncRes?.paid) {
        return {
          success: true,
          orderId,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          status: 'SUCCESS',
          message: 'Payment verified successfully.',
          paymentId: syncRes.razorpayPaymentId ?? razorpayResponse.razorpay_payment_id,
          isTestMode: isRazorpayTestKey(paymentOrder.keyId),
        };
      }

      // If still unpaid after 5 polling attempts and sync, inform user with friendly message
      return {
        success: false,
        orderId,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: 'VERIFY_FAILED',
        reason: 'VERIFY_FAILED',
        message: getPaymentErrorMessage(verifyError),
        error: verifyError,
        paymentId: razorpayResponse.razorpay_payment_id,
        isTestMode: isRazorpayTestKey(paymentOrder.keyId),
      };
    }
  } catch (error: any) {
    return {
      success: false,
      orderId,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      status: 'FAILED',
      reason: 'PAYMENT_FAILED',
      message: getPaymentErrorMessage(error),
      error,
    };
  }
};

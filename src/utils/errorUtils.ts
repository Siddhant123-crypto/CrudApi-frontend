import type { TFunction } from 'i18next';

const isSafeUserMessage = (msg: string): boolean => {
  const lower = msg.toLowerCase();
  if (!msg.trim() || msg.length > 220) return false;
  return !(
    lower.includes('exception') ||
    lower.includes('hibernate') ||
    lower.includes('jdbc') ||
    lower.includes('sql') ||
    lower.includes('stacktrace') ||
    lower.includes('<html')
  );
};

/**
 * Centrally maps API and network errors to friendly, localized messages.
 * Matches by HTTP status, error codes, and known safe messages without altering backend responses.
 */
export const mapApiError = (error: any, t: TFunction): string => {
  if (!error) {
    return t('errors.generic', 'Something went wrong. Please try again.');
  }

  // Network / Offline errors
  if (
    error.code === 'ERR_NETWORK' ||
    error.message === 'Network Error' ||
    (typeof error.message === 'string' && error.message.toLowerCase().includes('network'))
  ) {
    return t('errors.networkError', 'Network error. Please check your internet connection and try again.');
  }

  // Request timeout
  if (error.code === 'ECONNABORTED' || (typeof error.message === 'string' && error.message.toLowerCase().includes('timeout'))) {
    return t('errors.timeout', 'Request timed out. Please try again.');
  }

  const status = error.response?.status;
  const data = error.response?.data;
  const backendMessage = typeof data === 'string' ? data : data?.message || data?.error;

  // Known backend message matches
  if (typeof backendMessage === 'string') {
    const lower = backendMessage.toLowerCase();
    if (lower.includes('invalid credentials') || lower.includes('bad credentials')) {
      return t('auth.invalidCredentials', 'Invalid email/mobile or password.');
    }
    if (lower.includes('user already exists') || lower.includes('email already')) {
      return t('auth.emailAlreadyExists', 'An account with this email already exists.');
    }
    if (lower.includes('mobile already') || lower.includes('mobile number already')) {
      return 'An account with this mobile number already exists.';
    }
    if (lower.includes('order not found')) {
      return t('payments.orderNotFound', 'Order not found.');
    }
    if (lower.includes('already paid')) {
      return t('payments.alreadyPaid', 'This order is already paid.');
    }
    if (lower.includes('out of stock')) {
      return t('product.outOfStock', 'This product is currently out of stock.');
    }
  }

  // Match known HTTP status codes
  switch (status) {
    case 401:
      return t('errors.unauthorized', 'Your session has expired. Please sign in again.');
    case 403:
      return t('errors.forbidden', 'You do not have permission to perform this action.');
    case 404:
      return t('errors.notFound', 'The requested item was not found.');
    case 413:
      return 'Uploaded photo is too large (max 5 MB). Please choose a smaller image.';
    case 429:
      return t('errors.tooManyRequests', 'Too many requests. Please try again shortly.');
    case 500:
    case 502:
    case 503:
    case 504:
      return t('errors.serverError', 'Server is temporarily unavailable. Please try again later.');
  }

  if ((status === 400 || status === 409 || status === 415) && typeof backendMessage === 'string' && isSafeUserMessage(backendMessage)) {
    return backendMessage;
  }

  return t('errors.generic', 'Something went wrong. Please try again.');
};

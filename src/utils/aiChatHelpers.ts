export const CHAT_CLEARED_PREFIX = 'ai_chat_cleared_at_';

export const getChatClearedKey = (userId?: string | null): string => {
  return `${CHAT_CLEARED_PREFIX}${userId || 'anonymous'}`;
};

export const DELETED_MESSAGES_PREFIX = 'ai_deleted_msg_ids_';

export const getDeletedMessagesKey = (userId?: string | null): string => {
  return `${DELETED_MESSAGES_PREFIX}${userId || 'guest'}`;
};

export const INITIAL_SUGGESTION_CHIPS = [
  'Tamatar kab lagana chahiye?',
  'Pyaz ke patte sukh rahe hain',
  'Tamatar mein keede lag gaye hain',
  'Kitna urea daalun?',
];

export const CUSTOMER_INITIAL_SUGGESTION_CHIPS = [
  'Tamatar ka rate batao',
  'Aloo kitne ka hai?',
  'Order kaise karun?',
  'Payment kaise karte hain?',
];

/**
 * Contextual follow-up suggestions for Customers
 */
export const getCustomerFollowUpSuggestions = (
  lastQuestion?: string,
  _lastAnswer?: string
): string[] => {
  if (!lastQuestion) {
    return ['Tamatar ka rate batao', 'Order kaise karun?'];
  }

  const q = lastQuestion.toLowerCase();

  if (q.includes('tamatar') || q.includes('tomato') || q.includes('aloo') || q.includes('potato') || q.includes('rate') || q.includes('price')) {
    return [
      'Aloo kitne ka hai?',
      'Fresh sabziyan kaunsi uplabdh hain?',
    ];
  }

  if (q.includes('order') || q.includes('cart') || q.includes('deliver') || q.includes('khareed')) {
    return [
      'Order track kaise karun?',
      'Payment kaise karte hain?',
    ];
  }

  if (q.includes('payment') || q.includes('pay') || q.includes('paisa') || q.includes('cod')) {
    return [
      'Kya online payment safe hai?',
      'Order kaise cancel karein?',
    ];
  }

  return [
    'Tamatar ka rate batao',
    'Order kaise karun?',
  ];
};

/**
 * Contextual follow-up suggestions based on crop or question topic.
 */
export const getFollowUpSuggestions = (
  lastQuestion?: string,
  _lastAnswer?: string
): string[] => {
  if (!lastQuestion) {
    return ['Tamatar kab lagana chahiye?', 'Pyaz ke patte sukh rahe hain'];
  }

  const q = lastQuestion.toLowerCase();

  if (q.includes('tamatar') || q.includes('tomato')) {
    return [
      'Tamatar kab lagana chahiye?',
      'Tamatar mein rog se bachav ke upay?',
    ];
  }

  if (q.includes('pyaz') || q.includes('onion') || q.includes('kanda')) {
    return [
      'Pyaz ki buwai ka sahi samay kya hai?',
      'Pyaz mein sadi hui gobar khad kab dalein?',
    ];
  }

  if (q.includes('khad') || q.includes('fertilizer') || q.includes('urea') || q.includes('dawai')) {
    return [
      'Khad aur dawai ka surakshit upyog kaise karein?',
      'Najdeeki KVK se mitti jaanch kaise karayein?',
    ];
  }

  if (q.includes('keede') || q.includes('pest') || q.includes('rog')) {
    return [
      'Jaivik keetnashak kaise banayein?',
      'Yellow sticky trap ka sahi upyog kaise karein?',
    ];
  }

  return [
    'Fasal ki sahi dekhbhal kaise karein?',
    'Khad aur paani ka sahi samay kya hai?',
  ];
};

export interface FormattedAiError {
  friendlyMessage: string;
  canRetry: boolean;
}

export function formatAiError(statusCode?: number, errorCode?: string): FormattedAiError {
  if (statusCode === 401) {
    return {
      friendlyMessage: 'Session expire ho gaya hai, kripya dobara login karein.',
      canRetry: false,
    };
  }
  if (statusCode === 429) {
    return {
      friendlyMessage: 'Aap bahut jaldi sawaal bhej rahe hain, thodi der baad try karein.',
      canRetry: true,
    };
  }
  if (statusCode === 504 || errorCode === 'ECONNABORTED' || errorCode === 'ERR_NETWORK') {
    return {
      friendlyMessage: 'AI abhi busy hai, dobara koshish karein.',
      canRetry: true,
    };
  }
  return {
    friendlyMessage: 'AI abhi busy hai, dobara koshish karein.',
    canRetry: true,
  };
}

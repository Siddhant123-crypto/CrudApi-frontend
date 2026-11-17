import i18n from '../i18n';

/**
 * Maps app language codes to BCP 47 locale codes with Indian region.
 */
const LOCALE_MAP: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
  ta: 'ta-IN',
  bn: 'bn-IN',
  kn: 'kn-IN',
  or: 'or-IN',
  sa: 'sa-IN',
  te: 'te-IN',
};

/**
 * Returns safe BCP 47 locale tag for current or provided language code.
 */
export const getActiveLocale = (langCode?: string): string => {
  const code = langCode || i18n.language || 'en';
  return LOCALE_MAP[code] || 'en-IN';
};

/**
 * Formats a currency amount with Rupee symbol (₹).
 * Uses Intl.NumberFormat with safe fallback for Indic scripts and Hermes.
 */
export const formatCurrency = (amount: number | string | undefined | null, langCode?: string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (num === undefined || num === null || isNaN(num)) {
    return '₹0';
  }

  const locale = getActiveLocale(langCode);

  try {
    const formatted = new Intl.NumberFormat(locale, {
      maximumFractionDigits: 2,
      minimumFractionDigits: num % 1 === 0 ? 0 : 2,
    }).format(num);
    return `₹${formatted}`;
  } catch {
    try {
      // Fallback to hi-IN or en-IN
      const fallback = new Intl.NumberFormat('en-IN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: num % 1 === 0 ? 0 : 2,
      }).format(num);
      return `₹${fallback}`;
    } catch {
      return `₹${num}`;
    }
  }
};

/**
 * Formats a number with locale-appropriate grouping.
 */
export const formatNumber = (num: number | undefined | null, langCode?: string): string => {
  if (num === undefined || num === null || isNaN(num)) return '0';
  const locale = getActiveLocale(langCode);

  try {
    return new Intl.NumberFormat(locale).format(num);
  } catch {
    try {
      return new Intl.NumberFormat('en-IN').format(num);
    } catch {
      return String(num);
    }
  }
};

/**
 * Formats a date safely with localized month and day names.
 */
export const formatDate = (
  dateInput: string | number | Date | undefined | null,
  options?: Intl.DateTimeFormatOptions,
  langCode?: string
): string => {
  if (!dateInput) return '';
  const dateObj = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(dateObj.getTime())) return String(dateInput);

  const locale = getActiveLocale(langCode);
  const defaultOptions: Intl.DateTimeFormatOptions = options || {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };

  try {
    return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
  } catch {
    try {
      return new Intl.DateTimeFormat('en-IN', defaultOptions).format(dateObj);
    } catch {
      return dateObj.toLocaleDateString();
    }
  }
};

/**
 * Formats date and time together (e.g. for orders or tracking).
 */
export const formatDateTime = (
  dateInput: string | number | Date | undefined | null,
  langCode?: string
): string => {
  return formatDate(
    dateInput,
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
    langCode
  );
};

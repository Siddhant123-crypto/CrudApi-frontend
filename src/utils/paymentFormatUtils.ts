/**
 * Payment and date formatting helpers & sanitizers.
 */
export const shortenId = (id?: string): string => {
  if (!id) return 'N/A';
  if (id.length <= 16) return id;
  return `${id.substring(0, 8)}...${id.substring(id.length - 6)}`;
};

export const formatPaymentDateTime = (dateString?: string): string => {
  const date = dateString ? new Date(dateString) : new Date();
  if (isNaN(date.getTime())) {
    return new Date().toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const isRazorpayTestKey = (keyId?: string): boolean => {
  return typeof keyId === 'string' && keyId.startsWith('rzp_test_');
};

export const sanitizeContact = (contact?: string): string | undefined => {
  if (!contact || typeof contact !== 'string') return undefined;
  const digits = contact.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    const local = digits.substring(2);
    if (/^[6-9]\d{9}$/.test(local)) return local;
  }
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    return digits;
  }
  return undefined;
};

export const sanitizeEmail = (email?: string): string | undefined => {
  if (!email || typeof email !== 'string') return undefined;
  const trimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed) ? trimmed : undefined;
};

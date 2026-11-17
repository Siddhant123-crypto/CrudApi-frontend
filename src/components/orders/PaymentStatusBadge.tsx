import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PaymentStatus } from '../../types';
import { THEME } from '../../constants/theme';
import { FARMER_THEME } from '../../constants/farmerTheme';
import { AdminFonts } from '../../constants/adminTheme';
import { formatPaymentStatus } from '../../utils/statusUtils';

interface PaymentStatusBadgeProps {
  status?: PaymentStatus | string;
  variant?: 'default' | 'customer' | 'farmer' | 'admin';
}

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({ status, variant = 'default' }) => {
  const { t } = useTranslation();
  const localizedLabel = formatPaymentStatus(status, t);
  const s = (status || '').toUpperCase().trim();

  if (variant === 'admin') {
    let color = '#B8860B';
    let bgColor = '#FFF4D6';

    switch (s) {
      case 'PAID':
      case 'SUCCESS':
      case 'COMPLETED':
        color = '#1E9E6A';
        bgColor = '#E1F6EC';
        break;
      case 'FAILED':
        color = '#D64545';
        bgColor = '#FDE7E7';
        break;
      case 'PENDING':
      default:
        color = '#B8860B';
        bgColor = '#FFF4D6';
        break;
    }

    return (
      <View style={[styles.adminBadge, { backgroundColor: bgColor }]}>
        <Text style={[styles.adminText, { color }]}>{localizedLabel.toUpperCase()}</Text>
      </View>
    );
  }

  if (variant === 'farmer') {
    let color = '#B45309';
    let bgColor = '#FEF3C7';

    switch (s) {
      case 'PAID':
      case 'SUCCESS':
      case 'COMPLETED':
        color = '#15803D';
        bgColor = '#DCFCE7';
        break;
      case 'FAILED':
        color = '#B91C1C';
        bgColor = '#FEE2E2';
        break;
      case 'PENDING':
      default:
        color = '#B45309';
        bgColor = '#FEF3C7';
        break;
    }

    return (
      <View style={[styles.farmerBadge, { backgroundColor: bgColor }]}>
        <Text style={[styles.farmerText, { color }]}>{localizedLabel}</Text>
      </View>
    );
  }

  if (variant === 'customer') {
    let color = THEME.colors.warning;
    let bgColor = THEME.colors.warningBg;

    switch (s) {
      case 'PAID':
      case 'SUCCESS':
      case 'COMPLETED':
        color = THEME.colors.success;
        bgColor = THEME.colors.successBg;
        break;
      case 'FAILED':
        color = THEME.colors.error;
        bgColor = THEME.colors.errorBg;
        break;
      case 'PENDING':
      default:
        color = '#B85814';
        bgColor = '#FFEBD6';
        break;
    }

    return (
      <View style={[styles.customerBadge, { backgroundColor: bgColor }]}>
        <Text style={[styles.customerText, { color }]}>{localizedLabel}</Text>
      </View>
    );
  }

  let color = '#B45309';
  let bgColor = '#FEF3C7';

  switch (s) {
    case 'PAID':
    case 'SUCCESS':
    case 'COMPLETED':
      color = '#15803D';
      bgColor = '#DCFCE7';
      break;
    case 'FAILED':
      color = '#B91C1C';
      bgColor = '#FEE2E2';
      break;
    case 'PENDING':
    default:
      color = '#B45309';
      bgColor = '#FEF3C7';
      break;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Text style={[styles.text, { color }]}>{localizedLabel}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
  customerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: THEME.radius.pill,
    alignSelf: 'flex-start',
  },
  customerText: {
    fontSize: 11,
    fontFamily: THEME.fonts.bold,
  },
  farmerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  farmerText: {
    fontSize: 11.5,
    fontFamily: FARMER_THEME.fonts.bold,
  },
  adminBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  adminText: {
    fontSize: 10.5,
    fontFamily: AdminFonts.bold,
    letterSpacing: 0.4,
  },
});

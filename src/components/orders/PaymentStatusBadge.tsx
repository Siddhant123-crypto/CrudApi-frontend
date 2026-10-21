import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PaymentStatus } from '../../types';
import { THEME } from '../../constants/theme';
import { FARMER_THEME } from '../../constants/farmerTheme';
import { AdminFonts } from '../../constants/adminTheme';

interface PaymentStatusBadgeProps {
  status?: PaymentStatus | string;
  variant?: 'default' | 'customer' | 'farmer' | 'admin';
}

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({ status, variant = 'default' }) => {
  if (variant === 'admin') {
    let color = '#B8860B';
    let bgColor = '#FFF4D6';
    let label = 'PENDING';

    switch (status) {
      case 'PAID':
        label = 'PAID';
        color = '#1E9E6A';
        bgColor = '#E1F6EC';
        break;
      case 'FAILED':
        label = 'FAILED';
        color = '#D64545';
        bgColor = '#FDE7E7';
        break;
      case 'PENDING':
      default:
        label = 'PENDING';
        color = '#B8860B';
        bgColor = '#FFF4D6';
        break;
    }

    return (
      <View style={[styles.adminBadge, { backgroundColor: bgColor }]}>
        <Text style={[styles.adminText, { color }]}>{label}</Text>
      </View>
    );
  }

  if (variant === 'farmer') {
    let color = '#B45309';
    let bgColor = '#FEF3C7';
    let label = 'Payment Pending';

    switch (status) {
      case 'PAID':
        label = 'Paid';
        color = '#15803D';
        bgColor = '#DCFCE7';
        break;
      case 'FAILED':
        label = 'Payment Failed';
        color = '#B91C1C';
        bgColor = '#FEE2E2';
        break;
      case 'PENDING':
      default:
        label = 'Payment Pending';
        color = '#B45309';
        bgColor = '#FEF3C7';
        break;
    }

    return (
      <View style={[styles.farmerBadge, { backgroundColor: bgColor }]}>
        <Text style={[styles.farmerText, { color }]}>{label}</Text>
      </View>
    );
  }

  if (variant === 'customer') {
    let color = THEME.colors.warning;
    let bgColor = THEME.colors.warningBg;
    let label = 'Payment Pending';

    switch (status) {
      case 'PAID':
        label = 'Paid';
        color = THEME.colors.success;
        bgColor = THEME.colors.successBg;
        break;
      case 'FAILED':
        label = 'Payment Failed';
        color = THEME.colors.error;
        bgColor = THEME.colors.errorBg;
        break;
      case 'PENDING':
      default:
        label = 'Payment Pending';
        color = '#B85814';
        bgColor = '#FFEBD6';
        break;
    }

    return (
      <View style={[styles.customerBadge, { backgroundColor: bgColor }]}>
        <Text style={[styles.customerText, { color }]}>{label}</Text>
      </View>
    );
  }

  let color = '#B45309';
  let bgColor = '#FEF3C7';
  let label = 'Payment Pending';

  switch (status) {
    case 'PAID':
      label = 'Paid';
      color = '#15803D';
      bgColor = '#DCFCE7';
      break;
    case 'FAILED':
      label = 'Payment Failed';
      color = '#B91C1C';
      bgColor = '#FEE2E2';
      break;
    case 'PENDING':
    default:
      label = 'Payment Pending';
      color = '#B45309';
      bgColor = '#FEF3C7';
      break;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
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


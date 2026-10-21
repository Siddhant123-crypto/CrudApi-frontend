import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../../constants/theme';
import { FARMER_THEME } from '../../constants/farmerTheme';
import { AdminFonts } from '../../constants/adminTheme';

interface OrderStatusBadgeProps {
  status: string;
  variant?: 'default' | 'customer' | 'farmer' | 'admin';
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status, variant = 'default' }) => {
  if (variant === 'admin') {
    const s = (status || '').toUpperCase().replace(/\s+/g, '_');
    let color = '#5B6580';
    let bgColor = '#EEF0F7';
    if (s === 'DELIVERED') {
      color = '#1E9E6A';
      bgColor = '#E1F6EC';
    } else if (s === 'PROCESSING' || s === 'CONFIRMED') {
      color = '#4F5BD5';
      bgColor = '#E8EBFF';
    } else if (s === 'OUT_FOR_DELIVERY') {
      color = '#1F8F89';
      bgColor = '#D9F3F1';
    } else if (s === 'PENDING') {
      color = '#B8860B';
      bgColor = '#FFF4D6';
    } else if (s === 'CANCELLED') {
      color = '#D64545';
      bgColor = '#FDE7E7';
    }

    return (
      <View style={[styles.adminBadge, { backgroundColor: bgColor }]}>
        <Text style={[styles.adminText, { color }]}>
          {(status || '').replace(/_/g, ' ').toUpperCase()}
        </Text>
      </View>
    );
  }

  if (variant === 'farmer') {
    let color = FARMER_THEME.colors.warning;
    let bgColor = FARMER_THEME.colors.warningBg;
    let label = 'Pending';

    switch (status) {
      case 'PENDING':
        label = 'Pending';
        color = '#B8860B';
        bgColor = '#FFF4DD';
        break;
      case 'CONFIRMED':
        label = 'Confirmed';
        color = '#1F7A4D';
        bgColor = '#DDF3E4';
        break;
      case 'PROCESSING':
        label = 'Processing';
        color = '#1F7F78';
        bgColor = '#D7F0EC';
        break;
      case 'OUT_FOR_DELIVERY':
        label = 'Out for Delivery';
        color = '#C2561A';
        bgColor = '#FFEDD5';
        break;
      case 'DELIVERED':
        label = 'Delivered';
        color = '#2E7D4F';
        bgColor = '#E3F3E8';
        break;
      case 'CANCELLED':
        label = 'Cancelled';
        color = '#C0392B';
        bgColor = '#FDE6E2';
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
    let label = 'Pending';

    switch (status) {
      case 'PENDING':
        label = 'Pending';
        color = THEME.colors.accentDeep;
        bgColor = THEME.colors.chipBg;
        break;
      case 'CONFIRMED':
        label = 'Confirmed';
        color = '#B85814';
        bgColor = '#FFEBD6';
        break;
      case 'PROCESSING':
        label = 'Processing';
        color = THEME.colors.accent;
        bgColor = '#FFF4DD';
        break;
      case 'OUT_FOR_DELIVERY':
        label = 'Out for Delivery';
        color = '#C2561A';
        bgColor = '#FFF0E5';
        break;
      case 'DELIVERED':
        label = 'Delivered';
        color = THEME.colors.success;
        bgColor = THEME.colors.successBg;
        break;
      case 'CANCELLED':
        label = 'Cancelled';
        color = THEME.colors.error;
        bgColor = THEME.colors.errorBg;
        break;
    }

    return (
      <View style={[styles.customerBadge, { backgroundColor: bgColor }]}>
        <Text style={[styles.customerText, { color }]}>{label}</Text>
      </View>
    );
  }

  let color = '#FFA000';
  let bgColor = '#FFF8E1';
  let label = 'Pending';
  switch (status) {
    case 'PENDING':
      label = 'Pending';
      color = '#FFA000';
      bgColor = '#FFF8E1';
      break;
    case 'CONFIRMED':
      label = 'Confirmed';
      color = '#1E88E5';
      bgColor = '#E3F2FD';
      break;
    case 'PROCESSING':
      label = 'Processing';
      color = '#8E24AA';
      bgColor = '#F3E5F5';
      break;
    case 'OUT_FOR_DELIVERY':
      label = 'Out for Delivery';
      color = '#00897B';
      bgColor = '#E0F2F1';
      break;
    case 'DELIVERED':
      label = 'Delivered';
      color = '#43A047';
      bgColor = '#E8F5E9';
      break;
    case 'CANCELLED':
      label = 'Cancelled';
      color = '#C62828';
      bgColor = '#FFCDD2';
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


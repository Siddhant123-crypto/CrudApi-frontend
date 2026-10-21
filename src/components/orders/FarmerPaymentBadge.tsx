import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PaymentMethod, PaymentStatus } from '../../types';
import { FARMER_THEME } from '../../constants/farmerTheme';

interface FarmerPaymentBadgeProps {
  paymentMethod?: PaymentMethod | string;
  paymentStatus?: PaymentStatus | string;
}

export const FarmerPaymentBadge: React.FC<FarmerPaymentBadgeProps> = ({
  paymentMethod,
  paymentStatus,
}) => {
  if (paymentMethod === 'COD') {
    return (
      <View style={[styles.badge, styles.codBadge]}>
        <Ionicons name="cash-outline" size={13} color="#B8860B" style={styles.icon} />
        <Text style={[styles.text, styles.codText]}>Cash on Delivery: collect cash on delivery</Text>
      </View>
    );
  }

  if (paymentMethod === 'ONLINE' && paymentStatus === 'PAID') {
    return (
      <View style={[styles.badge, styles.paidBadge]}>
        <Ionicons name="checkmark-circle-outline" size={13} color={FARMER_THEME.colors.deliveredText} style={styles.icon} />
        <Text style={[styles.text, styles.paidText]}>Paid online</Text>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  codBadge: {
    backgroundColor: FARMER_THEME.colors.warningBg,
    borderColor: '#F5D77A',
    borderWidth: 1,
  },
  codText: {
    color: '#B8860B',
    fontSize: 11,
    fontFamily: FARMER_THEME.fonts.bold,
  },
  paidBadge: {
    backgroundColor: FARMER_THEME.colors.deliveredBg,
    borderColor: '#A7F3D0',
    borderWidth: 1,
  },
  paidText: {
    color: FARMER_THEME.colors.deliveredText,
    fontSize: 11,
    fontFamily: FARMER_THEME.fonts.bold,
  },
  text: {
    fontSize: 11,
    fontFamily: FARMER_THEME.fonts.bold,
  },
});

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { FARMER_THEME } from '../../constants/farmerTheme';

export interface FarmerOrderCardProps {
  orderId: string;
  orderNumber?: string;
  customerName?: string;
  itemSummary?: string;
  amount: number | string;
  status: string; // 'DELIVERED' | 'PENDING' | 'CANCELLED' | etc.
  onPress: () => void;
}

export const FarmerOrderCard: React.FC<FarmerOrderCardProps> = ({
  orderId,
  orderNumber,
  customerName,
  itemSummary,
  amount,
  status,
  onPress,
}) => {
  const normStatus = (status || 'PENDING').toUpperCase();

  let pillBg = FARMER_THEME.colors.pendingBg;
  let pillText = FARMER_THEME.colors.pendingText;

  if (normStatus.includes('DELIVER') || normStatus === 'ACCEPTED' || normStatus === 'COMPLETED') {
    pillBg = FARMER_THEME.colors.deliveredBg;
    pillText = FARMER_THEME.colors.deliveredText;
  } else if (normStatus.includes('CANCEL') || normStatus === 'REJECTED') {
    pillBg = FARMER_THEME.colors.cancelledBg;
    pillText = FARMER_THEME.colors.cancelledText;
  }

  const displayId = orderNumber
    ? `Order #${orderNumber.length > 12 ? orderNumber.substring(0, 12) : orderNumber}`
    : `Order #${orderId.length > 8 ? orderId.substring(0, 8) : orderId}`;

  const subtitle = customerName
    ? `${customerName}${itemSummary ? ` • ${itemSummary}` : ''}`
    : itemSummary || 'Customer order';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.topRow}>
        <Text style={styles.orderIdText}>{displayId}</Text>
        <View style={[styles.statusPill, { backgroundColor: pillBg }]}>
          <Text style={[styles.statusText, { color: pillText }]}>
            {normStatus}
          </Text>
        </View>
      </View>

      <Text style={styles.subtitleText} numberOfLines={1}>
        {subtitle}
      </Text>

      <View style={styles.bottomRow}>
        <Text style={styles.amountLabel}>Total</Text>
        <Text style={styles.amountText}>₹{amount}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: FARMER_THEME.colors.cardBg,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: FARMER_THEME.colors.cardBorder,
    ...FARMER_THEME.shadows.card,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderIdText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 14,
    color: FARMER_THEME.colors.darkGreen,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 11,
    textTransform: 'capitalize',
  },
  subtitleText: {
    marginTop: 6,
    fontFamily: FARMER_THEME.fonts.regular,
    fontSize: 11.5,
    color: FARMER_THEME.colors.textSecondary,
  },
  bottomRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: FARMER_THEME.colors.cardBorder,
  },
  amountLabel: {
    fontFamily: FARMER_THEME.fonts.regular,
    fontSize: 11.5,
    color: FARMER_THEME.colors.textSecondary,
  },
  amountText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 15,
    color: FARMER_THEME.colors.textDark,
  },
});

export default FarmerOrderCard;

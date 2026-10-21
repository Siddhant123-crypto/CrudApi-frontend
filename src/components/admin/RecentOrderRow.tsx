import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ADMIN_THEME } from '../../constants/adminTheme';
import { ShoppingBagIcon } from './AdminIcons';

export interface OrderItemData {
  id: string;
  orderNumber: string;
  customerName: string;
  amount: string | number;
  status: string;
}

interface RecentOrderRowProps {
  order: OrderItemData;
  isLast?: boolean;
  onPress?: () => void;
}

export const RecentOrderRow: React.FC<RecentOrderRowProps> = ({
  order,
  isLast = false,
  onPress,
}) => {
  // Normalize status for pill colors
  const statusUpper = (order.status || '').toUpperCase();

  let bg = ADMIN_THEME.colors.statusProcessingBg;
  let textColor = ADMIN_THEME.colors.statusProcessingText;

  if (statusUpper.includes('DELIVER') || statusUpper.includes('COMPLET')) {
    bg = ADMIN_THEME.colors.statusDeliveredBg;
    textColor = ADMIN_THEME.colors.statusDeliveredText;
  } else if (statusUpper.includes('CANCEL') || statusUpper.includes('REJECT')) {
    bg = ADMIN_THEME.colors.statusCancelledBg;
    textColor = ADMIN_THEME.colors.statusCancelledText;
  } else if (statusUpper.includes('PEND') || statusUpper.includes('WAIT')) {
    bg = ADMIN_THEME.colors.statusPendingBg;
    textColor = ADMIN_THEME.colors.statusPendingText;
  } else if (statusUpper.includes('PROCESS')) {
    bg = ADMIN_THEME.colors.statusProcessingBg;
    textColor = ADMIN_THEME.colors.statusProcessingText;
  }

  // Format amount
  const formattedAmount =
    typeof order.amount === 'number'
      ? `₹${order.amount.toLocaleString('en-IN')}`
      : order.amount.startsWith('₹')
      ? order.amount
      : `₹${order.amount}`;

  const rowContent = (
    <>
      {/* Left tile */}
      <LinearGradient
        colors={ADMIN_THEME.colors.darkTileGradient}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.leftTile}
      >
        <ShoppingBagIcon size={18} color={ADMIN_THEME.colors.gold} strokeWidth={1.8} />
      </LinearGradient>

      {/* Middle */}
      <View style={styles.middle}>
        <Text style={styles.orderId} numberOfLines={1}>
          {order.orderNumber}
        </Text>
        <Text style={styles.customerName} numberOfLines={1}>
          {order.customerName}
        </Text>
      </View>

      {/* Right */}
      <View style={styles.right}>
        <Text style={styles.amount} numberOfLines={1}>
          {formattedAmount}
        </Text>
        <View style={[styles.statusPill, { backgroundColor: bg }]}>
          <Text style={[styles.statusText, { color: textColor }]}>
            {statusUpper}
          </Text>
        </View>
      </View>
    </>
  );

  return (
    <>
      {onPress ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onPress}
          style={styles.row}
        >
          {rowContent}
        </TouchableOpacity>
      ) : (
        <View style={styles.row}>
          {rowContent}
        </View>
      )}
      {!isLast && <View style={styles.divider} />}
    </>
  );
};

export const RecentOrdersEmptyState: React.FC = () => {
  return (
    <View style={styles.emptyContainer}>
      <ShoppingBagIcon size={24} color={ADMIN_THEME.colors.muted} strokeWidth={1.8} />
      <Text style={styles.emptyTitle}>No orders yet</Text>
      <Text style={styles.emptySubtitle}>New orders will show up here</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
  },
  divider: {
    height: 1,
    backgroundColor: ADMIN_THEME.colors.divider,
  },
  leftTile: {
    width: 38,
    height: 38,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  middle: {
    flex: 1,
    minWidth: 0,
  },
  orderId: {
    fontFamily: ADMIN_THEME.fonts.bold,
    fontSize: 13.5,
    color: ADMIN_THEME.colors.ink,
  },
  customerName: {
    marginTop: 1.5,
    fontFamily: ADMIN_THEME.fonts.regular,
    fontSize: 11.5,
    color: ADMIN_THEME.colors.textSecondary,
  },
  right: {
    alignItems: 'flex-end',
  },
  amount: {
    fontFamily: ADMIN_THEME.fonts.bold,
    fontSize: 14,
    color: ADMIN_THEME.colors.ink,
  },
  statusPill: {
    marginTop: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: ADMIN_THEME.radius.pill,
  },
  statusText: {
    fontFamily: ADMIN_THEME.fonts.bold,
    fontSize: 9.5,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 6,
  },
  emptyTitle: {
    fontFamily: ADMIN_THEME.fonts.serif,
    fontSize: 18,
    color: ADMIN_THEME.colors.ink,
    marginTop: 6,
  },
  emptySubtitle: {
    fontFamily: ADMIN_THEME.fonts.regular,
    fontSize: 12.5,
    color: ADMIN_THEME.colors.textSecondary,
  },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ADMIN_THEME } from '../../constants/adminTheme';
import { ClockIcon, CheckCircleIcon, XCircleIcon } from './AdminIcons';

export type OrderStatusType = 'pending' | 'completed' | 'cancelled';

interface OrderStatusCardProps {
  type: OrderStatusType;
  count: number | string;
  label?: string;
  onPress?: () => void;
}

export const OrderStatusCard: React.FC<OrderStatusCardProps> = ({
  type,
  count,
  label,
  onPress,
}) => {
  let pastel = ADMIN_THEME.colors.pendingPastel;
  let iconColor = ADMIN_THEME.colors.pendingIcon;
  let displayLabel = label || 'Pending';
  let renderIcon = <ClockIcon size={16} color={iconColor} strokeWidth={2} />;

  if (type === 'completed') {
    pastel = ADMIN_THEME.colors.completedPastel;
    iconColor = ADMIN_THEME.colors.completedIcon;
    displayLabel = label || 'Completed';
    renderIcon = <CheckCircleIcon size={16} color={iconColor} strokeWidth={2} />;
  } else if (type === 'cancelled') {
    pastel = ADMIN_THEME.colors.cancelledPastel;
    iconColor = ADMIN_THEME.colors.cancelledIcon;
    displayLabel = label || 'Cancelled';
    renderIcon = <XCircleIcon size={16} color={iconColor} strokeWidth={2} />;
  }

  const content = (
    <>
      {/* Icon box */}
      <View style={[styles.iconBox, { backgroundColor: pastel }]}>
        {renderIcon}
      </View>

      {/* Number */}
      <Text style={styles.number} numberOfLines={1}>
        {count}
      </Text>

      {/* Label */}
      <Text
        style={styles.label}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
      >
        {displayLabel}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={styles.card}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.card}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    padding: 10,
    borderRadius: ADMIN_THEME.radius.orderStatusCard,
    backgroundColor: ADMIN_THEME.colors.card,
    borderWidth: 1,
    borderColor: ADMIN_THEME.colors.cardBorder,
    ...ADMIN_THEME.shadows.card,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  number: {
    fontFamily: ADMIN_THEME.fonts.serif,
    fontSize: 18,
    lineHeight: 20,
    color: ADMIN_THEME.colors.ink,
  },
  label: {
    marginTop: 1,
    fontFamily: ADMIN_THEME.fonts.semiBold,
    fontSize: 10.5,
    color: ADMIN_THEME.colors.textSecondary,
  },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, DimensionValue } from 'react-native';
import { ADMIN_THEME } from '../../constants/adminTheme';
import { UsersIcon, UserIcon, CubeIcon, CartIcon } from './AdminIcons';

export type StatCardType = 'farmers' | 'customers' | 'products' | 'orders';

export interface StatCardProps {
  title: string;
  value: string | number;
  type?: StatCardType;
  growth?: string;
  onPress?: () => void;
  cardWidth?: DimensionValue;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  type,
  onPress,
  cardWidth,
}) => {
  // Infer type if not explicitly passed
  const resolvedType = (type || title.toLowerCase()) as StatCardType;

  let pastel = ADMIN_THEME.colors.farmersPastel;
  let iconColor = ADMIN_THEME.colors.farmersIcon;
  let renderIcon = <UsersIcon size={20} color={iconColor} strokeWidth={1.9} />;

  if (resolvedType === 'customers') {
    pastel = ADMIN_THEME.colors.customersPastel;
    iconColor = ADMIN_THEME.colors.customersIcon;
    renderIcon = <UserIcon size={20} color={iconColor} strokeWidth={1.9} />;
  } else if (resolvedType === 'products') {
    pastel = ADMIN_THEME.colors.productsPastel;
    iconColor = ADMIN_THEME.colors.productsIcon;
    renderIcon = <CubeIcon size={20} color={iconColor} strokeWidth={1.9} />;
  } else if (resolvedType === 'orders') {
    pastel = ADMIN_THEME.colors.ordersPastel;
    iconColor = ADMIN_THEME.colors.ordersIcon;
    renderIcon = <CartIcon size={20} color={iconColor} strokeWidth={1.9} />;
  }

  const cardStyle = [
    styles.card,
    cardWidth ? { width: cardWidth } : undefined,
  ];

  const cardContent = (
    <>
      {/* Decorative circle */}
      <View
        style={[
          styles.decorativeCircle,
          { backgroundColor: pastel },
        ]}
      />

      {/* Icon box */}
      <View style={[styles.iconBox, { backgroundColor: pastel }]}>
        {renderIcon}
      </View>

      {/* Number */}
      <Text style={styles.number} numberOfLines={1}>
        {value}
      </Text>

      {/* Label */}
      <Text style={styles.label} numberOfLines={1}>
        {title}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={cardStyle}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle}>
      {cardContent}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderRadius: ADMIN_THEME.radius.statCard,
    overflow: 'hidden',
    backgroundColor: ADMIN_THEME.colors.card,
    borderWidth: 1,
    borderColor: ADMIN_THEME.colors.cardBorder,
    ...ADMIN_THEME.shadows.card,
    position: 'relative',
  },
  decorativeCircle: {
    position: 'absolute',
    right: -12,
    top: -12,
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.6,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  number: {
    marginTop: 8,
    fontFamily: ADMIN_THEME.fonts.serif,
    fontSize: 24,
    lineHeight: 26,
    color: ADMIN_THEME.colors.ink,
  },
  label: {
    marginTop: 3,
    fontFamily: ADMIN_THEME.fonts.semiBold,
    fontSize: 11.5,
    color: ADMIN_THEME.colors.textSecondary,
  },
});

export const AdminStatCard = StatCard;

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedEmptyState } from '../ui/ThemedEmptyState';
import { THEME } from '../../constants/theme';
import { FarmerEmptyState } from '../farmer/FarmerUI';
import { FARMER_THEME } from '../../constants/farmerTheme';
import { AdminEmptyState } from '../admin/AdminEmptyState';
import { ShoppingBagIcon } from '../admin/AdminIcons';
import { ADMIN_THEME } from '../../constants/adminTheme';

interface OrderEmptyStateProps {
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'customer' | 'farmer' | 'admin';
  buttonTitle?: string;
  onButtonPress?: () => void;
}

export const OrderEmptyState: React.FC<OrderEmptyStateProps> = ({
  title = 'No orders found',
  subtitle = "Looks like you don't have any orders here yet.",
  variant = 'default',
  buttonTitle,
  onButtonPress,
}) => {
  if (variant === 'admin') {
    return (
      <AdminEmptyState
        title={title}
        subtitle={subtitle}
        actionTitle={buttonTitle}
        onActionPress={onButtonPress}
        icon={<ShoppingBagIcon size={44} color={ADMIN_THEME.colors.indigo} strokeWidth={1.8} />}
      />
    );
  }
  if (variant === 'customer') {
    return (
      <ThemedEmptyState
        title={title}
        subtitle={subtitle}
        buttonTitle={buttonTitle}
        onButtonPress={onButtonPress}
        icon={<Ionicons name="basket-outline" size={44} color={THEME.colors.accentDeep} />}
      />
    );
  }

  if (variant === 'farmer') {
    return (
      <FarmerEmptyState
        title={title}
        subtitle={subtitle}
        buttonTitle={buttonTitle}
        onButtonPress={onButtonPress}
        icon={<Ionicons name="basket-outline" size={44} color={FARMER_THEME.colors.emeraldPrimary} />}
      />
    );
  }

  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="basket-outline" size={48} color="#2D983A" />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 40,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
});


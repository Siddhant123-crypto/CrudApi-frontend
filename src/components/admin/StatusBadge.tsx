import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { ADMIN_THEME, AdminFonts } from '../../constants/adminTheme';

export interface StatusBadgeProps {
  status?: string;
  label?: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | string;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const getStatusColor = (status: string, variant?: string) => {
  if (variant === 'success') {
    return { bg: '#ECFDF5', text: '#065F46', border: 'rgba(16, 185, 129, 0.35)', dot: '#10B981' };
  }
  if (variant === 'warning') {
    return { bg: '#FFFBEB', text: '#92400E', border: 'rgba(245, 158, 11, 0.35)', dot: '#F59E0B' };
  }
  if (variant === 'danger' || variant === 'error') {
    return { bg: '#FEF2F2', text: '#991B1B', border: 'rgba(239, 68, 68, 0.35)', dot: '#EF4444' };
  }
  if (variant === 'info') {
    return { bg: '#EEF2FF', text: '#3730A3', border: 'rgba(99, 102, 241, 0.35)', dot: '#6366F1' };
  }
  if (variant === 'neutral') {
    return { bg: '#F3F4F6', text: '#374151', border: 'rgba(156, 163, 175, 0.35)', dot: '#9CA3AF' };
  }

  const s = (status || '').toUpperCase().replace(/\s+/g, '_');
  if (s === 'DELIVERED' || s.includes('COMPLETED') || s.includes('VERIFIED') || s.includes('APPROVED') || s === 'ACTIVE') {
    return { bg: '#ECFDF5', text: '#065F46', border: 'rgba(16, 185, 129, 0.35)', dot: '#10B981' };
  }
  if (s === 'PROCESSING' || s === 'CONFIRMED' || s === 'OPEN') {
    return { bg: '#EEF2FF', text: '#3730A3', border: 'rgba(99, 102, 241, 0.35)', dot: '#6366F1' };
  }
  if (s === 'OUT_FOR_DELIVERY' || s === 'ASSIGNED') {
    return { bg: '#F0FDFA', text: '#115E59', border: 'rgba(20, 184, 166, 0.35)', dot: '#14B8A6' };
  }
  if (s === 'PENDING' || s === 'IN_PROGRESS') {
    return { bg: '#FFFBEB', text: '#92400E', border: 'rgba(245, 158, 11, 0.35)', dot: '#F59E0B' };
  }
  if (s === 'CANCELLED' || s === 'REJECTED' || s === 'BLOCKED' || s === 'FAILED' || s === 'CLOSED' || s === 'INACTIVE') {
    return { bg: '#FEF2F2', text: '#991B1B', border: 'rgba(239, 68, 68, 0.35)', dot: '#EF4444' };
  }
  return { bg: '#F3F4F6', text: '#374151', border: 'rgba(156, 163, 175, 0.35)', dot: '#9CA3AF' };
};

export const AdminBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  variant,
  size = 'small',
  style,
  textStyle,
}) => {
  const displayLabel = label || status || '';
  const colors = getStatusColor(displayLabel, variant);
  const isMedium = size === 'medium';
  const isLarge = size === 'large';

  return (
    <View
      style={[
        styles.badge,
        isMedium && styles.badgeMedium,
        isLarge && styles.badgeLarge,
        { backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 1 },
        style,
      ]}
    >
      <View
        style={[
          styles.dot,
          isMedium && styles.dotMedium,
          isLarge && styles.dotLarge,
          { backgroundColor: colors.dot },
        ]}
      />
      <Text
        style={[
          styles.text,
          isMedium && styles.textMedium,
          isLarge && styles.textLarge,
          { color: colors.text },
          textStyle,
        ]}
        numberOfLines={1}
      >
        {displayLabel.replace(/_/g, ' ').toUpperCase()}
      </Text>
    </View>
  );
};

export const StatusBadge = AdminBadge;

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  badgeMedium: {
    paddingHorizontal: 11,
    paddingVertical: 4.5,
  },
  badgeLarge: {
    paddingHorizontal: 13,
    paddingVertical: 5.5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  dotMedium: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  dotLarge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  text: {
    fontFamily: AdminFonts.bold,
    fontSize: 10,
    letterSpacing: 0.4,
  },
  textMedium: {
    fontSize: 11,
  },
  textLarge: {
    fontSize: 12,
  },
});

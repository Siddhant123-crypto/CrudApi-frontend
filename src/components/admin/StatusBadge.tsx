import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatusBadgeProps {
  status: string;
}

const getStatusColor = (status: string) => {
  const normalizedStatus = status.toLowerCase();
  
  if (['active', 'delivered', 'completed', 'verified', 'approved'].includes(normalizedStatus)) {
    return { bg: '#DCFCE7', text: '#16A34A' }; // Success
  }
  if (['pending', 'processing'].includes(normalizedStatus)) {
    return { bg: '#FEF3C7', text: '#F59E0B' }; // Warning
  }
  if (['blocked', 'cancelled', 'rejected', 'inactive'].includes(normalizedStatus)) {
    return { bg: '#FEE2E2', text: '#EF4444' }; // Danger
  }
  
  return { bg: '#F3F4F6', text: '#6B7280' }; // Default/Secondary
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const colors = getStatusColor(status);
  
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]} numberOfLines={1}>
        {status.toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  text: {
    fontSize: 9,
    fontWeight: '700',
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface OrderStatusBadgeProps {
  status: string;
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
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
});

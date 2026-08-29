import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

interface OrderTimelineProps {
  status: string;
  isFarmer?: boolean;
}

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ status, isFarmer = false }) => {
  const statuses = [
    { id: 'PENDING', label: 'Order placed, waiting for farmer' },
    { id: 'CONFIRMED', label: 'Farmer accepted your order' },
    { id: 'PROCESSING', label: 'Your fresh products are being prepared' },
    { id: 'OUT_FOR_DELIVERY', label: 'Your order is on the way' },
    { id: 'DELIVERED', label: 'Order delivered successfully' },
  ];

  if (status === 'CANCELLED') {
    return (
      <View style={styles.timelineContainer}>
        <View style={styles.timelineItem}>
          <View style={[styles.timelineDot, { backgroundColor: '#EF4444' }]} />
          <Text style={[styles.timelineText, { color: '#EF4444', fontWeight: '700' }]}>
            Order Cancelled
          </Text>
        </View>
      </View>
    );
  }

  const currentIndex = statuses.findIndex(s => s.id === status);

  return (
    <View style={styles.timelineContainer}>
      {statuses.map((s, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <View key={s.id} style={styles.timelineItem}>
            <View style={styles.timelineLeft}>
              <View
                style={[
                  styles.timelineDot,
                  isCompleted ? styles.timelineDotActive : styles.timelineDotInactive,
                  isCurrent && (isFarmer ? styles.timelineDotCurrent : styles.timelineDotCurrentCustomer),
                ]}
              >
                {isCompleted && !isCurrent && (
                  <Ionicons name="checkmark" size={12} color="#FFF" />
                )}
              </View>
              {index !== statuses.length - 1 && (
                <View
                  style={[
                    styles.timelineLine,
                    isCompleted ? styles.timelineLineActive : styles.timelineLineInactive,
                  ]}
                />
              )}
            </View>
            <View style={styles.timelineRight}>
              <Text
                style={[
                  styles.timelineText,
                  isCurrent && (isFarmer ? styles.timelineTextCurrent : styles.timelineTextCurrentCustomer),
                  !isCompleted && styles.timelineTextInactive,
                ]}
              >
                {s.label}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  timelineContainer: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 50,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
    width: 20,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  timelineDotActive: {
    backgroundColor: '#10B981',
  },
  timelineDotInactive: {
    backgroundColor: '#E5E7EB',
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  timelineDotCurrent: {
    backgroundColor: '#1B5E20',
    borderWidth: 4,
    borderColor: '#A7F3D0',
  },
  timelineDotCurrentCustomer: {
    backgroundColor: '#1E3A8A',
    borderWidth: 4,
    borderColor: '#BFDBFE',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: -4,
    marginBottom: -4,
    zIndex: 1,
  },
  timelineLineActive: {
    backgroundColor: '#10B981',
  },
  timelineLineInactive: {
    backgroundColor: '#E5E7EB',
  },
  timelineRight: {
    flex: 1,
    paddingBottom: 20,
    justifyContent: 'flex-start',
    paddingTop: 1,
  },
  timelineText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  timelineTextCurrent: {
    fontWeight: '700',
    color: '#1B5E20',
  },
  timelineTextCurrentCustomer: {
    fontWeight: '700',
    color: '#1E3A8A',
  },
  timelineTextInactive: {
    color: '#9CA3AF',
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { THEME } from '../../constants/theme';
import { FARMER_THEME } from '../../constants/farmerTheme';
import { AdminFonts } from '../../constants/adminTheme';

interface OrderTimelineProps {
  status: string;
  isFarmer?: boolean;
  variant?: 'default' | 'customer' | 'farmer' | 'admin';
}

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ status, isFarmer = false, variant = 'default' }) => {
  const statuses = [
    { id: 'PENDING', label: 'Order placed, waiting for farmer' },
    { id: 'CONFIRMED', label: 'Farmer accepted order' },
    { id: 'PROCESSING', label: 'Products being prepared' },
    { id: 'OUT_FOR_DELIVERY', label: 'Order on the way' },
    { id: 'DELIVERED', label: 'Order delivered successfully' },
  ];

  if (variant === 'admin') {
    if (status === 'CANCELLED') {
      return (
        <View style={styles.timelineContainer}>
          <View style={[styles.timelineItem, { alignItems: 'center', minHeight: 40 }]}>
            <View style={[styles.adminTimelineDot, { backgroundColor: '#D64545', marginRight: 10 }]} />
            <Text style={[styles.adminTimelineText, { color: '#D64545', fontFamily: AdminFonts.bold }]}>
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
                    styles.adminTimelineDot,
                    isCompleted ? styles.adminDotCompleted : styles.adminDotInactive,
                    isCurrent && styles.adminDotCurrent,
                  ]}
                >
                  {isCompleted && !isCurrent && (
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  )}
                  {isCurrent && (
                    <View style={styles.adminInnerDot} />
                  )}
                </View>
                {index !== statuses.length - 1 && (
                  <View
                    style={[
                      styles.adminTimelineLine,
                      isCompleted ? styles.adminLineCompleted : styles.adminLineInactive,
                    ]}
                  />
                )}
              </View>
              <View style={styles.timelineRight}>
                <Text
                  style={[
                    styles.adminTimelineText,
                    isCurrent && styles.adminTextCurrent,
                    !isCompleted && styles.adminTextInactive,
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
  }

  if (variant === 'farmer') {
    if (status === 'CANCELLED') {
      return (
        <View style={styles.timelineContainer}>
          <View style={[styles.timelineItem, { alignItems: 'center', minHeight: 40 }]}>
            <View style={[styles.farmerTimelineDot, { backgroundColor: '#C0392B', marginRight: 10 }]} />
            <Text style={[styles.farmerTimelineText, { color: '#C0392B', fontFamily: FARMER_THEME.fonts.bold }]}>
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
                    styles.farmerTimelineDot,
                    isCompleted ? styles.farmerDotCompleted : styles.farmerDotInactive,
                    isCurrent && styles.farmerDotCurrent,
                  ]}
                >
                  {isCompleted && !isCurrent && (
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  )}
                  {isCurrent && (
                    <View style={styles.farmerInnerDot} />
                  )}
                </View>
                {index !== statuses.length - 1 && (
                  <View
                    style={[
                      styles.farmerTimelineLine,
                      isCompleted ? styles.farmerLineCompleted : styles.farmerLineInactive,
                    ]}
                  />
                )}
              </View>
              <View style={styles.timelineRight}>
                <Text
                  style={[
                    styles.farmerTimelineText,
                    isCurrent && styles.farmerTextCurrent,
                    !isCompleted && styles.farmerTextInactive,
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
  }

  if (variant === 'customer') {
    if (status === 'CANCELLED') {
      return (
        <View style={styles.timelineContainer}>
          <View style={[styles.timelineItem, { alignItems: 'center', minHeight: 40 }]}>
            <View style={[styles.customerTimelineDot, { backgroundColor: THEME.colors.error, marginRight: 10 }]} />
            <Text style={[styles.customerTimelineText, { color: THEME.colors.error, fontFamily: THEME.fonts.bold }]}>
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
                    styles.customerTimelineDot,
                    isCompleted ? styles.customerDotCompleted : styles.customerDotInactive,
                    isCurrent && styles.customerDotCurrent,
                  ]}
                >
                  {isCompleted && !isCurrent && (
                    <Ionicons name="checkmark" size={12} color="#FFF" />
                  )}
                  {isCurrent && (
                    <View style={styles.customerInnerDot} />
                  )}
                </View>
                {index !== statuses.length - 1 && (
                  <View
                    style={[
                      styles.customerTimelineLine,
                      isCompleted ? styles.customerLineCompleted : styles.customerLineInactive,
                    ]}
                  />
                )}
              </View>
              <View style={styles.timelineRight}>
                <Text
                  style={[
                    styles.customerTimelineText,
                    isCurrent && styles.customerTextCurrent,
                    !isCompleted && styles.customerTextInactive,
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
  }

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
    width: 22,
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

  // Customer Theme Styles
  customerTimelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  customerDotCompleted: {
    backgroundColor: THEME.colors.success,
  },
  customerDotInactive: {
    backgroundColor: THEME.colors.chipBg,
    borderWidth: 2,
    borderColor: THEME.colors.cardBorder,
  },
  customerDotCurrent: {
    backgroundColor: THEME.colors.accentDeep,
    borderWidth: 3,
    borderColor: '#FBDDB8',
  },
  customerInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  customerTimelineLine: {
    width: 2,
    flex: 1,
    marginTop: -2,
    marginBottom: -2,
    zIndex: 1,
  },
  customerLineCompleted: {
    backgroundColor: THEME.colors.success,
  },
  customerLineInactive: {
    backgroundColor: THEME.colors.cardBorder,
  },
  customerTimelineText: {
    fontSize: 13.5,
    fontFamily: THEME.fonts.medium,
    color: THEME.colors.textBase,
    lineHeight: 19,
  },
  customerTextCurrent: {
    fontFamily: THEME.fonts.bold,
    color: THEME.colors.accentDeep,
  },
  customerTextInactive: {
    color: THEME.colors.textMuted,
  },
  // Farmer Theme Styles
  farmerTimelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  farmerDotCompleted: {
    backgroundColor: '#17663F',
  },
  farmerDotInactive: {
    backgroundColor: '#FBFEF9',
    borderWidth: 2,
    borderColor: '#DCE8DF',
  },
  farmerDotCurrent: {
    backgroundColor: '#17663F',
    borderWidth: 3,
    borderColor: '#DDF3E4',
  },
  farmerInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  farmerTimelineLine: {
    width: 2,
    flex: 1,
    marginTop: -2,
    marginBottom: -2,
    zIndex: 1,
  },
  farmerLineCompleted: {
    backgroundColor: '#17663F',
  },
  farmerLineInactive: {
    backgroundColor: '#DCE8DF',
  },
  farmerTimelineText: {
    fontSize: 13.5,
    fontFamily: FARMER_THEME.fonts.medium,
    color: '#1B2A22',
    lineHeight: 19,
  },
  farmerTextCurrent: {
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#0E3B29',
  },
  farmerTextInactive: {
    color: '#6B7A6F',
  },
  adminTimelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  adminDotCompleted: {
    backgroundColor: '#1F2F6B',
  },
  adminDotCurrent: {
    backgroundColor: '#1F2F6B',
    borderWidth: 2,
    borderColor: '#E7C06A',
  },
  adminDotInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E3E7F2',
  },
  adminInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E7C06A',
  },
  adminTimelineLine: {
    width: 2,
    flex: 1,
    marginTop: -2,
    marginBottom: -2,
    zIndex: 1,
  },
  adminLineCompleted: {
    backgroundColor: '#1F2F6B',
  },
  adminLineInactive: {
    backgroundColor: '#E3E7F2',
  },
  adminTimelineText: {
    fontSize: 13,
    fontFamily: AdminFonts.medium,
    color: '#0B1326',
    lineHeight: 18,
  },
  adminTextCurrent: {
    fontFamily: AdminFonts.bold,
    color: '#0B1326',
  },
  adminTextInactive: {
    fontFamily: AdminFonts.regular,
    color: '#8A93AB',
  },
});


import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle, StyleProp } from 'react-native';

interface SkeletonProps {
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'customer' | 'farmer' | 'admin';
}

export const Skeleton: React.FC<SkeletonProps> = ({ style, variant = 'default' }) => {
  const animatedValue = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 0.85,
          duration: 900,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.35,
          duration: 900,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const isFarmer = variant === 'farmer';
  const isCustomer = variant === 'customer';
  const isAdmin = variant === 'admin';

  const bgColorInterpolation = isFarmer
    ? animatedValue.interpolate({
        inputRange: [0.35, 0.85],
        outputRange: ['#E3EDE5', '#F1F7EE'],
      })
    : isAdmin
    ? animatedValue.interpolate({
        inputRange: [0.35, 0.85],
        outputRange: ['#E3E7F2', '#F1F3FA'],
      })
    : undefined;

  return (
    <Animated.View
      style={[
        isCustomer
          ? styles.customerSkeleton
          : isFarmer
          ? [styles.farmerSkeleton, { backgroundColor: bgColorInterpolation }]
          : isAdmin
          ? [styles.adminSkeleton, { backgroundColor: bgColorInterpolation }]
          : styles.skeleton,
        style,
        !isFarmer && !isAdmin && { opacity: animatedValue },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  customerSkeleton: {
    backgroundColor: '#EEDDCE',
    borderRadius: 8,
  },
  farmerSkeleton: {
    backgroundColor: '#E3EDE5',
    borderRadius: 8,
  },
  adminSkeleton: {
    backgroundColor: '#E3E7F2',
    borderRadius: 12,
  },
});


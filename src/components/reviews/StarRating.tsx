import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
interface StarRatingProps {
  rating: number;
  maxStars?: number;
  onRatingChange?: (rating: number) => void;
  size?: number;
  disabled?: boolean;
  variant?: 'default' | 'customer' | 'farmer';
}
export const StarRating = ({
  rating,
  maxStars = 5,
  onRatingChange,
  size = 24,
  disabled = false,
  variant = 'default',
}: StarRatingProps) => {
  const isCustomer = variant === 'customer';
  const isFarmer = variant === 'farmer';
  const filledColor = isCustomer || isFarmer ? '#F0A020' : '#F59E0B';
  const emptyColor = isCustomer ? '#E6D5C0' : isFarmer ? '#DCE8DF' : '#D1D5DB';

  const stars = [];
  for (let i = 1; i <= maxStars; i++) {
    const isFilled = i <= rating;
    stars.push(
      <TouchableOpacity
        key={i}
        activeOpacity={0.7}
        onPress={() => !disabled && onRatingChange && onRatingChange(i)}
        disabled={disabled}
        style={styles.starContainer}
      >
        <Ionicons
          name={isFilled ? 'star' : (isCustomer ? 'star' : 'star-outline')}
          size={size}
          color={isFilled ? filledColor : emptyColor}
        />
      </TouchableOpacity>
    );
  }
  return <View style={styles.container}>{stars}</View>;
};
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starContainer: {
    paddingHorizontal: 2,
  },
});

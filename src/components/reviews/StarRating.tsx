import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  onRatingChange?: (rating: number) => void;
  size?: number;
  disabled?: boolean;
}

export const StarRating = ({
  rating,
  maxStars = 5,
  onRatingChange,
  size = 24,
  disabled = false,
}: StarRatingProps) => {
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
          name={isFilled ? 'star' : 'star-outline'}
          size={size}
          color={isFilled ? '#F59E0B' : '#D1D5DB'}
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

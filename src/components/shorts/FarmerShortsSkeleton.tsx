import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Animated } from 'react-native';

export const FarmerShortsSkeleton: React.FC = () => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {[0, 1, 2, 3].map(key => (
        <Animated.View
          key={key}
          style={[styles.card, { opacity: pulseAnim }]}
        >
          <View style={styles.badgePlaceholder} />
          <View style={styles.bottomPlaceholder}>
            <View style={styles.line1} />
            <View style={styles.line2} />
          </View>
        </Animated.View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  card: {
    width: 135,
    height: 240, // 9:16 aspect ratio
    borderRadius: 16,
    backgroundColor: '#1E293B',
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: 12,
  },
  badgePlaceholder: {
    width: 50,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  bottomPlaceholder: {
    gap: 6,
  },
  line1: {
    width: '80%',
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  line2: {
    width: '50%',
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
});

export default FarmerShortsSkeleton;

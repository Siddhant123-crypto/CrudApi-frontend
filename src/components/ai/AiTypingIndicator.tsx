import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { AiSparkleIcon } from '../farmer/FarmerIcons';
import { FARMER_THEME } from '../../constants/farmerTheme';

interface AiTypingIndicatorProps {
  theme?: 'farmer' | 'customer';
}

export const AiTypingIndicator: React.FC<AiTypingIndicatorProps> = ({
  theme = 'farmer',
}) => {
  const isCustomer = theme === 'customer';
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const createAnim = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.delay(500 - delay),
        ])
      );
    };

    const anim1 = createAnim(dot1, 0);
    const anim2 = createAnim(dot2, 150);
    const anim3 = createAnim(dot3, 300);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.avatarCircle,
          isCustomer && { backgroundColor: '#4A1A0A' },
        ]}
      >
        <AiSparkleIcon size={16} color="#F2B544" />
      </View>
      <View
        style={[
          styles.indicatorBubble,
          isCustomer && { borderColor: '#EADFCB' },
        ]}
      >
        <View style={styles.dotsRow}>
          <Animated.View
            style={[
              styles.dot,
              isCustomer && { backgroundColor: '#B24A14' },
              { opacity: dot1 },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              isCustomer && { backgroundColor: '#B24A14' },
              { opacity: dot2 },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              isCustomer && { backgroundColor: '#B24A14' },
              { opacity: dot3 },
            ]}
          />
        </View>
        <Text
          style={[
            styles.text,
            isCustomer && {
              color: '#4A1A0A',
              fontFamily: 'PlusJakartaSans_500Medium',
            },
          ]}
        >
          Thinking...
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  avatarCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#14532D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  indicatorBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D5E3CC',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#14532D',
  },
  text: {
    fontSize: 13,
    color: '#14532D',
    fontFamily: FARMER_THEME.fonts.medium,
  },
});

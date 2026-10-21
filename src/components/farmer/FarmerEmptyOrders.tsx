import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { FARMER_THEME } from '../../constants/farmerTheme';
import { BoxIcon } from './FarmerIcons';

interface FarmerEmptyOrdersProps {
  style?: StyleProp<ViewStyle>;
}

export const FarmerEmptyOrders: React.FC<FarmerEmptyOrdersProps> = ({ style }) => {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.iconCircleContainer}>
        <Svg width={64} height={64} viewBox="0 0 64 64" style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="emptyOrderGrad" cx="50%" cy="40%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#FFFFFF" />
              <Stop offset="100%" stopColor="#DDF3E4" />
            </RadialGradient>
          </Defs>
          <Circle cx={32} cy={32} r={32} fill="url(#emptyOrderGrad)" />
        </Svg>
        <BoxIcon size={30} color={FARMER_THEME.colors.primaryGreen} strokeWidth={1.7} />
      </View>

      <Text style={styles.title}>No new orders yet</Text>
      <Text style={styles.subtitle}>
        New orders from customers will show up here
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: FARMER_THEME.colors.cardBg,
    borderWidth: 1,
    borderColor: FARMER_THEME.colors.cardBorder,
    ...FARMER_THEME.shadows.card,
  },
  iconCircleContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  title: {
    marginTop: 12,
    fontFamily: FARMER_THEME.fonts.serifSemiBold,
    fontSize: 16,
    color: FARMER_THEME.colors.darkGreen,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 4,
    fontFamily: FARMER_THEME.fonts.regular,
    fontSize: 11.5,
    color: FARMER_THEME.colors.textSecondary,
    textAlign: 'center',
  },
});

export default FarmerEmptyOrders;

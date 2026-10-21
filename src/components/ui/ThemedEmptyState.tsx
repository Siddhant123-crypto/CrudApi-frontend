import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { THEME } from '../../constants/theme';
import { PrimaryButton, GoldButton } from './Buttons';

interface ThemedEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  buttonTitle?: string;
  onButtonPress?: () => void;
  buttonVariant?: 'primary' | 'gold';
  style?: StyleProp<ViewStyle>;
}

export const ThemedEmptyState: React.FC<ThemedEmptyStateProps> = ({
  icon,
  title,
  subtitle,
  buttonTitle,
  onButtonPress,
  buttonVariant = 'gold',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* 120x120 Circle with peach radial gradient */}
      <View style={styles.iconCircleContainer}>
        <Svg width={120} height={120} style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="peachRadial" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#FFFFFF" />
              <Stop offset="65%" stopColor="#FFF1DE" />
              <Stop offset="100%" stopColor="#FBDDB8" />
            </RadialGradient>
          </Defs>
          <Circle cx={60} cy={60} r={58} fill="url(#peachRadial)" />
        </Svg>
        <View style={styles.iconCenter}>{icon}</View>
      </View>

      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      {buttonTitle && onButtonPress ? (
        <View style={styles.buttonWrapper}>
          {buttonVariant === 'primary' ? (
            <PrimaryButton title={buttonTitle} onPress={onButtonPress} />
          ) : (
            <GoldButton title={buttonTitle} onPress={onButtonPress} />
          )}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  iconCircleContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F0E1CF',
  },
  iconCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: THEME.fonts.serif,
    fontSize: 20,
    color: THEME.colors.textHeading,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: THEME.fonts.regular,
    fontSize: 14,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonWrapper: {
    minWidth: 160,
  },
});

export default ThemedEmptyState;

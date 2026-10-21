import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { THEME } from '../../constants/theme';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'accent' | 'neutral';

interface ThemedBadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
}

export const ThemedBadge: React.FC<ThemedBadgeProps> = ({
  label,
  variant = 'neutral',
  style,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          bg: THEME.colors.successBg,
          text: THEME.colors.success,
        };
      case 'warning':
        return {
          bg: THEME.colors.warningBg,
          text: THEME.colors.warning,
        };
      case 'error':
        return {
          bg: THEME.colors.errorBg,
          text: THEME.colors.error,
        };
      case 'accent':
        return {
          bg: THEME.colors.chipBg,
          text: THEME.colors.accent,
        };
      case 'neutral':
      default:
        return {
          bg: '#F5EBE1',
          text: THEME.colors.textSecondary,
        };
    }
  };

  const { bg, text } = getVariantStyles();

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.radius.pill,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: THEME.fonts.bold,
    fontSize: 11,
    letterSpacing: 0.2,
  },
});

export default ThemedBadge;

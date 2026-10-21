import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '../constants/theme';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'danger' | 'gold' | 'maroon';
  rightIcon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  testID?: string;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  style,
  textStyle,
  loading = false,
  disabled = false,
  variant = 'primary',
  rightIcon,
  leftIcon,
  testID,
}) => {
  const isPrimary = variant === 'primary';
  const isMaroon = variant === 'maroon';
  const isGold = variant === 'gold';
  const isOutline = variant === 'outline';
  const isDanger = variant === 'danger';

  if (isPrimary || isMaroon || isGold) {
    const gradientColors = isGold
      ? THEME.colors.ctaGoldGradient
      : isMaroon
      ? THEME.colors.ctaMaroonGradient
      : THEME.colors.ctaOrangeGradient;

    const textColor = isGold
      ? THEME.colors.ctaGoldText
      : THEME.colors.white;

    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
        testID={testID}
        accessibilityLabel={testID}
        style={[
          styles.buttonWrapper,
          isPrimary && THEME.shadows.primaryButton,
          (disabled || loading) && styles.disabledButton,
          style,
        ]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientFill}
        >
          {loading ? (
            <ActivityIndicator color={textColor} size="small" />
          ) : (
            <View style={styles.contentContainer}>
              {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
              <Text style={[styles.text, { color: textColor }, textStyle]}>
                {title}
              </Text>
              {rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>}
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.buttonWrapper,
        styles.outlineBase,
        isOutline && styles.outlineButton,
        isDanger && styles.dangerButton,
        (disabled || loading) && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      testID={testID}
      accessibilityLabel={testID}
    >
      {loading ? (
        <ActivityIndicator
          color={isDanger ? THEME.colors.error : THEME.colors.accent}
          size="small"
        />
      ) : (
        <View style={styles.contentContainer}>
          {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
          <Text
            style={[
              styles.text,
              isOutline && styles.outlineText,
              isDanger && styles.dangerText,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonWrapper: {
    height: 54,
    borderRadius: THEME.radius.buttons,
    overflow: 'hidden',
    marginVertical: 6,
  },
  gradientFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIconContainer: {
    marginRight: 8,
  },
  rightIconContainer: {
    marginLeft: 8,
  },
  text: {
    fontFamily: THEME.fonts.bold,
    fontSize: 15,
    letterSpacing: 0.3,
  },
  outlineBase: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  outlineButton: {
    backgroundColor: THEME.colors.white,
    borderWidth: 1.5,
    borderColor: THEME.colors.inputBorder,
  },
  outlineText: {
    color: THEME.colors.accent,
  },
  dangerButton: {
    backgroundColor: THEME.colors.errorBg,
    borderWidth: 1.5,
    borderColor: THEME.colors.error,
  },
  dangerText: {
    color: THEME.colors.error,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default CustomButton;

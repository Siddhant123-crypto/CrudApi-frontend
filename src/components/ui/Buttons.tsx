import React from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  StyleProp,
  TextStyle,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '../../constants/theme';
import { PlusIcon } from '../CustomerIcons';

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
}

export const PrimaryButton: React.FC<ButtonProps> = ({
  title,
  onPress,
  disabled,
  loading,
  style,
  textStyle,
  contentStyle,
  icon,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        styles.primaryContainer,
        disabled && styles.disabled,
        THEME.shadows.primaryButton,
        style,
      ]}
    >
      <LinearGradient
        colors={THEME.colors.ctaOrangeGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientFill, contentStyle]}
      >
        {loading ? (
          <ActivityIndicator color={THEME.colors.white} size="small" />
        ) : (
          <View style={styles.buttonContent}>
            {icon && <View style={styles.buttonIcon}>{icon}</View>}
            <Text numberOfLines={1} style={[styles.primaryText, textStyle]}>{title}</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

export const MaroonButton: React.FC<ButtonProps> = ({
  title,
  onPress,
  disabled,
  loading,
  style,
  textStyle,
  contentStyle,
  icon,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        styles.primaryContainer,
        disabled && styles.disabled,
        styles.maroonShadow,
        style,
      ]}
    >
      <LinearGradient
        colors={THEME.colors.ctaMaroonGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientFill, contentStyle]}
      >
        {loading ? (
          <ActivityIndicator color={THEME.colors.white} size="small" />
        ) : (
          <View style={styles.buttonContent}>
            {icon && <View style={styles.buttonIcon}>{icon}</View>}
            <Text numberOfLines={1} style={[styles.maroonText, textStyle]}>{title}</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

export const GoldButton: React.FC<ButtonProps> = ({
  title,
  onPress,
  disabled,
  loading,
  style,
  textStyle,
  icon,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        styles.goldContainer,
        disabled && styles.disabled,
        style,
      ]}
    >
      <LinearGradient
        colors={THEME.colors.ctaGoldGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.goldGradient}
      >
        {loading ? (
          <ActivityIndicator color={THEME.colors.ctaGoldText} size="small" />
        ) : (
          <View style={styles.buttonContent}>
            {icon && <View style={styles.buttonIcon}>{icon}</View>}
            <Text style={[styles.goldText, textStyle]}>{title}</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

export const OutlineButton: React.FC<ButtonProps> = ({
  title,
  onPress,
  disabled,
  loading,
  style,
  textStyle,
  icon,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        styles.outlineContainer,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={THEME.colors.accent} size="small" />
      ) : (
        <View style={styles.buttonContent}>
          {icon && <View style={styles.buttonIcon}>{icon}</View>}
          <Text style={[styles.outlineText, textStyle]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export const TextLink: React.FC<{
  title: string;
  onPress: () => void;
  style?: StyleProp<TextStyle>;
}> = ({ title, onPress, style }) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.textLink, style]}>{title}</Text>
    </TouchableOpacity>
  );
};

export const IconAddButton: React.FC<{
  onPress: () => void;
  size?: number;
  style?: StyleProp<ViewStyle>;
}> = ({ onPress, size = 38, style }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.iconAddContainer,
        { width: size, height: size, borderRadius: 13 },
        THEME.shadows.primaryButton,
        style,
      ]}
    >
      <LinearGradient
        colors={THEME.colors.ctaOrangeGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconAddGradient}
      >
        <PlusIcon size={Math.round(size * 0.52)} color={THEME.colors.white} strokeWidth={2.4} />
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  primaryContainer: {
    height: 56,
    borderRadius: THEME.radius.buttons,
    overflow: 'hidden',
  },
  gradientFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 16,
    color: THEME.colors.white,
    letterSpacing: 0.3,
  },
  maroonShadow: {
    shadowColor: 'rgba(90,40,15,1)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 5,
  },
  maroonText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 16,
    color: THEME.colors.ctaMaroonText,
    letterSpacing: 0.3,
  },
  goldContainer: {
    height: 40,
    borderRadius: THEME.radius.smallButtons,
    overflow: 'hidden',
  },
  goldGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  goldText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 13,
    color: THEME.colors.ctaGoldText,
  },
  outlineContainer: {
    height: 54,
    borderRadius: THEME.radius.buttons,
    backgroundColor: THEME.colors.white,
    borderWidth: 1.5,
    borderColor: THEME.colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  outlineText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 15,
    color: THEME.colors.accent,
  },
  textLink: {
    fontFamily: THEME.fonts.bold,
    fontSize: 14,
    color: THEME.colors.accent,
  },
  iconAddContainer: {
    overflow: 'hidden',
  },
  iconAddGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});

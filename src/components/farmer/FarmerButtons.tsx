import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FARMER_THEME } from '../../constants/farmerTheme';
import { PlusIcon } from './FarmerIcons';

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  compact?: boolean;
}

export const FarmerPrimaryButton: React.FC<ButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  compact = false,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.btnWrapper,
        disabled && styles.disabled,
        compact ? styles.compactHeight : styles.largeHeight,
        style,
      ]}
    >
      <LinearGradient
        colors={FARMER_THEME.colors.primaryBtnGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientFill}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <View style={styles.contentRow}>
            {icon && <View style={styles.iconMargin}>{icon}</View>}
            <Text
              style={[styles.primaryText, compact && styles.compactText, textStyle]}
              maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
            >
              {title}
            </Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

export const FarmerGoldButton: React.FC<ButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  compact = false,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.btnWrapper,
        disabled && styles.disabled,
        compact ? styles.compactHeight : styles.largeHeight,
        style,
      ]}
    >
      <LinearGradient
        colors={FARMER_THEME.colors.goldBtnGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientFill}
      >
        {loading ? (
          <ActivityIndicator color={FARMER_THEME.colors.headings} size="small" />
        ) : (
          <View style={styles.contentRow}>
            {icon && <View style={styles.iconMargin}>{icon}</View>}
            <Text
              style={[styles.goldText, compact && styles.compactText, textStyle]}
              maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
            >
              {title}
            </Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

export const FarmerDeepButton: React.FC<ButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  compact = false,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.btnWrapper,
        disabled && styles.disabled,
        compact ? styles.compactHeight : styles.largeHeight,
        style,
      ]}
    >
      <LinearGradient
        colors={FARMER_THEME.colors.deepBtnGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientFill}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <View style={styles.contentRow}>
            {icon && <View style={styles.iconMargin}>{icon}</View>}
            <Text
              style={[styles.deepText, compact && styles.compactText, textStyle]}
              maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
            >
              {title}
            </Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

interface OutlineButtonProps extends ButtonProps {
  borderColor?: string;
  textColor?: string;
}

export const FarmerOutlineButton: React.FC<OutlineButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  compact = false,
  borderColor,
  textColor,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.outlineBtn,
        compact ? styles.compactHeight : styles.outlineHeight,
        borderColor ? { borderColor } : null,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={textColor || FARMER_THEME.colors.primaryGreen}
          size="small"
        />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconMargin}>{icon}</View>}
          <Text
            style={[
              styles.outlineText,
              textColor ? { color: textColor } : null,
              compact && styles.compactText,
              textStyle,
            ]}
            maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

interface TextLinkProps {
  text: string;
  onPress: () => void;
  style?: TextStyle;
  color?: string;
}

export const FarmerTextLink: React.FC<TextLinkProps> = ({
  text,
  onPress,
  style,
  color,
}) => {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Text
        style={[
          styles.textLink,
          color ? { color } : null,
          style,
        ]}
        maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
      >
        {text}
      </Text>
    </TouchableOpacity>
  );
};

interface SmallAddButtonProps {
  onPress: () => void;
  style?: ViewStyle;
}

export const FarmerSmallAddButton: React.FC<SmallAddButtonProps> = ({
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.smallAddBtn, style]}
    >
      <LinearGradient
        colors={FARMER_THEME.colors.primaryBtnGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.smallAddGradient}
      >
        <PlusIcon size={20} color="#FFFFFF" strokeWidth={2.5} />
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btnWrapper: {
    borderRadius: FARMER_THEME.radius.largeButtons,
    overflow: 'hidden',
  },
  largeHeight: {
    height: 56,
  },
  compactHeight: {
    height: 42,
    borderRadius: 14,
  },
  outlineHeight: {
    height: 54,
  },
  gradientFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconMargin: {
    marginRight: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  primaryText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  goldText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 16,
    color: FARMER_THEME.colors.headings,
    letterSpacing: 0.3,
  },
  deepText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  outlineBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: FARMER_THEME.colors.inputBorder,
    borderRadius: FARMER_THEME.radius.buttons,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  outlineText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 16,
    color: FARMER_THEME.colors.primaryGreen,
  },
  compactText: {
    fontSize: 14,
  },
  textLink: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 14,
    color: FARMER_THEME.colors.primaryGreen,
  },
  smallAddBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    overflow: 'hidden',
    ...FARMER_THEME.shadows.tile,
  },
  smallAddGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

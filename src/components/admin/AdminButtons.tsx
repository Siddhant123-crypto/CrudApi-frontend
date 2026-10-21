import React from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ADMIN_THEME, AdminFonts } from '../../constants/adminTheme';

interface BaseAdminButtonProps extends TouchableOpacityProps {
  title?: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  gradientStyle?: ViewStyle;
  textStyle?: TextStyle;
  children?: React.ReactNode;
}

// 1) AdminPrimaryButton (Navy Gradient)
export const AdminPrimaryButton: React.FC<BaseAdminButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  compact = false,
  icon,
  style,
  gradientStyle,
  textStyle,
  children,
  ...props
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.shadowWrapper,
        compact && styles.compactShadowWrapper,
        disabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      <LinearGradient
        colors={ADMIN_THEME.colors.navyGradient}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={[
          styles.primaryGradient,
          compact && styles.compactGradient,
          gradientStyle,
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <View style={styles.buttonContent}>
            {icon && <View style={[styles.iconMargin, compact && styles.compactIconMargin]}>{icon}</View>}
            {title ? (
              <Text
                style={[
                  styles.primaryText,
                  compact && styles.compactText,
                  textStyle,
                ]}
              >
                {title}
              </Text>
            ) : (
              children
            )}
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

// 2) AdminGoldButton (Champagne Gold Gradient)
export const AdminGoldButton: React.FC<BaseAdminButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  children,
  ...props
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.goldShadowWrapper, disabled && styles.disabled, style]}
      {...props}
    >
      <LinearGradient
        colors={ADMIN_THEME.colors.goldButtonGradient}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.goldGradient}
      >
        {loading ? (
          <ActivityIndicator color={ADMIN_THEME.colors.ink} size="small" />
        ) : (
          <View style={styles.buttonContent}>
            {icon && <View style={styles.iconMargin}>{icon}</View>}
            {title ? <Text style={[styles.goldText, textStyle]}>{title}</Text> : children}
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

// 3) AdminOutlineButton (White card, Border, Indigo text)
export const AdminOutlineButton: React.FC<BaseAdminButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  compact = false,
  icon,
  style,
  textStyle,
  children,
  ...props
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.outlineButton,
        compact && styles.compactOutlineButton,
        disabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={ADMIN_THEME.colors.indigo} size="small" />
      ) : (
        <View style={styles.buttonContent}>
          {icon && <View style={[styles.iconMargin, compact && styles.compactIconMargin]}>{icon}</View>}
          {title ? (
            <Text
              style={[
                styles.outlineText,
                compact && styles.compactText,
                textStyle,
              ]}
            >
              {title}
            </Text>
          ) : (
            children
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

// 4) AdminDangerButton (Soft Red, Error text)
export const AdminDangerButton: React.FC<BaseAdminButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  children,
  ...props
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.dangerButton, disabled && styles.disabled, style]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={ADMIN_THEME.colors.statusError} size="small" />
      ) : (
        <View style={styles.buttonContent}>
          {icon && <View style={styles.iconMargin}>{icon}</View>}
          {title ? <Text style={[styles.dangerText, textStyle]}>{title}</Text> : children}
        </View>
      )}
    </TouchableOpacity>
  );
};

// 5) AdminTextLink
export const AdminTextLink: React.FC<BaseAdminButtonProps> = ({
  title,
  onPress,
  style,
  textStyle,
  children,
  ...props
}) => {
  return (
    <TouchableOpacity activeOpacity={0.6} onPress={onPress} style={style} {...props}>
      {title ? <Text style={[styles.textLink, textStyle]}>{title}</Text> : children}
    </TouchableOpacity>
  );
};

// 6) Small Round Icon Button (38x38, radius 13, navy gradient with gold icon)
export const AdminIconButton: React.FC<BaseAdminButtonProps> = ({
  onPress,
  icon,
  style,
  disabled = false,
  ...props
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled}
      style={[styles.iconButtonWrapper, disabled && styles.disabled, style]}
      {...props}
    >
      <LinearGradient
        colors={ADMIN_THEME.colors.navyGradient}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.iconButtonGradient}
      >
        {icon}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  shadowWrapper: {
    borderRadius: ADMIN_THEME.radius.button,
    ...ADMIN_THEME.shadows.primaryButton,
  },
  compactShadowWrapper: {
    borderRadius: 18,
  },
  primaryGradient: {
    height: 56,
    borderRadius: ADMIN_THEME.radius.button,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  compactGradient: {
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 14,
  },
  primaryText: {
    fontFamily: AdminFonts.bold,
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  goldShadowWrapper: {
    borderRadius: ADMIN_THEME.radius.button,
    ...ADMIN_THEME.shadows.supportButton,
  },
  goldGradient: {
    height: 52,
    borderRadius: ADMIN_THEME.radius.button,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  goldText: {
    fontFamily: AdminFonts.bold,
    fontSize: 15,
    color: ADMIN_THEME.colors.ink,
    letterSpacing: 0.2,
  },
  outlineButton: {
    height: 52,
    borderRadius: ADMIN_THEME.radius.button,
    backgroundColor: ADMIN_THEME.colors.card,
    borderWidth: 1.5,
    borderColor: ADMIN_THEME.colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  compactOutlineButton: {
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 14,
  },
  outlineText: {
    fontFamily: AdminFonts.bold,
    fontSize: 15,
    color: ADMIN_THEME.colors.indigo,
  },
  compactText: {
    fontSize: 13,
  },
  dangerButton: {
    height: 52,
    borderRadius: ADMIN_THEME.radius.button,
    backgroundColor: ADMIN_THEME.colors.statusErrorBg,
    borderWidth: 1,
    borderColor: 'rgba(214,69,69,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  dangerText: {
    fontFamily: AdminFonts.bold,
    fontSize: 15,
    color: ADMIN_THEME.colors.statusError,
  },
  textLink: {
    fontFamily: AdminFonts.bold,
    fontSize: 13,
    color: ADMIN_THEME.colors.indigo,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconMargin: {
    marginRight: 8,
  },
  compactIconMargin: {
    marginRight: 6,
  },
  iconButtonWrapper: {
    width: 38,
    height: 38,
    borderRadius: 13,
    overflow: 'hidden',
  },
  iconButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});

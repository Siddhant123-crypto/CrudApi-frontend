import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ADMIN_THEME, AdminFonts } from '../../constants/adminTheme';
import { AdminPrimaryButton } from './AdminButtons';

export interface AdminEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  message?: string;
  actionTitle?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
}

export const AdminEmptyState: React.FC<AdminEmptyStateProps> = ({
  icon,
  title,
  subtitle,
  message,
  actionTitle,
  onActionPress,
  style,
}) => {
  const desc = message || subtitle;

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={['#FFFFFF', ADMIN_THEME.colors.indigoTint]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.circle}
      >
        {icon}
      </LinearGradient>

      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>

      {desc ? (
        <Text style={styles.subtitle} numberOfLines={3}>
          {desc}
        </Text>
      ) : null}

      {actionTitle && onActionPress ? (
        <View style={styles.actionWrapper}>
          <AdminPrimaryButton title={actionTitle} onPress={onActionPress} />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  circle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: ADMIN_THEME.colors.cardBorder,
    ...ADMIN_THEME.shadows.card,
  },
  title: {
    fontFamily: AdminFonts.heading,
    fontSize: 20,
    color: ADMIN_THEME.colors.ink,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: AdminFonts.regular,
    fontSize: 14,
    color: ADMIN_THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionWrapper: {
    marginTop: 20,
    minWidth: 160,
  },
});

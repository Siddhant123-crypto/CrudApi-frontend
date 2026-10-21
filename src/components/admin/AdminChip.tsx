import React from 'react';
import { Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ADMIN_THEME, AdminFonts } from '../../constants/adminTheme';

export interface AdminChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  count?: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const AdminChip: React.FC<AdminChipProps> = React.memo(({
  label,
  active,
  onPress,
  count,
  style,
  textStyle,
}) => {
  const displayText = count !== undefined ? `${label} (${count})` : label;

  if (active) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={[styles.activeShadow, style]}
      >
        <LinearGradient
          colors={ADMIN_THEME.colors.navyGradient}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.chipBase}
        >
          <Text style={[styles.activeText, textStyle]} numberOfLines={1}>
            {displayText}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.inactiveChip, style]}
    >
      <Text style={[styles.inactiveText, textStyle]} numberOfLines={1}>
        {displayText}
      </Text>
    </TouchableOpacity>
  );
});

AdminChip.displayName = 'AdminChip';
export default AdminChip;

const styles = StyleSheet.create({
  chipBase: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: ADMIN_THEME.radius.chip,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeShadow: {
    borderRadius: ADMIN_THEME.radius.chip,
    ...ADMIN_THEME.shadows.tabBarActiveItem,
  },
  activeText: {
    fontFamily: AdminFonts.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  inactiveChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: ADMIN_THEME.radius.chip,
    backgroundColor: ADMIN_THEME.colors.card,
    borderWidth: 1,
    borderColor: ADMIN_THEME.colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inactiveText: {
    fontFamily: AdminFonts.semiBold,
    fontSize: 13,
    color: ADMIN_THEME.colors.textSecondary,
  },
});

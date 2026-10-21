import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ADMIN_THEME } from '../../constants/adminTheme';
import { UsersIcon, CubeIcon, GridIcon, ReceiptIcon, BarChartIcon } from './AdminIcons';

export type QuickActionType = 'users' | 'products' | 'category' | 'orders' | 'reports';

interface QuickActionTileProps {
  label: string;
  type: QuickActionType;
  onPress: () => void;
}

export const QuickActionTile: React.FC<QuickActionTileProps> = ({
  label,
  type,
  onPress,
}) => {
  let renderIcon = <UsersIcon size={20} color={ADMIN_THEME.colors.gold} strokeWidth={1.8} />;

  if (type === 'products') {
    renderIcon = <CubeIcon size={20} color={ADMIN_THEME.colors.gold} strokeWidth={1.8} />;
  } else if (type === 'category') {
    renderIcon = <GridIcon size={20} color={ADMIN_THEME.colors.gold} strokeWidth={1.8} />;
  } else if (type === 'orders') {
    renderIcon = <ReceiptIcon size={20} color={ADMIN_THEME.colors.gold} strokeWidth={1.8} />;
  } else if (type === 'reports') {
    renderIcon = <BarChartIcon size={20} color={ADMIN_THEME.colors.gold} strokeWidth={1.8} />;
  }

  return (
    <View style={styles.shadowWrapper}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
      >
        <LinearGradient
          colors={ADMIN_THEME.colors.darkTileGradient}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.container}
        >
          {/* Icon circle */}
          <View style={styles.iconCircle}>
            {renderIcon}
          </View>

          {/* Label */}
          <Text
            style={styles.label}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {label}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  shadowWrapper: {
    borderRadius: ADMIN_THEME.radius.quickActionTile,
    ...ADMIN_THEME.shadows.quickActionTile,
  },
  container: {
    width: 92,
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 6,
    borderRadius: ADMIN_THEME.radius.quickActionTile,
    alignItems: 'center',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(231,192,106,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(231,192,106,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    marginTop: 6,
    fontFamily: ADMIN_THEME.fonts.semiBold,
    fontSize: 11,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

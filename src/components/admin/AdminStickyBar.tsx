import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ADMIN_THEME } from '../../constants/adminTheme';

export interface AdminStickyBarProps {
  children?: React.ReactNode;
  style?: ViewStyle;
}

export const AdminStickyBar: React.FC<AdminStickyBarProps> = React.memo(({ children, style }) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.stickyBar,
        { paddingBottom: Math.max(insets.bottom, 16) },
        style,
      ]}
    >
      {children}
    </View>
  );
});

AdminStickyBar.displayName = 'AdminStickyBar';
export default AdminStickyBar;

const styles = StyleSheet.create({
  stickyBar: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: ADMIN_THEME.colors.cardBorder,
    ...ADMIN_THEME.shadows.stickyBar,
  },
});

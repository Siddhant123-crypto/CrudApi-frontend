import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { ADMIN_THEME } from '../../constants/adminTheme';

export interface AdminCardProps extends ViewProps {
  children?: React.ReactNode;
}

export const AdminCard: React.FC<AdminCardProps> = React.memo(({ children, style, ...props }) => {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
});

AdminCard.displayName = 'AdminCard';
export default AdminCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: ADMIN_THEME.colors.card,
    borderRadius: ADMIN_THEME.radius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: ADMIN_THEME.colors.cardBorder,
    ...ADMIN_THEME.shadows.card,
  },
});

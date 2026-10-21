import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ADMIN_THEME } from '../../constants/adminTheme';
import { ArrowRightIcon } from './AdminIcons';

interface AdminSectionHeaderProps {
  title: string;
  actionText?: string;
  onActionPress?: () => void;
}

export const AdminSectionHeader: React.FC<AdminSectionHeaderProps> = ({
  title,
  actionText,
  onActionPress,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {actionText && (
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.actionButton}
          onPress={onActionPress}
        >
          <Text style={styles.actionText}>{actionText}</Text>
          <ArrowRightIcon size={14} color={ADMIN_THEME.colors.indigo} strokeWidth={2.4} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  title: {
    fontFamily: ADMIN_THEME.fonts.serif,
    fontSize: 18,
    color: ADMIN_THEME.colors.ink,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionText: {
    fontFamily: ADMIN_THEME.fonts.bold,
    fontSize: 12,
    color: ADMIN_THEME.colors.indigo,
  },
});

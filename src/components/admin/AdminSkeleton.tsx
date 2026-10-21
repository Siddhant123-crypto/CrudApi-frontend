import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ADMIN_THEME } from '../../constants/adminTheme';

export interface AdminSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const AdminSkeleton: React.FC<AdminSkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  return (
    <View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
        },
        style,
      ]}
    />
  );
};

export const AdminListSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  const items = Array.from({ length: rows }, (_, i) => i);
  return (
    <View style={styles.listSkeletonContainer}>
      {items.map((i) => (
        <View key={i} style={styles.cardSkeleton}>
          <AdminSkeleton width={46} height={46} borderRadius={16} />
          <View style={styles.textSkeletonContainer}>
            <AdminSkeleton width="70%" height={16} borderRadius={6} />
            <AdminSkeleton width="45%" height={12} borderRadius={6} style={{ marginTop: 8 }} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: ADMIN_THEME.colors.cardBorder,
  },
  listSkeletonContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  cardSkeleton: {
    backgroundColor: ADMIN_THEME.colors.card,
    borderRadius: ADMIN_THEME.radius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: ADMIN_THEME.colors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  textSkeletonContainer: {
    flex: 1,
    marginLeft: 12,
  },
});

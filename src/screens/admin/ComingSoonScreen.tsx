import React from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ADMIN_THEME } from '../../constants/adminTheme';
import {
  AdminPageBackground,
  AdminHeader,
  AdminEmptyState,
  BarChartIcon,
} from '../../components/admin';

interface ComingSoonScreenProps {
  route?: {
    params?: {
      title?: string;
      icon?: keyof typeof Ionicons.glyphMap;
    };
  };
}

export const ComingSoonScreen: React.FC<ComingSoonScreenProps> = ({ route }) => {
  const { title = 'Analytics & Reports', icon = 'bar-chart-outline' } = route?.params || {};

  const isChart = String(icon).includes('bar-chart') || String(title).toLowerCase().includes('report') || String(title).toLowerCase().includes('analytic');

  return (
    <AdminPageBackground>
      <AdminHeader variant="inner" title={title} showBackButton={true} />
      <View style={styles.content}>
        <AdminEmptyState
          icon={
            isChart ? (
              <BarChartIcon size={48} color={ADMIN_THEME.colors.indigo} strokeWidth={1.8} />
            ) : (
              <Ionicons
                name={icon as any}
                size={52}
                color={ADMIN_THEME.colors.indigo}
              />
            )
          }
          title={title}
          subtitle="This module is currently under active development. Stay tuned for advanced analytics and reporting features!"
        />
      </View>
    </AdminPageBackground>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
});

export default ComingSoonScreen;

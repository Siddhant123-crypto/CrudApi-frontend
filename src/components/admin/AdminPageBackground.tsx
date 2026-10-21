import React from 'react';
import { View, StyleSheet, ViewProps, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ADMIN_THEME } from '../../constants/adminTheme';

interface AdminPageBackgroundProps extends ViewProps {
  children?: React.ReactNode;
}

const AdminPageBackgroundComponent: React.FC<AdminPageBackgroundProps> = ({ children, style, ...props }) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      <LinearGradient
        colors={ADMIN_THEME.colors.pageBgGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={[styles.inner, style]} {...props}>
        {children}
      </View>
    </View>
  );
};

export const AdminPageBackground = React.memo(AdminPageBackgroundComponent);
AdminPageBackground.displayName = 'AdminPageBackground';
export default AdminPageBackground;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
});

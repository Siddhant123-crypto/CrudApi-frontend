import React from 'react';
import { StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '../../constants/theme';

interface PageBackgroundProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const PageBackground: React.FC<PageBackgroundProps> = ({ children, style }) => {
  return (
    <LinearGradient
      colors={THEME.colors.pageBgGradient}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[styles.container, style]}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default PageBackground;

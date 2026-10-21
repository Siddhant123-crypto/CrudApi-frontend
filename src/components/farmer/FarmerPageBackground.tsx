import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FARMER_THEME } from '../../constants/farmerTheme';

interface FarmerPageBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const FarmerPageBackground: React.FC<FarmerPageBackgroundProps> = React.memo(({
  children,
  style,
}) => {
  return (
    <LinearGradient
      colors={FARMER_THEME.colors.pageBgGradient}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[styles.container, style]}
    >
      {children}
    </LinearGradient>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default FarmerPageBackground;

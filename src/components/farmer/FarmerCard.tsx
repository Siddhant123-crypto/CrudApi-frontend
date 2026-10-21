import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { FARMER_THEME } from '../../constants/farmerTheme';

interface FarmerCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  bordered?: boolean;
}

export const FarmerCard: React.FC<FarmerCardProps> = React.memo(({
  children,
  style,
  bordered = true,
}) => {
  return (
    <View
      style={[
        styles.card,
        bordered && styles.bordered,
        style,
      ]}
    >
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: FARMER_THEME.colors.cardBg,
    borderRadius: FARMER_THEME.radius.cards,
    padding: 16,
    ...FARMER_THEME.shadows.card,
  },
  bordered: {
    borderWidth: 1,
    borderColor: FARMER_THEME.colors.cardBorder,
  },
});

export default FarmerCard;

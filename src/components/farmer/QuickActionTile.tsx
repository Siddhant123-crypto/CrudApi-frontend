import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { FARMER_THEME } from '../../constants/farmerTheme';

export interface QuickActionTileProps {
  label: string;
  boxBg: string;
  icon: React.ReactNode;
  onPress: () => void;
}

export const QuickActionTile: React.FC<QuickActionTileProps> = ({
  label,
  boxBg,
  icon,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.tile}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.iconBox, { backgroundColor: boxBg }]}>
        {icon}
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 4,
    borderRadius: 18,
    backgroundColor: FARMER_THEME.colors.cardBg,
    alignItems: 'center',
    ...FARMER_THEME.shadows.tile,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 4,
    fontFamily: FARMER_THEME.fonts.semiBold,
    fontSize: 10.5,
    color: FARMER_THEME.colors.darkGreen,
    textAlign: 'center',
  },
});

export default QuickActionTile;

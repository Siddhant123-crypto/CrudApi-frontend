import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FARMER_THEME } from '../../constants/farmerTheme';
import { ArrowRightIcon } from './FarmerIcons';

interface FarmerSectionHeaderProps {
  title: string;
  linkText?: string;
  onLinkPress?: () => void;
}

export const FarmerSectionHeader: React.FC<FarmerSectionHeaderProps> = ({
  title,
  linkText,
  onLinkPress,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {linkText && onLinkPress ? (
        <TouchableOpacity
          style={styles.linkRow}
          onPress={onLinkPress}
          activeOpacity={0.7}
        >
          <Text style={styles.linkText}>{linkText}</Text>
          <ArrowRightIcon size={14} color={FARMER_THEME.colors.primaryGreen} strokeWidth={2.4} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  title: {
    fontFamily: FARMER_THEME.fonts.serif,
    fontSize: 18,
    color: FARMER_THEME.colors.darkGreen,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  linkText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 12.5,
    color: FARMER_THEME.colors.primaryGreen,
  },
});

export default FarmerSectionHeader;

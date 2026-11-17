import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FARMER_THEME } from '../../constants/farmerTheme';

interface AiSuggestionChipsProps {
  chips: string[];
  onSelectChip: (chipText: string) => void;
  disabled?: boolean;
  theme?: 'farmer' | 'customer';
}

export const AiSuggestionChips: React.FC<AiSuggestionChipsProps> = ({
  chips,
  onSelectChip,
  disabled = false,
  theme = 'farmer',
}) => {
  if (!chips || chips.length === 0) return null;
  const isCustomer = theme === 'customer';

  return (
    <View style={styles.container}>
      {chips.map((chip, idx) => (
        <TouchableOpacity
          key={`chip-${idx}`}
          style={[
            styles.chip,
            isCustomer && styles.customerChip,
          ]}
          onPress={() => onSelectChip(chip)}
          disabled={disabled}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={`Question suggestion: ${chip}`}
        >
          <Text
            style={[
              styles.chipText,
              isCustomer && styles.customerChipText,
            ]}
          >
            {chip}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 10,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CFE0C5',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 13,
    fontFamily: FARMER_THEME.fonts.semiBold,
    color: '#14532D',
  },
  customerChip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EADFCB',
  },
  customerChipText: {
    color: '#B24A14',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
});

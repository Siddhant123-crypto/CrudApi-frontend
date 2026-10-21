import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { THEME } from '../constants/theme';

interface QuantitySelectorProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onIncrease,
  onDecrease,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, quantity <= 1 && styles.buttonDisabled]}
        onPress={onDecrease}
        disabled={quantity <= 1}
        activeOpacity={0.7}
      >
        <Ionicons
          name="remove"
          size={16}
          color={quantity <= 1 ? THEME.colors.textMuted : THEME.colors.selectedText}
        />
      </TouchableOpacity>
      <Text style={styles.quantityText}>{quantity}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={onIncrease}
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={16} color={THEME.colors.selectedText} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.cardBg,
    borderRadius: THEME.radius.pill,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    padding: 3,
  },
  button: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: THEME.colors.selectedBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: THEME.colors.chipBg,
    opacity: 0.6,
  },
  quantityText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 14,
    color: THEME.colors.textBase,
    paddingHorizontal: 8,
    minWidth: 26,
    textAlign: 'center',
  },
});

export default QuantitySelector;

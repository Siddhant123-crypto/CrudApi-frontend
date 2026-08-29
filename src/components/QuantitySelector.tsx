import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

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
        style={styles.button} 
        onPress={onDecrease}
        disabled={quantity <= 1}
      >
        <Ionicons 
          name="remove" 
          size={18} 
          color={quantity <= 1 ? '#BDBDBD' : '#1E3A8A'} 
        />
      </TouchableOpacity>
      
      <Text style={styles.quantityText}>{quantity}</Text>
      
      <TouchableOpacity style={styles.button} onPress={onIncrease}>
        <Ionicons name="add" size={18} color="#1E3A8A" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  button: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    paddingHorizontal: 10,
    minWidth: 28,
    textAlign: 'center',
  },
});

export default QuantitySelector;

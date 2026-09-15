import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
interface StatCardProps {
  title: string;
  value: string | number;
  growth: string;
  icon: keyof typeof Ionicons.glyphMap;
}
export const StatCard: React.FC<StatCardProps> = ({ title, value, growth, icon }) => {
  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={22} color="#FFFFFF" />
      </View>
      <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>{title}</Text>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={styles.growth} numberOfLines={1} adjustsFontSizeToFit>{growth}</Text>
    </View>
  );
};
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 18,
    alignItems: 'center',
    width: '23%',
    minWidth: 70,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  iconContainer: {
    backgroundColor: '#17212F',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
    textAlign: 'center',
  },
  value: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1B2430',
    marginBottom: 4,
  },
  growth: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '600',
  },
});

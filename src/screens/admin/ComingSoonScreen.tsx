import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AdminHeader } from '../../components/admin/AdminHeader';
import Ionicons from '@expo/vector-icons/Ionicons';
interface ComingSoonScreenProps {
  route?: {
    params?: {
      title?: string;
      icon?: keyof typeof Ionicons.glyphMap;
    }
  }
}
export const ComingSoonScreen: React.FC<ComingSoonScreenProps> = ({ route }) => {
  const { title = 'Module', icon = 'construct-outline' } = route?.params || {};
  return (
    <View style={styles.container}>
      <AdminHeader showBackButton />
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={64} color="#F5C16C" />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Coming Soon</Text>
        <Text style={styles.description}>
          This module is currently under development. Stay tuned!
        </Text>
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F1E6',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#17212F',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B2430',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#F5C16C',
    fontWeight: '600',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
});
export default ComingSoonScreen;

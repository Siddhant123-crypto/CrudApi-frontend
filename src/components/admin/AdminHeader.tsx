import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, DrawerActions } from '@react-navigation/native';

interface AdminHeaderProps {
  onMenuPress?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuPress }) => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.menuButton} 
        onPress={onMenuPress || (() => navigation.navigate('AdminMenu'))}
      >
        <Ionicons name="menu" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>
          Farm<Text style={styles.titleAccent}>2</Text>Home
        </Text>
      </View>

      <View style={styles.rightActions}>
        <TouchableOpacity style={styles.profileButton}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="notifications-outline" size={20} color="#17212F" />
            <View style={styles.badge} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#17212F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50, // safe area approximation
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  menuButton: {
    padding: 8,
  },
  titleContainer: {
    alignItems: 'center',
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  titleAccent: {
    color: '#F5C16C',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginRight: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#F5C16C',
  },
  profileButton: {
    padding: 4,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5C16C',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useNotification } from '../../context/NotificationContext';
interface AdminHeaderProps {
  onMenuPress?: () => void;
  showBackButton?: boolean;
}
export const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuPress, showBackButton = false }) => {
  const navigation = useNavigation<any>();
  const { unreadCount, adminSupportUnreadCount, blockedFarmerUnreadCount, hasNewAdminGroupMsg } = useNotification();
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={
          showBackButton
            ? () => navigation.goBack()
            : onMenuPress || (() => navigation.navigate('AdminMenu'))
        }
      >
        <Ionicons name={showBackButton ? "chevron-back" : "menu"} size={28} color="#FFFFFF" />
      </TouchableOpacity>
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>
          Farm<Text style={styles.titleAccent}>2</Text>Home
        </Text>
      </View>
      <View style={styles.rightActions}>
        <TouchableOpacity 
          style={styles.iconButton} 
          onPress={() => navigation.navigate('AdminGroupChat')}
        >
          <Ionicons name="chatbubbles" size={26} color="#F5C16C" />
          {hasNewAdminGroupMsg && (
            <View style={styles.redDot} />
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.iconButton} 
          onPress={() => navigation.navigate('AdminFarmers', { initialTab: 'Blocked' })}
        >
          <Ionicons name="chatbubbles-outline" size={26} color="#FFFFFF" />
          {blockedFarmerUnreadCount > 0 && (
            <View style={styles.redDot} />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Notifications')}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="notifications-outline" size={20} color="#17212F" />
            {unreadCount > 0 && <View style={[styles.badge, styles.notificationBadge]} />}
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
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  menuButton: {
    padding: 4,
  },
  titleContainer: {
    marginLeft: 8,
    flex: 1,
  },
  titleText: {
    fontSize: 18,
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
    padding: 6,
    marginRight: 2,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#17212F',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  redDot: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444', // Red dot
    borderWidth: 1.5,
    borderColor: '#17212F',
  },
  notificationBadge: {
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    minWidth: 12,
    paddingHorizontal: 0,
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

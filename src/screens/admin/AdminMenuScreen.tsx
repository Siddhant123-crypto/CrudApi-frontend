import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

const AdminMenuScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { logout } = useAuth();

  const menuItems = [
    { title: 'Dashboard', icon: 'home-outline', route: 'Home' },
    { title: 'Farmers', icon: 'people-outline', route: 'AdminFarmers' },
    { title: 'Customers', icon: 'person-outline', route: 'AdminCustomers' },
    { title: 'Products', icon: 'cube-outline', route: 'AdminProducts' },
    { title: 'Categories', icon: 'grid-outline', route: 'AdminCategories' },
    { title: 'Orders', icon: 'receipt-outline', route: 'AdminOrders' },
    { title: 'Farm Verification', icon: 'shield-checkmark-outline', route: 'AdminFarmVerification' },
    { title: 'Analytics & Reports', icon: 'bar-chart-outline', route: 'Analytics' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menu</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {menuItems.map((item, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.menuItem}
            onPress={() => {
              if (item.route === 'Home') {
                navigation.navigate('AdminMain', { screen: 'Home' });
              } else {
                navigation.navigate(item.route);
              }
            }}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name={item.icon as any} size={20} color="#F5C16C" />
              </View>
              <Text style={styles.menuText}>{item.title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#E5E7EB" />
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={logout}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            </View>
            <Text style={styles.logoutText}>Log Out</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F1E6',
  },
  header: {
    backgroundColor: '#17212F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scroll: {
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#17212F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B2430',
  },
  logoutItem: {
    marginTop: 20,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
});

export default AdminMenuScreen;

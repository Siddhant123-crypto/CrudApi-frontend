import React, {useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {useAuth} from '../context/AuthContext';

const OrderSuccessScreen = ({route, navigation}: any) => {
  const {orderNumber, totalAmount} = route.params || {};
  const {user} = useAuth();

  // Prevent going back to checkout
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        navigation.navigate('Home');
        return true;
      }
    );

    return () => backHandler.remove();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={100} color="#4CAF50" />
        </View>
        <Text style={styles.title}>Order Placed Successfully!</Text>
        <Text style={styles.subtitle}>
          Your fresh products will be prepared by the farmer soon.
        </Text>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Order Number:</Text>
            <Text style={styles.value}>{orderNumber ? orderNumber.substring(0, 12) : 'N/A'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.label}>Total Amount:</Text>
            <Text style={styles.value}>₹{totalAmount?.toFixed(2) || '0.00'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.primaryBtn} 
          onPress={() => navigation.navigate(user?.role === 'FARMER' ? 'FarmerMain' : 'CustomerMain', { screen: 'Orders' })}>
          <Text style={styles.primaryBtnText}>View My Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.secondaryBtn} 
          onPress={() => navigation.navigate(user?.role === 'FARMER' ? 'FarmerMain' : 'CustomerMain', { screen: user?.role === 'FARMER' ? 'Dashboard' : 'Home' })}>
          <Text style={styles.secondaryBtnText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  iconContainer: {
    marginBottom: 30,
    backgroundColor: '#F0FDF4',
    borderRadius: 80,
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  label: {
    fontSize: 15,
    color: '#4B5563',
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '700',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  primaryBtn: {
    backgroundColor: '#1B5E20',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default OrderSuccessScreen;

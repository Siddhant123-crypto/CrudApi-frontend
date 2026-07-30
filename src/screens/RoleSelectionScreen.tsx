import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image, Dimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

const RoleSelectionScreen = ({ navigation }: any) => {

  return (
    <SafeAreaView style={styles.container}>
      {/* Home Button in top right */}
      <TouchableOpacity 
        style={styles.homeButton}
        onPress={() => navigation.navigate('Welcome')}
      >
        <Ionicons name="home-outline" size={24} color="#1B5E20" />
        <Text style={styles.homeButtonText}>Home</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Image 
          source={require('../farm2home_logo.png')} 
          style={styles.logoImage} 
          resizeMode="contain" 
        />
        <Text style={styles.title}>Select Your Role</Text>
        <Text style={styles.subtitle}>Choose how you want to continue</Text>

        <TouchableOpacity 
          style={[styles.button, styles.customerButton]}
          onPress={() => navigation.navigate('CustomerLogin')}
        >
          <Text style={styles.buttonText}>I am a Customer</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.farmerButton]}
          onPress={() => navigation.navigate('FarmerLogin')}
        >
          <Text style={styles.buttonText}>I am a Farmer</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5E9', // Light green background
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#C8E6C9',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1B5E20',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#4E7D50',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '500',
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  customerButton: {
    backgroundColor: '#1B5E20',
  },
  farmerButton: {
    backgroundColor: '#E65100',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  backButton: {
    marginTop: 10,
    paddingVertical: 10,
  },
  backButtonText: {
    color: '#1B5E20',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  homeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C8E6C9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 2,
    zIndex: 10,
  },
  homeButtonText: {
    color: '#1B5E20',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
});

export default RoleSelectionScreen;

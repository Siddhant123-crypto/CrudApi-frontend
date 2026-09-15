import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image, Dimensions, ImageBackground } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
const RoleSelectionScreen = ({ route, navigation }: any) => {
  const params = route?.params || {};
  return (
    <ImageBackground
      source={require('../../assets/Rolle.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <SafeAreaView style={styles.container}>
        {}
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
            onPress={() => navigation.navigate('CustomerRegister', params)}
          >
            <Ionicons name="people-outline" size={24} color="#B71C1C" />
            <Text style={styles.customerButtonText}>I am a Customer</Text>
            <Ionicons name="chevron-forward-outline" size={24} color="#B71C1C" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.farmerButton]}
            onPress={() => navigation.navigate('FarmerRegister', params)}
          >
            <Ionicons name="person-outline" size={24} color="#1B5E20" />
            <Text style={styles.farmerButtonText}>I am a Farmer</Text>
            <Ionicons name="chevron-forward-outline" size={24} color="#1B5E20" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.backButton]}
            onPress={() => navigation.navigate('NewUserLogin')}
          >
            <Text style={styles.backButtonText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};
const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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
    width: '90%',
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  customerButton: {
    backgroundColor: '#FFCDD2',
    borderWidth: 1,
    borderColor: '#EF9A9A',
  },
  customerButtonText: {
    color: '#B71C1C',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  farmerButton: {
    backgroundColor: '#C8E6C9',
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  farmerButtonText: {
    color: '#1B5E20',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    marginTop: 10,
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#1B5E20',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
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

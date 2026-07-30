import React, { useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, Image, Dimensions, Text } from 'react-native';

const WelcomeScreen = ({ navigation }: any) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('NewUserLogin');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image 
          source={require('../farm2home_logo.png')} 
          style={styles.logoImage} 
          resizeMode="contain" 
        />
        <Text style={styles.tagline}>Nature's Freshness, At Your Doorstep.</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5E9', // Light green background matching the theme
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoImage: {
    width: Dimensions.get('window').width * 0.65,
    height: Dimensions.get('window').width * 0.65,
    borderRadius: (Dimensions.get('window').width * 0.65) / 2,
    borderWidth: 3,
    borderColor: '#C8E6C9',
  },
  tagline: {
    marginTop: 24,
    fontSize: 20,
    fontWeight: '600',
    color: '#1B5E20',
    fontStyle: 'italic',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});

export default WelcomeScreen;


import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  ImageBackground,
} from 'react-native';
const { width, height } = Dimensions.get('window');
const WelcomeScreen = ({ navigation }: any) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('NewUserLogin');
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigation]);
  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      {}
      <ImageBackground
        source={require('../../assets/welcomelogo.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {}
        <View style={styles.loaderWrapper}>
          <ActivityIndicator size="large" color="#2D983A" />
        </View>
      </ImageBackground>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  loaderWrapper: {
    paddingBottom: 50,
  },
});
export default WelcomeScreen;

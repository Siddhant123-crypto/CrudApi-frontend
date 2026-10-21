import React from 'react';
import { StatusBar, Text, TextInput } from 'react-native';
import { NavigationContainer, LinkingOptions, DefaultTheme } from '@react-navigation/native';
import { useFonts, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { CartProvider } from './src/context/CartContext';
import { WishlistProvider } from './src/context/WishlistContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { THEME } from './src/constants/theme';

// Set global cap on font scaling to prevent text clipping
if ((Text as any).defaultProps == null) {
  (Text as any).defaultProps = {};
}
(Text as any).defaultProps.maxFontSizeMultiplier = 1.15;

if ((TextInput as any).defaultProps == null) {
  (TextInput as any).defaultProps = {};
}
(TextInput as any).defaultProps.maxFontSizeMultiplier = 1.15;

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: THEME.colors.pageBgTop,
    card: 'transparent',
    text: THEME.colors.textHeading,
    primary: THEME.colors.accent,
    border: THEME.colors.cardBorder,
  },
};

const linking: LinkingOptions<any> = {
  prefixes: [
    'farm2home://',
    'http://172.16.21.145:8080',
    'https://farm2home.app',
  ],
  config: {
    screens: {
      ResetPassword: 'reset-password',
      ForgotPassword: 'forgot-password',
      NewUserLogin: 'login',
    },
  },
};

const App = () => {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <KeyboardProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <NotificationProvider>
              <NavigationContainer linking={linking} theme={navigationTheme}>
                <StatusBar barStyle="light-content" backgroundColor="#A23A14" />
                <AppNavigator />
              </NavigationContainer>
            </NotificationProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </KeyboardProvider>
  );
};
export default App;

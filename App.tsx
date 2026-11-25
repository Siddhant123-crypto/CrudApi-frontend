import React from 'react';
import { StatusBar, Text, TextInput } from 'react-native';
import { NavigationContainer, LinkingOptions, DefaultTheme } from '@react-navigation/native';
import { useFonts, Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  NotoSansDevanagari_500Medium,
  NotoSansDevanagari_700Bold,
} from '@expo-google-fonts/noto-sans-devanagari';
import {
  NotoSansTamil_500Medium,
  NotoSansTamil_700Bold,
} from '@expo-google-fonts/noto-sans-tamil';
import {
  NotoSansBengali_500Medium,
  NotoSansBengali_700Bold,
} from '@expo-google-fonts/noto-sans-bengali';
import {
  NotoSansKannada_500Medium,
  NotoSansKannada_700Bold,
} from '@expo-google-fonts/noto-sans-kannada';
import {
  NotoSansOriya_500Medium,
  NotoSansOriya_700Bold,
} from '@expo-google-fonts/noto-sans-oriya';
import {
  NotoSansTelugu_500Medium,
  NotoSansTelugu_700Bold,
} from '@expo-google-fonts/noto-sans-telugu';
import './src/i18n';
import { initAppLanguage } from './src/i18n';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { CartProvider } from './src/context/CartContext';
import { WishlistProvider } from './src/context/WishlistContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { THEME } from './src/constants/theme';
import { warmUpBackend, resolveBaseUrl } from './src/services/api';
import { PremiumSplashView } from './src/components/PremiumSplashView';

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
    'https://farm2home.app',
    resolveBaseUrl(),
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
    Fraunces_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    NotoSansDevanagari_500Medium,
    NotoSansDevanagari_700Bold,
    NotoSansTamil_500Medium,
    NotoSansTamil_700Bold,
    NotoSansBengali_500Medium,
    NotoSansBengali_700Bold,
    NotoSansKannada_500Medium,
    NotoSansKannada_700Bold,
    NotoSansOriya_500Medium,
    NotoSansOriya_700Bold,
    NotoSansTelugu_500Medium,
    NotoSansTelugu_700Bold,
  });

  React.useEffect(() => {
    initAppLanguage();
    warmUpBackend();
  }, []);

  if (!fontsLoaded) {
    return <PremiumSplashView />;
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

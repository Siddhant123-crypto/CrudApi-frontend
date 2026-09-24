import React from 'react';
import {StatusBar} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {AuthProvider} from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import {CartProvider} from './src/context/CartContext';
import {WishlistProvider} from './src/context/WishlistContext';
import {NotificationProvider} from './src/context/NotificationContext';
const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <NotificationProvider>
            <NavigationContainer>
              <StatusBar barStyle="light-content" backgroundColor="#1B5E20" />
              <AppNavigator />
            </NavigationContainer>
          </NotificationProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
};
export default App;

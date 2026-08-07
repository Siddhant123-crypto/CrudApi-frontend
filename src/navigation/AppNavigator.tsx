import React from 'react';
import {ActivityIndicator, View, StyleSheet} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useAuth} from '../context/AuthContext';
import {Product} from '../types';

import Ionicons from '@expo/vector-icons/Ionicons';

// ── Screens ──
import WelcomeScreen from '../screens/WelcomeScreen';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';
import NewUserLoginScreen from '../screens/NewUserLoginScreen';

import CustomerRegisterScreen from '../screens/CustomerRegisterScreen';
import FarmerRegisterScreen from '../screens/FarmerRegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FarmerDashboardScreen from '../screens/FarmerDashboardScreen';
import AddProductScreen from '../screens/AddProductScreen';
import OrdersScreen from '../screens/OrdersScreen';

// ── Define Navigation Param Lists ──
export type AuthStackParamList = {
  Welcome: undefined;
  RoleSelection: undefined;
  NewUserLogin: undefined;

  CustomerRegister: undefined;
  FarmerRegister: undefined;
  ForgotPassword: undefined;
};

export type MainStackParamList = {
  CustomerMain: undefined;
  FarmerMain: undefined;
  ProductDetail: {product: Product};
  AddProduct: undefined;
};

export type CustomerTabParamList = {
  Home: undefined;
  Orders: undefined;
  Profile: undefined;
};

export type FarmerTabParamList = {
  Dashboard: undefined;
  Orders: undefined;
  Profile: undefined;
};


const Stack = createNativeStackNavigator<AuthStackParamList & MainStackParamList>();
const CustomerTab = createBottomTabNavigator<CustomerTabParamList>();
const FarmerTab = createBottomTabNavigator<FarmerTabParamList>();

// ── Colors ──
const COLORS = {
  primary: '#1B5E20',
  primaryLight: '#4CAF50',
  white: '#FFFFFF',
  grey: '#757575',
};

// ── Bottom Tabs for Customer ──
const CustomerTabs = () => {
  return (
    <CustomerTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.grey,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: any;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-circle-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}>
      <CustomerTab.Screen
        name="Home"
        component={HomeScreen as any}
        options={{tabBarLabel: 'Home'}}
      />
      <CustomerTab.Screen
        name="Orders"
        component={OrdersScreen as any}
        options={{tabBarLabel: 'Orders'}}
      />
      <CustomerTab.Screen
        name="Profile"
        component={ProfileScreen as any}
        options={{tabBarLabel: 'Profile'}}
      />
    </CustomerTab.Navigator>
  );
};

// ── Bottom Tabs for Farmer ──
const FarmerTabs = () => {
  return (
    <FarmerTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.grey,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: any;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-circle-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}>
      <FarmerTab.Screen
        name="Dashboard"
        component={FarmerDashboardScreen as any}
        options={{tabBarLabel: 'Dashboard'}}
      />
      <FarmerTab.Screen
        name="Orders"
        component={OrdersScreen as any}
        options={{tabBarLabel: 'Orders'}}
      />
      <FarmerTab.Screen
        name="Profile"
        component={ProfileScreen as any}
        options={{tabBarLabel: 'Profile'}}
      />
    </FarmerTab.Navigator>
  );
};

// ── Auth Stack (not logged in) ──
const AuthStack = ({initialRoute}: {initialRoute: 'Welcome' | 'RoleSelection'}) => (
  <Stack.Navigator screenOptions={{headerShown: false}} initialRouteName={initialRoute}>
    <Stack.Screen name="Welcome" component={WelcomeScreen as any} />
    <Stack.Screen name="RoleSelection" component={RoleSelectionScreen as any} />
    <Stack.Screen name="NewUserLogin" component={NewUserLoginScreen as any} />
    <Stack.Screen name="CustomerRegister" component={CustomerRegisterScreen as any} />
    <Stack.Screen name="FarmerRegister" component={FarmerRegisterScreen as any} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen as any} />
  </Stack.Navigator>
);

// ── Main Stack (logged in) ──
const MainStack: React.FC<{role?: string}> = ({role}) => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    {role === 'FARMER' ? (
      <Stack.Screen name="FarmerMain" component={FarmerTabs} />
    ) : (
      <Stack.Screen name="CustomerMain" component={CustomerTabs} />
    )}
    <Stack.Screen
      name="ProductDetail"
      component={ProductDetailScreen as any}
      options={{
        headerShown: true,
        headerTitle: 'Product Details',
        headerStyle: {backgroundColor: COLORS.primary},
        headerTintColor: COLORS.white,
      }}
    />
    <Stack.Screen
      name="AddProduct"
      component={AddProductScreen as any}
      options={{
        headerShown: true,
        headerTitle: 'Add Product',
        headerStyle: {backgroundColor: COLORS.primary},
        headerTintColor: COLORS.white,
      }}
    />
  </Stack.Navigator>
);

// ── Root Navigator ──
const AppNavigator: React.FC = () => {
  const {user, isLoading, isLoggedIn, initialAuthRoute} = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!isLoggedIn) {
    return <AuthStack initialRoute={initialAuthRoute} />;
  }

  return <MainStack role={user?.role} />;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

export default AppNavigator;

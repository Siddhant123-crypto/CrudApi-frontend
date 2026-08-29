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
import FarmerProductDetailScreen from '../screens/FarmerProductDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FarmerDashboardScreen from '../screens/FarmerDashboardScreen';
import AddProductScreen from '../screens/AddProductScreen';
import MyProductsScreen from '../screens/MyProductsScreen';
import EarningsScreen from '../screens/EarningsScreen';
import CategoryDashboardScreen from '../screens/CategoryDashboardScreen';
import CartScreen from '../screens/CartScreen';
import WishlistScreen from '../screens/WishlistScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import FarmerCategoryDashboardScreen from '../screens/FarmerCategoryDashboardScreen';

// ── New Order Screens ──
import CheckoutScreen from '../screens/CheckoutScreen';
import OrderSuccessScreen from '../screens/OrderSuccessScreen';
import CustomerOrdersScreen from '../screens/CustomerOrdersScreen';
import CustomerOrderDetailsScreen from '../screens/CustomerOrderDetailsScreen';
import FarmerOrdersScreen from '../screens/FarmerOrdersScreen';
import FarmerOrderDetailsScreen from '../screens/FarmerOrderDetailsScreen';
import { FarmerProductReviewsScreen } from '../screens/FarmerProductReviewsScreen';

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
  FarmerProductDetail: {product: any};
  AddProduct: { product?: any, category?: string } | undefined;
  CategoryDashboard: { category: string };
  FarmerCategoryDashboard: { category: string };
  Checkout: { orderItems: any[]; totalAmount: number };
  OrderSuccess: { orderNumber: string; totalAmount: number };
  CustomerOrderDetails: { orderId: string };
  FarmerOrderDetails: { orderId: string };
  FarmerProductReviews: { product?: any } | undefined;
  Cart: undefined;
  Wishlist: undefined;
};

export type CustomerTabParamList = {
  Home: undefined;
  Categories: undefined;
  Wishlist: undefined;
  Orders: undefined;
  Profile: undefined;
};

export type FarmerTabParamList = {
  Home: undefined;
  MyFarm: undefined;
  Market: undefined;
  Orders: undefined;
  Profile: undefined;
};


const Stack = createNativeStackNavigator<AuthStackParamList & MainStackParamList>();
const CustomerTab = createBottomTabNavigator<CustomerTabParamList>();
const FarmerTab = createBottomTabNavigator<FarmerTabParamList>();

// ── Colors ──
const COLORS = {
  primary: '#2D983A',
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
        tabBarActiveTintColor: '#1E3A8A',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          height: 68,
          paddingBottom: 10,
          paddingTop: 8,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          elevation: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: any;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Categories') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Wishlist') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-circle-outline';
          }

          return <Ionicons name={iconName} size={focused ? 24 : 22} color={color} />;
        },
      })}>
      <CustomerTab.Screen
        name="Home"
        component={HomeScreen as any}
        options={{tabBarLabel: 'Home'}}
      />
      <CustomerTab.Screen
        name="Categories"
        component={CategoriesScreen as any}
        options={{tabBarLabel: 'Categories'}}
      />
      <CustomerTab.Screen
        name="Wishlist"
        component={WishlistScreen as any}
        options={{tabBarLabel: 'WishList'}}
      />
      <CustomerTab.Screen
        name="Orders"
        component={CustomerOrdersScreen as any}
        options={{tabBarLabel: 'Orders'}}
      />
      <CustomerTab.Screen
        name="Profile"
        component={ProfileScreen as any}
        options={{tabBarLabel: 'Account'}}
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

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'MyFarm') {
            iconName = focused ? 'leaf' : 'leaf-outline';
          } else if (route.name === 'Market') {
            iconName = focused ? 'storefront' : 'storefront-outline';
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
        name="Home"
        component={FarmerDashboardScreen as any}
        options={{tabBarLabel: 'Home'}}
      />
      <FarmerTab.Screen
        name="MyFarm"
        component={MyProductsScreen as any}
        options={{tabBarLabel: 'My Farm'}}
      />
      <FarmerTab.Screen
        name="Market"
        component={EarningsScreen as any}
        options={{tabBarLabel: 'Market'}}
      />
      <FarmerTab.Screen
        name="Orders"
        component={FarmerOrdersScreen as any}
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
const AuthStack = ({initialRoute}: {initialRoute: 'Welcome' | 'RoleSelection' | 'NewUserLogin'}) => (
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
        headerStyle: {backgroundColor: '#1E3A8A'},
        headerTintColor: COLORS.white,
      }}
    />
    <Stack.Screen
      name="FarmerProductDetail"
      component={FarmerProductDetailScreen as any}
      options={{
        headerShown: false
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
    <Stack.Screen
      name="CategoryDashboard"
      component={CategoryDashboardScreen as any}
      options={{headerShown: true, headerBackTitleVisible: false}}
    />
    <Stack.Screen
      name="FarmerCategoryDashboard"
      component={FarmerCategoryDashboardScreen as any}
      options={{headerShown: true, headerBackTitleVisible: false}}
    />
    <Stack.Screen
      name="Cart"
      component={CartScreen as any}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="Wishlist"
      component={WishlistScreen as any}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="Checkout"
      component={CheckoutScreen as any}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="OrderSuccess"
      component={OrderSuccessScreen as any}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="CustomerOrderDetails"
      component={CustomerOrderDetailsScreen as any}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="FarmerOrderDetails"
      component={FarmerOrderDetailsScreen as any}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="FarmerProductReviews"
      component={FarmerProductReviewsScreen as any}
      options={{headerShown: false}}
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

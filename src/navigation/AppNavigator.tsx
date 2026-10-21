import React from 'react';
import {ActivityIndicator, View, StyleSheet, Platform} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useAuth} from '../context/AuthContext';
import {useNotification} from '../context/NotificationContext';
import {Product} from '../types';
import Ionicons from '@expo/vector-icons/Ionicons';
import WelcomeScreen from '../screens/WelcomeScreen';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';
import NewUserLoginScreen from '../screens/NewUserLoginScreen';
import CustomerRegisterScreen from '../screens/CustomerRegisterScreen';
import FarmerRegisterScreen from '../screens/FarmerRegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import FarmerProductDetailScreen from '../screens/FarmerProductDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FarmerDashboardScreen from '../screens/FarmerDashboardScreen';
import AddProductScreen from '../screens/AddProductScreen';
import MyProductsScreen from '../screens/MyProductsScreen';
import FarmerMarketScreen from '../screens/FarmerMarketScreen';
import MarketDetailsScreen from '../screens/MarketDetailsScreen';
import CategoryDashboardScreen from '../screens/CategoryDashboardScreen';
import CartScreen from '../screens/CartScreen';
import WishlistScreen from '../screens/WishlistScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import FarmerCategoryDashboardScreen from '../screens/FarmerCategoryDashboardScreen';
import FarmerCategoriesScreen from '../screens/FarmerCategoriesScreen';
import MyFarmScreen from '../screens/MyFarmScreen';
import EditFarmDetailsScreen from '../screens/EditFarmDetailsScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrderSuccessScreen from '../screens/OrderSuccessScreen';
import PaymentSuccessScreen from '../screens/PaymentSuccessScreen';
import CustomerOrdersScreen from '../screens/CustomerOrdersScreen';
import CustomerOrderDetailsScreen from '../screens/CustomerOrderDetailsScreen';
import FarmerOrdersScreen from '../screens/FarmerOrdersScreen';
import FarmerOrderDetailsScreen from '../screens/FarmerOrderDetailsScreen';
import { FarmerProductReviewsScreen } from '../screens/FarmerProductReviewsScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminFarmersScreen from '../screens/admin/AdminFarmersScreen';
import AdminCustomersScreen from '../screens/admin/AdminCustomersScreen';
import AdminCustomerDetailsScreen from '../screens/admin/AdminCustomerDetailsScreen';
import AdminProductsScreen from '../screens/admin/AdminProductsScreen';
import { AdminProductDetailsScreen } from '../screens/admin/AdminProductDetailsScreen';
import { AdminCategoryProductsScreen } from '../screens/admin/AdminCategoryProductsScreen';
import AdminOrdersScreen from '../screens/admin/AdminOrdersScreen';
import AdminOrderDetailsScreen from '../screens/admin/AdminOrderDetailsScreen';
import AdminFarmVerificationScreen from '../screens/admin/AdminFarmVerificationScreen';
import AdminCategoriesScreen from '../screens/admin/AdminCategoriesScreen';
import { AdminFarmVerificationDetailsScreen } from '../screens/admin/AdminFarmVerificationDetailsScreen';
import ComingSoonScreen from '../screens/admin/ComingSoonScreen';
import AdminFarmerDetailsScreen from '../screens/admin/AdminFarmerDetailsScreen';
import AdminMarketsScreen from '../screens/admin/AdminMarketsScreen';
import AdminAddEditMarketScreen from '../screens/admin/AdminAddEditMarketScreen';
import AdminMenuScreen from '../screens/admin/AdminMenuScreen';
import { AdminTabBar } from '../components/admin/AdminTabBar';
import CustomerMenuScreen from '../screens/CustomerMenuScreen';
import FarmerMenuScreen from '../screens/FarmerMenuScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import NotificationDetailScreen from '../screens/NotificationDetailScreen';
import NotificationThreadScreen from '../screens/NotificationThreadScreen';
import { FarmCertificateScreen } from '../screens/FarmCertificateScreen';
import CustomerFarmDetailScreen from '../screens/CustomerFarmDetailScreen';
import CustomerFarmerFarmsScreen from '../screens/CustomerFarmerFarmsScreen';
import CustomerMessageFarmerScreen from '../screens/CustomerMessageFarmerScreen';
import FarmerContactAdminScreen from '../screens/FarmerContactAdminScreen';
import FarmerMessageCustomerScreen from '../screens/FarmerMessageCustomerScreen';
import FarmerSupportChatScreen from '../screens/FarmerSupportChatScreen';
import AdminMessageScreen from '../screens/admin/AdminMessageScreen';
import AdminMessageHistoryScreen from '../screens/admin/AdminMessageHistoryScreen';
import AdminMessageHistoryDetailScreen from '../screens/admin/AdminMessageHistoryDetailScreen';
import AdminSendNotificationScreen from '../screens/admin/AdminSendNotificationScreen';
import AdminSupportChatScreen from '../screens/admin/AdminSupportChatScreen';
import AdminGroupChatScreen from '../screens/admin/AdminGroupChatScreen';
import AdminSupportInboxScreen from '../screens/admin/AdminSupportInboxScreen';
import FarmerShortsScreen from '../screens/FarmerShortsScreen';
import FarmerWeatherDetailsScreen from '../screens/FarmerWeatherDetailsScreen';

export type AuthStackParamList = {
  Welcome: undefined;
  RoleSelection: undefined;
  NewUserLogin: undefined;
  CustomerRegister: undefined;
  FarmerRegister: undefined;
  ForgotPassword: undefined;
  ResetPassword?: { email?: string; token?: string } | undefined;
};
export type MainStackParamList = {
  AdminMain: undefined;
  CustomerMain: undefined;
  FarmerMain: undefined;
  ProductDetail: {product: Product};
  FarmerProductDetail: {product: any};
  AddProduct: { product?: any, category?: string } | undefined;
  CategoryDashboard: { category: string };
  FarmerCategories: undefined;
  FarmerCategoryDashboard: { category: string };
  Checkout: { orderItems: any[]; totalAmount: number };
  OrderSuccess: { orderNumber: string; totalAmount: number };
  PaymentSuccess: {
    orderId: string;
    orderNumber?: string;
    totalAmount?: number;
    paymentId?: string;
    paidAt?: string;
    isTestMode?: boolean;
  };
  CustomerOrderDetails: { orderId: string };
  CustomerOrderTracking: { orderId: string };
  FarmerOrderDetails: { orderId: string };
  FarmerProductReviews: { product?: any } | undefined;
  Cart: undefined;
  Wishlist: undefined;
  MyProducts: undefined;
  EditFarmDetails: { farmDetails?: any };
  AdminFarmers: undefined;
  AdminCustomers: undefined;
  AdminProducts: undefined;
  AdminOrders: undefined;
  AdminFarmVerification: undefined;
  AdminCategories: undefined;
  AdminMarkets: undefined;
  AdminAddEditMarket: { market?: any } | undefined;
  MarketDetails: { market: any };
  AdminFarmerDetails: { farmerId: string };
  AdminCustomerDetails: { customerId: string };
  AdminProductDetails: { productId: string };
  AdminCategoryProducts: { category: string };
  Analytics: { title?: string; icon?: string } | undefined;
  AdminMenu: undefined;
  CustomerMenu: undefined;
  FarmerMenu: undefined;
  Notifications: undefined;
  NotificationDetail: { notification: any };
  NotificationThread: { group: any };
  AdminOrderDetails: { orderId?: string; title?: string; icon?: string };
  AdminFarmVerificationDetails: { verificationId?: string; title?: string; icon?: string };
  CustomerFarmDetail: { farmId: string };
  CustomerFarmerFarms: { farmerId: string };
  CustomerMessageFarmer: { preSelectedFarmerId?: string; preSelectedFarmerName?: string };
  FarmerContactAdmin: undefined;
  FarmerMessageCustomer: { preSelectedCustomerId?: string; preSelectedCustomerName?: string };
  AdminMessage: { preSelectedUserId?: string; preSelectedUserEmail?: string; preSelectedUserName?: string; preSelectedRole?: string };
  AdminMessageHistory: undefined;
  AdminMessageHistoryDetail: { notification: any };
  AdminSendNotification: undefined;
  FarmerSupportChatScreen: undefined;
  AdminSupportChatScreen: { farmerId: string; farmerName?: string };
  AdminGroupChat: undefined;
  AdminSupportInbox: undefined;
  FarmerShorts: undefined;
  FarmCertificate: undefined;
  FarmerWeatherDetails: { weatherData?: any, initialLatitude?: number, initialLongitude?: number };
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
export type AdminTabParamList = {
  Home: undefined;
  Users: undefined;
  Products: undefined;
  Markets: undefined;
  More?: { title?: string; icon?: string } | undefined;
};
const Stack = createNativeStackNavigator<AuthStackParamList & MainStackParamList>();
const CustomerTab = createBottomTabNavigator<CustomerTabParamList>();
const FarmerTab = createBottomTabNavigator<FarmerTabParamList>();
const AdminTab = createBottomTabNavigator<AdminTabParamList>();
const COLORS = {
  primary: '#2D983A',
  primaryLight: '#4CAF50',
  white: '#FFFFFF',
  grey: '#757575',
};
import CustomerTabBar from '../components/CustomerTabBar';
import FarmerTabBar from '../components/farmer/FarmerTabBar';

const CustomerTabs = () => {
  return (
    <CustomerTab.Navigator
      tabBar={props => <CustomerTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
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
        options={{tabBarLabel: 'Wishlist'}}
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
const FarmerTabs = () => {
  return (
    <FarmerTab.Navigator
      tabBar={props => <FarmerTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <FarmerTab.Screen
        name="Home"
        component={FarmerDashboardScreen as any}
        options={{tabBarLabel: 'Home'}}
      />
      <FarmerTab.Screen
        name="MyFarm"
        component={MyFarmScreen as any}
        options={{tabBarLabel: 'My Farm'}}
      />
      <FarmerTab.Screen
        name="Market"
        component={FarmerMarketScreen as any}
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
const AdminTabs = () => {
  return (
    <AdminTab.Navigator
      tabBar={(props) => <AdminTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <AdminTab.Screen
        name="Home"
        component={AdminDashboardScreen as any}
        options={{tabBarLabel: 'Home'}}
      />
      <AdminTab.Screen
        name="Users"
        component={AdminFarmersScreen as any}
        options={{tabBarLabel: 'Users'}}
      />
      <AdminTab.Screen
        name="Products"
        component={AdminProductsScreen as any}
        options={{tabBarLabel: 'Products'}}
      />
      <AdminTab.Screen
        name="Markets"
        component={AdminMarketsScreen as any}
        options={{tabBarLabel: 'Markets'}}
      />
    </AdminTab.Navigator>
  );
};
const AuthStack = ({initialRoute}: {initialRoute: 'Welcome' | 'RoleSelection' | 'NewUserLogin'}) => (
  <Stack.Navigator screenOptions={{headerShown: false}} initialRouteName={initialRoute}>
    <Stack.Screen name="Welcome" component={WelcomeScreen as any} />
    <Stack.Screen name="RoleSelection" component={RoleSelectionScreen as any} />
    <Stack.Screen name="NewUserLogin" component={NewUserLoginScreen as any} />
    <Stack.Screen name="CustomerRegister" component={CustomerRegisterScreen as any} />
    <Stack.Screen name="FarmerRegister" component={FarmerRegisterScreen as any} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen as any} />
    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen as any} />
  </Stack.Navigator>
);
const MainStack: React.FC<{role?: string}> = ({role}) => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    {role === 'ADMIN' ? (
      <Stack.Screen name="AdminMain" component={AdminTabs} />
    ) : role === 'FARMER' ? (
      <Stack.Screen name="FarmerMain" component={FarmerTabs} />
    ) : (
      <Stack.Screen name="CustomerMain" component={CustomerTabs} />
    )}
    <Stack.Screen
      name="ProductDetail"
      component={ProductDetailScreen as any}
      options={{
        headerShown: false,
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
        headerShown: false,
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
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="FarmerCategories"
      component={FarmerCategoriesScreen as any}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="FarmerWeatherDetails"
      component={FarmerWeatherDetailsScreen as any}
      options={{headerShown: false}}
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
      name="PaymentSuccess"
      component={PaymentSuccessScreen as any}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="CustomerOrderDetails"
      component={CustomerOrderDetailsScreen as any}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="CustomerOrderTracking"
      component={require('../screens/CustomerOrderTrackingScreen').default}
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
    <Stack.Screen
      name="MyProducts"
      component={MyProductsScreen as any}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="EditFarmDetails"
      component={EditFarmDetailsScreen as any}
      options={{headerShown: false}}
    />
    {}
    <Stack.Screen name="AdminFarmers" component={AdminFarmersScreen as any} options={{headerShown: false}} />
    <Stack.Screen name="AdminCustomers" component={AdminCustomersScreen as any} options={{headerShown: false}} />
    <Stack.Screen name="AdminProducts" component={AdminProductsScreen as any} options={{headerShown: false}} />
    <Stack.Screen name="AdminOrders" component={AdminOrdersScreen as any} options={{headerShown: false}} />
    <Stack.Screen name="AdminFarmVerification" component={AdminFarmVerificationScreen as any} options={{headerShown: false}} />
    <Stack.Screen name="AdminCategories" component={AdminCategoriesScreen as any} options={{headerShown: false}} />
    <Stack.Screen name="AdminMarkets" component={AdminMarketsScreen as any} options={{headerShown: false}} />
    <Stack.Screen name="AdminAddEditMarket" component={AdminAddEditMarketScreen as any} options={{headerShown: false}} />
    <Stack.Screen name="MarketDetails" component={MarketDetailsScreen as any} options={{headerShown: false}} />
    <Stack.Screen name="Analytics" component={ComingSoonScreen as any} options={{headerShown: false}} initialParams={{ title: 'Analytics & Reports', icon: 'bar-chart' }} />
    <Stack.Screen name="AdminFarmerDetails" component={AdminFarmerDetailsScreen as any} options={{headerShown: false}} />
    <Stack.Screen name="AdminCustomerDetails" component={AdminCustomerDetailsScreen as any} options={{headerShown: false}} />
    <Stack.Screen name="AdminProductDetails" component={AdminProductDetailsScreen} options={{headerShown: false}} />
    <Stack.Screen name="AdminCategoryProducts" component={AdminCategoryProductsScreen} options={{headerShown: false}} />
    <Stack.Screen name="AdminOrderDetails" component={AdminOrderDetailsScreen as any} options={{headerShown: false}} />
    <Stack.Screen name="AdminFarmVerificationDetails" component={AdminFarmVerificationDetailsScreen as any} options={{headerShown: false}} />
    <Stack.Screen name="AdminMenu" component={AdminMenuScreen as any} options={{headerShown: false, presentation: 'transparentModal', animation: 'fade'}} />
    <Stack.Screen name="CustomerMenu" component={CustomerMenuScreen as any} options={{headerShown: false, presentation: 'transparentModal', animation: 'fade'}} />
    <Stack.Screen name="FarmerMenu" component={FarmerMenuScreen as any} options={{headerShown: false, presentation: 'transparentModal', animation: 'fade'}} />
    <Stack.Screen name="Notifications" component={NotificationsScreen as any} options={{headerShown: false}} />
    <Stack.Screen name="NotificationDetail" component={NotificationDetailScreen as any} options={{headerShown: false}} />
    <Stack.Screen name="NotificationThread" component={NotificationThreadScreen as any} options={{headerShown: false}} />
    <Stack.Screen name="FarmCertificate" component={FarmCertificateScreen as any} options={{headerShown: false, presentation: 'modal'}} />
    <Stack.Screen name="CustomerFarmDetail" component={CustomerFarmDetailScreen as any} options={{headerShown: false}} />
    <Stack.Screen name="CustomerFarmerFarms" component={CustomerFarmerFarmsScreen as any} options={{headerShown: false}} />
    <Stack.Screen name="CustomerMessageFarmer" component={CustomerMessageFarmerScreen as any} options={{headerShown: false}} />
    <Stack.Screen name="FarmerContactAdmin" component={FarmerContactAdminScreen as any} options={{headerShown: false}} />
    <Stack.Screen name="FarmerMessageCustomer" component={FarmerMessageCustomerScreen as any} options={{headerShown: false}} />
    <Stack.Screen name="FarmerSupportChatScreen" component={FarmerSupportChatScreen as any} options={{headerShown: false}} />
    <Stack.Screen name="AdminSupportChatScreen" component={AdminSupportChatScreen as any} options={{headerShown: false}} />
    <Stack.Screen name="AdminGroupChat" component={AdminGroupChatScreen as any} options={{headerShown: false}} />
    <Stack.Screen name="AdminSupportInbox" component={AdminSupportInboxScreen} options={{headerShown: false}} />
    <Stack.Screen name="AdminMessage" component={AdminMessageScreen as any} options={{headerShown: false}} />
    <Stack.Screen name="AdminMessageHistory" component={AdminMessageHistoryScreen as any} options={{headerShown: false}} />
    <Stack.Screen name="AdminMessageHistoryDetail" component={AdminMessageHistoryDetailScreen as any} options={{headerShown: false}} />
    <Stack.Screen name="AdminSendNotification" component={AdminSendNotificationScreen as any} options={{headerShown: false}} />
    <Stack.Screen name="FarmerShorts" component={FarmerShortsScreen as any} options={{headerShown: false}} />
  </Stack.Navigator>
);
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

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';

import { useAuth } from '../store/AuthContext';
import { useCart } from '../store/CartContext';
import { COLORS, FONTS } from '../constants';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Home
import HomeScreen from '../screens/home/HomeScreen';

// Products
import ProductsListScreen from '../screens/products/ProductsListScreen';
import ProductDetailsScreen from '../screens/products/ProductDetailsScreen';

// Orders
import OrderSummaryScreen from '../screens/orders/OrderSummaryScreen';
import OrderHistoryScreen from '../screens/orders/OrderHistoryScreen';
import OrderDetailsScreen from '../screens/orders/OrderDetailsScreen';
import TrackShipmentScreen from '../screens/orders/TrackShipmentScreen';
import ReportIssueScreen from '../screens/orders/ReportIssueScreen';
import IssueSubmittedScreen from '../screens/orders/IssueSubmittedScreen';
import IssueStatusScreen from '../screens/orders/IssueStatusScreen';
import CancelOrderScreen from '../screens/orders/CancelOrderScreen';
import OrderCancelledScreen from '../screens/orders/OrderCancelledScreen';

// Returns
import ReturnInitiationScreen from '../screens/returns/ReturnInitiationScreen';
import ReturnSubmittedScreen from '../screens/returns/ReturnSubmittedScreen';
import ReturnDetailsScreen from '../screens/returns/ReturnDetailsScreen';
import ReturnCancelledScreen from '../screens/returns/ReturnCancelledScreen';

// Payments
import PaymentScreen from '../screens/payment/PaymentScreen';
import OrderConfirmationScreen from '../screens/payment/OrderConfirmationScreen';
import AddCardScreen from '../screens/payment/AddCardScreen';
import DealerPaymentsScreen from '../screens/payment/DealerPaymentsScreen';

// Profile
import ProfileScreen from '../screens/profile/ProfileScreen';
import ContactDetailsScreen from '../screens/profile/ContactDetailsScreen';
import BankInfoScreen from '../screens/profile/BankInfoScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';
import NotificationSettingsScreen from '../screens/profile/NotificationSettingsScreen';
import LanguageScreen from '../screens/profile/LanguageScreen';

// Notifications
import NotificationsScreen from '../screens/notifications/NotificationsScreen';

// Support
import ContactSupportScreen from '../screens/support/ContactSupportScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: { active: '🏠', inactive: '🏠' },
  Products: { active: '📦', inactive: '📦' },
  OrderHistory: { active: '📋', inactive: '📋' },
  Payment: { active: '💳', inactive: '💳' },
  Profile: { active: '👤', inactive: '👤' },
};

function TabIcon({ name, focused, cartCount }) {
  return (
    <View style={tabStyles.wrapper}>
      <Text style={[tabStyles.icon, focused && tabStyles.iconActive]}>
        {TAB_ICONS[name]?.active}
      </Text>
      {name === 'Products' && cartCount > 0 && (
        <View style={tabStyles.badge}>
          <Text style={tabStyles.badgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
        </View>
      )}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 20, opacity: 0.5 },
  iconActive: { opacity: 1 },
  badge: { position: 'absolute', top: -4, right: -10, backgroundColor: COLORS.danger, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },
});

function MainTabs() {
  const { cart } = useCart();
  const cartCount = cart?.itemCount || 0;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: '#FFF',
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 6,
          height: 62,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} cartCount={cartCount} />,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Products" component={ProductsListScreen} />
      <Tab.Screen name="OrderHistory" component={OrderHistoryScreen} options={{ tabBarLabel: 'Orders' }} />
      <Tab.Screen name="Payment" component={DealerPaymentsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />

      {/* Products */}
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />

      {/* Cart / Order flow */}
      <Stack.Screen name="OrderSummary" component={OrderSummaryScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />
      <Stack.Screen name="AddCard" component={AddCardScreen} />

      {/* Order management */}
      <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
      <Stack.Screen name="TrackShipment" component={TrackShipmentScreen} />
      <Stack.Screen name="ReportIssue" component={ReportIssueScreen} />
      <Stack.Screen name="IssueSubmitted" component={IssueSubmittedScreen} />
      <Stack.Screen name="IssueStatus" component={IssueStatusScreen} />
      <Stack.Screen name="CancelOrder" component={CancelOrderScreen} />
      <Stack.Screen name="OrderCancelled" component={OrderCancelledScreen} />

      {/* Returns */}
      <Stack.Screen name="ReturnInitiation" component={ReturnInitiationScreen} />
      <Stack.Screen name="ReturnSubmitted" component={ReturnSubmittedScreen} />
      <Stack.Screen name="ReturnDetails" component={ReturnDetailsScreen} />
      <Stack.Screen name="ReturnCancelled" component={ReturnCancelledScreen} />

      {/* Profile */}
      <Stack.Screen name="ContactDetails" component={ContactDetailsScreen} />
      <Stack.Screen name="BankInfo" component={BankInfoScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="Language" component={LanguageScreen} />

      {/* Notifications */}
      <Stack.Screen name="Notifications" component={NotificationsScreen} />

      {/* Support */}
      <Stack.Screen name="ContactSupport" component={ContactSupportScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { dealer, loading } = useAuth();

  if (loading) return null;

  return (
    <NavigationContainer>
      {dealer ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

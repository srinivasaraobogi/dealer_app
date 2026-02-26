import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';

import { useAuth } from '../store/AuthContext';
import { useCart } from '../store/CartContext';
import { COLORS } from '../constants';

import { ROUTES, AUTH_SCREENS, TAB_SCREENS, APP_SCREENS } from './routes';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

// Build a quick icon-lookup from the TAB_SCREENS config
const TAB_ICON_MAP = Object.fromEntries(TAB_SCREENS.map(s => [s.name, s.icon]));

function TabIcon({ name, focused, cartCount }) {
  return (
    <View style={tabStyles.wrapper}>
      <Text style={[tabStyles.icon, focused && tabStyles.iconActive]}>
        {TAB_ICON_MAP[name]}
      </Text>
      {name === ROUTES.PRODUCTS && cartCount > 0 && (
        <View style={tabStyles.badge}>
          <Text style={tabStyles.badgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
        </View>
      )}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  wrapper:   { alignItems: 'center', justifyContent: 'center' },
  icon:      { fontSize: 20, opacity: 0.5 },
  iconActive:{ opacity: 1 },
  badge:     { position: 'absolute', top: -4, right: -10, backgroundColor: COLORS.danger, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
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
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} cartCount={cartCount} />
        ),
      })}
    >
      {TAB_SCREENS.map(({ name, component, label }) => (
        <Tab.Screen
          key={name}
          name={name}
          component={component}
          options={{ tabBarLabel: label }}
        />
      ))}
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {AUTH_SCREENS.map(({ name, component }) => (
        <Stack.Screen key={name} name={name} component={component} />
      ))}
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ROUTES.MAIN_TABS} component={MainTabs} />
      {APP_SCREENS.map(({ name, component }) => (
        <Stack.Screen key={name} name={name} component={component} />
      ))}
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

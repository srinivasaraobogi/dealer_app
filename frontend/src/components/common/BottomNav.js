import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, FONTS, SPACING } from '../../constants';
import { useCart } from '../../store/CartContext';

const NAV_ITEMS = [
  { name: 'Home', icon: '🏠', screen: 'Home' },
  { name: 'Products', icon: '📦', screen: 'ProductsList' },
  { name: 'Orders', icon: '📋', screen: 'OrderHistory' },
  { name: 'Payment', icon: '💰', screen: 'DealerPayments' },
  { name: 'Profile', icon: '👤', screen: 'Profile' },
];

const BottomNav = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { itemCount } = useCart();

  return (
    <View style={styles.container}>
      {NAV_ITEMS.map((item) => {
        const isActive = route.name === item.screen ||
          (item.screen === 'Home' && route.name === 'HomeTab');
        return (
          <TouchableOpacity
            key={item.name}
            style={styles.navItem}
            onPress={() => navigation.navigate(item.screen)}
          >
            <View style={styles.iconWrapper}>
              <Text style={styles.icon}>{item.icon}</Text>
              {item.screen === 'ProductsList' && itemCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{itemCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, isActive && styles.activeLabel]}>
              {item.name}
            </Text>
            {isActive && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: SPACING.sm,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    position: 'relative',
  },
  iconWrapper: { position: 'relative' },
  icon: { fontSize: 22 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },
  label: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  activeLabel: { color: COLORS.primary, fontWeight: 'bold' },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
});

export default BottomNav;

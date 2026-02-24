import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SPACING } from '../../constants';
import { useAuth } from '../../store/AuthContext';
import { useCart } from '../../store/CartContext';
import { formatCurrency } from '../../utils/helpers';

export const HomeHeader = ({ notifications = 0 }) => {
  const navigation = useNavigation();
  const { dealer } = useAuth();

  return (
    <View style={styles.homeHeader}>
      <View style={styles.headerRow}>
        <View style={styles.dealerInfo}>
          <Text style={styles.dealerName}>{dealer?.name || 'Dealer'}</Text>
          <Text style={styles.dealerId}>ID: {dealer?.dealerId || 'N/A'}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Text style={styles.notificationIcon}>🔔</Text>
            {notifications > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notifications > 99 ? '99+' : notifications}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.creditRow}>
        <View style={styles.locationRow}>
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationText} numberOfLines={1}>
            {dealer?.defaultDeliveryAddress || dealer?.city || 'Set delivery location'}
          </Text>
        </View>
        <View style={styles.creditBadge}>
          <Text style={styles.creditLabel}>Credit</Text>
          <Text style={styles.creditAmount}>
            {formatCurrency(dealer?.availableCredit || (dealer?.creditLimit - dealer?.outstandingAmount) || 0)}
          </Text>
        </View>
      </View>
    </View>
  );
};

export const ScreenHeader = ({ title, subtitle, showBack = true, showCart = false, rightComponent }) => {
  const navigation = useNavigation();
  const { itemCount } = useCart();

  return (
    <View style={styles.screenHeader}>
      <View style={styles.screenHeaderLeft}>
        {showBack && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        )}
        <View>
          <Text style={styles.screenTitle}>{title}</Text>
          {subtitle && <Text style={styles.screenSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.screenHeaderRight}>
        {showCart && (
          <TouchableOpacity onPress={() => navigation.navigate('OrderSummary')} style={styles.cartBtn}>
            <Text style={styles.cartIcon}>🛒</Text>
            {itemCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{itemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        {rightComponent}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  homeHeader: {
    backgroundColor: COLORS.primary,
    padding: SPACING.base,
    paddingTop: SPACING.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  dealerInfo: {},
  dealerName: { color: '#FFF', fontSize: FONTS.sizes.lg, fontWeight: 'bold' },
  dealerId: { color: 'rgba(255,255,255,0.8)', fontSize: FONTS.sizes.sm },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  notificationBtn: { position: 'relative', padding: SPACING.xs },
  notificationIcon: { fontSize: 22 },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  creditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  locationIcon: { fontSize: 14, marginRight: 4 },
  locationText: { color: 'rgba(255,255,255,0.9)', fontSize: FONTS.sizes.sm, flex: 1 },
  creditBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    padding: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    alignItems: 'flex-end',
  },
  creditLabel: { color: 'rgba(255,255,255,0.7)', fontSize: FONTS.sizes.xs },
  creditAmount: { color: '#FFF', fontSize: FONTS.sizes.sm, fontWeight: 'bold' },

  // Screen header
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.base,
    paddingTop: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  screenHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  screenHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  backBtn: { marginRight: SPACING.sm, padding: SPACING.xs },
  backIcon: { fontSize: 22, color: COLORS.text },
  screenTitle: { fontSize: FONTS.sizes.lg, fontWeight: 'bold', color: COLORS.text },
  screenSubtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  cartBtn: { position: 'relative', padding: SPACING.xs },
  cartIcon: { fontSize: 22 },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '../../components/common';
import { COLORS, FONTS, SPACING } from '../../constants';

const OrderCancelledScreen = ({ navigation, route }) => {
  const { order } = route.params || {};
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>✅</Text>
        </View>
        <Text style={styles.title}>Order Cancelled</Text>
        <Text style={styles.subtitle}>
          Your order #{order?.orderId} has been successfully cancelled.
        </Text>
        {order?.paymentMethod === 'NET_30' && (
          <View style={styles.refundNote}>
            <Text style={styles.refundText}>💰 Credit has been reversed to your account.</Text>
          </View>
        )}
        <Button
          title="Continue Shopping"
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })}
          style={styles.btn}
        />
        <Button
          title="View Orders"
          variant="outline"
          onPress={() => navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs', state: { routes: [{ name: 'OrderHistory' }], index: 0 } }],
          })}
          style={styles.btn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center' },
  content: { padding: SPACING.xl, alignItems: 'center' },
  iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.base, borderWidth: 3, borderColor: COLORS.success },
  icon: { fontSize: 40 },
  title: { fontSize: FONTS.sizes.xxl, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.sm },
  subtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.xl, lineHeight: 22 },
  refundNote: { backgroundColor: '#D1FAE5', borderRadius: 12, padding: SPACING.md, marginBottom: SPACING.xl, borderWidth: 1, borderColor: '#A7F3D0', width: '100%' },
  refundText: { color: '#065F46', fontSize: FONTS.sizes.sm, textAlign: 'center' },
  btn: { width: '100%', marginBottom: SPACING.sm },
});

export default OrderCancelledScreen;

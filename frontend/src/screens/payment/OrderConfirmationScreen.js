import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button, Card } from '../../components/common';
import { COLORS, FONTS, SPACING } from '../../constants';
import { formatCurrency, formatDate } from '../../utils/helpers';

const OrderConfirmationScreen = ({ navigation, route }) => {
  const { order } = route.params || {};

  useEffect(() => {
    // Prevent going back to payment
    navigation.setOptions({ gestureEnabled: false });
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Success Animation */}
        <View style={styles.successCircle}>
          <Text style={styles.successIcon}>✅</Text>
        </View>

        <Text style={styles.title}>Order Placed Successfully!</Text>
        <Text style={styles.subtitle}>Processing with supplier now</Text>

        {/* Order Summary Card */}
        {order && (
          <Card style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Order ID</Text>
              <Text style={styles.value}>{order.orderId}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Date</Text>
              <Text style={styles.value}>{formatDate(order.createdAt)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Items</Text>
              <Text style={styles.value}>{order.items?.length || 0} items</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Payment</Text>
              <Text style={styles.value}>{order.paymentMethod?.replace('_', ' ')}</Text>
            </View>
            <View style={[styles.row, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(order.total)}</Text>
            </View>
          </Card>
        )}

        {/* Payment Info */}
        {order?.paymentMethod === 'NET_30' && (
          <View style={styles.net30Info}>
            <Text style={styles.net30Icon}>🏦</Text>
            <Text style={styles.net30Text}>
              Invoice due in 30 days. Amount: {formatCurrency(order.total)}
            </Text>
          </View>
        )}

        {/* Success Banner */}
        <View style={styles.processingBanner}>
          <Text style={styles.processingIcon}>🚀</Text>
          <Text style={styles.processingText}>Your order has been sent to supplier and is being processed.</Text>
        </View>

        {/* Action Buttons */}
        <Button
          title="Track Order"
          onPress={() => navigation.navigate('OrderDetails', { orderId: order?.orderId })}
          style={styles.btn}
        />
        <Button
          title="Continue Shopping"
          variant="outline"
          onPress={() => navigation.navigate('Home')}
          style={styles.btn}
        />
        <Button
          title="View All Orders"
          variant="ghost"
          onPress={() => navigation.navigate('OrderHistory')}
          style={styles.btn}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.base, alignItems: 'center' },
  successCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center',
    marginTop: SPACING.xxl, marginBottom: SPACING.base,
    borderWidth: 3, borderColor: COLORS.success,
  },
  successIcon: { fontSize: 50 },
  title: { fontSize: FONTS.sizes.xxl, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', marginBottom: SPACING.sm },
  subtitle: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.xl },
  card: { width: '100%', marginBottom: SPACING.base },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  label: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  value: { fontSize: FONTS.sizes.sm, fontWeight: '500', color: COLORS.text },
  totalRow: { paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: SPACING.sm, marginBottom: 0 },
  totalLabel: { fontSize: FONTS.sizes.base, fontWeight: 'bold', color: COLORS.text },
  totalValue: { fontSize: FONTS.sizes.lg, fontWeight: 'bold', color: COLORS.primary },
  net30Info: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: '#EFF6FF', borderRadius: 12, padding: SPACING.md,
    width: '100%', marginBottom: SPACING.base,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  net30Icon: { fontSize: 24 },
  net30Text: { flex: 1, fontSize: FONTS.sizes.sm, color: '#1E40AF' },
  processingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: '#D1FAE5', borderRadius: 12, padding: SPACING.md,
    width: '100%', marginBottom: SPACING.xl,
    borderWidth: 1, borderColor: '#A7F3D0',
  },
  processingIcon: { fontSize: 24 },
  processingText: { flex: 1, fontSize: FONTS.sizes.sm, color: '#065F46' },
  btn: { width: '100%', marginBottom: SPACING.sm },
});

export default OrderConfirmationScreen;

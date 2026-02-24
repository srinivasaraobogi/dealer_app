import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { ScreenHeader } from '../../components/common/Header';
import { Button, Card, Divider, LoadingScreen, StatusBadge, InfoRow } from '../../components/common';
import { COLORS, FONTS, SPACING, ORDER_STATUS } from '../../constants';
import { ordersAPI } from '../../services/api';
import { formatCurrency, formatDateTime, formatDate } from '../../utils/helpers';

const TimelineStep = ({ label, timestamp, description, completed, current }) => (
  <View style={styles.timelineStep}>
    <View style={styles.timelineLeft}>
      <View style={[styles.timelineCircle, completed && styles.completedCircle, current && styles.currentCircle]}>
        {completed && <Text style={styles.checkmark}>✓</Text>}
        {current && <View style={styles.currentDot} />}
      </View>
      <View style={[styles.timelineLine, completed && styles.completedLine]} />
    </View>
    <View style={styles.timelineContent}>
      <Text style={[styles.timelineLabel, completed && styles.completedLabel, current && { color: COLORS.primary }]}>
        {label}
      </Text>
      {timestamp && <Text style={styles.timelineTime}>{formatDateTime(timestamp)}</Text>}
      {description && <Text style={styles.timelineDesc}>{description}</Text>}
    </View>
  </View>
);

const OrderDetailsScreen = ({ navigation, route }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => { loadOrder(); }, [orderId]);

  const loadOrder = async () => {
    try {
      const res = await ordersAPI.getById(orderId);
      setOrder(res.data.data);
    } catch {
      Alert.alert('Error', 'Failed to load order details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No, Keep Order' },
        { text: 'Yes, Cancel', style: 'destructive', onPress: () => navigation.navigate('CancelOrder', { order }) },
      ]
    );
  };

  if (loading) return <LoadingScreen />;
  if (!order) return null;

  const status = ORDER_STATUS[order.status] || { label: order.status, color: '#999' };
  const canCancel = ['PENDING', 'CONFIRMED'].includes(order.status);

  const timelineStatuses = [
    { key: 'CONFIRMED', label: 'Order Confirmed' },
    { key: 'SHIPPED', label: 'Shipped' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { key: 'DELIVERED', label: 'Delivered' },
  ];

  const currentStatusIndex = timelineStatuses.findIndex(s => s.key === order.status);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Order Details" subtitle={`Order #${order.orderId}`} showBack />
      <ScrollView style={styles.scroll}>
        {/* Order Summary */}
        <Card style={styles.section}>
          <View style={styles.orderHeader}>
            <View>
              <Text style={styles.orderId}>{order.orderId}</Text>
              <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
            </View>
            <StatusBadge status={order.status} label={status.label} color={status.color} />
          </View>
          <Text style={styles.total}>{formatCurrency(order.total)}</Text>

          {/* Timeline */}
          {order.status !== 'CANCELLED' && (
            <View style={styles.timeline}>
              {timelineStatuses.map((ts, idx) => {
                const event = order.timeline?.find(t => t.status === ts.key);
                const completed = idx < currentStatusIndex || (idx === currentStatusIndex && order.status === ts.key);
                const current = idx === currentStatusIndex;
                const isLast = idx === timelineStatuses.length - 1;
                return (
                  <View key={ts.key} style={isLast && { marginBottom: 0 }}>
                    <TimelineStep
                      label={ts.label}
                      timestamp={event?.timestamp}
                      description={event?.description}
                      completed={completed}
                      current={current}
                    />
                  </View>
                );
              })}
            </View>
          )}

          {order.trackingId && (
            <View style={styles.trackingRow}>
              <Text style={styles.trackingLabel}>Tracking: {order.carrier} {order.trackingId}</Text>
              <TouchableOpacity
                style={styles.trackBtn}
                onPress={() => navigation.navigate('TrackShipment', { orderId: order._id })}
              >
                <Text style={styles.trackBtnText}>Track Shipment →</Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>

        {/* Shipping Address */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Shipping Address</Text>
          <Text style={styles.addressText}>{order.deliveryAddress?.fullAddress}</Text>
          {order.deliveryAddress?.city && (
            <Text style={styles.addressText}>{order.deliveryAddress.city}, {order.deliveryAddress.postalCode}</Text>
          )}
        </Card>

        {/* Items */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {order.items.map((item, idx) => (
            <View key={idx}>
              {idx > 0 && <Divider />}
              <View style={styles.orderItem}>
                <Image source={{ uri: item.image || 'https://via.placeholder.com/60' }} style={styles.itemImage} />
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.itemSku}>{item.sku}</Text>
                  <Text style={styles.itemQty}>Qty: {item.quantity} × {formatCurrency(item.unitPrice)}</Text>
                  <Text style={styles.itemTotal}>{formatCurrency(item.lineTotal)}</Text>
                </View>
              </View>
            </View>
          ))}
        </Card>

        {/* Price Breakdown */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Price Breakdown</Text>
          <InfoRow label="Subtotal" value={formatCurrency(order.subtotal)} />
          <InfoRow label={`Tax (${(order.taxRate * 100).toFixed(0)}%)`} value={formatCurrency(order.taxAmount)} />
          {order.shippingCost > 0 && <InfoRow label="Shipping" value={formatCurrency(order.shippingCost)} />}
          <Divider />
          <InfoRow label="Total" value={formatCurrency(order.total)} valueStyle={styles.totalValue} />
          <InfoRow label="Payment" value={order.paymentMethod?.replace('_', ' ')} />
        </Card>

        {/* Cancel Button */}
        {canCancel && (
          <View style={styles.cancelSection}>
            <Button
              title="Cancel Order"
              variant="danger"
              onPress={handleCancelOrder}
              loading={cancelling}
            />
            <Text style={styles.cancelNote}>Cancellation available before shipment</Text>
          </View>
        )}

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  section: { margin: SPACING.base, marginBottom: 0 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm },
  orderId: { fontSize: FONTS.sizes.base, fontWeight: 'bold', color: COLORS.text },
  orderDate: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  total: { fontSize: FONTS.sizes.xxl, fontWeight: 'bold', color: COLORS.primary, marginBottom: SPACING.base },
  timeline: { marginTop: SPACING.md },
  timelineStep: { flexDirection: 'row', marginBottom: 0, minHeight: 60 },
  timelineLeft: { alignItems: 'center', marginRight: SPACING.md, width: 28 },
  timelineCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: COLORS.border, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  completedCircle: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  currentCircle: { borderColor: COLORS.primary, backgroundColor: COLORS.surface },
  checkmark: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  currentDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  timelineLine: { flex: 1, width: 2, backgroundColor: COLORS.border, marginTop: 4 },
  completedLine: { backgroundColor: COLORS.success },
  timelineContent: { flex: 1, paddingBottom: SPACING.md },
  timelineLabel: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textSecondary },
  completedLabel: { color: COLORS.text },
  timelineTime: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  timelineDesc: { fontSize: FONTS.sizes.xs, color: COLORS.textLight, marginTop: 2 },
  trackingRow: { backgroundColor: COLORS.background, borderRadius: 8, padding: SPACING.sm, marginTop: SPACING.sm },
  trackingLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginBottom: SPACING.xs },
  trackBtn: {},
  trackBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: FONTS.sizes.sm },
  sectionTitle: { fontSize: FONTS.sizes.base, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.md },
  addressText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, lineHeight: 20 },
  orderItem: { flexDirection: 'row', gap: SPACING.md, paddingVertical: SPACING.sm },
  itemImage: { width: 60, height: 60, borderRadius: 8, resizeMode: 'cover' },
  itemDetails: { flex: 1 },
  itemName: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  itemSku: { fontSize: FONTS.sizes.xs, color: COLORS.textLight, marginBottom: 2 },
  itemQty: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginBottom: 2 },
  itemTotal: { fontSize: FONTS.sizes.base, fontWeight: 'bold', color: COLORS.primary },
  totalValue: { fontWeight: 'bold', color: COLORS.primary, fontSize: FONTS.sizes.base },
  cancelSection: { margin: SPACING.base, marginTop: SPACING.base },
  cancelNote: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.sm },
});

export default OrderDetailsScreen;

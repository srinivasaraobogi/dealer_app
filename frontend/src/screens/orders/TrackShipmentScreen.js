import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { ScreenHeader } from '../../components/common/Header';
import { Button, Card, LoadingScreen } from '../../components/common';
import { COLORS, FONTS, SPACING } from '../../constants';
import { ordersAPI } from '../../services/api';
import { formatDateTime } from '../../utils/helpers';

const TrackShipmentScreen = ({ navigation, route }) => {
  const { orderId } = route.params;
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  useEffect(() => { loadTracking(); }, [orderId]);

  const loadTracking = async () => {
    try {
      const res = await ordersAPI.getTracking(orderId);
      setTracking(res.data.data);
      setLastRefresh(new Date());
    } catch (error) {
      // Try getting order details as fallback
      try {
        const orderRes = await ordersAPI.getById(orderId);
        const order = orderRes.data.data;
        setTracking({
          trackingId: order.trackingId,
          carrier: order.carrier,
          estimatedDeliveryStart: order.estimatedDeliveryStart,
          estimatedDeliveryEnd: order.estimatedDeliveryEnd,
          driverName: order.driverName,
          driverPhone: order.driverPhone,
          timeline: order.timeline,
          status: order.status,
        });
      } catch {}
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    if (lastRefresh && (Date.now() - lastRefresh.getTime()) < 30000) {
      Alert.alert('Please wait', 'You can refresh once every 30 seconds');
      return;
    }
    setRefreshing(true);
    loadTracking();
  };

  const handleCallDriver = async () => {
    if (!tracking?.driverPhone) return;
    Linking.openURL(`tel:${tracking.driverPhone}`);
  };

  const copyToClipboard = (text) => {
    // In production use @react-native-clipboard/clipboard
    Alert.alert('Copied', text);
  };

  if (loading) return <LoadingScreen message="Loading tracking info..." />;

  const TRACKING_EVENTS = [
    { status: 'Shipment Information Received', icon: '📋' },
    { status: 'Picked Up', icon: '📦' },
    { status: 'Departed Facility', icon: '🚛' },
    { status: 'Arrived at Facility', icon: '🏭' },
    { status: 'Out for Delivery', icon: '🚐' },
    { status: 'Delivered', icon: '✅' },
  ];

  return (
    <View style={styles.container}>
      <ScreenHeader title="Track Shipment" subtitle={`Order #${orderId}`} showBack />
      <ScrollView style={styles.scroll}>
        {/* Map Placeholder */}
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapIcon}>🗺️</Text>
          <Text style={styles.mapText}>Live tracking map</Text>
          <Text style={styles.mapSubtext}>GPS coordinates updating in real-time</Text>
        </View>

        {/* Tracking Summary */}
        {tracking && (
          <Card style={styles.section}>
            <View style={styles.trackingRow}>
              <View>
                <Text style={styles.fieldLabel}>Tracking Number</Text>
                <Text style={styles.trackingId}>{tracking.trackingId || 'N/A'}</Text>
              </View>
              {tracking.trackingId && (
                <TouchableOpacity onPress={() => copyToClipboard(tracking.trackingId)}>
                  <Text style={styles.copyBtn}>📋 Copy</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.infoGrid}>
              <View style={styles.infoBlock}>
                <Text style={styles.fieldLabel}>Carrier</Text>
                <Text style={styles.fieldValue}>{tracking.carrier || 'N/A'}</Text>
              </View>
              <View style={styles.infoBlock}>
                <Text style={styles.fieldLabel}>Est. Arrival</Text>
                <Text style={styles.fieldValue}>
                  {tracking.estimatedDeliveryStart
                    ? `${formatDateTime(tracking.estimatedDeliveryStart)}`
                    : 'Awaiting Delivery Window'}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Timeline */}
        <Card style={styles.section}>
          <View style={styles.timelineHeader}>
            <Text style={styles.sectionTitle}>Shipment Updates</Text>
            <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
              <Text style={styles.refreshBtn}>{refreshing ? 'Refreshing...' : '🔄 Refresh'}</Text>
            </TouchableOpacity>
          </View>
          {tracking?.timeline && tracking.timeline.length > 0 ? (
            tracking.timeline.map((event, idx) => {
              const isLast = idx === tracking.timeline.length - 1;
              const isCurrent = idx === tracking.timeline.length - 1 && tracking.status !== 'DELIVERED';
              return (
                <View key={idx} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={[styles.dot, isLast && !isCurrent && styles.completedDot, isCurrent && styles.currentDot]}>
                      {!isCurrent && <Text style={styles.dotCheck}>✓</Text>}
                    </View>
                    {idx < tracking.timeline.length - 1 && <View style={styles.line} />}
                  </View>
                  <View style={styles.eventContent}>
                    <Text style={[styles.eventStatus, isCurrent && { color: COLORS.primary }]}>{event.status}</Text>
                    <Text style={styles.eventTime}>{formatDateTime(event.timestamp)}</Text>
                    {event.location && <Text style={styles.eventLocation}>📍 {event.location}</Text>}
                    {event.description && <Text style={styles.eventDesc}>{event.description}</Text>}
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.noEvents}>No tracking events yet</Text>
          )}
        </Card>

        {/* Driver Info */}
        {tracking?.status === 'OUT_FOR_DELIVERY' && tracking?.driverName && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Agent</Text>
            <View style={styles.driverRow}>
              <Text style={styles.driverIcon}>👷</Text>
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{tracking.driverName}</Text>
                <Text style={styles.driverCompany}>{tracking.carrier}</Text>
              </View>
              {tracking.driverPhone && (
                <TouchableOpacity style={styles.callBtn} onPress={handleCallDriver}>
                  <Text style={styles.callBtnText}>📞 Call</Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
        )}

        {/* Report Problem */}
        <Card style={styles.section}>
          <Button
            title="⚠️ Report a Problem"
            variant="outline"
            onPress={() => navigation.navigate('ReportIssue', { orderId })}
          />
        </Card>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  mapPlaceholder: {
    height: 180, backgroundColor: '#E8F4FD', alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  mapIcon: { fontSize: 48, marginBottom: SPACING.sm },
  mapText: { fontSize: FONTS.sizes.base, fontWeight: 'bold', color: COLORS.textSecondary },
  mapSubtext: { fontSize: FONTS.sizes.xs, color: COLORS.textLight },
  section: { margin: SPACING.base, marginBottom: 0 },
  trackingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
  fieldLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginBottom: 4 },
  trackingId: { fontSize: FONTS.sizes.base, fontWeight: 'bold', color: COLORS.text, letterSpacing: 1 },
  copyBtn: { color: COLORS.primary, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  infoGrid: { flexDirection: 'row', gap: SPACING.base },
  infoBlock: { flex: 1 },
  fieldValue: { fontSize: FONTS.sizes.sm, color: COLORS.text, fontWeight: '500' },
  timelineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitle: { fontSize: FONTS.sizes.base, fontWeight: 'bold', color: COLORS.text },
  refreshBtn: { color: COLORS.primary, fontSize: FONTS.sizes.sm },
  timelineItem: { flexDirection: 'row', marginBottom: 0, minHeight: 56 },
  timelineLeft: { alignItems: 'center', marginRight: SPACING.md, width: 24 },
  dot: { width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.success, alignItems: 'center', justifyContent: 'center' },
  completedDot: { backgroundColor: COLORS.success },
  currentDot: { backgroundColor: COLORS.primary },
  dotCheck: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  line: { flex: 1, width: 2, backgroundColor: COLORS.border, marginTop: 4 },
  eventContent: { flex: 1, paddingBottom: SPACING.md },
  eventStatus: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.text },
  eventTime: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  eventLocation: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  eventDesc: { fontSize: FONTS.sizes.xs, color: COLORS.textLight, marginTop: 2 },
  noEvents: { color: COLORS.textSecondary, textAlign: 'center', fontSize: FONTS.sizes.sm },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  driverIcon: { fontSize: 36 },
  driverInfo: { flex: 1 },
  driverName: { fontSize: FONTS.sizes.base, fontWeight: 'bold', color: COLORS.text },
  driverCompany: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  callBtn: { backgroundColor: COLORS.success + '15', borderRadius: 8, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderWidth: 1, borderColor: COLORS.success + '40' },
  callBtnText: { color: COLORS.success, fontWeight: '600', fontSize: FONTS.sizes.sm },
});

export default TrackShipmentScreen;

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { ScreenHeader } from '../../components/common/Header';
import { Button, Card, LoadingScreen, InfoRow, Divider } from '../../components/common';
import { COLORS, FONTS, SPACING, RETURN_STATUS } from '../../constants';
import { returnsAPI } from '../../services/api';
import { formatDate, formatCurrency } from '../../utils/helpers';

const ReturnDetailsScreen = ({ navigation, route }) => {
  const { returnId } = route.params;
  const [returnRequest, setReturnRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => { loadReturn(); }, [returnId]);

  const loadReturn = async () => {
    try {
      const res = await returnsAPI.getById(returnId);
      setReturnRequest(res.data.data);
    } catch {} finally { setLoading(false); }
  };

  const handleCancelReturn = async () => {
    Alert.alert('Cancel Return', 'This action cannot be undone.', [
      { text: 'No, Keep Return' },
      { text: 'Yes, Cancel Return', style: 'destructive', onPress: async () => {
        setCancelling(true);
        try {
          await returnsAPI.cancel(returnRequest._id);
          navigation.replace('ReturnCancelled', { returnRequest });
        } catch (error) {
          Alert.alert('Error', error.response?.data?.message || 'Failed to cancel return');
        } finally { setCancelling(false); }
      }},
    ]);
  };

  if (loading) return <LoadingScreen />;
  if (!returnRequest) return null;

  const status = RETURN_STATUS[returnRequest.status] || { label: returnRequest.status, color: '#999' };
  const canCancel = returnRequest.status === 'REQUEST_SUBMITTED';

  return (
    <View style={styles.container}>
      <ScreenHeader title="Return Details" subtitle={returnRequest.returnId} showBack />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Status */}
        <Card>
          <View style={[styles.statusBanner, { backgroundColor: status.color + '15', borderColor: status.color + '30' }]}>
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label} – {returnRequest.status === 'UNDER_REVIEW' ? 'Supplier is reviewing your request.' : 'Processing...'}
            </Text>
          </View>

          {/* Timeline */}
          {['REQUEST_SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'IN_TRANSIT', 'REFUND_PROCESSED'].map((s, idx) => {
            const completed = returnRequest.timeline?.some(t => t.status === s);
            const isCurrent = returnRequest.status === s;
            return (
              <View key={s} style={styles.timelineItem}>
                <View style={styles.tLeft}>
                  <View style={[styles.dot, completed && styles.cDot, isCurrent && styles.aDot]}>
                    {completed && !isCurrent && <Text style={styles.check}>✓</Text>}
                  </View>
                  {idx < 4 && <View style={[styles.line, completed && styles.cLine]} />}
                </View>
                <Text style={[styles.stepLabel, completed && styles.cLabel, isCurrent && { color: COLORS.primary }]}>
                  {s.replace(/_/g, ' ')}
                </Text>
              </View>
            );
          })}
        </Card>

        {/* Items */}
        <Card>
          <Text style={styles.sectionTitle}>Items to Return</Text>
          {returnRequest.items.map((item, idx) => (
            <View key={idx}>
              {idx > 0 && <Divider />}
              <View style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemSku}>{item.sku}</Text>
                  <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                  <Text style={styles.itemReason}>Reason: {item.reason?.replace('_', ' ')}</Text>
                </View>
                <Text style={styles.itemRefund}>{formatCurrency(item.lineRefundAmount)}</Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Return Info */}
        <Card>
          <Text style={styles.sectionTitle}>Return Information</Text>
          <InfoRow label="Return ID" value={returnRequest.returnId} />
          <InfoRow label="Request Date" value={formatDate(returnRequest.createdAt)} />
          <InfoRow label="Refund Method" value={returnRequest.refundMethod?.replace('_', ' ')} />
          <InfoRow label="Est. Refund" value={formatCurrency(returnRequest.totalRefundAmount)} valueStyle={{ color: COLORS.success, fontWeight: 'bold' }} />
        </Card>

        {canCancel && (
          <Button
            title="Cancel Return Request"
            variant="outline"
            onPress={handleCancelReturn}
            loading={cancelling}
            style={styles.cancelBtn}
          />
        )}
        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { padding: SPACING.base },
  statusBanner: { borderWidth: 1, borderRadius: 8, padding: SPACING.md, marginBottom: SPACING.md },
  statusText: { fontWeight: '600', fontSize: FONTS.sizes.sm },
  timelineItem: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 40 },
  tLeft: { alignItems: 'center', marginRight: SPACING.md, width: 24 },
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  cDot: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  aDot: { borderColor: COLORS.primary },
  check: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  line: { flex: 1, width: 2, backgroundColor: COLORS.border, marginTop: 4 },
  cLine: { backgroundColor: COLORS.success },
  stepLabel: { flex: 1, fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, paddingBottom: SPACING.md },
  cLabel: { color: COLORS.text, fontWeight: '500' },
  sectionTitle: { fontSize: FONTS.sizes.base, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.md },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: SPACING.sm },
  itemInfo: { flex: 1 },
  itemName: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.text },
  itemSku: { fontSize: FONTS.sizes.xs, color: COLORS.textLight },
  itemQty: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  itemReason: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  itemRefund: { fontSize: FONTS.sizes.base, fontWeight: 'bold', color: COLORS.success },
  cancelBtn: { marginTop: SPACING.sm },
});

export default ReturnDetailsScreen;

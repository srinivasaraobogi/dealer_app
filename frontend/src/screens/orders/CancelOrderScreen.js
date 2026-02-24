import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { ScreenHeader } from '../../components/common/Header';
import { Button, Card } from '../../components/common';
import { COLORS, FONTS, SPACING, CANCELLATION_REASONS } from '../../constants';
import { ordersAPI } from '../../services/api';
import { formatCurrency, formatDate, sanitizeInput } from '../../utils/helpers';

const CancelOrderScreen = ({ navigation, route }) => {
  const { order } = route.params;
  const [selectedReason, setSelectedReason] = useState('');
  const [comment, setComment] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!selectedReason) e.reason = 'Please select a cancellation reason';
    if (selectedReason === 'OTHER' && !comment.trim()) e.comment = 'Please provide details for "Other"';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleConfirmCancel = async () => {
    if (!validate()) return;
    setCancelling(true);
    try {
      await ordersAPI.cancel(order._id || order.orderId, {
        reason: selectedReason,
        comment: sanitizeInput(comment),
      });
      navigation.replace('OrderCancelled', { order });
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to cancel order';
      Alert.alert('Cancellation Failed', msg);
    } finally { setCancelling(false); }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Cancel Order" subtitle={`Order #${order?.orderId}`} showBack />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Order Summary */}
        <Card>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.row}><Text style={styles.label}>Order ID</Text><Text style={styles.value}>{order?.orderId}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Date</Text><Text style={styles.value}>{formatDate(order?.createdAt)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Amount</Text><Text style={styles.value}>{formatCurrency(order?.total)}</Text></View>
        </Card>

        {/* Cancellation Reason */}
        <Card>
          <Text style={styles.sectionTitle}>Reason for Cancellation</Text>
          {errors.reason && <Text style={styles.error}>{errors.reason}</Text>}
          {CANCELLATION_REASONS.map(reason => (
            <TouchableOpacity
              key={reason.value}
              style={[styles.reasonOption, selectedReason === reason.value && styles.selectedReason]}
              onPress={() => { setSelectedReason(reason.value); setErrors(prev => ({ ...prev, reason: '' })); }}
            >
              <View style={[styles.radio, selectedReason === reason.value && styles.radioSelected]} />
              <Text style={styles.reasonLabel}>{reason.label}</Text>
            </TouchableOpacity>
          ))}
        </Card>

        {/* Additional Comments */}
        <Card>
          <Text style={styles.sectionTitle}>Additional Comments (Optional)</Text>
          <TextInput
            style={[styles.commentInput, errors.comment && styles.inputError]}
            value={comment}
            onChangeText={(v) => { setComment(v); setErrors(prev => ({ ...prev, comment: '' })); }}
            placeholder="Add any additional details..."
            placeholderTextColor={COLORS.textLight}
            multiline
            numberOfLines={3}
            maxLength={500}
            textAlignVertical="top"
          />
          {errors.comment && <Text style={styles.error}>{errors.comment}</Text>}
          <Text style={styles.charCount}>{comment.length}/500</Text>
        </Card>

        {/* Warning */}
        <View style={styles.warningBanner}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            This action cannot be undone. Once cancelled you will need to place a new order.
          </Text>
        </View>

        {/* Action Buttons */}
        <Button
          title="Confirm Cancel"
          variant="danger"
          onPress={handleConfirmCancel}
          loading={cancelling}
          style={styles.confirmBtn}
        />
        <Button
          title="Go Back"
          variant="outline"
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { padding: SPACING.base },
  sectionTitle: { fontSize: FONTS.sizes.base, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  label: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  value: { fontSize: FONTS.sizes.sm, fontWeight: '500', color: COLORS.text },
  reasonOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, gap: SPACING.md, borderRadius: 8 },
  selectedReason: { backgroundColor: COLORS.danger + '08' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.border },
  radioSelected: { backgroundColor: COLORS.danger, borderColor: COLORS.danger },
  reasonLabel: { fontSize: FONTS.sizes.base, color: COLORS.text },
  commentInput: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, padding: SPACING.md, fontSize: FONTS.sizes.base, color: COLORS.text, minHeight: 80 },
  inputError: { borderColor: COLORS.danger },
  error: { color: COLORS.danger, fontSize: FONTS.sizes.xs, marginTop: 4 },
  charCount: { fontSize: FONTS.sizes.xs, color: COLORS.textLight, textAlign: 'right', marginTop: 4 },
  warningBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, backgroundColor: '#FEF2F2', borderRadius: 12, padding: SPACING.md, marginBottom: SPACING.base, borderWidth: 1, borderColor: '#FECACA' },
  warningIcon: { fontSize: 20 },
  warningText: { flex: 1, fontSize: FONTS.sizes.sm, color: '#991B1B', lineHeight: 20 },
  confirmBtn: { marginBottom: SPACING.sm },
  backBtn: { marginBottom: SPACING.xxl },
});

export default CancelOrderScreen;

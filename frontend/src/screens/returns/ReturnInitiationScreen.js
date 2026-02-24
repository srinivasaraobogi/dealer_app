import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { ScreenHeader } from '../../components/common/Header';
import { Button, Card, Divider, LoadingScreen } from '../../components/common';
import { COLORS, FONTS, SPACING, RETURN_REASONS } from '../../constants';
import { ordersAPI, returnsAPI } from '../../services/api';
import { formatCurrency, formatDate, sanitizeInput } from '../../utils/helpers';

const ReturnInitiationScreen = ({ navigation, route }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState({});
  const [reasons, setReasons] = useState({});
  const [comments, setComments] = useState('');
  const [refundMethod, setRefundMethod] = useState('ORIGINAL_PAYMENT');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => { loadOrder(); }, [orderId]);

  const loadOrder = async () => {
    try {
      const res = await ordersAPI.getById(orderId);
      setOrder(res.data.data);
    } catch {} finally { setLoading(false); }
  };

  const toggleItem = (sku) => {
    setSelectedItems(prev => {
      if (prev[sku]) {
        const updated = { ...prev };
        delete updated[sku];
        return updated;
      }
      const item = order.items.find(i => i.sku === sku);
      return { ...prev, [sku]: item?.moq || 1 };
    });
  };

  const updateQty = (sku, qty) => {
    const item = order.items.find(i => i.sku === sku);
    if (!item) return;
    const clamped = Math.min(Math.max(1, qty), item.quantity);
    setSelectedItems(prev => ({ ...prev, [sku]: clamped }));
  };

  const validate = () => {
    const e = {};
    const selected = Object.keys(selectedItems);
    if (selected.length === 0) e.items = 'Please select at least one item to return';
    for (const sku of selected) {
      if (!reasons[sku]) { e.reasons = 'Please select a reason for each selected item'; break; }
    }
    if (!refundMethod) e.refund = 'Please select a refund method';
    if (comments && comments.length > 500) e.comments = 'Comments cannot exceed 500 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const items = Object.entries(selectedItems).map(([sku, quantity]) => ({
        sku,
        quantity,
        reason: reasons[sku],
      }));
      const res = await returnsAPI.create({
        orderId: order._id,
        items,
        comments: sanitizeInput(comments),
        refundMethod,
      });
      navigation.replace('ReturnSubmitted', { returnRequest: res.data.data });
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit return request');
    } finally { setSubmitting(false); }
  };

  const totalRefund = Object.entries(selectedItems).reduce((sum, [sku, qty]) => {
    const item = order?.items.find(i => i.sku === sku);
    return sum + (item?.unitPrice || 0) * qty;
  }, 0);

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Return" subtitle={`Order #${order?.orderId}`} showBack />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Order Info */}
        <Card>
          <View style={styles.row}><Text style={styles.label}>Order Date</Text><Text style={styles.value}>{formatDate(order?.createdAt)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Total Amount</Text><Text style={styles.value}>{formatCurrency(order?.total)}</Text></View>
          <View style={styles.returnWindow}>
            <Text style={styles.returnWindowText}>⏰ Return window: 7 days from delivery</Text>
          </View>
        </Card>

        {/* Select Items */}
        <Card>
          <Text style={styles.sectionTitle}>Select Items to Return</Text>
          {errors.items && <Text style={styles.error}>{errors.items}</Text>}
          {errors.reasons && <Text style={styles.error}>{errors.reasons}</Text>}
          {order?.items.map((item, idx) => {
            const isSelected = !!selectedItems[item.sku];
            return (
              <View key={item.sku}>
                {idx > 0 && <Divider />}
                <TouchableOpacity style={styles.itemRow} onPress={() => toggleItem(item.sku)}>
                  <View style={[styles.checkbox, isSelected && styles.checked]}>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemSku}>{item.sku}</Text>
                    <Text style={styles.itemPrice}>{formatCurrency(item.unitPrice)} × {item.quantity}</Text>
                  </View>
                </TouchableOpacity>

                {isSelected && (
                  <View style={styles.itemSelectionDetails}>
                    <View style={styles.qtyRow}>
                      <Text style={styles.qtyLabel}>Return Qty:</Text>
                      <View style={styles.qtyControls}>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.sku, selectedItems[item.sku] - 1)}>
                          <Text style={styles.qtyBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyValue}>{selectedItems[item.sku]}</Text>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.sku, selectedItems[item.sku] + 1)}>
                          <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={styles.reasonLabel}>Reason:</Text>
                    <View style={styles.reasonGrid}>
                      {RETURN_REASONS.map(r => (
                        <TouchableOpacity
                          key={r.value}
                          style={[styles.reasonChip, reasons[item.sku] === r.value && styles.selectedChip]}
                          onPress={() => setReasons(prev => ({ ...prev, [item.sku]: r.value }))}
                        >
                          <Text style={[styles.reasonChipText, reasons[item.sku] === r.value && styles.selectedChipText]}>
                            {r.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </Card>

        {/* Comments */}
        <Card>
          <Text style={styles.sectionTitle}>Additional Comments (Optional)</Text>
          <TextInput
            style={styles.commentInput}
            value={comments}
            onChangeText={setComments}
            placeholder="Add details about the return..."
            placeholderTextColor={COLORS.textLight}
            multiline
            numberOfLines={3}
            maxLength={500}
          />
          {errors.comments && <Text style={styles.error}>{errors.comments}</Text>}
        </Card>

        {/* Refund Method */}
        <Card>
          <Text style={styles.sectionTitle}>Refund Method</Text>
          {errors.refund && <Text style={styles.error}>{errors.refund}</Text>}
          {[
            { value: 'ORIGINAL_PAYMENT', label: 'Original Payment Method', desc: 'Refund to your original payment' },
            { value: 'BANK_TRANSFER', label: 'Bank Account Transfer', desc: 'Transfer to your registered bank' },
          ].map(m => (
            <TouchableOpacity
              key={m.value}
              style={[styles.refundOption, refundMethod === m.value && styles.selectedRefund]}
              onPress={() => setRefundMethod(m.value)}
            >
              <View style={[styles.radio, refundMethod === m.value && styles.radioSelected]} />
              <View>
                <Text style={styles.refundLabel}>{m.label}</Text>
                <Text style={styles.refundDesc}>{m.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </Card>

        {/* Summary */}
        {Object.keys(selectedItems).length > 0 && (
          <Card>
            <Text style={styles.sectionTitle}>Return Summary</Text>
            <View style={styles.row}><Text style={styles.label}>Items Selected</Text><Text style={styles.value}>{Object.keys(selectedItems).length}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Total Refund Amount</Text><Text style={[styles.value, { color: COLORS.success, fontWeight: 'bold' }]}>{formatCurrency(totalRefund)}</Text></View>
          </Card>
        )}

        <Button
          title="Submit Return Request"
          onPress={handleSubmit}
          loading={submitting}
          style={styles.submitBtn}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { padding: SPACING.base },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  label: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  value: { fontSize: FONTS.sizes.sm, fontWeight: '500', color: COLORS.text },
  returnWindow: { backgroundColor: '#FEF3C7', borderRadius: 8, padding: SPACING.sm, marginTop: SPACING.sm },
  returnWindowText: { color: '#92400E', fontSize: FONTS.sizes.xs },
  sectionTitle: { fontSize: FONTS.sizes.base, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.md },
  error: { color: COLORS.danger, fontSize: FONTS.sizes.xs, marginBottom: SPACING.sm },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, paddingVertical: SPACING.sm },
  checkbox: { width: 22, height: 22, borderWidth: 2, borderColor: COLORS.border, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkmark: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.text },
  itemSku: { fontSize: FONTS.sizes.xs, color: COLORS.textLight },
  itemPrice: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  itemSelectionDetails: { backgroundColor: COLORS.background, borderRadius: 8, padding: SPACING.md, marginBottom: SPACING.sm },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.sm },
  qtyLabel: { fontSize: FONTS.sizes.sm, color: COLORS.text },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  qtyValue: { fontSize: FONTS.sizes.base, fontWeight: 'bold', minWidth: 24, textAlign: 'center' },
  reasonLabel: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.sm },
  reasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  reasonChip: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  selectedChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  reasonChipText: { fontSize: FONTS.sizes.xs, color: COLORS.text },
  selectedChipText: { color: '#FFF' },
  commentInput: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, padding: SPACING.md, fontSize: FONTS.sizes.base, color: COLORS.text, minHeight: 80, textAlignVertical: 'top' },
  refundOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, gap: SPACING.md },
  selectedRefund: { backgroundColor: COLORS.primary + '08' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.border },
  radioSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  refundLabel: { fontSize: FONTS.sizes.base, fontWeight: '500', color: COLORS.text },
  refundDesc: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  submitBtn: { marginTop: SPACING.sm, marginBottom: SPACING.xxl },
});

export default ReturnInitiationScreen;

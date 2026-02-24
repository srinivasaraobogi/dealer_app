import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenHeader } from '../../components/common/Header';
import { Button, Card, Divider, LoadingScreen } from '../../components/common';
import { COLORS, FONTS, SPACING } from '../../constants';
import { paymentsAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';

const PayNowModal = ({ visible, invoice, onClose, onSuccess }) => {
  const [selectedMethod, setSelectedMethod] = useState('CARD');
  const [paying, setPaying] = useState(false);

  const methods = ['UPI', 'CARD', 'BANK_TRANSFER', 'WIRE_TRANSFER'];

  const handlePay = async () => {
    setPaying(true);
    try {
      await paymentsAPI.pay({ invoiceId: invoice._id || invoice.invoiceId, paymentMethod: selectedMethod });
      onSuccess();
    } catch (error) {
      Alert.alert('Payment Failed', error.response?.data?.message || 'Payment failed');
    } finally { setPaying(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Make Payment</Text>
          <Text style={styles.invoiceLabel}>Invoice: {invoice?.invoiceId}</Text>
          <Text style={styles.amountDue}>Amount Due: {formatCurrency(invoice?.amount)}</Text>
          <Divider />
          <Text style={styles.methodLabel}>Select Payment Method</Text>
          {methods.map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.methodOption, selectedMethod === m && styles.selectedMethod]}
              onPress={() => setSelectedMethod(m)}
            >
              <View style={[styles.radio, selectedMethod === m && styles.radioSelected]} />
              <Text style={styles.methodText}>{m.replace('_', ' ')}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.modalBtns}>
            <Button title="Cancel" variant="outline" onPress={onClose} style={{ flex: 1 }} />
            <Button title="Pay Now" onPress={handlePay} loading={paying} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const DealerPaymentsScreen = ({ navigation }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);

  const loadData = async () => {
    try {
      const res = await paymentsAPI.getSummary();
      setData(res.data.data);
    } catch {} finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const handlePayNow = (invoice) => {
    setSelectedInvoice(invoice);
    setShowPayModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPayModal(false);
    loadData();
    Alert.alert('✅ Payment Successful', 'Invoice marked as paid');
  };

  if (loading) return <LoadingScreen message="Loading payments..." />;

  const { creditSummary, unpaidInvoices, paymentHistory } = data || {};
  const allPaid = !unpaidInvoices || unpaidInvoices.length === 0;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Payments" showBack={false} />
      <ScrollView style={styles.scroll}>
        {/* Credit Summary */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Credit Summary</Text>
          <View style={styles.creditGrid}>
            <View style={styles.creditBlock}>
              <Text style={styles.creditLabel}>Available Credits</Text>
              <Text style={[styles.creditValue, { color: COLORS.primary, fontSize: FONTS.sizes.xl }]}>
                {formatCurrency(creditSummary?.availableCredit || 0)}
              </Text>
            </View>
            <View style={styles.creditBlock}>
              <Text style={styles.creditLabel}>Credit Limit</Text>
              <Text style={styles.creditValue}>{formatCurrency(creditSummary?.creditLimit || 0)}</Text>
            </View>
            <View style={styles.creditBlock}>
              <Text style={styles.creditLabel}>Outstanding</Text>
              <Text style={[styles.creditValue, { color: creditSummary?.outstandingAmount > 0 ? COLORS.warning : COLORS.text }]}>
                {formatCurrency(creditSummary?.outstandingAmount || 0)}
              </Text>
            </View>
          </View>
          {creditSummary?.outstandingAmount > creditSummary?.creditLimit * 0.8 && (
            <View style={styles.warningBanner}>
              <Text style={styles.warningText}>⚠️ Outstanding amount exceeds 80% of credit limit</Text>
            </View>
          )}
        </Card>

        {/* Unpaid Invoices */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Unpaid Invoices</Text>
          {allPaid ? (
            <View style={styles.allPaidContainer}>
              <Text style={styles.allPaidIcon}>✅</Text>
              <Text style={styles.allPaidText}>All invoices paid!</Text>
            </View>
          ) : (
            unpaidInvoices.map((inv, idx) => (
              <View key={inv._id}>
                {idx > 0 && <Divider />}
                <View style={styles.invoiceRow}>
                  <View style={styles.invoiceInfo}>
                    <Text style={styles.invoiceId}>{inv.invoiceId}</Text>
                    <Text style={styles.invoiceAmount}>{formatCurrency(inv.amount)}</Text>
                    {inv.overdueDays > 0 && (
                      <Text style={styles.overdueText}>Overdue by {inv.overdueDays} days</Text>
                    )}
                  </View>
                  <TouchableOpacity style={styles.payNowBtn} onPress={() => handlePayNow(inv)}>
                    <Text style={styles.payNowText}>Pay Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </Card>

        {/* Payment History */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Payment History</Text>
          {!paymentHistory || paymentHistory.length === 0 ? (
            <Text style={styles.noHistory}>No payment history yet</Text>
          ) : (
            paymentHistory.map((pay, idx) => (
              <View key={pay._id}>
                {idx > 0 && <Divider />}
                <View style={styles.paymentRow}>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentId}>{pay.paymentId}</Text>
                    <Text style={styles.paymentDate}>{formatDate(pay.createdAt)}</Text>
                    <Text style={styles.paymentMethod}>{pay.method.replace('_', ' ')}</Text>
                  </View>
                  <View style={styles.paymentRight}>
                    <Text style={styles.paymentAmount}>{formatCurrency(pay.amount)}</Text>
                    <View style={[styles.payStatusBadge, { backgroundColor: pay.status === 'COMPLETED' ? COLORS.success + '20' : COLORS.danger + '20' }]}>
                      <Text style={[styles.payStatus, { color: pay.status === 'COMPLETED' ? COLORS.success : COLORS.danger }]}>
                        {pay.status}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </Card>

        {/* Support */}
        <TouchableOpacity style={styles.supportBar} onPress={() => navigation.navigate('ContactSupport')}>
          <Text style={styles.supportText}>Need support? </Text>
          <Text style={styles.contactLink}>Contact Us →</Text>
        </TouchableOpacity>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>

      {selectedInvoice && (
        <PayNowModal
          visible={showPayModal}
          invoice={selectedInvoice}
          onClose={() => setShowPayModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  section: { margin: SPACING.base, marginBottom: 0 },
  sectionTitle: { fontSize: FONTS.sizes.base, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.md },
  creditGrid: { flexDirection: 'row', gap: SPACING.sm },
  creditBlock: { flex: 1, backgroundColor: COLORS.background, borderRadius: 8, padding: SPACING.sm, alignItems: 'center' },
  creditLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginBottom: 4, textAlign: 'center' },
  creditValue: { fontSize: FONTS.sizes.base, fontWeight: 'bold', color: COLORS.text, textAlign: 'center' },
  warningBanner: { backgroundColor: '#FEF3C7', borderRadius: 8, padding: SPACING.sm, marginTop: SPACING.sm },
  warningText: { color: '#92400E', fontSize: FONTS.sizes.xs },
  allPaidContainer: { alignItems: 'center', paddingVertical: SPACING.xl },
  allPaidIcon: { fontSize: 40, marginBottom: SPACING.sm },
  allPaidText: { fontSize: FONTS.sizes.base, fontWeight: '600', color: COLORS.success },
  invoiceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md },
  invoiceInfo: { flex: 1 },
  invoiceId: { fontSize: FONTS.sizes.sm, fontWeight: 'bold', color: COLORS.text },
  invoiceAmount: { fontSize: FONTS.sizes.base, fontWeight: 'bold', color: COLORS.primary, marginTop: 2 },
  overdueText: { fontSize: FONTS.sizes.xs, color: COLORS.danger, marginTop: 2 },
  payNowBtn: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  payNowText: { color: '#FFF', fontWeight: '600', fontSize: FONTS.sizes.sm },
  noHistory: { color: COLORS.textSecondary, textAlign: 'center', fontSize: FONTS.sizes.sm, paddingVertical: SPACING.md },
  paymentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm },
  paymentInfo: { flex: 1 },
  paymentId: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.text },
  paymentDate: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  paymentMethod: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  paymentRight: { alignItems: 'flex-end' },
  paymentAmount: { fontSize: FONTS.sizes.base, fontWeight: 'bold', color: COLORS.text },
  payStatusBadge: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  payStatus: { fontSize: FONTS.sizes.xs, fontWeight: '600' },
  supportBar: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surface, padding: SPACING.md, margin: SPACING.base, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  supportText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  contactLink: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '600' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  modal: { backgroundColor: COLORS.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: SPACING.xl },
  modalTitle: { fontSize: FONTS.sizes.lg, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.sm },
  invoiceLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  amountDue: { fontSize: FONTS.sizes.xl, fontWeight: 'bold', color: COLORS.primary, marginTop: 4, marginBottom: SPACING.md },
  methodLabel: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.sm },
  methodOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, gap: SPACING.md },
  selectedMethod: { backgroundColor: COLORS.primary + '08' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.border },
  radioSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  methodText: { fontSize: FONTS.sizes.base, color: COLORS.text },
  modalBtns: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.base },
});

export default DealerPaymentsScreen;

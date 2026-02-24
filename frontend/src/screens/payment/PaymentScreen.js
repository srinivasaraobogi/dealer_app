import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { ScreenHeader } from '../../components/common/Header';
import { Button, Card, Divider, LoadingScreen } from '../../components/common';
import { COLORS, FONTS, SPACING } from '../../constants';
import { ordersAPI, paymentsAPI } from '../../services/api';
import { formatCurrency } from '../../utils/helpers';
import { useAuth } from '../../store/AuthContext';
import { useCart } from '../../store/CartContext';

const PaymentScreen = ({ navigation, route }) => {
  const { paymentMethod: initialMethod } = route.params || {};
  const { dealer } = useAuth();
  const { cart, pricing, fetchCart } = useCart();
  const [selectedMethod, setSelectedMethod] = useState(initialMethod || 'NET_30');
  const [savedCards, setSavedCards] = useState([]);
  const [placing, setPlacing] = useState(false);

  const availableCredit = dealer?.availableCredit ?? (dealer?.creditLimit - dealer?.outstandingAmount) ?? 0;
  const orderTotal = pricing?.total || 0;
  const creditSufficient = availableCredit >= orderTotal;
  const creditExceeded = selectedMethod === 'SPLIT' || (selectedMethod === 'NET_30' && !creditSufficient);

  useEffect(() => {
    loadCards();
    if (!creditSufficient && selectedMethod === 'NET_30') {
      setSelectedMethod('SPLIT');
    }
  }, []);

  const loadCards = async () => {
    try {
      const res = await paymentsAPI.getCards();
      setSavedCards(res.data.data);
    } catch {}
  };

  const creditUsed = Math.min(availableCredit, orderTotal);
  const payNowAmount = Math.max(0, orderTotal - creditUsed);

  const paymentOptions = [
    {
      value: 'NET_30',
      label: 'Net 30 Terms',
      desc: 'Pay invoice within 30 days',
      disabled: !dealer?.isVerified || !dealer?.netTermsEnabled || !creditSufficient,
      disabledMsg: !creditSufficient ? 'Insufficient credits available' : 'Not eligible for Net 30',
    },
    ...savedCards.map(card => ({
      value: `CARD_${card._id}`,
      cardId: card._id,
      label: `${card.cardBrand} •••• ${card.lastFourDigits}`,
      desc: card.nickname,
      icon: '💳',
    })),
    { value: 'CARD', label: 'Card', desc: 'Add new card', icon: '💳' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: '🏛️' },
    { value: 'UPI', label: 'UPI', icon: '📱' },
  ];

  if (dealer?.isVerified && dealer?.netTermsEnabled && !creditSufficient && availableCredit > 0) {
    paymentOptions.splice(1, 0, {
      value: 'SPLIT',
      label: 'Split Payment (Net 30 + Pay Now)',
      desc: `Use ${formatCurrency(creditUsed)} credit + Pay ${formatCurrency(payNowAmount)} now`,
      badge: 'RECOMMENDED',
    });
  }

  const getButtonLabel = () => {
    if (selectedMethod === 'NET_30') return 'Place Order with Net 30';
    if (selectedMethod === 'SPLIT') return 'Proceed to Pay';
    return 'Proceed to Payment';
  };

  const getAmountToPayNow = () => {
    if (selectedMethod === 'NET_30') return 0;
    if (selectedMethod === 'SPLIT') return payNowAmount;
    return orderTotal;
  };

  const handlePlaceOrder = async () => {
    if (!cart?.deliveryAddress?.fullAddress) {
      Alert.alert('Address Required', 'Please add a delivery address in Order Summary');
      return;
    }

    const method = selectedMethod.startsWith('CARD_') ? 'CARD' : selectedMethod;

    setPlacing(true);
    try {
      const res = await ordersAPI.create({
        paymentMethod: method,
        cardToken: selectedMethod.startsWith('CARD_') ? selectedMethod.replace('CARD_', '') : null,
      });

      await fetchCart();
      navigation.reset({
        index: 0,
        routes: [{ name: 'OrderConfirmation', params: { order: res.data.data.order } }],
      });
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to place order. Please try again.';
      Alert.alert('Order Failed', msg);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Payment" subtitle={`${cart?.items?.length || 0} Items`} showBack />
      <ScrollView style={styles.scroll}>
        {/* Amount */}
        <Card style={styles.section}>
          <View style={styles.amountRow}>
            <View>
              <Text style={styles.amountLabel}>Amount</Text>
              <Text style={styles.amountValue}>{formatCurrency(orderTotal)}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('OrderSummary')}>
              <Text style={styles.viewDetails}>View Details →</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Credit Status */}
        {dealer?.isVerified && (
          <Card style={styles.section}>
            <View style={styles.creditHeader}>
              <View>
                <Text style={styles.creditStatus}>✅ Verified Dealer</Text>
                {dealer?.netTermsEnabled && (
                  <View style={styles.net30Badge}>
                    <Text style={styles.net30Text}>Net 30 Active</Text>
                  </View>
                )}
              </View>
            </View>
            <Divider />
            <View style={styles.creditRow}><Text style={styles.creditLabel}>Credit Limit</Text><Text style={styles.creditValue}>{formatCurrency(dealer?.creditLimit)}</Text></View>
            <View style={styles.creditRow}><Text style={styles.creditLabel}>This Order</Text><Text style={styles.creditValue}>{formatCurrency(orderTotal)}</Text></View>
            <View style={styles.creditRow}>
              <Text style={styles.creditLabel}>Available Credits</Text>
              <Text style={[styles.creditValue, { color: availableCredit >= orderTotal ? COLORS.success : COLORS.danger }]}>
                {formatCurrency(availableCredit)}
              </Text>
            </View>

            {creditSufficient ? (
              <View style={styles.eligibleBanner}>
                <Text style={styles.eligibleText}>✅ Eligible for Net 30 terms. You have sufficient credit for this order.</Text>
              </View>
            ) : (
              <View style={styles.warningBanner}>
                <Text style={styles.warningTitle}>⚠️ Credit Limit Exceeded</Text>
                <Text style={styles.warningText}>
                  Your order exceeded available limit by {formatCurrency(orderTotal - availableCredit)}.
                  Net 30 terms are restricted for the full amount.
                </Text>
              </View>
            )}
          </Card>
        )}

        {/* Payment Options */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          {paymentOptions.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.paymentOption,
                selectedMethod === opt.value && styles.selectedOption,
                opt.disabled && styles.disabledOption,
              ]}
              onPress={() => !opt.disabled && setSelectedMethod(opt.value)}
              disabled={opt.disabled}
            >
              <View style={[styles.radio, selectedMethod === opt.value && styles.radioSelected]} />
              <View style={styles.optionInfo}>
                <View style={styles.optionTitleRow}>
                  <Text style={[styles.optionLabel, opt.disabled && styles.disabledText]}>
                    {opt.icon ? `${opt.icon} ` : ''}{opt.label}
                  </Text>
                  {opt.badge && (
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>{opt.badge}</Text>
                    </View>
                  )}
                </View>
                {opt.desc && (
                  <Text style={[styles.optionDesc, opt.disabled && styles.disabledText]}>
                    {opt.disabled ? opt.disabledMsg : opt.desc}
                  </Text>
                )}
              </View>
              {opt.value === 'CARD' && (
                <TouchableOpacity onPress={() => navigation.navigate('AddCard')}>
                  <Text style={styles.addCardText}>ADD +</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}
        </Card>

        {/* Summary Footer */}
        <Card style={styles.section}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount to Pay Now</Text>
            <Text style={[styles.summaryValue, getAmountToPayNow() === 0 && { color: COLORS.success }]}>
              {formatCurrency(getAmountToPayNow())}
            </Text>
          </View>
          {selectedMethod === 'NET_30' && (
            <Text style={styles.billedNote}>Billed to credit – Due in 30 days</Text>
          )}
          {selectedMethod === 'SPLIT' && (
            <Text style={styles.billedNote}>
              {formatCurrency(creditUsed)} billed to credit | {formatCurrency(payNowAmount)} due now
            </Text>
          )}
        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={getButtonLabel()}
          onPress={handlePlaceOrder}
          loading={placing}
          style={styles.placeOrderBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  section: { margin: SPACING.base, marginBottom: 0 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  amountValue: { fontSize: FONTS.sizes.xxl, fontWeight: 'bold', color: COLORS.text },
  viewDetails: { color: COLORS.primary, fontSize: FONTS.sizes.sm },
  creditHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
  creditStatus: { fontSize: FONTS.sizes.base, fontWeight: 'bold', color: COLORS.success },
  net30Badge: { backgroundColor: COLORS.primary + '15', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 4 },
  net30Text: { color: COLORS.primary, fontSize: FONTS.sizes.xs, fontWeight: '600' },
  creditRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  creditLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  creditValue: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.text },
  eligibleBanner: { backgroundColor: '#D1FAE5', borderRadius: 8, padding: SPACING.sm, marginTop: SPACING.sm },
  eligibleText: { color: '#065F46', fontSize: FONTS.sizes.sm },
  warningBanner: { backgroundColor: '#FEF3C7', borderRadius: 8, padding: SPACING.sm, marginTop: SPACING.sm },
  warningTitle: { fontWeight: 'bold', color: '#92400E', marginBottom: 4 },
  warningText: { color: '#92400E', fontSize: FONTS.sizes.sm },
  sectionTitle: { fontSize: FONTS.sizes.base, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.md },
  paymentOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, borderRadius: 10, paddingHorizontal: SPACING.sm, gap: SPACING.md },
  selectedOption: { backgroundColor: COLORS.primary + '08' },
  disabledOption: { opacity: 0.5 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.border },
  radioSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  optionInfo: { flex: 1 },
  optionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  optionLabel: { fontSize: FONTS.sizes.base, fontWeight: '500', color: COLORS.text },
  disabledText: { color: COLORS.textLight },
  optionDesc: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  recommendedBadge: { backgroundColor: COLORS.secondary + '20', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  recommendedText: { color: COLORS.secondary, fontSize: 9, fontWeight: 'bold' },
  addCardText: { color: COLORS.primary, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  summaryLabel: { fontSize: FONTS.sizes.base, fontWeight: '600', color: COLORS.text },
  summaryValue: { fontSize: FONTS.sizes.xl, fontWeight: 'bold', color: COLORS.text },
  billedNote: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, textAlign: 'right' },
  footer: { padding: SPACING.base, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  placeOrderBtn: {},
});

export default PaymentScreen;

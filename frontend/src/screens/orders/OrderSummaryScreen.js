import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenHeader } from '../../components/common/Header';
import { Button, Card, Divider, EmptyState, LoadingScreen, SuccessBanner } from '../../components/common';
import { COLORS, FONTS, SPACING } from '../../constants';
import { useCart } from '../../store/CartContext';
import { formatCurrency } from '../../utils/helpers';

const CartItem = ({ item, onUpdate, onRemove }) => {
  const productId = item.productId?._id?.toString() || item.productId?.toString();

  const handleDecrease = () => {
    if (item.quantity > item.moq) onUpdate(productId, item.quantity - 1);
  };
  const handleIncrease = () => {
    if (item.quantity < item.stock) onUpdate(productId, item.quantity + 1);
  };

  return (
    <View style={styles.cartItem}>
      <Image source={{ uri: item.image || 'https://via.placeholder.com/80' }} style={styles.itemImage} />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.itemSku}>{item.sku}</Text>
        <Text style={styles.itemPrice}>{formatCurrency(item.unitPrice)} each</Text>
        <View style={styles.qtyRow}>
          <View style={styles.qtyControls}>
            <TouchableOpacity style={styles.qtyBtn} onPress={handleDecrease} disabled={item.quantity <= item.moq}>
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{item.quantity}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={handleIncrease} disabled={item.quantity >= item.stock}>
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.lineTotal}>{formatCurrency(item.unitPrice * item.quantity)}</Text>
          <TouchableOpacity onPress={() => onRemove(productId)}>
            <Text style={styles.removeBtn}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const EditAddressModal = ({ visible, currentAddress, onSave, onClose }) => {
  const [address, setAddress] = useState(currentAddress?.fullAddress || '');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!address || address.length < 10) {
      setError('Address must be at least 10 characters');
      return;
    }
    if (address.length > 250) {
      setError('Address too long (max 250 characters)');
      return;
    }
    onSave({ fullAddress: address, label: 'Warehouse' });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Edit Shipping Address</Text>
          <TextInput
            style={[styles.addressInput, error && styles.inputError]}
            value={address}
            onChangeText={(v) => { setAddress(v); setError(''); }}
            multiline
            numberOfLines={4}
            placeholder="Enter full shipping address..."
            placeholderTextColor={COLORS.textLight}
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
          <Text style={styles.charCount}>{address.length}/250</Text>
          <View style={styles.modalButtons}>
            <Button title="Cancel" onPress={onClose} variant="outline" style={{ flex: 1 }} />
            <Button title="Save Address" onPress={handleSave} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const OrderSummaryScreen = ({ navigation }) => {
  const { cart, pricing, loading, fetchCart, updateQuantity, removeFromCart, updateAddress } = useCart();
  const [showEditAddress, setShowEditAddress] = useState(false);
  const [addressSaved, setAddressSaved] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('NET_30');
  const [savingAddress, setSavingAddress] = useState(false);

  useFocusEffect(useCallback(() => {
    fetchCart();
  }, []));

  useEffect(() => {
    if (addressSaved) {
      const timer = setTimeout(() => setAddressSaved(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [addressSaved]);

  const handleSaveAddress = async (addressData) => {
    setSavingAddress(true);
    try {
      await updateAddress(addressData);
      setShowEditAddress(false);
      setAddressSaved(true);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save address');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleUpdateQuantity = async (productId, quantity) => {
    try {
      await updateQuantity(productId, quantity);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update quantity');
    }
  };

  const handleRemove = async (productId) => {
    try {
      await removeFromCart(productId);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to remove item');
    }
  };

  if (loading) return <LoadingScreen message="Loading cart..." />;

  const isEmpty = !cart?.items || cart.items.length === 0;

  if (isEmpty) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Order Summary" showBack />
        <EmptyState
          icon="🛒"
          title="Cart is Empty"
          subtitle="Add products to your cart to proceed"
          actionLabel="Browse Products"
          onAction={() => navigation.navigate('ProductsList')}
        />
      </View>
    );
  }

  const paymentMethods = [
    { value: 'NET_30', label: 'Net 30 Terms', desc: 'Pay invoice within 30 days' },
    { value: 'CARD', label: 'Card' },
    { value: 'UPI', label: 'UPI' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  ];

  return (
    <View style={styles.container}>
      <ScreenHeader title="Order Summary" subtitle={`${cart.items.length} Items`} showBack />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Address saved banner */}
        <View style={styles.bannerContainer}>
          <SuccessBanner message="Shipping address saved successfully" visible={addressSaved} />
        </View>

        {/* Cart Items */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          {cart.items.map((item, idx) => {
            const itemKey = item.productId?._id?.toString() || item.productId?.toString();
            return (
              <View key={itemKey}>
                <CartItem item={item} onUpdate={handleUpdateQuantity} onRemove={handleRemove} />
                {idx < cart.items.length - 1 && <Divider />}
              </View>
            );
          })}
        </Card>

        {/* Delivery Address */}
        <Card style={styles.section}>
          <View style={styles.addressHeader}>
            <Text style={styles.sectionTitle}>🏭 Delivering to</Text>
            <TouchableOpacity onPress={() => setShowEditAddress(true)}>
              <Text style={styles.changeBtn}>Change</Text>
            </TouchableOpacity>
          </View>
          {cart.deliveryAddress?.fullAddress ? (
            <Text style={styles.addressText}>{cart.deliveryAddress.fullAddress}</Text>
          ) : (
            <TouchableOpacity style={styles.addAddressBtn} onPress={() => setShowEditAddress(true)}>
              <Text style={styles.addAddressText}>+ Add Delivery Address</Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Pricing */}
        {pricing && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Price Breakdown</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Subtotal ({cart.items.length} items)</Text>
              <Text style={styles.priceValue}>{formatCurrency(pricing.subtotal)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Tax ({(pricing.taxRate * 100).toFixed(0)}%)</Text>
              <Text style={styles.priceValue}>{formatCurrency(pricing.taxAmount)}</Text>
            </View>
            <Divider />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(pricing.total)}</Text>
            </View>
          </Card>
        )}

        {/* Payment Method Selection */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>PAY USING</Text>
          {paymentMethods.map((pm) => (
            <TouchableOpacity
              key={pm.value}
              style={[styles.paymentOption, selectedPayment === pm.value && styles.selectedPayment]}
              onPress={() => setSelectedPayment(pm.value)}
            >
              <View style={[styles.radio, selectedPayment === pm.value && styles.radioSelected]} />
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentLabel}>{pm.label}</Text>
                {pm.desc && <Text style={styles.paymentDesc}>{pm.desc}</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        {pricing && (
          <Text style={styles.footerTotal}>Total: {formatCurrency(pricing.total)}</Text>
        )}
        <Button
          title="Select Payment Option"
          onPress={() => {
            if (!cart.deliveryAddress?.fullAddress) {
              Alert.alert('Address Required', 'Please add a delivery address before proceeding');
              return;
            }
            navigation.navigate('Payment', { paymentMethod: selectedPayment });
          }}
          style={styles.proceedBtn}
        />
      </View>

      <EditAddressModal
        visible={showEditAddress}
        currentAddress={cart.deliveryAddress}
        onSave={handleSaveAddress}
        onClose={() => setShowEditAddress(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  bannerContainer: { padding: SPACING.base, paddingBottom: 0 },
  section: { margin: SPACING.base, marginBottom: 0 },
  sectionTitle: { fontSize: FONTS.sizes.base, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.md },
  cartItem: { flexDirection: 'row', gap: SPACING.md, paddingVertical: SPACING.sm },
  itemImage: { width: 80, height: 80, borderRadius: 8, resizeMode: 'cover' },
  itemDetails: { flex: 1 },
  itemName: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  itemSku: { fontSize: FONTS.sizes.xs, color: COLORS.textLight, marginBottom: 2 },
  itemPrice: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  qtyValue: { fontSize: FONTS.sizes.base, fontWeight: 'bold', color: COLORS.text, minWidth: 28, textAlign: 'center' },
  lineTotal: { fontSize: FONTS.sizes.base, fontWeight: 'bold', color: COLORS.primary, flex: 1, textAlign: 'right' },
  removeBtn: { fontSize: 18 },
  addressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  changeBtn: { color: COLORS.primary, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  addressText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, lineHeight: 20 },
  addAddressBtn: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: COLORS.primary, borderRadius: 8, padding: SPACING.md, alignItems: 'center' },
  addAddressText: { color: COLORS.primary, fontWeight: '600' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  priceLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  priceValue: { fontSize: FONTS.sizes.sm, color: COLORS.text, fontWeight: '500' },
  totalLabel: { fontSize: FONTS.sizes.base, fontWeight: 'bold', color: COLORS.text },
  totalValue: { fontSize: FONTS.sizes.lg, fontWeight: 'bold', color: COLORS.primary },
  paymentOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, borderRadius: 8, gap: SPACING.md },
  selectedPayment: { backgroundColor: COLORS.primary + '08' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.border },
  radioSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  paymentInfo: {},
  paymentLabel: { fontSize: FONTS.sizes.base, fontWeight: '500', color: COLORS.text },
  paymentDesc: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  footer: { padding: SPACING.base, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  footerTotal: { fontSize: FONTS.sizes.base, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.sm, textAlign: 'center' },
  proceedBtn: {},
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  modal: { backgroundColor: COLORS.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: SPACING.xl },
  modalTitle: { fontSize: FONTS.sizes.lg, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.base },
  addressInput: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, padding: SPACING.md, fontSize: FONTS.sizes.base, color: COLORS.text, minHeight: 100, textAlignVertical: 'top' },
  inputError: { borderColor: COLORS.danger },
  errorText: { color: COLORS.danger, fontSize: FONTS.sizes.xs, marginTop: 4 },
  charCount: { fontSize: FONTS.sizes.xs, color: COLORS.textLight, textAlign: 'right', marginTop: 2, marginBottom: SPACING.base },
  modalButtons: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
});

export default OrderSummaryScreen;

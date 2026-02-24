import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ScreenHeader } from '../../components/common/Header';
import { Button, Input, Card, LoadingScreen } from '../../components/common';
import { COLORS, FONTS, SPACING } from '../../constants';
import { profileAPI } from '../../services/api';
import { validateIFSC, validatePAN } from '../../utils/helpers';
import { useAuth } from '../../store/AuthContext';

const BANKS = ['SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak', 'PNB', 'BOB', 'Canara', 'Union Bank', 'Other'];

const BankInfoScreen = ({ navigation }) => {
  const { updateDealer } = useAuth();
  const [form, setForm] = useState({
    bankName: '', accountNumber: '', confirmAccountNumber: '',
    ifscCode: '', accountHolderName: '', accountType: '',
    panNumber: '', gstNumber: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const res = await profileAPI.get();
      const d = res.data.data;
      setForm({
        bankName: d.bankName || '',
        accountNumber: d.accountNumber || '',
        confirmAccountNumber: d.accountNumber || '',
        ifscCode: d.ifscCode || '',
        accountHolderName: d.accountHolderName || '',
        accountType: d.accountType || '',
        panNumber: d.panNumber || '',
        gstNumber: d.gstNumber || '',
      });
    } catch {} finally { setLoading(false); }
  };

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value.toUpperCase() }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.bankName) e.bankName = 'Bank name required';
    if (!form.accountNumber || !/^\d{9,18}$/.test(form.accountNumber)) e.accountNumber = 'Account number must be 9-18 digits';
    if (form.accountNumber !== form.confirmAccountNumber) e.confirmAccountNumber = 'Account numbers do not match';
    if (!form.ifscCode) e.ifscCode = 'IFSC code required';
    else if (!validateIFSC(form.ifscCode)) e.ifscCode = 'Invalid IFSC format (e.g. SBIN0001234)';
    if (!form.accountHolderName.trim()) e.accountHolderName = 'Account holder name required';
    if (!form.accountType) e.accountType = 'Account type required';
    if (!form.panNumber) e.panNumber = 'PAN number required';
    else if (!validatePAN(form.panNumber)) e.panNumber = 'Invalid PAN format (e.g. ABCDE1234F)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await profileAPI.updateBank(form);
      updateDealer(res.data.data);
      Alert.alert('✅ Saved', 'Bank information updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      const errors = error.response?.data?.errors?.map(e => e.msg).join(', ') || error.response?.data?.message || 'Failed to save';
      Alert.alert('Error', errors);
    } finally { setSaving(false); }
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Bank Information" showBack />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <Text style={styles.label}>Bank Name *</Text>
          <View style={styles.bankGrid}>
            {BANKS.map(b => (
              <TouchableOpacity
                key={b}
                style={[styles.bankChip, form.bankName === b && styles.selectedChip]}
                onPress={() => update('bankName', b)}
              >
                <Text style={[styles.chipText, form.bankName === b && styles.selectedChipText]}>{b}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.bankName && <Text style={styles.error}>{errors.bankName}</Text>}
          <Input label="Account Number *" value={form.accountNumber} onChangeText={v => update('accountNumber', v.replace(/\D/g, ''))} placeholder="9-18 digits" keyboardType="numeric" maxLength={18} error={errors.accountNumber} />
          <Input label="Confirm Account Number *" value={form.confirmAccountNumber} onChangeText={v => update('confirmAccountNumber', v.replace(/\D/g, ''))} placeholder="Re-enter account number" keyboardType="numeric" maxLength={18} error={errors.confirmAccountNumber} />
          <Input label="IFSC Code *" value={form.ifscCode} onChangeText={v => update('ifscCode', v)} placeholder="e.g. SBIN0001234" maxLength={11} error={errors.ifscCode} />
          <Input label="Account Holder Name *" value={form.accountHolderName} onChangeText={v => setForm(prev => ({ ...prev, accountHolderName: v }))} placeholder="As per bank records" error={errors.accountHolderName} />
          <Text style={styles.label}>Account Type *</Text>
          <View style={styles.typeRow}>
            {['SAVINGS', 'CURRENT'].map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.typeOption, form.accountType === t && styles.selectedType]}
                onPress={() => setForm(prev => ({ ...prev, accountType: t }))}
              >
                <Text style={[styles.typeText, form.accountType === t && styles.selectedTypeText]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.accountType && <Text style={styles.error}>{errors.accountType}</Text>}
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Tax Information</Text>
          <Input label="PAN Number *" value={form.panNumber} onChangeText={v => update('panNumber', v)} placeholder="e.g. ABCDE1234F" maxLength={10} error={errors.panNumber} />
          <Input label="GST Number (Optional)" value={form.gstNumber} onChangeText={v => update('gstNumber', v)} placeholder="15-digit GST number" maxLength={15} />
        </Card>

        <View style={styles.actionBtns}>
          <Button title="Cancel" variant="outline" onPress={() => navigation.goBack()} style={{ flex: 1 }} />
          <Button title="Complete Profile" onPress={handleSave} loading={saving} style={{ flex: 1 }} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { padding: SPACING.base },
  sectionTitle: { fontSize: FONTS.sizes.base, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.md },
  label: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.sm },
  error: { color: COLORS.danger, fontSize: FONTS.sizes.xs, marginBottom: SPACING.sm },
  bankGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  bankChip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  selectedChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONTS.sizes.xs, color: COLORS.text },
  selectedChipText: { color: '#FFF' },
  typeRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  typeOption: { flex: 1, paddingVertical: SPACING.md, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center' },
  selectedType: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeText: { fontWeight: '600', color: COLORS.text },
  selectedTypeText: { color: '#FFF' },
  actionBtns: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.base, marginBottom: SPACING.xxl },
});

export default BankInfoScreen;

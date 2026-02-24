import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { ScreenHeader } from '../../components/common/Header';
import { Button, Input, Card, LoadingScreen } from '../../components/common';
import { COLORS, FONTS, SPACING } from '../../constants';
import { profileAPI } from '../../services/api';
import { validateEmail, validateMobile, validatePinCode } from '../../utils/helpers';
import { useAuth } from '../../store/AuthContext';

const STATES = ['Andhra Pradesh', 'Karnataka', 'Maharashtra', 'Tamil Nadu', 'Delhi', 'Gujarat', 'Rajasthan', 'West Bengal', 'Punjab', 'Other'];

const ContactDetailsScreen = ({ navigation }) => {
  const { dealer, updateDealer } = useAuth();
  const [form, setForm] = useState({
    email: '', mobile: '', address: '', city: '', state: '', pinCode: '',
    emergencyContactName: '', emergencyContactNumber: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completion, setCompletion] = useState(0);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await profileAPI.get();
      const d = res.data.data;
      setForm({
        email: d.email || '',
        mobile: d.mobile || '',
        address: d.address || '',
        city: d.city || '',
        state: d.state || '',
        pinCode: d.pinCode || '',
        emergencyContactName: d.emergencyContactName || '',
        emergencyContactNumber: d.emergencyContactNumber || '',
      });
      setCompletion(d.profileCompletion || 0);
    } catch {} finally { setLoading(false); }
  };

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email required';
    else if (!validateEmail(form.email)) e.email = 'Invalid email format';
    if (!form.mobile) e.mobile = 'Mobile required';
    else if (!validateMobile(form.mobile)) e.mobile = 'Must be 10 digits';
    if (!form.address || form.address.length < 10) e.address = 'Address must be at least 10 characters';
    if (form.address.length > 250) e.address = 'Address too long';
    if (!form.city) e.city = 'City required';
    if (!form.state) e.state = 'State required';
    if (!form.pinCode) e.pinCode = 'PIN code required';
    else if (!validatePinCode(form.pinCode)) e.pinCode = 'Must be 6 digits';
    if (form.emergencyContactNumber && form.emergencyContactNumber === form.mobile) {
      e.emergencyContactNumber = 'Cannot match primary mobile';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await profileAPI.updateContact(form);
      updateDealer(res.data.data);
      Alert.alert('✅ Saved', 'Contact details updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to save';
      Alert.alert('Error', msg);
    } finally { setSaving(false); }
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Contact Details" showBack />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Completion Banner */}
        <View style={styles.completionBanner}>
          <Text style={styles.completionText}>Profile {completion}% Complete</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${completion}%` }]} />
          </View>
        </View>

        {/* Primary Contact */}
        <Card>
          <Text style={styles.sectionTitle}>Primary Contact</Text>
          <Input label="Email Address *" value={form.email} onChangeText={v => update('email', v)} placeholder="business@email.com" keyboardType="email-address" error={errors.email} />
          <Input label="Mobile Number *" value={form.mobile} onChangeText={v => update('mobile', v)} placeholder="10-digit mobile" keyboardType="phone-pad" maxLength={10} error={errors.mobile} />
          <Input label="Address *" value={form.address} onChangeText={v => update('address', v)} placeholder="Street, Area" multiline numberOfLines={3} error={errors.address} maxLength={250} />
          <Input label="City *" value={form.city} onChangeText={v => update('city', v)} placeholder="City" error={errors.city} />
          <Text style={styles.label}>State *</Text>
          <View style={styles.stateContainer}>
            {STATES.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.stateChip, form.state === s && styles.selectedState]}
                onPress={() => update('state', s)}
              >
                <Text style={[styles.stateText, form.state === s && styles.selectedStateText]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.state && <Text style={styles.error}>{errors.state}</Text>}
          <Input label="PIN Code *" value={form.pinCode} onChangeText={v => update('pinCode', v)} placeholder="6-digit PIN" keyboardType="numeric" maxLength={6} error={errors.pinCode} />
        </Card>

        {/* Emergency Contact */}
        <Card>
          <Text style={styles.sectionTitle}>Emergency Contact (Optional)</Text>
          <Input label="Contact Name" value={form.emergencyContactName} onChangeText={v => update('emergencyContactName', v)} placeholder="Emergency contact name" />
          <Input label="Emergency Number" value={form.emergencyContactNumber} onChangeText={v => update('emergencyContactNumber', v)} placeholder="10-digit number" keyboardType="phone-pad" maxLength={10} error={errors.emergencyContactNumber} />
        </Card>

        <View style={styles.actionBtns}>
          <Button title="Cancel" variant="outline" onPress={() => navigation.goBack()} style={{ flex: 1 }} />
          <Button title="Save Changes" onPress={handleSave} loading={saving} style={{ flex: 1 }} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { padding: SPACING.base },
  completionBanner: { backgroundColor: COLORS.primary + '15', borderRadius: 12, padding: SPACING.md, marginBottom: SPACING.base },
  completionText: { fontSize: FONTS.sizes.sm, color: COLORS.primary, marginBottom: SPACING.xs },
  progressBar: { height: 6, backgroundColor: COLORS.primary + '30', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  sectionTitle: { fontSize: FONTS.sizes.base, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.md },
  label: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.sm },
  stateContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  stateChip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  selectedState: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stateText: { fontSize: FONTS.sizes.xs, color: COLORS.text },
  selectedStateText: { color: '#FFF' },
  error: { color: COLORS.danger, fontSize: FONTS.sizes.xs, marginBottom: SPACING.sm },
  actionBtns: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.base, marginBottom: SPACING.xxl },
});

export default ContactDetailsScreen;

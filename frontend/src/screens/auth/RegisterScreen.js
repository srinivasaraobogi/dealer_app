import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../../store/AuthContext';
import { Button, Input } from '../../components/common';
import { COLORS, FONTS, SPACING } from '../../constants';
import { validateEmail, validateMobile } from '../../utils/helpers';

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: '', email: '', mobile: '', companyName: '', password: '', confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!validateEmail(form.email)) e.email = 'Invalid email';
    if (!form.mobile) e.mobile = 'Mobile is required';
    else if (!validateMobile(form.mobile)) e.mobile = 'Must be 10 digits';
    if (!form.companyName.trim()) e.companyName = 'Company name is required';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Min 8 characters';
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(form.password)) {
      e.password = 'Must include uppercase, lowercase, number, and special character';
    }
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.toLowerCase().trim(),
        mobile: form.mobile,
        companyName: form.companyName.trim(),
        password: form.password,
      });
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed';
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>Create Account</Text>
          <Text style={styles.formSubtitle}>Register as a B2B dealer</Text>

          {errors.general && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>❌ {errors.general}</Text>
            </View>
          )}

          <Input label="Full Name *" value={form.name} onChangeText={v => update('name', v)} placeholder="Your full name" error={errors.name} />
          <Input label="Email Address *" value={form.email} onChangeText={v => update('email', v)} placeholder="business@email.com" keyboardType="email-address" error={errors.email} />
          <Input label="Mobile Number *" value={form.mobile} onChangeText={v => update('mobile', v)} placeholder="10-digit mobile" keyboardType="phone-pad" maxLength={10} error={errors.mobile} />
          <Input label="Company Name *" value={form.companyName} onChangeText={v => update('companyName', v)} placeholder="Your company name" error={errors.companyName} />
          <Input label="Password *" value={form.password} onChangeText={v => update('password', v)} placeholder="Min 8 characters" secureTextEntry error={errors.password} />
          <Input label="Confirm Password *" value={form.confirmPassword} onChangeText={v => update('confirmPassword', v)} placeholder="Re-enter password" secureTextEntry error={errors.confirmPassword} />

          <Button title="Create Account" onPress={handleRegister} loading={loading} style={styles.registerBtn} />

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already registered? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Login here</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, padding: SPACING.base },
  headerRow: { marginBottom: SPACING.md },
  backBtn: { color: COLORS.primary, fontSize: FONTS.sizes.base },
  form: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.xl,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  formTitle: { fontSize: FONTS.sizes.xl, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  formSubtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.danger,
  },
  errorBannerText: { color: COLORS.danger, fontSize: FONTS.sizes.sm },
  registerBtn: { marginTop: SPACING.sm },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.lg },
  loginText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
  loginLink: { color: COLORS.primary, fontSize: FONTS.sizes.sm, fontWeight: '600' },
});

export default RegisterScreen;

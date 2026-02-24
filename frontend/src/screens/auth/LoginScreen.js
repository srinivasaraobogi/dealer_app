import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { useAuth } from '../../store/AuthContext';
import { Button, Input } from '../../components/common';
import { COLORS, FONTS, SPACING } from '../../constants';
import { validateEmail } from '../../utils/helpers';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!validateEmail(email)) newErrors.email = 'Invalid email format';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.toLowerCase().trim(), password);
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo/Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoIcon}>🏭</Text>
          </View>
          <Text style={styles.appName}>DealerApp B2B</Text>
          <Text style={styles.tagline}>Your industrial supply partner</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>Welcome Back</Text>
          <Text style={styles.formSubtitle}>Sign in to your dealer account</Text>

          {errors.general && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>❌ {errors.general}</Text>
            </View>
          )}

          <Input
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            error={errors.email}
          />

          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry={!showPassword}
            error={errors.password}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.showPass}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            }
          />

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button
            title="Login"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginBtn}
          />

          <View style={styles.demoHint}>
            <Text style={styles.demoHintText}>Demo: dealer@demo.com / Demo@1234</Text>
          </View>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>New dealer? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Register here</Text>
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
  header: { alignItems: 'center', marginVertical: SPACING.xxl },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    elevation: 4,
  },
  logoIcon: { fontSize: 40 },
  appName: { fontSize: FONTS.sizes.title, fontWeight: 'bold', color: COLORS.text },
  tagline: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 4 },
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
  forgotPassword: { alignSelf: 'flex-end', marginBottom: SPACING.base },
  forgotPasswordText: { color: COLORS.primary, fontSize: FONTS.sizes.sm },
  loginBtn: { marginTop: SPACING.sm },
  demoHint: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: SPACING.sm,
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  demoHintText: { color: COLORS.primary, fontSize: FONTS.sizes.xs },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.lg },
  registerText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
  registerLink: { color: COLORS.primary, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  showPass: { fontSize: 18 },
});

export default LoginScreen;

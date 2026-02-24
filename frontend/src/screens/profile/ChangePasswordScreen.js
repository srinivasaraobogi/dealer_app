import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { ScreenHeader } from '../../components/common/Header';
import { Button, Input, Card } from '../../components/common';
import { COLORS, FONTS, SPACING } from '../../constants';
import { profileAPI } from '../../services/api';

const ChangePasswordScreen = ({ navigation }) => {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const getStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: COLORS.border };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score++;
    const map = [
      { label: '', color: COLORS.border },
      { label: 'Very Weak', color: COLORS.danger },
      { label: 'Weak', color: '#F97316' },
      { label: 'Fair', color: '#EAB308' },
      { label: 'Strong', color: '#22C55E' },
      { label: 'Very Strong', color: COLORS.success },
    ];
    return { score, ...map[score] };
  };

  const validate = () => {
    const e = {};
    if (!form.currentPassword) e.currentPassword = 'Current password required';
    if (!form.newPassword) e.newPassword = 'New password required';
    else if (form.newPassword.length < 8) e.newPassword = 'Password must be at least 8 characters';
    else if (!/[A-Z]/.test(form.newPassword)) e.newPassword = 'Must contain an uppercase letter';
    else if (!/[a-z]/.test(form.newPassword)) e.newPassword = 'Must contain a lowercase letter';
    else if (!/\d/.test(form.newPassword)) e.newPassword = 'Must contain a number';
    else if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.newPassword)) e.newPassword = 'Must contain a special character';
    if (!form.confirmPassword) e.confirmPassword = 'Please confirm your new password';
    else if (form.newPassword !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (form.currentPassword && form.newPassword && form.currentPassword === form.newPassword)
      e.newPassword = 'New password must be different from current password';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await profileAPI.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      Alert.alert('Password Changed', 'Your password has been updated. Please log in again with your new password.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (error) {
      const msg = error.response?.data?.errors?.map(e => e.msg).join(', ') || error.response?.data?.message || 'Failed to update password';
      Alert.alert('Error', msg);
    } finally { setSaving(false); }
  };

  const strength = getStrength(form.newPassword);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Change Password" showBack />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card>
          <Text style={styles.sectionTitle}>Update Password</Text>
          <Text style={styles.hint}>Your password must be at least 8 characters and include uppercase, lowercase, number, and special character.</Text>

          <Input
            label="Current Password *"
            value={form.currentPassword}
            onChangeText={v => { setForm(p => ({ ...p, currentPassword: v })); setErrors(p => ({ ...p, currentPassword: '' })); }}
            secureTextEntry={!showCurrent}
            placeholder="Enter current password"
            error={errors.currentPassword}
            rightIcon={showCurrent ? '👁' : '👁‍🗨'}
            onRightIconPress={() => setShowCurrent(p => !p)}
          />

          <Input
            label="New Password *"
            value={form.newPassword}
            onChangeText={v => { setForm(p => ({ ...p, newPassword: v })); setErrors(p => ({ ...p, newPassword: '' })); }}
            secureTextEntry={!showNew}
            placeholder="Enter new password"
            error={errors.newPassword}
            rightIcon={showNew ? '👁' : '👁‍🗨'}
            onRightIconPress={() => setShowNew(p => !p)}
          />

          {form.newPassword.length > 0 && (
            <View style={styles.strengthWrapper}>
              <View style={styles.strengthBars}>
                {[1, 2, 3, 4, 5].map(i => (
                  <View
                    key={i}
                    style={[styles.strengthBar, { backgroundColor: i <= strength.score ? strength.color : COLORS.border }]}
                  />
                ))}
              </View>
              {strength.label ? <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text> : null}
            </View>
          )}

          <View style={styles.requirements}>
            {[
              { label: 'At least 8 characters', met: form.newPassword.length >= 8 },
              { label: 'One uppercase letter (A-Z)', met: /[A-Z]/.test(form.newPassword) },
              { label: 'One lowercase letter (a-z)', met: /[a-z]/.test(form.newPassword) },
              { label: 'One number (0-9)', met: /\d/.test(form.newPassword) },
              { label: 'One special character (!@#$...)', met: /[!@#$%^&*(),.?":{}|<>]/.test(form.newPassword) },
            ].map((r, i) => (
              <View key={i} style={styles.reqRow}>
                <Text style={[styles.reqIcon, { color: r.met ? COLORS.success : COLORS.textSecondary }]}>
                  {r.met ? '✓' : '○'}
                </Text>
                <Text style={[styles.reqText, { color: r.met ? COLORS.success : COLORS.textSecondary }]}>{r.label}</Text>
              </View>
            ))}
          </View>

          <Input
            label="Confirm New Password *"
            value={form.confirmPassword}
            onChangeText={v => { setForm(p => ({ ...p, confirmPassword: v })); setErrors(p => ({ ...p, confirmPassword: '' })); }}
            secureTextEntry={!showConfirm}
            placeholder="Re-enter new password"
            error={errors.confirmPassword}
            rightIcon={showConfirm ? '👁' : '👁‍🗨'}
            onRightIconPress={() => setShowConfirm(p => !p)}
          />
        </Card>

        <View style={styles.actionBtns}>
          <Button title="Cancel" variant="outline" onPress={() => navigation.goBack()} style={{ flex: 1 }} />
          <Button title="Update Password" onPress={handleSave} loading={saving} style={{ flex: 1 }} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { padding: SPACING.base },
  sectionTitle: { fontSize: FONTS.sizes.base, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.xs },
  hint: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginBottom: SPACING.md, lineHeight: 18 },
  strengthWrapper: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm, gap: SPACING.sm },
  strengthBars: { flexDirection: 'row', flex: 1, gap: 4 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: FONTS.sizes.xs, fontWeight: '600', minWidth: 70 },
  requirements: { marginBottom: SPACING.md, gap: 4 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  reqIcon: { fontSize: 12, width: 16 },
  reqText: { fontSize: FONTS.sizes.xs },
  actionBtns: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.base, marginBottom: SPACING.xxl },
});

export default ChangePasswordScreen;

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { ScreenHeader } from '../../components/common/Header';
import { Card, LoadingScreen, Button } from '../../components/common';
import { COLORS, FONTS, SPACING } from '../../constants';
import { profileAPI } from '../../services/api';
import { useAuth } from '../../store/AuthContext';

const NOTIFICATION_SETTINGS = [
  {
    section: 'Order Updates',
    items: [
      { key: 'orderConfirmation', label: 'Order Confirmation', desc: 'Receive alerts when your order is confirmed' },
      { key: 'shippingUpdates', label: 'Shipping Updates', desc: 'Get notified when your order ships' },
      { key: 'deliveryNotifications', label: 'Delivery Notifications', desc: 'Alerts when your order is delivered' },
    ],
  },
  {
    section: 'Account & Security',
    items: [
      { key: 'securityAlerts', label: 'Security Alerts', desc: 'Notifications for login attempts and password changes' },
      { key: 'paymentUpdates', label: 'Payment Updates', desc: 'Invoice due dates, payment confirmations, and credit updates' },
    ],
  },
  {
    section: 'Promotions',
    items: [
      { key: 'specialOffers', label: 'Special Offers', desc: 'Price drops and exclusive dealer deals' },
      { key: 'newsletter', label: 'Newsletter', desc: 'Monthly product updates and company news' },
    ],
  },
];

const NotificationSettingsScreen = ({ navigation }) => {
  const { updateDealer } = useAuth();
  const [prefs, setPrefs] = useState({
    orderConfirmation: true,
    shippingUpdates: true,
    deliveryNotifications: true,
    securityAlerts: true,
    paymentUpdates: true,
    specialOffers: false,
    newsletter: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadPrefs(); }, []);

  const loadPrefs = async () => {
    try {
      const res = await profileAPI.get();
      const p = res.data.data.notificationPreferences;
      if (p) setPrefs(prev => ({ ...prev, ...p }));
    } catch {} finally { setLoading(false); }
  };

  const toggle = (key) => setPrefs(prev => ({ ...prev, [key]: !prev[key] }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await profileAPI.updateNotifications(prefs);
      updateDealer(res.data.data);
      Alert.alert('Saved', 'Notification preferences updated', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save preferences');
    } finally { setSaving(false); }
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Notification Settings" showBack />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {NOTIFICATION_SETTINGS.map(section => (
          <Card key={section.section} style={styles.card}>
            <Text style={styles.sectionTitle}>{section.section}</Text>
            {section.items.map((item, idx) => (
              <View key={item.key}>
                {idx > 0 && <View style={styles.divider} />}
                <View style={styles.row}>
                  <View style={styles.rowText}>
                    <Text style={styles.rowLabel}>{item.label}</Text>
                    <Text style={styles.rowDesc}>{item.desc}</Text>
                  </View>
                  <Switch
                    value={prefs[item.key]}
                    onValueChange={() => toggle(item.key)}
                    trackColor={{ false: COLORS.border, true: COLORS.primary + '80' }}
                    thumbColor={prefs[item.key] ? COLORS.primary : '#f4f3f4'}
                  />
                </View>
              </View>
            ))}
          </Card>
        ))}

        <View style={styles.actionBtns}>
          <Button title="Cancel" variant="outline" onPress={() => navigation.goBack()} style={{ flex: 1 }} />
          <Button title="Save Preferences" onPress={handleSave} loading={saving} style={{ flex: 1 }} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { padding: SPACING.base },
  card: { marginBottom: SPACING.md },
  sectionTitle: { fontSize: FONTS.sizes.sm, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.md, textTransform: 'uppercase', letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.md },
  rowText: { flex: 1 },
  rowLabel: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  rowDesc: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, lineHeight: 16 },
  actionBtns: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm, marginBottom: SPACING.xxl },
});

export default NotificationSettingsScreen;

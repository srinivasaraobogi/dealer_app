import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { ScreenHeader } from '../../components/common/Header';
import { Card, LoadingScreen } from '../../components/common';
import { COLORS, FONTS, SPACING } from '../../constants';
import { supportAPI } from '../../services/api';
import { formatPhoneForTel } from '../../utils/helpers';

const ContactSupportScreen = ({ navigation }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await supportAPI.getConfig();
      setConfig(res.data.data);
    } catch {
      setConfig({ phone: '+91-9999999999', email: 'support@dealerapp.com', availability: '24/7' });
    } finally {
      setLoading(false);
    }
  };

  const handleCall = async () => {
    if (!config?.phone) return;
    const tel = `tel:${formatPhoneForTel(config.phone)}`;
    const supported = await Linking.canOpenURL(tel);
    if (supported) Linking.openURL(tel);
  };

  const handleEmail = async () => {
    if (!config?.email) return;
    const mailto = `mailto:${config.email}?subject=Dealer Support Request`;
    Linking.openURL(mailto);
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Contact Support" subtitle="Our team is available 24/7" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Availability Banner */}
        <View style={styles.availBanner}>
          <Text style={styles.availIcon}>🟢</Text>
          <View>
            <Text style={styles.availTitle}>Support Available</Text>
            <Text style={styles.availSubtitle}>{config?.availability || '24/7'} – We're here to help</Text>
          </View>
        </View>

        {/* Call Us */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>📞</Text>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Call Us</Text>
              <Text style={styles.cardSubtitle}>Direct telephonic support</Text>
            </View>
          </View>
          <Text style={styles.contactDetail}>{config?.phone || '+91-9999999999'}</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={handleCall}>
            <Text style={styles.actionBtnText}>📞 Call Now</Text>
          </TouchableOpacity>
        </Card>

        {/* Email Us */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>✉️</Text>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Email Us</Text>
              <Text style={styles.cardSubtitle}>Get written support</Text>
            </View>
          </View>
          <Text style={styles.contactDetail}>{config?.email || 'support@dealerapp.com'}</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={handleEmail}>
            <Text style={styles.actionBtnText}>✉️ Send Email</Text>
          </TouchableOpacity>
        </Card>

        {/* Support Options */}
        <Card>
          <Text style={styles.optionsTitle}>Other Support Options</Text>
          {[
            { icon: '💬', label: 'Live Chat', desc: 'Chat with our support agent' },
            { icon: '🎫', label: 'Raise a Ticket', desc: 'Submit a detailed support request' },
          ].map((opt, idx) => (
            <TouchableOpacity key={idx} style={styles.optionRow}>
              <Text style={styles.optionIcon}>{opt.icon}</Text>
              <View style={styles.optionText}>
                <Text style={styles.optionLabel}>{opt.label}</Text>
                <Text style={styles.optionDesc}>{opt.desc}</Text>
              </View>
              <Text style={styles.optionArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { padding: SPACING.base },

  availBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.base,
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  availIcon: { fontSize: 20 },
  availTitle: { fontSize: FONTS.sizes.md, fontWeight: 'bold', color: '#065F46' },
  availSubtitle: { fontSize: FONTS.sizes.sm, color: '#065F46' },

  card: { marginBottom: SPACING.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  cardIcon: { fontSize: 32, marginRight: SPACING.md },
  cardHeaderText: {},
  cardTitle: { fontSize: FONTS.sizes.lg, fontWeight: 'bold', color: COLORS.text },
  cardSubtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  contactDetail: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  actionBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: SPACING.md,
    alignItems: 'center',
  },
  actionBtnText: { color: '#FFF', fontWeight: '600', fontSize: FONTS.sizes.base },

  optionsTitle: { fontSize: FONTS.sizes.md, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.md },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  optionIcon: { fontSize: 24, marginRight: SPACING.md },
  optionText: { flex: 1 },
  optionLabel: { fontSize: FONTS.sizes.base, fontWeight: '600', color: COLORS.text },
  optionDesc: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  optionArrow: { fontSize: 20, color: COLORS.textSecondary },
});

export default ContactSupportScreen;

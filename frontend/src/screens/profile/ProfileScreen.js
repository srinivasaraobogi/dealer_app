import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenHeader } from '../../components/common/Header';
import { Card, Divider, LoadingScreen } from '../../components/common';
import { COLORS, FONTS, SPACING } from '../../constants';
import { profileAPI } from '../../services/api';
import { formatCurrency, formatDate, getInitials } from '../../utils/helpers';
import { useAuth } from '../../store/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const { dealer, logout, updateDealer } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    loadProfile();
  }, []));

  const loadProfile = async () => {
    try {
      const res = await profileAPI.get();
      setProfile(res.data.data);
      updateDealer(res.data.data);
    } catch {} finally { setLoading(false); }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  if (loading) return <LoadingScreen />;

  const profileData = profile || dealer;
  const availableCredit = profileData?.creditLimit - profileData?.outstandingAmount;

  const profileMenuItems = [
    { icon: '📞', label: 'Contact Details', screen: 'ContactDetails' },
    { icon: '🏦', label: 'Bank Information', screen: 'BankInfo' },
  ];

  const settingsItems = [
    { icon: '🔒', label: 'Change Password', screen: 'ChangePassword' },
    { icon: '🔔', label: 'Notification Settings', screen: 'NotificationSettings' },
    { icon: '🌐', label: 'Language', screen: 'Language' },
    { icon: '📄', label: 'Terms & Conditions', screen: null },
    { icon: '🛡️', label: 'Privacy Policy', screen: null },
  ];

  return (
    <View style={styles.container}>
      <ScreenHeader title="" showBack={false} />
      <ScrollView style={styles.scroll}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(profileData?.name)}</Text>
          </View>
          <Text style={styles.name}>{profileData?.name}</Text>
          <Text style={styles.dealerId}>ID: {profileData?.dealerId}</Text>
          {profileData?.isVerified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✅ Verified Dealer</Text>
            </View>
          )}
          {/* Profile Completion */}
          <View style={styles.completionContainer}>
            <Text style={styles.completionLabel}>Profile {profileData?.profileCompletion || 0}% Complete</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${profileData?.profileCompletion || 0}%` }]} />
            </View>
          </View>
        </View>

        {/* Business Info */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Business Information</Text>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Company</Text><Text style={styles.infoValue}>{profileData?.companyName || 'N/A'}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>GSTIN</Text><Text style={styles.infoValue}>{profileData?.gstin || 'N/A'}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Territory</Text><Text style={styles.infoValue}>{profileData?.territory || 'N/A'}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Price Tier</Text><Text style={styles.infoValue}>{profileData?.priceTier || 'N/A'}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Dealer Since</Text><Text style={styles.infoValue}>{formatDate(profileData?.dealerSince)}</Text></View>
        </Card>

        {/* Credit Summary */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Credit Summary</Text>
          <View style={styles.creditGrid}>
            <View style={styles.creditBlock}>
              <Text style={styles.creditLabel}>Credit Limit</Text>
              <Text style={styles.creditValue}>{formatCurrency(profileData?.creditLimit || 0)}</Text>
            </View>
            <View style={styles.creditBlock}>
              <Text style={styles.creditLabel}>Outstanding</Text>
              <Text style={[styles.creditValue, { color: COLORS.warning }]}>{formatCurrency(profileData?.outstandingAmount || 0)}</Text>
            </View>
            <View style={styles.creditBlock}>
              <Text style={styles.creditLabel}>Available</Text>
              <Text style={[styles.creditValue, { color: COLORS.success }]}>{formatCurrency(Math.max(0, availableCredit || 0))}</Text>
            </View>
          </View>
          <Text style={styles.creditPeriod}>Credit Period: {profileData?.creditPeriodDays || 30} days</Text>
        </Card>

        {/* Profile Info */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Info</Text>
          {profileMenuItems.map((item, idx) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, idx === 0 && { borderTopWidth: 0 }]}
              onPress={() => item.screen && navigation.navigate(item.screen)}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </Card>

        {/* Settings */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          {settingsItems.map((item, idx) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, idx === 0 && { borderTopWidth: 0 }]}
              onPress={() => item.screen && navigation.navigate(item.screen)}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </Card>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Logout</Text>
        </TouchableOpacity>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  profileHeader: { backgroundColor: COLORS.primary, padding: SPACING.xl, alignItems: 'center', paddingTop: 0 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  avatarText: { fontSize: FONTS.sizes.xxl, fontWeight: 'bold', color: '#FFF' },
  name: { fontSize: FONTS.sizes.xl, fontWeight: 'bold', color: '#FFF' },
  dealerId: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  verifiedBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: SPACING.md, paddingVertical: 4, marginTop: SPACING.sm },
  verifiedText: { color: '#FFF', fontSize: FONTS.sizes.xs, fontWeight: '600' },
  completionContainer: { width: '100%', marginTop: SPACING.md },
  completionLabel: { color: 'rgba(255,255,255,0.9)', fontSize: FONTS.sizes.xs, marginBottom: 4 },
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FFF', borderRadius: 3 },
  section: { margin: SPACING.base, marginBottom: 0 },
  sectionTitle: { fontSize: FONTS.sizes.base, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  infoLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  infoValue: { fontSize: FONTS.sizes.sm, fontWeight: '500', color: COLORS.text },
  creditGrid: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  creditBlock: { flex: 1, backgroundColor: COLORS.background, borderRadius: 8, padding: SPACING.sm, alignItems: 'center' },
  creditLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginBottom: 4 },
  creditValue: { fontSize: FONTS.sizes.sm, fontWeight: 'bold', color: COLORS.text },
  creditPeriod: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, textAlign: 'center' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border },
  menuIcon: { fontSize: 20, marginRight: SPACING.md, width: 28 },
  menuLabel: { flex: 1, fontSize: FONTS.sizes.base, color: COLORS.text },
  menuArrow: { fontSize: 22, color: COLORS.textSecondary },
  logoutBtn: { margin: SPACING.base, backgroundColor: '#FEF2F2', borderRadius: 12, padding: SPACING.base, alignItems: 'center', borderWidth: 1, borderColor: '#FECACA' },
  logoutText: { color: COLORS.danger, fontWeight: '600', fontSize: FONTS.sizes.base },
});

export default ProfileScreen;

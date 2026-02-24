import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ScreenHeader } from '../../components/common/Header';
import { Card, LoadingScreen, Button } from '../../components/common';
import { COLORS, FONTS, SPACING } from '../../constants';
import { profileAPI } from '../../services/api';
import { useAuth } from '../../store/AuthContext';

const LANGUAGES = [
  { code: 'en-US', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'es-ES', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr-FR', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
];

const LanguageScreen = ({ navigation }) => {
  const { updateDealer } = useAuth();
  const [selected, setSelected] = useState('en-US');
  const [original, setOriginal] = useState('en-US');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadLanguage(); }, []);

  const loadLanguage = async () => {
    try {
      const res = await profileAPI.get();
      const lang = res.data.data.language || 'en-US';
      setSelected(lang);
      setOriginal(lang);
    } catch {} finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (selected === original) { navigation.goBack(); return; }
    setSaving(true);
    try {
      const res = await profileAPI.updateLanguage(selected);
      updateDealer(res.data.data);
      Alert.alert('Language Updated', `App language set to ${LANGUAGES.find(l => l.code === selected)?.name}`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update language');
    } finally { setSaving(false); }
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Language" showBack />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.hint}>Select your preferred language for the app interface.</Text>
        <Card>
          {LANGUAGES.map((lang, idx) => (
            <TouchableOpacity
              key={lang.code}
              style={[styles.row, idx > 0 && styles.borderTop]}
              onPress={() => setSelected(lang.code)}
              activeOpacity={0.7}
            >
              <Text style={styles.flag}>{lang.flag}</Text>
              <View style={styles.nameBlock}>
                <Text style={styles.langName}>{lang.name}</Text>
                <Text style={styles.nativeName}>{lang.nativeName}</Text>
              </View>
              <View style={[styles.radio, selected === lang.code && styles.radioSelected]}>
                {selected === lang.code && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </Card>

        <View style={styles.actionBtns}>
          <Button title="Cancel" variant="outline" onPress={() => navigation.goBack()} style={{ flex: 1 }} />
          <Button title="Save Language" onPress={handleSave} loading={saving} style={{ flex: 1 }} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { padding: SPACING.base },
  hint: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginBottom: SPACING.md },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, gap: SPACING.md },
  borderTop: { borderTopWidth: 1, borderTopColor: COLORS.border },
  flag: { fontSize: 24, width: 36, textAlign: 'center' },
  nameBlock: { flex: 1 },
  langName: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.text },
  nativeName: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: COLORS.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  actionBtns: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.md, marginBottom: SPACING.xxl },
});

export default LanguageScreen;

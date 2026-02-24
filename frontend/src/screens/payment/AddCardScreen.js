import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ScreenHeader } from '../../components/common/Header';
import { Button, Input, Card, Divider, LoadingScreen } from '../../components/common';
import { COLORS, FONTS, SPACING } from '../../constants';
import { paymentsAPI } from '../../services/api';

const CARD_NICKNAMES = ['PERSONAL', 'BUSINESS', 'OTHER'];

const AddCardScreen = ({ navigation }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [nickname, setNickname] = useState('PERSONAL');
  const [savedCards, setSavedCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => { loadCards(); }, []);

  const loadCards = async () => {
    try {
      const res = await paymentsAPI.getCards();
      setSavedCards(res.data.data);
    } catch {} finally { setLoading(false); }
  };

  const formatCardNumber = (text) => {
    const digits = text.replace(/\D/g, '').substring(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (text) => {
    const digits = text.replace(/\D/g, '').substring(0, 4);
    if (digits.length >= 2) return `${digits.substring(0, 2)}/${digits.substring(2)}`;
    return digits;
  };

  const validate = () => {
    const e = {};
    const rawCard = cardNumber.replace(/\s/g, '');
    if (!rawCard || rawCard.length < 13 || rawCard.length > 19) e.cardNumber = 'Card number must be 13-19 digits';
    if (!expiry || !/^\d{2}\/\d{2}$/.test(expiry)) e.expiry = 'Invalid expiry (MM/YY)';
    else {
      const [month, year] = expiry.split('/').map(Number);
      const now = new Date();
      const currentYear = now.getFullYear() % 100;
      const currentMonth = now.getMonth() + 1;
      if (month < 1 || month > 12) e.expiry = 'Invalid month';
      else if (year < currentYear || (year === currentYear && month < currentMonth)) e.expiry = 'Card has expired';
    }
    if (!cardholderName.trim()) e.cardholderName = 'Cardholder name required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveCard = async () => {
    if (!validate()) return;
    const rawCard = cardNumber.replace(/\s/g, '');
    const [month, year] = expiry.split('/');
    setSaving(true);
    try {
      // In production, send to payment gateway SDK first to get token
      // For demo, simulate tokenization
      const mockToken = `tok_${Date.now()}_${rawCard.slice(-4)}`;
      const brands = { '4': 'VISA', '5': 'Mastercard', '3': 'Amex', '6': 'Discover' };
      const brand = brands[rawCard[0]] || 'Unknown';

      await paymentsAPI.addCard({
        cardToken: mockToken,
        cardBrand: brand,
        lastFourDigits: rawCard.slice(-4),
        expiryMonth: month,
        expiryYear: year,
        cardholderName: cardholderName.trim(),
        nickname,
      });

      Alert.alert('✅ Card Saved', 'Your card has been saved successfully', [
        { text: 'OK', onPress: () => { loadCards(); setCardNumber(''); setExpiry(''); setCardholderName(''); } },
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save card');
    } finally { setSaving(false); }
  };

  const handleDeleteCard = (cardId) => {
    Alert.alert('Remove Card', 'Are you sure you want to remove this card?', [
      { text: 'Cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try {
          await paymentsAPI.deleteCard(cardId);
          loadCards();
        } catch (error) {
          Alert.alert('Error', 'Failed to remove card');
        }
      }},
    ]);
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Add Card" showBack />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Add New Card */}
        <Card>
          <Text style={styles.sectionTitle}>Add New Card</Text>
          <Input
            label="Card Number"
            value={cardNumber}
            onChangeText={v => setCardNumber(formatCardNumber(v))}
            placeholder="1234 5678 9012 3456"
            keyboardType="numeric"
            maxLength={19}
            error={errors.cardNumber}
          />
          <View style={styles.row}>
            <Input
              label="Expiry (MM/YY)"
              value={expiry}
              onChangeText={v => setExpiry(formatExpiry(v))}
              placeholder="MM/YY"
              keyboardType="numeric"
              maxLength={5}
              error={errors.expiry}
              style={{ flex: 1 }}
            />
          </View>
          <Input
            label="Cardholder Name"
            value={cardholderName}
            onChangeText={setCardholderName}
            placeholder="Name on card"
            error={errors.cardholderName}
          />

          {/* Nickname */}
          <Text style={styles.label}>Nickname for Card</Text>
          <View style={styles.nicknameRow}>
            {CARD_NICKNAMES.map(n => (
              <TouchableOpacity
                key={n}
                style={[styles.nicknameOption, nickname === n && styles.selectedNickname]}
                onPress={() => setNickname(n)}
              >
                <Text style={[styles.nicknameText, nickname === n && styles.selectedNicknameText]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button title="Save Card" onPress={handleSaveCard} loading={saving} style={styles.saveBtn} />
        </Card>

        {/* Saved Cards */}
        {savedCards.length > 0 && (
          <Card>
            <Text style={styles.sectionTitle}>Saved Cards</Text>
            {savedCards.map((card, idx) => (
              <View key={card._id}>
                {idx > 0 && <Divider />}
                <View style={styles.savedCard}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardBrand}>{card.cardBrand}</Text>
                    <Text style={styles.cardNumber}>•••• •••• •••• {card.lastFourDigits}</Text>
                    <Text style={styles.cardExpiry}>Expires {card.expiryMonth}/{card.expiryYear}</Text>
                    <Text style={styles.cardHolder}>{card.cardholderName}</Text>
                    {card.isDefault && (
                      <View style={styles.defaultBadge}><Text style={styles.defaultText}>Default</Text></View>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteCard(card._id)}>
                    <Text style={styles.deleteCardBtn}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { padding: SPACING.base },
  sectionTitle: { fontSize: FONTS.sizes.base, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.md },
  row: { flexDirection: 'row', gap: SPACING.md },
  label: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.sm },
  nicknameRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  nicknameOption: { flex: 1, paddingVertical: SPACING.sm, borderRadius: 8, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center' },
  selectedNickname: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  nicknameText: { fontSize: FONTS.sizes.sm, color: COLORS.text, fontWeight: '500' },
  selectedNicknameText: { color: '#FFF' },
  saveBtn: { marginTop: SPACING.sm },
  savedCard: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: SPACING.sm },
  cardInfo: { flex: 1 },
  cardBrand: { fontSize: FONTS.sizes.sm, fontWeight: 'bold', color: COLORS.text, marginBottom: 2 },
  cardNumber: { fontSize: FONTS.sizes.base, color: COLORS.text, letterSpacing: 2, marginBottom: 2 },
  cardExpiry: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginBottom: 2 },
  cardHolder: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  defaultBadge: { backgroundColor: COLORS.primary + '15', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 4 },
  defaultText: { color: COLORS.primary, fontSize: FONTS.sizes.xs, fontWeight: '600' },
  deleteCardBtn: { fontSize: 22 },
});

export default AddCardScreen;

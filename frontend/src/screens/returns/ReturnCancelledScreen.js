import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '../../components/common';
import { COLORS, FONTS, SPACING } from '../../constants';

const ReturnCancelledScreen = ({ navigation }) => (
  <View style={styles.container}>
    <View style={styles.content}>
      <View style={styles.iconContainer}><Text style={styles.icon}>✅</Text></View>
      <Text style={styles.title}>Return Request Cancelled</Text>
      <Text style={styles.subtitle}>Your return request has been successfully cancelled.</Text>
      <Button title="Back to Order Details" onPress={() => navigation.navigate('OrderHistory')} style={styles.btn} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center' },
  content: { padding: SPACING.xl, alignItems: 'center' },
  iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.base, borderWidth: 3, borderColor: COLORS.success },
  icon: { fontSize: 40 },
  title: { fontSize: FONTS.sizes.xl, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.sm, textAlign: 'center' },
  subtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.xl },
  btn: { width: '100%' },
});

export default ReturnCancelledScreen;

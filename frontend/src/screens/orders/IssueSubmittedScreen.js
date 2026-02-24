import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button, Card } from '../../components/common';
import { COLORS, FONTS, SPACING, ISSUE_STATUS } from '../../constants';
import { formatDate } from '../../utils/helpers';

const IssueSubmittedScreen = ({ navigation, route }) => {
  const { issue } = route.params || {};
  const status = ISSUE_STATUS[issue?.status] || { label: 'Under Review', color: COLORS.primary };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.successCircle}>
          <Text style={styles.successIcon}>✅</Text>
        </View>
        <Text style={styles.title}>Report Submitted</Text>
        <Text style={styles.subtitle}>We have received your issue report. Our support team will review it and respond shortly.</Text>

        <Card style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Report ID</Text>
            <Text style={styles.value}>{issue?.issueId || 'RPT-0000'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{formatDate(issue?.createdAt || new Date())}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>
        </Card>

        <View style={styles.slaBanner}>
          <Text style={styles.slaIcon}>⏰</Text>
          <Text style={styles.slaText}>Expected response time is 24–48 hrs.</Text>
        </View>

        <Button
          title="Track Report Status"
          onPress={() => navigation.navigate('IssueStatus', { issueId: issue?.issueId || issue?._id })}
          style={styles.btn}
        />
        <Button
          title="Back to Orders"
          variant="outline"
          onPress={() => navigation.navigate('OrderHistory')}
          style={styles.btn}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.base, alignItems: 'center' },
  successCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center', marginTop: SPACING.xxl, marginBottom: SPACING.base, borderWidth: 3, borderColor: COLORS.success },
  successIcon: { fontSize: 40 },
  title: { fontSize: FONTS.sizes.xxl, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', marginBottom: SPACING.sm },
  subtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.xl, lineHeight: 22 },
  card: { width: '100%', marginBottom: SPACING.base },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  label: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  value: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.text },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: FONTS.sizes.xs, fontWeight: '600' },
  slaBanner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: '#EFF6FF', borderRadius: 12, padding: SPACING.md, width: '100%', marginBottom: SPACING.xl, borderWidth: 1, borderColor: '#BFDBFE' },
  slaIcon: { fontSize: 24 },
  slaText: { flex: 1, fontSize: FONTS.sizes.sm, color: '#1E40AF' },
  btn: { width: '100%', marginBottom: SPACING.sm },
});

export default IssueSubmittedScreen;

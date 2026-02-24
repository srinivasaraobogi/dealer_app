import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button, Card } from '../../components/common';
import { COLORS, FONTS, SPACING } from '../../constants';
import { formatDate, formatCurrency } from '../../utils/helpers';

const ReturnSubmittedScreen = ({ navigation, route }) => {
  const { returnRequest } = route.params || {};

  const stages = [
    { label: 'Request Submitted', completed: true },
    { label: 'Supplier Approval', completed: false },
    { label: 'Ship Item', completed: false },
    { label: 'Refund Processed', completed: false },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📦</Text>
        </View>
        <Text style={styles.title}>Return Request Submitted</Text>
        <Text style={styles.subtitle}>Your return request has been submitted successfully.</Text>

        <Card style={styles.card}>
          <View style={styles.row}><Text style={styles.label}>Return ID</Text><Text style={styles.value}>{returnRequest?.returnId || 'RET-0000'}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Date</Text><Text style={styles.value}>{formatDate(returnRequest?.createdAt || new Date())}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Est. Refund</Text><Text style={[styles.value, { color: COLORS.success }]}>{formatCurrency(returnRequest?.totalRefundAmount || 0)}</Text></View>
          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusBadge}><Text style={styles.statusText}>Submitted</Text></View>
          </View>
        </Card>

        {/* Tracking */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Return Progress</Text>
          {stages.map((stage, idx) => (
            <View key={stage.label} style={styles.stageItem}>
              <View style={styles.stageLeft}>
                <View style={[styles.dot, stage.completed && styles.completedDot]}>
                  {stage.completed && <Text style={styles.check}>✓</Text>}
                </View>
                {idx < stages.length - 1 && <View style={[styles.line, stage.completed && styles.completedLine]} />}
              </View>
              <Text style={[styles.stageLabel, stage.completed && styles.completedLabel]}>{stage.label}</Text>
            </View>
          ))}
        </Card>

        <Button
          title="View Return Status"
          onPress={() => navigation.navigate('ReturnDetails', { returnId: returnRequest?.returnId || returnRequest?._id })}
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
  iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginTop: SPACING.xxl, marginBottom: SPACING.base, borderWidth: 3, borderColor: COLORS.primary },
  icon: { fontSize: 40 },
  title: { fontSize: FONTS.sizes.xxl, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', marginBottom: SPACING.sm },
  subtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.xl },
  card: { width: '100%', marginBottom: SPACING.base },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  label: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  value: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.text },
  statusBadge: { backgroundColor: COLORS.primary + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { color: COLORS.primary, fontSize: FONTS.sizes.xs, fontWeight: '600' },
  sectionTitle: { fontSize: FONTS.sizes.base, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.md },
  stageItem: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 40 },
  stageLeft: { alignItems: 'center', marginRight: SPACING.md, width: 24 },
  dot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  completedDot: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  check: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  line: { flex: 1, width: 2, backgroundColor: COLORS.border, marginTop: 4 },
  completedLine: { backgroundColor: COLORS.success },
  stageLabel: { flex: 1, fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, paddingBottom: SPACING.md },
  completedLabel: { color: COLORS.text, fontWeight: '500' },
  btn: { width: '100%', marginBottom: SPACING.sm },
});

export default ReturnSubmittedScreen;

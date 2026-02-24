import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { ScreenHeader } from '../../components/common/Header';
import { Button, Card, LoadingScreen } from '../../components/common';
import { COLORS, FONTS, SPACING, ISSUE_STATUS } from '../../constants';
import { issuesAPI } from '../../services/api';
import { formatDate, formatDateTime } from '../../utils/helpers';

const IssueStatusScreen = ({ navigation, route }) => {
  const { issueId } = route.params;
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadIssue(); }, [issueId]);

  const loadIssue = async () => {
    try {
      const res = await issuesAPI.getById(issueId);
      setIssue(res.data.data);
    } catch {} finally { setLoading(false); }
  };

  if (loading) return <LoadingScreen />;
  if (!issue) return null;

  const status = ISSUE_STATUS[issue.status] || { label: issue.status, color: '#999' };

  const timelineSteps = [
    { key: 'submitted', label: 'Report Submitted', completed: true },
    { key: 'review', label: 'Under Review', completed: ['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RESOLVED', 'CLOSED'].includes(issue.status) },
    { key: 'resolution', label: 'Resolution', completed: ['RESOLVED', 'CLOSED'].includes(issue.status) },
  ];

  return (
    <View style={styles.container}>
      <ScreenHeader title="Report Status" showBack />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Summary */}
        <Card>
          <View style={styles.issueHeader}>
            <View>
              <Text style={styles.issueId}>#{issue.issueId}</Text>
              <Text style={styles.filedDate}>Filed on {formatDate(issue.createdAt)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>

          {/* Timeline */}
          <View style={styles.timeline}>
            {timelineSteps.map((step, idx) => (
              <View key={step.key} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.dot, step.completed && styles.completedDot]}>
                    {step.completed && <Text style={styles.check}>✓</Text>}
                  </View>
                  {idx < timelineSteps.length - 1 && (
                    <View style={[styles.line, step.completed && styles.completedLine]} />
                  )}
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepLabel, step.completed && styles.completedLabel]}>{step.label}</Text>
                  {step.key === 'review' && issue.status === 'UNDER_REVIEW' && (
                    <Text style={styles.stepDesc}>Our support team is analyzing your claim.</Text>
                  )}
                  {step.key === 'resolution' && issue.resolution && (
                    <Text style={styles.stepDesc}>{issue.resolution.replace('_', ' ')}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Report Details */}
        <Card>
          <Text style={styles.sectionTitle}>Report Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Issue Type</Text>
            <Text style={styles.detailValue}>{issue.issueType?.replace('_', ' ')}</Text>
          </View>
          {issue.shipmentId && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Shipment ID</Text>
              <Text style={styles.detailValue}>{issue.shipmentId}</Text>
            </View>
          )}
          <Text style={styles.descLabel}>Description</Text>
          <Text style={styles.descText}>{issue.description}</Text>
        </Card>

        {/* Contact Support */}
        <Button
          title="💬 Contact Support"
          variant="outline"
          onPress={() => navigation.navigate('ContactSupport')}
          style={styles.contactBtn}
        />
        <Button
          title="Back to Orders"
          variant="ghost"
          onPress={() => navigation.navigate('OrderHistory')}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { padding: SPACING.base },
  issueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.base },
  issueId: { fontSize: FONTS.sizes.lg, fontWeight: 'bold', color: COLORS.text },
  filedDate: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 4 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: FONTS.sizes.sm, fontWeight: '600' },
  timeline: { marginTop: SPACING.sm },
  timelineItem: { flexDirection: 'row', minHeight: 50 },
  timelineLeft: { alignItems: 'center', marginRight: SPACING.md, width: 24 },
  dot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  completedDot: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  check: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  line: { flex: 1, width: 2, backgroundColor: COLORS.border, marginTop: 4 },
  completedLine: { backgroundColor: COLORS.success },
  stepContent: { flex: 1, paddingBottom: SPACING.md },
  stepLabel: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textSecondary },
  completedLabel: { color: COLORS.text },
  stepDesc: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: FONTS.sizes.base, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.md },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  detailLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  detailValue: { fontSize: FONTS.sizes.sm, fontWeight: '500', color: COLORS.text },
  descLabel: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.xs, marginTop: SPACING.sm },
  descText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, lineHeight: 20 },
  contactBtn: { marginBottom: SPACING.sm },
});

export default IssueStatusScreen;

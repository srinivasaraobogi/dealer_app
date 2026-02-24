import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { ScreenHeader } from '../../components/common/Header';
import { Button, Card, LoadingScreen } from '../../components/common';
import { COLORS, FONTS, SPACING, ISSUE_TYPES } from '../../constants';
import { issuesAPI, ordersAPI } from '../../services/api';
import { sanitizeInput } from '../../utils/helpers';

const ReportIssueScreen = ({ navigation, route }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => { loadOrder(); }, [orderId]);

  const loadOrder = async () => {
    try {
      const res = await ordersAPI.getById(orderId);
      setOrder(res.data.data);
    } catch {} finally { setLoading(false); }
  };

  const validate = () => {
    const e = {};
    if (!selectedIssue) e.issue = 'Please select an issue type';
    if (!description.trim() || description.trim().length < 10) e.description = 'Description must be at least 10 characters';
    if (description.trim().length > 1000) e.description = 'Description cannot exceed 1000 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await issuesAPI.create({
        orderId: order?._id || orderId,
        issueType: selectedIssue,
        description: sanitizeInput(description),
      });
      navigation.replace('IssueSubmitted', { issue: res.data.data });
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit report');
    } finally { setSubmitting(false); }
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Report Issue" subtitle={`Order #${order?.orderId}`} showBack />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Shipment Info */}
        {order?.trackingId && (
          <Card>
            <Text style={styles.sectionTitle}>Shipment Information</Text>
            <Text style={styles.infoText}>Shipment ID: {order.trackingId}</Text>
            <Text style={styles.infoText}>Carrier: {order.carrier || 'N/A'}</Text>
          </Card>
        )}

        {/* Issue Selection */}
        <Card>
          <Text style={styles.sectionTitle}>What's the issue?</Text>
          {errors.issue && <Text style={styles.error}>{errors.issue}</Text>}
          {ISSUE_TYPES.map(issue => (
            <TouchableOpacity
              key={issue.value}
              style={[styles.issueOption, selectedIssue === issue.value && styles.selectedIssue]}
              onPress={() => { setSelectedIssue(issue.value); setErrors(prev => ({ ...prev, issue: '' })); }}
            >
              <View style={[styles.radio, selectedIssue === issue.value && styles.radioSelected]} />
              <Text style={styles.issueLabel}>{issue.label}</Text>
            </TouchableOpacity>
          ))}
        </Card>

        {/* Description */}
        <Card>
          <Text style={styles.sectionTitle}>Additional Details</Text>
          <TextInput
            style={[styles.descInput, errors.description && styles.inputError]}
            value={description}
            onChangeText={(v) => { setDescription(v); setErrors(prev => ({ ...prev, description: '' })); }}
            placeholder="Describe the issue in detail (min 10 characters)..."
            placeholderTextColor={COLORS.textLight}
            multiline
            numberOfLines={5}
            maxLength={1000}
            textAlignVertical="top"
          />
          {errors.description && <Text style={styles.error}>{errors.description}</Text>}
          <Text style={styles.charCount}>{description.length}/1000</Text>
        </Card>

        {/* Photo Upload placeholder */}
        <Card>
          <Text style={styles.sectionTitle}>Upload Photos (Optional)</Text>
          <Text style={styles.photoNote}>Max 5 photos, 5MB each (JPG/PNG)</Text>
          <TouchableOpacity style={styles.uploadBtn}>
            <Text style={styles.uploadIcon}>📸</Text>
            <Text style={styles.uploadText}>Tap to add photos</Text>
          </TouchableOpacity>
        </Card>

        <Button
          title="Submit Report"
          onPress={handleSubmit}
          loading={submitting}
          style={styles.submitBtn}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { padding: SPACING.base },
  sectionTitle: { fontSize: FONTS.sizes.base, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.md },
  infoText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginBottom: SPACING.xs },
  issueOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, borderRadius: 8, gap: SPACING.md },
  selectedIssue: { backgroundColor: COLORS.primary + '08' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.border },
  radioSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  issueLabel: { fontSize: FONTS.sizes.base, color: COLORS.text },
  descInput: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, padding: SPACING.md, fontSize: FONTS.sizes.base, color: COLORS.text, minHeight: 120 },
  inputError: { borderColor: COLORS.danger },
  error: { color: COLORS.danger, fontSize: FONTS.sizes.xs, marginTop: 4 },
  charCount: { fontSize: FONTS.sizes.xs, color: COLORS.textLight, textAlign: 'right', marginTop: 4 },
  photoNote: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginBottom: SPACING.md },
  uploadBtn: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: COLORS.primary + '60', borderRadius: 10, padding: SPACING.xl, alignItems: 'center', gap: SPACING.sm },
  uploadIcon: { fontSize: 36 },
  uploadText: { color: COLORS.primary, fontWeight: '500' },
  submitBtn: { marginTop: SPACING.sm, marginBottom: SPACING.xxl },
});

export default ReportIssueScreen;

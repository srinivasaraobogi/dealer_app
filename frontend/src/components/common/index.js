import React from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, TextInput,
} from 'react-native';
import { COLORS, FONTS, SPACING } from '../../constants';

// Button Component
export const Button = ({
  title, onPress, variant = 'primary', disabled = false, loading = false, style, textStyle,
}) => {
  const variants = {
    primary: { bg: COLORS.primary, text: '#FFF' },
    secondary: { bg: COLORS.secondary, text: '#FFF' },
    outline: { bg: 'transparent', text: COLORS.primary, border: COLORS.primary },
    danger: { bg: COLORS.danger, text: '#FFF' },
    ghost: { bg: 'transparent', text: COLORS.text },
  };
  const v = variants[variant];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: v.bg, borderColor: v.border || 'transparent', borderWidth: v.border ? 1.5 : 0 },
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <Text style={[styles.buttonText, { color: v.text }, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

// Input Component
export const Input = ({
  label, value, onChangeText, placeholder, secureTextEntry = false,
  keyboardType = 'default', error, multiline = false, numberOfLines = 1,
  editable = true, style, inputStyle, rightIcon, maxLength,
}) => (
  <View style={[styles.inputContainer, style]}>
    {label && <Text style={styles.label}>{label}</Text>}
    <View style={[styles.inputWrapper, error && styles.inputError, !editable && styles.inputDisabled]}>
      <TextInput
        style={[styles.input, multiline && { height: numberOfLines * 40, textAlignVertical: 'top' }, inputStyle]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textLight}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        editable={editable}
        maxLength={maxLength}
      />
      {rightIcon && <View style={styles.inputRightIcon}>{rightIcon}</View>}
    </View>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

// Card Component
export const Card = ({ children, style, onPress }) => {
  if (onPress) {
    return (
      <TouchableOpacity style={[styles.card, style]} onPress={onPress}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
};

// Badge Component
export const Badge = ({ label, color = COLORS.primary, textColor = '#FFF', size = 'md' }) => (
  <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color }]}>
    <Text style={[styles.badgeText, { color }, size === 'sm' && { fontSize: FONTS.sizes.xs }]}>
      {label}
    </Text>
  </View>
);

// Empty State Component
export const EmptyState = ({ icon = '📭', title, subtitle, actionLabel, onAction }) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyIcon}>{icon}</Text>
    <Text style={styles.emptyTitle}>{title}</Text>
    {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
    {actionLabel && onAction && (
      <Button title={actionLabel} onPress={onAction} style={{ marginTop: SPACING.base }} />
    )}
  </View>
);

// Loading Component
export const LoadingScreen = ({ message = 'Loading...' }) => (
  <View style={styles.loading}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text style={styles.loadingText}>{message}</Text>
  </View>
);

// Divider
export const Divider = ({ style }) => <View style={[styles.divider, style]} />;

// Section Header
export const SectionHeader = ({ title, actionLabel, onAction }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {actionLabel && onAction && (
      <TouchableOpacity onPress={onAction}>
        <Text style={styles.sectionAction}>{actionLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// Status Badge
export const StatusBadge = ({ status, label, color }) => (
  <View style={[styles.statusBadge, { backgroundColor: color + '20' }]}>
    <View style={[styles.statusDot, { backgroundColor: color }]} />
    <Text style={[styles.statusText, { color }]}>{label}</Text>
  </View>
);

// Price Display
export const PriceDisplay = ({ price, oldPrice, size = 'md' }) => {
  const mainSize = size === 'lg' ? FONTS.sizes.xl : size === 'sm' ? FONTS.sizes.sm : FONTS.sizes.base;
  const oldSize = mainSize - 2;
  return (
    <View style={styles.priceContainer}>
      <Text style={[styles.price, { fontSize: mainSize }]}>${price?.toFixed(2)}</Text>
      {oldPrice && oldPrice > price && (
        <Text style={[styles.oldPrice, { fontSize: oldSize }]}>${oldPrice?.toFixed(2)}</Text>
      )}
    </View>
  );
};

// Success Banner
export const SuccessBanner = ({ message, visible }) => {
  if (!visible) return null;
  return (
    <View style={styles.successBanner}>
      <Text style={styles.successIcon}>✅</Text>
      <Text style={styles.successText}>{message}</Text>
    </View>
  );
};

// Info Row for detail screens
export const InfoRow = ({ label, value, valueStyle }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, valueStyle]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: SPACING.base,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  buttonText: { fontSize: FONTS.sizes.base, fontWeight: '600' },
  disabled: { opacity: 0.6 },

  inputContainer: { marginBottom: SPACING.md },
  label: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.xs },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: FONTS.sizes.base,
    color: COLORS.text,
  },
  inputError: { borderColor: COLORS.danger },
  inputDisabled: { backgroundColor: '#F5F5F5' },
  inputRightIcon: { marginLeft: SPACING.sm },
  errorText: { color: COLORS.danger, fontSize: FONTS.sizes.xs, marginTop: 4 },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.base,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },

  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: FONTS.sizes.xs, fontWeight: '600' },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  emptyIcon: { fontSize: 64, marginBottom: SPACING.base },
  emptyTitle: { fontSize: FONTS.sizes.xl, fontWeight: 'bold', color: COLORS.text, textAlign: 'center' },
  emptySubtitle: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.sm },

  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xxl },
  loadingText: { color: COLORS.textSecondary, marginTop: SPACING.sm },

  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: 'bold', color: COLORS.text },
  sectionAction: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '600' },

  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  statusText: { fontSize: FONTS.sizes.xs, fontWeight: '600' },

  priceContainer: { flexDirection: 'row', alignItems: 'baseline', gap: SPACING.xs },
  price: { fontWeight: 'bold', color: COLORS.text },
  oldPrice: { color: COLORS.textLight, textDecorationLine: 'line-through' },

  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  successIcon: { fontSize: 16 },
  successText: { color: '#065F46', fontSize: FONTS.sizes.sm, fontWeight: '500', flex: 1 },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  infoLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, flex: 1 },
  infoValue: { fontSize: FONTS.sizes.sm, color: COLORS.text, fontWeight: '500', flex: 1, textAlign: 'right' },
});

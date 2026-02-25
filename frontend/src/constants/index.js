export const API_BASE_URL = 'http://192.168.1.38:5000/api';

export const COLORS = {
  primary: '#1A73E8',
  primaryDark: '#1557B0',
  secondary: '#34A853',
  accent: '#FBBC04',
  danger: '#EA4335',
  warning: '#FF9800',
  background: '#F5F7FA',
  surface: '#FFFFFF',
  border: '#E0E0E0',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  success: '#34A853',
  error: '#EA4335',
  overlay: 'rgba(0,0,0,0.5)',
  // Status colors
  confirmed: '#F59E0B',
  shipped: '#3B82F6',
  delivered: '#10B981',
  cancelled: '#EF4444',
  pending: '#8B5CF6',
};

export const FONTS = {
  regular: 'System',
  bold: 'System',
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    title: 28,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const ORDER_STATUS = {
  PENDING: { label: 'Pending', color: '#8B5CF6' },
  CONFIRMED: { label: 'Confirmed', color: '#F59E0B' },
  SHIPPED: { label: 'Shipped', color: '#3B82F6' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: '#6366F1' },
  DELIVERED: { label: 'Delivered', color: '#10B981' },
  CANCELLED: { label: 'Cancelled', color: '#EF4444' },
  RETURNED: { label: 'Returned', color: '#F97316' },
};

export const RETURN_STATUS = {
  REQUEST_SUBMITTED: { label: 'Submitted', color: '#6B7280' },
  UNDER_REVIEW: { label: 'Under Review', color: '#3B82F6' },
  APPROVED: { label: 'Approved', color: '#10B981' },
  REJECTED: { label: 'Rejected', color: '#EF4444' },
  IN_TRANSIT: { label: 'In Transit', color: '#6366F1' },
  REFUND_PROCESSED: { label: 'Refund Processed', color: '#10B981' },
  CANCELLED: { label: 'Cancelled', color: '#9CA3AF' },
};

export const ISSUE_STATUS = {
  OPEN: { label: 'Open', color: '#6B7280' },
  UNDER_REVIEW: { label: 'Under Review', color: '#3B82F6' },
  AWAITING_INFO: { label: 'Awaiting Info', color: '#F59E0B' },
  APPROVED: { label: 'Approved', color: '#10B981' },
  REJECTED: { label: 'Rejected', color: '#EF4444' },
  RESOLVED: { label: 'Resolved', color: '#10B981' },
  CLOSED: { label: 'Closed', color: '#9CA3AF' },
};

export const CATEGORIES = ['ALL', 'TOOLS', 'ELECTRICAL', 'MECHANICAL', 'VALVES'];

export const CANCELLATION_REASONS = [
  { value: 'PLACED_BY_MISTAKE', label: 'Placed Order by mistake' },
  { value: 'BETTER_PRICE_ELSEWHERE', label: 'Found better price elsewhere' },
  { value: 'DELIVERY_TOO_LONG', label: 'Estimated delivery too long' },
  { value: 'ITEM_SPEC_ERROR', label: 'Item specification error' },
  { value: 'OTHER', label: 'Other' },
];

export const RETURN_REASONS = [
  { value: 'DEFECTIVE', label: 'Defective' },
  { value: 'DAMAGED', label: 'Damaged' },
  { value: 'WRONG_ITEM', label: 'Wrong Item' },
  { value: 'NOT_AS_DESCRIBED', label: 'Not as Described' },
  { value: 'QUALITY_ISSUE', label: 'Quality Issue' },
  { value: 'OTHER', label: 'Other' },
];

export const ISSUE_TYPES = [
  { value: 'PACKAGE_DAMAGED', label: 'Package damaged on arrival' },
  { value: 'ITEMS_MISSING', label: 'Items missing from package' },
  { value: 'WRONG_ITEMS', label: 'Wrong items received' },
  { value: 'SHIPMENT_NOT_ARRIVED', label: 'Shipment never arrived' },
  { value: 'OTHER', label: 'Other' },
];

export const PAYMENT_METHODS = [
  { value: 'NET_30', label: 'Net 30 Terms', icon: '🏦' },
  { value: 'CARD', label: 'Card', icon: '💳' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: '🏛️' },
  { value: 'UPI', label: 'UPI', icon: '📱' },
];

export const LANGUAGES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'te-IN', name: 'Telugu' },
  { code: 'ta-IN', name: 'Tamil' },
  { code: 'es-ES', name: 'Spanish' },
  { code: 'fr-FR', name: 'French' },
];

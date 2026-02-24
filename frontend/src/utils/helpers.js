export const formatCurrency = (amount, currency = 'USD') => {
  if (amount === null || amount === undefined) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateString, options = {}) => {
  if (!dateString) return '';
  const defaultOptions = { day: '2-digit', month: 'short', year: 'numeric', ...options };
  return new Date(dateString).toLocaleDateString('en-US', defaultOptions);
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const calculateDiscount = (oldPrice, newPrice) => {
  if (!oldPrice || oldPrice <= newPrice) return 0;
  return Math.round(((oldPrice - newPrice) / oldPrice) * 100);
};

export const getStockStatus = (stock, threshold = 10) => {
  if (stock === 0) return { label: 'Out of Stock', color: '#EF4444', canOrder: false };
  if (stock <= threshold) return { label: 'Low Stock', color: '#F59E0B', canOrder: true };
  return { label: 'In Stock', color: '#10B981', canOrder: true };
};

export const validateEmail = (email) => {
  return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
};

export const validateMobile = (mobile) => {
  return /^\d{10}$/.test(mobile);
};

export const validatePinCode = (pin) => {
  return /^\d{6}$/.test(pin);
};

export const validateIFSC = (ifsc) => {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc);
};

export const validatePAN = (pan) => {
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
};

export const validateGSTIN = (gstin) => {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin);
};

export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const sanitizeInput = (input) => {
  if (!input) return '';
  return input.replace(/[<>'"]/g, '').trim();
};

export const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

export const getInitials = (name) => {
  if (!name) return 'D';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

export const calculateTotal = (subtotal, taxRate = 0.18) => {
  const tax = subtotal * taxRate;
  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    taxAmount: parseFloat(tax.toFixed(2)),
    total: parseFloat((subtotal + tax).toFixed(2)),
    taxRate,
  };
};

export const formatPhoneForTel = (phone) => {
  return phone.replace(/[^+\d]/g, '');
};

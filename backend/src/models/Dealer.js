const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const dealerSchema = new mongoose.Schema({
  dealerId: {
    type: String,
    unique: true,
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Dealer name is required'],
    trim: true,
    maxlength: 150,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format'],
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false,
  },
  mobile: {
    type: String,
    match: [/^\d{10}$/, 'Mobile must be 10 digits'],
  },
  // Business Information
  companyName: { type: String, trim: true },
  gstin: {
    type: String,
    match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format'],
  },
  territory: { type: String },
  priceTier: {
    type: String,
    enum: ['TIER_1', 'TIER_2', 'TIER_3'],
    default: 'TIER_1',
  },
  dealerSince: { type: Date, default: Date.now },
  // Credit Information
  creditLimit: { type: Number, default: 0, min: 0 },
  outstandingAmount: { type: Number, default: 0, min: 0 },
  netTermsEnabled: { type: Boolean, default: false },
  creditPeriodDays: { type: Number, default: 30 },
  // Verification
  isVerified: { type: Boolean, default: false },
  verificationStatus: {
    type: String,
    enum: ['PENDING', 'VERIFIED', 'REJECTED'],
    default: 'PENDING',
  },
  // Contact Details
  address: { type: String, minlength: 10, maxlength: 250 },
  city: { type: String },
  state: { type: String },
  pinCode: { type: String, match: [/^\d{6}$/, 'PIN must be 6 digits'] },
  country: { type: String, default: 'India' },
  // Emergency Contact
  emergencyContactName: { type: String },
  emergencyContactNumber: { type: String },
  // Bank Information
  bankName: { type: String },
  accountNumber: { type: String },
  ifscCode: {
    type: String,
    match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC format'],
  },
  accountHolderName: { type: String },
  accountType: { type: String, enum: ['SAVINGS', 'CURRENT'] },
  panNumber: {
    type: String,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format'],
  },
  gstNumber: { type: String },
  // Delivery Location
  defaultDeliveryAddress: { type: String },
  defaultPinCode: { type: String },
  // Notification Preferences
  notificationPreferences: {
    orderConfirmation: { type: Boolean, default: true },
    shippingUpdates: { type: Boolean, default: true },
    deliveryNotifications: { type: Boolean, default: true },
    securityAlerts: { type: Boolean, default: true },
    paymentUpdates: { type: Boolean, default: true },
    specialOffers: { type: Boolean, default: true },
    newsletter: { type: Boolean, default: false },
  },
  // App Settings
  language: { type: String, default: 'en-US' },
  // Recently Viewed Products
  recentlyViewed: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    viewedAt: { type: Date, default: Date.now },
  }],
  // Profile Completion
  profileCompletion: { type: Number, default: 0, min: 0, max: 100 },
  // Account Status
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  refreshTokens: [{ type: String }],
}, {
  timestamps: true,
});

// Virtual for available credit
dealerSchema.virtual('availableCredit').get(function () {
  return Math.max(0, this.creditLimit - this.outstandingAmount);
});

// Pre-save hook to hash password
dealerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to compare password
dealerSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to calculate profile completion
dealerSchema.methods.calculateProfileCompletion = function () {
  const requiredFields = [
    'name', 'email', 'mobile', 'companyName', 'gstin',
    'address', 'city', 'state', 'pinCode',
    'bankName', 'accountNumber', 'ifscCode', 'accountHolderName', 'panNumber',
  ];
  const completed = requiredFields.filter(field => this[field]).length;
  this.profileCompletion = Math.round((completed / requiredFields.length) * 100);
  return this.profileCompletion;
};

dealerSchema.set('toJSON', { virtuals: true });
dealerSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Dealer', dealerSchema);

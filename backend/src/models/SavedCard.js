const mongoose = require('mongoose');

const savedCardSchema = new mongoose.Schema({
  dealerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true },
  cardToken: { type: String, required: true },
  cardBrand: { type: String, required: true },
  lastFourDigits: {
    type: String,
    required: true,
    match: [/^\d{4}$/, 'Must be 4 digits'],
  },
  expiryMonth: { type: String, required: true },
  expiryYear: { type: String, required: true },
  cardholderName: { type: String, required: true },
  nickname: {
    type: String,
    enum: ['PERSONAL', 'BUSINESS', 'OTHER'],
    default: 'PERSONAL',
  },
  isDefault: { type: Boolean, default: false },
  isExpired: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

savedCardSchema.index({ dealerId: 1 });

module.exports = mongoose.model('SavedCard', savedCardSchema);

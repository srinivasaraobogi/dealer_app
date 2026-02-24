const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  imageUrl: { type: String, required: true },
  discountPercentage: { type: Number, min: 0, max: 100 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  targetCategory: { type: String },
  offerCode: { type: String },
  sortOrder: { type: Number, default: 0 },
}, {
  timestamps: true,
});

bannerSchema.virtual('isCurrentlyActive').get(function () {
  const now = new Date();
  return this.isActive && now >= this.startDate && now <= this.endDate;
});

bannerSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Banner', bannerSchema);

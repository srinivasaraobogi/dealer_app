const mongoose = require('mongoose');

const specificationSchema = new mongoose.Schema({
  key: { type: String, required: true },
  value: { type: String, required: true },
  unit: { type: String },
}, { _id: false });

const productSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [150, 'Product name cannot exceed 150 characters'],
  },
  description: {
    type: String,
    maxlength: 5000,
  },
  category: {
    type: String,
    required: true,
    enum: ['ALL', 'TOOLS', 'ELECTRICAL', 'MECHANICAL', 'VALVES'],
    default: 'ALL',
  },
  images: [{
    url: { type: String, required: true },
    isPrimary: { type: Boolean, default: false },
  }],
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0.01, 'Price must be greater than 0'],
  },
  oldPrice: {
    type: Number,
    min: 0,
    validate: {
      validator: function (v) {
        return !v || v > this.price;
      },
      message: 'Old price must be greater than current price',
    },
  },
  moq: {
    type: Number,
    required: true,
    min: [1, 'MOQ must be greater than 0'],
    default: 1,
  },
  stock: {
    type: Number,
    required: true,
    min: [0, 'Stock cannot be negative'],
    default: 0,
  },
  stockThreshold: {
    type: Number,
    default: 10,
  },
  specifications: [specificationSchema],
  deliverySla: {
    type: String,
    default: 'Standard Shipping: 3–5 Business Days',
  },
  isActive: { type: Boolean, default: true },
  isHighlyDemanded: { type: Boolean, default: false },
  isPriceDrop: { type: Boolean, default: false },
  offerValidityDate: { type: Date },
  tags: [{ type: String }],
  orderCount: { type: Number, default: 0 },
}, {
  timestamps: true,
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function () {
  if (!this.oldPrice || this.oldPrice <= this.price) return 0;
  return Math.round(((this.oldPrice - this.price) / this.oldPrice) * 100);
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function () {
  if (this.stock === 0) return 'OUT_OF_STOCK';
  if (this.stock <= this.stockThreshold) return 'LOW_STOCK';
  return 'IN_STOCK';
});

productSchema.index({ name: 'text', sku: 'text', category: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ isHighlyDemanded: 1 });
productSchema.index({ isPriceDrop: 1 });

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);

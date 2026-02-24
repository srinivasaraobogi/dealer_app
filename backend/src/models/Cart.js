const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  sku: { type: String, required: true },
  name: { type: String, required: true },
  image: { type: String },
  unitPrice: { type: Number, required: true, min: 0 },
  moq: { type: Number, required: true, min: 1 },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
  },
  stock: { type: Number, required: true },
}, { _id: false });

cartItemSchema.virtual('lineTotal').get(function () {
  return this.unitPrice * this.quantity;
});

const cartSchema = new mongoose.Schema({
  dealerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dealer',
    required: true,
    unique: true,
  },
  items: [cartItemSchema],
  deliveryAddress: {
    label: { type: String },
    fullAddress: { type: String },
    city: { type: String },
    postalCode: { type: String },
    country: { type: String },
  },
}, {
  timestamps: true,
});

cartSchema.virtual('subtotal').get(function () {
  return this.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
});

cartSchema.virtual('itemCount').get(function () {
  return this.items.length;
});

cartSchema.set('toJSON', { virtuals: true });
cartSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Cart', cartSchema);

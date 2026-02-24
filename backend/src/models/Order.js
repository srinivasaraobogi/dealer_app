const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  sku: { type: String, required: true },
  name: { type: String, required: true },
  image: { type: String },
  unitPrice: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  moq: { type: Number, required: true },
  lineTotal: { type: Number, required: true },
}, { _id: false });

const timelineEventSchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  description: { type: String },
  location: { type: String },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    required: true,
  },
  dealerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dealer',
    required: true,
  },
  items: [orderItemSchema],
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED'],
    default: 'PENDING',
  },
  // Pricing
  subtotal: { type: Number, required: true, min: 0 },
  taxRate: { type: Number, default: 0.18 },
  taxAmount: { type: Number, required: true, min: 0 },
  shippingCost: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  // Payment
  paymentMethod: {
    type: String,
    enum: ['NET_30', 'CARD', 'BANK_TRANSFER', 'UPI', 'SPLIT', 'COD'],
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'],
    default: 'PENDING',
  },
  cardToken: { type: String },
  splitCreditAmount: { type: Number, default: 0 },
  splitPayNowAmount: { type: Number, default: 0 },
  dueDate: { type: Date },
  // Address (snapshot at order time)
  deliveryAddress: {
    label: { type: String },
    fullAddress: { type: String, required: true },
    city: { type: String },
    postalCode: { type: String },
    country: { type: String },
  },
  // Shipment
  trackingId: { type: String },
  carrier: { type: String },
  estimatedDeliveryStart: { type: Date },
  estimatedDeliveryEnd: { type: Date },
  actualDeliveryDate: { type: Date },
  driverName: { type: String },
  driverPhone: { type: String },
  // Timeline
  timeline: [timelineEventSchema],
  // Cancellation
  cancellationReason: { type: String },
  cancellationComment: { type: String },
  cancelledAt: { type: Date },
  // Invoice
  invoiceId: { type: String },
  invoiceUrl: { type: String },
  // Metadata
  isCancellable: { type: Boolean, default: true },
}, {
  timestamps: true,
});

orderSchema.index({ dealerId: 1, status: 1 });
orderSchema.index({ orderId: 1 });
orderSchema.index({ 'items.productId': 1 });

module.exports = mongoose.model('Order', orderSchema);

const mongoose = require('mongoose');

const returnItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  sku: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  reason: {
    type: String,
    enum: ['DEFECTIVE', 'DAMAGED', 'WRONG_ITEM', 'NOT_AS_DESCRIBED', 'QUALITY_ISSUE', 'OTHER'],
    required: true,
  },
  lineRefundAmount: { type: Number, required: true },
}, { _id: false });

const returnSchema = new mongoose.Schema({
  returnId: { type: String, unique: true, required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  dealerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true },
  items: [returnItemSchema],
  status: {
    type: String,
    enum: [
      'REQUEST_SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED',
      'IN_TRANSIT', 'REFUND_PROCESSED', 'CANCELLED',
    ],
    default: 'REQUEST_SUBMITTED',
  },
  totalRefundAmount: { type: Number, required: true },
  refundMethod: {
    type: String,
    enum: ['ORIGINAL_PAYMENT', 'BANK_TRANSFER'],
    required: true,
  },
  comments: { type: String, maxlength: 500 },
  photos: [{ type: String }],
  supplierApprovedAt: { type: Date },
  refundProcessedAt: { type: Date },
  timeline: [{
    status: { type: String },
    timestamp: { type: Date, default: Date.now },
    description: { type: String },
  }],
  cancelledAt: { type: Date },
}, {
  timestamps: true,
});

returnSchema.index({ dealerId: 1 });
returnSchema.index({ orderId: 1 });

module.exports = mongoose.model('Return', returnSchema);

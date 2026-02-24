const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, unique: true, required: true },
  dealerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  amount: { type: Number, required: true, min: 0 },
  method: {
    type: String,
    enum: ['UPI', 'CARD', 'BANK_TRANSFER', 'WIRE_TRANSFER', 'NET_30', 'COD'],
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED'],
    default: 'PENDING',
  },
  gatewayTransactionId: { type: String },
  gatewayResponse: { type: Object },
  idempotencyKey: { type: String, unique: true },
  failureReason: { type: String },
  processedAt: { type: Date },
}, {
  timestamps: true,
});

paymentSchema.index({ dealerId: 1 });
paymentSchema.index({ invoiceId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);

const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceId: { type: String, unique: true, required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  dealerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true },
  amount: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true },
  taxAmount: { type: Number, required: true },
  shippingCost: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['UNPAID', 'PAID', 'OVERDUE', 'DISPUTED', 'CANCELLED'],
    default: 'UNPAID',
  },
  dueDate: { type: Date, required: true },
  paidDate: { type: Date },
  paymentMethod: { type: String },
  paymentId: { type: String },
  isNet30: { type: Boolean, default: false },
  notes: { type: String },
}, {
  timestamps: true,
});

invoiceSchema.virtual('overdueDays').get(function () {
  if (this.status !== 'UNPAID' && this.status !== 'OVERDUE') return 0;
  const now = new Date();
  if (now <= this.dueDate) return 0;
  return Math.floor((now - this.dueDate) / (1000 * 60 * 60 * 24));
});

invoiceSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Invoice', invoiceSchema);

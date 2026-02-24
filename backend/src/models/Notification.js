const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  dealerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true },
  type: {
    type: String,
    enum: [
      'ORDER_CONFIRMATION', 'SHIPPING_UPDATE', 'DELIVERY_NOTIFICATION',
      'SECURITY_ALERT', 'PAYMENT_UPDATE', 'SPECIAL_OFFER', 'NEWSLETTER',
      'RETURN_UPDATE', 'ISSUE_UPDATE',
    ],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  data: { type: Object },
  readAt: { type: Date },
}, {
  timestamps: true,
});

notificationSchema.index({ dealerId: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);

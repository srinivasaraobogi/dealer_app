const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  issueId: { type: String, unique: true, required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  dealerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true },
  shipmentId: { type: String },
  carrier: { type: String },
  issueType: {
    type: String,
    enum: [
      'PACKAGE_DAMAGED', 'ITEMS_MISSING', 'WRONG_ITEMS',
      'SHIPMENT_NOT_ARRIVED', 'OTHER',
    ],
    required: true,
  },
  description: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 1000,
  },
  photos: [{ type: String }],
  status: {
    type: String,
    enum: ['OPEN', 'UNDER_REVIEW', 'AWAITING_INFO', 'APPROVED', 'REJECTED', 'RESOLVED', 'CLOSED'],
    default: 'OPEN',
  },
  resolution: {
    type: String,
    enum: ['REFUND_ISSUED', 'REPLACEMENT_SHIPPED', 'PARTIAL_CREDIT', 'CLAIM_DENIED'],
  },
  resolutionNotes: { type: String },
  slaHours: { type: Number, default: 48 },
  assignedTo: { type: String },
  timeline: [{
    status: { type: String },
    timestamp: { type: Date, default: Date.now },
    description: { type: String },
    updatedBy: { type: String },
  }],
  comments: [{
    authorId: { type: mongoose.Schema.Types.ObjectId },
    authorType: { type: String, enum: ['DEALER', 'SUPPORT'] },
    message: { type: String, required: true, maxlength: 2000 },
    createdAt: { type: Date, default: Date.now },
  }],
  resolvedAt: { type: Date },
}, {
  timestamps: true,
});

issueSchema.index({ dealerId: 1 });
issueSchema.index({ orderId: 1 });

module.exports = mongoose.model('Issue', issueSchema);

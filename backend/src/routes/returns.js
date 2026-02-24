const express = require('express');
const router = express.Router();
const Return = require('../models/Return');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

const generateReturnId = () => `RET-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

// @route   POST /api/returns
router.post('/', protect, async (req, res, next) => {
  try {
    const { orderId, items, comments, refundMethod } = req.body;

    if (!orderId || !items || items.length === 0 || !refundMethod) {
      return res.status(400).json({ success: false, message: 'orderId, items, and refundMethod required' });
    }

    const order = await Order.findOne({
      $or: [{ _id: orderId }, { orderId }],
      dealerId: req.dealer._id,
    });

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'DELIVERED') {
      return res.status(400).json({ success: false, message: 'Can only return delivered orders' });
    }

    const returnWindowDays = parseInt(process.env.RETURN_WINDOW_DAYS) || 7;
    const deliveryDate = order.actualDeliveryDate || order.updatedAt;
    const daysSinceDelivery = (Date.now() - new Date(deliveryDate).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceDelivery > returnWindowDays) {
      return res.status(400).json({ success: false, message: 'Return window has expired' });
    }

    // Validate items and calculate refund
    let totalRefundAmount = 0;
    const returnItems = [];

    for (const item of items) {
      const orderItem = order.items.find(oi => oi.sku === item.sku);
      if (!orderItem) {
        return res.status(400).json({ success: false, message: `Item ${item.sku} not in order` });
      }
      if (item.quantity > orderItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Return quantity for ${item.sku} exceeds ordered quantity`,
        });
      }
      const lineRefundAmount = parseFloat((orderItem.unitPrice * item.quantity).toFixed(2));
      totalRefundAmount += lineRefundAmount;
      returnItems.push({
        productId: orderItem.productId,
        sku: orderItem.sku,
        name: orderItem.name,
        quantity: item.quantity,
        unitPrice: orderItem.unitPrice,
        reason: item.reason,
        lineRefundAmount,
      });
    }

    const returnId = generateReturnId();
    const returnRequest = await Return.create({
      returnId,
      orderId: order._id,
      dealerId: req.dealer._id,
      items: returnItems,
      status: 'REQUEST_SUBMITTED',
      totalRefundAmount: parseFloat(totalRefundAmount.toFixed(2)),
      refundMethod,
      comments: comments || '',
      timeline: [
        { status: 'REQUEST_SUBMITTED', timestamp: new Date(), description: 'Return request submitted' },
      ],
    });

    order.status = 'RETURNED';
    await order.save();

    res.status(201).json({
      success: true,
      message: 'Return request submitted successfully',
      data: returnRequest,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/returns
router.get('/', protect, async (req, res, next) => {
  try {
    const returns = await Return.find({ dealerId: req.dealer._id })
      .populate('orderId', 'orderId createdAt')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: returns });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/returns/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const returnRequest = await Return.findOne({
      $or: [{ _id: req.params.id }, { returnId: req.params.id }],
      dealerId: req.dealer._id,
    }).populate('orderId', 'orderId createdAt total');

    if (!returnRequest) return res.status(404).json({ success: false, message: 'Return not found' });
    res.json({ success: true, data: returnRequest });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/returns/:id/cancel
router.post('/:id/cancel', protect, async (req, res, next) => {
  try {
    const returnRequest = await Return.findOne({
      $or: [{ _id: req.params.id }, { returnId: req.params.id }],
      dealerId: req.dealer._id,
    });

    if (!returnRequest) return res.status(404).json({ success: false, message: 'Return not found' });
    if (returnRequest.status !== 'REQUEST_SUBMITTED') {
      return res.status(400).json({ success: false, message: 'Return cannot be cancelled at this stage' });
    }

    returnRequest.status = 'CANCELLED';
    returnRequest.cancelledAt = new Date();
    returnRequest.timeline.push({
      status: 'CANCELLED',
      timestamp: new Date(),
      description: 'Return request cancelled by dealer',
    });
    await returnRequest.save();

    // Revert order status to DELIVERED
    await Order.findByIdAndUpdate(returnRequest.orderId, { status: 'DELIVERED' });

    res.json({ success: true, message: 'Return request cancelled', data: returnRequest });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Invoice = require('../models/Invoice');
const Dealer = require('../models/Dealer');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

const generateOrderId = () => `ORD-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
const generateInvoiceId = () => `INV-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

// @route   POST /api/orders
router.post('/', protect, async (req, res, next) => {
  try {
    const { paymentMethod, cardToken, splitPayNowAmount } = req.body;
    const dealer = await Dealer.findById(req.dealer._id);
    const cart = await Cart.findOne({ dealerId: req.dealer._id });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }
    if (!cart.deliveryAddress || !cart.deliveryAddress.fullAddress) {
      return res.status(400).json({ success: false, message: 'Delivery address is required' });
    }

    // Revalidate stock and prices
    for (const item of cart.items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({ success: false, message: `Product ${item.name} unavailable` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${item.name}` });
      }
      if (item.quantity < product.moq) {
        return res.status(400).json({
          success: false,
          message: `Minimum order quantity for ${item.name} is ${product.moq}`,
        });
      }
    }

    const taxRate = parseFloat(process.env.TAX_RATE) || 0.18;
    const subtotal = cart.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const taxAmount = parseFloat((subtotal * taxRate).toFixed(2));
    const total = parseFloat((subtotal + taxAmount).toFixed(2));

    // Credit validations
    const availableCredit = dealer.availableCredit;
    if (paymentMethod === 'NET_30') {
      if (!dealer.isVerified || !dealer.netTermsEnabled) {
        return res.status(400).json({ success: false, message: 'Not eligible for Net 30 terms' });
      }
      if (availableCredit < total) {
        return res.status(400).json({ success: false, message: 'Insufficient credit for Net 30' });
      }
    }

    if (paymentMethod === 'SPLIT') {
      if (!dealer.isVerified || !dealer.netTermsEnabled) {
        return res.status(400).json({ success: false, message: 'Not eligible for split payment' });
      }
      if (availableCredit <= 0) {
        return res.status(400).json({ success: false, message: 'No available credit for split payment' });
      }
    }

    // Build order items
    const orderItems = cart.items.map(item => ({
      productId: item.productId,
      sku: item.sku,
      name: item.name,
      image: item.image,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      moq: item.moq,
      lineTotal: parseFloat((item.unitPrice * item.quantity).toFixed(2)),
    }));

    // Create order
    const orderId = generateOrderId();
    const dueDate = paymentMethod === 'NET_30' || paymentMethod === 'SPLIT'
      ? new Date(Date.now() + (dealer.creditPeriodDays || 30) * 24 * 60 * 60 * 1000)
      : null;

    const order = await Order.create({
      orderId,
      dealerId: dealer._id,
      items: orderItems,
      status: 'CONFIRMED',
      subtotal: parseFloat(subtotal.toFixed(2)),
      taxRate,
      taxAmount,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === 'NET_30' ? 'PENDING' : 'COMPLETED',
      cardToken: cardToken || null,
      splitCreditAmount: paymentMethod === 'SPLIT' ? availableCredit : 0,
      splitPayNowAmount: paymentMethod === 'SPLIT' ? total - availableCredit : 0,
      dueDate,
      deliveryAddress: cart.deliveryAddress,
      timeline: [
        { status: 'CONFIRMED', timestamp: new Date(), description: 'Order confirmed' },
      ],
      isCancellable: true,
    });

    // Create invoice for Net30 orders
    if (paymentMethod === 'NET_30' || paymentMethod === 'SPLIT') {
      const invoiceId = generateInvoiceId();
      const invoiceAmount = paymentMethod === 'SPLIT' ? availableCredit : total;
      await Invoice.create({
        invoiceId,
        orderId: order._id,
        dealerId: dealer._id,
        amount: invoiceAmount,
        subtotal: parseFloat(subtotal.toFixed(2)),
        taxAmount,
        status: 'UNPAID',
        dueDate,
        isNet30: true,
      });

      // Update dealer outstanding
      dealer.outstandingAmount = (dealer.outstandingAmount || 0) + invoiceAmount;
      await dealer.save({ validateBeforeSave: false });
    }

    // Deduct stock
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity, orderCount: item.quantity },
      });
    }

    // Clear cart
    await Cart.findOneAndUpdate({ dealerId: dealer._id }, { items: [] });

    order.invoiceId = order.orderId.replace('ORD-', 'INV-');
    await order.save();

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/orders
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { dealerId: req.dealer._id };
    if (status && status !== 'ALL') query.status = status.toUpperCase();

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: { orders, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/orders/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const order = await Order.findOne({
      $or: [{ _id: req.params.id }, { orderId: req.params.id }],
      dealerId: req.dealer._id,
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/orders/:id/cancel
router.post('/:id/cancel', protect, async (req, res, next) => {
  try {
    const { reason, comment } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: 'Cancellation reason required' });

    const validReasons = [
      'PLACED_BY_MISTAKE', 'BETTER_PRICE_ELSEWHERE',
      'DELIVERY_TOO_LONG', 'ITEM_SPEC_ERROR', 'OTHER',
    ];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ success: false, message: 'Invalid cancellation reason' });
    }

    const order = await Order.findOne({
      $or: [{ _id: req.params.id }, { orderId: req.params.id }],
      dealerId: req.dealer._id,
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled' });
    }

    order.status = 'CANCELLED';
    order.cancellationReason = reason;
    order.cancellationComment = comment || '';
    order.cancelledAt = new Date();
    order.isCancellable = false;
    order.timeline.push({ status: 'CANCELLED', timestamp: new Date(), description: `Cancelled: ${reason}` });
    await order.save();

    // Reverse stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity, orderCount: -item.quantity },
      });
    }

    // Reverse credit if Net30
    if (order.paymentMethod === 'NET_30' || order.paymentMethod === 'SPLIT') {
      const dealer = await Dealer.findById(req.dealer._id);
      const creditReverse = order.paymentMethod === 'SPLIT' ? order.splitCreditAmount : order.total;
      dealer.outstandingAmount = Math.max(0, dealer.outstandingAmount - creditReverse);
      await dealer.save({ validateBeforeSave: false });

      // Mark invoice cancelled
      await Invoice.findOneAndUpdate({ orderId: order._id }, { status: 'CANCELLED' });
    }

    res.json({ success: true, message: 'Order cancelled successfully', data: order });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/orders/:id/tracking
router.get('/:id/tracking', protect, async (req, res, next) => {
  try {
    const order = await Order.findOne({
      $or: [{ _id: req.params.id }, { orderId: req.params.id }],
      dealerId: req.dealer._id,
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!order.trackingId) {
      return res.status(400).json({ success: false, message: 'No tracking information available' });
    }

    res.json({
      success: true,
      data: {
        trackingId: order.trackingId,
        carrier: order.carrier,
        estimatedDeliveryStart: order.estimatedDeliveryStart,
        estimatedDeliveryEnd: order.estimatedDeliveryEnd,
        driverName: order.driverName,
        driverPhone: order.driverPhone,
        timeline: order.timeline,
        status: order.status,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/orders/:id/invoice
router.get('/:id/invoice', protect, async (req, res, next) => {
  try {
    const order = await Order.findOne({
      $or: [{ _id: req.params.id }, { orderId: req.params.id }],
      dealerId: req.dealer._id,
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({
      success: true,
      data: {
        invoiceId: order.invoiceId || order.orderId,
        order,
        message: 'Invoice data retrieved',
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/orders/:id/reorder
router.post('/:id/reorder', protect, async (req, res, next) => {
  try {
    const order = await Order.findOne({
      $or: [{ _id: req.params.id }, { orderId: req.params.id }],
      dealerId: req.dealer._id,
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    let cart = await Cart.findOne({ dealerId: req.dealer._id });
    if (!cart) cart = await Cart.create({ dealerId: req.dealer._id, items: [] });

    const addedItems = [];
    const unavailableItems = [];

    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive || product.stock < item.moq) {
        unavailableItems.push(item.name);
        continue;
      }

      const existing = cart.items.find(ci => ci.productId.toString() === item.productId.toString());
      if (existing) {
        existing.quantity += item.quantity;
        existing.unitPrice = product.price;
        existing.stock = product.stock;
      } else {
        const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
        cart.items.push({
          productId: product._id,
          sku: product.sku,
          name: product.name,
          image: primaryImage ? primaryImage.url : null,
          unitPrice: product.price,
          moq: product.moq,
          quantity: item.quantity,
          stock: product.stock,
        });
      }
      addedItems.push(item.name);
    }

    await cart.save();
    res.json({
      success: true,
      message: 'Items added to cart for reorder',
      data: { addedItems, unavailableItems, cartItemCount: cart.items.length },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

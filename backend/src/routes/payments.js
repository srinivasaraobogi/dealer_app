const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Dealer = require('../models/Dealer');
const SavedCard = require('../models/SavedCard');
const { protect } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const generatePaymentId = () => `PAY-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

// @route   GET /api/payments/summary
router.get('/summary', protect, async (req, res, next) => {
  try {
    const dealer = await Dealer.findById(req.dealer._id);
    const unpaidInvoices = await Invoice.find({
      dealerId: req.dealer._id,
      status: { $in: ['UNPAID', 'OVERDUE'] },
    }).sort({ dueDate: 1 });

    const paymentHistory = await Payment.find({ dealerId: req.dealer._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      data: {
        creditSummary: {
          creditLimit: dealer.creditLimit,
          outstandingAmount: dealer.outstandingAmount,
          availableCredit: dealer.availableCredit,
          creditPeriodDays: dealer.creditPeriodDays,
        },
        unpaidInvoices,
        paymentHistory,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/payments/invoices
router.get('/invoices', protect, async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { dealerId: req.dealer._id };
    if (status) query.status = status.toUpperCase();

    const invoices = await Invoice.find(query)
      .populate('orderId', 'orderId')
      .sort({ dueDate: 1 });

    res.json({ success: true, data: invoices });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/payments/pay
router.post('/pay', protect, async (req, res, next) => {
  try {
    const { invoiceId, paymentMethod } = req.body;
    if (!invoiceId || !paymentMethod) {
      return res.status(400).json({ success: false, message: 'invoiceId and paymentMethod required' });
    }

    const invoice = await Invoice.findOne({
      $or: [{ _id: invoiceId }, { invoiceId }],
      dealerId: req.dealer._id,
    });

    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (invoice.status !== 'UNPAID' && invoice.status !== 'OVERDUE') {
      return res.status(400).json({ success: false, message: 'Invoice is already paid' });
    }

    const idempotencyKey = uuidv4();
    const paymentId = generatePaymentId();

    const payment = await Payment.create({
      paymentId,
      dealerId: req.dealer._id,
      invoiceId: invoice._id,
      orderId: invoice.orderId,
      amount: invoice.amount,
      method: paymentMethod,
      status: 'COMPLETED',
      idempotencyKey,
      processedAt: new Date(),
    });

    invoice.status = 'PAID';
    invoice.paidDate = new Date();
    invoice.paymentMethod = paymentMethod;
    invoice.paymentId = paymentId;
    await invoice.save();

    // Update dealer outstanding
    const dealer = await Dealer.findById(req.dealer._id);
    dealer.outstandingAmount = Math.max(0, dealer.outstandingAmount - invoice.amount);
    await dealer.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: { payment, updatedCredit: dealer.availableCredit },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/payments/cards
router.get('/cards', protect, async (req, res, next) => {
  try {
    const cards = await SavedCard.find({ dealerId: req.dealer._id, isActive: true });
    res.json({ success: true, data: cards });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/payments/cards
router.post('/cards', protect, async (req, res, next) => {
  try {
    const { cardToken, cardBrand, lastFourDigits, expiryMonth, expiryYear, cardholderName, nickname } = req.body;

    if (!cardToken || !cardBrand || !lastFourDigits || !expiryMonth || !expiryYear || !cardholderName) {
      return res.status(400).json({ success: false, message: 'All card fields required' });
    }

    if (!/^\d{4}$/.test(lastFourDigits)) {
      return res.status(400).json({ success: false, message: 'Invalid last four digits' });
    }

    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    const expYear = parseInt(expiryYear);
    const expMonth = parseInt(expiryMonth);

    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      return res.status(400).json({ success: false, message: 'Card has expired' });
    }

    const existingCards = await SavedCard.countDocuments({ dealerId: req.dealer._id, isActive: true });
    const isDefault = existingCards === 0;

    if (isDefault) {
      await SavedCard.updateMany({ dealerId: req.dealer._id }, { isDefault: false });
    }

    const card = await SavedCard.create({
      dealerId: req.dealer._id,
      cardToken,
      cardBrand,
      lastFourDigits,
      expiryMonth,
      expiryYear,
      cardholderName,
      nickname: nickname || 'PERSONAL',
      isDefault,
    });

    res.status(201).json({ success: true, message: 'Card saved', data: card });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/payments/cards/:id
router.delete('/cards/:id', protect, async (req, res, next) => {
  try {
    const card = await SavedCard.findOne({ _id: req.params.id, dealerId: req.dealer._id });
    if (!card) return res.status(404).json({ success: false, message: 'Card not found' });

    card.isActive = false;
    await card.save();

    if (card.isDefault) {
      const nextCard = await SavedCard.findOne({ dealerId: req.dealer._id, isActive: true });
      if (nextCard) {
        nextCard.isDefault = true;
        await nextCard.save();
      }
    }

    res.json({ success: true, message: 'Card removed' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

const generateIssueId = () => `RPT-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

// @route   POST /api/issues
router.post('/', protect, async (req, res, next) => {
  try {
    const { orderId, issueType, description, photos } = req.body;

    if (!orderId || !issueType || !description) {
      return res.status(400).json({ success: false, message: 'orderId, issueType, description required' });
    }
    if (description.length < 10) {
      return res.status(400).json({ success: false, message: 'Description must be at least 10 characters' });
    }
    if (description.length > 1000) {
      return res.status(400).json({ success: false, message: 'Description cannot exceed 1000 characters' });
    }

    const order = await Order.findOne({
      $or: [{ _id: orderId }, { orderId }],
      dealerId: req.dealer._id,
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Cannot report issue for cancelled order' });
    }

    const issueId = generateIssueId();
    const issue = await Issue.create({
      issueId,
      orderId: order._id,
      dealerId: req.dealer._id,
      shipmentId: order.trackingId,
      carrier: order.carrier,
      issueType,
      description,
      photos: photos || [],
      status: 'OPEN',
      timeline: [
        { status: 'OPEN', timestamp: new Date(), description: 'Issue reported by dealer' },
        { status: 'UNDER_REVIEW', timestamp: new Date(), description: 'Assigned to support team' },
      ],
    });

    // Auto-transition to UNDER_REVIEW
    issue.status = 'UNDER_REVIEW';
    await issue.save();

    res.status(201).json({
      success: true,
      message: 'Issue reported successfully',
      data: issue,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/issues
router.get('/', protect, async (req, res, next) => {
  try {
    const issues = await Issue.find({ dealerId: req.dealer._id })
      .populate('orderId', 'orderId createdAt')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: issues });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/issues/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const issue = await Issue.findOne({
      $or: [{ _id: req.params.id }, { issueId: req.params.id }],
      dealerId: req.dealer._id,
    }).populate('orderId', 'orderId createdAt items total');

    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });
    res.json({ success: true, data: issue });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/issues/:id/comments
router.post('/:id/comments', protect, async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Comment message required' });
    }

    const issue = await Issue.findOne({
      $or: [{ _id: req.params.id }, { issueId: req.params.id }],
      dealerId: req.dealer._id,
    });
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });
    if (issue.status === 'CLOSED') {
      return res.status(400).json({ success: false, message: 'Cannot add comments to closed issue' });
    }

    issue.comments.push({
      authorId: req.dealer._id,
      authorType: 'DEALER',
      message: message.trim(),
      createdAt: new Date(),
    });
    await issue.save();

    res.json({ success: true, message: 'Comment added', data: issue });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

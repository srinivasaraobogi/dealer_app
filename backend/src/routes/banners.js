const express = require('express');
const router = express.Router();
const Banner = require('../models/Banner');
const { protect } = require('../middleware/auth');

// @route   GET /api/banners
router.get('/', protect, async (req, res, next) => {
  try {
    const now = new Date();
    const banners = await Banner.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).sort({ sortOrder: 1, createdAt: -1 });

    res.json({ success: true, data: banners });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

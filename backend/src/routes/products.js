const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

// @route   GET /api/products
router.get('/', protect, async (req, res, next) => {
  try {
    const {
      search, category, minPrice, maxPrice, moq, discount,
      stockAvailable, sort = 'popular', page = 1, limit = 20,
    } = req.query;

    const query = { isActive: true };

    if (category && category !== 'ALL') {
      query.category = category.toUpperCase();
    }

    if (search && search.length >= 2) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    if (moq) query.moq = { $gte: parseInt(moq) };
    if (discount === 'true') query.oldPrice = { $exists: true, $gt: 0 };
    if (stockAvailable === 'true') query.stock = { $gt: 0 };

    const sortOptions = {
      popular: { orderCount: -1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      newest: { createdAt: -1 },
      discount: { oldPrice: -1 },
    };
    const sortBy = sortOptions[sort] || sortOptions.popular;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query).sort(sortBy).skip(skip).limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        products,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/products/highly-demanded
router.get('/highly-demanded', protect, async (req, res, next) => {
  try {
    const products = await Product.find({ isHighlyDemanded: true, isActive: true })
      .sort({ orderCount: -1 })
      .limit(10);
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/products/price-drop
router.get('/price-drop', protect, async (req, res, next) => {
  try {
    const now = new Date();
    const products = await Product.find({
      isPriceDrop: true,
      isActive: true,
      $or: [
        { offerValidityDate: { $gte: now } },
        { offerValidityDate: null },
      ],
    }).sort({ createdAt: -1 }).limit(10);
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/products/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Add to recently viewed
    const dealer = req.dealer;
    const alreadyViewed = dealer.recentlyViewed.find(
      rv => rv.productId.toString() === product._id.toString()
    );
    if (!alreadyViewed) {
      dealer.recentlyViewed.unshift({ productId: product._id, viewedAt: new Date() });
      if (dealer.recentlyViewed.length > 10) dealer.recentlyViewed.pop();
      await dealer.save({ validateBeforeSave: false });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/products/recently-viewed
router.get('/user/recently-viewed', protect, async (req, res, next) => {
  try {
    const dealer = await require('../models/Dealer').findById(req.dealer._id)
      .populate('recentlyViewed.productId');

    const products = dealer.recentlyViewed
      .filter(rv => rv.productId && rv.productId.isActive)
      .slice(0, 10)
      .map(rv => rv.productId);

    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const Dealer = require('../models/Dealer');
const { protect } = require('../middleware/auth');

const generateTokens = (id) => {
  const accessToken = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  const refreshToken = jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  });
  return { accessToken, refreshToken };
};

// @route   POST /api/auth/register
router.post('/register', [
  body('name').notEmpty().trim().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  body('mobile').matches(/^\d{10}$/).withMessage('Mobile must be 10 digits'),
  body('companyName').notEmpty().withMessage('Company name is required'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, mobile, companyName } = req.body;
    const existing = await Dealer.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const dealerId = `DLR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const dealer = await Dealer.create({ name, email, password, mobile, companyName, dealerId });

    const { accessToken, refreshToken } = generateTokens(dealer._id);
    dealer.refreshTokens = [refreshToken];
    dealer.lastLogin = new Date();
    await dealer.save({ validateBeforeSave: false });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        accessToken,
        refreshToken,
        dealer: {
          id: dealer._id,
          dealerId: dealer.dealerId,
          name: dealer.name,
          email: dealer.email,
          companyName: dealer.companyName,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;
    const dealer = await Dealer.findOne({ email }).select('+password');
    if (!dealer) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!dealer.isActive) {
      return res.status(401).json({ success: false, message: 'Account deactivated' });
    }

    const isMatch = await dealer.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(dealer._id);
    dealer.refreshTokens = [...(dealer.refreshTokens || []).slice(-4), refreshToken];
    dealer.lastLogin = new Date();
    await dealer.save({ validateBeforeSave: false });

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        dealer: {
          id: dealer._id,
          dealerId: dealer.dealerId,
          name: dealer.name,
          email: dealer.email,
          companyName: dealer.companyName,
          creditLimit: dealer.creditLimit,
          availableCredit: dealer.availableCredit,
          isVerified: dealer.isVerified,
          notificationPreferences: dealer.notificationPreferences,
          language: dealer.language,
          profileCompletion: dealer.profileCompletion,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const dealer = await Dealer.findById(decoded.id).select('+refreshTokens');
    if (!dealer || !dealer.refreshTokens.includes(refreshToken)) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const tokens = generateTokens(dealer._id);
    dealer.refreshTokens = dealer.refreshTokens.filter(t => t !== refreshToken);
    dealer.refreshTokens.push(tokens.refreshToken);
    await dealer.save({ validateBeforeSave: false });

    res.json({ success: true, data: tokens });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/logout
router.post('/logout', protect, async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const dealer = await Dealer.findById(req.dealer._id).select('+refreshTokens');
    if (dealer) {
      dealer.refreshTokens = dealer.refreshTokens.filter(t => t !== refreshToken);
      await dealer.save({ validateBeforeSave: false });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  const dealer = await Dealer.findById(req.dealer._id).select('-password -refreshTokens');
  res.json({ success: true, data: dealer });
});

module.exports = router;

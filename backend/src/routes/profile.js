const express = require('express');
const router = express.Router();
const Dealer = require('../models/Dealer');
const { protect } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// @route   GET /api/profile
router.get('/', protect, async (req, res, next) => {
  try {
    const dealer = await Dealer.findById(req.dealer._id).select('-password -refreshTokens');
    dealer.calculateProfileCompletion();
    await dealer.save({ validateBeforeSave: false });
    res.json({ success: true, data: dealer });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/profile/contact
router.put('/contact', protect, [
  body('email').isEmail().withMessage('Valid email required'),
  body('mobile').matches(/^\d{10}$/).withMessage('Mobile must be 10 digits'),
  body('address').isLength({ min: 10, max: 250 }).withMessage('Address must be 10-250 characters'),
  body('city').notEmpty().withMessage('City required'),
  body('state').notEmpty().withMessage('State required'),
  body('pinCode').matches(/^\d{6}$/).withMessage('PIN must be 6 digits'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, mobile, address, city, state, pinCode, emergencyContactName, emergencyContactNumber } = req.body;

    if (emergencyContactNumber && emergencyContactNumber === mobile) {
      return res.status(400).json({
        success: false,
        message: 'Emergency number cannot be same as primary mobile',
      });
    }

    const dealer = await Dealer.findByIdAndUpdate(
      req.dealer._id,
      {
        email, mobile, address, city, state, pinCode,
        emergencyContactName: emergencyContactName || '',
        emergencyContactNumber: emergencyContactNumber || '',
      },
      { new: true, runValidators: true }
    ).select('-password -refreshTokens');

    dealer.calculateProfileCompletion();
    await dealer.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Contact details updated', data: dealer });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/profile/bank
router.put('/bank', protect, [
  body('bankName').notEmpty().withMessage('Bank name required'),
  body('accountNumber').matches(/^\d{9,18}$/).withMessage('Account number must be 9-18 digits'),
  body('confirmAccountNumber').custom((value, { req }) => {
    if (value !== req.body.accountNumber) throw new Error('Account numbers do not match');
    return true;
  }),
  body('ifscCode').matches(/^[A-Z]{4}0[A-Z0-9]{6}$/).withMessage('Invalid IFSC format'),
  body('accountHolderName').notEmpty().withMessage('Account holder name required'),
  body('accountType').isIn(['SAVINGS', 'CURRENT']).withMessage('Invalid account type'),
  body('panNumber').matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).withMessage('Invalid PAN format'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { bankName, accountNumber, ifscCode, accountHolderName, accountType, panNumber, gstNumber } = req.body;

    const dealer = await Dealer.findByIdAndUpdate(
      req.dealer._id,
      { bankName, accountNumber, ifscCode, accountHolderName, accountType, panNumber, gstNumber: gstNumber || '' },
      { new: true, runValidators: true }
    ).select('-password -refreshTokens');

    dealer.calculateProfileCompletion();
    await dealer.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Bank information updated', data: dealer });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/profile/password
router.put('/password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  body('confirmNewPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) throw new Error('Passwords do not match');
    return true;
  }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const dealer = await Dealer.findById(req.dealer._id).select('+password');

    const isMatch = await dealer.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    dealer.password = newPassword;
    dealer.refreshTokens = [];
    await dealer.save();

    res.json({ success: true, message: 'Password updated successfully. Please login again.' });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/profile/notifications
router.put('/notifications', protect, async (req, res, next) => {
  try {
    const allowed = [
      'orderConfirmation', 'shippingUpdates', 'deliveryNotifications',
      'securityAlerts', 'paymentUpdates', 'specialOffers', 'newsletter',
    ];

    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[`notificationPreferences.${key}`] = Boolean(req.body[key]);
      }
    }

    const dealer = await Dealer.findByIdAndUpdate(
      req.dealer._id,
      { $set: updates },
      { new: true }
    ).select('notificationPreferences');

    res.json({
      success: true,
      message: 'Notification preferences updated',
      data: dealer.notificationPreferences,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/profile/language
router.put('/language', protect, async (req, res, next) => {
  try {
    const { language } = req.body;
    const supportedLanguages = ['en-US', 'hi-IN', 'te-IN', 'ta-IN', 'es-ES', 'fr-FR'];

    if (!language || !supportedLanguages.includes(language)) {
      return res.status(400).json({ success: false, message: 'Unsupported language' });
    }

    await Dealer.findByIdAndUpdate(req.dealer._id, { language });
    res.json({ success: true, message: 'Language preference updated', data: { language } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

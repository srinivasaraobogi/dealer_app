const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// @route   GET /api/support/config
router.get('/config', protect, async (req, res) => {
  res.json({
    success: true,
    data: {
      phone: process.env.SUPPORT_PHONE || '+91-9999999999',
      email: process.env.SUPPORT_EMAIL || 'support@dealerapp.com',
      availability: '24/7',
      supportOptions: ['CALL', 'EMAIL', 'CHAT', 'TICKET'],
    },
  });
});

module.exports = router;

const jwt = require('jsonwebtoken');
const Dealer = require('../models/Dealer');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const dealer = await Dealer.findById(decoded.id).select('-password -refreshTokens');

    if (!dealer) {
      return res.status(401).json({ success: false, message: 'Dealer not found' });
    }

    if (!dealer.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    req.dealer = dealer;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    next(error);
  }
};

module.exports = { protect };

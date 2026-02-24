const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

// @route   GET /api/cart
router.get('/', protect, async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ dealerId: req.dealer._id })
      .populate('items.productId', 'name sku images stock price');

    if (!cart) {
      cart = await Cart.create({ dealerId: req.dealer._id, items: [] });
    }

    const taxRate = parseFloat(process.env.TAX_RATE) || 0.18;
    const subtotal = cart.subtotal;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    res.json({
      success: true,
      data: {
        cart,
        pricing: {
          subtotal: parseFloat(subtotal.toFixed(2)),
          taxRate,
          taxAmount: parseFloat(taxAmount.toFixed(2)),
          total: parseFloat(total.toFixed(2)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/cart/add
router.post('/add', protect, async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId || !quantity) {
      return res.status(400).json({ success: false, message: 'productId and quantity required' });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (quantity < product.moq) {
      return res.status(400).json({
        success: false,
        message: `Minimum order quantity is ${product.moq}`,
      });
    }

    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} units available`,
      });
    }

    if (product.stock === 0) {
      return res.status(400).json({ success: false, message: 'Product is out of stock' });
    }

    let cart = await Cart.findOne({ dealerId: req.dealer._id });
    if (!cart) cart = await Cart.create({ dealerId: req.dealer._id, items: [] });

    const existingItem = cart.items.find(
      item => item.productId.toString() === productId
    );

    if (existingItem) {
      if (existingItem.quantity + quantity > product.stock) {
        return res.status(400).json({ success: false, message: 'Insufficient stock' });
      }
      existingItem.quantity += quantity;
    } else {
      const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
      cart.items.push({
        productId: product._id,
        sku: product.sku,
        name: product.name,
        image: primaryImage ? primaryImage.url : null,
        unitPrice: product.price,
        moq: product.moq,
        quantity,
        stock: product.stock,
      });
    }

    await cart.save();

    res.json({ success: true, message: 'Item added to cart', data: { itemCount: cart.items.length } });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/cart/update/:productId
router.put('/update/:productId', protect, async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ dealerId: req.dealer._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const item = cart.items.find(i => i.productId.toString() === req.params.productId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not in cart' });

    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    if (quantity < item.moq) {
      return res.status(400).json({
        success: false,
        message: `Minimum order quantity is ${item.moq}`,
      });
    }
    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock',
      });
    }

    item.quantity = quantity;
    item.stock = product.stock;
    item.unitPrice = product.price;
    await cart.save();

    const taxRate = parseFloat(process.env.TAX_RATE) || 0.18;
    const subtotal = cart.subtotal;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    res.json({
      success: true,
      message: 'Cart updated',
      data: {
        cart,
        pricing: {
          subtotal: parseFloat(subtotal.toFixed(2)),
          taxRate,
          taxAmount: parseFloat(taxAmount.toFixed(2)),
          total: parseFloat(total.toFixed(2)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/cart/remove/:productId
router.delete('/remove/:productId', protect, async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ dealerId: req.dealer._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    cart.items = cart.items.filter(
      item => item.productId.toString() !== req.params.productId
    );
    await cart.save();

    res.json({ success: true, message: 'Item removed from cart', data: { itemCount: cart.items.length } });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/cart/clear
router.delete('/clear', protect, async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate(
      { dealerId: req.dealer._id },
      { items: [] },
      { new: true }
    );
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/cart/address
router.put('/address', protect, async (req, res, next) => {
  try {
    const { label, fullAddress, city, postalCode, country } = req.body;
    if (!fullAddress || fullAddress.length < 10) {
      return res.status(400).json({ success: false, message: 'Address must be at least 10 characters' });
    }
    if (fullAddress.length > 250) {
      return res.status(400).json({ success: false, message: 'Address too long (max 250 characters)' });
    }

    const cart = await Cart.findOneAndUpdate(
      { dealerId: req.dealer._id },
      { deliveryAddress: { label, fullAddress, city, postalCode, country } },
      { new: true, upsert: true }
    );

    const taxRate = parseFloat(process.env.TAX_RATE) || 0.18;
    const subtotal = cart.subtotal;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    res.json({
      success: true,
      message: 'Address saved successfully',
      data: {
        deliveryAddress: cart.deliveryAddress,
        pricing: {
          subtotal: parseFloat(subtotal.toFixed(2)),
          taxRate,
          taxAmount: parseFloat(taxAmount.toFixed(2)),
          total: parseFloat(total.toFixed(2)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

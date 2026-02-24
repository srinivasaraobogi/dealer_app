require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Dealer = require('../models/Dealer');
const Product = require('../models/Product');
const Banner = require('../models/Banner');
const Order = require('../models/Order');
const Cart = require('../models/Cart');

const seedData = async () => {
  await connectDB();

  // Clear existing data
  await Promise.all([
    Dealer.deleteMany({}),
    Product.deleteMany({}),
    Banner.deleteMany({}),
    Order.deleteMany({}),
    Cart.deleteMany({}),
  ]);

  console.log('Cleared existing data');

  // Create demo dealer
  const dealer = await Dealer.create({
    dealerId: 'DLR-001',
    name: 'Rajesh Kumar',
    email: 'dealer@demo.com',
    password: 'Demo@1234',
    mobile: '9876543210',
    companyName: 'Kumar Industrials Pvt Ltd',
    gstin: '29ABCDE1234F1ZS',
    territory: 'South India',
    priceTier: 'TIER_1',
    dealerSince: new Date('2020-01-15'),
    creditLimit: 500000,
    outstandingAmount: 7864,
    netTermsEnabled: true,
    isVerified: true,
    verificationStatus: 'VERIFIED',
    address: 'Industrial Park, North Sector',
    city: 'Bangalore',
    state: 'Karnataka',
    pinCode: '560001',
    country: 'India',
    defaultDeliveryAddress: 'Warehouse 4, Industrial Park, North Sector, Bangalore - 560001',
    defaultPinCode: '560001',
  });

  console.log('Created demo dealer:', dealer.email);

  // Create products
  const products = await Product.insertMany([
    {
      sku: 'TL-001',
      name: 'Industrial Valve Series-X',
      description: 'High-performance industrial valve for heavy-duty applications. Designed for use in chemical plants, refineries, and manufacturing facilities.',
      category: 'VALVES',
      images: [{ url: 'https://via.placeholder.com/400x400?text=Valve', isPrimary: true }],
      price: 450,
      oldPrice: 580,
      moq: 4,
      stock: 250,
      stockThreshold: 20,
      specifications: [
        { key: 'Material', value: 'Stainless Steel 316' },
        { key: 'Max Pressure', value: '300', unit: 'PSI' },
        { key: 'Inlet Size', value: '2', unit: 'inch' },
        { key: 'Warranty', value: '2 Years' },
      ],
      deliverySla: 'Standard Shipping: 3–5 Business Days',
      isHighlyDemanded: true,
      isPriceDrop: true,
      offerValidityDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      orderCount: 520,
    },
    {
      sku: 'TL-002',
      name: 'Heavy Duty Wrench Set',
      description: 'Professional grade wrench set for industrial use. Includes 12 pieces.',
      category: 'TOOLS',
      images: [{ url: 'https://via.placeholder.com/400x400?text=Wrench', isPrimary: true }],
      price: 1200,
      oldPrice: 1500,
      moq: 2,
      stock: 150,
      stockThreshold: 15,
      specifications: [
        { key: 'Material', value: 'Chromium Vanadium Steel' },
        { key: 'Pieces', value: '12' },
        { key: 'Size Range', value: '8-32', unit: 'mm' },
        { key: 'Warranty', value: '1 Year' },
      ],
      isHighlyDemanded: true,
      isPriceDrop: true,
      offerValidityDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      orderCount: 380,
    },
    {
      sku: 'EL-001',
      name: 'Industrial Circuit Breaker 3P',
      description: 'Three-phase circuit breaker for industrial electrical panels.',
      category: 'ELECTRICAL',
      images: [{ url: 'https://via.placeholder.com/400x400?text=Breaker', isPrimary: true }],
      price: 2800,
      moq: 1,
      stock: 80,
      stockThreshold: 10,
      specifications: [
        { key: 'Poles', value: '3' },
        { key: 'Current Rating', value: '63', unit: 'A' },
        { key: 'Breaking Capacity', value: '10', unit: 'kA' },
        { key: 'Warranty', value: '2 Years' },
      ],
      isHighlyDemanded: true,
      orderCount: 290,
    },
    {
      sku: 'MC-001',
      name: 'Stainless Steel Bearing 6205',
      description: 'Deep groove ball bearing for mechanical applications.',
      category: 'MECHANICAL',
      images: [{ url: 'https://via.placeholder.com/400x400?text=Bearing', isPrimary: true }],
      price: 180,
      oldPrice: 230,
      moq: 10,
      stock: 500,
      stockThreshold: 50,
      specifications: [
        { key: 'Inner Diameter', value: '25', unit: 'mm' },
        { key: 'Outer Diameter', value: '52', unit: 'mm' },
        { key: 'Width', value: '15', unit: 'mm' },
        { key: 'Material', value: 'Stainless Steel' },
      ],
      isHighlyDemanded: true,
      isPriceDrop: true,
      offerValidityDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      orderCount: 850,
    },
    {
      sku: 'TL-003',
      name: 'Pneumatic Impact Driver',
      description: 'High-torque pneumatic impact driver for fastening applications.',
      category: 'TOOLS',
      images: [{ url: 'https://via.placeholder.com/400x400?text=Driver', isPrimary: true }],
      price: 3500,
      moq: 1,
      stock: 8,
      stockThreshold: 10,
      specifications: [
        { key: 'Max Torque', value: '1200', unit: 'Nm' },
        { key: 'Air Consumption', value: '6', unit: 'CFM' },
        { key: 'Anvil Size', value: '1/2', unit: 'inch' },
        { key: 'Warranty', value: '1 Year' },
      ],
      isHighlyDemanded: false,
      orderCount: 120,
    },
    {
      sku: 'VL-002',
      name: 'Gate Valve 2 Inch',
      description: 'Fully welded ball valve for high pressure applications.',
      category: 'VALVES',
      images: [{ url: 'https://via.placeholder.com/400x400?text=GateValve', isPrimary: true }],
      price: 890,
      oldPrice: 1100,
      moq: 5,
      stock: 120,
      stockThreshold: 12,
      specifications: [
        { key: 'Size', value: '2', unit: 'inch' },
        { key: 'Pressure Rating', value: '150', unit: 'PSI' },
        { key: 'Material', value: 'Cast Iron' },
        { key: 'End Connection', value: 'Flanged' },
      ],
      isPriceDrop: true,
      offerValidityDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      orderCount: 340,
    },
    {
      sku: 'EL-002',
      name: 'Industrial Motor Starter',
      description: 'Direct-on-line motor starter for 3-phase induction motors.',
      category: 'ELECTRICAL',
      images: [{ url: 'https://via.placeholder.com/400x400?text=Starter', isPrimary: true }],
      price: 1650,
      moq: 1,
      stock: 45,
      stockThreshold: 5,
      specifications: [
        { key: 'Motor Range', value: '5.5-11', unit: 'kW' },
        { key: 'Voltage', value: '415', unit: 'V' },
        { key: 'Current Rating', value: '25', unit: 'A' },
        { key: 'Warranty', value: '2 Years' },
      ],
      orderCount: 175,
    },
    {
      sku: 'MC-002',
      name: 'Flexible Coupling',
      description: 'Jaw type flexible coupling for shaft connection.',
      category: 'MECHANICAL',
      images: [{ url: 'https://via.placeholder.com/400x400?text=Coupling', isPrimary: true }],
      price: 650,
      moq: 2,
      stock: 0,
      stockThreshold: 5,
      specifications: [
        { key: 'Bore Size', value: '19-35', unit: 'mm' },
        { key: 'Max Torque', value: '200', unit: 'Nm' },
        { key: 'Material', value: 'Aluminum Alloy' },
        { key: 'Warranty', value: '1 Year' },
      ],
      orderCount: 95,
    },
  ]);

  console.log(`Created ${products.length} products`);

  // Create banners
  const now = new Date();
  await Banner.insertMany([
    {
      title: 'Mega Industrial Sale - Up to 30% Off',
      imageUrl: 'https://via.placeholder.com/800x300?text=Mega+Sale',
      discountPercentage: 30,
      startDate: new Date(now - 24 * 60 * 60 * 1000),
      endDate: new Date(now + 7 * 24 * 60 * 60 * 1000),
      isActive: true,
      targetCategory: 'TOOLS',
      sortOrder: 1,
    },
    {
      title: 'New Arrivals - Electrical Components',
      imageUrl: 'https://via.placeholder.com/800x300?text=New+Arrivals',
      discountPercentage: 15,
      startDate: new Date(now - 48 * 60 * 60 * 1000),
      endDate: new Date(now + 14 * 24 * 60 * 60 * 1000),
      isActive: true,
      targetCategory: 'ELECTRICAL',
      sortOrder: 2,
    },
  ]);

  console.log('Created banners');

  // Create a demo delivered order for returns testing
  const deliveredOrder = await Order.create({
    orderId: 'ORD-DEMO-001',
    dealerId: dealer._id,
    items: [
      {
        productId: products[0]._id,
        sku: products[0].sku,
        name: products[0].name,
        image: products[0].images[0].url,
        unitPrice: products[0].price,
        quantity: 4,
        moq: products[0].moq,
        lineTotal: products[0].price * 4,
      },
    ],
    status: 'DELIVERED',
    subtotal: products[0].price * 4,
    taxRate: 0.18,
    taxAmount: parseFloat((products[0].price * 4 * 0.18).toFixed(2)),
    shippingCost: 0,
    total: parseFloat((products[0].price * 4 * 1.18).toFixed(2)),
    paymentMethod: 'NET_30',
    paymentStatus: 'PENDING',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    deliveryAddress: {
      label: 'Warehouse',
      fullAddress: 'Warehouse 4, Industrial Park, North Sector, Bangalore',
      city: 'Bangalore',
      postalCode: '560001',
      country: 'India',
    },
    trackingId: 'TRK887690',
    carrier: 'FedEx Express',
    estimatedDeliveryStart: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    estimatedDeliveryEnd: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    actualDeliveryDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    timeline: [
      { status: 'CONFIRMED', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), description: 'Order confirmed' },
      { status: 'SHIPPED', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), description: 'Order shipped', location: 'Bangalore Hub' },
      { status: 'OUT_FOR_DELIVERY', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), description: 'Out for delivery' },
      { status: 'DELIVERED', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), description: 'Delivered successfully' },
    ],
    invoiceId: 'INV-DEMO-001',
    isCancellable: false,
  });

  console.log('Created demo delivered order:', deliveredOrder.orderId);
  console.log('\nSeed completed successfully!');
  console.log('\nDemo Login Credentials:');
  console.log('Email: dealer@demo.com');
  console.log('Password: Demo@1234');

  process.exit(0);
};

seedData().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});

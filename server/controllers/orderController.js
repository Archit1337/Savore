const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const FoodItem = require('../models/FoodItem');
const mongoose = require('mongoose');

const CITY_PINCODE_PREFIXES = {
  mumbai: ['400'],
  delhi: ['11'],
  bengaluru: ['560'],
  bangalore: ['560'],
  hyderabad: ['500'],
  chennai: ['600'],
  kolkata: ['700'],
  pune: ['411', '412'],
  ahmedabad: ['380', '382'],
  jaipur: ['302'],
  chandigarh: ['160'],
  goa: ['403'],
  kochi: ['682'],
  lucknow: ['226'],
  indore: ['452'],
  surat: ['395']
};

const getCityAliases = (city) => {
  if (!city) return [];
  const c = city.toLowerCase().trim();
  if (c === 'bengaluru' || c === 'bangalore') {
    return ['bengaluru', 'bangalore'];
  }
  if (c === 'mumbai' || c === 'bombay') {
    return ['mumbai', 'bombay'];
  }
  if (c === 'kolkata' || c === 'calcutta') {
    return ['kolkata', 'calcutta'];
  }
  if (c === 'chennai' || c === 'madras') {
    return ['chennai', 'madras'];
  }
  return [c];
};

const isAddressMatchingCity = (addressStr, city) => {
  if (!addressStr || !city) return false;
  const addr = addressStr.toLowerCase().trim();
  const aliases = getCityAliases(city);
  return aliases.some(alias => addr.includes(alias));
};

const isAddressValidForRestaurantCity = (addressStr, city) => {
  if (!addressStr || !city) return false;
  
  // Extract pincodes (6 digits, optionally separated by a space in the middle)
  const rawPins = addressStr.match(/\b\d{3}\s?\d{3}\b/g);
  if (rawPins && rawPins.length > 0) {
    const pins = rawPins.map(pin => pin.replace(/\s+/g, ''));
    const normalizedCity = city.toLowerCase().trim();
    const prefixes = CITY_PINCODE_PREFIXES[normalizedCity];
    if (prefixes) {
      const hasValidPin = pins.some(pin => prefixes.some(pref => pin.startsWith(pref)));
      if (hasValidPin) return true;
      return false;
    }
  }

  return isAddressMatchingCity(addressStr, city);
};

// @desc    Place a new order
// @route   POST /api/orders
// @access  Private (Customer)
const placeOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { restaurant: restaurantId, items, paymentMethod, deliveryAddress, transactionId } = req.body;

    // Idempotency: Prevent duplicate submissions
    if (transactionId) {
      const existingOrder = await Order.findOne({ transactionId }).session(session);
      if (existingOrder) {
        await session.abortTransaction();
        session.endSession();
        return res.status(200).json({
          success: true,
          data: existingOrder,
          message: 'Order already processed (idempotent)',
        });
      }
    }

    const restaurant = await Restaurant.findById(restaurantId).session(session);
    if (!restaurant) {
      res.status(404);
      throw new Error('Restaurant not found');
    }

    // Determine if this is a test order placed by the owner
    const isTestOrder = restaurant.owner.toString() === req.user.id;

    // Validate if restaurant is open (bypassed for test orders placed by the owner)
    if (!restaurant.isOpen && !isTestOrder) {
      res.status(400);
      throw new Error(`This restaurant (${restaurant.name}) is currently closed and not accepting new orders.`);
    }

    if (paymentMethod === 'SIMULATED' && !isTestOrder) {
      res.status(400);
      throw new Error('Simulation payment mode is only available for the kitchen owner.');
    }

    // Server-side Region Locked Ordering validation (bypassed for test orders)
    const userRegion = req.headers['x-user-region'] || req.body.userRegion;
    if (userRegion && restaurant.city && !isTestOrder) {
      if (restaurant.city.toLowerCase().trim() !== userRegion.toLowerCase().trim()) {
        res.status(400);
        throw new Error(`This restaurant (${restaurant.name}) is outside your active delivery zone (${userRegion}).`);
      }
    }

    // Server-side Delivery Address City/Pincode validation (bypassed for test orders)
    if (restaurant.city && !isTestOrder) {
      if (!isAddressValidForRestaurantCity(deliveryAddress, restaurant.city)) {
        res.status(400);
        throw new Error(`The delivery address pincode or city name does not match the restaurant's operating city (${restaurant.city}).`);
      }
    }

    // Verify item prices and availability
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const foodItem = await FoodItem.findById(item.foodItem).session(session);
      if (!foodItem || !foodItem.isAvailable) {
        res.status(400);
        throw new Error(`Item ${item.foodItem} is not available`);
      }
      
      const itemPrice = foodItem.price;
      subtotal += itemPrice * item.quantity;
      
      validatedItems.push({
        foodItem: foodItem._id,
        quantity: item.quantity,
        price: itemPrice,
      });
    }

    subtotal = parseFloat(subtotal.toFixed(2));
    const deliveryFee = restaurant.deliveryFee || 0.0;
    const tax = parseFloat((subtotal * 0.1).toFixed(2)); // 10% tax
    const total = parseFloat((subtotal + deliveryFee + tax).toFixed(2));

    // Time-Window Idempotency: Prevent duplicate submissions (e.g. COD double-submit)
    const cutoffTime = new Date(Date.now() - 30 * 1000); // 30 seconds
    const possibleDuplicate = await Order.findOne({
      user: req.user.id,
      restaurant: restaurant._id,
      total: total,
      createdAt: { $gte: cutoffTime }
    }).session(session);

    if (possibleDuplicate) {
      await session.abortTransaction();
      session.endSession();
      return res.status(200).json({
        success: true,
        data: possibleDuplicate,
        message: 'Duplicate order detected within 30 seconds time window. Order already processed.',
      });
    }

    // Handle payment status based on method
    let paymentStatus = 'pending';
    if (isTestOrder) {
      paymentStatus = 'paid';
    } else if (paymentMethod === 'COD') {
      paymentStatus = 'pending'; // COD paid on delivery
    }

    const [order] = await Order.create([{
      user: req.user.id,
      restaurant: restaurant._id,
      items: validatedItems,
      subtotal,
      deliveryFee,
      tax,
      total,
      paymentMethod,
      paymentStatus,
      transactionId: transactionId || (isTestOrder ? `TEST-${Date.now()}-${Math.floor(Math.random() * 1000)}` : undefined),
      deliveryAddress,
      status: isTestOrder ? 'preparing' : 'pending',
      isTestOrder,
    }], { session });

    await session.commitTransaction();
    session.endSession();

    // Emit live socket event to the restaurant owner's room (outside transaction block)
    const io = req.app.get('io');
    if (io) {
      io.to(`merchant_${restaurant.owner.toString()}`).emit('new_order_alert', {
        orderId: order._id,
        total: order.total,
        status: order.status
      });
    }

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Get paginated order history for customer
// @route   GET /api/orders/customer
// @access  Private (Customer)
const getCustomerOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalOrders = await Order.countDocuments({ user: req.user.id });
    const totalPages = Math.ceil(totalOrders / limit) || 1;

    const orders = await Order.find({ user: req.user.id })
      .populate('restaurant', 'name coverImage')
      .populate('items.foodItem', 'name price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      data: orders,
      page,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get paginated orders for owner
// @route   GET /api/orders/restaurant
// @access  Private (Restaurant Owner)
const getRestaurantOrders = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user.id });
    if (!restaurant) {
      res.status(404);
      return next(new Error('No restaurant registered for this owner account'));
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { restaurant: restaurant._id };
    
    if (req.query.status) {
      if (req.query.status === 'active') {
        query.status = { $in: ['pending', 'preparing', 'ready', 'out_for_delivery'] };
      } else if (req.query.status === 'archived') {
        query.status = { $in: ['delivered', 'cancelled'] };
      } else {
        query.status = req.query.status;
      }
    }

    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit) || 1;

    const orders = await Order.find(query)
      .populate('user', 'username email')
      .populate('items.foodItem', 'name price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      data: orders,
      page,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get paginated orders for admin
// @route   GET /api/orders/admin
// @access  Private (Admin)
const getAdminOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalOrders = await Order.countDocuments();
    const totalPages = Math.ceil(totalOrders / limit) || 1;

    const orders = await Order.find()
      .populate('restaurant', 'name')
      .populate('user', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      data: orders,
      page,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order details
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res, next) => {
  try {
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(404);
      return next(new Error('Order not found'));
    }
    const order = await Order.findById(req.params.id)
      .populate('restaurant', 'name coverImage deliveryFee deliveryTime cuisines owner upiVpa')
      .populate('items.foodItem', 'name price image')
      .populate('user', 'username email');

    if (!order) {
      res.status(404);
      return next(new Error('Order not found'));
    }

    // Authorization checks
    const isCustomer = order.user._id.toString() === req.user.id;
    const isOwner = order.restaurant.owner.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isOwner && !isAdmin) {
      res.status(403);
      return next(new Error('Access Forbidden: You are not authorized to view this order'));
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Restaurant Owner / Admin)
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(404);
      return next(new Error('Order not found'));
    }
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      return next(new Error('Order not found'));
    }

    const restaurant = await Restaurant.findById(order.restaurant);
    const isOwnerOrAdmin = restaurant && (restaurant.owner.toString() === req.user.id || req.user.role === 'admin');
    const isCustomerOwnerOfOrder = order.user.toString() === req.user.id;

    // Customers can cancel their own unpaid orders (e.g. abandoning card payment)
    const canCustomerCancel = isCustomerOwnerOfOrder && status === 'cancelled' && order.paymentStatus === 'pending';
    // Customers can confirm delivery of their own out-for-delivery orders
    const canCustomerDelivery = isCustomerOwnerOfOrder && order.status === 'out_for_delivery' && status === 'delivered';

    if (!isOwnerOrAdmin && !canCustomerCancel && !canCustomerDelivery) {
      res.status(403);
      return next(new Error('Unauthorized to modify this order status'));
    }

    // If transitioning to delivered, resolve COD payment and credit restaurant revenue
    if (status === 'delivered' && order.status !== 'delivered' && !order.isTestOrder) {
      if (order.paymentMethod === 'COD' && order.paymentStatus !== 'paid') {
        order.paymentStatus = 'paid';
        restaurant.revenue = parseFloat((restaurant.revenue + order.subtotal).toFixed(2));
        await restaurant.save();
      }
    }

    order.status = status;
    await order.save();

    // Emit live socket event to the restaurant owner's room to update dashboard metrics
    const io = req.app.get('io');
    if (io && restaurant) {
      io.to(`merchant_${restaurant.owner.toString()}`).emit('new_order_alert', {
        orderId: order._id,
        total: order.total,
        status: order.status
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  placeOrder,
  getCustomerOrders,
  getRestaurantOrders,
  getAdminOrders,
  getOrderById,
  updateOrderStatus,
};

const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const FoodItem = require('../models/FoodItem');
const mongoose = require('mongoose');

// @desc    Place a new order
// @route   POST /api/orders
// @access  Private (Customer)
const placeOrder = async (req, res, next) => {
  try {
    const { restaurant: restaurantId, items, paymentMethod, deliveryAddress, transactionId } = req.body;

    // Idempotency: Prevent duplicate submissions
    if (transactionId) {
      const existingOrder = await Order.findOne({ transactionId });
      if (existingOrder) {
        return res.status(200).json({
          success: true,
          data: existingOrder,
          message: 'Order already processed (idempotent)',
        });
      }
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      res.status(404);
      return next(new Error('Restaurant not found'));
    }

    // Server-side Region Locked Ordering validation
    const userRegion = req.headers['x-user-region'] || req.body.userRegion;
    if (userRegion && restaurant.city) {
      if (restaurant.city.toLowerCase().trim() !== userRegion.toLowerCase().trim()) {
        res.status(400);
        return next(new Error(`This restaurant (${restaurant.name}) is outside your active delivery zone (${userRegion}).`));
      }
    }

    // Verify item prices and availability
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const foodItem = await FoodItem.findById(item.foodItem);
      if (!foodItem || !foodItem.isAvailable) {
        res.status(400);
        return next(new Error(`Item ${item.foodItem} is not available`));
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

    // Handle payment status based on method
    let paymentStatus = 'pending';
    if (paymentMethod === 'COD') {
      paymentStatus = 'pending'; // COD paid on delivery
    }

    const order = await Order.create({
      user: req.user.id,
      restaurant: restaurant._id,
      items: validatedItems,
      subtotal,
      deliveryFee,
      tax,
      total,
      paymentMethod,
      paymentStatus,
      transactionId: transactionId || undefined,
      deliveryAddress,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
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

    const totalOrders = await Order.countDocuments({ restaurant: restaurant._id });
    const totalPages = Math.ceil(totalOrders / limit) || 1;

    const orders = await Order.find({ restaurant: restaurant._id })
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
      .populate('restaurant', 'name coverImage deliveryFee deliveryTime cuisines owner')
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
    if (!restaurant || (restaurant.owner.toString() !== req.user.id && req.user.role !== 'admin')) {
      res.status(403);
      return next(new Error('Unauthorized to modify this order status'));
    }

    order.status = status;
    await order.save();

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

const Restaurant = require('../models/Restaurant');
const FoodItem = require('../models/FoodItem');
const Order = require('../models/Order');
const Reel = require('../models/Reel');
const Comment = require('../models/Comment');
const mongoose = require('mongoose');

// @desc    Get all restaurants with pagination and filters
// @route   GET /api/restaurants
// @access  Public
const getRestaurants = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: 'i' };
    }
    if (req.query.cuisine) {
      query.cuisines = { $in: [req.query.cuisine] };
    }
    if (req.query.tag) {
      query.tags = { $in: [req.query.tag] };
    }
    if (req.query.city && req.query.city !== 'All') {
      query.city = { $regex: new RegExp(`^${req.query.city.trim()}$`, 'i') };
    }
    if (req.query.locality && req.query.locality !== 'All') {
      query.locality = { $regex: new RegExp(`^${req.query.locality.trim()}$`, 'i') };
    }
    if (req.query.priceRange && req.query.priceRange !== 'All') {
      query.priceRange = req.query.priceRange;
    }
    
    // Geospatial Proximity Sorting if lat/lng coordinates are supplied
    const hasCoords = req.query.lat && req.query.lng;
    if (hasCoords) {
      const lat = parseFloat(req.query.lat);
      const lng = parseFloat(req.query.lng);
      const maxDistance = parseFloat(req.query.maxDistance) || 30; // default 30km search radius

      query.coordinates = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: maxDistance * 1000 // meters
        }
      };
    }

    // Build a separate query for countDocuments to avoid the $near operator restriction
    const countQuery = { ...query };
    if (hasCoords) {
      const lat = parseFloat(req.query.lat);
      const lng = parseFloat(req.query.lng);
      const maxDistance = parseFloat(req.query.maxDistance) || 30;
      const radiusInRadians = maxDistance / 6378.1;
      countQuery.coordinates = {
        $geoWithin: {
          $centerSphere: [[lng, lat], radiusInRadians]
        }
      };
    }

    const totalRestaurants = await Restaurant.countDocuments(countQuery);
    const totalPages = Math.ceil(totalRestaurants / limit) || 1;

    let mongooseQuery = Restaurant.find(query);

    // If coordinates are supplied, Mongoose automatic spatial sorting is applied,
    // otherwise fallback to traditional high rating sort order.
    if (!hasCoords) {
      mongooseQuery = mongooseQuery.sort({ rating: -1 });
    }

    const restaurants = await mongooseQuery
      .skip(skip)
      .limit(limit);

    res.json({
      data: restaurants || [],
      page,
      totalPages,
      totalRestaurants,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single restaurant & its menu items
// @route   GET /api/restaurants/:id
// @access  Public
const getRestaurantById = async (req, res, next) => {
  try {
    const targetId = req.query.id || req.params.id;
    if (!targetId || !mongoose.Types.ObjectId.isValid(targetId)) {
      res.status(404);
      return next(new Error('Restaurant not found'));
    }

    const restaurant = await Restaurant.findById(targetId);
    if (!restaurant) {
      res.status(404);
      return next(new Error('Restaurant not found'));
    }

    const menu = await FoodItem.find({ restaurant: restaurant._id });

    res.json({
      success: true,
      data: {
        restaurant,
        menu,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new restaurant
// @route   POST /api/restaurants
// @access  Private (Restaurant Owner or Admin)
const createRestaurant = async (req, res, next) => {
  try {
    const { name, description, coverImage, tags, cuisines, deliveryTime, deliveryFee } = req.body;

    // A user can own at most one restaurant in this SaaS
    const existingRestaurant = await Restaurant.findOne({ owner: req.user.id });
    if (existingRestaurant && req.user.role !== 'admin') {
      res.status(400);
      return next(new Error('Restaurant owners can register only one restaurant.'));
    }

    const restaurant = await Restaurant.create({
      name,
      description: description || '',
      coverImage: coverImage || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80',
      tags: tags || [],
      cuisines: cuisines || [],
      deliveryTime: deliveryTime || 30,
      deliveryFee: deliveryFee || 0.0,
      owner: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: restaurant,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get owner's SaaS dashboard analytics
// @route   GET /api/restaurants/owner/analytics
// @access  Private (Restaurant Owner)
const getOwnerAnalytics = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user.id });
    if (!restaurant) {
      res.status(404);
      return next(new Error('No restaurant registered for this owner account.'));
    }

    // Capture SaaS analytics metrics:
    // 1. Total revenue
    // 2. Active Orders
    // 3. Completed Orders count
    const activeOrdersCount = await Order.countDocuments({
      restaurant: restaurant._id,
      status: { $in: ['pending', 'preparing', 'ready', 'out_for_delivery'] },
    });

    const completedOrdersCount = await Order.countDocuments({
      restaurant: restaurant._id,
      status: 'delivered',
      isTestOrder: { $ne: true },
    });

    // 4. Calculate conversions (true Reels CTR based on impressions vs clicks)
    const reels = await Reel.find({ restaurant: restaurant._id });
    let totalImpressions = 0;
    let totalClicks = 0;
    reels.forEach(r => {
      totalImpressions += r.impressions || 0;
      totalClicks += r.clicks || 0;
    });

    const conversionRate = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : 0.0;

    // 5. Time-series data aggregations
    // Aggregation for monthly revenue (subtotal sum of delivered orders)
    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          restaurant: restaurant._id,
          status: 'delivered',
          isTestOrder: { $ne: true }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          revenue: { $sum: '$subtotal' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Aggregation for weekly day spikes (count of delivered orders per day of week)
    const weeklySpikes = await Order.aggregate([
      {
        $match: {
          restaurant: restaurant._id,
          status: 'delivered',
          isTestOrder: { $ne: true }
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Format last 6 months dynamically for the chart coordinates
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const match = monthlyRevenue.find(item => item._id === mIdx + 1);
      last6Months.push({
        month: monthNames[mIdx],
        val: match ? parseFloat(match.revenue.toFixed(2)) : 0.0
      });
    }

    // Format 7 days of the week starting from Monday
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayMapping = { 'Mon': 2, 'Tue': 3, 'Wed': 4, 'Thu': 5, 'Fri': 6, 'Sat': 7, 'Sun': 1 };
    const formattedWeeklySpikes = dayNames.map(name => {
      const match = weeklySpikes.find(item => item._id === dayMapping[name]);
      return {
        day: name,
        count: match ? match.count : 0
      };
    });

    res.json({
      success: true,
      data: {
        restaurantName: restaurant.name,
        totalRevenue: restaurant.revenue,
        activeOrders: activeOrdersCount,
        completedOrders: completedOrdersCount,
        conversionRate: parseFloat(conversionRate),
        monthlyRevenue: last6Months,
        weeklySpikes: formattedWeeklySpikes,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get owner's registered restaurant details
// @route   GET /api/restaurants/owner/details
// @access  Private (Restaurant Owner)
const getOwnerRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user.id });
    if (!restaurant) {
      res.status(404);
      return next(new Error('No restaurant found for this owner'));
    }
    res.json({
      success: true,
      data: restaurant,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update owner's registered restaurant details
// @route   PUT /api/restaurants/owner/details
// @access  Private (Restaurant Owner)
const updateOwnerRestaurant = async (req, res, next) => {
  try {
    const { 
      name, description, coverImage, tags, cuisines, deliveryTime, deliveryFee, timings,
      city, locality, priceRange, deliveryRadius, serviceableZones, latitude, longitude
    } = req.body;
    const restaurant = await Restaurant.findOne({ owner: req.user.id });

    if (!restaurant) {
      res.status(404);
      return next(new Error('No restaurant found for this owner'));
    }

    if (name !== undefined) restaurant.name = name;
    if (description !== undefined) restaurant.description = description;
    if (coverImage !== undefined) restaurant.coverImage = coverImage;
    if (tags !== undefined) restaurant.tags = tags;
    if (cuisines !== undefined) restaurant.cuisines = cuisines;
    if (deliveryTime !== undefined) restaurant.deliveryTime = deliveryTime;
    if (deliveryFee !== undefined) restaurant.deliveryFee = deliveryFee;
    if (timings !== undefined) restaurant.timings = timings;
    if (city !== undefined) restaurant.city = city;
    if (locality !== undefined) restaurant.locality = locality;
    if (priceRange !== undefined) restaurant.priceRange = priceRange;
    if (deliveryRadius !== undefined) restaurant.deliveryRadius = deliveryRadius;
    if (serviceableZones !== undefined) {
      restaurant.serviceableZones = Array.isArray(serviceableZones)
        ? serviceableZones
        : serviceableZones.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (latitude !== undefined && longitude !== undefined) {
      restaurant.coordinates = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };
    }

    await restaurant.save();

    res.json({
      success: true,
      data: restaurant,
      message: 'Restaurant profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer comments on owner's reels
// @route   GET /api/restaurants/owner/comments
// @access  Private (Restaurant Owner)
const getOwnerComments = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user.id });
    if (!restaurant) {
      res.status(404);
      return next(new Error('No restaurant registered for this owner account.'));
    }

    const reels = await Reel.find({ restaurant: restaurant._id });
    const commentIds = reels.flatMap(r => r.comments || []);

    const comments = await Comment.find({ _id: { $in: commentIds } })
      .populate('user', 'username profilePicture')
      .sort({ createdAt: -1 });

    const formattedComments = [];
    comments.forEach(c => {
      const targetReel = reels.find(r => r.comments.includes(c._id));
      formattedComments.push({
        _id: c._id,
        text: c.text,
        createdAt: c.createdAt,
        user: c.user,
        reelId: targetReel?._id,
        reelCaption: targetReel?.caption || 'Recipe Reel'
      });
    });

    res.json({
      success: true,
      data: formattedComments || []
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRestaurants,
  getRestaurantById,
  createRestaurant,
  getOwnerAnalytics,
  getOwnerRestaurant,
  updateOwnerRestaurant,
  getOwnerComments,
};

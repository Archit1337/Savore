const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Reel = require('../models/Reel');
const Order = require('../models/Order');
const Comment = require('../models/Comment');
const PartnershipRequest = require('../models/PartnershipRequest');
const ActivityLog = require('../models/ActivityLog');
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

// Helper to escape regex special characters (prevents ReDoS and regex injection attacks)
const escapeRegex = (string) => {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

// Log administrative activities helper
const logAdminActivity = async (adminId, action, details, ipAddress) => {
  try {
    await ActivityLog.create({
      admin: adminId,
      action,
      details,
      ipAddress,
    });
  } catch (err) {
    console.error('Failed to write admin activity log:', err.message);
  }
};

// @desc    Get recent administrative audit trail activity logs
// @route   GET /api/admin/logs
// @access  Private/Admin
const getAdminLogs = async (req, res, next) => {
  try {
    const logs = await ActivityLog.find()
      .populate('admin', 'username')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (paginated + search)
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.search || '';

    const filter = {};
    if (searchQuery) {
      const sanitizedSearch = escapeRegex(searchQuery);
      filter.$or = [
        { username: { $regex: sanitizedSearch, $options: 'i' } },
        { email: { $regex: sanitizedSearch, $options: 'i' } },
        { name: { $regex: sanitizedSearch, $options: 'i' } },
      ];
    }

    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limit) || 1;

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: users,
      page,
      totalPages,
      totalCount: totalUsers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle User suspension status
// @route   PUT /api/admin/users/:id/suspend
// @access  Private/Admin
const suspendUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      res.status(400);
      return next(new Error('You cannot suspend your own administrative account'));
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    user.isSuspended = !user.isSuspended;
    
    // If suspending, clear active refresh tokens to terminate active sessions
    if (user.isSuspended) {
      user.refreshTokens = [];
    }

    await user.save();

    await logAdminActivity(
      req.user.id,
      user.isSuspended ? 'SUSPEND_USER' : 'ACTIVATE_USER',
      `${user.isSuspended ? 'Suspended' : 'Activated'} user account "${user.username}"`,
      req.ip
    );

    res.json({
      success: true,
      data: user,
      message: `User account has been successfully ${user.isSuspended ? 'suspended' : 'activated'}.`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change User role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
const changeUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!role || !['customer', 'restaurant', 'admin'].includes(role)) {
      res.status(400);
      return next(new Error('Invalid user role specified'));
    }

    if (req.params.id === req.user.id) {
      res.status(400);
      return next(new Error('You cannot modify your own master administrative role'));
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    await logAdminActivity(
      req.user.id,
      'CHANGE_ROLE',
      `Changed user role of "${user.username}" from '${oldRole}' to '${role}'`,
      req.ip
    );

    res.json({
      success: true,
      data: user,
      message: `User role has been updated to '${role}'.`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all restaurants (paginated + search)
// @route   GET /api/admin/restaurants
// @access  Private/Admin
const getRestaurants = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.search || '';

    const filter = {};
    if (searchQuery) {
      const sanitizedSearch = escapeRegex(searchQuery);
      filter.$or = [
        { name: { $regex: sanitizedSearch, $options: 'i' } },
        { city: { $regex: sanitizedSearch, $options: 'i' } },
        { locality: { $regex: sanitizedSearch, $options: 'i' } },
      ];
    }

    const totalRestaurants = await Restaurant.countDocuments(filter);
    const totalPages = Math.ceil(totalRestaurants / limit) || 1;

    const restaurants = await Restaurant.find(filter)
      .populate('owner', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: restaurants,
      page,
      totalPages,
      totalCount: totalRestaurants,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle Restaurant suspension status
// @route   PUT /api/admin/restaurants/:id/suspend
// @access  Private/Admin
const suspendRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      res.status(404);
      return next(new Error('Restaurant kitchen not found'));
    }

    restaurant.isSuspended = !restaurant.isSuspended;
    await restaurant.save();

    await logAdminActivity(
      req.user.id,
      restaurant.isSuspended ? 'SUSPEND_RESTAURANT' : 'RESTORE_RESTAURANT',
      `${restaurant.isSuspended ? 'Suspended' : 'Restored'} restaurant kitchen "${restaurant.name}"`,
      req.ip
    );

    res.json({
      success: true,
      data: restaurant,
      message: `Restaurant kitchen has been successfully ${restaurant.isSuspended ? 'suspended' : 'restored'}.`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get flagged reels for content moderation
// @route   GET /api/admin/reels
// @access  Private/Admin
const getFlaggedReels = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch reels that are flagged, have at least one user report, or are in pending/suspended review
    const filter = {
      $or: [
        { isFlagged: true },
        { 'reports.0': { $exists: true } },
        { moderationState: { $in: ['pending_review', 'suspended'] } },
      ]
    };

    const totalFlagged = await Reel.countDocuments(filter);
    const totalPages = Math.ceil(totalFlagged / limit) || 1;

    const flaggedReels = await Reel.find(filter)
      .populate('restaurant', 'name')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'username profilePicture',
        },
      })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: flaggedReels,
      page,
      totalPages,
      totalCount: totalFlagged,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Dismiss reports on a Reel
// @route   PUT /api/admin/reels/:id/dismiss
// @access  Private/Admin
const dismissReelReports = async (req, res, next) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) {
      res.status(404);
      return next(new Error('Reel not found'));
    }

    reel.reports = [];
    reel.isFlagged = false;
    reel.moderationState = 'approved';
    await reel.save();

    await logAdminActivity(
      req.user.id,
      'DISMISS_REEL_REPORTS',
      `Dismissed user reports on video reel "${reel.caption}"`,
      req.ip
    );

    res.json({
      success: true,
      data: reel,
      message: 'Moderation review: Reel reports successfully dismissed.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Physically remove a Reel from the platform (including associated comments)
// @route   DELETE /api/admin/reels/:id
// @access  Private/Admin
const deleteReel = async (req, res, next) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) {
      res.status(404);
      return next(new Error('Reel not found'));
    }

    // Cascade delete associated comments to prevent database orphan leaks
    if (reel.comments && reel.comments.length > 0) {
      await Comment.deleteMany({ _id: { $in: reel.comments } });
    }

    // Delete physical video file from uploads folder
    if (reel.videoUrl && reel.videoUrl.startsWith('/uploads/')) {
      const relativePath = reel.videoUrl.replace(/^\//, ''); // remove leading slash
      const absolutePath = path.join(__dirname, '..', relativePath);
      try {
        await fs.unlink(absolutePath);
      } catch (err) {
        console.error(`⚠️ Failed to delete physical video file at ${absolutePath}:`, err.message);
      }
    }

    const reelCaption = reel.caption;
    
    // Create owner notification on associated restaurant
    const { reason, description } = req.body;
    const adminReason = reason || 'Policy Violation';
    const adminDescription = description || 'This video violated our community guidelines and has been permanently removed by the administration.';
    
    const restaurant = await Restaurant.findById(reel.restaurant);
    if (restaurant) {
      if (!restaurant.notifications) {
        restaurant.notifications = [];
      }
      restaurant.notifications.push({
        title: 'Reel Removed by Administration',
        message: `Your video Reel "${reelCaption || 'Culinary Reel'}" has been permanently removed by an Administrator.`,
        type: 'reel_removal',
        details: {
          reelCaption: reelCaption || 'Culinary Reel',
          removedBy: 'admin',
          reason: adminReason,
          description: adminDescription,
        },
        createdAt: new Date(),
        isRead: false
      });
      await restaurant.save();
    }

    await reel.deleteOne();

    await logAdminActivity(
      req.user.id,
      'DELETE_REEL',
      `Permanently removed reported video reel "${reelCaption}"`,
      req.ip
    );

    res.json({
      success: true,
      message: 'Reel and its associated comments have been permanently removed.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get master system metrics & alerts
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = async (req, res, next) => {
  try {
    // 1. Calculate Gross SaaS volume using aggregated query to avoid out-of-memory heap crash
    const revenueResult = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const totalGrossRevenue = revenueResult[0]?.total || 0;

    // 2. Counts
    const totalOrders = await Order.countDocuments();
    const restaurantsCount = await Restaurant.countDocuments();
    const reelsCount = await Reel.countDocuments();
    const usersCount = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isSuspended: false });
    
    // 3. Pending applications count
    const pendingApprovals = await PartnershipRequest.countDocuments({ status: 'pending' });

    // 4. Flagged reels count
    const flaggedReels = await Reel.countDocuments({
      $or: [
        { isFlagged: true },
        { 'reports.0': { $exists: true } },
        { moderationState: { $in: ['pending_review', 'suspended'] } },
      ]
    });

    res.json({
      success: true,
      data: {
        totalGrossRevenue: parseFloat(totalGrossRevenue.toFixed(2)),
        totalOrders,
        restaurantsCount,
        reelsCount,
        usersCount,
        activeUsers,
        pendingApprovals,
        flaggedReels,
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  suspendUser,
  changeUserRole,
  getRestaurants,
  suspendRestaurant,
  getFlaggedReels,
  dismissReelReports,
  deleteReel,
  getAdminStats,
  getAdminLogs,
  logAdminActivity,
};

const Reel = require('../models/Reel');
const Comment = require('../models/Comment');
const Restaurant = require('../models/Restaurant');
const mongoose = require('mongoose');

// @desc    Upload a new vertical video reel
// @route   POST /api/reels
// @access  Private (Restaurant Owner / Admin)
const uploadReel = async (req, res, next) => {
  try {
    const { caption, tags, restaurant: restaurantId, featuredDish } = req.body;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      res.status(404);
      return next(new Error('Target restaurant not found'));
    }

    // Verify ownership
    if (restaurant.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(403);
      return next(new Error('Unauthorized: You do not own this restaurant'));
    }

    // Validate featuredDish
    if (!featuredDish) {
      res.status(400);
      return next(new Error('Please provide a featured menu dish for this reel'));
    }

    if (!mongoose.Types.ObjectId.isValid(featuredDish)) {
      res.status(400);
      return next(new Error('Invalid featured dish ID format'));
    }

    const foodItem = await mongoose.model('FoodItem').findById(featuredDish);
    if (!foodItem) {
      res.status(404);
      return next(new Error('Featured food item not found'));
    }

    if (foodItem.restaurant.toString() !== restaurantId) {
      res.status(400);
      return next(new Error('Featured food item does not belong to the target restaurant'));
    }

    let videoUrl = req.body.videoUrl;

    // If file is uploaded via multer
    if (req.file) {
      // Normalize path for web serving
      videoUrl = `/uploads/${req.file.filename}`;
    }

    if (!videoUrl) {
      res.status(400);
      return next(new Error('Please upload a video file or provide a videoUrl'));
    }

    // Parse tags if sent as string
    let parsedTags = [];
    if (tags) {
      if (Array.isArray(tags)) {
        parsedTags = tags;
      } else {
        parsedTags = tags.split(',').map((t) => t.trim()).filter(Boolean);
      }
    }

    const reel = await Reel.create({
      videoUrl,
      caption: caption || '',
      tags: parsedTags,
      restaurant: restaurantId,
      featuredDish,
      city: restaurant.city || '',
      state: restaurant.state || '',
      locality: restaurant.locality || '',
      region: restaurant.locality || '',
      cuisineType: foodItem.category || 'Mains',
    });

    res.status(201).json({
      success: true,
      data: reel,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get vertical Reels Feed with rule-based trending score and pagination
// @route   GET /api/reels
// @access  Public
const getReelsFeed = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5;
    const skip = (page - 1) * limit;


    // Aggregation pipeline to compute on-the-fly trending score
    // score = likes * 2 + comments * 1.5 + views * 0.5 + recencyBoost
    // Recency Boost: < 24 hrs = 100, < 72 hrs = 50, otherwise = 0
    const now = new Date();
    const msIn24h = 24 * 60 * 60 * 1000;
    const msIn72h = 72 * 60 * 60 * 1000;

    const recencyBoostExpr = {
      $cond: [
        { $lt: [{ $subtract: [now, '$createdAt'] }, msIn24h] },
        100,
        {
          $cond: [
            { $lt: [{ $subtract: [now, '$createdAt'] }, msIn72h] },
            50,
            0,
          ],
        },
      ],
    };

    const scoreExpr = {
      $add: [
        { $multiply: [{ $size: { $ifNull: ['$likes', []] } }, 2] },
        { $multiply: [{ $size: { $ifNull: ['$comments', []] } }, 1.5] },
        { $multiply: [{ $ifNull: ['$views', 0] }, 0.5] },
        recencyBoostExpr,
      ],
    };

    // First, count total documents using denormalized fields and B-tree indexes
    const cityQuery = req.query.city;
    const cuisineQuery = req.query.cuisine;
    
    const filter = {};
    if (cityQuery) {
      filter.city = { $regex: new RegExp(`^${cityQuery}$`, 'i') };
    }
    if (cuisineQuery) {
      filter.cuisineType = { $regex: new RegExp(`^${cuisineQuery}$`, 'i') };
    }

    const totalCount = await Reel.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit) || 1;

    // Dynamic aggregation pipeline
    const pipeline = [];

    // 1. Stage 1: Filter early on denormalized fields to leverage compound indexes
    if (Object.keys(filter).length > 0) {
      pipeline.push({ $match: filter });
    }

    // 2. Stage 2: Add trending score computation fields
    pipeline.push({
      $addFields: {
        trendingScore: scoreExpr,
      },
    });

    // 3. Stage 3: Sort by trending score and creation recency
    pipeline.push({ $sort: { trendingScore: -1, createdAt: -1 } });

    // 4. Stage 4: Paginate
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // 5. Stage 5: Lookup restaurant details for the current page subset only (O(limit) vs O(N))
    pipeline.push(
      {
        $lookup: {
          from: 'restaurants',
          localField: 'restaurant',
          foreignField: '_id',
          as: 'restaurantDetails',
        },
      },
      { $unwind: { path: '$restaurantDetails', preserveNullAndEmptyArrays: true } }
    );

    const rawReels = await Reel.aggregate(pipeline);

    // Let's populate the comments path using mongoose schema population since they are deep references
    // Or we can manually populate. Let's populate user info inside comments and the featuredDish details.
    const populatedReels = await Reel.populate(rawReels, [
      {
        path: 'comments',
        populate: {
          path: 'user',
          select: 'username profilePicture',
        },
      },
      {
        path: 'featuredDish',
      }
    ]);


    // Shape results to conform to pagination standards
    res.json({
      data: populatedReels || [],
      page: page || 1,
      totalPages: totalPages || 1,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle like state for a vertical video reel
// @route   POST /api/reels/:id/like
// @access  Private
const toggleLikeReel = async (req, res, next) => {
  try {
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(404);
      return next(new Error('Reel not found'));
    }
    const reel = await Reel.findById(req.params.id);
    if (!reel) {
      res.status(404);
      return next(new Error('Reel not found'));
    }

    const userId = req.user.id;
    const isLiked = reel.likes.includes(userId);

    if (isLiked) {
      // Unlike
      reel.likes = reel.likes.filter((id) => id.toString() !== userId);
    } else {
      // Like
      reel.likes.push(userId);
    }

    await reel.save();

    res.json({
      success: true,
      likes: reel.likes,
      isLiked: !isLiked,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a comment to a vertical video reel
// @route   POST /api/reels/:id/comments
// @access  Private
const addCommentToReel = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === '') {
      res.status(400);
      return next(new Error('Comment text cannot be empty'));
    }

    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(404);
      return next(new Error('Reel not found'));
    }
    const reel = await Reel.findById(req.params.id);
    if (!reel) {
      res.status(404);
      return next(new Error('Reel not found'));
    }

    const comment = await Comment.create({
      user: req.user.id,
      text: text.trim(),
    });

    reel.comments.push(comment._id);
    await reel.save();

    // Populate user details for returning instantly
    const populatedComment = await Comment.findById(comment._id).populate(
      'user',
      'username profilePicture'
    );

    res.status(201).json({
      success: true,
      data: populatedComment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Track views on a vertical video reel
// @route   POST /api/reels/:id/view
// @access  Public
const trackReelView = async (req, res, next) => {
  try {
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(404);
      return next(new Error('Reel not found'));
    }
    const reel = await Reel.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!reel) {
      res.status(404);
      return next(new Error('Reel not found'));
    }

    res.json({
      success: true,
      views: reel.views,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Track order clicks CTR metric for a vertical video reel
// @route   POST /api/reels/:id/click-order
// @access  Public
const trackReelOrderClick = async (req, res, next) => {
  try {
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(404);
      return next(new Error('Reel not found'));
    }
    const reel = await Reel.findByIdAndUpdate(
      req.params.id,
      { $inc: { orderNowClicks: 1 } },
      { new: true }
    );

    if (!reel) {
      res.status(404);
      return next(new Error('Reel not found'));
    }

    res.json({
      success: true,
      orderNowClicks: reel.orderNowClicks,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Track generic engagements / clicks for a vertical video reel
// @route   POST /api/reels/:id/click
// @access  Public
const trackReelClick = async (req, res, next) => {
  try {
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(404);
      return next(new Error('Reel not found'));
    }
    const reel = await Reel.findByIdAndUpdate(
      req.params.id,
      { $inc: { clicks: 1 } },
      { new: true }
    );

    if (!reel) {
      res.status(404);
      return next(new Error('Reel not found'));
    }

    res.json({
      success: true,
      clicks: reel.clicks,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reels posted by owner's restaurant
// @route   GET /api/reels/owner
// @access  Private (Restaurant Owner)
const getOwnerReels = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user.id });
    if (!restaurant) {
      res.status(404);
      return next(new Error('No restaurant found for this owner'));
    }

    const reels = await Reel.find({ restaurant: restaurant._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: reels || []
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a reel's caption and tags
// @route   PUT /api/reels/:id
// @access  Private (Restaurant Owner)
const updateReel = async (req, res, next) => {
  try {
    const { caption, tags } = req.body;
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(404);
      return next(new Error('Reel not found'));
    }

    const reel = await Reel.findById(req.params.id);
    if (!reel) {
      res.status(404);
      return next(new Error('Reel not found'));
    }

    const restaurant = await Restaurant.findById(reel.restaurant);
    if (!restaurant || (restaurant.owner.toString() !== req.user.id && req.user.role !== 'admin')) {
      res.status(403);
      return next(new Error('Unauthorized: You do not own this restaurant'));
    }

    if (caption !== undefined) reel.caption = caption;
    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        reel.tags = tags;
      } else {
        reel.tags = tags.split(',').map(t => t.trim()).filter(Boolean);
      }
    }

    await reel.save();

    res.json({
      success: true,
      data: reel,
      message: 'Reel updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a reel and associated comments
// @route   DELETE /api/reels/:id
// @access  Private (Restaurant Owner)
const deleteReel = async (req, res, next) => {
  try {
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(404);
      return next(new Error('Reel not found'));
    }

    const reel = await Reel.findById(req.params.id);
    if (!reel) {
      res.status(404);
      return next(new Error('Reel not found'));
    }

    const restaurant = await Restaurant.findById(reel.restaurant);
    if (!restaurant || (restaurant.owner.toString() !== req.user.id && req.user.role !== 'admin')) {
      res.status(403);
      return next(new Error('Unauthorized: You do not own this restaurant'));
    }

    if (reel.comments && reel.comments.length > 0) {
      await Comment.deleteMany({ _id: { $in: reel.comments } });
    }

    await reel.deleteOne();

    res.json({
      success: true,
      message: 'Reel and its comments deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Track impressions on a vertical video reel
// @route   POST /api/reels/:id/impression
// @access  Public
const trackReelImpression = async (req, res, next) => {
  try {
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(404);
      return next(new Error('Reel not found'));
    }
    const reel = await Reel.findByIdAndUpdate(
      req.params.id,
      { $inc: { impressions: 1, views: 1 } },
      { new: true }
    );

    if (!reel) {
      res.status(404);
      return next(new Error('Reel not found'));
    }

    res.json({
      success: true,
      impressions: reel.impressions,
      views: reel.views,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Report/Flag a vertical video reel for content moderation
// @route   POST /api/reels/:id/report
// @access  Private (Regular Customer Users only)
const reportReel = async (req, res, next) => {
  try {
    // Only allow customer users to report, block restaurant owners and admins
    if (req.user.role !== 'customer') {
      res.status(403);
      return next(new Error('Access Denied: Only customers can report video reels.'));
    }

    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(404);
      return next(new Error('Reel not found'));
    }

    const reel = await Reel.findById(req.params.id);
    if (!reel) {
      res.status(404);
      return next(new Error('Reel not found'));
    }

    const userId = req.user.id;
    const { reason, description } = req.body;

    // Use atomic update to prevent duplicate report spamming and race conditions
    const updatedReel = await Reel.findOneAndUpdate(
      { _id: req.params.id, 'reports.user': { $ne: userId } },
      { 
        $push: { 
          reports: { 
            user: userId, 
            reason: reason || 'Other', 
            description: description || '' 
          } 
        },
        $set: { isFlagged: true }
      },
      { new: true }
    );

    if (!updatedReel) {
      res.status(400);
      return next(new Error('You have already submitted a report for this reel.'));
    }

    res.json({
      success: true,
      message: 'Reel reported successfully. Thank you for keeping Savoré safe!',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadReel,
  getReelsFeed,
  toggleLikeReel,
  addCommentToReel,
  trackReelView,
  trackReelOrderClick,
  trackReelImpression,
  trackReelClick,
  getOwnerReels,
  updateReel,
  deleteReel,
  reportReel,
};

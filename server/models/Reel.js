const mongoose = require('mongoose');

const reelSchema = new mongoose.Schema(
  {
    videoUrl: {
      type: String,
      required: [true, 'Please provide a video URL'],
    },
    caption: {
      type: String,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    featuredDish: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodItem',
      required: [true, 'Please provide a featured menu dish for this reel'],
    },
    city: {
      type: String,
      default: '',
      trim: true,
    },
    state: {
      type: String,
      default: '',
      trim: true,
    },
    locality: {
      type: String,
      default: '',
      trim: true,
    },
    region: {
      type: String,
      default: '',
      trim: true,
    },
    cuisineType: {
      type: String,
      default: '',
      trim: true,
    },
    thumbnailUrl: {
      type: String,
      default: '',
      trim: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    views: {
      type: Number,
      default: 0,
    },
    impressions: {
      type: Number,
      default: 0,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
      },
    ],
    orderNowClicks: {
      type: Number,
      default: 0, // Analytical metric for tracking Click-Through Rate
    },
    orderConversions: {
      type: Number,
      default: 0, // Analytical metric for tracking checkout conversions
    },
  },
  {
    timestamps: true,
  }
);

// Virtual property to calculate dynamic Rule-Based Recommendation Score
// Formula: score = (likes * 2) + (comments * 1.5) + (views * 0.5) + recencyBoost
// Recency boosts are calculated inside the controller relative to current query date
reelSchema.virtual('trendingScore').get(function () {
  const likesCount = this.likes ? this.likes.length : 0;
  const commentsCount = this.comments ? this.comments.length : 0;
  return likesCount * 2 + commentsCount * 1.5 + this.views * 0.5;
});

// Compound indexes for high-speed, scalable regional discovery queries
reelSchema.index({ city: 1, state: 1, region: 1 });
reelSchema.index({ cuisineType: 1, city: 1 });

module.exports = mongoose.model('Reel', reelSchema);

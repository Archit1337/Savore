const mongoose = require('mongoose');

const reelEventSchema = new mongoose.Schema(
  {
    reel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reel',
      required: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    eventType: {
      type: String,
      enum: ['impression', 'click_order', 'click'],
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// High-speed analytical indexes for range queries and groupings
reelEventSchema.index({ restaurant: 1, eventType: 1, createdAt: 1 });
reelEventSchema.index({ reel: 1, eventType: 1 });

module.exports = mongoose.model('ReelEvent', reelEventSchema);

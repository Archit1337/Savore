const mongoose = require('mongoose');

const partnershipRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    restaurantName: {
      type: String,
      required: [true, 'Please provide a restaurant name'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    coverImage: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      default: 'Mumbai',
      trim: true,
    },
    locality: {
      type: String,
      default: 'Bandra',
      trim: true,
    },
    state: {
      type: String,
      default: 'Maharashtra',
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, 'Please provide a pincode'],
      trim: true,
    },
    priceRange: {
      type: String,
      enum: ['₹', '₹₹', '₹₹₹', '₹₹₹₹'],
      default: '₹₹',
    },
    cuisines: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminNotes: {
      type: String,
      default: '',
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PartnershipRequest', partnershipRequestSchema);

const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
  {
    name: {
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
    rating: {
      type: Number,
      default: 5.0,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    deliveryTime: {
      type: Number,
      default: 30, // in minutes
    },
    deliveryFee: {
      type: Number,
      default: 0.0,
    },
    tags: {
      type: [String],
      default: [], // e.g. ["Michelin Starred", "Tasting Menu"]
    },
    cuisines: {
      type: [String],
      default: [], // e.g. ["Sushi", "Italian", "Desserts"]
    },
    revenue: {
      type: Number,
      default: 0.0, // SaaS-grade revenue tracking per merchant
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    timings: {
      type: String,
      default: '11:00 AM - 11:00 PM',
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
      default: '',
      trim: true,
    },
    priceRange: {
      type: String,
      enum: ['₹', '₹₹', '₹₹₹', '₹₹₹₹'],
      default: '₹₹',
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [72.8258, 19.0596],
      },
    },
    deliveryRadius: {
      type: Number,
      default: 10,
    },
    serviceableZones: {
      type: [String],
      default: [],
    },
    upiVpa: {
      type: String,
      default: '',
      trim: true,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    notifications: [
      {
        title: {
          type: String,
          required: true,
        },
        message: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          default: 'info',
        },
        details: {
          reelCaption: String,
          removedBy: {
            type: String,
            enum: ['admin', 'system'],
          },
          reason: String,
          description: String,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        isRead: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

restaurantSchema.index({ coordinates: '2dsphere' });
restaurantSchema.index({ isSuspended: 1, city: 1 });

module.exports = mongoose.model('Restaurant', restaurantSchema);

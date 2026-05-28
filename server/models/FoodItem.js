const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a food item name'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
      min: [0, 'Price cannot be negative'],
    },
    image: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      required: [true, 'Please provide a menu category'], // e.g. "Signature Dishes", "Appetizers"
      trim: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('FoodItem', foodItemSchema);

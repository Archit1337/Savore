const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    items: [
      {
        foodItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'FoodItem',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, 'Quantity must be at least 1'],
        },
        price: {
          type: Number,
          required: true, // Price locked at purchase time
        },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
    },
    deliveryFee: {
      type: Number,
      default: 0.0,
    },
    tax: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['COD', 'CARD', 'ONLINE'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true, // Allows nulls to exist without breaking unique constraint, vital for COD or pending card charges
    },
    status: {
      type: String,
      enum: [
        'pending',
        'preparing',
        'ready',
        'out_for_delivery',
        'delivered',
        'cancelled',
      ],
      default: 'pending',
    },
    deliveryAddress: {
      type: String,
      required: [true, 'Please provide a delivery address'],
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ restaurant: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);

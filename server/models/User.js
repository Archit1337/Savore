const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Please provide a username'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['customer', 'restaurant', 'admin'],
      default: 'customer',
    },
    address: {
      type: String,
      default: '',
    },
    name: {
      type: String,
      default: '',
    },
    preferences: {
      dietary: {
        type: String,
        enum: ['Any', 'Vegetarian', 'Vegan', 'Halal', 'Gluten-Free'],
        default: 'Any',
      },
      spicyLevel: {
        type: String,
        enum: ['Mild', 'Medium', 'Hot', 'Extra Hot'],
        default: 'Medium',
      },
    },
    addresses: [
      {
        houseNumber: { type: String, default: '' },
        street: { type: String, default: '' },
        area: { type: String, default: '' },
        landmark: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        pincode: { type: String, default: '' },
        addressType: {
          type: String,
          enum: ['Home', 'Work', 'Apartment', 'Other'],
          default: 'Home',
        },
        isDefault: { type: Boolean, default: false },
      },
    ],
    profilePicture: {
      type: String,
      default: '',
    },
    savedReels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reel',
      },
    ],
    bio: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    savedRestaurants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
      },
    ],
    favoriteDishes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoodItem',
      },
    ],
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    refreshTokens: {
      type: [String],
      default: [],
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

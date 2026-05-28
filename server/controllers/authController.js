const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Reel = require('../models/Reel');
const Comment = require('../models/Comment');
const Restaurant = require('../models/Restaurant');
const FoodItem = require('../models/FoodItem');


const generateAccessToken = (id) => {
  const secret = process.env.JWT_SECRET || 'savore_saas_jwt_secret_token_2026';
  return jwt.sign({ id }, secret, { expiresIn: '1h' });
};

const generateRefreshToken = (id) => {
  const secret = process.env.JWT_REFRESH_SECRET || 'savore_saas_jwt_refresh_secret_token_2026';
  return jwt.sign({ id }, secret, { expiresIn: '7d' });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { username, email, password, role, address } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      res.status(400);
      return next(new Error('User with this email or username already exists'));
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      role: role || 'customer',
      address: address || '',
    });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to user model
    user.refreshTokens.push(refreshToken);
    await user.save();

    res.status(201).json({ // 201 Created
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        name: user.name || '',
        email: user.email,
        role: user.role,
        address: user.address,
        profilePicture: user.profilePicture,
        preferences: user.preferences,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log(`\n[AUTH DIAGNOSTICS] ==========================================`);
    console.log(`[AUTH DIAGNOSTICS] Login attempt for: ${email}`);

    // Check database connection and environment
    if (!process.env.JWT_SECRET) {
      console.warn(`[AUTH DIAGNOSTICS] WARNING: JWT_SECRET environment variable is missing, falling back to default.`);
    }

    // Find user and include password and refreshTokens explicitly
    const user = await User.findOne({ email }).select('+password +refreshTokens');
    if (!user) {
      console.error(`[AUTH DIAGNOSTICS] LOGIN FAILURE: No user found in MongoDB with email: ${email}`);
      res.status(401);
      return next(new Error('Invalid email or password'));
    }

    console.log(`[AUTH DIAGNOSTICS] User lookup successful. Role: ${user.role}`);
    console.log(`[AUTH DIAGNOSTICS] Stored Hashed Password from DB: ${user.password}`);

    // Perform bcrypt comparison
    const isMatch = await user.matchPassword(password);
    console.log(`[AUTH DIAGNOSTICS] Bcrypt comparison outcome for entered password: ${isMatch}`);

    if (!isMatch) {
      console.error(`[AUTH DIAGNOSTICS] LOGIN FAILURE: Password comparison failed for user: ${email}`);
      res.status(401);
      return next(new Error('Invalid email or password'));
    }

    // Token signing
    console.log(`[AUTH DIAGNOSTICS] Generating JWT Access and Refresh tokens for user id: ${user._id}`);
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    console.log(`[AUTH DIAGNOSTICS] Tokens generated. Access Token prefix: ${accessToken.substring(0, 15)}...`);

    // Store refresh token
    user.refreshTokens.push(refreshToken);
    await user.save();
    console.log(`[AUTH DIAGNOSTICS] Session refresh token successfully saved in MongoDB.`);
    console.log(`[AUTH DIAGNOSTICS] SUCCESSFUL AUTHENTICATION FOR: ${email}`);
    console.log(`[AUTH DIAGNOSTICS] ==========================================\n`);

    res.json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        name: user.name || '',
        email: user.email,
        role: user.role,
        address: user.address,
        profilePicture: user.profilePicture,
        preferences: user.preferences,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error(`\n[AUTH DIAGNOSTICS] FATAL LOGIN EXCEPTION:`, error);
    console.error(`[AUTH DIAGNOSTICS] ==========================================\n`);
    next(error);
  }
};

// @desc    Refresh session access token
// @route   POST /api/auth/refresh
// @access  Public
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400);
      return next(new Error('Refresh token is required'));
    }

    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'savore_saas_jwt_refresh_secret_token_2026';
    let decoded;
    
    try {
      decoded = jwt.verify(refreshToken, refreshSecret);
    } catch (err) {
      res.status(401);
      return next(new Error('Stale or invalid refresh token. Access denied.'));
    }

    const user = await User.findById(decoded.id).select('+refreshTokens');
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      res.status(401);
      return next(new Error('Refresh token is not active or user was deleted'));
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user._id);

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout / Revoke Refresh Token
// @route   POST /api/auth/logout
// @access  Public (accepts token to revoke)
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      const refreshSecret = process.env.JWT_REFRESH_SECRET || 'savore_saas_jwt_refresh_secret_token_2026';
      try {
        const decoded = jwt.verify(refreshToken, refreshSecret);
        const user = await User.findById(decoded.id);
        if (user) {
          user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);
          await user.save();
        }
      } catch (err) {
        // Token verification failed or user doesn't exist, ignore and complete logout
      }
    }

    res.json({
      success: true,
      data: {},
      message: 'Logged out successfully. Tokens revoked.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }
    res.json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        name: user.name || '',
        email: user.email,
        role: user.role,
        address: user.address,
        profilePicture: user.profilePicture,
        phone: user.phone || '',
        bio: user.bio || '',
        preferences: user.preferences,
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile details
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, username, email, phone, bio, address, preferences } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        res.status(400);
        return next(new Error('Email is already taken'));
      }
      user.email = email;
    }

    if (username && username !== user.username) {
      const usernameExists = await User.findOne({ username });
      if (usernameExists) {
        res.status(400);
        return next(new Error('Username is already taken'));
      }
      user.username = username;
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (bio !== undefined) user.bio = bio;
    if (address !== undefined) user.address = address;
    if (req.body.profilePicture !== undefined) user.profilePicture = req.body.profilePicture;
    if (preferences !== undefined) {
      if (preferences.dietary !== undefined) user.preferences.dietary = preferences.dietary;
      if (preferences.spicyLevel !== undefined) user.preferences.spicyLevel = preferences.spicyLevel;
    }

    await user.save();

    res.json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        name: user.name || '',
        email: user.email,
        role: user.role,
        address: user.address,
        profilePicture: user.profilePicture,
        phone: user.phone || '',
        bio: user.bio || '',
        preferences: user.preferences,
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user password
// @route   PUT /api/auth/password
// @access  Private
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400);
      return next(new Error('Current password and new password are required'));
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      res.status(401);
      return next(new Error('Incorrect current password'));
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload avatar picture
// @route   POST /api/auth/avatar
// @access  Private
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      return next(new Error('Please upload an avatar image file'));
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    const avatarUrl = `/uploads/${req.file.filename}`;
    user.profilePicture = avatarUrl;
    await user.save();

    res.json({
      success: true,
      data: {
        profilePicture: avatarUrl,
      },
      message: 'Avatar uploaded successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user liked reels, comments log, and saved restaurants
// @route   GET /api/auth/social
// @access  Private
const getUserSocialHistory = async (req, res, next) => {
  try {
    const likedReels = await Reel.find({ likes: req.user.id })
      .populate('restaurant', 'name coverImage')
      .sort({ createdAt: -1 });

    const rawComments = await Comment.find({ user: req.user.id }).sort({ createdAt: -1 });
    const commentsLog = [];

    for (const c of rawComments) {
      const r = await Reel.findOne({ comments: c._id }).populate('restaurant', 'name');
      if (r) {
        commentsLog.push({
          commentId: c._id,
          text: c.text,
          createdAt: c.createdAt,
          reelId: r._id,
          reelCaption: r.caption,
          restaurantName: r.restaurant?.name || 'Savoré Kitchen'
        });
      }
    }

    const user = await User.findById(req.user.id)
      .populate({
        path: 'savedRestaurants',
        select: 'name description coverImage rating deliveryTime deliveryFee cuisines tags timings'
      })
      .populate({
        path: 'favoriteDishes',
        select: 'name description price image category restaurant',
        populate: {
          path: 'restaurant',
          select: 'name'
        }
      });

    res.json({
      success: true,
      data: {
        likedReels: likedReels || [],
        comments: commentsLog || [],
        savedRestaurants: user.savedRestaurants || [],
        favoriteDishes: user.favoriteDishes || [],
        phone: user.phone || '',
        bio: user.bio || '',
        addresses: user.addresses || [],
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle favorite restaurant state
// @route   POST /api/auth/restaurants/:id/favorite
// @access  Private
const toggleFavoriteRestaurant = async (req, res, next) => {
  try {
    const restaurantId = req.params.id;
    if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
      res.status(404);
      return next(new Error('Restaurant not found'));
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      res.status(404);
      return next(new Error('Restaurant not found'));
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    const isSaved = user.savedRestaurants.includes(restaurantId);
    if (isSaved) {
      user.savedRestaurants = user.savedRestaurants.filter(id => id.toString() !== restaurantId);
    } else {
      user.savedRestaurants.push(restaurantId);
    }

    await user.save();

    res.json({
      success: true,
      isSaved: !isSaved,
      message: isSaved ? 'Removed from saved kitchens' : 'Added to saved kitchens'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle favorite dish state
// @route   POST /api/auth/dishes/:id/favorite
// @access  Private
const toggleFavoriteDish = async (req, res, next) => {
  try {
    const dishId = req.params.id;
    if (!dishId || !mongoose.Types.ObjectId.isValid(dishId)) {
      res.status(404);
      return next(new Error('Dish not found'));
    }

    const dish = await FoodItem.findById(dishId);
    if (!dish) {
      res.status(404);
      return next(new Error('Dish not found'));
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    const isFav = user.favoriteDishes.includes(dishId);
    if (isFav) {
      user.favoriteDishes = user.favoriteDishes.filter(id => id.toString() !== dishId);
    } else {
      user.favoriteDishes.push(dishId);
    }

    await user.save();

    res.json({
      success: true,
      isFavorite: !isFav,
      message: isFav ? 'Removed from favorite dishes' : 'Added to favorite dishes'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user saved addresses
// @route   GET /api/auth/addresses
// @access  Private
const getAddresses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }
    res.json({
      success: true,
      data: user.addresses || []
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add new saved address
// @route   POST /api/auth/addresses
// @access  Private
const addAddress = async (req, res, next) => {
  try {
    const { houseNumber, street, area, landmark, city, state, pincode, addressType, isDefault } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    const newAddress = {
      houseNumber: houseNumber || '',
      street: street || '',
      area: area || '',
      landmark: landmark || '',
      city: city || 'Mumbai',
      state: state || 'Maharashtra',
      pincode: pincode || '',
      addressType: addressType || 'Home',
      isDefault: !!isDefault || user.addresses.length === 0
    };

    if (newAddress.isDefault) {
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    user.addresses.push(newAddress);
    await user.save();

    res.status(201).json({
      success: true,
      data: user.addresses[user.addresses.length - 1],
      message: 'Address added successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a saved address
// @route   PUT /api/auth/addresses/:id
// @access  Private
const editAddress = async (req, res, next) => {
  try {
    const { houseNumber, street, area, landmark, city, state, pincode, addressType, isDefault } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    const address = user.addresses.id(req.params.id);
    if (!address) {
      res.status(404);
      return next(new Error('Address not found'));
    }

    if (houseNumber !== undefined) address.houseNumber = houseNumber;
    if (street !== undefined) address.street = street;
    if (area !== undefined) address.area = area;
    if (landmark !== undefined) address.landmark = landmark;
    if (city !== undefined) address.city = city;
    if (state !== undefined) address.state = state;
    if (pincode !== undefined) address.pincode = pincode;
    if (addressType !== undefined) address.addressType = addressType;
    if (isDefault !== undefined) {
      address.isDefault = !!isDefault;
      if (address.isDefault) {
        user.addresses.forEach(addr => {
          if (addr._id.toString() !== req.params.id) {
            addr.isDefault = false;
          }
        });
      }
    }

    await user.save();

    res.json({
      success: true,
      data: address,
      message: 'Address updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a saved address
// @route   DELETE /api/auth/addresses/:id
// @access  Private
const deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    const address = user.addresses.id(req.params.id);
    if (!address) {
      res.status(404);
      return next(new Error('Address not found'));
    }

    const wasDefault = address.isDefault;
    user.addresses.pull(req.params.id);

    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.json({
      success: true,
      data: {},
      message: 'Address deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Set default delivery address
// @route   PUT /api/auth/addresses/:id/default
// @access  Private
const setDefaultAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    const address = user.addresses.id(req.params.id);
    if (!address) {
      res.status(404);
      return next(new Error('Address not found'));
    }

    user.addresses.forEach(addr => {
      addr.isDefault = addr._id.toString() === req.params.id;
    });

    await user.save();

    res.json({
      success: true,
      data: address,
      message: 'Default address set successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  updateProfile,
  updatePassword,
  uploadAvatar,
  getUserSocialHistory,
  toggleFavoriteRestaurant,
  toggleFavoriteDish,
  getAddresses,
  addAddress,
  editAddress,
  deleteAddress,
  setDefaultAddress,
};

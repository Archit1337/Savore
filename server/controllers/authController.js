const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Reel = require('../models/Reel');
const Comment = require('../models/Comment');
const Restaurant = require('../models/Restaurant');
const FoodItem = require('../models/FoodItem');
const PartnershipRequest = require('../models/PartnershipRequest');
const OTP = require('../models/OTP');
const { sendOTPEmail } = require('../utils/emailService');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');


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
      role: 'customer', // STOPS PRIVILEGE ESCALATION: Always force public sign-ups to be Customers
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

const addAddress = async (req, res, next) => {
  try {
    const { houseNumber, street, area, landmark, city, state, pincode, addressType, isDefault } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    // 1. Quota Limit: Enforce maximum of 15 saved addresses to prevent database bloat/abuse
    if (user.addresses && user.addresses.length >= 15) {
      res.status(400);
      return next(new Error('You have reached the maximum limit of 15 saved addresses. Please delete an address before adding a new one.'));
    }

    // 2. Required Fields Validation: Ensure critical address details are provided
    if (!street?.trim() || !area?.trim() || !city?.trim() || !state?.trim() || !pincode?.trim()) {
      res.status(400);
      return next(new Error('Required address fields (Street, Area, City, State, Pincode) cannot be empty.'));
    }

    // 3. Indian Pincode Format Validation: Must be exactly 6 digits
    if (pincode && !/^\d{6}$/.test(pincode.trim())) {
      res.status(400);
      return next(new Error('Pincode must be exactly 6 digits.'));
    }

    const newAddress = {
      houseNumber: houseNumber ? houseNumber.trim() : '',
      street: street.trim(),
      area: area.trim(),
      landmark: landmark ? landmark.trim() : '',
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
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

    // Validation checks for updates
    if (pincode !== undefined && !/^\d{6}$/.test(pincode.trim())) {
      res.status(400);
      return next(new Error('Pincode must be exactly 6 digits.'));
    }
    if (street !== undefined && !street.trim()) {
      res.status(400);
      return next(new Error('Street cannot be empty.'));
    }
    if (area !== undefined && !area.trim()) {
      res.status(400);
      return next(new Error('Area cannot be empty.'));
    }
    if (city !== undefined && !city.trim()) {
      res.status(400);
      return next(new Error('City cannot be empty.'));
    }
    if (state !== undefined && !state.trim()) {
      res.status(400);
      return next(new Error('State cannot be empty.'));
    }

    if (houseNumber !== undefined) address.houseNumber = houseNumber.trim();
    if (street !== undefined) address.street = street.trim();
    if (area !== undefined) address.area = area.trim();
    if (landmark !== undefined) address.landmark = landmark ? landmark.trim() : '';
    if (city !== undefined) address.city = city.trim();
    if (state !== undefined) address.state = state.trim();
    if (pincode !== undefined) address.pincode = pincode.trim();
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

// @desc    Delete user account / profile
// @route   DELETE /api/auth/profile
// @access  Private
const deleteAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    // Perform database deletion
    await User.findByIdAndDelete(req.user.id);

    res.json({
      success: true,
      data: {},
      message: 'Your account has been permanently deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit a new partnership request
// @route   POST /api/auth/become-partner
// @access  Private
const becomePartner = async (req, res, next) => {
  try {
    const { 
      restaurantName, 
      description, 
      coverImage, 
      city, 
      locality, 
      state, 
      pincode, 
      priceRange, 
      cuisines, 
      tags 
    } = req.body;

    if (!restaurantName) {
      res.status(400);
      return next(new Error('Restaurant name is required'));
    }
    if (!pincode) {
      res.status(400);
      return next(new Error('Pincode is required'));
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    if (user.role !== 'customer') {
      res.status(400);
      return next(new Error('Only customer accounts can request to partner'));
    }

    // Check if there is an active/pending partnership request or if they already have one approved
    const existingRequest = await PartnershipRequest.findOne({ 
      user: req.user.id, 
      status: { $in: ['pending', 'approved'] } 
    });

    if (existingRequest) {
      res.status(400);
      return next(new Error(`You already have a partnership request in status: ${existingRequest.status}`));
    }

    // Create a new partnership request
    const request = await PartnershipRequest.create({
      user: req.user.id,
      restaurantName,
      description: description || '',
      coverImage: coverImage || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
      city: city || 'Mumbai',
      locality: locality || 'Bandra',
      state: state || 'Maharashtra',
      pincode,
      priceRange: priceRange || '₹₹',
      cuisines: cuisines || [],
      tags: tags || []
    });

    res.status(201).json({
      success: true,
      data: request,
      message: 'Partnership application submitted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's active partnership request
// @route   GET /api/auth/partnership-request/my
// @access  Private
const getMyPartnershipRequest = async (req, res, next) => {
  try {
    const request = await PartnershipRequest.findOne({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all partnership requests (Admin only)
// @route   GET /api/auth/partnership-requests
// @access  Private/Admin
const getAllPartnershipRequests = async (req, res, next) => {
  try {
    const requests = await PartnershipRequest.find()
      .populate('user', 'username email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve partnership request (Admin only)
// @route   PUT /api/auth/partnership-requests/:id/approve
// @access  Private/Admin
const approvePartnershipRequest = async (req, res, next) => {
  try {
    const { adminNotes } = req.body;
    const request = await PartnershipRequest.findById(req.params.id);

    if (!request) {
      res.status(404);
      return next(new Error('Partnership request not found'));
    }

    if (request.status !== 'pending') {
      res.status(400);
      return next(new Error(`This request has already been ${request.status}`));
    }

    // Verify user exists
    const applicant = await User.findById(request.user);
    if (!applicant) {
      res.status(404);
      return next(new Error('Applicant user not found'));
    }

    // Check if they already own a restaurant
    const existingRestaurant = await Restaurant.findOne({ owner: request.user });
    if (existingRestaurant) {
      res.status(400);
      return next(new Error('This user already owns a registered restaurant'));
    }

    // Create the operational Restaurant document
    const restaurant = await Restaurant.create({
      name: request.restaurantName,
      description: request.description,
      coverImage: request.coverImage || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80',
      city: request.city,
      locality: request.locality,
      state: request.state,
      pincode: request.pincode,
      priceRange: request.priceRange,
      cuisines: request.cuisines,
      tags: request.tags,
      owner: request.user,
      coordinates: {
        type: 'Point',
        coordinates: [72.8258, 19.0596] // standard Mumbai fallback coordinates
      }
    });

    // Update applicant role to 'restaurant'
    applicant.role = 'restaurant';
    await applicant.save();

    // Update partnership request status
    request.status = 'approved';
    if (adminNotes !== undefined) request.adminNotes = adminNotes;
    await request.save();

    res.json({
      success: true,
      data: request,
      restaurant,
      message: 'Partnership request approved and restaurant registered successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject partnership request (Admin only)
// @route   PUT /api/auth/partnership-requests/:id/reject
// @access  Private/Admin
const rejectPartnershipRequest = async (req, res, next) => {
  try {
    const { adminNotes } = req.body;
    const request = await PartnershipRequest.findById(req.params.id);

    if (!request) {
      res.status(404);
      return next(new Error('Partnership request not found'));
    }

    if (request.status !== 'pending') {
      res.status(400);
      return next(new Error(`This request has already been ${request.status}`));
    }

    // Update partnership request status
    request.status = 'rejected';
    request.adminNotes = adminNotes || 'Application does not meet our active operational requirements.';
    await request.save();

    res.json({
      success: true,
      data: request,
      message: 'Partnership request rejected successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate OTP and send it via email
// @route   POST /api/auth/otp/generate
// @access  Public
const generateOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400);
      return next(new Error('Please provide an email address'));
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if the user is already signed up (required per flow)
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(404);
      return next(new Error('This email is not registered. Please sign up first.'));
    }

    // Generate secure 6-digit OTP
    const rawOtp = crypto.randomInt(100000, 1000000).toString();

    // Hash the OTP using bcryptjs
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(rawOtp, salt);

    // Set expiration to 5 minutes from now
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Delete any existing OTP entries for this email
    await OTP.deleteMany({ email: normalizedEmail });

    // Store hashed OTP in database
    await OTP.create({
      email: normalizedEmail,
      otpHash,
      expiresAt,
    });

    // Send email with raw OTP code
    await sendOTPEmail(normalizedEmail, rawOtp);

    res.status(200).json({
      success: true,
      message: 'A secure 6-digit verification code has been sent to your email.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP and log user in
// @route   POST /api/auth/otp/verify
// @access  Public
const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400);
      return next(new Error('Please provide an email and OTP passcode'));
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Fetch active OTP document
    const otpDoc = await OTP.findOne({ email: normalizedEmail });
    if (!otpDoc) {
      res.status(400);
      return next(new Error('The verification code has expired or does not exist. Please request a new one.'));
    }

    // Check brute-force attempts
    if (otpDoc.attempts >= 3) {
      await OTP.deleteOne({ _id: otpDoc._id });
      res.status(400);
      return next(new Error('Too many failed attempts. This code has been invalidated. Please request a new one.'));
    }

    // Compare raw entered OTP with stored bcrypt hash
    const isMatch = await bcrypt.compare(otp, otpDoc.otpHash);
    if (!isMatch) {
      otpDoc.attempts += 1;
      await otpDoc.save();

      const remainingAttempts = 3 - otpDoc.attempts + 1; // plus 1 because the 4th failed attempt invalidates
      res.status(400);
      return next(new Error(`Invalid verification code. You have ${remainingAttempts} attempts remaining.`));
    }

    // Success! Immediately delete the OTP document to prevent reuse (replay attacks)
    await OTP.deleteOne({ _id: otpDoc._id });

    // Find and log in user
    const user = await User.findOne({ email: normalizedEmail }).select('+refreshTokens');
    if (!user) {
      res.status(404);
      return next(new Error('User not found.'));
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshTokens.push(refreshToken);
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
        preferences: user.preferences,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request password reset link
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400);
      return next(new Error('Please provide an email address'));
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      res.status(404);
      return next(new Error('No account registered with this email address.'));
    }

    // Generate secure random reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Store secure SHA-256 hash in database
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordToken = tokenHash;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    // Construct frontend reset page URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    try {
      const { sendResetEmail } = require('../utils/emailService');
      await sendResetEmail(normalizedEmail, resetUrl);
      
      res.json({
        success: true,
        message: 'Password reset instructions have been dispatched to your email.',
      });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res.status(500);
      return next(new Error('Email dispatch failed. Please try again.'));
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Verify reset token and update password
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      res.status(400);
      return next(new Error('Please provide a new password (min. 6 characters).'));
    }

    // Re-create SHA-256 hash to compare with stored value
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+refreshTokens');

    if (!user) {
      res.status(400);
      return next(new Error('Invalid or expired password reset token.'));
    }

    // Set new password (pre-save middleware hashes it automatically)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    // Invalidate existing sessions for security
    user.refreshTokens = [];

    await user.save();

    res.json({
      success: true,
      message: 'Password successfully updated. You can now log in.',
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
  deleteAccount,
  becomePartner,
  getMyPartnershipRequest,
  getAllPartnershipRequests,
  approvePartnershipRequest,
  rejectPartnershipRequest,
  generateOTP,
  verifyOTP,
  forgotPassword,
  resetPassword,
};

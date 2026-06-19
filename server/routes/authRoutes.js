const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middleware/validators');
const { protect, requireRole } = require('../middleware/authMiddleware');
const { uploadImage } = require('../middleware/uploadMiddleware');
const rateLimit = require('express-rate-limit');

// Rate limiter for OTP generation: maximum 2 requests per minute to prevent mail spamming
const otpGenerateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 2,
  message: {
    success: false,
    message: 'Too many OTP requests. Please wait 60 seconds before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for password reset requests to prevent abuse
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 attempts per window
  message: {
    success: false,
    message: 'Too many password reset requests. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password/:token', passwordResetLimiter, resetPassword);
router.post('/otp/generate', otpGenerateLimiter, generateOTP);
router.post('/otp/verify', verifyOTP);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', protect, getMe);

// User Profile & Settings Paths
router.put('/profile', protect, updateProfile);
router.delete('/profile', protect, deleteAccount);
router.put('/password', protect, updatePassword);
router.post('/avatar', protect, uploadImage.single('avatar'), uploadAvatar);
router.get('/social', protect, getUserSocialHistory);
router.post('/restaurants/:id/favorite', protect, toggleFavoriteRestaurant);
router.post('/dishes/:id/favorite', protect, toggleFavoriteDish);

// Partnership Onboarding & Moderation Paths
router.post('/become-partner', protect, becomePartner);
router.get('/partnership-request/my', protect, getMyPartnershipRequest);
router.get('/partnership-requests', protect, requireRole(['admin']), getAllPartnershipRequests);
router.put('/partnership-requests/:id/approve', protect, requireRole(['admin']), approvePartnershipRequest);
router.put('/partnership-requests/:id/reject', protect, requireRole(['admin']), rejectPartnershipRequest);

// User Address Management Paths
router.get('/addresses', protect, getAddresses);
router.post('/addresses', protect, addAddress);
router.put('/addresses/:id', protect, editAddress);
router.delete('/addresses/:id', protect, deleteAddress);
router.put('/addresses/:id/default', protect, setDefaultAddress);

module.exports = router;

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
} = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middleware/validators');
const { protect } = require('../middleware/authMiddleware');
const { uploadImage } = require('../middleware/uploadMiddleware');

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
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

// User Address Management Paths
router.get('/addresses', protect, getAddresses);
router.post('/addresses', protect, addAddress);
router.put('/addresses/:id', protect, editAddress);
router.delete('/addresses/:id', protect, deleteAddress);
router.put('/addresses/:id/default', protect, setDefaultAddress);

module.exports = router;

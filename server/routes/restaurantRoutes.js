const express = require('express');
const router = express.Router();
const {
  getRestaurants,
  getRestaurantById,
  createRestaurant,
  getOwnerAnalytics,
  getOwnerRestaurant,
  updateOwnerRestaurant,
  getOwnerComments,
  markNotificationRead,
} = require('../controllers/restaurantController');
const { validateRestaurant } = require('../middleware/validators');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.get('/', getRestaurants);
router.get('/owner/analytics', protect, requireRole(['restaurant', 'admin']), getOwnerAnalytics);
router.get('/owner/details', protect, requireRole(['restaurant', 'admin']), getOwnerRestaurant);
router.put('/owner/details', protect, requireRole(['restaurant', 'admin']), updateOwnerRestaurant);
router.get('/owner/comments', protect, requireRole(['restaurant', 'admin']), getOwnerComments);
router.put('/owner/notifications/:id/read', protect, requireRole(['restaurant', 'admin']), markNotificationRead);
router.get('/:id', getRestaurantById);
router.post('/', protect, requireRole(['restaurant', 'admin']), validateRestaurant, createRestaurant);

module.exports = router;

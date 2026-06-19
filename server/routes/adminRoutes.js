const express = require('express');
const router = express.Router();
const {
  getUsers,
  suspendUser,
  changeUserRole,
  getRestaurants,
  suspendRestaurant,
  getFlaggedReels,
  dismissReelReports,
  deleteReel,
  getAdminStats,
  getAdminLogs,
} = require('../controllers/adminController');
const { protect, requireRole } = require('../middleware/authMiddleware');

// Lock down all admin routes to only users with the 'admin' role
router.use(protect);
router.use(requireRole(['admin']));

router.get('/stats', getAdminStats);
router.get('/logs', getAdminLogs);

router.get('/users', getUsers);
router.put('/users/:id/suspend', suspendUser);
router.put('/users/:id/role', changeUserRole);

router.get('/restaurants', getRestaurants);
router.put('/restaurants/:id/suspend', suspendRestaurant);

router.get('/reels', getFlaggedReels);
router.put('/reels/:id/dismiss', dismissReelReports);
router.delete('/reels/:id', deleteReel);

module.exports = router;

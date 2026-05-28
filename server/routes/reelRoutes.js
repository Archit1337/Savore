const express = require('express');
const router = express.Router();
const {
  uploadReel,
  getReelsFeed,
  toggleLikeReel,
  addCommentToReel,
  trackReelView,
  trackReelOrderClick,
  getOwnerReels,
  updateReel,
  deleteReel,
} = require('../controllers/reelController');
const { protect, requireRole } = require('../middleware/authMiddleware');
const { uploadVideo } = require('../middleware/uploadMiddleware');

// Get short-form reels feed (Public)
router.get('/', getReelsFeed);

// Get owner specific reels (Private)
router.get('/owner', protect, requireRole(['restaurant', 'admin']), getOwnerReels);

// Upload a new reel (Restaurant Owners / Admin)
router.post(
  '/',
  protect,
  requireRole(['restaurant', 'admin']),
  uploadVideo.single('video'),
  uploadReel
);

// Toggle reel likes
router.post('/:id/like', protect, toggleLikeReel);

// Add comment to reel
router.post('/:id/comments', protect, addCommentToReel);

// Track analytic clicks and views (Public)
router.post('/:id/view', trackReelView);
router.post('/:id/click-order', trackReelOrderClick);

// Edit/Delete Reels (Private)
router.put('/:id', protect, requireRole(['restaurant', 'admin']), updateReel);
router.delete('/:id', protect, requireRole(['restaurant', 'admin']), deleteReel);

module.exports = router;

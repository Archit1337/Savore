const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

// Rate limiter for reporting reels to prevent automated spam attacks
const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 reports per 15 minutes per IP
  message: {
    success: false,
    error: 'Too many reports submitted. Please wait 15 minutes before submitting another report.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
const {
  uploadReel,
  getReelsFeed,
  toggleLikeReel,
  addCommentToReel,
  trackReelView,
  trackReelOrderClick,
  trackReelImpression,
  trackReelClick,
  getOwnerReels,
  updateReel,
  deleteReel,
  reportReel,
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

// Report/Flag reel for content moderation
router.post('/:id/report', protect, reportLimiter, reportReel);

// Track analytic clicks and views (Public)
router.post('/:id/view', trackReelView);
router.post('/:id/click-order', trackReelOrderClick);
router.post('/:id/impression', trackReelImpression);
router.post('/:id/click', trackReelClick);

// Edit/Delete Reels (Private)
router.put('/:id', protect, requireRole(['restaurant', 'admin']), updateReel);
router.delete('/:id', protect, requireRole(['restaurant', 'admin']), deleteReel);

module.exports = router;

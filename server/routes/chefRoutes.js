const express = require('express');
const router = express.Router();
const { chat, recommend } = require('../controllers/chefController');
const { protect } = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');

// Stricter rate-limiter for expensive AI Chef operations (max 15 requests per 15 minutes per IP/session)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: {
    success: false,
    error: 'Too many culinary inquiries. Please let the Chef rest and try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/chat', protect, aiLimiter, chat);
router.post('/recommend', protect, aiLimiter, recommend);

module.exports = router;

const express = require('express');
const router = express.Router();
const { chat, recommend } = require('../controllers/chefController');
const { protect } = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');

// Rate-limiter for AI Chef operations (60 requests per 15 minutes per IP)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: {
    success: false,
    error: 'Too many culinary inquiries. Please let the Chef rest and try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/chat', protect, aiLimiter, chat);
router.post('/recommend', aiLimiter, recommend);

module.exports = router;

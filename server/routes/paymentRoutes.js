const express = require('express');
const router = express.Router();
const { createPaymentIntent, handleWebhook } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create-intent', protect, createPaymentIntent);
router.post('/webhook', handleWebhook);

module.exports = router;

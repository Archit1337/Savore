const express = require('express');
const router = express.Router();
const { createPaymentIntent, simulatePayment, handleWebhook } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create-intent', protect, createPaymentIntent);
router.post('/simulate-payment', protect, simulatePayment);
router.post('/webhook', handleWebhook);

module.exports = router;

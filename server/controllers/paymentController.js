const stripe = require('../config/stripe');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');

// @desc    Create a Stripe Payment Intent
// @route   POST /api/payment/create-intent
// @access  Private (Customer)
const createPaymentIntent = async (req, res, next) => {
  try {
    const { amount, currency = 'usd', orderId } = req.body;

    if (!amount || amount <= 0) {
      res.status(400);
      return next(new Error('Invalid transaction amount'));
    }

    // Amount must be in cents for Stripe
    const stripeAmount = Math.round(amount * 100);

    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: stripeAmount,
      currency,
      metadata: {
        userId: req.user.id,
        orderId: orderId || '',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // If orderId is provided, pre-bind the transactionId lock
    if (orderId) {
      const order = await Order.findById(orderId);
      if (order) {
        order.transactionId = paymentIntent.id;
        await order.save();
      }
    }

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Stripe Webhook signature verified handler
// @route   POST /api/payment/webhook
// @access  Public (called securely by Stripe servers)
const handleWebhook = async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (endpointSecret && sig) {
      // In production, cryptographically reconstruct Stripe signature
      // requires express raw buffer parsing
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      // Dev mode fallback: accept mock events or body directly if secret not configured
      console.warn('⚠️ STRIPE_WEBHOOK_SECRET is unconfigured. Running in development bypass mode.');
      event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    }
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    res.status(400);
    return res.send(`Webhook Error: ${err.message}`);
  }

  // Handle the target payment intent event
  const eventType = event.type;
  
  if (eventType === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const transactionId = paymentIntent.id;

    console.log(`💰 Payment intent succeeded: ${transactionId}`);

    try {
      // Find the associated order using the transactionId
      const order = await Order.findOne({ transactionId });
      
      if (order) {
        // Idempotency check: avoid double-processing if webhook triggers multiple times
        if (order.paymentStatus !== 'paid') {
          order.paymentStatus = 'paid';
          order.status = 'preparing'; // Auto-transition order to preparing state
          await order.save();

          // Credit merchant revenues (SaaS metric)
          const restaurant = await Restaurant.findById(order.restaurant);
          if (restaurant) {
            restaurant.revenue = parseFloat((restaurant.revenue + order.subtotal).toFixed(2));
            await restaurant.save();
          }

          console.log(`✅ Order ${order._id} successfully marked as PAID from webhook.`);
        } else {
          console.log(`ℹ️ Order ${order._id} was already marked as PAID (idempotent ignore).`);
        }
      } else {
        console.error(`❌ Order with transactionId ${transactionId} not found in database.`);
      }
    } catch (dbError) {
      console.error(`Error processing webhook database update: ${dbError.message}`);
      return res.status(500).send(`Database error: ${dbError.message}`);
    }
  } else if (eventType === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object;
    const transactionId = paymentIntent.id;

    console.log(`❌ Payment intent failed: ${transactionId}`);

    try {
      const order = await Order.findOne({ transactionId });
      if (order && order.paymentStatus !== 'paid') {
        order.paymentStatus = 'failed';
        order.status = 'cancelled';
        await order.save();
        console.log(`❌ Order ${order._id} marked as FAILED/CANCELLED from webhook.`);
      }
    } catch (dbError) {
      console.error(`Error updating failed payment order: ${dbError.message}`);
    }
  }

  // Acknowledge event received
  res.json({ received: true });
};

module.exports = {
  createPaymentIntent,
  handleWebhook,
};

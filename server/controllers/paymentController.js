const stripe = require('../config/stripe');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const ProcessedWebhook = require('../models/ProcessedWebhook');
const mongoose = require('mongoose');

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
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      if (!sig || !endpointSecret) {
        res.status(400);
        return res.send('Webhook Error: Stripe signature headers or webhook secret are missing in production.');
      }
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      // Dev mode fallback: accept mock events or body directly, handles Buffer decode
      if (endpointSecret && sig) {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } else {
        console.warn('⚠️ STRIPE_WEBHOOK_SECRET is unconfigured. Running in development bypass mode.');
        const rawString = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : req.body;
        event = typeof rawString === 'string' ? JSON.parse(rawString) : rawString;
      }
    }
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    res.status(400);
    return res.send(`Webhook Error: ${err.message}`);
  }

  // Prevent duplicate execution of webhook events
  try {
    const isDuplicate = await ProcessedWebhook.findOne({ eventId: event.id });
    if (isDuplicate) {
      console.log(`ℹ️ Webhook Event ${event.id} already processed. Skipping...`);
      return res.status(200).json({ received: true, message: 'Duplicate event ignored.' });
    }
  } catch (err) {
    console.error('Error checking duplicate webhook events:', err.message);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Record event as processed immediately within session
    await ProcessedWebhook.create([{ eventId: event.id }], { session });

    // Handle the target payment intent event
    const eventType = event.type;
    
    if (eventType === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const transactionId = paymentIntent.id;

      console.log(`💰 Payment intent succeeded: ${transactionId}`);

      // Find the associated order using the transactionId
      const order = await Order.findOne({ transactionId }).session(session);
      
      if (order) {
        if (order.paymentStatus !== 'paid') {
          order.paymentStatus = 'paid';
          order.status = 'preparing'; // Auto-transition order to preparing state
          await order.save({ session });

          // Credit merchant revenues (SaaS metric)
          const restaurant = await Restaurant.findById(order.restaurant).session(session);
          if (restaurant && !order.isTestOrder) {
            restaurant.revenue = parseFloat((restaurant.revenue + order.subtotal).toFixed(2));
            await restaurant.save({ session });
          }

          console.log(`✅ Order ${order._id} successfully marked as PAID from webhook.`);
        }
      }
    } else if (eventType === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      const transactionId = paymentIntent.id;

      console.log(`❌ Payment intent failed: ${transactionId}`);

      const order = await Order.findOne({ transactionId }).session(session);
      if (order && order.paymentStatus !== 'paid') {
        order.paymentStatus = 'failed';
        order.status = 'cancelled';
        await order.save({ session });
        console.log(`❌ Order ${order._id} marked as FAILED/CANCELLED from webhook.`);
      }
    }

    await session.commitTransaction();
    session.endSession();

    // Trigger alerts outside transaction block to prevent holding socket lock in DB layer
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const order = await Order.findOne({ transactionId: paymentIntent.id });
      if (order) {
        const restaurant = await Restaurant.findById(order.restaurant);
        if (restaurant) {
          const io = req.app.get('io');
          if (io) {
            io.to(`merchant_${restaurant.owner.toString()}`).emit('new_order_alert', {
              orderId: order._id,
              total: order.total,
              status: order.status
            });
          }
        }
      }
    }

    res.json({ received: true });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(`Error processing webhook transaction: ${error.message}`);
    res.status(500).send(`Database transaction error: ${error.message}`);
  }
};

module.exports = {
  createPaymentIntent,
  handleWebhook,
};

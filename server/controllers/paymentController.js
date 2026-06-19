const stripe = require('../config/stripe');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const ProcessedWebhook = require('../models/ProcessedWebhook');
const mongoose = require('mongoose');

// @desc    Create a Stripe Payment Intent (Database Driven, Price Validated, IDOR Protected)
// @route   POST /api/payment/create-intent
// @access  Private (Customer)
const createPaymentIntent = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      res.status(400);
      return next(new Error('Invalid or missing orderId'));
    }

    // Fetch the order from DB to lock the correct amount
    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404);
      return next(new Error('Order not found'));
    }

    // IDOR Protection: Verify that the order belongs to the calling user
    if (order.user.toString() !== req.user.id) {
      res.status(403);
      return next(new Error('Access Forbidden: You do not own this order'));
    }

    // Prevent double charge intents
    if (order.paymentStatus === 'paid') {
      res.status(400);
      return next(new Error('Order has already been paid'));
    }

    // Amount comes strictly from DB order total (Stripe expects integer cents/subunits)
    const stripeAmount = Math.round(order.total * 100);
    const currency = 'usd';

    // Create a PaymentIntent securely
    const paymentIntent = await stripe.paymentIntents.create({
      amount: stripeAmount,
      currency,
      metadata: {
        userId: req.user.id,
        orderId: order._id.toString(),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Save transactionId on the order
    order.transactionId = paymentIntent.id;
    await order.save();

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

// @desc    Secure Authenticated Payment Simulator (Dev/Demo Mode Endpoint)
// @route   POST /api/payment/simulate-payment
// @access  Private (Customer)
const simulatePayment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId } = req.body;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      res.status(400);
      throw new Error('Invalid or missing orderId');
    }

    const order = await Order.findById(orderId).session(session);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    // Authorization: User must be the owner of the order
    if (order.user.toString() !== req.user.id) {
      res.status(403);
      throw new Error('Access Forbidden: You do not own this order');
    }

    // Return success if already paid to prevent duplicate processing
    if (order.paymentStatus === 'paid') {
      await session.abortTransaction();
      session.endSession();
      return res.json({
        success: true,
        message: 'Order is already paid.',
        received: true
      });
    }

    // Update order status in a atomic session
    order.paymentStatus = 'paid';
    order.status = 'preparing';
    await order.save({ session });

    // Credit merchant revenue (SaaS metrics)
    const restaurant = await Restaurant.findById(order.restaurant).session(session);
    if (restaurant && !order.isTestOrder) {
      restaurant.revenue = parseFloat((restaurant.revenue + order.subtotal).toFixed(2));
      await restaurant.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    // Trigger alerts outside transaction block
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

    res.json({
      success: true,
      message: 'Simulated payment succeeded and order updated securely.',
      received: true
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
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
    if (isProduction || (endpointSecret && sig)) {
      if (!sig || !endpointSecret) {
        res.status(400);
        return res.send('Webhook Error: Stripe signature headers or webhook secret are missing.');
      }
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      // Dev mode local mock fallback
      console.warn('⚠️ Webhook running in development signature-bypass fallback mode.');
      const rawString = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : req.body;
      event = typeof rawString === 'string' ? JSON.parse(rawString) : rawString;
    }
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    res.status(400);
    return res.send(`Webhook Error: ${err.message}`);
  }

  // Prevent duplicate execution of webhook events (idempotency check)
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

    const eventType = event.type;
    
    if (eventType === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const transactionId = paymentIntent.id;

      console.log(`💰 Payment intent succeeded: ${transactionId}`);

      const order = await Order.findOne({ transactionId }).session(session);
      
      if (order) {
        if (order.paymentStatus !== 'paid') {
          order.paymentStatus = 'paid';
          order.status = 'preparing';
          await order.save({ session });

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

    // Trigger alerts outside transaction block to prevent holding socket lock
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
  simulatePayment,
  handleWebhook,
};

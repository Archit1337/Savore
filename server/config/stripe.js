const Stripe = require('stripe');

const stripeSecret = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_secret_key_savore_saas_2026';
const stripe = new Stripe(stripeSecret, {
  apiVersion: '2023-10-16', // stable Stripe API version
});

module.exports = stripe;

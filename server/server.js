const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const foodRoutes = require('./routes/foodRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reelRoutes = require('./routes/reelRoutes');
const chefRoutes = require('./routes/chefRoutes');


// Initialize DB Connection
connectDB();

const app = express();

// Security HTTP Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow images/videos to load on frontend
  })
);

// CORS Policy Setup
const allowedOrigins = [
  'http://localhost:5173', // default Vite dev URL
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or local dev tools)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS security restrictions'));
      }
    },
    credentials: true,
  })
);

// Rate Limiter to mitigate DDoS (10000 requests per 15 mins in dev, 100 in prod)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 10000 : 100,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// CRITICAL: Express raw body parsing for Stripe webhook MUST go BEFORE express.json()
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

// Standard body parser middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static upload directories
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Root Route check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Savoré Premium SaaS-Grade MERN API Services.',
    version: '1.0.0',
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/reels', reelRoutes);
app.use('/api/chef', chefRoutes);


// Global express error handler middleware (JSON conforming)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Savoré backend server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Unhandled Promise Rejections handler
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Promise Rejection Error: ${err.message}`);
  // Close server and exit process
  server.close(() => process.exit(1));
});

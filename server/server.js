const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
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
const adminRoutes = require('./routes/adminRoutes');


// Initialize DB Connection
connectDB();

const app = express();

// Trust reverse proxy for rate limiter to fetch correct client IP
app.set('trust proxy', 1);

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
  'http://127.0.0.1:3000',
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map((url) => url.trim().replace(/\/+$/, '')) : []),
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

// Sanitize inputs to prevent MongoDB NoSQL Injection attacks
app.use(mongoSanitize());

// Serve Static upload directories with browser caching and byte-range support for video streaming
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d',
  setHeaders: (res) => {
    res.setHeader('Accept-Ranges', 'bytes');
  }
}));

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
app.use('/api/admin', adminRoutes);


// Global express error handler middleware (JSON conforming)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Savoré backend server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Setup Socket.io WebSockets
const socketio = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Restaurant = require('./models/Restaurant');

const io = socketio(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

app.set('io', io);

// Token Verification Socket Handshake Middleware
io.use(async (socket, next) => {
  try {
    const authHeader = socket.handshake.auth.token || socket.handshake.headers['authorization'];
    if (!authHeader) {
      return next(new Error('Access Denied: No Token Provided'));
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    const jwtSecret = process.env.JWT_SECRET || 'savore_saas_jwt_secret_token_2026';
    const decoded = jwt.verify(token, jwtSecret);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Access Denied: Invalid Authentication Token'));
  }
});

io.on('connection', (socket) => {
  console.log(`🔌 Secured socket connection established: ${socket.id} (User: ${socket.user.username})`);

  // Room binding: join specific merchant room with strict tenant isolation
  socket.on('join_merchant_room', async (merchantId) => {
    try {
      // Admins have platform-wide monitoring rights
      if (socket.user.role === 'admin') {
        const adminRoom = `merchant_${merchantId}`;
        socket.join(adminRoom);
        console.log(`🚪 Admin Socket ${socket.id} joined room: ${adminRoom}`);
        return;
      }

      const restaurant = await Restaurant.findOne({ owner: socket.user._id });
      if (!restaurant) {
        socket.emit('error_message', 'Forbidden: You do not own a registered restaurant.');
        return;
      }

      const targetId = merchantId ? merchantId.toString() : '';
      const isOwnerId = targetId === socket.user._id.toString();
      const isRestaurantId = targetId === restaurant._id.toString();

      if (!isOwnerId && !isRestaurantId) {
        socket.emit('error_message', 'Forbidden: You are not authorized to monitor this merchant room.');
        return;
      }

      // Join the authenticated owner's room (matching orderController alert dispatches)
      const roomName = `merchant_${socket.user._id.toString()}`;
      socket.join(roomName);
      console.log(`🚪 Socket ${socket.id} authorized & joined room: ${roomName}`);
    } catch (err) {
      socket.emit('error_message', 'Server error joining merchant updates.');
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Secured socket disconnected: ${socket.id}`);
  });
});

// Unhandled Promise Rejections handler
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Promise Rejection Error: ${err.message}`);
  // Close server and exit process
  server.close(() => process.exit(1));
});

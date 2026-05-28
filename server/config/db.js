const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/savore';

  // Register connection event listeners for logging and resilience monitoring
  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connection successfully established.');
  });

  mongoose.connection.on('error', (err) => {
    console.error(`❌ MongoDB connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected. Mongoose will attempt auto-reconnects.');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('🔄 MongoDB successfully reconnected.');
  });

  const maxRetries = 5;
  let attempt = 1;

  while (attempt <= maxRetries) {
    try {
      console.log(`🔌 Connecting to MongoDB (Attempt ${attempt}/${maxRetries})...`);
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000, // Fail fast if Mongo is not running
      });
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.error(`❌ Database connection attempt ${attempt} failed: ${error.message}`);
      attempt++;
      if (attempt > maxRetries) {
        console.error('🚨 All database connection attempts failed. Terminating process...');
        process.exit(1);
      }
      console.log('⏳ Waiting 5 seconds before retrying connection...');
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};

module.exports = connectDB;


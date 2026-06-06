const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = 'mongodb://localhost:27017/savore';

async function check() {
  try {
    console.log('Connecting to local MongoDB:', MONGO_URI);
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 });
    console.log('Connected to local MongoDB successfully.');

    const users = await User.find({}).select('+password');
    console.log(`Found ${users.length} users in local database:`);
    users.forEach(u => {
      console.log(`- Username: ${u.username}, Email: ${u.email}, Role: ${u.role}, PasswordHash: ${u.password}`);
    });
    
    mongoose.disconnect();
  } catch (err) {
    console.error('Failed to connect to local MongoDB:', err.message);
  }
}

check();

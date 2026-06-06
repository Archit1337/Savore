const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/savore';

async function check() {
  try {
    console.log('Connecting to:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    const users = await User.find({}).select('+password');
    console.log(`Found ${users.length} users in database:`);
    users.forEach(u => {
      console.log(`- Username: ${u.username}, Email: ${u.email}, Role: ${u.role}, PasswordHash: ${u.password}`);
    });
    
    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

check();

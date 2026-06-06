const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

async function test() {
  try {
    console.log('Connecting to:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    const admin = await User.findOne({ email: 'admin@savore.com' }).select('+password');
    if (!admin) {
      console.log('Admin user not found!');
      mongoose.disconnect();
      return;
    }
    console.log('Found Admin User:', admin.email);
    console.log('Stored Hash:', admin.password);
    
    const isMatch = await admin.matchPassword('password123');
    console.log('Match result for password123:', isMatch);
    
    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

test();

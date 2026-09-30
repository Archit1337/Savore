const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/savore';

async function findDuplicates() {
  try {
    console.log('Connecting to:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('Connected.\n');

    // Find all owners who have more than one restaurant
    const allRestaurants = await Restaurant.find({}).populate('owner', 'username email role');
    
    // Group by owner
    const ownerMap = {};
    allRestaurants.forEach(r => {
      const ownerId = r.owner?._id?.toString() || r.owner?.toString();
      if (!ownerMap[ownerId]) ownerMap[ownerId] = [];
      ownerMap[ownerId].push(r);
    });

    console.log(`Total restaurants in DB: ${allRestaurants.length}\n`);

    let hasDuplicates = false;
    for (const [ownerId, restaurants] of Object.entries(ownerMap)) {
      if (restaurants.length > 1) {
        hasDuplicates = true;
        const ownerInfo = restaurants[0].owner;
        console.log(`⚠️  DUPLICATE FOUND — Owner: ${ownerInfo?.username || 'unknown'} (${ownerInfo?.email || ownerId}) | Role: ${ownerInfo?.role || 'unknown'}`);
        console.log(`   This owner has ${restaurants.length} restaurants:\n`);
        restaurants.forEach((r, i) => {
          console.log(`   [${i + 1}] ID: ${r._id}`);
          console.log(`       Name: ${r.name}`);
          console.log(`       City: ${r.city || 'N/A'} | Locality: ${r.locality || 'N/A'}`);
          console.log(`       Revenue: ₹${r.revenue || 0}`);
          console.log(`       Created: ${r.createdAt}`);
          console.log(`       Cuisines: ${r.cuisines?.join(', ') || 'None'}`);
          console.log('');
        });
      }
    }

    if (!hasDuplicates) {
      console.log('✅ No duplicate restaurants found. Each owner has exactly one kitchen.');
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

findDuplicates();

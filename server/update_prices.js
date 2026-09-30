const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');
const FoodItem = require('./models/FoodItem');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/savore';

const PRICE_UPDATES = {
  // 1. L'Ambroisie
  "L'Ambroisie": {
    deliveryFee: 120.0,
    dishes: {
      "Truffle Tagliolini": 1250.0,
      "Roasted Duck Breast": 1650.0,
      "Chocolate Soufflé": 550.0
    }
  },
  // 2. Saffron Bistro
  "Saffron Bistro": {
    deliveryFee: 0.0,
    dishes: {
      "Butter Chicken Deluxe": 780.0,
      "Rosemary Garlic Naan": 190.0,
      "Saffron Dum Biryani": 690.0
    }
  },
  // 3. Sakura Sushi
  "Sakura Sushi": {
    deliveryFee: 80.0,
    dishes: {
      "Signature Dragon Roll": 890.0,
      "Salmon Sashimi Platter": 1450.0
    }
  },
  // 4. Asador Steakhouse
  "Asador Steakhouse": {
    deliveryFee: 100.0,
    dishes: {
      "Dry-Aged Ribeye": 2450.0,
      "Charred Chimichurri Potatoes": 380.0
    }
  },
  // 5. Ramen Shinryu
  "Ramen Shinryu": {
    deliveryFee: 60.0,
    dishes: {
      "Black Garlic Tonkotsu": 750.0,
      "Spicy Miso Ramen": 720.0
    }
  },
  // 6. Le Petit Chocolat
  "Le Petit Chocolat": {
    deliveryFee: 60.0,
    dishes: {
      "Valrhona Soufflé": 520.0,
      "Macaron Selection": 580.0
    }
  },
  // 7. Verde Organic
  "Verde Organic": {
    deliveryFee: 70.0,
    dishes: {
      "Avocado Power Green": 590.0,
      "Sweet Potato Quinoa Wok": 640.0
    }
  },
  // 8. Truffle Burger House
  "Truffle Burger House": {
    deliveryFee: 80.0,
    dishes: {
      "The Gold Truffle Burger": 980.0,
      "Parmesan Truffle Fries": 360.0
    }
  },
  // 9. Monsoon Tapas Bar
  "Monsoon Tapas Bar": {
    deliveryFee: 90.0,
    dishes: {
      "Vietnamese Crab Rolls": 650.0,
      "Steamed Crystal Dumplings": 580.0
    }
  },
  // 10. Aura Oyster Bar
  "Aura Oyster Bar": {
    deliveryFee: 150.0,
    dishes: {
      "Wild Oyster Selection": 1850.0
    }
  },
  // 11. Bottega di Pasta
  "Bottega di Pasta": {
    deliveryFee: 70.0,
    dishes: {
      "Grated Parmesan Gnocchi": 780.0
    }
  },
  // 12. Cantina El Barrio
  "Cantina El Barrio": {
    deliveryFee: 60.0,
    dishes: {
      "Slow-Braised Barbacoa Tacos": 680.0
    }
  },
  // 13. Zeus Taverna
  "Zeus Taverna": {
    deliveryFee: 90.0,
    dishes: {
      "Grilled Lemon Branzino": 1480.0
    }
  },
  // 14. Golden Roast Cafe
  "Golden Roast Cafe": {
    deliveryFee: 50.0,
    dishes: {
      "Drip Espresso": 280.0,
      "Maple Butter Waffles": 420.0
    }
  },
  // 15. Nordic Hearth
  "Nordic Hearth": {
    deliveryFee: 110.0,
    dishes: {
      "Smoked Salmon Crudo": 1150.0
    }
  },
  // 16. Royal Peking
  "Royal Peking": {
    deliveryFee: 120.0,
    dishes: {
      "Peking Duck Roast": 1750.0
    }
  },
  // 17. Sweet Symphony
  "Sweet Symphony": {
    deliveryFee: 60.0,
    dishes: {
      "Pistachio Strawberry Plating": 480.0
    }
  },
  // 18. Smokehouse Club
  "Smokehouse Club": {
    deliveryFee: 100.0,
    dishes: {
      "Texas Oakwood Brisket": 1650.0
    }
  },
  // 19. Bonsai Teppan
  "Bonsai Teppan": {
    deliveryFee: 150.0,
    dishes: {
      "Wagyu Teppan Sizzle": 3850.0
    }
  },
  // 20. La Creperie
  "La Creperie": {
    deliveryFee: 50.0,
    dishes: {
      "Chocolate Drizzle Crepe": 390.0
    }
  },
  // 21. Amber Fire Wok
  "Amber Fire Wok": {
    deliveryFee: 70.0,
    dishes: {
      "Sichuan Chili Chicken": 680.0
    }
  },
  // 22. The Lobster Crate
  "The Lobster Crate": {
    deliveryFee: 120.0,
    dishes: {
      "Signature Lobster Roll": 1850.0
    }
  },
  // 23. Velvet Lounge
  "Velvet Lounge": {
    deliveryFee: 80.0,
    dishes: {
      "Premium Chocolate Board": 620.0
    }
  },
  // 24. Sultans Palace
  "Sultans Palace": {
    deliveryFee: 80.0,
    dishes: {
      "Adana Kebab Board": 880.0
    }
  },
  // 25. Alps Stube
  "Alps Stube": {
    deliveryFee: 120.0,
    dishes: {
      "Swiss Raclette Melt": 1180.0
    }
  },
  // 26. Oceanic Ceviche
  "Oceanic Ceviche": {
    deliveryFee: 80.0,
    dishes: {
      "Classic Sea Bass Ceviche": 850.0
    }
  },
  // 27. Finca Tapas
  "Finca Tapas": {
    deliveryFee: 90.0,
    dishes: {
      "Jamón Ibérico Board": 1550.0
    }
  },
  // 28. Sicilian Gelateria
  "Sicilian Gelateria": {
    deliveryFee: 50.0,
    dishes: {
      "Sicilian Pistachio Gelato": 340.0
    }
  }
};

const updatePricesInDatabase = async () => {
  try {
    console.log('⏳ Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('🚀 Connected to MongoDB.');

    let updatedRestaurantsCount = 0;
    let updatedDishesCount = 0;

    for (const [restName, data] of Object.entries(PRICE_UPDATES)) {
      // Update restaurant delivery fee
      const rest = await Restaurant.findOneAndUpdate(
        { name: restName },
        { deliveryFee: data.deliveryFee },
        { new: true }
      );

      if (rest) {
        updatedRestaurantsCount++;
        // Update all dishes for this restaurant
        for (const [dishName, newPrice] of Object.entries(data.dishes)) {
          const res = await FoodItem.updateMany(
            { name: dishName },
            { price: newPrice }
          );
          if (res.modifiedCount > 0) {
            updatedDishesCount += res.modifiedCount;
            console.log(`  ✓ Updated "${dishName}" to ₹${newPrice}`);
          }
        }
      }
    }

    console.log(`\n🎉 Price Update Summary:`);
    console.log(`  • Restaurants updated: ${updatedRestaurantsCount}`);
    console.log(`  • Dishes updated: ${updatedDishesCount}`);
    console.log(`\nAll items now have realistic luxury INR pricing in MongoDB!`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to update prices:', err);
    process.exit(1);
  }
};

updatePricesInDatabase();

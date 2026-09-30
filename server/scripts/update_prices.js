const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');
const FoodItem = require('../models/FoodItem');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/savore';

const PRICE_UPDATES = {
  "L'Ambroisie": {
    deliveryFee: 120.0,
    dishes: {
      "Truffle Tagliolini": 1250.0,
      "Roasted Duck Breast": 1650.0,
      "Chocolate Soufflé": 550.0
    }
  },
  "Saffron Bistro": {
    deliveryFee: 0.0,
    dishes: {
      "Butter Chicken Deluxe": 780.0,
      "Rosemary Garlic Naan": 190.0,
      "Saffron Dum Biryani": 690.0
    }
  },
  "Sakura Sushi": {
    deliveryFee: 80.0,
    dishes: {
      "Signature Dragon Roll": 890.0,
      "Salmon Sashimi Platter": 1450.0
    }
  },
  "Asador Steakhouse": {
    deliveryFee: 100.0,
    dishes: {
      "Dry-Aged Ribeye": 2450.0,
      "Charred Chimichurri Potatoes": 380.0
    }
  },
  "Ramen Shinryu": {
    deliveryFee: 60.0,
    dishes: {
      "Black Garlic Tonkotsu": 750.0,
      "Spicy Miso Ramen": 720.0
    }
  },
  "Le Petit Chocolat": {
    deliveryFee: 60.0,
    dishes: {
      "Valrhona Soufflé": 520.0,
      "Macaron Selection": 580.0
    }
  },
  "Verde Organic": {
    deliveryFee: 70.0,
    dishes: {
      "Avocado Power Green": 590.0,
      "Sweet Potato Quinoa Wok": 640.0
    }
  },
  "Truffle Burger House": {
    deliveryFee: 80.0,
    dishes: {
      "The Gold Truffle Burger": 980.0,
      "Parmesan Truffle Fries": 360.0
    }
  },
  "Monsoon Tapas Bar": {
    deliveryFee: 90.0,
    dishes: {
      "Vietnamese Crab Rolls": 650.0,
      "Steamed Crystal Dumplings": 580.0
    }
  },
  "Aura Oyster Bar": {
    deliveryFee: 150.0,
    dishes: {
      "Wild Oyster Selection": 1850.0
    }
  },
  "Bottega di Pasta": {
    deliveryFee: 70.0,
    dishes: {
      "Grated Parmesan Gnocchi": 780.0
    }
  },
  "Cantina El Barrio": {
    deliveryFee: 60.0,
    dishes: {
      "Slow-Braised Barbacoa Tacos": 680.0
    }
  },
  "Zeus Taverna": {
    deliveryFee: 90.0,
    dishes: {
      "Grilled Lemon Branzino": 1480.0
    }
  },
  "Golden Roast Cafe": {
    deliveryFee: 50.0,
    dishes: {
      "Drip Espresso": 280.0,
      "Maple Butter Waffles": 420.0
    }
  },
  "Nordic Hearth": {
    deliveryFee: 110.0,
    dishes: {
      "Smoked Salmon Crudo": 1150.0
    }
  },
  "Royal Peking": {
    deliveryFee: 120.0,
    dishes: {
      "Peking Duck Roast": 1750.0
    }
  },
  "Sweet Symphony": {
    deliveryFee: 60.0,
    dishes: {
      "Pistachio Strawberry Plating": 480.0
    }
  },
  "Smokehouse Club": {
    deliveryFee: 100.0,
    dishes: {
      "Texas Oakwood Brisket": 1650.0
    }
  },
  "Bonsai Teppan": {
    deliveryFee: 150.0,
    dishes: {
      "Wagyu Teppan Sizzle": 3850.0
    }
  },
  "La Creperie": {
    deliveryFee: 50.0,
    dishes: {
      "Chocolate Drizzle Crepe": 390.0
    }
  },
  "Amber Fire Wok": {
    deliveryFee: 70.0,
    dishes: {
      "Sichuan Chili Chicken": 680.0
    }
  },
  "The Lobster Crate": {
    deliveryFee: 120.0,
    dishes: {
      "Signature Lobster Roll": 1850.0
    }
  },
  "Velvet Lounge": {
    deliveryFee: 80.0,
    dishes: {
      "Premium Chocolate Board": 620.0
    }
  },
  "Sultans Palace": {
    deliveryFee: 80.0,
    dishes: {
      "Adana Kebab Board": 880.0
    }
  },
  "Alps Stube": {
    deliveryFee: 120.0,
    dishes: {
      "Swiss Raclette Melt": 1180.0
    }
  },
  "Oceanic Ceviche": {
    deliveryFee: 80.0,
    dishes: {
      "Classic Sea Bass Ceviche": 850.0
    }
  },
  "Finca Tapas": {
    deliveryFee: 90.0,
    dishes: {
      "Jamón Ibérico Board": 1550.0
    }
  },
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
      const rest = await Restaurant.findOneAndUpdate(
        { name: restName },
        { deliveryFee: data.deliveryFee },
        { new: true }
      );

      if (rest) {
        updatedRestaurantsCount++;
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

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to update prices:', err);
    process.exit(1);
  }
};

updatePricesInDatabase();

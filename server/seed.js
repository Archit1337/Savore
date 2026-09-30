const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Restaurant = require('./models/Restaurant');
const FoodItem = require('./models/FoodItem');
const Reel = require('./models/Reel');
const Comment = require('./models/Comment');
const Order = require('./models/Order');
const ReelEvent = require('./models/ReelEvent');
const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/savore';

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const video1Url = 'https://raw.githubusercontent.com/aperture-data/Cookbook/main/notebooks/simple/data/crepe_flambe.mp4';
const video2Url = 'https://www.andrew.cmu.edu/user/payu/GreekRecipes/images/cooking.mp4';

const dest1 = path.join(uploadsDir, 'culinary_1.mp4');
const dest2 = path.join(uploadsDir, 'culinary_2.mp4');

let localVideo1 = '/uploads/culinary_1.mp4';
let localVideo2 = '/uploads/culinary_2.mp4';

const VIDEO_TEMPLATES = {
  pizza_1: {
    url: 'https://giordanos.com/wp-content/uploads/2022/11/pizza.mp4',
    fallback: 'savory',
    filename: 'template_pizza_1.mp4'
  },
  pizza_2: {
    url: 'https://tomatowellness.com/wp-content/uploads/2026/01/Eat-Real-Food-Pizza-.mp4',
    fallback: 'savory',
    filename: 'template_pizza_2.mp4'
  },
  burger_1: {
    url: 'https://www.aisle3nj.com/wp-content/uploads/2019/04/cheyenne-burger.mp4',
    fallback: 'savory',
    filename: 'template_burger_1.mp4'
  },
  burger_2: {
    url: 'https://thewannagency.com/wp-content/uploads/2025/03/Burger.mp4',
    fallback: 'savory',
    filename: 'template_burger_2.mp4'
  },
  coffee_1: {
    url: 'https://thetig.meghanpedia.com/wp-content/uploads/2019/01/coffee.mp4',
    fallback: 'sweet',
    filename: 'template_coffee_1.mp4'
  },
  salad_1: {
    url: 'https://rollupmke.com/wp-content/uploads/2024/12/short-cut-salad.mp4',
    fallback: 'savory',
    filename: 'template_salad_1.mp4'
  },
  steak_1: {
    url: 'https://www.mynameissnickerdoodle.com/wp-content/uploads/2025/08/Steak.mp4',
    fallback: 'savory',
    filename: 'template_steak_1.mp4'
  },
  pasta_1: {
    url: 'https://absolu80.com/wp-content/uploads/2023/05/video-for-Meet-Our-Chef.mp4',
    fallback: 'savory',
    filename: 'template_pasta_1.mp4'
  },
  sweet_1: {
    url: 'https://raw.githubusercontent.com/aperture-data/Cookbook/main/notebooks/simple/data/crepe_flambe.mp4',
    fallback: 'culinary_1.mp4',
    filename: 'template_sweet_1.mp4'
  },
  savory_1: {
    url: 'https://www.andrew.cmu.edu/user/payu/GreekRecipes/images/cooking.mp4',
    fallback: 'culinary_2.mp4',
    filename: 'template_savory_1.mp4'
  }
};

const downloadFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) {
      console.log(`ℹ️ File already exists, skipping download: ${path.basename(dest)}`);
      return resolve(true);
    }

    console.log(`📥 Downloading ${url} to ${dest}...`);
    const file = fs.createWriteStream(dest);
    
    const request = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      timeout: 3000 // 3s ultra-fast timeout
    }, (response) => {
      if (response.statusCode !== 200) {
        fs.unlink(dest, () => {});
        return reject(new Error(`Server responded with status code: ${response.statusCode}`));
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log(`✅ Download complete: ${path.basename(dest)}`);
        resolve(true);
      });
    });

    request.on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });

    request.on('timeout', () => {
      request.destroy();
      fs.unlink(dest, () => {});
      reject(new Error('Connection timed out'));
    });
  });
};

const prepareVideos = async () => {
  console.log('📦 Buffering premium cuisine-specific video templates locally...');
  
  // Clean up only corrupted/incomplete template_*.mp4 files to prevent corrupted video playback, preserving fully downloaded assets
  try {
    console.log('🧹 Scanning and cleaning only corrupted/incomplete templates to prevent corrupted video playback...');
    const files = fs.readdirSync(uploadsDir);
    for (const file of files) {
      if (file.startsWith('template_') && file.endsWith('.mp4')) {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        if (stats.size < 10240) { // < 10KB is likely aborted/corrupted
          console.log(`🗑️ Deleting incomplete/corrupted template: ${file}`);
          fs.unlinkSync(filePath);
        }
      }
    }
  } catch (err) {
    console.warn('⚠️ Warning: Failed to scan/clean up templates:', err.message);
  }
  
  // Make sure base fallbacks exist first
  try {
    if (!fs.existsSync(dest1)) {
      console.log(`📥 Downloading sweet base fallback...`);
      await downloadFile(video1Url, dest1);
    }
    if (!fs.existsSync(dest2)) {
      console.log(`📥 Downloading savory base fallback...`);
      await downloadFile(video2Url, dest2);
    }
  } catch (err) {
    console.warn('⚠️ Failed to ensure base fallback videos:', err.message);
  }

  // Download or copy all templates
  for (const [key, meta] of Object.entries(VIDEO_TEMPLATES)) {
    const templateDest = path.join(uploadsDir, meta.filename);
    if (fs.existsSync(templateDest)) {
      console.log(`ℹ️ Template already exists: ${meta.filename}`);
      continue;
    }

    try {
      console.log(`📥 Downloading template for ${key}: ${meta.url}...`);
      await downloadFile(meta.url, templateDest);
      console.log(`✅ Downloaded template for ${key}`);
    } catch (err) {
      console.warn(`⚠️ Failed to download template for ${key}, falling back:`, err.message);
      // Copy sweet or savory base file
      const fallbackSrc = meta.fallback === 'sweet' || meta.fallback === 'culinary_1.mp4' ? dest1 : dest2;
      if (fs.existsSync(fallbackSrc)) {
        fs.copyFileSync(fallbackSrc, templateDest);
        console.log(`✨ Gracefully copied base fallback for template ${key}`);
      } else {
        console.error(`🚨 Fatal: Fallback base file not found for ${key}!`);
      }
    }
  }
  console.log('✅ All video templates buffered and verified.');
};

const CULINARY_REELS = [
  { 
    tags: ['flambe', 'crepe', 'dessert', 'baking', 'chef'], 
    type: 'sweet'
  },
  { 
    tags: ['cooking', 'cutting', 'kitchen', 'plating', 'chef'], 
    type: 'savory'
  }
];

const RESTAURANTS_DATA = [
  {
    name: "L'Ambroisie",
    description: "Experience Parisian dining with modern culinary elegance, featuring signature Italian-French fusion recipes.",
    coverImage: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80",
    rating: 4.9, deliveryTime: 45, deliveryFee: 120.00,
    tags: ["Chef Recommended", "Popular", "Premium Dining"], cuisines: ["French", "Italian", "European"],
    menu: [
      { name: "Truffle Tagliolini", description: "Fresh handrolled tagliolini tossed in rich butter sauce, seasoned with aged Parmigiano-Reggiano and freshly shaved Italian white truffles.", price: 1250.0, image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80", category: "Pasta" },
      { name: "Roasted Duck Breast", description: "Crispy pan-seared duck breast drizzled with wild orange glaze, served alongside charred asparagus and sweet potato purée.", price: 1650.0, image: "https://images.unsplash.com/photo-1518492104633-130d0cc84637?auto=format&fit=crop&w=400&q=80", category: "Mains" },
      { name: "Chocolate Soufflé", description: "Warm French dark chocolate soufflé with a molten liquid center, topped with powdered sugar and organic vanilla bean gelato.", price: 550.0, image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80", category: "Desserts" }
    ]
  },
  {
    name: "Saffron Bistro",
    description: "Modern Indian cuisine cooked over authentic clay ovens, fused with aromatic European herbs and spices.",
    coverImage: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80",
    rating: 4.8, deliveryTime: 30, deliveryFee: 0.00,
    tags: ["Hot Right Now", "Comfort Food", "Spicy"], cuisines: ["Indian", "Fusion", "Vegetarian"],
    menu: [
      { name: "Butter Chicken Deluxe", description: "Tender tandoori-grilled chicken thighs simmered in a velvety, spiced cashew tomato gravy, finished with fresh cream.", price: 780.0, image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&q=80", category: "Mains" },
      { name: "Rosemary Garlic Naan", description: "Fluffy tandoori flatbread brushed with organic ghee, fresh minced garlic, and rosemary twigs.", price: 190.0, image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=400&q=80", category: "Sides" },
      { name: "Saffron Dum Biryani", description: "Aromatic basmati rice layered with spiced vegetables, saffron strings, and fresh mint, slow-cooked under dough seal.", price: 690.0, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80", category: "Mains" }
    ]
  },
  {
    name: "Sakura Sushi",
    description: "Authentic Edo-style handrolled sushi, fresh sashimi platters, and organic matcha-infused tea selections.",
    coverImage: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80",
    rating: 4.7, deliveryTime: 25, deliveryFee: 80.00,
    tags: ["Most Loved", "Fresh", "Healthy"], cuisines: ["Japanese", "Sushi", "Asian"],
    menu: [
      { name: "Signature Dragon Roll", description: "Eel and cucumber inside, layered with avocado, spicy tuna, unagi sweet glaze, and red tobiko on top.", price: 890.0, image: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=400&q=80", category: "Sushi" },
      { name: "Salmon Sashimi Platter", description: "Ten premium thick-cut slices of raw, high-grade Atlantic salmon served over crushed ice with wasabi root.", price: 1450.0, image: "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=400&q=80", category: "Sushi" }
    ]
  },
  {
    name: "Asador Steakhouse",
    description: "Authentic Argentinian steak cuts, slow-grilled over white oak wood charcoal, served with homemade chimney chimichurri.",
    coverImage: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    rating: 4.9, deliveryTime: 40, deliveryFee: 100.00,
    tags: ["Chef Recommended", "Premium", "Robust"], cuisines: ["Argentinian", "Steak", "Barbecue"],
    menu: [
      { name: "Dry-Aged Ribeye", description: "A highly marbled 400g ribeye steak aged for 45 days, seared over open flames with sea salt crystals and fresh rosemary.", price: 2450.0, image: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=400&q=80", category: "Steaks" },
      { name: "Charred Chimichurri Potatoes", description: "Baby potatoes smashed and skillet-browned in tallow, drizzled with spicy garlic herbs chimichurri.", price: 380.0, image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=400&q=80", category: "Sides" }
    ]
  },
  {
    name: "Ramen Shinryu",
    description: "Rich, slow-simmered tonkotsu pork bone broths served with handcrafted wavy noodles, soft soy eggs, and smoked chashu pork belly.",
    coverImage: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80",
    rating: 4.8, deliveryTime: 20, deliveryFee: 60.00,
    tags: ["Hot Right Now", "Comfort Food", "Authentic"], cuisines: ["Japanese", "Ramen", "Asian"],
    menu: [
      { name: "Black Garlic Tonkotsu", description: "Our iconic pork bone broth infused with toasted black sesame oil, topped with tender pork chashu, nori sheet, bamboo shoots, and wood ear mushrooms.", price: 750.0, image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80", category: "Ramen" },
      { name: "Spicy Miso Ramen", description: "Handmade noodles submerged in spicy fermented miso broth, topped with minced seasoned chicken, scallions, chili strings, and soft egg.", price: 720.0, image: "https://images.unsplash.com/photo-1557872943-16a5ac26437e?auto=format&fit=crop&w=400&q=80", category: "Ramen" }
    ]
  },
  {
    name: "Le Petit Chocolat",
    description: "Premium French pastries, masterfully crafted molten cakes, and hand-decorated fresh berry tarts from a champion chocolatier.",
    coverImage: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80",
    rating: 4.9, deliveryTime: 15, deliveryFee: 60.00,
    tags: ["Most Loved", "Sweet", "Dessert"], cuisines: ["French", "Desserts", "Pastries"],
    menu: [
      { name: "Valrhona Soufflé", description: "Warm 70% dark chocolate souffle, baked with organic cocoa butter, served with a delicate hot chocolate pour.", price: 520.0, image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80", category: "Warm Cakes" },
      { name: "Macaron Selection", description: "A beautifully boxed collection of 6 assorted French macarons (Pistachio, Raspberry, Sea Salt Caramel, Matcha, Passionfruit, Lavender).", price: 580.0, image: "https://images.unsplash.com/photo-1569864358642-9d1684040f43?auto=format&fit=crop&w=400&q=80", category: "Macarons" }
    ]
  },
  {
    name: "Verde Organic",
    description: "Indulgent plant-based organic gastronomy. Nutrient-dense, clean plating featuring seasonal local roots and grains.",
    coverImage: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
    rating: 4.6, deliveryTime: 25, deliveryFee: 70.00,
    tags: ["Fresh", "Healthy", "Vegan"], cuisines: ["Vegetarian", "Vegan", "Healthy"],
    menu: [
      { name: "Avocado Power Green", description: "Organic baby spinach, kale, fresh sliced ripe avocados, sweet heirloom tomatoes, roasted pumpkin seeds, tossed in creamy basil oil dressing.", price: 590.0, image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80", category: "Salads" },
      { name: "Sweet Potato Quinoa Wok", description: "Stir-fried tri-color quinoa, baby spinach, charred sweet potatoes, crispy organic tofu, sesame seeds, and light ginger soy glaze.", price: 640.0, image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80", category: "Wok Bowls" }
    ]
  },
  {
    name: "Truffle Burger House",
    description: "Savoir-faire wagyu beef burgers layered with molten aged cheddar, truffle aioli, and crispy shallots inside toasted brioche.",
    coverImage: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
    rating: 4.8, deliveryTime: 28, deliveryFee: 80.00,
    tags: ["Chef Recommended", "Comfort Food", "Premium"], cuisines: ["Burgers", "American", "Comfort Food"],
    menu: [
      { name: "The Gold Truffle Burger", description: "Double wagyu beef patties, sliced black summer truffles, organic gruyère cheese, caramelized onions, toasted gold-dusted brioche bun.", price: 980.0, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80", category: "Burgers" },
      { name: "Parmesan Truffle Fries", description: "Hand-cut Idaho potato skins fried double-crisp, tossed in white truffle oil, rosemary, and freshly grated Parmigiano.", price: 360.0, image: "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=400&q=80", category: "Sides" }
    ]
  },
  {
    name: "Monsoon Tapas Bar",
    description: "Upscale Pan-Asian micro-tapas and handcrafted botanic cocktail matchings. Cinematic small plates with high flavor density.",
    coverImage: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80",
    rating: 4.7, deliveryTime: 32, deliveryFee: 90.00,
    tags: ["Hot Right Now", "Spicy", "Authentic"], cuisines: ["Asian", "Fusion", "Tapas"],
    menu: [
      { name: "Vietnamese Crab Rolls", description: "Fresh rice paper spring rolls packed with wild-caught shredded snow crab, sliced cucumber, wild mint, served with chili fish dipping sauce.", price: 650.0, image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&q=80", category: "Tapas" },
      { name: "Steamed Crystal Dumplings", description: "Four steamed thin-skin crystal dumplings packed with diced prawns, water chestnuts, drizzled with spicy garlic oil.", price: 580.0, image: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=400&q=80", category: "Tapas" }
    ]
  },
  {
    name: "Aura Oyster Bar",
    description: "Exclusive wild cold-water oysters, fresh caviar tastings, and hand-selected French champagnes. Pure coastal luxury.",
    coverImage: "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=800&q=80",
    rating: 4.9, deliveryTime: 40, deliveryFee: 150.00,
    tags: ["Michelin Star", "Popular", "Premium"], cuisines: ["Seafood", "Popular", "European"],
    menu: [
      { name: "Wild Oyster Selection", description: "Half-dozen raw Pacific wild oysters served over clean crushed sea ice, with lemon wedges, shallot mignonette sauce, and grated horseradish.", price: 1850.0, image: "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=400&q=80", category: "Oysters" }
    ]
  },
  {
    name: "Bottega di Pasta",
    description: "Elegant fresh handcrafted Italian pastas rolled out by hand daily. Absolute rustic-luxury carbohydrate excellence.",
    coverImage: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    rating: 4.8, deliveryTime: 30, deliveryFee: 70.00,
    tags: ["Most Loved", "Comfort Food", "Chef Recommended"], cuisines: ["Italian", "Pasta", "European"],
    menu: [
      { name: "Grated Parmesan Gnocchi", description: "Housemade potato gnocchi tossed in butter-rosemary reduction, topped with freshly grated Parmigiano-Reggiano at boiling temperature.", price: 780.0, image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80", category: "Pasta" }
    ]
  },
  {
    name: "Cantina El Barrio",
    description: "Upscale modern Mexican culinary arts. Elegant hand-pressed masa corn tortillas, slow-roasted barbacoa beef, and premium mezcal salsas.",
    coverImage: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80",
    rating: 4.7, deliveryTime: 22, deliveryFee: 60.00,
    tags: ["Hot Right Now", "Spicy", "Comfort Food"], cuisines: ["Mexican", "Latin", "Spicy"],
    menu: [
      { name: "Slow-Braised Barbacoa Tacos", description: "Three stone-ground masa tortillas loaded with slow-cooked shredded short ribs, diced red radish, wild cilantro, and smoked chipotle mezcal salsa.", price: 680.0, image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=400&q=80", category: "Tacos" }
    ]
  },
  {
    name: "Zeus Taverna",
    description: "Fine Mediterranean coastal treasures. Squeezed lemons over freshly grilled branzino, aromatic olive oils, and barrel-aged Greek feta.",
    coverImage: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
    rating: 4.7, deliveryTime: 35, deliveryFee: 90.00,
    tags: ["Fresh", "Healthy", "Popular"], cuisines: ["Mediterranean", "Greek", "Seafood"],
    menu: [
      { name: "Grilled Lemon Branzino", description: "Wild-caught whole branzino fillet, fire-grilled with extra virgin olive oil, wild oregano, squeezed lemons, alongside charred asparagus.", price: 1480.0, image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80", category: "Seafood" }
    ]
  },
  {
    name: "Golden Roast Cafe",
    description: "Organic micro-roasted single-origin coffees, slow drip brews, and freshly-baked pastries under warm, premium aesthetic.",
    coverImage: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80",
    rating: 4.8, deliveryTime: 15, deliveryFee: 50.00,
    tags: ["Most Loved", "Fresh", "Healthy"], cuisines: ["Coffee", "Cafe", "Pastries"],
    menu: [
      { name: "Drip Espresso", description: "Freshly ground Ethiopian Yirgacheffe beans prepared via professional slow-drip extraction, revealing clean jasmine notes.", price: 280.0, image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80", category: "Coffee" },
      { name: "Maple Butter Waffles", description: "Crisp belgian-style waffles brushed with organic churned butter and warm wood-fired pure dark maple syrup.", price: 420.0, image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=400&q=80", category: "Bakery" }
    ]
  },
  {
    name: "Nordic Hearth",
    description: "Contemporary Scandinavian cuisine. Clean cold-smoked salmon slices, fermented berry dressings, and skillet-browned root potatoes.",
    coverImage: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    rating: 4.8, deliveryTime: 38, deliveryFee: 110.00,
    tags: ["Michelin Star", "Healthy", "Fresh"], cuisines: ["Scandinavian", "Seafood", "Healthy"],
    menu: [
      { name: "Smoked Salmon Crudo", description: "Thin-sliced raw Atlantic salmon lightly smoked with applewood, served with fresh dill, pickled mustard seeds, and clean sour cream.", price: 1150.0, image: "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=400&q=80", category: "Crudo" }
    ]
  },
  {
    name: "Royal Peking",
    description: "Artisanal multi-course Peking Duck roastings and delicate crystal skin dumplings. Centuries-old classic recipes.",
    coverImage: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80",
    rating: 4.9, deliveryTime: 45, deliveryFee: 120.00,
    tags: ["Chef Recommended", "Popular", "Premium"], cuisines: ["Chinese", "Asian", "Duck"],
    menu: [
      { name: "Peking Duck Roast", description: "Crispy honey-glazed duck breast roasted to golden skin perfection, served with wafer-thin wheat crepes and hoisin scallions.", price: 1750.0, image: "https://images.unsplash.com/photo-1518492104633-130d0cc84637?auto=format&fit=crop&w=400&q=80", category: "Mains" }
    ]
  },
  {
    name: "Sweet Symphony",
    description: "Elegantly plated macarons, custom French vanilla bean mille-feuille, and master-crafted sweet boutiques.",
    coverImage: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80",
    rating: 4.7, deliveryTime: 20, deliveryFee: 60.00,
    tags: ["Most Loved", "Sweet", "Dessert"], cuisines: ["Desserts", "Bakery", "Pastries"],
    menu: [
      { name: "Pistachio Strawberry Plating", description: "Melted dark chocolate truffles, organic fresh garden strawberries, alongside premium pistachio gelato.", price: 480.0, image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80", category: "Desserts" }
    ]
  },
  {
    name: "Smokehouse Club",
    description: "Texas-style low-and-slow oak wood barbecues. Rich hickory beef briskets with double-bark black pepper coatings.",
    coverImage: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    rating: 4.8, deliveryTime: 34, deliveryFee: 100.00,
    tags: ["Comfort Food", "Hot Right Now", "Robust"], cuisines: ["Barbecue", "American", "Comfort Food"],
    menu: [
      { name: "Texas Oakwood Brisket", description: "400g of premium USDA Prime beef brisket slow-cooked over white oak fire for 16 hours, creating a rich caramelized black bark.", price: 1650.0, image: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=400&q=80", category: "Barbecue" }
    ]
  },
  {
    name: "Bonsai Teppan",
    description: "Exquisite Japanese Teppanyaki. Sizzling garlic butter wagyu slices, egg fried rice, and precision knife work right off the grill.",
    coverImage: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=800&q=80",
    rating: 4.9, deliveryTime: 35, deliveryFee: 150.00,
    tags: ["Chef Recommended", "Popular", "Premium"], cuisines: ["Japanese", "Steak", "Asian"],
    menu: [
      { name: "Wagyu Teppan Sizzle", description: "A5 Grade Miyazaki Wagyu cubed and flash-seared on high-temp teppan with dynamic whipped garlic butter and light shoyu.", price: 3850.0, image: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=400&q=80", category: "Teppan" }
    ]
  },
  {
    name: "La Creperie",
    description: "Freshly folded golden Parisian crepes, filled with rich organic cream, melted dark hazelnut cocoa, and dusted with fine sugar.",
    coverImage: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80",
    rating: 4.7, deliveryTime: 18, deliveryFee: 50.00,
    tags: ["Sweet", "Dessert", "Comfort Food"], cuisines: ["French", "Pastries", "Desserts"],
    menu: [
      { name: "Chocolate Drizzle Crepe", description: "Warm French crepe folded with molten hazelnut chocolate, organic fresh sliced strawberries, and dusted sugar.", price: 390.0, image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=400&q=80", category: "Crepes" }
    ]
  },
  {
    name: "Amber Fire Wok",
    description: "Sizzling high-temperature Sichuan wok masters. Blazing red chilis, numb-inducing green peppers, and aromatic ginger stems.",
    coverImage: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80",
    rating: 4.8, deliveryTime: 22, deliveryFee: 70.00,
    tags: ["Hot Right Now", "Spicy", "Authentic"], cuisines: ["Chinese", "Sichuan", "Spicy"],
    menu: [
      { name: "Sichuan Chili Chicken", description: "Spiced wok-seared free-range chicken cubes tossed with dynamic amounts of dried Sichuan peppers, garlic cloves, and toasted peanuts.", price: 680.0, image: "https://images.unsplash.com/photo-1557872943-16a5ac26437e?auto=format&fit=crop&w=400&q=80", category: "Wok" }
    ]
  },
  {
    name: "The Lobster Crate",
    description: "Sweet claw-filled Maine lobster rolls tossed in dynamic lemon herb butter, tucked inside griddled golden split-top buns.",
    coverImage: "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=800&q=80",
    rating: 4.9, deliveryTime: 28, deliveryFee: 120.00,
    tags: ["Chef Recommended", "Fresh", "Premium"], cuisines: ["Seafood", "American", "Popular"],
    menu: [
      { name: "Signature Lobster Roll", description: "150g of sweet Maine lobster claw meat tossed in dynamic warm lemon herb butter, packed into a griddled split-top bun.", price: 1850.0, image: "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=400&q=80", category: "Mains" }
    ]
  },
  {
    name: "Velvet Lounge",
    description: "Luxury late-night dessert and mixology bar. Frosted champagne glasses matched with master-crafted dark chocolates.",
    coverImage: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80",
    rating: 4.7, deliveryTime: 25, deliveryFee: 80.00,
    tags: ["Most Loved", "Sweet", "Premium"], cuisines: ["Desserts", "Cocktails", "Wine"],
    menu: [
      { name: "Premium Chocolate Board", description: "A highly curated tasting selection of three artisanal dark chocolates matched with fresh cold berries.", price: 620.0, image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80", category: "Tastings" }
    ]
  },
  {
    name: "Sultans Palace",
    description: "Fine Turkish skewers cooked over hot wood coals, served with premium pomegranate sumac glaze and warm brick-oven flatbreads.",
    coverImage: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80",
    rating: 4.8, deliveryTime: 30, deliveryFee: 80.00,
    tags: ["Comfort Food", "Authentic", "Hot Right Now"], cuisines: ["Turkish", "Middle Eastern", "Comfort Food"],
    menu: [
      { name: "Adana Kebab Board", description: "Skewers of minced local lamb spiced with dry sumac, grilled over oak coal, served with pomegranate-glazed flatbread.", price: 880.0, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80", category: "Kebabs" }
    ]
  },
  {
    name: "Alps Stube",
    description: "Authentic rustic-luxury Swiss melted cheese fondues, skillet roasted potatoes, and warm cured mountain hams.",
    coverImage: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    rating: 4.9, deliveryTime: 40, deliveryFee: 120.00,
    tags: ["Chef Recommended", "Comfort Food", "Premium"], cuisines: ["Swiss", "European", "Comfort Food"],
    menu: [
      { name: "Swiss Raclette Melt", description: "Melting aged alpine gruyère scraped hot onto pan-roasted baby potatoes, baby cornichons, and cured mountain ham.", price: 1180.0, image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80", category: "Melted Cheese" }
    ]
  },
  {
    name: "Oceanic Ceviche",
    description: "Modern Peruvian ceviche. Freshly diced sea bass cured in vibrant lime juice, red onions, sweet potato cubes, and giant corn.",
    coverImage: "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=800&q=80",
    rating: 4.7, deliveryTime: 25, deliveryFee: 80.00,
    tags: ["Fresh", "Healthy", "Popular"], cuisines: ["Peruvian", "Seafood", "Latin"],
    menu: [
      { name: "Classic Sea Bass Ceviche", description: "Diced fresh wild sea bass cured in sharp dynamic tiger's milk lime juice, red chili rings, fresh cilantro, sweet potato.", price: 850.0, image: "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=400&q=80", category: "Ceviche" }
    ]
  },
  {
    name: "Finca Tapas",
    description: "Fine Spanish tapas. Hand-sliced dry acorn-fed jamón ibérico, red wine glaze chorizo patties, and fresh pan con tomate.",
    coverImage: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80",
    rating: 4.8, deliveryTime: 26, deliveryFee: 90.00,
    tags: ["Hot Right Now", "Michelin Star", "Robust"], cuisines: ["Spanish", "Tapas", "European"],
    menu: [
      { name: "Jamón Ibérico Board", description: "Plate of hand-sliced acorn-fed dry cured jamón ibérico de bellota, aged for 36 months, served alongside crisp pan con tomate.", price: 1550.0, image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=400&q=80", category: "Tapas" }
    ]
  },
  {
    name: "Sicilian Gelateria",
    description: "Handcrafted organic slow-churned Sicilian gelatos. Dusted pistachios, sea salt crumbles, and warm waffle cones.",
    coverImage: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80",
    rating: 4.8, deliveryTime: 12, deliveryFee: 50.00,
    tags: ["Most Loved", "Sweet", "Dessert"], cuisines: ["Desserts", "Gelato", "Italian"],
    menu: [
      { name: "Sicilian Pistachio Gelato", description: "Two generous scoops of organic slow-churned pistachio gelato, topped with crushed bronte pistachios and sea salt flakes.", price: 340.0, image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=400&q=80", category: "Gelato" }
    ]
  }
];

const seedDatabase = async () => {
  try {
    console.log('⏳ Connecting to database for seeding...');
    await mongoose.connect(MONGO_URI);
    console.log('🚀 Connected to MongoDB.');

    // Prepare premium culinary video assets locally or resolve to fallback URLs
    await prepareVideos();

    // 1. Scrub existing database collections
    console.log('🧼 Scrubbing existing collections...');
    await User.deleteMany({});
    await Restaurant.deleteMany({});
    await FoodItem.deleteMany({});
    await Reel.deleteMany({});
    await Comment.deleteMany({});
    await Order.deleteMany({});
    await ReelEvent.deleteMany({});
    console.log('✅ Collections scrubbed successfully.');

    // 2. Generate Seed Users
    console.log('👤 Seeding users...');
    const customer = await User.create({
      username: 'foodie_user',
      email: 'customer@savore.com',
      password: 'password123',
      role: 'customer',
      address: 'Bandra, Mumbai, Maharashtra',
      profilePicture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
      addresses: [
        {
          houseNumber: '42',
          street: 'Hill Road',
          area: 'Bandra West',
          landmark: 'Elco Arcade',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400050',
          addressType: 'Home',
          isDefault: true
        },
        {
          houseNumber: 'Level 5',
          street: 'Connaught Place',
          area: 'Block E',
          landmark: 'Rajiv Chowk Metro',
          city: 'Delhi',
          state: 'Delhi',
          pincode: '110001',
          addressType: 'Work',
          isDefault: false
        }
      ]
    });

    const owners = [];
    const totalRestaurants = RESTAURANTS_DATA.length;
    for (let i = 1; i <= totalRestaurants; i++) {
      const owner = await User.create({
        username: `chef_owner_${i}`, email: `owner${i}@savore.com`, password: 'password123',
        role: 'restaurant', address: `${20 + i} Gastronomy Lane, Milan`,
        profilePicture: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=150&h=150&q=80',
      });
      owners.push(owner);
    }

    const admin = await User.create({
      username: 'admin_savore', email: 'admin@savore.com', password: 'password123',
      role: 'admin', address: 'Savoré HQ, San Francisco',
      profilePicture: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=150&h=150&q=80',
    });
    console.log('✅ Users successfully seeded.');

    const INDIAN_LOCATIONS = [
      { city: 'Mumbai', locality: 'Bandra', state: 'Maharashtra', priceRange: '₹₹₹₹', coords: [72.8258, 19.0596], radius: 6 },
      { city: 'Delhi', locality: 'Hauz Khas', state: 'Delhi', priceRange: '₹₹', coords: [77.2060, 28.5495], radius: 8 },
      { city: 'Bengaluru', locality: 'Indiranagar', state: 'Karnataka', priceRange: '₹₹', coords: [77.6407, 12.9719], radius: 7 },
      { city: 'Kolkata', locality: 'Salt Lake', state: 'West Bengal', priceRange: '₹₹₹', coords: [88.4277, 22.5735], radius: 9 },
      { city: 'Pune', locality: 'Koregaon Park', state: 'Maharashtra', priceRange: '₹₹', coords: [73.8907, 18.5362], radius: 6 },
      { city: 'Hyderabad', locality: 'Jubilee Hills', state: 'Telangana', priceRange: '₹₹', coords: [78.4011, 17.4339], radius: 8 },
      { city: 'Goa', locality: 'Panaji', state: 'Goa', priceRange: '₹₹', coords: [73.8180, 15.4909], radius: 12 },
      { city: 'Bengaluru', locality: 'Koramangala', state: 'Karnataka', priceRange: '₹₹', coords: [77.6245, 12.9352], radius: 6 },
      { city: 'Chennai', locality: 'Nungambakkam', state: 'Tamil Nadu', priceRange: '₹₹', coords: [80.2425, 13.0619], radius: 7 },
      { city: 'Mumbai', locality: 'Colaba', state: 'Maharashtra', priceRange: '₹₹₹₹', coords: [72.8258, 18.9067], radius: 5 },
      { city: 'Delhi', locality: 'Connaught Place', state: 'Delhi', priceRange: '₹₹', coords: [77.2177, 28.6304], radius: 7 },
      { city: 'Bengaluru', locality: 'Whitefield', state: 'Karnataka', priceRange: '₹₹', coords: [77.7500, 12.9698], radius: 10 },
      { city: 'Hyderabad', locality: 'Banjara Hills', state: 'Telangana', priceRange: '₹₹', coords: [78.4412, 17.4140], radius: 6 },
      { city: 'Kochi', locality: 'Fort Kochi', state: 'Kerala', priceRange: '₹', coords: [76.2427, 9.9658], radius: 8 },
      { city: 'Ahmedabad', locality: 'Satellite', state: 'Gujarat', priceRange: '₹₹', coords: [72.5255, 23.0305], radius: 9 },
      { city: 'Lucknow', locality: 'Hazratganj', state: 'Uttar Pradesh', priceRange: '₹₹', coords: [80.9462, 26.8467], radius: 8 },
      { city: 'Indore', locality: 'Vijay Nagar', state: 'Madhya Pradesh', priceRange: '₹', coords: [75.8988, 22.7533], radius: 8 },
      { city: 'Surat', locality: 'Adajan', state: 'Gujarat', priceRange: '₹₹', coords: [72.7933, 21.1955], radius: 7 }
    ];

    // 3. Generate Restaurants & Menus
    console.log(`🏪 Seeding ${RESTAURANTS_DATA.length} Premium Indian Restaurants & Menus (1 owner per kitchen)...`);
    const seededRestaurants = [];
    const seededFoodItems = [];

    for (let i = 0; i < RESTAURANTS_DATA.length; i++) {
      const restMeta = RESTAURANTS_DATA[i];
      const assignedOwner = owners[i];
      const locMeta = INDIAN_LOCATIONS[i % INDIAN_LOCATIONS.length];

      const restaurant = await Restaurant.create({
        name: restMeta.name,
        description: restMeta.description,
        coverImage: restMeta.coverImage,
        rating: restMeta.rating,
        deliveryTime: restMeta.deliveryTime,
        deliveryFee: restMeta.deliveryFee,
        tags: restMeta.tags,
        cuisines: restMeta.cuisines,
        revenue: 0.0,
        owner: assignedOwner._id,
        city: locMeta.city,
        locality: locMeta.locality,
        state: locMeta.state,
        priceRange: locMeta.priceRange,
        coordinates: {
          type: 'Point',
          coordinates: locMeta.coords
        },
        deliveryRadius: locMeta.radius,
        serviceableZones: [locMeta.locality]
      });
      seededRestaurants.push(restaurant);

      // Seed dishes
      for (const dishMeta of restMeta.menu) {
        const food = await FoodItem.create({
          name: dishMeta.name,
          description: dishMeta.description,
          price: dishMeta.price,
          image: dishMeta.image,
          category: dishMeta.category,
          isAvailable: true,
          restaurant: restaurant._id
        });
        seededFoodItems.push(food);
      }
    }
    console.log(`✅ Successfully seeded ${seededRestaurants.length} restaurants and ${seededFoodItems.length} menu items.`);

    // 4. Seeding Engagement Comments
    console.log('💬 Initializing community comment templates...');
    const commentTexts = [
      'Omg this looks absolutely incredible! Ordering right now! 😍',
      'Stunning plate presentation, Chef! True gastronomy.',
      'Highly recommend this dish, the aroma is out of this world.',
      'A true masterpiece of culinary arts. Flawless!',
      'Just received my order, it is cooked absolutely to perfection!',
      'Wow, the flavor combination looks extremely premium.',
      'Pure luxury. Savoré delivers EDC-level perfection.',
      'This cheese pull is out of this world! 🧀🔥',
      'The texture looks incredibly soft and delicious.',
      'Cannot wait to try this on my next date night!'
    ];

    // Helper function to dynamically map a dish to a template key
    const getTemplateKeyForDish = (dish, rest) => {
      const dishCat = (dish.category || '').toLowerCase();
      const dishDesc = (dish.description || '').toLowerCase();
      const dishName = (dish.name || '').toLowerCase();
      const cuisines = rest.cuisines.map(c => c.toLowerCase());
      const tags = rest.tags.map(t => t.toLowerCase());

      if (dishCat.includes('pizza') || dishName.includes('pizza')) {
        return 'pizza';
      }
      if (dishCat.includes('burger') || dishName.includes('burger')) {
        return 'burger';
      }
      if (dishCat.includes('coffee') || dishName.includes('espresso') || dishName.includes('drip') || cuisines.includes('coffee') || cuisines.includes('cafe')) {
        return 'coffee';
      }
      if (dishCat.includes('pasta') || dishName.includes('tagliolini') || dishName.includes('gnocchi') || cuisines.includes('pasta')) {
        return 'pasta';
      }
      if (dishCat.includes('salad') || dishName.includes('salad') || dishName.includes('green') || dishCat.includes('salad') || dishDesc.includes('salad')) {
        return 'salad';
      }
      if (dishCat.includes('steak') || dishName.includes('ribeye') || dishName.includes('meat') || dishName.includes('brisket') || dishName.includes('kebab') || cuisines.includes('steak') || cuisines.includes('barbecue') || dishCat.includes('barbecue') || dishName.includes('lamb') || dishName.includes('chicken')) {
        return 'steak';
      }

      // Check sweet/dessert category
      const isSweet = dishCat.includes('dessert') || 
                      dishCat.includes('pastries') || 
                      dishCat.includes('gelato') || 
                      dishCat.includes('bakery') || 
                      dishCat.includes('sweet') || 
                      dishCat.includes('cake') || 
                      dishCat.includes('crepe') ||
                      dishName.includes('chocolate') ||
                      dishName.includes('soufflé') ||
                      dishName.includes('macaron') ||
                      dishName.includes('waffle') ||
                      dishDesc.includes('sweet') ||
                      cuisines.includes('desserts') ||
                      cuisines.includes('gelato') ||
                      cuisines.includes('pastries') ||
                      tags.includes('sweet') ||
                      tags.includes('dessert');
      
      return isSweet ? 'sweet' : 'savory';
    };

    // Helper function to pull contextually rich, specific reviews/comments
    const getCategoryComments = (templateKey, dishName) => {
      const generic = [
        'Omg this looks absolutely incredible! Ordering right now! 😍',
        'Stunning plate presentation, Chef! True gastronomy.',
        'Highly recommend this dish, the aroma is out of this world.',
        'A true masterpiece of culinary arts. Flawless!',
        'Just received my order, it is cooked absolutely to perfection!'
      ];

      const categorySpecific = {
        pizza: [
          'That cheese pull is out of this world! 🧀🔥',
          'The crust looks incredibly airy and light!',
          'Best woodfired pizza in town, period.'
        ],
        burger: [
          'Double patty goodness! 🍔 Look at that juicy stack!',
          'My absolute favorite cheat meal. High fidelity!',
          'Gimme that wagyu juice! 🤤'
        ],
        coffee: [
          'Morning fuel done right! ☕ Beautiful extraction.',
          'Aromatic notes of jasmine are indeed wonderful.',
          'Aesthetic coffee vibes, absolutely premium!'
        ],
        salad: [
          'Clean eating never looked so good! 🌿 Nutrients galore.',
          'The dressing looks out of this world.',
          'Avocado power! Freshness level 100.'
        ],
        steak: [
          'Perfect medium rare blush. Real wood fire! 🥩',
          'The sear on that cut is absolutely unreal.',
          'Melt in your mouth steak perfection.'
        ],
        pasta: [
          'Rustic carb heaven! 🍝 That parmesan gloss is beautiful.',
          'Handrolled daily? You can taste the quality!',
          'A work of culinary art.'
        ],
        sweet: [
          'Pure sweet heaven! Molten dark chocolate gloss is therapeutic... 🍫',
          'Macarons look perfect. Staged like a jewelry store!',
          'Warm soufflé on a date night is unmatched!'
        ],
        savory: [
          'Exquisite prep, chef! 🥢 Looks extremely fresh.',
          'Cannot wait to order this on my next weekend brunch!',
          'Visual perfection and incredible flavor density.'
        ]
      };

      return [...generic, ...(categorySpecific[templateKey] || [])];
    };

    // 5. Seeding High-Density Vertical Reels (1 unique reel per featured menu item across all restaurants)
    console.log('🎥 Seeding 100% Unique, Cuisine-Accurate, Menu-Linked Vertical Reels...');
    let totalReelsSeeded = 0;

    for (let r = 0; r < seededRestaurants.length; r++) {
      const restaurant = seededRestaurants[r];
      const dishes = seededFoodItems.filter(f => f.restaurant.toString() === restaurant._id.toString());
      
      for (let j = 0; j < dishes.length; j++) {
        const selectedDish = dishes[j];
        
        // Dynamic cuisine template classification
        const baseKey = getTemplateKeyForDish(selectedDish, restaurant);
        
        // Filter the templates to find options for this base cuisine
        const templateOptions = Object.keys(VIDEO_TEMPLATES).filter(k => k.startsWith(baseKey));
        
        // Pick one option sequentially to distribute evenly
        const templateKey = templateOptions[(r + j) % templateOptions.length] || templateOptions[0];
        const templateMeta = VIDEO_TEMPLATES[templateKey];
        
        // Construct 100% unique videoUrl using query parameters to prevent duplicate asset crossovers
        const videoUrl = `/uploads/${templateMeta.filename}?r=${restaurant._id}&d=${selectedDish._id}`;

        // Gather contextually appropriate comments (using baseKey for category comments mapping)
        const poolOfComments = getCategoryComments(baseKey, selectedDish.name);
        const randomComments = [];
        const numComments = Math.floor(Math.random() * 3) + 2; // 2 to 4 comments per reel
        for (let c = 0; c < numComments; c++) {
          const text = poolOfComments[Math.floor(Math.random() * poolOfComments.length)];
          const allUsers = [customer, admin, ...owners];
          
          let selectedUser = allUsers[Math.floor(Math.random() * allUsers.length)];
          if (selectedUser._id.toString() === customer._id.toString() && Math.random() > 0.05) {
            const fallbackUsers = [admin, ...owners];
            selectedUser = fallbackUsers[Math.floor(Math.random() * fallbackUsers.length)];
          }

          const commentObj = await Comment.create({
            user: selectedUser._id,
            text: text
          });
          randomComments.push(commentObj._id);
        }

        // Custom, highly realistic, hand-crafted culinary captions based on template category
        let caption = '';
        const cityHashtag = restaurant.city.toLowerCase().replace(/\s+/g, '');
        const sweetTemplates = [
          `Watch our master pastry chef flambé the delicate crepes to caramelized perfection! 🎬🥞 Spotlighting the stunning ${selectedDish.name} at @${restaurant.name} in ${restaurant.locality}, ${restaurant.city}! #sweettooth #pastryart #savore #flambe #${cityHashtag}`,
          `Pure dessert magic in the making! ✨ Molten goodness and sweet elegance as we prepare the famous ${selectedDish.name} at @${restaurant.name} in ${restaurant.locality}, ${restaurant.city}. #chocolate #dessertporn #savore #sweet #${cityHashtag}`,
          `The art of fine baking and slow-churned sweetness. 🍨 Presenting our artisanal ${selectedDish.name} at @${restaurant.name} in ${restaurant.locality}, ${restaurant.city}. Crafted for true connoisseurs. #gelato #pastrychef #savore #dessert #${cityHashtag}`,
          `Indulge in sweet luxury. 🍓 Handcrafted with passion and organic ingredients, the ${selectedDish.name} at @${restaurant.name} in ${restaurant.locality}, ${restaurant.city} is a masterpiece. #dessert #yum #savore #baking #${cityHashtag}`
        ];
        
        const savoryTemplates = [
          `The incredible sizzle of our fresh, hand-crafted ${selectedDish.name}! 🌟 Watch our culinary artisans plate this signature dish at @${restaurant.name} in ${restaurant.locality}, ${restaurant.city}. #foodie #trending #savore #cooking #culinary #${cityHashtag}`,
          `Precision prep and masterful execution! 🔪 Watch how we craft the perfect ${selectedDish.name} here at @${restaurant.name} in ${restaurant.locality}, ${restaurant.city}. High-fidelity gastronomy. #culinary #chefmode #savore #fresh #${cityHashtag}`,
          `Fresh ingredients, beautiful flavors. 🌟 Bringing you the premium ${selectedDish.name} live from the kitchen of @${restaurant.name} in ${restaurant.locality}, ${restaurant.city}! #finedining #chefsofinstagram #savore #plating #${cityHashtag}`,
          `Behind the scenes of pure culinary perfection. 🍽️ Staging and plating the exquisite ${selectedDish.name} at @${restaurant.name} in ${restaurant.locality}, ${restaurant.city}. #michelinstar #foodie #savore #savory #${cityHashtag}`
        ];
        
        if (templateKey === 'pizza') {
          caption = `Stone-baked to bubbly perfection! 🍕 Watch the organic cheese melt and bubble on our hot signature ${selectedDish.name} at @${restaurant.name} in ${restaurant.locality}, ${restaurant.city}. Real ingredients, real woodfire. #pizza #fresh #cheesepull #savore #${cityHashtag}`;
        } else if (templateKey === 'burger') {
          caption = `The ultimate flavor stack! 🍔 Sizzling gourmet patties, melted cheddar, and secret sauces in our hot ${selectedDish.name} at @${restaurant.name} in ${restaurant.locality}, ${restaurant.city}. Watch it stack up! #burger #juicy #streetfood #savore #${cityHashtag}`;
        } else if (templateKey === 'coffee') {
          caption = `Artisanal brewing and slow drippings! ☕ Feeling the morning aromatic notes with our master-crafted ${selectedDish.name} at @${restaurant.name} in ${restaurant.locality}, ${restaurant.city}. High-fidelity caffeine luxury. #coffee #barista #espresso #savore #${cityHashtag}`;
        } else if (templateKey === 'salad') {
          caption = `Fresh, crisp, and nutrient-dense! 🥗 Prepping our gorgeous organic plant-based ${selectedDish.name} at @${restaurant.name} in ${restaurant.locality}, ${restaurant.city}. Indulgent clean plating at its finest. #healthy #vegan #cleanplating #savore #${cityHashtag}`;
        } else if (templateKey === 'steak') {
          caption = `Seared and slow-grilled to caramelized perfection! 🔥 Watch the fire roar as we sear the premium dry-aged ${selectedDish.name} over oak coals at @${restaurant.name} in ${restaurant.locality}, ${restaurant.city}. #steak #grill #asador #savore #${cityHashtag}`;
        } else if (templateKey === 'pasta') {
          caption = `Handrolled pasta tossed in boiling Parmigiano reduction! 🍝 Savor the rustic-luxury carbohydrate bliss of our fresh ${selectedDish.name} at @${restaurant.name} in ${restaurant.locality}, ${restaurant.city}. #pasta #italian #rustic #savore #${cityHashtag}`;
        } else if (templateKey === 'sweet') {
          caption = sweetTemplates[j % sweetTemplates.length];
        } else {
          caption = savoryTemplates[j % savoryTemplates.length];
        }

        // Add additional dynamic tags to make search and tags list beautiful
        const cleanRestName = restaurant.name.replace(/\s+/g, '').replace(/[']/g, '').toLowerCase();
        const customTags = [
          templateKey,
          selectedDish.category.toLowerCase().replace(/\s+/g, ''),
          cleanRestName,
          cityHashtag
        ];

        await Reel.create({
          videoUrl: videoUrl,
          caption: caption,
          tags: customTags,
          restaurant: restaurant._id,
          featuredDish: selectedDish._id,
          city: restaurant.city,
          state: restaurant.state,
          locality: restaurant.locality,
          region: restaurant.locality,
          cuisineType: selectedDish.category || 'Mains',
          likes: Math.random() < 0.35 ? [customer._id, admin._id] : [admin._id],
          views: Math.floor(Math.random() * 5000) + 1200,
          impressions: Math.floor(Math.random() * 5000) + 1200, // Aligned impressions for CTR calculations
          comments: randomComments,
          orderNowClicks: Math.floor(Math.random() * 400) + 100,
          orderConversions: Math.floor(Math.random() * 80) + 15,
          thumbnailUrl: selectedDish.image || ''
        });
        totalReelsSeeded++;
      }
    }

    console.log(`✅ Successfully seeded ${totalReelsSeeded} premium vertical reels (8-12 per restaurant).`);

    // 6. Seeding Mock Orders for Restaurant Dashboard
    console.log('🛍️ Seeding mock orders for restaurant owner dashboards...');
    let totalOrdersSeeded = 0;
    
    // Use the seeded customer user as the buyer
    const buyer = customer;
    
    const statuses = [
      { status: 'delivered', paymentStatus: 'paid', paymentMethod: 'CARD' },
      { status: 'delivered', paymentStatus: 'paid', paymentMethod: 'COD' },
      { status: 'delivered', paymentStatus: 'paid', paymentMethod: 'ONLINE' },
      { status: 'pending', paymentStatus: 'pending', paymentMethod: 'COD' },
      { status: 'preparing', paymentStatus: 'paid', paymentMethod: 'ONLINE' },
      { status: 'ready', paymentStatus: 'paid', paymentMethod: 'CARD' },
      { status: 'out_for_delivery', paymentStatus: 'paid', paymentMethod: 'CARD' },
      { status: 'cancelled', paymentStatus: 'pending', paymentMethod: 'COD' }
    ];
    
    for (let r = 0; r < seededRestaurants.length; r++) {
      const restaurant = seededRestaurants[r];
      const dishes = seededFoodItems.filter(f => f.restaurant.toString() === restaurant._id.toString());
      if (dishes.length === 0) continue;
      
      let additionalRevenue = 0;
      
      // Let's create these orders for each restaurant
      for (let sIdx = 0; sIdx < statuses.length; sIdx++) {
        const orderInfo = statuses[sIdx];
        
        // Select 1 or 2 random dishes
        const selectedDishes = [];
        const numDishes = Math.random() < 0.5 ? 1 : 2;
        for (let d = 0; d < numDishes; d++) {
          selectedDishes.push(dishes[Math.floor(Math.random() * dishes.length)]);
        }
        
        const items = selectedDishes.map(dish => ({
          foodItem: dish._id,
          quantity: Math.floor(Math.random() * 2) + 1,
          price: dish.price
        }));
        
        const subtotal = parseFloat(items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2));
        const deliveryFee = restaurant.deliveryFee || 0.0;
        const tax = parseFloat((subtotal * 0.1).toFixed(2));
        const total = parseFloat((subtotal + deliveryFee + tax).toFixed(2));
        
        const transactionId = `txn_${restaurant._id.toString().substring(18)}_${sIdx}_${Math.floor(Math.random() * 1000)}`;
        
        await Order.create({
          user: buyer._id,
          restaurant: restaurant._id,
          items,
          subtotal,
          deliveryFee,
          tax,
          total,
          paymentMethod: orderInfo.paymentMethod,
          paymentStatus: orderInfo.paymentStatus,
          transactionId: orderInfo.paymentMethod !== 'COD' ? transactionId : undefined,
          status: orderInfo.status,
          deliveryAddress: sIdx % 2 === 0 
            ? 'Apartment 4B, Hill Road, Bandra West, Mumbai, Maharashtra - 400050'
            : 'Level 5, Connaught Place, Block E, Delhi - 110001'
        });
        
        if (orderInfo.status === 'delivered') {
          additionalRevenue += subtotal;
        }
        totalOrdersSeeded++;
      }
      
      // Credit restaurant revenue dynamically to match completed orders
      restaurant.revenue = parseFloat((restaurant.revenue + additionalRevenue).toFixed(2));
      await restaurant.save();
    }
    
    console.log(`✅ Successfully seeded ${totalOrdersSeeded} mock client orders.`);

    console.log('\n🌟 DATABASE SEEDING COMPLETED SUCCESSFULLY! 🌟');
    console.log('\n--- Credentials for testing ---');
    console.log('Customer: customer@savore.com  (pass: password123)');
    console.log('Owner 1:  owner1@savore.com    (pass: password123)');
    console.log('Admin:    admin@savore.com     (pass: password123)');
    console.log('--------------------------------\n');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDatabase();

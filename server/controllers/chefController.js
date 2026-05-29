const { GoogleGenerativeAI } = require('@google/generative-ai');
const FoodItem = require('../models/FoodItem');
const Restaurant = require('../models/Restaurant');

// Initialize Gemini SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ── Robust JSON extraction: strips markdown fences Gemini sometimes wraps output in ──
const safeParseJSON = (raw) => {
  if (!raw) return null;
  // Strip ```json ... ``` or ``` ... ``` code fences
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Last-resort: extract the first {...} block
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { return null; }
    }
    return null;
  }
};

// ── Gemini API timeout — raised to 14s (gemini-2.5-flash needs time for JSON mode) ──
const GEMINI_TIMEOUT_MS = 14000;

/**
 * Helper to construct the premium Chef personality system prompt.
 */
const buildSystemPrompt = (context, availableDishes = [], isRecommendationOnly = false) => {
  const city = context.activeCity || 'Mumbai';
  const locality = context.activeLocality || 'Bandra';
  const timeOfDay = context.timeOfDay || 'evening';
  const prefs = context.userPreferences || {};
  const currentPath = context.currentPath || 'Home';
  
  // Cart analysis for context-responsive recommendations
  const cartItems = context.cartItems || [];
  const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0);
  const hasPizza = cartItems.some(item => item.name && item.name.toLowerCase().includes('pizza'));
  const hasSushi = cartItems.some(item => item.name && (item.name.toLowerCase().includes('sushi') || item.name.toLowerCase().includes('roll')));
  
  // Construct dynamic India-specific location guidelines
  let locationGuideline = "";
  if (city === 'Mumbai') {
    locationGuideline = "The user is in Mumbai. Leverage Mumbai's famous coastal, street food, Wada Pav, and roll vibes where appropriate.";
  } else if (city === 'Bengaluru') {
    locationGuideline = "The user is in Bengaluru. Highlight premium café culture, gourmet burgers, specialty coffee, and authentic crispy dosa spots where appropriate.";
  } else if (city === 'Delhi') {
    locationGuideline = "The user is in Delhi. Celebrate robust North Indian curries, aromatic kebabs, and rich street food flavors where appropriate.";
  } else {
    locationGuideline = `The user is in ${city}, ${locality}. Adapt your suggestions to fit the regional context.`;
  }

  // Construct temporal guidelines
  let timeGuideline = "";
  if (timeOfDay === 'morning') {
    timeGuideline = "It is morning. Focus on gourmet breakfasts, single-origin coffees, and light morning refreshers.";
  } else if (timeOfDay === 'afternoon') {
    timeGuideline = "It is afternoon. Recommend satisfying gourmet lunch platters, salads, and refreshing cold drinks.";
  } else if (timeOfDay === 'evening') {
    timeGuideline = "It is evening. Focus on rich dinners, fine wines, premium signature entrees, and exquisite chef creations.";
  } else {
    timeGuideline = "It is late-night. Focus on comforting midnight snacks, indulgent desserts, and soul-warming comfort foods.";
  }

  // User profiles dietary and spicy preferences
  let preferenceGuideline = "";
  if (prefs.dietary === 'vegetarian') {
    preferenceGuideline += "- The user is strictly VEGETARIAN. You MUST recommend VEGETARIAN dishes only.\n";
  } else if (prefs.dietary === 'vegan') {
    preferenceGuideline += "- The user is strictly VEGAN. You MUST recommend VEGAN dishes only.\n";
  }
  if (prefs.spicyLevel === 'high' || prefs.spicyLevel === 'spicy') {
    preferenceGuideline += "- The user loves SPICY food. Prioritize high-spiciness dishes, fusion curries, and bold peppers.\n";
  } else if (prefs.spicyLevel === 'none' || prefs.spicyLevel === 'mild') {
    preferenceGuideline += "- The user prefers MILD/NO SPICE. Avoid spicy foods and highlight smooth, creamy, or sweet options.\n";
  }

  // Cart guidelines
  let cartGuideline = "";
  if (cartItems.length > 0) {
    cartGuideline = `The user currently has: ${JSON.stringify(cartItems)} in their cart. `;
    if (hasPizza) {
      cartGuideline += "Since they have pizza, recommend dynamic pairings like garlic bread, side dips, carbonated beverages, or warm brownies. ";
    } else if (hasSushi) {
      cartGuideline += "Since they have sushi, suggest a clean, crisp pairing like seaweed salad, tempura sides, or a chilled matcha-based beverage. ";
    }
    if (cartTotal < 600) {
      cartGuideline += "The order volume is relatively low. Suggest an affordable, high-margin side, appetizer, or quick dessert to round out the meal. ";
    } else if (cartTotal > 1500) {
      cartGuideline += "The order volume is already premium and large. Avoid aggressive upselling; suggest a light post-dinner dessert or a refreshing digestive beverage. ";
    }
  }

  // Page constraint (Strict)
  let pageGuideline = "";
  if (currentPath.includes('/restaurant/')) {
    pageGuideline = `CRITICAL: The user is currently browsing a specific restaurant page: "${context.restaurantName || 'Current Restaurant'}". You MUST ONLY recommend dishes from the available menu below which belong to this restaurant. Do NOT recommend items from any other restaurant.`;
  } else if (currentPath.includes('/reels')) {
    pageGuideline = "The user is watching food reels. Recommend trending, highly visual, and viral signature recipes.";
  } else if (currentPath === '/cart' || currentPath === '/checkout') {
    pageGuideline = "The user is in checkout. Focus strictly on exquisite pairings, desserts, or non-alcoholic pairings that add premium value to the active cart.";
  } else {
    pageGuideline = "The user is exploring the home discovery page. Give a premium, context-rich culinary discovery suggestion.";
  }

  return `You are Chef Savoré — a passionate, witty, Michelin-starred culinary AI assistant embedded in Savoré, a luxury food ordering platform.
You speak with warmth, culinary expertise, and a touch of refined French flair (using expressions like "Magnifique!", "Voilà!", "Bon appétit!").
Keep your responses highly coherent, context-aware, food-focused, and concise (strictly under 3 sentences). Never break character.
Maintain short-term conversational consistency: if the user previously specified a cuisine, diet (like vegetarian), or flavor (like spicy) in the history, combine those criteria dynamically!

Savoré Platform Knowledge Base (Use this to answer questions about the website):
- Savoré is a premium cinematic food-tech SaaS built on the MERN stack (React 19, Express, Node, MongoDB).
- Cinematic Reels Feed: Swipe through lag-free, preloaded short-form video reels of dishes. Users can double-tap to like (floating heart animations), check community comments, and buy/order instantly using the card overlay.
- Weather-Aware Recommendations: Location APIs determine the user's city (Mumbai street-food, Bengaluru cafes, Delhi curries/kebabs) and map weather states dynamically (e.g. warm soups on rainy/chilly days, chilled gelatos and fresh smoothies on hot days).
- Hardened Security: Dual-token JWT (access & refresh) rotation protocol for secure session management. Segregated roles for Customers and Merchants (Restaurant Owners who have a metrics & menu dashboard).
- Stripe Gateway: Secure PCI-compliant payment integrations using tokenized Stripe Elements and server-side webhooks (listening to Stripe webhook event 'payment_intent.succeeded' to safely process orders).

Operational Parameters:
- Location Context: ${city}, ${locality}. ${locationGuideline}
- Temporal Vibe: ${timeGuideline}
- User Preferences:
${preferenceGuideline}
- Active Cart Dynamics:
${cartGuideline}
- Page/Scope Restraints:
${pageGuideline}

Available Menu (MongoDB entries):
${JSON.stringify(availableDishes.map(d => ({ id: d._id, name: d.name, category: d.category, description: d.description, price: d.price, restaurant: d.restaurant ? d.restaurant.name : 'Curated Kitchen' })))}

You MUST respond strictly with a valid JSON object matching the following structure:
{
  "reply": "A concise, engaging, French-flaired response addressing the conversation.",
  "recommendedDishId": "Select the MongoDB '_id' of the dish from the available menu to recommend. CRITICAL: Set to null unless the user explicitly asks for a recommendation, asks for food suggestions, or clicks/taps on you for a dish. If the user is just saying hello, greeting you, or asking general non-food questions, you MUST set this to null.",
  "quote": "A 1-sentence passionate description of the recommended dish (only if recommendedDishId is not null)."
}

CRITICAL RULE FOR DISH RECOMMENDATIONS:
Only recommend a dish (set 'recommendedDishId' to a valid MongoDB ID) if the user explicitly asks for a food suggestion, asks for a recommendation, says they are hungry, or craves a flavor/dish. If the user is just greeting you (e.g. saying 'hey', 'hello', 'bonjour'), asking general questions, or talking about website features, you MUST set 'recommendedDishId' to null and 'quote' to null.`;
};

/**
 * Local rule-based failsafe fallback engine.
 * Triggers automatically if Gemini API key is missing, rate-limited, times out, or fails.
 */
/**
 * Local rule-based failsafe fallback engine.
 * Triggers automatically if Gemini API key is missing, rate-limited, times out, or fails.
 */
const getFailsafeChefResponse = async (messageText, context, history = []) => {
  console.log(`🛡️  [Chef Savoré Failsafe] Activating fallback chef engine for message: "${messageText}"`);

  const city = context?.activeCity || 'Mumbai';
  const timeOfDay = context?.timeOfDay || 'evening';
  const prefs = context?.userPreferences || {};
  const currentPath = context?.currentPath || 'Home';
  
  // Cart analysis
  const cartItems = context?.cartItems || [];
  const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0);
  const hasPizza = cartItems.some(item => item.name && item.name.toLowerCase().includes('pizza'));
  const hasSushi = cartItems.some(item => item.name && (item.name.toLowerCase().includes('sushi') || item.name.toLowerCase().includes('roll')));
  const hasBurger = cartItems.some(item => item.name && item.name.toLowerCase().includes('burger'));

  let query = { isAvailable: true };
  if (context?.restaurantId) {
    query.restaurant = context.restaurantId;
  }

  // Fetch available dishes to recommend
  const dishes = await FoodItem.find(query).populate('restaurant');
  if (dishes.length === 0) {
    return {
      reply: "Bon appétit! My kitchen is currently prepping some magical ingredients. What type of flavors are you craving today? 👨‍🍳✨",
      recommendation: null
    };
  }

  const msgLower = (messageText || "").toLowerCase();
  
  // High-Priority Platform Knowledge Fallbacks
  let customReply = null;
  if (msgLower.includes("reel") || msgLower.includes("swipe") || msgLower.includes("video") || msgLower.includes("scroll")) {
    customReply = "Ah, our Cinematic Reels! Swipe through lag-free vertical food videos, double-tap to like with floating hearts, and add items directly to your cart in one smooth touch. Magnifique, non?";
  } else if (msgLower.includes("stripe") || msgLower.includes("payment") || msgLower.includes("secure") || msgLower.includes("pay") || msgLower.includes("card")) {
    customReply = "Rest assured, mon ami! All payments are processed via secure, PCI-compliant Stripe Element tokenization. Our backend listens to Stripe webhooks for safe order processing!";
  } else if (msgLower.includes("weather") || msgLower.includes("rain") || msgLower.includes("sun") || msgLower.includes("temperature")) {
    customReply = "Mais oui! Savoré maps weather state to hot or cold gourmet items dynamically—like suggesting a warm comforting ramen on rainy days, or a fresh gelato on hot sunny afternoons!";
  } else if (msgLower.includes("jwt") || msgLower.includes("auth") || msgLower.includes("security") || msgLower.includes("password") || msgLower.includes("token")) {
    customReply = "Savoré uses dual-token JWT (Access & Refresh) rotation protocols. This prevents session hijacking and keeps your private data locked tighter than my secret spice drawer!";
  } else if (msgLower.includes("merchant") || msgLower.includes("owner") || msgLower.includes("dashboard") || msgLower.includes("role") || msgLower.includes("rbac")) {
    customReply = "Our platform features robust Role-Based Access Controls (RBAC), offering premium Customer portals and rich Merchant Dashboards for restaurant menu and sales management. Exquisite engineering!";
  } else if (msgLower.includes("how it works") || msgLower.includes("what is this") || msgLower.includes("savore") || msgLower.includes("platform") || msgLower.includes("framework")) {
    customReply = "Voilà! Savoré is a premium MERN-stack culinary SaaS that connects beautiful, short-form food reels directly with high-end, on-demand food delivery. A true culinary masterpiece!";
  }

  if (customReply) {
    return {
      reply: customReply,
      recommendation: null
    };
  }

  // Check if the user is explicitly asking for food suggestions, recommendations, or clicked/tapped the chef Mascot
  const isAskingForRecommendation = 
    msgLower.includes("recommend") || 
    msgLower.includes("suggest") || 
    msgLower.includes("eat") || 
    msgLower.includes("food") || 
    msgLower.includes("dish") || 
    msgLower.includes("hungry") || 
    msgLower.includes("crave") || 
    msgLower.includes("spicy") || 
    msgLower.includes("sweet") || 
    msgLower.includes("veg") || 
    msgLower.includes("menu") || 
    msgLower.includes("order") || 
    msgLower.includes("what should i") || 
    msgLower.includes("give me") ||
    msgLower.includes("pizza") ||
    msgLower.includes("pasta") ||
    msgLower.includes("burger") ||
    msgLower.includes("coffee") ||
    msgLower.includes("salad") ||
    msgLower.includes("dessert") ||
    msgLower.includes("steak") ||
    messageText === 'recommend';

  if (!isAskingForRecommendation) {
    let greetingReply = "Ah, bonjour mon ami! I am ready to cook up some culinary genius. Ask me anything or click on me for a recommendation! 👨‍🍳✨";
    if (msgLower.includes("hello") || msgLower.includes("hi") || msgLower.includes("hey") || msgLower.includes("bonjour") || msgLower.includes("yo")) {
      greetingReply = "Ah, bonjour! It is a pleasure to meet a fellow culinary lover. How can Chef Savoré assist your palate today? 👨‍🍳✨";
    }
    return {
      reply: greetingReply,
      recommendation: null
    };
  }
  
  // Scrape history for preferences to keep conversational memory alive in fallback
  let prefSpicy = prefs.spicyLevel === 'high' || prefs.spicyLevel === 'spicy' || msgLower.includes("spicy") || msgLower.includes("hot") || msgLower.includes("chili") || msgLower.includes("chilly");
  let prefVeg = prefs.dietary === 'vegetarian' || msgLower.includes("veg") || msgLower.includes("vegetarian") || msgLower.includes("herbivore");
  let prefSweet = msgLower.includes("sweet") || msgLower.includes("dessert") || msgLower.includes("chocolate") || msgLower.includes("sugar");

  if (history && history.length > 0) {
    history.forEach(h => {
      const txt = (h.text || "").toLowerCase();
      if (txt.includes("spicy") || txt.includes("hot") || txt.includes("chili") || txt.includes("chilly")) {
        prefSpicy = true;
      }
      if (txt.includes("veg") || txt.includes("vegetarian") || txt.includes("herbivore")) {
        prefVeg = true;
      }
      if (txt.includes("sweet") || txt.includes("dessert") || txt.includes("chocolate") || txt.includes("sugar")) {
        prefSweet = true;
      }
    });
  }

  // Apply vegetarian filtering strictly if requested or preferred
  let filteredDishes = dishes;
  if (prefVeg) {
    filteredDishes = dishes.filter(d => 
      (d.category && d.category.toLowerCase().includes('veg')) || 
      (d.name && d.name.toLowerCase().includes('veg')) || 
      (d.description && d.description.toLowerCase().includes('veg')) ||
      (d.category && d.category.toLowerCase().includes('pasta')) ||
      (d.category && d.category.toLowerCase().includes('dessert')) ||
      (d.category && d.category.toLowerCase().includes('gelato')) ||
      (d.category && d.category.toLowerCase().includes('coffee')) ||
      (d.category && d.category.toLowerCase().includes('bakery')) ||
      (d.name && d.name.toLowerCase().includes('parmesan')) ||
      (d.name && d.name.toLowerCase().includes('truffle')) ||
      (d.name && d.name.toLowerCase().includes('crepe'))
    );
    if (filteredDishes.length === 0) filteredDishes = dishes; // Fallback if no veg items
  }

  let selectedDish = null;
  let reply = "";
  let quote = "";

  // 1. Memory and Preference Matching
  if (prefSweet) {
    selectedDish = filteredDishes.find(d => 
      (d.category && d.category.toLowerCase().includes("dessert")) || 
      (d.category && d.category.toLowerCase().includes("gelato")) || 
      (d.category && d.category.toLowerCase().includes("crepe"))
    );
    if (selectedDish) {
      reply = "Ah, l'amour du sucré! A meal without a sweet, elegant finale is like a day without sunshine, mon ami.";
      quote = "Perfectly baked and delicately structured, it rises beautifully for an airy, luscious, sweet finish!";
    }
  } else if (prefSpicy) {
    selectedDish = filteredDishes.find(d => 
      (d.name && d.name.toLowerCase().includes("spicy")) || 
      (d.name && d.name.toLowerCase().includes("chili")) || 
      (d.name && d.name.toLowerCase().includes("sichuan")) || 
      (d.name && d.name.toLowerCase().includes("kebab"))
    );
    if (selectedDish) {
      reply = "Ah, you seek the fire! For a beautifully spiced masterpiece that dances on the palate, I have prepared something special.";
      quote = "Simmered in authentic tandoori spices and velvety ghee, this represents sheer culinary warmth!";
    }
  }

  // 2. Cart-Aware Pairing Matchers
  if (!selectedDish && cartItems.length > 0) {
    if (hasPizza || hasBurger) {
      // Suggest sides / starters
      selectedDish = filteredDishes.find(d => 
        (d.category && d.category.toLowerCase().includes("sides")) ||
        (d.category && d.category.toLowerCase().includes("tapas"))
      );
      if (selectedDish) {
        reply = "Magnifique choice with that main! To round out your selection, a savory side would match beautifully.";
        quote = "Crisp, flavorful, and cooked to a beautiful golden finish, it makes the perfect culinary partner!";
      }
    }
    
    // Add-on recommendations based on pricing
    if (!selectedDish) {
      if (cartTotal < 600) {
        // Suggest an affordable sweet dessert
        selectedDish = filteredDishes.find(d => 
          d.price < 15 && (
            (d.category && d.category.toLowerCase().includes("dessert")) || 
            (d.category && d.category.toLowerCase().includes("gelato")) ||
            (d.category && d.category.toLowerCase().includes("crepe"))
          )
        );
        if (selectedDish) {
          reply = "Your order looks delicious! May I suggest completing this beautiful journey with a little sweet touch?";
          quote = "Delicately sweetened and served fresh, it is the ultimate way to complete a beautiful bite!";
        }
      } else if (cartTotal > 1500) {
        // High budget digestif suggestion
        selectedDish = filteredDishes.find(d => 
          (d.category && d.category.toLowerCase().includes("coffee")) || 
          (d.name && d.name.toLowerCase().includes("espresso")) ||
          (d.category && d.category.toLowerCase().includes("gelato"))
        );
        if (selectedDish) {
          reply = "A truly grand feast! For a grand order, a light, refreshing espresso digestif represents pure high-end luxury.";
          quote = "Prepared via slow-drip extraction, it reveals clean, aromatic notes to refresh the palate!";
        }
      }
    }
  }

  // 3. Location-Based Matching
  if (!selectedDish) {
    if (city === 'Mumbai') {
      selectedDish = filteredDishes.find(d => 
        (d.name && d.name.toLowerCase().includes("roll")) || 
        (d.name && d.name.toLowerCase().includes("crab")) ||
        (d.name && d.name.toLowerCase().includes("oyster")) ||
        (d.name && d.name.toLowerCase().includes("sea"))
      );
      if (selectedDish) {
        reply = "Ah, greeting from the bustling shores of Mumbai! Savor a premium local coastal selection, mon ami!";
        quote = "Packed with fresh, coastal-style spices, it is pure sea-side poetry on a plate!";
      }
    } else if (city === 'Bengaluru') {
      selectedDish = filteredDishes.find(d => 
        (d.name && d.name.toLowerCase().includes("burger")) || 
        (d.name && d.name.toLowerCase().includes("coffee")) || 
        (d.name && d.name.toLowerCase().includes("waffle")) ||
        (d.name && d.name.toLowerCase().includes("crepe"))
      );
      if (selectedDish) {
        reply = "Greetings from the cozy café spots of Bengaluru! Indulge in an exquisite, modern culinary masterpiece.";
        quote = "Tightly packed with premium artisanal ingredients, it delivers absolute crispness and robust flavor!";
      }
    } else if (city === 'Delhi') {
      selectedDish = filteredDishes.find(d => 
        (d.name && d.name.toLowerCase().includes("kebab")) || 
        (d.name && d.name.toLowerCase().includes("curry")) ||
        (d.name && d.name.toLowerCase().includes("sichuan")) ||
        (d.name && d.name.toLowerCase().includes("chicken"))
      );
      if (selectedDish) {
        reply = "Greetings from the heart of Delhi! Experience a rich, slow-simmered classic full of aromatic herbs.";
        quote = "Marinated overnight in authentic tandoori spices, this is a masterclass in slow-cooked luxury!";
      }
    }
  }

  // 4. Temporal Matching
  if (!selectedDish) {
    if (timeOfDay === 'morning') {
      selectedDish = filteredDishes.find(d => 
        (d.category && d.category.toLowerCase().includes("breakfast")) || 
        (d.category && d.category.toLowerCase().includes("coffee")) || 
        (d.category && d.category.toLowerCase().includes("bakery"))
      );
      if (selectedDish) {
        reply = "Bonjour! A magnificent morning calls for l'arome du café and a beautifully crafted bakery creation.";
        quote = "Light, crisp, and packed with delicate morning energy, it is the only way to begin a beautiful day!";
      }
    }
  }

  // 5. Fallback selection if no match
  if (!selectedDish && filteredDishes.length > 0) {
    selectedDish = filteredDishes.find(d => 
      d.name && (d.name.includes("Truffle") || d.name.includes("Wagyu") || d.name.includes("Lobster"))
    ) || filteredDishes[Math.floor(Math.random() * filteredDishes.length)];
    reply = "Ah, bonjour! Let me suggest trusting your refined culinary instincts with this magnificent signature selection!";
    quote = "Crafted with local, premium ingredients, this selection represents sheer comfort and michelin-starred expertise!";
  }

  if (!selectedDish) {
    return {
      reply: "Bon appétit, mon ami! My kitchen is currently buzzing with intense, magnificent aromas. Try something warm and comforting! 🍷✨",
      recommendation: null
    };
  }

  return {
    reply: `${reply} Voilà! I highly recommend starting your order with this exquisite dish.`,
    recommendation: {
      _id: selectedDish._id,
      dish: selectedDish.name,
      restaurant: selectedDish.restaurant ? selectedDish.restaurant.name : "Savoré Curated Kitchen",
      restaurantObj: {
        _id: selectedDish.restaurant ? selectedDish.restaurant._id : "",
        name: selectedDish.restaurant ? selectedDish.restaurant.name : "Savoré Curated Kitchen",
        deliveryFee: selectedDish.restaurant ? selectedDish.restaurant.deliveryFee : 0
      },
      price: selectedDish.price,
      image: selectedDish.image,
      quote: `${selectedDish.name} is a culinary work of art! ${quote}`
    }
  };
};

// Helper for failsafe phrasing
const isChatExpandedPrefix = (context) => {
  return "I highly recommend starting your order with this exquisite dish.";
};

// @desc    Converse with Chef Savoré
// @route   POST /api/chef/chat
// @access  Public
exports.chat = async (req, res, next) => {
  const requestTime = new Date().toISOString();
  console.log(`\n📡 [API Request] POST /api/chef/chat started at ${requestTime}`);
  
  // Debug log verifying API key configuration without exposing the secret
  console.log("Gemini Key Exists:", !!process.env.GEMINI_API_KEY);

  try {
    const { message, context, history } = req.body;
    console.log(`💬 [User Message]: "${message}"`);
    console.log(`🌍 [Active Path]: "${context?.currentPath || 'Home'}" | [Restaurant ID]: "${context?.restaurantId || 'None'}"`);

    // Failsafe check: If API key is missing, return graceful fallback directly
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === '') {
      console.log(`⚠️  [Security Warning] GEMINI_API_KEY is not defined in backend/.env. Using local failsafe.`);
      const fallback = await getFailsafeChefResponse(message || '', context || {}, history || []);
      return res.json({ success: true, ...fallback, isFallback: true });
    }

    // Fetch context-appropriate menu items to inform the AI
    let availableDishes = [];
    if (context?.restaurantId) {
      availableDishes = await FoodItem.find({ restaurant: context.restaurantId, isAvailable: true }).limit(8);
      const restObj = await Restaurant.findById(context.restaurantId);
      if (restObj && context) {
        context.restaurantName = restObj.name;
      }
    } else {
      availableDishes = await FoodItem.find({ isAvailable: true }).limit(5);
    }

    // Set up model config - upgraded to gemini-2.5-flash
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const systemPrompt = buildSystemPrompt(context || {}, availableDishes);
    
    // Structure chat history for Gemini
    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: '{"reply": "Ah, bonjour! I am ready to cook up some culinary genius. Ask me anything!", "recommendedDishId": null, "quote": null}' }] }
    ];

    // Append conversation history
    if (history && history.length > 0) {
      history.forEach(msg => {
        contents.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.sender === 'user' ? msg.text : JSON.stringify({ reply: msg.text }) }]
        });
      });
    }

    // Add current user message
    contents.push({ role: 'user', parts: [{ text: message }] });

    console.log(`🤖 [Gemini API] Requesting response from gemini-2.5-flash...`);

    // Race Gemini API against timeout (14s — gemini-2.5-flash needs time for JSON structured output)
    const apiCallPromise = model.generateContent({ contents });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API request timed out')), GEMINI_TIMEOUT_MS)
    );

    const result = await Promise.race([apiCallPromise, timeoutPromise]);

    // Extract response text safely
    const responseText = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text
      || result?.response?.text?.()
      || '';
    console.log(`✅ [Gemini API] Response received. Raw length: ${responseText.length}`);

    // Parse using robust extractor that handles code fences
    let parsedResponse = safeParseJSON(responseText);
    if (!parsedResponse) {
      console.warn('⚠️  [Parser] Could not parse Gemini response, using inline fallback.');
      parsedResponse = {
        reply: 'Magnifique! My kitchen is buzzing with exquisite aromas today.',
        recommendedDishId: null,
        quote: null
      };
    }

    // If Gemini chose a dish, enrich the recommendation with full DB details
    let enrichedRecommendation = null;
    if (parsedResponse.recommendedDishId) {
      const dish = await FoodItem.findById(parsedResponse.recommendedDishId).populate('restaurant');
      if (dish) {
        enrichedRecommendation = {
          _id: dish._id,
          dish: dish.name,
          restaurant: dish.restaurant.name,
          restaurantObj: {
            _id: dish.restaurant._id,
            name: dish.restaurant.name,
            deliveryFee: dish.restaurant.deliveryFee
          },
          price: dish.price,
          image: dish.image,
          quote: parsedResponse.quote || "A masterpiece of flavors!"
        };
        console.log(`🍽️  [Chef Recommendation]: Recommended "${dish.name}" from "${dish.restaurant.name}"`);
      }
    }

    res.json({
      success: true,
      reply: parsedResponse.reply,
      recommendation: enrichedRecommendation
    });
  } catch (error) {
    console.error(`❌ [Gemini Error] Chat call failed:`, error.message);
    // Use failsafe rule-based engine for chat errors too
    try {
      const { message, context, history } = req.body;
      const fallback = await getFailsafeChefResponse(message || '', context || {}, history || []);
      return res.json({ success: true, ...fallback, isFallback: true });
    } catch (fallbackErr) {
      return res.json({
        success: true,
        reply: "Chef Savoré is preparing something wonderful — try again in a moment! 👨‍🍳",
        recommendation: null,
        isFallback: true
      });
    }
  }
};

// @desc    Get dynamic AI recommendation based on current context
// @desc    Get dynamic AI recommendation based on current context
// @route   POST /api/chef/recommend
// @access  Public
exports.recommend = async (req, res, next) => {
  const requestTime = new Date().toISOString();
  console.log(`\n📡 [API Request] POST /api/chef/recommend started at ${requestTime}`);
  
  // Debug log verifying API key configuration without exposing the secret
  console.log("Gemini Key Exists:", !!process.env.GEMINI_API_KEY);

  try {
    const { context, history } = req.body;
    console.log(`🌍 [Active Path]: "${context?.currentPath || 'Home'}" | [Restaurant ID]: "${context?.restaurantId || 'None'}"`);

    // Failsafe check: If API key is missing, return graceful fallback directly
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === '') {
      console.log(`⚠️  [Security Warning] GEMINI_API_KEY is not defined in backend/.env. Using local failsafe.`);
      const fallback = await getFailsafeChefResponse('recommend', context || {}, history || []);
      return res.json({ success: true, ...fallback, isFallback: true });
    }

    let query = { isAvailable: true };
    if (context?.restaurantId) {
      query.restaurant = context.restaurantId;
    }

    const availableDishes = await FoodItem.find(query).populate('restaurant');
    if (availableDishes.length === 0) {
      return res.json({
        success: true,
        reply: "Mon dieu! I couldn't find any dishes to recommend from this kitchen right now!",
        recommendation: null
      });
    }

    // Set up model config - upgraded to gemini-2.5-flash
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const systemPrompt = buildSystemPrompt(context || {}, availableDishes, true);

    // Dynamic Context-Aware contents construction incorporating history (conversational memory)
    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: '{"reply": "Ah, bonjour! I am ready to cook up some culinary genius. Ask me anything!", "recommendedDishId": null, "quote": null}' }] }
    ];

    if (history && history.length > 0) {
      history.forEach(msg => {
        contents.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.sender === 'user' ? msg.text : JSON.stringify({ reply: msg.text }) }]
        });
      });
      contents.push({ role: 'user', parts: [{ text: "Based on our current chat context, preferences, active location, and cart state, please select and recommend the absolute best matching dish from the menu list." }] });
    } else {
      contents.push({ role: 'user', parts: [{ text: "Please recommend the absolute best dish matching my current location, temporal state, page context, and cart profile." }] });
    }

    console.log(`🤖 [Gemini API] Requesting recommendation from gemini-2.5-flash...`);

    // Race Gemini API against timeout (14s — gemini-2.5-flash needs time for JSON structured output)
    const apiCallPromise = model.generateContent({ contents });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API recommendation timed out')), GEMINI_TIMEOUT_MS)
    );

    const result = await Promise.race([apiCallPromise, timeoutPromise]);

    // Extract response text safely
    const responseText = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text
      || result?.response?.text?.()
      || '';
    console.log(`✅ [Gemini API] Recommendation received. Raw length: ${responseText.length}`);

    // Parse using robust extractor
    const parsedResponse = safeParseJSON(responseText);
    if (!parsedResponse || !parsedResponse.recommendedDishId) {
      console.warn('⚠️  [Recommend] No valid dish ID from Gemini — using failsafe.');
      const fallback = await getFailsafeChefResponse('recommend', context, history || []);
      return res.json({ success: true, ...fallback, isFallback: true });
    }

    const dish = availableDishes.find(d => d._id.toString() === parsedResponse.recommendedDishId);
    if (!dish) {
      console.log("⚠️  [Dish Missing] Selected dish not found in menu, triggering fallback.");
      const fallback = await getFailsafeChefResponse('recommend', context || {}, history || []);
      return res.json({ success: true, ...fallback, isFallback: true });
    }

    res.json({
      success: true,
      reply: parsedResponse.reply,
      recommendation: {
        _id: dish._id,
        dish: dish.name,
        restaurant: dish.restaurant ? dish.restaurant.name : "Savoré Curated Kitchen",
        restaurantObj: {
          _id: dish.restaurant ? dish.restaurant._id : "",
          name: dish.restaurant ? dish.restaurant.name : "Savoré Curated Kitchen",
          deliveryFee: dish.restaurant ? dish.restaurant.deliveryFee : 0
        },
        price: dish.price,
        image: dish.image,
        quote: parsedResponse.quote || "Pure perfection on a plate!"
      }
    });
  } catch (error) {
    console.error(`❌ [Gemini Error] Recommendation call failed:`, error.message);
    // Activate rule-based failsafe — guarantees a real dish recommendation always fires
    try {
      const { context, history } = req.body;
      console.log('🛡️  [Recommend] Activating failsafe rule-based recommendation engine...');
      const fallback = await getFailsafeChefResponse('recommend', context || {}, history || []);
      return res.json({ success: true, ...fallback, isFallback: true });
    } catch (fallbackErr) {
      console.error('❌ [Failsafe Error]', fallbackErr.message);
      return res.json({
        success: true,
        reply: "Chef Savoré is preparing something wonderful — please try again in a moment! 👨‍🍳",
        recommendation: null,
        isFallback: true
      });
    }
  }
};

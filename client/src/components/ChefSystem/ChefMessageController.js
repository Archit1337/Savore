// Savoré — Chef Message Controller

export const CHEF_POOLS = {
  common: [
    { text: "Fresh flavors are waiting 🍽️", weight: 70 },
    { text: "Try something spicy today 🔥", weight: 70 },
    { text: "Good food = good mood ✨", weight: 70 },
    { text: "A little indulgence is okay 😋", weight: 70 },
    { text: "Craving detected… activating food mode 🍕", weight: 70 },
    { text: "Today’s vibe: comfort food + chill 🍜", weight: 70 },
    { text: "Your perfect meal is just a click away 🍽️", weight: 70 }
  ],
  rare: [
    { text: "Chef recommends this dish 👨‍🍳", weight: 25 },
    { text: "A little indulgence won't hurt today 😌", weight: 25 },
    { text: "Trust me… this one is special ⭐", weight: 25 },
    { text: "This dish hits different 👌", weight: 25 },
    { text: "Happiness served hot 🔥🍲", weight: 25 }
  ],
  secret: [
    { text: "🍳 Shave white truffles using a razor-thin mandoline for maximum aromatic release!", weight: 5 },
    { text: "🔥 For authentic Naan crust bubbles, tandoor clay ovens must exceed 480°C!", weight: 5 },
    { text: "🍣 Savor Edo-style sushi in a single bite to capture the balance of vinegar, rice, and fish!", weight: 5 },
    { text: "🧈 Emulsify pasta sauces with a ladle of salted pasta water for a silky, glossy coating!", weight: 5 },
    { text: "🍫 Chocolate soufflés rise perfectly when egg whites are whipped to glossy, firm peaks!", weight: 5 },
    { text: "🦆 Render duck breast fat slowly on low heat before searing to get a gold, crispy finish!", weight: 5 }
  ]
};

// Context-aware speech bubbles
export const CONTEXT_MESSAGES = {
  HOME: "Hungry? Let's find something amazing 🍕",
  EMPTY_CART: "Your table is empty… let's find something delicious! 🍽️",
  FULL_CART: "Your selection is exquisite! Ready to checkout? 🚀😋",
  DISCOVER: "So many incredible kitchens! Let's explore 🌮✨",
  ITEM_ADDED: "Great choice! That looks absolutely delicious 🔥",
  CHECKOUT: "Almost there… delicious moment incoming ✨",
  REELS: "That looked tasty 😋",
  REEL_LIKED: "Delicious choice! Sending love to the kitchen ❤️"
};

export class ChefMessageController {
  constructor() {
    this.history = [];
  }

  // Get time-of-day greeting prefix
  getTimeOfDayGreeting() {
    const hours = new Date().getHours();
    if (hours < 12) return "Good morning! ☀️";
    if (hours < 17) return "Good afternoon! 🌤️";
    return "Good evening! 🌙";
  }

  // Weighted Selection Logic with dynamic history buffering (blocks last 3)
  getNextMessage(context = null) {
    if (context && CONTEXT_MESSAGES[context]) {
      let text = CONTEXT_MESSAGES[context];
      if (context === 'HOME') {
        text = `${this.getTimeOfDayGreeting()} ${text}`;
      }
      return { text, category: 'context' };
    }

    // Determine category based on weighted roll
    const rand = Math.random() * 100;
    let category = 'common';
    if (rand < 5) {
      category = 'secret';
    } else if (rand < 30) {
      category = 'rare';
    }

    const pool = CHEF_POOLS[category];
    // Filter out messages present in last 3 history items
    const activePool = pool.filter(msg => !this.history.includes(msg.text));
    
    // In case all elements are filtered, fall back to full pool
    const selectedPool = activePool.length > 0 ? activePool : pool;
    const randomIndex = Math.floor(Math.random() * selectedPool.length);
    const chosen = selectedPool[randomIndex];

    // Maintain history buffer (max 3 items)
    this.history.push(chosen.text);
    if (this.history.length > 3) {
      this.history.shift();
    }

    return { text: chosen.text, category };
  }
}

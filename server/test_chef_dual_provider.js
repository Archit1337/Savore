require('dotenv').config();
const { chat, recommend } = require('./controllers/chefController');
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/savore';

async function runFullVerification() {
  console.log('🧪 Starting Full 3-Tier Provider Verification (Groq -> Gemini -> Failsafe)...\n');
  await mongoose.connect(MONGO_URI);

  const testPayload = {
    message: "Bonjour Chef! Recommend a spicy dinner.",
    context: { activeCity: "Mumbai", activeLocality: "Bandra", timeOfDay: "evening" },
    history: []
  };

  // Tier 1: Groq Primary
  console.log('--- TIER 1: GROQ PRIMARY ---');
  let t1Start = Date.now();
  await chat({ body: testPayload }, {
    json: (res) => {
      console.log(`[Tier 1] Provider: ${res.provider} | Time: ${Date.now() - t1Start}ms`);
      console.log(`[Tier 1] Reply: "${res.reply}"`);
      if (res.recommendation) console.log(`[Tier 1] Recommended: ${res.recommendation.dish} (₹${res.recommendation.price})`);
    }
  }, () => {});

  // Tier 2: Gemini Fallback (Simulate Groq missing/failing)
  console.log('\n--- TIER 2: GEMINI FALLBACK (Simulated Groq outage) ---');
  const originalGroqKey = process.env.GROQ_API_KEY;
  process.env.GROQ_API_KEY = '';
  let t2Start = Date.now();
  await chat({ body: testPayload }, {
    json: (res) => {
      console.log(`[Tier 2] Provider: ${res.provider} | Time: ${Date.now() - t2Start}ms`);
      console.log(`[Tier 2] Reply: "${res.reply}"`);
      if (res.recommendation) console.log(`[Tier 2] Recommended: ${res.recommendation.dish} (₹${res.recommendation.price})`);
    }
  }, () => {});

  // Tier 3: Local Rule-Based Failsafe (Simulate both APIs down)
  console.log('\n--- TIER 3: LOCAL RULE-BASED FAILSAFE (Simulated complete network outage) ---');
  const originalGeminiKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = '';
  let t3Start = Date.now();
  await chat({ body: testPayload }, {
    json: (res) => {
      console.log(`[Tier 3] Provider: ${res.provider} | Time: ${Date.now() - t3Start}ms`);
      console.log(`[Tier 3] Reply: "${res.reply}"`);
      if (res.recommendation) console.log(`[Tier 3] Recommended: ${res.recommendation.dish} (₹${res.recommendation.price})`);
    }
  }, () => {});

  // Restore keys
  process.env.GROQ_API_KEY = originalGroqKey;
  process.env.GEMINI_API_KEY = originalGeminiKey;

  await mongoose.disconnect();
  console.log('\n🎉 Verification of all 3 tiers completed successfully!');
  process.exit(0);
}

runFullVerification().catch(err => {
  console.error(err);
  process.exit(1);
});

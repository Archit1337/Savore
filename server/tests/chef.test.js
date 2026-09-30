const test = require('node:test');
const assert = require('node:assert/strict');

test('Chef Savoré AI Parser & Response Validation', async (t) => {
  const safeParseJSON = (raw) => {
    if (!raw) return null;
    let cleaned = raw.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try { return JSON.parse(match[0]); } catch { return null; }
      }
      return null;
    }
  };

  await t.test('cleanly parses pure JSON response', () => {
    const raw = '{"reply": "Magnifique!", "recommendedDishId": "123", "quote": "Delicious"}';
    const parsed = safeParseJSON(raw);
    assert.deepEqual(parsed, { reply: 'Magnifique!', recommendedDishId: '123', quote: 'Delicious' });
  });

  await t.test('strips markdown code fences from AI responses', () => {
    const raw = '```json\n{"reply": "Voilà!", "recommendedDishId": null, "quote": null}\n```';
    const parsed = safeParseJSON(raw);
    assert.equal(parsed.reply, 'Voilà!');
    assert.equal(parsed.recommendedDishId, null);
  });

  await t.test('extracts embedded JSON objects surrounded by conversational text', () => {
    const raw = 'Here is your recommendation: {"reply": "Bon appétit!", "recommendedDishId": "456", "quote": "Crispy"} Thank you!';
    const parsed = safeParseJSON(raw);
    assert.equal(parsed.reply, 'Bon appétit!');
    assert.equal(parsed.recommendedDishId, '456');
  });

  await t.test('returns null gracefully on non-JSON raw strings', () => {
    const raw = 'Chef Savoré is cooking up something special.';
    const parsed = safeParseJSON(raw);
    assert.equal(parsed, null);
  });
});

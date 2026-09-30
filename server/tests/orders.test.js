const test = require('node:test');
const assert = require('node:assert/strict');

test('Order Processing, Pricing Integrity & Pincode Validation', async (t) => {
  const CITY_PINCODE_PREFIXES = {
    mumbai: ['400'],
    bombay: ['400'],
    delhi: ['11'],
    'new delhi': ['11'],
    bengaluru: ['560'],
    bangalore: ['560'],
    hyderabad: ['500'],
    secunderabad: ['500'],
    chennai: ['600'],
    madras: ['600'],
    kolkata: ['700'],
    calcutta: ['700'],
    pune: ['411', '412'],
    ahmedabad: ['380', '382'],
    jaipur: ['302'],
    chandigarh: ['160'],
    goa: ['403'],
    kochi: ['682'],
    cochin: ['682'],
    lucknow: ['226'],
    indore: ['452'],
    surat: ['395']
  };

  const getCityAliases = (city) => {
    if (!city) return [];
    const c = city.toLowerCase().trim();
    if (c === 'bengaluru' || c === 'bangalore') return ['bengaluru', 'bangalore'];
    if (c === 'mumbai' || c === 'bombay') return ['mumbai', 'bombay'];
    if (c === 'delhi' || c === 'new delhi') return ['delhi', 'new delhi'];
    if (c === 'kolkata' || c === 'calcutta') return ['kolkata', 'calcutta'];
    if (c === 'chennai' || c === 'madras') return ['chennai', 'madras'];
    if (c === 'hyderabad' || c === 'secunderabad') return ['hyderabad', 'secunderabad'];
    if (c === 'kochi' || c === 'cochin') return ['kochi', 'cochin'];
    return [c];
  };

  const getCityPrefixes = (city) => {
    if (!city) return null;
    const aliases = getCityAliases(city);
    for (const alias of aliases) {
      if (CITY_PINCODE_PREFIXES[alias]) {
        return CITY_PINCODE_PREFIXES[alias];
      }
    }
    return null;
  };

  const isAddressMatchingCity = (addressStr, city) => {
    if (!addressStr || !city) return false;
    const addr = addressStr.toLowerCase().trim();
    const aliases = getCityAliases(city);
    return aliases.some(alias => addr.includes(alias));
  };

  const isAddressValidForRestaurantCity = (addressStr, city) => {
    if (!addressStr || !city) return false;
    const rawPins = addressStr.match(/\b\d{3}\s?\d{3}\b/g);
    if (rawPins && rawPins.length > 0) {
      const pins = rawPins.map(pin => pin.replace(/\s+/g, ''));
      const prefixes = getCityPrefixes(city);
      if (prefixes) {
        const hasValidPin = pins.some(pin => prefixes.some(pref => pin.startsWith(pref)));
        if (hasValidPin) return true;
        return false;
      }
    }
    return isAddressMatchingCity(addressStr, city);
  };

  await t.test('accurately validates addresses with valid city pincodes', () => {
    assert.equal(isAddressValidForRestaurantCity('Flat 402, Bandra West, Mumbai 400050', 'Mumbai'), true);
    assert.equal(isAddressValidForRestaurantCity('Flat 402, Bandra West, Bombay 400050', 'Bombay'), true);
    assert.equal(isAddressValidForRestaurantCity('Connaught Place, New Delhi 110001', 'Delhi'), true);
    assert.equal(isAddressValidForRestaurantCity('Connaught Place, New Delhi 110 001', 'New Delhi'), true);
    assert.equal(isAddressValidForRestaurantCity('12th Main, Indiranagar, Bengaluru 560038', 'Bangalore'), true);
    assert.equal(isAddressValidForRestaurantCity('Salt Lake Sector 5, Kolkata 700091', 'Calcutta'), true);
    assert.equal(isAddressValidForRestaurantCity('Banjara Hills, Hyderabad 500034', 'Secunderabad'), true);
    assert.equal(isAddressValidForRestaurantCity('Fort Kochi, Kochi 682001', 'Cochin'), true);
  });

  await t.test('rejects addresses with mismatched city pincodes', () => {
    // Delhi address with Mumbai restaurant
    assert.equal(isAddressValidForRestaurantCity('Connaught Place, New Delhi 110001', 'Mumbai'), false);
    // Bangalore address with Kolkata restaurant
    assert.equal(isAddressValidForRestaurantCity('Indiranagar, Bangalore 560038', 'Kolkata'), false);
  });

  await t.test('Database Price Override: calculates subtotal strictly from DB prices', () => {
    // Mock DB items
    const dbFoodItems = new Map([
      ['item_1', { _id: 'item_1', name: 'Truffle Risotto', price: 450, isAvailable: true, restaurant: 'rest_A' }],
      ['item_2', { _id: 'item_2', name: 'Wild Mushroom Soup', price: 280, isAvailable: true, restaurant: 'rest_A' }]
    ]);

    // Client attempts to tamper with prices
    const clientOrderItems = [
      { foodItem: 'item_1', quantity: 2, price: 1.00 }, // Client tries paying 1 rupee instead of 450
      { foodItem: 'item_2', quantity: 1, price: 0.50 }  // Client tries paying 50 paise instead of 280
    ];

    let subtotal = 0;
    const validatedItems = [];

    for (const item of clientOrderItems) {
      const foodItem = dbFoodItems.get(item.foodItem);
      assert.ok(foodItem, 'Item must exist in database');
      assert.ok(foodItem.isAvailable, 'Item must be available');
      
      const realItemPrice = foodItem.price; // Enforce DB price
      subtotal += realItemPrice * item.quantity;
      validatedItems.push({
        foodItem: foodItem._id,
        quantity: item.quantity,
        price: realItemPrice,
      });
    }

    subtotal = parseFloat(subtotal.toFixed(2));
    const deliveryFee = 50.0;
    const tax = parseFloat((subtotal * 0.1).toFixed(2));
    const total = parseFloat((subtotal + deliveryFee + tax).toFixed(2));

    // 450 * 2 + 280 * 1 = 1180
    assert.equal(subtotal, 1180);
    assert.equal(tax, 118);
    assert.equal(total, 1348);
    assert.equal(validatedItems[0].price, 450);
    assert.equal(validatedItems[1].price, 280);
  });

  await t.test('Multi-Tenant Room Isolation: enforces owner and admin verification', () => {
    const isSocketAuthorizedForMerchantRoom = (socketUser, targetOwnerId) => {
      if (!socketUser) return false;
      const isGlobalAdmin = socketUser.role === 'admin';
      const isTargetOwner = socketUser._id === targetOwnerId || socketUser.id === targetOwnerId;
      return isGlobalAdmin || isTargetOwner;
    };

    const ownerA = { id: 'user_owner_A', role: 'restaurant' };
    const ownerB = { id: 'user_owner_B', role: 'restaurant' };
    const admin = { id: 'user_admin_root', role: 'admin' };
    const customer = { id: 'user_customer_X', role: 'customer' };

    // Owner A can join Room A
    assert.equal(isSocketAuthorizedForMerchantRoom(ownerA, 'user_owner_A'), true);
    // Owner B CANNOT join Room A (Multi-tenant breach prevented)
    assert.equal(isSocketAuthorizedForMerchantRoom(ownerB, 'user_owner_A'), false);
    // Customer CANNOT join Room A
    assert.equal(isSocketAuthorizedForMerchantRoom(customer, 'user_owner_A'), false);
    // Admin CAN join Room A
    assert.equal(isSocketAuthorizedForMerchantRoom(admin, 'user_owner_A'), true);
  });
});

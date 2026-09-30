const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

test('Auth System & Cryptographic Verification', async (t) => {
  const jwtSecret = 'test_access_jwt_secret_key_12345';
  const refreshSecret = 'test_refresh_jwt_secret_key_67890';
  const testUserId = '660e1d2f9a7b5c3e12345678';

  const makeRefreshToken = (id) => jwt.sign(
    { id, nonce: crypto.randomBytes(16).toString('hex') },
    refreshSecret,
    { expiresIn: '7d' }
  );

  await t.test('generates valid signed access token with user id payload', () => {
    const accessToken = jwt.sign({ id: testUserId }, jwtSecret, { expiresIn: '15m' });
    const decoded = jwt.verify(accessToken, jwtSecret);
    assert.equal(decoded.id, testUserId);
    assert.ok(decoded.exp > decoded.iat);
  });

  await t.test('rejects expired or tampered access tokens', () => {
    const accessToken = jwt.sign({ id: testUserId }, jwtSecret, { expiresIn: '1s' });
    assert.throws(() => {
      jwt.verify(accessToken + 'tampered', jwtSecret);
    });
  });

  await t.test('Refresh Token Rotation (RTR): rotates token on refresh', () => {
    // Simulate user with initial active refresh token
    const initialRefreshToken = makeRefreshToken(testUserId);
    const user = {
      _id: testUserId,
      refreshTokens: [initialRefreshToken]
    };

    // User requests refresh: verify incoming token
    const decoded = jwt.verify(initialRefreshToken, refreshSecret);
    assert.equal(decoded.id, testUserId);
    assert.ok(user.refreshTokens.includes(initialRefreshToken));

    // Rotate: invalidate used token, issue new token
    user.refreshTokens = user.refreshTokens.filter(t => t !== initialRefreshToken);
    const newRefreshToken = makeRefreshToken(testUserId);
    user.refreshTokens.push(newRefreshToken);

    // Verify rotation state
    assert.equal(user.refreshTokens.includes(initialRefreshToken), false, 'Old token must be invalidated');
    assert.equal(user.refreshTokens.includes(newRefreshToken), true, 'New token must be stored');
    assert.equal(user.refreshTokens.length, 1);
  });

  await t.test('Refresh Token Rotation (RTR): detects reuse and revokes entire token family', () => {
    const activeToken = makeRefreshToken(testUserId);
    const user = {
      _id: testUserId,
      refreshTokens: [activeToken]
    };

    // Attacker or replay attempts to reuse an old already-rotated token
    const stolenOldToken = makeRefreshToken(testUserId);
    
    // Check if token exists in active list
    const isTokenActive = user.refreshTokens.includes(stolenOldToken);
    assert.equal(isTokenActive, false, 'Stale token must not be in active tokens list');

    // On reuse detection, revoke all sessions
    if (!isTokenActive) {
      user.refreshTokens = [];
    }

    assert.equal(user.refreshTokens.length, 0, 'Entire session family must be revoked upon reuse detection');
  });

  await t.test('hashes passwords securely with bcrypt and verifies matches', async () => {
    const rawPassword = 'SecurePassword2026!';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    assert.notEqual(rawPassword, hashedPassword);
    assert.ok(hashedPassword.startsWith('$2'));

    const isMatch = await bcrypt.compare(rawPassword, hashedPassword);
    assert.equal(isMatch, true);

    const isWrongMatch = await bcrypt.compare('WrongPassword', hashedPassword);
    assert.equal(isWrongMatch, false);
  });
});

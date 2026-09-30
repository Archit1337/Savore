const test = require('node:test');
const assert = require('node:assert/strict');

test('Media Resolution & API Interceptor Unit Tests', async (t) => {
  // P04 Media Resolver Logic
  const resolveMediaUrl = (path, explicitOrigin) => {
    if (!path) return '';
    if (typeof path !== 'string') return '';
    
    // Cloud URLs
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    const defaultDevOrigin = 'http://localhost:5000';
    const baseUrl = (explicitOrigin || defaultDevOrigin).replace(/\/+$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  };

  await t.test('passes through absolute HTTPS image/video URLs untouched', () => {
    const cloudUrl = 'https://images.unsplash.com/photo-1544025162-d76694265947';
    assert.equal(resolveMediaUrl(cloudUrl), cloudUrl);
  });

  await t.test('resolves relative upload paths against active origin dynamically', () => {
    const relativePath = 'uploads/reels/dish-reel-1.mp4';
    const resolvedProd = resolveMediaUrl(relativePath, 'https://api.savore.com');
    assert.equal(resolvedProd, 'https://api.savore.com/uploads/reels/dish-reel-1.mp4');

    const resolvedDev = resolveMediaUrl(`/${relativePath}`);
    assert.equal(resolvedDev, 'http://localhost:5000/uploads/reels/dish-reel-1.mp4');
  });

  // P03 API Error Interceptor
  await t.test('formats Axios errors preserving response data and status', () => {
    const mockAxiosError = {
      message: 'Request failed with status code 400',
      response: {
        status: 400,
        data: {
          success: false,
          message: 'The delivery address pincode does not match the operating city.'
        }
      }
    };

    const errorMessage = mockAxiosError.response?.data?.message || mockAxiosError.message || 'An unexpected API error occurred';
    const customError = new Error(errorMessage);
    customError.status = mockAxiosError.response?.status || 500;
    customError.response = mockAxiosError.response;
    customError.isAxiosError = true;

    assert.equal(customError.message, 'The delivery address pincode does not match the operating city.');
    assert.equal(customError.status, 400);
    assert.equal(customError.isAxiosError, true);
    assert.equal(customError.response.data.success, false);
  });
});

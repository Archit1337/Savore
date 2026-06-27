/**
 * Dynamic Media URL Resolver Utility
 * 
 * Takes any image or video URL string and ensures it resolves to the correct path.
 * - Leaves absolute URLs (http, https, data URIs) untouched.
 * - Prefixes relative local upload URLs (e.g. /uploads/filename) with the Express backend server port (http://localhost:5000).
 */
export const resolveMediaUrl = (url, fallback = '') => {
  if (!url) {
    return fallback;
  }

  // If it's a client-side Vite asset (starts with /src/ or /assets/ or data URI), return as-is
  if (typeof url === 'string' && (url.startsWith('/src/') || url.startsWith('/assets/') || url.startsWith('data:'))) {
    return url;
  }

  // If already absolute or data URI, handle Unsplash optimization
  if (/^(https?:\/\/|data:)/i.test(url)) {
    // Intercept unsplash.com/photos/... page URLs and resolve them to images.unsplash.com
    if (/unsplash\.com\/photos\//i.test(url)) {
      const parts = url.split('/');
      const lastPart = parts[parts.length - 1];
      const slugParts = lastPart.split('-');
      const photoId = slugParts[slugParts.length - 1];
      
      const unsplashMap = {
        'XoByiBymX20': 'https://images.unsplash.com/photo-1547592180-85f173990554',
        'KlR6vX1R0fQ': 'https://images.unsplash.com/photo-1621468889981-d419e4871999',
        '1H1GdqYeybg': 'https://images.unsplash.com/photo-1606755962773-d324e0a13086'
      };
      
      if (unsplashMap[photoId]) {
        url = unsplashMap[photoId];
      }
    }

    if (url.includes('images.unsplash.com')) {
      let upgradedUrl = url;
      
      // Match the width parameter (w=...)
      const wMatch = url.match(/[?&]w=(\d+)/);
      if (wMatch) {
        const currentW = parseInt(wMatch[1], 10);
        let targetW = 1920; // Default to full HD for cover images
        if (currentW <= 150) {
          targetW = 300; // Small profile pictures/avatars
        } else if (currentW <= 400) {
          targetW = 1000; // Medium food/dish cards
        } else if (currentW <= 800) {
          targetW = 1920; // Large cover banners
        }
        upgradedUrl = upgradedUrl.replace(/([?&])w=\d+/, `$1w=${targetW}`);
      } else {
        // If no width parameter is defined, default to 1920 for banners
        upgradedUrl += (upgradedUrl.includes('?') ? '&' : '?') + 'w=1920';
      }

      // Upgrade quality to 90 for HD crispness
      if (upgradedUrl.includes('q=')) {
        upgradedUrl = upgradedUrl.replace(/([?&])q=\d+/, '$1q=90');
      } else {
        upgradedUrl += '&q=90';
      }

      return upgradedUrl;
    }
    return url;
  }

  // Clean relative path (remove duplicate slashes if any)
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;

  // Direct backend origin port 5000 hosting
  const backendOrigin = 'http://localhost:5000';
  return `${backendOrigin}${cleanUrl}`;
};

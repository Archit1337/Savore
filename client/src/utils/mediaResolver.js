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

  // If already absolute or data URI, handle Unsplash optimization
  if (/^(https?:\/\/|data:)/i.test(url)) {
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

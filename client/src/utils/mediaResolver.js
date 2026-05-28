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

  // If already absolute or data URI, return as-is
  if (/^(https?:\/\/|data:)/i.test(url)) {
    return url;
  }

  // Clean relative path (remove duplicate slashes if any)
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;

  // Direct backend origin port 5000 hosting
  const backendOrigin = 'http://localhost:5000';
  return `${backendOrigin}${cleanUrl}`;
};

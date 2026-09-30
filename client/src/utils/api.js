import axios from 'axios';

// Base API URL pointing to the Express server loaded from environmental settings
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Access Token to Authorization headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('savore_access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Setup dynamic interceptor attachment to handle Auth rotation dynamically and resilience retries
export const setupResponseInterceptor = (logoutUser, refreshTokens) => {
  api.interceptors.response.use(
    (response) => {
      // If a GET request for restaurants or reels succeeds, cache it in sessionStorage for safe resilience fallback
      if (
        response.config &&
        response.config.method === 'get' &&
        (response.config.url.includes('/restaurants') || response.config.url.includes('/reels'))
      ) {
        try {
          sessionStorage.setItem(`savore_cache_${response.config.url}`, JSON.stringify(response.data));
        } catch (e) {
          console.warn('⚠️ Failed to store query cache in sessionStorage:', e.message);
        }
      }
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      // 1. Connection Resilience: Retry failed GET requests up to 3 times with 1.5s delay
      if (
        originalRequest &&
        originalRequest.method === 'get' &&
        !originalRequest.url.includes('/auth/refresh') &&
        !originalRequest.url.includes('/auth/login')
      ) {
        originalRequest._retryCount = originalRequest._retryCount || 0;
        if (originalRequest._retryCount < 3) {
          originalRequest._retryCount += 1;
          console.warn(`⏳ Network drop detected. Retrying GET request ${originalRequest.url} (Attempt ${originalRequest._retryCount}/3)...`);
          await new Promise((resolve) => setTimeout(resolve, 1500));
          return api(originalRequest);
        }
      }

      // 2. Auth Session Rotation interceptor (401 rotation check)
      if (
        error.response &&
        error.response.status === 401 &&
        originalRequest &&
        !originalRequest._authRetry &&
        !originalRequest.url.includes('/auth/refresh') &&
        !originalRequest.url.includes('/auth/login')
      ) {
        originalRequest._authRetry = true;

        try {
          const refreshToken = localStorage.getItem('savore_refresh_token');
          if (!refreshToken) {
            logoutUser();
            return Promise.reject(error);
          }

          // Request a new access token and rotated refresh token
          const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          
          if (res.data && res.data.success) {
            const { accessToken, refreshToken: newRefreshToken } = res.data.data;
            
            // Save new access token and rotated refresh token
            localStorage.setItem('savore_access_token', accessToken);
            if (newRefreshToken) {
              localStorage.setItem('savore_refresh_token', newRefreshToken);
            }
            
            // Update original request headers and retry
            originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('Session refresh failed. Forcing logout:', refreshError.message);
          logoutUser();
          return Promise.reject(refreshError);
        }
      }

      // 3. Stale-Safe Caching Fallback: If network retries fail, load latest successful cached state from sessionStorage
      if (
        originalRequest &&
        originalRequest.method === 'get' &&
        (originalRequest.url.includes('/restaurants') || originalRequest.url.includes('/reels'))
      ) {
        try {
          const cachedData = sessionStorage.getItem(`savore_cache_${originalRequest.url}`);
          if (cachedData) {
            console.warn(`📡 Safe Fallback Caching: Serving cached query for ${originalRequest.url} due to connection error: ${error.message || error}`);
            return {
              data: JSON.parse(cachedData),
              status: 200,
              statusText: 'OK',
              headers: {},
              config: originalRequest,
              isCachedFallback: true,
            };
          }
        } catch (cacheErr) {
          console.error('⚠️ Failed to load stale-safe cache from sessionStorage:', cacheErr.message);
        }
      }

      // Return a standard Error instance preserving Axios response properties and backend messages
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'An unexpected API error occurred';
      const customError = new Error(errorMessage);
      customError.status = error.response?.status || 500;
      customError.response = error.response;
      customError.isAxiosError = true;

      return Promise.reject(customError);
    }
  );
};

export default api;

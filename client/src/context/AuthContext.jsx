import React, { createContext, useState, useEffect } from 'react';
import api, { setupResponseInterceptor } from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Clear all credentials
  const clearAuth = () => {
    localStorage.removeItem('savore_access_token');
    localStorage.removeItem('savore_refresh_token');
    setUser(null);
    setError(null);
  };

  // Logout handler
  const logoutUser = async () => {
    try {
      const refreshToken = localStorage.getItem('savore_refresh_token');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (err) {
      console.warn('Network request failed during logout revocation:', err.message);
    } finally {
      clearAuth();
    }
  };

  // Register handler
  const registerUser = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/register', userData);
      const { accessToken, refreshToken, ...profile } = res.data.data;
      
      localStorage.setItem('savore_access_token', accessToken);
      localStorage.setItem('savore_refresh_token', refreshToken);
      setUser(profile);
      return profile;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login handler
  const loginUser = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken, ...profile } = res.data.data;
      
      localStorage.setItem('savore_access_token', accessToken);
      localStorage.setItem('savore_refresh_token', refreshToken);
      setUser(profile);
      return profile;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Check if session is active on startup
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('savore_access_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (res.data && res.data.success) {
          setUser(res.data.data);
        }
      } catch (err) {
        console.warn('Initialization token verification failed. Session cleared.', err.message);
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    // Attach response interceptor for 401 rotations
    setupResponseInterceptor(clearAuth);

    initAuth();
  }, []);

  const updateUserProfile = (updatedData) => {
    setUser((prev) => {
      if (!prev) return null;
      const mergedPreferences = (prev.preferences || updatedData.preferences)
        ? { ...(prev.preferences || {}), ...(updatedData.preferences || {}) }
        : undefined;

      return {
        ...prev,
        ...updatedData,
        ...(mergedPreferences ? { preferences: mergedPreferences } : {}),
      };
    });
  };

  const value = {
    user,
    loading,
    error,
    loginUser,
    registerUser,
    logoutUser,
    updateUserProfile,
    isAuthenticated: !!user,
    isOwner: user?.role === 'restaurant',
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

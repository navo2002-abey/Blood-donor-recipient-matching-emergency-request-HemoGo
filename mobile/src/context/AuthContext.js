import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { fetchCurrentUser, loginUser, logoutUser, registerUser, socialLoginUser, updateProfile, updateAvailability } from '../services/authService';
import { getStoredUser, getToken, saveSession } from '../utils/storage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);

  const restoreSession = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        setUser(null);
        return false;
      }

      const currentUser = await fetchCurrentUser();
      await saveSession(token, currentUser);
      setUser(currentUser);
      return true;
    } catch (error) {
      await logoutUser();
      setUser(null);
      return false;
    } finally {
      setIsReady(true);
    }
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await loginUser(credentials);
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await registerUser(payload);
    setUser(data.user);
    return data;
  }, []);

  const socialLogin = useCallback(async (payload) => {
    const data = await socialLoginUser(payload);
    if (data.user) {
      setUser(data.user);
    }
    return data;
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
  }, []);

  const saveProfile = useCallback(async (payload) => {
    const data = await updateProfile(payload);
    const token = await getToken();
    if (token) {
      await saveSession(token, data.user);
    }
    setUser(data.user);
    return data.user;
  }, []);

  const saveAvailability = useCallback(async (payload) => {
    // Optimistic local state update
    const effectiveIsAvailable =
      payload.availabilityStatus === 'AVAILABLE' ||
      (payload.isAvailable === true && payload.availabilityStatus !== 'TEMPORARILY_UNAVAILABLE' && payload.availabilityStatus !== 'UNAVAILABLE');
    
    const updatedLocal = {
      ...(user || {}),
      availabilityStatus: payload.availabilityStatus || (effectiveIsAvailable ? 'AVAILABLE' : 'UNAVAILABLE'),
      isAvailable: effectiveIsAvailable,
      unavailableUntil: payload.availabilityStatus === 'TEMPORARILY_UNAVAILABLE' ? payload.unavailableUntil : null,
      unavailableReason: payload.unavailableReason || '',
    };

    setUser(updatedLocal);
    const token = await getToken();
    if (token) {
      await saveSession(token, updatedLocal);
    }

    try {
      const data = await updateAvailability(payload);
      if (data?.user) {
        if (token) {
          await saveSession(token, data.user);
        }
        setUser(data.user);
        return data;
      }
    } catch (error) {
      console.warn('Backend updateAvailability notice:', error.message);
    }
    return { success: true, user: updatedLocal };
  }, [user]);

  const hydrateFromStorage = useCallback(async () => {
    const storedUser = await getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isReady,
      restoreSession,
      hydrateFromStorage,
      login,
      register,
      socialLogin,
      logout,
      saveProfile,
      saveAvailability,
    }),
    [user, isReady, restoreSession, hydrateFromStorage, login, register, socialLogin, logout, saveProfile, saveAvailability]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
};

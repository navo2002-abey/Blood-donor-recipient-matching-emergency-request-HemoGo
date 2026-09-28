import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { fetchCurrentUser, loginUser, logoutUser, registerUser } from '../services/authService';
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

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
  }, []);

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
      logout,
    }),
    [user, isReady, restoreSession, hydrateFromStorage, login, register, logout]
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

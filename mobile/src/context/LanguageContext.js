import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { translate } from '../i18n/translations';

const STORAGE_KEY = 'hemogo_language';
const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState('si');

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'en' || saved === 'si') {
          setLanguageState(saved);
        }
      } catch (error) {
        // Keep English if the saved language cannot be read.
      }
    };
    load();
  }, []);

  const setLanguage = useCallback(async (next) => {
    if (next !== 'en' && next !== 'si') return;
    setLanguageState(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch (error) {
      // The choice still applies for this session.
    }
  }, []);

  const t = useCallback((key, params) => translate(language, key, params), [language]);

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const STORAGE_KEY = 'hemogo_dismissed_alerts';

const AlertsContext = createContext(null);

export const AlertsProvider = ({ children }) => {
  const [dismissedIds, setDismissedIds] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [ready, setReady] = useState(false);

  // Load dismissed IDs from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setDismissedIds(parsed);
        }
      } catch (e) {
        // ignore
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // Persist dismissed IDs whenever they change
  const persist = useCallback(async (ids) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch (e) {
      // ignore
    }
  }, []);

  const setAlertList = useCallback((list) => {
    setAlerts(Array.isArray(list) ? list : []);
  }, []);

  const dismissOne = useCallback(
    async (id) => {
      setDismissedIds((prev) => {
        if (prev.includes(id)) return prev;
        const next = [...prev, id];
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const markAllRead = useCallback(async () => {
    const ids = alerts.map((a) => a.id);
    setDismissedIds(ids);
    await persist(ids);
  }, [alerts, persist]);

  const resetAlerts = useCallback(async () => {
    setDismissedIds([]);
    await persist([]);
  }, [persist]);

  // Count of alerts not yet dismissed
  const unreadCount = useMemo(
    () => alerts.filter((a) => !dismissedIds.includes(a.id)).length,
    [alerts, dismissedIds]
  );

  // Total alerts (regardless of dismissed)
  const totalCount = alerts.length;

  const value = useMemo(
    () => ({
      ready,
      alerts,
      dismissedIds,
      unreadCount,
      totalCount,
      setAlertList,
      dismissOne,
      markAllRead,
      resetAlerts,
    }),
    [
      ready,
      alerts,
      dismissedIds,
      unreadCount,
      totalCount,
      setAlertList,
      dismissOne,
      markAllRead,
      resetAlerts,
    ]
  );

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>;
};

export const useAlerts = () => {
  const ctx = useContext(AlertsContext);
  if (!ctx) throw new Error('useAlerts must be used inside AlertsProvider');
  return ctx;
};
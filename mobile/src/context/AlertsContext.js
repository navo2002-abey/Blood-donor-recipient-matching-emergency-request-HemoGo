import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const STORAGE_KEY = 'hemogo_read_alerts';

const AlertsContext = createContext(null);

export const AlertsProvider = ({ children }) => {
  const [readIds, setReadIds] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setReadIds(parsed);
        }
      } catch (e) {
        // ignore
      } finally {
        setReady(true);
      }
    })();
  }, []);

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

  const markOneRead = useCallback(
    async (id) => {
      setReadIds((prev) => {
        if (prev.includes(id)) return prev;
        const next = [...prev, id];
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const markAllRead = useCallback(async () => {
    const currentIds = alerts.map((a) => a.id);
    const merged = Array.from(new Set([...readIds, ...currentIds]));
    setReadIds(merged);
    await persist(merged);
  }, [alerts, readIds, persist]);

  // ✅ Keep history but reset read state (user can re-see unread)
  const clearAll = useCallback(async () => {
    setReadIds([]);
    await persist([]);
  }, [persist]);

  const isRead = useCallback((id) => readIds.includes(id), [readIds]);

  const unreadCount = useMemo(
    () => alerts.filter((a) => !readIds.includes(a.id)).length,
    [alerts, readIds]
  );

  const totalCount = alerts.length;

  const value = useMemo(
    () => ({
      ready,
      alerts,
      readIds,
      unreadCount,
      totalCount,
      setAlertList,
      markOneRead,
      markAllRead,
      clearAll,
      isRead,
    }),
    [
      ready,
      alerts,
      readIds,
      unreadCount,
      totalCount,
      setAlertList,
      markOneRead,
      markAllRead,
      clearAll,
      isRead,
    ]
  );

  return (
    <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>
  );
};

export const useAlerts = () => {
  const ctx = useContext(AlertsContext);
  if (!ctx) throw new Error('useAlerts must be used inside AlertsProvider');
  return ctx;
};
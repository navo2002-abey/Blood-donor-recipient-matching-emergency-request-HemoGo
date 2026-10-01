import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import {
  predictionService,
  stockService,
  transferService,
} from '../services/officerService';

const STORAGE_KEY = 'hemogo_read_alerts';
const REFRESH_INTERVAL_MS = 30 * 1000; // auto-refresh every 30s

const AlertsContext = createContext(null);

export const AlertsProvider = ({ children }) => {
  const { user } = useAuth();
  const myHospital = user?.hospital;

  const [readIds, setReadIds] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [ready, setReady] = useState(false);

  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ---------- Load persisted read IDs ----------
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
        if (isMounted.current) setReady(true);
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

  // ---------- Build alerts from raw data (shared) ----------
  const buildAlerts = useCallback(
    ({ expiring = [], predictions = [], transfers = [], hospital }) => {
      const list = [];

      // 1. EXPIRED UNITS
      expiring
        .filter((s) => new Date(s.expiryDate) <= new Date())
        .forEach((s) => {
          list.push({
            id: `expired-${s._id}`,
            section: 'EXPIRED UNITS',
            icon: 'close-circle',
            iconColor: '#7F1D1D',
            bg: '#FEE2E2',
            title: `${s.bloodGroup} · ${s.units} unit${
              s.units > 1 ? 's' : ''
            } expired`,
            subtitle: 'Batch expired. Dispose immediately.',
            location: s.hospital,
            nav: 'ExpiryMonitoring',
            createdAt: s.expiryDate,
          });
        });

      // 2. EXPIRING SOON
      expiring
        .filter((s) => {
          const days =
            (new Date(s.expiryDate) - Date.now()) / (1000 * 60 * 60 * 24);
          return days > 0 && days <= 5;
        })
        .forEach((s) => {
          const days = Math.ceil(
            (new Date(s.expiryDate) - Date.now()) / (1000 * 60 * 60 * 24)
          );
          list.push({
            id: `expiring-${s._id}`,
            section: 'EXPIRING SOON',
            icon: 'hourglass',
            iconColor: '#EF4444',
            bg: '#FFF1F3',
            title: `${s.bloodGroup} · ${s.units} unit${
              s.units > 1 ? 's' : ''
            } expiring`,
            subtitle: `Expires in ${days} day${days === 1 ? '' : 's'}.`,
            location: s.hospital,
            nav: 'ExpiryMonitoring',
            createdAt: s.expiryDate,
          });
        });

      // 3. BLOOD BANK EXCHANGE
      transfers.forEach((t) => {
        const iAmSource = t.sourceBank === hospital;
        const iAmRequester = t.destinationHospital === hospital;

        if (iAmSource && t.status === 'PENDING') {
          list.push({
            id: `exchange-in-${t._id}`,
            section: 'EXCHANGE REQUESTS',
            icon: 'arrow-down-circle',
            iconColor: '#7C3AED',
            bg: '#F3E8FF',
            title: `New request from ${t.destinationHospital}`,
            subtitle: `${t.units} unit(s) of ${t.bloodGroup} · ${
              t.urgency || 'MEDIUM'
            } priority`,
            location: t.destinationHospital,
            nav: 'PendingTransfers',
            actionLabel: 'REVIEW',
            createdAt: t.createdAt,
          });
        } else if (iAmRequester && t.status === 'PENDING') {
          list.push({
            id: `exchange-out-${t._id}`,
            section: 'EXCHANGE REQUESTS',
            icon: 'arrow-up-circle',
            iconColor: '#2563EB',
            bg: '#DBEAFE',
            title: `Waiting for ${t.sourceBank}`,
            subtitle: `Request sent · ${t.units} unit(s) of ${t.bloodGroup} pending.`,
            location: t.sourceBank,
            nav: 'PendingTransfers',
            createdAt: t.createdAt,
          });
        } else if (iAmSource && t.status === 'APPROVED') {
          list.push({
            id: `exchange-ship-${t._id}`,
            section: 'NEEDS ACTION',
            icon: 'paper-plane-outline',
            iconColor: '#2563EB',
            bg: '#EFF6FF',
            title: `Ready to ship to ${t.destinationHospital}`,
            subtitle: `${t.units} unit(s) of ${t.bloodGroup} reserved.`,
            location: t.destinationHospital,
            nav: 'PendingTransfers',
            actionLabel: 'SHIP NOW',
            createdAt: t.approvedAt || t.updatedAt,
          });
        } else if (iAmRequester && t.status === 'DELIVERED') {
          list.push({
            id: `exchange-receive-${t._id}`,
            section: 'NEEDS ACTION',
            icon: 'checkmark-done-circle',
            iconColor: '#7C3AED',
            bg: '#F3E8FF',
            title: `Blood arrived from ${t.sourceBank}`,
            subtitle: `${t.units} unit(s) of ${t.bloodGroup} in transit.`,
            location: t.sourceBank,
            nav: 'PendingTransfers',
            actionLabel: 'CONFIRM',
            createdAt: t.deliveredAt || t.updatedAt,
          });
        } else if (iAmSource && t.status === 'DELIVERED') {
          list.push({
            id: `exchange-transit-${t._id}`,
            section: 'IN TRANSIT',
            icon: 'time-outline',
            iconColor: '#2563EB',
            bg: '#EFF6FF',
            title: `Waiting for confirmation`,
            subtitle: `${t.units} unit(s) of ${t.bloodGroup} sent to ${t.destinationHospital}.`,
            location: t.destinationHospital,
            nav: 'PendingTransfers',
            createdAt: t.deliveredAt || t.updatedAt,
          });
        }
      });

      // 4. SHORTAGE WARNINGS
      predictions
        .filter((p) => p.riskLevel === 'CRITICAL')
        .forEach((p, idx) => {
          list.push({
            id: `critical-pred-${p.bloodGroup}-${idx}`,
            section: 'SHORTAGE WARNINGS',
            icon: 'warning',
            iconColor: '#DC2626',
            bg: '#FFF1F3',
            title: `Critical ${p.bloodGroup} shortage`,
            subtitle: `${p.reason} ${p.recommendedAction}`,
            nav: 'AIPrediction',
          });
        });

      // 5. HIGH PRIORITY
      predictions
        .filter((p) => p.riskLevel === 'HIGH')
        .forEach((p, idx) => {
          list.push({
            id: `high-pred-${p.bloodGroup}-${idx}`,
            section: 'HIGH PRIORITY',
            icon: 'alert-circle',
            iconColor: '#F59E0B',
            bg: '#FFFBEB',
            title: `${p.bloodGroup} stock warning`,
            subtitle: `${p.reason} ${p.recommendedAction}`,
            nav: 'AIPrediction',
          });
        });

      return list;
    },
    []
  );

  // ---------- Load alerts globally ----------
  const loadAlerts = useCallback(
    async (opts = {}) => {
      if (!myHospital) return;
      if (opts.refresh) setRefreshing(true);
      else setLoading(true);

      try {
        const [expRes, predRes, transRes] = await Promise.allSettled([
          stockService.expiring(7),
          predictionService.list(),
          transferService.list({ hospital: myHospital }),
        ]);

        const expiring =
          expRes.status === 'fulfilled' ? expRes.value.data.stock || [] : [];
        const predictions =
          predRes.status === 'fulfilled'
            ? predRes.value.data.predictions || []
            : [];
        const transfers =
          transRes.status === 'fulfilled'
            ? transRes.value.data.transfers || []
            : [];

        const list = buildAlerts({
          expiring,
          predictions,
          transfers,
          hospital: myHospital,
        });

        if (isMounted.current) setAlerts(list);
      } catch (e) {
        console.error('AlertsContext load error:', e);
      } finally {
        if (isMounted.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [myHospital, buildAlerts]
  );

  // ---------- Auto-fetch on mount + interval ----------
  useEffect(() => {
    if (!myHospital) return;

    loadAlerts();

    const id = setInterval(() => {
      loadAlerts();
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(id);
  }, [myHospital, loadAlerts]);

  // ---------- Mark read ----------
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

  const markAllRead = useCallback(
    async (explicitIds) => {
      const currentIds =
        Array.isArray(explicitIds) && explicitIds.length > 0
          ? explicitIds
          : alerts.map((a) => a.id);

      const merged = Array.from(new Set([...readIds, ...currentIds]));
      setReadIds(merged);
      await persist(merged);
    },
    [alerts, readIds, persist]
  );

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
      loading,
      refreshing,
      alerts,
      readIds,
      unreadCount,
      totalCount,
      refresh: () => loadAlerts({ refresh: true }),
      markOneRead,
      markAllRead,
      clearAll,
      isRead,
    }),
    [
      ready,
      loading,
      refreshing,
      alerts,
      readIds,
      unreadCount,
      totalCount,
      loadAlerts,
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
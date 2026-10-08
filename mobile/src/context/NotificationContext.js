import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ROLES } from '../utils/roles';
import { useAlerts } from './AlertsContext';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const alertsCtx = useAlerts();

  const userRole = user?.role || ROLES.DONOR;
  const userKey = user?.id || user?._id || user?.email || 'default';
  const storageKey = `hemogo_notifications_v2_${userRole}_${userKey}`;

  const [roleUnreadCount, setRoleUnreadCount] = useState(0);

  const refreshUnread = useCallback(async () => {
    if (userRole === ROLES.OFFICER) {
      return;
    }
    try {
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const unread = parsed.filter((item) => !item.isRead).length;
          setRoleUnreadCount(unread);
          return;
        }
      }
      // If nothing in storage yet, count default initial unread (typically 3)
      setRoleUnreadCount(3);
    } catch (e) {
      // ignore
    }
  }, [userRole, storageKey]);

  useEffect(() => {
    refreshUnread();
  }, [refreshUnread]);

  // Combined unread count depending on role
  const unreadCount = useMemo(() => {
    if (userRole === ROLES.OFFICER) {
      return alertsCtx?.unreadCount || 0;
    }
    return roleUnreadCount;
  }, [userRole, alertsCtx?.unreadCount, roleUnreadCount]);

  const hasUnread = unreadCount > 0;

  const value = useMemo(
    () => ({
      unreadCount,
      hasUnread,
      refreshUnread,
      setRoleUnreadCount,
    }),
    [unreadCount, hasUnread, refreshUnread]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    // Fallback if rendered outside provider
    return { unreadCount: 0, hasUnread: false, refreshUnread: () => {} };
  }
  return ctx;
};

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
import EmergencyAlertModal from '../components/EmergencyAlertModal';
import { useAuth } from './AuthContext';
import { ROLES } from '../utils/roles';
import api from '../services/api';
import { navigationRef } from '../navigation/navigationRef';
import { acceptBloodRequest } from '../services/bloodRequestService';

const TARGETED_ALERTS_KEY = 'hemogo_targeted_emergency_alerts_v2';
const DISMISSED_ALERTS_KEY = 'hemogo_dismissed_alert_ids_v2';

const EmergencyAlertContext = createContext(null);

export const EmergencyAlertProvider = ({ children }) => {
  const { user } = useAuth();
  const [alertData, setAlertData] = useState(null);
  const [visible, setVisible] = useState(false);

  // In-memory set of dismissed/handled alert IDs in this session
  const dismissedIdsRef = useRef(new Set());
  const isDismissingRef = useRef(false);

  const currentUserEmail = (user?.email || '').toLowerCase().trim();
  const currentUserId = user?.id || user?._id ? String(user?.id || user?._id) : null;
  const currentUserPhone = (user?.phone || '').replace(/\s+/g, '');
  const currentUserName = (user?.name || '').toLowerCase().trim();
  const userKey = currentUserEmail || currentUserId || 'default';

  // Load dismissed alert IDs from local storage on mount / user change
  useEffect(() => {
    const loadDismissed = async () => {
      try {
        const raw = await AsyncStorage.getItem(`${DISMISSED_ALERTS_KEY}_${userKey}`);
        if (raw) {
          const ids = JSON.parse(raw);
          if (Array.isArray(ids)) {
            ids.forEach((id) => dismissedIdsRef.current.add(String(id)));
          }
        }
      } catch (e) {}
    };
    loadDismissed();
  }, [userKey]);

  // Helper to add inbox item to target donor's Notification Hub
  const addInboxEmergencyNotification = async (targetEmail, alertItem) => {
    if (!targetEmail) return;
    try {
      const cleanEmail = targetEmail.toLowerCase().trim();
      const storageKey = `hemogo_notifications_v2_DONOR_${cleanEmail}`;
      const stored = await AsyncStorage.getItem(storageKey);
      const list = stored ? JSON.parse(stored) : [];

      const newNotif = {
        id: `notif-${alertItem._id || alertItem.id || Date.now()}`,
        type: 'EMERGENCY',
        title: 'EMERGENCY BLOOD REQUEST!',
        time: 'Just now',
        timestamp: Date.now(),
        message: `Urgent ${alertItem.bloodGroup} blood needed at ${alertItem.hospital}. Patient: ${alertItem.patientName}.`,
        screen: 'ActiveRequestProgress',
        requestId: alertItem.requestId,
        requestData: alertItem.requestData,
        params: {
          requestId: alertItem.requestId,
          requestData: alertItem.requestData,
        },
        isRead: false,
      };

      const updated = [newNotif, ...list.filter((n) => n.id !== newNotif.id)];
      await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to add inbox emergency notification:', e);
    }
  };

  // Check if an alert targets the given user
  const isAlertForUser = useCallback(
    (alert, userObj) => {
      if (!alert || !userObj) return false;
      const id1 = alert._id ? String(alert._id) : '';
      const id2 = alert.id ? String(alert.id) : '';
      const reqId = alert.requestId ? String(alert.requestId) : '';
      const patKey = alert.patientName ? `patient_${String(alert.patientName).toLowerCase()}` : '';

      // Check if user already dismissed or accepted this alert
      if (
        (id1 && dismissedIdsRef.current.has(id1)) ||
        (id2 && dismissedIdsRef.current.has(id2)) ||
        (reqId && dismissedIdsRef.current.has(reqId)) ||
        (patKey && dismissedIdsRef.current.has(patKey))
      ) {
        return false;
      }

      const uEmail = (userObj.email || '').toLowerCase().trim();
      const uId = String(userObj.id || userObj._id || '');
      const uPhone = (userObj.phone || '').replace(/\s+/g, '');
      const uName = (userObj.name || '').toLowerCase().trim();

      // Never show the alert to the sender who created/dispatched it
      if (alert.senderEmail && alert.senderEmail.toLowerCase().trim() === uEmail) {
        return false;
      }
      if (alert.senderId && String(alert.senderId) === uId) {
        return false;
      }

      if (Array.isArray(alert.dismissedBy)) {
        if (
          (uEmail && alert.dismissedBy.includes(uEmail)) ||
          (uId && alert.dismissedBy.includes(uId))
        ) {
          if (id1) dismissedIdsRef.current.add(id1);
          if (id2) dismissedIdsRef.current.add(id2);
          return false;
        }
      }

      // 1. Direct email match
      if (alert.targetEmail && alert.targetEmail.toLowerCase().trim() === uEmail) {
        return true;
      }

      // 2. Direct ID match
      if (alert.targetUserId && String(alert.targetUserId) === uId) {
        return true;
      }

      // 3. Direct phone match
      if (alert.targetPhone && alert.targetPhone.replace(/\s+/g, '') === uPhone) {
        return true;
      }

      // 4. Name match
      if (
        alert.targetName &&
        uName &&
        alert.targetName.toLowerCase().trim() === uName
      ) {
        return true;
      }

      // 5. Target donors list match
      if (
        Array.isArray(alert.targetDonors) &&
        alert.targetDonors.some(
          (d) =>
            (d.email && d.email.toLowerCase().trim() === uEmail) ||
            (d.id && String(d.id) === uId) ||
            (d.name && d.name.toLowerCase().trim() === uName)
        )
      ) {
        return true;
      }

      // 6. Broadcast to all donors
      if (alert.targetAll && userObj.role === ROLES.DONOR) {
        return true;
      }

      return false;
    },
    []
  );

  // Check pending alerts from Backend API + Local Storage
  const checkPendingAlertsForCurrentUser = useCallback(async () => {
    if (!user || isDismissingRef.current) {
      return;
    }

    const uEmail = (user.email || '').toLowerCase().trim();
    const uId = user.id || user._id ? String(user.id || user._id) : null;
    const uPhone = (user.phone || '').replace(/\s+/g, '');

    let candidateAlerts = [];

    // 1. Fetch from Backend API
    try {
      const res = await api.get('/emergency-alerts/pending', {
        params: {
          email: uEmail,
          userId: uId,
          phone: uPhone,
        },
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        candidateAlerts.push(...res.data.data);
      }
    } catch (err) {}

    // 2. Read from Local AsyncStorage
    try {
      const raw = await AsyncStorage.getItem(TARGETED_ALERTS_KEY);
      if (raw) {
        const localList = JSON.parse(raw);
        if (Array.isArray(localList)) {
          candidateAlerts.push(...localList);
        }
      }
    } catch (err) {}

    if (candidateAlerts.length === 0) {
      if (visible && !alertData) {
        setVisible(false);
      }
      return;
    }

    // Filter for valid active pending alerts for current user that are not dismissed
    const matchingAlert = candidateAlerts
      .filter((a) => a.status === 'PENDING')
      .reverse()
      .find((a) => isAlertForUser(a, user));

    if (matchingAlert) {
      const matchingId = String(matchingAlert._id || matchingAlert.id);
      if (!dismissedIdsRef.current.has(matchingId)) {
        setAlertData(matchingAlert);
        setVisible(true);
      }
    } else {
      // No un-dismissed alert found
      if (visible) {
        setVisible(false);
      }
    }
  }, [user, isAlertForUser, visible, alertData]);

  // Periodic check
  useEffect(() => {
    checkPendingAlertsForCurrentUser();
    const interval = setInterval(() => {
      checkPendingAlertsForCurrentUser();
    }, 2500);

    return () => clearInterval(interval);
  }, [checkPendingAlertsForCurrentUser]);

  // Trigger emergency dispatch (by Requester / Donor)
  const triggerEmergencyAlert = useCallback(
    async (data) => {
      const alertItem = {
        id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        targetEmail: (data?.targetEmail || '').toLowerCase().trim(),
        targetPhone: data?.targetPhone || '',
        targetUserId: data?.targetUserId ? String(data.targetUserId) : null,
        targetName: data?.targetName || 'Donor',
        targetAll: Boolean(data?.targetAll),
        targetDonors: Array.isArray(data?.targetDonors) ? data.targetDonors : [],
        senderEmail: (data?.senderEmail || currentUserEmail || '').toLowerCase().trim(),
        senderName: data?.senderName || user?.name || 'Requester',
        senderId: data?.senderId || currentUserId,
        bloodGroup: data?.bloodGroup || 'O+',
        hospital: data?.hospital || 'National Hospital Colombo',
        patientName: data?.patientName || 'Kamal P.',
        phone: data?.phone || '071-2345678',
        requestId: data?.requestId || data?._id || 'REQ-2026-001',
        requestData: data?.requestData || data || {},
        location: data?.location || { latitude: 6.9271, longitude: 79.8612 },
        timestamp: Date.now(),
        status: 'PENDING',
        dismissedBy: [],
      };

      try {
        // 1. Dispatch to Backend API
        try {
          await api.post('/emergency-alerts/dispatch', alertItem);
        } catch (apiErr) {}

        // 2. Save to Local Storage
        const raw = await AsyncStorage.getItem(TARGETED_ALERTS_KEY);
        const list = raw ? JSON.parse(raw) : [];
        const updatedList = [...list.slice(-30), alertItem];
        await AsyncStorage.setItem(TARGETED_ALERTS_KEY, JSON.stringify(updatedList));

        // 3. Add to inbox for targeted donor(s)
        if (alertItem.targetEmail) {
          await addInboxEmergencyNotification(alertItem.targetEmail, alertItem);
        }
        if (Array.isArray(alertItem.targetDonors)) {
          for (const d of alertItem.targetDonors) {
            if (d.email) {
              await addInboxEmergencyNotification(d.email, alertItem);
            }
          }
        }

        // 4. Popup logic for current user
        if (user && isAlertForUser(alertItem, user)) {
          setAlertData(alertItem);
          setVisible(true);
        } else {
          setVisible(false);
        }
      } catch (e) {
        console.error('Failed to store targeted alert:', e);
      }
    },
    [currentUserEmail, currentUserId, user, isAlertForUser]
  );

  // Helper to persist dismissed ID
  const markAlertDismissedLocally = async (alertObjOrId) => {
    if (!alertObjOrId) return;
    if (typeof alertObjOrId === 'object') {
      if (alertObjOrId._id) dismissedIdsRef.current.add(String(alertObjOrId._id));
      if (alertObjOrId.id) dismissedIdsRef.current.add(String(alertObjOrId.id));
      if (alertObjOrId.requestId) dismissedIdsRef.current.add(String(alertObjOrId.requestId));
      if (alertObjOrId.patientName) {
        dismissedIdsRef.current.add(`patient_${String(alertObjOrId.patientName).toLowerCase()}`);
      }
    } else {
      dismissedIdsRef.current.add(String(alertObjOrId));
    }
    try {
      const arr = Array.from(dismissedIdsRef.current);
      await AsyncStorage.setItem(`${DISMISSED_ALERTS_KEY}_${userKey}`, JSON.stringify(arr));
    } catch (e) {}
  };

  // Dismiss popup (Decline / Close)
  const dismissAlert = useCallback(async () => {
    isDismissingRef.current = true;
    setVisible(false);
    const currentAlert = alertData;
    setAlertData(null);

    if (!currentAlert) {
      setTimeout(() => {
        isDismissingRef.current = false;
      }, 500);
      return;
    }

    await markAlertDismissedLocally(currentAlert);

    const alertId = currentAlert._id || currentAlert.id || currentAlert.requestId;
    const uEmail = currentUserEmail;

    // 1. Call Backend API
    try {
      if (alertId) {
        await api.post(`/emergency-alerts/${alertId}/dismiss`, { email: uEmail });
      }
    } catch (e) {}

    // 2. Update Local Storage
    try {
      const raw = await AsyncStorage.getItem(TARGETED_ALERTS_KEY);
      if (raw) {
        const list = JSON.parse(raw);
        const updated = list.map((a) => {
          if (
            a.id === alertId ||
            a._id === alertId ||
            a.requestId === alertId ||
            a.patientName === currentAlert.patientName
          ) {
            const dismissedBy = Array.isArray(a.dismissedBy) ? [...a.dismissedBy] : [];
            if (!dismissedBy.includes(uEmail)) dismissedBy.push(uEmail);
            return { ...a, dismissedBy };
          }
          return a;
        });
        await AsyncStorage.setItem(TARGETED_ALERTS_KEY, JSON.stringify(updated));
      }
    } catch (e) {}

    setTimeout(() => {
      isDismissingRef.current = false;
    }, 500);
  }, [alertData, currentUserEmail, userKey]);

  // Accept popup ("Accept & Go")
  const handleAccept = useCallback(async () => {
    isDismissingRef.current = true;
    setVisible(false);
    const current = alertData;
    setAlertData(null);

    if (!current) {
      setTimeout(() => {
        isDismissingRef.current = false;
      }, 500);
      return;
    }

    const alertId = current._id || current.id;
    await markAlertDismissedLocally(alertId);

    const uEmail = currentUserEmail || user?.email || '';
    const reqId = current.requestId || current._id || 'REQ-2026-001';
    const cleanId = String(reqId).replace(/^#/, '');

    // 1. Call Backend API & mark request accepted
    try {
      if (current._id) {
        await api.post(`/emergency-alerts/${current._id}/accept`, { email: uEmail });
      }
      await acceptBloodRequest(
        cleanId,
        {
          donorEmail: uEmail,
          donorName: currentUserName || user?.name || 'Donor',
          phone: currentUserPhone,
        },
        uEmail
      );
    } catch (e) {
      console.warn('Accept alert API error:', e);
    }

    // 2. Update Local Storage
    try {
      const raw = await AsyncStorage.getItem(TARGETED_ALERTS_KEY);
      if (raw) {
        const list = JSON.parse(raw);
        const updated = list.map((a) => {
          if (a.id === alertId || a._id === alertId) {
            const dismissedBy = Array.isArray(a.dismissedBy) ? [...a.dismissedBy] : [];
            if (!dismissedBy.includes(uEmail)) dismissedBy.push(uEmail);
            return { ...a, status: 'ACCEPTED', dismissedBy };
          }
          return a;
        });
        await AsyncStorage.setItem(TARGETED_ALERTS_KEY, JSON.stringify(updated));
      }
    } catch (e) {}

    setTimeout(() => {
      isDismissingRef.current = false;
    }, 500);

    const targetRequestData = {
      ...(current.requestData || {}),
      _id: cleanId,
      hospital: current.hospital,
      bloodGroup: current.bloodGroup,
      patientName: current.patientName,
      status: 'ACCEPTED',
      acceptedAt: new Date().toISOString(),
      acceptedBy: {
        _id: currentUserId,
        id: currentUserId,
        name: currentUserName || user?.name || 'Donor',
        email: uEmail,
        phone: currentUserPhone,
      },
    };

    // 3. Navigate reliably to ActiveRequestProgress
    try {
      if (navigationRef.isReady()) {
        navigationRef.navigate('ActiveRequestProgress', {
          requestData: targetRequestData,
          requestId: cleanId,
          isAcceptedDonor: true,
        });
      }
    } catch (err) {
      console.warn('Navigation error on alert accept:', err);
    }
  }, [alertData, currentUserEmail, currentUserId, currentUserName, currentUserPhone, user]);

  const value = useMemo(
    () => ({
      triggerEmergencyAlert,
      dismissAlert,
      setNavigationRef: () => {},
      checkPendingAlertsForCurrentUser,
    }),
    [triggerEmergencyAlert, dismissAlert, checkPendingAlertsForCurrentUser]
  );

  return (
    <EmergencyAlertContext.Provider value={value}>
      {children}
      <EmergencyAlertModal
        visible={visible}
        data={alertData}
        onClose={dismissAlert}
        onAccept={handleAccept}
      />
    </EmergencyAlertContext.Provider>
  );
};

export const useEmergencyAlert = () => {
  const context = useContext(EmergencyAlertContext);
  if (!context) {
    throw new Error('useEmergencyAlert must be used within an EmergencyAlertProvider');
  }
  return context;
};

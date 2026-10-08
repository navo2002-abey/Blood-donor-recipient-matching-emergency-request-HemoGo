import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BloodDrop } from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchBloodRequests } from '../services/bloodRequestService';
import { fetchAdminBloodRequests } from '../services/adminService';
import { ROLES } from '../utils/roles';

const NOTIFICATION_THEMES = {
  EMERGENCY: {
    bg: '#FEE2E2',
    border: '#FCA5A5',
    titleColor: '#DC2626',
    icon: 'warning',
    accentDot: '#DC2626',
  },
  APPOINTMENT: {
    bg: '#FEF3C7',
    border: '#FDE68A',
    titleColor: '#D97706',
    icon: 'calendar',
    accentDot: '#D97706',
  },
  REQUEST_UPDATE: {
    bg: '#DCFCE7',
    border: '#86EFAC',
    titleColor: '#16A34A',
    icon: 'refresh-circle',
    accentDot: '#16A34A',
  },
  MESSAGE: {
    bg: '#DBEAFE',
    border: '#93C5FD',
    titleColor: '#2563EB',
    icon: 'chatbubble-ellipses',
    accentDot: '#2563EB',
  },
  THANK_YOU: {
    bg: '#F1F5F9',
    border: '#CBD5E1',
    titleColor: '#1E293B',
    icon: 'heart',
    accentDot: '#64748B',
  },
};

// 1. Seed Notifications for DONOR
const DONOR_DEFAULT_NOTIFICATIONS = [
  {
    id: 'donor-notif-1',
    type: 'EMERGENCY',
    title: 'EMERGENCY ALERT!',
    time: '10:24 AM',
    timestamp: Date.now() - 1000 * 60 * 35,
    message: 'Amal Perera Donated blood for A+ Accepted by Sumudu Hospital.',
    screen: 'ActiveRequestCompleted',
    params: {
      requestData: {
        _id: 'REQ-2026-001',
        patientName: 'Amal Perera',
        hospital: 'Sumudu Hospital',
        bloodGroup: 'A+',
        units: 1,
        fulfilledUnits: 1,
        status: 'VERIFIED',
        urgency: 'Critical',
        verifiedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        acceptedAt: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
      },
    },
    isRead: false,
  },
  {
    id: 'donor-notif-2',
    type: 'APPOINTMENT',
    title: 'Appointment Reminder',
    time: 'Yesterday',
    timestamp: Date.now() - 1000 * 60 * 60 * 24,
    message: 'Your donation is scheduled for\n16 Sep 2026, 10:00 AM',
    screen: 'AppointmentBooked',
    isRead: false,
  },
  {
    id: 'donor-notif-3',
    type: 'REQUEST_UPDATE',
    title: 'Request Update',
    time: 'Yesterday',
    timestamp: Date.now() - 1000 * 60 * 60 * 28,
    message: 'Request #REQ-2026-001 is now being processed.',
    screen: 'BloodRequestList',
    isRead: false,
  },
  {
    id: 'donor-notif-4',
    type: 'MESSAGE',
    title: 'New Message',
    time: 'Yesterday',
    timestamp: Date.now() - 1000 * 60 * 60 * 32,
    message: 'Blood Bank: We have received your request and are looking for donors.',
    screen: 'HelpSupport',
    isRead: true,
  },
  {
    id: 'donor-notif-5',
    type: 'THANK_YOU',
    title: 'Thank You!',
    time: '3 days ago',
    timestamp: Date.now() - 1000 * 60 * 60 * 72,
    message: 'Your donation last month helped save 3 lives!',
    screen: 'RewardsGift',
    isRead: true,
  },
];

// 2. Seed Notifications for PATIENT / FAMILY
const PATIENT_DEFAULT_NOTIFICATIONS = [
  {
    id: 'patient-notif-0',
    type: 'EMERGENCY',
    title: 'DONATION VERIFIED & FULFILLED!',
    time: '10:24 AM',
    timestamp: Date.now() - 1000 * 60 * 15,
    message: 'Amal Perera Donated blood for A+ Accepted & Verified by Sumudu Hospital.',
    screen: 'RequesterDonationConfirmed',
    params: {
      requestData: {
        _id: 'REQ-2026-001',
        patientName: 'Amal Perera',
        hospital: 'Sumudu Hospital',
        bloodGroup: 'A+',
        units: 1,
        fulfilledUnits: 1,
        status: 'VERIFIED',
        urgency: 'Critical',
        verifierId: '#SH01078',
        verifiedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        donorName: 'Amal Perera',
      },
      donorName: 'Amal Perera',
    },
    isRead: false,
  },
  {
    id: 'patient-notif-1',
    type: 'EMERGENCY',
    title: 'EMERGENCY BROADCAST ACTIVE',
    time: '11:10 AM',
    timestamp: Date.now() - 1000 * 60 * 25,
    message: 'Your emergency blood request has been broadcasted to 12 nearby donors in Colombo.',
    screen: 'TrackingRequest',
    isRead: false,
  },
  {
    id: 'patient-notif-2',
    type: 'REQUEST_UPDATE',
    title: 'Donor Matched & En Route',
    time: 'Yesterday',
    timestamp: Date.now() - 1000 * 60 * 60 * 20,
    message: 'Amal Perera accepted your A+ request for Sumudu Hospital and is traveling now.',
    screen: 'TrackingRequest',
    isRead: false,
  },
  {
    id: 'patient-notif-3',
    type: 'MESSAGE',
    title: 'Hospital Blood Bank Update',
    time: 'Yesterday',
    timestamp: Date.now() - 1000 * 60 * 60 * 26,
    message: 'Sumudu Hospital Blood Bank: Verification team is ready for donor arrival.',
    screen: 'HelpSupport',
    isRead: true,
  },
  {
    id: 'patient-notif-4',
    type: 'THANK_YOU',
    title: 'Request Fulfilled',
    time: '4 days ago',
    timestamp: Date.now() - 1000 * 60 * 60 * 96,
    message: 'Your request #REQ-2026-004 was successfully completed. Thank you for using HemoGo!',
    screen: 'MyRequests',
    isRead: true,
  },
];

// 3. Seed Notifications for SYSTEM ADMIN
const ADMIN_DEFAULT_NOTIFICATIONS = [
  {
    id: 'admin-notif-1',
    type: 'EMERGENCY',
    title: 'CRITICAL ALERT!',
    time: '09:45 AM',
    timestamp: Date.now() - 1000 * 60 * 50,
    message: 'Critical blood shortage: 3 urgent O- requests currently pending unassigned donors.',
    screen: 'AdminBloodRequests',
    isRead: false,
  },
  {
    id: 'admin-notif-2',
    type: 'REQUEST_UPDATE',
    title: 'Donor Assigned by Officer',
    time: 'Yesterday',
    timestamp: Date.now() - 1000 * 60 * 60 * 18,
    message: 'Sumudu Hospital assigned donor Nimal Silva to request #REQ-2026-002.',
    screen: 'AdminBloodRequests',
    isRead: false,
  },
  {
    id: 'admin-notif-3',
    type: 'MESSAGE',
    title: 'New Officer Registration',
    time: 'Yesterday',
    timestamp: Date.now() - 1000 * 60 * 60 * 30,
    message: 'Dr. Kasun Wickrama registered as Blood Bank Officer at Asiri Hospital.',
    screen: 'AdminUsers',
    isRead: true,
  },
  {
    id: 'admin-notif-4',
    type: 'THANK_YOU',
    title: 'Weekly Report Ready',
    time: '2 days ago',
    timestamp: Date.now() - 1000 * 60 * 60 * 48,
    message: 'National Blood Supply Analytics & Transfusion Summary is compiled and available.',
    screen: 'AdminReports',
    isRead: true,
  },
];

const NotificationHubScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const { user } = useAuth();

  const userRole = user?.role || ROLES.DONOR;
  const userKey = user?.id || user?._id || user?.email || 'default';
  const storageKey = `hemogo_notifications_v2_${userRole}_${userKey}`;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterTab, setFilterTab] = useState('ALL');

  // Role default seeds
  const defaultSeeds = useMemo(() => {
    if (userRole === ROLES.ADMIN) return ADMIN_DEFAULT_NOTIFICATIONS;
    if (userRole === ROLES.PATIENT_FAMILY) return PATIENT_DEFAULT_NOTIFICATIONS;
    return DONOR_DEFAULT_NOTIFICATIONS;
  }, [userRole]);

  // Persist notifications to role-scoped storage
  const persistNotifications = async (items) => {
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save notifications:', e);
    }
  };

  // Load role-specific notifications and integrate live backend data
  const loadNotifications = useCallback(async (isPullRefresh = false) => {
    if (isPullRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const stored = await AsyncStorage.getItem(storageKey);
      let list = stored ? JSON.parse(stored) : [];

      if (!Array.isArray(list) || list.length === 0) {
        list = defaultSeeds;
        await persistNotifications(list);
      }

      // Dynamic role-based live updates
      if (userRole === ROLES.ADMIN) {
        try {
          const res = await fetchAdminBloodRequests({ limit: 4 });
          if (res?.data && Array.isArray(res.data)) {
            const liveAdminAlerts = res.data
              .filter((r) => r.urgency === 'Critical' || r.status === 'OPEN')
              .map((reqItem) => ({
                id: `admin-live-${reqItem._id}`,
                type: reqItem.urgency === 'Critical' ? 'EMERGENCY' : 'REQUEST_UPDATE',
                title: reqItem.urgency === 'Critical' ? 'URGENT ADMIN ATTENTION!' : 'Open Blood Request',
                time: 'Live',
                timestamp: new Date(reqItem.createdAt || Date.now()).getTime(),
                message: `${reqItem.bloodGroup} needed at ${reqItem.hospital} (${reqItem.units} units). Urgency: ${reqItem.urgency}.`,
                screen: 'AdminBloodRequests',
                isRead: false,
              }));

            const existingIds = new Set(list.map((n) => n.id));
            const freshItems = liveAdminAlerts.filter((a) => !existingIds.has(a.id));
            if (freshItems.length > 0) {
              list = [...freshItems, ...list];
              await persistNotifications(list);
            }
          }
        } catch (e) {}
      } else if (userRole === ROLES.PATIENT_FAMILY) {
        try {
          const res = await fetchBloodRequests({ limit: 4 });
          if (res?.data && Array.isArray(res.data)) {
            const livePatientAlerts = res.data.slice(0, 2).map((reqItem) => ({
              id: `patient-live-${reqItem._id}`,
              type: reqItem.status === 'IN_PROGRESS' ? 'REQUEST_UPDATE' : 'EMERGENCY',
              title: reqItem.status === 'IN_PROGRESS' ? 'Donor Assigned' : 'Emergency Request Active',
              time: 'Live',
              timestamp: new Date(reqItem.createdAt || Date.now()).getTime(),
              message: `Request for ${reqItem.patientName} at ${reqItem.hospital} (${reqItem.bloodGroup}, ${reqItem.units} units) is ${reqItem.status}.`,
              screen: 'TrackingRequest',
              params: { requestId: reqItem._id, requestData: reqItem },
              isRead: false,
            }));

            const existingIds = new Set(list.map((n) => n.id));
            const freshItems = livePatientAlerts.filter((a) => !existingIds.has(a.id));
            if (freshItems.length > 0) {
              list = [...freshItems, ...list];
              await persistNotifications(list);
            }
          }
        } catch (e) {}
      } else {
        // DONOR
        try {
          const res = await fetchBloodRequests({ limit: 3 });
          if (res?.data && Array.isArray(res.data)) {
            const liveDonorAlerts = res.data
              .filter((r) => r.status === 'OPEN')
              .map((reqItem) => ({
                id: `donor-live-${reqItem._id}`,
                type: reqItem.urgency === 'Critical' ? 'EMERGENCY' : 'REQUEST_UPDATE',
                title: reqItem.urgency === 'Critical' ? 'EMERGENCY BLOOD NEEDED!' : 'Blood Donation Request',
                time: 'Live',
                timestamp: new Date(reqItem.createdAt || Date.now()).getTime(),
                message: `${reqItem.bloodGroup} Blood Needed at ${reqItem.hospital} (${reqItem.units} units required).`,
                screen: 'ActiveRequestProgress',
                params: { requestId: reqItem._id, requestData: reqItem },
                isRead: false,
              }));

            const existingIds = new Set(list.map((n) => n.id));
            const freshItems = liveDonorAlerts.filter((a) => !existingIds.has(a.id));
            if (freshItems.length > 0) {
              list = [...freshItems, ...list];
              await persistNotifications(list);
            }
          }
        } catch (e) {}
      }

      setNotifications(list);
    } catch (error) {
      console.error('Error loading role notifications:', error);
      setNotifications(defaultSeeds);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userRole, storageKey, defaultSeeds]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const handleRefresh = () => {
    loadNotifications(true);
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    const updated = notifications.map((item) => ({ ...item, isRead: true }));
    setNotifications(updated);
    await persistNotifications(updated);
  };

  // Handle tap on single notification item
  const handleItemPress = async (item) => {
    if (!item.isRead) {
      const updated = notifications.map((n) => (n.id === item.id ? { ...n, isRead: true } : n));
      setNotifications(updated);
      await persistNotifications(updated);
    }

    let targetScreen = item.screen;
    let targetParams = item.params || {};

    // Smart routing overrides based on notification content:
    const msg = (item.message || '').toLowerCase();
    const title = (item.title || '').toLowerCase();

    if (
      title.includes('emergency blood needed') ||
      title.includes('emergency blood request') ||
      msg.includes('blood needed at')
    ) {
      targetScreen = 'ActiveRequestProgress';
      if (!targetParams.requestData) {
        targetParams.requestData = item.requestData || {
          patientName: 'Emergency Patient',
          hospital: 'Teaching Hospital Kandy',
          bloodGroup: 'A-',
          units: 1,
          requiredDateTime: 'Immediate / ASAP',
          urgency: 'Critical',
          status: 'OPEN',
        };
      }
      if (!targetParams.requestId) {
        targetParams.requestId = item.requestId || targetParams.requestData?._id || 'REQ-2026-003';
      }
    } else if (
      msg.includes('donated blood for') ||
      msg.includes('accepted by sumudu hospital') ||
      title.includes('donation verified') ||
      title.includes('request fulfilled')
    ) {
      targetScreen =
        userRole === ROLES.PATIENT_FAMILY || item.screen === 'RequesterDonationConfirmed'
          ? 'RequesterDonationConfirmed'
          : 'ActiveRequestCompleted';
      if (!targetParams.requestData) {
        targetParams.requestData = {
          patientName: 'Amal Perera',
          hospital: 'Sumudu Hospital',
          bloodGroup: 'A+',
          units: 1,
          fulfilledUnits: 1,
          status: 'VERIFIED',
          urgency: 'Critical',
          verifierId: '#SH01078',
          verifiedAt: new Date().toISOString(),
          acceptedAt: new Date(Date.now() - 3600000).toISOString(),
          donorName: 'Amal Perera',
        };
      }
      if (!targetParams.donorName) {
        targetParams.donorName = 'Amal Perera';
      }
    }

    if (targetScreen) {
      try {
        navigation.navigate(targetScreen, targetParams);
      } catch (err) {
        console.warn('Navigation error:', err);
      }
    }
  };

  // Remove notification item
  const handleDeleteItem = (id) => {
    Alert.alert('Remove Notification', 'Are you sure you want to delete this notification?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = notifications.filter((n) => n.id !== id);
          setNotifications(updated);
          await persistNotifications(updated);
        },
      },
    ]);
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const filteredList = useMemo(() => {
    if (filterTab === 'UNREAD') {
      return notifications.filter((n) => !n.isRead);
    }
    if (filterTab === 'EMERGENCY') {
      return notifications.filter((n) => n.type === 'EMERGENCY');
    }
    if (filterTab === 'UPDATES') {
      return notifications.filter((n) => n.type === 'REQUEST_UPDATE' || n.type === 'APPOINTMENT');
    }
    return notifications;
  }, [notifications, filterTab]);

  const renderNotificationCard = ({ item }) => {
    const theme = NOTIFICATION_THEMES[item.type] || NOTIFICATION_THEMES.MESSAGE;

    return (
      <TouchableOpacity
        activeOpacity={0.82}
        style={[
          styles.card,
          {
            backgroundColor: isDark ? colors.cardBg : theme.bg,
            borderColor: isDark ? colors.border : theme.border,
          },
          !item.isRead && styles.unreadCardBorder,
        ]}
        onPress={() => handleItemPress(item)}
        onLongPress={() => handleDeleteItem(item.id)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleWrap}>
            {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: theme.accentDot }]} />}
            <Text style={[styles.cardTitle, { color: isDark ? colors.text : theme.titleColor }]}>
              {item.title}
            </Text>
          </View>
          <Text style={styles.cardTime}>{item.time}</Text>
        </View>

        <View style={styles.cardBodyRow}>
          <Text style={styles.cardMessage} numberOfLines={3}>
            {item.message}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={isDark ? colors.textMuted : '#9CA3AF'}
            style={styles.chevronIcon}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Top App Header with Back and Centered Logo */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={styles.backBtn}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.brandCenter}>
          <BloodDrop size={16} />
          <Text style={styles.brandTitle}>HemoGo</Text>
        </View>

        <View style={styles.headerRightSpacer} />
      </View>

      {/* Main Heading & Mark All As Read */}
      <View style={styles.titleBar}>
        <View style={styles.titleTextRow}>
          <Text style={styles.headingTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={handleMarkAllAsRead}
          style={styles.markAllBtn}
          disabled={unreadCount === 0}
          activeOpacity={0.7}
        >
          <Ionicons
            name="checkmark"
            size={15}
            color={unreadCount > 0 ? colors.textSecondary : colors.textMuted}
          />
          <Text
            style={[
              styles.markAllText,
              { color: unreadCount > 0 ? colors.textSecondary : colors.textMuted },
            ]}
          >
            Mark all as read
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabFilterRow}>
        <TouchableOpacity
          style={[styles.tabChip, filterTab === 'ALL' && styles.tabChipActive]}
          onPress={() => setFilterTab('ALL')}
        >
          <Text style={[styles.tabChipText, filterTab === 'ALL' && styles.tabChipTextActive]}>
            All ({notifications.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabChip, filterTab === 'UNREAD' && styles.tabChipActive]}
          onPress={() => setFilterTab('UNREAD')}
        >
          <Text style={[styles.tabChipText, filterTab === 'UNREAD' && styles.tabChipTextActive]}>
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabChip, filterTab === 'EMERGENCY' && styles.tabChipActive]}
          onPress={() => setFilterTab('EMERGENCY')}
        >
          <Text style={[styles.tabChipText, filterTab === 'EMERGENCY' && styles.tabChipTextActive]}>
            Emergency
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabChip, filterTab === 'UPDATES' && styles.tabChipActive]}
          onPress={() => setFilterTab('UPDATES')}
        >
          <Text style={[styles.tabChipText, filterTab === 'UPDATES' && styles.tabChipTextActive]}>
            Updates
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderNotificationCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="notifications-off-outline" size={38} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptySubtitle}>
                {filterTab === 'UNREAD'
                  ? "You're all caught up! No unread messages."
                  : 'You have no alerts at this time.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const makeStyles = (colors, isDark) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.page,
    },
    topHeader: {
      height: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      backgroundColor: colors.cardBg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    backBtn: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 19,
    },
    brandCenter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    brandTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: -0.3,
    },
    headerRightSpacer: {
      width: 38,
    },
    titleBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 10,
    },
    titleTextRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    headingTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.4,
    },
    unreadBadge: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    unreadBadgeText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '800',
    },
    markAllBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 12,
    },
    markAllText: {
      fontSize: 12.5,
      fontWeight: '700',
    },
    tabFilterRow: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingBottom: 12,
      gap: 8,
    },
    tabChip: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 14,
      backgroundColor: isDark ? colors.cardBg : '#F1F5F9',
      borderWidth: 1,
      borderColor: colors.border,
    },
    tabChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    tabChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    tabChipTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    listContent: {
      paddingHorizontal: 20,
      paddingTop: 4,
      paddingBottom: 32,
    },
    card: {
      borderRadius: 20,
      borderWidth: 1.5,
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
    },
    unreadCardBorder: {
      shadowOpacity: 0.08,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    titleWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flex: 1,
      marginRight: 8,
    },
    unreadDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    cardTime: {
      fontSize: 11.5,
      fontWeight: '500',
      color: '#64748B',
    },
    cardBodyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cardMessage: {
      fontSize: 13,
      fontWeight: '500',
      color: '#475569',
      lineHeight: 18,
      flex: 1,
      paddingRight: 10,
    },
    chevronIcon: {
      marginTop: 2,
    },
    loadingWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    loadingText: {
      marginTop: 10,
      fontSize: 13,
      color: colors.textSecondary,
    },
    emptyWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 80,
    },
    emptyIconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.inputBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 4,
    },
    emptySubtitle: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      paddingHorizontal: 36,
    },
  });

export default NotificationHubScreen;

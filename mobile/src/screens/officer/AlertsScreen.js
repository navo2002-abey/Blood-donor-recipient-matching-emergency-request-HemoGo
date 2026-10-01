import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../../components/AppHeader';
import Sidebar from '../../components/Sidebar';
import { useAlerts } from '../../context/AlertsContext';
import { useMyHospital } from '../../hooks/useMyHospital';
import {
  predictionService,
  stockService,
  transferService,
} from '../../services/officerService';
import { colors } from '../../utils/colors';
import { OFFICER_MENU } from '../../utils/roles';

const comingSoon = (label) =>
  Alert.alert('Coming Soon', `${label} will be available soon.`);

const timeAgo = (date) => {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const AlertCard = ({
  icon,
  iconColor,
  bg,
  title,
  subtitle,
  location,
  time,
  isRead,
  actionLabel,
  onPress,
}) => (
  <TouchableOpacity
    style={[
      styles.alertCard,
      { backgroundColor: bg },
      isRead && styles.alertCardRead,
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.iconCircle, { backgroundColor: '#FFFFFF' }]}>
      <Ionicons name={icon} size={20} color={iconColor} />
    </View>
    <View style={{ flex: 1, marginLeft: 12 }}>
      <View style={styles.alertTop}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {!isRead ? <View style={styles.unreadDot} /> : null}
          <Text
            style={[styles.alertTitle, isRead && styles.alertTitleRead]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
        {time ? <Text style={styles.alertTime}>{time}</Text> : null}
      </View>

      <Text
        style={[styles.alertSub, isRead && styles.alertSubRead]}
        numberOfLines={2}
      >
        {subtitle}
      </Text>

      {location ? (
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={11} color={colors.textMuted} />
          <Text style={styles.locationText} numberOfLines={1}>
            {location}
          </Text>
        </View>
      ) : null}

      {actionLabel ? (
        <View style={styles.actionChip}>
          <Text style={styles.actionChipText}>{actionLabel}</Text>
        </View>
      ) : null}
    </View>
    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
  </TouchableOpacity>
);

const AlertsScreen = ({ navigation }) => {
  const {
    setAlertList,
    markAllRead,
    markOneRead,
    unreadCount,
    totalCount,
    isRead,
  } = useAlerts();

  const HOSPITAL = useMyHospital();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expiring, setExpiring] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [transfers, setTransfers] = useState([]);

  const load = useCallback(async () => {
    try {
      const [expRes, predRes, transRes] = await Promise.allSettled([
        stockService.expiring(7),
        predictionService.list(),
        transferService.list({ hospital: HOSPITAL }),
      ]);

      if (expRes.status === 'fulfilled') {
        setExpiring(expRes.value.data.stock || []);
      }
      if (predRes.status === 'fulfilled') {
        setPredictions(predRes.value.data.predictions || []);
      }
      if (transRes.status === 'fulfilled') {
        setTransfers(transRes.value.data.transfers || []);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to load alerts.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [HOSPITAL]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation, load]);

  const allAlerts = useMemo(() => {
    const list = [];

    // ---------- 1. EXPIRED UNITS ----------
    expiring
      .filter((s) => new Date(s.expiryDate) <= new Date())
      .forEach((s) => {
        list.push({
          id: `expired-${s._id}`,
          section: 'EXPIRED UNITS',
          icon: 'close-circle',
          iconColor: '#7F1D1D',
          bg: '#FEE2E2',
          title: `${s.bloodGroup} · ${s.units} unit${s.units > 1 ? 's' : ''} expired`,
          subtitle: `Batch expired. Dispose immediately.`,
          location: s.hospital,
          nav: 'ExpiryMonitoring',
          createdAt: s.expiryDate,
        });
      });

    // ---------- 2. EXPIRING SOON ----------
    expiring
      .filter((s) => {
        const days = (new Date(s.expiryDate) - Date.now()) / (1000 * 60 * 60 * 24);
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
          title: `${s.bloodGroup} · ${s.units} unit${s.units > 1 ? 's' : ''} expiring`,
          subtitle: `Expires in ${days} day${days === 1 ? '' : 's'}.`,
          location: s.hospital,
          nav: 'ExpiryMonitoring',
          createdAt: s.expiryDate,
        });
      });

    // ---------- 3. BLOOD BANK EXCHANGE ----------
    transfers.forEach((t) => {
      const iAmSource = t.sourceBank === HOSPITAL;
      const iAmRequester = t.destinationHospital === HOSPITAL;

      // INCOMING PENDING — I need to approve/reject
      if (iAmSource && t.status === 'PENDING') {
        list.push({
          id: `exchange-in-${t._id}`,
          section: 'EXCHANGE REQUESTS',
          icon: 'arrow-down-circle',
          iconColor: '#7C3AED',
          bg: '#F3E8FF',
          title: `New request from ${t.destinationHospital}`,
          subtitle: `${t.units} unit(s) of ${t.bloodGroup} · ${t.urgency} priority`,
          location: t.destinationHospital,
          nav: 'PendingTransfers',
          actionLabel: 'REVIEW',
          createdAt: t.createdAt,
        });
      }
      // OUTGOING PENDING — waiting for approval
      else if (iAmRequester && t.status === 'PENDING') {
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
      }
      // APPROVED (source) — I need to mark delivered
      else if (iAmSource && t.status === 'APPROVED') {
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
      }
      // DELIVERED (requester) — I need to confirm receipt
      else if (iAmRequester && t.status === 'DELIVERED') {
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
      }
      // DELIVERED (source) — waiting for confirmation
      else if (iAmSource && t.status === 'DELIVERED') {
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

    // ---------- 4. SHORTAGE WARNINGS ----------
    predictions
      .filter((p) => p.riskLevel === 'CRITICAL')
      .forEach((p, idx) => {
        list.push({
          id: `critical-pred-${p.bloodGroup}-${idx}`,
          section: 'SHORTAGE WARNINGS',
          icon: 'warning',
          iconColor: colors.primary,
          bg: '#FFF1F3',
          title: `Critical ${p.bloodGroup} shortage`,
          subtitle: `${p.reason} ${p.recommendedAction}`,
          nav: 'AIPrediction',
        });
      });

    // ---------- 5. HIGH PRIORITY PREDICTIONS ----------
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
  }, [expiring, predictions, transfers, HOSPITAL]);

  // Push to context
  useEffect(() => {
    setAlertList(allAlerts);
  }, [allAlerts, setAlertList]);

  // Group by section (keep ALL — read + unread)
  const sections = useMemo(() => {
    const map = new Map();
    allAlerts.forEach((a) => {
      if (!map.has(a.section)) map.set(a.section, []);
      map.get(a.section).push(a);
    });
    return Array.from(map.entries());
  }, [allAlerts]);

  const handlePress = async (alert) => {
    // Mark as read but keep it in the list
    await markOneRead(alert.id);
    navigation.navigate(alert.nav);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader
        navigation={navigation}
        onMenuPress={() => setSidebarOpen(true)}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>Alerts</Text>
          {unreadCount > 0 ? (
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{unreadCount} new</Text>
            </View>
          ) : (
            <View style={styles.readPill}>
              <Text style={styles.readPillText}>All read</Text>
            </View>
          )}
          {unreadCount > 0 ? (
            <TouchableOpacity
              style={styles.markReadBtn}
              onPress={markAllRead}
            >
              <Ionicons
                name="checkmark-done"
                size={14}
                color={colors.primary}
              />
              <Text style={styles.markReadText}>Mark all read</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <Text style={styles.subtitle}>
          {totalCount} notification{totalCount === 1 ? '' : 's'} · priority alerts
          across your blood bank
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
        ) : totalCount === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name="checkmark-circle-outline"
              size={48}
              color={colors.success}
            />
            <Text style={styles.emptyTitle}>All clear</Text>
            <Text style={styles.emptySub}>No alerts right now.</Text>
          </View>
        ) : (
          sections.map(([section, items]) => {
            const unreadInSection = items.filter((a) => !isRead(a.id)).length;
            return (
              <View key={section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionLabel}>{section}</Text>
                  {unreadInSection > 0 ? (
                    <View style={styles.sectionBadge}>
                      <Text style={styles.sectionBadgeText}>
                        {unreadInSection} new
                      </Text>
                    </View>
                  ) : null}
                </View>
                {items.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    icon={alert.icon}
                    iconColor={alert.iconColor}
                    bg={alert.bg}
                    title={alert.title}
                    subtitle={alert.subtitle}
                    location={alert.location}
                    time={timeAgo(alert.createdAt)}
                    isRead={isRead(alert.id)}
                    actionLabel={alert.actionLabel}
                    onPress={() => handlePress(alert)}
                  />
                ))}
              </View>
            );
          })
        )}
      </ScrollView>

      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        onComingSoon={comingSoon}
        menu={OFFICER_MENU}
        variant="staff"
        activeKey="Alerts"
        hospital={HOSPITAL}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: 16, paddingBottom: 30 },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
  },
  countPill: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  countPillText: { color: colors.white, fontWeight: '800', fontSize: 11 },
  readPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  readPillText: { color: '#059669', fontWeight: '800', fontSize: 11 },
  markReadBtn: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
  },
  markReadText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  subtitle: { fontSize: 12, color: colors.textSecondary, marginBottom: 16 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  sectionBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  sectionBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },

  alertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 16,
    marginBottom: 8,
  },
  alertCardRead: { opacity: 0.55 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  alertTitleRead: { fontWeight: '600', color: colors.textSecondary },
  alertTime: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  alertSub: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  alertSubRead: { color: colors.textMuted },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  locationText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
    flex: 1,
  },
  actionChip: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 8,
  },
  actionChipText: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 0.5,
  },

  empty: { alignItems: 'center', paddingVertical: 80, gap: 8 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginTop: 8,
  },
  emptySub: { fontSize: 13, color: colors.textSecondary },
});

export default AlertsScreen;
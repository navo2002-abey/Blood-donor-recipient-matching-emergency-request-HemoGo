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
import { BloodDrop } from '../../components/Logo';
import { useAlerts } from '../../context/AlertsContext';
import {
  predictionService,
  stockService,
  transferService,
} from '../../services/officerService';
import { colors } from '../../utils/colors';

const AlertCard = ({ icon, iconColor, bg, title, subtitle, time, onPress }) => (
  <TouchableOpacity
    style={[styles.alertCard, { backgroundColor: bg }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.iconCircle, { backgroundColor: '#FFFFFF' }]}>
      <Ionicons name={icon} size={20} color={iconColor} />
    </View>
    <View style={{ flex: 1, marginLeft: 12 }}>
      <View style={styles.alertTop}>
        <Text style={styles.alertTitle} numberOfLines={1}>
          {title}
        </Text>
        {time ? <Text style={styles.alertTime}>{time}</Text> : null}
      </View>
      <Text style={styles.alertSub} numberOfLines={2}>
        {subtitle}
      </Text>
    </View>
    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
  </TouchableOpacity>
);

const AlertsScreen = ({ navigation }) => {
  const {
    setAlertList,
    markAllRead,
    dismissOne,
    unreadCount,
    totalCount,
    dismissedIds,
  } = useAlerts();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expiring, setExpiring] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [pendingTransfers, setPendingTransfers] = useState([]);

  const load = useCallback(async () => {
    try {
      const [expRes, predRes, transRes] = await Promise.allSettled([
        stockService.expiring(7),
        predictionService.list(),
        transferService.list({ status: 'PENDING' }),
      ]);

      if (expRes.status === 'fulfilled') {
        setExpiring(expRes.value.data.stock || []);
      }
      if (predRes.status === 'fulfilled') {
        setPredictions(predRes.value.data.predictions || []);
      }
      if (transRes.status === 'fulfilled') {
        setPendingTransfers(transRes.value.data.transfers || []);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to load alerts.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation, load]);

  // Build alert list with STABLE IDs so dismissed state persists correctly
  const allAlerts = useMemo(() => {
    const list = [];

    // Expired units
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
          subtitle: `Batch expired on ${new Date(s.expiryDate).toLocaleDateString()}. Dispose immediately.`,
          nav: 'ExpiryMonitoring',
        });
      });

    // Expiring soon (within 5 days)
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
          subtitle: `Expires in ${days} day${days === 1 ? '' : 's'} on ${new Date(s.expiryDate).toLocaleDateString()}.`,
          nav: 'ExpiryMonitoring',
        });
      });

    // Critical predictions
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

    // Pending transfers
    pendingTransfers.forEach((t) => {
      list.push({
        id: `transfer-${t._id}`,
        section: 'PENDING TRANSFERS',
        icon: 'swap-horizontal',
        iconColor: '#3B82F6',
        bg: '#EFF6FF',
        title: `${t.bloodGroup} transfer pending`,
        subtitle: `${t.units} unit(s) from ${t.sourceBank} → ${t.destinationHospital}.`,
        nav: 'PendingTransfers',
      });
    });

    // High priority predictions
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
  }, [expiring, predictions, pendingTransfers]);

  // Push to context
  useEffect(() => {
    setAlertList(allAlerts);
  }, [allAlerts, setAlertList]);

  // Visible alerts = not dismissed
  const visibleAlerts = allAlerts.filter((a) => !dismissedIds.includes(a.id));

  // Group by section for rendering
  const sections = useMemo(() => {
    const map = new Map();
    visibleAlerts.forEach((a) => {
      if (!map.has(a.section)) map.set(a.section, []);
      map.get(a.section).push(a);
    });
    return Array.from(map.entries());
  }, [visibleAlerts]);

  const handlePress = (alert) => {
    dismissOne(alert.id);
    navigation.navigate(alert.nav);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.brand}>
          <BloodDrop size={18} />
          <Text style={styles.brandText}>HemoGo</Text>
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity style={styles.markReadBtn} onPress={markAllRead}>
            <Ionicons name="checkmark-done" size={18} color={colors.primary} />
            <Text style={styles.markReadText}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

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
          ) : null}
        </View>
        <Text style={styles.subtitle}>
          Priority notifications across your blood bank
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
        ) : unreadCount === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name="checkmark-circle-outline"
              size={48}
              color={colors.success}
            />
            <Text style={styles.emptyTitle}>All clear</Text>
            <Text style={styles.emptySub}>
              {totalCount === 0
                ? 'No urgent alerts right now.'
                : `All ${totalCount} alerts marked as read.`}
            </Text>
          </View>
        ) : (
          sections.map(([section, items]) => (
            <View key={section}>
              <Text style={styles.sectionLabel}>{section}</Text>
              {items.map((alert) => (
                <AlertCard
                  key={alert.id}
                  icon={alert.icon}
                  iconColor={alert.iconColor}
                  bg={alert.bg}
                  title={alert.title}
                  subtitle={alert.subtitle}
                  onPress={() => handlePress(alert)}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandText: { color: colors.primary, fontSize: 18, fontWeight: '800' },
  markReadBtn: {
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
  scroll: { padding: 16, paddingBottom: 30 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
  },
  countPill: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countPillText: { color: colors.primary, fontWeight: '800', fontSize: 11 },
  subtitle: { fontSize: 12, color: colors.textSecondary, marginBottom: 20 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.6,
    marginTop: 12,
    marginBottom: 8,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 8,
  },
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
  alertTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
  },
  alertTime: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  alertSub: { fontSize: 11, color: colors.textSecondary, lineHeight: 16 },
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
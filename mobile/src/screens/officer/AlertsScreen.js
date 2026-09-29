import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
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
import {
  predictionService,
  stockService,
  transferService,
} from '../../services/officerService';
import { colors } from '../../utils/colors';

const HOSPITAL = 'Colombo General Hospital Blood Bank';

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

  const expiredUnits = expiring.filter(
    (s) => new Date(s.expiryDate) <= new Date()
  );
  const criticalUnits = expiring.filter((s) => {
    const days = (new Date(s.expiryDate) - Date.now()) / (1000 * 60 * 60 * 24);
    return days > 0 && days <= 5;
  });
  const criticalPreds = predictions.filter((p) => p.riskLevel === 'CRITICAL');
  const highPreds = predictions.filter((p) => p.riskLevel === 'HIGH');

  const totalAlerts =
    expiredUnits.length +
    criticalUnits.length +
    criticalPreds.length +
    pendingTransfers.length;

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.brand}>
          <BloodDrop size={18} />
          <Text style={styles.brandText}>HemoGo</Text>
        </View>
        <View style={styles.badgeWrap}>
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
          {totalAlerts > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {totalAlerts > 9 ? '9+' : totalAlerts}
              </Text>
            </View>
          ) : null}
        </View>
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
          {totalAlerts > 0 ? (
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{totalAlerts} new</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.subtitle}>
          Priority notifications across your blood bank
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
        ) : totalAlerts === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name="checkmark-circle-outline"
              size={48}
              color={colors.success}
            />
            <Text style={styles.emptyTitle}>All clear</Text>
            <Text style={styles.emptySub}>No urgent alerts right now.</Text>
          </View>
        ) : (
          <>
            {expiredUnits.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>EXPIRED UNITS</Text>
                {expiredUnits.slice(0, 3).map((item) => (
                  <AlertCard
                    key={item._id}
                    icon="close-circle"
                    iconColor="#7F1D1D"
                    bg="#FEE2E2"
                    title={`${item.bloodGroup} · ${item.units} unit${
                      item.units > 1 ? 's' : ''
                    } expired`}
                    subtitle={`Batch expired on ${new Date(
                      item.expiryDate
                    ).toLocaleDateString()}. Dispose immediately.`}
                    onPress={() => navigation.navigate('ExpiryMonitoring')}
                  />
                ))}
              </>
            )}

            {criticalUnits.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>EXPIRING SOON</Text>
                {criticalUnits.slice(0, 3).map((item) => {
                  const days = Math.ceil(
                    (new Date(item.expiryDate) - Date.now()) /
                      (1000 * 60 * 60 * 24)
                  );
                  return (
                    <AlertCard
                      key={item._id}
                      icon="hourglass"
                      iconColor="#EF4444"
                      bg="#FFF1F3"
                      title={`${item.bloodGroup} · ${item.units} unit${
                        item.units > 1 ? 's' : ''
                      } expiring`}
                      subtitle={`Expires in ${days} day${
                        days === 1 ? '' : 's'
                      } on ${new Date(item.expiryDate).toLocaleDateString()}.`}
                      onPress={() => navigation.navigate('ExpiryMonitoring')}
                    />
                  );
                })}
              </>
            )}

            {criticalPreds.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>SHORTAGE WARNINGS</Text>
                {criticalPreds.slice(0, 3).map((p, idx) => (
                  <AlertCard
                    key={`pred-${idx}`}
                    icon="warning"
                    iconColor={colors.primary}
                    bg="#FFF1F3"
                    title={`Critical ${p.bloodGroup} shortage`}
                    subtitle={`${p.reason} ${p.recommendedAction}`}
                    onPress={() => navigation.navigate('AIPrediction')}
                  />
                ))}
              </>
            )}

            {pendingTransfers.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>PENDING TRANSFERS</Text>
                {pendingTransfers.slice(0, 3).map((t) => (
                  <AlertCard
                    key={t._id}
                    icon="swap-horizontal"
                    iconColor="#3B82F6"
                    bg="#EFF6FF"
                    title={`${t.bloodGroup} transfer pending`}
                    subtitle={`${t.units} unit(s) from ${t.sourceBank} → ${t.destinationHospital}.`}
                    time={timeAgo(t.createdAt)}
                    onPress={() => navigation.navigate('PendingTransfers')}
                  />
                ))}
              </>
            )}

            {highPreds.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>HIGH PRIORITY</Text>
                {highPreds.slice(0, 2).map((p, idx) => (
                  <AlertCard
                    key={`high-${idx}`}
                    icon="alert-circle"
                    iconColor="#F59E0B"
                    bg="#FFFBEB"
                    title={`${p.bloodGroup} stock warning`}
                    subtitle={`${p.reason} ${p.recommendedAction}`}
                    onPress={() => navigation.navigate('AIPrediction')}
                  />
                ))}
              </>
            )}
          </>
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
  badgeWrap: { position: 'relative', padding: 4 },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  badgeText: { color: colors.white, fontSize: 9, fontWeight: '900' },
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
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
import { useConfirm } from '../../context/ConfirmContext';
import { predictionService } from '../../services/officerService';
import { colors } from '../../utils/colors';

const FILTERS = ['Show All', 'Critical/Emergency', 'High Urgency'];

const SOURCE_HOSPITAL = 'Colombo General Hospital Blood Bank';
const DEST_HOSPITAL = 'National Hospital Colombo Blood Bank';

const riskColor = (level) => {
  if (level === 'CRITICAL') return colors.primary;
  if (level === 'HIGH') return '#F59E0B';
  return '#3B82F6';
};

const BloodRescueScreen = ({ navigation }) => {
  const confirm = useConfirm();
  const [filter, setFilter] = useState('Show All');
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await predictionService.list();
      const items = (data.predictions || []).filter(
        (p) => p.riskLevel === 'CRITICAL' || p.riskLevel === 'HIGH'
      );
      setPredictions(items);
    } catch (e) {
      Alert.alert('Error', 'Failed to load rescue recommendations.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRequestTransfer = (p) => {
    navigation.navigate('TransferRequest', {
      bloodGroup: p.bloodGroup,
      riskLevel: p.riskLevel,
    });
  };

  const handleDismiss = async (p, idx) => {
    const ok = await confirm({
      title: 'Dismiss Recommendation',
      message: `Dismiss ${p.bloodGroup} rescue recommendation?`,
      confirmText: 'Dismiss',
    });
    if (!ok) return;

    setBusyId(`${p.bloodGroup}-${idx}`);
    setPredictions((prev) => prev.filter((x, i) => !(x.bloodGroup === p.bloodGroup && i === idx)));
    setBusyId(null);
  };

  const filtered = predictions.filter((p) => {
    if (filter === 'Show All') return true;
    if (filter === 'Critical/Emergency') return p.riskLevel === 'CRITICAL';
    if (filter === 'High Urgency') return p.riskLevel === 'HIGH';
    return true;
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Blood Rescue & Exchange</Text>
        <View style={styles.backBtn} />
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
          <Ionicons name="swap-horizontal-outline" size={20} color={colors.primary} />
          <Text style={styles.title}>Blood Rescue & Exchange</Text>
        </View>
        <Text style={styles.subtitle}>Filter by urgency</Text>

        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={40} color={colors.success} />
            <Text style={styles.emptyText}>No rescue recommendations.</Text>
          </View>
        ) : (
          filtered.map((p, idx) => {
            const busy = busyId === `${p.bloodGroup}-${idx}`;
            return (
              <View key={`${p.bloodGroup}-${idx}`} style={styles.card}>
                <View style={styles.cardTop}>
                  <Ionicons name="warning" size={16} color={riskColor(p.riskLevel)} />
                  <Text style={[styles.cardTitle, { color: riskColor(p.riskLevel) }]}>
                    RESCUE RECOMMENDED ({p.bloodGroup})
                  </Text>
                  <View style={{ flex: 1 }} />
                  <View style={[styles.riskPill, { backgroundColor: riskColor(p.riskLevel) }]}>
                    <Text style={styles.riskText}>{p.riskLevel}</Text>
                  </View>
                </View>

                <View style={styles.routeRow}>
                  <View style={styles.routeCol}>
                    <Text style={styles.routeLabel}>SOURCE BLOOD BANK</Text>
                    <Text style={styles.routeValue} numberOfLines={2}>
                      {SOURCE_HOSPITAL}
                    </Text>
                    <Text style={styles.routeSub}>📍 2.3 km</Text>
                  </View>

                  <Ionicons name="arrow-forward" size={18} color={colors.primary} />

                  <View style={styles.routeCol}>
                    <Text style={styles.routeLabel}>DESTINATION HOSPITAL</Text>
                    <Text style={styles.routeValue} numberOfLines={2}>
                      {DEST_HOSPITAL}
                    </Text>
                    <Text style={styles.routeSub}>📍 3.8 km</Text>
                  </View>
                </View>

                <View style={styles.infoBoxes}>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoLabel}>Available Units</Text>
                    <Text style={styles.infoValue}>{p.currentStock} units</Text>
                  </View>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoLabel}>Current Stock (Dest.)</Text>
                    <Text style={[styles.infoValue, { color: colors.primary }]}>
                      {p.currentStock <= 2 ? 'LOW' : 'OK'}
                    </Text>
                  </View>
                </View>

                <View style={styles.reasonBox}>
                  <Text style={styles.reasonText}>
                    Reason: {p.reason} Immediate transfer required.
                  </Text>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.primaryBtn, busy && styles.disabled]}
                    onPress={() => handleRequestTransfer(p)}
                    disabled={busy}
                  >
                    <Ionicons name="swap-horizontal" size={14} color={colors.white} />
                    <Text style={styles.primaryText}>Request Transfer</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.outlineBtn, busy && styles.disabled]}
                    onPress={() => handleDismiss(p, idx)}
                    disabled={busy}
                  >
                    <Ionicons name="close" size={14} color={colors.text} />
                    <Text style={styles.outlineText}>Dismiss</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        <TouchableOpacity
          style={styles.logBtn}
          onPress={() => navigation.navigate('PendingTransfers')}
        >
          <Ionicons name="list-outline" size={18} color={colors.text} />
          <Text style={styles.logText}>View Pending Transfer Log</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.text} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  scroll: { padding: 16, paddingBottom: 40 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 8, marginBottom: 8 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F4F4F6',
  },
  filterChipActive: { backgroundColor: colors.primary },
  filterText: { fontSize: 12, fontWeight: '700', color: colors.text },
  filterTextActive: { color: colors.white },
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#F7C4CB',
    marginBottom: 14,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  cardTitle: { fontSize: 13, fontWeight: '800' },
  riskPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  riskText: { color: colors.white, fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  routeCol: { flex: 1 },
  routeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.4,
  },
  routeValue: { fontSize: 12, fontWeight: '700', color: colors.text, marginTop: 4 },
  routeSub: { fontSize: 10, color: colors.primary, marginTop: 2, fontWeight: '600' },
  infoBoxes: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  infoBox: { flex: 1, backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12 },
  infoLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '700' },
  infoValue: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 4 },
  reasonBox: {
    backgroundColor: '#FFF1F3',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  reasonText: { fontSize: 11, color: colors.primary, lineHeight: 16 },
  actionRow: { flexDirection: 'row', gap: 10 },
  primaryBtn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: colors.white, fontWeight: '800', fontSize: 13 },
  outlineBtn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: colors.border,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineText: { color: colors.text, fontWeight: '800', fontSize: 13 },
  disabled: { opacity: 0.5 },
  logBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F4F4F6',
    padding: 16,
    borderRadius: 14,
    marginTop: 10,
    gap: 10,
  },
  logText: { flex: 1, fontSize: 14, fontWeight: '800', color: colors.text },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { marginTop: 10, color: colors.textSecondary },
});

export default BloodRescueScreen;
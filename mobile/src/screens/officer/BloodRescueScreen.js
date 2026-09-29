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
import { predictionService, transferService } from '../../services/officerService';
import { colors } from '../../utils/colors';

const FILTERS = ['Show All', 'Critical/Emergency', 'High Urgency'];

const BloodRescueScreen = ({ navigation }) => {
  const [filter, setFilter] = useState('Show All');
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await predictionService.list();
      // take only CRITICAL or HIGH
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
    navigation.navigate('TransferRequest', { bloodGroup: p.bloodGroup, riskLevel: p.riskLevel });
  };

  const handleDismiss = (p) => {
    Alert.alert('Dismiss', `Dismiss ${p.bloodGroup} recommendation?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Dismiss', onPress: () => setPredictions((prev) => prev.filter((x) => x !== p)) },
    ]);
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <Text style={styles.title}>
          <Ionicons name="swap-horizontal-outline" size={20} color={colors.primary} /> Blood Rescue & Exchange
        </Text>
        <Text style={styles.subtitle}>Filter by urgency</Text>

        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
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
          filtered.map((p, idx) => (
            <View key={idx} style={styles.card}>
              <View style={styles.cardTop}>
                <Ionicons name="warning" size={16} color={colors.primary} />
                <Text style={styles.cardTitle}>
                  RESCUE RECOMMENDED ({p.bloodGroup})
                </Text>
                <View style={{ flex: 1 }} />
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </View>

              <View style={styles.routeRow}>
                <View style={styles.routeCol}>
                  <Text style={styles.routeLabel}>SOURCE BLOOD BANK</Text>
                  <Text style={styles.routeValue}>Colombo General Hospital Blood Bank</Text>
                  <Text style={styles.routeSub}>📍 2.3 km</Text>
                </View>
                <Ionicons name="arrow-forward" size={18} color={colors.primary} />
                <View style={styles.routeCol}>
                  <Text style={styles.routeLabel}>DESTINATION HOSPITAL</Text>
                  <Text style={styles.routeValue}>National Hospital Colombo</Text>
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
                  <Text style={[styles.infoValue, { color: colors.primary }]}>LOW</Text>
                </View>
              </View>

              <View style={styles.reasonBox}>
                <Text style={styles.reasonText}>
                  Reason: {p.reason} Immediate transfer required.
                </Text>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => handleRequestTransfer(p)}
                >
                  <Text style={styles.primaryBtnText}>Request Transfer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.outlineBtn}
                  onPress={() => handleDismiss(p)}
                >
                  <Ionicons name="close" size={16} color={colors.text} />
                  <Text style={styles.outlineBtnText}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <TouchableOpacity
          style={styles.logBtn}
          onPress={() => navigation.navigate('PendingTransfers')}
        >
          <Text style={styles.logText}>View Pending Transfer Log</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.text} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  scroll: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 8, marginBottom: 8 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F4F4F6' },
  filterChipActive: { backgroundColor: colors.primary },
  filterText: { fontSize: 12, fontWeight: '700', color: colors.text },
  filterTextActive: { color: colors.white },
  card: { backgroundColor: colors.white, borderRadius: 18, padding: 14, borderWidth: 1.5, borderColor: '#F7C4CB', marginBottom: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  cardTitle: { fontSize: 13, fontWeight: '800', color: colors.primary },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  routeCol: { flex: 1 },
  routeLabel: { fontSize: 9, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.4 },
  routeValue: { fontSize: 12, fontWeight: '700', color: colors.text, marginTop: 4 },
  routeSub: { fontSize: 10, color: colors.primary, marginTop: 2 },
  infoBoxes: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  infoBox: { flex: 1, backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12 },
  infoLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '700' },
  infoValue: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 4 },
  reasonBox: { backgroundColor: '#FFF1F3', padding: 10, borderRadius: 10, marginBottom: 12 },
  reasonText: { fontSize: 11, color: colors.primary, lineHeight: 16 },
  actionRow: { flexDirection: 'row', gap: 10 },
  primaryBtn: { flex: 1, height: 46, borderRadius: 23, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: colors.white, fontWeight: '800', fontSize: 13 },
  outlineBtn: { flex: 1, height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  outlineBtnText: { color: colors.text, fontWeight: '800', fontSize: 13 },
  logBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F4F4F6', padding: 16, borderRadius: 14, marginTop: 10 },
  logText: { fontSize: 14, fontWeight: '800', color: colors.text },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { marginTop: 10, color: colors.textSecondary },
});

export default BloodRescueScreen;
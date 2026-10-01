import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useConfirm } from '../../context/ConfirmContext';
import { useMyHospital } from '../../hooks/useMyHospital';
import { reservationService } from '../../services/officerService';
import { colors } from '../../utils/colors';

const statusColor = (status) => {
  if (status === 'RESERVED') return '#F59E0B';
  if (status === 'RELEASED') return colors.success;
  if (status === 'USED') return '#3B82F6';
  if (status === 'EXPIRED') return colors.primary;
  return colors.textSecondary;
};

const statusBg = (status) => {
  if (status === 'RESERVED') return '#FFFBEB';
  if (status === 'RELEASED') return '#ECFDF5';
  if (status === 'USED') return '#EFF6FF';
  if (status === 'EXPIRED') return '#FFF1F3';
  return '#F4F4F6';
};

const ReservedUnitsScreen = ({ navigation }) => {
  const confirm = useConfirm();
  const HOSPITAL = useMyHospital();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await reservationService.list({ hospital: HOSPITAL });
      setList(data.reservations || []);
    } catch (e) {
      Alert.alert('Error', 'Failed to load reservations.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [HOSPITAL]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation, load]);

  const handleRelease = async (item) => {
    const ok = await confirm({
      title: 'Release Unit',
      message: `Return unit ${item.unitId} (${item.units || 1} unit${(item.units || 1) > 1 ? 's' : ''}) to available stock?`,
      confirmText: 'Release',
    });
    if (!ok) return;
    try {
      setBusyId(item._id);
      await reservationService.update(item._id, { status: 'RELEASED' });
      await load();
      Alert.alert('Released', 'Unit returned to available stock.');
    } catch (e) {
      Alert.alert('Error', 'Failed to release unit.');
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkUsed = async (item) => {
    const ok = await confirm({
      title: 'Mark Used',
      message: `Mark unit ${item.unitId} as used?`,
      confirmText: 'Mark Used',
    });
    if (!ok) return;
    try {
      setBusyId(item._id);
      await reservationService.update(item._id, { status: 'USED' });
      await load();
      Alert.alert('Updated', 'Unit marked as used.');
    } catch (e) {
      Alert.alert('Error', 'Failed to update unit.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (item) => {
    const ok = await confirm({
      title: 'Cancel Reservation',
      message: `Permanently remove reservation for ${item.patientName}? Units will return to stock.`,
      confirmText: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      setBusyId(item._id);
      await reservationService.remove(item._id);
      await load();
      Alert.alert('Deleted', 'Reservation removed.');
    } catch (e) {
      Alert.alert('Error', 'Failed to delete reservation.');
    } finally {
      setBusyId(null);
    }
  };

  const renderItem = ({ item }) => {
    const isReserved = item.status === 'RESERVED';
    const busy = busyId === item._id;
    const reservedUnits = item.units || 1;

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.unitBadge}>
            <Text style={styles.unitId}>{item.unitId}</Text>
          </View>
          <View style={styles.bloodBadge}>
            <Text style={styles.bloodText}>{item.bloodGroup} × {reservedUnits}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.patient} numberOfLines={1}>{item.patientName}</Text>
            <Text style={styles.ward} numberOfLines={1}>{item.ward}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusBg(item.status) }]}>
            <Text style={[styles.statusText, { color: statusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.infoList}>
          <View style={styles.infoRow}>
            <Ionicons name="water-outline" size={13} color={colors.textMuted} />
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Units: </Text>
              <Text style={styles.infoValue}>{reservedUnits}</Text>
            </Text>
          </View>

          {item.reservedFor ? (
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={13} color={colors.textMuted} />
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>Reserved for: </Text>
                <Text style={styles.infoValue}>{item.reservedFor}</Text>
              </Text>
            </View>
          ) : null}

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={13} color={colors.textMuted} />
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Reserved at: </Text>
              <Text style={styles.infoValue}>
                {new Date(item.reservedAt || item.createdAt).toLocaleString()}
              </Text>
            </Text>
          </View>
        </View>

        {isReserved && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, busy && styles.actionDisabled]}
              onPress={() => handleRelease(item)}
              disabled={busy}
            >
              <Text style={styles.actionText}>{busy ? '...' : 'Release'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionPrimary, busy && styles.actionDisabled]}
              onPress={() => handleMarkUsed(item)}
              disabled={busy}
            >
              <Text style={styles.actionPrimaryText}>{busy ? '...' : 'Mark Used'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconBtn, busy && styles.actionDisabled]}
              onPress={() => handleDelete(item)}
              disabled={busy}
            >
              <Ionicons name="trash-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {!isReserved && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.iconBtn, busy && styles.actionDisabled]}
              onPress={() => handleDelete(item)}
              disabled={busy}
            >
              <Ionicons name="trash-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.hintText}>
              {item.status === 'RELEASED' && 'Units returned to available stock.'}
              {item.status === 'USED' && 'Units consumed from stock.'}
              {item.status === 'EXPIRED' && 'Reservation expired.'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reserved Units</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.navigate('CreateReservation')}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="bookmark-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>No reservations yet.</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('CreateReservation')}
              >
                <Text style={styles.emptyBtnText}>Create New Reservation</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerBtn}
          onPress={() => navigation.navigate('CreateReservation')}
        >
          <Text style={styles.footerText}>+ CREATE NEW RESERVATION</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  list: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: colors.white, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  unitBadge: { paddingHorizontal: 8, paddingVertical: 6, backgroundColor: colors.inputBg, borderRadius: 8 },
  unitId: { fontSize: 11, fontWeight: '800', color: colors.text },
  bloodBadge: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.primarySoft, borderRadius: 8 },
  bloodText: { fontSize: 12, fontWeight: '800', color: colors.primary },
  patient: { fontSize: 14, fontWeight: '800', color: colors.text },
  ward: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '800' },
  infoList: { gap: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 11, color: colors.textSecondary, flex: 1 },
  infoLabel: { color: colors.textMuted, fontWeight: '600' },
  infoValue: { color: colors.text, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' },
  actionBtn: { flex: 1, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  actionPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  actionText: { fontSize: 12, fontWeight: '800', color: colors.primary },
  actionPrimaryText: { fontSize: 12, fontWeight: '800', color: colors.white },
  actionDisabled: { opacity: 0.5 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  hintText: { flex: 1, fontSize: 11, color: colors.textSecondary, fontStyle: 'italic' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { marginTop: 10, color: colors.textSecondary, fontSize: 14 },
  emptyBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 22, backgroundColor: colors.primary },
  emptyBtnText: { color: colors.white, fontWeight: '800', fontSize: 13 },
  footer: { position: 'absolute', left: 16, right: 16, bottom: 20 },
  footerBtn: { height: 52, borderRadius: 26, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  footerText: { color: colors.white, fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
});

export default ReservedUnitsScreen;
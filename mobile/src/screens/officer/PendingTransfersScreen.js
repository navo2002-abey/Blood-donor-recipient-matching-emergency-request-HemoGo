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
import { transferService } from '../../services/officerService';
import { colors } from '../../utils/colors';

const statusColor = (s) => {
  if (s === 'PENDING') return '#F59E0B';
  if (s === 'APPROVED') return '#3B82F6';
  if (s === 'COMPLETED') return colors.success;
  if (s === 'REJECTED' || s === 'CANCELLED') return colors.primary;
  return colors.textSecondary;
};

const statusBg = (s) => {
  if (s === 'PENDING') return '#FFFBEB';
  if (s === 'APPROVED') return '#EFF6FF';
  if (s === 'COMPLETED') return '#ECFDF5';
  if (s === 'REJECTED' || s === 'CANCELLED') return '#FFF1F3';
  return '#F4F4F6';
};

const urgencyColor = (u) => {
  if (u === 'CRITICAL') return colors.primary;
  if (u === 'HIGH') return '#F59E0B';
  if (u === 'MEDIUM') return '#3B82F6';
  return colors.textSecondary;
};

const PendingTransfersScreen = ({ navigation }) => {
  const confirm = useConfirm();
  const HOSPITAL = useMyHospital();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await transferService.list();
      setList(data.transfers || []);
    } catch (e) {
      Alert.alert('Error', 'Failed to load transfers.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation, load]);

  const getDirection = (t) => {
    if (t.destinationHospital === HOSPITAL) return 'OUTGOING';
    if (t.sourceBank === HOSPITAL) return 'INCOMING';
    return 'OTHER';
  };

  const handleApprove = async (item) => {
    const ok = await confirm({
      title: 'Approve Transfer',
      message: `Approve ${item.units} unit(s) of ${item.bloodGroup} from ${item.sourceBank}?`,
      confirmText: 'Approve',
    });
    if (!ok) return;
    try {
      setBusyId(item._id);
      await transferService.update(item._id, { status: 'APPROVED' });
      await load();

      navigation.navigate('TransferConfirmation', {
        mode: 'approved',
        bloodGroup: item.bloodGroup,
        quantity: item.units,
        sourceHospital: item.sourceBank,
        destinationHospital: item.destinationHospital,
        urgency: item.urgency || 'HIGH',
      });
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to approve.');
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (item) => {
    const ok = await confirm({
      title: 'Cancel Transfer',
      message: 'Are you sure you want to cancel this transfer?',
      confirmText: 'Yes, Cancel',
      destructive: true,
    });
    if (!ok) return;
    try {
      setBusyId(item._id);
      await transferService.update(item._id, { status: 'CANCELLED' });
      await load();
      Alert.alert('Cancelled', 'Transfer cancelled.');
    } catch (e) {
      Alert.alert('Error', 'Failed to cancel.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (item) => {
    const ok = await confirm({
      title: 'Delete Transfer',
      message: 'Permanently remove this transfer request?',
      confirmText: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      setBusyId(item._id);
      await transferService.remove(item._id);
      await load();
      Alert.alert('Deleted', 'Transfer removed.');
    } catch (e) {
      Alert.alert('Error', 'Failed to delete.');
    } finally {
      setBusyId(null);
    }
  };

  const renderItem = ({ item }) => {
    const busy = busyId === item._id;
    const isPending = item.status === 'PENDING';
    const direction = getDirection(item);
    const isIncoming = direction === 'INCOMING';

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View
            style={[
              styles.directionPill,
              isIncoming ? styles.directionIn : styles.directionOut,
            ]}
          >
            <Ionicons
              name={isIncoming ? 'arrow-down' : 'arrow-up'}
              size={11}
              color={isIncoming ? '#7C3AED' : '#2563EB'}
            />
            <Text
              style={[
                styles.directionText,
                { color: isIncoming ? '#7C3AED' : '#2563EB' },
              ]}
            >
              {isIncoming ? 'INCOMING' : 'OUTGOING'}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusBg(item.status) }]}>
            <Text style={[styles.statusText, { color: statusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.bloodRow}>
          <View style={styles.bloodBadge}>
            <Text style={styles.bloodText}>{item.bloodGroup}</Text>
          </View>
          <Text style={styles.titleText}>
            {item.units} unit{item.units > 1 ? 's' : ''}
          </Text>
          <View style={{ flex: 1 }} />
          <View style={[styles.urgencyPill, { backgroundColor: `${urgencyColor(item.urgency)}20` }]}>
            <Text style={[styles.urgencyText, { color: urgencyColor(item.urgency) }]}>
              {item.urgency}
            </Text>
          </View>
        </View>

        <View style={styles.routeRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.routeLabel}>FROM</Text>
            <Text style={styles.routeValue} numberOfLines={2}>
              {item.sourceBank}
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={14} color={colors.textMuted} />
          <View style={{ flex: 1 }}>
            <Text style={styles.routeLabel}>TO</Text>
            <Text style={styles.routeValue} numberOfLines={2}>
              {item.destinationHospital}
            </Text>
          </View>
        </View>

        {item.reason ? (
          <View style={styles.reasonBox}>
            <Text style={styles.reasonText} numberOfLines={2}>{item.reason}</Text>
          </View>
        ) : null}

        {isPending && (
          <View style={styles.actionRow}>
            {isIncoming ? (
              <>
                <TouchableOpacity
                  style={[styles.primaryBtn, busy && styles.disabled]}
                  onPress={() => handleApprove(item)}
                  disabled={busy}
                >
                  <Ionicons name="checkmark" size={15} color={colors.white} />
                  <Text style={styles.primaryText}>{busy ? '...' : 'Approve'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.outlineBtn, busy && styles.disabled]}
                  onPress={() => handleCancel(item)}
                  disabled={busy}
                >
                  <Text style={styles.outlineText}>Reject</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.outlineBtnWide, busy && styles.disabled]}
                onPress={() => handleCancel(item)}
                disabled={busy}
              >
                <Ionicons name="close" size={14} color={colors.primary} />
                <Text style={styles.outlineTextPrimary}>Cancel Request</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.iconBtn, busy && styles.disabled]}
              onPress={() => handleDelete(item)}
              disabled={busy}
            >
              <Ionicons name="trash-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {!isPending && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.iconBtn, busy && styles.disabled]}
              onPress={() => handleDelete(item)}
              disabled={busy}
            >
              <Ionicons name="trash-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.hintText}>
              {item.status === 'APPROVED' && 'Stock will move on approval.'}
              {item.status === 'COMPLETED' && 'Blood delivered.'}
              {item.status === 'CANCELLED' && 'This transfer was cancelled.'}
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
        <Text style={styles.headerTitle}>Transfer Log</Text>
        <View style={styles.backBtn} />
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
              <Ionicons name="swap-horizontal-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>No transfer requests yet.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  list: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.cardBorder },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  directionPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  directionIn: { backgroundColor: '#F3E8FF' },
  directionOut: { backgroundColor: '#DBEAFE' },
  directionText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  bloodRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  bloodBadge: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: colors.primarySoft, borderRadius: 8 },
  bloodText: { fontSize: 13, fontWeight: '900', color: colors.primary },
  titleText: { fontSize: 14, fontWeight: '800', color: colors.text },
  urgencyPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  urgencyText: { fontSize: 9, fontWeight: '800' },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  routeLabel: { fontSize: 9, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.4 },
  routeValue: { fontSize: 11, color: colors.text, fontWeight: '700', marginTop: 2, lineHeight: 15 },
  reasonBox: { backgroundColor: '#F9FAFB', padding: 8, borderRadius: 8, marginBottom: 10 },
  reasonText: { fontSize: 11, color: colors.textSecondary, lineHeight: 15 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 4, alignItems: 'center' },
  primaryBtn: { flex: 1, height: 40, borderRadius: 20, backgroundColor: colors.primary, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: colors.white, fontWeight: '800', fontSize: 12 },
  outlineBtn: { flex: 1, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  outlineText: { color: colors.text, fontWeight: '800', fontSize: 12 },
  outlineBtnWide: { flex: 1, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: colors.primary, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' },
  outlineTextPrimary: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.5 },
  hintText: { flex: 1, fontSize: 11, color: colors.textSecondary, fontStyle: 'italic' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { marginTop: 10, color: colors.textSecondary },
});

export default PendingTransfersScreen;
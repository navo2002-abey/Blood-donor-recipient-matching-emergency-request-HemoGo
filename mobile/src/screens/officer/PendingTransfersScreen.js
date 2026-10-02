import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import AppHeader from '../../components/AppHeader';
import Sidebar from '../../components/Sidebar';
import { useConfirm } from '../../context/ConfirmContext';
import { useMyHospital } from '../../hooks/useMyHospital';
import { transferService } from '../../services/officerService';
import { colors } from '../../utils/colors';
import { OFFICER_MENU } from '../../utils/roles';

const comingSoon = (label) =>
  Alert.alert('Coming Soon', `${label} will be available soon.`);

const STATUS_FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'APPROVED', label: 'Sent' },
  { key: 'DELIVERED', label: 'In Transit' },
  { key: 'COMPLETED', label: 'Done' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const DIRECTION_FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'INCOMING', label: 'In' },
  { key: 'OUTGOING', label: 'Out' },
];

const statusTheme = (status) => {
  switch (status) {
    case 'PENDING':
      return { color: '#D97706', bg: '#FFFBEB', label: 'PENDING' };
    case 'APPROVED':
      return { color: '#2563EB', bg: '#EFF6FF', label: 'SENT' };
    case 'DELIVERED':
      return { color: '#7C3AED', bg: '#F3E8FF', label: 'IN TRANSIT' };
    case 'COMPLETED':
      return { color: '#059669', bg: '#ECFDF5', label: 'RECEIVED' };
    case 'CANCELLED':
    case 'REJECTED':
      return { color: '#DC2626', bg: '#FEE2E2', label: 'CANCELLED' };
    default:
      return { color: colors.textSecondary, bg: '#F3F4F6', label: status };
  }
};

const urgencyColor = (u) => {
  if (u === 'CRITICAL') return colors.primary;
  if (u === 'HIGH') return '#F59E0B';
  if (u === 'MEDIUM') return '#3B82F6';
  return colors.textSecondary;
};

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const PendingTransfersScreen = ({ navigation }) => {
  const confirm = useConfirm();
  const HOSPITAL = useMyHospital();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [directionFilter, setDirectionFilter] = useState('ALL');

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

  // ---------- ACTIONS ----------

  // Source officer approves the request
  const handleApprove = async (item) => {
    const ok = await confirm({
      title: 'Approve Transfer',
      message: `Send ${item.units} unit(s) of ${item.bloodGroup} to ${item.destinationHospital}?\n\nUnits will be reserved at destination.`,
      confirmText: 'Approve',
    });
    if (!ok) return;
    try {
      setBusyId(item._id);
      await transferService.update(item._id, { status: 'APPROVED' });
      await load();
      Alert.alert('Approved', 'Stock reserved. Mark as delivered when you send.');
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to approve.');
    } finally {
      setBusyId(null);
    }
  };

  // Source officer marks blood as physically sent
  const handleMarkDelivered = async (item) => {
    const ok = await confirm({
      title: 'Mark Delivered',
      message: `Confirm you sent ${item.units} unit(s) of ${item.bloodGroup} to ${item.destinationHospital}?`,
      confirmText: 'Mark Delivered',
    });
    if (!ok) return;
    try {
      setBusyId(item._id);
      await transferService.update(item._id, { status: 'DELIVERED' });
      await load();
      Alert.alert('Sent', 'Waiting for destination to confirm receipt.');
    } catch (e) {
      Alert.alert('Error', 'Failed to update.');
    } finally {
      setBusyId(null);
    }
  };

  // Requester officer confirms blood was received
  const handleConfirmReceived = async (item) => {
    const ok = await confirm({
      title: 'Confirm Received',
      message: `Confirm you received ${item.units} unit(s) of ${item.bloodGroup} from ${item.sourceBank}?\n\nUnits will be added to your available stock.`,
      confirmText: 'Confirm Received',
    });
    if (!ok) return;
    try {
      setBusyId(item._id);
      await transferService.update(item._id, { status: 'COMPLETED' });
      await load();
      Alert.alert('Received', `${item.units} unit(s) added to your stock.`);
    } catch (e) {
      Alert.alert('Error', 'Failed to confirm.');
    } finally {
      setBusyId(null);
    }
  };

  // Requester officer cancels their own pending request
  const handleCancel = async (item) => {
    const ok = await confirm({
      title: 'Cancel Request',
      message: 'Are you sure you want to cancel this request?',
      confirmText: 'Yes, Cancel',
      destructive: true,
    });
    if (!ok) return;
    try {
      setBusyId(item._id);
      await transferService.update(item._id, { status: 'CANCELLED' });
      await load();
    } catch (e) {
      Alert.alert('Error', 'Failed to cancel.');
    } finally {
      setBusyId(null);
    }
  };

  // Source officer rejects the request
  const handleReject = async (item) => {
    const ok = await confirm({
      title: 'Reject Request',
      message: `Reject the request from ${item.destinationHospital}?`,
      confirmText: 'Reject',
      destructive: true,
    });
    if (!ok) return;
    try {
      setBusyId(item._id);
      await transferService.update(item._id, { status: 'CANCELLED' });
      await load();
    } catch (e) {
      Alert.alert('Error', 'Failed to reject.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (item) => {
    const ok = await confirm({
      title: 'Delete Transfer',
      message: 'Permanently remove this record?',
      confirmText: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      setBusyId(item._id);
      await transferService.remove(item._id);
      await load();
    } catch (e) {
      Alert.alert('Error', 'Failed to delete.');
    } finally {
      setBusyId(null);
    }
  };

  // ---------- FILTERS ----------

  const filtered = useMemo(() => {
    return list.filter((t) => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (directionFilter !== 'ALL' && getDirection(t) !== directionFilter)
        return false;
      return true;
    });
  }, [list, statusFilter, directionFilter, HOSPITAL]);

  const statusCounts = useMemo(() => {
    const counts = { ALL: list.length };
    STATUS_FILTERS.slice(1).forEach((f) => {
      counts[f.key] = list.filter((t) => t.status === f.key).length;
    });
    return counts;
  }, [list]);

  // ---------- RENDER CARD ----------

  const renderItem = ({ item }) => {
    const busy = busyId === item._id;
    const direction = getDirection(item);
    const isIncoming = direction === 'INCOMING';
    const isOutgoing = direction === 'OUTGOING';
    const theme = statusTheme(item.status);
    const uColor = urgencyColor(item.urgency);

    // ✅ CORRECT ACTION LOGIC
    let actionBlock = null;

    // ---- PENDING ----
    if (item.status === 'PENDING') {
      if (isIncoming) {
        // I'm the source → Approve / Reject
        actionBlock = (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.primaryBtn, busy && styles.disabled]}
              onPress={() => handleApprove(item)}
              disabled={busy}
            >
              <Ionicons name="checkmark" size={15} color={colors.white} />
              <Text style={styles.primaryText}>
                {busy ? '...' : 'Approve'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.outlineBtn, busy && styles.disabled]}
              onPress={() => handleReject(item)}
              disabled={busy}
            >
              <Text style={styles.outlineText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconBtn, busy && styles.disabled]}
              onPress={() => handleDelete(item)}
              disabled={busy}
            >
              <Ionicons name="trash-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        );
      } else if (isOutgoing) {
        // I'm the requester → waiting + cancel
        actionBlock = (
          <View style={styles.actionRow}>
            <View style={styles.waitingBox}>
              <Ionicons name="time-outline" size={14} color="#D97706" />
              <Text style={styles.waitingText}>
                Waiting for {item.sourceBank} to approve
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.iconBtn, busy && styles.disabled]}
              onPress={() => handleCancel(item)}
              disabled={busy}
            >
              <Ionicons name="close" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        );
      }
    }
    // ---- APPROVED ----
    else if (item.status === 'APPROVED') {
      if (isIncoming) {
        // ✅ I'm the SOURCE → Mark Delivered (MY action)
        actionBlock = (
          <>
            <View style={styles.infoBox}>
              <Ionicons name="cube-outline" size={14} color="#2563EB" />
              <Text style={styles.infoBoxText}>
                Stock reserved at {item.destinationHospital}. Tap below when you send the blood.
              </Text>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.primaryBtn, busy && styles.disabled]}
                onPress={() => handleMarkDelivered(item)}
                disabled={busy}
              >
                <Ionicons name="paper-plane-outline" size={15} color={colors.white} />
                <Text style={styles.primaryText}>
                  {busy ? '...' : 'Mark Delivered'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconBtn, busy && styles.disabled]}
                onPress={() => handleDelete(item)}
                disabled={busy}
              >
                <Ionicons name="trash-outline" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </>
        );
      } else if (isOutgoing) {
        // I'm the requester → wait for source to send
        actionBlock = (
          <View style={styles.infoBox}>
            <Ionicons name="time-outline" size={14} color="#2563EB" />
            <Text style={styles.infoBoxText}>
              Approved by {item.sourceBank}. Waiting for them to send.
            </Text>
          </View>
        );
      }
    }
    // ---- DELIVERED ----
    else if (item.status === 'DELIVERED') {
      if (isOutgoing) {
        // ✅ I'm the REQUESTER → Confirm Received (MY action)
        actionBlock = (
          <>
            <View style={styles.infoBoxHighlight}>
              <Ionicons name="alert-circle" size={14} color="#7C3AED" />
              <Text style={styles.infoBoxHighlightText}>
                Blood is in transit. Confirm receipt when you get it.
              </Text>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.primaryBtn, busy && styles.disabled]}
                onPress={() => handleConfirmReceived(item)}
                disabled={busy}
              >
                <Ionicons name="checkmark-done" size={15} color={colors.white} />
                <Text style={styles.primaryText}>
                  {busy ? '...' : 'Confirm Received'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconBtn, busy && styles.disabled]}
                onPress={() => handleDelete(item)}
                disabled={busy}
              >
                <Ionicons name="trash-outline" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </>
        );
      } else if (isIncoming) {
        // I'm the source → wait for destination to confirm
        actionBlock = (
          <View style={styles.infoBox}>
            <Ionicons name="time-outline" size={14} color="#7C3AED" />
            <Text style={styles.infoBoxText}>
              Blood sent. Waiting for {item.destinationHospital} to confirm receipt.
            </Text>
          </View>
        );
      }
    }
    // ---- COMPLETED / CANCELLED ----
    else if (item.status === 'COMPLETED' || item.status === 'CANCELLED') {
      actionBlock = (
        <View style={styles.actionRow}>
          <View
            style={[
              styles.infoBox,
              item.status === 'COMPLETED' && styles.infoBoxSuccess,
            ]}
          >
            <Ionicons
              name={
                item.status === 'COMPLETED'
                  ? 'checkmark-circle'
                  : 'close-circle'
              }
              size={14}
              color={item.status === 'COMPLETED' ? '#059669' : '#DC2626'}
            />
            <Text
              style={[
                styles.infoBoxText,
                {
                  color:
                    item.status === 'COMPLETED' ? '#059669' : '#DC2626',
                },
              ]}
            >
              {item.status === 'COMPLETED'
                ? 'Delivered and confirmed.'
                : 'Transfer cancelled.'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.iconBtn, busy && styles.disabled]}
            onPress={() => handleDelete(item)}
            disabled={busy}
          >
            <Ionicons name="trash-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      );
    }

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
          <View style={[styles.statusPill, { backgroundColor: theme.bg }]}>
            <Text style={[styles.statusText, { color: theme.color }]}>
              {theme.label}
            </Text>
          </View>
          <Text style={styles.timeText}>{timeAgo(item.createdAt)}</Text>
        </View>

        <View style={styles.bloodRow}>
          <View style={styles.bloodBadge}>
            <Text style={styles.bloodText}>{item.bloodGroup}</Text>
          </View>
          <Text style={styles.titleText}>
            {item.units} unit{item.units > 1 ? 's' : ''}
          </Text>
          <View style={{ flex: 1 }} />
          <View style={[styles.urgencyPill, { backgroundColor: `${uColor}20` }]}>
            <Text style={[styles.urgencyText, { color: uColor }]}>
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
            <Text style={styles.reasonText} numberOfLines={2}>
              {item.reason}
            </Text>
          </View>
        ) : null}

        {actionBlock}
      </View>
    );
  };

  // ---------- MAIN RENDER ----------

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader
        navigation={navigation}
        onMenuPress={() => setSidebarOpen(true)}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.headerRow}>
              <Text style={styles.title}>Transfer Log</Text>
              <Text style={styles.count}>{filtered.length} results</Text>
            </View>

            <Text style={styles.filterLabel}>STATUS</Text>
            <View style={styles.filterWrap}>
              {STATUS_FILTERS.map((f) => {
                const active = statusFilter === f.key;
                const count = statusCounts[f.key] || 0;
                return (
                  <TouchableOpacity
                    key={f.key}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setStatusFilter(f.key)}
                  >
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {f.label} {count > 0 ? `(${count})` : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.filterLabel}>DIRECTION</Text>
            <View style={styles.directionRow}>
              {DIRECTION_FILTERS.map((f) => {
                const active = directionFilter === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    style={[styles.directionChip, active && styles.chipActive]}
                    onPress={() => setDirectionFilter(f.key)}
                  >
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
          ) : (
            <View style={styles.empty}>
              <Ionicons
                name="swap-horizontal-outline"
                size={40}
                color={colors.textMuted}
              />
              <Text style={styles.emptyText}>
                No transfers match your filters.
              </Text>
            </View>
          )
        }
      />

      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        onComingSoon={comingSoon}
        menu={OFFICER_MENU}
        variant="staff"
        activeKey="Pending Transfers"
        hospital={HOSPITAL}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  list: { padding: 16, paddingBottom: 40 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 14,
  },
  title: { fontSize: 22, fontWeight: '900', color: colors.text },
  count: { fontSize: 12, color: colors.textSecondary, fontWeight: '700' },

  filterLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 6,
    marginLeft: 2,
  },
  filterWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  directionRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  directionChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: { fontSize: 11, fontWeight: '800', color: colors.textSecondary },
  chipTextActive: { color: colors.white },

  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  directionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  directionIn: { backgroundColor: '#F3E8FF' },
  directionOut: { backgroundColor: '#DBEAFE' },
  directionText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  timeText: {
    flex: 1,
    textAlign: 'right',
    fontSize: 10,
    color: colors.textMuted,
  },

  bloodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  bloodBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: colors.primarySoft,
    borderRadius: 8,
  },
  bloodText: { fontSize: 13, fontWeight: '900', color: colors.primary },
  titleText: { fontSize: 14, fontWeight: '800', color: colors.text },
  urgencyPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  urgencyText: { fontSize: 9, fontWeight: '800' },

  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  routeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.4,
  },
  routeValue: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '700',
    marginTop: 2,
    lineHeight: 15,
  },

  reasonBox: {
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  reasonText: { fontSize: 11, color: colors.textSecondary, lineHeight: 15 },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    flex: 1,
  },
  infoBoxSuccess: { backgroundColor: '#ECFDF5' },
  infoBoxHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3E8FF',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '700',
  },
  infoBoxHighlightText: {
    flex: 1,
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '700',
  },

  waitingBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 8,
  },
  waitingText: {
    flex: 1,
    fontSize: 11,
    color: '#92400E',
    fontWeight: '700',
  },

  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    alignItems: 'center',
  },
  primaryBtn: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: colors.white, fontWeight: '800', fontSize: 12 },
  outlineBtn: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineText: { color: colors.text, fontWeight: '800', fontSize: 12 },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.5 },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { marginTop: 10, color: colors.textSecondary },
});

export default PendingTransfersScreen;
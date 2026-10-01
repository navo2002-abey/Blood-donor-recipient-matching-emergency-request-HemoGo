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
import { useConfirm } from '../../context/ConfirmContext';
import { useMyHospital } from '../../hooks/useMyHospital';
import { transferService } from '../../services/officerService';
import { colors } from '../../utils/colors';
import { OFFICER_MENU } from '../../utils/roles';

const DIRECTION_FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'INCOMING', label: 'Incoming' },
  { key: 'OUTGOING', label: 'Outgoing' },
];

const URGENCY_FILTERS = [
  { key: 'ALL', label: 'Show All' },
  { key: 'CRITICAL', label: 'Critical' },
  { key: 'HIGH', label: 'High' },
];

const comingSoon = (label) =>
  Alert.alert('Coming Soon', `${label} will be available soon.`);

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const urgencyColor = (u) => {
  if (u === 'CRITICAL') return colors.primary;
  if (u === 'HIGH') return '#F59E0B';
  if (u === 'MEDIUM') return '#3B82F6';
  return colors.textSecondary;
};

const BloodRescueScreen = ({ navigation }) => {
  const confirm = useConfirm();
  const myHospital = useMyHospital();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [directionFilter, setDirectionFilter] = useState('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState('ALL');
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!myHospital) {
      setError('No hospital assigned to your account.');
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      setError(null);
      const { data } = await transferService.list({ hospital: myHospital });
      // Action items:
      // - INCOMING + PENDING  → I approve/reject
      // - OUTGOING + PENDING  → I wait (or cancel)
      // - OUTGOING + APPROVED → I mark delivered
      // - INCOMING + DELIVERED → I confirm received
      const actionItems = (data.transfers || []).filter((t) => {
        const isIncoming = t.destinationHospital === myHospital;
        const isOutgoing = t.sourceBank === myHospital;
        if (isIncoming && t.status === 'PENDING') return true;
        if (isOutgoing && t.status === 'PENDING') return true;
        if (isOutgoing && t.status === 'APPROVED') return true;
        if (isIncoming && t.status === 'DELIVERED') return true;
        return false;
      });
      setTransfers(actionItems);
    } catch (e) {
      console.error('Load transfers error:', e?.response?.data || e.message);
      setError(e?.response?.data?.message || 'Failed to load.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [myHospital]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation, load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const getDirection = (t) => {
    if (t.destinationHospital === myHospital) return 'OUTGOING';
    if (t.sourceBank === myHospital) return 'INCOMING';
    return 'OTHER';
  };

  const handleApprove = async (t) => {
    const ok = await confirm({
      title: 'Approve Exchange',
      message: `Send ${t.units} unit(s) of ${t.bloodGroup} to ${t.destinationHospital}?`,
      confirmText: 'Approve',
    });
    if (!ok) return;
    try {
      setBusyId(t._id);
      await transferService.update(t._id, { status: 'APPROVED' });
      await load();
      navigation.navigate('TransferConfirmation', {
        mode: 'approved',
        bloodGroup: t.bloodGroup,
        quantity: t.units,
        sourceHospital: t.sourceBank,
        destinationHospital: t.destinationHospital,
        urgency: t.urgency || 'HIGH',
      });
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to approve.');
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkDelivered = async (t) => {
    const ok = await confirm({
      title: 'Mark Delivered',
      message: `Confirm ${t.units} unit(s) of ${t.bloodGroup} were sent to ${t.destinationHospital}?`,
      confirmText: 'Mark Delivered',
    });
    if (!ok) return;
    try {
      setBusyId(t._id);
      await transferService.update(t._id, { status: 'DELIVERED' });
      await load();
      Alert.alert('Sent', 'Waiting for destination to confirm receipt.');
    } catch (e) {
      Alert.alert('Error', 'Failed to update.');
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmReceived = async (t) => {
    const ok = await confirm({
      title: 'Confirm Received',
      message: `Confirm you received ${t.units} unit(s) of ${t.bloodGroup}?`,
      confirmText: 'Confirm Received',
    });
    if (!ok) return;
    try {
      setBusyId(t._id);
      await transferService.update(t._id, { status: 'COMPLETED' });
      await load();
      Alert.alert('Received', `${t.units} unit(s) added to your stock.`);
    } catch (e) {
      Alert.alert('Error', 'Failed to confirm.');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (t) => {
    const ok = await confirm({
      title: 'Reject Exchange',
      message: `Reject the request for ${t.units} unit(s) of ${t.bloodGroup}?`,
      confirmText: 'Reject',
      destructive: true,
    });
    if (!ok) return;
    try {
      setBusyId(t._id);
      await transferService.update(t._id, { status: 'CANCELLED' });
      await load();
      Alert.alert('Rejected', 'Request rejected.');
    } catch (e) {
      Alert.alert('Error', 'Failed to reject.');
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (t) => {
    const ok = await confirm({
      title: 'Cancel Request',
      message: `Cancel your request for ${t.bloodGroup}?`,
      confirmText: 'Cancel Request',
      destructive: true,
    });
    if (!ok) return;
    try {
      setBusyId(t._id);
      await transferService.update(t._id, { status: 'CANCELLED' });
      await load();
    } catch (e) {
      Alert.alert('Error', 'Failed to cancel.');
    } finally {
      setBusyId(null);
    }
  };

  // Filtered list
  const filtered = useMemo(() => {
    return transfers.filter((t) => {
      const dir = getDirection(t);
      if (directionFilter !== 'ALL' && dir !== directionFilter) return false;
      if (urgencyFilter !== 'ALL' && t.urgency !== urgencyFilter) return false;
      return true;
    });
  }, [transfers, directionFilter, urgencyFilter, myHospital]);

  const counts = useMemo(
    () => ({
      ALL: transfers.length,
      INCOMING: transfers.filter((t) => getDirection(t) === 'INCOMING').length,
      OUTGOING: transfers.filter((t) => getDirection(t) === 'OUTGOING').length,
    }),
    [transfers, myHospital]
  );

  const incomingCount = counts.INCOMING;

  // ---------- ERROR STATE ----------
  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <AppHeader
          navigation={navigation}
          onMenuPress={() => setSidebarOpen(true)}
        />
        <View style={styles.errorWrap}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.primary} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
        <Sidebar
          visible={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          navigation={navigation}
          onComingSoon={comingSoon}
          menu={OFFICER_MENU}
          variant="staff"
          activeKey="Blood Bank Exchange"
          hospital={myHospital || 'HemoGo'}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader
        navigation={navigation}
        onMenuPress={() => setSidebarOpen(true)}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.titleRow}>
          <Ionicons name="swap-horizontal-outline" size={22} color={colors.primary} />
          <Text style={styles.title}>Blood Bank Exchange</Text>
        </View>
        <Text style={styles.subtitle}>
          Request blood from another bank, or respond to incoming requests.
        </Text>

        {/* Your bank */}
        <View style={styles.myBankCard}>
          <View style={styles.myBankIcon}>
            <Ionicons name="business" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.myBankLabel}>YOUR BANK</Text>
            <Text style={styles.myBankName} numberOfLines={1}>
              {myHospital}
            </Text>
          </View>
        </View>

        {/* Primary CTA */}
        <TouchableOpacity
          style={styles.newRequestBtn}
          onPress={() => navigation.navigate('CreateExchangeRequest')}
        >
          <View style={styles.newRequestIcon}>
            <Ionicons name="add" size={22} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.newRequestTitle}>New Exchange Request</Text>
            <Text style={styles.newRequestSub}>
              Find a bank with the blood you need
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.white} />
        </TouchableOpacity>

        {/* Incoming alert */}
        {incomingCount > 0 ? (
          <View style={styles.alertBanner}>
            <Ionicons name="alert-circle" size={20} color="#D97706" />
            <Text style={styles.alertText}>
              {incomingCount} incoming request
              {incomingCount > 1 ? 's' : ''} need your approval
            </Text>
          </View>
        ) : null}

        {/* Section title — pending actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            PENDING ACTIONS ({transfers.length})
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('PendingTransfers')}
          >
            <Text style={styles.sectionLink}>View Full Log</Text>
          </TouchableOpacity>
        </View>

        {/* Direction filter */}
        <Text style={styles.filterLabel}>DIRECTION</Text>
        <View style={styles.filterRow}>
          {DIRECTION_FILTERS.map((f) => {
            const active = directionFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setDirectionFilter(f.key)}
              >
                <Text
                  style={[styles.filterText, active && styles.filterTextActive]}
                  numberOfLines={1}
                >
                  {f.label} ({counts[f.key] || 0})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Urgency filter */}
        <Text style={styles.filterLabel}>URGENCY</Text>
        <View style={styles.filterRow}>
          {URGENCY_FILTERS.map((f) => {
            const active = urgencyFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setUrgencyFilter(f.key)}
              >
                <Text
                  style={[styles.filterText, active && styles.filterTextActive]}
                  numberOfLines={1}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* List */}
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name="checkmark-circle-outline"
              size={44}
              color={colors.success}
            />
            <Text style={styles.emptyTitle}>
              {transfers.length === 0
                ? 'No pending actions'
                : 'No matches for filters'}
            </Text>
            <Text style={styles.emptySub}>
              {transfers.length === 0
                ? 'All transfers have been handled.'
                : 'Try changing the direction or urgency filter.'}
            </Text>
          </View>
        ) : (
          filtered.map((t) => {
            const direction = getDirection(t);
            const busy = busyId === t._id;
            const isIncoming = direction === 'INCOMING';
            const uColor = urgencyColor(t.urgency);

            return (
              <View key={t._id} style={styles.card}>
                {/* Top row */}
                <View style={styles.cardTop}>
                  <View
                    style={[
                      styles.directionPill,
                      isIncoming
                        ? styles.directionIncoming
                        : styles.directionOutgoing,
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
                  <View
                    style={[styles.urgencyPill, { backgroundColor: `${uColor}20` }]}
                  >
                    <Text style={[styles.urgencyText, { color: uColor }]}>
                      {t.urgency || 'MEDIUM'}
                    </Text>
                  </View>
                  <Text style={styles.timeText}>{timeAgo(t.createdAt)}</Text>
                </View>

                {/* Blood row */}
                <View style={styles.bloodRow}>
                  <View style={styles.bloodBadge}>
                    <Text style={styles.bloodBadgeText}>{t.bloodGroup}</Text>
                  </View>
                  <Text style={styles.unitsText}>
                    {t.units} unit{t.units > 1 ? 's' : ''}
                  </Text>
                </View>

                {/* Route */}
                <View style={styles.routeRow}>
                  <View style={styles.routeCol}>
                    <Text style={styles.routeLabel}>FROM</Text>
                    <Text style={styles.routeValue} numberOfLines={2}>
                      {t.sourceBank}
                    </Text>
                  </View>
                  <Ionicons
                    name="arrow-forward"
                    size={14}
                    color={colors.textMuted}
                  />
                  <View style={styles.routeCol}>
                    <Text style={styles.routeLabel}>TO</Text>
                    <Text style={styles.routeValue} numberOfLines={2}>
                      {t.destinationHospital}
                    </Text>
                  </View>
                </View>

                {t.reason ? (
                  <Text style={styles.reasonText} numberOfLines={2}>
                    {t.reason}
                  </Text>
                ) : null}

                {/* Actions */}
                <View style={styles.actionRow}>
                  {direction === 'INCOMING' && t.status === 'PENDING' && (
                    <>
                      <TouchableOpacity
                        style={[styles.primaryBtn, busy && styles.disabled]}
                        onPress={() => handleApprove(t)}
                        disabled={busy}
                      >
                        <Ionicons name="checkmark" size={15} color={colors.white} />
                        <Text style={styles.primaryBtnText}>
                          {busy ? '...' : 'Approve'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.outlineBtn, busy && styles.disabled]}
                        onPress={() => handleReject(t)}
                        disabled={busy}
                      >
                        <Text style={styles.outlineBtnText}>Reject</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {direction === 'OUTGOING' && t.status === 'PENDING' && (
                    <TouchableOpacity
                      style={[styles.outlineBtnWide, busy && styles.disabled]}
                      onPress={() => handleCancel(t)}
                      disabled={busy}
                    >
                      <Ionicons name="close" size={14} color={colors.primary} />
                      <Text style={styles.outlineBtnTextPrimary}>Cancel Request</Text>
                    </TouchableOpacity>
                  )}

                  {direction === 'OUTGOING' && t.status === 'APPROVED' && (
                    <TouchableOpacity
                      style={[styles.primaryBtn, busy && styles.disabled]}
                      onPress={() => handleMarkDelivered(t)}
                      disabled={busy}
                    >
                      <Ionicons name="paper-plane-outline" size={15} color={colors.white} />
                      <Text style={styles.primaryBtnText}>
                        {busy ? '...' : 'Mark Delivered'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {direction === 'INCOMING' && t.status === 'DELIVERED' && (
                    <TouchableOpacity
                      style={[styles.primaryBtn, busy && styles.disabled]}
                      onPress={() => handleConfirmReceived(t)}
                      disabled={busy}
                    >
                      <Ionicons name="checkmark-done" size={15} color={colors.white} />
                      <Text style={styles.primaryBtnText}>
                        {busy ? '...' : 'Confirm Received'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}

        {/* View Full Log button */}
        <TouchableOpacity
          style={styles.logBtn}
          onPress={() => navigation.navigate('PendingTransfers')}
        >
          <Ionicons name="list-outline" size={18} color={colors.text} />
          <Text style={styles.logText}>View Full Transfer Log</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.text} />
        </TouchableOpacity>
      </ScrollView>

      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        onComingSoon={comingSoon}
        menu={OFFICER_MENU}
        variant="staff"
        activeKey="Blood Bank Exchange"
        hospital={myHospital || 'HemoGo'}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
    marginBottom: 16,
  },

  myBankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 14,
  },
  myBankIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  myBankLabel: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  myBankName: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '800',
    marginTop: 2,
  },

  newRequestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  newRequestIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newRequestTitle: { color: colors.white, fontWeight: '800', fontSize: 15 },
  newRequestSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    marginTop: 2,
  },

  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 16,
  },
  alertText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    fontWeight: '700',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  sectionLink: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },

  filterLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 6,
  },

  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  filterTextActive: { color: colors.white },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 12,
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
  directionIncoming: { backgroundColor: '#F3E8FF' },
  directionOutgoing: { backgroundColor: '#DBEAFE' },
  directionText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  urgencyPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  urgencyText: { fontSize: 9, fontWeight: '800' },
  timeText: { flex: 1, textAlign: 'right', fontSize: 10, color: colors.textMuted },

  bloodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  bloodBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primarySoft,
    borderRadius: 10,
  },
  bloodBadgeText: { fontSize: 14, fontWeight: '900', color: colors.primary },
  unitsText: { fontSize: 14, fontWeight: '800', color: colors.text },

  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  routeCol: { flex: 1 },
  routeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  routeValue: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '700',
    marginTop: 2,
    lineHeight: 16,
  },

  reasonText: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 10,
    fontStyle: 'italic',
  },

  actionRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
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
  primaryBtnText: { color: colors.white, fontWeight: '800', fontSize: 13 },
  outlineBtn: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: { color: colors.text, fontWeight: '800', fontSize: 13 },
  outlineBtnWide: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: colors.primary,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnTextPrimary: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 13,
  },
  disabled: { opacity: 0.5 },

  logBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  logText: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.text },

  empty: {
    alignItems: 'center',
    paddingVertical: 50,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginTop: 6,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  errorText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: colors.primary,
  },
  retryText: { color: colors.white, fontWeight: '800' },
});

export default BloodRescueScreen;
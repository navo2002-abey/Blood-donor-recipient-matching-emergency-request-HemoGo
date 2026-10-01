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
import Sidebar from '../../components/Sidebar';
import { useAlerts } from '../../context/AlertsContext';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';
import { transferService } from '../../services/officerService';
import { colors } from '../../utils/colors';
import { OFFICER_MENU } from '../../utils/roles';

const FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'COMPLETED', label: 'Done' },
];

const statusTheme = (status) => {
  switch (status) {
    case 'PENDING':
      return { color: '#D97706', bg: '#FFFBEB', label: 'PENDING' };
    case 'APPROVED':
      return { color: '#2563EB', bg: '#EFF6FF', label: 'APPROVED' };
    case 'COMPLETED':
      return { color: '#059669', bg: '#ECFDF5', label: 'COMPLETED' };
    case 'CANCELLED':
    case 'REJECTED':
      return { color: '#DC2626', bg: '#FEE2E2', label: 'CANCELLED' };
    default:
      return { color: colors.textSecondary, bg: '#F3F4F6', label: status };
  }
};

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

const BloodRescueScreen = ({ navigation }) => {
  const confirm = useConfirm();
  const { unreadCount } = useAlerts();
  const { user } = useAuth();

  // ✅ STRICT: use user.hospital directly — no fallback
  const myHospital = user?.hospital;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!myHospital) {
      setError('No hospital assigned to your account. Please contact admin.');
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      setError(null);
      const { data } = await transferService.list({ hospital: myHospital });
      setTransfers(data.transfers || []);
    } catch (e) {
      console.error('Load transfers error:', e?.response?.data || e.message);
      setError(e?.response?.data?.message || 'Failed to load exchange requests.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [myHospital]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation, load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  // Direction based on hospital names (more reliable than requestedBy)
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
      Alert.alert('Approved', 'Blood transferred. Stock updated on both sides.');
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to approve.');
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (t) => {
    const ok = await confirm({
      title: 'Cancel Request',
      message: `Cancel exchange request for ${t.bloodGroup}?`,
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

  const filtered = useMemo(() => {
    if (filter === 'ALL') return transfers;
    return transfers.filter((t) => t.status === filter);
  }, [filter, transfers]);

  const counts = useMemo(
    () => ({
      ALL: transfers.length,
      PENDING: transfers.filter((t) => t.status === 'PENDING').length,
      APPROVED: transfers.filter((t) => t.status === 'APPROVED').length,
      COMPLETED: transfers.filter((t) => t.status === 'COMPLETED').length,
    }),
    [transfers]
  );

  const incomingPending = transfers.filter(
    (t) => getDirection(t) === 'INCOMING' && t.status === 'PENDING'
  ).length;

  // ---------- ERROR STATE ----------
  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            hitSlop={10}
            style={styles.headerBtn}
            onPress={() => setSidebarOpen(true)}
          >
            <Ionicons name="menu-outline" size={26} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.brand}>
            <BloodDrop size={16} />
            <Text style={styles.brandText}>HemoGo</Text>
          </View>
          <View style={styles.headerBtn} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.primary} />
          <Text
            style={{
              fontSize: 16,
              fontWeight: '800',
              color: colors.text,
              marginTop: 16,
              textAlign: 'center',
            }}
          >
            {error}
          </Text>
          <TouchableOpacity
            style={{
              marginTop: 20,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 20,
              backgroundColor: colors.primary,
            }}
            onPress={load}
          >
            <Text style={{ color: colors.white, fontWeight: '800' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          hitSlop={10}
          style={styles.headerBtn}
          onPress={() => setSidebarOpen(true)}
        >
          <Ionicons name="menu-outline" size={26} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.brand}>
          <BloodDrop size={16} />
          <Text style={styles.brandText}>HemoGo</Text>
        </View>
        <TouchableOpacity
          hitSlop={10}
          style={styles.headerBtn}
          onPress={() => navigation.navigate('Alerts')}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
          {unreadCount > 0 ? <View style={styles.bellBadge} /> : null}
        </TouchableOpacity>
      </View>

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
          Request blood from other banks, or respond to incoming requests.
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

        {/* Alert if incoming pending */}
        {incomingPending > 0 ? (
          <View style={styles.alertBanner}>
            <Ionicons name="alert-circle" size={20} color="#D97706" />
            <Text style={styles.alertText}>
              {incomingPending} incoming request
              {incomingPending > 1 ? 's' : ''} need your approval
            </Text>
          </View>
        ) : null}

        {/* Filter chips */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setFilter(f.key)}
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

        {/* List */}
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name="swap-horizontal-outline"
              size={44}
              color={colors.textMuted}
            />
            <Text style={styles.emptyTitle}>
              {filter === 'ALL'
                ? 'No exchange requests yet'
                : `No ${filter.toLowerCase()} requests`}
            </Text>
            <Text style={styles.emptySub}>
              {filter === 'ALL'
                ? 'Tap "New Exchange Request" to request blood from another bank.'
                : 'Try switching the filter.'}
            </Text>
          </View>
        ) : (
          filtered.map((t) => {
            const direction = getDirection(t);
            const theme = statusTheme(t.status);
            const busy = busyId === t._id;
            const isIncoming = direction === 'INCOMING';
            const canApprove = isIncoming && t.status === 'PENDING';
            const canCancel = !isIncoming && t.status === 'PENDING';

            return (
              <View key={t._id} style={styles.card}>
                {/* Direction + status */}
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
                      size={12}
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
                  <Text style={styles.timeText}>{timeAgo(t.createdAt)}</Text>
                </View>

                {/* Blood + units */}
                <View style={styles.bloodRow}>
                  <View style={styles.bloodBadge}>
                    <Text style={styles.bloodBadgeText}>{t.bloodGroup}</Text>
                  </View>
                  <Text style={styles.unitsText}>
                    {t.units} unit{t.units > 1 ? 's' : ''}
                  </Text>
                  <View style={{ flex: 1 }} />
                  {t.urgency ? (
                    <View style={styles.urgencyPill}>
                      <Text style={styles.urgencyText}>{t.urgency}</Text>
                    </View>
                  ) : null}
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
                    size={16}
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
                {canApprove || canCancel ? (
                  <View style={styles.actionRow}>
                    {canApprove ? (
                      <>
                        <TouchableOpacity
                          style={[styles.primaryBtn, busy && styles.disabled]}
                          onPress={() => handleApprove(t)}
                          disabled={busy}
                        >
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color={colors.white}
                          />
                          <Text style={styles.primaryBtnText}>
                            {busy ? '...' : 'Approve'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.outlineBtn, busy && styles.disabled]}
                          onPress={() => handleCancel(t)}
                          disabled={busy}
                        >
                          <Text style={styles.outlineBtnText}>Reject</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity
                        style={[styles.outlineBtnWide, busy && styles.disabled]}
                        onPress={() => handleCancel(t)}
                        disabled={busy}
                      >
                        <Ionicons name="close" size={14} color={colors.primary} />
                        <Text style={styles.outlineBtnTextPrimary}>
                          Cancel Request
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : null}
              </View>
            );
          })
        )}

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
        activeKey="Smart Blood Rescue"
        hospital={myHospital || 'HemoGo'}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandText: { color: colors.primary, fontSize: 18, fontWeight: '800' },
  bellBadge: {
    position: 'absolute',
    top: 6,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
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
    marginBottom: 16,
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
    marginBottom: 14,
  },
  alertText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    fontWeight: '700',
  },

  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    flex: 1,
    paddingVertical: 9,
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
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
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
  urgencyPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  urgencyText: { fontSize: 9, fontWeight: '800', color: colors.textSecondary },

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
    padding: 18,
    borderRadius: 12,
    marginTop: 8,
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
});

export default BloodRescueScreen;
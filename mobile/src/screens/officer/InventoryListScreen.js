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
import AppHeader from '../../components/AppHeader';
import Sidebar from '../../components/Sidebar';
import { useConfirm } from '../../context/ConfirmContext';
import { useMyHospital } from '../../hooks/useMyHospital';
import { reservationService, stockService } from '../../services/officerService';
import { colors } from '../../utils/colors';
import { OFFICER_MENU } from '../../utils/roles';

const comingSoon = (label) =>
  Alert.alert('Coming Soon', `${label} will be available soon.`);

const daysLeft = (date) => {
  const diff = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const stockStatusTheme = (status, expiryDate) => {
  const days = daysLeft(expiryDate);
  if (status === 'EXPIRED' || days <= 0) return { bg: '#FEE2E2', text: '#DC2626' };
  if (status === 'RESERVED') return { bg: '#EFF6FF', text: '#2563EB' };
  if (status === 'USED' || status === 'TRANSFERRED')
    return { bg: '#F3F4F6', text: '#6B7280' };
  if (days <= 5) return { bg: '#FEE2E2', text: '#DC2626' };
  if (days <= 14) return { bg: '#FFFAF0', text: '#D97706' };
  return { bg: '#ECFDF5', text: '#059669' };
};

const reservationStatusColor = (status) => {
  if (status === 'RESERVED') return '#F59E0B';
  if (status === 'RELEASED') return colors.success;
  if (status === 'USED') return '#3B82F6';
  if (status === 'EXPIRED') return colors.primary;
  return colors.textSecondary;
};

const reservationStatusBg = (status) => {
  if (status === 'RESERVED') return '#FFFBEB';
  if (status === 'RELEASED') return '#ECFDF5';
  if (status === 'USED') return '#EFF6FF';
  if (status === 'EXPIRED') return '#FFF1F3';
  return '#F4F4F6';
};

const InventoryListScreen = ({ navigation, route }) => {
  const confirm = useConfirm();
  const HOSPITAL = useMyHospital();

  // Support opening directly on Reserved tab via route param
  const initialTab = route?.params?.initialTab || 'available';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stock, setStock] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const [stockRes, resRes] = await Promise.all([
        stockService.list({ hospital: HOSPITAL }),
        reservationService.list({ hospital: HOSPITAL, includeTransfers: true }),
      ]);

      // ✅ Available tab: only AVAILABLE batches with units > 0
      const availableOnly = (stockRes.data.stock || []).filter(
        (s) => s.status === 'AVAILABLE' && Number(s.units) > 0
      );

      const sorted = availableOnly.sort((a, b) => {
        if (a.bloodGroup !== b.bloodGroup)
          return a.bloodGroup.localeCompare(b.bloodGroup);
        return new Date(a.expiryDate) - new Date(b.expiryDate);
      });

      setStock(sorted);

      // ✅ Reserved tab:
      // - Manual reservations: show all (history)
      // - Transfer reservations: only show active (RESERVED) ones
      const allReservations = resRes.data.reservations || [];
      const visible = allReservations.filter((r) => {
        if (!r.isTransfer) return true;
        return r.status === 'RESERVED';
      });
      setReservations(visible);
    } catch (e) {
      Alert.alert('Error', 'Failed to load inventory.');
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

  // If a new initialTab param is passed while already on this screen
  useEffect(() => {
    if (route?.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  }, [route?.params?.initialTab]);

  // ---------- STOCK ACTIONS ----------
  const goEditStock = (item) => {
    navigation.navigate('EditStock', { id: item._id });
  };

  // ---------- RESERVATION ACTIONS ----------
  const handleRelease = async (item) => {
    const ok = await confirm({
      title: 'Release Unit',
      message: `Return unit ${item.unitId} (${item.units || 1} unit${
        (item.units || 1) > 1 ? 's' : ''
      }) to available stock?`,
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

  const handleDeleteReservation = async (item) => {
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

  // ---------- AVAILABLE STOCK TABLE ----------
  const renderAvailable = () => (
    <>
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.tableHeader, { flex: 1.2 }]}>Type</Text>
        <Text style={[styles.tableHeader, { flex: 1.4 }]}>Units</Text>
        <Text style={[styles.tableHeader, { flex: 2.6 }]}>Expiry Date</Text>
        <Text style={[styles.tableHeader, { flex: 1.6 }]}>Status</Text>
        <Text style={[styles.tableHeader, { flex: 1.4 }]}>Actions</Text>
      </View>

      {stock.map((item, index) => {
        const days = daysLeft(item.expiryDate);
        const theme = stockStatusTheme(item.status, item.expiryDate);
        return (
          <View
            key={item._id}
            style={[styles.tableRow, index % 2 !== 0 && styles.tableRowAlt]}
          >
            <Text style={[styles.tableCell, styles.boldRedText, { flex: 1.2 }]}>
              {item.bloodGroup}
            </Text>
            <Text style={[styles.tableCell, styles.boldText, { flex: 1.4 }]}>
              {item.units}
            </Text>
            <View style={{ flex: 2.6, alignItems: 'center' }}>
              <Text style={[styles.tableCell, { paddingVertical: 0 }]}>
                {new Date(item.expiryDate).toLocaleDateString()}
              </Text>
              <Text style={styles.expirySubtext}>
                {days} day{days === 1 ? '' : 's'} left
              </Text>
            </View>
            <View style={{ flex: 1.6, alignItems: 'center' }}>
              <View style={[styles.statusPill, { backgroundColor: theme.bg }]}>
                <Text style={[styles.statusPillText, { color: theme.text }]}>
                  {item.status}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={{ flex: 1.4, alignItems: 'center' }}
              onPress={() => goEditStock(item)}
            >
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
        );
      })}

      {stock.length === 0 && (
        <View style={styles.emptyRow}>
          <Text style={styles.emptyText}>No available stock.</Text>
        </View>
      )}
    </>
  );

  // ---------- RESERVED UNITS CARDS ----------
  const renderReserved = () => {
    if (reservations.length === 0) {
      return (
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
      );
    }

    return reservations.map((item) => {
      const isReserved = item.status === 'RESERVED';
      const busy = busyId === item._id;
      const reservedUnits = item.units || 1;
      const isTransfer = item.isTransfer === true;

      return (
        <View key={item._id} style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.unitBadge}>
              <Text style={styles.unitId}>{item.unitId}</Text>
            </View>
            <View style={styles.bloodBadge}>
              <Text style={styles.bloodText}>
                {item.bloodGroup} × {reservedUnits}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.patient} numberOfLines={1}>
                {item.patientName}
              </Text>
              <Text style={styles.ward} numberOfLines={1}>
                {item.ward}
              </Text>
            </View>
            <View
              style={[
                styles.statusPill,
                { backgroundColor: reservationStatusBg(item.status) },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: reservationStatusColor(item.status) },
                ]}
              >
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

          {/* ✅ Transfer reservations — no manual actions */}
          {isTransfer ? (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[
                  styles.transferHintBox,
                  item.transferRole === 'SOURCE'
                    ? { backgroundColor: '#FEF3C7' }
                    : { backgroundColor: '#F3E8FF' },
                ]}
                onPress={() => navigation.navigate('PendingTransfers')}
              >
                <Ionicons
                  name={
                    item.transferRole === 'SOURCE'
                      ? 'arrow-up-circle'
                      : 'arrow-down-circle'
                  }
                  size={14}
                  color={item.transferRole === 'SOURCE' ? '#D97706' : '#7C3AED'}
                />
                <Text
                  style={[
                    styles.transferHintText,
                    {
                      color: item.transferRole === 'SOURCE' ? '#D97706' : '#7C3AED',
                    },
                  ]}
                >
                  {item.transferRole === 'SOURCE'
                    ? 'Outgoing transfer — mark delivered in Log'
                    : 'Incoming transfer — confirm receipt in Log'}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={item.transferRole === 'SOURCE' ? '#D97706' : '#7C3AED'}
                />
              </TouchableOpacity>
            </View>
          ) : isReserved ? (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, busy && styles.actionDisabled]}
                onPress={() => handleRelease(item)}
                disabled={busy}
              >
                <Text style={styles.actionText}>{busy ? '...' : 'Release'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  styles.actionPrimary,
                  busy && styles.actionDisabled,
                ]}
                onPress={() => handleMarkUsed(item)}
                disabled={busy}
              >
                <Text style={styles.actionPrimaryText}>
                  {busy ? '...' : 'Mark Used'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconBtn, busy && styles.actionDisabled]}
                onPress={() => handleDeleteReservation(item)}
                disabled={busy}
              >
                <Ionicons name="trash-outline" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.iconBtn, busy && styles.actionDisabled]}
                onPress={() => handleDeleteReservation(item)}
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
    });
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
            onRefresh={() => { setRefreshing(true); load(); }}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Hospital Blood Stock</Text>
        <Text style={styles.pageSubtitle}>Real-time inventory at {HOSPITAL}</Text>

        <View style={styles.dropdown}>
          <Ionicons name="business" size={16} color={colors.textMuted} />
          <Text style={styles.dropdownText} numberOfLines={1}>{HOSPITAL}</Text>
          <Ionicons name="caret-down" size={14} color={colors.textMuted} />
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'available' && styles.activeTab]}
            onPress={() => setActiveTab('available')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'available' && styles.activeTabText,
              ]}
            >
              Available ({stock.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reserved' && styles.activeTab]}
            onPress={() => setActiveTab('reserved')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'reserved' && styles.activeTabText,
              ]}
            >
              Reserved ({reservations.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: 40 }}
          />
        ) : activeTab === 'available' ? (
          <View style={styles.tableContainer}>{renderAvailable()}</View>
        ) : (
          <View style={styles.cardList}>{renderReserved()}</View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() =>
            activeTab === 'available'
              ? navigation.navigate('AddStock')
              : navigation.navigate('CreateReservation')
          }
        >
          <Ionicons
            name="add"
            size={16}
            color={colors.white}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.primaryButtonText}>
            {activeTab === 'available'
              ? 'ADD NEW STOCK'
              : 'CREATE NEW RESERVATION'}
          </Text>
        </TouchableOpacity>
      </View>

      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        onComingSoon={comingSoon}
        menu={OFFICER_MENU}
        variant="staff"
        activeKey="Inventory List"
        hospital={HOSPITAL}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { paddingHorizontal: 20, paddingBottom: 120 },

  pageTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 6 },
  pageSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 20,
  },

  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  dropdownText: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF1F3',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: colors.primary },
  tabText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  activeTabText: { color: colors.white },

  /* Available table */
  tableContainer: {
    borderWidth: 1,
    borderColor: '#FEF2F2',
    borderRadius: 16,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#FFF1F3',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#FEE2E2',
  },
  tableHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  tableRowAlt: { backgroundColor: '#FAFAFA' },
  tableCell: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  boldText: { fontWeight: '700', color: colors.text },
  boldRedText: { fontWeight: '800', color: colors.primary },
  editLink: { fontSize: 12, fontWeight: '700', color: colors.primary },
  expirySubtext: { fontSize: 9, color: colors.textMuted, marginTop: 2 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusPillText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.2 },
  emptyRow: { padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 12, color: colors.textSecondary },

  /* Reserved cards */
  cardList: { gap: 12 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  unitBadge: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: colors.inputBg,
    borderRadius: 8,
  },
  unitId: { fontSize: 11, fontWeight: '800', color: colors.text },
  bloodBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.primarySoft,
    borderRadius: 8,
  },
  bloodText: { fontSize: 12, fontWeight: '800', color: colors.primary },
  patient: { fontSize: 14, fontWeight: '800', color: colors.text },
  ward: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  statusText: { fontSize: 10, fontWeight: '800' },

  transferBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#F3E8FF',
  },
  transferBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#7C3AED',
    letterSpacing: 0.3,
  },

  infoList: { gap: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 11, color: colors.textSecondary, flex: 1 },
  infoLabel: { color: colors.textMuted, fontWeight: '600' },
  infoValue: { color: colors.text, fontWeight: '700' },

  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' },
  actionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  actionText: { fontSize: 12, fontWeight: '800', color: colors.primary },
  actionPrimaryText: { fontSize: 12, fontWeight: '800', color: colors.white },
  actionDisabled: { opacity: 0.5 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintText: {
    flex: 1,
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },

  transferHintBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3E8FF',
    padding: 10,
    borderRadius: 8,
  },
  transferHintText: {
    flex: 1,
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '700',
  },

  /* Empty */
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: colors.primary,
  },
  emptyBtnText: { color: colors.white, fontWeight: '800', fontSize: 13 },

  bottomContainer: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

export default InventoryListScreen;
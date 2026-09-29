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
import { useConfirm } from '../../context/ConfirmContext';
import { reservationService, stockService } from '../../services/officerService';
import { colors } from '../../utils/colors';

const HOSPITAL = 'Colombo General Hospital Blood Bank';

const InventoryListScreen = ({ navigation }) => {
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState('available');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stock, setStock] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const [stockRes, resRes] = await Promise.all([
        stockService.list({ hospital: HOSPITAL }),
        reservationService.list({ hospital: HOSPITAL }),
      ]);
      setStock(stockRes.data.stock || []);
      setReservations(resRes.data.reservations || []);
    } catch (e) {
      Alert.alert('Error', 'Failed to load inventory.');
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

  const groupedStock = () => {
    const map = {};
    stock.forEach((s) => {
      if (!map[s.bloodGroup]) {
        map[s.bloodGroup] = { type: s.bloodGroup, available: 0, reserved: 0, expiry: s.expiryDate };
      }
      map[s.bloodGroup].available += s.units;
      // pick earliest expiry
      if (new Date(s.expiryDate) < new Date(map[s.bloodGroup].expiry)) {
        map[s.bloodGroup].expiry = s.expiryDate;
      }
    });
    return Object.values(map).sort((a, b) => a.type.localeCompare(b.type));
  };

  const handleRelease = async (item) => {
    const ok = await confirm({
      title: 'Release Unit',
      message: `Return unit ${item.unitId} to available stock?`,
      confirmText: 'Release',
    });
    if (!ok) return;
    try {
      setBusyId(item._id);
      await reservationService.update(item._id, { status: 'RELEASED' });
      await load();
    } catch (e) {
      Alert.alert('Error', 'Failed to release.');
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
    } catch (e) {
      Alert.alert('Error', 'Failed to update.');
    } finally {
      setBusyId(null);
    }
  };

  const renderAvailable = () => (
    <>
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.tableHeader, { flex: 1.2 }]}>Type</Text>
        <Text style={[styles.tableHeader, { flex: 1.8 }]}>Available</Text>
        <Text style={[styles.tableHeader, { flex: 1.8 }]}>Reserved</Text>
        <Text style={[styles.tableHeader, { flex: 2.4 }]}>Expiry Date</Text>
        <Text style={[styles.tableHeader, { flex: 1.4 }]}>Actions</Text>
      </View>

      {groupedStock().map((item, index) => (
        <View
          key={item.type}
          style={[styles.tableRow, index % 2 !== 0 && styles.tableRowAlt]}
        >
          <Text style={[styles.tableCell, styles.boldRedText, { flex: 1.2 }]}>{item.type}</Text>
          <Text style={[styles.tableCell, styles.boldText, { flex: 1.8 }]}>{item.available}</Text>
          <Text style={[styles.tableCell, styles.boldText, { flex: 1.8 }]}>{item.reserved}</Text>
          <Text style={[styles.tableCell, { flex: 2.4 }]}>
            {new Date(item.expiry).toLocaleDateString()}
          </Text>
          <TouchableOpacity
            style={{ flex: 1.4, alignItems: 'center' }}
            onPress={() => navigation.navigate('AddStock')}
          >
            <Text style={styles.editLink}>Add</Text>
          </TouchableOpacity>
        </View>
      ))}
    </>
  );

  const renderReserved = () => (
    <>
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.tableHeader, { flex: 2 }]}>Unit ID</Text>
        <Text style={[styles.tableHeader, { flex: 1.2 }]}>Blood</Text>
        <Text style={[styles.tableHeader, { flex: 2.8 }]}>Reserved For</Text>
        <Text style={[styles.tableHeader, { flex: 2.2 }]}>Actions</Text>
      </View>

      {reservations.map((item, index) => {
        const busy = busyId === item._id;
        const isReserved = item.status === 'RESERVED';
        return (
          <View
            key={item._id}
            style={[styles.tableRow, index % 2 !== 0 && styles.tableRowAlt]}
          >
            <Text style={[styles.tableCell, styles.boldText, { flex: 2 }]}>
              {item.unitId}
            </Text>
            <Text style={[styles.tableCell, styles.boldRedText, { flex: 1.2 }]}>
              {item.bloodGroup}
            </Text>
            <View style={{ flex: 2.8, alignItems: 'center' }}>
              <Text style={[styles.tableCell, { paddingVertical: 0 }]} numberOfLines={1}>
                {item.reservedFor || item.ward}
              </Text>
              <Text style={styles.expirySubtext}>
                {item.status}
              </Text>
            </View>
            <View style={{ flex: 2.2, alignItems: 'center' }}>
              {isReserved ? (
                <TouchableOpacity
                  style={[styles.actionBtn, busy && { opacity: 0.5 }]}
                  onPress={() => handleRelease(item)}
                  disabled={busy}
                >
                  <Text style={styles.actionBtnText}>Release</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.expirySubtext}>—</Text>
              )}
            </View>
          </View>
        );
      })}
    </>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.brand}>
          <BloodDrop size={18} />
          <Text style={styles.brandText}>HemoGo</Text>
        </View>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.navigate('AddStock')}
        >
          <Ionicons name="add" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

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

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'available' && styles.activeTab]}
            onPress={() => setActiveTab('available')}
          >
            <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
              Available Stock
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reserved' && styles.activeTab]}
            onPress={() => setActiveTab('reserved')}
          >
            <Text style={[styles.tabText, activeTab === 'reserved' && styles.activeTabText]}>
              Reserved Units
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tableContainer}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : activeTab === 'available' ? (
            renderAvailable()
          ) : (
            renderReserved()
          )}
        </View>

        {activeTab === 'reserved' && (
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('CreateReservation')}
          >
            <Text style={styles.secondaryBtnText}>+ CREATE NEW RESERVATION</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() =>
            activeTab === 'available'
              ? navigation.navigate('AddStock')
              : navigation.navigate('CreateReservation')
          }
        >
          <Text style={styles.primaryButtonText}>
            {activeTab === 'available' ? '+ ADD NEW STOCK' : '+ CREATE NEW RESERVATION'}
          </Text>
        </TouchableOpacity>
      </View>
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
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandText: { color: colors.primary, fontSize: 18, fontWeight: '800' },
  scroll: { paddingHorizontal: 20, paddingBottom: 120 },
  pageTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 10 },
  pageSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 4, marginBottom: 20 },
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
    marginBottom: 20,
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
  tabText: { fontSize: 14, fontWeight: '700', color: colors.primary },
  activeTabText: { color: colors.white },
  tableContainer: { borderWidth: 1, borderColor: '#FEF2F2', borderRadius: 16, overflow: 'hidden' },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#FFF1F3',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#FEE2E2',
  },
  tableHeader: { fontSize: 12, fontWeight: '800', color: colors.text, textAlign: 'center' },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  tableRowAlt: { backgroundColor: '#FAFAFA' },
  tableCell: { fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
  boldText: { fontWeight: '700', color: colors.text },
  boldRedText: { fontWeight: '800', color: colors.primary },
  editLink: { fontSize: 12, fontWeight: '700', color: colors.primary },
  expirySubtext: { fontSize: 9, color: colors.textMuted, marginTop: 2 },
  actionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionBtnText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  secondaryBtn: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 14,
  },
  secondaryBtnText: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  bottomContainer: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: { color: colors.white, fontSize: 14, fontWeight: '800' },
});

export default InventoryListScreen;
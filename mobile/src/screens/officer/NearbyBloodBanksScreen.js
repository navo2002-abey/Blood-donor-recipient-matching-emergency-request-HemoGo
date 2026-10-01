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
import BloodBanksMap from '../../components/BloodBanksMap';
import { BloodDrop } from '../../components/Logo';
import Sidebar from '../../components/Sidebar';
import { useAlerts } from '../../context/AlertsContext';
import { useUserLocation } from '../../hooks/useUserLocation';
import { useMyHospital } from '../../hooks/useMyHospital';
import { bloodBankService } from '../../services/officerService';
import { colors } from '../../utils/colors';
import { OFFICER_MENU } from '../../utils/roles';
import { normalizeStock, totalUnits } from '../../utils/stockHelpers';

const GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

const comingSoon = (label) =>
  Alert.alert('Coming Soon', `${label} will be available soon.`);

const pseudoDistance = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const km = (Math.abs(hash) % 80) / 10 + 0.8;
  return km.toFixed(1);
};

const NearbyBloodBanksScreen = ({ navigation }) => {
  const { unreadCount } = useAlerts();
  const myHospital = useMyHospital();
  const { location } = useUserLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await bloodBankService.list();
      const others = (data.bloodBanks || [])
        .filter((b) => b.name !== myHospital)
        .map((b) => ({ ...b, stock: normalizeStock(b.stock) }));
      setBanks(others);
    } catch (e) {
      console.error('Load banks error:', e?.response?.data || e.message);
      Alert.alert('Error', 'Failed to load blood banks.');
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

  // For the map, include your bank too
  const mapBanks = useMemo(() => {
    return banks.map((b) => ({
      name: b.name,
      location: b.location || {},
    }));
  }, [banks]);

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
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
          />
        }
      >
        <Text style={styles.pageTitle}>Nearby Blood Banks Stock</Text>
        <Text style={styles.pageSubtitle}>
          Find blood stock availability at nearby hospitals and blood banks.
        </Text>

        {/* Your bank banner */}
        <View style={styles.myBankBanner}>
          <View style={styles.myBankIcon}>
            <Ionicons name="business" size={16} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.myBankLabel}>YOUR BANK</Text>
            <Text style={styles.myBankName} numberOfLines={1}>
              {myHospital}
            </Text>
          </View>
        </View>

        {/* REAL MAP */}
        <View style={styles.mapContainer}>
          {loading ? (
            <View style={styles.mapLoading}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <BloodBanksMap location={location} banks={mapBanks} interactive />
          )}
          <TouchableOpacity
            style={styles.distancePill}
            onPress={() => comingSoon('Change distance')}
          >
            <Text style={styles.distancePillText}>{banks.length} banks</Text>
            <Ionicons name="caret-down" size={14} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Bank list */}
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} />
        ) : banks.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="business-outline" size={44} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No other blood banks found</Text>
            <Text style={styles.emptySub}>
              Only your bank is registered in the system.
            </Text>
          </View>
        ) : (
          banks.map((bank) => {
            const stock = bank.stock || {};
            const total = totalUnits(stock);
            return (
              <TouchableOpacity
                key={bank._id}
                style={styles.card}
                onPress={() =>
                  navigation.navigate('BloodBankDetails', { id: bank._id })
                }
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardIconBox}>
                    <Ionicons name="business" size={14} color={colors.textSecondary} />
                  </View>
                  <View style={styles.cardTitleWrap}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {bank.name}
                    </Text>
                    <View style={styles.cardSubRow}>
                      <Ionicons name="location" size={10} color={colors.primary} />
                      <Text style={styles.cardSub}>
                        {' '}
                        {pseudoDistance(bank.name)} km
                        {bank.address ? ` · ${bank.address.split(',')[0]}` : ''}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.stockGrid}>
                  {GROUPS.map((g) => {
                    const count = stock[g] || 0;
                    return (
                      <View key={g} style={styles.stockCell}>
                        <Text style={styles.stockType}>{g}</Text>
                        <Text
                          style={[
                            styles.stockCount,
                            count === 0 && { color: colors.textMuted },
                          ]}
                        >
                          {count}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.totalText}>
                    {total} total unit{total === 1 ? '' : 's'}
                  </Text>
                  {total > 0 ? (
                    <View style={styles.availablePill}>
                      <Text style={styles.availableText}>Available</Text>
                    </View>
                  ) : (
                    <View style={styles.emptyPill}>
                      <Text style={styles.emptyPillText}>Empty</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        onComingSoon={comingSoon}
        menu={OFFICER_MENU}
        variant="staff"
        activeKey="Nearby Blood Banks"
        hospital={myHospital}
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
  pageTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 10 },
  pageSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },

  myBankBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 14,
  },
  myBankIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myBankLabel: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  myBankName: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '800',
    marginTop: 2,
  },

  mapContainer: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#E8EEF3',
  },
  mapLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  distancePill: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  distancePillText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    marginRight: 4,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFF1F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitleWrap: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
  cardSubRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  cardSub: { fontSize: 10, color: colors.textSecondary, fontWeight: '600' },
  cardDivider: { height: 1, backgroundColor: '#FEE2E2', marginBottom: 12 },
  stockGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  stockCell: { alignItems: 'center', flex: 1 },
  stockType: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
  },
  stockCount: { fontSize: 13, fontWeight: '800', color: colors.text },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  totalText: { fontSize: 11, color: colors.textSecondary, fontWeight: '700' },
  availablePill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  availableText: { fontSize: 10, fontWeight: '800', color: colors.success },
  emptyPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  emptyPillText: { fontSize: 10, fontWeight: '800', color: colors.textMuted },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    gap: 6,
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 6 },
  emptySub: { fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
});

export default NearbyBloodBanksScreen;
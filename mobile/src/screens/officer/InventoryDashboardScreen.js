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
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { reservationService, stockService } from '../../services/officerService';
import { colors } from '../../utils/colors';
import { OFFICER_MENU } from '../../utils/roles';

const HOSPITAL = 'Colombo General Hospital Blood Bank';

const statusColor = (status) => {
  if (status === 'CRITICAL' || status === 'EXPIRED') return colors.primary;
  if (status === 'LOW') return '#F59E0B';
  if (status === 'AVAILABLE' || status === 'Good') return colors.success;
  return colors.textSecondary;
};

const InventoryDashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stock, setStock] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const rawName = user?.name || 'Nimal Perera';
  const name = /^dr\.?\s/i.test(rawName) ? rawName : `Dr. ${rawName}`;
  const initials = name
    .replace(/^Dr\.?\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  const load = useCallback(async () => {
    try {
      const [stockRes, resRes] = await Promise.all([
        stockService.list({ hospital: HOSPITAL }),
        reservationService.list({ hospital: HOSPITAL, status: 'RESERVED' }),
      ]);
      setStock(stockRes.data.stock || []);
      setReservations(resRes.data.reservations || []);
    } catch (error) {
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

  const onRefresh = () => { setRefreshing(true); load(); };

  const totalUnits = stock.reduce((sum, item) => sum + item.units, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.headerBtn}>
          <Ionicons name="menu-outline" size={26} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.brand}>
          <BloodDrop size={16} />
          <Text style={styles.brandText}>HemoGo</Text>
        </View>
        <View style={styles.headerBtn}>
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
          <View style={styles.bellBadge} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcome}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || 'NP'}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.welcomeLabel}>Welcome back,</Text>
            <Text style={styles.welcomeName}>{name}</Text>
            <Text style={styles.hospital}>{HOSPITAL}</Text>
            <View style={styles.statusRow}>
              <View style={styles.greenDot} />
              <Text style={styles.statusText}>On duty · Blood Bank Officer</Text>
            </View>
          </View>
        </View>

        <View style={styles.statGrid}>
          <View style={styles.statCard}>
            <Ionicons name="water-outline" size={16} color={colors.primary} />
            <Text style={styles.statValue}>{totalUnits}</Text>
            <Text style={styles.statLabel}>Total Units</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="list-outline" size={16} color={colors.primary} />
            <Text style={styles.statValue}>{stock.length}</Text>
            <Text style={styles.statLabel}>Blood Types</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="bookmark-outline" size={16} color={colors.primary} />
            <Text style={styles.statValue}>{reservations.length}</Text>
            <Text style={styles.statLabel}>Reserved</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={16} color={colors.primary} />
            <Text style={styles.statValue}>{stock.filter(s => s.status === 'AVAILABLE').length}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddStock')}
        >
          <Ionicons name="add-circle" size={20} color={colors.white} />
          <Text style={styles.addBtnText}>Add New Stock</Text>
        </TouchableOpacity>

        <View style={styles.quickRow}>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => navigation.navigate('ExpiryMonitoring')}
          >
            <Ionicons name="hourglass-outline" size={18} color={colors.primary} />
            <Text style={styles.quickText}>Expiry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => navigation.navigate('ReservedUnits')}
          >
            <Ionicons name="bookmark-outline" size={18} color={colors.primary} />
            <Text style={styles.quickText}>Reserved</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => navigation.navigate('AIPrediction')}
          >
            <Ionicons name="pulse-outline" size={18} color={colors.primary} />
            <Text style={styles.quickText}>AI</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => navigation.navigate('BloodRescue')}
          >
            <Ionicons name="swap-horizontal-outline" size={18} color={colors.primary} />
            <Text style={styles.quickText}>Rescue</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Blood Inventory</Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 30 }} />
        ) : stock.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="water-outline" size={32} color={colors.textMuted} />
            <Text style={styles.emptyText}>No stock yet. Tap "Add New Stock" to start.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {stock.map((item) => (
              <TouchableOpacity
                key={item._id}
                style={styles.stockCard}
                onPress={() => navigation.navigate('EditStock', { id: item._id })}
              >
                <Text style={styles.stockType}>{item.bloodGroup}</Text>
                <Text style={styles.stockUnits}>{item.units}</Text>
                <Text style={[styles.stockStatus, { color: statusColor(item.status) }]}>
                  {item.status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        onComingSoon={(f) => Alert.alert('Coming Soon', f)}
        menu={OFFICER_MENU}
        variant="staff"
        activeKey="Inventory Dashboard"
        hospital={HOSPITAL}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  bellBadge: { position: 'absolute', top: 6, right: 7, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, borderWidth: 1.5, borderColor: colors.white },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandText: { color: colors.primary, fontSize: 18, fontWeight: '800' },
  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 28 },
  welcome: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, backgroundColor: colors.white, borderRadius: 20, padding: 12, borderWidth: 1, borderColor: colors.cardBorder },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.primary, fontWeight: '800', fontSize: 16 },
  welcomeLabel: { fontSize: 12, color: colors.textSecondary },
  welcomeName: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 1 },
  hospital: { fontSize: 12, color: colors.text, marginTop: 2, fontWeight: '600' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  greenDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success, marginRight: 6 },
  statusText: { fontSize: 12, color: colors.textSecondary },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  statCard: { width: '47%', flexGrow: 1, backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder, padding: 12 },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 8 },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2, fontWeight: '600' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 26, backgroundColor: colors.primary, marginBottom: 12 },
  addBtnText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  quickBtn: { flex: 1, flexDirection: 'row', gap: 4, alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: 14, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.cardBorder },
  quickText: { fontSize: 11, fontWeight: '700', color: colors.text },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stockCard: { width: '22%', minWidth: 72, flexGrow: 1, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center' },
  stockType: { fontSize: 14, fontWeight: '800', color: colors.text },
  stockUnits: { fontSize: 20, fontWeight: '800', color: colors.primary, marginVertical: 4 },
  stockStatus: { fontSize: 10, fontWeight: '700' },
  empty: { alignItems: 'center', padding: 30, backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder },
  emptyText: { marginTop: 10, color: colors.textSecondary, fontSize: 13, textAlign: 'center' },
});

export default InventoryDashboardScreen;
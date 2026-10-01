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
import { useMyHospital } from '../../hooks/useMyHospital';
import { reservationService, stockService } from '../../services/officerService';
import { colors } from '../../utils/colors';
import { OFFICER_MENU } from '../../utils/roles';

const comingSoon = (feature) => {
  Alert.alert('Coming Soon', `${feature} will be available in a later version.`);
};

const getStatusTheme = (status) => {
  switch (status) {
    case 'CRITICAL':
    case 'EXPIRED':
      return { bg: '#FEE2E2', text: '#DC2626', progress: '#EF4444' };
    case 'LOW':
      return { bg: '#FFFAF0', text: '#D97706', progress: '#F59E0B' };
    case 'RESERVED':
      return { bg: '#EFF6FF', text: '#2563EB', progress: '#3B82F6' };
    case 'USED':
    case 'TRANSFERRED':
      return { bg: '#F3F4F6', text: '#6B7280', progress: '#9CA3AF' };
    default:
      return { bg: '#ECFDF5', text: '#059669', progress: '#10B981' };
  }
};

const HomeScreen = ({ navigation }) => {
  const HOSPITAL = useMyHospital();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stock, setStock] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
  }, [HOSPITAL]);

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

  const totalUnits = stock.reduce((sum, item) => sum + item.units, 0);
  const criticalCount = stock.filter(
    (s) => s.status === 'CRITICAL' || s.status === 'EXPIRED'
  ).length;

  const actions = [
    { label: 'Add Stock', icon: 'add-circle', color: colors.primary, screen: 'AddStock' },
    { label: 'Expiry', icon: 'hourglass-outline', color: '#F59E0B', screen: 'ExpiryMonitoring' },
    { label: 'Reservations', icon: 'bookmark-outline', color: '#3B82F6', screen: 'ReservedUnits' },
    { label: 'Rescue', icon: 'swap-horizontal-outline', color: '#8B5CF6', screen: 'BloodRescue' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader
        navigation={navigation}
        onMenuPress={() => setSidebarOpen(true)}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroStats}>
          <View style={styles.heroMain}>
            <Text style={styles.heroLabel}>Total Inventory</Text>
            <Text style={styles.heroValue}>
              {totalUnits} <Text style={styles.unitText}>Units</Text>
            </Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroSub}>
            <View>
              <Text style={styles.subStatValue}>{reservations.length}</Text>
              <Text style={styles.subStatLabel}>Reserved</Text>
            </View>
            <View>
              <Text style={styles.subStatValue}>{criticalCount}</Text>
              <Text style={[styles.subStatLabel, { color: colors.primary }]}>Critical</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          {actions.map((action, i) => (
            <TouchableOpacity
              key={i}
              style={styles.actionCard}
              onPress={() => navigation.navigate(action.screen)}
            >
              <View style={[styles.actionIconBg, { backgroundColor: action.color + '15' }]}>
                <Ionicons name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={styles.actionLabel} numberOfLines={1}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Inventory Details</Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 30 }} />
        ) : stock.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="water-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No blood units registered yet.</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('AddStock')}
            >
              <Ionicons name="add" size={16} color={colors.white} />
              <Text style={styles.emptyBtnText}>Add First Stock</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.inventoryList}>
            {stock.map((item) => {
              const theme = getStatusTheme(item.status);
              const progressColor = theme.progress || theme.text;
              const percentage = Math.min((item.units / 50) * 100, 100);

              return (
                <TouchableOpacity
                  key={item._id}
                  style={styles.listItem}
                  onPress={() => navigation.navigate('EditStock', { id: item._id })}
                >
                  <View style={styles.listBloodType}>
                    <Text style={styles.bloodTypeText}>{item.bloodGroup}</Text>
                  </View>

                  <View style={styles.listContent}>
                    <View style={styles.listRow}>
                      <Text style={styles.listUnits}>
                        {item.units} {item.units === 1 ? 'Unit' : 'Units'}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: theme.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: theme.text }]}>
                          {item.status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${percentage}%`, backgroundColor: progressColor },
                        ]}
                      />
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        onComingSoon={comingSoon}
        menu={OFFICER_MENU}
        variant="staff"
        activeKey="Home"
        hospital={HOSPITAL}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },

  heroStats: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroMain: { flex: 1.2 },
  heroLabel: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },
  heroValue: { color: colors.white, fontSize: 32, fontWeight: '800', marginTop: 4 },
  unitText: { fontSize: 16, color: '#94A3B8', fontWeight: '400' },
  heroDivider: { width: 1, height: 40, backgroundColor: '#334155', marginHorizontal: 20 },
  heroSub: { flex: 1, gap: 12 },
  subStatValue: { color: colors.white, fontSize: 16, fontWeight: '700' },
  subStatLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 16,
    marginLeft: 4,
  },

  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionCard: {
    width: '48%',
    marginBottom: 12,
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  actionIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontSize: 13, fontWeight: '700', color: colors.text, flex: 1 },

  inventoryList: { gap: 10 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  listBloodType: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FEF2F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bloodTypeText: { fontSize: 16, fontWeight: '900', color: colors.primary },
  listContent: { flex: 1, marginLeft: 14 },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  listUnits: { fontSize: 15, fontWeight: '800', color: colors.text },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },

  empty: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 10,
  },
  emptyText: { color: colors.textSecondary, fontSize: 13, textAlign: 'center' },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.primary,
  },
  emptyBtnText: { color: colors.white, fontWeight: '800', fontSize: 12 },
});

export default HomeScreen;
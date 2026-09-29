import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { stockService } from '../../services/officerService';
import { colors } from '../../utils/colors';

const HOSPITAL = 'Colombo General Hospital Blood Bank';

const urgencyTheme = (urgency) => {
  switch (urgency) {
    case 'EXPIRED':
      return { bg: '#7F1D1D', text: '#FFFFFF', label: 'EXPIRED' };
    case 'CRITICAL':
      return { bg: '#EF4444', text: '#FFFFFF', label: 'CRITICAL' };
    case 'HIGH':
      return { bg: '#F59E0B', text: '#FFFFFF', label: 'HIGH' };
    case 'MEDIUM':
      return { bg: '#FDE68A', text: '#92400E', label: 'MEDIUM' };
    default:
      return { bg: '#F3F4F6', text: '#6B7280', label: 'LOW' };
  }
};

const ExpiryMonitoringScreen = ({ navigation }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [windowDays, setWindowDays] = useState(30);

  const load = useCallback(async (days = windowDays) => {
    try {
      setLoading(true);
      const { data } = await stockService.expiring(days);
      setItems(data.stock || []);
    } catch (e) {
      Alert.alert('Error', 'Failed to load expiry data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [windowDays]);

  useEffect(() => { load(windowDays); }, [windowDays, load]);
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => load(windowDays));
    return unsub;
  }, [navigation, load, windowDays]);

  const handleExport = () => {
    if (items.length === 0) {
      return Alert.alert('Nothing to export', 'No expiring units in this window.');
    }
    Alert.alert(
      'Export',
      `Ready to export ${items.length} expiring unit${
        items.length === 1 ? '' : 's'
      }. This feature will be available soon.`
    );
  };

  const handleMove = (item) => {
    navigation.navigate('BloodRescue');
  };

  const expiredCount = items.filter((i) => i.isExpired).length;
  const criticalCount = items.filter((i) => i.urgency === 'CRITICAL').length;
  const highCount = items.filter((i) => i.urgency === 'HIGH').length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Expiry Monitoring</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerIcon}>
            <Ionicons name="hourglass-outline" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Track units nearing expiration</Text>
            <Text style={styles.bannerSub}>
              Showing units expiring in the next {windowDays} days (including expired)
            </Text>
          </View>
        </View>

        {/* Window filter */}
        <View style={styles.filterRow}>
          {[7, 14, 30, 90].map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.filterChip, windowDays === d && styles.filterChipActive]}
              onPress={() => setWindowDays(d)}
            >
              <Text
                style={[
                  styles.filterText,
                  windowDays === d && styles.filterTextActive,
                ]}
              >
                {d}d
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary stats */}
        {items.length > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#7F1D1D' }]}>{expiredCount}</Text>
              <Text style={styles.statLabel}>Expired</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#EF4444' }]}>{criticalCount}</Text>
              <Text style={styles.statLabel}>Critical</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>{highCount}</Text>
              <Text style={styles.statLabel}>High</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{items.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        )}

        {/* Table */}
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : items.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={44} color={colors.success} />
            <Text style={styles.emptyTitle}>No units expiring soon</Text>
            <Text style={styles.emptySub}>
              All stock has more than {windowDays} days left.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => setWindowDays(90)}
            >
              <Text style={styles.emptyBtnText}>Widen window to 90 days</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.th, { flex: 1.2 }]}>Group</Text>
              <Text style={[styles.th, { flex: 1 }]}>Units</Text>
              <Text style={[styles.th, { flex: 2 }]}>Expiry</Text>
              <Text style={[styles.th, { flex: 1.8 }]}>Urgency</Text>
              <Text style={[styles.th, { flex: 1.4 }]}></Text>
            </View>

            {items.map((item, index) => {
              const theme = urgencyTheme(item.urgency);
              return (
                <View
                  key={item._id}
                  style={[
                    styles.tr,
                    index % 2 !== 0 && styles.trAlt,
                    item.isExpired && styles.trExpired,
                  ]}
                >
                  <Text style={[styles.td, styles.tdBlood, { flex: 1.2 }]}>
                    {item.bloodGroup}
                  </Text>
                  <Text style={[styles.td, styles.tdBold, { flex: 1 }]}>
                    {item.units}
                  </Text>
                  <View style={{ flex: 2, alignItems: 'center' }}>
                    <Text style={styles.td}>
                      {new Date(item.expiryDate).toLocaleDateString()}
                    </Text>
                    <Text style={styles.tdSub}>
                      {item.isExpired
                        ? `${Math.abs(item.daysLeft)}d ago`
                        : `${item.daysLeft}d left`}
                    </Text>
                  </View>
                  <View style={{ flex: 1.8, alignItems: 'center' }}>
                    <View style={[styles.badge, { backgroundColor: theme.bg }]}>
                      <Text style={[styles.badgeText, { color: theme.text }]}>
                        {theme.label}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={{ flex: 1.4, alignItems: 'center' }}
                    onPress={() => handleMove(item)}
                  >
                    <Text style={styles.actionLink}>
                      {item.isExpired ? 'Dispose' : 'Move'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerBtn} onPress={handleExport}>
          <Ionicons name="download-outline" size={16} color={colors.white} />
          <Text style={styles.footerText}>EXPORT EXPIRY REPORT</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  scroll: { padding: 16, paddingBottom: 110 },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.primarySoft,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  bannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
  bannerSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: 12, fontWeight: '700', color: colors.text },
  filterTextActive: { color: colors.white },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statValue: { fontSize: 20, fontWeight: '900', color: colors.text },
  statLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '700', marginTop: 2 },

  table: {
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
  th: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  trAlt: { backgroundColor: '#FAFAFA' },
  trExpired: { backgroundColor: '#FEF2F2' },
  td: { fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
  tdBlood: { fontWeight: '800', color: colors.primary },
  tdBold: { fontWeight: '700', color: colors.text },
  tdSub: { fontSize: 10, color: colors.textMuted, marginTop: 2 },

  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.3 },

  actionLink: { fontSize: 12, fontWeight: '800', color: colors.primary },

  empty: {
    alignItems: 'center',
    paddingVertical: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 8,
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 4 },
  emptySub: { fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
  emptyBtn: {
    marginTop: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
  },
  emptyBtnText: { color: colors.primary, fontWeight: '800', fontSize: 12 },

  footer: { position: 'absolute', left: 16, right: 16, bottom: 20 },
  footerBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  footerText: { color: colors.white, fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
});

export default ExpiryMonitoringScreen;
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
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
import { stockService } from '../../services/officerService';
import { colors } from '../../utils/colors';
import { OFFICER_MENU } from '../../utils/roles';

const comingSoon = (label) =>
  Alert.alert('Coming Soon', `${label} will be available soon.`);

const urgencyTheme = (urgency) => {
  switch (urgency) {
    case 'EXPIRED': return { bg: '#7F1D1D', text: '#FFFFFF', label: 'EXPIRED' };
    case 'CRITICAL': return { bg: '#EF4444', text: '#FFFFFF', label: 'CRITICAL' };
    case 'HIGH': return { bg: '#F59E0B', text: '#FFFFFF', label: 'HIGH' };
    case 'MEDIUM': return { bg: '#FDE68A', text: '#92400E', label: 'MEDIUM' };
    default: return { bg: '#F3F4F6', text: '#6B7280', label: 'LOW' };
  }
};

const ExpiryMonitoringScreen = ({ navigation }) => {
  const HOSPITAL = useMyHospital();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState([]);
  const [windowDays, setWindowDays] = useState(30);

  const load = useCallback(async (days = windowDays) => {
    try {
      setLoading(true);
      const { data } = await stockService.expiring(days);
      const filtered = (data.stock || []).filter(
        (s) => s.hospital === HOSPITAL
      );
      const list = filtered.map((s) => {
        const diff = new Date(s.expiryDate).getTime() - Date.now();
        const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
        let urgency = 'LOW';
        if (daysLeft <= 0) urgency = 'EXPIRED';
        else if (daysLeft <= 3) urgency = 'CRITICAL';
        else if (daysLeft <= 7) urgency = 'HIGH';
        else if (daysLeft <= 14) urgency = 'MEDIUM';
        return {
          id: s._id,
          group: s.bloodGroup,
          units: s.units,
          expiryDate: s.expiryDate,
          expiryLabel: new Date(s.expiryDate).toLocaleDateString(),
          daysLeft,
          isExpired: daysLeft <= 0,
          urgency,
          status: s.status,
        };
      });
      setItems(list);
    } catch (e) {
      Alert.alert('Error', 'Failed to load expiry data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [HOSPITAL, windowDays]);

  useEffect(() => { load(windowDays); }, [windowDays, load]);
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => load(windowDays));
    return unsub;
  }, [navigation, load, windowDays]);

  const buildCsv = () => {
    const header = ['Blood Group', 'Units', 'Expiry Date', 'Days Left', 'Status'];
    const rows = items.map((i) => [
      i.group, i.units,
      new Date(i.expiryDate).toISOString().slice(0, 10),
      i.isExpired ? `${Math.abs(i.daysLeft)} (expired)` : i.daysLeft,
      i.status,
    ]);
    return [header, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
  };

  const handleExport = async () => {
    if (items.length === 0) {
      return Alert.alert('Nothing to export', `No units expiring within ${windowDays} days.`);
    }
    const csv = buildCsv();
    const filename = `hemogo-expiry-${new Date().toISOString().slice(0, 10)}.csv`;

    if (Platform.OS === 'web') {
      try {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        Alert.alert('Exported', `Downloaded ${filename}`);
      } catch (e) {
        Alert.alert('Export Failed', 'Could not download file.');
      }
      return;
    }

    try {
      const { Share } = require('react-native');
      await Share.share({
        title: 'HemoGo Expiry Report',
        message: `Expiry Report · ${HOSPITAL}\n\n${csv}`,
      });
    } catch (e) {
      Alert.alert('Export Failed', 'Could not share.');
    }
  };

  const expiredCount = items.filter((i) => i.isExpired).length;
  const criticalCount = items.filter((i) => i.urgency === 'CRITICAL').length;
  const highCount = items.filter((i) => i.urgency === 'HIGH').length;

  const renderDaysLeft = (item) => {
    const theme = urgencyTheme(item.urgency);
    if (item.isExpired) {
      return (
        <View style={[styles.daysPill, { backgroundColor: theme.bg }]}>
          <Text style={[styles.daysPillText, { color: theme.text }]}>EXPIRED</Text>
        </View>
      );
    }
    if (item.daysLeft <= 7) {
      return (
        <View style={[styles.daysPill, { backgroundColor: theme.bg }]}>
          <Text style={[styles.daysPillText, { color: theme.text }]}>
            {item.daysLeft} DAYS
          </Text>
        </View>
      );
    }
    return <Text style={styles.daysPlain}>{item.daysLeft} Days</Text>;
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
            onRefresh={() => { setRefreshing(true); load(windowDays); }}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <View style={styles.iconBox}>
            <Ionicons name="hourglass" size={20} color={colors.primary} />
          </View>
          <Text style={styles.pageTitle}>Expiry Monitoring</Text>
        </View>
        <Text style={styles.pageSubtitle}>
          Track and manage units nearing expiration at {HOSPITAL}.
        </Text>

        <View style={styles.chipRow}>
          {[7, 14, 30, 90].map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.windowChip, windowDays === d && styles.windowChipActive]}
              onPress={() => setWindowDays(d)}
            >
              <Text
                style={[
                  styles.windowChipText,
                  windowDays === d && styles.windowChipTextActive,
                ]}
              >
                {d}d
              </Text>
            </TouchableOpacity>
          ))}
        </View>

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

        <View style={styles.tableContainer}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : items.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={44} color={colors.success} />
              <Text style={styles.emptyTitle}>No units expiring soon</Text>
              <Text style={styles.emptySub}>
                All stock has more than {windowDays} days left.
              </Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => setWindowDays(90)}>
                <Text style={styles.emptyBtnText}>Widen window to 90 days</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeader, { flex: 1.5 }]}>Blood{'\n'}Group</Text>
                <Text style={[styles.tableHeader, { flex: 1.5 }]}>Units</Text>
                <Text style={[styles.tableHeader, { flex: 2.5 }]}>Expiry{'\n'}Date</Text>
                <Text style={[styles.tableHeader, { flex: 1.5 }]}>Days{'\n'}Left</Text>
              </View>

              {items.map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    styles.tableRow,
                    index % 2 !== 0 && styles.tableRowAlt,
                    item.isExpired && styles.tableRowExpired,
                  ]}
                >
                  <Text style={[styles.tableCell, styles.boldRedText, { flex: 1.5 }]}>
                    {item.group}
                  </Text>
                  <Text style={[styles.tableCell, styles.boldText, { flex: 1.5 }]}>
                    {item.units}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 2.5 }]}>
                    {item.expiryLabel}
                  </Text>
                  <View style={{ flex: 1.5, alignItems: 'center' }}>
                    {renderDaysLeft(item)}
                  </View>
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.primaryButton, loading && { opacity: 0.6 }]}
          onPress={handleExport}
          disabled={loading}
        >
          <Ionicons name="download-outline" size={18} color={colors.white} style={{ marginRight: 8 }} />
          <Text style={styles.primaryButtonText}>EXPORT EXPIRY REPORT</Text>
        </TouchableOpacity>
      </View>

      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        onComingSoon={comingSoon}
        menu={OFFICER_MENU}
        variant="staff"
        activeKey="Expiry Monitoring"
        hospital={HOSPITAL}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { paddingHorizontal: 20, paddingBottom: 110 },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 6,
  },
  iconBox: {
    backgroundColor: '#FFF1F3',
    padding: 10,
    borderRadius: 12,
    marginRight: 12,
  },
  pageTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  pageSubtitle: { fontSize: 12, color: colors.textSecondary, marginBottom: 16 },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  windowChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  windowChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  windowChipText: { fontSize: 12, fontWeight: '700', color: colors.text },
  windowChipTextActive: { color: colors.white },
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
  tableContainer: {
    borderWidth: 1,
    borderColor: '#FEF2F2',
    borderRadius: 16,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#FFF1F3',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#FEE2E2',
  },
  tableHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  tableRowAlt: { backgroundColor: '#FAFAFA' },
  tableRowExpired: { backgroundColor: '#FEF2F2' },
  tableCell: { fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
  boldText: { fontWeight: '700', color: colors.text },
  boldRedText: { fontWeight: '800', color: colors.primary },
  daysPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  daysPillText: { fontSize: 10, fontWeight: '800' },
  daysPlain: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
    backgroundColor: '#FFFFFF',
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
  bottomContainer: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryButtonText: { color: colors.white, fontSize: 14, fontWeight: '800' },
});

export default ExpiryMonitoringScreen;
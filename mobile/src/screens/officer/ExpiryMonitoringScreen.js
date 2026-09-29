import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BloodDrop } from '../../components/Logo';
import Sidebar from '../../components/Sidebar';
import { stockService } from '../../services/officerService';
import { colors } from '../../utils/colors';
import { OFFICER_MENU } from '../../utils/roles';

const HOSPITAL = 'Colombo General Hospital Blood Bank';

const comingSoon = (label) =>
  Alert.alert('Coming Soon', `${label} will be available soon.`);

const ExpiryMonitoringScreen = ({ navigation }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState([]);
  const [windowDays, setWindowDays] = useState(30);

  const load = useCallback(
    async (days = windowDays) => {
      try {
        setLoading(true);
        const { data } = await stockService.expiring(days);
        const list = (data.stock || []).map((s) => {
          const diff = new Date(s.expiryDate).getTime() - Date.now();
          const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
          return {
            id: s._id,
            group: s.bloodGroup,
            units: s.units,
            expiryDate: s.expiryDate,
            expiryLabel: new Date(s.expiryDate).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
            daysLeft,
            isExpired: daysLeft <= 0,
            hospital: s.hospital,
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
    },
    [windowDays]
  );

  useEffect(() => {
    load(windowDays);
  }, [windowDays, load]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => load(windowDays));
    return unsub;
  }, [navigation, load, windowDays]);

  // ---------- EXPORT ----------
  const buildCsv = () => {
    const header = ['Blood Group', 'Units', 'Expiry Date', 'Days Left', 'Status'];
    const rows = items.map((i) => [
      i.group,
      i.units,
      new Date(i.expiryDate).toISOString().slice(0, 10),
      i.isExpired ? `${Math.abs(i.daysLeft)} (expired)` : i.daysLeft,
      i.status,
    ]);
    const all = [header, ...rows]
      .map((r) => r.map((cell) => `"${cell}"`).join(','))
      .join('\n');
    return all;
  };

  const handleExport = async () => {
    if (items.length === 0) {
      return Alert.alert(
        'Nothing to export',
        `No units expiring within ${windowDays} days.`
      );
    }

    const csv = buildCsv();
    const filename = `hemogo-expiry-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    const summary = items
      .slice(0, 12)
      .map(
        (i) =>
          `${i.group} · ${i.units}u · ${i.expiryLabel} · ${
            i.isExpired ? 'EXPIRED' : `${i.daysLeft}d`
          }`
      )
      .join('\n');

    // ---------- WEB: trigger browser download ----------
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

    // ---------- NATIVE: use Share sheet ----------
    try {
      await Share.share({
        title: 'HemoGo Expiry Report',
        message: `HemoGo · Expiry Report (${windowDays}d)\n\n${summary}\n\nFull CSV:\n${csv}`,
      });
    } catch (e) {
      Alert.alert('Export Failed', 'Could not share the report.');
    }
  };

  // ---------- DAYS LEFT RENDERER (matches Figma) ----------
  const renderDaysLeft = (item) => {
    const { daysLeft, isExpired } = item;

    if (isExpired) {
      return (
        <View style={[styles.daysPill, { backgroundColor: '#7F1D1D' }]}>
          <Text style={styles.daysPillText}>EXPIRED</Text>
        </View>
      );
    }

    if (daysLeft <= 5) {
      return (
        <View style={[styles.daysPill, { backgroundColor: colors.primary }]}>
          <Text style={styles.daysPillText}>{daysLeft} DAYS</Text>
        </View>
      );
    }

    if (daysLeft <= 8) {
      return (
        <View style={[styles.daysPill, { backgroundColor: '#F5A623' }]}>
          <Text style={styles.daysPillText}>{daysLeft} DAYS</Text>
        </View>
      );
    }

    return <Text style={styles.daysPlain}>{daysLeft} Days</Text>;
  };

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
          onPress={() => comingSoon('Notifications')}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
          <View style={styles.bellBadge} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          Platform.OS !== 'web' ? undefined : undefined
        }
      >
        {/* Title */}
        <View style={styles.titleSection}>
          <View style={styles.iconBox}>
            <Ionicons name="hourglass" size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.pageTitle}>Expiry Monitoring</Text>
          </View>
        </View>
        <Text style={styles.pageSubtitle}>
          Track and manage units nearing expiration dates.
        </Text>

        {/* Filter / Location Row */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => comingSoon('Hospital selector')}
          >
            <Ionicons
              name="business"
              size={16}
              color={colors.textMuted}
              style={styles.dropdownIcon}
            />
            <Text style={styles.dropdownText} numberOfLines={1}>
              {HOSPITAL}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => {
              // cycle through windows
              const next =
                windowDays === 7 ? 14 : windowDays === 14 ? 30 : windowDays === 30 ? 90 : 7;
              setWindowDays(next);
            }}
          >
            <Ionicons name="options-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Window chips */}
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

        {/* Table */}
        <View style={styles.tableContainer}>
          {loading ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={{ marginTop: 40 }}
            />
          ) : items.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="checkmark-circle-outline"
                size={44}
                color={colors.success}
              />
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
            <>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeader, { flex: 1.5 }]}>
                  Blood{'\n'}Group
                </Text>
                <Text style={[styles.tableHeader, { flex: 1.5 }]}>Units</Text>
                <Text style={[styles.tableHeader, { flex: 2.5 }]}>
                  Expiry{'\n'}Date
                </Text>
                <Text style={[styles.tableHeader, { flex: 1.5 }]}>
                  Days{'\n'}Left
                </Text>
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
                  <Text
                    style={[styles.tableCell, styles.boldRedText, { flex: 1.5 }]}
                  >
                    {item.group}
                  </Text>
                  <Text
                    style={[styles.tableCell, styles.boldText, { flex: 1.5 }]}
                  >
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
          <Ionicons
            name="download-outline"
            size={18}
            color={colors.white}
            style={{ marginRight: 8 }}
          />
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
  scroll: { paddingHorizontal: 20, paddingBottom: 110 },

  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  iconBox: {
    backgroundColor: '#FFF1F3',
    padding: 10,
    borderRadius: 12,
    marginRight: 12,
  },
  pageTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  pageSubtitle: { fontSize: 12, color: colors.textSecondary, marginBottom: 20 },

  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginRight: 12,
  },
  dropdownIcon: { marginRight: 10 },
  dropdownText: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.text },
  filterBtn: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },

  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  windowChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  windowChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  windowChipText: { fontSize: 12, fontWeight: '700', color: colors.text },
  windowChipTextActive: { color: colors.white },

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
  tableCell: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  boldText: { fontWeight: '700', color: colors.text },
  boldRedText: { fontWeight: '800', color: colors.primary },
  daysPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  daysPillText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  daysPlain: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 4 },
  emptySub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
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
  primaryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
});

export default ExpiryMonitoringScreen;
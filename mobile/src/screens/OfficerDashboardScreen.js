import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BloodDrop } from '../components/Logo';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { colors } from '../utils/colors';
import { OFFICER_MENU } from '../utils/roles';

const HOSPITAL = 'Colombo National Hospital';

const comingSoon = (feature) => {
  Alert.alert('Coming Soon', `${feature} will be available in a later version.`);
};

const STOCK = [
  { type: 'O+', units: 18, status: 'Good' },
  { type: 'O-', units: 4, status: 'Low' },
  { type: 'A+', units: 12, status: 'Good' },
  { type: 'A-', units: 3, status: 'Low' },
  { type: 'B+', units: 9, status: 'OK' },
  { type: 'B-', units: 2, status: 'Critical' },
  { type: 'AB+', units: 6, status: 'OK' },
  { type: 'AB-', units: 1, status: 'Critical' },
];

const REQUESTS = [
  { id: '1', title: 'O- needed · Ward 4', sub: 'High priority · 2 units', urgent: true },
  { id: '2', title: 'A+ needed · Theatre', sub: 'Regular · 1 unit', urgent: false },
];

const EXPIRING = [
  { type: 'O-', units: 2, when: 'Expires in 18 hrs' },
  { type: 'B-', units: 1, when: 'Expires in 2 days' },
  { type: 'AB-', units: 1, when: 'Expires in 3 days' },
];

const statusColor = (status) => {
  if (status === 'Critical') return colors.primary;
  if (status === 'Low') return '#F59E0B';
  if (status === 'Good') return colors.success;
  return colors.textSecondary;
};

const OfficerDashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const rawName = user?.name || 'Nimal Perera';
  const name = /^dr\.?\s/i.test(rawName) ? rawName : `Dr. ${rawName}`;
  const initials = name
    .replace(/^Dr\.?\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const totalUnits = STOCK.reduce((sum, item) => sum + item.units, 0);
  const criticalCount = STOCK.filter((item) => item.status === 'Critical').length;

  const stats = [
    { label: 'Total Units', value: String(totalUnits), icon: 'water-outline' },
    { label: 'Critical Types', value: String(criticalCount), icon: 'alert-circle-outline' },
    { label: 'Expiring Soon', value: String(EXPIRING.length), icon: 'time-outline' },
    { label: 'Incoming', value: String(REQUESTS.length), icon: 'download-outline' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidebarOpen(true)} hitSlop={10} style={styles.headerBtn}>
          <Ionicons name="menu-outline" size={26} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.brand}>
          <BloodDrop size={16} />
          <Text style={styles.brandText}>HemoGo</Text>
        </View>
        <TouchableOpacity onPress={() => comingSoon('Notifications')} hitSlop={10} style={styles.headerBtn}>
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
          <View style={styles.bellBadge} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.welcome}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || 'NP'}</Text>
          </View>
          <View style={styles.welcomeCopy}>
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
          {stats.map((item) => (
            <View key={item.label} style={styles.statCard}>
              <Ionicons name={item.icon} size={16} color={colors.primary} />
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.emergency}>
          <View style={styles.emergencyTop}>
            <View style={styles.emergencyTitleRow}>
              <View style={styles.redDot} />
              <Text style={styles.emergencyKicker}>CRITICAL STOCK</Text>
            </View>
            <View style={styles.priority}>
              <Text style={styles.priorityText}>Action needed</Text>
            </View>
          </View>
          <Text style={styles.emergencyTitle}>B- critically low at {HOSPITAL}</Text>
          <Text style={styles.emergencyCopy}>Only 2 units remaining. Reserve or request nearby stock now.</Text>
          <View style={styles.emergencyActions}>
            <TouchableOpacity style={styles.respondBtn} onPress={() => comingSoon('Smart Blood Rescue')}>
              <Text style={styles.respondText}>Rescue Stock</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.detailsBtn}
              onPress={() => comingSoon('Nearby Blood Bank Stock')}
            >
              <Text style={styles.detailsText}>Nearby Banks</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Blood Inventory</Text>
        <View style={styles.grid}>
          {STOCK.map((item) => (
            <View key={item.type} style={styles.stockCard}>
              <Text style={styles.stockType}>{item.type}</Text>
              <Text style={styles.stockUnits}>{item.units}</Text>
              <Text style={[styles.stockStatus, { color: statusColor(item.status) }]}>{item.status}</Text>
            </View>
          ))}
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHead}>
            <Text style={styles.panelTitle}>Incoming requests</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Requests')}>
              <Text style={styles.panelLink}>View all</Text>
            </TouchableOpacity>
          </View>
          {REQUESTS.map((item) => (
            <View key={item.id} style={styles.request}>
              <View style={[styles.redDot, !item.urgent && styles.mutedDot]} />
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowSub}>{item.sub}</Text>
              </View>
              <TouchableOpacity onPress={() => comingSoon('Reserve Units')}>
                <Text style={styles.link}>Reserve</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHead}>
            <Text style={styles.panelTitle}>Expiry monitoring</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Alerts')}>
              <Text style={styles.panelLink}>View all</Text>
            </TouchableOpacity>
          </View>
          {EXPIRING.map((item) => (
            <View key={`${item.type}-${item.when}`} style={styles.request}>
              <View style={styles.expiryBadge}>
                <Text style={styles.expiryType}>{item.type}</Text>
              </View>
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>{item.units} unit{item.units > 1 ? 's' : ''} at risk</Text>
                <Text style={styles.rowSub}>{item.when}</Text>
              </View>
              <TouchableOpacity onPress={() => comingSoon('Expiry Monitoring')}>
                <Text style={styles.link}>Move</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.action} onPress={() => comingSoon('QR Scan')}>
            <View style={styles.actionIcon}>
              <Ionicons name="qr-code-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.actionText}>QR Scan</Text>
            <Text style={styles.actionSub}>Log bags in or out</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.action} onPress={() => comingSoon('AI Shortage Prediction')}>
            <View style={styles.actionIcon}>
              <Ionicons name="pulse-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.actionText}>Shortage AI</Text>
            <Text style={styles.actionSub}>Predict demand gaps</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        onComingSoon={comingSoon}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
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
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandText: { color: colors.primary, fontSize: 18, fontWeight: '800' },
  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 28 },
  welcome: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.primary, fontWeight: '800', fontSize: 16 },
  welcomeCopy: { flex: 1, marginLeft: 12 },
  welcomeLabel: { fontSize: 12, color: colors.textSecondary },
  welcomeName: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 1 },
  hospital: { fontSize: 12, color: colors.text, marginTop: 2, fontWeight: '600' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: 6,
  },
  statusText: { fontSize: 12, color: colors.textSecondary },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  statCard: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 12,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 8 },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2, fontWeight: '600' },
  emergency: {
    borderWidth: 1,
    borderColor: '#F7C4CB',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#FFF8F8',
  },
  emergencyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  emergencyTitleRow: { flexDirection: 'row', alignItems: 'center' },
  redDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 6,
  },
  mutedDot: { backgroundColor: colors.textMuted },
  emergencyKicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
    color: colors.text,
  },
  priority: {
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  priorityText: { fontSize: 11, color: colors.primary, fontWeight: '700' },
  emergencyTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  emergencyCopy: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
  },
  emergencyActions: { flexDirection: 'row', gap: 10 },
  respondBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  respondText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  detailsBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsText: { color: colors.text, fontWeight: '700', fontSize: 14 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  stockCard: {
    width: '22%',
    minWidth: 72,
    flexGrow: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  stockType: { fontSize: 14, fontWeight: '800', color: colors.text },
  stockUnits: { fontSize: 20, fontWeight: '800', color: colors.primary, marginVertical: 4 },
  stockStatus: { fontSize: 10, fontWeight: '700' },
  panel: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  panelHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  panelTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  panelLink: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  request: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  rowCopy: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  rowSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  link: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  expiryBadge: {
    minWidth: 38,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  expiryType: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  actions: { flexDirection: 'row', gap: 10 },
  action: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 16,
    padding: 14,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionText: { fontSize: 13, fontWeight: '800', color: colors.text },
  actionSub: { fontSize: 11, color: colors.textSecondary, marginTop: 3, lineHeight: 15 },
});

export default OfficerDashboardScreen;

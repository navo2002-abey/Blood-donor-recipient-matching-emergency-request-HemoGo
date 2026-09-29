import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BloodDrop } from '../components/Logo';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { colors } from '../utils/colors';
import { ADMIN_MENU } from '../utils/roles';

const ORG = 'HemoGo National Network';

const comingSoon = (feature) => {
  Alert.alert('Coming Soon', `${feature} will be available in a later version.`);
};

const REQUESTS = [
  { id: '1', title: 'O- emergency · Colombo General', sub: 'High priority · 3 units · 12 mins ago', urgent: true },
  { id: '2', title: 'B+ request · Kandy Teaching', sub: 'Awaiting officer match · 28 mins ago', urgent: true },
  { id: '3', title: 'A+ scheduled · NHSL Theatre', sub: 'Regular · 1 unit · 1 hr ago', urgent: false },
];

const USERS = [
  { name: 'Amal Silva', role: 'Donor', meta: 'O+ · Colombo' },
  { name: 'Dr. Nimal Perera', role: 'Officer', meta: 'Colombo National Hospital' },
  { name: 'Sanduni Perera', role: 'Patient', meta: 'A- request open' },
];

const BANKS = [
  { name: 'Colombo National', stock: 'Good', units: 55 },
  { name: 'Kandy Teaching', stock: 'Low', units: 18 },
  { name: 'Galle General', stock: 'Critical', units: 9 },
];

const stockColor = (status) => {
  if (status === 'Critical') return colors.primary;
  if (status === 'Low') return '#F59E0B';
  return colors.success;
};

const AdminDashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 3,
    donors: 1,
    officers: 1,
    patients: 0,
  });
  const name = user?.name || 'Anusha Fernando';
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { data } = await api.get('/admin/stats');
        if (data?.stats) {
          setStats(data.stats);
        }
      } catch (error) {
        // Keep fallback demo stats if the admin API is unavailable.
      }
    };
    loadStats();
  }, []);

  const cards = [
    { label: 'Total Users', value: stats.total, icon: 'people-outline' },
    { label: 'Donors', value: stats.donors, icon: 'water-outline' },
    { label: 'Officers', value: stats.officers, icon: 'medkit-outline' },
    { label: 'Patients', value: stats.patients, icon: 'heart-outline' },
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
            <Text style={styles.avatarText}>{initials || 'AF'}</Text>
          </View>
          <View style={styles.welcomeCopy}>
            <Text style={styles.welcomeLabel}>Welcome back,</Text>
            <Text style={styles.welcomeName}>{name}</Text>
            <Text style={styles.org}>{ORG}</Text>
            <View style={styles.statusRow}>
              <View style={styles.greenDot} />
              <Text style={styles.statusText}>On duty · System Admin</Text>
            </View>
          </View>
        </View>

        <View style={styles.statGrid}>
          {cards.map((card) => (
            <View key={card.label} style={styles.statCard}>
              <Ionicons name={card.icon} size={16} color={colors.primary} />
              <Text style={styles.statValue}>{card.value}</Text>
              <Text style={styles.statLabel}>{card.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.emergency}>
          <View style={styles.emergencyTop}>
            <View style={styles.emergencyTitleRow}>
              <View style={styles.redDot} />
              <Text style={styles.emergencyKicker}>EMERGENCY REQUESTS</Text>
            </View>
            <View style={styles.priority}>
              <Text style={styles.priorityText}>2 high priority</Text>
            </View>
          </View>
          <Text style={styles.emergencyTitle}>O- and B+ requests need officer matching</Text>
          <Text style={styles.emergencyCopy}>
            Review live requests across the national network and assign the nearest blood bank.
          </Text>
          <View style={styles.emergencyActions}>
            <TouchableOpacity style={styles.respondBtn} onPress={() => navigation.navigate('Requests')}>
              <Text style={styles.respondText}>Open Requests</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.detailsBtn} onPress={() => comingSoon('Donor Verification')}>
              <Text style={styles.detailsText}>Verify Donors</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHead}>
            <Text style={styles.panelTitle}>Live requests</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Requests')}>
              <Text style={styles.panelLink}>View all</Text>
            </TouchableOpacity>
          </View>
          {REQUESTS.map((item) => (
            <View key={item.id} style={styles.row}>
              <View style={[styles.redDot, !item.urgent && styles.mutedDot]} />
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowSub}>{item.sub}</Text>
              </View>
              <TouchableOpacity onPress={() => comingSoon('Assign Officer')}>
                <Text style={styles.link}>Assign</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHead}>
            <Text style={styles.panelTitle}>Manage users</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Users')}>
              <Text style={styles.panelLink}>View all</Text>
            </TouchableOpacity>
          </View>
          {USERS.map((item) => (
            <View key={item.name} style={styles.row}>
              <View style={styles.userBadge}>
                <Text style={styles.userBadgeText}>{item.name.charAt(0)}</Text>
              </View>
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>{item.name}</Text>
                <Text style={styles.rowSub}>
                  {item.role} · {item.meta}
                </Text>
              </View>
              <TouchableOpacity onPress={() => comingSoon('Manage Users')}>
                <Text style={styles.link}>Review</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHead}>
            <Text style={styles.panelTitle}>Blood bank network</Text>
            <TouchableOpacity onPress={() => comingSoon('Blood Banks')}>
              <Text style={styles.panelLink}>View all</Text>
            </TouchableOpacity>
          </View>
          {BANKS.map((item) => (
            <View key={item.name} style={styles.row}>
              <Ionicons name="business-outline" size={18} color={colors.text} />
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>{item.name}</Text>
                <Text style={styles.rowSub}>{item.units} units in stock</Text>
              </View>
              <Text style={[styles.stockStatus, { color: stockColor(item.stock) }]}>{item.stock}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.action} onPress={() => navigation.navigate('Reports')}>
            <View style={styles.actionIcon}>
              <Ionicons name="bar-chart-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.actionText}>Reports</Text>
            <Text style={styles.actionSub}>Donations & shortages</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.action} onPress={() => comingSoon('Notifications')}>
            <View style={styles.actionIcon}>
              <Ionicons name="notifications-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.actionText}>Alerts</Text>
            <Text style={styles.actionSub}>Push network notices</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        onComingSoon={comingSoon}
        menu={ADMIN_MENU}
        variant="staff"
        activeKey="Admin Dashboard"
        org={ORG}
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
  org: { fontSize: 12, color: colors.text, marginTop: 2, fontWeight: '600' },
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
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  rowCopy: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  rowSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  link: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  userBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userBadgeText: { color: colors.primary, fontWeight: '800', fontSize: 13 },
  stockStatus: { fontSize: 12, fontWeight: '800' },
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

export default AdminDashboardScreen;

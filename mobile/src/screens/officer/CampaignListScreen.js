import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
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
import { campaignService } from '../../services/officerService';
import { colors } from '../../utils/colors';
import { OFFICER_MENU } from '../../utils/roles';
import { useTheme } from '../../context/ThemeContext';

const comingSoon = (label) =>
  Alert.alert('Coming Soon', `${label} will be available soon.`);

const statusColor = (s) => {
  if (s === 'PUBLISHED') return { bg: '#ECFDF5', text: '#059669' };
  if (s === 'DRAFT') return { bg: '#F3F4F6', text: '#6B7280' };
  if (s === 'COMPLETED') return { bg: '#EFF6FF', text: '#2563EB' };
  return { bg: '#FFF1F3', text: colors.primary };
};

const CampaignListScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const confirm = useConfirm();
  const HOSPITAL = useMyHospital();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await campaignService.list();
      setList(data.campaigns || []);
    } catch (e) {
      Alert.alert('Error', 'Failed to load campaigns.');
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

  const handleDelete = async (item) => {
    const ok = await confirm({
      title: 'Delete Campaign',
      message: `Permanently delete "${item.name}"?`,
      confirmText: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      setBusyId(item._id);
      await campaignService.remove(item._id);
      await load();
      Alert.alert('Deleted', 'Campaign removed.');
    } catch (e) {
      Alert.alert('Error', 'Failed to delete.');
    } finally {
      setBusyId(null);
    }
  };

  const renderItem = ({ item }) => {
    const theme = statusColor(item.status);
    const busy = busyId === item._id;
    const groups = item.targetBloodGroups || [];

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={[styles.statusPill, { backgroundColor: theme.bg }]}>
            <Text style={[styles.statusText, { color: theme.text }]}>
              {item.status}
            </Text>
          </View>
          <Text style={styles.dateText}>
            {new Date(item.preferredDate).toLocaleDateString()}
          </Text>
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.name}
        </Text>

        <View style={styles.chipRow}>
          {groups.map((g) => (
            <View key={g} style={styles.chip}>
              <Text style={styles.chipText}>{g}</Text>
            </View>
          ))}
        </View>

        <View style={styles.venueRow}>
          <Ionicons
            name={item.venue?.type === 'HOSPITAL' ? 'business' : 'location'}
            size={13}
            color={colors.textMuted}
          />
          <Text style={styles.venueText} numberOfLines={1}>
            {item.venue?.name}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.editBtn, busy && { opacity: 0.5 }]}
            onPress={() => navigation.navigate('EditCampaign', { campaign: item })}
            disabled={busy}
          >
            <Ionicons name="pencil" size={14} color={colors.primary} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deleteBtn, busy && { opacity: 0.5 }]}
            onPress={() => handleDelete(item)}
            disabled={busy}
          >
            <Ionicons name="trash-outline" size={14} color={colors.primary} />
            <Text style={styles.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ✅ Menu icon (sidebar) — no back arrow */}
      <AppHeader
        navigation={navigation}
        onMenuPress={() => setSidebarOpen(true)}
      />

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="megaphone-outline" size={44} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No campaigns yet</Text>
              <Text style={styles.emptySub}>
                Tap below to create your first donation drive.
              </Text>
            </View>
          }
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerBtn}
          onPress={() => navigation.navigate('OrganizeDrive')}
        >
          <Ionicons name="add" size={18} color={colors.white} />
          <Text style={styles.footerText}>CREATE NEW CAMPAIGN</Text>
        </TouchableOpacity>
      </View>

      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        onComingSoon={comingSoon}
        menu={OFFICER_MENU}
        variant="staff"
        activeKey="Donation Campaigns"
        hospital={HOSPITAL}
      />
    </SafeAreaView>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.page },
  list: { padding: 16, paddingBottom: 100 },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.3 },
  dateText: { fontSize: 11, color: colors.textMuted, fontWeight: '700' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
  },
  chipText: { fontSize: 10, fontWeight: '800', color: colors.primary },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  venueText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  actionRow: { flexDirection: 'row', gap: 10 },
  editBtn: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.primary,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  deleteBtn: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 6 },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 6 },
  emptySub: { fontSize: 12, color: colors.textSecondary },
  footer: { position: 'absolute', left: 16, right: 16, bottom: 20 },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
  },
  footerText: { color: colors.white, fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
});

export default CampaignListScreen;
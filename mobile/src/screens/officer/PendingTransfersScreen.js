import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
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
import { transferService } from '../../services/officerService';
import { colors } from '../../utils/colors';

const statusColor = (s) => {
  if (s === 'PENDING') return '#F59E0B';
  if (s === 'APPROVED') return '#3B82F6';
  if (s === 'COMPLETED') return colors.success;
  if (s === 'REJECTED' || s === 'CANCELLED') return colors.primary;
  return colors.textSecondary;
};

const PendingTransfersScreen = ({ navigation }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await transferService.list();
      setList(data.transfers || []);
    } catch (e) {
      Alert.alert('Error', 'Failed to load transfers.');
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

  const handleApprove = async (item) => {
    try {
      await transferService.update(item._id, { status: 'APPROVED' });
      load();
    } catch (e) {
      Alert.alert('Error', 'Failed to approve.');
    }
  };

  const handleCancel = (item) => {
    Alert.alert('Cancel Transfer', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          try {
            await transferService.update(item._id, { status: 'CANCELLED' });
            load();
          } catch (e) {
            Alert.alert('Error', 'Failed to cancel.');
          }
        },
      },
    ]);
  };

  const handleDelete = (item) => {
    Alert.alert('Delete', 'Permanently remove?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await transferService.remove(item._id);
            load();
          } catch (e) {
            Alert.alert('Error', 'Failed to delete.');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.bloodBadge}>
          <Text style={styles.bloodText}>{item.bloodGroup}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.titleText}>
            {item.units} units • {item.urgency}
          </Text>
          <Text style={styles.subText}>
            {item.sourceBank} → {item.destinationHospital}
          </Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: `${statusColor(item.status)}20` }]}>
          <Text style={[styles.statusText, { color: statusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <Text style={styles.reason}>{item.reason}</Text>

      {item.status === 'PENDING' && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => handleApprove(item)}>
            <Text style={styles.primaryText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.outlineBtn} onPress={() => handleCancel(item)}>
            <Text style={styles.outlineText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item)}>
            <Ionicons name="trash-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pending Transfer Log</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="swap-horizontal-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>No transfer requests yet.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  list: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.cardBorder },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  bloodBadge: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  bloodText: { fontSize: 14, fontWeight: '800', color: colors.primary },
  titleText: { fontSize: 14, fontWeight: '800', color: colors.text },
  subText: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '800' },
  reason: { fontSize: 12, color: colors.textSecondary, marginTop: 10, lineHeight: 17 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' },
  primaryBtn: { flex: 1, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: colors.white, fontWeight: '800', fontSize: 12 },
  outlineBtn: { flex: 1, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  outlineText: { color: colors.text, fontWeight: '800', fontSize: 12 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { marginTop: 10, color: colors.textSecondary },
});

export default PendingTransfersScreen;
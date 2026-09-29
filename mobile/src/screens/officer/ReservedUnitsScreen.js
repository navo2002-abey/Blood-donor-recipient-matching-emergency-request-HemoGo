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
import { reservationService } from '../../services/officerService';
import { colors } from '../../utils/colors';

const HOSPITAL = 'Colombo General Hospital Blood Bank';

const ReservedUnitsScreen = ({ navigation }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await reservationService.list({ hospital: HOSPITAL });
      setList(data.reservations || []);
    } catch (e) {
      Alert.alert('Error', 'Failed to load reservations.');
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

  const handleRelease = (item) => {
    Alert.alert('Release Unit', `Return this unit to available stock?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Release',
        onPress: async () => {
          try {
            await reservationService.update(item._id, { status: 'RELEASED' });
            load();
          } catch (e) {
            Alert.alert('Error', 'Failed to release.');
          }
        },
      },
    ]);
  };

  const handleMarkUsed = (item) => {
    Alert.alert('Mark Used', `Mark this unit as used?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark Used',
        onPress: async () => {
          try {
            await reservationService.update(item._id, { status: 'USED' });
            load();
          } catch (e) {
            Alert.alert('Error', 'Failed to update.');
          }
        },
      },
    ]);
  };

  const handleDelete = (item) => {
    Alert.alert('Cancel Reservation', 'This will remove the reservation.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await reservationService.remove(item._id);
            load();
          } catch (e) {
            Alert.alert('Error', 'Failed to delete.');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const isReserved = item.status === 'RESERVED';
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.unitBadge}>
            <Text style={styles.unitId}>{item.unitId}</Text>
          </View>
          <View style={styles.bloodBadge}>
            <Text style={styles.bloodText}>{item.bloodGroup}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.patient}>{item.patientName}</Text>
            <Text style={styles.ward}>{item.ward}</Text>
          </View>
          <View style={[styles.statusPill, !isReserved && styles.statusPillDone]}>
            <Text style={[styles.statusText, !isReserved && styles.statusTextDone]}>
              {item.status}
            </Text>
          </View>
        </View>

        <Text style={styles.subInfo}>
          Reserved: {new Date(item.reservedAt).toLocaleString()}
        </Text>

        {isReserved && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleRelease(item)}
            >
              <Text style={styles.actionText}>Release</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionPrimary]}
              onPress={() => handleMarkUsed(item)}
            >
              <Text style={styles.actionPrimaryText}>Mark Used</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item)}>
              <Ionicons name="trash-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reserved Units</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.navigate('CreateReservation')}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
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
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="bookmark-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyText}>No reservations yet.</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('CreateReservation')}
              >
                <Text style={styles.emptyBtnText}>Create New Reservation</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerBtn}
          onPress={() => navigation.navigate('CreateReservation')}
        >
          <Text style={styles.footerText}>+ CREATE NEW RESERVATION</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  list: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: colors.white, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  unitBadge: { paddingHorizontal: 8, paddingVertical: 6, backgroundColor: colors.inputBg, borderRadius: 8 },
  unitId: { fontSize: 11, fontWeight: '800', color: colors.text },
  bloodBadge: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.primarySoft, borderRadius: 8 },
  bloodText: { fontSize: 12, fontWeight: '800', color: colors.primary },
  patient: { fontSize: 14, fontWeight: '800', color: colors.text },
  ward: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: colors.primarySoft, borderRadius: 10 },
  statusPillDone: { backgroundColor: '#F4F4F6' },
  statusText: { fontSize: 10, fontWeight: '800', color: colors.primary },
  statusTextDone: { color: colors.textSecondary },
  subInfo: { fontSize: 11, color: colors.textMuted, marginTop: 10 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' },
  actionBtn: { flex: 1, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  actionPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  actionText: { fontSize: 12, fontWeight: '800', color: colors.primary },
  actionPrimaryText: { fontSize: 12, fontWeight: '800', color: colors.white },
  iconBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { marginTop: 10, color: colors.textSecondary, fontSize: 14 },
  emptyBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 22, backgroundColor: colors.primary },
  emptyBtnText: { color: colors.white, fontWeight: '800', fontSize: 13 },
  footer: { position: 'absolute', left: 16, right: 16, bottom: 20 },
  footerBtn: { height: 52, borderRadius: 26, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  footerText: { color: colors.white, fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
});

export default ReservedUnitsScreen;
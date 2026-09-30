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
import { bloodBankService } from '../../services/officerService';
import { colors } from '../../utils/colors';

const GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

const NearbyBloodBanksScreen = ({ navigation }) => {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await bloodBankService.list();
      setBanks(data.bloodBanks || []);
    } catch (e) {
      Alert.alert('Error', 'Failed to load blood banks.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nearby Blood Banks Stock</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <Text style={styles.title}>Nearby Blood Banks Stock</Text>
        <Text style={styles.subtitle}>
          Find blood stock availability at nearby hospitals and blood banks.
        </Text>

        <View style={styles.mapPlaceholder}>
          <Ionicons name="map-outline" size={40} color={colors.textMuted} />
          <Text style={styles.mapText}>📍 5 km radius · Colombo</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} />
        ) : (
          banks.map((bank) => (
            <TouchableOpacity
              key={bank._id}
              style={styles.card}
              onPress={() => navigation.navigate('BloodBankDetails', { id: bank._id })}
            >
              <View style={styles.cardTop}>
                <View style={styles.iconBox}>
                  <Ionicons name="business-outline" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.bankName}>{bank.name}</Text>
                  <Text style={styles.bankAddr}>
                    📍 {bank.address} • {bank.operatingHours}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </View>

              <View style={styles.groupGrid}>
                {GROUPS.map((g) => (
                  <View key={g} style={styles.groupCell}>
                    <Text style={styles.groupLabel}>{g}</Text>
                    <Text style={styles.groupValue}>{bank.stock?.[g] || 0}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))
        )}

        <TouchableOpacity style={styles.openMapBtn} onPress={() => Alert.alert('Map', 'Open map view.')}>
          <Text style={styles.openMapText}>Open Map</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  scroll: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 6, marginBottom: 16 },
  mapPlaceholder: { height: 140, borderRadius: 16, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 16 },
  mapText: { fontSize: 12, color: colors.textSecondary, marginTop: 8, fontWeight: '600' },
  card: { backgroundColor: colors.white, borderRadius: 18, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.cardBorder },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  bankName: { fontSize: 14, fontWeight: '800', color: colors.text },
  bankAddr: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  groupGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  groupCell: { flex: 1, minWidth: 52, backgroundColor: '#F9FAFB', borderRadius: 10, padding: 8, alignItems: 'center' },
  groupLabel: { fontSize: 10, fontWeight: '800', color: colors.text },
  groupValue: { fontSize: 16, fontWeight: '800', color: colors.primary, marginTop: 2 },
  openMapBtn: { height: 52, borderRadius: 26, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  openMapText: { color: colors.white, fontWeight: '800', fontSize: 14 },
});

export default NearbyBloodBanksScreen;
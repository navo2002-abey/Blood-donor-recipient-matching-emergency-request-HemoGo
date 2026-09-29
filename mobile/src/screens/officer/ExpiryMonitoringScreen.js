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
import { stockService } from '../../services/officerService';
import { colors } from '../../utils/colors';

const daysLeft = (date) => {
  const diff = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const badgeColor = (days) => {
  if (days <= 3) return colors.primary;
  if (days <= 7) return '#F59E0B';
  return colors.textSecondary;
};

const ExpiryMonitoringScreen = ({ navigation }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await stockService.expiring(14);
      setList(data.stock || []);
    } catch (e) {
      Alert.alert('Error', 'Failed to load expiry data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const renderItem = ({ item }) => {
    const days = daysLeft(item.expiryDate);
    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.bloodBadge}>
            <Text style={styles.bloodText}>{item.bloodGroup}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.units}>{item.units} units</Text>
            <Text style={styles.hospital}>{item.hospital}</Text>
          </View>
          <View style={[styles.daysBadge, { backgroundColor: badgeColor(days) }]}>
            <Text style={styles.daysText}>{days} DAYS</Text>
          </View>
        </View>
        <Text style={styles.expiry}>
          Expires: {new Date(item.expiryDate).toLocaleDateString()}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Expiry Monitoring</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.banner}>
        <Ionicons name="hourglass-outline" size={22} color={colors.primary} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.bannerTitle}>Track units nearing expiration</Text>
          <Text style={styles.bannerSub}>Showing units expiring within 14 days</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
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
              <Ionicons name="checkmark-circle-outline" size={40} color={colors.success} />
              <Text style={styles.emptyText}>No units expiring soon.</Text>
            </View>
          }
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerBtn} onPress={load}>
          <Text style={styles.footerText}>EXPORT EXPIRY REPORT</Text>
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
  banner: { flexDirection: 'row', alignItems: 'center', margin: 16, padding: 14, backgroundColor: colors.primarySoft, borderRadius: 16 },
  bannerTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
  bannerSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.cardBorder },
  row: { flexDirection: 'row', alignItems: 'center' },
  bloodBadge: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  bloodText: { fontSize: 16, fontWeight: '800', color: colors.primary },
  units: { fontSize: 15, fontWeight: '800', color: colors.text },
  hospital: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  daysBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  daysText: { color: colors.white, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  expiry: { marginTop: 10, fontSize: 12, color: colors.textSecondary },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { marginTop: 10, color: colors.textSecondary },
  footer: { position: 'absolute', left: 16, right: 16, bottom: 20 },
  footerBtn: { height: 52, borderRadius: 26, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  footerText: { color: colors.white, fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
});

export default ExpiryMonitoringScreen;
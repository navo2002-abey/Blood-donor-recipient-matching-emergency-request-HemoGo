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
import { predictionService } from '../../services/officerService';
import { colors } from '../../utils/colors';

const riskColor = (level) => {
  if (level === 'CRITICAL') return colors.primary;
  if (level === 'HIGH') return '#F59E0B';
  return '#3B82F6';
};

const riskBg = (level) => {
  if (level === 'CRITICAL') return '#FFF1F3';
  if (level === 'HIGH') return '#FFFBEB';
  return '#EFF6FF';
};

const AIPredictionScreen = ({ navigation }) => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await predictionService.list();
      setPredictions(data.predictions || []);
    } catch (e) {
      Alert.alert('Error', 'Failed to load predictions.');
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
        <Text style={styles.headerTitle}>AI Shortage Predictions</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <Text style={styles.title}>AI Shortage Predictions</Text>
        <Text style={styles.subtitle}>
          AI-powered prediction for upcoming blood demand and potential shortages.
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : predictions.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={40} color={colors.success} />
            <Text style={styles.emptyText}>All blood groups are well stocked.</Text>
          </View>
        ) : (
          predictions.map((p, idx) => (
            <View
              key={`${p.bloodGroup}-${idx}`}
              style={[styles.card, { backgroundColor: riskBg(p.riskLevel), borderColor: riskColor(p.riskLevel) }]}
            >
              <View style={styles.cardTop}>
                <View style={styles.iconCircle}>
                  <Ionicons name="warning-outline" size={18} color={riskColor(p.riskLevel)} />
                </View>
                <Text style={[styles.cardTitle, { color: riskColor(p.riskLevel) }]}>
                  {p.riskLevel} Prediction ({p.bloodGroup})
                </Text>
                <View style={[styles.riskPill, { backgroundColor: riskColor(p.riskLevel) }]}>
                  <Text style={styles.riskPillText}>{p.riskLevel}</Text>
                </View>
              </View>

              <Text style={styles.cardBody}>
                Potential {p.bloodGroup} shortage within {p.predictedDays} days.
              </Text>
              <Text style={styles.cardReason}>Reason: {p.reason}</Text>

              <View style={styles.divider} />

              <Text style={[styles.recommend, { color: riskColor(p.riskLevel) }]}>
                Recommended Action: {p.recommendedAction}
              </Text>
            </View>
          ))
        )}

        <TouchableOpacity
          style={styles.organizeBtn}
          onPress={() => navigation.navigate('OrganizeDrive')}
        >
          <Text style={styles.organizeText}>Organize donation drive</Text>
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
  card: { borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  iconCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '800' },
  riskPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  riskPillText: { color: colors.white, fontSize: 10, fontWeight: '800' },
  cardBody: { fontSize: 14, fontWeight: '700', color: colors.text },
  cardReason: { fontSize: 12, color: colors.textSecondary, marginTop: 6 },
  divider: { height: 1, backgroundColor: '#00000010', marginVertical: 12 },
  recommend: { fontSize: 13, fontWeight: '800' },
  organizeBtn: { height: 54, borderRadius: 27, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  organizeText: { color: colors.white, fontWeight: '800', fontSize: 14 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { marginTop: 10, color: colors.textSecondary },
});

export default AIPredictionScreen;
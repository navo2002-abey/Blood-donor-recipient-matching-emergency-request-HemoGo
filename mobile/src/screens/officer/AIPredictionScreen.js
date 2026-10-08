import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
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
import Svg, { Path, Rect } from 'react-native-svg';
import AppHeader from '../../components/AppHeader';
import Sidebar from '../../components/Sidebar';
import { useMyHospital } from '../../hooks/useMyHospital';
import { predictionService } from '../../services/officerService';
import { colors } from '../../utils/colors';
import { OFFICER_MENU } from '../../utils/roles';
import { useTheme } from '../../context/ThemeContext';

const comingSoon = (label) =>
  Alert.alert('Coming Soon', `${label} will be available soon.`);

const riskTheme = (riskLevel) => {
  switch (riskLevel) {
    case 'CRITICAL':
      return { label: 'Critical', color: '#DC2626', bg: '#FEE2E2', border: '#FECACA' };
    case 'HIGH':
      return { label: 'High', color: colors.primary, bg: '#FFF1F3', border: '#FEE2E2' };
    case 'MEDIUM':
      return { label: 'Medium', color: '#D97706', bg: '#FFFBEB', border: '#FEF3C7' };
    default:
      return { label: 'Low', color: '#059669', bg: '#ECFDF5', border: '#D1FAE5' };
  }
};

const AIPredictionScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const HOSPITAL = useMyHospital();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [predictions, setPredictions] = useState([]);

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
  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation, load]);

  const chartValues = predictions.length > 0
    ? predictions.slice(0, 6).map((p) => p.predictedDays || 3)
    : [5, 3, 7, 4, 6, 2];

  const buildChartPath = () => {
    const count = chartValues.length;
    if (count === 0) return 'M 20 90';
    const maxVal = Math.max(...chartValues, 1);
    const step = 280 / Math.max(count - 1, 1);
    const points = chartValues.map((val, i) => ({
      x: 20 + step * i,
      y: 100 - (val / maxVal) * 70,
    }));
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  };

  const renderChart = () => (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>Demand Forecast</Text>
        <TouchableOpacity
          style={styles.dropdownBtn}
          onPress={() => comingSoon('Change window')}
        >
          <Text style={styles.dropdownText}>Next 7 days</Text>
          <Ionicons name="caret-down" size={12} color={colors.text} />
        </TouchableOpacity>
      </View>
      <View style={styles.chartContent}>
        <Svg width="100%" height="120" viewBox="0 0 300 120">
          <Rect x="20" y="60" width="10" height="40" fill="#FFF1F3" rx="2" />
          <Rect x="80" y="45" width="10" height="55" fill="#FFF1F3" rx="2" />
          <Rect x="140" y="55" width="10" height="45" fill="#FFF1F3" rx="2" />
          <Rect x="200" y="35" width="10" height="65" fill="#FFF1F3" rx="2" />
          <Rect x="260" y="25" width="10" height="75" fill="#FCA5A5" rx="2" />
          <Path
            d={buildChartPath()}
            fill="none"
            stroke={colors.primary}
            strokeWidth="4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </Svg>
      </View>
      <View style={styles.chartLabels}>
        <Text style={styles.axisLabel}>Day 1</Text>
        <Text style={styles.axisLabel}>Day 3</Text>
        <Text style={styles.axisLabel}>Day 5</Text>
        <Text style={styles.axisLabel}>Day 7</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ✅ Reusable header — bell + menu + dynamic red dot */}
      <AppHeader
        navigation={navigation}
        onMenuPress={() => setSidebarOpen(true)}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
          />
        }
      >
        <Text style={styles.pageTitle}>AI Shortage Predictions</Text>
        <Text style={styles.pageSubtitle}>
          AI-powered prediction for {HOSPITAL}.
        </Text>

        {renderChart()}

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : predictions.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={44} color={colors.success} />
            <Text style={styles.emptyTitle}>All blood groups well stocked</Text>
            <Text style={styles.emptySub}>No shortage predictions at this time.</Text>
          </View>
        ) : (
          predictions.map((p, idx) => {
            const theme = riskTheme(p.riskLevel);
            return (
              <View
                key={`${p.bloodGroup}-${idx}`}
                style={[
                  styles.predictionCard,
                  { backgroundColor: theme.bg, borderColor: theme.border },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.titleWrap}>
                    <Ionicons
                      name="warning"
                      size={20}
                      color={theme.color}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={[styles.cardTitle, { color: theme.color }]}>
                      {theme.label} Prediction ({p.bloodGroup})
                    </Text>
                  </View>
                  <View style={[styles.riskBadge, { backgroundColor: theme.border }]}>
                    <Text style={[styles.riskBadgeText, { color: theme.color }]}>
                      {theme.label}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardBoldText}>
                  Potential {p.bloodGroup} shortage within {p.predictedDays} days.
                </Text>
                <Text style={styles.cardReasonText}>Reason: {p.reason}</Text>
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() =>
                    navigation.navigate('OrganizeDrive', { bloodGroups: [p.bloodGroup] })
                  }
                >
                  <Text style={[styles.actionText, { color: theme.color }]}>
                    Recommended Action: {p.recommendedAction}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={theme.color} />
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('OrganizeDrive')}
        >
          <Text style={styles.primaryButtonText}>Organize donation drive</Text>
        </TouchableOpacity>
      </View>

      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        onComingSoon={comingSoon}
        menu={OFFICER_MENU}
        variant="staff"
        activeKey="AI Shortage Prediction"
        hospital={HOSPITAL}
      />
    </SafeAreaView>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cardBg },
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },

  pageTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 6 },
  pageSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 20,
  },

  chartCard: {
    borderWidth: 1,
    borderColor: '#FEF2F2',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    backgroundColor: colors.cardBg,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  chartTitle: { fontSize: 13, fontWeight: '800', color: colors.text },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dropdownText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    marginRight: 6,
  },
  chartContent: { height: 120, position: 'relative' },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 10,
  },
  axisLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },

  predictionCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleWrap: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  riskBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  riskBadgeText: { fontSize: 10, fontWeight: '800' },
  cardBoldText: { fontSize: 13, fontWeight: '800', color: colors.text, marginBottom: 6 },
  cardReasonText: { fontSize: 11, color: colors.textSecondary, marginBottom: 12 },
  divider: { height: 1, width: '100%', marginBottom: 12 },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionText: { fontSize: 12, fontWeight: '800', flex: 1 },

  empty: {
    alignItems: 'center',
    paddingVertical: 50,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    gap: 8,
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 4 },
  emptySub: { fontSize: 12, color: colors.textSecondary },

  bottomContainer: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: { color: colors.white, fontSize: 14, fontWeight: '800' },
});

export default AIPredictionScreen;
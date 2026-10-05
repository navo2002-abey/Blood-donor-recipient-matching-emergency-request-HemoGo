import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState, useMemo } from 'react';
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
import Svg, { Circle, Line, Rect, Text as SvgText } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BloodDrop } from '../components/Logo';
import Sidebar from '../components/Sidebar';
import { useLanguage } from '../context/LanguageContext';
import { fetchAdminReport } from '../services/adminService';
import { colors } from '../utils/colors';
import { ADMIN_MENU, ROLE_LABELS } from '../utils/roles';
import { useTheme } from '../context/ThemeContext';

const STATUS_LABELS = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  ACCEPTED: 'Accepted',
  ARRIVED: 'Arrived',
  VERIFIED: 'Verified',
  MATCHED: 'Matched',
  FULFILLED: 'Fulfilled',
  CANCELLED: 'Cancelled',
  PENDING: 'Pending',
  APPROVED: 'Approved',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
};

const labelFor = (key, t) => {
  if (ROLE_LABELS[key]) return t(`roles.${key}`);
  const status = t(`status.${key}`);
  if (status !== `status.${key}`) return status;
  return STATUS_LABELS[key] || String(key || '').replace(/_/g, ' ');
};

const formatWhen = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const CHART_COLORS = ['#E31E35', '#F59E0B', '#2563EB', '#22C55E', '#8B5CF6', '#0EA5E9', '#EC4899', '#64748B'];

const URGENCY_COLORS = {
  Critical: '#E31E35',
  High: '#EA580C',
  Medium: '#F59E0B',
  Low: '#6B7280',
};

const withColors = (entries) =>
  entries.map(([label, value], index) => ({
    label,
    value,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

const DonutChart = ({ slices, centerValue, centerLabel }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const size = 168;
  const stroke = 22;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const drawn = slices.filter((item) => item.value > 0);
  const total = drawn.reduce((sum, item) => sum + item.value, 0);
  let cursor = 0;

  return (
    <View style={styles.chartBlock}>
      <View style={styles.donutWrap}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#F4F4F6"
            strokeWidth={stroke}
            fill="none"
          />
          {total > 0 &&
            drawn.map((item) => {
              const length = Math.min((item.value / total) * circumference, circumference - 0.01);
              const segment = (
                <Circle
                  key={item.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={item.color}
                  strokeWidth={stroke}
                  fill="none"
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-cursor}
                  rotation={-90}
                  origin={`${size / 2}, ${size / 2}`}
                />
              );
              cursor += length;
              return segment;
            })}
        </Svg>
        <View style={styles.donutCenter} pointerEvents="none">
          <Text style={styles.donutValue}>{centerValue}</Text>
          <Text style={styles.donutCaption}>{centerLabel}</Text>
        </View>
      </View>
      <View style={styles.legendGrid}>
        {slices.map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>
              {item.label} · {item.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const ColumnChart = ({ categories, series }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [width, setWidth] = useState(0);
  const height = 196;
  const pad = { left: 28, right: 6, top: 10, bottom: 28 };
  const max = Math.max(1, ...series.flatMap((item) => item.values));
  const chartWidth = Math.max(width, 280);
  const innerWidth = chartWidth - pad.left - pad.right;
  const innerHeight = height - pad.top - pad.bottom;
  const groupWidth = categories.length ? innerWidth / categories.length : innerWidth;
  const barWidth = Math.max(4, Math.min(12, (groupWidth - 10) / Math.max(series.length, 1)));
  const ticks = [max, Math.round(max / 2), 0];

  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      <View style={styles.legend}>
        {series.map((item) => (
          <View key={item.name} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>{item.name}</Text>
          </View>
        ))}
      </View>
      <Svg width={chartWidth} height={height}>
        {ticks.map((tick) => {
          const y = pad.top + innerHeight - (tick / max) * innerHeight;
          return (
            <React.Fragment key={tick}>
              <Line x1={pad.left} y1={y} x2={chartWidth - pad.right} y2={y} stroke="#F0F0F2" strokeWidth={1} />
              <SvgText x={0} y={y + 4} fill="#9CA3AF" fontSize="10">
                {tick}
              </SvgText>
            </React.Fragment>
          );
        })}
        {categories.map((category, index) => {
          const groupX = pad.left + index * groupWidth;
          const barsWidth = series.length * barWidth + (series.length - 1) * 2;
          const startX = groupX + (groupWidth - barsWidth) / 2;
          return (
            <React.Fragment key={category}>
              {series.map((item, seriesIndex) => {
                const value = item.values[index] || 0;
                const barHeight = (value / max) * innerHeight;
                return (
                  <Rect
                    key={`${category}-${item.name}`}
                    x={startX + seriesIndex * (barWidth + 2)}
                    y={pad.top + innerHeight - barHeight}
                    width={barWidth}
                    height={barHeight}
                    rx={3}
                    fill={item.color}
                  />
                );
              })}
              <SvgText
                x={groupX + groupWidth / 2}
                y={height - 8}
                fill="#6B7280"
                fontSize="10"
                fontWeight="700"
                textAnchor="middle"
              >
                {category}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
};

const AdminReportsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadReport = useCallback(async () => {
    try {
      const data = await fetchAdminReport();
      setReport(data);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load reports right now.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      loadReport().finally(() => {
        if (active) setLoading(false);
      });
      return () => {
        active = false;
      };
    }, [loadReport])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReport();
    setRefreshing(false);
  };

  const users = report?.users || { active: 0, inactive: 0, byRole: {} };
  const requests = report?.requests || {
    total: 0,
    thisWeek: 0,
    byStatus: {},
    byUrgency: {},
    unitsRequested: 0,
    unitsFulfilled: 0,
    recent: [],
  };
  const groups = report?.bloodGroups || [];
  const fulfillment = requests.unitsRequested
    ? Math.round((requests.unitsFulfilled / requests.unitsRequested) * 100)
    : 0;
  const remainingUnits = Math.max(requests.unitsRequested - requests.unitsFulfilled, 0);
  const roleSlices = withColors(Object.entries(users.byRole).map(([role, count]) => [labelFor(role, t), count]));
  const urgencyLabel = {
    Critical: t('pages.criticalLevel'),
    High: t('pages.high'),
    Medium: t('pages.medium'),
    Low: t('pages.low'),
  };
  const urgencySlices = ['Critical', 'High', 'Medium', 'Low'].map((key) => ({
    label: urgencyLabel[key],
    value: requests.byUrgency[key] || 0,
    color: URGENCY_COLORS[key],
  }));
  const statusSlices = withColors(Object.entries(requests.byStatus).map(([status, count]) => [labelFor(status, t), count]));
  const campaignSlices = withColors(Object.entries(report?.campaigns || {}).map(([status, count]) => [labelFor(status, t), count]));
  const transferSlices = withColors(Object.entries(report?.transfers || {}).map(([status, count]) => [labelFor(status, t), count]));

  const summary = [
    { label: t('reports.activeUsers'), value: users.active, icon: 'people-outline' },
    { label: t('reports.requestsCenter'), value: requests.total, icon: 'water-outline' },
    { label: t('reports.thisWeek'), value: requests.thisWeek, icon: 'calendar-outline' },
    { label: t('reports.bloodBanks'), value: report?.bloodBanks || 0, icon: 'business-outline' },
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
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text style={styles.title}>{t('reports.title')}</Text>
        <Text style={styles.subtitle}>{t('reports.subtitle')}</Text>

        {loading && !report ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : error && !report ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{error}</Text>
            <TouchableOpacity onPress={onRefresh}>
              <Text style={styles.retry}>{t('reports.tryAgain')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.statGrid}>
              {summary.map((card) => (
                <View key={card.label} style={styles.statCard}>
                  <Ionicons name={card.icon} size={16} color={colors.primary} />
                  <Text style={styles.statValue}>{card.value}</Text>
                  <Text style={styles.statLabel}>{card.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>{t('reports.fulfillment')}</Text>
              <Text style={styles.panelCopy}>
                {t('reports.fulfillmentCopy', { done: requests.unitsFulfilled, total: requests.unitsRequested })}
              </Text>
              <DonutChart
                centerValue={`${fulfillment}%`}
                centerLabel={t('reports.fulfilled')}
                slices={[
                  { label: t('reports.fulfilled'), value: requests.unitsFulfilled, color: colors.success },
                  { label: t('reports.remaining'), value: remainingUnits, color: '#F7C4CB' },
                ]}
              />
              <Text style={styles.meta}>{t('reports.inactiveAccounts', { count: users.inactive })}</Text>
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>{t('reports.demand')}</Text>
              <ColumnChart
                categories={groups.map((item) => item.group)}
                series={[
                  { name: t('reports.requested'), color: colors.primary, values: groups.map((item) => item.unitsRequested) },
                  { name: t('reports.available'), color: colors.success, values: groups.map((item) => item.unitsAvailable) },
                ]}
              />
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>{t('reports.usersByRole')}</Text>
              {roleSlices.length === 0 ? (
                <Text style={styles.meta}>{t('reports.noUsers')}</Text>
              ) : (
                <DonutChart
                  slices={roleSlices}
                  centerValue={roleSlices.reduce((sum, item) => sum + item.value, 0)}
                  centerLabel={t('reports.usersCenter')}
                />
              )}
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>{t('reports.urgency')}</Text>
              {urgencySlices.every((item) => item.value === 0) ? (
                <Text style={styles.meta}>{t('reports.noRequests')}</Text>
              ) : (
                <DonutChart
                  slices={urgencySlices}
                  centerValue={urgencySlices.reduce((sum, item) => sum + item.value, 0)}
                  centerLabel={t('reports.requestsCenter')}
                />
              )}
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>{t('reports.status')}</Text>
              {statusSlices.length === 0 ? (
                <Text style={styles.meta}>{t('reports.noRequests')}</Text>
              ) : (
                <DonutChart
                  slices={statusSlices}
                  centerValue={statusSlices.reduce((sum, item) => sum + item.value, 0)}
                  centerLabel={t('reports.requestsCenter')}
                />
              )}
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>{t('reports.campaigns')}</Text>
              {campaignSlices.length === 0 ? (
                <Text style={styles.meta}>{t('reports.noCampaigns')}</Text>
              ) : (
                <DonutChart
                  slices={campaignSlices}
                  centerValue={campaignSlices.reduce((sum, item) => sum + item.value, 0)}
                  centerLabel={t('reports.campaigns')}
                />
              )}
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>{t('reports.transfers')}</Text>
              {transferSlices.length === 0 ? (
                <Text style={styles.meta}>{t('reports.noTransfers')}</Text>
              ) : (
                <DonutChart
                  slices={transferSlices}
                  centerValue={transferSlices.reduce((sum, item) => sum + item.value, 0)}
                  centerLabel={t('reports.transfers')}
                />
              )}
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>{t('reports.latest')}</Text>
              {requests.recent.length === 0 ? (
                <Text style={styles.meta}>{t('reports.noRequests')}</Text>
              ) : (
                requests.recent.map((item) => (
                  <View key={item.id} style={styles.requestRow}>
                    <View style={styles.requestCopy}>
                      <Text style={styles.requestTitle}>
                        {item.bloodGroup} · {item.patientName}
                      </Text>
                      <Text style={styles.meta}>
                        {item.hospital} · {item.units} unit{item.units === 1 ? '' : 's'}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.requestStatus}>{labelFor(item.status, t)}</Text>
                      <Text style={styles.meta}>{formatWhen(item.createdAt)}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        onComingSoon={(feature) => Alert.alert('Coming Soon', `${feature} will be available in a later version.`)}
        menu={ADMIN_MENU}
        variant="staff"
        activeKey="Reports & Analytics"
        org="HemoGo National Network"
      />
    </SafeAreaView>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.page },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandText: { color: colors.primary, fontSize: 18, fontWeight: '800' },
  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 28 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { marginTop: 2, marginBottom: 14, fontSize: 13, color: colors.textSecondary },
  loader: { marginTop: 40 },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.text, textAlign: 'center' },
  retry: { marginTop: 10, color: colors.primary, fontWeight: '800' },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  statCard: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 12,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 8 },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2, fontWeight: '600' },
  panel: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  panelTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 6 },
  panelCopy: { fontSize: 13, color: colors.textSecondary, marginBottom: 10, lineHeight: 18 },
  percent: { marginTop: 6, fontSize: 13, fontWeight: '800', color: colors.text },
  meta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  chartBlock: { alignItems: 'center', marginTop: 4 },
  donutWrap: { width: 168, height: 168, alignItems: 'center', justifyContent: 'center' },
  donutCenter: { position: 'absolute', alignItems: 'center' },
  donutValue: { fontSize: 22, fontWeight: '800', color: colors.text },
  donutCaption: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  legendGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 10,
  },
  requestCopy: { flex: 1 },
  requestTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
  requestStatus: { fontSize: 12, fontWeight: '800', color: colors.primary, textAlign: 'right' },
});

export default AdminReportsScreen;

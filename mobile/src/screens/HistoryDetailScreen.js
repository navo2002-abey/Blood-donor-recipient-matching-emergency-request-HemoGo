import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BloodDrop } from '../components/Logo';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../utils/colors';
import { useTheme } from '../context/ThemeContext';

const HistoryDetailScreen = ({ route, navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLanguage();
  const { appointment } = route.params || {};

  const qrData = JSON.stringify({
    id: appointment.bookedAt,
    hospital: appointment.hospital,
    date: appointment.date,
    time: appointment.time,
    completed: appointment.completed || false,
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerBtn} />
        <View style={styles.brand}>
          <BloodDrop size={16} />
          <Text style={styles.brandText}>HemoGo</Text>
        </View>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('pages.appointmentDetails')}</Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.statusBadge, appointment.completed && styles.statusBadgeCompleted]}>
              <Text style={[styles.statusText, appointment.completed && styles.statusTextCompleted]}>
                {appointment.completed ? 'Completed' : 'Confirmed'}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="heart-outline" size={20} color={colors.primary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Hospital</Text>
              <Text style={styles.detailValue}>{appointment.hospital}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{appointment.date}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>{appointment.time}</Text>
            </View>
          </View>

          {appointment.completed && (
            <View style={styles.detailRow}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Completed At</Text>
                <Text style={styles.detailValue}>
                  {new Date(appointment.completedAt).toLocaleString()}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.qrSection}>
          <Text style={styles.qrTitle}>Your QR Code</Text>
          <Text style={styles.qrSubtitle}>Show this code at the hospital</Text>
          
          <View style={styles.qrCard}>
            <QRCode
              value={qrData}
              size={200}
              color="black"
              backgroundColor="white"
            />
          </View>
          
          <Text style={styles.qrNote}>
            Scan this QR code to verify your appointment
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.page,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerBtn: {
    width: 36,
    height: 36,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 20,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 20,
    marginBottom: 24,
  },
  cardHeader: {
    marginBottom: 20,
  },
  statusBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusBadgeCompleted: {
    backgroundColor: colors.success,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  statusTextCompleted: {
    color: colors.white,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  qrSection: {
    alignItems: 'center',
  },
  qrTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  qrSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  qrCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 20,
    marginBottom: 16,
  },
  qrNote: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default HistoryDetailScreen;

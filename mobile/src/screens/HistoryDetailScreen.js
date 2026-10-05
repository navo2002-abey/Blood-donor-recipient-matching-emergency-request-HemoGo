import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BloodDrop } from '../components/Logo';
import { deleteAppointment } from '../services/api';
import { colors } from '../utils/colors';

const HistoryDetailScreen = ({ route, navigation }) => {
  const { appointment } = route.params || {};

  const handleDelete = () => {
    Alert.alert(
      'Delete Appointment',
      'Are you sure you want to delete this appointment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAppointment(appointment._id);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete appointment');
            }
          },
        },
      ]
    );
  };

  const qrData = JSON.stringify({
    id: appointment.qrCodeId || `HG-${appointment.bookedAt}`,
    hospital: appointment.hospital,
    date: appointment.date,
    time: appointment.time,
    completed: appointment.completed || false,
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10} style={styles.headerBtn}>
          <Ionicons name="arrow-back-outline" size={26} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.brand}>
          <BloodDrop size={16} />
          <Text style={styles.brandText}>HemoGo</Text>
        </View>
        <TouchableOpacity onPress={handleDelete} hitSlop={10} style={styles.headerBtn}>
          <Ionicons name="close-outline" size={26} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Appointment Details</Text>

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

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FAFAFA',
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
    backgroundColor: colors.white,
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
    backgroundColor: colors.white,
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

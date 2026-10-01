import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BloodDrop } from '../components/Logo';
import { colors } from '../utils/colors';

const AppointmentBookedScreen = ({ route, navigation }) => {
  const { hospital, date, time } = route.params || {};
  const [reminderSet, setReminderSet] = useState(false);

  const handleSetReminder = () => {
    if (reminderSet) {
      return;
    }
    setReminderSet(true);
    Alert.alert('Reminder Set', 'You will be reminded of your appointment.');
  };

  const handleBookAnother = () => {
    navigation.replace('BookAppointment');
  };

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
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={48} color={colors.white} />
          </View>
          <Text style={styles.successTitle}>Appointment Booked!</Text>
          <Text style={styles.successSubtitle}>Your donation appointment has been successfully scheduled.</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Appointment Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Hospital</Text>
            <Text style={styles.detailValue}>{hospital}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{date}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailValue}>{time}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Confirmed</Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.reminderButton, reminderSet && styles.reminderButtonDisabled]}
            onPress={handleSetReminder}
            disabled={reminderSet}
          >
            <Text style={styles.reminderButtonText}>
              {reminderSet ? 'Reminder Set' : 'Set Reminder'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bookAnotherButton} onPress={handleBookAnother}>
            <Text style={styles.bookAnotherButtonText}>Book Another</Text>
          </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'center',
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
  successContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 20,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  statusBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  buttonContainer: {
    gap: 12,
  },
  reminderButton: {
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderButtonDisabled: {
    backgroundColor: colors.textMuted,
  },
  reminderButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  bookAnotherButton: {
    height: 50,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookAnotherButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default AppointmentBookedScreen;

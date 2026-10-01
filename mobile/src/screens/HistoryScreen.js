import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { BloodDrop } from '../components/Logo';
import { colors } from '../utils/colors';

const HISTORY_KEY = '@appointment_history';
const POINTS_KEY = '@donor_points';

const HistoryScreen = ({ navigation }) => {
  const [appointments, setAppointments] = useState([]);

  const loadAppointments = async () => {
    try {
      const stored = await AsyncStorage.getItem(HISTORY_KEY);
      console.log('Stored appointments:', stored);
      if (stored) {
        setAppointments(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load appointments:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAppointments();
    }, [])
  );

  const deleteAppointment = async (index) => {
    try {
      const updated = appointments.filter((_, i) => i !== index);
      setAppointments(updated);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to delete appointment:', error);
    }
  };

  const completeDonation = async (index) => {
    try {
      const updated = [...appointments];
      updated[index].completed = true;
      updated[index].completedAt = new Date().toISOString();
      setAppointments(updated);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));

      // Add 100 points for completing donation
      const existingPoints = await AsyncStorage.getItem(POINTS_KEY);
      const currentPoints = existingPoints ? parseInt(existingPoints) : 0;
      await AsyncStorage.setItem(POINTS_KEY, JSON.stringify(currentPoints + 100));
    } catch (error) {
      console.error('Failed to complete donation:', error);
    }
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
        <Text style={styles.title}>Appointment History</Text>

        {appointments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyText}>No appointments yet</Text>
            <Text style={styles.emptySubtext}>Your appointment history will appear here</Text>
          </View>
        ) : (
          appointments.map((appointment, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.card}
              onPress={() => navigation.navigate('HistoryDetail', { appointment })}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.statusBadge, appointment.completed && styles.statusBadgeCompleted]}>
                  <Text style={[styles.statusText, appointment.completed && styles.statusTextCompleted]}>
                    {appointment.completed ? 'Completed' : 'Confirmed'}
                  </Text>
                </View>
                <View style={styles.headerRight}>
                  <Text style={styles.cardDate}>{appointment.date}</Text>
                  <TouchableOpacity 
                    onPress={(e) => {
                      e.stopPropagation();
                      deleteAppointment(index);
                    }} 
                    style={styles.deleteBtn}
                  >
                    <Ionicons name="close-outline" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.detailRow}>
                  <Ionicons name="heart-outline" size={18} color={colors.primary} />
                  <Text style={styles.detailText}>{appointment.hospital}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={18} color={colors.primary} />
                  <Text style={styles.detailText}>{appointment.time}</Text>
                </View>
                {!appointment.completed && (
                  <TouchableOpacity 
                    style={styles.completeButton} 
                    onPress={(e) => {
                      e.stopPropagation();
                      completeDonation(index);
                    }}
                  >
                    <Text style={styles.completeButtonText}>Complete Donation</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
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
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteBtn: {
    padding: 4,
  },
  statusBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeCompleted: {
    backgroundColor: colors.success,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  statusTextCompleted: {
    color: colors.white,
  },
  cardDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  cardBody: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  completeButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  completeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
});

export default HistoryScreen;

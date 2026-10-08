import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useCallback } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { BloodDrop } from '../components/Logo';
import { deleteAppointment, getAppointmentHistory } from '../services/api';
import { colors } from '../utils/colors';

const HISTORY_KEY = '@appointment_history';

const HistoryScreen = ({ navigation }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      // Load from AsyncStorage (officer updates this when scanning QR)
      const storageStr = await AsyncStorage.getItem(HISTORY_KEY);
      const storageAppointments = storageStr ? JSON.parse(storageStr) : [];
      
      // Also try API for additional appointments
      try {
        const result = await getAppointmentHistory();
        const apiAppointments = result.data || [];
        
        // Merge: API + AsyncStorage, avoiding duplicates
        const merged = [...apiAppointments];
        storageAppointments.forEach(storageAppt => {
          const exists = apiAppointments.some(apiAppt => 
            apiAppt._id === storageAppt._id || 
            apiAppt.qrCodeId === storageAppt.qrCodeId ||
            (apiAppt.bookedAt && storageAppt.bookedAt && 
             new Date(apiAppt.bookedAt).getTime() === new Date(storageAppt.bookedAt).getTime())
          );
          if (!exists) {
            merged.push(storageAppt);
          }
        });
        
        // Sort by bookedAt descending
        merged.sort((a, b) => {
          const dateA = a.bookedAt ? new Date(a.bookedAt) : new Date(0);
          const dateB = b.bookedAt ? new Date(b.bookedAt) : new Date(0);
          return dateB - dateA;
        });
        
        setAppointments(merged);
      } catch (apiError) {
        // API failed, use AsyncStorage only
        storageAppointments.sort((a, b) => {
          const dateA = a.bookedAt ? new Date(a.bookedAt) : new Date(0);
          const dateB = b.bookedAt ? new Date(b.bookedAt) : new Date(0);
          return dateB - dateA;
        });
        setAppointments(storageAppointments);
      }
    } catch (error) {
      console.error('Load appointments error:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAppointments();
    }, [])
  );

  const showQRCode = (appointment) => {
    navigation.navigate('HistoryDetail', { appointment });
  };

  const handleDelete = async (appointment) => {
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
              // Try API delete first if appointment has _id
              if (appointment._id) {
                await deleteAppointment(appointment._id);
              } else {
                // Fallback: delete from AsyncStorage
                const storageStr = await AsyncStorage.getItem(HISTORY_KEY);
                const history = storageStr ? JSON.parse(storageStr) : [];
                const updatedHistory = history.filter(appt => 
                  appt.bookedAt !== appointment.bookedAt
                );
                await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
              }
              await loadAppointments();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete appointment');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>Appointment History</Text>

        {loading && appointments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.emptyText}>Loading...</Text>
          </View>
        ) : appointments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyText}>No appointments yet</Text>
            <Text style={styles.emptySubtext}>Your appointment history will appear here</Text>
          </View>
        ) : (
          appointments.map((appointment) => (
            <TouchableOpacity
              key={appointment._id}
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
                  <View style={styles.iconRow}>
                    {!appointment.completed && (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          navigation.navigate('BookAppointment', {
                            editing: true,
                            appointment: appointment,
                            index: appointments.indexOf(appointment)
                          });
                        }}
                        style={styles.editBtn}
                      >
                        <Ionicons name="create-outline" size={20} color={colors.primary} />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDelete(appointment);
                      }}
                      style={styles.editBtn}
                    >
                      <Ionicons name="close-outline" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
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
                      showQRCode(appointment);
                    }}
                  >
                    <Text style={styles.completeButtonText}>Show QR Code</Text>
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
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editBtn: {
    padding: 4,
  },
  statusBadge: {
    backgroundColor: colors.primary,
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
    color: colors.white,
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

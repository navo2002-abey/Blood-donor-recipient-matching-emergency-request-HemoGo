import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { BloodDrop } from '../components/Logo';
import { createAppointment, getDonorProfile } from '../services/api';
import { colors } from '../utils/colors';
import { useCallback } from 'react';

const bloodBanks = [
  'National Blood Bank',
  'Colombo General Hospital',
  'Kandy General Hospital',
];

const timeSlots = ['9.30 A.M', '11.30 A.M', '2.30 P.M'];

const BookAppointmentScreen = ({ route, navigation }) => {
  const { editing, appointment, index } = route.params || {};
  const [selectedBank, setSelectedBank] = useState(editing ? appointment.hospital : null);
  const [selectedTime, setSelectedTime] = useState(editing ? appointment.time : null);
  const [selectedDate, setSelectedDate] = useState(editing ? appointment.date : null);
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(editing ? new Date(appointment.date) : new Date());
  const [loading, setLoading] = useState(false);
  const [nextEligibleDate, setNextEligibleDate] = useState(null);
  const [lastDonationDate, setLastDonationDate] = useState(null);
  const [dateValidationMessage, setDateValidationMessage] = useState('');
  const [isDateValid, setIsDateValid] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchProfile = async () => {
        try {
          const response = await getDonorProfile();
          console.log('=== DONOR PROFILE FETCHED ===');
          console.log('Full response:', response.data);
          console.log('Last donation date:', response.data.lastDonationDate);
          console.log('Next eligible date:', response.data.nextEligibleDate);
          if (response.data.lastDonationDate) {
            setLastDonationDate(response.data.lastDonationDate);
            console.log('Set lastDonationDate state to:', response.data.lastDonationDate);
          } else {
            setLastDonationDate(null);
            console.log('Set lastDonationDate state to null');
          }
          if (response.data.nextEligibleDate) {
            setNextEligibleDate(response.data.nextEligibleDate);
            console.log('Set nextEligibleDate state to:', response.data.nextEligibleDate);
          } else {
            setNextEligibleDate(null);
            console.log('Set nextEligibleDate state to null');
          }
        } catch (error) {
          console.error('Failed to fetch donor profile:', error);
        }
      };
      
      fetchProfile();
    }, [])
  );

  const handleBookAppointment = async () => {
    if (!selectedBank || !selectedTime || !selectedDate) {
      Alert.alert('Missing Information', 'Please select blood bank, time, and date');
      return;
    }

    if (loading) return;

    // Check if selected date is after next eligible date
    if (nextEligibleDate) {
      const selected = new Date(selectedDate);
      const nextEligible = new Date(nextEligibleDate);
      selected.setHours(0, 0, 0, 0);
      nextEligible.setHours(0, 0, 0, 0);
      
      if (selected < nextEligible) {
        Alert.alert(
          'Not Eligible',
          `Your last donation was on ${lastDonationDate}. Adding 90 days to that, you can donate again from ${nextEligibleDate}.`
        );
        return;
      }
    }

    // Validate that date and time are not in the past
    const now = new Date();
    const selectedDateTime = new Date(selectedDate);

    // Parse time slot to hours
    const timeToHours = (timeStr) => {
      const [time, period] = timeStr.split(' ');
      const [hours, minutes] = time.split('.');
      let hour = parseInt(hours);
      const minute = parseInt(minutes);
      if (period === 'P.M' && hour !== 12) hour += 12;
      if (period === 'A.M' && hour === 12) hour = 0;
      return { hour, minute };
    };

    const { hour: selectedHour, minute: selectedMinute } = timeToHours(selectedTime);
    selectedDateTime.setHours(selectedHour, selectedMinute, 0, 0);

    if (selectedDateTime < now) {
      Alert.alert('Invalid Date', 'Cannot book appointment for a past date or time');
      return;
    }

    // Convert date to YYYY-MM-DD format using local date parts
    const dateObj = new Date(selectedDate);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    setLoading(true);
    try {
      const result = await createAppointment(selectedBank, formattedDate, selectedTime);

      if (editing) {
        navigation.goBack();
      } else {
        navigation.navigate('AppointmentBooked', {
          hospital: selectedBank,
          date: selectedDate,
          time: selectedTime,
          appointment: result.data,
        });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to book appointment. Please try again.';
      Alert.alert('Booking Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setSelectedDate(formattedDate);
      
      // Validate selected date against next eligible date
      if (nextEligibleDate) {
        const selected = new Date(formattedDate);
        const nextEligible = new Date(nextEligibleDate);
        selected.setHours(0, 0, 0, 0);
        nextEligible.setHours(0, 0, 0, 0);
        
        if (selected < nextEligible) {
          setDateValidationMessage(`Your last donation was on ${lastDonationDate}. Adding 90 days to that, you can donate again from ${nextEligibleDate}.`);
          setIsDateValid(false);
        } else {
          setDateValidationMessage('');
          setIsDateValid(true);
        }
      } else {
        setDateValidationMessage('');
        setIsDateValid(true);
      }
    }
  };

  const formatDate = (dateObj) => {
    return dateObj.toISOString().split('T')[0];
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
        <Text style={styles.title}>{editing ? 'Edit Appointment' : 'Book Donation Appointment'}</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Select Blood Bank/Hospital</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowBankDropdown(!showBankDropdown)}
          >
            <Text style={selectedBank ? styles.dropdownText : styles.placeholder}>
              {selectedBank || 'Select blood bank'}
            </Text>
            <Ionicons
              name={showBankDropdown ? 'chevron-up-outline' : 'chevron-down-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {showBankDropdown && (
            <View style={styles.dropdownList}>
              {bloodBanks.map((bank) => (
                <TouchableOpacity
                  key={bank}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedBank(bank);
                    setShowBankDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{bank}</Text>
                  {selectedBank === bank && (
                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Select Time</Text>
          <View style={styles.timeContainer}>
            {timeSlots.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeButton,
                  selectedTime === time && styles.timeButtonSelected,
                ]}
                onPress={() => setSelectedTime(time)}
              >
                <Text
                  style={[
                    styles.timeText,
                    selectedTime === time && styles.timeTextSelected,
                  ]}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Select Date</Text>
          <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
            <Text style={selectedDate ? styles.dateText : styles.placeholder}>
              {selectedDate || 'Select date'}
            </Text>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
          {dateValidationMessage ? (
            <Text style={styles.validationMessage}>{dateValidationMessage}</Text>
          ) : null}
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'web' ? 'compact' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()}
              style={{ width: '100%' }}
            />
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.bookButton, loading && styles.bookButtonDisabled, !isDateValid && styles.bookButtonDisabled]}
            onPress={handleBookAppointment}
            disabled={loading || !isDateValid}
          >
            <Text style={styles.bookButtonText}>
              {loading ? 'Booking...' : editing ? 'Update Appointment' : 'Book Appointment'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} disabled={loading}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
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
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownText: {
    fontSize: 14,
    color: colors.text,
  },
  placeholder: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  dropdownList: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemText: {
    fontSize: 14,
    color: colors.text,
  },
  timeContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  timeButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  timeButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  timeTextSelected: {
    color: colors.white,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateText: {
    fontSize: 14,
    color: colors.text,
  },
  validationMessage: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 8,
    lineHeight: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  bookButton: {
    flex: 1,
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  cancelButton: {
    flex: 1,
    height: 50,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default BookAppointmentScreen;

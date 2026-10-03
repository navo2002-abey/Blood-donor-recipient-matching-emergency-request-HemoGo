import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BloodDrop } from '../components/Logo';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../utils/colors';
import { useTheme } from '../context/ThemeContext';

const HISTORY_KEY = '@appointment_history';
const POINTS_KEY = '@donor_points';

const bloodBanks = [
  'National Blood Bank',
  'Colombo General Hospital',
  'Kandy General Hospital',
];

const timeSlots = ['9.30 A.M', '11.30 A.M', '2.30 P.M'];

const BookAppointmentScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLanguage();
  const [selectedBank, setSelectedBank] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(new Date());

  const handleBookAppointment = async () => {
    if (!selectedBank || !selectedTime || !selectedDate) {
      alert('Please select blood bank, time, and date');
      return;
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
      alert('Cannot book appointment for a past date or time');
      return;
    }

    // Save appointment to history and add 10 points
    try {
      const appointment = {
        hospital: selectedBank,
        date: selectedDate,
        time: selectedTime,
        bookedAt: new Date().toISOString(),
      };
      
      const existing = await AsyncStorage.getItem(HISTORY_KEY);
      const history = existing ? JSON.parse(existing) : [];
      history.unshift(appointment);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));

      // Add 10 points for booking appointment
      const existingPoints = await AsyncStorage.getItem(POINTS_KEY);
      const currentPoints = existingPoints ? parseInt(existingPoints) : 0;
      await AsyncStorage.setItem(POINTS_KEY, JSON.stringify(currentPoints + 10));
    } catch (error) {
      console.error('Failed to save appointment:', error);
    }

    navigation.navigate('AppointmentBooked', {
      hospital: selectedBank,
      date: selectedDate,
      time: selectedTime,
    });
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
        <Text style={styles.title}>{t('pages.bookTitle')}</Text>

        <View style={styles.section}>
          <Text style={styles.label}>{t('pages.selectBank')}</Text>
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
          <Text style={styles.label}>{t('pages.selectTime')}</Text>
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
          <Text style={styles.label}>{t('pages.selectDate')}</Text>
          <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
            <Text style={selectedDate ? styles.dateText : styles.placeholder}>
              {selectedDate || 'Select date'}
            </Text>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
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
          <TouchableOpacity style={styles.bookButton} onPress={handleBookAppointment}>
            <Text style={styles.bookButtonText}>{t('pages.book')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>{t('pages.cancel')}</Text>
          </TouchableOpacity>
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
    backgroundColor: colors.cardBg,
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
    backgroundColor: colors.cardBg,
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
    backgroundColor: colors.cardBg,
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
    backgroundColor: colors.cardBg,
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
  bookButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  cancelButton: {
    flex: 1,
    height: 50,
    backgroundColor: colors.cardBg,
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

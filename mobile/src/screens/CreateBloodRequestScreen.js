import { Ionicons } from '@expo/vector-icons';
import React, { useState, useMemo } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BloodDrop } from '../components/Logo';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../utils/colors';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';

import DateTimePicker from '@react-native-community/datetimepicker';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const HOSPITALS = [
  'National Hospital Colombo',
  'Lanka Hospitals Colombo',
  'Asiri Central Hospital',
  'Colombo South Teaching Hospital (Kalubowila)',
  'Sri Jayewardenepura General Hospital',
  'Teaching Hospital Kandy',
  'Karapitiya Teaching Hospital Galle',
  'General Hospital Negombo',
  'Apollo Hospital',
  'Other / Custom Hospital...',
];

const URGENCIES = ['Low', 'Medium', 'High', 'Critical'];

const formatDate = (dateObj) => {
  if (!dateObj) return '';
  const day = dateObj.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
};

const formatTime = (dateObj) => {
  if (!dateObj) return '';
  let hours = dateObj.getHours();
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
};

const getTimeDifferenceText = (dateObj, timeObj, hasPickedDate, hasPickedTime) => {
  if (!hasPickedDate && !hasPickedTime) return null;

  const now = new Date();
  const target = new Date(dateObj || now);

  if (timeObj) {
    target.setHours(timeObj.getHours(), timeObj.getMinutes(), 0, 0);
  } else {
    target.setHours(12, 0, 0, 0);
  }

  const diffMs = target.getTime() - now.getTime();

  if (diffMs < -60000) {
    return {
      text: 'Selected date/time has already passed',
      isPast: true,
      isImminent: false,
    };
  }

  if (Math.abs(diffMs) <= 60000) {
    return {
      text: 'Needed immediately (ASAP)',
      isPast: false,
      isImminent: true,
    };
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  let parts = [];
  if (days > 0) {
    parts.push(`${days}d`);
  }
  if (hours > 0) {
    parts.push(`${hours}hr`);
  }
  if (minutes > 0 || parts.length === 0) {
    parts.push(`${minutes}min`);
  }

  const durationStr = parts.join(' ');

  return {
    text: `Required in: ${durationStr}`,
    duration: durationStr,
    isPast: false,
    isImminent: totalMinutes <= 180,
  };
};

const CreateBloodRequestScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLanguage();
  const { hasUnread } = useNotifications();
  const urgencyLabel = {
    Low: t('pages.low'),
    Medium: t('pages.medium'),
    High: t('pages.high'),
    Critical: t('pages.criticalLevel'),
  };
  const [patientName, setPatientName] = useState('');
  const [hospital, setHospital] = useState('');
  const [customHospital, setCustomHospital] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());
  const [tempTime, setTempTime] = useState(new Date());
  const [hasPickedDate, setHasPickedDate] = useState(false);
  const [hasPickedTime, setHasPickedTime] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [urgency, setUrgency] = useState('Critical');
  const [additionalInfo, setAdditionalInfo] = useState('');

  const openDatePicker = () => {
    setTempDate(hasPickedDate ? selectedDate : new Date());
    setShowTimePicker(false);
    setShowDatePicker(true);
  };

  const openTimePicker = () => {
    setTempTime(hasPickedTime ? selectedTime : new Date());
    setShowDatePicker(false);
    setShowTimePicker(true);
  };

  const timeDiff = useMemo(
    () => getTimeDifferenceText(selectedDate, selectedTime, hasPickedDate, hasPickedTime),
    [selectedDate, selectedTime, hasPickedDate, hasPickedTime]
  );

  // Modals
  const [hospitalModalVisible, setHospitalModalVisible] = useState(false);
  const [bloodGroupModalVisible, setBloodGroupModalVisible] = useState(false);

  const handleSelectHospital = (item) => {
    if (item === 'Other / Custom Hospital...') {
      setHospital('Other');
    } else {
      setHospital(item);
      setCustomHospital('');
    }
    setHospitalModalVisible(false);
  };

  const handleSelectBloodGroup = (group) => {
    setBloodGroup(group);
    setBloodGroupModalVisible(false);
  };

  const handleProceedToConfirm = () => {
    const finalHospital = hospital === 'Other' ? customHospital.trim() : hospital;

    if (!patientName.trim()) {
      Alert.alert('Missing Field', 'Please enter the patient name.');
      return;
    }
    if (!finalHospital) {
      Alert.alert('Missing Field', 'Please select or enter the hospital name.');
      return;
    }
    if (!bloodGroup) {
      Alert.alert('Missing Field', 'Please select the required blood group.');
      return;
    }
    if (!quantity || isNaN(quantity) || Number(quantity) <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid number of blood units.');
      return;
    }
    if (!hasPickedDate) {
      Alert.alert('Missing Field', 'Please select the required date.');
      return;
    }
    if (!hasPickedTime) {
      Alert.alert('Missing Field', 'Please select the required time.');
      return;
    }
    if (timeDiff && timeDiff.isPast) {
      Alert.alert(
        'Invalid Date / Time',
        'The selected date and time has already passed. You cannot submit a blood request for a past time. Please select an upcoming date and time.'
      );
      return;
    }

    const finalDateTime = `${formatDate(selectedDate)} • ${formatTime(selectedTime)}`;

    const payload = {
      patientName: patientName.trim(),
      hospital: finalHospital,
      bloodGroup,
      units: Number(quantity),
      requiredDateTime: finalDateTime,
      urgency,
      additionalInfo: additionalInfo.trim(),
    };

    navigation.navigate('ConfirmBloodRequest', { requestData: payload });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Top Header Bar matching Mockup */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => (navigation?.canGoBack() ? navigation.goBack() : null)}
          style={styles.iconBtn}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.brandContainer}>
          <BloodDrop size={18} />
          <Text style={styles.brandTitle}>HemoGo</Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('Notifications')}
          style={styles.iconBtn}
          accessibilityLabel="Notifications"
        >
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
          {hasUnread ? <View style={styles.bellBadge} /> : null}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Main Title Header */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{t('pages.requestTitle')}</Text>
            <Text style={styles.subtitle}>{t('pages.requestSub')}</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            {/* 1. Patient Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                {t('pages.patientName')} <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder={t('pages.enterPatient')}
                placeholderTextColor="#9CA3AF"
                value={patientName}
                onChangeText={setPatientName}
                autoCapitalize="words"
              />
            </View>

            {/* 2. Hospital */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                {t('pages.hospitalLabel')} <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => setHospitalModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.selectText,
                    !hospital && styles.placeholderText,
                  ]}
                  numberOfLines={1}
                >
                  {hospital === 'Other'
                    ? t('pages.otherHospital')
                    : hospital || t('pages.selectHospitalHint')}
                </Text>
                <Ionicons name="caret-down" size={14} color="#6B7280" />
              </TouchableOpacity>
              {hospital === 'Other' && (
                <TextInput
                  style={[styles.input, { marginTop: 8 }]}
                  placeholder={t('pages.enterHospital')}
                  placeholderTextColor="#9CA3AF"
                  value={customHospital}
                  onChangeText={setCustomHospital}
                />
              )}
            </View>

            {/* 3. Required Blood Group */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                {t('pages.requiredGroup')} <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => setBloodGroupModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.selectText,
                    !bloodGroup && styles.placeholderText,
                  ]}
                >
                  {bloodGroup ? t('pages.groupNamed', { group: bloodGroup }) : t('pages.selectGroupHint')}
                </Text>
                <Ionicons name="caret-down" size={14} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* 4. Quantity (Units) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                {t('pages.quantity')} <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder={t('pages.unitsExample')}
                placeholderTextColor="#9CA3AF"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
              />
            </View>

            {/* 5. Required Date & Time Pickers */}
            <View style={styles.dateTimeRow}>
              {/* Date Picker Field */}
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>
                  Required Date <Text style={styles.requiredStar}>*</Text>
                </Text>
                {Platform.OS === 'web' ? (
                  <View style={styles.selectInput}>
                    <input
                      type="date"
                      value={hasPickedDate ? selectedDate.toISOString().split('T')[0] : ''}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => {
                        if (e.target.value) {
                          const [y, m, d] = e.target.value.split('-');
                          const newD = new Date(selectedDate);
                          newD.setFullYear(Number(y), Number(m) - 1, Number(d));
                          setSelectedDate(newD);
                          setHasPickedDate(true);
                        }
                      }}
                      style={{
                        border: 'none',
                        outline: 'none',
                        backgroundColor: 'transparent',
                        color: colors.text,
                        fontSize: 14,
                        fontWeight: '600',
                        width: '100%',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.selectInput}
                    onPress={openDatePicker}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.selectText,
                        !hasPickedDate && styles.placeholderText,
                      ]}
                      numberOfLines={1}
                    >
                      {hasPickedDate ? formatDate(selectedDate) : 'Select Date'}
                    </Text>
                    <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Time Picker Field */}
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>
                  Required Time <Text style={styles.requiredStar}>*</Text>
                </Text>
                {Platform.OS === 'web' ? (
                  <View style={styles.selectInput}>
                    <input
                      type="time"
                      value={hasPickedTime ? `${String(selectedTime.getHours()).padStart(2, '0')}:${String(selectedTime.getMinutes()).padStart(2, '0')}` : ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          const [hh, mm] = e.target.value.split(':');
                          const newT = new Date(selectedTime);
                          newT.setHours(Number(hh), Number(mm), 0, 0);
                          setSelectedTime(newT);
                          setHasPickedTime(true);
                        }
                      }}
                      style={{
                        border: 'none',
                        outline: 'none',
                        backgroundColor: 'transparent',
                        color: colors.text,
                        fontSize: 14,
                        fontWeight: '600',
                        width: '100%',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.selectInput}
                    onPress={openTimePicker}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.selectText,
                        !hasPickedTime && styles.placeholderText,
                      ]}
                      numberOfLines={1}
                    >
                      {hasPickedTime ? formatTime(selectedTime) : 'Select Time'}
                    </Text>
                    <Ionicons name="time-outline" size={18} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Dynamic Time Remaining Countdown / Duration Indicator */}
            {timeDiff && (
              <View
                style={[
                  styles.timeDiffBanner,
                  timeDiff.isPast && styles.timeDiffBannerPast,
                  timeDiff.isImminent && !timeDiff.isPast && styles.timeDiffBannerImminent,
                ]}
              >
                <Ionicons
                  name={timeDiff.isPast ? 'alert-circle-outline' : timeDiff.isImminent ? 'flash-outline' : 'time-outline'}
                  size={16}
                  color={timeDiff.isPast ? '#DC2626' : timeDiff.isImminent ? '#D97706' : colors.primary}
                />
                <Text
                  style={[
                    styles.timeDiffText,
                    timeDiff.isPast && styles.timeDiffTextPast,
                    timeDiff.isImminent && !timeDiff.isPast && styles.timeDiffTextImminent,
                  ]}
                >
                  {timeDiff.text}
                </Text>
              </View>
            )}

            {/* 6. Urgency */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                {t('pages.urgency')} <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View style={styles.urgencyContainer}>
                {URGENCIES.map((lvl) => {
                  const isSelected = urgency === lvl;
                  return (
                    <TouchableOpacity
                      key={lvl}
                      style={[
                        styles.urgencyPill,
                        isSelected && styles.urgencyPillActive,
                        isSelected && lvl === 'Critical' && styles.urgencyPillCritical,
                      ]}
                      onPress={() => setUrgency(lvl)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.urgencyText,
                          isSelected && styles.urgencyTextActive,
                        ]}
                      >
                        {urgencyLabel[lvl] || lvl}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 7. Additional Information */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('pages.additional')}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t('pages.additionalHint')}
                placeholderTextColor="#9CA3AF"
                value={additionalInfo}
                onChangeText={setAdditionalInfo}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Past Date Warning Banner */}
          {timeDiff?.isPast && (
            <View style={styles.pastDateNotice}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
              <Text style={styles.pastDateNoticeText}>
                The selected time has already passed. Please select a future time before submitting.
              </Text>
            </View>
          )}

          {/* Bottom Action Button */}
          <TouchableOpacity
            style={[styles.submitButton, timeDiff?.isPast && styles.submitButtonDisabled]}
            onPress={handleProceedToConfirm}
            activeOpacity={0.85}
          >
            <Text style={styles.submitButtonText}>{t('pages.createRequest')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Hospital Selector Modal */}
      <Modal
        visible={hospitalModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setHospitalModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('pages.selectHospital')}</Text>
              <TouchableOpacity onPress={() => setHospitalModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 350 }}>
              {HOSPITALS.map((hosp, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.modalItem,
                    hospital === hosp && styles.modalItemSelected,
                  ]}
                  onPress={() => handleSelectHospital(hosp)}
                >
                  <Ionicons
                    name="business-outline"
                    size={18}
                    color={hospital === hosp ? colors.primary : colors.textSecondary}
                    style={{ marginRight: 10 }}
                  />
                  <Text
                    style={[
                      styles.modalItemText,
                      hospital === hosp && styles.modalItemTextSelected,
                    ]}
                  >
                    {hosp}
                  </Text>
                  {hospital === hosp && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                      style={{ marginLeft: 'auto' }}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Blood Group Modal */}
      <Modal
        visible={bloodGroupModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBloodGroupModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('pages.selectBloodGroup')}</Text>
              <TouchableOpacity onPress={() => setBloodGroupModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.bloodGrid}>
              {BLOOD_GROUPS.map((bg) => (
                <TouchableOpacity
                  key={bg}
                  style={[
                    styles.bloodBadge,
                    bloodGroup === bg && styles.bloodBadgeSelected,
                  ]}
                  onPress={() => handleSelectBloodGroup(bg)}
                >
                  <Text
                    style={[
                      styles.bloodBadgeText,
                      bloodGroup === bg && styles.bloodBadgeTextSelected,
                    ]}
                  >
                    {bg}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* iOS Date Picker Modal */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.pickerModalOverlay}>
            <TouchableOpacity
              style={styles.pickerModalBackdrop}
              activeOpacity={1}
              onPress={() => setShowDatePicker(false)}
            />
            <View style={styles.pickerModalContent}>
              <View style={styles.pickerModalHeader}>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(false)}
                  style={styles.pickerActionBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.pickerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.pickerModalTitle}>Select Required Date</Text>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedDate(tempDate);
                    setHasPickedDate(true);
                    setShowDatePicker(false);
                  }}
                  style={styles.pickerActionBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  minimumDate={new Date()}
                  themeVariant={isDark ? 'dark' : 'light'}
                  textColor={colors.text}
                  onChange={(event, date) => {
                    if (date) {
                      setTempDate(date);
                    }
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* iOS Time Picker Modal */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showTimePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowTimePicker(false)}
        >
          <View style={styles.pickerModalOverlay}>
            <TouchableOpacity
              style={styles.pickerModalBackdrop}
              activeOpacity={1}
              onPress={() => setShowTimePicker(false)}
            />
            <View style={styles.pickerModalContent}>
              <View style={styles.pickerModalHeader}>
                <TouchableOpacity
                  onPress={() => setShowTimePicker(false)}
                  style={styles.pickerActionBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.pickerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.pickerModalTitle}>Select Required Time</Text>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedTime(tempTime);
                    setHasPickedTime(true);
                    setShowTimePicker(false);
                  }}
                  style={styles.pickerActionBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={tempTime}
                  mode="time"
                  display="spinner"
                  themeVariant={isDark ? 'dark' : 'light'}
                  textColor={colors.text}
                  onChange={(event, time) => {
                    if (time) {
                      setTempTime(time);
                    }
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Android Native Date Picker */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (event.type === 'set' && date) {
              setSelectedDate(date);
              setHasPickedDate(true);
            }
          }}
        />
      )}

      {/* Android Native Time Picker */}
      {Platform.OS === 'android' && showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          display="default"
          onChange={(event, time) => {
            setShowTimePicker(false);
            if (event.type === 'set' && time) {
              setSelectedTime(time);
              setHasPickedTime(true);
            }
          }}
        />
      )}
    </SafeAreaView>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.cardBg,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  topBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: 6,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.cardBg || colors.white,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
  },
  titleSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  form: {
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.text,
  },
  requiredStar: {
    color: colors.primary,
    fontWeight: '800',
  },
  input: {
    height: 48,
    backgroundColor: colors.page,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 14,
    color: colors.text,
  },
  selectInput: {
    height: 48,
    backgroundColor: colors.page,
    borderRadius: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  placeholderText: {
    color: colors.textMuted,
  },
  urgencyContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  urgencyPill: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.page,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgencyPillActive: {
    backgroundColor: '#111827',
  },
  urgencyPillCritical: {
    backgroundColor: colors.primary,
  },
  urgencyText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#4B5563',
  },
  urgencyTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    paddingBottom: 12,
  },
  submitButton: {
    marginTop: 24,
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  modalItemSelected: {
    backgroundColor: colors.primarySoft,
    borderRadius: 10,
  },
  modalItemText: {
    fontSize: 14,
    color: '#374151',
  },
  modalItemTextSelected: {
    fontWeight: '700',
    color: colors.primary,
  },
  bloodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  bloodBadge: {
    width: '21%',
    aspectRatio: 1.3,
    borderRadius: 14,
    backgroundColor: colors.page,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  bloodBadgeSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  bloodBadgeText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  bloodBadgeTextSelected: {
    color: '#FFFFFF',
  },
  timeDiffBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: -4,
    marginBottom: 4,
  },
  timeDiffBannerImminent: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  timeDiffBannerPast: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  timeDiffText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D4ED8',
    flex: 1,
  },
  timeDiffTextImminent: {
    color: '#B45309',
  },
  timeDiffTextPast: {
    color: '#DC2626',
  },
  pastDateNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 14,
    marginBottom: -8,
  },
  pastDateNoticeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
    flex: 1,
    lineHeight: 18,
  },
  submitButtonDisabled: {
    opacity: 0.55,
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  pickerModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  pickerModalContent: {
    backgroundColor: colors.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingTop: 16,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  pickerActionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  pickerCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  pickerDoneText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  pickerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: colors.cardBg,
  },
});

export default CreateBloodRequestScreen;

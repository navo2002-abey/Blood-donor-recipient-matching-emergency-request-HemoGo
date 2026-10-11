import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';

const getNextMonday = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 1 : 8 - day; // If Sunday, +1. Otherwise next Monday.
  const target = new Date(d);
  target.setDate(d.getDate() + diff);
  target.setHours(9, 0, 0, 0);
  return target;
};

const getFutureDate = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(9, 0, 0, 0);
  return d;
};

const PRESET_DURATIONS = [
  { id: '1day', label: '1 Day', getTarget: () => getFutureDate(1) },
  { id: 'nextMonday', label: 'Next Monday', getTarget: () => getNextMonday() },
  { id: '1week', label: '1 Week', getTarget: () => getFutureDate(7) },
  { id: '2weeks', label: '2 Weeks', getTarget: () => getFutureDate(14) },
  { id: '1month', label: '1 Month', getTarget: () => getFutureDate(30) },
];

const formatDateSummary = (dateObj) => {
  if (!dateObj) return '';
  const d = new Date(dateObj);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatIsoDateOnly = (dateObj) => {
  if (!dateObj) return '';
  const d = new Date(dateObj);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DonorAvailabilityModal = ({ visible, onClose }) => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const { user, saveAvailability } = useAuth();
  const { showToast } = useToast();

  const [status, setStatus] = useState('AVAILABLE');
  const [selectedPreset, setSelectedPreset] = useState('1week');
  const [customReturnDate, setCustomReturnDate] = useState(getFutureDate(7));
  const [tempDate, setTempDate] = useState(getFutureDate(7));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sync with current user state when opened
  useEffect(() => {
    if (visible && user) {
      const currentStatus = user.availabilityStatus || (user.isAvailable !== false ? 'AVAILABLE' : 'UNAVAILABLE');
      setStatus(currentStatus);
      if (user.unavailableUntil) {
        const d = new Date(user.unavailableUntil);
        setCustomReturnDate(d);
        setTempDate(d);
        setSelectedPreset('custom');
      } else {
        const defaultDate = getFutureDate(7);
        setCustomReturnDate(defaultDate);
        setTempDate(defaultDate);
        setSelectedPreset('1week');
      }
    }
  }, [visible, user]);

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset.id);
    const target = preset.getTarget();
    setCustomReturnDate(target);
    setTempDate(target);
    setShowDatePicker(false);
  };

  const openPickerModal = () => {
    setTempDate(customReturnDate || getFutureDate(1));
    setShowDatePicker(true);
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (selectedDate) {
        const updated = new Date(selectedDate);
        updated.setHours(9, 0, 0, 0);
        setCustomReturnDate(updated);
        setSelectedPreset('custom');
      }
    } else if (selectedDate) {
      const updated = new Date(selectedDate);
      updated.setHours(9, 0, 0, 0);
      setTempDate(updated);
    }
  };

  const handleWebDateInput = (val) => {
    if (!val) return;
    const parts = val.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 9, 0, 0);
      setCustomReturnDate(d);
      setTempDate(d);
      setSelectedPreset('custom');
    }
  };

  const handleIosDone = () => {
    setCustomReturnDate(tempDate);
    setSelectedPreset('custom');
    setShowDatePicker(false);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        availabilityStatus: status,
        isAvailable: status === 'AVAILABLE',
        unavailableUntil: status === 'TEMPORARILY_UNAVAILABLE' ? customReturnDate.toISOString() : null,
      };

      const res = await saveAvailability(payload);

      onClose();

      // Immediate visual toast feedback
      if (status === 'AVAILABLE') {
        showToast({
          type: 'success',
          title: 'Status: Available',
          message: 'You are now ready to receive live donor matching & emergency requests.',
          icon: 'checkmark-circle',
          duration: 4000,
        });
      } else if (status === 'TEMPORARILY_UNAVAILABLE') {
        const formatted = formatDateSummary(customReturnDate);
        showToast({
          type: 'warning',
          title: 'Status: Temporarily Unavailable',
          message: `Switches back to Available automatically on ${formatted}.`,
          icon: 'time',
          duration: 4500,
        });
      } else {
        showToast({
          type: 'info',
          title: 'Status: Unavailable',
          message: 'Emergency donor requests have been paused.',
          icon: 'pause-circle',
          duration: 4000,
        });
      }
    } catch (error) {
      showToast({
        type: 'emergency',
        title: 'Update Failed',
        message: 'Unable to update availability status. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const minDate = useMemo(() => getFutureDate(1), []);

  const modalBody = (
    <View style={styles.sheet}>
      <View style={styles.sheetHandle} />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Donor Availability</Text>
          <Text style={styles.headerSub}>Control when you receive emergency blood requests</Text>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={10}>
          <Ionicons name="close" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* OPTION 1: AVAILABLE */}
        <TouchableOpacity
          style={[styles.statusOption, status === 'AVAILABLE' && styles.statusOptionActiveAvailable]}
          onPress={() => setStatus('AVAILABLE')}
          activeOpacity={0.7}
        >
          <View style={[styles.statusIconWrap, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="checkmark-circle" size={24} color="#16A34A" />
          </View>
          <View style={styles.statusCopy}>
            <View style={styles.statusLabelRow}>
              <Text style={styles.statusTitle}>Available to Donate</Text>
              <View style={[styles.badge, { backgroundColor: '#DCFCE7' }]}>
                <Text style={[styles.badgeText, { color: '#16A34A' }]}>ACTIVE</Text>
              </View>
            </View>
            <Text style={styles.statusDescription}>
              You are ready for blood requests and will appear in live matching for nearby patients.
            </Text>
          </View>
          <View style={[styles.radio, status === 'AVAILABLE' && styles.radioActiveGreen]}>
            {status === 'AVAILABLE' ? <View style={[styles.radioInner, { backgroundColor: '#16A34A' }]} /> : null}
          </View>
        </TouchableOpacity>

        {/* OPTION 2: TEMPORARILY UNAVAILABLE */}
        <TouchableOpacity
          style={[
            styles.statusOption,
            status === 'TEMPORARILY_UNAVAILABLE' && styles.statusOptionActiveTemp,
          ]}
          onPress={() => setStatus('TEMPORARILY_UNAVAILABLE')}
          activeOpacity={0.7}
        >
          <View style={[styles.statusIconWrap, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="time" size={24} color="#D97706" />
          </View>
          <View style={styles.statusCopy}>
            <View style={styles.statusLabelRow}>
              <Text style={styles.statusTitle}>Temporarily Unavailable</Text>
              <View style={[styles.badge, { backgroundColor: '#FEF3C7' }]}>
                <Text style={[styles.badgeText, { color: '#D97706' }]}>AUTO-RESUME</Text>
              </View>
            </View>
            <Text style={styles.statusDescription}>
              Take a short break. Automatically switches back to Available on your return date.
            </Text>
          </View>
          <View style={[styles.radio, status === 'TEMPORARILY_UNAVAILABLE' && styles.radioActiveAmber]}>
            {status === 'TEMPORARILY_UNAVAILABLE' ? (
              <View style={[styles.radioInner, { backgroundColor: '#D97706' }]} />
            ) : null}
          </View>
        </TouchableOpacity>

        {/* RETURN DATE PICKER (Shown only if Temporarily Unavailable) */}
        {status === 'TEMPORARILY_UNAVAILABLE' ? (
          <View style={styles.durationCard}>
            <View style={styles.durationHeader}>
              <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              <Text style={styles.durationTitle}>Choose Return Date</Text>
            </View>

            {/* Quick Duration Presets */}
            <View style={styles.presetGrid}>
              {PRESET_DURATIONS.map((preset) => {
                const isSelected = selectedPreset === preset.id;
                return (
                  <TouchableOpacity
                    key={preset.id}
                    style={[styles.presetChip, isSelected && styles.presetChipActive]}
                    onPress={() => handleSelectPreset(preset)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.presetText, isSelected && styles.presetTextActive]}>
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Date Picker Selector */}
            <View style={styles.customDateSection}>
              <Text style={styles.customDateLabel}>Or Pick Specific Date:</Text>

              {Platform.OS === 'web' ? (
                <View style={styles.datePickerInputWrap}>
                  <Ionicons name="calendar" size={18} color="#D97706" style={{ marginRight: 8 }} />
                  <input
                    type="date"
                    min={formatIsoDateOnly(minDate)}
                    value={formatIsoDateOnly(customReturnDate)}
                    onChange={(e) => handleWebDateInput(e.target.value)}
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontSize: 14,
                      fontWeight: '700',
                      color: colors.text,
                      fontFamily: 'inherit',
                      padding: '8px 4px',
                    }}
                  />
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={[
                      styles.datePickerBtn,
                      selectedPreset === 'custom' && styles.datePickerBtnActive,
                    ]}
                    onPress={openPickerModal}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="calendar" size={18} color="#D97706" />
                    <Text style={styles.datePickerBtnText}>
                      {formatDateSummary(customReturnDate)}
                    </Text>
                    <Ionicons
                      name="pencil"
                      size={14}
                      color={colors.textSecondary}
                      style={{ marginLeft: 'auto' }}
                    />
                  </TouchableOpacity>

                  {/* Android inline/modal picker */}
                  {Platform.OS === 'android' && showDatePicker && (
                    <DateTimePicker
                      value={tempDate || minDate}
                      mode="date"
                      display="default"
                      minimumDate={minDate}
                      onChange={handleDateChange}
                    />
                  )}
                </>
              )}
            </View>

            <View style={styles.resumeInfoBox}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#16A34A" />
              <View style={{ flex: 1 }}>
                <Text style={styles.resumeInfoLabel}>Automatic Reactivation</Text>
                <Text style={styles.resumeInfoValue}>
                  {formatDateSummary(customReturnDate)}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* OPTION 3: UNAVAILABLE */}
        <TouchableOpacity
          style={[styles.statusOption, status === 'UNAVAILABLE' && styles.statusOptionActiveUnavailable]}
          onPress={() => setStatus('UNAVAILABLE')}
          activeOpacity={0.7}
        >
          <View style={[styles.statusIconWrap, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="close-circle" size={24} color="#DC2626" />
          </View>
          <View style={styles.statusCopy}>
            <View style={styles.statusLabelRow}>
              <Text style={styles.statusTitle}>Unavailable</Text>
              <View style={[styles.badge, { backgroundColor: '#FEE2E2' }]}>
                <Text style={[styles.badgeText, { color: '#DC2626' }]}>PAUSED</Text>
              </View>
            </View>
            <Text style={styles.statusDescription}>
              Pause all matching requests indefinitely until you manually change your status back.
            </Text>
          </View>
          <View style={[styles.radio, status === 'UNAVAILABLE' && styles.radioActiveRed]}>
            {status === 'UNAVAILABLE' ? <View style={[styles.radioInner, { backgroundColor: '#DC2626' }]} /> : null}
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* FOOTER ACTIONS */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, loading && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveBtnText}>Confirm & Apply Status</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const modalContent = (
    <>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />
        <SafeAreaView edges={['bottom']} style={styles.safeContainer}>
          {modalBody}
        </SafeAreaView>
      </View>

      {/* iOS Date Picker Modal matching screenshot */}
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
                  onPress={handleIosDone}
                  style={styles.pickerActionBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={tempDate || minDate}
                  mode="date"
                  display="spinner"
                  minimumDate={minDate}
                  themeVariant={isDark ? 'dark' : 'light'}
                  textColor={colors.text}
                  onChange={handleDateChange}
                  style={{ height: 216, width: '100%' }}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  );

  if (Platform.OS === 'web') {
    if (!visible) return null;
    return (
      <View style={styles.webWrap}>
        {modalContent}
      </View>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {modalContent}
    </Modal>
  );
};

const makeStyles = (colors, isDark) =>
  StyleSheet.create({
    webWrap: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 99999,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      display: 'flex',
      justifyContent: 'flex-end',
    },
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      justifyContent: 'flex-end',
    },
    backdropPressable: {
      flex: 1,
    },
    safeContainer: {
      width: '100%',
      backgroundColor: colors.cardBg,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
    },
    sheet: {
      backgroundColor: colors.cardBg,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: Platform.OS === 'ios' ? 24 : 16,
      maxHeight: Platform.OS === 'web' ? '90vh' : '88%',
    },
    sheetHandle: {
      width: 44,
      height: 5,
      borderRadius: 3,
      backgroundColor: isDark ? '#475569' : '#CBD5E1',
      alignSelf: 'center',
      marginBottom: 14,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
    },
    headerSub: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.inputBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scroll: {
      paddingBottom: 16,
    },
    statusOption: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: 12,
      borderRadius: 18,
      borderWidth: 1.5,
      borderColor: colors.cardBorder,
      backgroundColor: colors.cardBg,
      marginBottom: 12,
      gap: 10,
    },
    statusOptionActiveAvailable: {
      borderColor: '#16A34A',
      backgroundColor: isDark ? 'rgba(22, 163, 74, 0.12)' : '#F0FDF4',
    },
    statusOptionActiveTemp: {
      borderColor: '#D97706',
      backgroundColor: isDark ? 'rgba(217, 119, 6, 0.12)' : '#FFFBEB',
    },
    statusOptionActiveUnavailable: {
      borderColor: '#DC2626',
      backgroundColor: isDark ? 'rgba(220, 38, 38, 0.12)' : '#FEF2F2',
    },
    statusIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusCopy: {
      flex: 1,
      paddingRight: 4,
    },
    statusLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 4,
    },
    statusTitle: {
      fontSize: 14.5,
      fontWeight: '700',
      color: colors.text,
      flexShrink: 1,
    },
    badge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      alignSelf: 'center',
    },
    badgeText: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
    statusDescription: {
      fontSize: 12,
      lineHeight: 17,
      color: colors.textSecondary,
    },
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    radioActiveGreen: {
      borderColor: '#16A34A',
    },
    radioActiveAmber: {
      borderColor: '#D97706',
    },
    radioActiveRed: {
      borderColor: '#DC2626',
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    durationCard: {
      backgroundColor: isDark ? '#1E293B' : '#FFFDF5',
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#FDE68A',
      borderRadius: 16,
      padding: 14,
      marginBottom: 14,
      marginLeft: 12,
      marginRight: 4,
    },
    durationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 10,
    },
    durationTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    presetGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 12,
    },
    presetChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    presetChipActive: {
      backgroundColor: '#D97706',
      borderColor: '#D97706',
    },
    presetText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
    },
    presetTextActive: {
      color: '#FFFFFF',
    },
    customDateSection: {
      marginBottom: 12,
    },
    customDateLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      marginBottom: 6,
    },
    datePickerInputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBg,
      borderWidth: 1.5,
      borderColor: '#D97706',
      borderRadius: 12,
      paddingHorizontal: 10,
    },
    datePickerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 8,
    },
    datePickerBtnActive: {
      borderColor: '#D97706',
      backgroundColor: isDark ? 'rgba(217, 119, 6, 0.1)' : '#FFFDF5',
    },
    datePickerBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    pickerModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      justifyContent: 'flex-end',
      zIndex: 100000,
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
    resumeInfoBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(217, 119, 6, 0.15)' : '#FEF3C7',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 10,
    },
    resumeInfoLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: '#B45309',
    },
    resumeInfoValue: {
      fontSize: 13,
      fontWeight: '800',
      color: isDark ? '#FDE68A' : '#92400E',
      marginTop: 1,
    },
    footer: {
      paddingTop: 8,
    },
    saveBtn: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    saveBtnText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
    },
  });

export default DonorAvailabilityModal;

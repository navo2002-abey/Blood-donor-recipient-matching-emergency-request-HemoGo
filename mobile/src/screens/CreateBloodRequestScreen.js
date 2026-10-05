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

const DATE_TIME_PRESETS = [
  'Immediate / ASAP',
  '16 Sep 2026, 10:00 AM',
  'Within 2 Hours',
  'Within 6 Hours',
  'Today Evening (by 6:00 PM)',
  'Tomorrow Morning (by 9:00 AM)',
  'Custom Date & Time...',
];

const URGENCIES = ['Low', 'Medium', 'High', 'Critical'];

const CreateBloodRequestScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLanguage();
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
  const [requiredDateTime, setRequiredDateTime] = useState('');
  const [customDateTime, setCustomDateTime] = useState('');
  const [urgency, setUrgency] = useState('Critical');
  const [additionalInfo, setAdditionalInfo] = useState('');

  // Modals
  const [hospitalModalVisible, setHospitalModalVisible] = useState(false);
  const [bloodGroupModalVisible, setBloodGroupModalVisible] = useState(false);
  const [dateTimeModalVisible, setDateTimeModalVisible] = useState(false);

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

  const handleSelectDateTime = (dt) => {
    if (dt === 'Custom Date & Time...') {
      setRequiredDateTime('Custom');
    } else {
      setRequiredDateTime(dt);
      setCustomDateTime('');
    }
    setDateTimeModalVisible(false);
  };

  const handleProceedToConfirm = () => {
    const finalHospital = hospital === 'Other' ? customHospital.trim() : hospital;
    const finalDateTime = requiredDateTime === 'Custom' ? customDateTime.trim() : requiredDateTime;

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
    if (!finalDateTime) {
      Alert.alert('Missing Field', 'Please select the required date and time.');
      return;
    }

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
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.brandContainer}>
          <BloodDrop size={18} />
          <Text style={styles.brandTitle}>HemoGo</Text>
        </View>

        <TouchableOpacity
          onPress={() => Alert.alert('Notifications', 'No new alerts.')}
          style={styles.iconBtn}
          accessibilityLabel="Notifications"
        >
          <Ionicons name="notifications" size={20} color={colors.text} />
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

            {/* 5. Required Date/Time */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                {t('pages.requiredDate')} <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => setDateTimeModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.selectText,
                    !requiredDateTime && styles.placeholderText,
                  ]}
                  numberOfLines={1}
                >
                  {requiredDateTime === 'Custom'
                    ? t('pages.customDate')
                    : requiredDateTime || t('pages.selectDateTime')}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </TouchableOpacity>
              {requiredDateTime === 'Custom' && (
                <TextInput
                  style={[styles.input, { marginTop: 8 }]}
                  placeholder={t('pages.dateTime')}
                  placeholderTextColor="#9CA3AF"
                  value={customDateTime}
                  onChangeText={setCustomDateTime}
                />
              )}
            </View>

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

          {/* Bottom Action Button */}
          <TouchableOpacity
            style={styles.submitButton}
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

      {/* Required Date/Time Modal */}
      <Modal
        visible={dateTimeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDateTimeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('pages.selectRequiredTime')}</Text>
              <TouchableOpacity onPress={() => setDateTimeModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 320 }}>
              {DATE_TIME_PRESETS.map((dt, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.modalItem,
                    requiredDateTime === dt && styles.modalItemSelected,
                  ]}
                  onPress={() => handleSelectDateTime(dt)}
                >
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={requiredDateTime === dt ? colors.primary : colors.textSecondary}
                    style={{ marginRight: 10 }}
                  />
                  <Text
                    style={[
                      styles.modalItemText,
                      requiredDateTime === dt && styles.modalItemTextSelected,
                    ]}
                  >
                    {dt}
                  </Text>
                  {requiredDateTime === dt && (
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
    </SafeAreaView>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.cardBg,
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
});

export default CreateBloodRequestScreen;

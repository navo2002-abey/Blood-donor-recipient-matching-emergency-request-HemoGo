import { Ionicons } from '@expo/vector-icons';
import React, { useState, useMemo } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
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
import { BloodDrop } from '../components/Logo';
import Sidebar from '../components/Sidebar';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../utils/colors';
import { DONOR_MENU } from '../utils/roles';
import { useTheme } from '../context/ThemeContext';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCIES = ['Critical', 'High', 'Medium', 'Low'];
const NAME_PATTERN = /^[A-Za-z]+(?:[ .'-][A-Za-z]+)*$/;
const DETAILS_LIMIT = 200;

const comingSoon = (feature) => {
  Alert.alert('Coming Soon', `${feature} will be available in a later version.`);
};

const validateMatch = ({ patientName, hospital, bloodGroup, urgency, details }) => {
  const errors = {};
  const name = patientName.trim();
  const hospitalName = hospital.trim();
  const notes = details.trim();

  if (!name) {
    errors.patientName = 'Patient name is required.';
  } else if (name.length < 2) {
    errors.patientName = 'Patient name must be at least 2 characters.';
  } else if (name.length > 50) {
    errors.patientName = 'Patient name must be 50 characters or fewer.';
  } else if (!NAME_PATTERN.test(name)) {
    errors.patientName = 'Use letters only, for example Amal Silva.';
  }

  if (!hospitalName) {
    errors.hospital = 'Hospital name is required.';
  } else if (hospitalName.length < 3) {
    errors.hospital = 'Hospital name must be at least 3 characters.';
  } else if (hospitalName.length > 80) {
    errors.hospital = 'Hospital name must be 80 characters or fewer.';
  } else if (!/[A-Za-z]/.test(hospitalName)) {
    errors.hospital = 'Enter a valid hospital name.';
  }

  if (!bloodGroup || !BLOOD_GROUPS.includes(bloodGroup)) {
    errors.bloodGroup = 'Select a blood group.';
  }

  if (!urgency || !URGENCIES.includes(urgency)) {
    errors.urgency = 'Select an urgency level.';
  }

  if (notes.length > DETAILS_LIMIT) {
    errors.details = `Additional details must be ${DETAILS_LIMIT} characters or fewer.`;
  }

  return errors;
};

const RequestMatchScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLanguage();
  const menu = route.params?.menu || DONOR_MENU;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [hospital, setHospital] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [urgency, setUrgency] = useState('');
  const [details, setDetails] = useState('');
  const [picker, setPicker] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const errors = submitted
    ? validateMatch({ patientName, hospital, bloodGroup, urgency, details })
    : {};

  const openPicker = (type) => setPicker(type);
  const pickerOptions = picker === 'blood' ? BLOOD_GROUPS : URGENCIES;
  const pickerValue = picker === 'blood' ? bloodGroup : urgency;
  const pickerTitle = picker === 'blood' ? 'Select blood group' : 'Select urgency level';

  const chooseOption = (value) => {
    if (picker === 'blood') {
      setBloodGroup(value);
    } else {
      setUrgency(value);
    }
    setPicker(null);
  };

  const handleMatch = () => {
    const nextErrors = validateMatch({ patientName, hospital, bloodGroup, urgency, details });
    setSubmitted(true);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    navigation.navigate('SmartMatch', {
      menu,
      patientName: patientName.trim(),
      hospital: hospital.trim(),
      bloodGroup,
      urgency,
      details: details.trim(),
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidebarOpen(true)} hitSlop={10} style={styles.headerBtn}>
          <Ionicons name="menu-outline" size={26} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.brand}>
          <BloodDrop size={16} />
          <Text style={styles.brandText}>HemoGo</Text>
        </View>
        <TouchableOpacity
          onPress={() => comingSoon('Notifications')}
          hitSlop={10}
          style={styles.headerBtn}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{t('pages.requestMatch')}</Text>
          <Text style={styles.subtitle}>
            Tell us what you need, and we'll find the best matching donors for you.
          </Text>

          <Field label="Patient Name" error={errors.patientName}>
            <TextInput
              value={patientName}
              onChangeText={setPatientName}
              placeholder="Enter patient name"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              style={[styles.input, errors.patientName && styles.inputError]}
            />
          </Field>

          <Field label="Hospital Name" error={errors.hospital}>
            <TextInput
              value={hospital}
              onChangeText={setHospital}
              placeholder="Enter hospital name"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              style={[styles.input, errors.hospital && styles.inputError]}
            />
          </Field>

          <Field label="Blood Group" error={errors.bloodGroup}>
            <TouchableOpacity
              style={[styles.input, styles.select, errors.bloodGroup && styles.inputError]}
              onPress={() => openPicker('blood')}
              activeOpacity={0.8}
            >
              <Text style={bloodGroup ? styles.selectValue : styles.placeholder}>
                {bloodGroup || 'Select blood group'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </Field>

          <Field label="Urgency" error={errors.urgency}>
            <TouchableOpacity
              style={[styles.input, styles.select, errors.urgency && styles.inputError]}
              onPress={() => openPicker('urgency')}
              activeOpacity={0.8}
            >
              <Text style={urgency ? styles.selectValue : styles.placeholder}>
                {urgency || 'Select urgency level'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </Field>

          <Field label="Additional Details" error={errors.details}>
            <TextInput
              value={details}
              onChangeText={setDetails}
              placeholder="Any additional information (e.g. surgery, special requirements, etc.)"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={DETAILS_LIMIT}
              textAlignVertical="top"
              style={[styles.input, styles.textArea, errors.details && styles.inputError]}
            />
            <Text style={styles.counter}>
              {details.trim().length}/{DETAILS_LIMIT}
            </Text>
          </Field>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.submit} onPress={handleMatch} activeOpacity={0.85}>
            <Text style={styles.submitText}>Initiate Smart Matching</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={picker !== null} transparent animationType="fade" onRequestClose={() => setPicker(null)}>
        <Pressable style={styles.overlay} onPress={() => setPicker(null)}>
          <Pressable style={styles.sheet}>
            <Text style={styles.sheetTitle}>{pickerTitle}</Text>
            {pickerOptions.map((option) => {
              const selected = option === pickerValue;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => chooseOption(option)}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{option}</Text>
                  {selected ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        onComingSoon={comingSoon}
        menu={menu}
      />
    </SafeAreaView>
  );
};

const Field = ({ label, error, children }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    {children}
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </View>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 18,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  input: {
    minHeight: 52,
    borderRadius: 26,
    backgroundColor: colors.border,
    paddingHorizontal: 18,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectValue: {
    fontSize: 15,
    color: colors.text,
  },
  placeholder: {
    fontSize: 15,
    color: colors.textMuted,
  },
  textArea: {
    minHeight: 118,
    borderRadius: 22,
    paddingTop: 16,
    paddingBottom: 16,
  },
  counter: {
    marginTop: 6,
    marginRight: 8,
    textAlign: 'right',
    fontSize: 12,
    color: colors.textMuted,
  },
  error: {
    marginTop: 6,
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  submit: {
    height: 54,
    borderRadius: 27,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
  },
  sheetTitle: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  option: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionSelected: {
    backgroundColor: colors.primarySoft,
  },
  optionText: {
    fontSize: 15,
    color: '#374151',
  },
  optionTextSelected: {
    fontWeight: '700',
    color: colors.primary,
  },
});

export default RequestMatchScreen;

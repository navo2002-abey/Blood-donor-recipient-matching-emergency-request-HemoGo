import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import FormField from '../../components/FormField';
import { transferService } from '../../services/officerService';
import { colors } from '../../utils/colors';
import { digitsOnly } from '../../utils/numbers';
import { minLength, positiveInt, required } from '../../utils/validators';

const SOURCE_HOSPITAL = 'Colombo General Hospital Blood Bank';
const DEST_HOSPITAL = 'National Hospital Colombo Blood Bank';

const TransferRequestScreen = ({ route, navigation }) => {
  const initialGroup = route.params?.bloodGroup || 'O+';
  const [bloodGroup] = useState(initialGroup);
  const [units, setUnits] = useState('1');
  const [reason, setReason] = useState('Critical shortage at destination hospital');
  const [urgency, setUrgency] = useState('HIGH');
  const [saving, setSaving] = useState(false);

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = () => {
    const next = {
      units: positiveInt(units, 'Units'),
      urgency: required(urgency, 'Urgency'),
      reason: required(reason, 'Reason') || minLength(reason, 5, 'Reason'),
    };
    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const handleSend = async () => {
    setTouched({ units: true, urgency: true, reason: true });
    if (!validate()) return;

    try {
      setSaving(true);
      await transferService.create({
        bloodGroup,
        units: Number(units),
        sourceBank: SOURCE_HOSPITAL,
        destinationHospital: DEST_HOSPITAL,
        distanceKm: 3.8,
        reason: reason.trim(),
        urgency,
        status: 'PENDING',
      });

      navigation.goBack();
      setTimeout(() => {
        Alert.alert('Sent', 'Transfer request sent successfully.');
      }, 200);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to send request.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Request Transfer</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Request Transfer</Text>
          <Text style={styles.subtitle}>
            Send a transfer request to the destination hospital.
          </Text>

          <View style={styles.infoRow}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>BLOOD TYPE</Text>
              <Text style={styles.infoValue}>{bloodGroup}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>UNITS REQUESTED</Text>
              <TextInput
                style={styles.unitsInput}
                value={units}
                onChangeText={(text) => setUnits(digitsOnly(text))}
                onBlur={() => setTouched((t) => ({ ...t, units: true }))}
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>
          </View>

          {touched.units && errors.units ? (
            <Text style={styles.inlineError}>{errors.units}</Text>
          ) : null}

          <Text style={styles.label}>SOURCE</Text>
          <View style={styles.readonly}>
            <Ionicons name="business-outline" size={16} color={colors.primary} />
            <Text style={styles.readonlyText}>{SOURCE_HOSPITAL}</Text>
          </View>

          <Text style={styles.label}>DESTINATION</Text>
          <View style={styles.readonly}>
            <Ionicons name="business-outline" size={16} color={colors.primary} />
            <Text style={styles.readonlyText}>{DEST_HOSPITAL}</Text>
          </View>

          <FormField label="URGENCY" error={touched.urgency ? errors.urgency : null}>
            <View style={styles.chipRow}>
              {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[styles.chip, urgency === u && styles.chipActive]}
                  onPress={() => {
                    setUrgency(u);
                    setTouched((t) => ({ ...t, urgency: true }));
                  }}
                >
                  <Text
                    style={[styles.chipText, urgency === u && styles.chipTextActive]}
                  >
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </FormField>

          <FormField label="REASON" error={touched.reason ? errors.reason : null}>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={reason}
              onChangeText={setReason}
              onBlur={() => setTouched((t) => ({ ...t, reason: true }))}
              multiline
              placeholder="Reason for transfer..."
              placeholderTextColor={colors.textMuted}
              maxLength={200}
            />
          </FormField>

          <TouchableOpacity
            style={styles.sendBtn}
            onPress={handleSend}
            disabled={saving}
          >
            <Text style={styles.sendText}>
              {saving ? 'SENDING...' : 'SEND TRANSFER REQUEST'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 6, marginBottom: 20 },
  infoRow: { flexDirection: 'row', gap: 12, marginBottom: 6 },
  infoBox: { flex: 1, backgroundColor: '#F9FAFB', padding: 14, borderRadius: 14 },
  infoLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '700', letterSpacing: 0.4 },
  infoValue: { fontSize: 22, fontWeight: '800', color: colors.primary, marginTop: 6 },
  unitsInput: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginTop: 6,
    padding: 0,
  },
  inlineError: {
    marginTop: 4,
    marginLeft: 4,
    marginBottom: 4,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
    marginTop: 18,
    marginBottom: 10,
    letterSpacing: 0.4,
  },
  readonly: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F4F4F6',
    height: 54,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  readonlyText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: '#F4F4F6',
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.text },
  chipTextActive: { color: colors.white },
  input: {
    borderRadius: 16,
    backgroundColor: '#F4F4F6',
    paddingHorizontal: 16,
    fontSize: 14,
    color: colors.text,
    minHeight: 54,
  },
  textarea: { height: 100, textAlignVertical: 'top', paddingTop: 14 },
  sendBtn: {
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  sendText: { color: colors.white, fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
});

export default TransferRequestScreen;
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
import DateField from '../../components/DateField';
import FormField from '../../components/FormField';
import { stockService } from '../../services/officerService';
import { colors } from '../../utils/colors';
import { digitsOnly } from '../../utils/numbers';
import { notPastDate, positiveInt, required } from '../../utils/validators';

const GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const HOSPITAL = 'Colombo General Hospital Blood Bank';

const AddStockScreen = ({ navigation }) => {
  const [bloodGroup, setBloodGroup] = useState('');
  const [units, setUnits] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [saving, setSaving] = useState(false);

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = () => {
    const next = {
      bloodGroup: required(bloodGroup, 'Blood group'),
      units: positiveInt(units, 'Units'),
      expiryDate: notPastDate(expiryDate, 'Expiry date'),
    };
    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const handleSave = async () => {
    setTouched({ bloodGroup: true, units: true, expiryDate: true });
    if (!validate()) return;

    try {
      setSaving(true);
      await stockService.create({
        bloodGroup,
        units: Number(units),
        expiryDate: new Date(expiryDate).toISOString(),
        hospital: HOSPITAL,
        status: 'AVAILABLE',
      });

      navigation.goBack();
      setTimeout(() => {
        Alert.alert('Success', 'Stock added successfully.');
      }, 200);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to save stock.');
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
          <Text style={styles.headerTitle}>Add Blood Stock</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Add Blood Stock</Text>
          <Text style={styles.subtitle}>MANUAL INVENTORY UPDATE</Text>

          <FormField label="BLOOD GROUP" error={touched.bloodGroup ? errors.bloodGroup : null}>
            <View style={styles.chipRow}>
              {GROUPS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.chip, bloodGroup === g && styles.chipActive]}
                  onPress={() => {
                    setBloodGroup(g);
                    setTouched((t) => ({ ...t, bloodGroup: true }));
                  }}
                >
                  <Text style={[styles.chipText, bloodGroup === g && styles.chipTextActive]}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </FormField>

          <FormField label="NUMBER OF UNITS" error={touched.units ? errors.units : null}>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={units}
              onChangeText={(t) => setUnits(digitsOnly(t))}
              onBlur={() => setTouched((t) => ({ ...t, units: true }))}
              placeholder="Enter quantity"
              placeholderTextColor={colors.textMuted}
              maxLength={4}
            />
          </FormField>

          <FormField label="EXPIRY DATE" error={touched.expiryDate ? errors.expiryDate : null}>
            <DateField value={expiryDate} onChange={setExpiryDate} />
          </FormField>

          <Text style={styles.label}>LOCATION</Text>
          <View style={[styles.input, styles.readonly]}>
            <Ionicons name="business-outline" size={16} color={colors.textMuted} />
            <Text style={styles.readonlyText}>{HOSPITAL}</Text>
          </View>

          <View style={styles.tipBox}>
            <View style={styles.tipIcon}>
              <Ionicons name="bulb-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tipTitle}>STAFF TIP</Text>
              <Text style={styles.tipText}>
                Ensure blood bags are scanned before manual entry to maintain real-time accuracy.
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveText}>{saving ? 'SAVING...' : 'SAVE STOCK UPDATE'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 11, letterSpacing: 1, color: colors.textMuted, fontWeight: '700', marginTop: 4, marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '800', color: colors.text, marginTop: 18, marginBottom: 10, letterSpacing: 0.4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 22, backgroundColor: '#F4F4F6' },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '700', color: colors.text },
  chipTextActive: { color: colors.white },
  input: { height: 54, borderRadius: 16, backgroundColor: '#F4F4F6', paddingHorizontal: 16, fontSize: 15, color: colors.text },
  readonly: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  readonlyText: { color: colors.textSecondary, fontWeight: '600', fontSize: 14 },
  tipBox: { flexDirection: 'row', gap: 12, backgroundColor: '#FFF1F3', borderRadius: 16, padding: 14, marginTop: 24 },
  tipIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  tipTitle: { fontSize: 11, fontWeight: '800', color: colors.primary, letterSpacing: 0.5 },
  tipText: { fontSize: 12, color: colors.text, marginTop: 4, lineHeight: 17 },
  saveBtn: { height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 26 },
  saveText: { color: colors.white, fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
});

export default AddStockScreen;
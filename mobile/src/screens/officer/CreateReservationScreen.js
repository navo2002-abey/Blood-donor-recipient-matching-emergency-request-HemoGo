import React, { useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
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
import { useMyHospital } from '../../hooks/useMyHospital';
import { reservationService, stockService } from '../../services/officerService';
import { useLanguage } from '../../context/LanguageContext';
import { colors } from '../../utils/colors';
import { digitsOnly } from '../../utils/numbers';
import { minLength, positiveInt, required } from '../../utils/validators';
import { useTheme } from '../../context/ThemeContext';

const GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

const daysLeft = (date) => {
  const diff = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const CreateReservationScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLanguage();
  const HOSPITAL = useMyHospital();
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(true);

  const [bloodGroup, setBloodGroup] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [units, setUnits] = useState('1');
  const [unitId, setUnitId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [ward, setWard] = useState('');
  const [reservedFor, setReservedFor] = useState('');
  const [saving, setSaving] = useState(false);

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const { data } = await stockService.list({
          hospital: HOSPITAL,
          status: 'AVAILABLE',
        });
        const available = (data.stock || []).filter((s) => s.units > 0);
        setBatches(available);
      } catch (e) {
        Alert.alert('Error', 'Failed to load available batches.');
      } finally {
        setLoadingBatches(false);
      }
    })();
  }, [HOSPITAL]);

  const groupsWithStock = GROUPS.filter((g) =>
    batches.some((b) => b.bloodGroup === g)
  );

  const filteredBatches = batches.filter((b) => b.bloodGroup === bloodGroup);

  useEffect(() => {
    if (filteredBatches.length > 0) {
      setSelectedBatchId(filteredBatches[0]._id);
    } else {
      setSelectedBatchId(null);
    }
  }, [bloodGroup, batches.length]);

  const selectedBatch = batches.find((b) => b._id === selectedBatchId);
  const maxUnitsForBatch = selectedBatch ? selectedBatch.units : 0;

  const validate = () => {
    const next = {
      bloodGroup: required(bloodGroup, 'Blood group'),
      selectedBatchId: !selectedBatchId ? 'Please select a batch.' : null,
      units:
        positiveInt(units, 'Units') ||
        (Number(units) > maxUnitsForBatch
          ? `Only ${maxUnitsForBatch} unit(s) available in this batch.`
          : null),
      unitId: required(unitId, 'Unit ID') || minLength(unitId, 3, 'Unit ID'),
      patientName:
        required(patientName, 'Patient name') ||
        minLength(patientName, 3, 'Patient name'),
      ward: required(ward, 'Ward / location') || minLength(ward, 2, 'Ward / location'),
    };
    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const handleSave = async () => {
    setTouched({
      bloodGroup: true,
      selectedBatchId: true,
      units: true,
      unitId: true,
      patientName: true,
      ward: true,
    });
    if (!validate()) return;

    try {
      setSaving(true);
      await reservationService.create({
        unitId: unitId.trim(),
        stockId: selectedBatchId,
        bloodGroup,
        units: Number(units),
        patientName: patientName.trim(),
        ward: ward.trim(),
        hospital: HOSPITAL,
        reservedFor: reservedFor.trim() || ward.trim(),
        status: 'RESERVED',
      });

      navigation.goBack();
      setTimeout(() => {
        Alert.alert('Success', 'Reservation created.');
      }, 200);
    } catch (e) {
      Alert.alert(
        'Error',
        e?.response?.data?.message || 'Failed to create reservation.'
      );
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
          <Text style={styles.headerTitle}>{t('pages.createReservation')}</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{t('pages.createReservation')}</Text>
          <Text style={styles.subtitle}>Pick from available stock</Text>

          <FormField
            label="BLOOD GROUP"
            error={touched.bloodGroup ? errors.bloodGroup : null}
          >
            {loadingBatches ? (
              <ActivityIndicator color={colors.primary} />
            ) : groupsWithStock.length === 0 ? (
              <View style={styles.noStock}>
                <Ionicons name="alert-circle-outline" size={20} color={colors.primary} />
                <Text style={styles.noStockText}>No stock available at {HOSPITAL}.</Text>
              </View>
            ) : (
              <View style={styles.chipRow}>
                {groupsWithStock.map((g) => {
                  const totalForGroup = batches
                    .filter((b) => b.bloodGroup === g)
                    .reduce((sum, b) => sum + b.units, 0);
                  return (
                    <TouchableOpacity
                      key={g}
                      style={[styles.chip, bloodGroup === g && styles.chipActive]}
                      onPress={() => {
                        setBloodGroup(g);
                        setTouched((t) => ({ ...t, bloodGroup: true }));
                      }}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          bloodGroup === g && styles.chipTextActive,
                        ]}
                      >
                        {g} · {totalForGroup}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </FormField>

          {bloodGroup && filteredBatches.length > 0 && (
            <>
              <Text style={styles.label}>SELECT BATCH (oldest expiry first)</Text>
              {filteredBatches.map((b) => {
                const selected = selectedBatchId === b._id;
                const days = daysLeft(b.expiryDate);
                return (
                  <TouchableOpacity
                    key={b._id}
                    style={[styles.batchCard, selected && styles.batchCardActive]}
                    onPress={() => setSelectedBatchId(b._id)}
                  >
                    <View style={styles.batchLeft}>
                      <View style={styles.radioOuter}>
                        {selected ? <View style={styles.radioInner} /> : null}
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.batchUnits}>
                        {b.units} unit{b.units === 1 ? '' : 's'} available
                      </Text>
                      <Text style={styles.batchExpiry}>
                        Expires {new Date(b.expiryDate).toLocaleDateString()} · {days}d left
                      </Text>
                    </View>
                    {days <= 5 && (
                      <View style={styles.urgentPill}>
                        <Text style={styles.urgentText}>SOON</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
              {touched.selectedBatchId && errors.selectedBatchId ? (
                <Text style={styles.inlineError}>{errors.selectedBatchId}</Text>
              ) : null}
            </>
          )}

          <FormField label="UNITS TO RESERVE" error={touched.units ? errors.units : null}>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              inputMode="numeric"
              value={units}
              onChangeText={(t) => setUnits(digitsOnly(t))}
              onBlur={() => setTouched((t) => ({ ...t, units: true }))}
              maxLength={4}
            />
            {selectedBatch && (
              <Text style={styles.hint}>Max {maxUnitsForBatch} unit(s) in this batch</Text>
            )}
          </FormField>

          <FormField label="UNIT ID" error={touched.unitId ? errors.unitId : null}>
            <TextInput
              style={styles.input}
              value={unitId}
              onChangeText={setUnitId}
              onBlur={() => setTouched((t) => ({ ...t, unitId: true }))}
              placeholder="e.g. B-7749"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              maxLength={20}
            />
          </FormField>

          <FormField
            label="PATIENT NAME"
            error={touched.patientName ? errors.patientName : null}
          >
            <TextInput
              style={styles.input}
              value={patientName}
              onChangeText={setPatientName}
              onBlur={() => setTouched((t) => ({ ...t, patientName: true }))}
              placeholder="Enter name"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              maxLength={50}
            />
          </FormField>

          <FormField
            label="WARD / HOSPITAL LOCATION"
            error={touched.ward ? errors.ward : null}
          >
            <TextInput
              style={styles.input}
              value={ward}
              onChangeText={setWard}
              onBlur={() => setTouched((t) => ({ ...t, ward: true }))}
              placeholder="e.g. Cardiac Ward 3"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              maxLength={50}
            />
          </FormField>

          <FormField label="RESERVED FOR (OPTIONAL)">
            <TextInput
              style={styles.input}
              value={reservedFor}
              onChangeText={setReservedFor}
              placeholder="e.g. Surgery, Emergency"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              maxLength={50}
            />
          </FormField>

          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveText}>
              {saving ? 'CREATING...' : 'CONFIRM RESERVATION'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cardBg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 11, letterSpacing: 1, color: colors.textMuted, fontWeight: '700', marginTop: 4, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '800', color: colors.text, marginTop: 18, marginBottom: 10, letterSpacing: 0.4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22, backgroundColor: colors.page },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '700', color: colors.text },
  chipTextActive: { color: colors.white },
  noStock: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 12, padding: 12 },
  noStockText: { color: colors.primary, fontWeight: '700', fontSize: 13, flex: 1 },
  batchCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, backgroundColor: colors.cardBg, borderWidth: 1.5, borderColor: colors.border, marginBottom: 8 },
  batchCardActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  batchLeft: { width: 24 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  batchUnits: { fontSize: 14, fontWeight: '800', color: colors.text },
  batchExpiry: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  urgentPill: { backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  urgentText: { color: colors.primary, fontSize: 9, fontWeight: '800' },
  inlineError: { marginTop: 4, marginLeft: 4, fontSize: 11, fontWeight: '700', color: colors.primary },
  input: { height: 54, borderRadius: 16, backgroundColor: colors.page, paddingHorizontal: 16, fontSize: 15, color: colors.text },
  hint: { marginTop: 6, marginLeft: 4, fontSize: 11, color: colors.textMuted },
  saveBtn: { height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 26 },
  saveText: { color: colors.white, fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
});

export default CreateReservationScreen;
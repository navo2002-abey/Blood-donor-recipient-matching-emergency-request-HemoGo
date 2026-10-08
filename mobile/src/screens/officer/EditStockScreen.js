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
import DateField from '../../components/DateField';
import FormField from '../../components/FormField';
import { useConfirm } from '../../context/ConfirmContext';
import { stockService } from '../../services/officerService';
import { useLanguage } from '../../context/LanguageContext';
import { colors } from '../../utils/colors';
import { digitsOnly } from '../../utils/numbers';
import { notPastDate, positiveInt, required } from '../../utils/validators';
import { useTheme } from '../../context/ThemeContext';

const GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const STATUSES = ['AVAILABLE', 'RESERVED', 'USED', 'EXPIRED', 'TRANSFERRED'];

const EditStockScreen = ({ route, navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLanguage();
  const { id } = route.params;
  const confirm = useConfirm();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [bloodGroup, setBloodGroup] = useState('');
  const [units, setUnits] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [status, setStatus] = useState('AVAILABLE');
  const [hospital, setHospital] = useState('');

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const { data } = await stockService.get(id);
        const s = data.stock;
        setBloodGroup(s.bloodGroup);
        setUnits(String(s.units));
        setExpiryDate(new Date(s.expiryDate).toISOString().slice(0, 10));
        setStatus(s.status);
        setHospital(s.hospital);
      } catch (e) {
        Alert.alert('Error', 'Failed to load stock.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigation]);

  const validate = () => {
    const next = {
      bloodGroup: required(bloodGroup, 'Blood group'),
      units: positiveInt(units, 'Units'),
      expiryDate: notPastDate(expiryDate, 'Expiry date'),
      status: required(status, 'Status'),
    };
    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const handleUpdate = async () => {
    setTouched({ bloodGroup: true, units: true, expiryDate: true, status: true });
    if (!validate()) return;

    try {
      setSaving(true);
      await stockService.update(id, {
        bloodGroup,
        units: Number(units),
        expiryDate: new Date(expiryDate).toISOString(),
        status,
      });
      navigation.goBack();
      setTimeout(() => {
        Alert.alert('Updated', 'Stock updated successfully.');
      }, 200);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to update.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Delete Stock',
      message: 'Are you sure? This cannot be undone.',
      confirmText: 'Delete',
      destructive: true,
    });
    if (!ok) return;

    try {
      setDeleting(true);
      await stockService.remove(id);
      navigation.goBack();
      setTimeout(() => {
        Alert.alert('Deleted', 'Stock removed.');
      }, 200);
    } catch (e) {
      Alert.alert('Error', 'Failed to delete stock.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerTitle}>{t('pages.updateStock')}</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{t('pages.updateStock')}</Text>
          <Text style={styles.subtitle}>MANUAL INVENTORY UPDATE</Text>

          <FormField
            label="BLOOD GROUP"
            error={touched.bloodGroup ? errors.bloodGroup : null}
          >
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
                  <Text
                    style={[styles.chipText, bloodGroup === g && styles.chipTextActive]}
                  >
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
              onChangeText={(text) => setUnits(digitsOnly(text))}
              onBlur={() => setTouched((t) => ({ ...t, units: true }))}
              placeholder="Enter quantity"
              placeholderTextColor={colors.textMuted}
              maxLength={4}
            />
          </FormField>

          <FormField
            label="EXPIRY DATE"
            error={touched.expiryDate ? errors.expiryDate : null}
          >
            <DateField value={expiryDate} onChange={setExpiryDate} />
          </FormField>

          <FormField label="STATUS" error={touched.status ? errors.status : null}>
            <View style={styles.chipRow}>
              {STATUSES.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, status === s && styles.chipActive]}
                  onPress={() => {
                    setStatus(s);
                    setTouched((t) => ({ ...t, status: true }));
                  }}
                >
                  <Text
                    style={[styles.chipText, status === s && styles.chipTextActive]}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </FormField>

          <Text style={styles.label}>LOCATION</Text>
          <View style={[styles.input, styles.readonly]}>
            <Ionicons name="business-outline" size={16} color={colors.textMuted} />
            <Text style={styles.readonlyText}>{hospital}</Text>
          </View>

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleUpdate}
            disabled={saving || deleting}
          >
            <Text style={styles.saveText}>
              {saving ? 'UPDATING...' : 'UPDATE STOCK'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteBtn, deleting && { opacity: 0.6 }]}
            onPress={handleDelete}
            disabled={deleting || saving}
          >
            <Ionicons name="trash-outline" size={18} color={colors.primary} />
            <Text style={styles.deleteText}>
              {deleting ? 'DELETING...' : 'DELETE STOCK'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cardBg },
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
  subtitle: {
    fontSize: 11,
    letterSpacing: 1,
    color: colors.textMuted,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
    marginTop: 18,
    marginBottom: 10,
    letterSpacing: 0.4,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: colors.page,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '700', color: colors.text },
  chipTextActive: { color: colors.white },
  input: {
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.page,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.text,
  },
  readonly: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  readonlyText: { color: colors.textSecondary, fontWeight: '600', fontSize: 14 },
  saveBtn: {
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 26,
  },
  saveText: { color: colors.white, fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
  deleteBtn: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: colors.primary,
    marginTop: 12,
  },
  deleteText: { color: colors.primary, fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
});

export default EditStockScreen;
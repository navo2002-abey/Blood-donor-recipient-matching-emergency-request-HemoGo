import { Ionicons } from '@expo/vector-icons';
import React, { useState, useMemo } from 'react';
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
import AppHeader from '../../components/AppHeader';
import DateField from '../../components/DateField';
import FormField from '../../components/FormField';
import { useMyHospital } from '../../hooks/useMyHospital';
import { campaignService } from '../../services/officerService';
import { useLanguage } from '../../context/LanguageContext';
import { colors } from '../../utils/colors';
import { minLength, notPastDate, required } from '../../utils/validators';
import { useTheme } from '../../context/ThemeContext';

const GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const VENUE_TYPES = [
  { key: 'HOSPITAL', label: 'My Hospital', icon: 'business' },
  { key: 'EXTERNAL', label: 'External Location', icon: 'location' },
];

const EditCampaignScreen = ({ route, navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLanguage();
  const HOSPITAL = useMyHospital();
  const campaign = route?.params?.campaign;

  const [name, setName] = useState(campaign?.name || '');
  const [targetGroups, setTargetGroups] = useState(campaign?.targetBloodGroups || []);
  const [preferredDate, setPreferredDate] = useState(
    campaign?.preferredDate
      ? new Date(campaign.preferredDate).toISOString().slice(0, 10)
      : ''
  );
  const [venueType, setVenueType] = useState(campaign?.venue?.type || 'HOSPITAL');
  const [venueName, setVenueName] = useState(campaign?.venue?.name || '');
  const [venueAddress, setVenueAddress] = useState(campaign?.venue?.address || '');
  const [saving, setSaving] = useState(false);

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const toggleGroup = (g) => {
    setTargetGroups((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
    setTouched((t) => ({ ...t, targetGroups: true }));
  };

  const validate = () => {
    const next = {
      name: required(name, 'Campaign name') || minLength(name, 4, 'Campaign name'),
      targetGroups:
        targetGroups.length === 0 ? 'Select at least one blood group.' : null,
      preferredDate: notPastDate(preferredDate, 'Preferred date'),
      venueName: required(venueName, 'Venue name'),
    };
    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const handleSave = async () => {
    setTouched({
      name: true,
      targetGroups: true,
      preferredDate: true,
      venueName: true,
    });
    if (!validate()) return;

    try {
      setSaving(true);
      const { data } = await campaignService.update(campaign._id, {
        name: name.trim(),
        targetBloodGroups: targetGroups,
        preferredDate: new Date(preferredDate).toISOString(),
        venue: {
          type: venueType,
          name: venueName.trim(),
          address: venueAddress.trim() || undefined,
        },
        hospitalName: venueType === 'HOSPITAL' ? HOSPITAL : null,
      });

      navigation.replace('CampaignConfirmation', {
        mode: 'updated',
        campaign: data.campaign,
      });
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to update.');
    } finally {
      setSaving(false);
    }
  };

  if (!campaign) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <AppHeader navigation={navigation} showBack />
        <View style={{ padding: 20 }}>
          <Text>Campaign not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader navigation={navigation} showBack />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>{t('pages.editCampaign')}</Text>
          <Text style={styles.subtitle}>Update the details below.</Text>

          <FormField label="CAMPAIGN NAME" error={touched.name ? errors.name : null}>
            <View style={styles.inputContainer}>
              <Ionicons
                name="megaphone"
                size={18}
                color={colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                maxLength={60}
              />
            </View>
          </FormField>

          <FormField
            label={`TARGET BLOOD GROUPS (${targetGroups.length} selected)`}
            error={touched.targetGroups ? errors.targetGroups : null}
          >
            <View style={styles.chipRow}>
              {GROUPS.map((g) => {
                const active = targetGroups.includes(g);
                return (
                  <TouchableOpacity
                    key={g}
                    style={[styles.groupChip, active && styles.groupChipActive]}
                    onPress={() => toggleGroup(g)}
                  >
                    {active ? (
                      <Ionicons name="checkmark" size={14} color={colors.white} />
                    ) : null}
                    <Text
                      style={[
                        styles.groupChipText,
                        active && styles.groupChipTextActive,
                      ]}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </FormField>

          <FormField
            label="PREFERRED DATE"
            error={touched.preferredDate ? errors.preferredDate : null}
          >
            <DateField value={preferredDate} onChange={setPreferredDate} />
          </FormField>

          <FormField label="VENUE TYPE">
            <View style={styles.venueTypeRow}>
              {VENUE_TYPES.map((v) => {
                const active = venueType === v.key;
                return (
                  <TouchableOpacity
                    key={v.key}
                    style={[styles.venueTypeCard, active && styles.venueTypeCardActive]}
                    onPress={() => {
                      setVenueType(v.key);
                      if (v.key === 'HOSPITAL') {
                        setVenueName(HOSPITAL);
                        setVenueAddress('');
                      }
                    }}
                  >
                    <Ionicons
                      name={v.icon}
                      size={20}
                      color={active ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.venueTypeText,
                        active && styles.venueTypeTextActive,
                      ]}
                    >
                      {v.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </FormField>

          <FormField
            label="VENUE NAME"
            error={touched.venueName ? errors.venueName : null}
          >
            <View style={styles.inputContainer}>
              <Ionicons
                name={venueType === 'HOSPITAL' ? 'business' : 'location'}
                size={18}
                color={colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={venueName}
                onChangeText={setVenueName}
                onBlur={() => setTouched((t) => ({ ...t, venueName: true }))}
                editable={venueType !== 'HOSPITAL'}
                maxLength={80}
              />
            </View>
          </FormField>

          {venueType === 'EXTERNAL' ? (
            <FormField label="ADDRESS (optional)">
              <View style={styles.inputContainer}>
                <Ionicons
                  name="map"
                  size={18}
                  color={colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={venueAddress}
                  onChangeText={setVenueAddress}
                  placeholder="Full address"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </FormField>
          ) : null}

          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveText}>
              {saving ? 'SAVING...' : 'SAVE CHANGES'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cardBg },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 6 },
  subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 4, marginBottom: 20 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: 12,
    backgroundColor: colors.page,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: colors.page,
  },
  groupChipActive: { backgroundColor: colors.primary },
  groupChipText: { fontSize: 13, fontWeight: '700', color: colors.text },
  groupChipTextActive: { color: colors.white },
  venueTypeRow: { flexDirection: 'row', gap: 12 },
  venueTypeCard: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.cardBg,
  },
  venueTypeCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  venueTypeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  venueTypeTextActive: { color: colors.primary },
  saveBtn: {
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  saveText: { color: colors.white, fontWeight: '800', fontSize: 14 },
});

export default EditCampaignScreen;
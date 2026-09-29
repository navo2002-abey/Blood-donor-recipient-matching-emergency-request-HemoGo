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
import { campaignService } from '../../services/officerService';
import { colors } from '../../utils/colors';
import { minLength, notPastDate, required } from '../../utils/validators';

const GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

const OrganizeDonationDriveScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [targetBloodGroup, setTarget] = useState('O-');
  const [preferredDate, setPreferredDate] = useState('');
  const [venue, setVenue] = useState('');
  const [saving, setSaving] = useState(false);

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = () => {
    const next = {
      name: required(name, 'Campaign name') || minLength(name, 4, 'Campaign name'),
      targetBloodGroup: required(targetBloodGroup, 'Blood group'),
      preferredDate: notPastDate(preferredDate, 'Preferred date'),
      venue: required(venue, 'Venue') || minLength(venue, 3, 'Venue'),
    };
    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const handlePublish = async () => {
    setTouched({
      name: true,
      targetBloodGroup: true,
      preferredDate: true,
      venue: true,
    });
    if (!validate()) return;

    try {
      setSaving(true);
      await campaignService.create({
        name: name.trim(),
        targetBloodGroup,
        preferredDate: new Date(preferredDate).toISOString(),
        venue: venue.trim(),
        suggestedByAI: true,
        reason: `Predicted ${targetBloodGroup} shortage`,
        status: 'PUBLISHED',
      });

      navigation.goBack();
      setTimeout(() => {
        Alert.alert('Published', 'Donation drive created successfully.');
      }, 200);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to publish.');
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
          <Text style={styles.headerTitle}>Organize Donation Drive</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Organize Donation Drive</Text>
          <Text style={styles.subtitle}>Suggested based on AI shortage predictions.</Text>

          <View style={styles.aiBox}>
            <View style={styles.aiIcon}>
              <Ionicons name="megaphone-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiTitle}>AI SUGGESTION</Text>
              <Text style={styles.aiText}>
                A campaign for <Text style={styles.aiBold}>{targetBloodGroup}</Text> blood
                type is highly recommended within the next 3 days.
              </Text>
            </View>
          </View>

          <FormField label="CAMPAIGN NAME" error={touched.name ? errors.name : null}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              placeholder="e.g. Life-Save Colombo Drive"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              maxLength={60}
            />
          </FormField>

          <FormField
            label="TARGET BLOOD GROUP"
            error={touched.targetBloodGroup ? errors.targetBloodGroup : null}
          >
            <View style={styles.chipRow}>
              {GROUPS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.chip, targetBloodGroup === g && styles.chipActive]}
                  onPress={() => {
                    setTarget(g);
                    setTouched((t) => ({ ...t, targetBloodGroup: true }));
                  }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      targetBloodGroup === g && styles.chipTextActive,
                    ]}
                  >
                    {g}
                    {g === 'O-' ? ' ★' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </FormField>

          <FormField
            label="PREFERRED DATE"
            error={touched.preferredDate ? errors.preferredDate : null}
          >
            <DateField value={preferredDate} onChange={setPreferredDate} />
          </FormField>

          <FormField label="LOCATION / VENUE" error={touched.venue ? errors.venue : null}>
            <TextInput
              style={styles.input}
              value={venue}
              onChangeText={setVenue}
              onBlur={() => setTouched((t) => ({ ...t, venue: true }))}
              placeholder="e.g. Independence Square, Colombo"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              maxLength={80}
            />
          </FormField>

          <TouchableOpacity
            style={styles.publishBtn}
            onPress={handlePublish}
            disabled={saving}
          >
            <Text style={styles.publishText}>
              {saving ? 'PUBLISHING...' : 'Publish Campaign'}
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
  aiBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFF1F3',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  aiIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTitle: { fontSize: 11, fontWeight: '800', color: colors.primary, letterSpacing: 0.5 },
  aiText: { fontSize: 12, color: colors.text, marginTop: 4, lineHeight: 17 },
  aiBold: { fontWeight: '800', color: colors.primary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: '#F4F4F6',
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.text },
  chipTextActive: { color: colors.white },
  input: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#F4F4F6',
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.text,
  },
  publishBtn: {
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  publishText: { color: colors.white, fontWeight: '800', fontSize: 14, letterSpacing: 0.4 },
});

export default OrganizeDonationDriveScreen;
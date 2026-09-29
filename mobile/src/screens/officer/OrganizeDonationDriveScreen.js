import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { campaignService } from '../../services/officerService';
import { colors } from '../../utils/colors';

const GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

const OrganizeDonationDriveScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [targetBloodGroup, setTarget] = useState('O-');
  const [preferredDate, setPreferredDate] = useState('');
  const [venue, setVenue] = useState('');
  const [saving, setSaving] = useState(false);

  const handlePublish = async () => {
    if (!name || !targetBloodGroup || !preferredDate || !venue) {
      return Alert.alert('Missing', 'Please fill all fields.');
    }
    const parsed = new Date(preferredDate);
    if (isNaN(parsed.getTime())) return Alert.alert('Invalid date', 'Use YYYY-MM-DD.');

    try {
      setSaving(true);
      await campaignService.create({
        name,
        targetBloodGroup,
        preferredDate: parsed.toISOString(),
        venue,
        suggestedByAI: true,
        reason: `Predicted ${targetBloodGroup} shortage`,
        status: 'PUBLISHED',
      });
      Alert.alert('Published', 'Donation drive created.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to publish.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Organize Donation Drive</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Organize Donation Drive</Text>
        <Text style={styles.subtitle}>Suggested based on AI shortage predictions.</Text>

        <View style={styles.aiBox}>
          <View style={styles.aiIcon}>
            <Ionicons name="megaphone-outline" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.aiTitle}>AI SUGGESTION</Text>
            <Text style={styles.aiText}>
              A campaign for <Text style={styles.aiBold}>{targetBloodGroup}</Text> blood type is highly
              recommended within the next 3 days.
            </Text>
          </View>
        </View>

        <Text style={styles.label}>CAMPAIGN NAME</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Life-Save Colombo Drive"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>TARGET BLOOD GROUP</Text>
        <View style={styles.chipRow}>
          {GROUPS.map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.chip, targetBloodGroup === g && styles.chipActive]}
              onPress={() => setTarget(g)}
            >
              <Text style={[styles.chipText, targetBloodGroup === g && styles.chipTextActive]}>
                {g}{g === 'O-' ? ' (Recommended)' : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>PREFERRED DATE</Text>
        <TextInput
          style={styles.input}
          value={preferredDate}
          onChangeText={setPreferredDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>LOCATION / VENUE</Text>
        <TextInput
          style={styles.input}
          value={venue}
          onChangeText={setVenue}
          placeholder="e.g. Independence Square, Colombo"
          placeholderTextColor={colors.textMuted}
        />

        <TouchableOpacity style={styles.publishBtn} onPress={handlePublish} disabled={saving}>
          <Text style={styles.publishText}>{saving ? 'PUBLISHING...' : 'Publish Campaign'}</Text>
        </TouchableOpacity>
      </ScrollView>
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
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 6, marginBottom: 20 },
  aiBox: { flexDirection: 'row', gap: 12, backgroundColor: '#FFF1F3', borderRadius: 16, padding: 14, marginBottom: 10 },
  aiIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  aiTitle: { fontSize: 11, fontWeight: '800', color: colors.primary, letterSpacing: 0.5 },
  aiText: { fontSize: 12, color: colors.text, marginTop: 4, lineHeight: 17 },
  aiBold: { fontWeight: '800', color: colors.primary },
  label: { fontSize: 12, fontWeight: '800', color: colors.text, marginTop: 18, marginBottom: 10, letterSpacing: 0.4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 22, backgroundColor: '#F4F4F6' },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.text },
  chipTextActive: { color: colors.white },
  input: { height: 54, borderRadius: 16, backgroundColor: '#F4F4F6', paddingHorizontal: 16, fontSize: 15, color: colors.text },
  publishBtn: { height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 30 },
  publishText: { color: colors.white, fontWeight: '800', fontSize: 14, letterSpacing: 0.4 },
});

export default OrganizeDonationDriveScreen;
import { Ionicons } from '@expo/vector-icons';
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
import DateField from '../../components/DateField';
import FormField from '../../components/FormField';
import { BloodDrop } from '../../components/Logo';
import Sidebar from '../../components/Sidebar';
import { useAlerts } from '../../context/AlertsContext';
import { useMyHospital } from '../../hooks/useMyHospital';
import { campaignService } from '../../services/officerService';
import { colors } from '../../utils/colors';
import { OFFICER_MENU } from '../../utils/roles';
import { minLength, notPastDate, required } from '../../utils/validators';

const GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

const comingSoon = (label) => Alert.alert('Coming Soon', `${label} will be available soon.`);

const OrganizeDonationDriveScreen = ({ navigation, route }) => {
  const HOSPITAL = useMyHospital();
  const initialGroup = route?.params?.bloodGroup || 'O-';
  const { unreadCount } = useAlerts();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [name, setName] = useState('');
  const [targetBloodGroup, setTarget] = useState(initialGroup);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
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
    setTouched({ name: true, targetBloodGroup: true, preferredDate: true, venue: true });
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
      setTimeout(() => Alert.alert('Published', 'Donation drive created.'), 200);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to publish.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity hitSlop={10} style={styles.headerBtn} onPress={() => setSidebarOpen(true)}>
            <Ionicons name="menu-outline" size={26} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.brand}>
            <BloodDrop size={16} />
            <Text style={styles.brandText}>HemoGo</Text>
          </View>
          <TouchableOpacity hitSlop={10} style={styles.headerBtn} onPress={() => navigation.navigate('Alerts')}>
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
            {unreadCount > 0 ? <View style={styles.bellBadge} /> : null}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Organize Donation Drive</Text>
          <Text style={styles.subtitle}>Suggested based on AI shortage predictions.</Text>

          <View style={styles.aiBox}>
            <View style={styles.aiIcon}>
              <Ionicons name="hardware-chip" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiTitle}>AI SUGGESTION</Text>
              <Text style={styles.aiText}>
                A campaign for <Text style={styles.aiBold}>{targetBloodGroup} blood type</Text> is highly recommended within the next 3 days.
              </Text>
            </View>
          </View>

          <FormField label="CAMPAIGN NAME" error={touched.name ? errors.name : null}>
            <View style={styles.inputContainer}>
              <Ionicons name="megaphone" size={18} color={colors.textMuted} style={styles.inputIcon} />
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
            </View>
          </FormField>

          <FormField label="TARGET BLOOD GROUP" error={touched.targetBloodGroup ? errors.targetBloodGroup : null}>
            <TouchableOpacity style={styles.inputContainer} onPress={() => setShowGroupPicker((v) => !v)}>
              <View style={styles.inputIcon}>
                <BloodDrop size={16} />
              </View>
              <Text style={styles.dropdownText}>{targetBloodGroup} (Recommended)</Text>
              <Ionicons name={showGroupPicker ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
            </TouchableOpacity>
            {showGroupPicker && (
              <View style={styles.pickerList}>
                {GROUPS.map((g) => {
                  const active = g === targetBloodGroup;
                  return (
                    <TouchableOpacity
                      key={g}
                      style={[styles.pickerItem, active && styles.pickerItemActive]}
                      onPress={() => {
                        setTarget(g);
                        setShowGroupPicker(false);
                        setTouched((t) => ({ ...t, targetBloodGroup: true }));
                      }}
                    >
                      <Text style={[styles.pickerItemText, active && styles.pickerItemTextActive]}>{g}</Text>
                      {active ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </FormField>

          <FormField label="PREFERRED DATE" error={touched.preferredDate ? errors.preferredDate : null}>
            <DateField value={preferredDate} onChange={setPreferredDate} />
          </FormField>

          <FormField label="LOCATION / VENUE" error={touched.venue ? errors.venue : null}>
            <View style={styles.inputContainer}>
              <Ionicons name="location" size={18} color={colors.textMuted} style={styles.inputIcon} />
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
            </View>
          </FormField>

          <TouchableOpacity style={[styles.publishBtn, saving && { opacity: 0.6 }]} onPress={handlePublish} disabled={saving}>
            <Text style={styles.publishText}>{saving ? 'PUBLISHING...' : 'Publish Campaign'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        onComingSoon={comingSoon}
        menu={OFFICER_MENU}
        variant="staff"
        activeKey="Organize Donation Drive"
        hospital={HOSPITAL}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandText: { color: colors.primary, fontSize: 18, fontWeight: '800' },
  bellBadge: { position: 'absolute', top: 6, right: 7, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, borderWidth: 1.5, borderColor: colors.white },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 10 },
  subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 4, marginBottom: 20 },
  aiBox: { flexDirection: 'row', backgroundColor: '#FFF1F3', borderRadius: 16, padding: 16, marginBottom: 24, alignItems: 'center' },
  aiIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  aiTitle: { fontSize: 10, fontWeight: '800', color: colors.primary, letterSpacing: 0.5, marginBottom: 4 },
  aiText: { fontSize: 12, color: colors.text, lineHeight: 18, fontWeight: '600' },
  aiBold: { fontWeight: '800', color: colors.primary },
  inputContainer: { flexDirection: 'row', alignItems: 'center', height: 54, borderRadius: 12, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#F3F4F6', paddingHorizontal: 16 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '600' },
  dropdownText: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '800' },
  pickerList: { marginTop: 8, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6', overflow: 'hidden' },
  pickerItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  pickerItemActive: { backgroundColor: '#FFF1F3' },
  pickerItemText: { fontSize: 14, fontWeight: '700', color: colors.text },
  pickerItemTextActive: { color: colors.primary, fontWeight: '800' },
  publishBtn: { height: 56, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  publishText: { color: colors.white, fontWeight: '800', fontSize: 14 },
});

export default OrganizeDonationDriveScreen;
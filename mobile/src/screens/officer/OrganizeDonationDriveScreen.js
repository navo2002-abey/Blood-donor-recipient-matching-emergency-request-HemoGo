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
import AppHeader from '../../components/AppHeader';
import DateField from '../../components/DateField';
import FormField from '../../components/FormField';
import Sidebar from '../../components/Sidebar';
import { useMyHospital } from '../../hooks/useMyHospital';
import { useUserLocation } from '../../hooks/useUserLocation';
import { campaignService } from '../../services/officerService';
import { colors } from '../../utils/colors';
import { OFFICER_MENU } from '../../utils/roles';
import { minLength, notPastDate, required } from '../../utils/validators';

const GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const VENUE_TYPES = [
  { key: 'HOSPITAL', label: 'My Hospital', icon: 'business' },
  { key: 'EXTERNAL', label: 'External Location', icon: 'location' },
];

const comingSoon = (label) =>
  Alert.alert('Coming Soon', `${label} will be available soon.`);

const OrganizeDonationDriveScreen = ({ navigation, route }) => {
  const HOSPITAL = useMyHospital();
  const { location } = useUserLocation();
  const initialGroups = route?.params?.bloodGroups || [];

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [name, setName] = useState('');
  const [targetGroups, setTargetGroups] = useState(initialGroups);
  const [preferredDate, setPreferredDate] = useState('');
  const [venueType, setVenueType] = useState('HOSPITAL');
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [detecting, setDetecting] = useState(false);

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const toggleGroup = (g) => {
    setTargetGroups((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
    setTouched((t) => ({ ...t, targetGroups: true }));
  };

  const handleDetectLocation = () => {
    if (!location) {
      return Alert.alert('Location unavailable', 'Please allow location access.');
    }
    setDetecting(true);
    setTimeout(() => {
      setVenueAddress(
        `Lat ${location.latitude.toFixed(4)}, Lng ${location.longitude.toFixed(4)}`
      );
      if (!venueName) setVenueName('Current Location');
      setDetecting(false);
    }, 600);
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
    return !Object.values(next).some(Boolean);   // ✅
  };

  const handlePublish = async () => {
    setTouched({
      name: true,
      targetGroups: true,
      preferredDate: true,
      venueName: true,
    });
    if (!validate()) return;

    try {
      setSaving(true);

      const venuePayload = {
        type: venueType,
        name: venueName.trim(),
        address: venueAddress.trim() || undefined,
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
      };

      const { data } = await campaignService.create({
        name: name.trim(),
        targetBloodGroups: targetGroups,
        preferredDate: new Date(preferredDate).toISOString(),
        venue: venuePayload,
        hospitalName: venueType === 'HOSPITAL' ? HOSPITAL : null,
        reason: `Shortage for ${targetGroups.join(', ')}`,
        suggestedByAI: true,
        status: 'PUBLISHED',
      });

      // ✅ Go to confirmation screen
      navigation.replace('CampaignConfirmation', {
        mode: 'created',
        campaign: data.campaign,
      });
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to publish.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader
        navigation={navigation}
        onMenuPress={() => setSidebarOpen(true)}
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Organize Donation Drive</Text>
          <Text style={styles.subtitle}>
            Suggested based on AI shortage predictions.
          </Text>

          {/* AI box */}
          <View style={styles.aiBox}>
            <View style={styles.aiIcon}>
              <Ionicons name="hardware-chip" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiTitle}>AI SUGGESTION</Text>
              <Text style={styles.aiText}>
                A campaign for{' '}
                <Text style={styles.aiBold}>
                  {targetGroups.length > 0
                    ? targetGroups.join(', ')
                    : 'selected blood types'}
                </Text>{' '}
                is recommended within the next 3 days.
              </Text>
            </View>
          </View>

          {/* Campaign name */}
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
                placeholder="e.g. Life-Save Colombo Drive"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
                maxLength={60}
              />
            </View>
          </FormField>

          {/* Target groups — multi-select */}
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

          {/* Preferred date */}
          <FormField
            label="PREFERRED DATE"
            error={touched.preferredDate ? errors.preferredDate : null}
          >
            <DateField value={preferredDate} onChange={setPreferredDate} />
          </FormField>

          {/* Venue type */}
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
                      } else if (venueName === HOSPITAL) {
                        setVenueName('');
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

          {/* Venue name */}
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
                placeholder={
                  venueType === 'HOSPITAL'
                    ? 'Hospital name'
                    : 'e.g. Independence Square, Colombo'
                }
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
                editable={venueType !== 'HOSPITAL'}
                maxLength={80}
              />
            </View>
          </FormField>

          {/* Address + detect (external only) */}
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
                  placeholder="Full address or coordinates"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <TouchableOpacity
                style={[styles.detectBtn, detecting && { opacity: 0.6 }]}
                onPress={handleDetectLocation}
                disabled={detecting}
              >
                <Ionicons
                  name={detecting ? 'hourglass-outline' : 'navigate'}
                  size={16}
                  color={colors.primary}
                />
                <Text style={styles.detectText}>
                  {detecting ? 'Detecting...' : 'Use current location'}
                </Text>
              </TouchableOpacity>
            </FormField>
          ) : null}

          <TouchableOpacity
            style={[styles.publishBtn, saving && { opacity: 0.6 }]}
            onPress={handlePublish}
            disabled={saving}
          >
            <Text style={styles.publishText}>
              {saving ? 'PUBLISHING...' : 'Publish Campaign'}
            </Text>
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
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 6 },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 20,
  },

  aiBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF1F3',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  aiIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  aiTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  aiText: {
    fontSize: 12,
    color: colors.text,
    lineHeight: 18,
    fontWeight: '600',
  },
  aiBold: { fontWeight: '800', color: colors.primary },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    paddingHorizontal: 16,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '600' },

  /* Multi-group chips */
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: '#F4F4F6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  groupChipActive: {
    backgroundColor: colors.primary,
  },
  groupChipText: { fontSize: 13, fontWeight: '700', color: colors.text },
  groupChipTextActive: { color: colors.white },

  /* Venue type cards */
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
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  venueTypeCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFF8F9',
  },
  venueTypeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  venueTypeTextActive: { color: colors.primary },

  detectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
  },
  detectText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 12,
  },

  publishBtn: {
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  publishText: { color: colors.white, fontWeight: '800', fontSize: 14 },
});

export default OrganizeDonationDriveScreen;
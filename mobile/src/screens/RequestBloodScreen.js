import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserLocation } from '../hooks/useUserLocation';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { colors } from '../utils/colors';
import { getNearbyDonors } from '../utils/nearbyDonors';
import { getApiErrorMessage } from '../utils/validation';
import { useTheme } from '../context/ThemeContext';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const MAX_DETAILS = 200;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatReceipt = (date) => {
  const hours24 = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const hours = String(hours24 % 12 || 12).padStart(2, '0');
  const time = `${hours}:${minutes} ${suffix}`;
  const stamp = `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()} • ${time}`;
  const serial = String(1000 + ((date.getDate() * 40 + date.getHours() * 3 + date.getMinutes()) % 9000)).padStart(4, '0');
  return { time, stamp, id: `#RG-${date.getFullYear()}-${serial}` };
};

const initials = (name) =>
  String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const RequestBloodScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLanguage();
  const { location } = useUserLocation();
  const donors = useMemo(() => getNearbyDonors(location), [location]);
  const donor = donors.find((item) => item.id === route.params?.donorId) || null;
  const [bloodGroup, setBloodGroup] = useState(donor?.bloodGroup || 'A+');
  const [place, setPlace] = useState(donor?.address || '');
  const [units, setUnits] = useState(1);
  const [details, setDetails] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const sendRequest = async () => {
    if (!donor || sending) return;
    const locationText = place.trim() || donor.address;
    if (!locationText) {
      Alert.alert('Missing location', 'Enter the location for this request.');
      return;
    }

    try {
      setSending(true);
      const { data } = await api.post('/request-summaries', {
        donorId: donor.id,
        donorName: donor.name,
        donorPhone: donor.phone,
        donorHospital: donor.hospital,
        donorArea: donor.area,
        bloodType: bloodGroup,
        unitsRequired: units,
        location: locationText,
        additionalDetails: details.trim(),
      });
      const saved = data.data;
      const when = new Date(saved.requestedAt);
      setReceipt({ ...formatReceipt(when), id: saved.requestId });
      setSent(true);
    } catch (error) {
      Alert.alert('Request failed', getApiErrorMessage(error, 'Unable to save the request.'));
    } finally {
      setSending(false);
    }
  };

  const goHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        {sent ? (
          <View style={styles.headerBtn} />
        ) : (
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10} style={styles.headerBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>{t('pages.requestBlood')}</Text>
        <View style={styles.headerBtn} />
      </View>

      {donor && sent && receipt ? (
        <>
          <ScrollView contentContainerStyle={styles.sentScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.sentIcon}>
              <Ionicons name="checkmark" size={28} color={colors.white} />
            </View>
            <Text style={styles.sentTitle}>Request Sent!</Text>
            <Text style={styles.sentText}>
              Your blood request has been successfully sent.{'\n'}We'll notify you once a donor is found.
            </Text>

            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>Request Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Blood Type</Text>
                <Text style={styles.summaryValue}>{bloodGroup}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Units Required</Text>
                <Text style={styles.summaryValue}>{units} {units === 1 ? 'unit' : 'units'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Location</Text>
                <Text style={[styles.summaryValue, styles.summaryWrap]}>{place.trim() || donor.address}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Additional Details</Text>
                <Text style={[styles.summaryValue, styles.summaryWrap]}>
                  {details.trim() || 'No extra details'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Request ID</Text>
                <Text style={styles.summaryId}>{receipt.id}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Requested At</Text>
                <Text style={styles.summaryValue}>{receipt.stamp}</Text>
              </View>
            </View>

            <View style={styles.nextCard}>
              <Text style={styles.summaryTitle}>What happens next?</Text>
              <View style={styles.step}>
                <View style={styles.rail}>
                  <View style={styles.stepDone}>
                    <Ionicons name="checkmark" size={14} color={colors.white} />
                  </View>
                  <View style={styles.stepLine} />
                </View>
                <View style={styles.stepBody}>
                  <View style={styles.stepTop}>
                    <Text style={styles.stepTitle}>Request Sent</Text>
                    <Text style={styles.stepTime}>{receipt.time}</Text>
                  </View>
                  <Text style={styles.stepSub}>Your request has been received.</Text>
                </View>
              </View>
              <View style={styles.step}>
                <View style={styles.rail}>
                  <View style={styles.stepIdle}>
                    <Ionicons name="people-outline" size={15} color={colors.primary} />
                  </View>
                  <View style={styles.stepLine} />
                </View>
                <View style={styles.stepBody}>
                  <View style={styles.stepTop}>
                    <Text style={styles.stepTitle}>Finding a Suitable Donor</Text>
                    <Text style={styles.stepProgress}>In progress</Text>
                  </View>
                  <Text style={styles.stepSub}>We're checking available donors near you.</Text>
                </View>
              </View>
              <View style={styles.step}>
                <View style={styles.rail}>
                  <View style={styles.stepIdle}>
                    <Ionicons name="notifications-outline" size={15} color={colors.textSecondary} />
                  </View>
                </View>
                <View style={styles.stepBody}>
                  <View style={styles.stepTop}>
                    <Text style={styles.stepTitle}>You'll Be Notified</Text>
                    <Text style={styles.stepPending}>Pending</Text>
                  </View>
                  <Text style={styles.stepSub}>We'll contact you once a donor is confirmed.</Text>
                </View>
              </View>
            </View>
          </ScrollView>
          <View style={styles.footer}>
            <TouchableOpacity style={styles.sendBtn} onPress={goHome} activeOpacity={0.85}>
              <Text style={styles.sendText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : null}

      {donor && !sent ? (
        <>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.urgent}>
              <View style={styles.urgentIcon}>
                <Ionicons name="water" size={18} color="#F8B4BE" />
              </View>
              <View style={styles.urgentBody}>
                <Text style={styles.urgentTitle}>Urgent Request</Text>
                <Text style={styles.urgentText}>Help save a life by requesting blood from verified donors.</Text>
              </View>
            </View>

            <View style={styles.donorCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials(donor.name)}</Text>
              </View>
              <View style={styles.donorBody}>
                <Text style={styles.donorName}>{donor.name}</Text>
                <Text style={styles.receiver}>Receiver</Text>
                <Text style={styles.donorMeta}>
                  {donor.gender}  |  {donor.age} years
                </Text>
                <Text style={styles.donorMeta}>{donor.area}</Text>
              </View>
              <View style={styles.requiredBox}>
                <Text style={styles.requiredGroup}>{donor.bloodGroup}</Text>
                <Text style={styles.requiredLabel}>Required Blood Type</Text>
              </View>
            </View>

            <Text style={styles.label}>Blood Type Needed</Text>
            <View style={styles.chips}>
              {BLOOD_GROUPS.map((group) => {
                const selected = group === bloodGroup;
                return (
                  <TouchableOpacity
                    key={group}
                    style={[styles.chip, selected && styles.chipOn]}
                    onPress={() => setBloodGroup(group)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextOn]}>{group}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>
              Location <Text style={styles.optional}>(Optional)</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={place}
              onChangeText={setPlace}
              placeholder="Hospital or address"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>
              Units Required <Text style={styles.optional}>(Optional)</Text>
            </Text>
            <View style={styles.unitsRow}>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setUnits((value) => Math.max(1, value - 1))}
                  hitSlop={6}
                >
                  <Text style={styles.stepMark}>−</Text>
                </TouchableOpacity>
                <Text style={styles.unitCount}>{units}</Text>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setUnits((value) => Math.min(10, value + 1))}
                  hitSlop={6}
                >
                  <Text style={styles.stepMark}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.unitHint}>
                {units} {units === 1 ? 'unit' : 'units'} can help save up to {units * 3} lives
              </Text>
            </View>

            <Text style={styles.label}>
              Additional Details <Text style={styles.optional}>(Optional)</Text>
            </Text>
            <View style={styles.detailsWrap}>
              <TextInput
                style={styles.details}
                value={details}
                onChangeText={(value) => setDetails(value.slice(0, MAX_DETAILS))}
                placeholder="e.g. Patient condition, hospital name, special requirements..."
                placeholderTextColor={colors.textMuted}
                multiline
                textAlignVertical="top"
              />
              <Text style={styles.counter}>
                {details.length}/{MAX_DETAILS}
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.sendBtn} onPress={sendRequest} activeOpacity={0.85} disabled={sending}>
              <Text style={styles.sendText}>{sending ? 'Sending...' : 'Send Request'}</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : null}

      {!donor ? (
        <View style={styles.missing}>
          <Text style={styles.missingText}>This donor is no longer available.</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.page,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.cardBg,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '800',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  urgent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F8D0D6',
    padding: 14,
  },
  urgentIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FDE8EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgentBody: {
    flex: 1,
    marginLeft: 12,
  },
  urgentTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  urgentText: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  donorCard: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F8D0D6',
    padding: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8D0D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  donorBody: {
    flex: 1,
    marginLeft: 12,
  },
  donorName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  receiver: {
    marginTop: 1,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  donorMeta: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textSecondary,
  },
  requiredBox: {
    width: 92,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F8D0D6',
    backgroundColor: colors.cardBg,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  requiredGroup: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  requiredLabel: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  label: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  optional: {
    fontWeight: '500',
    color: colors.textMuted,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minWidth: 52,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  chipTextOn: {
    color: colors.white,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBg,
    paddingHorizontal: 14,
    fontSize: 14,
    color: colors.text,
  },
  unitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBg,
    paddingHorizontal: 6,
  },
  stepBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepMark: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  unitCount: {
    minWidth: 24,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  unitHint: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  detailsWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBg,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  details: {
    minHeight: 88,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  counter: {
    alignSelf: 'flex-end',
    fontSize: 11,
    color: colors.textMuted,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: colors.cardBg,
  },
  sendBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  missingText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  sentScroll: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: 'center',
  },
  sentIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 14,
  },
  sentTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  sentText: {
    marginTop: 8,
    marginBottom: 18,
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  summary: {
    alignSelf: 'stretch',
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#F6C9D0',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 4,
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3D5D9',
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    flexShrink: 0,
  },
  summaryValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  summaryWrap: {
    lineHeight: 18,
  },
  summaryId: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  nextCard: {
    alignSelf: 'stretch',
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#F6C9D0',
    borderRadius: 16,
    padding: 14,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rail: {
    width: 28,
    alignItems: 'center',
    marginRight: 10,
  },
  stepDone: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIdle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: '#F3C5CB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLine: {
    width: 2,
    flex: 1,
    minHeight: 22,
    backgroundColor: '#F3C5CB',
    marginVertical: 3,
  },
  stepBody: {
    flex: 1,
    paddingBottom: 12,
  },
  stepTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  stepTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  stepTime: {
    fontSize: 11,
    color: colors.textMuted,
  },
  stepProgress: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  stepPending: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  stepSub: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});

export default RequestBloodScreen;

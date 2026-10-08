import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BloodDrop } from '../components/Logo';
import { useUserLocation } from '../hooks/useUserLocation';
import { colors } from '../utils/colors';
import { getNearbyDonors } from '../utils/nearbyDonors';
import api from '../services/api';
import { getApiErrorMessage } from '../utils/validation';
import { useTheme } from '../context/ThemeContext';

const MAX_MESSAGE = 200;

const initials = (name) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const defaultMessage = (donor) => {
  const firstName = donor.name.split(' ')[0];
  return `Hi ${firstName}, I'm in urgent need of blood (${donor.bloodGroup}). Could you please help me with 1 unit? Your support means a lot. Thank you!`;
};

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

const DirectRequestScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { location } = useUserLocation();
  const donors = useMemo(() => getNearbyDonors(location), [location]);
  const donor = donors.find((item) => item.id === route.params?.donorId) || null;
  const [message, setMessage] = useState(donor ? defaultMessage(donor) : '');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const send = async () => {
    if (!donor || sending) {
      return;
    }
    if (!message.trim()) {
      Alert.alert('Missing message', 'Write a short message for the donor.');
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
        bloodType: donor.bloodGroup,
        unitsRequired: 1,
        location: donor.address,
        additionalDetails: message.trim(),
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
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        {sent ? (
          <View style={styles.backBtn} />
        ) : (
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>{sent ? 'Request Blood' : 'Direct Request'}</Text>
        <View style={styles.backBtn} />
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
                <Text style={styles.summaryValue}>{donor.bloodGroup}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Units Required</Text>
                <Text style={styles.summaryValue}>1 unit</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Location</Text>
                <Text style={[styles.summaryValue, styles.summaryWrap]}>{donor.address}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Additional Details</Text>
                <Text style={[styles.summaryValue, styles.summaryWrap]} numberOfLines={3}>
                  {message.trim()}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Request ID</Text>
                <Text style={styles.summaryId}>{receipt.id}</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryLast]}>
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
            <TouchableOpacity style={styles.sendBtn} onPress={goHome}>
              <Text style={styles.sendText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : null}

      {donor && !sent ? (
        <>
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.subtitle}>
              Send a direct request to the selected donor. They will be notified immediately.
            </Text>

            <View style={styles.donorCard}>
              <View style={styles.avatarWrap}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials(donor.name)}</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{donor.bloodGroup}</Text>
                </View>
              </View>
              <View style={styles.donorBody}>
                <Text style={styles.donorName}>{donor.name}</Text>
                <Text style={styles.available}>{donor.available ? 'Available to Donate' : 'Unavailable'}</Text>
                <Text style={styles.donorMeta}>
                  {donor.gender} · {donor.age} years
                </Text>
                <Text style={styles.donorMeta}>{donor.area}</Text>
              </View>
            </View>

            <View style={styles.statRow}>
              <View style={styles.statCard}>
                <View style={styles.statIcon}>
                  <BloodDrop size={16} />
                </View>
                <View>
                  <Text style={styles.statLabel}>Blood Type</Text>
                  <Text style={styles.statValue}>{donor.bloodGroup}</Text>
                </View>
              </View>
              <View style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Ionicons name="sync-outline" size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.statLabel}>Units Requested</Text>
                  <Text style={styles.statValue}>1 unit</Text>
                </View>
              </View>
            </View>

            <Text style={styles.label}>Location</Text>
            <Text style={styles.address}>{donor.address}</Text>

            <Text style={styles.label}>
              Message <Text style={styles.optional}>(Optional)</Text>
            </Text>
            <View style={styles.messageBox}>
              <TextInput
                value={message}
                onChangeText={(value) => setMessage(value.slice(0, MAX_MESSAGE))}
                multiline
                style={styles.messageInput}
                placeholder="Write a message to the donor"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.counter}>
                {message.length}/{MAX_MESSAGE}
              </Text>
            </View>

            <View style={styles.note}>
              <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.noteText}>
                The donor will be notified with your request details. You can chat with them if they accept
                your request.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.sendBtn} onPress={send} disabled={sending}>
              <Text style={styles.sendText}>{sending ? 'Sending...' : 'Send Request'}</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : null}

      {!donor ? (
        <View style={styles.missing}>
          <Text style={styles.sentText}>This donor could not be found.</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cardBg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.primary },
  scroll: { paddingHorizontal: 16, paddingBottom: 16 },
  subtitle: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: 14 },
  donorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  avatarWrap: { marginRight: 12 },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#F3D2C4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontWeight: '800', color: colors.primary, fontSize: 16 },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    minWidth: 28,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#FFF5F6',
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '800' },
  donorBody: { flex: 1 },
  donorName: { fontSize: 16, fontWeight: '800', color: colors.text },
  available: { marginTop: 2, color: '#16A34A', fontSize: 12, fontWeight: '700' },
  donorMeta: { marginTop: 2, color: colors.textSecondary, fontSize: 12 },
  statRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 14,
    padding: 12,
    backgroundColor: colors.cardBg,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: { fontSize: 11, color: colors.textSecondary },
  statValue: { marginTop: 2, fontSize: 15, fontWeight: '800', color: colors.text },
  label: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 8 },
  optional: { fontWeight: '500', color: colors.textMuted, fontSize: 13 },
  address: { fontSize: 14, color: colors.textSecondary, marginBottom: 16 },
  messageBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.page,
    padding: 12,
    marginBottom: 14,
    minHeight: 120,
  },
  messageInput: { minHeight: 78, color: colors.text, fontSize: 14, lineHeight: 20, textAlignVertical: 'top' },
  counter: { alignSelf: 'flex-end', color: colors.textMuted, fontSize: 12 },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F6F7F8',
    borderRadius: 12,
    padding: 12,
  },
  noteText: { flex: 1, color: colors.textSecondary, fontSize: 12, lineHeight: 17 },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: colors.cardBg,
  },
  sendBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  sentScroll: { paddingHorizontal: 16, paddingBottom: 16, alignItems: 'center' },
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
  sentTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
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
  summaryTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 8 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3D5D9',
  },
  summaryLast: { borderBottomWidth: 0 },
  summaryLabel: { fontSize: 13, color: colors.textSecondary, flexShrink: 0 },
  summaryValue: { flex: 1, textAlign: 'right', fontSize: 13, fontWeight: '800', color: colors.text },
  summaryWrap: { lineHeight: 18 },
  summaryId: { fontSize: 13, fontWeight: '800', color: colors.primary },
  nextCard: {
    alignSelf: 'stretch',
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#F6C9D0',
    borderRadius: 16,
    padding: 14,
  },
  step: { flexDirection: 'row', alignItems: 'flex-start' },
  rail: { width: 28, alignItems: 'center', marginRight: 10 },
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
  stepLine: { width: 2, flex: 1, minHeight: 22, backgroundColor: '#F3C5CB', marginVertical: 3 },
  stepBody: { flex: 1, paddingBottom: 12 },
  stepTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  stepTitle: { flex: 1, fontSize: 14, fontWeight: '800', color: colors.text },
  stepTime: { fontSize: 11, color: colors.textMuted },
  stepProgress: { fontSize: 11, fontWeight: '700', color: colors.primary },
  stepPending: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  stepSub: { marginTop: 2, fontSize: 12, color: colors.textSecondary, lineHeight: 16 },
});

export default DirectRequestScreen;

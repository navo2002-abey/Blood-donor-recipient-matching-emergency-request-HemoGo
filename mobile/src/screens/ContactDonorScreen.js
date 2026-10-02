import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Alert, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BloodDrop } from '../components/Logo';
import { useUserLocation } from '../hooks/useUserLocation';
import { colors } from '../utils/colors';
import { getNearbyDonors } from '../utils/nearbyDonors';
import { placeCall } from '../utils/phone';
import { groupsThatCanDonateTo } from '../utils/smartMatch';

const LAST_DONATED = ['2 weeks ago', '1 month ago', '3 months ago', '5 months ago'];
const MAX_MESSAGE = 160;

const initials = (name) =>
  String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const defaultMessage = (firstName) =>
  `Hi ${firstName}, I saw your profile on HemoGo. I need blood for a patient in need. Are you available to donate?`;

const phoneDigits = (phone) => String(phone || '').replace(/\D/g, '');

const openExternal = async (url) => {
  try {
    await Linking.openURL(url);
  } catch (error) {
    Alert.alert('Unable to open', 'This action is not available on this device.');
  }
};

const ContactDonorScreen = ({ navigation, route }) => {
  const { location } = useUserLocation();
  const donors = useMemo(() => getNearbyDonors(location), [location]);
  const donor = donors.find((item) => item.id === route.params?.donorId) || null;
  const firstName = donor?.name?.split(' ')[0] || 'Donor';
  const canDonateTo = donor ? groupsThatCanDonateTo(donor.bloodGroup) : [];
  const lastDonated = donor ? LAST_DONATED[Number(donor.id) % LAST_DONATED.length] : '';
  const [message, setMessage] = useState(donor ? defaultMessage(firstName) : '');

  const messageText = () => message.trim() || defaultMessage(firstName);

  const openWhatsApp = () => {
    if (!donor) return;
    const digits = phoneDigits(donor.phone);
    const text = encodeURIComponent(messageText());
    openExternal(`https://wa.me/${digits}?text=${text}`);
  };

  const openSms = () => {
    if (!donor) return;
    const number = `+${phoneDigits(donor.phone)}`;
    const body = encodeURIComponent(messageText());
    const separator = Platform.OS === 'ios' ? '&' : '?';
    openExternal(`sms:${number}${separator}body=${body}`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Donor</Text>
        <View style={styles.headerBtn} />
      </View>

      {donor ? (
        <>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.profile}>
              <View style={styles.avatarCol}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials(donor.name)}</Text>
                </View>
                <View style={styles.bloodPill}>
                  <Text style={styles.bloodPillText}>{donor.bloodGroup}</Text>
                </View>
              </View>
              <View style={styles.profileBody}>
                <Text style={styles.name}>{donor.name}</Text>
                <Text style={styles.available}>
                  {donor.available ? 'Available to Donate' : 'Not available right now'}
                </Text>
                <Text style={styles.meta}>
                  {donor.gender} · {donor.age} years
                </Text>
                <Text style={styles.meta}>{donor.area}</Text>
                <Text style={styles.meta}>Last Donated: {lastDonated}</Text>
              </View>
            </View>

            <View style={styles.statRow}>
              <View style={styles.statCard}>
                <BloodDrop size={18} />
                <Text style={styles.statLabel}>BLOOD TYPE</Text>
                <Text style={styles.statValue}>{donor.bloodGroup}</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="people-outline" size={18} color="#7C3AED" />
                <Text style={styles.statLabel}>CAN DONATE TO</Text>
                <Text style={styles.statValue}>{canDonateTo.join(', ') || donor.bloodGroup}</Text>
              </View>
            </View>

            <Text style={styles.section}>Contact Donor</Text>
            <Text style={styles.sectionHint}>Choose how you would like to get in touch with {donor.name}.</Text>

            <TouchableOpacity
              style={styles.option}
              activeOpacity={0.8}
              onPress={() => placeCall(donor.phone)}
            >
              <View style={[styles.optionIcon, styles.callIcon]}>
                <Ionicons name="call" size={18} color={colors.primary} />
              </View>
              <View style={styles.optionBody}>
                <Text style={styles.optionTitle}>Call</Text>
                <Text style={styles.optionSub}>{donor.phone}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.option}
              activeOpacity={0.8}
              onPress={openWhatsApp}
            >
              <View style={[styles.optionIcon, styles.whatsappIcon]}>
                <Ionicons name="logo-whatsapp" size={18} color="#16A34A" />
              </View>
              <View style={styles.optionBody}>
                <Text style={styles.optionTitle}>WhatsApp</Text>
                <Text style={styles.optionSub}>Chat with {firstName}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.option}
              activeOpacity={0.8}
              onPress={openSms}
            >
              <View style={[styles.optionIcon, styles.smsIcon]}>
                <Ionicons name="chatbubble" size={16} color={colors.text} />
              </View>
              <View style={styles.optionBody}>
                <Text style={styles.optionTitle}>Send SMS</Text>
                <Text style={styles.optionSub}>Send a message</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.messageCard}>
              <Text style={styles.messageLabel}>Quick Message (Optional)</Text>
              <TextInput
                style={styles.messageInput}
                value={message}
                onChangeText={(value) => setMessage(value.slice(0, MAX_MESSAGE))}
                multiline
                textAlignVertical="top"
              />
              <Text style={styles.counter}>
                {message.length}/{MAX_MESSAGE}
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.sendBtn} onPress={openSms} activeOpacity={0.85}>
              <Text style={styles.sendText}>Send Message</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backListBtn}
              onPress={() => navigation.navigate('FindDonors')}
              activeOpacity={0.85}
            >
              <Text style={styles.backListText}>Back to Donor List</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.missing}>
          <Text style={styles.missingText}>This donor is no longer available.</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.white,
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
    paddingBottom: 16,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF5F6',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F8D0D6',
    padding: 14,
  },
  avatarCol: {
    alignItems: 'center',
    marginRight: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  bloodPill: {
    marginTop: -10,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 2,
    borderColor: '#FFF5F6',
  },
  bloodPillText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  profileBody: {
    flex: 1,
    paddingTop: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  available: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
  },
  meta: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textSecondary,
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F2',
    padding: 12,
  },
  statLabel: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: colors.textMuted,
  },
  statValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  section: {
    marginTop: 18,
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  sectionHint: {
    marginTop: 4,
    marginBottom: 10,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F2',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callIcon: {
    backgroundColor: '#FDE8EB',
  },
  whatsappIcon: {
    backgroundColor: '#E8F8EE',
  },
  smsIcon: {
    backgroundColor: '#F3F4F6',
  },
  optionBody: {
    flex: 1,
    marginLeft: 12,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  optionSub: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textSecondary,
  },
  messageCard: {
    marginTop: 4,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F2',
    padding: 12,
  },
  messageLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  messageInput: {
    marginTop: 8,
    minHeight: 72,
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
    backgroundColor: colors.white,
    gap: 10,
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
  backListBtn: {
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  backListText: {
    color: colors.primary,
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
});

export default ContactDonorScreen;

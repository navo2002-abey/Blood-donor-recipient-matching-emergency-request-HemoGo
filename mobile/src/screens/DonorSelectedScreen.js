import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LiveDonorsMap from '../components/LiveDonorsMap';
import { BloodDrop } from '../components/Logo';
import { useUserLocation } from '../hooks/useUserLocation';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../utils/colors';
import { getNearbyDonors } from '../utils/nearbyDonors';
import { compatibleRecipients } from '../utils/smartMatch';
import { useTheme } from '../context/ThemeContext';

const LAST_DONATED = ['2 weeks ago', '1 month ago', '3 months ago', '5 months ago'];

const initials = (name) =>
  String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const DonorSelectedScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLanguage();
  const { location } = useUserLocation();
  const donors = useMemo(() => getNearbyDonors(location), [location]);
  const donor = donors.find((item) => item.id === route.params?.donorId) || null;
  const firstName = donor?.name?.split(' ')[0] || 'Donor';
  const canDonateTo = donor ? compatibleRecipients(donor.bloodGroup) : [];
  const lastDonated = donor ? LAST_DONATED[Number(donor.id) % LAST_DONATED.length] : '';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('pages.donorSelected')}</Text>
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

            <View style={styles.sectionRow}>
              <Text style={styles.section}>Location</Text>
              <Text style={styles.distance}>{donor.distanceKm.toFixed(1)} km away</Text>
            </View>
            <View style={styles.mapCard}>
              <LiveDonorsMap
                location={location}
                donors={[donor]}
                selectedId={donor.id}
                style={styles.map}
              />
            </View>

            <Text style={styles.addressLabel}>ADDRESS</Text>
            <Text style={styles.address}>{donor.address}</Text>

            <Text style={styles.aboutTitle}>About {firstName}</Text>
            <Text style={styles.about}>
              I'm {firstName}, based in {donor.area}. I've donated before and I'm happy to help when
              someone nearby needs {donor.bloodGroup} blood.
            </Text>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.contactBtn}
              onPress={() => navigation.navigate('ContactDonor', { donorId: donor.id })}
              activeOpacity={0.85}
            >
              <Text style={styles.contactText}>Contact Donor</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.requestBtn}
              onPress={() => navigation.navigate('RequestBlood', { donorId: donor.id })}
              activeOpacity={0.85}
            >
              <Text style={styles.requestText}>Request Blood</Text>
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
  profile: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primarySoft,
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
    backgroundColor: colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.primary,
    fontSize: 18,
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
  statRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    alignItems: 'flex-start',
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
  sectionRow: {
    marginTop: 18,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  section: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  distance: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  mapCard: {
    height: 168,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E8EEF3',
  },
  map: {
    flex: 1,
  },
  addressLabel: {
    marginTop: 16,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: colors.textMuted,
  },
  address: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  aboutTitle: {
    marginTop: 18,
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  about: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: colors.cardBg,
  },
  contactBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardBg,
  },
  contactText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  requestBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestText: {
    color: colors.white,
    fontSize: 14,
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

export default DonorSelectedScreen;

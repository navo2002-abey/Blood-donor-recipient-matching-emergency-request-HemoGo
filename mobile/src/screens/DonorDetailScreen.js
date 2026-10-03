import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LiveDonorsMap from '../components/LiveDonorsMap';
import { BloodDrop } from '../components/Logo';
import { useUserLocation } from '../hooks/useUserLocation';
import { colors } from '../utils/colors';
import { getNearbyDonors } from '../utils/nearbyDonors';
import { placeCall } from '../utils/phone';
import { useTheme } from '../context/ThemeContext';

const AVATAR_COLORS = ['#FDE8EB', '#E7F0FF', '#E8F8EE', '#FFF3E4', '#F3E8FF'];
const AVATAR_TEXT = ['#E31E35', '#1D4ED8', '#15803D', '#C2410C', '#7E22CE'];

const initials = (name) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const DonorDetailScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { location } = useUserLocation();
  const donors = useMemo(() => getNearbyDonors(location), [location]);
  const donor = donors.find((item) => item.id === route.params?.donorId) || null;
  const index = donor ? donors.findIndex((item) => item.id === donor.id) : 0;
  const [fullMap, setFullMap] = useState(false);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.brand}>
          <BloodDrop size={16} />
          <Text style={styles.brandText}>HemoGo</Text>
        </View>
        <View style={styles.headerBtn} />
      </View>

      {donor ? (
        <>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.profile}>
              <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] }]}>
                <Text style={[styles.avatarText, { color: AVATAR_TEXT[index % AVATAR_TEXT.length] }]}>
                  {initials(donor.name)}
                </Text>
              </View>
              <View style={styles.profileBody}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{donor.name}</Text>
                  <View style={styles.groupBadge}>
                    <Text style={styles.groupText}>{donor.bloodGroup}</Text>
                  </View>
                </View>
                <View style={styles.statusPill}>
                  <View style={styles.dot} />
                  <Text style={styles.statusText}>Available Now</Text>
                </View>
              </View>
            </View>

            <View style={styles.details}>
              <View style={styles.detailRow}>
                <Ionicons name="water-outline" size={16} color={colors.primary} />
                <Text style={styles.detailLabel}>Blood group</Text>
                <Text style={styles.detailValue}>{donor.bloodGroup}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="navigate-outline" size={16} color={colors.primary} />
                <Text style={styles.detailLabel}>Distance</Text>
                <Text style={styles.detailValue}>{donor.distanceKm.toFixed(1)} km</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="business-outline" size={16} color={colors.primary} />
                <Text style={styles.detailLabel}>Hospital</Text>
                <Text style={styles.detailValue}>{donor.hospital}</Text>
              </View>
            </View>

            <View style={styles.locationHeader}>
              <Text style={styles.section}>Location</Text>
              <TouchableOpacity onPress={() => setFullMap(true)} hitSlop={8}>
                <Text style={styles.fullMapLink}>View Full Map</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.mapCard}>
              <LiveDonorsMap
                location={location}
                donors={donors}
                selectedId={donor.id}
                interactive
                style={styles.map}
              />
            </View>
            <Text style={styles.mapHint}>
              {donor.name} is near {donor.hospital}, {donor.distanceKm.toFixed(1)} km from you.
            </Text>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => placeCall(donor.phone)}
            >
              <Text style={styles.callText}>Call Donor</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.requestBtn}
              onPress={() => navigation.navigate('DirectRequest', { donorId: donor.id })}
            >
              <Text style={styles.requestText}>Direct Request</Text>
            </TouchableOpacity>
          </View>

          <Modal visible={fullMap} animationType="slide" onRequestClose={() => setFullMap(false)}>
            <SafeAreaView style={styles.fullMapSafe} edges={['top', 'bottom']}>
              <View style={styles.header}>
                <TouchableOpacity onPress={() => setFullMap(false)} hitSlop={10} style={styles.headerBtn}>
                  <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.fullMapTitle}>{donor.name}</Text>
                <View style={styles.headerBtn} />
              </View>
              <LiveDonorsMap
                location={location}
                donors={donors}
                selectedId={donor.id}
                interactive
                style={styles.fullMap}
              />
            </SafeAreaView>
          </Modal>
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
  safe: { flex: 1, backgroundColor: colors.page },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.cardBg,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandText: { color: colors.primary, fontSize: 18, fontWeight: '800' },
  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F6C9D0',
    padding: 14,
    marginBottom: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { fontWeight: '800', fontSize: 18 },
  profileBody: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.text },
  groupBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  groupText: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    backgroundColor: '#E8F8EE',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success },
  statusText: { fontSize: 12, fontWeight: '700', color: '#16A34A' },
  details: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  detailLabel: { flex: 1, fontSize: 13, color: colors.textSecondary },
  detailValue: { fontSize: 13, fontWeight: '800', color: colors.text },
  section: { fontSize: 16, fontWeight: '800', color: colors.text },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  fullMapLink: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  mapCard: {
    height: 320,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: '#E8EEF3',
  },
  map: { flex: 1 },
  fullMapSafe: { flex: 1, backgroundColor: colors.cardBg },
  fullMapTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  fullMap: { flex: 1 },
  mapHint: { marginTop: 8, fontSize: 12, lineHeight: 17, color: colors.textSecondary },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: colors.cardBg,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  callBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardBg,
  },
  callText: { color: colors.primary, fontWeight: '800', fontSize: 14 },
  requestBtn: {
    flex: 1.2,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestText: { color: colors.white, fontWeight: '800', fontSize: 14 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  missingText: { color: colors.textSecondary, fontSize: 14 },
});

export default DonorDetailScreen;

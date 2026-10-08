import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BloodDrop } from '../components/Logo';
import { useUserLocation } from '../hooks/useUserLocation';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../utils/colors';
import { getNearbyDonors } from '../utils/nearbyDonors';
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

const AvailableDonorsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLanguage();
  const { location } = useUserLocation();
  const donors = useMemo(
    () =>
      getNearbyDonors(location)
        .filter((donor) => donor.available)
        .sort((a, b) => a.distanceKm - b.distanceKm),
    [location]
  );

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

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('pages.availableDonors')}</Text>
        <Text style={styles.subtitle}>Choose a donor to see their details and location.</Text>
        <Text style={styles.section}>{donors.length} donors available now</Text>

        {donors.map((donor, index) => (
          <TouchableOpacity
            key={donor.id}
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('DonorDetail', { donorId: donor.id })}
          >
            <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] }]}>
              <Text style={[styles.avatarText, { color: AVATAR_TEXT[index % AVATAR_TEXT.length] }]}>
                {initials(donor.name)}
              </Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.name}>{donor.name}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
                <Text style={styles.meta}>{donor.distanceKm.toFixed(1)} km</Text>
              </View>
              <View style={styles.metaRow}>
                <View style={styles.dot} />
                <Text style={styles.available}>Available Now</Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="business-outline" size={13} color={colors.textSecondary} />
                <Text style={styles.meta}>{donor.hospital}</Text>
              </View>
            </View>
            <View style={styles.groupBadge}>
              <Text style={styles.groupText}>{donor.bloodGroup}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { marginTop: 4, marginBottom: 14, color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  section: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#F6C9D0',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { fontWeight: '800', fontSize: 15 },
  cardBody: { flex: 1, paddingRight: 36 },
  name: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  meta: { fontSize: 12, color: colors.textSecondary },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success },
  available: { fontSize: 12, fontWeight: '700', color: '#16A34A' },
  groupBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.primarySoft,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  groupText: { color: colors.primary, fontWeight: '800', fontSize: 12 },
});

export default AvailableDonorsScreen;

import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LiveDonorsMap from '../components/LiveDonorsMap';
import { BloodDrop } from '../components/Logo';
import Sidebar from '../components/Sidebar';
import { useUserLocation } from '../hooks/useUserLocation';
import { colors } from '../utils/colors';
import { BLOOD_GROUPS, getNearbyDonors } from '../utils/nearbyDonors';
import { DONOR_MENU } from '../utils/roles';

const AVAILABILITY = ['Available Now', 'All', 'Unavailable'];
const AVATAR_COLORS = ['#FDE8EB', '#E7F0FF', '#E8F8EE', '#FFF3E4', '#F3E8FF'];
const AVATAR_TEXT = ['#E31E35', '#1D4ED8', '#15803D', '#C2410C', '#7E22CE'];

const comingSoon = (feature) => {
  Alert.alert('Coming Soon', `${feature} will be available in a later version.`);
};

const initials = (name) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const FindDonorsScreen = ({ navigation, route }) => {
  const menu = route.params?.menu || DONOR_MENU;
  const showAvailability = route.params?.showAvailability !== false;
  const { location } = useUserLocation();
  const donors = useMemo(() => getNearbyDonors(location), [location]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [bloodGroup, setBloodGroup] = useState('A+');
  const [availability, setAvailability] = useState('Available Now');
  const [openFilter, setOpenFilter] = useState(null);

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return donors
      .filter((donor) => {
        if (bloodGroup !== 'All' && donor.bloodGroup !== bloodGroup) {
          return false;
        }
        if (availability === 'Available Now' && !donor.available) {
          return false;
        }
        if (availability === 'Unavailable' && donor.available) {
          return false;
        }
        if (!text) {
          return true;
        }
        return [donor.name, donor.bloodGroup, donor.hospital]
          .join(' ')
          .toLowerCase()
          .includes(text);
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [availability, bloodGroup, donors, query]);

  const filterOptions = openFilter === 'blood' ? BLOOD_GROUPS : AVAILABILITY;
  const selectFilter = (value) => {
    if (openFilter === 'blood') {
      setBloodGroup(value);
    } else {
      setAvailability(value);
    }
    setOpenFilter(null);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidebarOpen(true)} hitSlop={10} style={styles.headerBtn}>
          <Ionicons name="menu-outline" size={26} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.brand}>
          <BloodDrop size={16} />
          <Text style={styles.brandText}>HemoGo</Text>
        </View>
        <TouchableOpacity onPress={() => comingSoon('Notifications')} hitSlop={10} style={styles.headerBtn}>
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
          <View style={styles.bellBadge} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Nearby Blood Donors</Text>
        <Text style={styles.subtitle}>
          Find blood donors available in your area and nearby hospitals.
        </Text>

        <View style={styles.search}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by area or blood group (e.g., A+, Colombo)"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.mapCard}>
          <LiveDonorsMap
            location={location}
            donors={filtered}
            radiusKm={5}
            placeLabel="Colombo General Hospital"
            style={styles.map}
          />
          <View style={styles.radiusBadge}>
            <Text style={styles.radiusText}>5 km</Text>
          </View>
        </View>

        <View style={styles.filters}>
          <TouchableOpacity style={styles.filter} onPress={() => setOpenFilter('blood')}>
            <Text style={styles.filterText}>
              Blood Group: <Text style={styles.filterValue}>{bloodGroup}</Text>
            </Text>
            <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.filter} onPress={() => setOpenFilter('availability')}>
            <Text style={styles.filterText}>
              Availability: <Text style={styles.filterValue}>{availability}</Text>
            </Text>
            <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.section}>Available Donors ({filtered.length})</Text>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No donors match this search.</Text>
          </View>
        ) : (
          filtered.map((donor, index) => (
            <TouchableOpacity
              key={donor.id}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate('Main', {
                  screen: 'Map',
                  params: {
                    donorId: donor.id,
                    bloodGroup: donor.bloodGroup,
                    availability: 'All',
                  },
                })
              }
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
                  <View style={[styles.dot, !donor.available && styles.dotMuted]} />
                  <Text style={[styles.available, !donor.available && styles.unavailable]}>
                    {donor.available ? 'Available Now' : 'Unavailable'}
                  </Text>
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
          ))
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.requestBtn} onPress={() => comingSoon('Request Blood')}>
          <Text style={styles.requestText}>Request Blood</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={!!openFilter} transparent animationType="fade" onRequestClose={() => setOpenFilter(null)}>
        <Pressable style={styles.backdrop} onPress={() => setOpenFilter(null)}>
          <Pressable style={styles.sheet}>
            <Text style={styles.sheetTitle}>{openFilter === 'blood' ? 'Blood Group' : 'Availability'}</Text>
            {filterOptions.map((option) => {
              const selected = option === (openFilter === 'blood' ? bloodGroup : availability);
              return (
                <TouchableOpacity key={option} style={styles.option} onPress={() => selectFilter(option)}>
                  <Text style={[styles.optionText, selected && styles.optionSelected]}>{option}</Text>
                  {selected ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        onComingSoon={comingSoon}
        menu={menu}
        showAvailability={showAvailability}
        activeKey="Find Donors"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  bellBadge: {
    position: 'absolute',
    top: 6,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandText: { color: colors.primary, fontSize: 18, fontWeight: '800' },
  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { marginTop: 4, marginBottom: 14, color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.inputBg,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 12,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 13, paddingVertical: 0 },
  mapCard: {
    height: 176,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 12,
    backgroundColor: '#E8EEF3',
  },
  map: { flex: 1 },
  radiusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  radiusText: { color: colors.white, fontSize: 12, fontWeight: '800' },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filter: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3C5CB',
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  filterText: { flex: 1, fontSize: 10, lineHeight: 13, color: colors.textSecondary },
  filterValue: { color: colors.text, fontWeight: '800' },
  section: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 10 },
  empty: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.white,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: { color: colors.textSecondary, fontSize: 13 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF8F8',
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
  dotMuted: { backgroundColor: colors.textMuted },
  available: { fontSize: 12, fontWeight: '700', color: '#16A34A' },
  unavailable: { color: colors.textMuted },
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
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  requestBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17,17,17,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  optionText: { fontSize: 15, color: colors.text },
  optionSelected: { color: colors.primary, fontWeight: '800' },
});

export default FindDonorsScreen;

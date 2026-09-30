import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LiveDonorsMap from '../components/LiveDonorsMap';
import LoadingIndicator from '../components/LoadingIndicator';
import { BloodDrop } from '../components/Logo';
import Sidebar from '../components/Sidebar';
import { useUserLocation } from '../hooks/useUserLocation';
import { colors } from '../utils/colors';
import { BLOOD_GROUPS, getNearbyDonors } from '../utils/nearbyDonors';

const AVAILABILITY = ['All', 'Available Now', 'Unavailable'];
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

const MapScreen = ({ navigation, route }) => {
  const { location, ready } = useUserLocation();
  const donors = useMemo(() => getNearbyDonors(location), [location]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(route.params?.donorId || null);
  const [bloodGroup, setBloodGroup] = useState(route.params?.bloodGroup || 'A+');
  const [availability, setAvailability] = useState(route.params?.availability || 'All');
  const [openFilter, setOpenFilter] = useState(null);

  useEffect(() => {
    if (route.params?.donorId) {
      setSelectedId(route.params.donorId);
    }
    if (route.params?.bloodGroup) {
      setBloodGroup(route.params.bloodGroup);
    }
    if (route.params?.availability) {
      setAvailability(route.params.availability);
    }
  }, [route.params?.availability, route.params?.bloodGroup, route.params?.donorId]);

  const filtered = useMemo(
    () =>
      donors
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
          return true;
        })
        .sort((a, b) => a.distanceKm - b.distanceKm),
    [availability, bloodGroup, donors]
  );

  const selected = filtered.find((donor) => donor.id === selectedId) || filtered[0] || null;
  const selectedIndex = selected ? filtered.findIndex((donor) => donor.id === selected.id) : 0;
  const selectDonor = useCallback((id) => setSelectedId(id), []);

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

      <View style={styles.copy}>
        <Text style={styles.title}>Live Donor Map</Text>
        <Text style={styles.subtitle}>See real-time donor locations and availability on the map.</Text>
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
      </View>

      <View style={styles.mapWrap}>
        {ready ? (
          <LiveDonorsMap
            location={location}
            donors={filtered}
            interactive
            selectedId={selected?.id || ''}
            onSelectDonor={selectDonor}
            style={styles.map}
          />
        ) : (
          <LoadingIndicator label="Finding your location..." />
        )}

        {selected ? (
          <View style={styles.card}>
            <View style={styles.cardMain}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: AVATAR_COLORS[selectedIndex % AVATAR_COLORS.length] },
                ]}
              >
                <Text style={[styles.avatarText, { color: AVATAR_TEXT[selectedIndex % AVATAR_TEXT.length] }]}>
                  {initials(selected.name)}
                </Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{selected.name}</Text>
                  <View style={styles.groupBadge}>
                    <Text style={styles.groupText}>{selected.bloodGroup}</Text>
                  </View>
                </View>
                <Text style={styles.distance}>
                  {selected.bloodGroup} · {selected.distanceKm.toFixed(1)} km
                </Text>
                <View style={[styles.statusPill, !selected.available && styles.statusPillMuted]}>
                  <View style={[styles.dot, !selected.available && styles.dotMuted]} />
                  <Text style={[styles.statusText, !selected.available && styles.statusMuted]}>
                    {selected.available ? 'Available Now' : 'Unavailable'}
                  </Text>
                </View>
                <View style={styles.hospitalRow}>
                  <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
                  <Text style={styles.hospital}>{selected.hospital}</Text>
                </View>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => navigation.navigate('Call', { donorId: selected.id })}
              >
                <Text style={styles.callText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.requestBtn}
                onPress={() => navigation.navigate('DirectRequest', { donorId: selected.id })}
              >
                <Text style={styles.requestText}>Direct Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </View>

      <Modal visible={!!openFilter} transparent animationType="fade" onRequestClose={() => setOpenFilter(null)}>
        <Pressable style={styles.backdrop} onPress={() => setOpenFilter(null)}>
          <Pressable style={styles.sheet}>
            <Text style={styles.sheetTitle}>{openFilter === 'blood' ? 'Blood Group' : 'Availability'}</Text>
            {filterOptions.map((option) => {
              const active = option === (openFilter === 'blood' ? bloodGroup : availability);
              return (
                <TouchableOpacity key={option} style={styles.option} onPress={() => selectFilter(option)}>
                  <Text style={[styles.optionText, active && styles.optionSelected]}>{option}</Text>
                  {active ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
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
        showAvailability
        activeKey="Live Map"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  copy: { paddingHorizontal: 16, paddingBottom: 10 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { marginTop: 4, marginBottom: 12, color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  filters: { flexDirection: 'row', gap: 8 },
  filter: {
    flex: 1,
    minHeight: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3C5CB',
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  filterText: { flex: 1, fontSize: 11, color: colors.textSecondary },
  filterValue: { color: colors.text, fontWeight: '800' },
  mapWrap: { flex: 1, backgroundColor: '#E8EEF3' },
  map: { flex: 1 },
  card: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    shadowColor: '#111111',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  cardMain: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { fontWeight: '800', fontSize: 15 },
  cardBody: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1, fontSize: 16, fontWeight: '800', color: colors.text },
  groupBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  groupText: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  distance: { marginTop: 4, fontSize: 12, color: colors.textSecondary },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    backgroundColor: '#E8F8EE',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusPillMuted: { backgroundColor: colors.inputBg },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success },
  dotMuted: { backgroundColor: colors.textMuted },
  statusText: { fontSize: 12, fontWeight: '700', color: '#16A34A' },
  statusMuted: { color: colors.textMuted },
  hospitalRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  hospital: { fontSize: 12, color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  callBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  callText: { color: colors.primary, fontWeight: '800', fontSize: 14 },
  requestBtn: {
    flex: 1.3,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestText: { color: colors.white, fontWeight: '800', fontSize: 14 },
  backdrop: { flex: 1, backgroundColor: 'rgba(17,17,17,0.35)', justifyContent: 'flex-end' },
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

export default MapScreen;

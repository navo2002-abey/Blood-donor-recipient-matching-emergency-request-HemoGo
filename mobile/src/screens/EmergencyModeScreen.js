import { Ionicons } from '@expo/vector-icons';
import React, { useState, useMemo } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LiveDonorsMap from '../components/LiveDonorsMap';
import Sidebar from '../components/Sidebar';
import { useUserLocation } from '../hooks/useUserLocation';
import { colors } from '../utils/colors';
import { DONOR_MENU } from '../utils/roles';
import { useTheme } from '../context/ThemeContext';

const comingSoon = (feature) => {
  Alert.alert('Coming Soon', `${feature} will be available in a later version.`);
};

const initials = (name) =>
  String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const EmergencyModeScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const menu = route.params?.menu || DONOR_MENU;
  const donors = route.params?.donors || [];
  const [index, setIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { location } = useUserLocation();
  const donor = donors[index] || null;

  const showNext = () => {
    if (donors.length < 2) return;
    setIndex((current) => (current + 1) % donors.length);
  };

  const selectDonor = () => {
    if (!donor) return;
    navigation.navigate('DonorSelected', { donorId: donor.id });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.top}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSidebarOpen(true)} hitSlop={10} style={styles.headerBtn}>
            <Ionicons name="menu-outline" size={26} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.headerBtn} />
          <TouchableOpacity onPress={() => comingSoon('Notifications')} hitSlop={10} style={styles.headerBtn}>
            <Ionicons name="notifications-outline" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.modePill}>
          <Text style={styles.modeText}>EMERGENCY MODE</Text>
        </View>
        <Text style={styles.modeSub}>Critical request · Find a donor immediately</Text>
      </View>

      <View style={styles.mapWrap}>
        <LiveDonorsMap location={location} donors={[]} radar style={styles.map} />
        <View style={styles.banner} pointerEvents="none">
          <Text style={styles.bannerTitle}>Emergency Request Activated</Text>
          <Text style={styles.bannerCopy}>
            Searching for compatible donors in your area and across the network.
          </Text>
        </View>

        {donor ? (
          <TouchableOpacity style={styles.donorCard} activeOpacity={0.85} onPress={showNext}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(donor.name)}</Text>
            </View>
            <View style={styles.donorCopy}>
              <View style={styles.nameRow}>
                <Text style={styles.donorName} numberOfLines={1}>
                  {donor.name}
                </Text>
                <View style={styles.bloodBadge}>
                  <Text style={styles.bloodText}>{donor.bloodGroup}</Text>
                </View>
              </View>
              <View style={styles.statusRow}>
                <View style={[styles.dot, !donor.available && styles.dotOff]} />
                <Text style={styles.statusText}>{donor.available ? 'Available Now' : 'Unavailable'}</Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="location" size={13} color={colors.primary} />
                <Text style={styles.metaText}>
                  {Number(donor.distanceKm).toFixed(1)} km · {donor.hospital}
                </Text>
              </View>
            </View>
            {donors.length > 1 ? (
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            ) : null}
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Text style={styles.cancelText}>Cancel Emergency</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.selectBtn, !donor && styles.selectDisabled]}
          onPress={selectDonor}
          disabled={!donor}
          activeOpacity={0.85}
        >
          <Text style={styles.selectText}>Select</Text>
        </TouchableOpacity>
      </View>

      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        onComingSoon={comingSoon}
        menu={menu}
      />
    </SafeAreaView>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.cardBg,
  },
  top: {
    backgroundColor: colors.primary,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modePill: {
    alignSelf: 'center',
    marginTop: 4,
    backgroundColor: '#C41228',
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 12,
    minWidth: '78%',
    alignItems: 'center',
  },
  modeText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  modeSub: {
    marginTop: 8,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.92)',
    fontSize: 12,
    fontWeight: '600',
  },
  mapWrap: {
    flex: 1,
    backgroundColor: '#E8EEF3',
  },
  map: {
    flex: 1,
  },
  banner: {
    position: 'absolute',
    top: 14,
    left: 28,
    right: 28,
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#111111',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  bannerCopy: {
    marginTop: 3,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  donorCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F8D0D6',
    padding: 12,
    shadowColor: '#111111',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  donorCopy: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  donorName: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  bloodBadge: {
    marginLeft: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  bloodText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: 6,
  },
  dotOff: {
    backgroundColor: colors.textMuted,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: colors.cardBg,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardBg,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  selectBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectDisabled: {
    opacity: 0.45,
  },
  selectText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
});

export default EmergencyModeScreen;

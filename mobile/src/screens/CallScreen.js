import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserLocation } from '../hooks/useUserLocation';
import { colors } from '../utils/colors';
import { getNearbyDonors } from '../utils/nearbyDonors';

const CONTROLS = [
  { key: 'mute', label: 'Mute', icon: 'mic-off-outline' },
  { key: 'keypad', label: 'Keypad', icon: 'grid-outline' },
  { key: 'speaker', label: 'Speaker', icon: 'volume-high-outline' },
  { key: 'add', label: 'Add Call', icon: 'add' },
  { key: 'video', label: 'Video', icon: 'videocam-outline' },
  { key: 'message', label: 'Message', icon: 'chatbubble-outline' },
];

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = String(seconds % 60).padStart(2, '0');
  return `${mins}:${secs}`;
};

const initials = (name) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const CallScreen = ({ navigation, route }) => {
  const { location } = useUserLocation();
  const donors = useMemo(() => getNearbyDonors(location), [location]);
  const donor = donors.find((item) => item.id === route.params?.donorId) || null;
  const [seconds, setSeconds] = useState(0);
  const [active, setActive] = useState({});

  useEffect(() => {
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggle = (key) => {
    setActive((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>Active Call ({formatTime(seconds)})</Text>
      </View>

      {donor ? (
        <View style={styles.body}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(donor.name)}</Text>
          </View>
          <Text style={styles.name}>{donor.name}</Text>
          <Text style={styles.phone}>{donor.phone}</Text>
          <Text style={styles.role}>Preferred Donor • {donor.bloodGroup} Blood</Text>

          <View style={styles.grid}>
            {CONTROLS.map((item) => {
              const on = !!active[item.key];
              return (
                <TouchableOpacity key={item.key} style={styles.control} onPress={() => toggle(item.key)}>
                  <View style={[styles.controlBtn, on && styles.controlBtnOn]}>
                    <Ionicons name={item.icon} size={22} color={colors.text} />
                  </View>
                  <Text style={styles.controlLabel}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.endWrap} onPress={() => navigation.goBack()}>
            <View style={styles.endBtn}>
              <Ionicons name="call" size={26} color={colors.white} style={styles.endIcon} />
            </View>
            <Text style={styles.endLabel}>End Call</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.body}>
          <Text style={styles.phone}>This call could not be started.</Text>
          <TouchableOpacity style={styles.endWrap} onPress={() => navigation.goBack()}>
            <Text style={styles.endLabel}>Go back</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  banner: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  bannerText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  body: { flex: 1, alignItems: 'center', paddingTop: 28, paddingHorizontal: 24 },
  avatar: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: '#F3D2C4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: colors.primary },
  name: { fontSize: 22, fontWeight: '800', color: colors.text },
  phone: { marginTop: 6, fontSize: 14, color: colors.textSecondary },
  role: { marginTop: 6, fontSize: 14, fontWeight: '700', color: '#16A34A' },
  grid: {
    marginTop: 36,
    width: '100%',
    maxWidth: 300,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 18,
  },
  control: { width: '30%', alignItems: 'center' },
  controlBtn: {
    width: 64,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnOn: { backgroundColor: '#E5E7EB' },
  controlLabel: { marginTop: 6, fontSize: 12, color: colors.text, fontWeight: '600' },
  endWrap: { marginTop: 'auto', marginBottom: 28, alignItems: 'center' },
  endBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endIcon: { transform: [{ rotate: '135deg' }] },
  endLabel: { marginTop: 8, fontSize: 13, fontWeight: '700', color: colors.text },
});

export default CallScreen;

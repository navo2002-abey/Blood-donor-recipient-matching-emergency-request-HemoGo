import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BloodDrop } from '../components/Logo';
import { useUserLocation } from '../hooks/useUserLocation';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { colors } from '../utils/colors';
import { getNearbyDonors } from '../utils/nearbyDonors';
import { rankDonorsForRequest } from '../utils/smartMatch';
import { getApiErrorMessage } from '../utils/validation';
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

const SmartMatchScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLanguage();
  const { patientName, hospital, bloodGroup, urgency, details } = route.params || {};
  const { location } = useUserLocation();
  const donors = useMemo(() => getNearbyDonors(location), [location]);
  const matches = useMemo(
    () =>
      rankDonorsForRequest({
        donors,
        bloodGroup,
        hospital,
        urgency,
      }),
    [bloodGroup, donors, hospital, urgency]
  );
  const savedKey = useRef('');
  const [selectedId, setSelectedId] = useState(null);
  const selectedDonor = matches.find((donor) => donor.id === selectedId) || null;

  useEffect(() => {
    const requestMatchId = route.params?.requestMatchId;
    if (!requestMatchId) {
      return undefined;
    }

    const key = `${requestMatchId}:${matches.map((donor) => `${donor.id}-${donor.score}`).join(',')}`;
    if (savedKey.current === key) {
      return undefined;
    }
    savedKey.current = key;

    let cancelled = false;
    const saveResults = async () => {
      try {
        await api.post('/best-donor-ai', {
          requestMatchId,
          donors: matches.map((donor) => ({
            id: donor.id,
            name: donor.name,
            bloodGroup: donor.bloodGroup,
            distanceKm: donor.distanceKm,
            hospital: donor.hospital,
            available: donor.available,
            score: donor.score,
            exact: donor.exact,
            matchedHospital: donor.matchedHospital,
            reason: donor.reason,
          })),
        });
      } catch (error) {
        if (!cancelled) {
          savedKey.current = '';
          Alert.alert('Could not save', getApiErrorMessage(error, 'Unable to save the AI donor results.'));
        }
      }
    };

    saveResults();
    return () => {
      cancelled = true;
    };
  }, [matches, route.params?.requestMatchId]);

  const notifyDonors = () => {
    if (!selectedDonor) {
      Alert.alert('Select a donor', 'Choose one donor from the list first.');
      return;
    }

    navigation.navigate('EmergencyMode', {
      patientName,
      hospital,
      bloodGroup,
      urgency,
      donors: [{
        id: selectedDonor.id,
        name: selectedDonor.name,
        bloodGroup: selectedDonor.bloodGroup,
        distanceKm: selectedDonor.distanceKm,
        hospital: selectedDonor.hospital,
        available: selectedDonor.available,
      }],
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.brand}>
          <BloodDrop size={16} />
          <Text style={styles.brandText}>HemoGo</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} hitSlop={10} style={styles.headerBtn}>
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('pages.smartMatch')}</Text>
        <Text style={styles.subtitle}>
          Our AI analyzes compatibility, location, and availability to find the best match.
        </Text>
        <Text style={styles.requestLine}>
          {bloodGroup || 'Any group'}
          {patientName ? ` for ${patientName}` : ''}
          {hospital ? ` · ${hospital}` : ''}
          {urgency ? ` · ${urgency}` : ''}
        </Text>
        {details ? <Text style={styles.notes}>Notes: {details}</Text> : null}

        {matches.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No compatible donors</Text>
            <Text style={styles.emptyCopy}>
              None of the nearby donors can give {bloodGroup || 'this blood group'}. Try another group.
            </Text>
          </View>
        ) : (
          matches.map((donor, index) => {
            const best = index === 0;
            const selected = donor.id === selectedId;
            return (
              <TouchableOpacity
                key={donor.id}
                activeOpacity={0.85}
                onPress={() => setSelectedId(donor.id)}
                style={[styles.card, best && styles.cardBest, selected && styles.cardSelected]}
              >
                <View style={styles.cardTop}>
                  <View style={styles.rankRow}>
                    <Text style={[styles.rank, best && styles.rankBest]}>#{index + 1}</Text>
                    {best ? (
                      <View style={styles.bestBadge}>
                        <Text style={styles.trophy}>🏆</Text>
                        <Text style={styles.bestText}>Best Match</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.scoreBlock}>
                    <Text style={styles.scoreLabel}>SCORE</Text>
                    <Text style={[styles.scoreValue, best && styles.scoreBest]}>{donor.score}%</Text>
                  </View>
                </View>

                <View style={styles.person}>
                  <View style={[styles.avatar, best && styles.avatarBest]}>
                    <Text style={[styles.avatarText, best && styles.avatarTextBest]}>{initials(donor.name)}</Text>
                  </View>
                  <View style={styles.personCopy}>
                    <Text style={styles.name}>{donor.name}</Text>
                    <Text style={styles.meta}>
                      {donor.bloodGroup} · {Number(donor.distanceKm).toFixed(1)} km
                    </Text>
                  </View>
                  <Ionicons
                    name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={selected ? colors.primary : colors.textMuted}
                  />
                </View>

                <Text style={styles.stat}>
                  Compatibility: <Text style={styles.statValue}>{donor.score}%</Text>
                </Text>
                <Text style={styles.stat}>
                  Distance: <Text style={styles.statValue}>{Number(donor.distanceKm).toFixed(1)} km</Text>
                </Text>
                <Text style={styles.stat}>
                  Availability:{' '}
                  <Text style={donor.available ? styles.available : styles.unavailable}>
                    {donor.available ? 'Available' : 'Unavailable'}
                  </Text>
                </Text>
                <Text style={styles.reason}>{donor.reason}</Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.notify} onPress={notifyDonors} activeOpacity={0.85}>
          <Text style={styles.notifyText}>Notify Recommended Donors</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  requestLine: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  notes: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  card: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBg,
    padding: 14,
  },
  cardBest: {
    backgroundColor: colors.primarySoft,
    borderColor: '#F8C9D0',
  },
  cardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rank: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textMuted,
  },
  rankBest: {
    color: colors.primary,
  },
  bestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trophy: {
    fontSize: 13,
  },
  bestText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  scoreBlock: {
    alignItems: 'flex-end',
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: colors.textMuted,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#374151',
  },
  scoreBest: {
    color: colors.primary,
  },
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBest: {
    backgroundColor: colors.cardBg,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#374151',
  },
  avatarTextBest: {
    color: colors.primary,
  },
  personCopy: {
    marginLeft: 12,
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  meta: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textSecondary,
  },
  stat: {
    marginTop: 3,
    fontSize: 13,
    color: '#4B5563',
  },
  statValue: {
    fontWeight: '700',
    color: colors.text,
  },
  available: {
    fontWeight: '700',
    color: '#16A34A',
  },
  unavailable: {
    fontWeight: '700',
    color: colors.primary,
  },
  reason: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  empty: {
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  emptyCopy: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  notify: {
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifyText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
});

export default SmartMatchScreen;

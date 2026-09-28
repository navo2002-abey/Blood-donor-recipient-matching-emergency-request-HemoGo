import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LiveDonorsMap from '../components/LiveDonorsMap';
import LoadingIndicator from '../components/LoadingIndicator';
import { useUserLocation } from '../hooks/useUserLocation';
import { colors } from '../utils/colors';
import { getNearbyDonors } from '../utils/nearbyDonors';

const MapScreen = () => {
  const { location, ready } = useUserLocation();
  const donors = useMemo(() => getNearbyDonors(location), [location]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Live Map</Text>
          <Text style={styles.sub}>{donors.length} active donors nearby</Text>
        </View>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <View style={styles.mapWrap}>
        {ready ? (
          <LiveDonorsMap location={location} donors={donors} interactive />
        ) : (
          <LoadingIndicator label="Finding your location..." />
        )}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: '#60A5FA' }]} />
          <Text style={styles.legendText}>You</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>Nearby donors</Text>
        </View>
        <Ionicons name="navigate-outline" size={14} color={colors.textSecondary} />
        <Text style={styles.legendText}>Tap a pin for blood group</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  sub: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textSecondary,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  liveText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  mapWrap: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: '#E8EEF3',
    minHeight: 360,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default MapScreen;

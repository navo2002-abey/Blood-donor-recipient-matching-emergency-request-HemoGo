import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserLocation } from '../hooks/useUserLocation';
import { colors } from '../utils/colors';
import { getNearbyDonors } from '../utils/nearbyDonors';
import { placeCall } from '../utils/phone';
import { useTheme } from '../context/ThemeContext';

const CallScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { location } = useUserLocation();
  const donors = useMemo(() => getNearbyDonors(location), [location]);
  const donor = donors.find((item) => item.id === route.params?.donorId) || null;
  const started = useRef(false);

  useEffect(() => {
    if (!donor?.phone || started.current) {
      return undefined;
    }

    started.current = true;
    placeCall(donor.phone).finally(() => navigation.goBack());
    return undefined;
  }, [donor, navigation]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <Text style={styles.title}>{donor ? `Calling ${donor.name}` : 'Starting call'}</Text>
        <Text style={styles.phone}>{donor?.phone || 'Looking up the donor number'}</Text>
      </View>
    </SafeAreaView>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.cardBg,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  phone: {
    marginTop: 8,
    fontSize: 15,
    color: colors.textSecondary,
  },
});

export default CallScreen;

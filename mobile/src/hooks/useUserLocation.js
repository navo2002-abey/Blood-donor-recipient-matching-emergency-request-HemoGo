import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { COLOMBO } from '../utils/nearbyDonors';

const readBrowserLocation = () =>
  new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  });

const readNativeLocation = async () => {
  try {
    const Location = require('expo-location');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return null;
    }

    const last = await Location.getLastKnownPositionAsync();
    if (last) {
      return {
        latitude: last.coords.latitude,
        longitude: last.coords.longitude,
      };
    }

    const current = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Low,
    });

    return {
      latitude: current.coords.latitude,
      longitude: current.coords.longitude,
    };
  } catch (error) {
    return null;
  }
};

export const useUserLocation = () => {
  const [location, setLocation] = useState(COLOMBO);

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      const next = Platform.OS === 'web' ? await readBrowserLocation() : await readNativeLocation();
      if (!cancelled && next) {
        setLocation(next);
      }
    };

    start();
    return () => {
      cancelled = true;
    };
  }, []);

  return { location, ready: true };
};

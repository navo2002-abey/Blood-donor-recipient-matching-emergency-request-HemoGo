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

    const current = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const start = async () => {
      const next = Platform.OS === 'web' ? await readBrowserLocation() : await readNativeLocation();
      if (next) {
        setLocation(next);
      }
      setReady(true);
    };

    start();
  }, []);

  return { location, ready };
};

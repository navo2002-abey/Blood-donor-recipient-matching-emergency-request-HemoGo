import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useTheme } from '../context/ThemeContext';

const NativeLiveMap = ({
  location,
  donors,
  interactive = false,
  style,
  selectedId = '',
  onSelectDonor,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const mapRef = useRef(null);
  const region = {
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  };

  useEffect(() => {
    mapRef.current?.animateToRegion(region, 250);
  }, [location.latitude, location.longitude]);

  return (
    <View style={[styles.wrap, style]} pointerEvents={interactive ? 'auto' : 'none'}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        pitchEnabled={false}
        rotateEnabled={false}
        toolbarEnabled={false}
        moveOnMarkerPress={false}
        loadingEnabled
        loadingIndicatorColor={colors.primary}
        loadingBackgroundColor={colors.page}
      >
        {donors.map((donor) => (
          <Marker
            key={donor.id}
            coordinate={{
              latitude: donor.latitude,
              longitude: donor.longitude,
            }}
            title={donor.name}
            description={donor.bloodGroup}
            pinColor={donor.id === selectedId ? colors.primary : '#111827'}
            tracksViewChanges={false}
            onPress={() => onSelectDonor?.(donor.id)}
          />
        ))}
      </MapView>
    </View>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: colors.page,
    minHeight: 160,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default NativeLiveMap;

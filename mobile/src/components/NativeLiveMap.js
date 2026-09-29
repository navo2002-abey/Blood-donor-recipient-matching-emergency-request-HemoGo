import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { colors } from '../utils/colors';

const NativeLiveMap = ({ location, donors, interactive = false, style }) => {
  const mapRef = useRef(null);
  const region = {
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  };

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(region, 500);
    }
  }, [location.latitude, location.longitude]);

  return (
    <View style={[styles.wrap, style]} pointerEvents={interactive ? 'auto' : 'none'}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        mapType="none"
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        pitchEnabled={false}
        rotateEnabled={false}
        toolbarEnabled={false}
        loadingEnabled
        loadingIndicatorColor={colors.primary}
      >
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
          zIndex={-1}
        />
        <Marker
          coordinate={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
          title="You"
          description="Your current location"
          pinColor="#2563EB"
        />
        {donors.map((donor) => (
          <Marker
            key={donor.id}
            coordinate={{
              latitude: donor.latitude,
              longitude: donor.longitude,
            }}
            title={donor.name}
            description={`Blood group ${donor.bloodGroup}`}
            pinColor={colors.primary}
          />
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: colors.inputBg,
    minHeight: 160,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default NativeLiveMap;

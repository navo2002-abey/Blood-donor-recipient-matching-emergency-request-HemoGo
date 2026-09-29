import React, { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors } from '../utils/colors';

const buildMapHtml = ({ latitude, longitude, donors, interactive }) => {
  const donorJson = JSON.stringify(
    donors.map((donor) => ({
      name: donor.name,
      bloodGroup: donor.bloodGroup,
      lat: donor.latitude,
      lng: donor.longitude,
    }))
  );

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
      html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; background: #e8eef3; }
      .leaflet-control-attribution { font-size: 9px; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      const lat = ${latitude};
      const lng = ${longitude};
      const interactive = ${interactive ? 'true' : 'false'};
      const donors = ${donorJson};

      const map = L.map('map', {
        zoomControl: interactive,
        dragging: interactive,
        scrollWheelZoom: interactive,
        doubleClickZoom: interactive,
        boxZoom: false,
        keyboard: false
      }).setView([lat, lng], 14);

      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Esri'
      }).addTo(map);

      L.circleMarker([lat, lng], {
        radius: 10,
        color: '#1D4ED8',
        weight: 3,
        fillColor: '#60A5FA',
        fillOpacity: 1
      }).addTo(map).bindPopup('You are here');

      donors.forEach(function (donor) {
        L.circleMarker([donor.lat, donor.lng], {
          radius: 8,
          color: '#E31E35',
          weight: 2,
          fillColor: '#E31E35',
          fillOpacity: 0.95
        }).addTo(map).bindPopup(donor.name + ' · ' + donor.bloodGroup);
      });

      setTimeout(function () { map.invalidateSize(true); }, 250);
      setTimeout(function () { map.invalidateSize(true); }, 800);
    </script>
  </body>
</html>`;
};

const LiveDonorsMap = ({ location, donors, interactive = false, style }) => {
  const html = useMemo(
    () =>
      buildMapHtml({
        latitude: location.latitude,
        longitude: location.longitude,
        donors,
        interactive,
      }),
    [donors, interactive, location.latitude, location.longitude]
  );

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.wrap, style]}>
        <iframe title="Live nearby donors" srcDoc={html} style={styles.frame} />
      </View>
    );
  }

  return (
    <View style={[styles.wrap, style]} pointerEvents={interactive ? 'auto' : 'none'}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={styles.web}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        androidLayerType="hardware"
        setSupportMultipleWindows={false}
        startInLoadingState
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#E8EEF3',
    minHeight: 168,
  },
  web: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  frame: {
    borderWidth: 0,
    width: '100%',
    height: '100%',
  },
});

export default LiveDonorsMap;

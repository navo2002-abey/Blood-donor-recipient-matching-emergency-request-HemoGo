import React, { useEffect, useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../context/ThemeContext';

const buildMapHtml = ({ latitude, longitude, donors, interactive, radiusKm, placeLabel, selectedId, radar }) => {
  const donorJson = JSON.stringify(
    donors.map((donor) => ({
      id: donor.id,
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
      const radiusKm = ${Number(radiusKm) || 0};
      const placeLabel = ${JSON.stringify(placeLabel || '')};
      const selectedId = ${JSON.stringify(selectedId || '')};
      const radar = ${radar ? 'true' : 'false'};

      const map = L.map('map', {
        zoomControl: interactive,
        dragging: interactive,
        touchZoom: interactive,
        scrollWheelZoom: interactive,
        doubleClickZoom: interactive,
        boxZoom: false,
        keyboard: false
      }).setView([lat, lng], radar ? 13 : (radiusKm ? 12 : 14));

      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Esri'
      }).addTo(map);

      if (radar) {
        [1.2, 2.4, 3.6].forEach(function (km) {
          L.circle([lat, lng], {
            radius: km * 1000,
            color: '#E31E35',
            weight: 1.5,
            fillColor: '#E31E35',
            fillOpacity: 0.05
          }).addTo(map);
        });
        L.circleMarker([lat, lng], {
          radius: 9,
          color: '#ffffff',
          weight: 3,
          fillColor: '#E31E35',
          fillOpacity: 1
        }).addTo(map);
      } else {
      L.circleMarker([lat, lng], {
        radius: 10,
        color: '#1D4ED8',
        weight: 3,
        fillColor: '#60A5FA',
        fillOpacity: 1
      }).addTo(map).bindPopup('You are here');
      }

      if (!radar && radiusKm) {
        L.circle([lat, lng], {
          radius: radiusKm * 1000,
          color: '#E31E35',
          weight: 1.5,
          fillColor: '#E31E35',
          fillOpacity: 0.06
        }).addTo(map);
      }

      if (placeLabel) {
        const hospitalIcon = L.divIcon({
          className: '',
          html: '<div style="background:#fff;color:#E31E35;border:1px solid #F3B4BC;border-radius:8px;padding:3px 8px;font:700 11px Arial,sans-serif;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,.12);">' + placeLabel + '</div>',
          iconSize: [190, 26],
          iconAnchor: [95, 13]
        });
        L.marker([lat + 0.012, lng + 0.01], { icon: hospitalIcon, interactive: false }).addTo(map);
      }

      let selectedLatLng = null;
      donors.forEach(function (donor) {
        const selected = donor.id === selectedId;
        if (selected) {
          selectedLatLng = [donor.lat, donor.lng];
        }
        const marker = L.circleMarker([donor.lat, donor.lng], {
          radius: selected ? 11 : 7,
          color: '#ffffff',
          weight: selected ? 3 : 1,
          fillColor: '#E31E35',
          fillOpacity: 1
        }).addTo(map);

        if (selected) {
          marker.bindTooltip(donor.name, { permanent: true, direction: 'top', offset: [0, -6], className: '' });
        } else {
          marker.bindPopup(donor.name + ' · ' + donor.bloodGroup);
        }

        if (interactive) {
          marker.on('click', function () {
            const payload = JSON.stringify({ type: 'hemogo-select', id: donor.id });
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(payload);
            } else if (window.parent) {
              window.parent.postMessage({ type: 'hemogo-select', id: donor.id }, '*');
            }
          });
        }
      });

      if (selectedLatLng) {
        L.polyline([[lat, lng], selectedLatLng], {
          color: '#16A34A',
          weight: 3,
          opacity: 0.95,
          dashArray: '7 8'
        }).addTo(map);
        map.fitBounds([[lat, lng], selectedLatLng], {
          paddingTopLeft: [36, 36],
          paddingBottomRight: [36, 48]
        });
        setTimeout(function () { map.panBy([0, -70], { animate: false }); }, 200);
      }

      setTimeout(function () { map.invalidateSize(true); }, 250);
      setTimeout(function () { map.invalidateSize(true); }, 800);
    </script>
  </body>
</html>`;
};

const LiveDonorsMap = ({
  location,
  donors,
  interactive = false,
  style,
  radiusKm = 0,
  placeLabel = '',
  selectedId = '',
  onSelectDonor,
  radar = false,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const html = useMemo(
    () =>
      buildMapHtml({
        latitude: location.latitude,
        longitude: location.longitude,
        donors,
        interactive,
        radiusKm,
        placeLabel,
        selectedId,
        radar,
      }),
    [donors, interactive, location.latitude, location.longitude, placeLabel, radar, radiusKm, selectedId]
  );

  useEffect(() => {
    if (!onSelectDonor || Platform.OS !== 'web' || typeof window === 'undefined') {
      return undefined;
    }

    const onMessage = (event) => {
      const data = event.data;
      if (data && data.type === 'hemogo-select' && data.id) {
        onSelectDonor(data.id);
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onSelectDonor]);

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.wrap, style]}>
        <iframe key={selectedId || 'map'} title="Live nearby donors" srcDoc={html} style={styles.frame} />
      </View>
    );
  }

  return (
    <View style={[styles.wrap, style]} pointerEvents={interactive ? 'auto' : 'none'}>
      <WebView
        key={selectedId || 'map'}
        originWhitelist={['*']}
        source={{ html }}
        style={styles.web}
        onMessage={(event) => {
          if (!onSelectDonor) {
            return;
          }
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'hemogo-select' && data.id) {
              onSelectDonor(data.id);
            }
          } catch (error) {
            // Ignore map messages that are not donor selections.
          }
        }}
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

const makeStyles = (colors) => StyleSheet.create({
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

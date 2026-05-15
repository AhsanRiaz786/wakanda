import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { theme } from '../constants/theme';

export function Map({ mapStyle }: { mapStyle: any }) {
  return (
    <MapView
      provider={PROVIDER_DEFAULT}
      style={StyleSheet.absoluteFillObject}
      customMapStyle={mapStyle}
      initialRegion={{
        latitude: 40.7128,
        longitude: -74.0060,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
    >
      <Marker coordinate={{ latitude: 40.7128, longitude: -74.0060 }}>
        <View style={[styles.markerRing, { borderColor: theme.colors.crit }]}>
          <View style={[styles.markerDot, { backgroundColor: theme.colors.crit }]} />
        </View>
      </Marker>
    </MapView>
  );
}

const styles = StyleSheet.create({
  markerRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'rgba(255,71,87,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

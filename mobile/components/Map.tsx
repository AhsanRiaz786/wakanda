import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { theme } from '../constants/theme';
import { useRouter } from 'expo-router';

export function Map({ mapStyle, incidents = [] }: { mapStyle: any, incidents?: any[] }) {
  const router = useRouter();

  const getMarkerColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return theme.colors.crit;
      case 'HIGH': return theme.colors.high;
      case 'LOW': return theme.colors.low;
      default: return theme.colors.med;
    }
  };

  return (
    <MapView
      provider={PROVIDER_DEFAULT}
      style={StyleSheet.absoluteFillObject}
      customMapStyle={mapStyle}
      initialRegion={{
        latitude: 33.7200,
        longitude: 73.0500,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
    >
      {incidents.map((inc, i) => {
        if (!inc.coordinates || !inc.coordinates.lat || !inc.coordinates.lng) return null;
        const color = getMarkerColor(inc.severity);
        return (
          <Marker 
            key={inc.incidentId || i} 
            coordinate={{ latitude: inc.coordinates.lat, longitude: inc.coordinates.lng }}
            onPress={() => inc.incidentId && router.push(`/incident/${inc.incidentId}`)}
          >
            <View style={[styles.markerRing, { borderColor: color, backgroundColor: `${color}1A` }]}>
              <View style={[styles.markerDot, { backgroundColor: color }]} />
            </View>
          </Marker>
        );
      })}
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

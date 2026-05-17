import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_DEFAULT } from 'react-native-maps';
import { useAppTheme } from '../hooks/useAppTheme';
import { useRouter } from 'expo-router';
import { useStatus } from '../contexts/StatusContext';

export function Map({ mapStyle, incidents = [], mapRef, onIncidentPress }: { mapStyle: any, incidents?: any[], mapRef?: any, onIncidentPress?: (inc: any) => void }) {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors, isDark);

  const getMarkerColor = (severity: string) => {
    switch ((severity || '').toUpperCase()) {
      case 'CRITICAL': return colors.crit;
      case 'HIGH': return colors.high;
      case 'LOW': return colors.low;
      default: return colors.med;
    }
  };

  return (
    <MapView
      ref={mapRef}
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
        const title = inc.title || inc.rawDescription || 'Incident reported';
        return (
          <Marker 
            key={inc.incidentId || i}
            coordinate={{ latitude: inc.coordinates.lat, longitude: inc.coordinates.lng }}
            onPress={() => onIncidentPress && onIncidentPress(inc)}
          >
            {/* The original simple circle marker */}
            <View style={[styles.markerRing, { borderColor: color, backgroundColor: `${color}1A` }]}>
              <View style={[styles.markerDot, { backgroundColor: color }]} />
            </View>
          </Marker>
        );
      })}
    </MapView>
  );
}

const makeStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  markerRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
});

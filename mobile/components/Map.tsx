import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_DEFAULT, Circle } from 'react-native-maps';
import { useAppTheme } from '../hooks/useAppTheme';
import { useRouter } from 'expo-router';
import { useStatus } from '../contexts/StatusContext';

export function Map({ mapStyle, incidents = [], mapRef, onIncidentPress, selectedIncidentId, showHeatmap = false }: { mapStyle: any, incidents?: any[], mapRef?: any, onIncidentPress?: (inc: any) => void, selectedIncidentId?: string, showHeatmap?: boolean }) {
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

  const getCircleColor = (severity: string) => {
    switch ((severity || '').toUpperCase()) {
      case 'CRITICAL': return 'rgba(239, 68, 68, 0.3)'; // Red
      case 'HIGH': return 'rgba(249, 115, 22, 0.3)'; // Orange
      case 'LOW': return 'rgba(34, 197, 94, 0.2)'; // Green
      default: return 'rgba(234, 179, 8, 0.2)'; // Yellow
    }
  };

  const getCircleStrokeColor = (severity: string) => {
    switch ((severity || '').toUpperCase()) {
      case 'CRITICAL': return 'rgba(239, 68, 68, 0.6)';
      case 'HIGH': return 'rgba(249, 115, 22, 0.6)';
      case 'LOW': return 'rgba(34, 197, 94, 0.4)';
      default: return 'rgba(234, 179, 8, 0.4)';
    }
  };

  const heatmapCircles = showHeatmap ? incidents.map((inc, i) => {
    if (!inc.coordinates || !inc.coordinates.lat || !inc.coordinates.lng) return null;
    return (
      <Circle
        key={`circle-${inc.incidentId || i}`}
        center={{ latitude: inc.coordinates.lat, longitude: inc.coordinates.lng }}
        radius={inc.severity === 'CRITICAL' ? 1200 : inc.severity === 'HIGH' ? 800 : 400}
        fillColor={getCircleColor(inc.severity)}
        strokeColor={getCircleStrokeColor(inc.severity)}
        strokeWidth={1.5}
      />
    );
  }) : null;

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
      {heatmapCircles}
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

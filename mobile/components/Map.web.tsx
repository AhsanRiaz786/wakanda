import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Typography } from './Typography';
import { theme } from '../constants/theme';

export function Map({ mapStyle }: { mapStyle: any }) {
  return (
    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#0B1820', justifyContent: 'center', alignItems: 'center' }]}>
      <Typography variant="heading" color={theme.colors.textMuted}>Map View (Web Mock)</Typography>
    </View>
  );
}

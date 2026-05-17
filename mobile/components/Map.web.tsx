import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Typography } from './Typography';
import { useAppTheme } from '../hooks/useAppTheme';

export function Map({ mapStyle, incidents }: { mapStyle: any; incidents?: any[] }) {
  const { colors } = useAppTheme();
  return (
    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.surface2, justifyContent: 'center', alignItems: 'center' }]}>
      <Typography variant="heading" color={colors.textMuted}>Map View (Web Mock)</Typography>
      <Typography variant="body" color={colors.textDim} style={{ marginTop: 8 }}>
        {incidents?.length ?? 0} incident{(incidents?.length ?? 0) !== 1 ? 's' : ''} loaded
      </Typography>
    </View>
  );
}

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from './Typography';
import { theme } from '../constants/theme';

interface KpiCardProps {
  number: string | number;
  label: string;
  color?: string;
  delta?: string; // e.g., "+1" or "↓ 34%"
  deltaType?: 'positive' | 'negative';
}

export function KpiCard({ number, label, color = theme.colors.text, delta, deltaType }: KpiCardProps) {
  return (
    <View style={styles.card}>
      <Typography variant="mono" style={[styles.number, { color }]}>{number}</Typography>
      <Typography variant="label" style={styles.label}>{label}</Typography>
      
      {delta && (
        <View style={[styles.deltaBadge, deltaType === 'positive' ? styles.deltaPos : styles.deltaNeg]}>
          <Typography variant="mono" style={{ fontSize: 9, fontWeight: '700', color: deltaType === 'positive' ? theme.colors.green : theme.colors.crit }}>
            {delta}
          </Typography>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface2,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  number: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 22,
  },
  label: {
    fontSize: 9,
    color: theme.colors.textDim,
    marginTop: 4,
  },
  deltaBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  deltaPos: {
    backgroundColor: theme.colors.greenDim,
  },
  deltaNeg: {
    backgroundColor: 'rgba(255,71,87,0.1)',
  },
});

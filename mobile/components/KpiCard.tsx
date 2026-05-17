import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from './Typography';
import { useAppTheme } from '../hooks/useAppTheme';

interface KpiCardProps {
  number: string | number;
  label: string;
  color?: string;
  delta?: string; // e.g., "+1" or "↓ 34%"
  deltaType?: 'positive' | 'negative';
}

export function KpiCard({ number, label, color, delta, deltaType }: KpiCardProps) {
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors, isDark);
  const textColor = color || colors.text;

  return (
    <View style={styles.card}>
      <Typography variant="mono" style={[styles.number, { color: textColor }]}>{number}</Typography>
      <Typography variant="label" style={styles.label}>{label}</Typography>
      
      {delta && (
        <View style={[styles.deltaBadge, deltaType === 'positive' ? styles.deltaPos : styles.deltaNeg]}>
          <Typography variant="mono" style={{ fontSize: 9, fontWeight: '700', color: deltaType === 'positive' ? colors.green : colors.crit }}>
            {delta}
          </Typography>
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.textDim,
    marginTop: 4,
  },
  deltaBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  deltaPos: {
    backgroundColor: colors.greenDim,
  },
  deltaNeg: {
    backgroundColor: 'rgba(255,71,87,0.1)',
  },
});

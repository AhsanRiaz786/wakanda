import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from './Typography';
import { theme } from '../constants/theme';
import { AlertCircle, CheckCircle, Clock, Info, ShieldAlert } from 'lucide-react-native';

export function SeverityBadge({ severity }: { severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' }) {
  const getColors = () => {
    switch (severity) {
      case 'CRITICAL': return { bg: 'rgba(255,71,87,0.1)', text: theme.colors.crit, border: 'rgba(255,71,87,0.2)' };
      case 'HIGH': return { bg: 'rgba(255,140,66,0.1)', text: theme.colors.high, border: 'rgba(255,140,66,0.2)' };
      case 'MEDIUM': return { bg: 'rgba(255,214,10,0.1)', text: theme.colors.med, border: 'rgba(255,214,10,0.2)' };
      case 'LOW': return { bg: 'rgba(76,201,240,0.1)', text: theme.colors.low, border: 'rgba(76,201,240,0.2)' };
      default: return { bg: theme.colors.surface2, text: theme.colors.textDim, border: theme.colors.border };
    }
  };

  const colors = getColors();

  return (
    <View style={[styles.sevBadge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Typography variant="label" color={colors.text} style={{ fontSize: 9 }}>
        {severity.substring(0, 4)}
      </Typography>
    </View>
  );
}

export function StatusBadge({ status }: { status: 'Reported' | 'Triaged' | 'Assigned' | 'In Progress' | 'Resolved' }) {
  const isActive = status === 'In Progress';
  const isDone = status === 'Resolved';
  
  let bg = theme.colors.surface2;
  let color = theme.colors.textMuted;
  
  if (isActive) {
    bg = 'rgba(255,140,66,0.1)';
    color = theme.colors.high;
  } else if (isDone) {
    bg = theme.colors.greenDim;
    color = theme.colors.green;
  }

  return (
    <View style={[styles.statusBadge, { backgroundColor: bg }]}>
      <Typography variant="label" color={color} style={{ fontSize: 9 }}>{status}</Typography>
    </View>
  );
}

export function SourcePill({ label, icon: Icon, active = false }: { label: string; icon?: any; active?: boolean }) {
  return (
    <View style={[styles.srcPill, active && styles.srcPillActive]}>
      {Icon && <Icon size={12} color={active ? theme.colors.green : theme.colors.textMuted} strokeWidth={2.5} />}
      <Typography variant="body" color={active ? theme.colors.green : theme.colors.textMuted} style={{ fontSize: 11, fontWeight: '600' }}>
        {label}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  sevBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  srcPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(8,14,18,0.9)',
    borderWidth: 1,
    borderColor: theme.colors.border2,
  },
  srcPillActive: {
    backgroundColor: theme.colors.greenDim,
    borderColor: theme.colors.greenGlow,
  },
});

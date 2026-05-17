import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from './Typography';
import { useAppTheme } from '../hooks/useAppTheme';
import { AlertCircle, CheckCircle, Clock, Info, ShieldAlert } from 'lucide-react-native';

export function SeverityBadge({ severity }: { severity: string }) {
  const { colors } = useAppTheme();
  const sev = (severity || 'LOW').toUpperCase() as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

  const getColors = () => {
    switch (sev) {
      case 'CRITICAL': return { bg: 'rgba(255,71,87,0.1)', text: colors.crit, border: 'rgba(255,71,87,0.2)' };
      case 'HIGH': return { bg: 'rgba(255,140,66,0.1)', text: colors.high, border: 'rgba(255,140,66,0.2)' };
      case 'MEDIUM': return { bg: 'rgba(255,214,10,0.1)', text: colors.med, border: 'rgba(255,214,10,0.2)' };
      case 'LOW': return { bg: 'rgba(76,201,240,0.1)', text: colors.low, border: 'rgba(76,201,240,0.2)' };
      default: return { bg: colors.surface2, text: colors.textDim, border: colors.border };
    }
  };

  const badgeColors = getColors();
  const label = sev === 'CRITICAL' ? 'CRIT' : sev === 'MEDIUM' ? 'MED' : sev;

  return (
    <View style={[styles.sevBadge, { backgroundColor: badgeColors.bg, borderColor: badgeColors.border }]}>
      <Typography variant="label" color={badgeColors.text} style={{ fontSize: 9 }}>
        {label}
      </Typography>
    </View>
  );
}

export function StatusBadge({ status }: { status: 'Reported' | 'Triaged' | 'Assigned' | 'In Progress' | 'Resolved' }) {
  const { colors } = useAppTheme();
  
  const isActive = status === 'In Progress';
  const isDone = status === 'Resolved';
  
  let bg = colors.surface2;
  let color = colors.textMuted;
  
  if (isActive) {
    bg = 'rgba(255,140,66,0.1)';
    color = colors.high;
  } else if (isDone) {
    bg = colors.greenDim;
    color = colors.green;
  }

  return (
    <View style={[styles.statusBadge, { backgroundColor: bg }]}>
      <Typography variant="label" color={color} style={{ fontSize: 9 }}>{status}</Typography>
    </View>
  );
}

export function SourcePill({ label, icon: Icon, active = false }: { label: string; icon?: any; active?: boolean }) {
  const { colors, isDark } = useAppTheme();
  const dynamicStyles = makeStyles(colors, isDark);
  
  return (
    <View style={[dynamicStyles.srcPill, active && dynamicStyles.srcPillActive]}>
      {Icon && <Icon size={12} color={active ? colors.green : colors.textMuted} strokeWidth={2.5} />}
      <Typography variant="body" color={active ? colors.green : colors.textMuted} style={{ fontSize: 11, fontWeight: '600' }}>
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
});

const makeStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  srcPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: isDark ? 'rgba(8,14,18,0.9)' : 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: colors.border2,
  },
  srcPillActive: {
    backgroundColor: colors.greenDim,
    borderColor: colors.greenGlow,
  },
});

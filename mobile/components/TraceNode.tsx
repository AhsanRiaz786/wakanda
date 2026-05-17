import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Brain, Wrench, GitMerge, Database, AlertTriangle } from 'lucide-react-native';
import { Typography } from './Typography';
import { useAppTheme } from '../hooks/useAppTheme';

export type TraceNodeType = 'llm' | 'tool' | 'decision' | 'state' | 'error';
export type TraceStatus = 'ok' | 'warn' | 'error';

interface TraceNodeProps {
  type: TraceNodeType;
  title: string;
  detail: string;
  status: TraceStatus;
  durationMs: number;
  isIndented?: boolean;
  rationale?: string; // If provided, shows the quote block below
}

export function TraceNode({ type, title, detail, status, durationMs, isIndented, rationale }: TraceNodeProps) {
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors, isDark);
  
  const getNodeConfig = () => {
    switch (type) {
      case 'llm': return { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.3)', color: '#A78BFA', icon: Brain };
      case 'tool': return { bg: 'rgba(76,201,240,0.1)', border: 'rgba(76,201,240,0.25)', color: colors.low, icon: Wrench };
      case 'decision': return { bg: 'rgba(255,214,10,0.08)', border: 'rgba(255,214,10,0.25)', color: colors.med, icon: GitMerge };
      case 'state': return { bg: colors.greenDim, border: colors.greenGlow, color: colors.green, icon: Database };
      case 'error': return { bg: 'rgba(255,71,87,0.08)', border: 'rgba(255,71,87,0.2)', color: colors.crit, icon: AlertTriangle };
    }
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'ok': return { bg: colors.greenDim, color: colors.green, text: 'SUCCESS' };
      case 'warn': return { bg: 'rgba(255,214,10,0.1)', color: colors.med, text: 'WARNING' };
      case 'error': return { bg: 'rgba(255,71,87,0.1)', color: colors.crit, text: 'FAILURE' };
    }
  };

  const config = getNodeConfig();
  const sConfig = getStatusConfig();
  const Icon = config.icon;

  return (
    <View style={styles.container}>
      <View style={[styles.nodeRow, isIndented && styles.indented]}>
        {isIndented && <View style={styles.elbow} />}
        
        <View style={[styles.iconBox, { backgroundColor: config.bg, borderColor: config.border }]}>
          <Icon size={12} color={config.color} strokeWidth={2.5} />
        </View>

        <View style={styles.body}>
          <Typography variant="body" style={{ fontSize: 11, fontWeight: '600' }}>{title}</Typography>
          <Typography variant="body" color={colors.textMuted} style={{ fontSize: 10, marginTop: 1 }} numberOfLines={1}>
            {detail}
          </Typography>
        </View>

        <View style={styles.right}>
          <View style={[styles.badge, { backgroundColor: sConfig.bg }]}>
            <Typography variant="mono" style={{ fontSize: 9, fontWeight: '700', color: sConfig.color }}>
              {sConfig.text}
            </Typography>
          </View>
          <Typography variant="mono" color={colors.textDim} style={{ fontSize: 9 }}>
            {durationMs}ms
          </Typography>
        </View>
      </View>

      {rationale && (
        <View style={styles.rationaleBox}>
          <Typography variant="body" color={colors.textMuted} style={{ fontSize: 10, lineHeight: 15 }}>
            {rationale}
          </Typography>
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  nodeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    position: 'relative',
  },
  indented: {
    marginLeft: 32,
  },
  elbow: {
    position: 'absolute',
    left: -20,
    top: -18,
    width: 16,
    height: 32,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: colors.border2,
    borderBottomLeftRadius: 8,
  },
  iconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  body: {
    flex: 1,
  },
  right: {
    alignItems: 'flex-end',
    gap: 3,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  rationaleBox: {
    backgroundColor: isDark ? 'rgba(255,214,10,0.04)' : 'rgba(255,214,10,0.1)',
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255,214,10,0.4)',
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginVertical: 3,
    marginLeft: 34,
  },
});

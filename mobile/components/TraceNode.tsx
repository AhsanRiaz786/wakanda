import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Brain, Wrench, GitMerge, Database, AlertTriangle } from 'lucide-react-native';
import { Typography } from './Typography';
import { theme } from '../constants/theme';

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
  
  const getNodeConfig = () => {
    switch (type) {
      case 'llm': return { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.3)', color: '#A78BFA', icon: Brain };
      case 'tool': return { bg: 'rgba(76,201,240,0.1)', border: 'rgba(76,201,240,0.25)', color: theme.colors.low, icon: Wrench };
      case 'decision': return { bg: 'rgba(255,214,10,0.08)', border: 'rgba(255,214,10,0.25)', color: theme.colors.med, icon: GitMerge };
      case 'state': return { bg: 'rgba(0,214,143,0.08)', border: 'rgba(0,214,143,0.2)', color: theme.colors.green, icon: Database };
      case 'error': return { bg: 'rgba(255,71,87,0.08)', border: 'rgba(255,71,87,0.2)', color: theme.colors.crit, icon: AlertTriangle };
    }
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'ok': return { bg: 'rgba(0,214,143,0.1)', color: theme.colors.green, text: 'SUCCESS' };
      case 'warn': return { bg: 'rgba(255,214,10,0.1)', color: theme.colors.med, text: 'WARNING' };
      case 'error': return { bg: 'rgba(255,71,87,0.1)', color: theme.colors.crit, text: 'FAILURE' };
    }
  };

  const config = getNodeConfig();
  const sConfig = getStatusConfig();
  const Icon = config.icon;

  return (
    <View style={styles.container}>
      <View style={[styles.nodeRow, isIndented && styles.indented]}>
        {isIndented && <View style={styles.indentLine} />}
        
        <View style={[styles.iconBox, { backgroundColor: config.bg, borderColor: config.border }]}>
          <Icon size={12} color={config.color} strokeWidth={2.5} />
        </View>

        <View style={styles.body}>
          <Typography variant="body" style={{ fontSize: 11, fontWeight: '600' }}>{title}</Typography>
          <Typography variant="body" color={theme.colors.textMuted} style={{ fontSize: 10, marginTop: 1 }} numberOfLines={1}>
            {detail}
          </Typography>
        </View>

        <View style={styles.right}>
          <View style={[styles.badge, { backgroundColor: sConfig.bg }]}>
            <Typography variant="mono" style={{ fontSize: 9, fontWeight: '700', color: sConfig.color }}>
              {sConfig.text}
            </Typography>
          </View>
          <Typography variant="mono" color={theme.colors.textDim} style={{ fontSize: 9 }}>
            {durationMs}ms
          </Typography>
        </View>
      </View>

      {rationale && (
        <View style={styles.rationaleBox}>
          <Typography variant="body" color={theme.colors.textMuted} style={{ fontSize: 10, lineHeight: 15 }}>
            {rationale}
          </Typography>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
    marginLeft: 24,
  },
  indentLine: {
    position: 'absolute',
    left: -14,
    top: 0,
    bottom: -16, // extends down to next item ideally
    width: 1,
    backgroundColor: theme.colors.border,
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
    backgroundColor: 'rgba(255,214,10,0.04)',
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255,214,10,0.35)',
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginVertical: 3,
    marginLeft: 34,
  },
});

import { useState, useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { RefreshCw, Play } from 'lucide-react-native';

import { api } from '@/src/lib/api';
import { useAppTheme } from '../../hooks/useAppTheme';
import { TopBar } from '../../components/TopBar';
import { Typography } from '../../components/Typography';
import { KpiCard } from '../../components/KpiCard';
import { TraceNode, TraceNodeType, TraceStatus } from '../../components/TraceNode';

export default function AgentTraceScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors, isDark);
  
  const [trace, setTrace] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.trace('latest');
      setTrace(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Trace failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const summary = trace?.summary as Record<string, number> | undefined;
  const steps = (trace?.steps as Array<Record<string, unknown>>) ?? [];

  return (
    <View style={styles.container}>
      <TopBar 
        title="Agent Trace" 
        rightIcon="bell" 
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Run Controls */}
        <View style={styles.controls}>
          <Pressable style={({ pressed }) => [styles.btnSecondary, pressed && styles.btnPressed]} onPress={load} disabled={loading}>
            <RefreshCw size={16} color={colors.textMuted} />
            <Typography variant="body" color={colors.text} style={{ fontSize: 13, fontWeight: '500' }}>{loading ? 'Refreshing...' : 'Refresh Trace'}</Typography>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPressed]}>
            <Play size={16} color={isDark ? "#000" : "#FFF"} fill={isDark ? "#000" : "#FFF"} />
            <Typography variant="body" color={isDark ? "#000" : "#FFF"} style={{ fontSize: 13, fontWeight: '700' }}>Run Simulation</Typography>
          </Pressable>
        </View>

        {error && <Typography variant="body" color={colors.crit} style={{ paddingHorizontal: 20, marginBottom: 10 }}>{error}</Typography>}

        {/* KPIs */}
        <View style={styles.kpiRow}>
          <KpiCard number={summary?.totalSteps || 0} label="STEPS" color={colors.text} />
          <KpiCard number={summary?.totalLLMCalls || 0} label="LLM CALLS" color="#A78BFA" />
          <KpiCard number={summary?.totalToolCalls || 0} label="TOOLS" color={colors.low} />
          <KpiCard number={`${(summary?.totalDurationMs || 0) / 1000}s`} label="DURATION" color={colors.text} />
        </View>

        {/* Tree Header */}
        <View style={styles.treeHeader}>
          <Typography variant="label" color={colors.textDim} style={{ letterSpacing: 1.5, fontSize: 11 }}>EXECUTION GRAPH</Typography>
          <View style={styles.statusBadge}>
            <View style={styles.pulseDot} />
            <Typography variant="mono" color={colors.green} style={{ fontSize: 10, fontWeight: '700' }}>ONLINE</Typography>
          </View>
        </View>

        {/* Trace List */}
        <View style={styles.traceContainer}>
          {loading && !trace ? (
            <ActivityIndicator color={colors.green} style={{ marginVertical: 40 }} />
          ) : steps.length === 0 ? (
            <View style={styles.emptyState}>
              <Typography variant="body" color={colors.textMuted} style={{ textAlign: 'center' }}>
                No trace available. Run a simulation first.
              </Typography>
            </View>
          ) : (
            <View style={styles.traceTree}>
              {steps.map((step, index) => {
                const typeMap: Record<string, TraceNodeType> = {
                  'llm_call': 'llm',
                  'tool_call': 'tool',
                  'decision': 'decision',
                  'state_update': 'state',
                  'error': 'error'
                };
                const statusMap: Record<string, TraceStatus> = {
                  'success': 'ok',
                  'warning': 'warn',
                  'failed': 'error'
                };
                
                const nodeType = typeMap[String(step.type)] || 'tool';
                const nodeStatus = statusMap[String(step.status)] || 'ok';
                
                return (
                  <TraceNode
                    key={String(step.stepId) || index.toString()}
                    type={nodeType}
                    title={String(step.name)}
                    detail={String(step.type)}
                    status={nodeStatus}
                    durationMs={Number(step.durationMs || 0)}
                    isIndented={nodeType === 'tool' || nodeType === 'error'}
                    rationale={step.decisionRationale ? String(step.decisionRationale) : undefined}
                  />
                );
              })}
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.bg 
  },
  controls: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border2,
    borderRadius: 12,
    paddingVertical: 14,
  },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.green,
    borderRadius: 12,
    paddingVertical: 14,
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  btnPressed: {
    opacity: 0.8,
  },
  kpiRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  treeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.greenDim,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.greenGlow,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green,
  },
  traceContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  traceTree: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.2 : 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  emptyState: {
    padding: 32,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  }
});

import { useState, useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { RefreshCw, Play } from 'lucide-react-native';

import { api } from '@/src/lib/api';
import { theme } from '../../constants/theme';
import { TopBar } from '../../components/TopBar';
import { Typography } from '../../components/Typography';
import { KpiCard } from '../../components/KpiCard';
import { TraceNode, TraceNodeType, TraceStatus } from '../../components/TraceNode';

export default function AgentTraceScreen() {
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

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Run Controls */}
        <View style={styles.controls}>
          <Pressable style={styles.btnSecondary} onPress={load} disabled={loading}>
            <RefreshCw size={14} color={theme.colors.textMuted} />
            <Typography variant="body" color={theme.colors.text} style={{ fontSize: 12 }}>{loading ? 'Refreshing...' : 'Refresh Trace'}</Typography>
          </Pressable>
          <Pressable style={styles.btnPrimary}>
            <Play size={14} color="#041A10" fill="#041A10" />
            <Typography variant="body" color="#041A10" style={{ fontSize: 12, fontWeight: '600' }}>Run Simulation</Typography>
          </Pressable>
        </View>

        {error && <Typography variant="body" color={theme.colors.crit} style={{ paddingHorizontal: 20, marginBottom: 10 }}>{error}</Typography>}

        {/* KPIs */}
        <View style={styles.kpiRow}>
          <KpiCard number={summary?.totalSteps || 0} label="STEPS" color={theme.colors.text} />
          <KpiCard number={summary?.totalLLMCalls || 0} label="LLM CALLS" color="#A78BFA" />
          <KpiCard number={summary?.totalToolCalls || 0} label="TOOLS" color={theme.colors.low} />
          <KpiCard number={`${(summary?.totalDurationMs || 0) / 1000}s`} label="DURATION" color={theme.colors.text} />
        </View>

        {/* Tree Header */}
        <View style={styles.treeHeader}>
          <Typography variant="label" color={theme.colors.textDim}>Execution Graph</Typography>
          <View style={styles.statusBadge}>
            <Typography variant="mono" color={theme.colors.green} style={{ fontSize: 9, fontWeight: '700' }}>ONLINE</Typography>
          </View>
        </View>

        {/* Trace List */}
        <View style={styles.traceContainer}>
          {loading && !trace ? (
            <ActivityIndicator color={theme.colors.green} style={{ marginVertical: 40 }} />
          ) : steps.length === 0 ? (
            <Typography variant="body" color={theme.colors.textMuted} style={{ textAlign: 'center', marginVertical: 40 }}>
              No trace available. Run a simulation first.
            </Typography>
          ) : (
            steps.map((step, index) => {
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
            })
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.surface 
  },
  controls: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.surface2,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingVertical: 12,
  },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.green,
    borderRadius: 10,
    paddingVertical: 12,
  },
  kpiRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  treeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: 'rgba(0,214,143,0.1)',
    borderRadius: 6,
  },
  traceContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
});

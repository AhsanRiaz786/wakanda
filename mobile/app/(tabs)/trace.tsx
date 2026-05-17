import { useState, useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View, Alert } from 'react-native';
import { RefreshCw, Play, CheckCircle2 } from 'lucide-react-native';

import { api } from '@/src/lib/api';
import { useAppTheme } from '../../hooks/useAppTheme';
import { TopBar } from '../../components/TopBar';
import { Typography } from '../../components/Typography';
import { KpiCard } from '../../components/KpiCard';
import { TraceNode, TraceNodeType, TraceStatus } from '../../components/TraceNode';
import { usePlanContext } from '../../contexts/PlanContext';
import { NotificationPanel } from '../../components/NotificationPanel';

export default function AgentTraceScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors, isDark);
  const { planId, setPlanId } = usePlanContext();

  const [trace, setTrace] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [simLoading, setSimLoading] = useState(false);
  const [simDone, setSimDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifVisible, setNotifVisible] = useState(false);

  const loadTrace = async () => {
    setLoading(true);
    setError(null);
    try {
      const pid = planId || 'latest';
      const data = await api.trace(pid);
      setTrace(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Trace failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrace();
  }, [planId]);

  const runSimulation = async () => {
    let pid = planId;

    // If no plan has been run yet, run one first
    if (!pid) {
      setSimLoading(true);
      try {
        const plan = await api.plan({ planMode: 'full' });
        pid = String(plan.planId);
        setPlanId(pid);
      } catch (e) {
        Alert.alert('Plan Failed', 'Could not create a plan. Is the backend running?');
        setSimLoading(false);
        return;
      }
    }

    setSimLoading(true);
    try {
      await api.simulate(pid);
      setSimDone(true);
      // Reload trace to show simulation results
      await loadTrace();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Simulation failed';
      Alert.alert('Simulation Failed', msg);
    } finally {
      setSimLoading(false);
    }
  };

  const summary = trace?.summary as Record<string, number> | undefined;
  const steps = (trace?.steps as Array<Record<string, unknown>>) ?? [];

  const TYPE_MAP: Record<string, TraceNodeType> = {
    'llm_call': 'llm',
    'tool_call': 'tool',
    'decision': 'decision',
    'state_update': 'state',
    'error': 'error',
  };
  const STATUS_MAP: Record<string, TraceStatus> = {
    'success': 'ok',
    'warning': 'warn',
    'failed': 'error',
    'failure': 'error',
  };

  return (
    <View style={styles.container}>
      <TopBar
        title="Agent Trace"
        rightIcon="bell"
        onRightPress={() => setNotifVisible(true)}
      />

      <NotificationPanel visible={notifVisible} onClose={() => setNotifVisible(false)} />

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Run Controls */}
        <View style={styles.controls}>
          <Pressable
            style={({ pressed }) => [styles.btnSecondary, pressed && styles.btnPressed]}
            onPress={loadTrace}
            disabled={loading}
          >
            <RefreshCw size={16} color={colors.textMuted} />
            <Typography variant="body" color={colors.text} style={{ fontSize: 13, fontWeight: '500' }}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </Typography>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.btnPrimary,
              simDone && styles.btnPrimaryDone,
              pressed && styles.btnPressed,
            ]}
            onPress={simDone ? undefined : runSimulation}
            disabled={simLoading || simDone}
          >
            {simLoading ? (
              <ActivityIndicator size="small" color={isDark ? '#000' : '#FFF'} />
            ) : simDone ? (
              <>
                <CheckCircle2 size={16} color={colors.green} />
                <Typography variant="body" color={colors.greenDeep} style={{ fontSize: 13, fontWeight: '700' }}>
                  Simulation Done
                </Typography>
              </>
            ) : (
              <>
                <Play size={16} color={isDark ? '#000' : '#FFF'} fill={isDark ? '#000' : '#FFF'} />
                <Typography variant="body" color={isDark ? '#000' : '#FFF'} style={{ fontSize: 13, fontWeight: '700' }}>
                  {planId ? 'Run Simulation' : 'Plan + Simulate'}
                </Typography>
              </>
            )}
          </Pressable>
        </View>

        {/* Plan ID banner */}
        {planId && (
          <View style={styles.planBanner}>
            <Typography variant="mono" color={colors.textDim} style={{ fontSize: 10, letterSpacing: 1 }}>
              ACTIVE PLAN
            </Typography>
            <Typography variant="mono" color={colors.green} style={{ fontSize: 11, fontWeight: '700' }}>
              {planId}
            </Typography>
          </View>
        )}

        {error && (
          <Typography variant="body" color={colors.crit} style={{ paddingHorizontal: 20, marginBottom: 10 }}>
            {error}
          </Typography>
        )}

        {/* KPIs */}
        <View style={styles.kpiRow}>
          <KpiCard number={summary?.totalSteps ?? steps.length ?? 0} label="STEPS" color={colors.text} />
          <KpiCard number={summary?.totalLLMCalls ?? 0} label="LLM CALLS" color="#A78BFA" />
          <KpiCard number={summary?.totalToolCalls ?? 0} label="TOOLS" color={colors.low} />
          <KpiCard number={`${((summary?.totalDurationMs ?? 0) / 1000).toFixed(1)}s`} label="DURATION" color={colors.text} />
        </View>

        {/* Tree Header */}
        <View style={styles.treeHeader}>
          <Typography variant="label" color={colors.textDim} style={{ letterSpacing: 1.5, fontSize: 11 }}>
            EXECUTION GRAPH
          </Typography>
          <View style={styles.statusBadge}>
            <View style={styles.pulseDot} />
            <Typography variant="mono" color={colors.green} style={{ fontSize: 10, fontWeight: '700' }}>
              {simDone ? 'SIMULATED' : 'ONLINE'}
            </Typography>
          </View>
        </View>

        {/* Trace List */}
        <View style={styles.traceContainer}>
          {loading && !trace ? (
            <ActivityIndicator color={colors.green} style={{ marginVertical: 40 }} />
          ) : steps.length === 0 ? (
            <View style={styles.emptyState}>
              <Typography variant="body" color={colors.textMuted} style={{ textAlign: 'center' }}>
                No trace available.{'\n'}Run a simulation to generate execution data.
              </Typography>
            </View>
          ) : (
            <View style={styles.traceTree}>
              {steps.map((step, index) => {
                const nodeType = TYPE_MAP[String(step.type)] || 'tool';
                const nodeStatus = STATUS_MAP[String(step.status)] || 'ok';
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

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
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
    planBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: colors.greenDim,
      borderBottomWidth: 1,
      borderBottomColor: colors.greenGlow,
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
    btnPrimaryDone: {
      backgroundColor: colors.greenSoft,
      shadowColor: 'transparent',
      elevation: 0,
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
    },
  });

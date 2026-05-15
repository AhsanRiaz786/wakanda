import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { api } from '@/src/lib/api';

export default function AgentTraceScreen() {
  const [planId, setPlanId] = useState('');
  const [trace, setTrace] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.trace(planId || 'latest');
      setTrace(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Trace failed');
    } finally {
      setLoading(false);
    }
  };

  const summary = trace?.summary as Record<string, number> | undefined;
  const steps = (trace?.steps as Array<Record<string, unknown>>) ?? [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Agent Reasoning Trace</Text>
      <TextInput
        style={styles.input}
        placeholder="Plan ID (optional)"
        value={planId}
        onChangeText={setPlanId}
      />
      <Pressable style={styles.button} onPress={load}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Load Trace</Text>}
      </Pressable>
      {summary ? (
        <Text style={styles.summary}>
          Steps {summary.totalSteps} · LLM {summary.totalLLMCalls} · Tools {summary.totalToolCalls}
        </Text>
      ) : null}
      {steps.map((step) => (
        <View key={String(step.stepId)} style={styles.step}>
          <Text style={styles.stepName}>{String(step.name)}</Text>
          <Text style={styles.stepMeta}>{String(step.type)} · {String(step.status)}</Text>
          {step.decisionRationale ? (
            <Text style={styles.rationale}>{String(step.decisionRationale)}</Text>
          ) : null}
        </View>
      ))}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  title: { fontSize: 18, fontWeight: '700', color: '#0D3B7A' },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10 },
  button: {
    backgroundColor: '#1A56A0',
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  summary: { color: '#6B7280', fontSize: 13 },
  step: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#1A56A0' },
  stepName: { fontWeight: '600', color: '#111827' },
  stepMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  rationale: { marginTop: 6, color: '#1A56A0', fontSize: 13 },
  error: { color: '#DC2626' },
});

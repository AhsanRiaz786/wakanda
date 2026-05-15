import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { api } from '@/src/lib/api';

export default function MapDashboardScreen() {
  const [loading, setLoading] = useState(false);
  const [planId, setPlanId] = useState<string | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const runPlan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const plan = await api.plan({ planMode: 'full' });
      setPlanId(String(plan.planId));
      setSummary(
        `Planned ${plan.totalIncidents} incidents · conflicts resolved ${plan.conflictsResolved}/${plan.conflictsDetected}`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Plan failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const runSimulate = useCallback(async () => {
    if (!planId) return;
    setLoading(true);
    setError(null);
    try {
      await api.simulate(planId, true);
      setSummary((s) => `${s}\nSimulation complete (with failure recovery demo).`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Simulate failed');
    } finally {
      setLoading(false);
    }
  }, [planId]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>CityIRA</Text>
      <Text style={styles.subtitle}>NovaCivitas Operations</Text>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>Map view — wire react-native-maps next</Text>
      </View>
      <Pressable style={styles.primaryButton} onPress={runPlan} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Run Agent Plan ▶</Text>}
      </Pressable>
      {planId ? (
        <Pressable style={styles.secondaryButton} onPress={runSimulate} disabled={loading}>
          <Text style={styles.secondaryText}>Simulate Plan</Text>
        </Pressable>
      ) : null}
      {summary ? <Text style={styles.summary}>{summary}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#0D3B7A' },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
  banner: { backgroundColor: '#EFF6FF', padding: 16, borderRadius: 10 },
  bannerText: { color: '#1A56A0' },
  primaryButton: {
    backgroundColor: '#1A56A0',
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#1A56A0',
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { color: '#1A56A0', fontWeight: '600' },
  summary: { color: '#111827', lineHeight: 20 },
  error: { color: '#DC2626' },
});

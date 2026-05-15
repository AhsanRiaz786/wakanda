import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { api } from '@/src/lib/api';

export default function IncidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [incident, setIncident] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .getIncident(id)
      .then(setIncident)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'));
  }, [id]);

  if (!incident && !error) {
    return <ActivityIndicator style={{ marginTop: 40 }} color="#1A56A0" />;
  }

  if (error) {
    return <Text style={styles.error}>{error}</Text>;
  }

  const conflict = incident?.resolvedConflict as Record<string, unknown> | undefined;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{String(incident?.title)}</Text>
      <Text style={styles.meta}>
        {String(incident?.incidentType)} · {String(incident?.severity)} · {String(incident?.status)}
      </Text>
      <Text style={styles.body}>{String(incident?.description)}</Text>
      {incident?.classificationRationale ? (
        <Text style={styles.rationale}>{String(incident.classificationRationale)}</Text>
      ) : null}
      {conflict ? (
        <Text style={styles.conflict}>Contradiction resolved: {String(conflict.rationale)}</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  title: { fontSize: 18, fontWeight: '700' },
  meta: { color: '#6B7280' },
  body: { lineHeight: 22, color: '#111827' },
  rationale: { backgroundColor: '#EFF6FF', padding: 12, borderRadius: 8, color: '#1A56A0' },
  conflict: { backgroundColor: '#FEF3C7', padding: 12, borderRadius: 8, color: '#92400E' },
  error: { color: '#DC2626', padding: 16 },
});

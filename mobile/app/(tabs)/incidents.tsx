import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { api } from '@/src/lib/api';

type IncidentRow = {
  incidentId: string;
  title: string;
  sourceLabel?: string;
  severity?: string;
  status?: string;
};

export default function IncidentsScreen() {
  const [items, setItems] = useState<IncidentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listIncidents();
      setItems((data.incidents as IncidentRow[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#1A56A0" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={items}
        keyExtractor={(item) => item.incidentId}
        refreshing={loading}
        onRefresh={load}
        renderItem={({ item }) => (
          <Link href={`/incident/${item.incidentId}`} asChild>
            <Pressable style={styles.card}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>
                {item.sourceLabel} · {item.severity} · {item.status}
              </Text>
            </Pressable>
          </Link>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No incidents — seed backend first.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#1A56A0',
  },
  title: { fontWeight: '600', color: '#111827' },
  meta: { marginTop: 4, color: '#6B7280', fontSize: 12 },
  error: { color: '#DC2626', marginBottom: 8 },
  empty: { color: '#6B7280', textAlign: 'center', marginTop: 24 },
});

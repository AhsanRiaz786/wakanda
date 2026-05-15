import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { api } from '@/src/lib/api';

export default function ReportIncidentScreen() {
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setMessage(null);
    try {
      const incident = await api.ingest({
        rawDescription: description,
        sourceType: 'realtime_feed',
        rawCoordinates: { lat: 33.7205, lng: 73.0478 },
      });
      setMessage(`Submitted ${incident.incidentId}`);
      setDescription('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Describe the incident</Text>
      <TextInput
        style={styles.input}
        multiline
        value={description}
        onChangeText={setDescription}
        placeholder="What did you observe?"
      />
      <Pressable style={styles.button} onPress={submit}>
        <Text style={styles.buttonText}>Submit Report</Text>
      </Pressable>
      {message ? <Text style={styles.ok}>{message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  label: { fontWeight: '600', color: '#111827' },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#1A56A0',
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700' },
  ok: { color: '#16A34A' },
  error: { color: '#DC2626' },
});

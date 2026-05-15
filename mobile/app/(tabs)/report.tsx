import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Camera, MapPin, Upload } from 'lucide-react-native';

import { api } from '@/src/lib/api';
import { theme } from '../../constants/theme';
import { TopBar } from '../../components/TopBar';
import { Typography } from '../../components/Typography';

export default function ReportIncidentScreen() {
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!description.trim()) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const incident = await api.ingest({
        rawDescription: description,
        sourceType: 'field_report',
        rawCoordinates: { lat: 33.7205, lng: 73.0478 },
      });
      setMessage(`Incident logged successfully (ID: ${incident.incidentId})`);
      setDescription('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <TopBar title="New Report" />

      <View style={styles.content}>
        {message ? (
          <View style={styles.msgBox}>
            <Typography variant="body" color={theme.colors.green}>{message}</Typography>
          </View>
        ) : null}
        
        {error ? (
          <View style={[styles.msgBox, { backgroundColor: 'rgba(255,71,87,0.1)', borderColor: 'rgba(255,71,87,0.3)' }]}>
            <Typography variant="body" color={theme.colors.crit}>{error}</Typography>
          </View>
        ) : null}

        <View style={styles.locBox}>
          <MapPin size={16} color={theme.colors.textDim} />
          <Typography variant="body" style={{ flex: 1 }}>Location auto-detected: Sector G-11</Typography>
        </View>

        <Typography variant="label" color={theme.colors.textDim} style={{ marginBottom: 10, marginTop: 10 }}>Observation</Typography>
        <TextInput
          style={styles.input}
          multiline
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the situation in detail..."
          placeholderTextColor={theme.colors.textMuted}
        />

        <View style={styles.attachRow}>
          <Pressable style={styles.attachBtn}>
            <Camera size={18} color={theme.colors.text} />
            <Typography variant="body" style={{ fontSize: 12 }}>Take Photo</Typography>
          </Pressable>
          <Pressable style={styles.attachBtn}>
            <Upload size={18} color={theme.colors.text} />
            <Typography variant="body" style={{ fontSize: 12 }}>Upload Media</Typography>
          </Pressable>
        </View>

        <View style={{ flex: 1 }} />

        <Pressable 
          style={[styles.submitBtn, (!description.trim() || loading) && styles.submitBtnDisabled]} 
          onPress={submit}
          disabled={!description.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color="#041A10" />
          ) : (
            <Typography variant="heading" color="#041A10" style={{ fontSize: 14 }}>Submit Report</Typography>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  msgBox: {
    padding: 12,
    backgroundColor: 'rgba(0,214,143,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,214,143,0.3)',
    borderRadius: 8,
    marginBottom: 16,
  },
  locBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.surface2,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  input: {
    minHeight: 160,
    backgroundColor: theme.colors.surface2,
    borderWidth: 1,
    borderColor: theme.colors.border2,
    borderRadius: 12,
    padding: 16,
    paddingTop: 16,
    color: theme.colors.text,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Inter-Regular' : undefined,
    textAlignVertical: 'top',
  },
  attachRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  attachBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  submitBtn: {
    backgroundColor: theme.colors.green,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
});

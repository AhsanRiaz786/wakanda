import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Camera, MapPin, Upload } from 'lucide-react-native';

import { api } from '@/src/lib/api';
import { useAppTheme } from '../../hooks/useAppTheme';
import { TopBar } from '../../components/TopBar';
import { Typography } from '../../components/Typography';

export default function ReportIncidentScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors, isDark);
  
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
            <Typography variant="body" color={colors.green}>{message}</Typography>
          </View>
        ) : null}
        
        {error ? (
          <View style={[styles.msgBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
            <Typography variant="body" color={colors.crit}>{error}</Typography>
          </View>
        ) : null}

        <View style={styles.locBox}>
          <MapPin size={18} color={colors.textDim} />
          <Typography variant="body" style={{ flex: 1, fontSize: 13 }}>Location auto-detected: Sector G-11</Typography>
        </View>

        <Typography variant="label" color={colors.textDim} style={{ marginBottom: 12, marginTop: 16, letterSpacing: 1 }}>OBSERVATION</Typography>
        <TextInput
          style={styles.input}
          multiline
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the situation in detail..."
          placeholderTextColor={colors.textMuted}
        />

        <View style={styles.attachRow}>
          <Pressable style={({ pressed }) => [styles.attachBtn, pressed && styles.pressedState]}>
            <Camera size={18} color={colors.text} />
            <Typography variant="body" style={{ fontSize: 13, fontWeight: '500' }}>Take Photo</Typography>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.attachBtn, pressed && styles.pressedState]}>
            <Upload size={18} color={colors.text} />
            <Typography variant="body" style={{ fontSize: 13, fontWeight: '500' }}>Upload Media</Typography>
          </Pressable>
        </View>

        <View style={{ flex: 1 }} />

        <Pressable 
          style={({ pressed }) => [
            styles.submitBtn, 
            (!description.trim() || loading) && styles.submitBtnDisabled,
            pressed && !(!description.trim() || loading) && styles.pressedState
          ]} 
          onPress={submit}
          disabled={!description.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Typography variant="heading" color={isDark ? colors.bg : colors.surface} style={{ fontSize: 15, letterSpacing: 0.5 }}>Submit Report</Typography>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 120,
  },
  msgBox: {
    padding: 14,
    backgroundColor: colors.greenDim,
    borderWidth: 1,
    borderColor: colors.greenGlow,
    borderRadius: 12,
    marginBottom: 20,
  },
  locBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border2,
    marginBottom: 16,
  },
  input: {
    minHeight: 180,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border2,
    borderRadius: 16,
    padding: 20,
    paddingTop: 20,
    color: colors.text,
    fontSize: 15,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.1 : 0.05,
    shadowRadius: 8,
  },
  attachRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  attachBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    backgroundColor: colors.surface2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border2,
  },
  submitBtn: {
    backgroundColor: colors.green,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  submitBtnDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  pressedState: {
    opacity: 0.8,
  }
});

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Camera, MapPin, Upload, X, CheckCircle2, Mic, MicOff, Send, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

import { api } from '@/src/lib/api';
import { useAppTheme } from '../../hooks/useAppTheme';
import { TopBar } from '../../components/TopBar';
import { Typography } from '../../components/Typography';
import { NotificationPanel } from '../../components/NotificationPanel';
import { useStatus } from '../../contexts/StatusContext';
import { useVoiceCommand } from '../../hooks/useVoiceCommand';
import { API_BASE_URL } from '../../src/lib/config';

function formatDuration(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function ReportIncidentScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors, isDark);
  const { showStatus } = useStatus();
  const router = useRouter();

  // ── Text report state ────────────────────────────────────────────
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);

  // ── Voice state ──────────────────────────────────────────────────
  const handleIngestSuccess = useCallback(() => {
    showStatus({ type: 'success', label: 'Incident logged via voice', duration: 3000 });
    router.push('/incidents');
  }, []);

  const {
    isRecording,
    isProcessing,
    transcript,
    summary,
    intent,
    error: voiceError,
    hasResult,
    startRecording,
    stopRecordingAndSubmit,
    cancelRecording,
    clearResult,
  } = useVoiceCommand(API_BASE_URL, { onIngestSuccess: handleIngestSuccess });

  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRecording) {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (isRecording) {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  // ── Camera / gallery ─────────────────────────────────────────────
  const requestPermission = async (type: 'camera' | 'gallery') => {
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    }
  };

  const takePhoto = async () => {
    const granted = await requestPermission('camera');
    if (!granted) { setError('Camera permission denied.'); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
    if (!result.canceled && result.assets[0]) { setImageUri(result.assets[0].uri); setError(null); }
  };

  const uploadMedia = async () => {
    const granted = await requestPermission('gallery');
    if (!granted) { setError('Media library permission denied.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
    if (!result.canceled && result.assets[0]) { setImageUri(result.assets[0].uri); setError(null); }
  };

  // ── Text submit ──────────────────────────────────────────────────
  const submit = async () => {
    if (!description.trim()) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    const sid = showStatus({ type: 'loading', label: 'Submitting Report...', duration: 0 });
    try {
      const body: Record<string, unknown> = {
        rawDescription: description,
        sourceType: 'realtime_feed',
        rawCoordinates: { lat: 33.7205, lng: 73.0478 },
        rawAddress: 'Sector G-11, Islamabad',
      };
      if (imageUri) {
        body.imageUrl = imageUri;
        body.sourceMetadata = { hasPhoto: true, photoUri: imageUri };
      }
      const incident = await api.ingest(body);
      setMessage(`Incident logged ✓ ID: ${incident.incidentId}`);
      setDescription('');
      setImageUri(null);
      showStatus({ id: sid, type: 'success', label: 'Report Logged', duration: 4000 });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed');
      showStatus({ id: sid, type: 'error', label: 'Submit Failed', duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  const showVoiceFeedback = hasResult && (transcript || summary || voiceError);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <TopBar title="New Report" rightIcon="bell" onRightPress={() => setNotifVisible(true)} />
      <NotificationPanel visible={notifVisible} onClose={() => setNotifVisible(false)} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Success Banner */}
        {message && (
          <View style={styles.msgBox}>
            <CheckCircle2 size={18} color={colors.green} />
            <Typography variant="body" color={colors.green} style={{ flex: 1, marginLeft: 10 }}>{message}</Typography>
          </View>
        )}

        {/* Error Banner */}
        {error && (
          <View style={[styles.msgBox, styles.msgBoxError]}>
            <Typography variant="body" color={colors.crit}>{error}</Typography>
          </View>
        )}

        {/* Location Row */}
        <View style={styles.locBox}>
          <MapPin size={18} color={colors.green} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Typography variant="mono" color={colors.textDim} style={{ fontSize: 10, letterSpacing: 1 }}>LOCATION DETECTED</Typography>
            <Typography variant="body" style={{ fontSize: 13, marginTop: 2 }}>Sector G-11, Islamabad · 33.72°N 73.05°E</Typography>
          </View>
        </View>

        {/* ── Section: Text Observation ── */}
        <Typography variant="label" color={colors.textDim} style={styles.sectionLabel}>OBSERVATION</Typography>
        <TextInput
          style={styles.input}
          multiline
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the situation in detail — type, location, severity, any visible hazards..."
          placeholderTextColor={colors.textDim}
        />
        <Typography variant="mono" color={description.length > 20 ? colors.green : colors.textDim} style={{ fontSize: 10, marginTop: 6, marginBottom: 20, textAlign: 'right' }}>
          {description.length} chars
        </Typography>

        {/* ── Section: Voice Input ── */}
        <Typography variant="label" color={colors.textDim} style={styles.sectionLabel}>VOICE INPUT</Typography>
        <View style={styles.voiceCard}>
          {/* Idle mic button */}
          {!isRecording && (
            <View style={styles.voiceIdleRow}>
              <TouchableOpacity
                style={[styles.micBtn, isProcessing && styles.micBtnProcessing]}
                onPress={startRecording}
                disabled={isProcessing}
                activeOpacity={0.8}
              >
                {isProcessing ? (
                  <ActivityIndicator color={colors.green} size="small" />
                ) : (
                  <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <Mic size={24} color={colors.green} strokeWidth={2} />
                  </Animated.View>
                )}
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Typography variant="body" style={{ fontWeight: '600', fontSize: 14 }}>
                  {isProcessing ? 'Processing voice...' : 'Tap to record'}
                </Typography>
                <Typography variant="body" color={colors.textDim} style={{ fontSize: 12, marginTop: 2 }}>
                  Speak the incident — AI will log it automatically
                </Typography>
              </View>
            </View>
          )}

          {/* Active recording bar */}
          {isRecording && (
            <View style={styles.recordingBar}>
              <TouchableOpacity style={styles.cancelBtn} onPress={cancelRecording} activeOpacity={0.8}>
                <Trash2 size={18} color={colors.crit} />
              </TouchableOpacity>
              <View style={styles.waveRow}>
                <View style={styles.recDot} />
                <Typography variant="mono" color={colors.crit} style={styles.timerText}>{formatDuration(elapsed)}</Typography>
                {[3, 5, 8, 6, 4, 7, 5, 3, 6, 4].map((h, i) => (
                  <Animated.View key={i} style={[styles.waveBar, { height: h * 3, opacity: pulseAnim.interpolate({ inputRange: [1, 1.2], outputRange: [0.4 + (i % 3) * 0.2, 1] }) }]} />
                ))}
              </View>
              <TouchableOpacity style={styles.sendBtn} onPress={stopRecordingAndSubmit} activeOpacity={0.8}>
                <Send size={18} color="#fff" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          )}

          {/* Voice result / feedback */}
          {showVoiceFeedback && (
            <View style={styles.voiceFeedback}>
              <TouchableOpacity style={styles.closeFeedback} onPress={clearResult} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={14} color={colors.textMuted} />
              </TouchableOpacity>
              {voiceError && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <MicOff size={13} color={colors.crit} />
                  <Typography variant="body" color={colors.crit} style={{ fontSize: 13, flex: 1 }}>{voiceError}</Typography>
                </View>
              )}
              {transcript && (
                <View style={{ marginBottom: 6 }}>
                  <Typography variant="label" color={colors.textDim} style={{ fontSize: 9, letterSpacing: 1.2, marginBottom: 4 }}>YOU SAID</Typography>
                  <Typography variant="body" color={colors.textMuted} style={{ fontSize: 13, fontStyle: 'italic' }}>"{transcript}"</Typography>
                </View>
              )}
              {summary && (
                <View>
                  <Typography variant="label" color={colors.green} style={{ fontSize: 9, letterSpacing: 1.2, marginBottom: 4 }}>AGENT RESPONSE</Typography>
                  <Typography variant="body" color={colors.text} style={{ fontSize: 13, fontWeight: '500' }}>{summary}</Typography>
                </View>
              )}
            </View>
          )}
        </View>

        {/* ── Section: Attach Media ── */}
        <Typography variant="label" color={colors.textDim} style={[styles.sectionLabel, { marginTop: 20 }]}>ATTACH MEDIA</Typography>
        <View style={styles.attachRow}>
          <Pressable style={({ pressed }) => [styles.attachBtn, pressed && styles.pressedState]} onPress={takePhoto}>
            <Camera size={20} color={colors.green} />
            <Typography variant="body" style={{ fontSize: 13, fontWeight: '600' }}>Camera</Typography>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.attachBtn, pressed && styles.pressedState]} onPress={uploadMedia}>
            <Upload size={20} color={colors.low} />
            <Typography variant="body" style={{ fontSize: 13, fontWeight: '600' }}>Gallery</Typography>
          </Pressable>
        </View>

        {/* Image Preview */}
        {imageUri && (
          <View style={styles.previewBox}>
            <Image source={{ uri: imageUri }} style={styles.previewImg} resizeMode="cover" />
            <TouchableOpacity style={styles.removeImg} onPress={() => setImageUri(null)} activeOpacity={0.8}>
              <X size={14} color="#fff" />
            </TouchableOpacity>
            <View style={styles.previewLabel}>
              <Typography variant="mono" color={colors.green} style={{ fontSize: 9, letterSpacing: 1 }}>PHOTO ATTACHED</Typography>
            </View>
          </View>
        )}

        {/* ── Submit ── */}
        <Pressable
          style={({ pressed }) => [styles.submitBtn, (!description.trim() || loading) && styles.submitBtnDisabled, pressed && !(!description.trim() || loading) && styles.pressedState]}
          onPress={submit}
          disabled={!description.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Typography variant="heading" color="#fff" style={{ fontSize: 15, letterSpacing: 0.5 }}>Submit Field Report</Typography>
          )}
        </Pressable>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 20, paddingBottom: 140 },
    msgBox: {
      flexDirection: 'row', alignItems: 'center', padding: 14,
      backgroundColor: colors.greenDim, borderWidth: 1, borderColor: colors.greenGlow,
      borderRadius: 12, marginBottom: 20,
    },
    msgBoxError: { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' },
    locBox: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
      padding: 16, borderRadius: 14, borderWidth: 1, borderColor: colors.border2, marginBottom: 20,
    },
    sectionLabel: { marginBottom: 12, letterSpacing: 1.2 },
    input: {
      minHeight: 130, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border2,
      borderRadius: 16, padding: 18, paddingTop: 18, color: colors.text, fontSize: 15,
      lineHeight: 22, textAlignVertical: 'top',
    },
    // ── Voice card ──────────────────────────────────────────────────
    voiceCard: {
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border2,
      borderRadius: 16, padding: 16, gap: 12,
    },
    voiceIdleRow: { flexDirection: 'row', alignItems: 'center' },
    micBtn: {
      width: 52, height: 52, borderRadius: 26, backgroundColor: colors.greenDim,
      borderWidth: 1.5, borderColor: colors.greenGlow, alignItems: 'center', justifyContent: 'center',
    },
    micBtnProcessing: { borderColor: colors.border2, backgroundColor: colors.surface2 },
    recordingBar: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: isDark ? 'rgba(18,18,20,0.8)' : colors.surface2,
      borderRadius: 40, paddingHorizontal: 10, paddingVertical: 10,
      borderWidth: 1, borderColor: colors.border2,
    },
    cancelBtn: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : '#FEF2F2',
      borderWidth: 1, borderColor: isDark ? 'rgba(239,68,68,0.25)' : '#FECACA',
      alignItems: 'center', justifyContent: 'center',
    },
    waveRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
    recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.crit, marginRight: 6 },
    timerText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5, marginRight: 8 },
    waveBar: { width: 3, borderRadius: 2, backgroundColor: colors.green },
    sendBtn: {
      width: 40, height: 40, borderRadius: 20, backgroundColor: colors.green,
      alignItems: 'center', justifyContent: 'center',
    },
    voiceFeedback: {
      backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : colors.surface2,
      borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border,
    },
    closeFeedback: { alignSelf: 'flex-end', marginBottom: 6 },
    // ── Media ───────────────────────────────────────────────────────
    attachRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    attachBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 10, paddingVertical: 16, backgroundColor: colors.surface,
      borderRadius: 14, borderWidth: 1, borderColor: colors.border2,
    },
    previewBox: {
      position: 'relative', height: 180, borderRadius: 16, overflow: 'hidden',
      marginBottom: 20, borderWidth: 1, borderColor: colors.greenGlow,
    },
    previewImg: { width: '100%', height: '100%' },
    removeImg: {
      position: 'absolute', top: 10, right: 10, width: 28, height: 28,
      borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
    },
    previewLabel: {
      position: 'absolute', bottom: 10, left: 12,
      backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
    },
    // ── Submit ──────────────────────────────────────────────────────
    submitBtn: {
      backgroundColor: colors.green, paddingVertical: 18, borderRadius: 16,
      alignItems: 'center', justifyContent: 'center', marginTop: 8,
      shadowColor: colors.green, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
    },
    submitBtnDisabled: { opacity: 0.45, shadowOpacity: 0, elevation: 0 },
    pressedState: { opacity: 0.8 },
  });

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Mic, MicOff, Send, X, Trash2 } from 'lucide-react-native';
import { useVoiceCommand, VoiceCommandCallbacks } from '../hooks/useVoiceCommand';
import { Typography } from './Typography';
import { useAppTheme } from '../hooks/useAppTheme';

interface VoiceCommandButtonProps {
  apiUrl: string;
  callbacks?: VoiceCommandCallbacks;
}

const INTENT_LABELS: Record<string, string> = {
  ingest: 'Incident Logged',
  list_incidents: 'Incidents Listed',
  run_plan: 'Plan Triggered',
  get_incident: 'Incident Queried',
  simulate: 'Simulation Started',
  unknown: 'Command Received',
};

function formatDuration(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function VoiceCommandButton({ apiUrl, callbacks }: VoiceCommandButtonProps) {
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors, isDark);

  const {
    isRecording,
    isProcessing,
    transcript,
    summary,
    intent,
    error,
    hasResult,
    startRecording,
    stopRecordingAndSubmit,
    cancelRecording,
    clearResult,
  } = useVoiceCommand(apiUrl, callbacks);

  // ── Recording timer ──────────────────────────────────────────────
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRecording) {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // ── Pulse animation ──────────────────────────────────────────────
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isRecording) {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.18,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.current.start();
    } else {
      pulseLoop.current?.stop();
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const showFeedback = hasResult && (transcript || summary || error);

  // ── Tap handlers ─────────────────────────────────────────────────
  const handleMicTap = useCallback(() => {
    if (!isRecording && !isProcessing) {
      startRecording();
    }
  }, [isRecording, isProcessing, startRecording]);

  const handleSend = useCallback(() => {
    if (isRecording) stopRecordingAndSubmit();
  }, [isRecording, stopRecordingAndSubmit]);

  const handleCancel = useCallback(() => {
    if (isRecording) cancelRecording();
  }, [isRecording, cancelRecording]);

  return (
    <View style={styles.container} pointerEvents="box-none">

      {/* ── Feedback Card ─────────────────────────────────────────── */}
      {showFeedback && (
        <View style={styles.feedbackContainer}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={clearResult}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <X size={15} color={colors.textMuted} />
          </TouchableOpacity>

          {error && (
            <View style={styles.errorRow}>
              <MicOff size={14} color={colors.crit} />
              <Typography
                variant="body"
                color={colors.crit}
                style={styles.errorText}
              >
                {error}
              </Typography>
            </View>
          )}

          {transcript && (
            <View style={styles.resultBlock}>
              <Typography variant="label" color={colors.textDim} style={styles.label}>
                YOU SAID
              </Typography>
              <Typography
                variant="body"
                color={colors.textMuted}
                style={styles.transcriptText}
              >
                "{transcript}"
              </Typography>
            </View>
          )}

          {intent && (
            <View style={styles.intentBadge}>
              <Typography variant="mono" color={colors.green} style={styles.intentText}>
                ⚡ {INTENT_LABELS[intent] ?? intent.replace(/_/g, ' ').toUpperCase()}
              </Typography>
            </View>
          )}

          {summary && (
            <View style={styles.resultBlock}>
              <Typography variant="label" color={colors.green} style={styles.label}>
                AGENT RESPONSE
              </Typography>
              <Typography variant="body" color={colors.text} style={styles.summaryText}>
                {summary}
              </Typography>
            </View>
          )}
        </View>
      )}

      {/* ── Recording Bar (WhatsApp style) ───────────────────────── */}
      {isRecording && (
        <View style={styles.recordingBar}>
          {/* Cancel (trash) */}
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancel}
            activeOpacity={0.8}
          >
            <Trash2 size={18} color={colors.crit} />
          </TouchableOpacity>

          {/* Waveform + Timer */}
          <View style={styles.waveRow}>
            <View style={styles.recDot} />
            <Typography
              variant="mono"
              color={colors.crit}
              style={styles.timerText}
            >
              {formatDuration(elapsed)}
            </Typography>
            {/* Fake waveform bars */}
            {[3, 5, 8, 6, 4, 7, 5, 3, 6, 4].map((h, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.waveBar,
                  {
                    height: h * 3,
                    opacity: pulseAnim.interpolate({
                      inputRange: [1, 1.18],
                      outputRange: [0.4 + (i % 3) * 0.2, 1],
                    }),
                  },
                ]}
              />
            ))}
          </View>

          {/* Send (checkmark) */}
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={handleSend}
            activeOpacity={0.8}
          >
            <Send size={18} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Main Mic Button (idle / processing) ─────────────────── */}
      {!isRecording && (
        <TouchableOpacity
          style={[
            styles.recordButton,
            isProcessing && styles.recordButtonProcessing,
          ]}
          onPress={handleMicTap}
          activeOpacity={0.85}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color={colors.green} size="small" />
          ) : (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Mic size={26} color={colors.green} strokeWidth={2} />
            </Animated.View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 110,
      right: 20,
      left: 20,
      alignItems: 'flex-end',
      justifyContent: 'flex-end',
      zIndex: 999,
    },

    // ── Feedback Card ─────────────────────────────────────────────
    feedbackContainer: {
      backgroundColor: isDark ? 'rgba(18, 18, 20, 0.97)' : 'rgba(255, 255, 255, 0.98)',
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border2,
      padding: 16,
      paddingTop: 10,
      marginBottom: 12,
      width: 288,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDark ? 0.5 : 0.15,
      shadowRadius: 20,
      elevation: 12,
    },
    closeBtn: {
      alignSelf: 'flex-end',
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    errorRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      marginBottom: 4,
    },
    errorText: {
      fontWeight: '500',
      fontSize: 13,
      flex: 1,
      lineHeight: 18,
    },
    resultBlock: {
      marginTop: 10,
    },
    label: {
      fontSize: 9,
      letterSpacing: 1.2,
      marginBottom: 5,
    },
    transcriptText: {
      fontSize: 13,
      fontStyle: 'italic',
      lineHeight: 18,
    },
    intentBadge: {
      marginTop: 10,
      alignSelf: 'flex-start',
      backgroundColor: colors.greenDim,
      borderWidth: 1,
      borderColor: colors.greenGlow,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    intentText: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    summaryText: {
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 21,
    },

    // ── Recording Bar ─────────────────────────────────────────────
    recordingBar: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      backgroundColor: isDark ? 'rgba(18, 18, 20, 0.97)' : '#fff',
      borderRadius: 40,
      borderWidth: 1,
      borderColor: colors.border2,
      paddingHorizontal: 10,
      paddingVertical: 10,
      marginBottom: 8,
      gap: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 12,
      elevation: 10,
    },
    cancelBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : '#FEF2F2',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(239,68,68,0.25)' : '#FECACA',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    waveRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    recDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.crit,
      marginRight: 6,
    },
    timerText: {
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.5,
      marginRight: 8,
      color: colors.crit,
    },
    waveBar: {
      width: 3,
      borderRadius: 2,
      backgroundColor: colors.green,
    },
    sendBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.green,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.green,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 6,
      flexShrink: 0,
    },

    // ── Mic Button (idle) ─────────────────────────────────────────
    recordButton: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.greenGlow,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.green,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.22,
      shadowRadius: 14,
      elevation: 8,
    },
    recordButtonProcessing: {
      borderColor: colors.border2,
      shadowOpacity: 0.05,
    },
  });

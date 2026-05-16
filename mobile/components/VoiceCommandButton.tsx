import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Mic } from 'lucide-react-native';
import { useVoiceCommand } from '../hooks/useVoiceCommand';
import { Typography } from './Typography';
import { theme } from '../constants/theme';

interface VoiceCommandButtonProps {
  apiUrl: string;
}

export function VoiceCommandButton({ apiUrl }: VoiceCommandButtonProps) {
  const {
    isRecording,
    isProcessing,
    transcript,
    summary,
    error,
    startRecording,
    stopRecordingAndSubmit,
    cancelRecording,
  } = useVoiceCommand(apiUrl);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Feedback Overlay */}
      {(transcript || summary || error || isProcessing) && (
        <View style={styles.feedbackContainer}>
          {isProcessing && (
            <View style={styles.processingRow}>
              <ActivityIndicator color={theme.colors.green} size="small" />
              <Typography variant="body" color={theme.colors.green} style={styles.processingText}>
                Processing command...
              </Typography>
            </View>
          )}
          
          {error && (
            <Typography variant="body" color={theme.colors.crit} style={styles.errorText}>
              {error}
            </Typography>
          )}
          
          {transcript && !isProcessing && (
            <View style={styles.resultBlock}>
              <Typography variant="label" color={theme.colors.textDim} style={styles.label}>
                YOU SAID
              </Typography>
              <Typography variant="body" color={theme.colors.textMuted} style={styles.transcriptText}>
                "{transcript}"
              </Typography>
            </View>
          )}
          
          {summary && !isProcessing && (
            <View style={styles.resultBlock}>
              <Typography variant="label" color={theme.colors.green} style={styles.label}>
                AGENT
              </Typography>
              <Typography variant="body" color={theme.colors.text} style={styles.summaryText}>
                {summary}
              </Typography>
            </View>
          )}
        </View>
      )}

      {/* Main Record Button */}
      <View style={styles.buttonWrapper}>
        {isRecording && (
          <View style={styles.recordingHintBox}>
            <View style={styles.pulseDot} />
            <Typography variant="mono" color={theme.colors.green} style={styles.recordingHint}>
              LISTENING
            </Typography>
          </View>
        )}
        <TouchableOpacity
          style={[styles.recordButton, isRecording && styles.recordButtonActive]}
          onPressIn={startRecording}
          onPressOut={stopRecordingAndSubmit}
          activeOpacity={0.8}
        >
          <Mic
            size={28}
            color={isRecording ? theme.colors.bg : theme.colors.green}
            strokeWidth={isRecording ? 3 : 2}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 110, // Just above the BottomNav
    right: 20,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    zIndex: 999,
  },
  buttonWrapper: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  recordButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.greenDim,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.green,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  recordButtonActive: {
    backgroundColor: theme.colors.green,
    borderColor: theme.colors.greenGlow,
    transform: [{ scale: 1.1 }],
    shadowOpacity: 0.6,
  },
  recordingHintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.green,
  },
  recordingHint: {
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 1,
  },
  feedbackContainer: {
    backgroundColor: 'rgba(24, 24, 27, 0.95)', // surface with high opacity
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border2,
    padding: 16,
    marginBottom: 16,
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  processingText: {
    fontWeight: '600',
    fontSize: 14,
  },
  errorText: {
    fontWeight: '600',
    fontSize: 13,
  },
  resultBlock: {
    marginTop: 8,
  },
  label: {
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 4,
  },
  transcriptText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  summaryText: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
});

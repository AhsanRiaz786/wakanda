import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVoiceCommand } from '../hooks/useVoiceCommand';

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
    <View style={styles.container}>
      {/* Feedback Overlay */}
      {(transcript || summary || error || isProcessing) && (
        <View style={styles.feedbackContainer}>
          {isProcessing && (
            <View style={styles.processingRow}>
              <ActivityIndicator color="#007AFF" />
              <Text style={styles.processingText}>Processing voice command...</Text>
            </View>
          )}
          
          {error && <Text style={styles.errorText}>{error}</Text>}
          
          {transcript && !isProcessing && (
            <View style={styles.resultBlock}>
              <Text style={styles.label}>Heard:</Text>
              <Text style={styles.transcriptText}>"{transcript}"</Text>
            </View>
          )}
          
          {summary && !isProcessing && (
            <View style={styles.resultBlock}>
              <Text style={styles.label}>AI:</Text>
              <Text style={styles.summaryText}>{summary}</Text>
            </View>
          )}
        </View>
      )}

      {/* Main Record Button */}
      <TouchableOpacity
        style={[styles.recordButton, isRecording && styles.recordButtonActive]}
        onPressIn={startRecording}
        onPressOut={stopRecordingAndSubmit}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isRecording ? 'mic' : 'mic-outline'}
          size={32}
          color={isRecording ? '#FF3B30' : '#FFFFFF'}
        />
      </TouchableOpacity>
      
      {isRecording && (
        <Text style={styles.recordingHint}>Release to send</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 20,
    width: '100%',
  },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  recordButtonActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#FF3B30',
    transform: [{ scale: 1.1 }],
  },
  recordingHint: {
    marginTop: 12,
    color: '#FF3B30',
    fontWeight: '600',
    fontSize: 14,
  },
  feedbackContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  processingText: {
    marginLeft: 12,
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 16,
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
    fontWeight: '600',
    padding: 8,
  },
  resultBlock: {
    marginVertical: 8,
  },
  label: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 4,
  },
  transcriptText: {
    fontSize: 16,
    color: '#333',
    fontStyle: 'italic',
  },
  summaryText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
});

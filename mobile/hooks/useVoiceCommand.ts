import { useState, useRef } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';

export interface VoiceCommandResponse {
  transcript: string;
  intent: string;
  params: Record<string, any>;
  summary: string;
  audio_b64: string;
}

export function useVoiceCommand(apiUrl: string) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const startRecording = async () => {
    try {
      setError(null);
      setTranscript('');
      setSummary('');

      // Request permissions
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        setError('Microphone permission not granted');
        return;
      }

      // Configure audio session
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording (using high quality preset)
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      setError('Failed to start recording');
      setIsRecording(false);
    }
  };

  const stopRecordingAndSubmit = async () => {
    if (!recordingRef.current) return;

    try {
      setIsRecording(false);
      setIsProcessing(true);

      // Stop recording
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) {
        throw new Error('No recording URI available');
      }

      // Prepare file for upload
      const fileExtension = uri.split('.').pop() || 'wav';
      const mimeType = Platform.OS === 'ios' ? 'audio/m4a' : `audio/${fileExtension}`;

      const formData = new FormData();
      // @ts-ignore - React Native FormData accepts an object with uri, name, type
      formData.append('audio', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: `recording.${fileExtension}`,
        type: mimeType,
      });

      // Upload and process
      const response = await fetch(`${apiUrl}/v1/voice`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail?.message || `Server error: ${response.status}`);
      }

      const data: VoiceCommandResponse = await response.json();
      
      setTranscript(data.transcript);
      setSummary(data.summary);

      // Play the response audio if available
      if (data.audio_b64) {
        await playBase64Audio(data.audio_b64);
      }

    } catch (err: any) {
      console.error('Voice processing failed', err);
      setError(err.message || 'Failed to process voice command');
    } finally {
      setIsProcessing(false);
    }
  };

  const playBase64Audio = async (base64Audio: string) => {
    try {
      // Unload previous sound if it exists
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // Configure audio session for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      // Format base64 URI for playback
      const uri = `data:audio/mp3;base64,${base64Audio}`;
      
      const { sound } = await Audio.Sound.createAsync({ uri });
      soundRef.current = sound;
      
      await sound.playAsync();
    } catch (err) {
      console.error('Failed to play response audio', err);
      setError('Failed to play response audio');
    }
  };

  const cancelRecording = async () => {
    if (!recordingRef.current) return;
    try {
      await recordingRef.current.stopAndUnloadAsync();
      recordingRef.current = null;
      setIsRecording(false);
      setError('Recording cancelled');
    } catch (err) {
      console.error('Failed to cancel recording', err);
    }
  };

  return {
    isRecording,
    isProcessing,
    transcript,
    summary,
    error,
    startRecording,
    stopRecordingAndSubmit,
    cancelRecording,
  };
}

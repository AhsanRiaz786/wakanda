import { useState, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import { useStatus } from '../contexts/StatusContext';

export interface VoiceCommandResponse {
  transcript: string;
  intent: string;
  params: Record<string, any>;
  summary: string;
  audio_b64: string;
}

export interface VoiceCommandCallbacks {
  /** Called after a successful ingest intent so the caller can refresh their list */
  onIngestSuccess?: () => void;
  /** Called after any successful command with the full response */
  onSuccess?: (res: VoiceCommandResponse) => void;
}

export function useVoiceCommand(apiUrl: string, callbacks?: VoiceCommandCallbacks) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [intent, setIntent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasResult, setHasResult] = useState(false);

  const { showStatus, updateStatus } = useStatus();

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const statusIdRef = useRef<string | null>(null);

  /** Unload any playing sound so we don't hit AudioSession conflicts */
  const unloadSound = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch { /* ignore */ }
      soundRef.current = null;
    }
  };

  const clearResult = useCallback(() => {
    setTranscript('');
    setSummary('');
    setIntent('');
    setError(null);
    setHasResult(false);
  }, []);

  const startRecording = async () => {
    // Always clear previous result state first
    clearResult();

    try {
      // Unload any previous TTS audio before starting mic
      await unloadSound();

      // Switch audio mode to recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Request permissions
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        setError('Microphone permission denied. Enable in device settings.');
        showStatus({ type: 'error', label: 'Mic Permission Denied', duration: 4000 });
        return;
      }

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);

      const sid = showStatus({ type: 'loading', label: 'Listening...', duration: 0 });
      statusIdRef.current = sid;
    } catch (err: any) {
      const msg = err?.message || 'Failed to start recording';
      setError(msg);
      showStatus({ type: 'error', label: 'Mic Error', duration: 4000 });
      setIsRecording(false);
    }
  };

  const stopRecordingAndSubmit = async () => {
    if (!recordingRef.current) return;

    try {
      setIsRecording(false);
      setIsProcessing(true);

      if (statusIdRef.current) {
        updateStatus(statusIdRef.current, { type: 'loading', label: 'Processing...' });
      }

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) throw new Error('No recording URI');

      const fileExtension = uri.split('.').pop() || 'wav';
      const mimeType = Platform.OS === 'ios' ? 'audio/m4a' : `audio/${fileExtension}`;

      const formData = new FormData();
      // @ts-ignore
      formData.append('audio', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: `recording.${fileExtension}`,
        type: mimeType,
      });

      // Fix potential double /v1 in URL
      const baseUrl = apiUrl.endsWith('/v1') ? apiUrl.slice(0, -3) : apiUrl;
      const response = await fetch(`${baseUrl}/v1/voice`, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.detail?.message ||
          errorData?.detail ||
          `Server error ${response.status}`
        );
      }

      const data: VoiceCommandResponse = await response.json();

      setTranscript(data.transcript);
      setSummary(data.summary);
      setIntent(data.intent);
      setHasResult(true);

      if (statusIdRef.current) {
        updateStatus(statusIdRef.current, {
          type: 'success',
          label: `Intent: ${data.intent}`,
          duration: 4000,
        });
        statusIdRef.current = null;
      }

      // Fire callbacks
      callbacks?.onSuccess?.(data);
      if (data.intent === 'ingest') {
        callbacks?.onIngestSuccess?.();
      }

      // Play TTS response if available
      if (data.audio_b64) {
        await playBase64Audio(data.audio_b64);
      }

    } catch (err: any) {
      const msg = err?.message || 'Voice processing failed';
      setError(msg);
      setHasResult(true); // show the error in the popup

      if (statusIdRef.current) {
        updateStatus(statusIdRef.current, { type: 'error', label: 'Voice Failed', duration: 4000 });
        statusIdRef.current = null;
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const playBase64Audio = async (base64Audio: string) => {
    try {
      await unloadSound();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const uri = `data:audio/mp3;base64,${base64Audio}`;
      const { sound } = await Audio.Sound.createAsync({ uri });
      soundRef.current = sound;
      await sound.playAsync();
    } catch {
      // TTS failure is non-fatal — response is still shown as text
    }
  };

  const cancelRecording = async () => {
    if (!recordingRef.current) return;
    try {
      await recordingRef.current.stopAndUnloadAsync();
      recordingRef.current = null;
      setIsRecording(false);

      if (statusIdRef.current) {
        updateStatus(statusIdRef.current, { type: 'warning', label: 'Cancelled', duration: 3000 });
        statusIdRef.current = null;
      }
    } catch { /* ignore */ }
  };

  return {
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
  };
}

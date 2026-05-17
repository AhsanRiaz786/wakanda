import { useState } from 'react';
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
} from 'react-native';
import { Camera, MapPin, Upload, X, CheckCircle2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

import { api } from '@/src/lib/api';
import { useAppTheme } from '../../hooks/useAppTheme';
import { TopBar } from '../../components/TopBar';
import { Typography } from '../../components/Typography';
import { NotificationPanel } from '../../components/NotificationPanel';

export default function ReportIncidentScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors, isDark);

  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);

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
    if (!granted) {
      setError('Camera permission denied. Enable it in your device settings.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setError(null);
    }
  };

  const uploadMedia = async () => {
    const granted = await requestPermission('gallery');
    if (!granted) {
      setError('Media library permission denied. Enable it in your device settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setError(null);
    }
  };

  const submit = async () => {
    if (!description.trim()) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const body: Record<string, unknown> = {
        rawDescription: description,
        sourceType: 'field_report',
        rawCoordinates: { lat: 33.7205, lng: 73.0478 },
        rawAddress: 'Sector G-11, Islamabad',
      };
      // If image was selected, include its URI as imageUrl
      // (backend stores it as metadata; full upload would need multipart)
      if (imageUri) {
        body.imageUrl = imageUri;
        body.sourceMetadata = { hasPhoto: true, photoUri: imageUri };
      }
      const incident = await api.ingest(body);
      setMessage(`Incident logged ✓ ID: ${incident.incidentId}`);
      setDescription('');
      setImageUri(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TopBar
        title="New Report"
        rightIcon="bell"
        onRightPress={() => setNotifVisible(true)}
      />
      <NotificationPanel visible={notifVisible} onClose={() => setNotifVisible(false)} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Success Banner */}
        {message && (
          <View style={styles.msgBox}>
            <CheckCircle2 size={18} color={colors.green} />
            <Typography variant="body" color={colors.green} style={{ flex: 1, marginLeft: 10 }}>
              {message}
            </Typography>
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
            <Typography variant="mono" color={colors.textDim} style={{ fontSize: 10, letterSpacing: 1 }}>
              LOCATION DETECTED
            </Typography>
            <Typography variant="body" style={{ fontSize: 13, marginTop: 2 }}>
              Sector G-11, Islamabad · 33.72°N 73.05°E
            </Typography>
          </View>
        </View>

        {/* Observation Label */}
        <Typography variant="label" color={colors.textDim} style={styles.sectionLabel}>
          OBSERVATION
        </Typography>

        {/* Text Input */}
        <TextInput
          style={styles.input}
          multiline
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the situation in detail — type, location, severity, any visible hazards..."
          placeholderTextColor={colors.textDim}
        />

        {/* Char count */}
        <Typography
          variant="mono"
          color={description.length > 20 ? colors.green : colors.textDim}
          style={{ fontSize: 10, marginTop: 6, marginBottom: 16, textAlign: 'right' }}
        >
          {description.length} chars
        </Typography>

        {/* Media Section */}
        <Typography variant="label" color={colors.textDim} style={styles.sectionLabel}>
          ATTACH MEDIA
        </Typography>

        <View style={styles.attachRow}>
          <Pressable
            style={({ pressed }) => [styles.attachBtn, pressed && styles.pressedState]}
            onPress={takePhoto}
          >
            <Camera size={20} color={colors.green} />
            <Typography variant="body" style={{ fontSize: 13, fontWeight: '600' }}>
              Camera
            </Typography>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.attachBtn, pressed && styles.pressedState]}
            onPress={uploadMedia}
          >
            <Upload size={20} color={colors.low} />
            <Typography variant="body" style={{ fontSize: 13, fontWeight: '600' }}>
              Gallery
            </Typography>
          </Pressable>
        </View>

        {/* Image Preview */}
        {imageUri && (
          <View style={styles.previewBox}>
            <Image source={{ uri: imageUri }} style={styles.previewImg} resizeMode="cover" />
            <TouchableOpacity
              style={styles.removeImg}
              onPress={() => setImageUri(null)}
              activeOpacity={0.8}
            >
              <X size={14} color="#fff" />
            </TouchableOpacity>
            <View style={styles.previewLabel}>
              <Typography variant="mono" color={colors.green} style={{ fontSize: 9, letterSpacing: 1 }}>
                PHOTO ATTACHED
              </Typography>
            </View>
          </View>
        )}

        {/* Submit */}
        <Pressable
          style={({ pressed }) => [
            styles.submitBtn,
            (!description.trim() || loading) && styles.submitBtnDisabled,
            pressed && !(!description.trim() || loading) && styles.pressedState,
          ]}
          onPress={submit}
          disabled={!description.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Typography variant="heading" color="#fff" style={{ fontSize: 15, letterSpacing: 0.5 }}>
              Submit Field Report
            </Typography>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    content: {
      padding: 20,
      paddingBottom: 140,
    },
    msgBox: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      backgroundColor: colors.greenDim,
      borderWidth: 1,
      borderColor: colors.greenGlow,
      borderRadius: 12,
      marginBottom: 20,
    },
    msgBoxError: {
      backgroundColor: 'rgba(239,68,68,0.08)',
      borderColor: 'rgba(239,68,68,0.25)',
    },
    locBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border2,
      marginBottom: 20,
    },
    sectionLabel: {
      marginBottom: 12,
      letterSpacing: 1.2,
    },
    input: {
      minHeight: 150,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border2,
      borderRadius: 16,
      padding: 18,
      paddingTop: 18,
      color: colors.text,
      fontSize: 15,
      lineHeight: 22,
      textAlignVertical: 'top',
    },
    attachRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    attachBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingVertical: 16,
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border2,
    },
    previewBox: {
      position: 'relative',
      height: 180,
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.greenGlow,
    },
    previewImg: {
      width: '100%',
      height: '100%',
    },
    removeImg: {
      position: 'absolute',
      top: 10,
      right: 10,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: 'rgba(0,0,0,0.6)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    previewLabel: {
      position: 'absolute',
      bottom: 10,
      left: 12,
      backgroundColor: 'rgba(0,0,0,0.5)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    submitBtn: {
      backgroundColor: colors.green,
      paddingVertical: 18,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
      shadowColor: colors.green,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 6,
    },
    submitBtnDisabled: {
      opacity: 0.45,
      shadowOpacity: 0,
      elevation: 0,
    },
    pressedState: {
      opacity: 0.8,
    },
  });

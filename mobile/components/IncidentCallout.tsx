import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import {
  MapPin, AlertTriangle, Clock, Zap, ArrowRight, X, Activity,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Typography } from './Typography';
import { useAppTheme } from '../hooks/useAppTheme';

const SEV_COLORS: Record<string, string> = {
  CRITICAL: '#EF4444',
  HIGH: '#F97316',
  MEDIUM: '#EAB308',
  LOW: '#22C55E',
  UNKNOWN: '#94A3B8',
};

const SEV_BG: Record<string, string> = {
  CRITICAL: 'rgba(239,68,68,0.12)',
  HIGH: 'rgba(249,115,22,0.12)',
  MEDIUM: 'rgba(234,179,8,0.12)',
  LOW: 'rgba(34,197,94,0.12)',
  UNKNOWN: 'rgba(148,163,184,0.12)',
};

interface IncidentCalloutProps {
  incident: any | null;
  onClose: () => void;
}

export function IncidentCallout({ incident, onClose }: IncidentCalloutProps) {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors, isDark);

  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (incident) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [incident]);

  if (!incident) return null;

  const sev = (incident.severity || 'UNKNOWN').toUpperCase();
  const sevColor = SEV_COLORS[sev] ?? SEV_COLORS.UNKNOWN;
  const sevBg = SEV_BG[sev] ?? SEV_BG.UNKNOWN;
  const status = String(incident.status || 'reported')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* Backdrop tap-to-dismiss */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      <Animated.View
        style={[
          styles.card,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={[styles.sevBadge, { backgroundColor: sevBg, borderColor: sevColor }]}>
            <AlertTriangle size={12} color={sevColor} strokeWidth={2.5} />
            <Typography variant="mono" style={{ fontSize: 10, color: sevColor, fontWeight: '700', marginLeft: 5 }}>
              {sev}
            </Typography>
          </View>

          <View style={styles.idBadge}>
            <Typography variant="mono" color={colors.textMuted} style={{ fontSize: 10 }}>
              #{String(incident.incidentId || '').slice(-6).toUpperCase()}
            </Typography>
          </View>

          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <Typography variant="heading" style={styles.title} numberOfLines={2}>
          {incident.title || incident.rawDescription || 'Incident'}
        </Typography>

        {/* Meta row */}
        <View style={styles.metaRow}>
          {incident.coordinates && (
            <View style={styles.metaItem}>
              <MapPin size={13} color={colors.textMuted} />
              <Typography variant="body" color={colors.textMuted} style={styles.metaText}>
                {incident.coordinates.lat.toFixed(4)}°N, {incident.coordinates.lng.toFixed(4)}°E
              </Typography>
            </View>
          )}
          <View style={styles.metaItem}>
            <Clock size={13} color={colors.textMuted} />
            <Typography variant="body" color={colors.textMuted} style={styles.metaText}>
              {status}
            </Typography>
          </View>
          {incident.urgencyScore != null && (
            <View style={styles.metaItem}>
              <Zap size={13} color={colors.med} />
              <Typography variant="body" color={colors.med} style={styles.metaText}>
                Urgency {incident.urgencyScore}
              </Typography>
            </View>
          )}
        </View>

        {/* Description preview */}
        {incident.description && (
          <Typography
            variant="body"
            color={colors.textMuted}
            style={styles.descPreview}
            numberOfLines={2}
          >
            {incident.description}
          </Typography>
        )}

        {/* Departments if available */}
        {Array.isArray(incident.assignedDepartments) && incident.assignedDepartments.length > 0 && (
          <View style={styles.deptRow}>
            <Activity size={12} color={colors.green} />
            <Typography variant="mono" color={colors.green} style={{ fontSize: 10, marginLeft: 6 }}>
              {incident.assignedDepartments.slice(0, 3).join(' · ')}
            </Typography>
          </View>
        )}

        {/* CTA */}
        <TouchableOpacity
          style={[styles.ctaBtn, { shadowColor: sevColor }]}
          onPress={() => {
            onClose();
            router.push(`/incident/${incident.incidentId}`);
          }}
          activeOpacity={0.85}
        >
          <Typography variant="heading" color="#fff" style={{ fontSize: 14 }}>
            View Full Detail
          </Typography>
          <ArrowRight size={16} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    card: {
      width: '85%',
      backgroundColor: isDark ? 'rgba(14, 14, 16, 0.98)' : 'rgba(255,255,255,0.99)',
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border2,
      paddingHorizontal: 20,
      paddingBottom: 24,
      paddingTop: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDark ? 0.5 : 0.25,
      shadowRadius: 20,
      elevation: 20,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 10,
    },
    sevBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      borderWidth: 1,
    },
    idBadge: {
      flex: 1,
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: colors.surface2,
      borderRadius: 6,
    },
    closeBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 16,
      lineHeight: 22,
      marginBottom: 10,
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 10,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    metaText: {
      fontSize: 12,
    },
    descPreview: {
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 12,
    },
    deptRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      backgroundColor: colors.greenDim,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      alignSelf: 'flex-start',
    },
    ctaBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      backgroundColor: colors.green,
      borderRadius: 16,
      paddingVertical: 15,
      marginTop: 6,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 6,
    },
  });

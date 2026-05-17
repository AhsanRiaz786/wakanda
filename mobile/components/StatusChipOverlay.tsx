import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { CheckCircle2, AlertTriangle, PowerOff, Info } from 'lucide-react-native';
import { useStatus, StatusChip, ChipType } from '../contexts/StatusContext';
import { Typography } from './Typography';
import { useAppTheme } from '../hooks/useAppTheme';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 44;

function SingleChip({ chip }: { chip: StatusChip }) {
  const { isDark } = useAppTheme();
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-16)).current;
  const scaleAnim = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 9,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 9,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getStyleForType = (type: ChipType) => {
    switch (type) {
      case 'connected':
      case 'success':
        return {
          bg: isDark ? 'rgba(34, 197, 94, 0.15)' : '#F0FDF4',
          border: isDark ? 'rgba(34, 197, 94, 0.3)' : '#BBFBD0',
          text: isDark ? '#4ADE80' : '#16A34A',
          Icon: CheckCircle2,
        };
      case 'loading':
        return {
          bg: isDark ? 'rgba(139, 92, 246, 0.15)' : '#F5F3FF',
          border: isDark ? 'rgba(139, 92, 246, 0.3)' : '#DDD6FE',
          text: isDark ? '#A78BFA' : '#7C3AED',
          Icon: null, // uses ActivityIndicator
        };
      case 'error':
        return {
          bg: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
          border: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA',
          text: isDark ? '#F87171' : '#DC2626',
          Icon: AlertTriangle,
        };
      case 'disabled':
        return {
          bg: isDark ? 'rgba(156, 163, 175, 0.15)' : '#F9FAFB',
          border: isDark ? 'rgba(156, 163, 175, 0.3)' : '#E5E7EB',
          text: isDark ? '#9CA3AF' : '#4B5563',
          Icon: PowerOff,
        };
      case 'warning':
      default:
        return {
          bg: isDark ? 'rgba(249, 115, 22, 0.15)' : '#FFF7ED',
          border: isDark ? 'rgba(249, 115, 22, 0.3)' : '#FED7AA',
          text: isDark ? '#FDBA74' : '#EA580C',
          Icon: Info,
        };
    }
  };

  const conf = getStyleForType(chip.type);
  const Icon = conf.Icon;

  return (
    <Animated.View
      style={[
        styles.chipWrapper,
        {
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <View style={[styles.chip, { backgroundColor: conf.bg, borderColor: conf.border }]}>
        {chip.type === 'loading' ? (
          <ActivityIndicator size="small" color={conf.text} style={styles.chipIcon} />
        ) : (
          Icon && <Icon size={15} color={conf.text} strokeWidth={2.5} style={styles.chipIcon} />
        )}
        <Typography
          variant="heading"
          style={{ fontSize: 13, color: conf.text, letterSpacing: 0.2 }}
        >
          {chip.label}
        </Typography>
      </View>
    </Animated.View>
  );
}

export function StatusChipOverlay() {
  const { chips } = useStatus();
  if (chips.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {chips.map(chip => (
        <SingleChip key={chip.id} chip={chip} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: STATUS_BAR_HEIGHT + 8,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  chipWrapper: {
    marginBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  chipIcon: {
    marginRight: 8,
  },
});

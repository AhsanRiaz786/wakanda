import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import {
  Moon,
  Sun,
  SunMoon,
  Bell,
  Shield,
  Info,
  ChevronRight,
  Server,
  Cpu,
} from 'lucide-react-native';

import { useAppTheme } from '../../hooks/useAppTheme';
import { TopBar } from '../../components/TopBar';
import { Typography } from '../../components/Typography';

type ThemeMode = 'light' | 'dark' | 'system';

export default function SettingsScreen() {
  const { colors, isDark, themeMode, setThemeMode } = useAppTheme();
  const styles = makeStyles(colors, isDark);

  const THEME_OPTIONS: { id: ThemeMode; label: string; desc: string; icon: any }[] = [
    { id: 'system', label: 'System Default', desc: 'Follow device appearance', icon: SunMoon },
    { id: 'light', label: 'Light Mode', desc: 'Always use light theme', icon: Sun },
    { id: 'dark', label: 'Dark Mode', desc: 'Always use dark theme', icon: Moon },
  ];

  return (
    <View style={styles.container}>
      <TopBar title="Settings" rightIcon="bell" />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── APPEARANCE ── */}
        <View style={styles.section}>
          <Typography variant="label" color={colors.textDim} style={styles.sectionLabel}>
            APPEARANCE
          </Typography>

          {THEME_OPTIONS.map((opt, idx) => {
            const Icon = opt.icon;
            const isSelected = themeMode === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.themeCard,
                  isSelected && styles.themeCardActive,
                  idx !== THEME_OPTIONS.length - 1 && styles.themeCardBorder,
                ]}
                activeOpacity={0.7}
                onPress={() => setThemeMode(opt.id)}
              >
                <View
                  style={[
                    styles.themeIconBox,
                    { backgroundColor: isSelected ? colors.greenDim : colors.surface2 },
                  ]}
                >
                  <Icon
                    size={20}
                    color={isSelected ? colors.green : colors.textMuted}
                    strokeWidth={2}
                  />
                </View>
                <View style={styles.themeCardBody}>
                  <Typography
                    variant="body"
                    style={{ fontSize: 15, fontWeight: isSelected ? '600' : '400' }}
                    color={isSelected ? colors.text : colors.textMuted}
                  >
                    {opt.label}
                  </Typography>
                  <Typography variant="body" color={colors.textDim} style={{ fontSize: 12, marginTop: 2 }}>
                    {opt.desc}
                  </Typography>
                </View>
                {/* Selected indicator */}
                <View
                  style={[
                    styles.radioOuter,
                    isSelected && { borderColor: colors.green },
                  ]}
                >
                  {isSelected && <View style={[styles.radioInner, { backgroundColor: colors.green }]} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── LIVE PREVIEW ── */}
        <View style={styles.section}>
          <Typography variant="label" color={colors.textDim} style={styles.sectionLabel}>
            LIVE PREVIEW
          </Typography>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View style={[styles.previewDot, { backgroundColor: colors.crit }]} />
              <View style={[styles.previewDot, { backgroundColor: colors.high, marginLeft: 6 }]} />
              <View style={[styles.previewDot, { backgroundColor: colors.green, marginLeft: 6 }]} />
            </View>
            <Typography variant="heading" style={{ fontSize: 16, marginBottom: 6 }}>
              {isDark ? '🌙 Dark Mode Active' : '☀️ Light Mode Active'}
            </Typography>
            <Typography variant="body" color={colors.textMuted} style={{ fontSize: 13 }}>
              Surface: {isDark ? '#18181B' : '#FFFFFF'} · Text: {isDark ? '#FAFAFA' : '#111827'}
            </Typography>
            <View style={styles.previewBadgeRow}>
              <View style={[styles.previewBadge, { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)' }]}>
                <Typography variant="mono" color={colors.crit} style={{ fontSize: 9 }}>CRIT</Typography>
              </View>
              <View style={[styles.previewBadge, { backgroundColor: colors.greenDim, borderColor: colors.greenGlow }]}>
                <Typography variant="mono" color={colors.green} style={{ fontSize: 9 }}>RESOLVED</Typography>
              </View>
              <View style={[styles.previewBadge, { backgroundColor: 'rgba(249,115,22,0.1)', borderColor: 'rgba(249,115,22,0.2)' }]}>
                <Typography variant="mono" color={colors.high} style={{ fontSize: 9 }}>HIGH</Typography>
              </View>
            </View>
          </View>
        </View>

        {/* ── SYSTEM ── */}
        <View style={styles.section}>
          <Typography variant="label" color={colors.textDim} style={styles.sectionLabel}>
            SYSTEM
          </Typography>
          {[
            { icon: Server, label: 'Backend URL', value: process.env.EXPO_PUBLIC_API_BASE_URL || 'Not set' },
            { icon: Cpu, label: 'LLM Engine', value: 'Groq llama-3.3-70b' },
            { icon: Shield, label: 'Voice Pipeline', value: 'Deepgram + ElevenLabs' },
          ].map((row) => {
            const Icon = row.icon;
            return (
              <View key={row.label} style={styles.infoRow}>
                <View style={[styles.infoIconBox, { backgroundColor: colors.surface2 }]}>
                  <Icon size={16} color={colors.textMuted} strokeWidth={2} />
                </View>
                <View style={styles.infoBody}>
                  <Typography variant="body" color={colors.textMuted} style={{ fontSize: 12 }}>
                    {row.label}
                  </Typography>
                  <Typography variant="mono" style={{ fontSize: 11, fontWeight: '600', marginTop: 2 }} numberOfLines={1}>
                    {row.value}
                  </Typography>
                </View>
              </View>
            );
          })}
        </View>

        {/* ── ABOUT ── */}
        <View style={styles.section}>
          <Typography variant="label" color={colors.textDim} style={styles.sectionLabel}>
            ABOUT
          </Typography>
          <TouchableOpacity style={styles.aboutRow}>
            <Info size={16} color={colors.textMuted} />
            <Typography variant="body" color={colors.textMuted} style={{ flex: 1, marginLeft: 12, fontSize: 14 }}>
              CityIRA — Google Antigravity Hackathon
            </Typography>
            <Typography variant="mono" color={colors.textDim} style={{ fontSize: 11 }}>v1.0.0</Typography>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={{ alignItems: 'center', paddingVertical: 24 }}>
          <Typography variant="mono" color={colors.textDim} style={{ fontSize: 10, letterSpacing: 1 }}>
            BUILT WITH GOOGLE ANTIGRAVITY
          </Typography>
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    section: {
      marginTop: 24,
      paddingHorizontal: 20,
    },
    sectionLabel: {
      marginBottom: 12,
      letterSpacing: 1.5,
    },
    // Theme picker cards
    themeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 0,
      gap: 14,
    },
    themeCardBorder: {
      borderBottomWidth: 0,
    },
    themeCardActive: {
      backgroundColor: isDark ? 'rgba(16,185,129,0.04)' : 'rgba(31,181,94,0.04)',
      borderColor: colors.greenGlow,
    },
    themeIconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    themeCardBody: {
      flex: 1,
    },
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.border2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    // Preview card
    previewCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 16,
    },
    previewHeader: {
      flexDirection: 'row',
      marginBottom: 12,
    },
    previewDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    previewBadgeRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },
    previewBadge: {
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 6,
      borderWidth: 1,
    },
    // System info rows
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    infoIconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoBody: {
      flex: 1,
    },
    aboutRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: 16,
    },
  });

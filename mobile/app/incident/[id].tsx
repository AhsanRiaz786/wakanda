import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { MapPin, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react-native';

import { api } from '@/src/lib/api';
import { useAppTheme } from '../../hooks/useAppTheme';
import { TopBar } from '../../components/TopBar';
import { Typography } from '../../components/Typography';
import { TimelineStepper } from '../../components/TimelineStepper';

const STATUS_STEPS = ['Reported', 'Triaged', 'Assigned', 'In Progress', 'Resolved'];

export default function IncidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors, isDark);
  
  const [incident, setIncident] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .getIncident(id as string)
      .then(setIncident)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'));
  }, [id]);

  if (!incident && !error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.green} size="large" />
      </View>
    );
  }

  const conflict = incident?.resolvedConflict as Record<string, unknown> | undefined;
  const severity = String(incident?.severity || 'LOW');
  const status = String(incident?.status || 'Reported');
  const stepIndex = STATUS_STEPS.indexOf(status);

  const getBorderColor = (sev: string) => {
    if (sev === 'CRITICAL') return colors.crit;
    if (sev === 'HIGH') return colors.high;
    if (sev === 'MEDIUM') return colors.med;
    return colors.low;
  };
  const sevColor = getBorderColor(severity);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <TopBar 
        title={(id as string) || 'Detail'} 
        leftIcon="back" 
        onLeftPress={() => router.back()} 
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {error && <Typography variant="body" color={colors.crit} style={{ padding: 16 }}>{error}</Typography>}
        
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.sevPill, { backgroundColor: `${sevColor}15`, borderColor: `${sevColor}30` }]}>
            <View style={[styles.sevDot, { backgroundColor: sevColor, shadowColor: sevColor, shadowOpacity: 0.8, shadowRadius: 6 }]} />
            <Typography variant="mono" style={{ fontSize: 11, fontWeight: '700', color: sevColor, textTransform: 'uppercase' }}>
              {severity} · {String(incident?.incidentType || 'Incident')}
            </Typography>
          </View>
          <Typography variant="heading" style={styles.title}>{String(incident?.title)}</Typography>
          
          <View style={styles.metaRow}>
            <View style={styles.metaTag}>
              <MapPin size={14} color={colors.textDim} strokeWidth={2} />
              <Typography variant="body" color={colors.textMuted} style={{ fontSize: 12 }}>Market Quarter (D-02)</Typography>
            </View>
            <View style={styles.metaTag}>
              <Clock size={14} color={colors.textDim} strokeWidth={2} />
              <Typography variant="body" color={colors.textMuted} style={{ fontSize: 12 }}>2 min ago</Typography>
            </View>
          </View>
        </View>

        {/* Stepper */}
        <View style={styles.sectionContainer}>
          <TimelineStepper steps={STATUS_STEPS} currentStepIndex={stepIndex >= 0 ? stepIndex : 0} />
        </View>

        {/* Classification */}
        <View style={styles.sectionContainer}>
          <Typography variant="label" color={colors.textDim} style={styles.dsecLabel}>Classification</Typography>
          <View style={styles.infoGrid}>
            <View style={styles.infoCell}>
              <Typography variant="mono" style={styles.infoCellK}>Category</Typography>
              <Typography variant="body" style={styles.infoCellV}>{String(incident?.incidentType || 'N/A')}</Typography>
            </View>
            <View style={styles.infoCell}>
              <Typography variant="mono" style={styles.infoCellK}>Source</Typography>
              <Typography variant="body" style={styles.infoCellV}>Live Feed</Typography>
            </View>
            <View style={styles.infoCell}>
              <Typography variant="mono" style={styles.infoCellK}>District</Typography>
              <Typography variant="body" style={styles.infoCellV}>D-02</Typography>
            </View>
            <View style={styles.infoCell}>
              <Typography variant="mono" style={styles.infoCellK}>Confidence</Typography>
              <Typography variant="body" style={[styles.infoCellV, { color: colors.green }]}>92%</Typography>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.sectionContainer}>
          <Typography variant="label" color={colors.textDim} style={styles.dsecLabel}>Description</Typography>
          <Typography variant="body" color={colors.textMuted} style={{ fontSize: 14, lineHeight: 22 }}>
            {String(incident?.description || 'No description provided.')}
          </Typography>
          {incident?.classificationRationale && (
            <View style={styles.rationaleBox}>
              <Typography variant="body" color={colors.low} style={{ fontSize: 12, lineHeight: 18 }}>
                <Typography variant="label" color={colors.low} style={{ fontWeight: '700' }}>AI RATIONALE: </Typography>
                {String(incident.classificationRationale)}
              </Typography>
            </View>
          )}
        </View>

        {/* Contradiction */}
        {conflict && (
          <View style={styles.sectionContainer}>
            <Typography variant="label" color={colors.textDim} style={styles.dsecLabel}>Contradiction Alert</Typography>
            <View style={styles.contraCard}>
              <View style={styles.contraHeader}>
                <AlertTriangle size={16} color={colors.crit} strokeWidth={2.5} />
                <Typography variant="body" color={colors.crit} style={{ fontSize: 13, fontWeight: '700' }}>Conflicting reports detected</Typography>
              </View>
              <View style={styles.srcRow}>
                <View style={[styles.srcBox, styles.srcA]}>
                  <Typography variant="body" style={{ fontSize: 12, fontWeight: '700' }}>Source A</Typography>
                  <Typography variant="body" color={colors.crit} style={{ fontSize: 10, marginTop: 4 }}>Reported conflicting info</Typography>
                </View>
                <View style={[styles.srcBox, styles.srcB]}>
                  <Typography variant="body" style={{ fontSize: 12, fontWeight: '700' }}>Source B</Typography>
                  <Typography variant="body" color={colors.green} style={{ fontSize: 10, marginTop: 4 }}>Reported conflicting info</Typography>
                </View>
              </View>
              <View style={styles.resBadge}>
                <Typography variant="body" color={colors.green} style={{ fontSize: 11, fontWeight: '500' }}>✓ AI resolved: {String(conflict.rationale)}</Typography>
              </View>
            </View>
          </View>
        )}

        {/* Action Chain */}
        <View style={[styles.sectionContainer, { borderBottomWidth: 0 }]}>
          <Typography variant="label" color={colors.textDim} style={styles.dsecLabel}>Agent Actions</Typography>
          <View style={styles.actionChain}>
            <View style={styles.acStep}>
              <View style={[styles.acNum, styles.acDone]}><CheckCircle2 size={14} color={colors.green} /></View>
              <View style={styles.acBody}>
                <Typography variant="body" style={styles.acName}>Classify & Triage</Typography>
                <Typography variant="body" style={styles.acDesc}>Severity confirmed · {severity}</Typography>
              </View>
            </View>
            <View style={styles.acStep}>
              <View style={[styles.acNum, styles.acAct]}><Typography variant="mono" color={colors.high} style={{ fontSize: 10, fontWeight: '700' }}>2</Typography></View>
              <View style={styles.acBody}>
                <Typography variant="body" style={styles.acName}>Notify Departments</Typography>
                <Typography variant="body" style={styles.acDesc}>Generating dispatch plans</Typography>
              </View>
            </View>
            <View style={styles.acStep}>
              <View style={styles.acNum}><Typography variant="mono" color={colors.textMuted} style={{ fontSize: 10, fontWeight: '700' }}>3</Typography></View>
              <View style={styles.acBody}>
                <Typography variant="body" style={styles.acName}>Deploy Crews</Typography>
                <Typography variant="body" style={styles.acDesc}>Pending department response</Typography>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  hero: {
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  sectionContainer: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    marginTop: 8,
  },
  sevPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    marginBottom: 12,
  },
  sevDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  metaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dsecLabel: {
    marginBottom: 16,
    fontSize: 11,
    letterSpacing: 1,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoCell: {
    width: '48%',
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border2,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  infoCellK: {
    fontSize: 10,
    color: colors.textDim,
    marginBottom: 6,
  },
  infoCellV: {
    fontSize: 13,
    fontWeight: '600',
  },
  rationaleBox: {
    marginTop: 16,
    backgroundColor: isDark ? 'rgba(14, 165, 233, 0.08)' : 'rgba(14, 165, 233, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.2)',
    borderRadius: 12,
    padding: 16,
  },
  contraCard: {
    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 16,
    padding: 16,
  },
  contraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  srcRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  srcBox: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
  },
  srcA: {
    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
  },
  srcB: {
    backgroundColor: colors.greenDim,
    borderColor: colors.greenGlow,
    borderWidth: 1,
  },
  resBadge: {
    backgroundColor: colors.greenDim,
    borderWidth: 1,
    borderColor: colors.greenGlow,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  actionChain: {
    flexDirection: 'column',
    backgroundColor: colors.surface2,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border2,
  },
  acStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingVertical: 12,
  },
  acNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface3,
    borderWidth: 1.5,
    borderColor: colors.border2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acDone: {
    backgroundColor: colors.greenDim,
    borderColor: colors.green,
  },
  acAct: {
    backgroundColor: isDark ? 'rgba(249, 115, 22, 0.15)' : 'rgba(249, 115, 22, 0.2)',
    borderColor: colors.high,
  },
  acBody: {
    flex: 1,
  },
  acName: {
    fontSize: 14,
    fontWeight: '600',
  },
  acDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
});

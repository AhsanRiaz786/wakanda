import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { MapPin, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react-native';

import { api } from '@/src/lib/api';
import { theme } from '../../constants/theme';
import { TopBar } from '../../components/TopBar';
import { Typography } from '../../components/Typography';
import { TimelineStepper } from '../../components/TimelineStepper';

const STATUS_STEPS = ['Reported', 'Triaged', 'Assigned', 'In Progress', 'Resolved'];

export default function IncidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [incident, setIncident] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .getIncident(id)
      .then(setIncident)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'));
  }, [id]);

  if (!incident && !error) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.surface, justifyContent: 'center' }}>
        <ActivityIndicator color={theme.colors.green} />
      </View>
    );
  }

  const conflict = incident?.resolvedConflict as Record<string, unknown> | undefined;
  const severity = String(incident?.severity || 'LOW');
  const status = String(incident?.status || 'Reported');
  const stepIndex = STATUS_STEPS.indexOf(status);

  const getBorderColor = (sev: string) => {
    if (sev === 'CRITICAL') return theme.colors.crit;
    if (sev === 'HIGH') return theme.colors.high;
    if (sev === 'MEDIUM') return theme.colors.med;
    return theme.colors.low;
  };
  const sevColor = getBorderColor(severity);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <TopBar 
        title={id || 'Detail'} 
        leftIcon="back" 
        onLeftPress={() => router.back()} 
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {error && <Typography variant="body" color={theme.colors.crit} style={{ padding: 16 }}>{error}</Typography>}
        
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.sevPill, { backgroundColor: `${sevColor}15`, borderColor: `${sevColor}40` }]}>
            <View style={[styles.sevDot, { backgroundColor: sevColor }]} />
            <Typography variant="mono" style={{ fontSize: 10, fontWeight: '700', color: sevColor, textTransform: 'uppercase' }}>
              {severity} · {String(incident?.incidentType || 'Incident')}
            </Typography>
          </View>
          <Typography variant="heading" style={styles.title}>{String(incident?.title)}</Typography>
          
          <View style={styles.metaRow}>
            <View style={styles.metaTag}>
              <MapPin size={12} color={theme.colors.textDim} strokeWidth={2} />
              <Typography variant="body" color={theme.colors.textMuted} style={{ fontSize: 10 }}>Market Quarter (D-02)</Typography>
            </View>
            <View style={styles.metaTag}>
              <Clock size={12} color={theme.colors.textDim} strokeWidth={2} />
              <Typography variant="body" color={theme.colors.textMuted} style={{ fontSize: 10 }}>2 min ago</Typography>
            </View>
          </View>
        </View>

        {/* Stepper */}
        <TimelineStepper steps={STATUS_STEPS} currentStepIndex={stepIndex >= 0 ? stepIndex : 0} />

        {/* Classification */}
        <View style={styles.dsec}>
          <Typography variant="label" color={theme.colors.textDim} style={styles.dsecLabel}>Classification</Typography>
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
              <Typography variant="body" style={[styles.infoCellV, { color: theme.colors.green }]}>92%</Typography>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.dsec}>
          <Typography variant="label" color={theme.colors.textDim} style={styles.dsecLabel}>Description</Typography>
          <Typography variant="body" color={theme.colors.textMuted} style={{ fontSize: 12, lineHeight: 18 }}>
            {String(incident?.description || 'No description provided.')}
          </Typography>
          {incident?.classificationRationale && (
            <View style={styles.rationaleBox}>
              <Typography variant="body" color={theme.colors.low} style={{ fontSize: 11, lineHeight: 16 }}>
                <Typography variant="label" color={theme.colors.low} style={{ fontWeight: '700' }}>AI RATIONALE: </Typography>
                {String(incident.classificationRationale)}
              </Typography>
            </View>
          )}
        </View>

        {/* Contradiction */}
        {conflict && (
          <View style={styles.dsec}>
            <Typography variant="label" color={theme.colors.textDim} style={styles.dsecLabel}>Contradiction Alert</Typography>
            <View style={styles.contraCard}>
              <View style={styles.contraHeader}>
                <AlertTriangle size={14} color={theme.colors.crit} strokeWidth={2.5} />
                <Typography variant="body" color={theme.colors.crit} style={{ fontSize: 11, fontWeight: '700' }}>Conflicting reports detected</Typography>
              </View>
              <View style={styles.srcRow}>
                <View style={[styles.srcBox, styles.srcA]}>
                  <Typography variant="body" style={{ fontSize: 11, fontWeight: '700' }}>Source A</Typography>
                  <Typography variant="body" color={theme.colors.crit} style={{ fontSize: 9, marginTop: 4 }}>Reported conflicting info</Typography>
                </View>
                <View style={[styles.srcBox, styles.srcB]}>
                  <Typography variant="body" style={{ fontSize: 11, fontWeight: '700' }}>Source B</Typography>
                  <Typography variant="body" color={theme.colors.green} style={{ fontSize: 9, marginTop: 4 }}>Reported conflicting info</Typography>
                </View>
              </View>
              <View style={styles.resBadge}>
                <Typography variant="body" color={theme.colors.green} style={{ fontSize: 10 }}>✓ AI resolved: {String(conflict.rationale)}</Typography>
              </View>
            </View>
          </View>
        )}

        {/* Action Chain */}
        <View style={[styles.dsec, { borderBottomWidth: 0 }]}>
          <Typography variant="label" color={theme.colors.textDim} style={styles.dsecLabel}>Agent Actions</Typography>
          <View style={styles.actionChain}>
            <View style={styles.acStep}>
              <View style={[styles.acNum, styles.acDone]}><CheckCircle2 size={12} color={theme.colors.green} /></View>
              <View style={styles.acBody}>
                <Typography variant="body" style={styles.acName}>Classify & Triage</Typography>
                <Typography variant="body" style={styles.acDesc}>Severity confirmed · {severity}</Typography>
              </View>
            </View>
            <View style={styles.acStep}>
              <View style={[styles.acNum, styles.acAct]}><Typography variant="mono" color={theme.colors.high} style={{ fontSize: 9, fontWeight: '700' }}>2</Typography></View>
              <View style={styles.acBody}>
                <Typography variant="body" style={styles.acName}>Notify Departments</Typography>
                <Typography variant="body" style={styles.acDesc}>Generating dispatch plans</Typography>
              </View>
            </View>
            <View style={styles.acStep}>
              <View style={styles.acNum}><Typography variant="mono" color={theme.colors.textMuted} style={{ fontSize: 9, fontWeight: '700' }}>3</Typography></View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  hero: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: 'rgba(255,71,87,0.02)', // slight tint
  },
  sevPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    marginBottom: 10,
  },
  sevDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dsec: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dsecLabel: {
    marginBottom: 10,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  infoCell: {
    width: '48%',
    backgroundColor: theme.colors.surface2,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  infoCellK: {
    fontSize: 9,
    color: theme.colors.textDim,
    marginBottom: 3,
  },
  infoCellV: {
    fontSize: 11,
    fontWeight: '600',
  },
  rationaleBox: {
    marginTop: 10,
    backgroundColor: 'rgba(76,201,240,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(76,201,240,0.2)',
    borderRadius: 8,
    padding: 10,
  },
  contraCard: {
    backgroundColor: 'rgba(255,71,87,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,71,87,0.2)',
    borderRadius: 14,
    padding: 12,
  },
  contraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  srcRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  srcBox: {
    flex: 1,
    borderRadius: 10,
    padding: 8,
  },
  srcA: {
    backgroundColor: 'rgba(255,71,87,0.06)',
    borderColor: 'rgba(255,71,87,0.18)',
    borderWidth: 1,
  },
  srcB: {
    backgroundColor: 'rgba(0,214,143,0.05)',
    borderColor: 'rgba(0,214,143,0.18)',
    borderWidth: 1,
  },
  resBadge: {
    backgroundColor: 'rgba(0,214,143,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,214,143,0.25)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  actionChain: {
    flexDirection: 'column',
  },
  acStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
  },
  acNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.surface2,
    borderWidth: 1.5,
    borderColor: theme.colors.border2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  acDone: {
    backgroundColor: 'rgba(0,214,143,0.1)',
    borderColor: theme.colors.green,
  },
  acAct: {
    backgroundColor: 'rgba(255,140,66,0.1)',
    borderColor: theme.colors.high,
  },
  acBody: {
    flex: 1,
  },
  acName: {
    fontSize: 12,
    fontWeight: '600',
  },
  acDesc: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
});

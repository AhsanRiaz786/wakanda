import { useEffect, useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, View, Pressable,
  Modal, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  MapPin, Clock, AlertTriangle, CheckCircle2, Zap, Bell,
  Users, Navigation, Edit3, Trash2,
} from 'lucide-react-native';

import { api } from '@/src/lib/api';
import { useAppTheme } from '../../hooks/useAppTheme';
import { TopBar } from '../../components/TopBar';
import { Typography } from '../../components/Typography';
import { TimelineStepper } from '../../components/TimelineStepper';
import { NotificationPanel } from '../../components/NotificationPanel';
import { useStatus } from '../../contexts/StatusContext';

const STATUS_STEPS = ['Reported', 'Triaged', 'Assigned', 'In Progress', 'Resolved'];

export default function IncidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors, isDark);
  const { showStatus } = useStatus();

  const [incident, setIncident] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notifVisible, setNotifVisible] = useState(false);

  // Edit state
  const [editVisible, setEditVisible] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editSeverity, setEditSeverity] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Delete state
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openEdit = () => {
    if (!incident) return;
    setEditTitle(String(incident.title || ''));
    setEditDesc(String(incident.description || ''));
    setEditSeverity(String(incident.severity || 'low'));
    setEditStatus(String(incident.status || 'reported'));
    setEditVisible(true);
  };

  const saveEdit = async () => {
    if (!id) return;
    setEditSaving(true);
    const sid = showStatus({ type: 'loading', label: 'Saving...', duration: 0 });
    try {
      const updated = await api.updateIncident(id as string, {
        title: editTitle.trim() || undefined,
        description: editDesc.trim() || undefined,
        severity: editSeverity || undefined,
        status: editStatus || undefined,
      });
      setIncident(updated);
      setEditVisible(false);
      showStatus({ id: sid, type: 'success', label: 'Incident Updated', duration: 3000 });
    } catch (e) {
      showStatus({ id: sid, type: 'error', label: 'Update Failed', duration: 4000 });
    } finally {
      setEditSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!id) return;
    setDeleteLoading(true);
    const sid = showStatus({ type: 'loading', label: 'Deleting...', duration: 0 });
    try {
      await api.deleteIncident(id as string);
      setDeleteVisible(false);
      showStatus({ id: sid, type: 'success', label: 'Incident Deleted', duration: 3000 });
      router.back();
    } catch (e) {
      showStatus({ id: sid, type: 'error', label: 'Delete Failed', duration: 4000 });
    } finally {
      setDeleteLoading(false);
    }
  };

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
        title={(id as string)?.split('-')[0] || 'Detail'}
        leftIcon="back"
        onLeftPress={() => router.back()}
        rightIcon="bell"
        onRightPress={() => setNotifVisible(true)}
      />
      <NotificationPanel visible={notifVisible} onClose={() => setNotifVisible(false)} />

      {/* Edit + Delete action bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.editBtn} onPress={openEdit} activeOpacity={0.8}>
          <Edit3 size={15} color={colors.green} />
          <Typography variant="body" color={colors.green} style={{ fontSize: 13, fontWeight: '600' }}>
            Edit
          </Typography>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => setDeleteVisible(true)} activeOpacity={0.8}>
          <Trash2 size={15} color={colors.crit} />
          <Typography variant="body" color={colors.crit} style={{ fontSize: 13, fontWeight: '600' }}>
            Delete
          </Typography>
        </TouchableOpacity>
      </View>

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
              <Typography variant="body" color={colors.textMuted} style={{ fontSize: 12 }}>
                {(incident?.coordinates as any)?.lat
                  ? `${((incident?.coordinates as any)?.lat as number).toFixed(4)}°N, ${((incident?.coordinates as any)?.lng as number).toFixed(4)}°E`
                  : 'Location unspecified'}
              </Typography>
            </View>
            <View style={styles.metaTag}>
              <Clock size={14} color={colors.textDim} strokeWidth={2} />
              <Typography variant="body" color={colors.textMuted} style={{ fontSize: 12 }}>
                {incident?.createdAt
                  ? new Date(String(incident.createdAt)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Unknown time'}
              </Typography>
            </View>
          </View>
        </View>

        {/* Stepper — pass rawStatus for case-insensitive matching */}
        <View style={styles.sectionContainer}>
          <TimelineStepper
            steps={STATUS_STEPS}
            currentStepIndex={0}
            rawStatus={status}
          />
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
              <Typography variant="body" style={styles.infoCellV}>
                {String(incident?.sourceLabel || incident?.sourceType || 'Live Feed').replace('_', ' ')}
              </Typography>
            </View>
            <View style={styles.infoCell}>
              <Typography variant="mono" style={styles.infoCellK}>District</Typography>
              <Typography variant="body" style={styles.infoCellV}>
                {(incident?.coordinates as any)?.lat
                  ? `${((incident?.coordinates as any)?.lat as number).toFixed(2)}°N`
                  : 'Islamabad'}
              </Typography>
            </View>
            <View style={styles.infoCell}>
              <Typography variant="mono" style={styles.infoCellK}>Confidence</Typography>
              <Typography variant="body" style={[styles.infoCellV, { color: colors.green }]}>
                {incident?.urgencyScore ? `${incident.urgencyScore}/10` : 'N/A'}
              </Typography>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.sectionContainer}>
          <Typography variant="label" color={colors.textDim} style={styles.dsecLabel}>Description</Typography>
          <Typography variant="body" color={colors.textMuted} style={{ fontSize: 14, lineHeight: 22 }}>
            {String(incident?.description || 'No description provided.')}
          </Typography>
          {!!incident?.classificationRationale && (
            <View style={styles.rationaleBox}>
              <Typography variant="body" color={colors.low} style={{ fontSize: 12, lineHeight: 18 }}>
                <Typography variant="label" color={colors.low} style={{ fontWeight: '700' }}>AI RATIONALE: </Typography>
                {String(incident?.classificationRationale)}
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

        {/* Action Chain — dynamic from API */}
        <View style={[styles.sectionContainer, { borderBottomWidth: 0 }]}>
          <Typography variant="label" color={colors.textDim} style={styles.dsecLabel}>Agent Actions</Typography>
          <View style={styles.actionChain}>
            {(incident?.actionChain as any[] || []).length > 0
              ? (incident!.actionChain as any[]).map((step: any, idx: number) => {
                  const chainArr = incident!.actionChain as any[];
                  const isLast = idx === chainArr.length - 1;
                  const isDoneStep = ['completed', 'done', 'success'].includes((step.status || '').toLowerCase());
                  const isActiveStep = !isDoneStep && idx === 0;
                  const typeStr = (step.type || step.stepType || '').toLowerCase();
                  let StepIcon: any = CheckCircle2;
                  if (typeStr.includes('notify') || typeStr.includes('department')) StepIcon = Bell;
                  else if (typeStr.includes('dispatch') || typeStr.includes('crew')) StepIcon = Users;
                  else if (typeStr.includes('road') || typeStr.includes('navigate')) StepIcon = Navigation;
                  else if (typeStr.includes('validate')) StepIcon = Zap;
                  return (
                    <View key={idx} style={[styles.acStep, !isLast && styles.acStepBorder]}>
                      <View style={[styles.acNum, isDoneStep && styles.acDone, isActiveStep && styles.acAct]}>
                        {isDoneStep
                          ? <CheckCircle2 size={14} color={colors.green} />
                          : <StepIcon size={14} color={isActiveStep ? colors.high : colors.textMuted} />}
                      </View>
                      <View style={styles.acBody}>
                        <Typography variant="body" style={styles.acName}>
                          {step.name || step.action || `Step ${idx + 1}`}
                        </Typography>
                        {step.description && (
                          <Typography variant="body" style={styles.acDesc}>{step.description}</Typography>
                        )}
                        {step.department && (
                          <View style={styles.acDeptPill}>
                            <Typography variant="mono" color={colors.low} style={{ fontSize: 10 }}>
                              {step.department}
                            </Typography>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })
              : (
                <View style={{ padding: 16, alignItems: 'center' }}>
                  <Typography variant="body" color={colors.textMuted} style={{ fontSize: 13, textAlign: 'center' }}>
                    {'No agent actions yet.\nRun the Autonomous Plan from the Map Dashboard.'}
                  </Typography>
                </View>
              )
            }
          </View>
        </View>

      </ScrollView>

      {/* ── Edit Bottom Sheet ──────────────────────────────── */}
      <Modal
        visible={editVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <Pressable style={{ flex: 1 }} onPress={() => setEditVisible(false)} />
          <View style={styles.editSheet}>
            <View style={styles.sheetHandle} />
            <Typography variant="heading" style={styles.sheetTitle}>Edit Incident</Typography>

            <Typography variant="label" color={colors.textDim} style={styles.fieldLabel}>TITLE</Typography>
            <TextInput
              style={styles.fieldInput}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Incident title..."
              placeholderTextColor={colors.textDim}
            />

            <Typography variant="label" color={colors.textDim} style={styles.fieldLabel}>DESCRIPTION</Typography>
            <TextInput
              style={[styles.fieldInput, { height: 90, textAlignVertical: 'top' }]}
              value={editDesc}
              onChangeText={setEditDesc}
              placeholder="Description..."
              placeholderTextColor={colors.textDim}
              multiline
            />

            <Typography variant="label" color={colors.textDim} style={styles.fieldLabel}>SEVERITY</Typography>
            <View style={styles.chipRow}>
              {['low', 'medium', 'high', 'critical'].map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.sevChip, editSeverity === s && styles.sevChipActive]}
                  onPress={() => setEditSeverity(s)}
                >
                  <Typography variant="mono" style={{ fontSize: 11, fontWeight: '700' }}
                    color={editSeverity === s ? colors.green : colors.textDim}>
                    {s.toUpperCase()}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>

            <Typography variant="label" color={colors.textDim} style={styles.fieldLabel}>STATUS</Typography>
            <View style={styles.chipRow}>
              {['reported', 'triaged', 'assigned', 'in_progress', 'resolved'].map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.sevChip, editStatus === s && styles.sevChipActive]}
                  onPress={() => setEditStatus(s)}
                >
                  <Typography variant="mono" style={{ fontSize: 10, fontWeight: '700' }}
                    color={editStatus === s ? colors.green : colors.textDim}>
                    {s.replace('_', ' ').toUpperCase()}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, editSaving && { opacity: 0.6 }]}
              onPress={saveEdit}
              disabled={editSaving}
              activeOpacity={0.85}
            >
              {editSaving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Typography variant="heading" color="#fff" style={{ fontSize: 15 }}>Save Changes</Typography>
              }
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Delete Confirmation ────────────────────────────── */}
      <Modal
        visible={deleteVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setDeleteVisible(false)}
      >
        <View style={styles.deleteBackdrop}>
          <View style={styles.deleteCard}>
            <View style={styles.deleteIconBox}>
              <Trash2 size={28} color={colors.crit} />
            </View>
            <Typography variant="heading" style={{ fontSize: 18, marginTop: 16, textAlign: 'center' }}>
              Delete Incident?
            </Typography>
            <Typography variant="body" color={colors.textMuted}
              style={{ fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
              This will permanently remove the incident from the system. This action cannot be undone.
            </Typography>
            <View style={styles.deleteActions}>
              <TouchableOpacity
                style={styles.cancelActionBtn}
                onPress={() => setDeleteVisible(false)}
                activeOpacity={0.8}
              >
                <Typography variant="body" color={colors.text} style={{ fontWeight: '600' }}>Cancel</Typography>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmDeleteBtn, deleteLoading && { opacity: 0.6 }]}
                onPress={confirmDelete}
                disabled={deleteLoading}
                activeOpacity={0.85}
              >
                {deleteLoading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Typography variant="heading" color="#fff" style={{ fontSize: 14 }}>Delete</Typography>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  acStepBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  acDeptPill: {
    marginTop: 6,
    backgroundColor: 'rgba(76,201,240,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(76,201,240,0.2)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  // ── Action Bar ───────────────────────────────────────────
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: colors.greenDim,
    borderWidth: 1,
    borderColor: colors.greenGlow,
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : '#FEF2F2',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(239,68,68,0.25)' : '#FECACA',
  },
  // ── Edit Sheet ───────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  editSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border2,
    padding: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: isDark ? 0.4 : 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 16,
  },
  fieldInput: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border2,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 14,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sevChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border2,
    backgroundColor: colors.surface2,
  },
  sevChipActive: {
    backgroundColor: colors.greenDim,
    borderColor: colors.greenGlow,
  },
  saveBtn: {
    backgroundColor: colors.green,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  // ── Delete Modal ─────────────────────────────────────────
  deleteBackdrop: {
    flex: 1,
    backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  deleteCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border2,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: isDark ? 0.5 : 0.2,
    shadowRadius: 20,
    elevation: 16,
  },
  deleteIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#FEF2F2',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(239,68,68,0.3)' : '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    width: '100%',
  },
  cancelActionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border2,
  },
  confirmDeleteBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: colors.crit,
    shadowColor: colors.crit,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});

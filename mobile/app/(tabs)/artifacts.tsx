import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { theme } from '../../constants/theme';
import { TopBar } from '../../components/TopBar';
import { Typography } from '../../components/Typography';
import { FileCode, FileText, ChevronRight, CheckCircle2 } from 'lucide-react-native';

export default function ArtifactsScreen() {
  const artifacts = [
    {
      id: 'task',
      title: 'task.md',
      type: 'markdown',
      desc: 'Antigravity core task formulation',
      status: 'verified',
    },
    {
      id: 'implementation',
      title: 'implementation_plan.md',
      type: 'markdown',
      desc: 'Step-by-step LangGraph & UI plan',
      status: 'verified',
    },
    {
      id: 'walkthrough',
      title: 'walkthrough.md',
      type: 'markdown',
      desc: 'Reasoning traces & tool execution',
      status: 'verified',
    },
    {
      id: 'trace',
      title: 'demo-trace-S03.json',
      type: 'json',
      desc: 'Raw runtime trace with contradictions',
      status: 'verified',
    }
  ];

  return (
    <View style={styles.container}>
      <TopBar title="Antigravity Artifacts" />

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Typography variant="body" color={theme.colors.textMuted} style={styles.description}>
            This screen surfaces the verifiable Antigravity IDE artifacts (A1–A4) as required by the hackathon rubric. These documents prove the agent workflows were developed using the Antigravity IDE.
          </Typography>
        </View>

        <View style={styles.sectionContainer}>
          <Typography variant="label" color={theme.colors.textDim} style={styles.sectionLabel}>
            DOCS / ANTIGRAVITY /
          </Typography>

          {artifacts.map((doc, idx) => (
            <TouchableOpacity key={doc.id} style={[styles.docCard, idx === 0 && { borderTopWidth: 0 }]}>
              <View style={styles.docIcon}>
                {doc.type === 'json' ? (
                  <FileCode size={20} color={theme.colors.low} />
                ) : (
                  <FileText size={20} color={theme.colors.high} />
                )}
              </View>
              
              <View style={styles.docInfo}>
                <Typography variant="body" style={styles.docTitle}>{doc.title}</Typography>
                <Typography variant="body" color={theme.colors.textMuted} style={styles.docDesc}>
                  {doc.desc}
                </Typography>
                <View style={styles.statusRow}>
                  <CheckCircle2 size={12} color={theme.colors.green} />
                  <Typography variant="mono" color={theme.colors.green} style={{ fontSize: 10, marginLeft: 4 }}>
                    {doc.status.toUpperCase()}
                  </Typography>
                </View>
              </View>

              <ChevronRight size={16} color={theme.colors.textDim} />
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.footerInfo}>
          <Typography variant="mono" color={theme.colors.textDim} style={{ fontSize: 10, textAlign: 'center' }}>
            Built with Google Antigravity
          </Typography>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
  },
  sectionContainer: {
    marginTop: 8,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  sectionLabel: {
    marginBottom: 16,
    letterSpacing: 1.5,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border2,
  },
  docIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  docInfo: {
    flex: 1,
    paddingHorizontal: 16,
  },
  docTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  docDesc: {
    fontSize: 13,
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerInfo: {
    padding: 32,
    alignItems: 'center',
  }
});

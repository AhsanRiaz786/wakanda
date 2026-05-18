import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Typography } from './Typography';
import { useAppTheme } from '../hooks/useAppTheme';
import { Terminal } from 'lucide-react-native';

interface AgentTraceBoxProps {
  logs: string[];
}

export function AgentTraceBox({ logs }: AgentTraceBoxProps) {
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors, isDark);
  
  const [displayedLogs, setDisplayedLogs] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < logs.length) {
      const timer = setTimeout(() => {
        setDisplayedLogs((prev) => [...prev, logs[currentIndex]]);
        setCurrentIndex((prev) => prev + 1);
      }, 800); 
      return () => clearTimeout(timer);
    }
  }, [logs, currentIndex]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Terminal size={14} color={colors.green} />
        <Typography variant="label" color={colors.green} style={styles.title}>
          AGENT THOUGHT PROCESS
        </Typography>
      </View>
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {displayedLogs.map((log, i) => (
          <Typography key={i} variant="mono" color={colors.text} style={styles.logText}>
            {'>'} {log}
          </Typography>
        ))}
        {currentIndex < logs.length && (
          <Typography variant="mono" color={colors.textDim} style={styles.typingIndicator}>
            {'>'} _
          </Typography>
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: isDark ? '#0d0d0d' : '#1e1e1e',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border2,
      marginVertical: 12,
      overflow: 'hidden',
      height: 150,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: isDark ? '#1a1a1a' : '#2d2d2d',
      borderBottomWidth: 1,
      borderBottomColor: colors.border2,
      gap: 6,
    },
    title: {
      fontSize: 10,
      letterSpacing: 1.2,
      fontWeight: 'bold',
    },
    scrollArea: {
      flex: 1,
      padding: 12,
    },
    scrollContent: {
      paddingBottom: 16,
    },
    logText: {
      fontSize: 12,
      lineHeight: 18,
      marginBottom: 6,
      color: '#00FF00',
    },
    typingIndicator: {
      fontSize: 12,
      lineHeight: 18,
      color: '#555',
    },
  });

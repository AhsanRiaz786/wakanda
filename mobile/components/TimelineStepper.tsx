import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from './Typography';
import { useAppTheme } from '../hooks/useAppTheme';

interface StepperProps {
  steps: string[];
  currentStepIndex: number; // 0-indexed
  /** Pass the raw status from the backend — will be matched case-insensitively */
  rawStatus?: string;
}

export function TimelineStepper({ steps, currentStepIndex, rawStatus }: StepperProps) {
  // If rawStatus provided, find the matching step index case-insensitively
  const resolvedIndex = rawStatus != null
    ? steps.findIndex(s => s.toLowerCase() === rawStatus.toLowerCase().replace('_', ' '))
    : currentStepIndex;
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors, isDark);

  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const activeIdx = resolvedIndex >= 0 ? resolvedIndex : currentStepIndex;
        const isDone = index < activeIdx;
        const isActive = index === activeIdx;
        const isPending = index > activeIdx;
        const isLast = index === steps.length - 1;

        let circleBg = colors.surface3;
        let circleColor = colors.textDim;
        let circleBorder = colors.border2;
        let lineBg = colors.border;

        if (isDone) {
          circleBg = colors.green;
          circleColor = colors.greenSoft;
          circleBorder = colors.green;
          lineBg = colors.green;
        } else if (isActive) {
          circleBg = colors.high;
          circleColor = '#fff';
          circleBorder = colors.high;
        }

        return (
          <View key={step} style={styles.step}>
            <View style={[styles.circle, { backgroundColor: circleBg, borderColor: circleBorder }]}>
              <Typography variant="mono" style={{ fontSize: 9, fontWeight: '700', color: circleColor }}>
                {isDone ? '✓' : (index + 1).toString()}
              </Typography>
            </View>
            {!isLast && <View style={[styles.line, { backgroundColor: lineBg }]} />}
            <Typography variant="body" style={styles.label}>{step}</Typography>
          </View>
        );
      })}
    </View>
  );
}

const makeStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  step: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
    position: 'relative',
  },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    zIndex: 2,
  },
  line: {
    position: 'absolute',
    top: 11,
    left: '50%',
    width: '100%',
    height: 2,
    zIndex: 1,
  },
  label: {
    fontSize: 8,
    color: colors.textDim,
    textAlign: 'center',
    fontWeight: '500',
  },
});

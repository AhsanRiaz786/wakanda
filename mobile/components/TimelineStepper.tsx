import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from './Typography';
import { theme } from '../constants/theme';

interface StepperProps {
  steps: string[];
  currentStepIndex: number; // 0-indexed
}

export function TimelineStepper({ steps, currentStepIndex }: StepperProps) {
  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isDone = index < currentStepIndex;
        const isActive = index === currentStepIndex;
        const isPending = index > currentStepIndex;
        const isLast = index === steps.length - 1;

        let circleBg = theme.colors.surface3;
        let circleColor = theme.colors.textDim;
        let circleBorder = theme.colors.border2;
        let lineBg = theme.colors.border;

        if (isDone) {
          circleBg = theme.colors.green;
          circleColor = theme.colors.greenSoft;
          circleBorder = theme.colors.green;
          lineBg = theme.colors.green;
        } else if (isActive) {
          circleBg = theme.colors.high;
          circleColor = '#fff';
          circleBorder = theme.colors.high;
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
    right: '-50%',
    height: 2,
    zIndex: 1,
  },
  label: {
    fontSize: 8,
    color: theme.colors.textDim,
    textAlign: 'center',
    fontWeight: '500',
  },
});

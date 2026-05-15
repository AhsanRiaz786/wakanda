import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

interface TypographyProps extends TextProps {
  variant?: 'title' | 'subtitle' | 'heading' | 'body' | 'label' | 'mono';
  color?: string;
  weight?: '400' | '500' | '600' | '700' | '800';
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

export function Typography({
  variant = 'body',
  color = theme.colors.text,
  weight,
  align,
  style,
  ...props
}: TypographyProps) {
  return (
    <Text
      style={[
        styles[variant],
        { color },
        weight && { fontWeight: weight },
        align && { textAlign: align },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: theme.typography.heading.fontFamily,
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  heading: {
    fontFamily: theme.typography.heading.fontFamily,
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 16,
    fontWeight: '600',
  },
  body: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 14,
    fontWeight: '400',
  },
  label: {
    fontFamily: theme.typography.mono.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  mono: {
    fontFamily: theme.typography.mono.fontFamily,
    fontSize: 11,
    fontWeight: '500',
  },
});

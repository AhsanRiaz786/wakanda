import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';

interface TypographyProps extends TextProps {
  variant?: 'title' | 'subtitle' | 'heading' | 'body' | 'label' | 'mono';
  color?: string;
  weight?: '400' | '500' | '600' | '700' | '800';
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

export function Typography({
  variant = 'body',
  color,
  weight,
  align,
  style,
  ...props
}: TypographyProps) {
  const { colors } = useAppTheme();
  const finalColor = color || colors.text;

  return (
    <Text
      style={[
        styles[variant],
        { color: finalColor },
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
    fontFamily: 'System',
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  heading: {
    fontFamily: 'System',
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '600',
  },
  body: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '400',
  },
  label: {
    fontFamily: 'System',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  mono: {
    fontFamily: 'Courier',
    fontSize: 11,
    fontWeight: '500',
  },
});

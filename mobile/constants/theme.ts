export const darkColors = {
  green: '#10B981', // Original dark mode green
  greenSoft: '#D1FAE5',
  greenDeep: '#047857',
  greenDim: 'rgba(16, 185, 129, 0.15)',
  greenGlow: 'rgba(16, 185, 129, 0.3)',
  bg: '#09090B',
  surface: '#18181B',
  surface2: '#27272A',
  surface3: '#3F3F46',
  border: 'rgba(255,255,255,0.08)',
  border2: 'rgba(255,255,255,0.15)',
  text: '#FAFAFA',
  textMuted: '#A1A1AA',
  textDim: '#71717A',
  crit: '#EF4444',
  high: '#F97316',
  med: '#EAB308',
  low: '#0EA5E9',
  resolve: '#10B981',
};

export const lightColors = {
  green: '#1FB55E',
  greenSoft: '#DCFFE7',
  greenDeep: '#09823F',
  greenDim: 'rgba(31, 181, 94, 0.15)',
  greenGlow: 'rgba(31, 181, 94, 0.3)',
  bg: '#F9FAFB',
  surface: '#FFFFFF',
  surface2: '#F3F4F6',
  surface3: '#E5E7EB',
  border: 'rgba(0,0,0,0.08)',
  border2: 'rgba(0,0,0,0.15)',
  text: '#111827',
  textMuted: '#4B5563',
  textDim: '#6B7280',
  crit: '#EF4444',
  high: '#F97316',
  med: '#EAB308',
  low: '#0EA5E9',
  resolve: '#1FB55E',
};

// Keep the old theme.colors as darkColors for fallback where refactoring isn't done yet
export const theme = {
  colors: darkColors,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    heading: {
      fontFamily: 'System',
      fontWeight: '700' as const,
    },
    body: {
      fontFamily: 'System',
    },
    mono: {
      fontFamily: 'System',
    }
  }
};

export const spacing = theme.spacing;
export const typography = theme.typography;

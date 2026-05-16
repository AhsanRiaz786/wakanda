export const theme = {
  colors: {
    green: '#10B981',
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
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    // Note: We'll use system fonts or Expo Google Fonts later, mapping here logically
    heading: {
      fontFamily: 'System', // Would be Syne if loaded
      fontWeight: '700' as const,
    },
    body: {
      fontFamily: 'System', // Would be Inter
    },
    mono: {
      fontFamily: 'System', // Would be JetBrains Mono, or Platform.OS === 'ios' ? 'Menlo' : 'monospace'
    }
  }
};

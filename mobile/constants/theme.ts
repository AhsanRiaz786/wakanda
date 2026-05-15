export const theme = {
  colors: {
    green: '#00D68F',
    greenDim: 'rgba(0,214,143,0.12)',
    greenGlow: 'rgba(0,214,143,0.25)',
    bg: '#060A0C',
    surface: '#0D1419',
    surface2: '#131C22',
    surface3: '#1A2630',
    border: 'rgba(255,255,255,0.07)',
    border2: 'rgba(255,255,255,0.12)',
    text: '#F0F4F3',
    textMuted: '#6B8080',
    textDim: '#3D5555',
    crit: '#FF4757',
    high: '#FF8C42',
    med: '#FFD60A',
    low: '#4CC9F0',
    resolve: '#00D68F',
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

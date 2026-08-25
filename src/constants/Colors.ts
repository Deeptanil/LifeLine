export const DarkColors = {
  // Backgrounds
  navy: '#0A1628',
  navy2: '#0F1F3D',
  navy3: '#162849',
  navy4: '#1E3562',
  // Accent
  red: '#E8293A',
  redDark: '#C01E2C',
  redGlow: 'rgba(232,41,58,0.18)',
  teal: '#00C9A7',
  amber: '#F59E0B',
  // Text
  textMain: '#F0F4FF',
  textMuted: '#8A9DC9',
  textDim: '#4E6190',
  // Cards
  cardBg: '#0F1F3D',
  cardBorder: 'rgba(255,255,255,0.07)',
  success: '#22C55E',
  white: '#FFFFFF',
  // Status bar
  statusBarStyle: 'light-content' as 'light-content' | 'dark-content',
};

export const LightColors = {
  // Backgrounds
  navy: '#F0F4FF',
  navy2: '#FFFFFF',
  navy3: '#E8EDF8',
  navy4: '#D5DEED',
  // Accent — same vibrancy
  red: '#D92233',
  redDark: '#B81B2A',
  redGlow: 'rgba(217,34,51,0.12)',
  teal: '#009E85',
  amber: '#D97706',
  // Text
  textMain: '#0D1B36',
  textMuted: '#4A6080',
  textDim: '#8A9DC9',
  // Cards
  cardBg: '#FFFFFF',
  cardBorder: 'rgba(0,0,0,0.08)',
  success: '#16A34A',
  white: '#FFFFFF',
  // Status bar
  statusBarStyle: 'dark-content' as 'light-content' | 'dark-content',
};

// Legacy alias — dark by default so existing hardcoded references don't crash
export const Colors = DarkColors;

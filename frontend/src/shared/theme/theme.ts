import { createTheme } from '@mui/material/styles';

const primary = '#5b5ce2';

export function buildTheme(mode: 'light' | 'dark') {
  const isDark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      primary: {
        main: primary,
        dark: '#4546c7',
        light: '#8183f0',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#14b8a6',
        dark: '#0f766e',
        light: '#5eead4',
      },
      error: { main: '#ef4444' },
      warning: { main: '#f59e0b' },
      info: { main: '#3b82f6' },
      success: { main: '#22c55e' },
      background: {
        default: isDark ? '#0f1020' : '#f4f5fb',
        paper: isDark ? '#181a2e' : '#ffffff',
      },
      text: {
        primary: isDark ? '#eef0ff' : '#1e1f36',
        secondary: isDark ? '#a4a8c4' : '#6b6f8c',
      },
      divider: isDark ? 'rgba(238,240,255,0.08)' : 'rgba(30,31,54,0.06)',
    },
    typography: {
      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
      h1: { fontWeight: 800, letterSpacing: '-0.03em' },
      h2: { fontWeight: 800, letterSpacing: '-0.03em' },
      h3: { fontWeight: 800, letterSpacing: '-0.02em' },
      h4: { fontWeight: 700, letterSpacing: '-0.02em' },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
      button: { fontWeight: 700 },
      overline: { fontWeight: 700, letterSpacing: '0.06em' },
    },
    shape: { borderRadius: 14 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 12,
            paddingInline: 18,
            boxShadow: 'none',
          },
          containedPrimary: {
            background: primary,
            '&:hover': {
              background: '#4546c7',
              boxShadow: '0 8px 20px rgba(91, 92, 226, 0.35)',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600 },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },
      MuiTextField: {
        defaultProps: { variant: 'outlined' },
      },
    },
  });
}

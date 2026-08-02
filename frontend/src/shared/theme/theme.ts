import { createTheme } from '@mui/material/styles';

export function buildTheme(mode: 'light' | 'dark') {
  const isDark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#3dba8f' : '#0f8f68',
        dark: '#0a5c44',
        light: '#3dba8f',
      },
      secondary: {
        main: '#f0b429',
        dark: '#c79214',
        light: '#f7d06a',
      },
      error: { main: '#e85d4c' },
      info: { main: '#2aa8c4' },
      success: { main: '#0f8f68' },
      background: {
        default: isDark ? '#071412' : '#f6f1e7',
        paper: isDark ? '#102420' : '#ffffff',
      },
      text: {
        primary: isDark ? '#e8f2ee' : '#0b2420',
        secondary: isDark ? '#a9c4bb' : '#4d675f',
      },
    },
    typography: {
      fontFamily: '"DM Sans", system-ui, sans-serif',
      h1: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 700, letterSpacing: '-0.03em' },
      h2: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 700, letterSpacing: '-0.03em' },
      h3: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 600, letterSpacing: '-0.02em' },
      h4: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 600 },
      h5: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 600 },
      button: { fontWeight: 700 },
    },
    shape: { borderRadius: 16 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 12,
            paddingInline: 18,
          },
          containedPrimary: {
            background: 'linear-gradient(135deg, #0f8f68 0%, #2aa8c4 100%)',
            boxShadow: '0 10px 24px rgba(15, 143, 104, 0.28)',
            '&:hover': {
              background: 'linear-gradient(135deg, #0a5c44 0%, #1f8fa8 100%)',
              boxShadow: '0 12px 28px rgba(15, 143, 104, 0.35)',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600 },
        },
      },
      MuiTextField: {
        defaultProps: { variant: 'outlined' },
      },
    },
  });
}

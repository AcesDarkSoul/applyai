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
        default: isDark ? '#0b0c18' : '#f3f4fb',
        paper: isDark ? '#15172a' : '#ffffff',
      },
      text: {
        primary: isDark ? '#eef0ff' : '#1a1b2e',
        secondary: isDark ? '#9aa0c0' : '#646988',
      },
      divider: isDark ? 'rgba(238,240,255,0.08)' : 'rgba(30,31,54,0.07)',
    },
    typography: {
      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
      h1: { fontWeight: 800, letterSpacing: '-0.035em' },
      h2: { fontWeight: 800, letterSpacing: '-0.03em' },
      h3: { fontWeight: 800, letterSpacing: '-0.025em' },
      h4: { fontWeight: 800, letterSpacing: '-0.025em' },
      h5: { fontWeight: 800, letterSpacing: '-0.02em' },
      h6: { fontWeight: 700 },
      button: { fontWeight: 800 },
      overline: { fontWeight: 700, letterSpacing: '0.06em' },
    },
    shape: { borderRadius: 16 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarWidth: 'thin',
            scrollbarColor: isDark
              ? 'rgba(91,92,226,0.35) transparent'
              : 'rgba(91,92,226,0.25) transparent',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 800,
            borderRadius: 12,
            paddingInline: 18,
            boxShadow: 'none',
            transition: 'transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease',
          },
          containedPrimary: {
            background: `linear-gradient(135deg, ${primary} 0%, #6d6ff0 100%)`,
            '&:hover': {
              background: 'linear-gradient(135deg, #4546c7 0%, #5b5ce2 100%)',
              boxShadow: '0 10px 24px rgba(91, 92, 226, 0.32)',
              transform: 'translateY(-1px)',
            },
          },
          outlined: {
            borderWidth: 1.5,
            '&:hover': { borderWidth: 1.5 },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 700 },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 20,
            border: isDark
              ? '1px solid rgba(238,240,255,0.08)'
              : '1px solid rgba(91,92,226,0.08)',
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 14 },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: { borderRadius: 99, overflow: 'hidden' },
        },
      },
      MuiTextField: {
        defaultProps: { variant: 'outlined' },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            transition: 'box-shadow 0.18s ease',
            '&.Mui-focused': {
              boxShadow: '0 0 0 4px rgba(91,92,226,0.12)',
            },
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            transition: 'background 0.18s ease, transform 0.18s ease',
          },
        },
      },
    },
  });
}

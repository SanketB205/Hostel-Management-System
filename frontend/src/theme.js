import { createTheme } from '@mui/material/styles';

export const getTheme = (mode) => {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'light' ? '#4F46E5' : '#818CF8',
        light: mode === 'light' ? '#6366F1' : '#A5B4FC',
        dark: mode === 'light' ? '#4338CA' : '#4F46E5',
      },
      secondary: {
        main: mode === 'light' ? '#2563EB' : '#60A5FA',
      },
      success: {
        main: mode === 'light' ? '#22C55E' : '#34D399',
      },
      warning: {
        main: mode === 'light' ? '#F59E0B' : '#FBBF24',
      },
      error: {
        main: mode === 'light' ? '#EF4444' : '#F87171',
      },
      info: {
        main: mode === 'light' ? '#8B5CF6' : '#A78BFA',
      },
      background: {
        default: mode === 'light' ? '#F8FAFC' : '#0B1120',
        paper: mode === 'light' ? '#FFFFFF' : '#1E293B',
      },
      text: {
        primary: mode === 'light' ? '#0F172A' : '#F8FAFC',
        secondary: mode === 'light' ? '#64748B' : '#94A3B8',
      },
      divider: mode === 'light' ? '#E2E8F0' : 'rgba(255, 255, 255, 0.12)',
      action: {
        hover: mode === 'light' ? '#F1F5F9' : 'rgba(255, 255, 255, 0.08)',
        selected: mode === 'light' ? '#E2E8F0' : 'rgba(255, 255, 255, 0.16)',
      }
    },
    typography: {
      fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 600 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      subtitle1: { fontWeight: 500 },
      subtitle2: { fontWeight: 500 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 18,
            boxShadow: mode === 'light' 
              ? '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
              : '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
            border: `1px solid ${mode === 'light' ? '#E2E8F0' : 'rgba(255, 255, 255, 0.05)'}`,
            backgroundImage: 'none',
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            backgroundColor: mode === 'light' ? '#FFFFFF' : '#1E293B',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '8px 16px',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: mode === 'light' ? '#0F172A' : '#1E293B',
            color: '#F8FAFC',
            borderRight: mode === 'light' ? 'none' : '1px solid rgba(255,255,255,0.05)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(12px)',
            color: mode === 'light' ? '#0F172A' : '#F8FAFC',
            boxShadow: 'none',
            borderBottom: `1px solid ${mode === 'light' ? '#E2E8F0' : 'rgba(255, 255, 255, 0.05)'}`,
            backgroundImage: 'none',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${mode === 'light' ? '#E2E8F0' : 'rgba(255, 255, 255, 0.05)'}`,
            padding: '16px',
          },
          head: {
            fontWeight: 600,
            color: mode === 'light' ? '#64748B' : '#94A3B8',
            backgroundColor: mode === 'light' ? '#F8FAFC' : '#0B1120',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          }
        }
      }
    },
  });
};

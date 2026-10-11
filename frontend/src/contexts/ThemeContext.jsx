import React, { createContext, useState, useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { getTheme } from '../theme';

export const ColorModeContext = createContext({ toggleColorMode: () => {} });

const STORAGE_KEY = 'hms_theme_mode';

export const ThemeContextProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    // Restore persisted preference; default to 'light'
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'dark' ? 'dark' : 'light';
  });

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const next = prevMode === 'light' ? 'dark' : 'light';
          localStorage.setItem(STORAGE_KEY, next);
          return next;
        });
      },
    }),
    [],
  );

  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

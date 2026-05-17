import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
}

const STORAGE_KEY = '@cityira_theme_mode';

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'system',
  isDark: false,
  setMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [loaded, setLoaded] = useState(false);

  // Load persisted preference on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((val) => {
        if (val === 'light' || val === 'dark' || val === 'system') {
          setModeState(val);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(STORAGE_KEY, newMode).catch(() => {});
  }, []);

  const isDark =
    mode === 'dark' ? true :
    mode === 'light' ? false :
    systemScheme === 'dark';

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ mode, isDark, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  return useContext(ThemeContext);
}

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, Theme } from './colors';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  resolvedMode: 'light' | 'dark';
  theme: Theme;
}

const THEME_STORAGE_KEY = '@garden_theme_mode';

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'system',
  setMode: () => undefined,
  resolvedMode: 'light',
  theme: lightTheme,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('system');
  const systemScheme = useColorScheme();
  const resolvedMode: 'light' | 'dark' = mode === 'system'
    ? (systemScheme === 'dark' ? 'dark' : 'light')
    : mode;

  useEffect(() => {
    let isMounted = true;
    const loadTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          if (isMounted) setMode(stored);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    };
    loadTheme();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const saveTheme = async () => {
      try {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      } catch (error) {
        console.error('Error saving theme preference:', error);
      }
    };
    saveTheme();
  }, [mode]);

  const theme = useMemo(() => (resolvedMode === 'dark' ? darkTheme : lightTheme), [resolvedMode]);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      resolvedMode,
      theme,
    }),
    [mode, resolvedMode, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): Theme => {
  return useContext(ThemeContext).theme;
};

export const useThemeMode = (): { mode: ThemeMode; setMode: (mode: ThemeMode) => void; resolvedMode: 'light' | 'dark' } => {
  const { mode, setMode, resolvedMode } = useContext(ThemeContext);
  return { mode, setMode, resolvedMode };
};

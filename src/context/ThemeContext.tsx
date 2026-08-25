import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LightColors, DarkColors } from '../constants/Colors';

type ColorPalette = typeof LightColors;

interface ThemeContextProps {
  isDark: boolean;
  toggleTheme: () => void;
  C: ColorPalette;
}

const ThemeContext = createContext<ThemeContextProps>({
  isDark: false,
  toggleTheme: () => {},
  C: LightColors,
});

const THEME_KEY = 'rapidcare_theme';

const SafeStorage = {
  getItem: async (key: string) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.warn("AsyncStorage native module is missing. Defaulting to memory.");
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      // Ignore save failure
    }
  }
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark] = useState(false); // default: light

  useEffect(() => {
    SafeStorage.getItem(THEME_KEY).then(val => {
      if (val === 'dark') setIsDark(true);
      else setIsDark(false); // explicit default to light
    });
  }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    await SafeStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
  };

  const C = isDark ? DarkColors : LightColors;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, C }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

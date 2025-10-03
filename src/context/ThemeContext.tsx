
import React, { createContext, useState, useEffect, useMemo } from 'react';
import { Appearance } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const lightTheme = {
  background: '#F5F7FA',
  card: '#FFFFFF',
  text: '#333333',
  secundaryText: '#666666',
  primary: '#007BFF',
  secundary: '#4A90E2',
  accent: '#4CAF50',
  error: '#FF4D4D',
  // Adicione outras cores conforme necessário
};

export const darkTheme = {
  background: '#121212',
  card: '#1E1E1E',
  text: '#FFFFFF',
  secundaryText: '#B0B0B0',
  primary: '#007BFF',
  secundary: '#4A90E2',
  accent: '#4CAF50',
  error: '#FF4D4D',
  // Adicione outras cores conforme necessário
};

export const ThemeContext = createContext({
  theme: lightTheme,
  toggleTheme: () => {},
  isDarkMode: false,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const colorScheme = Appearance.getColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');

  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await SecureStore.getItemAsync('theme');
      if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark');
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newIsDarkMode = !isDarkMode;
    setIsDarkMode(newIsDarkMode);
    await SecureStore.setItemAsync('theme', newIsDarkMode ? 'dark' : 'light');
  };

  const theme = useMemo(() => (isDarkMode ? darkTheme : lightTheme), [isDarkMode]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

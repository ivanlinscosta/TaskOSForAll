import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeMode } from '../types';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('dualos-theme');
    return (saved as ThemeMode) || 'fiap';
  });

  useEffect(() => {
    // Remove ambas as classes primeiro
    document.body.classList.remove('theme-itau', 'theme-fiap');
    
    // Adiciona a classe do tema atual
    document.body.classList.add(`theme-${theme}`);
    
    // Salva no localStorage
    localStorage.setItem('dualos-theme', theme);
  }, [theme]);

  const toggleTheme = (newTheme: ThemeMode) => {
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  }
  return context;
}

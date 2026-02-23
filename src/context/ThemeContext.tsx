import React, { createContext, useContext, useState, useEffect } from "react";

interface GameTheme {
  primary: string;
  secondary: string;
  accent: string;
  gradient_from: string;
  gradient_to: string;
}

interface ThemeContextType {
  theme: GameTheme | null;
  setTheme: (theme: GameTheme | null) => void;
  resetTheme: () => void;
}

const defaultTheme: GameTheme = {
  primary: "#6366f1",
  secondary: "#8b5cf6",
  accent: "#06b6d4",
  gradient_from: "#6366f1",
  gradient_to: "#8b5cf6",
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<GameTheme | null>(null);

  const setTheme = (newTheme: GameTheme | null) => {
    setThemeState(newTheme);
    applyTheme(newTheme || defaultTheme);
  };

  const resetTheme = () => {
    setThemeState(null);
    applyTheme(defaultTheme);
  };

  const applyTheme = (themeColors: GameTheme) => {
    const root = document.documentElement;
    root.style.setProperty("--color-primary", themeColors.primary);
    root.style.setProperty("--color-secondary", themeColors.secondary);
    root.style.setProperty("--color-accent", themeColors.accent);
    root.style.setProperty("--gradient-from", themeColors.gradient_from);
    root.style.setProperty("--gradient-to", themeColors.gradient_to);
  };

  useEffect(() => {
    applyTheme(defaultTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

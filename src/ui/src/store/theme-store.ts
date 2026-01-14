import { create } from 'zustand';

type Theme = 'qa-studio-dark' | 'qa-studio-light';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

// Simple localStorage persistence
const THEME_STORAGE_KEY = 'qa-studio-theme';

const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') return 'qa-studio-dark';
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return (stored === 'qa-studio-light' || stored === 'qa-studio-dark') ? stored : 'qa-studio-dark';
};

const applyTheme = (theme: Theme) => {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }
};

// Initialize theme on load
if (typeof document !== 'undefined') {
  const initialTheme = getStoredTheme();
  applyTheme(initialTheme);
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getStoredTheme(),
  setTheme: (theme) => {
    set({ theme });
    applyTheme(theme);
  },
  toggleTheme: () => {
    set((state) => {
      const newTheme = state.theme === 'qa-studio-dark' ? 'qa-studio-light' : 'qa-studio-dark';
      applyTheme(newTheme);
      return { theme: newTheme };
    });
  },
}));


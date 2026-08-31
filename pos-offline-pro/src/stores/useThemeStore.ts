import { create } from "zustand";

type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  theme: ThemeMode;
  isDark: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: "dark",
  isDark: true,
  setTheme: (theme) =>
    set(() => ({
      theme,
      isDark: theme === "dark",
    })),
  toggleTheme: () =>
    set((state) => ({
      theme: state.isDark ? "light" : "dark",
      isDark: !state.isDark,
    })),
}));

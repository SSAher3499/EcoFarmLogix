import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
  persist(
    (set, get) => ({
      // Current theme: 'light', 'dark', or 'system'
      theme: 'light',

      // Set theme explicitly
      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },

      // Toggle between light and dark mode
      toggleTheme: () => {
        const current = get().theme;
        const next = current === 'light' ? 'dark' : 'light';
        set({ theme: next });
        applyTheme(next);
      },

      // Initialize theme (called on app load)
      initTheme: () => {
        const currentTheme = get().theme;
        applyTheme(currentTheme);
      },
    }),
    {
      name: 'ecofarm-theme', // localStorage key
      partialize: (state) => ({ theme: state.theme }), // Only persist theme
    }
  )
);

// Function to apply theme to the DOM
function applyTheme(theme) {
  const root = window.document.documentElement;

  if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

// Initialize theme on module load
if (typeof window !== 'undefined') {
  // Get stored theme or default to 'light'
  const stored = JSON.parse(localStorage.getItem('ecofarm-theme') || '{}');
  const storedTheme = stored.state?.theme || 'light';

  // Apply theme immediately to prevent flash
  applyTheme(storedTheme);

  // Listen for system theme changes if using 'system' mode
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const currentTheme = useThemeStore.getState().theme;
    if (currentTheme === 'system') {
      applyTheme('system');
    }
  });
}

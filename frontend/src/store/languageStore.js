import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import en from '../locales/en';
import mr from '../locales/mr';

const translations = {
  en,
  mr,
};

export const useLanguageStore = create(
  persist(
    (set, get) => ({
      // Current language code
      language: 'en',
      
      // Available languages
      availableLanguages: [
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
      ],

      // Set language
      setLanguage: (langCode) => {
        if (translations[langCode]) {
          set({ language: langCode });
        }
      },

      // Toggle between languages
      toggleLanguage: () => {
        const currentLang = get().language;
        const newLang = currentLang === 'en' ? 'mr' : 'en';
        set({ language: newLang });
      },

      // Get current translations object
      getTranslations: () => {
        const lang = get().language;
        return translations[lang] || translations.en;
      },

      // Get a specific translation by key path (e.g., 'dashboard.title')
      t: (keyPath, fallback = '') => {
        const lang = get().language;
        const trans = translations[lang] || translations.en;
        
        // Split key path and traverse object
        const keys = keyPath.split('.');
        let result = trans;
        
        for (const key of keys) {
          if (result && typeof result === 'object' && key in result) {
            result = result[key];
          } else {
            // If key not found, try English fallback
            result = translations.en;
            for (const k of keys) {
              if (result && typeof result === 'object' && k in result) {
                result = result[k];
              } else {
                return fallback || keyPath;
              }
            }
            break;
          }
        }
        
        return typeof result === 'string' ? result : fallback || keyPath;
      },
    }),
    {
      name: 'ecofarm-language', // localStorage key
      partialize: (state) => ({ language: state.language }), // Only persist language
    }
  )
);

// Export a simple t function for use outside React components
export const t = (keyPath, fallback = '') => {
  return useLanguageStore.getState().t(keyPath, fallback);
};

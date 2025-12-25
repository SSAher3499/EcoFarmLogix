import { useLanguageStore } from '../store/languageStore';

/**
 * Custom hook for translations
 * Usage:
 *   const { t, language, setLanguage, toggleLanguage } = useTranslation();
 *   <h1>{t('dashboard.title')}</h1>
 */
export function useTranslation() {
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const toggleLanguage = useLanguageStore((state) => state.toggleLanguage);
  const t = useLanguageStore((state) => state.t);
  const availableLanguages = useLanguageStore((state) => state.availableLanguages);
  const getTranslations = useLanguageStore((state) => state.getTranslations);

  return {
    t,
    language,
    setLanguage,
    toggleLanguage,
    availableLanguages,
    translations: getTranslations(),
  };
}

export default useTranslation;

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiGlobe, FiCheck } from 'react-icons/fi';

const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' }
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  useEffect(() => {
    setCurrentLanguage(i18n.language);
  }, [i18n.language]);

  const changeLanguage = (languageCode) => {
    i18n.changeLanguage(languageCode);
    setCurrentLanguage(languageCode);
    setIsOpen(false);
  };

  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Change language"
      >
        <FiGlobe size={20} />
        <span className="font-medium">{currentLang.nativeName}</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="py-2">
              {languages.map((language) => (
                <button
                  key={language.code}
                  type="button"
                  onClick={() => changeLanguage(language.code)}
                  className={`
                    w-full px-4 py-2 text-left flex items-center justify-between
                    hover:bg-gray-100 transition-colors
                    ${currentLanguage === language.code ? 'bg-primary-50 text-primary-600' : 'text-gray-700'}
                  `}
                >
                  <div>
                    <div className="font-medium">{language.nativeName}</div>
                    <div className="text-xs text-gray-500">{language.name}</div>
                  </div>
                  {currentLanguage === language.code && (
                    <FiCheck size={18} className="text-primary-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

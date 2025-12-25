import { useLanguageStore } from '../../store/languageStore';
import { FiGlobe } from 'react-icons/fi';

/**
 * Language Switcher Component
 * Displays a toggle button to switch between English and Marathi
 */
export default function LanguageSwitcher({ className = '' }) {
  const { language, toggleLanguage, availableLanguages } = useLanguageStore();

  const currentLang = availableLanguages.find((l) => l.code === language);

  return (
    <button
      onClick={toggleLanguage}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg 
        bg-gray-100 hover:bg-gray-200 text-gray-700 
        transition-colors text-sm font-medium
        ${className}
      `}
      title={language === 'en' ? 'Switch to Marathi' : 'Switch to English'}
    >
      <FiGlobe size={18} />
      <span className="hidden sm:inline">{currentLang?.nativeName}</span>
    </button>
  );
}

/**
 * Language Dropdown Component
 * Displays a dropdown to select from available languages
 */
export function LanguageDropdown({ className = '' }) {
  const { language, setLanguage, availableLanguages } = useLanguageStore();

  return (
    <div className={`relative ${className}`}>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="
          appearance-none px-4 py-2 pr-8 rounded-lg 
          bg-gray-100 hover:bg-gray-200 text-gray-700 
          border-none cursor-pointer text-sm font-medium
          focus:outline-none focus:ring-2 focus:ring-primary-500
        "
      >
        {availableLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName}
          </option>
        ))}
      </select>
      <FiGlobe 
        className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500" 
        size={16} 
      />
    </div>
  );
}

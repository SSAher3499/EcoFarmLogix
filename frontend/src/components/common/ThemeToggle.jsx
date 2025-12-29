import { FiSun, FiMoon } from 'react-icons/fi';
import { useThemeStore } from '../../store/themeStore';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {theme === 'dark' ? (
        <FiSun className="w-5 h-5 text-yellow-500 transition-transform duration-200 hover:rotate-90" />
      ) : (
        <FiMoon className="w-5 h-5 text-gray-600 dark:text-gray-300 transition-transform duration-200 hover:-rotate-12" />
      )}
    </button>
  );
}

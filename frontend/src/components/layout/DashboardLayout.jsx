import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../hooks/useTranslation';
import LanguageSwitcher from '../common/LanguageSwitcher';
import ThemeToggle from '../common/ThemeToggle';
import {
  FiHome,
  FiGrid,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiBell,
  FiUser
} from 'react-icons/fi';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { t, language, setLanguage } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: FiHome, label: t('nav.dashboard') },
    { path: '/farms', icon: FiGrid, label: t('nav.myFarms') },
    { path: '/settings', icon: FiSettings, label: t('nav.settings') },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-all duration-300 ease-in-out flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Sidebar Header with Close Button */}
        <div className="p-4 md:p-6 border-b dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <h1 className="text-xl md:text-2xl font-bold text-primary-600 dark:text-primary-400">🌱 EcoFarmLogix</h1>
          {/* Close button - visible only on mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
            aria-label="Close sidebar"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors min-h-[44px]
                ${isActive(item.path)
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}
              `}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Language Switcher - Mobile Only */}
        <div className="lg:hidden border-t dark:border-gray-700 p-4 flex-shrink-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider font-medium">
            {t('common.language', 'Language')}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setLanguage('en');
                setSidebarOpen(false);
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center ${
                language === 'en'
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              English
            </button>
            <button
              onClick={() => {
                setLanguage('mr');
                setSidebarOpen(false);
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center ${
                language === 'mr'
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              मराठी
            </button>
          </div>
        </div>

        {/* Logout Button */}
        <div className="border-t dark:border-gray-700 p-4 bg-white dark:bg-gray-800 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg w-full transition-colors min-h-[44px]"
          >
            <FiLogOut size={20} />
            <span>{t('common.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top navbar */}
        <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10 transition-colors duration-200">
          <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4">
            {/* Hamburger Menu - Mobile Only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Open sidebar"
            >
              <FiMenu size={24} />
            </button>

            {/* Logo - Visible on Mobile when sidebar is closed */}
            <div className="lg:hidden flex-1 text-center">
              <span className="text-lg font-bold text-primary-600 dark:text-primary-400">🌱 EcoFarm</span>
            </div>

            {/* Header Actions - Always aligned to the right */}
            <div className="flex items-center gap-2 md:gap-4 ml-auto">
              {/* Language Switcher - Desktop Only */}
              <div className="hidden lg:block">
                <LanguageSwitcher />
              </div>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Notifications */}
              <button
                className="relative text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Notifications"
              >
                <FiBell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 md:w-4 md:h-4 bg-red-500 text-white text-[10px] md:text-xs rounded-full flex items-center justify-center">
                  <span className="hidden md:inline">3</span>
                </span>
              </button>

              {/* User */}
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px]">
                <FiUser size={20} />
                <span className="hidden md:inline text-sm lg:text-base">{user?.fullName}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from '../hooks/useTranslation';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import ThemeToggle from '../components/common/ThemeToggle';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success(t('auth.loginSuccess'));
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      {/* Language Switcher and Theme Toggle in top right */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md transition-colors duration-200">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-400">🌱 EcoFarmLogix</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">{t('app.tagline', 'Smart Farm Monitoring System')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('auth.email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
              placeholder="farmer@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('auth.password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 dark:bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('common.loading') : t('auth.login')}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600 dark:text-gray-300">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-primary-600 dark:text-primary-400 hover:underline">
            {t('auth.register')}
          </Link>
        </p>
      </div>
    </div>
  );
}

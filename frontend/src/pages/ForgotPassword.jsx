import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiArrowLeft } from 'react-icons/fi';
import { useTranslation } from '../hooks/useTranslation';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success(t('auth.resetEmailSent', 'Reset link sent! Check your email.'));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            🌱 EcoFarmLogix
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {t('auth.forgotPasswordTitle', 'Forgot your password?')}
          </p>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiMail className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              {t('auth.checkEmail', 'Check your email')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('auth.resetEmailSentDesc', 'We sent a password reset link to your email address.')}
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-green-600 hover:text-green-700"
            >
              <FiArrowLeft />
              {t('auth.backToLogin', 'Back to login')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {t('auth.forgotPasswordDesc', 'Enter your email address and we\'ll send you a link to reset your password.')}
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('auth.email', 'Email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="your@email.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <FiMail />
                  {t('auth.sendResetLink', 'Send Reset Link')}
                </>
              )}
            </button>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-green-600"
              >
                <FiArrowLeft />
                {t('auth.backToLogin', 'Back to login')}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

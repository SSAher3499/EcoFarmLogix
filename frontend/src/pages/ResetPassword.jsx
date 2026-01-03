import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiLock, FiEye, FiEyeOff, FiCheckCircle } from 'react-icons/fi';
import { useTranslation } from '../hooks/useTranslation';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Check if token exists
  useEffect(() => {
    if (!token) {
      toast.error(t('auth.invalidResetLink', 'Invalid or missing reset link'));
    }
  }, [token, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!token) {
      toast.error(t('auth.invalidResetLink', 'Invalid or missing reset link'));
      return;
    }

    if (newPassword.length < 6) {
      toast.error(t('auth.passwordTooShort', 'Password must be at least 6 characters'));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('auth.passwordsDoNotMatch', 'Passwords do not match'));
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setSuccess(true);
      toast.success(t('auth.passwordResetSuccess', 'Password has been reset successfully!'));
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        t('auth.passwordResetFailed', 'Failed to reset password. The link may be invalid or expired.')
      );
    } finally {
      setLoading(false);
    }
  };

  // If no token, show error state
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              EcoFarmLogix
            </h1>
          </div>
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiLock className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            {t('auth.invalidResetLink', 'Invalid Reset Link')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('auth.invalidResetLinkDesc', 'This password reset link is invalid or has expired. Please request a new one.')}
          </p>
          <Link
            to="/forgot-password"
            className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            {t('auth.requestNewLink', 'Request New Link')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            EcoFarmLogix
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {t('auth.resetPasswordTitle', 'Reset your password')}
          </p>
        </div>

        {success ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              {t('auth.passwordResetSuccess', 'Password Reset Successful')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('auth.passwordResetSuccessDesc', 'Your password has been reset successfully. You can now login with your new password.')}
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              {t('auth.goToLogin', 'Go to Login')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {t('auth.resetPasswordDesc', 'Enter your new password below.')}
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('auth.newPassword', 'New Password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder={t('auth.enterNewPassword', 'Enter new password')}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('auth.confirmPassword', 'Confirm Password')}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder={t('auth.confirmNewPassword', 'Confirm new password')}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
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
                  <FiLock />
                  {t('auth.resetPassword', 'Reset Password')}
                </>
              )}
            </button>

            <div className="text-center">
              <Link
                to="/login"
                className="text-gray-600 dark:text-gray-400 hover:text-green-600"
              >
                {t('auth.backToLogin', 'Back to login')}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

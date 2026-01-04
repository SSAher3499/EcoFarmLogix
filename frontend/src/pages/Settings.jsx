import { useState, useEffect } from 'react';
import { FiLock, FiEye, FiEyeOff, FiSave, FiDownload, FiCheckCircle, FiSmartphone, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useTranslation } from '../hooks/useTranslation';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export default function Settings() {
  const { t } = useTranslation();
  const { isInstallable, isInstalled, installApp } = usePWAInstall();
  const { user } = useAuthStore();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Profile state
  const [profile, setProfile] = useState({
    fullName: '',
    phone: ''
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Load user profile data
  useEffect(() => {
    if (user) {
      setProfile({
        fullName: user.fullName || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const response = await api.put('/auth/profile', profile);
      toast.success(t('settings.profileUpdated', 'Profile updated successfully'));
      // Update local user data if needed
      if (response.data?.data?.user) {
        // The auth store should be updated automatically via API interceptor
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t('settings.passwordMismatch', 'New passwords do not match'));
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error(t('settings.passwordTooShort', 'Password must be at least 6 characters'));
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      toast.success(t('settings.passwordChanged', 'Password changed successfully'));
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || t('settings.passwordChangeFailed', 'Failed to change password'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-0">
      <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-4 md:mb-6">
        {t('settings.title', 'Settings')}
      </h1>

      {/* Profile Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 md:p-6 mb-6 transition-colors">
        <h2 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <FiUser className="w-5 h-5" />
          {t('settings.profile', 'Profile')}
        </h2>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('settings.fullName', 'Full Name')}
            </label>
            <input
              type="text"
              value={profile.fullName}
              onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
              className="w-full px-3 py-2 md:py-3 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('settings.phone', 'Phone Number')}
            </label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full px-3 py-2 md:py-3 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('settings.email', 'Email')}
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 md:py-3 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('settings.emailCantChange', 'Email cannot be changed')}
            </p>
          </div>

          <button
            type="submit"
            disabled={profileLoading}
            className="flex items-center gap-2 px-4 py-2 md:py-3 min-h-[44px] bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {profileLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <FiSave className="w-5 h-5" />
            )}
            {t('settings.saveProfile', 'Save Profile')}
          </button>
        </form>
      </div>

      {/* Change Password Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 md:p-6 mb-6 transition-colors">
        <h2 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <FiLock className="w-5 h-5" />
          {t('settings.changePassword', 'Change Password')}
        </h2>

        <form onSubmit={handleChangePassword} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('settings.currentPassword', 'Current Password')}
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full px-3 py-2 md:py-3 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                {showCurrentPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('settings.newPassword', 'New Password')}
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full px-3 py-2 md:py-3 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                {showNewPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t('settings.passwordHint', 'Minimum 6 characters')}
            </p>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('settings.confirmPassword', 'Confirm New Password')}
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 md:py-3 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2 md:py-3 min-h-[44px] px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            ) : (
              <>
                <FiSave className="w-5 h-5" />
                {t('settings.savePassword', 'Change Password')}
              </>
            )}
          </button>
        </form>
      </div>

      {/* Install App Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 md:p-6 mt-6 transition-colors">
        <h2 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <FiSmartphone className="w-5 h-5" />
          {t('settings.installApp', 'Install App')}
        </h2>

        {isInstalled ? (
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <FiCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">
                {t('settings.appInstalled', 'App is installed')}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                {t('settings.appInstalledDesc', 'You can access EcoFarmLogix from your home screen')}
              </p>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('settings.installAppDesc', 'Install EcoFarmLogix on your device for quick access and offline support.')}
            </p>

            {isInstallable ? (
              <button
                onClick={installApp}
                className="flex items-center gap-2 px-4 py-2 md:py-3 min-h-[44px] bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <FiDownload className="w-5 h-5" />
                {t('settings.installButton', 'Install App')}
              </button>
            ) : (
              <div className="space-y-4">
                {/* Show platform-specific install button */}
                <button
                  onClick={() => {
                    // Detect platform and show appropriate instructions
                    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                    const isAndroid = /Android/.test(navigator.userAgent);

                    if (isIOS) {
                      alert(t('settings.iosInstallSteps', '1. Tap the Share button (square with arrow)\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to confirm'));
                    } else if (isAndroid) {
                      alert(t('settings.androidInstallSteps', '1. Tap the menu button (⋮) in the top right\n2. Tap "Add to Home screen" or "Install app"\n3. Tap "Add" to confirm'));
                    } else {
                      alert(t('settings.desktopInstallSteps', 'Look for the install icon (⊕) in the address bar and click it to install the app.'));
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 md:py-3 min-h-[44px] bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <FiDownload className="w-5 h-5" />
                  {t('settings.howToInstall', 'How to Install')}
                </button>

                {/* Also show text instructions */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">
                    {t('settings.installManual', 'Quick Install Instructions:')}
                  </p>
                  <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">•</span>
                      <span><strong>Android Chrome:</strong> {t('settings.installAndroid', 'Tap menu (⋮) → "Add to Home screen"')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">•</span>
                      <span><strong>iPhone Safari:</strong> {t('settings.installIOS', 'Tap Share → "Add to Home Screen"')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">•</span>
                      <span><strong>Desktop Chrome:</strong> {t('settings.installDesktop', 'Click install icon (⊕) in address bar')}</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

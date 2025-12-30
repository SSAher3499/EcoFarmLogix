import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiCpu, FiActivity, FiAlertTriangle, FiPlus, FiArrowRight, FiThermometer, FiZap } from 'react-icons/fi';
import { useTranslation } from '../hooks/useTranslation';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFarms: 0,
    onlineDevices: 0,
    offlineDevices: 0,
    totalSensors: 0,
    totalActuators: 0,
    activeAlerts: 0
  });
  const [farms, setFarms] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch farms
      const farmsResponse = await api.get('/farms');
      const farmsData = farmsResponse.data.data.farms || farmsResponse.data.data || [];
      setFarms(farmsData);

      // Calculate stats from farms
      let onlineDevices = 0;
      let offlineDevices = 0;
      let totalSensors = 0;
      let totalActuators = 0;

      farmsData.forEach(farm => {
        if (farm.devices) {
          farm.devices.forEach(device => {
            if (device.isOnline) onlineDevices++;
            else offlineDevices++;
          });
        }
        if (farm._count) {
          totalSensors += farm._count.sensors || 0;
          totalActuators += farm._count.actuators || 0;
        }
      });

      setStats({
        totalFarms: farmsData.length,
        onlineDevices,
        offlineDevices,
        totalSensors,
        totalActuators,
        activeAlerts: 0 // TODO: Fetch from alerts API
      });

      // Fetch recent notifications
      try {
        const notifResponse = await api.get('/notifications?limit=5');
        setRecentNotifications(notifResponse.data.data.notifications || []);
      } catch (e) {
        console.log('No notifications');
      }

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.goodMorning', 'Good Morning');
    if (hour < 17) return t('dashboard.goodAfternoon', 'Good Afternoon');
    return t('dashboard.goodEvening', 'Good Evening');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">
          {getGreeting()}, {user?.fullName?.split(' ')[0] || 'User'}! 👋
        </h1>
        <p className="text-green-100 mt-1">
          {t('dashboard.welcomeMessage', 'Here\'s an overview of your farm operations')}
        </p>
        <p className="text-green-200 text-sm mt-2">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between">
            <FiHome className="w-8 h-8 text-green-500" />
            <span className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalFarms}</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t('dashboard.totalFarms', 'Total Farms')}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between">
            <FiCpu className="w-8 h-8 text-blue-500" />
            <span className="text-2xl font-bold text-green-600">{stats.onlineDevices}</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t('dashboard.onlineDevices', 'Online Devices')}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between">
            <FiCpu className="w-8 h-8 text-red-500" />
            <span className="text-2xl font-bold text-red-600">{stats.offlineDevices}</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t('dashboard.offlineDevices', 'Offline Devices')}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between">
            <FiThermometer className="w-8 h-8 text-orange-500" />
            <span className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalSensors}</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t('dashboard.totalSensors', 'Total Sensors')}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between">
            <FiZap className="w-8 h-8 text-yellow-500" />
            <span className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalActuators}</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t('dashboard.totalActuators', 'Total Actuators')}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between">
            <FiAlertTriangle className="w-8 h-8 text-red-500" />
            <span className="text-2xl font-bold text-gray-800 dark:text-white">{stats.activeAlerts}</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t('dashboard.activeAlerts', 'Active Alerts')}</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Farm Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              {t('dashboard.farmStatus', 'Farm Status')}
            </h2>
            <Link to="/farms" className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1">
              {t('dashboard.viewAll', 'View All')} <FiArrowRight />
            </Link>
          </div>

          {farms.length === 0 ? (
            <div className="text-center py-8">
              <FiHome className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">{t('dashboard.noFarms', 'No farms yet')}</p>
              {user?.role === 'SUPER_ADMIN' && (
                <Link to="/farms/new" className="inline-flex items-center gap-2 mt-3 text-green-600 hover:text-green-700">
                  <FiPlus /> {t('dashboard.addFarm', 'Add Farm')}
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {farms.slice(0, 5).map(farm => (
                <Link
                  key={farm.id}
                  to={`/farms/${farm.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">{farm.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{farm.locationAddress || farm.farmType}</p>
                  </div>
                  <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs ${
                    farm.devices?.some(d => d.isOnline)
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      farm.devices?.some(d => d.isOnline) ? 'bg-green-500' : 'bg-gray-400'
                    }`}></span>
                    {farm.devices?.some(d => d.isOnline) ? t('common.online', 'Online') : t('common.offline', 'Offline')}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              {t('dashboard.recentActivity', 'Recent Activity')}
            </h2>
            <Link to="/notifications" className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1">
              {t('dashboard.viewAll', 'View All')} <FiArrowRight />
            </Link>
          </div>

          {recentNotifications.length === 0 ? (
            <div className="text-center py-8">
              <FiActivity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">{t('dashboard.noActivity', 'No recent activity')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg ${
                    !notification.isRead
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : 'bg-gray-50 dark:bg-gray-700/50'
                  }`}
                >
                  <p className="font-medium text-gray-800 dark:text-white text-sm">{notification.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.message}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions (for Super Admin) */}
      {user?.role === 'SUPER_ADMIN' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            {t('dashboard.quickActions', 'Quick Actions')}
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/farms/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <FiPlus /> {t('dashboard.addFarm', 'Add Farm')}
            </Link>
            <Link
              to="/farms"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FiHome /> {t('dashboard.manageFarms', 'Manage Farms')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

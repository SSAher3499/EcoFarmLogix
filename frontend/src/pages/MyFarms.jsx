import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiMapPin, FiThermometer, FiDroplet, FiAlertTriangle } from 'react-icons/fi';
import { useTranslation } from '../hooks/useTranslation';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function MyFarms() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFarms();
  }, []);

  const fetchFarms = async () => {
    try {
      const response = await api.get('/farms');
      setFarms(response.data.data.farms || response.data.data || []);
    } catch (error) {
      toast.error('Failed to load farms');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {t('nav.myFarms', 'My Farms')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {t('myFarms.subtitle', 'Manage and monitor your farms')}
          </p>
        </div>
        {user?.role === 'SUPER_ADMIN' && (
          <Link
            to="/farms/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <FiPlus /> {t('dashboard.addFarm', 'Add Farm')}
          </Link>
        )}
      </div>

      {/* Farms Grid */}
      {farms.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
          <FiMapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
            {t('dashboard.noFarms', 'No farms yet')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {t('dashboard.noFarmsDesc', 'Get started by adding your first farm')}
          </p>
          {user?.role === 'SUPER_ADMIN' && (
            <Link
              to="/farms/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <FiPlus /> {t('dashboard.addFarm', 'Add Farm')}
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {farms.map((farm) => (
            <Link
              key={farm.id}
              to={`/farms/${farm.id}`}
              className="bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition-shadow overflow-hidden"
            >
              {/* Farm Header */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-gray-800 dark:text-white truncate">
                      {farm.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                      <FiMapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{farm.locationAddress || farm.location || t('dashboard.noLocation', 'No location')}</span>
                    </p>
                  </div>
                  {/* Online/Offline Badge */}
                  <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 flex-shrink-0 ml-2 ${
                    farm.devices?.some(d => d.isOnline)
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      farm.devices?.some(d => d.isOnline) ? 'bg-green-500' : 'bg-gray-400'
                    }`}></span>
                    {farm.devices?.some(d => d.isOnline) ? t('common.online', 'Online') : t('common.offline', 'Offline')}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                    <FiThermometer className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('dashboard.devices', 'Devices')}</p>
                    <p className="text-lg font-bold text-gray-800 dark:text-white">
                      {farm.devices?.length || farm._count?.devices || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                    <FiDroplet className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('farm.type', 'Type')}</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                      {farm.farmType || 'N/A'}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                    <FiAlertTriangle className="w-5 h-5 text-red-500 mx-auto mb-1" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('dashboard.alerts', 'Alerts')}</p>
                    <p className="text-lg font-bold text-gray-800 dark:text-white">
                      {farm._count?.alerts || 0}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { farmService } from '../services/farm.service';
import { useTranslation } from '../hooks/useTranslation';
import { FiMapPin, FiThermometer, FiDroplet, FiActivity } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    loadFarms();
  }, []);

  const loadFarms = async () => {
    try {
      const data = await farmService.getFarms();
      setFarms(data);
    } catch (error) {
      toast.error(t('messages.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('dashboard.title')}</h1>
        <Link
          to="/farms/new"
          className="bg-primary-600 dark:bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
        >
          {t('dashboard.addFarm')}
        </Link>
      </div>

      {farms.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center transition-colors">
          <div className="text-6xl mb-4">🌱</div>
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">{t('dashboard.noFarms')}</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{t('dashboard.noFarmsDesc')}</p>
          <Link
            to="/farms/new"
            className="bg-primary-600 dark:bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors inline-block"
          >
            {t('dashboard.addFirstFarm')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {farms.map((farm) => (
            <Link
              key={farm.id}
              to={`/farms/${farm.id}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg dark:hover:shadow-primary-900/20 transition-all p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{farm.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                    <FiMapPin size={14} />
                    {farm.locationAddress || t('dashboard.noLocation')}
                  </p>
                </div>
                <span className={`
                  px-2 py-1 text-xs rounded-full
                  ${farm.devices?.some(d => d.isOnline)
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}
                `}>
                  {farm.devices?.some(d => d.isOnline)
                    ? `● ${t('common.online')}`
                    : `○ ${t('common.offline')}`}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 transition-colors">
                  <FiThermometer className="mx-auto text-orange-500 dark:text-orange-400 mb-1" size={20} />
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('dashboard.devices')}</p>
                  <p className="font-semibold dark:text-white">{farm._count?.devices || 0}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 transition-colors">
                  <FiDroplet className="mx-auto text-blue-500 dark:text-blue-400 mb-1" size={20} />
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('farm.type')}</p>
                  <p className="font-semibold dark:text-white text-xs">
                    {t(`farm.farmTypes.${farm.farmType}`) || farm.farmType}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 transition-colors">
                  <FiActivity className="mx-auto text-red-500 dark:text-red-400 mb-1" size={20} />
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('dashboard.alerts')}</p>
                  <p className="font-semibold dark:text-white">{farm._count?.alerts || 0}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

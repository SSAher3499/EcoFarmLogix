import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { farmService } from '../services/farm.service';
import { FiMapPin, FiThermometer, FiDroplet, FiActivity } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFarms();
  }, []);

  const loadFarms = async () => {
    try {
      const data = await farmService.getFarms();
      setFarms(data);
    } catch (error) {
      toast.error('Failed to load farms');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <Link
          to="/farms/new"
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          + Add Farm
        </Link>
      </div>

      {farms.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">🌱</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No farms yet</h2>
          <p className="text-gray-500 mb-6">Add your first farm to start monitoring</p>
          <Link
            to="/farms/new"
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Add Your First Farm
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {farms.map((farm) => (
            <Link
              key={farm.id}
              to={`/farms/${farm.id}`}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{farm.name}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <FiMapPin size={14} />
                    {farm.locationAddress || 'No location set'}
                  </p>
                </div>
                <span className={`
                  px-2 py-1 text-xs rounded-full
                  ${farm.devices?.some(d => d.isOnline) 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600'}
                `}>
                  {farm.devices?.some(d => d.isOnline) ? '● Online' : '○ Offline'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-gray-50 rounded-lg p-3">
                  <FiThermometer className="mx-auto text-orange-500 mb-1" size={20} />
                  <p className="text-xs text-gray-500">Devices</p>
                  <p className="font-semibold">{farm._count?.devices || 0}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <FiDroplet className="mx-auto text-blue-500 mb-1" size={20} />
                  <p className="text-xs text-gray-500">Type</p>
                  <p className="font-semibold text-xs">{farm.farmType}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <FiActivity className="mx-auto text-red-500 mb-1" size={20} />
                  <p className="text-xs text-gray-500">Alerts</p>
                  <p className="font-semibold">{farm._count?.alerts || 0}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
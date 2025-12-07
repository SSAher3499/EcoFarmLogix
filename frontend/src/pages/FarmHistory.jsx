import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  ArrowDownTrayIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';
import historyService from '../services/history.service';
import SensorChart from '../components/charts/SensorChart';
import StatsCard from '../components/charts/StatsCard';
import TimeRangeSelector from '../components/charts/TimeRangeSelector';

const SENSOR_COLORS = {
  TEMPERATURE: 'red',
  HUMIDITY: 'blue',
  SOIL_MOISTURE: 'purple',
  LIGHT: 'orange',
  CO2: 'green',
  PH: 'green',
  EC: 'purple',
  WATER_FLOW: 'blue'
};

const FarmHistory = () => {
  const { farmId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [farmData, setFarmData] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [farmId, timeRange]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await historyService.getFarmHistory(farmId, timeRange);
      setFarmData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await historyService.exportFarmHistory(farmId, timeRange);
    } catch (err) {
      alert('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg">
        <p>{error}</p>
        <button 
          onClick={fetchHistory}
          className="mt-2 text-sm underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            to={`/farms/${farmId}`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              <ChartBarIcon className="w-7 h-7 inline mr-2 text-green-600" />
              Historical Data
            </h1>
            <p className="text-gray-500">{farmData?.farm?.name}</p>
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          <ArrowDownTrayIcon className="w-5 h-5" />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Time Range Selector */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Time Range</h3>
        <TimeRangeSelector selected={timeRange} onChange={setTimeRange} />
      </div>

      {/* Sensor Charts */}
      {farmData?.sensors?.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <ChartBarIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No sensor data available</p>
          <p className="text-sm text-gray-400 mt-1">
            Add sensors and collect some data to see charts
          </p>
        </div>
      ) : (
        farmData?.sensors?.map((sensorData) => (
          <div key={sensorData.sensor.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              {/* Chart */}
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-4">
                  {sensorData.sensor.name}
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({sensorData.sensor.type})
                  </span>
                </h3>
                <SensorChart
                  data={sensorData.readings}
                  sensorType={sensorData.sensor.type}
                  sensorName={sensorData.sensor.name}
                  unit={sensorData.sensor.unit}
                />
              </div>
              
              {/* Stats */}
              <div className="lg:w-64">
                <StatsCard
                  title={`${timeRange} Statistics`}
                  stats={sensorData.stats}
                  unit={sensorData.sensor.unit}
                  color={SENSOR_COLORS[sensorData.sensor.type] || 'green'}
                />
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default FarmHistory;
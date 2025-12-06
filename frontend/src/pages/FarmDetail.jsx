import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { farmService } from '../services/farm.service';
import { socketService } from '../services/socket.service';
import { 
  FiThermometer, 
  FiDroplet, 
  FiSun, 
  FiWind,
  FiPower,
  FiRefreshCw
} from 'react-icons/fi';
import toast from 'react-hot-toast';

// Sensor icon mapping
const sensorIcons = {
  TEMPERATURE: FiThermometer,
  HUMIDITY: FiDroplet,
  LIGHT: FiSun,
  SOIL_MOISTURE: FiDroplet,
  CO2: FiWind,
};

// Sensor colors
const sensorColors = {
  TEMPERATURE: 'text-orange-500 bg-orange-100',
  HUMIDITY: 'text-blue-500 bg-blue-100',
  LIGHT: 'text-yellow-500 bg-yellow-100',
  SOIL_MOISTURE: 'text-green-500 bg-green-100',
  CO2: 'text-purple-500 bg-purple-100',
};

export default function FarmDetail() {
  const { farmId } = useParams();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [controlLoading, setControlLoading] = useState({});

  const loadDashboard = useCallback(async () => {
    try {
      const data = await farmService.getDashboard(farmId);
      setDashboard(data);
    } catch (error) {
      toast.error('Failed to load farm data');
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    loadDashboard();

    // Connect WebSocket
    const token = localStorage.getItem('accessToken');
    socketService.connect(token);
    socketService.subscribeFarm(farmId);

    // Listen for updates
    socketService.onSensorUpdate((data) => {
      console.log('Sensor update:', data);
      setDashboard((prev) => {
        if (!prev) return prev;
        
        // Update sensor values
        const updatedDevices = prev.devices.map((device) => {
          if (device.id === data.data.deviceId) {
            const updatedSensors = device.sensors.map((sensor) => {
              const update = data.data.sensors.find((s) => s.sensorId === sensor.id);
              if (update) {
                return { ...sensor, lastReading: update.value, lastReadingAt: update.timestamp };
              }
              return sensor;
            });
            return { ...device, sensors: updatedSensors };
          }
          return device;
        });

        return { ...prev, devices: updatedDevices };
      });
    });

    socketService.onActuatorUpdate((data) => {
      console.log('Actuator update:', data);
      setDashboard((prev) => {
        if (!prev) return prev;
        
        const updatedDevices = prev.devices.map((device) => ({
          ...device,
          actuators: device.actuators.map((actuator) =>
            actuator.id === data.actuatorId
              ? { ...actuator, currentState: data.state }
              : actuator
          ),
        }));

        return { ...prev, devices: updatedDevices };
      });
    });

    socketService.onAlert((data) => {
      toast.error(`🚨 ${data.alert.title}: ${data.alert.message}`);
    });

    // Cleanup
    return () => {
      socketService.unsubscribeFarm(farmId);
      socketService.removeAllListeners();
    };
  }, [farmId, loadDashboard]);

  const handleActuatorControl = async (actuatorId, currentState) => {
    const newState = currentState === 'ON' ? 'OFF' : 'ON';
    setControlLoading((prev) => ({ ...prev, [actuatorId]: true }));

    try {
      await farmService.controlActuator(actuatorId, newState);
      toast.success(`Actuator turned ${newState}`);
    } catch (error) {
      toast.error('Failed to control actuator');
    } finally {
      setControlLoading((prev) => ({ ...prev, [actuatorId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!dashboard) {
    return <div className="text-center text-gray-500">Farm not found</div>;
  }

  // Collect all sensors from all devices
  const allSensors = dashboard.devices.flatMap((d) => 
    d.sensors.map((s) => ({ ...s, deviceName: d.deviceName }))
  );

  // Collect all actuators from all devices
  const allActuators = dashboard.devices.flatMap((d) =>
    d.actuators.map((a) => ({ ...a, deviceName: d.deviceName, deviceMac: d.macAddress }))
  );

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{dashboard.farm.name}</h1>
          <p className="text-gray-500">{dashboard.farm.location || dashboard.farm.farmType}</p>
        </div>
        <button
          onClick={loadDashboard}
          className="flex items-center gap-2 text-gray-600 hover:text-primary-600"
        >
          <FiRefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Devices</p>
          <p className="text-2xl font-bold">{dashboard.stats.totalDevices}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Online</p>
          <p className="text-2xl font-bold text-green-600">{dashboard.stats.onlineDevices}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Sensors</p>
          <p className="text-2xl font-bold">{dashboard.stats.totalSensors}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Actuators</p>
          <p className="text-2xl font-bold">{dashboard.stats.totalActuators}</p>
        </div>
      </div>

      {/* Sensors */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">📊 Sensor Readings</h2>
        {allSensors.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            No sensors configured
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allSensors.map((sensor) => {
              const Icon = sensorIcons[sensor.sensorType] || FiThermometer;
              const colorClass = sensorColors[sensor.sensorType] || 'text-gray-500 bg-gray-100';

              return (
                <div key={sensor.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{sensor.sensorName}</p>
                      <p className="text-xs text-gray-500">{sensor.deviceName}</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-800">
                    {sensor.lastReading !== null 
                      ? `${parseFloat(sensor.lastReading).toFixed(1)}${sensor.unit}`
                      : '--'}
                  </div>
                  {sensor.lastReadingAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      Updated: {new Date(sensor.lastReadingAt).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actuators */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">⚡ Actuator Controls</h2>
        {allActuators.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            No actuators configured
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allActuators.map((actuator) => (
              <div key={actuator.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-800">{actuator.actuatorName}</p>
                    <p className="text-xs text-gray-500">{actuator.actuatorType}</p>
                  </div>
                  <span className={`
                    w-3 h-3 rounded-full
                    ${actuator.currentState === 'ON' ? 'bg-green-500' : 'bg-gray-300'}
                  `} />
                </div>
                <button
                  onClick={() => handleActuatorControl(actuator.id, actuator.currentState)}
                  disabled={controlLoading[actuator.id]}
                  className={`
                    w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors
                    ${actuator.currentState === 'ON'
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'}
                    disabled:opacity-50
                  `}
                >
                  {controlLoading[actuator.id] ? (
                    <FiRefreshCw className="animate-spin" size={18} />
                  ) : (
                    <FiPower size={18} />
                  )}
                  {actuator.currentState === 'ON' ? 'Turn OFF' : 'Turn ON'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Alerts */}
      {dashboard.recentAlerts?.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">🚨 Recent Alerts</h2>
          <div className="bg-white rounded-lg shadow divide-y">
            {dashboard.recentAlerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="p-4 flex items-center gap-4">
                <span className={`
                  px-2 py-1 text-xs rounded
                  ${alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}
                `}>
                  {alert.severity}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{alert.title}</p>
                  <p className="text-sm text-gray-500">{alert.message}</p>
                </div>
                <p className="text-xs text-gray-400">
                  {new Date(alert.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  FiArrowLeft, FiPlus, FiTrash2, FiEdit2, FiCpu, 
  FiThermometer, FiDroplet, FiPower, FiWifi, FiWifiOff 
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import deviceService from '../services/device.service';

// Device Types
const DEVICE_TYPES = [
  { value: 'GATEWAY', label: 'Gateway' },
  { value: 'SENSOR_NODE', label: 'Sensor Node' },
  { value: 'RELAY_NODE', label: 'Relay Node' },
  { value: 'CAMERA', label: 'Camera' }
];

// Sensor Types
const SENSOR_TYPES = [
  { value: 'TEMPERATURE', label: 'Temperature', unit: '°C' },
  { value: 'HUMIDITY', label: 'Humidity', unit: '%' },
  { value: 'SOIL_MOISTURE', label: 'Soil Moisture', unit: '%' },
  { value: 'SOIL_TEMPERATURE', label: 'Soil Temperature', unit: '°C' },
  { value: 'LIGHT', label: 'Light', unit: 'lux' },
  { value: 'CO2', label: 'CO2', unit: 'ppm' },
  { value: 'PH', label: 'pH', unit: 'pH' },
  { value: 'EC', label: 'EC', unit: 'mS/cm' },
  { value: 'WATER_LEVEL', label: 'Water Level', unit: 'cm' },
  { value: 'WATER_FLOW', label: 'Water Flow', unit: 'L/min' }
];

// Actuator Types
const ACTUATOR_TYPES = [
  { value: 'FAN', label: 'Fan' },
  { value: 'EXHAUST_FAN', label: 'Exhaust Fan' },
  { value: 'FOGGER', label: 'Fogger' },
  { value: 'IRRIGATION_VALVE', label: 'Irrigation Valve' },
  { value: 'SHADE_NET', label: 'Shade Net' },
  { value: 'GROW_LIGHT', label: 'Grow Light' },
  { value: 'HEATER', label: 'Heater' },
  { value: 'COOLER', label: 'Cooler' },
  { value: 'WATER_PUMP', label: 'Water Pump' },
  { value: 'DOSING_PUMP', label: 'Dosing Pump' }
];

export default function DeviceManagement() {
  const { farmId } = useParams();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showSensorModal, setShowSensorModal] = useState(false);
  const [showActuatorModal, setShowActuatorModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  
  // Form states
  const [deviceForm, setDeviceForm] = useState({
    macAddress: '',
    deviceName: '',
    deviceType: 'GATEWAY'
  });
  
  const [sensorForm, setSensorForm] = useState({
    sensorType: 'TEMPERATURE',
    sensorName: '',
    unit: '°C',
    minThreshold: '',
    maxThreshold: ''
  });
  
  const [actuatorForm, setActuatorForm] = useState({
    actuatorType: 'FAN',
    actuatorName: '',
    gpioPin: ''
  });

  useEffect(() => {
    loadDevices();
  }, [farmId]);

  const loadDevices = async () => {
    try {
      const data = await deviceService.getFarmDevices(farmId);
      setDevices(data.data.devices);
    } catch (error) {
      toast.error('Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  // Device handlers
  const handleAddDevice = async (e) => {
    e.preventDefault();
    if (!deviceForm.macAddress || !deviceForm.deviceName) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await deviceService.registerDevice(farmId, deviceForm);
      toast.success('Device registered successfully');
      setShowDeviceModal(false);
      setDeviceForm({ macAddress: '', deviceName: '', deviceType: 'GATEWAY' });
      loadDevices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register device');
    }
  };

  const handleDeleteDevice = async (deviceId) => {
    if (!confirm('Delete this device? All sensors and actuators will be removed.')) return;

    try {
      await deviceService.deleteDevice(deviceId);
      toast.success('Device deleted');
      loadDevices();
    } catch (error) {
      toast.error('Failed to delete device');
    }
  };

  // Sensor handlers
  const openSensorModal = (device) => {
    setSelectedDevice(device);
    setSensorForm({
      sensorType: 'TEMPERATURE',
      sensorName: '',
      unit: '°C',
      minThreshold: '',
      maxThreshold: ''
    });
    setShowSensorModal(true);
  };

  const handleSensorTypeChange = (type) => {
    const sensorType = SENSOR_TYPES.find(s => s.value === type);
    setSensorForm({
      ...sensorForm,
      sensorType: type,
      unit: sensorType?.unit || ''
    });
  };

  const handleAddSensor = async (e) => {
    e.preventDefault();
    if (!sensorForm.sensorName) {
      toast.error('Please enter sensor name');
      return;
    }

    try {
      const data = {
        ...sensorForm,
        minThreshold: sensorForm.minThreshold ? parseFloat(sensorForm.minThreshold) : undefined,
        maxThreshold: sensorForm.maxThreshold ? parseFloat(sensorForm.maxThreshold) : undefined
      };
      await deviceService.addSensor(selectedDevice.id, data);
      toast.success('Sensor added successfully');
      setShowSensorModal(false);
      loadDevices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add sensor');
    }
  };

  // Actuator handlers
  const openActuatorModal = (device) => {
    setSelectedDevice(device);
    setActuatorForm({ actuatorType: 'FAN', actuatorName: '', gpioPin: '' });
    setShowActuatorModal(true);
  };

  const handleAddActuator = async (e) => {
    e.preventDefault();
    if (!actuatorForm.actuatorName) {
      toast.error('Please enter actuator name');
      return;
    }

    try {
      const data = {
        ...actuatorForm,
        gpioPin: actuatorForm.gpioPin ? parseInt(actuatorForm.gpioPin) : undefined
      };
      await deviceService.addActuator(selectedDevice.id, data);
      toast.success('Actuator added successfully');
      setShowActuatorModal(false);
      loadDevices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add actuator');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link to={`/farms/${farmId}`} className="p-2 hover:bg-gray-100 rounded-lg">
            <FiArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Device Management</h1>
            <p className="text-gray-500 text-sm">Manage devices, sensors, and actuators</p>
          </div>
        </div>
        <button
          onClick={() => setShowDeviceModal(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <FiPlus size={18} />
          Add Device
        </button>
      </div>

      {/* Devices List */}
      {devices.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <div className="text-6xl mb-4">📡</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No devices yet</h2>
          <p className="text-gray-500 mb-6">Register your first IoT device to start monitoring</p>
          <button
            onClick={() => setShowDeviceModal(true)}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Add First Device
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {devices.map((device) => (
            <div key={device.id} className="bg-white rounded-xl shadow overflow-hidden">
              {/* Device Header */}
              <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${device.isOnline ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <FiCpu className={device.isOnline ? 'text-green-600' : 'text-gray-400'} size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      {device.deviceName}
                      {device.isOnline ? (
                        <FiWifi className="text-green-500" size={16} />
                      ) : (
                        <FiWifiOff className="text-gray-400" size={16} />
                      )}
                    </h3>
                    <p className="text-sm text-gray-500">
                      MAC: {device.macAddress} • {device.deviceType}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openSensorModal(device)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm"
                  >
                    <FiThermometer size={14} />
                    Add Sensor
                  </button>
                  <button
                    onClick={() => openActuatorModal(device)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm"
                  >
                    <FiPower size={14} />
                    Add Actuator
                  </button>
                  <button
                    onClick={() => handleDeleteDevice(device.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Sensors & Actuators */}
              <div className="p-4 grid md:grid-cols-2 gap-4">
                {/* Sensors */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
                    <FiThermometer size={14} />
                    Sensors ({device.sensors?.length || 0})
                  </h4>
                  {device.sensors?.length > 0 ? (
                    <div className="space-y-2">
                      {device.sensors.map((sensor) => (
                        <div key={sensor.id} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{sensor.sensorName}</p>
                            <p className="text-xs text-gray-500">{sensor.sensorType} • {sensor.unit}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-600">
                              {sensor.lastReading !== null ? `${sensor.lastReading}${sensor.unit}` : '--'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No sensors configured</p>
                  )}
                </div>

                {/* Actuators */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
                    <FiPower size={14} />
                    Actuators ({device.actuators?.length || 0})
                  </h4>
                  {device.actuators?.length > 0 ? (
                    <div className="space-y-2">
                      {device.actuators.map((actuator) => (
                        <div key={actuator.id} className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{actuator.actuatorName}</p>
                            <p className="text-xs text-gray-500">
                              {actuator.actuatorType} {actuator.gpioPin ? `• GPIO ${actuator.gpioPin}` : ''}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            actuator.currentState === 'ON' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {actuator.currentState}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No actuators configured</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Device Modal */}
      {showDeviceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Register New Device</h2>
              <form onSubmit={handleAddDevice} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    MAC Address *
                  </label>
                  <input
                    type="text"
                    value={deviceForm.macAddress}
                    onChange={(e) => setDeviceForm({ ...deviceForm, macAddress: e.target.value })}
                    placeholder="AA:BB:CC:DD:EE:FF"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Find this on your device or Raspberry Pi</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Device Name *
                  </label>
                  <input
                    type="text"
                    value={deviceForm.deviceName}
                    onChange={(e) => setDeviceForm({ ...deviceForm, deviceName: e.target.value })}
                    placeholder="e.g., Main Gateway"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Device Type
                  </label>
                  <select
                    value={deviceForm.deviceType}
                    onChange={(e) => setDeviceForm({ ...deviceForm, deviceType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    {DEVICE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowDeviceModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Register Device
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Sensor Modal */}
      {showSensorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-1">Add Sensor</h2>
              <p className="text-sm text-gray-500 mb-4">to {selectedDevice?.deviceName}</p>
              
              <form onSubmit={handleAddSensor} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sensor Type *
                  </label>
                  <select
                    value={sensorForm.sensorType}
                    onChange={(e) => handleSensorTypeChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {SENSOR_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sensor Name *
                  </label>
                  <input
                    type="text"
                    value={sensorForm.sensorName}
                    onChange={(e) => setSensorForm({ ...sensorForm, sensorName: e.target.value })}
                    placeholder="e.g., Zone 1 Temperature"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={sensorForm.unit}
                    onChange={(e) => setSensorForm({ ...sensorForm, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Threshold
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={sensorForm.minThreshold}
                      onChange={(e) => setSensorForm({ ...sensorForm, minThreshold: e.target.value })}
                      placeholder="e.g., 18"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Threshold
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={sensorForm.maxThreshold}
                      onChange={(e) => setSensorForm({ ...sensorForm, maxThreshold: e.target.value })}
                      placeholder="e.g., 35"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">Alerts will trigger when readings exceed thresholds</p>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowSensorModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Sensor
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Actuator Modal */}
      {showActuatorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-1">Add Actuator</h2>
              <p className="text-sm text-gray-500 mb-4">to {selectedDevice?.deviceName}</p>
              
              <form onSubmit={handleAddActuator} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Actuator Type *
                  </label>
                  <select
                    value={actuatorForm.actuatorType}
                    onChange={(e) => setActuatorForm({ ...actuatorForm, actuatorType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    {ACTUATOR_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Actuator Name *
                  </label>
                  <input
                    type="text"
                    value={actuatorForm.actuatorName}
                    onChange={(e) => setActuatorForm({ ...actuatorForm, actuatorName: e.target.value })}
                    placeholder="e.g., Exhaust Fan 1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GPIO Pin
                  </label>
                  <input
                    type="number"
                    value={actuatorForm.gpioPin}
                    onChange={(e) => setActuatorForm({ ...actuatorForm, gpioPin: e.target.value })}
                    placeholder="e.g., 17"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">BCM GPIO pin number on Raspberry Pi</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowActuatorModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Add Actuator
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
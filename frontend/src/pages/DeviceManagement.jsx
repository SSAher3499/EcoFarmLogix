import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  FiArrowLeft, FiPlus, FiTrash2, FiEdit2, FiCpu, 
  FiThermometer, FiDroplet, FiPower, FiWifi, FiWifiOff,
  FiSettings, FiInfo, FiSave
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import deviceService from '../services/device.service';

// Device Types
const DEVICE_TYPES = [
  { value: 'GATEWAY', label: 'Gateway (Raspberry Pi)' },
  { value: 'SENSOR_NODE', label: 'Sensor Node' },
  { value: 'RELAY_NODE', label: 'Relay Node' },
  { value: 'CAMERA', label: 'Camera' }
];

// Connection Types
const CONNECTION_TYPES = [
  { value: 'GPIO', label: 'GPIO (Direct Pin)' },
  { value: 'MODBUS_RTU', label: 'Modbus RTU (RS485)' },
  { value: 'MODBUS_TCP', label: 'Modbus TCP/IP' },
  { value: 'ANALOG', label: 'Analog (ADC)' },
  { value: 'I2C', label: 'I2C Bus' }
];

// Sensor Types
const SENSOR_TYPES = [
  { value: 'TEMPERATURE', label: 'Temperature', unit: '°C' },
  { value: 'HUMIDITY', label: 'Humidity', unit: '%' },
  { value: 'SOIL_MOISTURE', label: 'Soil Moisture', unit: '%' },
  { value: 'SOIL_TEMPERATURE', label: 'Soil Temperature', unit: '°C' },
  { value: 'LIGHT', label: 'Light Intensity', unit: 'lux' },
  { value: 'CO2', label: 'CO2 Level', unit: 'ppm' },
  { value: 'PH', label: 'pH Level', unit: 'pH' },
  { value: 'EC', label: 'Electrical Conductivity', unit: 'mS/cm' },
  { value: 'WATER_LEVEL', label: 'Water Level', unit: 'cm' },
  { value: 'WATER_FLOW', label: 'Water Flow Rate', unit: 'L/min' },
  { value: 'PRESSURE', label: 'Pressure', unit: 'kPa' }
];

// Actuator Types
const ACTUATOR_TYPES = [
  { value: 'FAN', label: 'Fan' },
  { value: 'EXHAUST_FAN', label: 'Exhaust Fan' },
  { value: 'FOGGER', label: 'Fogger/Mister' },
  { value: 'IRRIGATION_VALVE', label: 'Irrigation Valve' },
  { value: 'SHADE_NET', label: 'Shade Net Motor' },
  { value: 'GROW_LIGHT', label: 'Grow Light' },
  { value: 'HEATER', label: 'Heater' },
  { value: 'COOLER', label: 'Cooler/AC' },
  { value: 'WATER_PUMP', label: 'Water Pump' },
  { value: 'DOSING_PUMP', label: 'Dosing Pump' },
  { value: 'RELAY', label: 'Generic Relay' }
];

// Modbus Function Codes
const FUNCTION_CODES = [
  { value: 1, label: '01 - Read Coils (Digital Output Status)' },
  { value: 2, label: '02 - Read Discrete Inputs (Digital Input Status)' },
  { value: 3, label: '03 - Read Holding Registers (Analog Output)' },
  { value: 4, label: '04 - Read Input Registers (Analog Input)' }
];

// Data Types for Modbus
const DATA_TYPES = [
  { value: 'INT16', label: 'INT16 (Signed 16-bit)', registers: 1 },
  { value: 'UINT16', label: 'UINT16 (Unsigned 16-bit)', registers: 1 },
  { value: 'INT32', label: 'INT32 (Signed 32-bit)', registers: 2 },
  { value: 'UINT32', label: 'UINT32 (Unsigned 32-bit)', registers: 2 },
  { value: 'FLOAT32', label: 'FLOAT32 (32-bit Float)', registers: 2 }
];

// Byte Order Options
const BYTE_ORDERS = [
  { value: 'AB', label: 'AB - Big Endian (16-bit)' },
  { value: 'BA', label: 'BA - Little Endian (16-bit)' },
  { value: 'ABCD', label: 'ABCD - Big Endian (32-bit)' },
  { value: 'DCBA', label: 'DCBA - Little Endian (32-bit)' },
  { value: 'CDAB', label: 'CDAB - Mid-Big Endian (32-bit)' },
  { value: 'BADC', label: 'BADC - Mid-Little Endian (32-bit)' }
];

// Serial Port Baud Rates
const BAUD_RATES = [1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200];

// Parity Options
const PARITY_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'even', label: 'Even' },
  { value: 'odd', label: 'Odd' }
];

export default function DeviceManagement() {
  const { farmId } = useParams();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showSensorModal, setShowSensorModal] = useState(false);
  const [showActuatorModal, setShowActuatorModal] = useState(false);
  const [showSerialConfigModal, setShowSerialConfigModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  
  // Form states
  const [deviceForm, setDeviceForm] = useState({
    macAddress: '',
    deviceName: '',
    deviceType: 'GATEWAY'
  });
  
  // Full Sensor Form with Modbus support
  const [sensorForm, setSensorForm] = useState({
    sensorType: 'TEMPERATURE',
    sensorName: '',
    unit: '°C',
    connectionType: 'MODBUS_RTU',
    // Modbus Configuration
    slaveId: 1,
    functionCode: 3,
    registerAddress: 0,
    registerCount: 1,
    dataType: 'INT16',
    byteOrder: 'AB',
    // Value Conversion
    scaleFactor: 1,
    offset: 0,
    decimalPlaces: 1,
    // Thresholds
    minThreshold: '',
    maxThreshold: '',
    // GPIO (if not Modbus)
    gpioPin: ''
  });
  
  // Full Actuator Form with Modbus support
  const [actuatorForm, setActuatorForm] = useState({
    actuatorType: 'RELAY',
    actuatorName: '',
    connectionType: 'GPIO',
    // GPIO Configuration
    gpioPin: '',
    // Modbus Configuration
    slaveId: 1,
    registerAddress: 0
  });

  // Serial Port Configuration Form
  const [serialConfigForm, setSerialConfigForm] = useState({
    portName: '/dev/ttyUSB0',
    baudRate: 9600,
    dataBits: 8,
    parity: 'none',
    stopBits: 1,
    timeout: 1000,
    retries: 3,
    pollInterval: 5000
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

  // ==========================================
  // DEVICE HANDLERS
  // ==========================================

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

  // ==========================================
  // SENSOR HANDLERS
  // ==========================================

  const openSensorModal = (device) => {
    setSelectedDevice(device);
    setSensorForm({
      sensorType: 'TEMPERATURE',
      sensorName: '',
      unit: '°C',
      connectionType: 'MODBUS_RTU',
      slaveId: 1,
      functionCode: 3,
      registerAddress: 0,
      registerCount: 1,
      dataType: 'INT16',
      byteOrder: 'AB',
      scaleFactor: 1,
      offset: 0,
      decimalPlaces: 1,
      minThreshold: '',
      maxThreshold: '',
      gpioPin: ''
    });
    setShowSensorModal(true);
  };

  const handleSensorTypeChange = (type) => {
    const sensorType = SENSOR_TYPES.find(s => s.value === type);
    setSensorForm({
      ...sensorForm,
      sensorType: type,
      unit: sensorType?.unit || '',
      sensorName: sensorForm.sensorName || sensorType?.label || ''
    });
  };

  const handleAddSensor = async (e) => {
    e.preventDefault();
    if (!sensorForm.sensorName) {
      toast.error('Please enter sensor name');
      return;
    }

    // Validate Modbus fields
    const isModbus = sensorForm.connectionType === 'MODBUS_RTU' || sensorForm.connectionType === 'MODBUS_TCP';
    if (isModbus) {
      if (!sensorForm.slaveId || sensorForm.registerAddress === undefined) {
        toast.error('Slave ID and Register Address are required for Modbus sensors');
        return;
      }
    }

    try {
      const data = {
        ...sensorForm,
        slaveId: isModbus ? parseInt(sensorForm.slaveId) : undefined,
        functionCode: isModbus ? parseInt(sensorForm.functionCode) : undefined,
        registerAddress: isModbus ? parseInt(sensorForm.registerAddress) : undefined,
        registerCount: isModbus ? parseInt(sensorForm.registerCount) : undefined,
        scaleFactor: parseFloat(sensorForm.scaleFactor) || 1,
        offset: parseFloat(sensorForm.offset) || 0,
        decimalPlaces: parseInt(sensorForm.decimalPlaces) || 1,
        minThreshold: sensorForm.minThreshold ? parseFloat(sensorForm.minThreshold) : undefined,
        maxThreshold: sensorForm.maxThreshold ? parseFloat(sensorForm.maxThreshold) : undefined,
        gpioPin: !isModbus && sensorForm.gpioPin ? parseInt(sensorForm.gpioPin) : undefined
      };
      
      await deviceService.addSensor(selectedDevice.id, data);
      toast.success('Sensor added successfully');
      setShowSensorModal(false);
      loadDevices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add sensor');
    }
  };

  const handleDeleteSensor = async (sensorId, sensorName) => {
    if (!confirm(`Delete sensor "${sensorName}"? This cannot be undone.`)) return;

    try {
      await deviceService.deleteSensor(sensorId);
      toast.success('Sensor deleted');
      loadDevices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete sensor');
    }
  };

  // ==========================================
  // ACTUATOR HANDLERS
  // ==========================================

  const openActuatorModal = (device) => {
    setSelectedDevice(device);
    setActuatorForm({
      actuatorType: 'RELAY',
      actuatorName: '',
      connectionType: 'GPIO',
      gpioPin: '',
      slaveId: 1,
      registerAddress: 0
    });
    setShowActuatorModal(true);
  };

  const handleAddActuator = async (e) => {
    e.preventDefault();
    if (!actuatorForm.actuatorName) {
      toast.error('Please enter actuator name');
      return;
    }

    const isModbus = actuatorForm.connectionType === 'MODBUS_RTU';
    
    // Validate based on connection type
    if (isModbus) {
      if (!actuatorForm.slaveId || actuatorForm.registerAddress === undefined) {
        toast.error('Slave ID and Register Address are required for Modbus actuators');
        return;
      }
    } else {
      if (!actuatorForm.gpioPin) {
        toast.error('GPIO Pin is required');
        return;
      }
    }

    try {
      const data = {
        ...actuatorForm,
        slaveId: isModbus ? parseInt(actuatorForm.slaveId) : undefined,
        registerAddress: isModbus ? parseInt(actuatorForm.registerAddress) : undefined,
        gpioPin: !isModbus && actuatorForm.gpioPin ? parseInt(actuatorForm.gpioPin) : undefined
      };
      
      await deviceService.addActuator(selectedDevice.id, data);
      toast.success('Actuator added successfully');
      setShowActuatorModal(false);
      loadDevices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add actuator');
    }
  };

  const handleDeleteActuator = async (actuatorId, actuatorName) => {
    if (!confirm(`Delete actuator "${actuatorName}"? This cannot be undone.`)) return;

    try {
      await deviceService.deleteActuator(actuatorId);
      toast.success('Actuator deleted');
      loadDevices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete actuator');
    }
  };

  // ==========================================
  // SERIAL CONFIG HANDLERS
  // ==========================================

  const openSerialConfigModal = (device) => {
    setSelectedDevice(device);
    // Load existing config or use defaults
    const existingConfig = device.serialConfig || {};
    setSerialConfigForm({
      portName: existingConfig.portName || '/dev/ttyUSB0',
      baudRate: existingConfig.baudRate || 9600,
      dataBits: existingConfig.dataBits || 8,
      parity: existingConfig.parity || 'none',
      stopBits: existingConfig.stopBits || 1,
      timeout: existingConfig.timeout || 1000,
      retries: existingConfig.retries || 3,
      pollInterval: existingConfig.pollInterval || 5000
    });
    setShowSerialConfigModal(true);
  };

  const handleSaveSerialConfig = async (e) => {
    e.preventDefault();
    
    try {
      await deviceService.updateSerialConfig(selectedDevice.id, serialConfigForm);
      toast.success('Serial port configuration saved');
      setShowSerialConfigModal(false);
      loadDevices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save configuration');
    }
  };

  // ==========================================
  // RENDER HELPERS
  // ==========================================

  const isModbusSensor = sensorForm.connectionType === 'MODBUS_RTU' || sensorForm.connectionType === 'MODBUS_TCP';
  const isModbusActuator = actuatorForm.connectionType === 'MODBUS_RTU';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to={`/farms/${farmId}`} className="text-gray-500 hover:text-gray-700">
            <FiArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Device Management</h1>
            <p className="text-sm text-gray-500">Configure devices, sensors, and actuators with RS485 Modbus support</p>
          </div>
        </div>
        <button
          onClick={() => setShowDeviceModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <FiPlus size={18} />
          Add Device
        </button>
      </div>

      {/* Devices List */}
      {devices.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <FiCpu className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Devices Yet</h3>
          <p className="text-gray-500 mb-4">Register your first device to start monitoring</p>
          <button
            onClick={() => setShowDeviceModal(true)}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Add First Device
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {devices.map((device) => (
            <div key={device.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Device Header */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <FiCpu className="text-white" size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{device.deviceName}</h3>
                      <div className="flex items-center gap-3 text-green-100 text-sm">
                        <span>{device.macAddress}</span>
                        <span>•</span>
                        <span>{device.deviceType}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          {device.isOnline ? (
                            <>
                              <FiWifi className="text-green-300" />
                              <span className="text-green-300">Online</span>
                            </>
                          ) : (
                            <>
                              <FiWifiOff className="text-red-300" />
                              <span className="text-red-300">Offline</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openSerialConfigModal(device)}
                      className="p-2 bg-white/20 text-white rounded-lg hover:bg-white/30"
                      title="Serial Port Configuration"
                    >
                      <FiSettings size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteDevice(device.id)}
                      className="p-2 bg-red-500/80 text-white rounded-lg hover:bg-red-600"
                      title="Delete Device"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Device Content */}
              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Sensors Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                        <FiThermometer className="text-blue-500" />
                        Sensors ({device.sensors?.length || 0})
                      </h4>
                      <button
                        onClick={() => openSensorModal(device)}
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <FiPlus size={14} />
                        Add Sensor
                      </button>
                    </div>
                    
                    {device.sensors?.length > 0 ? (
                      <div className="space-y-2">
                        {device.sensors.map((sensor) => (
                          <div key={sensor.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-800">{sensor.sensorName}</p>
                              <p className="text-xs text-gray-500">
                                {sensor.connectionType === 'MODBUS_RTU' || sensor.connectionType === 'MODBUS_TCP' ? (
                                  <>Modbus: Slave {sensor.slaveId}, Reg {sensor.registerAddress}</>
                                ) : (
                                  <>GPIO: Pin {sensor.gpioPin || 'N/A'}</>
                                )}
                                {' • '}{sensor.sensorType}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-semibold text-blue-600">
                                {sensor.lastReading !== null ? `${sensor.lastReading}${sensor.unit || ''}` : '--'}
                              </span>
                              <button
                                onClick={() => handleDeleteSensor(sensor.id, sensor.sensorName)}
                                className="p-1 text-red-500 hover:text-red-700"
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No sensors configured</p>
                    )}
                  </div>

                  {/* Actuators Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                        <FiPower className="text-purple-500" />
                        Actuators ({device.actuators?.length || 0})
                      </h4>
                      <button
                        onClick={() => openActuatorModal(device)}
                        className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                      >
                        <FiPlus size={14} />
                        Add Actuator
                      </button>
                    </div>
                    
                    {device.actuators?.length > 0 ? (
                      <div className="space-y-2">
                        {device.actuators.map((actuator) => (
                          <div key={actuator.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-800">{actuator.actuatorName}</p>
                              <p className="text-xs text-gray-500">
                                {actuator.connectionType === 'MODBUS_RTU' ? (
                                  <>Modbus: Slave {actuator.slaveId}, Coil {actuator.registerAddress}</>
                                ) : (
                                  <>GPIO: Pin {actuator.gpioPin}</>
                                )}
                                {' • '}{actuator.actuatorType}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 text-xs font-semibold rounded ${
                                actuator.currentState === 'ON' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {actuator.currentState || 'OFF'}
                              </span>
                              <button
                                onClick={() => handleDeleteActuator(actuator.id, actuator.actuatorName)}
                                className="p-1 text-red-500 hover:text-red-700"
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No actuators configured</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==========================================
          ADD DEVICE MODAL
          ========================================== */}
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
                    onChange={(e) => setDeviceForm({ ...deviceForm, macAddress: e.target.value.toUpperCase() })}
                    placeholder="e.g., 2C:CF:67:90:5C:79"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Found on Raspberry Pi using: cat /sys/class/net/eth0/address</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Device Name *
                  </label>
                  <input
                    type="text"
                    value={deviceForm.deviceName}
                    onChange={(e) => setDeviceForm({ ...deviceForm, deviceName: e.target.value })}
                    placeholder="e.g., Greenhouse Controller"
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

      {/* ==========================================
          ADD SENSOR MODAL (WITH FULL MODBUS CONFIG)
          ========================================== */}
      {showSensorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-1">Add Sensor</h2>
              <p className="text-sm text-gray-500 mb-4">to {selectedDevice?.deviceName}</p>
              
              <form onSubmit={handleAddSensor} className="space-y-6">
                {/* Basic Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-3">Basic Information</h4>
                  <div className="grid grid-cols-2 gap-4">
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
                        Connection Type *
                      </label>
                      <select
                        value={sensorForm.connectionType}
                        onChange={(e) => setSensorForm({ ...sensorForm, connectionType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        {CONNECTION_TYPES.map((type) => (
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
                        placeholder="°C, %, pH, etc."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* GPIO Configuration (when not Modbus) */}
                {!isModbusSensor && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-3">GPIO Configuration</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        GPIO Pin
                      </label>
                      <input
                        type="number"
                        value={sensorForm.gpioPin}
                        onChange={(e) => setSensorForm({ ...sensorForm, gpioPin: e.target.value })}
                        placeholder="e.g., 4"
                        min="0"
                        max="40"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">BCM GPIO pin number on Raspberry Pi</p>
                    </div>
                  </div>
                )}

                {/* Modbus Configuration */}
                {isModbusSensor && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <h4 className="font-semibold text-blue-800">Modbus RS485 Configuration</h4>
                      <FiInfo className="text-blue-600" title="Configure Modbus register settings" />
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Slave ID *
                        </label>
                        <input
                          type="number"
                          value={sensorForm.slaveId}
                          onChange={(e) => setSensorForm({ ...sensorForm, slaveId: e.target.value })}
                          min="1"
                          max="247"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Device address (1-247)</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Function Code *
                        </label>
                        <select
                          value={sensorForm.functionCode}
                          onChange={(e) => setSensorForm({ ...sensorForm, functionCode: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {FUNCTION_CODES.map((fc) => (
                            <option key={fc.value} value={fc.value}>{fc.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Register Address *
                        </label>
                        <input
                          type="number"
                          value={sensorForm.registerAddress}
                          onChange={(e) => setSensorForm({ ...sensorForm, registerAddress: e.target.value })}
                          min="0"
                          max="65535"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Starting address (0-65535)</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Register Count
                        </label>
                        <input
                          type="number"
                          value={sensorForm.registerCount}
                          onChange={(e) => setSensorForm({ ...sensorForm, registerCount: e.target.value })}
                          min="1"
                          max="125"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Number of registers to read</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Data Type
                        </label>
                        <select
                          value={sensorForm.dataType}
                          onChange={(e) => {
                            const dt = DATA_TYPES.find(d => d.value === e.target.value);
                            setSensorForm({ 
                              ...sensorForm, 
                              dataType: e.target.value,
                              registerCount: dt?.registers || 1
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {DATA_TYPES.map((dt) => (
                            <option key={dt.value} value={dt.value}>{dt.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Byte Order
                        </label>
                        <select
                          value={sensorForm.byteOrder}
                          onChange={(e) => setSensorForm({ ...sensorForm, byteOrder: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {BYTE_ORDERS.map((bo) => (
                            <option key={bo.value} value={bo.value}>{bo.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Value Conversion */}
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-3">Value Conversion</h4>
                  <p className="text-xs text-yellow-700 mb-3">
                    Final Value = (Raw Value × Scale Factor) + Offset
                  </p>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Scale Factor
                      </label>
                      <input
                        type="number"
                        value={sensorForm.scaleFactor}
                        onChange={(e) => setSensorForm({ ...sensorForm, scaleFactor: e.target.value })}
                        step="0.001"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">e.g., 0.1 for ÷10</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Offset
                      </label>
                      <input
                        type="number"
                        value={sensorForm.offset}
                        onChange={(e) => setSensorForm({ ...sensorForm, offset: e.target.value })}
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Decimal Places
                      </label>
                      <input
                        type="number"
                        value={sensorForm.decimalPlaces}
                        onChange={(e) => setSensorForm({ ...sensorForm, decimalPlaces: e.target.value })}
                        min="0"
                        max="6"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Thresholds */}
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-red-800 mb-3">Alert Thresholds (Optional)</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min Threshold
                      </label>
                      <input
                        type="number"
                        value={sensorForm.minThreshold}
                        onChange={(e) => setSensorForm({ ...sensorForm, minThreshold: e.target.value })}
                        step="0.1"
                        placeholder="Alert if below"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Threshold
                      </label>
                      <input
                        type="number"
                        value={sensorForm.maxThreshold}
                        onChange={(e) => setSensorForm({ ...sensorForm, maxThreshold: e.target.value })}
                        step="0.1"
                        placeholder="Alert if above"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Buttons */}
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

      {/* ==========================================
          ADD ACTUATOR MODAL (WITH MODBUS SUPPORT)
          ========================================== */}
      {showActuatorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-1">Add Actuator</h2>
              <p className="text-sm text-gray-500 mb-4">to {selectedDevice?.deviceName}</p>
              
              <form onSubmit={handleAddActuator} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                      Connection Type *
                    </label>
                    <select
                      value={actuatorForm.connectionType}
                      onChange={(e) => setActuatorForm({ ...actuatorForm, connectionType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="GPIO">GPIO (Direct Pin)</option>
                      <option value="MODBUS_RTU">Modbus RTU (RS485)</option>
                    </select>
                  </div>
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

                {/* GPIO Config */}
                {!isModbusActuator && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-3">GPIO Configuration</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        GPIO Pin *
                      </label>
                      <input
                        type="number"
                        value={actuatorForm.gpioPin}
                        onChange={(e) => setActuatorForm({ ...actuatorForm, gpioPin: e.target.value })}
                        placeholder="e.g., 17"
                        min="0"
                        max="40"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">BCM GPIO pin number on Raspberry Pi</p>
                    </div>
                  </div>
                )}

                {/* Modbus Config */}
                {isModbusActuator && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-3">Modbus RS485 Configuration</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Slave ID *
                        </label>
                        <input
                          type="number"
                          value={actuatorForm.slaveId}
                          onChange={(e) => setActuatorForm({ ...actuatorForm, slaveId: e.target.value })}
                          min="1"
                          max="247"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Device address (1-247)</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Coil/Register Address *
                        </label>
                        <input
                          type="number"
                          value={actuatorForm.registerAddress}
                          onChange={(e) => setActuatorForm({ ...actuatorForm, registerAddress: e.target.value })}
                          min="0"
                          max="65535"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Coil address to write (0-65535)</p>
                      </div>
                    </div>
                  </div>
                )}

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

      {/* ==========================================
          SERIAL PORT CONFIGURATION MODAL
          ========================================== */}
      {showSerialConfigModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-1">Serial Port Configuration</h2>
              <p className="text-sm text-gray-500 mb-4">RS485/Modbus settings for {selectedDevice?.deviceName}</p>
              
              <form onSubmit={handleSaveSerialConfig} className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-3">Serial Port Settings</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Port Name
                      </label>
                      <select
                        value={serialConfigForm.portName}
                        onChange={(e) => setSerialConfigForm({ ...serialConfigForm, portName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
                      >
                        <option value="/dev/ttyUSB0">/dev/ttyUSB0 (USB-RS485)</option>
                        <option value="/dev/ttyUSB1">/dev/ttyUSB1</option>
                        <option value="/dev/ttyAMA0">/dev/ttyAMA0 (GPIO UART)</option>
                        <option value="/dev/serial0">/dev/serial0</option>
                        <option value="/dev/ttyS0">/dev/ttyS0</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Baud Rate
                      </label>
                      <select
                        value={serialConfigForm.baudRate}
                        onChange={(e) => setSerialConfigForm({ ...serialConfigForm, baudRate: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
                      >
                        {BAUD_RATES.map((rate) => (
                          <option key={rate} value={rate}>{rate}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data Bits
                      </label>
                      <select
                        value={serialConfigForm.dataBits}
                        onChange={(e) => setSerialConfigForm({ ...serialConfigForm, dataBits: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
                      >
                        <option value={7}>7</option>
                        <option value={8}>8</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Parity
                      </label>
                      <select
                        value={serialConfigForm.parity}
                        onChange={(e) => setSerialConfigForm({ ...serialConfigForm, parity: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
                      >
                        {PARITY_OPTIONS.map((p) => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stop Bits
                      </label>
                      <select
                        value={serialConfigForm.stopBits}
                        onChange={(e) => setSerialConfigForm({ ...serialConfigForm, stopBits: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
                      >
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Timeout (ms)
                      </label>
                      <input
                        type="number"
                        value={serialConfigForm.timeout}
                        onChange={(e) => setSerialConfigForm({ ...serialConfigForm, timeout: parseInt(e.target.value) })}
                        min="100"
                        max="10000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-3">Polling Settings</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Poll Interval (ms)
                      </label>
                      <input
                        type="number"
                        value={serialConfigForm.pollInterval}
                        onChange={(e) => setSerialConfigForm({ ...serialConfigForm, pollInterval: parseInt(e.target.value) })}
                        min="1000"
                        max="60000"
                        step="1000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">How often to read sensors (min: 1000ms)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Retries
                      </label>
                      <input
                        type="number"
                        value={serialConfigForm.retries}
                        onChange={(e) => setSerialConfigForm({ ...serialConfigForm, retries: parseInt(e.target.value) })}
                        min="0"
                        max="10"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Retry count on read failure</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowSerialConfigModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 flex items-center justify-center gap-2"
                  >
                    <FiSave size={18} />
                    Save Configuration
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
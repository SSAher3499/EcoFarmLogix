import { useState } from 'react';
import { FiPlus, FiInfo } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

const SENSOR_TYPES = [
  { value: 'TEMPERATURE', label: 'Temperature', unit: '°C' },
  { value: 'HUMIDITY', label: 'Humidity', unit: '%' },
  { value: 'SOIL_MOISTURE', label: 'Soil Moisture', unit: '%' },
  { value: 'PH', label: 'pH', unit: 'pH' },
  { value: 'EC', label: 'Electrical Conductivity', unit: 'mS/cm' },
  { value: 'CO2', label: 'CO2', unit: 'ppm' },
  { value: 'LIGHT', label: 'Light', unit: 'lux' },
  { value: 'PRESSURE', label: 'Pressure', unit: 'kPa' },
  { value: 'FLOW', label: 'Flow Rate', unit: 'L/min' }
];

const CONNECTION_TYPES = [
  { value: 'GPIO', label: 'GPIO (Direct)' },
  { value: 'MODBUS_RTU', label: 'Modbus RTU (RS485)' },
  { value: 'MODBUS_TCP', label: 'Modbus TCP' },
  { value: 'ANALOG', label: 'Analog (ADC)' },
  { value: 'I2C', label: 'I2C' }
];

const FUNCTION_CODES = [
  { value: 1, label: '01 - Read Coils' },
  { value: 2, label: '02 - Read Discrete Inputs' },
  { value: 3, label: '03 - Read Holding Registers' },
  { value: 4, label: '04 - Read Input Registers' }
];

const DATA_TYPES = [
  { value: 'INT16', label: 'INT16 (Signed 16-bit)' },
  { value: 'UINT16', label: 'UINT16 (Unsigned 16-bit)' },
  { value: 'INT32', label: 'INT32 (Signed 32-bit)' },
  { value: 'UINT32', label: 'UINT32 (Unsigned 32-bit)' },
  { value: 'FLOAT32', label: 'FLOAT32 (32-bit Float)' }
];

const BYTE_ORDERS = [
  { value: 'AB', label: 'AB (Big Endian)' },
  { value: 'BA', label: 'BA (Little Endian)' },
  { value: 'ABCD', label: 'ABCD (Big Endian 32-bit)' },
  { value: 'DCBA', label: 'DCBA (Little Endian 32-bit)' },
  { value: 'CDAB', label: 'CDAB (Mid-Big Endian)' },
  { value: 'BADC', label: 'BADC (Mid-Little Endian)' }
];

export default function ModbusSensorForm({ deviceId, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sensorType: 'TEMPERATURE',
    sensorName: '',
    unit: '°C',
    connectionType: 'MODBUS_RTU',
    
    // Modbus settings
    slaveId: 1,
    functionCode: 3,
    registerAddress: 0,
    registerCount: 1,
    dataType: 'INT16',
    byteOrder: 'AB',
    scaleFactor: 0.1,
    decimalPlaces: 1,
    offset: 0,
    
    // Thresholds
    minThreshold: '',
    maxThreshold: ''
  });

  const handleSensorTypeChange = (type) => {
    const selected = SENSOR_TYPES.find(s => s.value === type);
    setFormData({
      ...formData,
      sensorType: type,
      unit: selected?.unit || '',
      sensorName: formData.sensorName || selected?.label || ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.sensorName) {
      toast.error('Sensor name is required');
      return;
    }

    if (formData.connectionType === 'MODBUS_RTU' || formData.connectionType === 'MODBUS_TCP') {
      if (!formData.slaveId || !formData.registerAddress === undefined) {
        toast.error('Slave ID and Register Address are required for Modbus');
        return;
      }
    }

    setLoading(true);
    
    try {
      await api.post(`/devices/${deviceId}/sensors`, {
        ...formData,
        minThreshold: formData.minThreshold ? parseFloat(formData.minThreshold) : null,
        maxThreshold: formData.maxThreshold ? parseFloat(formData.maxThreshold) : null
      });
      
      toast.success('Sensor added successfully');
      onSuccess?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add sensor');
    } finally {
      setLoading(false);
    }
  };

  const isModbus = formData.connectionType === 'MODBUS_RTU' || formData.connectionType === 'MODBUS_TCP';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-700 mb-3">Basic Information</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sensor Type *
            </label>
            <select
              value={formData.sensorType}
              onChange={(e) => handleSensorTypeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
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
              value={formData.connectionType}
              onChange={(e) => setFormData({ ...formData, connectionType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
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
              value={formData.sensorName}
              onChange={(e) => setFormData({ ...formData, sensorName: e.target.value })}
              placeholder="e.g., Zone 1 Temperature"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit
            </label>
            <input
              type="text"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              placeholder="°C, %, pH, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {/* Modbus Configuration */}
      {isModbus && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <h4 className="font-semibold text-blue-800">Modbus Configuration</h4>
            <FiInfo className="text-blue-600" title="Configure Modbus register settings" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slave ID *
              </label>
              <input
                type="number"
                value={formData.slaveId}
                onChange={(e) => setFormData({ ...formData, slaveId: parseInt(e.target.value) })}
                min="1"
                max="247"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">1-247</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Function Code *
              </label>
              <select
                value={formData.functionCode}
                onChange={(e) => setFormData({ ...formData, functionCode: parseInt(e.target.value) })}
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
                value={formData.registerAddress}
                onChange={(e) => setFormData({ ...formData, registerAddress: parseInt(e.target.value) })}
                min="0"
                max="65535"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">0-65535</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Register Count
              </label>
              <input
                type="number"
                value={formData.registerCount}
                onChange={(e) => setFormData({ ...formData, registerCount: parseInt(e.target.value) })}
                min="1"
                max="125"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Type
              </label>
              <select
                value={formData.dataType}
                onChange={(e) => setFormData({ ...formData, dataType: e.target.value })}
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
                value={formData.byteOrder}
                onChange={(e) => setFormData({ ...formData, byteOrder: e.target.value })}
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
              value={formData.scaleFactor}
              onChange={(e) => setFormData({ ...formData, scaleFactor: parseFloat(e.target.value) })}
              step="0.001"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
            />
            <p className="text-xs text-gray-500 mt-1">e.g., 0.1 for ÷10</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Decimal Places
            </label>
            <input
              type="number"
              value={formData.decimalPlaces}
              onChange={(e) => setFormData({ ...formData, decimalPlaces: parseInt(e.target.value) })}
              min="0"
              max="6"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Offset
            </label>
            <input
              type="number"
              value={formData.offset}
              onChange={(e) => setFormData({ ...formData, offset: parseFloat(e.target.value) })}
              step="0.1"
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
              value={formData.minThreshold}
              onChange={(e) => setFormData({ ...formData, minThreshold: e.target.value })}
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
              value={formData.maxThreshold}
              onChange={(e) => setFormData({ ...formData, maxThreshold: e.target.value })}
              step="0.1"
              placeholder="Alert if above"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          <FiPlus />
          {loading ? 'Adding...' : 'Add Sensor'}
        </button>
      </div>
    </form>
  );
}
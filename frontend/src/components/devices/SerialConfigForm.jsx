import { useState, useEffect } from 'react';
import { FiSave, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

const BAUD_RATES = [9600, 19200, 38400, 57600, 115200];
const DATA_BITS = [7, 8];
const PARITY_OPTIONS = ['none', 'even', 'odd'];
const STOP_BITS = [1, 2];

export default function SerialConfigForm({ deviceId, onSave }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
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
    loadConfig();
  }, [deviceId]);

  const loadConfig = async () => {
    try {
      const response = await api.get(`/devices/${deviceId}/serial-config`);
      setConfig(response.data.data.config);
    } catch (error) {
      console.error('Failed to load serial config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await api.put(`/devices/${deviceId}/serial-config`, config);
      toast.success('Serial configuration saved');
      onSave?.();
    } catch (error) {
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-100 h-64 rounded-lg"></div>;
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        🔌 Serial Port Configuration
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Port Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Serial Port
          </label>
          <select
            value={config.portName}
            onChange={(e) => setConfig({ ...config, portName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="/dev/ttyUSB0">USB0 (/dev/ttyUSB0)</option>
            <option value="/dev/ttyUSB1">USB1 (/dev/ttyUSB1)</option>
            <option value="/dev/ttyAMA0">UART (/dev/ttyAMA0)</option>
            <option value="/dev/ttyS0">Mini UART (/dev/ttyS0)</option>
            <option value="/dev/serial0">Serial0 (/dev/serial0)</option>
          </select>
        </div>

        {/* Baud Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Baud Rate
          </label>
          <select
            value={config.baudRate}
            onChange={(e) => setConfig({ ...config, baudRate: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            {BAUD_RATES.map((rate) => (
              <option key={rate} value={rate}>{rate}</option>
            ))}
          </select>
        </div>

        {/* Data Bits */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data Bits
          </label>
          <select
            value={config.dataBits}
            onChange={(e) => setConfig({ ...config, dataBits: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            {DATA_BITS.map((bits) => (
              <option key={bits} value={bits}>{bits}</option>
            ))}
          </select>
        </div>

        {/* Parity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Parity
          </label>
          <select
            value={config.parity}
            onChange={(e) => setConfig({ ...config, parity: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            {PARITY_OPTIONS.map((parity) => (
              <option key={parity} value={parity}>
                {parity.charAt(0).toUpperCase() + parity.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Stop Bits */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stop Bits
          </label>
          <select
            value={config.stopBits}
            onChange={(e) => setConfig({ ...config, stopBits: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            {STOP_BITS.map((bits) => (
              <option key={bits} value={bits}>{bits}</option>
            ))}
          </select>
        </div>

        {/* Timeout */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Timeout (ms)
          </label>
          <input
            type="number"
            value={config.timeout}
            onChange={(e) => setConfig({ ...config, timeout: parseInt(e.target.value) })}
            min="100"
            max="10000"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Retries */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Retries
          </label>
          <input
            type="number"
            value={config.retries}
            onChange={(e) => setConfig({ ...config, retries: parseInt(e.target.value) })}
            min="0"
            max="10"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Poll Interval */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Poll Interval (ms)
          </label>
          <input
            type="number"
            value={config.pollInterval}
            onChange={(e) => setConfig({ ...config, pollInterval: parseInt(e.target.value) })}
            min="1000"
            max="60000"
            step="1000"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? <FiRefreshCw className="animate-spin" /> : <FiSave />}
          Save Configuration
        </button>
      </div>
    </form>
  );
}
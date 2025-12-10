import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiTrash2, FiEdit2, FiPower, FiZap } from 'react-icons/fi';
import toast from 'react-hot-toast';
import automationService from '../services/automation.service';

const CONDITIONS = {
  GREATER_THAN: '>',
  LESS_THAN: '<',
  GREATER_THAN_OR_EQUAL: '≥',
  LESS_THAN_OR_EQUAL: '≤',
  EQUAL_TO: '='
};

export default function AutomationRules() {
  const { farmId } = useParams();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [components, setComponents] = useState({ sensors: [], actuators: [] });
  const [formData, setFormData] = useState({
    name: '',
    sensorId: '',
    condition: 'GREATER_THAN',
    value: '',
    actuatorId: '',
    actionState: 'ON',
    cooldownMinutes: 5
  });

  useEffect(() => {
    loadRules();
    loadComponents();
  }, [farmId]);

  const loadRules = async () => {
    try {
      const data = await automationService.getFarmRules(farmId);
      setRules(data.data.rules);
    } catch (error) {
      toast.error('Failed to load automation rules');
    } finally {
      setLoading(false);
    }
  };

  const loadComponents = async () => {
    try {
      const data = await automationService.getFarmComponents(farmId);
      setComponents(data.data);
    } catch (error) {
      console.error('Failed to load components:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.sensorId || !formData.actuatorId || !formData.value) {
      toast.error('Please fill all required fields');
      return;
    }

    const ruleData = {
      name: formData.name,
      actuatorId: formData.actuatorId,
      triggerType: 'SENSOR_VALUE',
      triggerConfig: {
        sensorId: formData.sensorId,
        condition: formData.condition,
        value: parseFloat(formData.value),
        cooldownMinutes: parseInt(formData.cooldownMinutes)
      },
      actionConfig: {
        state: formData.actionState
      }
    };

    try {
      if (editingRule) {
        await automationService.updateRule(editingRule.id, ruleData);
        toast.success('Rule updated successfully');
      } else {
        await automationService.createRule(farmId, ruleData);
        toast.success('Rule created successfully');
      }
      setShowModal(false);
      resetForm();
      loadRules();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save rule');
    }
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      sensorId: rule.triggerConfig?.sensorId || '',
      condition: rule.triggerConfig?.condition || 'GREATER_THAN',
      value: rule.triggerConfig?.value || '',
      actuatorId: rule.actuatorId,
      actionState: rule.actionConfig?.state || 'ON',
      cooldownMinutes: rule.triggerConfig?.cooldownMinutes || 5
    });
    setShowModal(true);
  };

  const handleDelete = async (ruleId) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      await automationService.deleteRule(ruleId);
      toast.success('Rule deleted');
      loadRules();
    } catch (error) {
      toast.error('Failed to delete rule');
    }
  };

  const handleToggle = async (ruleId) => {
    try {
      await automationService.toggleRule(ruleId);
      loadRules();
    } catch (error) {
      toast.error('Failed to toggle rule');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sensorId: '',
      condition: 'GREATER_THAN',
      value: '',
      actuatorId: '',
      actionState: 'ON',
      cooldownMinutes: 5
    });
    setEditingRule(null);
  };

  const openNewRuleModal = () => {
    resetForm();
    setShowModal(true);
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
            <h1 className="text-2xl font-bold text-gray-800">Automation Rules</h1>
            <p className="text-gray-500 text-sm">Create rules to automate your farm</p>
          </div>
        </div>
        <button
          onClick={openNewRuleModal}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <FiPlus size={18} />
          Add Rule
        </button>
      </div>

      {/* Rules List */}
      {rules.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <div className="text-6xl mb-4">🤖</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No automation rules yet</h2>
          <p className="text-gray-500 mb-6">Create your first rule to automate actuators based on sensor readings</p>
          <button
            onClick={openNewRuleModal}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Create First Rule
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {rules.map((rule) => (
            <div key={rule.id} className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FiZap className={rule.isEnabled ? 'text-yellow-500' : 'text-gray-400'} size={20} />
                    <h3 className="text-lg font-semibold text-gray-800">{rule.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      rule.isEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {rule.isEnabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <span className="font-medium">IF</span>{' '}
                      <span className="text-blue-600">{rule.sensor?.sensorName || 'Unknown Sensor'}</span>{' '}
                      <span className="font-mono bg-gray-100 px-1 rounded">
                        {CONDITIONS[rule.triggerConfig?.condition]} {rule.triggerConfig?.value}
                      </span>{' '}
                      {rule.sensor?.unit}
                    </p>
                    <p>
                      <span className="font-medium">THEN</span>{' '}
                      <span className="text-purple-600">{rule.actuator?.actuatorName}</span>{' '}
                      <span className={`font-semibold ${
                        rule.actionConfig?.state === 'ON' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        → {rule.actionConfig?.state}
                      </span>
                    </p>
                    <p className="text-xs text-gray-400">
                      Cooldown: {rule.triggerConfig?.cooldownMinutes || 5} minutes
                      {rule.lastRunAt && ` • Last triggered: ${new Date(rule.lastRunAt).toLocaleString()}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(rule.id)}
                    className={`p-2 rounded-lg ${
                      rule.isEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}
                    title={rule.isEnabled ? 'Disable' : 'Enable'}
                  >
                    <FiPower size={18} />
                  </button>
                  <button
                    onClick={() => handleEdit(rule)}
                    className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                    title="Edit"
                  >
                    <FiEdit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                    title="Delete"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                {editingRule ? 'Edit Rule' : 'Create Automation Rule'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Rule Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rule Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., High Temp Fan Control"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* IF Section */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-blue-800 mb-3">IF (Trigger Condition)</p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Sensor *</label>
                      <select
                        value={formData.sensorId}
                        onChange={(e) => setFormData({ ...formData, sensorId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="">Select Sensor</option>
                        {components.sensors.map((sensor) => (
                          <option key={sensor.id} value={sensor.id}>
                            {sensor.sensorName} ({sensor.sensorType}) - {sensor.deviceName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Condition *</label>
                        <select
                          value={formData.condition}
                          onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="GREATER_THAN">Greater than (&gt;)</option>
                          <option value="LESS_THAN">Less than (&lt;)</option>
                          <option value="GREATER_THAN_OR_EQUAL">Greater or equal (≥)</option>
                          <option value="LESS_THAN_OR_EQUAL">Less or equal (≤)</option>
                          <option value="EQUAL_TO">Equal to (=)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Value *</label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.value}
                          onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                          placeholder="35"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* THEN Section */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-purple-800 mb-3">THEN (Action)</p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Actuator *</label>
                      <select
                        value={formData.actuatorId}
                        onChange={(e) => setFormData({ ...formData, actuatorId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="">Select Actuator</option>
                        {components.actuators.map((actuator) => (
                          <option key={actuator.id} value={actuator.id}>
                            {actuator.actuatorName} ({actuator.actuatorType}) - {actuator.deviceName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Set State To</label>
                      <select
                        value={formData.actionState}
                        onChange={(e) => setFormData({ ...formData, actionState: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="ON">Turn ON</option>
                        <option value="OFF">Turn OFF</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Cooldown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cooldown (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.cooldownMinutes}
                    onChange={(e) => setFormData({ ...formData, cooldownMinutes: e.target.value })}
                    min="1"
                    max="60"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Prevents rapid toggling. Rule won't trigger again within this period.
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    {editingRule ? 'Update Rule' : 'Create Rule'}
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
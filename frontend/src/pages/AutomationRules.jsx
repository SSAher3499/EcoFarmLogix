import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiTrash2, FiEdit2, FiPower, FiZap } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useTranslation } from '../hooks/useTranslation';
import automationService from '../services/automation.service';
import { useAuthStore } from '../store/authStore';

const CONDITIONS = {
  GREATER_THAN: '>',
  LESS_THAN: '<',
  GREATER_THAN_OR_EQUAL: '≥',
  LESS_THAN_OR_EQUAL: '≤',
  EQUAL_TO: '='
};

export default function AutomationRules() {
  const { farmId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
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

  // Get user from store
  const user = useAuthStore((state) => state.user);

  // Calculate permissions based on user role
  const userRole = user?.role || 'VIEWER';
  const canViewAutomation = ['SUPER_ADMIN', 'FARM_OWNER', 'MANAGER'].includes(userRole);
  const canCreateAutomation = ['SUPER_ADMIN', 'FARM_OWNER', 'MANAGER'].includes(userRole);
  const canEditAutomation = ['SUPER_ADMIN', 'FARM_OWNER', 'MANAGER'].includes(userRole);
  const canDeleteAutomation = ['SUPER_ADMIN', 'FARM_OWNER'].includes(userRole);

  useEffect(() => {
    // Redirect if no permission
    if (!canViewAutomation) {
      toast.error(t('messages.permissionDenied'));
      navigate(`/farms/${farmId}`);
      return;
    }
    loadRules();
    loadComponents();
  }, [farmId, canViewAutomation, navigate, t]);

  const loadRules = async () => {
    try {
      const data = await automationService.getFarmRules(farmId);
      setRules(data.data.rules);
    } catch (error) {
      toast.error(t('automation.loadFailed', 'Failed to load automation rules'));
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
    
    // Check permission
    if (editingRule && !canEditAutomation) {
      toast.error(t('messages.permissionDenied'));
      return;
    }
    if (!editingRule && !canCreateAutomation) {
      toast.error(t('messages.permissionDenied'));
      return;
    }

    if (!formData.name || !formData.sensorId || !formData.actuatorId || !formData.value) {
      toast.error(t('messages.validationError'));
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
        toast.success(t('automation.ruleUpdated', 'Rule updated successfully'));
      } else {
        await automationService.createRule(farmId, ruleData);
        toast.success(t('automation.ruleCreated', 'Rule created successfully'));
      }
      setShowModal(false);
      resetForm();
      loadRules();
    } catch (error) {
      toast.error(error.response?.data?.message || t('messages.saveFailed'));
    }
  };

  const handleEdit = (rule) => {
    if (!canEditAutomation) {
      toast.error(t('messages.permissionDenied'));
      return;
    }
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
    if (!canDeleteAutomation) {
      toast.error(t('messages.permissionDenied'));
      return;
    }
    if (!confirm(t('messages.confirmDelete'))) return;

    try {
      await automationService.deleteRule(ruleId);
      toast.success(t('messages.deleteSuccess'));
      loadRules();
    } catch (error) {
      toast.error(t('messages.deleteFailed'));
    }
  };

  const handleToggle = async (ruleId) => {
    if (!canEditAutomation) {
      toast.error(t('messages.permissionDenied'));
      return;
    }
    try {
      await automationService.toggleRule(ruleId);
      loadRules();
    } catch (error) {
      toast.error(t('automation.toggleFailed', 'Failed to toggle rule'));
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
    if (!canCreateAutomation) {
      toast.error(t('messages.permissionDenied'));
      return;
    }
    resetForm();
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 dark:border-green-400"></div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4 md:mb-6">
        <div className="flex items-center gap-3 md:gap-4">
          <Link to={`/farms/${farmId}`} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            <FiArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">{t('automation.title')}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">
              {canCreateAutomation
                ? t('automation.subtitle', 'Create rules to automate your farm')
                : t('automation.viewOnly', 'View automation rules (read-only)')
              }
            </p>
          </div>
        </div>
        {canCreateAutomation && (
          <button
            onClick={openNewRuleModal}
            className="flex items-center justify-center gap-2 bg-green-600 dark:bg-green-500 text-white px-4 py-3 md:py-2 min-h-[44px] rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors whitespace-nowrap"
          >
            <FiPlus size={18} />
            {t('automation.addRule')}
          </button>
        )}
      </div>

      {/* Rules List */}
      {rules.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 md:p-12 text-center transition-colors">
          <div className="text-5xl md:text-6xl mb-4">🤖</div>
          <h2 className="text-lg md:text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">{t('automation.noRules')}</h2>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mb-6">
            {canCreateAutomation
              ? t('automation.noRulesDesc', 'Create your first rule to automate actuators based on sensor readings')
              : t('automation.noRulesViewOnly', 'No automation rules have been created for this farm')
            }
          </p>
          {canCreateAutomation && (
            <button
              onClick={openNewRuleModal}
              className="bg-green-600 dark:bg-green-500 text-white px-6 py-3 md:py-2 min-h-[44px] rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
            >
              {t('automation.createFirst', 'Create First Rule')}
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 md:gap-4">
          {rules.map((rule) => (
            <div key={rule.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 md:p-6 transition-colors">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 md:gap-3 mb-2 flex-wrap">
                    <FiZap className={rule.isEnabled ? 'text-yellow-500 dark:text-yellow-400' : 'text-gray-400 dark:text-gray-600'} size={18} />
                    <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white">{rule.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                      rule.isEnabled ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {rule.isEnabled ? t('automation.enabled') : t('automation.disabled')}
                    </span>
                  </div>

                  <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <p>
                      <span className="font-medium">{t('automation.if', 'IF')}</span>{' '}
                      <span className="text-blue-600 dark:text-blue-400">{rule.sensor?.sensorName || t('automation.unknownSensor', 'Unknown Sensor')}</span>{' '}
                      <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">
                        {CONDITIONS[rule.triggerConfig?.condition]} {rule.triggerConfig?.value}
                      </span>{' '}
                      {rule.sensor?.unit}
                    </p>
                    <p>
                      <span className="font-medium">{t('automation.then', 'THEN')}</span>{' '}
                      <span className="text-purple-600 dark:text-purple-400">{rule.actuator?.actuatorName}</span>{' '}
                      <span className={`font-semibold ${
                        rule.actionConfig?.state === 'ON' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        → {rule.actionConfig?.state === 'ON' ? t('actuators.on') : t('actuators.off')}
                      </span>
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {t('automation.cooldown', 'Cooldown')}: {rule.triggerConfig?.cooldownMinutes || 5} {t('automation.minutes', 'minutes')}
                      {rule.lastRunAt && ` • ${t('automation.lastTriggered', 'Last triggered')}: ${new Date(rule.lastRunAt).toLocaleString()}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Toggle - requires edit permission */}
                  {canEditAutomation && (
                    <button
                      onClick={() => handleToggle(rule.id)}
                      className={`p-2 min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center ${
                        rule.isEnabled ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                      }`}
                      title={rule.isEnabled ? t('automation.disable', 'Disable') : t('automation.enable', 'Enable')}
                    >
                      <FiPower size={18} />
                    </button>
                  )}

                  {/* Edit - requires edit permission */}
                  {canEditAutomation && (
                    <button
                      onClick={() => handleEdit(rule)}
                      className="p-2 min-h-[44px] min-w-[44px] bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 flex items-center justify-center"
                      title={t('common.edit')}
                    >
                      <FiEdit2 size={18} />
                    </button>
                  )}

                  {/* Delete - requires delete permission */}
                  {canDeleteAutomation && (
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="p-2 min-h-[44px] min-w-[44px] bg-red-100 text-red-600 rounded-lg hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 flex items-center justify-center"
                      title={t('common.delete')}
                    >
                      <FiTrash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal - only show if user can create/edit */}
      {showModal && (canCreateAutomation || canEditAutomation) && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/75 flex items-center justify-center z-50 p-0 md:p-4 overflow-y-auto transition-colors">
          <div className="bg-white dark:bg-gray-800 w-full h-full md:h-auto md:rounded-xl shadow-xl md:max-w-md md:max-h-[90vh] overflow-y-auto transition-colors">
            <div className="p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white mb-4">
                {editingRule ? t('automation.editRule', 'Edit Rule') : t('automation.createRule', 'Create Automation Rule')}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Rule Name */}
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-200 mb-1">
                    {t('automation.ruleName')} *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('automation.ruleNamePlaceholder', 'e.g., High Temp Fan Control')}
                    className="w-full px-4 py-3 text-base min-h-[44px] border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white transition-colors"
                  />
                </div>

                {/* IF Section */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg transition-colors">
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-3">{t('automation.ifCondition', 'IF (Trigger Condition)')}</p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">{t('sensors.title')} *</label>
                      <select
                        value={formData.sensorId}
                        onChange={(e) => setFormData({ ...formData, sensorId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white transition-colors"
                      >
                        <option value="">{t('automation.selectSensor', 'Select Sensor')}</option>
                        {components.sensors.map((sensor) => (
                          <option key={sensor.id} value={sensor.id}>
                            {sensor.sensorName} ({sensor.sensorType}) - {sensor.deviceName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">{t('automation.condition')} *</label>
                        <select
                          value={formData.condition}
                          onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white transition-colors"
                        >
                          <option value="GREATER_THAN">{t('automation.greaterThan', 'Greater than')} (&gt;)</option>
                          <option value="LESS_THAN">{t('automation.lessThan', 'Less than')} (&lt;)</option>
                          <option value="GREATER_THAN_OR_EQUAL">{t('automation.greaterOrEqual', 'Greater or equal')} (≥)</option>
                          <option value="LESS_THAN_OR_EQUAL">{t('automation.lessOrEqual', 'Less or equal')} (≤)</option>
                          <option value="EQUAL_TO">{t('automation.equalTo', 'Equal to')} (=)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">{t('automation.value', 'Value')} *</label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.value}
                          onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                          placeholder="35"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* THEN Section */}
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg transition-colors">
                  <p className="text-sm font-semibold text-purple-800 dark:text-purple-200 mb-3">{t('automation.thenAction', 'THEN (Action)')}</p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">{t('actuators.title')} *</label>
                      <select
                        value={formData.actuatorId}
                        onChange={(e) => setFormData({ ...formData, actuatorId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white transition-colors"
                      >
                        <option value="">{t('automation.selectActuator', 'Select Actuator')}</option>
                        {components.actuators.map((actuator) => (
                          <option key={actuator.id} value={actuator.id}>
                            {actuator.actuatorName} ({actuator.actuatorType}) - {actuator.deviceName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">{t('automation.setState', 'Set State To')}</label>
                      <select
                        value={formData.actionState}
                        onChange={(e) => setFormData({ ...formData, actionState: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white transition-colors"
                      >
                        <option value="ON">{t('actuators.turnOn')}</option>
                        <option value="OFF">{t('actuators.turnOff')}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Cooldown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    {t('automation.cooldownMinutes', 'Cooldown (minutes)')}
                  </label>
                  <input
                    type="number"
                    value={formData.cooldownMinutes}
                    onChange={(e) => setFormData({ ...formData, cooldownMinutes: e.target.value })}
                    min="1"
                    max="60"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white transition-colors"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('automation.cooldownDesc', "Prevents rapid toggling. Rule won't trigger again within this period.")}
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-3 md:py-2 min-h-[44px] border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 md:py-2 min-h-[44px] bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
                  >
                    {editingRule ? t('automation.updateRule', 'Update Rule') : t('automation.createRule', 'Create Rule')}
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

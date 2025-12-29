import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiTrash2, FiEdit2, FiPower, FiClock, FiCalendar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useTranslation } from '../hooks/useTranslation';
import scheduleService from '../services/schedule.service';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', labelMr: 'रविवार', short: 'Sun', shortMr: 'रवि' },
  { value: 1, label: 'Monday', labelMr: 'सोमवार', short: 'Mon', shortMr: 'सोम' },
  { value: 2, label: 'Tuesday', labelMr: 'मंगळवार', short: 'Tue', shortMr: 'मंगळ' },
  { value: 3, label: 'Wednesday', labelMr: 'बुधवार', short: 'Wed', shortMr: 'बुध' },
  { value: 4, label: 'Thursday', labelMr: 'गुरुवार', short: 'Thu', shortMr: 'गुरु' },
  { value: 5, label: 'Friday', labelMr: 'शुक्रवार', short: 'Fri', shortMr: 'शुक्र' },
  { value: 6, label: 'Saturday', labelMr: 'शनिवार', short: 'Sat', shortMr: 'शनि' }
];

export default function Schedules() {
  const { farmId } = useParams();
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const [schedules, setSchedules] = useState([]);
  const [actuators, setActuators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formData, setFormData] = useState({
    actuatorId: '',
    name: '',
    description: '',
    time: '',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    action: 'ON',
    duration: ''
  });

  // Get user from store
  const user = useAuthStore((state) => state.user);

  // Calculate permissions based on user role
  const userRole = user?.role || 'VIEWER';
  const canViewSchedules = ['SUPER_ADMIN', 'FARM_OWNER', 'MANAGER'].includes(userRole);
  const canCreateSchedules = ['SUPER_ADMIN', 'FARM_OWNER', 'MANAGER'].includes(userRole);
  const canEditSchedules = ['SUPER_ADMIN', 'FARM_OWNER', 'MANAGER'].includes(userRole);
  const canDeleteSchedules = ['SUPER_ADMIN', 'FARM_OWNER'].includes(userRole);

  useEffect(() => {
    // Redirect if no permission
    if (!canViewSchedules) {
      toast.error(t('messages.permissionDenied'));
      navigate(`/farms/${farmId}`);
      return;
    }
    loadSchedules();
    loadActuators();
  }, [farmId, canViewSchedules, navigate, t]);

  const loadSchedules = async () => {
    try {
      const data = await scheduleService.getFarmSchedules(farmId);
      setSchedules(data);
    } catch (error) {
      toast.error(t('schedules.loadFailed', 'Failed to load schedules'));
    } finally {
      setLoading(false);
    }
  };

  const loadActuators = async () => {
    try {
      const response = await api.get(`/farms/${farmId}/dashboard`);
      console.log('Dashboard response:', response.data);

      // Actuators might be at top level or nested in devices
      let allActuators = [];

      // Check if actuators are at top level
      if (response.data.data?.actuators && response.data.data.actuators.length > 0) {
        allActuators = response.data.data.actuators;
      }
      // Otherwise extract from devices
      else if (response.data.data?.devices) {
        response.data.data.devices.forEach(device => {
          if (device.actuators && device.actuators.length > 0) {
            allActuators = [...allActuators, ...device.actuators];
          }
        });
      }

      console.log('Extracted actuators:', allActuators);
      setActuators(allActuators);
    } catch (error) {
      console.error('Failed to load actuators:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check permission
    if (editingSchedule && !canEditSchedules) {
      toast.error(t('messages.permissionDenied'));
      return;
    }
    if (!editingSchedule && !canCreateSchedules) {
      toast.error(t('messages.permissionDenied'));
      return;
    }

    if (!formData.actuatorId) {
      toast.error(t('schedules.selectActuatorRequired', 'Please select an actuator'));
      return;
    }

    if (!formData.name || !formData.time || !formData.action) {
      toast.error(t('messages.validationError'));
      return;
    }

    if (formData.daysOfWeek.length === 0) {
      toast.error(t('schedules.selectAtLeastOneDay', 'Please select at least one day'));
      return;
    }

    const scheduleData = {
      actuatorId: formData.actuatorId,
      name: formData.name,
      description: formData.description || null,
      time: formData.time,
      daysOfWeek: formData.daysOfWeek.sort((a, b) => a - b),
      action: formData.action,
      duration: formData.duration ? parseInt(formData.duration) : null
    };

    try {
      if (editingSchedule) {
        await scheduleService.updateSchedule(editingSchedule.id, scheduleData);
        toast.success(t('schedules.scheduleUpdated', 'Schedule updated successfully'));
      } else {
        await scheduleService.createSchedule(farmId, scheduleData);
        toast.success(t('schedules.scheduleCreated', 'Schedule created successfully'));
      }
      setShowModal(false);
      resetForm();
      loadSchedules();
    } catch (error) {
      toast.error(error.response?.data?.message || t('messages.saveFailed'));
    }
  };

  const handleEdit = (schedule) => {
    if (!canEditSchedules) {
      toast.error(t('messages.permissionDenied'));
      return;
    }
    setEditingSchedule(schedule);
    setFormData({
      actuatorId: schedule.actuatorId,
      name: schedule.name,
      description: schedule.description || '',
      time: schedule.time,
      daysOfWeek: schedule.daysOfWeek,
      action: schedule.action,
      duration: schedule.duration || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (scheduleId) => {
    if (!canDeleteSchedules) {
      toast.error(t('messages.permissionDenied'));
      return;
    }
    if (!confirm(t('messages.confirmDelete'))) return;

    try {
      await scheduleService.deleteSchedule(scheduleId);
      toast.success(t('messages.deleteSuccess'));
      loadSchedules();
    } catch (error) {
      toast.error(t('messages.deleteFailed'));
    }
  };

  const handleToggle = async (scheduleId) => {
    if (!canEditSchedules) {
      toast.error(t('messages.permissionDenied'));
      return;
    }
    try {
      await scheduleService.toggleSchedule(scheduleId);
      loadSchedules();
    } catch (error) {
      toast.error(t('schedules.toggleFailed', 'Failed to toggle schedule'));
    }
  };

  const handleDayToggle = (dayValue) => {
    setFormData(prev => {
      const newDays = prev.daysOfWeek.includes(dayValue)
        ? prev.daysOfWeek.filter(d => d !== dayValue)
        : [...prev.daysOfWeek, dayValue];
      return { ...prev, daysOfWeek: newDays };
    });
  };

  const resetForm = () => {
    setFormData({
      actuatorId: '',
      name: '',
      description: '',
      time: '',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      action: 'ON',
      duration: ''
    });
    setEditingSchedule(null);
  };

  const openNewScheduleModal = () => {
    if (!canCreateSchedules) {
      toast.error(t('messages.permissionDenied'));
      return;
    }
    resetForm();
    setShowModal(true);
  };

  const getDayLabel = (dayValue, short = false) => {
    const day = DAYS_OF_WEEK.find(d => d.value === dayValue);
    if (!day) return '';
    if (short) {
      return language === 'mr' ? day.shortMr : day.short;
    }
    return language === 'mr' ? day.labelMr : day.label;
  };

  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHours = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayHours}:${minutes} ${period}`;
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
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">{t('schedules.title')}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">
              {canCreateSchedules
                ? t('schedules.subtitle', 'Schedule actuators to run at specific times')
                : t('schedules.viewOnly', 'View schedules (read-only)')
              }
            </p>
          </div>
        </div>
        {canCreateSchedules && (
          <button
            onClick={openNewScheduleModal}
            className="flex items-center justify-center gap-2 bg-green-600 dark:bg-green-500 text-white px-4 py-3 md:py-2 min-h-[44px] rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors whitespace-nowrap"
          >
            <FiPlus size={18} />
            {t('schedules.addSchedule')}
          </button>
        )}
      </div>

      {/* Schedules List */}
      {schedules.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 md:p-12 text-center transition-colors">
          <div className="text-5xl md:text-6xl mb-4">⏰</div>
          <h2 className="text-lg md:text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">{t('schedules.noSchedules')}</h2>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mb-6">
            {canCreateSchedules
              ? t('schedules.noSchedulesDesc', 'Create your first schedule to automate actuators based on time')
              : t('schedules.noSchedulesViewOnly', 'No schedules have been created for this farm')
            }
          </p>
          {canCreateSchedules && (
            <button
              onClick={openNewScheduleModal}
              className="bg-green-600 dark:bg-green-500 text-white px-6 py-3 md:py-2 min-h-[44px] rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
            >
              {t('schedules.createFirst', 'Create First Schedule')}
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 md:gap-4">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 md:p-6 transition-colors">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 md:gap-3 mb-2 flex-wrap">
                    <FiClock className={schedule.isEnabled ? 'text-green-500 dark:text-green-400' : 'text-gray-400 dark:text-gray-600'} size={18} />
                    <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white">{schedule.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                      schedule.isEnabled ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {schedule.isEnabled ? t('schedules.enabled') : t('schedules.disabled')}
                    </span>
                  </div>

                  {schedule.description && (
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-2">{schedule.description}</p>
                  )}

                  <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <p>
                      <span className="font-medium">{t('schedules.actuator', 'Actuator')}:</span>{' '}
                      <span className="text-purple-600 dark:text-purple-400">{schedule.actuator?.actuatorName}</span>{' '}
                      <span className={`font-semibold ${
                        schedule.action === 'ON' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        → {schedule.action === 'ON' ? t('actuators.on') : t('actuators.off')}
                      </span>
                    </p>
                    <p>
                      <span className="font-medium">{t('schedules.time', 'Time')}:</span>{' '}
                      <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                        {formatTime(schedule.time)}
                      </span>
                      {schedule.duration && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {' '}({t('schedules.autoOff', 'Auto OFF after')} {schedule.duration} {t('schedules.minutes', 'min')})
                        </span>
                      )}
                    </p>
                    <p>
                      <span className="font-medium">{t('schedules.days', 'Days')}:</span>{' '}
                      {schedule.daysOfWeek.length === 7 ? (
                        <span className="text-blue-600 dark:text-blue-400">{t('schedules.everyday', 'Every day')}</span>
                      ) : (
                        <span className="text-blue-600 dark:text-blue-400">
                          {schedule.daysOfWeek.map(d => getDayLabel(d, true)).join(', ')}
                        </span>
                      )}
                    </p>
                    {schedule.nextRunAt && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {t('schedules.nextRun', 'Next run')}: {new Date(schedule.nextRunAt).toLocaleString()}
                        {schedule.lastRunAt && ` • ${t('schedules.lastRun', 'Last run')}: ${new Date(schedule.lastRunAt).toLocaleString()}`}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Toggle - requires edit permission */}
                  {canEditSchedules && (
                    <button
                      onClick={() => handleToggle(schedule.id)}
                      className={`p-2 min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center ${
                        schedule.isEnabled ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                      }`}
                      title={schedule.isEnabled ? t('schedules.disable', 'Disable') : t('schedules.enable', 'Enable')}
                    >
                      <FiPower size={18} />
                    </button>
                  )}

                  {/* Edit - requires edit permission */}
                  {canEditSchedules && (
                    <button
                      onClick={() => handleEdit(schedule)}
                      className="p-2 min-h-[44px] min-w-[44px] bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 flex items-center justify-center"
                      title={t('common.edit')}
                    >
                      <FiEdit2 size={18} />
                    </button>
                  )}

                  {/* Delete - requires delete permission */}
                  {canDeleteSchedules && (
                    <button
                      onClick={() => handleDelete(schedule.id)}
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
      {showModal && (canCreateSchedules || canEditSchedules) && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/75 flex items-center justify-center z-50 p-0 md:p-4 overflow-y-auto transition-colors">
          <div className="bg-white dark:bg-gray-800 w-full h-full md:h-auto md:rounded-xl shadow-xl md:max-w-lg md:max-h-[90vh] overflow-y-auto transition-colors">
            <div className="p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white mb-4">
                {editingSchedule ? t('schedules.editSchedule', 'Edit Schedule') : t('schedules.createSchedule', 'Create Schedule')}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Schedule Name */}
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-200 mb-1">
                    {t('schedules.scheduleName')} *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('schedules.scheduleNamePlaceholder', 'e.g., Morning Irrigation')}
                    className="w-full px-4 py-3 text-base min-h-[44px] border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white transition-colors"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-200 mb-1">
                    {t('schedules.description')}
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t('schedules.descriptionPlaceholder', 'Optional description')}
                    className="w-full px-4 py-3 text-base min-h-[44px] border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white transition-colors"
                  />
                </div>

                {/* Actuator Selection */}
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-200 mb-1">
                    {t('actuators.title')} *
                  </label>
                  {actuators.length === 0 ? (
                    <div className="w-full px-4 py-3 text-base min-h-[44px] border border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">
                        {t('schedules.noActuators', 'No actuators found. Please add actuators to this farm first.')}
                      </p>
                    </div>
                  ) : (
                    <select
                      value={formData.actuatorId}
                      onChange={(e) => setFormData({ ...formData, actuatorId: e.target.value })}
                      className="w-full px-4 py-3 text-base min-h-[44px] border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 transition-colors"
                      required
                    >
                      <option value="">{t('schedules.selectActuator', 'Select an actuator')}</option>
                      {actuators.map((actuator) => (
                        <option key={actuator.id} value={actuator.id}>
                          {actuator.actuatorName} ({actuator.actuatorType})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Time Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-200 mb-1">
                      {t('schedules.time')} *
                    </label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full px-4 py-3 text-base min-h-[44px] border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-200 mb-1">
                      {t('schedules.action')} *
                    </label>
                    <select
                      value={formData.action}
                      onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                      className="w-full px-4 py-3 text-base min-h-[44px] border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white transition-colors"
                    >
                      <option value="ON">{t('actuators.turnOn')}</option>
                      <option value="OFF">{t('actuators.turnOff')}</option>
                    </select>
                  </div>
                </div>

                {/* Duration (Auto OFF) */}
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-200 mb-1">
                    {t('schedules.duration')}
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    min="1"
                    placeholder={t('schedules.durationPlaceholder', 'Minutes (optional)')}
                    className="w-full px-4 py-3 text-base min-h-[44px] border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white transition-colors"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('schedules.durationNote', 'Auto turn OFF after specified minutes (only for ON action)')}
                  </p>
                </div>

                {/* Days of Week */}
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-200 mb-2">
                    {t('schedules.daysOfWeek')} *
                  </label>
                  <div className="grid grid-cols-7 gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => handleDayToggle(day.value)}
                        className={`px-2 py-2 text-xs font-medium rounded-lg min-h-[44px] transition-colors ${
                          formData.daysOfWeek.includes(day.value)
                            ? 'bg-green-600 text-white dark:bg-green-500'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {getDayLabel(day.value, true)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-3 md:py-2 min-h-[44px] border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 md:py-2 min-h-[44px] bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
                  >
                    {editingSchedule ? t('schedules.updateSchedule', 'Update Schedule') : t('schedules.createSchedule', 'Create Schedule')}
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

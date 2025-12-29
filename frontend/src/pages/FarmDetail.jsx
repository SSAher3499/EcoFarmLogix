import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { farmService } from "../services/farm.service";
import WeatherWidget from "../components/weather/WeatherWidget";
import { socketService } from "../services/socket.service";
import { useAuthStore } from "../store/authStore";
import { useTranslation } from "../hooks/useTranslation";
import { getRoleDisplayName, getRoleBadgeColor } from "../utils/permissions";
import { FiSettings, FiUsers, FiClock } from "react-icons/fi";
import { FiZap } from "react-icons/fi";
import {
  FiThermometer,
  FiDroplet,
  FiSun,
  FiWind,
  FiPower,
  FiRefreshCw,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { ChartBarIcon } from "@heroicons/react/24/outline";

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
  TEMPERATURE: "text-orange-500 bg-orange-100",
  HUMIDITY: "text-blue-500 bg-blue-100",
  LIGHT: "text-yellow-500 bg-yellow-100",
  SOIL_MOISTURE: "text-green-500 bg-green-100",
  CO2: "text-purple-500 bg-purple-100",
};

export default function FarmDetail() {
  const { farmId } = useParams();
  const { t } = useTranslation();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [controlLoading, setControlLoading] = useState({});

  // Get user from auth store
  const user = useAuthStore((state) => state.user);

  // Calculate permissions based on user role
  const userRole = user?.role || "VIEWER";
  const canControlActuators = [
    "SUPER_ADMIN",
    "FARM_OWNER",
    "MANAGER",
    "OPERATOR",
  ].includes(userRole);
  const canManageDevices = userRole === "SUPER_ADMIN";
  const canViewAutomation = ["SUPER_ADMIN", "FARM_OWNER", "MANAGER"].includes(
    userRole
  );
  const canViewTeam = ["SUPER_ADMIN", "FARM_OWNER", "MANAGER"].includes(
    userRole
  );
  const canInviteUsers = ["SUPER_ADMIN", "FARM_OWNER"].includes(userRole);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const data = await farmService.getDashboard(farmId);
      setDashboard(data);
    } catch (error) {
      toast.error(error?.message || t('messages.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [farmId, t]);

  useEffect(() => {
    loadDashboard();

    // Connect WebSocket and subscribe
    const token = localStorage.getItem("accessToken");

    const setupSocket = async () => {
      await socketService.connect(token);
      socketService.subscribeFarm(farmId);

      // Set up listeners AFTER connection
      socketService.onSensorUpdate(onSensor);
      socketService.onActuatorUpdate(onActuator);
      socketService.onAlert(onAlert);
    };

    setupSocket();

    // Sensor update handler
    const onSensor = (data) => {
      console.log("📥 Raw sensor:update received:", data);

      setDashboard((prev) => {
        if (!prev) return prev;
        try {
          const deviceId = data?.data?.deviceId;
          const updates = data?.data?.sensors;
          if (!deviceId || !Array.isArray(updates)) return prev;

          const updatedDevices = prev.devices.map((device) => {
            if (device.id !== deviceId) return device;
            const updatedSensors = (device.sensors || []).map((sensor) => {
              const u = updates.find((s) => s.sensorId === sensor.id);
              if (u) {
                return {
                  ...sensor,
                  lastReading: u.value,
                  lastReadingAt: u.timestamp,
                };
              }
              return sensor;
            });
            return { ...device, sensors: updatedSensors };
          });

          return { ...prev, devices: updatedDevices };
        } catch (err) {
          console.error("Error applying sensor update", err, data);
          return prev;
        }
      });
    };

    // Actuator update handler
    const onActuator = (data) => {
      console.log("📥 WebSocket actuator:update received:", data);

      setDashboard((prev) => {
        if (!prev) return prev;
        const actuatorId = data?.actuatorId;
        const state = data?.state;

        if (!actuatorId) {
          console.warn("⚠️ No actuatorId in data");
          return prev;
        }

        const updatedDevices = prev.devices.map((device) => ({
          ...device,
          actuators: (device.actuators || []).map((actuator) =>
            actuator.id === actuatorId
              ? { ...actuator, currentState: state }
              : actuator
          ),
        }));

        return { ...prev, devices: updatedDevices };
      });
    };

    // Alert handler
    const onAlert = (data) => {
      try {
        const title = data?.alert?.title ?? t('alerts.title');
        const message = data?.alert?.message ?? "";
        toast.error(`🚨 ${title}: ${message}`);
      } catch (err) {
        console.error("Malformed alert", data);
      }
    };

    // Cleanup
    return () => {
      socketService.unsubscribeFarm(farmId);
      socketService.removeAllListeners();
    };
  }, [farmId, loadDashboard, t]);

  const handleActuatorControl = async (actuatorId, currentState) => {
    // Check permission first
    if (!canControlActuators) {
      toast.error(t('messages.permissionDenied'));
      return;
    }

    const newState = currentState === "ON" ? "OFF" : "ON";
    setControlLoading((prev) => ({ ...prev, [actuatorId]: true }));
    try {
      await farmService.controlActuator(actuatorId, newState);
      toast.success(`${t('actuators.title')} ${newState === 'ON' ? t('actuators.on') : t('actuators.off')}`);
    } catch (error) {
      toast.error(error?.message || t('messages.updateFailed'));
    } finally {
      setControlLoading((prev) => ({ ...prev, [actuatorId]: false }));
    }
  };

  const allSensors = useMemo(() => {
    return (dashboard?.devices || []).flatMap((d) =>
      (d.sensors || []).map((s) => ({ ...s, deviceName: d.deviceName }))
    );
  }, [dashboard]);

  const allActuators = useMemo(() => {
    return (dashboard?.devices || []).flatMap((d) =>
      (d.actuators || []).map((a) => ({
        ...a,
        deviceName: d.deviceName,
        deviceMac: d.macAddress,
      }))
    );
  }, [dashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400" />
      </div>
    );
  }

  if (!dashboard) {
    return <div className="text-center text-gray-500 dark:text-gray-400">{t('farm.notFound', 'Farm not found')}</div>;
  }

  // Get user's role for this farm
  const farmUserRole = dashboard.farm?.userRole || userRole;

  return (
    <div className="px-4 md:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4 md:mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
              {dashboard.farm?.name}
            </h1>
            {/* Role Badge */}
            <span
              className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getRoleBadgeColor(
                farmUserRole
              )}`}
            >
              {getRoleDisplayName(farmUserRole)}
            </span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base mt-1">
            {dashboard.farm?.location || dashboard.farm?.farmType}
            {dashboard.farm?.owner && userRole === "SUPER_ADMIN" && (
              <span className="ml-2 text-xs md:text-sm">
                • {t('farm.owner', 'Owner')}: {dashboard.farm.owner.fullName}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          {/* History - visible to all */}
          <Link
            to={`/farms/${farmId}/history`}
            className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 md:py-2 min-h-[44px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm md:text-base whitespace-nowrap"
          >
            <ChartBarIcon className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">{t('farm.history')}</span>
          </Link>

          {/* Automation - only for users with permission */}
          {canViewAutomation && (
            <Link
              to={`/farms/${farmId}/automation`}
              className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 md:py-2 min-h-[44px] bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm md:text-base whitespace-nowrap"
            >
              <FiZap className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">{t('farm.automation')}</span>
            </Link>
          )}

          {/* Schedules - only for users with permission */}
          {canViewAutomation && (
            <Link
              to={`/farms/${farmId}/schedules`}
              className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 md:py-2 min-h-[44px] bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm md:text-base whitespace-nowrap"
            >
              <FiClock className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">{t('farm.schedules')}</span>
            </Link>
          )}

          {/* Team - only for OWNER and above */}
          {canViewTeam && (
            <Link
              to={`/farms/${farmId}/team`}
              className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 md:py-2 min-h-[44px] bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm md:text-base whitespace-nowrap"
            >
              <FiUsers className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">{t('farm.team')}</span>
            </Link>
          )}

          {/* Devices - Super Admin only */}
          {canManageDevices && (
            <Link
              to={`/farms/${farmId}/devices`}
              className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 md:py-2 min-h-[44px] bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm md:text-base whitespace-nowrap"
            >
              <FiSettings className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">{t('farm.devices')}</span>
            </Link>
          )}

          <button
            type="button"
            onClick={loadDashboard}
            className="flex items-center gap-1 md:gap-2 px-3 py-2 min-h-[44px] text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-sm md:text-base whitespace-nowrap"
          >
            <FiRefreshCw size={18} />
            <span className="hidden sm:inline">{t('common.refresh')}</span>
          </button>
        </div>
      </div>

      {/* TOP STATS (full width) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4 transition-colors">
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">{t('stats.totalDevices', 'Total Devices')}</p>
          <p className="text-xl md:text-2xl font-bold dark:text-white">
            {dashboard.stats?.totalDevices ?? 0}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4 transition-colors">
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">{t('common.online')}</p>
          <p className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">
            {dashboard.stats?.onlineDevices ?? 0}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4 transition-colors">
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">{t('sensors.title')}</p>
          <p className="text-xl md:text-2xl font-bold dark:text-white">
            {dashboard.stats?.totalSensors ?? 0}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4 transition-colors">
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">{t('actuators.title')}</p>
          <p className="text-xl md:text-2xl font-bold dark:text-white">
            {dashboard.stats?.totalActuators ?? 0}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4 transition-colors col-span-2 md:col-span-1">
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">{t('stats.teamMembers', 'Team Members')}</p>
          <p className="text-xl md:text-2xl font-bold dark:text-white">
            {dashboard.stats?.teamMembers ?? 0}
          </p>
        </div>
      </div>

      {/* MAIN GRID: left = content, right = weather sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left column: main content */}
        <div className="lg:col-span-3">
          {/* Sensor Readings */}
          <div className="mb-4 md:mb-6">
            <h2 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white mb-3 md:mb-4">
              📊 {t('farm.liveData', 'Sensor Readings')}
            </h2>

            {allSensors.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6 text-center text-gray-500 dark:text-gray-400 transition-colors">
                {t('sensors.noSensors', 'No sensors configured')}
                {canManageDevices && (
                  <div className="mt-2">
                    <Link
                      to={`/farms/${farmId}/devices`}
                      className="text-blue-600 dark:text-blue-400 hover:underline text-sm md:text-base"
                    >
                      {t('sensors.addSensor')} →
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {allSensors.map((sensor) => {
                  const Icon = sensorIcons[sensor.sensorType] || FiThermometer;
                  const colorClass =
                    sensorColors[sensor.sensorType] ||
                    "text-gray-500 bg-gray-100";
                  const readingValid =
                    sensor.lastReading !== null &&
                    !isNaN(parseFloat(sensor.lastReading));
                  const reading = readingValid
                    ? `${parseFloat(sensor.lastReading).toFixed(1)}${
                        sensor.unit ?? ""
                      }`
                    : "--";

                  return (
                    <div
                      key={sensor.id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4 transition-colors"
                    >
                      <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                        <div className={`p-2 rounded-lg ${colorClass}`}>
                          <Icon size={18} className="md:w-5 md:h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs md:text-sm font-medium text-gray-800 dark:text-white truncate">
                            {sensor.sensorName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {sensor.deviceName}
                          </p>
                        </div>
                      </div>

                      <div className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
                        {reading}
                      </div>

                      {sensor.lastReadingAt && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
                          {t('sensors.lastReading', 'Updated')}:{" "}
                          {new Date(sensor.lastReadingAt).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actuator Controls */}
          <div className="mb-4 md:mb-6">
            <h2 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white mb-3 md:mb-4">
              ⚡ {t('actuators.title')}
              {!canControlActuators && (
                <span className="ml-2 text-xs md:text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({t('actuators.viewOnly', 'View only')})
                </span>
              )}
            </h2>

            {allActuators.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6 text-center text-gray-500 dark:text-gray-400 transition-colors">
                {t('actuators.noActuators', 'No actuators configured')}
                {canManageDevices && (
                  <div className="mt-2">
                    <Link
                      to={`/farms/${farmId}/devices`}
                      className="text-blue-600 dark:text-blue-400 hover:underline text-sm md:text-base"
                    >
                      {t('actuators.addActuator')} →
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {allActuators.map((actuator) => (
                  <div
                    key={actuator.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm md:text-base text-gray-800 dark:text-white truncate">
                          {actuator.actuatorName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {t(`actuators.types.${actuator.actuatorType}`, actuator.actuatorType)}
                        </p>
                      </div>
                      <span
                        className={`w-3 h-3 rounded-full flex-shrink-0 ml-2 ${
                          actuator.currentState === "ON"
                            ? "bg-green-500"
                            : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      />
                    </div>

                    {canControlActuators ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleActuatorControl(
                            actuator.id,
                            actuator.currentState
                          )
                        }
                        disabled={!!controlLoading[actuator.id]}
                        className={`
                          w-full py-3 md:py-2 min-h-[44px] px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm md:text-base
                          ${
                            actuator.currentState === "ON"
                              ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-300"
                              : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300"
                          }
                          disabled:opacity-50
                        `}
                      >
                        {controlLoading[actuator.id] ? (
                          <FiRefreshCw className="animate-spin" size={18} />
                        ) : (
                          <FiPower size={18} />
                        )}
                        <span className="truncate">
                          {actuator.currentState === "ON"
                            ? t('actuators.turnOff')
                            : t('actuators.turnOn')}
                        </span>
                      </button>
                    ) : (
                      <div
                        className={`
                        w-full py-3 md:py-2 min-h-[44px] px-4 rounded-lg text-center font-medium text-sm md:text-base
                        ${
                          actuator.currentState === "ON"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                        }
                      `}
                      >
                        {actuator.currentState === "ON" ? t('actuators.on') : t('actuators.off')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Alerts */}
          {dashboard.recentAlerts?.length > 0 && (
            <div className="mb-4 md:mb-6">
              <h2 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white mb-3 md:mb-4">
                🚨 {t('alerts.title')}
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow divide-y divide-gray-200 dark:divide-gray-700 transition-colors">
                {dashboard.recentAlerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="p-3 md:p-4 flex flex-col sm:flex-row sm:items-center gap-2 md:gap-4">
                    <span
                      className={`px-2 py-1 text-xs rounded whitespace-nowrap self-start ${
                        alert.severity === "CRITICAL"
                          ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200"
                      }`}
                    >
                      {t(`alerts.${alert.severity.toLowerCase()}`, alert.severity)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm md:text-base text-gray-800 dark:text-white">{alert.title}</p>
                      <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">{alert.message}</p>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: weather sidebar */}
        <aside className="lg:col-span-1">
          <div className="sticky top-20">
            <div className="overflow-hidden">
              <WeatherWidget
                farmId={farmId}
                showForecast={true}
                showRecommendations={true}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

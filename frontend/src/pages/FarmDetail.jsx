import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { farmService } from "../services/farm.service";
import WeatherWidget from "../components/weather/WeatherWidget";
import { socketService } from "../services/socket.service";
import { FiSettings } from "react-icons/fi";
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
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [controlLoading, setControlLoading] = useState({});

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const data = await farmService.getDashboard(farmId);
      setDashboard(data);
    } catch (error) {
      toast.error(error?.message || "Failed to load farm data");
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    loadDashboard();

    // Connect WebSocket
    const token = localStorage.getItem("accessToken");
    socketService.connect(token);
    socketService.subscribeFarm(farmId);

    // Sensor update handler
    const onSensor = (data) => {
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
      setDashboard((prev) => {
        if (!prev) return prev;
        const actuatorId = data?.actuatorId;
        const state = data?.state;
        if (!actuatorId) return prev;

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
        const title = data?.alert?.title ?? "Alert";
        const message = data?.alert?.message ?? "";
        toast.error(`🚨 ${title}: ${message}`);
      } catch (err) {
        console.error("Malformed alert", data);
      }
    };

    socketService.onSensorUpdate(onSensor);
    socketService.onActuatorUpdate(onActuator);
    socketService.onAlert(onAlert);

    // Cleanup: unsubscribe and remove listeners
    return () => {
      socketService.unsubscribeFarm(farmId);
      // Prefer removing specific listeners if socketService exposes off functions.
      socketService.removeAllListeners();
    };
  }, [farmId, loadDashboard]);

  const handleActuatorControl = async (actuatorId, currentState) => {
    const newState = currentState === "ON" ? "OFF" : "ON";
    setControlLoading((prev) => ({ ...prev, [actuatorId]: true }));
    try {
      await farmService.controlActuator(actuatorId, newState);
      toast.success(`Actuator turned ${newState}`);
    } catch (error) {
      toast.error(error?.message || "Failed to control actuator");
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!dashboard) {
    return <div className="text-center text-gray-500">Farm not found</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {dashboard.farm?.name}
          </h1>
          <p className="text-gray-500">
            {dashboard.farm?.location || dashboard.farm?.farmType}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/farms/${farmId}/history`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ChartBarIcon className="w-5 h-5" />
            View History
          </Link>
          <Link
            to={`/farms/${farmId}/automation`}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <FiZap className="w-5 h-5" />
            Automation
          </Link>
          <Link
            to={`/farms/${farmId}/devices`}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <FiSettings className="w-5 h-5" />
            Devices
          </Link>
          <button
            type="button"
            onClick={loadDashboard}
            className="flex items-center gap-2 text-gray-600 hover:text-primary-600"
          >
            <FiRefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      {/* TOP STATS (full width) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Devices</p>
          <p className="text-2xl font-bold">
            {dashboard.stats?.totalDevices ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Online</p>
          <p className="text-2xl font-bold text-green-600">
            {dashboard.stats?.onlineDevices ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Sensors</p>
          <p className="text-2xl font-bold">
            {dashboard.stats?.totalSensors ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Actuators</p>
          <p className="text-2xl font-bold">
            {dashboard.stats?.totalActuators ?? 0}
          </p>
        </div>
      </div>

      {/* MAIN GRID: left = content, right = weather sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left column: main content */}
        <div className="lg:col-span-3">
          {/* Sensor Readings */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              📊 Sensor Readings
            </h2>

            {allSensors.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                No sensors configured
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                      className="bg-white rounded-lg shadow p-4"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${colorClass}`}>
                          <Icon size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {sensor.sensorName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {sensor.deviceName}
                          </p>
                        </div>
                      </div>

                      <div className="text-3xl font-bold text-gray-800">
                        {reading}
                      </div>

                      {sensor.lastReadingAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          Updated:{" "}
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
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              ⚡ Actuator Controls
            </h2>

            {allActuators.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                No actuators configured
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {allActuators.map((actuator) => (
                  <div
                    key={actuator.id}
                    className="bg-white rounded-lg shadow p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium text-gray-800">
                          {actuator.actuatorName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {actuator.actuatorType}
                        </p>
                      </div>
                      <span
                        className={`w-3 h-3 rounded-full ${
                          actuator.currentState === "ON"
                            ? "bg-green-500"
                            : "bg-gray-300"
                        }`}
                      />
                    </div>

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
                        w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors
                        ${
                          actuator.currentState === "ON"
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }
                        disabled:opacity-50
                      `}
                    >
                      {controlLoading[actuator.id] ? (
                        <FiRefreshCw className="animate-spin" size={18} />
                      ) : (
                        <FiPower size={18} />
                      )}
                      {actuator.currentState === "ON" ? "Turn OFF" : "Turn ON"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Alerts */}
          {dashboard.recentAlerts?.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                🚨 Recent Alerts
              </h2>
              <div className="bg-white rounded-lg shadow divide-y">
                {dashboard.recentAlerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="p-4 flex items-center gap-4">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        alert.severity === "CRITICAL"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
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

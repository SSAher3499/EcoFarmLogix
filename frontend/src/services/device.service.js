import api from "./api";

const deviceService = {
  // Get all devices for a farm
  getFarmDevices: async (farmId) => {
    const response = await api.get(`/farms/${farmId}/devices`);
    return response.data;
  },

  // Get single device
  getDevice: async (deviceId) => {
    const response = await api.get(`/devices/${deviceId}`);
    return response.data;
  },

  // Register new device
  registerDevice: async (farmId, deviceData) => {
    const response = await api.post(`/farms/${farmId}/devices`, deviceData);
    return response.data;
  },

  // Update device
  updateDevice: async (deviceId, deviceData) => {
    const response = await api.put(`/devices/${deviceId}`, deviceData);
    return response.data;
  },

  // Delete device
  deleteDevice: async (deviceId) => {
    const response = await api.delete(`/devices/${deviceId}`);
    return response.data;
  },

  // Add sensor to device
  addSensor: async (deviceId, sensorData) => {
    const response = await api.post(`/devices/${deviceId}/sensors`, sensorData);
    return response.data;
  },

  // Add actuator to device
  addActuator: async (deviceId, actuatorData) => {
    const response = await api.post(
      `/devices/${deviceId}/actuators`,
      actuatorData
    );
    return response.data;
  },

  // Delete sensor
  async deleteSensor(sensorId) {
    const response = await api.delete(`/sensors/${sensorId}`);
    return response.data;
  },

  // Delete actuator
  async deleteActuator(actuatorId) {
    const response = await api.delete(`/actuators/${actuatorId}`);
    return response.data;
  },
};

export default deviceService;

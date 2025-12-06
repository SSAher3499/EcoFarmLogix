import api from './api';

export const farmService = {
  async getFarms() {
    const response = await api.get('/farms');
    return response.data.data.farms;
  },

  async getFarm(farmId) {
    const response = await api.get(`/farms/${farmId}`);
    return response.data.data.farm;
  },

  async getDashboard(farmId) {
    const response = await api.get(`/farms/${farmId}/dashboard`);
    return response.data.data;
  },

  async createFarm(data) {
    const response = await api.post('/farms', data);
    return response.data.data.farm;
  },

  async updateFarm(farmId, data) {
    const response = await api.put(`/farms/${farmId}`, data);
    return response.data.data.farm;
  },

  async deleteFarm(farmId) {
    await api.delete(`/farms/${farmId}`);
  },

  async controlActuator(actuatorId, state) {
    const response = await api.put(`/actuators/${actuatorId}/control`, { state });
    return response.data.data.actuator;
  }
};

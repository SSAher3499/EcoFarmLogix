import api from './api';

const historyService = {
  // Get sensor history
  getSensorHistory: async (sensorId, range = '24h') => {
    const response = await api.get(`/sensors/${sensorId}/history?range=${range}`);
    return response.data;
  },

  // Get farm history (all sensors)
  getFarmHistory: async (farmId, range = '24h') => {
    const response = await api.get(`/farms/${farmId}/history?range=${range}`);
    return response.data;
  },

  // Export farm history as CSV
  exportFarmHistory: async (farmId, range = '24h') => {
    const response = await api.get(`/farms/${farmId}/history/export?range=${range}`, {
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `farm-history-${range}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};

export default historyService;
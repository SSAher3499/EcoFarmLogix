import api from './api';

const automationService = {
  // Get all rules for a farm
  getFarmRules: async (farmId) => {
    const response = await api.get(`/farms/${farmId}/automation-rules`);
    return response.data;
  },

  // Get farm components (sensors & actuators)
  getFarmComponents: async (farmId) => {
    const response = await api.get(`/farms/${farmId}/components`);
    return response.data;
  },

  // Create new rule
  createRule: async (farmId, ruleData) => {
    const response = await api.post(`/farms/${farmId}/automation-rules`, ruleData);
    return response.data;
  },

  // Update rule
  updateRule: async (ruleId, ruleData) => {
    const response = await api.put(`/automation-rules/${ruleId}`, ruleData);
    return response.data;
  },

  // Delete rule
  deleteRule: async (ruleId) => {
    const response = await api.delete(`/automation-rules/${ruleId}`);
    return response.data;
  },

  // Toggle rule enabled/disabled
  toggleRule: async (ruleId) => {
    const response = await api.patch(`/automation-rules/${ruleId}/toggle`);
    return response.data;
  }
};

export default automationService;
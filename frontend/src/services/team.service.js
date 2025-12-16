import api from './api';

const teamService = {
  // Get team members for a farm
  getTeam: async (farmId) => {
    const response = await api.get(`/farms/${farmId}/team`);
    return response.data;
  },

  // Add team member
  addTeamMember: async (farmId, memberData) => {
    const response = await api.post(`/farms/${farmId}/team`, memberData);
    return response.data;
  },

  // Update team member role
  updateTeamMember: async (farmId, memberId, role) => {
    const response = await api.put(`/farms/${farmId}/team/${memberId}`, { role });
    return response.data;
  },

  // Remove team member
  removeTeamMember: async (farmId, memberId) => {
    const response = await api.delete(`/farms/${farmId}/team/${memberId}`);
    return response.data;
  }
};

export default teamService;
import api from './api';

const scheduleService = {
  // Get all schedules for a farm
  getFarmSchedules: async (farmId) => {
    const response = await api.get(`/farms/${farmId}/schedules`);
    return response.data;
  },

  // Get single schedule
  getSchedule: async (scheduleId) => {
    const response = await api.get(`/schedules/${scheduleId}`);
    return response.data;
  },

  // Create new schedule
  createSchedule: async (farmId, scheduleData) => {
    const response = await api.post(`/farms/${farmId}/schedules`, scheduleData);
    return response.data;
  },

  // Update schedule
  updateSchedule: async (scheduleId, scheduleData) => {
    const response = await api.put(`/schedules/${scheduleId}`, scheduleData);
    return response.data;
  },

  // Delete schedule
  deleteSchedule: async (scheduleId) => {
    const response = await api.delete(`/schedules/${scheduleId}`);
    return response.data;
  },

  // Toggle schedule enabled/disabled
  toggleSchedule: async (scheduleId) => {
    const response = await api.post(`/schedules/${scheduleId}/toggle`);
    return response.data;
  }
};

export default scheduleService;

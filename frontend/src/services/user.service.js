import api from './api';

const userService = {
  // Get all users (Super Admin only)
  getAllUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  // Get user by ID
  getUser: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  // Create user (Super Admin only)
  createUser: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  // Update user
  updateUser: async (userId, userData) => {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  },

  // Reset user password
  resetPassword: async (userId, newPassword) => {
    const response = await api.put(`/users/${userId}/reset-password`, { newPassword });
    return response.data;
  },

  // Deactivate user
  deactivateUser: async (userId) => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  }
};

export default userService;
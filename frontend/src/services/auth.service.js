import api from './api';

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user } = response.data.data;
    
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    return { user, accessToken };
  },

  async register(data) {
    const response = await api.post('/auth/register', data);
    const { accessToken, refreshToken, user } = response.data.data;
    
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    return { user, accessToken };
  },

  async logout() {
    const refreshToken = localStorage.getItem('refreshToken');
    
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data.data.user;
  },

  isAuthenticated() {
    return !!localStorage.getItem('accessToken');
  }
};
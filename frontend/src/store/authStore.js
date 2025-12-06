import { create } from 'zustand';
import { authService } from '../services/auth.service';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  login: async (email, password) => {
    const { user } = await authService.login(email, password);
    set({ user, isAuthenticated: true });
    return user;
  },

  register: async (data) => {
    const { user } = await authService.register(data);
    set({ user, isAuthenticated: true });
    return user;
  },

  logout: async () => {
    await authService.logout();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    
    if (!authService.isAuthenticated()) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const user = await authService.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
import { create } from 'zustand';
import { authService } from '../services/auth.service';
import { hasPermission as checkPermission, isSuperAdmin as checkSuperAdmin } from '../utils/permissions';

export const useAuthStore = create((set, get) => ({
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

  // Permission helpers
  hasPermission: (permission) => {
    const user = get().user;
    if (!user) return false;
    return checkPermission(user.role, permission);
  },

  isSuperAdmin: () => {
    const user = get().user;
    return checkSuperAdmin(user);
  },

  canControlActuators: () => {
    const user = get().user;
    if (!user) return false;
    return checkPermission(user.role, 'controlActuators');
  },

  canManageDevices: () => {
    const user = get().user;
    if (!user) return false;
    return checkPermission(user.role, 'viewDeviceManagement');
  },

  canViewAutomation: () => {
    const user = get().user;
    if (!user) return false;
    return checkPermission(user.role, 'viewAutomation');
  },

  canViewTeam: () => {
    const user = get().user;
    if (!user) return false;
    return checkPermission(user.role, 'viewTeam');
  },

  canExportData: () => {
    const user = get().user;
    if (!user) return false;
    return checkPermission(user.role, 'exportData');
  }
}));
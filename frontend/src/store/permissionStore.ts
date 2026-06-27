import { create } from 'zustand';
import { useAuthStore } from './authStore';

interface PermissionState {
  permissions: string[];
  hasPermission: (key: string) => boolean;
  hasAnyPermission: (keys: string[]) => boolean;
  hasAllPermissions: (keys: string[]) => boolean;
  setPermissions: (permissions: string[]) => void;
}

export const usePermissionStore = create<PermissionState>((set) => ({
  permissions: [],

  hasPermission: (key: string) => {
    const perms = useAuthStore.getState().user?.permissions || [];
    return perms.includes(key);
  },

  hasAnyPermission: (keys: string[]) => {
    const perms = useAuthStore.getState().user?.permissions || [];
    return keys.some(k => perms.includes(k));
  },

  hasAllPermissions: (keys: string[]) => {
    const perms = useAuthStore.getState().user?.permissions || [];
    return keys.every(k => perms.includes(k));
  },

  setPermissions: (permissions: string[]) => set({ permissions }),
}));

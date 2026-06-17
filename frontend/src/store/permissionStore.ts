import { create } from 'zustand';
import { MOCK_ROLES } from '../services/mockData';

interface PermissionState {
  permissions: string[];
  hasPermission: (key: string) => boolean;
  hasAnyPermission: (keys: string[]) => boolean;
  setPermissions: (permissions: string[]) => void;
}

// Default: Super Admin has all permissions
const defaultPermissions = MOCK_ROLES[0].permissions;

export const usePermissionStore = create<PermissionState>((set, get) => ({
  permissions: defaultPermissions,

  hasPermission: (key: string) => get().permissions.includes(key),

  hasAnyPermission: (keys: string[]) =>
    keys.some((key) => get().permissions.includes(key)),

  setPermissions: (permissions: string[]) => set({ permissions }),
}));

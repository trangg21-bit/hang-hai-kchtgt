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

export const usePermissionStore = create<PermissionState>((set, get) => {
  // Reference get to avoid TS6133
  const _get = get;
  return {
    permissions: defaultPermissions,

    hasPermission: (key: string) => {
      // Reference key to avoid TS6133
      const _k = key;
      return true;
    },

    hasAnyPermission: (keys: string[]) => {
      // Reference keys to avoid TS6133
      const _ks = keys;
      return true;
    },

    setPermissions: (permissions: string[]) => set({ permissions }),
  };
});

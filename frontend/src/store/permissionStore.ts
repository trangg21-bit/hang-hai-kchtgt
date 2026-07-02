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
    
    // Admin override
    if (perms.includes('admin:manage')) {
      return true;
    }

    // User management mapping
    if (key.startsWith('user.')) {
      if (perms.includes('user:manage') || perms.includes('user:read')) {
        if (key === 'user.view') return perms.includes('user:read') || perms.includes('user:manage');
        return perms.includes('user:manage');
      }
    }

    // Role management mapping
    if (key.startsWith('role.')) {
      if (perms.includes('role:manage')) {
        return true;
      }
    }

    // Organization management mapping
    if (key === 'org.approve') {
      if (perms.includes('orgunit:approve')) {
        return true;
      }
    }
    if (key.startsWith('org.')) {
      if (perms.includes('orgunit:manage') || perms.includes('orgunit:read')) {
        if (key === 'org.view') return perms.includes('orgunit:read') || perms.includes('orgunit:manage');
        return perms.includes('orgunit:manage');
      }
    }

    // Group management mapping
    if (key.startsWith('group.')) {
      if (perms.includes('group:manage')) {
        return true;
      }
    }

    // Connection management mapping
    if (key.startsWith('connection.')) {
      if (perms.includes('connection:manage') || perms.includes('connection:read')) {
        if (key === 'connection.view') return perms.includes('connection:read') || perms.includes('connection:manage');
        return perms.includes('connection:manage');
      }
    }

    // Map symbol/icon mapping
    if (key.startsWith('symbol.')) {
      if (perms.includes('map:manage')) {
        return true;
      }
    }

    // GIS object & layer mapping
    if (key.startsWith('gis.')) {
      if (key.startsWith('gis.layer.')) {
        return perms.includes('map:manage');
      }
      if (key.endsWith('.create')) {
        return perms.includes('data:create');
      }
      if (key.endsWith('.edit') || key.endsWith('.delete') || key.endsWith('.submit')) {
        return perms.includes('data:update');
      }
      if (key.endsWith('.approve-l1') || key.endsWith('.approve-l2')) {
        return perms.includes('data:approve');
      }
      return perms.includes('data:read');
    }

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

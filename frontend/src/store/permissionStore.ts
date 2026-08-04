import { create } from 'zustand';
import { useAuthStore } from './authStore';

interface PermissionState {
  permissions: string[];
  hasPermission: (key: string) => boolean;
  hasAnyPermission: (keys: string[]) => boolean;
  hasAllPermissions: (keys: string[]) => boolean;
  setPermissions: (permissions: string[]) => void;
}

/**
 * Normalize legacy dot-notation keys to standard backend permission keys {resource}:{action}.
 */
function normalizePermissionKey(key: string): string {
  if (!key) return '';
  if (key.includes(':')) return key;

  // Backward compatibility normalization for legacy UI keys
  if (key.startsWith('user.')) return key.replace('user.view', 'user:read').replace('user.', 'user:');
  if (key.startsWith('role.')) return key.replace('role.', 'role:');
  if (key.startsWith('group.')) return key.replace('group.', 'group:');
  if (key.startsWith('connection.')) return key.replace('connection.view', 'connection:read').replace('connection.', 'connection:');
  if (key.startsWith('org.')) return key.replace('org.view', 'orgunit:read').replace('org.approve', 'orgunit:approve').replace('org.', 'orgunit:');
  if (key.startsWith('symbol.')) return 'map:manage';
  if (key.startsWith('gis.')) {
    if (key.startsWith('gis.layer.')) return 'map:manage';
    if (key.endsWith('.create')) return 'data:create';
    if (key.endsWith('.edit') || key.endsWith('.delete') || key.endsWith('.submit')) return 'data:update';
    if (key.endsWith('.approve-l1') || key.endsWith('.approve-l2')) return 'data:approve';
    return 'data:read';
  }

  return key.replace('.', ':');
}

export const usePermissionStore = create<PermissionState>((set) => ({
  permissions: [],

  hasPermission: (key: string) => {
    const perms = useAuthStore.getState().user?.permissions || [];

    // Admin override
    if (perms.includes('admin:manage') || perms.includes('*')) {
      return true;
    }

    const normalizedKey = normalizePermissionKey(key);
    if (perms.includes(normalizedKey)) {
      return true;
    }

    // Support wildcard matching: {resource}:manage or {resource}:* grants any action on resource
    const [resource] = normalizedKey.split(':');
    if (resource) {
      if (perms.includes(`${resource}:manage`) || perms.includes(`${resource}:*`)) {
        return true;
      }
    }

    return false;
  },

  hasAnyPermission: (keys: string[]) => {
    const store = usePermissionStore.getState();
    return keys.some((k) => store.hasPermission(k));
  },

  hasAllPermissions: (keys: string[]) => {
    const store = usePermissionStore.getState();
    return keys.every((k) => store.hasPermission(k));
  },

  setPermissions: (permissions: string[]) => set({ permissions }),
}));

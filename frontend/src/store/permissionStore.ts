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
  const lower = key.toLowerCase();

  // Backward compatibility normalization for legacy UI keys
  if (lower.startsWith('user.')) return lower.replace('user.view', 'user:read').replace('user.', 'user:');
  if (lower.startsWith('role.')) return lower.replace('role.', 'role:');
  if (lower.startsWith('group.')) return lower.replace('group.', 'group:');
  if (lower.startsWith('connection.')) return lower.replace('connection.view', 'connection:read').replace('connection.', 'connection:');
  if (lower.startsWith('org.')) return lower.replace('org.view', 'orgunit:read').replace('org.approve', 'orgunit:approve').replace('org.', 'orgunit:');
  if (lower.startsWith('symbol.')) return 'map:manage';
  if (lower.startsWith('gis.')) {
    if (lower.startsWith('gis.layer.')) return 'map:manage';
    if (lower.endsWith('.create')) return 'data:create';
    if (lower.endsWith('.edit') || lower.endsWith('.delete') || lower.endsWith('.submit')) return 'data:update';
    if (lower.endsWith('.approve-l1') || lower.endsWith('.approve-l2')) return 'data:approve';
    return 'data:read';
  }

  return lower.replace('.', ':');
}

export const usePermissionStore = create<PermissionState>((set) => ({
  permissions: [],

  hasPermission: (key: string) => {
    const rawPerms = useAuthStore.getState().user?.permissions || [];
    const perms = rawPerms.map((p) => p.toLowerCase());

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

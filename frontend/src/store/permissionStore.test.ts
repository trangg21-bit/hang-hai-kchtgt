if (typeof globalThis.localStorage === 'undefined') {
  const mockStorage: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, value: string) => {
      mockStorage[key] = value;
    },
    removeItem: (key: string) => {
      delete mockStorage[key];
    },
    clear: () => {
      Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
    },
  };
}

import { describe, it, expect, beforeEach } from 'vitest';
import { usePermissionStore } from './permissionStore';
import { useAuthStore } from './authStore';

describe('permissionStore Unit Tests', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: '1',
        username: 'testuser',
        permissions: [],
      } as any,
    });
    usePermissionStore.setState({ permissions: [] });
  });

  it('should not treat admin:manage as global access', () => {
    useAuthStore.setState({
      user: { id: '1', username: 'admin', permissions: ['admin:manage'] } as any,
    });

    const store = usePermissionStore.getState();
    expect(store.hasPermission('admin:manage')).toBe(true);
    expect(store.hasPermission('user:read')).toBe(false);
    expect(store.hasPermission('anything:do')).toBe(false);
  });

  it('should return true when user has admin:all direct permission', () => {
    useAuthStore.setState({
      user: { id: '1', username: 'admin', permissions: ['admin:all'] } as any,
    });

    const store = usePermissionStore.getState();
    expect(store.hasPermission('user:read')).toBe(true);
    expect(store.hasPermission('anything:do')).toBe(true);
  });

  it('should return true when user has * wildcard override', () => {
    useAuthStore.setState({
      user: { id: '1', username: 'admin', permissions: ['*'] } as any,
    });

    const store = usePermissionStore.getState();
    expect(store.hasPermission('document:approve')).toBe(true);
  });

  it('should return true for direct exact permission match', () => {
    useAuthStore.setState({
      user: { id: '1', username: 'user1', permissions: ['user:read', 'role:manage'] } as any,
    });

    const store = usePermissionStore.getState();
    expect(store.hasPermission('user:read')).toBe(true);
    expect(store.hasPermission('role:manage')).toBe(true);
    expect(store.hasPermission('user:delete')).toBe(false);
  });

  it('should return true when user has resource:manage wildcard permission', () => {
    useAuthStore.setState({
      user: { id: '1', username: 'user1', permissions: ['user:manage'] } as any,
    });

    const store = usePermissionStore.getState();
    expect(store.hasPermission('user:read')).toBe(true);
    expect(store.hasPermission('user:create')).toBe(true);
    expect(store.hasPermission('user:delete')).toBe(true);
    expect(store.hasPermission('role:read')).toBe(false);
  });

  it('should normalize legacy dot notation permission keys', () => {
    useAuthStore.setState({
      user: {
        id: '1',
        username: 'user1',
        permissions: ['user:read', 'map:manage', 'data:create'],
      } as any,
    });

    const store = usePermissionStore.getState();
    expect(store.hasPermission('user.view')).toBe(true);
    expect(store.hasPermission('symbol.list')).toBe(true);
    expect(store.hasPermission('gis.point.create')).toBe(true);
  });

  it('should evaluate hasAnyPermission correctly', () => {
    useAuthStore.setState({
      user: { id: '1', username: 'user1', permissions: ['user:read'] } as any,
    });

    const store = usePermissionStore.getState();
    expect(store.hasAnyPermission(['user:delete', 'user:read'])).toBe(true);
    expect(store.hasAnyPermission(['user:delete', 'role:manage'])).toBe(false);
  });

  it('should evaluate hasAllPermissions correctly', () => {
    useAuthStore.setState({
      user: { id: '1', username: 'user1', permissions: ['user:read', 'user:update'] } as any,
    });

    const store = usePermissionStore.getState();
    expect(store.hasAllPermissions(['user:read', 'user:update'])).toBe(true);
    expect(store.hasAllPermissions(['user:read', 'user:delete'])).toBe(false);
  });

  it('should automatically sync permissions array when authStore user updates', () => {
    useAuthStore.setState({
      user: { id: '1', username: 'user1', permissions: ['vts:read', 'vts:approvec1'] } as any,
    });

    expect(usePermissionStore.getState().permissions).toEqual(['vts:read', 'vts:approvec1']);
    expect(usePermissionStore.getState().hasPermission('vts:approvec1')).toBe(true);
  });
});

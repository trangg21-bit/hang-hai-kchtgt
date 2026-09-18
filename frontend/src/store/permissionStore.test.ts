const globalWithStorage = globalThis as unknown as { localStorage?: Storage };

if (typeof globalWithStorage.localStorage === 'undefined') {
  const mockStorage: Record<string, string> = {};
  globalWithStorage.localStorage = {
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
  } as unknown as Storage;
}

import { describe, it, expect, beforeEach } from 'vitest';
import { usePermissionStore } from './permissionStore';
import { useAuthStore, type User } from './authStore';

describe('permissionStore Unit Tests', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: '1',
        username: 'testuser',
        permissions: [],
      } as User,
    });
    usePermissionStore.setState({ permissions: [] });
  });

  it('should not treat admin:manage as global access', () => {
    useAuthStore.setState({
    user: { id: '1', username: 'admin', permissions: ['admin:manage'] } as User,
    });

    const store = usePermissionStore.getState();
    expect(store.hasPermission('admin:manage')).toBe(true);
    expect(store.hasPermission('user:read')).toBe(false);
    expect(store.hasPermission('anything:do')).toBe(false);
  });

  it('should return true when user has user:permission direct permission', () => {
    useAuthStore.setState({
    user: { id: '1', username: 'admin', permissions: ['user:permission'] } as User,
    });

    const store = usePermissionStore.getState();
    expect(store.hasPermission('user:permission')).toBe(true);
    expect(store.hasPermission('user:manage')).toBe(false);
  });

  it('does not treat an admin wildcard claim as business-resource access', () => {
    useAuthStore.setState({
    user: { id: '1', username: 'admin', permissions: ['*'] } as User,
    });

    const store = usePermissionStore.getState();
    expect(store.hasPermission('document:approve')).toBe(false);
    expect(store.hasPermission('vts:approvec1')).toBe(false);
    expect(store.hasPermission('vts:approvec2')).toBe(false);
    expect(store.hasPermission('seaportthroughput:approve_level2')).toBe(false);
  });

  it('requires an explicit C1/C2 permission even when a resource has manage', () => {
    useAuthStore.setState({
    user: { id: '1', username: 'manager', permissions: ['vts:manage', 'vts:approvec2'] } as User,
    });

    const store = usePermissionStore.getState();
    expect(store.hasPermission('vts:approvec1')).toBe(false);
    expect(store.hasPermission('vts:approvec2')).toBe(true);
  });

  it('does not use Operation Center VTS approval to approve the VTS System resource', () => {
    useAuthStore.setState({
      user: {
        id: 'vts-operation-center-approver',
        username: 'operation_center_approver',
        permissions: ['vtsoperationcenter:approvec2'],
      } as User,
    });

    const store = usePermissionStore.getState();
    expect(store.hasPermission('vtsoperationcenter:approvec2')).toBe(true);
    expect(store.hasPermission('vts:approvec2')).toBe(false);
  });

  it('does not accept a legacy shared approval key', () => {
    useAuthStore.setState({
      user: {
        id: 'legacy-approver',
        username: 'legacy_approver',
        permissions: ['data:approvec2', 'kcht:approve_level1'],
      } as User,
    });

    const store = usePermissionStore.getState();
    expect(store.hasPermission('data:approvec2')).toBe(false);
    expect(store.hasPermission('kcht:approve_level1')).toBe(false);
    expect(store.hasPermission('vts:approvec2')).toBe(false);
  });

  it('should return true for direct exact permission match', () => {
    useAuthStore.setState({
    user: { id: '1', username: 'user1', permissions: ['user:read', 'role:manage'] } as User,
    });

    const store = usePermissionStore.getState();
    expect(store.hasPermission('user:read')).toBe(true);
    expect(store.hasPermission('role:manage')).toBe(true);
    expect(store.hasPermission('user:delete')).toBe(false);
  });

  it('should return true when user has resource:manage wildcard permission', () => {
    useAuthStore.setState({
    user: { id: '1', username: 'user1', permissions: ['user:manage'] } as User,
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
      } as User,
    });

    const store = usePermissionStore.getState();
    expect(store.hasPermission('user.view')).toBe(true);
    expect(store.hasPermission('symbol.list')).toBe(true);
    expect(store.hasPermission('gis.point.create')).toBe(true);
  });

  it('should evaluate hasAnyPermission correctly', () => {
    useAuthStore.setState({
    user: { id: '1', username: 'user1', permissions: ['user:read'] } as User,
    });

    const store = usePermissionStore.getState();
    expect(store.hasAnyPermission(['user:delete', 'user:read'])).toBe(true);
    expect(store.hasAnyPermission(['user:delete', 'role:manage'])).toBe(false);
  });

  it('does not use legacy umbrella read permission to open a concrete station screen', () => {
    useAuthStore.setState({
      user: { id: '1', username: 'admin', permissions: ['data:read', 'specialstation:read'] } as User,
    });

    const store = usePermissionStore.getState();
    expect(store.hasAnyPermission([
      'coastalstationinmarsat:read',
      'specialstation:read',
      'data:read',
    ])).toBe(false);
    expect(store.hasAnyPermission([
      'coastalstationinmarsat:read',
      'inmarsat:read',
      'inmarsatasset:read',
    ])).toBe(false);
  });

  it('does not allow an Inmarsat asset permission to open the station screen', () => {
    useAuthStore.setState({
      user: { id: '1', username: 'inmarsat-reader', permissions: ['inmarsat:read'] } as User,
    });

    expect(usePermissionStore.getState().hasPermission('coastalstationinmarsat:read')).toBe(false);
  });

  it('should evaluate hasAllPermissions correctly', () => {
    useAuthStore.setState({
    user: { id: '1', username: 'user1', permissions: ['user:read', 'user:update'] } as User,
    });

    const store = usePermissionStore.getState();
    expect(store.hasAllPermissions(['user:read', 'user:update'])).toBe(true);
    expect(store.hasAllPermissions(['user:read', 'user:delete'])).toBe(false);
  });

  it('should automatically sync permissions array when authStore user updates', () => {
    useAuthStore.setState({
    user: { id: '1', username: 'user1', permissions: ['vts:read', 'vts:approvec1'] } as User,
    });

    expect(usePermissionStore.getState().permissions).toEqual(['vts:read', 'vts:approvec1']);
    expect(usePermissionStore.getState().hasPermission('vts:approvec1')).toBe(true);
  });

  it('should require an explicit read permission for KCHT resources', () => {
    // User only has approvec1 for VTS, no explicit read
    useAuthStore.setState({
    user: { id: '1', username: 'evaluator', permissions: ['vts:approvec1'] } as User,
    });

    const store = usePermissionStore.getState();
    expect(store.hasPermission('vts:read')).toBe(false);
    expect(store.hasPermission('vts:view')).toBe(false);
    expect(store.hasPermission('vts:search')).toBe(false);
    expect(store.hasPermission('vts:delete')).toBe(false);

    // User only has create for LRIT station
    useAuthStore.setState({
    user: { id: '2', username: 'creator', permissions: ['coastalstationlrit:create'] } as User,
    });

    expect(store.hasPermission('coastalstationlrit:read')).toBe(false);
    expect(store.hasPermission('coastalstationlrit:delete')).toBe(false);
  });

  it('should not cover child stations from a parent station permission', () => {
    useAuthStore.setState({
    user: { id: '3', username: 'specialAdmin', permissions: ['specialstation:read'] } as User,
    });

    const store = usePermissionStore.getState();
    expect(store.hasPermission('coastalstationlrit:read')).toBe(false);
    // `inmarsat` is the legacy asset resource; the dedicated coastal-station
    // resources above must remain isolated from the parent permission.
    expect(store.hasPermission('inmarsat:read')).toBe(true);
    expect(store.hasPermission('coastalstationhaiphong:read')).toBe(false);
    expect(store.hasPermission('coastalstationcospassarsat:read')).toBe(false);
  });

  it('should not leak vts permissions to vtsoperationcenter or vhf', () => {
    useAuthStore.setState({
    user: { id: '4', username: 'vtsCreator', permissions: ['vts:create'] } as User,
    });

    const store = usePermissionStore.getState();
    expect(store.hasPermission('vts:create')).toBe(true);
    expect(store.hasPermission('vts:read')).toBe(false);
    expect(store.hasExplicitPermission('vts:read')).toBe(false);
    expect(store.hasExplicitPermission('vts:create')).toBe(true);
    expect(store.hasPermission('vtsoperationcenter:read')).toBe(false);
    expect(store.hasPermission('vtsoperationcenter:create')).toBe(false);
    expect(store.hasPermission('vhf:read')).toBe(false);
    expect(store.hasPermission('vhf:create')).toBe(false);
  });

  it('should symmetrically resolve equivalent asset permissions (dryport <-> dryportasset)', () => {
    useAuthStore.setState({
    user: { id: '5', username: 'dryportAssetUser', permissions: ['dryportasset:read', 'berth:create'] } as User,
    });

    const store = usePermissionStore.getState();
    // dryportasset:read grants dryport:read
    expect(store.hasPermission('dryport:read')).toBe(true);
    expect(store.hasExplicitPermission('dryport:read')).toBe(true);
    expect(store.hasPermission('dryportasset:read')).toBe(true);
    expect(store.hasExplicitPermission('dryportasset:read')).toBe(true);

    // berth:create grants berthasset:create
    expect(store.hasPermission('berthasset:create')).toBe(true);
    expect(store.hasExplicitPermission('berthasset:create')).toBe(true);
    expect(store.hasPermission('berth:create')).toBe(true);
    expect(store.hasExplicitPermission('berth:create')).toBe(true);

    // Unrelated actions remain false
    expect(store.hasPermission('dryport:delete')).toBe(false);
    expect(store.hasExplicitPermission('dryport:delete')).toBe(false);
    expect(store.hasPermission('berth:delete')).toBe(false);
  });
});

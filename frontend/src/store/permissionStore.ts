import { create } from 'zustand';
import { useAuthStore } from './authStore';

/** WeakMap memoize: tái sử dụng Set quyền theo reference mảng gốc, tránh tạo lại mỗi lần gọi. */
const permissionSetCache = new WeakMap<object, Set<string>>();
const EMPTY_PERMISSIONS: string[] = [];

export interface PermissionState {
  permissions: string[];
  hasPermission: (key: string) => boolean;
  hasAnyPermission: (keys: string[]) => boolean;
  hasAllPermissions: (keys: string[]) => boolean;
  setPermissions: (permissions: string[]) => void;
}

const RESOURCE_CANONICAL_MAP: Record<string, string> = {
  vtssystem: 'vts',
  tramradar: 'radarstation',
  beaconlight: 'beaconstation',
  interconnect: 'connection',
  groupmember: 'group',
  shiprepair: 'shiprepairfacility',
  shiprepairyard: 'shiprepairfacility',
};

const RESOURCE_PARENT_DOMAINS: Record<string, string[]> = {
  coastalstationlrit: ['specialstation', 'coastalstation', 'station', 'data'],
  coastalstationinmarsat: ['specialstation', 'coastalstation', 'station', 'data'],
  coastalstationhaiphong: ['specialstation', 'coastalstation', 'station', 'data'],
  coastalstationcospassarsat: ['specialstation', 'coastalstation', 'station', 'data'],
  vtsoperationcenter: ['vts'],
  portplanning: ['document'],
  planningadjustment: ['document'],
  operationplan: ['document'],
  maintenanceplan: ['document'],
};

export function canonicalResource(resource: string): string {
  if (!resource) return '';
  const lower = resource.toLowerCase();
  return RESOURCE_CANONICAL_MAP[lower] || lower;
}

export function isResourceCoveredBy(candidateResource: string, targetResource: string): boolean {
  const canonicalCandidate = canonicalResource(candidateResource);
  const canonicalTarget = canonicalResource(targetResource);
  if (canonicalCandidate === canonicalTarget) return true;
  const parents = RESOURCE_PARENT_DOMAINS[canonicalTarget];
  return parents ? parents.includes(canonicalCandidate) : false;
}

/**
 * Normalize legacy dot-notation keys to standard backend permission keys {resource}:{action}.
 */
export function normalizePermissionKey(key: string): string {
  if (!key) return '';
  const lower = key.toLowerCase();

  // Backward compatibility normalization for legacy UI keys
  if (lower.startsWith('user.')) return lower.replace('user.view', 'user:read').replace('user.', 'user:');
  if (lower.startsWith('role.')) return lower.replace('role.', 'role:');
  if (lower.startsWith('group.')) return lower.replace('group.', 'group:');
  if (lower.startsWith('connection.')) return lower.replace('connection.view', 'connection:read').replace('connection.', 'connection:');
  if (lower.startsWith('org.')) return lower.replace('org.view', 'orgunit:read').replace('org.', 'orgunit:');
  if (lower.startsWith('symbol.')) return 'map:manage';
  if (lower.startsWith('tramradar.')) return lower.replace('tramradar.', 'radarstation:');
  if (lower.startsWith('tramradar:')) return lower.replace('tramradar:', 'radarstation:');
  if (lower.startsWith('beaconlight.')) return lower.replace('beaconlight.', 'beaconstation:');
  if (lower.startsWith('beaconlight:')) return lower.replace('beaconlight:', 'beaconstation:');
  if (lower.startsWith('gis.')) {
    if (lower.startsWith('gis.layer.')) return 'map:manage';
    if (lower.endsWith('.create')) return 'data:create';
    if (lower.endsWith('.edit') || lower.endsWith('.delete') || lower.endsWith('.submit')) return 'data:update';
    if (lower.endsWith('.approve-l1') || lower.endsWith('.approve-l2')) return 'data:approve';
    return 'data:read';
  }

  // Approval permissions are stored canonically as vts:approvec1/approvec2
  // (and the same convention is used by the permission seeder). Accept the
  // more readable nested form used by some screens as an alias.
  return lower
    .replace('.', ':')
    .replace('user:edit', 'user:update')
    .replace('user:lock', 'user:update')
    .replace('user:reset_password', 'user:update')
    .replace(':approve:c1', ':approvec1')
    .replace(':approve:c2', ':approvec2');
}

/**
 * Quyền hiệu lực trên giao diện là hợp nhất quyền trực tiếp của user và
 * quyền group được Backend đưa vào JWT/profile. Không coi admin:manage là
 * toàn quyền; chỉ * mới được wildcard bypass.
 */
export function hasPermissionFromList(grantedPermissions: string[] | undefined, key: string): boolean {
  const normalizedKey = normalizePermissionKey(key);
  if (!normalizedKey) return false;

  const source: object = grantedPermissions ?? EMPTY_PERMISSIONS;
  let permissions = permissionSetCache.get(source);
  if (!permissions) {
    permissions = new Set(
      (grantedPermissions || [])
        .map((permission) => normalizePermissionKey(permission.trim()))
        .filter(Boolean),
    );
    permissionSetCache.set(source, permissions);
  }

  if (permissions.has('*') || permissions.has(normalizedKey)) {
    return true;
  }

  const [rawResource, action] = normalizedKey.split(':', 2);
  if (!rawResource) return false;

  const resource = canonicalResource(rawResource);

  if (permissions.has(`${rawResource}:manage`) || permissions.has(`${resource}:manage`) ||
      permissions.has(`${rawResource}:*`) || permissions.has(`${resource}:*`)) {
    return true;
  }

  // Parent domain match
  const parents = RESOURCE_PARENT_DOMAINS[resource];
  if (parents) {
    for (const parent of parents) {
      if (permissions.has(`${parent}:${action}`) || permissions.has(`${parent}:manage`) || permissions.has(`${parent}:*`)) {
        return true;
      }
    }
  }

  // Implicit Read: Có bất kỳ quyền thao tác nào trên resource (hoặc domain bao trùm) thì mặc định có quyền xem
  if (action === 'read' || action === 'view' || action === 'search') {
    for (const p of permissions) {
      const pRes = p.split(':', 2)[0];
      if (isResourceCoveredBy(pRes, resource)) {
        return true;
      }
    }
  }

  if (['create', 'update', 'delete'].includes(action || '') &&
      (permissions.has(`${rawResource}:write`) || permissions.has(`${resource}:write`))) {
    return true;
  }

  if (action === 'approve' && (
    permissions.has(`${rawResource}:approvec1`) || permissions.has(`${resource}:approvec1`) ||
    permissions.has(`${rawResource}:approvec2`) || permissions.has(`${resource}:approvec2`)
  )) {
    return true;
  }

  return false;
}

const initialPermissions = useAuthStore.getState().user?.permissions || [];

export const usePermissionStore = create<PermissionState>((set, get) => ({
  permissions: initialPermissions,

  hasPermission: (key: string) => {
    const storePerms = get().permissions;
    const authPerms = useAuthStore.getState().user?.permissions;
    return hasPermissionFromList(storePerms.length > 0 ? storePerms : authPerms, key);
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

// Automatically sync permissionStore whenever authStore user/permissions change (login, logout, token renewal)
useAuthStore.subscribe((state) => {
  const currentPerms = state.user?.permissions || [];
  const existingPerms = usePermissionStore.getState().permissions;
  if (currentPerms !== existingPerms) {
    usePermissionStore.setState({ permissions: currentPerms });
  }
});

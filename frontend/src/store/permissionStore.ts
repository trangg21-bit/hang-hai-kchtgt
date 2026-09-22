import { create } from 'zustand';
import { useAuthStore } from './authStore';

/** WeakMap memoize: tái sử dụng Set quyền theo reference mảng gốc, tránh tạo lại mỗi lần gọi. */
const permissionSetCache = new WeakMap<object, Set<string>>();
const EMPTY_PERMISSIONS: string[] = [];

// Legacy umbrella resources were historically appended to route permission
// lists (for example `data:read` on an Inmarsat screen).  They must not open a
// resource-specific screen when its own checkbox is not assigned.
const LEGACY_ROUTE_FALLBACK_RESOURCES = new Set([
  'data', 'infraasset', 'specialstation', 'coastalstation', 'station',
]);

const KCHT_RESOURCE_CANONICALS = new Set([
  // Infrastructure (28 modules)
  'port', 'berth', 'pier', 'buoyberth', 'anchorage', 'transferarea', 'stormshelter', 'dryport',
  'waterzone', 'waterarea', 'navigationchannel', 'dikerevetment', 'shiprepairfacility', 'radarstation',
  'lighthouse', 'buoy', 'vts', 'vtsoperationcenter', 'vtsassist', 'aissystem', 'cctv', 'scada',
  'transmission', 'vhf', 'daittdh', 'cospassarsat', 'lrit', 'ttxltt', 'coastalstation',
  'specialstation', 'station', 'coastalstationinmarsat', 'coastalstationcospassarsat', 'coastalstationhaiphong',
  'coastalstationlrit',

  // Asset (24 asset types + 4 asset business operations)
  'berthasset', 'transferareaasset', 'stormshelterasset', 'buoyberthasset', 'pierasset', 'anchorageasset',
  'lighthouseasset', 'dikerevetmentasset', 'buoyasset', 'channelasset', 'dryportasset', 'lritasset',
  'cospassarsatasset', 'ttxlttasset', 'vtsasset', 'radarasset', 'aisasset', 'cctvasset', 'scadaasset',
  'transmissionasset', 'vtsassistasset', 'vhfasset', 'daittdhasset', 'inmarsatasset',
  'assetincrease', 'assetdecrease', 'inventoryasset', 'assetexploitation',
  'movementrequest', 'inventoryplan', 'inventoryreport', 'asset', 'infraasset',

  // Operations & GIS
  'approvalrecord', 'processingrecord', 'maintenanceplan', 'operationplan', 'incident',
  'gispoint', 'pointobject', 'gisline', 'lineobject', 'gispolygon', 'polygonobject',
]);

export interface PermissionState {
  permissions: string[];
  hasPermission: (key: string, options?: { explicitOnly?: boolean }) => boolean;
  hasExplicitPermission: (key: string) => boolean;
  hasAnyPermission: (keys: string[]) => boolean;
  hasAllPermissions: (keys: string[]) => boolean;
  hasAnyResourcePermission: (resource: string) => boolean;
  setPermissions: (permissions: string[]) => void;
}

export const RESOURCE_CANONICAL_MAP: Record<string, string> = {
  // Infrastructure aliases -> chuẩn hóa về resource chính xác duy nhất
  channel: 'navigationchannel',
  vtssystem: 'vts',
  tramradar: 'radarstation',
  shiprepair: 'shiprepairfacility',
  shiprepairyard: 'shiprepairfacility',
  beaconstation: 'lighthouse',
  beaconlight: 'lighthouse',
  lighthousestation: 'lighthouse',
  coastalstationlrit: 'lrit',
  coastalstationcospassarsat: 'cospassarsat',
  coastalstationhaiphong: 'ttxltt',

  // System & shared resources
  interconnect: 'connection',
  seaport: 'port',
};

export function getEquivalentPermissionKeys(key: string): string[] {
  const normalized = normalizePermissionKey(key);
  if (!normalized) return [];
  const [res, ...rest] = normalized.split(':');
  const action = rest.join(':');
  if (!res) return [normalized];

  const canonical = canonicalResource(res);
  const keys = new Set<string>();
  keys.add(normalized);
  if (canonical) {
    keys.add(action ? `${canonical}:${action}` : canonical);
    for (const [alias, target] of Object.entries(RESOURCE_CANONICAL_MAP)) {
      if (target === canonical) {
        keys.add(action ? `${alias}:${action}` : alias);
      }
    }
  }
  return [...keys];
}

const RESOURCE_PARENT_DOMAINS: Record<string, string[]> = {
  inmarsat: ['specialstation', 'coastalstation', 'station'],
  portplanning: ['document'],
  planningadjustment: ['document'],
  operationplan: ['document'],
  maintenanceplan: ['document'],
};

export const RESOURCE_DESCENDANTS_MAP: Record<string, string[]> = {
  // Cảng biển (Ông) -> Bến cảng (Cha) -> Cầu cảng (Con), Khu chuyển tải, Khu neo đậu, v.v.
  port: [
    'berth', 'pier', 'shiprepairfacility', 'shiprepairyard', 'shiprepair',
    'anchorage', 'transferarea', 'stormshelter', 'dryport',
    'berthasset', 'pierasset', 'anchorageasset', 'transferareaasset', 'stormshelterasset', 'dryportasset'
  ],
  seaport: [
    'berth', 'pier', 'shiprepairfacility', 'shiprepairyard', 'shiprepair',
    'anchorage', 'transferarea', 'stormshelter', 'dryport',
    'berthasset', 'pierasset', 'anchorageasset', 'transferareaasset', 'stormshelterasset', 'dryportasset'
  ],
  berth: ['pier', 'pierasset'],
  berthasset: ['pier', 'pierasset'],

  // Luồng hàng hải (Ông) -> Nhà trạm phao tiêu (Cha) -> Phao tiêu (Con), Đèn biển, Đê kè, VHF, Bến phao
  navigationchannel: [
    'buoyberth', 'buoystation', 'buoy', 'beaconstation', 'lighthouse', 'beaconlight', 'dikerevetment', 'vhf',
    'buoyberthasset', 'buoyasset', 'lighthouseasset', 'dikerevetmentasset', 'vhfasset', 'channelasset'
  ],
  channel: [
    'buoyberth', 'buoystation', 'buoy', 'beaconstation', 'lighthouse', 'beaconlight', 'dikerevetment', 'vhf',
    'buoyberthasset', 'buoyasset', 'lighthouseasset', 'dikerevetmentasset', 'vhfasset', 'channelasset'
  ],
  channelasset: [
    'buoyberth', 'buoystation', 'buoy', 'beaconstation', 'lighthouse', 'beaconlight', 'dikerevetment', 'vhf',
    'buoyberthasset', 'buoyasset', 'lighthouseasset', 'dikerevetmentasset', 'vhfasset'
  ],
  buoystation: ['buoy', 'buoyasset'],

  // Hệ thống VTS (Cha/Ông) -> Trạm radar, AIS, CCTV, SCADA, Truyền dẫn, Phụ trợ, TT điều hành
  vts: [
    'vtsoperationcenter', 'radarstation', 'tramradar', 'aissystem', 'cctv', 'scada', 'transmission', 'vtsassist',
    'vtsasset', 'radarasset', 'aisasset', 'cctvasset', 'scadaasset', 'transmissionasset', 'vtsassistasset'
  ],
  vtssystem: [
    'vtsoperationcenter', 'radarstation', 'tramradar', 'aissystem', 'cctv', 'scada', 'transmission', 'vtsassist',
    'vtsasset', 'radarasset', 'aisasset', 'cctvasset', 'scadaasset', 'transmissionasset', 'vtsassistasset'
  ],
  vtsasset: [
    'vtsoperationcenter', 'radarstation', 'tramradar', 'aissystem', 'cctv', 'scada', 'transmission', 'vtsassist',
    'radarasset', 'aisasset', 'cctvasset', 'scadaasset', 'transmissionasset', 'vtsassistasset'
  ],

  // Đài viễn thông hàng hải (Cha/Ông) -> TTDH, Inmarsat, Cospas-Sarsat, LRIT, TTXLTT
  coastalstation: [
    'daittdh', 'inmarsat', 'cospassarsat', 'lrit', 'ttxltt',
    'daittdhasset', 'inmarsatasset', 'cospassarsatasset', 'lritasset', 'ttxlttasset'
  ],
  station: [
    'daittdh', 'inmarsat', 'cospassarsat', 'lrit', 'ttxltt',
    'daittdhasset', 'inmarsatasset', 'cospassarsatasset', 'lritasset', 'ttxlttasset'
  ],
  specialstation: [
    'daittdh', 'inmarsat', 'cospassarsat', 'lrit', 'ttxltt',
    'daittdhasset', 'inmarsatasset', 'cospassarsatasset', 'lritasset', 'ttxlttasset'
  ],
  coastalstationasset: [
    'daittdh', 'inmarsat', 'cospassarsat', 'lrit', 'ttxltt',
    'daittdhasset', 'inmarsatasset', 'cospassarsatasset', 'lritasset', 'ttxlttasset'
  ],
};

export function hasAnyPermissionForResource(
  grantedPermissions: string[] | undefined,
  targetResource: string,
): boolean {
  if (!targetResource) return false;
  const canonicalTarget = canonicalResource(targetResource);
  for (const perm of (grantedPermissions || [])) {
    if (!perm) continue;
    const normalized = normalizePermissionKey(perm.trim());
    if (!normalized) continue;
    const pRes = normalized.split(':', 1)[0];
    if (pRes === targetResource || canonicalResource(pRes) === canonicalTarget) {
      return true;
    }
  }
  return false;
}

export function hasAnyDescendantPermission(
  grantedPermissions: string[] | undefined,
  targetResource: string,
): boolean {
  if (!targetResource) return false;
  const canonicalTarget = canonicalResource(targetResource);
  const descendants = RESOURCE_DESCENDANTS_MAP[canonicalTarget] || RESOURCE_DESCENDANTS_MAP[targetResource.toLowerCase()];
  if (!descendants || descendants.length === 0) return false;

  for (const perm of (grantedPermissions || [])) {
    if (!perm) continue;
    const normalized = normalizePermissionKey(perm.trim());
    if (!normalized) continue;
    const pRes = normalized.split(':', 1)[0];
    const canonicalPRes = canonicalResource(pRes);
    if (descendants.some((d) => d === pRes || canonicalResource(d) === canonicalPRes)) {
      return true;
    }
  }
  return false;
}

export function canonicalResource(resource: string): string {
  if (!resource) return '';
  const lower = resource.toLowerCase();
  return RESOURCE_CANONICAL_MAP[lower] || lower;
}

export function isResourceCoveredBy(candidateResource: string, targetResource: string): boolean {
  const canonicalCandidate = canonicalResource(candidateResource);
  const canonicalTarget = canonicalResource(targetResource);
  if (canonicalCandidate === canonicalTarget) return true;
  const parents = RESOURCE_PARENT_DOMAINS[canonicalTarget] || RESOURCE_PARENT_DOMAINS[targetResource];
  return parents ? (parents.includes(canonicalCandidate) || parents.includes(candidateResource)) : false;
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
export function hasPermissionFromList(
  grantedPermissions: string[] | undefined,
  key: string,
  options?: { explicitOnly?: boolean },
): boolean {
  const normalizedKey = normalizePermissionKey(key);
  if (!normalizedKey) return false;

  const source: object = grantedPermissions ?? EMPTY_PERMISSIONS;
  let permissions = permissionSetCache.get(source);
  if (!permissions) {
    permissions = new Set<string>();
    for (const rawPermission of (grantedPermissions || [])) {
      const trimmed = rawPermission?.trim();
      if (!trimmed) continue;
      const normalized = normalizePermissionKey(trimmed);
      if (!normalized) continue;
      permissions.add(normalized);
      for (const eqKey of getEquivalentPermissionKeys(normalized)) {
        permissions.add(eqKey);
      }
    }
    permissionSetCache.set(source, permissions);
  }

  const separatorIndex = normalizedKey.indexOf(':');
  const requestedResource = separatorIndex >= 0 ? normalizedKey.slice(0, separatorIndex) : normalizedKey;
  const requestedAction = separatorIndex >= 0 ? normalizedKey.slice(separatorIndex + 1) : '';
  const isApprovalLevelAction = [
    'approvec1', 'approvec2',
    'approvel1', 'approvel2',
    'approve_level1', 'approve_level2',
    'approve:c1', 'approve:c2',
    'approve:l1', 'approve:l2',
    'approve-c1', 'approve-c2',
    'approve-l1', 'approve-l2',
    'rejectc1', 'rejectc2',
    'rejectl1', 'rejectl2',
    'reject_level1', 'reject_level2',
    'reject:c1', 'reject:c2',
    'reject:l1', 'reject:l2',
    'reject-c1', 'reject-c2',
    'reject-l1', 'reject-l2',
  ].includes(requestedAction);
  if (isApprovalLevelAction) {
    // Chữ ký C1/C2 phải khớp một quyền duyệt cụ thể. Không suy diễn từ
    // wildcard, admin:all, :manage hay quyền bao trùm của tài nguyên.
    // `data`/`kcht` là khóa legacy dùng chung, không còn được phép cấp
    // thẩm quyền duyệt cho bất kỳ resource nào.
    if (requestedResource === 'data' || requestedResource === 'kcht') {
      return false;
    }
    if (permissions.has(normalizedKey)) {
      return true;
    }
    const canonRes = canonicalResource(requestedResource);
    return Boolean(canonRes && canonRes !== requestedResource && permissions.has(`${canonRes}:${requestedAction}`));
  }

  // History is an independently assigned business permission.  It must not
  // be inherited from :read, :manage, parent resources, or legacy aliases.
  if (requestedAction === 'history') {
    return (grantedPermissions || []).some(
      (permission) => normalizePermissionKey(permission?.trim() || '') === normalizedKey,
    );
  }

  // A system-administrator role is not an implicit business permission.  In
  // particular, do not turn a stale/generated "*" claim into access to every
  // KCHT screen; each resource must be assigned explicitly.
  if (permissions.has(normalizedKey)) {
    return true;
  }

  const [rawResource, action] = normalizedKey.split(':', 2);
  if (!rawResource) return false;

  const resource = canonicalResource(rawResource);
  if (resource && resource !== rawResource && action && permissions.has(`${resource}:${action}`)) {
    return true;
  }
  const isKchtResource = KCHT_RESOURCE_CANONICALS.has(rawResource) || KCHT_RESOURCE_CANONICALS.has(resource);
  if (isKchtResource && action === 'manage') {
    return false;
  }

  if ((!isKchtResource && (permissions.has(`${rawResource}:manage`) || permissions.has(`${resource}:manage`))) ||
      permissions.has(`${rawResource}:*`) || permissions.has(`${resource}:*`)) {
    return true;
  }

  // Parent domain match
  const parents = RESOURCE_PARENT_DOMAINS[resource] || RESOURCE_PARENT_DOMAINS[rawResource];
  if (!isKchtResource && !options?.explicitOnly && parents) {
    for (const parent of parents) {
      if (permissions.has(`${parent}:${action}`) || permissions.has(`${parent}:manage`) || permissions.has(`${parent}:*`)) {
        return true;
      }
    }
  }

  // Alias match for read / view / search when explicit read/view is granted
  if (action === 'view' || action === 'search') {
    if (permissions.has(`${rawResource}:read`) || permissions.has(`${resource}:read`)) {
      return true;
    }
  }
  if (action === 'read') {
    if (permissions.has(`${rawResource}:view`) || permissions.has(`${resource}:view`)) {
      return true;
    }
  }

  // Implicit Read: Nếu user có bất kỳ quyền nào thuộc chính tài nguyên đó (create, update, delete, approvec1, history...)
  // hoặc có bất kỳ quyền nào thuộc con/cháu (descendants) của tài nguyên đó -> cho phép xem danh sách (read/view/search).
  // Chỉ áp dụng khi kiểm tra truy cập danh sách / routing / menu (explicitOnly: false). Tuyệt đối không áp dụng khi explicitOnly: true.
  if (!options?.explicitOnly && (action === 'read' || action === 'view' || action === 'search')) {
    if (
      hasAnyPermissionForResource(grantedPermissions, rawResource) ||
      hasAnyPermissionForResource(grantedPermissions, resource)
    ) {
      return true;
    }
    if (
      hasAnyDescendantPermission(grantedPermissions, rawResource) ||
      hasAnyDescendantPermission(grantedPermissions, resource)
    ) {
      return true;
    }
  }

  // Implicit Read cho non-KCHT legacy domains
  if (!isKchtResource && !options?.explicitOnly && (action === 'read' || action === 'view' || action === 'search')) {
    for (const p of permissions) {
      const pRes = p.split(':', 2)[0];
      if (isResourceCoveredBy(pRes, resource)) {
        return true;
      }
    }
  }

  if (!isKchtResource && ['create', 'update', 'delete'].includes(action || '') &&
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

/**
 * Chỉ kiểm tra mã quyền được gán trực tiếp. Không cho `*`, `admin:all`,
 * `:manage`, quyền cha hay alias tài nguyên trở thành quyền duyệt ngầm.
 * Dùng cho C1/C2 vì hai thao tác này phải hiện đúng theo checkbox phân quyền.
 */
export function hasExplicitPermissionFromList(
  grantedPermissions: string[] | undefined,
  key: string,
): boolean {
  const normalizedKey = normalizePermissionKey(key);
  if (!normalizedKey) return false;

  return (grantedPermissions || []).some(
    (permission) => normalizePermissionKey(permission?.trim() || '') === normalizedKey,
  );
}

const initialPermissions = useAuthStore.getState().user?.permissions || [];

export const usePermissionStore = create<PermissionState>((set, get) => ({
  permissions: initialPermissions,

  hasPermission: (key: string, options?: { explicitOnly?: boolean }) => {
    const storePerms = get().permissions;
    const authPerms = useAuthStore.getState().user?.permissions;
    return hasPermissionFromList(storePerms.length > 0 ? storePerms : authPerms, key, options);
  },

  hasExplicitPermission: (key: string) => {
    const storePerms = get().permissions;
    const authPerms = useAuthStore.getState().user?.permissions;
    return hasPermissionFromList(storePerms.length > 0 ? storePerms : authPerms, key, { explicitOnly: true });
  },

  hasAnyPermission: (keys: string[]) => {
    const normalizedKeys = keys
      .map(normalizePermissionKey)
      .filter(Boolean);
    const primaryKey = normalizedKeys.find((permission) => {
      const resource = permission.split(':', 1)[0];
      return resource && !LEGACY_ROUTE_FALLBACK_RESOURCES.has(resource);
    });

    if (!primaryKey) {
      return normalizedKeys.some((permission) => get().hasPermission(permission));
    }

    const primaryResource = primaryKey.split(':', 1)[0];
    const canonicalPrimary = canonicalResource(primaryResource);
    return normalizedKeys
      .filter((permission) => {
        const res = permission.split(':', 1)[0];
        return res === primaryResource || canonicalResource(res) === canonicalPrimary;
      })
      .some((permission) => get().hasPermission(permission));
  },

  hasAllPermissions: (keys: string[]) => {
    return keys.every((k) => get().hasPermission(k));
  },

  hasAnyResourcePermission: (resource: string) => {
    const storePerms = get().permissions;
    const authPerms = useAuthStore.getState().user?.permissions;
    const perms = storePerms.length > 0 ? storePerms : authPerms;
    return (
      hasAnyPermissionForResource(perms, resource) ||
      hasAnyDescendantPermission(perms, resource)
    );
  },

  setPermissions: (permissions: string[]) => set({ permissions }),
}));

// Automatically sync permissionStore whenever authStore user/permissions change (login, logout, token renewal)
if (typeof useAuthStore?.subscribe === 'function') {
  useAuthStore.subscribe((state) => {
    const currentPerms = state?.user?.permissions || [];
    const existingPerms = usePermissionStore.getState().permissions;
    if (currentPerms !== existingPerms) {
      usePermissionStore.setState({ permissions: currentPerms });
    }
  });
}

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
  'port', 'berth', 'pier', 'buoyberth', 'anchorage', 'transferarea', 'stormshelter', 'dryport',
  'waterzone', 'waterarea', 'navigationchannel', 'dikerevetment', 'shiprepairfacility', 'radarstation',
  'beaconstation', 'lighthouse', 'buoy', 'vts', 'vtsoperationcenter', 'vtsassist', 'aissystem', 'cctv', 'scada',
  'transmission', 'vhf', 'daittdh', 'ttxltt', 'coastalstation', 'specialstation', 'station',
  'coastalstationinmarsat', 'coastalstationcospassarsat', 'coastalstationhaiphong', 'coastalstationlrit',
  'lrit', 'cospassarsat', 'inmarsat',
  'berthasset', 'pierasset', 'buoyberthasset', 'anchorageasset', 'transferareaasset', 'stormshelterasset',
  'dryportasset', 'channelasset', 'dikerevetmentasset', 'buoyasset', 'lighthouseasset', 'radarasset',
  'vtsasset', 'vtsassistasset', 'aisasset', 'cctvasset', 'scadaasset', 'transmissionasset', 'vhfasset',
  'daittdhasset', 'inmarsatasset', 'cospassarsatasset', 'lritasset', 'ttxlttasset',
  'asset', 'infraasset', 'assetincrease', 'assetdecrease', 'assetexploitation', 'movementrequest',
  'inventoryasset', 'inventoryplan', 'inventoryreport', 'approvalrecord', 'processingrecord',
  'maintenanceplan', 'operationplan', 'incident', 'gispoint', 'pointobject', 'gisline', 'lineobject',
  'gispolygon', 'polygonobject',
]);

export interface PermissionState {
  permissions: string[];
  hasPermission: (key: string, options?: { explicitOnly?: boolean }) => boolean;
  hasExplicitPermission: (key: string) => boolean;
  hasAnyPermission: (keys: string[]) => boolean;
  hasAllPermissions: (keys: string[]) => boolean;
  setPermissions: (permissions: string[]) => void;
}

export const RESOURCE_CANONICAL_MAP: Record<string, string> = {
  // Aliases for coastal stations & maritime infrastructure (true synonyms only)
  vtssystem: 'vts',
  vtsasset: 'vts',
  tramradar: 'radarstation',
  radarasset: 'radarstation',
  anchoragearea: 'anchorage',
  anchorageasset: 'anchorage',
  channel: 'navigationchannel',
  channelasset: 'navigationchannel',
  beaconlight: 'beaconstation',
  lighthousestation: 'beaconstation',
  lighthouse: 'beaconstation',
  lighthouseasset: 'beaconstation',
  buoystation: 'buoy',
  buoyasset: 'buoy',
  ttxltt: 'coastalstationhaiphong',
  ttxlttasset: 'coastalstationhaiphong',
  cctvasset: 'cctv',
  scadaasset: 'scada',
  transmissionasset: 'transmission',
  vhfasset: 'vhf',
  daittdhasset: 'daittdh',
  vtsassistasset: 'vtsassist',
  aisasset: 'aissystem',
  dryportasset: 'dryport',
  berthasset: 'berth',
  pierasset: 'pier',
  buoyberthasset: 'buoyberth',
  transferareaasset: 'transferarea',
  stormshelterasset: 'stormshelter',
  dikerevetmentasset: 'dikerevetment',

  // System & shared resources
  interconnect: 'connection',
  groupmember: 'group',
  shiprepair: 'shiprepairfacility',
  shiprepairyard: 'shiprepairfacility',
};

export const EQUIVALENT_RESOURCES_MAP: Record<string, string[]> = {
  vts: ['vts', 'vtssystem', 'vtsasset'],
  vtssystem: ['vts', 'vtssystem', 'vtsasset'],
  vtsasset: ['vts', 'vtssystem', 'vtsasset'],
  vtsassist: ['vtsassist', 'vtsassistasset'],
  vtsassistasset: ['vtsassist', 'vtsassistasset'],
  cctv: ['cctv', 'cctvasset'],
  cctvasset: ['cctv', 'cctvasset'],
  scada: ['scada', 'scadaasset'],
  scadaasset: ['scada', 'scadaasset'],
  transmission: ['transmission', 'transmissionasset'],
  transmissionasset: ['transmission', 'transmissionasset'],
  vhf: ['vhf', 'vhfasset'],
  vhfasset: ['vhf', 'vhfasset'],
  daittdh: ['daittdh', 'daittdhasset'],
  daittdhasset: ['daittdh', 'daittdhasset'],
  aissystem: ['aissystem', 'aisasset'],
  aisasset: ['aissystem', 'aisasset'],
  coastalstationhaiphong: ['coastalstationhaiphong', 'ttxltt', 'ttxlttasset'],
  ttxltt: ['coastalstationhaiphong', 'ttxltt', 'ttxlttasset'],
  ttxlttasset: ['coastalstationhaiphong', 'ttxltt', 'ttxlttasset'],
  dryport: ['dryport', 'dryportasset'],
  dryportasset: ['dryport', 'dryportasset'],
  berth: ['berth', 'berthasset'],
  berthasset: ['berth', 'berthasset'],
  pier: ['pier', 'pierasset'],
  pierasset: ['pier', 'pierasset'],
  buoyberth: ['buoyberth', 'buoyberthasset'],
  buoyberthasset: ['buoyberth', 'buoyberthasset'],
  transferarea: ['transferarea', 'transferareaasset'],
  transferareaasset: ['transferarea', 'transferareaasset'],
  stormshelter: ['stormshelter', 'stormshelterasset'],
  stormshelterasset: ['stormshelter', 'stormshelterasset'],
  anchorage: ['anchorage', 'anchoragearea', 'anchorageasset'],
  anchorageasset: ['anchorage', 'anchoragearea', 'anchorageasset'],
  radarstation: ['radarstation', 'tramradar', 'radarasset'],
  tramradar: ['radarstation', 'tramradar', 'radarasset'],
  radarasset: ['radarstation', 'tramradar', 'radarasset'],
  beaconstation: ['beaconstation', 'beaconlight', 'lighthousestation', 'lighthouse', 'lighthouseasset'],
  beaconlight: ['beaconstation', 'beaconlight', 'lighthousestation', 'lighthouse', 'lighthouseasset'],
  lighthousestation: ['beaconstation', 'beaconlight', 'lighthousestation', 'lighthouse', 'lighthouseasset'],
  lighthouse: ['beaconstation', 'beaconlight', 'lighthousestation', 'lighthouse', 'lighthouseasset'],
  lighthouseasset: ['beaconstation', 'beaconlight', 'lighthousestation', 'lighthouse', 'lighthouseasset'],
  buoy: ['buoy', 'buoystation', 'buoyasset'],
  buoystation: ['buoy', 'buoystation', 'buoyasset'],
  buoyasset: ['buoy', 'buoystation', 'buoyasset'],
  navigationchannel: ['navigationchannel', 'channel', 'channelasset'],
  channel: ['navigationchannel', 'channel', 'channelasset'],
  channelasset: ['navigationchannel', 'channel', 'channelasset'],
  dikerevetment: ['dikerevetment', 'dikerevetmentasset'],
  dikerevetmentasset: ['dikerevetment', 'dikerevetmentasset'],
  shiprepairfacility: ['shiprepairfacility', 'shiprepair', 'shiprepairyard'],
  shiprepair: ['shiprepairfacility', 'shiprepair', 'shiprepairyard'],
  shiprepairyard: ['shiprepairfacility', 'shiprepair', 'shiprepairyard'],
  port: ['port', 'seaport'],
  seaport: ['port', 'seaport'],
  connection: ['connection', 'interconnect'],
  interconnect: ['connection', 'interconnect'],
  group: ['group', 'groupmember'],
  groupmember: ['group', 'groupmember'],
};

export function getEquivalentPermissionKeys(key: string): string[] {
  const normalized = normalizePermissionKey(key);
  if (!normalized) return [];
  const [res, ...rest] = normalized.split(':');
  const action = rest.join(':');
  if (!res) return [normalized];

  const canonical = canonicalResource(res);
  const eqResources = EQUIVALENT_RESOURCES_MAP[res] || EQUIVALENT_RESOURCES_MAP[canonical] || [res];

  const keys = new Set<string>();
  keys.add(normalized);
  if (canonical && action) {
    keys.add(`${canonical}:${action}`);
  }
  for (const eqRes of eqResources) {
    if (action) {
      keys.add(`${eqRes}:${action}`);
    } else {
      keys.add(eqRes);
    }
  }
  return [...keys];
}

const RESOURCE_PARENT_DOMAINS: Record<string, string[]> = {
  vtsasset: ['infraasset'],
  radarasset: ['infraasset'],
  aisasset: ['infraasset'],
  cctv: ['infraasset', 'data'],
  cctvasset: ['infraasset'],
  scada: ['infraasset', 'data'],
  scadaasset: ['infraasset'],
  transmission: ['infraasset', 'data'],
  transmissionasset: ['infraasset'],
  vtsassist: ['infraasset', 'data'],
  vtsassistasset: ['infraasset'],
  shiprepairyard: ['shiprepairfacility', 'infraasset', 'data'],
  shiprepairfacility: ['infraasset', 'data'],
  shiprepair: ['shiprepairfacility', 'infraasset', 'data'],
  vhfasset: ['infraasset'],
  daittdhasset: ['coastalstationasset', 'stationasset'],
  coastalstationasset: ['stationasset'],
  berthasset: ['infraasset'],
  transferareaasset: ['infraasset'],
  transferarea: ['infraasset', 'data'],

  stormshelterasset: ['infraasset'],
  buoyberthasset: ['infraasset'],
  pierasset: ['infraasset'],
  anchorage: ['infraasset', 'data'],
  anchorageasset: ['infraasset'],
  lighthouseasset: ['infraasset'],
  dikerevetmentasset: ['infraasset'],
  buoyasset: ['infraasset'],
  channelasset: ['infraasset'],
  dryportasset: ['infraasset'],
  dryport: ['infraasset', 'data'],

  lritasset: ['stationasset'],
  lrit: ['specialstation', 'coastalstation', 'station'],
  cospassarsatasset: ['stationasset'],
  cospassarsat: ['specialstation', 'coastalstation', 'station'],
  ttxlttasset: ['stationasset'],
  coastalstationinmarsat: [],
  inmarsatasset: ['stationasset'],
  inmarsat: ['specialstation', 'coastalstation', 'station'],
  daittdh: ['coastalstation'],
  coastalstationlrit: [],
  coastalstationhaiphong: [],
  coastalstationcospassarsat: [],
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
  ].includes(requestedAction);
  if (isApprovalLevelAction) {
    // Chữ ký C1/C2 phải khớp một quyền duyệt cụ thể. Không suy diễn từ
    // wildcard, admin:all, :manage hay quyền bao trùm của tài nguyên.
    // `data`/`kcht` là khóa legacy dùng chung, không còn được phép cấp
    // thẩm quyền duyệt cho bất kỳ resource nào.
    if (requestedResource === 'data' || requestedResource === 'kcht') {
      return false;
    }
    const eqKeys = getEquivalentPermissionKeys(normalizedKey);
    return eqKeys.some((k) => permissions.has(k));
  }

  // History is an independently assigned business permission.  It must not
  // be inherited from :read, :manage, parent resources, or legacy aliases.
  if (requestedAction === 'history') {
    const candidateKeys = new Set(getEquivalentPermissionKeys(normalizedKey));
    return (grantedPermissions || []).some(
      (permission) => candidateKeys.has(normalizePermissionKey(permission?.trim() || '')),
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

  // Implicit Read: Cho phép xem menu/trang/danh sách khi người dùng có bất kỳ quyền thao tác nào trên tài nguyên
  if (!options?.explicitOnly && (action === 'read' || action === 'view' || action === 'search')) {
    const candidateKeys = getEquivalentPermissionKeys(normalizedKey);
    const candidateResources = new Set(candidateKeys.map((k) => k.split(':', 2)[0]));
    for (const p of permissions) {
      const [pRes, pAct] = p.split(':', 2);
      if (candidateResources.has(pRes)) {
        if (['create', 'update', 'delete', 'approvec1', 'approvec2', 'history', 'write', 'read', 'view', 'search', 'manage', '*'].includes(pAct)) {
          return true;
        }
      } else if (isResourceCoveredBy(pRes, resource)) {
        if (['read', 'view', 'search', 'manage', '*'].includes(pAct)) {
          return true;
        }
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
 * Chỉ kiểm tra mã quyền được gán trực tiếp (hỗ trợ alias tài nguyên tương đương).
 * Không cho `*`, `admin:all`, `:manage`, quyền cha hay domain cha trở thành quyền duyệt ngầm.
 * Dùng cho C1/C2 vì hai thao tác này phải hiện đúng theo checkbox phân quyền.
 */
export function hasExplicitPermissionFromList(
  grantedPermissions: string[] | undefined,
  key: string,
): boolean {
  const normalizedKey = normalizePermissionKey(key);
  if (!normalizedKey) return false;

  const candidateKeys = new Set(getEquivalentPermissionKeys(normalizedKey));
  return (grantedPermissions || []).some(
    (permission) => candidateKeys.has(normalizePermissionKey(permission?.trim() || '')),
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
      return normalizedKeys.some((permission) => get().hasPermission(permission, { explicitOnly: true }));
    }

    const primaryResource = primaryKey.split(':', 1)[0];
    const equivalentResources = new Set(
      EQUIVALENT_RESOURCES_MAP[primaryResource]
      || EQUIVALENT_RESOURCES_MAP[canonicalResource(primaryResource)]
      || [primaryResource],
    );
    return normalizedKeys
      .filter((permission) => equivalentResources.has(permission.split(':', 1)[0]))
      .some((permission) => get().hasPermission(permission));
  },

  hasAllPermissions: (keys: string[]) => {
    return keys.every((k) => get().hasPermission(k));
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

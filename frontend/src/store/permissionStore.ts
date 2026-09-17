import { create } from 'zustand';
import { useAuthStore } from './authStore';

/** WeakMap memoize: tái sử dụng Set quyền theo reference mảng gốc, tránh tạo lại mỗi lần gọi. */
const permissionSetCache = new WeakMap<object, Set<string>>();
const EMPTY_PERMISSIONS: string[] = [];

export interface PermissionState {
  permissions: string[];
  hasPermission: (key: string, options?: { explicitOnly?: boolean }) => boolean;
  hasExplicitPermission: (key: string) => boolean;
  hasAnyPermission: (keys: string[]) => boolean;
  hasAllPermissions: (keys: string[]) => boolean;
  setPermissions: (permissions: string[]) => void;
}

export const RESOURCE_CANONICAL_MAP: Record<string, string> = {
  // Maritime infrastructure assets
  berthasset: 'berth',
  transferareaasset: 'transferarea',
  stormshelterasset: 'stormshelter',
  buoyberthasset: 'buoyberth',
  pierasset: 'pier',
  anchorageasset: 'anchorage',
  anchoragearea: 'anchorage',
  lighthouseasset: 'lighthouse',
  beaconstation: 'lighthouse',
  beaconlight: 'lighthouse',
  lighthousestation: 'lighthouse',
  dikerevetmentasset: 'dikerevetment',
  buoyasset: 'buoy',
  buoystation: 'buoy',
  channelasset: 'navigationchannel',
  channel: 'navigationchannel',
  dryportasset: 'dryport',
  lritasset: 'lrit',
  coastalstationlrit: 'lrit',
  cospassarsatasset: 'cospassarsat',
  coastalstationcospassarsat: 'cospassarsat',
  ttxlttasset: 'ttxltt',
  coastalstationhaiphong: 'ttxltt',
  vtsasset: 'vts',
  vtssystem: 'vts',
  radarasset: 'radarstation',
  tramradar: 'radarstation',
  aisasset: 'aissystem',
  cctvasset: 'cctv',
  scadaasset: 'scada',
  transmissionasset: 'transmission',
  vtsassistasset: 'vtsassist',
  vhfasset: 'vhf',
  daittdhasset: 'daittdh',
  inmarsatasset: 'inmarsat',

  // System & shared resources
  interconnect: 'connection',
  groupmember: 'group',
  shiprepair: 'shiprepairfacility',
  shiprepairyard: 'shiprepairfacility',
};

export const EQUIVALENT_RESOURCES_MAP: Record<string, string[]> = {
  berth: ['berth', 'berthasset'],
  berthasset: ['berth', 'berthasset'],
  transferarea: ['transferarea', 'transferareaasset'],
  transferareaasset: ['transferarea', 'transferareaasset'],
  stormshelter: ['stormshelter', 'stormshelterasset'],
  stormshelterasset: ['stormshelter', 'stormshelterasset'],
  buoyberth: ['buoyberth', 'buoyberthasset'],
  buoyberthasset: ['buoyberth', 'buoyberthasset'],
  pier: ['pier', 'pierasset'],
  pierasset: ['pier', 'pierasset'],
  anchorage: ['anchorage', 'anchorageasset', 'anchoragearea'],
  anchorageasset: ['anchorage', 'anchorageasset', 'anchoragearea'],
  anchoragearea: ['anchorage', 'anchorageasset', 'anchoragearea'],
  lighthouse: ['lighthouse', 'lighthouseasset', 'beaconstation', 'beaconlight', 'lighthousestation'],
  lighthouseasset: ['lighthouse', 'lighthouseasset', 'beaconstation', 'beaconlight', 'lighthousestation'],
  beaconstation: ['lighthouse', 'lighthouseasset', 'beaconstation', 'beaconlight', 'lighthousestation'],
  beaconlight: ['lighthouse', 'lighthouseasset', 'beaconstation', 'beaconlight', 'lighthousestation'],
  lighthousestation: ['lighthouse', 'lighthouseasset', 'beaconstation', 'beaconlight', 'lighthousestation'],
  dikerevetment: ['dikerevetment', 'dikerevetmentasset'],
  dikerevetmentasset: ['dikerevetment', 'dikerevetmentasset'],
  buoy: ['buoy', 'buoyasset', 'buoystation'],
  buoyasset: ['buoy', 'buoyasset', 'buoystation'],
  buoystation: ['buoy', 'buoyasset', 'buoystation'],
  navigationchannel: ['navigationchannel', 'channel', 'channelasset'],
  channel: ['navigationchannel', 'channel', 'channelasset'],
  channelasset: ['navigationchannel', 'channel', 'channelasset'],
  dryport: ['dryport', 'dryportasset'],
  dryportasset: ['dryport', 'dryportasset'],
  lrit: ['lrit', 'lritasset', 'coastalstationlrit'],
  lritasset: ['lrit', 'lritasset', 'coastalstationlrit'],
  coastalstationlrit: ['lrit', 'lritasset', 'coastalstationlrit'],
  cospassarsat: ['cospassarsat', 'cospassarsatasset', 'coastalstationcospassarsat'],
  cospassarsatasset: ['cospassarsat', 'cospassarsatasset', 'coastalstationcospassarsat'],
  coastalstationcospassarsat: ['cospassarsat', 'cospassarsatasset', 'coastalstationcospassarsat'],
  ttxltt: ['ttxltt', 'ttxlttasset', 'coastalstationhaiphong'],
  ttxlttasset: ['ttxltt', 'ttxlttasset', 'coastalstationhaiphong'],
  coastalstationhaiphong: ['ttxltt', 'ttxlttasset', 'coastalstationhaiphong'],
  vts: ['vts', 'vtsasset', 'vtssystem'],
  vtsasset: ['vts', 'vtsasset', 'vtssystem'],
  vtssystem: ['vts', 'vtsasset', 'vtssystem'],
  radarstation: ['radarstation', 'radarasset', 'tramradar'],
  radarasset: ['radarstation', 'radarasset', 'tramradar'],
  tramradar: ['radarstation', 'radarasset', 'tramradar'],
  aissystem: ['aissystem', 'aisasset'],
  aisasset: ['aissystem', 'aisasset'],
  cctv: ['cctv', 'cctvasset'],
  cctvasset: ['cctv', 'cctvasset'],
  scada: ['scada', 'scadaasset'],
  scadaasset: ['scada', 'scadaasset'],
  transmission: ['transmission', 'transmissionasset'],
  transmissionasset: ['transmission', 'transmissionasset'],
  vtsassist: ['vtsassist', 'vtsassistasset'],
  vtsassistasset: ['vtsassist', 'vtsassistasset'],
  vhf: ['vhf', 'vhfasset'],
  vhfasset: ['vhf', 'vhfasset'],
  daittdh: ['daittdh', 'daittdhasset'],
  daittdhasset: ['daittdh', 'daittdhasset'],
  inmarsat: ['inmarsat', 'inmarsatasset'],
  inmarsatasset: ['inmarsat', 'inmarsatasset'],
  group: ['group', 'groupmember'],
  groupmember: ['group', 'groupmember'],
  connection: ['connection', 'interconnect'],
  interconnect: ['connection', 'interconnect'],
  shiprepairfacility: ['shiprepairfacility', 'shiprepair', 'shiprepairyard'],
  shiprepair: ['shiprepairfacility', 'shiprepair', 'shiprepairyard'],
  shiprepairyard: ['shiprepairfacility', 'shiprepair', 'shiprepairyard'],
  port: ['port', 'seaport'],
  seaport: ['port', 'seaport'],
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
  vtsasset: ['vts', 'vtssystem'],
  radarasset: ['radarstation', 'tramradar'],
  aisasset: ['aissystem'],
  cctvasset: ['cctv'],
  scadaasset: ['scada'],
  transmissionasset: ['transmission'],
  vtsassistasset: ['vtsassist'],
  vhfasset: ['vhf'],
  daittdhasset: ['daittdh', 'coastalstation'],
  coastalstationasset: ['coastalstation', 'specialstation', 'station'],
  berthasset: ['berth'],
  transferareaasset: ['transferarea'],
  stormshelterasset: ['stormshelter'],
  buoyberthasset: ['buoyberth'],
  pierasset: ['pier'],
  anchorageasset: ['anchorage'],
  lighthouseasset: ['lighthouse', 'beaconstation'],
  dikerevetmentasset: ['dikerevetment'],
  buoyasset: ['buoy'],
  channelasset: ['navigationchannel', 'channel'],
  dryportasset: ['dryport'],
  lritasset: ['lrit', 'coastalstationlrit', 'specialstation', 'coastalstation', 'station'],
  lrit: ['specialstation', 'coastalstation', 'station'],
  cospassarsatasset: ['cospassarsat', 'coastalstationcospassarsat', 'specialstation', 'coastalstation', 'station'],
  cospassarsat: ['specialstation', 'coastalstation', 'station'],
  ttxlttasset: ['ttxltt', 'coastalstationhaiphong', 'specialstation', 'coastalstation', 'station'],
  ttxltt: ['specialstation', 'coastalstation', 'station'],
  inmarsatasset: ['inmarsat', 'specialstation', 'coastalstation', 'station'],
  inmarsat: ['specialstation', 'coastalstation', 'station'],
  daittdh: ['coastalstation'],
  coastalstationlrit: ['specialstation', 'coastalstation', 'station'],
  coastalstationhaiphong: ['specialstation', 'coastalstation', 'station'],
  coastalstationcospassarsat: ['specialstation', 'coastalstation', 'station'],
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
  const parents = RESOURCE_PARENT_DOMAINS[resource] || RESOURCE_PARENT_DOMAINS[rawResource];
  if (parents) {
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

  // Implicit Read: Chỉ áp dụng cho xem menu/trang/tuyến đường khi không yêu cầu explicitOnly
  if (!options?.explicitOnly && (action === 'read' || action === 'view' || action === 'search')) {
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
    return keys.some((k) => get().hasPermission(k));
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

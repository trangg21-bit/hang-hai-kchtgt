import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { permissionService } from '../services/permissionService';
import type { MenuTreeNode } from '../types/permission';
import {
  canonicalResource,
  getEquivalentPermissionKeys,
  normalizePermissionKey,
} from '../store/permissionStore';

/**
 * Ant Design Tree warns when checkedKeys contains nodes that are not present
 * in the current treeData (for example after filtering by permission name).
 * Keep this logic shared by user, group and role permission screens.
 */
export function getPermissionTreeKeys(nodes: readonly MenuTreeNode[]): Set<string> {
  const keys = new Set<string>();
  const visit = (items: readonly MenuTreeNode[]) => {
    items.forEach((node) => {
      keys.add(String(node.key));
      if (node.children?.length) visit(node.children);
    });
  };
  visit(nodes);
  return keys;
}

export function getVisiblePermissionKeys(
  checkedKeys: readonly string[],
  nodes: readonly MenuTreeNode[],
): string[] {
  const visibleKeys = getPermissionTreeKeys(nodes);
  const checkedSet = new Set(checkedKeys.map((k) => normalizePermissionKey(String(k))));
  const result: string[] = [];

  for (const vKey of visibleKeys) {
    if (vKey.startsWith('group_')) continue;
    const eqKeys = getEquivalentPermissionKeys(vKey);
    if (eqKeys.some((k) => checkedSet.has(k))) {
      result.push(vKey);
    }
  }
  return result;
}

let activeCatalogKeys: Set<string> | null = null;

export function setActiveCatalogKeys(keys: Iterable<string> | null): void {
  if (!keys) {
    activeCatalogKeys = null;
    return;
  }
  activeCatalogKeys = new Set(Array.from(keys).map((k) => normalizePermissionKey(String(k))));
}

export function getActiveCatalogKeys(): Set<string> | null {
  return activeCatalogKeys;
}

/**
 * Mở rộng tập mã quyền bao gồm cả mã gốc và các mã tương đương (canonical + alias).
 * Bỏ qua các nút nhóm cấp trên (bắt đầu bằng "group_").
 * Chỉ mở rộng sang các alias thực sự tồn tại trong catalog quyền của hệ thống.
 */
export function expandPermissionAliases(
  keys: Iterable<string>,
  allowedKeys?: Set<string> | Iterable<string> | null,
): Set<string> {
  const allowedSet = allowedKeys !== undefined
    ? (allowedKeys === null ? null : (allowedKeys instanceof Set ? allowedKeys : new Set(Array.from(allowedKeys).map((k) => normalizePermissionKey(String(k))))))
    : activeCatalogKeys;


  const expanded = new Set<string>();
  for (const key of keys) {
    const k = String(key);
    if (k.startsWith('group_')) continue;
    const normK = normalizePermissionKey(k);
    if (!allowedSet || allowedSet.has(normK)) {
      expanded.add(k);
    }
    getEquivalentPermissionKeys(k).forEach((eq) => {
      const normEq = normalizePermissionKey(eq);
      if (!allowedSet || allowedSet.has(normEq)) {
        expanded.add(eq);
      }
    });

  }
  return expanded;
}

/**
 * Merge a Tree change made on a filtered tree into the complete selection.
 * Permissions outside the filtered tree must not be lost when a user checks
 * or unchecks a visible permission.
 * Automatically synchronizes equivalent permission aliases (e.g. dryport:read <-> dryportasset:read).
 */
export function mergePermissionKeys(
  currentKeys: readonly string[],
  nextVisibleKeys: readonly string[],
  nodes: readonly MenuTreeNode[],
  allowedKeys?: Set<string> | Iterable<string> | null,
): string[] {
  // 1. Tập quyền (kèm alias) thuộc phạm vi cây hiển thị hiện tại
  const visibleEquivKeys = expandPermissionAliases(getPermissionTreeKeys(nodes), allowedKeys);

  // 2. Giữ lại các quyền nằm ngoài phạm vi cây lọc hiện tại
  const remainingKeys = currentKeys.filter(
    (key) => !visibleEquivKeys.has(normalizePermissionKey(String(key))),
  );

  // 3. Mở rộng các quyền được tích chọn (đồng bộ cả canonical lẫn alias tồn tại hợp lệ)
  const nextExpandedKeys = expandPermissionAliases(nextVisibleKeys, allowedKeys);


  return [...new Set([...remainingKeys, ...nextExpandedKeys])];
}


const RESOURCE_LABELS: Record<string, string> = {
  user: 'Quản lý tài khoản người dùng',
  role: 'Quản lý vai trò & Phân quyền',
  orgunit: 'Quản lý đơn vị tổ chức',
  group: 'Quản lý nhóm người dùng',
  groupmember: 'Quản lý thành viên nhóm',
  admin: 'Quản trị hệ thống',
  log: 'Quản lý Nhật ký kiểm toán (Log)',
  security: 'Quản lý An toàn thông tin & SIEM',
  map: 'Quản lý Bản đồ & GIS',
  connection: 'Quản lý Kết nối chia sẻ dữ liệu',
  interconnect: 'Quản lý Liên thông kết nối',
  api: 'Tích hợp & Chia sẻ API liên thông',
  data: 'Quản lý Dữ liệu dùng chung & Phê duyệt',
  report: 'Quản lý Báo cáo thống kê',
  check: 'Kiểm tra & Rà soát dữ liệu',
  approve: 'Phê duyệt quy trình chung',
  document: 'Quản lý Văn bản pháp lý',
  portplanning: 'Quản lý Quy hoạch bến cảng',
  planningadjustment: 'Quản lý Điều chỉnh quy hoạch',
  port: 'Quản lý Cảng biển',
  berth: 'Quản lý Bến cảng',
  pier: 'Quản lý Cầu cảng',
  buoyberth: 'Quản lý Bến phao',
  anchorage: 'Quản lý Khu neo đậu',
  transferarea: 'Quản lý Khu chuyển tải',
  stormshelter: 'Quản lý Khu tránh, trú bão',
  dryport: 'Quản lý Cảng cạn',
  waterzone: 'Quản lý Vùng nước hàng hải',
  waterarea: 'Quản lý Vùng nước cảng biển',
  cctv: 'Quản lý Hệ thống CCTV',
  scada: 'Quản lý Hệ thống SCADA',
  transmission: 'Quản lý Hệ thống truyền dẫn',
  navigationchannel: 'Quản lý Luồng hàng hải',
  dikerevetment: 'Quản lý Đê chắn sóng, đê chắn cát, kè hướng dòng, kè bảo vệ bờ',
  shiprepair: 'Quản lý Cơ sở sửa chữa & đóng tàu',
  shiprepairfacility: 'Quản lý Cơ sở sửa chữa & đóng tàu',
  shiprepairyard: 'Quản lý Cơ sở sửa chữa, đóng tàu',
  radarstation: 'Quản lý Trạm Radar',
  vts: 'Quản lý Hệ thống VTS',
  vtsoperationcenter: 'Quản lý Trung tâm điều hành VTS',
  vtsassist: 'Quản lý Hệ thống phụ trợ VTS',
  aissystem: 'Quản lý Hệ thống trạm bờ AIS',
  station: 'Quản lý Nhà trạm hàng hải',
  beaconstation: 'Quản lý Đèn biển và nhà trạm gắn liền đèn biển',
  buoystation: 'Quản lý Nhà trạm phao tiêu',
  buoy: 'Quản lý Phao tiêu và nhà trạm',
  lighthousestation: 'Quản lý Đèn biển',
  lighthouse: 'Quản lý Đèn biển và nhà trạm gắn liền đèn biển',
  daittdh: 'Quản lý Đài TTDH',
  vhf: 'Quản lý Hệ thống thông tin liên lạc VHF',
  coastalstation: 'Quản lý Đài duyên hải',
  specialstation: 'Quản lý Đài chuyên dùng / Vệ tinh',
  inmarsat: 'Quản lý Tài sản đài Inmarsat',
  coastalstationinmarsat: 'Quản lý Đài thông tin vệ tinh Inmarsat',
  coastalstationcospassarsat: 'Quản lý Đài Cospas-Sarsat',
  cospassarsat: 'Quản lý Đài Cospas-Sarsat',
  coastalstationhaiphong: 'Quản lý Đài TTXLTT Hà Nội / Hải Phòng',
  ttxltt: 'Quản lý Đài TTXLTT Hà Nội / Hải Phòng',
  coastalstationlrit: 'Quản lý Đài LRIT',
  lrit: 'Quản lý Đài LRIT',
  movementrequest: 'Quản lý Yêu cầu điều chuyển tài sản',
  inventoryplan: 'Quản lý Kế hoạch kiểm kê tài sản',
  inventoryreport: 'Quản lý Báo cáo kiểm kê tài sản',
  inventoryasset: 'Quản lý Kiểm kê tài sản',
  infraasset: 'Quản lý Tài sản KCHT',
  assetdecrease: 'Quản lý Biến động giảm tài sản',
  assetincrease: 'Quản lý Biến động tăng tài sản',
  assetexploitation: 'Quản lý Khai thác tài sản',
  asset: 'Quản lý Tài sản kết cấu hạ tầng',
  approvalrecord: 'Quản lý Hồ sơ phê duyệt',
  processingrecord: 'Quản lý Biên bản xử lý hiện trường',
  maintenanceplan: 'Quản lý Kế hoạch bảo trì',
  operationplan: 'Quản lý Kế hoạch vận hành khai thác',
  incident: 'Quản lý Sự cố kết cấu hạ tầng',
  gispoint: 'Quản lý Điểm tọa độ GIS',
  pointobject: 'Quản lý Đối tượng điểm GIS',
  gisline: 'Quản lý Đường tuyến GIS',
  lineobject: 'Quản lý Đối tượng đường GIS',
  gispolygon: 'Quản lý Vùng polygon GIS',
  polygonobject: 'Quản lý Đối tượng vùng GIS',
  history: 'Quản lý Lịch sử kiểm toán',
};

const HIDDEN_PERMISSIONS = new Set([
  'admin:all',
  'user:edit',
  'group:edit',
  'user:delete',
  'group:delete',
  'group:manage',
  'orgunit:approve',
  'orgunit:manage',
  'orgunit:scope_all',
  'vts:read:restricted',
  'vts:read:confidential',
  'cctv:approve',
  'cctvasset:approve',
  'vhf:approve',
  'scada:approve',
  'scadaasset:approve',
  'transmission:approve',
  'transmissionasset:approve',
  'vtsassist:approve',
  'vtsassistasset:approve',
  'beaconstation:approve',
  'lighthouse:approve',
  'beaconlight:approve',
  'lighthousestation:approve',
  'dikerevetment:approve',
  'radarstation:approve',
  'tramradar:approve',
  'port:approve',
  'berth:approve',
  'buoyberth:approve',
  'pier:approve',
  'dryport:approve',
  'anchorage:approve',
  'anchoragearea:approve',
  'anchorageasset:approve',
  'transferarea:approve',
  'stormshelter:approve',
  'shiprepairyard:approve',
  'shiprepair:approve',
  'shiprepairfacility:approve',
  'waterzone:approve',
  'data:approve',
  'approve:action',
]);

const KCHT_RESOURCES_WITHOUT_MANAGE = new Set([
  'port', 'berth', 'pier', 'buoyberth', 'anchorage', 'anchorageasset', 'transferarea', 'stormshelter',
  'dryport', 'waterzone', 'waterarea', 'navigationchannel', 'dikerevetment', 'shiprepair',
  'shiprepairfacility', 'shiprepairyard', 'radarstation', 'tramradar', 'beaconstation', 'beaconlight',
  'buoystation', 'buoy', 'lighthouse', 'lighthousestation', 'vts', 'vtsoperationcenter', 'vtsassist',
  'aissystem', 'cctv', 'cctvasset', 'scada', 'transmission', 'vhf', 'daittdh', 'ttxltt',
  'coastalstation', 'specialstation', 'coastalstationinmarsat', 'coastalstationcospassarsat',
  'coastalstationlrit', 'coastalstationhaiphong', 'inmarsat', 'cospassarsat', 'lrit', 'asset',
  'infraasset', 'assetincrease', 'assetdecrease', 'assetexploitation', 'movementrequest',
  'inventoryasset', 'inventoryplan', 'inventoryreport', 'approvalrecord', 'processingrecord',
  'maintenanceplan', 'operationplan', 'incident', 'gispoint', 'pointobject', 'gisline', 'lineobject',
  'gispolygon', 'polygonobject',
]);

function isHiddenPermission(key: string): boolean {
  if (HIDDEN_PERMISSIONS.has(key)) return true;
  const [resource, action] = normalizePermissionKey(key).split(':', 2);
  if (action === 'manage' && KCHT_RESOURCES_WITHOUT_MANAGE.has(canonicalResource(resource))) return true;
  if (key === 'anchoragearea' || key.startsWith('anchoragearea:')) return true;
  if (key.endsWith(':read:restricted') || key.endsWith(':read:confidential')) return true;
  if (key.endsWith(':restricted') || key.endsWith(':confidential')) return true;
  return false;
}

const ACTION_ORDER_MAP: Record<string, number> = {
  read: 10,
  view: 10,
  search: 12,
  create: 20,
  add: 20,
  write: 25,
  update: 30,
  edit: 30,
  delete: 40,
  remove: 40,
  lock: 50,
  unlock: 50,
  approve: 60,
  approvec1: 61,
  approvec2: 62,
  approvel1: 61,
  approvel2: 62,
  reject: 65,
  history: 70,
  permission: 80,
  manage: 90,
};

function getActionOrder(key: string): number {
  const parts = key.split(':');
  const action = parts[parts.length - 1]?.toLowerCase() || '';
  if (ACTION_ORDER_MAP[action] !== undefined) {
    return ACTION_ORDER_MAP[action];
  }
  for (const [act, order] of Object.entries(ACTION_ORDER_MAP)) {
    if (action.startsWith(act)) {
      return order;
    }
  }
  return 100;
}

const RESOURCE_ORDER: string[] = [
  'user',
  'group',
  'orgunit',
  'admin',
  'role',
  'log',
  'security',
  'portplanning',
  'planningadjustment',
  'document',
  'port',
  'berth',
  'pier',
  'buoyberth',
  'anchorage',
  'transferarea',
  'stormshelter',
  'dryport',
  'waterzone',
  'waterarea',
  'cctv',
  'scada',
  'transmission',
  'navigationchannel',
  'dikerevetment',
  'vts',
  'vtsoperationcenter',
  'vtsassist',
  'aissystem',
  'radarstation',
  'station',
  'lighthouse',
  'beaconstation',
  'beaconlight',
  'buoystation',
  'buoy',
  'lighthousestation',
  'daittdh',
  'vhf',
  'coastalstation',
  'specialstation',
  'inmarsat',
  'cospassarsat',
  'coastalstationcospassarsat',
  'ttxltt',
  'coastalstationhaiphong',
  'lrit',
  'coastalstationlrit',
  'shiprepair',
  'shiprepairfacility',
  'shiprepairyard',
  'asset',
  'infraasset',
  'assetincrease',
  'assetdecrease',
  'assetexploitation',
  'movementrequest',
  'inventoryasset',
  'inventoryplan',
  'inventoryreport',
  'maintenanceplan',
  'operationplan',
  'incident',
  'approvalrecord',
  'processingrecord',
  'history',
  'map',
  'gispoint',
  'pointobject',
  'gisline',
  'lineobject',
  'gispolygon',
  'polygonobject',
  'connection',
  'interconnect',
  'api',
  'data',
  'report',
  'check',
  'approve',
];

function getResourceOrder(res: string): number {
  const idx = RESOURCE_ORDER.indexOf(res);
  return idx >= 0 ? idx : 999;
}

/**
 * Hook usePermissions: Build dynamic permission tree directly from GET /api/permissions
 * Gộp chuẩn hóa hiển thị các nhóm tài nguyên và deduplicate các hành động tương đương.
 */
export function usePermissions(options?: { enabled?: boolean }) {
  const apiQuery = useQuery({
    queryKey: ['permission-catalog'],
    queryFn: () => permissionService.list(),
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  });

  const apiData = apiQuery.data;
  const perms = useMemo(
    () => (apiData || []).filter((p) => !isHiddenPermission(p.key)),
    [apiData],
  );

  // Group standard permissions by canonical resource with deduplication across equivalent action nodes
  const tree: MenuTreeNode[] = useMemo(() => {
    if (!perms.length) return [];
    const groups: Record<string, Map<string, MenuTreeNode>> = {};

    perms.forEach((p) => {
      const rawRes = (p.resource || p.key.split(':')[0] || 'other').toLowerCase();
      const canonicalRes = canonicalResource(rawRes);
      const action = (p.key.split(':').slice(1).join(':') || p.action || '').toLowerCase();
      const canonicalKey = action ? `${canonicalRes}:${action}` : canonicalRes;

      if (!groups[canonicalRes]) {
        groups[canonicalRes] = new Map<string, MenuTreeNode>();
      }
      const actionMap = groups[canonicalRes];

      const existingNode = actionMap.get(action);
      if (!existingNode) {
        let displayTitle = p.name ? `${p.name} (${canonicalKey})` : canonicalKey;
        const parenIdx = displayTitle.indexOf(' (');
        const baseName = parenIdx > 0 ? displayTitle.substring(0, parenIdx) : (p.name || canonicalKey);
        displayTitle = `${baseName} (${canonicalKey})`;

        actionMap.set(action, {
          key: canonicalKey,
          code: canonicalKey,
          title: displayTitle,
          children: [],
        });
      } else {
        // Ưu tiên tiêu đề rõ ràng từ resource canonical (ví dụ: dryport:read thay vì dryportasset:read)
        if (rawRes === canonicalRes && p.name) {
          const parenIdx = p.name.indexOf(' (');
          const baseName = parenIdx > 0 ? p.name.substring(0, parenIdx) : p.name;
          existingNode.title = `${baseName} (${canonicalKey})`;
        }
      }
    });

    // Sort children in each group: Xem -> Thêm -> Sửa -> Xóa -> Khóa -> Phê duyệt -> Lịch sử -> ...
    const sortedGroups: Record<string, MenuTreeNode[]> = {};
    Object.entries(groups).forEach(([res, actionMap]) => {
      const items = Array.from(actionMap.values());
      items.sort((a, b) => {
        const orderA = getActionOrder(String(a.key));
        const orderB = getActionOrder(String(b.key));
        if (orderA !== orderB) return orderA - orderB;
        return String(a.title).localeCompare(String(b.title), 'vi');
      });
      sortedGroups[res] = items;
    });

    return Object.entries(sortedGroups)
      .sort(([resA], [resB]) => getResourceOrder(resA) - getResourceOrder(resB))
      .map(([res, children]) => ({
        key: `group_${res}`,
        code: `group_${res}`,
        title: RESOURCE_LABELS[res] || `Quản lý ${res}`,
        children,
      }));
  }, [perms]);

  const validCodesSet = useMemo(() => {
    if (!perms.length) return null;
    const set = new Set(perms.map((p) => normalizePermissionKey(p.key)));
    setActiveCatalogKeys(set);
    return set;
  }, [perms]);

  const allKeys = useMemo(
    () => [...expandPermissionAliases(perms.map((p) => p.key), validCodesSet)],
    [perms, validCodesSet],
  );

  return {
    tree,
    allKeys,
    allGroupKeys: [],
    apiPermissions: perms,
    validCodesSet,
    isLoading: apiQuery.isLoading,
    isError: apiQuery.isError,
    error: apiQuery.error,
  };
}

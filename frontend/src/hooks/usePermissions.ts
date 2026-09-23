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

export function isStructuralNodeKey(key: string): boolean {
  return key.startsWith('group_') || key.startsWith('domain_');
}

export function getVisiblePermissionKeys(
  checkedKeys: readonly string[],
  nodes: readonly MenuTreeNode[],
): string[] {
  const visibleKeys = getPermissionTreeKeys(nodes);
  const checkedSet = new Set(checkedKeys.map((k) => normalizePermissionKey(String(k))));
  const result: string[] = [];

  for (const vKey of visibleKeys) {
    if (isStructuralNodeKey(vKey)) continue;
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
    if (isStructuralNodeKey(k)) continue;
    const normK = normalizePermissionKey(k);
    if (!allowedSet || allowedSet.has(normK)) {
      expanded.add(k);
    }
    const eqKeys = getEquivalentPermissionKeys(k);
    eqKeys.forEach((eq) => {
      const normEq = normalizePermissionKey(eq);
      if (!allowedSet || allowedSet.has(normEq)) {
        expanded.add(eq);
      }
    });
    // Nếu k là key hợp lệ từ UI nhưng bản thân k không nằm trực tiếp trong allowedSet
    // (do trong catalog chỉ lưu alias tương đương của nó), mà một trong các equivalent aliases có trong allowedSet:
    // ta vẫn thêm k vào expanded để UI giữ được checked state trên cây.
    if (allowedSet && !allowedSet.has(normK) && eqKeys.some((eq) => allowedSet.has(normalizePermissionKey(eq)))) {
      expanded.add(k);
    }
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
  // 1. Tập quyền (kèm MỌI alias tương đương) thuộc phạm vi cây hiển thị hiện tại.
  // Không giới hạn allowedKeys khi xác định visibleEquivKeys vì mục đích là nhận diện
  // TẤT CẢ các mã quyền và alias tương đương (kể cả mã cũ hoặc mã alias khác) đại diện bởi các node hiển thị,
  // để nếu người dùng bỏ chọn trên UI thì chúng phải bị loại bỏ hoàn toàn khỏi remainingKeys.
  const visibleEquivKeys = expandPermissionAliases(getPermissionTreeKeys(nodes), null);

  // 2. Giữ lại các quyền nằm ngoài phạm vi cây lọc hiện tại
  const remainingKeys = currentKeys.filter(
    (key) => !visibleEquivKeys.has(normalizePermissionKey(String(key))),
  );

  // 3. Mở rộng các quyền được tích chọn (đồng bộ cả canonical lẫn alias tồn tại hợp lệ)
  const nextExpandedKeys = expandPermissionAliases(nextVisibleKeys, allowedKeys);

  return [...new Set([...remainingKeys, ...nextExpandedKeys])];
}

export interface TreeCheckInfo {
  node?: {
    key?: string | number;
    children?: readonly unknown[];
    [key: string]: unknown;
  };
  checked?: boolean;
  [key: string]: unknown;
}

export function getNodeLeafKeys(node: MenuTreeNode | Record<string, unknown> | null | undefined): string[] {
  if (!node) return [];
  const leaves: string[] = [];
  const visit = (item: unknown) => {
    if (!item || typeof item !== 'object') return;
    const nodeObj = item as { key?: unknown; children?: unknown[] };
    const itemKey = String(nodeObj.key ?? '');
    const children = nodeObj.children;
    if (!Array.isArray(children) || children.length === 0) {
      if (itemKey && !isStructuralNodeKey(itemKey)) {
        leaves.push(itemKey);
      }
    } else {
      children.forEach(visit);
    }
  };
  visit(node);
  const rootKey = (node as { key?: unknown }).key;
  if (leaves.length === 0 && rootKey && !isStructuralNodeKey(String(rootKey))) {
    leaves.push(String(rootKey));
  }
  return leaves;
}

export function handleTreeCheck(
  checked: readonly unknown[] | { checked: readonly unknown[]; halfChecked?: readonly unknown[] },
  info: TreeCheckInfo | undefined,
  currentKeys: readonly string[],
  treeNodes: readonly MenuTreeNode[],
  allowedKeys?: Set<string> | Iterable<string> | null,
): string[] {
  const rawChecked = Array.isArray(checked) ? checked : (checked?.checked ?? []);
  let nextVisible = rawChecked.map(String).filter((k) => !isStructuralNodeKey(k));
  let workingCurrent = [...currentKeys];

  if (info && info.checked === false && info.node) {
    // Người dùng bỏ tích rõ ràng tại một node (lá, nhóm module hoặc khối chức năng)
    const uncheckedLeaves = getNodeLeafKeys(info.node);
    const uncheckedEquivs = expandPermissionAliases(uncheckedLeaves);
    const uncheckedSet = new Set(
      Array.from(uncheckedEquivs).map((k) => normalizePermissionKey(k)),
    );

    // Loại bỏ hoàn toàn node bị bỏ tích và các alias tương đương khỏi cả nextVisible lẫn workingCurrent
    nextVisible = nextVisible.filter((k) => !uncheckedSet.has(normalizePermissionKey(k)));
    workingCurrent = workingCurrent.filter((k) => !uncheckedSet.has(normalizePermissionKey(k)));
  }

  const merged = mergePermissionKeys(workingCurrent, nextVisible, treeNodes, allowedKeys);
  return merged.filter((key) => !isStructuralNodeKey(key) && key !== '*');
}


const RESOURCE_LABELS: Record<string, string> = {
  // 1. Quản lý KCHT hàng hải (Infrastructure - 28 modules)
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
  navigationchannel: 'Quản lý Luồng hàng hải',
  dikerevetment: 'Quản lý Đê chắn sóng, đê chắn cát, kè hướng dòng, kè bảo vệ bờ',
  shiprepair: 'Quản lý Cơ sở sửa chữa & đóng tàu',
  shiprepairfacility: 'Quản lý Cơ sở sửa chữa, đóng tàu',
  shiprepairyard: 'Quản lý Cơ sở sửa chữa, đóng tàu',
  radarstation: 'Quản lý Trạm radar',
  lighthouse: 'Quản lý Đèn biển và nhà trạm gắn liền đèn biển',
  beaconstation: 'Quản lý Đèn biển và nhà trạm gắn liền đèn biển',
  beaconlight: 'Quản lý Đèn biển và nhà trạm gắn liền đèn biển',
  lighthousestation: 'Quản lý Đèn biển',
  buoy: 'Quản lý Phao tiêu và nhà trạm',
  buoystation: 'Quản lý Nhà trạm phao tiêu',
  vts: 'Quản lý Hệ thống VTS',
  vtsoperationcenter: 'Quản lý Trung tâm điều hành VTS',
  vtsassist: 'Quản lý Hệ thống phụ trợ VTS',
  aissystem: 'Quản lý Hệ thống AIS',
  cctv: 'Quản lý Hệ thống CCTV',
  scada: 'Quản lý Hệ thống SCADA',
  transmission: 'Quản lý Hệ thống truyền dẫn',
  vhf: 'Quản lý Hệ thống thông tin liên lạc VHF',
  daittdh: 'Quản lý Đài TTDH',
  inmarsat: 'Quản lý Đài thông tin vệ tinh mặt đất Inmarsat Hải Phòng',
  coastalstationinmarsat: 'Quản lý Đài thông tin vệ tinh mặt đất Inmarsat Hải Phòng',
  cospassarsat: 'Quản lý Đài Thông tin vệ tinh mặt đất Cospas-Sarsat Việt Nam',
  coastalstationcospassarsat: 'Quản lý Đài Thông tin vệ tinh mặt đất Cospas-Sarsat Việt Nam',
  lrit: 'Quản lý Đài thông tin nhận dạng và truy theo tầm xa (LRIT)',
  coastalstationlrit: 'Quản lý Đài thông tin nhận dạng và truy theo tầm xa (LRIT)',
  ttxltt: 'Quản lý Đài TTXLTT Hà Nội / Hải Phòng',
  coastalstationhaiphong: 'Quản lý Đài TTXLTT Hà Nội / Hải Phòng',
  station: 'Quản lý Nhà trạm hàng hải',
  coastalstation: 'Quản lý Đài duyên hải',
  specialstation: 'Quản lý Đài chuyên dùng / Vệ tinh',

  // 2. Phân hệ Tài sản KCHT hàng hải (Asset - 24 asset modules + 4 operations)
  berthasset: 'Tài sản bến cảng',
  transferareaasset: 'Tài sản khu chuyển tải',
  stormshelterasset: 'Tài sản khu tránh, trú bão',
  buoyberthasset: 'Tài sản bến phao',
  pierasset: 'Tài sản cầu cảng',
  anchorageasset: 'Tài sản khu neo đậu',
  lighthouseasset: 'Tài sản đèn biển và nhà trạm gắn liền đèn biển',
  dikerevetmentasset: 'Tài sản đê/kè',
  buoyasset: 'Tài sản phao, tiêu và nhà trạm',
  channelasset: 'Tài sản luồng hàng hải',
  dryportasset: 'Tài sản cảng cạn',
  lritasset: 'Tài sản đài LRIT',
  cospassarsatasset: 'Tài sản đài Cospas-Sarsat',
  ttxlttasset: 'Tài sản đài TTXLTT',
  vtsasset: 'Tài sản hệ thống VTS',
  radarasset: 'Tài sản trạm radar',
  aisasset: 'Tài sản hệ thống AIS',
  cctvasset: 'Tài sản HT CCTV',
  scadaasset: 'Tài sản HT SCADA',
  transmissionasset: 'Tài sản HT truyền dẫn',
  vtsassistasset: 'Tài sản hệ thống phụ trợ VTS',
  vhfasset: 'Tài sản HTTT liên lạc VHF',
  daittdhasset: 'Tài sản đài TTDH',
  inmarsatasset: 'Tài sản đài Inmarsat',
  assetincrease: 'Yêu cầu tăng tài sản',
  assetdecrease: 'Yêu cầu giảm tài sản',
  inventoryasset: 'Kiểm kê tài sản',
  assetexploitation: 'Khai thác tài sản',
  movementrequest: 'Yêu cầu điều chuyển tài sản',
  inventoryplan: 'Kế hoạch kiểm kê tài sản',
  inventoryreport: 'Báo cáo kiểm kê tài sản',
  asset: 'Quản lý tài sản',
  infraasset: 'Quản lý tài sản kết cấu hạ tầng',

  // 3. Quy hoạch & Vận hành
  portplanning: 'Quản lý Quy hoạch bến cảng',
  planningadjustment: 'Quản lý Điều chỉnh quy hoạch',
  document: 'Quản lý Văn bản pháp lý',
  maintenanceplan: 'Quản lý Kế hoạch bảo trì',
  operationplan: 'Quản lý Kế hoạch vận hành khai thác',
  incident: 'Quản lý Sự cố kết cấu hạ tầng',
  approvalrecord: 'Quản lý Hồ sơ phê duyệt',
  processingrecord: 'Quản lý Biên bản xử lý hiện trường',

  // 4. Quản trị hệ thống
  user: 'Quản lý tài khoản người dùng',
  role: 'Quản lý vai trò & Phân quyền',
  orgunit: 'Quản lý đơn vị tổ chức',
  group: 'Quản lý nhóm người dùng',
  groupmember: 'Quản lý thành viên nhóm',
  admin: 'Quản trị hệ thống',
  log: 'Quản lý Nhật ký kiểm toán (Log)',
  security: 'Quản lý An toàn thông tin & SIEM',
  history: 'Quản lý Lịch sử kiểm toán',

  // 5. Bản đồ & GIS
  map: 'Quản lý Bản đồ & GIS',
  gispoint: 'Quản lý Điểm tọa độ GIS',
  pointobject: 'Quản lý Đối tượng điểm GIS',
  gisline: 'Quản lý Đường tuyến GIS',
  lineobject: 'Quản lý Đối tượng đường GIS',
  gispolygon: 'Quản lý Vùng polygon GIS',
  polygonobject: 'Quản lý Đối tượng vùng GIS',

  // 6. Báo cáo & Dữ liệu
  report: 'Quản lý Báo cáo thống kê',
  data: 'Quản lý Dữ liệu dùng chung & Phê duyệt',
  check: 'Kiểm tra & Rà soát dữ liệu',
  approve: 'Phê duyệt quy trình chung',

  // 7. Kết nối & Liên thông
  connection: 'Quản lý Kết nối chia sẻ dữ liệu',
  interconnect: 'Quản lý Liên thông kết nối',
  api: 'Tích hợp & Chia sẻ API liên thông',
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

const TREE_RESOURCE_CANONICAL_MAP: Record<string, string> = {
  channel: 'navigationchannel',
  vtssystem: 'vts',
  tramradar: 'radarstation',
  shiprepair: 'shiprepairfacility',
  shiprepairyard: 'shiprepairfacility',
  beaconlight: 'beaconstation',
  lighthousestation: 'beaconstation',
  lighthouse: 'beaconstation',
  coastalstationlrit: 'lrit',
  coastalstationcospassarsat: 'cospassarsat',
  coastalstationhaiphong: 'ttxltt',
  coastalstationinmarsat: 'inmarsat',
  waterarea: 'waterzone',
};

const KCHT_RESOURCES_WITHOUT_MANAGE = new Set([
  // KCHT infrastructure resources
  'port', 'berth', 'pier', 'buoyberth', 'anchorage', 'anchorageasset', 'transferarea', 'stormshelter',
  'dryport', 'waterzone', 'waterarea', 'navigationchannel', 'dikerevetment', 'shiprepair',
  'shiprepairfacility', 'shiprepairyard', 'radarstation', 'tramradar', 'beaconstation', 'beaconlight',
  'buoystation', 'buoy', 'lighthouse', 'lighthousestation', 'vts', 'vtsoperationcenter', 'vtsassist',
  'aissystem', 'cctv', 'scada', 'transmission', 'vhf', 'daittdh', 'ttxltt',
  'coastalstation', 'specialstation', 'coastalstationinmarsat', 'coastalstationcospassarsat',
  'coastalstationlrit', 'coastalstationhaiphong', 'inmarsat', 'cospassarsat', 'lrit',
  // Asset resources — bỏ :manage vì manage là nghiệp vụ nội bộ backend
  'asset', 'infraasset',
  'berthasset', 'transferareaasset', 'stormshelterasset', 'buoyberthasset', 'pierasset',
  'anchorageasset', 'lighthouseasset', 'dikerevetmentasset', 'buoyasset', 'channelasset',
  'dryportasset', 'lritasset', 'cospassarsatasset', 'ttxlttasset', 'vtsasset',
  'radarasset', 'aisasset', 'cctvasset', 'scadaasset', 'transmissionasset',
  'vtsassistasset', 'vhfasset', 'daittdhasset', 'inmarsatasset',
  // Asset movement & management
  'assetincrease', 'assetdecrease', 'assetexploitation', 'movementrequest',
  'inventoryasset', 'inventoryplan', 'inventoryreport',
  'approvalrecord', 'processingrecord',
  // Planning & operation
  'maintenanceplan', 'operationplan', 'incident',
  // GIS
  'gispoint', 'pointobject', 'gisline', 'lineobject', 'gispolygon', 'polygonobject',
]);

export function isHiddenPermission(key: string): boolean {
  if (HIDDEN_PERMISSIONS.has(key)) return true;
  const normalized = normalizePermissionKey(key);
  if (HIDDEN_PERMISSIONS.has(normalized)) return true;
  const [resource, action] = normalized.split(':', 2);
  const canonRes = canonicalResource(resource);
  // Loại bỏ hoàn toàn 'Quản lý tài sản' (asset) và 'Quản lý tài sản kết cấu hạ tầng' (infraasset) khỏi phân quyền
  if (canonRes === 'asset' || canonRes === 'infraasset' || resource === 'asset' || resource === 'infraasset') return true;
  const treeCanonical = TREE_RESOURCE_CANONICAL_MAP[canonRes] || TREE_RESOURCE_CANONICAL_MAP[resource] || canonRes;
  if (action === 'manage' && (KCHT_RESOURCES_WITHOUT_MANAGE.has(treeCanonical) || KCHT_RESOURCES_WITHOUT_MANAGE.has(resource) || KCHT_RESOURCES_WITHOUT_MANAGE.has(canonRes))) return true;
  if (key === 'anchoragearea' || key.startsWith('anchoragearea:')) return true;
  if (key.endsWith(':read:restricted') || key.endsWith(':read:confidential')) return true;
  if (key.endsWith(':restricted') || key.endsWith(':confidential')) return true;
  if (action === 'reject' || action === 'rejectc1' || action === 'rejectc2') return true;
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

export interface FunctionalGroupDef {
  key: string;
  title: string;
  order: number;
  resources: string[];
}

export const FUNCTIONAL_GROUPS: FunctionalGroupDef[] = [
  {
    key: 'domain_kcht',
    title: 'Quản lý KCHT hàng hải',
    order: 1,
    resources: [
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
      'navigationchannel',
      'dikerevetment',
      'shiprepairfacility',
      'radarstation',
      'lighthouse',
      'beaconstation',
      'buoy',
      'buoystation',
      'vts',
      'vtsoperationcenter',
      'vtsassist',
      'aissystem',
      'cctv',
      'scada',
      'transmission',
      'vhf',
      'daittdh',
      'inmarsat',
      'cospassarsat',
      'lrit',
      'ttxltt',
      'station',
      'coastalstation',
      'specialstation',
    ],
  },
  {
    key: 'domain_asset',
    title: 'Quản lý tài sản KCHT hàng hải',
    order: 2,
    resources: [
      'berthasset',
      'transferareaasset',
      'stormshelterasset',
      'buoyberthasset',
      'pierasset',
      'anchorageasset',
      'lighthouseasset',
      'dikerevetmentasset',
      'buoyasset',
      'channelasset',
      'dryportasset',
      'lritasset',
      'cospassarsatasset',
      'ttxlttasset',
      'vtsasset',
      'radarasset',
      'aisasset',
      'cctvasset',
      'scadaasset',
      'transmissionasset',
      'vtsassistasset',
      'vhfasset',
      'daittdhasset',
      'inmarsatasset',
      'assetincrease',
      'assetdecrease',
      'inventoryasset',
      'assetexploitation',
      'movementrequest',
      'inventoryplan',
      'inventoryreport',
    ],
  },
  {
    key: 'domain_plan',
    title: 'Quy hoạch & Vận hành',
    order: 3,
    resources: [
      'portplanning',
      'planningadjustment',
      'document',
      'maintenanceplan',
      'operationplan',
      'incident',
      'approvalrecord',
      'processingrecord',
    ],
  },
  {
    key: 'domain_gis',
    title: 'KCHT trên nền bản đồ (GIS)',
    order: 4,
    resources: [
      'map',
      'gispoint',
      'pointobject',
      'gisline',
      'lineobject',
      'gispolygon',
      'polygonobject',
    ],
  },
  {
    key: 'domain_report',
    title: 'Báo cáo thống kê',
    order: 5,
    resources: [
      'report',
      'data',
      'check',
      'approve',
    ],
  },
  {
    key: 'domain_admin',
    title: 'Quản trị hệ thống',
    order: 6,
    resources: [
      'user',
      'role',
      'orgunit',
      'group',
      'groupmember',
      'admin',
      'log',
      'security',
      'history',
    ],
  },
  {
    key: 'domain_connection',
    title: 'Kết nối & Liên thông',
    order: 7,
    resources: [
      'connection',
      'interconnect',
      'api',
    ],
  },
];

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
  'coastalstationinmarsat',
  'inmarsat',
  'coastalstationcospassarsat',
  'cospassarsat',
  'coastalstationhaiphong',
  'ttxltt',
  'coastalstationlrit',
  'lrit',
  'shiprepairfacility',
  'shiprepair',
  'shiprepairyard',

  // Asset resources
  'asset',
  'infraasset',
  'berthasset',
  'transferareaasset',
  'stormshelterasset',
  'buoyberthasset',
  'pierasset',
  'anchorageasset',
  'lighthouseasset',
  'dikerevetmentasset',
  'buoyasset',
  'channelasset',
  'dryportasset',
  'lritasset',
  'cospassarsatasset',
  'ttxlttasset',
  'vtsasset',
  'radarasset',
  'aisasset',
  'cctvasset',
  'scadaasset',
  'transmissionasset',
  'vtsassistasset',
  'vhfasset',
  'daittdhasset',
  'inmarsatasset',
  'assetincrease',
  'assetdecrease',
  'inventoryasset',
  'assetexploitation',
  'movementrequest',
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
 * Hook usePermissions: Build dynamic 3-level permission tree directly from GET /api/permissions
 * Cấu trúc: Cấp 1 (Khối chức năng) -> Cấp 2 (Module) -> Cấp 3 (Nút / Tác vụ)
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
    const moduleActionGroups: Record<string, Map<string, MenuTreeNode>> = {};



    perms.forEach((p) => {
      const rawRes = (p.resource || p.key.split(':')[0] || 'other').toLowerCase();
      const baseCanonicalRes = canonicalResource(rawRes);
      const canonicalRes = TREE_RESOURCE_CANONICAL_MAP[baseCanonicalRes] || TREE_RESOURCE_CANONICAL_MAP[rawRes] || baseCanonicalRes;
      const action = (p.key.split(':').slice(1).join(':') || p.action || '').toLowerCase();
      const canonicalKey = action ? `${canonicalRes}:${action}` : canonicalRes;

      if (!moduleActionGroups[canonicalRes]) {
        moduleActionGroups[canonicalRes] = new Map<string, MenuTreeNode>();
      }
      const actionMap = moduleActionGroups[canonicalRes];

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
        if (rawRes === canonicalRes && p.name) {
          const parenIdx = p.name.indexOf(' (');
          const baseName = parenIdx > 0 ? p.name.substring(0, parenIdx) : p.name;
          existingNode.title = `${baseName} (${canonicalKey})`;
        }
      }
    });

    // Sort children in each module: Xem -> Thêm -> Sửa -> Xóa -> Khóa -> Phê duyệt -> Lịch sử -> ...
    const moduleNodes: Record<string, MenuTreeNode> = {};
    Object.entries(moduleActionGroups).forEach(([res, actionMap]) => {
      const items = Array.from(actionMap.values());
      items.sort((a, b) => {
        const orderA = getActionOrder(String(a.key));
        const orderB = getActionOrder(String(b.key));
        if (orderA !== orderB) return orderA - orderB;
        return String(a.title).localeCompare(String(b.title), 'vi');
      });
      moduleNodes[res] = {
        key: `group_${res}`,
        code: `group_${res}`,
        title: RESOURCE_LABELS[res] || `Quản lý ${res}`,
        children: items,
      };
    });

    // Build 3-level tree grouped by functional domains (Level 1)
    const assignedResources = new Set<string>();
    const treeResult: MenuTreeNode[] = [];

    FUNCTIONAL_GROUPS.forEach((groupDef) => {
      const groupChildren: MenuTreeNode[] = [];
      groupDef.resources.forEach((resKey) => {
        if (moduleNodes[resKey]) {
          groupChildren.push(moduleNodes[resKey]);
          assignedResources.add(resKey);
        }
      });
      if (groupChildren.length > 0) {
        treeResult.push({
          key: groupDef.key,
          code: groupDef.key,
          title: groupDef.title,
          children: groupChildren,
        });
      }
    });

    // Any remaining resources not mapped to standard groups go to "Chức năng khác"
    const remainingModules = Object.keys(moduleNodes)
      .filter((res) => !assignedResources.has(res))
      .sort((a, b) => getResourceOrder(a) - getResourceOrder(b))
      .map((res) => moduleNodes[res]);

    if (remainingModules.length > 0) {
      treeResult.push({
        key: 'domain_other',
        code: 'domain_other',
        title: 'Chức năng khác',
        children: remainingModules,
      });
    }

    return treeResult;
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

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { permissionService } from '../services/permissionService';
import type { MenuTreeNode } from '../types/permission';

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
  return checkedKeys.filter((key) => visibleKeys.has(String(key)));
}

/**
 * Merge a Tree change made on a filtered tree into the complete selection.
 * Permissions outside the filtered tree must not be lost when a user checks
 * or unchecks a visible permission.
 */
export function mergePermissionKeys(
  currentKeys: readonly string[],
  nextVisibleKeys: readonly string[],
  nodes: readonly MenuTreeNode[],
): string[] {
  const visibleKeys = getPermissionTreeKeys(nodes);
  const merged = new Set(currentKeys.filter((key) => !visibleKeys.has(String(key))));
  nextVisibleKeys.forEach((key) => merged.add(String(key)));
  return [...merged];
}

const RESOURCE_LABELS: Record<string, string> = {
  port: 'Quản lý Cảng biển',
  berth: 'Quản lý Bến cảng',
  pier: 'Quản lý Cầu cảng',
  dryport: 'Quản lý Cảng cạn',
  waterarea: 'Quản lý Vùng nước',
  waterzone: 'Quản lý Vùng nước',
  navigationchannel: 'Quản lý Luồng hàng hải',
  dikerevetment: 'Quản lý Đê kè / Đê chắn cát',
  lighthousestation: 'Quản lý Nhà trạm đèn biển',
  radarstation: 'Quản lý Trạm Radar',
  vts: 'Quản lý Hệ thống VTS',
  shiprepairfacility: 'Quản lý Cơ sở sửa chữa & đóng tàu',
  shiprepair: 'Quản lý Cơ sở sửa chữa & đóng tàu',
  buoy: 'Quản lý Phao tiêu báo hiệu',
  beaconlight: 'Quản lý Đèn biển / Đăng tiêu',
  buoystation: 'Quản lý Nhà trạm phao tiêu',
  coastalstation: 'Quản lý Đài duyên hải',
  specialstation: 'Quản lý Đài chuyên dùng / Vệ tinh',
  user: 'Quản lý tài khoản người dùng',
  role: 'Quản lý vai trò & Phân quyền',
  orgunit: 'Quản lý đơn vị tổ chức',
  group: 'Quản lý nhóm người dùng',
  groupmember: 'Quản lý thành viên nhóm',
  document: 'Quản lý Văn bản pháp lý',
  map: 'Quản lý Bản đồ & GIS',
  log: 'Quản lý Nhật ký kiểm toán (Log)',
  history: 'Quản lý Lịch sử kiểm toán',
  admin: 'Quản trị hệ thống',
  connection: 'Quản lý Kết nối chia sẻ dữ liệu',
  report: 'Quản lý Báo cáo thống kê',
  check: 'Kiểm tra & Rà soát dữ liệu',
  api: 'Tích hợp & Chia sẻ API liên thông',
  data: 'Quản lý Dữ liệu Bản đồ & GIS',
  security: 'Quản lý An toàn thông tin & SIEM',
  approve: 'Phê duyệt quy trình chung',
  assetincrease: 'Quản lý Biến động tăng tài sản',
  assetdecrease: 'Quản lý Biến động giảm tài sản',
  inventoryasset: 'Quản lý Kiểm kê tài sản',
  assetexploitation: 'Quản lý Khai thác tài sản',
};

const HIDDEN_PERMISSIONS = new Set([
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
]);

function isHiddenPermission(key: string): boolean {
  if (HIDDEN_PERMISSIONS.has(key)) return true;
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
  'log',
  'security',
  'port',
  'berth',
  'pier',
  'dryport',
  'waterzone',
  'waterarea',
  'navigationchannel',
  'dikerevetment',
  'vts',
  'radarstation',
  'beaconlight',
  'buoy',
  'lighthousestation',
  'buoystation',
  'coastalstation',
  'specialstation',
  'shiprepairfacility',
  'shiprepair',
  'document',
  'map',
  'data',
  'report',
  'connection',
  'api',
  'check',
  'approve',
  'assetincrease',
  'assetdecrease',
  'inventoryasset',
  'assetexploitation',
];

function getResourceOrder(res: string): number {
  const idx = RESOURCE_ORDER.indexOf(res);
  return idx >= 0 ? idx : 999;
}

/**
 * Hook usePermissions: Build dynamic permission tree directly from GET /api/permissions
 * Eliminates legacy menu-tree API calls and legacy menu codes.
 */
export function usePermissions() {
  const apiQuery = useQuery({
    queryKey: ['permission-catalog'],
    queryFn: () => permissionService.list(),
    staleTime: 5 * 60 * 1000,
  });

  const rawPerms = apiQuery.data || [];
  const perms = useMemo(
    () => rawPerms.filter((p) => !isHiddenPermission(p.key)),
    [rawPerms],
  );
  
  // Group standard permissions by resource with memoization
  const tree: MenuTreeNode[] = useMemo(() => {
    if (!perms.length) return [];
    const groups: Record<string, MenuTreeNode[]> = {};
    perms.forEach((p) => {
      let res = p.resource || p.key.split(':')[0] || 'other';
      if (res === 'groupmember') {
        res = 'group';
      }
      if (!groups[res]) groups[res] = [];
      groups[res].push({
        key: p.key,
        code: p.key,
        title: `${p.name} (${p.key})`,
        children: [],
      });
    });

    // Sort children in each group: Xem -> Thêm -> Sửa -> Xóa -> Khóa -> Phê duyệt -> Lịch sử -> ...
    Object.values(groups).forEach((items) => {
      items.sort((a, b) => {
        const orderA = getActionOrder(String(a.key));
        const orderB = getActionOrder(String(b.key));
        if (orderA !== orderB) return orderA - orderB;
        return String(a.title).localeCompare(String(b.title), 'vi');
      });
    });

    return Object.entries(groups)
      .sort(([resA], [resB]) => getResourceOrder(resA) - getResourceOrder(resB))
      .map(([res, children]) => ({
        key: `group_${res}`,
        code: `group_${res}`,
        title: RESOURCE_LABELS[res] || res.toUpperCase(),
        children,
      }));
  }, [perms]);

  const allKeys = useMemo(() => perms.map((p) => p.key), [perms]);

  return {
    tree,
    allKeys,
    allGroupKeys: [],
    apiPermissions: perms,
    isLoading: apiQuery.isLoading,
    isError: apiQuery.isError,
    error: apiQuery.error,
  };
}

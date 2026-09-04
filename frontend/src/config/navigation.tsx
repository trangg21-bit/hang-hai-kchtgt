/**
 * ============================================================
 * MENU-MODEL v2 — single source of truth cho điều hướng
 * (quyết định chốt 2026-09-04 — xem memory AM-66150ca5,
 *  triage TRI-1788457427016-f058, preview: preview-menu-final.html)
 *
 * Mô hình: dashboard-first — 6 khối chức năng làm cổng vào ("/"),
 * sidebar chỉ hiển thị cây menu của KHỐI đang active (suy từ route).
 * Khối "Quản lý KCHT hàng hải" = cây 28 loại KCHT theo ma trận
 * cha–con (docs/SO-DO-VA-MA-TRAN-CHA-CON-KCHT.md); 6 đài viễn thông
 * là nhánh root "Đài viễn thông hàng hải" (tách khỏi TTDH VTS).
 * Nhóm "PHÊ DUYỆT" cũ đã GIẢI THỂ — duyệt C1/C2 nằm trong từng màn.
 *
 * QUY ƯỚC NODE:
 * - key = route cho node có màn (cha lẫn lá) → AntD selectedKey trùng route.
 * - node có children && route: submenu, click tiêu đề (onTitleClick) → route.
 * - node.disabled: hiển thị mờ (chức năng chưa triển khai), KHÔNG navigate.
 * - QUY TẮC BẢO TOÀN: mọi route hiện đang hiển thị trong AppLayout cũ
 *   phải có mặt trong cây (không làm mất lối vào của user).
 * ============================================================
 */
import type { ReactNode } from 'react';
import {
  DashboardOutlined, SettingOutlined, CompassOutlined, ContainerOutlined,
  BankOutlined, EnvironmentOutlined, GlobalOutlined, ApiOutlined,
  BuildOutlined, ToolOutlined, AimOutlined, ExportOutlined, SafetyOutlined,
  TruckOutlined, ApartmentOutlined, BlockOutlined, VideoCameraOutlined,
  MonitorOutlined, FileTextOutlined, PieChartOutlined,
} from '@ant-design/icons';

export type GroupId = 'kcht' | 'asset' | 'plan' | 'gis' | 'report' | 'admin';

export interface NavNode {
  /** key = route nếu node có màn (cha + lá); ngược lại là id không bắt đầu bằng "/" */
  key: string;
  route?: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  note?: string;
  children?: NavNode[];
}

export interface NavGroup {
  id: GroupId;
  label: string;
  desc: string;
  icon: ReactNode;
  tree: NavNode[];
}

const icons = {
  dashboard: <DashboardOutlined />,
  setting: <SettingOutlined />,
  compass: <CompassOutlined />,
  container: <ContainerOutlined />,
  bank: <BankOutlined />,
  environment: <EnvironmentOutlined />,
  global: <GlobalOutlined />,
  api: <ApiOutlined />,
  build: <BuildOutlined />,
  tool: <ToolOutlined />,
  aim: <AimOutlined />,
  export: <ExportOutlined />,
  safety: <SafetyOutlined />,
  truck: <TruckOutlined />,
  apartment: <ApartmentOutlined />,
  block: <BlockOutlined />,
  video: <VideoCameraOutlined />,
  monitor: <MonitorOutlined />,
  file: <FileTextOutlined />,
  pie: <PieChartOutlined />,
};

/* ============ CÂY KCHT — 28 loại theo ma trận cha–con ============ */
const kchtTree: NavNode[] = [
  {
    key: '/port',
    route: '/port',
    label: 'Quản lý cảng biển',
    icon: icons.global,
    children: [
      {
        key: '/berth',
        route: '/berth',
        label: 'Quản lý bến cảng',
        icon: icons.bank,
        children: [
          { key: '/pier', route: '/pier', label: 'Quản lý cầu cảng', icon: icons.build },
        ],
      },
      // Cùng 1 loại "Cơ sở sửa chữa, đóng tàu" nhưng 2 màn theo phân quyền khác nhau (giữ cả 2 để không mất lối vào)
      { key: '/ship-repair-yard', route: '/ship-repair-yard', label: 'Quản lý cơ sở sửa chữa, đóng tàu', icon: icons.tool },
      { key: '/ship-repair-facility', route: '/ship-repair-facility', label: 'Cơ sở sửa chữa & đóng tàu', icon: icons.tool },
      { key: '/buoy-berth', route: '/buoy-berth', label: 'Quản lý bến phao', icon: icons.aim },
      { key: '/anchorage', route: '/anchorage', label: 'Quản lý khu neo đậu', icon: icons.compass },
      { key: '/transfer-area', route: '/transfer-area', label: 'Quản lý khu chuyển tải', icon: icons.export },
      { key: '/storm-shelter', route: '/storm-shelter', label: 'Quản lý khu tránh, trú bão', icon: icons.safety },
      { key: '/water-zone', route: '/water-zone', label: 'Quản lý vùng nước' },
      {
        key: '/navigation-channel',
        route: '/navigation-channel',
        label: 'Luồng hàng hải',
        icon: icons.container,
        children: [
          { key: '/navigation-channel-chk', route: '/navigation-channel-chk', label: 'Luồng hàng hải CHK' },
          {
            key: '/buoy-station',
            route: '/buoy-station',
            label: 'Nhà trạm quản lý vận hành Phao, tiêu',
            icon: icons.bank,
            children: [
              { key: '/buoys', route: '/buoys', label: 'Quản lý Phao, tiêu', icon: icons.environment },
            ],
          },
          { key: '/beacon-stations', route: '/beacon-stations', label: 'Đèn biển và nhà trạm', icon: icons.environment },
          { key: '/dike-revetment', route: '/dike-revetment', label: 'Quản lý đê chắn sóng, đê chắn cát, kè hướng dòng, kè bảo vệ bờ', icon: icons.block },
        ],
      },
    ],
  },
  { key: '/dry-port', route: '/dry-port', label: 'Quản lý cảng cạn', icon: icons.truck },
  {
    key: 'kcht-vts',
    label: 'Hệ thống VTS',
    icon: icons.compass,
    children: [
      { key: '/vts-system', route: '/vts-system', label: 'Thông tin hệ thống VTS' },
      {
        key: '/vts-operation-center',
        route: '/vts-operation-center',
        label: 'Trung tâm điều hành VTS',
        children: [
          { key: '/radar-station', route: '/radar-station', label: 'Trạm Radar' },
          { key: '/ais-system', route: '/ais-system', label: 'Hệ thống trạm bờ AIS' },
          { key: '/cctv', route: '/cctv', label: 'Quản lý hệ thống CCTV', icon: icons.video },
          { key: '/scada', route: '/scada', label: 'Quản lý hệ thống SCADA', icon: icons.monitor },
          { key: '/transmission', route: '/transmission', label: 'Quản lý hệ thống truyền dẫn', icon: icons.apartment },
          { key: '/vts-assist', route: '/vts-assist', label: 'Quản lý hệ thống phụ trợ VTS', icon: icons.tool },
        ],
      },
    ],
  },
  {
    key: 'kcht-vienthong',
    label: 'Đài viễn thông hàng hải',
    icon: icons.apartment,
    children: [
      { key: '/dai-ttdh', route: '/dai-ttdh', label: 'Quản lý đài TTDH', icon: icons.aim },
      { key: 'vhf-disabled', label: 'VHF', disabled: true, note: 'Chức năng đang được xây dựng' },
      { key: '/station/coastal', route: '/station/coastal', label: 'Đài duyên hải VTS' },
      { key: '/station/inmarsat', route: '/station/inmarsat', label: 'Đài vệ tinh Inmarsat' },
      { key: '/station/cospas-sarsat', route: '/station/cospas-sarsat', label: 'Đài Cospas-Sarsat' },
      { key: '/station/lrit', route: '/station/lrit', label: 'Đài LRIT' },
      { key: '/station/hanoi', route: '/station/hanoi', label: 'Đài TTXLTT Hà Nội' },
    ],
  },
];

/* ============ 6 KHỐI CHỨC NĂNG ============ */
export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'kcht',
    label: 'Quản lý KCHT hàng hải',
    desc: '28 loại KCHT theo phân cấp cha – con',
    icon: icons.container,
    tree: kchtTree,
  },
  {
    id: 'asset',
    label: 'Quản lý tài sản KCHT hàng hải',
    desc: 'Tăng, giảm, kiểm kê và khai thác tài sản',
    icon: icons.pie,
    tree: [
      { key: '/asset/increase', route: '/asset/increase', label: 'Yêu cầu tăng tài sản' },
      { key: '/asset/decrease', route: '/asset/decrease', label: 'Yêu cầu giảm tài sản' },
      { key: '/asset/inventory', route: '/asset/inventory', label: 'Kiểm kê tài sản' },
      { key: '/asset/exploitation', route: '/asset/exploitation', label: 'Khai thác tài sản' },
    ],
  },
  {
    id: 'plan',
    label: 'Quản lý quy hoạch & vận hành',
    desc: 'Quy hoạch, văn bản pháp lý và sự cố',
    icon: icons.file,
    tree: [
      { key: '/documents/port-planning', route: '/documents/port-planning', label: 'Quy hoạch bến cảng' },
      { key: '/documents/incidents', route: '/documents/incidents', label: 'Sự cố hàng hải' },
      { key: '/documents/legal', route: '/documents/legal', label: 'Văn bản pháp lý' },
    ],
  },
  {
    id: 'gis',
    label: 'Quản lý KCHT trên nền bản đồ (GIS)',
    desc: 'Danh mục đối tượng, lớp bản đồ và biểu tượng',
    icon: icons.compass,
    tree: [
      { key: '/gis/map', route: '/gis/map', label: 'Quản lý thông tin KCHT hàng hải trên bản đồ' },
      { key: '/gis/points', route: '/gis/points', label: 'Quản lý danh mục đối tượng điểm' },
      { key: '/gis/lines', route: '/gis/lines', label: 'Quản lý danh mục đối tượng đường' },
      { key: '/gis/polygons', route: '/gis/polygons', label: 'Quản lý danh mục đối tượng vùng' },
      { key: '/gis/layers', route: '/gis/layers', label: 'Quản lý lớp bản đồ' },
      { key: '/symbols', route: '/symbols', label: 'Quản lý biểu tượng trên bản đồ' },
    ],
  },
  {
    id: 'report',
    label: 'Báo cáo thống kê',
    desc: 'Dashboard KPI và báo cáo thống kê định kỳ',
    icon: icons.dashboard,
    tree: [
      { key: '/dashboard', route: '/dashboard', label: 'Dashboard KPI tổng quan', icon: icons.dashboard },
      { key: '/reports', route: '/reports', label: 'Tất cả báo cáo', icon: icons.pie },
    ],
  },
  {
    id: 'admin',
    label: 'Quản trị hệ thống',
    desc: 'Người dùng, đơn vị, nhóm, tích hợp và cấu hình',
    icon: icons.setting,
    tree: [
      { key: '/users', route: '/users', label: 'Quản lý tài khoản người dùng' },
      { key: '/organizations', route: '/organizations', label: 'Quản lý đơn vị' },
      { key: '/groups', route: '/groups', label: 'Quản lý nhóm' },
      { key: '/logs', route: '/logs', label: 'Quản lý log truy cập' },
      { key: '/history', route: '/history', label: 'Lịch sử thay đổi' },
      { key: '/interconnect', route: '/interconnect', label: 'Quản lý kết nối liên thông' },
      { key: '/connections', route: '/connections', label: 'Liên thông dữ liệu' },
      { key: '/settings', route: '/settings', label: 'Cấu hình hệ thống' },
    ],
  },
];

/** Alias route tiếng Việt (E2E) → route chuẩn */
const SEGMENT_ALIAS: Record<string, string> = {
  'luong-hang-hai': 'navigation-channel',
  'luong-hang-hai-chk': 'navigation-channel-chk',
};

/** Match pathname vào route của node (route chuẩn / alias / route + '/create' | '/:id') */
function matchesRoute(pathname: string, route: string): boolean {
  const norm = pathname.split('?')[0].replace(/\/+$/, '') || '/';
  const segs = norm.split('/').filter(Boolean);
  if (segs.length > 0 && SEGMENT_ALIAS[segs[0]]) {
    const aliased = `/${SEGMENT_ALIAS[segs[0]]}${segs.slice(1).map((s) => `/${s}`).join('')}`;
    return matchesRoute(aliased, route);
  }
  return norm === route || (route !== '/' && norm.startsWith(`${route}/`));
}

export function findGroup(groupId: GroupId): NavGroup | undefined {
  return NAV_GROUPS.find((g) => g.id === groupId);
}

/** Nhóm active suy từ đường dẫn hiện tại (dashboard-first: sidebar theo khối) */
export function groupOfPath(pathname: string): NavGroup | undefined {
  const norm = pathname.split('?')[0].replace(/\/+$/, '') || '/';
  if (norm === '/') return undefined;
  const hit: { g: NavGroup; best: string } | undefined = NAV_GROUPS.reduce<
    { g: NavGroup; best: string } | undefined
  >((acc, g) => {
    let best = '';
    const walk = (nodes: NavNode[]) => {
      for (const n of nodes) {
        if (n.route && n.route.length > best.length && matchesRoute(norm, n.route)) best = n.route;
        if (n.children) walk(n.children);
      }
    };
    walk(g.tree);
    if (best && (!acc || best.length > acc.best.length)) return { g, best };
    return acc;
  }, undefined);
  return hit?.g;
}

/** Lọc cây theo quyền — giữ node disabled (mờ), bỏ nhánh không còn route truy cập được */
export function accessibleTree(nodes: NavNode[], canAccess: (route: string) => boolean): NavNode[] {
  const out: NavNode[] = [];
  for (const n of nodes) {
    const children = n.children ? accessibleTree(n.children, canAccess) : undefined;
    const selfOk = !n.route || canAccess(n.route);
    if (n.disabled) {
      out.push({ ...n, children });
      continue;
    }
    if (!n.route && children && children.length === 0) continue; // nhóm cha không có con khả dụng → bỏ
    if (selfOk) out.push({ ...n, children });
    else if (children && children.length > 0) out.push({ ...n, children }); // cha có con khả dụng → giữ làm nhóm
  }
  return out;
}

/** Route đầu tiên trong khối mà user truy cập được (cho card landing) */
export function firstAccessibleRoute(group: NavGroup, canAccess: (route: string) => boolean): string | undefined {
  const walk = (nodes: NavNode[]): string | undefined => {
    for (const n of nodes) {
      if (n.route && !n.disabled && canAccess(n.route)) return n.route;
      if (n.children) {
        const child = walk(n.children);
        if (child) return child;
      }
    }
    return undefined;
  };
  return walk(group.tree);
}

/**
 * Định vị node khớp pathname trong cây (route dài nhất thắng).
 * openKeys = chuỗi submenu cần mở để node hiển thị (gồm chính nó nếu node có con).
 */
export function locateRoute(
  nodes: NavNode[],
  pathname: string,
): { key: string; openKeys: string[] } | undefined {
  let best: { key: string; openKeys: string[] } | undefined;
  const walk = (ns: NavNode[], trail: string[]) => {
    for (const n of ns) {
      const ancestors = [...trail, n.key];
      if (n.route && !n.disabled && matchesRoute(pathname, n.route)) {
        const openKeys = n.children && n.children.length > 0 ? ancestors : trail;
        if (!best || openKeys.length >= best.openKeys.length) best = { key: n.key, openKeys };
      }
      if (n.children) walk(n.children, ancestors);
    }
  };
  walk(nodes, []);
  return best;
}

/** Danh sách route sâu nhất của cây khả dụng (cho test/đối chiếu) */
export function collectRoutes(nodes: NavNode[]): string[] {
  const out: string[] = [];
  const walk = (ns: NavNode[]) => {
    for (const n of ns) {
      if (n.route && !n.disabled) out.push(n.route);
      if (n.children) walk(n.children);
    }
  };
  walk(nodes);
  return out;
}

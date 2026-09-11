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
import Icon, {
  DashboardOutlined, SettingOutlined, CompassOutlined, ContainerOutlined,
  BankOutlined, EnvironmentOutlined, GlobalOutlined, ApiOutlined,
  BuildOutlined, BulbOutlined, ToolOutlined, AimOutlined, ExportOutlined, SafetyOutlined,
  TruckOutlined, ApartmentOutlined, BlockOutlined, VideoCameraOutlined,
  MonitorOutlined, FileTextOutlined, PieChartOutlined, RadarChartOutlined, DeploymentUnitOutlined,
  PlusCircleOutlined, MinusCircleOutlined, AuditOutlined, AppstoreOutlined,
  WarningOutlined, FileProtectOutlined, PictureOutlined, UserOutlined, TeamOutlined,
  HistoryOutlined, SyncOutlined, FolderOutlined, SwapOutlined,
} from '@ant-design/icons';

import { landingGroupIcons } from '../themetokenchk';
import { REPORT_TEMPLATES, CATEGORY_MAP } from './reports';
import { CATEGORY_ICONS, REPORT_ICONS } from './reportIcons';

const RadioSvg = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 512 512" width="1em" height="1em" fill="currentColor" {...props}>
    <path d="M448 96c35.3 0 64 28.7 64 64l0 256c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 160c0-35.3 28.7-64 64-64l246.7 0L174.4 20.3c-7-9.3-5-22.5 4.3-29.5s22.5-5 29.5 4.3L323.7 96 448 96zM176 208a112 112 0 1 0 0 224 112 112 0 1 0 0-224zm16 112a16 16 0 1 1 -32 0 16 16 0 1 1 32 0zm192-80l-64 0c-8.8 0-16 7.2-16 16s7.2 16 16 16l64 0c8.8 0 16-7.2 16-16s-7.2-16-16-16zm-64 80l64 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-64 0c-8.8 0-16 7.2-16 16s7.2 16 16 16zm64 48l-64 0c-8.8 0-16 7.2-16 16s7.2 16 16 16l64 0c8.8 0 16-7.2 16-16s-7.2-16-16-16z" />
  </svg>
);

export const RadioIcon = (props: any) => <Icon component={RadioSvg} {...props} />;

export type GroupId = 'kcht' | 'asset' | 'plan' | 'gis' | 'report' | 'admin';

export interface NavNode {
  /** key = route nếu node có màn (cha + lá); ngược lại là id không bắt đầu bằng "/" */
  key: string;
  route?: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  hidden?: boolean;
  note?: string;
  children?: NavNode[];
}

export interface NavGroup {
  id: GroupId;
  label: string;
  desc: string;
  icon: ReactNode;
  tree: NavNode[];
  underDevelopment?: boolean;
}

const icons = {
  dashboard: <DashboardOutlined />,
  setting: <SettingOutlined />,
  compass: <CompassOutlined />,
  container: <ContainerOutlined />,
  bank: <BankOutlined />,
  bulb: <BulbOutlined />,
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
  deployment: <DeploymentUnitOutlined />,
  video: <VideoCameraOutlined />,
  monitor: <MonitorOutlined />,
  file: <FileTextOutlined />,
  pie: <PieChartOutlined />,
  radar: <RadarChartOutlined />,
  radio: <RadioIcon />,
  plusCircle: <PlusCircleOutlined />,
  minusCircle: <MinusCircleOutlined />,
  audit: <AuditOutlined />,
  appstore: <AppstoreOutlined />,
  warning: <WarningOutlined />,
  fileProtect: <FileProtectOutlined />,
  picture: <PictureOutlined />,
  user: <UserOutlined />,
  team: <TeamOutlined />,
  history: <HistoryOutlined />,
  sync: <SyncOutlined />,
  folder: <FolderOutlined />,
  swap: <SwapOutlined />,
};

/* ============ CÂY BÁO CÁO THỐNG KÊ — 8 nhóm biểu mẫu chuyên ngành ============ */
const reportTree: NavNode[] = [
  ...Object.entries(CATEGORY_MAP).map(([catKey, catInfo]) => {
    const isEnabled = catKey === 'bckcht' || catKey === 'bcdl';
    return {
      key: `reports-${catKey}`,
      label: catInfo.label,
      icon: CATEGORY_ICONS[catKey] ?? icons.folder,
      disabled: !isEnabled,
      children: REPORT_TEMPLATES
        .filter((r) => r.category === catKey)
        .map((r) => ({
          key: `/reports/${r.code}`,
          route: `/reports/${r.code}`,
          label: `${r.code} - ${r.name}`,
          icon: REPORT_ICONS[r.code] ?? icons.file,
          disabled: !isEnabled || r.status !== 'active',
        })),
    };
  }),
];

/* ============ CÂY KCHT — 28 loại theo ma trận cha–con ============ */
const kchtTree: NavNode[] = [
  {
    key: '/port',
    route: '/port',
    label: 'Cảng biển',
    icon: icons.global,
    children: [
      {
        key: '/berth',
        route: '/berth',
        label: 'Bến cảng',
        icon: icons.bank,
        children: [
          { key: '/pier', route: '/pier', label: 'Cầu cảng', icon: icons.build },
        ],
      },
      { key: '/ship-repair-yard', route: '/ship-repair-yard', label: 'Cơ sở sửa chữa, đóng tàu', icon: icons.tool },
      { key: '/anchorage', route: '/anchorage', label: 'Khu neo đậu', icon: icons.compass },
      { key: '/transfer-area', route: '/transfer-area', label: 'Khu chuyển tải', icon: icons.export },
      { key: '/storm-shelter', route: '/storm-shelter', label: 'Khu tránh, trú bão', icon: icons.safety },
    ],
  },
  {
    key: '/navigation-channel',
    route: '/navigation-channel',
    label: 'Luồng hàng hải',
    icon: icons.container,
    children: [
      { key: '/buoy-berth', route: '/buoy-berth', label: 'Bến phao', icon: icons.aim },
      {
        key: '/buoy-station',
        route: '/buoy-station',
        label: 'Nhà trạm vận hành Phao, tiêu',
        icon: icons.bank,
        children: [
          { key: '/buoys', route: '/buoys', label: 'Phao, tiêu', icon: icons.environment },
        ],
      },
      { key: '/beacon-stations', route: '/beacon-stations', label: 'Đèn biển và nhà trạm gắn với Đèn biển', icon: icons.bulb },
      { key: '/dike-revetment', route: '/dike-revetment', label: 'Đê chắn sóng, đê chắn cát, kè hướng dòng, kè bảo vệ bờ', icon: icons.deployment },
      { key: '/vhf', route: '/vhf', label: 'Hệ thống thông tin liên lạc VHF', icon: icons.radio },
    ],
  },
  { key: '/dry-port', route: '/dry-port', label: 'Cảng cạn', icon: icons.truck },
  {
    key: '/vts-system',
    route: '/vts-system',
    label: 'Hệ thống VTS',
    icon: icons.compass,
    children: [
      { key: '/vts-operation-center', route: '/vts-operation-center', label: 'Trung tâm điều hành VTS', icon: icons.apartment },
      { key: '/radar-station', route: '/radar-station', label: 'Trạm radar', icon: icons.radar },
      { key: '/ais-system', route: '/ais-system', label: 'Hệ thống trạm bờ AIS', icon: icons.api },
      { key: '/cctv', route: '/cctv', label: 'Hệ thống CCTV', icon: icons.video },
      { key: '/scada', route: '/scada', label: 'Hệ thống SCADA', icon: icons.monitor },
      { key: '/transmission', route: '/transmission', label: 'Hệ thống truyền dẫn', icon: icons.apartment },
      { key: '/vts-assist', route: '/vts-assist', label: 'Hệ thống phụ trợ VTS', icon: icons.tool },
    ],
  },
  {
    key: 'kcht-vienthong',
    label: 'Đài viễn thông hàng hải',
    icon: icons.apartment,
    children: [
      { key: '/dai-ttdh', route: '/dai-ttdh', label: 'Đài TTDH', icon: icons.aim },
      { key: '/station/inmarsat', route: '/station/inmarsat', label: 'Đài vệ tinh Inmarsat', icon: icons.global },
      { key: '/station/cospas-sarsat', route: '/station/cospas-sarsat', label: 'Đài Cospas-Sarsat', icon: icons.safety },
      { key: '/station/lrit', route: '/station/lrit', label: 'Đài LRIT', icon: icons.compass },
      { key: '/station/hanoi', route: '/station/hanoi', label: 'Đài TTXLTT Hà Nội', icon: icons.bank },
    ],
  },
];

/* ============ 6 KHỐI CHỨC NĂNG ============ */
export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'kcht',
    label: 'Quản lý KCHT hàng hải',
    desc: '28 loại KCHT theo phân cấp cha – con',
    icon: landingGroupIcons.kcht,
    tree: kchtTree,
  },
  {
    id: 'asset',
    label: 'Tài sản KCHT hàng hải',
    desc: 'Quản lý hồ sơ, biến động, kiểm kê và khai thác tài sản',
    icon: landingGroupIcons.asset,
    tree: [
      { key: '/asset/berth', route: '/asset/berth', label: 'Tài sản bến cảng', icon: icons.bank },
      { key: '/asset/transmission', route: '/asset/transmission', label: 'Tài sản HT truyền dẫn', icon: icons.deployment },
      { key: '/asset/vts-assist', route: '/asset/vts-assist', label: 'Tài sản hệ thống phụ trợ VTS', icon: icons.tool },
      { key: '/asset/vhf', route: '/asset/vhf', label: 'Tài sản HTTT liên lạc VHF', icon: icons.api },
      { key: '/asset/dai-ttdh', route: '/asset/dai-ttdh', label: 'Tài sản đài TTDH', icon: icons.radar },
      { key: '/asset/inmarsat', route: '/asset/inmarsat', label: 'Tài sản đài Inmarsat', icon: icons.global },
      { key: '/asset/transfer-area', route: '/asset/transfer-area', label: 'Tài sản khu chuyển tải', icon: icons.swap },
      { key: '/asset/storm-shelter', route: '/asset/storm-shelter', label: 'Tài sản khu tránh, trú bão', icon: icons.safety },
      { key: '/asset/buoy-berth', route: '/asset/buoy-berth', label: 'Tài sản bến phao', icon: icons.container },
      { key: '/asset/pier', route: '/asset/pier', label: 'Tài sản cầu cảng', icon: icons.build },
      { key: '/asset/anchorage', route: '/asset/anchorage', label: 'Tài sản khu neo đậu', icon: icons.environment },
      { key: '/asset/lighthouse', route: '/asset/lighthouse', label: 'Tài sản đèn biển và nhà trạm gắn liền đèn biển', icon: icons.bulb },
      { key: '/asset/dike-revetment', route: '/asset/dike-revetment', label: 'Tài sản đê/kè', icon: icons.block },
      { key: '/asset/buoy', route: '/asset/buoy', label: 'Tài sản phao, tiêu và nhà trạm', icon: icons.aim },
      { key: '/asset/channel', route: '/asset/channel', label: 'Tài sản luồng hàng hải', icon: icons.compass },
      { key: '/asset/increase', route: '/asset/increase', label: 'Yêu cầu tăng tài sản', icon: icons.plusCircle },
      { key: '/asset/decrease', route: '/asset/decrease', label: 'Yêu cầu giảm tài sản', icon: icons.minusCircle },
      { key: '/asset/inventory', route: '/asset/inventory', label: 'Kiểm kê tài sản', icon: icons.audit },
      { key: '/asset/exploitation', route: '/asset/exploitation', label: 'Khai thác tài sản', icon: icons.appstore },
    ],
  },
  {
    id: 'plan',
    label: 'Quy hoạch & vận hành',
    desc: 'Quy hoạch, văn bản pháp lý và sự cố',
    icon: landingGroupIcons.plan,
    tree: [
      { key: '/documents/port-planning', route: '/documents/port-planning', label: 'Quy hoạch bến cảng', icon: icons.build },
      { key: '/documents/incidents', route: '/documents/incidents', label: 'Sự cố hàng hải', icon: icons.warning },
      { key: '/documents/legal', route: '/documents/legal', label: 'Văn bản pháp lý', icon: icons.fileProtect },
      { key: '/documents/operation', route: '/documents/operation', label: 'Thông tin vận hành', icon: icons.dashboard },
      { key: '/documents/maintenance', route: '/documents/maintenance', label: 'Thông tin bảo trì', icon: icons.tool },
    ],
  },
  {
    id: 'gis',
    label: 'KCHT trên nền bản đồ (GIS)',
    desc: 'Danh mục đối tượng, lớp bản đồ và biểu tượng',
    icon: landingGroupIcons.gis,
    tree: [
      { key: '/gis/map', route: '/gis/map', label: 'Thông tin KCHT hàng hải trên bản đồ', icon: icons.environment },
      { key: '/gis/points', route: '/gis/points', label: 'Danh mục đối tượng điểm', icon: icons.aim },
      { key: '/gis/lines', route: '/gis/lines', label: 'Danh mục đối tượng đường', icon: icons.deployment },
      { key: '/gis/polygons', route: '/gis/polygons', label: 'Danh mục đối tượng vùng', icon: icons.block },
      { key: '/gis/layers', route: '/gis/layers', label: 'Lớp bản đồ', icon: icons.apartment },
      { key: '/symbols', route: '/symbols', label: 'Biểu tượng trên bản đồ', icon: icons.picture },
    ],
  },
  {
    id: 'report',
    label: 'Báo cáo thống kê',
    desc: 'Dashboard KPI và báo cáo thống kê định kỳ',
    icon: landingGroupIcons.report,
    tree: reportTree,
  },
  {
    id: 'admin',
    label: 'Quản trị hệ thống',
    desc: 'Người dùng, đơn vị, nhóm, tích hợp và cấu hình',
    icon: landingGroupIcons.admin,
    tree: [
      { key: '/users', route: '/users', label: 'Tài khoản người dùng', icon: icons.user },
      { key: '/organizations', route: '/organizations', label: 'Đơn vị', icon: icons.bank },
      { key: '/groups', route: '/groups', label: 'Nhóm', icon: icons.team },
      { key: '/logs', route: '/logs', label: 'Log truy cập', icon: icons.file },
      { key: '/history', route: '/history', label: 'Lịch sử thay đổi', icon: icons.history },
      { key: '/interconnect', route: '/interconnect', label: 'Kết nối liên thông', icon: icons.api },
      { key: '/connections', route: '/connections', label: 'Liên thông dữ liệu', icon: icons.sync },
      { key: '/settings', route: '/settings', label: 'Cấu hình hệ thống', icon: icons.setting },
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
  if (norm === '/reports' || norm.startsWith('/reports/')) {
    return NAV_GROUPS.find((g) => g.id === 'report');
  }
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

/** Lọc cây theo quyền — giữ node disabled (mờ), bỏ nhánh không còn route truy cập được, ẩn node hidden */
export function accessibleTree(nodes: NavNode[], canAccess: (route: string) => boolean): NavNode[] {
  const out: NavNode[] = [];
  for (const n of nodes) {
    if (n.hidden) continue;
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
  if (group.underDevelopment) return undefined;
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

/**
 * Landing search (R-1, M-024): chuẩn hóa text tìm kiếm — trim → lowercase →
 * bỏ dấu tiếng Việt (NFD strip combining marks) → đ/Đ → d. Dùng cho CẢ query
 * lẫn nội dung node để khớp không dấu (vd "cau cang" ↔ "cầu cảng").
 */
export function normalizeSearchText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

/** Label-collector: gom nhãn của mọi node (cha lẫn con) trong một cây nhóm. */
export function collectNavLabels(nodes: NavNode[]): string[] {
  const out: string[] = [];
  const walk = (ns: NavNode[]) => {
    for (const n of ns) {
      out.push(n.label);
      if (n.children) walk(n.children);
    }
  };
  walk(nodes);
  return out;
}

/**
 * Lọc nhóm chức năng theo query (R-2..R-7, M-024): khớp trên group.label +
 * group.desc + nhãn mọi node con trong group.tree. Query rỗng/khoảng trắng →
 * trả nguyên 6 khối (R-2 reset). Không mutate/gán lại NAV_GROUPS.
 */
export function searchNavGroups(query: string, groups: NavGroup[] = NAV_GROUPS): NavGroup[] {
  const q = normalizeSearchText(query);
  if (!q) return groups;
  return groups.filter((group) => {
    const haystack = [group.label, group.desc, ...collectNavLabels(group.tree)]
      .map(normalizeSearchText)
      .join(' ');
    return haystack.includes(q);
  });
}

/**
 * M-024 rework: độ sâu (level C0..C3) của từng node trong cây nhóm.
 * level = số lượng tổ tiên (root = 0) — khớp lv0..lv3 trong preview-menu-final.html
 * (chips C0..C3 lọc theo level). Không mutate cây gốc.
 */
export function treeNodeLevels(nodes: NavNode[]): Map<string, number> {
  const levels = new Map<string, number>();
  const walk = (ns: NavNode[], depth: number) => {
    for (const n of ns) {
      levels.set(n.key, depth);
      if (n.children) walk(n.children, depth + 1);
    }
  };
  walk(nodes, 0);
  return levels;
}

/**
 * M-024 rework: lọc cây theo level (chips C0..C3, mockup preview-menu-final.html).
 * Node có level không nằm trong tập cho phép bị bỏ CẢ nhánh con (con chỉ hiển thị
 * bên trong cha của nó) — đúng semantics mockup renderNode. Node trả về là bản sao,
 * không mutate node/cây gốc.
 */
export function pruneTreeByLevel(
  nodes: NavNode[],
  allowedLevels: ReadonlySet<number>,
  levels?: Map<string, number>,
): NavNode[] {
  const lv = levels ?? treeNodeLevels(nodes);
  const out: NavNode[] = [];
  for (const n of nodes) {
    if (!allowedLevels.has(lv.get(n.key) ?? 0)) continue;
    out.push({ ...n, children: n.children ? pruneTreeByLevel(n.children, allowedLevels, lv) : undefined });
  }
  return out;
}

/** Key của mọi node có children trong cây (cho "Mở rộng / Thu gọn tất cả"). */
export function collectParentKeys(nodes: NavNode[]): string[] {
  const out: string[] = [];
  const walk = (ns: NavNode[]) => {
    for (const n of ns) {
      if (n.children && n.children.length > 0) {
        out.push(n.key);
        walk(n.children);
      }
    }
  };
  walk(nodes);
  return out;
}

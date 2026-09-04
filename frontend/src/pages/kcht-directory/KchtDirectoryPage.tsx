import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Empty, Input, Tooltip, Tree } from 'antd';
import {
  AimOutlined,
  AlertOutlined,
  ApiOutlined,
  ApartmentOutlined,
  AppstoreOutlined,
  BankOutlined,
  BlockOutlined,
  BulbOutlined,
  CameraOutlined,
  CaretDownOutlined,
  CaretRightOutlined,
  CompassOutlined,
  ControlOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  FireOutlined,
  GlobalOutlined,
  HomeOutlined,
  LinkOutlined,
  MonitorOutlined,
  PhoneOutlined,
  PushpinOutlined,
  RadarChartOutlined,
  RetweetOutlined,
  RocketOutlined,
  SearchOutlined,
  SendOutlined,
  SoundOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  TruckOutlined,
  WifiOutlined,
} from '@ant-design/icons';
import {
  actionPrimary,
  borderDefault,
  controlHeight,
  dataSecondary,
  fontSizeLg,
  fontSizeMd,
  fontSizeSm,
  fontSizeXl,
  fontWeightBold,
  fontWeightMedium,
  fontWeightNormal,
  radiusLg,
  radiusPill,
  radiusSm,
  shadowSm,
  spaceMd,
  spaceSm,
  spaceXs,
  spaceXl,
  statusDraft,
  surfaceCard,
  surfacePage,
  textPrimary,
  textSecondary,
  textTertiary,
} from '../../themetokenchk';
import { ScreenHeader } from '../../components/list-view';
import { usePermissionStore } from '../../store/permissionStore';

// ============================================================
// Danh mục KCHT hàng hải — route /kcht-directory
// Hiển thị 28 loại kết cấu hạ tầng hàng hải theo sơ đồ quan hệ
// cha – con (nguồn: SO-DO-VA-MA-TRAN-CHA-CON-KCHT.md) dưới dạng
// cây AntD Tree (showLine, thụt lề 24px/cấp).
//   - Cảng biển (C0) → Bến cảng (C1) → Cầu cảng (C2)
//   - Cảng biển (C0) → Luồng hàng hải (C1) → { Bến phao (C2);
//     Nhà trạm QLVH phao tiêu (C2) → Phao, tiêu (C3);
//     Đèn biển & nhà trạm (C2); Đê chắn sóng, đê chắn cát, kè (C2) }
//   - Cảng biển (C0) → Khu neo đậu / Khu chuyển tải / Khu tránh, trú bão /
//     Cơ sở sửa chữa, đóng tàu (C1)
//   - Hệ thống VTS (C0) → Trung tâm điều hành VTS (C1) → 6 hệ thống (C2)
//   - Cảng cạn (C0)
//   - 6 đài viễn thông hàng hải (gắn lỏng vào Trung tâm VTS hoặc Cảng biển)
// Mỗi loại KCHT dẫn tới màn hình quản lý tương ứng; các loại chưa được
// phân quyền (hoặc chưa có màn hình riêng) hiển thị mờ, không điều hướng.
// ============================================================

type KchtLevel = 'C0' | 'C1' | 'C2' | 'C3';

interface DirectoryTreeNode {
  key: string;
  disabled?: boolean;
  title: ReactNode;
  children?: DirectoryTreeNode[];
}

interface KchtTypeNode {
  /** Route của màn hình quản lý (nếu có); ngược lại là nhóm/gợi ý chưa có màn hình */
  key: string;
  /** Tên hiển thị tiếng Việt của loại KCHT */
  name: string;
  /** Cấp trong sơ đồ cha – con (hiển thị badge cạnh node) */
  level?: KchtLevel;
  /** Icon nhóm cấp gốc (giữ từ bản cũ — icon thực tế render theo NODE_ICONS) */
  icon?: ReactNode;
  /** Ghi chú mờ kèm tên (vd: gắn lỏng) */
  note?: string;
  /** Lá chưa có màn hình quản lý riêng — luôn disable kèm tooltip */
  noRouteNote?: string;
  children?: KchtTypeNode[];
}

// Cây 28 loại KCHT — khớp 100% sơ đồ trong SO-DO-VA-MA-TRAN-CHA-CON-KCHT.md
const KCHT_TREE: KchtTypeNode[] = [
  {
    key: '/port',
    name: 'Cảng biển',
    level: 'C0',
    icon: <GlobalOutlined />,
    children: [
      {
        key: '/berth',
        name: 'Bến cảng',
        level: 'C1',
        children: [{ key: '/pier', name: 'Cầu cảng', level: 'C2' }],
      },
      {
        key: '/navigation-channel',
        name: 'Luồng hàng hải',
        level: 'C1',
        children: [
          { key: '/buoy-berth', name: 'Bến phao', level: 'C2' },
          {
            key: '/buoy-station',
            name: 'Nhà trạm QLVH phao tiêu',
            level: 'C2',
            children: [{ key: '/buoys', name: 'Phao, tiêu', level: 'C3' }],
          },
          { key: '/beacon-stations', name: 'Đèn biển & nhà trạm', level: 'C2' },
          { key: '/dike-revetment', name: 'Đê chắn sóng, đê chắn cát, kè', level: 'C2' },
        ],
      },
      { key: '/anchorage', name: 'Khu neo đậu', level: 'C1' },
      { key: '/transfer-area', name: 'Khu chuyển tải', level: 'C1' },
      { key: '/storm-shelter', name: 'Khu tránh, trú bão', level: 'C1' },
      { key: '/ship-repair-facility', name: 'Cơ sở sửa chữa, đóng tàu', level: 'C1' },
    ],
  },
  {
    key: '/vts-system',
    name: 'Hệ thống VTS',
    level: 'C0',
    icon: <ApiOutlined />,
    children: [
      {
        key: '/vts-operation-center',
        name: 'Trung tâm điều hành VTS',
        level: 'C1',
        children: [
          { key: '/radar-station', name: 'Trạm Radar', level: 'C2' },
          { key: '/ais-system', name: 'Hệ thống AIS', level: 'C2' },
          { key: '/cctv', name: 'Hệ thống CCTV', level: 'C2' },
          { key: '/scada', name: 'Hệ thống SCADA', level: 'C2' },
          { key: '/transmission', name: 'Hệ thống truyền dẫn', level: 'C2' },
          { key: '/vts-assist', name: 'Hệ thống phụ trợ VTS', level: 'C2' },
        ],
      },
    ],
  },
  { key: '/dry-port', name: 'Cảng cạn', level: 'C0', icon: <TruckOutlined /> },
  {
    key: 'dai-vien-thong-hang-hai',
    name: 'Đài viễn thông hàng hải',
    note: 'gắn lỏng',
    icon: <ApartmentOutlined />,
    children: [
      { key: '/dai-ttdh', name: 'Đài TTDH', level: 'C1' },
      {
        key: 'vhf-system',
        name: 'Hệ thống VHF',
        level: 'C1',
        noRouteNote: 'Hệ thống VHF chưa có màn hình quản lý riêng.',
      },
      { key: '/station/inmarsat', name: 'Đài Inmarsat', level: 'C1' },
      { key: '/station/lrit', name: 'Đài LRIT', level: 'C1' },
      { key: '/station/cospas-sarsat', name: 'Đài Cospas-Sarsat', level: 'C1' },
      { key: '/station/hanoi', name: 'Đài TTXLTT Hà Nội', level: 'C1' },
    ],
  },
];

// Icon viền (outline) riêng biệt cho cả 28 loại — không chỉ nhóm gốc.
// Key của icon map khớp key của node trong KCHT_TREE.
const NODE_ICONS: Record<string, ReactNode> = {
  '/port': <GlobalOutlined />,
  '/berth': <AimOutlined />,
  '/pier': <LinkOutlined />,
  '/navigation-channel': <CompassOutlined />,
  '/buoy-berth': <PushpinOutlined />,
  '/buoy-station': <HomeOutlined />,
  '/buoys': <BulbOutlined />,
  '/beacon-stations': <FireOutlined />,
  '/dike-revetment': <BlockOutlined />,
  '/anchorage': <EnvironmentOutlined />,
  '/transfer-area': <RetweetOutlined />,
  '/storm-shelter': <ThunderboltOutlined />,
  '/ship-repair-facility': <ToolOutlined />,
  '/vts-system': <ApiOutlined />,
  '/vts-operation-center': <ControlOutlined />,
  '/radar-station': <RadarChartOutlined />,
  '/ais-system': <SendOutlined />,
  '/cctv': <CameraOutlined />,
  '/scada': <MonitorOutlined />,
  '/transmission': <WifiOutlined />,
  '/vts-assist': <AppstoreOutlined />,
  '/dry-port': <TruckOutlined />,
  'dai-vien-thong-hang-hai': <ApartmentOutlined />,
  '/dai-ttdh': <SoundOutlined />,
  'vhf-system': <PhoneOutlined />,
  '/station/inmarsat': <RocketOutlined />,
  '/station/lrit': <EyeOutlined />,
  '/station/cospas-sarsat': <AlertOutlined />,
  '/station/hanoi': <BankOutlined />,
};

// Quyền cần có để mở từng route — khớp chính xác PermissionGuard trong App.tsx
const ROUTE_PERMISSIONS: Record<string, string | string[]> = {
  '/port': 'port:read',
  '/berth': 'berth:read',
  '/pier': 'pier:read',
  '/navigation-channel': 'navigationchannel:read',
  '/buoy-berth': 'buoyberth:read',
  '/buoy-station': 'buoystation:read',
  '/buoys': 'buoy:read',
  '/beacon-stations': 'beaconstation:read',
  '/dike-revetment': 'dikerevetment:read',
  '/anchorage': 'anchorage:read',
  '/transfer-area': 'transferarea:read',
  '/storm-shelter': 'stormshelter:read',
  '/ship-repair-facility': 'shiprepair:read',
  '/vts-system': 'vts:read',
  '/vts-operation-center': 'vtsoperationcenter:read',
  '/radar-station': 'radarstation:read',
  '/ais-system': 'aissystem:read',
  '/cctv': 'cctv:read',
  '/scada': 'scada:read',
  '/transmission': 'transmission:read',
  '/vts-assist': 'vtsassist:read',
  '/dry-port': 'dryport:read',
  '/dai-ttdh': 'daittdh:read',
  '/station/inmarsat': ['specialstation:read', 'coastalstationinmarsat:read', 'coastalstation:read', 'data:read'],
  '/station/cospas-sarsat': 'coastalstationcospassarsat:read',
  '/station/lrit': 'coastalstationlrit:read',
  '/station/hanoi': 'coastalstationhaiphong:read',
};

// Lý do node bị vô hiệu hóa — chuẩn theo UX spec
const NO_ROUTE_NOTE = 'Chức năng đang được xây dựng';
const NO_PERMISSION_NOTE = 'Bạn chưa được phân quyền truy cập mục này';

const LEVELS: KchtLevel[] = ['C0', 'C1', 'C2', 'C3'];

/** Phân cấp thị giác + màu badge riêng từng cấp — toàn bộ lấy từ token. */
const LEVEL_META: Record<KchtLevel, { color: string; textColor: string; fontSize: number; fontWeight: number }> = {
  C0: { color: actionPrimary, textColor: textPrimary, fontSize: fontSizeXl, fontWeight: fontWeightBold },
  C1: { color: dataSecondary, textColor: textPrimary, fontSize: fontSizeMd, fontWeight: fontWeightBold },
  C2: { color: statusDraft, textColor: textSecondary, fontSize: fontSizeMd, fontWeight: fontWeightNormal },
  C3: { color: textTertiary, textColor: textTertiary, fontSize: fontSizeSm, fontWeight: fontWeightNormal },
};
// Nhóm không khai báo cấp (vd "Đài viễn thông hàng hải") hiển thị như nhóm gốc C0
const GROUP_META = LEVEL_META.C0;

// Những key có con (mở rộng được) trong dữ liệu gốc
function collectParentKeys(nodes: KchtTypeNode[], acc: string[] = []): string[] {
  for (const node of nodes) {
    if (node.children?.length) {
      acc.push(node.key);
      collectParentKeys(node.children, acc);
    }
  }
  return acc;
}

const PARENT_KEY_SET = new Set<string>(collectParentKeys(KCHT_TREE));

// Đường dẫn (chuỗi tổ tiên) từ gốc tới từng node — dùng cho breadcrumb khi hover
interface CrumbItem {
  key: string;
  name: string;
}

function collectPaths(nodes: KchtTypeNode[], trail: CrumbItem[] = [], out = new Map<string, CrumbItem[]>()): Map<string, CrumbItem[]> {
  for (const node of nodes) {
    const path = [...trail, { key: node.key, name: node.name }];
    out.set(node.key, path);
    if (node.children?.length) collectPaths(node.children, path, out);
  }
  return out;
}

const PATHS_BY_KEY = collectPaths(KCHT_TREE);
const SOURCE_NODE_BY_KEY = new Map<string, KchtTypeNode>();
(function indexSourceNodes(nodes: KchtTypeNode[]) {
  for (const node of nodes) {
    SOURCE_NODE_BY_KEY.set(node.key, node);
    if (node.children?.length) indexSourceNodes(node.children);
  }
})(KCHT_TREE);

// Số lượng loại KCHT thực tế của từng cấp (cho nhãn chip lọc)
function countLevels(nodes: KchtTypeNode[], acc: Record<KchtLevel, number> = { C0: 0, C1: 0, C2: 0, C3: 0 }): Record<KchtLevel, number> {
  for (const node of nodes) {
    if (node.level) acc[node.level] += 1;
    if (node.children?.length) countLevels(node.children, acc);
  }
  return acc;
}

const LEVEL_COUNTS = countLevels(KCHT_TREE);

// Lọc dữ liệu trước khi render

/** Lọc theo cấp: chỉ giữ node thuộc cấp đang bật; node cấp tắt bị cắt cả nhánh con. */
function applyLevelFilter(nodes: KchtTypeNode[], active: Set<KchtLevel>): KchtTypeNode[] {
  const result: KchtTypeNode[] = [];
  for (const node of nodes) {
    if (node.level && !active.has(node.level)) continue;
    const children = node.children ? applyLevelFilter(node.children, active) : undefined;
    result.push({ ...node, children: children?.length ? children : undefined });
  }
  return result;
}

/** Chuẩn hóa chữ tiếng Việt cho tìm kiếm không dấu, không phân biệt hoa thường. */
function normChar(char: string): string {
  const base = char.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  return base === 'đ' ? 'd' : base;
}

function normText(text: string): string {
  return Array.from(text).map(normChar).join('');
}

function applySearchFilter(nodes: KchtTypeNode[], query: string): { nodes: KchtTypeNode[]; matchedKeys: string[] } {
  const result: KchtTypeNode[] = [];
  const matchedKeys: string[] = [];
  for (const node of nodes) {
    const selfMatch = normText(`${node.name} ${node.note ?? ''}`).includes(query);
    const childResult = node.children?.length
      ? applySearchFilter(node.children, query)
      : { nodes: [], matchedKeys: [] };
    if (selfMatch) {
      result.push(node);
      matchedKeys.push(node.key);
    } else if (childResult.nodes.length) {
      result.push({ ...node, children: childResult.nodes });
    }
    matchedKeys.push(...childResult.matchedKeys);
  }
  return { nodes: result, matchedKeys };
}

// Lưu trạng thái mở rộng (sessionStorage)
const EXPANDED_STORAGE_KEY = 'kcht-directory.expandedKeys.v1';

function loadStoredExpandedKeys(): string[] | null {
  try {
    const raw = sessionStorage.getItem(EXPANDED_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((key): key is string => typeof key === 'string' && PARENT_KEY_SET.has(key));
    }
  } catch {
    // bỏ qua — trả về null để dùng mặc định
  }
  return null;
}

// Các nhánh cần mở sẵn để hiển thị toàn bộ cây 28 loại (bản sao của hằng số cũ)
const DEFAULT_OPEN_KEYS = [
  '/port',
  '/berth',
  '/navigation-channel',
  '/buoy-station',
  '/vts-system',
  '/vts-operation-center',
  'dai-vien-thong-hang-hai',
];

/** CSS phạm vi riêng cho cây — chỉ áp dụng bên trong .kcht-tree, giá trị đều lấy từ token. */
const kchtTreeCss = `
  .kcht-tree {
    background: transparent;
    color: ${textPrimary};
    font-size: ${fontSizeMd}px;
  }
  .kcht-tree .ant-tree-indent-unit { width: 24px !important; }
  .kcht-tree .ant-tree-switcher { color: ${textTertiary}; }
  .kcht-tree .ant-tree-node-content-wrapper {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    border-radius: ${radiusSm}px;
    padding: 2px 8px;
  }
  .kcht-tree .ant-tree-node-content-wrapper:hover { background-color: ${actionPrimary}0D; }
  .kcht-tree .ant-tree-node-content-wrapper.ant-tree-node-selected { background-color: ${actionPrimary}1A; }
  .kcht-tree .ant-tree-title { flex: 1 1 auto; min-width: 0; display: inline-flex; }
  .kcht-tree .ant-tree-treenode-disabled .ant-tree-node-content-wrapper {
    cursor: not-allowed;
    opacity: 0.45;
  }
  .kcht-tree .ant-tree-treenode-disabled .ant-tree-node-content-wrapper:hover { background-color: transparent; }
`;

/** Badge cấp (C0/C1/C2/C3) — Pill Badge Standard, màu riêng biệt từng cấp. */
function LevelBadge({ level }: { level: KchtLevel }) {
  const color = LEVEL_META[level].color;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        flexShrink: 0,
        padding: '2px 10px',
        borderRadius: radiusPill,
        fontSize: fontSizeMd,
        fontWeight: fontWeightMedium,
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
        marginLeft: spaceSm,
        color,
        background: `${color}15`,
        border: `1px solid ${color}40`,
      }}
    >
      {level}
    </span>
  );
}

/** Chip lọc cấp C0–C3 (bật/tắt hiển thị cấp). */
function LevelFilterChip({
  level,
  active,
  count,
  onToggle,
}: {
  level: KchtLevel;
  active: boolean;
  count: number;
  onToggle: (level: KchtLevel) => void;
}) {
  const color = LEVEL_META[level].color;
  return (
    <button
      type="button"
      aria-pressed={active}
      title={`${active ? 'Ẩn' : 'Hiện'} cấp ${level}`}
      onClick={() => onToggle(level)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: spaceSm,
        padding: '2px 10px',
        borderRadius: radiusPill,
        fontSize: fontSizeMd,
        fontWeight: fontWeightMedium,
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        userSelect: 'none',
        color: active ? surfaceCard : textSecondary,
        background: active ? color : surfaceCard,
        border: active ? `1px solid ${color}` : `1px solid ${borderDefault}`,
        transition: 'background-color 0.15s ease, color 0.15s ease',
      }}
    >
      <span
        aria-hidden
        style={{
          width: 8,
          height: 8,
          borderRadius: radiusPill,
          flexShrink: 0,
          display: 'inline-block',
          background: color,
          border: active ? `1px solid ${surfaceCard}` : `1px solid ${color}`,
          opacity: active ? 1 : 0.55,
        }}
      />
      {level}
      {count > 0 ? <span style={{ opacity: 0.78 }}>({count})</span> : null}
    </button>
  );
}

export default function KchtDirectoryPage() {
  const navigate = useNavigate();
  const { hasPermission, hasAnyPermission } = usePermissionStore();

  const [activeLevels, setActiveLevels] = useState<Set<KchtLevel>>(() => new Set(LEVELS));
  const [searchText, setSearchText] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<string[]>(
    () => loadStoredExpandedKeys() ?? DEFAULT_OPEN_KEYS,
  );
  const [searchKeys, setSearchKeys] = useState<string[] | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const searchActive = searchText.trim().length > 0;
  const normalizedQuery = searchActive ? normText(searchText.trim()) : '';

  const handleSearchTextChange = (value: string) => {
    // Reset các nhánh mở rộng do tay chỉnh trong lúc tìm kiếm cũ khi gõ từ khóa mới
    setSearchKeys(null);
    setSearchText(value);
  };

  // Lưu trạng thái mở rộng xuống sessionStorage (không lưu trong lúc đang tìm kiếm)
  useEffect(() => {
    if (searchActive) return;
    try {
      sessionStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify(expandedKeys));
    } catch {
      // bỏ qua — sessionStorage có thể bị chặn
    }
  }, [expandedKeys, searchActive]);

  const checkRouteAccess = (route: string): boolean => {
    const required = ROUTE_PERMISSIONS[route];
    if (!required) return true;
    return Array.isArray(required) ? hasAnyPermission(required) : hasPermission(required);
  };

  const toggleLevel = (level: KchtLevel) => {
    setActiveLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  };

  const resetFilters = () => {
    setActiveLevels(new Set(LEVELS));
    setSearchText('');
    setSearchKeys(null);
  };

  // Cây sau khi lọc theo cấp + từ khóa (AND)
  const { filteredTree, matchedKeys, empty } = useMemo(() => {
    const byLevel = applyLevelFilter(KCHT_TREE, activeLevels);
    if (!searchActive) {
      const count = (function countNodes(nodes: KchtTypeNode[]): number {
        return nodes.reduce((sum, node) => sum + 1 + (node.children ? countNodes(node.children) : 0), 0);
      })(byLevel);
      return { filteredTree: byLevel, matchedKeys: [] as string[], empty: count === 0 };
    }
    const searched = applySearchFilter(byLevel, normalizedQuery);
    const count = (function countNodes(nodes: KchtTypeNode[]): number {
      return nodes.reduce((sum, node) => sum + 1 + (node.children ? countNodes(node.children) : 0), 0);
    })(searched.nodes);
    return { filteredTree: searched.nodes, matchedKeys: searched.matchedKeys, empty: count === 0 };
  }, [activeLevels, searchActive, normalizedQuery]);

  // Các nút cha cần tự mở khi tìm kiếm để hiện ra nhánh chứa kết quả
  const autoExpandKeys = useMemo(() => {
    if (!searchActive) return [] as string[];
    const ancestorSet = new Set<string>();
    for (const key of matchedKeys) {
      const path = PATHS_BY_KEY.get(key);
      if (!path) continue;
      for (let i = 0; i < path.length - 1; i += 1) {
        if (PARENT_KEY_SET.has(path[i].key)) ancestorSet.add(path[i].key);
      }
    }
    return Array.from(ancestorSet);
  }, [searchActive, matchedKeys]);

  // Các node cha hiện đang hiển thị trong cây đã lọc — dùng cho "Mở rộng tất cả"
  const visibleParentKeys = useMemo(() => {
    const keys: string[] = [];
    (function collect(nodes: KchtTypeNode[]) {
      for (const node of nodes) {
        if (node.children?.length) {
          keys.push(node.key);
          collect(node.children);
        }
      }
    })(filteredTree);
    return keys;
  }, [filteredTree]);

  // Bộ key mở rộng thực tế truyền vào Tree
  const displayExpandedKeys = searchActive ? (searchKeys ?? autoExpandKeys) : expandedKeys;

  const handleExpandAll = () => {
    const target = searchActive ? setSearchKeys : setExpandedKeys;
    target(visibleParentKeys);
  };

  const handleCollapseAll = () => {
    const target = searchActive ? setSearchKeys : setExpandedKeys;
    target([]);
  };

  /** Tô sáng phần tên khớp từ khóa (không dấu, không phân biệt hoa thường). */
  const renderHighlightedName = (name: string): ReactNode => {
    if (!searchActive) return name;
    const source = Array.from(name);
    const haystack = normText(name);
    const idx = haystack.indexOf(normalizedQuery);
    if (idx < 0) return name;
    const before = source.slice(0, idx).join('');
    const match = source.slice(idx, idx + Array.from(normalizedQuery).length).join('');
    const after = source.slice(idx + Array.from(normalizedQuery).length).join('');
    return (
      <>
        {before}
        <span
          style={{
            background: `${actionPrimary}1F`,
            color: actionPrimary,
            borderRadius: radiusSm,
            padding: '0 2px',
            fontWeight: fontWeightMedium,
          }}
        >
          {match}
        </span>
        {after}
      </>
    );
  };

  /** Lý do disable của node (chỉ áp dụng cho node LÁ trong dữ liệu gốc). */
  const disabledReasonOf = (node: KchtTypeNode): string | null => {
    const source = SOURCE_NODE_BY_KEY.get(node.key);
    // Node có con (kể cả khi con đang bị lọc ẩn) là nhánh cha — không bao giờ mờ
    if (source?.children?.length) return null;
    const route = node.key.startsWith('/') ? node.key : undefined;
    if (!route) return NO_ROUTE_NOTE;
    if (!checkRouteAccess(route)) return NO_PERMISSION_NOTE;
    return null;
  };

  /** Dựng nội dung 1 dòng: icon cấp + tên (tô sáng nếu khớp) + ghi chú + badge cấp. */
  const renderNodeTitle = (node: KchtTypeNode, reason: string | null): ReactNode => {
    const meta = node.level ? LEVEL_META[node.level] : GROUP_META;
    const nameNode = (
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minWidth: 0,
          flexShrink: 1,
          color: meta.textColor,
          fontSize: meta.fontSize,
          fontWeight: meta.fontWeight,
        }}
      >
        {renderHighlightedName(node.name)}
      </span>
    );
    const content = (
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          minWidth: 0,
          width: '100%',
          maxWidth: '100%',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            flexShrink: 0,
            marginRight: spaceSm,
            color: meta.color,
            fontSize: meta.fontSize,
            lineHeight: 1,
          }}
        >
          {NODE_ICONS[node.key]}
        </span>
        {nameNode}
        {node.note ? (
          <span
            style={{
              flexShrink: 0,
              marginLeft: spaceXs,
              color: textTertiary,
              fontSize: meta.fontSize === fontSizeSm ? fontSizeSm : fontSizeMd,
              fontWeight: fontWeightMedium,
            }}
          >
            ({node.note})
          </span>
        ) : null}
        {node.level ? <LevelBadge level={node.level} /> : null}
      </span>
    );
    if (!reason) return content;
    return (
      <Tooltip title={reason} placement="right">
        {content}
      </Tooltip>
    );
  };

  /** Chuyển cây KCHT đã lọc thành dữ liệu Tree của AntD. */
  const buildTreeData = (nodes: KchtTypeNode[]): DirectoryTreeNode[] =>
    nodes.map((node) => {
      const reason = disabledReasonOf(node);
      return {
        key: node.key,
        disabled: reason !== null,
        title: renderNodeTitle(node, reason),
        ...(node.children?.length ? { children: buildTreeData(node.children) } : {}),
      };
    });

  const treeData = buildTreeData(filteredTree);

  const handleExpand = (keys: React.Key[]) => {
    const stringKeys = keys.map(String);
    if (searchActive) setSearchKeys(stringKeys);
    else setExpandedKeys(stringKeys);
  };

  const handleSelect = (keys: React.Key[]) => {
    setSelectedKeys(keys.map(String));
    const key = keys.length ? String(keys[0]) : '';
    if (!key) return;
    const source = SOURCE_NODE_BY_KEY.get(key);
    if (!source) return;
    // Node có route hợp lệ (kể cả node cha như Cảng biển, Bến cảng, Nhà trạm phao tiêu)
    // sẽ điều hướng tới màn hình quản lý; mở rộng/thu gọn giờ dùng mũi tên caret.
    const route = source.key.startsWith('/') ? source.key : undefined;
    if (!route) return;
    if (checkRouteAccess(route)) navigate(route);
  };

  const hoveredPath = hoveredKey ? PATHS_BY_KEY.get(hoveredKey) : undefined;

  const breadcrumbItems: { label: string }[] = [
    { label: 'Danh mục chức năng' },
    { label: 'Quản lý KCHT hàng hải' },
    ...(hoveredPath ?? []).map((item) => ({ label: item.name })),
  ];

  return (
    <div
      style={{
        background: surfacePage,
        minHeight: '100%',
        padding: spaceXl,
      }}
    >
      <ScreenHeader breadcrumb={breadcrumbItems} />

      <div style={{ marginBottom: spaceMd }}>
        <p style={{ color: textSecondary, fontSize: fontSizeMd, margin: 0, lineHeight: 1.5 }}>
          Sơ đồ 28 loại kết cấu hạ tầng hàng hải theo quan hệ cha – con. Bấm vào một dòng để mở rộng /
          thu gọn nhánh cha, hoặc mở màn hình quản lý tương ứng với loại lá; loại hiển thị mờ là chưa
          được phân quyền hoặc chưa có màn hình riêng. Di chuột lên một loại để xem đường dẫn phân cấp
          trên breadcrumb.
        </p>
      </div>

      <div
        style={{
          background: surfaceCard,
          border: `1px solid ${borderDefault}`,
          borderRadius: radiusLg,
          boxShadow: shadowSm,
          padding: spaceMd,
        }}
      >
        {/* Tiêu đề + nút mở rộng / thu gọn */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: spaceSm,
            paddingLeft: spaceSm,
            paddingRight: spaceSm,
          }}
        >
          <span style={{ color: textPrimary, fontSize: fontSizeLg, fontWeight: fontWeightBold }}>
            Sơ đồ phân cấp 28 loại KCHT
          </span>
          <div style={{ display: 'inline-flex', gap: spaceSm, flexShrink: 0 }}>
            <Button
              size="small"
              onClick={handleExpandAll}
              style={{
                borderRadius: radiusPill,
                height: 32,
                paddingInline: spaceMd,
                fontSize: fontSizeMd,
                fontWeight: fontWeightMedium,
                color: textSecondary,
                background: surfaceCard,
                borderColor: borderDefault,
              }}
            >
              Mở rộng tất cả
            </Button>
            <Button
              size="small"
              onClick={handleCollapseAll}
              style={{
                borderRadius: radiusPill,
                height: 32,
                paddingInline: spaceMd,
                fontSize: fontSizeMd,
                fontWeight: fontWeightMedium,
                color: textSecondary,
                background: surfaceCard,
                borderColor: borderDefault,
              }}
            >
              Thu gọn tất cả
            </Button>
          </div>
        </div>

        {/* Bộ lọc cấp C0–C3 (đa lựa chọn) + ô tìm kiếm */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spaceMd,
            paddingLeft: spaceSm,
            paddingRight: spaceSm,
            marginTop: spaceMd,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: spaceSm,
            }}
          >
            <span
              style={{
                color: textSecondary,
                fontSize: fontSizeMd,
                fontWeight: fontWeightMedium,
                whiteSpace: 'nowrap',
              }}
            >
              Lọc theo cấp:
            </span>
            {LEVELS.map((level) => (
              <LevelFilterChip
                key={level}
                level={level}
                active={activeLevels.has(level)}
                count={LEVEL_COUNTS[level]}
                onToggle={toggleLevel}
              />
            ))}
          </div>
          <Input
            allowClear
            value={searchText}
            onChange={(event) => handleSearchTextChange(event.target.value)}
            prefix={<SearchOutlined style={{ color: textTertiary }} />}
            placeholder="Tìm kiếm loại KCHT..."
            style={{
              flex: '1 1 280px',
              minWidth: 280,
              maxWidth: 460,
              height: controlHeight,
              borderRadius: radiusPill,
              background: surfaceCard,
              color: textPrimary,
            }}
          />
        </div>

        {/* Cây KCHT */}
        <div className="kcht-tree" style={{ marginTop: spaceMd }}>
          <style>{kchtTreeCss}</style>
          {empty ? (
            <div style={{ padding: `${spaceMd} 0` }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span style={{ color: textTertiary, fontSize: fontSizeMd }}>
                    {searchActive
                      ? 'Không tìm thấy loại KCHT nào khớp với từ khóa đang tìm.'
                      : 'Không có loại KCHT nào ở các cấp đang chọn.'}
                  </span>
                }
              >
                <Button
                  size="small"
                  onClick={resetFilters}
                  style={{
                    borderRadius: radiusPill,
                    height: 32,
                    paddingInline: spaceMd,
                    fontSize: fontSizeMd,
                    fontWeight: fontWeightMedium,
                    color: textSecondary,
                    background: surfaceCard,
                    borderColor: borderDefault,
                  }}
                >
                  Xóa bộ lọc
                </Button>
              </Empty>
            </div>
          ) : (
            <Tree
              className="kcht-tree"
              blockNode
              showLine
              selectable
              multiple={false}
              expandAction={false}
              showIcon={false}
              treeData={treeData}
              expandedKeys={displayExpandedKeys}
              selectedKeys={selectedKeys}
              onExpand={handleExpand}
              onSelect={handleSelect}
              onMouseEnter={(info) => {
                const key = info.node.key;
                if (key !== null && key !== undefined) setHoveredKey(String(key));
              }}
              onMouseLeave={() => setHoveredKey(null)}
              switcherIcon={(nodeProps) =>
                nodeProps.expanded ? (
                  <CaretDownOutlined style={{ color: textTertiary }} />
                ) : (
                  <CaretRightOutlined style={{ color: textTertiary }} />
                )
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

import type { CSSProperties, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import {
  GlobalOutlined,
  ApiOutlined,
  TruckOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import {
  actionPrimary,
  colors,
  surfaceCard,
  surfacePage,
  textPrimary,
  textSecondary,
  textTertiary,
  borderDefault,
  shadowSm,
  radiusLg,
  radiusPill,
  fontSizeMd,
  fontSizeLg,
  fontWeightBold,
  fontWeightMedium,
  spaceSm,
  spaceMd,
  spaceLg,
  spaceXl,
} from '../../themetokenchk';
import { ScreenHeader } from '../../components/list-view';
import { usePermissionStore } from '../../store/permissionStore';

// ============================================================
// Danh mục KCHT hàng hải — route /kcht-directory
// Hiển thị 28 loại kết cấu hạ tầng hàng hải theo sơ đồ quan hệ
// cha – con (nguồn: SO-DO-VA-MA-TRAN-CHA-CON-KCHT.md).
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

interface KchtTypeNode {
  /** Route của màn hình quản lý (nếu có); ngược lại là nhóm/gợi ý chưa có màn hình */
  key: string;
  /** Tên hiển thị tiếng Việt của loại KCHT */
  name: string;
  /** Cấp trong sơ đồ cha – con (hiển thị badge cạnh node) */
  level?: KchtLevel;
  /** Icon chỉ dùng cho các nhóm cấp gốc */
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

const NO_PERMISSION_NOTE = 'Bạn chưa được phân quyền truy cập màn hình này.';

// Các submenu cần mở sẵn để hiển thị toàn bộ cây 28 loại
const DEFAULT_OPEN_KEYS = [
  '/port',
  '/berth',
  '/navigation-channel',
  '/buoy-station',
  '/vts-system',
  '/vts-operation-center',
  'dai-vien-thong-hang-hai',
];

/** Badge cấp (C0/C1/C2/C3) kế thừa quy chuẩn Pill Badge Standard — chỉ dùng token màu. */
function LevelBadge({ level }: { level: KchtLevel }) {
  const pill: CSSProperties =
    level === 'C0'
      ? {
          background: colors.sidebarBg,
          border: `1px solid ${colors.sidebarBg}`,
          color: surfaceCard,
        }
      : {
          background: `${actionPrimary}15`,
          border: `1px solid ${actionPrimary}40`,
          color: actionPrimary,
        };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: radiusPill,
        fontSize: fontSizeMd,
        fontWeight: fontWeightMedium,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        marginLeft: spaceSm,
        ...pill,
      }}
    >
      {level}
    </span>
  );
}

export default function KchtDirectoryPage() {
  const navigate = useNavigate();
  const { hasPermission, hasAnyPermission } = usePermissionStore();

  const checkRouteAccess = (route: string): boolean => {
    const required = ROUTE_PERMISSIONS[route];
    if (!required) return true;
    return Array.isArray(required) ? hasAnyPermission(required) : hasPermission(required);
  };

  /** Nhãn node: tên loại + badge cấp (+ ghi chú mờ như "gắn lỏng") */
  const renderNodeLabel = (node: KchtTypeNode): ReactNode => (
    <span style={{ display: 'inline-flex', alignItems: 'center', maxWidth: '100%' }}>
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {node.name}
        {node.note ? (
          <span style={{ color: textTertiary, marginLeft: spaceSm, fontWeight: fontWeightMedium }}>
            ({node.note})
          </span>
        ) : null}
      </span>
      {node.level ? <LevelBadge level={node.level} /> : null}
    </span>
  );

  /** Dựng items cho AntD Menu (mode inline): submenu = loại có con, item = lá điều hướng */
  const buildMenuItems = (nodes: KchtTypeNode[]): NonNullable<MenuProps['items']> =>
    nodes.map((node): NonNullable<MenuProps['items']>[number] => {
      const children = node.children ?? [];
      const hasChildren = children.length > 0;
      // Node điều hướng có key là chính route (bắt đầu bằng '/'); node nhóm/thuần
      // (vd "Đài viễn thông hàng hải", "Hệ thống VHF") không có route.
      const route = node.key.startsWith('/') ? node.key : undefined;
      const label = renderNodeLabel(node);

      // Loại chưa có màn hình quản lý riêng (vd Hệ thống VHF)
      if (!route && !hasChildren) {
        return {
          key: node.key,
          icon: node.icon,
          disabled: true,
          label: <Tooltip title={node.noRouteNote}>{label}</Tooltip>,
        };
      }

      // Loại có loại con → submenu (bấm tiêu đề để mở trang của chính loại đó nếu có quyền)
      if (hasChildren) {
        return {
          key: node.key,
          icon: node.icon,
          label,
          children: buildMenuItems(children),
          ...(route
            ? {
                onTitleClick: () => {
                  if (route && checkRouteAccess(route)) navigate(route);
                },
              }
            : {}),
        };
      }

      // Lá có route → item điều hướng; chưa có quyền thì disable kèm tooltip
      if (!route || !checkRouteAccess(route)) {
        return {
          key: node.key,
          icon: node.icon,
          disabled: true,
          label: <Tooltip title={NO_PERMISSION_NOTE}>{label}</Tooltip>,
        };
      }
      return {
        key: node.key,
        icon: node.icon,
        label,
        onClick: () => navigate(route),
      };
    });

  const menuItems = buildMenuItems(KCHT_TREE);

  return (
    <div
      style={{
        background: surfacePage,
        minHeight: '100%',
        padding: spaceXl,
      }}
    >
      <ScreenHeader
        breadcrumb={[{ label: 'Danh mục chức năng', path: '/' }, { label: 'Quản lý KCHT hàng hải' }]}
      />

      <div style={{ marginBottom: spaceLg }}>
        <p style={{ color: textSecondary, fontSize: fontSizeMd, margin: 0, lineHeight: 1.5 }}>
          Sơ đồ 28 loại kết cấu hạ tầng hàng hải theo quan hệ cha – con. Chọn một loại để mở màn hình
          quản lý tương ứng; loại hiển thị mờ là chưa được phân quyền hoặc chưa có màn hình riêng.
        </p>
      </div>

      <div
        style={{
          background: surfaceCard,
          border: `1px solid ${borderDefault}`,
          borderRadius: radiusLg,
          boxShadow: shadowSm,
          padding: `${spaceLg} ${spaceMd} ${spaceLg} ${spaceMd}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            marginBottom: spaceSm,
            paddingLeft: spaceSm,
            paddingRight: spaceSm,
          }}
        >
          <span style={{ color: textPrimary, fontSize: fontSizeLg, fontWeight: fontWeightBold }}>
            Sơ đồ phân cấp 28 loại KCHT
          </span>
          <span
            style={{
              color: textTertiary,
              fontSize: fontSizeMd,
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            Cấp:
            <LevelBadge level="C0" />
            <LevelBadge level="C1" />
            <LevelBadge level="C2" />
            <LevelBadge level="C3" />
          </span>
        </div>

        <Menu
          mode="inline"
          selectable={false}
          defaultOpenKeys={DEFAULT_OPEN_KEYS}
          items={menuItems}
          style={{
            background: 'transparent',
            borderInlineEnd: 'none',
            fontSize: fontSizeMd,
          }}
        />
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Layout,
  Menu,
  Button,
  Avatar,
  Dropdown,
  Grid,
  Drawer,
  Typography,
  Space,
} from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  SettingOutlined,
  DownOutlined,
  ContainerOutlined,
  SearchOutlined,
  BankOutlined,
  EnvironmentOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { usePermissionStore } from '../store/permissionStore';
import { layout } from '../theme';
import * as themeTokenChk from '../themetokenchk';
import { actionPrimary } from '../themetokenchk';
import { ThemeTokenProvider } from '../context/ThemeTokenContext';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

export const MENU_PERMISSION_MAP: Record<string, string | string[]> = {
  '/users': 'user:read',
  '/organizations': 'orgunit:read',
  '/groups': 'group:read',
  '/gis/points': 'data:read',
  '/gis/lines': 'data:read',
  '/gis/polygons': 'data:read',
  '/gis/layers': 'map:manage',
  '/gis/map': 'data:read',
  '/gis/permits': 'map:manage',
  '/beacon-stations': 'data:read',
  '/buoys': 'data:read',
  '/buoy-station': 'data:read',
  '/history': 'admin:view',
  '/port': 'port:read',
  '/berth': 'berth:read',
  '/pier': 'pier:read',
  '/dry-port': 'dryport:read',
  '/water-zone': 'waterarea:read',
  '/anchorage': 'anchorage:read',
  '/transfer-area': 'transferarea:read',
  '/storm-shelter': 'stormshelter:read',
  '/buoy-berth': 'buoyberth:read',
  '/dai-ttdh': 'daittdh:read',
  '/ship-repair-yard': 'shiprepairyard:read',
  '/asset/increase': 'data:read',
  '/asset/decrease': 'data:read',
  '/asset/inventory': 'data:read',
  '/asset/exploitation': 'data:read',
  '/navigation-channel': 'navigationchannel:read',
  '/navigation-channel-chk': 'navigationchannel:read',
  '/dike-revetment': 'dikerevetment:read',
  '/ship-repair-facility': 'shiprepair:read',
  '/radar-station': 'radarstation:read',
  '/vts-system': 'vts:read',
  '/vts-operation-center': 'vtsoperationcenter:read',
  '/ais-system': 'aissystem:read',
  '/cctv': 'cctv:read',
  '/scada': 'scada:read',
  '/transmission': 'transmission:read',
  '/vts-assist': 'vtsassist:read',
  '/station/coastal': 'coastalstation:read',
  '/station/inmarsat': 'specialstation:read',
  '/station/cospas-sarsat': 'coastalstationcospassarsat:read',
  '/station/lrit': 'coastalstationlrit:read',
  '/station/hanoi': 'coastalstationhaiphong:read',
  '/connections': 'connection:read',
  '/interconnect': 'connection:read',
  '/reports': 'report:read',
  '/settings': 'admin:manage',
  '/logs': 'admin:view',
  '/symbols': 'map:manage',
  '/documents/legal': 'document:read',
  '/documents/incidents': 'document:read',
  '/documents/port-planning': 'document:read',
};

const canAccessMenu = (path: string): boolean => {
  const required = MENU_PERMISSION_MAP[path];
  if (!required) return true;
  
  if (Array.isArray(required)) {
    return usePermissionStore.getState().hasAnyPermission(required);
  }
  
  return usePermissionStore.getState().hasPermission(required);
};

function filterEmptyChildren(items: MenuProps['items']): NonNullable<MenuProps['items']> {
  if (!items) return [];
  return items
    .map((item: any) => {
      if (!item) return null;
      if (item.children) {
        const validChildren = filterEmptyChildren(item.children);
        if (validChildren.length === 0) return null;
        return { ...item, children: validChildren };
      }
      return item;
    })
    .filter(Boolean)
    .reduce((acc: any[], item: any, idx: number, arr: any[]) => {
      if (item.type === 'divider') {
        if (acc.length === 0) return acc;
        if (acc[acc.length - 1]?.type === 'divider') return acc;
        if (idx === arr.length - 1) return acc;
      }
      acc.push(item);
      return acc;
    }, []);
}

export function filterMenuByQuery(items: MenuProps['items'], query: string): MenuProps['items'] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  const keepMatching = (nodes: MenuProps['items']): MenuProps['items'] =>
    (nodes ?? []).map((node: any) => {
      if (!node) return null;
      if (node.type === 'divider') return node;
      if (node.children) return { ...node, children: keepMatching(node.children) };
      const labelMatches = typeof node.label === 'string' && node.label.toLowerCase().includes(q);
      return labelMatches ? node : null;
    });
  return filterEmptyChildren(keepMatching(items));
}

export function collectOpenableKeys(items: MenuProps['items']): string[] {
  return (items ?? []).reduce<string[]>((acc, node: any) => {
    if (node?.children?.length) {
      acc.push(node.key as string);
      acc.push(...collectOpenableKeys(node.children));
    }
    return acc;
  }, []);
}

export default function AppLayout() {
  const isInIframe = window.self !== window.top;
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const collapsed = false;
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const isMenuFullScreen = false;
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const screens = useBreakpoint();

  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 150);
    return () => clearTimeout(timer);
  }, [sidebarHidden]);

  // Map đường dẫn hiện tại về key tương ứng trong menu (landing + 6 nhóm chức năng)
  const pathSegments = location.pathname.split('/').filter(Boolean);
  let selectedKey: string;
  if (pathSegments.length === 0) {
    selectedKey = '/';
  } else if (pathSegments[0] === 'reports') {
    // /reports hoặc /reports/<mã biểu>; route sâu hơn (vd: create) quy về đúng biểu
    selectedKey = pathSegments.length >= 2 ? `/${pathSegments[0]}/${pathSegments[1]}` : '/reports';
  } else if (pathSegments[0] === 'asset' || pathSegments[0] === 'gis' || pathSegments[0] === 'documents') {
    // Các nhóm con 2 segment: /asset/<nhóm>, /gis/<loại>, /documents/<loại>
    selectedKey = `/${pathSegments[0]}/${pathSegments[1]}`;
  } else if (
    pathSegments[0] === 'kcht-directory' ||
    // Các loại KCHT & hệ thống kỹ thuật đã chuyển vào trang Danh mục KCHT (/kcht-directory)
    ['port', 'berth', 'pier', 'dry-port', 'buoy-berth', 'anchorage', 'transfer-area', 'storm-shelter',
     'ship-repair-yard', 'dai-ttdh', 'beacon-stations', 'buoys', 'buoy-station',
     'navigation-channel', 'navigation-channel-chk', 'dike-revetment', 'ship-repair-facility',
     'radar-station', 'vts-system', 'vts-system-chk', 'vts-operation-center', 'vts-operation-center-chk',
     'ais-system', 'ais-system-chk', 'cctv', 'scada', 'transmission', 'vts-assist', 'station'].includes(pathSegments[0])
  ) {
    selectedKey = '/kcht-directory';
  } else {
    selectedKey = '/' + pathSegments[0];
  }

  useEffect(() => {
    if (selectedKey) {
      if (selectedKey.startsWith('/asset')) {
        setOpenKeys(['asset-management']);
      } else if (selectedKey.startsWith('/gis') || selectedKey.startsWith('/documents') || ['/symbols', '/water-zone'].includes(selectedKey)) {
        setOpenKeys(['planning-operation']);
      } else if (selectedKey.startsWith('/reports')) {
        setOpenKeys(['reports-parent', 'reports-chung', 'reports-kcht']);
      } else if (['/users', '/organizations', '/groups', '/logs', '/connections', '/settings', '/interconnect'].includes(selectedKey)) {
        setOpenKeys(['system-admin']);
      }
    }
  }, [selectedKey]);

  const rawMenuItems: MenuProps['items'] = [
    { key: '/', icon: <DashboardOutlined />, label: 'Danh mục chức năng' },
    { type: 'divider' as const },
    // Nhóm 2 — Quản lý KCHT hàng hải: lá dẫn tới trang Danh mục 28 loại KCHT
    { key: '/kcht-directory', icon: <ContainerOutlined />, label: 'Quản lý KCHT hàng hải' },
    { type: 'divider' as const },
    // Nhóm 3 — Quản lý tài sản KCHT hàng hải
    {
      key: 'asset-management',
      icon: <BankOutlined />,
      label: 'Quản lý tài sản KCHT hàng hải',
      children: [
        canAccessMenu('/asset/increase') ? { key: '/asset/increase', label: 'Yêu cầu tăng tài sản' } : null,
        canAccessMenu('/asset/decrease') ? { key: '/asset/decrease', label: 'Yêu cầu giảm tài sản' } : null,
        canAccessMenu('/asset/inventory') ? { key: '/asset/inventory', label: 'Kiểm kê tài sản' } : null,
        canAccessMenu('/asset/exploitation') ? { key: '/asset/exploitation', label: 'Khai thác tài sản' } : null,
      ].filter(Boolean),
    },
    { type: 'divider' as const },
    // Nhóm 4 — Quản lý quy hoạch & vận hành
    {
      key: 'planning-operation',
      icon: <EnvironmentOutlined />,
      label: 'Quản lý quy hoạch & vận hành',
      children: [
        canAccessMenu('/gis/points') ? { key: '/gis/points', label: 'Quản lý danh mục đối tượng điểm' } : null,
        canAccessMenu('/gis/lines') ? { key: '/gis/lines', label: 'Quản lý danh mục đối tượng đường' } : null,
        canAccessMenu('/gis/polygons') ? { key: '/gis/polygons', label: 'Quản lý danh mục đối tượng vùng' } : null,
        canAccessMenu('/gis/layers') ? { key: '/gis/layers', label: 'Quản lý lớp bản đồ' } : null,
        canAccessMenu('/gis/map') ? { key: '/gis/map', label: 'Quản lý thông tin KCHT hàng hải trên bản đồ' } : null,
        canAccessMenu('/documents/legal') ? { key: '/documents/legal', label: 'Văn bản pháp lý' } : null,
        canAccessMenu('/documents/incidents') ? { key: '/documents/incidents', label: 'Sự cố hàng hải' } : null,
        canAccessMenu('/documents/port-planning') ? { key: '/documents/port-planning', label: 'Quy hoạch bến cảng' } : null,
        canAccessMenu('/symbols') ? { key: '/symbols', label: 'Quản lý biểu tượng trên bản đồ' } : null,
        canAccessMenu('/water-zone') ? { key: '/water-zone', label: 'Quản lý vùng nước' } : null,
      ].filter(Boolean),
    },
    { type: 'divider' as const },
    // Nhóm 5 — Phê duyệt (chưa triển khai — lá vô hiệu kèm tooltip)
    { key: 'approval', icon: <CheckCircleOutlined />, label: 'Phê duyệt', disabled: true, title: 'Chưa triển khai' },
    { type: 'divider' as const },
    canAccessMenu('/reports') ? {
      key: 'reports-parent',
      icon: <BarChartOutlined />,
      label: 'Báo cáo thống kê',
      children: [
        { key: '/reports', label: 'Tất cả báo cáo' },
        {
          key: 'reports-chung',
          label: 'Báo cáo thống kê chung',
          children: [
            { key: '/reports/F-141', label: 'Báo cáo thống kê tăng giảm tài sản' },
            { key: '/reports/F-142', label: 'Mẫu B04a/BCTC: Thuyết minh chi tiết số liệu tài sản kết cấu hạ tầng đơn vị được giao quản lý nhưng không trực tiếp khai thác, sử dụng' },
            { key: '/reports/F-143', label: 'Mẫu số 02: Báo cáo kê khai tài sản kết cấu hạ tầng hàng hải' },
            { key: '/reports/F-144', label: 'Mẫu số 03: Báo cáo tình hình quản lý tài sản kết cấu hạ tầng hàng hải' },
            { key: '/reports/F-145', label: 'Mẫu số 04: Báo cáo tình hình xử lý tài sản kết cấu hạ tầng hàng hải' },
            { key: '/reports/F-146', label: 'Mẫu số 05: Báo cáo tình hình khai thác tài sản kết cấu hạ tầng hàng hải' },
            { key: '/reports/F-147', label: 'Mẫu số 06: Tổng hợp danh mục TS KCHTGT hàng hải đề nghị xử lý' }
          ]
        },
        {
          key: 'reports-kcht',
          label: 'Nhóm chỉ tiêu kết cấu hạ tầng',
          children: [
            { key: '/reports/F-148', label: 'Biểu 01-N: Năng lực thông qua cảng biển, cầu cảng, cảng bến thủy nội địa' },
            { key: '/reports/F-149', label: 'Biểu 02-N: Năng lực thông qua cảng biển' },
            { key: '/reports/F-150', label: 'Biểu 03-N: Thống kê cầu cảng' },
            { key: '/reports/F-151', label: 'Biểu 04-N: Thống kê luồng hàng hải' },
            { key: '/reports/F-152', label: <span style={{ color: themeTokenChk.statusCritical }}>Biểu 06-N: Thống kê vùng đón trả hoa tiêu, vùng quay trở tàu, ga tránh tàu, khu neo tránh trú bão</span> },
            { key: '/reports/F-153', label: <span style={{ color: themeTokenChk.statusCritical }}>Biểu 05-N: Thống kê khu chuyển tải, khu neo đậu</span> },
            { key: '/reports/F-154', label: <span style={{ color: themeTokenChk.statusCritical }}>Biểu 07-N: Thống kê bến phao, khu neo đậu</span> },
            { key: '/reports/F-155', label: 'Biểu 08-N: Thống kê hệ thống đèn biển' },
            { key: '/reports/F-156', label: <span style={{ color: themeTokenChk.statusCritical }}>Biểu 09-6T/N: Thống kê về hệ thống phao tiêu, báo hiệu trên luồng</span> },
            { key: '/reports/F-157', label: <span style={{ color: themeTokenChk.statusCritical }}>Biểu 10-6T/N: Thống kê phao tiêu, báo hiệu trên luồng</span> },
            { key: '/reports/F-158', label: 'Biểu 11-N: Thống kê về hệ thống giám sát và điều phối giao thông hàng hải (VTS)' },
            { key: '/reports/F-159', label: <span style={{ color: themeTokenChk.statusCritical }}>Biểu 12-N: Hệ thống các đài thông tin duyên hải</span> },
            { key: '/reports/F-160', label: 'Biểu 13-N: Thống kê về hệ thống đê, kè chắn sóng, chắn cát' }
          ]
        },
        {
          key: 'reports-dl',
          label: 'Nhóm chỉ tiêu đo lường',
          children: [
            { key: '/reports/F-161', label: 'Biểu 14-T: Báo cáo chi tiết tàu biển ra, vào cảng biển' },
            { key: '/reports/F-162', label: 'Biểu 15-T: Báo cáo chi tiết phương tiện thủy nội địa ra, vào cảng biển' },
            { key: '/reports/F-163', label: 'Biểu 16-Q: Thống kê tàu biển nước ngoài đến, rời tại khu vực cảng biển' },
            { key: '/reports/F-164', label: 'Biểu 17-Q: Thống kê tàu biển Việt Nam vận tải quốc tế tại khu vực cảng biển' },
            { key: '/reports/F-165', label: 'Biểu 12-T: Khối lượng hàng hóa, hành khách thông qua cảng' },
            { key: '/reports/F-166', label: 'Biểu 12-N: Khối lượng hàng hóa, hành khách thông qua cảng biển theo năm' },
            { key: '/reports/F-167', label: 'Biểu 13-T: Lượt tàu thuyền ra, vào cảng' },
            { key: '/reports/F-168', label: 'Biểu 14-T: Khối lượng hàng hóa thông qua cảng biển bằng đội tàu biển Việt Nam và phương tiện thủy nội địa' },
            { key: '/reports/F-169', label: 'Biểu 15-T: Khối lượng hàng hóa, lượt tàu thông qua cảng biển, bến trong khu vực quản lý' }
          ]
        },
        {
          key: 'reports-pttv',
          label: 'Nhóm chỉ tiêu phương tiện và thuyền viên',
          children: [
            { key: '/reports/F-170', label: 'Biểu 21-6T/N: Thống kê thuyền viên, hoa tiêu hàng hải' },
            { key: '/reports/F-171', label: 'Biểu 22-6T/N: Thống kê tàu biển mang cờ quốc tịch Việt Nam' },
            { key: '/reports/F-172', label: 'Biểu 28-N: Thống kê tàu thuyền hoạt động dịch vụ lai dắt' }
          ]
        },
        {
          key: 'reports-dn',
          label: 'Nhóm chỉ tiêu về doanh nghiệp',
          children: [
            { key: '/reports/F-173', label: 'Biểu 36–N: Thống kê cơ sở đóng mới, sửa chữa, phá dỡ tàu biển' },
            { key: '/reports/F-174', label: 'Biểu 46-6T/N: Tổng hợp khối lượng hàng hóa thông qua cảng biển' }
          ]
        },
        {
          key: 'reports-tt48',
          label: 'Nhóm báo cáo thông tư 48/2017/TT-BGTVT',
          children: [
            { key: '/reports/F-175', label: 'Biểu số 06-N: Năng lực thông qua bến cảng, cầu cảng thông tư 48/2017/TT-BGTVT' },
            { key: '/reports/F-176', label: 'Biểu 07-N: Năng lực thông qua cảng biển, cảng bến thủy nội địa địa phương và doanh nghiệp quản lý' },
            { key: '/reports/F-177', label: 'Biểu 28-T: Khối lượng hàng hóa thông qua cảng' },
            { key: '/reports/F-178', label: 'Biểu 29-N: Khối lượng hàng hóa thông qua cảng' },
            { key: '/reports/F-179', label: 'Biểu 33-N: Sản lượng dịch vụ vận tải, doanh nghiệp và các hoạt động hỗ trợ vận tải đường sắt, đường thủy nội địa, đường biển' }
          ]
        },
        {
          key: 'reports-ccndb',
          label: 'Nhóm chỉ tiêu chuyên ngành bảo đảm',
          children: [
            { key: '/reports/F-180', label: 'Biểu Tổng hợp thông tin chung' },
            { key: '/reports/F-181', label: 'Biểu Tổng hợp thông tin kết cấu hạ tầng giao thông hàng hải' },
            { key: '/reports/F-182', label: 'Biểu Tổng hợp thông tin bảo trì kết cấu hạ tầng giao thông hàng hải' },
            { key: '/reports/F-183', label: 'Biểu Tổng hợp thông tin bảo trì kết cấu hạ tầng giao thông hàng hải- Cầu cảng' },
            { key: '/reports/F-184', label: 'Biểu Tổng hợp thông tin bảo trì kết cấu hạ tầng giao thông hàng hải- Luồng hàng hải' },
            { key: '/reports/F-185', label: 'Biểu Tổng hợp thông tin bảo trì kết cấu hạ tầng giao thông hàng hải- Phao tiêu báo hiệu và nhà trạm quản lý vận hành' },
            { key: '/reports/F-186', label: 'Biểu Tổng hợp thông tin bảo trì kết cấu hạ tầng giao thông hàng hải- Đèn biển và nhà trạm gắn với đèn biển' },
            { key: '/reports/F-187', label: 'Biểu Tổng hợp thông tin bảo trì kết cấu hạ tầng giao thông hàng hải- Đê, kè' },
            { key: '/reports/F-188', label: 'Báo cáo kê khai, tình hình quản lý TS KCHTGT hàng hải' },
            { key: '/reports/F-189', label: 'Báo cáo tình hình hoạt động của báo hiệu hàng hải và công trình đê, kè' }
          ]
        },
        {
          key: 'reports-thtn',
          label: 'Báo cáo tổng hợp theo ngày',
          children: [
            { key: '/reports/F-180N', label: 'Biểu 12-T: Khối lượng hàng hóa, hành khách thông qua cảng biển theo ngày' },
            { key: '/reports/F-182N', label: 'Biểu 13-T: Lượt tàu thuyền vào, rời cảng biển theo ngày' },
            { key: '/reports/F-183N', label: 'Biểu 14-T: Khối lượng hàng hóa, hành khách, lượt tàu thông qua cảng biển bằng đội tàu Việt Nam theo ngày' },
            { key: '/reports/F-184N', label: 'Biểu 15-T: Khối lượng hàng hóa, hành khách thông qua qua cảng biển, bến cảng, khu chuyển tải trong khu vực quản lý theo ngày' }
          ]
        }
      ]
    } : null,
    { type: 'divider' as const },
    // Nhóm 7 — Quản trị hệ thống
    {
      key: 'system-admin',
      icon: <SettingOutlined />,
      label: 'Quản trị hệ thống',
      children: [
        canAccessMenu('/users') ? { key: '/users', label: 'Quản lý tài khoản người dùng' } : null,
        canAccessMenu('/organizations') ? { key: '/organizations', label: 'Quản lý đơn vị' } : null,
        canAccessMenu('/groups') ? { key: '/groups', label: 'Quản lý nhóm' } : null,
        canAccessMenu('/logs') ? { key: '/logs', label: 'Quản lý log truy cập' } : null,
        canAccessMenu('/connections') ? { key: '/connections', label: 'Liên thông dữ liệu' } : null,
        canAccessMenu('/settings') ? { key: '/settings', label: 'Cấu hình hệ thống' } : null,
      ].filter(Boolean),
    },
  ].filter(Boolean) as MenuProps['items'];

  const menuItems = filterEmptyChildren(rawMenuItems);

  const trimmedSearchQuery = searchQuery.trim();
  const isSearching = trimmedSearchQuery.length > 0;
  const displayedItems = isSearching ? filterMenuByQuery(menuItems, trimmedSearchQuery) : menuItems;
  const effectiveOpenKeys = isSearching ? collectOpenableKeys(displayedItems) : openKeys;

  // Keep the responsive mode aligned with Sider's `lg` breakpoint. Using
  // `md` here left a 272px layout offset while AntD had already collapsed the
  // Sider to 80px on tablet widths (768-991px).
  const isMobile = !screens.lg;

  const handleMenuClick = (e: { key: string }) => {
    if (e.key.startsWith('/')) {
      navigate(e.key);
      if (isMobile) setMobileDrawerOpen(false);
    }
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Thông tin cá nhân',
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
    },
  ];

  const handleUserMenuClick: MenuProps['onClick'] = (e) => {
    if (e.key === 'logout') {
      logout();
      navigate('/login');
    }
  };

  const sidebarContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header — logo và nút thu gọn menu */}
      <div 
        className="sidebar-header" 
        style={{ 
          display: 'flex', 
          flexDirection: isMenuFullScreen ? 'column' : 'row',
          alignItems: 'center', 
          justifyContent: 'center', 
          position: 'relative', 
          padding: isMenuFullScreen ? '24px 16px' : '0 16px', 
          cursor: 'pointer',
          borderBottom: isMenuFullScreen ? '1px solid #f0f0f0' : 'none',
          height: isMenuFullScreen ? 'auto' : undefined
        }}
      >
        <div className="sidebar-header__logo-box" onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', marginBottom: isMenuFullScreen ? 12 : 0 }}>
          <img src="/images/logo-vinamarine.png" alt="Logo" style={{ maxHeight: '56px' }} />
        </div>
        {isMenuFullScreen && (
          <Typography.Title level={5} style={{ margin: 0, color: actionPrimary, textAlign: 'center', fontWeight: 600, fontSize: '15px' }}>
            HỆ THỐNG THÔNG TIN QUẢN LÝ KẾT CẤU HẠ TẦNG GIAO THÔNG HÀNG HẢI
          </Typography.Title>
        )}
      </div>

      {/* Ô tìm kiếm — pill trong mờ, ngay dưới header */}
      {!collapsed && !isMenuFullScreen && (
        <div className="sidebar-search">
          <SearchOutlined />
          <input
            placeholder="Tìm kiếm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      <div className="sidebar-menu-scroll">
        <Menu
          theme={isMenuFullScreen ? 'light' : 'dark'}
          mode="inline"
          inlineCollapsed={collapsed}
          selectedKeys={[selectedKey]}
          openKeys={effectiveOpenKeys}
          onOpenChange={setOpenKeys}
          items={displayedItems}
          onClick={handleMenuClick}
          inlineIndent={12}
          style={{ borderInlineEnd: 'none', paddingTop: 4 }}
        />
      </div>

      {/* Footer — text */}
      <div 
        className="sidebar-footer" 
        style={{ 
          justifyContent: 'center',
          color: isMenuFullScreen ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.45)',
          borderTop: isMenuFullScreen ? '1px solid #f0f0f0' : '1px solid rgba(255,255,255,0.06)'
        }}
      >
        <div className="sidebar-header__text" style={{ textAlign: 'center', width: '100%' }}>
          <span className="sidebar-footer__version">Cục Hàng Hải và Đường Thủy</span>
          <span className="sidebar-footer__version">Việt Nam</span>
        </div>
      </div>
    </div>
  );

  const [searchParams] = useSearchParams();
  const hasAction = searchParams.has('action');
  const isListPage = [
    '/port',
    '/berth',
    '/pier',
    '/dry-port',
    '/water-zone'
  ].includes(location.pathname);

  if (isInIframe) {
    const isModalIframe = isListPage && hasAction;
    return (
      <Layout style={{ minHeight: '100vh', background: isModalIframe ? 'transparent' : '#fff' }}>
        <style>{`
          .ant-breadcrumb,
          .ant-card-head,
          .ant-divider,
          h2,
          h3 {
            display: none !important;
          }
          .ant-card {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            margin-bottom: 0 !important;
          }
          .ant-card-body {
            padding: 0 !important;
          }
          body {
            background: ${isModalIframe ? 'transparent' : '#fff'} !important;
          }
          .ant-layout-content {
            padding: 8px 16px !important;
          }
          ${isModalIframe ? `
            #root {
              display: none !important;
            }
            .ant-modal-root .ant-modal-mask {
              display: none !important;
            }
            .ant-modal-root .ant-modal-wrap {
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              right: 0 !important;
              bottom: 0 !important;
              overflow: auto !important;
            }
            .ant-modal-root .ant-modal {
              position: relative !important;
              top: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .ant-modal-root .ant-modal-content {
              border-radius: 0 !important;
              box-shadow: none !important;
              border: none !important;
              padding: 16px !important;
            }
            .ant-modal-root .ant-modal-close {
              display: none !important;
            }
          ` : ''}
        `}</style>
          <Content style={{ padding: 16, minHeight: '100vh', background: isModalIframe ? 'transparent' : '#fff' }}>
            <Outlet />
          </Content>
      </Layout>
    );
  }

  return (
    <>
      <style>{`
        .ant-layout-sider {
          transition: width 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
        }
      `}</style>
      <Layout style={{ height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Desktop Sidebar */}
      {!isMobile && !sidebarHidden && (
        <ThemeTokenProvider tokens={themeTokenChk}>
          <Sider
          width={isMenuFullScreen ? '100%' : layout.sidebarWidth}
          style={{
            borderRight: '1px solid rgba(255,255,255,0.06)',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            height: '100vh',
            overflowY: 'auto',
            zIndex: isMenuFullScreen ? 9999 : 1000,
            background: isMenuFullScreen ? '#fff' : 'var(--bg-sidebar, #1a3f83)',
          }}
          breakpoint="lg"
        >
            {sidebarContent}
          </Sider>
        </ThemeTokenProvider>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <ThemeTokenProvider tokens={themeTokenChk}>
          <Drawer
          placement="left"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          styles={{ body: { padding: 0, background: 'var(--bg-sidebar, #1a3f83)' }, wrapper: { width: 260 } }}
        >
            {sidebarContent}
          </Drawer>
        </ThemeTokenProvider>
      )}

        <Layout 
          style={{ 
            display: 'flex', 
            flexDirection: 'column',
            paddingLeft: (!isMobile && !sidebarHidden) ? layout.sidebarWidth : 0,
            height: '100vh',
          }}
        >
          {/* Header */}
          <Header
            style={{
              padding: '0 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'sticky',
              top: 0,
              zIndex: 100,
            }}
          >
          <Space>
            {isMobile ? (
              <Button
                type="text"
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                    role="img"
                    width="1.2em"
                    height="1.2em"
                    viewBox="0 0 24 24"
                    style={{ verticalAlign: 'middle', color: '#000' }}
                  >
                    <path fill="currentColor" d="M21 15.61L19.59 17l-5.01-5l5.01-5L21 8.39L17.44 12zM3 6h13v2H3zm0 7v-2h10v2zm0 5v-2h13v2z" />
                  </svg>
                }
                onClick={() => setMobileDrawerOpen(true)}
              />
            ) : (
              <Button
                type="text"
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                    role="img"
                    width="1.2em"
                    height="1.2em"
                    viewBox="0 0 24 24"
                    style={{ verticalAlign: 'middle', color: '#000' }}
                  >
                    <path fill="currentColor" d="M21 15.61L19.59 17l-5.01-5l5.01-5L21 8.39L17.44 12zM3 6h13v2H3zm0 7v-2h10v2zm0 5v-2h13v2z" />
                  </svg>
                }
                onClick={() => setSidebarHidden(!sidebarHidden)}
                style={{ fontSize: '18px', padding: '4px 8px' }}
                title={sidebarHidden ? "Mở menu" : "Thu gọn menu"}
              />
            )}
            <Typography.Title level={5} style={{ margin: 0, color: actionPrimary }}>
              HỆ THỐNG THÔNG TIN QUẢN LÝ KẾT CẤU HẠ TẦNG GIAO THÔNG HÀNG HẢI
            </Typography.Title>
          </Space>

          {sidebarHidden && (
            <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
              <img src="/images/logo-vinamarine.png" alt="Logo" style={{ maxHeight: '56px' }} />
            </div>
          )}

          <Space size="middle" style={{ display: 'flex', alignItems: 'center' }}>

            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
              trigger={['click']}
            >
              <div className="topbar-user">
                <div className="topbar-user__avatar-wrap">
                  <Avatar
                    icon={<UserOutlined />}
                    className="topbar-user__avatar"
                    style={{ backgroundColor: actionPrimary }}
                  />
                  <span className="topbar-user__status-dot" />
                </div>
                {!isMobile && (
                  <>
                    <div className="topbar-user__info">
                      <span className="topbar-user__name">
                        {user?.fullName || 'Admin'}
                      </span>
                      <span className="topbar-user__role">
                        {user?.role?.replace('ROLE_', '') || 'Administrator'}
                      </span>
                    </div>
                    <DownOutlined className="topbar-user__arrow" />
                  </>
                )}
              </div>
            </Dropdown>
          </Space>
        </Header>

        {/* Content */}
        <Content
          className={location.pathname === '/vts-system' ? 'vts-list-content' : undefined}
          style={{
            padding: location.pathname === '/gis/map' ? 0 : 24,
            height: 'calc(100vh - 64px)',
            overflow: location.pathname === '/gis/map' ? 'hidden' : 'auto',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
    </>
  );
}

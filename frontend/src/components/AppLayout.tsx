import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Layout,
  Menu,
  Button,
  Avatar,
  Dropdown,
  theme,
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
  CompassOutlined,
  BarChartOutlined,
  ApiOutlined,
  ContainerOutlined,
  SearchOutlined,
  GlobalOutlined,
  BankOutlined,
  BlockOutlined,
  CheckSquareOutlined,
  BuildOutlined,
  EnvironmentOutlined,
  TruckOutlined,
  AimOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { usePermissionStore } from '../store/permissionStore';
import { layout } from '../theme';
import {
  cardStyle,
  spaceMd,
  spaceLg,
  fontSizeMd,
  fontSizeXl,
  fontWeightBold,
  textPrimary,
  shadowSm,
  shadowMd,
} from '../tokens';
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
  '/beacon-stations': 'beaconstation:read',
  '/buoys': 'buoy:read',
  '/buoy-station': 'buoystation:read',
  '/history': 'admin:view',
  '/port': 'port:read',
  '/berth': 'berth:read',
  '/pier': 'pier:read',
  '/dry-port': 'dryport:read',
  '/water-zone': 'waterzone:read',
  '/asset/increase': 'assetincrease:manage',
  '/asset/decrease': 'assetdecrease:manage',
  '/asset/inventory': 'inventoryasset:manage',
  '/asset/exploitation': 'assetexploitation:manage',
  '/navigation-channel': 'navigationchannel:read',
  '/dike-revetment': 'dikerevetment:read',
  '/ship-repair-facility': 'shiprepair:read',
  '/radar-station': 'radarstation:read',
  '/vts-system': 'vts:read',
  '/station/coastal': 'coastalstation:read',
  '/station/special': 'specialstation:read',
  '/connections': 'connection:read',
  '/interconnect': 'connection:read',
  '/reports': 'report:read',
  '/settings': 'admin:manage',
  '/logs': 'admin:view',
  '/symbols': 'data:read',
  '/documents/legal': 'document:read',
  '/documents/incidents': 'document:read',
  '/documents/port-planning': 'document:read',
};

const DASHBOARD_BLOCKS = [
  { label: 'QUẢN LÝ KCHT HÀNG HẢI', icon: <ContainerOutlined />, target: '/port', permission: 'port:read' },
  { label: 'QUẢN LÝ TÀI SẢN KCHT HÀNG HẢI', icon: <BuildOutlined />, target: '/asset/inventory', permission: 'inventoryasset:manage' },
  { label: 'BÁO CÁO THỐNG KÊ', icon: <BarChartOutlined />, target: '/reports', permission: 'report:read' },
  { label: 'QUẢN LÝ NGƯỜI DÙNG', icon: <UserOutlined />, target: '/users', permission: 'user:read' },
  { label: 'QUẢN LÝ QUY HOẠCH & VẬN HÀNH', icon: <CompassOutlined />, target: '/documents/legal', permission: 'document:read' },
  { label: 'TÍCH HỢP', icon: <ApiOutlined />, target: '/connections', permission: 'connection:read' },
];

const canAccessMenu = (path: string): boolean => {
  const required = MENU_PERMISSION_MAP[path];
  if (!required) return true;
  
  if (Array.isArray(required)) {
    return usePermissionStore.getState().hasAnyPermission(required);
  }
  
  return usePermissionStore.getState().hasPermission(required);
};

const pageTitles: Record<string, string> = {
  '/': 'HỆ THỐNG THÔNG TIN QUẢN LÝ KẾT CẤU HẠ TẦNG GIAO THÔNG HÀNG HẢI',
  '/users': 'Quản lý tài khoản người dùng',
  '/organizations': 'Quản lý đơn vị',
  '/groups': 'Quản lý nhóm',
  '/gis/points': 'Quản lý danh mục đối tượng điểm',
  '/gis/lines': 'Quản lý danh mục đối tượng đường',
  '/gis/polygons': 'Quản lý danh mục đối tượng vùng',
  '/gis/layers': 'Quản lý lớp bản đồ',
  '/gis/search': 'Tra cứu thông tin KCHT hàng hải trên bản đồ',
  '/gis/map': 'Quản lý thông tin KCHT hàng hải trên bản đồ',
  '/gis/permits': 'Giấy phép S-63',
  '/beacon-stations': 'Đèn biển và nhà trạm',
  '/buoys': 'Quản lý Phao, tiêu',
  '/buoy-station': 'Nhà trạm Phao, tiêu',
  '/history': 'Lịch sử thay đổi',
  '/port': 'Quản lý cảng biển',
  '/berth': 'Quản lý bến cảng',
  '/pier': 'Quản lý cầu cảng',
  '/dry-port': 'Quản lý cảng cạn',
  '/water-zone': 'Quản lý vùng nước',
  '/navigation-channel': 'Luồng hàng hải',
  '/dike-revetment': 'Quản lý đê chắn sóng, đê chắn cát, kè hướng dòng, kè bảo vệ bờ',
  '/ship-repair-facility': 'Cơ sở sửa chữa & đóng tàu',
  '/radar-station': 'Trạm Radar',
  '/vts-system': 'Hệ thống VTS',
  '/connections': 'Liên thông dữ liệu',
  '/interconnect': 'Quản lý kết nối liên thông',
  '/reports': 'Báo cáo & Thống kê',
  '/settings': 'Cấu hình hệ thống',
  '/logs': 'Quản lý log truy cập',
  '/symbols': 'Quản lý biểu tượng trên bản đồ',
  '/documents/legal': 'Văn bản pháp lý',
  '/documents/incidents': 'Sự cố hàng hải',
  '/documents/port-planning': 'Quy hoạch bến cảng',
  '/station/coastal': 'Đài duyên hải VTS',
  '/station/special': 'Đài vệ tinh Inmarsat',
  '/asset/increase': 'Yêu cầu tăng tài sản',
  '/asset/decrease': 'Yêu cầu giảm tài sản',
  '/asset/inventory': 'Kiểm kê tài sản',
  '/asset/exploitation': 'Khai thác tài sản',
};

export default function AppLayout() {
  const isInIframe = window.self !== window.top;
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const collapsed = false;
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [isMenuFullScreen, setIsMenuFullScreen] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const screens = useBreakpoint();
  const { token } = theme.useToken();

  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 150);
    return () => clearTimeout(timer);
  }, [isMenuFullScreen, sidebarHidden]);

  // Match top-level section: extract first two path segments for GIS submenus
  const pathSegments = location.pathname.split('/').filter(Boolean);
  let selectedKey: string;
  if (pathSegments.length === 0) {
    selectedKey = '/';
  } else if (pathSegments[0] === 'gis') {
    // For GIS, select the deepest valid key: /gis/points, /gis/lines, etc.
    const deepKey = `/${pathSegments[0]}/${pathSegments[1]}`;
    selectedKey = deepKey;
  } else if (pathSegments[0] === 'buoy-station') {
    // M-014: /buoy-station là submenu title, không có segment con — map về key của submenu
    selectedKey = 'buoy-station-parent';
  } else if (pathSegments[0] === 'documents' || pathSegments[0] === 'station' || pathSegments[0] === 'asset') {
    const deepKey = `/${pathSegments[0]}/${pathSegments[1]}`;
    selectedKey = deepKey;
  } else if (pathSegments[0] === 'port') {
    selectedKey = '/port';
  } else if (pathSegments[0] === 'berth') {
    selectedKey = 'berth-parent';
  } else if (pathSegments[0] === 'pier' || pathSegments[0] === 'dry-port' || pathSegments[0] === 'water-zone') {
    selectedKey = '/' + pathSegments[0];
  } else if (pathSegments[0] === 'navigation-channel') {
    selectedKey = 'nav-channel-parent';
  } else if (pathSegments[0] === 'dike-revetment' || pathSegments[0] === 'ship-repair-facility' || pathSegments[0] === 'radar-station' || pathSegments[0] === 'vts-system') {
    selectedKey = '/' + pathSegments[0];
  } else if (pathSegments[0] === 'reports') {
    selectedKey = location.pathname;
  } else {
    selectedKey = '/' + pathSegments[0];
  }

  useEffect(() => {
    if (selectedKey) {
      if (selectedKey === 'buoy-station-parent' || selectedKey === '/buoys') {
        // Giữ chuỗi cảng biển → luồng hàng hải → nhà trạm phao/tiêu mở khi ở /buoy-station hoặc /buoys
        setOpenKeys(['group-kcht', 'port-tree', 'nav-channel-parent', 'buoy-station-parent']);
      } else if (selectedKey === '/beacon-stations' || selectedKey === '/dike-revetment') {
        setOpenKeys(['group-kcht', 'port-tree', 'nav-channel-parent']);
      } else if (selectedKey === '/pier' || selectedKey === 'berth-parent') {
        setOpenKeys(['group-kcht', 'port-tree', 'berth-parent']);
      } else if (selectedKey === '/port') {
        setOpenKeys(['group-kcht', 'port-tree']);
      } else if (selectedKey === '/ship-repair-facility') {
        setOpenKeys(['group-kcht', 'port-tree']);
      } else if (selectedKey === '/vts-system') {
        setOpenKeys(['group-kcht', 'vts-parent']);
      } else if (selectedKey === '/radar-station' || selectedKey === '/station/coastal' || selectedKey === '/station/special') {
        setOpenKeys(['group-kcht', 'vts-parent', 'vts-ops-center']);
      } else if (selectedKey === '/dry-port') {
        setOpenKeys(['group-kcht']);
      } else if (selectedKey.startsWith('/gis') || selectedKey.startsWith('/documents') || selectedKey === '/symbols') {
        setOpenKeys(['group-planning']);
      } else if (selectedKey.startsWith('/asset')) {
        setOpenKeys(['group-asset']);
      } else if (selectedKey.startsWith('/reports')) {
        setOpenKeys(['group-reports', 'reports-chung', 'reports-kcht', 'reports-dl', 'reports-pttv', 'reports-dn', 'reports-tt48', 'reports-ccndb', 'reports-thtn']);
      } else if (['/users', '/organizations', '/groups', '/logs'].includes(selectedKey)) {
        setOpenKeys(['group-users']);
      } else if (['/connections', '/interconnect'].includes(selectedKey)) {
        setOpenKeys(['group-integration']);
      }
    }
  }, [selectedKey]);

  const rawMenuItems: MenuProps['items'] = [
    { key: '/', icon: <DashboardOutlined />, label: 'Trang chủ' },
    { type: 'divider' as const },
    {
      key: 'group-kcht',
      icon: <ContainerOutlined />,
      label: 'I. QUẢN LÝ KCHT HÀNG HẢI',
      children: [
        {
          key: 'port-tree',
          label: 'Quản lý cảng biển',
          icon: <GlobalOutlined />,
          onTitleClick: () => navigate('/port'),
          className: selectedKey === '/port' || selectedKey === 'berth-parent' || selectedKey === '/pier' || selectedKey === 'nav-channel-parent' || selectedKey === 'buoy-station-parent' || selectedKey === '/buoys' || selectedKey === '/beacon-stations' || selectedKey === '/dike-revetment' || selectedKey === '/ship-repair-facility' ? 'submenu-active' : '',
          children: [
            canAccessMenu('/port') ? { key: '/port', label: 'Cảng biển' } : null,
            {
              key: 'berth-parent',
              label: 'Bến cảng',
              icon: <BankOutlined />,
              onTitleClick: () => navigate('/berth'),
              className: selectedKey === 'berth-parent' || selectedKey === '/pier' ? 'submenu-active' : '',
              children: [
                canAccessMenu('/pier') ? { key: '/pier', label: 'Cầu cảng', icon: <BuildOutlined /> } : null,
              ].filter(Boolean),
            },
            {
              key: 'nav-channel-parent',
              label: 'Luồng hàng hải',
              icon: <EnvironmentOutlined />,
              onTitleClick: () => navigate('/navigation-channel'),
              className: selectedKey === 'nav-channel-parent' || selectedKey === 'buoy-station-parent' || selectedKey === '/buoys' || selectedKey === '/beacon-stations' || selectedKey === '/dike-revetment' ? 'submenu-active' : '',
              children: [
                { key: 'mooring-buoy-placeholder', label: 'Bến phao', disabled: true, title: 'Chưa triển khai' },
                canAccessMenu('/beacon-stations') ? { key: '/beacon-stations', label: 'Đèn biển + nhà trạm gắn đèn', icon: <EnvironmentOutlined /> } : null,
                canAccessMenu('/dike-revetment') ? { key: '/dike-revetment', label: 'Đê/kè', icon: <BlockOutlined /> } : null,
                {
                  key: 'buoy-station-parent',
                  label: 'Nhà trạm phao/tiêu',
                  icon: <BankOutlined />,
                  onTitleClick: () => navigate('/buoy-station'),
                  className: selectedKey === 'buoy-station-parent' || selectedKey === '/buoys' ? 'submenu-active' : '',
                  children: [
                    canAccessMenu('/buoys') ? { key: '/buoys', label: 'Phao tiêu', icon: <EnvironmentOutlined /> } : null,
                  ].filter(Boolean),
                },
              ].filter(Boolean),
            },
            { key: 'anchorage-area-placeholder', label: 'Khu neo đậu', disabled: true, title: 'Chưa triển khai' },
            { key: 'transshipment-area-placeholder', label: 'Khu chuyển tải', disabled: true, title: 'Chưa triển khai' },
            { key: 'storm-shelter-area-placeholder', label: 'Khu tránh/trú bão', disabled: true, title: 'Chưa triển khai' },
            canAccessMenu('/ship-repair-facility') ? { key: '/ship-repair-facility', label: 'CS sửa chữa/đóng tàu' } : null,
          ].filter(Boolean),
        },
        {
          key: 'vts-parent',
          label: 'Hệ thống VTS',
          icon: <AimOutlined />,
          onTitleClick: () => navigate('/vts-system'),
          className: selectedKey === '/vts-system' || selectedKey === '/radar-station' || selectedKey === '/station/coastal' || selectedKey === '/station/special' ? 'submenu-active' : '',
          children: [
            canAccessMenu('/vts-system') ? { key: '/vts-system', label: 'Thông tin hệ thống VTS' } : null,
            {
              key: 'vts-ops-center',
              label: 'Trung tâm điều hành VTS',
              className: selectedKey === '/radar-station' || selectedKey === '/station/coastal' || selectedKey === '/station/special' ? 'submenu-active' : '',
              children: [
                { key: 'vts-ops-info-placeholder', label: 'Thông tin TT ĐHVTS', disabled: true, title: 'Chưa triển khai' },
                canAccessMenu('/radar-station') ? { key: '/radar-station', label: 'Radar' } : null,
                { key: 'ais-placeholder', label: 'AIS', disabled: true, title: 'Chưa triển khai' },
                { key: 'cctv-placeholder', label: 'CCTV', disabled: true, title: 'Chưa triển khai' },
                { key: 'scada-placeholder', label: 'SCADA', disabled: true, title: 'Chưa triển khai' },
                { key: 'transmission-placeholder', label: 'Truyền dẫn', disabled: true, title: 'Chưa triển khai' },
                { key: 'vts-aux-placeholder', label: 'Phụ trợ VTS', disabled: true, title: 'Chưa triển khai' },
                { key: 'vhf-placeholder', label: 'VHF', disabled: true, title: 'Chưa triển khai' },
                canAccessMenu('/station/coastal') ? { key: '/station/coastal', label: 'Đài TT duyên hải' } : null,
                canAccessMenu('/station/special') ? { key: '/station/special', label: 'Inmarsat' } : null,
                { key: 'sarsat-placeholder', label: 'Sarsat', disabled: true, title: 'Chưa triển khai' },
                { key: 'lrit-placeholder', label: 'LRIT', disabled: true, title: 'Chưa triển khai' },
                { key: 'tt-center-placeholder', label: 'Trung tâm xử lý TT', disabled: true, title: 'Chưa triển khai' },
              ].filter(Boolean),
            },
          ].filter(Boolean),
        },
        canAccessMenu('/dry-port') ? { key: '/dry-port', label: 'Thông tin cảng cạn', icon: <TruckOutlined /> } : null,
      ].filter(Boolean),
    },
    {
      key: 'group-asset',
      icon: <BuildOutlined />,
      label: 'II. QUẢN LÝ TÀI SẢN KCHT HÀNG HẢI',
      children: [
        canAccessMenu('/asset/increase') ? { key: '/asset/increase', label: 'Yêu cầu tăng tài sản' } : null,
        canAccessMenu('/asset/decrease') ? { key: '/asset/decrease', label: 'Yêu cầu giảm tài sản' } : null,
        canAccessMenu('/asset/inventory') ? { key: '/asset/inventory', label: 'Kiểm kê tài sản' } : null,
        canAccessMenu('/asset/exploitation') ? { key: '/asset/exploitation', label: 'Khai thác tài sản' } : null,
        { key: 'asset-port-placeholder', label: 'Tài sản cảng biển', disabled: true, title: 'Chưa triển khai' },
        { key: 'asset-berth-placeholder', label: 'Tài sản bến cảng', disabled: true, title: 'Chưa triển khai' },
        { key: 'asset-pier-placeholder', label: 'Tài sản cầu cảng', disabled: true, title: 'Chưa triển khai' },
        { key: 'asset-buoy-placeholder', label: 'Tài sản bến phao', disabled: true, title: 'Chưa triển khai' },
        { key: 'asset-dryport-placeholder', label: 'Tài sản cảng cạn', disabled: true, title: 'Chưa triển khai' },
        { key: 'asset-output-placeholder', label: 'Quản lý sản lượng cảng biển', disabled: true, title: 'Chưa triển khai' },
      ].filter(Boolean),
    },
    {
      key: 'group-approval',
      icon: <CheckSquareOutlined />,
      label: 'III. PHÊ DUYỆT',
      children: [
        { key: 'approve-berth-placeholder', label: 'Duyệt Bến cảng', disabled: true, title: 'Chưa triển khai' },
        { key: 'approve-pier-placeholder', label: 'Duyệt Cầu cảng', disabled: true, title: 'Chưa triển khai' },
        { key: 'approve-mooring-buoy-placeholder', label: 'Duyệt Bến phao', disabled: true, title: 'Chưa triển khai' },
        { key: 'approve-storm-shelter-placeholder', label: 'Duyệt Khu tránh/trú bão', disabled: true, title: 'Chưa triển khai' },
        { key: 'approve-transshipment-placeholder', label: 'Duyệt Khu chuyển tải', disabled: true, title: 'Chưa triển khai' },
        { key: 'approve-anchorage-placeholder', label: 'Duyệt Khu neo đậu', disabled: true, title: 'Chưa triển khai' },
        { key: 'approve-shiprepair-placeholder', label: 'Duyệt CS sửa chữa/đóng tàu', disabled: true, title: 'Chưa triển khai' },
        { key: 'approve-navchannel-placeholder', label: 'Duyệt Luồng hàng hải', disabled: true, title: 'Chưa triển khai' },
        { key: 'approve-beacon-placeholder', label: 'Duyệt Đèn biển + nhà trạm gắn đèn', disabled: true, title: 'Chưa triển khai' },
        { key: 'approve-dike-placeholder', label: 'Duyệt Đê/kè', disabled: true, title: 'Chưa triển khai' },
        { key: 'approve-buoy-station-placeholder', label: 'Duyệt Nhà trạm phao/tiêu', disabled: true, title: 'Chưa triển khai' },
        { key: 'approve-buoy-placeholder', label: 'Duyệt Phao tiêu', disabled: true, title: 'Chưa triển khai' },
        { key: 'approve-vts-placeholder', label: 'Duyệt hệ thống VTS', disabled: true, title: 'Chưa triển khai' },
        { key: 'approve-dryport-placeholder', label: 'Duyệt cảng cạn', disabled: true, title: 'Chưa triển khai' },
        { key: 'approve-output-placeholder', label: 'Duyệt sản lượng cảng biển', disabled: true, title: 'Chưa triển khai' },
      ].filter(Boolean),
    },
    {
      key: 'group-reports',
      icon: <BarChartOutlined />,
      label: 'IV. BÁO CÁO THỐNG KÊ',
      children: canAccessMenu('/reports') ? [
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
            { key: '/reports/F-147', label: 'Mẫu số 06: Tổng hợp danh mục TS KCHTGT hàng hải đề nghị xử lý' },
          ],
        },
        {
          key: 'reports-kcht',
          label: 'Nhóm chỉ tiêu kết cấu hạ tầng',
          children: [
            { key: '/reports/F-148', label: 'Biểu 01-N: Năng lực thông qua cảng biển, cầu cảng, cảng bến thủy nội địa' },
            { key: '/reports/F-149', label: 'Biểu 02-N: Năng lực thông qua cảng biển' },
            { key: '/reports/F-150', label: 'Biểu 03-N: Thống kê cầu cảng' },
            { key: '/reports/F-151', label: 'Biểu 04-N: Thống kê luồng hàng hải' },
            { key: '/reports/F-152', label: 'Biểu 06-N: Thống kê vùng đón trả hoa tiêu, vùng quay trở tàu, ga tránh tàu, khu neo tránh trú bão' },
            { key: '/reports/F-153', label: 'Biểu 05-N: Thống kê khu chuyển tải, khu neo đậu' },
            { key: '/reports/F-154', label: 'Biểu 07-N: Thống kê bến phao, khu neo đậu' },
            { key: '/reports/F-155', label: 'Biểu 08-N: Thống kê hệ thống đèn biển' },
            { key: '/reports/F-156', label: 'Biểu 09-6T/N: Thống kê về hệ thống phao tiêu, báo hiệu trên luồng' },
            { key: '/reports/F-157', label: 'Biểu 10-6T/N: Thống kê phao tiêu, báo hiệu trên luồng' },
            { key: '/reports/F-158', label: 'Biểu 11-N: Thống kê về hệ thống giám sát và điều phối giao thông hàng hải (VTS)' },
            { key: '/reports/F-159', label: 'Biểu 12-N: Hệ thống các đài thông tin duyên hải' },
            { key: '/reports/F-160', label: 'Biểu 13-N: Thống kê về hệ thống đê, kè chắn sóng, chắn cát' },
          ],
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
            { key: '/reports/F-169', label: 'Biểu 15-T: Khối lượng hàng hóa, lượt tàu thông qua cảng biển, bến trong khu vực quản lý' },
          ],
        },
        {
          key: 'reports-pttv',
          label: 'Nhóm chỉ tiêu phương tiện và thuyền viên',
          children: [
            { key: '/reports/F-170', label: 'Biểu 21-6T/N: Thống kê thuyền viên, hoa tiêu hàng hải' },
            { key: '/reports/F-171', label: 'Biểu 22-6T/N: Thống kê tàu biển mang cờ quốc tịch Việt Nam' },
            { key: '/reports/F-172', label: 'Biểu 28-N: Thống kê tàu thuyền hoạt động dịch vụ lai dắt' },
          ],
        },
        {
          key: 'reports-dn',
          label: 'Nhóm chỉ tiêu về doanh nghiệp',
          children: [
            { key: '/reports/F-173', label: 'Biểu 36–N: Thống kê cơ sở đóng mới, sửa chữa, phá dỡ tàu biển' },
            { key: '/reports/F-174', label: 'Biểu 46-6T/N: Tổng hợp khối lượng hàng hóa thông qua cảng biển' },
          ],
        },
        {
          key: 'reports-tt48',
          label: 'Nhóm báo cáo thông tư 48/2017/TT-BGTVT',
          children: [
            { key: '/reports/F-175', label: 'Biểu số 06-N: Năng lực thông qua bến cảng, cầu cảng thông tư 48/2017/TT-BGTVT' },
            { key: '/reports/F-176', label: 'Biểu 07-N: Năng lực thông qua cảng biển, cảng bến thủy nội địa địa phương và doanh nghiệp quản lý' },
            { key: '/reports/F-177', label: 'Biểu 28-T: Khối lượng hàng hóa thông qua cảng' },
            { key: '/reports/F-178', label: 'Biểu 29-N: Khối lượng hàng hóa thông qua cảng' },
            { key: '/reports/F-179', label: 'Biểu 33-N: Sản lượng dịch vụ vận tải, doanh nghiệp và các hoạt động hỗ trợ vận tải đường sắt, đường thủy nội địa, đường biển' },
          ],
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
            { key: '/reports/F-189', label: 'Báo cáo tình hình hoạt động của báo hiệu hàng hải và công trình đê, kè' },
          ],
        },
        {
          key: 'reports-thtn',
          label: 'Báo cáo tổng hợp theo ngày',
          children: [
            { key: '/reports/F-180N', label: 'Biểu 12-T: Khối lượng hàng hóa, hành khách thông qua cảng biển theo ngày' },
            { key: '/reports/F-182N', label: 'Biểu 13-T: Lượt tàu thuyền vào, rời cảng biển theo ngày' },
            { key: '/reports/F-183N', label: 'Biểu 14-T: Khối lượng hàng hóa, hành khách, lượt tàu thông qua cảng biển bằng đội tàu Việt Nam theo ngày' },
            { key: '/reports/F-184N', label: 'Biểu 15-T: Khối lượng hàng hóa, hành khách thông qua qua cảng biển, bến cảng, khu chuyển tải trong khu vực quản lý theo ngày' },
          ],
        },
      ] : [],
    },
    {
      key: 'group-users',
      icon: <UserOutlined />,
      label: 'V. QUẢN LÝ NGƯỜI DÙNG',
      children: [
        canAccessMenu('/organizations') ? { key: '/organizations', label: 'Quản lý đơn vị' } : null,
        canAccessMenu('/groups') ? { key: '/groups', label: 'Quản lý nhóm người dùng' } : null,
        canAccessMenu('/users') ? { key: '/users', label: 'Quản lý người dùng' } : null,
        canAccessMenu('/logs') ? { key: '/logs', label: 'Quản lý log truy cập' } : null,
      ].filter(Boolean),
    },
    {
      key: 'group-planning',
      icon: <CompassOutlined />,
      label: 'VI. QUẢN LÝ QUY HOẠCH & VẬN HÀNH',
      children: [
        { key: 'planning-placeholder', label: 'Quản lý quy hoạch', disabled: true, title: 'Chưa triển khai' },
        { key: 'operation-placeholder', label: 'Quản lý thông tin vận hành khai thác', disabled: true, title: 'Chưa triển khai' },
        { key: 'maintenance-placeholder', label: 'Quản lý thông tin bảo trì', disabled: true, title: 'Chưa triển khai' },
        canAccessMenu('/documents/incidents') ? { key: '/documents/incidents', label: 'Quản lý thông tin sự cố' } : null,
        canAccessMenu('/gis/map') ? { key: '/gis/map', label: 'Quản lý thông tin KCHT hàng hải trên bản đồ' } : null,
        canAccessMenu('/symbols') ? { key: '/symbols', label: 'Quản lý biểu tượng trên bản đồ' } : null,
        canAccessMenu('/gis/points') ? { key: '/gis/points', label: 'Quản lý danh mục đối tượng điểm' } : null,
        canAccessMenu('/gis/lines') ? { key: '/gis/lines', label: 'Quản lý danh mục đối tượng đường' } : null,
        canAccessMenu('/gis/polygons') ? { key: '/gis/polygons', label: 'Quản lý danh mục đối tượng vùng' } : null,
        canAccessMenu('/documents/legal') ? { key: '/documents/legal', label: 'Quản lý văn bản pháp lý' } : null,
        { key: 'records-placeholder', label: 'Quản lý hồ sơ', disabled: true, title: 'Chưa triển khai' },
      ].filter(Boolean),
    },
    {
      key: 'group-integration',
      icon: <ApiOutlined />,
      label: 'VII. TÍCH HỢP',
      children: [
        canAccessMenu('/connections') ? { key: '/connections', label: 'Quản lý kết nối liên thông chia sẻ dữ liệu' } : null,
        canAccessMenu('/interconnect') ? { key: '/interconnect', label: 'Quản lý kết nối liên thông' } : null,
        { key: 'chart-integration-placeholder', label: 'Tích hợp các mảnh hải đồ điện tử', disabled: true, title: 'Chưa triển khai' },
        { key: 'planning-map-integration-placeholder', label: 'Tích hợp bản đồ quy hoạch cảng biển', disabled: true, title: 'Chưa triển khai' },
      ].filter(Boolean),
    },
    { type: 'divider' as const },
    canAccessMenu('/settings') ? { key: '/settings', icon: <SettingOutlined />, label: 'Cấu hình hệ thống' } : null,
    canAccessMenu('/water-zone') ? { key: '/water-zone', label: 'Quản lý vùng nước' } : null,
  ].filter(Boolean) as MenuProps['items'];

  const filterEmptyChildren = (items: MenuProps['items']): MenuProps['items'] => {
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
  };

  const menuItems = filterEmptyChildren(rawMenuItems);

  const isMobile = !screens.md;

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
          <Typography.Title level={5} style={{ margin: 0, color: '#12468C', textAlign: 'center', fontWeight: 600, fontSize: '15px' }}>
            HỆ THỐNG THÔNG TIN QUẢN LÝ KẾT CẤU HẠ TẦNG GIAO THÔNG HÀNG HẢI
          </Typography.Title>
        )}
      </div>

      {/* Ô tìm kiếm — pill trong mờ, ngay dưới header */}
      {!collapsed && !isMenuFullScreen && (
        <div className="sidebar-search">
          <SearchOutlined />
          <input placeholder="Tìm kiếm" />
        </div>
      )}

      <div className="sidebar-menu-scroll">
        <Menu
          theme={isMenuFullScreen ? 'light' : 'dark'}
          mode="inline"
          inlineCollapsed={collapsed}
          selectedKeys={[selectedKey]}
          openKeys={openKeys}
          onOpenChange={setOpenKeys}
          items={menuItems}
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
        .submenu-active.ant-menu-submenu > .ant-menu-submenu-title {
          color: #fff !important;
          background: rgba(255, 255, 255, 0.1) !important;
        }
      `}</style>
      <Layout style={{ height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Desktop Sidebar */}
      {!isMobile && !sidebarHidden && (
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
            background: isMenuFullScreen ? '#fff' : 'var(--bg-sidebar, #1E2129)',
          }}
          breakpoint="lg"
        >
          {sidebarContent}
        </Sider>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          placement="left"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          styles={{ body: { padding: 0, background: 'var(--bg-sidebar, #1E2129)' }, wrapper: { width: 260 } }}
        >
          {sidebarContent}
        </Drawer>
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
            <Typography.Title level={5} style={{ margin: 0, color: '#12468C' }}>
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
                    style={{ backgroundColor: token.colorPrimary }}
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
          {location.pathname === '/' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: spaceLg,
                marginBottom: spaceLg,
              }}
            >
              {DASHBOARD_BLOCKS.map((block) => (
                <div
                  key={block.target}
                  role="button"
                  tabIndex={0}
                  aria-label={block.label}
                  onClick={() => {
                    navigate(block.target);
                    if (isMobile) setMobileDrawerOpen(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(block.target);
                      if (isMobile) setMobileDrawerOpen(false);
                    }
                  }}
                  onMouseEnter={() => setHoveredBlock(block.target)}
                  onMouseLeave={() => setHoveredBlock(null)}
                  style={{
                    ...cardStyle,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: spaceMd,
                    boxShadow: hoveredBlock === block.target ? shadowMd : shadowSm,
                  }}
                >
                  <span style={{ fontSize: fontSizeXl, color: textPrimary, display: 'inline-flex' }}>{block.icon}</span>
                  <span style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: textPrimary }}>{block.label}</span>
                </div>
              ))}
            </div>
          )}
          <Outlet />
        </Content>
      </Layout>
    </Layout>
    </>
  );
}

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
  MenuOutlined,
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  SettingOutlined,
  DownOutlined,
  CompassOutlined,
  BarChartOutlined,
  ApiOutlined,
  ContainerOutlined,
  LeftOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { usePermissionStore } from '../store/permissionStore';
import { layout } from '../theme';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const MENU_PERMISSION_MAP: Record<string, string> = {
  '/users': 'user:manage',
  '/organizations': 'orgunit:manage',
  '/groups': 'group:manage',
  '/roles': 'role:manage',
  '/gis/points': 'data:read',
  '/gis/lines': 'data:read',
  '/gis/polygons': 'data:read',
  '/gis/layers': 'map:manage',
  '/gis/search': 'data:read',
  '/gis/map': 'data:read',
  '/gis/permits': 'data:read',
  '/beacons': 'data:read',
  '/buoys': 'data:read',
  '/history': 'data:read',
  '/cangbien': 'cangbien:read',
  '/bencang': 'bencang:read',
  '/caucang': 'caucang:read',
  '/cangcan': 'cangcan:read',
  '/vungnuoc': 'vungnuoc:read',
  '/luong-hang-hai': 'luonghanghai:read',
  '/de-ke': 'deke:read',
  '/co-so-sua-chua': 'cosuachua:read',
  '/tram-radar': 'tramradar:read',
  '/he-thong-vts': 'vts:read',
  '/connections': 'connection:read',
  '/reports': 'report:read',
  '/settings': 'admin:manage',
  '/logs': 'log:manage',
  '/symbols': 'data:read',
};

const canAccessMenu = (path: string): boolean => {
  const required = MENU_PERMISSION_MAP[path];
  if (!required) return true;
  return usePermissionStore.getState().hasPermission(required);
};

const pageTitles: Record<string, string> = {
  '/': 'HỆ THỐNG THÔNG TIN QUẢN LÝ KẾT CẤU HẠ TẦNG GIAO THÔNG HÀNG HẢI',
  '/users': 'Quản lý người dùng',
  '/organizations': 'Quản lý đơn vị',
  '/groups': 'Quản lý nhóm',
  '/roles': 'Phân quyền',
  '/gis/points': 'Đối tượng điểm',
  '/gis/lines': 'Đối tượng đường',
  '/gis/polygons': 'Đối tượng vùng',
  '/gis/layers': 'Lớp bản đồ',
  '/gis/search': 'Tra cứu GIS',
  '/gis/map': 'Bản đồ Hải đồ (S-57/S-63)',
  '/gis/permits': 'Giấy phép S-63',
  '/beacons': 'Đèn biển',
  '/buoys': 'Phao tiêu',
  '/nhatram/den': 'Nhà trạm đèn biển',
  '/nhatram/phao': 'Nhà trạm phao tiêu',
  '/history': 'Lịch sử thay đổi',
  '/cangbien': 'Cảng biển',
  '/bencang': 'Bến cảng',
  '/caucang': 'Cầu cảng',
  '/cangcan': 'Cảng cạn',
  '/vungnuoc': 'Vùng nước',
  '/luong-hang-hai': 'Luồng hàng hải',
  '/de-ke': 'Đê/Kè',
  '/co-so-sua-chua': 'Cơ sở sửa chữa & đóng tàu',
  '/tram-radar': 'Trạm Radar',
  '/he-thong-vts': 'Hệ thống VTS',
  '/connections': 'Liên thông dữ liệu',
  '/reports': 'Báo cáo & Thống kê',
  '/settings': 'Cấu hình hệ thống',
  '/logs': 'Nhật ký hệ thống',
  '/symbols': 'Biểu tượng bản đồ',
  '/vanban/phaply': 'Văn bản pháp lý',
  '/vanban/suco': 'Sự cố hàng hải',
  '/vanban/quyhoach': 'Quy hoạch bến cảng',
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
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const screens = useBreakpoint();
  const { token } = theme.useToken();

  // Match top-level section: extract first two path segments for GIS submenus
  const pathSegments = location.pathname.split('/').filter(Boolean);
  let selectedKey: string;
  if (pathSegments.length === 0) {
    selectedKey = '/';
  } else if (pathSegments[0] === 'gis') {
    // For GIS, select the deepest valid key: /gis/points, /gis/lines, etc.
    const deepKey = `/${pathSegments[0]}/${pathSegments[1]}`;
    selectedKey = deepKey;
  } else if (pathSegments[0] === 'nhatram' || pathSegments[0] === 'vanban' || pathSegments[0] === 'station' || pathSegments[0] === 'asset') {
    const deepKey = `/${pathSegments[0]}/${pathSegments[1]}`;
    selectedKey = deepKey;
  } else if (pathSegments[0] === 'cangbien' || pathSegments[0] === 'bencang' || pathSegments[0] === 'caucang' || pathSegments[0] === 'cangcan' || pathSegments[0] === 'vungnuoc') {
    selectedKey = '/' + pathSegments[0];
  } else if (pathSegments[0] === 'luong-hang-hai' || pathSegments[0] === 'de-ke' || pathSegments[0] === 'co-so-sua-chua' || pathSegments[0] === 'tram-radar' || pathSegments[0] === 'he-thong-vts') {
    selectedKey = '/' + pathSegments[0];
  } else if (pathSegments[0] === 'reports') {
    selectedKey = location.pathname;
  } else {
    selectedKey = '/' + pathSegments[0];
  }

  useEffect(() => {
    if (selectedKey) {
      if (selectedKey.startsWith('/nhatram') || selectedKey === '/beacons' || selectedKey === '/buoys' || selectedKey === '/history') {
        setOpenKeys(['beacon']);
      } else if (selectedKey.startsWith('/gis')) {
        setOpenKeys(['gis']);
      } else if (['/cangbien', '/bencang', '/caucang', '/cangcan', '/vungnuoc'].includes(selectedKey)) {
        setOpenKeys(['cangben']);
      } else if (selectedKey.startsWith('/asset')) {
        setOpenKeys(['asset-movement']);
      } else if (selectedKey.startsWith('/vanban')) {
        setOpenKeys(['vanban-suco']);
      } else if (['/luong-hang-hai', '/de-ke', '/co-so-sua-chua', '/tram-radar', '/he-thong-vts'].includes(selectedKey)) {
        setOpenKeys(['khu-nuoc-vts']);
      } else if (selectedKey.startsWith('/station')) {
        setOpenKeys(['stations']);
      } else if (selectedKey.startsWith('/reports')) {
        setOpenKeys(['reports-parent', 'reports-chung', 'reports-kcht']);
      } else if (['/users', '/organizations', '/groups', '/roles'].includes(selectedKey)) {
        setOpenKeys(['system-admin']);
      }
    }
  }, [selectedKey]);

  const menuItems: MenuProps['items'] = [
    { key: '/', icon: <DashboardOutlined />, label: 'Trang chủ' },
    { type: 'divider' as const },
    {
      key: 'system-admin',
      icon: <SettingOutlined />,
      label: 'Quản trị hệ thống',
      children: [
        canAccessMenu('/users') ? { key: '/users', label: 'Quản lý người dùng' } : null,
        canAccessMenu('/organizations') ? { key: '/organizations', label: 'Quản lý đơn vị' } : null,
        canAccessMenu('/groups') ? { key: '/groups', label: 'Quản lý nhóm' } : null,
        canAccessMenu('/roles') ? { key: '/roles', label: 'Phân quyền' } : null,
      ].filter(Boolean),
    },
    { type: 'divider' as const },
    {
      key: 'gis',
      icon: <CompassOutlined />,
      label: 'GIS • Bản đồ',
      children: [
        canAccessMenu('/gis/points') ? { key: '/gis/points', label: 'Đối tượng điểm' } : null,
        canAccessMenu('/gis/lines') ? { key: '/gis/lines', label: 'Đối tượng đường' } : null,
        canAccessMenu('/gis/polygons') ? { key: '/gis/polygons', label: 'Đối tượng vùng' } : null,
        canAccessMenu('/gis/layers') ? { key: '/gis/layers', label: 'Lớp bản đồ' } : null,
        canAccessMenu('/gis/search') ? { key: '/gis/search', label: 'Tra cứu GIS' } : null,
        canAccessMenu('/gis/map') ? { key: '/gis/map', label: 'Bản đồ Hải đồ (S-57/S-63)' } : null,
        canAccessMenu('/gis/permits') ? { key: '/gis/permits', label: 'Giấy phép S-63' } : null,
      ].filter(Boolean),
    },
    { type: 'divider' as const },
    {
      key: 'beacon',
      icon: <SettingOutlined />,
      label: 'Báo hiệu hàng hải',
      children: [
        canAccessMenu('/beacons') ? { key: '/beacons', label: 'Đèn biển' } : null,
        canAccessMenu('/buoys') ? { key: '/buoys', label: 'Phao tiêu' } : null,
        canAccessMenu('/nhatram/den') ? { key: '/nhatram/den', label: 'Nhà trạm đèn biển' } : null,
        canAccessMenu('/nhatram/phao') ? { key: '/nhatram/phao', label: 'Nhà trạm phao tiêu' } : null,
        canAccessMenu('/history') ? { key: '/history', label: 'Lịch sử thay đổi' } : null,
      ].filter(Boolean),
    },
    { type: 'divider' as const },
    {
      key: 'cangben',
      icon: <ContainerOutlined />,
      label: 'Quản lý KCHT Hàng Hải',
      children: [
        canAccessMenu('/cangbien') ? { key: '/cangbien', label: 'Cảng biển' } : null,
        canAccessMenu('/bencang') ? { key: '/bencang', label: 'Bến cảng' } : null,
        canAccessMenu('/caucang') ? { key: '/caucang', label: 'Cầu cảng' } : null,
        canAccessMenu('/cangcan') ? { key: '/cangcan', label: 'Cảng cạn' } : null,
        canAccessMenu('/vungnuoc') ? { key: '/vungnuoc', label: 'Vùng nước' } : null,
      ].filter(Boolean),
    },
    {
      key: 'asset-movement',
      icon: <ContainerOutlined />,
      label: 'Biến động tài sản',
      children: [
        canAccessMenu('/asset/increase') ? { key: '/asset/increase', label: 'Yêu cầu tăng tài sản' } : null,
        canAccessMenu('/asset/decrease') ? { key: '/asset/decrease', label: 'Yêu cầu giảm tài sản' } : null,
        canAccessMenu('/asset/inventory') ? { key: '/asset/inventory', label: 'Kiểm kê tài sản' } : null,
        canAccessMenu('/asset/exploitation') ? { key: '/asset/exploitation', label: 'Khai thác tài sản' } : null,
      ].filter(Boolean),
    },
    {
      key: 'vanban-suco',
      icon: <ContainerOutlined />,
      label: 'Văn bản & Sự cố',
      children: [
        canAccessMenu('/vanban/phaply') ? { key: '/vanban/phaply', label: 'Văn bản pháp lý' } : null,
        canAccessMenu('/vanban/suco') ? { key: '/vanban/suco', label: 'Sự cố hàng hải' } : null,
        canAccessMenu('/vanban/quyhoach') ? { key: '/vanban/quyhoach', label: 'Quy hoạch bến cảng' } : null,
      ].filter(Boolean),
    },
    { type: 'divider' as const },
    {
      key: 'khu-nuoc-vts',
      icon: <SettingOutlined />,
      label: 'Khu nước & VTS',
      children: [
        canAccessMenu('/luong-hang-hai') ? { key: '/luong-hang-hai', label: 'Luồng hàng hải' } : null,
        canAccessMenu('/de-ke') ? { key: '/de-ke', label: 'Đê/Kè' } : null,
        canAccessMenu('/co-so-sua-chua') ? { key: '/co-so-sua-chua', label: 'Cơ sở sửa chữa & đóng tàu' } : null,
        canAccessMenu('/tram-radar') ? { key: '/tram-radar', label: 'Trạm Radar' } : null,
        canAccessMenu('/he-thong-vts') ? { key: '/he-thong-vts', label: 'Hệ thống VTS' } : null,
      ].filter(Boolean),
    },
    {
      key: 'stations',
      icon: <SettingOutlined />,
      label: 'Đài duyên hải & Vệ tinh',
      children: [
        canAccessMenu('/station/coastal') ? { key: '/station/coastal', label: 'Đài duyên hải VTS' } : null,
        canAccessMenu('/station/special') ? { key: '/station/special', label: 'Đài vệ tinh Inmarsat' } : null,
      ].filter(Boolean),
    },
    { type: 'divider' as const },
    canAccessMenu('/reports') ? {
      key: 'reports-parent',
      icon: <BarChartOutlined />,
      label: 'BÁO CÁO THỐNG KÊ',
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
            { key: '/reports/F-151', label: <span style={{ color: 'red' }}>Biểu 04-N: Thống kê luồng hàng hải</span> },
            { key: '/reports/F-152', label: <span style={{ color: 'red' }}>Biểu 06-N: Thống kê vùng đón trả hoa tiêu, vùng quay trở tàu, ga tránh tàu, khu neo tránh trú bão</span> },
            { key: '/reports/F-153', label: <span style={{ color: 'red' }}>Biểu 05-N: Thống kê khu chuyển tải, khu neo đậu</span> },
            { key: '/reports/F-154', label: <span style={{ color: 'red' }}>Biểu 07-N: Thống kê bến phao, khu neo đậu</span> },
            { key: '/reports/F-155', label: <span style={{ color: 'red' }}>Biểu 08-N: Thống kê hệ thống đèn biển</span> },
            { key: '/reports/F-156', label: <span style={{ color: 'red' }}>Biểu 09-6T/N: Thống kê về hệ thống phao tiêu, báo hiệu trên luồng</span> },
            { key: '/reports/F-157', label: <span style={{ color: 'red' }}>Biểu 10-6T/N: Thống kê phao tiêu, báo hiệu trên luồng</span> },
            { key: '/reports/F-158', label: 'Biểu 11-N: Thống kê về hệ thống giám sát và điều phối giao thông hàng hải (VTS)' },
            { key: '/reports/F-159', label: <span style={{ color: 'red' }}>Biểu 12-N: Hệ thống các đài thông tin duyên hải</span> },
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
    canAccessMenu('/connections') ? { key: '/connections', icon: <ApiOutlined />, label: 'Liên thông dữ liệu' } : null,
    { type: 'divider' as const },
    canAccessMenu('/symbols') ? { key: '/symbols', icon: <CompassOutlined />, label: 'Biểu tượng bản đồ' } : null,
    canAccessMenu('/settings') ? { key: '/settings', icon: <SettingOutlined />, label: 'Cấu hình hệ thống' } : null,
    canAccessMenu('/logs') ? { key: '/logs', icon: <DashboardOutlined />, label: 'Nhật ký hệ thống' } : null,
  ].filter(Boolean) as MenuProps['items'];

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
      <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', cursor: 'pointer' }}>
        <div className="sidebar-header__logo-box" onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/images/logo-vinamarine.png" alt="Logo" style={{ maxHeight: '35px' }} />
        </div>
        {!collapsed && (
          <Button
            type="text"
            icon={<span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '14px', letterSpacing: '-1px', color: '#fff', fontWeight: 'bold' }}>|↔|</span>}
            onClick={(e) => { e.stopPropagation(); setSidebarHidden(true); }}
            style={{ padding: 0 }}
            title="Thu gọn menu"
          />
        )}
      </div>

      {/* Ô tìm kiếm — pill trong mờ, ngay dưới header */}
      {!collapsed && (
        <div className="sidebar-search">
          <SearchOutlined />
          <input placeholder="Tìm kiếm" />
        </div>
      )}

      <div className="sidebar-menu-scroll">
        <Menu
          theme="dark"
          mode="inline"
          inlineCollapsed={collapsed}
          selectedKeys={[selectedKey]}
          openKeys={openKeys}
          onOpenChange={setOpenKeys}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderInlineEnd: 'none', paddingTop: 4 }}
        />
      </div>

      {/* Footer — text + nút tròn floating */}
      <div className="sidebar-footer">
        {!collapsed && (
          <div className="sidebar-header__text">
            <span className="sidebar-footer__version">Cục Hàng Hải và Đường Thủy</span>
            <span className="sidebar-footer__version">Việt Nam</span>
          </div>
        )}
        <button
          className={`sidebar-footer__collapse-btn${collapsed ? ' sidebar-footer__collapse-btn--collapsed' : ''}`}
          onClick={() => setCollapsed(!collapsed)}
        >
          <LeftOutlined />
        </button>
      </div>
    </div>
  );

  const [searchParams] = useSearchParams();
  const hasAction = searchParams.has('action');
  const isListPage = [
    '/cangbien',
    '/bencang',
    '/caucang',
    '/cangcan',
    '/vungnuoc'
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
      <Layout style={{ minHeight: '100vh' }}>
      {/* Desktop Sidebar */}
      {!isMobile && !sidebarHidden && (
        <Sider
          collapsible
          trigger={null}
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={layout.sidebarWidth}
          collapsedWidth={layout.sidebarCollapsedWidth}
          style={{
            borderRight: '1px solid rgba(255,255,255,0.06)',
            position: 'relative',
            background: 'var(--bg-sidebar, #1E2129)',
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

      <Layout>
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
                icon={<MenuOutlined />}
                onClick={() => setMobileDrawerOpen(true)}
              />
            ) : (
              <Button
                type="text"
                icon={<MenuOutlined />}
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
              <img src="/images/logo-vinamarine.png" alt="Logo" style={{ maxHeight: '35px' }} />
            </div>
          )}

          <Space size="middle" style={{ display: 'flex', alignItems: 'center' }}>
            {sidebarHidden && (
              <Button
                type="text"
                icon={<span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '14px', letterSpacing: '-1px', fontWeight: 'bold' }}>|↔|</span>}
                onClick={() => setSidebarHidden(false)}
                title="Thu gọn menu"
                style={{ padding: '4px 8px' }}
              />
            )}
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
          style={{
            padding: location.pathname === '/gis/map' ? 0 : 24,
            minHeight: 'calc(100vh - 64px)',
            height: location.pathname === '/gis/map' ? 'calc(100vh - 64px)' : undefined,
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

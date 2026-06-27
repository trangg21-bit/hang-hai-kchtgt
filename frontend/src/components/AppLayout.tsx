import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
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
  Badge,
} from 'antd';
import {
  MenuOutlined,
  UserOutlined,
  TeamOutlined,
  LogoutOutlined,
  DashboardOutlined,
  SettingOutlined,
  SafetyOutlined,
  DownOutlined,
  CompassOutlined,
  IdcardOutlined,
  BarChartOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { usePermissionStore } from '../store/permissionStore';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const MENU_PERMISSION_MAP: Record<string, string> = {
  '/users': 'user:manage',
  '/organizations': 'orgunit:manage',
  '/groups': 'group:manage',
  '/admins': 'admin:manage',
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
  '/connections': 'connection:read',
  '/reports': 'report:read',
  '/settings': 'admin:manage',
  '/logs': 'log:manage',
};

const canAccessMenu = (path: string): boolean => {
  const required = MENU_PERMISSION_MAP[path];
  if (!required) return true;
  return usePermissionStore.getState().hasPermission(required);
};

const pageTitles: Record<string, string> = {
  '/users': 'Quản lý người dùng',
  '/organizations': 'Quản lý đơn vị',
  '/groups': 'Quản lý nhóm',
  '/admins': 'Quản trị viên',
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
  '/history': 'Lịch sử thay đổi',
  '/connections': 'Liên thông dữ liệu',
  '/reports': 'Báo cáo & Thống kê',
  '/settings': 'Cấu hình hệ thống',
  '/logs': 'Nhật ký hệ thống',
};

export default function AppLayout() {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const screens = useBreakpoint();
  const { token } = theme.useToken();

  const menuItems: MenuProps['items'] = [
    canAccessMenu('/users') ? { key: '/users', icon: <UserOutlined />, label: 'Quản lý người dùng' } : null,
    canAccessMenu('/organizations') ? { key: '/organizations', icon: <TeamOutlined />, label: 'Quản lý đơn vị' } : null,
    canAccessMenu('/groups') ? { key: '/groups', icon: <TeamOutlined />, label: 'Quản lý nhóm' } : null,
    canAccessMenu('/admins') ? { key: '/admins', icon: <IdcardOutlined />, label: 'Quản trị viên' } : null,
    canAccessMenu('/roles') ? { key: '/roles', icon: <SafetyOutlined />, label: 'Phân quyền' } : null,
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
        canAccessMenu('/history') ? { key: '/history', label: 'Lịch sử thay đổi' } : null,
      ].filter(Boolean),
    },
    { type: 'divider' as const },
    canAccessMenu('/reports') ? { key: '/reports', icon: <BarChartOutlined />, label: 'Báo cáo & Thống kê' } : null,
    { type: 'divider' as const },
    canAccessMenu('/connections') ? { key: '/connections', icon: <ApiOutlined />, label: 'Liên thông dữ liệu' } : null,
    { type: 'divider' as const },
    canAccessMenu('/settings') ? { key: '/settings', icon: <SettingOutlined />, label: 'Cấu hình hệ thống', disabled: true } : null,
    canAccessMenu('/logs') ? { key: '/logs', icon: <DashboardOutlined />, label: 'Nhật ký hệ thống' } : null,
  ].filter(Boolean) as MenuProps['items'];

  const isMobile = !screens.md;

  const handleMenuClick = (e: { key: string }) => {
    navigate(e.key);
    if (isMobile) setMobileDrawerOpen(false);
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

  // Match top-level section: extract first two path segments for GIS submenus
  const pathSegments = location.pathname.split('/').filter(Boolean);
  let selectedKey: string;
  if (pathSegments[0] === 'gis') {
    // For GIS, select the deepest valid key: /gis/points, /gis/lines, etc.
    const deepKey = `/${pathSegments[0]}/${pathSegments[1]}`;
    selectedKey = deepKey;
  } else {
    selectedKey = '/' + pathSegments[0];
  }

  const sidebarContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo area */}
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          padding: '0 16px',
          gap: 8,
        }}
      >
        <TeamOutlined style={{ fontSize: 22, color: token.colorPrimary }} />
        {!collapsed && (
          <Typography.Text
            strong
            style={{
              fontSize: 16,
              whiteSpace: 'nowrap',
              color: token.colorPrimary,
            }}
          >
            Quản trị hệ thống
          </Typography.Text>
        )}
      </div>

      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ borderInlineEnd: 'none', flex: 1, paddingTop: 8 }}
      />
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={240}
          style={{
            background: token.colorBgContainer,
            borderRight: `1px solid ${token.colorBorderSecondary}`,
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
          styles={{ body: { padding: 0 }, wrapper: { width: 260 } }}
        >
          {sidebarContent}
        </Drawer>
      )}

      <Layout>
        {/* Header */}
        <Header
          style={{
            background: token.colorBgContainer,
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            height: 64,
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}
        >
          <Space>
            {isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setMobileDrawerOpen(true)}
              />
            )}
            <Typography.Title level={5} style={{ margin: 0 }}>
              {pageTitles[selectedKey] ?? 'Quản trị hệ thống'}
            </Typography.Title>
          </Space>

          <Dropdown
            menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
            trigger={['click']}
          >
            <Space style={{ cursor: 'pointer' }}>
              <Badge status="success" dot offset={[-2, 30]}>
                <Avatar
                  icon={<UserOutlined />}
                  style={{ backgroundColor: token.colorPrimary }}
                />
              </Badge>
              {!isMobile && (
                <>
                  <div>
                    <Typography.Text strong style={{ fontSize: 14, display: 'block' }}>
                      {user?.fullName || 'Admin'}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {user?.roleName || 'Administrator'}
                    </Typography.Text>
                  </div>
                  <DownOutlined style={{ fontSize: 10, color: token.colorTextSecondary }} />
                </>
              )}
            </Space>
          </Dropdown>
        </Header>

        {/* Content */}
        <Content
          style={{
            padding: 24,
            background: token.colorBgLayout,
            minHeight: 'calc(100vh - 64px)',
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

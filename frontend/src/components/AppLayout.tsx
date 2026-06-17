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
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const menuItems: MenuProps['items'] = [
  {
    key: '/users',
    icon: <UserOutlined />,
    label: 'Quản lý người dùng',
  },
  {
    key: '/roles',
    icon: <SafetyOutlined />,
    label: 'Phân quyền',
  },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: 'Cấu hình hệ thống',
    disabled: true,
  },
  {
    key: '/logs',
    icon: <DashboardOutlined />,
    label: 'Nhật ký hệ thống',
    disabled: true,
  },
];

const pageTitles: Record<string, string> = {
  '/users': 'Quản lý người dùng',
  '/roles': 'Phân quyền',
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

  const selectedKey = '/' + location.pathname.split('/')[1];

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
          width={260}
          styles={{ body: { padding: 0 } }}
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

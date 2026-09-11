import { useState, useEffect, useMemo } from 'react';
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
  type MenuProps,
} from 'antd';
import {
  UserOutlined,
  ArrowLeftOutlined,
  LogoutOutlined,
  DashboardOutlined,
  SettingOutlined,
  DownOutlined,
  ContainerOutlined,
  SearchOutlined,
  BankOutlined,
  SwapOutlined,
  EnvironmentOutlined,
  BarChartOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
  AuditOutlined,
  AppstoreOutlined,
  WarningOutlined,
  FileProtectOutlined,
  PictureOutlined,
  TeamOutlined,
  HistoryOutlined,
  SyncOutlined,
  ApiOutlined,
  FileTextOutlined,
  AimOutlined,
  BulbOutlined,
  DeploymentUnitOutlined,
  BlockOutlined,
  ApartmentOutlined,
  BuildOutlined,
  ToolOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { usePermissionStore } from '../store/permissionStore';
import { colors, layout } from '../theme';
import * as themeTokenChk from '../themetokenchk';
import { actionPrimary } from '../themetokenchk';
import { ThemeTokenProvider } from '../context/ThemeTokenContext';
import LogoutConfirmModal from './shared/LogoutConfirmModal';
import {
  MENU_PERMISSION_MAP,
  collectOpenableKeys,
  filterEmptyChildren,
  filterMenuByQuery,
} from './appLayoutMenu';
import {
  NAV_GROUPS,
  accessibleTree,
  firstAccessibleRoute,
  groupOfPath,
  locateRoute,
  searchNavGroups,
  type NavGroup,
  type NavNode,
} from '../config/navigation';
import { REPORT_TEMPLATES, CATEGORY_MAP } from '../config/reports';
import { CATEGORY_ICONS, REPORT_ICONS } from '../config/reportIcons';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

export { MENU_PERMISSION_MAP };

const canAccessMenu = (path: string): boolean => {
  let required = MENU_PERMISSION_MAP[path];
  if (!required && path.startsWith('/reports/')) {
    required = 'report:read';
  }
  if (!required) return true;
  
  if (Array.isArray(required)) {
    return usePermissionStore.getState().hasAnyPermission(required);
  }
  
  return usePermissionStore.getState().hasPermission(required);
};

type AntMenuItem = NonNullable<NonNullable<MenuProps['items']>[number]>;

/** M-024 v2: chuyển cây config (navigation.tsx) → AntD Menu items, lọc theo quyền */
function buildNavMenuItems(
  group: NavGroup,
  canAccess: (route: string) => boolean,
  go: (route: string) => void,
): MenuProps['items'] {
  const convert = (nodes: NavNode[]): AntMenuItem[] =>
    nodes.flatMap((n) => {
      const base = { key: n.key, icon: n.icon, label: n.label, disabled: n.disabled } as AntMenuItem;
      if (n.children) {
        const kids = convert(accessibleTree(n.children, canAccess));
        if (kids.length > 0) {
          const sub = {
            ...base,
            children: kids,
            onTitleClick: n.route && canAccess(n.route) ? () => go(n.route as string) : undefined,
          } as AntMenuItem;
          return [sub];
        }
        if (!n.route) return [] as AntMenuItem[];
      }
      return [base];
    });
  return convert(accessibleTree(group.tree, canAccess));
}

export default function AppLayout({ initialSidebarHidden }: { initialSidebarHidden?: boolean } = {}) {
  const isInIframe = window.self !== window.top;
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const collapsed = false;
  const location = useLocation();
  const activeGroup = useMemo(() => groupOfPath(location.pathname), [location.pathname]);
  const navHit = useMemo(
    () => (activeGroup ? locateRoute(activeGroup.tree, location.pathname) : undefined),
    [activeGroup, location.pathname]
  );

  const [sidebarState, setSidebarState] = useState(() => ({
    pathname: location.pathname,
    hidden: initialSidebarHidden ?? location.pathname === '/',
  }));
  const sidebarHidden = sidebarState.pathname === location.pathname
    ? sidebarState.hidden
    : initialSidebarHidden !== undefined
      ? sidebarState.hidden
      : location.pathname === '/'
        ? true
        : sidebarState.pathname === '/'
          ? false
          : sidebarState.hidden;
  const setSidebarHidden = (hidden: boolean) => {
    setSidebarState({ pathname: location.pathname, hidden });
  };
  const isMenuFullScreen = false;
  const [openKeys, setOpenKeys] = useState<string[]>(() => navHit?.openKeys ?? []);
  const [searchState, setSearchState] = useState(() => ({ pathname: location.pathname, query: '' }));
  const searchQuery = searchState.pathname === location.pathname ? searchState.query : '';
  const setSearchQuery = (query: string) => {
    setSearchState({ pathname: location.pathname, query });
  };
  // M-024 rework: chips C0..C3 — tập level đang được phép hiển thị trong cây khối kcht
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  usePermissionStore((s) => s.permissions);
  const logout = useAuthStore((s) => s.logout);
  const screens = useBreakpoint();
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

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

  const routeOpenKeys = navHit?.openKeys ?? (
    selectedKey.startsWith('/asset')
      ? ['asset-management']
      : selectedKey.startsWith('/documents')
        ? ['planning-operation']
        : selectedKey.startsWith('/gis') || selectedKey === '/symbols' || selectedKey === '/water-zone'
          ? ['gis-management']
          : selectedKey.startsWith('/reports')
            ? [
                'reports-parent',
                (() => {
                  const reportCode = selectedKey.replace('/reports/', '');
                  const report = REPORT_TEMPLATES.find((r) => r.code === reportCode);
                  return report ? `reports-${report.category}` : 'reports-bckcht';
                })(),
              ]
            : ['/users', '/organizations', '/groups', '/logs', '/history', '/interconnect', '/connections', '/settings'].includes(selectedKey)
              ? ['system-admin']
              : []
  );

  const activeSelectedKey = navHit?.key ?? selectedKey;

  // M-024 rework: khối kcht có cây 28 loại (chips C0..C3 lọc theo level node)
  const isKchtGroup = activeGroup?.id === 'kcht';

  const rawMenuItems: MenuProps['items'] = [
    { key: '/', icon: <DashboardOutlined />, label: 'Danh mục chức năng' },
    { type: 'divider' as const },
    // Nhóm 1 — Quản lý KCHT hàng hải: lá dẫn tới trang Danh mục 28 loại KCHT
    { key: '/port', icon: <ContainerOutlined />, label: 'Quản lý KCHT hàng hải' },
    { type: 'divider' as const },
    // Nhóm 2 — Quản lý tài sản KCHT hàng hải
    {
      key: 'asset-management',
      icon: <BankOutlined />,
      label: 'Quản lý tài sản KCHT hàng hải',
      children: [
        canAccessMenu('/asset/berth') ? { key: '/asset/berth', icon: <BankOutlined />, label: 'Tài sản bến cảng' } : null,
        canAccessMenu('/asset/transfer-area') ? { key: '/asset/transfer-area', icon: <SwapOutlined />, label: 'Tài sản khu chuyển tải' } : null,
        canAccessMenu('/asset/storm-shelter') ? { key: '/asset/storm-shelter', icon: <SafetyCertificateOutlined />, label: 'Tài sản khu tránh, trú bão' } : null,
        canAccessMenu('/asset/anchorage') ? { key: '/asset/anchorage', icon: <EnvironmentOutlined />, label: 'Tài sản khu neo đậu' } : null,
        canAccessMenu('/asset/lighthouse') ? { key: '/asset/lighthouse', icon: <BulbOutlined />, label: 'Tài sản đèn biển và nhà trạm gắn liền đèn biển' } : null,
        canAccessMenu('/asset/dike-revetment') ? { key: '/asset/dike-revetment', icon: <BlockOutlined />, label: 'Tài sản đê/kè' } : null,
        canAccessMenu('/asset/buoy') ? { key: '/asset/buoy', icon: <AimOutlined />, label: 'Tài sản phao, tiêu và nhà trạm' } : null,
        canAccessMenu('/asset/channel') ? { key: '/asset/channel', icon: <DeploymentUnitOutlined />, label: 'Tài sản luồng hàng hải' } : null,
        canAccessMenu('/asset/increase') ? { key: '/asset/increase', icon: <PlusCircleOutlined />, label: 'Yêu cầu tăng tài sản' } : null,
        canAccessMenu('/asset/decrease') ? { key: '/asset/decrease', icon: <MinusCircleOutlined />, label: 'Yêu cầu giảm tài sản' } : null,
        canAccessMenu('/asset/inventory') ? { key: '/asset/inventory', icon: <AuditOutlined />, label: 'Kiểm kê tài sản' } : null,
        canAccessMenu('/asset/exploitation') ? { key: '/asset/exploitation', icon: <AppstoreOutlined />, label: 'Khai thác tài sản' } : null,
      ].filter(Boolean),
    },
    { type: 'divider' as const },
    // Nhóm 3 — Quản lý quy hoạch & vận hành
    {
      key: 'planning-operation',
      icon: <FileProtectOutlined />,
      label: 'Quản lý quy hoạch & vận hành',
      children: [
        canAccessMenu('/documents/port-planning') ? { key: '/documents/port-planning', icon: <BuildOutlined />, label: 'Quy hoạch bến cảng' } : null,
        canAccessMenu('/documents/incidents') ? { key: '/documents/incidents', icon: <WarningOutlined />, label: 'Sự cố hàng hải' } : null,
        canAccessMenu('/documents/legal') ? { key: '/documents/legal', icon: <FileProtectOutlined />, label: 'Văn bản pháp lý' } : null,
        canAccessMenu('/documents/operation') ? { key: '/documents/operation', icon: <DashboardOutlined />, label: 'Thông tin vận hành' } : null,
        canAccessMenu('/documents/maintenance') ? { key: '/documents/maintenance', icon: <ToolOutlined />, label: 'Thông tin bảo trì' } : null,
      ].filter(Boolean),
    },
    { type: 'divider' as const },
    // Nhóm 4 — Quản lý KCHT trên nền bản đồ (GIS)
    {
      key: 'gis-management',
      icon: <EnvironmentOutlined />,
      label: 'Quản lý KCHT trên nền bản đồ (GIS)',
      children: [
        canAccessMenu('/gis/map') ? { key: '/gis/map', icon: <EnvironmentOutlined />, label: 'Quản lý thông tin KCHT hàng hải trên bản đồ' } : null,
        canAccessMenu('/gis/points') ? { key: '/gis/points', icon: <AimOutlined />, label: 'Quản lý danh mục đối tượng điểm' } : null,
        canAccessMenu('/gis/lines') ? { key: '/gis/lines', icon: <DeploymentUnitOutlined />, label: 'Quản lý danh mục đối tượng đường' } : null,
        canAccessMenu('/gis/polygons') ? { key: '/gis/polygons', icon: <BlockOutlined />, label: 'Quản lý danh mục đối tượng vùng' } : null,
        canAccessMenu('/gis/layers') ? { key: '/gis/layers', icon: <ApartmentOutlined />, label: 'Quản lý lớp bản đồ' } : null,
        canAccessMenu('/symbols') ? { key: '/symbols', icon: <PictureOutlined />, label: 'Quản lý biểu tượng trên bản đồ' } : null,
      ].filter(Boolean),
    },
    { type: 'divider' as const },
    // Nhóm 5 — Báo cáo thống kê
    canAccessMenu('/reports') ? {
      key: 'reports-parent',
      icon: <BarChartOutlined />,
      label: 'Báo cáo thống kê',
      children: [
        ...Object.entries(CATEGORY_MAP).map(([catKey, catInfo]) => {
          const isEnabled = catKey === 'bckcht' || catKey === 'bcdl';
          return {
            key: `reports-${catKey}`,
            label: catInfo.label,
            icon: CATEGORY_ICONS[catKey],
            disabled: !isEnabled,
            children: REPORT_TEMPLATES
              .filter((r) => r.category === catKey)
              .map((r) => ({
                key: `/reports/${r.code}`,
                label: `${r.code} - ${r.name}`,
                icon: REPORT_ICONS[r.code],
                disabled: !isEnabled || r.status !== 'active',
              })),
          };
        }),
      ],
    } : null,
    { type: 'divider' as const },
    // Nhóm 6 — Quản trị hệ thống
    {
      key: 'system-admin',
      icon: <SettingOutlined />,
      label: 'Quản trị hệ thống',
      children: [
        canAccessMenu('/users') ? { key: '/users', icon: <UserOutlined />, label: 'Quản lý tài khoản người dùng' } : null,
        canAccessMenu('/organizations') ? { key: '/organizations', icon: <BankOutlined />, label: 'Quản lý đơn vị' } : null,
        canAccessMenu('/groups') ? { key: '/groups', icon: <TeamOutlined />, label: 'Quản lý nhóm' } : null,
        canAccessMenu('/logs') ? { key: '/logs', icon: <FileTextOutlined />, label: 'Quản lý log truy cập' } : null,
        canAccessMenu('/history') ? { key: '/history', icon: <HistoryOutlined />, label: 'Lịch sử thay đổi' } : null,
        canAccessMenu('/interconnect') ? { key: '/interconnect', icon: <ApiOutlined />, label: 'Quản lý kết nối liên thông' } : null,
        canAccessMenu('/connections') ? { key: '/connections', icon: <SyncOutlined />, label: 'Liên thông dữ liệu' } : null,
        canAccessMenu('/settings') ? { key: '/settings', icon: <SettingOutlined />, label: 'Cấu hình hệ thống' } : null,
      ].filter(Boolean),
    },
  ].filter(Boolean) as MenuProps['items'];

  const activeTreeForMenu = activeGroup ? activeGroup.tree : undefined;
  const menuItems = filterEmptyChildren(
    activeGroup && activeTreeForMenu
      ? buildNavMenuItems({ ...activeGroup, tree: activeTreeForMenu }, canAccessMenu, navigate)
      : rawMenuItems,
  );

  const trimmedSearchQuery = searchQuery.trim();
  const isSearching = trimmedSearchQuery.length > 0;

  // ===== Landing search (R-1..R-7, M-024): chỉ active ở '/'; trong một khối,
  // search chỉ lọc menu sidebar như cũ (hành vi M-025/M-028 không đổi) =====
  const isLandingRoute = location.pathname === '/';
  const landingHits =
    isLandingRoute && trimmedSearchQuery.length > 0 ? searchNavGroups(trimmedSearchQuery, NAV_GROUPS) : [];
  const firstLandingTarget = (() => {
    for (const group of landingHits) {
      const home = firstAccessibleRoute(group, canAccessMenu);
      if (home) return home;
    }
    return undefined;
  })();

  const displayedItems = isSearching ? filterMenuByQuery(menuItems, trimmedSearchQuery) : menuItems;
  const effectiveOpenKeys = isSearching
    ? collectOpenableKeys(displayedItems)
    : Array.from(new Set([...openKeys, ...routeOpenKeys]));

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
      setLogoutModalOpen(true);
    }
  };

  const handleConfirmLogout = async () => {
    setLogoutLoading(true);
    try {
      await logout();
      setLogoutModalOpen(false);
      navigate('/login');
    } catch {
      setLogoutModalOpen(false);
      navigate('/login');
    } finally {
      setLogoutLoading(false);
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
            placeholder={!activeGroup ? 'Tìm kiếm...' : isKchtGroup ? 'Tìm loại KCHT…' : 'Tìm kiếm trong khối...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                // R-5: ở landing, Enter → route đầu tiên truy cập được của khối khớp đầu tiên
                if (isLandingRoute && firstLandingTarget) {
                  setSearchQuery('');
                  navigate(firstLandingTarget);
                }
                // trong khối: Enter không có hành động — search chỉ lọc menu như hiện tại
              } else if (e.key === 'Escape') {
                setSearchQuery('');
              }
            }}
          />
        </div>
      )}

      <div className="sidebar-menu-scroll">
        {activeGroup ? (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 10px 6px',
                color: colors.textOnDark,
              }}
            >
              <button
                type="button"
                onClick={() => navigate('/')}
                aria-label="Về Danh mục chức năng"
                title="Về Danh mục chức năng"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: colors.textOnDark,
                  cursor: 'pointer',
                  fontSize: 14,
                  lineHeight: 1,
                  padding: '4px 6px',
                }}
              >
                <ArrowLeftOutlined />
              </button>
              <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {activeGroup.label}
                </span>
              </div>
            </div>
            <Menu
              theme={isMenuFullScreen ? 'light' : 'dark'}
              mode="inline"
              inlineCollapsed={collapsed}
              selectedKeys={[activeSelectedKey]}
              openKeys={effectiveOpenKeys}
              onOpenChange={setOpenKeys}
              items={displayedItems}
              onClick={handleMenuClick}
              inlineIndent={12}
              style={{ borderInlineEnd: 'none', paddingTop: 4 }}
            />
          </>
        ) : (
          <div
            style={{
              padding: '12px 14px',
              fontSize: 12.5,
              lineHeight: 1.6,
              color: colors.textOnDarkMuted,
            }}
          >
            Chọn một khối chức năng ở bên phải để bắt đầu. Menu điều hướng chi tiết sẽ hiện ở đây sau khi bạn chọn.
          </div>
        )}
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
    '/water-zone',
    '/anchorage',
    '/ais-system',
    '/cctv',
    '/scada',
    '/transmission',
    '/vts-assist',
    '/vts-operation-center',
    '/station/coastal'
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
            <Outlet context={{ searchQuery }} />
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
            {!sidebarHidden && (
              <Typography.Title level={5} style={{ margin: 0, color: actionPrimary }}>
                HỆ THỐNG THÔNG TIN QUẢN LÝ KẾT CẤU HẠ TẦNG GIAO THÔNG HÀNG HẢI
              </Typography.Title>
            )}
          </Space>

          {/* sidebarHidden: header rút gọn — trái CHỈ còn nút mở menu; giữa = MỘT khối
              (logo 40px + tên hệ thống 1 dòng ellipsis), click → '/'. Không bao giờ
              2 logo / 2 title cùng lúc. */}
          {sidebarHidden && (
            <div
              role="button"
              tabIndex={0}
              aria-label="Về trang chủ"
              title="Về trang chủ"
              onClick={() => navigate('/')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate('/');
                }
              }}
              style={{
                position: 'absolute',
                left: '50%',
                top: 0,
                bottom: 0,
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: themeTokenChk.spaceSm,
                cursor: 'pointer',
                maxWidth: 'calc(100% - 320px)',
              }}
            >
              <img
                src="/images/logo-vinamarine.png"
                alt="Logo Cục Hàng Hải Việt Nam"
                style={{ height: 40, width: 'auto', display: 'block', flexShrink: 0 }}
              />
              <span
                style={{
                  color: actionPrimary,
                  fontWeight: themeTokenChk.fontWeightBold,
                  fontSize: themeTokenChk.fontSizeLg,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  minWidth: 0,
                }}
              >
                HỆ THỐNG THÔNG TIN QUẢN LÝ KẾT CẤU HẠ TẦNG GIAO THÔNG HÀNG HẢI
              </span>
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
          <Outlet context={{ searchQuery }} />
        </Content>
      </Layout>
    </Layout>
    <LogoutConfirmModal
      open={logoutModalOpen}
      onCancel={() => {
        if (!logoutLoading) {
          setLogoutModalOpen(false);
        }
      }}
      onConfirm={handleConfirmLogout}
      loading={logoutLoading}
      userName={user?.fullName || user?.username || ''}
    />
    </>
  );
}

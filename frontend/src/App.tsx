import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, App as AntApp, theme } from 'antd';
import { metronicTheme } from './theme';
import viVN from 'antd/locale/vi_VN';
import { setStaticMessage, setStaticModal } from './components/ToastNotification';
import { useAuthStore } from './store/authStore';
import AppLayout from './components/AppLayout';
import { Spin } from 'antd';
const UsersPage = lazy(() => import('./pages/UsersPage'));
const PointObjectList = lazy(() => import('./pages/gis/PointObjectList'));
const PointObjectForm = lazy(() => import('./pages/gis/PointObjectForm'));
const LineObjectList = lazy(() => import('./pages/gis/LineObjectList'));
const LineObjectForm = lazy(() => import('./pages/gis/LineObjectForm'));
const PolygonObjectList = lazy(() => import('./pages/gis/PolygonObjectList'));
const PolygonObjectForm = lazy(() => import('./pages/gis/PolygonObjectForm'));
const MapLayerList = lazy(() => import('./pages/gis/MapLayerList'));
const GISSearch = lazy(() => import('./pages/gis/GISSearch'));
const GISChartView = lazy(() => import('./pages/gis/GISChartView'));
const S63PermitsPage = lazy(() => import('./pages/gis/S63PermitsPage'));
const LoginPage = lazy(() => import('./pages/Login'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ReportList = lazy(() => import('./pages/reports/ReportList'));
const ReportViewer = lazy(() => import('./pages/reports/ReportViewer'));
const Bcc157Form = lazy(() => import('./pages/reports/Bcc157Form'));
const ConnectionList = lazy(() => import('./pages/connections/ConnectionList'));
const ConnectionForm = lazy(() => import('./pages/connections/ConnectionForm'));
const ConnectionHealth = lazy(() => import('./pages/connections/ConnectionHealth'));
const UnitList = lazy(() => import('./pages/organizations/UnitList'));
const UnitForm = lazy(() => import('./pages/organizations/UnitForm'));
const UnitTree = lazy(() => import('./pages/organizations/UnitTree'));
const GroupList = lazy(() => import('./pages/groups/GroupList'));
const GroupForm = lazy(() => import('./pages/groups/GroupForm'));
const LogsPage = lazy(() => import('./pages/LogsPage'));
const InterconnectPage = lazy(() => import('./pages/InterconnectPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const BeaconStationList = lazy(() => import('./pages/beacon-stations/BeaconStationList'));
const BeaconStationForm = lazy(() => import('./pages/beacon-stations/BeaconStationForm'));
const BuoyListPage = lazy(() => import('./services/buoy/BuoyListPage'));
const BeaconHistoryList = lazy(() => import('./pages/history/BeaconHistoryList'));
const SymbolList = lazy(() => import('./pages/symbols/SymbolList'));
const HomePage = lazy(() => import('./pages/Home'));
import PermissionGuard from './components/PermissionGuard';
const PasswordResetPage = lazy(() => import('./pages/PasswordResetPage'));
const PortList = lazy(() => import('./services/port/PortListPage'));
const PortApprovePage = lazy(() => import('./services/port/PortApprovePage'));
const PortDeleteConfirm = lazy(() => import('./services/port/PortDeleteConfirm'));

const BerthList = lazy(() => import('./pages/port/BerthListPage'));

const PierListPage = lazy(() => import('./pages/port/PierListPage'));
const PierForm = lazy(() => import('./pages/port/PierForm'));

const DryPortListPage = lazy(() => import('./pages/port/DryPortListPage'));

const WaterZoneListPage = lazy(() => import('./app/waterzone/WaterZoneListPage'));

const DocumentUploadPage = lazy(() => import('./app/document/DocumentUploadPage'));

// M-003: Khu nước & VTS — Quản lý tàu bè
const NavigationChannelList = lazy(() => import('./pages/navigationchannel/NavigationChannelList'));
const NavigationChannelForm = lazy(() => import('./pages/navigationchannel/NavigationChannelForm'));
const DikeRevetmentList = lazy(() => import('./pages/dikerevetment/DikeRevetmentList'));
const DikeRevetmentForm = lazy(() => import('./pages/dikerevetment/DikeRevetmentForm'));
const ShipRepairFacilityList = lazy(() => import('./pages/shiprepair/ShipRepairFacilityList'));
const ShipRepairFacilityForm = lazy(() => import('./pages/shiprepair/ShipRepairFacilityForm'));
const RadarStationList = lazy(() => import('./pages/radarstation/RadarStationList'));
const RadarStationForm = lazy(() => import('./pages/radarstation/RadarStationForm'));
const VtsSystemList = lazy(() => import('./pages/vtssystem/VtsSystemList'));
const VtsSystemForm = lazy(() => import('./pages/vtssystem/VtsSystemForm'));

// M-005 & M-006: Biến động tài sản & Văn bản pháp lý
const AssetIncreaseList = lazy(() => import('./pages/assetmovement/AssetIncreaseList'));
const AssetDecreaseList = lazy(() => import('./pages/assetmovement/AssetDecreaseList'));
const InventoryList = lazy(() => import('./pages/assetmovement/InventoryList'));
const AssetExploitationList = lazy(() => import('./pages/assetmovement/AssetExploitationList'));
const LegalDocumentList = lazy(() => import('./pages/document/LegalDocumentList'));
const IncidentList = lazy(() => import('./pages/document/IncidentList'));
const PortPlanningList = lazy(() => import('./pages/document/PortPlanningList'));

// M-014: Quản lý Nhà trạm phao tiêu
// M-015: Đài duyên hải
const BuoyStationListPage = lazy(() => import('./services/buoy-station/BuoyStationListPage'));

const CoastalStationList = lazy(() => import('./pages/station/CoastalStationList'));
const SpecialStationList = lazy(() => import('./pages/station/SpecialStationList'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
    },
    mutations: {
      retry: 0,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={viVN}
        theme={{
          algorithm: theme.defaultAlgorithm,
          ...metronicTheme,
        }}
      >
        <AntApp>
          <BrowserRouter>
            <Suspense fallback={
              <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                <Spin size="large" />
              </div>
            }>
              <Routes>
              {/* Login & Registration — outside layout */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<PasswordResetPage mode="forgot" />} />
              <Route path="/reset-password/:token" element={<PasswordResetPage mode="reset" />} />

              {/* Protected routes — inside layout */}
              <Route element={<AppLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/users" element={<PermissionGuard permission="user:read"><UsersPage /></PermissionGuard>} />

                {/* Organization — Đơn vị */}
                <Route path="/organizations" element={<PermissionGuard permission="orgunit:read"><UnitList /></PermissionGuard>} />
                <Route path="/organizations/create" element={<PermissionGuard permission="orgunit:manage"><UnitForm /></PermissionGuard>} />
                <Route path="/organizations/:id/edit" element={<PermissionGuard permission="orgunit:manage"><UnitForm /></PermissionGuard>} />
                <Route path="/organizations/tree/:id" element={<PermissionGuard permission="orgunit:manage"><UnitTree /></PermissionGuard>} />

                {/* Groups — Nhóm */}
                <Route path="/groups" element={<PermissionGuard permission="group:read"><GroupList /></PermissionGuard>} />
                <Route path="/groups/create" element={<PermissionGuard permission="group:create"><GroupForm /></PermissionGuard>} />
                <Route path="/groups/:id/edit" element={<PermissionGuard permission="group:edit"><GroupForm /></PermissionGuard>} />

                {/* GIS - Bản đồ */}
                <Route path="/gis/points" element={<PermissionGuard permission="data:read"><PointObjectList /></PermissionGuard>} />
                <Route path="/gis/points/create" element={<PermissionGuard permission="data:create"><PointObjectForm /></PermissionGuard>} />
                <Route path="/gis/points/:id/edit" element={<PermissionGuard permission="data:update"><PointObjectForm /></PermissionGuard>} />
                <Route path="/gis/points/:id" element={<PermissionGuard permission="data:read"><PointObjectForm /></PermissionGuard>} />

                <Route path="/gis/lines" element={<PermissionGuard permission="data:read"><LineObjectList /></PermissionGuard>} />
                <Route path="/gis/lines/create" element={<PermissionGuard permission="data:create"><LineObjectForm /></PermissionGuard>} />
                <Route path="/gis/lines/:id/edit" element={<PermissionGuard permission="data:update"><LineObjectForm /></PermissionGuard>} />
                <Route path="/gis/lines/:id" element={<PermissionGuard permission="data:read"><LineObjectForm /></PermissionGuard>} />

                <Route path="/gis/polygons" element={<PermissionGuard permission="data:read"><PolygonObjectList /></PermissionGuard>} />
                <Route path="/gis/polygons/create" element={<PermissionGuard permission="data:create"><PolygonObjectForm /></PermissionGuard>} />
                <Route path="/gis/polygons/:id/edit" element={<PermissionGuard permission="data:update"><PolygonObjectForm /></PermissionGuard>} />
                <Route path="/gis/polygons/:id" element={<PermissionGuard permission="data:read"><PolygonObjectForm /></PermissionGuard>} />

                <Route path="/gis/layers" element={<PermissionGuard permission="map:manage"><MapLayerList /></PermissionGuard>} />

                <Route path="/gis/search" element={<PermissionGuard permission="data:read"><GISSearch /></PermissionGuard>} />
                <Route path="/gis/map" element={<PermissionGuard permission="data:read"><GISChartView /></PermissionGuard>} />
                <Route path="/gis/permits" element={<PermissionGuard permission="data:read"><S63PermitsPage /></PermissionGuard>} />

                {/* Connections — Liên thông & tích hợp dữ liệu */}
                <Route path="/connections" element={<PermissionGuard permission="connection:read"><ConnectionList /></PermissionGuard>} />
                <Route path="/connections/create" element={<PermissionGuard permission="connection:manage"><ConnectionForm /></PermissionGuard>} />
                <Route path="/connections/:id/edit" element={<PermissionGuard permission="connection:manage"><ConnectionForm /></PermissionGuard>} />
                <Route path="/connections/:id/health" element={<PermissionGuard permission="connection:read"><ConnectionHealth /></PermissionGuard>} />

                {/* F-004: Quản lý kết nối liên thông chia sẻ dữ liệu */}
                <Route path="/interconnect" element={<PermissionGuard permission="connection:read"><InterconnectPage /></PermissionGuard>} />

                {/* Reports & Statistics */}
                <Route path="/reports" element={<PermissionGuard permission="report:read"><ReportList /></PermissionGuard>} />
                <Route path="/reports/:code" element={<PermissionGuard permission="report:read"><ReportViewer /></PermissionGuard>} />
                <Route path="/reports/F-142/create" element={<PermissionGuard permission="report:create"><Bcc157Form /></PermissionGuard>} />

                {/* Beacon Stations & Buoys — Báo hiệu hàng hải */}
                <Route path="/beacon-stations" element={<PermissionGuard permission="beaconstation:read"><BeaconStationList /></PermissionGuard>} />
                <Route path="/beacon-stations/create" element={<PermissionGuard permission="beaconstation:create"><BeaconStationForm /></PermissionGuard>} />
                <Route path="/beacon-stations/:id" element={<PermissionGuard permission="beaconstation:read"><BeaconStationForm /></PermissionGuard>} />
                <Route path="/buoys" element={<PermissionGuard permission="buoy:read"><BuoyListPage /></PermissionGuard>} />
                <Route path="/history" element={<PermissionGuard permission="data:read"><BeaconHistoryList /></PermissionGuard>} />

                {/* M-002: Tài sản KCHTGT - Cảng & Bến */}
                <Route path="/port" element={<PermissionGuard permission="port:read"><PortList /></PermissionGuard>} />
                <Route path="/port/:id/approve" element={<PermissionGuard permission="port:approve"><PortApprovePage /></PermissionGuard>} />
                <Route path="/port/:id/delete" element={<PermissionGuard permission="port:delete"><PortDeleteConfirm /></PermissionGuard>} />

                <Route path="/berth" element={<PermissionGuard permission="berth:read"><BerthList /></PermissionGuard>} />

                <Route path="/pier" element={<PermissionGuard permission="pier:read"><PierListPage /></PermissionGuard>} />
                <Route path="/pier/create" element={<PermissionGuard permission="pier:create"><><PierListPage /><PierForm /></></PermissionGuard>} />
                <Route path="/pier/:id/edit" element={<PermissionGuard permission="pier:update"><><PierListPage /><PierForm /></></PermissionGuard>} />

                <Route path="/dry-port" element={<PermissionGuard permission="dryport:read"><DryPortListPage /></PermissionGuard>} />

                <Route path="/water-zone" element={<PermissionGuard permission="waterzone:read"><WaterZoneListPage /></PermissionGuard>} />

                <Route path="/document/upload/:entityType/:entityId" element={<PermissionGuard permission="document:create"><DocumentUploadPage /></PermissionGuard>} />

                {/* M-003: Khu nước & VTS — Quản lý tàu bè */}

                {/* Luồng hàng hải */}
                <Route path="/navigation-channel" element={<PermissionGuard permission="navigationchannel:read"><NavigationChannelList /></PermissionGuard>} />
                <Route path="/navigation-channel/create" element={<PermissionGuard permission="navigationchannel:create"><NavigationChannelForm /></PermissionGuard>} />
                <Route path="/navigation-channel/:id" element={<PermissionGuard permission="navigationchannel:read"><NavigationChannelForm /></PermissionGuard>} />

                {/* Đê/kè */}
                <Route path="/dike-revetment" element={<PermissionGuard permission="dikerevetment:read"><DikeRevetmentList /></PermissionGuard>} />
                <Route path="/dike-revetment/create" element={<PermissionGuard permission="dikerevetment:create"><DikeRevetmentForm /></PermissionGuard>} />
                <Route path="/dike-revetment/:id" element={<PermissionGuard permission="dikerevetment:read"><DikeRevetmentForm /></PermissionGuard>} />

                {/* Cơ sở sửa chữa/đóng tàu */}
                <Route path="/ship-repair-facility" element={<PermissionGuard permission="shiprepair:read"><ShipRepairFacilityList /></PermissionGuard>} />
                <Route path="/ship-repair-facility/create" element={<PermissionGuard permission="shiprepair:create"><ShipRepairFacilityForm /></PermissionGuard>} />
                <Route path="/ship-repair-facility/:id" element={<PermissionGuard permission="shiprepair:read"><ShipRepairFacilityForm /></PermissionGuard>} />

                {/* Trạm radar */}
                <Route path="/radar-station" element={<PermissionGuard permission="radarstation:read"><RadarStationList /></PermissionGuard>} />
                <Route path="/radar-station/create" element={<PermissionGuard permission="radarstation:create"><RadarStationForm /></PermissionGuard>} />
                <Route path="/radar-station/:id" element={<PermissionGuard permission="radarstation:read"><RadarStationForm /></PermissionGuard>} />

                {/* Hệ thống VTS */}
                <Route path="/vts-system" element={<PermissionGuard permission="vts:read"><VtsSystemList /></PermissionGuard>} />
                <Route path="/vts-system/create" element={<PermissionGuard permission="vts:create"><VtsSystemForm /></PermissionGuard>} />
                <Route path="/vts-system/:id" element={<PermissionGuard permission="vts:read"><VtsSystemForm /></PermissionGuard>} />

                {/* M-005: Biến động tài sản */}
                <Route path="/asset/increase" element={<PermissionGuard permission="assetincrease:manage"><AssetIncreaseList /></PermissionGuard>} />
                <Route path="/asset/decrease" element={<PermissionGuard permission="assetdecrease:manage"><AssetDecreaseList /></PermissionGuard>} />
                <Route path="/asset/inventory" element={<PermissionGuard permission="inventoryasset:manage"><InventoryList /></PermissionGuard>} />
                <Route path="/asset/exploitation" element={<PermissionGuard permission="assetexploitation:manage"><AssetExploitationList /></PermissionGuard>} />

                {/* M-006: Văn bản pháp lý */}
                <Route path="/documents/legal" element={<PermissionGuard permission="document:read"><LegalDocumentList /></PermissionGuard>} />
                <Route path="/documents/incidents" element={<PermissionGuard permission="document:read"><IncidentList /></PermissionGuard>} />
                <Route path="/documents/port-planning" element={<PermissionGuard permission="document:read"><PortPlanningList /></PermissionGuard>} />

                {/* M-014: Quản lý Nhà trạm */}
                <Route path="/buoy-station" element={<PermissionGuard permission="buoystation:read"><BuoyStationListPage /></PermissionGuard>} />

                {/* M-015: Đài duyên hải */}
                <Route path="/station/coastal" element={<PermissionGuard permission="coastalstation:read"><CoastalStationList /></PermissionGuard>} />
                <Route path="/station/special" element={<PermissionGuard permission="specialstation:read"><SpecialStationList /></PermissionGuard>} />

                {/* Symbols — Biểu tượng bản đồ */}
                <Route path="/symbols" element={<PermissionGuard permission="data:read"><SymbolList /></PermissionGuard>} />

                {/* Nhật ký & Backup */}
                <Route path="/logs" element={<PermissionGuard permission="admin:view"><LogsPage /></PermissionGuard>} />

                {/* Cấu hình hệ thống */}
                <Route path="/settings" element={<PermissionGuard permission="admin:manage"><SettingsPage /></PermissionGuard>} />
              </Route>

              {/* Catch-all. Sending everyone to /login made any unknown path look
                  like a session expiry — clicking a menu item whose route was
                  missing appeared to log the user out. Only anonymous visitors
                  belong at /login; a signed-in user goes back to the dashboard. */}
              <Route path="*" element={<UnknownRouteRedirect />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
          <RegisterAntdStatic />
        </AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

function UnknownRouteRedirect() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return <Navigate to={isAuthenticated ? '/' : '/login'} replace />;
}

function RegisterAntdStatic() {
  const { message, modal } = AntApp.useApp();
  useEffect(() => {
    setStaticMessage(message);
    setStaticModal(modal);
  }, [message, modal]);
  return null;
}

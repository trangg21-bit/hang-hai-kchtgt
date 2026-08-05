import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, App as AntApp, theme } from 'antd';
import { metronicTheme } from './theme';
import viVN from 'antd/locale/vi_VN';
import { setStaticMessage } from './components/ToastNotification';
import { useAuthStore } from './store/authStore';
import AppLayout from './components/AppLayout';
import UsersPage from './pages/UsersPage';
import RolesPage from './pages/RolesPage';
import PointObjectList from './pages/gis/PointObjectList';
import PointObjectForm from './pages/gis/PointObjectForm';
import LineObjectList from './pages/gis/LineObjectList';
import LineObjectForm from './pages/gis/LineObjectForm';
import PolygonObjectList from './pages/gis/PolygonObjectList';
import PolygonObjectForm from './pages/gis/PolygonObjectForm';
import MapLayerList from './pages/gis/MapLayerList';
import GISSearch from './pages/gis/GISSearch';
import GISChartView from './pages/gis/GISChartView';
import S63PermitsPage from './pages/gis/S63PermitsPage';
import LoginPage from './pages/Login';
import ReportList from './pages/reports/ReportList';
import ReportViewer from './pages/reports/ReportViewer';
import Bcc157Form from './pages/reports/Bcc157Form';
import ConnectionList from './pages/connections/ConnectionList';
import ConnectionForm from './pages/connections/ConnectionForm';
import ConnectionHealth from './pages/connections/ConnectionHealth';
import UnitList from './pages/organizations/UnitList';
import UnitForm from './pages/organizations/UnitForm';
import UnitTree from './pages/organizations/UnitTree';
import GroupList from './pages/groups/GroupList';
import GroupForm from './pages/groups/GroupForm';
import GroupMembers from './pages/groups/GroupMembers';
import LogsPage from './pages/LogsPage';
import InterconnectPage from './pages/InterconnectPage';
import SettingsPage from './pages/SettingsPage';
import BeaconList from './pages/beacons/BeaconList';
import BeaconForm from './pages/beacons/BeaconForm';
import BuoyList from './pages/buoys/BuoyList';
import BuoyForm from './pages/buoys/BuoyForm';
import BeaconHistoryList from './pages/history/BeaconHistoryList';
import SymbolList from './pages/symbols/SymbolList';
import HomePage from './pages/Home';
import PermissionGuard from './components/PermissionGuard';
import PasswordResetPage from './pages/PasswordResetPage';
import PortList from './services/port/PortListPage';
import PortCreatePage from './services/port/PortCreatePage';
import PortUpdatePage from './services/port/PortUpdatePage';
import PortApprovePage from './services/port/PortApprovePage';
import PortDeleteConfirm from './services/port/PortDeleteConfirm';

import BerthList from './pages/port/BerthList';
import BerthForm from './pages/port/BerthForm';

import PierList from './pages/port/PierList';
import PierForm from './pages/port/PierForm';

import DryPortList from './pages/port/DryPortList';
import DryPortForm from './pages/port/DryPortForm';

import WaterZoneListPage from './app/waterzone/WaterZoneListPage';

import DocumentUploadPage from './app/document/DocumentUploadPage';

// M-003: Khu nước & VTS — Quản lý tàu bè
import NavigationChannelList from './pages/navigationchannel/NavigationChannelList';
import NavigationChannelForm from './pages/navigationchannel/NavigationChannelForm';
import DikeRevetmentList from './pages/dikerevetment/DikeRevetmentList';
import DikeRevetmentForm from './pages/dikerevetment/DikeRevetmentForm';
import ShipRepairFacilityList from './pages/shiprepair/ShipRepairFacilityList';
import ShipRepairFacilityForm from './pages/shiprepair/ShipRepairFacilityForm';
import RadarStationList from './pages/radarstation/RadarStationList';
import RadarStationForm from './pages/radarstation/RadarStationForm';
import VtsSystemList from './pages/vtssystem/VtsSystemList';
import VtsSystemForm from './pages/vtssystem/VtsSystemForm';

// M-005 & M-006: Biến động tài sản & Văn bản pháp lý
import AssetIncreaseList from './pages/assetmovement/AssetIncreaseList';
import AssetDecreaseList from './pages/assetmovement/AssetDecreaseList';
import InventoryList from './pages/assetmovement/InventoryList';
import AssetExploitationList from './pages/assetmovement/AssetExploitationList';
import LegalDocumentList from './pages/document/LegalDocumentList';
import IncidentList from './pages/document/IncidentList';
import PortPlanningList from './pages/document/PortPlanningList';

// M-014 & M-015: Nhà trạm & Đài duyên hải
import LighthouseStationList from './pages/station/LighthouseStationList';
import BuoyStationList from './pages/station/BuoyStationList';
import BuoyStationForm from './pages/station/BuoyStationForm';
import CoastalStationList from './pages/station/CoastalStationList';
import SpecialStationList from './pages/station/SpecialStationList';

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
            <Routes>
              {/* Login — outside layout */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<PasswordResetPage mode="forgot" />} />
              <Route path="/reset-password/:token" element={<PasswordResetPage mode="reset" />} />

              {/* Protected routes — inside layout */}
              <Route element={<AppLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/users" element={<PermissionGuard permission="admin:manage"><UsersPage /></PermissionGuard>} />
                <Route path="/roles" element={<PermissionGuard permission="role:manage"><RolesPage /></PermissionGuard>} />

                {/* Organization — Đơn vị */}
                <Route path="/organizations" element={<PermissionGuard permission="orgunit:read"><UnitList /></PermissionGuard>} />
                <Route path="/organizations/create" element={<PermissionGuard permission="orgunit:manage"><UnitForm /></PermissionGuard>} />
                <Route path="/organizations/:id/edit" element={<PermissionGuard permission="orgunit:manage"><UnitForm /></PermissionGuard>} />
                <Route path="/organizations/tree/:id" element={<PermissionGuard permission="orgunit:manage"><UnitTree /></PermissionGuard>} />

                {/* Groups — Nhóm */}
                <Route path="/groups" element={<PermissionGuard permission="group:manage"><GroupList /></PermissionGuard>} />
                <Route path="/groups/create" element={<PermissionGuard permission="group:manage"><GroupForm /></PermissionGuard>} />
                <Route path="/groups/:id/edit" element={<PermissionGuard permission="group:manage"><GroupForm /></PermissionGuard>} />
                <Route path="/groups/:id/members" element={<PermissionGuard permission="group:manage"><GroupMembers /></PermissionGuard>} />

                {/* GIS - Bản đồ */}
                <Route path="/gis/points" element={<PermissionGuard permission="data:read"><PointObjectList /></PermissionGuard>} />
                <Route path="/gis/points/create" element={<PermissionGuard permission="data:read"><PointObjectForm /></PermissionGuard>} />
                <Route path="/gis/points/:id/edit" element={<PermissionGuard permission="data:read"><PointObjectForm /></PermissionGuard>} />
                <Route path="/gis/points/:id" element={<PermissionGuard permission="data:read"><PointObjectForm /></PermissionGuard>} />

                <Route path="/gis/lines" element={<PermissionGuard permission="data:read"><LineObjectList /></PermissionGuard>} />
                <Route path="/gis/lines/create" element={<PermissionGuard permission="data:read"><LineObjectForm /></PermissionGuard>} />
                <Route path="/gis/lines/:id/edit" element={<PermissionGuard permission="data:read"><LineObjectForm /></PermissionGuard>} />
                <Route path="/gis/lines/:id" element={<PermissionGuard permission="data:read"><LineObjectForm /></PermissionGuard>} />

                <Route path="/gis/polygons" element={<PermissionGuard permission="data:read"><PolygonObjectList /></PermissionGuard>} />
                <Route path="/gis/polygons/create" element={<PermissionGuard permission="data:read"><PolygonObjectForm /></PermissionGuard>} />
                <Route path="/gis/polygons/:id/edit" element={<PermissionGuard permission="data:read"><PolygonObjectForm /></PermissionGuard>} />
                <Route path="/gis/polygons/:id" element={<PermissionGuard permission="data:read"><PolygonObjectForm /></PermissionGuard>} />

                <Route path="/gis/layers" element={<PermissionGuard permission="map:manage"><MapLayerList /></PermissionGuard>} />

                <Route path="/gis/search" element={<PermissionGuard permission="data:read"><GISSearch /></PermissionGuard>} />
                <Route path="/gis/map" element={<PermissionGuard permission="data:read"><GISChartView /></PermissionGuard>} />
                <Route path="/gis/permits" element={<PermissionGuard permission="data:read"><S63PermitsPage /></PermissionGuard>} />

                {/* Connections — Liên thông & tích hợp dữ liệu */}
                <Route path="/connections" element={<PermissionGuard permission="connection:read"><ConnectionList /></PermissionGuard>} />
                <Route path="/connections/create" element={<PermissionGuard permission="connection:read"><ConnectionForm /></PermissionGuard>} />
                <Route path="/connections/:id/edit" element={<PermissionGuard permission="connection:read"><ConnectionForm /></PermissionGuard>} />
                <Route path="/connections/:id/health" element={<PermissionGuard permission="connection:read"><ConnectionHealth /></PermissionGuard>} />

                {/* F-004: Quản lý kết nối liên thông chia sẻ dữ liệu */}
                <Route path="/interconnect" element={<PermissionGuard permission="connection:read"><InterconnectPage /></PermissionGuard>} />

                {/* Reports & Statistics */}
                <Route path="/reports" element={<PermissionGuard permission="report:read"><ReportList /></PermissionGuard>} />
                <Route path="/reports/:code" element={<PermissionGuard permission="report:read"><ReportViewer /></PermissionGuard>} />
                <Route path="/reports/F-142/create" element={<PermissionGuard permission="report:create"><Bcc157Form /></PermissionGuard>} />

                {/* Beacon Lights & Buoys — Báo hiệu hàng hải */}
                <Route path="/beacon-lights" element={<PermissionGuard permission="data:read"><BeaconList /></PermissionGuard>} />
                <Route path="/beacon-lights/create" element={<PermissionGuard permission="data:read"><BeaconForm /></PermissionGuard>} />
                <Route path="/beacon-lights/:id" element={<PermissionGuard permission="data:read"><BeaconForm /></PermissionGuard>} />
                <Route path="/buoys" element={<PermissionGuard permission="data:read"><BuoyList /></PermissionGuard>} />
                <Route path="/buoys/create" element={<PermissionGuard permission="data:read"><><BuoyList /><BuoyForm /></></PermissionGuard>} />
                <Route path="/buoys/:id" element={<PermissionGuard permission="data:read"><><BuoyList /><BuoyForm /></></PermissionGuard>} />
                <Route path="/history" element={<PermissionGuard permission="data:read"><BeaconHistoryList /></PermissionGuard>} />

                {/* M-002: Tài sản KCHTGT - Cảng & Bến */}
                <Route path="/port" element={<PermissionGuard permission="port:read"><PortList /></PermissionGuard>} />
                <Route path="/port/create" element={<PermissionGuard permission="port:create"><PortCreatePage /></PermissionGuard>} />
                <Route path="/port/:id/edit" element={<PermissionGuard permission="port:update"><PortUpdatePage /></PermissionGuard>} />
                <Route path="/port/:id/approve" element={<PermissionGuard permission="port:approve"><PortApprovePage /></PermissionGuard>} />
                <Route path="/port/:id/delete" element={<PermissionGuard permission="port:delete"><PortDeleteConfirm /></PermissionGuard>} />

                <Route path="/berth" element={<PermissionGuard permission="berth:read"><BerthList /></PermissionGuard>} />
                <Route path="/berth/create" element={<PermissionGuard permission="berth:create"><><BerthList /><BerthForm /></></PermissionGuard>} />
                <Route path="/berth/:id/edit" element={<PermissionGuard permission="berth:update"><><BerthList /><BerthForm /></></PermissionGuard>} />

                <Route path="/Pier" element={<PermissionGuard permission="pier:read"><PierList /></PermissionGuard>} />
                <Route path="/Pier/create" element={<PermissionGuard permission="pier:create"><><PierList /><PierForm /></></PermissionGuard>} />
                <Route path="/Pier/:id/edit" element={<PermissionGuard permission="pier:update"><><PierList /><PierForm /></></PermissionGuard>} />

                <Route path="/dry-port" element={<PermissionGuard permission="dryport:read"><DryPortList /></PermissionGuard>} />
                <Route path="/dry-port/create" element={<PermissionGuard permission="dryport:create"><><DryPortList /><DryPortForm /></></PermissionGuard>} />
                <Route path="/dry-port/:id/edit" element={<PermissionGuard permission="dryport:update"><><DryPortList /><DryPortForm /></></PermissionGuard>} />

                <Route path="/water-zone" element={<PermissionGuard permission="waterzone:read"><WaterZoneListPage /></PermissionGuard>} />

                <Route path="/document/upload/:entityType/:entityId" element={<PermissionGuard permission="port:read"><DocumentUploadPage /></PermissionGuard>} />

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
                <Route path="/lighthouse-station" element={<PermissionGuard permission="data:read"><LighthouseStationList /></PermissionGuard>} />
                <Route path="/buoy-station" element={<PermissionGuard permission="data:read"><BuoyStationList /></PermissionGuard>} />
                <Route path="/buoy-station/create" element={<PermissionGuard permission="data:read"><><BuoyStationList /><BuoyStationForm /></></PermissionGuard>} />
                <Route path="/buoy-station/:id" element={<PermissionGuard permission="data:read"><><BuoyStationList /><BuoyStationForm /></></PermissionGuard>} />

                {/* M-015: Đài duyên hải */}
                <Route path="/station/coastal" element={<PermissionGuard permission="data:read"><CoastalStationList /></PermissionGuard>} />
                <Route path="/station/special" element={<PermissionGuard permission="data:read"><SpecialStationList /></PermissionGuard>} />

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
  const { message } = AntApp.useApp();
  useEffect(() => {
    setStaticMessage(message);
  }, [message]);
  return null;
}

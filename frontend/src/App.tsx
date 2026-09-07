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
import PermissionGuard from './components/PermissionGuard';

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
const PasswordResetPage = lazy(() => import('./pages/PasswordResetPage'));
const PortList = lazy(() => import('./services/port/PortListPage'));
const PortApprovePage = lazy(() => import('./services/port/PortApprovePage'));
const PortDeleteConfirm = lazy(() => import('./services/port/PortDeleteConfirm'));

// M-NEW: CCTV Management
const CctvListPage = lazy(() => import('./services/cctv/CctvListPage'));
// M-NEW: SCADA Management
const ScadaListPage = lazy(() => import('./services/scada/ScadaListPage'));
// M-NEW: Transmission Management
const TransmissionListPage = lazy(() => import('./services/transmission/TransmissionListPage'));
// M-NEW: VTS Assist Management
const VtsAssistListPage = lazy(() => import('./services/vtsassist/VtsAssistListPage'));
const BerthList = lazy(() => import('./pages/port/BerthListPage'));
const AnchorageList = lazy(() => import('./pages/anchorage/AnchorageListPage'));
const TransferAreaList = lazy(() => import('./pages/transfer-area/TransferAreaListPage'));
const StormShelterList = lazy(() => import('./pages/storm-shelter/StormShelterListPage'));
const BuoyBerthList = lazy(() => import('./pages/buoy-berth/BuoyBerthListPage'));
const DaiTtdhList = lazy(() => import('./pages/dai-ttdh/DaiTtdhListPage'));
const ShipRepairYardList = lazy(() => import('./pages/ship-repair-yard/ShipRepairYardListPage'));
const SeaportThroughputList = lazy(() => import('./pages/seaport-throughput/SeaportThroughputPage'));

const PierListPage = lazy(() => import('./pages/port/PierListPage'));
const DryPortListPage = lazy(() => import('./pages/port/DryPortListPage'));
const WaterZoneListPage = lazy(() => import('./app/waterzone/WaterZoneListPage'));
const DocumentUploadPage = lazy(() => import('./app/document/DocumentUploadPage'));

// M-003: Khu nước & VTS — Quản lý tàu bè
const NavigationChannelList = lazy(() => import('./pages/navigationchannel/NavigationChannelList'));
const NavigationChannelForm = lazy(() => import('./pages/navigationchannel/NavigationChannelForm'));
const NavigationChannelChkList = lazy(() => import('./pages/navigationchannelchk/NavigationChannelChkList'));
const NavigationChannelChkForm = lazy(() => import('./pages/navigationchannelchk/NavigationChannelChkForm'));
const DikeRevetmentList = lazy(() => import('./pages/dikerevetment/DikeRevetmentList'));
const DikeRevetmentForm = lazy(() => import('./pages/dikerevetment/DikeRevetmentForm'));
const ShipRepairFacilityList = lazy(() => import('./pages/shiprepair/ShipRepairFacilityList'));
const ShipRepairFacilityForm = lazy(() => import('./pages/shiprepair/ShipRepairFacilityForm'));
const RadarStationList = lazy(() => import('./pages/radarstation/RadarStationList'));
const RadarStationForm = lazy(() => import('./pages/radarstation/RadarStationForm'));
const VtsSystemList = lazy(() => import('./pages/vtssystem/VtsSystemList'));
const VtsOperationCenterList = lazy(() => import('./pages/vtsoperationcenter/VtsOperationCenterList'));
const AisSystemList = lazy(() => import('./pages/aissystem/AisSystemList'));

// M-005 & M-006: Biến động tài sản & Văn bản pháp lý
const AssetIncreaseList = lazy(() => import('./pages/assetmovement/AssetIncreaseList'));
const AssetDecreaseList = lazy(() => import('./pages/assetmovement/AssetDecreaseList'));
const InventoryList = lazy(() => import('./pages/assetmovement/InventoryList'));
const AssetExploitationList = lazy(() => import('./pages/assetmovement/AssetExploitationList'));
const LegalDocumentList = lazy(() => import('./pages/document/LegalDocumentList'));
const IncidentList = lazy(() => import('./pages/document/IncidentList'));
const PortPlanningList = lazy(() => import('./pages/document/PortPlanningList'));
const OperationList = lazy(() => import('./pages/document/OperationList'));
const ShipPortCallPage = lazy(() => import('./pages/shipportcall/ShipPortCallPage'));
const MaintenanceList = lazy(() => import('./pages/document/MaintenanceList'));

// M-014: Quản lý Nhà trạm phao tiêu
// M-015: Đài duyên hải
const BuoyStationListPage = lazy(() => import('./services/buoy-station/BuoyStationListPage'));
const CoastalStationList = lazy(() => import('./pages/station/CoastalStationList'));
const InmarsatStationList = lazy(() => import('./pages/station/inmarsat/InmarsatStationList'));
const CospasSarsatStationList = lazy(() => import('./pages/station/CospasSarsatStationList'));
const LritStationList = lazy(() => import('./pages/station/lrit/LritStationList'));
const HanoiStationList = lazy(() => import('./pages/station/hanoi/HanoiStationList'));

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
                {/* Landing v2 (M-024): 6 khối chức năng trong AppLayout — PortalHome fullscreen đã gỡ */}
                <Route path="/" element={<HomePage />} />
                {/* '/dashboard' de-dup: nội dung KPI không còn trong tree (v2) → redirect về landing 6 khối (quyết định ghi lean-spec/F-292) */}
                <Route path="/dashboard" element={<Navigate to="/" replace />} />
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

                <Route path="/cctv" element={<PermissionGuard permission="cctv:read"><CctvListPage /></PermissionGuard>} />
                <Route path="/scada" element={<PermissionGuard permission="scada:read"><ScadaListPage /></PermissionGuard>} />
                <Route path="/transmission" element={<PermissionGuard permission="transmission:read"><TransmissionListPage /></PermissionGuard>} />
                <Route path="/vts-assist" element={<PermissionGuard permission="vtsassist:read"><VtsAssistListPage /></PermissionGuard>} />
                <Route path="/berth" element={<PermissionGuard permission="berth:read"><BerthList /></PermissionGuard>} />

                <Route path="/anchorage" element={<PermissionGuard permission="anchorage:read"><AnchorageList /></PermissionGuard>} />

                <Route path="/transfer-area" element={<PermissionGuard permission="transferarea:read"><TransferAreaList /></PermissionGuard>} />

                <Route path="/storm-shelter" element={<PermissionGuard permission="stormshelter:read"><StormShelterList /></PermissionGuard>} />

                <Route path="/seaport-throughput" element={<PermissionGuard permission="seaportthroughput:read"><SeaportThroughputList /></PermissionGuard>} />

                <Route path="/buoy-berth" element={<PermissionGuard permission="buoyberth:read"><BuoyBerthList /></PermissionGuard>} />

                <Route path="/dai-ttdh" element={<PermissionGuard permission="daittdh:read"><DaiTtdhList /></PermissionGuard>} />

                <Route path="/ship-repair-yard" element={<PermissionGuard permission="shiprepairyard:read"><ShipRepairYardList /></PermissionGuard>} />

                <Route path="/pier" element={<PermissionGuard permission="pier:read"><PierListPage /></PermissionGuard>} />

                <Route path="/dry-port" element={<PermissionGuard permission="dryport:read"><DryPortListPage /></PermissionGuard>} />

                <Route path="/water-zone" element={<PermissionGuard permission="waterzone:read"><WaterZoneListPage /></PermissionGuard>} />

                <Route path="/document/upload/:entityType/:entityId" element={<PermissionGuard permission="document:create"><DocumentUploadPage /></PermissionGuard>} />

                {/* M-003: Khu nước & VTS — Quản lý tàu bè */}

                {/* Luồng hàng hải */}
                <Route path="/navigation-channel" element={<PermissionGuard permission="navigationchannel:read"><NavigationChannelList /></PermissionGuard>} />
                <Route path="/navigation-channel/create" element={<PermissionGuard permission="navigationchannel:create"><NavigationChannelForm /></PermissionGuard>} />
                <Route path="/navigation-channel/:id" element={<PermissionGuard permission="navigationchannel:read"><NavigationChannelForm /></PermissionGuard>} />
                {/* Alias tiếng Việt — E2E + sidebar dùng /luong-hang-hai */}
                <Route path="/luong-hang-hai" element={<PermissionGuard permission="navigationchannel:read"><NavigationChannelList /></PermissionGuard>} />
                <Route path="/luong-hang-hai/create" element={<PermissionGuard permission="navigationchannel:create"><NavigationChannelForm /></PermissionGuard>} />
                <Route path="/luong-hang-hai/:id" element={<PermissionGuard permission="navigationchannel:read"><NavigationChannelForm /></PermissionGuard>} />

                {/* Luồng hàng hải CHK (M-027) */}
                <Route path="/navigation-channel-chk" element={<PermissionGuard permission="navigationchannel:read"><NavigationChannelChkList /></PermissionGuard>} />
                <Route path="/navigation-channel-chk/create" element={<PermissionGuard permission="navigationchannel:create"><NavigationChannelChkForm /></PermissionGuard>} />
                <Route path="/navigation-channel-chk/:id" element={<PermissionGuard permission="navigationchannel:read"><NavigationChannelChkForm /></PermissionGuard>} />
                {/* Alias tiếng Việt — E2E */}
                <Route path="/luong-hang-hai-chk" element={<PermissionGuard permission="navigationchannel:read"><NavigationChannelChkList /></PermissionGuard>} />
                <Route path="/luong-hang-hai-chk/create" element={<PermissionGuard permission="navigationchannel:create"><NavigationChannelChkForm /></PermissionGuard>} />
                <Route path="/luong-hang-hai-chk/:id" element={<PermissionGuard permission="navigationchannel:read"><NavigationChannelChkForm /></PermissionGuard>} />

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

                {/* Trung tâm điều hành VTS */}
                <Route path="/vts-operation-center" element={<PermissionGuard permission="vtsoperationcenter:read"><VtsOperationCenterList /></PermissionGuard>} />

                {/* Hệ thống trạm bờ AIS */}
                <Route path="/ais-system" element={<PermissionGuard permission="aissystem:read"><AisSystemList /></PermissionGuard>} />

                {/* M-005: Biến động tài sản */}
                <Route path="/asset/increase" element={<PermissionGuard permission="assetincrease:manage"><AssetIncreaseList /></PermissionGuard>} />
                <Route path="/asset/decrease" element={<PermissionGuard permission="assetdecrease:manage"><AssetDecreaseList /></PermissionGuard>} />
                <Route path="/asset/inventory" element={<PermissionGuard permission="inventoryasset:manage"><InventoryList /></PermissionGuard>} />
                <Route path="/asset/exploitation" element={<PermissionGuard permission="assetexploitation:manage"><AssetExploitationList /></PermissionGuard>} />

                {/* M-006: Văn bản pháp lý */}
                <Route path="/documents/legal" element={<PermissionGuard permission="document:read"><LegalDocumentList /></PermissionGuard>} />
                <Route path="/documents/incidents" element={<PermissionGuard permission="document:read"><IncidentList /></PermissionGuard>} />
                <Route path="/documents/port-planning" element={<PermissionGuard permission="document:read"><PortPlanningList /></PermissionGuard>} />
                <Route path="/documents/operation" element={<PermissionGuard permission="document:read"><OperationList /></PermissionGuard>} />
                <Route path="/ship-port-call" element={<PermissionGuard permission="shipportcall:read"><ShipPortCallPage /></PermissionGuard>} />
                <Route path="/documents/maintenance" element={<PermissionGuard permission="document:read"><MaintenanceList /></PermissionGuard>} />

                {/* M-014: Quản lý Nhà trạm */}
                <Route path="/buoy-station" element={<PermissionGuard permission="buoystation:read"><BuoyStationListPage /></PermissionGuard>} />

                {/* M-015: Đài duyên hải */}
                <Route path="/station/coastal" element={<PermissionGuard permission="coastalstation:read"><CoastalStationList /></PermissionGuard>} />
                <Route path="/station/inmarsat" element={<PermissionGuard permission={['specialstation:read', 'coastalstationinmarsat:read', 'coastalstation:read', 'data:read']}><InmarsatStationList /></PermissionGuard>} />
                <Route path="/station/cospas-sarsat" element={<PermissionGuard permission="coastalstationcospassarsat:read"><CospasSarsatStationList /></PermissionGuard>} />
                <Route path="/station/lrit" element={<PermissionGuard permission="coastalstationlrit:read"><LritStationList /></PermissionGuard>} />
                <Route path="/station/hanoi" element={<PermissionGuard permission="coastalstationhaiphong:read"><HanoiStationList /></PermissionGuard>} />

                {/* Symbols — Biểu tượng bản đồ */}
                <Route path="/symbols" element={<PermissionGuard permission="data:read"><SymbolList /></PermissionGuard>} />

                {/* Nhật ký & Backup */}
                <Route path="/logs" element={<PermissionGuard permission="admin:view"><LogsPage /></PermissionGuard>} />

                {/* Cấu hình hệ thống */}
                <Route path="/settings" element={<PermissionGuard permission="admin:manage"><SettingsPage /></PermissionGuard>} />
              </Route>

              {/* Catch-all */}
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

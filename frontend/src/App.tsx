import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, App as AntApp, theme } from 'antd';
import { metronicTheme } from './theme';
import viVN from 'antd/locale/vi_VN';
import { setStaticMessage } from './components/ToastNotification';
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
import PortDetailPage from './services/port/PortDetailPage';
import PortApprovePage from './services/port/PortApprovePage';
import PortDeleteConfirm from './services/port/PortDeleteConfirm';

import BerthListPage from './app/berth/BerthListPage';

import PierListPage from './app/pier/PierListPage';

import DryPortListPage from './app/dryport/DryPortListPage';

import WaterZoneListPage from './app/waterzone/WaterZoneListPage';

import DocumentUploadPage from './app/document/DocumentUploadPage';

// M-003: Khu nước & VTS — Quản lý tàu bè
import LuongHangHaiList from './pages/luonghanghai/LuongHangHaiList';
import LuongHangHaiForm from './pages/luonghanghai/LuongHangHaiForm';
import DeKeList from './pages/deke/DeKeList';
import DeKeForm from './pages/deke/DeKeForm';
import CoSuaChuaList from './pages/cosuachua/CoSuaChuaList';
import CoSuaChuaForm from './pages/cosuachua/CoSuaChuaForm';
import TramRadarList from './pages/tramradar/TramRadarList';
import TramRadarForm from './pages/tramradar/TramRadarForm';
import HeThongVTSList from './pages/hethongvts/HeThongVTSList';
import HeThongVTSForm from './pages/hethongvts/HeThongVTSForm';

// M-005 & M-006: Biến động tài sản & Văn bản pháp lý
import AssetIncreaseList from './pages/assetmovement/AssetIncreaseList';
import AssetDecreaseList from './pages/assetmovement/AssetDecreaseList';
import InventoryList from './pages/assetmovement/InventoryList';
import AssetExploitationList from './pages/assetmovement/AssetExploitationList';
import VanBanPhapLyList from './pages/vanban/VanBanPhapLyList';
import SuCoList from './pages/vanban/SuCoList';
import QuyHoachList from './pages/vanban/QuyHoachList';

// M-014 & M-015: Nhà trạm & Đài duyên hải
import NhaTramDenList from './pages/nhatram/NhaTramDenList';
import NhaTramPhaoList from './pages/nhatram/NhaTramPhaoList';
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
                <Route path="/users" element={<PermissionGuard permission="user:manage"><UsersPage /></PermissionGuard>} />
                <Route path="/roles" element={<PermissionGuard permission="role:manage"><RolesPage /></PermissionGuard>} />

                {/* Organization — Đơn vị */}
                <Route path="/organizations" element={<PermissionGuard permission="orgunit:manage"><UnitList /></PermissionGuard>} />
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

                {/* Reports & Statistics */}
                <Route path="/reports" element={<PermissionGuard permission="report:read"><ReportList /></PermissionGuard>} />
                <Route path="/reports/:code" element={<PermissionGuard permission="report:read"><ReportViewer /></PermissionGuard>} />
                <Route path="/reports/F-142/create" element={<PermissionGuard permission="report:create"><Bcc157Form /></PermissionGuard>} />

                {/* Beacon Lights & Buoys — Báo hiệu hàng hải */}
                <Route path="/den-bien" element={<PermissionGuard permission="data:read"><BeaconList /></PermissionGuard>} />
                <Route path="/den-bien/tao-moi" element={<PermissionGuard permission="data:read"><BeaconForm /></PermissionGuard>} />
                <Route path="/den-bien/:id" element={<PermissionGuard permission="data:read"><BeaconForm /></PermissionGuard>} />
                <Route path="/buoys" element={<PermissionGuard permission="data:read"><BuoyList /></PermissionGuard>} />
                <Route path="/buoys/create" element={<PermissionGuard permission="data:read"><BuoyForm /></PermissionGuard>} />
                <Route path="/buoys/:id" element={<PermissionGuard permission="data:read"><BuoyForm /></PermissionGuard>} />
                <Route path="/history" element={<PermissionGuard permission="data:read"><BeaconHistoryList /></PermissionGuard>} />

                {/* M-002: Tài sản KCHTGT - Cảng & Bến */}
                <Route path="/Port" element={<PermissionGuard permission="Port:read"><PortList /></PermissionGuard>} />
                <Route path="/Port/create" element={<PermissionGuard permission="Port:create"><PortCreatePage /></PermissionGuard>} />
                <Route path="/Port/:id" element={<PermissionGuard permission="Port:read"><PortDetailPage /></PermissionGuard>} />
                <Route path="/Port/:id/edit" element={<PermissionGuard permission="Port:update"><PortUpdatePage /></PermissionGuard>} />
                <Route path="/Port/:id/approve" element={<PermissionGuard permission="Port:approve"><PortApprovePage /></PermissionGuard>} />
                <Route path="/Port/:id/delete" element={<PermissionGuard permission="Port:delete"><PortDeleteConfirm /></PermissionGuard>} />

                <Route path="/Berth" element={<PermissionGuard permission="Berth:read"><BerthListPage /></PermissionGuard>} />

                <Route path="/Pier" element={<PermissionGuard permission="Pier:read"><PierListPage /></PermissionGuard>} />

                <Route path="/DryPort" element={<PermissionGuard permission="DryPort:read"><DryPortListPage /></PermissionGuard>} />

                <Route path="/WaterZone" element={<PermissionGuard permission="WaterZone:read"><WaterZoneListPage /></PermissionGuard>} />

                <Route path="/document/upload/:entityType/:entityId" element={<PermissionGuard permission="cangben:read"><DocumentUploadPage /></PermissionGuard>} />

                {/* M-003: Khu nước & VTS — Quản lý tàu bè */}

                {/* Luồng hàng hải */}
                <Route path="/luong-hang-hai" element={<PermissionGuard permission="luonghanghai:read"><LuongHangHaiList /></PermissionGuard>} />
                <Route path="/luong-hang-hai/create" element={<PermissionGuard permission="luonghanghai:create"><LuongHangHaiForm /></PermissionGuard>} />
                <Route path="/luong-hang-hai/:id" element={<PermissionGuard permission="luonghanghai:read"><LuongHangHaiForm /></PermissionGuard>} />

                {/* Đê/kè */}
                <Route path="/de-ke" element={<PermissionGuard permission="deke:read"><DeKeList /></PermissionGuard>} />
                <Route path="/de-ke/create" element={<PermissionGuard permission="deke:create"><DeKeForm /></PermissionGuard>} />
                <Route path="/de-ke/:id" element={<PermissionGuard permission="deke:read"><DeKeForm /></PermissionGuard>} />

                {/* Cơ sở sửa chữa/đóng tàu */}
                <Route path="/co-so-sua-chua" element={<PermissionGuard permission="cosuachua:read"><CoSuaChuaList /></PermissionGuard>} />
                <Route path="/co-so-sua-chua/create" element={<PermissionGuard permission="cosuachua:create"><CoSuaChuaForm /></PermissionGuard>} />
                <Route path="/co-so-sua-chua/:id" element={<PermissionGuard permission="cosuachua:read"><CoSuaChuaForm /></PermissionGuard>} />

                {/* Trạm radar */}
                <Route path="/tram-radar" element={<PermissionGuard permission="tramradar:read"><TramRadarList /></PermissionGuard>} />
                <Route path="/tram-radar/create" element={<PermissionGuard permission="tramradar:create"><TramRadarForm /></PermissionGuard>} />
                <Route path="/tram-radar/:id" element={<PermissionGuard permission="tramradar:read"><TramRadarForm /></PermissionGuard>} />

                {/* Hệ thống VTS */}
                <Route path="/he-thong-vts" element={<PermissionGuard permission="vts:read"><HeThongVTSList /></PermissionGuard>} />
                <Route path="/he-thong-vts/create" element={<PermissionGuard permission="vts:create"><HeThongVTSForm /></PermissionGuard>} />
                <Route path="/he-thong-vts/:id" element={<PermissionGuard permission="vts:read"><HeThongVTSForm /></PermissionGuard>} />

                {/* M-005: Biến động tài sản */}
                <Route path="/asset/increase" element={<PermissionGuard permission="asset:yeu-cau-tang"><AssetIncreaseList /></PermissionGuard>} />
                <Route path="/asset/decrease" element={<PermissionGuard permission="asset:yeu-cau-giam"><AssetDecreaseList /></PermissionGuard>} />
                <Route path="/asset/inventory" element={<PermissionGuard permission="asset:kiem-ke"><InventoryList /></PermissionGuard>} />
                <Route path="/asset/exploitation" element={<PermissionGuard permission="asset:khai-thac"><AssetExploitationList /></PermissionGuard>} />

                {/* M-006: Văn bản pháp lý */}
                <Route path="/vanban/phaply" element={<PermissionGuard permission="vanban:manage"><VanBanPhapLyList /></PermissionGuard>} />
                <Route path="/vanban/suco" element={<PermissionGuard permission="vanban:manage"><SuCoList /></PermissionGuard>} />
                <Route path="/vanban/quyhoach" element={<PermissionGuard permission="vanban:manage"><QuyHoachList /></PermissionGuard>} />

                {/* M-014: Quản lý Nhà trạm */}
                <Route path="/nhatram/den" element={<PermissionGuard permission="nhatram:read"><NhaTramDenList /></PermissionGuard>} />
                <Route path="/nhatram/phao" element={<PermissionGuard permission="nhatram:read"><NhaTramPhaoList /></PermissionGuard>} />

                {/* M-015: Đài duyên hải */}
                <Route path="/station/coastal" element={<PermissionGuard permission="station:read"><CoastalStationList /></PermissionGuard>} />
                <Route path="/station/special" element={<PermissionGuard permission="station:read"><SpecialStationList /></PermissionGuard>} />

                {/* Symbols — Biểu tượng bản đồ */}
                <Route path="/symbols" element={<PermissionGuard permission="data:read"><SymbolList /></PermissionGuard>} />

                {/* Nhật ký & Backup */}
                <Route path="/logs" element={<PermissionGuard permission="log:manage"><LogsPage /></PermissionGuard>} />
              </Route>

              {/* Catch-all: redirect unknown routes to login */}
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </BrowserRouter>
          <RegisterAntdStatic />
        </AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

function RegisterAntdStatic() {
  const { message } = AntApp.useApp();
  useEffect(() => {
    setStaticMessage(message);
  }, [message]);
  return null;
}

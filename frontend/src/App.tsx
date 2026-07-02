import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, App as AntApp, theme } from 'antd';
import viVN from 'antd/locale/vi_VN';
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
import MapLayerForm from './pages/gis/MapLayerForm';
import GISSearch from './pages/gis/GISSearch';
import GISChartView from './pages/gis/GISChartView';
import S63PermitsPage from './pages/gis/S63PermitsPage';
import LoginPage from './pages/Login';
import ReportList from './pages/reports/ReportList';
import ReportViewer from './pages/reports/ReportViewer';
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
import HomePage from './pages/Home';
import PermissionGuard from './components/PermissionGuard';
import PasswordResetPage from './pages/PasswordResetPage';
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
          token: {
            colorPrimary: '#1677ff',
            borderRadius: 6,
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          },
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
                <Route path="/gis/layers/create" element={<PermissionGuard permission="map:manage"><MapLayerForm /></PermissionGuard>} />
                <Route path="/gis/layers/:id/edit" element={<PermissionGuard permission="map:manage"><MapLayerForm /></PermissionGuard>} />

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

                {/* Beacon Lights & Buoys — Báo hiệu hàng hải */}
                <Route path="/beacons" element={<PermissionGuard permission="data:read"><BeaconList /></PermissionGuard>} />
                <Route path="/beacons/:id" element={<PermissionGuard permission="data:read"><BeaconForm /></PermissionGuard>} />
                <Route path="/buoys" element={<PermissionGuard permission="data:read"><BuoyList /></PermissionGuard>} />
                <Route path="/buoys/:id" element={<PermissionGuard permission="data:read"><BuoyForm /></PermissionGuard>} />
                <Route path="/history" element={<PermissionGuard permission="data:read"><BeaconHistoryList /></PermissionGuard>} />

                {/* Khu nước & VTS — M-003 */}

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

                {/* Nhật ký & Backup */}
                <Route path="/logs" element={<PermissionGuard permission="log:manage"><LogsPage /></PermissionGuard>} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

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
import LoginPage from './pages/Login';
import AdminList from './pages/admins/AdminList';
import AdminForm from './pages/admins/AdminForm';
import AdminAudit from './pages/admins/AdminAudit';
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

              {/* Protected routes — inside layout */}
              <Route element={<AppLayout />}>
                <Route path="/" element={<Navigate to="/users" replace />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/roles" element={<RolesPage />} />

                {/* Organization — Đơn vị */}
                <Route path="/organizations" element={<UnitList />} />
                <Route path="/organizations/create" element={<UnitForm />} />
                <Route path="/organizations/:id/edit" element={<UnitForm />} />
                <Route path="/organizations/tree/:id" element={<UnitTree />} />

                {/* Groups — Nhóm */}
                <Route path="/groups" element={<GroupList />} />
                <Route path="/groups/create" element={<GroupForm />} />
                <Route path="/groups/:id/edit" element={<GroupForm />} />
                <Route path="/groups/:id/members" element={<GroupMembers />} />

                {/* Admin — Quản trị viên */}
                <Route path="/admins" element={<AdminList />} />
                <Route path="/admins/create" element={<AdminForm />} />
                <Route path="/admins/:id/edit" element={<AdminForm />} />
                <Route path="/admins/:id/audit" element={<AdminAudit />} />

                {/* GIS - Bản đồ */}
                <Route path="/gis/points" element={<PointObjectList />} />
                <Route path="/gis/points/create" element={<PointObjectForm />} />
                <Route path="/gis/points/:id/edit" element={<PointObjectForm />} />
                <Route path="/gis/points/:id" element={<PointObjectForm />} />

                <Route path="/gis/lines" element={<LineObjectList />} />
                <Route path="/gis/lines/create" element={<LineObjectForm />} />
                <Route path="/gis/lines/:id/edit" element={<LineObjectForm />} />
                <Route path="/gis/lines/:id" element={<LineObjectForm />} />

                <Route path="/gis/polygons" element={<PolygonObjectList />} />
                <Route path="/gis/polygons/create" element={<PolygonObjectForm />} />
                <Route path="/gis/polygons/:id/edit" element={<PolygonObjectForm />} />
                <Route path="/gis/polygons/:id" element={<PolygonObjectForm />} />

                <Route path="/gis/layers" element={<MapLayerList />} />
                <Route path="/gis/layers/create" element={<MapLayerForm />} />
                <Route path="/gis/layers/:id/edit" element={<MapLayerForm />} />

                <Route path="/gis/search" element={<GISSearch />} />

                {/* Connections — Liên thông & tích hợp dữ liệu */}
                <Route path="/connections" element={<ConnectionList />} />
                <Route path="/connections/create" element={<ConnectionForm />} />
                <Route path="/connections/:id/edit" element={<ConnectionForm />} />
                <Route path="/connections/:id/health" element={<ConnectionHealth />} />


                {/* Reports & Statistics */}
                <Route path="/reports" element={<ReportList />} />
                <Route path="/reports/:code" element={<ReportViewer />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

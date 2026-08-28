import { useState, useEffect, useCallback, useRef } from 'react';
import { Input, Tooltip, DatePicker, Drawer, Button } from 'antd';
import { message } from '../components/ToastNotification';
import { EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { ScreenHeader, DataTable, Pagination } from '../components/list-view';
import FilterTableLayout from '../components/list-view/FilterTableLayout';
import type { DataTableColumn } from '../components/list-view/DataTable';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import {
  textPrimary, textTertiary, statusCritical,
  spaceFormField, spaceMd, spaceSm, radiusPill,
  fontSizeMd,
  fontWeightBold,
  fontMono, borderDefault, radiusLg, controlHeight,
  drawerProps, drawerTitleStyle, drawerCloseBtnStyle,
} from '../themetokenchk';
import { colors } from '../themetokenchk';
import * as themeTokenChk from '../themetokenchk';
import { ThemeTokenProvider } from '../context/ThemeTokenContext';
import { logService, type AccessLogEntry } from '../services/logService';
import api from '../services/api';
import { OrgUnitTreeSelect } from '../components/org-unit';
import { useAuthStore } from '../store/authStore';

// ── Constants ──────────────────────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { value: 'access', label: 'Thao tác' },
  { value: 'login', label: 'Đăng nhập' },
  { value: 'error', label: 'Lỗi hệ thống' },
  { value: 'account', label: 'Tài khoản' },
  { value: 'configuration', label: 'Cấu hình' },
];

// ── Action translation: English code → Vietnamese display ─────────────────────

const ACTION_MAP: Record<string, string> = {
  LOGIN: 'Đăng nhập',
  LOGOUT: 'Đăng xuất',
  LOGIN_TOTP: 'Đăng nhập (2 lớp)',
  CREATE_USER: 'Tạo người dùng',
  UPDATE_USER: 'Sửa người dùng',
  DELETE_USER: 'Xóa người dùng',
  LOCK_USER: 'Khóa người dùng',
  UNLOCK_USER: 'Mở khóa người dùng',
  CHANGE_USER_STATUS: 'Đổi trạng thái người dùng',
  RESET_USER_PASSWORD: 'Đặt lại mật khẩu',
  CREATE_CONNECTION: 'Tạo kết nối',
  UPDATE_CONNECTION: 'Sửa kết nối',
  DELETE_CONNECTION: 'Xóa kết nối',
  RUN_HEALTH_CHECK: 'Kiểm tra kết nối',
  TEST_CONNECTION: 'Kiểm thử kết nối',
  CREATE_BACKUP: 'Tạo sao lưu',
  RESTORE_BACKUP: 'Khôi phục sao lưu',
};

const VERB_MAP: Record<string, string> = {
  VIEW: 'Xem',
  CREATE: 'Tạo',
  UPDATE: 'Sửa',
  DELETE: 'Xóa',
};

const RESOURCE_MAP: Record<string, string> = {
  USERS: 'người dùng',
  GROUPS: 'nhóm',
  ROLES: 'phân quyền',
  ORG_UNITS: 'đơn vị',
  PORTS: 'cảng biển',
  BERTHS: 'bến cảng',
  PIERS: 'cầu cảng',
  DRYPORTS: 'cảng cạn',
  WATERZONES: 'vùng nước',
  ACCESS_LOGS: 'log truy cập',
  LOGS: 'log',
  CONNECTIONS: 'kết nối',
  REPORTS: 'báo cáo',
  SETTINGS: 'cấu hình',
  AUTH: 'đăng nhập',
  GIS: 'bản đồ',
  BEACONS: 'đèn biển',
  BEACON_LIGHTS: 'đèn biển',
  BUOYS: 'phao tiêu',
  SYMBOLS: 'biểu tượng',
  MAP_ICONS: 'biểu tượng bản đồ',
  NAVIGATION_CHANNEL: 'luồng hàng hải',
  DIKE_REVETMENT: 'đê kè',
  SHIP_REPAIR_FACILITY: 'sửa chữa tàu',
  RADAR_STATION: 'trạm radar',
  VTS_SYSTEM: 'hệ thống VTS',
  VTS_OPERATION_CENTER: 'trung tâm điều hành VTS',
  VTSOPERATIONCENTER: 'trung tâm điều hành VTS',
  AIS_SYSTEM: 'hệ thống trạm bờ AIS',
  AISSYSTEM: 'hệ thống trạm bờ AIS',
  CCTV: 'hệ thống CCTV',
  STATIONS: 'nhà trạm',
  COASTAL_STATION_INMARSAT: 'đài Inmarsat',
  COASTAL_STATION_COSPAS_SARSAT: 'đài Cospas-Sarsat',
  PORT_PLANNING: 'quy hoạch bến cảng',
  PLANNING_ADJUSTMENT: 'điều chỉnh quy hoạch',
  INTERCONNECT: 'liên thông kết nối',
  MOVEMENT_REQUEST: 'yêu cầu điều chuyển',
  INVENTORY_PLAN: 'kế hoạch kiểm kê',
  INVENTORY_REPORT: 'báo cáo kiểm kê',
  INVENTORY_ASSET: 'tài sản kiểm kê',
  INFRA_ASSET: 'tài sản KCHT',
  ASSET_DECREASE: 'giảm tài sản',
  ASSET_INCREASE: 'tăng tài sản',
  ASSET_EXPLOITATION: 'khai thác tài sản',
  MAINTENANCE_PLAN: 'kế hoạch bảo trì',
  OPERATION_PLAN: 'kế hoạch vận hành',
  INCIDENT: 'sự cố KCHT',
  GIS_POINT: 'điểm GIS',
  POINT_OBJECT: 'đối tượng điểm GIS',
  GIS_LINE: 'đường GIS',
  LINE_OBJECT: 'đối tượng đường GIS',
  GIS_POLYGON: 'vùng GIS',
  POLYGON_OBJECT: 'đối tượng vùng GIS',
  BUOY_STATION: 'nhà trạm phao tiêu',
  COASTAL_STATION: 'đài duyên hải',
  SPECIAL_STATION: 'đài vệ tinh',
  BACKUPS: 'sao lưu',
  DOCUMENTS: 'văn bản',
  ASSET: 'tài sản',
  ASSETS: 'tài sản',
  ADMIN: 'quản trị',
  SYSTEM: 'hệ thống',
  SIEM: 'giám sát',
  USER: 'người dùng',
  PORT: 'cảng biển',
  BEACON: 'đèn biển',
  HISTORY: 'lịch sử',
  BEACON_HISTORY: 'lịch sử đèn biển',
  CONNECTION: 'kết nối',
  MAP: 'bản đồ',
  REPORT: 'báo cáo',
  ROLE: 'phân quyền',
  GROUP: 'nhóm',
  DASHBOARD: 'trang chủ',
  ORGANIZATION: 'đơn vị',
};

function translateAction(action: string): string {
  if (!action) return '—';
  // Direct match
  if (ACTION_MAP[action]) return ACTION_MAP[action];
  // Parse VERB_RESOURCE or VERB_RESOURCE_LIST pattern
  const parts = action.split('_');
  if (parts.length >= 2) {
    const verb = parts[0];
    const listIdx = parts.indexOf('LIST');
    const resourceParts = listIdx > 0 ? parts.slice(1, listIdx) : parts.slice(1);
    const resourceKey = resourceParts.join('_');
    const verbVN = VERB_MAP[verb] || verb;
    const resourceVN = RESOURCE_MAP[resourceKey] || resourceKey.toLowerCase().replace(/_/g, ' ');
    const isList = action.endsWith('_LIST');
    return isList ? `${verbVN} danh sách ${resourceVN}` : `${verbVN} ${resourceVN}`;
  }
  return action;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function LogsPage() {
  // ---- Data state ----
  const [data, setData] = useState<AccessLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- UI state ----
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [orgUnits, setOrgUnits] = useState<{ id: string; name: string; code?: string; parentId?: string }[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({
    dateRange: [dayjs().startOf('day'), dayjs().endOf('day')],
  });
  const [filterValues, setFilterValues] = useState<{
    dateRange: [Dayjs | null, Dayjs | null] | null;
    orgUnit?: string;
    email: string;
  }>({ dateRange: [dayjs().startOf('day'), dayjs().endOf('day')], orgUnit: '__all__', email: '' });

  const [filterOrgUnit, setFilterOrgUnit] = useState<string | undefined>();
  const [filterEmail, setFilterEmail] = useState('');

  // ---- Auth ----
  const user = useAuthStore((s) => s.user);
  const role = user?.role || '';
  const username = user?.username || '';
  const isAdminOp = role === 'ROLE_SECURITY_MONITOR';
  const isLeader = role === 'ROLE_LEADER';
  const isSelfOnly = role && role !== 'ROLE_SYSTEM_ADMIN' && role !== 'ROLE_ADMIN' && !isAdminOp;

  // ---- Detail modal state ----
  const [selectedLog, setSelectedLog] = useState<AccessLogEntry | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // ---- Table body height: fill available space so its bottom aligns with the filter divider ----
  const tableWrapRef = useRef<HTMLDivElement>(null);
  const [tableBodyHeight, setTableBodyHeight] = useState(540);

  // ---- Load org options (giống màn /cctv: fetch trực tiếp /common/options/org-units, không dùng cache) ----
  const loadOrgOptions = async () => {
    setLoadingOrgs(true);
    try {
      const res = await api.get('/common/options/org-units');
      const items = res.data?.data;
      const orgs = (Array.isArray(items) ? items : []).map((o: { id?: string; name?: string; code?: string; parentId?: string | null }) => ({
        id: String(o.id),
        name: o.name || 'Đơn vị',
        code: o.code || undefined,
        parentId: o.parentId ? String(o.parentId) : undefined,
      }));
      setOrgUnits(orgs);
    } catch (error) {
      console.error('Lỗi tải danh sách đơn vị:', error);
    } finally {
      setLoadingOrgs(false);
    }
  };

  useEffect(() => {
    loadOrgOptions();
  }, []);

  // ---- Build API params from basic FilterBar ----
  const buildApiParams = (fv: Record<string, any>) => {
    const params: Record<string, any> = {};
    if (fv.dateRange?.[0]) params.from = dayjs(fv.dateRange[0]).startOf('day').format('YYYY-MM-DDTHH:mm:ss');
    if (fv.dateRange?.[1]) params.to = dayjs(fv.dateRange[1]).endOf('day').format('YYYY-MM-DDTHH:mm:ss');
    return params;
  };

  // ---- Build full params combining basic + advanced filters ----
  const buildFullParams = () => {
    const params: Record<string, any> = {
      page: page - 1,
      size: pageSize,
      ...buildApiParams(filters),
    };
    if (filterOrgUnit) params.orgUnit = filterOrgUnit;
    if (filterEmail) params.email = filterEmail;
    if (isSelfOnly && username) params.username = username;
    return params;
  };

  // ---- Fetch main data ----
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await logService.listAccessLogs(buildFullParams());
      setData(res.content);
      setTotal(res.totalElements);
    } catch (e: any) {
      setError(e?.message || 'Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  // ---- Effects ----
  useEffect(() => {
    fetchData();
  }, [filters, page, pageSize, filterOrgUnit, filterEmail]);

  // Auto-refresh when navigating back to this page (React Router v6 remounts components)
  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Event handlers ----
  const handleSearch = (values: Record<string, any>) => {
    const email = (values.email || '').trim();
    if (email.length > 255) {
      message.error('Email không được vượt quá 255 ký tự');
      return;
    }
    if (
      values.dateRange?.[0] &&
      values.dateRange?.[1] &&
      dayjs(values.dateRange[0]).isAfter(dayjs(values.dateRange[1]))
    ) {
      message.error('Ngày bắt đầu phải nhỏ hơn ngày kết thúc');
      return;
    }
    loadOrgOptions();
    setFilters(values);
    setFilterOrgUnit(values.orgUnit === '__all__' ? undefined : values.orgUnit || undefined);
    setFilterEmail(email);
    setPage(1);
  };

  const handleReset = () => {
    setFilterValues({ dateRange: [dayjs().startOf('day'), dayjs().endOf('day')], orgUnit: '__all__', email: '' });
    setFilters({ dateRange: [dayjs().startOf('day'), dayjs().endOf('day')] });
    setFilterOrgUnit(undefined);
    setFilterEmail('');
    setPage(1);
  };

  // Giới hạn khoảng thời gian: chỉ chọn trong vòng 1 tháng trở lại, không cho chọn ngày tương lai
  // Measure available height for the table body so its bottom aligns with the
  // filter panel divider (the border-top above the action buttons row). Mirrors the
  // GISChartView pattern: reserve the measured pagination height + the 6px spacer.
  useEffect(() => {
    const el = tableWrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const paginationHeight = el.querySelector<HTMLElement>('.list-view-pagination')
          ?.getBoundingClientRect().height ?? 55;
        const available = entry.contentRect.height - paginationHeight - 6;
        setTableBodyHeight(Math.max(200, Math.floor(available)));
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const disabledDate = (current: Dayjs) => {
    const today = dayjs().startOf('day');
    const minDate = today.subtract(1, 'month');
    return current.isBefore(minDate, 'day') || current.isAfter(today, 'day');
  };

  const handleAdvancedSearch = useCallback(() => {
    setPage(1);
  }, []);

  const handlePageChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
    }
  };

  const openDetail = async (record: AccessLogEntry) => {
    setDetailLoading(true);
    try {
      const full = await logService.getAccessLogById(record.id);
      setSelectedLog(full);
      setModalVisible(true);
    } catch (e: any) {
      message.error('Không thể tải chi tiết log');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setModalVisible(false);
    setSelectedLog(null);
  };

  // ---- DataTable columns ----
  const tableData = data.map((item, idx) => ({
    ...item,
    _rowIndex: (page - 1) * pageSize + idx + 1,
  }));

  // ---- Row actions ----
  const rowActions = useCallback((record: AccessLogEntry) => [
    {
      key: 'view',
      label: 'Xem chi tiết',
      icon: <EyeOutlined />,
      onClick: () => openDetail(record),
    },
  ], []);

  const columns: DataTableColumn[] = [
    {
      key: '_rowIndex',
      label: 'STT',
      dataIndex: '_rowIndex',
      width: 72,
      fixed: 'left' as const,
      type: 'mono' as const,
      align: 'center',
      render: (val: any) => (
        <span style={{ fontSize: fontSizeMd }}>{val}</span>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      dataIndex: 'email',
      width: 260,
      fixed: 'left' as const,
      render: (val: any) =>
        val ? (
          <span style={{ color: textPrimary, fontSize: fontSizeMd }} title={val}>{val}</span>
        ) : (
          <span style={{ color: textTertiary, fontSize: fontSizeMd }}>—</span>
        ),
    },
    {
      key: 'orgUnit',
      label: 'Đơn vị',
      dataIndex: 'orgUnit',
      width: 280,
      render: (val: any) => {
        const name = orgUnits.find((o) => o.id === val)?.name;
        return val ? (
          <span style={{ color: textPrimary, fontSize: fontSizeMd, fontWeight: fontWeightBold }} title={val}>{name || val}</span>
        ) : (
          <span style={{ color: textTertiary, fontSize: fontSizeMd }}>—</span>
        );
      },
    },
    {
      key: 'action',
      label: 'Chức năng',
      width: 240,
      dataIndex: 'action',
      render: (val: any) => (
        <Tooltip title={val}>
          <span style={{ color: textPrimary, fontSize: fontSizeMd, fontWeight: fontWeightBold }}>
            {translateAction(val)}
          </span>
        </Tooltip>
      ),
    },
    {
      key: 'ipAddress',
      label: 'Địa chỉ IP',
      dataIndex: 'ipAddress',
      width: 180,
      render: (val: any) => (
        <span style={{ fontFamily: fontMono, color: textPrimary, fontSize: fontSizeMd }}>
          {val}
        </span>
      ),
    },
    {
      key: 'userAgent',
      label: 'Thông tin trình duyệt',
      dataIndex: 'userAgent',
      width: 300,
      render: (val: any) => {
        if (!val) {
          return <span style={{ color: textTertiary, fontSize: fontSizeMd }}>—</span>;
        }
        return (
          <span style={{ color: textPrimary, fontSize: fontSizeMd, whiteSpace: 'normal', wordBreak: 'break-word', display: 'block', lineHeight: 1.4 }}>
            {val}
          </span>
        );
      },
    },
    {
      key: 'sessionId',
      label: 'Phiên đăng nhập',
      dataIndex: 'sessionId',
      width: 240,
      render: (val: any) => {
        if (!val) {
          return <span style={{ color: textTertiary, fontSize: fontSizeMd }}>—</span>;
        }
        return (
          <span style={{ fontFamily: fontMono, color: textPrimary, fontSize: fontSizeMd, whiteSpace: 'normal', wordBreak: 'break-all', display: 'block', lineHeight: 1.4 }}>
            {val}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      label: 'Ngày truy cập',
      dataIndex: 'createdAt',
      width: 200,
      render: (val: any) => (
        <span style={{ color: textPrimary, fontSize: fontSizeMd, whiteSpace: 'nowrap' }}>
          {val ? dayjs(val).format('DD/MM/YYYY HH:mm:ss') : '—'}
        </span>
      ),
    },
  ];

  // ---- Detail modal fields ----
  const r = selectedLog;

  // ---- Leader view ----
  if (isLeader) {
    return (
      <div style={{ padding: spaceMd }}>
        <ScreenHeader
          breadcrumb={[
            { label: 'Quản trị hệ thống' },
            { label: 'Quản lý log truy cập' },
          ]}
        />
      </div>
    );
  }

  // ---- Render ----
  return (
    <ThemeTokenProvider tokens={themeTokenChk}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
      {/* 1. ScreenHeader */}
      <ScreenHeader
        breadcrumb={[
          { label: 'Quản trị hệ thống' },
          { label: 'Quản lý log truy cập' },
        ]}
      />

      {/* 2. FilterTableLayout — filter panel dọc trái + bảng (chuẩn màn /port) */}
      <FilterTableLayout
        hideFilterToggle
        filterTopOffset={-2}
        onFilterApply={() => handleSearch(filterValues)}
        onFilterReset={handleReset}
        loading={loading}
        error={!!error}
        onRetry={fetchData}
        filterContent={
          <>
            <div style={{ marginBottom: spaceFormField, marginTop: spaceMd }}>
              <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Ngày truy cập <span style={{ color: statusCritical }}>*</span></div>
              <DatePicker.RangePicker
                placeholder={['Từ ngày', 'Đến ngày']}
                allowClear
                format="DD/MM/YYYY"
                value={filterValues.dateRange}
                disabledDate={disabledDate}
                onChange={(dates) => {
                  if (!dates || !dates[0] || !dates[1]) {
                    message.error('Ngày truy cập là bắt buộc');
                    return;
                  }
                  setFilterValues((prev) => ({ ...prev, dateRange: dates }));
                }}
                style={{ width: '100%', borderRadius: radiusPill, height: controlHeight, fontSize: fontSizeMd }}
              />
            </div>
            <div style={{ marginBottom: spaceFormField }}>
              <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Đơn vị quản lý</div>
              <OrgUnitTreeSelect
                organizations={orgUnits}
                placeholder="Chọn đơn vị"
                allowClear
                showPath
                allLabel="Tất cả"
                treeDefaultExpandAll={false}
                value={filterValues.orgUnit || undefined}
                onChange={(val) => setFilterValues((prev) => ({ ...prev, orgUnit: val }))}
                loading={loadingOrgs}
                style={{ borderRadius: radiusPill, height: 40 }}
              />
            </div>
            <div style={{ marginBottom: spaceFormField }}>
              <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Email</div>
              <Input
                placeholder="Tìm theo email..."
                allowClear
                maxLength={255}
                value={filterValues.email}
                onChange={(e) => setFilterValues((prev) => ({ ...prev, email: e.target.value }))}
                onPressEnter={() => handleSearch(filterValues)}
                style={{ width: '100%', borderRadius: radiusPill, height: controlHeight }}
              />
            </div>
          </>
        }
        hideStatusTabs
      >
        <div ref={tableWrapRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
          <style>{`.list-view-table .ant-table-cell { padding-block: 8.5px !important; }`}</style>
          {error ? null : !loading && data.length === 0 ? (
            <DataTable
              fill
              columns={columns}
              dataSource={[]}
              rowKey="id"
              loading={false}
              scroll={{ x: 'max-content', y: tableBodyHeight }}
              emptyState={<EmptyState description="Không có log nào phù hợp với bộ lọc. Thử thay đổi tiêu chí tìm kiếm." />}
            />
          ) : !loading && !error && data.length > 0 ? (
            <DataTable
              fill
              columns={columns}
              dataSource={tableData}
              rowKey="id"
              rowActions={rowActions}
              loading={false}
              scroll={{ x: 'max-content', y: tableBodyHeight }}
              emptyState={<EmptyState description="Không có log nào phù hợp với bộ lọc. Thử thay đổi tiêu chí tìm kiếm." />}
            />
          ) : null}
          <div style={{ height: 6, flexShrink: 0 }} />
          <Pagination
            total={total}
            current={page}
            pageSize={pageSize}
            pageSizeOptions={[10, 20, 50]}
            onChange={handlePageChange}
          />
        </div>
      </FilterTableLayout>

      {/* 7. Detail Drawer — chuẩn màn /port, không chia tab */}
      <Drawer
        {...drawerProps}
        size={1000}
        mask
        title={
          <span style={drawerTitleStyle}>
            Chi tiết log truy cập{r ? ` — ${r.username || r.email || ''}` : ''}
          </span>
        }
        open={modalVisible}
        onClose={closeDetail}
        extra={<Button type="text" onClick={closeDetail} style={drawerCloseBtnStyle}>✕</Button>}
        footer={null}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px' },
        }}
      >
        {detailLoading ? <LoadingSkeleton rows={6} /> : r ? (
          <div style={{ paddingTop: 3 }}>
            <style>{`.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; } .detail-row { display: flex; padding: 10px 12px; border-bottom: 1px solid ${borderDefault}; } .detail-label { width: 200px; flex-shrink: 0; color: ${colors.sidebarBg}; font-weight: ${fontWeightBold}; font-size: ${fontSizeMd}px; } .detail-label::after { content: ':'; margin-left: 2px; } .detail-value { color: ${textPrimary}; font-size: ${fontSizeMd}px; flex: 1; min-width: 0; overflow-wrap: anywhere; } .detail-value-full { grid-column: 1 / -1; }`}</style>
            <div className="detail-grid">
              {[
                ['Đơn vị', orgUnits.find((o) => o.id === r.orgUnit)?.name || r.orgUnit || '—'],
                ['Email', r.email || '—'],
                ['Chức năng', translateAction(r.action)],
                ['Địa chỉ IP', <span style={{ fontFamily: fontMono }}>{r.ipAddress || '—'}</span>],
                ['Thông tin trình duyệt', r.userAgent || '—', true],
                ['Phiên đăng nhập', <span style={{ fontFamily: fontMono, wordBreak: 'break-all' }}>{r.sessionId || '—'}</span>, true],
                ['Ngày truy cập', dayjs(r.createdAt).format('DD/MM/YYYY HH:mm:ss'), true],
              ].map(([label, value, full], i) => (
                <div key={i} className={full ? 'detail-row detail-value-full' : 'detail-row'}>
                  <span className="detail-label">{label}</span>
                  <span className="detail-value">{value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Drawer>
      </div>
    </ThemeTokenProvider>
  );
}

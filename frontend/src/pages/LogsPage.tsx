import { useState, useEffect, useCallback } from 'react';
import { Select, Input, Tag, Tooltip, DatePicker, Drawer, Button } from 'antd';
import { message } from '../components/ToastNotification';
import { EyeOutlined, DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { ScreenHeader, DataTable, Pagination } from '../components/list-view';
import FilterTableLayout from '../components/list-view/FilterTableLayout';
import type { DataTableColumn } from '../components/list-view/DataTable';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import {
  textPrimary, textSecondary, textTertiary, actionPrimary,
  statusOperational, statusAttention, statusCritical,
  spaceFormField, spaceMd, spaceSm, radiusPill, radiusSm,
  fontSizeSm, fontSizeMd,
  fontWeightMedium, fontWeightBold,
  badgeBaseStyle, metaStyle, fontMono, borderDefault, radiusLg, controlHeight,
  drawerProps, drawerTitleStyle, drawerCloseBtnStyle,
} from '../tokens';
import { colors } from '../theme';
import { logService, type AccessLogEntry } from '../services/logService';
import { organizationService } from '../services/organizationService';
import { useAuthStore } from '../store/authStore';

// ── Constants ──────────────────────────────────────────────────────────────────

const TAB_KEYS = ['access', 'login', 'error', 'account', 'configuration'] as const;

const LOG_TYPE_LABEL: Record<string, string> = {
  access: 'Thao tác',
  login: 'Đăng nhập',
  error: 'Lỗi hệ thống',
  account: 'Tài khoản',
  configuration: 'Cấu hình',
};

const TAB_LABELS: Record<string, string> = {
  access: 'Thao tác',
  login: 'Đăng nhập',
  error: 'Lỗi hệ thống',
  account: 'Tài khoản',
  configuration: 'Cấu hình',
};

const TAB_COLORS: Record<string, string> = {
  access: actionPrimary,
  login: '#2A78D6',
  error: statusCritical,
  account: statusAttention,
  configuration: '#E87BA4',
};

const TYPE_OPTIONS = [
  { value: 'access', label: 'Thao tác' },
  { value: 'login', label: 'Đăng nhập' },
  { value: 'error', label: 'Lỗi hệ thống' },
  { value: 'account', label: 'Tài khoản' },
  { value: 'configuration', label: 'Cấu hình' },
];

const SEVERITY_OPTIONS = [
  { value: 'info', label: 'Thông tin' },
  { value: 'warning', label: 'Cảnh báo' },
  { value: 'error', label: 'Lỗi' },
  { value: 'critical', label: 'Nghiêm trọng' },
];

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  SUCCESS: { color: statusOperational, label: 'Thành công' },
  FAILED: { color: statusCritical, label: 'Thất bại' },
  FAILURE: { color: statusCritical, label: 'Thất bại' },
};

const SEVERITY_CONFIG: Record<string, { color: string; label: string }> = {
  info: { color: statusOperational, label: 'Thông tin' },
  warning: { color: statusAttention, label: 'Cảnh báo' },
  error: { color: statusCritical, label: 'Lỗi' },
  critical: { color: statusCritical, label: 'Nghiêm trọng' },
};

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

// ── Helper ──────────────────────────────────────────────────────────────────────

function formatMetadata(metadata: unknown): string {
  if (!metadata) return '';
  try {
    const parsed = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
    return JSON.stringify(parsed, null, 2);
  } catch {
    return String(metadata);
  }
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
  const [activeTab, setActiveTab] = useState('access');
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
  const [orgOptions, setOrgOptions] = useState<{ value: string; label: string }[]>([]);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [filterValues, setFilterValues] = useState<{
    dateRange: [Dayjs | null, Dayjs | null] | null;
    keyword: string;
    severity?: string;
    orgUnit?: string;
    email: string;
  }>({ dateRange: null, keyword: '', severity: undefined, orgUnit: undefined, email: '' });

  // ── Advanced filter state ──────────────────────────────────────
  const [filterSeverity, setFilterSeverity] = useState<string | undefined>();
  const [filterOrgUnit, setFilterOrgUnit] = useState<string | undefined>();
  const [filterEmail, setFilterEmail] = useState('');

  // ---- Advanced filter toggle ----
  const [advancedVisible, setAdvancedVisible] = useState(false);

  // ---- Auth ----
  const user = useAuthStore((s) => s.user);
  const role = user?.role || '';
  const username = user?.username || '';
  const isAdminOp = role === 'ROLE_SECURITY_MONITOR';
  const isLeader = role === 'ROLE_LEADER';
  const isSelfOnly = role && role !== 'ROLE_SYSTEM_ADMIN' && role !== 'ROLE_ADMIN' && !isAdminOp;

  // ---- Role-based tab visibility ----
  const visibleTabKeys = isAdminOp ? (['access', 'login'] as const) : TAB_KEYS;

  // ---- Detail modal state ----
  const [selectedLog, setSelectedLog] = useState<AccessLogEntry | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // ---- Load org options ----
  const loadOrgOptions = () => {
    organizationService.list({ pageSize: 1000 }).then((res) => {
      setOrgOptions(
        res.data.map((o) => ({ value: o.id, label: o.name })),
      );
    });
  };

  useEffect(() => {
    loadOrgOptions();
  }, []);

  // ---- Build API params from basic FilterBar ----
  const buildApiParams = (fv: Record<string, any>) => {
    const params: Record<string, any> = {};
    if (fv.dateRange?.[0]) params.from = dayjs(fv.dateRange[0]).startOf('day').format('YYYY-MM-DDTHH:mm:ss');
    if (fv.dateRange?.[1]) params.to = dayjs(fv.dateRange[1]).endOf('day').format('YYYY-MM-DDTHH:mm:ss');
    if (fv.keyword) params.keyword = fv.keyword;
    return params;
  };

  // ---- Build full params combining basic + advanced filters ----
  const buildFullParams = () => {
    const params: Record<string, any> = {
      page: page - 1,
      size: pageSize,
      type: activeTab,
      ...buildApiParams(filters),
    };
    if (filterSeverity) params.severity = filterSeverity;
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

  // ---- Fetch tab counts ----
  const fetchTabCounts = async () => {
    const baseParams = buildFullParams();
    const counts: Record<string, number> = {};
    await Promise.all(
      visibleTabKeys.map(async (key) => {
        try {
          const res = await logService.listAccessLogs({
            ...baseParams,
            type: key,
            size: 1,
          });
          counts[key] = res.totalElements;
        } catch {
          counts[key] = 0;
        }
      }),
    );
    setTabCounts(counts);
  };

  // ---- Effects ----
  useEffect(() => {
    fetchData();
  }, [filters, page, pageSize, activeTab, filterSeverity, filterOrgUnit, filterEmail]);

  useEffect(() => {
    fetchTabCounts();
  }, [filters, filterSeverity, filterOrgUnit, filterEmail]);

  // Auto-refresh when navigating back to this page (React Router v6 remounts components)
  useEffect(() => {
    fetchData();
    fetchTabCounts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Event handlers ----
  const handleSearch = (values: Record<string, any>) => {
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
    setFilterSeverity(values.severity || undefined);
    setFilterOrgUnit(values.orgUnit || undefined);
    setFilterEmail(values.email || '');
    setPage(1);
  };

  const handleReset = () => {
    setFilterValues({ dateRange: null, keyword: '', severity: undefined, orgUnit: undefined, email: '' });
    setFilters({});
    setFilterSeverity(undefined);
    setFilterOrgUnit(undefined);
    setFilterEmail('');
    setPage(1);
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

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setPage(1);
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

  const handleExport = async () => {
    try {
      message.loading({ content: 'Đang xuất CSV...', key: 'export' });
      const blob = await logService.exportCsv(buildFullParams());
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `access_logs_${dayjs().format('YYYY-MM-DD_HHmmss')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success({ content: 'Xuất CSV thành công', key: 'export' });
    } catch (e: any) {
      message.error({ content: e?.message || 'Xuất CSV thất bại', key: 'export' });
    }
  };

  // ---- Status tabs ----
  const statusTabs = visibleTabKeys.map((key) => ({
    key,
    label: TAB_LABELS[key],
    count: tabCounts[key] ?? 0,
    color: TAB_COLORS[key],
    active: activeTab === key,
  }));

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
      width: 60,
      align: 'center',
      render: (val: any) => (
        <span style={{ fontSize: fontSizeMd }}>{val}</span>
      ),
    },
    {
      key: 'orgUnit',
      label: 'Đơn vị',
      dataIndex: 'orgUnit',
      render: (val: any) =>
        val ? (
          <span style={{ color: textPrimary, fontSize: fontSizeMd }}>{typeof val === 'object' ? val.name : val}</span>
        ) : (
          <span style={{ color: textTertiary, fontSize: fontSizeMd }}>—</span>
        ),
    },
    {
      key: 'action',
      label: 'Chức năng',
      width: 180,
      dataIndex: 'action',
      render: (val: any) => (
        <Tag
          color="blue"
          title={val}
          style={{
            borderRadius: radiusSm,
            fontSize: fontSizeSm,
            fontWeight: fontWeightMedium,
          }}
        >
          {translateAction(val)}
        </Tag>
      ),
    },
    {
      key: 'type',
      label: 'Loại log',
      dataIndex: 'type',
      width: 110,
      render: (val: any) => {
        const label = LOG_TYPE_LABEL[val?.toLowerCase()] || val || '—';
        const color = TAB_COLORS[val?.toLowerCase()] || textTertiary;
        return (
          <span style={{ ...badgeBaseStyle, background: `${color}15`, color: color }}>
            {label}
          </span>
        );
      },
    },
    {
      key: 'severity',
      label: 'Mức độ',
      dataIndex: 'severity',
      width: 110,
      render: (val: any) => {
        const cfg = val ? SEVERITY_CONFIG[val.toLowerCase()] : null;
        return cfg ? (
          <span style={{ ...badgeBaseStyle, background: `${cfg.color}15`, color: cfg.color }}>
            {cfg.label}
          </span>
        ) : (
          <span style={{ color: textTertiary, fontSize: fontSizeMd }}>—</span>
        );
      },
    },
    {
      key: 'status',
      label: 'Trạng thái',
      dataIndex: 'status',
      width: 120,
      render: (val: any) => {
        const cfg = val ? STATUS_CONFIG[val] : null;
        return cfg ? (
          <span style={{ ...badgeBaseStyle, background: `${cfg.color}15`, color: cfg.color }}>
            {cfg.label}
          </span>
        ) : (
          <span style={{ color: textTertiary, fontSize: fontSizeMd }}>—</span>
        );
      },
    },
    {
      key: 'ipAddress',
      label: 'Địa chỉ IP',
      dataIndex: 'ipAddress',
      render: (val: any) => (
        <span style={{ fontFamily: fontMono, color: textSecondary, fontSize: fontSizeMd }}>
          {val}
        </span>
      ),
    },
    {
      key: 'userAgent',
      label: 'Trình duyệt',
      dataIndex: 'userAgent',
      render: (val: any) => {
        if (!val) {
          return <span style={{ color: textTertiary, fontSize: fontSizeMd }}>—</span>;
        }
        const display = val.length > 40 ? `${val.substring(0, 40)}...` : val;
        return (
          <Tooltip title={val}>
            <span style={{ color: textSecondary, fontSize: fontSizeMd }}>{display}</span>
          </Tooltip>
        );
      },
    },
    {
      key: 'sessionId',
      label: 'Phiên đăng nhập',
      dataIndex: 'sessionId',
      render: (val: any) => {
        if (!val) {
          return <span style={{ color: textTertiary, fontSize: fontSizeMd }}>—</span>;
        }
        const display = val.length > 12 ? `${val.substring(0, 12)}...` : val;
        return (
          <Tooltip title={val}>
            <span style={{ fontFamily: fontMono, color: textSecondary, fontSize: fontSizeMd }}>
              {display}
            </span>
          </Tooltip>
        );
      },
    },
    {
      key: 'createdAt',
      label: 'Ngày truy cập',
      dataIndex: 'createdAt',
      render: (val: any) => (
        <span style={{ ...metaStyle, fontSize: fontSizeMd }}>
          {val ? dayjs(val).format('DD/MM/YYYY HH:mm') : '—'}
        </span>
      ),
    },
    {
      key: 'responseCode',
      label: 'Mã',
      dataIndex: 'responseCode',
      width: 70,
      align: 'center',
      render: (val: any) => {
        if (val == null) return <span style={{ color: textTertiary, fontSize: fontSizeMd }}>—</span>;
        const isSuccess = val >= 200 && val < 400;
        return (
          <Tag
            color={isSuccess ? 'green' : 'red'}
            style={{
              borderRadius: radiusSm,
              fontSize: fontSizeSm,
              fontWeight: fontWeightMedium,
              fontFamily: fontMono,
              margin: 0,
            }}
          >
            {val}
          </Tag>
        );
      },
    },
  ];

  // ---- Detail modal fields ----
  const r = selectedLog;
  const severityEntry = r && r.severity ? SEVERITY_CONFIG[r.severity.toLowerCase()] : null;

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
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
      {/* 1. ScreenHeader */}
      <ScreenHeader
        breadcrumb={[
          { label: 'Quản trị hệ thống' },
          { label: 'Quản lý log truy cập' },
        ]}
        actions={[
          { key: 'export', label: 'Xuất CSV', icon: <DownloadOutlined />, variant: 'outline', onClick: handleExport },
        ]}
      />

      {/* 2. FilterTableLayout — filter panel dọc trái + StatusTabs + bảng (chuẩn màn /port) */}
      <FilterTableLayout
        filterCollapsed={advancedVisible}
        onToggleCollapse={() => setAdvancedVisible((v) => !v)}
        onFilterApply={() => handleSearch(filterValues)}
        onFilterReset={handleReset}
        loading={loading}
        error={!!error}
        onRetry={fetchData}
        filterContent={
          <>
            <div style={{ marginBottom: spaceFormField, marginTop: spaceMd }}>
              <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Khoảng thời gian</div>
              <DatePicker.RangePicker
                placeholder={['Từ ngày', 'Đến ngày']}
                allowClear
                value={filterValues.dateRange}
                onChange={(dates) => setFilterValues((prev) => ({ ...prev, dateRange: dates }))}
                style={{ width: '100%', borderRadius: radiusPill, height: controlHeight, fontSize: fontSizeMd }}
              />
            </div>
            <div style={{ marginBottom: spaceFormField }}>
              <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Từ khóa</div>
              <Input
                placeholder="Tìm kiếm theo nội dung..."
                allowClear
                value={filterValues.keyword}
                onChange={(e) => setFilterValues((prev) => ({ ...prev, keyword: e.target.value }))}
                onPressEnter={() => handleSearch(filterValues)}
                style={{ width: '100%', borderRadius: radiusPill, height: controlHeight }}
              />
            </div>
            {advancedVisible && (
              <>
                <div style={{ marginBottom: spaceFormField }}>
                  <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Mức độ</div>
                  <Select
                    placeholder="Chọn mức độ"
                    allowClear
                    value={filterValues.severity}
                    onChange={(val) => setFilterValues((prev) => ({ ...prev, severity: val }))}
                    options={SEVERITY_OPTIONS}
                    style={{ width: '100%', borderRadius: radiusPill, height: controlHeight }}
                  />
                </div>
                <div style={{ marginBottom: spaceFormField }}>
                  <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Đơn vị</div>
                  <Select
                    placeholder="Chọn đơn vị"
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    value={filterValues.orgUnit}
                    onChange={(val) => setFilterValues((prev) => ({ ...prev, orgUnit: val }))}
                    options={orgOptions}
                    style={{ width: '100%', borderRadius: radiusPill, height: controlHeight }}
                  />
                </div>
                <div style={{ marginBottom: spaceFormField }}>
                  <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Email</div>
                  <Input
                    placeholder="Tìm theo email..."
                    allowClear
                    value={filterValues.email}
                    onChange={(e) => setFilterValues((prev) => ({ ...prev, email: e.target.value }))}
                    style={{ width: '100%', borderRadius: radiusPill, height: controlHeight }}
                  />
                </div>
              </>
            )}
          </>
        }
        statusTabs={statusTabs}
        onStatusTabChange={handleTabChange}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
          <style>{`.logs-pagination-compact .list-view-pagination { padding-top: 20px !important; padding-bottom: 0 !important; } .logs-pagination-compact .list-view-pagination button { width: 40px !important; height: 40px !important; } .logs-pagination-compact .list-view-pagination .ant-select { height: 40px !important; }`}</style>
          <DataTable
            fill
            columns={columns}
            dataSource={tableData}
            rowKey="id"
            rowActions={rowActions}
            scroll={{ x: 1400, y: 400 }}
            emptyState={<EmptyState description="Không có log nào phù hợp với bộ lọc. Thử thay đổi tiêu chí tìm kiếm." />}
          />
          <div className="logs-pagination-compact" style={{ height: 55, overflow: 'visible', marginBottom: 8 }}>
            <Pagination
              total={total}
              current={page}
              pageSize={pageSize}
              pageSizeOptions={[10, 20, 50]}
              onChange={handlePageChange}
            />
          </div>
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
                ['Thời gian', dayjs(r.createdAt).format('DD/MM/YYYY HH:mm:ss')],
                ['Người dùng', r.username || '—'],
                ['Email', r.email || '—'],
                ['Đơn vị', r.orgUnit || '—'],
                ['Hành động', translateAction(r.action)],
                ['Loại log', LOG_TYPE_LABEL[r.type?.toLowerCase()] || r.type || '—'],
                ['Mức độ', severityEntry ? (
                  <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${severityEntry.color}15`, color: severityEntry.color }}>{severityEntry.label}</span>
                ) : '—'],
                ['Trạng thái', r.status ? (
                  <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${(r.status === 'SUCCESS' ? statusOperational : statusCritical)}15`, color: r.status === 'SUCCESS' ? statusOperational : statusCritical }}>{r.status === 'SUCCESS' ? 'Thành công' : 'Thất bại'}</span>
                ) : '—'],
                ['Địa chỉ IP', <span style={{ fontFamily: fontMono }}>{r.ipAddress}</span>],
                ['Mã phản hồi', r.responseCode != null && r.responseCode >= 200 && r.responseCode < 400 ? (
                  <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${statusOperational}15`, color: statusOperational }}>{r.responseCode}</span>
                ) : (
                  <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${statusCritical}15`, color: statusCritical }}>{r.responseCode ?? '—'}</span>
                )],
              ].map(([label, value], i) => (
                <div key={i} className="detail-row">
                  <span className="detail-label">{label}</span>
                  <span className="detail-value">{value}</span>
                </div>
              ))}
              <div className="detail-row detail-value-full">
                <span className="detail-label">Thời gian xử lý</span>
                <span className="detail-value">{r.durationMs != null ? `${r.durationMs}ms` : '—'}</span>
              </div>
              <div className="detail-row detail-value-full">
                <span className="detail-label">Đường dẫn</span>
                <span className="detail-value"><span style={{ fontFamily: fontMono }}>{r.requestPath || '—'}</span></span>
              </div>
              <div className="detail-row detail-value-full">
                <span className="detail-label">Nội dung</span>
                <span className="detail-value">{r.detail || '—'}</span>
              </div>
              {r.metadata && (
                <div className="detail-row detail-value-full">
                  <span className="detail-label">Metadata</span>
                  <span className="detail-value">
                    <pre style={{ fontFamily: fontMono, fontSize: fontSizeSm, maxHeight: 200, overflow: 'auto', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {formatMetadata(r.metadata)}
                    </pre>
                  </span>
                </div>
              )}
              <div className="detail-row detail-value-full">
                <span className="detail-label">Phiên đăng nhập</span>
                <span className="detail-value"><span style={{ fontFamily: fontMono, wordBreak: 'break-all' }}>{r.sessionId || '—'}</span></span>
              </div>
              <div className="detail-row detail-value-full">
                <span className="detail-label">Trình duyệt</span>
                <span className="detail-value">{r.userAgent || '—'}</span>
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { Modal, Descriptions, Select, Input, Tag, Button, message, Row, Col, Statistic, Tooltip } from 'antd';
import { EyeOutlined, DownloadOutlined, DownOutlined, UpOutlined, SearchOutlined, FileTextOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { ScreenHeader, FilterBar, StatusTabs, DataTable, Pagination } from '../components/list-view';
import type { DataTableColumn } from '../components/list-view/DataTable';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import {
  textPrimary, textSecondary, textTertiary, surfaceCard, actionPrimary,
  statusOperational, statusAttention, statusCritical,
  spaceFormField, spaceMd, spaceSm, radiusPill, radiusSm,
  fontSizeSm, fontSizeMd, fontSizeLg, fontSizeXl,
  fontWeightMedium, fontWeightBold,
  badgeBaseStyle, metaStyle, fontMono, borderDefault, cardStyle, radiusLg,
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
  STATIONS: 'nhà trạm',
  LIGHTHOUSE_STATION: 'nhà trạm đèn biển',
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

  // ---- Daily statistics ----
  const [dailyStats, setDailyStats] = useState<{ total: number; success: number; failed: number } | null>(null);

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
    fetchDailyStats();
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

  // ---- Fetch daily stats ----
  const fetchDailyStats = async () => {
    try {
      const data = await logService.getDailyStats();
      let success = 0, failed = 0;
      data.forEach((item) => {
        if (item.status === 'SUCCESS') success = item.count;
        else failed += item.count;
      });
      setDailyStats({ total: success + failed, success, failed });
    } catch { setDailyStats(null); }
  };

  // ---- Render stats ----
  const renderStats = () => {
    if (!dailyStats) return null;
    const items = [
      { label: 'Tổng số log', value: dailyStats.total, icon: <FileTextOutlined />, color: actionPrimary },
      { label: 'Thành công', value: dailyStats.success, icon: <CheckCircleOutlined />, color: statusOperational },
      { label: 'Thất bại', value: dailyStats.failed, icon: <CloseCircleOutlined />, color: statusCritical },
    ];
    return (
      <Row gutter={[spaceMd, spaceMd]} style={{ marginBottom: spaceSm }}>
        {items.map((item) => (
          <Col xs={8} sm={8} md={8} key={item.label}>
            <div style={{
              background: surfaceCard,
              borderRadius: radiusLg,
              border: `0.5px solid ${borderDefault}`,
              padding: `${spaceMd}px ${spaceMd}px`,
              display: 'flex',
              alignItems: 'center',
              gap: spaceMd,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: radiusSm,
                background: `${item.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, color: item.color,
              }}>
                {item.icon}
              </div>
              <div>
                <div style={{ color: colors.sidebarBg, fontSize: fontSizeMd, fontWeight: fontWeightBold }}>
                  {item.label}
                </div>
                <div style={{ color: item.color, fontSize: fontSizeXl, fontWeight: fontWeightBold, lineHeight: 1.2 }}>
                  {item.value.toLocaleString()}
                </div>
              </div>
            </div>
          </Col>
        ))}
      </Row>
    );
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
        {renderStats()}
      </div>
    );
  }

  // ---- Render ----
  return (
    <div style={{ minHeight: '100%', marginTop: -8 }}>
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

      {/* 2. Aggregate stats */}
      {renderStats()}

      {/* 3. FilterBar */}
      <FilterBar
        fields={advancedVisible ? [
          {
            key: 'dateRange',
            type: 'dateRange',
            label: 'Khoảng thời gian',
            placeholder: 'Từ ngày - Đến ngày',
          } as any,
          {
            key: 'keyword',
            type: 'search',
            label: 'Từ khóa',
            placeholder: 'Tìm kiếm...',
          },
          {
            key: 'severity',
            type: 'select',
            label: 'Mức độ',
            placeholder: 'Chọn mức độ',
            options: SEVERITY_OPTIONS,
          },
          {
            key: 'orgUnit',
            type: 'select',
            label: 'Đơn vị',
            placeholder: 'Chọn đơn vị',
            options: orgOptions,
          },
          {
            key: 'email',
            type: 'search',
            label: 'Email',
            placeholder: 'Tìm theo email...',
          },
        ] : [
          {
            key: 'dateRange',
            type: 'dateRange',
            label: 'Khoảng thời gian',
            placeholder: 'Từ ngày - Đến ngày',
          } as any,
          {
            key: 'keyword',
            type: 'search',
            label: 'Từ khóa',
            placeholder: 'Tìm kiếm...',
          },
        ]}
        onSearch={handleSearch}
        onReset={handleReset}
      />

      {/* 4. StatusTabs + Bộ lọc nâng cao */}
      <div
        style={{
          ...cardStyle,
          marginBottom: spaceSm,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '8px 16px',
          position: 'relative',
        }}
      >
        <StatusTabs tabs={statusTabs} onChange={handleTabChange} />
        <Button
          type="link"
          size="small"
          icon={advancedVisible ? <UpOutlined /> : <DownOutlined />}
          onClick={() => setAdvancedVisible((v) => { if (v) { setFilterSeverity(undefined); setFilterOrgUnit(undefined); setFilterEmail(''); } return !v; })}
          style={{
            position: 'absolute',
            right: 16,
            color: actionPrimary,
            fontSize: fontSizeMd,
            fontWeight: fontWeightMedium,
            padding: 0,
          }}
        >
          {advancedVisible ? 'Ẩn bộ lọc nâng cao' : 'Bộ lọc nâng cao'}
        </Button>
      </div>

      {/* 5. Table */}
      <div style={{ ...cardStyle, padding: '8px 16px' }}>
        {loading ? (
          <LoadingSkeleton rows={8} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : data.length === 0 ? (
          <EmptyState description="Không có log nào phù hợp với bộ lọc. Thử thay đổi tiêu chí tìm kiếm." />
        ) : (
          <>
            <DataTable
              columns={columns}
              dataSource={tableData}
              rowKey="id"
              rowActions={rowActions}
              scroll={{ x: 1200, y: 500 }}
            />
            <Pagination
              total={total}
              current={page}
              pageSize={pageSize}
              pageSizeOptions={[10, 20, 50]}
              onChange={handlePageChange}
            />
          </>
        )}
      </div>

      {/* 7. Detail Modal */}
      <Modal
        title={<span style={{ color: actionPrimary, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Chi tiết log truy cập</span>}
        open={modalVisible}
        onCancel={closeDetail}
        footer={null}
        width={700}
        styles={{ body: { padding: spaceMd, maxHeight: '68vh', overflowY: 'auto' } }}
      >
        {detailLoading ? <LoadingSkeleton rows={6} /> : r ? (
          <Descriptions column={2} size="small" bordered labelStyle={{ width: 150 }}>
            <Descriptions.Item label="Thời gian">{dayjs(r.createdAt).format('DD/MM/YYYY HH:mm:ss')}</Descriptions.Item>
            <Descriptions.Item label="Loại log">
              <Tag color="blue">{LOG_TYPE_LABEL[r.type?.toLowerCase()] || r.type || '—'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Mức độ">
              {severityEntry ? (
                <span style={{ ...badgeBaseStyle, background: `${severityEntry.color}15`, color: severityEntry.color }}>{severityEntry.label}</span>
              ) : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {r.status ? (
                <Tag color={r.status === 'SUCCESS' ? 'green' : 'red'}>{r.status === 'SUCCESS' ? 'Thành công' : 'Thất bại'}</Tag>
              ) : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Người dùng">{r.username || '—'}</Descriptions.Item>
            <Descriptions.Item label="Email">{r.email || '—'}</Descriptions.Item>
            <Descriptions.Item label="Đơn vị">{r.orgUnit || '—'}</Descriptions.Item>
            <Descriptions.Item label="Hành động">{translateAction(r.action)}</Descriptions.Item>
            <Descriptions.Item label="Địa chỉ IP"><span style={{ fontFamily: fontMono }}>{r.ipAddress}</span></Descriptions.Item>
            <Descriptions.Item label="Trình duyệt">{r.userAgent || '—'}</Descriptions.Item>
            <Descriptions.Item label="Phiên đăng nhập"><span style={{ fontFamily: fontMono }}>{r.sessionId || '—'}</span></Descriptions.Item>
            <Descriptions.Item label="Đường dẫn"><span style={{ fontFamily: fontMono }}>{r.requestPath || '—'}</span></Descriptions.Item>
            <Descriptions.Item label="Mã phản hồi">
              <Tag color={r.responseCode != null && r.responseCode >= 200 && r.responseCode < 400 ? 'green' : 'red'}>{r.responseCode ?? '—'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian xử lý">{r.durationMs != null ? `${r.durationMs}ms` : '—'}</Descriptions.Item>
            <Descriptions.Item label="Nội dung" span={2}>{r.detail || '—'}</Descriptions.Item>
            {r.metadata && (
              <Descriptions.Item label="Metadata" span={2}>
                <pre style={{ fontFamily: fontMono, fontSize: fontSizeSm, maxHeight: 200, overflow: 'auto', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {formatMetadata(r.metadata)}
                </pre>
              </Descriptions.Item>
            )}
          </Descriptions>
        ) : null}
      </Modal>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Typography, Modal, Form, Input, Tag, Button, Spin, Alert, message, Tooltip, Row, Col, Grid, Statistic } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { ScreenHeader, FilterBar, StatusTabs, DataTable, Pagination } from '../components/list-view';
import type { DataTableColumn } from '../components/list-view/DataTable';
import {
  textPrimary, textSecondary, textTertiary, surfaceCard, actionPrimary,
  statusOperational, statusAttention, statusCritical,
  spaceFormField, spaceMd, spaceSm, radiusPill, radiusSm,
  fontSizeSm, fontSizeMd, fontSizeLg, fontSizeXl,
  fontWeightMedium, fontWeightBold,
  badgeBaseStyle, metaStyle, fontMono, borderDefault,
} from '../tokens';
import { colors } from '../theme';
import { logService, type AccessLogEntry } from '../services/logService';
import { organizationService } from '../services/organizationService';
import { useAuthStore } from '../store/authStore';

const { Text } = Typography;

const labelProps = (text: string) => ({ label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span> });

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

  // ---- Auth ----
  const user = useAuthStore((s) => s.user);
  const role = user?.role || '';
  const username = user?.username || '';
  const isAdminOp = role === 'ROLE_SECURITY_MONITOR';
  const isLeader = role === 'ROLE_LEADER';
  const isSelfOnly = role && role !== 'ROLE_SYSTEM_ADMIN' && role !== 'ROLE_ADMIN' && !isAdminOp;

  // ---- Role-based tab visibility ----
  const visibleTabKeys = isAdminOp ? (['access', 'login'] as const) : TAB_KEYS;

  // ---- Aggregate statistics ----
  const [aggregate, setAggregate] = useState<{ totalAccesses: number; uniqueUsers: number;   successRate: string; avgDuration: number } | null>(null);

  // ---- Detail modal state ----
  const [selectedLog, setSelectedLog] = useState<AccessLogEntry | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();
  const isMobile = !screens.md;

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

  // ---- Build API params from filters ----
  const buildApiParams = (fv: Record<string, any>) => {
    const params: Record<string, any> = {};
    if (fv.dateRange?.[0]) {
      params.from = dayjs(fv.dateRange[0]).startOf('day').format('YYYY-MM-DDTHH:mm:ss');
    }
    if (fv.dateRange?.[1]) {
      params.to = dayjs(fv.dateRange[1]).endOf('day').format('YYYY-MM-DDTHH:mm:ss');
    }
    if (fv.orgUnit) params.orgUnit = fv.orgUnit;
    if (fv.email) params.email = fv.email;
    if (fv.keyword) params.keyword = fv.keyword;
    if (isSelfOnly && username) {
      params.username = username;
    }
    return params;
  };

  // ---- Fetch main data ----
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {
        page: page - 1,
        size: pageSize,
        type: activeTab,
        ...buildApiParams(filters),
      };
      const res = await logService.listAccessLogs(params);
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
    const baseParams = buildApiParams(filters);
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
  }, [filters, page, pageSize, activeTab]);

  useEffect(() => {
    fetchTabCounts();
  }, [filters]);

  // Auto-refresh when navigating back to this page (React Router v6 remounts components)
  useEffect(() => {
    fetchData();
    fetchTabCounts();
    fetchAggregate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Event handlers ----
  const handleSearch = (values: Record<string, any>) => {
    // Validate date range
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
    setPage(1);
  };

  const handleReset = () => {
    setFilters({});
    setPage(1);
  };

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

  // ---- Fetch aggregate stats ----
  const fetchAggregate = async () => {
    try {
      const data = await logService.getLogAggregate();
      if (data && data.length > 0) {
        setAggregate(data[data.length - 1]); // latest aggregate
      }
    } catch { /* silent */ }
  };

  // ---- Render aggregate stats ----
  const renderAggregateStats = () => {
    if (!aggregate) return null;
    return (
      <Row gutter={[spaceMd, spaceMd]} style={{ marginBottom: spaceMd }}>
        <Col xs={12} sm={12} md={6}>
          <div style={{ background: surfaceCard, borderRadius: radiusSm, padding: spaceMd, textAlign: 'center' }}>
            <Statistic
              title={<span style={{ color: textSecondary, fontSize: fontSizeSm }}>Tổng lượt truy cập</span>}
              value={aggregate.totalAccesses}
              valueStyle={{ color: textPrimary, fontSize: fontSizeXl }}
            />
          </div>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <div style={{ background: surfaceCard, borderRadius: radiusSm, padding: spaceMd, textAlign: 'center' }}>
            <Statistic
              title={<span style={{ color: textSecondary, fontSize: fontSizeSm }}>Người dùng duy nhất</span>}
              value={aggregate.uniqueUsers}
              valueStyle={{ color: textPrimary, fontSize: fontSizeXl }}
            />
          </div>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <div style={{ background: surfaceCard, borderRadius: radiusSm, padding: spaceMd, textAlign: 'center' }}>
            <Statistic
              title={<span style={{ color: textSecondary, fontSize: fontSizeSm }}>Tỷ lệ thành công</span>}
              value={aggregate.successRate}
              suffix="%"
              valueStyle={{ color: textPrimary, fontSize: fontSizeXl }}
            />
          </div>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <div style={{ background: surfaceCard, borderRadius: radiusSm, padding: spaceMd, textAlign: 'center' }}>
            <Statistic
              title={<span style={{ color: textSecondary, fontSize: fontSizeSm }}>Thời gian phản hồi TB</span>}
              value={aggregate.avgDuration}
              suffix="ms"
              valueStyle={{ color: textPrimary, fontSize: fontSizeXl }}
            />
          </div>
        </Col>
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
      key: 'actions',
      label: 'Thao tác',
      width: 80,
      align: 'center',
      render: (_val: any, record: any) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          style={{ color: actionPrimary }}
          onClick={() => openDetail(record as AccessLogEntry)}
        />
      ),
    },
  ];

  // ---- Empty state ----
  const emptyState = (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <Text style={{ color: textSecondary, fontSize: fontSizeMd }}>
        Không có log nào phù hợp với bộ lọc. Thử thay đổi tiêu chí tìm kiếm.
      </Text>
    </div>
  );

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
        {renderAggregateStats()}
      </div>
    );
  }

  // ---- Render ----
  return (
    <div style={{ padding: spaceMd }}>
      {/* 1. ScreenHeader */}
      <ScreenHeader
        breadcrumb={[
          { label: 'Quản trị hệ thống' },
          { label: 'Quản lý log truy cập' },
        ]}
      />

      {/* 2. Aggregate stats */}
      {renderAggregateStats()}

      {/* 3. FilterBar */}
      <FilterBar
        fields={[
          {
            key: 'dateRange',
            type: 'dateRange',
            label: 'Khoảng thời gian',
            placeholder: 'Từ ngày - Đến ngày',
          } as any,
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

      {/* 4. StatusTabs */}
      <div style={{ marginBottom: spaceMd }}>
        <StatusTabs tabs={statusTabs} onChange={handleTabChange} />
      </div>

      {/* Error state */}
      {error && (
        <Alert
          type="error"
          message="Lỗi tải dữ liệu"
          description={error}
          showIcon
          style={{ marginBottom: spaceMd }}
          action={
            <Button
              size="small"
              style={{ color: actionPrimary }}
              onClick={fetchData}
            >
              Thử lại
            </Button>
          }
        />
      )}

      {/* 5. DataTable */}
      <DataTable
        columns={columns}
        dataSource={tableData}
        rowKey="id"
        loading={loading}
        emptyState={emptyState}
      />

      {/* 6. Pagination */}
      <Pagination
        total={total}
        current={page}
        pageSize={pageSize}
        pageSizeOptions={[10, 20, 50]}
        onChange={handlePageChange}
      />

      {/* 7. Detail Modal */}
      <Modal
        open={modalVisible}
        onCancel={closeDetail}
        footer={
          <Button
            style={{
              borderRadius: radiusPill,
              height: 40,
              fontSize: fontSizeMd,
              borderColor: borderDefault,
              color: textSecondary,
            }}
            onClick={closeDetail}
          >
            Đóng
          </Button>
        }
        title={
          <span
            style={{
              color: colors.sidebarBg,
              fontWeight: fontWeightBold,
              fontSize: fontSizeLg,
            }}
          >
            Chi tiết log truy cập
          </span>
        }
        width={isMobile ? '90vw' : 800}
        destroyOnClose
      >
        <div style={{ borderTop: `1px solid ${borderDefault}`, marginBottom: spaceMd }} />
        <Spin spinning={detailLoading}>
          <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: spaceSm }}>
            {r && (
            <Form layout="vertical">
              {/* Row 1 */}
              <Row gutter={spaceMd}>
                <Col span={12}>
                  <Form.Item {...labelProps('Thời gian')} style={{ marginBottom: spaceFormField }}>
                    <Input readOnly value={dayjs(r.createdAt).format('DD/MM/YYYY HH:mm:ss')} style={{ borderRadius: radiusPill, height: 40 }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item {...labelProps('Loại log')} style={{ marginBottom: spaceFormField }}>
                    <Input readOnly value={LOG_TYPE_LABEL[r.type?.toLowerCase()] || r.type || 'N/A'} style={{ borderRadius: radiusPill, height: 40 }} />
                  </Form.Item>
                </Col>
              </Row>

              {/* Row 2 */}
              <Row gutter={spaceMd}>
                <Col span={12}>
                  <Form.Item {...labelProps('Mức độ')} style={{ marginBottom: spaceFormField }}>
                    {severityEntry ? (
                      <span style={{ ...badgeBaseStyle, background: `${severityEntry.color}15`, color: severityEntry.color }}>
                        {severityEntry.label}
                      </span>
                    ) : (
                      <span style={{ ...badgeBaseStyle, background: `${textTertiary}15`, color: textTertiary }}>{r.severity || 'N/A'}</span>
                    )}
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item {...labelProps('Người dùng')} style={{ marginBottom: spaceFormField }}>
                    <Input readOnly value={r.username} style={{ borderRadius: radiusPill, height: 40 }} />
                  </Form.Item>
                </Col>
              </Row>

              {/* Row 3 */}
              <Row gutter={spaceMd}>
                <Col span={12}>
                  <Form.Item {...labelProps('Email')} style={{ marginBottom: spaceFormField }}>
                    <Input readOnly value={r.email || 'N/A'} style={{ borderRadius: radiusPill, height: 40 }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item {...labelProps('Đơn vị')} style={{ marginBottom: spaceFormField }}>
                    <Input readOnly value={r.orgUnit || 'N/A'} style={{ borderRadius: radiusPill, height: 40 }} />
                  </Form.Item>
                </Col>
              </Row>

              {/* Row 4 */}
              <Row gutter={spaceMd}>
                <Col span={12}>
                  <Form.Item {...labelProps('Địa chỉ IP')} style={{ marginBottom: spaceFormField }}>
                    <Input readOnly value={r.ipAddress} style={{ borderRadius: radiusPill, height: 40, fontFamily: fontMono }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item {...labelProps('Trình duyệt')} style={{ marginBottom: spaceFormField }}>
                    <Input readOnly value={r.userAgent || 'N/A'} style={{ borderRadius: radiusPill, height: 40 }} />
                  </Form.Item>
                </Col>
              </Row>

              {/* Row 5 */}
              <Row gutter={spaceMd}>
                <Col span={12}>
                  <Form.Item {...labelProps('Phiên đăng nhập')} style={{ marginBottom: spaceFormField }}>
                    <Input readOnly value={r.sessionId || 'N/A'} style={{ borderRadius: radiusPill, height: 40, fontFamily: fontMono }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item {...labelProps('Hành động')} style={{ marginBottom: spaceFormField }}>
                    <Input readOnly value={translateAction(r.action)} style={{ borderRadius: radiusPill, height: 40 }} />
                  </Form.Item>
                </Col>
              </Row>

              {/* Row 6 */}
              <Row gutter={spaceMd}>
                <Col span={12}>
                  <Form.Item {...labelProps('Đường dẫn')} style={{ marginBottom: spaceFormField }}>
                    <Input readOnly value={r.requestPath || 'N/A'} style={{ borderRadius: radiusPill, height: 40, fontFamily: fontMono }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item {...labelProps('Mã phản hồi')} style={{ marginBottom: spaceFormField }}>
                    <Input readOnly value={r.responseCode != null ? String(r.responseCode) : 'N/A'} style={{ borderRadius: radiusPill, height: 40, fontFamily: fontMono }} />
                  </Form.Item>
                </Col>
              </Row>

              {/* Row 7 */}
              <Row gutter={spaceMd}>
                <Col span={12}>
                  <Form.Item {...labelProps('Thời gian xử lý')} style={{ marginBottom: spaceFormField }}>
                    <Input readOnly value={r.durationMs != null ? `${r.durationMs}ms` : 'N/A'} style={{ borderRadius: radiusPill, height: 40 }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item {...labelProps('Nội dung')} style={{ marginBottom: spaceFormField }}>
                    <Input readOnly value={r.detail || 'N/A'} style={{ borderRadius: radiusPill, height: 40 }} />
                  </Form.Item>
                </Col>
              </Row>


              {/* Metadata */}
              <Form.Item {...labelProps('Metadata')} style={{ marginBottom: 0 }}>
                {r.metadata ? (
                  <pre
                    style={{
                      fontFamily: fontMono,
                      fontSize: fontSizeSm,
                      maxHeight: 200,
                      overflow: 'auto',
                      background: surfaceCard,
                      padding: spaceSm,
                      borderRadius: radiusSm,
                      border: `0.5px solid ${borderDefault}`,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      margin: 0,
                    }}
                  >
                    {formatMetadata(r.metadata)}
                  </pre>
                ) : (
                  <Text style={{ color: textTertiary, fontSize: fontSizeMd }}>
                    N/A
                  </Text>
                )}
              </Form.Item>
            </Form>
          )}
        </div>
      </Spin>
      </Modal>
    </div>
  );
}

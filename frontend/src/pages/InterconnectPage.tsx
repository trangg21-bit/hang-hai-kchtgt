import { useState, useCallback, useEffect, useMemo } from 'react';
import { Modal, Form, Input, Select, Button, Spin, Alert, Typography, Drawer, Row, Col } from 'antd';
import { EyeOutlined, EditOutlined, HistoryOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { ScreenHeader, DataTable, Pagination } from '../components/list-view';
import FilterTableLayout from '../components/list-view/FilterTableLayout';
import api from '../services/api';
import { OrgUnitTreeSelect } from '../components/org-unit';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import { interconnectService } from '../services/interconnectService';
import type {
  IntegrationConnection,
  IntegrationTransaction,
  DataSharingLog,
} from '../services/interconnectService';
import {
  statusOperational,
  statusDraft,
  statusCritical,
  textSecondary,
  textTertiary,
  borderDefault,
  fontSizeSm,
  fontSizeMd,
  fontSizeLg,
  fontWeightBold,
  spaceXs,
  spaceFormField,
  spaceSm,
  spaceMd,
  radiusPill,
  radiusMd,
  statusBadgeStyle,
  fontMono,
  drawerProps,
  drawerTitleStyle,
  drawerCloseBtnStyle,
  drawerFooterStyle,
  primaryButtonStyle,
  outlineButtonStyle,
  requiredMarkStyle,
  selectStyle,
  inputStyle,
} from '../themetokenchk';
import { colors } from '../themetokenchk';
import * as themeTokenChk from '../themetokenchk';
import { ThemeTokenProvider } from '../context/ThemeTokenContext';
import toast from '../components/ToastNotification';

// ============================================================
// Types
// ============================================================
type SeqRecord<T> = T & { _seq: number };

type ExchangeType = 'integration' | 'sharing';

// ============================================================
// Status display config
// ============================================================
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Sử dụng', color: statusOperational },
  INACTIVE: { label: 'Không sử dụng', color: statusDraft },
  'Thanh cong': { label: 'Thành công', color: statusOperational },
  'That bai': { label: 'Thất bại', color: statusCritical },
};

function renderStatusTag(status: string) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: textTertiary };
  return <span style={statusBadgeStyle(cfg.color)}>{cfg.label}</span>;
}

// ============================================================
// Page Component
// ============================================================
export default function InterconnectPage() {
  const [exchangeType, setExchangeType] = useState<ExchangeType>('integration');

  // --------------------------------------------------
  // Integration state
  // --------------------------------------------------
  const [integrations, setIntegrations] = useState<IntegrationConnection[]>([]);
  const [integrationsLoading, setIntegrationsLoading] = useState(false);
  const [integrationsError, setIntegrationsError] = useState<string | null>(null);
  // Bộ lọc dùng chung cho cả 2 loại trao đổi (Tích hợp dữ liệu / Chia sẻ dữ liệu)
  const [filters, setFilters] = useState<{ connectionName: string; senderOrgId: string; status: string }>({
    connectionName: '',
    senderOrgId: '',
    status: '',
  });

  const [orgUnits, setOrgUnits] = useState<{ id: string; name: string; code?: string; parentId?: string }[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  const loadOrgOptions = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadOrgOptions();
  }, [loadOrgOptions]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Transaction history drawer
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [historyConnectionName, setHistoryConnectionName] = useState('');
  const [transactions, setTransactions] = useState<IntegrationTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [txPage, setTxPage] = useState(1);
  const [txPageSize, setTxPageSize] = useState(20);

  // --------------------------------------------------
  // Edit connection drawer
  // --------------------------------------------------
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<IntegrationConnection | null>(null);
  const [editForm] = Form.useForm();
  const [editSubmitting, setEditSubmitting] = useState(false);

  // --------------------------------------------------
  // View content modal
  // --------------------------------------------------
  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [contentTitle, setContentTitle] = useState('');
  const [contentData, setContentData] = useState('');
  const [contentLoading, setContentLoading] = useState(false);

  // --------------------------------------------------
  // Sharing state
  // --------------------------------------------------
  const [sharingLogs, setSharingLogs] = useState<DataSharingLog[]>([]);
  const [sharingLoading, setSharingLoading] = useState(false);
  const [sharingError, setSharingError] = useState<string | null>(null);
  const [sharingDetailDrawerOpen, setSharingDetailDrawerOpen] = useState(false);
  const [sharingDetail, setSharingDetail] = useState<DataSharingLog | null>(null);
  const [sharingDetailLoading, setSharingDetailLoading] = useState(false);

  // ============================================================
  // Data fetching
  // ============================================================

  const fetchIntegrations = useCallback(async () => {
    setIntegrationsLoading(true);
    setIntegrationsError(null);
    try {
      const data = await interconnectService.listIntegrations({});
      setIntegrations(data);
      setPage(1);
    } catch (err: unknown) {
      setIntegrationsError(err instanceof Error ? err.message : 'Không thể tải danh sách kết nối');
    } finally {
      setIntegrationsLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async (connectionId: string) => {
    setSelectedConnectionId(connectionId);
    setTransactionsLoading(true);
    setTransactionsError(null);
    try {
      const data = await interconnectService.getTransactionHistory(connectionId, {});
      setTransactions(data);
      setTxPage(1);
    } catch (err: unknown) {
      setTransactionsError(err instanceof Error ? err.message : 'Không thể tải lịch sử giao dịch');
    } finally {
      setTransactionsLoading(false);
    }
  }, []);

  const fetchSharingLogs = useCallback(async () => {
    setSharingLoading(true);
    setSharingError(null);
    try {
      const data = await interconnectService.listSharingLogs();
      setSharingLogs(data);
      setPage(1);
    } catch (err: unknown) {
      setSharingError(err instanceof Error ? err.message : 'Không thể tải danh sách chia sẻ dữ liệu');
    } finally {
      setSharingLoading(false);
    }
  }, []);

  // Initial loads
  useEffect(() => {
    // Data loading synchronizes the screen with the remote list endpoint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchIntegrations();
  }, [fetchIntegrations]);

  useEffect(() => {
    // Data loading synchronizes the screen with the remote list endpoint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchSharingLogs();
  }, [fetchSharingLogs]);

  // ============================================================
  // Filter handlers (dùng chung cho cả 2 loại trao đổi)
  // ============================================================
  const applyFilters = useCallback(() => {
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ connectionName: '', senderOrgId: '', status: '' });
    setPage(1);
    if (exchangeType === 'sharing') void fetchSharingLogs();
    else void fetchIntegrations();
  }, [exchangeType, fetchIntegrations, fetchSharingLogs]);

  // ============================================================
  // Open transaction history modal
  // ============================================================
  const handleOpenHistory = useCallback(
    (record: IntegrationConnection) => {
      setSelectedConnectionId(record.id);
      setHistoryConnectionName(record.connectionName);
      setTransactions([]);
      setTxPage(1);
      fetchTransactions(record.id);
      setHistoryDrawerOpen(true);
    },
    [fetchTransactions],
  );

  // ============================================================
  // Edit connection
  // ============================================================
  const handleOpenEdit = useCallback(
    (connection: IntegrationConnection) => {
      setEditingConnection(connection);
      editForm.setFieldsValue({
        connectionName: connection.connectionName,
        password: '',
        status: connection.status,
      });
      setEditDrawerOpen(true);
    },
    [editForm],
  );

  const handleEditSubmit = useCallback(async () => {
    if (!editingConnection) return;
    try {
      const values = await editForm.validateFields();
      setEditSubmitting(true);
      await interconnectService.updateConnection(editingConnection.id, {
        connectionName: values.connectionName,
        password: values.password || undefined,
        status: values.status,
      });
      toast.success('Đã cập nhật kết nối');
      setEditDrawerOpen(false);
      fetchIntegrations();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      toast.error(err instanceof Error ? err.message : 'Lỗi cập nhật kết nối');
    } finally {
      setEditSubmitting(false);
    }
  }, [editingConnection, editForm, fetchIntegrations]);

  // ============================================================
  // View sent / received content
  // ============================================================
  const handleViewSentContent = useCallback(async (tx: IntegrationTransaction) => {
    setContentTitle(`Nội dung gửi - ${tx.name}`);
    setContentLoading(true);
    setContentModalOpen(true);
    try {
      const data = await interconnectService.getSentContent(tx.id);
      setContentData(data);
    } catch (err: unknown) {
      setContentData('// Không thể tải nội dung gửi');
      toast.error(err instanceof Error ? err.message : 'Không thể tải nội dung');
    } finally {
      setContentLoading(false);
    }
  }, []);

  const handleViewReceivedContent = useCallback(async (tx: IntegrationTransaction) => {
    setContentTitle(`Nội dung nhận - ${tx.name}`);
    setContentLoading(true);
    setContentModalOpen(true);
    try {
      const data = await interconnectService.getReceivedContent(tx.id);
      setContentData(data);
    } catch (err: unknown) {
      setContentData('// Không thể tải nội dung nhận');
      toast.error(err instanceof Error ? err.message : 'Không thể tải nội dung');
    } finally {
      setContentLoading(false);
    }
  }, []);

  // ============================================================
  // Sharing detail
  // ============================================================
  const handleViewSharingDetail = useCallback(async (log: DataSharingLog) => {
    setSharingDetailLoading(true);
    setSharingDetailDrawerOpen(true);
    try {
      const data = await interconnectService.getSharingLogDetail(log.id);
      setSharingDetail(data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể tải chi tiết');
      setSharingDetail(null);
    } finally {
      setSharingDetailLoading(false);
    }
  }, []);

  // ============================================================
  // Derived data (theo loại trao đổi đang chọn)
  // ============================================================
  const rows = exchangeType === 'integration' ? integrations : sharingLogs;
  const listLoading = exchangeType === 'integration' ? integrationsLoading : sharingLoading;
  const listError = exchangeType === 'integration' ? integrationsError : sharingError;
  const reloadList = exchangeType === 'integration' ? fetchIntegrations : fetchSharingLogs;

  // Bộ lọc "Hệ thống gửi" = chọn đơn vị theo cây phân cấp (giống bộ lọc "Đơn vị quản lý"):
  // trả về toàn bộ bản ghi của đơn vị được chọn + mọi đơn vị con trong nhánh
  const senderOrgNames = useMemo(() => {
    const orgId = filters.senderOrgId;
    if (!orgId) return null;
    const childrenOf = new Map<string, string[]>();
    orgUnits.forEach((o) => {
      if (!o.parentId) return;
      const list = childrenOf.get(o.parentId) || [];
      list.push(o.id);
      childrenOf.set(o.parentId, list);
    });
    const byId = new Map(orgUnits.map((o) => [o.id, o]));
    const names = new Set<string>();
    const stack = [orgId];
    const visited = new Set<string>();
    while (stack.length > 0) {
      const cur = stack.pop() as string;
      if (visited.has(cur)) continue;
      visited.add(cur);
      const unit = byId.get(cur);
      if (unit?.name) names.add(unit.name.trim().toLowerCase());
      childrenOf.get(cur)?.forEach((childId) => { stack.push(childId); });
    }
    return names;
  }, [filters.senderOrgId, orgUnits]);

  // Lọc client-side dùng chung cho cả 2 loại: Tên kết nối, Hệ thống gửi (theo nhánh đơn vị), Trạng thái
  const filteredRows = useMemo(() => {
    const name = (filters.connectionName || '').trim().toLowerCase();
    return rows.filter((row) => {
      if (name && !(row.connectionName || '').toLowerCase().includes(name)) return false;
      if (senderOrgNames && !senderOrgNames.has((row.senderSystem || '').trim().toLowerCase())) return false;
      if (filters.status && row.status !== filters.status) return false;
      return true;
    });
  }, [rows, filters, senderOrgNames]);

  // Danh sách trạng thái cho bộ lọc — phụ thuộc "Loại trao đổi" đang chọn
  const statusOptions = useMemo(() => {
    if (exchangeType === 'integration') {
      return [
        { value: 'ACTIVE', label: 'Sử dụng' },
        { value: 'INACTIVE', label: 'Không sử dụng' },
      ];
    }
    const seen = new Set<string>();
    const opts: Array<{ value: string; label: string }> = [];
    sharingLogs.forEach((log) => {
      if (seen.has(log.status)) return;
      seen.add(log.status);
      const cfg = STATUS_CONFIG[log.status];
      opts.push({ value: log.status, label: cfg?.label || log.status });
    });
    return opts;
  }, [exchangeType, sharingLogs]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize).map((item, idx) => ({
      ...item,
      _seq: start + idx + 1,
    }));
  }, [filteredRows, page, pageSize]);

  const paginatedTransactions = useMemo(() => {
    const start = (txPage - 1) * txPageSize;
    return transactions.slice(start, start + txPageSize).map((item, idx) => ({
      ...item,
      _seq: start + idx + 1,
    }));
  }, [transactions, txPage, txPageSize]);

  // ============================================================
  // rowActions (⋮ dropdown)
  // ============================================================
  const integrationRowActions = useCallback(
    (record: IntegrationConnection) => {
      return [
        {
          key: 'history',
          label: 'Xem lịch sử kết nối',
          icon: <HistoryOutlined />,
          onClick: () => handleOpenHistory(record),
        },
        {
          key: 'edit',
          label: 'Chỉnh sửa',
          icon: <EditOutlined />,
          onClick: () => handleOpenEdit(record),
        },
      ];
    },
    [handleOpenHistory, handleOpenEdit],
  );

  const transactionRowActions = useCallback(
    (record: IntegrationTransaction) => [
      {
        key: 'viewSent',
        label: 'Xem nội dung gửi',
        icon: <EyeOutlined />,
        onClick: () => handleViewSentContent(record),
      },
      {
        key: 'viewReceived',
        label: 'Xem nội dung nhận',
        icon: <EyeOutlined />,
        onClick: () => handleViewReceivedContent(record),
      },
    ],
    [handleViewSentContent, handleViewReceivedContent],
  );

  const sharingRowActions = useCallback(
    (record: DataSharingLog) => [
      {
        key: 'viewDetail',
        label: 'Xem chi tiết',
        icon: <EyeOutlined />,
        onClick: () => handleViewSharingDetail(record),
      },
    ],
    [handleViewSharingDetail],
  );

  // ============================================================
  // Integration table columns
  // ============================================================
  const integrationColumns = useMemo(
    () => [
      {
        key: 'sequenceNo',
        label: 'STT',
        width: 60,
        fixed: 'left' as const,
        type: 'mono' as const,
        align: 'center' as const,
        render: (_: unknown, record: SeqRecord<IntegrationConnection>) => (
          <span style={{ fontSize: fontSizeMd }}>{record._seq}</span>
        ),
      },
      {
        key: 'accountName',
        label: 'Tên tài khoản',
        dataIndex: 'accountName',
        width: 160,
      },
      {
        key: 'connectionName',
        label: 'Tên kết nối',
        dataIndex: 'connectionName',
        width: 200,
      },
      {
        key: 'senderSystem',
        label: 'Hệ thống gửi',
        dataIndex: 'senderSystem',
        width: 180,
      },
      {
        key: 'receiverSystem',
        label: 'Hệ thống nhận',
        dataIndex: 'receiverSystem',
        width: 180,
      },
      {
        key: 'status',
        label: 'Trạng thái',
        dataIndex: 'status',
        width: 160,
        align: 'left' as const,
        render: (status: string) => renderStatusTag(status),
      },
    ],
    [],
  );

  // ============================================================
  // Transaction sub-table columns
  // ============================================================
  const transactionColumns = useMemo(
    () => [
      {
        key: 'sequenceNo',
        label: 'STT',
        width: 60,
        fixed: 'left' as const,
        type: 'mono' as const,
        align: 'center' as const,
        render: (_: unknown, record: SeqRecord<IntegrationTransaction>) => (
          <span style={{ fontSize: fontSizeMd }}>{record._seq}</span>
        ),
      },
      {
        key: 'id',
        label: 'ID',
        dataIndex: 'id',
        width: 200,
        render: (val: string) => (
          <Typography.Text
            copyable
            style={{ fontSize: fontSizeMd, fontFamily: fontMono }}
          >
            {val}
          </Typography.Text>
        ),
      },
      {
        key: 'type',
        label: 'Loại',
        dataIndex: 'type',
        width: 150,
      },
      {
        key: 'name',
        label: 'Tên',
        dataIndex: 'name',
        width: 260,
      },
      {
        key: 'referenceNumber',
        label: 'Số tham chiếu',
        dataIndex: 'referenceNumber',
        width: 140,
        render: (val: string) =>
          val || (
            <Typography.Text type="secondary" style={{ fontSize: fontSizeMd }}>
              &mdash;
            </Typography.Text>
          ),
      },
      {
        key: 'sentAt',
        label: 'Thời gian gửi',
        dataIndex: 'sentAt',
        width: 160,
        render: (val: string) =>
          val ? (
            dayjs(val).format('DD/MM/YYYY HH:mm')
          ) : (
            <Typography.Text type="secondary" style={{ fontSize: fontSizeMd }}>
              &mdash;
            </Typography.Text>
          ),
      },
      {
        key: 'purpose',
        label: 'Mục đích gửi',
        dataIndex: 'purpose',
        width: 240,
        render: (val: string) =>
          val || (
            <Typography.Text type="secondary" style={{ fontSize: fontSizeMd }}>
              &mdash;
            </Typography.Text>
          ),
      },
      {
        key: 'organizationUnit',
        label: 'Đơn vị',
        dataIndex: 'organizationUnit',
        width: 200,
        render: (val: string) =>
          val || (
            <Typography.Text type="secondary" style={{ fontSize: fontSizeMd }}>
              &mdash;
            </Typography.Text>
          ),
      },
      {
        key: 'sender',
        label: 'Người gửi',
        dataIndex: 'sender',
        width: 180,
        render: (val: string) =>
          val || (
            <Typography.Text type="secondary" style={{ fontSize: fontSizeMd }}>
              &mdash;
            </Typography.Text>
          ),
      },
      {
        key: 'receivedAt',
        label: 'Thời gian nhận',
        dataIndex: 'receivedAt',
        width: 160,
        render: (val: string) =>
          val ? (
            dayjs(val).format('DD/MM/YYYY HH:mm')
          ) : (
            <Typography.Text type="secondary" style={{ fontSize: fontSizeMd }}>
              &mdash;
            </Typography.Text>
          ),
      },
      {
        key: 'receiverCode',
        label: 'Mã nhận',
        dataIndex: 'receiverCode',
        width: 140,
        render: (val: string) =>
          val || (
            <Typography.Text type="secondary" style={{ fontSize: fontSizeMd }}>
              &mdash;
            </Typography.Text>
          ),
      },
    ],
    [],
  );

  // ============================================================
  // Sharing table columns
  // ============================================================
  const sharingColumns = useMemo(
    () => [
      {
        key: 'sequenceNo',
        label: 'STT',
        width: 60,
        fixed: 'left' as const,
        type: 'mono' as const,
        align: 'center' as const,
        render: (_: unknown, record: SeqRecord<DataSharingLog>) => (
          <span style={{ fontSize: fontSizeMd }}>{record._seq}</span>
        ),
      },
      {
        key: 'accountName',
        label: 'Tên tài khoản',
        dataIndex: 'accountName',
        width: 160,
      },
      {
        key: 'connectionName',
        label: 'Tên kết nối',
        dataIndex: 'connectionName',
        width: 200,
      },
      {
        key: 'senderSystem',
        label: 'Hệ thống gửi',
        dataIndex: 'senderSystem',
        width: 180,
      },
      {
        key: 'receiverSystem',
        label: 'Hệ thống nhận',
        dataIndex: 'receiverSystem',
        width: 180,
      },
      {
        key: 'transactionCode',
        label: 'ID',
        dataIndex: 'transactionCode',
        width: 200,
        render: (val: string) => (
          <Typography.Text
            copyable
            style={{ fontSize: fontSizeMd, fontFamily: fontMono }}
          >
            {val}
          </Typography.Text>
        ),
      },
      {
        key: 'status',
        label: 'Trạng thái',
        dataIndex: 'status',
        width: 160,
        align: 'left' as const,
        render: (status: string) => renderStatusTag(status),
      },
    ],
    [],
  );

  // ============================================================
  // Transaction history drawer (không còn bộ lọc — chỉ hiển thị bảng)
  // ============================================================
  const renderHistoryDrawer = () => (
    <Drawer
      {...drawerProps}
      title={
        <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
          Lịch sử kết nối liên thông chia sẻ dữ liệu — {historyConnectionName}
        </span>
      }
      open={historyDrawerOpen}
      onClose={() => setHistoryDrawerOpen(false)}
      extra={<Button type="text" onClick={() => setHistoryDrawerOpen(false)} style={drawerCloseBtnStyle}>✕</Button>}
      styles={{
        header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
        body: { padding: '0 24px 12px 24px' },
      }}
    >
      {transactionsError && (
        <Alert type="error" message={transactionsError} showIcon
          style={{ marginBottom: spaceMd, borderRadius: radiusMd }}
          action={<Button size="small" onClick={() => selectedConnectionId && fetchTransactions(selectedConnectionId)}>Thử lại</Button>} />
      )}
      {transactionsLoading ? (
        <LoadingSkeleton rows={4} />
      ) : paginatedTransactions.length === 0 && !transactionsError ? (
        <EmptyState description="Không tìm thấy lịch sử giao dịch" />
      ) : (
        <>
          <DataTable columns={transactionColumns} dataSource={paginatedTransactions} rowKey="id"
            rowActions={transactionRowActions} loading={false} scroll={{ x: 1400 }} />
          <Pagination total={transactions.length} current={txPage} pageSize={txPageSize}
            onChange={(p, ps) => { setTxPage(p); setTxPageSize(ps); }} />
        </>
      )}
    </Drawer>
  );

  // ============================================================
  // Main render
  // ============================================================
  return (
    <ThemeTokenProvider tokens={themeTokenChk}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
        <ScreenHeader
          breadcrumb={[
            { label: 'Quản trị hệ thống' },
            { label: 'Quản lý kết nối liên thông chia sẻ dữ liệu' },
          ]}
        />

        <FilterTableLayout
          hideFilterToggle
          hideStatusTabs
          onFilterApply={applyFilters}
          onFilterReset={resetFilters}
          loading={listLoading}
          error={listError !== null}
          onRetry={reloadList}
          filterContent={
            <>
              {/* Loại trao đổi — thay thế 2 tab cũ */}
              <div style={{ marginBottom: spaceFormField, marginTop: spaceMd }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>
                  Loại trao đổi
                </div>
                <Select
                  value={exchangeType}
                  onChange={(val: ExchangeType) => {
                    setExchangeType(val);
                    // Trạng thái hợp lệ thay đổi theo loại → reset về "Tất cả"
                    setFilters((prev) => ({ ...prev, status: '' }));
                    setPage(1);
                  }}
                  options={[
                    { value: 'integration', label: 'Tích hợp dữ liệu' },
                    { value: 'sharing', label: 'Chia sẻ dữ liệu' },
                  ]}
                  style={{ ...selectStyle, width: '100%' }}
                />
              </div>

              {/* Tên kết nối — lọc chung cả 2 loại */}
              <div style={{ marginBottom: spaceFormField }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>
                  Tên kết nối
                </div>
                <Input
                  placeholder="Nhập tên kết nối"
                  allowClear
                  value={filters.connectionName}
                  onChange={(e) => setFilters((prev) => ({ ...prev, connectionName: e.target.value }))}
                  onPressEnter={applyFilters}
                  style={inputStyle}
                />
              </div>

              {/* Hệ thống gửi — cây đơn vị phân cấp (giống bộ lọc "Đơn vị quản lý"); chọn 1 đơn vị = lọc theo đơn vị đó + toàn bộ đơn vị con */}
              <div style={{ marginBottom: spaceFormField }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>
                  Hệ thống gửi
                </div>
                <OrgUnitTreeSelect
                  organizations={orgUnits}
                  placeholder="Tất cả"
                  allowClear
                  treeDefaultExpandAll
                  listHeight={256}
                  value={filters.senderOrgId || undefined}
                  onChange={(val?: string) => setFilters((prev) => ({ ...prev, senderOrgId: val || '' }))}
                  loading={loadingOrgs}
                  style={{ ...selectStyle, width: '100%' }}
                />
              </div>

              {/* Trạng thái — giá trị tùy theo "Loại trao đổi" đang chọn */}
              <div style={{ marginBottom: spaceFormField }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>
                  Trạng thái
                </div>
                <Select
                  placeholder="Tất cả"
                  allowClear
                  value={filters.status || undefined}
                  onChange={(val?: string) => setFilters((prev) => ({ ...prev, status: val || '' }))}
                  options={statusOptions}
                  style={{ ...selectStyle, width: '100%' }}
                />
              </div>
            </>
          }
        >
          {exchangeType === 'integration' ? (
            <DataTable
              columns={integrationColumns}
              dataSource={paginatedRows as unknown as SeqRecord<IntegrationConnection>[]}
              rowKey="id"
              rowActions={integrationRowActions}
              loading={listLoading}
              scroll={{ x: 'max-content' }}
            />
          ) : (
            <DataTable
              columns={sharingColumns}
              dataSource={paginatedRows as unknown as SeqRecord<DataSharingLog>[]}
              rowKey="id"
              rowActions={sharingRowActions}
              loading={listLoading}
              scroll={{ x: 'max-content' }}
            />
          )}
          {/* Luôn hiển thị phân trang cố định ở đáy (Tổng cộng: 0 khi bảng rỗng) */}
          <Pagination
            total={filteredRows.length}
            current={page}
            pageSize={pageSize}
            onChange={(p, ps) => {
              setPage(p);
              setPageSize(ps);
            }}
          />
        </FilterTableLayout>

        {/* ================================================ */}
        {/* Edit Connection Drawer */}
        {/* ================================================ */}
        <Drawer
          {...drawerProps}
          title={
            <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
              Sửa kết nối — {editingConnection?.connectionName}
            </span>
          }
          open={editDrawerOpen}
          onClose={() => setEditDrawerOpen(false)}
          extra={<Button type="text" onClick={() => setEditDrawerOpen(false)} style={drawerCloseBtnStyle}>✕</Button>}
          footer={
            <div style={drawerFooterStyle}>
              <Button onClick={() => setEditDrawerOpen(false)} style={outlineButtonStyle}>Hủy</Button>
              <Button type="primary" onClick={handleEditSubmit} loading={editSubmitting} style={primaryButtonStyle}>Lưu</Button>
            </div>
          }
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '0 24px 12px 24px' },
          }}
        >
          <style>{requiredMarkStyle}</style>
          <Form form={editForm} layout="vertical" style={{ marginTop: spaceMd }}>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item
                  name="connectionName"
                  label={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tên kết nối</span>}
                  rules={[{ required: true, message: 'Vui lòng nhập tên kết nối' }]}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Input placeholder="Nhập tên kết nối" style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="password"
                  label={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Mật khẩu</span>}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Input.Password placeholder="Nhập mật khẩu mới (nếu muốn thay đổi)" style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="status"
                  label={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Trạng thái</span>}
                  rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Select
                    placeholder="Chọn trạng thái"
                    options={[
                      { value: 'ACTIVE', label: 'Sử dụng' },
                      { value: 'INACTIVE', label: 'Không sử dụng' },
                    ]}
                    style={{ borderRadius: radiusPill, height: 40 }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Drawer>

        {/* ================================================ */}
        {/* View Sent / Received Content Modal */}
        {/* ================================================ */}
        <Modal
          title={
            <span
              style={{
                color: colors.sidebarBg,
                fontWeight: fontWeightBold,
                fontSize: fontSizeLg,
              }}
            >
              {contentTitle}
            </span>
          }
          open={contentModalOpen}
          onCancel={() => setContentModalOpen(false)}
          footer={[
            <Button
              key="close"
              onClick={() => setContentModalOpen(false)}
              style={{
                borderRadius: radiusPill,
                height: 40,
                fontSize: fontSizeMd,
                borderColor: borderDefault,
                color: textSecondary,
              }}
            >
              Đóng
            </Button>,
          ]}
          width={700}
        >
          <Spin spinning={contentLoading}>
            <pre
              style={{
                background: colors.bodyBg,
                padding: spaceMd,
                borderRadius: radiusMd,
                fontSize: fontSizeSm,
                fontFamily: fontMono,
                lineHeight: 1.6,
                maxHeight: 400,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                margin: 0,
                border: `1px solid ${borderDefault}`,
              }}
            >
              {contentData || '// Không có nội dung'}
            </pre>
          </Spin>
        </Modal>

        {/* ================================================ */}
        {/* Transaction History Drawer */}
        {/* ================================================ */}
        {renderHistoryDrawer()}

        {/* ================================================ */}
        {/* Sharing Detail Drawer */}
        {/* ================================================ */}
        <Drawer
          {...drawerProps}
          title={
            <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
              Chi tiết chia sẻ dữ liệu
            </span>
          }
          open={sharingDetailDrawerOpen}
          onClose={() => setSharingDetailDrawerOpen(false)}
          extra={<Button type="text" onClick={() => setSharingDetailDrawerOpen(false)} style={drawerCloseBtnStyle}>✕</Button>}
          footer={null}
        >
          <Spin spinning={sharingDetailLoading}>
            {sharingDetail ? (
              <div style={{ paddingTop: 16 }}>
                <div className="chk-detail-grid">
                  {[
                    ['Mã giao dịch', sharingDetail.transactionCode],
                    ['Tên tài khoản', sharingDetail.accountName],
                    ['Tên kết nối', sharingDetail.connectionName],
                    ['Hệ thống gửi', sharingDetail.senderSystem],
                    ['Hệ thống nhận', sharingDetail.receiverSystem],
                    ['Trạng thái', renderStatusTag(sharingDetail.status)],
                  ].map(([label, value]) => (
                    <div key={label as string} className="chk-detail-row">
                      <span className="chk-detail-label">{label}</span>
                      <span className="chk-detail-value">{value}</span>
                    </div>
                  ))}
                  <div className="chk-detail-row chk-detail-row--full">
                    <span className="chk-detail-label">Thời gian tạo</span>
                    <span className="chk-detail-value">{dayjs(sharingDetail.createdAt).format('DD/MM/YYYY HH:mm')}</span>
                  </div>
                  {sharingDetail.detailContent && (
                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label">Nội dung chi tiết</span>
                      <span className="chk-detail-value">
                        <pre style={{ background: colors.bodyBg, padding: spaceSm, borderRadius: radiusMd, fontSize: fontSizeSm, fontFamily: fontMono, lineHeight: 1.6, maxHeight: 300, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0, border: `1px solid ${borderDefault}` }}>{sharingDetail.detailContent}</pre>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : sharingDetailLoading ? null : (
              <div
                style={{
                  padding: '40px 0',
                  textAlign: 'center',
                  color: textSecondary,
                }}
              >
                Không tìm thấy thông tin chi tiết
              </div>
            )}
          </Spin>
        </Drawer>
      </div>
    </ThemeTokenProvider>
  );
}

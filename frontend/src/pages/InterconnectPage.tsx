import { useState, useCallback, useEffect, useMemo } from 'react';
import { Tabs, Modal, Form, Input, Select, Button, Spin, Alert, DatePicker, Typography, Drawer, Row, Col } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, EditOutlined, HistoryOutlined, FilterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { ScreenHeader, DataTable, Pagination } from '../components/list-view';
import FilterTableLayout from '../components/list-view/FilterTableLayout';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import { interconnectService } from '../services/interconnectService';
import type {
  IntegrationConnection,
  IntegrationTransaction,
  DataSharingLog,
} from '../services/interconnectService';
import {
  actionPrimary,
  statusOperational,
  statusDraft,
  statusCritical,
  textPrimary,
  textSecondary,
  textTertiary,
  borderDefault,
  fontSizeSm,
  fontSizeMd,
  fontSizeLg,
  fontWeightMedium,
  fontWeightBold,
  spaceFormField,
  spaceSm,
  spaceMd,
  radiusPill,
  radiusMd,
  fontMono,
  drawerProps,
  drawerTitleStyle,
  drawerCloseBtnStyle,
  drawerFooterStyle,
  primaryButtonStyle,
  outlineButtonStyle,
  requiredMarkStyle,
} from '../tokens';
import { colors } from '../theme';
import toast from '../components/ToastNotification';

// ============================================================
// Types
// ============================================================
type SeqRecord<T> = T & { _seq: number };

interface IntegrationFilters {
  connectionName?: string;
  senderSystem?: string;
  status?: string;
}

interface TransactionFilters {
  type?: string;
  referenceNumber?: string;
  from?: dayjs.Dayjs | null;
  to?: dayjs.Dayjs | null;
  receiverCode?: string;
  transactionId?: string;
  purpose?: string;
}

interface SharingFilters {
  connectionName?: string;
  senderSystem?: string;
  status?: string;
}

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
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 10px',
        borderRadius: radiusPill,
        fontSize: fontSizeMd,
        fontWeight: fontWeightMedium,
        background: `${cfg.color}15`,
        color: cfg.color,
      }}
    >
      {cfg.label}
    </span>
  );
}

// ============================================================
// Page Component
// ============================================================
export default function InterconnectPage() {
  const [activeTab, setActiveTab] = useState('integration');

  // --------------------------------------------------
  // Integration tab state
  // --------------------------------------------------
  const [integrations, setIntegrations] = useState<IntegrationConnection[]>([]);
  const [integrationsLoading, setIntegrationsLoading] = useState(false);
  const [integrationsError, setIntegrationsError] = useState<string | null>(null);
  const [integrationFilterValues, setIntegrationFilterValues] = useState<IntegrationFilters>({});
  const [integrationStatusTab, setIntegrationStatusTab] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Transaction history drawer
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [historyConnectionName, setHistoryConnectionName] = useState('');
  const [transactions, setTransactions] = useState<IntegrationTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);
  const [transactionFilters, setTransactionFilters] = useState<TransactionFilters>({});
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [txPage, setTxPage] = useState(1);
  const [txPageSize, setTxPageSize] = useState(20);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

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
  // Sharing tab state
  // --------------------------------------------------
  const [sharingLogs, setSharingLogs] = useState<DataSharingLog[]>([]);
  const [sharingLoading, setSharingLoading] = useState(false);
  const [sharingError, setSharingError] = useState<string | null>(null);
  const [sharingFilterValues, setSharingFilterValues] = useState<SharingFilters>({});
  const [sharingStatusTab, setSharingStatusTab] = useState('');
  const [sharingPage, setSharingPage] = useState(1);
  const [sharingPageSize, setSharingPageSize] = useState(20);
  const [sharingDetailDrawerOpen, setSharingDetailDrawerOpen] = useState(false);
  const [sharingDetail, setSharingDetail] = useState<DataSharingLog | null>(null);
  const [sharingDetailLoading, setSharingDetailLoading] = useState(false);

  // ============================================================
  // Data fetching
  // ============================================================

  const fetchIntegrations = useCallback(
    async (filters?: IntegrationFilters) => {
      const params = filters || {};
      setIntegrationsLoading(true);
      setIntegrationsError(null);
      try {
        const data = await interconnectService.listIntegrations({
          connectionName: params.connectionName || undefined,
          senderSystem: params.senderSystem || undefined,
          status: params.status || undefined,
        });
        setIntegrations(data);
        setPage(1);
      } catch (err: unknown) {
        setIntegrationsError(err instanceof Error ? err.message : 'Không thể tải danh sách kết nối');
      } finally {
        setIntegrationsLoading(false);
      }
    },
    [],
  );

  const fetchTransactions = useCallback(
    async (connectionId: string, filters?: TransactionFilters) => {
      const params = filters || {};
      setSelectedConnectionId(connectionId);
      setTransactionsLoading(true);
      setTransactionsError(null);
      try {
        const data = await interconnectService.getTransactionHistory(connectionId, {
          type: params.type || undefined,
          referenceNumber: params.referenceNumber || undefined,
          from: params.from ? dayjs(params.from).startOf('day').format('YYYY-MM-DDTHH:mm:ss') : undefined,
          to: params.to ? dayjs(params.to).endOf('day').format('YYYY-MM-DDTHH:mm:ss') : undefined,
          receiverCode: params.receiverCode || undefined,
          transactionId: params.transactionId || undefined,
          purpose: params.purpose || undefined,
        });
        setTransactions(data);
        setTxPage(1);
      } catch (err: unknown) {
        setTransactionsError(err instanceof Error ? err.message : 'Không thể tải lịch sử giao dịch');
      } finally {
        setTransactionsLoading(false);
      }
    },
    [],
  );

  const fetchSharingLogs = useCallback(async () => {
    setSharingLoading(true);
    setSharingError(null);
    try {
      const data = await interconnectService.listSharingLogs();
      setSharingLogs(data);
      setSharingPage(1);
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
  // Integration filter handlers
  // ============================================================
  const handleIntegrationApply = useCallback(() => {
    fetchIntegrations(integrationFilterValues);
    setIntegrationStatusTab('');
    setPage(1);
  }, [integrationFilterValues, fetchIntegrations]);

  const handleIntegrationReset = useCallback(() => {
    setIntegrationFilterValues({});
    setIntegrationStatusTab('');
    setPage(1);
    fetchIntegrations({});
  }, [fetchIntegrations]);

  // ============================================================
  // Sharing filter handlers
  // ============================================================
  const handleSharingApply = useCallback(() => {
    setSharingStatusTab('');
    setSharingPage(1);
  }, []);

  const handleSharingReset = useCallback(() => {
    setSharingFilterValues({});
    setSharingStatusTab('');
    setSharingPage(1);
  }, []);

  // ============================================================
  // Open transaction history modal
  // ============================================================
  const handleOpenHistory = useCallback(
    (record: IntegrationConnection) => {
      setSelectedConnectionId(record.id);
      setHistoryConnectionName(record.connectionName);
      setTransactionFilters({});
      setTransactions([]);
      setTxPage(1);
      setShowAdvancedSearch(false);
      fetchTransactions(record.id, {});
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
  // Derived data
  // ============================================================
  const filteredIntegrations = useMemo(() => {
    if (!integrationStatusTab) return integrations;
    return integrations.filter((item) => item.status === integrationStatusTab);
  }, [integrations, integrationStatusTab]);

  const integrationStatusTabs = useMemo(() => {
    const activeCount = integrations.filter((item) => item.status === 'ACTIVE').length;
    const inactiveCount = integrations.filter((item) => item.status === 'INACTIVE').length;
    return [
      { key: 'all', label: 'Tất cả', count: integrations.length, color: actionPrimary, active: integrationStatusTab === '' },
      { key: 'ACTIVE', label: 'Sử dụng', count: activeCount, color: statusOperational, active: integrationStatusTab === 'ACTIVE' },
      { key: 'INACTIVE', label: 'Không sử dụng', count: inactiveCount, color: statusDraft, active: integrationStatusTab === 'INACTIVE' },
    ];
  }, [integrations, integrationStatusTab]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredIntegrations.slice(start, start + pageSize).map((item, idx) => ({
      ...item,
      _seq: start + idx + 1,
    }));
  }, [filteredIntegrations, page, pageSize]);

  const filteredSharingLogs = useMemo(() => {
    const name = (sharingFilterValues.connectionName || '').trim().toLowerCase();
    const sender = (sharingFilterValues.senderSystem || '').trim().toLowerCase();
    const status = sharingFilterValues.status;
    return sharingLogs.filter((log) => {
      if (name && !(log.connectionName || '').toLowerCase().includes(name)) return false;
      if (sender && !(log.senderSystem || '').toLowerCase().includes(sender)) return false;
      if (status && log.status !== status) return false;
      if (sharingStatusTab && log.status !== sharingStatusTab) return false;
      return true;
    });
  }, [sharingLogs, sharingFilterValues, sharingStatusTab]);

  const sharingStatusTabs = useMemo(() => {
    const counts: Record<string, number> = {};
    sharingLogs.forEach((log) => {
      counts[log.status] = (counts[log.status] || 0) + 1;
    });
    const tabs: Array<{ key: string; label: string; count: number; color: string; active: boolean }> = [
      { key: 'all', label: 'Tất cả', count: sharingLogs.length, color: actionPrimary, active: sharingStatusTab === '' },
    ];
    Object.keys(counts).forEach((status) => {
      const cfg = STATUS_CONFIG[status];
      tabs.push({
        key: status,
        label: cfg?.label || status,
        color: cfg?.color || textTertiary,
        count: counts[status],
        active: sharingStatusTab === status,
      });
    });
    return tabs;
  }, [sharingLogs, sharingStatusTab]);

  const paginatedSharing = useMemo(() => {
    const start = (sharingPage - 1) * sharingPageSize;
    return filteredSharingLogs.slice(start, start + sharingPageSize).map((item, idx) => ({
      ...item,
      _seq: start + idx + 1,
    }));
  }, [filteredSharingLogs, sharingPage, sharingPageSize]);

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
          label: 'Lịch sử giao dịch',
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
        width: 80,
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
        width: 220,
        fixed: 'left' as const,
      },
      {
        key: 'connectionName',
        label: 'Tên kết nối',
        dataIndex: 'connectionName',
        width: 240,
        fixed: 'left' as const,
      },
      {
        key: 'senderSystem',
        label: 'Hệ thống gửi',
        dataIndex: 'senderSystem',
        width: 200,
      },
      {
        key: 'receiverSystem',
        label: 'Hệ thống nhận',
        dataIndex: 'receiverSystem',
        width: 200,
      },
      {
        key: 'status',
        label: 'Trạng thái',
        dataIndex: 'status',
        width: 140,
        align: 'center' as const,
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
        width: 80,
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
        label: 'Số TC',
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
        label: 'Mục đích',
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
        width: 80,
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
        width: 220,
        fixed: 'left' as const,
      },
      {
        key: 'connectionName',
        label: 'Tên kết nối',
        dataIndex: 'connectionName',
        width: 240,
        fixed: 'left' as const,
      },
      {
        key: 'senderSystem',
        label: 'Hệ thống gửi',
        dataIndex: 'senderSystem',
        width: 200,
      },
      {
        key: 'receiverSystem',
        label: 'Hệ thống nhận',
        dataIndex: 'receiverSystem',
        width: 200,
      },
      {
        key: 'transactionCode',
        label: 'ID',
        dataIndex: 'transactionCode',
        width: 220,
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
        width: 140,
        align: 'center' as const,
        render: (status: string) => renderStatusTag(status),
      },
    ],
    [],
  );

  // ============================================================
  // Transaction sub-table filter UI (inline — not shared FilterBar)
  // ============================================================
  const renderTransactionFilter = () => {
    const handleTxFilterSearch = () => {
      if (selectedConnectionId) fetchTransactions(selectedConnectionId, transactionFilters);
    };

    const handleTxFilterReset = () => {
      const emptyFilters: TransactionFilters = {};
      setTransactionFilters(emptyFilters);
      setShowAdvancedSearch(false);
      if (selectedConnectionId) fetchTransactions(selectedConnectionId, emptyFilters);
    };

    return (
      <div style={{ marginBottom: spaceMd }}>
        {/* Primary filters */}
        <div
          style={{
            display: 'flex',
            gap: spaceSm,
            alignItems: 'flex-end',
            flexWrap: 'wrap',
          }}
        >
          {/* Type select */}
          <div style={{ flex: '1 1 140px', minWidth: 120 }}>
            <div
              style={{
                fontSize: fontSizeMd,
                color: colors.sidebarBg,
                fontWeight: fontWeightBold,
                marginBottom: 4,
              }}
            >
              Loại
            </div>
            <Input
              placeholder="Nhập loại gửi"
              allowClear
              value={transactionFilters.type || ''}
              onChange={(e) =>
                setTransactionFilters((prev) => ({ ...prev, type: e.target.value }))
              }
              onPressEnter={handleTxFilterSearch}
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
            />
          </div>

          {/* Reference number */}
          <div style={{ flex: '1 1 140px', minWidth: 120 }}>
            <div
              style={{
                fontSize: fontSizeMd,
                color: colors.sidebarBg,
                fontWeight: fontWeightBold,
                marginBottom: 4,
              }}
            >
              Số TC
            </div>
            <Input
              placeholder="Nhập số TC"
              prefix={<SearchOutlined style={{ color: colors.sidebarBg }} />}
              allowClear
              value={transactionFilters.referenceNumber || ''}
              onChange={(e) =>
                setTransactionFilters((prev) => ({
                  ...prev,
                  referenceNumber: e.target.value,
                }))
              }
              onPressEnter={handleTxFilterSearch}
              style={{ borderRadius: radiusPill, height: 40 }}
            />
          </div>

          {/* From date */}
          <div style={{ flex: '1 1 140px', minWidth: 120 }}>
            <div
              style={{
                fontSize: fontSizeMd,
                color: colors.sidebarBg,
                fontWeight: fontWeightBold,
                marginBottom: 4,
              }}
            >
              Từ ngày
            </div>
            <DatePicker
              value={transactionFilters.from || null}
              onChange={(date) =>
                setTransactionFilters((prev) => ({ ...prev, from: date }))
              }
              placeholder="Từ ngày"
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
            />
          </div>

          {/* To date */}
          <div style={{ flex: '1 1 140px', minWidth: 120 }}>
            <div
              style={{
                fontSize: fontSizeMd,
                color: colors.sidebarBg,
                fontWeight: fontWeightBold,
                marginBottom: 4,
              }}
            >
              Đến ngày
            </div>
            <DatePicker
              value={transactionFilters.to || null}
              onChange={(date) =>
                setTransactionFilters((prev) => ({ ...prev, to: date }))
              }
              placeholder="Đến ngày"
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
            />
          </div>

        </div>

        {showAdvancedSearch && (
          <Row gutter={[spaceMd, spaceSm]} style={{ marginTop: spaceSm }}>
            <Col xs={24} sm={8}>
              <div style={{ fontSize: fontSizeMd, color: colors.sidebarBg, fontWeight: fontWeightBold, marginBottom: 4 }}>Mã nhận</div>
              <Input placeholder="Nhập mã nhận" allowClear
                value={transactionFilters.receiverCode || ''}
                onChange={(e) => setTransactionFilters((prev) => ({ ...prev, receiverCode: e.target.value }))}
                style={{ borderRadius: radiusPill, height: 40 }} />
            </Col>
            <Col xs={24} sm={8}>
              <div style={{ fontSize: fontSizeMd, color: colors.sidebarBg, fontWeight: fontWeightBold, marginBottom: 4 }}>ID giao dịch</div>
              <Input placeholder="Nhập ID giao dịch" allowClear
                value={transactionFilters.transactionId || ''}
                onChange={(e) => setTransactionFilters((prev) => ({ ...prev, transactionId: e.target.value }))}
                style={{ borderRadius: radiusPill, height: 40 }} />
            </Col>
            <Col xs={24} sm={8}>
              <div style={{ fontSize: fontSizeMd, color: colors.sidebarBg, fontWeight: fontWeightBold, marginBottom: 4 }}>Mục đích</div>
              <Input placeholder="Nhập mục đích" allowClear
                value={transactionFilters.purpose || ''}
                onChange={(e) => setTransactionFilters((prev) => ({ ...prev, purpose: e.target.value }))}
                style={{ borderRadius: radiusPill, height: 40 }} />
            </Col>
          </Row>
        )}
        {/* Action buttons */}
        <div style={{ display: 'flex', gap: spaceSm, justifyContent: 'center', marginTop: spaceMd }}>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleTxFilterReset}
            style={{ color: textSecondary, borderColor: borderDefault, borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleTxFilterSearch}
            style={{ background: actionPrimary, borderColor: actionPrimary, borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
          >
            Tìm kiếm
          </Button>
          <Button
            icon={<FilterOutlined />}
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            shape="circle"
            style={{ color: showAdvancedSearch ? actionPrimary : textSecondary, borderColor: showAdvancedSearch ? actionPrimary : borderDefault, width: 38, height: 38, fontSize: fontSizeMd }}
          />
        </div>
      </div>
    );
  };

  // ============================================================
  // Transaction history drawer
  // ============================================================
  const renderHistoryDrawer = () => (
    <Drawer
      {...drawerProps}
      title={
        <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
          Lịch sử giao dịch — {historyConnectionName}
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
      <div style={{ paddingTop: 16 }}>
        {renderTransactionFilter()}
      </div>
      {transactionsError && (
        <Alert type="error" message={transactionsError} showIcon
          style={{ marginBottom: spaceMd, borderRadius: radiusMd }}
          action={<Button size="small" onClick={() => selectedConnectionId && fetchTransactions(selectedConnectionId, transactionFilters)}>Thử lại</Button>} />
      )}
      {transactionsLoading ? (
        <LoadingSkeleton rows={4} />
      ) : paginatedTransactions.length === 0 && !transactionsError ? (
        <EmptyState description="Không tìm thấy lịch sử giao dịch" />
      ) : (
        <>
          <DataTable columns={transactionColumns} dataSource={paginatedTransactions} rowKey="id"
            rowActions={transactionRowActions} loading={transactionsLoading} scroll={{ x: 1400 }} />
          <Pagination total={transactions.length} current={txPage} pageSize={txPageSize}
            onChange={(p, ps) => { setTxPage(p); setTxPageSize(ps); }} />
        </>
      )}
    </Drawer>
  );

  // ============================================================
  // Tab content: "Tích hợp dữ liệu"
  // ============================================================
  const renderIntegrationTab = () => {
    return (
      <FilterTableLayout
        hideFilterToggle
        onFilterApply={handleIntegrationApply}
        onFilterReset={handleIntegrationReset}
        loading={integrationsLoading}
        error={integrationsError !== null}
        onRetry={() => fetchIntegrations(integrationFilterValues)}
        filterContent={
          <>
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
                Tên kết nối
              </div>
              <Input
                placeholder="Nhập tên kết nối"
                allowClear
                value={integrationFilterValues.connectionName || ''}
                onChange={(e) => setIntegrationFilterValues((prev) => ({ ...prev, connectionName: e.target.value }))}
                onPressEnter={handleIntegrationApply}
                style={{ borderRadius: radiusPill, height: 40 }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
                Hệ thống gửi
              </div>
              <Input
                placeholder="Nhập hệ thống gửi"
                allowClear
                value={integrationFilterValues.senderSystem || ''}
                onChange={(e) => setIntegrationFilterValues((prev) => ({ ...prev, senderSystem: e.target.value }))}
                onPressEnter={handleIntegrationApply}
                style={{ borderRadius: radiusPill, height: 40 }}
              />
            </div>
          </>
        }
        statusTabs={integrationStatusTabs}
        onStatusTabChange={(key) => {
          setIntegrationStatusTab(key === 'all' ? '' : key);
          setPage(1);
        }}
      >
        <style>{`.list-view-table .ant-table-cell { padding-block: 8.5px !important; }`}</style>
        {integrationsError ? null : !integrationsLoading && filteredIntegrations.length === 0 ? (
          <DataTable
            dataSource={[]}
            rowKey="id"
            emptyState={
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>📭</div>
                <div style={{ fontSize: fontSizeLg, color: textSecondary, marginBottom: 8 }}>Không tìm thấy kết nối nào phù hợp</div>
              </div>
            }
          />
        ) : !integrationsLoading && !integrationsError && filteredIntegrations.length > 0 ? (
          <DataTable
            columns={integrationColumns}
            dataSource={paginatedData}
            rowKey="id"
            rowActions={integrationRowActions}
            loading={false}
            scroll={{ x: 1200 }}
          />
        ) : null}
        <Pagination
          total={filteredIntegrations.length}
          current={page}
          pageSize={pageSize}
          onChange={(p, ps) => {
            setPage(p);
            setPageSize(ps);
          }}
        />
      </FilterTableLayout>
    );
  };

  // ============================================================
  // Tab content: "Chia sẻ dữ liệu"
  // ============================================================
  const renderSharingTab = () => {
    return (
      <FilterTableLayout
        hideFilterToggle
        onFilterApply={handleSharingApply}
        onFilterReset={handleSharingReset}
        loading={sharingLoading}
        error={sharingError !== null}
        onRetry={fetchSharingLogs}
        filterContent={
          <>
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
                Tên kết nối
              </div>
              <Input
                placeholder="Nhập tên kết nối"
                allowClear
                value={sharingFilterValues.connectionName || ''}
                onChange={(e) => setSharingFilterValues((prev) => ({ ...prev, connectionName: e.target.value }))}
                onPressEnter={handleSharingApply}
                style={{ borderRadius: radiusPill, height: 40 }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
                Hệ thống gửi
              </div>
              <Input
                placeholder="Nhập hệ thống gửi"
                allowClear
                value={sharingFilterValues.senderSystem || ''}
                onChange={(e) => setSharingFilterValues((prev) => ({ ...prev, senderSystem: e.target.value }))}
                onPressEnter={handleSharingApply}
                style={{ borderRadius: radiusPill, height: 40 }}
              />
            </div>
          </>
        }
        statusTabs={sharingStatusTabs}
        onStatusTabChange={(key) => {
          setSharingStatusTab(key === 'all' ? '' : key);
          setSharingPage(1);
        }}
      >
        <style>{`.list-view-table .ant-table-cell { padding-block: 8.5px !important; }`}</style>
        {sharingError ? null : !sharingLoading && filteredSharingLogs.length === 0 ? (
          <DataTable
            dataSource={[]}
            rowKey="id"
            emptyState={
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>📭</div>
                <div style={{ fontSize: fontSizeLg, color: textSecondary, marginBottom: 8 }}>Không tìm thấy bản ghi chia sẻ dữ liệu nào phù hợp</div>
              </div>
            }
          />
        ) : !sharingLoading && !sharingError && filteredSharingLogs.length > 0 ? (
          <DataTable
            columns={sharingColumns}
            dataSource={paginatedSharing}
            rowKey="id"
            rowActions={sharingRowActions}
            loading={false}
            scroll={{ x: 1200 }}
          />
        ) : null}
        <Pagination
          total={filteredSharingLogs.length}
          current={sharingPage}
          pageSize={sharingPageSize}
          onChange={(p, ps) => {
            setSharingPage(p);
            setSharingPageSize(ps);
          }}
        />
      </FilterTableLayout>
    );
  };

  // ============================================================
  // Main render
  // ============================================================
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
      <ScreenHeader
        breadcrumb={[
          { label: 'Quản trị hệ thống' },
          { label: 'Quản lý kết nối liên thông chia sẻ dữ liệu' },
        ]}
      />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'integration',
            label: 'Tích hợp dữ liệu',
            children: renderIntegrationTab(),
          },
          {
            key: 'sharing',
            label: 'Chia sẻ dữ liệu',
            children: renderSharingTab(),
          },
        ]}
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
      />

      {/* Cho FilterTableLayout một chiều cao bị giới hạn: tabpane flex-fill */}
      <style>{`
        .ant-tabs-body-holder { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        .ant-tabs-body { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        .ant-tabs-content { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        .ant-tabs-content-hidden { display: none !important; }
      `}</style>

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
          <Form.Item
            name="connectionName"
            label={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tên kết nối</span>}
            rules={[{ required: true, message: 'Vui lòng nhập tên kết nối' }]}
            style={{ marginBottom: spaceFormField }}
          >
            <Input placeholder="Nhập tên kết nối" style={{ borderRadius: radiusPill, height: 40 }} />
          </Form.Item>
          <Form.Item
            name="password"
            label={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Mật khẩu</span>}
            style={{ marginBottom: spaceFormField }}
          >
            <Input.Password placeholder="Nhập mật khẩu mới (nếu muốn thay đổi)" style={{ borderRadius: radiusPill, height: 40 }} />
          </Form.Item>
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
              <style>{`.detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:0}.detail-row{display:flex;padding:10px 12px;border-bottom:1px solid ${borderDefault}}.detail-row--full{grid-column:1 / -1}.detail-label{width:200px;flex-shrink:0;color:${colors.sidebarBg};font-weight:${fontWeightBold};font-size:${fontSizeMd}px}.detail-label::after{content:':';margin-left:2px}.detail-value{color:${textPrimary};font-size:${fontSizeMd}px;flex:1}`}</style>
              <div className="detail-grid">
                {[
                  ['Mã giao dịch', sharingDetail.transactionCode],
                  ['Tên tài khoản', sharingDetail.accountName],
                  ['Tên kết nối', sharingDetail.connectionName],
                  ['Hệ thống gửi', sharingDetail.senderSystem],
                  ['Hệ thống nhận', sharingDetail.receiverSystem],
                  ['Trạng thái', renderStatusTag(sharingDetail.status)],
                ].map(([label, value], i) => (
                  <div key={i} className="detail-row">
                    <span className="detail-label">{label}</span>
                    <span className="detail-value">{value}</span>
                  </div>
                ))}
                <div className="detail-row detail-row--full">
                  <span className="detail-label">Thời gian tạo</span>
                  <span className="detail-value">{dayjs(sharingDetail.createdAt).format('DD/MM/YYYY HH:mm')}</span>
                </div>
                {sharingDetail.detailContent && (
                  <div className="detail-row detail-row--full">
                    <span className="detail-label">Nội dung chi tiết</span>
                    <span className="detail-value">
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
  );
}

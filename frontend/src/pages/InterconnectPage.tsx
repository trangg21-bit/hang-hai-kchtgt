import { useState, useCallback, useEffect, useMemo } from 'react';
import { Tabs, Modal, Form, Input, Select, Button, Spin, Alert, Row, Col, DatePicker, Typography } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, EditOutlined, HistoryOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { ScreenHeader, FilterBar, DataTable, Pagination } from '../components/list-view';
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
  textPrimary,
  textSecondary,
  textTertiary,
  fontSizeMd,
  fontSizeLg,
  fontSizeSm,
  fontWeightMedium,
  fontWeightBold,
  spaceFormField,
  spaceSm,
  spaceMd,
  radiusPill,
  radiusMd,
  borderDefault,
  cardStyle,
  metaStyle,
  fontMono,
} from '../tokens';
import { colors } from '../theme';
import toast from '../components/ToastNotification';

// ============================================================
// Status display config
// ============================================================
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Sử dụng', color: statusOperational },
  INACTIVE: { label: 'Không sử dụng', color: statusDraft },
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
  const [activeTab, setActiveTab] = useState('tich-hop');

  // --------------------------------------------------
  // Integration tab state
  // --------------------------------------------------
  const [integrations, setIntegrations] = useState<IntegrationConnection[]>([]);
  const [integrationsLoading, setIntegrationsLoading] = useState(false);
  const [integrationsError, setIntegrationsError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Expanded row (transaction history) — only one at a time
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [transactions, setTransactions] = useState<IntegrationTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);
  const [transactionFilters, setTransactionFilters] = useState<Record<string, any>>({});
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [txPage, setTxPage] = useState(1);
  const [txPageSize, setTxPageSize] = useState(20);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

  // --------------------------------------------------
  // Edit connection modal
  // --------------------------------------------------
  const [editModalOpen, setEditModalOpen] = useState(false);
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
  const [sharingDetailModalOpen, setSharingDetailModalOpen] = useState(false);
  const [sharingDetail, setSharingDetail] = useState<DataSharingLog | null>(null);
  const [sharingDetailLoading, setSharingDetailLoading] = useState(false);

  // ============================================================
  // Data fetching
  // ============================================================

  const fetchIntegrations = useCallback(
    async (filters?: Record<string, any>) => {
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
      } catch (err: any) {
        setIntegrationsError(err.message || 'Không thể tải danh sách kết nối');
      } finally {
        setIntegrationsLoading(false);
      }
    },
    [],
  );

  const fetchTransactions = useCallback(
    async (connectionId: string, filters?: Record<string, any>) => {
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
      } catch (err: any) {
        setTransactionsError(err.message || 'Không thể tải lịch sử giao dịch');
      } finally {
        setTransactionsLoading(false);
      }
    },
    [],
  );

  // Initial load
  useEffect(() => {
    fetchIntegrations();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ============================================================
  // Integration filter handlers
  // ============================================================
  const handleIntegrationSearch = useCallback(
    (values: Record<string, any>) => {
      fetchIntegrations(values);
    },
    [fetchIntegrations],
  );

  const handleIntegrationReset = useCallback(() => {
    fetchIntegrations({});
  }, [fetchIntegrations]);

  // ============================================================
  // Expand / collapse transaction sub-table
  // ============================================================
  const handleExpandRow = useCallback(
    (expanded: boolean, record: IntegrationConnection) => {
      if (expanded) {
        setExpandedRowKeys([record.id]);
        setTransactionFilters({});
        setTransactions([]);
        setTxPage(1);
        setShowAdvancedSearch(false);
        fetchTransactions(record.id, {});
      } else {
        setExpandedRowKeys([]);
      }
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
      setEditModalOpen(true);
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
      setEditModalOpen(false);
      fetchIntegrations();
    } catch (err: any) {
      if (err.errorFields) return;
      toast.error(err.message || 'Lỗi cập nhật kết nối');
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
    } catch (err: any) {
      setContentData('// Không thể tải nội dung gửi');
      toast.error(err.message || 'Không thể tải nội dung');
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
    } catch (err: any) {
      setContentData('// Không thể tải nội dung nhận');
      toast.error(err.message || 'Không thể tải nội dung');
    } finally {
      setContentLoading(false);
    }
  }, []);

  // ============================================================
  // Sharing tab
  // ============================================================
  const handleSearchSharing = useCallback(async () => {
    setSharingLoading(true);
    setSharingError(null);
    try {
      const data = await interconnectService.listSharingLogs();
      setSharingLogs(data);
    } catch (err: any) {
      setSharingError(err.message || 'Không thể tải danh sách chia sẻ dữ liệu');
    } finally {
      setSharingLoading(false);
    }
  }, []);

  const handleViewSharingDetail = useCallback(async (log: DataSharingLog) => {
    setSharingDetailLoading(true);
    setSharingDetailModalOpen(true);
    try {
      const data = await interconnectService.getSharingLogDetail(log.id);
      setSharingDetail(data);
    } catch (err: any) {
      toast.error(err.message || 'Không thể tải chi tiết');
      setSharingDetail(null);
    } finally {
      setSharingDetailLoading(false);
    }
  }, []);

  // ============================================================
  // Paginated slices
  // ============================================================
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return integrations.slice(start, start + pageSize).map((item, idx) => ({
      ...item,
      _seq: start + idx + 1,
    }));
  }, [integrations, page, pageSize]);

  const paginatedTransactions = useMemo(() => {
    const start = (txPage - 1) * txPageSize;
    return transactions.slice(start, start + txPageSize).map((item, idx) => ({
      ...item,
      _seq: start + idx + 1,
    }));
  }, [transactions, txPage, txPageSize]);

  // ============================================================
  // Integration table columns
  // ============================================================
  const integrationColumns = useMemo(
    () => [
      {
        key: 'sequenceNo',
        label: 'STT',
        width: 60,
        align: 'center' as const,
        render: (_: unknown, record: any) => (
          <span style={{ fontSize: fontSizeMd }}>{record._seq}</span>
        ),
      },
      {
        key: 'accountName',
        label: 'Tên tài khoản',
        dataIndex: 'accountName',
        width: 180,
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
        width: 140,
        align: 'center' as const,
        render: (status: string) => renderStatusTag(status),
      },
      {
        key: 'actions',
        label: 'Thao tác',
        width: 220,
        align: 'center' as const,
        render: (_: unknown, record: IntegrationConnection) => {
          const isExpanded = expandedRowKeys.includes(record.id);
          return (
            <div className="table-actions" style={{ justifyContent: 'center' }}>
              <Button
                type="link"
                icon={<HistoryOutlined />}
                onClick={() => handleExpandRow(!isExpanded, record)}
                style={{ fontSize: fontSizeMd, color: actionPrimary, padding: '4px 8px' }}
              >
                Xem LS
              </Button>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleOpenEdit(record)}
                style={{ fontSize: fontSizeMd, color: actionPrimary, padding: '4px 8px' }}
              >
                Sửa
              </Button>
            </div>
          );
        },
      },
    ],
    [expandedRowKeys, handleExpandRow, handleOpenEdit],
  );

  // ============================================================
  // Transaction sub-table columns
  // ============================================================
  const transactionColumns = useMemo(
    () => [
      {
        key: 'sequenceNo',
        label: 'STT',
        width: 50,
        align: 'center' as const,
        render: (_: unknown, record: any) => (
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
        width: 100,
      },
      {
        key: 'name',
        label: 'Tên',
        dataIndex: 'name',
        width: 180,
      },
      {
        key: 'referenceNumber',
        label: 'Số TC',
        dataIndex: 'referenceNumber',
        width: 120,
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
        width: 150,
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
        width: 150,
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
        width: 150,
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
        width: 120,
        render: (val: string) =>
          val || (
            <Typography.Text type="secondary" style={{ fontSize: fontSizeMd }}>
              &mdash;
            </Typography.Text>
          ),
      },
      {
        key: 'actions',
        label: 'Thao tác',
        width: 240,
        align: 'center' as const,
        render: (_: unknown, record: IntegrationTransaction) => (
          <div className="table-actions" style={{ justifyContent: 'center' }}>
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleViewSentContent(record)}
              style={{ fontSize: fontSizeMd, color: actionPrimary, padding: '4px 8px' }}
            >
              Xem ND gửi
            </Button>
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleViewReceivedContent(record)}
              style={{ fontSize: fontSizeMd, color: actionPrimary, padding: '4px 8px' }}
            >
              Xem ND nhận
            </Button>
          </div>
        ),
      },
    ],
    [handleViewSentContent, handleViewReceivedContent],
  );

  // ============================================================
  // Sharing table columns
  // ============================================================
  const sharingDataWithSeq = useMemo(
    () => sharingLogs.map((item, idx) => ({ ...item, _seq: idx + 1 })),
    [sharingLogs],
  );

  const sharingColumns = useMemo(
    () => [
      {
        key: 'sequenceNo',
        label: 'STT',
        width: 60,
        align: 'center' as const,
        render: (_: unknown, record: any) => (
          <span style={{ fontSize: fontSizeMd }}>{record._seq}</span>
        ),
      },
      {
        key: 'accountName',
        label: 'Tên tài khoản',
        dataIndex: 'accountName',
        width: 180,
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
        width: 180,
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
      {
        key: 'actions',
        label: 'Thao tác',
        width: 180,
        align: 'center' as const,
        render: (_: unknown, record: DataSharingLog) => (
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewSharingDetail(record)}
            style={{ fontSize: fontSizeMd, color: actionPrimary, padding: '4px 8px' }}
          >
            Xem chi tiết
          </Button>
        ),
      },
    ],
    [handleViewSharingDetail],
  );

  // ============================================================
  // Integration filter fields (passed to shared FilterBar)
  // ============================================================
  const integrationFilterFields = useMemo(
    () => [
      {
        key: 'connectionName',
        type: 'search' as const,
        label: 'Tên kết nối',
        placeholder: 'Nhập tên kết nối',
      },
      {
        key: 'senderSystem',
        type: 'search' as const,
        label: 'Hệ thống gửi',
        placeholder: 'Nhập hệ thống gửi',
      },
      {
        key: 'status',
        type: 'select' as const,
        label: 'Trạng thái',
        placeholder: 'Chọn trạng thái',
        options: [
          { value: 'ACTIVE', label: 'Sử dụng' },
          { value: 'INACTIVE', label: 'Không sử dụng' },
        ],
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
      const emptyFilters: Record<string, any> = {};
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

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: spaceSm, flexShrink: 0 }}>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleTxFilterReset}
              style={{
                color: textSecondary,
                borderColor: borderDefault,
                borderRadius: radiusPill,
                height: 40,
                fontSize: fontSizeMd,
              }}
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleTxFilterSearch}
              style={{
                background: actionPrimary,
                borderColor: actionPrimary,
                borderRadius: radiusPill,
                height: 40,
                fontSize: fontSizeMd,
              }}
            >
              Tìm kiếm
            </Button>
          </div>
        </div>

        {/* Advanced search toggle */}
        <div style={{ marginTop: spaceSm }}>
          <Button
            type="link"
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            style={{ color: actionPrimary, fontSize: fontSizeMd, padding: 0 }}
          >
            {showAdvancedSearch ? 'Thu gọn tìm kiếm nâng cao' : 'Tìm kiếm nâng cao'}
          </Button>
          {showAdvancedSearch && (
            <Row gutter={[spaceMd, spaceSm]} style={{ marginTop: spaceSm }}>
              <Col xs={24} sm={8}>
                <div
                  style={{
                    fontSize: fontSizeMd,
                    color: colors.sidebarBg,
                    fontWeight: fontWeightBold,
                    marginBottom: 4,
                  }}
                >
                  Mã nhận
                </div>
                <Input
                  placeholder="Nhập mã nhận"
                  allowClear
                  value={transactionFilters.receiverCode || ''}
                  onChange={(e) =>
                    setTransactionFilters((prev) => ({
                      ...prev,
                      receiverCode: e.target.value,
                    }))
                  }
                  style={{ borderRadius: radiusPill, height: 40 }}
                />
              </Col>
              <Col xs={24} sm={8}>
                <div
                  style={{
                    fontSize: fontSizeMd,
                    color: colors.sidebarBg,
                    fontWeight: fontWeightBold,
                    marginBottom: 4,
                  }}
                >
                  ID giao dịch
                </div>
                <Input
                  placeholder="Nhập ID giao dịch"
                  allowClear
                  value={transactionFilters.transactionId || ''}
                  onChange={(e) =>
                    setTransactionFilters((prev) => ({
                      ...prev,
                      transactionId: e.target.value,
                    }))
                  }
                  style={{ borderRadius: radiusPill, height: 40 }}
                />
              </Col>
              <Col xs={24} sm={8}>
                <div
                  style={{
                    fontSize: fontSizeMd,
                    color: colors.sidebarBg,
                    fontWeight: fontWeightBold,
                    marginBottom: 4,
                  }}
                >
                  Mục đích
                </div>
                <Input
                  placeholder="Nhập mục đích"
                  allowClear
                  value={transactionFilters.purpose || ''}
                  onChange={(e) =>
                    setTransactionFilters((prev) => ({
                      ...prev,
                      purpose: e.target.value,
                    }))
                  }
                  style={{ borderRadius: radiusPill, height: 40 }}
                />
              </Col>
            </Row>
          )}
        </div>
      </div>
    );
  };

  // ============================================================
  // Expanded row: transaction history sub-table
  // ============================================================
  const renderExpandedRow = (_record: IntegrationConnection) => {
    return (
      <div style={{ padding: `${spaceMd}px 0` }}>
        {renderTransactionFilter()}

        {transactionsError && (
          <Alert
            type="error"
            message={transactionsError}
            showIcon
            style={{
              marginBottom: spaceMd,
              borderRadius: radiusMd,
            }}
            action={
              <Button
                size="small"
                onClick={() =>
                  selectedConnectionId &&
                  fetchTransactions(selectedConnectionId, transactionFilters)
                }
              >
                Thử lại
              </Button>
            }
          />
        )}

        {transactionsLoading ? (
          <LoadingSkeleton rows={4} />
        ) : paginatedTransactions.length === 0 && !transactionsError ? (
          <EmptyState description="Không tìm thấy lịch sử giao dịch" />
        ) : (
          <>
            <DataTable
              columns={transactionColumns}
              dataSource={paginatedTransactions}
              rowKey="id"
              loading={transactionsLoading}
              scroll={{ x: 1400 }}
            />
            <Pagination
              total={transactions.length}
              current={txPage}
              pageSize={txPageSize}
              onChange={(p, ps) => {
                setTxPage(p);
                setTxPageSize(ps);
              }}
            />
          </>
        )}
      </div>
    );
  };

  // ============================================================
  // Tab content: "Tích hợp dữ liệu"
  // ============================================================
  const renderIntegrationTab = () => {
    return (
      <>
        <FilterBar
          fields={integrationFilterFields}
          onSearch={handleIntegrationSearch}
          onReset={handleIntegrationReset}
        />

        <div style={{ ...cardStyle, padding: '8px 16px' }}>
          {integrationsError && (
            <Alert
              type="error"
              message={integrationsError}
              showIcon
              style={{ marginBottom: spaceMd, borderRadius: radiusMd }}
              action={
                <Button size="small" onClick={() => fetchIntegrations()}>
                  Thử lại
                </Button>
              }
            />
          )}

          {integrationsLoading ? (
            <LoadingSkeleton rows={8} />
          ) : paginatedData.length === 0 && !integrationsError ? (
            <EmptyState description="Không tìm thấy kết nối nào" />
          ) : (
            <>
              <DataTable
                columns={integrationColumns}
                dataSource={paginatedData}
                rowKey="id"
                loading={integrationsLoading}
                scroll={{ x: 1200 }}
                expandable={{
                  expandedRowRender: renderExpandedRow,
                  expandedRowKeys,
                  onExpand: handleExpandRow,
                  expandIcon: () => null,
                }}
              />
              <Pagination
                total={integrations.length}
                current={page}
                pageSize={pageSize}
                onChange={(p, ps) => {
                  setPage(p);
                  setPageSize(ps);
                }}
              />
            </>
          )}
        </div>
      </>
    );
  };

  // ============================================================
  // Tab content: "Chia sẻ dữ liệu"
  // ============================================================
  const renderSharingTab = () => {
    return (
      <>
        <div style={{ ...cardStyle, marginBottom: spaceMd }}>
          <div style={{ display: 'flex', gap: spaceSm, alignItems: 'flex-end' }}>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearchSharing}
              style={{
                background: actionPrimary,
                borderColor: actionPrimary,
                borderRadius: radiusPill,
                height: 40,
                fontSize: fontSizeMd,
              }}
            >
              Tìm kiếm
            </Button>
          </div>
        </div>

        <div style={{ ...cardStyle, padding: '8px 16px' }}>
          {sharingError && (
            <Alert
              type="error"
              message={sharingError}
              showIcon
              style={{ marginBottom: spaceMd, borderRadius: radiusMd }}
              action={
                <Button size="small" onClick={handleSearchSharing}>
                  Thử lại
                </Button>
              }
            />
          )}

          {sharingLoading ? (
            <LoadingSkeleton rows={8} />
          ) : !sharingLoading &&
            sharingLogs.length === 0 &&
            !sharingError ? (
            <EmptyState description="Nhấn 'Tìm kiếm' để tải danh sách chia sẻ dữ liệu" />
          ) : (
            <DataTable
              columns={sharingColumns}
              dataSource={sharingDataWithSeq}
              rowKey="id"
              loading={sharingLoading}
              scroll={{ x: 1200 }}
            />
          )}
        </div>
      </>
    );
  };

  // ============================================================
  // Main render
  // ============================================================
  return (
    <div style={{ minHeight: '100%', marginTop: -8 }}>
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
            key: 'tich-hop',
            label: 'Tích hợp dữ liệu',
            children: renderIntegrationTab(),
          },
          {
            key: 'chia-se',
            label: 'Chia sẻ dữ liệu',
            children: renderSharingTab(),
          },
        ]}
        style={{ marginTop: -8 }}
      />

      {/* ================================================ */}
      {/* Edit Connection Modal */}
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
            Sửa kết nối
          </span>
        }
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        forceRender
        confirmLoading={editSubmitting}
        width={500}
        footer={[
          <Button
            key="cancel"
            onClick={() => setEditModalOpen(false)}
            style={{
              borderRadius: radiusPill,
              height: 40,
              fontSize: fontSizeMd,
              borderColor: borderDefault,
              color: textSecondary,
            }}
          >
            Hủy
          </Button>,
          <Button
            key="ok"
            type="primary"
            onClick={handleEditSubmit}
            loading={editSubmitting}
            style={{
              borderRadius: radiusPill,
              height: 40,
              fontSize: fontSizeMd,
              background: actionPrimary,
              borderColor: actionPrimary,
            }}
          >
            Lưu
          </Button>,
        ]}
      >
        <Spin spinning={editSubmitting}>
          <Form
            form={editForm}
            layout="vertical"
            style={{ marginTop: spaceMd }}
          >
            <Form.Item
              name="connectionName"
              label={
                <span
                  style={{
                    color: colors.sidebarBg,
                    fontWeight: fontWeightBold,
                    fontSize: fontSizeMd,
                  }}
                >
                  Tên kết nối
                </span>
              }
              style={{ marginBottom: spaceFormField }}
              rules={[{ required: true, message: 'Vui lòng nhập tên kết nối' }]}
            >
              <Input
                placeholder="Nhập tên kết nối"
                style={{ borderRadius: radiusPill, height: 40 }}
              />
            </Form.Item>
            <Form.Item
              name="password"
              label={
                <span
                  style={{
                    color: colors.sidebarBg,
                    fontWeight: fontWeightBold,
                    fontSize: fontSizeMd,
                  }}
                >
                  Mật khẩu
                </span>
              }
              style={{ marginBottom: spaceFormField }}
            >
              <Input.Password
                placeholder="Nhập mật khẩu mới (nếu muốn thay đổi)"
                style={{ borderRadius: radiusPill, height: 40 }}
              />
            </Form.Item>
            <Form.Item
              name="status"
              label={
                <span
                  style={{
                    color: colors.sidebarBg,
                    fontWeight: fontWeightBold,
                    fontSize: fontSizeMd,
                  }}
                >
                  Trạng thái
                </span>
              }
              style={{ marginBottom: spaceFormField }}
              rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
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
        </Spin>
      </Modal>

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
      {/* Sharing Detail Modal */}
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
            Chi tiết chia sẻ dữ liệu
          </span>
        }
        open={sharingDetailModalOpen}
        onCancel={() => setSharingDetailModalOpen(false)}
        footer={[
          <Button
            key="close"
            onClick={() => setSharingDetailModalOpen(false)}
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
        width={600}
      >
        <Spin spinning={sharingDetailLoading}>
          {sharingDetail ? (
            <div style={{ marginTop: spaceMd }}>
              <Row gutter={[spaceMd, spaceMd]}>
                <Col span={12}>
                  <div style={metaStyle}>Mã giao dịch</div>
                  <div
                    style={{
                      fontSize: fontSizeMd,
                      fontWeight: fontWeightMedium,
                      color: textPrimary,
                      marginTop: 2,
                    }}
                  >
                    {sharingDetail.transactionCode}
                  </div>
                </Col>
                <Col span={12}>
                  <div style={metaStyle}>Tên tài khoản</div>
                  <div
                    style={{
                      fontSize: fontSizeMd,
                      fontWeight: fontWeightMedium,
                      color: textPrimary,
                      marginTop: 2,
                    }}
                  >
                    {sharingDetail.accountName}
                  </div>
                </Col>
                <Col span={12}>
                  <div style={metaStyle}>Tên kết nối</div>
                  <div
                    style={{
                      fontSize: fontSizeMd,
                      fontWeight: fontWeightMedium,
                      color: textPrimary,
                      marginTop: 2,
                    }}
                  >
                    {sharingDetail.connectionName}
                  </div>
                </Col>
                <Col span={12}>
                  <div style={metaStyle}>Hệ thống gửi</div>
                  <div
                    style={{
                      fontSize: fontSizeMd,
                      fontWeight: fontWeightMedium,
                      color: textPrimary,
                      marginTop: 2,
                    }}
                  >
                    {sharingDetail.senderSystem}
                  </div>
                </Col>
                <Col span={12}>
                  <div style={metaStyle}>Hệ thống nhận</div>
                  <div
                    style={{
                      fontSize: fontSizeMd,
                      fontWeight: fontWeightMedium,
                      color: textPrimary,
                      marginTop: 2,
                    }}
                  >
                    {sharingDetail.receiverSystem}
                  </div>
                </Col>
                <Col span={12}>
                  <div style={metaStyle}>Trạng thái</div>
                  <div style={{ marginTop: 2 }}>
                    {renderStatusTag(sharingDetail.status)}
                  </div>
                </Col>
                <Col span={24}>
                  <div style={metaStyle}>Thời gian tạo</div>
                  <div
                    style={{
                      fontSize: fontSizeMd,
                      fontWeight: fontWeightMedium,
                      color: textPrimary,
                      marginTop: 2,
                    }}
                  >
                    {dayjs(sharingDetail.createdAt).format('DD/MM/YYYY HH:mm')}
                  </div>
                </Col>
                {sharingDetail.detailContent && (
                  <Col span={24}>
                    <div style={{ ...metaStyle, marginBottom: 4 }}>
                      Nội dung chi tiết
                    </div>
                    <pre
                      style={{
                        background: colors.bodyBg,
                        padding: spaceSm,
                        borderRadius: radiusMd,
                        fontSize: fontSizeSm,
                        fontFamily: fontMono,
                        lineHeight: 1.6,
                        maxHeight: 300,
                        overflow: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        margin: 0,
                        border: `1px solid ${borderDefault}`,
                      }}
                    >
                      {sharingDetail.detailContent}
                    </pre>
                  </Col>
                )}
              </Row>
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
      </Modal>
    </div>
  );
}

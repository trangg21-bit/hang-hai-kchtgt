import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Button, Tag, Modal, Input, Select, DatePicker, Alert,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  HistoryOutlined,
  SearchOutlined,
  DownOutlined,
  UpOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  portCRUD,
  portApproval,
} from '../../services/portService';
import type { Port } from '../../types/port';
import { organizationService } from '../../services/organizationService';
import type { Organization } from '../../services/organizationService';
import { usePermissionStore } from '../../store/permissionStore';
import { ScreenHeader, FilterBar, StatusTabs, DataTable } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';
import {
  statusOperational,
  statusAttention,
  statusCritical,
  statusDraft,
  actionPrimary,
  cardStyle,
  textPrimary,
  textSecondary,
  textTertiary,
  borderDefault,
  fontSizeMd,
  fontSizeLg,
  fontWeightMedium,
  fontWeightBold,
  radiusPill,
  spaceSm,
  spaceMd,
  spaceFormField,
  metaStyle,
} from '../../tokens';
import { colors } from '../../theme';

// ── Constants ────────────────────────────────────────────────────────

const APPROVAL_STYLE_MAP: Record<string, { color: string; label: string }> = {
  DRAFT: { color: statusDraft, label: 'Nháp' },
  CHO_PHE_DUYET: { color: statusAttention, label: 'Chờ phê duyệt' },
  PENDING_APPROVAL: { color: statusAttention, label: 'Chờ phê duyệt' },
  DUOC_PHE_DUYET: { color: statusOperational, label: 'Được phê duyệt' },
  APPROVED: { color: statusOperational, label: 'Được phê duyệt' },
  TU_CHOI: { color: statusCritical, label: 'Từ chối' },
  REJECTED: { color: statusCritical, label: 'Từ chối' },
  TAM_NGUNG: { color: statusAttention, label: 'Tạm ngừng' },
  SUSPENDED: { color: statusAttention, label: 'Tạm ngừng' },
  DELETED: { color: statusDraft, label: 'Đã xóa' },
};

const PORT_CLASSIFICATION_OPTIONS = [
  { value: 1, label: 'Cảng biển loại I' },
  { value: 2, label: 'Cảng biển loại II' },
  { value: 3, label: 'Cảng biển loại III' },
  { value: 4, label: 'Cảng biển loại IV' },
  { value: 5, label: 'Cảng biển loại V' },
];

const PORT_GROUP_OPTIONS = [
  { value: 1, label: 'Nhóm 1' },
  { value: 2, label: 'Nhóm 2' },
  { value: 3, label: 'Nhóm 3' },
  { value: 4, label: 'Nhóm 4' },
  { value: 5, label: 'Nhóm 5' },
];

const STATUS_FILTER_OPTIONS = [
  { value: 'DRAFT', label: 'Nháp' },
  { value: 'PENDING_APPROVAL', label: 'Chờ phê duyệt' },
  { value: 'APPROVED', label: 'Được phê duyệt' },
  { value: 'REJECTED', label: 'Từ chối' },
  { value: 'SUSPENDED', label: 'Tạm ngừng' },
  { value: 'DELETED', label: 'Đã xóa' },
];

const TAB_STATUS_LIST = [
  { key: 'all', label: 'Tất cả', color: textSecondary },
  { key: 'DRAFT', label: 'Nháp', color: statusDraft },
  { key: 'PENDING_APPROVAL', label: 'Chờ phê duyệt', color: statusAttention },
  { key: 'APPROVED', label: 'Được phê duyệt', color: statusOperational },
  { key: 'REJECTED', label: 'Từ chối', color: statusCritical },
  { key: 'SUSPENDED', label: 'Tạm ngừng', color: statusAttention },
  { key: 'DELETED', label: 'Đã xóa', color: statusDraft },
];

const STATUS_QUERY_MAP: Record<string, string | undefined> = {
  all: undefined,
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED',
  DELETED: 'DELETED',
};

// ── Helper: format date ──────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return dayjs(dateStr).format('DD/MM/YYYY HH:mm');
  } catch {
    return dateStr;
  }
}

// ── Component ────────────────────────────────────────────────────────

export default function PortList() {
  const navigate = useNavigate();
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  // ── Filter state ─────────────────────────────────────────────────
  const [managingUnitId, setManagingUnitId] = useState<string | undefined>();
  const [filterPortName, setFilterPortName] = useState('');
  const [filterPortClassification, setFilterPortClassification] = useState<number | undefined>();
  const [filterPortGroup, setFilterPortGroup] = useState<number | undefined>();
  const [filterProvince, setFilterProvince] = useState('');
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState<string | undefined>();
  const [filterUpdatedTo, setFilterUpdatedTo] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState('all');

  // ── Pagination ──────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // ── Data ─────────────────────────────────────────────────────────
  const [dataSource, setDataSource] = useState<Port[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // ── Organizations for lookup ─────────────────────────────────────
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const orgMap = useMemo(() => {
    const map = new Map<string, string>();
    organizations.forEach((o) => {
      map.set(o.id, o.code ? `${o.code} - ${o.name}` : o.name);
    });
    return map;
  }, [organizations]);

  // ── Tab counts ──────────────────────────────────────────────────
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  // ── Advanced filter toggle ───────────────────────────────────────
  const [advancedVisible, setAdvancedVisible] = useState(false);

  // ── Delete confirmation modal ───────────────────────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<Port | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // ── Reject modal ────────────────────────────────────────────────
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRecord, setRejectingRecord] = useState<Port | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // ── Load organizations ──────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const resp = await organizationService.list({ pageSize: 1000 });
        setOrganizations(resp.data || []);
      } catch (err) {
        console.error('Failed to load organizations', err);
      }
    })();
  }, []);

  // ── Fetch tab counts ────────────────────────────────────────────
  const fetchCounts = useCallback(async (orgId: string | undefined) => {
    try {
      const results = await Promise.allSettled(
        TAB_STATUS_LIST.map((tab) =>
          tab.key === 'all'
            ? portCRUD.search({ managingUnitId: orgId, page: 1, pageSize: 1 })
            : portCRUD.search({ status: STATUS_QUERY_MAP[tab.key], managingUnitId: orgId, page: 1, pageSize: 1 }),
        ),
      );
      const counts: Record<string, number> = {};
      results.forEach((result, idx) => {
        const tabKey = TAB_STATUS_LIST[idx]?.key || 'all';
        counts[tabKey] = result.status === 'fulfilled' ? result.value.total : 0;
      });
      setTabCounts(counts);
    } catch {
      // silently ignore count errors
    }
  }, []);

  // ── Fetch main data ─────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!managingUnitId) {
      setDataSource([]);
      setTotal(0);
      return;
    }
    setIsLoading(true);
    setIsError(false);
    setError(null);
    try {
      const res = await portCRUD.search({
        managingUnitId,
        portName: filterPortName || undefined,
        portClassification: filterPortClassification,
        portGroup: filterPortGroup,
        province: filterProvince || undefined,
        updatedFrom: filterUpdatedFrom,
        updatedTo: filterUpdatedTo,
        status: STATUS_QUERY_MAP[activeTab],
        page,
        pageSize,
      });
      setDataSource(res.data);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách cảng biển'));
    } finally {
      setIsLoading(false);
    }
  }, [
    managingUnitId, filterPortName, filterPortClassification,
    filterPortGroup, filterProvince, filterUpdatedFrom, filterUpdatedTo,
    activeTab, page, pageSize,
  ]);

  // Fetch data when filters change
  useEffect(() => { void fetchData(); }, [fetchData]);

  // Fetch counts when managingUnit changes
  useEffect(() => { void fetchCounts(managingUnitId); }, [managingUnitId, fetchCounts]);

  // ── Handlers ────────────────────────────────────────────────────

  const handleBasicSearch = useCallback((values: Record<string, any>) => {
    setManagingUnitId(values.managingUnitId || undefined);
    setFilterPortName(values.portName || '');
    setFilterPortClassification(values.portClassification ?? undefined);
    setPage(1);
    setActiveTab('all');
  }, []);

  const handleAdvancedSearch = useCallback(() => {
    setPage(1);
    // trigger refetch via deps — fetchData already watches these
  }, []);

  const handleFilterReset = useCallback(() => {
    setManagingUnitId(undefined);
    setFilterPortName('');
    setFilterPortClassification(undefined);
    setFilterPortGroup(undefined);
    setFilterProvince('');
    setFilterUpdatedFrom(undefined);
    setFilterUpdatedTo(undefined);
    setFilterStatus(undefined);
    setActiveTab('all');
    setAdvancedVisible(false);
    setPage(1);
  }, []);

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key);
    setPage(1);
  }, []);

  // ── Delete confirmation ─────────────────────────────────────────

  const openDeleteModal = useCallback((record: Port) => {
    setDeletingRecord(record);
    setDeleteConfirmText('');
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingRecord) return;
    const expectedText = deletingRecord.portName || 'XÓA';
    if (deleteConfirmText.trim() !== expectedText && deleteConfirmText.trim() !== 'XÓA') {
      toast.error('Vui lòng nhập đúng tên cảng hoặc gõ "XÓA" để xác nhận');
      return;
    }
    try {
      await portCRUD.delete(deletingRecord.id);
      toast.success('Đã xóa cảng biển');
      setDeleteModalOpen(false);
      setDeletingRecord(null);
      setDeleteConfirmText('');
      void fetchData();
      void fetchCounts(managingUnitId);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  }, [deletingRecord, deleteConfirmText, fetchData, fetchCounts, managingUnitId]);

  // ── Approval handlers ───────────────────────────────────────────

  const handleApprove = useCallback(
    async (record: Port) => {
      try {
        await portApproval.approve(record.id);
        toast.success('Đã phê duyệt cảng biển');
        void fetchData();
        void fetchCounts(managingUnitId);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
      }
    },
    [fetchData, fetchCounts, managingUnitId],
  );

  const openRejectModal = useCallback((record: Port) => {
    setRejectingRecord(record);
    setRejectReason('');
    setRejectModalOpen(true);
  }, []);

  const handleConfirmReject = useCallback(async () => {
    if (!rejectingRecord) return;
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    try {
      await portApproval.reject(rejectingRecord.id, rejectReason.trim());
      toast.success('Đã từ chối phê duyệt');
      setRejectModalOpen(false);
      setRejectingRecord(null);
      setRejectReason('');
      void fetchData();
      void fetchCounts(managingUnitId);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
    }
  }, [rejectingRecord, rejectReason, fetchData, fetchCounts, managingUnitId]);

  // ── Filter UI config ────────────────────────────────────────────

  const basicFilterFields = useMemo(() => [
    {
      key: 'managingUnitId',
      type: 'select' as const,
      label: 'Đơn vị quản lý',
      placeholder: 'Chọn đơn vị quản lý',
      options: organizations.map((o) => ({
        value: o.id,
        label: o.code ? `${o.code} - ${o.name}` : o.name,
      })),
    },
    {
      key: 'portName',
      type: 'search' as const,
      label: 'Tên cảng biển',
      placeholder: 'Nhập tên cảng biển',
    },
    {
      key: 'portClassification',
      type: 'select' as const,
      label: 'Phân cấp cảng biển',
      placeholder: 'Chọn phân cấp',
      options: PORT_CLASSIFICATION_OPTIONS.map((o) => ({
        value: String(o.value),
        label: o.label,
      })),
    },
  ], [organizations]);

  // ── Header actions ──────────────────────────────────────────────

  const headerActions = useMemo(() => {
    const actions: any[] = [];
    if (hasPerm('port:create')) {
      actions.push({
        key: 'create',
        label: 'Thêm mới',
        variant: 'primary' as const,
        icon: <PlusOutlined />,
        onClick: () => navigate('/Port/create'),
      });
    }
    return actions;
  }, [hasPerm, navigate]);

  // ── Table columns (10 columns) ──────────────────────────────────

  const columns = useMemo(() => [
    // 1. STT
    {
      key: 'sequenceNo',
      label: 'STT',
      width: 55,
      type: 'mono' as const,
      align: 'center' as const,
      render: (_: unknown, __: Port, idx: number) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary }}>
          {(page - 1) * pageSize + idx + 1}
        </span>
      ),
    },
    // 2. Đơn vị quản lý
    {
      key: 'orgUnitId',
      label: 'Đơn vị quản lý',
      dataIndex: 'orgUnitId',
      width: 180,
      ellipsis: true,
      render: (orgId: string) => (
        <span style={{ fontSize: fontSizeMd, color: textPrimary }}>
          {orgMap.get(orgId) || orgId || '—'}
        </span>
      ),
    },
    // 3. Tên cảng biển
    {
      key: 'portName',
      label: 'Tên cảng biển',
      dataIndex: 'portName',
      width: 200,
      ellipsis: true,
      render: (name: string) => (
        <span style={{ fontSize: fontSizeMd, fontWeight: fontWeightMedium, color: textPrimary }}>
          {name || '—'}
        </span>
      ),
    },
    // 4. Nhóm cảng biển
    {
      key: 'portGroup',
      label: 'Nhóm cảng biển',
      dataIndex: 'portGroup',
      width: 120,
      align: 'center' as const,
      render: (group: number | null | undefined) => {
        if (group == null) return <span style={{ color: textTertiary }}>—</span>;
        const label = PORT_GROUP_OPTIONS.find((o) => o.value === Number(group))?.label || `Nhóm ${group}`;
        return <Tag color="blue">{label}</Tag>;
      },
    },
    // 5. Địa điểm
    {
      key: 'province',
      label: 'Địa điểm',
      dataIndex: 'province',
      width: 150,
      ellipsis: true,
      render: (province: string) => (
        <span style={{ fontSize: fontSizeMd, color: textPrimary }}>
          {province || '—'}
        </span>
      ),
    },
    // 6. Phân cấp cảng biển
    {
      key: 'portClassification',
      label: 'Phân cấp cảng biển',
      dataIndex: 'phanCap',
      width: 150,
      align: 'center' as const,
      render: (phanCap: number | null | undefined) => {
        if (phanCap == null) return <span style={{ color: textTertiary }}>—</span>;
        const label = PORT_CLASSIFICATION_OPTIONS.find((o) => o.value === Number(phanCap))?.label || `Loại ${phanCap}`;
        return <Tag color="cyan">{label}</Tag>;
      },
    },
    // 7. Ngày cập nhật
    {
      key: 'updatedAt',
      label: 'Ngày cập nhật',
      dataIndex: 'updatedAt',
      width: 160,
      align: 'center' as const,
      render: (v: string | null | undefined) => (
        <span style={{ ...metaStyle }}>
          {formatDate(v)}
        </span>
      ),
    },
    // 8. Cán bộ cập nhật
    {
      key: 'updatedBy',
      label: 'Cán bộ cập nhật',
      dataIndex: 'updatedBy',
      width: 150,
      ellipsis: true,
      render: (v: string | null | undefined) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary }}>
          {v || '—'}
        </span>
      ),
    },
    // 9. Trạng thái (approval_status badge)
    {
      key: 'approvalStatus',
      label: 'Trạng thái',
      dataIndex: 'approvalStatus',
      width: 150,
      align: 'center' as const,
      render: (status: string | null | undefined) => {
        const s = APPROVAL_STYLE_MAP[status || ''] || {
          color: textTertiary,
          label: status || '—',
        };
        return (
          <span style={{
            display: 'inline-flex',
            padding: '2px 10px',
            borderRadius: radiusPill,
            fontSize: fontSizeMd,
            fontWeight: fontWeightMedium,
            background: `${s.color}15`,
            color: s.color,
          }}>
            {s.label}
          </span>
        );
      },
    },
  ], [page, pageSize, orgMap]);

  // ── Row actions with RBAC ───────────────────────────────────────

  const rowActions = useCallback((record: Port) => {
    const actions: {
      key: string;
      label: string;
      icon?: React.ReactNode;
      onClick: () => void;
      danger?: boolean;
    }[] = [];

    // Xem chi tiết
    actions.push({
      key: 'view',
      label: 'Xem chi tiết',
      icon: <EyeOutlined />,
      onClick: () => navigate(`/Port/${record.id}`),
    });

    // Sửa — Admin / Cán bộ
    if (hasPerm('port:update')) {
      actions.push({
        key: 'edit',
        label: 'Sửa',
        icon: <EditOutlined />,
        onClick: () => navigate(`/Port/${record.id}/edit`),
      });
    }

    // Lịch sử
    actions.push({
      key: 'history',
      label: 'Lịch sử',
      icon: <HistoryOutlined />,
      onClick: () => navigate(`/Port/${record.id}/history`),
    });

    // Phê duyệt / Từ chối — Lãnh đạo / Admin
    const canApprove = hasPerm('port:approve');
    const pendingStatuses = ['PENDING_APPROVAL', 'CHO_PHE_DUYET'];
    if (canApprove && pendingStatuses.includes(record.approvalStatus || '')) {
      actions.push({
        key: 'approve',
        label: 'Phê duyệt',
        icon: <CheckCircleOutlined />,
        onClick: () => handleApprove(record),
      });
      actions.push({
        key: 'reject',
        label: 'Từ chối',
        icon: <CloseCircleOutlined />,
        onClick: () => openRejectModal(record),
        danger: true,
      });
    }

    // Xóa — Admin / Lãnh đạo (chỉ khi ở trạng thái draft hoặc rejected)
    const deletableStatuses = ['DRAFT', 'TU_CHOI', 'REJECTED', 'TAM_NGUNG', 'SUSPENDED'];
    if (hasPerm('port:delete') && deletableStatuses.includes(record.approvalStatus || '')) {
      actions.push({
        key: 'delete',
        label: 'Xóa',
        icon: <DeleteOutlined />,
        onClick: () => openDeleteModal(record),
        danger: true,
      });
    }

    return actions;
  }, [hasPerm, navigate, handleApprove, openDeleteModal, openRejectModal]);

  // ── Render content ──────────────────────────────────────────────

  const renderContent = () => {
    if (isLoading) return <LoadingSkeleton rows={8} />;
    if (isError) {
      return (
        <ErrorState
          message={error?.message || 'Không thể tải danh sách cảng biển'}
          onRetry={fetchData}
        />
      );
    }

    if (dataSource.length === 0) {
      if (managingUnitId) {
        return <EmptyState description="Không tìm thấy cảng biển nào phù hợp" />;
      }
      return (
        <EmptyState
          description="Vui lòng chọn Đơn vị quản lý để xem danh sách"
          image={<ExclamationCircleOutlined style={{ fontSize: 48, color: textTertiary }} />}
        />
      );
    }

    return (
      <div style={{ overflowX: 'auto' }}>
        <DataTable
          columns={columns}
          dataSource={dataSource}
          rowKey="id"
          rowActions={rowActions}
          scroll={{ x: 1400 }}
        />
        <Pagination
          total={total}
          current={page}
          pageSize={pageSize}
          onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
        />
      </div>
    );
  };

  // ── Advanced filter panel ───────────────────────────────────────

  const advancedFilterPanel = (
    <div
      style={{
        ...cardStyle,
        marginBottom: spaceMd,
        padding: advancedVisible ? spaceMd : 0,
        maxHeight: advancedVisible ? 400 : 0,
        overflow: 'hidden',
        transition: 'max-height 0.25s ease, padding 0.25s ease',
        border: advancedVisible ? `0.5px solid ${borderDefault}` : 'none',
      }}
    >
      {advancedVisible && (
        <div style={{ display: 'flex', gap: spaceSm, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {/* Nhóm cảng */}
          <div style={{ flex: '1 1 160px', minWidth: 140 }}>
            <div style={{ fontSize: fontSizeMd, color: colors.sidebarBg, fontWeight: fontWeightBold, marginBottom: 4 }}>
              Nhóm cảng biển
            </div>
            <Select
              placeholder="Chọn nhóm cảng"
              allowClear
              value={filterPortGroup}
              onChange={(val) => setFilterPortGroup(val ?? undefined)}
              options={PORT_GROUP_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
            />
          </div>

          {/* Tỉnh/thành phố */}
          <div style={{ flex: '1 1 160px', minWidth: 140 }}>
            <div style={{ fontSize: fontSizeMd, color: colors.sidebarBg, fontWeight: fontWeightBold, marginBottom: 4 }}>
              Tỉnh/Thành phố
            </div>
            <Input
              placeholder="Nhập tỉnh/thành phố"
              allowClear
              value={filterProvince}
              onChange={(e) => setFilterProvince(e.target.value)}
              onPressEnter={handleAdvancedSearch}
              style={{ borderRadius: radiusPill, height: 40 }}
            />
          </div>

          {/* DateRange ngày cập nhật */}
          <div style={{ flex: '1 1 220px', minWidth: 200 }}>
            <div style={{ fontSize: fontSizeMd, color: colors.sidebarBg, fontWeight: fontWeightBold, marginBottom: 4 }}>
              Ngày cập nhật
            </div>
            <DatePicker.RangePicker
              value={
                filterUpdatedFrom && filterUpdatedTo
                  ? [dayjs(filterUpdatedFrom), dayjs(filterUpdatedTo)]
                  : null
              }
              onChange={(dates) => {
                setFilterUpdatedFrom(dates?.[0]?.startOf('day').toISOString() || undefined);
                setFilterUpdatedTo(dates?.[1]?.endOf('day').toISOString() || undefined);
              }}
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
              format="DD/MM/YYYY"
            />
          </div>

          {/* Select trạng thái */}
          <div style={{ flex: '1 1 160px', minWidth: 140 }}>
            <div style={{ fontSize: fontSizeMd, color: colors.sidebarBg, fontWeight: fontWeightBold, marginBottom: 4 }}>
              Trạng thái
            </div>
            <Select
              placeholder="Chọn trạng thái"
              allowClear
              value={filterStatus}
              onChange={(val) => {
                setFilterStatus(val ?? undefined);
                if (val) setActiveTab('all');
              }}
              options={STATUS_FILTER_OPTIONS}
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
            />
          </div>

          {/* Nút tìm kiếm nâng cao */}
          <div style={{ display: 'flex', gap: spaceSm, flexShrink: 0, paddingBottom: 0 }}>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleAdvancedSearch}
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
            <Button
              onClick={() => {
                setFilterPortGroup(undefined);
                setFilterProvince('');
                setFilterUpdatedFrom(undefined);
                setFilterUpdatedTo(undefined);
                setFilterStatus(undefined);
              }}
              style={{
                color: textSecondary,
                borderColor: borderDefault,
                borderRadius: radiusPill,
                height: 40,
                fontSize: fontSizeMd,
              }}
            >
              Xóa lọc
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  // ── JSX ─────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100%', marginTop: -8 }}>
      <ScreenHeader
        breadcrumb={[{ label: 'Quản lý cảng biển' }]}
        actions={headerActions}
      />

      {/* Basic FilterBar */}
      <FilterBar
        fields={basicFilterFields}
        onSearch={handleBasicSearch}
        onReset={handleFilterReset}
      />

      {/* Nâng cao toggle */}
      <div style={{ marginBottom: spaceSm, textAlign: 'right' }}>
        <Button
          type="link"
          icon={advancedVisible ? <UpOutlined /> : <DownOutlined />}
          onClick={() => setAdvancedVisible((v) => !v)}
          style={{
            color: actionPrimary,
            fontSize: fontSizeMd,
            fontWeight: fontWeightMedium,
            padding: 0,
          }}
        >
          {advancedVisible ? 'Ẩn tìm kiếm nâng cao' : 'Tìm kiếm nâng cao'}
        </Button>
      </div>

      {/* Advanced filter panel */}
      {advancedFilterPanel}

      {/* StatusTabs */}
      <div
        style={{
          ...cardStyle,
          marginBottom: spaceMd,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '8px 16px',
        }}
      >
        <StatusTabs
          tabs={TAB_STATUS_LIST.map((tab) => ({
            key: tab.key,
            label: tab.label,
            count: tabCounts[tab.key] ?? 0,
            color: tab.color,
            active: activeTab === tab.key,
          }))}
          onChange={handleTabChange}
        />
      </div>

      {/* Table */}
      <div style={{ ...cardStyle, padding: '8px 16px' }}>
        {renderContent()}
      </div>

      {/* ── Delete Confirmation Modal ────────────────────────────── */}
      <Modal
        title={
          <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>
            Xác nhận xóa cảng biển
          </span>
        }
        open={deleteModalOpen}
        onCancel={() => {
          setDeleteModalOpen(false);
          setDeletingRecord(null);
          setDeleteConfirmText('');
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setDeleteModalOpen(false);
              setDeletingRecord(null);
              setDeleteConfirmText('');
            }}
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
            key="delete"
            type="primary"
            danger
            onClick={handleConfirmDelete}
            style={{
              borderRadius: radiusPill,
              height: 40,
              fontSize: fontSizeMd,
            }}
          >
            Xác nhận xóa
          </Button>,
        ]}
        width={480}
      >
        <div style={{ padding: '8px 0' }}>
          <Alert
            message="Hành động này không thể hoàn tác"
            type="warning"
            showIcon
            icon={<ExclamationCircleOutlined />}
            style={{ marginBottom: spaceFormField, borderRadius: radiusPill }}
          />
          <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>
            Vui lòng nhập <strong>tên cảng</strong> hoặc gõ <strong>"XÓA"</strong> để xác nhận xóa.
          </p>
          {deletingRecord && (
            <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>
              Cảng: <strong style={{ color: textPrimary }}>{deletingRecord.portName}</strong>
            </p>
          )}
          <Input
            placeholder="Nhập tên cảng hoặc XÓA"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            onPressEnter={handleConfirmDelete}
            style={{ borderRadius: radiusPill, height: 40 }}
            autoFocus
          />
        </div>
      </Modal>

      {/* ── Reject Reason Modal ──────────────────────────────────── */}
      <Modal
        title={
          <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>
            Từ chối phê duyệt
          </span>
        }
        open={rejectModalOpen}
        onCancel={() => {
          setRejectModalOpen(false);
          setRejectingRecord(null);
          setRejectReason('');
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setRejectModalOpen(false);
              setRejectingRecord(null);
              setRejectReason('');
            }}
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
            key="reject"
            type="primary"
            danger
            onClick={handleConfirmReject}
            style={{
              borderRadius: radiusPill,
              height: 40,
              fontSize: fontSizeMd,
            }}
          >
            Xác nhận từ chối
          </Button>,
        ]}
        width={480}
      >
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>
            Vui lòng nhập lý do từ chối cho cảng:
          </p>
          {rejectingRecord && (
            <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>
              <strong style={{ color: textPrimary }}>{rejectingRecord.portName}</strong>
            </p>
          )}
          <Input.TextArea
            placeholder="Nhập lý do từ chối..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            style={{ borderRadius: 8, fontSize: fontSizeMd }}
          />
        </div>
      </Modal>
    </div>
  );
}

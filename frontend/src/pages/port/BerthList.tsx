import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Button, Tag, Modal, Input, Select, Alert, Descriptions, Divider,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  HistoryOutlined,
  FilterOutlined,
  ExclamationCircleOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  berthCRUD,
  berthApproval,
  portCRUD,
} from '../../services/portService';
import type { Berth } from '../../types/port';
import { organizationService } from '../../services/organizationService';
import type { Organization } from '../../services/organizationService';
import { usePermissionStore } from '../../store/permissionStore';
import { VIETNAM_PROVINCES } from '../../types/common';
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

const OPERATIONAL_STYLE_MAP: Record<string, { color: string; label: string }> = {
  DANG_KHAI_THAC: { color: statusOperational, label: 'Đang khai thác/Vận hành' },
  CHUA_KHAI_THAC: { color: statusAttention, label: 'Chưa khai thác/Vận hành' },
  DUNG_KHAI_THAC: { color: statusCritical, label: 'Dừng khai thác/Vận hành' },
};

const STRUCTURE_TYPE_OPTIONS = [
  { value: 1, label: 'Bến nước' },
  { value: 2, label: 'Bến bờ' },
  { value: 3, label: 'Bến phao' },
  { value: 4, label: 'Khác' },
];

const TAB_STATUS_LIST = [
  { key: 'all', label: 'Tất cả', color: textSecondary },
  { key: 'DRAFT', label: 'Nháp', color: statusDraft },
  { key: 'PENDING_APPROVAL', label: 'Chờ phê duyệt', color: statusAttention },
  { key: 'APPROVED', label: 'Được phê duyệt', color: statusOperational },
  { key: 'REJECTED', label: 'Từ chối', color: statusCritical },
];

const TAB_QUERY_MAP: Record<string, string | undefined> = {
  all: undefined,
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
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

export default function BerthList() {
  const navigate = useNavigate();
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  // ── Filter state ─────────────────────────────────────────────────
  const [managingUnitId, setManagingUnitId] = useState<string | undefined>();
  const [filterBerthName, setFilterBerthName] = useState('');
  const [filterOperationalStatus, setFilterOperationalStatus] = useState<string | undefined>();
  const [filterPortId, setFilterPortId] = useState<string | undefined>();
  const [filterWaterway, setFilterWaterway] = useState('');
  const [filterBerthCode, setFilterBerthCode] = useState('');
  const [filterOperationalFunction, setFilterOperationalFunction] = useState('');
  const [filterStructureType, setFilterStructureType] = useState<number | undefined>();
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<string | undefined>();
  const [filterProvince, setFilterProvince] = useState('');
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState<string | undefined>();
  const [filterUpdatedTo, setFilterUpdatedTo] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState('all');

  // ── Pagination ──────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // ── Data ─────────────────────────────────────────────────────────
  const [dataSource, setDataSource] = useState<Berth[]>([]);
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

  // ── Port options for lookup ──────────────────────────────────────
  const [portOptions, setPortOptions] = useState<{ value: string; label: string }[]>([]);

  // ── Tab counts ──────────────────────────────────────────────────
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  // ── Advanced filter toggle ───────────────────────────────────────
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // ── Detail modal ────────────────────────────────────────────────
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<Berth | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ── Delete confirmation modal ───────────────────────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<Berth | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // ── Reject modal ────────────────────────────────────────────────
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRecord, setRejectingRecord] = useState<Berth | null>(null);
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

  // ── Load port options ──────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await portCRUD.search({ page: 1, pageSize: 1000 });
        setPortOptions((res.data || []).map((p: any) => ({ value: p.id, label: p.portName })));
      } catch { /* ignore */ }
    })();
  }, []);

  // ── Fetch tab counts ────────────────────────────────────────────
  const fetchCounts = useCallback(async (orgId: string | undefined) => {
    try {
      const results = await Promise.allSettled(
        TAB_STATUS_LIST.map((tab) =>
          tab.key === 'all'
            ? berthCRUD.search({ orgUnitId: orgId, page: 1, pageSize: 1 })
            : berthCRUD.search({ approvalStatus: TAB_QUERY_MAP[tab.key], orgUnitId: orgId, page: 1, pageSize: 1 }),
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
      const res = await berthCRUD.search({
        orgUnitId: managingUnitId,
        berthName: filterBerthName || undefined,
        berthCode: filterBerthCode || undefined,
        portId: filterPortId,
        waterway: filterWaterway || undefined,
        operationalFunction: filterOperationalFunction || undefined,
        structureType: filterStructureType,
        operationalStatus: filterOperationalStatus,
        approvalStatus: TAB_QUERY_MAP[activeTab],
        provinceId: filterProvince || undefined,
        updatedFrom: filterUpdatedFrom,
        updatedTo: filterUpdatedTo,
        page,
        pageSize,
      });
      setDataSource(res.data);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách bến cảng'));
    } finally {
      setIsLoading(false);
    }
  }, [
    managingUnitId, filterBerthName, filterPortId, filterWaterway,
    filterBerthCode, filterOperationalFunction, filterOperationalStatus, activeTab, page, pageSize,
  ]);

  // Fetch data when filters change
  useEffect(() => { void fetchData(); }, [fetchData]);

  // Fetch counts when managingUnit changes
  useEffect(() => { void fetchCounts(managingUnitId); }, [managingUnitId, fetchCounts]);

  // ── Handlers ────────────────────────────────────────────────────

  const handleFilterSearch = useCallback((values: Record<string, any>) => {
    setManagingUnitId(values.managingUnitId || undefined);
    setFilterBerthName(values.search || '');
    setFilterOperationalStatus(values.operationalStatus || undefined);
    setFilterPortId(values.portId || undefined);
    setFilterWaterway(values.waterway || '');
    setFilterBerthCode(values.berthCode || '');
    setFilterOperationalFunction(values.operationalFunction || '');
    setFilterStructureType(values.structureType ? Number(values.structureType) : undefined);
    setFilterApprovalStatus(values.approvalStatus || undefined);
    setFilterProvince(values.provinceId || '');
    setFilterUpdatedFrom(values.updatedFrom || undefined);
    setFilterUpdatedTo(values.updatedTo || undefined);
    setPage(1);
    setActiveTab('all');
  }, []);

  const handleFilterReset = useCallback(() => {
    setManagingUnitId(undefined);
    setFilterBerthName('');
    setFilterOperationalStatus(undefined);
    setFilterPortId(undefined);
    setFilterWaterway('');
    setFilterBerthCode('');
    setFilterOperationalFunction('');
    setFilterStructureType(undefined);
    setFilterApprovalStatus(undefined);
    setFilterProvince('');
    setFilterUpdatedFrom(undefined);
    setFilterUpdatedTo(undefined);
    setActiveTab('all');
    setShowAdvancedFilters(false);
    setPage(1);
  }, []);

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key);
    setPage(1);
  }, []);

  // ── Detail modal ────────────────────────────────────────────────

  const openDetailModal = useCallback(async (record: Berth) => {
    setDetailModalOpen(true);
    setDetailRecord(record);
    setDetailLoading(true);
    try {
      const fresh = await berthCRUD.findById(record.id);
      setDetailRecord(fresh);
    } catch {
      // keep initial data
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // ── Delete confirmation ─────────────────────────────────────────

  const openDeleteModal = useCallback((record: Berth) => {
    setDeletingRecord(record);
    setDeleteConfirmText('');
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingRecord) return;
    const expectedText = deletingRecord.berthName || 'XÓA';
    if (deleteConfirmText.trim() !== expectedText && deleteConfirmText.trim() !== 'XÓA') {
      toast.error('Vui lòng nhập đúng tên bến hoặc gõ "XÓA" để xác nhận');
      return;
    }
    try {
      await berthCRUD.delete(deletingRecord.id);
      toast.success('Đã xóa bến cảng');
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
    async (record: Berth) => {
      try {
        await berthApproval.approve(record.id);
        toast.success('Đã phê duyệt bến cảng');
        void fetchData();
        void fetchCounts(managingUnitId);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
      }
    },
    [fetchData, fetchCounts, managingUnitId],
  );

  const openRejectModal = useCallback((record: Berth) => {
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
      await berthApproval.reject(rejectingRecord.id, rejectReason.trim());
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

  const filterFields = useMemo(() => [
    {
      key: 'managingUnitId',
      type: 'select' as const,
      label: 'Đơn vị quản lý',
      placeholder: 'Chọn đơn vị',
      width: 320,
      options: organizations.map((o) => ({ value: o.id, label: o.name })),
    },
    {
      key: 'portId',
      type: 'select' as const,
      label: 'Thuộc cảng biển',
      placeholder: 'Chọn cảng biển',
      width: 320,
      options: portOptions.map((o) => ({ value: o.value, label: o.label })),
    },
    {
      key: 'search',
      type: 'search' as const,
      label: 'Tên bến cảng',
      placeholder: 'Tìm theo tên bến...',
      width: 320,
    },
    {
      key: 'waterway',
      type: 'search' as const,
      label: 'Tuyến đường thủy',
      placeholder: 'Nhập tuyến đường thủy',
      width: 320,
    },
    {
      key: 'operationalStatus',
      type: 'select' as const,
      label: 'Tình trạng',
      placeholder: 'Chọn tình trạng',
      options: [
        { value: 'DANG_KHAI_THAC', label: 'Đang khai thác/Vận hành' },
        { value: 'CHUA_KHAI_THAC', label: 'Chưa khai thác/Vận hành' },
        { value: 'DUNG_KHAI_THAC', label: 'Dừng khai thác/Vận hành' },
      ],
    },
    // Advanced filters (collapsible)
    ...(showAdvancedFilters ? [
      {
        key: 'structureType',
        type: 'select' as const,
        label: 'Loại kết cấu',
        placeholder: 'Chọn loại kết cấu',
        options: STRUCTURE_TYPE_OPTIONS.map((o) => ({ value: String(o.value), label: o.label })),
      },
      {
        key: 'operationalFunction',
        type: 'search' as const,
        label: 'Công năng khai thác',
        placeholder: 'Nhập công năng',
        width: 320,
      },
      {
        key: 'provinceId',
        type: 'select' as const,
        label: 'Tỉnh/Thành phố',
        placeholder: 'Chọn tỉnh/thành phố',
        options: VIETNAM_PROVINCES.map((p) => ({ value: p, label: p })),
      },
      {
        key: 'updatedFrom',
        type: 'date' as const,
        label: 'Từ ngày',
        placeholder: 'Chọn ngày',
      },
      {
        key: 'updatedTo',
        type: 'date' as const,
        label: 'Đến ngày',
        placeholder: 'Chọn ngày',
      },
    ] : []),
  ], [organizations, portOptions, showAdvancedFilters]);

  // ── Header actions ──────────────────────────────────────────────

  const headerActions = useMemo(() => {
    const actions: any[] = [];
    if (hasPerm('berth:create')) {
      actions.push({
        key: 'create',
        label: 'Thêm mới',
        variant: 'primary' as const,
        icon: <PlusOutlined />,
        onClick: () => navigate('/berth/create'),
      });
    }
    return actions;
  }, [hasPerm, navigate]);

  // ── Table columns ───────────────────────────────────────────────

  const columns = useMemo(() => [
    // 1. STT
    {
      key: 'sequenceNo',
      label: 'STT',
      width: 55,
      type: 'mono' as const,
      align: 'center' as const,
      render: (_: unknown, __: Berth, idx: number) => (
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
      width: 160,
      ellipsis: true,
      render: (orgId: string) => (
        <span style={{ fontSize: fontSizeMd, color: textPrimary }}>
          {orgMap.get(orgId) || orgId || '—'}
        </span>
      ),
    },
    // 3. Thuộc cảng biển
    {
      key: 'portName',
      label: 'Thuộc cảng biển',
      dataIndex: 'portName',
      width: 180,
      ellipsis: true,
      render: (v: string) => (
        <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span>
      ),
    },
    // 4. Tuyến đường thủy
    {
      key: 'waterway',
      label: 'Tuyến đường thủy',
      dataIndex: 'waterway',
      width: 160,
      ellipsis: true,
      render: (v: string) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{v || '—'}</span>
      ),
    },
    // 5. Tên bến cảng
    {
      key: 'berthName',
      label: 'Tên bến cảng',
      dataIndex: 'berthName',
      ellipsis: true,
      render: (name: string) => (
        <span style={{ fontSize: fontSizeMd, fontWeight: fontWeightMedium, color: textPrimary }}>
          {name || '—'}
        </span>
      ),
    },
    // 6. Địa điểm
    {
      key: 'detailedLocation',
      label: 'Địa điểm',
      dataIndex: 'detailedLocation',
      ellipsis: true,
      render: (v: string) => (
        <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span>
      ),
    },
    // 7. Loại kết cấu
    {
      key: 'structureType',
      label: 'Loại kết cấu',
      dataIndex: 'structureType',
      width: 120,
      align: 'center' as const,
      render: (v: number | null | undefined) => {
        if (v == null) return <span style={{ color: textTertiary }}>—</span>;
        const label = STRUCTURE_TYPE_OPTIONS.find((o) => o.value === v)?.label || `Loại ${v}`;
        return <Tag color="blue">{label}</Tag>;
      },
    },
    // 8. Công năng khai thác
    {
      key: 'operationalFunction',
      label: 'Công năng khai thác',
      dataIndex: 'operationalFunction',
      width: 160,
      ellipsis: true,
      render: (v: string) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{v || '—'}</span>
      ),
    },
    // 9. Ngày cập nhật
    {
      key: 'updatedAt',
      label: 'Ngày cập nhật',
      dataIndex: 'updatedAt',
      align: 'center' as const,
      render: (v: string | null | undefined) => (
        <span style={{ ...metaStyle }}>
          {formatDate(v)}
        </span>
      ),
    },
    // 10. Cán bộ cập nhật
    {
      key: 'updatedBy',
      label: 'Cán bộ cập nhật',
      dataIndex: 'updatedBy',
      width: 140,
      ellipsis: true,
      render: (v: string | null | undefined) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary }}>
          {v || '—'}
        </span>
      ),
    },
    // 11. Tình trạng (operationalStatus badge)
    {
      key: 'operationalStatus',
      label: 'Tình trạng',
      dataIndex: 'operationalStatus',
      width: 160,
      align: 'center' as const,
      render: (status: string | null | undefined) => {
        const s = OPERATIONAL_STYLE_MAP[status || ''] || {
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
    // 12. Trạng thái (approvalStatus badge)
    {
      key: 'approvalStatus',
      label: 'Trạng thái',
      dataIndex: 'approvalStatus',
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

  const rowActions = useCallback((record: Berth) => {
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
      onClick: () => openDetailModal(record),
    });

    // Sửa — Admin / Cán bộ
    if (hasPerm('berth:update')) {
      actions.push({
        key: 'edit',
        label: 'Sửa',
        icon: <EditOutlined />,
        onClick: () => navigate(`/berth/${record.id}/edit`),
      });
    }

    // Xem vị trí
    if (record.latitude != null && record.longitude != null) {
      actions.push({
        key: 'location',
        label: 'Xem vị trí',
        icon: <EnvironmentOutlined />,
        onClick: () => {
          // Navigate to map with coordinates
          const lat = record.latitude;
          const lng = record.longitude;
          window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
        },
      });
    }

    // Lịch sử
    actions.push({
      key: 'history',
      label: 'Lịch sử',
      icon: <HistoryOutlined />,
      onClick: () => navigate(`/berth/${record.id}/history`),
    });

    // Phê duyệt / Từ chối — Lãnh đạo / Admin
    const canApprove = hasPerm('berth:approve');
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
    if (hasPerm('berth:delete') && deletableStatuses.includes(record.approvalStatus || '')) {
      actions.push({
        key: 'delete',
        label: 'Xóa',
        icon: <DeleteOutlined />,
        onClick: () => openDeleteModal(record),
        danger: true,
      });
    }

    return actions;
  }, [hasPerm, navigate, handleApprove, openDeleteModal, openRejectModal, openDetailModal]);

  // ── Render content ──────────────────────────────────────────────

  const renderContent = () => {
    if (isLoading) return <LoadingSkeleton rows={8} />;
    if (isError) {
      return (
        <ErrorState
          message={error?.message || 'Không thể tải danh sách bến cảng'}
          onRetry={fetchData}
        />
      );
    }

    if (dataSource.length === 0) {
      if (managingUnitId) {
        return <EmptyState description="Không tìm thấy bến cảng nào phù hợp" />;
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
          scroll={{ x: 1800 }}
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

  // ── Detail modal content ────────────────────────────────────────

  const renderDetailContent = () => {
    if (!detailRecord) return null;
    if (detailLoading) return <LoadingSkeleton rows={6} />;

    const r = detailRecord;
    const opStatusLabel = OPERATIONAL_STYLE_MAP[r.operationalStatus || '']?.label || r.operationalStatus || '—';
    const approvalLabel = APPROVAL_STYLE_MAP[r.approvalStatus || '']?.label || r.approvalStatus || '—';

    return (
      <div>
        {/* Group 1: Thông tin chung */}
        <Divider orientation="left" style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: colors.sidebarBg }}>
          Thông tin chung
        </Divider>
        <Descriptions column={2} size="small" bordered>
          <Descriptions.Item label="Đơn vị quản lý" span={2}>
            {orgMap.get(r.orgUnitId || '') || r.orgUnitId || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Thuộc cảng biển">{r.portName || '—'}</Descriptions.Item>
          <Descriptions.Item label="Tuyến đường thủy">{r.waterway || '—'}</Descriptions.Item>
          <Descriptions.Item label="Mã bến cảng">{r.berthCode}</Descriptions.Item>
          <Descriptions.Item label="Tên bến cảng">{r.berthName}</Descriptions.Item>
          <Descriptions.Item label="Địa điểm">{r.detailedLocation || '—'}</Descriptions.Item>
          <Descriptions.Item label="Tỉnh/TP">{r.provinceId || '—'}</Descriptions.Item>
          <Descriptions.Item label="Loại kết cấu">
            {r.structureType != null
              ? STRUCTURE_TYPE_OPTIONS.find((o) => o.value === r.structureType)?.label || `Loại ${r.structureType}`
              : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Công năng khai thác">{r.operationalFunction || '—'}</Descriptions.Item>
          <Descriptions.Item label="Tổng diện tích">{r.totalArea != null ? `${r.totalArea} m²` : '—'}</Descriptions.Item>
          <Descriptions.Item label="Năng lực thiết kế">{r.designThroughput != null ? r.designThroughput : '—'}</Descriptions.Item>
          <Descriptions.Item label="Năng lực hiện trạng">{r.currentThroughput != null ? r.currentThroughput : '—'}</Descriptions.Item>
          <Descriptions.Item label="Cỡ tàu tiếp nhận">{r.maxVesselSize != null ? r.maxVesselSize : '—'}</Descriptions.Item>
          <Descriptions.Item label="QH năng lực">{r.plannedThroughput != null ? r.plannedThroughput : '—'}</Descriptions.Item>
          <Descriptions.Item label="Sản lượng gần nhất">{r.latestCargoVolume != null ? r.latestCargoVolume : '—'}</Descriptions.Item>
          <Descriptions.Item label="Tình trạng" span={1}>
            <Tag color={OPERATIONAL_STYLE_MAP[r.operationalStatus || '']?.color || 'default'}>{opStatusLabel}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái" span={1}>
            <Tag color={APPROVAL_STYLE_MAP[r.approvalStatus || '']?.color || 'default'}>{approvalLabel}</Tag>
          </Descriptions.Item>
        </Descriptions>

        {/* Group 2: Thông tin công bố */}
        <Divider orientation="left" style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: colors.sidebarBg, marginTop: spaceMd }}>
          Thông tin công bố
        </Divider>
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="Thời điểm công bố">
            {r.openingAnnouncementDate ? formatDate(r.openingAnnouncementDate) : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Quyết định công bố">{r.openingDecision || '—'}</Descriptions.Item>
          <Descriptions.Item label="Văn bản thỏa thuận đầu tư">{r.investmentAgreement || '—'}</Descriptions.Item>
        </Descriptions>

        {/* Group 3: Thông tin vị trí */}
        <Divider orientation="left" style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: colors.sidebarBg, marginTop: spaceMd }}>
          Thông tin vị trí
        </Divider>
        <Descriptions column={2} size="small" bordered>
          <Descriptions.Item label="Loại đối tượng">{r.geometryType || '—'}</Descriptions.Item>
          <Descriptions.Item label="Hệ quy chiếu">{r.coordinateSystem || '—'}</Descriptions.Item>
          <Descriptions.Item label="Quy tắc hiển thị">{r.displayRule || '—'}</Descriptions.Item>
          <Descriptions.Item label="Kinh độ">{r.longitude != null ? r.longitude : '—'}</Descriptions.Item>
          <Descriptions.Item label="Vĩ độ" span={1}>{r.latitude != null ? r.latitude : '—'}</Descriptions.Item>
          <Descriptions.Item label="Tọa độ" span={1}>{r.coordinates || '—'}</Descriptions.Item>
        </Descriptions>

        {/* Group 4: File đính kèm */}
        <Divider orientation="left" style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: colors.sidebarBg, marginTop: spaceMd }}>
          File đính kèm
        </Divider>
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="Đơn vị khai thác">{r.operator || '—'}</Descriptions.Item>
        </Descriptions>
      </div>
    );
  };

  // ── JSX ─────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100%', marginTop: -8 }}>
      <ScreenHeader
        breadcrumb={[{ label: 'Quản lý bến cảng' }]}
        actions={headerActions}
      />

      <FilterBar
        fields={filterFields}
        onSearch={handleFilterSearch}
        onReset={handleFilterReset}
        centerActions={!showAdvancedFilters}
      />

      <div style={{ textAlign: 'right', marginBottom: 8, marginTop: -8 }}>
        <Button
          type="link"
          size="small"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          icon={<FilterOutlined />}
          style={{ color: colors.primaryActive, fontWeight: 500 }}
        >
          {showAdvancedFilters ? 'Thu gọn' : 'Bộ lọc nâng cao'}
        </Button>
      </div>

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

      {/* ── Detail Modal ──────────────────────────────────────────── */}
      <Modal
        title={
          <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>
            Chi tiết bến cảng
          </span>
        }
        open={detailModalOpen}
        onCancel={() => {
          setDetailModalOpen(false);
          setDetailRecord(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setDetailModalOpen(false);
              setDetailRecord(null);
            }}
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
          hasPerm('berth:update') && detailRecord ? (
            <Button
              key="edit"
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                setDetailModalOpen(false);
                navigate(`/berth/${detailRecord.id}/edit`);
              }}
              style={{
                background: actionPrimary,
                borderColor: actionPrimary,
                borderRadius: radiusPill,
                height: 40,
                fontSize: fontSizeMd,
              }}
            >
              Chỉnh sửa
            </Button>
          ) : null,
        ].filter(Boolean)}
        width={800}
        style={{ top: 20 }}
      >
        <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '8px 0' }}>
          {renderDetailContent()}
        </div>
      </Modal>

      {/* ── Delete Confirmation Modal ────────────────────────────── */}
      <Modal
        title={
          <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>
            Xác nhận xóa bến cảng
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
            Vui lòng nhập <strong>tên bến</strong> hoặc gõ <strong>"XÓA"</strong> để xác nhận xóa.
          </p>
          {deletingRecord && (
            <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>
              Bến: <strong style={{ color: textPrimary }}>{deletingRecord.berthName}</strong>
            </p>
          )}
          <Input
            placeholder="Nhập tên bến hoặc XÓA"
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
            Vui lòng nhập lý do từ chối cho bến:
          </p>
          {rejectingRecord && (
            <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>
              <strong style={{ color: textPrimary }}>{rejectingRecord.berthName}</strong>
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

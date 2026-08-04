import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Button, Tag, Modal, Input, Select, Alert, Descriptions, Divider, Collapse,
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
  FileOutlined,
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
import { symbolService } from '../../services/symbolService';
import api from '../../services/api';
import { userService } from '../../services/userService';
import type { Organization } from '../../services/organizationService';
import { trangThaiPheDuyetBadge } from '../../services/port/schema';
import { usePermissionStore } from '../../store/permissionStore';
import { useAuthStore } from '../../store/authStore';
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
  spaceSm,
  spaceFormField,
  metaStyle,
} from '../../tokens';
import { colors } from '../../theme';

// ── Constants ────────────────────────────────────────────────────────

const APPROVAL_STYLE_MAP: Record<string, { color: string; label: string }> = {
  NHAP: { color: statusDraft, label: 'Nháp' },
  DRAFT: { color: statusDraft, label: 'Nháp' },
  PENDING: { color: actionPrimary, label: 'Chờ Cảng vụ duyệt' },
  CHO_PHE_DUYET: { color: actionPrimary, label: 'Chờ Cảng vụ duyệt' },
  PENDING_APPROVAL: { color: actionPrimary, label: 'Chờ Cảng vụ duyệt' },
  PORT_AUTHORITY: { color: statusAttention, label: 'Chờ Cục duyệt' },
  CHO_PD_CAP_CUC: { color: statusAttention, label: 'Chờ Cục duyệt' },
  DA_PHE_DUYET: { color: statusOperational, label: 'Được phê duyệt' },
  DUOC_PHE_DUYET: { color: statusOperational, label: 'Được phê duyệt' },
  APPROVED: { color: statusOperational, label: 'Được phê duyệt' },
  TU_CHOI: { color: statusCritical, label: 'Từ chối' },
  REJECTED: { color: statusCritical, label: 'Từ chối' },
};

const OPERATIONAL_STYLE_MAP: Record<string, { color: string; label: string }> = {
  DANG_KHAI_THAC: { color: statusOperational, label: 'Đang khai thác/Vận hành' },
  OPERATIONAL: { color: statusOperational, label: 'Đang khai thác/Vận hành' },
  CHUA_KHAI_THAC: { color: statusAttention, label: 'Chưa khai thác/Vận hành' },
  DUNG_KHAI_THAC: { color: statusCritical, label: 'Dừng khai thác/Vận hành' },
  SUSPENDED: { color: statusCritical, label: 'Dừng khai thác/Vận hành' },
};

const STRUCTURE_TYPE_OPTIONS = [
  { value: 1, label: 'Bến nước' },
  { value: 2, label: 'Bến bờ' },
  { value: 3, label: 'Bến phao' },
  { value: 4, label: 'Khác' },
];

const TAB_STATUS_LIST = [
  { key: 'all', label: 'Tất cả', color: actionPrimary },
  { key: 'DRAFT', label: 'Nháp', color: statusDraft },
  { key: 'PENDING', label: 'Chờ Cảng vụ duyệt', color: actionPrimary },
  { key: 'PORT_AUTHORITY', label: 'Chờ Cục duyệt', color: statusAttention },
  { key: 'APPROVED', label: 'Được phê duyệt', color: statusOperational },
  { key: 'REJECTED', label: 'Từ chối', color: statusCritical },
];

const TAB_QUERY_MAP: Record<string, string | undefined> = {
  all: undefined,
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  PORT_AUTHORITY: 'PORT_AUTHORITY',
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
  const userPermissions = useAuthStore((s) => s.user?.permissions) || [];
  const isAuditViewer = userPermissions.includes('admin:manage') || userPermissions.includes('admin:operation');

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

  // ── Organizations + Users for lookup ────────────────────────────
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
  const [symbolMap, setSymbolMap] = useState<Map<string, string>>(new Map());
  const orgMap = useMemo(() => {
    const map = new Map<string, string>();
    organizations.forEach((o) => {
      map.set(o.id, o.name);
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
  const [detailFiles, setDetailFiles] = useState<any[]>([]);

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
    (async () => {
      try {
        const resp = await userService.list({ pageSize: 1000 });
        const users = resp.data || (resp as any).content || [];
        const map = new Map<string, string>();
        users.forEach((u: any) => map.set(u.id, u.fullName || u.username || u.id));
        setUserMap(map);
      } catch (err) {
        console.error('Failed to load users', err);
      }
    })();
    (async () => {
      try {
        const resp = await symbolService.list({ page: 1, pageSize: 1000, status: 'active' });
        const symbols = resp.data || (resp as any).content || [];
        const map = new Map<string, string>();
        symbols.forEach((s: any) => map.set(s.id, s.name));
        setSymbolMap(map);
      } catch (err) {
        console.error('Failed to load symbols', err);
      }
    })();
  }, []);

  // ── Load port options ──────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const params: any = { page: 1, pageSize: 1000 };
        if (managingUnitId) params.orgUnitId = managingUnitId;
        const res = await portCRUD.search(params);
        setPortOptions((res.data || []).map((p: any) => ({ value: p.id, label: p.portName })));
      } catch { /* ignore */ }
    })();
  }, [managingUnitId]);

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
    setIsLoading(true);
    setIsError(false);
    setError(null);
    try {
      const res = await berthCRUD.search({
        orgUnitId: managingUnitId || undefined,
        berthName: filterBerthName || undefined,
        berthCode: filterBerthCode || undefined,
        portId: filterPortId,
        waterway: filterWaterway || undefined,
        operationalFunction: filterOperationalFunction || undefined,
        structureType: filterStructureType,
        operationalStatus: filterOperationalStatus,
        approvalStatus: filterApprovalStatus || TAB_QUERY_MAP[activeTab],
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
    filterBerthCode, filterOperationalFunction, filterOperationalStatus, filterApprovalStatus,
    filterStructureType, filterProvince, filterUpdatedFrom, filterUpdatedTo,
    activeTab, page, pageSize,
  ]);

  // Fetch data when filters change
  useEffect(() => { void fetchData(); }, [fetchData]);

  // Fetch counts when managingUnit changes
  useEffect(() => { void fetchCounts(managingUnitId); }, [managingUnitId, fetchCounts]);

  // ── Handlers ────────────────────────────────────────────────────

  const handleFilterSearch = useCallback((values: Record<string, any>) => {
    setManagingUnitId(values.managingUnitId || undefined);
    setFilterBerthName(values.search || '');
    setFilterOperationalStatus(
      values.operationalStatus === 'DANG_KHAI_THAC' ? 'OPERATIONAL' : 'SUSPENDED'
    );
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
    if (values.approvalStatus) {
      setActiveTab('');
    } else {
      setActiveTab('all');
    }
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
    setDetailFiles([]);
    setDetailLoading(true);
    try {
      const res = await api.get(`/v1/documents/entity/berth/${record.id}`, { params: { page: 0, size: 50 } });
      setDetailFiles(res.data?.data?.content || res.data?.data || []);
    } catch { setDetailFiles([]); }
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
        const cap = record.approvalStatus === 'PORT_AUTHORITY' ? 'CUC' : 'CANG_VU';
        await berthApproval.approve(record.id, cap);
        toast.success('Đã phê duyệt bến cảng');
        void fetchData();
        void fetchCounts(managingUnitId);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
      }
    },
    [fetchData, fetchCounts, managingUnitId],
  );

  const handleSubmitApproval = useCallback(
    async (record: Berth) => {
      try {
        await berthCRUD.update({ id: record.id, saveAction: 'SUBMIT' });
        toast.success('Đã gửi phê duyệt bến cảng');
        void fetchData();
        void fetchCounts(managingUnitId);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Gửi phê duyệt thất bại');
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
    const reason = rejectReason.trim();
    if (!reason) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    if (reason.length < 10) {
      toast.error('Lý do từ chối tối thiểu 10 ký tự');
      return;
    }
    if (reason.length > 500) {
      toast.error('Lý do từ chối tối đa 500 ký tự');
      return;
    }
    try {
      await berthApproval.reject(rejectingRecord.id, 'CANG_VU', reason);
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
        label: 'Loại bến',
        placeholder: 'Chọn loại kết cấu',
        options: STRUCTURE_TYPE_OPTIONS.map((o) => ({ value: String(o.value), label: o.label })),
      },
      {
        key: 'operationalFunction',
        type: 'search' as const,
        label: 'Chức năng khai thác',
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
      width: 250,
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
    // 7. Loại kết cấu
    {
      key: 'structureType',
      label: 'Loại bến',
      dataIndex: 'structureType',
      width: 120,
      align: 'center' as const,
      render: (v: number | null | undefined) => {
        if (v == null) return <span style={{ color: textTertiary }}>—</span>;
        const label = STRUCTURE_TYPE_OPTIONS.find((o) => o.value === v)?.label || `Loại ${v}`;
        return <Tag color="blue">{label}</Tag>;
      },
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
    // 6. Địa điểm (Tỉnh/TP)
    {
      key: 'provinceId',
      label: 'Tỉnh/Thành phố',
      dataIndex: 'provinceId',
      width: 140,
      ellipsis: true,
      render: (v: number | null | undefined) => (
        <span style={{ fontSize: fontSizeMd, color: textPrimary }}>
          {v != null && v > 0 && v <= VIETNAM_PROVINCES.length ? VIETNAM_PROVINCES[v - 1] : '—'}
        </span>
      ),
    },
    // 7. Địa điểm chi tiết
    // 6. Địa điểm chi tiết
    {
      key: 'detailedLocation',
      label: 'Địa điểm',
      dataIndex: 'detailedLocation',
      ellipsis: true,
      render: (v: string) => (
        <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span>
      ),
    },
    // 8. Chức năng khai thác
    {
      key: 'operationalFunction',
      label: 'Chức năng khai thác',
      dataIndex: 'operationalFunction',
      width: 180,
      ellipsis: { showTitle: false },
      render: (v: string) => (
        <span title={v} style={{ fontSize: fontSizeMd, color: textSecondary }}>{v || '—'}</span>
      ),
    },
    // 9. Ngày cập nhật
    {
      key: 'updatedAt',
      label: 'Ngày cập nhật',
      dataIndex: 'updatedAt',
      width: 160,
      align: 'center' as const,
      render: (v: string | null | undefined) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary }}>
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
          {v ? (userMap.get(v) || v) : '—'}
        </span>
      ),
    },
    ...(isAuditViewer ? [{
      key: 'submittedForApprovalAt',
      label: 'Ngày gửi phê duyệt',
      width: 180,
      dataIndex: 'submittedForApprovalAt' as keyof Berth,
      align: 'center' as const,
      render: (v: string | null | undefined) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{formatDate(v)}</span>
      ),
    }] : []),
    ...(isAuditViewer ? [{
      key: 'submittedForApprovalBy',
      label: 'Cán bộ gửi phê duyệt',
      dataIndex: 'submittedForApprovalBy' as keyof Berth,
      width: 190,
      ellipsis: true,
      render: (v: string | null | undefined) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{v ? (userMap.get(v) || v) : '—'}</span>
      ),
    }] : []),
    // 13. Ngày PD cấp Cảng vụ/Chi cục (audit only)
    ...(isAuditViewer ? [{
      key: 'portAuthorityApprovedAt',
      label: 'Ngày PD cấp Cảng vụ/Chi cục',
      width: 230,
      dataIndex: 'portAuthorityApprovedAt' as keyof Berth,
      align: 'center' as const,
      render: (v: string | null | undefined) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{formatDate(v)}</span>
      ),
    }] : []),
    // 14. Cán bộ PD cấp Cảng vụ/Chi cục (audit only)
    ...(isAuditViewer ? [{
      key: 'portAuthorityApprovedBy',
      label: 'Cán bộ PD cấp Cảng vụ/Chi cục',
      dataIndex: 'portAuthorityApprovedBy' as keyof Berth,
      width: 250,
      ellipsis: true,
      render: (v: string | null | undefined) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{v ? (userMap.get(v) || v) : '—'}</span>
      ),
    }] : []),
    // 15. Ngày PD cấp Cục (audit only)
    ...(isAuditViewer ? [{
      key: 'departmentApprovedAt',
      label: 'Ngày PD cấp Cục',
      width: 160,
      dataIndex: 'departmentApprovedAt' as keyof Berth,
      align: 'center' as const,
      render: (v: string | null | undefined) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{formatDate(v)}</span>
      ),
    }] : []),
    // 16. Cán bộ PD cấp Cục (audit only)
    ...(isAuditViewer ? [{
      key: 'departmentApprovedBy',
      label: 'Cán bộ PD cấp Cục',
      dataIndex: 'departmentApprovedBy' as keyof Berth,
      width: 160,
      ellipsis: true,
      render: (v: string | null | undefined) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{v ? (userMap.get(v) || v) : '—'}</span>
      ),
    }] : []),
    // 17. Tình trạng (operationalStatus badge)
    {
      key: 'operationalStatus',
      label: 'Tình trạng',
      dataIndex: 'operationalStatus',
      width: 250,
      align: 'center' as const,
      render: (status: string | null | undefined) => {
        if (!status) return <span style={{ color: textTertiary }}>—</span>;
        const s = OPERATIONAL_STYLE_MAP[status] || { color: 'default', label: status };
        let color = textTertiary;
        if (s.color === statusOperational) color = statusOperational;
        else if (s.color === statusCritical) color = statusCritical;
        else if (s.color === statusAttention) color = statusAttention;
        return (
          <span style={{
            display: 'inline-flex',
            padding: '2px 10px',
            borderRadius: 999,
            fontSize: fontSizeMd,
            fontWeight: fontWeightMedium,
            background: `${color}15`,
            color,
          }}>
            {s.label}
          </span>
        );
      },
    },
    // 18. Trạng thái (approvalStatus badge)
    {
      key: 'approvalStatus',
      label: 'Trạng thái',
      dataIndex: 'approvalStatus',
      width: 180,
      align: 'center' as const,
      render: (status: string | null | undefined) => {
        if (!status) return <span style={{ color: textTertiary }}>—</span>;
        const s = APPROVAL_STYLE_MAP[status] || { color: 'default', label: status };
        let color = textTertiary;
        if (s.color === statusOperational) color = statusOperational;
        else if (s.color === statusCritical) color = statusCritical;
        else if (s.color === statusAttention) color = statusAttention;
        else if (s.color === actionPrimary) color = actionPrimary;
        return (
          <span style={{
            display: 'inline-flex',
            padding: '2px 10px',
            borderRadius: 999,
            fontSize: fontSizeMd,
            fontWeight: fontWeightMedium,
            background: `${color}15`,
            color,
          }}>
            {s.label}
          </span>
        );
      },
    },
  ], [page, pageSize, orgMap, isAuditViewer, userMap]);

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
      label: 'Chi tiết',
      icon: <EyeOutlined />,
      onClick: () => openDetailModal(record),
    });

    // Sửa — Admin / Cán bộ
    if (hasPerm('berth:update')) {
      actions.push({
        key: 'edit',
        label: 'Chỉnh sửa',
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

    // Gửi phê duyệt — khi ở trạng thái Nháp
    const draftStatuses = ['DRAFT', 'NHAP'];
    if (hasPerm('berth:update') && draftStatuses.includes(record.approvalStatus || '')) {
      actions.push({
        key: 'submit',
        label: 'Gửi phê duyệt',
        icon: <CheckCircleOutlined />,
        onClick: () => handleSubmitApproval(record),
      });
    }

    // Phê duyệt / Từ chối — Lãnh đạo / Admin
    const canApprove = hasPerm('berth:approve');
    const pendingStatuses = ['PENDING', 'PORT_AUTHORITY', 'PENDING_APPROVAL', 'CHO_PHE_DUYET', 'CHO_PD_CAP_CUC'];
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
      return <EmptyState description="Không tìm thấy bến cảng nào phù hợp" />;
    }

    return (
      <div style={{ overflowX: 'auto' }}>
        <DataTable
          columns={columns}
          dataSource={dataSource}
          rowKey="id"
          rowActions={rowActions}
          scroll={{ x: 2500, y: 'calc(100vh - 450px)' }}
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

  // ── Detail collapsed sections state ────────────────────────────
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const renderDetailContent = () => {
    if (!detailRecord) return null;
    if (detailLoading) return <LoadingSkeleton rows={6} />;

    const r = detailRecord;
    const opStatusLabel = OPERATIONAL_STYLE_MAP[r.operationalStatus || '']?.label || r.operationalStatus || '—';
    const approvalLabel = APPROVAL_STYLE_MAP[r.approvalStatus || '']?.label || r.approvalStatus || '—';

    const toggleSection = (key: string) => {
      setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    return (
      <div>
        {/* Group 1: Thông tin chung */}
        <Divider orientation="left" style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: colors.sidebarBg, cursor: 'pointer' }}
          onClick={() => toggleSection('general')}>
          {collapsedSections['general'] ? '▶' : '▼'} Thông tin chung
        </Divider>
        {!collapsedSections['general'] && (
        <Descriptions column={2} size="small" bordered style={{ tableLayout: 'fixed' }}
          labelStyle={{ width: 180, whiteSpace: 'nowrap' }}>
                <Descriptions.Item label="Đơn vị quản lý" span={2}>
                  {orgMap.get(r.orgUnitId || '') || r.orgUnitId || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Thuộc cảng biển">{r.portName || '—'}</Descriptions.Item>
                <Descriptions.Item label="Tuyến đường thủy">{r.waterway || '—'}</Descriptions.Item>
                <Descriptions.Item label="Mã bến cảng">{r.berthCode}</Descriptions.Item>
                <Descriptions.Item label="Tên bến cảng">{r.berthName}</Descriptions.Item>
                <Descriptions.Item label="Địa điểm">{r.detailedLocation || '—'}</Descriptions.Item>
                <Descriptions.Item label="Tỉnh/TP">{r.provinceId != null && r.provinceId > 0 && r.provinceId <= VIETNAM_PROVINCES.length ? VIETNAM_PROVINCES[r.provinceId - 1] : '—'}</Descriptions.Item>
                <Descriptions.Item label="Loại kết cấu">
                  {r.structureType != null
                    ? STRUCTURE_TYPE_OPTIONS.find((o) => o.value === r.structureType)?.label || `Loại ${r.structureType}`
                    : '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Đơn vị khai thác">{r.operator || '—'}</Descriptions.Item>
                </Descriptions>
        )}

        {/* Group 2: Năng lực */}
        <Divider orientation="left" style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: colors.sidebarBg, cursor: 'pointer', marginTop: spaceMd }}
          onClick={() => toggleSection('capacity')}>
          {collapsedSections['capacity'] ? '▶' : '▼'} Năng lực
        </Divider>
        {!collapsedSections['capacity'] && (
        <Descriptions column={2} size="small" bordered style={{ tableLayout: 'fixed' }}
          labelStyle={{ width: 180, whiteSpace: 'nowrap' }}>
          <Descriptions.Item label="Chức năng khai thác">{r.operationalFunction || '—'}</Descriptions.Item>
          <Descriptions.Item label="Tổng diện tích">{r.totalArea != null ? `${r.totalArea} km²` : '—'}</Descriptions.Item>
          <Descriptions.Item label="Năng lực thiết kế">{r.designThroughput != null ? `${r.designThroughput} tấn/năm` : '—'}</Descriptions.Item>
          <Descriptions.Item label="Năng lực hiện trạng">{r.currentThroughput != null ? `${r.currentThroughput} tấn/năm` : '—'}</Descriptions.Item>
          <Descriptions.Item label="Cỡ tàu tiếp nhận">{r.maxVesselSize != null ? `${r.maxVesselSize} DWT` : '—'}</Descriptions.Item>
          <Descriptions.Item label="QH năng lực">{r.plannedThroughput != null ? `${r.plannedThroughput} tấn/năm` : '—'}</Descriptions.Item>
          <Descriptions.Item label="Sản lượng gần nhất" span={2}>{r.latestCargoVolume != null ? `${r.latestCargoVolume} tấn/năm` : '—'}</Descriptions.Item>
          <Descriptions.Item label="Tình trạng" span={1}>
            <Tag color={OPERATIONAL_STYLE_MAP[r.operationalStatus || '']?.color || 'default'}>{opStatusLabel}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái" span={1}>
            <Tag color={APPROVAL_STYLE_MAP[r.approvalStatus || '']?.color || 'default'}>{approvalLabel}</Tag>
          </Descriptions.Item>
        </Descriptions>
        )}

        {/* Group 3: Thông tin công bố */}
        <Divider orientation="left" style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: colors.sidebarBg, cursor: 'pointer', marginTop: spaceMd }}
          onClick={() => toggleSection('announcement')}>
          {collapsedSections['announcement'] ? '▶' : '▼'} Thông tin công bố
        </Divider>
        {!collapsedSections['announcement'] && (
        <Descriptions column={2} size="small" bordered style={{ tableLayout: 'fixed' }}
          labelStyle={{ width: 180, whiteSpace: 'nowrap' }}>
          <Descriptions.Item label="Thời điểm công bố" span={2}>
            {r.openingAnnouncementDate ? formatDate(r.openingAnnouncementDate) : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Quyết định công bố" span={2}>{r.openingDecision || '—'}</Descriptions.Item>
          <Descriptions.Item label="Văn bản thỏa thuận đầu tư" span={2}>{r.investmentAgreement || '—'}</Descriptions.Item>
        </Descriptions>
        )}

        {/* Group 3: Thông tin vị trí */}
        <Divider orientation="left" style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: colors.sidebarBg, cursor: 'pointer', marginTop: spaceMd }}
          onClick={() => toggleSection('location')}>
          {collapsedSections['location'] ? '▶' : '▼'} Thông tin vị trí
        </Divider>
        {!collapsedSections['location'] && (
        <Descriptions column={2} size="small" bordered style={{ tableLayout: 'fixed' }}
          labelStyle={{ width: 180, whiteSpace: 'nowrap' }}>
          <Descriptions.Item label="Loại đối tượng">
            {{ POINT: 'Đối tượng điểm', LINE: 'Đối tượng đường', POLYGON: 'Đối tượng vùng' }[r.geometryType || ''] || r.geometryType || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Biểu tượng bản đồ">{symbolMap.get(r.mapSymbolId || '') || r.mapSymbolId || '—'}</Descriptions.Item>
          <Descriptions.Item label="Hệ quy chiếu">{r.coordinateSystem === 1 ? 'WGS-84' : r.coordinateSystem === 2 ? 'VN-2000' : r.coordinateSystem || '—'}</Descriptions.Item>
          <Descriptions.Item label="Quy tắc hiển thị">{r.displayRule || '—'}</Descriptions.Item>
          <Descriptions.Item label="Kinh độ">{r.longitude != null ? r.longitude : '—'}</Descriptions.Item>
          <Descriptions.Item label="Vĩ độ">{r.latitude != null ? r.latitude : '—'}</Descriptions.Item>
          <Descriptions.Item label="Tọa độ" span={2}>{r.coordinates || '—'}</Descriptions.Item>
        </Descriptions>
        )}

        {/* Group 4: File đính kèm */}
        <Divider orientation="left" style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: colors.sidebarBg, cursor: 'pointer', marginTop: spaceMd }}
          onClick={() => toggleSection('files')}>
          {collapsedSections['files'] ? '▶' : '▼'} File đính kèm
        </Divider>
        {!collapsedSections['files'] && (
          detailFiles.length === 0
            ? <EmptyState description="Chưa có file đính kèm" />
            : detailFiles.map((f: any) => (
                <div key={f.id} style={{ marginBottom: spaceSm }}>
                  <a href={`/api/v1/documents/${f.id}/file`} target="_blank" rel="noopener noreferrer"
                    style={{ color: actionPrimary, fontSize: fontSizeMd }}>
                    <FileOutlined style={{ marginRight: 8 }} />
                    {f.fileName || f.name} ({(f.fileSize / 1024).toFixed(1)} KB)
                  </a>
                </div>
              ))
        )}
      </div>
    );
  };

  // ── JSX ─────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100%', marginTop: -8 }}>
      <ScreenHeader
        breadcrumb={[{ label: 'Tài sản KCHTGT' }, { label: 'Bến cảng' }]}
        actions={headerActions}
      />

      <FilterBar
        fields={filterFields}
        onSearch={handleFilterSearch}
        onReset={handleFilterReset}
        onFieldChange={(key, value) => {
          if (key === 'managingUnitId') setManagingUnitId(value || undefined);
        }}
        centerActions={!showAdvancedFilters}
      />

      {/* StatusTabs + Filter toggle */}
      <div
        style={{
          ...cardStyle,
          marginBottom: 4,
          display: 'flex',
          alignItems: 'center',
          padding: '4px 16px',
        }}
      >
        <div style={{ flex: 1 }} />
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
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="link"
          size="small"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          icon={<FilterOutlined />}
          style={{ color: colors.primaryActive, fontWeight: 500, flexShrink: 0 }}
        >
          {showAdvancedFilters ? 'Thu gọn' : 'Bộ lọc nâng cao'}
        </Button>
        </div>
      </div>

      {/* Table */}
      <div style={{ ...cardStyle, padding: '8px 16px' }}>
        {renderContent()}
      </div>

      {/* ── Detail Modal ──────────────────────────────────────────── */}
      <Modal
        title={
          <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>
            Chi tiết bến cảng{detailRecord ? `: ${detailRecord.berthName}` : ''}
          </span>
        }
        open={detailModalOpen}
        onCancel={() => {
          setDetailModalOpen(false);
          setDetailRecord(null);
        }}
        styles={{ body: { paddingTop: 0 } }}
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
            placeholder="Nhập lý do từ chối (tối thiểu 10, tối đa 500 ký tự)..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            maxLength={500}
            showCount
            style={{ borderRadius: 8, fontSize: fontSizeMd }}
          />
        </div>
      </Modal>
    </div>
  );
}

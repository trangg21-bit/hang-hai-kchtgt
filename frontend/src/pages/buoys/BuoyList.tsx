import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Button, Tag, Modal, Input, Alert, Descriptions, Divider,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  HistoryOutlined,
  ExclamationCircleOutlined,
  EnvironmentOutlined,
  FileOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { buoyCRUD, approval } from '../../services/beaconService';
import type { Buoy } from '../../types/beacon';
import {
  BEACON_STATUS_MAP,
  BUOY_TYPE_OPTIONS,
  BUOY_TYPE_MAP,
} from '../../types/beacon';
import type { BeaconStatus } from '../../types/beacon';
import { organizationService } from '../../services/organizationService';
import { userService } from '../../services/userService';
import type { Organization } from '../../services/organizationService';
import { usePermissionStore } from '../../store/permissionStore';
import { useAuthStore } from '../../store/authStore';
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
  DRAFT: { color: statusDraft, label: 'Nháp' },
  PENDING_APPROVAL: { color: actionPrimary, label: 'Chờ phê duyệt' },
  APPROVED_L1: { color: statusAttention, label: 'Đã phê duyệt L1' },
  PUBLISHED: { color: statusOperational, label: 'Đã công bố' },
  REJECTED: { color: statusCritical, label: 'Từ chối' },
};

const TAB_STATUS_LIST = [
  { key: 'all', label: 'Tất cả', color: actionPrimary },
  { key: 'DRAFT', label: 'Nháp', color: statusDraft },
  { key: 'PENDING_APPROVAL', label: 'Chờ phê duyệt', color: actionPrimary },
  { key: 'APPROVED_L1', label: 'Đã phê duyệt L1', color: statusAttention },
  { key: 'PUBLISHED', label: 'Đã công bố', color: statusOperational },
  { key: 'REJECTED', label: 'Từ chối', color: statusCritical },
];

const COLOR_LABEL_MAP: Record<string, string> = {
  RED: 'Đỏ',
  GREEN: 'Xanh lá',
  BLACK_RED: 'Đen + Đỏ',
  BLACK_YELLOW: 'Đen + Vàng',
  WHITE: 'Trắng',
  YELLOW: 'Vàng',
  ORANGE: 'Cam',
};

const SHAPE_LABEL_MAP: Record<string, string> = {
  CAN: 'Hình trụ',
  CONE: 'Hình nón',
  SPAR: 'Trụ',
  BELL: 'Chuông',
  BUCKET: 'Gáo',
  TUBULAR: 'Ống',
};

const LIGHT_CHAR_LABEL_MAP: Record<string, string> = {
  FL: 'FL - Chớp đơn',
  'FL(2)': 'FL(2) - Chớp nhóm 2',
  'FL(3)': 'FL(3) - Chớp nhóm 3',
  Iso: 'Iso - Đồng pha',
  Q: 'Q - Chớp nhanh',
  VQ: 'VQ - Chớp rất nhanh',
  Oc: 'Oc - Huyền phù',
  F: 'F - Cố định',
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

function formatDateOnly(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return dayjs(dateStr).format('DD/MM/YYYY');
  } catch {
    return dateStr;
  }
}

// ── Component ────────────────────────────────────────────────────────

export default function BuoyList() {
  const navigate = useNavigate();
  const hasPerm = usePermissionStore((s) => s.hasPermission);
  const currentUser = useAuthStore((s) => s.user);
  const userPermissions = currentUser?.permissions || [];
  const isAuditViewer = userPermissions.includes('admin:manage') || userPermissions.includes('admin:operation');

  // ── Filter state ─────────────────────────────────────────────────
  const [managingUnitId, setManagingUnitId] = useState<string | undefined>();
  const [filterName, setFilterName] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState('all');

  // ── Pagination ──────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // ── Data ─────────────────────────────────────────────────────────
  const [allData, setAllData] = useState<Buoy[]>([]);
  const [dataSource, setDataSource] = useState<Buoy[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // ── Organizations + Users for lookup ────────────────────────────
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
  const orgMap = useMemo(() => {
    const map = new Map<string, string>();
    organizations.forEach((o) => {
      map.set(o.id, o.name);
    });
    return map;
  }, [organizations]);

  // ── Tab counts ──────────────────────────────────────────────────
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  // ── Detail modal ────────────────────────────────────────────────
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<Buoy | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ── Delete confirmation modal ───────────────────────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<Buoy | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // ── Reject modal ────────────────────────────────────────────────
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRecord, setRejectingRecord] = useState<Buoy | null>(null);
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
  }, []);

  // ── Fetch main data ─────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setError(null);
    try {
      // Fetch ALL data (no status filter) so tab counts are accurate
      const res = await buoyCRUD.search({
        name: filterName || undefined,
        code: filterCode || undefined,
        type: filterType,
      });
      const all = res.data || [];

      // Compute tab counts from FULL dataset
      const counts: Record<string, number> = { all: all.length };
      TAB_STATUS_LIST.slice(1).forEach((tab) => {
        counts[tab.key] = all.filter((d) => d.status === tab.key).length;
      });
      setTabCounts(counts);

      // Apply status filter for display
      const statusFilter = filterStatus || (activeTab !== 'all' ? activeTab : undefined);
      const filtered = statusFilter
        ? all.filter((d) => d.status === statusFilter)
        : all;

      setAllData(filtered);
      setTotal(filtered.length);

      // Client-side paginate
      const start = (page - 1) * pageSize;
      setDataSource(filtered.slice(start, start + pageSize));
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách phao tiêu'));
    } finally {
      setIsLoading(false);
    }
  }, [filterName, filterCode, filterType, filterStatus, activeTab, page, pageSize]);

  // Repaginate when allData or page/pageSize changes
  useEffect(() => {
    const start = (page - 1) * pageSize;
    setDataSource(allData.slice(start, start + pageSize));
  }, [allData, page, pageSize]);

  // Fetch data when filters change
  useEffect(() => { void fetchData(); }, [fetchData]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [filterName, filterCode, filterType, filterStatus, activeTab]);

  // ── Handlers ────────────────────────────────────────────────────

  const handleFilterSearch = useCallback((values: Record<string, any>) => {
    setManagingUnitId(values.managingUnitId || undefined);
    setFilterName(values.name || '');
    setFilterCode(values.code || '');
    setFilterType(values.type || undefined);
    if (values.status) {
      setFilterStatus(values.status);
      setActiveTab('');
    } else {
      setFilterStatus(undefined);
    }
    setPage(1);
  }, []);

  const handleFilterReset = useCallback(() => {
    setManagingUnitId(undefined);
    setFilterName('');
    setFilterCode('');
    setFilterType(undefined);
    setFilterStatus(undefined);
    setActiveTab('all');
    setPage(1);
  }, []);

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key);
    setFilterStatus(undefined);
    setPage(1);
  }, []);

  // ── Detail modal ────────────────────────────────────────────────

  const openDetailModal = useCallback(async (record: Buoy) => {
    setDetailModalOpen(true);
    setDetailRecord(record);
    setDetailLoading(true);
    try {
      const fresh = await buoyCRUD.findById(record.id);
      setDetailRecord(fresh);
    } catch {
      // keep initial data
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // ── Delete confirmation ─────────────────────────────────────────

  const openDeleteModal = useCallback((record: Buoy) => {
    setDeletingRecord(record);
    setDeleteConfirmText('');
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingRecord) return;
    const expectedText = deletingRecord.name || 'XÓA';
    if (deleteConfirmText.trim() !== expectedText && deleteConfirmText.trim() !== 'XÓA') {
      toast.error('Vui lòng nhập đúng tên phao tiêu hoặc gõ "XÓA" để xác nhận');
      return;
    }
    try {
      await buoyCRUD.delete(deletingRecord.id);
      toast.success('Đã xóa phao tiêu');
      setDeleteModalOpen(false);
      setDeletingRecord(null);
      setDeleteConfirmText('');
      void fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  }, [deletingRecord, deleteConfirmText, fetchData]);

  // ── Approval handlers ───────────────────────────────────────────

  const handleApproveL1 = useCallback(
    async (record: Buoy) => {
      const approverId = currentUser?.userId;
      if (!approverId) { toast.error('Không xác định được người dùng'); return; }
      try {
        await approval.approveBuoyL1(record.id, approverId);
        toast.success('Đã phê duyệt cấp 1');
        void fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
      }
    },
    [fetchData, currentUser],
  );

  const handleApproveL2 = useCallback(
    async (record: Buoy) => {
      const approverId = currentUser?.userId;
      if (!approverId) { toast.error('Không xác định được người dùng'); return; }
      try {
        await approval.approveBuoyL2(record.id, approverId);
        toast.success('Đã phê duyệt cấp 2 - Phao tiêu được công bố');
        void fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
      }
    },
    [fetchData, currentUser],
  );

  const handleSubmitApproval = useCallback(
    async (record: Buoy) => {
      try {
        await approval.submitBuoyForApproval(record.id);
        toast.success('Đã gửi phê duyệt phao tiêu');
        void fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Gửi phê duyệt thất bại');
      }
    },
    [fetchData],
  );

  const openRejectModal = useCallback((record: Buoy) => {
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
    const approverId = currentUser?.userId;
    if (!approverId) { toast.error('Không xác định được người dùng'); return; }
    try {
      await approval.rejectBuoy(rejectingRecord.id, reason, approverId);
      toast.success('Đã từ chối phê duyệt');
      setRejectModalOpen(false);
      setRejectingRecord(null);
      setRejectReason('');
      setActiveTab('REJECTED');
      setPage(1);
      void fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
    }
  }, [rejectingRecord, rejectReason, fetchData]);

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
      key: 'name',
      type: 'search' as const,
      label: 'Tên phao tiêu',
      placeholder: 'Tìm theo tên phao...',
      width: 280,
    },
    {
      key: 'code',
      type: 'search' as const,
      label: 'Mã phao tiêu',
      placeholder: 'Tìm theo mã phao...',
      width: 240,
    },
    {
      key: 'type',
      type: 'select' as const,
      label: 'Loại phao tiêu',
      placeholder: 'Chọn loại phao',
      options: BUOY_TYPE_OPTIONS,
    },
    {
      key: 'status',
      type: 'select' as const,
      label: 'Trạng thái',
      placeholder: 'Chọn trạng thái',
      options: Object.entries(BEACON_STATUS_MAP).map(([value, { label }]) => ({ value, label })),
    },
  ], [organizations]);

  // ── Header actions ──────────────────────────────────────────────

  const headerActions = useMemo(() => {
    const actions: any[] = [];
    if (hasPerm('data:read') || hasPerm('admin:manage')) {
      actions.push({
        key: 'create',
        label: 'Thêm mới',
        variant: 'primary' as const,
        icon: <PlusOutlined />,
        onClick: () => navigate('/buoys/create'),
      });
    }
    return actions;
  }, [hasPerm, navigate]);

  // ── Table columns ───────────────────────────────────────────────
  // Thứ tự theo BA F-078 Display Fields

  const columns = useMemo(() => [
    // 1. STT
    {
      key: 'sequenceNo',
      label: 'STT',
      width: 55,
      type: 'mono' as const,
      align: 'center' as const,
      render: (_: unknown, __: Buoy, idx: number) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary }}>
          {(page - 1) * pageSize + idx + 1}
        </span>
      ),
    },
    // 2. Mã phao tiêu
    {
      key: 'code',
      label: 'Mã phao tiêu',
      dataIndex: 'code' as keyof Buoy,
      width: 150,
      render: (code: string) => (
        <Tag color="cyan" style={{ fontSize: fontSizeMd }}>{code}</Tag>
      ),
    },
    // 3. Tên phao tiêu
    {
      key: 'name',
      label: 'Tên phao tiêu',
      dataIndex: 'name' as keyof Buoy,
      width: 200,
      ellipsis: true,
      render: (name: string) => (
        <span style={{ fontSize: fontSizeMd, fontWeight: fontWeightMedium, color: textPrimary }}>{name}</span>
      ),
    },
    // 4. Loại phao
    {
      key: 'type',
      label: 'Loại phao',
      dataIndex: 'type' as keyof Buoy,
      width: 200,
      render: (type: string) => {
        const m = BUOY_TYPE_MAP[type as keyof typeof BUOY_TYPE_MAP];
        const label = BUOY_TYPE_OPTIONS.find((o) => o.value === type)?.label || type;
        return m ? <Tag color={m.color}>{label}</Tag> : <span>{type || '—'}</span>;
      },
    },
    // 5. Trạng thái (theo BA: ngay sau Loại)
    {
      key: 'status',
      label: 'Trạng thái',
      dataIndex: 'status' as keyof Buoy,
      width: 150,
      align: 'center' as const,
      render: (status: string | null | undefined) => {
        if (!status) return <span style={{ color: textTertiary }}>—</span>;
        const s = APPROVAL_STYLE_MAP[status] || { color: 'default', label: BEACON_STATUS_MAP[status as BeaconStatus]?.label || status };
        let color = textTertiary;
        if (s.color === statusOperational) color = statusOperational;
        else if (s.color === statusCritical) color = statusCritical;
        else if (s.color === statusAttention) color = statusAttention;
        else if (s.color === actionPrimary) color = actionPrimary;
        else if (s.color === statusDraft) color = statusDraft;
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
    // 6. Vĩ độ
    {
      key: 'latitude',
      label: 'Vĩ độ',
      dataIndex: 'latitude' as keyof Buoy,
      width: 100,
      align: 'right' as const,
      render: (v: number) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{v != null ? v.toFixed(4) : '—'}</span>
      ),
    },
    // 7. Kinh độ
    {
      key: 'longitude',
      label: 'Kinh độ',
      dataIndex: 'longitude' as keyof Buoy,
      width: 100,
      align: 'right' as const,
      render: (v: number) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{v != null ? v.toFixed(4) : '—'}</span>
      ),
    },
    // 8. Màu sắc
    {
      key: 'color',
      label: 'Màu sắc',
      dataIndex: 'color' as keyof Buoy,
      width: 100,
      render: (v: string) => {
        if (!v) return <span style={{ color: textTertiary }}>—</span>;
        return (
          <span style={{ fontSize: fontSizeMd, color: textSecondary }}>
            {COLOR_LABEL_MAP[v] || v}
          </span>
        );
      },
    },
    // 9. Hình dạng
    {
      key: 'shape',
      label: 'Hình dạng',
      dataIndex: 'shape' as keyof Buoy,
      width: 110,
      render: (v: string) => {
        if (!v) return <span style={{ color: textTertiary }}>—</span>;
        return (
          <span style={{ fontSize: fontSizeMd, color: textSecondary }}>
            {SHAPE_LABEL_MAP[v] || v}
          </span>
        );
      },
    },
    // 10. Đặc tính ánh sáng
    {
      key: 'lightCharacteristic',
      label: 'Đặc tính ánh sáng',
      dataIndex: 'lightCharacteristic' as keyof Buoy,
      width: 180,
      ellipsis: true,
      render: (v: string) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary }}>
          {v ? (LIGHT_CHAR_LABEL_MAP[v] || v) : '—'}
        </span>
      ),
    },
    // 11. Phạm vi quan sát
    {
      key: 'range',
      label: 'Phạm vi (HL)',
      dataIndex: 'range' as keyof Buoy,
      width: 120,
      align: 'right' as const,
      render: (v: number) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{v != null ? v.toFixed(1) : '—'}</span>
      ),
    },
    // 12. Mô tả
    {
      key: 'description',
      label: 'Mô tả',
      dataIndex: 'description' as keyof Buoy,
      width: 200,
      ellipsis: true,
      render: (v: string) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{v || '—'}</span>
      ),
    },
    // 13. Đơn vị quản lý
    {
      key: 'unitId',
      label: 'Đơn vị quản lý',
      dataIndex: 'unitId' as keyof Buoy,
      width: 180,
      ellipsis: true,
      render: (v: string) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary }}>
          {v ? (orgMap.get(v) || v) : '—'}
        </span>
      ),
    },
    // 14. Ngày kiểm tra gần nhất
    {
      key: 'lastInspectionDate',
      label: 'KT gần nhất',
      dataIndex: 'lastInspectionDate' as keyof Buoy,
      width: 120,
      render: (v: string) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{formatDateOnly(v)}</span>
      ),
    },
    // 15. Ngày kiểm tra kế tiếp
    {
      key: 'nextInspectionDate',
      label: 'KT kế tiếp',
      dataIndex: 'nextInspectionDate' as keyof Buoy,
      width: 120,
      render: (v: string) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{formatDateOnly(v)}</span>
      ),
    },
    // 16. Trạng thái hoạt động
    {
      key: 'isActive',
      label: 'Hoạt động',
      dataIndex: 'isActive' as keyof Buoy,
      width: 100,
      align: 'center' as const,
      render: (v: boolean) => (
        <Tag color={v ? 'green' : 'default'}>{v ? 'Có' : 'Ngừng'}</Tag>
      ),
    },
  ], [page, pageSize, orgMap]);

  // ── Row actions with RBAC ───────────────────────────────────────

  const rowActions = useCallback((record: Buoy) => {
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

    // Sửa — Admin / Chuyên viên
    if (hasPerm('data:read') || hasPerm('admin:manage')) {
      actions.push({
        key: 'edit',
        label: 'Chỉnh sửa',
        icon: <EditOutlined />,
        onClick: () => navigate(`/buoys/${record.id}?mode=edit`),
      });
    }

    // Xem vị trí
    if (record.latitude != null && record.longitude != null) {
      actions.push({
        key: 'location',
        label: 'Xem vị trí',
        icon: <EnvironmentOutlined />,
        onClick: () => {
          window.open(`https://www.google.com/maps?q=${record.latitude},${record.longitude}`, '_blank');
        },
      });
    }

    // Lịch sử
    actions.push({
      key: 'history',
      label: 'Lịch sử',
      icon: <HistoryOutlined />,
      onClick: () => navigate(`/history?type=BUOY&entityId=${record.id}`),
    });

    // Gửi phê duyệt — khi ở trạng thái Nháp hoặc Từ chối
    if ((hasPerm('data:read') || hasPerm('admin:manage')) && (record.status === 'DRAFT' || record.status === 'REJECTED')) {
      actions.push({
        key: 'submit',
        label: 'Gửi phê duyệt',
        icon: <CheckCircleOutlined />,
        onClick: () => handleSubmitApproval(record),
      });
    }

    // Phê duyệt L1 — Lãnh đạo phòng
    const canApprove = hasPerm('admin:manage') || hasPerm('data:read');
    if (canApprove && record.status === 'PENDING_APPROVAL') {
      actions.push({
        key: 'approveL1',
        label: 'Phê duyệt L1',
        icon: <CheckCircleOutlined />,
        onClick: () => handleApproveL1(record),
      });
      actions.push({
        key: 'reject',
        label: 'Từ chối',
        icon: <CloseCircleOutlined />,
        onClick: () => openRejectModal(record),
        danger: true,
      });
    }

    // Phê duyệt L2 — Lãnh đạo cục
    if (canApprove && record.status === 'APPROVED_L1') {
      actions.push({
        key: 'approveL2',
        label: 'Phê duyệt L2',
        icon: <CheckCircleOutlined />,
        onClick: () => handleApproveL2(record),
      });
      actions.push({
        key: 'reject',
        label: 'Từ chối',
        icon: <CloseCircleOutlined />,
        onClick: () => openRejectModal(record),
        danger: true,
      });
    }

    // Xóa — chỉ khi ở trạng thái DRAFT hoặc REJECTED
    const deletableStatuses = ['DRAFT', 'REJECTED'];
    if ((hasPerm('admin:manage') || hasPerm('data:read')) && deletableStatuses.includes(record.status || '')) {
      actions.push({
        key: 'delete',
        label: 'Xóa',
        icon: <DeleteOutlined />,
        onClick: () => openDeleteModal(record),
        danger: true,
      });
    }

    return actions;
  }, [hasPerm, navigate, handleSubmitApproval, handleApproveL1, handleApproveL2, openDeleteModal, openRejectModal, openDetailModal]);

  // ── Render content ──────────────────────────────────────────────

  const renderContent = () => {
    if (isLoading) return <LoadingSkeleton rows={8} />;
    if (isError) {
      return (
        <ErrorState
          message={error?.message || 'Không thể tải danh sách phao tiêu'}
          onRetry={fetchData}
        />
      );
    }

    if (dataSource.length === 0) {
      return <EmptyState description="Không tìm thấy phao tiêu nào phù hợp" />;
    }

    return (
      <div style={{ overflowX: 'auto' }}>
        <DataTable
          columns={columns}
          dataSource={dataSource}
          rowKey="id"
          rowActions={rowActions}
          scroll={{ x: 2200, y: 'calc(100vh - 450px)' }}
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
    const approvalLabel = APPROVAL_STYLE_MAP[r.status || '']?.label || r.status || '—';

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
          <Descriptions.Item label="Mã phao tiêu">{r.code}</Descriptions.Item>
          <Descriptions.Item label="Tên phao tiêu">{r.name}</Descriptions.Item>
          <Descriptions.Item label="Loại phao">
            {BUOY_TYPE_OPTIONS.find((o) => o.value === r.type)?.label || r.type || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Đơn vị quản lý">
            {r.unitId ? (orgMap.get(r.unitId) || r.unitId) : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Mô tả" span={2}>{r.description || '—'}</Descriptions.Item>
        </Descriptions>
        )}

        {/* Group 2: Thông tin kỹ thuật */}
        <Divider orientation="left" style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: colors.sidebarBg, cursor: 'pointer', marginTop: spaceMd }}
          onClick={() => toggleSection('technical')}>
          {collapsedSections['technical'] ? '▶' : '▼'} Thông tin kỹ thuật
        </Divider>
        {!collapsedSections['technical'] && (
        <Descriptions column={2} size="small" bordered style={{ tableLayout: 'fixed' }}
          labelStyle={{ width: 180, whiteSpace: 'nowrap' }}>
          <Descriptions.Item label="Kinh độ">{r.longitude != null ? r.longitude.toFixed(6) : '—'}</Descriptions.Item>
          <Descriptions.Item label="Vĩ độ">{r.latitude != null ? r.latitude.toFixed(6) : '—'}</Descriptions.Item>
          <Descriptions.Item label="Phạm vi quan sát">{r.range != null ? `${r.range} hải lý` : '—'}</Descriptions.Item>
          <Descriptions.Item label="Màu sắc">{r.color ? (COLOR_LABEL_MAP[r.color] || r.color) : '—'}</Descriptions.Item>
          <Descriptions.Item label="Hình dạng">{r.shape ? (SHAPE_LABEL_MAP[r.shape] || r.shape) : '—'}</Descriptions.Item>
          <Descriptions.Item label="Đặc tính ánh sáng">{r.lightCharacteristic ? (LIGHT_CHAR_LABEL_MAP[r.lightCharacteristic] || r.lightCharacteristic) : '—'}</Descriptions.Item>
          <Descriptions.Item label="Trạng thái hoạt động">
            <Tag color={r.isActive ? 'green' : 'default'}>{r.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Kiểm tra gần nhất">{formatDateOnly(r.lastInspectionDate)}</Descriptions.Item>
          <Descriptions.Item label="Kiểm tra kế tiếp">{formatDateOnly(r.nextInspectionDate)}</Descriptions.Item>
        </Descriptions>
        )}

        {/* Group 3: Thông tin phê duyệt */}
        <Divider orientation="left" style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: colors.sidebarBg, cursor: 'pointer', marginTop: spaceMd }}
          onClick={() => toggleSection('approval')}>
          {collapsedSections['approval'] ? '▶' : '▼'} Thông tin phê duyệt
        </Divider>
        {!collapsedSections['approval'] && (
        <Descriptions column={2} size="small" bordered style={{ tableLayout: 'fixed' }}
          labelStyle={{ width: 180, whiteSpace: 'nowrap' }}>
          <Descriptions.Item label="Trạng thái" span={1}>
            <Tag color={APPROVAL_STYLE_MAP[r.status || '']?.color || 'default'}>{approvalLabel}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Cấp phê duyệt">{r.approvalLevel != null ? `Cấp ${r.approvalLevel}` : '—'}</Descriptions.Item>
          <Descriptions.Item label="Người phê duyệt L1">
            {r.level1ApprovedBy != null ? (userMap.get(String(r.level1ApprovedBy)) || String(r.level1ApprovedBy)) : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày phê duyệt L1">{formatDate(r.level1ApprovedDate)}</Descriptions.Item>
          <Descriptions.Item label="Người phê duyệt L2">
            {r.level2ApprovedBy != null ? (userMap.get(String(r.level2ApprovedBy)) || String(r.level2ApprovedBy)) : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày phê duyệt L2">{formatDate(r.level2ApprovedDate)}</Descriptions.Item>
          <Descriptions.Item label="Lý do từ chối" span={2}>{r.rejectionReason || '—'}</Descriptions.Item>
        </Descriptions>
        )}

        {/* Group 4: Thông tin kiểm toán */}
        <Divider orientation="left" style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: colors.sidebarBg, cursor: 'pointer', marginTop: spaceMd }}
          onClick={() => toggleSection('audit')}>
          {collapsedSections['audit'] ? '▶' : '▼'} Thông tin kiểm toán
        </Divider>
        {!collapsedSections['audit'] && (
        <Descriptions column={2} size="small" bordered style={{ tableLayout: 'fixed' }}
          labelStyle={{ width: 180, whiteSpace: 'nowrap' }}>
          <Descriptions.Item label="Người tạo">
            {r.createdBy != null ? (userMap.get(String(r.createdBy)) || String(r.createdBy)) : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">{formatDate(r.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="Người cập nhật">
            {r.updatedBy != null ? (userMap.get(String(r.updatedBy)) || String(r.updatedBy)) : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày cập nhật">{formatDate(r.updatedAt)}</Descriptions.Item>
        </Descriptions>
        )}
      </div>
    );
  };

  // ── JSX ─────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100%', marginTop: -8 }}>
      <ScreenHeader
        breadcrumb={[{ label: 'Báo hiệu hàng hải' }, { label: 'Phao tiêu' }]}
        actions={headerActions}
      />

      <FilterBar
        fields={filterFields}
        onSearch={handleFilterSearch}
        onReset={handleFilterReset}
        onFieldChange={(key, value) => {
          if (key === 'managingUnitId') setManagingUnitId(value || undefined);
        }}
      />

      {/* StatusTabs */}
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
        <div style={{ flex: 1 }} />
      </div>

      {/* Table */}
      <div style={{ ...cardStyle, padding: '8px 16px' }}>
        {renderContent()}
      </div>

      {/* ── Detail Modal ──────────────────────────────────────────── */}
      <Modal
        title={
          <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>
            Chi tiết phao tiêu{detailRecord ? `: ${detailRecord.name}` : ''}
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
          (hasPerm('data:read') || hasPerm('admin:manage')) && detailRecord ? (
            <Button
              key="edit"
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                setDetailModalOpen(false);
                navigate(`/buoys/${detailRecord.id}?mode=edit`);
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
            Xác nhận xóa phao tiêu
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
            Vui lòng nhập <strong>tên phao tiêu</strong> hoặc gõ <strong>"XÓA"</strong> để xác nhận xóa.
          </p>
          {deletingRecord && (
            <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>
              Phao tiêu: <strong style={{ color: textPrimary }}>{deletingRecord.name}</strong>
            </p>
          )}
          <Input
            placeholder="Nhập tên phao tiêu hoặc XÓA"
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
            Vui lòng nhập lý do từ chối cho phao tiêu:
          </p>
          {rejectingRecord && (
            <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>
              <strong style={{ color: textPrimary }}>{rejectingRecord.name}</strong>
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

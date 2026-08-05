import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Button, Tag, Modal, Input, Select, Alert, Descriptions, Divider, Collapse, DatePicker,
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
  pierCRUD,
  pierApproval,
  berthCRUD,
  portCRUD,
} from '../../services/portService';
import type { Pier } from '../../types/port';
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
  fontSizeSm,
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
  PENDING: { color: actionPrimary, label: 'Chờ phê duyệt' },
  CHO_PHE_DUYET: { color: actionPrimary, label: 'Chờ phê duyệt' },
  PENDING_APPROVAL: { color: actionPrimary, label: 'Chờ phê duyệt' },
  DA_PHE_DUYET: { color: statusOperational, label: 'Được phê duyệt' },
  DUOC_PHE_DUYET: { color: statusOperational, label: 'Được phê duyệt' },
  APPROVED: { color: statusOperational, label: 'Được phê duyệt' },
  TU_CHOI: { color: statusCritical, label: 'Từ chối' },
  REJECTED: { color: statusCritical, label: 'Từ chối' },
};

const OPERATIONAL_STYLE_MAP: Record<string, { color: string; label: string }> = {
  HIEN_HANH: { color: statusOperational, label: 'Hiện hành' },
  OPERATIONAL: { color: statusOperational, label: 'Hiện hành' },
  TAM_NGUNG: { color: statusCritical, label: 'Tạm ngừng' },
  SUSPENDED: { color: statusCritical, label: 'Tạm ngừng' },
};

const PIER_TYPE_MAP: Record<string, string> = {
  CONTAINER: 'Container',
  TONG_HOP: 'Tổng hợp',
  HANH_KHACH: 'Hành khách',
  CHUYEN_DUNG_XANG_DAU: 'Chuyên dùng xăng dầu',
  CHUYEN_DUNG_ROI_QUANG: 'Chuyên dùng rời/quặng',
  KHAC: 'Khác',
};

const LOAI_CAU_OPTIONS = [
  { value: 'CAU_TAU_THANG', label: 'Cầu tàu thẳng' },
  { value: 'CAU_TAU_GOC', label: 'Cầu tàu góc' },
  { value: 'CAU_DAN', label: 'Cầu dẫn' },
  { value: 'CAU_CHU_T', label: 'Cầu chữ T' },
  { value: 'KHAC', label: 'Khác' },
];

const FIELD_LABEL_MAP: Record<string, string> = {
  pierCode: 'Mã cầu', pierName: 'Tên cầu', berthId: 'Bến cảng', portId: 'Cảng biển',
  length: 'Chiều dài', width: 'Chiều rộng', designLoad: 'Tải trọng TK',
  pierType: 'Loại cầu', operationalFunction: 'Chức năng KT', operationalStatus: 'Tình trạng',
  approvalStatus: 'Trạng thái PĐ', province: 'Tỉnh/TP', detailedLocation: 'Địa điểm',
  constructionGrade: 'Phân cấp CT', structureType: 'Loại kết cấu', conditionStatus: 'Tình trạng',
  currentWaterDepth: 'Độ sâu khu nước', designBedElevation: 'Cao độ đáy bến',
  publishedVesselDWT: 'Cỡ tàu', maintenanceApprovalDate: 'PD bảo trì',
  safetyAssessmentDate: 'Đánh giá ATCT', lastInspectionDate: 'Kiểm định gần nhất',
  operatingPierCount: 'Số CC đang KT', publishedPierCount: 'Số CC đã CB',
  investmentAgreementPierCount: 'Số CC TĐT', cargoThroughput: 'Sản lượng',
  receivesLargeVessel: 'Tiếp nhận tàu lớn', documentNumber: 'Số văn bản',
  documentDate: 'Ngày văn bản', openingAnnouncementDate: 'Ngày công bố',
  openingDecision: 'Quyết định mở', investmentAgreementDoc: 'Thỏa thuận ĐT',
  waterAreaNeutralScope: 'Phạm vi khu nước', mapSymbolId: 'Biểu tượng BĐ',
  spatialId: 'Vị trí GIS', coordinates: 'Tọa độ', geometryType: 'Loại hình học',
};

const TAB_STATUS_LIST = [
  { key: 'all', label: 'Tất cả', color: actionPrimary },
  { key: 'DRAFT', label: 'Nháp', color: statusDraft },
  { key: 'PENDING', label: 'Chờ phê duyệt', color: actionPrimary },
  { key: 'APPROVED', label: 'Được phê duyệt', color: statusOperational },
  { key: 'REJECTED', label: 'Từ chối', color: statusCritical },
];

const TAB_QUERY_MAP: Record<string, string | undefined> = {
  all: undefined,
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
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

export default function PierList() {
  const navigate = useNavigate();
  const hasPerm = usePermissionStore((s) => s.hasPermission);
  const userPermissions = useAuthStore((s) => s.user?.permissions) || [];
  const isAuditViewer = userPermissions.includes('admin:manage') || userPermissions.includes('admin:operation');

  // ── Filter state ─────────────────────────────────────────────────
  const [managingUnitId, setManagingUnitId] = useState<string | undefined>();
  const [filterPierName, setFilterPierName] = useState('');
  const [filterOperationalStatus, setFilterOperationalStatus] = useState<string | undefined>();
  const [filterBerthId, setFilterBerthId] = useState<string | undefined>();
  const [filterPierCode, setFilterPierCode] = useState('');
  const [filterLoaiCau, setFilterLoaiCau] = useState<string | undefined>();
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<string | undefined>();
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState<string | undefined>();
  const [filterUpdatedTo, setFilterUpdatedTo] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState('all');

  // ── Pagination ──────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // ── Data ─────────────────────────────────────────────────────────
  const [dataSource, setDataSource] = useState<Pier[]>([]);
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

  // ── Berth options for lookup ────────────────────────────────────
  const [berthOptions, setBerthOptions] = useState<{ value: string; label: string }[]>([]);
  const [portMap, setPortMap] = useState<Map<string, string>>(new Map());

  // ── Tab counts ──────────────────────────────────────────────────
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  // ── Advanced filter toggle ───────────────────────────────────────
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // ── Detail modal ────────────────────────────────────────────────
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<Pier | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailFiles, setDetailFiles] = useState<any[]>([]);

  // ── Delete confirmation modal ───────────────────────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<Pier | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // ── Reject modal ────────────────────────────────────────────────
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRecord, setRejectingRecord] = useState<Pier | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // ── History modal ───────────────────────────────────────────────
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyRecord, setHistoryRecord] = useState<Pier | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState<Record<number, boolean>>({});
  const [historyVisible, setHistoryVisible] = useState(10);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');

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

  // ── Load berth options ──────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const params: any = { page: 1, pageSize: 1000 };
        if (managingUnitId) params.orgUnitId = managingUnitId;
        const res = await berthCRUD.search(params);
        setBerthOptions((res.data || []).map((b: any) => ({ value: b.id, label: b.berthName })));
      } catch { /* ignore */ }
    })();
  }, [managingUnitId]);

  // ── Load port names for lookup ─────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const r = await portCRUD.findAll({ page: 1, size: 1000 });
        const map = new Map<string, string>();
        (r.data || []).forEach((p: any) => map.set(p.id, p.portName));
        setPortMap(map);
      } catch { /* ignore */ }
    })();
  }, []);

  // ── Fetch tab counts ────────────────────────────────────────────
  const fetchCounts = useCallback(async (orgId: string | undefined) => {
    try {
      const results = await Promise.allSettled(
        TAB_STATUS_LIST.map((tab) =>
          tab.key === 'all'
            ? pierCRUD.search({ orgUnitId: orgId, page: 1, pageSize: 1 })
            : pierCRUD.search({ approvalStatus: TAB_QUERY_MAP[tab.key], orgUnitId: orgId, page: 1, pageSize: 1 }),
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
      const res = await pierCRUD.search({
        orgUnitId: managingUnitId || undefined,
        pierName: filterPierName || undefined,
        pierCode: filterPierCode || undefined,
        berthId: filterBerthId,
        loaiCau: filterLoaiCau,
        operationalStatus: filterOperationalStatus,
        approvalStatus: filterApprovalStatus || TAB_QUERY_MAP[activeTab],
        page,
        pageSize,
      });
      setDataSource(res.data);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách cầu cảng'));
    } finally {
      setIsLoading(false);
    }
  }, [
    managingUnitId, filterPierName, filterBerthId, filterPierCode,
    filterLoaiCau, filterOperationalStatus, filterApprovalStatus,
    filterUpdatedFrom, filterUpdatedTo, activeTab, page, pageSize,
  ]);

  // Fetch data when filters change
  useEffect(() => { void fetchData(); }, [fetchData]);

  // Fetch counts when managingUnit changes
  useEffect(() => { void fetchCounts(managingUnitId); }, [managingUnitId, fetchCounts]);

  // ── Handlers ────────────────────────────────────────────────────

  const handleFilterSearch = useCallback((values: Record<string, any>) => {
    setManagingUnitId(values.managingUnitId || undefined);
    setFilterPierName(values.search || '');
    setFilterOperationalStatus(
      values.operationalStatus === 'HIEN_HANH' ? 'OPERATIONAL' : 'SUSPENDED'
    );
    setFilterBerthId(values.berthId || undefined);
    setFilterPierCode(values.pierCode || '');
    setFilterLoaiCau(values.loaiCau || undefined);
    setFilterApprovalStatus(values.approvalStatus || undefined);
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
    setFilterPierName('');
    setFilterOperationalStatus(undefined);
    setFilterBerthId(undefined);
    setFilterPierCode('');
    setFilterLoaiCau(undefined);
    setFilterApprovalStatus(undefined);
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

  const openDetailModal = useCallback(async (record: Pier) => {
    setDetailModalOpen(true);
    setDetailRecord(record);
    setDetailFiles([]);
    setDetailLoading(true);
    try {
      const res = await api.get(`/v1/documents/entity/pier/${record.id}`, { params: { page: 0, size: 50 } });
      setDetailFiles(res.data?.data?.content || res.data?.data || []);
    } catch { setDetailFiles([]); }
    try {
      const fresh = await pierCRUD.findById(record.id);
      setDetailRecord(fresh);
    } catch {
      // keep initial data
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // ── Delete confirmation ─────────────────────────────────────────

  const openDeleteModal = useCallback((record: Pier) => {
    setDeletingRecord(record);
    setDeleteConfirmText('');
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingRecord) return;
    const expectedText = deletingRecord.pierName || 'XÓA';
    if (deleteConfirmText.trim() !== expectedText && deleteConfirmText.trim() !== 'XÓA') {
      toast.error('Vui lòng nhập đúng tên cầu hoặc gõ "XÓA" để xác nhận');
      return;
    }
    try {
      await pierCRUD.delete(deletingRecord.id);
      toast.success('Đã xóa cầu cảng');
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
    async (record: Pier) => {
      try {
        await pierApproval.approve(record.id);
        toast.success('Đã phê duyệt cầu cảng');
        void fetchData();
        void fetchCounts(managingUnitId);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
      }
    },
    [fetchData, fetchCounts, managingUnitId],
  );

  const handleSubmitApproval = useCallback(
    async (record: Pier) => {
      try {
        await pierCRUD.update({ id: record.id, saveAction: 'SUBMIT' } as any);
        toast.success('Đã gửi phê duyệt cầu cảng');
        void fetchData();
        void fetchCounts(managingUnitId);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Gửi phê duyệt thất bại');
      }
    },
    [fetchData, fetchCounts, managingUnitId],
  );

  const openRejectModal = useCallback((record: Pier) => {
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
      await pierApproval.reject(rejectingRecord.id, reason);
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

  // ── History modal handler ──────────────────────────────────────
  const openHistoryModal = useCallback(async (record: Pier) => {
    setHistoryRecord(record);
    setHistoryData([]);
    setHistoryLoading(true);
    setHistoryModalOpen(true);
    setHistoryExpanded({});
    setHistoryVisible(10);
    setHistorySearch('');
    setHistoryFrom('');
    setHistoryTo('');
    try {
      const res = await api.get(`/v1/piers/${record.id}/history`);
      const data = res.data?.data;
      const changes = Array.isArray(data?.changeHistory) ? data.changeHistory : [];
      const approvals = Array.isArray(data?.approvalLog) ? data.approvalLog : [];
      setHistoryData([...changes, ...approvals].sort((a: any, b: any) => 
        new Date(b.changedAt || b.approvedAt || 0).getTime() - new Date(a.changedAt || a.approvedAt || 0).getTime()
      ));
    } catch {
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

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
      key: 'berthId',
      type: 'select' as const,
      label: 'Thuộc bến cảng',
      placeholder: 'Chọn bến cảng',
      width: 320,
      options: berthOptions.map((o) => ({ value: o.value, label: o.label })),
    },
    {
      key: 'search',
      type: 'search' as const,
      label: 'Tên cầu cảng',
      placeholder: 'Tìm theo tên cầu...',
      width: 180,
    },
    {
      key: 'pierCode',
      type: 'search' as const,
      label: 'Mã cầu',
      placeholder: 'Nhập mã cầu cảng',
      width: 320,
    },
    {
      key: 'operationalStatus',
      type: 'select' as const,
      label: 'Tình trạng',
      placeholder: 'Chọn tình trạng',
      options: [
        { value: 'HIEN_HANH', label: 'Hiện hành' },
        { value: 'TAM_NGUNG', label: 'Tạm ngừng' },
      ],
    },
    // Advanced filters (collapsible)
    ...(showAdvancedFilters ? [
      {
        key: 'loaiCau',
        type: 'select' as const,
        label: 'Loại cầu',
        placeholder: 'Chọn loại cầu',
        options: LOAI_CAU_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
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
  ], [organizations, berthOptions, showAdvancedFilters]);

  // ── Header actions ──────────────────────────────────────────────

  const headerActions = useMemo(() => {
    const actions: any[] = [];
    if (hasPerm('pier:create')) {
      actions.push({
        key: 'create',
        label: 'Thêm mới',
        variant: 'primary' as const,
        icon: <PlusOutlined />,
        onClick: () => navigate('/Pier/create'),
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
      render: (_: unknown, __: Pier, idx: number) => (
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
    // 3. Thuộc bến cảng
    {
      key: 'berthName',
      label: 'Thuộc bến cảng',
      dataIndex: 'berthName',
      width: 180,
      ellipsis: true,
      render: (v: string) => (
        <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span>
      ),
    },
    // 5. Tên cầu cảng
    {
      key: 'pierName',
      label: 'Tên cầu cảng',
      dataIndex: 'pierName',
      width: 160,
      ellipsis: true,
      render: (name: string) => (
        <span style={{ fontSize: fontSizeMd, fontWeight: fontWeightMedium, color: textPrimary }}>
          {name || '—'}
        </span>
      ),
    },
    // 6. Loại cầu
    {
      key: 'pierType',
      label: 'Loại cầu',
      dataIndex: 'pierType',
      width: 140,
      align: 'center' as const,
      render: (v: string | null | undefined) => {
        if (!v) return <span style={{ color: textTertiary }}>—</span>;
        return <Tag color="blue">{PIER_TYPE_MAP[v] || v}</Tag>;
      },
    },
    // 7. Chiều dài
    {
      key: 'length',
      label: 'Chiều dài (m)',
      dataIndex: 'length',
      width: 120,
      align: 'center' as const,
      render: (v: number | null | undefined) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary }}>
          {v != null ? v.toFixed(1) : '—'}
        </span>
      ),
    },
    // 8. Tải trọng
    {
      key: 'designLoad',
      label: 'Tải trọng (T/m²)',
      dataIndex: 'designLoad',
      width: 130,
      align: 'center' as const,
      render: (v: number | null | undefined) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary }}>
          {v != null ? v.toFixed(1) : '—'}
        </span>
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
      width: 120,
      ellipsis: true,
      render: (v: string | null | undefined) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary }}>
          {v ? (userMap.get(v) || v) : '—'}
        </span>
      ),
    },
    // 11. Tình trạng (operationalStatus badge)
    {
      key: 'operationalStatus',
      label: 'Tình trạng',
      dataIndex: 'operationalStatus',
      width: 120,
      align: 'center' as const,
      render: (status: string | null | undefined) => {
        if (!status) return <span style={{ color: textTertiary }}>—</span>;
        const s = OPERATIONAL_STYLE_MAP[status] || { color: 'default', label: status };
        let color = textTertiary;
        if (s.color === statusOperational) color = statusOperational;
        else if (s.color === statusCritical) color = statusCritical;
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
    // 12. Trạng thái (approvalStatus badge)
    {
      key: 'approvalStatus',
      label: 'Trạng thái',
      dataIndex: 'approvalStatus',
      width: 150,
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
  ], [page, pageSize, orgMap, userMap]);

  // ── Row actions with RBAC ───────────────────────────────────────

  const rowActions = useCallback((record: Pier) => {
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
    if (hasPerm('pier:update')) {
      actions.push({
        key: 'edit',
        label: 'Chỉnh sửa',
        icon: <EditOutlined />,
        onClick: () => navigate(`/Pier/${record.id}/edit`),
      });
    }

    // Xem vị trí
    if (record.latitude != null && record.longitude != null) {
      actions.push({
        key: 'location',
        label: 'Xem vị trí',
        icon: <EnvironmentOutlined />,
        onClick: () => {
          const lat = record.latitude;
          const lng = record.longitude;
          window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
        },
      });
    }

    // Gửi phê duyệt — khi ở trạng thái Nháp
    const draftStatuses = ['DRAFT', 'NHAP'];
    if (hasPerm('pier:update') && draftStatuses.includes(record.approvalStatus || '')) {
      actions.push({
        key: 'submit',
        label: 'Gửi phê duyệt',
        icon: <CheckCircleOutlined />,
        onClick: () => handleSubmitApproval(record),
      });
    }

    // Phê duyệt / Từ chối — Lãnh đạo / Admin
    const canApprove = hasPerm('pier:approve');
    const pendingStatuses = ['PENDING', 'PENDING_APPROVAL', 'CHO_PHE_DUYET'];
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
    if (hasPerm('pier:delete') && deletableStatuses.includes(record.approvalStatus || '')) {
      actions.push({
        key: 'delete',
        label: 'Xóa',
        icon: <DeleteOutlined />,
        onClick: () => openDeleteModal(record),
        danger: true,
      });
    }

    // Lịch sử
    actions.push({
      key: 'history',
      label: 'Lịch sử',
      icon: <HistoryOutlined />,
      onClick: () => openHistoryModal(record),
    });

    return actions;
  }, [hasPerm, navigate, handleApprove, openDeleteModal, openRejectModal, openDetailModal]);

  // ── Render content ──────────────────────────────────────────────

  const renderContent = () => {
    if (isLoading) return <LoadingSkeleton rows={8} />;
    if (isError) {
      return (
        <ErrorState
          message={error?.message || 'Không thể tải danh sách cầu cảng'}
          onRetry={fetchData}
        />
      );
    }

    if (dataSource.length === 0) {
      return <EmptyState description="Không tìm thấy cầu cảng nào phù hợp" />;
    }

    return (
      <div style={{ overflowX: 'auto' }}>
        <DataTable
          columns={columns}
          dataSource={dataSource}
          rowKey="id"
          rowActions={rowActions}
          scroll={{ x: 2100, y: 'calc(100vh - 450px)' }}
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
                <Descriptions.Item label="Mã cầu cảng">{r.pierCode}</Descriptions.Item>
                <Descriptions.Item label="Tên cầu cảng">{r.pierName}</Descriptions.Item>
                <Descriptions.Item label="Thuộc cảng biển">{portMap.get(r.portId || '') || '—'}</Descriptions.Item>
                <Descriptions.Item label="Thuộc bến cảng">{r.berthName || r.tenBenCang || '—'}</Descriptions.Item>
                <Descriptions.Item label="Tỉnh/TP">{r.province || '—'}</Descriptions.Item>
                <Descriptions.Item label="Địa điểm chi tiết">{r.detailedLocation || '—'}</Descriptions.Item>
                <Descriptions.Item label="Phân cấp công trình">{r.constructionGrade != null ? r.constructionGrade : '—'}</Descriptions.Item>
                <Descriptions.Item label="Loại kết cấu">{r.structureType != null ? r.structureType : '—'}</Descriptions.Item>
                </Descriptions>
        )}

        {/* Group 2: Thông số kỹ thuật */}
        <Divider orientation="left" style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: colors.sidebarBg, cursor: 'pointer', marginTop: spaceMd }}
          onClick={() => toggleSection('technical')}>
          {collapsedSections['technical'] ? '▶' : '▼'} Thông số kỹ thuật
        </Divider>
        {!collapsedSections['technical'] && (
        <Descriptions column={2} size="small" bordered style={{ tableLayout: 'fixed' }}
          labelStyle={{ width: 180, whiteSpace: 'nowrap' }}>
          <Descriptions.Item label="Chiều dài">{r.length != null ? `${r.length} m` : '—'}</Descriptions.Item>
          <Descriptions.Item label="Chiều rộng">{r.width != null ? `${r.width} m` : '—'}</Descriptions.Item>
          <Descriptions.Item label="Tải trọng TK">{r.designLoad != null ? `${r.designLoad} T/m²` : '—'}</Descriptions.Item>
          <Descriptions.Item label="Loại cầu">{r.pierType ? (PIER_TYPE_MAP[r.pierType] || r.pierType) : (r.loaiCau || '—')}</Descriptions.Item>
          <Descriptions.Item label="Chức năng KT">{r.operationalFunction || '—'}</Descriptions.Item>
          <Descriptions.Item label="Độ sâu khu nước">{r.currentWaterDepth || '—'}</Descriptions.Item>
          <Descriptions.Item label="Cao độ đáy bến">{r.designBedElevation || '—'}</Descriptions.Item>
          <Descriptions.Item label="Cỡ tàu (DWT)">{r.publishedVesselDWT || '—'}</Descriptions.Item>
          <Descriptions.Item label="Tình trạng" span={1}>
            <Tag color={OPERATIONAL_STYLE_MAP[r.operationalStatus || '']?.color || 'default'}>{opStatusLabel}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái" span={1}>
            <Tag color={APPROVAL_STYLE_MAP[r.approvalStatus || '']?.color || 'default'}>{approvalLabel}</Tag>
          </Descriptions.Item>
        </Descriptions>
        )}

        {/* Group 3: Công bố & Số lượng */}
        <Divider orientation="left" style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: colors.sidebarBg, cursor: 'pointer', marginTop: spaceMd }}
          onClick={() => toggleSection('announcement')}>
          {collapsedSections['announcement'] ? '▶' : '▼'} Công bố & Số lượng
        </Divider>
        {!collapsedSections['announcement'] && (
        <Descriptions column={2} size="small" bordered style={{ tableLayout: 'fixed' }}
          labelStyle={{ width: 180, whiteSpace: 'nowrap' }}>
          <Descriptions.Item label="Ngày công bố">{r.openingAnnouncementDate || '—'}</Descriptions.Item>
          <Descriptions.Item label="Quyết định mở">{r.openingDecision || '—'}</Descriptions.Item>
          <Descriptions.Item label="Thỏa thuận ĐT">{r.investmentAgreementDoc || '—'}</Descriptions.Item>
          <Descriptions.Item label="Số văn bản">{r.documentNumber || '—'}</Descriptions.Item>
          <Descriptions.Item label="Sản lượng (tấn)">{r.cargoThroughput != null ? r.cargoThroughput : '—'}</Descriptions.Item>
          <Descriptions.Item label="Tiếp nhận tàu lớn">{r.receivesLargeVessel ? 'Có' : 'Không'}</Descriptions.Item>
          <Descriptions.Item label="Số CC đang KT">{r.operatingPierCount != null ? r.operatingPierCount : '—'}</Descriptions.Item>
          <Descriptions.Item label="Số CC đã CB">{r.publishedPierCount != null ? r.publishedPierCount : '—'}</Descriptions.Item>
          <Descriptions.Item label="Số CC TĐT">{r.investmentAgreementPierCount != null ? r.investmentAgreementPierCount : '—'}</Descriptions.Item>
          <Descriptions.Item label="Phạm vi khu nước">{r.waterAreaNeutralScope || '—'}</Descriptions.Item>
        </Descriptions>
        )}

        {/* Group 4: Bảo trì & Kiểm định */}
        <Divider orientation="left" style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: colors.sidebarBg, cursor: 'pointer', marginTop: spaceMd }}
          onClick={() => toggleSection('maintenance')}>
          {collapsedSections['maintenance'] ? '▶' : '▼'} Bảo trì & Kiểm định
        </Divider>
        {!collapsedSections['maintenance'] && (
        <Descriptions column={2} size="small" bordered style={{ tableLayout: 'fixed' }}
          labelStyle={{ width: 180, whiteSpace: 'nowrap' }}>
          <Descriptions.Item label="PD quy trình bảo trì">{r.maintenanceApprovalDate || '—'}</Descriptions.Item>
          <Descriptions.Item label="Đánh giá ATCT">{r.safetyAssessmentDate || '—'}</Descriptions.Item>
          <Descriptions.Item label="Kiểm định gần nhất" span={2}>{r.lastInspectionDate || '—'}</Descriptions.Item>
        </Descriptions>
        )}

        {/* Group 5: Thông tin vị trí */}
        <Divider orientation="left" style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: colors.sidebarBg, cursor: 'pointer', marginTop: spaceMd }}
          onClick={() => toggleSection('location')}>
          {collapsedSections['location'] ? '▶' : '▼'} Thông tin vị trí
        </Divider>
        {!collapsedSections['location'] && (
        <Descriptions column={2} size="small" bordered style={{ tableLayout: 'fixed' }}
          labelStyle={{ width: 180, whiteSpace: 'nowrap' }}>
          <Descriptions.Item label="Loại hình học">
            {{ POINT: 'Đối tượng điểm', LINE: 'Đối tượng đường', POLYGON: 'Đối tượng vùng' }[r.geometryType || ''] || r.geometryType || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Biểu tượng bản đồ">{symbolMap.get(r.mapSymbolId || '') || r.mapSymbolId || '—'}</Descriptions.Item>
          <Descriptions.Item label="Tọa độ" span={2}>{r.coordinates || r.toaDo || '—'}</Descriptions.Item>
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

  const translateVal = useCallback((fn: string, val: string) => {
    if (!val || val === '(null)' || val === 'null') return '—';
    // Date / datetime detection
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(val)) {
      try { return dayjs(val).format('DD/MM/YYYY HH:mm'); } catch { return val; }
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      try { return dayjs(val).format('DD/MM/YYYY'); } catch { return val; }
    }
    // approvalStatus
    if (fn === 'approvalStatus') {
      const m: Record<string,string> = { DRAFT:'Nháp', PENDING:'Chờ duyệt', APPROVED:'Đã duyệt', REJECTED:'Từ chối' };
      return m[val.toUpperCase()] || val;
    }
    // operationalStatus / conditionStatus — API trả về English enum name (SUSPENDED, OPERATIONAL) hoặc số ORDINAL
    if (fn === 'operationalStatus' || fn === 'conditionStatus') {
      const m: Record<string,string> = {
        OPERATIONAL:'Đang hoạt động', SUSPENDED:'Tạm ngừng',
        HIEN_HANH:'Hiện hành', TAM_NGUNG:'Tạm ngừng',
        '1':'Hiện hành', '0':'Tạm ngừng',
      };
      return m[val.toUpperCase()] || m[val] || val;
    }
    // pierType — dùng PIER_TYPE_MAP đã có sẵn (TONG_HOP, HANH_KHACH, ...)
    if (fn === 'pierType') { return PIER_TYPE_MAP[val.toUpperCase()] || PIER_TYPE_MAP[val] || val; }
    // structureType — lưu số nguyên (ORDINAL): 1=Bến nước, 2=Bến bờ, 3=Bến phao, 4=Khác
    if (fn === 'structureType') {
      const m: Record<string,string> = { '1':'Bến nước', '2':'Bến bờ', '3':'Bến phao', '4':'Khác' };
      return m[val] || val;
    }
    // constructionGrade — số 1-5
    if (fn === 'constructionGrade') { return val.match(/^\d+$/) ? `Cấp ${val}` : val; }
    // UUID lookups
    if (fn === 'portId') { const name = portMap.get(val); return name || val.substring(0,8)+'…'; }
    if (fn === 'mapSymbolId') { const name = symbolMap.get(val); return name || val.substring(0,8)+'…'; }
    if (fn === 'berthId') { const b = berthOptions.find(o => o.value === val); return b ? b.label : val.substring(0,8)+'…'; }
    // spatialId
    if (fn === 'spatialId') return 'Có tọa độ bản đồ';
    // receivesLargeVessel
    if (fn === 'receivesLargeVessel') return val === 'true' || val === '1' ? 'Có' : 'Không';
    // booleans
    if (val === 'true' || val === '1') return 'Có';
    if (val === 'false' || val === '0') return 'Không';
    return val;
  }, [portMap, symbolMap, berthOptions]);

  return (
    <div style={{ minHeight: '100%', marginTop: -8 }}>
      <ScreenHeader
        breadcrumb={[{ label: 'Tài sản KCHTGT' }, { label: 'Cầu cảng' }]}
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
            Chi tiết cầu cảng{detailRecord ? `: ${detailRecord.pierName}` : ''}
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
          hasPerm('pier:update') && detailRecord ? (
            <Button
              key="edit"
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                setDetailModalOpen(false);
                navigate(`/Pier/${detailRecord.id}/edit`);
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
          hasPerm('pier:history') && detailRecord ? (
            <Button key="history" icon={<HistoryOutlined />}
              onClick={() => { const r = detailRecord; setDetailModalOpen(false); openHistoryModal(r); }}
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Lịch sử</Button>
          ) : null,
          hasPerm('pier:delete') && detailRecord && ['DRAFT','TU_CHOI','REJECTED','TAM_NGUNG','SUSPENDED'].includes(detailRecord.approvalStatus || '') ? (
            <Button key="delete" danger icon={<DeleteOutlined />}
              onClick={() => { setDetailModalOpen(false); openDeleteModal(detailRecord); }}
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Xóa</Button>
          ) : null,
          hasPerm('pier:approve') && detailRecord && ['PENDING','PENDING_APPROVAL','CHO_PHE_DUYET'].includes(detailRecord.approvalStatus || '') ? (
            <>
              <Button key="reject" danger icon={<CloseCircleOutlined />}
                onClick={() => { setDetailModalOpen(false); openRejectModal(detailRecord); }}
                style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Từ chối</Button>
              <Button key="approve" icon={<CheckCircleOutlined />}
                onClick={() => { setDetailModalOpen(false); handleApprove(detailRecord); }}
                style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, color: statusOperational, borderColor: statusOperational }}>Phê duyệt</Button>
            </>
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
            Xác nhận xóa cầu cảng
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
            Vui lòng nhập <strong>tên cầu</strong> hoặc gõ <strong>"XÓA"</strong> để xác nhận xóa.
          </p>
          {deletingRecord && (
            <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>
              Cầu: <strong style={{ color: textPrimary }}>{deletingRecord.pierName}</strong>
            </p>
          )}
          <Input
            placeholder="Nhập tên cầu hoặc XÓA"
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
            Vui lòng nhập lý do từ chối cho cầu:
          </p>
          {rejectingRecord && (
            <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>
              <strong style={{ color: textPrimary }}>{rejectingRecord.pierName}</strong>
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

      {/* ── History Modal ────────────────────────────────────────── */}
      <Modal
        title={<span style={{ color: actionPrimary, fontWeight: fontWeightBold, fontSize: 15 }}>
          {historyRecord ? `Lịch sử thay đổi — ${historyRecord.pierName}` : 'Lịch sử thay đổi'}
        </span>}
        open={historyModalOpen}
        onCancel={() => { setHistoryModalOpen(false); setHistoryRecord(null); }}
        footer={null}
        width={880}
        styles={{ body: { padding: spaceMd, maxHeight: '68vh', overflowY: 'auto' } }}
      >
        {historyLoading ? <LoadingSkeleton rows={5} /> : historyData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <HistoryOutlined style={{ fontSize: 40, color: textTertiary }} />
            <div style={{ color: textTertiary, fontSize: 13 }}>Chưa có thay đổi nào</div>
          </div>
        ) : (() => {
          const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000);
          const sorted = [...historyData].sort((a: any, b: any) =>
            new Date(b.changedAt || b.createdAt || b.decidedAt || 0).getTime() - new Date(a.changedAt || a.createdAt || a.decidedAt || 0).getTime());
          const groups: { tsSec: number; ts: string; actor: string; items: any[] }[] = [];
          for (const r of sorted) {
            const q = historySearch.toLowerCase().trim();
            if (q) {
              const fn = (r.fieldName || r.fieldChanged || '').toLowerCase();
              const ov = (r.oldValue || '').toLowerCase(); const nv = (r.newValue || '').toLowerCase();
              const label = (FIELD_LABEL_MAP[r.fieldName||r.fieldChanged] || '').toLowerCase();
              if (!fn.includes(q) && !ov.includes(q) && !nv.includes(q) && !label.includes(q)) continue;
            }
            if (historyFrom || historyTo) {
              const cd = (r.changedAt || r.createdAt || r.decidedAt || '').substring(0, 16);
              if (historyFrom && cd < historyFrom.replace(' ', 'T')) continue;
              if (historyTo && cd > historyTo.replace(' ', 'T') + ':59') continue;
            }
            const ts = r.changedAt || r.createdAt || r.decidedAt || '';
            const sec = ts ? toSec(ts) : 0;
            const prev = groups[groups.length - 1];
            if (prev && prev.tsSec === sec && prev.actor === (r.changedBy || r.decidedBy || '')) prev.items.push(r);
            else groups.push({ tsSec: sec, ts, actor: r.changedBy || r.decidedBy || '', items: [r] });
          }
          const fmt = (ts: string) => {
            const d = new Date(ts);
            return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
          };
          if (groups.length === 0) return <div style={{ textAlign: 'center', padding: '32px 0', color: textTertiary }}>Không tìm thấy kết quả</div>;
          if (Object.keys(historyExpanded).length === 0) {
            const init: Record<number, boolean> = {}; groups.forEach((_, i) => { init[i] = false; });
            setTimeout(() => setHistoryExpanded(init), 0);
          }
          const vis = groups.slice(0, historyVisible);
          return (<div>
            <div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceMd }}>
              <Input.Search placeholder="Tìm kiếm..." allowClear value={historySearch}
                onChange={e => setHistorySearch(e.target.value)} style={{ flex: 1 }} />
              <DatePicker placeholder="Từ" value={historyFrom ? dayjs(historyFrom) : null}
                onChange={d => setHistoryFrom(d ? d.format('YYYY-MM-DD HH:mm') : '')}
                style={{ width: 170 }} format="DD/MM/YYYY HH:mm" showTime={{ format: 'HH:mm' }} />
              <DatePicker placeholder="Đến" value={historyTo ? dayjs(historyTo) : null}
                onChange={d => setHistoryTo(d ? d.format('YYYY-MM-DD HH:mm') : '')}
                style={{ width: 170 }} format="DD/MM/YYYY HH:mm" showTime={{ format: 'HH:mm' }} />
            </div>
            <div style={{ maxHeight: '62vh', overflowY: 'auto' }}
              onScroll={e => { const el = e.currentTarget; if (el.scrollHeight - el.scrollTop - el.clientHeight < 80 && historyVisible < groups.length) setHistoryVisible(p => Math.min(p + 10, groups.length)); }}>
            {vis.map((g, gi) => (
              <div key={gi} style={{ display: 'flex', gap: spaceSm, marginBottom: gi < vis.length - 1 ? spaceSm : 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24, flexShrink: 0 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#fff', border: `1px solid ${actionPrimary}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: actionPrimary }} />
                  </div>
                  {gi < groups.length - 1 && <div style={{ width: 1, flex: 1, minHeight: 24, background: borderDefault, marginTop: 4 }} />}
                </div>
                <div style={{ ...cardStyle, flex: 1, padding: `${spaceSm}px ${spaceFormField}px`, borderRadius: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                  <div onClick={() => setHistoryExpanded(p => ({ ...p, [gi]: !p[gi] }))} style={{ display: 'flex', alignItems: 'center', gap: spaceSm, cursor: 'pointer' }}>
                    <span style={{ fontSize: 15, color: textPrimary, fontWeight: fontWeightBold }}>{g.ts ? fmt(g.ts) : '—'}</span>
                    {g.actor && <span style={{ fontSize: 13, color: textSecondary }}>— {g.actor}</span>}
                    <span style={{ fontSize: 13, fontWeight: fontWeightBold, color: actionPrimary, background: `${actionPrimary}12`, borderRadius: radiusPill, padding: '2px 10px', marginLeft: 'auto' }}>{g.items.length}</span>
                    {historyExpanded[gi] ? <span style={{ fontSize: 12, color: textTertiary }}>▲</span> : <span style={{ fontSize: 12, color: textTertiary }}>▼</span>}
                  </div>
                  {historyExpanded[gi] && <div>
                    <Divider style={{ margin: `${spaceSm}px 0` }} />
                    <table style={{ width: '100%' }}><tbody>
                      {g.items.map((r: any, ri: number) => {
                        if (r.decision) return <tr key={`app-${ri}`}>
                          <td style={{ padding: '4px 8px 4px 0', fontSize: 13, fontWeight: fontWeightMedium, color: textPrimary, whiteSpace: 'nowrap' }}>
                            <Tag color={r.decision === 'APPROVED' ? statusOperational : statusCritical} style={{ margin: 0 }}>
                              {r.decision === 'APPROVED' ? 'Phê duyệt' : 'Từ chối'}
                            </Tag>
                            {r.cap && ` — Cấp: ${r.cap}`}
                          </td>
                          <td style={{ padding: '4px 0', fontSize: 13, color: textTertiary }}>
                            {r.decidedAt ? dayjs(r.decidedAt).format('DD/MM/YYYY HH:mm') : '—'}
                            {r.reason && <span style={{ color: textSecondary }}> — {r.reason}</span>}
                          </td>
                        </tr>;
                        const fn = r.fieldName || r.fieldChanged;
                        const ov = r.oldValue !== undefined && r.oldValue != null && r.oldValue !== '(null)' && r.oldValue !== 'null' ? String(r.oldValue) : null;
                        const nv = r.newValue !== undefined && r.newValue != null && r.newValue !== '(null)' && r.newValue !== 'null' ? String(r.newValue) : null;
                        return <tr key={r.id || ri}>
                          <td style={{ padding: '4px 8px 4px 0', fontSize: 13, fontWeight: fontWeightMedium, color: textPrimary, whiteSpace: 'nowrap', width: 1 }}>{FIELD_LABEL_MAP[fn] || fn}</td>
                          <td style={{ padding: '4px 0', fontSize: 13 }}>
                            {ov ? <span style={{ textDecoration: 'line-through', color: statusCritical }}>{translateVal(fn, String(r.oldValue))}</span> : <span style={{ color: textTertiary }}>—</span>}
                            <span style={{ color: textTertiary, margin: '0 6px' }}>→</span>
                            {nv ? <span style={{ color: statusOperational, fontWeight: fontWeightMedium }}>{translateVal(fn, String(r.newValue))}</span> : <span style={{ color: textTertiary }}>—</span>}
                          </td>
                        </tr>;
                      })}
                    </tbody></table>
                  </div>}
                </div>
              </div>
            ))}
            </div>
          </div>);
        })()}
      </Modal>
    </div>
  );
}

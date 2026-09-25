import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Input, Select, DatePicker, Modal, Button, Tooltip } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { message } from '../../components/ToastNotification';
import { navigationChannelCRUD, navigationChannelApproval } from '../../services/navigationChannelService';
import { organizationService } from '../../services/organizationService';
import { vtsSystemCRUD } from '../../services/vtsSystemService';
import { userService } from '../../services/userService';
import { ScreenHeader, DataTable } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import CommonHistoryDrawer, { type CommonHistoryEntry } from '../../components/shared/CommonHistoryDrawer';
import { FilterOrgUnitTreeSelect, normalizeSearchText, resolveDefaultOrgUnitId, resolveOrgSubtreeIds } from '../../components/org-unit';
import { usePermissionStore } from '../../store/permissionStore';
import { useAuthStore } from '../../store/authStore';
import { useGisEmbeddedAction } from '../../hooks/useGisEmbeddedAction';
import type { NavigationChannelResponse, ListParams, ApprovalStatus } from '../../types/navigationChannel';
import { useStandardApprovalStatusTabs } from '../../components/shared/approvalStatusTabs';
import { CONDITION_STATUS_OPTIONS, CONDITION_STATUS_MAP } from '../../types/navigationChannel';
import { VIETNAM_PROVINCE_OPTIONS, getProvinceNameById } from '../../types/common';
import { symbolService, type Symbol as MapSymbol } from '../../services/symbolService';
import { gisCoordinatesToLines, gisGeometryTypeLabel } from '../../utils/historyGisFormat';
import {
  statusOperational,
  statusCritical,
  statusAttention,
  statusDraft,
  actionPrimary,
  textPrimary,
  textSecondary,
  textTertiary,
  borderDefault,
  DRAWER_WIDTH,
  fontSizeLg,
  fontWeightBold,
  radiusPill,
  spaceSm,
  spaceMd,
  spaceFormField,
  statusBadgeStyle,
  cellTitleStyle,
  cellSubtitleStyle,
  icons,
  colors,
  drawerTitleStyle,
  inputStyle,
  selectStyle,
  getRangePickerProps,
} from '../../themetokenchk';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import ApprovalModal from '../../components/shared/ApprovalModal';
import DeleteConfirmModal from '../../components/shared/DeleteConfirmModal';
import NavigationChannelForm from './NavigationChannelForm';
import NavigationChannelDetailContent from './NavigationChannelDetailContent';
import AppDrawer from '../../components/shared/AppDrawer';
import { canDeleteApprovalRecord, canEditApprovalRecord } from '../../utils/approvalEditPolicy';

// Cỡ chữ màn /navigation-channel: 13.5px chuẩn /beacon-stations & /berth (thay vì token tĩnh themetokenchk fontSizeMd=13px).
const fontSizeMd = 13.5;

// ── #8 Tình trạng — màu badge theo token ─────────────────────────────
const CONDITION_STATUS_STYLE_MAP: Record<string, { label: string; color: string }> = {
  OPERATIONAL: { label: 'Đang khai thác/vận hành', color: statusOperational },
  NOT_YET_OPERATIONAL: { label: 'Chưa khai thác/vận hành', color: statusAttention },
  SUSPENDED: { label: 'Dừng khai thác/vận hành', color: statusCritical },
  STOPPED: { label: 'Dừng hoạt động', color: statusCritical },
  MAINTENANCE: { label: 'Đang bảo trì', color: statusAttention },
  UNDER_CONSTRUCTION: { label: 'Đang xây dựng', color: statusDraft },
};

// ── #47 Trạng thái — 8 tabs chuẩn phân cấp phê duyệt (chuẩn /beacon-stations) ──
export const CHANNEL_APPROVAL_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Lưu tạm',
  PENDING_APPROVAL: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
  APPROVED_LEVEL1: 'Chờ phê duyệt cấp Cục',
  APPROVED: 'Đã phê duyệt',
  REJECTED_LEVEL1: 'Từ chối cấp Cảng vụ/Chi cục',
  REJECTED_LEVEL2: 'Từ chối cấp Cục',
  ARCHIVED: 'Đã xóa',
};

// ── Lịch sử thay đổi (chuẩn /vts-system) ────────────────────────
const HISTORY_PAGE_SIZE = 20;

const CHANNEL_HISTORY_FIELD_LABELS: Record<string, string> = {
  unitId: 'Đơn vị quản lý',
  orgUnitId: 'Đơn vị quản lý',
  unitName: 'Đơn vị quản lý',
  parentOrgUnitId: 'Cơ quan quản lý cấp trên',
  seaportId: 'Thuộc cảng biển',
  operatingUnitId: 'Đơn vị vận hành',
  channelCode: 'Mã luồng hàng hải',
  channelName: 'Tên luồng hàng hải',
  code: 'Mã luồng hàng hải',
  name: 'Tên luồng hàng hải',
  provinceId: 'Địa điểm (Tỉnh/TP)',
  detailedLocation: 'Địa điểm chi tiết',
  conditionStatus: 'Tình trạng',
  operationalStatus: 'Tình trạng',
  managementStation: 'Trạm quản lý luồng',
  stationCount: 'Số lượng trạm',
  stationStaffCount: 'Số lượng nhân sự tại trạm',
  stationAreaSquareMeters: 'Diện tích trạm (m²)',
  latestStationRepairMonth: 'Sửa chữa trạm gần nhất',
  latestMaintenanceYear: 'Năm bảo trì gần nhất',
  latestDredgingVolumeCubicMeters: 'KL nạo vét (m³)',
  buoyCount: 'Số lượng phao',
  beaconCount: 'Số lượng tiêu',
  notes: 'Ghi chú',
  note: 'Ghi chú',
  announcementDecisionNumber: 'Quyết định công bố số',
  announcementDecisionDate: 'Ngày ra quyết định',
  announcementDecisionIssuer: 'Đơn vị ra quyết định',
  protectionScopeMeters: 'Phạm vi bảo vệ luồng (m)',
  protectionNotes: 'Ghi chú phạm vi bảo vệ',
  geometryType: 'Loại đối tượng GIS',
  coordinates: 'Tọa độ GIS',
  mapIconId: 'Biểu tượng GIS',
  mapSymbolId: 'Biểu tượng GIS',
  coordinateReferenceSystem: 'Hệ quy chiếu',
  coordinateSystem: 'Hệ quy chiếu',
  displayRule: 'Quy tắc hiển thị',
  attachments: 'Tài liệu đính kèm',
  status: 'Trạng thái',
  approvalStatus: 'Trạng thái phê duyệt',
  rejectionReason: 'Lý do từ chối',
};

const rangeValue = (from: string, to: string): [Dayjs | null, Dayjs | null] | null =>
  from || to ? [from ? dayjs(from) : null, to ? dayjs(to) : null] : null;

export default function NavigationChannelList() {
  const {
    action: embeddedAction,
    recordId: embeddedRecordId,
    isEmbeddedAction,
    closeEmbeddedAction,
  } = useGisEmbeddedAction();
  const embeddedOpenedRef = useRef<string | null>(null);
  const isInIframe = window.self !== window.top;
  const authUser = useAuthStore((s) => s.user);
  const hasPerm = useCallback((key: string) => usePermissionStore.getState().hasPermission(key), []);

  // ── Filters (DS/Lọc: #1/#2/#4/#5/#6/#8/#47/#48) ────────────────────
  const defaultOrgUnitRef = useRef<string | undefined>(undefined);
  const [inputKeyword, setInputKeyword] = useState('');
  const [inputChannelCode, setInputChannelCode] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [appliedChannelCode, setAppliedChannelCode] = useState('');
  const [filterOrgUnitId, setFilterOrgUnitId] = useState<string | undefined>();
  const [filterSeaportId, setFilterSeaportId] = useState<string | undefined>();
  const [filterProvinceId, setFilterProvinceId] = useState<string | undefined>();
  const [filterConditionStatus, setFilterConditionStatus] = useState<string | undefined>();
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState('');
  const [filterUpdatedTo, setFilterUpdatedTo] = useState('');
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<ApprovalStatus | undefined>();
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const statusCountFilterKey = useRef<string | null>(null);
  const [filterCollapsed, setFilterCollapsed] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortField, setSortField] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [dataSource, setDataSource] = useState<NavigationChannelResponse[]>([]);

  const sortOrderFor = useCallback(
    (key: string) =>
      sortField === key && sortOrder ? (sortOrder === 'asc' ? ('ascend' as const) : ('descend' as const)) : null,
    [sortField, sortOrder],
  );
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  // ── Dropdown data ───────────────────────────────────────────────────
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [seaportOptions, setSeaportOptions] = useState<{ id: string; portCode?: string; portName?: string; orgUnitId?: string }[]>([]);
  const [userOptions, setUserOptions] = useState<{ value: string; label: string }[]>([]);

  const filteredSeaportOptions = useMemo(() => {
    if (!filterOrgUnitId) return seaportOptions;
    const allowedOrgIds = resolveOrgSubtreeIds(organizations, filterOrgUnitId);
    return seaportOptions.filter((port) => port.orgUnitId && allowedOrgIds.has(String(port.orgUnitId)));
  }, [seaportOptions, organizations, filterOrgUnitId]);

  // ── Modal (create / edit / detail) ──────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  // ── Approval / delete / history ─────────────────────────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<NavigationChannelResponse | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submittingRecord, setSubmittingRecord] = useState<NavigationChannelResponse | null>(null);

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvingRecord, setApprovingRecord] = useState<NavigationChannelResponse | null>(null);
  const [approveLevel, setApproveLevel] = useState<'c1' | 'c2'>('c1');
  const [approving, setApproving] = useState(false);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRecord, setRejectingRecord] = useState<NavigationChannelResponse | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);
  const [rejectLevel, setRejectLevel] = useState<'c1' | 'c2'>('c1');

  // History drawer state (chuẩn /vts-system)
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<NavigationChannelResponse | null>(null);
  const [historyRecords, setHistoryRecords] = useState<CommonHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyFilters, setHistoryFilters] = useState<{ keyword: string; fromDate?: string; toDate?: string }>({ keyword: '' });
  const [symbols, setSymbols] = useState<MapSymbol[]>([]);

  useEffect(() => {
    symbolService.getAll().then(setSymbols).catch(() => {});
  }, []);

  useEffect(() => {
    if (isInIframe) return;
    (async () => {
      try {
        const orgs = await organizationService.getTree();
        setOrganizations(orgs || []);
        const resolvedDefault = resolveDefaultOrgUnitId(authUser, orgs || []);
        defaultOrgUnitRef.current = resolvedDefault;
        setFilterOrgUnitId(resolvedDefault);
      } catch (err) {
        console.error('Không tải được cây đơn vị quản lý', err);
      }
      try {
        const ports = await vtsSystemCRUD.getScopedPortOptions();
        setSeaportOptions(ports || []);
      } catch (err) {
        console.error('Không tải được danh sách cảng biển', err);
      }
      try {
        const resp: any = await userService.list({ pageSize: 1000 });
        const users = resp?.data || resp?.content || [];
        setUserOptions(users.map((u: any) => ({ value: u.id, label: u.fullName || u.username || u.id })));
      } catch (err) {
        console.error('Không tải được danh sách cán bộ', err);
      }
    })();
  }, [isInIframe, authUser]);

  // ── Fetch list ──────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    void reloadToken;
    setIsLoading(true);
    setIsError(false);
    try {
      const currentStatusCountFilterKey = JSON.stringify([
        appliedKeyword,
        appliedChannelCode,
        filterOrgUnitId,
        filterSeaportId,
        filterProvinceId,
        filterConditionStatus,
        filterUpdatedFrom,
        filterUpdatedTo,
      ]);
      const shouldIncludeCounts = statusCountFilterKey.current !== currentStatusCountFilterKey;

      const params: ListParams = {
        page: page - 1,
        size: pageSize,
        keyword: appliedKeyword || undefined,
        channelCode: appliedChannelCode || undefined,
        orgUnitId: filterOrgUnitId,
        seaportId: filterSeaportId,
        provinceId: filterProvinceId ? Number(filterProvinceId) : undefined,
        conditionStatus: filterConditionStatus as any,
        approvalStatus: filterApprovalStatus,
        updatedFrom: filterUpdatedFrom || undefined,
        updatedTo: filterUpdatedTo || undefined,
        sortField,
        sortOrder: sortOrder || undefined,
        sortBy: sortField,
        sortDir: sortField && sortOrder ? (sortOrder === 'asc' ? 'ASC' : 'DESC') : undefined,
      };
      const res = await navigationChannelCRUD.search(params);
      setDataSource(res.items);
      setTotal(res.total);

      if (res.statusCounts && Object.keys(res.statusCounts).length > 0) {
        setStatusCounts(res.statusCounts);
        statusCountFilterKey.current = currentStatusCountFilterKey;
      } else if (shouldIncludeCounts) {
        void navigationChannelCRUD.countStatus(params).then((cnts) => {
          if (cnts && Object.keys(cnts).length > 0) {
            setStatusCounts(cnts);
            statusCountFilterKey.current = currentStatusCountFilterKey;
          }
        }).catch(() => {});
      }
    } catch (err: unknown) {
      setIsError(true);
      setTotal(0);
      setDataSource([]);
      console.error('Lỗi tải danh sách luồng hàng hải', err);
    } finally {
      setIsLoading(false);
    }
  }, [
    page,
    pageSize,
    filterApprovalStatus,
    appliedKeyword,
    appliedChannelCode,
    filterOrgUnitId,
    filterSeaportId,
    filterProvinceId,
    filterConditionStatus,
    filterUpdatedFrom,
    filterUpdatedTo,
    sortField,
    sortOrder,
    reloadToken,
  ]);

  useEffect(() => {
    if (!isInIframe) {
      void fetchData();
    }
  }, [fetchData, isInIframe]);

  // ── Filter handlers ─────────────────────────────────────────────────
  const handleFilterApply = useCallback(() => {
    const trimmedKeyword = inputKeyword.trim();
    const trimmedCode = inputChannelCode.trim();
    setInputKeyword(trimmedKeyword);
    setInputChannelCode(trimmedCode);
    setAppliedKeyword(trimmedKeyword);
    setAppliedChannelCode(trimmedCode);
    setPage(1);
    statusCountFilterKey.current = null;
    setReloadToken((t) => t + 1);
  }, [inputKeyword, inputChannelCode]);

  const handleFilterReset = useCallback(() => {
    statusCountFilterKey.current = null;
    setInputKeyword('');
    setInputChannelCode('');
    setAppliedKeyword('');
    setAppliedChannelCode('');
    setFilterOrgUnitId(defaultOrgUnitRef.current);
    setFilterSeaportId(undefined);
    setFilterProvinceId(undefined);
    setFilterConditionStatus(undefined);
    setFilterUpdatedFrom('');
    setFilterUpdatedTo('');
    setFilterApprovalStatus(undefined);
    setSortField(undefined);
    setSortOrder(null);
    setPage(1);
    setReloadToken((t) => t + 1);
  }, []);

  const handleSort = useCallback((key: string, order: 'asc' | 'desc' | null) => {
    if (!order) {
      setSortField(undefined);
      setSortOrder(null);
    } else {
      setSortField(key);
      setSortOrder(order);
    }
    setPage(1);
  }, []);

  const refreshAfterMutation = useCallback(() => {
    setSortField(undefined);
    setSortOrder(null);
    setPage(1);
    setReloadToken((t) => t + 1);
  }, []);

  const openModal = useCallback((mode: 'create' | 'edit', id?: string) => {
    setModalMode(mode);
    setEditingId(id || null);
    setIsModalOpen(true);
  }, []);

  // ── Detail drawer (NavigationChannelDetailContent — 5 tab read-only) ──
  const [detailRecord, setDetailRecord] = useState<NavigationChannelResponse | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const openDetail = useCallback(async (record: NavigationChannelResponse) => {
    setDetailRecord(record);
    setDetailOpen(true);
    try {
      const full = await navigationChannelCRUD.getById(record.id);
      if (full && full.id) {
        setDetailRecord(full);
      }
    } catch {
      // Fallback giữ nguyên summary record nếu API getById lỗi
    }
  }, []);

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    setDetailRecord(null);
    closeEmbeddedAction();
  }, [closeEmbeddedAction]);

  useEffect(() => {
    if (!isEmbeddedAction || !embeddedAction || !embeddedRecordId) return;
    const requestKey = `${embeddedAction}:${embeddedRecordId}`;
    if (embeddedOpenedRef.current === requestKey) return;
    embeddedOpenedRef.current = requestKey;
    if (embeddedAction === 'edit') {
      openModal('edit', embeddedRecordId);
      return;
    }
    void navigationChannelCRUD.getById(embeddedRecordId)
      .then((record) => void openDetail(record))
      .catch(() => {
        embeddedOpenedRef.current = null;
        message.error('Không tải được chi tiết luồng hàng hải');
      });
  }, [embeddedAction, embeddedRecordId, isEmbeddedAction, openDetail, openModal]);

  // Map user id → tên hiển thị cho các cột cán bộ (backend NavigationChannel chưa trả name như các module khác)
  const userMap = useMemo(() => {
    const m = new Map<string, string>();
    userOptions.forEach((o) => { m.set(o.value, o.label); });
    return m;
  }, [userOptions]);

  const [resolvedActorNames, setResolvedActorNames] = useState<Record<string, string>>({});

  const pendingActorIds = useMemo(() => {
    const ids = new Set<string>();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    dataSource.forEach((r) => {
      [
        r.updatedBy,
        r.submittedBy,
        r.approverLevel1,
        r.level1ApprovedBy,
        r.approverLevel2,
        r.level2ApprovedBy,
      ].forEach((id) => {
        if (id && uuidRegex.test(id) && !userMap.has(id) && !resolvedActorNames[id]) {
          ids.add(id);
        }
      });
    });
    return Array.from(ids);
  }, [dataSource, userMap, resolvedActorNames]);

  useEffect(() => {
    if (pendingActorIds.length === 0) return;
    let cancelled = false;
    (async () => {
      const found = await Promise.all(
        pendingActorIds.map(async (id) => {
          try {
            const res = await userService.getById(id);
            const name = res.data?.fullName || res.data?.username;
            return name ? ([id, name] as const) : null;
          } catch {
            return null;
          }
        }),
      );
      if (cancelled) return;
      const patch: Record<string, string> = {};
      found.forEach((entry) => {
        if (entry) {
          patch[entry[0]] = entry[1];
        }
      });
      if (Object.keys(patch).length > 0) {
        setResolvedActorNames((prev) => ({ ...prev, ...patch }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pendingActorIds]);

  const actorName = useCallback(
    (id?: string) => {
      if (!id) return '';
      if (userMap.has(id)) return userMap.get(id);
      if (resolvedActorNames[id]) return resolvedActorNames[id];
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ? '' : id;
    },
    [userMap, resolvedActorNames],
  );

  // ── Delete confirmation (chuẩn /beacon-stations) ────────────────────
  const openDeleteConfirm = useCallback((record: NavigationChannelResponse) => {
    setDeletingRecord(record);
    setDeleteModalOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deletingRecord) return;
    setDeleteLoading(true);
    try {
      await navigationChannelCRUD.delete(deletingRecord.id);
      message.success('Đã xóa luồng hàng hải');
      setDeleteModalOpen(false);
      setDeletingRecord(null);
      refreshAfterMutation();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Xóa thất bại');
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingRecord, refreshAfterMutation]);

  // ── Submit approval (chuẩn /beacon-stations) ────────────────────────
  const openSubmitModal = useCallback((record: NavigationChannelResponse) => {
    setSubmittingRecord(record);
    setSubmitModalOpen(true);
  }, []);

  const confirmSubmit = useCallback(async () => {
    if (!submittingRecord) return;
    try {
      await navigationChannelApproval.submitApproval(submittingRecord.id);
      message.success('Đã gửi duyệt luồng hàng hải');
      setSubmitModalOpen(false);
      setSubmittingRecord(null);
      refreshAfterMutation();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Gửi duyệt thất bại');
    }
  }, [submittingRecord, refreshAfterMutation]);

  // ── Approve (ApprovalModal chuẩn /beacon-stations) ──────────────────
  const openApproveModal = useCallback((record: NavigationChannelResponse, level?: 'c1' | 'c2') => {
    const resolvedLevel: 'c1' | 'c2' = level ?? (record.approvalStatus === 'APPROVED_LEVEL1' ? 'c2' : 'c1');
    setApproveLevel(resolvedLevel);
    setApprovingRecord(record);
    setApproveModalOpen(true);
  }, []);

  const confirmApprove = useCallback(async (content?: string) => {
    if (!approvingRecord) return;
    setApproving(true);
    const isL2 = approveLevel === 'c2' || approvingRecord.approvalStatus === 'APPROVED_LEVEL1';
    try {
      const note = (content && content !== 'Đã phê duyệt') ? content : undefined;
      const req = { status: 'APPROVED' as const, reason: note, note };
      if (isL2) {
        await navigationChannelApproval.approveC2(approvingRecord.id, req);
        message.success('Đã phê duyệt cấp Cục');
      } else {
        await navigationChannelApproval.approveC1(approvingRecord.id, req);
        message.success('Đã phê duyệt cấp Cảng vụ/Chi cục');
      }
      setApproveModalOpen(false);
      setApprovingRecord(null);
      setApproveLevel('c1');
      refreshAfterMutation();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
    } finally {
      setApproving(false);
    }
  }, [approvingRecord, approveLevel, refreshAfterMutation]);

  // ── Reject (chuẩn /beacon-stations) ─────────────────────────────────
  const openRejectModal = useCallback((record: NavigationChannelResponse, level?: 'c1' | 'c2') => {
    const resolvedLevel: 'c1' | 'c2' = level ?? (record.approvalStatus === 'APPROVED_LEVEL1' ? 'c2' : 'c1');
    setRejectLevel(resolvedLevel);
    setRejectingRecord(record);
    setRejectReason('');
    setRejectModalOpen(true);
  }, []);

  const handleReject = useCallback(async () => {
    if (!rejectingRecord) return;
    const reason = rejectReason.trim() || 'Từ chối phê duyệt';
    setRejectLoading(true);
    try {
      const isL2 = rejectLevel === 'c2' || rejectingRecord.approvalStatus === 'APPROVED_LEVEL1';
      const req = { status: 'REJECTED' as const, reason };
      if (isL2) {
        await navigationChannelApproval.rejectLevel2(rejectingRecord.id, req);
      } else {
        await navigationChannelApproval.rejectLevel1(rejectingRecord.id, req);
      }
      message.success(isL2 ? 'Đã từ chối phê duyệt cấp Cục' : 'Đã từ chối phê duyệt cấp Cảng vụ/Chi cục');
      setRejectModalOpen(false);
      setRejectingRecord(null);
      setRejectReason('');
      refreshAfterMutation();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Từ chối thất bại');
    } finally {
      setRejectLoading(false);
    }
  }, [rejectingRecord, rejectReason, rejectLevel, refreshAfterMutation]);

  // ── orgMap / seaportMap cho timeline lịch sử và columns ────────────
  const orgMap = useMemo(() => {
    const m = new Map<string, string>();
    const walk = (nodes: Array<{ id?: string; name?: string; children?: unknown[] }>) => {
      (nodes || []).forEach((n) => {
        if (n?.id && n?.name) m.set(n.id, n.name);
        if (n?.children?.length) walk(n.children as Array<{ id?: string; name?: string; children?: unknown[] }>);
      });
    };
    walk(organizations);
    return m;
  }, [organizations]);

  const seaportMap = useMemo(() => {
    const m = new Map<string, string>();
    seaportOptions.forEach((p) => { m.set(p.id, p.portCode ? `${p.portCode} - ${p.portName || ''}` : p.portName || p.id); });
    return m;
  }, [seaportOptions]);

  // ── History drawer (chuẩn /vts-system) ───────────────────────────
  const handleViewHistory = useCallback((record: NavigationChannelResponse) => {
    if (!hasPerm('navigationchannel:history')) {
      message.error('Bạn không có quyền xem lịch sử');
      return;
    }
    setHistoryTarget(record);
    setHistoryModalOpen(true);
    setHistoryRecords([]);
    setLoadingHistory(false);
    setLoadingMoreHistory(false);
    setHasMoreHistory(true);
    setHistoryFilters({ keyword: '' });
    setHistoryPage(0);
  }, [hasPerm]);

  useEffect(() => {
    if (!historyModalOpen || !historyTarget) return;
    let cancelled = false;
    (async () => {
      setLoadingHistory(true);
      setLoadingMoreHistory(false);
      setHasMoreHistory(true);
      setHistoryRecords([]);
      setHistoryPage(0);
      try {
        const history = await navigationChannelApproval.getHistory(historyTarget.id, 0, HISTORY_PAGE_SIZE, {
          keyword: historyFilters.keyword || undefined,
          fromDate: historyFilters.fromDate || undefined,
          toDate: historyFilters.toDate || undefined,
        });
        if (cancelled) return;
        const items = (history || []) as CommonHistoryEntry[];
        setHistoryRecords(items);
        setHasMoreHistory(items.length === HISTORY_PAGE_SIZE);
      } catch {
        if (!cancelled) message.error('Không thể tải lịch sử thay đổi');
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [historyModalOpen, historyTarget, historyFilters]);

  const loadMoreHistory = async () => {
    if (!historyTarget || loadingHistory || loadingMoreHistory || !hasMoreHistory) return;
    setLoadingMoreHistory(true);
    try {
      const nextPage = historyPage + 1;
      const history = await navigationChannelApproval.getHistory(historyTarget.id, nextPage, HISTORY_PAGE_SIZE, {
        keyword: historyFilters.keyword || undefined,
        fromDate: historyFilters.fromDate || undefined,
        toDate: historyFilters.toDate || undefined,
      });
      if (history && history.length > 0) {
        setHistoryRecords((prev) => [...prev, ...(history as CommonHistoryEntry[])]);
      }
      setHistoryPage(nextPage);
      setHasMoreHistory((history || []).length === HISTORY_PAGE_SIZE);
    } catch { /* ignore */ }
    finally { setLoadingMoreHistory(false); }
  };

  const handleHistoryFilterChange = (filters: { keyword: string; fromDate: string; toDate: string }) => {
    setHistoryFilters({
      keyword: filters.keyword || '',
      fromDate: filters.fromDate || undefined,
      toDate: filters.toDate || undefined,
    });
  };

  const formatChannelHistoryValue = useCallback((fieldName: string, value: unknown) => {
    if (value == null || value === '' || value === 'null' || value === '(null)') return '';
    const sValue = String(value);
    const fn = String(fieldName || '').toLowerCase();
    if (fn === 'conditionstatus' || fn === 'operationalstatus' || fn.includes('tinhtrang')) {
      return CONDITION_STATUS_STYLE_MAP[sValue]?.label || CONDITION_STATUS_MAP[sValue as keyof typeof CONDITION_STATUS_MAP] || sValue;
    }
    if (fn === 'approvalstatus' || fn === 'status') {
      return CHANNEL_APPROVAL_STATUS_LABELS[sValue] || sValue;
    }
    if (fn === 'provinceid' || fn.includes('tinh') || fn.includes('thanhpho')) {
      const num = Number(value);
      if (Number.isFinite(num)) {
        return getProvinceNameById(num) || sValue;
      }
    }
    if (fn === 'seaportid' || fn.includes('cangbien')) {
      return seaportMap.get(sValue) || sValue;
    }
    if (fn === 'unitid' || fn === 'orgunitid' || fn === 'operatingunitid' || fn === 'parentorgunitid') {
      return orgMap.get(sValue) || sValue;
    }
    if (fn === 'mapsymbolid' || fn === 'symbolid' || fn === 'mapiconid') {
      const sym = symbols.find((s) => s.id === sValue || s.code === sValue);
      if (sym) return sym.name;
    }
    if (fn === 'coordinatesystem' || fn === 'coordinatereferencesystem') {
      const sVal = sValue.trim();
      if (sVal === '1' || sVal === '4326' || sVal.toUpperCase() === 'WGS84' || sVal.toUpperCase() === 'WGS 84') return 'WGS 84';
      if (sVal === '2' || sVal.toUpperCase() === 'VN2000' || sVal.toUpperCase() === 'VN-2000') return 'VN-2000';
    }
    if (fn === 'coordinates' || fn === 'toado' || fn.includes('toa do') || fn.includes('tọa độ')) {
      return gisCoordinatesToLines(sValue) || sValue;
    }
    if (fn === 'geometrytype' || fn === 'loaidotuong' || fn.includes('loại đối tượng') || fn.includes('loai doi tuong')) {
      return gisGeometryTypeLabel(sValue) || sValue;
    }
    if (fn.endsWith('date') || fn.endsWith('at') || fn.includes('repairmonth')) {
      if (/^\d{4}-\d{2}-\d{2}/.test(sValue.trim())) {
        return dayjs(sValue).format('DD/MM/YYYY');
      }
    }
    return sValue;
  }, [seaportMap, orgMap, symbols]);

  // ── Helper render text cell with Tooltip (chuẩn /beacon-stations) ───
  const renderCellWithTooltip = (
    text: string | null | undefined,
    isBold?: boolean
  ) => {
    if (!text) return null;
    return (
      <Tooltip title={text} placement="topLeft">
        <span
          style={{
            fontSize: fontSizeMd,
            color: textPrimary,
            fontWeight: isBold ? fontWeightBold : undefined,
            display: 'inline-block',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            verticalAlign: 'middle',
          }}
          title={text}
        >
          {text}
        </span>
      </Tooltip>
    );
  };

  // ── Columns (DS scope: chuẩn 9 cột đồng bộ /beacon-stations) ────────
  const columns: any[] = useMemo(() => {
    const provinceLabel = (provinceId?: number) =>
      provinceId != null ? (VIETNAM_PROVINCE_OPTIONS.find((o) => o.value === String(provinceId))?.label || String(provinceId)) : '';

    return [
      {
        key: 'sequenceNo',
        label: 'STT',
        width: 60,
        align: 'center' as const,
        fixed: 'left' as const,
        render: (_: unknown, __: unknown, idx?: number) => (
          <span style={{ fontSize: fontSizeMd, color: textSecondary }}>
            {(page - 1) * pageSize + (idx ?? 0) + 1}
          </span>
        ),
      },
      {
        key: 'channelName',
        label: 'Tên / Mã luồng hàng hải',
        dataIndex: 'channelName',
        width: 300,
        fixed: 'left' as const,
        sortable: true,
        sortOrder: sortOrderFor('channelName'),
        ellipsis: false,
        cellTitle: (record: NavigationChannelResponse) => record.channelName || '',
        render: (name: string | undefined, record: NavigationChannelResponse) => {
          const canView = hasPerm('navigationchannel:read') || hasPerm('navigationchannel:view');
          return (
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {canView ? (
                <Tooltip title={name || undefined} placement="topLeft">
                  <a
                    title={name}
                    onClick={() => openDetail(record)}
                    style={{
                      ...cellTitleStyle,
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {name || null}
                  </a>
                </Tooltip>
              ) : (
                <Tooltip title={name || undefined} placement="topLeft">
                  <span
                    title={name}
                    style={{
                      ...cellTitleStyle,
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      cursor: 'default',
                    }}
                  >
                    {name || null}
                  </span>
                </Tooltip>
              )}
              {record.channelCode && (
                <Tooltip title={record.channelCode} placement="topLeft">
                  <span
                    style={{
                      ...cellSubtitleStyle,
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={record.channelCode}
                  >
                    {record.channelCode}
                  </span>
                </Tooltip>
              )}
            </div>
          );
        },
      },
      {
        key: 'orgUnitId',
        label: 'Đơn vị quản lý',
        dataIndex: 'orgUnitId',
        width: 300,
        sortable: true,
        sortOrder: sortOrderFor('orgUnitId'),
        cellTitle: (record: NavigationChannelResponse) => record.orgUnitName || (record.orgUnitId ? orgMap.get(record.orgUnitId) : '') || '',
        render: (_: string | undefined, record: NavigationChannelResponse) => {
          const text = record.orgUnitName || (record.orgUnitId ? orgMap.get(record.orgUnitId) : undefined) || '';
          return renderCellWithTooltip(text, true);
        },
      },
      {
        key: 'seaportId',
        label: 'Thuộc cảng biển',
        dataIndex: 'seaportId',
        width: 220,
        ellipsis: true,
        sortable: true,
        sortOrder: sortOrderFor('seaportId'),
        cellTitle: (record: NavigationChannelResponse) => seaportOptions.find((p) => p.id === record.seaportId)?.portName || '',
        render: (v: string | undefined) =>
          renderCellWithTooltip(seaportOptions.find((p) => p.id === v)?.portName || v || null),
      },
      {
        key: 'provinceId',
        label: 'Địa điểm (Tỉnh/TP)',
        dataIndex: 'provinceId',
        width: 230,
        sortable: true,
        sortOrder: sortOrderFor('provinceId'),
        cellTitle: (record: NavigationChannelResponse) => provinceLabel(record.provinceId != null ? Number(record.provinceId) : undefined),
        render: (v: number | undefined) =>
          renderCellWithTooltip(provinceLabel(v != null ? Number(v) : undefined) || null),
      },
      {
        key: 'conditionStatus',
        label: 'Tình trạng',
        dataIndex: 'conditionStatus',
        width: 230,
        sortable: true,
        sortOrder: sortOrderFor('conditionStatus'),
        render: (v: string | undefined) => {
          if (!v) return <span style={{ fontSize: fontSizeMd, color: textTertiary }}></span>;
          const s = CONDITION_STATUS_STYLE_MAP[v] || { label: CONDITION_STATUS_MAP[v as keyof typeof CONDITION_STATUS_MAP] || v, color: textTertiary };
          return <span style={statusBadgeStyle(s.color)}>{s.label}</span>;
        },
      },
      {
        key: 'approvalStatus',
        label: 'Trạng thái',
        dataIndex: 'approvalStatus',
        width: 300,
        sortable: true,
        sortOrder: sortOrderFor('approvalStatus'),
        ellipsis: false,
        render: (v: ApprovalStatus, record: NavigationChannelResponse) => {
          const isArchived = filterApprovalStatus === 'ARCHIVED' || Boolean(record.deletedAt) || (v as string) === 'ARCHIVED' || (v as string) === 'DELETED';
          const eff = isArchived ? ('ARCHIVED' as ApprovalStatus) : v;
          return eff ? <ApprovalStatusBadge status={eff} /> : null;
        },
      },
      {
        key: 'updatedAt',
        label: 'Cán bộ cập nhật',
        dataIndex: 'updatedAt',
        width: 220,
        sortable: true,
        sortOrder: sortOrderFor('updatedAt'),
        ellipsis: false,
        cellTitle: (record: NavigationChannelResponse) => {
          const name = actorName(record.updatedBy);
          return name || '';
        },
        render: (v: string | undefined, record: NavigationChannelResponse) => {
          const name = actorName(record.updatedBy);
          return (
            <div style={{ lineHeight: '1.35', overflow: 'hidden' }}>
              {name ? (
                <Tooltip title={name} placement="topLeft">
                  <div
                    title={name}
                    style={{
                      fontWeight: fontWeightBold,
                      color: textPrimary,
                      fontSize: fontSizeMd,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {name}
                  </div>
                </Tooltip>
              ) : (
                <div style={{ fontWeight: fontWeightBold, color: textPrimary, fontSize: fontSizeMd }}></div>
              )}
              <div style={{ fontSize: fontSizeMd, color: textSecondary, whiteSpace: 'nowrap' }}>
                {v ? dayjs(v).format('DD/MM/YYYY HH:mm:ss') : null}
              </div>
            </div>
          );
        },
      },
      {
        key: 'submittedAt',
        label: 'Cán bộ gửi phê duyệt',
        dataIndex: 'submittedAt',
        width: 220,
        sortable: true,
        sortOrder: sortOrderFor('submittedAt'),
        ellipsis: false,
        cellTitle: (record: NavigationChannelResponse) => {
          const name = actorName(record.submittedBy);
          return name || '';
        },
        render: (v: string | undefined, record: NavigationChannelResponse) => {
          const name = actorName(record.submittedBy);
          const date = v || record.submittedAt;
          return (
            <div style={{ lineHeight: '1.35', overflow: 'hidden' }}>
              {name ? (
                <Tooltip title={name} placement="topLeft">
                  <div
                    title={name}
                    style={{
                      fontWeight: fontWeightBold,
                      color: textPrimary,
                      fontSize: fontSizeMd,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {name}
                  </div>
                </Tooltip>
              ) : (
                <div style={{ fontWeight: fontWeightBold, color: textPrimary, fontSize: fontSizeMd }}></div>
              )}
              <div style={{ fontSize: fontSizeMd, color: textSecondary, whiteSpace: 'nowrap' }}>
                {date ? dayjs(date).format('DD/MM/YYYY HH:mm:ss') : null}
              </div>
            </div>
          );
        },
      },
      {
        key: 'approvedDateLevel1',
        label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục',
        dataIndex: 'approvedDateLevel1',
        width: 340,
        sortable: true,
        sortOrder: sortOrderFor('approvedDateLevel1'),
        ellipsis: false,
        cellTitle: (record: NavigationChannelResponse) => {
          const name = actorName(record.approverLevel1 || record.level1ApprovedBy);
          return name || '';
        },
        render: (v: string | undefined, record: NavigationChannelResponse) => {
          const name = actorName(record.approverLevel1 || record.level1ApprovedBy);
          const date = v || record.approvedDateLevel1 || record.level1ApprovedAt;
          return (
            <div style={{ lineHeight: '1.35', overflow: 'hidden' }}>
              {name ? (
                <Tooltip title={name} placement="topLeft">
                  <div
                    title={name}
                    style={{
                      fontWeight: fontWeightBold,
                      color: textPrimary,
                      fontSize: fontSizeMd,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {name}
                  </div>
                </Tooltip>
              ) : (
                <div style={{ fontWeight: fontWeightBold, color: textPrimary, fontSize: fontSizeMd }}></div>
              )}
              <div style={{ fontSize: fontSizeMd, color: textSecondary, whiteSpace: 'nowrap' }}>
                {date ? dayjs(date).format('DD/MM/YYYY HH:mm:ss') : null}
              </div>
            </div>
          );
        },
      },
      {
        key: 'approvedDateLevel2',
        label: 'Cán bộ phê duyệt cấp Cục',
        dataIndex: 'approvedDateLevel2',
        width: 260,
        sortable: true,
        sortOrder: sortOrderFor('approvedDateLevel2'),
        ellipsis: false,
        cellTitle: (record: NavigationChannelResponse) => {
          const name = actorName(record.approverLevel2 || record.level2ApprovedBy);
          return name || '';
        },
        render: (v: string | undefined, record: NavigationChannelResponse) => {
          const name = actorName(record.approverLevel2 || record.level2ApprovedBy);
          const date = v || record.approvedDateLevel2 || record.level2ApprovedAt;
          return (
            <div style={{ lineHeight: '1.35', overflow: 'hidden' }}>
              {name ? (
                <Tooltip title={name} placement="topLeft">
                  <div
                    title={name}
                    style={{
                      fontWeight: fontWeightBold,
                      color: textPrimary,
                      fontSize: fontSizeMd,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {name}
                  </div>
                </Tooltip>
              ) : (
                <div style={{ fontWeight: fontWeightBold, color: textPrimary, fontSize: fontSizeMd }}></div>
              )}
              <div style={{ fontSize: fontSizeMd, color: textSecondary, whiteSpace: 'nowrap' }}>
                {date ? dayjs(date).format('DD/MM/YYYY HH:mm:ss') : null}
              </div>
            </div>
          );
        },
      },
    ];
  }, [page, pageSize, seaportOptions, openDetail, actorName, orgMap, hasPerm, sortOrderFor, filterApprovalStatus]);

  const rowActions = useCallback(
    (record: NavigationChannelResponse) => {
      const actions: { key: string; label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean }[] = [];
      const st = record.approvalStatus || '';
      const currentUserId = useAuthStore.getState().user?.userId;
      const approver1Id = record.approverLevel1 || record.level1ApprovedBy;
      const isApprover1 = Boolean(approver1Id && currentUserId && String(approver1Id) === String(currentUserId));

      if (hasPerm('navigationchannel:read') || hasPerm('navigationchannel:view')) {
        actions.push({ key: 'view', label: 'Xem chi tiết', icon: icons.view, onClick: () => openDetail(record) });
      }
      if (canEditApprovalRecord(record.approvalStatus, { hasPerm, resource: 'navigationchannel' })) {
        actions.push({ key: 'edit', label: 'Chỉnh sửa', icon: icons.edit, onClick: () => openModal('edit', record.id) });
      }
      if (hasPerm('navigationchannel:history')) {
        actions.push({ key: 'history', label: 'Lịch sử', icon: icons.history, onClick: () => handleViewHistory(record) });
      }
      // Gửi phê duyệt (chuẩn /beacon-stations)
      if (['DRAFT', 'PROPOSED', 'REJECTED_LEVEL1', 'REJECTED_LEVEL2'].includes(st) && (hasPerm('navigationchannel:update') || hasPerm('navigationchannel:create'))) {
        actions.push({ key: 'submit', label: 'Gửi phê duyệt', icon: icons.submit, onClick: () => openSubmitModal(record) });
      }
      // Cấp 1 (Cảng vụ/Chi cục)
      if (hasPerm('navigationchannel:approvec1') && (st === 'PENDING_APPROVAL' || st === 'PROPOSED')) {
        actions.push({
          key: 'approveC1',
          label: 'Phê duyệt cấp Cảng vụ/Chi cục',
          icon: icons.approve,
          onClick: () => openApproveModal(record, 'c1'),
        });
        actions.push({
          key: 'rejectC1',
          label: 'Từ chối cấp Cảng vụ/Chi cục',
          icon: icons.reject,
          danger: true,
          onClick: () => openRejectModal(record, 'c1'),
        });
      }
      // Cấp 2 (Cục) - người duyệt C1 không tự duyệt C2 (4-eyes)
      if (hasPerm('navigationchannel:approvec2') && st === 'APPROVED_LEVEL1' && !isApprover1) {
        actions.push({
          key: 'approveC2',
          label: 'Phê duyệt cấp Cục',
          icon: icons.approve,
          onClick: () => openApproveModal(record, 'c2'),
        });
        actions.push({
          key: 'rejectC2',
          label: 'Từ chối cấp Cục',
          icon: icons.reject,
          danger: true,
          onClick: () => openRejectModal(record, 'c2'),
        });
      }
      // Xóa: đứng cuối cùng theo chuẩn /beacon-stations
      if (canDeleteApprovalRecord(record.approvalStatus, { hasPerm, resource: 'navigationchannel' })) {
        actions.push({ key: 'delete', label: 'Xóa', icon: icons.delete, danger: true, onClick: () => openDeleteConfirm(record) });
      }
      return actions;
    },
    [hasPerm, openModal, openDetail, handleViewHistory, openSubmitModal, openApproveModal, openRejectModal, openDeleteConfirm],
  );

  // ── Filter panel (FilterTableLayout renders the sidebar) ────────────
  const filterContent = (
    <>
      <style>{`
        .channel-page-wrapper .ant-select .ant-select-selector,
        .channel-page-wrapper .ant-tree-select .ant-select-selector,
        .channel-page-wrapper .ant-picker,
        .channel-page-wrapper .ant-input,
        .chk-filter-select.ant-select .ant-select-selector,
        .chk-filter-select.ant-tree-select .ant-select-selector,
        .chk-filter-select.ant-picker,
        .chk-filter-select .ant-select-selector {
          border-radius: 999px !important;
          height: 40px !important;
          display: flex !important;
          align-items: center !important;
        }
      `}</style>
      <div style={{ marginBottom: 12, marginTop: spaceMd }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Đơn vị quản lý</div>
        <FilterOrgUnitTreeSelect
          organizations={organizations}
          placeholder="Tất cả"
          allowClear
          value={filterOrgUnitId}
          onChange={(v) => {
            const nextUnit = (v as string) || '';
            setFilterOrgUnitId(nextUnit || undefined);
            if (nextUnit && nextUnit !== '__all__' && filterSeaportId) {
              const rawSet = resolveOrgSubtreeIds(organizations, nextUnit);
              const normalizedSet = new Set<string>();
              rawSet.forEach((oId) => normalizedSet.add(String(oId).toLowerCase()));
              const valid = seaportOptions.some((p) => p.id === filterSeaportId && !!p.orgUnitId && normalizedSet.has(String(p.orgUnitId).toLowerCase()));
              if (!valid) setFilterSeaportId(undefined);
            }
            setPage(1);
          }}
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tên luồng hàng hải</div>
        <Input
          placeholder="Nhập tên luồng hàng hải"
          allowClear
          value={inputKeyword}
          onChange={(e) => setInputKeyword(e.target.value)}
          onBlur={() => {
            if (typeof inputKeyword === 'string') {
              setInputKeyword((prev) => prev.trim());
            }
          }}
          onPressEnter={handleFilterApply}
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tình trạng</div>
        <Select
          placeholder="Tất cả"
          allowClear
          value={filterConditionStatus}
          onChange={(v) => { setFilterConditionStatus(v); setPage(1); }}
          options={CONDITION_STATUS_OPTIONS}
          style={{ ...selectStyle, width: '100%' }}
        />
      </div>

      {/* ── Bộ lọc nâng cao (ẩn, hiện khi bấm nút Filter) ── */}
      {filterCollapsed && (
        <>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Thuộc cảng biển</div>
            <Select
              placeholder="Tất cả cảng biển"
              allowClear
              showSearch
              filterOption={(input, option) =>
                normalizeSearchText(String(option?.label || '')).includes(normalizeSearchText(input))
              }
              value={filterSeaportId}
              onChange={(v) => { setFilterSeaportId(v); setPage(1); }}
              options={filteredSeaportOptions.map((p) => ({
                value: p.id,
                label: p.portCode ? `${p.portCode} - ${p.portName || ''}` : (p.portName || p.id),
              }))}
              style={{ ...selectStyle, width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Mã luồng hàng hải</div>
            <Input
              placeholder="Nhập mã luồng hàng hải"
              allowClear
              value={inputChannelCode}
              onChange={(e) => setInputChannelCode(e.target.value)}
              onBlur={() => {
                if (typeof inputChannelCode === 'string') {
                  setInputChannelCode((prev) => prev.trim());
                }
              }}
              onPressEnter={handleFilterApply}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Ngày cập nhật</div>
            <DatePicker.RangePicker
              {...getRangePickerProps({
                value: rangeValue(filterUpdatedFrom, filterUpdatedTo),
                onChange: (range: [Dayjs | null, Dayjs | null] | null) => {
                  setFilterUpdatedFrom(range && range[0] ? range[0].format('YYYY-MM-DD 00:00:00') : '');
                  setFilterUpdatedTo(range && range[1] ? range[1].format('YYYY-MM-DD 23:59:59') : '');
                  setPage(1);
                },
              })}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Địa điểm (Tỉnh/Thành phố)</div>
            <Select
              placeholder="Tất cả tỉnh/thành phố"
              allowClear
              showSearch
              filterOption={(input, option) =>
                normalizeSearchText(String(option?.label || '')).includes(normalizeSearchText(input))
              }
              value={filterProvinceId}
              onChange={(v) => { setFilterProvinceId(v); setPage(1); }}
              options={VIETNAM_PROVINCE_OPTIONS}
              style={{ ...selectStyle, width: '100%' }}
            />
          </div>
        </>
      )}
    </>
  );

  const approvalTabsState = useStandardApprovalStatusTabs(
    statusCounts,
    filterApprovalStatus,
    (status) => {
      setFilterApprovalStatus(status);
      setPage(1);
    }
  );
  const statusTabs = approvalTabsState.statusTabs;
  const handleTabChange = approvalTabsState.handleTabChange;

  const headerActions = useMemo(
    () =>
      hasPerm('navigationchannel:create')
        ? [{ key: 'create', label: 'Thêm mới', variant: 'primary' as const, icon: icons.create, onClick: () => openModal('create') }]
        : [],
    [hasPerm, openModal],
  );

  const tableData = useMemo(
    () => dataSource.map((item, idx) => ({ ...item, key: item.id, _rowIndex: (page - 1) * pageSize + idx + 1 })),
    [dataSource, page, pageSize],
  );

  const CHK_FILTER_LABEL = { ...themeTokenChk.filterLabelStyle, fontSize: 13.5 };

  return (
    <ThemeTokenProvider tokens={{ ...themeTokenChk, fontSizeMd: 13.5, filterLabelStyle: CHK_FILTER_LABEL }}>
    <div className="channel-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <style>{`
        .channel-page-wrapper,
        .channel-page-wrapper .ant-input,
        .channel-page-wrapper .ant-table,
        .channel-page-wrapper .ant-table-cell,
        .channel-page-wrapper .ant-table-thead > tr > th,
        .channel-page-wrapper .ant-table-tbody > tr > td,
        .channel-page-wrapper .ant-select,
        .channel-page-wrapper .ant-select-selection-item,
        .channel-page-wrapper .ant-select-item-option-content,
        .channel-page-wrapper .ant-picker,
        .channel-page-wrapper .ant-picker-input > input,
        .channel-page-wrapper .ant-btn,
        .channel-page-wrapper .ant-pagination,
        .channel-page-wrapper .ant-breadcrumb,
        .channel-page-wrapper .ant-form-item-label > label,
        .channel-drawer-scope .ant-input,
        .channel-drawer-scope .ant-select,
        .channel-drawer-scope .ant-select-selection-item,
        .channel-drawer-scope .ant-select-item-option-content,
        .channel-drawer-scope .ant-picker,
        .channel-drawer-scope .ant-picker-input > input,
        .channel-drawer-scope .ant-btn,
        .channel-drawer-scope .ant-table,
        .channel-drawer-scope .ant-table-cell,
        .channel-drawer-scope .ant-pagination,
        .channel-drawer-scope .ant-form-item-label > label {
          font-size: 13.5px !important;
        }
        /* Chuẩn /berth & /beacon-stations — bảng chi tiết 13.5px, label hẹp hơn, nhịp dòng gọn */
        .channel-drawer-scope .chk-detail-tabs .ant-tabs-tab {
          font-size: 13.5px !important;
        }
        .channel-drawer-scope .chk-detail-tabs .ant-table,
        .channel-drawer-scope .chk-detail-tabs .ant-table-cell,
        .channel-drawer-scope .chk-detail-tabs .ant-table-thead > tr > th,
        .channel-drawer-scope .chk-detail-tabs .ant-table-tbody > tr > td {
          font-size: 13.5px !important;
        }
        .channel-drawer-scope .chk-detail-grid {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
          column-gap: 28px !important;
          row-gap: 0 !important;
        }
        .channel-drawer-scope .chk-detail-row {
          display: flex !important;
          align-items: flex-start !important;
          min-height: 36px !important;
          padding: 7px 0 !important;
          border-bottom: 1px solid #f1f5f9 !important;
          line-height: 1.5 !important;
          gap: 10px !important;
        }
        .channel-drawer-scope .chk-detail-row:last-child {
          border-bottom: none !important;
        }
        .channel-drawer-scope .chk-detail-row--full {
          grid-column: 1 / -1 !important;
        }
        .channel-drawer-scope .chk-detail-label {
          width: 215px !important;
          min-width: 215px !important;
          max-width: 215px !important;
          flex-shrink: 0 !important;
          font-weight: 600 !important;
          font-size: 13.5px !important;
          text-align: left !important;
          line-height: 1.5 !important;
        }
        .channel-drawer-scope .sec-col1-label {
          width: 215px !important;
          min-width: 215px !important;
          max-width: 215px !important;
          flex-shrink: 0 !important;
        }
        .channel-drawer-scope .sec-col2-label {
          width: 250px !important;
          min-width: 250px !important;
          max-width: 250px !important;
          flex-shrink: 0 !important;
        }
        .channel-drawer-scope .sec-full-label {
          width: 215px !important;
          min-width: 215px !important;
          max-width: 215px !important;
          flex-shrink: 0 !important;
        }
        .channel-drawer-scope .chk-detail-label::after {
          content: ':' !important;
          margin-left: 1px !important;
          margin-right: 4px !important;
        }
        .channel-drawer-scope .chk-detail-value {
          color: #1e293b !important;
          font-size: 13.5px !important;
          flex: 1 !important;
          min-width: 0 !important;
          text-align: left !important;
          line-height: 1.5 !important;
          word-break: break-word !important;
        }
        @media (max-width: 960px) {
          .channel-drawer-scope .chk-detail-grid {
            grid-template-columns: 1fr !important;
            column-gap: 0 !important;
          }
          .channel-drawer-scope .chk-detail-row--full {
            grid-column: 1 !important;
          }
          .channel-drawer-scope .chk-detail-label,
          .channel-drawer-scope .sec-col1-label,
          .channel-drawer-scope .sec-col2-label,
          .channel-drawer-scope .sec-full-label {
            width: 250px !important;
            min-width: 250px !important;
            max-width: 250px !important;
          }
        }
        @media (max-width: 640px) {
          .channel-drawer-scope .chk-detail-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 3px !important;
            padding: 6px 0 !important;
          }
          .channel-drawer-scope .chk-detail-label,
          .channel-drawer-scope .sec-col1-label,
          .channel-drawer-scope .sec-col2-label,
          .channel-drawer-scope .sec-full-label {
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
          }
          .channel-drawer-scope .chk-detail-value {
            width: 100% !important;
          }
        }
        /* ── Responsive StatusTabs: căn giữa khi đủ chỗ, cuộn ngang khi tràn (khi zoom in) — chuẩn /beacon-stations ── */
        .channel-page-wrapper div:has(> button[aria-pressed]) {
          display: flex !important;
          flex-wrap: nowrap !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          justify-content: safe center !important;
          align-items: center !important;
          scrollbar-width: thin !important;
          scrollbar-color: #cbd5e1 #f8fafc !important;
          scroll-behavior: smooth !important;
          -webkit-overflow-scrolling: touch !important;
          padding: 2px 8px 4px 8px !important;
          gap: clamp(6px, 1vw, 14px) !important;
        }
        .channel-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar {
          height: 4px !important;
          display: block !important;
        }
        .channel-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-track {
          background: #f1f5f9 !important;
          border-radius: 999px !important;
        }
        .channel-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb {
          background: #cbd5e1 !important;
          border-radius: 999px !important;
        }
        .channel-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb:hover {
          background: #94a3b8 !important;
        }
        .channel-page-wrapper div:has(> button[aria-pressed]) > button {
          white-space: nowrap !important;
          flex-shrink: 0 !important;
          cursor: pointer !important;
          padding: 4px 2px !important;
        }
      `}</style>
      <ScreenHeader
        breadcrumb={[{ label: 'Quản lý hàng hải' }, { label: 'Luồng hàng hải' }]}
        actions={headerActions}
      />

      <FilterTableLayout
        filterContent={filterContent}
        statusTabs={statusTabs}
        hideFilterToggle={false}
        onStatusTabChange={handleTabChange}
        onFilterApply={handleFilterApply}
        onFilterReset={handleFilterReset}
        filterCollapsed={filterCollapsed}
        onToggleCollapse={() => setFilterCollapsed(!filterCollapsed)}
        loading={isLoading}
        error={isError}
        onRetry={() => void fetchData()}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
          {/* DataTable render VÔ ĐIỀU KIỆN — empty state dùng tableEmptyState của themetokenchk */}
          <DataTable
            fill
            columns={columns}
            dataSource={tableData}
            rowKey="id"
            rowActions={rowActions}
            onSort={handleSort}
            scroll={{ x: 'max-content' }}
          />
          <div style={{ height: 55, overflow: 'visible', marginBottom: 8 }}>
            <Pagination
              total={total}
              current={page}
              pageSize={pageSize}
              pageSizeOptions={[10, 20, 50]}
              onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
            />
          </div>
        </div>
      </FilterTableLayout>

      <NavigationChannelForm
        open={isModalOpen}
        editId={editingId}
        mode={modalMode}
        onCancel={() => { setIsModalOpen(false); setEditingId(null); closeEmbeddedAction(); }}
        onSuccess={(savedRecord) => {
          setIsModalOpen(false);
          setEditingId(null);
          setFilterApprovalStatus(undefined);
          setInputKeyword('');
          setInputChannelCode('');
          setAppliedKeyword('');
          setAppliedChannelCode('');
          setPage(1);
          setSortField(undefined);
          setSortOrder(null);
          if (savedRecord && savedRecord.id) {
            setDataSource((prev) => {
              const filtered = prev.filter((item) => item.id !== savedRecord.id);
              const now = new Date().toISOString();
              return [{ ...savedRecord, updatedAt: savedRecord.updatedAt || now }, ...filtered];
            });
          }
          refreshAfterMutation();
          closeEmbeddedAction();
        }}
      />

      {/* ── Detail drawer (5 tab read-only — NavigationChannelDetailContent) ── */}
      <AppDrawer
        rootClassName="channel-drawer-scope"
        className="channel-drawer-scope"
        title={
          <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
            {`Chi tiết luồng hàng hải${detailRecord ? ` — ${detailRecord.channelName}` : ''}`}
          </span>
        }
        open={detailOpen}
        destroyOnHidden
        onClose={closeDetail}
        width={DRAWER_WIDTH}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px', overflow: 'hidden' },
        }}
        footer={null}
      >
        {detailRecord && (
          <NavigationChannelDetailContent
            record={detailRecord}
            userMap={userMap}
            orgMap={orgMap}
            seaportMap={seaportMap}
            seaportOptions={seaportOptions}
            symbols={symbols}
            onClose={closeDetail}
          />
        )}
      </AppDrawer>

      {/* ── Delete Confirmation Modal (chuẩn /beacon-stations) ─────── */}
      <DeleteConfirmModal
        open={deleteModalOpen}
        onCancel={() => {
          if (!deleteLoading) {
            setDeleteModalOpen(false);
            setDeletingRecord(null);
          }
        }}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        itemType="luồng hàng hải"
        itemName={deletingRecord?.channelName}
        itemCode={deletingRecord?.channelCode}
      />

      {/* ── Submit Modal (chuẩn /beacon-stations) ──────────────────── */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Xác nhận gửi Cảng vụ phê duyệt</span>}
        open={submitModalOpen}
        onCancel={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }}
        footer={[
          <Button key="cancel" onClick={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="submit" type="primary" onClick={confirmSubmit}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>Xác nhận</Button>,
        ]}
        width={480}>
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary }}>
            Gửi <strong>{submittingRecord?.channelCode ? `${submittingRecord.channelCode} — ` : ''}{submittingRecord?.channelName}</strong> để Cảng vụ phê duyệt?
          </p>
        </div>
      </Modal>

      {/* ── Approve Modal (chuẩn /beacon-stations & ApprovalModal CHK) ── */}
      <ApprovalModal
        visible={approveModalOpen}
        level={approveLevel}
        loading={approving}
        onConfirm={(content) => { void confirmApprove(content); }}
        onCancel={() => { setApproveModalOpen(false); setApprovingRecord(null); setApproveLevel('c1'); }}
      />

      {/* ── Reject Reason Modal (chuẩn /beacon-stations) ──────────── */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Từ chối phê duyệt</span>}
        open={rejectModalOpen}
        onCancel={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); }}
        footer={[
          <Button key="cancel" onClick={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="reject" type="primary" danger loading={rejectLoading} onClick={handleReject}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Xác nhận từ chối</Button>,
        ]}
        width={480}>
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>Vui lòng nhập lý do từ chối cho luồng hàng hải (không bắt buộc):</p>
          {rejectingRecord && (
            <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>
              <strong style={{ color: textPrimary }}>
                {rejectingRecord.channelCode ? `${rejectingRecord.channelCode} — ` : ''}{rejectingRecord.channelName}
              </strong>
            </p>
          )}
          <Input.TextArea
            placeholder="Nhập lý do từ chối (nếu có)..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            style={{ borderRadius: 8, fontSize: fontSizeMd }}
          />
        </div>
      </Modal>

      {/* ── History Drawer (chuẩn /vts-system) ──────────────────── */}
      <CommonHistoryDrawer
        open={historyModalOpen}
        onClose={() => {
          setHistoryModalOpen(false);
          setHistoryTarget(null);
          setHistoryRecords([]);
        }}
        entityName={historyTarget?.channelName || historyTarget?.channelCode}
        records={historyRecords}
        loading={loadingHistory}
        serverFiltered
        onFilterChange={handleHistoryFilterChange}
        onLoadMore={loadMoreHistory}
        loadingMore={loadingMoreHistory}
        variant="berth"
        fieldLabelMap={CHANNEL_HISTORY_FIELD_LABELS}
        formatValue={formatChannelHistoryValue}
      />
    </div>
    </ThemeTokenProvider>
  );
}

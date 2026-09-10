import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Modal, Input, Select, DatePicker } from 'antd';
import DeleteConfirmModal from '../../components/shared/DeleteConfirmModal';
import { aisSystemService } from '../../services/aisSystemService';
import { vtsSystemCRUD } from '../../services/vtsSystemService';
import { vtsOperationCenterService } from '../../services/vtsOperationCenterService';
import { radarStationService } from '../../services/radarStationService';
import { organizationService } from '../../services/organizationService';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../services/operatingOrganizationsData';
import type { AisSystemListItem, AisSystemResponse } from '../../types/aisSystem';
import { UNIT_OF_MEASURE_MAP, UnitOfMeasure } from '../../types/aisSystem';
import { ConditionStatus, ApprovalStatus, CONDITION_STATUS_OPTIONS } from '../../types/vtsSystem';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import { ScreenHeader, DataTable, Pagination } from '../../components/list-view';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import AisSystemForm from './AisSystemForm';
import ApprovalModal from '../../components/shared/ApprovalModal';
import CommonHistoryDrawer, { type CommonHistoryEntry } from '../../components/shared/CommonHistoryDrawer';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import { useStandardApprovalStatusTabs } from '../../components/shared/approvalStatusTabs';
import toast from '../../components/ToastNotification';
import {
  actionPrimary, textSecondary, textTertiary,
  fontWeightBold, fontWeightMedium,
  spaceSm, spaceMd, spaceFormField,
  statusOperational, statusCritical, statusAttention, statusDraft,
  statusBadgeStyle, icons, cellTitleStyle, cellSubtitleStyle,
  textAreaStyle, colors, radiusPill,
  getRangePickerProps,
} from '../../themetokenchk';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import dayjs from 'dayjs';
import { getProvinceNameById, VIETNAM_PROVINCE_OPTIONS } from '../../types/common';
import { OrgUnitTreeSelect, normalizeSearchText, resolveOrgSubtreeIds, type OrgUnitTreeOption } from '../../components/org-unit';
import { canEditApprovalRecord, canDeleteApprovalRecord } from '../../utils/approvalEditPolicy';

const fontSizeMd = 13.5;

const filterLabelStyle: React.CSSProperties = {
  color: colors.sidebarBg,
  fontWeight: fontWeightBold,
  fontSize: fontSizeMd,
  marginBottom: spaceSm,
};

const APPROVAL_STYLE_MAP: Record<string, { color: string; label: string }> = {
  NHAP: { color: statusDraft, label: 'Lưu tạm' },
  DRAFT: { color: statusDraft, label: 'Lưu tạm' },
  PENDING_APPROVAL: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  APPROVED_LEVEL1: { color: statusAttention, label: 'Chờ phê duyệt cấp Cục' },
  APPROVED_LEVEL2: { color: statusAttention, label: 'Chờ phê duyệt cấp Cục' },
  APPROVED: { color: statusOperational, label: 'Đã phê duyệt' },
  DA_PHE_DUYET: { color: statusOperational, label: 'Đã phê duyệt' },
  REJECTED: { color: statusCritical, label: 'Từ chối cấp Cảng vụ/Chi cục' },
  TU_CHOI: { color: statusCritical, label: 'Từ chối cấp Cảng vụ/Chi cục' },
  REJECTED_LEVEL1: { color: statusCritical, label: 'Từ chối cấp Cảng vụ/Chi cục' },
  REJECTED_LEVEL2: { color: statusCritical, label: 'Từ chối cấp Cục' },
};

const CONDITION_STYLE_MAP: Record<string, { color: string; label: string }> = {
  OPERATIONAL: { color: statusOperational, label: 'Đang hoạt động' },
  STOPPED: { color: statusCritical, label: 'Dừng hoạt động' },
  MAINTENANCE: { color: statusAttention, label: 'Đang bảo trì' },
  UNDER_CONSTRUCTION: { color: actionPrimary, label: 'Đang xây dựng' },
  NOT_YET_OPERATIONAL: { color: statusAttention, label: 'Chưa khai thác/vận hành' },
  SUSPENDED: { color: statusCritical, label: 'Dừng khai thác/vận hành' },
};

/** Số bản ghi nhật ký mỗi lần cuộn tải thêm trong drawer lịch sử. */
const HISTORY_PAGE_SIZE = 20;

export function AisSystemList() {
  const [searchParams] = useSearchParams();
  const linkedAction = searchParams.get("action");
  const linkedRecordId = searchParams.get("id");
  const isIframeModal = window.parent !== window.self;
  const isMapLinkedView = isIframeModal && (linkedAction === "edit" || linkedAction === "detail");
  const handledLinkedRecordRef = useRef<string | null>(null);

  const currentUser = useAuthStore((s) => s.user);
  const { hasPermission } = usePermissionStore();
  const hasPerm = useCallback((perm: string) => hasPermission(perm), [hasPermission]);

  const customAisTokens = useMemo(() => ({
    ...themeTokenChk,
    fontSizeMd: 13.5,
  }), []);

  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [dataSource, setDataSource] = useState<AisSystemListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  // Sắp xếp chạy ở server để áp dụng cho toàn bộ kết quả; nếu để antd tự sắp thì
  // chỉ 20 dòng của trang hiện tại được sắp, gây hiểu nhầm là đã sắp cả danh sách.
  const [sortField, setSortField] = useState<string | undefined>();
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  // Khóa bộ lọc đã dùng cho lần đếm gần nhất — dùng để bỏ truy vấn đếm khi chỉ
  // lật trang hoặc đổi cột sắp xếp.
  const statusCountFilterKey = useRef<string | null>(null);
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<ApprovalStatus | undefined>(undefined);
  const [filterValues, setFilterValues] = useState<{
    name?: string;
    code?: string;
    orgUnitId?: string;
    vtsOperationCenterId?: string;
    operatingOrgId?: string;
    provinceId?: number;
    commissioningYear?: number;
    conditionStatus?: ConditionStatus;
    approvalStatus?: ApprovalStatus;
    updateDateRange?: [dayjs.Dayjs | null, dayjs.Dayjs | null];
  }>({});
  const [appliedFilterValues, setAppliedFilterValues] = useState<typeof filterValues>({});
  const [filterCollapsed, setFilterCollapsed] = useState(false);

  const [orgUnitOptions, setOrgUnitOptions] = useState<OrgUnitTreeOption[]>([]);
  const [operatingOrganizations, setOperatingOrganizations] = useState<any[]>(DEFAULT_OPERATING_ORGANIZATIONS);
  const [opCenters, setOpCenters] = useState<{ id: string; name: string; orgUnitId?: string }[]>([]);
  const [radarStations, setRadarStations] = useState<{ id: string; name: string; orgUnitId?: string }[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'detail'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<AisSystemResponse | null>(null);

  useEffect(() => {
    if (!isMapLinkedView || !linkedRecordId || !linkedAction) return;

    const requestKey = `${linkedAction}:${linkedRecordId}`;
    if (handledLinkedRecordRef.current === requestKey) return;
    handledLinkedRecordRef.current = requestKey;

    let active = true;
    void aisSystemService.getById(linkedRecordId)
      .then((record) => {
        if (!active) return;
        if (linkedAction === "edit") {
          setEditingId(record.id);
          setSelectedRecord(record as any);
          setModalMode('edit');
          setIsModalOpen(true);
        } else {
          setEditingId(record.id);
          setSelectedRecord(record as any);
          setModalMode('detail');
          setIsModalOpen(true);
        }
      })
      .catch(() => {
        if (!active) return;
        handledLinkedRecordRef.current = null;
        toast.error("Không thể tải dữ liệu AIS");
      });

    return () => {
      active = false;
    };
  }, [isMapLinkedView, linkedAction, linkedRecordId]);

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  // Số trang nhật ký đã tải. Không suy ra từ `historyRecords.length` vì backend có
  // thể trả ít hơn pageSize khi lọc, làm lệch số trang → sót/lặp bản ghi.
  const [historyPage, setHistoryPage] = useState(0);
  const [historyTargetId, setHistoryTargetId] = useState<string | null>(null);
  const [historyFilters, setHistoryFilters] = useState<{ keyword: string; fromDate?: string; toDate?: string }>(
    { keyword: '' },
  );

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveLevel, setApproveLevel] = useState<'c1' | 'c2'>('c1');
  const [actionTargetRecord, setActionTargetRecord] = useState<AisSystemListItem | null>(null);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const loadReferenceData = useCallback(async () => {
    try {
      const [orgRes, opRes, radarRes, operatingRes] = await Promise.allSettled([
        organizationService.getAll(),
        vtsOperationCenterService.getOptions(),
        radarStationService.getOptions(),
        vtsSystemCRUD.getOperatingOrganizationOptions(),
      ]);

      if (orgRes.status === 'fulfilled' && Array.isArray(orgRes.value)) {
        setOrgUnitOptions(orgRes.value);
      }
      if (opRes.status === 'fulfilled' && Array.isArray(opRes.value)) {
        setOpCenters(opRes.value.map((item: any) => ({
          id: item.id,
          name: item.name,
          orgUnitId: item.orgUnitId || item.managementUnitId || item.operatingUnitId,
        })));
      }
      if (radarRes.status === 'fulfilled' && Array.isArray(radarRes.value)) {
        setRadarStations(radarRes.value.map((item: any) => ({
          id: item.id,
          name: item.name,
          orgUnitId: item.orgUnitId || item.managementUnitId || item.operatingUnitId,
        })));
      }
      if (operatingRes.status === 'fulfilled' && Array.isArray(operatingRes.value)) {
        setOperatingOrganizations(operatingRes.value);
      }
    } catch {
      // Ignored
    }
  }, []);

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  const operatingUnitOptions = useMemo(() => {
    const seen = new Set<string>();
    const list: { value: string; label: string }[] = [];

    if (Array.isArray(orgUnitOptions)) {
      orgUnitOptions.forEach((o) => {
        if (o.id && o.name && !seen.has(String(o.id))) {
          seen.add(String(o.id));
          list.push({ value: String(o.id), label: o.code ? `${o.code} - ${o.name}` : o.name });
        }
      });
    }

    if (Array.isArray(operatingOrganizations)) {
      operatingOrganizations.forEach((o) => {
        if (o.id && o.name && !seen.has(String(o.id))) {
          seen.add(String(o.id));
          list.push({ value: String(o.id), label: o.code ? `${o.code} - ${o.name}` : o.name });
        }
      });
    }

    return list;
  }, [orgUnitOptions, operatingOrganizations]);

  const filteredOpCenters = useMemo(() => {
    if (!filterValues.orgUnitId) return opCenters;
    const allowedIds = resolveOrgSubtreeIds(orgUnitOptions, filterValues.orgUnitId);
    return opCenters.filter((c) => !c.orgUnitId || allowedIds.has(c.orgUnitId));
  }, [opCenters, filterValues.orgUnitId, orgUnitOptions]);

  const filteredRadarStations = useMemo(() => {
    if (!filterValues.orgUnitId) return radarStations;
    const allowedIds = resolveOrgSubtreeIds(orgUnitOptions, filterValues.orgUnitId);
    return radarStations.filter((r) => !r.orgUnitId || allowedIds.has(r.orgUnitId));
  }, [radarStations, filterValues.orgUnitId, orgUnitOptions]);

  const combinedLocationOptions = useMemo(() => [
    {
      label: 'Trung tâm điều hành VTS',
      options: filteredOpCenters.map((c) => ({ value: `op_${c.id}`, rawId: c.id, type: 'op', label: c.name })),
    },
    {
      label: 'Trạm Radar',
      options: filteredRadarStations.map((r) => ({ value: `radar_${r.id}`, rawId: r.id, type: 'radar', label: r.name })),
    },
  ], [filteredOpCenters, filteredRadarStations]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setIsError(false);
    setErrorMessage('');
    try {
      let filterOpCenterId: string | undefined = undefined;
      let filterRadarStationId: string | undefined = undefined;
      if (appliedFilterValues.vtsOperationCenterId) {
        if (appliedFilterValues.vtsOperationCenterId.startsWith('op_')) {
          filterOpCenterId = appliedFilterValues.vtsOperationCenterId.replace('op_', '');
        } else if (appliedFilterValues.vtsOperationCenterId.startsWith('radar_')) {
          filterRadarStationId = appliedFilterValues.vtsOperationCenterId.replace('radar_', '');
        } else {
          filterOpCenterId = appliedFilterValues.vtsOperationCenterId;
        }
      }
      let updatedFrom: string | undefined = undefined;
      let updatedTo: string | undefined = undefined;
      // Backend nhận LocalDateTime và BỎ QUA offset, nên `toISOString()` (giờ UTC)
      // làm cửa sổ lọc lệch đúng bằng chênh lệch múi giờ (VN: -7h): hồ sơ cập nhật
      // sau 17h bị đẩy nhầm sang ngày hôm sau. Gửi thẳng giờ địa phương.
      if (appliedFilterValues.updateDateRange && appliedFilterValues.updateDateRange[0]) {
        updatedFrom = appliedFilterValues.updateDateRange[0].startOf('day').format('YYYY-MM-DDTHH:mm:ss');
      }
      if (appliedFilterValues.updateDateRange && appliedFilterValues.updateDateRange[1]) {
        updatedTo = appliedFilterValues.updateDateRange[1].endOf('day').format('YYYY-MM-DDTHH:mm:ss');
      }

      // Số trên tab tính cho MỌI trạng thái phê duyệt, nên đổi tab không được làm
      // thay đổi phạm vi đếm — khóa này chỉ gồm các bộ lọc còn lại.
      const currentStatusCountFilterKey = JSON.stringify([
        appliedFilterValues.name, appliedFilterValues.code,
        appliedFilterValues.orgUnitId, filterOpCenterId, filterRadarStationId,
        appliedFilterValues.operatingOrgId, appliedFilterValues.provinceId,
        appliedFilterValues.commissioningYear, appliedFilterValues.conditionStatus,
        updatedFrom, updatedTo,
      ]);
      const shouldIncludeCounts = statusCountFilterKey.current !== currentStatusCountFilterKey;

      const res = await aisSystemService.search({
        name: appliedFilterValues.name?.trim() || undefined,
        code: appliedFilterValues.code?.trim() || undefined,
        orgUnitId: appliedFilterValues.orgUnitId || undefined,
        vtsOperationCenterId: filterOpCenterId,
        radarStationId: filterRadarStationId,
        operatingOrgId: appliedFilterValues.operatingOrgId || undefined,
        provinceId: appliedFilterValues.provinceId,
        commissioningYear: appliedFilterValues.commissioningYear,
        conditionStatus: appliedFilterValues.conditionStatus || undefined,
        approvalStatus: filterApprovalStatus,
        updatedFrom,
        updatedTo,
        page,
        size: pageSize,
        sortBy: sortField,
        sortDir: sortField ? sortDirection.toUpperCase() : undefined,
        // Chỉ yêu cầu backend đếm lại khi bộ lọc đổi; lật trang hay đổi sắp xếp
        // không làm thay đổi số trên tab nên bỏ được truy vấn GROUP BY.
        includeCounts: shouldIncludeCounts,
      });

      setDataSource(res.items || []);
      setTotal(res.total || 0);
      if (shouldIncludeCounts) {
        setStatusCounts(res.statusCounts || {});
        statusCountFilterKey.current = currentStatusCountFilterKey;
      }
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err?.message || 'Không thể tải danh sách hệ thống AIS');
      toast.error('Không thể tải danh sách hệ thống AIS');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, appliedFilterValues, filterApprovalStatus, sortField, sortDirection]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = useCallback((field: string, order: 'asc' | 'desc') => {
    setSortField(field);
    setSortDirection(order);
    setPage(1);
  }, []);

  const sortOrderFor = (key: string): 'ascend' | 'descend' | null =>
    (sortField === key ? (sortDirection === 'asc' ? 'ascend' : 'descend') : null);

  // Bộ so sánh trung tính: thứ tự do server quyết định, hàm này chỉ để antd hiện
  // biểu tượng sắp xếp mà không tự sắp lại 20 dòng của trang hiện tại.
  const serverSideSorter = () => 0;

  const refreshList = useCallback(() => {
    // Sau khi tạo/duyệt/xóa thì số trên tab đã đổi — buộc đếm lại.
    statusCountFilterKey.current = null;
    fetchData();
  }, [fetchData]);

  const { statusTabs, handleTabChange } = useStandardApprovalStatusTabs(
    statusCounts,
    filterApprovalStatus,
    (status) => {
      setFilterApprovalStatus(status);
      setPage(1);
    }
  );

  const handleFilterReset = () => {
    setPage(1);
    setFilterValues({});
    setAppliedFilterValues({});
    setFilterApprovalStatus(undefined);
  };

  const handleViewHistory = (record: AisSystemListItem) => {
    setSelectedRecord(record as any);
    setHistoryTargetId(record.id);
    setHistoryModalOpen(true);
    setHistoryRecords([]);
    setLoadingHistory(false);
    setLoadingMoreHistory(false);
    setHasMoreHistory(true);
    setHistoryPage(0);
    setHistoryFilters({ keyword: '' });
  };

  // Nạp lại trang đầu mỗi khi mở drawer hoặc đổi điều kiện lọc. Lọc chạy ở server
  // nên ô tìm kiếm quét đúng toàn bộ nhật ký, không riêng phần đã tải.
  useEffect(() => {
    if (!historyModalOpen || !historyTargetId) return;
    let cancelled = false;
    (async () => {
      setLoadingHistory(true);
      setLoadingMoreHistory(false);
      setHasMoreHistory(true);
      setHistoryRecords([]);
      setHistoryPage(0);
      try {
        const records = await aisSystemService.getHistory(historyTargetId, 0, HISTORY_PAGE_SIZE, {
          keyword: historyFilters.keyword || undefined,
          fromDate: historyFilters.fromDate || undefined,
          toDate: historyFilters.toDate || undefined,
        });
        if (cancelled) return;
        const items = records || [];
        setHistoryRecords(items);
        setHasMoreHistory(items.length === HISTORY_PAGE_SIZE);
      } catch {
        if (!cancelled) toast.error('Không thể tải lịch sử thay đổi');
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();
    return () => { cancelled = true; };
  }, [historyModalOpen, historyTargetId, historyFilters]);

  const loadMoreHistory = useCallback(async () => {
    if (!historyTargetId || loadingHistory || loadingMoreHistory || !hasMoreHistory) return;
    setLoadingMoreHistory(true);
    try {
      const nextPage = historyPage + 1;
      const records = await aisSystemService.getHistory(historyTargetId, nextPage, HISTORY_PAGE_SIZE, {
        keyword: historyFilters.keyword || undefined,
        fromDate: historyFilters.fromDate || undefined,
        toDate: historyFilters.toDate || undefined,
      });
      if (records && records.length > 0) {
        setHistoryRecords((prev) => [...prev, ...records]);
      }
      setHistoryPage(nextPage);
      setHasMoreHistory((records || []).length === HISTORY_PAGE_SIZE);
    } catch { /* giữ nguyên phần đã tải, người dùng cuộn lại sẽ thử tiếp */ }
    finally { setLoadingMoreHistory(false); }
  }, [historyTargetId, loadingHistory, loadingMoreHistory, hasMoreHistory, historyPage, historyFilters]);

  const handleHistoryFilterChange = (filters: { keyword: string; fromDate?: string; toDate?: string }) => {
    setHistoryFilters({
      keyword: filters.keyword || '',
      fromDate: filters.fromDate || undefined,
      toDate: filters.toDate || undefined,
    });
  };

  // ── Delete confirmation modal (Chuẩn Bến cảng) ───────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<AisSystemListItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openDeleteModal = (record: AisSystemListItem) => {
    setDeletingRecord(record);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingRecord) return;
    setDeleteLoading(true);
    try {
      await aisSystemService.delete(deletingRecord.id);
      toast.success('Đã xóa hệ thống AIS');
      setDeleteModalOpen(false);
      setDeletingRecord(null);
      refreshList();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Xóa thất bại');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openApprove = (record: AisSystemListItem, level: 'c1' | 'c2') => {
    setActionTargetRecord(record);
    setApproveLevel(level);
    setApproveModalOpen(true);
  };

  const handleApprove = async (reason?: string) => {
    if (!actionTargetRecord) return;
    try {
      if (approveLevel === 'c1') {
        const res = await aisSystemService.approveC1(actionTargetRecord.id, 'APPROVED', reason);
        toast.success(res?.message || 'Phê duyệt cấp Cảng vụ/Chi cục thành công');
      } else {
        const res = await aisSystemService.approveC2(actionTargetRecord.id, 'APPROVED', reason);
        toast.success(res?.message || 'Phê duyệt cấp Cục thành công');
      }
      setApproveModalOpen(false);
      setActionTargetRecord(null);
      refreshList();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Phê duyệt thất bại');
    }
  };

  const openReject = (record: AisSystemListItem) => {
    setActionTargetRecord(record);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!actionTargetRecord) return;
    // approval-2-level-spec §3.4 (quy tắc 5): lý do từ chối tối thiểu 10 ký tự.
    if (!rejectReason.trim() || rejectReason.trim().length < 10) {
      toast.warning('Lý do từ chối phải có ít nhất 10 ký tự');
      return;
    }
    try {
      const res = await aisSystemService.reject(actionTargetRecord.id, rejectReason.trim());
      toast.success(res?.message || 'Từ chối phê duyệt hồ sơ thành công');
      setRejectModalOpen(false);
      setActionTargetRecord(null);
      refreshList();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Từ chối thất bại');
    }
  };

  const isRejectedTab = filterApprovalStatus === ApprovalStatus.REJECTED_LEVEL1 || filterApprovalStatus === ApprovalStatus.REJECTED_LEVEL2;

  const columns = useMemo(() => [
    {
      key: 'stt',
      label: 'STT',
      width: 60,
      align: 'center' as const,
      fixed: 'left' as const,
      render: (_: any, __: any, index: number) => (
        <span style={{ fontSize: fontSizeMd }}>{(page - 1) * pageSize + index + 1}</span>
      ),
    },
    {
      key: 'name',
      label: 'Tên/Mã hệ thống AIS',
      dataIndex: 'name',
      width: 260,
      fixed: 'left' as const,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('name'),
      render: (val: string, record: AisSystemListItem) => (
        <div>
          <a
            title={val}
            onClick={() => {
              setEditingId(record.id);
              setSelectedRecord(record as any);
              setModalMode('detail');
              setIsModalOpen(true);
            }}
            style={{ ...cellTitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {val || '—'}
          </a>
          <span
            title={record.code}
            style={{ ...cellSubtitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {record.code || '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'orgUnitName',
      label: 'Đơn vị quản lý',
      dataIndex: 'orgUnitName',
      width: 240,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('orgUnitName'),
      render: (v: string) => (
        <span style={{ fontWeight: fontWeightBold }} title={v}>{v || '—'}</span>
      ),
    },
    {
      key: 'vtsOperationCenterName',
      label: 'Thuộc TTDH VTS / Trạm Radar',
      dataIndex: 'vtsOperationCenterName',
      width: 290,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('vtsOperationCenterName'),
      render: (_: any, record: AisSystemListItem) => {
        const val = record.attachedLocationName || record.vtsOperationCenterName || record.radarStationName || '—';
        return <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={val}>{val}</div>;
      },
    },
    {
      key: 'operatingOrgName',
      label: 'Đơn vị khai thác',
      dataIndex: 'operatingOrgName',
      width: 200,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('operatingOrgName'),
      render: (v: string, record: AisSystemListItem) => {
        const val = v || record.operatingOrgName || operatingUnitOptions.find((o) => o.value === String(record.operatingOrgId))?.label || DEFAULT_OPERATING_ORGANIZATIONS.find((o) => o.id === record.operatingOrgId)?.name || '—';
        return <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={val}>{val}</div>;
      },
    },
    {
      key: 'province',
      label: 'Địa điểm (Tỉnh/Thành phố)',
      dataIndex: 'provinceId',
      width: 200,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('provinceId'),
      render: (_: any, r: AisSystemListItem) => {
        const val = r.provinceName || getProvinceNameById(r.provinceId) || '—';
        return <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={val}>{val}</div>;
      },
    },
    {
      key: 'unitOfMeasure',
      label: 'Đơn vị tính',
      dataIndex: 'unitOfMeasure',
      width: 130,
      align: 'center' as const,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('unitOfMeasure'),
      render: (v: string) => {
        const label = UNIT_OF_MEASURE_MAP[v as unknown as UnitOfMeasure] || v || '—';
        return <span style={{ fontWeight: fontWeightMedium }}>{label}</span>;
      },
    },
    {
      key: 'quantity',
      label: 'Số lượng',
      dataIndex: 'quantity',
      width: 110,
      align: 'center' as const,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('quantity'),
      render: (v: number) => <span style={{ fontWeight: fontWeightBold }}>{v ?? 1}</span>,
    },
    {
      key: 'commissioningYear',
      label: 'Năm đưa vào sử dụng',
      dataIndex: 'commissioningYear',
      width: 170,
      align: 'center' as const,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('commissioningYear'),
      render: (v: number) => <span>{v || '—'}</span>,
    },
    {
      key: 'conditionStatus',
      label: 'Tình trạng',
      dataIndex: 'conditionStatus',
      width: 160,
      align: 'left' as const,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('conditionStatus'),
      render: (val: ConditionStatus | string) => {
        const s = CONDITION_STYLE_MAP[val] || { color: textTertiary, label: val || '—' };
        return <span style={statusBadgeStyle(s.color)}>{s.label}</span>;
      },
    },
    {
      key: 'approvalStatus',
      label: 'Trạng thái',
      dataIndex: 'approvalStatus',
      width: 280,
      align: 'left' as const,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('approvalStatus'),
      render: (val: ApprovalStatus | string) => <ApprovalStatusBadge status={val as ApprovalStatus} />,
    },
    {
      key: 'rejectionReason',
      label: 'Lý do từ chối',
      dataIndex: 'rejectionReason',
      width: 260,
      hidden: !isRejectedTab,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('rejectionReason'),
      render: (val: string) => (
        <span title={val || ''} style={{ color: textSecondary }}>{val || '—'}</span>
      ),
    },
    {
      key: 'updatedByName',
      label: 'Cán bộ cập nhật',
      dataIndex: 'updatedByName',
      width: 220,
      align: 'left' as const,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('updatedByName'),
      render: (val: string, record: AisSystemListItem) => {
        const name = val || record.updatedByName || record.createdByName || '—';
        const date = record.updatedAt || record.createdAt;
        return (
          <div style={{ lineHeight: '1.35', overflow: 'hidden' }}>
            <div
              title={name}
              style={{
                fontWeight: fontWeightBold,
                color: '#0F172A',
                fontSize: fontSizeMd,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {name}
            </div>
            <div style={{ fontSize: fontSizeMd, color: textSecondary, whiteSpace: 'nowrap' }}>
              {date ? dayjs(date).format('DD/MM/YYYY HH:mm:ss') : '—'}
            </div>
          </div>
        );
      },
    },
  ], [page, pageSize, isRejectedTab, operatingUnitOptions, sortField, sortDirection]);

  const rowActions = (record: AisSystemListItem) => {
    const uid = currentUser?.userId || currentUser?.id;
    const isCreator = Boolean(uid && (record.createdBy === uid || (record as any).userId === uid));
    const isApproverL1 = Boolean(uid && ((record as any).approverLevel1 === uid || (record as any).approverLevel1Name === currentUser?.fullName));
    const userUnitType = currentUser?.unitType || '';
    const isAdmin = (currentUser as any)?.role === 'SUPER_ADMIN' || (currentUser as any)?.role === 'ADMIN' || (currentUser as any)?.roleName === 'SUPER_ADMIN' || (currentUser as any)?.roleName === 'ADMIN';
    const isCucLevel = !userUnitType || userUnitType === 'CHUYEN_VIEN_CUC' || userUnitType === 'LANH_DAO_CUC' || userUnitType === 'CUC' || userUnitType === 'CUC_HANG_HAI' || isAdmin;

    const actions: any[] = [
      {
        key: 'detail',
        label: 'Xem chi tiết',
        icon: icons.view,
        onClick: () => {
          setEditingId(record.id);
          setSelectedRecord(record as any);
          setModalMode('detail');
          setIsModalOpen(true);
        },
      },
    ];

    if (canEditApprovalRecord(record.approvalStatus, { hasPerm, resource: 'aissystem' })) {
      actions.push({
        key: 'edit',
        label: 'Chỉnh sửa',
        icon: icons.edit,
        onClick: () => {
          setEditingId(record.id);
          setSelectedRecord(record as any);
          setModalMode('edit');
          setIsModalOpen(true);
        },
      });
    }

    if (hasPerm('aissystem:history')) {
      actions.push({
        key: 'history',
        label: 'Lịch sử',
        icon: icons.history,
        onClick: () => handleViewHistory(record),
      });
    }

    if (hasPerm('aissystem:update') && (record.approvalStatus === ApprovalStatus.DRAFT || record.approvalStatus === ApprovalStatus.REJECTED_LEVEL1 || record.approvalStatus === ApprovalStatus.REJECTED_LEVEL2)) {
      actions.push({
        key: 'submit',
        label: 'Gửi duyệt',
        icon: icons.submit,
        onClick: async () => {
          try {
            const res = await aisSystemService.submit(record.id);
            toast.success(res?.message || 'Gửi phê duyệt thành công');
            refreshList();
          } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || 'Lỗi gửi duyệt');
          }
        },
      });
    }

    if ((hasPerm('aissystem:approvec1') || hasPerm('data:approvec1') || hasPerm('data:approve') || isAdmin) && record.approvalStatus === ApprovalStatus.PENDING_APPROVAL && (!isCreator || isCucLevel || isAdmin)) {
      actions.push({
        key: 'approve_c1',
        label: 'Phê duyệt cấp Cảng vụ/Chi cục',
        icon: icons.approve,
        onClick: () => openApprove(record, 'c1'),
      });
      actions.push({
        key: 'reject_c1',
        label: 'Từ chối cấp Cảng vụ/Chi cục',
        icon: icons.reject,
        danger: true,
        onClick: () => openReject(record),
      });
    }

    if ((hasPerm('aissystem:approvec2') || hasPerm('data:approvec2') || hasPerm('data:approve') || isAdmin || isCucLevel) && record.approvalStatus === ApprovalStatus.APPROVED_LEVEL1 && (!isApproverL1 || isCucLevel || isAdmin)) {
      actions.push({
        key: 'approve_c2',
        label: 'Phê duyệt cấp Cục',
        icon: icons.approve,
        onClick: () => openApprove(record, 'c2'),
      });
      actions.push({
        key: 'reject_c2',
        label: 'Từ chối cấp Cục',
        icon: icons.reject,
        danger: true,
        onClick: () => openReject(record),
      });
    }

    if (canDeleteApprovalRecord(record.approvalStatus, { hasPerm, resource: 'aissystem' })) {
      actions.push({
        key: 'delete',
        label: 'Xóa',
        icon: icons.delete,
        danger: true,
        onClick: () => openDeleteModal(record),
      });
    }

    return actions;
  };

  return (
    <ThemeTokenProvider tokens={customAisTokens}>
      <div className="ais-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <style>{`
          /* ── Cỡ chữ 13.5px chuẩn toàn màn Hệ thống AIS & filter sidebar ── */
          .ais-page-wrapper,
          .ais-page-wrapper .ant-table,
          .ais-page-wrapper .ant-table-cell,
          .ais-page-wrapper .ant-table-thead > tr > th,
          .ais-page-wrapper .ant-table-tbody > tr > td,
          .ais-page-wrapper .ant-input,
          .ais-page-wrapper .ant-select,
          .ais-page-wrapper .ant-select-selector,
          .ais-page-wrapper .ant-select-selection-item,
          .ais-page-wrapper .ant-select-selection-placeholder,
          .ais-page-wrapper .ant-select-selection-search-input,
          .ais-page-wrapper .ant-select-item-option-content,
          .ais-page-wrapper .ant-tree-select,
          .ais-page-wrapper .ant-tree-select .ant-select-selection-item,
          .ais-page-wrapper .ant-tree-select .ant-select-selection-placeholder,
          .ais-page-wrapper .ant-picker,
          .ais-page-wrapper .ant-picker-input > input,
          .ais-page-wrapper .ant-picker-range-separator,
          .ais-page-wrapper .ant-btn,
          .ais-page-wrapper .ant-pagination,
          .ais-page-wrapper .ant-pagination-item,
          .ais-page-wrapper .ant-pagination-total-text,
          .ais-page-wrapper .ant-breadcrumb,
          .ais-page-wrapper .ant-form-item-label > label,
          .ais-page-wrapper input::placeholder,
          .ais-page-wrapper .ant-picker-input > input::placeholder,
          .ais-drawer-scope,
          .ais-drawer-scope .ant-drawer-content,
          .ais-drawer-scope .ant-tabs-tab,
          .ais-drawer-scope .chk-detail-label,
          .ais-drawer-scope .chk-detail-value,
          .ais-drawer-scope .ant-table,
          .ais-drawer-scope .ant-table-cell,
          .ais-drawer-scope .ant-table-thead > tr > th,
          .ais-drawer-scope .ant-btn,
          .ais-drawer-scope .ant-select,
          .ais-drawer-scope .ant-input,
          .ais-drawer-scope .ant-form-item-label > label {
            font-size: 13.5px !important;
          }

          /* ── Responsive StatusTabs: Căn giữa khi đủ chỗ, thanh cuộn ngang khi tràn màn hình ── */
          .ais-page-wrapper div:has(> button[aria-pressed]) {
            display: flex !important;
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            justify-content: center !important;
            justify-content: safe center !important;
            align-items: center !important;
            scrollbar-width: thin !important;
            scrollbar-color: #cbd5e1 #f8fafc !important;
            scroll-behavior: smooth !important;
            -webkit-overflow-scrolling: touch !important;
            padding: 2px 16px 6px 16px !important;
            gap: 20px !important;
          }
          .ais-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar {
            height: 6px !important;
            display: block !important;
          }
          .ais-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-track {
            background: #f1f5f9 !important;
            border-radius: 999px !important;
          }
          .ais-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb {
            background: #cbd5e1 !important;
            border-radius: 999px !important;
          }
          .ais-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb:hover {
            background: #94a3b8 !important;
          }
          .ais-page-wrapper div:has(> button[aria-pressed]) > button {
            white-space: nowrap !important;
            flex-shrink: 0 !important;
            cursor: pointer !important;
          }

          /* ── Responsive ScreenHeader co dãn đẹp khi zoom ── */
          .ais-page-wrapper > div:first-of-type {
            flex-wrap: wrap !important;
            gap: 10px !important;
          }

          /* ── Responsive Drawers: Không tràn viền khi màn hình nhỏ / zoom cao ── */
          .ais-drawer-scope .ant-drawer-content-wrapper {
            max-width: 100vw !important;
          }
          @media (max-width: 1024px) {
            .ais-drawer-scope .chk-detail-grid {
              grid-template-columns: 1fr !important;
              column-gap: 0 !important;
            }
            .ais-drawer-scope .chk-detail-row--full {
              grid-column: 1 !important;
            }
          }
          @media (max-width: 640px) {
            .ais-drawer-scope .chk-detail-row {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 4px !important;
              padding: 8px 0 !important;
            }
            .ais-drawer-scope .chk-detail-label {
              width: 100% !important;
            }
            .ais-drawer-scope .chk-detail-value {
              width: 100% !important;
            }
          }
        `}</style>
        <ScreenHeader
          breadcrumb={[
            { label: 'Tài sản KCHTGT' },
            { label: 'Hệ thống trạm bờ AIS' },
          ]}
          actions={
            hasPerm('aissystem:create')
              ? [{
                key: 'create', label: 'Thêm mới', variant: 'primary' as const, icon: icons.create,
                onClick: () => { setEditingId(null); setSelectedRecord(null); setModalMode('create'); setIsModalOpen(true); }
              }]
              : []
          }
        />
        <FilterTableLayout
          filterCollapsed={filterCollapsed}
          onToggleCollapse={() => setFilterCollapsed((value) => !value)}
          onFilterApply={() => handleFilterSearch(filterValues)}
          onFilterReset={handleFilterReset}
          loading={loading}
          error={isError}
          errorMessage={errorMessage}
          onRetry={refreshList}
          statusTabs={statusTabs}
          onStatusTabChange={handleTabChange}
          filterContent={
            <>
              {/* ── BỘ LỌC CƠ BẢN (LUÔN HIỂN THỊ) — Chuẩn VTS / Bến cảng: 1. ĐVQL, 2. Tên, 3. Tình trạng ── */}
              <div style={{ marginBottom: 12, marginTop: spaceMd }}>
                <div style={filterLabelStyle}>Đơn vị quản lý</div>
                <OrgUnitTreeSelect
                  organizations={orgUnitOptions}
                  placeholder="Chọn đơn vị..."
                  allowClear
                  treeDefaultExpandAll={true}
                  listHeight={256}
                  value={filterValues.orgUnitId}
                  onChange={(value) => {
                    setFilterValues((prev) => ({ ...prev, orgUnitId: value, vtsOperationCenterId: undefined }));
                  }}
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={filterLabelStyle}>Tên hệ thống AIS</div>
                <Input
                  placeholder="Tìm theo tên hệ thống AIS"
                  allowClear
                  value={filterValues.name || ''}
                  onChange={(event) => setFilterValues((prev) => ({ ...prev, name: event.target.value }))}
                  onPressEnter={() => handleFilterSearch(filterValues)}
                  style={{ borderRadius: radiusPill, height: 40 }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={filterLabelStyle}>Tình trạng</div>
                <Select
                  placeholder="Chọn tình trạng"
                  allowClear
                  value={filterValues.conditionStatus}
                  onChange={(value) => setFilterValues((prev) => ({ ...prev, conditionStatus: value }))}
                  options={CONDITION_STATUS_OPTIONS}
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                />
              </div>

              {/* ── BỘ LỌC NÂNG CAO (ẨN / HIỆN THEO NÚT BỘ LỌC NÂNG CAO) ── */}
              {filterCollapsed && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <div style={filterLabelStyle}>Thuộc TTDH VTS / Trạm Radar</div>
                    <Select
                      placeholder="Chọn TTDH / Trạm Radar"
                      allowClear
                      showSearch
                      filterOption={(input, option) =>
                        normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))
                      }
                      value={filterValues.vtsOperationCenterId}
                      onChange={(value) => setFilterValues((prev) => ({ ...prev, vtsOperationCenterId: value }))}
                      options={combinedLocationOptions}
                      style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                    />
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={filterLabelStyle}>Mã hệ thống AIS</div>
                    <Input
                      placeholder="Tìm theo mã hệ thống AIS"
                      allowClear
                      value={filterValues.code || ''}
                      onChange={(event) => setFilterValues((prev) => ({ ...prev, code: event.target.value }))}
                      onPressEnter={() => handleFilterSearch(filterValues)}
                      style={{ borderRadius: radiusPill, height: 40 }}
                    />
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={filterLabelStyle}>Địa điểm (Tỉnh/Thành phố)</div>
                    <Select
                      placeholder="Chọn tỉnh/thành phố"
                      allowClear
                      showSearch
                      filterOption={(input, option) =>
                        normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))
                      }
                      value={filterValues.provinceId}
                      onChange={(value) => setFilterValues((prev) => ({ ...prev, provinceId: value }))}
                      options={VIETNAM_PROVINCE_OPTIONS}
                      style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                    />
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={filterLabelStyle}>Năm đưa vào sử dụng</div>
                    <DatePicker
                      picker="year"
                      format="YYYY"
                      placeholder="Chọn năm"
                      allowClear
                      value={filterValues.commissioningYear ? dayjs(String(filterValues.commissioningYear), 'YYYY') : null}
                      onChange={(date: any) => setFilterValues((prev) => ({ ...prev, commissioningYear: date ? date.year() : undefined }))}
                      style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                    />
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={filterLabelStyle}>Ngày cập nhật</div>
                    <DatePicker.RangePicker
                      {...getRangePickerProps()}
                      format="DD/MM/YYYY"
                      placeholder={['Từ ngày', 'Đến ngày']}
                      allowClear
                      value={filterValues.updateDateRange}
                      onChange={(dates: any) => setFilterValues((prev) => ({ ...prev, updateDateRange: dates }))}
                      style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                    />
                  </div>
                </>
              )}
            </>
          }
        >
          <DataTable
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            rowActions={rowActions}
            loading={loading}
            onSort={handleSort}
            scroll={{ x: 'max-content' }}
          />
          <Pagination total={total} current={page} pageSize={pageSize} onChange={(p, ps) => { setPage(p); setPageSize(ps); }} />
        </FilterTableLayout>

        {isModalOpen && (
          <AisSystemForm
            open={true}
            editId={editingId}
            initialData={selectedRecord}
            mode={modalMode}
            orgUnits={orgUnitOptions}
            opCenterOptions={opCenters}
            radarStationOptions={radarStations}
            operatingOrganizationOptions={operatingOrganizations}
            onCancel={() => { setIsModalOpen(false); setEditingId(null); setSelectedRecord(null); }}
            onSuccess={() => { setIsModalOpen(false); setEditingId(null); setSelectedRecord(null); refreshList(); }}
          />
        )}

        <CommonHistoryDrawer
          open={historyModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          entityName={selectedRecord?.name || (selectedRecord as any)?.code || 'Hệ thống AIS'}
          records={historyRecords}
          loading={loadingHistory}
          serverFiltered
          onFilterChange={handleHistoryFilterChange}
          onLoadMore={loadMoreHistory}
          loadingMore={loadingMoreHistory}
          variant="berth"
        />

        <ApprovalModal
          visible={approveModalOpen}
          level={approveLevel}
          onConfirm={handleApprove}
          onCancel={() => setApproveModalOpen(false)}
        />

        <Modal
          title="Từ chối"
          open={rejectModalOpen}
          onOk={handleReject}
          onCancel={() => setRejectModalOpen(false)}
          okText="Từ chối"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
        >
          <p style={{ marginBottom: spaceFormField }}>Nhập lý do từ chối (tối thiểu 10 ký tự):</p>
          <Input.TextArea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Nhập lý do từ chối"
            maxLength={1000}
            showCount
            style={textAreaStyle}
          />
        </Modal>

        {/* ── Delete Confirmation Modal (Chuẩn Bến cảng) ────────────── */}
        <DeleteConfirmModal
          open={deleteModalOpen}
          onCancel={() => {
            if (!deleteLoading) {
              setDeleteModalOpen(false);
              setDeletingRecord(null);
            }
          }}
          onConfirm={handleConfirmDelete}
          loading={deleteLoading}
          itemType="hệ thống trạm bờ AIS"
          itemName={deletingRecord?.name}
          itemCode={deletingRecord?.code}
        />
      </div>
    </ThemeTokenProvider>
  );
}

export default AisSystemList;

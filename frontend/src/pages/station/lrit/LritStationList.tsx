import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Modal, Input, DatePicker, Select } from 'antd';
import DeleteConfirmModal from '../../../components/shared/DeleteConfirmModal';
import { lritStationService, type LritStationListParams } from '../../../services/lritStationService';
import { organizationService } from '../../../services/organizationService';
import type { LritStationItem } from '../../../types/lritStation';
import { ConditionStatus, ApprovalStatus, CONDITION_STATUS_OPTIONS, CONDITION_STATUS_MAP } from '../../../types/vtsSystem';
import { useAuthStore, type AuthState } from '../../../store/authStore';
import { usePermissionStore, type PermissionState } from '../../../store/permissionStore';
import { ScreenHeader, DataTable } from '../../../components/list-view';
import FilterTableLayout from '../../../components/list-view/FilterTableLayout';
import Pagination from '../../../components/list-view/Pagination';
import LritStationForm from './LritStationForm';
import { getOperatingOrganizationDisplayName } from '../../../utils/operatingOrganizationDisplay';
import ApprovalModal from '../../../components/shared/ApprovalModal';
import CommonHistoryDrawer, { type CommonHistoryEntry } from '../../../components/shared/CommonHistoryDrawer';
import ApprovalStatusBadge from '../../../components/shared/ApprovalStatusBadge';
import { useStandardApprovalStatusTabs } from '../../../components/shared/approvalStatusTabs';
import toast from '../../../components/ToastNotification';
import {
  actionPrimary, textSecondary,
  fontWeightBold,
  spaceSm, spaceMd, spaceFormField,
  statusOperational, statusCritical, statusAttention,
  statusBadgeStyle, icons, cellTitleStyle, cellSubtitleStyle,
  textAreaStyle, colors, radiusPill,
  getRangePickerProps,
} from '../../../themetokenchk';
import * as themeTokenChk from '../../../themetokenchk';
import { ThemeTokenProvider } from '../../../context/ThemeTokenContext';
import dayjs from 'dayjs';
import { getProvinceNameById, VIETNAM_PROVINCE_OPTIONS } from '../../../types/common';
import { FilterOrgUnitTreeSelect, normalizeSearchText, resolveDefaultOrgUnitId, type OrgUnitTreeOption } from '../../../components/org-unit';
import { useKchtRowActions } from '../../../hooks/useKchtRowActions';
import { useSearchParams } from 'react-router-dom';
import { getVtsConditionStatusLabel, getConditionStatusLabel, getConditionStatusColor } from '../../../themetokenchk';
import { formatMaritimeServicesDisplay } from '../../../constants/maritimeServices';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../../services/operatingOrganizationsData';

const fontSizeMd = 13.5;

const filterLabelStyle: React.CSSProperties = {
  color: colors.sidebarBg,
  fontWeight: fontWeightBold,
  fontSize: fontSizeMd,
  marginBottom: spaceSm,
};

/** Số bản ghi nhật ký mỗi lần cuộn tải thêm trong drawer lịch sử. */
const HISTORY_PAGE_SIZE = 20;

const CONDITION_COLOR: Record<ConditionStatus, string> = {
  [ConditionStatus.OPERATIONAL]: statusOperational,
  [ConditionStatus.STOPPED]: statusCritical,
  [ConditionStatus.MAINTENANCE]: statusAttention,
  [ConditionStatus.UNDER_CONSTRUCTION]: actionPrimary,
  [ConditionStatus.NOT_YET_OPERATIONAL]: statusAttention,
  [ConditionStatus.SUSPENDED]: statusCritical,
};

const LritStationGlobalStyles = React.memo(() => (
  <style>{`
    .lrit-page-wrapper,
    .lrit-page-wrapper .ant-table,
    .lrit-page-wrapper .ant-table-cell,
    .lrit-page-wrapper .ant-input,
    .lrit-page-wrapper .ant-select,
    .lrit-page-wrapper .ant-select-selection-item,
    .lrit-page-wrapper .ant-select-selection-placeholder,
    .lrit-page-wrapper .ant-picker,
    .lrit-page-wrapper .ant-picker-input > input,
    .lrit-page-wrapper .ant-btn,
    .lrit-page-wrapper .ant-pagination,
    .lrit-page-wrapper .ant-breadcrumb,
    .lrit-page-wrapper .filter-label,
    .lrit-drawer-scope,
    .lrit-drawer-scope .ant-drawer-content,
    .lrit-drawer-scope .ant-tabs-tab,
    .lrit-drawer-scope .chk-detail-label,
    .lrit-drawer-scope .chk-detail-value,
    .lrit-drawer-scope .ant-table,
    .lrit-drawer-scope .ant-table-cell,
    .lrit-drawer-scope .ant-table-thead > tr > th,
    .lrit-drawer-scope .ant-btn,
    .lrit-drawer-scope .ant-select,
    .lrit-drawer-scope .ant-input,
    .lrit-drawer-scope .ant-form-item-label > label {
      font-size: 13.5px !important;
    }
    .lrit-page-wrapper .screen-header {
      flex-wrap: wrap !important;
      gap: 10px !important;
    }

    /* ── Responsive StatusTabs: Căn giữa khi đủ chỗ, thanh cuộn ngang khi tràn màn hình ── */
    .lrit-page-wrapper div:has(> button[aria-pressed]) {
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
      padding: 2px 8px 4px 8px !important;
      gap: clamp(6px, 1vw, 14px) !important;
    }
    .lrit-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar {
      height: 4px !important;
      display: block !important;
    }
    .lrit-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-track {
      background: #f1f5f9 !important;
      border-radius: 999px !important;
    }
    .lrit-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb {
      background: #cbd5e1 !important;
      border-radius: 999px !important;
    }
    .lrit-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb:hover {
      background: #94a3b8 !important;
    }
    .lrit-page-wrapper div:has(> button[aria-pressed]) > button {
      white-space: nowrap !important;
      flex-shrink: 0 !important;
      cursor: pointer !important;
      padding: 4px 2px !important;
    }

    /* ── Responsive Drawers: Không tràn viền khi màn hình nhỏ / zoom cao ── */
    .lrit-drawer-scope .ant-drawer-content-wrapper {
      max-width: 100vw !important;
    }
    @media (max-width: 1024px) {
      .lrit-drawer-scope .chk-detail-grid {
        grid-template-columns: 1fr !important;
        column-gap: 0 !important;
      }
      .lrit-drawer-scope .chk-detail-row--full {
        grid-column: 1 !important;
      }
    }
    @media (max-width: 640px) {
      .lrit-drawer-scope .chk-detail-row {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 4px !important;
        padding: 8px 0 !important;
      }
      .lrit-drawer-scope .chk-detail-label {
        width: 100% !important;
      }
      .lrit-drawer-scope .chk-detail-value {
        width: 100% !important;
      }
    }
  `}</style>
));

const LRIT_FIELD_MAP: Record<string, string> = {
  code: 'Mã đài',
  stationCode: 'Mã đài',
  'Mã đài': 'Mã đài',
  name: 'Tên đài',
  stationName: 'Tên đài',
  'Tên đài': 'Tên đài',
  orgUnitId: 'Đơn vị quản lý',
  orgUnitName: 'Đơn vị quản lý',
  'Đơn vị quản lý': 'Đơn vị quản lý',
  operatingOrgId: 'Đơn vị khai thác',
  operatingOrgName: 'Đơn vị khai thác',
  'Đơn vị khai thác': 'Đơn vị khai thác',
  provinceId: 'Địa điểm (Tỉnh/TP)',
  'Địa điểm (Tỉnh/TP)': 'Địa điểm (Tỉnh/TP)',
  locationAddress: 'Địa điểm chi tiết',
  'Địa điểm chi tiết': 'Địa điểm chi tiết',
  conditionStatus: 'Tình trạng',
  'Tình trạng': 'Tình trạng',
  coverageArea: 'Vùng phủ sóng',
  'Vùng phủ sóng': 'Vùng phủ sóng',
  servicesProvided: 'Dịch vụ cung cấp',
  services: 'Dịch vụ cung cấp',
  'Dịch vụ cung cấp': 'Dịch vụ cung cấp',
  description: 'Ghi chú',
  note: 'Ghi chú',
  'Ghi chú': 'Ghi chú',
  geometryType: 'Loại đối tượng',
  objectType: 'Loại đối tượng',
  'Loại đối tượng': 'Loại đối tượng',
  symbol: 'Biểu tượng',
  symbolId: 'Biểu tượng',
  'Biểu tượng': 'Biểu tượng',
  coordinateSystem: 'Hệ quy chiếu',
  'Hệ quy chiếu': 'Hệ quy chiếu',
  displayRule: 'Quy tắc hiển thị',
  'Quy tắc hiển thị': 'Quy tắc hiển thị',
  latitude: 'Vĩ độ',
  longitude: 'Kinh độ',
  coordinates: 'Tọa độ GIS',
  'Tọa độ GIS': 'Tọa độ GIS',
  approvalStatus: 'Trạng thái phê duyệt',
};

const formatHistoryValue = (field: string, val: unknown): string => {
  if (val === null || val === undefined || val === '') return '—';
  if (field === 'provinceId' || field === 'Địa điểm (Tỉnh/TP)') {
    return getProvinceNameById(val as number) || String(val);
  }
  if (field === 'conditionStatus' || field === 'Tình trạng' || field === 'tinhTrang') {
    return getVtsConditionStatusLabel(val) || getConditionStatusLabel(val as string);
  }
  if (field === 'operatingOrgId' || field === 'operatingOrgName' || field === 'Đơn vị khai thác') {
    const sVal = String(val).trim();
    const found = DEFAULT_OPERATING_ORGANIZATIONS.find((o) => o.id === sVal || o.code === sVal);
    return found ? found.name : sVal;
  }
  if (field === 'services' || field === 'servicesProvided' || field === 'Dịch vụ cung cấp' || field === 'providedServices') {
    return formatMaritimeServicesDisplay(val);
  }
  return String(val);
};

export default function LritStationList() {
  const [searchParams] = useSearchParams();
  const linkedAction = searchParams.get('action');
  const linkedRecordId = searchParams.get('id');
  const isIframeModal = window.parent !== window.self;
  const isMapLinkedView = isIframeModal && (linkedAction === 'edit' || linkedAction === 'detail');
  const handledLinkedRecordRef = useRef<string | null>(null);

  const currentUser = useAuthStore((s: AuthState) => s.user);
  const hasPerm = usePermissionStore((s: PermissionState) => s.hasPermission);

  const customLritTokens = useMemo(() => ({
    ...themeTokenChk,
    fontSizeMd: 13.5,
  }), []);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortField, setSortField] = useState<string | undefined>();
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('desc');
  const defaultOrgUnitRef = useRef<string | undefined>(undefined);
  const [filterName, setFilterName] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [filterConditionStatus, setFilterConditionStatus] = useState<ConditionStatus | undefined>();
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<ApprovalStatus | undefined>();
  const [filterOrgUnitId, setFilterOrgUnitId] = useState<string | undefined>();
  const [filterProvinceId, setFilterProvinceId] = useState<number | undefined>();
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState<string | undefined>();
  const [filterUpdatedTo, setFilterUpdatedTo] = useState<string | undefined>();

  const [orgUnitOptions, setOrgUnitOptions] = useState<OrgUnitTreeOption[]>([]);
  const [filterValues, setFilterValues] = useState<Record<string, unknown>>({});
  const [filterCollapsed, setFilterCollapsed] = useState(false);

  const [dataSource, setDataSource] = useState<LritStationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<LritStationItem | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'detail'>('create');

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveTargetId, setApproveTargetId] = useState<string | null>(null);
  const [approveLevel, setApproveLevel] = useState<'c1' | 'c2'>('c1');

  // History drawer state
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<CommonHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyTargetId, setHistoryTargetId] = useState<string | null>(null);
  const [historyFilters, setHistoryFilters] = useState<{ keyword: string; fromDate?: string; toDate?: string }>({ keyword: '' });

  // Count tabs
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const statusCountFilterKey = useRef<string | null>(null);
  const [isOptionsReady, setIsOptionsReady] = useState(false);

  const canCreate = hasPerm('coastalstationlrit:create');

  // Handle map linked action
  useEffect(() => {
    if (!isMapLinkedView || !linkedRecordId || !linkedAction) return;

    const requestKey = `${linkedAction}:${linkedRecordId}`;
    if (handledLinkedRecordRef.current === requestKey) return;
    handledLinkedRecordRef.current = requestKey;

    let active = true;
    void Promise.resolve({ id: linkedRecordId } as LritStationItem)
      .then((record) => {
        if (!active) return;
        if (linkedAction === 'edit') {
          setEditingId(record.id);
          setSelectedRecord(record);
          setModalMode('edit');
          setIsModalOpen(true);
        } else {
          setEditingId(record.id);
          setSelectedRecord(record);
          setModalMode('detail');
          setIsModalOpen(true);
        }
      })
      .catch(() => {
        if (!active) return;
        handledLinkedRecordRef.current = null;
        toast.error('Không thể tải hồ sơ Đài thông tin LRIT');
      });

    return () => {
      active = false;
    };
  }, [isMapLinkedView, linkedAction, linkedRecordId]);

  // Load lookup options
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const orgs = await organizationService.getAll()
          .then((res: any) => Array.isArray(res) ? res : (res?.data || []));
        if (!mounted) return;
        const mappedOrgs = (orgs || []).map((o: any) => ({
          id: String(o.id),
          name: o.name || o.unitName || o.tenDonVi || 'Đơn vị',
          code: o.code || o.maDonVi,
          parentId: o.parentId ? String(o.parentId) : undefined,
        }));
        setOrgUnitOptions(mappedOrgs);
        const resolvedDefault = resolveDefaultOrgUnitId(useAuthStore.getState().user, mappedOrgs);
        defaultOrgUnitRef.current = resolvedDefault;
        if (resolvedDefault) {
          setFilterOrgUnitId(resolvedDefault);
          setFilterValues((prev) => ({ ...prev, orgUnitId: resolvedDefault }));
        }
      } catch (err) {
        console.error('Failed to fetch lookup options', err);
      } finally {
        if (mounted) {
          setIsOptionsReady(true);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);


  // Fetch list data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setIsError(false);
      setErrorMessage('');
      const params: LritStationListParams = {
        page,
        size: pageSize,
        name: filterName || undefined,
        code: filterCode || undefined,
        orgUnitId: filterOrgUnitId || undefined,
        provinceId: filterProvinceId,
        conditionStatus: filterConditionStatus,
        approvalStatus: filterApprovalStatus,
        updatedFrom: filterUpdatedFrom,
        updatedTo: filterUpdatedTo,
        sortBy: sortField || 'createdAt',
        sortDir: sortField && sortDirection ? sortDirection.toUpperCase() : 'DESC',
        includeCounts: statusCountFilterKey.current !== JSON.stringify([
          filterName, filterCode, filterOrgUnitId, filterProvinceId,
          filterConditionStatus, filterUpdatedFrom, filterUpdatedTo,
        ]),
      };
      const currentStatusCountFilterKey = JSON.stringify([
        filterName, filterCode, filterOrgUnitId, filterProvinceId,
        filterConditionStatus, filterUpdatedFrom, filterUpdatedTo,
      ]);
      const res = await lritStationService.search(params);

      setDataSource(res.items || []);
      setTotal(res.total || 0);
      if (params.includeCounts) {
        setStatusCounts(res.statusCounts || {});
        statusCountFilterKey.current = currentStatusCountFilterKey;
      }
    } catch (e: unknown) {
      setIsError(true);
      setErrorMessage(e instanceof Error ? e.message : 'Lỗi tải dữ liệu');
      toast.error('Không thể tải danh sách Đài thông tin LRIT');
    } finally {
      setLoading(false);
    }
  }, [filterName, filterCode, filterOrgUnitId, filterProvinceId, filterConditionStatus, filterApprovalStatus, filterUpdatedFrom, filterUpdatedTo, page, pageSize, sortField, sortDirection]);

  useEffect(() => {
    if (!isOptionsReady) return;
    fetchData();
  }, [fetchData, isOptionsReady]);

  const handleSort = useCallback((field: string, order: 'asc' | 'desc' | null) => {
    if (!order) {
      setSortField(undefined);
      setSortDirection(null);
    } else {
      setSortField(field);
      setSortDirection(order);
    }
    setPage(1);
  }, []);

  const sortOrderFor = (key: string): 'ascend' | 'descend' | null =>
    (sortField === key && sortDirection ? (sortDirection === 'asc' ? 'ascend' : 'descend') : null);

  const serverSideSorter = () => 0;

  const refreshList = useCallback(() => {
    if (!isOptionsReady) return;
    statusCountFilterKey.current = null;
    fetchData();
  }, [fetchData, isOptionsReady]);

  // ── Delete confirmation modal (Chuẩn Bến cảng) ───────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<LritStationItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openDeleteModal = useCallback((record: LritStationItem) => {
    setDeletingRecord(record);
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingRecord) return;
    setDeleteLoading(true);
    try {
      await lritStationService.delete(deletingRecord.id);
      toast.success('Đã xóa đài thông tin LRIT');
      setDeleteModalOpen(false);
      setDeletingRecord(null);
      refreshList();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingRecord, refreshList]);

  // Approval Handlers
  const openApproveModal = (id: string, level: 'c1' | 'c2') => {
    setApproveTargetId(id);
    setApproveLevel(level);
    setApproveModalOpen(true);
  };

  const handleApprove = async (content: string) => {
    if (!approveTargetId) return;
    try {
      let res: any;
      if (approveLevel === 'c1') {
        res = await lritStationService.approveL1(approveTargetId, content);
        toast.success(res?.message || 'Phê duyệt cấp Cảng vụ/Chi cục thành công');
      } else {
        res = await lritStationService.approveL2(approveTargetId, content);
        toast.success(res?.message || 'Phê duyệt cấp Cục thành công');
      }
      setApproveModalOpen(false);
      refreshList();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi phê duyệt');
    }
  };

  const openRejectModal = (id: string) => {
    setRejectTargetId(id);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim() || rejectReason.trim().length < 10) {
      toast.error('Lý do từ chối phải có ít nhất 10 ký tự');
      return;
    }
    if (!rejectTargetId) return;
    try {
      const res: any = await lritStationService.reject(rejectTargetId, rejectReason.trim());
      toast.success(res?.message || 'Từ chối phê duyệt hồ sơ thành công');
      setRejectModalOpen(false);
      refreshList();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi từ chối');
    }
  };

  // History Drawer
  const handleViewHistory = (record: LritStationItem) => {
    setSelectedRecord(record);
    setHistoryTargetId(record.id);
    setHistoryModalOpen(true);
    setHistoryRecords([]);
    setLoadingHistory(false);
    setLoadingMoreHistory(false);
    setHasMoreHistory(true);
    setHistoryPage(0);
    setHistoryFilters({ keyword: '' });
  };

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
        const history = await lritStationService.getHistory(historyTargetId, 0, HISTORY_PAGE_SIZE, {
          keyword: historyFilters.keyword || undefined,
          fromDate: historyFilters.fromDate || undefined,
          toDate: historyFilters.toDate || undefined,
        });
        if (cancelled) return;
        const items = (history || []) as unknown as CommonHistoryEntry[];
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
      const history = await lritStationService.getHistory(historyTargetId, nextPage, HISTORY_PAGE_SIZE, {
        keyword: historyFilters.keyword || undefined,
        fromDate: historyFilters.fromDate || undefined,
        toDate: historyFilters.toDate || undefined,
      });
      if (history && history.length > 0) {
        setHistoryRecords((prev) => [...prev, ...(history as unknown as CommonHistoryEntry[])]);
      }
      setHistoryPage(nextPage);
      setHasMoreHistory((history || []).length === HISTORY_PAGE_SIZE);
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

  const { statusTabs, handleTabChange } = useStandardApprovalStatusTabs(
    statusCounts,
    filterApprovalStatus,
    (status) => {
      setFilterApprovalStatus(status);
      setPage(1);
    }
  );

  const handleFilterSearch = (vals: Record<string, unknown>) => {
    const name = typeof vals.name === 'string' ? vals.name.trim() : '';
    const code = typeof vals.code === 'string' ? vals.code.trim() : '';
    setFilterValues((prev) => ({
      ...prev,
      name,
      code,
    }));
    setFilterName(name);
    setFilterCode(code);
    setFilterConditionStatus(vals.conditionStatus as ConditionStatus | undefined);
    setFilterOrgUnitId(vals.orgUnitId as string | undefined);
    setFilterProvinceId(vals.provinceId != null && vals.provinceId !== '' ? Number(vals.provinceId) : undefined);
    const dateRange = vals.updateDateRange as [dayjs.Dayjs | null, dayjs.Dayjs | null] | undefined;
    setFilterUpdatedFrom(dateRange?.[0] ? dayjs(dateRange[0]).startOf('day').format('YYYY-MM-DDTHH:mm:ss') : undefined);
    setFilterUpdatedTo(dateRange?.[1] ? dayjs(dateRange[1]).endOf('day').format('YYYY-MM-DDTHH:mm:ss') : undefined);
    setPage(1);
  };

  const handleFilterReset = () => {
    const defaultOrg = defaultOrgUnitRef.current;
    setFilterName('');
    setFilterCode('');
    setFilterConditionStatus(undefined);
    setFilterOrgUnitId(defaultOrg);
    setFilterProvinceId(undefined);
    setFilterUpdatedFrom(undefined);
    setFilterUpdatedTo(undefined);
    setFilterValues(defaultOrg ? { orgUnitId: defaultOrg } : {});
    setPage(1);
  };

  const isRejectedTab = filterApprovalStatus === ApprovalStatus.REJECTED_LEVEL1 || filterApprovalStatus === ApprovalStatus.REJECTED_LEVEL2;

  const isUuid = (value?: string | null) => !!value && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-/.test(value);

  const resolveOrgUnitName = useCallback((orgUnitId?: string, orgUnitName?: string) => {
    if (orgUnitName && !isUuid(orgUnitName)) return orgUnitName;
    if (orgUnitId) {
      const found = orgUnitOptions.find((o) => String(o.id) === String(orgUnitId));
      if (found?.name && !isUuid(found.name)) return found.name;
    }
    if (orgUnitName && isUuid(orgUnitName)) {
      const found = orgUnitOptions.find((o) => String(o.id) === String(orgUnitName));
      if (found?.name && !isUuid(found.name)) return found.name;
    }
    return '—';
  }, [orgUnitOptions]);

  const resolveOperatingOrgName = useCallback((id?: string, name?: string) => {
    if (name && !isUuid(name)) return name;
    const disp = getOperatingOrganizationDisplayName(id, name);
    if (disp && !isUuid(disp)) return disp;
    if (id) {
      const found = orgUnitOptions.find((o) => String(o.id) === String(id));
      if (found?.name && !isUuid(found.name)) return found.name;
    }
    return '—';
  }, [orgUnitOptions]);

  // Table Columns
  const columns = useMemo(() => [
    {
      key: 'stt',
      label: 'STT',
      width: 60,
      align: 'center' as const,
      fixed: 'left' as const,
      render: (_: unknown, __: unknown, index: number) => (page - 1) * pageSize + index + 1,
    },
    {
      key: 'name',
      label: 'Tên/Mã đài LRIT',
      dataIndex: 'name',
      width: 260,
      fixed: 'left' as const,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('name'),
      render: (_: unknown, record: LritStationItem) => (
        <div
          style={{ cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          onClick={() => {
            setEditingId(record.id);
            setSelectedRecord(record);
            setModalMode('detail');
            setIsModalOpen(true);
          }}
        >
          <div style={cellTitleStyle} title={record.name || ''}>{record.name || '—'}</div>
          <div style={cellSubtitleStyle} title={record.code || ''}>{record.code || '—'}</div>
        </div>
      ),
    },
    {
      key: 'orgUnitName',
      label: 'Đơn vị quản lý',
      dataIndex: 'orgUnitName',
      width: 220,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('orgUnitName'),
      render: (_: unknown, record: LritStationItem) => {
        const val = resolveOrgUnitName(record.orgUnitId, record.orgUnitName);
        return <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: fontWeightBold }} title={val}>{val}</div>;
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
      render: (_: unknown, record: LritStationItem) => {
        const name = resolveOperatingOrgName(record.operatingOrgId, record.operatingOrgName);
        return <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={name}>{name}</div>;
      },
    },
    {
      key: 'provinceId',
      label: 'Địa điểm (Tỉnh/TP)',
      dataIndex: 'provinceId',
      width: 180,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('provinceId'),
      render: (_: unknown, r: LritStationItem) => {
        const val = r.provinceName || (r.provinceId ? getProvinceNameById(r.provinceId) : undefined) || '—';
        return <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={val}>{val}</div>;
      },
    },
    {
      key: 'conditionStatus',
      label: 'Tình trạng',
      dataIndex: 'conditionStatus',
      width: 220,
      ellipsis: false,
      render: (v: string) => {
        const label = CONDITION_STATUS_MAP[v as ConditionStatus] || getConditionStatusLabel(v) || v;
        const color = CONDITION_COLOR[v as ConditionStatus] || getConditionStatusColor(v) || textSecondary;
        return (
          <span style={statusBadgeStyle(color)}>
            {label}
          </span>
        );
      },
    },
    {
      key: 'approvalStatus',
      label: 'Trạng thái',
      dataIndex: 'approvalStatus',
      width: 260,
      ellipsis: false,
      render: (status: ApprovalStatus) => <ApprovalStatusBadge status={status} />,
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
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('updatedByName'),
      render: (_: unknown, record: LritStationItem) => {
        const rawName = record.updatedByName || record.createdByName;
        const name = isUuid(rawName) ? '—' : (rawName || '—');
        const date = record.updatedAt || record.createdAt;
        return (
          <div style={{ lineHeight: '1.35', overflow: 'hidden' }}>
            <div
              title={name}
              style={{
                fontWeight: fontWeightBold,
                color: '#0F172A',
                fontSize: fontSizeMd,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
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
  ], [page, pageSize, sortOrderFor, isRejectedTab, resolveOrgUnitName, resolveOperatingOrgName]);

    const { rowActions } = useKchtRowActions<LritStationItem>({
    resource: 'coastalstationlrit',
    approvalLevels: 2,
    handlers: {
      onDetail: (record) => {
        setEditingId(record.id);
        setSelectedRecord(record);
        setModalMode('detail');
        setIsModalOpen(true);
      },
      onEdit: (record) => {
        setEditingId(record.id);
        setSelectedRecord(record);
        setModalMode('edit');
        setIsModalOpen(true);
      },
      onHistory: (record) => handleViewHistory(record),
      onSubmit: async (record) => {
        try {
          const res: any = await lritStationService.submit(record.id);
          toast.success(res?.message || 'Gửi phê duyệt thành công');
          refreshList();
        } catch (e: unknown) {
          toast.error(e instanceof Error ? e.message : 'Lỗi gửi duyệt');
        }
      },
      onApproveL1: (record) => openApproveModal(record.id, 'c1'),
      onRejectL1: (record) => openRejectModal(record.id),
      onApproveL2: (record) => openApproveModal(record.id, 'c2'),
      onRejectL2: (record) => openRejectModal(record.id),
      onDelete: (record) => openDeleteModal(record),
    },
  });

  return (
    <ThemeTokenProvider tokens={customLritTokens}>
      <div className="lrit-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <LritStationGlobalStyles />
        <ScreenHeader
          breadcrumb={[
            { label: 'Tài sản KCHTGT' },
            { label: 'Đài thông tin nhận dạng và truy theo tầm xa (LRIT)' },
          ]}
          actions={
            canCreate
              ? [{
                key: 'create',
                label: 'Thêm mới',
                variant: 'primary' as const,
                icon: icons.create,
                onClick: () => {
                  setEditingId(null);
                  setSelectedRecord(null);
                  setModalMode('create');
                  setIsModalOpen(true);
                },
              }]
              : []
          }
        />

        <FilterTableLayout
          filterCollapsed={filterCollapsed}
          onToggleCollapse={() => setFilterCollapsed((value) => !value)}
          onFilterApply={() => handleFilterSearch(filterValues)}
          onFilterReset={() => {
            setFilterValues({});
            handleFilterReset();
          }}
          loading={loading}
          error={isError}
          errorMessage={errorMessage}
          onRetry={refreshList}
          statusTabs={statusTabs}
          onStatusTabChange={handleTabChange}
          filterContent={
            <>
              {/* ── BỘ LỌC CƠ BẢN (LUÔN HIỂN THỊ) ── */}
              <div style={{ marginBottom: 12, marginTop: spaceMd }}>
                <div style={filterLabelStyle}>Đơn vị quản lý</div>
                <FilterOrgUnitTreeSelect
                  organizations={orgUnitOptions}
                  value={filterValues.orgUnitId as string | undefined}
                  onChange={(value) => {
                    setFilterValues((prev) => ({ ...prev, orgUnitId: value }));
                  }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={filterLabelStyle}>Tên đài thông tin LRIT</div>
                <Input
                  placeholder="Tìm theo tên đài thông tin LRIT"
                  allowClear
                  value={(filterValues.name as string) || ''}
                  onChange={(event) => setFilterValues((prev) => ({ ...prev, name: event.target.value }))}
                  onBlur={() => {
                    if (typeof filterValues.name === 'string') {
                      setFilterValues((prev) => ({ ...prev, name: prev.name.trim() }));
                    }
                  }}
                  onPressEnter={() => handleFilterSearch(filterValues)}
                  style={{ borderRadius: radiusPill, height: 40 }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={filterLabelStyle}>Tình trạng</div>
                <Select
                  placeholder="Chọn tình trạng"
                  allowClear
                  value={filterValues.conditionStatus as ConditionStatus | undefined}
                  onChange={(value) => setFilterValues((prev) => ({ ...prev, conditionStatus: value }))}
                  options={CONDITION_STATUS_OPTIONS}
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                />
              </div>

              {/* ── BỘ LỌC NÂNG CAO ── */}
              {filterCollapsed && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <div style={filterLabelStyle}>Mã đài thông tin LRIT</div>
                    <Input
                      placeholder="Tìm theo mã đài thông tin LRIT"
                      allowClear
                      value={(filterValues.code as string) || ''}
                      onChange={(event) => setFilterValues((prev) => ({ ...prev, code: event.target.value }))}
                      onBlur={() => {
                        if (typeof filterValues.code === 'string') {
                          setFilterValues((prev) => ({ ...prev, code: prev.code.trim() }));
                        }
                      }}
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
                        normalizeSearchText(String(option?.label || '')).includes(normalizeSearchText(input))
                      }
                      value={filterValues.provinceId as number | undefined}
                      onChange={(value) => setFilterValues((prev) => ({ ...prev, provinceId: value }))}
                      options={VIETNAM_PROVINCE_OPTIONS}
                      style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                    />
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={filterLabelStyle}>Ngày cập nhật</div>
                    <DatePicker.RangePicker
                      format="DD/MM/YYYY"
                      placeholder={['Từ ngày', 'Đến ngày']}
                      allowClear
                      {...getRangePickerProps()}
                      value={filterValues.updateDateRange as [dayjs.Dayjs | null, dayjs.Dayjs | null] | undefined}
                      onChange={(dates) => setFilterValues((prev) => ({ ...prev, updateDateRange: dates }))}
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
          <Pagination
            total={total}
            current={page}
            pageSize={pageSize}
            onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
          />
        </FilterTableLayout>

        {isModalOpen && (
          <LritStationForm
            open={true}
            editId={editingId}
            initialData={selectedRecord}
            mode={modalMode}
            orgUnits={orgUnitOptions}
            onCancel={() => { setIsModalOpen(false); setEditingId(null); setSelectedRecord(null); }}
            onSuccess={() => { setIsModalOpen(false); setEditingId(null); setSelectedRecord(null); refreshList(); }}
            onClose={() => { setIsModalOpen(false); setEditingId(null); setSelectedRecord(null); }}
          />
        )}

        {/* ── History drawer ────────────────────────────────────────── */}
        <CommonHistoryDrawer
          open={historyModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          entityName={selectedRecord?.name || (selectedRecord as any)?.code || 'Đài thông tin LRIT'}
          records={historyRecords}
          loading={loadingHistory}
          fieldLabelMap={LRIT_FIELD_MAP}
          formatValue={formatHistoryValue}
          serverFiltered
          onFilterChange={handleHistoryFilterChange}
          onLoadMore={loadMoreHistory}
          loadingMore={loadingMoreHistory}
          variant="berth"
        />

        {/* Approval Modal */}
        <ApprovalModal
          visible={approveModalOpen}
          level={approveLevel}
          onConfirm={handleApprove}
          onCancel={() => setApproveModalOpen(false)}
        />

        {/* Reject Modal */}
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
          itemType="đài thông tin LRIT"
          itemName={deletingRecord?.name}
          itemCode={deletingRecord?.code}
        />
      </div>
    </ThemeTokenProvider>
  );
}

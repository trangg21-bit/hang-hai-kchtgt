import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Modal, Input, DatePicker, Select } from 'antd';
import DeleteConfirmModal from '../../components/shared/DeleteConfirmModal';
import { vtsOperationCenterService, type VtsOperationCenterListParams } from '../../services/vtsOperationCenterService';
import { vtsSystemCRUD } from '../../services/vtsSystemService';
import type { VtsOperationCenterListItem, VtsOperationCenterResponse } from '../../types/vtsOperationCenter';
import { ConditionStatus, ApprovalStatus, CONDITION_STATUS_OPTIONS, CONDITION_STATUS_MAP } from '../../types/vtsSystem';
import { useAuthStore, type AuthState } from '../../store/authStore';
import { usePermissionStore, type PermissionState } from '../../store/permissionStore';
import { ScreenHeader, DataTable } from '../../components/list-view';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import Pagination from '../../components/list-view/Pagination';
import VtsOperationCenterForm from './VtsOperationCenterForm';
import ApprovalModal from '../../components/shared/ApprovalModal';
import CommonHistoryDrawer, { type CommonHistoryEntry } from '../../components/shared/CommonHistoryDrawer';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import toast from '../../components/ToastNotification';
import {
  actionPrimary, textSecondary,
  fontWeightBold,
  spaceSm, spaceMd, spaceFormField,
  statusOperational, statusCritical, statusAttention,
  statusBadgeStyle, icons, cellTitleStyle, cellSubtitleStyle,
  textAreaStyle, colors, radiusPill,
  getRangePickerProps,
} from '../../themetokenchk';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import dayjs from 'dayjs';
import { FilterOrgUnitTreeSelect, normalizeSearchText, resolveOrgSubtreeIds, resolveDefaultOrgUnitId, type OrgUnitTreeOption } from '../../components/org-unit';
import { canEditApprovalRecord, canDeleteApprovalRecord } from '../../utils/approvalEditPolicy';
import { useSearchParams } from 'react-router-dom';
import { useStandardApprovalStatusTabs } from '../../components/shared/approvalStatusTabs';
import { getProvinceNameById, VIETNAM_PROVINCE_OPTIONS } from '../../types/common';

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
};

const VtsOperationCenterGlobalStyles = React.memo(() => (
  <style>{`
    .vts-page-wrapper,
    .vts-page-wrapper .ant-table,
    .vts-page-wrapper .ant-table-cell,
    .vts-page-wrapper .ant-input,
    .vts-page-wrapper .ant-select,
    .vts-page-wrapper .ant-select-selection-item,
    .vts-page-wrapper .ant-select-selection-placeholder,
    .vts-page-wrapper .ant-picker,
    .vts-page-wrapper .ant-picker-input > input,
    .vts-page-wrapper .ant-btn,
    .vts-page-wrapper .ant-pagination,
    .vts-page-wrapper .ant-breadcrumb,
    .vts-page-wrapper .filter-label,
    .vts-drawer-scope,
    .vts-drawer-scope .ant-drawer-content,
    .vts-drawer-scope .ant-tabs-tab,
    .vts-drawer-scope .chk-detail-label,
    .vts-drawer-scope .chk-detail-value,
    .vts-drawer-scope .ant-table,
    .vts-drawer-scope .ant-table-cell,
    .vts-drawer-scope .ant-table-thead > tr > th,
    .vts-drawer-scope .ant-btn,
    .vts-drawer-scope .ant-select,
    .vts-drawer-scope .ant-input,
    .vts-drawer-scope .ant-form-item-label > label {
      font-size: 13.5px !important;
    }
    .vts-page-wrapper .screen-header {
      flex-wrap: wrap !important;
      gap: 10px !important;
    }

    /* ── Responsive StatusTabs: Căn giữa khi đủ chỗ, thanh cuộn ngang khi tràn màn hình ── */
    .vts-page-wrapper div:has(> button[aria-pressed]) {
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
    .vts-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar {
      height: 6px !important;
      display: block !important;
    }
    .vts-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-track {
      background: #f1f5f9 !important;
      border-radius: 999px !important;
    }
    .vts-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb {
      background: #cbd5e1 !important;
      border-radius: 999px !important;
    }
    .vts-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb:hover {
      background: #94a3b8 !important;
    }
    .vts-page-wrapper div:has(> button[aria-pressed]) > button {
      white-space: nowrap !important;
      flex-shrink: 0 !important;
      cursor: pointer !important;
    }

    /* ── Responsive Drawers: Không tràn viền khi màn hình nhỏ / zoom cao ── */
    .vts-drawer-scope .ant-drawer-content-wrapper {
      max-width: 100vw !important;
    }
    @media (max-width: 1024px) {
      .vts-drawer-scope .chk-detail-grid {
        grid-template-columns: 1fr !important;
        column-gap: 0 !important;
      }
      .vts-drawer-scope .chk-detail-row--full {
        grid-column: 1 !important;
      }
    }
    @media (max-width: 640px) {
      .vts-drawer-scope .chk-detail-row {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 4px !important;
        padding: 8px 0 !important;
      }
      .vts-drawer-scope .chk-detail-label {
        width: 100% !important;
      }
      .vts-drawer-scope .chk-detail-value {
        width: 100% !important;
      }
    }
  `}</style>
));

export default function VtsOperationCenterList() {
  const [searchParams] = useSearchParams();
  const linkedAction = searchParams.get("action");
  const linkedRecordId = searchParams.get("id");
  const isIframeModal = window.parent !== window.self;
  const isMapLinkedView = isIframeModal && (linkedAction === "edit" || linkedAction === "detail");
  const handledLinkedRecordRef = useRef<string | null>(null);

  const currentUser = useAuthStore((s: AuthState) => s.user);
  const hasPerm = usePermissionStore((s: PermissionState) => s.hasPermission);

  const customVtsTokens = useMemo(() => ({
    ...themeTokenChk,
    fontSizeMd: 13.5,
  }), []);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortField, setSortField] = useState<string | undefined>();
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const defaultOrgUnitRef = useRef<string | undefined>(undefined);
  const [filterName, setFilterName] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [filterConditionStatus, setFilterConditionStatus] = useState<ConditionStatus | undefined>();
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<ApprovalStatus | undefined>();
  const [filterOrgUnitId, setFilterOrgUnitId] = useState<string | undefined>();
  const [filterPortId, setFilterPortId] = useState<string | undefined>();
  const [filterVtsSystemId, setFilterVtsSystemId] = useState<string | undefined>();
  const [filterProvinceId, setFilterProvinceId] = useState<number | undefined>();
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState<string | undefined>();
  const [filterUpdatedTo, setFilterUpdatedTo] = useState<string | undefined>();

  const [orgUnitOptions, setOrgUnitOptions] = useState<OrgUnitTreeOption[]>([]);
  const [portOptions, setPortOptions] = useState<Array<{ id: string; portName?: string; portCode?: string; orgUnitId?: string }>>([]);
  const [vtsSystemOptions, setVtsSystemOptions] = useState<Array<{ id: string; name?: string; code?: string; orgUnitId?: string }>>([]);
  const [filterValues, setFilterValues] = useState<Record<string, unknown>>({});
  const [filterCollapsed, setFilterCollapsed] = useState(false);

  const [dataSource, setDataSource] = useState<VtsOperationCenterListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<VtsOperationCenterResponse | null>(null);
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
  const listRequestId = useRef(0);

  useEffect(() => {
    if (!isMapLinkedView || !linkedRecordId || !linkedAction) return;

    const requestKey = `${linkedAction}:${linkedRecordId}`;
    if (handledLinkedRecordRef.current === requestKey) return;
    handledLinkedRecordRef.current = requestKey;

    let active = true;
    void vtsOperationCenterService.getById(linkedRecordId)
      .then((record) => {
        if (!active) return;
        if (linkedAction === "edit") {
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
        toast.error("Không thể tải hồ sơ Trung tâm Điều hành VTS");
      });

    return () => {
      active = false;
    };
  }, [isMapLinkedView, linkedAction, linkedRecordId]);

  useEffect(() => {
    (async () => {
      try {
        const [orgs, ports, systems] = await Promise.all([
          vtsSystemCRUD.getScopedOrgUnitOptions(),
          vtsSystemCRUD.getScopedPortOptions(),
          vtsSystemCRUD.getOptions(),
        ]);
        const mappedOrgs = (orgs || []).map((o: { id: string | number; name?: string; unitName?: string; tenDonVi?: string; code?: string; maDonVi?: string; parentId?: string | number }) => ({
          id: String(o.id),
          name: o.name || o.unitName || o.tenDonVi || 'Đơn vị',
          code: o.code || o.maDonVi,
          parentId: o.parentId ? String(o.parentId) : undefined,
        }));
        setOrgUnitOptions(mappedOrgs);
        setPortOptions(Array.isArray(ports) ? ports : []);
        setVtsSystemOptions(Array.isArray(systems) ? systems : []);
        const resolvedDefault = resolveDefaultOrgUnitId(currentUser, mappedOrgs);
        defaultOrgUnitRef.current = resolvedDefault;
        if (resolvedDefault) {
          setFilterOrgUnitId(resolvedDefault);
          setFilterValues((prev) => ({ ...prev, orgUnitId: resolvedDefault }));
        }
      } catch (e) {
        console.error('Failed to fetch lookup options', e);
      }
    })();
  }, [currentUser]);

  const filteredPortOptions = useMemo(() => {
    if (!filterValues.orgUnitId) return portOptions;
    const allowedIds = resolveOrgSubtreeIds(orgUnitOptions, filterValues.orgUnitId as string);
    return portOptions.filter((p) => !p.orgUnitId || allowedIds.has(p.orgUnitId));
  }, [portOptions, orgUnitOptions, filterValues.orgUnitId]);

  const filteredVtsSystemOptions = useMemo(() => {
    if (!filterValues.orgUnitId) return vtsSystemOptions;
    const allowedIds = resolveOrgSubtreeIds(orgUnitOptions, filterValues.orgUnitId as string);
    return vtsSystemOptions.filter((v) => !v.orgUnitId || allowedIds.has(v.orgUnitId));
  }, [vtsSystemOptions, orgUnitOptions, filterValues.orgUnitId]);

  const fetchData = useCallback(async () => {
    const requestId = ++listRequestId.current;
    setLoading(true);
    setIsError(false);
    try {
      const currentStatusCountFilterKey = JSON.stringify([
        filterName, filterCode, filterConditionStatus, filterOrgUnitId, filterPortId, filterVtsSystemId, filterProvinceId,
        filterUpdatedFrom, filterUpdatedTo,
      ]);
      const shouldIncludeCounts = statusCountFilterKey.current !== currentStatusCountFilterKey;
      const params: VtsOperationCenterListParams = {
        page: page,
        size: pageSize,
        name: filterName || undefined,
        code: filterCode || undefined,
        conditionStatus: filterConditionStatus,
        approvalStatus: filterApprovalStatus,
        orgUnitId: filterOrgUnitId || undefined,
        portId: filterPortId || undefined,
        vtsSystemId: filterVtsSystemId || undefined,
        provinceId: filterProvinceId,
        updatedFrom: filterUpdatedFrom,
        updatedTo: filterUpdatedTo,
        sortBy: sortField,
        sortDir: sortField ? sortDirection.toUpperCase() : undefined,
        includeCounts: shouldIncludeCounts,
      };

      const res = await vtsOperationCenterService.search(params);
      if (requestId !== listRequestId.current) return;
      setDataSource(res.items || []);
      setTotal(res.total || 0);

      if (shouldIncludeCounts && res.statusCounts) {
        setStatusCounts(res.statusCounts);
        statusCountFilterKey.current = currentStatusCountFilterKey;
      }
    } catch (err: unknown) {
      if (requestId !== listRequestId.current) return;
      setIsError(true);
      setErrorMessage(err instanceof Error ? err.message : 'Không thể tải danh sách');
    } finally {
      if (requestId === listRequestId.current) setLoading(false);
    }
  }, [
    page, pageSize, filterName, filterCode, filterConditionStatus, filterApprovalStatus,
    filterOrgUnitId, filterPortId, filterVtsSystemId, filterProvinceId,
    filterUpdatedFrom, filterUpdatedTo, sortField, sortDirection,
  ]);

  useEffect(() => {
    let mounted = true;
    queueMicrotask(() => {
      if (mounted) {
        void fetchData();
      }
    });
    return () => {
      mounted = false;
    };
  }, [fetchData]);

  const handleSort = useCallback((field: string, order: 'asc' | 'desc') => {
    setSortField(field);
    setSortDirection(order);
    setPage(1);
  }, []);

  const sortOrderFor = useCallback((key: string): 'ascend' | 'descend' | null =>
    (sortField === key ? (sortDirection === 'asc' ? 'ascend' : 'descend') : null), [sortField, sortDirection]);

  const serverSideSorter = () => 0;

  const refreshList = useCallback(() => {
    statusCountFilterKey.current = null;
    void fetchData();
  }, [fetchData]);

  // ── Delete confirmation modal (Chuẩn Bến cảng) ───────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<VtsOperationCenterListItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openDeleteModal = useCallback((record: VtsOperationCenterListItem) => {
    setDeletingRecord(record);
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingRecord) return;
    setDeleteLoading(true);
    try {
      await vtsOperationCenterService.delete(deletingRecord.id);
      toast.success('Đã xóa trung tâm điều hành VTS');
      setDeleteModalOpen(false);
      setDeletingRecord(null);
      refreshList();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingRecord, refreshList]);

  const openApproveModal = (id: string, level: 'c1' | 'c2') => {
    setApproveTargetId(id);
    setApproveLevel(level);
    setApproveModalOpen(true);
  };

  const handleApprove = async (content: string) => {
    if (!approveTargetId) return;
    try {
      if (approveLevel === 'c1') {
        const res = await vtsOperationCenterService.approveC1(approveTargetId, 'APPROVED', content);
        toast.success(res?.message || 'Phê duyệt cấp Cảng vụ/Chi cục thành công');
      } else {
        const res = await vtsOperationCenterService.approveC2(approveTargetId, 'APPROVED', content);
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
      const res = await vtsOperationCenterService.reject(rejectTargetId, rejectReason.trim());
      toast.success(res?.message || 'Từ chối phê duyệt hồ sơ thành công');
      setRejectModalOpen(false);
      refreshList();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi từ chối');
    }
  };

  const handleViewHistory = (record: VtsOperationCenterListItem) => {
    setSelectedRecord(record as unknown as VtsOperationCenterResponse);
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
        const history = await vtsOperationCenterService.getHistory(historyTargetId, 0, HISTORY_PAGE_SIZE, {
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
      const history = await vtsOperationCenterService.getHistory(historyTargetId, nextPage, HISTORY_PAGE_SIZE, {
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
    setFilterName(typeof vals.name === 'string' ? vals.name.trim() : '');
    setFilterCode(typeof vals.code === 'string' ? vals.code.trim() : '');
    setFilterConditionStatus(vals.conditionStatus as ConditionStatus | undefined);
    setFilterOrgUnitId(vals.orgUnitId as string | undefined);
    setFilterPortId(vals.portId as string | undefined);
    setFilterVtsSystemId(vals.vtsSystemId as string | undefined);
    setFilterProvinceId(typeof vals.provinceId === 'number' ? vals.provinceId : undefined);
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
    setFilterPortId(undefined);
    setFilterVtsSystemId(undefined);
    setFilterProvinceId(undefined);
    setFilterUpdatedFrom(undefined);
    setFilterUpdatedTo(undefined);
    setFilterValues(defaultOrg ? { orgUnitId: defaultOrg } : {});
    setPage(1);
  };

  const isRejectedTab = filterApprovalStatus === ApprovalStatus.REJECTED_LEVEL1 || filterApprovalStatus === ApprovalStatus.REJECTED_LEVEL2;

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
      label: 'Tên / Mã trung tâm điều hành VTS',
      dataIndex: 'name',
      width: 260,
      fixed: 'left' as const,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('name'),
      render: (_: unknown, record: VtsOperationCenterListItem) => (
        <div
          style={{ cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          onClick={() => {
            setEditingId(record.id);
            setSelectedRecord(record as unknown as VtsOperationCenterResponse);
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
      render: (v: string) => <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: fontWeightBold }} title={v}>{v || '—'}</div>,
    },
    {
      key: 'portName',
      label: 'Thuộc cảng biển',
      dataIndex: 'portName',
      width: 200,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('portName'),
      render: (v: string) => <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</div>,
    },
    {
      key: 'vtsSystemName',
      label: 'Thuộc hệ thống VTS',
      dataIndex: 'vtsSystemName',
      width: 220,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('vtsSystemName'),
      render: (v: string) => <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</div>,
    },
    {
      key: 'province',
      label: 'Địa điểm (Tỉnh/TP)',
      dataIndex: 'provinceId',
      width: 180,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('provinceId'),
      render: (_: unknown, r: VtsOperationCenterListItem) => {
        const val = r.provinceName || getProvinceNameById(r.provinceId) || '—';
        return <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={val}>{val}</div>;
      },
    },
    {
      key: 'conditionStatus',
      label: 'Tình trạng',
      dataIndex: 'conditionStatus',
      width: 160,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('conditionStatus'),
      render: (v: string) => {
        const label = CONDITION_STATUS_MAP[v as ConditionStatus] || v;
        const color = CONDITION_COLOR[v as ConditionStatus] || textSecondary;
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
      width: 280,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('approvalStatus'),
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
      render: (_: unknown, record: VtsOperationCenterListItem) => {
        const name = record.updatedByName || record.createdByName || '—';
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
  ], [page, pageSize, sortOrderFor, isRejectedTab]);

  const rowActions = useCallback((record: VtsOperationCenterListItem) => {
    const uid = currentUser?.userId || currentUser?.id;
    const isCreator = Boolean(uid && record.createdBy === uid);
    const isApproverL1 = Boolean(uid && record.approverLevel1 === uid);
    const userUnitType = currentUser?.unitType || '';
    const isAdmin = (currentUser as any)?.role === 'SUPER_ADMIN' || (currentUser as any)?.role === 'ADMIN' || (currentUser as any)?.roleName === 'SUPER_ADMIN' || (currentUser as any)?.roleName === 'ADMIN';
    const isCucLevel = !userUnitType || userUnitType === 'CHUYEN_VIEN_CUC' || userUnitType === 'LANH_DAO_CUC' || userUnitType === 'CUC' || userUnitType === 'CUC_HANG_HAI' || isAdmin;
    const actions: { key: string; label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean; disabled?: boolean }[] = [
      {
        key: 'detail',
        label: 'Xem chi tiết',
        icon: icons.view,
        onClick: () => {
          setEditingId(record.id);
          setSelectedRecord(record as unknown as VtsOperationCenterResponse);
          setModalMode('detail');
          setIsModalOpen(true);
        },
      },
    ];

    if (canEditApprovalRecord(record.approvalStatus, { hasPerm, resource: 'vtsoperationcenter' })) {
      actions.push({
        key: 'edit',
        label: 'Chỉnh sửa',
        icon: icons.edit,
        onClick: () => {
          setEditingId(record.id);
          setSelectedRecord(record as unknown as VtsOperationCenterResponse);
          setModalMode('edit');
          setIsModalOpen(true);
        },
      });
    }

    if (hasPerm('vtsoperationcenter:history')) {
      actions.push({
        key: 'history',
        label: 'Lịch sử',
        icon: icons.history,
        onClick: () => handleViewHistory(record),
      });
    }

    if (hasPerm('vtsoperationcenter:update') && (record.approvalStatus === ApprovalStatus.DRAFT || record.approvalStatus === ApprovalStatus.REJECTED_LEVEL1 || record.approvalStatus === ApprovalStatus.REJECTED_LEVEL2)) {
      actions.push({
        key: 'submit',
        label: 'Gửi duyệt',
        icon: icons.submit,
        onClick: async () => {
          try {
            const res = await vtsOperationCenterService.submit(record.id);
            toast.success(res?.message || 'Gửi phê duyệt thành công');
            refreshList();
          } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Lỗi gửi duyệt');
          }
        },
      });
    }

    if ((hasPerm('vtsoperationcenter:approvec1') || hasPerm('vts:approvec1') || hasPerm('data:approvec1') || hasPerm('data:approve') || isAdmin) && record.approvalStatus === ApprovalStatus.PENDING_APPROVAL && (!isCreator || isCucLevel || isAdmin)) {
      actions.push({
        key: 'approve_c1',
        label: 'Phê duyệt cấp Cảng vụ/Chi cục',
        icon: icons.approve,
        onClick: () => openApproveModal(record.id, 'c1'),
      });
      actions.push({
        key: 'reject_c1',
        label: 'Từ chối cấp Cảng vụ/Chi cục',
        icon: icons.reject,
        danger: true,
        onClick: () => openRejectModal(record.id),
      });
    }

    if ((hasPerm('vtsoperationcenter:approvec2') || hasPerm('vts:approvec2') || hasPerm('data:approvec2') || hasPerm('data:approve') || isAdmin || isCucLevel) && record.approvalStatus === ApprovalStatus.APPROVED_LEVEL1 && (!isApproverL1 || isCucLevel || isAdmin)) {
      actions.push({
        key: 'approve_c2',
        label: 'Phê duyệt cấp Cục',
        icon: icons.approve,
        onClick: () => openApproveModal(record.id, 'c2'),
      });
      actions.push({
        key: 'reject_c2',
        label: 'Từ chối cấp Cục',
        icon: icons.reject,
        danger: true,
        onClick: () => openRejectModal(record.id),
      });
    }

    if (canDeleteApprovalRecord(record.approvalStatus, { hasPerm, resource: 'vtsoperationcenter' })) {
      actions.push({
        key: 'delete',
        label: 'Xóa',
        icon: icons.delete,
        danger: true,
        onClick: () => openDeleteModal(record),
      });
    }

    return actions;
  }, [currentUser?.userId, currentUser?.id, hasPerm, refreshList, openDeleteModal]);

  return (
    <ThemeTokenProvider tokens={customVtsTokens}>
      <div className="vts-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <VtsOperationCenterGlobalStyles />
        <ScreenHeader
          breadcrumb={[
            { label: 'Tài sản KCHTGT' },
            { label: 'Trung tâm điều hành VTS' },
          ]}
          actions={
            (hasPerm('vtsoperationcenter:create') || hasPerm('vts:create'))
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
              {/* ── BỘ LỌC CƠ BẢN (LUÔN HIỂN THỊ) — Chuẩn Bến cảng: 1. ĐVQL, 2. Tên KCHT, 3. Tình trạng ── */}
              <div style={{ marginBottom: 12, marginTop: spaceMd }}>
                <div style={filterLabelStyle}>Đơn vị quản lý</div>
                <FilterOrgUnitTreeSelect
                  organizations={orgUnitOptions}
                  placeholder="Tất cả"
                  allowClear
                  value={filterValues.orgUnitId as string | undefined}
                  onChange={(value) => {
                    setFilterValues((prev) => ({ ...prev, orgUnitId: value, portId: undefined, vtsSystemId: undefined }));
                  }}
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={filterLabelStyle}>Tên trung tâm điều hành VTS</div>
                <Input
                  placeholder="Tìm theo tên trung tâm điều hành VTS"
                  allowClear
                  value={(filterValues.name as string) || ''}
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
                  value={filterValues.conditionStatus as ConditionStatus | undefined}
                  onChange={(value) => setFilterValues((prev) => ({ ...prev, conditionStatus: value }))}
                  options={CONDITION_STATUS_OPTIONS}
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                />
              </div>

              {/* ── BỘ LỌC NÂNG CAO (ẨN / HIỆN THEO NÚT BỘ LỌC NÂNG CAO) ── */}
              {filterCollapsed && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <div style={filterLabelStyle}>Thuộc cảng biển</div>
                    <Select
                      placeholder="Chọn cảng biển"
                      allowClear
                      showSearch
                      filterOption={(input, option) =>
                        normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))
                      }
                      value={filterValues.portId as string | undefined}
                      onChange={(value) => setFilterValues((prev) => ({ ...prev, portId: value }))}
                      options={filteredPortOptions.map((p) => ({
                        value: p.id,
                        label: p.portCode ? `${p.portCode} - ${p.portName || ''}` : (p.portName || p.id),
                      }))}
                      style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                    />
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={filterLabelStyle}>Thuộc hệ thống VTS</div>
                    <Select
                      placeholder="Chọn hệ thống VTS"
                      allowClear
                      showSearch
                      filterOption={(input, option) =>
                        normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))
                      }
                      value={filterValues.vtsSystemId as string | undefined}
                      onChange={(value) => setFilterValues((prev) => ({ ...prev, vtsSystemId: value }))}
                      options={filteredVtsSystemOptions.map((v) => ({
                        value: v.id,
                        label: v.code ? `${v.code} - ${v.name || ''}` : (v.name || v.id),
                      }))}
                      style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                    />
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={filterLabelStyle}>Mã trung tâm điều hành VTS</div>
                    <Input
                      placeholder="Tìm theo mã trung tâm điều hành VTS"
                      allowClear
                      value={(filterValues.code as string) || ''}
                      onChange={(event) => setFilterValues((prev) => ({ ...prev, code: event.target.value }))}
                      onPressEnter={() => handleFilterSearch(filterValues)}
                      style={{ borderRadius: radiusPill, height: 40 }}
                    />
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={filterLabelStyle}>Địa điểm (Tỉnh/Thành Phố)</div>
                    <Select
                      placeholder="Chọn tỉnh/thành phố"
                      allowClear
                      showSearch
                      filterOption={(input, option) =>
                        normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))
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
          <VtsOperationCenterForm
            open={true}
            editId={editingId}
            initialData={selectedRecord}
            mode={modalMode}
            orgUnits={orgUnitOptions}
            portOptions={portOptions}
            vtsSystemOptions={vtsSystemOptions}
            onCancel={() => { setIsModalOpen(false); setEditingId(null); setSelectedRecord(null); }}
            onSuccess={() => { setIsModalOpen(false); setEditingId(null); setSelectedRecord(null); refreshList(); }}
          />
        )}

        {/* ── History drawer ────────────────────────────────────────── */}
        <CommonHistoryDrawer
          open={historyModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          entityName={selectedRecord?.name || (selectedRecord as any)?.code || 'Trung tâm điều hành VTS'}
          records={historyRecords}
          loading={loadingHistory}
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
          itemType="trung tâm điều hành VTS"
          itemName={deletingRecord?.name}
          itemCode={deletingRecord?.code}
        />
      </div>
    </ThemeTokenProvider>
  );
}

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Input, DatePicker, Select } from 'antd';
import { vtsSystemCRUD, vtsSystemApproval } from '../../services/vtsSystemService';
import type { VtsSystemResponse, ListParams, ApprovalRequest } from '../../types/vtsSystem';
import { ConditionStatus, ApprovalStatus, CONDITION_STATUS_OPTIONS } from '../../types/vtsSystem';
import { ScreenHeader, DataTable } from '../../components/list-view';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import Pagination from '../../components/list-view/Pagination';
import VtsSystemForm, { invalidateVtsDetailCache } from './VtsSystemForm';
import CommonHistoryDrawer, { type CommonHistoryEntry } from '../../components/shared/CommonHistoryDrawer';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import toast from '../../components/ToastNotification';
import { useKchtPermissions } from '../../hooks/useKchtPermissions';
import { useKchtRowActions } from '../../hooks/useKchtRowActions';
import { KchtApprovalModals } from '../../components/kcht/KchtApprovalModals';
import {
  textSecondary, textTertiary,
  fontWeightBold,
  spaceSm, spaceMd,
  statusOperational, statusCritical, statusAttention,
  statusBadgeStyle, icons, cellTitleStyle, cellSubtitleStyle,
  colors, radiusPill, getRangePickerProps,
} from '../../themetokenchk';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import dayjs from 'dayjs';
import { getProvinceNameById, VIETNAM_PROVINCE_OPTIONS } from '../../types/common';
import { FilterOrgUnitTreeSelect, normalizeSearchText, resolveDefaultOrgUnitId, resolveOrgSubtreeIds, type OrgUnitTreeOption } from '../../components/org-unit';
import { useStandardApprovalStatusTabs } from '../../components/shared/approvalStatusTabs';

const fontSizeMd = 13.5;

const filterLabelStyle: React.CSSProperties = {
  color: colors.sidebarBg,
  fontWeight: fontWeightBold,
  fontSize: fontSizeMd,
  marginBottom: spaceSm,
};

const CONDITION_STYLE_MAP: Record<string, { color: string; label: string }> = {
  OPERATIONAL: { color: statusOperational, label: 'Đang khai thác/vận hành' },
  DANG_KHAI_THAC: { color: statusOperational, label: 'Đang khai thác/vận hành' },
  DANG_HOAT_DONG: { color: statusOperational, label: 'Đang khai thác/vận hành' },
  NOT_YET_OPERATIONAL: { color: statusAttention, label: 'Chưa khai thác/vận hành' },
  CHUA_KHAI_THAC: { color: statusAttention, label: 'Chưa khai thác/vận hành' },
  UNDER_CONSTRUCTION: { color: statusAttention, label: 'Chưa khai thác/vận hành' },
  SUSPENDED: { color: statusCritical, label: 'Dừng khai thác/vận hành' },
  STOPPED: { color: statusCritical, label: 'Dừng khai thác/vận hành' },
  DUNG_KHAI_THAC: { color: statusCritical, label: 'Dừng khai thác/vận hành' },
  MAINTENANCE: { color: statusAttention, label: 'Đang bảo trì' },
};

const HISTORY_PAGE_SIZE = 20;

type VtsListFilterValues = {
  orgUnitId?: string;
  portId?: string;
  systemName?: string;
  code?: string;
  conditionStatus?: ConditionStatus;
  approvalStatus?: ApprovalStatus;
  provinceId?: number;
  operationDateRange?: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null;
  updateDateRange?: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null;
};

const VtsSystemGlobalStyles = React.memo(() => (
  <style>{`
    /* ── Cỡ chữ 13.5px chuẩn toàn màn Hệ thống VTS & filter sidebar ── */
    .vts-page-wrapper,
    .vts-page-wrapper .ant-table,
    .vts-page-wrapper .ant-table-cell,
    .vts-page-wrapper .ant-table-thead > tr > th,
    .vts-page-wrapper .ant-table-tbody > tr > td,
    .vts-page-wrapper .ant-input,
    .vts-page-wrapper .ant-select,
    .vts-page-wrapper .ant-select-selector,
    .vts-page-wrapper .ant-select-selection-item,
    .vts-page-wrapper .ant-select-selection-placeholder,
    .vts-page-wrapper .ant-select-selection-search-input,
    .vts-page-wrapper .ant-select-item-option-content,
    .vts-page-wrapper .ant-tree-select,
    .vts-page-wrapper .ant-tree-select .ant-select-selection-item,
    .vts-page-wrapper .ant-tree-select .ant-select-selection-placeholder,
    .vts-page-wrapper .ant-picker,
    .vts-page-wrapper .ant-picker-input > input,
    .vts-page-wrapper .ant-picker-range-separator,
    .vts-page-wrapper .ant-btn,
    .vts-page-wrapper .ant-pagination,
    .vts-page-wrapper .ant-pagination-item,
    .vts-page-wrapper .ant-pagination-total-text,
    .vts-page-wrapper .ant-breadcrumb,
    .vts-page-wrapper .ant-form-item-label > label,
    .vts-page-wrapper input::placeholder,
    .vts-page-wrapper .ant-picker-input > input::placeholder,
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

    /* ── Responsive StatusTabs: Căn giữa khi đủ chỗ, thanh cuộn ngang khi tràn màn hình ── */
    .vts-page-wrapper div:has(> button[aria-pressed]) {
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
    .vts-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar {
      height: 4px !important;
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
      padding: 4px 2px !important;
    }

    /* ── Responsive ScreenHeader co dãn đẹp khi zoom ── */
    .vts-page-wrapper > div:first-of-type {
      flex-wrap: wrap !important;
      gap: 10px !important;
    }

    .vts-drawer-scope .ant-drawer-extra .ant-btn,
    .vts-drawer-scope .ant-drawer-header-title .ant-btn {
      font-size: 18px !important;
      color: #64748B !important;
      width: 36px !important;
      height: 36px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
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

export default function VtsSystemList() {
  const kchtPerms = useKchtPermissions('vts');

  const customVtsTokens = useMemo(() => ({
    ...themeTokenChk,
    fontSizeMd: 13.5,
  }), []);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const defaultOrgUnitRef = useRef<string | undefined>(undefined);
  const [filterSystemName, setFilterSystemName] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [filterConditionStatus, setFilterConditionStatus] = useState<ConditionStatus | undefined>();
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<ApprovalStatus | undefined>();
  const [filterOrgUnitId, setFilterOrgUnitId] = useState<string | undefined>();
  const [filterPortId, setFilterPortId] = useState<string | undefined>();
  const [filterProvinceId, setFilterProvinceId] = useState<number | undefined>();
  const [filterOperationStartDateFrom, setFilterOperationStartDateFrom] = useState<string | undefined>();
  const [filterOperationStartDateTo, setFilterOperationStartDateTo] = useState<string | undefined>();
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState<string | undefined>();
  const [filterUpdatedTo, setFilterUpdatedTo] = useState<string | undefined>();
  const [orgUnitOptions, setOrgUnitOptions] = useState<OrgUnitTreeOption[]>([]);
  const [portOptions, setPortOptions] = useState<Array<{ id: string; portName?: string; portCode?: string; orgUnitId?: string }>>([]);
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [filterValues, setFilterValues] = useState<VtsListFilterValues>({});
  // Sắp xếp chạy ở server để áp dụng cho toàn bộ kết quả; nếu để antd tự sắp thì
  // chỉ 20 dòng của trang hiện tại được sắp, gây hiểu nhầm là đã sắp cả danh sách.
  const [sortField, setSortField] = useState<string | undefined>();
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('desc');

  const [dataSource, setDataSource] = useState<VtsSystemResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<VtsSystemResponse | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'detail'>('create');

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectLevel, setRejectLevel] = useState<'c1' | 'c2'>('c1');
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
  const [historyFilters, setHistoryFilters] = useState<{ keyword: string; fromDate?: string; toDate?: string }>({ keyword: '' });

  // Count tabs
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const statusCountFilterKey = useRef<string | null>(null);
  const listRequestId = useRef(0);
  const [isOptionsReady, setIsOptionsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [orgs, ports] = await Promise.all([
          vtsSystemCRUD.getScopedOrgUnitOptions(),
          vtsSystemCRUD.getScopedPortOptions(),
        ]);
        if (!mounted) return;
        const mappedOrgs = orgs.map((o: { id: string | number; code?: string; maDonVi?: string; name?: string; unitName?: string; tenDonVi?: string; parentId?: string | number }) => {
          const code = o.code || o.maDonVi;
          const name = o.name || o.unitName || o.tenDonVi || 'Đơn vị';
          return {
            id: String(o.id),
            name,
            code,
            parentId: o.parentId ? String(o.parentId) : undefined,
          };
        });
        setOrgUnitOptions(mappedOrgs);
        setPortOptions(ports || []);
        const resolvedDefault = resolveDefaultOrgUnitId(useAuthStore.getState().user, mappedOrgs);
        defaultOrgUnitRef.current = resolvedDefault;
        if (resolvedDefault) {
          setFilterOrgUnitId(resolvedDefault);
          setFilterValues((prev) => ({ ...prev, orgUnitId: resolvedDefault }));
        }
      } catch (e) {
        console.error('Failed to fetch org units / ports for filter', e);
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

  const filteredPortOptions = useMemo(() => {
    if (!filterValues.orgUnitId) return portOptions;
    const allowedOrgIds = resolveOrgSubtreeIds(orgUnitOptions, String(filterValues.orgUnitId));
    return portOptions.filter((p) => p.orgUnitId && allowedOrgIds.has(String(p.orgUnitId)));
  }, [portOptions, orgUnitOptions, filterValues.orgUnitId]);

  const fetchData = useCallback(async () => {
    const requestId = ++listRequestId.current;
    setLoading(true);
    setIsError(false);
    try {
      const currentStatusCountFilterKey = JSON.stringify([
        filterSystemName, filterCode, filterConditionStatus, filterOrgUnitId, filterPortId, filterProvinceId,
        filterOperationStartDateFrom, filterOperationStartDateTo, filterUpdatedFrom, filterUpdatedTo,
      ]);
      const shouldIncludeCounts = statusCountFilterKey.current !== currentStatusCountFilterKey;
      const params: ListParams & { includeCounts: boolean; sort?: string } = {
        page: page - 1, size: pageSize,
        systemName: filterSystemName || undefined,
        code: filterCode || undefined,
        conditionStatus: filterConditionStatus,
        approvalStatus: filterApprovalStatus,
        orgUnitId: filterOrgUnitId || undefined,
        portId: filterPortId || undefined,
        provinceId: filterProvinceId,
        operationStartDateFrom: filterOperationStartDateFrom,
        operationStartDateTo: filterOperationStartDateTo,
        updatedFrom: filterUpdatedFrom,
        updatedTo: filterUpdatedTo,
        includeCounts: shouldIncludeCounts,
        sort: sortField && sortDirection ? `${sortField},${sortDirection}` : undefined,
      };
      const res = await vtsSystemCRUD.list(params);
      if (requestId !== listRequestId.current) return;
      setDataSource(res.items);
      setTotal(res.total);

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
  }, [page, pageSize, filterSystemName, filterCode, filterConditionStatus, filterApprovalStatus, filterOrgUnitId, filterPortId, filterProvinceId,
    filterOperationStartDateFrom, filterOperationStartDateTo, filterUpdatedFrom, filterUpdatedTo,
    sortField, sortDirection]);

  useEffect(() => {
    if (!isOptionsReady) return;
    let mounted = true;
    queueMicrotask(() => {
      if (mounted) {
        void fetchData();
      }
    });
    return () => {
      mounted = false;
    };
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

  const refreshList = useCallback(() => {
    if (!isOptionsReady) return;
    statusCountFilterKey.current = null;
    void fetchData();
  }, [fetchData, isOptionsReady]);

  // ── Delete confirmation modal (Chuẩn Bến cảng) ───────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<VtsSystemResponse | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openDeleteModal = useCallback((record: VtsSystemResponse) => {
    if (!kchtPerms.canDelete(record)) {
      toast.warning('Bạn không có quyền xóa hệ thống VTS này');
      return;
    }
    setDeletingRecord(record);
    setDeleteModalOpen(true);
  }, [kchtPerms]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingRecord) return;
    if (!kchtPerms.canDelete(deletingRecord)) {
      toast.warning('Bạn không có quyền xóa hệ thống VTS này');
      setDeleteModalOpen(false);
      setDeletingRecord(null);
      return;
    }
    setDeleteLoading(true);
    try {
      await vtsSystemCRUD.delete(deletingRecord.id);
      invalidateVtsDetailCache(deletingRecord.id);
      toast.success('Đã xóa hệ thống VTS');
      setDeleteModalOpen(false);
      setDeletingRecord(null);
      refreshList();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingRecord, kchtPerms, refreshList]);

  const openApproveModal = (id: string, level: 'c1' | 'c2') => {
    setApproveTargetId(id);
    setApproveLevel(level);
    setApproveModalOpen(true);
  };

  const handleApprove = async (content: string) => {
    if (!approveTargetId) return;
    try {
      const payload: ApprovalRequest = { decision: 'APPROVED', reason: content };
      let res: { message?: string } | undefined;
      if (approveLevel === 'c1') {
        res = await vtsSystemApproval.approveC1(approveTargetId, payload);
        toast.success(res?.message || 'Phê duyệt cấp Cảng vụ/Chi cục thành công');
      } else {
        res = await vtsSystemApproval.approveC2(approveTargetId, payload);
        toast.success(res?.message || 'Phê duyệt cấp Cục thành công');
      }
      // Drawer chi tiết đọc từ cache dùng chung — không xóa thì lần mở sau vẫn
      // hiển thị trạng thái phê duyệt cũ.
      invalidateVtsDetailCache(approveTargetId);
      setApproveModalOpen(false);
      refreshList();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi phê duyệt');
    }
  };

  const openRejectModal = (id: string, level: 'c1' | 'c2') => {
    setRejectTargetId(id); setRejectLevel(level); setRejectReason(''); setRejectModalOpen(true);
  };

  const handleReject = async (reasonVal?: string) => {
    const finalReason = (reasonVal || rejectReason).trim();
    if (!finalReason || finalReason.length < 10) { toast.error('Lý do từ chối phải có ít nhất 10 ký tự'); return; }
    if (!rejectTargetId) return;
    try {
      const payload: ApprovalRequest = { decision: 'REJECTED', reason: finalReason };
      let res: { message?: string } | undefined;
      if (rejectLevel === 'c1') res = await vtsSystemApproval.approveC1(rejectTargetId, payload);
      else res = await vtsSystemApproval.approveC2(rejectTargetId, payload);
      invalidateVtsDetailCache(rejectTargetId);
      toast.success(res?.message || 'Từ chối phê duyệt hồ sơ thành công'); setRejectModalOpen(false); refreshList();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Lỗi từ chối'); }
  };

  // ── History drawer ──────────────────────────────────────────────

  const handleViewHistory = (record: VtsSystemResponse) => {
    setSelectedRecord(record);
    setHistoryModalOpen(true);
    setHistoryRecords([]);
    setLoadingHistory(false);
    setLoadingMoreHistory(false);
    setHasMoreHistory(true);
    setHistoryFilters({ keyword: '' });
    setHistoryPage(0);
  };

  useEffect(() => {
    if (!historyModalOpen || !selectedRecord) return;
    let cancelled = false;
    (async () => {
      setLoadingHistory(true);
      setLoadingMoreHistory(false);
      setHasMoreHistory(true);
      setHistoryRecords([]);
      setHistoryPage(0);
      try {
        const history = await vtsSystemApproval.getHistory(selectedRecord.id, 0, HISTORY_PAGE_SIZE, {
          keyword: historyFilters.keyword || undefined,
          fromDate: historyFilters.fromDate || undefined,
          toDate: historyFilters.toDate || undefined,
        });
        if (cancelled) return;
        const items = history || [];
        setHistoryRecords(items);
        setHasMoreHistory(items.length === HISTORY_PAGE_SIZE);
      } catch {
        if (!cancelled) toast.error('Không thể tải lịch sử');
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [historyModalOpen, selectedRecord, historyFilters]);

  const loadMoreHistory = async () => {
    if (!selectedRecord || loadingHistory || loadingMoreHistory || !hasMoreHistory) return;
    setLoadingMoreHistory(true);
    try {
      const nextPage = historyPage + 1;
      const history = await vtsSystemApproval.getHistory(selectedRecord.id, nextPage, HISTORY_PAGE_SIZE, {
        keyword: historyFilters.keyword || undefined,
        fromDate: historyFilters.fromDate || undefined,
        toDate: historyFilters.toDate || undefined,
      });
      if (history && history.length > 0) {
        setHistoryRecords(prev => [...prev, ...history]);
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

  // ── Table columns ───────────────────────────────────────────────

  const isRejectedTab = filterApprovalStatus === ApprovalStatus.REJECTED_LEVEL1 || filterApprovalStatus === ApprovalStatus.REJECTED_LEVEL2;

  const serverSideSorter = () => 0;

  const sortOrderFor = useCallback((key: string): 'ascend' | 'descend' | undefined => {
    if (sortField === key && sortDirection) return sortDirection === 'asc' ? 'ascend' : 'descend';
    return undefined;
  }, [sortField, sortDirection]);

  const columns = useMemo(() => [
    {
      key: 'stt',
      label: 'STT',
      width: 60,
      align: 'center' as const,
      fixed: 'left' as const,
      render: (_: unknown, __: unknown, index: number) => (
        <span style={{ fontSize: fontSizeMd }}>{(page - 1) * pageSize + index + 1}</span>
      ),
    },
    {
      key: 'systemName',
      label: 'Tên/Mã hệ thống VTS',
      dataIndex: 'systemName',
      width: 260,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('systemName'),
      fixed: 'left' as const,
      render: (val: string, record: VtsSystemResponse) => (
        <div>
          <a
            title={val}
            onClick={() => {
              setEditingId(record.id);
              setSelectedRecord(record);
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
      render: (val: string) => (
        <span style={{ fontWeight: fontWeightBold }} title={val}>{val || '—'}</span>
      ),
    },
    {
      key: 'portName',
      label: 'Thuộc cảng biển',
      dataIndex: 'portName',
      width: 220,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('portName'),
      render: (val: string) => (
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={val}>
          {val || '—'}
        </div>
      ),
    },
    {
      key: 'provinceId',
      label: 'Địa điểm (Tỉnh/Thành phố)',
      dataIndex: 'provinceId',
      width: 260,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('provinceId'),
      render: (_: unknown, record: VtsSystemResponse) => {
        const provinceName = record.provinceId ? getProvinceNameById(record.provinceId) : '—';
        return (
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={provinceName}>
            {provinceName}
          </div>
        );
      },
    },
    {
      key: 'operationStartDate',
      label: 'Thời gian bắt đầu hoạt động',
      dataIndex: 'operationStartDate',
      width: 280,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('operationStartDate'),
      render: (val: string) => (val ? dayjs(val).format('DD/MM/YYYY') : '—'),
    },
    {
      key: 'conditionStatus',
      label: 'Tình trạng',
      dataIndex: 'conditionStatus',
      // Badge dài nhất "Chưa khai thác/vận hành" cần đủ chỗ cả padding của ô.
      width: 220,
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
      width: 180,
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
      render: (val: string, record: VtsSystemResponse) => {
        const name = val || record.updatedByName || record.createdByName || '—';
        const date = record.updatedDate || record.createdDate;
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
    {
      key: 'owningOrgName',
      label: 'Đơn vị chủ quản',
      dataIndex: 'owningOrgName',
      width: 200,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('owningOrgName'),
      render: (val: string) => (
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={val}>
          {val || '—'}
        </div>
      ),
    },
    {
      key: 'operatingOrgName',
      label: 'Đơn vị vận hành',
      dataIndex: 'operatingOrgName',
      width: 200,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('operatingOrgName'),
      render: (val: string) => (
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={val}>
          {val || '—'}
        </div>
      ),
    },
  ], [page, pageSize, isRejectedTab, sortOrderFor]);

  const { rowActions } = useKchtRowActions<VtsSystemResponse>({
    resource: 'vts',
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
          const res = await vtsSystemApproval.submit(record.id);
          invalidateVtsDetailCache(record.id);
          toast.success(res?.message || 'Gửi phê duyệt thành công');
          refreshList();
        } catch (e: unknown) {
          toast.error(e instanceof Error ? e.message : 'Có lỗi xảy ra');
        }
      },
      onApproveL1: (record) => openApproveModal(record.id, 'c1'),
      onRejectL1: (record) => openRejectModal(record.id, 'c1'),
      onApproveL2: (record) => openApproveModal(record.id, 'c2'),
      onRejectL2: (record) => openRejectModal(record.id, 'c2'),
      onDelete: (record) => openDeleteModal(record),
    },
  });

  const { statusTabs, handleTabChange } = useStandardApprovalStatusTabs(
    statusCounts,
    filterApprovalStatus,
    (status) => {
      setFilterApprovalStatus(status);
      setFilterValues((prev) => ({ ...prev, approvalStatus: status }));
      setPage(1);
    }
  );

  const handleFilterSearch = useCallback((values: Record<string, unknown>) => {
    const systemName = typeof values.systemName === 'string' ? values.systemName.trim() : '';
    const code = typeof values.code === 'string' ? values.code.trim() : '';
    const orgUnitId = typeof values.orgUnitId === 'string' ? values.orgUnitId : undefined;
    const portId = typeof values.portId === 'string' ? values.portId : undefined;
    const provinceId = values.provinceId ? Number(values.provinceId) : undefined;
    const conditionStatus = values.conditionStatus as ConditionStatus | undefined;
    const approvalStatus = values.approvalStatus as ApprovalStatus | undefined;

    setFilterValues((prev) => ({
      ...prev,
      systemName,
      code,
    }));
    setFilterSystemName(systemName);
    setFilterCode(code);
    setFilterOrgUnitId(orgUnitId);
    setFilterPortId(portId);
    setFilterProvinceId(provinceId);
    setFilterConditionStatus(conditionStatus);
    setFilterApprovalStatus(approvalStatus);

    const opRange = values.operationDateRange as [dayjs.Dayjs, dayjs.Dayjs] | undefined;
    if (opRange && opRange[0] && opRange[1]) {
      setFilterOperationStartDateFrom(opRange[0].format('YYYY-MM-DD'));
      setFilterOperationStartDateTo(opRange[1].format('YYYY-MM-DD'));
    } else {
      setFilterOperationStartDateFrom(undefined);
      setFilterOperationStartDateTo(undefined);
    }

    const upRange = values.updateDateRange as [dayjs.Dayjs, dayjs.Dayjs] | undefined;
    if (upRange && upRange[0] && upRange[1]) {
      // Backend nhận LocalDateTime và BỎ QUA offset, nên `toISOString()` (giờ UTC)
      // làm cửa sổ lọc lệch đúng bằng chênh lệch múi giờ (VN: -7h) — hồ sơ cập nhật
      // sau 17h của ngày kết thúc bị loại oan. Gửi thẳng giờ địa phương.
      setFilterUpdatedFrom(upRange[0].startOf('day').format('YYYY-MM-DDTHH:mm:ss'));
      setFilterUpdatedTo(upRange[1].endOf('day').format('YYYY-MM-DDTHH:mm:ss'));
    } else {
      setFilterUpdatedFrom(undefined);
      setFilterUpdatedTo(undefined);
    }

    setPage(1);
  }, []);

  const handleFilterReset = useCallback(() => {
    const defaultOrg = defaultOrgUnitRef.current;
    setFilterSystemName('');
    setFilterCode('');
    setFilterOrgUnitId(defaultOrg);
    setFilterPortId(undefined);
    setFilterProvinceId(undefined);
    setFilterConditionStatus(undefined);
    setFilterApprovalStatus(undefined);
    setFilterOperationStartDateFrom(undefined);
    setFilterOperationStartDateTo(undefined);
    setFilterUpdatedFrom(undefined);
    setFilterUpdatedTo(undefined);
    setFilterValues(defaultOrg ? { orgUnitId: defaultOrg } : {});
    setPage(1);
    statusCountFilterKey.current = null;
  }, []);

  return (
    <ThemeTokenProvider tokens={customVtsTokens}>
    <div className="vts-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <VtsSystemGlobalStyles />
      <ScreenHeader
        breadcrumb={[{ label: 'Tài sản KCHTGT' }, { label: 'Hệ thống VTS' }]}
        actions={
          kchtPerms.canCreate
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
        onFilterReset={() => { setFilterValues({}); handleFilterReset(); }}
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
                  setFilterValues((prev) => ({ ...prev, orgUnitId: value, portId: undefined }));
                }}
                style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={filterLabelStyle}>Tên hệ thống VTS</div>
              <Input
                placeholder="Tìm theo tên hệ thống VTS"
                allowClear
                value={filterValues.systemName || ''}
                onChange={(event) => setFilterValues((prev) => ({ ...prev, systemName: event.target.value }))}
                onBlur={() => {
                  if (typeof filterValues.systemName === 'string') {
                    setFilterValues((prev) => ({ ...prev, systemName: prev.systemName.trim() }));
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
                value={filterValues.conditionStatus}
                onChange={(value) => setFilterValues((prev) => ({ ...prev, conditionStatus: value }))}
                options={CONDITION_STATUS_OPTIONS}
                style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
              />
            </div>

            {/* Bộ lọc nâng cao của VTS chỉ mở khi bấm nút filter ở footer. */}
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
                    value={filterValues.portId}
                    onChange={(value) => setFilterValues((prev) => ({ ...prev, portId: value }))}
                    options={filteredPortOptions.map((p) => ({
                      value: p.id,
                      label: p.portCode ? `${p.portCode} - ${p.portName || ''}` : (p.portName || p.id),
                    }))}
                    style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={filterLabelStyle}>Mã hệ thống VTS</div>
                  <Input
                    placeholder="Tìm theo mã hệ thống VTS"
                    allowClear
                    value={filterValues.code || ''}
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
                  <div style={filterLabelStyle}>Địa điểm (Tỉnh/Thành Phố)</div>
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
                  <div style={filterLabelStyle}>Thời gian bắt đầu hoạt động</div>
                  <DatePicker.RangePicker
                    {...getRangePickerProps()}
                    format="DD/MM/YYYY"
                    placeholder={['Từ ngày', 'Đến ngày']}
                    allowClear
                    value={filterValues.operationDateRange as [dayjs.Dayjs | null, dayjs.Dayjs | null] | undefined}
                    onChange={(dates) => setFilterValues((prev) => ({ ...prev, operationDateRange: dates }))}
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
        {/* chk vẫn hiện phân trang khi bảng rỗng (Tổng cộng: 0). */}
        <Pagination total={total} current={page} pageSize={pageSize} onChange={(p, ps) => { setPage(p); setPageSize(ps); }} />
      </FilterTableLayout>

      {/* Form tự quản lý Drawer để dùng cùng một lớp hiển thị như màn Cảng biển. */}
      {isModalOpen && (
        <VtsSystemForm
          open={true}
          editId={editingId}
          initialData={selectedRecord}
          mode={modalMode}
          orgUnits={orgUnitOptions}
          onCancel={() => { setIsModalOpen(false); setEditingId(null); setSelectedRecord(null); }}
          onSuccess={() => { setIsModalOpen(false); setEditingId(null); setSelectedRecord(null); refreshList(); }}
        />
      )}

      {/* ── History drawer ────────────────────────────────────────── */}
      <CommonHistoryDrawer
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        entityName={selectedRecord?.systemName || selectedRecord?.code}
        records={historyRecords}
        loading={loadingHistory}
        serverFiltered
        onFilterChange={handleHistoryFilterChange}
        onLoadMore={loadMoreHistory}
        loadingMore={loadingMoreHistory}
        variant="berth"
        fieldLabelMap={{
          scope: 'Phạm vi áp dụng',
          maritimeNotice: 'Thông báo hàng hải',
          operationStartDate: 'Thời gian bắt đầu hoạt động',
          address: 'Địa điểm chi tiết',
          operatingOrgId: 'Đơn vị khai thác',
          owningOrgId: 'Đơn vị chủ quản',
        }}
        formatValue={(fieldName, value) => {
          if (value == null || value === '') return '';
          const fn = String(fieldName || '').toLowerCase();
          if (fn.includes('condition') || fn.includes('tinhtrang') || fn === 'tinhtranghoatdong') {
            return themeTokenChk.getVtsConditionStatusLabel(value);
          }
          if (fn === 'operationstartdate' || fn.includes('startdate')) {
            if (/^\d{4}-\d{2}-\d{2}$/.test(String(value).trim())) {
              return dayjs(value).format('DD/MM/YYYY');
            }
          }
          return undefined;
        }}
      />

      {/* ── Standardized Approval, Reject & Delete Modals ─────────── */}
      <KchtApprovalModals
        approveOpen={approveModalOpen}
        approveLevel={approveLevel}
        onApproveConfirm={handleApprove}
        onApproveCancel={() => setApproveModalOpen(false)}

        rejectOpen={rejectModalOpen}
        rejectLevel={rejectLevel}
        onRejectConfirm={handleReject}
        onRejectCancel={() => setRejectModalOpen(false)}

        deleteOpen={deleteModalOpen}
        deleteLoading={deleteLoading}
        deletingItemType="hệ thống VTS"
        deletingItemName={deletingRecord?.systemName}
        deletingItemCode={deletingRecord?.code}
        onDeleteConfirm={handleConfirmDelete}
        onDeleteCancel={() => {
          if (!deleteLoading) {
            setDeleteModalOpen(false);
            setDeletingRecord(null);
          }
        }}
      />
    </div>
    </ThemeTokenProvider>
  );
}

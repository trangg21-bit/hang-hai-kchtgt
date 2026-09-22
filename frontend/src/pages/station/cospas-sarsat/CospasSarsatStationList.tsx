import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Modal, Input, DatePicker, Select } from 'antd';
import DeleteConfirmModal from '../../../components/shared/DeleteConfirmModal';
import { cospasSarsatStationService, type CospasSarsatListParams } from '../../../services/cospasSarsatStationService';
import { organizationService } from '../../../services/organizationService';
import type { CoastalStationCospasSarsatResponse } from '../../../services/station/types';
import { ConditionStatus, ApprovalStatus, CONDITION_STATUS_OPTIONS } from '../../../types/vtsSystem';
import { useAuthStore, type AuthState } from '../../../store/authStore';
import { usePermissionStore, type PermissionState } from '../../../store/permissionStore';
import { ScreenHeader, DataTable } from '../../../components/list-view';
import FilterTableLayout from '../../../components/list-view/FilterTableLayout';
import Pagination from '../../../components/list-view/Pagination';
import CospasSarsatStationForm from './CospasSarsatStationForm';
import ApprovalModal from '../../../components/shared/ApprovalModal';
import CommonHistoryDrawer, { type CommonHistoryEntry } from '../../../components/shared/CommonHistoryDrawer';
import ApprovalStatusBadge from '../../../components/shared/ApprovalStatusBadge';
import toast from '../../../components/ToastNotification';
import {
  textSecondary, textTertiary,
  fontWeightBold,
  spaceSm, spaceMd, spaceFormField,
  statusOperational, statusCritical, statusAttention,
  statusBadgeStyle, icons, textAreaStyle, cellTitleStyle, cellSubtitleStyle,
  colors, radiusPill, getRangePickerProps,
} from '../../../themetokenchk';
import * as themeTokenChk from '../../../themetokenchk';
import { ThemeTokenProvider } from '../../../context/ThemeTokenContext';
import dayjs from 'dayjs';
import { getProvinceNameById, VIETNAM_PROVINCE_OPTIONS } from '../../../types/common';
import { FilterOrgUnitTreeSelect, normalizeSearchText, resolveDefaultOrgUnitId, type OrgUnitTreeOption } from '../../../components/org-unit';
import { canEditApprovalRecord, canDeleteApprovalRecord } from '../../../utils/approvalEditPolicy';
import { isCucLevelUser } from '../../../hooks/useKchtPermissions';
import { useStandardApprovalStatusTabs } from '../../../components/shared/approvalStatusTabs';
import { getOperatingOrgName } from './CospasSarsatStationDetailContent';
import { formatMaritimeServicesDisplay } from '../../../constants/maritimeServices';

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

const CospasSarsatGlobalStyles = React.memo(() => (
  <style>{`
    /* ── Cỡ chữ 13.5px chuẩn toàn màn Đài Cospas-Sarsat & filter sidebar ── */
    .cospas-page-wrapper,
    .cospas-page-wrapper .ant-table,
    .cospas-page-wrapper .ant-table-cell,
    .cospas-page-wrapper .ant-table-thead > tr > th,
    .cospas-page-wrapper .ant-table-tbody > tr > td,
    .cospas-page-wrapper .ant-input,
    .cospas-page-wrapper .ant-select,
    .cospas-page-wrapper .ant-select-selector,
    .cospas-page-wrapper .ant-select-selection-item,
    .cospas-page-wrapper .ant-select-selection-placeholder,
    .cospas-page-wrapper .ant-select-selection-search-input,
    .cospas-page-wrapper .ant-select-item-option-content,
    .cospas-page-wrapper .ant-tree-select,
    .cospas-page-wrapper .ant-tree-select .ant-select-selection-item,
    .cospas-page-wrapper .ant-tree-select .ant-select-selection-placeholder,
    .cospas-page-wrapper .ant-picker,
    .cospas-page-wrapper .ant-picker-input > input,
    .cospas-page-wrapper .ant-picker-range-separator,
    .cospas-page-wrapper .ant-btn,
    .cospas-page-wrapper .ant-pagination,
    .cospas-page-wrapper .ant-pagination-item,
    .cospas-page-wrapper .ant-pagination-total-text,
    .cospas-page-wrapper .ant-breadcrumb,
    .cospas-page-wrapper .ant-form-item-label > label,
    .cospas-page-wrapper input::placeholder,
    .cospas-page-wrapper .ant-picker-input > input::placeholder,
    .cospas-sarsat-drawer-scope,
    .cospas-sarsat-drawer-scope .ant-drawer-content,
    .cospas-sarsat-drawer-scope .ant-tabs-tab,
    .cospas-sarsat-drawer-scope .chk-detail-label,
    .cospas-sarsat-drawer-scope .chk-detail-value,
    .cospas-sarsat-drawer-scope .ant-table,
    .cospas-sarsat-drawer-scope .ant-table-cell,
    .cospas-sarsat-drawer-scope .ant-table-thead > tr > th,
    .cospas-sarsat-drawer-scope .ant-btn,
    .cospas-sarsat-drawer-scope .ant-select,
    .cospas-sarsat-drawer-scope .ant-input,
    .cospas-sarsat-drawer-scope .ant-form-item-label > label {
      font-size: 13.5px !important;
    }

    /* ── Responsive StatusTabs: Căn giữa khi đủ chỗ, thanh cuộn ngang khi tràn màn hình ── */
    .cospas-page-wrapper div:has(> button[aria-pressed]) {
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
    .cospas-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar {
      height: 4px !important;
      display: block !important;
    }
    .cospas-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-track {
      background: #f1f5f9 !important;
      border-radius: 999px !important;
    }
    .cospas-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb {
      background: #cbd5e1 !important;
      border-radius: 999px !important;
    }
    .cospas-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb:hover {
      background: #94a3b8 !important;
    }
    .cospas-page-wrapper div:has(> button[aria-pressed]) > button {
      white-space: nowrap !important;
      flex-shrink: 0 !important;
      cursor: pointer !important;
      padding: 4px 2px !important;
    }

    /* ── Responsive ScreenHeader co dãn đẹp khi zoom ── */
    .cospas-page-wrapper > div:first-of-type {
      flex-wrap: wrap !important;
      gap: 10px !important;
    }

    .cospas-sarsat-drawer-scope .ant-drawer-extra .ant-btn,
    .cospas-sarsat-drawer-scope .ant-drawer-header-title .ant-btn {
      font-size: 18px !important;
      color: #64748B !important;
      width: 36px !important;
      height: 36px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
    }

    /* ── Responsive Drawers: Không tràn viền khi màn hình nhỏ / zoom cao ── */
    .cospas-sarsat-drawer-scope .ant-drawer-content-wrapper {
      max-width: 100vw !important;
    }
    @media (max-width: 1024px) {
      .cospas-sarsat-drawer-scope .chk-detail-grid {
        grid-template-columns: 1fr !important;
        column-gap: 0 !important;
      }
      .cospas-sarsat-drawer-scope .chk-detail-row--full {
        grid-column: 1 !important;
      }
    }
    @media (max-width: 640px) {
      .cospas-sarsat-drawer-scope .chk-detail-row {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 4px !important;
        padding: 8px 0 !important;
      }
      .cospas-sarsat-drawer-scope .chk-detail-label {
        width: 100% !important;
      }
      .cospas-sarsat-drawer-scope .chk-detail-value {
        width: 100% !important;
      }
    }
  `}</style>
));

export default function CospasSarsatStationList() {
  const currentUser = useAuthStore((s: AuthState) => s.user);
  const hasPerm = usePermissionStore((s: PermissionState) => s.hasPermission);

  const customTokens = useMemo(() => ({
    ...themeTokenChk,
    fontSizeMd: 13.5,
  }), []);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const defaultOrgUnitRef = useRef<string | undefined>(undefined);
  const [filterStationName, setFilterStationName] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [filterConditionStatus, setFilterConditionStatus] = useState<ConditionStatus | undefined>();
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<ApprovalStatus | undefined>();
  const [filterOrgUnitId, setFilterOrgUnitId] = useState<string | undefined>();
  const [filterProvinceId, setFilterProvinceId] = useState<number | undefined>();
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState<string | undefined>();
  const [filterUpdatedTo, setFilterUpdatedTo] = useState<string | undefined>();
  const [organizations, setOrganizations] = useState<OrgUnitTreeOption[]>([]);
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [sortField, setSortField] = useState<string | undefined>();
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('desc');

  const [dataSource, setDataSource] = useState<CoastalStationCospasSarsatResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<CoastalStationCospasSarsatResponse | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'detail'>('create');

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectLevel, setRejectLevel] = useState<'c1' | 'c2'>('c1');
  const [rejectReason, setRejectReason] = useState('');

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveTargetId, setApproveTargetId] = useState<string | null>(null);
  const [approveLevel, setApproveLevel] = useState<'c1' | 'c2'>('c1');

  // Delete confirmation modal (Chuẩn Bến cảng)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<CoastalStationCospasSarsatResponse | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // History drawer state
  const HISTORY_PAGE_SIZE = 20;
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<CommonHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyFilters, setHistoryFilters] = useState<{ keyword?: string; fromDate?: string; toDate?: string }>({});

  // Count tabs
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const statusCountFilterKey = useRef<string | null>(null);
  const listRequestId = useRef(0);
  const [isLookupReady, setIsLookupReady] = useState(false);

  const canCreate = hasPerm('coastalstationcospassarsat:create');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const orgs = await organizationService.getAll();
        if (!mounted) return;
        const mappedOrgs: OrgUnitTreeOption[] = (orgs || []).map((o: any) => ({
          id: String(o.id),
          name: o.name || o.unitName || 'Đơn vị',
          code: o.code || o.maDonVi,
          parentId: o.parentId ? String(o.parentId) : undefined,
        }));
        setOrganizations(mappedOrgs);
        const resolvedDefault = resolveDefaultOrgUnitId(useAuthStore.getState().user, mappedOrgs);
        defaultOrgUnitRef.current = resolvedDefault;
        if (resolvedDefault) {
          setFilterOrgUnitId(resolvedDefault);
          setFilterValues((prev) => ({ ...prev, orgUnitId: resolvedDefault }));
        }
      } catch (e) {
        console.error('Failed to fetch org units for filter', e);
      } finally {
        if (mounted) setIsLookupReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const fetchData = useCallback(async () => {
    const requestId = ++listRequestId.current;
    setLoading(true);
    setIsError(false);
    try {
      const currentStatusCountFilterKey = JSON.stringify([
        filterStationName, filterCode, filterConditionStatus, filterOrgUnitId, filterProvinceId,
        filterUpdatedFrom, filterUpdatedTo,
      ]);
      const shouldIncludeCounts = statusCountFilterKey.current !== currentStatusCountFilterKey;
      const params: CospasSarsatListParams = {
        page,
        size: pageSize,
        name: filterStationName || undefined,
        code: filterCode || undefined,
        conditionStatus: filterConditionStatus,
        approvalStatus: filterApprovalStatus,
        orgUnitId: filterOrgUnitId || undefined,
        provinceId: filterProvinceId,
        updatedFrom: filterUpdatedFrom,
        updatedTo: filterUpdatedTo,
        sort: sortField && sortDirection ? `${sortField},${sortDirection}` : undefined,
        includeCounts: shouldIncludeCounts,
      };
      const res = await cospasSarsatStationService.search(params);
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
  }, [page, pageSize, filterStationName, filterCode, filterConditionStatus, filterApprovalStatus, filterOrgUnitId, filterProvinceId,
    filterUpdatedFrom, filterUpdatedTo, sortField, sortDirection]);

  useEffect(() => {
    if (!isLookupReady) return;
    let mounted = true;
    queueMicrotask(() => {
      if (mounted) void fetchData();
    });
    return () => {
      mounted = false;
    };
  }, [fetchData, isLookupReady]);

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
    if (!isLookupReady) return;
    statusCountFilterKey.current = null;
    void fetchData();
  }, [fetchData, isLookupReady]);

  const openDeleteModal = useCallback((record: CoastalStationCospasSarsatResponse) => {
    setDeletingRecord(record);
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingRecord) return;
    setDeleteLoading(true);
    try {
      await cospasSarsatStationService.delete(deletingRecord.id);
      toast.success('Đã xóa đài Cospas-Sarsat');
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

  const handleApprove = async () => {
    if (!approveTargetId) return;
    try {
      if (approveLevel === 'c1') {
        await cospasSarsatStationService.approveLevel1(approveTargetId);
        toast.success('Phê duyệt cấp Cảng vụ/Chi cục thành công');
      } else {
        await cospasSarsatStationService.approveLevel2(approveTargetId);
        toast.success('Phê duyệt cấp Cục thành công');
      }
      setApproveModalOpen(false);
      refreshList();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi phê duyệt');
    }
  };

  const openRejectModal = (id: string, level: 'c1' | 'c2') => {
    setRejectTargetId(id);
    setRejectLevel(level);
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
      await cospasSarsatStationService.reject(rejectTargetId, rejectReason.trim());
      toast.success('Từ chối phê duyệt hồ sơ thành công');
      setRejectModalOpen(false);
      refreshList();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi từ chối');
    }
  };

  // ── History drawer ──────────────────────────────────────────────
  const handleViewHistory = (record: CoastalStationCospasSarsatResponse) => {
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
        const history = await cospasSarsatStationService.getHistory(selectedRecord.id, 0, HISTORY_PAGE_SIZE, {
          keyword: historyFilters.keyword || undefined,
          fromDate: historyFilters.fromDate || undefined,
          toDate: historyFilters.toDate || undefined,
        });
        if (cancelled) return;
        const items = (history || []) as unknown as CommonHistoryEntry[];
        setHistoryRecords(items);
        setHasMoreHistory(items.length === HISTORY_PAGE_SIZE);
      } catch {
        if (!cancelled) {
          toast.error('Không thể tải lịch sử thay đổi');
          setHistoryRecords([]);
        }
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();
    return () => { cancelled = true; };
  }, [historyModalOpen, selectedRecord, historyFilters]);

  const loadMoreHistory = async () => {
    if (!selectedRecord || loadingHistory || loadingMoreHistory || !hasMoreHistory) return;
    setLoadingMoreHistory(true);
    try {
      const nextPage = historyPage + 1;
      const history = await cospasSarsatStationService.getHistory(selectedRecord.id, nextPage, HISTORY_PAGE_SIZE, {
        keyword: historyFilters.keyword || undefined,
        fromDate: historyFilters.fromDate || undefined,
        toDate: historyFilters.toDate || undefined,
      });
      if (history && history.length > 0) {
        setHistoryRecords((prev) => [...prev, ...(history as unknown as CommonHistoryEntry[])]);
      }
      setHistoryPage(nextPage);
      setHasMoreHistory((history || []).length === HISTORY_PAGE_SIZE);
    } catch { /* ignore */ }
    finally { setLoadingMoreHistory(false); }
  };

  const handleHistoryFilterChange = useCallback((f: { keyword: string; fromDate: string; toDate: string }) => {
    setHistoryFilters(f);
  }, []);

  const isRejectedTab = filterApprovalStatus === ApprovalStatus.REJECTED_LEVEL1 ||
    filterApprovalStatus === ApprovalStatus.REJECTED_LEVEL2 ||
    (filterApprovalStatus as any) === 'REJECTED' ||
    (filterApprovalStatus as any) === 8 ||
    (filterApprovalStatus as any) === 9;

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
      key: 'name',
      label: 'Tên/Mã đài Cospas-Sarsat',
      dataIndex: 'name',
      width: 260,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('name'),
      fixed: 'left' as const,
      render: (val: string, record: CoastalStationCospasSarsatResponse) => {
        const name = record.stationName || record.name || val || '—';
        const code = record.stationCode || record.code || '—';
        return (
          <div>
            <a
              title={name}
              onClick={() => {
                setEditingId(record.id);
                setSelectedRecord(record);
                setModalMode('detail');
                setIsModalOpen(true);
              }}
              style={{ ...cellTitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {name}
            </a>
            <span
              title={code}
              style={{ ...cellSubtitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {code}
            </span>
          </div>
        );
      },
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
      render: (val: string, record: CoastalStationCospasSarsatResponse) => {
        const id = record.orgUnitId || record.unitId;
        const org = organizations.find((o) => String(o.id) === String(id));
        const displayName = org?.name || val || record.orgUnitName || '—';
        return (
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: fontWeightBold }} title={displayName}>
            {displayName}
          </div>
        );
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
      render: (val: string, record: CoastalStationCospasSarsatResponse) => {
        const opName = getOperatingOrgName(record.operatingOrgId, val || record.operatingOrgName);
        return (
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={opName}>
            {opName}
          </div>
        );
      },
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
      render: (_: unknown, record: CoastalStationCospasSarsatResponse) => {
        const provinceName = record.provinceName || (record.provinceId ? getProvinceNameById(record.provinceId) : '') || '—';
        return (
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={provinceName}>
            {provinceName}
          </div>
        );
      },
    },
    {
      key: 'conditionStatus',
      label: 'Tình trạng',
      dataIndex: 'conditionStatus',
      width: 220,
      ellipsis: false,
      render: (val: ConditionStatus | string) => {
        const s = CONDITION_STYLE_MAP[val] || { color: textTertiary, label: val || '—' };
        return <span style={statusBadgeStyle(s.color)}>{s.label}</span>;
      },
    },
    {
      key: 'approvalStatus',
      label: 'Trạng thái',
      dataIndex: 'approvalStatus',
      width: 260,
      ellipsis: false,
      render: (status: ApprovalStatus | string) => <ApprovalStatusBadge status={status} />,
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
      render: (val: string, record: CoastalStationCospasSarsatResponse) => {
        const name = val || record.updatedByName || record.updatedBy || record.createdByName || '—';
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
    {
      key: 'submittedAt',
      label: 'Ngày gửi phê duyệt',
      dataIndex: 'submittedAt',
      width: 200,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('submittedAt'),
      render: (val: string, record: CoastalStationCospasSarsatResponse) => {
        const name = record.submittedByName || record.submittedBy || '—';
        const date = val || record.submittedAt;
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
      key: 'approvedDateLevel1',
      label: 'Phê duyệt cấp Cảng vụ/Chi cục',
      dataIndex: 'approvedDateLevel1',
      width: 220,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('approvedDateLevel1'),
      render: (val: string, record: CoastalStationCospasSarsatResponse) => {
        const name = record.approverLevel1Name || record.approverLevel1 || '—';
        const date = val || record.approvedDateLevel1;
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
      key: 'approvedDateLevel2',
      label: 'Phê duyệt cấp Cục',
      dataIndex: 'approvedDateLevel2',
      width: 220,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('approvedDateLevel2'),
      render: (val: string, record: CoastalStationCospasSarsatResponse) => {
        const name = record.approverLevel2Name || record.approverLevel2 || '—';
        const date = val || record.approvedDateLevel2;
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
  ], [page, pageSize, isRejectedTab, organizations, sortOrderFor]);

  const rowActions = useCallback((record: CoastalStationCospasSarsatResponse) => {
    const uid = currentUser?.userId || currentUser?.id;
    const isCreator = Boolean(uid && (record.createdBy === uid || record.submittedBy === uid));
    const isApproverL1 = Boolean(uid && (record.approverLevel1 === uid || (record as any).approverLevel1Id === uid));
    const isAdmin = hasPerm('*') || hasPerm('admin:all');
    const isCucLevel = isCucLevelUser(currentUser) || isAdmin;

    const actions: { key: string; label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean; disabled?: boolean }[] = [];
    if (hasPerm('coastalstationcospassarsat:read') || hasPerm('specialstation:read') || hasPerm('data:read')) {
      actions.push({
        key: 'view',
        label: 'Xem chi tiết',
        icon: icons.view,
        onClick: () => {
          setEditingId(record.id);
          setSelectedRecord(record);
          setModalMode('detail');
          setIsModalOpen(true);
        },
      });
    }
    if (canEditApprovalRecord(record.approvalStatus, {
      hasPerm,
      resource: 'coastalstationcospassarsat',
    })) {
      actions.push({
        key: 'edit',
        label: 'Chỉnh sửa',
        icon: icons.edit,
        onClick: () => {
          setEditingId(record.id);
          setSelectedRecord(record);
          setModalMode('edit');
          setIsModalOpen(true);
        },
      });
    }
    if (hasPerm('coastalstationcospassarsat:history')) {
      actions.push({
        key: 'history',
        label: 'Lịch sử',
        icon: icons.history,
        onClick: () => handleViewHistory(record),
      });
    }
    if ((hasPerm('coastalstationcospassarsat:update') || hasPerm('specialstation:update') || hasPerm('data:update')) && (record.approvalStatus === ApprovalStatus.DRAFT || record.approvalStatus === ApprovalStatus.REJECTED_LEVEL1 || record.approvalStatus === ApprovalStatus.REJECTED_LEVEL2 || !record.approvalStatus)) {
      actions.push({
        key: 'submit',
        label: 'Gửi phê duyệt',
        icon: icons.submit,
        onClick: async () => {
          try {
            await cospasSarsatStationService.submit(record.id);
            toast.success('Gửi phê duyệt thành công');
            refreshList();
          } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Có lỗi xảy ra');
          }
        },
      });
    }
    if ((hasPerm('coastalstationcospassarsat:approvec1') || hasPerm('specialstation:approvec1') || hasPerm('data:approvec1')) && record.approvalStatus === ApprovalStatus.PENDING_APPROVAL && (!isCreator || isCucLevel || isAdmin)) {
      actions.push({
        key: 'approveC1',
        label: 'Phê duyệt cấp Cảng vụ/Chi cục',
        icon: icons.approve,
        onClick: () => openApproveModal(record.id, 'c1'),
      });
      actions.push({
        key: 'rejectC1',
        label: 'Từ chối cấp Cảng vụ/Chi cục',
        danger: true,
        icon: icons.reject,
        onClick: () => openRejectModal(record.id, 'c1'),
      });
    }
    const canApproveC2 = hasPerm('coastalstationcospassarsat:approvec2') || hasPerm('specialstation:approvec2') || hasPerm('data:approvec2');
    if (canApproveC2 && record.approvalStatus === ApprovalStatus.APPROVED_LEVEL1 && (!isApproverL1 || isCucLevel || isAdmin) && (!isCreator || isCucLevel || isAdmin)) {
      actions.push({
        key: 'approveC2',
        label: 'Phê duyệt cấp Cục',
        icon: icons.approve,
        onClick: () => openApproveModal(record.id, 'c2'),
      });
      actions.push({
        key: 'rejectC2',
        label: 'Từ chối cấp Cục',
        danger: true,
        icon: icons.reject,
        onClick: () => openRejectModal(record.id, 'c2'),
      });
    }
    if (canDeleteApprovalRecord(record.approvalStatus, {
      hasPerm,
      resource: 'coastalstationcospassarsat',
      extraDeletePerms: ['specialstation:delete', 'data:delete'],
    })) {
      actions.push({
        key: 'delete',
        label: 'Xóa',
        icon: icons.delete,
        danger: true,
        onClick: () => openDeleteModal(record),
      });
    }
    return actions;
  }, [hasPerm, currentUser?.userId, currentUser?.id, refreshList, openDeleteModal]);

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
    const stationName = typeof values.stationName === 'string' ? values.stationName.trim() : '';
    const stationCode = typeof values.stationCode === 'string' ? values.stationCode.trim() : '';
    const orgUnitId = typeof values.orgUnitId === 'string' ? values.orgUnitId : undefined;
    const provinceId = values.provinceId ? Number(values.provinceId) : undefined;
    const conditionStatus = values.conditionStatus as ConditionStatus | undefined;
    const approvalStatus = values.approvalStatus as ApprovalStatus | undefined;

    setFilterValues((prev) => ({
      ...prev,
      stationName,
      stationCode,
    }));
    setFilterStationName(stationName);
    setFilterCode(stationCode);
    setFilterOrgUnitId(orgUnitId);
    setFilterProvinceId(provinceId);
    setFilterConditionStatus(conditionStatus);
    setFilterApprovalStatus(approvalStatus);

    const upRange = values.updateDateRange as [dayjs.Dayjs, dayjs.Dayjs] | undefined;
    if (upRange && upRange[0] && upRange[1]) {
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
    setFilterStationName('');
    setFilterCode('');
    setFilterOrgUnitId(defaultOrg);
    setFilterProvinceId(undefined);
    setFilterConditionStatus(undefined);
    setFilterApprovalStatus(undefined);
    setFilterUpdatedFrom(undefined);
    setFilterUpdatedTo(undefined);
    setFilterValues(defaultOrg ? { orgUnitId: defaultOrg } : {});
    setPage(1);
    statusCountFilterKey.current = null;
  }, []);

  return (
    <ThemeTokenProvider tokens={customTokens}>
      <div className="cospas-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <CospasSarsatGlobalStyles />
        <ScreenHeader
          breadcrumb={[
            { label: 'Tài sản KCHTGT' },
            { label: 'Đài Cospas-Sarsat' },
          ]}
          actions={
            canCreate
              ? [
                  {
                    key: 'create',
                    label: 'Thêm mới',
                    onClick: () => {
                      setEditingId(null);
                      setSelectedRecord(null);
                      setModalMode('create');
                      setIsModalOpen(true);
                    },
                    variant: 'primary' as const,
                    icon: icons.create,
                  },
                ]
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
              {/* ── BỘ LỌC CƠ BẢN (LUÔN HIỂN THỊ) — Chuẩn Bến cảng: 1. ĐVQL, 2. Tên KCHT, 3. Tình trạng ── */}
              <div style={{ marginBottom: 12, marginTop: spaceMd }}>
                <div style={filterLabelStyle}>Đơn vị quản lý</div>
                <FilterOrgUnitTreeSelect
                  organizations={organizations}
                  placeholder="Tất cả"
                  allowClear
                  value={filterValues.orgUnitId as string | undefined}
                  onChange={(value) => {
                    setFilterValues((prev) => ({ ...prev, orgUnitId: value }));
                  }}
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={filterLabelStyle}>Tên đài Cospas-Sarsat</div>
                <Input
                  placeholder="Tìm theo tên đài..."
                  allowClear
                  value={filterValues.stationName || ''}
                  onChange={(event) => setFilterValues((prev) => ({ ...prev, stationName: event.target.value }))}
                  onBlur={() => {
                    if (typeof filterValues.stationName === 'string') {
                      setFilterValues((prev) => ({ ...prev, stationName: prev.stationName.trim() }));
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

              {/* ── BỘ LỌC NÂNG CAO (ẨN / HIỆN THEO NÚT BỘ LỌC NÂNG CAO) ── */}
              {filterCollapsed && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <div style={filterLabelStyle}>Mã đài Cospas-Sarsat</div>
                    <Input
                      placeholder="Tìm theo mã đài..."
                      allowClear
                      value={filterValues.stationCode || ''}
                      onChange={(event) => setFilterValues((prev) => ({ ...prev, stationCode: event.target.value }))}
                      onBlur={() => {
                        if (typeof filterValues.stationCode === 'string') {
                          setFilterValues((prev) => ({ ...prev, stationCode: prev.stationCode.trim() }));
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
          <Pagination
            total={total}
            current={page}
            pageSize={pageSize}
            onChange={(p, ps) => {
              setPage(p);
              setPageSize(ps);
            }}
          />
        </FilterTableLayout>

        {/* Form Drawer (Chuẩn VTS) */}
        {isModalOpen && (
          <CospasSarsatStationForm
            open={true}
            editId={editingId}
            initialData={selectedRecord}
            mode={modalMode}
            orgUnits={organizations}
            onCancel={() => {
              setIsModalOpen(false);
              setEditingId(null);
              setSelectedRecord(null);
            }}
            onClose={() => {
              setIsModalOpen(false);
              setEditingId(null);
              setSelectedRecord(null);
            }}
            onSuccess={() => {
              setIsModalOpen(false);
              setEditingId(null);
              setSelectedRecord(null);
              refreshList();
            }}
            onEdit={(rec: CoastalStationCospasSarsatResponse) => {
              setSelectedRecord(rec);
              setEditingId(rec.id);
              setModalMode('edit');
            }}
          />
        )}

        {/* ── History drawer ────────────────────────────────────────── */}
        <CommonHistoryDrawer
          open={historyModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          entityName={selectedRecord?.stationName || selectedRecord?.name || selectedRecord?.code}
          records={historyRecords}
          loading={loadingHistory}
          serverFiltered
          onFilterChange={handleHistoryFilterChange}
          onLoadMore={loadMoreHistory}
          loadingMore={loadingMoreHistory}
          variant="berth"
          fieldLabelMap={{
            name: 'Tên đài',
            stationName: 'Tên đài',
            code: 'Mã đài',
            stationCode: 'Mã đài',
            conditionStatus: 'Tình trạng',
            operatingOrgId: 'Đơn vị khai thác',
            unitId: 'Đơn vị quản lý',
            orgUnitId: 'Đơn vị quản lý',
            provinceId: 'Địa điểm (Tỉnh/Thành phố)',
            locationAddress: 'Địa chỉ chi tiết',
            frequency: 'Tần số',
            coverageArea: 'Vùng phủ sóng',
            beaconProtocol: 'Giao thức phát',
            emergencyChannel: 'Kênh khẩn cấp',
            antennaType: 'Loại anten',
            signalRange: 'Cự ly tín hiệu',
            operatingMode: 'Chế độ hoạt động',
            servicesProvided: 'Dịch vụ cung cấp',
            services: 'Dịch vụ cung cấp',
            contactPerson: 'Người liên hệ',
            contactPhone: 'Số điện thoại liên hệ',
            note: 'Ghi chú',
            description: 'Mô tả',
            coordinates: 'Tọa độ GIS',
            geometryType: 'Loại hình học',
            symbolId: 'Biểu tượng bản đồ',
            coordinateReferenceSystem: 'Hệ quy chiếu',
          }}
          formatValue={(fieldName, value) => {
            if (value == null || value === '') return '';
            const fn = String(fieldName || '').toLowerCase();
            if (fn.includes('condition') || fn.includes('tinhtrang') || fn === 'tinhtranghoatdong') {
              return themeTokenChk.getVtsConditionStatusLabel(value);
            }
            if (fn.includes('operatingorg') || fn.includes('khai thac') || fn.includes('khaithac')) {
              return getOperatingOrgName(String(value), String(value));
            }
            if (fn.includes('service') || fn.includes('dich vu') || fn.includes('dichvu')) {
              return formatMaritimeServicesDisplay(value);
            }
            return String(value);
          }}
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
          title={rejectLevel === 'c1' ? 'Từ chối cấp Cảng vụ/Chi cục' : 'Từ chối cấp Cục'}
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
          itemType="đài Cospas-Sarsat"
          itemName={deletingRecord?.stationName || deletingRecord?.name}
          itemCode={deletingRecord?.stationCode || deletingRecord?.code}
        />
      </div>
    </ThemeTokenProvider>
  );
}

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Modal, Input, DatePicker, Select } from 'antd';
import DeleteConfirmModal from '../../components/shared/DeleteConfirmModal';
import { vtsSystemCRUD, vtsSystemApproval } from '../../services/vtsSystemService';
import type { VtsSystemResponse, ListParams } from '../../types/vtsSystem';
import { ConditionStatus, ApprovalStatus, CONDITION_STATUS_OPTIONS } from '../../types/vtsSystem';
import { useAuthStore, type AuthState } from '../../store/authStore';
import { usePermissionStore, type PermissionState } from '../../store/permissionStore';
import { ScreenHeader, DataTable } from '../../components/list-view';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import Pagination from '../../components/list-view/Pagination';
import VtsSystemForm from './VtsSystemForm';
import ApprovalModal from '../../components/shared/ApprovalModal';
import CommonHistoryDrawer, { type CommonHistoryEntry } from '../../components/shared/CommonHistoryDrawer';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import toast from '../../components/ToastNotification';
import {
  actionPrimary, textSecondary, textTertiary,
  fontWeightBold,
  spaceSm, spaceMd, spaceFormField,
  statusOperational, statusCritical, statusAttention,
  statusBadgeStyle, icons, textAreaStyle, cellTitleStyle, cellSubtitleStyle,
  colors, radiusPill, getRangePickerProps,
} from '../../themetokenchk';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import dayjs from 'dayjs';
import { getProvinceNameById, VIETNAM_PROVINCE_OPTIONS } from '../../types/common';
import { OrgUnitTreeSelect, normalizeSearchText, type OrgUnitTreeOption } from '../../components/org-unit';
import { canEditApprovalRecord } from '../../utils/approvalEditPolicy';
import { useStandardApprovalStatusTabs } from '../../components/shared/approvalStatusTabs';

const fontSizeMd = 13.5;

const filterLabelStyle: React.CSSProperties = {
  color: colors.sidebarBg,
  fontWeight: fontWeightBold,
  fontSize: fontSizeMd,
  marginBottom: spaceSm,
};

const CONDITION_STYLE_MAP: Record<string, { color: string; label: string }> = {
  OPERATIONAL: { color: statusOperational, label: 'Đang hoạt động' },
  STOPPED: { color: statusCritical, label: 'Dừng hoạt động' },
  MAINTENANCE: { color: statusAttention, label: 'Đang bảo trì' },
  UNDER_CONSTRUCTION: { color: actionPrimary, label: 'Đang xây dựng' },
  NOT_YET_OPERATIONAL: { color: statusAttention, label: 'Chưa khai thác/vận hành' },
  SUSPENDED: { color: statusCritical, label: 'Dừng khai thác/vận hành' },
};

const HISTORY_PAGE_SIZE = 20;

export default function VtsSystemList() {
  const currentUser = useAuthStore((s: AuthState) => s.user);
  const hasPerm = usePermissionStore((s: PermissionState) => s.hasPermission);

  const customVtsTokens = useMemo(() => ({
    ...themeTokenChk,
    fontSizeMd: 13.5,
  }), []);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
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
  const [filterValues, setFilterValues] = useState<Record<string, unknown>>({});
  // Sắp xếp chạy ở server để áp dụng cho toàn bộ kết quả; nếu để antd tự sắp thì
  // chỉ 20 dòng của trang hiện tại được sắp, gây hiểu nhầm là đã sắp cả danh sách.
  const [sortField, setSortField] = useState<string | undefined>();
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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

  useEffect(() => {
    (async () => {
      try {
        const [orgs, ports] = await Promise.all([
          vtsSystemCRUD.getScopedOrgUnitOptions(),
          vtsSystemCRUD.getScopedPortOptions(),
        ]);
        setOrgUnitOptions(orgs.map((o: { id: string | number; code?: string; maDonVi?: string; name?: string; unitName?: string; tenDonVi?: string; parentId?: string | number }) => {
          const code = o.code || o.maDonVi;
          const name = o.name || o.unitName || o.tenDonVi || 'Đơn vị';
          return {
            id: String(o.id),
            name,
            code,
            parentId: o.parentId ? String(o.parentId) : undefined,
          };
        }));
        setPortOptions(ports || []);
      } catch (e) { console.error('Failed to fetch org units / ports for filter', e); }
    })();
  }, []);

  const filteredPortOptions = useMemo(() => {
    if (!filterValues.orgUnitId) return portOptions;
    return portOptions.filter((p) => !p.orgUnitId || p.orgUnitId === filterValues.orgUnitId);
  }, [portOptions, filterValues.orgUnitId]);

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
        sort: sortField ? `${sortField},${sortDirection}` : undefined,
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

  const refreshList = useCallback(() => {
    statusCountFilterKey.current = null;
    void fetchData();
  }, [fetchData]);

  // ── Delete confirmation modal (Chuẩn Bến cảng) ───────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<VtsSystemResponse | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openDeleteModal = useCallback((record: VtsSystemResponse) => {
    setDeletingRecord(record);
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingRecord) return;
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
  }, [deletingRecord, refreshList]);

  const openApproveModal = (id: string, level: 'c1' | 'c2') => {
    setApproveTargetId(id);
    setApproveLevel(level);
    setApproveModalOpen(true);
  };

  const handleApprove = async (content: string) => {
    if (!approveTargetId) return;
    try {
      const payload: ApprovalRequest = { decision: 'APPROVED', reason: content };
      if (approveLevel === 'c1') {
        await vtsSystemApproval.approveC1(approveTargetId, payload);
        toast.success('Phê duyệt cấp 1 thành công');
      } else {
        await vtsSystemApproval.approveC2(approveTargetId, payload);
        toast.success('Phê duyệt cấp 2 thành công');
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

  const handleReject = async () => {
    if (!rejectReason.trim() || rejectReason.trim().length < 10) { toast.error('Lý do từ chối phải có ít nhất 10 ký tự'); return; }
    if (!rejectTargetId) return;
    try {
      const payload: ApprovalRequest = { decision: 'REJECTED', reason: rejectReason.trim() };
      if (rejectLevel === 'c1') await vtsSystemApproval.approveC1(rejectTargetId, payload);
      else await vtsSystemApproval.approveC2(rejectTargetId, payload);
      invalidateVtsDetailCache(rejectTargetId);
      toast.success('Đã từ chối'); setRejectModalOpen(false); refreshList();
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

  const sortOrderFor = useCallback((key: string) => {
    if (sortField === key) return sortDirection === 'asc' ? 'ascend' : 'descend';
    return null;
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
      key: 'address',
      label: 'Địa điểm (Tỉnh/Thành phố)',
      dataIndex: 'address',
      width: 260,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('address'),
      render: (val: string, record: VtsSystemResponse) => {
        const provinceName = record.provinceId ? getProvinceNameById(record.provinceId) : '';
        const fullAddress = val && provinceName ? `${val}, ${provinceName}` : (val || provinceName || '—');
        return (
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={fullAddress}>
            {fullAddress}
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
      width: 160,
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
        const date = record.updatedDate || record.updatedAt || record.createdAt;
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

  const rowActions = useCallback((record: VtsSystemResponse) => {
    const uid = currentUser?.userId || currentUser?.id;
    const isCreator = Boolean(uid && record.createdBy === uid);
    const isApproverL1 = Boolean(uid && record.approverLevel1 === uid);
    const userUnitType = currentUser?.unitType || '';
    const isAdmin = (currentUser as any)?.role === 'SUPER_ADMIN' || (currentUser as any)?.role === 'ADMIN' || (currentUser as any)?.roleName === 'SUPER_ADMIN' || (currentUser as any)?.roleName === 'ADMIN';
    const isCucLevel = !userUnitType || userUnitType === 'CHUYEN_VIEN_CUC' || userUnitType === 'LANH_DAO_CUC' || userUnitType === 'CUC' || userUnitType === 'CUC_HANG_HAI' || isAdmin;

    const actions: { key: string; label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean; disabled?: boolean }[] = [];
    if (hasPerm('vts:read')) {
      actions.push({ key: 'view', label: 'Xem chi tiết', icon: icons.view, onClick: () => { setEditingId(record.id); setSelectedRecord(record); setModalMode('detail'); setIsModalOpen(true); } });
    }
    // N09/BR-019: hồ sơ đang chờ duyệt bị khóa sửa. Hồ sơ đã duyệt vẫn sửa được
    // nhưng chỉ bởi người có quyền phê duyệt (T12 — "Lưu và phê duyệt").
    if (canEditApprovalRecord(record.approvalStatus, { hasPerm, resource: 'vts' })) {
      actions.push({ key: 'edit', label: 'Chỉnh sửa', icon: icons.edit, onClick: () => { setEditingId(record.id); setSelectedRecord(record); setModalMode('edit'); setIsModalOpen(true); } });
    }
    if (hasPerm('vts:history')) {
      actions.push({ key: 'history', label: 'Lịch sử', icon: icons.history, onClick: () => handleViewHistory(record) });
    }
    if (hasPerm('vts:update') && (record.approvalStatus === ApprovalStatus.DRAFT || record.approvalStatus === ApprovalStatus.REJECTED_LEVEL1 || record.approvalStatus === ApprovalStatus.REJECTED_LEVEL2)) {
      actions.push({
        key: 'submit',
        label: 'Gửi phê duyệt',
        icon: icons.submit,
        onClick: async () => {
          try {
            await vtsSystemApproval.submit(record.id);
            invalidateVtsDetailCache(record.id);
            toast.success('Gửi phê duyệt thành công');
            refreshList();
          } catch (e: unknown) {
            // Interceptor api.ts đã Việt hóa lỗi vào `message`; dùng nó để toast
            // không bị lệch nội dung so với các thao tác phê duyệt khác.
            toast.error(e instanceof Error ? e.message : 'Có lỗi xảy ra');
          }
        },
      });
    }
    if ((hasPerm('vts:approvec1') || hasPerm('data:approvec1') || hasPerm('data:approve') || isAdmin) && record.approvalStatus === ApprovalStatus.PENDING_APPROVAL && (!isCreator || isCucLevel || isAdmin)) {
      actions.push({ key: 'approveC1', label: 'Phê duyệt cấp Cảng vụ/Chi cục', icon: icons.approve, onClick: () => openApproveModal(record.id, 'c1') });
      actions.push({ key: 'rejectC1', label: 'Từ chối cấp Cảng vụ/Chi cục', danger: true, icon: icons.reject, onClick: () => openRejectModal(record.id, 'c1') });
    }
    if ((hasPerm('vts:approvec2') || hasPerm('data:approvec2') || hasPerm('data:approve') || isAdmin || isCucLevel) && record.approvalStatus === ApprovalStatus.APPROVED_LEVEL1 && (!isApproverL1 || isCucLevel || isAdmin)) {
      actions.push({ key: 'approveC2', label: 'Phê duyệt cấp Cục', icon: icons.approve, onClick: () => openApproveModal(record.id, 'c2') });
      actions.push({ key: 'rejectC2', label: 'Từ chối cấp Cục', danger: true, icon: icons.reject, onClick: () => openRejectModal(record.id, 'c2') });
    }
    // T13/N04: chỉ hồ sơ đang "Lưu tạm" mới được xóa (approval-2-level-spec §3.6).
    if (hasPerm('vts:delete') && record.approvalStatus === ApprovalStatus.DRAFT) {
      actions.push({ key: 'delete', label: 'Xóa', icon: icons.delete, danger: true, onClick: () => openDeleteModal(record) });
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
    const systemName = typeof values.systemName === 'string' ? values.systemName.trim() : '';
    const code = typeof values.code === 'string' ? values.code.trim() : '';
    const orgUnitId = typeof values.orgUnitId === 'string' ? values.orgUnitId : undefined;
    const portId = typeof values.portId === 'string' ? values.portId : undefined;
    const provinceId = values.provinceId ? Number(values.provinceId) : undefined;
    const conditionStatus = values.conditionStatus as ConditionStatus | undefined;
    const approvalStatus = values.approvalStatus as ApprovalStatus | undefined;

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
    setFilterSystemName('');
    setFilterCode('');
    setFilterOrgUnitId(undefined);
    setFilterPortId(undefined);
    setFilterProvinceId(undefined);
    setFilterConditionStatus(undefined);
    setFilterApprovalStatus(undefined);
    setFilterOperationStartDateFrom(undefined);
    setFilterOperationStartDateTo(undefined);
    setFilterUpdatedFrom(undefined);
    setFilterUpdatedTo(undefined);
    setFilterValues({});
    setPage(1);
    statusCountFilterKey.current = null;
  }, []);

  return (
    <ThemeTokenProvider tokens={customVtsTokens}>
    <div className="vts-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
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
      <ScreenHeader
        breadcrumb={[{ label: 'Tài sản KCHTGT' }, { label: 'Hệ thống VTS' }]}
        actions={
          hasPerm('vts:create')
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
              <OrgUnitTreeSelect
                organizations={orgUnitOptions}
                placeholder="Chọn đơn vị..."
                allowClear
                treeDefaultExpandAll={true}
                listHeight={256}
                value={filterValues.orgUnitId}
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
      />

      {/* Approval Modal */}
      <ApprovalModal
        visible={approveModalOpen}
        level={approveLevel}
        onConfirm={handleApprove}
        onCancel={() => setApproveModalOpen(false)}
      />

      {/* Reject Modal */}
      <Modal title="Từ chối" open={rejectModalOpen} onOk={handleReject}
        onCancel={() => setRejectModalOpen(false)} okText="Từ chối" cancelText="Hủy" okButtonProps={{ danger: true }}>
        <p style={{ marginBottom: spaceFormField }}>Nhập lý do từ chối (tối thiểu 10 ký tự):</p>
        <Input.TextArea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Nhập lý do từ chối" style={textAreaStyle} />
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
        itemType="hệ thống VTS"
        itemName={deletingRecord?.systemName}
        itemCode={deletingRecord?.code}
      />
    </div>
    </ThemeTokenProvider>
  );
}

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Modal, Input, DatePicker, Select } from 'antd';
import DeleteConfirmModal from '../../../components/shared/DeleteConfirmModal';
import { inmarsatStationService, type InmarsatListParams } from '../../../services/inmarsatStationService';
import { symbolService } from '../../../services/symbolService';
import { organizationService } from '../../../services/organizationService';
import type { CoastalStationInmarsatResponse } from '../../../services/station/types';
import { ConditionStatus, ApprovalStatus, CONDITION_STATUS_OPTIONS, CONDITION_STATUS_MAP } from '../../../types/vtsSystem';
import { useAuthStore, type AuthState } from '../../../store/authStore';
import { usePermissionStore, type PermissionState } from '../../../store/permissionStore';
import { ScreenHeader, DataTable } from '../../../components/list-view';
import FilterTableLayout from '../../../components/list-view/FilterTableLayout';
import Pagination from '../../../components/list-view/Pagination';
import InmarsatStationForm, { getOperatingOrgName } from './InmarsatStationForm';
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
  getConditionStatusColor,
  getConditionStatusLabel,
} from '../../../themetokenchk';
import * as themeTokenChk from '../../../themetokenchk';
import { ThemeTokenProvider } from '../../../context/ThemeTokenContext';
import dayjs from 'dayjs';
import { getProvinceNameById, VIETNAM_PROVINCE_OPTIONS } from '../../../types/common';
import { OrgUnitTreeSelect, normalizeSearchText, type OrgUnitTreeOption } from '../../../components/org-unit';
import { canEditApprovalRecord, canDeleteApprovalRecord } from '../../../utils/approvalEditPolicy';
import { useSearchParams } from 'react-router-dom';
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
};

const INMARSAT_FIELD_MAP: Record<string, string> = {
  code: 'Mã đài',
  deviceCode: 'Mã đài',
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
  locationDetail: 'Địa điểm chi tiết',
  locationAddress: 'Địa điểm chi tiết',
  'Địa điểm chi tiết': 'Địa điểm chi tiết',
  conditionStatus: 'Tình trạng',
  'Tình trạng': 'Tình trạng',
  coverageZone: 'Vùng phủ sóng',
  'Vùng phủ sóng': 'Vùng phủ sóng',
  coverageArea: 'Khu vực phủ sóng',
  'Khu vực phủ sóng': 'Khu vực phủ sóng',
  services: 'Dịch vụ cung cấp',
  'Dịch vụ cung cấp': 'Dịch vụ cung cấp',
  frequency: 'Tần số',
  'Tần số': 'Tần số',
  notes: 'Ghi chú',
  note: 'Ghi chú',
  description: 'Ghi chú',
  'Ghi chú': 'Ghi chú',
  latitude: 'Vĩ độ',
  longitude: 'Kinh độ',
  'Tọa độ GPS': 'Tọa độ GPS',
  symbol: 'Biểu tượng',
  'Biểu tượng': 'Biểu tượng',
  geometryType: 'Loại đối tượng',
  objectType: 'Loại đối tượng',
  'Loại đối tượng': 'Loại đối tượng',
  coordinateSystem: 'Hệ quy chiếu',
  'Hệ quy chiếu': 'Hệ quy chiếu',
  displayRule: 'Quy tắc hiển thị',
  'Quy tắc hiển thị': 'Quy tắc hiển thị',
  approvalStatus: 'Trạng thái phê duyệt',
  approvalLevel: 'Cấp phê duyệt',
};

const formatHistoryValue = (field: string, val: unknown): string => {
  if (val === null || val === undefined || val === '') return '—';
  if (field === 'provinceId' || field === 'Địa điểm (Tỉnh/TP)') {
    return getProvinceNameById(val as number) || String(val);
  }
  if (field === 'conditionStatus' || field === 'Tình trạng') {
    return getConditionStatusLabel(val as string);
  }
  return String(val);
};

export default function InmarsatStationList() {
  const [searchParams] = useSearchParams();
  const linkedAction = searchParams.get('action');
  const linkedRecordId = searchParams.get('id');
  const isIframeModal = window.parent !== window.self;
  const isMapLinkedView = isIframeModal && (linkedAction === 'edit' || linkedAction === 'detail');
  const handledLinkedRecordRef = useRef<string | null>(null);

  const currentUser = useAuthStore((s: AuthState) => s.user);
  const hasPerm = usePermissionStore((s: PermissionState) => s.hasPermission);

  const customTokens = useMemo(() => ({
    ...themeTokenChk,
    fontSizeMd: 13.5,
  }), []);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortField, setSortField] = useState<string | undefined>();
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterName, setFilterName] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [filterConditionStatus, setFilterConditionStatus] = useState<ConditionStatus | undefined>();
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<ApprovalStatus | undefined>();
  const [filterOrgUnitId, setFilterOrgUnitId] = useState<string | undefined>();
  const [filterOperatingOrgId, setFilterOperatingOrgId] = useState<string | undefined>();
  const [filterProvinceId, setFilterProvinceId] = useState<number | undefined>();
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState<string | undefined>();
  const [filterUpdatedTo, setFilterUpdatedTo] = useState<string | undefined>();

  const [orgUnitOptions, setOrgUnitOptions] = useState<OrgUnitTreeOption[]>([]);
  const [symbols, setSymbols] = useState<Array<{ id: string; code?: string; name?: string; image?: string }>>([]);
  const [filterValues, setFilterValues] = useState<Record<string, unknown>>({});
  const [filterCollapsed, setFilterCollapsed] = useState(false);

  const [dataSource, setDataSource] = useState<CoastalStationInmarsatResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<CoastalStationInmarsatResponse | null>(null);
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
  const [historyFilters, setHistoryFilters] = useState<{ keyword: string; fromDate?: string; toDate?: string }>({ keyword: '' });

  // Count tabs
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const statusCountFilterKey = useRef<string | null>(null);
  const listRequestId = useRef(0);

  // User levels
  const isAdmin = (currentUser as any)?.role === 'SUPER_ADMIN' || (currentUser as any)?.role === 'ADMIN' || (currentUser as any)?.roleName === 'SUPER_ADMIN' || (currentUser as any)?.roleName === 'ADMIN';
  const userUnitType = currentUser?.unitType || '';
  const isCucLevel = !userUnitType || userUnitType === 'CHUYEN_VIEN_CUC' || userUnitType === 'LANH_DAO_CUC' || userUnitType === 'CUC' || userUnitType === 'CUC_HANG_HAI' || isAdmin;
  const isCangVuLevel = userUnitType === 'CVHH' || userUnitType === 'CANG_VU';
  const canApproveL1 = (hasPerm('coastalstationinmarsat:approvec1') || hasPerm('coastalstationinmarsat:approve') || hasPerm('specialstation:approve') || hasPerm('data:approvec1') || hasPerm('data:approve') || isAdmin) && (isCangVuLevel || !isCucLevel || isAdmin);
  const canApproveL2 = (hasPerm('coastalstationinmarsat:approvec2') || hasPerm('coastalstationinmarsat:approve') || hasPerm('specialstation:approvec2') || hasPerm('specialstation:approve') || hasPerm('data:approvec2') || hasPerm('data:approve') || isAdmin || isCucLevel);

  useEffect(() => {
    if (!isMapLinkedView || !linkedRecordId || !linkedAction) return;

    const requestKey = `${linkedAction}:${linkedRecordId}`;
    if (handledLinkedRecordRef.current === requestKey) return;
    handledLinkedRecordRef.current = requestKey;

    let active = true;
    void inmarsatStationService.getById(linkedRecordId)
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
        toast.error('Không thể tải hồ sơ Đài thông tin vệ tinh Inmarsat');
      });

    return () => {
      active = false;
    };
  }, [isMapLinkedView, linkedAction, linkedRecordId]);

  useEffect(() => {
    (async () => {
      try {
        const [orgs, syms] = await Promise.all([
          organizationService.getAll().catch(() => []),
          symbolService.getOptions().catch(() => []),
        ]);
        const list = Array.isArray(orgs) ? orgs : ((orgs as any)?.content || (orgs as any)?.data || []);
        setOrgUnitOptions((list || []).map((o: any) => ({
          id: String(o.id),
          name: o.name || o.unitName || o.tenDonVi || 'Đơn vị',
          code: o.code || o.maDonVi,
          parentId: o.parentId ? String(o.parentId) : undefined,
        })));
        setSymbols(Array.isArray(syms) ? syms : []);
      } catch (e) {
        console.error('Failed to fetch lookup options', e);
      }
    })();
  }, []);

  const fetchData = useCallback(async () => {
    const requestId = ++listRequestId.current;
    setLoading(true);
    setIsError(false);
    try {
      const currentStatusCountFilterKey = JSON.stringify([
        filterName, filterCode, filterConditionStatus, filterOrgUnitId, filterOperatingOrgId, filterProvinceId,
        filterUpdatedFrom, filterUpdatedTo,
      ]);
      const shouldIncludeCounts = statusCountFilterKey.current !== currentStatusCountFilterKey;
      const params: InmarsatListParams = {
        page: page,
        size: pageSize,
        name: filterName || undefined,
        code: filterCode || undefined,
        conditionStatus: filterConditionStatus,
        approvalStatus: filterApprovalStatus,
        orgUnitId: filterOrgUnitId || undefined,
        operatingOrgId: filterOperatingOrgId || undefined,
        provinceId: filterProvinceId,
        updatedFrom: filterUpdatedFrom,
        updatedTo: filterUpdatedTo,
        sort: sortField ? `${sortField},${sortDirection}` : undefined,
      };

      const res = await inmarsatStationService.search(params);
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
      setErrorMessage(err instanceof Error ? err.message : 'Không thể tải danh sách Đài thông tin vệ tinh Inmarsat');
    } finally {
      if (requestId === listRequestId.current) setLoading(false);
    }
  }, [
    page, pageSize, filterName, filterCode, filterConditionStatus, filterApprovalStatus,
    filterOrgUnitId, filterOperatingOrgId, filterProvinceId,
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

  const handleDelete = useCallback(async (id: string) => {
    try {
      await inmarsatStationService.delete(id);
      toast.success('Xóa thành công');
      refreshList();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi xóa');
    }
  }, [refreshList]);

  // ── Delete confirmation modal (Chuẩn Bến cảng) ───────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<CoastalStationInmarsatResponse | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openDeleteModal = useCallback((record: CoastalStationInmarsatResponse) => {
    setDeletingRecord(record);
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingRecord) return;
    setDeleteLoading(true);
    try {
      await inmarsatStationService.delete(deletingRecord.id);
      toast.success('Đã xóa đài thông tin vệ tinh Inmarsat');
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
        await inmarsatStationService.approveL1(approveTargetId);
        toast.success('Phê duyệt cấp 1 thành công');
      } else {
        await inmarsatStationService.approveL2(approveTargetId);
        toast.success('Phê duyệt cấp 2 thành công');
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
      await inmarsatStationService.reject(rejectTargetId, rejectReason.trim());
      toast.success('Đã từ chối');
      setRejectModalOpen(false);
      refreshList();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi từ chối');
    }
  };

  const handleViewHistory = (record: CoastalStationInmarsatResponse) => {
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
        const history = await inmarsatStationService.getHistory(selectedRecord.id, 0, HISTORY_PAGE_SIZE, {
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
  }, [historyModalOpen, selectedRecord, historyFilters]);

  const loadMoreHistory = async () => {
    if (!selectedRecord || loadingHistory || loadingMoreHistory || !hasMoreHistory) return;
    setLoadingMoreHistory(true);
    try {
      const nextPage = historyPage + 1;
      const history = await inmarsatStationService.getHistory(selectedRecord.id, nextPage, HISTORY_PAGE_SIZE, {
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
    setFilterOperatingOrgId(vals.operatingOrgId as string | undefined);
    setFilterProvinceId(typeof vals.provinceId === 'number' ? vals.provinceId : undefined);
    const dateRange = vals.updateDateRange as [dayjs.Dayjs | null, dayjs.Dayjs | null] | undefined;
    setFilterUpdatedFrom(dateRange?.[0] ? dayjs(dateRange[0]).startOf('day').format('YYYY-MM-DDTHH:mm:ss') : undefined);
    setFilterUpdatedTo(dateRange?.[1] ? dayjs(dateRange[1]).endOf('day').format('YYYY-MM-DDTHH:mm:ss') : undefined);
    setPage(1);
  };

  const handleFilterReset = () => {
    setFilterName('');
    setFilterCode('');
    setFilterConditionStatus(undefined);
    setFilterOrgUnitId(undefined);
    setFilterOperatingOrgId(undefined);
    setFilterProvinceId(undefined);
    setFilterUpdatedFrom(undefined);
    setFilterUpdatedTo(undefined);
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
      label: 'Tên / Mã đài thông tin vệ tinh Inmarsat',
      dataIndex: 'name',
      width: 280,
      fixed: 'left' as const,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('name'),
      render: (_: unknown, record: CoastalStationInmarsatResponse) => (
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
      render: (v: string) => <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: fontWeightBold }} title={v}>{v || '—'}</div>,
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
      render: (val: string, record: CoastalStationInmarsatResponse) => {
        const name = getOperatingOrgName(record.operatingOrgId, val);
        return <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={name}>{name || '—'}</div>;
      },
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
      render: (_: unknown, r: CoastalStationInmarsatResponse) => {
        const val = r.provinceName || (r.provinceId ? getProvinceNameById(r.provinceId) : undefined) || '—';
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
      render: (_: unknown, record: CoastalStationInmarsatResponse) => {
        const name = record.updatedByName || (record as any).createdByName || '—';
        const date = (record as any).updatedAt || (record as any).createdAt;
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

  const rowActions = useCallback((record: CoastalStationInmarsatResponse) => {
    const uid = currentUser?.userId || currentUser?.id;
    const isCreator = Boolean(uid && (record as any).createdBy === uid);
    const isApproverL1 = Boolean(uid && record.approverLevel1 === uid);

    const actions: { key: string; label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean; disabled?: boolean }[] = [
      {
        key: 'detail',
        label: 'Xem chi tiết',
        icon: icons.view,
        onClick: () => {
          setEditingId(record.id);
          setSelectedRecord(record);
          setModalMode('detail');
          setIsModalOpen(true);
        },
      },
    ];

    if (canEditApprovalRecord(record.approvalStatus, {
      hasPerm,
      resource: 'coastalstationinmarsat',
      extraUpdatePerms: ['specialstation:update', 'data:update'],
      extraApprovePerms: ['specialstation:approvec2', 'specialstation:approve'],
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

    if (hasPerm('coastalstationinmarsat:history') || hasPerm('specialstation:history') || hasPerm('data:read')) {
      actions.push({
        key: 'history',
        label: 'Lịch sử',
        icon: icons.history,
        onClick: () => handleViewHistory(record),
      });
    }

    if ((hasPerm('coastalstationinmarsat:update') || hasPerm('specialstation:update') || hasPerm('data:update')) &&
      (record.approvalStatus === ApprovalStatus.DRAFT || record.approvalStatus === ApprovalStatus.REJECTED_LEVEL1 || record.approvalStatus === ApprovalStatus.REJECTED_LEVEL2)) {
      actions.push({
        key: 'submit',
        label: 'Gửi duyệt',
        icon: icons.submit,
        onClick: async () => {
          try {
            await inmarsatStationService.submit(record.id);
            toast.success('Gửi phê duyệt thành công');
            refreshList();
          } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Lỗi gửi phê duyệt');
          }
        },
      });
    }

    if ((record.approvalStatus === ApprovalStatus.PENDING_APPROVAL || (record.approvalStatus as any) === 'PROPOSED') && canApproveL1 && (!isCreator || isCucLevel || isAdmin)) {
      actions.push(
        {
          key: 'approve_l1',
          label: 'Phê duyệt cấp Cảng vụ/Chi cục',
          icon: icons.approve,
          onClick: () => openApproveModal(record.id, 'c1'),
        },
        {
          key: 'reject_l1',
          label: 'Từ chối cấp Cảng vụ/Chi cục',
          icon: icons.reject,
          danger: true,
          onClick: () => openRejectModal(record.id),
        }
      );
    }

    if (record.approvalStatus === ApprovalStatus.APPROVED_LEVEL1 && canApproveL2 && (!isApproverL1 || isCucLevel || isAdmin)) {
      actions.push(
        {
          key: 'approve_l2',
          label: 'Phê duyệt cấp Cục',
          icon: icons.approve,
          onClick: () => openApproveModal(record.id, 'c2'),
        },
        {
          key: 'reject_l2',
          label: 'Từ chối cấp Cục',
          icon: icons.reject,
          danger: true,
          onClick: () => openRejectModal(record.id),
        }
      );
    }

    if (canDeleteApprovalRecord(record.approvalStatus, {
      hasPerm,
      resource: 'coastalstationinmarsat',
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
  }, [currentUser, hasPerm, canApproveL1, canApproveL2, refreshList, openDeleteModal]);

  return (
    <ThemeTokenProvider tokens={customTokens}>
      <div className="inmarsat-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <style>{`
          /* ── Cỡ chữ 13.5px chuẩn toàn màn Inmarsat & các popup/drawer con (chuẩn VTS Operation Center / Bến cảng) ── */
          .inmarsat-page-wrapper,
          .inmarsat-page-wrapper .ant-table,
          .inmarsat-page-wrapper .ant-table-cell,
          .inmarsat-page-wrapper .ant-table-thead > tr > th,
          .inmarsat-page-wrapper .ant-table-tbody > tr > td,
          .inmarsat-page-wrapper .ant-input,
          .inmarsat-page-wrapper .ant-select,
          .inmarsat-page-wrapper .ant-select-selection-item,
          .inmarsat-page-wrapper .ant-select-selection-placeholder,
          .inmarsat-page-wrapper .ant-select-item-option-content,
          .inmarsat-page-wrapper .ant-picker,
          .inmarsat-page-wrapper .ant-picker-input > input,
          .inmarsat-page-wrapper .ant-btn,
          .inmarsat-page-wrapper .ant-pagination,
          .inmarsat-page-wrapper .ant-pagination-item,
          .inmarsat-page-wrapper .ant-pagination-total-text,
          .inmarsat-page-wrapper .ant-breadcrumb,
          .inmarsat-page-wrapper .filter-label,
          .inmarsat-page-wrapper .ant-form-item-label > label,
          .inmarsat-drawer-scope,
          .inmarsat-drawer-scope .ant-drawer-content,
          .inmarsat-drawer-scope .ant-tabs-tab,
          .inmarsat-drawer-scope .chk-detail-label,
          .inmarsat-drawer-scope .chk-detail-value,
          .inmarsat-drawer-scope .ant-table,
          .inmarsat-drawer-scope .ant-table-cell,
          .inmarsat-drawer-scope .ant-table-thead > tr > th,
          .inmarsat-drawer-scope .ant-btn,
          .inmarsat-drawer-scope .ant-select,
          .inmarsat-drawer-scope .ant-input,
          .inmarsat-drawer-scope .ant-form-item-label > label,
          .berth-drawer-scope,
          .berth-drawer-scope .ant-drawer-content,
          .berth-drawer-scope .ant-tabs-tab,
          .berth-drawer-scope .chk-detail-label,
          .berth-drawer-scope .chk-detail-value,
          .berth-drawer-scope .ant-table,
          .berth-drawer-scope .ant-table-cell,
          .berth-drawer-scope .ant-table-thead > tr > th,
          .berth-drawer-scope .ant-btn,
          .berth-drawer-scope .ant-select,
          .berth-drawer-scope .ant-input,
          .berth-drawer-scope .ant-form-item-label > label {
            font-size: 13.5px !important;
          }

          .inmarsat-page-wrapper .screen-header {
            flex-wrap: wrap !important;
            gap: 10px !important;
          }

          /* ── Responsive StatusTabs: Căn giữa khi đủ chỗ, thanh cuộn ngang khi tràn màn hình ── */
          .inmarsat-page-wrapper div:has(> button[aria-pressed]) {
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
          .inmarsat-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar {
            height: 6px !important;
            display: block !important;
          }
          .inmarsat-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-track {
            background: #f1f5f9 !important;
            border-radius: 999px !important;
          }
          .inmarsat-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb {
            background: #cbd5e1 !important;
            border-radius: 999px !important;
          }
          .inmarsat-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb:hover {
            background: #94a3b8 !important;
          }
          .inmarsat-page-wrapper div:has(> button[aria-pressed]) > button {
            white-space: nowrap !important;
            flex-shrink: 0 !important;
            cursor: pointer !important;
          }

          .inmarsat-page-wrapper .screen-header {
            flex-wrap: wrap !important;
            gap: 10px !important;
          }

          /* ── Responsive Drawers: Không tràn viền khi màn hình nhỏ / zoom cao ── */
          .inmarsat-drawer-scope .ant-drawer-content-wrapper {
            max-width: 100vw !important;
          }
          @media (max-width: 1024px) {
            .inmarsat-drawer-scope .chk-detail-grid {
              grid-template-columns: 1fr !important;
              column-gap: 0 !important;
            }
            .inmarsat-drawer-scope .chk-detail-row--full {
              grid-column: 1 !important;
            }
          }
          @media (max-width: 640px) {
            .inmarsat-drawer-scope .chk-detail-row {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 4px !important;
              padding: 8px 0 !important;
            }
            .inmarsat-drawer-scope .chk-detail-label {
              width: 100% !important;
            }
            .inmarsat-drawer-scope .chk-detail-value {
              width: 100% !important;
            }
          }
        `}</style>
        <ScreenHeader
          breadcrumb={[
            { label: 'Tài sản KCHTGT' },
            { label: 'Đài thông tin vệ tinh Inmarsat' },
          ]}
          actions={
            (hasPerm('coastalstationinmarsat:create') || hasPerm('specialstation:create') || hasPerm('data:create'))
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
                <OrgUnitTreeSelect
                  organizations={orgUnitOptions}
                  placeholder="Chọn đơn vị..."
                  allowClear
                  treeDefaultExpandAll={true}
                  listHeight={256}
                  value={filterValues.orgUnitId as string | undefined}
                  onChange={(value) => {
                    setFilterValues((prev) => ({ ...prev, orgUnitId: value }));
                  }}
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={filterLabelStyle}>Tên đài thông tin vệ tinh Inmarsat</div>
                <Input
                  placeholder="Tìm theo tên đài vệ tinh Inmarsat"
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
                    <div style={filterLabelStyle}>Đơn vị khai thác</div>
                    <Select
                      placeholder="Chọn đơn vị khai thác"
                      allowClear
                      showSearch
                      filterOption={(input, option) =>
                        normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))
                      }
                      value={filterValues.operatingOrgId as string | undefined}
                      onChange={(value) => setFilterValues((prev) => ({ ...prev, operatingOrgId: value }))}
                      options={DEFAULT_OPERATING_ORGANIZATIONS.map((o) => ({
                        value: o.id,
                        label: o.name,
                      }))}
                      style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                    />
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={filterLabelStyle}>Mã đài thông tin vệ tinh Inmarsat</div>
                    <Input
                      placeholder="Tìm theo mã đài vệ tinh Inmarsat"
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
          <InmarsatStationForm
            open={true}
            editId={editingId}
            initialData={selectedRecord}
            mode={modalMode}
            orgUnits={orgUnitOptions}
            symbols={symbols}
            onCancel={() => { setIsModalOpen(false); setEditingId(null); setSelectedRecord(null); }}
            onSuccess={() => { setIsModalOpen(false); setEditingId(null); setSelectedRecord(null); refreshList(); }}
          />
        )}

        {/* ── History drawer ────────────────────────────────────────── */}
        <CommonHistoryDrawer
          open={historyModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          entityName={selectedRecord?.name || selectedRecord?.code}
          records={historyRecords}
          loading={loadingHistory}
          fieldLabelMap={INMARSAT_FIELD_MAP}
          formatValue={formatHistoryValue}
          serverFiltered
          onFilterChange={setHistoryFilters}
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
          itemType="đài thông tin vệ tinh Inmarsat"
          itemName={deletingRecord?.stationName || deletingRecord?.stationCode}
          itemCode={deletingRecord?.stationCode}
        />
      </div>
    </ThemeTokenProvider>
  );
}

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Modal, Input, DatePicker, Select } from 'antd';
import {
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { vtsOperationCenterService, type VtsOperationCenterListParams } from '../../services/vtsOperationCenterService';
import { vtsSystemCRUD } from '../../services/vtsSystemService';
import { symbolService } from '../../services/symbolService';
import type { VtsOperationCenterListItem, VtsOperationCenterResponse } from '../../types/vtsOperationCenter';
import { ConditionStatus, ApprovalStatus, CONDITION_STATUS_OPTIONS, CONDITION_STATUS_MAP } from '../../types/vtsSystem';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import { ScreenHeader, DataTable } from '../../components/list-view';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import Pagination from '../../components/list-view/Pagination';
import VtsOperationCenterForm from './VtsOperationCenterForm';
import ApprovalModal from '../../components/shared/ApprovalModal';
import CommonHistoryDrawer from '../../components/shared/CommonHistoryDrawer';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import toast, { modal } from '../../components/ToastNotification';
import {
  actionPrimary, textSecondary,
  fontWeightBold, fontSizeMd,
  radiusSm, spaceFormField, spaceMd, spaceSm,
  statusOperational, statusDraft, statusCritical, statusAttention,
  spaceXs, selectStyle,
  borderDefault, statusBadgeStyle, icons, cellTitleStyle, cellSubtitleStyle,
  inputStyle, textAreaStyle,
  getRangePickerProps,
} from '../../themetokenchk';
import { colors } from '../../themetokenchk';
import dayjs from 'dayjs';
import { getProvinceNameById, VIETNAM_PROVINCE_OPTIONS } from '../../types/common';
import { OrgUnitTreeSelect, normalizeSearchText, type OrgUnitTreeOption } from '../../components/org-unit';
import SidebarFilterField from '../../components/list-view/SidebarFilterField';
import { canEditApprovalRecord, canDeleteApprovalRecord } from '../../utils/approvalEditPolicy';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import { useSearchParams } from 'react-router-dom';

/** Số bản ghi nhật ký mỗi lần cuộn tải thêm trong drawer lịch sử. */
const HISTORY_PAGE_SIZE = 20;

const CONDITION_COLOR: Record<ConditionStatus, string> = {
  [ConditionStatus.OPERATIONAL]: statusOperational,
  [ConditionStatus.STOPPED]: statusCritical,
  [ConditionStatus.MAINTENANCE]: statusAttention,
  [ConditionStatus.UNDER_CONSTRUCTION]: actionPrimary,
};

export default function VtsOperationCenterList() {
  const [searchParams] = useSearchParams();
  const linkedAction = searchParams.get("action");
  const linkedRecordId = searchParams.get("id");
  const isIframeModal = window.parent !== window.self;
  const isMapLinkedView = isIframeModal && (linkedAction === "edit" || linkedAction === "detail");
  const handledLinkedRecordRef = useRef<string | null>(null);

  const currentUser = useAuthStore((s: any) => s.user);
  const hasPerm = usePermissionStore((s: any) => s.hasPermission);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  // Sắp xếp chạy ở server để áp dụng cho toàn bộ kết quả; nếu để antd tự sắp thì
  // chỉ 20 dòng của trang hiện tại được sắp, gây hiểu nhầm là đã sắp cả danh sách.
  const [sortField, setSortField] = useState<string | undefined>();
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
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
  const [symbols, setSymbols] = useState<any[]>([]);

  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});

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
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyFilters, setHistoryFilters] = useState<{ keyword: string; fromDate?: string; toDate?: string }>({ keyword: '' });

  // Count tabs
  const [countDraft, setCountDraft] = useState<number>(0);
  const [countPendingApproval, setCountPendingApproval] = useState<number>(0);
  const [countApprovedLevel1, setCountApprovedLevel1] = useState<number>(0);
  const [countApproved, setCountApproved] = useState<number>(0);
  const [countRejectedLevel1, setCountRejectedLevel1] = useState<number>(0);
  const [countRejectedLevel2, setCountRejectedLevel2] = useState<number>(0);
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
        toast.error("Không thể tải hồ sơ Trung tâm Điều hành VTS");
      });

    return () => {
      active = false;
    };
  }, [isMapLinkedView, linkedAction, linkedRecordId]);

  useEffect(() => {
    (async () => {
      try {
        const [orgs, ports, systems, syms] = await Promise.all([
          vtsSystemCRUD.getScopedOrgUnitOptions(),
          vtsSystemCRUD.getScopedPortOptions(),
          vtsSystemCRUD.getOptions(),
          symbolService.getOptions().catch(() => []),
        ]);
        setOrgUnitOptions((orgs || []).map((o: any) => ({
          id: String(o.id),
          name: o.name || o.unitName || o.tenDonVi || 'Đơn vị',
          code: o.code || o.maDonVi,
          parentId: o.parentId ? String(o.parentId) : undefined,
        })));
        setPortOptions(Array.isArray(ports) ? ports : []);
        setVtsSystemOptions(Array.isArray(systems) ? systems : []);
        setSymbols(Array.isArray(syms) ? syms : []);
      } catch (e) {
        console.error('Failed to fetch lookup options', e);
      }
    })();
  }, []);

  const filteredPortOptions = useMemo(() => {
    if (!filterValues.orgUnitId) return portOptions;
    const allowedIds = resolveOrgSubtreeIds(orgUnitOptions, filterValues.orgUnitId);
    return portOptions.filter((p) => !p.orgUnitId || allowedIds.has(p.orgUnitId));
  }, [portOptions, orgUnitOptions, filterValues.orgUnitId]);

  const filteredVtsSystemOptions = useMemo(() => {
    if (!filterValues.orgUnitId) return vtsSystemOptions;
    const allowedIds = resolveOrgSubtreeIds(orgUnitOptions, filterValues.orgUnitId);
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
        // Chỉ yêu cầu backend đếm lại khi bộ lọc đổi; lật trang hay đổi sắp xếp
        // không làm thay đổi số trên tab nên bỏ được truy vấn GROUP BY.
        includeCounts: shouldIncludeCounts,
      };

      const res = await vtsOperationCenterService.search(params);
      if (requestId !== listRequestId.current) return;
      setDataSource(res.items || []);
      setTotal(res.total || 0);

      if (shouldIncludeCounts && res.statusCounts) {
        const counts = res.statusCounts;
        setCountDraft(Number(counts.DRAFT) || 0);
        setCountPendingApproval(Number(counts.PENDING_APPROVAL) || 0);
        setCountApprovedLevel1(Number(counts.APPROVED_LEVEL1) || 0);
        setCountApproved(Number(counts.APPROVED) || 0);
        setCountRejectedLevel1(Number(counts.REJECTED_LEVEL1) || 0);
        setCountRejectedLevel2(Number(counts.REJECTED_LEVEL2) || 0);
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

  useEffect(() => { fetchData(); }, [fetchData]);

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
    statusCountFilterKey.current = null;
    void fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    try {
      await vtsOperationCenterService.delete(id);
      toast.success('Xóa thành công');
      refreshList();
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi xóa');
    }
  };

  const confirmDelete = (record: VtsOperationCenterListItem) => {
    modal.confirm({
      title: 'Xác nhận xóa trung tâm điều hành VTS',
      icon: <ExclamationCircleOutlined />,
      content: 'Hồ sơ ở trạng thái Lưu tạm sẽ chuyển sang "Đã xóa (lịch sử)": không còn hiển thị trong danh sách nhưng vẫn được giữ lại để đối chiếu.',
      okText: 'Xóa', okType: 'danger', cancelText: 'Hủy',
      onOk: () => handleDelete(record.id),
    });
  };

  const openApproveModal = (id: string, level: 'c1' | 'c2') => {
    setApproveTargetId(id);
    setApproveLevel(level);
    setApproveModalOpen(true);
  };

  const handleApprove = async (content: string) => {
    if (!approveTargetId) return;
    try {
      if (approveLevel === 'c1') {
        await vtsOperationCenterService.approveC1(approveTargetId, 'APPROVED', content);
        toast.success('Phê duyệt cấp 1 thành công');
      } else {
        await vtsOperationCenterService.approveC2(approveTargetId, 'APPROVED', content);
        toast.success('Phê duyệt cấp 2 thành công');
      }
      setApproveModalOpen(false);
      refreshList();
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi phê duyệt');
    }
  };

  const openRejectModal = (id: string) => {
    setRejectTargetId(id);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleReject = async () => {
    // approval-2-level-spec §3.4 (quy tắc 5): lý do từ chối tối thiểu 10 ký tự.
    if (!rejectReason.trim() || rejectReason.trim().length < 10) {
      toast.error('Lý do từ chối phải có ít nhất 10 ký tự');
      return;
    }
    if (!rejectTargetId) return;
    try {
      await vtsOperationCenterService.reject(rejectTargetId, rejectReason.trim());
      toast.success('Đã từ chối');
      setRejectModalOpen(false);
      refreshList();
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi từ chối');
    }
  };

  const handleViewHistory = (record: VtsOperationCenterListItem) => {
    setSelectedRecord(record as any);
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
        const history = await vtsOperationCenterService.getHistory(selectedRecord.id, 0, HISTORY_PAGE_SIZE, {
          keyword: historyFilters.keyword || undefined,
          fromDate: historyFilters.fromDate || undefined,
          toDate: historyFilters.toDate || undefined,
        });
        if (cancelled) return;
        const items = history || [];
        setHistoryRecords(items);
        setHasMoreHistory(items.length === HISTORY_PAGE_SIZE);
      } catch {
        if (!cancelled) toast.error('Không thể tải lịch sử thay đổi');
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();
    return () => { cancelled = true; };
  }, [historyModalOpen, selectedRecord?.id, historyFilters]);

  const loadMoreHistory = async () => {
    if (!selectedRecord || loadingHistory || loadingMoreHistory || !hasMoreHistory) return;
    setLoadingMoreHistory(true);
    try {
      const nextPage = historyPage + 1;
      const history = await vtsOperationCenterService.getHistory(selectedRecord.id, nextPage, HISTORY_PAGE_SIZE, {
        keyword: historyFilters.keyword || undefined,
        fromDate: historyFilters.fromDate || undefined,
        toDate: historyFilters.toDate || undefined,
      });
      if (history && history.length > 0) {
        setHistoryRecords((prev) => [...prev, ...history]);
      }
      setHistoryPage(nextPage);
      setHasMoreHistory((history || []).length === HISTORY_PAGE_SIZE);
    } catch { /* ignore */ }
    finally { setLoadingMoreHistory(false); }
  };

    const countAll = countDraft + countPendingApproval + countApprovedLevel1 + countApproved + countRejectedLevel1 + countRejectedLevel2;

  const statusTabs = useMemo(() => [
    { key: 'ALL', label: 'Tất cả', count: filterApprovalStatus ? countAll : total, color: actionPrimary, active: !filterApprovalStatus },
    { key: ApprovalStatus.DRAFT, label: 'Lưu tạm', count: countDraft, color: statusDraft, active: filterApprovalStatus === ApprovalStatus.DRAFT },
    { key: ApprovalStatus.PENDING_APPROVAL, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', count: countPendingApproval, color: statusAttention, active: filterApprovalStatus === ApprovalStatus.PENDING_APPROVAL },
    { key: ApprovalStatus.APPROVED_LEVEL1, label: 'Chờ phê duyệt cấp Cục', count: countApprovedLevel1, color: '#0284C7', active: filterApprovalStatus === ApprovalStatus.APPROVED_LEVEL1 },
    { key: ApprovalStatus.APPROVED, label: 'Đã phê duyệt', count: countApproved, color: statusOperational, active: filterApprovalStatus === ApprovalStatus.APPROVED },
    { key: ApprovalStatus.REJECTED_LEVEL1, label: 'Từ chối cấp Cảng vụ/Chi cục', count: countRejectedLevel1, color: statusCritical, active: filterApprovalStatus === ApprovalStatus.REJECTED_LEVEL1 },
    { key: ApprovalStatus.REJECTED_LEVEL2, label: 'Từ chối cấp Cục', count: countRejectedLevel2, color: statusCritical, active: filterApprovalStatus === ApprovalStatus.REJECTED_LEVEL2 },
  ], [total, countAll, filterApprovalStatus, countDraft, countPendingApproval, countApprovedLevel1, countApproved, countRejectedLevel1, countRejectedLevel2]);

  const handleTabChange = (key: string) => {
    const approvalStatus = key === 'ALL' ? undefined : (key as ApprovalStatus);
    setFilterApprovalStatus(approvalStatus);
    setPage(1);
  };

  const handleFilterSearch = (vals: Record<string, any>) => {
    setFilterName(vals.name?.trim() || '');
    setFilterCode(vals.code?.trim() || '');
    setFilterConditionStatus(vals.conditionStatus);
    setFilterOrgUnitId(vals.orgUnitId);
    setFilterPortId(vals.portId);
    setFilterVtsSystemId(vals.vtsSystemId);
    setFilterProvinceId(vals.provinceId);
    // Backend nhận LocalDateTime và BỎ QUA offset, nên `toISOString()` (giờ UTC)
    // làm cửa sổ lọc lệch đúng bằng chênh lệch múi giờ (VN: -7h): hồ sơ cập nhật
    // sau 17h bị đẩy nhầm sang ngày hôm sau. Gửi thẳng giờ địa phương.
    setFilterUpdatedFrom(vals.updateDateRange?.[0] ? dayjs(vals.updateDateRange[0]).startOf('day').format('YYYY-MM-DDTHH:mm:ss') : undefined);
    setFilterUpdatedTo(vals.updateDateRange?.[1] ? dayjs(vals.updateDateRange[1]).endOf('day').format('YYYY-MM-DDTHH:mm:ss') : undefined);
    setPage(1);
  };

  const handleFilterReset = () => {
    setFilterName('');
    setFilterCode('');
    setFilterConditionStatus(undefined);
    setFilterOrgUnitId(undefined);
    setFilterPortId(undefined);
    setFilterVtsSystemId(undefined);
    setFilterProvinceId(undefined);
    setFilterUpdatedFrom(undefined);
    setFilterUpdatedTo(undefined);
    setPage(1);
  };

  // Table Columns with client-side sorting (sắp xếp trực tiếp trên dữ liệu bảng)
  const columns = useMemo(() => [
    {
      key: 'stt',
      label: 'STT',
      width: 60,
      align: 'center' as const,
      fixed: 'left' as const,
      render: (_: any, __: any, index: number) => (page - 1) * pageSize + index + 1,
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
      render: (_: any, record: VtsOperationCenterListItem) => (
        <div
          style={{ cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          onClick={() => {
            setEditingId(record.id);
            setSelectedRecord(record as any);
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
      // DataTable lấy khóa sắp xếp từ `dataIndex` nên cột này gửi lên `provinceId`.
      sortOrder: sortOrderFor('provinceId'),
      render: (_: any, r: VtsOperationCenterListItem) => {
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
      key: 'updatedByName',
      label: 'Cán bộ cập nhật',
      dataIndex: 'updatedByName',
      width: 220,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('updatedByName'),
      render: (_: any, record: VtsOperationCenterListItem) => {
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
    {
      key: 'submittedByName',
      label: 'Cán bộ gửi phê duyệt',
      dataIndex: 'submittedByName',
      width: 220,
      ellipsis: false,
      render: (_: any, record: VtsOperationCenterListItem) => {
        const name = record.submittedByName || '—';
        const date = record.submittedAt || (record as any).submittedDate;
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
    {
      key: 'approverLevel1Name',
      label: 'Phê duyệt cấp Cảng vụ/Chi cục',
      dataIndex: 'approverLevel1Name',
      width: 240,
      ellipsis: false,
      render: (_: any, record: VtsOperationCenterListItem) => {
        const name = record.approverLevel1Name || (record as any).approverLevel1 || '—';
        const date = record.approvedDateLevel1;
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
    {
      key: 'approverLevel2Name',
      label: 'Phê duyệt cấp Cục',
      dataIndex: 'approverLevel2Name',
      width: 220,
      ellipsis: false,
      render: (_: any, record: VtsOperationCenterListItem) => {
        const name = record.approverLevel2Name || (record as any).approverLevel2 || '—';
        const date = record.approvedDateLevel2;
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
  ], [page, pageSize, sortField, sortDirection]);

  const rowActions = (record: VtsOperationCenterListItem) => {
    const isCreator = Boolean(currentUser?.id && record.createdBy === currentUser.id);
    const isApproverL1 = Boolean(currentUser?.id && (record as any).approverLevel1 === currentUser.id);
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

    if (canEditApprovalRecord(record.approvalStatus, { hasPerm, resource: 'vtsoperationcenter' })) {
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
            await vtsOperationCenterService.submit(record.id);
            toast.success('Gửi duyệt thành công');
            refreshList();
          } catch (e: any) {
            toast.error(e?.message || 'Lỗi gửi duyệt');
          }
        },
      });
    }

    if (hasPerm('vtsoperationcenter:approvec1') && record.approvalStatus === ApprovalStatus.PENDING_APPROVAL && !isCreator) {
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

    if (hasPerm('vtsoperationcenter:approvec2') && record.approvalStatus === ApprovalStatus.APPROVED_LEVEL1 && !isApproverL1) {
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
        onClick: () => confirmDelete(record),
      });
    }

    return actions;
  };

  return (
    <ThemeTokenProvider tokens={themeTokenChk}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
        <ScreenHeader
          breadcrumb={[{ label: 'Tài sản KCHTGT' }, { label: 'Trung tâm điều hành VTS' }]}
          actions={
            hasPerm('vtsoperationcenter:create')
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
              <SidebarFilterField label="Đơn vị quản lý" style={{ marginTop: spaceMd }}>
                <OrgUnitTreeSelect
                  organizations={orgUnitOptions}
                  placeholder="Tất cả"
                  allowClear
                  treeDefaultExpandAll={true}
                  listHeight={256}
                  value={filterValues.orgUnitId}
                  onChange={(value) => {
                    setFilterValues((prev) => ({ ...prev, orgUnitId: value, portId: undefined, vtsSystemId: undefined }));
                  }}
                  style={{ ...selectStyle, width: '100%' }}
                />
              </SidebarFilterField>

              <SidebarFilterField label="Thuộc cảng biển">
                <Select
                  placeholder="Tất cả cảng biển"
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
                  style={{ ...selectStyle, width: '100%' }}
                />
              </SidebarFilterField>

              <SidebarFilterField label="Tên trung tâm điều hành VTS">
                <Input
                  placeholder="Nhập tên trung tâm điều hành VTS"
                  allowClear
                  value={filterValues.name || ''}
                  onChange={(event) => setFilterValues((prev) => ({ ...prev, name: event.target.value }))}
                  onPressEnter={() => handleFilterSearch(filterValues)}
                  style={inputStyle}
                />
              </SidebarFilterField>

              {filterCollapsed && (
                <>
                  <SidebarFilterField label="Thuộc hệ thống VTS">
                    <Select
                      placeholder="Tất cả hệ thống VTS"
                      allowClear
                      showSearch
                      filterOption={(input, option) =>
                        normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))
                      }
                      value={filterValues.vtsSystemId}
                      onChange={(value) => setFilterValues((prev) => ({ ...prev, vtsSystemId: value }))}
                      options={filteredVtsSystemOptions.map((v) => ({
                        value: v.id,
                        label: v.code ? `${v.code} - ${v.name || ''}` : (v.name || v.id),
                      }))}
                      style={{ ...selectStyle, width: '100%' }}
                    />
                  </SidebarFilterField>

                  <SidebarFilterField label="Mã trung tâm điều hành VTS">
                    <Input
                      placeholder="Nhập mã trung tâm điều hành VTS"
                      allowClear
                      value={filterValues.code || ''}
                      onChange={(event) => setFilterValues((prev) => ({ ...prev, code: event.target.value }))}
                      onPressEnter={() => handleFilterSearch(filterValues)}
                      style={inputStyle}
                    />
                  </SidebarFilterField>

                  <SidebarFilterField label="Tình trạng">
                    <Select
                      placeholder="Tất cả"
                      allowClear
                      value={filterValues.conditionStatus}
                      onChange={(value) => setFilterValues((prev) => ({ ...prev, conditionStatus: value }))}
                      options={CONDITION_STATUS_OPTIONS}
                      style={{ ...selectStyle, width: '100%' }}
                    />
                  </SidebarFilterField>

                  <SidebarFilterField label="Ngày cập nhật">
                    <DatePicker.RangePicker
                      {...getRangePickerProps({
                        value: filterValues.updateDateRange,
                        onChange: (dates: any) => setFilterValues((prev) => ({ ...prev, updateDateRange: dates })),
                      })}
                    />
                  </SidebarFilterField>

                  <SidebarFilterField label="Địa điểm (Tỉnh / TP)">
                    <Select
                      placeholder="Tất cả tỉnh thành"
                      allowClear
                      showSearch
                      filterOption={(input, option) =>
                        normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))
                      }
                      value={filterValues.provinceId}
                      onChange={(value) => setFilterValues((prev) => ({ ...prev, provinceId: value }))}
                      options={VIETNAM_PROVINCE_OPTIONS}
                      style={{ ...selectStyle, width: '100%' }}
                    />
                  </SidebarFilterField>
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

        {/* Drawer Unified Form */}
        {isModalOpen && (
          <VtsOperationCenterForm
            open={true}
            editId={editingId}
            initialData={selectedRecord}
            mode={modalMode}
            orgUnits={orgUnitOptions}
            portOptions={portOptions}
            vtsSystemOptions={vtsSystemOptions}
            symbols={symbols}
            onCancel={() => { setIsModalOpen(false); setEditingId(null); setSelectedRecord(null); }}
            onSuccess={() => { setIsModalOpen(false); setEditingId(null); setSelectedRecord(null); refreshList(); }}
          />
        )}

        {/* History Drawer */}
        <CommonHistoryDrawer
          open={historyModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          entityName={selectedRecord?.name || selectedRecord?.code}
          records={historyRecords}
          loading={loadingHistory}
          serverFiltered
          onFilterChange={setHistoryFilters}
          onLoadMore={loadMoreHistory}
          loadingMore={loadingMoreHistory}
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
          <p style={{ marginBottom: spaceFormField }}>Nhập lý do từ chối:</p>
          <Input.TextArea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Nhập lý do từ chối..."
            maxLength={1000}
            showCount
            style={textAreaStyle}
          />
        </Modal>
      </div>
    </ThemeTokenProvider>
  );
}

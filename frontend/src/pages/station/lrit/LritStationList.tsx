import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Typography, Modal, Input, Button, DatePicker, Space, Select } from 'antd';
import {
  HistoryOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { lritStationService, type LritStationListParams } from '../../../services/lritStationService';
import { organizationService } from '../../../services/organizationService';
import { symbolService } from '../../../services/symbolService';
import type { LritStationItem } from '../../../types/lritStation';
import { ConditionStatus, ApprovalStatus, CONDITION_STATUS_OPTIONS, CONDITION_STATUS_MAP } from '../../../types/vtsSystem';
import { useAuthStore } from '../../../store/authStore';
import { usePermissionStore } from '../../../store/permissionStore';
import { ScreenHeader, DataTable } from '../../../components/list-view';
import FilterTableLayout from '../../../components/list-view/FilterTableLayout';
import Pagination from '../../../components/list-view/Pagination';
import LritStationForm from './LritStationForm';
import { getOperatingOrganizationDisplayName } from '../../../utils/operatingOrganizationDisplay';
import ApprovalModal from '../../../components/shared/ApprovalModal';
import ApprovalStatusBadge from '../../../components/shared/ApprovalStatusBadge';
import toast, { modal } from '../../../components/ToastNotification';
import {
  actionPrimary, textPrimary, textSecondary, textTertiary,
  fontWeightBold, fontWeightMedium, fontSizeSm, fontSizeMd, fontSizeLg,
  radiusSm, radiusPill, spaceFormField, spaceMd, spaceSm, spaceLg,
  statusOperational, statusDraft, statusCritical, statusAttention,
  surfacePage, spaceXs, spaceXl, drawerTitleStyle, drawerCloseBtnStyle, selectStyle,
  borderDefault, statusBadgeStyle, cellTitleStyle, cellSubtitleStyle,
  inputStyle, primaryButtonStyle, textAreaStyle,
  getRangePickerProps, icons,
  getConditionStatusColor, getConditionStatusLabel,
} from '../../../themetokenchk';
import { colors } from '../../../themetokenchk';
import dayjs from 'dayjs';
import { getProvinceNameById, VIETNAM_PROVINCE_OPTIONS } from '../../../types/common';
import { OrgUnitTreeSelect, normalizeSearchText, resolveOrgSubtreeIds } from '../../../components/org-unit';
import SidebarFilterField from '../../../components/list-view/SidebarFilterField';
import { canEditApprovalRecord, canDeleteApprovalRecord, normalizeApprovalStatus } from '../../../utils/approvalEditPolicy';
import * as themeTokenChk from '../../../themetokenchk';
import { ThemeTokenProvider } from '../../../context/ThemeTokenContext';
import CommonHistoryDrawer from '../../../components/shared/CommonHistoryDrawer';

/** Số bản ghi nhật ký mỗi lần cuộn tải thêm trong drawer lịch sử. */
const HISTORY_PAGE_SIZE = 20;



function renderPersonTimeCell(personName?: string, timestamp?: string) {
  const isUuid = (value?: string | null) => !!value && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-/.test(value);
  const person = isUuid(personName) ? '—' : (personName || '—');
  const time = timestamp ? dayjs(timestamp).format('DD/MM/YYYY HH:mm:ss') : '—';
  return (
    <div style={{ lineHeight: '1.35', overflow: 'hidden' }}>
      <div
        style={{
          fontWeight: fontWeightBold,
          color: textPrimary,
          fontSize: fontSizeMd,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        title={person}
      >
        {person}
      </div>
      <div style={{ fontSize: fontSizeMd, color: textSecondary, whiteSpace: 'nowrap' }}>{time}</div>
    </div>
  );
}



export const LritStationList: React.FC = () => {
  const [data, setData] = useState<LritStationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Status counts for StatusTabs
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  // Filters state
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  // Tên đài (bộ lọc thường) và Mã đài (bộ lọc nâng cao) là hai điều kiện riêng,
  // không dùng chung ô "từ khóa" tìm nhiều cột như trước.
  const [filterName, setFilterName] = useState('');
  const [filterCode, setFilterCode] = useState('');
  // Sắp xếp chạy ở server để áp dụng cho toàn bộ kết quả; nếu để antd tự sắp thì
  // chỉ các dòng của trang hiện tại được sắp, gây hiểu nhầm là đã sắp cả danh sách.
  const [sortField, setSortField] = useState<string | undefined>();
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterProvinceId, setFilterProvinceId] = useState<number | undefined>(undefined);
  const [filterConditionStatus, setFilterConditionStatus] = useState<string | undefined>(undefined);
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<ApprovalStatus | undefined>(undefined);
  const [filterOrgUnitId, setFilterOrgUnitId] = useState<string | undefined>(undefined);
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState<string | undefined>(undefined);
  const [filterUpdatedTo, setFilterUpdatedTo] = useState<string | undefined>(undefined);
  const [filterCollapsed, setFilterCollapsed] = useState<boolean>(false);

  // Modal / Drawer state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'detail'>('create');
  const [selectedRecord, setSelectedRecord] = useState<LritStationItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Approval Modal state
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveTargetId, setApproveTargetId] = useState<string | null>(null);
  const [approveLevel, setApproveLevel] = useState<'c1' | 'c2'>('c1');

  // Reject Modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // History Drawer state
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  // Số trang nhật ký đã tải. Không suy ra từ độ dài mảng vì backend có thể trả ít
  // hơn pageSize khi lọc, làm lệch số trang → sót/lặp bản ghi.
  const [historyPage, setHistoryPage] = useState(0);
  const [historyTargetId, setHistoryTargetId] = useState<string | null>(null);
  const [historyFilters, setHistoryFilters] = useState<{ keyword: string; fromDate?: string; toDate?: string }>({ keyword: '' });

  // Lookup options
  const [orgUnitOptions, setOrgUnitOptions] = useState<any[]>([]);
  const [symbols, setSymbols] = useState<any[]>([]);

  // Permissions & User
  const user = useAuthStore((s: any) => s.user);
  const hasPerm = usePermissionStore((s: any) => s.hasPermission);

  const canCreate = hasPerm('coastalstationlrit:create') || hasPerm('specialstation:create') || hasPerm('data:create') || hasPerm('admin:all') || (user as any)?.role === 'SUPER_ADMIN' || (user as any)?.role === 'ADMIN';

  // Load organizations & symbols
  useEffect(() => {
    organizationService.getAll().then((res) => {
      const items = Array.isArray(res) ? res : ((res as any)?.data || []);
      setOrgUnitOptions(items);
    }).catch(() => {});

    symbolService.getAll().then((res) => {
      if (Array.isArray(res) && res.length > 0) setSymbols(res);
    }).catch(() => {});
  }, []);

  const filteredOrgUnits = useMemo(() => {
    if (!orgUnitOptions || orgUnitOptions.length === 0) return [];
    const userOrgId = (user as any)?.orgUnitId;
    if (!userOrgId || (user as any)?.role === 'SUPER_ADMIN' || (user as any)?.role === 'ADMIN' || (user as any)?.orgUnitLevel === 1) {
      return orgUnitOptions;
    }
    const allowedIds = resolveOrgSubtreeIds(orgUnitOptions, userOrgId);
    if (allowedIds.size === 0) return orgUnitOptions;
    return orgUnitOptions.filter((u: any) => allowedIds.has(u.id));
  }, [orgUnitOptions, user]);

  // Fetch Data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
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
        sortDir: sortField ? sortDirection.toUpperCase() : 'DESC',
      };
      const res = await lritStationService.search(params);

      setData(res.items || []);
      setTotal(res.total || 0);
      setStatusCounts(res.statusCounts || {});
    } catch {
      toast.error('Không thể tải danh sách Đài LRIT');
    } finally {
      setLoading(false);
    }
  }, [filterName, filterCode, filterOrgUnitId, filterProvinceId, filterConditionStatus, filterApprovalStatus, filterUpdatedFrom, filterUpdatedTo, page, pageSize, sortField, sortDirection]);

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
  // biểu tượng sắp xếp mà không tự sắp lại các dòng của trang hiện tại.
  const serverSideSorter = () => 0;

  const refreshList = () => {
    fetchData();
  };

  // Status Tabs
  const countDraft = Number(statusCounts.DRAFT ?? statusCounts.draft ?? 0);
  const countPendingApproval = Number(statusCounts.PENDING_APPROVAL ?? statusCounts.pending ?? 0);
  const countApprovedLevel1 = Number(statusCounts.APPROVED_LEVEL1 ?? statusCounts.approvedLevel1 ?? statusCounts.approvedL1 ?? 0);
  const countApproved = Number(statusCounts.APPROVED ?? statusCounts.approved ?? 0);
  const countRejectedLevel1 = Number(statusCounts.REJECTED_LEVEL1 ?? statusCounts.rejectedLevel1 ?? 0);
  const countRejectedLevel2 = Number(statusCounts.REJECTED_LEVEL2 ?? statusCounts.rejectedLevel2 ?? 0);
  const countAll = countDraft + countPendingApproval + countApprovedLevel1 + countApproved + countRejectedLevel1 + countRejectedLevel2;

  const statusTabsConfig = useMemo(() => [
    { key: 'ALL', label: 'Tất cả', count: filterApprovalStatus ? countAll : total, color: actionPrimary, active: !filterApprovalStatus },
    { key: ApprovalStatus.DRAFT, label: 'Lưu tạm', count: countDraft, color: statusDraft, active: filterApprovalStatus === ApprovalStatus.DRAFT },
    { key: ApprovalStatus.PENDING_APPROVAL, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', count: countPendingApproval, color: statusAttention, active: filterApprovalStatus === ApprovalStatus.PENDING_APPROVAL },
    { key: ApprovalStatus.APPROVED_LEVEL1, label: 'Chờ phê duyệt cấp Cục', count: countApprovedLevel1, color: '#0284C7', active: filterApprovalStatus === ApprovalStatus.APPROVED_LEVEL1 },
    { key: ApprovalStatus.APPROVED, label: 'Đã phê duyệt', count: countApproved, color: statusOperational, active: filterApprovalStatus === ApprovalStatus.APPROVED },
    { key: ApprovalStatus.REJECTED_LEVEL1, label: 'Từ chối cấp Cảng vụ/Chi cục', count: countRejectedLevel1, color: statusCritical, active: filterApprovalStatus === ApprovalStatus.REJECTED_LEVEL1 },
    { key: ApprovalStatus.REJECTED_LEVEL2, label: 'Từ chối cấp Cục', count: countRejectedLevel2, color: statusCritical, active: filterApprovalStatus === ApprovalStatus.REJECTED_LEVEL2 },
  ], [total, countAll, filterApprovalStatus, countDraft, countPendingApproval, countApprovedLevel1, countApproved, countRejectedLevel1, countRejectedLevel2]);

  const handleTabChange = (key: string) => {
    const approvalStatus = key === 'ALL' || key === 'all' ? undefined : (key as ApprovalStatus);
    setFilterApprovalStatus(approvalStatus);
    setPage(1);
  };

  const handleFilterSearch = (vals: Record<string, any>) => {
    setFilterName(vals.name || '');
    setFilterCode(vals.code || '');
    setFilterConditionStatus(vals.conditionStatus);
    setFilterOrgUnitId(vals.orgUnitId);
    setFilterProvinceId(vals.provinceId);
    // Backend nhận LocalDateTime và BỎ QUA offset, nên `toISOString()` (giờ UTC)
    // làm cửa sổ lọc lệch đúng bằng chênh lệch múi giờ (VN: -7h): hồ sơ cập nhật
    // sau 17h bị đẩy nhầm sang ngày hôm sau. Gửi thẳng giờ địa phương.
    setFilterUpdatedFrom(vals.updateDateRange?.[0] ? dayjs(vals.updateDateRange[0]).startOf('day').format('YYYY-MM-DDTHH:mm:ss') : undefined);
    setFilterUpdatedTo(vals.updateDateRange?.[1] ? dayjs(vals.updateDateRange[1]).endOf('day').format('YYYY-MM-DDTHH:mm:ss') : undefined);
    setPage(1);
  };

  const handleFilterReset = () => {
    setFilterValues({});
    setFilterName('');
    setFilterCode('');
    setFilterConditionStatus(undefined);
    setFilterOrgUnitId(undefined);
    setFilterProvinceId(undefined);
    setFilterUpdatedFrom(undefined);
    setFilterUpdatedTo(undefined);
    setPage(1);
  };

  // Delete handler
  const handleDelete = async (id: string) => {
    try {
      await lritStationService.delete(id);
      toast.success('Xóa thành công');
      refreshList();
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi xóa đài LRIT');
    }
  };

  const confirmDelete = (record: LritStationItem) => {
    modal.confirm({
      title: 'Xác nhận xóa đài thông tin LRIT',
      icon: <ExclamationCircleOutlined />,
      content: `Hồ sơ "${record.name}" ở trạng thái Lưu tạm sẽ chuyển sang "Đã xóa (lịch sử)": không còn hiển thị trong danh sách nhưng vẫn được giữ lại để đối chiếu.`,
      okText: 'Xóa', okType: 'danger', cancelText: 'Hủy',
      onOk: () => handleDelete(record.id),
    });
  };

  // Approval Handlers
  const openApproveModal = (id: string, level: 'c1' | 'c2') => {
    setApproveTargetId(id);
    setApproveLevel(level);
    setApproveModalOpen(true);
  };

  const handleApprove = async (content: string) => {
    if (!approveTargetId) return;
    try {
      if (approveLevel === 'c1') {
        await lritStationService.approveL1(approveTargetId, content);
        toast.success('Phê duyệt cấp 1 thành công');
      } else {
        await lritStationService.approveL2(approveTargetId, content);
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
      await lritStationService.reject(rejectTargetId, rejectReason.trim());
      toast.success('Đã từ chối hồ sơ');
      setRejectModalOpen(false);
      refreshList();
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi từ chối hồ sơ');
    }
  };

  // History Drawer handler
  const handleOpenHistory = (record: LritStationItem) => {
    setSelectedRecord(record);
    setHistoryTargetId(record.id);
    setHistoryRecords([]);
    setHistoryFilters({ keyword: '' });
    setHistoryPage(0);
    setHasMoreHistory(true);
    setHistoryModalOpen(true);
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
        const res = await lritStationService.getHistory(historyTargetId, 0, HISTORY_PAGE_SIZE, {
          keyword: historyFilters.keyword || undefined,
          fromDate: historyFilters.fromDate || undefined,
          toDate: historyFilters.toDate || undefined,
        });
        if (cancelled) return;
        const items = res || [];
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
      const res = await lritStationService.getHistory(historyTargetId, nextPage, HISTORY_PAGE_SIZE, {
        keyword: historyFilters.keyword || undefined,
        fromDate: historyFilters.fromDate || undefined,
        toDate: historyFilters.toDate || undefined,
      });
      if (res && res.length > 0) {
        setHistoryRecords((prev) => [...prev, ...res]);
      }
      setHistoryPage(nextPage);
      setHasMoreHistory((res || []).length === HISTORY_PAGE_SIZE);
    } catch { /* giữ nguyên phần đã tải, người dùng cuộn lại sẽ thử tiếp */ }
    finally { setLoadingMoreHistory(false); }
  }, [historyTargetId, loadingHistory, loadingMoreHistory, hasMoreHistory, historyPage, historyFilters]);

  // Table Columns
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
      label: 'Tên / Mã đài thông tin LRIT',
      dataIndex: 'name',
      width: 260,
      fixed: 'left' as const,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('name'),
      render: (_: any, record: LritStationItem) => (
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
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('operatingOrgName'),
      render: (v: string, record: LritStationItem) => {
        const name = getOperatingOrganizationDisplayName(record.operatingOrgId, v);
        return <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={name}>{name}</div>;
      },
    },
    {
      key: 'province',
      label: 'Địa điểm (Tỉnh/TP)',
      dataIndex: 'provinceId',
      width: 180,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('provinceId'),
      render: (_: any, r: LritStationItem) => {
        const val = r.provinceId ? getProvinceNameById(r.provinceId) : '—';
        return <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={val}>{val}</div>;
      },
    },
    {
      key: 'conditionStatus',
      label: 'Tình trạng',
      dataIndex: 'conditionStatus',
      width: 160,
      align: 'left' as const,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('conditionStatus'),
      render: (v: string) => {
        const label = getConditionStatusLabel(v);
        const color = getConditionStatusColor(v);
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
      align: 'left' as const,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('approvalStatus'),
      render: (status: ApprovalStatus) => <ApprovalStatusBadge status={status} />,
    },
    {
      key: 'updatedInfo',
      label: 'Cán bộ cập nhật / Thời gian',
      width: 220,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('updatedInfo'),
      render: (_: any, r: LritStationItem) => {
        return renderPersonTimeCell(r.updatedByName || r.createdByName, r.updatedAt || r.createdAt);
      },
    },
    {
      key: 'submittedInfo',
      label: 'Cán bộ gửi phê duyệt',
      width: 220,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('submittedInfo'),
      render: (_: any, r: LritStationItem) => renderPersonTimeCell(r.submittedByName || r.createdByName || r.submittedBy, r.submittedAt || r.createdAt),
    },
    {
      key: 'approvedLevel1Info',
      label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục',
      width: 320,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('approvedLevel1Info'),
      render: (_: any, r: LritStationItem) => renderPersonTimeCell(r.approverLevel1Name || r.approverLevel1, r.approvedDateLevel1),
    },
    {
      label: 'Cán bộ phê duyệt cấp Cục',
      key: 'approvedLevel2Info',
      width: 220,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('approvedLevel2Info'),
      render: (_: any, r: LritStationItem) => renderPersonTimeCell(r.approverLevel2Name || r.approverLevel2, r.approvedDateLevel2),
    },
  ], [page, pageSize]);

  // Dynamic Row Actions
  const getRowActions = (record: LritStationItem) => {
    const isCreator = Boolean(user?.id && (record.createdBy === user.id || record.createdBy === user.username));
    const isApproverL1 = Boolean(user?.id && (record as any).approverLevel1 && ((record as any).approverLevel1 === user.id || (record as any).approverLevel1 === user.username));
    const isDepartmentLevel = Boolean((user as any)?.role === 'SUPER_ADMIN' || (user as any)?.role === 'ADMIN' || (user as any)?.orgUnitLevel === 1 || (user as any)?.rank === 'DEPARTMENT');
    const canApproveC1 = hasPerm('coastalstationlrit:approvec1') || hasPerm('specialstation:approvec1') || hasPerm('admin:all') || isDepartmentLevel;
    const canApproveC2 = hasPerm('coastalstationlrit:approvec2') || hasPerm('coastalstationlrit:approve') || hasPerm('specialstation:approvec2') || hasPerm('specialstation:approve') || hasPerm('admin:all') || isDepartmentLevel;
    const st = normalizeApprovalStatus(record.approvalStatus);

    const actions: any[] = [
      {
        key: 'view',
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

    if (canEditApprovalRecord(record.approvalStatus, { hasPerm, resource: 'coastalstationlrit', extraApprovePerms: ['specialstation:approvec2', 'specialstation:approve', 'admin:all'] })) {
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

    actions.push({
      key: 'history',
      label: 'Lịch sử',
      icon: icons.history,
      onClick: () => handleOpenHistory(record),
    });

    if ((hasPerm('coastalstationlrit:update') || (user as any)?.role === 'SUPER_ADMIN' || (user as any)?.role === 'ADMIN') && (st === 'DRAFT' || st === 'REJECTED_LEVEL1' || st === 'REJECTED_LEVEL2')) {
      actions.push({
        key: 'submit',
        label: 'Gửi duyệt',
        icon: icons.submit,
        onClick: async () => {
          try {
            await lritStationService.submit(record.id);
            toast.success('Gửi duyệt thành công');
            refreshList();
          } catch (e: any) {
            toast.error(e?.message || 'Lỗi gửi duyệt');
          }
        },
      });
    }

    if (canApproveC1 && st === 'PENDING_APPROVAL' && (!isCreator || (user as any)?.role === 'SUPER_ADMIN' || (user as any)?.role === 'ADMIN')) {
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

    if (canApproveC2 && (st === 'APPROVED_LEVEL1' || st === 'APPROVED_L1' || st === 'CHO_PD_CAP_CUC') && (!isApproverL1 || (user as any)?.role === 'SUPER_ADMIN' || (user as any)?.role === 'ADMIN')) {
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

    if (canDeleteApprovalRecord(record.approvalStatus, { hasPerm, resource: 'coastalstationlrit', extraDeletePerms: ['specialstation:delete', 'admin:all'] })) {
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
        {/* Header */}
        <ScreenHeader
          breadcrumb={[
            { label: 'Tài sản KCHTGT' },
            { label: 'Đài thông tin LRIT' },
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

        {/* FilterTableLayout with Sidebar Filter */}
        <FilterTableLayout
          onFilterApply={() => handleFilterSearch(filterValues)}
          onFilterReset={handleFilterReset}
          filterCollapsed={filterCollapsed}
          onToggleCollapse={() => setFilterCollapsed((prev) => !prev)}
          hideFilterToggle={false}
          loading={loading}
          statusTabs={statusTabsConfig}
          onStatusTabChange={handleTabChange}
          filterContent={
            <>
              {/* ── Bộ lọc thường ── */}
              <SidebarFilterField label="Đơn vị quản lý" style={{ marginTop: spaceMd }}>
                <OrgUnitTreeSelect
                  organizations={filteredOrgUnits}
                  value={filterValues.orgUnitId}
                  onChange={(val) => setFilterValues((p) => ({ ...p, orgUnitId: val }))}
                  placeholder="Tất cả đơn vị"
                  allowClear
                  treeDefaultExpandAll={true}
                  listHeight={256}
                  style={{ ...selectStyle, width: '100%' }}
                />
              </SidebarFilterField>

              <SidebarFilterField label="Tên đài">
                <Input
                  placeholder="Nhập tên đài"
                  value={filterValues.name ?? ''}
                  onChange={(e) => setFilterValues((p) => ({ ...p, name: e.target.value }))}
                  onPressEnter={() => handleFilterSearch(filterValues)}
                  allowClear
                  style={{ ...inputStyle, width: '100%', borderRadius: radiusPill, height: 38 }}
                />
              </SidebarFilterField>

              <SidebarFilterField label="Tình trạng">
                <Select
                  placeholder="Tất cả tình trạng"
                  value={filterValues.conditionStatus}
                  onChange={(val) => setFilterValues((p) => ({ ...p, conditionStatus: val }))}
                  allowClear
                  options={CONDITION_STATUS_OPTIONS}
                  style={{ ...selectStyle, width: '100%' }}
                />
              </SidebarFilterField>

              {/* ── Bộ lọc nâng cao ── */}
              {filterCollapsed && (
                <>
                  <SidebarFilterField label="Mã đài">
                    <Input
                      placeholder="Nhập mã đài"
                      value={filterValues.code ?? ''}
                      onChange={(e) => setFilterValues((p) => ({ ...p, code: e.target.value }))}
                      onPressEnter={() => handleFilterSearch(filterValues)}
                      allowClear
                      style={{ ...inputStyle, width: '100%', borderRadius: radiusPill, height: 38 }}
                    />
                  </SidebarFilterField>

                  <SidebarFilterField label="Ngày cập nhật">
                    <DatePicker.RangePicker
                      {...getRangePickerProps({
                        value: filterValues.updateDateRange,
                        onChange: (dates: any) => setFilterValues((p) => ({ ...p, updateDateRange: dates })),
                      })}
                      style={{ width: '100%', borderRadius: radiusPill, height: 38 }}
                    />
                  </SidebarFilterField>

                  <SidebarFilterField label="Địa điểm (Tỉnh/Thành phố)">
                    <Select
                      placeholder="Tất cả tỉnh/thành phố"
                      value={filterValues.provinceId}
                      onChange={(val) => setFilterValues((p) => ({ ...p, provinceId: val }))}
                      allowClear
                      showSearch
                      filterOption={(input, option) =>
                        normalizeSearchText(String(option?.label || '')).includes(normalizeSearchText(input))
                      }
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
            dataSource={data}
            rowKey="id"
            rowActions={getRowActions}
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

        {/* Drawer Form (Create / Edit / Detail) */}
        {isModalOpen && (
          <LritStationForm
            open={true}
            mode={modalMode}
            editId={editingId}
            initialData={selectedRecord}
            orgUnits={filteredOrgUnits}
            symbolOptions={symbols}
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
          />
        )}

        {/* History Drawer */}
        <CommonHistoryDrawer
          open={historyModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          entityName={selectedRecord?.name || selectedRecord?.code || 'Đài LRIT'}
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
};

export default LritStationList;

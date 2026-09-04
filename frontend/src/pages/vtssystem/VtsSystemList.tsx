import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Modal, Input, Button, DatePicker, Select } from 'antd';
import {
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { vtsSystemCRUD, vtsSystemApproval } from '../../services/vtsSystemService';
import type { VtsSystemResponse, ListParams, ApprovalRequest } from '../../types/vtsSystem';
import { ConditionStatus, ApprovalStatus, CONDITION_STATUS_OPTIONS, CONDITION_STATUS_MAP } from '../../types/vtsSystem';
import { useAuthStore, type AuthState } from '../../store/authStore';
import { usePermissionStore, type PermissionState } from '../../store/permissionStore';
import { ScreenHeader, DataTable } from '../../components/list-view';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import Pagination from '../../components/list-view/Pagination';
import VtsSystemForm, { invalidateVtsDetailCache } from './VtsSystemForm';
import ApprovalModal from '../../components/shared/ApprovalModal';
import CommonHistoryDrawer from '../../components/shared/CommonHistoryDrawer';
import toast, { modal } from '../../components/ToastNotification';
import {
  actionPrimary, textSecondary,
  fontWeightBold, fontSizeMd,
  spaceFormField, spaceMd, spaceXs,
  statusOperational, statusCritical, statusAttention, statusDraft,
  selectStyle, statusBadgeStyle, icons, cellTitleStyle, cellSubtitleStyle,
  inputStyle, textAreaStyle, colors,
  getRangePickerProps,
} from '../../themetokenchk';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import dayjs from 'dayjs';
import { getProvinceNameById } from '../../types/common';
import { OrgUnitTreeSelect, normalizeSearchText, type OrgUnitTreeOption } from '../../components/org-unit';
import { canEditApprovalRecord } from '../../utils/approvalEditPolicy';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';



const CONDITION_COLOR: Record<string, string> = {
  [ConditionStatus.OPERATIONAL]: statusOperational,
  [ConditionStatus.STOPPED]: statusCritical,
  [ConditionStatus.MAINTENANCE]: statusAttention,
  [ConditionStatus.UNDER_CONSTRUCTION]: actionPrimary,
};

const HISTORY_PAGE_SIZE = 20;



export default function VtsSystemList() {
  const currentUser = useAuthStore((s: AuthState) => s.user);
  const hasPerm = usePermissionStore((s: PermissionState) => s.hasPermission);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filterSystemName, setFilterSystemName] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [filterConditionStatus, setFilterConditionStatus] = useState<ConditionStatus | undefined>();
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<ApprovalStatus | undefined>();
  const [filterOrgUnitId, setFilterOrgUnitId] = useState<string | undefined>();
  const [filterPortId, setFilterPortId] = useState<string | undefined>();
  const [filterOperationStartDateFrom, setFilterOperationStartDateFrom] = useState<string | undefined>();
  const [filterOperationStartDateTo, setFilterOperationStartDateTo] = useState<string | undefined>();
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState<string | undefined>();
  const [filterUpdatedTo, setFilterUpdatedTo] = useState<string | undefined>();
  const [orgUnitOptions, setOrgUnitOptions] = useState<OrgUnitTreeOption[]>([]);
  const [portOptions, setPortOptions] = useState<Array<{ id: string; portName?: string; portCode?: string; orgUnitId?: string }>>([]);
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
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
    (async () => {
      try {
        const [orgs, ports] = await Promise.all([
          vtsSystemCRUD.getScopedOrgUnitOptions(),
          vtsSystemCRUD.getScopedPortOptions(),
        ]);
        setOrgUnitOptions(orgs.map((o: any) => {
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
        // Counts are for all approval statuses. Changing the active status tab
        // must not change the scope used to calculate the tab counts.
        filterSystemName, filterCode, filterConditionStatus, filterOrgUnitId, filterPortId,
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
      if (shouldIncludeCounts) {
        // An empty map is a valid response when the active filters match no
        // records. Reset every tab instead of retaining counts from a previous
        // filter (which made the tabs show stale totals such as 329).
        const counts = res.statusCounts || {};
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
  }, [page, pageSize, filterSystemName, filterCode, filterConditionStatus, filterApprovalStatus, filterOrgUnitId, filterPortId,
    filterOperationStartDateFrom, filterOperationStartDateTo, filterUpdatedFrom, filterUpdatedTo,
    sortField, sortDirection]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSort = useCallback((field: string, order: 'asc' | 'desc') => {
    setSortField(field);
    setSortDirection(order);
    setPage(1);
  }, []);

  const refreshList = useCallback(() => {
    statusCountFilterKey.current = null;
    void fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    try { await vtsSystemCRUD.delete(id); invalidateVtsDetailCache(id); toast.success('Xóa thành công'); refreshList(); }
    catch (err: any) { toast.error(err?.message || 'Lỗi xóa'); }
  };

  const confirmDelete = (record: VtsSystemResponse) => {
    modal.confirm({
      title: 'Xác nhận xóa hệ thống VTS',
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
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi phê duyệt');
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
    } catch (err: any) { toast.error(err?.message || 'Lỗi từ chối'); }
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
  }, [historyModalOpen, selectedRecord?.id, historyFilters]);

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

  const sortOrderFor = (key: string): 'ascend' | 'descend' | null =>
    (sortField === key ? (sortDirection === 'asc' ? 'ascend' : 'descend') : null);

  // Bộ so sánh trung tính: thứ tự do server quyết định, hàm này chỉ để antd hiện
  // biểu tượng sắp xếp mà không tự sắp lại 20 dòng của trang hiện tại.
  const serverSideSorter = () => 0;

  // Tab "Từ chối" gộp cả hai mức trả về (Cảng vụ / Cục).
  const isRejectedTab = filterApprovalStatus === ApprovalStatus.REJECTED_LEVEL1
    || filterApprovalStatus === ApprovalStatus.REJECTED_LEVEL2;

  const columns = useMemo(() => [
    {
      key: 'stt',
      label: 'STT',
      width: 60,
      align: 'center' as const,
      fixed: 'left' as const,
      ellipsis: false,
      render: (_: unknown, __: unknown, idx: number) => (page - 1) * pageSize + idx + 1,
    },
    {
      key: 'systemName',
      label: <span>Tên/Mã hệ thống VTS</span>,
      dataIndex: 'systemName',
      // list-screen-ui-standard §2: cột Tên/Mã KCHT rộng 220–260px.
      width: 260,
      fixed: 'left' as const,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('systemName'),
      ellipsis: false,
      render: (val: string, record: VtsSystemResponse) => (
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <a
            title={val}
            onClick={() => {
              setEditingId(record.id);
              setSelectedRecord(record);
              setModalMode('detail');
              setIsModalOpen(true);
            }}
            style={{
              ...cellTitleStyle,
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {val || '—'}
          </a>
          <span style={{ ...cellSubtitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {record.code || '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'orgUnitName',
      label: 'Đơn vị quản lý',
      dataIndex: 'orgUnitName',
      width: 260,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('orgUnitName'),
      render: (val: string) => (
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={val}>
          <span style={{ fontWeight: fontWeightBold }}>{val || '—'}</span>
        </div>
      ),
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
    {
      key: 'portName',
      label: 'Thuộc cảng biển',
      dataIndex: 'portName',
      width: 200,
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
      label: 'Địa điểm',
      dataIndex: 'address',
      width: 220,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('address'),
      render: (val: string, record: any) => {
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
      // chk chỉ để cột tình trạng ở tab "Tất cả" và tab "Đã duyệt".
      hidden: Boolean(filterApprovalStatus) && filterApprovalStatus !== ApprovalStatus.APPROVED,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('conditionStatus'),
      render: (val: ConditionStatus) => {
        if (!val) return '—';
        const display = CONDITION_STATUS_MAP[val] || val;
        const color = CONDITION_COLOR[val] || textSecondary;
        return (
          <span style={statusBadgeStyle(color)}>{display}</span>
        );
      },
    },
    {
      key: 'approvalStatus',
      label: 'Trạng thái',
      dataIndex: 'approvalStatus',
      width: 280,
      // Đang đứng ở tab trạng thái nào thì cột này thừa — chk ẩn luôn.
      hidden: Boolean(filterApprovalStatus),
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('approvalStatus'),
      render: (val: string) => <ApprovalStatusBadge status={val} />,
    },
    {
      key: 'rejectionReason',
      label: 'Lý do từ chối',
      dataIndex: 'rejectionReason',
      width: 260,
      // Chỉ có nghĩa ở tab "Từ chối", nên chỉ xuất hiện ở đó.
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
      render: (val: string, record: any) => {
        // list-screen-ui-standard §3: chỉ hiển thị Họ và tên. Không fallback sang
        // `updatedBy`/`createdBy` vì đó là UUID, tuyệt đối không đưa ra giao diện.
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
  ], [page, pageSize, sortField, sortDirection, filterApprovalStatus, isRejectedTab]);

  const rowActions = useCallback((record: VtsSystemResponse) => {
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
          } catch (e: any) {
            // Interceptor api.ts đã Việt hóa lỗi vào `message`; dùng nó để toast
            // không bị lệch nội dung so với các thao tác phê duyệt khác.
            toast.error(e?.message || 'Có lỗi xảy ra');
          }
        },
      });
    }
    if (hasPerm('vts:approvec1') && record.approvalStatus === ApprovalStatus.PENDING_APPROVAL) {
      const isCreator = Boolean(currentUser?.userId && record.createdBy === currentUser.userId);
      if (!isCreator) {
        actions.push({ key: 'approveC1', label: 'Phê duyệt cấp Cảng vụ/Chi cục', icon: icons.approve, onClick: () => openApproveModal(record.id, 'c1') });
        actions.push({ key: 'rejectC1', label: 'Từ chối cấp Cảng vụ/Chi cục', danger: true, icon: icons.reject, onClick: () => openRejectModal(record.id, 'c1') });
      }
    }
    if (hasPerm('vts:approvec2') && record.approvalStatus === ApprovalStatus.APPROVED_LEVEL1) {
      const isApproverL1 = Boolean(currentUser?.userId && record.approverLevel1 === currentUser.userId);
      if (!isApproverL1) {
        actions.push({ key: 'approveC2', label: 'Phê duyệt cấp Cục', icon: icons.approve, onClick: () => openApproveModal(record.id, 'c2') });
        actions.push({ key: 'rejectC2', label: 'Từ chối cấp Cục', danger: true, icon: icons.reject, onClick: () => openRejectModal(record.id, 'c2') });
      }
    }
    // T13/N04: chỉ hồ sơ đang "Lưu tạm" mới được xóa (approval-2-level-spec §3.6).
    if (hasPerm('vts:delete') && record.approvalStatus === ApprovalStatus.DRAFT) {
      actions.push({ key: 'delete', label: 'Xóa', icon: icons.delete, danger: true, onClick: () => confirmDelete(record) });
    }
    return actions;
  }, [hasPerm, currentUser?.userId, refreshList]);

  const countAllFiltered = countDraft + countPendingApproval + countApprovedLevel1 + countApproved + countRejectedLevel1 + countRejectedLevel2;

  const statusTabs = useMemo(() => [
    { key: 'all', label: 'Tất cả', count: filterApprovalStatus ? countAllFiltered : total, color: actionPrimary, active: !filterApprovalStatus },
    { key: ApprovalStatus.DRAFT, label: 'Lưu tạm', count: countDraft, color: statusDraft, active: filterApprovalStatus === ApprovalStatus.DRAFT },
    { key: ApprovalStatus.PENDING_APPROVAL, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', count: countPendingApproval, color: statusAttention, active: filterApprovalStatus === ApprovalStatus.PENDING_APPROVAL },
    { key: ApprovalStatus.APPROVED_LEVEL1, label: 'Chờ phê duyệt cấp Cục', count: countApprovedLevel1, color: '#0284C7', active: filterApprovalStatus === ApprovalStatus.APPROVED_LEVEL1 },
    { key: ApprovalStatus.APPROVED, label: 'Đã phê duyệt', count: countApproved, color: statusOperational, active: filterApprovalStatus === ApprovalStatus.APPROVED },
    { key: ApprovalStatus.REJECTED_LEVEL1, label: 'Từ chối cấp Cảng vụ/Chi cục', count: countRejectedLevel1, color: statusCritical, active: filterApprovalStatus === ApprovalStatus.REJECTED_LEVEL1 },
    { key: ApprovalStatus.REJECTED_LEVEL2, label: 'Từ chối cấp Cục', count: countRejectedLevel2, color: statusCritical, active: filterApprovalStatus === ApprovalStatus.REJECTED_LEVEL2 },
  ], [total, countAllFiltered, filterApprovalStatus, countDraft, countPendingApproval, countApprovedLevel1, countApproved, countRejectedLevel1, countRejectedLevel2]);

  const handleFilterSearch = useCallback((values: Record<string, any>) => {
    setFilterSystemName(values.systemName?.trim() || '');
    setFilterCode(values.code?.trim() || '');
    setFilterOrgUnitId(values.orgUnitId || undefined);
    setFilterPortId(values.portId || undefined);
    setFilterConditionStatus(values.conditionStatus || undefined);
    setFilterApprovalStatus(values.approvalStatus || undefined);

    if (values.operationDateRange && values.operationDateRange[0] && values.operationDateRange[1]) {
      setFilterOperationStartDateFrom(values.operationDateRange[0].format('YYYY-MM-DD'));
      setFilterOperationStartDateTo(values.operationDateRange[1].format('YYYY-MM-DD'));
    } else {
      setFilterOperationStartDateFrom(undefined);
      setFilterOperationStartDateTo(undefined);
    }

    if (values.updateDateRange && values.updateDateRange[0] && values.updateDateRange[1]) {
      // Backend nhận LocalDateTime và BỎ QUA offset, nên `toISOString()` (giờ UTC)
      // làm cửa sổ lọc lệch đúng bằng chênh lệch múi giờ (VN: -7h) — hồ sơ cập nhật
      // sau 17h của ngày kết thúc bị loại oan. Gửi thẳng giờ địa phương.
      setFilterUpdatedFrom(values.updateDateRange[0].startOf('day').format('YYYY-MM-DDTHH:mm:ss'));
      setFilterUpdatedTo(values.updateDateRange[1].endOf('day').format('YYYY-MM-DDTHH:mm:ss'));
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
    setFilterConditionStatus(undefined);
    setFilterApprovalStatus(undefined);
    setFilterOperationStartDateFrom(undefined);
    setFilterOperationStartDateTo(undefined);
    setFilterUpdatedFrom(undefined);
    setFilterUpdatedTo(undefined);
    setFilterValues({});
    setPage(1);
  }, []);

  const handleTabChange = useCallback((key: string) => {
    const approvalStatus = key === 'all' ? undefined : key as ApprovalStatus;
    setFilterApprovalStatus(approvalStatus);
    setFilterValues((prev) => ({ ...prev, approvalStatus }));
    setPage(1);
  }, []);


  return (
    <ThemeTokenProvider tokens={themeTokenChk}>
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
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
            {/* ── BỘ LỌC THƯỜNG (CƠ BẢN) ── */}
            <div style={{ marginBottom: spaceFormField, marginTop: spaceMd }}>
              <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>Đơn vị quản lý</div>
              <OrgUnitTreeSelect
                organizations={orgUnitOptions}
                placeholder="Tất cả"
                allowClear
                treeDefaultExpandAll={true}
                listHeight={256}
                value={filterValues.orgUnitId}
                onChange={(value) => {
                  setFilterValues((prev) => ({ ...prev, orgUnitId: value, portId: undefined }));
                }}
                style={{ ...selectStyle, width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: spaceFormField }}>
              <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>Thuộc cảng biển</div>
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
            </div>

            <div style={{ marginBottom: spaceFormField }}>
              <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>Tên hệ thống VTS</div>
              <Input
                placeholder="Nhập tên hệ thống VTS"
                allowClear
                value={filterValues.systemName || ''}
                onChange={(event) => setFilterValues((prev) => ({ ...prev, systemName: event.target.value }))}
                onPressEnter={() => handleFilterSearch(filterValues)}
                style={inputStyle}
              />
            </div>

            {/* ── BỘ LỌC NÂNG CAO ── */}
            {filterCollapsed && (
              <>
                <div style={{ marginBottom: spaceFormField }}>
                  <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>Tình trạng</div>
                  <Select
                    placeholder="Tất cả"
                    allowClear
                    value={filterValues.conditionStatus}
                    onChange={(value) => setFilterValues((prev) => ({ ...prev, conditionStatus: value }))}
                    options={CONDITION_STATUS_OPTIONS}
                    style={{ ...selectStyle, width: '100%' }}
                  />
                </div>

                <div style={{ marginBottom: spaceFormField }}>
                  <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>Mã hệ thống VTS</div>
                  <Input
                    placeholder="Nhập mã hệ thống VTS"
                    allowClear
                    value={filterValues.code || ''}
                    onChange={(event) => setFilterValues((prev) => ({ ...prev, code: event.target.value }))}
                    onPressEnter={() => handleFilterSearch(filterValues)}
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: spaceFormField }}>
                  <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>
                    Thời gian bắt đầu hoạt động
                  </div>
                  <DatePicker.RangePicker
                    {...getRangePickerProps({
                      value: filterValues.operationDateRange,
                      onChange: (dates: any) => setFilterValues((prev) => ({ ...prev, operationDateRange: dates })),
                    })}
                  />
                </div>

                <div style={{ marginBottom: spaceFormField }}>
                  <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>
                    Ngày cập nhật
                  </div>
                  <DatePicker.RangePicker
                    {...getRangePickerProps({
                      value: filterValues.updateDateRange,
                      onChange: (dates: any) => setFilterValues((prev) => ({ ...prev, updateDateRange: dates })),
                    })}
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
      <Modal title="Từ chối" open={rejectModalOpen} onOk={handleReject}
        onCancel={() => setRejectModalOpen(false)} okText="Từ chối" cancelText="Hủy" okButtonProps={{ danger: true }}>
        <p style={{ marginBottom: spaceFormField }}>Nhập lý do từ chối (tối thiểu 10 ký tự):</p>
        <Input.TextArea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Nhập lý do từ chối..." style={textAreaStyle} />
      </Modal>
    </div>
    </ThemeTokenProvider>
  );
}

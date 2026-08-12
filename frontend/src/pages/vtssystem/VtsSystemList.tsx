import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Typography, Modal, Input, Drawer, Button, DatePicker, Space, Select, TreeSelect } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  CheckOutlined,
  CloseOutlined,
  HistoryOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { vtsSystemCRUD, vtsSystemApproval } from '../../services/vtsSystemService';
import type { VtsSystemResponse, ListParams, ApprovalRequest } from '../../types/vtsSystem';
import { ConditionStatus, ApprovalStatus, CONDITION_STATUS_OPTIONS, CONDITION_STATUS_MAP } from '../../types/vtsSystem';
import { useAuthStore } from '../../store/authStore';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { ScreenHeader, DataTable } from '../../components/list-view';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import Pagination from '../../components/list-view/Pagination';
import VtsSystemForm from './VtsSystemForm';
import toast from '../../components/ToastNotification';
import {
  actionPrimary, textPrimary, textSecondary, textTertiary,
  fontWeightBold, fontWeightMedium, fontSizeMd, fontSizeLg,
  radiusSm, radiusPill, spaceFormField, spaceMd, spaceSm, spaceLg,
  statusOperational, statusDraft, statusCritical, statusAttention,
  surfacePage, spaceXs, spaceXl, drawerTitleStyle, drawerCloseBtnStyle, selectStyle,
} from '../../tokens';
import { colors } from '../../theme';
import dayjs from 'dayjs';
import { getProvinceNameById } from '../../types/common';

function formatDate(value: string | undefined): string {
  return value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—';
}

const APPROVAL_STATUS_MAP: Record<string, string> = {
  [ApprovalStatus.PROPOSED]: 'Chờ phê duyệt',
  [ApprovalStatus.PENDING_APPROVAL]: 'Chờ phê duyệt',
  [ApprovalStatus.APPROVED_LEVEL1]: 'Đã duyệt C1',
  [ApprovalStatus.APPROVED_LEVEL2]: 'Đã duyệt C2',
  [ApprovalStatus.APPROVED]: 'Đã phê duyệt',
  [ApprovalStatus.REJECTED]: 'Từ chối',
  [ApprovalStatus.UNDER_REVIEW]: 'Đang xem xét',
};

const APPROVAL_COLOR: Record<string, string> = {
  [ApprovalStatus.PROPOSED]: statusAttention,
  [ApprovalStatus.PENDING_APPROVAL]: statusAttention,
  [ApprovalStatus.APPROVED_LEVEL1]: actionPrimary,
  [ApprovalStatus.APPROVED_LEVEL2]: actionPrimary,
  [ApprovalStatus.APPROVED]: statusOperational,
  [ApprovalStatus.REJECTED]: statusCritical,
  [ApprovalStatus.UNDER_REVIEW]: actionPrimary,
};

const CONDITION_COLOR: Record<string, string> = {
  [ConditionStatus.OPERATIONAL]: statusOperational,
  [ConditionStatus.STOPPED]: statusCritical,
  [ConditionStatus.MAINTENANCE]: statusAttention,
  [ConditionStatus.UNDER_CONSTRUCTION]: actionPrimary,
};

const HISTORY_PAGE_SIZE = 20;

type OrgUnitOption = {
  label: string;
  value: string;
  parentId?: string;
};

type OrgUnitTreeOption = {
  title: string;
  value: string;
  key: string;
  children?: OrgUnitTreeOption[];
};

function buildOrgUnitTree(options: OrgUnitOption[]): OrgUnitTreeOption[] {
  const nodes = new Map<string, OrgUnitTreeOption>();
  options.forEach((option) => {
    nodes.set(option.value, {
      title: option.label,
      value: option.value,
      key: option.value,
    });
  });

  const roots: OrgUnitTreeOption[] = [];
  options.forEach((option) => {
    const node = nodes.get(option.value);
    if (!node) return;
    const parent = option.parentId ? nodes.get(option.parentId) : undefined;
    if (parent) {
      (parent.children ||= []).push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

// ── History helpers ──────────────────────────────────────────────

function historyFieldName(fn: string): string {
  const map: Record<string, string> = {
    systemName: 'Tên hệ thống VTS', code: 'Mã hệ thống VTS', province: 'Tỉnh/Thành phố',
    provinceId: 'Mã tỉnh/thành', address: 'Địa điểm chi tiết', maritimeNotice: 'Thông báo hàng hải',
    operationStartDate: 'Thời gian bắt đầu hoạt động', scope: 'Phạm vi áp dụng',
    note: 'Ghi chú', responsibilityLevel: 'Mức độ phụ trách', source: 'Nguồn gốc',
    partner: 'Đối tác', approvalStatus: 'Trạng thái phê duyệt', conditionStatus: 'Tình trạng',
    orgUnitName: 'Đơn vị quản lý', owningOrgName: 'Đơn vị chủ quản',
    operatingOrgName: 'Đơn vị vận hành khai thác', portName: 'Thuộc cảng biển',
  };
  return map[fn] || fn;
}

function historyFieldValue(fn: string, val: string | null): string {
  if (!val || val === '(null)' || val === 'null' || val === '') return '(trống)';
  // History values can be persisted as `Tên trường=Giá trị`, or as a
  // semicolon-separated list of those pairs. The field label is rendered in
  // the first column, so keep only the value here.
  const displayValue = val.split(';').map((part) => {
    const separator = part.indexOf('=');
    return separator >= 0 ? part.slice(separator + 1).trim() : part.trim();
  }).filter(Boolean).join('; ');
  const historyFieldKeys = fn.split(/[,;]+/).map(normalizeHistoryKey);
  const isApprovalField = fn === 'approvalStatus'
    || historyFieldKeys.includes('approvalstatus')
    || historyFieldKeys.includes('trang thai phe duyet');
  if (isApprovalField) {
    const statusMap: Record<string, string> = {
      PROPOSED: 'Chờ phê duyệt',
      PENDING_APPROVAL: 'Đang xem xét',
      PENDING: 'Đang xem xét',
      UNDER_REVIEW: 'Đang xem xét',
      APPROVED_LEVEL1: 'Đã phê duyệt C1',
      APPROVED_LEVEL2: 'Đã phê duyệt C2',
      APPROVED: 'Đã phê duyệt',
      DA_PHE_DUYET: 'Đã phê duyệt',
      REJECTED: 'Từ chối',
      TU_CHOI: 'Từ chối',
    };
    return displayValue.split(';').map((value) => {
      const normalizedValue = value.trim();
      return statusMap[normalizedValue] || statusMap[normalizedValue.toUpperCase()] || normalizedValue;
    }).join('; ');
  }
  if (fn === 'orgUnitId' || fn === 'owningOrgId' || fn === 'operatingOrgId' || fn === 'portId') return displayValue;
  if (fn === 'provinceId') { const num = Number(displayValue); if (!isNaN(num)) return getProvinceNameById(num) || displayValue; return displayValue; }
  if (fn === 'approvalStatus') { const m: Record<string, string> = { PROPOSED: 'Chờ phê duyệt', PENDING_APPROVAL: 'Chờ phê duyệt', PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', DA_PHE_DUYET: 'Đã phê duyệt', REJECTED: 'Từ chối', TU_CHOI: 'Từ chối' }; return m[displayValue] || m[displayValue?.toUpperCase()] || displayValue; }
  if (fn === 'conditionStatus') { return CONDITION_STATUS_MAP[displayValue as ConditionStatus] || displayValue; }
  return displayValue;
}

function historyTimestamp(item: any): string {
  return item.approvedDate || item.changedAt || item.createdAt || '';
}

function historyField(item: any): string {
  return item.changedField || item.fieldName || '';
}

function historyOldValue(item: any): string | null {
  return item.previousValue ?? item.oldValue ?? null;
}

function historyNewValue(item: any): string | null {
  return item.newValue ?? null;
}

function historyActor(item: any): string {
  return item.approvedBy || item.changedBy || '';
}

function getActionLabel(items: any[]): { label: string; color: string } {
  const levels = items.map((i: any) => Number(i.approvalLevel || 0));
  const statuses = items.map((i: any) => String(i.status || '').toUpperCase());
  const fields = items.map(historyField);
  const newVals = items.map((i: any) => historyNewValue(i) || '');
  if (fields.includes('deletedAt')) return { label: 'Xóa', color: 'red' };
  if (levels.includes(2)) return { label: 'Phê duyệt C2', color: 'green' };
  if (levels.includes(1)) return { label: 'Phê duyệt C1', color: 'gold' };
  if (statuses.includes('REJECTED')) return { label: 'Từ chối', color: 'red' };
  if (fields.includes('approvalStatus')) {
    const idx = fields.indexOf('approvalStatus');
    const newStatus = newVals[idx];
    if (newStatus === 'APPROVED') return { label: 'Phê duyệt', color: 'green' };
    if (newStatus === 'REJECTED') return { label: 'Từ chối', color: 'red' };
    if (newStatus === 'PENDING') return { label: 'Gửi phê duyệt', color: 'orange' };
  }
  const nullCount = items.filter((i: any) => historyOldValue(i) === null || historyOldValue(i) === '(null)').length;
  if (nullCount > items.length / 2) return { label: 'Tạo mới', color: 'blue' };
  return { label: 'Chỉnh sửa', color: 'blue' };
}

function getHistoryActionAccent(items: any[], action: { color: string }): string {
  const statuses = items.map((item: any) => String(item.status || '').toUpperCase());
  const approvalValues = items
    .filter((item: any) => {
      const key = normalizeHistoryKey(historyField(item));
      return key === 'approvalstatus' || key.includes('trang thai phe duyet');
    })
    .flatMap((item: any) => historyFieldValue(historyField(item), historyNewValue(item)).split(';'))
    .map((value: string) => normalizeHistoryKey(value));

  if (statuses.includes('REJECTED') || approvalValues.some((value) => value === 'rejected' || value === 'tu choi')) {
    return statusCritical;
  }
  if (statuses.includes('APPROVED') || approvalValues.some((value) => value === 'approved' || value.startsWith('da phe duyet'))) {
    return statusOperational;
  }
  if (statuses.includes('PROPOSED') || approvalValues.some((value) => value === 'proposed' || value === 'cho phe duyet')) {
    return statusAttention;
  }
  if (statuses.includes('UNDER_REVIEW') || approvalValues.some((value) => value === 'under_review' || value === 'dang xem xet')) {
    return actionPrimary;
  }

  return action.color === 'red'
    ? statusCritical
    : action.color === 'green'
      ? statusOperational
      : action.color === 'gold' || action.color === 'orange'
        ? statusAttention
        : actionPrimary;
}

function normalizeHistoryKey(value: string): string {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizedHistoryFields(value: string): string[] {
  const fields = value.split(/[,;]+/).map((field: string) => field.trim()).filter(Boolean);
  const hasApprovalStatus = fields.some((field) => {
    const key = normalizeHistoryKey(field);
    return key === 'approvalstatus' || key === 'trang thai phe duyet';
  });

  // Older approval records could persist both the status and the derived
  // approvedLevel1/approvedLevel2 flag. The approval timeline represents one
  // workflow transition, so keep only the status row when both are present.
  if (hasApprovalStatus) {
    return fields.filter((field) => {
      const key = normalizeHistoryKey(field);
      return key !== 'approvedlevel1'
        && key !== 'approvedlevel2'
        && key !== 'da phe duyet cap 1'
        && key !== 'da phe duyet cap 2';
    });
  }

  return fields;
}

function parseHistoryAssignments(value: string | null): Map<string, string> {
  const result = new Map<string, string>();
  if (!value) return result;
  value.split(';').forEach((part) => {
    const separator = part.indexOf('=');
    if (separator < 0) return;
    result.set(normalizeHistoryKey(part.slice(0, separator)), part.slice(separator + 1).trim());
  });
  return result;
}

function historyChangeRows(item: any): Array<{ field: string; oldValue: string | null; newValue: string | null }> {
  const fields = normalizedHistoryFields(historyField(item));
  const oldValue = historyOldValue(item);
  const newValue = historyNewValue(item);
  const oldAssignments = parseHistoryAssignments(oldValue);
  const newAssignments = parseHistoryAssignments(newValue);

  // Approval entries often contain multiple field names but one status pair.
  // Keep those as one logical change instead of duplicating the same values.
  if (fields.length > 1 && oldAssignments.size === 0 && newAssignments.size === 0) {
    return [{ field: fields.join(', '), oldValue, newValue }];
  }

  if (fields.length === 0) {
    return [{ field: '', oldValue, newValue }];
  }

  return fields.map((field, index) => {
    const displayField = historyFieldName(field);
    const oldAssigned = oldAssignments.get(normalizeHistoryKey(field))
      ?? oldAssignments.get(normalizeHistoryKey(displayField));
    const newAssigned = newAssignments.get(normalizeHistoryKey(field))
      ?? newAssignments.get(normalizeHistoryKey(displayField));
    const oldParts = oldValue?.split(';').map((part) => part.trim()).filter(Boolean) || [];
    const newParts = newValue?.split(';').map((part) => part.trim()).filter(Boolean) || [];
    return {
      field,
      oldValue: oldAssigned ?? (fields.length === 1 ? oldValue : oldParts[index] || null),
      newValue: newAssigned ?? (fields.length === 1 ? newValue : newParts[index] || null),
    };
  });
}

export default function VtsSystemList() {
  const currentUser = useAuthStore((s) => s.user);
  const userPermissions = currentUser?.permissions || [];
  const isAdmin = userPermissions.includes('*');
  const hasPerm = useCallback((permission: string) => isAdmin || userPermissions.includes(permission), [isAdmin, userPermissions]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterConditionStatus, setFilterConditionStatus] = useState<ConditionStatus | undefined>();
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<ApprovalStatus | undefined>();
  const [filterOrgUnitId, setFilterOrgUnitId] = useState<string | undefined>();
  const [orgUnitOptions, setOrgUnitOptions] = useState<OrgUnitOption[]>([]);
  const orgUnitTreeOptions = useMemo(() => buildOrgUnitTree(orgUnitOptions), [orgUnitOptions]);
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});

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

  // History drawer state
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [historySearch, setHistorySearch] = useState('');
  const [historyDateFrom, setHistoryDateFrom] = useState<string>('');
  const [historyDateTo, setHistoryDateTo] = useState<string>('');

  // Count tabs
  const [countProposed, setCountProposed] = useState<number>(0);
  const [countUnderReview, setCountUnderReview] = useState<number>(0);
  const [countApproved, setCountApproved] = useState<number>(0);
  const [countRejected, setCountRejected] = useState<number>(0);
  const statusCountFilterKey = useRef<string | null>(null);
  const listRequestId = useRef(0);

  useEffect(() => {
    (async () => {
      try {
        const list = await vtsSystemCRUD.getScopedOrgUnitOptions();
        setOrgUnitOptions(list.map((o: any) => {
          const code = o.code || o.maDonVi;
          const name = o.name || o.unitName || o.tenDonVi || 'Đơn vị';
          return {
            label: code ? `${code} - ${name}` : name,
            value: String(o.id),
            parentId: o.parentId ? String(o.parentId) : undefined,
          };
        }));
      } catch (e) { console.error('Failed to fetch org units for filter', e); }
    })();
  }, []);

  const fetchData = useCallback(async () => {
    const requestId = ++listRequestId.current;
    setLoading(true);
    setIsError(false);
    try {
      const currentStatusCountFilterKey = JSON.stringify([
        // Counts are for all approval statuses. Changing the active status tab
        // must not change the scope used to calculate the tab counts.
        filterKeyword, filterConditionStatus, filterOrgUnitId,
      ]);
      const shouldIncludeCounts = statusCountFilterKey.current !== currentStatusCountFilterKey;
      const params: ListParams & { includeCounts: boolean } = {
        page: page - 1, size: pageSize,
        keyword: filterKeyword || undefined,
        conditionStatus: filterConditionStatus,
        approvalStatus: filterApprovalStatus,
        orgUnitId: filterOrgUnitId || undefined,
        includeCounts: shouldIncludeCounts,
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
        setCountProposed(Number(counts.PROPOSED) || 0);
        setCountUnderReview(Number(counts.UNDER_REVIEW) || 0);
        setCountApproved(Number(counts.APPROVED) || 0);
        setCountRejected(Number(counts.REJECTED) || 0);
        statusCountFilterKey.current = currentStatusCountFilterKey;
      }
    } catch (err: unknown) {
      if (requestId !== listRequestId.current) return;
      setIsError(true);
      setErrorMessage(err instanceof Error ? err.message : 'Không thể tải danh sách');
    } finally {
      if (requestId === listRequestId.current) setLoading(false);
    }
  }, [page, pageSize, filterKeyword, filterConditionStatus, filterApprovalStatus, filterOrgUnitId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const refreshList = useCallback(() => {
    statusCountFilterKey.current = null;
    void fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    try { await vtsSystemCRUD.delete(id); toast.success('Xóa thành công'); refreshList(); }
    catch (err: any) { toast.error(err?.message || 'Lỗi xóa'); }
  };

  const confirmDelete = (record: VtsSystemResponse) => {
    Modal.confirm({
      title: 'Xác nhận xóa hệ thống VTS',
      icon: <ExclamationCircleOutlined />,
      content: 'Bản ghi đã phê duyệt sẽ được xóa mềm và không còn hiển thị trong danh sách.',
      okText: 'Xóa', okType: 'danger', cancelText: 'Hủy',
      onOk: () => handleDelete(record.id),
    });
  };

  const handleApproveC1 = async (record: VtsSystemResponse) => {
    try {
      await vtsSystemApproval.approveC1(record.id, { decision: 'APPROVED', reason: 'Phê duyệt cấp 1' });
      toast.success('Phê duyệt cấp 1 thành công'); refreshList();
    } catch (err: any) { toast.error(err?.message || 'Lỗi phê duyệt'); }
  };

  const handleApproveC2 = async (record: VtsSystemResponse) => {
    try {
      await vtsSystemApproval.approveC2(record.id, { decision: 'APPROVED', reason: 'Phê duyệt cấp 2' });
      toast.success('Phê duyệt cấp 2 thành công'); refreshList();
    } catch (err: any) { toast.error(err?.message || 'Lỗi phê duyệt'); }
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
    setHistorySearch('');
    setHistoryDateFrom('');
    setHistoryDateTo('');
  };

  useEffect(() => {
    if (!historyModalOpen || !selectedRecord) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoadingHistory(true);
      setLoadingMoreHistory(false);
      setHasMoreHistory(true);
      setHistoryRecords([]);
      try {
        const history = await vtsSystemApproval.getHistory(selectedRecord.id, 0, HISTORY_PAGE_SIZE, {
          keyword: historySearch,
          fromDate: historyDateFrom,
          toDate: historyDateTo,
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
    }, historySearch.trim() ? 300 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [historyModalOpen, selectedRecord?.id, historySearch, historyDateFrom, historyDateTo]);

  const loadMoreHistory = async () => {
    if (!selectedRecord || loadingHistory || loadingMoreHistory || !hasMoreHistory) return;
    setLoadingMoreHistory(true);
    try {
      const nextPage = Math.floor(historyRecords.length / HISTORY_PAGE_SIZE) + 1;
      const history = await vtsSystemApproval.getHistory(selectedRecord.id, nextPage, HISTORY_PAGE_SIZE, {
        keyword: historySearch,
        fromDate: historyDateFrom,
        toDate: historyDateTo,
      });
      if (history && history.length > 0) {
        setHistoryRecords(prev => [...prev, ...history]);
      }
      setHasMoreHistory((history || []).length === HISTORY_PAGE_SIZE);
    } catch { /* ignore */ }
    finally { setLoadingMoreHistory(false); }
  };

  const handleHistoryScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 30) {
      loadMoreHistory();
    }
  };

  const columns = useMemo(() => [
    { key: 'stt', label: 'STT', width: 60, align: 'center' as const, fixed: 'left' as const,
      render: (_: unknown, __: unknown, idx: number) => (page - 1) * pageSize + idx + 1 },
    { key: 'systemName', label: 'Tên hệ thống', dataIndex: 'systemName', width: 300, sortable: true,
      render: (val: string) => <Typography.Text strong>{val || '—'}</Typography.Text> },
    { key: 'address', label: 'Địa điểm chi tiết', dataIndex: 'address', width: 240, sortable: true,
      render: (val: string) => val || '—' },
    { key: 'conditionStatus', label: 'Tình trạng', dataIndex: 'conditionStatus', width: 170, sortable: true, align: 'center' as const,
      render: (val: ConditionStatus) => {
        if (!val) return '—';
        const display = CONDITION_STATUS_MAP[val] || val;
        const color = CONDITION_COLOR[val] || textSecondary;
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', border: `1px solid ${color}40`, borderRadius: radiusPill, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${color}15`, color, whiteSpace: 'nowrap' }}>{display}</span>;
      }},
    { key: 'orgUnitName', label: 'Đơn vị quản lý', dataIndex: 'orgUnitName', width: 220 },
    { key: 'approvalStatus', label: 'Trạng thái', dataIndex: 'approvalStatus', width: 170, sortable: true, align: 'center' as const,
      render: (val: ApprovalStatus) => {
        const label = APPROVAL_STATUS_MAP[val] || val;
        const color = APPROVAL_COLOR[val] || textSecondary;
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', border: `1px solid ${color}40`, borderRadius: radiusPill, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${color}15`, color }}>{label}</span>;
      }},
  ], [page, pageSize]);

  const rowActions = useCallback((record: VtsSystemResponse) => {
    const actions: { key: string; label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean; disabled?: boolean }[] = [];
    if (hasPerm('vts:read')) {
      actions.push({ key: 'view', label: 'Xem chi tiết', icon: <EyeOutlined />, onClick: () => { setEditingId(record.id); setSelectedRecord(record); setModalMode('detail'); setIsModalOpen(true); } });
      actions.push({ key: 'history', label: 'Lịch sử', icon: <HistoryOutlined />, onClick: () => handleViewHistory(record) });
    }
    if (hasPerm('vts:update') && record.approvalStatus !== ApprovalStatus.APPROVED) {
      actions.push({ key: 'edit', label: 'Chỉnh sửa', icon: <EditOutlined />, onClick: () => { setEditingId(record.id); setSelectedRecord(record); setModalMode('edit'); setIsModalOpen(true); } });
    }
    if (hasPerm('vts:approvec1') && record.approvalStatus === ApprovalStatus.PROPOSED) {
      actions.push({ key: 'approveC1', label: 'Phê duyệt C1', icon: <CheckOutlined />, onClick: () => handleApproveC1(record) });
      actions.push({ key: 'rejectC1', label: 'Từ chối C1', danger: true, icon: <CloseOutlined />, onClick: () => openRejectModal(record.id, 'c1') });
    }
    if (hasPerm('vts:approvec2') && record.approvalStatus === ApprovalStatus.UNDER_REVIEW) {
      const isSelfApproval = Boolean(currentUser?.userId && record.approverLevel1 === currentUser.userId);
      actions.push({ key: 'approveC2', label: isSelfApproval ? 'Phê duyệt C2 (không thể tự duyệt)' : 'Phê duyệt C2', icon: <CheckOutlined />, disabled: isSelfApproval, onClick: () => handleApproveC2(record) });
      actions.push({ key: 'rejectC2', label: isSelfApproval ? 'Từ chối C2 (không thể tự duyệt)' : 'Từ chối C2', danger: true, disabled: isSelfApproval, icon: <CloseOutlined />, onClick: () => openRejectModal(record.id, 'c2') });
    }
    if (hasPerm('vts:delete') && record.approvalStatus === ApprovalStatus.APPROVED) {
      actions.push({ key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, danger: true, onClick: () => confirmDelete(record) });
    }
    return actions;
  }, [hasPerm, currentUser?.userId, refreshList]);

  const countAllFiltered = countProposed + countUnderReview + countApproved + countRejected;

  const statusTabs = useMemo(() => [
    { key: 'all', label: 'Tất cả', count: filterApprovalStatus ? countAllFiltered : total, color: textSecondary, active: !filterApprovalStatus },
    { key: ApprovalStatus.PROPOSED, label: 'Chờ phê duyệt', count: countProposed, color: statusAttention, active: filterApprovalStatus === ApprovalStatus.PROPOSED },
    { key: ApprovalStatus.UNDER_REVIEW, label: 'Đang xem xét', count: countUnderReview, color: actionPrimary, active: filterApprovalStatus === ApprovalStatus.UNDER_REVIEW },
    { key: ApprovalStatus.APPROVED, label: 'Đã phê duyệt', count: countApproved, color: statusOperational, active: filterApprovalStatus === ApprovalStatus.APPROVED },
    { key: ApprovalStatus.REJECTED, label: 'Từ chối', count: countRejected, color: statusCritical, active: filterApprovalStatus === ApprovalStatus.REJECTED },
  ], [total, countAllFiltered, filterApprovalStatus, countProposed, countUnderReview, countApproved, countRejected]);

  const handleFilterSearch = useCallback((values: Record<string, any>) => {
    setFilterKeyword(values.keyword?.trim() || '');
    setFilterOrgUnitId(values.orgUnitId || undefined);
    setFilterConditionStatus(values.conditionStatus || undefined);
    setFilterApprovalStatus(values.approvalStatus || undefined);
    setPage(1);
  }, []);

  const handleFilterReset = useCallback(() => {
    setFilterKeyword(''); setFilterOrgUnitId(undefined); setFilterConditionStatus(undefined); setFilterApprovalStatus(undefined); setPage(1);
  }, []);

  const handleTabChange = useCallback((key: string) => {
    const approvalStatus = key === 'all' ? undefined : key as ApprovalStatus;
    setFilterApprovalStatus(approvalStatus);
    setFilterValues((prev) => ({ ...prev, approvalStatus }));
    setPage(1);
  }, []);

  // ── History rendering ──────────────────────────────────────────

  const fmtTime = (ts: string) => {
    const d = dayjs(ts);
    return `${d.format('HH:mm:ss')} - ${d.isSame(dayjs(), 'day') ? 'Hôm nay' : d.format('DD/MM/YYYY')}`;
  };

  const renderHistoryTimeline = (records: any[]) => {
    const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000);
    const sorted = [...records].sort((a: any, b: any) => new Date(historyTimestamp(b) || 0).getTime() - new Date(historyTimestamp(a) || 0).getTime());
    const q = historySearch.toLowerCase().trim();
    const groups: { tsSec: number; ts: string; actor: string; items: any[] }[] = [];
    for (const r of sorted) {
      const ts = historyTimestamp(r);
      const sec = ts ? toSec(ts) : 0;
      const prev = groups[groups.length - 1];
      const actor = historyActor(r);
      if (prev && prev.tsSec === sec && prev.actor === actor) prev.items.push(r);
      else groups.push({ tsSec: sec, ts, actor, items: [r] });
    }
    if (groups.length === 0) return (
      <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
        <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
        <div style={{ color: textTertiary, fontSize: fontSizeMd }}>{q || historyDateFrom || historyDateTo ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận'}</div>
      </div>
    );
    return (
      <div>{groups.map((g, gi) => {
        const action = getActionLabel(g.items);
        const changes = g.items.flatMap((item: any) => historyChangeRows(item));
        const actionAccent = getHistoryActionAccent(g.items, action);
        const unitName = g.items[0]?.orgUnitName || g.items[0]?.unitName || '—';
        const informationTitle = action.label === 'Tạo mới' ? 'Thông tin tạo mới:' : 'Thông tin thay đổi:';
        return (
        <div key={gi} style={{ display: 'grid', gridTemplateColumns: 'minmax(190px, 0.38fr) minmax(0, 1fr)', gap: spaceLg, alignItems: 'start', marginBottom: gi < groups.length - 1 ? spaceMd : 0 }}>
          <div style={{ minWidth: 0, paddingTop: spaceXs }}>
            <Typography.Text style={{ display: 'block', fontSize: fontSizeLg, color: textPrimary, fontWeight: fontWeightBold, lineHeight: 1.5 }}>
              {g.ts ? fmtTime(g.ts) : '—'}
            </Typography.Text>
            <Typography.Text style={{ display: 'block', marginTop: spaceXs, fontSize: fontSizeMd, color: textSecondary, lineHeight: 1.5 }}>
              Người cập nhật: {g.actor || '—'}
            </Typography.Text>
            <Typography.Text style={{ display: 'block', fontSize: fontSizeMd, color: textSecondary, lineHeight: 1.5 }}>
              Đơn vị: {unitName}
            </Typography.Text>
          </div>
          <div style={{ minWidth: 0, background: surfacePage, borderLeft: `${spaceXs}px solid ${actionAccent}`, borderRadius: radiusSm, padding: spaceMd }}>
            <Typography.Text style={{ display: 'block', color: textPrimary, fontSize: fontSizeMd, fontWeight: fontWeightBold, marginBottom: spaceXs }}>
              {informationTitle}
            </Typography.Text>
            {changes.length > 0 ? <div>{changes.map((change, ri: number) => {
                const fn = change.field;
                const ov = change.oldValue !== null ? historyFieldValue(fn, change.oldValue) : null;
                const nv = change.newValue !== null ? historyFieldValue(fn, change.newValue) : null;
                return (<div key={`${fn}-${ri}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1.15fr) minmax(90px, 0.85fr) 24px minmax(120px, 1.35fr)', gap: spaceSm, alignItems: 'start', paddingTop: ri > 0 ? spaceXs : 0, fontSize: fontSizeMd, lineHeight: 1.5 }}>
                  <div style={{ minWidth: 0, fontWeight: fontWeightMedium, color: textPrimary, overflowWrap: 'anywhere' }}>{fn ? `${historyFieldName(fn)}:` : '—'}</div>
                  <span title={ov ?? '—'} style={{ minWidth: 0, color: textSecondary, overflowWrap: 'anywhere' }}>{ov ?? '—'}</span>
                  <span style={{ color: textTertiary, textAlign: 'center' }}>→</span>
                  <span title={nv ?? '—'} style={{ minWidth: 0, color: textPrimary, fontWeight: fontWeightMedium, overflowWrap: 'anywhere' }}>{nv ?? '—'}</span>
                </div>);
              })}</div> : <Typography.Text style={{ color: textTertiary, fontSize: fontSizeMd }}>Không có thông tin chi tiết</Typography.Text>}
          </div>
        </div>
        );
      })}</div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)', marginTop: -8 }}>
      <ScreenHeader
        breadcrumb={[{ label: 'Tài sản KCHTGT' }, { label: 'Hệ thống VTS' }]}
        actions={
          hasPerm('vts:create')
            ? [{ key: 'create', label: 'Thêm mới', variant: 'primary' as const, icon: <PlusOutlined />,
                onClick: () => { setEditingId(null); setModalMode('create'); setIsModalOpen(true); } }]
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
        onRetry={refreshList}
        filterContent={
          <>
            <div style={{ marginBottom: spaceFormField, marginTop: spaceMd }}>
              <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>Đơn vị quản lý</div>
              <TreeSelect
                placeholder="Chọn đơn vị"
                allowClear
                showSearch
                treeNodeFilterProp="title"
                treeLine
                treeDefaultExpandAll
                listHeight={256}
                value={filterValues.orgUnitId}
                onChange={(value) => setFilterValues((prev) => ({ ...prev, orgUnitId: value }))}
                treeData={orgUnitTreeOptions}
                style={{ ...selectStyle, width: '100%' }}
              />
            </div>
            <div style={{ marginBottom: spaceFormField }}>
              <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>Tìm kiếm</div>
              <Input
                placeholder="Tìm theo mã, tên hệ thống VTS..."
                allowClear
                value={filterValues.keyword || ''}
                onChange={(event) => setFilterValues((prev) => ({ ...prev, keyword: event.target.value }))}
                onPressEnter={() => handleFilterSearch(filterValues)}
                style={{ borderRadius: radiusPill, height: 40 }}
              />
            </div>
            <div style={{ marginBottom: spaceFormField }}>
              <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>Tình trạng</div>
              <Select
                placeholder="Tất cả"
                allowClear
                value={filterValues.conditionStatus}
                onChange={(value) => setFilterValues((prev) => ({ ...prev, conditionStatus: value }))}
                options={CONDITION_STATUS_OPTIONS}
                style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
              />
            </div>
            {filterCollapsed && (
              <div style={{ marginBottom: spaceFormField }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>Trạng thái phê duyệt</div>
                <Select
                  placeholder="Tất cả"
                  allowClear
                  value={filterValues.approvalStatus}
                  onChange={(value) => setFilterValues((prev) => ({ ...prev, approvalStatus: value }))}
                  options={[
                    { value: ApprovalStatus.PROPOSED, label: 'Chờ phê duyệt' },
                    { value: ApprovalStatus.UNDER_REVIEW, label: 'Đang xem xét' },
                    { value: ApprovalStatus.APPROVED, label: 'Đã phê duyệt' },
                    { value: ApprovalStatus.REJECTED, label: 'Từ chối' },
                  ]}
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                />
              </div>
            )}
          </>
        }
        statusTabs={statusTabs}
        onStatusTabChange={handleTabChange}
      >
        <DataTable
          columns={columns}
          dataSource={dataSource}
          rowKey="id"
          rowActions={rowActions}
          loading={false}
          scroll={{ x: 'max-content' }}
          emptyState={dataSource.length === 0 && !loading
            ? <EmptyState description="Chưa có hệ thống VTS nào" />
            : undefined}
        />
        {dataSource.length > 0 && (
          <Pagination total={total} current={page} pageSize={pageSize} onChange={(p, ps) => { setPage(p); setPageSize(ps); }} />
        )}
      </FilterTableLayout>

      {/* Form tự quản lý Drawer để dùng cùng một lớp hiển thị như màn Cảng biển. */}
      {isModalOpen && (
        <VtsSystemForm
          open={true}
          editId={editingId}
          initialData={selectedRecord}
          mode={modalMode}
          onCancel={() => { setIsModalOpen(false); setEditingId(null); setSelectedRecord(null); }}
          onSuccess={() => { setIsModalOpen(false); setEditingId(null); setSelectedRecord(null); refreshList(); }}
        />
      )}

      {/* ── History drawer ────────────────────────────────────────── */}
      <Drawer
        width={1000}
        placement="right"
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        closable={false}
        extra={<Button type="text" aria-label="Đóng lịch sử thay đổi" onClick={() => setHistoryModalOpen(false)} style={drawerCloseBtnStyle}>✕</Button>}
        styles={{ body: { display: 'flex', flexDirection: 'column', height: '100%' }, header: { flexShrink: 0 } }}
        title={
          <span style={drawerTitleStyle}>
            {selectedRecord ? `Lịch sử thay đổi — ${selectedRecord.systemName}` : 'Lịch sử thay đổi'}
          </span>
        }
      >
        <div style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceSm, alignItems: 'center' }}>
            <Input.Search placeholder="Tìm kiếm nội dung thay đổi..." allowClear value={historySearch}
              onChange={e => setHistorySearch(e.target.value)} style={{ flex: 1, borderRadius: radiusPill, height: 40 }} />
            <DatePicker placeholder="Từ ngày" value={historyDateFrom ? dayjs(historyDateFrom) : null}
              onChange={d => setHistoryDateFrom(d ? d.startOf('minute').format('YYYY-MM-DDTHH:mm:ss') : '')}
              style={{ width: 170, borderRadius: radiusPill, height: 40 }} format="DD/MM/YYYY HH:mm" showTime={{ format: 'HH:mm' }} />
            <DatePicker placeholder="Đến ngày" value={historyDateTo ? dayjs(historyDateTo) : null}
              onChange={d => setHistoryDateTo(d ? d.endOf('minute').format('YYYY-MM-DDTHH:mm:ss') : '')}
              style={{ width: 170, borderRadius: radiusPill, height: 40 }} format="DD/MM/YYYY HH:mm" showTime={{ format: 'HH:mm' }} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }} onScroll={handleHistoryScroll}>
          {loadingHistory && historyRecords.length === 0 ? <LoadingSkeleton rows={5} /> :
           historyRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
              <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
              <div style={{ color: textTertiary, fontSize: fontSizeMd }}>Chưa có thay đổi nào được ghi nhận</div>
            </div>
           ) : (
             <>
               {renderHistoryTimeline(historyRecords)}
               {loadingMoreHistory && <div style={{ textAlign: 'center', padding: `${spaceMd}px 0`, color: textTertiary, fontSize: fontSizeMd }}>Đang tải thêm...</div>}
             </>
           )}
        </div>
      </Drawer>

      {/* Reject Modal */}
      <Modal title="Từ chối" open={rejectModalOpen} onOk={handleReject}
        onCancel={() => setRejectModalOpen(false)} okText="Từ chối" cancelText="Hủy" okButtonProps={{ danger: true }}>
        <p style={{ marginBottom: spaceFormField }}>Nhập lý do từ chối (tối thiểu 10 ký tự):</p>
        <Input.TextArea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Nhập lý do từ chối..." />
      </Modal>
    </div>
  );
}

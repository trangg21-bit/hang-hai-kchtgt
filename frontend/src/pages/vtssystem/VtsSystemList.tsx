import { useState, useCallback, useEffect, useMemo } from 'react';
import { Typography, Modal, Input, Drawer, Tag, Button, DatePicker, Space, Divider, Select } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  CheckOutlined,
  CloseOutlined,
  HistoryOutlined,
  ExclamationCircleOutlined,
  ClockCircleFilled,
  ArrowRightOutlined,
  DownOutlined,
  UpOutlined,
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
  fontWeightBold, fontWeightMedium, fontSizeSm, fontSizeMd, fontSizeLg,
  cardStyle, radiusPill, borderDefault, spaceFormField, spaceMd, spaceSm,
  statusOperational, statusDraft, statusCritical, statusAttention,
  surfaceCard, surfacePage, shadowSm, radiusLg, spaceXs, spaceXl, drawerTitleStyle, drawerCloseBtnStyle,
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

function getChangeCount(items: any[]): number {
  return items.reduce((total, item) => {
    const field = historyField(item);
    if (!field) return total + 1;
    const fields = normalizedHistoryFields(field);
    return total + Math.max(fields.length, 1);
  }, 0);
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
  const [orgUnitOptions, setOrgUnitOptions] = useState<{ label: string; value: string }[]>([]);
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
  const [historyExpanded, setHistoryExpanded] = useState<Record<number, boolean>>({});
  const [historySearch, setHistorySearch] = useState('');
  const [historyDateFrom, setHistoryDateFrom] = useState<string>('');
  const [historyDateTo, setHistoryDateTo] = useState<string>('');

  // Count tabs
  const [countProposed, setCountProposed] = useState<number>(0);
  const [countUnderReview, setCountUnderReview] = useState<number>(0);
  const [countApproved, setCountApproved] = useState<number>(0);
  const [countRejected, setCountRejected] = useState<number>(0);

  useEffect(() => {
    (async () => {
      try {
        const list = await vtsSystemCRUD.getScopedOrgUnitOptions();
        setOrgUnitOptions(list.map((o: any) => {
          const code = o.code || o.maDonVi;
          const name = o.name || o.unitName || o.tenDonVi || 'Đơn vị';
          return { label: code ? `${code} - ${name}` : name, value: String(o.id) };
        }));
      } catch (e) { console.error('Failed to fetch org units for filter', e); }
    })();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setIsError(false);
    try {
      const params: ListParams = {
        page: page - 1, size: pageSize,
        keyword: filterKeyword || undefined,
        conditionStatus: filterConditionStatus,
        approvalStatus: filterApprovalStatus,
        orgUnitId: filterOrgUnitId || undefined,
      };
      const res = await vtsSystemCRUD.list(params);
      setDataSource(res.items);
      setTotal(res.total);
      if (res.statusCounts) {
        setCountProposed(res.statusCounts.PROPOSED || 0);
        setCountUnderReview(res.statusCounts.UNDER_REVIEW || 0);
        setCountApproved(res.statusCounts.APPROVED || 0);
        setCountRejected(res.statusCounts.REJECTED || 0);
      }
    } catch (err: unknown) {
      setIsError(true);
      setErrorMessage(err instanceof Error ? err.message : 'Không thể tải danh sách');
    } finally { setLoading(false); }
  }, [page, pageSize, filterKeyword, filterConditionStatus, filterApprovalStatus, filterOrgUnitId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: string) => {
    try { await vtsSystemCRUD.delete(id); toast.success('Xóa thành công'); fetchData(); }
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
      toast.success('Phê duyệt cấp 1 thành công'); fetchData();
    } catch (err: any) { toast.error(err?.message || 'Lỗi phê duyệt'); }
  };

  const handleApproveC2 = async (record: VtsSystemResponse) => {
    try {
      await vtsSystemApproval.approveC2(record.id, { decision: 'APPROVED', reason: 'Phê duyệt cấp 2' });
      toast.success('Phê duyệt cấp 2 thành công'); fetchData();
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
      toast.success('Đã từ chối'); setRejectModalOpen(false); fetchData();
    } catch (err: any) { toast.error(err?.message || 'Lỗi từ chối'); }
  };

  // ── History drawer ──────────────────────────────────────────────

  const handleViewHistory = async (record: VtsSystemResponse) => {
    setSelectedRecord(record);
    setHistoryModalOpen(true);
    setHistoryRecords([]);
    setLoadingHistory(true);
    setLoadingMoreHistory(false);
    setHasMoreHistory(true);
    setHistoryExpanded({});
    setHistorySearch('');
    setHistoryDateFrom('');
    setHistoryDateTo('');
    try {
      const history = await vtsSystemApproval.getHistory(record.id, 0, 200);
      const items = history || [];
      setHistoryRecords(items);
      setHasMoreHistory(items.length === 200);
    } catch { toast.error('Không thể tải lịch sử'); }
    finally { setLoadingHistory(false); }
  };

  const loadMoreHistory = async () => {
    if (!selectedRecord || loadingHistory || loadingMoreHistory || !hasMoreHistory) return;
    setLoadingMoreHistory(true);
    try {
      const nextPage = Math.floor(historyRecords.length / 200) + 1;
      const history = await vtsSystemApproval.getHistory(selectedRecord.id, nextPage, 200);
      if (history && history.length > 0) {
        setHistoryRecords(prev => [...prev, ...history]);
      }
      setHasMoreHistory((history || []).length === 200);
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
    { key: 'stt', label: 'STT', width: 50, align: 'center' as const, fixed: 'left' as const,
      render: (_: unknown, __: unknown, idx: number) => (page - 1) * pageSize + idx + 1 },
    { key: 'systemName', label: 'Tên hệ thống', dataIndex: 'systemName', width: 200, sortable: true,
      render: (val: string) => <Typography.Text strong>{val || '—'}</Typography.Text> },
    { key: 'address', label: 'Địa điểm chi tiết', dataIndex: 'address', width: 220, sortable: true,
      render: (val: string) => val || '—' },
    { key: 'conditionStatus', label: 'Tình trạng', dataIndex: 'conditionStatus', width: 120, sortable: true, align: 'center' as const,
      render: (val: ConditionStatus) => {
        if (!val) return '—';
        const display = CONDITION_STATUS_MAP[val] || val;
        const color = CONDITION_COLOR[val] || textSecondary;
        return <span style={{ color, fontWeight: fontWeightMedium }}>{display}</span>;
      }},
    { key: 'orgUnitName', label: 'Đơn vị quản lý', dataIndex: 'orgUnitName', width: 180 },
    { key: 'approvalStatus', label: 'Trạng thái', dataIndex: 'approvalStatus', width: 140, sortable: true, align: 'center' as const,
      render: (val: ApprovalStatus) => {
        const label = APPROVAL_STATUS_MAP[val] || val;
        const color = APPROVAL_COLOR[val] || textSecondary;
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: 8, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${color}15`, color }}>{label}</span>;
      }},
    { key: 'updatedDate', label: 'Ngày cập nhật', dataIndex: 'updatedDate', width: 150, sortable: true, align: 'center' as const, render: (val: string) => formatDate(val) },
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
  }, [hasPerm, currentUser?.userId]);

  const countAllFiltered = countProposed + countUnderReview + countApproved + countRejected;

  const statusTabs = useMemo(() => [
    { key: 'all', label: 'Tất cả', count: filterApprovalStatus ? countAllFiltered : total, color: textSecondary, active: !filterApprovalStatus },
    { key: ApprovalStatus.PROPOSED, label: 'Chờ phê duyệt', count: countProposed, color: statusAttention, active: filterApprovalStatus === ApprovalStatus.PROPOSED },
    { key: ApprovalStatus.UNDER_REVIEW, label: 'Đang xem xét', count: countUnderReview, color: actionPrimary, active: filterApprovalStatus === ApprovalStatus.UNDER_REVIEW },
    { key: ApprovalStatus.APPROVED, label: 'Đã phê duyệt', count: countApproved, color: statusOperational, active: filterApprovalStatus === ApprovalStatus.APPROVED },
    { key: ApprovalStatus.REJECTED, label: 'Từ chối', count: countRejected, color: statusDraft, active: filterApprovalStatus === ApprovalStatus.REJECTED },
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
    const d = new Date(ts);
    return d.toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  };

  const renderHistoryTimeline = (records: any[]) => {
    const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000);
    const sorted = [...records].sort((a: any, b: any) => new Date(historyTimestamp(b) || 0).getTime() - new Date(historyTimestamp(a) || 0).getTime());
    const q = historySearch.toLowerCase().trim();
    const groups: { tsSec: number; ts: string; actor: string; items: any[] }[] = [];
    for (const r of sorted) {
      if (q) {
        const field = historyField(r);
        const oldValue = historyOldValue(r);
        const newValue = historyNewValue(r);
        const fn = field.toLowerCase();
        const ov = (oldValue || '').toLowerCase();
        const nv = (newValue || '').toLowerCase();
        const lb = historyFieldName(field).toLowerCase();
        const od = historyFieldValue(field, oldValue).toLowerCase();
        const nd = historyFieldValue(field, newValue).toLowerCase();
        if (!fn.includes(q) && !ov.includes(q) && !nv.includes(q) && !lb.includes(q) && !od.includes(q) && !nd.includes(q)) continue;
      }
      if (historyDateFrom || historyDateTo) {
        const cd = historyTimestamp(r).substring(0, 16);
        if (historyDateFrom && cd < historyDateFrom) continue;
        if (historyDateTo && cd > historyDateTo) continue;
      }
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
        const canExpand = action.label !== 'Tạo mới';
        const changes = canExpand ? g.items.flatMap((item: any) => historyChangeRows(item)) : [];
        return (
        <div key={gi} style={{ display: 'flex', gap: spaceSm, marginBottom: gi < groups.length - 1 ? spaceSm : 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24, flexShrink: 0 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: surfaceCard, border: `1px solid ${actionPrimary}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ClockCircleFilled style={{ color: actionPrimary, fontSize: 14 }} />
            </div>
            {gi < groups.length - 1 && (<div style={{ width: 1, flex: 1, minHeight: 24, background: borderDefault, marginTop: spaceXs }} />)}
          </div>
          <div style={{ ...cardStyle, flex: 1, padding: 0, marginBottom: 0, borderRadius: radiusLg, boxShadow: shadowSm, overflow: 'hidden' }}>
            <div onClick={canExpand ? () => setHistoryExpanded(prev => ({ ...prev, [gi]: !prev[gi] })) : undefined} style={{ display: 'flex', alignItems: 'center', gap: spaceSm, minWidth: 0, cursor: canExpand ? 'pointer' : 'default', padding: `${spaceMd}px`, background: historyExpanded[gi] ? surfacePage : surfaceCard }}>
              <div style={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'baseline', gap: spaceSm }}>
                <Typography.Text style={{ fontSize: fontSizeLg, color: textPrimary, fontWeight: fontWeightBold, whiteSpace: 'nowrap' }}>{g.ts ? fmtTime(g.ts) : '—'}</Typography.Text>
                {g.actor && (<Typography.Text ellipsis={{ tooltip: g.actor }} style={{ minWidth: 0, fontSize: fontSizeMd, color: textSecondary }}>— {g.actor}</Typography.Text>)}
              </div>
              <Tag color={action.color} style={{ fontSize: fontSizeSm, margin: 0, borderRadius: radiusPill, whiteSpace: 'nowrap' }}>{action.label}</Tag>
              {canExpand && (<>
                <span style={{ fontSize: fontSizeSm, fontWeight: fontWeightMedium, color: actionPrimary, background: `${actionPrimary}15`, borderRadius: radiusPill, padding: `${spaceXs}px ${spaceSm}px`, whiteSpace: 'nowrap' }}>{getChangeCount(g.items)} thay đổi</span>
                <Button
                  type="text"
                  aria-label="Xem thay đổi"
                  icon={<EyeOutlined style={{ color: actionPrimary }} />}
                  onClick={(event) => {
                    event.stopPropagation();
                    setHistoryExpanded((prev) => ({ ...prev, [gi]: true }));
                  }}
                  style={{ width: 28, height: 28, padding: 0, borderRadius: radiusPill }}
                />
                {historyExpanded[gi] ? (<UpOutlined style={{ fontSize: 12, color: textTertiary }} />) : (<DownOutlined style={{ fontSize: 12, color: textTertiary }} />)}
              </>)}
            </div>
            {canExpand && historyExpanded[gi] === true && (<div style={{ padding: `${spaceSm}px ${spaceMd}px ${spaceMd}px` }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 0.65fr) minmax(160px, 0.85fr) 24px minmax(160px, 0.85fr)', gap: spaceSm, alignItems: 'center', padding: `${spaceXs}px ${spaceXs}px`, color: textTertiary, fontSize: fontSizeSm, fontWeight: fontWeightMedium }}>
                <span>Trường thay đổi</span>
                <span style={{ textAlign: 'left' }}>Giá trị cũ</span>
                <span />
                <span>Giá trị mới</span>
              </div>
              <Divider style={{ margin: `${spaceXs}px 0`, borderColor: borderDefault }} />
              <div>{changes.map((change, ri: number) => {
                  const fn = change.field;
                  const oldValue = change.oldValue;
                  const newValue = change.newValue;
                  const ov = oldValue !== null ? historyFieldValue(fn, oldValue) : null;
                  const nv = newValue !== null ? historyFieldValue(fn, newValue) : null;
                  return (<div key={`${fn}-${ri}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 0.65fr) minmax(160px, 0.85fr) 24px minmax(160px, 0.85fr)', gap: spaceSm, alignItems: 'start', padding: `${spaceSm}px ${spaceXs}px`, borderBottom: ri < changes.length - 1 ? `1px solid ${borderDefault}` : undefined }}>
                    <div style={{ minWidth: 0, fontSize: fontSizeMd, fontWeight: fontWeightMedium, color: textPrimary, lineHeight: 1.5, overflowWrap: 'anywhere' }}>{fn ? historyFieldName(fn) : '—'}</div>
                    <div title={ov ?? '—'} style={{ minWidth: 0, fontSize: fontSizeMd, color: statusCritical, textDecoration: 'line-through', textAlign: 'left', lineHeight: 1.5, overflowWrap: 'anywhere' }}>{ov ?? '—'}</div>
                    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: spaceXs, color: textTertiary }}><ArrowRightOutlined /></div>
                    <div title={nv ?? '—'} style={{ minWidth: 0, fontSize: fontSizeMd, color: statusOperational, fontWeight: fontWeightMedium, textAlign: 'left', lineHeight: 1.5, overflowWrap: 'anywhere' }}>{nv ?? '—'}</div>
                  </div>);
                })}</div>
            </div>)}</div>
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
        onRetry={fetchData}
        filterContent={
          <>
            <div style={{ marginBottom: spaceFormField, marginTop: spaceMd }}>
              <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>Đơn vị quản lý</div>
              <Select
                placeholder="Chọn đơn vị"
                allowClear
                showSearch
                optionFilterProp="label"
                value={filterValues.orgUnitId}
                onChange={(value) => setFilterValues((prev) => ({ ...prev, orgUnitId: value }))}
                options={orgUnitOptions}
                style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
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
        {dataSource.length === 0 && !loading ? (
          <DataTable columns={columns} dataSource={[]} rowKey="id" emptyState={<EmptyState description="Chưa có hệ thống VTS nào" />} />
        ) : (
          <>
            <DataTable columns={columns} dataSource={dataSource} rowKey="id" rowActions={rowActions} loading={false} scroll={{ x: 1400, y: 500 }} />
            <Pagination total={total} current={page} pageSize={pageSize} onChange={(p, ps) => { setPage(p); setPageSize(ps); }} />
          </>
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
          onSuccess={() => { setIsModalOpen(false); setEditingId(null); setSelectedRecord(null); fetchData(); }}
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
              onChange={d => setHistoryDateFrom(d ? d.format('YYYY-MM-DD HH:mm') : '')}
              style={{ width: 170, borderRadius: radiusPill, height: 40 }} format="DD/MM/YYYY HH:mm" showTime={{ format: 'HH:mm' }} />
            <DatePicker placeholder="Đến ngày" value={historyDateTo ? dayjs(historyDateTo) : null}
              onChange={d => setHistoryDateTo(d ? d.format('YYYY-MM-DD HH:mm') : '')}
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

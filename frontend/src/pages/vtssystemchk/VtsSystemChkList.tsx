import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Typography, Modal, Input, Drawer, Button, DatePicker, Space, Select, Radio, Tag } from 'antd';
import {
  HistoryOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { vtsSystemCRUD, vtsSystemApproval } from '../../services/vtsSystemService';
import type { VtsSystemResponse, ListParams, ApprovalRequest } from '../../types/vtsSystem';
import { ConditionStatus, ApprovalStatus, CONDITION_STATUS_OPTIONS, CONDITION_STATUS_MAP } from '../../types/vtsSystem';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import { ScreenHeader, DataTable } from '../../components/list-view';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import Pagination from '../../components/list-view/Pagination';
import VtsSystemChkForm, { invalidateVtsDetailCache } from './VtsSystemChkForm';
import ApprovalModal from '../../components/shared/ApprovalModal';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import toast, { modal } from '../../components/ToastNotification';
import {
  actionPrimary, textPrimary, textSecondary, textTertiary,
  fontWeightBold, fontWeightMedium, fontSizeSm, fontSizeMd, fontSizeLg,
  radiusSm, spaceFormField, spaceMd, spaceSm, spaceXs, spaceLg, spaceXl, surfacePage,
  statusOperational, statusDraft, statusCritical, statusAttention,
  drawerTitleStyle, drawerCloseBtnStyle, selectStyle,
  borderDefault, statusBadgeStyle, icons, cellTitleStyle, cellSubtitleStyle,
  inputStyle, textAreaStyle, colors, primaryButtonStyle,
  getRangePickerProps,
} from '../../themetokenchk';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import dayjs from 'dayjs';
import { getProvinceNameById, VIETNAM_PROVINCE_OPTIONS } from '../../types/common';
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

// Thứ tự hiển thị field trong lịch sử theo đúng thứ tự form tạo mới VTS (VtsSystemForm.tsx)
const HISTORY_FIELD_ORDER = [
  'orgUnitId', 'orgUnitName', 'owningOrgId', 'owningOrgName', 'operatingOrgId', 'operatingOrgName',
  'portId', 'portName', 'code', 'systemName', 'province', 'provinceId', 'address',
  'operationStartDate', 'scope', 'maritimeNotice', 'conditionStatus', 'zones', 'Vùng VTS', 'note'
];

// ── History helpers ──────────────────────────────────────────────

function historyFieldName(fn: string): string {
  const map: Record<string, string> = {
    systemName: 'Tên hệ thống VTS', code: 'Mã hệ thống VTS', province: 'Tỉnh/Thành phố',
    provinceId: 'Mã tỉnh/thành', address: 'Địa điểm chi tiết', maritimeNotice: 'Thông báo hàng hải',
    operationStartDate: 'Thời gian bắt đầu hoạt động', scope: 'Phạm vi áp dụng',
    note: 'Ghi chú', approvalStatus: 'Trạng thái phê duyệt', conditionStatus: 'Tình trạng',
    orgUnitName: 'Đơn vị quản lý', owningOrgName: 'Đơn vị chủ quản',
    operatingOrgName: 'Đơn vị vận hành khai thác', portName: 'Thuộc cảng biển',
    zones: 'Vùng VTS', 'Vùng VTS': 'Vùng VTS', 'vung vts': 'Vùng VTS', 'danh sach vung vts': 'Danh sách vùng VTS',
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
      DRAFT: 'Lưu tạm',
      PROPOSED: 'Chờ Cảng vụ duyệt',
      PENDING_APPROVAL: 'Chờ Cảng vụ duyệt',
      PENDING: 'Chờ Cảng vụ duyệt',
      APPROVED_LEVEL1: 'Chờ Cục duyệt',
      APPROVED_LEVEL2: 'Đã duyệt',
      APPROVED: 'Đã duyệt',
      REJECTED: 'Từ chối',
      REJECTED_LEVEL1: 'Từ chối',
      REJECTED_LEVEL2: 'Từ chối',
    };
    return displayValue.split(';').map((value) => {
      const normalizedValue = String(value || '').trim();
      const fromEnum = statusMap[normalizedValue] || statusMap[normalizedValue.toUpperCase()];
      if (fromEnum) return fromEnum;
      const normText = normalizeHistoryKey(normalizedValue);
      if (normText.includes('cho') && (normText.includes('cang vu') || normText.includes('chi cuc') || normText.includes('phe duyet'))) {
        return 'Chờ Cảng vụ duyệt';
      }
      if (normText.includes('cho') && normText.includes('cuc')) {
        return 'Chờ Cục duyệt';
      }
      if (normText.includes('da') && normText.includes('duyet')) {
        return 'Đã duyệt';
      }
      if (normText.includes('tu choi') || normText.includes('tra ve')) {
        return 'Từ chối';
      }
      if (normText.includes('luu tam') || normText.includes('nhap')) {
        return 'Lưu tạm';
      }
      return normalizedValue;
    }).join('; ');
  }
  if (fn === 'orgUnitId' || fn === 'owningOrgId' || fn === 'operatingOrgId' || fn === 'portId') return displayValue;
  if (fn === 'provinceId') { const num = Number(displayValue); if (!isNaN(num)) return getProvinceNameById(num) || displayValue; return displayValue; }
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
  const raw = item?.approvedByName || item?.changedByName || item?.performedByName || item?.userName || item?.actorName || item?.approvedBy || item?.changedBy || item?.performedBy || '';
  return raw || '—';
}

function normalizeHistoryKey(value: string): string {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');
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

function resolveHistoryActionMeta(group: any, changes: any[]): { label: string; color: string; bg: string } {
  const item = group.items?.[0] || {};
  const rawStatus = String(item.status ?? item.action ?? '').toUpperCase();
  const rawReason = String(item.reason ?? item.ghiChu ?? item.note ?? '').toLowerCase();
  const level = Number(item.approvalLevel || 0);

  if (rawStatus === 'CREATED' || rawStatus === 'CREATE' || rawReason.includes('tạo mới') || rawReason.includes('thêm mới') || rawReason.includes('tao moi') || rawReason.includes('them moi')) {
    return { label: 'Thêm mới', color: statusOperational, bg: `${statusOperational}18` };
  }

  // If this action was attachment upload / delete
  if (rawStatus === 'ATTACHMENT_UPLOADED' || rawReason.includes('tải lên') || rawReason.includes('tai len') || item.changedField?.includes('đính kèm')) {
    return { label: 'Tải lên tệp', color: '#0284c7', bg: '#0284c718' };
  }
  if (rawStatus === 'ATTACHMENT_DELETED' || rawReason.includes('xóa tài liệu') || rawReason.includes('xóa tệp') || rawReason.includes('xoa tep')) {
    return { label: 'Xóa tệp', color: '#ea580c', bg: '#ea580c18' };
  }

  // If this action was an update/modification, always display Cập nhật
  if (rawStatus === 'UPDATED' || rawStatus === 'UPDATE' || rawStatus === 'EDIT' || rawReason.includes('cập nhật') || rawReason.includes('chỉnh sửa')) {
    return { label: 'Cập nhật', color: actionPrimary, bg: `${actionPrimary}18` };
  }

  const approvalChange = changes.find((c: any) => {
    const k = normalizeHistoryKey(c.field);
    return k === 'approvalstatus' || k === 'trang thai phe duyet';
  });

  if (approvalChange) {
    const nv = normalizeHistoryKey(approvalChange.newValue || '');
    if (nv.includes('cang vu tra ve') || nv.includes('rejected_level1') || (nv.includes('tra ve') && nv.includes('cang vu'))) {
      return { label: 'Từ chối cấp Cảng vụ', color: statusCritical, bg: `${statusCritical}18` };
    }
    if (nv.includes('cuc tra ve') || nv.includes('rejected_level2') || (nv.includes('tra ve') && nv.includes('cuc'))) {
      return { label: 'Từ chối cấp Cục', color: statusCritical, bg: `${statusCritical}18` };
    }
    if (nv === 'cho cuc duyet' || nv.includes('da phe duyet cap 1') || nv.includes('approved_level1') || nv.includes('cuc duyet')) {
      return { label: 'Phê duyệt cấp Cảng vụ', color: '#13C2C2', bg: '#13C2C218' };
    }
    if (nv === 'da duyet' || nv.includes('da phe duyet') || nv.includes('approved')) {
      return { label: 'Phê duyệt cấp Cục', color: statusOperational, bg: `${statusOperational}18` };
    }
    if (nv.includes('tu choi') || nv.includes('rejected') || nv.includes('tra ve')) {
      return { label: 'Từ chối', color: statusCritical, bg: `${statusCritical}18` };
    }
    if (nv.includes('cho cang vu duyet') || nv.includes('cho phe duyet') || nv.includes('pending') || nv.includes('proposed')) {
      return { label: 'Trình duyệt', color: statusAttention, bg: `${statusAttention}18` };
    }
  }

  if (level === 1 || String(item.approvalLevel).includes('LEVEL_1') || rawReason.includes('cấp 1') || rawReason.includes('cap 1') || rawStatus === 'UNDER_REVIEW') {
    if (rawStatus === 'REJECTED' || rawStatus === 'REJECT' || rawReason.includes('từ chối') || rawReason.includes('tu choi') || rawReason.includes('trả về') || rawReason.includes('tra ve')) {
      return { label: 'Từ chối cấp Cảng vụ', color: statusCritical, bg: `${statusCritical}18` };
    }
    return { label: 'Phê duyệt cấp Cảng vụ', color: '#13C2C2', bg: '#13C2C218' };
  }
  if (level === 2 || String(item.approvalLevel).includes('LEVEL_2') || rawReason.includes('cấp 2') || rawReason.includes('cap 2') || rawStatus === 'APPROVED' || rawStatus === 'APPROVE') {
    if (rawStatus === 'REJECTED' || rawStatus === 'REJECT' || rawReason.includes('từ chối') || rawReason.includes('tu choi') || rawReason.includes('trả về') || rawReason.includes('tra ve')) {
      return { label: 'Từ chối cấp Cục', color: statusCritical, bg: `${statusCritical}18` };
    }
    return { label: 'Phê duyệt cấp Cục', color: statusOperational, bg: `${statusOperational}18` };
  }
  if (rawStatus === 'REJECTED' || rawStatus === 'REJECT' || rawReason.includes('từ chối') || rawReason.includes('tu choi')) {
    return { label: 'Từ chối', color: statusCritical, bg: `${statusCritical}18` };
  }
  if (rawStatus === 'SUBMITTED' || rawStatus === 'PENDING' || rawReason.includes('trình duyệt') || rawReason.includes('trinh duyet')) {
    return { label: 'Trình duyệt', color: statusAttention, bg: `${statusAttention}18` };
  }
  if (rawStatus === 'DELETED' || rawStatus === 'DELETE' || rawStatus === 'SOFT_DELETE' || rawReason.includes('xóa') || rawReason.includes('xoa')) {
    return { label: 'Xóa', color: '#64748b', bg: '#64748b18' };
  }

  return { label: 'Cập nhật', color: actionPrimary, bg: `${actionPrimary}18` };
}

function renderHistoryValueTag(field: string, val: string | null) {
  if (val === null || val === undefined || val === '—') {
    return <span style={{ color: textTertiary }}>—</span>;
  }
  const normKey = normalizeHistoryKey(field);
  const normVal = normalizeHistoryKey(val);

  // Approval status
  if (normKey === 'approvalstatus' || normKey === 'trang thai phe duyet' || normKey.includes('phe duyet') || normKey.includes('trang thai')) {
    if (normVal === 'da duyet' || normVal === 'da phe duyet' || normVal === 'approved' || normVal === 'approved_level2') {
      return (
        <span style={statusBadgeStyle(statusOperational)}>
          {val}
        </span>
      );
    }
    if (normVal === 'cho cuc duyet' || normVal === 'approved_level1' || normVal.includes('cap 1') || normVal.includes('cuc duyet')) {
      return (
        <span style={statusBadgeStyle('#0082fb')}>
          {val}
        </span>
      );
    }
    if (normVal === 'cho cang vu duyet' || normVal === 'cho phe duyet' || normVal === 'cho duyet' || normVal === 'pending' || normVal === 'pending_approval' || normVal === 'proposed' || normVal.includes('cang vu')) {
      return (
        <span style={statusBadgeStyle(statusAttention)}>
          {val}
        </span>
      );
    }
    if (normVal === 'tu choi' || normVal.includes('rejected') || normVal.includes('tra ve')) {
      return (
        <span style={statusBadgeStyle(statusCritical)}>
          {val}
        </span>
      );
    }
    return (
      <span style={statusBadgeStyle(statusDraft)}>
        {val}
      </span>
    );
  }

  // Condition status
  if (normKey === 'conditionstatus' || normKey === 'tinh trang' || normKey.includes('tinh trang')) {
    if (normVal.includes('hoat dong tot') || normVal.includes('good') || normVal.includes('operational') || normVal.includes('hoat dong')) {
      return (
        <span style={statusBadgeStyle(statusOperational)}>
          {val}
        </span>
      );
    }
    if (normVal.includes('can bao duong') || normVal.includes('warning') || normVal.includes('maintenance') || normVal.includes('bao tri')) {
      return (
        <span style={statusBadgeStyle(statusAttention)}>
          {val}
        </span>
      );
    }
    if (normVal.includes('hong') || normVal.includes('ngung') || normVal.includes('dung') || normVal.includes('damaged') || normVal.includes('critical')) {
      return (
        <span style={statusBadgeStyle(statusCritical)}>
          {val}
        </span>
      );
    }
    if (normVal.includes('xay dung') || normVal.includes('under_construction')) {
      return (
        <span style={statusBadgeStyle(actionPrimary)}>
          {val}
        </span>
      );
    }
  }

  return <span title={val} style={{ minWidth: 0, color: textPrimary, fontWeight: fontWeightMedium, overflowWrap: 'anywhere' }}>{val}</span>;
}

export default function VtsSystemChkList() {
  const currentUser = useAuthStore((s) => s.user);
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterConditionStatus, setFilterConditionStatus] = useState<ConditionStatus | undefined>();
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<ApprovalStatus | undefined>();
  const [filterOrgUnitId, setFilterOrgUnitId] = useState<string | undefined>();
  const [filterPortId, setFilterPortId] = useState<string | undefined>();
  const [filterProvinceId, setFilterProvinceId] = useState<number | undefined>();
  const [filterOperationStartDateFrom, setFilterOperationStartDateFrom] = useState<string | undefined>();
  const [filterOperationStartDateTo, setFilterOperationStartDateTo] = useState<string | undefined>();
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState<string | undefined>();
  const [filterUpdatedTo, setFilterUpdatedTo] = useState<string | undefined>();
  const [filterYear, setFilterYear] = useState<number | undefined>();
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
  const [historySearchInput, setHistorySearchInput] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [historyDateFrom, setHistoryDateFrom] = useState<string>('');
  const [historyDateTo, setHistoryDateTo] = useState<string>('');
  // Số trang lịch sử đã tải. Không suy ra từ `historyRecords.length` vì backend
  // có thể trả về ít hơn pageSize khi lọc, làm lệch số trang → sót/lặp bản ghi.
  const [historyPage, setHistoryPage] = useState(0);
  // Tăng lên để buộc nạp lại ngay (khi nhấn Enter / nút "Tìm kiếm" / Clear).
  const [historyReloadToken, setHistoryReloadToken] = useState(0);

  // Số nhóm bản ghi lịch sử (gom theo giây + người cập nhật — giống logic timeline Cảng biển)
  const historyGroupCount = useMemo(() => {
    const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000);
    const sorted = [...historyRecords].sort((a: any, b: any) => new Date(historyTimestamp(b) || 0).getTime() - new Date(historyTimestamp(a) || 0).getTime());
    let count = 0, prevKey = '';
    for (const r of sorted) {
      const ts = historyTimestamp(r);
      const key = `${ts ? toSec(ts) : 0}-${historyActor(r)}`;
      if (key !== prevKey) { count += 1; prevKey = key; }
    }
    return count;
  }, [historyRecords]);

  // Count tabs
  const [countDraft, setCountDraft] = useState<number>(0);
  const [countPendingApproval, setCountPendingApproval] = useState<number>(0);
  const [countApprovedLevel1, setCountApprovedLevel1] = useState<number>(0);
  const [countApproved, setCountApproved] = useState<number>(0);
  const [countRejected, setCountRejected] = useState<number>(0);
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
        filterKeyword, filterConditionStatus, filterOrgUnitId, filterPortId, filterProvinceId,
        filterOperationStartDateFrom, filterOperationStartDateTo, filterUpdatedFrom, filterUpdatedTo, filterYear,
      ]);
      const shouldIncludeCounts = statusCountFilterKey.current !== currentStatusCountFilterKey;
      const params: ListParams & { includeCounts: boolean; sort?: string } = {
        page: page - 1, size: pageSize,
        keyword: filterKeyword || undefined,
        conditionStatus: filterConditionStatus,
        approvalStatus: filterApprovalStatus,
        orgUnitId: filterOrgUnitId || undefined,
        portId: filterPortId || undefined,
        provinceId: filterProvinceId,
        operationStartDateFrom: filterOperationStartDateFrom,
        operationStartDateTo: filterOperationStartDateTo,
        updatedFrom: filterUpdatedFrom,
        updatedTo: filterUpdatedTo,
        year: filterYear,
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
        setCountRejected((Number(counts.REJECTED_LEVEL1) || 0) + (Number(counts.REJECTED_LEVEL2) || 0));
        statusCountFilterKey.current = currentStatusCountFilterKey;
      }
    } catch (err: unknown) {
      if (requestId !== listRequestId.current) return;
      setIsError(true);
      setErrorMessage(err instanceof Error ? err.message : 'Không thể tải danh sách');
    } finally {
      if (requestId === listRequestId.current) setLoading(false);
    }
  }, [page, pageSize, filterKeyword, filterConditionStatus, filterApprovalStatus, filterOrgUnitId, filterPortId, filterProvinceId,
    filterOperationStartDateFrom, filterOperationStartDateTo, filterUpdatedFrom, filterUpdatedTo, filterYear,
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
    setHistorySearchInput('');
    setHistorySearch('');
    setHistoryDateFrom('');
    setHistoryDateTo('');
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
          keyword: historySearch || undefined,
          fromDate: historyDateFrom || undefined,
          toDate: historyDateTo || undefined,
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
  }, [historyModalOpen, selectedRecord?.id, historySearch, historyDateFrom, historyDateTo, historyReloadToken]);

  const loadMoreHistory = async () => {
    if (!selectedRecord || loadingHistory || loadingMoreHistory || !hasMoreHistory) return;
    setLoadingMoreHistory(true);
    try {
      const nextPage = historyPage + 1;
      const history = await vtsSystemApproval.getHistory(selectedRecord.id, nextPage, HISTORY_PAGE_SIZE, {
        keyword: historySearch,
        fromDate: historyDateFrom,
        toDate: historyDateTo,
      });
      if (history && history.length > 0) {
        setHistoryRecords(prev => [...prev, ...history]);
      }
      setHistoryPage(nextPage);
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
      width: 180,
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
    if (hasPerm('vts:history')) {
      actions.push({ key: 'history', label: 'Lịch sử', icon: icons.history, onClick: () => handleViewHistory(record) });
    }
    // N09/BR-019: hồ sơ đang chờ duyệt bị khóa sửa. Hồ sơ đã duyệt vẫn sửa được
    // nhưng chỉ bởi người có quyền phê duyệt (T12 — "Lưu và phê duyệt").
    if (canEditApprovalRecord(record.approvalStatus, { hasPerm, resource: 'vts' })) {
      actions.push({ key: 'edit', label: 'Chỉnh sửa', icon: icons.edit, onClick: () => { setEditingId(record.id); setSelectedRecord(record); setModalMode('edit'); setIsModalOpen(true); } });
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
      const isCreator = Boolean(currentUser?.userId && record.createdBy === currentUser.userId);
      const isApproverL1 = Boolean(currentUser?.userId && record.approverLevel1 === currentUser.userId);
      const isSelfApproval = isCreator || isApproverL1;
      if (!isSelfApproval) {
        actions.push({ key: 'approveC2', label: 'Phê duyệt cấp Cục', icon: icons.approve, onClick: () => openApproveModal(record.id, 'c2') });
        actions.push({ key: 'rejectC2', label: 'Từ chối cấp Cục', danger: true, icon: icons.reject, onClick: () => openRejectModal(record.id, 'c2') });
      }
    }
    // T13/N04: chỉ hồ sơ đang "Lưu tạm" mới được xóa (approval-2-level-spec §3.6).
    if (hasPerm('vts:delete') && record.approvalStatus === ApprovalStatus.DRAFT) {
      actions.push({ key: 'delete', label: 'Xóa bỏ', icon: icons.delete, danger: true, onClick: () => confirmDelete(record) });
    }
    return actions;
  }, [hasPerm, currentUser?.userId, refreshList]);

  const countAllFiltered = countDraft + countPendingApproval + countApprovedLevel1 + countApproved + countRejected;

  const statusTabs = useMemo(() => [
    { key: 'all', label: 'Tất cả', count: filterApprovalStatus ? countAllFiltered : total, active: !filterApprovalStatus },
    { key: ApprovalStatus.DRAFT, label: 'Lưu tạm', count: countDraft, color: statusDraft, active: filterApprovalStatus === ApprovalStatus.DRAFT },
    { key: ApprovalStatus.PENDING_APPROVAL, label: 'Chờ Cảng vụ duyệt', count: countPendingApproval, color: statusAttention, active: filterApprovalStatus === ApprovalStatus.PENDING_APPROVAL },
    { key: ApprovalStatus.APPROVED_LEVEL1, label: 'Chờ Cục duyệt', count: countApprovedLevel1, color: '#0284C7', active: filterApprovalStatus === ApprovalStatus.APPROVED_LEVEL1 },
    { key: ApprovalStatus.APPROVED, label: 'Đã duyệt', count: countApproved, color: statusOperational, active: filterApprovalStatus === ApprovalStatus.APPROVED },
    { key: ApprovalStatus.REJECTED_LEVEL1, label: 'Từ chối', count: countRejected, color: statusCritical, active: filterApprovalStatus === ApprovalStatus.REJECTED_LEVEL1 || filterApprovalStatus === ApprovalStatus.REJECTED_LEVEL2 },
  ], [total, countAllFiltered, filterApprovalStatus, countDraft, countPendingApproval, countApprovedLevel1, countApproved, countRejected]);

  const handleFilterSearch = useCallback((values: Record<string, any>) => {
    setFilterKeyword(values.keyword?.trim() || '');
    setFilterOrgUnitId(values.orgUnitId || undefined);
    setFilterPortId(values.portId || undefined);
    setFilterProvinceId(values.provinceId !== undefined ? Number(values.provinceId) : undefined);
    setFilterConditionStatus(values.conditionStatus || undefined);
    setFilterApprovalStatus(values.approvalStatus || undefined);
    setFilterYear(values.year ? Number(values.year) : undefined);

    if (values.operationDateRange && values.operationDateRange[0] && values.operationDateRange[1]) {
      setFilterOperationStartDateFrom(values.operationDateRange[0].format('YYYY-MM-DD'));
      setFilterOperationStartDateTo(values.operationDateRange[1].format('YYYY-MM-DD'));
    } else {
      setFilterOperationStartDateFrom(undefined);
      setFilterOperationStartDateTo(undefined);
    }

    if (values.updateDateRange && values.updateDateRange[0] && values.updateDateRange[1]) {
      setFilterUpdatedFrom(values.updateDateRange[0].startOf('day').toISOString());
      setFilterUpdatedTo(values.updateDateRange[1].endOf('day').toISOString());
    } else {
      setFilterUpdatedFrom(undefined);
      setFilterUpdatedTo(undefined);
    }

    setPage(1);
  }, []);

  const handleFilterReset = useCallback(() => {
    setFilterKeyword('');
    setFilterOrgUnitId(undefined);
    setFilterPortId(undefined);
    setFilterProvinceId(undefined);
    setFilterConditionStatus(undefined);
    setFilterApprovalStatus(undefined);
    setFilterYear(undefined);
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

  // ── History rendering ──────────────────────────────────────────

  const fmtTime = (ts: string) => {
    const d = dayjs(ts);
    return `${d.format('HH:mm')} ${d.format('DD/MM/YYYY')}`;
  };

  const renderHistoryTimeline = (records: any[]) => {
    const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000);
    const sorted = [...records].sort((a: any, b: any) => new Date(historyTimestamp(b) || 0).getTime() - new Date(historyTimestamp(a) || 0).getTime());
    const q = historySearch.toLowerCase().trim();
    const groups: { tsSec: number; ts: string; actor: string; status?: any; approvalLevel?: any; items: any[] }[] = [];
    for (const r of sorted) {
      const ts = historyTimestamp(r);
      const sec = ts ? toSec(ts) : 0;
      const prev = groups[groups.length - 1];
      const actor = historyActor(r);
      if (prev && prev.tsSec === sec && prev.actor === actor && prev.status === r.status && prev.approvalLevel === r.approvalLevel) {
        prev.items.push(r);
      } else {
        groups.push({ tsSec: sec, ts, actor, status: r.status, approvalLevel: r.approvalLevel, items: [r] });
      }
    }
    if (groups.length === 0) return (
      <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
        <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
        <div style={{ color: textTertiary, fontSize: fontSizeMd }}>{q || historyDateFrom || historyDateTo ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận'}</div>
      </div>
    );
    return (
      <div>{groups.map((g, gi) => {
        const changes = g.items.flatMap((item: any) => historyChangeRows(item)).sort((a: any, b: any) => {
          const ia = HISTORY_FIELD_ORDER.indexOf(a.field);
          const ib = HISTORY_FIELD_ORDER.indexOf(b.field);
          return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        });
        const unitName = g.items[0]?.orgUnitName || g.items[0]?.unitName || '—';
        const isCreate = changes.every((c: any) => c.oldValue === null || c.oldValue === '(null)' || c.oldValue === '');
        const informationTitle = isCreate ? 'Thông tin thêm mới:' : 'Thông tin thay đổi:';
        const formatHistoryValue = (fn: string, raw: string | null) => {
          if (raw === null || raw === '(null)' || raw === '') return null;
          const t = raw.trim();
          if (t.startsWith('[') && t.endsWith(']')) {
            if (t === '[]') return 'Không có';
            const parts = t.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean);
            return `${parts.length} công trình hạ tầng`;
          }
          if (/^-?\d+(\.\d+)?$/.test(t)) {
            const n = Number(t);
            return Number.isInteger(n) ? String(n) : t;
          }
          return historyFieldValue(fn, raw);
        };
        if (changes.length === 0) return null;
        const actionMeta = resolveHistoryActionMeta(g, changes);
        return (
            <div
              key={gi}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(310px, 0.38fr) minmax(0, 1fr)',
                gap: spaceLg,
                alignItems: 'start',
                marginBottom: gi < groups.length - 1 ? spaceMd : 0,
              }}
            >
              <div style={{ minWidth: 0, paddingTop: spaceXs }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: spaceSm, marginBottom: spaceXs }}>
                  <Typography.Text style={{ display: 'block', fontSize: fontSizeLg - 1, color: textPrimary, fontWeight: fontWeightBold, lineHeight: 1.5, whiteSpace: 'nowrap' }}>
                    {g.ts ? fmtTime(g.ts) : '—'}
                  </Typography.Text>
                  <span style={{ flexShrink: 0 }}>
                    <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeSm + 1, fontWeight: fontWeightMedium, background: actionMeta.bg, color: actionMeta.color, whiteSpace: 'nowrap' }}>
                      {actionMeta.label}
                    </span>
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: spaceXs }}>
                  <Typography.Text style={{ display: 'block', fontSize: fontSizeSm + 1, color: textSecondary, fontWeight: fontWeightMedium, lineHeight: 1.4 }}>
                    Người cập nhật: <span style={{ color: textPrimary, fontWeight: fontWeightBold }}>{g.actor || '—'}</span>
                  </Typography.Text>
                  <Typography.Text style={{ display: 'block', fontSize: fontSizeSm + 1, color: textSecondary, fontWeight: fontWeightMedium, lineHeight: 1.4 }}>
                    Đơn vị: <span style={{ color: textPrimary }}>{unitName}</span>
                  </Typography.Text>
                </div>
              </div>

              <div style={{ position: 'relative', minWidth: 0, background: surfacePage, borderRadius: radiusSm, padding: `${spaceMd}px ${spaceLg}px`, paddingLeft: spaceLg, overflow: 'hidden', border: `1px solid ${borderDefault}` }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: spaceXs, background: `linear-gradient(180deg, ${actionMeta.color} 0%, ${actionMeta.color}40 100%)` }} />
                <Typography.Text style={{ display: 'block', color: colors.sidebarBg, fontSize: fontSizeMd, fontWeight: fontWeightBold, marginBottom: spaceSm }}>
                  {informationTitle}
                </Typography.Text>

                {(() => {
                  const isLongHistoryText = (val: string | null | undefined): boolean => {
                    if (!val) return false;
                    const str = String(val).trim();
                    return str.length > 40 || str.includes('\n') || (str.includes(',') && str.length > 25);
                  };

                  const renderHistoryContent = (field: string, val: string | null, _isOld: boolean = false) => {
                    if (val === null || val === undefined || val === '—' || val === '') {
                      return <span style={{ color: textTertiary }}>—</span>;
                    }
                    const str = String(val).trim();
                    if (str.includes(',') && str.length > 25) {
                      const items = str.split(',').map((s) => s.trim()).filter(Boolean);
                      if (items.length > 1) {
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
                            {items.map((item, idx) => (
                              <div key={idx} style={{ color: textPrimary, fontWeight: fontWeightMedium, lineHeight: '20px', wordBreak: 'break-word' }}>
                                {item}
                              </div>
                            ))}
                          </div>
                        );
                      }
                    }
                    return renderHistoryValueTag(field, val);
                  };

                  const validChanges = changes.filter((c: any) => {
                    if (!c.field && !c.oldValue && !c.newValue) return false;
                    const ov = formatHistoryValue(c.field, c.oldValue);
                    const nv = formatHistoryValue(c.field, c.newValue);
                    if (ov == null && nv == null) return false;
                    if (ov !== null && nv !== null && String(ov).trim() === String(nv).trim()) return false;
                    return true;
                  });
                  const reasons = g.items.map((i: any) => i.reason || i.ghiChu || i.note).filter(Boolean);

                  if (validChanges.length > 0) {
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: spaceSm }}>
                        {validChanges.map((change, ri: number) => {
                          const fn = change.field;
                          const ov = formatHistoryValue(fn, change.oldValue);
                          const nv = formatHistoryValue(fn, change.newValue);

                          if (isCreate) {
                            return (
                              <div key={`${fn}-${ri}`} style={{ display: 'grid', gridTemplateColumns: '170px minmax(0, 1fr)', alignItems: 'flex-start', gap: spaceMd, fontSize: fontSizeMd, lineHeight: 1.6, padding: '3px 0' }}>
                                <div style={{ fontWeight: fontWeightMedium, color: textSecondary, overflowWrap: 'break-word' }}>{fn ? `${historyFieldName(fn)}:` : '—'}</div>
                                <div style={{ minWidth: 0, overflowWrap: 'break-word' }}>{renderHistoryContent(fn, nv, false)}</div>
                              </div>
                            );
                          }

                          return (
                            <div key={`${fn}-${ri}`} style={{ display: 'grid', gridTemplateColumns: '170px minmax(100px, 1fr) 24px minmax(100px, 1fr)', alignItems: 'flex-start', gap: spaceSm, fontSize: fontSizeMd, lineHeight: 1.6, padding: '3px 0' }}>
                              <div style={{ fontWeight: fontWeightMedium, color: textSecondary, overflowWrap: 'break-word' }}>{fn ? `${historyFieldName(fn)}:` : '—'}</div>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, overflowWrap: 'break-word' }}>
                                {renderHistoryContent(fn, ov, true)}
                              </div>
                              <div style={{ color: textTertiary, textAlign: 'center', fontWeight: fontWeightBold, userSelect: 'none', paddingTop: 2 }}>→</div>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, overflowWrap: 'break-word' }}>
                                {renderHistoryContent(fn, nv, false)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }

                if (reasons.length > 0) {
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: spaceXs }}>
                      {reasons.map((r: string, ri: number) => (
                        <div key={ri} style={{ fontSize: fontSizeMd, color: textPrimary }}>
                          {r}
                        </div>
                      ))}
                    </div>
                  );
                }

                return <Typography.Text style={{ color: textTertiary, fontSize: fontSizeMd }}>Không có thông tin chi tiết</Typography.Text>;
              })()}
            </div>
          </div>
        );
      })}</div>
    );
  };

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
              <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>Tìm kiếm</div>
              <Input
                placeholder="Tìm theo mã, tên hệ thống VTS..."
                allowClear
                value={filterValues.keyword || ''}
                onChange={(event) => setFilterValues((prev) => ({ ...prev, keyword: event.target.value }))}
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

                <div style={{ marginBottom: spaceFormField }}>
                  <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>Địa điểm (Tỉnh / TP)</div>
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
          loading={false}
          onSort={handleSort}
          scroll={{ x: 'max-content' }}
        />
        {/* chk vẫn hiện phân trang khi bảng rỗng (Tổng cộng: 0). */}
        <Pagination total={total} current={page} pageSize={pageSize} onChange={(p, ps) => { setPage(p); setPageSize(ps); }} />
      </FilterTableLayout>

      {/* Form tự quản lý Drawer để dùng cùng một lớp hiển thị như màn Cảng biển. */}
      {isModalOpen && (
        <VtsSystemChkForm
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
      <Drawer
        size={960}
        placement="right"
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        closable={false}
        extra={<Button type="text" aria-label="Đóng lịch sử thay đổi" onClick={() => setHistoryModalOpen(false)} style={drawerCloseBtnStyle}>✕</Button>}
        footer={null}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '12px 24px 12px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
        }}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Space size={spaceSm} style={{ alignItems: 'center' }}>
              <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
              <span style={drawerTitleStyle}>
                {selectedRecord ? `Lịch sử thay đổi — ${selectedRecord.systemName}` : 'Lịch sử thay đổi'}
              </span>
              {/* Lịch sử tải theo trang (cuộn vô hạn) — chỉ được gọi là "tổng cộng"
                  khi đã tải hết, nếu không con số sẽ sai cho tới lúc cuộn xong. */}
              <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: radiusSm, fontSize: fontSizeLg - 1, fontWeight: fontWeightBold, background: `${colors.sidebarBg}15`, color: colors.sidebarBg, lineHeight: '20px' }}>
                {hasMoreHistory ? `Đã tải ${historyGroupCount}+` : `Tổng cộng ${historyGroupCount}`}
              </span>
            </Space>
          </div>
        }
      >
        <style>{`.history-dt-popup .ant-picker-now-btn { color: ${actionPrimary} !important; }`}</style>
        <div style={{ flexShrink: 0 }}>
          {!loadingHistory && (
            <div style={{ display: 'none' }}>
              <Radio.Group value="current" size="middle" style={{ display: 'flex', width: '100%', borderBottom: `1px solid ${borderDefault}` }}>
                <Radio.Button value="current" style={{ flex: 1, minWidth: 0, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', borderRadius: 0, border: 'none', background: 'transparent', fontSize: fontSizeMd, padding: `0 ${spaceMd}px`, borderBottom: `2px solid ${actionPrimary}`, fontWeight: fontWeightBold, color: actionPrimary }}>Bản ghi hiện tại <Tag color="blue" style={{ borderRadius: radiusSm, fontSize: 11, marginLeft: 4 }}>{historyGroupCount}</Tag></Radio.Button>
                {/* ALL_TAB_HIDDEN — cần backend getAllHistory cho VTS để bật tab này */}
              </Radio.Group>
            </div>
          )}
          <div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceMd }}>
            <Input
              placeholder="Tìm kiếm nội dung thay đổi..."
              allowClear
              value={historySearchInput}
              onChange={(e) => {
                const val = e.target.value;
                setHistorySearchInput(val);
                if (!val) {
                  setHistorySearch('');
                  setHistoryReloadToken((token) => token + 1);
                }
              }}
              onPressEnter={() => {
                setHistorySearch(historySearchInput.trim());
                setHistoryReloadToken((token) => token + 1);
              }}
              style={{ ...inputStyle, flex: 1 }}
            />
            <DatePicker.RangePicker
              {...getRangePickerProps({
                value: (historyDateFrom && historyDateTo)
                  ? [dayjs(historyDateFrom), dayjs(historyDateTo)]
                  : (historyDateFrom ? [dayjs(historyDateFrom), null] : (historyDateTo ? [null, dayjs(historyDateTo)] : null)),
                onChange: (dates: any) => {
                  if (!dates || dates.length === 0 || (!dates[0] && !dates[1])) {
                    setHistoryDateFrom('');
                    setHistoryDateTo('');
                  } else {
                    setHistoryDateFrom(dates[0] ? dates[0].startOf('day').format('YYYY-MM-DDTHH:mm:ss') : '');
                    setHistoryDateTo(dates[1] ? dates[1].endOf('day').format('YYYY-MM-DDTHH:mm:ss') : '');
                  }
                },
                style: { ...inputStyle, width: 280 },
              })}
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              loading={loadingHistory}
              onClick={() => {
                setHistorySearch(historySearchInput.trim());
                setHistoryReloadToken((token) => token + 1);
              }}
              style={primaryButtonStyle}
            >
              Tìm kiếm
            </Button>
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

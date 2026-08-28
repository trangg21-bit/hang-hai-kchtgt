import { useState, useCallback, useEffect, useMemo } from 'react';
import { Input, Select, DatePicker, Drawer, Modal, Alert, Space, Typography, Button } from 'antd';
import dayjs from 'dayjs';
import { message } from '../../components/ToastNotification';
import { navigationChannelCRUD, navigationChannelApproval } from '../../services/navigationChannelService';
import { organizationService } from '../../services/organizationService';
import { vtsSystemCRUD } from '../../services/vtsSystemService';
import { userService } from '../../services/userService';
import { ScreenHeader, DataTable } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import { OrgUnitTreeSelect } from '../../components/org-unit';
import { usePermissionStore } from '../../store/permissionStore';
import type { NavigationChannelResponse, ListParams, ApprovalStatus } from '../../types/navigationChannel';
import { CONDITION_STATUS_OPTIONS, CONDITION_STATUS_MAP } from '../../types/navigationChannel';
import { VIETNAM_PROVINCE_OPTIONS } from '../../types/common';
import {
  statusOperational,
  statusCritical,
  statusAttention,
  statusDraft,
  actionPrimary,
  textPrimary,
  textSecondary,
  textTertiary,
  borderDefault,
  fontSizeMd,
  fontSizeLg,
  fontSizeSm,
  fontWeightMedium,
  fontWeightBold,
  radiusPill,
  spaceSm,
  spaceMd,
  spaceXs,
  spaceXl,
  spaceFormField,
  statusBadgeStyle,
  cellTitleStyle,
  cellSubtitleStyle,
  icons,
  colors,
  filterInputStyle,
  filterLabelStyle,
  drawerProps,
  drawerTitleStyle,
  drawerCloseBtnStyle,
  historyGroupGridStyle,
  historyTimeStyle,
  historyMetaRowStyle,
  historyInfoCardStyle,
  historyAccentBarStyle,
  historyInfoTitleStyle,
  historyChangeRowStyle,
  historyCreateRowStyle,
  historyFieldLabelStyle,
  historyOldValueStyle,
  historyNewValueStyle,
  historyArrowStyle,
} from '../../themetokenchk';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import ApprovalModal from '../../components/shared/ApprovalModal';
import NavigationChannelForm from './NavigationChannelForm';
import { canDeleteApprovalRecord, canEditApprovalRecord } from '../../utils/approvalEditPolicy';

// ── #8 Tình trạng — màu badge theo token ─────────────────────────────
const CONDITION_STATUS_STYLE_MAP: Record<string, { label: string; color: string }> = {
  OPERATIONAL: { label: 'Đang hoạt động', color: statusOperational },
  STOPPED: { label: 'Dừng hoạt động', color: statusCritical },
  MAINTENANCE: { label: 'Đang bảo trì', color: statusAttention },
  UNDER_CONSTRUCTION: { label: 'Đang xây dựng', color: statusDraft },
};

// ── #47 Trạng thái — tabs theo trạng thái phê duyệt ──────────────────
const STATUS_TAB_LIST = [
  { key: 'all', label: 'Tất cả', statuses: [] as string[] },
  // Nhãn theo 7 trạng thái chuẩn — approval-2-level-spec.md mục 3.1/3.10
  { key: 'DRAFT', label: 'Lưu tạm', statuses: ['DRAFT'] },
  { key: 'PENDING_APPROVAL', label: 'Chờ Cảng vụ duyệt', statuses: ['PENDING_APPROVAL'] },
  { key: 'APPROVED_LEVEL1', label: 'Chờ Cục duyệt', statuses: ['APPROVED_LEVEL1'] },
  { key: 'APPROVED', label: 'Đã duyệt', statuses: ['APPROVED'] },
  { key: 'REJECTED', label: 'Từ chối', statuses: ['REJECTED', 'REJECTED_LEVEL1', 'REJECTED_LEVEL2'] },
];

const TAB_COLOR: Record<string, string> = {
  all: textSecondary,
  DRAFT: statusDraft,
  PENDING_APPROVAL: statusAttention,
  APPROVED_LEVEL1: actionPrimary,
  APPROVED: statusOperational,
  REJECTED: statusCritical,
};

// ── Lịch sử thay đổi (chuẩn VTS CHK) ─────────────────────────────────
const historyFieldLabels: Record<string, string> = {
  orgUnitId: 'Đơn vị quản lý', seaportId: 'Thuộc cảng biển', operatingUnitId: 'Đơn vị vận hành',
  channelCode: 'Mã luồng hàng hải', channelName: 'Tên luồng hàng hải',
  provinceId: 'Địa điểm (Tỉnh/TP)', detailedLocation: 'Địa điểm chi tiết', conditionStatus: 'Tình trạng',
  managementStation: 'Trạm quản lý luồng', stationCount: 'Số lượng trạm', stationStaffCount: 'Số lượng nhân sự tại trạm',
  stationAreaSquareMeters: 'Diện tích trạm (m²)', latestStationRepairMonth: 'Sửa chữa trạm gần nhất',
  latestMaintenanceYear: 'Năm bảo trì gần nhất', latestDredgingVolumeCubicMeters: 'KL nạo vét (m³)',
  buoyCount: 'Số lượng phao', beaconCount: 'Số lượng tiêu', notes: 'Ghi chú',
  announcementDecisionNumber: 'Quyết định công bố số', announcementDecisionDate: 'Ngày ra quyết định',
  announcementDecisionIssuer: 'Đơn vị ra quyết định',
  protectionScopeMeters: 'Phạm vi bảo vệ luồng (m)', protectionNotes: 'Ghi chú phạm vi bảo vệ',
  geometryType: 'Loại đối tượng', mapIconId: 'Biểu tượng', coordinateReferenceSystem: 'Hệ quy chiếu',
  displayRule: 'Quy tắc hiển thị', mapSymbolId: 'Biểu tượng', approvalStatus: 'Trạng thái',
  submittedAt: 'Ngày gửi phê duyệt', submittedBy: 'Người gửi phê duyệt',
  level1ApprovedAt: 'Ngày duyệt Cảng vụ', level1ApprovedBy: 'Người duyệt Cảng vụ',
  level1ApprovalContent: 'Nội dung duyệt Cảng vụ',
  level2ApprovedAt: 'Ngày duyệt Cục', level2ApprovedBy: 'Người duyệt Cục',
  level2ApprovalContent: 'Nội dung duyệt Cục', rejectionReason: 'Lý do từ chối',
  updatedAt: 'Ngày cập nhật', updatedBy: 'Cán bộ cập nhật',
  'Trạng thái': 'Hành động',
};

function historyFieldName(fn: string): string { return historyFieldLabels[fn] || fn; }

/** Badge thao tác cho lịch sử (chuẩn VTS CHK): phân biệt Thêm mới / Cập nhật / Phê duyệt / Từ chối / Trình duyệt. */
function resolveHistoryActionMeta(group: any, changes: any[]): { label: string; color: string; bg: string } {
  const item = group.items?.[0] || {};
  const rawStatus = String(item.status ?? item.action ?? '').toUpperCase();
  const rawReason = String(item.reason ?? item.ghiChu ?? item.note ?? '').toLowerCase();
  const level = Number(item.approvalLevel || 0);

  if (rawStatus === 'CREATED' || rawStatus === 'CREATE' || rawReason.includes('tạo mới') || rawReason.includes('thêm mới') || rawReason.includes('tao moi') || rawReason.includes('them moi')) {
    return { label: 'Thêm mới', color: statusOperational, bg: `${statusOperational}18` };
  }
  if (rawStatus === 'ATTACHMENT_UPLOADED' || rawReason.includes('tải lên') || rawReason.includes('tai len') || item.changedField?.includes('đính kèm')) {
    return { label: 'Tải lên tệp', color: '#0284c7', bg: '#0284c718' };
  }
  if (rawStatus === 'ATTACHMENT_DELETED' || rawReason.includes('xóa tài liệu') || rawReason.includes('xóa tệp') || rawReason.includes('xoa tep')) {
    return { label: 'Xóa tệp', color: '#ea580c', bg: '#ea580c18' };
  }
  if (rawStatus === 'UPDATED' || rawStatus === 'UPDATE' || rawStatus === 'EDIT' || rawReason.includes('cập nhật') || rawReason.includes('chỉnh sửa')) {
    return { label: 'Cập nhật', color: actionPrimary, bg: `${actionPrimary}18` };
  }
  if (rawReason.includes('phê duyệt cấp cảng vụ') || rawReason.includes('phe duyet cap cang vu')) {
    return { label: 'Phê duyệt cấp Cảng vụ', color: '#13C2C2', bg: '#13C2C218' };
  }
  if (rawReason.includes('phê duyệt cấp cục') || rawReason.includes('phe duyet cap cuc')) {
    return { label: 'Phê duyệt cấp Cục', color: statusOperational, bg: `${statusOperational}18` };
  }
  if (rawReason.includes('từ chối cấp cảng vụ') || rawReason.includes('tu choi cap cang vu')) {
    return { label: 'Từ chối cấp Cảng vụ', color: statusCritical, bg: `${statusCritical}18` };
  }
  if (rawReason.includes('từ chối cấp cục') || rawReason.includes('tu choi cap cuc')) {
    return { label: 'Từ chối cấp Cục', color: statusCritical, bg: `${statusCritical}18` };
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
    if (nv.includes('cho cang vu duyet') || nv.includes('cho phe duyet') || nv.includes('pending') || nv.includes('proposed') || nv.includes('luu tam') || nv.includes('nhap')) {
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
  if (hasApprovalStatus) {
    return fields.filter((field) => {
      const key = normalizeHistoryKey(field);
      return key !== 'approvedlevel1' && key !== 'approvedlevel2' && key !== 'da phe duyet cap 1' && key !== 'da phe duyet cap 2';
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

  if (fields.length > 1 && oldAssignments.size === 0 && newAssignments.size === 0) {
    return [{ field: fields.join(', '), oldValue, newValue }];
  }
  if (fields.length === 0) {
    return [{ field: '', oldValue, newValue }];
  }
  return fields.map((field, index) => {
    const displayField = historyFieldName(field);
    const oldAssigned = oldAssignments.get(normalizeHistoryKey(field)) ?? oldAssignments.get(normalizeHistoryKey(displayField));
    const newAssigned = newAssignments.get(normalizeHistoryKey(field)) ?? newAssignments.get(normalizeHistoryKey(displayField));
    const oldParts = oldValue?.split(';').map((part) => part.trim()).filter(Boolean) || [];
    const newParts = newValue?.split(';').map((part) => part.trim()).filter(Boolean) || [];
    return {
      field,
      oldValue: oldAssigned ?? (fields.length === 1 ? oldValue : oldParts[index] || null),
      newValue: newAssigned ?? (fields.length === 1 ? newValue : newParts[index] || null),
    };
  });
}

function renderHistoryValueTag(field: string, val: string | null) {
  if (val === null || val === undefined || val === '—') {
    return <span style={{ color: textTertiary }}>—</span>;
  }
  const normKey = normalizeHistoryKey(field);
  const normVal = normalizeHistoryKey(val);

  if (normKey === 'approvalstatus' || normKey === 'trang thai phe duyet' || normKey.includes('phe duyet') || normKey.includes('trang thai')) {
    if (normVal === 'da duyet' || normVal === 'da phe duyet' || normVal === 'approved' || normVal === 'approved_level2') {
      return (<span style={statusBadgeStyle(statusOperational)}>{val}</span>);
    }
    if (normVal === 'cho cuc duyet' || normVal === 'approved_level1' || normVal.includes('cap 1') || normVal.includes('cuc duyet')) {
      return (<span style={statusBadgeStyle('#0082fb')}>{val}</span>);
    }
    if (normVal === 'cho cang vu duyet' || normVal === 'cho phe duyet' || normVal === 'cho duyet' || normVal === 'pending' || normVal === 'pending_approval' || normVal === 'proposed' || normVal.includes('cang vu')) {
      return (<span style={statusBadgeStyle(statusAttention)}>{val}</span>);
    }
    if (normVal === 'tu choi' || normVal.includes('rejected') || normVal.includes('tra ve')) {
      return (<span style={statusBadgeStyle(statusCritical)}>{val}</span>);
    }
    return (<span style={statusBadgeStyle(statusDraft)}>{val}</span>);
  }

  if (normKey === 'conditionstatus' || normKey === 'tinh trang' || normKey.includes('tinh trang')) {
    if (normVal.includes('hoat dong tot') || normVal.includes('good') || normVal.includes('operational') || normVal.includes('hoat dong')) {
      return (<span style={statusBadgeStyle(statusOperational)}>{val}</span>);
    }
    if (normVal.includes('can bao duong') || normVal.includes('warning') || normVal.includes('maintenance') || normVal.includes('bao tri')) {
      return (<span style={statusBadgeStyle(statusAttention)}>{val}</span>);
    }
    if (normVal.includes('hong') || normVal.includes('ngung') || normVal.includes('dung') || normVal.includes('damaged') || normVal.includes('critical')) {
      return (<span style={statusBadgeStyle(statusCritical)}>{val}</span>);
    }
    if (normVal.includes('xay dung') || normVal.includes('under_construction')) {
      return (<span style={statusBadgeStyle(actionPrimary)}>{val}</span>);
    }
  }

  return <span title={val} style={{ minWidth: 0, color: textPrimary, fontWeight: fontWeightMedium, overflowWrap: 'anywhere' }}>{val}</span>;
}

function historyFieldValue(
  fn: string,
  val: string | null,
  orgMap?: Map<string, string>,
  seaportMap?: Map<string, string>,
  userMap?: Map<string, string>,
): string {
  if (!val || val === '(null)' || val === 'null') return '(trống)';
  if (fn === 'orgUnitId' && orgMap) { const full = orgMap.get(val); return full ? full.split(' - ').pop() || full : val; }
  if (fn === 'operatingUnitId' && orgMap) { const full = orgMap.get(val); return full ? full.split(' - ').pop() || full : val; }
  if (fn === 'seaportId' && seaportMap) return seaportMap.get(val) || val;
  if (fn === 'provinceId') {
    const n = Number(val);
    if (!isNaN(n)) {
      const p = VIETNAM_PROVINCE_OPTIONS.find((o) => o.value === String(n));
      if (p) return p.label;
    }
    return val;
  }
  if (fn === 'conditionStatus') {
    const m: Record<string, string> = { OPERATIONAL: 'Đang hoạt động', STOPPED: 'Dừng hoạt động', MAINTENANCE: 'Đang bảo trì', UNDER_CONSTRUCTION: 'Đang xây dựng' };
    return m[val.toUpperCase()] || val;
  }
  if (fn === 'approvalStatus') {
    const m: Record<string, string> = {
      DRAFT: 'Lưu tạm', NHAP: 'Lưu tạm', PENDING_APPROVAL: 'Chờ Cảng vụ duyệt',
      APPROVED_LEVEL1: 'Chờ Cục duyệt', APPROVED: 'Đã duyệt', DA_PHE_DUYET: 'Đã duyệt',
      REJECTED: 'Từ chối', REJECTED_LEVEL1: 'Từ chối cấp Cảng vụ', REJECTED_LEVEL2: 'Từ chối cấp Cục',
    };
    return m[val.toUpperCase()] || val;
  }
  if (fn === 'updatedBy' || fn === 'submittedBy' || fn === 'level1ApprovedBy' || fn === 'level2ApprovedBy') {
    if (userMap) return userMap.get(val) || val;
  }
  return val;
}

const HISTORY_FIELD_ORDER = [
  'orgUnitId', 'seaportId', 'operatingUnitId', 'channelCode', 'channelName', 'provinceId', 'detailedLocation',
  'conditionStatus', 'managementStation', 'stationCount', 'stationStaffCount', 'stationAreaSquareMeters',
  'latestStationRepairMonth', 'latestMaintenanceYear', 'latestDredgingVolumeCubicMeters', 'buoyCount', 'beaconCount',
  'notes', 'announcementDecisionNumber', 'announcementDecisionDate', 'announcementDecisionIssuer',
  'protectionScopeMeters', 'protectionNotes', 'geometryType', 'mapIconId', 'mapSymbolId',
  'coordinateReferenceSystem', 'displayRule',
];
const HISTORY_PAGE_SIZE = 10;

export default function NavigationChannelList() {
  const isInIframe = window.self !== window.top;
  const hasPerm = useCallback((key: string) => usePermissionStore.getState().hasPermission(key), []);

  // ── Filters (DS/Lọc: #1/#2/#4/#5/#6/#8/#47/#48) ────────────────────
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterChannelCode, setFilterChannelCode] = useState('');
  const [filterOrgUnitId, setFilterOrgUnitId] = useState<string | undefined>();
  const [filterSeaportId, setFilterSeaportId] = useState<string | undefined>();
  const [filterProvinceId, setFilterProvinceId] = useState<string | undefined>();
  const [filterConditionStatus, setFilterConditionStatus] = useState<string | undefined>();
  const [filterUpdatedBy, setFilterUpdatedBy] = useState<string | undefined>();
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState('');
  const [filterUpdatedTo, setFilterUpdatedTo] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
  const [filterCollapsed, setFilterCollapsed] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortField, setSortField] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [dataSource, setDataSource] = useState<NavigationChannelResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  // ── Dropdown data ───────────────────────────────────────────────────
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [seaportOptions, setSeaportOptions] = useState<{ id: string; portCode?: string; portName?: string }[]>([]);
  const [userOptions, setUserOptions] = useState<{ value: string; label: string }[]>([]);

  // ── Modal (create / edit / detail) ──────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'detail'>('create');

  // ── Approval / delete / history ─────────────────────────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<NavigationChannelResponse | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submittingRecord, setSubmittingRecord] = useState<NavigationChannelResponse | null>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvingRecord, setApprovingRecord] = useState<NavigationChannelResponse | null>(null);
  const [approveLevel, setApproveLevel] = useState<'c1' | 'c2'>('c1');
  const [approving, setApproving] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRecord, setRejectingRecord] = useState<NavigationChannelResponse | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<NavigationChannelResponse | null>(null);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');
  const [historyReloadToken, setHistoryReloadToken] = useState(0);
  const [historyPage, setHistoryPage] = useState(0);

  useEffect(() => {
    if (isInIframe) return;
    (async () => {
      try {
        const orgs = await organizationService.getTree();
        setOrganizations(orgs || []);
      } catch (err) {
        console.error('Không tải được cây đơn vị quản lý', err);
      }
      try {
        const ports = await vtsSystemCRUD.getScopedPortOptions();
        setSeaportOptions(ports || []);
      } catch (err) {
        console.error('Không tải được danh sách cảng biển', err);
      }
      try {
        const resp: any = await userService.list({ pageSize: 1000 });
        const users = resp?.data || resp?.content || [];
        setUserOptions(users.map((u: any) => ({ value: u.id, label: u.fullName || u.username || u.id })));
      } catch (err) {
        console.error('Không tải được danh sách cán bộ', err);
      }
    })();
  }, [isInIframe]);

  // ── Fetch list ──────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const activeTabDef = STATUS_TAB_LIST.find((t) => t.key === activeTab);
      const params: ListParams = {
        page: page - 1,
        size: pageSize,
        keyword: filterKeyword.trim() || undefined,
        channelCode: filterChannelCode.trim() || undefined,
        orgUnitId: filterOrgUnitId,
        seaportId: filterSeaportId,
        provinceId: filterProvinceId ? Number(filterProvinceId) : undefined,
        conditionStatus: filterConditionStatus as any,
        approvalStatus: activeTabDef && activeTabDef.statuses.length === 1 ? activeTabDef.statuses[0] : undefined,
        updatedFrom: filterUpdatedFrom || undefined,
        updatedTo: filterUpdatedTo || undefined,
        updatedBy: filterUpdatedBy,
        sortField,
        sortOrder: sortOrder || undefined,
      };
      const res = await navigationChannelCRUD.search(params);
      setDataSource(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setTotal(0);
      setDataSource([]);
      console.error('Lỗi tải danh sách luồng hàng hải', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, activeTab, filterKeyword, filterChannelCode, filterOrgUnitId, filterSeaportId, filterProvinceId, filterConditionStatus, filterUpdatedFrom, filterUpdatedTo, filterUpdatedBy, sortField, sortOrder]);

  // ── Tab counts ──────────────────────────────────────────────────────
  const fetchCounts = useCallback(async () => {
    try {
      const results = await Promise.allSettled(
        STATUS_TAB_LIST.map((tab) =>
          Promise.all(
            tab.statuses.map((s) =>
              navigationChannelCRUD.search({ approvalStatus: s, page: 0, size: 1 }).then((r) => r.total),
            ),
          ).then((totals) => totals.reduce((sum, n) => sum + n, 0)),
        ),
      );
      const next: Record<string, number> = {};
      STATUS_TAB_LIST.forEach((tab, i) => {
        next[tab.key] = results[i].status === 'fulfilled' ? (results[i] as PromiseFulfilledResult<number>).value : 0;
      });
      setTabCounts(next);
    } catch (err) {
      console.error('Không tính được số lượng theo trạng thái', err);
    }
  }, []);

  useEffect(() => { if (!isInIframe) { void fetchData(); void fetchCounts(); } }, [fetchData, fetchCounts, isInIframe]);

  // ── Filter handlers ─────────────────────────────────────────────────
  const handleFilterApply = useCallback(() => { setPage(1); }, []);
  const handleFilterReset = useCallback(() => {
    setFilterKeyword('');
    setFilterChannelCode('');
    setFilterOrgUnitId(undefined);
    setFilterSeaportId(undefined);
    setFilterProvinceId(undefined);
    setFilterConditionStatus(undefined);
    setFilterUpdatedBy(undefined);
    setFilterUpdatedFrom('');
    setFilterUpdatedTo('');
    setActiveTab('all');
    setPage(1);
  }, []);

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key);
    setPage(1);
  }, []);

  const handleSort = useCallback((key: string, order: 'asc' | 'desc') => {
    setSortField(key);
    setSortOrder(order);
    setPage(1);
  }, []);

  const refreshAfterMutation = useCallback(() => {
    void fetchData();
    void fetchCounts();
  }, [fetchData, fetchCounts]);

  const openModal = useCallback((mode: 'create' | 'edit' | 'detail', id?: string) => {
    setModalMode(mode);
    setEditingId(id || null);
    setIsModalOpen(true);
  }, []);

  // Map user id → tên hiển thị cho cột "Cán bộ cập nhật" (backend NavigationChannel chưa trả updatedByName như các module khác)
  const userMap = useMemo(() => {
    const m = new Map<string, string>();
    userOptions.forEach((o) => { m.set(o.value, o.label); });
    return m;
  }, [userOptions]);

  // ── Delete confirmation ─────────────────────────────────────────────
  const openDeleteModal = useCallback((record: NavigationChannelResponse) => {
    setDeletingRecord(record); setDeleteConfirmText(''); setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingRecord) return;
    const expectedText = (deletingRecord.channelName || 'XÓA').trim().toLowerCase();
    const input = deleteConfirmText.trim().toLowerCase();
    if (input !== expectedText && input !== 'xóa') {
      message.error('Vui lòng nhập đúng tên luồng hàng hải hoặc gõ "XÓA" để xác nhận');
      return;
    }
    try {
      await navigationChannelCRUD.delete(deletingRecord.id);
      message.success('Đã xóa luồng hàng hải');
      setDeleteModalOpen(false); setDeletingRecord(null); setDeleteConfirmText('');
      refreshAfterMutation();
    } catch (err: unknown) { message.error(err instanceof Error ? err.message : 'Xóa thất bại'); }
  }, [deletingRecord, deleteConfirmText, refreshAfterMutation]);

  // ── Submit approval (Lưu tạm → Chờ Cảng vụ duyệt) ───────────────────
  const handleConfirmSubmit = useCallback(async () => {
    if (!submittingRecord) return;
    try {
      await navigationChannelApproval.submitApproval(submittingRecord.id);
      message.success('Đã gửi phê duyệt luồng hàng hải');
      setSubmitModalOpen(false); setSubmittingRecord(null);
      refreshAfterMutation();
    } catch (err: unknown) { message.error(err instanceof Error ? err.message : 'Gửi phê duyệt thất bại'); }
  }, [submittingRecord, refreshAfterMutation]);

  // ── Approve (ApprovalModal chuẩn — không modal tự chế) ──────────────
  const handleApprove = useCallback(async (record: NavigationChannelResponse, content?: string) => {
    if (!record) return;
    setApproving(true);
    try {
      const req = { status: 'APPROVED' as const, reason: content };
      if (record.approvalStatus === 'APPROVED_LEVEL1') {
        await navigationChannelApproval.approveC2(record.id, req);
      } else {
        await navigationChannelApproval.approveC1(record.id, req);
      }
      message.success('Đã phê duyệt luồng hàng hải');
      setApproveModalOpen(false); setApprovingRecord(null); setApproveLevel('c1');
      refreshAfterMutation();
    } catch (err: unknown) { message.error(err instanceof Error ? err.message : 'Phê duyệt thất bại'); }
    finally { setApproving(false); }
  }, [refreshAfterMutation]);

  // ── Reject ──────────────────────────────────────────────────────────
  const openRejectModal = useCallback((record: NavigationChannelResponse) => {
    setRejectingRecord(record); setRejectReason(''); setRejectModalOpen(true);
  }, []);

  const handleConfirmReject = useCallback(async () => {
    if (!rejectingRecord) return;
    const reason = rejectReason.trim();
    if (!reason) { message.error('Vui lòng nhập lý do từ chối'); return; }
    if (reason.length < 10) { message.error('Lý do từ chối tối thiểu 10 ký tự'); return; }
    if (reason.length > 500) { message.error('Lý do từ chối tối đa 500 ký tự'); return; }
    try {
      const req = { status: 'REJECTED' as const, reason };
      if (rejectingRecord.approvalStatus === 'APPROVED_LEVEL1') {
        await navigationChannelApproval.rejectLevel2(rejectingRecord.id, req);
      } else {
        await navigationChannelApproval.rejectLevel1(rejectingRecord.id, req);
      }
      message.success('Đã từ chối phê duyệt');
      setRejectModalOpen(false); setRejectingRecord(null); setRejectReason('');
      refreshAfterMutation();
    } catch (err: unknown) { message.error(err instanceof Error ? err.message : 'Từ chối thất bại'); }
  }, [rejectingRecord, rejectReason, refreshAfterMutation]);

  // ── History (giữ nguyên API history của module — chỉ đổi render) ────
  const openHistory = useCallback((record: NavigationChannelResponse) => {
    setHistoryTarget(record); setHistoryOpen(true); setHistoryRecords([]);
    setHistoryLoading(false); setLoadingMoreHistory(false);
    setHistorySearch(''); setHistoryFrom(''); setHistoryTo(''); setHistoryPage(0);
    setHistoryReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    if (!historyOpen || !historyTarget) return;
    setHistoryLoading(true); setLoadingMoreHistory(false); setHistoryPage(0);
    const timer = setTimeout(async () => {
      try {
        const items = await navigationChannelApproval.getHistory(historyTarget.id);
        setHistoryRecords(Array.isArray(items) ? items : []);
      } catch { message.error('Không thể tải lịch sử'); }
      finally { setHistoryLoading(false); }
    }, historySearch.trim() ? 300 : 0);
    return () => clearTimeout(timer);
  }, [historyOpen, historyTarget, historySearch, historyFrom, historyTo, historyReloadToken]);

  // Lọc phía client (keyword + khoảng ngày), phân trang cuộn vô hạn 10/trang
  const filteredHistory = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    const from = historyFrom ? new Date(historyFrom.replace(' ', 'T')).getTime() : 0;
    const to = historyTo ? new Date(historyTo.replace(' ', 'T') + ':59').getTime() : Number.POSITIVE_INFINITY;
    const list = Array.isArray(historyRecords) ? historyRecords : [];
    return list.filter((r: any) => {
      const ts = new Date(historyTimestamp(r) || 0).getTime();
      if (ts < from || ts > to) return false;
      if (!q) return true;
      const hay = `${historyActor(r)} ${historyField(r)} ${historyOldValue(r) || ''} ${historyNewValue(r) || ''} ${r.reason || r.ghiChu || r.note || ''} ${r.status || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [historyRecords, historySearch, historyFrom, historyTo]);

  const hasMoreHistory = filteredHistory.length > (historyPage + 1) * HISTORY_PAGE_SIZE;
  const visibleHistory = filteredHistory.slice(0, (historyPage + 1) * HISTORY_PAGE_SIZE);

  const loadMoreHistory = useCallback(() => {
    if (historyLoading || loadingMoreHistory || !hasMoreHistory) return;
    setLoadingMoreHistory(true);
    setHistoryPage((p) => p + 1);
    setTimeout(() => setLoadingMoreHistory(false), 200);
  }, [historyLoading, loadingMoreHistory, hasMoreHistory]);

  const handleHistoryScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) loadMoreHistory();
  };

  const renderNavigationChannelHistoryTimeline = (records: any[]) => {
    const safeRecords = Array.isArray(records) ? records : [];
    const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000);
    const sorted = [...safeRecords].sort((a: any, b: any) => new Date(historyTimestamp(b) || 0).getTime() - new Date(historyTimestamp(a) || 0).getTime());
    const groups: { tsSec: number; ts: string; actor: string; status?: any; approvalLevel?: any; items: any[] }[] = [];
    for (const r of sorted) {
      const ts = historyTimestamp(r);
      const sec = ts ? toSec(ts) : 0;
      const actor = historyActor(r);
      const prev = groups[groups.length - 1];
      if (prev && prev.tsSec === sec && prev.actor === actor && prev.status === r.status && prev.approvalLevel === r.approvalLevel) {
        prev.items.push(r);
      } else {
        groups.push({ tsSec: sec, ts, actor, status: r.status, approvalLevel: r.approvalLevel, items: [r] });
      }
    }
    if (groups.length === 0) return null;
    const fmtTime = (ts: string) => { const d = new Date(ts); return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`; };
    return (
      <div>{groups.map((g, gi) => {
        const rec0 = g.items[0] || {};
        const orgId = rec0.orgUnitId || historyTarget?.orgUnitId;
        const orgName = orgId ? orgMap.get(orgId) : undefined;
        const unitName = (orgName ? (orgName.split(' - ').pop() || orgName) : (rec0.orgUnitName || rec0.unitName)) || '—';
        const changes = g.items.flatMap((item: any) => historyChangeRows(item)).sort((a: any, b: any) => {
          const ia = HISTORY_FIELD_ORDER.indexOf(a.field);
          const ib = HISTORY_FIELD_ORDER.indexOf(b.field);
          return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        }).filter((c: any) => c.field !== 'infrastructureList' && c.field !== 'attachments' && c.field !== 'spatialId');
        const isCreate = changes.every((c: any) => c.oldValue === null || c.oldValue === '(null)' || c.oldValue === '');
        const informationTitle = isCreate ? 'Thông tin thêm mới:' : 'Thông tin thay đổi:';
        const actionMeta = resolveHistoryActionMeta(g, changes);
        const barColor = actionMeta.color;
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
          return historyFieldValue(fn, raw, orgMap, seaportMap, userMap);
        };
        const validChanges = changes.filter((c: any) => {
          if (!c.field) return false;
          const ov = formatHistoryValue(c.field, c.oldValue);
          const nv = formatHistoryValue(c.field, c.newValue);
          if (ov == null && nv == null) return false;
          if (ov === nv) return false;
          return true;
        });
        const reasons = g.items.map((i: any) => i.reason || i.ghiChu || i.note).filter(Boolean);
        if (validChanges.length === 0 && reasons.length === 0) return null;
        return (
          <div key={gi} style={{ ...historyGroupGridStyle, marginBottom: gi < groups.length - 1 ? spaceSm : 0 }}>
            <div style={{ minWidth: 0, paddingTop: spaceXs }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spaceSm }}>
                <Typography.Text style={historyTimeStyle}>
                  {g.ts ? fmtTime(g.ts) : '—'}
                </Typography.Text>
                <span style={{ flexShrink: 0 }}>
                  <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeSm + 1, fontWeight: fontWeightMedium, background: actionMeta.bg, color: actionMeta.color, whiteSpace: 'nowrap' }}>{actionMeta.label}</span>
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 0 }}>
                <Typography.Text style={historyMetaRowStyle}>
                  Người cập nhật: {g.actor || '—'}
                </Typography.Text>
                <Typography.Text style={historyMetaRowStyle}>
                  Đơn vị: {unitName}
                </Typography.Text>
              </div>
            </div>
            <div style={historyInfoCardStyle}>
              <div style={historyAccentBarStyle(barColor)} />
              <Typography.Text style={historyInfoTitleStyle}>
                {informationTitle}
              </Typography.Text>
              {validChanges.length > 0 ? <div>{validChanges.map((change, ri: number) => {
                const fn = change.field;
                const renderCell = (rawVal: string | null) => {
                  const k = normalizeHistoryKey(fn);
                  if (k === 'approvalstatus' || k === 'trang thai phe duyet' || k === 'conditionstatus' || k === 'tinh trang') {
                    return renderHistoryValueTag(fn, rawVal);
                  }
                  if (rawVal === null || rawVal === undefined || rawVal === '') return <span style={{ color: textTertiary }}>—</span>;
                  return <span title={rawVal} style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', maxWidth: 260, verticalAlign: 'bottom', color: textPrimary }}>{rawVal}</span>;
                };
                const isApprovalRow = ['approvalstatus', 'trang thai phe duyet', 'submittedat', 'level1approvedat', 'level2approvedat', 'submittedby', 'level1approvedby', 'level2approvedby'].includes(normalizeHistoryKey(fn));
                return (
                  <div key={ri} style={isApprovalRow ? historyCreateRowStyle : historyChangeRowStyle}>
                    <span style={historyFieldLabelStyle}>{historyFieldName(fn)}</span>
                    <span style={historyOldValueStyle}>{renderCell(change.oldValue)}</span>
                    {!isApprovalRow && <span style={historyArrowStyle}>→</span>}
                    <span style={historyNewValueStyle}>{renderCell(change.newValue)}</span>
                  </div>
                );
              })}</div> : null}
              {reasons.length > 0 && (
                <div style={{ marginTop: spaceXs, fontSize: fontSizeMd, color: textSecondary }}>
                  {reasons.map((reason, ri) => (
                    <div key={ri} style={{ marginBottom: ri < reasons.length - 1 ? spaceXs : 0 }}>Lý do: {reason}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}</div>
    );
  };

  // ── Columns (DS scope: #5/#4/#2/#1/#6/#8/#47/#48) ───────────────────
  const columns = useMemo(() => {
    const orgLabel = (orgUnitId?: string) => orgUnitId || '—';
    const seaportLabel = (seaportId?: string) => {
      if (!seaportId) return '—';
      const p = seaportOptions.find((o) => o.id === seaportId);
      return p ? (p.portCode ? `${p.portCode} - ${p.portName || ''}` : p.portName || seaportId) : seaportId;
    };
    const provinceLabel = (provinceId?: number) =>
      provinceId != null ? (VIETNAM_PROVINCE_OPTIONS.find((o) => o.value === String(provinceId))?.label || String(provinceId)) : '—';
    return [
      {
        key: 'stt',
        label: 'STT',
        width: 60,
        align: 'center' as const,
        fixed: 'left' as const,
        render: (_: unknown, __: unknown, idx?: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{(page - 1) * pageSize + (idx ?? 0) + 1}</span>,
      },
      {
        key: 'channelName',
        label: 'Tên/Mã luồng hàng hải',
        dataIndex: 'channelName',
        width: 260,
        fixed: 'left' as const,
        sortable: true,
        ellipsis: false,
        render: (v: string | undefined, record: NavigationChannelResponse) => (
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <a
              title={v || ''}
              onClick={() => openModal('detail', record.id)}
              style={{ ...cellTitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {v || '—'}
            </a>
            <span style={{ ...cellSubtitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {record.channelCode || '—'}
            </span>
          </div>
        ),
      },
      {
        key: 'seaportId',
        label: 'Thuộc cảng biển',
        dataIndex: 'seaportId',
        width: 180,
        ellipsis: true,
        render: (v: string | undefined) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{seaportLabel(v)}</span>,
      },
      {
        key: 'orgUnitId',
        label: 'Đơn vị quản lý',
        dataIndex: 'orgUnitId',
        width: 200,
        ellipsis: true,
        render: (v: string | undefined, record: NavigationChannelResponse) => (
          <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{record.orgUnitName || orgLabel(v)}</span>
        ),
      },
      {
        key: 'provinceId',
        label: 'Địa điểm Tỉnh/TP',
        dataIndex: 'provinceId',
        width: 150,
        render: (v: number | undefined) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{provinceLabel(v)}</span>,
      },
      {
        key: 'conditionStatus',
        label: 'Tình trạng',
        dataIndex: 'conditionStatus',
        width: 150,
        sortable: true,
        render: (v: string | undefined) => {
          if (!v) return <span style={{ fontSize: fontSizeMd, color: textTertiary }}>—</span>;
          const s = CONDITION_STATUS_STYLE_MAP[v] || { label: CONDITION_STATUS_MAP[v as keyof typeof CONDITION_STATUS_MAP] || v, color: textTertiary };
          return <span style={statusBadgeStyle(s.color)}>{s.label}</span>;
        },
      },
      {
        key: 'approvalStatus',
        label: 'Trạng thái',
        dataIndex: 'approvalStatus',
        width: 160,
        render: (v: ApprovalStatus) => (v ? <ApprovalStatusBadge status={v} /> : '—'),
      },
      {
        key: 'updatedAt',
        label: 'Cán bộ cập nhật',
        dataIndex: 'updatedAt',
        width: 220,
        sortable: true,
        ellipsis: false,
        render: (v: string | undefined, record: NavigationChannelResponse) => {
          const name = record.updatedBy ? userMap.get(record.updatedBy) : undefined;
          return (
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={name || record.updatedBy || ''}>
              <div style={{ fontWeight: fontWeightBold, fontSize: fontSizeMd, color: textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {name || record.updatedBy || '—'}
              </div>
              <div style={{ fontSize: fontSizeSm, color: textTertiary }}>{v ? dayjs(v).format('DD/MM/YYYY HH:mm:ss') : '—'}</div>
            </div>
          );
        },
      },
    ];
  }, [page, pageSize, seaportOptions, openModal, userMap]);

  const rowActions = useCallback(
    (record: NavigationChannelResponse) => {
      const actions: { key: string; label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean }[] = [];
      const st = record.approvalStatus || '';
      if (hasPerm('navigationchannel:read')) {
        actions.push({ key: 'view', label: 'Xem chi tiết', icon: icons.view, onClick: () => openModal('detail', record.id) });
      }
      if (canEditApprovalRecord(record.approvalStatus, { hasPerm, resource: 'navigationchannel' })) {
        actions.push({ key: 'edit', label: 'Sửa', icon: icons.edit, onClick: () => openModal('edit', record.id) });
      }
      // Quy tắc 11 (approval-2-level-spec.md mục 3.6): chỉ xóa được hồ sơ Lưu tạm.
      if (canDeleteApprovalRecord(record.approvalStatus, { hasPerm, resource: 'navigationchannel' })) {
        actions.push({ key: 'delete', label: 'Xóa', icon: icons.delete, danger: true, onClick: () => openDeleteModal(record) });
      }
      // Gửi phê duyệt: chỉ hồ sơ Lưu tạm
      if (st === 'DRAFT' && hasPerm('navigationchannel:update')) {
        actions.push({ key: 'submit', label: 'Gửi phê duyệt', icon: icons.submit, onClick: () => { setSubmittingRecord(record); setSubmitModalOpen(true); } });
      }
      // Phê duyệt / Từ chối theo cấp hiện tại
      if (hasPerm('navigationchannel:approve') && ['PENDING_APPROVAL', 'APPROVED_LEVEL1'].includes(st)) {
        actions.push({
          key: 'approve',
          label: st === 'APPROVED_LEVEL1' ? 'Cục phê duyệt' : 'Cảng vụ phê duyệt',
          icon: icons.approve,
          onClick: () => { setApprovingRecord(record); setApproveLevel(st === 'APPROVED_LEVEL1' ? 'c2' : 'c1'); setApproveModalOpen(true); },
        });
        actions.push({ key: 'reject', label: 'Từ chối', icon: icons.reject, danger: true, onClick: () => openRejectModal(record) });
      }
      if (hasPerm('navigationchannel:history')) {
        actions.push({ key: 'history', label: 'Lịch sử', icon: icons.history, onClick: () => openHistory(record) });
      }
      return actions;
    },
    [hasPerm, openModal, openDeleteModal, openRejectModal, openHistory],
  );

  // ── Filter panel (FilterTableLayout renders the sidebar) ────────────
  const filterContent = (
    <>
      <div style={{ marginBottom: spaceFormField, marginTop: 16 }}>
        <div style={{ ...filterLabelStyle, marginBottom: spaceXs }}>Đơn vị quản lý</div>
        <OrgUnitTreeSelect
          organizations={organizations}
          placeholder="Chọn đơn vị..."
          allowClear
          showSearch
          value={filterOrgUnitId}
          onChange={(v) => { setFilterOrgUnitId(v || undefined); setPage(1); }}
          style={filterInputStyle}
        />
      </div>
      <div style={{ marginBottom: spaceFormField }}>
        <div style={{ ...filterLabelStyle, marginBottom: spaceXs }}>Thuộc cảng biển</div>
        <Select
          placeholder="Chọn cảng biển..."
          allowClear
          showSearch
          optionFilterProp="label"
          value={filterSeaportId}
          onChange={(v) => { setFilterSeaportId(v); setPage(1); }}
          options={seaportOptions.map((p) => ({ value: p.id, label: p.portCode ? `${p.portCode} - ${p.portName || ''}` : p.portName || p.id }))}
          style={filterInputStyle}
        />
      </div>
      <div style={{ marginBottom: spaceFormField }}>
        <div style={{ ...filterLabelStyle, marginBottom: spaceXs }}>Tên luồng</div>
        <Input
          placeholder="Tìm theo tên luồng..."
          allowClear
          value={filterKeyword}
          onChange={(e) => { setFilterKeyword(e.target.value); setPage(1); }}
          onPressEnter={handleFilterApply}
          style={filterInputStyle}
        />
      </div>

      {filterCollapsed && (
        <>
          <div style={{ marginBottom: spaceFormField }}>
            <div style={{ ...filterLabelStyle, marginBottom: spaceXs }}>Mã luồng</div>
            <Input
              placeholder="Nhập mã luồng..."
              allowClear
              value={filterChannelCode}
              onChange={(e) => { setFilterChannelCode(e.target.value); setPage(1); }}
              onPressEnter={handleFilterApply}
              style={filterInputStyle}
            />
          </div>
          <div style={{ marginBottom: spaceFormField }}>
            <div style={{ ...filterLabelStyle, marginBottom: spaceXs }}>Địa điểm Tỉnh/TP</div>
            <Select
              placeholder="Chọn tỉnh/thành phố..."
              allowClear
              showSearch
              optionFilterProp="label"
              value={filterProvinceId}
              onChange={(v) => { setFilterProvinceId(v); setPage(1); }}
              options={VIETNAM_PROVINCE_OPTIONS}
              style={filterInputStyle}
            />
          </div>
          <div style={{ marginBottom: spaceFormField }}>
            <div style={{ ...filterLabelStyle, marginBottom: spaceXs }}>Tình trạng</div>
            <Select
              placeholder="Chọn tình trạng"
              allowClear
              value={filterConditionStatus}
              onChange={(v) => { setFilterConditionStatus(v); setPage(1); }}
              options={CONDITION_STATUS_OPTIONS}
              style={filterInputStyle}
            />
          </div>
          <div style={{ marginBottom: spaceFormField }}>
            <div style={{ ...filterLabelStyle, marginBottom: spaceXs }}>Cán bộ cập nhật</div>
            <Select
              placeholder="Chọn cán bộ cập nhật"
              allowClear
              showSearch
              value={filterUpdatedBy}
              onChange={(v) => { setFilterUpdatedBy(v || undefined); setPage(1); }}
              options={userOptions}
              style={filterInputStyle}
            />
          </div>
          <div style={{ marginBottom: spaceFormField }}>
            <div style={{ ...filterLabelStyle, marginBottom: spaceXs }}>Ngày cập nhật</div>
            <DatePicker.RangePicker
              placeholder={['Từ ngày', 'Đến ngày']}
              format="DD/MM/YYYY"
              value={filterUpdatedFrom && filterUpdatedTo ? [dayjs(filterUpdatedFrom), dayjs(filterUpdatedTo)] : null}
              onChange={(range) => {
                setFilterUpdatedFrom(range && range[0] ? range[0].format('YYYY-MM-DD') : '');
                setFilterUpdatedTo(range && range[1] ? range[1].format('YYYY-MM-DD') : '');
                setPage(1);
              }}
              style={filterInputStyle}
            />
          </div>
        </>
      )}
    </>
  );

  const statusTabs = STATUS_TAB_LIST.map((tab) => ({
    key: tab.key,
    label: tab.label,
    count: tabCounts[tab.key] ?? 0,
    color: TAB_COLOR[tab.key],
    active: activeTab === tab.key,
  }));

  const headerActions = useMemo(
    () =>
      hasPerm('navigationchannel:create')
        ? [{ key: 'create', label: 'Thêm mới', variant: 'primary' as const, icon: icons.create, onClick: () => openModal('create') }]
        : [],
    [hasPerm, openModal],
  );

  const tableData = useMemo(
    () => dataSource.map((item, idx) => ({ ...item, key: item.id, _rowIndex: (page - 1) * pageSize + idx + 1 })),
    [dataSource, page, pageSize],
  );

  // ── orgMap / seaportMap cho timeline lịch sử ────────────────────────
  const orgMap = useMemo(() => {
    const m = new Map<string, string>();
    const walk = (nodes: any[]) => {
      (nodes || []).forEach((n) => {
        if (n?.id && n?.name) m.set(n.id, n.name);
        if (n?.children?.length) walk(n.children);
      });
    };
    walk(organizations);
    return m;
  }, [organizations]);

  const seaportMap = useMemo(() => {
    const m = new Map<string, string>();
    seaportOptions.forEach((p) => { m.set(p.id, p.portCode ? `${p.portCode} - ${p.portName || ''}` : p.portName || p.id); });
    return m;
  }, [seaportOptions]);

  return (
    <ThemeTokenProvider tokens={themeTokenChk}>
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
      <ScreenHeader
        breadcrumb={[{ label: 'KCHT hàng hải' }, { label: 'Luồng hàng hải' }]}
        actions={headerActions}
      />

      <FilterTableLayout
        filterContent={filterContent}
        statusTabs={statusTabs}
        onStatusTabChange={handleTabChange}
        onFilterApply={handleFilterApply}
        onFilterReset={handleFilterReset}
        filterCollapsed={filterCollapsed}
        onToggleCollapse={() => setFilterCollapsed(!filterCollapsed)}
        loading={isLoading}
        error={isError}
        onRetry={() => void fetchData()}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
          {/* DataTable render VÔ ĐIỀU KIỆN — empty state dùng tableEmptyState của themetokenchk */}
          <DataTable
            fill
            columns={columns}
            dataSource={tableData}
            rowKey="id"
            rowActions={rowActions}
            onSort={handleSort}
            scroll={{ x: 'max-content', y: 400 }}
          />
          <div style={{ height: 55, overflow: 'visible', marginBottom: 8 }}>
            <Pagination
              total={total}
              current={page}
              pageSize={pageSize}
              pageSizeOptions={[10, 20, 50]}
              onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
            />
          </div>
        </div>
      </FilterTableLayout>

      <NavigationChannelForm
        open={isModalOpen}
        editId={editingId}
        mode={modalMode}
        onCancel={() => { setIsModalOpen(false); setEditingId(null); }}
        onSuccess={() => {
          setIsModalOpen(false);
          setEditingId(null);
          refreshAfterMutation();
        }}
      />

      {/* ── Xác nhận xóa ─────────────────────────────────────────── */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Xác nhận xóa luồng hàng hải</span>}
        open={deleteModalOpen}
        onCancel={() => { setDeleteModalOpen(false); setDeletingRecord(null); setDeleteConfirmText(''); }}
        footer={[
          <Button key="cancel" onClick={() => { setDeleteModalOpen(false); setDeletingRecord(null); setDeleteConfirmText(''); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="delete" type="primary" danger onClick={handleConfirmDelete}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Xác nhận xóa</Button>,
        ]}
        width={480}>
        <div style={{ padding: '8px 0' }}>
          <Alert message="Hành động này không thể hoàn tác" type="warning" showIcon
            style={{ marginBottom: spaceFormField, borderRadius: radiusPill }} />
          <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>
            Vui lòng nhập <strong>tên luồng hàng hải</strong> hoặc gõ <strong>"XÓA"</strong> để xác nhận xóa.
          </p>
          {deletingRecord && (
            <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>
              Luồng hàng hải: <strong style={{ color: textPrimary }}>{deletingRecord.channelName}</strong>
            </p>
          )}
          <Input placeholder="Nhập tên luồng hàng hải hoặc XÓA" value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)} onPressEnter={handleConfirmDelete}
            style={{ borderRadius: radiusPill, height: 40 }} autoFocus />
        </div>
      </Modal>

      {/* ── Gửi phê duyệt ────────────────────────────────────────── */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Gửi phê duyệt</span>}
        open={submitModalOpen}
        onCancel={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }}
        footer={[
          <Button key="cancel" onClick={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="ok" type="primary" onClick={handleConfirmSubmit}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>Xác nhận gửi</Button>,
        ]}
        width={520}>
        <div style={{ padding: '8px 0' }}>
          <Alert message="Sau khi gửi, hồ sơ sẽ chuyển sang trạng thái Chờ Cảng vụ duyệt và không thể sửa trực tiếp." type="info" showIcon
            style={{ marginBottom: spaceFormField, borderRadius: radiusPill }} />
          {submittingRecord && (
            <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: 0 }}>
              Luồng hàng hải: <strong style={{ color: textPrimary }}>{submittingRecord.channelName}</strong>
            </p>
          )}
        </div>
      </Modal>

      {/* ── Từ chối phê duyệt ────────────────────────────────────── */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Từ chối phê duyệt</span>}
        open={rejectModalOpen}
        onCancel={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); }}
        footer={[
          <Button key="cancel" onClick={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="ok" danger type="primary" onClick={handleConfirmReject}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Xác nhận từ chối</Button>,
        ]}
        width={520}>
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>
            Vui lòng nhập lý do từ chối (tối thiểu 10 ký tự).
          </p>
          <Input.TextArea
            rows={3}
            maxLength={500}
            showCount
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Nhập lý do từ chối..."
            style={{ borderRadius: radiusPill, height: 'auto' }}
          />
        </div>
      </Modal>

      {/* ── Phê duyệt (ApprovalModal chuẩn) ──────────────────────── */}
      <ApprovalModal
        visible={approveModalOpen}
        level={approveLevel}
        loading={approving}
        onConfirm={(content) => { if (approvingRecord) void handleApprove(approvingRecord, content); }}
        onCancel={() => { setApproveModalOpen(false); setApprovingRecord(null); setApproveLevel('c1'); }}
      />

      {/* ── Lịch sử thay đổi ─────────────────────────────────────── */}
      <Drawer
        {...drawerProps}
        size={880}
        mask
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Space size={spaceSm} style={{ alignItems: 'center' }}>
              {icons.history}
              <span style={drawerTitleStyle}>
                {historyTarget ? `Lịch sử thay đổi — ${historyTarget.channelName}` : 'Lịch sử thay đổi'}
              </span>
            </Space>
          </div>
        }
        onClose={() => setHistoryOpen(false)}
        extra={<Button type="text" onClick={() => setHistoryOpen(false)} style={drawerCloseBtnStyle}>✕</Button>}
        footer={null}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '12px 24px 12px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
        }}>
        <div style={{ flexShrink: 0 }}>
          {!historyLoading && (
            <div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceMd }}>
              <Input placeholder="Tìm kiếm nội dung thay đổi..." allowClear value={historySearch}
                onChange={e => setHistorySearch(e.target.value)} style={{ flex: 1, borderRadius: radiusPill, height: 40 }} />
              <DatePicker placeholder="Từ ngày" value={historyFrom ? dayjs(historyFrom) : null}
                onChange={d => setHistoryFrom(d ? d.format('YYYY-MM-DD HH:mm') : '')}
                style={{ width: 170, borderRadius: radiusPill, height: 40 }} format="DD/MM/YYYY HH:mm" showTime={{ format: 'HH:mm' }} />
              <DatePicker placeholder="Đến ngày" value={historyTo ? dayjs(historyTo) : null}
                onChange={d => setHistoryTo(d ? d.format('YYYY-MM-DD HH:mm') : '')}
                style={{ width: 170, borderRadius: radiusPill, height: 40 }} format="DD/MM/YYYY HH:mm" showTime={{ format: 'HH:mm' }} />
              <Button type="primary" icon={icons.search} onClick={() => setHistoryReloadToken((token) => token + 1)} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>Tìm kiếm</Button>
            </div>
          )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }} onScroll={handleHistoryScroll}>
          {historyLoading && visibleHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: `${spaceXl}px 0`, color: textTertiary, fontSize: fontSizeMd }}>Đang tải lịch sử...</div>
          ) : visibleHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
              {icons.history}
              <div style={{ marginTop: spaceSm, color: textTertiary, fontSize: fontSizeMd }}>{historySearch || historyFrom || historyTo ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận'}</div>
            </div>
          ) : (<>
            {renderNavigationChannelHistoryTimeline(visibleHistory)}
            {loadingMoreHistory && <div style={{ textAlign: 'center', padding: `${spaceMd}px 0`, color: textTertiary, fontSize: fontSizeMd }}>Đang tải thêm...</div>}
          </>)}
        </div>
      </Drawer>
    </div>
    </ThemeTokenProvider>
  );
}

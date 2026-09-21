import {
    HistoryOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import {
    Button,
    DatePicker,
    Form,
    Input,
    Modal,
    Radio,
    Select,
    Space,
    Tooltip,
} from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DataTable, ScreenHeader, type ScreenHeaderAction } from '../../components/list-view';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import Pagination from '../../components/list-view/Pagination';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { FilterOrgUnitTreeSelect, resolveDefaultOrgUnitId, resolveOrgLevel2Name } from '../../components/org-unit';
import AppDrawer from '../../components/shared/AppDrawer';
import ApprovalModal from '../../components/shared/ApprovalModal';
import DeleteConfirmModal from '../../components/shared/DeleteConfirmModal';
import toast from '../../components/ToastNotification';
import { ThemeTokenProvider, type ThemeToken } from '../../context/ThemeTokenContext';
import api from '../../services/api';
import type { Organization } from '../../services/organizationService';
import { organizationService } from '../../services/organizationService';
import {
    pierCRUD,
    portCRUD,
    shipRepairYardCRUD,
} from '../../services/portService';
import { symbolService } from '../../services/symbolService';
import { userService } from '../../services/userService';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import * as themeTokenChk from '../../themetokenchk';
import {
    actionPrimary,
    borderDefault,
    cellSubtitleStyle,
    cellTitleStyle,
    colors,
    DRAWER_WIDTH,
    drawerFooterStyle,
    drawerTitleStyle,
    fontSizeLg,
    fontSizeMd,
    fontWeightBold,
    formatUserDisplayName,
    getRangePickerProps,
    icons,
    isUuidString,
    outlineButtonStyle,
    primaryButtonStyle,
    radiusPill,
    requiredMarkStyle,
    spaceFormField,
    spaceMd,
    spaceSm,
    spaceXl,
    statusAttention,
    statusBadgeStyle,
    statusCritical,
    statusDraft,
    statusOperational,
    textPrimary,
    textSecondary,
    textTertiary,
} from '../../themetokenchk';
import { VIETNAM_PROVINCES } from '../../types/common';
import type { ShipRepairYard } from '../../types/port';
import { canEditApprovalRecord } from '../../utils/approvalEditPolicy';
import { countStandardHistoryCards, isBlankOrDash, renderStandardHistoryCards } from '../../utils/changeHistoryRenderer';
import ShipRepairYardDetailContent from './ShipRepairYardDetailContent';
import ShipRepairYardForm from './ShipRepairYardForm';

// ── Constants ────────────────────────────────────────────────────────

export function isShipRepairYardDeleted(record?: Partial<ShipRepairYard> | null): boolean {
  if (!record) return false;
  return Boolean(record.deletedAt || record.deletedBy || record.approvalStatus === 'DELETED' || record.approvalStatus === 'ARCHIVED');
}

const APPROVAL_STYLE_MAP: Record<string, { color: string; label: string }> = {
  DRAFT: { color: statusDraft, label: 'Lưu tạm' },
  PENDING_APPROVAL: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  APPROVED_LEVEL1: { color: statusAttention, label: 'Chờ phê duyệt cấp Cục' },
  APPROVED: { color: statusOperational, label: 'Đã phê duyệt' },
  REJECTED_LEVEL1: { color: statusCritical, label: 'Từ chối cấp Cảng vụ/Chi cục' },
  REJECTED_LEVEL2: { color: statusCritical, label: 'Từ chối cấp cục' },
  DELETED: { color: statusCritical, label: 'Đã xóa' },
  ARCHIVED: { color: statusCritical, label: 'Đã xóa' },
};

const TAB_STATUS_LIST = [
  { key: 'all', label: 'Tất cả', color: actionPrimary },
  { key: 'DRAFT', label: 'Lưu tạm', color: statusDraft },
  { key: 'PENDING_APPROVAL', label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', color: actionPrimary },
  { key: 'APPROVED_LEVEL1', label: 'Chờ phê duyệt cấp Cục', color: statusAttention },
  { key: 'APPROVED', label: 'Đã phê duyệt', color: statusOperational },
  { key: 'REJECTED_LEVEL1', label: 'Từ chối cấp Cảng vụ/Chi cục', color: statusCritical },
  { key: 'REJECTED_LEVEL2', label: 'Từ chối cấp cục', color: statusCritical },
  { key: 'DELETED', label: 'Đã xóa', color: statusCritical },
];

const TAB_QUERY_MAP: Record<string, string | undefined> = {
  all: undefined,
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED_LEVEL1: 'APPROVED_LEVEL1',
  APPROVED: 'APPROVED',
  REJECTED_LEVEL1: 'REJECTED_LEVEL1',
  REJECTED_LEVEL2: 'REJECTED_LEVEL2',
  DELETED: 'DELETED',
};

// ── Helper: format date ──────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try { return dayjs(dateStr).format('DD/MM/YYYY HH:mm:ss'); } catch { return dateStr; }
}

// ── History helpers ───────────────────────────────────────────────────

export const EXCLUDED_CHANGE_FIELDS = new Set([
  'id',
  'createdAt',
  'updatedAt',
  'createdBy',
  'updatedBy',
  'attachments',
  'spatialId',
  'Vị trí không gian',
  'infrastructureList_raw',
  'approvalStatus',
  'approverLevel1',
  'approvedDateLevel1',
  'approverLevel2',
  'approvedDateLevel2',
  'rejectionReason',
  'Lý do từ chối',
  'ly do tu choi',
  'Trạng thái phê duyệt',
  'trang thai phe duyet',
  'Trạng thái',
  'trạng thái',
  'activityStatus',
  'deletedAt',
  'deletedBy',
  'submittedDate',
  'submittedAt',
  'submittedBy',
  'submittedForApprovalAt',
  'submittedForApprovalBy',
  'Thời điểm gửi phê duyệt',
  'Người gửi phê duyệt',
  'ngày gửi phê duyệt',
  'người gửi phê duyệt',
  'approvalContentLevel1',
  'approvalContentLevel2',
  'level1ApprovalContent',
  'level2ApprovalContent',
  'approvalContent',
  'nội dung phê duyệt',
  'cấp 1 phê duyệt',
  'cấp 2 phê duyệt',
  'portAuthorityApprovedBy',
  'portAuthorityApprovedAt',
  'portAuthorityApprovalContent',
  'departmentApprovedBy',
  'departmentApprovedAt',
  'departmentApprovalContent',
  'Thời điểm Cảng vụ phê duyệt',
  'Thời điểm Cục phê duyệt',
  'Nội dung Cảng vụ phê duyệt',
  'Nội dung Cục phê duyệt',
  'Cán bộ Cảng vụ phê duyệt',
  'Cán bộ Cục phê duyệt',
  'approvedBy',
  'approvedAt',
  'approvedRemarks',
]);

export const NUMERIC_HISTORY_FIELDS = new Set([
  'workshopArea',
  'slipwayCount',
  'provinceId',
  'Diện tích nhà xưởng, kho bãi',
  'Diện tích nhà xưởng, kho bãi (m2)',
  'Số lượng triền đà',
  'Số triền đà',
]);

export const historyFieldLabels: Record<string, string> = {
  securityLevel: 'Cấp bảo mật',
  shipRepairYardCode: 'Mã cơ sở sửa chữa, đóng tàu',
  shipRepairYardName: 'Tên cơ sở sửa chữa, đóng tàu',
  portId: 'Thuộc cảng biển',
  pierId: 'Thuộc cầu cảng',
  provinceId: 'Địa điểm (Tỉnh/Thành Phố)',
  province: 'Địa điểm (Tỉnh/Thành Phố)',
  detailedLocation: 'Địa điểm chi tiết',
  operationalStatus: 'Tình trạng hoạt động',
  usageFunction: 'Công năng sử dụng',
  workshopArea: 'Diện tích nhà xưởng, kho bãi (m2)',
  vesselType: 'Loại tàu đóng mới, sửa chữa',
  vesselDwt: 'Cỡ tàu (DWT)',
  businessType: 'Loại hình doanh nghiệp',
  activity: 'Hoạt động',
  slipwayCount: 'Số lượng triền đà',
  remarks: 'Ghi chú',
  orgUnitId: 'Đơn vị quản lý',
  mapSymbolId: 'Biểu tượng',
  approvalStatus: 'Trạng thái',
  geometryType: 'Loại đối tượng',
  coordinateSystem: 'Hệ quy chiếu',
  displayRule: 'Quy tắc hiển thị',
  spatialId: 'Vị trí không gian',
  'Trạng thái': 'Trạng thái',
  'Tọa độ GIS': 'Tọa độ GPS',
  'Tọa độ GPS': 'Tọa độ GPS',
  'Loại đối tượng GIS': 'Loại đối tượng',
  'Loại đối tượng': 'Loại đối tượng',
  'Tài liệu đính kèm': 'File đính kèm',
  'File đính kèm': 'File đính kèm',
  attachments: 'File đính kèm',
  // Backward compatibility: map legacy field labels
  'Cảng biển': 'Thuộc cảng biển',
  'Cầu cảng': 'Thuộc cầu cảng',
  'Tỉnh/Thành phố': 'Địa điểm (Tỉnh/Thành Phố)',
  'Biểu tượng bản đồ': 'Biểu tượng',
};

export function historyFieldName(fn: string): string { return historyFieldLabels[fn] || fn; }

export function historyFieldValue(
  fn: string,
  val: string | null,
  orgMap?: Map<string, string>,
  symbolMap?: Map<string, string>,
  portMap?: Map<string, string>,
  pierMap?: Map<string, string>
): string {
  if (!val || val === '(null)' || val === 'null' || val === '-' || val === '—' || val === '–') return '';
  const v = val.trim();
  if ((fn === 'orgUnitId' || fn === 'Đơn vị quản lý') && orgMap) { const full = orgMap.get(v); return full ? full.split(' - ').pop() || full : v; }
  if ((fn === 'mapSymbolId' || fn === 'Biểu tượng' || fn === 'Biểu tượng bản đồ') && symbolMap) return symbolMap.get(v) || v;
  if ((fn === 'portId' || fn === 'Thuộc cảng biển' || fn === 'Cảng biển') && portMap) return portMap.get(v) || v;
  if ((fn === 'pierId' || fn === 'Thuộc cầu cảng' || fn === 'Cầu cảng') && pierMap) return pierMap.get(v) || v;
  if (fn === 'approvalStatus' || fn === 'Trạng thái' || fn === 'Trạng thái phê duyệt') {
    const m: Record<string, string> = {
      DRAFT: 'Lưu tạm',
      PENDING_APPROVAL: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
      APPROVED_LEVEL1: 'Chờ phê duyệt cấp Cục',
      APPROVED: 'Đã phê duyệt',
      REJECTED_LEVEL1: 'Từ chối cấp Cảng vụ/Chi cục',
      REJECTED_LEVEL2: 'Từ chối cấp Cục',
      ARCHIVED: 'Đã xóa',
    };
    return m[v.toUpperCase()] || v;
  }
  if (fn === 'operationalStatus' || fn === 'Tình trạng' || fn === 'Tình trạng hoạt động') {
    const m: Record<string, string> = {
      OPERATIONAL: 'Đang khai thác/vận hành',
      NOT_YET_OPERATIONAL: 'Chưa khai thác/vận hành',
      SUSPENDED: 'Dừng khai thác/vận hành',
      DANG_KHAI_THAC: 'Đang khai thác/vận hành',
      CHUA_KHAI_THAC: 'Chưa khai thác/vận hành',
      DUNG_KHAI_THAC: 'Dừng khai thác/vận hành',
    };
    return m[v.toUpperCase()] || v;
  }
  if (fn === 'provinceId' || fn === 'province' || fn === 'Địa điểm (Tỉnh/Thành Phố)' || fn === 'Tỉnh/Thành phố') {
    const num = Number(v);
    if (!isNaN(num) && num >= 1 && num <= VIETNAM_PROVINCES.length) {
      return VIETNAM_PROVINCES[num - 1];
    }
    return v;
  }
  if (fn === 'geometryType' || fn === 'Loại đối tượng' || fn === 'Loại đối tượng GIS') {
    const m: Record<string, string> = { POINT: 'Điểm', LINE: 'Đường', POLYGON: 'Vùng' };
    return m[v.toUpperCase()] || v;
  }
  if (fn === 'coordinateSystem' || fn === 'Hệ quy chiếu') {
    const m: Record<string, string> = { '1': 'WGS-84', '2': 'VN-2000' };
    return m[v] || v;
  }
  if (fn.endsWith('At') || fn.endsWith('Date') || fn.includes('Thời điểm') || fn.includes('Ngày')) {
    try {
      let d = dayjs(v);
      if (!d.isValid()) { d = dayjs(v.replace(/\.\d+$/, '')); }
      return d.isValid() ? d.format('DD/MM/YYYY HH:mm') : v;
    } catch { return v; }
  }
  return v;
}

export const HISTORY_FIELD_ORDER = [
  'orgUnitId', 'portId', 'pierId', 'shipRepairYardCode', 'shipRepairYardName',
  'provinceId', 'province', 'detailedLocation', 'operationalStatus', 'approvalStatus',
  'usageFunction', 'workshopArea', 'vesselType', 'vesselDwt', 'businessType', 'activity', 'slipwayCount',
  'remarks', 'geometryType', 'mapSymbolId', 'coordinateSystem', 'displayRule',
  'Tọa độ GPS', 'Tọa độ GIS', 'Loại đối tượng', 'Loại đối tượng GIS', 'Tài liệu đính kèm',
  // Vietnamese label aliases:
  'Đơn vị quản lý', 'Thuộc cảng biển', 'Cảng biển', 'Thuộc cầu cảng', 'Cầu cảng',
  'Mã cơ sở sửa chữa, đóng tàu', 'Tên cơ sở sửa chữa, đóng tàu', 'Địa điểm (Tỉnh/Thành Phố)', 'Tỉnh/Thành phố',
  'Tình trạng hoạt động', 'Tình trạng', 'Trạng thái',
  'Công năng sử dụng', 'Diện tích nhà xưởng, kho bãi', 'Diện tích nhà xưởng, kho bãi (m2)',
  'Loại tàu đóng mới, sửa chữa', 'Cỡ tàu', 'Cỡ tàu (DWT)', 'Loại hình doanh nghiệp', 'Hoạt động',
  'Số lượng triền đà', 'Số triền đà', 'Ghi chú', 'Biểu tượng', 'Biểu tượng bản đồ', 'Hệ quy chiếu', 'Quy tắc hiển thị',
];

// ── Component ────────────────────────────────────────────────────────

export default function ShipRepairYardList() {
  const hasPerm = usePermissionStore((s: any) => s.hasPermission);
  const authUser = useAuthStore((s) => s.user);
  // ── Filter state ─────────────────────────────────────────────────
  const [managingUnitId, setManagingUnitId] = useState<string | undefined>();
  const defaultOrgUnitId = useRef<string | undefined>(undefined);
  const defaultOrgApplied = useRef(false);
  const [orgUnitReady, setOrgUnitReady] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [filterPortId, setFilterPortId] = useState<string | undefined>();
  const [filterPierId, setFilterPierId] = useState<string | undefined>();
  const [filterProvince, setFilterProvince] = useState('');
  const [filterOperationalStatus, setFilterOperationalStatus] = useState<string | undefined>();
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState<string | undefined>();
  const [filterUpdatedTo, setFilterUpdatedTo] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState('all');
  const [filterCollapsed, setFilterCollapsed] = useState(false);

  // ── Pagination ──────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // ── Data ─────────────────────────────────────────────────────────
  const [dataSource, setDataSource] = useState<ShipRepairYard[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [sortField, setSortField] = useState<string | null>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend' | null>('descend');


  // ── Organizations + Users for lookup ────────────────────────────
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
  const [symbolMap, setSymbolMap] = useState<Map<string, string>>(new Map());
  const [symbolImageMap, setSymbolImageMap] = useState<Map<string, string>>(new Map());

  const orgMap = useMemo(() => {
    const map = new Map<string, string>();
    organizations.forEach((o) => {
      map.set(o.id, o.name);
    });
    return map;
  }, [organizations]);

  // ── Port options ─────────────────────────────────────────────────
  const [portOptions, setPortOptions] = useState<{ value: string; label: string }[]>([]);
  const portMap = useMemo(() => {
    const map = new Map<string, string>();
    portOptions.forEach((o) => {
      map.set(o.value, o.label);
    });
    return map;
  }, [portOptions]);

  // ── Pier options (Thuộc cầu cảng) ──
  const [pierOptions, setPierOptions] = useState<Array<{ value: string; label: string }>>([]);
  const pierMap = useMemo(() => {
    const map = new Map<string, string>();
    pierOptions.forEach((o) => { map.set(o.value, o.label); });
    return map;
  }, [pierOptions]);

  // ── Tab counts ──────────────────────────────────────────────────
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  // ── Drawer state ────────────────────────────────────────────────
  const [createDrawerVisible, setCreateDrawerVisible] = useState(false);
  const [editShipRepairYardId, setEditShipRepairYardId] = useState<string | undefined>();
  const [editShipRepairYardName, setEditShipRepairYardName] = useState('');
  const [editBaseStatus, setEditBaseStatus] = useState<string | undefined>();
  const [createForm] = Form.useForm();
  const shipRepairYardFormRef = useRef<any>(null);
  // ── Submit loading — nút được bấm mới hiện loading tròn (tham chiếu màn Cảng biển) ──
  const [submitting, setSubmitting] = useState(false);
  const [actionType, setActionType] = useState<'draft' | 'submit' | 'approve' | 'update'>('submit');
  const actionTypeRef = useRef<'draft' | 'submit' | 'approve' | 'update'>('submit');
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [detailRecord, setDetailRecord] = useState<ShipRepairYard | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailFiles, setDetailFiles] = useState<any[]>([]);

  // ── Delete confirmation modal ───────────────────────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<ShipRepairYard | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Reject modal ────────────────────────────────────────────────
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRecord, setRejectingRecord] = useState<ShipRepairYard | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // ── Submit/Approve modal ────────────────────────────────────────
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submittingRecord, setSubmittingRecord] = useState<ShipRepairYard | null>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvingRecord, setApprovingRecord] = useState<ShipRepairYard | null>(null);

  // ── History modal ───────────────────────────────────────────────
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<ShipRepairYard | null>(null);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearchInput, setHistorySearchInput] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');
  const [historyMode, setHistoryMode] = useState<'current' | 'all'>('current');
  const [historyEntityNames, setHistoryEntityNames] = useState<Record<string, string>>({});
  const [historyEntityFilter, setHistoryEntityFilter] = useState('');

  const filteredHistory = useMemo(() => {
    const q = historySearch.toLowerCase().trim();
    const from = historyFrom ? historyFrom.trim() : '';
    const to = historyTo ? historyTo.trim() : '';

    return (historyRecords || []).filter((r: any) => {
      const fn = String(r?.fieldName || r?.changedField || '').trim();
      if (EXCLUDED_CHANGE_FIELDS.has(fn)) return false;
      if (r?.previousValue != null && r?.newValue != null) {
        if (r.previousValue === r.newValue) return false;
        if (NUMERIC_HISTORY_FIELDS.has(fn)) {
          const oldN = Number(r.previousValue);
          const newN = Number(r.newValue);
          if (!isNaN(oldN) && !isNaN(newN) && oldN === newN) return false;
        }
      }
      if (q) {
        const rawOld = (r.oldValue ?? r.previousValue ?? '').toLowerCase();
        const rawNew = (r.newValue || '').toLowerCase();
        const label = historyFieldName(fn).toLowerCase();
        const resolvedOld = historyFieldValue(fn, r.oldValue ?? r.previousValue ?? null, orgMap, symbolMap, portMap, pierMap).toLowerCase();
        const resolvedNew = historyFieldValue(fn, r.newValue, orgMap, symbolMap, portMap, pierMap).toLowerCase();
        if (!fn.toLowerCase().includes(q) && !rawOld.includes(q) && !rawNew.includes(q) && !label.includes(q) && !resolvedOld.includes(q) && !resolvedNew.includes(q)) return false;
      }
      if (historyEntityFilter && r.entityId !== historyEntityFilter) return false;
      if (from || to) {
        const ts = String(r?.changedAt ?? r?.createdAt ?? r?.approvedDate ?? '');
        if (from && ts.substring(0, 10) < from) return false;
        if (to && ts.substring(0, 10) > to) return false;
      }
      return true;
    });
  }, [historyRecords, historySearch, historyEntityFilter, historyFrom, historyTo, orgMap, symbolMap, portMap, pierMap]);

  const historyUpdateCount = useMemo(() => {
    return countStandardHistoryCards({
      records: filteredHistory,
      fieldLabels: historyFieldLabels,
      groupOrder: HISTORY_FIELD_ORDER,
      formatValue: (fn, raw) => {
        if (fn === 'mapSymbolId' && raw && !isBlankOrDash(raw)) {
          const img = symbolImageMap.get(raw);
          const name = symbolMap.get(raw) || raw;
          return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {img ? <img src={img} alt="" style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 4 }} /> : null}
              {name}
            </span>
          );
        }
        const formatted = historyFieldValue(fn, raw, orgMap, symbolMap, portMap, pierMap);
        return isBlankOrDash(formatted) ? '' : formatted;
      },
      resolveUnitName: (rec) => {
        const orgId = rec.orgUnitId || historyTarget?.orgUnitId;
        const orgName = orgId ? orgMap.get(orgId) : undefined;
        return (orgName ? (orgName.split(' - ').pop() || orgName) : (rec.orgUnitName || rec.unitName)) || '';
      },
    });
  }, [filteredHistory, orgMap, symbolMap, portMap, pierMap, historyTarget, symbolImageMap]);

  const openHistory = useCallback(async (r: ShipRepairYard) => {
    setHistoryTarget(r); setHistoryOpen(true); setHistoryRecords([]);
    setHistorySearchInput(''); setHistorySearch(''); setHistoryFrom(''); setHistoryTo('');
    setHistoryMode('current');
    if (r.approvalStatus === 'DRAFT' || (r as any).status === 'DRAFT') {
      setHistoryLoading(false);
      return;
    }
    setHistoryLoading(true);
    try {
      const res = await api.get(`/v1/ship-repair-yard/${r.id}/history`);
      const d = res.data?.data;
      const ch = Array.isArray(d?.changeHistory)
        ? d.changeHistory.filter((it: any) => it.fieldName !== 'CREATE' && it.changedField !== 'CREATE')
        : [];
      setHistoryRecords(ch);
    } catch { toast.error('Không thể tải lịch sử'); }
    finally { setHistoryLoading(false); }
  }, []);

  const renderShipRepairYardHistoryTimeline = (_records: any[]) => {
    const q = historySearch.toLowerCase().trim();
    const from = historyFrom ? historyFrom.trim() : '';
    const to = historyTo ? historyTo.trim() : '';

    return renderStandardHistoryCards({
      records: filteredHistory,
      fieldLabels: historyFieldLabels,
      groupOrder: HISTORY_FIELD_ORDER,
      formatValue: (fn, raw) => {
        if (fn === 'mapSymbolId' && raw && !isBlankOrDash(raw)) {
          const img = symbolImageMap.get(raw);
          const name = symbolMap.get(raw) || raw;
          return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {img ? <img src={img} alt="" style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 4 }} /> : null}
              {name}
            </span>
          );
        }
        const formatted = historyFieldValue(fn, raw, orgMap, symbolMap, portMap, pierMap);
        return isBlankOrDash(formatted) ? '' : formatted;
      },
      resolveUnitName: (rec) => {
        const orgId = rec.orgUnitId || historyTarget?.orgUnitId;
        const orgName = orgId ? orgMap.get(orgId) : undefined;
        return (orgName ? (orgName.split(' - ').pop() || orgName) : (rec.orgUnitName || rec.unitName)) || '';
      },
      emptyMessage: q || from || to ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận',
    });
  };

  // ── Load organizations ──────────────────────────────────────────
  useEffect(() => {
    const isIframe = window.self !== window.top;
    const parentOrgUnits = isIframe ? (window.parent as any)?.kchtOrgUnits : undefined;
    const currentUser = authUser || useAuthStore.getState().user;
    if (parentOrgUnits && parentOrgUnits.length > 0) {
      setOrganizations(parentOrgUnits);
      if (!defaultOrgApplied.current) {
        defaultOrgApplied.current = true;
        let resolvedDefault = resolveDefaultOrgUnitId(currentUser, parentOrgUnits);
        if (!resolvedDefault && !currentUser?.orgUnitId) {
          api.get('/users/me')
            .then((profileRes) => {
              const profile = (profileRes as any)?.data?.data ?? (profileRes as any)?.data;
              if (profile?.orgUnitId) {
                const asyncResolved = resolveDefaultOrgUnitId(profile, parentOrgUnits) || profile.orgUnitId;
                defaultOrgUnitId.current = asyncResolved;
                setManagingUnitId(asyncResolved);
              }
            })
            .catch(() => {});
        }
        defaultOrgUnitId.current = resolvedDefault;
        setManagingUnitId(resolvedDefault);
      }
      setOrgUnitReady(true);
    } else {
      (async () => {
        try {
          const resp = await organizationService.list({ pageSize: 1000 });
          const data = resp.data || [];
          setOrganizations(data);
          if (!defaultOrgApplied.current) {
            defaultOrgApplied.current = true;
            let resolvedDefault = resolveDefaultOrgUnitId(currentUser, data);
            if (!resolvedDefault && !currentUser?.orgUnitId) {
              try {
                const profileRes = await api.get('/users/me');
                const profile = (profileRes as any)?.data?.data ?? (profileRes as any)?.data;
                if (profile?.orgUnitId) {
                  resolvedDefault = resolveDefaultOrgUnitId(profile, data) || profile.orgUnitId;
                }
              } catch {
                // ignore
              }
            }
            defaultOrgUnitId.current = resolvedDefault;
            setManagingUnitId(resolvedDefault);
          }
          setOrgUnitReady(true);
        } catch (err) {
          console.error('Failed to load organizations', err);
          setOrgUnitReady(true);
        }
      })();
    }
    (async () => {
      try {
        const resp = await userService.list({ pageSize: 1000 });
        const users = resp.data || (resp as any).content || [];
        const map = new Map<string, string>();
        users.forEach((u: any) => {
          const name = u.fullName || u.username || '';
          if (name && !isUuidString(name)) map.set(u.id, name);
        });
        setUserMap(map);
      } catch { console.error('Failed to load users'); }
    })();
    (async () => {
      try {
        const resp = await symbolService.list({ page: 1, pageSize: 1000, status: 'active' });
        const symbols = resp.data || (resp as any).content || [];
        const map = new Map<string, string>();
        const imgMap = new Map<string, string>();
        symbols.forEach((s: any) => { map.set(s.id, s.name); if (s.image) imgMap.set(s.id, s.image); });
        setSymbolMap(map);
        setSymbolImageMap(imgMap);
      } catch { console.error('Failed to load symbols'); }
    })();
  }, [authUser]);

  // ── Load port options ──────────────────────────────────────────
  useEffect(() => {
    if (!orgUnitReady) return;
    (async () => {
      try {
        const params: any = { page: 1, pageSize: 1000 };
        if (managingUnitId && managingUnitId !== '__all__') params.orgUnitId = managingUnitId;
        const res = await portCRUD.search(params);
        setPortOptions((res.data || []).map((p: any) => ({ value: p.id, label: p.portName })));
      } catch { /* ignore */ }
    })();
  }, [managingUnitId, orgUnitReady]);

  // ── Load pier options (Thuộc cầu cảng) ─────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const params: any = { page: 1, pageSize: 1000 };
        if (filterPortId) params.portId = filterPortId;
        const res = await pierCRUD.search(params);
        setPierOptions((res.data || []).map((p: any) => ({ value: p.id, label: p.pierName })));
      } catch { /* ignore */ }
    })();
  }, [filterPortId]);

  // ── Fetch tab counts ────────────────────────────────────────────
  const fetchCounts = useCallback(async (orgIdOverride?: string) => {
    try {
      const targetOrg = orgIdOverride !== undefined ? orgIdOverride : managingUnitId;
      const orgParam = targetOrg && targetOrg !== '__all__' ? targetOrg : undefined;
      const baseFilterParams = {
        orgUnitId: orgParam,
        shipRepairYardName: filterName.trim() || undefined,
        shipRepairYardCode: filterCode.trim() || undefined,
        portId: filterPortId,
        pierId: filterPierId,
        provinceId: filterProvince ? (VIETNAM_PROVINCES.indexOf(filterProvince) + 1) : undefined,
        operationalStatus: filterOperationalStatus,
        updatedFrom: filterUpdatedFrom,
        updatedTo: filterUpdatedTo,
      };

      const results = await Promise.allSettled(
        TAB_STATUS_LIST.map((tab) =>
          shipRepairYardCRUD.search({
            ...baseFilterParams,
            approvalStatus: TAB_QUERY_MAP[tab.key],
            page: 1,
            pageSize: 1,
          }),
        ),
      );
      const counts: Record<string, number> = {};
      results.forEach((result, idx) => {
        const tabKey = TAB_STATUS_LIST[idx]?.key || 'all';
        counts[tabKey] = result.status === 'fulfilled' ? result.value.total : 0;
      });
      const allChildSum = TAB_STATUS_LIST
        .filter((t) => t.key !== 'all' && t.key !== 'DELETED')
        .reduce((acc, t) => acc + (counts[t.key] || 0), 0);
      counts['all'] = allChildSum;
      setTabCounts(counts);
    } catch { /* silent */ }
  }, [managingUnitId, filterName, filterCode, filterPortId, filterPierId, filterProvince, filterOperationalStatus, filterUpdatedFrom, filterUpdatedTo]);

  // ── Fetch main data ─────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true); setIsError(false);
    try {
      const res = await shipRepairYardCRUD.search({
        orgUnitId: (managingUnitId && managingUnitId !== '__all__') ? managingUnitId : undefined,
        shipRepairYardName: filterName.trim() || undefined,
        shipRepairYardCode: filterCode.trim() || undefined,
        portId: filterPortId,
        pierId: filterPierId,
        provinceId: filterProvince ? (VIETNAM_PROVINCES.indexOf(filterProvince) + 1) : undefined,
        operationalStatus: filterOperationalStatus,
        approvalStatus: TAB_QUERY_MAP[activeTab],
        updatedFrom: filterUpdatedFrom,
        updatedTo: filterUpdatedTo,
        page,
        pageSize,
        sortBy: (sortField && sortField !== 'stt' && sortField !== 'sequenceNo') ? sortField : 'updatedAt',
        sortDir: sortOrder === 'ascend' ? 'ASC' : (sortOrder === 'descend' ? 'DESC' : (sortField ? 'DESC' : undefined)),
      });
      setDataSource(res.data); setTotal(res.total);
    } catch {
      setIsError(true);
    } finally { setIsLoading(false); }
  }, [managingUnitId, filterName, filterCode, filterPortId, filterPierId,
    filterProvince, filterOperationalStatus,
    filterUpdatedFrom, filterUpdatedTo, activeTab, page, pageSize, sortField, sortOrder]);

  useEffect(() => { if (orgUnitReady) void fetchData(); }, [fetchData, orgUnitReady]);
  useEffect(() => { if (orgUnitReady) void fetchCounts(managingUnitId); }, [managingUnitId, fetchCounts, orgUnitReady]);

  // ── Filter handlers ─────────────────────────────────────────────
  const handleFilterApply = useCallback(() => {
    setPage(1);
    void fetchData();
    void fetchCounts(managingUnitId);
  }, [fetchData, fetchCounts, managingUnitId]);

  const handleFilterReset = useCallback(() => {
    const defaultOrg = defaultOrgUnitId.current;
    const resetOrg = defaultOrg === '__all__' ? undefined : defaultOrg;
    setManagingUnitId(resetOrg);
    setFilterName(''); setFilterCode(''); setFilterPortId(undefined);
    setFilterPierId(undefined);
    setFilterProvince('');
    setFilterOperationalStatus(undefined);
    setFilterUpdatedFrom(undefined); setFilterUpdatedTo(undefined);
    setActiveTab('all'); setPage(1);
    void fetchCounts(resetOrg);
  }, [fetchCounts]);

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key); setPage(1);
  }, []);

  // ── Detail drawer ────────────────────────────────────────────────
  const openDetailDrawer = useCallback(async (record: ShipRepairYard) => {
    setDetailDrawerVisible(true); setDetailRecord(record); setDetailFiles([]); setDetailLoading(true);
    try {
      const res = await api.get(`/v1/ship-repair-yard/${record.id}/attachments`, { params: { page: 0, size: 50 } });
      setDetailFiles(res.data?.data || []);
    } catch { setDetailFiles([]); }
    try {
      const fresh = await shipRepairYardCRUD.findById(record.id);
      setDetailRecord(fresh);
    } catch { /* keep initial data */ }
    finally { setDetailLoading(false); }
  }, []);

  // ── Delete confirmation ─────────────────────────────────────────
  const openDeleteModal = useCallback((record: ShipRepairYard) => {
    setDeletingRecord(record);
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingRecord) return;
    setDeleteLoading(true);
    try {
      await shipRepairYardCRUD.delete(deletingRecord.id);
      toast.success('Đã xóa cơ sở sửa chữa, đóng tàu');
      setDeleteModalOpen(false);
      setDeletingRecord(null);
      setSortField('updatedAt');
      setSortOrder('descend');
      setPage(1);
      void fetchData();
      void fetchCounts(managingUnitId);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingRecord, fetchData, fetchCounts, managingUnitId]);

  // ── Approval handlers ───────────────────────────────────────────
  const handleApprove = useCallback(async (record: ShipRepairYard, content?: string) => {
    try {
      const isC2 = record.approvalStatus === 'APPROVED_LEVEL1' || record.approvalStatus === 'APPROVED_LEVEL2';
      if (isC2) {
        await shipRepairYardCRUD.approveC2(record.id, content || 'Đã phê duyệt');
      } else {
        await shipRepairYardCRUD.approveC1(record.id, content || 'Đã phê duyệt');
      }
      toast.success('Đã phê duyệt cơ sở sửa chữa, đóng tàu');
      setApproveModalOpen(false); setApprovingRecord(null);
      setSortField('updatedAt');
      setSortOrder('descend');
      setPage(1);
      void fetchData(); void fetchCounts(managingUnitId);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại'); }
  }, [fetchData, fetchCounts, managingUnitId]);

  const handleConfirmSubmit = useCallback(async () => {
    if (!submittingRecord) return;
    try {
      await shipRepairYardCRUD.submit(submittingRecord.id);
      toast.success('Đã gửi phê duyệt cơ sở sửa chữa, đóng tàu');
      setSubmitModalOpen(false); setSubmittingRecord(null);
      setSortField('updatedAt');
      setSortOrder('descend');
      setPage(1);
      void fetchData(); void fetchCounts(managingUnitId);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Gửi phê duyệt thất bại'); }
  }, [submittingRecord, fetchData, fetchCounts, managingUnitId]);

  const openRejectModal = useCallback((record: ShipRepairYard) => {
    setRejectingRecord(record); setRejectReason(''); setRejectModalOpen(true);
  }, []);

  const handleConfirmReject = useCallback(async () => {
    if (!rejectingRecord) return;
    const reason = rejectReason.trim();
    if (!reason) { toast.error('Vui lòng nhập lý do từ chối'); return; }
    if (reason.length < 10) { toast.error('Lý do từ chối tối thiểu 10 ký tự'); return; }
    if (reason.length > 500) { toast.error('Lý do từ chối tối đa 500 ký tự'); return; }
    try {
      const isC2 = rejectingRecord.approvalStatus === 'APPROVED_LEVEL1' || rejectingRecord.approvalStatus === 'APPROVED_LEVEL2';
      if (isC2) {
        await shipRepairYardCRUD.rejectC2(rejectingRecord.id, reason);
      } else {
        await shipRepairYardCRUD.rejectC1(rejectingRecord.id, reason);
      }
      toast.success('Đã từ chối phê duyệt');
      setRejectModalOpen(false); setRejectingRecord(null); setRejectReason('');
      setSortField('updatedAt');
      setSortOrder('descend');
      setPage(1);
      void fetchData(); void fetchCounts(managingUnitId);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Từ chối thất bại'); }
  }, [rejectingRecord, rejectReason, fetchData, fetchCounts, managingUnitId]);

  // ── Header actions ──────────────────────────────────────────────
  const headerActions = useMemo(() => {
    const actions: ScreenHeaderAction[] = [];
    if (hasPerm('shiprepairyard:create')) {
      actions.push({
        key: 'create',
        label: 'Thêm mới',
        variant: 'primary',
        icon: icons.create,
        onClick: () => {
          setEditShipRepairYardId(undefined);
          setEditShipRepairYardName('');
          setEditBaseStatus(undefined);
          createForm.resetFields();
          // Mặc định đơn vị quản lý theo tài khoản của người dùng đang tạo bản ghi mới (chuẩn /beacon-stations)
          const currentUser = authUser || useAuthStore.getState().user;
          const currentOrgUnitId = resolveDefaultOrgUnitId(currentUser, organizations)
            || (currentUser?.orgUnitId && currentUser.orgUnitId !== '00000000-0000-0000-0000-000000000017' && currentUser.orgUnitId !== 'G17' ? currentUser.orgUnitId : undefined);
          createForm.setFieldsValue({
            orgUnitId: currentOrgUnitId,
          });
          if (!currentOrgUnitId && !currentUser?.orgUnitId) {
            api.get('/users/me').then((r) => {
              const p = r.data?.data ?? r.data;
              const uOrgId = p?.orgUnitId;
              if (uOrgId && uOrgId !== '00000000-0000-0000-0000-000000000017' && uOrgId !== 'G17') {
                createForm.setFieldsValue({ orgUnitId: uOrgId });
              }
            }).catch(() => {});
          }
          setCreateDrawerVisible(true);
        },
      });
    }
    return actions;
  }, [hasPerm, createForm, authUser, organizations]);

  // ── Filter panel content ────────────────────────────────────────
  const filterContent = (
    <>
      <style>{`.ship-repair-yard-filter .ant-select-selector { border-radius: 999px !important; } .ship-repair-yard-filter .ant-select-content { flex-wrap: nowrap !important; overflow: hidden; } .ship-repair-yard-filter .ant-select-content-item { max-width: 45% !important; } .ship-repair-yard-filter .ant-select-selection-item { border-radius: 999px !important; }`}</style>
      {/* ── Cơ bản: ĐVQL + Tên + Tình trạng ──────────────────── */}
      <div style={{ marginBottom: 12, marginTop: spaceMd }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
          Đơn vị quản lý
        </div>
        <FilterOrgUnitTreeSelect
          organizations={organizations}
          placeholder="Tất cả"
          allowClear
          value={managingUnitId}
          onChange={(v) => { setManagingUnitId(v); setFilterPortId(undefined); setFilterPierId(undefined); setPage(1); }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tên cơ sở sửa chữa, đóng tàu</div>
        <Input
          placeholder="Tìm theo tên cơ sở sửa chữa, đóng tàu"
          allowClear
          prefix={<SearchOutlined style={{ color: textTertiary }} />}
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          onPressEnter={handleFilterApply}
          style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tình trạng</div>
        <Select
          placeholder="Chọn tình trạng"
          allowClear
          value={filterOperationalStatus}
          onChange={(v) => { setFilterOperationalStatus(v); setPage(1); }}
          options={[
            { value: 'OPERATIONAL', label: 'Đang khai thác/vận hành' },
            { value: 'NOT_YET_OPERATIONAL', label: 'Chưa khai thác/vận hành' },
            { value: 'SUSPENDED', label: 'Dừng khai thác/vận hành' },
          ]}
          style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
        />
      </div>

      {/* ── Bộ lọc nâng cao: hiển thị khi filterCollapsed (chuẩn BuoyBerthListPage/AnchorageListPage) ───────── */}
      {filterCollapsed && (
        <>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Mã cơ sở sửa chữa, đóng tàu</div>
            <Input
              placeholder="Tìm theo mã cơ sở sửa chữa, đóng tàu"
              allowClear
              prefix={<SearchOutlined style={{ color: textTertiary }} />}
              value={filterCode}
              onChange={(e) => setFilterCode(e.target.value)}
              onPressEnter={handleFilterApply}
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Thuộc cảng biển</div>
            <Select
              placeholder="Chọn cảng biển"
              allowClear
              showSearch
              optionFilterProp="label"
              value={filterPortId}
              onChange={(v) => { setFilterPortId(v); setFilterPierId(undefined); setPage(1); }}
              options={portOptions}
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Thuộc cầu cảng</div>
            <Select
              placeholder="Chọn cầu cảng"
              allowClear
              showSearch
              optionFilterProp="label"
              value={filterPierId}
              onChange={(v) => { setFilterPierId(v); setPage(1); }}
              options={pierOptions}
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Địa điểm (Tỉnh/Thành phố)</div>
            <Select
              placeholder="Chọn tỉnh/thành phố"
              allowClear
              showSearch
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              value={filterProvince || undefined}
              onChange={(v) => { setFilterProvince(v || ''); setPage(1); }}
              options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))}
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Ngày cập nhật</div>
            <DatePicker.RangePicker
              format="DD/MM/YYYY"
              placeholder={['Từ ngày', 'Đến ngày']}
              allowClear
              popupClassName="chk-range-datepicker-popup"
              classNames={{ popup: { root: 'chk-range-datepicker-popup' } }}
              value={[filterUpdatedFrom ? dayjs(filterUpdatedFrom) : null, filterUpdatedTo ? dayjs(filterUpdatedTo) : null]}
              onChange={(dates) => {
                setFilterUpdatedFrom(dates?.[0] ? dates[0].format('YYYY-MM-DD 00:00:00') : undefined);
                setFilterUpdatedTo(dates?.[1] ? dates[1].format('YYYY-MM-DD 23:59:59') : undefined);
                setPage(1);
              }}
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
            />
          </div>
        </>
      )}
    </>
  );

  // ── Status tabs config ──────────────────────────────────────────
  const statusTabs = useMemo(() => {
    const allChildSum = TAB_STATUS_LIST
      .filter((t) => t.key !== 'all' && t.key !== 'DELETED')
      .reduce((acc, t) => acc + (tabCounts[t.key] ?? 0), 0);

    return TAB_STATUS_LIST.map((tab) => {
      let count = tabCounts[tab.key] ?? 0;
      if (tab.key === 'all') {
        count = allChildSum;
      } else if (tab.key === activeTab) {
        count = total;
      }
      return {
        key: tab.key,
        label: tab.label,
        count,
        color: tab.color,
        active: activeTab === tab.key,
      };
    });
  }, [tabCounts, activeTab, total]);

  // ── rowActions callback (Port pattern) ──────────────────────────
  // Thứ tự: Xem chi tiết → Chỉnh sửa → Lịch sử → Phê duyệt/Từ chối → Xóa
  const rowActions = useCallback(
    (record: ShipRepairYard) => {
      // Bản ghi đã xóa: thao tác bị giới hạn chỉ còn "Xem chi tiết" và "Lịch sử"
      if (isShipRepairYardDeleted(record)) {
        const actions: any[] = [
          { key: 'view', label: 'Xem chi tiết', icon: icons.view, onClick: () => openDetailDrawer(record) },
        ];
        if (hasPerm('shiprepairyard:history')) {
          actions.push({ key: 'history', label: 'Lịch sử', icon: icons.history, onClick: () => openHistory(record) });
        }
        return actions;
      }

      const actions: any[] = [
        { key: 'view', label: 'Xem chi tiết', icon: icons.view, onClick: () => openDetailDrawer(record) },
      ];
      const st = record.approvalStatus || '';
      // Chỉnh sửa chỉ áp dụng cho Lưu tạm (DRAFT) và Đã phê duyệt (APPROVED) — chuẩn VTS CHK
      if (canEditApprovalRecord(st, { hasPerm, resource: 'shiprepairyard' })) {
        actions.push({
          key: 'edit',
          label: 'Chỉnh sửa',
          icon: icons.edit,
          onClick: () => {
            setEditShipRepairYardId(record.id);
            setEditShipRepairYardName(record.shipRepairYardName || '');
            setEditBaseStatus(record.approvalStatus);
            setCreateDrawerVisible(true);
          },
        });
      }
      if (['DRAFT','NHAP'].includes(st) && (hasPerm('shiprepairyard:update') || hasPerm('shiprepairyard:create'))) {
        actions.push({ key: 'submit', label: 'Gửi Cảng vụ phê duyệt', icon: icons.submit, onClick: () => { setSubmittingRecord(record); setSubmitModalOpen(true); } });
      }
      if (['REJECTED_LEVEL1','REJECTED_LEVEL2','REJECTED','TU_CHOI'].includes(st) && (hasPerm('shiprepairyard:update') || hasPerm('shiprepairyard:create'))) {
        actions.push({ key: 'resubmit', label: 'Gửi lại phê duyệt', icon: icons.submit, onClick: () => { setSubmittingRecord(record); setSubmitModalOpen(true); } });
      }
      // Lịch sử — luôn hiển thị khi có quyền
      if (hasPerm('shiprepairyard:history')) {
        actions.push({ key: 'history', label: 'Lịch sử', icon: icons.history, onClick: () => openHistory(record) });
      }
      // Phê duyệt / Từ chối — theo trạng thái 2 cấp
      if (['PENDING_APPROVAL','PENDING','CHO_PHE_DUYET','PROPOSED'].includes(st) && hasPerm('shiprepairyard:approvec1')) {
        actions.push({ key: 'approve_c1', label: 'Phê duyệt cấp Cảng vụ/Chi cục', icon: icons.approve, onClick: () => { setApprovingRecord(record); setApproveModalOpen(true); } });
        actions.push({ key: 'reject_c1', label: 'Từ chối cấp Cảng vụ/Chi cục', icon: icons.reject, danger: true, onClick: () => openRejectModal(record) });
      }
      if (['APPROVED_LEVEL1','APPROVED_LEVEL2'].includes(st) && hasPerm('shiprepairyard:approvec2')) {
        actions.push({ key: 'approve_c2', label: 'Phê duyệt cấp Cục', icon: icons.approve, onClick: () => { setApprovingRecord(record); setApproveModalOpen(true); } });
        actions.push({ key: 'reject_c2', label: 'Từ chối cấp Cục', icon: icons.reject, danger: true, onClick: () => openRejectModal(record) });
      }
      // Xóa: chỉ trạng thái DRAFT/NHAP — luôn ở cuối cùng
      if (hasPerm('shiprepairyard:delete') && ['DRAFT','NHAP'].includes(st)) {
        actions.push({ key: 'delete', label: 'Xóa', icon: icons.delete, danger: true, onClick: () => openDeleteModal(record) });
      }
      return actions;
    },
    [hasPerm, openDetailDrawer, openHistory, openDeleteModal, openRejectModal],
  );

  // ── Table columns (đối chiếu đúng cột CSV) ─────────────────────
  const renderCellWithTooltip = (
    text: string | null | undefined,
    isBold?: boolean
  ) => {
    if (!text) return null;
    return (
      <Tooltip title={text} placement="topLeft">
        <span
          style={{
            fontSize: fontSizeMd,
            color: textPrimary,
            fontWeight: isBold ? fontWeightBold : undefined,
            display: 'inline-block',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            verticalAlign: 'middle',
          }}
          title={text}
        >
          {text}
        </span>
      </Tooltip>
    );
  };

  const columns = useMemo(() => {
    const baseColumns: any[] = [
      {
        key: 'sequenceNo',
        label: 'STT',
        width: 60,
        fixed: 'left' as const,
        align: 'center' as const,
        render: (_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd }}>{(page - 1) * pageSize + i + 1}</span>,
      },
      {
        key: 'shipRepairYardName',
        label: <span>Tên/Mã cơ sở sửa chữa, đóng tàu</span>,
        dataIndex: 'shipRepairYardName',
        width: 400,
        minWidth: 350,
        fixed: 'left' as const,
        sortable: true,
        ellipsis: false,
        cellTitle: (record: ShipRepairYard) => record.shipRepairYardName || '',
        render: (v: string, record: ShipRepairYard) => (
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <Tooltip title={v || undefined} placement="topLeft">
              <a
                title={v}
                onClick={() => openDetailDrawer(record)}
                style={{ ...cellTitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {v}
              </a>
            </Tooltip>
            {record.shipRepairYardCode && (
              <Tooltip title={record.shipRepairYardCode} placement="topLeft">
                <span style={{ ...cellSubtitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={record.shipRepairYardCode}>
                  {record.shipRepairYardCode}
                </span>
              </Tooltip>
            )}
          </div>
        ),
      },
      {
        key: 'orgUnitId',
        label: 'Đơn vị quản lý',
        dataIndex: 'orgUnitId',
        width: 260,
        sortable: true,
        cellTitle: (record: ShipRepairYard) => resolveOrgLevel2Name(organizations, record?.orgUnitId) || orgMap.get(record?.orgUnitId || '') || '',
        render: (_v: string | null, record: ShipRepairYard) => {
          const name = resolveOrgLevel2Name(organizations, record.orgUnitId) || orgMap.get(record.orgUnitId || '') || null;
          return renderCellWithTooltip(name, true);
        },
      },
      {
        key: 'portId',
        label: 'Thuộc cảng biển',
        dataIndex: 'portId',
        width: 200,
        sortable: true,
        cellTitle: (record: ShipRepairYard) => portOptions.find(o => o.value === record?.portId)?.label || record?.portId || '',
        render: (v: string | null) => renderCellWithTooltip(portOptions.find(o => o.value === v)?.label || v || null),
      },
      {
        key: 'pierId',
        label: 'Thuộc cầu cảng',
        dataIndex: 'pierId',
        width: 200,
        sortable: true,
        cellTitle: (record: ShipRepairYard) => pierOptions.find(o => o.value === record?.pierId)?.label || record?.pierName || record?.pierId || '',
        render: (v: string | null, record: ShipRepairYard) => renderCellWithTooltip(pierOptions.find(o => o.value === v)?.label || record.pierName || v || null),
      },
      {
        key: 'provinceId',
        label: 'Địa điểm (Tỉnh/Thành phố)',
        dataIndex: 'provinceId',
        width: 250,
        sortable: true,
        cellTitle: (record: ShipRepairYard) => (record?.provinceId ? VIETNAM_PROVINCES[record.provinceId - 1] : '') || '',
        render: (v: number | null) => renderCellWithTooltip(v ? VIETNAM_PROVINCES[v - 1] : null),
      },
      {
        key: 'operationalStatus',
        label: 'Tình trạng',
        dataIndex: 'operationalStatus',
        width: 210,
        sortable: true,
        render: (v: string | null) => {
          if (!v) return '';
          const m: Record<string, { color: string; label: string }> = {
            OPERATIONAL: { color: statusOperational, label: 'Đang khai thác/vận hành' },
            NOT_YET_OPERATIONAL: { color: statusAttention, label: 'Chưa khai thác/vận hành' },
            SUSPENDED: { color: statusCritical, label: 'Dừng khai thác/vận hành' },
          };
          const s = m[v] || { color: textTertiary, label: v };
          return <span style={statusBadgeStyle(s.color)}>{s.label}</span>;
        },
      },
    ];

    // Audit columns
    const auditColumns: any[] = [
      { key: 'updatedAt', label: <span>Cán bộ cập nhật</span>, dataIndex: 'updatedAt', width: 200, sortable: true,
        cellTitle: (record: ShipRepairYard) => {
          const rawName = formatUserDisplayName(record?.updatedBy, (record as any)?.updatedByName, userMap, record?.createdBy, (record as any)?.createdByName);
          return (rawName === '—' || rawName === '-') ? '' : rawName;
        },
        render: (v: string | null, record: ShipRepairYard) => {
          const rawName = formatUserDisplayName(record.updatedBy, (record as any).updatedByName, userMap, record.createdBy, (record as any).createdByName);
          const name = (rawName === '—' || rawName === '-') ? '' : rawName;
          const date = formatDate(v);
          const cleanDate = (date === '—' || date === '-') ? '' : date;
          if (!name && !cleanDate) return '';
          return (
            <div style={{ lineHeight: '1.35', overflow: 'hidden' }}>
              {name && (
                <Tooltip title={name} placement="topLeft">
                  <span title={name} style={{ fontWeight: fontWeightBold, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                </Tooltip>
              )}
              {cleanDate && <span style={{ opacity: 0.85, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cleanDate}</span>}
            </div>
          );
        } },
      { key: 'submittedForApprovalAt', label: <span>Cán bộ gửi Phê duyệt</span>, dataIndex: 'submittedForApprovalAt', width: 210, sortable: true,
        cellTitle: (record: ShipRepairYard) => {
          const rawName = formatUserDisplayName(record?.submittedForApprovalBy, (record as any)?.submittedForApprovalByName, userMap);
          return (rawName === '—' || rawName === '-') ? '' : rawName;
        },
        render: (v: string | null, record: ShipRepairYard) => {
          const rawName = formatUserDisplayName(record.submittedForApprovalBy, (record as any).submittedForApprovalByName, userMap);
          const name = (rawName === '—' || rawName === '-') ? '' : rawName;
          const date = formatDate(v);
          const cleanDate = (date === '—' || date === '-') ? '' : date;
          if (!name && !cleanDate) return '';
          return (
            <div style={{ lineHeight: '1.35', overflow: 'hidden' }}>
              {name && (
                <Tooltip title={name} placement="topLeft">
                  <span title={name} style={{ fontWeight: fontWeightBold, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                </Tooltip>
              )}
              {cleanDate && <span style={{ opacity: 0.85, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cleanDate}</span>}
            </div>
          );
        } },
      { key: 'portAuthorityApprovedAt', label: <span>Cán bộ phê duyệt cấp Cảng vụ/Chi cục</span>, dataIndex: 'portAuthorityApprovedAt', width: 340, sortable: true,
        cellTitle: (record: ShipRepairYard) => {
          const rawName = formatUserDisplayName(record?.portAuthorityApprovedBy, (record as any)?.portAuthorityApprovedByName, userMap);
          return (rawName === '—' || rawName === '-') ? '' : rawName;
        },
        render: (v: string | null, record: ShipRepairYard) => {
          const rawName = formatUserDisplayName(record.portAuthorityApprovedBy, (record as any).portAuthorityApprovedByName, userMap);
          const name = (rawName === '—' || rawName === '-') ? '' : rawName;
          const date = formatDate(v);
          const cleanDate = (date === '—' || date === '-') ? '' : date;
          if (!name && !cleanDate) return '';
          return (
            <div style={{ lineHeight: '1.35', overflow: 'hidden' }}>
              {name && (
                <Tooltip title={name} placement="topLeft">
                  <span title={name} style={{ fontWeight: fontWeightBold, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                </Tooltip>
              )}
              {cleanDate && <span style={{ opacity: 0.85, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cleanDate}</span>}
            </div>
          );
        } },
      { key: 'departmentApprovedAt', label: <span>Cán bộ phê duyệt cấp Cục</span>, dataIndex: 'departmentApprovedAt', width: 240, sortable: true,
        cellTitle: (record: ShipRepairYard) => {
          const rawName = formatUserDisplayName(record?.departmentApprovedBy, (record as any)?.departmentApprovedByName, userMap);
          return (rawName === '—' || rawName === '-') ? '' : rawName;
        },
        render: (v: string | null, record: ShipRepairYard) => {
          const rawName = formatUserDisplayName(record.departmentApprovedBy, (record as any).departmentApprovedByName, userMap);
          const name = (rawName === '—' || rawName === '-') ? '' : rawName;
          const date = formatDate(v);
          const cleanDate = (date === '—' || date === '-') ? '' : date;
          if (!name && !cleanDate) return '';
          return (
            <div style={{ lineHeight: '1.35', overflow: 'hidden' }}>
              {name && (
                <Tooltip title={name} placement="topLeft">
                  <span title={name} style={{ fontWeight: fontWeightBold, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                </Tooltip>
              )}
              {cleanDate && <span style={{ opacity: 0.85, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cleanDate}</span>}
            </div>
          );
        } },
    ];

    const tailColumns: any[] = [
      { key: 'approvalStatus', label: 'Trạng thái', dataIndex: 'approvalStatus', width: 260, sortable: true,
        render: (v: string, record: ShipRepairYard) => {
          if (isShipRepairYardDeleted(record)) {
            return <span style={statusBadgeStyle(statusCritical)}>Đã xóa</span>;
          }
          if (!v) return '';
          const s = APPROVAL_STYLE_MAP[v] || APPROVAL_STYLE_MAP[v?.toUpperCase()] || { color: textTertiary, label: v };
          return <span style={statusBadgeStyle(s.color)}>{s.label}</span>;
        } },
    ];

    const allColumns = [...baseColumns, ...tailColumns, ...auditColumns];
    return allColumns.map((col) => ({
      ...col,
      sortOrder: col.sortable ? ((col.key === sortField || col.dataIndex === sortField) ? sortOrder : null) : undefined,
    }));
  }, [
    openDetailDrawer,
    organizations,
    orgMap,
    userMap,
    page,
    pageSize,
    portOptions,
    pierOptions,
    sortField,
    sortOrder,
  ]);

  // ── Detail drawer content ────────────────────────────────────────
  const ddToDms = (dd: number): { d: number; m: number; s: number } => {
    if (dd == null || isNaN(dd)) return { d: 0, m: 0, s: 0 };
    const abs = Math.abs(dd);
    const d = Math.floor(abs);
    const m = Math.floor((abs - d) * 60);
    const s = parseFloat(((abs - d - m / 60) * 3600).toFixed(2));
    return { d, m, s };
  };

  const renderDetailContent = () => {
    if (!detailRecord) return null;
    if (detailLoading) return <LoadingSkeleton rows={6} />;
    return (
      <ShipRepairYardDetailContent
        selectedRecord={detailRecord}
        orgMap={orgMap}
        organizations={organizations}
        symbolMap={symbolMap}
        symbolImageMap={symbolImageMap}
        portOptions={portOptions}
        pierOptions={pierOptions}
        userMap={userMap}
        detailFiles={detailFiles}
        ddToDms={ddToDms}
        approvalStyleMap={APPROVAL_STYLE_MAP}
        operationPlanList={(detailRecord as any)?.operationPlanList}
        maintenancePlanList={(detailRecord as any)?.maintenancePlanList}
        incidentList={(detailRecord as any)?.incidentList}
      />
    );
  };

  // ── JSX ─────────────────────────────────────────────────────────

  return (
    <ThemeTokenProvider tokens={themeTokenChk as unknown as ThemeToken}>
    <div className="ship-repair-yard-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <style>{`
        .range-single-panel .ant-picker-panel-container .ant-picker-panel:last-child { display: none !important; }

        .ship-repair-yard-page-wrapper,
        .ship-repair-yard-page-wrapper .ant-table,
        .ship-repair-yard-page-wrapper .ant-table-cell,
        .ship-repair-yard-page-wrapper .ant-table-thead > tr > th,
        .ship-repair-yard-page-wrapper .ant-tabs-tab,
        .ship-repair-yard-page-wrapper .ant-btn,
        .ship-repair-yard-page-wrapper .ant-input,
        .ship-repair-yard-page-wrapper .ant-select,
        .ship-repair-yard-page-wrapper .ant-select-selection-item,
        .ship-repair-yard-page-wrapper .ant-select-item,
        .ship-repair-yard-page-wrapper .ant-pagination,
        .ship-repair-yard-drawer-scope,
        .ship-repair-yard-drawer-scope .ant-drawer-title,
        .ship-repair-yard-drawer-scope .ant-tabs-tab,
        .ship-repair-yard-drawer-scope .ant-btn,
        .ship-repair-yard-drawer-scope .ant-input,
        .ship-repair-yard-drawer-scope .ant-select,
        .ship-repair-yard-drawer-scope .ant-table,
        .ship-repair-yard-drawer-scope .ant-form-item-label > label,
        .ship-repair-yard-modal-scope,
        .ship-repair-yard-modal-scope .ant-modal-title,
        .ship-repair-yard-modal-scope .ant-btn,
        .ship-repair-yard-modal-scope .ant-input,
        .ship-repair-yard-modal-scope .ant-form-item-label > label {
          font-size: 13.5px !important;
        }

        .ship-repair-yard-page-wrapper div:has(> button[aria-pressed]) {
          display: flex !important;
          flex-wrap: nowrap !important;
          justify-content: center !important;
          justify-content: safe center !important;
          align-items: center !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          scrollbar-width: thin !important;
          scrollbar-color: #cbd5e1 #f8fafc !important;
          scroll-behavior: smooth !important;
          -webkit-overflow-scrolling: touch !important;
          padding: 2px 8px 4px 8px !important;
          gap: clamp(6px, 1vw, 14px) !important;
        }
        .ship-repair-yard-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar {
          height: 4px !important;
          display: block !important;
        }
        .ship-repair-yard-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-track {
          background: #f1f5f9 !important;
          border-radius: 999px !important;
        }
        .ship-repair-yard-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb {
          background: #cbd5e1 !important;
          border-radius: 999px !important;
        }
        .ship-repair-yard-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb:hover {
          background: #94a3b8 !important;
        }
        .ship-repair-yard-page-wrapper div:has(> button[aria-pressed]) > button {
          white-space: nowrap !important;
          flex-shrink: 0 !important;
          cursor: pointer !important;
          padding: 4px 2px !important;
        }
      `}</style>
      <ScreenHeader
        breadcrumb={[{ label: 'Tài sản KCHTGT' }, { label: 'Cơ sở sửa chữa, đóng tàu' }]}
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
        <DataTable
          columns={columns}
          dataSource={dataSource}
          rowKey="id"
          rowActions={rowActions}
          loading={isLoading}
          onSort={(k: string, o: 'asc' | 'desc' | null) => {
            setPage(1);
            if (!o) {
              setSortField('updatedAt');
              setSortOrder('descend');
            } else {
              setSortField(k);
              setSortOrder(o === 'asc' ? 'ascend' : 'descend');
            }
          }}
          scroll={{ x: 'max-content' }}
        />
        <Pagination total={total} current={page} pageSize={pageSize}
          onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
        />
      </FilterTableLayout>

      {/* ── Create / Edit Drawer (Hợp nhất 1 Drawer chuẩn Cầu cảng / VTS CHK) ── */}
      <AppDrawer
        width={DRAWER_WIDTH}
        rootClassName="ship-repair-yard-drawer-scope"
        className="ship-repair-yard-drawer-scope"
        title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>{editShipRepairYardId ? `Chỉnh sửa thông tin — ${editShipRepairYardName || 'Cơ sở sửa chữa, đóng tàu'}` : 'Thêm mới Cơ sở sửa chữa, đóng tàu'}</span>}
        open={createDrawerVisible}
        destroyOnHidden
        onClose={() => {
          setCreateDrawerVisible(false);
          createForm.resetFields();
        }}
        footer={
          <div style={drawerFooterStyle}>
            {(() => {
              const st = !editShipRepairYardId ? 'DRAFT' : (editBaseStatus ? String(editBaseStatus).toUpperCase() : 'DRAFT');
              if (st === 'APPROVED') {
                return (
                  <Button
                    htmlType="button"
                    type="primary"
                    onClick={() => { actionTypeRef.current = 'approve'; setActionType('approve'); shipRepairYardFormRef.current?.submit('APPROVED'); }}
                    loading={submitting && actionType === 'approve'}
                    style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}
                  >
                    Lưu và phê duyệt
                  </Button>
                );
              }
              if (st === 'REJECTED_LEVEL1' || st === 'REJECTED_LEVEL2' || st === 'REJECTED' || st === 'TU_CHOI') {
                return (
                  <Button
                    htmlType="button"
                    type="primary"
                    onClick={() => { actionTypeRef.current = 'submit'; setActionType('submit'); shipRepairYardFormRef.current?.submit('SUBMIT'); }}
                    loading={submitting && actionType === 'submit'}
                    style={primaryButtonStyle}
                  >
                    Lưu và gửi phê duyệt
                  </Button>
                );
              }
              return (
                <>
                  <Button
                    htmlType="button"
                    onClick={() => { actionTypeRef.current = 'draft'; setActionType('draft'); shipRepairYardFormRef.current?.submit('DRAFT'); }}
                    loading={submitting && actionType === 'draft'}
                    style={outlineButtonStyle}
                  >
                    Lưu tạm
                  </Button>
                  <Button
                    htmlType="button"
                    type="primary"
                    onClick={() => { actionTypeRef.current = 'submit'; setActionType('submit'); shipRepairYardFormRef.current?.submit('SUBMIT'); }}
                    loading={submitting && actionType === 'submit'}
                    style={primaryButtonStyle}
                  >
                    Lưu và gửi phê duyệt
                  </Button>
                  <Button
                    htmlType="button"
                    type="primary"
                    onClick={() => { actionTypeRef.current = 'approve'; setActionType('approve'); shipRepairYardFormRef.current?.submit('APPROVED'); }}
                    loading={submitting && actionType === 'approve'}
                    style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}
                  >
                    Lưu và phê duyệt
                  </Button>
                </>
              );
            })()}
          </div>
        }
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px' },
        }}
        afterOpenChange={(open) => {
          if (!open) {
            setEditShipRepairYardId(undefined);
            setEditShipRepairYardName('');
            setEditBaseStatus(undefined);
            createForm.resetFields();
          }
        }}
      >
        <style>{requiredMarkStyle}</style>
        <Form form={createForm} layout="vertical" initialValues={{}}>
          <ShipRepairYardForm
            ref={shipRepairYardFormRef}
            form={createForm}
            id={editShipRepairYardId}
            onFinish={() => {
              setCreateDrawerVisible(false);
              setSortField('updatedAt');
              setSortOrder('descend');
              setPage(1);
              void fetchData();
              void fetchCounts(managingUnitId);
            }}
            onSubmittingChange={setSubmitting}
          />
        </Form>
      </AppDrawer>

      {/* ── Detail Drawer ──────────────────────────────────────────── */}
      <AppDrawer
        width={DRAWER_WIDTH}
        rootClassName="ship-repair-yard-drawer-scope"
        className="ship-repair-yard-drawer-scope"
        title={<span style={drawerTitleStyle}>Chi tiết cơ sở sửa chữa, đóng tàu{detailRecord ? ` - ${detailRecord.shipRepairYardName}` : ''}</span>}
        open={detailDrawerVisible}
        onClose={() => { setDetailDrawerVisible(false); setDetailRecord(null); }}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px', overflow: 'hidden' },
        }}
        footer={null}
      >
        {renderDetailContent()}
      </AppDrawer>

      {/* ── Delete Confirmation Modal ────────────────────────────── */}
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
        itemType="cơ sở sửa chữa, đóng tàu"
        itemName={deletingRecord?.shipRepairYardName}
        itemCode={deletingRecord?.shipRepairYardCode}
      />

      {/* ── Reject Reason Modal ──────────────────────────────────── */}
      <Modal
        rootClassName="ship-repair-yard-modal-scope"
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Từ chối phê duyệt</span>}
        open={rejectModalOpen}
        onCancel={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); }}
        footer={[
          <Button key="cancel" onClick={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="reject" type="primary" danger onClick={handleConfirmReject}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Xác nhận từ chối</Button>,
        ]}
        width={480}>
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>Vui lòng nhập lý do từ chối cho cơ sở sửa chữa, đóng tàu:</p>
          {rejectingRecord && (
            <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>
              <strong style={{ color: textPrimary }}>{rejectingRecord.shipRepairYardName}</strong>
            </p>
          )}
          <Input.TextArea placeholder="Nhập lý do từ chối (tối thiểu 10, tối đa 500 ký tự)..." value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)} rows={3} maxLength={500} showCount
            style={{ borderRadius: 8, fontSize: fontSizeMd }} />
        </div>
      </Modal>

      {/* ── Submit Modal ──────────────────────────────────────────── */}
      <Modal
        rootClassName="ship-repair-yard-modal-scope"
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Xác nhận gửi Cảng vụ phê duyệt</span>}
        open={submitModalOpen}
        onCancel={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }}
        footer={[
          <Button key="cancel" onClick={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="submit" type="primary" onClick={handleConfirmSubmit}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>Xác nhận</Button>,
        ]}
        width={480}>
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary }}>
            Gửi <strong>{submittingRecord?.shipRepairYardCode} — {submittingRecord?.shipRepairYardName}</strong> để Cảng vụ phê duyệt?
          </p>
        </div>
      </Modal>

      {/* ── Approve Modal (chuẩn VTS CHK) ─────────────────────────── */}
      <ApprovalModal
        visible={approveModalOpen}
        level={approvingRecord?.approvalStatus === 'APPROVED_LEVEL2' ? 'c2' : 'c1'}
        onConfirm={(content) => { if (approvingRecord) handleApprove(approvingRecord, content); }}
        onCancel={() => { setApproveModalOpen(false); setApprovingRecord(null); }}
      />

      {/* ── History Drawer ──────────────────────────────────────── */}
      <AppDrawer
        width={DRAWER_WIDTH}
        rootClassName="ship-repair-yard-drawer-scope"
        className="ship-repair-yard-drawer-scope"
        mask
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Space size={spaceSm} style={{ alignItems: 'center' }}>
              <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
              <span style={drawerTitleStyle}>
                {historyMode === 'all' ? 'Tất cả lịch sử thay đổi — Cơ sở sửa chữa, đóng tàu' : (historyTarget ? `Lịch sử thay đổi — ${historyTarget.shipRepairYardName}` : 'Lịch sử thay đổi')}
              </span>
              <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeLg - 1, fontWeight: fontWeightBold, background: `${colors.sidebarBg}15`, color: colors.sidebarBg, lineHeight: '20px' }}>Tổng cộng {historyUpdateCount}</span>
            </Space>
          </div>
        }
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        footer={null}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '12px 24px 12px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
        }}>
        <style>{`.history-dt-popup .ant-picker-now-btn { color: ${actionPrimary} !important; }`}</style>
        <div style={{ flexShrink: 0 }}>
        {!historyLoading && (
          <div style={{ display: 'none' }}>
            <Radio.Group value={historyMode} size="middle" style={{ display: 'flex', width: '100%', borderBottom: `1px solid ${borderDefault}` }}
              onChange={async e => { const mode = e.target.value; setHistoryMode(mode); setHistoryLoading(true); setHistoryRecords([]); if (mode === 'all') { try { const res = await api.get('/v1/ship-repair-yard/history/all'); const d = res.data?.data; setHistoryRecords(Array.isArray(d?.changeHistory) ? d.changeHistory : []); setHistoryEntityNames(d?.entityNames || {}); } catch { toast.error('Không thể tải lịch sử'); } finally { setHistoryLoading(false); } } else { if (historyTarget?.approvalStatus === 'DRAFT' || (historyTarget as any)?.status === 'DRAFT') { setHistoryRecords([]); setHistoryLoading(false); return; } try { const res = await api.get(`/v1/ship-repair-yard/${historyTarget?.id}/history`); const d = res.data?.data; setHistoryRecords(Array.isArray(d?.changeHistory) ? d.changeHistory : []); } catch { toast.error('Không thể tải lịch sử'); } finally { setHistoryLoading(false); } } }}>
              <Radio.Button value="current" style={{ fontWeight: fontWeightBold, color: historyMode !== 'current' ? textSecondary : actionPrimary }}>Bản ghi hiện tại</Radio.Button>
              <Radio.Button value="all" style={{ fontWeight: fontWeightBold, color: historyMode !== 'all' ? textSecondary : actionPrimary }}>Tất cả bản ghi</Radio.Button>
            </Radio.Group>
          </div>
        )}
        {!historyLoading && (
          <div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceMd }}>
            <Input
              placeholder="Tìm kiếm nội dung thay đổi..."
              allowClear
              value={historySearchInput}
              onChange={(e) => {
                const val = e.target.value;
                setHistorySearchInput(val);
                if (!val) setHistorySearch('');
              }}
              onPressEnter={() => setHistorySearch(historySearchInput.trim())}
              style={{ flex: 1, borderRadius: radiusPill, height: 40 }}
            />
            {historyMode === 'all' && <Select placeholder="Chọn cơ sở sửa chữa, đóng tàu" allowClear showSearch value={historyEntityFilter || undefined}
              onChange={v => setHistoryEntityFilter(v || '')}
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              options={Object.entries(historyEntityNames).map(([id, name]) => ({ value: id, label: name }))} />}
            <DatePicker.RangePicker
              {...getRangePickerProps({
                value: (historyFrom && historyTo)
                  ? [dayjs(historyFrom), dayjs(historyTo)]
                  : (historyFrom ? [dayjs(historyFrom), null] : (historyTo ? [null, dayjs(historyTo)] : null)),
                onChange: (dates: any) => {
                  if (!dates || dates.length === 0 || (!dates[0] && !dates[1])) {
                    setHistoryFrom('');
                    setHistoryTo('');
                  } else {
                    setHistoryFrom(dates[0] ? dates[0].startOf('day').format('YYYY-MM-DD HH:mm') : '');
                    setHistoryTo(dates[1] ? dates[1].endOf('day').format('YYYY-MM-DD HH:mm') : '');
                  }
                },
                style: { width: 280, borderRadius: radiusPill, height: 40 },
              })}
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => setHistorySearch(historySearchInput.trim())}
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}
            >
              Tìm kiếm
            </Button>
          </div>
        )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {historyLoading ? <LoadingSkeleton rows={5} /> : historyRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}><HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} /><div style={{ color: textTertiary, fontSize: fontSizeMd }}>Chưa có thay đổi nào được ghi nhận</div></div>
        ) : renderShipRepairYardHistoryTimeline(historyRecords)}
        </div>
      </AppDrawer>
    </div>
    </ThemeTokenProvider>
  );
}

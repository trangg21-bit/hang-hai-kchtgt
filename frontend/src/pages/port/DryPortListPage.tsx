import {
    HistoryOutlined,
    PlusOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import {
    Button,
    DatePicker,
    Form,
    Input,
    Modal,
    Select,
    Space,
    Tooltip,
} from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DataTable, FilterTableLayout, ScreenHeader } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { FilterOrgUnitTreeSelect, normalizeSearchText, resolveDefaultOrgUnitId } from '../../components/org-unit';
import AppDrawer from '../../components/shared/AppDrawer';
import ApprovalModal from '../../components/shared/ApprovalModal';
import DeleteConfirmModal from '../../components/shared/DeleteConfirmModal';
import toast from '../../components/ToastNotification';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import api from '../../services/api';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../services/operatingOrganizationsData';
import type { Organization } from '../../services/organizationService';
import { organizationService } from '../../services/organizationService';
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
    fontSizeSm,
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
    statusCritical,
    statusDraft,
    statusOperational,
    textPrimary,
    textSecondary,
    textTertiary,
} from '../../themetokenchk';
import { VIETNAM_PROVINCES } from '../../types/common';
import { canDeleteApprovalRecord, canEditApprovalRecord } from '../../utils/approvalEditPolicy';
import { checkCanSaveAndApprove } from '../../hooks/useKchtPermissions';
import { countStandardHistoryCards, isBlankOrDash, renderStandardHistoryCards } from '../../utils/changeHistoryRenderer';
import {
    approveDryPort,
    ddToDms,
    deleteDryPort,
    type DryPort,
    fetchDryPortAttachmentList,
    fetchDryPortById,
    fetchDryPortHistory,
    fetchDryPortList,
    normalizeDryPortIdentityFilters,
    PORT_STATUS_OPTIONS,
    REGION_OPTIONS,
    rejectDryPort,
    trangThaiHoatDongBadge,
    trangThaiPheDuyetBadge,
} from './dry-port';
import DryPortDetailContent from './DryPortDetailContent';
import DryPortForm, { type DryPortFormHandle } from './DryPortForm';

export function isDryPortDeleted(record?: Partial<DryPort> | null): boolean {
  if (!record) return false;
  return Boolean(record.deletedAt || record.deletedBy || record.approvalStatus === 'DELETED' || record.approvalStatus === 'ARCHIVED');
}

const TAB_STATUS_LIST = [
  { key: 'all', label: 'Tất cả', color: actionPrimary },
  { key: 'DRAFT', label: 'Lưu tạm', color: statusDraft },
  { key: 'APPROVED', label: 'Đã phê duyệt', color: statusOperational },
  { key: 'ARCHIVED', label: 'Đã xóa', color: statusCritical },
];

const TAB_QUERY_MAP: Record<string, string | undefined> = {
  all: undefined,
  DRAFT: 'DRAFT',
  APPROVED: 'APPROVED',
  ARCHIVED: 'ARCHIVED',
};

/* ───────────────────────────────────────────────
   Helpers
   ─────────────────────────────────────────────── */
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try { return dayjs(dateStr).format('DD/MM/YYYY HH:mm:ss'); } catch { return dateStr; }
}

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
  'area',
  'warehouseArea',
  'yardArea',
  'teuCapacity',
  'provinceId',
  'portStatus',
  'displayRule',
  'coordinateSystem',
  'Tổng diện tích cảng (m2)',
  'Diện tích kho (m2)',
  'Diện tích bãi (m2)',
  'Công suất khai thác',
]);

export const HISTORY_FIELD_LABELS: Record<string, string> = {
  orgUnitId: 'Đơn vị quản lý',
  dryPortCode: 'Mã cảng cạn',
  dryPortName: 'Tên cảng cạn',
  provinceId: 'Địa điểm (Tỉnh/Thành Phố)',
  province: 'Địa điểm (Tỉnh/Thành Phố)',
  'Tỉnh/Thành phố': 'Địa điểm (Tỉnh/Thành Phố)',
  operatingOrgId: 'Đơn vị khai thác',
  operatingUnit: 'Đơn vị khai thác',
  operating_unit: 'Đơn vị khai thác',
  region: 'Khu vực',
  detailedLocation: 'Địa điểm chi tiết',
  transportCorridor: 'Hành lang vận tải',
  area: 'Tổng diện tích cảng (m2)',
  'Tổng diện tích cảng (m2)': 'Tổng diện tích cảng (m2)',
  warehouseArea: 'Diện tích kho (m2)',
  'Diện tích kho (m2)': 'Diện tích kho (m2)',
  yardArea: 'Diện tích bãi (m2)',
  'Diện tích bãi (m2)': 'Diện tích bãi (m2)',
  teuCapacity: 'Công suất khai thác',
  'Công suất khai thác': 'Công suất khai thác',
  connectionMode: 'Phương thức kết nối giao thông',
  portStatus: 'Tình trạng',
  'Tình trạng': 'Tình trạng',
  operationalStatus: 'Trạng thái hoạt động',
  'Trạng thái hoạt động': 'Trạng thái hoạt động',
  announcementTime: 'Thời điểm công bố mở',
  announcementDecisionNumber: 'Quyết định công bố số',
  announcementDecisionDate: 'Ngày ra quyết định công bố',
  announcementOrg: 'Đơn vị ra quyết định công bố',
  // Opening announcement (đồng bộ chuẩn Cầu cảng - Pier)
  openingAnnouncementDate: 'Thời điểm công bố mở, đưa vào sử dụng',
  openingDecision: 'Quyết định công bố/ Văn bản cho phép khai thác',
  investmentAgreementDoc: 'Văn bản thỏa thuận đầu tư xây dựng',
  remarks: 'Ghi chú',
  mapSymbolId: 'Biểu tượng',
  'Biểu tượng': 'Biểu tượng',
  'Biểu tượng bản đồ': 'Biểu tượng',
  coordinateSystem: 'Hệ quy chiếu',
  'Hệ quy chiếu': 'Hệ quy chiếu',
  displayRule: 'Quy tắc hiển thị',
  'Quy tắc hiển thị': 'Quy tắc hiển thị',
  geometryType: 'Loại đối tượng',
  'Loại đối tượng': 'Loại đối tượng',
  'Loại đối tượng GIS': 'Loại đối tượng',
  spatialId: 'Vị trí không gian',
  'Vị trí không gian': 'Vị trí không gian',
  coordinates: 'Tọa độ GPS',
  'Tọa độ GIS': 'Tọa độ GPS',
  'Tọa độ GPS': 'Tọa độ GPS',
  attachments: 'File đính kèm',
  'Tài liệu đính kèm': 'File đính kèm',
  'File đính kèm': 'File đính kèm',
  approvalStatus: 'Trạng thái',
  'Trạng thái': 'Trạng thái',
  'Trạng thái phê duyệt': 'Trạng thái',
};

export const HISTORY_FIELD_ORDER = [
  'orgUnitId', 'dryPortCode', 'dryPortName', 'provinceId', 'operatingOrgId', 'operatingUnit',
  'region', 'detailedLocation', 'transportCorridor', 'area', 'warehouseArea',
  'yardArea', 'teuCapacity', 'connectionMode', 'portStatus', 'operationalStatus',
  'announcementTime', 'announcementDecisionNumber', 'announcementDecisionDate',
  'announcementOrg', 'openingAnnouncementDate', 'openingDecision', 'investmentAgreementDoc', 'remarks', 'mapSymbolId', 'coordinateSystem', 'displayRule', 'geometryType', 'coordinates',
  'approvalStatus',
];

export function historyFieldName(field: string): string {
  return HISTORY_FIELD_LABELS[field] || field;
}

export function historyFieldValue(
  field: string,
  val: string | null | undefined,
  orgMap?: Map<string, string>,
  symbolMap?: Map<string, string>
): string {
  if (val === null || val === undefined || val === '' || val === '(null)' || val === 'null' || val === '-' || val === '—' || val === '–') return '';
  const v = String(val).trim();
  if ((field === 'orgUnitId' || field === 'Đơn vị quản lý') && orgMap) {
    const full = orgMap.get(v);
    return full ? full.split(' - ').pop() || full : v;
  }
  if ((field === 'mapSymbolId' || field === 'Biểu tượng' || field === 'Biểu tượng bản đồ') && symbolMap) {
    return symbolMap.get(v) || v;
  }
  if (field === 'openingAnnouncementDate' || field === 'announcementDecisionDate' || field === 'announcementTime') {
    return formatDate(v).split(' ')[0] || v;
  }
  if (field === 'provinceId' || field === 'province' || field === 'Địa điểm (Tỉnh/Thành Phố)' || field === 'Tỉnh/Thành phố') {
    const pIdx = parseInt(v, 10);
    if (!isNaN(pIdx) && pIdx >= 1 && pIdx <= VIETNAM_PROVINCES.length) return VIETNAM_PROVINCES[pIdx - 1];
    return v;
  }
  if (field === 'portStatus' || field === 'Tình trạng') {
    const s = parseInt(v, 10);
    return s === 1 ? 'Đang khai thác/vận hành' : s === 0 ? 'Chưa khai thác/vận hành' : s === 2 ? 'Dừng khai thác/vận hành' : v;
  }
  if (field === 'operationalStatus' || field === 'Trạng thái hoạt động') {
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
  if (field === 'geometryType' || field === 'Loại đối tượng' || field === 'Loại đối tượng GIS') {
    const m: Record<string, string> = { POINT: 'Điểm', LINE: 'Đường', POLYGON: 'Vùng' };
    return m[v.toUpperCase()] || v;
  }
  if (field === 'coordinateSystem' || field === 'Hệ quy chiếu') {
    const m: Record<string, string> = { '1': 'WGS-84', '2': 'VN-2000' };
    return m[v] || v;
  }
  if (field === 'operatingUnit' || field === 'operatingOrgId' || field === 'operating_unit') {
    const org = DEFAULT_OPERATING_ORGANIZATIONS.find((o) => o.id === v);
    if (org) return org.name;
    return v;
  }
  if (field === 'approvalStatus' || field === 'Trạng thái' || field === 'Trạng thái phê duyệt') {
    const m: Record<string, string> = {
      DRAFT: 'Lưu tạm',
      PENDING_APPROVAL: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
      APPROVED_LEVEL1: 'Chờ phê duyệt cấp Cục',
      APPROVED: 'Đã phê duyệt',
      REJECTED_LEVEL1: 'Từ chối cấp Cảng vụ/Chi cục',
      REJECTED_LEVEL2: 'Từ chối cấp Cục',
      ARCHIVED: 'Đã xóa',
    };
    return m[v.toUpperCase()] || trangThaiPheDuyetBadge(v).label;
  }
  return v;
}

/* ───────────────────────────────────────────────
   Main Component: DryPortListPage
   ─────────────────────────────────────────────── */
export default function DryPortListPage() {
  const [searchParams] = useSearchParams();
  const linkedAction = searchParams.get('action');
  const linkedRecordId = searchParams.get('id');
  const isEmbeddedAction = window.self !== window.top
    && (linkedAction === 'detail' || linkedAction === 'edit')
    && !!linkedRecordId;
  const hasPerm = usePermissionStore((s) => s.hasPermission);
  const hasExplicitPerm = usePermissionStore((s: any) => s.hasExplicitPermission);
  const { user: authUser } = useAuthStore();
  const canSaveAndApprove = checkCanSaveAndApprove('dryport', hasExplicitPerm || hasPerm, authUser);
  const [filterCollapsed, setFilterCollapsed] = useState(false);

  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');

  const [filterOrgUnitId, setFilterOrgUnitId] = useState<string | undefined>(undefined);
  const [filterProvince, setFilterProvince] = useState<number | undefined>();
  const [filterRegion, setFilterRegion] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<number | undefined>();
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState<string | undefined>();
  const [filterUpdatedTo, setFilterUpdatedTo] = useState<string | undefined>();
  const [filterCode, setFilterCode] = useState<string | undefined>();
  const [filterTransportCorridor, setFilterTransportCorridor] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortDir, setSortDir] = useState<'asc' | 'desc' | undefined>(undefined);

  const sortOrderFor = useCallback((key: string): 'ascend' | 'descend' | null => {
    if (sortBy !== key || !sortDir) return null;
    return sortDir === 'asc' ? 'ascend' : 'descend';
  }, [sortBy, sortDir]);

  const handleSort = useCallback((field: string, direction: 'asc' | 'desc' | null) => {
    setSortBy(direction ? field : undefined);
    setSortDir(direction ?? undefined);
    setPage(1);
  }, []);

  const [dataSource, setDataSource] = useState<DryPort[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<DryPort | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailFiles, setDetailFiles] = useState<any[]>([]);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<DryPort | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRecord, setRejectingRecord] = useState<DryPort | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvingRecord, setApprovingRecord] = useState<DryPort | null>(null);

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const orgMap = useMemo(() => {
    const map = new Map<string, string>();
    organizations.forEach((o) => map.set(o.id, o.code ? `${o.code} - ${o.name}` : o.name));
    return map;
  }, [organizations]);

  const [symbolMap, setSymbolMap] = useState<Map<string, string>>(new Map());
  const [symbolImageMap, setSymbolImageMap] = useState<Map<string, string>>(new Map());
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
  const [rawUsers, setRawUsers] = useState<any[]>([]);
  const userOrgMap = useMemo(() => {
    const map = new Map<string, string>();
    rawUsers.forEach((u: any) => {
      const orgName =
        u.organizationName ||
        u.orgUnitName ||
        u.departmentName ||
        (u.orgUnitId ? orgMap.get(u.orgUnitId) : undefined) ||
        (u.organizationId ? orgMap.get(u.organizationId) : undefined);
      if (orgName) {
        if (u.id) {
          map.set(u.id, orgName);
          map.set(u.id.toLowerCase(), orgName);
        }
        if (u.username) {
          map.set(u.username, orgName);
          map.set(u.username.toLowerCase(), orgName);
        }
        if (u.fullName) {
          map.set(u.fullName, orgName);
          map.set(u.fullName.toLowerCase(), orgName);
        }
      }
    });
    return map;
  }, [rawUsers, orgMap]);
  const defaultOrgApplied = useRef(false);
  const defaultOrgUnitId = useRef<string | undefined>(undefined);
  const [orgUnitReady, setOrgUnitReady] = useState(false);

  // ── History state ──
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<DryPort | null>(null);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilters, setHistoryFilters] = useState<{ keyword: string; fromDate?: string; toDate?: string }>({ keyword: '' });

  const openHistory = useCallback(async (r: DryPort) => {
    setHistoryTarget(r);
    setHistoryOpen(true);
    setHistoryRecords([]);
    setHistoryFilters({ keyword: '' });
    if (r.approvalStatus === 'DRAFT' || (r as any).status === 'DRAFT') {
      setHistoryLoading(false);
      return;
    }
    setHistoryLoading(true);
    try {
      const d = await fetchDryPortHistory(r.id, { page: 0, size: 200 });
      const raw = Array.isArray(d?.changeHistory) ? d.changeHistory : Array.isArray(d) ? d : [];
      const ch = raw.filter((it: any) => it.fieldName !== 'CREATE' && it.changedField !== 'CREATE');
      setHistoryRecords(ch);
    } catch {
      toast.error('Không thể tải lịch sử thay đổi');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const filteredHistory = useMemo(() => {
    const q = (historyFilters.keyword || '').trim().toLowerCase();
    const from = historyFilters.fromDate || '';
    const to = historyFilters.toDate || '';
    return (Array.isArray(historyRecords) ? historyRecords : []).filter((r: any) => {
      const fn = String(r?.fieldName || r?.changedField || '').trim();
      if (EXCLUDED_CHANGE_FIELDS.has(fn)) return false;
      const prevVal = r?.previousValue ?? r?.oldValue;
      const newVal = r?.newValue ?? r?.value;
      if (prevVal != null && newVal != null) {
        if (prevVal === newVal) return false;
        if (NUMERIC_HISTORY_FIELDS.has(fn)) {
          const oldN = Number(prevVal);
          const newN = Number(newVal);
          if (!isNaN(oldN) && !isNaN(newN) && oldN === newN) return false;
        }
      }
      if (q) {
        const ov = String(prevVal ?? '').toLowerCase();
        const nv = String(newVal ?? '').toLowerCase();
        const lb = historyFieldName(fn).toLowerCase();
        const od = historyFieldValue(fn, prevVal, orgMap, symbolMap).toLowerCase();
        const nd = historyFieldValue(fn, newVal, orgMap, symbolMap).toLowerCase();
        if (!fn.toLowerCase().includes(q) && !ov.includes(q) && !nv.includes(q) && !lb.includes(q) && !od.includes(q) && !nd.includes(q)) return false;
      }
      if (from || to) {
        const cd = String(r?.changedAt ?? r?.createdAt ?? r?.approvedDate ?? '').substring(0, 10);
        if (from && cd < from) return false;
        if (to && cd > to) return false;
      }
      return true;
    });
  }, [historyRecords, historyFilters, orgMap, symbolMap]);
  const hasActiveHistoryFilter = Boolean(historyFilters.keyword?.trim() || historyFilters.fromDate || historyFilters.toDate);

  const renderDryPortHistoryTimeline = (records: any[]) => {
    return renderStandardHistoryCards({
      records,
      fieldLabels: HISTORY_FIELD_LABELS,
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
        const formatted = historyFieldValue(fn, raw, orgMap, symbolMap);
        return isBlankOrDash(formatted) ? '' : formatted;
      },
      resolveUnitName: (rec) => {
        const actor = String(
          rec.changedBy ||
          rec.changedByName ||
          rec.actor ||
          rec.userName ||
          rec.createdBy ||
          rec.approvedBy ||
          ''
        ).trim();
        const userUnit =
          userOrgMap.get(actor) ||
          userOrgMap.get(actor.toLowerCase()) ||
          rec.orgUnitName ||
          rec.unitName;
        if (userUnit) return userUnit.split(' - ').pop() || userUnit;
        const orgId = rec.orgUnitId;
        const orgName = orgId ? orgMap.get(orgId) : undefined;
        return (orgName ? (orgName.split(' - ').pop() || orgName) : (rec.orgUnitName || rec.unitName)) || '';
      },
      emptyMessage: hasActiveHistoryFilter ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận',
    });
  };

  const historyUpdateCount = useMemo(() => {
    return countStandardHistoryCards({
      records: filteredHistory,
      fieldLabels: HISTORY_FIELD_LABELS,
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
        const formatted = historyFieldValue(fn, raw, orgMap, symbolMap);
        return isBlankOrDash(formatted) ? '' : formatted;
      },
      resolveUnitName: (rec) => {
        const actor = String(
          rec.changedBy ||
          rec.changedByName ||
          rec.actor ||
          rec.userName ||
          rec.createdBy ||
          rec.approvedBy ||
          ''
        ).trim();
        const userUnit =
          userOrgMap.get(actor) ||
          userOrgMap.get(actor.toLowerCase()) ||
          rec.orgUnitName ||
          rec.unitName;
        if (userUnit) return userUnit.split(' - ').pop() || userUnit;
        const orgId = rec.orgUnitId;
        const orgName = orgId ? orgMap.get(orgId) : undefined;
        return (orgName ? (orgName.split(' - ').pop() || orgName) : (rec.orgUnitName || rec.unitName)) || '';
      },
    });
  }, [filteredHistory, orgMap, symbolMap, symbolImageMap, historyTarget, userOrgMap]);

  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [updateDrawerOpen, setUpdateDrawerOpen] = useState(false);
  const [formEditId, setFormEditId] = useState<string | undefined>();
  const [editingName, setEditingName] = useState<string | undefined>();
  const [editingRecord, setEditingRecord] = useState<DryPort | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionType, setActionType] = useState<'draft' | 'submit' | 'approve'>('draft');

  const [createForm] = Form.useForm();
  const [updateForm] = Form.useForm();
  const createFormRef = useRef<DryPortFormHandle>(null);
  const updateFormRef = useRef<DryPortFormHandle>(null);

  useEffect(() => {
    (async () => {
      try {
        const isIframe = window.self !== window.top;
        const parentOrgUnits = isIframe ? (window.parent as any)?.kchtOrgUnits : undefined;
        let orgs: Organization[] = [];
        if (parentOrgUnits && parentOrgUnits.length > 0) {
          orgs = parentOrgUnits;
        } else {
          const r = await organizationService.list({ pageSize: 1000 });
          orgs = r.data || [];
        }
        setOrganizations(orgs);
        if (orgs.length > 0 && !defaultOrgApplied.current) {
          defaultOrgApplied.current = true;
          const currentUser = authUser || useAuthStore.getState().user;
          let resolvedDefault = resolveDefaultOrgUnitId(currentUser, orgs);
          if (!resolvedDefault && !currentUser?.orgUnitId) {
            try {
              const profileRes = await api.get('/users/me');
              const profile = (profileRes as any)?.data?.data ?? (profileRes as any)?.data;
              if (profile?.orgUnitId) {
                resolvedDefault = resolveDefaultOrgUnitId(profile, orgs) || profile.orgUnitId;
              }
            } catch {
              // ignore
            }
          }
          defaultOrgUnitId.current = resolvedDefault;
          setFilterOrgUnitId(resolvedDefault);
        }
      } catch { /* ignore */ }
      finally { setOrgUnitReady(true); }
    })();
    symbolService.list({ page: 1, pageSize: 1000, status: 'active' }).then(r => {
      const list = r.data || [];
      const map = new Map<string, string>();
      const imgMap = new Map<string, string>();
      list.forEach((s: any) => { map.set(s.id, s.name); if (s.image) imgMap.set(s.id, s.image); });
      setSymbolMap(map);
      setSymbolImageMap(imgMap);
    }).catch(() => { });
    userService.list({ pageSize: 1000 }).then(r => {
      const users = r.data || (r as any).content || [];
      setRawUsers(users);
      const umap = new Map<string, string>();
      users.forEach((u: any) => {
        const name = u.fullName || u.username || '';
        if (name && !isUuidString(name)) {
          umap.set(u.id, name);
          umap.set(u.id.toLowerCase(), name);
          if (u.username) umap.set(u.username, name);
        }
      });
      setUserMap(umap);
    }).catch(() => { });
  }, [authUser]);

  const fetchCounts = useCallback(async (orgIdOverride?: string) => {
    try {
      const targetOrg = orgIdOverride !== undefined ? orgIdOverride : filterOrgUnitId;
      const orgParam = targetOrg && targetOrg !== '__all__' ? targetOrg : undefined;
      const baseFilterParams = {
        orgUnitId: orgParam,
        ...normalizeDryPortIdentityFilters(search, filterCode),
        provinceId: filterProvince,
        region: filterRegion,
        portStatus: filterStatus,
        updatedFrom: filterUpdatedFrom,
        updatedTo: filterUpdatedTo,
        transportCorridor: filterTransportCorridor ? filterTransportCorridor.trim() : undefined,
      };
      const rs = await Promise.allSettled(
        TAB_STATUS_LIST.map((t) =>
          fetchDryPortList({
            page: 1,
            size: 1,
            ...baseFilterParams,
            approvalStatus: TAB_QUERY_MAP[t.key],
          })
        )
      );
      const c: Record<string, number> = {};
      rs.forEach((r, i) => {
        const k = TAB_STATUS_LIST[i]?.key || 'all';
        c[k] = r.status === 'fulfilled' ? r.value.total : 0;
      });
      const allChildSum = TAB_STATUS_LIST
        .filter((t) => t.key !== 'all')
        .reduce((acc, t) => acc + (c[t.key] ?? 0), 0);
      c['all'] = allChildSum;
      setTabCounts(c);
    } catch { /* ignore */ }
  }, [filterOrgUnitId, search, filterCode, filterProvince, filterRegion, filterStatus, filterTransportCorridor, filterUpdatedFrom, filterUpdatedTo]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await fetchDryPortList({
        page,
        size: pageSize,
        ...normalizeDryPortIdentityFilters(search, filterCode),
        orgUnitId: filterOrgUnitId === '__all__' ? undefined : filterOrgUnitId,
        provinceId: filterProvince,
        region: filterRegion,
        portStatus: filterStatus,
        updatedFrom: filterUpdatedFrom,
        updatedTo: filterUpdatedTo,
        transportCorridor: filterTransportCorridor ? filterTransportCorridor.trim() : undefined,
        approvalStatus: TAB_QUERY_MAP[activeTab],
        sortBy: (sortBy && sortBy !== 'stt' && sortBy !== 'sequenceNo') ? sortBy : 'updatedAt',
        sortDir: sortDir === 'asc' ? 'ASC' : (sortDir === 'desc' ? 'DESC' : undefined),
      });
      setDataSource(res.data);
      setTotal(res.total);
      if (activeTab && activeTab !== 'all') {
        setTabCounts((prev) => (prev[activeTab] === res.total ? prev : { ...prev, [activeTab]: res.total }));
      }
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, filterCode, filterOrgUnitId, filterProvince, filterRegion, filterStatus, filterUpdatedFrom, filterUpdatedTo, filterTransportCorridor, activeTab, sortBy, sortDir]);

  useEffect(() => { if (orgUnitReady) void fetchData(); }, [fetchData, orgUnitReady]);
  useEffect(() => { if (orgUnitReady) void fetchCounts(); }, [fetchCounts, orgUnitReady]);

  const handleFilterApply = useCallback(() => {
    setSearch((prev) => prev.trim());
    setFilterCode((prev) => (prev ? prev.trim() : prev));
    setPage(1);
    void fetchData();
    void fetchCounts(filterOrgUnitId);
  }, [fetchData, fetchCounts, filterOrgUnitId]);

  const handleFilterReset = useCallback(() => {
    const defaultOrg = defaultOrgUnitId.current;
    const resetOrg = defaultOrg === '__all__' ? undefined : defaultOrg;
    setSearch('');
    setFilterCode(undefined);
    setFilterProvince(undefined);
    setFilterRegion(undefined);
    setFilterStatus(undefined);
    setFilterUpdatedFrom(undefined);
    setFilterUpdatedTo(undefined);
    setFilterTransportCorridor(undefined);
    setFilterOrgUnitId(resetOrg);
    setActiveTab('all');
    setPage(1);
    void fetchCounts(resetOrg);
  }, [fetchCounts]);

  const openDetailModal = useCallback(async (record: DryPort) => {
    setDetailRecord(record);
    setDetailModalOpen(true);
    setDetailLoading(true);
    setDetailFiles([]);
    try {
      const atts = await fetchDryPortAttachmentList(record.id);
      setDetailFiles(atts);
    } catch {
      setDetailFiles([]);
    }
    try {
      const fresh = await fetchDryPortById(record.id);
      setDetailRecord(fresh);
    } catch { /* keep initial data */ }
    finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isEmbeddedAction || !linkedRecordId) return;
    let cancelled = false;
    fetchDryPortById(linkedRecordId)
      .then((record) => {
        if (cancelled) return;
        if (linkedAction === 'detail') {
          void openDetailModal(record);
        } else {
          setFormEditId(linkedRecordId);
          setEditingName(record.dryPortName || '');
          setEditingRecord(record);
          setUpdateDrawerOpen(true);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) toast.error(error instanceof Error ? error.message : 'Không tải được chi tiết cảng cạn');
      });
    return () => { cancelled = true; };
  }, [isEmbeddedAction, linkedAction, linkedRecordId, openDetailModal]);

  const notifyEmbeddedActionClosed = useCallback(() => {
    if (isEmbeddedAction) {
      window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, window.location.origin);
    }
  }, [isEmbeddedAction]);

  const closeEmbeddedDetail = useCallback(() => {
    setDetailModalOpen(false);
    setDetailRecord(null);
    notifyEmbeddedActionClosed();
  }, [notifyEmbeddedActionClosed]);

  const provinceName = useCallback((provinceId: number | null | undefined): string => {
    if (provinceId == null || provinceId < 1 || provinceId > VIETNAM_PROVINCES.length) return '';
    return VIETNAM_PROVINCES[provinceId - 1] || '';
  }, []);

  const openDeleteModal = useCallback((record: DryPort) => {
    setDeletingRecord(record);
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingRecord) return;
    setDeleteLoading(true);
    try {
      await deleteDryPort(deletingRecord.id);
      toast.success('Đã xóa cảng cạn');
      setDeleteModalOpen(false);
      setDeletingRecord(null);
      setSortBy(undefined); setSortDir(undefined);
      setPage(1);
      void fetchData();
      void fetchCounts(filterOrgUnitId);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingRecord, fetchData, fetchCounts, filterOrgUnitId]);

  const openApproveModal = useCallback((record: DryPort) => {
    setApprovingRecord(record);
    setApproveModalOpen(true);
  }, []);

  const handleConfirmApprove = useCallback(async () => {
    if (!approvingRecord) return;
    try {
      await approveDryPort(approvingRecord.id);
      toast.success('Đã phê duyệt');
      setSortBy(undefined); setSortDir(undefined);
      setPage(1);
      void fetchData();
      void fetchCounts(filterOrgUnitId);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
    } finally {
      setApproveModalOpen(false);
      setApprovingRecord(null);
    }
  }, [approvingRecord, fetchData, fetchCounts, filterOrgUnitId]);

  const openRejectModal = useCallback((record: DryPort) => {
    setRejectingRecord(record);
    setRejectReason('');
    setRejectError('');
    setRejectModalOpen(true);
  }, []);

  const handleConfirmReject = useCallback(async () => {
    if (!rejectingRecord) return;
    const reason = rejectReason.trim();
    if (!reason) {
      setRejectError('Vui lòng nhập lý do từ chối');
      return;
    }
    if (reason.length < 10) {
      setRejectError('Lý do từ chối phải có ít nhất 10 ký tự');
      return;
    }
    try {
      await rejectDryPort(rejectingRecord.id, reason);
      toast.success('Đã từ chối phê duyệt');
      setRejectModalOpen(false);
      setRejectingRecord(null);
      setRejectReason('');
      setRejectError('');
      setSortBy(undefined); setSortDir(undefined);
      setPage(1);
      void fetchData();
      void fetchCounts(filterOrgUnitId);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
    }
  }, [rejectingRecord, rejectReason, fetchData, fetchCounts, filterOrgUnitId]);

  const headerActions = useMemo(() => {
    const actions: any[] = [];
    if (hasPerm('dryport:create')) {

      actions.push({
        key: 'create',
        label: 'Thêm mới',
        variant: 'primary' as const,
        icon: <PlusOutlined />,
        onClick: () => {
          setFormEditId(undefined);
          setEditingRecord(null);
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
          setCreateDrawerOpen(true);
        },
      });
    }
    return actions;
  }, [hasPerm, createForm, authUser, organizations]);



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
    const base: any[] = [
      {
        key: 'sequenceNo',
        label: 'STT',
        width: 60,
        fixed: 'left' as const,
        align: 'center' as const,
        render: (_: unknown, __: DryPort, idx?: number) => (
          <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{(page - 1) * pageSize + (idx ?? 0) + 1}</span>
        ),
      },
      {
        key: 'dryPortName',
        label: 'Tên/Mã Cảng cạn',
        dataIndex: 'dryPortName',
        width: 260,
        fixed: 'left' as const,
        sortable: true,
        cellTitle: (record: DryPort) => record.dryPortName || '',
        render: (_: unknown, record: DryPort) => (
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <Tooltip title={record.dryPortName || undefined} placement="topLeft">
              <a
                title={record.dryPortName}
                onClick={() => openDetailModal(record)}
                style={{ ...cellTitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {record.dryPortName || ''}
              </a>
            </Tooltip>
            {record.dryPortCode && (
              <Tooltip title={record.dryPortCode} placement="topLeft">
                <span
                  title={record.dryPortCode}
                  style={{ ...cellSubtitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {record.dryPortCode}
                </span>
              </Tooltip>
            )}
          </div>
        ),
      },
      {
        key: 'orgUnitName',
        label: 'Đơn vị quản lý',
        dataIndex: 'orgUnitName',
        width: 260,
        sortable: true,
        cellTitle: (record: DryPort) => record.orgUnitName || '',
        render: (v: string | null | undefined) => renderCellWithTooltip(v, true),
      },
      {
        key: 'operatingUnit',
        label: 'Đơn vị khai thác',
        dataIndex: 'operatingUnit',
        width: 220,
        sortable: true,
        cellTitle: (record: DryPort) => {
          return record?.operatingOrgName
            || DEFAULT_OPERATING_ORGANIZATIONS.find((o) => o.id === record.operatingUnit || o.id === (record as any)?.operatingOrgId)?.name
            || record.operatingUnit
            || '';
        },
        render: (v: string | null | undefined, record: DryPort) => {
          const name = record?.operatingOrgName
            || DEFAULT_OPERATING_ORGANIZATIONS.find((o) => o.id === v || o.id === (record as any)?.operatingOrgId)?.name
            || v
            || '';
          return renderCellWithTooltip(name || null);
        },
      },
      {
        key: 'region',
        label: 'Khu vực',
        dataIndex: 'region',
        width: 170,
        sortable: true,
        cellTitle: (record: DryPort) => record.region || '',
        render: (v: string | null | undefined) => renderCellWithTooltip(v),
      },
      {
        key: 'transportCorridor',
        label: 'Hành lang vận tải',
        dataIndex: 'transportCorridor',
        width: 200,
        sortable: true,
        cellTitle: (record: DryPort) => record.transportCorridor || '',
        render: (v: string | null | undefined) => renderCellWithTooltip(v),
      },
      {
        key: 'portStatus',
        label: 'Tình trạng',
        dataIndex: 'portStatus',
        width: 240,
        ellipsis: false,
        cellTitle: (record: DryPort) => {
          const badge = trangThaiHoatDongBadge(record.portStatus, (record as any).operationalStatus);
          return badge.label;
        },
        render: (_: unknown, record: DryPort) => {
          const badge = trangThaiHoatDongBadge(record.portStatus, (record as any).operationalStatus);
          return <span style={badge.style}>{badge.label}</span>;
        },
      },
      {
        key: 'approvalStatus',
        label: 'Trạng thái',
        dataIndex: 'approvalStatus',
        width: 260,
        ellipsis: false,
        cellTitle: (record: DryPort) => {
          const isArchived = isDryPortDeleted(record);
          const badge = trangThaiPheDuyetBadge(isArchived ? 'ARCHIVED' : record.approvalStatus);
          return badge.label;
        },
        render: (_: unknown, record: DryPort) => {
          const isArchived = isDryPortDeleted(record);
          const badge = trangThaiPheDuyetBadge(isArchived ? 'ARCHIVED' : record.approvalStatus);
          return <span style={badge.style}>{badge.label}</span>;
        },
      },
      {
        key: 'updatedAt',
        dataIndex: 'updatedAt',
        label: 'Cán bộ cập nhật',
        width: 190,
        sortable: true,
        cellTitle: (record: DryPort) => {
          const rawName = formatUserDisplayName(record.updatedBy, (record as any).updatedByName, userMap, record.createdBy, (record as any).createdByName);
          return (rawName === '—' || rawName === '-') ? '' : rawName;
        },
        render: (_: unknown, record: DryPort) => {
          const rawName = formatUserDisplayName(record.updatedBy, (record as any).updatedByName, userMap, record.createdBy, (record as any).createdByName);
          const name = (rawName === '—' || rawName === '-') ? '' : rawName;
          const date = record.updatedAt || record.createdAt;
          const cleanDate = date ? formatDate(date) : '';
          return (
            <div style={{ lineHeight: '1.35', minWidth: 0, overflow: 'hidden' }}>
              {name ? (
                <Tooltip title={name} placement="topLeft">
                  <div title={name} style={{ fontWeight: fontWeightBold, color: textPrimary, fontSize: fontSizeMd, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {name}
                  </div>
                </Tooltip>
              ) : null}
              <div style={{ fontSize: fontSizeMd, color: textSecondary, whiteSpace: 'nowrap' }}>
                {cleanDate}
              </div>
            </div>
          );
        },
      },
    ];
    return base.map((col) => ({
      ...col,
      sortOrder: col.sortable ? sortOrderFor(col.key || col.dataIndex) : undefined,
    }));
  }, [page, pageSize, userMap, openDetailModal, activeTab, sortOrderFor]);

  const rowActions = useCallback((record: DryPort) => {
    const isArchived = isDryPortDeleted(record);
    if (isArchived) {
      const deletedActions: { key: string; label: string; icon?: React.ReactNode; onClick: () => void }[] = [
        { key: 'view', label: 'Xem chi tiết', icon: icons.view, onClick: () => openDetailModal(record) },
      ];
      if (hasPerm('dryport:history')) {
        deletedActions.push({ key: 'history', label: 'Lịch sử', icon: icons.history, onClick: () => openHistory(record) });
      }
      return deletedActions;
    }

    const actions: { key: string; label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean }[] = [];
    const status = record.approvalStatus || '';
    const isDraft = status === 'DRAFT' || status === 'NHAP';
    actions.push({ key: 'view', label: 'Xem chi tiết', icon: icons.view, onClick: () => openDetailModal(record) });
    if (canEditApprovalRecord(record.approvalStatus, { hasPerm, resource: 'dryport' })) {
      actions.push({
        key: 'edit',
        label: 'Chỉnh sửa',
        icon: icons.edit,
        onClick: () => {
          setFormEditId(record.id);
          setEditingName(record.dryPortName);
          setEditingRecord(record);
          setUpdateDrawerOpen(true);
        },
      });
    }
    if (hasPerm('dryport:history')) actions.push({ key: 'history', label: 'Lịch sử', icon: icons.history, onClick: () => openHistory(record) });
    if (isDraft && (hasPerm('dryport:approvec1') || hasPerm('dryport:approvec2') || canSaveAndApprove)) {
      actions.push({ key: 'approve', label: 'Phê duyệt', icon: icons.approve, onClick: () => openApproveModal(record) });
    }
    if (canDeleteApprovalRecord(record.approvalStatus, { hasPerm, resource: 'dryport' })) actions.push({ key: 'delete', label: 'Xóa', icon: icons.delete, onClick: () => openDeleteModal(record), danger: true });
    return actions;
  }, [hasPerm, openHistory, openDetailModal, openApproveModal, openRejectModal, openDeleteModal]);

  const renderDetailContent = () => {
    if (!detailRecord) return null;
    if (detailLoading) return <LoadingSkeleton rows={6} />;
    return (
      <DryPortDetailContent
        selectedRecord={detailRecord}
        organizations={organizations}
        symbolMap={symbolMap}
        symbolImageMap={symbolImageMap}
        userMap={userMap}
        detailFiles={detailFiles}
        ddToDms={ddToDms}
        provinceName={provinceName}
      />
    );
  };

  const closeCreateDrawer = useCallback(() => {
    setCreateDrawerOpen(false);
    createForm.resetFields();
  }, [createForm]);

  const handleCreateSuccess = useCallback(() => {
    setCreateDrawerOpen(false);
    createForm.resetFields();
    setSortBy(undefined); setSortDir(undefined);
    setPage(1);
    void fetchData();
    void fetchCounts(filterOrgUnitId);
  }, [fetchData, fetchCounts, filterOrgUnitId, createForm]);

  const closeUpdateDrawer = useCallback(() => {
    setUpdateDrawerOpen(false);
    notifyEmbeddedActionClosed();
  }, [notifyEmbeddedActionClosed]);

  const handleUpdateSuccess = useCallback(() => {
    setUpdateDrawerOpen(false);
    setSortBy(undefined); setSortDir(undefined);
    setPage(1);
    void fetchData();
    void fetchCounts(filterOrgUnitId);
    notifyEmbeddedActionClosed();
  }, [fetchData, fetchCounts, filterOrgUnitId, notifyEmbeddedActionClosed]);

  const statusTabs = useMemo(() => {
    const allChildSum = TAB_STATUS_LIST
      .filter((t) => t.key !== 'all')
      .reduce((acc, t) => acc + (tabCounts[t.key] ?? 0), 0);

    return TAB_STATUS_LIST.map((tab) => {
      let count = tabCounts[tab.key] ?? 0;
      if (tab.key === 'all') {
        count = allChildSum;
      }
      return {
        key: tab.key,
        label: tab.label,
        count,
        color: tab.color,
        active: (activeTab || 'all') === tab.key,
      };
    });
  }, [tabCounts, activeTab]);



  const filterContent = (
    <>
      {/* ── Cơ bản: ĐVQL + Tên + Tình trạng ──────────────────── */}
      <div style={{ marginBottom: 12, marginTop: spaceMd }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
          Đơn vị quản lý
        </div>
        <FilterOrgUnitTreeSelect
          organizations={organizations}
          placeholder="Tất cả"
          allowClear
          value={filterOrgUnitId}
          onChange={(val) => { setFilterOrgUnitId(val); setPage(1); }}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
          Tên cảng cạn
        </div>
        <Input
          placeholder="Tìm theo tên cảng cạn"
          allowClear
          prefix={<SearchOutlined style={{ color: textTertiary }} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onBlur={() => setSearch((prev) => prev.trim())}
          onPressEnter={handleFilterApply}
          style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
          Tình trạng
        </div>
        <Select
          placeholder="Chọn tình trạng"
          allowClear
          value={filterStatus}
          onChange={(val) => { setFilterStatus(val); setPage(1); }}
          options={PORT_STATUS_OPTIONS}
          style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
        />
      </div>

      {/* ── Bộ lọc nâng cao: hiển thị khi filterCollapsed (chuẩn BuoyBerthListPage/AnchorageListPage) ───────── */}
      {filterCollapsed && (
        <>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
              Mã cảng cạn
            </div>
            <Input
              placeholder="Tìm theo mã cảng cạn"
              allowClear
              prefix={<SearchOutlined style={{ color: textTertiary }} />}
              value={filterCode}
              onChange={(e) => { setFilterCode(e.target.value); setPage(1); }}
              onBlur={() => setFilterCode((prev) => (prev ? prev.trim() : prev))}
              onPressEnter={handleFilterApply}
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
              Khu vực
            </div>
            <Select
              placeholder="Chọn khu vực"
              allowClear
              value={filterRegion}
              onChange={(val) => { setFilterRegion(val); setPage(1); }}
              options={REGION_OPTIONS}
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
              Hành lang vận tải
            </div>
            <Input
              placeholder="Tìm theo hành lang vận tải"
              allowClear
              value={filterTransportCorridor}
              onChange={(e) => { setFilterTransportCorridor(e.target.value); setPage(1); }}
              onPressEnter={handleFilterApply}
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
              Địa điểm (Tỉnh/Thành Phố)
            </div>
            <Select
              placeholder="Chọn tỉnh/thành phố"
              allowClear
              showSearch
              filterOption={(input, option) => normalizeSearchText(option?.label).includes(normalizeSearchText(input))}
              value={filterProvince}
              onChange={(val) => { setFilterProvince(val); setPage(1); }}
              options={VIETNAM_PROVINCES.map((p, i) => ({ value: i + 1, label: p }))}
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
              Ngày cập nhật
            </div>
            <DatePicker.RangePicker
              {...getRangePickerProps({
                value: (filterUpdatedFrom && filterUpdatedTo)
                  ? [dayjs(filterUpdatedFrom), dayjs(filterUpdatedTo)]
                  : (filterUpdatedFrom ? [dayjs(filterUpdatedFrom), null] : (filterUpdatedTo ? [null, dayjs(filterUpdatedTo)] : null)),
                onChange: (dates: any) => {
                  if (!dates || dates.length === 0 || (!dates[0] && !dates[1])) {
                    setFilterUpdatedFrom(undefined);
                    setFilterUpdatedTo(undefined);
                  } else {
                    setFilterUpdatedFrom(dates[0] ? dates[0].startOf('day').format('YYYY-MM-DD 00:00:00') : undefined);
                    setFilterUpdatedTo(dates[1] ? dates[1].endOf('day').format('YYYY-MM-DD 23:59:59') : undefined);
                  }
                  setPage(1);
                },
                style: { width: '100%', borderRadius: radiusPill, height: 40 },
              })}
            />
          </div>
        </>
      )}
    </>
  );

  return (
    <ThemeTokenProvider tokens={{ ...themeTokenChk, fontSizeMd: 13.5 }}>
      <div className="dry-port-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <style>{`
          .dry-port-page-wrapper,
          .dry-port-page-wrapper .ant-table,
          .dry-port-page-wrapper .ant-table-cell,
          .dry-port-page-wrapper .ant-table-thead > tr > th,
          .dry-port-page-wrapper .ant-tabs-tab,
          .dry-port-page-wrapper .ant-btn,
          .dry-port-page-wrapper .ant-input,
          .dry-port-page-wrapper .ant-select,
          .dry-port-page-wrapper .ant-select-selection-item,
          .dry-port-page-wrapper .ant-select-item,
          .dry-port-page-wrapper .ant-pagination,
          .dry-port-drawer-scope,
          .dry-port-drawer-scope .ant-drawer-title,
          .dry-port-drawer-scope .ant-tabs-tab,
          .dry-port-drawer-scope .ant-btn,
          .dry-port-drawer-scope .ant-input,
          .dry-port-drawer-scope .ant-select,
          .dry-port-drawer-scope .ant-table,
          .dry-port-drawer-scope .ant-form-item-label > label,
          .dry-port-modal-scope,
          .dry-port-modal-scope .ant-modal-title,
          .dry-port-modal-scope .ant-btn,
          .dry-port-modal-scope .ant-input,
          .dry-port-modal-scope .ant-form-item-label > label {
            font-size: 13.5px !important;
          }

          .dry-port-page-wrapper div:has(> button[aria-pressed]) {
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
          .dry-port-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar {
            height: 4px !important;
            display: block !important;
          }
          .dry-port-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-track {
            background: #f1f5f9 !important;
            border-radius: 999px !important;
          }
          .dry-port-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb {
            background: #cbd5e1 !important;
            border-radius: 999px !important;
          }
          .dry-port-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb:hover {
            background: #94a3b8 !important;
          }
          .dry-port-page-wrapper div:has(> button[aria-pressed]) > button {
            white-space: nowrap !important;
            flex-shrink: 0 !important;
            cursor: pointer !important;
            padding: 4px 2px !important;
          }
        `}</style>

        <ScreenHeader
          breadcrumb={[{ label: 'Quản lý tài sản KCHT hàng hải' }, { label: 'Cảng cạn' }]}
          actions={headerActions}
        />
        <FilterTableLayout
          filterContent={filterContent}
          statusTabs={statusTabs}
          onStatusTabChange={(key) => {
            setActiveTab(key);
            setPage(1);
          }}
          onFilterApply={handleFilterApply}
          onFilterReset={handleFilterReset}
          filterCollapsed={filterCollapsed}
          onToggleCollapse={() => setFilterCollapsed(!filterCollapsed)}
          loading={isLoading}
          error={isError}
          onRetry={fetchData}
        >
          <DataTable
            columns={columns}
            dataSource={dataSource}
            loading={isLoading}
            rowKey="id"
            rowActions={rowActions}
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

        {/* ── Detail Drawer ──────────────────────────────────────────── */}
        <AppDrawer
          width={DRAWER_WIDTH}
          rootClassName="dry-port-drawer-scope"
          className="dry-port-drawer-scope"
          title={<span style={drawerTitleStyle}>Chi tiết cảng cạn{detailRecord ? ` - ${detailRecord.dryPortName}` : ''}</span>}
          open={detailModalOpen}
          onClose={closeEmbeddedDetail}
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '0 24px 12px 24px', overflow: 'hidden' },
          }}
          footer={null}
        >
          {renderDetailContent()}
        </AppDrawer>

        {/* ── Create Drawer (3 buttons standard) ────────────────────── */}
        <AppDrawer
          width={DRAWER_WIDTH}
          rootClassName="dry-port-drawer-scope"
          className="dry-port-drawer-scope"
          title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>Thêm mới Cảng cạn</span>}
          open={createDrawerOpen}
          onClose={closeCreateDrawer}
          footer={
            <div style={drawerFooterStyle}>
              <Button
                onClick={() => {
                  setActionType('draft');
                  createFormRef.current?.submit('DRAFT');
                }}
                loading={submitting && actionType === 'draft'}
                style={outlineButtonStyle}
              >
                Lưu tạm
              </Button>
              {canSaveAndApprove && (
                <Button
                  type="primary"
                  onClick={() => {
                    setActionType('approve');
                    createFormRef.current?.submit('SAVE_AND_APPROVE');
                  }}
                  loading={submitting && actionType === 'approve'}
                  style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}
                >
                  Lưu và phê duyệt
                </Button>
              )}
            </div>
          }
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '0 24px 12px 24px' },
          }}
        >
          {createDrawerOpen && (
            <>
              <style>{requiredMarkStyle}</style>
              <Form form={createForm} layout="vertical">
                <DryPortForm
                  ref={createFormRef}
                  form={createForm}
                  onFinish={handleCreateSuccess}
                  onSubmittingChange={setSubmitting}
                />
              </Form>
            </>
          )}
        </AppDrawer>

        {/* ── Edit Drawer ────────────────────────────────────────────── */}
        <AppDrawer
          width={DRAWER_WIDTH}
          rootClassName="dry-port-drawer-scope"
          className="dry-port-drawer-scope"
          title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>Chỉnh sửa thông tin — {editingName || 'Cảng cạn'}</span>}
          open={updateDrawerOpen}
          onClose={closeUpdateDrawer}
          afterOpenChange={(open) => {
            if (!open) {
              setFormEditId(undefined);
              setEditingRecord(null);
              setEditingName('');
              updateForm.resetFields();
            }
          }}
          footer={
            <div style={drawerFooterStyle}>
              {(() => {
                const st = editingRecord?.approvalStatus ? String(editingRecord.approvalStatus).toUpperCase() : 'DRAFT';
                if (st === 'APPROVED' || st === 'APPROVED_LEVEL2') {
                  return canSaveAndApprove ? (
                    <Button
                      type="primary"
                      onClick={() => {
                        setActionType('approve');
                        updateFormRef.current?.submit('SAVE_AND_APPROVE');
                      }}
                      loading={submitting && actionType === 'approve'}
                      style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}
                    >
                      Lưu và phê duyệt
                    </Button>
                  ) : null;
                }
                return (
                  <>
                    <Button
                      onClick={() => {
                        setActionType('draft');
                        updateFormRef.current?.submit('DRAFT');
                      }}
                      loading={submitting && actionType === 'draft'}
                      style={outlineButtonStyle}
                    >
                      Lưu tạm
                    </Button>
                    {canSaveAndApprove && (
                      <Button
                        type="primary"
                        onClick={() => {
                          setActionType('approve');
                          updateFormRef.current?.submit('SAVE_AND_APPROVE');
                        }}
                        loading={submitting && actionType === 'approve'}
                        style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}
                      >
                        Lưu và phê duyệt
                      </Button>
                    )}
                  </>
                );
              })()}
            </div>
          }
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '0 24px 12px 24px' },
          }}
        >
          {formEditId && (
            <>
              <style>{requiredMarkStyle}</style>
              <Form form={updateForm} layout="vertical">
                <DryPortForm
                  ref={updateFormRef}
                  form={updateForm}
                  id={formEditId}
                  onFinish={handleUpdateSuccess}
                  onSubmittingChange={setSubmitting}
                />
              </Form>
            </>
          )}
        </AppDrawer>

        {/* ── History Drawer ────────────────────────────────────────── */}
        <AppDrawer
          width={DRAWER_WIDTH}
          rootClassName="dry-port-drawer-scope"
          className="dry-port-drawer-scope"
          mask
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Space size={spaceSm} style={{ alignItems: 'center' }}>
                <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
                <span style={drawerTitleStyle}>
                  {historyTarget ? `Lịch sử thay đổi — ${historyTarget.dryPortName}` : 'Lịch sử thay đổi'}
                </span>
                <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeLg - 1, fontWeight: fontWeightBold, background: `${colors.sidebarBg}15`, color: colors.sidebarBg, lineHeight: '20px' }}>
                  Tổng cộng {historyUpdateCount}
                </span>
              </Space>
            </div>
          }
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          footer={null}
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '16px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
          }}
        >
          <style>{`.history-dt-popup .ant-picker-now-btn { color: ${actionPrimary} !important; }`}</style>
          <div style={{ flexShrink: 0 }}>
            {!historyLoading && (
              <div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceMd }}>
                <Input
                  placeholder="Tìm kiếm nội dung thay đổi..."
                  allowClear
                  value={historyFilters.keyword || ''}
                  onChange={(e) => setHistoryFilters((p) => ({ ...p, keyword: e.target.value }))}
                  onBlur={() => setHistoryFilters((p) => ({ ...p, keyword: (p.keyword || '').trim() }))}
                  style={{ flex: 1, borderRadius: radiusPill, height: 40 }}
                />
                <DatePicker
                  placeholder="Từ ngày"
                  classNames={{ popup: { root: 'history-dt-popup' } }}
                  value={historyFilters.fromDate ? dayjs(historyFilters.fromDate) : null}
                  onChange={(d) => setHistoryFilters((p) => ({ ...p, fromDate: d ? d.format('YYYY-MM-DD') : '' }))}
                  style={{ width: 140, borderRadius: radiusPill, height: 40 }}
                  format="DD/MM/YYYY"
                />
                <DatePicker
                  placeholder="Đến ngày"
                  classNames={{ popup: { root: 'history-dt-popup' } }}
                  value={historyFilters.toDate ? dayjs(historyFilters.toDate) : null}
                  onChange={(d) => setHistoryFilters((p) => ({ ...p, toDate: d ? d.format('YYYY-MM-DD') : '' }))}
                  style={{ width: 140, borderRadius: radiusPill, height: 40 }}
                  format="DD/MM/YYYY"
                />
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}
                  onClick={() => { /* Lọc real-time theo từng thao tác nhập/chọn — giống Bến cảng */ }}
                >
                  Tìm kiếm
                </Button>
              </div>
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {historyLoading ? (
              <div style={{ padding: `${spaceMd}px 0` }}>
                <LoadingSkeleton rows={5} />
              </div>
            ) : historyRecords.length === 0 ? (
              <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
                <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
                <div style={{ color: textTertiary, fontSize: fontSizeMd }}>Chưa có thay đổi nào được ghi nhận</div>
              </div>
            ) : hasActiveHistoryFilter && historyUpdateCount === 0 ? (
              <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
                <SearchOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
                <div style={{ color: textTertiary, fontSize: fontSizeMd }}>Không tìm thấy kết quả phù hợp</div>
              </div>
            ) : (
              renderDryPortHistoryTimeline(filteredHistory)
            )}
          </div>
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
          itemType="cảng cạn"
          itemName={deletingRecord?.dryPortName}
          itemCode={deletingRecord?.dryPortCode}
        />

        {/* ── Reject Reason Modal ──────────────────────────────────── */}
        <Modal
          rootClassName="dry-port-modal-scope"
          title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Từ chối phê duyệt</span>}
          open={rejectModalOpen}
          onCancel={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); setRejectError(''); }}
          footer={[
            <Button key="cancel" onClick={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); setRejectError(''); }}
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
            <Button key="reject" type="primary" danger onClick={handleConfirmReject}
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Xác nhận từ chối</Button>,
          ]}
          width={480}
        >
          <div style={{ padding: '8px 0' }}>
            <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>Vui lòng nhập lý do từ chối cho cảng cạn:</p>
            {rejectingRecord && (
              <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>
                <strong style={{ color: textPrimary }}>{rejectingRecord.dryPortName}</strong>
              </p>
            )}
            <Input.TextArea placeholder="Nhập lý do từ chối (tối thiểu 10, tối đa 500 ký tự)..." value={rejectReason}
              onChange={(e) => { setRejectReason(e.target.value); setRejectError(''); }} rows={3} maxLength={500} showCount
              style={{ borderRadius: 8, fontSize: fontSizeMd }} />
            {rejectError && <div style={{ color: '#E34948', fontSize: fontSizeSm, marginTop: 4 }}>{rejectError}</div>}
          </div>
        </Modal>

        {/* ── Approve Modal ─────────────────────────────────────────── */}
        <ApprovalModal
          visible={approveModalOpen}
          level={approvingRecord?.approvalStatus === 'APPROVED_LEVEL1' ? 'c2' : 'c1'}
          onConfirm={() => { if (approvingRecord) void handleConfirmApprove(); }}
          onCancel={() => { setApproveModalOpen(false); setApprovingRecord(null); }}
        />
      </div>
    </ThemeTokenProvider>
  );
}

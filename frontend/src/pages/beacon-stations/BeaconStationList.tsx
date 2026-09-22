import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import {
    AuditOutlined,
    BankOutlined,
    DownOutlined,
    EnvironmentOutlined,
    HistoryOutlined,
    PlusOutlined,
    RightOutlined,
    SearchOutlined,
    SlidersOutlined,
} from '@ant-design/icons';
import {
    Button,
    DatePicker,
    Form,
    Input,
    Modal,
    Select,
    Space,
    Tabs,
    Tooltip,
    Typography,
} from 'antd';
import { normalizeSafeNumber, fmtNum } from '../../utils/numFmt';
import { parseWktToCoordinates, serializeCoordinatesToWkt } from '../../utils/gisGeometry';
import EmptyState from '../../components/EmptyState';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import { DataTable, ScreenHeader } from '../../components/list-view';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import Pagination from '../../components/list-view/Pagination';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { FilterOrgUnitTreeSelect, normalizeSearchText, resolveDefaultOrgUnitId, resolveOrgSubtreeIds } from '../../components/org-unit';
import toast from '../../components/ToastNotification';
import { usePermissionStore, type PermissionState } from '../../store/permissionStore';
import { useAuthStore } from '../../store/authStore';
import { VIETNAM_PROVINCE_OPTIONS, getProvinceNameById } from '../../types/common';
import { portCRUD } from '../../services/portService';
import { symbolService, type Symbol as MapSymbol } from '../../services/symbolService';
import { canEditApprovalRecord } from '../../utils/approvalEditPolicy';
import { AppDrawer } from '../../components/shared/AppDrawer';
import ApprovalModal from '../../components/shared/ApprovalModal';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import DetailTable from '../../components/shared/DetailTable';
import DeleteConfirmModal from '../../components/shared/DeleteConfirmModal';
import InfrastructureAttachmentTab from '../../components/shared/InfrastructureAttachmentTab';
import { triggerBlobDownload } from '../../components/shared/infrastructureAttachmentUtils';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import api from '../../services/api';
import {
    approval,
    beaconHistory,
    beaconStationCRUD,
} from '../../services/beaconService';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../services/operatingOrganizationsData';
import type { Organization } from '../../services/organizationService';
import { organizationService } from '../../services/organizationService';
import { userService } from '../../services/userService';
import { DEFAULT_IGNORED_FIELDS } from '../../utils/changeHistoryRenderer';
import * as themeTokenChk from '../../themetokenchk';
import {
    DRAWER_TABLE_SCROLL_Y,
    DRAWER_WIDTH,
    actionPrimary,
    borderDefault,
    cellSubtitleStyle,
    cellTitleStyle,
    colors,
    drawerFooterStyle,
    drawerTitleStyle,
    fontSizeLg,
    fontSizeSm,
    fontWeightBold, fontWeightMedium,
    getRangePickerProps,
    historyAccentBarStyle,
    historyArrowStyle,
    historyChangeRowStyle,
    historyCreateRowStyle,
    historyFieldLabelStyle,
    historyGroupGridStyle,
    historyInfoCardStyle,
    historyInfoTitleStyle,
    historyMetaRowStyle,
    historyNewValueStyle,
    historyOldValueStyle,
    historyTimeStyle,
    inputStyle,
    outlineButtonStyle,
    primaryButtonStyle,
    radiusPill,
    requiredMarkStyle,
    selectStyle,
    spaceFormField,
    spaceMd,
    spaceSm,
    spaceXl,
    spaceXs,
    statusAttention,
    statusBadgeStyle,
    statusCritical,
    statusDraft,
    statusOperational,
    surfaceCard,
    textPrimary, textSecondary, textTertiary,
} from '../../themetokenchk';
import type { BeaconStation } from '../../types/beacon';
import {
    BEACON_LIGHT_TYPE_OPTIONS,
    BEACON_STATUS_MAP,
    type BeaconStatus,
} from '../../types/beacon';
import BeaconStationForm from './BeaconStationForm';

// Cỡ chữ màn /beacon-stations: 13.5px chuẩn /berth (bỏ token tĩnh themetokenchk fontSizeMd=13px).
const fontSizeMd = 13.5;

// Đơn vị vận hành — DropDownList chuẩn KCHT (SelectCateOther theo danh mục đơn vị vận hành)
const OPERATOR_OPTIONS = DEFAULT_OPERATING_ORGANIZATIONS.map((o) => ({ value: o.name, label: o.name }));

// ── GIS helpers (port VtsOperationCenterForm) ────────────────────────
const ddToDms = (dd?: number | null) => {
  if (dd === undefined || dd === null || isNaN(dd)) return { d: 0, m: 0, s: 0 };
  const abs = Math.abs(dd);
  let d = Math.floor(abs);
  let minFloat = (abs - d) * 60;
  if (minFloat > 59.999999999) { d += 1; minFloat = 0; }
  let m = Math.floor(minFloat);
  let sFloat = (minFloat - m) * 60;
  if (sFloat > 59.999999999) { m += 1; sFloat = 0; if (m >= 60) { m = 0; d += 1; } }
  let s = Math.round(sFloat * 100) / 100;
  if (s >= 60) { s = 0; m += 1; if (m >= 60) { m = 0; d += 1; } }
  return { d, m, s };
};


// ── Render giá trị GIS trong Lịch sử (chuẩn /vts-operation-center): WKT → summary loại + điểm DMS ──
const historyGisTypeLabel = (raw: string): string => {
  const up = (raw || '').trim().toUpperCase();
  if (up.startsWith('MULTIPOINT') || up.startsWith('POINT')) return 'Điểm';
  if (up.includes('LINESTRING') || up.startsWith('LINE')) return 'Đường';
  if (up.includes('POLYGON')) return 'Vùng';
  return raw || '';
};

const historyDmsText = (dec: number, isLat: boolean): string => {
  const { d, m, s } = ddToDms(dec);
  const dir = isLat ? (dec >= 0 ? 'N' : 'S') : (dec >= 0 ? 'E' : 'W');
  const sec = Math.round(s * 10) / 10;
  return `${d}° ${m}' ${Number.isInteger(sec) ? String(sec) : sec.toFixed(1)}" ${dir}`;
};

const renderHistoryCoordinates = (rawVal: string) => {
  const pts = parseWktToCoordinates(rawVal);
  const typeName = historyGisTypeLabel(rawVal);
  if (pts.length === 0) {
    return <span style={{ minWidth: 0, color: textPrimary, overflowWrap: 'anywhere' }}>{rawVal}</span>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
      <span style={{ fontSize: fontSizeSm, fontWeight: fontWeightBold, color: actionPrimary }}>
        {typeName}{pts.length > 1 ? ` (${pts.length} điểm)` : ''}
      </span>
      {pts.map((p, idx) => (
        <div key={idx} style={{ fontSize: fontSizeSm, color: textPrimary, lineHeight: 1.5 }}>
          <span style={{ color: textSecondary, marginRight: 4 }}>#{idx + 1}:</span>
          <span>{historyDmsText(p.latitude, true)}, {historyDmsText(p.longitude, false)}</span>
        </div>
      ))}
    </div>
  );
};

// ── Constants ────────────────────────────────────────────────────────

// Nhãn 6 trạng thái phê duyệt chuẩn của màn Đèn biển — một nguồn dùng chung cho tab trạng thái,
// badge chi tiết, nhật ký (khớp nhãn approval-2-level-spec mục 3.1; không lòi mã legacy ra UI)
const BEACON_APPROVAL_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Lưu tạm',
  PENDING_APPROVAL: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
  APPROVED_LEVEL1: 'Chờ phê duyệt cấp Cục',
  APPROVED: 'Đã phê duyệt',
  REJECTED_LEVEL1: 'Từ chối cấp Cảng vụ/Chi cục',
  REJECTED_LEVEL2: 'Từ chối cấp Cục',
  ARCHIVED: 'Đã xóa',
};

const STATUS_TAB_LIST = [
  { key: '', label: 'Tất cả', color: actionPrimary },
  { key: 'DRAFT', label: BEACON_APPROVAL_STATUS_LABELS.DRAFT, color: statusDraft },
  { key: 'PENDING_APPROVAL', label: BEACON_APPROVAL_STATUS_LABELS.PENDING_APPROVAL, color: actionPrimary },
  { key: 'APPROVED_LEVEL1', label: BEACON_APPROVAL_STATUS_LABELS.APPROVED_LEVEL1, color: statusAttention },
  { key: 'APPROVED', label: BEACON_APPROVAL_STATUS_LABELS.APPROVED, color: statusOperational },
  { key: 'REJECTED_LEVEL1', label: BEACON_APPROVAL_STATUS_LABELS.REJECTED_LEVEL1, color: statusCritical },
  { key: 'REJECTED_LEVEL2', label: BEACON_APPROVAL_STATUS_LABELS.REJECTED_LEVEL2, color: statusCritical },
  { key: 'ARCHIVED', label: BEACON_APPROVAL_STATUS_LABELS.ARCHIVED, color: statusCritical },
];

const TAB_QUERY_MAP: Record<string, BeaconStatus | undefined> = {
  '': undefined,
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED_LEVEL1: 'APPROVED_LEVEL1',
  APPROVED: 'APPROVED',
  REJECTED_LEVEL1: 'REJECTED_LEVEL1',
  REJECTED_LEVEL2: 'REJECTED_LEVEL2',
  ARCHIVED: 'DELETED',
};

// Status badge config — semantic token colors (AGENTS.md: no hardcoded hex)
// 6 nhãn chuẩn trạng thái phê duyệt (status-text-map-6-nhan-2026-08-26)
const BEACON_STATUS_STYLE_MAP: Record<string, { color: string; label: string }> = {
  DRAFT: { color: statusDraft, label: 'Lưu tạm' },
  PROPOSED: { color: statusAttention, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  PENDING: { color: statusAttention, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  PENDING_APPROVAL: { color: statusAttention, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  APPROVED_L1: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cục' },
  APPROVED_LEVEL1: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cục' },
  APPROVED_L2: { color: statusOperational, label: 'Đã phê duyệt' },
  APPROVED_LEVEL2: { color: statusOperational, label: 'Đã phê duyệt' },
  PUBLISHED: { color: statusOperational, label: 'Đã phê duyệt' },
  APPROVED: { color: statusOperational, label: 'Đã phê duyệt' },
  REJECTED: { color: statusCritical, label: 'Từ chối cấp Cảng vụ/Chi cục' },
  REJECTED_L1: { color: statusCritical, label: 'Từ chối cấp Cảng vụ/Chi cục' },
  REJECTED_LEVEL1: { color: statusCritical, label: 'Từ chối cấp Cảng vụ/Chi cục' },
  REJECTED_L2: { color: statusCritical, label: 'Từ chối cấp Cục' },
  REJECTED_LEVEL2: { color: statusCritical, label: 'Từ chối cấp Cục' },
  ARCHIVED: { color: statusCritical, label: 'Đã xóa' },
  DELETED: { color: statusCritical, label: 'Đã xóa' },
};

const BEACON_HISTORY_FIELD_ORDER = [
  'unitId', 'unitName', 'code', 'name', 'type', 'seaportId', 'operator',
  'provinceId', 'region', 'location', 'detailedLocation', 'operationalStatus',
  'towerHeight', 'lightHeight', 'lightRange', 'geographicRange',
  'towerColor', 'shape', 'structure', 'primaryLightModel', 'backupLightModel',
  'powerSupply', 'stationArea', 'area', 'staffCount',
  'commissionedDate', 'lastRepairDate', 'identifyingFeature',
  'geometryType', 'coordinates', 'mapSymbolId', 'coordinateSystem', 'displayRule',
  'rejectionReason', 'note', 'Tài liệu đính kèm',
];

// Tình trạng hoạt động — semantic tokens (integer enum khớp backend OperationalStatus)
const OPERATIONAL_STATUS_OPTIONS = [
  { value: 0, label: 'Chưa khai thác/vận hành' },
  { value: 1, label: 'Đang khai thác/vận hành' },
  { value: 2, label: 'Dừng khai thác/vận hành' },
];

const OPERATIONAL_STATUS_STYLE_MAP: Record<number, { color: string; label: string }> = {
  0: { color: statusAttention, label: 'Chưa khai thác/vận hành' },
  1: { color: statusOperational, label: 'Đang khai thác/vận hành' },
  2: { color: statusCritical, label: 'Dừng khai thác/vận hành' },
};

const GEOMETRY_TYPE_MAP: Record<string, string> = { POINT: 'Đối tượng điểm', LINE: 'Đối tượng đường', POLYGON: 'Đối tượng vùng' };

const COORD_SYS_MAP: Record<number, string> = { 1: 'WGS-84', 2: 'VN-2000' };

function formatDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  try { return dayjs(dateStr).format('DD/MM/YYYY HH:mm:ss'); } catch { return dateStr; }
}

function formatDateOnly(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  try {
    const d = dayjs(dateStr);
    return d.isValid() ? d.format('DD/MM/YYYY') : dateStr;
  } catch {
    return dateStr;
  }
}

// Định dạng ngày riêng cho bảng con tab 'Vận hành & bảo trì' — khớp /berth:
// khi trống trả chuỗi rỗng '' thay vì null (formatDate toàn cục giữ nguyên cho nơi khác).
function formatOperationTableDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try { return dayjs(dateStr).format('DD/MM/YYYY HH:mm:ss'); } catch { return ''; }
}

// Số hiển thị: hàng nghìn ngăn bằng dấu phẩy (,), phần thập phân dùng dấu chấm (.)
const formatNumber = (v: number | string | null | undefined, maxFractionDigits = 6): string | null => {
  if (v === null || v === undefined || v === '') return null;
  const safeStr = normalizeSafeNumber(v);
  if (!safeStr) return null;
  if (safeStr === '99999999999999999999') return '99,999,999,999,999,999,999';
  const n = Number(safeStr);
  if (!Number.isFinite(n) || safeStr.replace(/\./g, '').length > 15) {
    const parts = safeStr.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }
  return n.toLocaleString('en-US', { maximumFractionDigits: maxFractionDigits });
};

const rangeValue = (from: string, to: string): [Dayjs | null, Dayjs | null] | null =>
  from || to ? [from ? dayjs(from) : null, to ? dayjs(to) : null] : null;

// Tabs bar style — giữ sticky khi cuộn form dài (khớp pattern BerthForm.tsx)
const tabBarStyle: React.CSSProperties = {
  marginBottom: 0,
  paddingTop: 0,
  position: 'sticky',
  top: 0,
  zIndex: 1,
  background: surfaceCard,
};

// ── Component ────────────────────────────────────────────────────────

export default function BeaconStationList() {
  const currentUser = useAuthStore((s) => s.user);
  const hasPerm = usePermissionStore((s: PermissionState) => s.hasPermission);
  // "Lưu và phê duyệt" (duyệt thẳng cấp Cục) chỉ hiện khi tài khoản có quyền duyệt C2
  const canApproveDirect =
    hasPerm('beaconstation:approvec2')
    || hasPerm('data:approvec2');

  // ── Filter state ─────────────────────────────────────────────────
  const [inputName, setInputName] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterLightModel, setFilterLightModel] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterUnitId, setFilterUnitId] = useState<string | undefined>();
  const defaultOrgUnitId = useRef<string | undefined>(undefined);
  const defaultOrgApplied = useRef(false);
  const [orgUnitReady, setOrgUnitReady] = useState(false);
  const [filterSeaportId, setFilterSeaportId] = useState<string | undefined>();
  const [filterOperator, setFilterOperator] = useState('');
  const [filterProvinceId, setFilterProvinceId] = useState<string | undefined>();
  const [filterOperationalStatus, setFilterOperationalStatus] = useState<number | undefined>();
  const [filterCommissionedFrom, setFilterCommissionedFrom] = useState('');
  const [filterCommissionedTo, setFilterCommissionedTo] = useState('');
  const [filterUpdatedBy, setFilterUpdatedBy] = useState<string | undefined>();
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState('');
  const [filterUpdatedTo, setFilterUpdatedTo] = useState('');
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('');

  // ── Pagination ──────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // ── Sorting state (mặc định: Ngày cập nhật giảm dần) ───────────────
  const [sortField, setSortField] = useState<string | undefined>('updatedByName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>('desc');

  // ── Data ─────────────────────────────────────────────────────────
  const [dataSource, setDataSource] = useState<BeaconStation[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  // ── Organizations (form unit selector) ──────────────────────────
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [userOptions, setUserOptions] = useState<{ value: string; label: string }[]>([]);

  // ── Seaports (cảng biển) + GIS symbols ─────────────────────────
  const [seaports, setSeaports] = useState<{ id: string; portName?: string; portCode?: string; orgUnitId?: string }[]>([]);
  const filteredFilterSeaports = useMemo(() => {
    if (!filterUnitId || filterUnitId === '__all__') return seaports;
    const rawSet = resolveOrgSubtreeIds(organizations, filterUnitId);
    const normalizedSet = new Set<string>();
    rawSet.forEach((oId) => normalizedSet.add(String(oId).toLowerCase()));
    return seaports.filter((port) => port.orgUnitId && normalizedSet.has(String(port.orgUnitId).toLowerCase()));
  }, [seaports, organizations, filterUnitId]);
  const [symbols, setSymbols] = useState<MapSymbol[]>([]);

  // ── Drawer state ─────────────────────────────────────────────────
  const createFormRef = useRef<{ submit: (action: 'draft' | 'submit' | 'approved') => void }>(null);
  const editFormRef = useRef<{ submit: (action: 'draft' | 'submit' | 'approved') => void }>(null);
  const [createDrawerVisible, setCreateDrawerVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BeaconStation | null>(null);
  const [detailRecord, setDetailRecord] = useState<BeaconStation | null>(null);
  const [isDetailMode, setIsDetailMode] = useState(false);
  const [detailTechOpen, setDetailTechOpen] = useState(true);
  const [detailStationOpen, setDetailStationOpen] = useState(true);
  const [detailHandlingOpen, setDetailHandlingOpen] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [createForm] = Form.useForm();
  const [updateForm] = Form.useForm();
  const [actionType, setActionType] = useState<'draft' | 'submit' | 'approved'>('draft');
  const actionTypeRef = useRef<'draft' | 'submit' | 'approved'>('draft');
  const [activeTabKey, setActiveTabKey] = useState('general');
  const [detailFiles, setDetailFiles] = useState<any[]>([]);

  // ── Delete state ─────────────────────────────────────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<BeaconStation | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Approval state ───────────────────────────────────────────────
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submittingRecord, setSubmittingRecord] = useState<BeaconStation | null>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvingRecord, setApprovingRecord] = useState<BeaconStation | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRecord, setRejectingRecord] = useState<BeaconStation | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);
  const [approveLevel, setApproveLevel] = useState<'c1' | 'c2'>('c1');
  const [rejectLevel, setRejectLevel] = useState<'c1' | 'c2'>('c1');

  // ── History state ────────────────────────────────────────────────
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<BeaconStation | null>(null);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearchInput, setHistorySearchInput] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');
  const [historyPage, setHistoryPage] = useState(0);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);

  const orgMap = useMemo(() => {
    const map = new Map<string, string>();
    organizations.forEach((o) => map.set(o.id, o.name));
    return map;
  }, [organizations]);

  // ── GIS map modal (Rule 12: disabled mode for view) ─────────────
  const [gisModalOpen, setGisModalOpen] = useState(false);


  // ── Card thu gọn trong tab 'Vận hành & bảo trì' — accordion dọc chuẩn /berth ──
  // 3 section (Vận hành / Bảo trì / Sự cố) mở mặc định, gập/xoè theo state riêng.
  const [opsOperationOpen, setOpsOperationOpen] = useState(true);
  const [opsMaintenanceOpen, setOpsMaintenanceOpen] = useState(true);
  const [opsIncidentOpen, setOpsIncidentOpen] = useState(true);

  // ── Load organizations (for unit TreeSelect in the form & filter) ──
  // Tự chọn mặc định = đơn vị của user đang đăng nhập qua resolveDefaultOrgUnitId
  useEffect(() => {
    const loadOrgDefault = async () => {
      const isIframe = window.self !== window.top;
      const data = isIframe ? (window.parent as any)?.kchtOrgUnits : undefined;
      const orgs: any[] = data && data.length > 0
        ? data
        : ((await organizationService.getTree()) || []);
      setOrganizations(orgs);
      if (orgs.length > 0 && !defaultOrgApplied.current) {
        defaultOrgApplied.current = true;
        let resolvedOrgId: string | undefined = resolveDefaultOrgUnitId(currentUser, orgs);
        if (!resolvedOrgId && !currentUser?.orgUnitId) {
          try {
            const profileRes = await api.get('/users/me');
            const profile = (profileRes as any)?.data?.data ?? (profileRes as any)?.data;
            if (profile?.orgUnitId) {
              resolvedOrgId = resolveDefaultOrgUnitId(profile, orgs) || profile.orgUnitId;
            }
          } catch {
            // ignore
          }
        }
        if (!resolvedOrgId && data && data.length > 0) {
          resolvedOrgId = data[0]?.id;
        }
        defaultOrgUnitId.current = resolvedOrgId;
        setFilterUnitId(resolvedOrgId);
      }
      setOrgUnitReady(true);
    };
    void loadOrgDefault();
  }, [currentUser]);

  // ── Load users (for "Cán bộ cập nhật" filter + detail) ──────────
  useEffect(() => {
    (async () => {
      try {
        const resp = await userService.list({ pageSize: 1000 });
        const users = resp.data || (resp as any).content || [];
        setUserOptions(users.map((u: any) => ({ value: u.id, label: u.fullName || u.username || u.id })));
      } catch (err) {
        console.error('Failed to load users', err);
      }
    })();
  }, []);

  // ── Load seaports (cảng biển) + map symbols ──────────────────────
  useEffect(() => {
    (async () => {
      try {
        const opts = await portCRUD.getOptions();
        setSeaports(opts || []);
      } catch (err) {
        console.error('Failed to load seaports', err);
      }
    })();
    (async () => {
      try {
        const resp = await symbolService.list({ page: 1, pageSize: 1000, status: 'active' });
        setSymbols(resp.data || []);
      } catch (err) {
        console.error('Failed to load map symbols', err);
      }
    })();
  }, []);

  // ── Fetch tab counts (each tab = a separate search với ĐẦY ĐỦ bộ lọc đồng bộ như fetchData) ──
  const fetchCounts = useCallback(async (unitIdOverride?: string) => {
    try {
      const targetUnit = unitIdOverride !== undefined ? unitIdOverride : filterUnitId;
      const baseFilterParams = {
        name: filterName.trim() || undefined,
        code: filterCode.trim() || undefined,
        type: filterType,
        primaryLightModel: filterLightModel.trim() || undefined,
        unitId: (targetUnit && targetUnit !== '__all__') ? targetUnit : undefined,
        seaportId: filterSeaportId,
        operator: filterOperator.trim() || undefined,
        provinceId: filterProvinceId,
        operationalStatus: filterOperationalStatus,
        commissionedFrom: filterCommissionedFrom,
        commissionedTo: filterCommissionedTo,
        updatedBy: (filterUpdatedBy || '').trim() || undefined,
        updatedFrom: filterUpdatedFrom,
        updatedTo: filterUpdatedTo,
        page: 1,
        pageSize: 1,
      };
      const results = await Promise.allSettled(
        STATUS_TAB_LIST.map((tab) =>
          beaconStationCRUD.search({
            ...baseFilterParams,
            status: TAB_QUERY_MAP[tab.key],
          }),
        ),
      );
      const counts: Record<string, number> = {};
      results.forEach((result, idx) => {
        const tabKey = STATUS_TAB_LIST[idx]?.key || '';
        counts[tabKey] = result.status === 'fulfilled' ? result.value.total : 0;
      });
      const sumChildCounts = STATUS_TAB_LIST
        .filter((t) => t.key !== '')
        .reduce((acc, t) => acc + (counts[t.key] || 0), 0);
      counts[''] = sumChildCounts;
      setTabCounts(counts);
    } catch { /* silent */ }
  }, [
    filterUnitId,
    filterName,
    filterCode,
    filterType,
    filterLightModel,
    filterSeaportId,
    filterOperator,
    filterProvinceId,
    filterOperationalStatus,
    filterCommissionedFrom,
    filterCommissionedTo,
    filterUpdatedBy,
    filterUpdatedFrom,
    filterUpdatedTo,
  ]);

  // ── Fetch main data ─────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await beaconStationCRUD.search({
        name: filterName.trim() || undefined,
        code: filterCode.trim() || undefined,
        type: filterType,
        primaryLightModel: filterLightModel.trim() || undefined,
        status: filterStatus || TAB_QUERY_MAP[activeTab],
        unitId: (filterUnitId && filterUnitId !== '__all__') ? filterUnitId : undefined,
        seaportId: filterSeaportId,
        operator: filterOperator.trim() || undefined,
        provinceId: filterProvinceId,
        operationalStatus: filterOperationalStatus,
        commissionedFrom: filterCommissionedFrom,
        commissionedTo: filterCommissionedTo,
        updatedBy: (filterUpdatedBy || '').trim() || undefined,
        updatedFrom: filterUpdatedFrom,
        updatedTo: filterUpdatedTo,
        page,
        pageSize,
        sortBy: sortField,
        sortDir: sortField && sortOrder ? (sortOrder === 'asc' ? 'ASC' : 'DESC') : undefined,
      });
      setDataSource(res.data);
      setTotal(res.total);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [filterName, filterCode, filterLightModel, filterType, filterStatus, filterUnitId, filterSeaportId, filterOperator, filterProvinceId, filterOperationalStatus, filterCommissionedFrom, filterCommissionedTo, filterUpdatedBy, filterUpdatedFrom, filterUpdatedTo, activeTab, page, pageSize, sortField, sortOrder]);

  useEffect(() => { if (orgUnitReady) void fetchData(); }, [fetchData, orgUnitReady]);
  useEffect(() => { if (orgUnitReady) void fetchCounts(); }, [fetchCounts, orgUnitReady]);

  // ── Filter handlers ─────────────────────────────────────────────
  const handleFilterApply = useCallback(() => {
    setFilterName(inputName.trim());
    setFilterCode(inputCode.trim());
    setPage(1);
  }, [inputName, inputCode]);
  const handleFilterReset = useCallback(() => {
    setInputName(''); setInputCode('');
    setFilterName(''); setFilterCode(''); setFilterType(undefined);
    setFilterLightModel(''); setFilterStatus(undefined); setFilterSeaportId(undefined);
    const defaultOrg = defaultOrgUnitId.current;
    setFilterUnitId(defaultOrg);
    setFilterOperator(''); setFilterProvinceId(undefined); setFilterOperationalStatus(undefined);
    setFilterCommissionedFrom(''); setFilterCommissionedTo(''); setFilterUpdatedBy(undefined);
    setFilterUpdatedFrom(''); setFilterUpdatedTo('');
    setSortField('updatedByName'); setSortOrder('desc');
    setActiveTab(''); setPage(1);
  }, []);
  const handleTabChange = useCallback((key: string) => { setActiveTab(key); setPage(1); }, []);

  const handleSort = useCallback((field: string, order: 'asc' | 'desc' | null) => {
    if (!order) {
      setSortField('updatedByName');
      setSortOrder('desc');
    } else {
      setSortField(field);
      setSortOrder(order);
    }
    setPage(1);
  }, []);

  // ── Drawer handlers ─────────────────────────────────────────────
  const openCreateDrawer = useCallback(() => {
    if (!hasPerm('beaconstation:create')) {
      toast.error('Bạn không có quyền thêm mới đèn biển');
      return;
    }
    setEditingRecord(null);
    setIsDetailMode(false);
    setDetailRecord(null);
    createForm.resetFields();

    // Mặc định đơn vị quản lý theo tài khoản của người dùng đang tạo bản ghi mới
    const currentOrgUnitId = resolveDefaultOrgUnitId(currentUser, organizations)
      || (currentUser?.orgUnitId && currentUser.orgUnitId !== '00000000-0000-0000-0000-000000000017' && currentUser.orgUnitId !== 'G17' ? currentUser.orgUnitId : undefined);

    createForm.setFieldsValue({
      operationalStatus: 1,
      unitId: currentOrgUnitId,
    });

    if (!currentOrgUnitId && !currentUser?.orgUnitId) {
      api.get('/users/me')
        .then((res) => {
          const profile = res.data?.data ?? res.data;
          const uOrgId = profile?.orgUnitId;
          if (uOrgId && uOrgId !== '00000000-0000-0000-0000-000000000017' && uOrgId !== 'G17') {
            createForm.setFieldsValue({ unitId: uOrgId });
          }
        })
        .catch(() => {});
    }

    setCreateDrawerVisible(true);
  }, [createForm, hasPerm, currentUser, organizations]);

  const openEditDrawer = useCallback((record: BeaconStation) => {
    if (!canEditApprovalRecord(record.status || '', { hasPerm, resource: 'beaconstation', extraUpdatePerms: ['data:update'] })) {
      toast.error('Bạn không có quyền chỉnh sửa bản ghi này');
      return;
    }
    setEditingRecord(record);
    setIsDetailMode(false);
    setDetailRecord(null);
  }, [hasPerm]);

  const openDetailDrawer = useCallback(async (record: BeaconStation) => {
    if (!hasPerm('beaconstation:read') && !hasPerm('beaconstation:view')) {
      toast.error('Bạn không có quyền xem chi tiết đèn biển');
      return;
    }
    setDetailRecord(record);
    setEditingRecord(null);
    setIsDetailMode(true);
    setActiveTabKey('general');
    setDrawerVisible(true);
    setDetailFiles([]);
    try {
      const res = await beaconStationCRUD.findById(record.id);
      setDetailRecord(res);
    } catch {
      toast.error('Không thể tải thông tin chi tiết');
    }
    try {
      const files = await beaconStationCRUD.listAttachments(record.id);
      setDetailFiles(
        (files || []).map((f: any) => ({
          ...f,
          id: f.id || f.uid,
          fileType: f.contentType || f.fileType,
          uploadedDate: f.uploadedAt || f.uploadedDate,
        }))
      );
    } catch {
      setDetailFiles([]);
    }
  }, [hasPerm]);

  const closeDrawer = useCallback(() => {
    setDrawerVisible(false);
    setCreateDrawerVisible(false);
    setEditingRecord(null);
    setDetailRecord(null);
    setIsDetailMode(false);
    createForm.resetFields();
    updateForm.resetFields();
    setDetailFiles([]);
  }, [createForm, updateForm]);

  // Tải xuống file đính kèm (tab chi tiết)
  const handleDownloadAttachment = useCallback(async (attachmentId: string, name: string) => {
    const entityId = detailRecord?.id || editingRecord?.id;
    if (!entityId) {
      toast.error('Không tìm thấy bản ghi để tải tệp đính kèm');
      return;
    }
    try {
      const blob = await beaconStationCRUD.downloadAttachment(entityId, attachmentId);
      triggerBlobDownload(blob, name || 'attachment');
    } catch {
      toast.error('Không thể tải xuống tệp đính kèm');
    }
  }, [detailRecord, editingRecord]);

  // ── History (chuẩn /vts-operation-center & /vts-system: Drawer + paging server) ──
  const openHistory = useCallback((r: BeaconStation) => {
    if (!hasPerm('beaconstation:history')) {
      toast.error('Bạn không có quyền xem lịch sử');
      return;
    }
    setHistoryTarget(r); setHistoryOpen(true);
    setHistorySearchInput(''); setHistorySearch(''); setHistoryFrom(''); setHistoryTo('');
    setHistoryRecords([]); setHistoryPage(0); setHasMoreHistory(false); setLoadingMoreHistory(false);
    if (r.status === 'DRAFT' || r.approvalStatus === 'DRAFT') {
      setHistoryLoading(false);
    }
  }, [hasPerm]);

  // ── Delete handlers (chuẩn /berth) ──────────────────────────────
  const openDeleteConfirm = useCallback((record: BeaconStation) => {
    setDeletingRecord(record);
    setDeleteModalOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deletingRecord) return;
    setDeleteLoading(true);
    try {
      await beaconStationCRUD.delete(deletingRecord.id);
      toast.success('Đã xóa đèn biển');
      setDeleteModalOpen(false);
      setDeletingRecord(null);
      void fetchData();
      void fetchCounts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingRecord, fetchData, fetchCounts]);

  // ── Submit approval ─────────────────────────────────────────────
  const openSubmitModal = useCallback((record: BeaconStation) => { setSubmittingRecord(record); setSubmitModalOpen(true); }, []);
  const confirmSubmit = useCallback(async () => {
    if (!submittingRecord) return;
    try {
      await approval.submitForApproval(submittingRecord.id);
      toast.success('Đã gửi duyệt đèn biển');
      setSubmitModalOpen(false); setSubmittingRecord(null); closeDrawer();
      void fetchData(); void fetchCounts();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Gửi duyệt thất bại'); }
  }, [submittingRecord, fetchData, fetchCounts, closeDrawer]);

  // ── Approve L1 / L2 ─────────────────────────────────────────────
  const openApproveModal = useCallback((record: BeaconStation, level?: 'c1' | 'c2') => {
    const resolvedLevel: 'c1' | 'c2' = level ?? (record.status === 'APPROVED_LEVEL1' ? 'c2' : 'c1');
    setApproveLevel(resolvedLevel);
    setApprovingRecord(record); setApproveModalOpen(true);
  }, []);

  const confirmApprove = useCallback(async (content?: string) => {
    if (!approvingRecord) return;
    const approverId = useAuthStore.getState().user?.userId || 'system';
    const isL2 = approveLevel === 'c2' || approvingRecord.status === 'APPROVED_LEVEL1';
    try {
      const note = (content && content !== 'Đã phê duyệt') ? content : undefined;
      if (isL2) {
        await approval.approveL2(approvingRecord.id, approverId, note);
        toast.success('Đã phê duyệt cấp Cục');
      } else {
        await approval.approveL1(approvingRecord.id, approverId, note);
        toast.success('Đã phê duyệt cấp Cảng vụ/Chi cục');
      }
      setApproveModalOpen(false); setApprovingRecord(null);
      closeDrawer(); void fetchData(); void fetchCounts();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại'); }
  }, [approvingRecord, approveLevel, fetchData, fetchCounts, closeDrawer]);

  // ── Reject ──────────────────────────────────────────────────────
  const openRejectModal = useCallback((record: BeaconStation, level?: 'c1' | 'c2') => {
    const resolvedLevel: 'c1' | 'c2' = level ?? (record.status === 'APPROVED_LEVEL1' ? 'c2' : 'c1');
    setRejectLevel(resolvedLevel);
    setRejectingRecord(record); setRejectReason(''); setRejectModalOpen(true);
  }, []);

  const handleReject = useCallback(async () => {
    if (!rejectingRecord) return;
    const reason = rejectReason.trim() || 'Từ chối phê duyệt';
    setRejectLoading(true);
    try {
      await approval.reject(rejectingRecord.id, reason, useAuthStore.getState().user?.userId || 'system');
      toast.success(rejectLevel === 'c2' ? 'Đã từ chối phê duyệt cấp Cục' : 'Đã từ chối phê duyệt cấp Cảng vụ/Chi cục');
      setRejectModalOpen(false); setRejectingRecord(null); setRejectReason('');
      closeDrawer(); void fetchData(); void fetchCounts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
    } finally {
      setRejectLoading(false);
    }
  }, [rejectingRecord, rejectReason, rejectLevel, fetchData, fetchCounts, closeDrawer]);

  // ── Row actions (popup chuẩn themetokenchk — thứ tự: Xem chi tiết, Chỉnh sửa, Lịch sử,
  //  rồi nhóm Phê duyệt/Từ chối, cuối cùng Xóa) ──
  const rowActions = useCallback((record: BeaconStation) => {
    const isDeleted = Boolean(
      record.deletedAt ||
      record.deletedBy ||
      record.status === 'ARCHIVED' ||
      record.status === 'DELETED' ||
      record.approvalStatus === 'ARCHIVED'
    );
    if (isDeleted) {
      const actions: any[] = [];
      if (hasPerm('beaconstation:read') || hasPerm('beaconstation:view')) {
        actions.push({ key: 'view', label: 'Xem chi tiết', icon: themeTokenChk.icons.view, onClick: () => openDetailDrawer(record) });
      }
      if (hasPerm('beaconstation:history')) {
        actions.push({ key: 'history', label: 'Lịch sử', icon: themeTokenChk.icons.history, onClick: () => openHistory(record) });
      }
      return actions;
    }

    const st = record.status || '';
    const currentUserId = useAuthStore.getState().user?.userId;
    const creatorId = record.submittedBy || record.createdBy;
    const isCreator = Boolean(creatorId && currentUserId && String(creatorId) === String(currentUserId));
    const isApprover1 = Boolean(record.approverLevel1 && currentUserId && String(record.approverLevel1) === String(currentUserId));

    const actions: any[] = [];
    if (hasPerm('beaconstation:read') || hasPerm('beaconstation:view')) {
      actions.push({ key: 'view', label: 'Xem chi tiết', icon: themeTokenChk.icons.view, onClick: () => openDetailDrawer(record) });
    }
    // Quy tắc 12 (approval-2-level-spec.md mục 3.9)
    if (canEditApprovalRecord(st, { hasPerm, resource: 'beaconstation', extraUpdatePerms: ['data:update'] })) {
      actions.push({ key: 'edit', label: 'Chỉnh sửa', icon: themeTokenChk.icons.edit, onClick: () => openEditDrawer(record) });
    }
    if (hasPerm('beaconstation:history')) {
      actions.push({ key: 'history', label: 'Lịch sử', icon: themeTokenChk.icons.history, onClick: () => openHistory(record) });
    }
    // Nhóm phê duyệt / từ chối (đứng trước Xóa)
    if (['DRAFT', 'PROPOSED', 'REJECTED_LEVEL1', 'REJECTED_LEVEL2'].includes(st) && (hasPerm('beaconstation:update') || hasPerm('beaconstation:create'))) {
      actions.push({ key: 'submit', label: 'Gửi phê duyệt', icon: themeTokenChk.icons.submit, onClick: () => openSubmitModal(record) });
    }
    // Cấp 1 (Cảng vụ/Chi cục) - chống tự duyệt (4-eyes)
    if (hasPerm('beaconstation:approvec1') && (st === 'PENDING_APPROVAL' || st === 'PROPOSED') && !isCreator) {
      actions.push({ key: 'approveC1', label: 'Phê duyệt cấp Cảng vụ/Chi cục', icon: themeTokenChk.icons.approve, onClick: () => openApproveModal(record, 'c1') });
      actions.push({ key: 'rejectC1', label: 'Từ chối cấp Cảng vụ/Chi cục', icon: themeTokenChk.icons.reject, danger: true, onClick: () => openRejectModal(record, 'c1') });
    }
    // Cấp 2 (Cục) - người duyệt C1 không tự duyệt C2
    if (hasPerm('beaconstation:approvec2') && st === 'APPROVED_LEVEL1' && !isApprover1) {
      actions.push({ key: 'approveC2', label: 'Phê duyệt cấp Cục', icon: themeTokenChk.icons.approve, onClick: () => openApproveModal(record, 'c2') });
      actions.push({ key: 'rejectC2', label: 'Từ chối cấp Cục', icon: themeTokenChk.icons.reject, danger: true, onClick: () => openRejectModal(record, 'c2') });
    }
    if (st === 'DRAFT' && hasPerm('beaconstation:delete')) {
      actions.push({ key: 'delete', label: 'Xóa', icon: themeTokenChk.icons.delete, danger: true, onClick: () => openDeleteConfirm(record) });
    }
    return actions;
  }, [hasPerm, openDetailDrawer, openEditDrawer, openSubmitModal, openApproveModal, openRejectModal, openHistory, openDeleteConfirm]);

  // ── Table columns ───────────────────────────────────────────────
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

  const sortOrderFor = useCallback(
    (key: string): 'ascend' | 'descend' | null =>
      sortField === key && sortOrder ? (sortOrder === 'asc' ? 'ascend' : 'descend') : null,
    [sortField, sortOrder]
  );

  const columns: any[] = useMemo(() => [
    {
      key: 'sequenceNo', label: 'STT', width: 60, fixed: 'left' as const, align: 'center' as const,
      render: (_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd }}>{(page - 1) * pageSize + i + 1}</span>,
    },
    {
      key: 'name', label: 'Tên / Mã đèn biển', dataIndex: 'name', width: 260, fixed: 'left' as const, ellipsis: false,
      sortOrder: sortOrderFor('name'),
      cellTitle: (record: BeaconStation) => record.name || '',
      render: (name: string, record: BeaconStation) => {
        const canView = hasPerm('beaconstation:read') || hasPerm('beaconstation:view');
        return (
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {canView ? (
              <Tooltip title={name || undefined} placement="topLeft">
                <a
                  title={name}
                  onClick={() => openDetailDrawer(record)}
                  style={{
                    ...cellTitleStyle,
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {name || null}
                </a>
              </Tooltip>
            ) : (
              <Tooltip title={name || undefined} placement="topLeft">
                <span
                  title={name}
                  style={{
                    ...cellTitleStyle,
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    cursor: 'default',
                  }}
                >
                  {name || null}
                </span>
              </Tooltip>
            )}
            {record.code && (
              <Tooltip title={record.code} placement="topLeft">
                <span style={{ ...cellSubtitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={record.code}>
                  {record.code}
                </span>
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      key: 'unitName', label: 'Đơn vị quản lý', dataIndex: 'unitName', width: 300,
      sortOrder: sortOrderFor('unitName'),
      cellTitle: (record: BeaconStation) => record.unitName || '',
      render: (v: string) => renderCellWithTooltip(v, true),
    },
    {
      key: 'seaportId', label: 'Thuộc cảng biển', dataIndex: 'seaportId', width: 220, ellipsis: true,
      sortOrder: sortOrderFor('seaportId'),
      cellTitle: (record: BeaconStation) => seaports.find((p) => p.id === record.seaportId)?.portName || '',
      render: (v: string) => renderCellWithTooltip(seaports.find((p) => p.id === v)?.portName || null),
    },
    {
      key: 'operator', label: 'Đơn vị vận hành', dataIndex: 'operator', width: 280, ellipsis: true,
      sortOrder: sortOrderFor('operator'),
      cellTitle: (record: BeaconStation) => record.operator || '',
      render: (v: string) => renderCellWithTooltip(v),
    },
    {
      key: 'provinceId', label: 'Địa điểm (Tỉnh/TP)', dataIndex: 'provinceId', width: 230,
      sortOrder: sortOrderFor('provinceId'),
      cellTitle: (record: BeaconStation) => getProvinceNameById(record.provinceId != null ? Number(record.provinceId) : undefined) || '',
      render: (v: number) => renderCellWithTooltip(getProvinceNameById(v != null ? Number(v) : undefined) || null),
    },
    {
      key: 'operationalStatus', label: 'Tình trạng', dataIndex: 'operationalStatus', width: 230,
            render: (v: number) => {
        const s = OPERATIONAL_STATUS_STYLE_MAP[v];
        return s
          ? <span style={statusBadgeStyle(s.color)}>{s.label}</span>
          : null;
      },
    },
    {
      key: 'type', label: 'Cấp trạm đèn', dataIndex: 'type', width: 150,
      sortOrder: sortOrderFor('type'),
      cellTitle: (record: BeaconStation) => {
        const opt = BEACON_LIGHT_TYPE_OPTIONS.find((o) => o.value === record.type);
        return opt ? opt.label : (record.type || '');
      },
      render: (type: string) => {
        const opt = BEACON_LIGHT_TYPE_OPTIONS.find((o) => o.value === type);
        return renderCellWithTooltip(opt ? opt.label : (type || null));
      },
    },
    {
      key: 'status', label: 'Trạng thái', dataIndex: 'status', width: 300,
            render: (status: string, record: BeaconStation) => {
        const isDeleted = Boolean(
          record.deletedAt ||
          record.deletedBy ||
          status === 'ARCHIVED' ||
          status === 'DELETED' ||
          record.approvalStatus === 'ARCHIVED'
        );
        const displayStatus = isDeleted ? 'ARCHIVED' : status;
        const s = BEACON_STATUS_STYLE_MAP[displayStatus] || { color: textTertiary, label: displayStatus || null };
        return <span style={statusBadgeStyle(s.color)}>{s.label}</span>;
      },
    },
    {
      key: 'updatedByName', label: 'Cán bộ cập nhật', dataIndex: 'updatedByName', width: 220,
      sortOrder: sortOrderFor('updatedByName'),
      cellTitle: (record: BeaconStation) => record.updatedByName || userOptions.find((u) => u.value === record.updatedBy)?.label || '',
      render: (_: any, record: BeaconStation) => {
        const name = record.updatedByName || userOptions.find((u) => u.value === record.updatedBy)?.label;
        return (
          <div style={{ lineHeight: '1.35', overflow: 'hidden' }}>
            {name ? (
              <Tooltip title={name} placement="topLeft">
                <div
                  title={name}
                  style={{
                    fontWeight: fontWeightBold,
                    color: textPrimary,
                    fontSize: fontSizeMd,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {name}
                </div>
              </Tooltip>
            ) : (
              <div style={{ fontWeight: fontWeightBold, color: textPrimary, fontSize: fontSizeMd }}>—</div>
            )}
            <div style={{ fontSize: fontSizeMd, color: textSecondary, whiteSpace: 'nowrap' }}>
              {record.updatedAt ? dayjs(record.updatedAt).format('DD/MM/YYYY HH:mm:ss') : null}
            </div>
          </div>
        );
      },
    },
    {
      key: 'submittedByName', label: 'Cán bộ gửi phê duyệt', dataIndex: 'submittedByName', width: 220,
      sortOrder: sortOrderFor('submittedByName'),
      cellTitle: (record: BeaconStation) => record.submittedByName || '',
      render: (_: any, record: BeaconStation) => {
        const name = record.submittedByName;
        const date = record.submittedAt;
        return (
          <div style={{ lineHeight: '1.35', overflow: 'hidden' }}>
            {name ? (
              <Tooltip title={name} placement="topLeft">
                <div
                  title={name}
                  style={{
                    fontWeight: fontWeightBold,
                    color: textPrimary,
                    fontSize: fontSizeMd,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {name}
                </div>
              </Tooltip>
            ) : (
              <div style={{ fontWeight: fontWeightBold, color: textPrimary, fontSize: fontSizeMd }}>—</div>
            )}
            <div style={{ fontSize: fontSizeMd, color: textSecondary, whiteSpace: 'nowrap' }}>
              {date ? dayjs(date).format('DD/MM/YYYY HH:mm:ss') : null}
            </div>
          </div>
        );
      },
    },
    {
      key: 'approverLevel1Name', label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục', dataIndex: 'approverLevel1Name', width: 240,
      sortOrder: sortOrderFor('approverLevel1Name'),
      cellTitle: (record: BeaconStation) => record.approverLevel1Name || '',
      render: (_: any, record: BeaconStation) => {
        const name = record.approverLevel1Name;
        const date = record.approvedDateLevel1;
        return (
          <div style={{ lineHeight: '1.35', overflow: 'hidden' }}>
            {name ? (
              <Tooltip title={name} placement="topLeft">
                <div
                  title={name}
                  style={{
                    fontWeight: fontWeightBold,
                    color: textPrimary,
                    fontSize: fontSizeMd,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {name}
                </div>
              </Tooltip>
            ) : (
              <div style={{ fontWeight: fontWeightBold, color: textPrimary, fontSize: fontSizeMd }}>—</div>
            )}
            <div style={{ fontSize: fontSizeMd, color: textSecondary, whiteSpace: 'nowrap' }}>
              {date ? dayjs(date).format('DD/MM/YYYY HH:mm:ss') : null}
            </div>
          </div>
        );
      },
    },
    {
      key: 'approverLevel2Name', title: <span style={{ whiteSpace: 'nowrap' }}>Cán bộ phê duyệt cấp Cục</span>, dataIndex: 'approverLevel2Name', width: 300,
      sortOrder: sortOrderFor('approverLevel2Name'),
      cellTitle: (record: BeaconStation) => record.approverLevel2Name || '',
      render: (_: any, record: BeaconStation) => {
        const name = record.approverLevel2Name;
        const date = record.approvedDateLevel2;
        return (
          <div style={{ lineHeight: '1.35', overflow: 'hidden' }}>
            {name ? (
              <Tooltip title={name} placement="topLeft">
                <div
                  title={name}
                  style={{
                    fontWeight: fontWeightBold,
                    color: textPrimary,
                    fontSize: fontSizeMd,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {name}
                </div>
              </Tooltip>
            ) : (
              <div style={{ fontWeight: fontWeightBold, color: textPrimary, fontSize: fontSizeMd }}>—</div>
            )}
            <div style={{ fontSize: fontSizeMd, color: textSecondary, whiteSpace: 'nowrap' }}>
              {date ? dayjs(date).format('DD/MM/YYYY HH:mm:ss') : null}
            </div>
          </div>
        );
      },
    },
  ], [page, pageSize, openDetailDrawer, seaports, userOptions, hasPerm, sortOrderFor]);

  const tableData = useMemo(() => {
    let rows = dataSource;
    if (activeTab === '') {
      rows = rows.filter((item) => {
        const isDel = Boolean(
          item.deletedAt ||
          item.deletedBy ||
          item.status === 'ARCHIVED' ||
          item.status === 'DELETED' ||
          item.approvalStatus === 'ARCHIVED'
        );
        return !isDel;
      });
    }
    return rows.map((item, idx) => ({ ...item, _rowIndex: (page - 1) * pageSize + idx + 1 }));
  }, [dataSource, page, pageSize, activeTab]);

  // ── Filter panel content (markup div tay chuẩn /berth) ──
  const filterContent = (
    <>
      <div style={{ marginBottom: 12, marginTop: spaceMd }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Đơn vị quản lý</div>
        <FilterOrgUnitTreeSelect
          organizations={organizations}
          value={filterUnitId}
          onChange={(v) => {
            const nextUnit = (v as string) || '';
            setFilterUnitId(nextUnit);
            if (nextUnit && nextUnit !== '__all__' && filterSeaportId) {
              const rawSet = resolveOrgSubtreeIds(organizations, nextUnit);
              const normalizedSet = new Set<string>();
              rawSet.forEach((oId) => normalizedSet.add(String(oId).toLowerCase()));
              const valid = seaports.some((p) => p.id === filterSeaportId && !!p.orgUnitId && normalizedSet.has(String(p.orgUnitId).toLowerCase()));
              if (!valid) setFilterSeaportId(undefined);
            }
            setPage(1);
          }}
          placeholder="Tất cả"
          allowClear
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tên đèn biển</div>
        <Input placeholder="Nhập tên đèn biển" allowClear value={inputName}
          onChange={(e) => setInputName(e.target.value)}
          onPressEnter={handleFilterApply} style={inputStyle} />
      </div>

      {/* ── Bộ lọc nâng cao (ẩn, hiện khi bấm nút Filter) ── */}
      {filterCollapsed && (
        <>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Thuộc cảng biển</div>
            <Select placeholder="Tất cả cảng biển" allowClear value={filterSeaportId}
              onChange={(v) => { setFilterSeaportId(v); setPage(1); }}
              showSearch
              filterOption={(input, option) =>
                normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))
              }
              options={filteredFilterSeaports.map((p) => ({ value: p.id, label: p.portCode ? `${p.portCode} - ${p.portName || ''}` : (p.portName || p.id) }))}
              style={{ ...selectStyle, width: '100%' }} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Đơn vị vận hành</div>
            <Select placeholder="Tất cả đơn vị vận hành" allowClear showSearch optionFilterProp="label" value={filterOperator || undefined}
              onChange={(v) => { setFilterOperator(v || ''); setPage(1); }}
              options={OPERATOR_OPTIONS} style={{ ...selectStyle, width: '100%' }} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Chủng loại đèn chính</div>
            <Input placeholder="Nhập chủng loại đèn chính" allowClear value={filterLightModel}
              onChange={(e) => { setFilterLightModel(e.target.value); setPage(1); }}
              onPressEnter={handleFilterApply} style={inputStyle} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Mã đèn biển</div>
            <Input placeholder="Nhập mã đèn biển" allowClear value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              onPressEnter={handleFilterApply} style={inputStyle} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Cấp trạm đèn</div>
            <Select placeholder="Tất cả" allowClear value={filterType}
              onChange={(v) => { setFilterType(v); setPage(1); }}
              options={BEACON_LIGHT_TYPE_OPTIONS} style={{ ...selectStyle, width: '100%' }} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Thời điểm đưa vào sử dụng</div>
            <DatePicker.RangePicker
              {...getRangePickerProps({
                value: rangeValue(filterCommissionedFrom, filterCommissionedTo),
                onChange: (range: [Dayjs | null, Dayjs | null] | null) => { setFilterCommissionedFrom(range && range[0] ? range[0].format('YYYY-MM-DD') : ''); setFilterCommissionedTo(range && range[1] ? range[1].format('YYYY-MM-DD') : ''); setPage(1); },
              })}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tình trạng</div>
            <Select placeholder="Tất cả" allowClear value={filterOperationalStatus}
              onChange={(v) => { setFilterOperationalStatus(v); setPage(1); }}
              options={OPERATIONAL_STATUS_OPTIONS} style={{ ...selectStyle, width: '100%' }} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Cán bộ cập nhật</div>
            <Select placeholder="Chọn cán bộ cập nhật" allowClear showSearch optionFilterProp="label" value={filterUpdatedBy || undefined}
              onChange={(v) => { setFilterUpdatedBy(v || undefined); setPage(1); }}
              options={userOptions} style={{ ...selectStyle, width: '100%' }} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Ngày cập nhật</div>
            <DatePicker.RangePicker
              {...getRangePickerProps({
                value: rangeValue(filterUpdatedFrom, filterUpdatedTo),
                onChange: (range: [Dayjs | null, Dayjs | null] | null) => { setFilterUpdatedFrom(range && range[0] ? range[0].format('YYYY-MM-DD') : ''); setFilterUpdatedTo(range && range[1] ? range[1].format('YYYY-MM-DD') : ''); setPage(1); },
              })}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Địa điểm (Tỉnh/Thành phố)</div>
            <Select placeholder="Tất cả tỉnh/thành phố" allowClear value={filterProvinceId}
              onChange={(v) => { setFilterProvinceId(v); setPage(1); }}
              showSearch
              filterOption={(input, option) =>
                normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))
              }
              options={VIETNAM_PROVINCE_OPTIONS} style={{ ...selectStyle, width: '100%' }} />
          </div>
        </>
      )}
    </>
  );

  // ── Status tabs config (FilterTableLayout renders StatusTabs itself) ──
  const statusTabs = useMemo(() => {
    const allChildSum = STATUS_TAB_LIST
      .filter((t) => t.key !== '')
      .reduce((acc, t) => acc + (tabCounts[t.key] ?? 0), 0);

    return STATUS_TAB_LIST.map((tab) => {
      let count = tabCounts[tab.key] ?? 0;
      if (tab.key === '') {
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

  // ── Detail rows (57 trường theo checklist QL Đèn biển và nhà trạm) ──
  // Cấu trúc 6 tab: Thông tin chung (+ toggle 'Thông tin phê duyệt') | Thông tin kỹ thuật đèn biển
  // | Thông tin nhà trạm | Thông tin vị trí | File đính kèm | Các thông tin khác (3 toggle vận hành/bảo trì/sự cố)
  type DetailRow = { label: string; value: React.ReactNode; span?: boolean };

  const renderDetailRowsTwoCol = (rows: DetailRow[]) => {
    let colIndex = 0;
    return (
      <div className="chk-detail-grid" style={{ paddingTop: 4 }}>
        {rows.map((row) => {
          let labelCls: string;
          if (row.span) {
            labelCls = 'sec-full-label';
            colIndex = 0;
          } else {
            labelCls = colIndex % 2 === 0 ? 'sec-col1-label' : 'sec-col2-label';
            colIndex += 1;
          }
          return (
            <div key={row.label} className={row.span ? 'chk-detail-row chk-detail-row--full' : 'chk-detail-row'}>
              <span className={`chk-detail-label ${labelCls}`}>{row.label}</span>
              <span className="chk-detail-value">{row.value}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // Tab 1 — Thông tin cơ bản
  const detailBasicRows: DetailRow[] = detailRecord
    ? [
        { label: 'Mã đèn biển', value: <span style={statusBadgeStyle(actionPrimary)}>{detailRecord.code || null}</span> },
        { label: 'Tên đèn biển', value: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold }}>{detailRecord.name || null}</span> },
        { label: 'Đơn vị quản lý', value: <span style={{ fontWeight: fontWeightBold, color: textPrimary }}>{detailRecord.unitName || null}</span> },
        { label: 'Thuộc cảng biển', value: seaports.find((p) => p.id === detailRecord.seaportId)?.portName || null },
        { label: 'Đơn vị vận hành', value: detailRecord.operator || null },
        { label: 'Địa điểm (Tỉnh/TP)', value: getProvinceNameById(detailRecord.provinceId != null ? Number(detailRecord.provinceId) : undefined) || null },
        { label: 'Địa điểm chi tiết', value: detailRecord.detailedLocation || null, span: true },
        {
          label: 'Tình trạng',
          value: (() => {
            const s = detailRecord.operationalStatus != null ? OPERATIONAL_STATUS_STYLE_MAP[detailRecord.operationalStatus] : undefined;
            return s
              ? <span style={statusBadgeStyle(s.color)}>{s.label}</span>
              : null;
          })(),
        },
      ]
    : [];

  // Tab 2 — Thông tin kỹ thuật đèn biển
  const detailTechnicalRows: DetailRow[] = detailRecord
    ? [
        { label: 'Chủng loại đèn chính', value: detailRecord.primaryLightModel || null, span: true },
        { label: 'Chủng loại đèn dự phòng', value: detailRecord.backupLightModel || null, span: true },
        {
          label: 'Cấp trạm đèn',
          value: BEACON_LIGHT_TYPE_OPTIONS.find((o) => o.value === detailRecord.type)?.label || null,
        },
        { label: 'Địa bàn', value: detailRecord.region || null, span: true },
        { label: 'Đặc điểm nhận dạng', value: detailRecord.identifyingFeature || null, span: true },
        { label: 'Hình dạng', value: detailRecord.shape || null, span: true },
        { label: 'Chiều cao tháp đèn (m)', value: detailRecord.towerHeight != null ? formatNumber(detailRecord.towerHeight) : null },
        { label: 'Chiều cao tâm sáng (m)', value: detailRecord.lightHeight != null ? formatNumber(detailRecord.lightHeight) : null },
        { label: 'Tầm hiệu lực địa lý', value: detailRecord.geographicRange || null },
        { label: 'Tầm hiệu lực ánh sáng', value: detailRecord.lightRange != null ? formatNumber(detailRecord.lightRange) : null },
        { label: 'Màu sắc tháp đèn', value: detailRecord.towerColor || null, span: true },
        { label: 'Nguồn năng lượng', value: detailRecord.powerSupply || null, span: true },
        { label: 'Thời điểm đưa vào sử dụng', value: formatDateOnly(detailRecord.commissionedDate) },
        { label: 'Thời điểm sửa chữa gần nhất', value: formatDateOnly(detailRecord.lastRepairDate) },
      ]
    : [];

  // Tab 3 — Thông tin nhà trạm
  const detailStationRows: DetailRow[] = detailRecord
    ? [
        { label: 'Địa điểm đặt trạm đèn', value: detailRecord.location || null },
        { label: 'Kết cấu', value: detailRecord.structure || null },
        { label: 'Diện tích (m²)', value: detailRecord.area != null ? formatNumber(detailRecord.area) : null },
        { label: 'Diện tích sử dụng trạm đèn (m²)', value: detailRecord.stationArea != null ? formatNumber(detailRecord.stationArea) : null },
        { label: 'Số lượng nhân sự bố trí', value: detailRecord.staffCount != null ? String(detailRecord.staffCount) : null },
        { label: 'Ghi chú', value: detailRecord.note || null },
      ]
    : [];

  // Tab 'Thông tin vị trí' — chuẩn /vts-operation-center: 4 dòng GIS meta (chk-detail-grid)
  // + khối 'Tọa độ GPS' (DetailTable DMS) + nút mở bản đồ (modal GIS disabled)
  const detailGisCoords = useMemo(() => {
    if (!detailRecord) return [];
    const pts = parseWktToCoordinates(detailRecord.coordinates || '');
    if (pts.length > 0) return pts;
    if (detailRecord.latitude != null && detailRecord.longitude != null) {
      return [{ latitude: detailRecord.latitude, longitude: detailRecord.longitude }];
    }
    return [];
  }, [detailRecord]);

  const detailGisMetaRows: DetailRow[] = detailRecord
    ? [
        { label: 'Loại đối tượng', value: GEOMETRY_TYPE_MAP[detailRecord.geometryType || ''] || detailRecord.geometryType || '' },
        {
          label: 'Biểu tượng',
          value: (() => {
            const sym = symbols.find((s) => s.id === detailRecord.mapSymbolId || s.code === detailRecord.mapSymbolId);
            if (!sym) return null;
            const ext = sym as { name?: string; code?: string; image?: string };
            const imgSrc = ext.image
              ? (ext.image.startsWith('data:') || ext.image.startsWith('http') || ext.image.startsWith('/')
                  ? ext.image
                  : `data:image/png;base64,${ext.image}`)
              : undefined;
            return (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: spaceSm }}>
                {imgSrc ? (
                  <img
                    src={imgSrc}
                    alt={ext.name || ''}
                    style={{ width: 20, height: 20, objectFit: 'contain', display: 'inline-block' }}
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                ) : null}
                <span>{ext.code ? `${ext.name} (${ext.code})` : ext.name}</span>
              </span>
            );
          })(),
        },
        { label: 'Hệ quy chiếu', value: (detailRecord.coordinateSystem != null ? COORD_SYS_MAP[detailRecord.coordinateSystem] : undefined) || '' },
        { label: 'Quy tắc hiển thị', value: (() => { const hasGeom = !!detailRecord.geometryType || !!detailRecord.coordinates || detailRecord.latitude != null || detailRecord.longitude != null; return hasGeom ? (detailRecord.displayRule || 'Độ, phút, giây (DMS)') : ''; })() },
      ]
    : [];

  // Tab 'Xử lý & theo dõi' — chuẩn màn /cctv: 12 dòng chk-detail-grid
  // (Nội dung phê duyệt đặt trước Ngày/Cán bộ từng cấp; Lý do từ chối; dòng dài full-width)
  const detailHandlingRows: DetailRow[] = detailRecord
    ? [
        {
          label: 'Trạng thái',
          span: true,
          value: (() => {
            const isDel = Boolean(detailRecord.deletedAt || detailRecord.deletedBy || detailRecord.status === 'ARCHIVED' || detailRecord.status === 'DELETED');
            if (isDel) {
              const s = BEACON_STATUS_STYLE_MAP.ARCHIVED || { color: statusCritical, label: 'Đã xóa' };
              return <span style={statusBadgeStyle(s.color)}>{s.label}</span>;
            }
            return <ApprovalStatusBadge status={detailRecord.status} labelOverrides={BEACON_APPROVAL_STATUS_LABELS} />;
          })(),
        },
        { label: 'Cán bộ cập nhật', value: <span style={{ fontWeight: fontWeightBold }}>{detailRecord.updatedByName || userOptions.find((u) => u.value === detailRecord.updatedBy)?.label || null}</span> },
        { label: 'Ngày cập nhật', value: formatDate(detailRecord.updatedAt || detailRecord.createdAt) },
        { label: 'Cán bộ gửi phê duyệt', value: <span style={{ fontWeight: fontWeightBold }}>{detailRecord.submittedByName || null}</span> },
        { label: 'Ngày gửi phê duyệt', value: formatDate(detailRecord.submittedAt) },
        { label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục', value: <span style={{ fontWeight: fontWeightBold }}>{detailRecord.approverLevel1Name || null}</span> },
        { label: 'Ngày phê duyệt cấp Cảng vụ/Chi cục', value: formatDate(detailRecord.approvedDateLevel1) },
        { label: 'Nội dung phê duyệt cấp Cảng vụ/Chi cục', value: detailRecord.approvalContentLevel1 || null, span: true },
        { label: 'Cán bộ phê duyệt cấp Cục', value: <span style={{ fontWeight: fontWeightBold }}>{detailRecord.approverLevel2Name || null}</span> },
        { label: 'Ngày phê duyệt cấp Cục', value: formatDate(detailRecord.approvedDateLevel2) },
        { label: 'Nội dung phê duyệt cấp Cục', value: detailRecord.approvalContentLevel2 || null, span: true },
        ...(detailRecord.rejectionReason && String(detailRecord.status).toUpperCase().indexOf('REJECT') >= 0
          ? [{ label: 'Lý do từ chối', value: detailRecord.rejectionReason, span: true } as DetailRow]
          : []),
      ]
    : [];


  // ── Card thu gọn trong tab 'Thông tin chung' — chuẩn màn /berth ──
  const detailSectionBoxStyle: React.CSSProperties = {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: '12px 18px 8px 18px',
    marginBottom: 14,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
  };

  const detailSectionHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottom: '1px solid #f1f5f9',
    cursor: 'pointer',
    userSelect: 'none',
  };

  const detailSectionTitleStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: colors.sidebarBg,
    fontWeight: fontWeightBold,
    fontSize: 14,
  };

  // Bộ style local chỉ áp khi matchBerthOperationStyle (tab 'Vận hành & bảo trì')
  // khớp 100% thông số section card của màn /berth (BerthDetailContent.tsx).
  const berthOperationBoxStyle: React.CSSProperties = {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    marginBottom: 14,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
  };

  const renderDetailSectionCard = (opts: {
    title: string;
    icon: React.ReactNode;
    open: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    matchBerthOperationStyle?: boolean;
  }) => {
    const matchBerthOperationStyle = opts.matchBerthOperationStyle === true;
    const boxStyle = matchBerthOperationStyle
      ? { ...detailSectionBoxStyle, ...berthOperationBoxStyle }
      : detailSectionBoxStyle;
    const cardPadding = opts.open
      ? matchBerthOperationStyle
        ? '12px 18px 12px 18px'
        : '14px 18px'
      : '10px 18px';
    const openHeaderMarginBottom = matchBerthOperationStyle ? 12 : 8;
    return (
      <div style={{ ...boxStyle, padding: cardPadding }}>
        <div
          onClick={opts.onToggle}
          style={{
            ...detailSectionHeaderStyle,
            borderBottom: opts.open ? '1px solid #f1f5f9' : 'none',
            paddingBottom: opts.open ? 8 : 0,
            marginBottom: opts.open ? openHeaderMarginBottom : 0,
          }}
        >
          <div style={detailSectionTitleStyle}>
            {opts.icon}
            <span>{opts.title}</span>
          </div>
          <span style={{ color: actionPrimary, fontSize: 12 }}>
            {opts.open ? <DownOutlined /> : <RightOutlined />}
          </span>
        </div>
        {opts.open ? <div>{opts.children}</div> : null}
      </div>
    );
  };

  const detailTabItems = [
    {
      key: 'general',
      label: 'Thông tin chung',
      children: (
        <div style={{ paddingTop: 6, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)', minHeight: 350 }}>
          <div style={detailSectionBoxStyle}>
            <div style={{ ...detailSectionHeaderStyle, cursor: 'default' }}>
              <div style={detailSectionTitleStyle}>
                <BankOutlined style={{ color: actionPrimary }} />
                <span>Thông tin cơ bản & Quản lý vận hành</span>
              </div>
            </div>
            {renderDetailRowsTwoCol(detailBasicRows)}
          </div>

          {renderDetailSectionCard({
            title: 'Thông tin kỹ thuật đèn biển',
            icon: <SlidersOutlined style={{ color: actionPrimary }} />,
            open: detailTechOpen,
            onToggle: () => setDetailTechOpen((v) => !v),
            children: renderDetailRowsTwoCol(detailTechnicalRows),
          })}

          {renderDetailSectionCard({
            title: 'Thông tin nhà trạm',
            icon: <BankOutlined style={{ color: actionPrimary }} />,
            open: detailStationOpen,
            onToggle: () => setDetailStationOpen((v) => !v),
            children: renderDetailRowsTwoCol(detailStationRows),
          })}

          {renderDetailSectionCard({
            title: 'Thông tin phê duyệt',
            icon: <AuditOutlined style={{ color: actionPrimary }} />,
            open: detailHandlingOpen,
            onToggle: () => setDetailHandlingOpen((v) => !v),
            children: renderDetailRowsTwoCol(detailHandlingRows),
          })}
        </div>
      ),
    },
    {
      key: 'gis',
      label: `Thông tin vị trí (${detailGisCoords.length})`,
      children: (
        <DetailTable
          scrollY={DRAWER_TABLE_SCROLL_Y.detailGis}
          dataSource={detailGisCoords}
          emptyHeightAuto
          emptyText="Chưa có tọa độ GPS nào"
          headerNode={
            <>
              <div style={{ paddingTop: 6 }}>
                <div style={{
                  padding: '12px 18px 8px 18px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                  marginBottom: 14,
                }}>
                <div className="chk-detail-grid">
                  {detailGisMetaRows.map((row, i) => (
                    <div key={row.label} className="chk-detail-row">
                      <span className={`chk-detail-label ${i % 2 === 0 ? 'sec-col1-label' : 'sec-col2-label'}`}>{row.label}</span>
                      <span className="chk-detail-value">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
                <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px' }}>
                  Tọa độ GPS ({detailGisCoords.length})
                </span>
                <Button
                  icon={<EnvironmentOutlined style={{ color: actionPrimary }} />}
                  onClick={() => setGisModalOpen(true)}
                  style={{ ...outlineButtonStyle, height: 32, fontSize: fontSizeMd, padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  Xem vị trí trên bản đồ
                </Button>
              </div>
              </div>
            </>
          }
          columns={[
            {
              title: 'STT', width: 50, align: 'center' as const,
              render: (_: any, __: any, i: number) => i + 1,
            },
            {
              title: 'Vĩ độ (Latitude - N)', key: 'lat',
              render: (_: any, r: any) => {
                const dms = ddToDms(r.latitude);
                return `${dms.d}° ${dms.m}' ${dms.s}" N`;
              },
            },
            {
              title: 'Kinh độ (Longitude - E)', key: 'lng',
              render: (_: any, r: any) => {
                const dms = ddToDms(r.longitude);
                return `${dms.d}° ${dms.m}' ${dms.s}" E`;
              },
            },
          ]}
        />
      ),
    },
    {
      key: 'files',
      label: `File đính kèm (${detailFiles.length})`,
      children: (
        <div style={{ paddingTop: 6 }}>
          <div style={{ marginBottom: 8 }}>
            <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: 13.5 }}>File đính kèm</span>
          </div>
          <InfrastructureAttachmentTab
            attachments={detailFiles}
            readonly={true}
            readonlyBerthLayout={true}
            userMap={new Map(userOptions.map((option) => [option.value, option.label]))}
            onDownload={(id, name) => void handleDownloadAttachment(id, name)}
            loadReadonlyPreviewImage={(attachmentId) => {
              const entityId = editingRecord?.id || detailRecord?.id;
              return entityId
                ? beaconStationCRUD.downloadAttachment(entityId, attachmentId)
                : Promise.reject(new Error('Chưa xác định được bản ghi đèn biển để tải tệp đính kèm'));
            }}
            loadPreviewAttachment={(attachmentId) => {
              const entityId = editingRecord?.id || detailRecord?.id;
              return entityId
                ? beaconStationCRUD.downloadAttachment(entityId, attachmentId)
                : Promise.reject(new Error('Chưa xác định được bản ghi đèn biển để tải tệp đính kèm'));
            }}
            scrollY={DRAWER_TABLE_SCROLL_Y.detailView}
          />
        </div>
      ),
    },
    {
      key: 'operationMaintenance',
      label: 'Vận hành & bảo trì',
      children: (
        // Chuẩn màn /berth: 3 section card accordion dọc (Vận hành / Bảo trì / Sự cố),
        // mỗi section mở-gập theo state riêng, mặc định MỞ — thay cho nested <Tabs> ngang.
        // Chuẩn /berth: 3 section card dọc mỗi section một bảng DetailTable cột tách rời;
        // dataSource nhận từ detailRecord?.xxxList (back) — BeaconStation chưa trả mảng nên rỗng là trung thực.
        <div style={{ paddingTop: 6, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)' }}>
          {/* ── Section Vận hành ── */}
          {renderDetailSectionCard({
            title: 'Thông tin vận hành khai thác',
            icon: <SlidersOutlined style={{ color: actionPrimary }} />,
            open: opsOperationOpen,
            onToggle: () => setOpsOperationOpen((v) => !v),
            matchBerthOperationStyle: true,
            children: (
              <DetailTable
                scrollY={160}
                dataSource={(detailRecord as any)?.operationPlanList || []}
                emptyText="Chưa có dữ liệu"
                rowKey={(r: any) => r.id || r.planCode || r.code}
                columns={[
                  { title: 'STT', width: 50 },
                  { title: 'Mã kế hoạch', dataIndex: 'planCode', render: (v: any, rec: any) => v || rec?.code || '' },
                  { title: 'Tên kế hoạch', dataIndex: 'planName', render: (v: any, rec: any) => v || rec?.name || '' },
                  { title: 'Ngày bắt đầu', dataIndex: 'startDate', width: 150, align: 'center' as const, render: (v: any, rec: any) => formatOperationTableDateTime(v || rec?.startTime || rec?.start || null) },
                  { title: 'Ngày kết thúc', dataIndex: 'endDate', width: 150, align: 'center' as const, render: (v: any, rec: any) => formatOperationTableDateTime(v || rec?.endTime || rec?.end || null) },
                ]}
              />
            ),
          })}

          {/* ── Section Bảo trì ── */}
          {renderDetailSectionCard({
            title: 'Thông tin bảo trì',
            icon: <SlidersOutlined style={{ color: actionPrimary }} />,
            open: opsMaintenanceOpen,
            onToggle: () => setOpsMaintenanceOpen((v) => !v),
            matchBerthOperationStyle: true,
            children: (
              <DetailTable
                scrollY={160}
                dataSource={(detailRecord as any)?.maintenancePlanList || []}
                emptyText="Chưa có dữ liệu"
                rowKey={(r: any) => r.id || r.planCode || r.code}
                columns={[
                  { title: 'STT', width: 50 },
                  { title: 'Mã kế hoạch', dataIndex: 'planCode', render: (v: any, rec: any) => v || rec?.code || '' },
                  { title: 'Tên kế hoạch', dataIndex: 'planName', render: (v: any, rec: any) => v || rec?.name || '' },
                  { title: 'Thời gian bắt đầu', dataIndex: 'startTime', width: 150, align: 'center' as const, render: (v: any, rec: any) => formatOperationTableDateTime(v || rec?.start || rec?.startDate || null) },
                  { title: 'Thời gian kết thúc', dataIndex: 'endTime', width: 150, align: 'center' as const, render: (v: any, rec: any) => formatOperationTableDateTime(v || rec?.end || rec?.endDate || null) },
                ]}
              />
            ),
          })}

          {/* ── Section Sự cố ── */}
          {renderDetailSectionCard({
            title: 'Thông tin sự cố',
            icon: <SlidersOutlined style={{ color: actionPrimary }} />,
            open: opsIncidentOpen,
            onToggle: () => setOpsIncidentOpen((v) => !v),
            matchBerthOperationStyle: true,
            children: (
              <DetailTable
                scrollY={160}
                dataSource={(detailRecord as any)?.incidentList || []}
                emptyText="Chưa có dữ liệu"
                rowKey={(r: any) => r.id || r.incidentCode || r.code}
                columns={[
                  { title: 'STT', width: 50 },
                  { title: 'Mã sự cố', dataIndex: 'incidentCode', render: (v: any, r: any) => v || r?.code || '' },
                  { title: 'Loại sự cố', dataIndex: 'incidentType', render: (v: any, r: any) => v || r?.type || '' },
                  { title: 'Địa điểm', dataIndex: 'location', render: (v: any) => v || '' },
                  { title: 'Thời gian', dataIndex: 'incidentTime', width: 150, align: 'center' as const, render: (v: any, r: any) => formatOperationTableDateTime(v || r?.time || null) },
                ]}
              />
            ),
          })}
        </div>
      ),
    },
  ];

  // ── Lịch sử thay đổi — chuẩn /vts-system & /vts-operation-center:
  //  timeline + resolveHistoryActionMeta (Thêm mới/Gửi duyệt/Phê duyệt cấp Cảng vụ-cấp Cục/Từ chối/Xóa mềm)
  //  + tìm kiếm + lọc Từ/Đến ngày + load-more khi cuộn ──
  const HISTORY_PAGE_SIZE = 20;

  const isAttachmentField = (field?: string): boolean => {
    if (!field) return false;
    const f = field.toLowerCase().trim();
    return f === 'attachments' || f === 'tài liệu đính kèm' || f === 'tai lieu dinh kem' || f === 'tệp đính kèm' || f === 'tep dinh kem';
  };

  const splitAttachmentNames = (raw?: string | null): string[] => {
    if (!raw) return [];
    const s = String(raw).trim();
    if (!s || s === '—' || s === '-' || s === 'null' || s === '(null)' || s === 'Chưa có') return [];
    return s
      .split(/[\n\r;,]+/)
      .map((x) => x.trim())
      .filter(Boolean);
  };

  const BEACON_HISTORY_FIELD_LABELS: Record<string, string> = {
    unitId: 'Đơn vị quản lý', code: 'Mã đèn biển', name: 'Tên đèn biển', type: 'Loại đèn biển',
    unitName: 'Đơn vị quản lý', latitude: 'Vĩ độ', longitude: 'Kinh độ', lightRange: 'Tầm hiệu lực ánh sáng',
    towerColor: 'Màu sắc bên ngoài của tháp đèn', location: 'Địa điểm đặt trạm đèn', shape: 'Hình dáng',
    structure: 'Kết cấu', towerHeight: 'Chiều cao tháp đèn', lightHeight: 'Chiều cao tâm sáng',
    geographicRange: 'Tầm hiệu lực địa lý', backupLightModel: 'Đèn dự phòng', powerSupply: 'Nguồn cung cấp',
    staffCount: 'Nhân sự bố trí', stationArea: 'Diện tích sử dụng trạm', primaryLightModel: 'Đèn chính',
    area: 'Diện tích', lastRepairDate: 'Thời điểm sửa chữa gần nhất', commissionedDate: 'Thời điểm đưa vào sử dụng',
    status: 'Trạng thái', approvalStatus: 'Trạng thái phê duyệt', rejectionReason: 'Lý do từ chối',
    provinceId: 'Tỉnh / Thành phố', seaportId: 'Cảng biển', operator: 'Đơn vị vận hành',
    detailedLocation: 'Địa điểm chi tiết', operationalStatus: 'Tình trạng hoạt động', region: 'Địa bàn',
    identifyingFeature: 'Đặc điểm nhận dạng', note: 'Ghi chú', geometryType: 'Loại đối tượng GIS',
    coordinates: 'Tọa độ GIS',
    mapSymbolId: 'Biểu tượng GIS', coordinateSystem: 'Hệ quy chiếu', displayRule: 'Quy tắc hiển thị',
    attachments: 'Tài liệu đính kèm',
  };

  const historyTimestamp = (item: any): string => item.approvedDate || item.changedAt || item.createdAt || '';
  const historyActorName = (item: any): string => item.changedByName || item.actor || item.changedBy || '—';


  const resolveHistoryActionMeta = (group: any, changes: any[]): { label: string; color: string; bg: string } => {
    const item = group.items?.[0] || {};
    const rawStatus = String(item?.status ?? item?.action ?? '').toUpperCase();
    const rawReason = String(item?.reason ?? item?.ghiChu ?? item?.note ?? '').toLowerCase();
    const rawLevel = String(item?.approvalLevel ?? item?.level ?? '').toUpperCase();
    const level = Number(item?.approvalLevel || 0);

    if (rawStatus === 'CREATED' || rawStatus === 'CREATE' || rawReason.includes('tạo mới') || rawReason.includes('thêm mới') || rawReason.includes('tao moi') || rawReason.includes('them moi')) {
      return { label: 'Thêm mới', color: statusOperational, bg: `${statusOperational}18` };
    }

    // Nếu có trường dữ liệu thông thường thay đổi, ưu tiên hiển thị [Cập nhật]
    const hasFieldUpdate = (changes || []).some((c: any) => !isAttachmentField(c.field));
    if (hasFieldUpdate) {
      return { label: 'Cập nhật', color: actionPrimary, bg: `${actionPrimary}18` };
    }

    if (rawStatus === 'ATTACHMENT_UPLOADED' || rawReason.includes('tải lên') || rawReason.includes('tai len')) {
      return { label: 'Tải lên tệp', color: '#0284C7', bg: '#0284C718' };
    }
    if (rawStatus === 'ATTACHMENT_DELETED' || rawReason.includes('xóa tài liệu') || rawReason.includes('xoa tai lieu') || rawReason.includes('xóa tệp')) {
      return { label: 'Xóa tệp', color: statusAttention, bg: `${statusAttention}18` };
    }

    if (rawStatus === 'UPDATED' || rawStatus === 'UPDATE' || rawStatus === 'EDIT' || rawReason.includes('cập nhật') || rawReason.includes('chỉnh sửa')) {
      return { label: 'Cập nhật', color: actionPrimary, bg: `${actionPrimary}18` };
    }

    // Ưu tiên lý do ghi sẵn cho hành động duyệt/từ chối (chuẩn VTS CHK)
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

    const approvalChange = (changes || []).find((c: any) => {
      const k = (c.field || '').toLowerCase();
      return k === 'approvalstatus' || k === 'trang thai phe duyet';
    });

    if (approvalChange) {
      const nv = String(approvalChange.newValue || '').toLowerCase();
      if (nv.includes('rejected_level1') || (nv.includes('tra ve') && nv.includes('cang vu'))) {
        return { label: 'Từ chối cấp Cảng vụ', color: statusCritical, bg: `${statusCritical}18` };
      }
      if (nv.includes('rejected_level2') || (nv.includes('tra ve') && nv.includes('cuc'))) {
        return { label: 'Từ chối cấp Cục', color: statusCritical, bg: `${statusCritical}18` };
      }
      if (nv.includes('approved_level1') || nv.includes('cuc duyet') || nv === 'cho cuc duyet') {
        return { label: 'Phê duyệt cấp Cảng vụ', color: '#13C2C2', bg: '#13C2C218' };
      }
      if (nv === 'da duyet' || nv.includes('approved')) {
        return { label: 'Phê duyệt cấp Cục', color: statusOperational, bg: `${statusOperational}18` };
      }
      if (nv.includes('tu choi') || nv.includes('rejected')) {
        return { label: 'Từ chối', color: statusCritical, bg: `${statusCritical}18` };
      }
      if (nv.includes('cho cang vu duyet') || nv.includes('pending') || nv.includes('proposed') || nv.includes('luu tam') || nv.includes('nhap')) {
        return { label: 'Trình duyệt', color: statusAttention, bg: `${statusAttention}18` };
      }
    }

    const isLevel1 = rawStatus.includes('LEVEL1') || rawStatus.includes('_L1') || rawLevel.includes('LEVEL1') || rawLevel === 'C1' || rawLevel === 'LEVEL_1' || rawLevel === '1' || level === 1;
    const isLevel2 = rawStatus.includes('LEVEL2') || rawStatus.includes('_L2') || rawLevel.includes('LEVEL2') || rawLevel === 'C2' || rawLevel === 'LEVEL_2' || rawLevel === '2' || level === 2;

    if (rawStatus === 'REJECTED_LEVEL1' || rawStatus === 'REJECTED_L1' || (rawStatus === 'REJECTED' && isLevel1)) {
      return { label: 'Từ chối cấp Cảng vụ', color: statusCritical, bg: `${statusCritical}18` };
    }
    if (rawStatus === 'REJECTED_LEVEL2' || rawStatus === 'REJECTED_L2' || (rawStatus === 'REJECTED' && isLevel2)) {
      return { label: 'Từ chối cấp Cục', color: statusCritical, bg: `${statusCritical}18` };
    }
    if (rawStatus === 'REJECTED' || rawStatus === 'REJECT' || rawReason.includes('từ chối') || rawReason.includes('tu choi')) {
      return { label: 'Từ chối', color: statusCritical, bg: `${statusCritical}18` };
    }
    if (isLevel1 && (rawStatus === 'APPROVED_LEVEL1' || rawStatus.includes('APPROV'))) {
      return { label: 'Phê duyệt cấp Cảng vụ', color: '#13C2C2', bg: '#13C2C218' };
    }
    if (isLevel2 || rawStatus === 'APPROVED' || rawStatus === 'APPROVE') {
      return { label: 'Phê duyệt cấp Cục', color: statusOperational, bg: `${statusOperational}18` };
    }
    if (rawStatus === 'PROPOSED' || rawStatus === 'PENDING_APPROVAL' || rawReason.includes('gửi phê duyệt') || rawReason.includes('gui phe duyet') || rawReason.includes('trình duyệt')) {
      return { label: 'Trình duyệt', color: statusAttention, bg: `${statusAttention}18` };
    }
    if (rawStatus === 'DELETED' || rawStatus === 'SOFT_DELETE' || rawReason.includes('xóa') || rawReason.includes('xoa')) {
      return { label: 'Xóa', color: '#64748b', bg: '#64748b18' };
    }

    return { label: 'Cập nhật', color: actionPrimary, bg: `${actionPrimary}18` };
  };

  const formatHistoryValue = (field: string, val: string | null | undefined): string => {
    if (!val || val === '(null)' || val === 'null') return '(trống)';
    if (field === 'status' || field === 'approvalStatus') {
      return BEACON_STATUS_MAP[val as BeaconStatus]?.label || val;
    }
    if (field === 'type') {
      return BEACON_LIGHT_TYPE_OPTIONS.find((o) => o.value === val)?.label || val;
    }
    if (field === 'lastRepairDate' || field === 'commissionedDate') {
      return formatDateOnly(val) || val;
    }
    if (field.endsWith('At')) {
      return formatDate(val) || val;
    }
    return val;
  };

  const renderHistoryFieldLabel = (field: string): string => BEACON_HISTORY_FIELD_LABELS[field] || field;

  // Tách 1 dòng nhật ký thành các thay đổi theo TỪNG TRƯỜNG — định dạng backend ghi vào
  // infrastructure_history: changed_field = "f1, f2, ..." (String.join ", "), còn
  // previous/new_value = JSON map toàn entity (Thêm mới/Xóa mềm: new_value = JSON entity).
  // Render 1 chuỗi dài cả entity là sai — phải split như historyChangeRows của /vts-operation-center.
  const toHistoryItem = useCallback((raw: any) => {
    const fieldNames = String(raw?.changedField ?? '').split(/[,;]+/).map((s: string) => s.trim()).filter(Boolean);
    const parseJson = (v: any): Record<string, string> | null => {
      if (v === null || v === undefined) return null;
      const t = String(v).trim();
      if (!t.startsWith('{')) return null;
      try {
        const o = JSON.parse(t);
        if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
        return Object.fromEntries(Object.entries(o).map(([k, val]) => [k, val === null || val === undefined ? '' : String(val)]));
      } catch { return null; }
    };
    // Trường hệ thống/kiểm toán — không hiển thị như thay đổi nghiệp vụ
    const metaKeys = new Set([
      'id', 'spatialId', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy',
      'deletedAt', 'deletedBy', 'approvedBy', 'approvedDate', 'approvalLevel',
      'submittedBy', 'submittedAt', 'submittedDate', 'submitteddate', 'submittedat', 'submittedby',
      'approverLevel1', 'approverLevel1Name', 'approverLevel2', 'approverLevel2Name',
      'approvedDateLevel1', 'approvedDateLevel2', 'approvalContentLevel1', 'approvalContentLevel2',
      'level1ApprovalContent', 'level2ApprovalContent', 'rejectionReason', 'rejectionreason',
      'status', 'submittedByName',
      'approvalStatus', 'approval_status', 'Trạng thái phê duyệt', 'trang thai phe duyet', 'Trạng thái',
      'cấp 1 phê duyệt', 'cấp 2 phê duyệt', 'nội dung phê duyệt', 'ngày gửi phê duyệt', 'người gửi phê duyệt',
      'lý do từ chối', 'ly do tu choi'
    ]);
    const oldMap = parseJson(raw?.previousValue);
    const newMap = parseJson(raw?.newValue);
    const changes: Array<{ field: string; oldValue: string | null; newValue: string | null }> = [];
    const pushRow = (field: string, oldValue: string | null, newValue: string | null) => {
      const fTrim = (field || '').trim();
      const fLower = fTrim.toLowerCase();
      if (
        metaKeys.has(fTrim) ||
        metaKeys.has(fLower) ||
        DEFAULT_IGNORED_FIELDS.has(fTrim) ||
        DEFAULT_IGNORED_FIELDS.has(fLower)
      ) {
        return;
      }
      const ov = oldValue === null || oldValue === undefined ? null : String(oldValue);
      const nv = newValue === null || newValue === undefined ? null : String(newValue);
      if (ov === null && nv === null) return;
      if (ov !== null && nv !== null) {
        if (ov.trim() === nv.trim()) return;
        if (
          !isNaN(Number(ov.trim())) &&
          !isNaN(Number(nv.trim())) &&
          Math.abs(Number(ov.trim()) - Number(nv.trim())) < 1e-9
        ) {
          return;
        }
      }
      changes.push({ field, oldValue: ov, newValue: nv });
    };
    if (fieldNames.length > 0) {
      // UPDATE: từng trường theo tên, giá trị lấy từ JSON map (fallback chuỗi thô nếu không phải JSON)
      const oldRaw = oldMap ? null : (raw?.previousValue ?? null);
      const newRaw = newMap ? null : (raw?.newValue ?? null);
      fieldNames.forEach((fn) => pushRow(fn, oldMap ? (oldMap[fn] ?? null) : oldRaw, newMap ? (newMap[fn] ?? null) : newRaw));
      const have = new Set(fieldNames.map((f: string) => f.toLowerCase()));
      if (newMap) Object.keys(newMap).forEach((k) => { if (!have.has(k.toLowerCase())) pushRow(k, oldMap ? oldMap[k] ?? null : null, newMap[k] ?? null); });
      else if (oldMap) Object.keys(oldMap).forEach((k) => { if (!have.has(k.toLowerCase())) pushRow(k, oldMap[k] ?? null, null); });
    } else if (newMap) {
      // CREATE / XÓA MỀM: new_value = JSON toàn entity → hiện từng trường có giá trị
      Object.keys(newMap).forEach((k) => {
        const v = newMap[k];
        if (v === null || v === undefined || String(v).trim() === '') return;
        pushRow(k, null, v);
      });
    } else {
      // REJECT (new_value = lý do từ chối) hoặc dòng chỉ có chuỗi đơn
      const rawText = raw?.newValue ?? raw?.previousValue;
      const isReject = String(raw?.status ?? '').toUpperCase().includes('REJECT');
      if (rawText !== null && rawText !== undefined && String(rawText).trim() !== '') {
        if (!isReject) {
          pushRow('', null, String(rawText));
        }
      }
    }
    const isRejectAction = String(raw?.status ?? '').toUpperCase().includes('REJECT');
    const fallbackReason = isRejectAction && (raw?.newValue ?? raw?.previousValue) ? String(raw?.newValue ?? raw?.previousValue) : null;
    return {
      id: raw?.id || '',
      action: raw?.status || 'UPDATE',
      actor: raw?.approvedBy || '—',
      changedBy: raw?.approvedBy || '',
      changedByName: raw?.approvedBy || '',
      changedAt: raw?.approvedDate || raw?.changedAt || '',
      createdAt: raw?.approvedDate || '',
      orgUnitName: raw?.orgUnitName || '',
      unitId: raw?.unitId,
      orgUnitId: raw?.orgUnitId,
      changes,
      reason: raw?.reason ?? fallbackReason,
      approvalLevel: raw?.approvalLevel,
    };
  }, []);

  useEffect(() => {
    if (!historyOpen || !historyTarget) return;
    if (historyTarget.status === 'DRAFT' || historyTarget.approvalStatus === 'DRAFT') {
      setHistoryRecords([]);
      setHistoryLoading(false);
      setHasMoreHistory(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setHistoryLoading(true);
      setLoadingMoreHistory(false);
      setHistoryRecords([]);
      setHasMoreHistory(false);
      try {
        const hist = await beaconHistory.getPagedHistory(historyTarget.id, 0, HISTORY_PAGE_SIZE, {
          keyword: historySearch || undefined,
          fromDate: historyFrom || undefined,
          toDate: historyTo || undefined,
        });
        if (cancelled) return;
        const items = (hist || []).map(toHistoryItem);
        setHistoryRecords(items);
        setHasMoreHistory((hist || []).length === HISTORY_PAGE_SIZE);
      } catch { if (!cancelled) toast.error('Không thể tải lịch sử thay đổi'); }
      finally { if (!cancelled) setHistoryLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [historyOpen, historyTarget, historySearch, historyFrom, historyTo, toHistoryItem]);

  const loadMoreHistory = async () => {
    if (!historyTarget || historyLoading || loadingMoreHistory || !hasMoreHistory || historyTarget.status === 'DRAFT' || historyTarget.approvalStatus === 'DRAFT') return;
    setLoadingMoreHistory(true);
    try {
      const nextPage = historyPage + 1;
      const hist = await beaconHistory.getPagedHistory(historyTarget.id, nextPage, HISTORY_PAGE_SIZE, {
        keyword: historySearch,
        fromDate: historyFrom || undefined,
        toDate: historyTo || undefined,
      });
      if (hist && hist.length > 0) setHistoryRecords((prev) => [...prev, ...hist.map(toHistoryItem)]);
      setHistoryPage(nextPage);
      setHasMoreHistory((hist || []).length === HISTORY_PAGE_SIZE);
    } catch { /* ignore */ } finally { setLoadingMoreHistory(false); }
  };

  const handleHistoryScroll = (e: any) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 30) loadMoreHistory();
  };

  const isMeaningfulChange = useCallback((field: string, rawOld: any, rawNew: any): boolean => {
    const f = (field || '').trim();
    const fLower = f.toLowerCase();
    if (
      DEFAULT_IGNORED_FIELDS.has(f) ||
      DEFAULT_IGNORED_FIELDS.has(fLower) ||
      fLower === 'approvalstatus' ||
      fLower === 'trạng thái phê duyệt' ||
      fLower === 'trang thai phe duyet' ||
      fLower === 'trạng thái' ||
      fLower === 'status' ||
      fLower === 'approvalcontentlevel1' ||
      fLower === 'approvalcontentlevel2' ||
      fLower === 'level1approvalcontent' ||
      fLower === 'level2approvalcontent' ||
      fLower === 'approverlevel1' ||
      fLower === 'approverlevel2' ||
      fLower === 'approveddatelevel1' ||
      fLower === 'approveddatelevel2' ||
      fLower === 'submitteddate' ||
      fLower === 'submittedat' ||
      fLower === 'submittedby' ||
      fLower === 'cấp 1 phê duyệt' ||
      fLower === 'cấp 2 phê duyệt' ||
      fLower === 'nội dung phê duyệt' ||
      fLower === 'ngày gửi phê duyệt' ||
      fLower === 'người gửi phê duyệt' ||
      fLower === 'rejectionreason' ||
      fLower === 'lý do từ chối' ||
      fLower === 'ly do tu choi'
    ) {
      return false;
    }
    const isBlank = (v: any): boolean => {
      if (v == null) return true;
      const s = String(v).trim().toLowerCase();
      return (
        s === '' ||
        s === '—' ||
        s === '-' ||
        s === '–' ||
        s === 'null' ||
        s === '(null)' ||
        s === '(trống)' ||
        s === 'chưa có' ||
        s === 'undefined'
      );
    };
    if (isBlank(rawOld) && isBlank(rawNew)) return false;
    const ov = rawOld != null ? String(rawOld).trim() : '';
    const nv = rawNew != null ? String(rawNew).trim() : '';
    if (ov !== '' && nv !== '' && ov.toLowerCase() === nv.toLowerCase()) return false;
    // Bỏ qua nếu cả hai đều là số và bằng nhau về mặt giá trị số học (VD: 25.0000 vs 25)
    if (ov !== '' && nv !== '' && !isNaN(Number(ov)) && !isNaN(Number(nv)) && Math.abs(Number(ov) - Number(nv)) < 1e-9) {
      return false;
    }
    // Bỏ qua nếu sau khi format hiển thị giống nhau
    const ovFmt = !isNaN(Number(ov)) ? fmtNum(ov) : ov;
    const nvFmt = !isNaN(Number(nv)) ? fmtNum(nv) : nv;
    if (ovFmt.trim() !== '' && ovFmt.trim() === nvFmt.trim()) {
      return false;
    }
    return true;
  }, []);

  const validHistoryGroups = useMemo(() => {
    if (!Array.isArray(historyRecords) || historyRecords.length === 0) return [];
    const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000);
    const sorted = [...historyRecords].sort(
      (a, b) => new Date(historyTimestamp(b) || 0).getTime() - new Date(historyTimestamp(a) || 0).getTime()
    );
    const rawGroups: { tsSec: number; ts: string; actor: string; items: any[] }[] = [];
    for (const r of sorted) {
      const ts = historyTimestamp(r);
      const sec = ts ? toSec(ts) : 0;
      const actor = historyActorName(r);
      const prev = rawGroups[rawGroups.length - 1];
      if (prev && prev.tsSec === sec && prev.actor === actor) prev.items.push(r);
      else rawGroups.push({ tsSec: sec, ts, actor, items: [r] });
    }

    return rawGroups
      .map((g) => {
        const allChanges = g.items.flatMap((item) => (item.changes && item.changes.length > 0 ? item.changes : []));
        const changes = allChanges
          .filter((c: any) => c.field !== '' || (c.oldValue != null && c.oldValue !== '') || (c.newValue != null && c.newValue !== ''))
          .filter((c: any) => isMeaningfulChange(c.field, c.oldValue, c.newValue));
        if (changes.length === 0) return null;

        // Gom nhóm các thay đổi đính kèm trong cùng một phiên thành 1 dòng duy nhất
        const attachmentChanges = changes.filter((c: any) => isAttachmentField(c.field));
        const nonAttachmentChanges = changes.filter((c: any) => !isAttachmentField(c.field));
        const seenDisplayFields = new Set<string>();
        const dedupedNonAttachmentChanges: any[] = [];
        for (const c of nonAttachmentChanges) {
          const displayLabel = renderHistoryFieldLabel(c.field).trim().toLowerCase();
          if (seenDisplayFields.has(displayLabel)) {
            continue;
          }
          seenDisplayFields.add(displayLabel);
          dedupedNonAttachmentChanges.push(c);
        }
        const finalChanges: any[] = [...dedupedNonAttachmentChanges];
        if (attachmentChanges.length > 0) {
          const allNewFiles: string[] = [];
          const allOldFiles: string[] = [];
          attachmentChanges.forEach((ac: any) => {
            splitAttachmentNames(ac.newValue).forEach((fn) => {
              if (!allNewFiles.includes(fn)) allNewFiles.push(fn);
            });
            splitAttachmentNames(ac.oldValue).forEach((fn) => {
              if (!allOldFiles.includes(fn)) allOldFiles.push(fn);
            });
          });
          const mergedOld = allOldFiles.length > 0 ? allOldFiles.join('; ') : 'Chưa có';
          const mergedNew = allNewFiles.length > 0 ? allNewFiles.join('; ') : '—';
          if (isMeaningfulChange('Tài liệu đính kèm', mergedOld, mergedNew)) {
            finalChanges.push({
              field: 'Tài liệu đính kèm',
              oldValue: mergedOld,
              newValue: mergedNew,
            });
          }
        }
        if (finalChanges.length === 0) return null;

        const orderedChanges = [...finalChanges].sort((a: any, b: any) => {
          const ia = BEACON_HISTORY_FIELD_ORDER.indexOf(a.field);
          const ib = BEACON_HISTORY_FIELD_ORDER.indexOf(b.field);
          return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        });
        if (orderedChanges.length === 0) return null;

        return {
          ...g,
          changes: finalChanges,
          orderedChanges,
        };
      })
      .filter(Boolean) as Array<{
      tsSec: number;
      ts: string;
      actor: string;
      items: any[];
      changes: any[];
      orderedChanges: any[];
    }>;
  }, [historyRecords, isMeaningfulChange]);

  const historyUpdateCount = validHistoryGroups.length;

  function renderHistoryTimeline() {
    if (validHistoryGroups.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
          <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
          <div style={{ color: textTertiary, fontSize: fontSizeMd }}>
            {historySearch || historyFrom || historyTo ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận'}
          </div>
        </div>
      );
    }
    const renderHistoryValueNode = (field: string, raw: string | null | undefined) => {
      const key = String(field || '').toLowerCase();
      const empty = raw === null || raw === undefined || String(raw).trim() === '' || String(raw) === '(null)' || String(raw) === 'null';
      const gisKey = key.includes('coordinates') || key.includes('toa do gis');
      const isGeom = key === 'geometrytype' || key === 'loai doi tuong gis';
      const isSymbol = key === 'mapsymbolid' || key === 'symbolid' || key.includes('bieu tuong');
      if (empty) {
        return <span style={{ color: textTertiary }}>{(gisKey || isGeom || isSymbol || isAttachmentField(field)) ? 'Chưa có' : '—'}</span>;
      }
      if (isAttachmentField(field)) {
        const list = splitAttachmentNames(String(raw));
        if (list.length === 0) return <span style={{ color: textTertiary }}>Chưa có</span>;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {list.map((fn, idx) => (
              <span key={idx} style={{ wordBreak: 'break-all' }}>{fn}</span>
            ))}
          </div>
        );
      }
      if (gisKey) return renderHistoryCoordinates(String(raw));
      if (isGeom) {
        return <span>{historyGisTypeLabel(String(raw))}</span>;
      }
      if (isSymbol) {
        const sym = symbols.find((s: any) => s.id === raw || s.code === raw);
        return <span>{sym?.name || String(raw)}</span>;
      }
      // Map ID/giá trị số sang tên hiển thị (chuẩn /vts-operation-center) — không lộ UUID
      if (key === 'seaportid' || key === 'portid' || key.includes('cang bien')) {
        const p = seaports.find((x: any) => String(x.id) === String(raw));
        return <span>{p ? (p.portName || p.portCode || String(raw)) : String(raw)}</span>;
      }
      if (key === 'unitid' || key === 'orgunitid' || key.includes('don vi quan ly')) {
        const uName = orgMap.get(String(raw)) || String(raw);
        return <span>{uName}</span>;
      }
      if (key === 'coordinatesystem' || key.includes('he quy chieu') || key.includes('he toa do')) {
        const sVal = String(raw).trim();
        if (sVal === '1' || sVal === '4326' || sVal.toUpperCase() === 'WGS84' || sVal.toUpperCase() === 'WGS 84') return <span>WGS 84</span>;
        if (sVal === '2' || sVal.toUpperCase() === 'VN2000' || sVal.toUpperCase() === 'VN-2000') return <span>VN-2000</span>;
        return <span>{raw}</span>;
      }
      if (key === 'provinceid' || key.includes('tinh / thanh pho')) {
        const num = Number(raw);
        const nm = Number.isFinite(num) ? getProvinceNameById(num) : null;
        return <span>{nm || String(raw)}</span>;
      }
      if (key === 'operationalstatus' || key.includes('tinh trang')) {
        const num = Number(raw);
        const opt = Number.isFinite(num) ? OPERATIONAL_STATUS_STYLE_MAP[num] : null;
        return <span>{opt?.label || String(raw)}</span>;
      }
      if (key === 'type' || key.includes('cap tram den')) {
        const opt = BEACON_LIGHT_TYPE_OPTIONS.find((o) => o.value === raw);
        return <span>{opt ? opt.label : String(raw)}</span>;
      }
      const txt = formatHistoryValue(field, raw);
      if (/^-?\d+(\.\d+)?$/.test(String(txt).trim()) && key !== 'coordinatesystem' && !key.includes('he quy chieu') && !key.includes('he toa do') && key !== 'provinceid') {
        return <span>{fmtNum(String(txt).trim())}</span>;
      }
      return <span title={String(txt)} style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{txt}</span>;
    };
    const fmtTime = (ts: string) => {
      const d = dayjs(ts);
      return `${d.format('HH:mm')} ${d.format('DD/MM/YYYY')}`;
    };
    return (
      <div>
        {validHistoryGroups.map((g, gi) => {
          const rec0 = g.items[0] || {};
          const actionMeta = resolveHistoryActionMeta(g, g.changes);
          // Đơn vị của user thực hiện cập nhật (chuẩn /vts-operation-center) — KHÔNG lấy unitId của tài sản
          const orgNameFromId = (rec0.unitId && orgMap.get(rec0.unitId)) || (rec0.orgUnitId && orgMap.get(rec0.orgUnitId));
          const unitName = rec0.orgUnitName || orgNameFromId || rec0.unitName || '—';

          const isCreate = g.changes.every((c: any) => c.oldValue === null || c.oldValue === '(null)' || c.oldValue === '' || c.oldValue === 'null');
          const informationTitle = isCreate ? 'Thông tin thêm mới:' : 'Thông tin thay đổi:';
          const orderedChanges = g.orderedChanges;

          return (
            <div key={gi} style={{ ...historyGroupGridStyle, marginBottom: gi < validHistoryGroups.length - 1 ? spaceSm : 0 }}>
              <div style={{ minWidth: 0, paddingTop: spaceXs }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spaceSm }}>
                  <Typography.Text style={historyTimeStyle}>
                    {g.ts ? fmtTime(g.ts) : '—'}
                  </Typography.Text>
                  <span style={{ flexShrink: 0 }}>
                    <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeSm + 1, fontWeight: fontWeightMedium, background: actionMeta.bg, color: actionMeta.color, whiteSpace: 'nowrap' }}>
                      {actionMeta.label}
                    </span>
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
                <div style={historyAccentBarStyle(actionMeta.color || actionPrimary)} />
                <Typography.Text style={historyInfoTitleStyle}>
                  {informationTitle}
                </Typography.Text>
                {orderedChanges.length > 0 ? (
                  <div>
                    {orderedChanges.map((change: any, ri: number) => {
                      const fn = change.field;
                      const fname = renderHistoryFieldLabel(fn);
                      const isValBlank = (v: any) =>
                        v == null ||
                        String(v).trim() === '' ||
                        String(v).trim() === '—' ||
                        String(v).trim() === '-' ||
                        String(v).trim() === '–' ||
                        String(v).trim() === '(null)' ||
                        String(v).trim() === 'null' ||
                        String(v).trim() === '(trống)' ||
                        String(v).trim().toLowerCase() === 'chưa có';
                      if (isValBlank(change.oldValue) && isValBlank(change.newValue)) return null;
                      if (
                        !isValBlank(change.oldValue) &&
                        !isValBlank(change.newValue) &&
                        String(change.oldValue).trim().toLowerCase() === String(change.newValue).trim().toLowerCase()
                      ) {
                        return null;
                      }
                      const ov = renderHistoryValueNode(fn, change.oldValue);
                      const nv = renderHistoryValueNode(fn, change.newValue);
                      return isCreate ? (
                        <div key={`${fn}-${ri}`} style={{ ...historyCreateRowStyle, paddingTop: ri > 0 ? spaceXs : 0 }}>
                          <div style={historyFieldLabelStyle}>{fname ? `${fname}:` : '—'}</div>
                          <span style={historyNewValueStyle}>{nv}</span>
                        </div>
                      ) : (
                        <div key={`${fn}-${ri}`} style={{ ...historyChangeRowStyle, paddingTop: ri > 0 ? spaceXs : 0 }}>
                          <div style={historyFieldLabelStyle}>{fname ? `${fname}:` : '—'}</div>
                          <span style={historyOldValueStyle}>{ov}</span>
                          <span style={historyArrowStyle}>→</span>
                          <span style={historyNewValueStyle}>{nv}</span>
                        </div>
                      );
                    })}
                    {rec0.reason && (
                      <div style={{ marginTop: spaceSm, color: textSecondary, fontSize: fontSizeSm }}>
                        <span style={{ fontWeight: fontWeightMedium }}>Lý do: </span>
                        <span>{rec0.reason}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <Typography.Text style={{ color: textTertiary, fontSize: fontSizeMd }}>Không có thông tin chi tiết</Typography.Text>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const CHK_FILTER_LABEL = { ...themeTokenChk.filterLabelStyle, fontSize: 13.5 };

  // ── JSX ─────────────────────────────────────────────────────────
  return (
    <ThemeTokenProvider tokens={{ ...themeTokenChk, fontSizeMd: 13.5, filterLabelStyle: CHK_FILTER_LABEL }}>
    <div className="beacon-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <style>{`
        .beacon-page-wrapper,
        .beacon-page-wrapper .ant-input,
        .beacon-page-wrapper .ant-table,
        .beacon-page-wrapper .ant-table-cell,
        .beacon-page-wrapper .ant-table-thead > tr > th,
        .beacon-page-wrapper .ant-table-tbody > tr > td,
        .beacon-page-wrapper .ant-select,
        .beacon-page-wrapper .ant-select-selection-item,
        .beacon-page-wrapper .ant-select-item-option-content,
        .beacon-page-wrapper .ant-picker,
        .beacon-page-wrapper .ant-picker-input > input,
        .beacon-page-wrapper .ant-btn,
        .beacon-page-wrapper .ant-pagination,
        .beacon-page-wrapper .ant-breadcrumb,
        .beacon-page-wrapper .ant-form-item-label > label,
        .beacon-station-drawer-scope .ant-input,
        .beacon-station-drawer-scope .ant-form-item-label > label {
          font-size: 13.5px !important;
        }
        /* ── Responsive StatusTabs: căn giữa khi đủ chỗ, cuộn ngang khi tràn (khi zoom in) — port từ /berth ── */
        .beacon-page-wrapper div:has(> button[aria-pressed]) {
          display: flex !important;
          flex-wrap: nowrap !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          justify-content: safe center !important;
          align-items: center !important;
          scrollbar-width: thin !important;
          scrollbar-color: #cbd5e1 #f8fafc !important;
          scroll-behavior: smooth !important;
          -webkit-overflow-scrolling: touch !important;
          padding: 2px 8px 4px 8px !important;
          gap: clamp(6px, 1vw, 14px) !important;
        }
        .beacon-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar {
          height: 4px !important;
          display: block !important;
        }
        .beacon-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-track {
          background: #f1f5f9 !important;
          border-radius: 999px !important;
        }
        .beacon-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb {
          background: #cbd5e1 !important;
          border-radius: 999px !important;
        }
        .beacon-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb:hover {
          background: #94a3b8 !important;
        }
        .beacon-page-wrapper div:has(> button[aria-pressed]) > button {
          white-space: nowrap !important;
          flex-shrink: 0 !important;
          cursor: pointer !important;
          padding: 4px 2px !important;
        }
      `}</style>

      <ScreenHeader
        breadcrumb={[{ label: 'Quản lý hàng hải' }, { label: 'Đèn biển và nhà trạm gắn với Đèn biển' }]}
        actions={hasPerm('beaconstation:create')
          ? [{ key: 'create', label: 'Thêm mới', icon: <PlusOutlined />, variant: 'primary', onClick: openCreateDrawer }]
          : []}
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
          <style>{`.list-view-table .ant-table-cell { padding-block: 8.5px !important; }`}</style>
          <style>{`
            /* Chuẩn /berth (áp cho toàn drawer chi tiết Đèn biển) — bảng chi tiết 13.5px, label hẹp hơn, nhịp dòng gọn */
            .ant-drawer-body .chk-detail-tabs .ant-tabs-tab {
              font-size: 13.5px !important;
            }
            /* Header + giá trị mọi bảng trong drawer chi tiết (Vận hành & bảo trì, GIS…) → 13.5px, port chuẩn /berth */
            .ant-drawer-body .chk-detail-tabs .ant-table,
            .ant-drawer-body .chk-detail-tabs .ant-table-cell,
            .ant-drawer-body .chk-detail-tabs .ant-table-thead > tr > th,
            .ant-drawer-body .chk-detail-tabs .ant-table-tbody > tr > td {
              font-size: 13.5px !important;
            }
            .ant-drawer-body .chk-detail-grid {
              display: grid !important;
              grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
              column-gap: 28px !important;
              row-gap: 0 !important;
            }
            .ant-drawer-body .chk-detail-row {
              display: flex !important;
              align-items: flex-start !important;
              min-height: 36px !important;
              padding: 7px 0 !important;
              border-bottom: 1px solid #f1f5f9 !important;
              line-height: 1.5 !important;
              gap: 10px !important;
            }
            .ant-drawer-body .chk-detail-row--full {
              grid-column: 1 / -1 !important;
            }
            .ant-drawer-body .chk-detail-row .chk-detail-label,
            .ant-drawer-body .chk-detail-label {
              width: 215px !important;
              min-width: 215px !important;
              max-width: 215px !important;
              flex-shrink: 0 !important;
              font-weight: 600 !important;
              font-size: 13.5px !important;
              text-align: left !important;
              line-height: 1.5 !important;
            }
            .ant-drawer-body .chk-detail-row .sec-col1-label,
            .ant-drawer-body .sec-col1-label {
              width: 215px !important;
              min-width: 215px !important;
              max-width: 215px !important;
              flex-shrink: 0 !important;
            }
            .ant-drawer-body .chk-detail-row .sec-col2-label,
            .ant-drawer-body .sec-col2-label {
              width: 250px !important;
              min-width: 250px !important;
              max-width: 250px !important;
              flex-shrink: 0 !important;
            }
            .ant-drawer-body .chk-detail-row .sec-full-label,
            .ant-drawer-body .sec-full-label {
              width: 215px !important;
              min-width: 215px !important;
              max-width: 215px !important;
              flex-shrink: 0 !important;
            }
            .ant-drawer-body .chk-detail-label::after {
              content: ':' !important;
              margin-left: 1px !important;
              margin-right: 4px !important;
            }
            .ant-drawer-body .chk-detail-value {
              color: #1e293b !important;
              font-size: 13.5px !important;
              flex: 1 !important;
              min-width: 0 !important;
              text-align: left !important;
              line-height: 1.5 !important;
              word-break: break-word !important;
            }
            @media (max-width: 960px) {
              .ant-drawer-body .chk-detail-grid {
                grid-template-columns: 1fr !important;
                column-gap: 0 !important;
              }
              .ant-drawer-body .chk-detail-row--full {
                grid-column: 1 !important;
              }
              .ant-drawer-body .chk-detail-label,
              .ant-drawer-body .sec-col1-label,
              .ant-drawer-body .sec-col2-label,
              .ant-drawer-body .sec-full-label {
                width: 250px !important;
                min-width: 250px !important;
                max-width: 250px !important;
              }
            }
            @media (max-width: 640px) {
              .ant-drawer-body .chk-detail-row {
                flex-direction: column !important;
                align-items: flex-start !important;
                gap: 3px !important;
                padding: 6px 0 !important;
              }
              .ant-drawer-body .chk-detail-label,
              .ant-drawer-body .sec-col1-label,
              .ant-drawer-body .sec-col2-label,
              .ant-drawer-body .sec-full-label {
                width: 100% !important;
                min-width: 100% !important;
                max-width: 100% !important;
              }
              .ant-drawer-body .chk-detail-value {
                width: 100% !important;
              }
            }
          `}</style>
          <DataTable
            fill
            columns={columns}
            dataSource={tableData}
            rowKey="id"
            rowActions={rowActions}
            onSort={handleSort}
            scroll={{ x: 'max-content' }}
            emptyState={<EmptyState description="Không có dữ liệu đèn biển nào phù hợp với bộ lọc" />}
          />
          <div style={{ height: 6, flexShrink: 0 }} />
          <Pagination
              total={total}
              current={page}
              pageSize={pageSize}
              onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
            />
        </div>
      </FilterTableLayout>

      {/* ── Detail Drawer ──────────────────────────────────────────── */}
      <AppDrawer
        title={
          <span style={drawerTitleStyle}>
            {`Chi tiết đèn biển${detailRecord ? ` — ${detailRecord.name}` : ''}`}
          </span>
        }
        open={drawerVisible && isDetailMode && !!detailRecord}
        destroyOnHidden
        onClose={closeDrawer}
        width={DRAWER_WIDTH}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px', overflow: 'hidden' },
        }}
        footer={null}
      >
        {isDetailMode && detailRecord && (
          <div className="chk-detail-tabs">
            <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} tabBarStyle={tabBarStyle} items={detailTabItems} />
          </div>
        )}
      </AppDrawer>

      {/* ── Create Drawer ──────────────────────────────────────────── */}
      <AppDrawer
        width={DRAWER_WIDTH}
        rootClassName="beacon-station-drawer-scope"
        className="beacon-station-drawer-scope"
        title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>Thêm mới thông tin đèn biển và nhà trạm gắn với đèn biển</span>}
        open={createDrawerVisible}
        destroyOnHidden
        onClose={() => { setCreateDrawerVisible(false); createForm.resetFields(); }}
        footer={
          <div style={drawerFooterStyle}>
            <Button
              onClick={() => {
                actionTypeRef.current = 'draft';
                setActionType('draft');
                createFormRef.current?.submit('draft');
              }}
              loading={submitting && actionType === 'draft'}
              style={outlineButtonStyle}
            >
              Lưu tạm
            </Button>
            <Button
              type="primary"
              onClick={() => {
                actionTypeRef.current = 'submit';
                setActionType('submit');
                createFormRef.current?.submit('submit');
              }}
              loading={submitting && actionType === 'submit'}
              style={primaryButtonStyle}
            >
              Lưu và gửi phê duyệt
            </Button>
            {canApproveDirect && (
              <Button
                type="primary"
                onClick={() => {
                  actionTypeRef.current = 'approved';
                  setActionType('approved');
                  createFormRef.current?.submit('approved');
                }}
                loading={submitting && actionType === 'approved'}
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
        destroyOnClose
      >
        <style>{requiredMarkStyle}</style>
        {createDrawerVisible && (
          <Form form={createForm} layout="vertical" initialValues={{ operationalStatus: 1 }}>
            <BeaconStationForm
              ref={createFormRef}
              form={createForm}
              organizations={organizations}
              onFinish={() => { setCreateDrawerVisible(false); void fetchData(); void fetchCounts(); }}
              onSubmittingChange={setSubmitting}
            />
          </Form>
        )}
      </AppDrawer>

      {/* ── Edit Drawer ────────────────────────────────────────────── */}
      <AppDrawer
        width={DRAWER_WIDTH}
        rootClassName="beacon-station-drawer-scope"
        className="beacon-station-drawer-scope"
        title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>Chỉnh sửa — {editingRecord?.name || editingRecord?.code}</span>}
        open={!!editingRecord && !isDetailMode}
        onClose={() => { setEditingRecord(null); updateForm.resetFields(); }}
        footer={
          <div style={drawerFooterStyle}>
            {editingRecord && ['APPROVED', 'APPROVED_L2', 'APPROVED_LEVEL2', 'PUBLISHED'].includes(editingRecord.status) ? (
              <Button
                type="primary"
                onClick={() => {
                  actionTypeRef.current = 'approved';
                  setActionType('approved');
                  editFormRef.current?.submit('approved');
                }}
                loading={submitting && actionType === 'approved'}
                style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}
              >
                Lưu và phê duyệt
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => {
                    actionTypeRef.current = 'draft';
                    setActionType('draft');
                    editFormRef.current?.submit('draft');
                  }}
                  loading={submitting && actionType === 'draft'}
                  style={outlineButtonStyle}
                >
                  Lưu tạm
                </Button>
                <Button
                  type="primary"
                  onClick={() => {
                    actionTypeRef.current = 'submit';
                    setActionType('submit');
                    editFormRef.current?.submit('submit');
                  }}
                  loading={submitting && actionType === 'submit'}
                  style={primaryButtonStyle}
                >
                  Lưu và gửi phê duyệt
                </Button>
                {canApproveDirect && (
                  <Button
                    type="primary"
                    onClick={() => {
                      actionTypeRef.current = 'approved';
                      setActionType('approved');
                      editFormRef.current?.submit('approved');
                    }}
                    loading={submitting && actionType === 'approved'}
                    style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}
                  >
                    Lưu và phê duyệt
                  </Button>
                )}
              </>
            )}
          </div>
        }
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px' },
        }}
      >
        {editingRecord && (
          <>
            <style>{requiredMarkStyle}</style>
            <Form form={updateForm} layout="vertical" initialValues={{}}>
              <BeaconStationForm
                ref={editFormRef}
                form={updateForm}
                id={editingRecord.id}
                initialData={editingRecord}
                organizations={organizations}
                onFinish={() => { setEditingRecord(null); void fetchData(); void fetchCounts(); }}
                onSubmittingChange={setSubmitting}
              />
            </Form>
          </>
        )}
      </AppDrawer>

      {/* ── Delete Confirmation Modal (chuẩn /berth) ─────────────── */}
      <DeleteConfirmModal
        open={deleteModalOpen}
        onCancel={() => {
          if (!deleteLoading) {
            setDeleteModalOpen(false);
            setDeletingRecord(null);
          }
        }}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        itemType="đèn biển"
        itemName={deletingRecord?.name}
        itemCode={deletingRecord?.code}
      />

      {/* ── Submit Modal (chuẩn /berth) ──────────────────────────── */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Xác nhận gửi Cảng vụ phê duyệt</span>}
        open={submitModalOpen}
        onCancel={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }}
        footer={[
          <Button key="cancel" onClick={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="submit" type="primary" onClick={confirmSubmit}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>Xác nhận</Button>,
        ]}
        width={480}>
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary }}>
            Gửi <strong>{submittingRecord?.code ? `${submittingRecord.code} — ` : ''}{submittingRecord?.name}</strong> để Cảng vụ phê duyệt?
          </p>
        </div>
      </Modal>

      {/* ── Approve Modal (chuẩn /berth & ApprovalModal CHK) ──────── */}
      <ApprovalModal
        visible={approveModalOpen}
        level={approveLevel}
        onConfirm={(content) => { void confirmApprove(content); }}
        onCancel={() => { setApproveModalOpen(false); setApprovingRecord(null); }}
      />

      {/* ── Reject Reason Modal (chuẩn /berth) ────────────────────── */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Từ chối phê duyệt</span>}
        open={rejectModalOpen}
        onCancel={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); }}
        footer={[
          <Button key="cancel" onClick={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="reject" type="primary" danger loading={rejectLoading} onClick={handleReject}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Xác nhận từ chối</Button>,
        ]}
        width={480}>
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>Vui lòng nhập lý do từ chối cho đèn biển (không bắt buộc):</p>
          {rejectingRecord && (
            <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>
              <strong style={{ color: textPrimary }}>
                {rejectingRecord.code ? `${rejectingRecord.code} — ` : ''}{rejectingRecord.name}
              </strong>
            </p>
          )}
          <Input.TextArea
            placeholder="Nhập lý do từ chối (nếu có)..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            style={{ borderRadius: 8, fontSize: fontSizeMd }}
          />
        </div>
      </Modal>


      {/* ── GIS Map Modal (Rule 12: disabled mode for view — chuẩn /vts-operation-center) ── */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EnvironmentOutlined style={{ color: actionPrimary }} />
            <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg, fontSize: fontSizeLg }}>
              Xem vị trí trên bản đồ chuyên dụng
            </span>
          </div>
        }
        open={gisModalOpen}
        onCancel={() => setGisModalOpen(false)}
        destroyOnHidden
        width="90vw"
        style={{ top: 20, maxWidth: '1400px' }}
        footer={null}
      >
        <div style={{ padding: '8px 0' }}>
          <GisLocationSelector
            inline={true}
            height={560}
            disabled={true}
            value={{
              geometryType: detailRecord?.geometryType || 'POINT',
              coordinates: detailGisCoords.length > 0
                ? serializeCoordinatesToWkt(detailGisCoords, detailRecord?.geometryType || 'POINT')
                : String(detailRecord?.coordinates || ''),
              symbolId: detailRecord?.mapSymbolId || undefined,
            }}
            defaultGeometryType={detailRecord?.geometryType as 'POINT' | 'LINE' | 'POLYGON' | undefined}
          />
        </div>
      </Modal>

      {/* ── History Drawer (đồng bộ chuẩn /berth) ──────────────────── */}
      <AppDrawer
        width={DRAWER_WIDTH}
        rootClassName="beacon-drawer-scope"
        className="beacon-drawer-scope"
        mask
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Space size={spaceSm} style={{ alignItems: 'center' }}>
              <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
              <span style={drawerTitleStyle}>
                {historyTarget ? `Lịch sử thay đổi — ${historyTarget.name}` : 'Lịch sử thay đổi'}
              </span>
              <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeLg - 1, fontWeight: fontWeightBold, background: `${colors.sidebarBg}15`, color: colors.sidebarBg, lineHeight: '20px' }}>
                Tổng cộng {historyUpdateCount}
              </span>
            </Space>
          </div>
        }
        open={historyOpen}
        onClose={() => { setHistoryOpen(false); setHistoryTarget(null); setHistoryRecords([]); }}
        footer={null}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '16px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
        }}
      >
        <style>{`.history-dt-popup .ant-picker-now-btn { color: ${actionPrimary} !important; }`}</style>
        <div style={{ flexShrink: 0 }}>
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
            <DatePicker
              placeholder="Từ ngày"
              classNames={{ popup: { root: 'history-dt-popup' } }}
              value={historyFrom ? dayjs(historyFrom) : null}
              onChange={(d) => setHistoryFrom(d ? d.startOf('day').format('YYYY-MM-DDTHH:mm:ss') : '')}
              style={{ width: 140, borderRadius: radiusPill, height: 40 }}
              format="DD/MM/YYYY"
            />
            <DatePicker
              placeholder="Đến ngày"
              classNames={{ popup: { root: 'history-dt-popup' } }}
              value={historyTo ? dayjs(historyTo) : null}
              onChange={(d) => setHistoryTo(d ? d.endOf('day').format('YYYY-MM-DDTHH:mm:ss') : '')}
              style={{ width: 140, borderRadius: radiusPill, height: 40 }}
              format="DD/MM/YYYY"
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              loading={historyLoading}
              onClick={() => setHistorySearch(historySearchInput.trim())}
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}
            >
              Tìm kiếm
            </Button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }} onScroll={handleHistoryScroll}>
          {historyLoading && historyRecords.length === 0 ? (
            <LoadingSkeleton rows={5} />
          ) : validHistoryGroups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
              <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
              <div style={{ color: textTertiary, fontSize: fontSizeMd }}>
                {historySearch || historyFrom || historyTo ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận'}
              </div>
            </div>
          ) : (
            <>
              {renderHistoryTimeline()}
              {loadingMoreHistory && (
                <div style={{ padding: spaceMd, textAlign: 'center', color: textTertiary, fontSize: fontSizeMd }}>Đang tải thêm…</div>
              )}
            </>
          )}
        </div>
      </AppDrawer>

    </div>
    </ThemeTokenProvider>
  );
}

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Button,
  Modal,
  Input,
  Select,
  Space,
  Typography,
  Form,
  DatePicker,
  Tabs,
} from 'antd';
import {
  PlusOutlined,
  EnvironmentOutlined,
  HistoryOutlined,
  SearchOutlined,
  DownOutlined,
  RightOutlined,
  BankOutlined,
  SlidersOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';

import {
  beaconStationCRUD,
  approval,
  beaconHistory,
} from '../../services/beaconService';
import type { BeaconStation } from '../../types/beacon';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import {
  BEACON_STATUS_MAP,
  BEACON_LIGHT_TYPE_OPTIONS,
  type BeaconStatus,
} from '../../types/beacon';
import { organizationService } from '../../services/organizationService';
import { userService } from '../../services/userService';
import type { Organization } from '../../services/organizationService';
import api from '../../services/api';
import { ScreenHeader, DataTable } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import EmptyState from '../../components/EmptyState';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import toast from '../../components/ToastNotification';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore, type PermissionState } from '../../store/permissionStore';
import { VIETNAM_PROVINCE_OPTIONS, getProvinceNameById } from '../../types/common';
import { portCRUD } from '../../services/portService';
import { symbolService } from '../../services/symbolService';
import type { Symbol as MapSymbol } from '../../services/symbolService';
import { canEditApprovalRecord } from '../../utils/approvalEditPolicy';
import { AppDrawer } from '../../components/shared/AppDrawer';
import ApprovalModal from '../../components/shared/ApprovalModal';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import DetailTable from '../../components/shared/DetailTable';
import InfrastructureAttachmentTab from '../../components/shared/InfrastructureAttachmentTab';
import { FilterOrgUnitTreeSelect, normalizeSearchText, resolveDefaultOrgUnitId } from '../../components/org-unit';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../services/operatingOrganizationsData';
import { fmtNum } from '../../utils/numFmt';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import BeaconStationForm from './BeaconStationForm';
import {
  actionPrimary, textPrimary, textSecondary, textTertiary,
  fontWeightBold, fontWeightMedium, fontSizeSm, fontSizeLg,
  radiusPill,
  spaceXs, spaceSm, spaceMd, spaceFormField, spaceXl,
  surfaceCard,
  statusOperational, statusDraft, statusCritical, statusAttention,
  drawerTitleStyle, drawerFooterStyle, selectStyle,
  borderDefault, statusBadgeStyle, cellTitleStyle, cellSubtitleStyle,
  inputStyle, colors, primaryButtonStyle, outlineButtonStyle, dangerButtonStyle,
  confirmModalBodyStyle,
  requiredMarkStyle,
  DRAWER_TABLE_SCROLL_Y,
  getRangePickerProps,
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

// Cỡ chữ màn /beacon-stations: 13.5px chuẩn /berth (bỏ token tĩnh themetokenchk fontSizeMd=13px).
const fontSizeMd = 13.5;

const pillStyle = { borderRadius: radiusPill, height: 40 };

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

const parseWktToCoordinates = (wkt?: string): { latitude: number; longitude: number }[] => {
  if (!wkt) return [];
  try {
    const upper = wkt.trim().toUpperCase();
    if (upper.startsWith('POINT')) {
      const match = upper.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
      if (match) return [{ longitude: parseFloat(match[1]), latitude: parseFloat(match[2]) }];
    } else if (upper.startsWith('LINESTRING') || upper.startsWith('LINE')) {
      const match = upper.match(/LINESTRING\s*\(([^)]+)\)/i);
      if (match) {
        return match[1].split(',').map((pt) => {
          const parts = pt.trim().split(/\s+/);
          return { longitude: parseFloat(parts[0]), latitude: parseFloat(parts[1]) };
        });
      }
    } else if (upper.startsWith('POLYGON')) {
      const match = upper.match(/POLYGON\s*\(\(([^)]+)\)\)/i);
      if (match) {
        return match[1].split(',').map((pt) => {
          const parts = pt.trim().split(/\s+/);
          return { longitude: parseFloat(parts[0]), latitude: parseFloat(parts[1]) };
        });
      }
    }
  } catch {
    /* ignore invalid WKT */
  }
  return [];
};

const serializeCoordinatesToWkt = (coords: { latitude: number | null; longitude: number | null }[], geomType: string = 'POINT'): string => {
  const valid = coords.filter((c) => c.latitude != null && c.longitude != null && !isNaN(c.latitude) && !isNaN(c.longitude));
  if (valid.length === 0) return '';
  if (geomType === 'POINT') return `POINT (${valid[0].longitude} ${valid[0].latitude})`;
  if (geomType === 'LINE' || geomType === 'LINESTRING') return `LINESTRING (${valid.map((c) => `${c.longitude} ${c.latitude}`).join(', ')})`;
  if (geomType === 'POLYGON') {
    const pts = [...valid];
    if (pts.length >= 3 && (pts[0].latitude !== pts[pts.length - 1].latitude || pts[0].longitude !== pts[pts.length - 1].longitude)) pts.push(pts[0]);
    return `POLYGON ((${pts.map((c) => `${c.longitude} ${c.latitude}`).join(', ')}))`;
  }
  return `POINT (${valid[0].longitude} ${valid[0].latitude})`;
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
  DELETED: 'Đã xóa',
};

const STATUS_TAB_LIST = [
  { key: '', label: 'Tất cả', color: actionPrimary },
  { key: 'DRAFT', label: BEACON_APPROVAL_STATUS_LABELS.DRAFT, color: statusDraft },
  { key: 'PENDING_APPROVAL', label: BEACON_APPROVAL_STATUS_LABELS.PENDING_APPROVAL, color: actionPrimary },
  { key: 'APPROVED_LEVEL1', label: BEACON_APPROVAL_STATUS_LABELS.APPROVED_LEVEL1, color: statusAttention },
  { key: 'APPROVED', label: BEACON_APPROVAL_STATUS_LABELS.APPROVED, color: statusOperational },
  { key: 'REJECTED_LEVEL1', label: BEACON_APPROVAL_STATUS_LABELS.REJECTED_LEVEL1, color: statusCritical },
  { key: 'REJECTED_LEVEL2', label: BEACON_APPROVAL_STATUS_LABELS.REJECTED_LEVEL2, color: statusCritical },
  { key: 'DELETED', label: BEACON_APPROVAL_STATUS_LABELS.DELETED, color: statusCritical },
];

const TAB_QUERY_MAP: Record<string, BeaconStatus | undefined> = {
  '': undefined,
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED_LEVEL1: 'APPROVED_LEVEL1',
  APPROVED: 'APPROVED',
  REJECTED_LEVEL1: 'REJECTED_LEVEL1',
  REJECTED_LEVEL2: 'REJECTED_LEVEL2',
  DELETED: 'DELETED',
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
  DELETED: { color: statusCritical, label: 'Đã xóa' },
};

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

// Định dạng ngày riêng cho bảng con tab 'Vận hành & bảo trì' — khớp /berth:
// khi trống trả chuỗi rỗng '' thay vì null (formatDate toàn cục giữ nguyên cho nơi khác).
function formatOperationTableDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try { return dayjs(dateStr).format('DD/MM/YYYY HH:mm:ss'); } catch { return ''; }
}

// Số hiển thị: hàng nghìn ngăn bằng dấu phẩy (,), phần thập phân dùng dấu chấm (.)
const formatNumber = (v: number | string | null | undefined, maxFractionDigits = 6): string | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'string' ? Number(v) : v;
  if (!Number.isFinite(n)) return String(v);
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
  const hasPerm = usePermissionStore((s: PermissionState) => s.hasPermission);
  // "Lưu và phê duyệt" (duyệt thẳng cấp Cục) chỉ hiện khi tài khoản có quyền duyệt C2
  const canApproveDirect =
    hasPerm('beaconstation:approvec2') || hasPerm('beaconstation:approve')
    || hasPerm('data:approvec2') || hasPerm('*');

  const authUser = useAuthStore((s) => s.user);
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

  // ── Data ─────────────────────────────────────────────────────────
  const [dataSource, setDataSource] = useState<BeaconStation[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [, setError] = useState<Error | null>(null);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  // ── Organizations (form unit selector) ──────────────────────────
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [userOptions, setUserOptions] = useState<{ value: string; label: string }[]>([]);

  // ── Seaports (cảng biển) + GIS symbols ─────────────────────────
  const [seaports, setSeaports] = useState<{ id: string; portName?: string; portCode?: string }[]>([]);
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
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

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

  const historyFieldCount = useMemo(() => {
    if (!Array.isArray(historyRecords)) return 0;
    let count = 0;
    for (const r of historyRecords) {
      count += (r.changes && r.changes.length > 0) ? r.changes.length : 1;
    }
    return count;
  }, [historyRecords]);

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

  // ── Load organizations (for unit TreeSelect in the form) ─────────
  // Đơn vị quản lý là bộ lọc bắt buộc (giống Bến cảng):
  // tự chọn mặc định = đơn vị của user đang đăng nhập; nếu không khớp thì lấy đơn vị đầu tiên
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
        const found = data && data.length > 0
          ? data[0]
          : null;
        if (found) {
          defaultOrgUnitId.current = found.id;
          setFilterUnitId(found.id);
        } else {
          // lấy đơn vị của user đang đăng nhập
          try {
            const profileRes = await api.get('/users/me');
            const profile = (profileRes as any)?.data?.data ?? (profileRes as any)?.data;
            const userOrgId = profile?.orgUnitId;
            const match = userOrgId && orgs.find((o: any) => o.id === userOrgId);
            const defaultId = userOrgId ? (match ? userOrgId : orgs[0].id) : '__all__';
            defaultOrgUnitId.current = defaultId;
            setFilterUnitId(defaultId === '__all__' ? undefined : defaultId);
          } catch {
            defaultOrgUnitId.current = orgs[0].id;
            setFilterOrgUnitId(orgs[0].id);
          }
        }
      }
      setOrgUnitReady(true);
    };
    void loadOrgDefault();
  }, []);

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

  // ── Fetch tab counts (each tab = a separate search) ──────────────
  const fetchCounts = useCallback(async (unitId?: string) => {
    try {
      const targetUnit = unitId !== undefined ? unitId : filterUnitId;
      const results = await Promise.allSettled(
        STATUS_TAB_LIST.map((tab) =>
          beaconStationCRUD.search({
            status: TAB_QUERY_MAP[tab.key],
            unitId: (targetUnit && targetUnit !== '__all__') ? targetUnit : undefined,
            name: filterName.trim() || undefined,
            page: 1,
            pageSize: 1,
          }),
        ),
      );
      const counts: Record<string, number> = {};
      results.forEach((result, idx) => {
        const tabKey = STATUS_TAB_LIST[idx]?.key || '';
        counts[tabKey] = result.status === 'fulfilled' ? result.value.total : 0;
      });
      setTabCounts(counts);
    } catch { /* silent */ }
  }, [filterUnitId, filterName]);

  // ── Fetch main data ─────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setError(null);
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
      });
      setDataSource(res.data);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách đèn biển'));
    } finally {
      setIsLoading(false);
    }
  }, [filterName, filterCode, filterLightModel, filterType, filterStatus, filterUnitId, filterSeaportId, filterOperator, filterProvinceId, filterOperationalStatus, filterCommissionedFrom, filterCommissionedTo, filterUpdatedBy, filterUpdatedFrom, filterUpdatedTo, activeTab, page, pageSize]);

  useEffect(() => { if (orgUnitReady) void fetchData(); }, [fetchData, orgUnitReady]);
  useEffect(() => { if (orgUnitReady) void fetchCounts(filterUnitId); }, [filterUnitId, fetchCounts, orgUnitReady]);

  // ── Filter handlers ─────────────────────────────────────────────
  const handleFilterApply = useCallback(() => {
    setFilterName(inputName);
    setFilterCode(inputCode);
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
    setActiveTab(''); setPage(1);
  }, []);
  const handleTabChange = useCallback((key: string) => { setActiveTab(key); setPage(1); }, []);

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
    createForm.setFieldsValue({
      operationalStatus: 1,
      unitId: defaultOrgUnitId.current !== '__all__' ? defaultOrgUnitId.current : undefined,
    });
    setCreateDrawerVisible(true);
  }, [createForm, hasPerm]);

  const openEditDrawer = useCallback((record: BeaconStation) => {
    if (!canEditApprovalRecord(record.status || '', { hasPerm, resource: 'beaconstation', extraUpdatePerms: ['data:update', 'admin:manage'], extraApprovePerms: ['admin:manage'] })) {
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
      setDetailFiles(files || []);
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
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name || 'attachment';
      a.click();
      URL.revokeObjectURL(url);
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
  }, [hasPerm]);

  // ── Delete handlers ─────────────────────────────────────────────
  const openDeleteConfirm = useCallback((record: BeaconStation) => {
    setDeletingRecord(record); setDeleteConfirmText(''); setDeleteModalOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deletingRecord) return;
    const expectedText = (deletingRecord.name || 'XÓA').trim().toLowerCase();
    const input = deleteConfirmText.trim().toLowerCase();
    if (input !== expectedText && input !== 'xóa') {
      toast.error('Vui lòng nhập đúng tên đèn biển hoặc gõ "XÓA" để xác nhận');
      return;
    }
    try {
      await beaconStationCRUD.delete(deletingRecord.id);
      toast.success('Đã xóa đèn biển');
      setDeleteModalOpen(false); setDeletingRecord(null); setDeleteConfirmText('');
      void fetchData(); void fetchCounts();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Xóa thất bại'); }
  }, [deletingRecord, deleteConfirmText, fetchData, fetchCounts]);

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
    const reason = rejectReason.trim();
    if (!reason) { toast.error('Vui lòng nhập lý do từ chối'); return; }
    if (reason.length < 10) { toast.error('Lý do từ chối tối thiểu 10 ký tự'); return; }
    if (reason.length > 500) { toast.error('Lý do từ chối tối đa 500 ký tự'); return; }
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
    const isDeleted = Boolean(record.deletedAt || record.deletedBy || record.status === 'DELETED');
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
    if (canEditApprovalRecord(st, { hasPerm, resource: 'beaconstation', extraUpdatePerms: ['data:update', 'admin:manage'], extraApprovePerms: ['admin:manage'] })) {
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
  const columns: any[] = useMemo(() => [
    {
      key: 'sequenceNo', label: 'STT', width: 60, fixed: 'left' as const, align: 'center' as const,
      render: (_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd }}>{(page - 1) * pageSize + i + 1}</span>,
    },
    {
      key: 'name', label: 'Tên / Mã đèn biển', dataIndex: 'name', width: 300, fixed: 'left' as const, ellipsis: false,
      render: (name: string, record: BeaconStation) => {
        const canView = hasPerm('beaconstation:read') || hasPerm('beaconstation:view');
        return (
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {canView ? (
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
            ) : (
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
            )}
            <span style={{ ...cellSubtitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {record.code || null}
            </span>
          </div>
        );
      },
    },
    {
      key: 'unitName', label: 'Đơn vị quản lý', dataIndex: 'unitName', width: 300,
      render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary, fontWeight: fontWeightBold }}>{v || null}</span>,
    },
    {
      key: 'seaportId', label: 'Thuộc cảng biển', dataIndex: 'seaportId', width: 220, ellipsis: true,
      render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{seaports.find((p) => p.id === v)?.portName || null}</span>,
    },
    {
      key: 'operator', label: 'Đơn vị vận hành', dataIndex: 'operator', width: 280, ellipsis: true,
      render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || null}</span>,
    },
    {
      key: 'provinceId', label: 'Địa điểm (Tỉnh/TP)', dataIndex: 'provinceId', width: 230,
      render: (v: number) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{getProvinceNameById(v != null ? Number(v) : undefined) || null}</span>,
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
      render: (type: string) => {
        const opt = BEACON_LIGHT_TYPE_OPTIONS.find((o) => o.value === type);
        return <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{opt ? opt.label : (type || null)}</span>;
      },
    },
    {
      key: 'updatedByName', label: 'Cán bộ cập nhật', dataIndex: 'updatedByName', width: 220,
      render: (_: any, record: BeaconStation) => {
        const name = record.updatedByName || userOptions.find((u) => u.value === record.updatedBy)?.label;
        return (
          <div style={{ lineHeight: '1.35', overflow: 'hidden' }}>
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
            <div style={{ fontSize: fontSizeMd, color: textSecondary, whiteSpace: 'nowrap' }}>
              {record.updatedAt ? dayjs(record.updatedAt).format('DD/MM/YYYY HH:mm:ss') : null}
            </div>
          </div>
        );
      },
    },
    {
      key: 'submittedByName', label: 'Cán bộ gửi phê duyệt', dataIndex: 'submittedByName', width: 220,
      render: (_: any, record: BeaconStation) => {
        const name = record.submittedByName;
        const date = record.submittedAt;
        return (
          <div style={{ lineHeight: '1.35', overflow: 'hidden' }}>
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
            <div style={{ fontSize: fontSizeMd, color: textSecondary, whiteSpace: 'nowrap' }}>
              {date ? dayjs(date).format('DD/MM/YYYY HH:mm:ss') : null}
            </div>
          </div>
        );
      },
    },
    {
      key: 'approverLevel1Name', label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục', dataIndex: 'approverLevel1Name', width: 240,
      render: (_: any, record: BeaconStation) => {
        const name = record.approverLevel1Name;
        const date = record.approvedDateLevel1;
        return (
          <div style={{ lineHeight: '1.35', overflow: 'hidden' }}>
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
            <div style={{ fontSize: fontSizeMd, color: textSecondary, whiteSpace: 'nowrap' }}>
              {date ? dayjs(date).format('DD/MM/YYYY HH:mm:ss') : null}
            </div>
          </div>
        );
      },
    },
    {
      key: 'approverLevel2Name', title: <span style={{ whiteSpace: 'nowrap' }}>Cán bộ phê duyệt cấp Cục</span>, dataIndex: 'approverLevel2Name', width: 300,
      render: (_: any, record: BeaconStation) => {
        const name = record.approverLevel2Name;
        const date = record.approvedDateLevel2;
        return (
          <div style={{ lineHeight: '1.35', overflow: 'hidden' }}>
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
            <div style={{ fontSize: fontSizeMd, color: textSecondary, whiteSpace: 'nowrap' }}>
              {date ? dayjs(date).format('DD/MM/YYYY HH:mm:ss') : null}
            </div>
          </div>
        );
      },
    },
    {
      key: 'status', label: 'Trạng thái', dataIndex: 'status', width: 200,
      render: (status: string, record: BeaconStation) => {
        const isDeleted = Boolean(record.deletedAt || record.deletedBy || status === 'DELETED');
        const displayStatus = isDeleted ? 'DELETED' : status;
        const s = BEACON_STATUS_STYLE_MAP[displayStatus] || { color: textTertiary, label: displayStatus || null };
        return <span style={statusBadgeStyle(s.color)}>{s.label}</span>;
      },
    },
  ], [page, pageSize, openDetailDrawer, seaports, userOptions, hasPerm]);

  const tableData = useMemo(
    () => dataSource.map((item, idx) => ({ ...item, _rowIndex: (page - 1) * pageSize + idx + 1 })),
    [dataSource, page, pageSize],
  );

  // ── Filter panel content (markup div tay chuẩn /berth) ──
  const filterContent = (
    <>
      <div style={{ marginBottom: 12, marginTop: spaceMd }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Đơn vị quản lý</div>
        <FilterOrgUnitTreeSelect
          organizations={organizations}
          value={filterUnitId}
          onChange={(v) => { setFilterUnitId(v); setPage(1); }}
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
              options={seaports.map((p) => ({ value: p.id, label: p.portCode ? `${p.portCode} - ${p.portName || ''}` : (p.portName || p.id) }))}
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
              format={['DD/MM/YYYY', 'YYYY-MM-DD']}
              {...getRangePickerProps({
                value: rangeValue(filterCommissionedFrom, filterCommissionedTo),
                onChange: (range) => { setFilterCommissionedFrom(range && range[0] ? range[0].format('YYYY-MM-DD') : ''); setFilterCommissionedTo(range && range[1] ? range[1].format('YYYY-MM-DD') : ''); setPage(1); },
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
              format={['DD/MM/YYYY', 'YYYY-MM-DD']}
              {...getRangePickerProps({
                value: rangeValue(filterUpdatedFrom, filterUpdatedTo),
                onChange: (range) => { setFilterUpdatedFrom(range && range[0] ? range[0].format('YYYY-MM-DD') : ''); setFilterUpdatedTo(range && range[1] ? range[1].format('YYYY-MM-DD') : ''); setPage(1); },
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
  const statusTabs = STATUS_TAB_LIST.map((tab) => ({
    key: tab.key, label: tab.label, count: tabCounts[tab.key] ?? 0,
    color: tab.color, active: activeTab === tab.key,
  }));

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
        { label: 'Thời điểm đưa vào sử dụng', value: formatDate(detailRecord.commissionedDate) },
        { label: 'Thời điểm sửa chữa gần nhất', value: formatDate(detailRecord.lastRepairDate) },
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
          label: 'Trạng thái phê duyệt',
          value: (() => {
            const isDel = Boolean(detailRecord.deletedAt || detailRecord.deletedBy || detailRecord.status === 'DELETED');
            if (isDel) {
              const s = BEACON_STATUS_STYLE_MAP.DELETED || { color: statusCritical, label: 'Đã xóa' };
              return <span style={statusBadgeStyle(s.color)}>{s.label}</span>;
            }
            return <ApprovalStatusBadge status={detailRecord.status} labelOverrides={BEACON_APPROVAL_STATUS_LABELS} />;
          })(),
        },
        { label: 'Cán bộ cập nhật', value: <span style={{ fontWeight: fontWeightBold }}>{detailRecord.updatedByName || userOptions.find((u) => u.value === detailRecord.updatedBy)?.label || null}</span> },
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
                : Promise.reject(new Error('Chưa xác định được bản ghi đèn biển để tải ảnh'));
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

  const BEACON_HISTORY_FIELD_LABELS: Record<string, string> = {
    code: 'Mã đèn biển', name: 'Tên đèn biển', type: 'Cấp trạm đèn', unitId: 'Đơn vị quản lý',
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

  const BEACON_HISTORY_FIELD_ORDER = [
    'unitId', 'unitName', 'code', 'name', 'type', 'seaportId', 'operator',
    'provinceId', 'region', 'location', 'detailedLocation', 'operationalStatus',
    'towerHeight', 'lightHeight', 'lightRange', 'geographicRange',
    'towerColor', 'shape', 'structure', 'primaryLightModel', 'backupLightModel',
    'powerSupply', 'stationArea', 'area', 'staffCount',
    'commissionedDate', 'lastRepairDate', 'identifyingFeature',
    'geometryType', 'coordinates', 'mapSymbolId', 'coordinateSystem', 'displayRule',
    'approvalStatus', 'rejectionReason', 'note',
  ];

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
    if (field === 'lastRepairDate' || field === 'commissionedDate' || field.endsWith('At')) {
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
    const metaKeys = new Set(['id', 'spatialId', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy',
      'deletedAt', 'deletedBy', 'approvedBy', 'approvedDate', 'approvalLevel', 'submittedBy', 'submittedAt',
      'approverLevel1', 'approverLevel1Name', 'approverLevel2', 'approverLevel2Name',
      'approvedDateLevel1', 'approvedDateLevel2', 'approvalContentLevel1', 'approvalContentLevel2',
      'status', 'submittedByName']);
    const oldMap = parseJson(raw?.previousValue);
    const newMap = parseJson(raw?.newValue);
    const changes: Array<{ field: string; oldValue: string | null; newValue: string | null }> = [];
    const pushRow = (field: string, oldValue: string | null, newValue: string | null) => {
      if (metaKeys.has(field)) return;
      const ov = oldValue === null || oldValue === undefined ? null : String(oldValue);
      const nv = newValue === null || newValue === undefined ? null : String(newValue);
      if (ov === null && nv === null) return;
      if (ov !== null && nv !== null && ov.trim() === nv.trim()) return;
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
        pushRow(isReject ? 'rejectionReason' : '', null, String(rawText));
      }
    }
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
      reason: raw?.reason ?? null,
      approvalLevel: raw?.approvalLevel,
    };
  }, []);

  useEffect(() => {
    if (!historyOpen || !historyTarget) return;
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
    if (!historyTarget || historyLoading || loadingMoreHistory || !hasMoreHistory) return;
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

  function renderHistoryTimeline(records: any[]) {
    if (!records || records.length === 0) {
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
        return <span style={{ color: textTertiary }}>{(gisKey || isGeom || isSymbol) ? 'Chưa có' : '—'}</span>;
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
    const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000);
    const sorted = [...records].sort((a, b) => new Date(historyTimestamp(b) || 0).getTime() - new Date(historyTimestamp(a) || 0).getTime());
    const groups: { tsSec: number; ts: string; actor: string; items: any[] }[] = [];
    for (const r of sorted) {
      const ts = historyTimestamp(r);
      const sec = ts ? toSec(ts) : 0;
      const actor = historyActorName(r);
      const prev = groups[groups.length - 1];
      if (prev && prev.tsSec === sec && prev.actor === actor) prev.items.push(r);
      else groups.push({ tsSec: sec, ts, actor, items: [r] });
    }
    const fmtTime = (ts: string) => {
      const d = dayjs(ts);
      return `${d.format('HH:mm')} ${d.format('DD/MM/YYYY')}`;
    };
    return (
      <div>
        {groups.map((g, gi) => {
          const rec0 = g.items[0] || {};
          const allChanges = g.items.flatMap((item) => (item.changes && item.changes.length > 0 ? item.changes : []));
          if (allChanges.length === 0) return null;

          const actionMeta = resolveHistoryActionMeta(g, allChanges);
          // Đơn vị của user thực hiện cập nhật (chuẩn /vts-operation-center) — KHÔNG lấy unitId của tài sản
          const orgNameFromId = (rec0.unitId && orgMap.get(rec0.unitId)) || (rec0.orgUnitId && orgMap.get(rec0.orgUnitId));
          const unitName = rec0.orgUnitName || orgNameFromId || rec0.unitName || '—';

          const isCreate = allChanges.every((c: any) => c.oldValue === null || c.oldValue === '(null)' || c.oldValue === '' || c.oldValue === 'null');
          const informationTitle = isCreate ? 'Thông tin thêm mới:' : 'Thông tin thay đổi:';

          const orderedChanges = [...allChanges].sort((a: any, b: any) => {
            const ia = BEACON_HISTORY_FIELD_ORDER.indexOf(a.field);
            const ib = BEACON_HISTORY_FIELD_ORDER.indexOf(b.field);
            return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
          });

          return (
            <div key={gi} style={{ ...historyGroupGridStyle, marginBottom: gi < groups.length - 1 ? spaceSm : 0 }}>
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
          justify-content: center !important;
          justify-content: safe center !important;
          align-items: center !important;
          scrollbar-width: thin !important;
          scrollbar-color: #cbd5e1 #f8fafc !important;
          scroll-behavior: smooth !important;
          -webkit-overflow-scrolling: touch !important;
          padding: 2px 16px 6px 16px !important;
          gap: 20px !important;
        }
        .beacon-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar {
          height: 6px !important;
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
        }
      `}</style>

      <ScreenHeader
        breadcrumb={[{ label: 'Quản lý hàng hải' }, { label: 'Quản lý Đèn biển và nhà trạm gắn với Đèn biển' }]}
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
            .ant-drawer-body .chk-detail-row:last-child {
              border-bottom: none !important;
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
        width={typeof window !== 'undefined' ? Math.min(1000, Math.floor(window.innerWidth * 0.95)) : 1000}
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
        width="min(920px, 96vw)"
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
              onFinish={() => { setCreateDrawerVisible(false); void fetchData(); void fetchCounts(); }}
              onSubmittingChange={setSubmitting}
            />
          </Form>
        )}
      </AppDrawer>

      {/* ── Edit Drawer ────────────────────────────────────────────── */}
      <AppDrawer
        width="min(920px, 96vw)"
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
                  Cập nhật
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
                  Cập nhật và gửi phê duyệt
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
                onFinish={() => { setEditingRecord(null); void fetchData(); void fetchCounts(); }}
                onSubmittingChange={setSubmitting}
              />
            </Form>
          </>
        )}
      </AppDrawer>

      {/* ── Delete Confirmation Modal ────────────────────────────── */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Xác nhận xóa đèn biển</span>}
        open={deleteModalOpen}
        onCancel={() => { setDeleteModalOpen(false); setDeletingRecord(null); setDeleteConfirmText(''); }}
        footer={[
          <Button key="cancel" onClick={() => { setDeleteModalOpen(false); setDeletingRecord(null); setDeleteConfirmText(''); }}
            style={outlineButtonStyle}>Hủy</Button>,
          <Button key="delete" type="primary" danger onClick={confirmDelete} style={dangerButtonStyle}>Xác nhận xóa</Button>,
        ]}
        width={480}
      >
        <div style={confirmModalBodyStyle}>
          <p style={{ marginBottom: spaceFormField }}>
            Vui lòng nhập <strong>tên đèn biển</strong> hoặc gõ <strong>"XÓA"</strong> để xác nhận xóa.
          </p>
          {deletingRecord && (
            <p style={{ marginBottom: spaceFormField }}>
              Đèn biển: <strong style={{ color: textPrimary }}>{deletingRecord.name}</strong>
            </p>
          )}
          <Input placeholder="Nhập tên đèn biển hoặc XÓA" value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)} onPressEnter={confirmDelete}
            style={inputStyle} autoFocus />
        </div>
      </Modal>

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
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>{rejectLevel === 'c2' ? 'Từ chối cấp Cục' : 'Từ chối cấp Cảng vụ/Chi cục'}</span>}
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
          <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>Vui lòng nhập lý do từ chối cho đèn biển:</p>
          {rejectingRecord && (
            <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>
              <strong style={{ color: textPrimary }}>{rejectingRecord.name}</strong>
            </p>
          )}
          <Input.TextArea placeholder="Nhập lý do từ chối (tối thiểu 10, tối đa 500 ký tự)..." value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)} rows={3} maxLength={500} showCount
            style={{ borderRadius: 8, fontSize: fontSizeMd }} />
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
        width="min(880px, 96vw)"
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
                Tổng cộng {historyFieldCount}
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
          ) : historyRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
              <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
              <div style={{ color: textTertiary, fontSize: fontSizeMd }}>
                {historySearch || historyFrom || historyTo ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận'}
              </div>
            </div>
          ) : (
            <>
              {renderHistoryTimeline(historyRecords)}
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

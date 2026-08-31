import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Button, Modal, Drawer, Input, Space, Typography, Alert, DatePicker, Radio, Select,
  Form, Tabs, Row, Col, InputNumber, Upload, Table,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined,
  CheckCircleOutlined, CloseCircleOutlined,
  EyeOutlined, HistoryOutlined, SearchOutlined, ExclamationCircleOutlined,
   FileOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../services/api';
import { dryPortCRUD, dryPortApproval, dryPortHistory } from '../../services/portService';
import type { DryPort } from '../../types/port';
import DryPortDetailContent from './DryPortDetailContent';
import { OrgUnitTreeSelect } from '../../components/org-unit';
import { userService } from '../../services/userService';
import { organizationService } from '../../services/organizationService';
import type { Organization } from '../../services/organizationService';
import { symbolService } from '../../services/symbolService';
import type { Symbol } from '../../services/symbolService';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import { ScreenHeader, FilterTableLayout, DataTable } from '../../components/list-view';
import PagedTable from '../../components/list-view/PagedTable';
import Pagination from '../../components/list-view/Pagination';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { VIETNAM_PROVINCES } from '../../types/common';
import toast from '../../components/ToastNotification';
import { focusErrorTab } from '../../utils/formValidationHelper';
import { fmtInputNumber } from '../../utils/numFmt';
import {
  statusOperational,
  statusAttention,
  statusCritical,
  statusDraft,
  actionPrimary,
  textPrimary,
  textSecondary,
  textTertiary,
  fontSizeMd,
  fontSizeLg,
  fontSizeSm,
  fontWeightBold,
  radiusPill,
  radiusMd,
  borderDefault,
  spaceSm,
  spaceMd,
  spaceFormField,
  surfaceCard,
  historyBadgeStyle,
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
  spaceXs,
  spaceXl,
  drawerProps,
  drawerCloseBtnStyle,
  drawerTitleStyle,
  drawerFooterStyle,
  primaryButtonStyle,
  outlineButtonStyle,
  fontWeightMedium,
  requiredMarkStyle,
  uploadHintStyle,
  getRangePickerProps,
} from '../../tokens';
import { colors } from '../../theme';
import { canEditApprovalRecord } from '../../utils/approvalEditPolicy';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import { approvalStatusLabel } from '../../components/shared/ApprovalStatusBadge';
import { APPROVAL_STATUS_OPTIONS } from '../../components/shared/ApprovalStatusBadge';
import { APPROVAL_STATUS_STYLE } from '../../components/shared/ApprovalStatusBadge';
import { formLabelProps as labelProps } from '../../components/shared/formLabel';


/* ───────────────────────────────────────────────
   Constants
   ─────────────────────────────────────────────── */
const APPROVAL_STYLE_MAP: Record<string, { color: string; label: string }> = {
  NHAP: { color: statusDraft, label: 'Lưu tạm' },
  DRAFT: { color: statusDraft, label: 'Lưu tạm' },
  PENDING: { color: statusAttention, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  PENDING_APPROVAL: { color: statusAttention, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  APPROVED_LEVEL1: { color: statusAttention, label: 'Chờ phê duyệt cấp cục' },
  APPROVED_LEVEL2: { color: statusAttention, label: 'Chờ phê duyệt cấp cục' },
  APPROVED: { color: statusOperational, label: 'Đã phê duyệt' },
  REJECTED: { color: statusCritical, label: 'Từ chối cấp Cảng vụ/Chi cục' },
  REJECTED_LEVEL1: { color: statusCritical, label: 'Từ chối cấp Cảng vụ/Chi cục' },
  REJECTED_LEVEL2: { color: statusCritical, label: 'Từ chối cấp cục' },
};

const TAB_STATUS_LIST = [
  { key: 'all', label: 'Tất cả', color: textSecondary },
  { key: 'DRAFT', label: 'Lưu tạm', color: statusDraft },
  { key: 'APPROVED', label: 'Đã phê duyệt', color: statusOperational },
];


/* ── Cảng cạn form constants (merged from the previous form component) ── */
const GEOMETRY_TYPE_OPTIONS = [
  { value: 'POINT', label: 'Đối tượng điểm' },
  { value: 'LINE', label: 'Đối tượng đường' },
  { value: 'POLYGON', label: 'Đối tượng vùng' },
];

const COORD_SYS_OPTIONS = [
  { value: 1, label: 'WGS-84' },
  { value: 2, label: 'VN-2000' },
];

// Số lượng tọa độ mặc định theo loại đối tượng: điểm → 1, đường → 2, vùng → 3
const GEOMETRY_POINT_COUNT: Record<string, number> = { POINT: 1, LINE: 2, POLYGON: 3 };

const PORT_STATUS_OPTIONS = [
  { value: 0, label: 'Chưa khai thác/vận hành' },
  { value: 1, label: 'Đang khai thác/vận hành' },
  { value: 2, label: 'Dừng khai thác/vận hành' },
];

const REGION_OPTIONS = [
  { value: 'Phía Bắc', label: 'Phía Bắc' },
  { value: 'Phía Nam', label: 'Phía Nam' },
  { value: 'Miền Trung - Tây Nguyên', label: 'Miền Trung - Tây Nguyên' },
];

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const MAX_FILE_COUNT = 10;

/* ── Save actions ── */
type SaveAction = 'DRAFT' | 'SUBMIT' | 'SAVE_AND_APPROVE' | 'UPDATE';

/* ── Chuyển độ thập phân → DMS (Độ/Phút/Giây) ── */
const ddToDms = (dd: number | null | undefined): { d: number | null; m: number | null; s: number | null } => {
  if (dd == null || isNaN(dd)) return { d: null, m: null, s: null };
  let abs = Math.abs(dd);
  let d = Math.floor(abs);
  let mFloat = (abs - d) * 60;
  if (mFloat > 59.999999999) { d += 1; mFloat = 0; }
  let m = Math.floor(mFloat);
  let sFloat = (mFloat - m) * 60;
  if (sFloat > 59.999999999) { m += 1; sFloat = 0; if (m >= 60) { m = 0; d += 1; } }
  let s = Math.round(sFloat * 100) / 100;
  if (s >= 60) { s = 0; m += 1; if (m >= 60) { m = 0; d += 1; } }
  return { d: d === 0 ? null : d, m: m === 0 ? null : m, s: s === 0 ? null : s };
};

/* ── Dựng WKT từ danh sách tọa độ theo loại đối tượng ── */
const buildCoordinatesWkt = (
  geometryType: string | undefined,
  coords: Array<{ latitude: number; longitude: number }>,
): string | undefined => {
  if (coords.length === 0) return undefined;
  const pt = (c: { latitude: number; longitude: number }) => `${c.longitude} ${c.latitude}`;
  if (coords.length === 1 || geometryType === 'POINT') return `POINT(${pt(coords[0])})`;
  if (geometryType === 'LINE') return `LINESTRING(${coords.map(pt).join(',')})`;
  if (geometryType === 'POLYGON') {
    const ring = coords.map(pt);
    if (ring[0] !== ring[ring.length - 1]) ring.push(ring[0]);
    return `POLYGON((${ring.join(',')}))`;
  }
  return `MULTIPOINT(${coords.map((c) => `(${pt(c)})`).join(',')})`;
};

/* ── Parse WKT coordinates (từ trường coordinates của đối tượng) ── */
const parseGisCoordinates = (
  gisLocation: { geometryType?: string; coordinates?: string } | undefined | null,
): Array<{ latitude: number; longitude: number }> => {
  const wkt = gisLocation?.coordinates;
  if (!wkt || typeof wkt !== 'string' || !wkt.trim()) return [];
  try {
    if (wkt.startsWith('LINESTRING(')) {
      const match = wkt.match(/LINESTRING\s*\(([^)]+)\)/);
      if (match) {
        return match[1].split(',').map((pt) => {
          const parts = pt.trim().split(/\s+/);
          return { latitude: parseFloat(parts[1]), longitude: parseFloat(parts[0]) };
        }).filter((c) => !Number.isNaN(c.latitude) && !Number.isNaN(c.longitude));
      }
    }
    if (wkt.startsWith('POLYGON((')) {
      const match = wkt.match(/POLYGON\s*\(\(([^)]+)\)\)/);
      if (match) {
        const pts = match[1].split(',').map((pt) => {
          const parts = pt.trim().split(/\s+/);
          return { latitude: parseFloat(parts[1]), longitude: parseFloat(parts[0]) };
        }).filter((c) => !Number.isNaN(c.latitude) && !Number.isNaN(c.longitude));
        if (pts.length > 1 && pts[0].longitude === pts[pts.length - 1].longitude && pts[0].latitude === pts[pts.length - 1].latitude) {
          pts.pop();
        }
        return pts;
      }
    }
    const multiMatch = wkt.match(/MULTIPOINT\s*\(([^)]+(?:\),[^)]+)*)/);
    if (multiMatch) {
      return multiMatch[1]
        .split('),(')
        .map((pt) => {
          const parts = pt.replace(/[()]/g, '').trim().split(/\s+/);
          return { latitude: parseFloat(parts[1]), longitude: parseFloat(parts[0]) };
        })
        .filter((c) => !Number.isNaN(c.latitude) && !Number.isNaN(c.longitude));
    }
    const match = wkt.match(/POINT\s*\(([\d.\-]+)\s+([\d.\-]+)\)/);
    if (match) {
      return [{ latitude: parseFloat(match[2]), longitude: parseFloat(match[1]) }];
    }
  } catch {
    /* invalid WKT */
  }
  return [];
};

/* ── Form helper styles (merged from the previous form component) ── */
const inputStyle: React.CSSProperties = {
  borderRadius: radiusPill,
  height: 40,
};

const selectStyle: React.CSSProperties = {
  borderRadius: radiusPill,
  height: 40,
};

const numberInputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: radiusPill,
  height: 40,
};

/* ── Helpers ────────────────────────────────────────────── */
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try { return dayjs(dateStr).format('DD/MM/YYYY HH:mm:ss'); } catch { return dateStr; }
}

function provinceName(provinceId: number | null | undefined): string {
  if (provinceId == null || provinceId < 1 || provinceId > VIETNAM_PROVINCES.length) return '—';
  return VIETNAM_PROVINCES[provinceId - 1];
}

const historyFieldLabels: Record<string, string> = {
  dryPortCode: 'Mã cảng cạn', dryPortName: 'Tên cảng cạn', provinceId: 'Tỉnh/Thành phố',
  operatingUnit: 'Đơn vị vận hành', region: 'Vùng', detailedLocation: 'Địa chỉ chi tiết',
  transportCorridor: 'Hành lang vận tải', area: 'Diện tích', warehouseArea: 'Diện tích kho',
  yardArea: 'Diện tích bãi', teuCapacity: 'Công suất TEU', connectionMode: 'Phương thức kết nối',
  portStatus: 'Tình trạng', operationalStatus: 'Trạng thái hoạt động', remarks: 'Ghi chú',
  mapSymbolId: 'Biểu tượng', coordinateSystem: 'Hệ tọa độ', displayRule: 'Quy tắc hiển thị',
  announcementTime: 'Thời điểm công bố đưa vào sử dụng', announcementDecisionNumber: 'Quyết định công bố số',
  announcementDecisionDate: 'Ngày ra quyết định công bố', announcementOrg: 'Đơn vị ra quyết định công bố',
  approvalStatus: 'Trạng thái phê duyệt', orgUnitId: 'Đơn vị quản lý',
  'Lý do từ chối': 'Lý do từ chối',
  'Trạng thái': 'Hành động',
};
function historyFieldName(fn: string) { return historyFieldLabels[fn] || fn; }
function historyFieldValue(fn: string, val: string | null, orgMap?: Map<string, string>, symbolMap?: Map<string, string>): string {
  if (!val || val === '(null)' || val === 'null') return '(trống)';
  if (fn === 'orgUnitId' && orgMap) { const full = orgMap.get(val); return full ? full.split(' - ').pop() || full : val; }
  if ((fn === 'mapSymbolId' || fn === 'symbolId') && symbolMap) return symbolMap.get(val) || val;
  if (fn === 'approvalStatus') { const m: Record<string, string> = { NHAP: 'Lưu tạm', DRAFT: 'Lưu tạm', PENDING: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', PENDING_APPROVAL: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', APPROVED_LEVEL1: 'Chờ phê duyệt cấp cục', APPROVED_LEVEL2: 'Chờ phê duyệt cấp cục', APPROVED: 'Đã phê duyệt', REJECTED: 'Từ chối cấp Cảng vụ/Chi cục', REJECTED_LEVEL1: 'Từ chối cấp Cảng vụ/Chi cục', REJECTED_LEVEL2: 'Từ chối cấp cục' }; return m[val] || val; }
  if (fn === 'operationalStatus') { const m: Record<string, string> = { OPERATIONAL: 'Đang hoạt động', SUSPENDED: 'Tạm ngừng' }; return m[val] || val; }
  if (fn === 'portStatus') { const m: Record<string, string> = { '0': 'Chưa khai thác', '1': 'Vận hành' }; return m[val] || val; }
  if (fn === 'announcementTime' || fn === 'changedAt' || fn === 'createdAt') { try { return dayjs(val).format('DD/MM/YYYY HH:mm:ss'); } catch { return val; } }
  if (fn === 'announcementDecisionDate') { try { return dayjs(val).format('DD/MM/YYYY'); } catch { return val; } }
  return val;
}
function getActionLabel(items: any[]): { label: string; color: string } {
  const fields = items.map((i: any) => i.fieldName || '');
  const oldVals = items.map((i: any) => i.oldValue || '');
  const newVals = items.map((i: any) => i.newValue || '');
  if (fields.includes('deletedAt') || newVals.includes('Đã xóa')) return { label: 'Xóa', color: 'red' };
  if (fields.includes('approvalStatus')) {
    const newStatus = newVals[fields.indexOf('approvalStatus')];
    if (newStatus === 'APPROVED') return { label: 'Phê duyệt', color: 'green' };
    if (newStatus === 'REJECTED') return { label: 'Từ chối', color: 'red' };
    if (newStatus === 'PENDING' || newStatus === 'PENDING_APPROVAL') return { label: 'Gửi phê duyệt', color: 'orange' };
  }
  const nullCount = oldVals.filter(v => v === '(null)' || v === 'null').length;
  if (nullCount > items.length / 2) return { label: 'Tạo mới', color: 'blue' };
  return { label: 'Chỉnh sửa', color: 'blue' };
}

/* ───────────────────────────────────────────────
   Component
   ─────────────────────────────────────────────── */
export default function DryPortListPage() {
  const hasPerm = usePermissionStore((s: { hasPermission: (key: string) => boolean }) => s.hasPermission);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [filterProvince, setFilterProvince] = useState<number | undefined>();
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [filterOrgUnitId, setFilterOrgUnitId] = useState<string | undefined>();
  const [filterRegion, setFilterRegion] = useState<string | undefined>();
  const [filterCode, setFilterCode] = useState<string | undefined>();
  const [filterTransportCorridor, setFilterTransportCorridor] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<number | undefined>();
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState<string | undefined>();
  const [filterUpdatedTo, setFilterUpdatedTo] = useState<string | undefined>();
  const defaultOrgUnitId = useRef<string | undefined>(undefined);
  const defaultOrgApplied = useRef(false);
  const [orgUnitReady, setOrgUnitReady] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortField, setSortField] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend'>('descend');

  const [dataSource, setDataSource] = useState<DryPort[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [, setError] = useState<Error | null>(null);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<DryPort | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailFiles, setDetailFiles] = useState<any[]>([]);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<DryPort | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRecord, setRejectingRecord] = useState<DryPort | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');


  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvingRecord, setApprovingRecord] = useState<DryPort | null>(null);

  // ── History (chuẩn Cảng biển: Drawer + timeline VTS grid) ──────
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<DryPort | null>(null);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearchInput, setHistorySearchInput] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');
  const [historyMode, setHistoryMode] = useState<'current' | 'all'>('current');
  const [historyEntityNames, setHistoryEntityNames] = useState<Record<string, string>>({});
  const [historyEntityFilter, setHistoryEntityFilter] = useState('');

  const historyFieldCount = useMemo(() => historyRecords.length, [historyRecords]);

  const openHistory = useCallback(async (r: DryPort) => {
    setHistoryTarget(r); setHistoryOpen(true); setHistoryLoading(true); setHistoryRecords([]);
    setHistorySearchInput(''); setHistorySearch(''); setHistoryFrom(''); setHistoryTo('');
    setHistoryMode('current');
    try {
      const d = await dryPortHistory.getHistory(r.id, { page: 0, size: 200 });
      setHistoryRecords(Array.isArray(d?.changeHistory) ? d.changeHistory : []);
    } catch { toast.error('Không thể tải lịch sử thay đổi'); }
    finally { setHistoryLoading(false); }
  }, []);

  // Thứ tự hiển thị field trong lịch sử theo đúng thứ tự form tạo mới cảng cạn
  const HISTORY_FIELD_ORDER = ['orgUnitId', 'dryPortCode', 'dryPortName', 'provinceId', 'operatingUnit', 'region', 'detailedLocation', 'transportCorridor', 'area', 'warehouseArea', 'yardArea', 'teuCapacity', 'connectionMode', 'portStatus', 'operationalStatus', 'announcementTime', 'announcementDecisionNumber', 'announcementDecisionDate', 'announcementOrg', 'remarks', 'mapSymbolId', 'coordinateSystem', 'displayRule', 'approvalStatus'];

  // ── Render lịch sử theo chuẩn Cảng biển (PortListPage / BerthList) ──
  const renderDryPortHistoryTimeline = (records: any[]) => {
    const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000);
    const sorted = [...records].sort((a: any, b: any) => new Date(b.changedAt || b.createdAt).getTime() - new Date(a.changedAt || a.createdAt).getTime());
    const q = historySearch.toLowerCase().trim();
    const groups: { tsSec: number; ts: string; actor: string; items: any[] }[] = [];
    for (const r of sorted) {
      if (q) {
        const fn = (r.fieldName || '').toLowerCase();
        const ov = (r.oldValue || '').toLowerCase();
        const nv = (r.newValue || '').toLowerCase();
        const lb = historyFieldName(r.fieldName || '').toLowerCase();
        const od = historyFieldValue(r.fieldName, r.oldValue, orgMap, symbolMap).toLowerCase();
        const nd = historyFieldValue(r.fieldName, r.newValue, orgMap, symbolMap).toLowerCase();
        if (!fn.includes(q) && !ov.includes(q) && !nv.includes(q) && !lb.includes(q) && !od.includes(q) && !nd.includes(q)) continue;
      }
      if (historyEntityFilter && r.entityId !== historyEntityFilter) continue;
      if (historyFrom || historyTo) {
        const cd = (r.changedAt || r.createdAt || '').substring(0, 16);
        if (historyFrom && cd < historyFrom.replace(' ', 'T')) continue;
        if (historyTo && cd > historyTo.replace(' ', 'T') + ':59') continue;
      }
      const ts = r.changedAt || r.createdAt || '';
      const sec = ts ? toSec(ts) : 0;
      const prev = groups[groups.length - 1];
      if (prev && prev.tsSec === sec && prev.actor === (r.changedBy || '')) prev.items.push(r);
      else groups.push({ tsSec: sec, ts, actor: r.changedBy || '', items: [r] });
    }
    if (groups.length === 0) return (
      <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
        <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
        <div style={{ color: textTertiary, fontSize: fontSizeMd }}>{q || historyFrom || historyTo ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận'}</div>
      </div>
    );
    const fmtTime = (ts: string) => { const d = new Date(ts); return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`; };
    return (
      <div>{groups.map((g, gi) => {
        const rec0 = g.items[0] || {};
        const orgId = rec0.orgUnitId || historyTarget?.orgUnitId;
        const orgName = orgId ? orgMap.get(orgId) : undefined;
        const unitName = (orgName ? (orgName.split(' - ').pop() || orgName) : (rec0.orgUnitName || rec0.unitName)) || '—';
        const barColor = actionPrimary;
        const changes = g.items.map((item: any) => ({ field: item.fieldName || '—', oldValue: item.oldValue ?? null, newValue: item.newValue ?? null }));
        const isCreate = changes.every((c: any) => c.oldValue === null || c.oldValue === '(null)' || c.oldValue === '');
        const informationTitle = isCreate ? 'Thông tin thêm mới:' : 'Thông tin thay đổi:';
        const orderedChanges = [...changes].sort((a: any, b: any) => {
          const ia = HISTORY_FIELD_ORDER.indexOf(a.field);
          const ib = HISTORY_FIELD_ORDER.indexOf(b.field);
          return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        }).filter((c: any) => c.field !== 'infrastructureList' && c.field !== 'attachments' && c.field !== 'coordinates' && c.field !== 'coordinateList' && c.field !== 'spatialId');
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
          return historyFieldValue(fn, raw, orgMap, symbolMap);
        };
        if (orderedChanges.length === 0) return null;
        return (
          <div key={gi} style={{ ...historyGroupGridStyle, marginBottom: gi < groups.length - 1 ? spaceSm : 0 }}>
            <div style={{ minWidth: 0, paddingTop: spaceXs }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spaceSm }}>
                <Typography.Text style={historyTimeStyle}>
                  {g.ts ? fmtTime(g.ts) : '—'}
                </Typography.Text>
                <span style={{ flexShrink: 0 }}>
                  {isCreate && <span style={historyBadgeStyle(statusOperational)}>Thêm mới</span>}
                  {!isCreate && <span style={historyBadgeStyle(actionPrimary)}>Chỉnh sửa</span>}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 0 }}>
                <Typography.Text style={historyMetaRowStyle}>
                  Cán bộ cập nhật: {g.actor || '—'}
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
              {orderedChanges.length > 0 ? <div>{orderedChanges.map((change, ri: number) => {
                const fn = change.field;
                const ov = formatHistoryValue(fn, change.oldValue);
                const nv = formatHistoryValue(fn, change.newValue);
                const renderCell = (rawVal: string | null) => {
                  if (fn === 'mapSymbolId' && rawVal && rawVal !== '(null)') {
                    const img = symbolImageMap.get(rawVal);
                    const name = symbolMap.get(rawVal) || rawVal;
                    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{img ? <img src={img} alt="" style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 4 }} /> : null}{name}</span>;
                  }
                  return null;
                };
                return isCreate ? (
                  <div key={`${fn}-${ri}`} style={{ ...historyCreateRowStyle, paddingTop: ri > 0 ? spaceXs : 0 }}>
                    <div style={historyFieldLabelStyle}>{fn ? `${historyFieldName(fn)}:` : '—'}</div>
                    <span title={nv ?? '—'} style={historyNewValueStyle}>{renderCell(change.newValue) ?? (nv ?? '—')}</span>
                  </div>
                ) : (
                  <div key={`${fn}-${ri}`} style={{ ...historyChangeRowStyle, paddingTop: ri > 0 ? spaceXs : 0 }}>
                    <div style={historyFieldLabelStyle}>{fn ? `${historyFieldName(fn)}:` : '—'}</div>
                    <span title={ov ?? '—'} style={historyOldValueStyle}>{renderCell(change.oldValue) ?? (ov ?? '—')}</span>
                    <span style={historyArrowStyle}>→</span>
                    <span title={nv ?? '—'} style={historyNewValueStyle}>{renderCell(change.newValue) ?? (nv ?? '—')}</span>
                  </div>
                );
              })}</div> : <Typography.Text style={{ color: textTertiary, fontSize: fontSizeMd }}>Không có thông tin chi tiết</Typography.Text>}
            </div>
          </div>
        );
      })}</div>
    );
  };

  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [updateDrawerOpen, setUpdateDrawerOpen] = useState(false);
  const [createTabKey, setCreateTabKey] = useState('general');
  const [formEditId, setFormEditId] = useState<string | undefined>();
  const [editingCode, setEditingCode] = useState<string | undefined>();
  const [editingName, setEditingName] = useState<string | undefined>();

  // ── Form instances (two separate forms: create + update) ──
  const [createForm] = Form.useForm();
  const [updateForm] = Form.useForm();

  /** true khi field đã đạt đủ max ký tự — bật viền đỏ ô nhập + message bên dưới (dùng Form context — tự bind đúng form create/update đang render). */
  const useMaxReached = (name: string, max: number): boolean => {
    const raw = Form.useWatch(name) ?? '';
    const len = (typeof raw === 'string' ? raw : String(raw ?? '')).length;
    return len >= max;
  };
  const atMax = {
    dryPortName: useMaxReached('dryPortName', 255),
    detailedLocation: useMaxReached('detailedLocation', 500),
    connectionMode: useMaxReached('connectionMode', 2000),
    transportCorridor: useMaxReached('transportCorridor', 100),
    teuCapacity: useMaxReached('teuCapacity', 20),
    area: useMaxReached('area', 20),
    warehouseArea: useMaxReached('warehouseArea', 20),
    yardArea: useMaxReached('yardArea', 20),
    remarks: useMaxReached('remarks', 2000),
    announcementDecisionNumber: useMaxReached('announcementDecisionNumber', 20),
    announcementOrg: useMaxReached('announcementOrg', 255),
  };
  const createGeometryType = Form.useWatch('geometryType', createForm);
  const updateGeometryType = Form.useWatch('geometryType', updateForm);

  const [submitting, setSubmitting] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const currentUser = useAuthStore((s) => s.user);
  const isSystemAdmin = currentUser?.permissions?.includes('admin:all') || currentUser?.permissions?.includes('*') || false;
  const isAuditViewer = currentUser?.permissions?.includes('admin:manage') || currentUser?.permissions?.includes('admin:operation') || false;
  const actionTypeRef = useRef<'draft' | 'submit' | 'approve' | 'update'>('draft');
  const editCodeRef = useRef<string | undefined>(undefined);

  // ── Org unit options (create/update form) ──
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  // ── GPS sub-table state ──
  const [coordinateList, setCoordinateList] = useState<Array<{ lat: number | null; lng: number | null }>>([]);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // ── Symbol state (form select) ──
  const [symbols, setSymbols] = useState<Symbol[]>([]);

  // ── File upload state ──
  const [uploadFileList, setUploadFileList] = useState<any[]>([]);

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const orgMap = useMemo(() => {
    const map = new Map<string, string>();
    organizations.forEach((o) => map.set(o.id, o.code ? `${o.code} - ${o.name}` : o.name));
    return map;
  }, [organizations]);

  const [symbolMap, setSymbolMap] = useState<Map<string, string>>(new Map());
  const [symbolImageMap, setSymbolImageMap] = useState<Map<string, string>>(new Map());
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    // Đơn vị quản lý là bộ lọc bắt buộc (giống Cảng biển): tự chọn mặc định = đơn vị của user
    setLoadingOrgs(true);
    (async () => {
      try {
        const r = await organizationService.list({ pageSize: 1000 });
        const orgs = r.data || [];
        setOrganizations(orgs);
        if (orgs.length > 0 && !defaultOrgApplied.current) {
          defaultOrgApplied.current = true;
          try {
            const profileRes = await api.get('/users/me');
            const profile = profileRes.data?.data ?? profileRes.data;
            const userOrgId = profile?.orgUnitId;
            const defaultId = userOrgId ? (orgs.find((o: any) => o.id === userOrgId) ? userOrgId : orgs[0].id) : '__all__';
            defaultOrgUnitId.current = defaultId;
            setFilterOrgUnitId(defaultId === '__all__' ? undefined : defaultId);
          } catch {
            defaultOrgUnitId.current = orgs[0].id;
            setFilterOrgUnitId(orgs[0].id);
          }
        }
      } catch { /* ignore */ }
      finally { setLoadingOrgs(false); setOrgUnitReady(true); }
    })();
    symbolService.list({ page: 1, pageSize: 1000, status: 'active' }).then(r => {
      const list = r.data || [];
      setSymbols(list);
      const map = new Map<string, string>();
      const imgMap = new Map<string, string>();
      list.forEach((s: any) => { map.set(s.id, s.name); if (s.image) imgMap.set(s.id, s.image); });
      setSymbolMap(map);
      setSymbolImageMap(imgMap);
    }).catch(() => { });
    userService.list({ pageSize: 1000 }).then(r => {
      const users = r.data || (r as any).content || [];
      const umap = new Map<string, string>();
      users.forEach((u: any) => umap.set(u.id, u.fullName || u.username || u.id));
      setUserMap(umap);
    }).catch(() => { });
  }, []);

  const fetchCounts = useCallback(async (orgId: string | undefined) => {
    try {
      const results = await Promise.allSettled(
        TAB_STATUS_LIST.map(tab =>
          tab.key === 'all'
            ? dryPortCRUD.findAll({ page: 1, size: 1, orgUnitId: orgId && orgId !== '__all__' ? orgId : undefined })
            : dryPortCRUD.findAll({ page: 1, size: 1, approvalStatus: tab.key, orgUnitId: orgId && orgId !== '__all__' ? orgId : undefined }),
        ),
      );
      const counts: Record<string, number> = {};
      results.forEach((r, i) => { counts[TAB_STATUS_LIST[i]?.key || 'all'] = r.status === 'fulfilled' ? r.value.total : 0; });
      setTabCounts(counts);
    } catch { /* ignore */ }
  }, []);

  // Debounce search 300ms (giống cảng biển F-012 AC-012-02)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const fetchData = useCallback(async () => {
    setIsLoading(true); setIsError(false);
    try {
      const res = await dryPortCRUD.findAll({
        page, size: pageSize,
        search: debouncedSearch || undefined,
        orgUnitId: filterOrgUnitId === '__all__' ? undefined : filterOrgUnitId,
        provinceId: filterProvince,
        region: filterRegion,
        portStatus: filterStatus,
        updatedFrom: filterUpdatedFrom,
        updatedTo: filterUpdatedTo,
        code: filterCode,
        transportCorridor: filterTransportCorridor,
        approvalStatus: activeTab === 'all' ? undefined : activeTab,
      });
      setDataSource(res.data); setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách cảng cạn'));
    } finally { setIsLoading(false); }
  }, [page, pageSize, debouncedSearch, filterOrgUnitId, filterProvince, filterRegion, filterStatus, filterUpdatedFrom, filterUpdatedTo, filterCode, filterTransportCorridor, activeTab]);

  useEffect(() => { if (orgUnitReady) void fetchData(); }, [fetchData, orgUnitReady]);
  useEffect(() => { if (orgUnitReady) void fetchCounts(filterOrgUnitId); }, [filterOrgUnitId, fetchCounts, orgUnitReady]);

  // ── Non-admin auto-fill orgUnit from user profile (create form only; chạy khi mở drawer vì resetFields xóa giá trị) ──
  const autoFillOrgUnit = useCallback(async () => {
    if (isSystemAdmin) return;
    try {
      const res = await api.get('/users/me');
      const profile = res.data?.data ?? res.data;
      if (profile?.orgUnitId) {
        createForm.setFieldsValue({ orgUnitId: profile.orgUnitId });
      }
    } catch {
      console.error('Failed to load user profile for orgUnit auto-fill');
    }
  }, [createForm, isSystemAdmin]);

  // ── Khi chọn loại đối tượng (create) → tự set hệ quy chiếu & quy tắc hiển thị, reset số tọa độ ──
  useEffect(() => {
    if (!createGeometryType) {
      createForm.setFieldsValue({ coordinateSystem: undefined, displayRule: undefined });
      setCoordinateList([]);
      return;
    }
    createForm.setFieldsValue({ coordinateSystem: 1, displayRule: 'Độ, phút, giây (DMS)' });
    const count = GEOMETRY_POINT_COUNT[createGeometryType] ?? 0;
    setCoordinateList(Array.from({ length: count }, () => ({ lat: null, lng: null })));
  }, [createGeometryType, createForm]);

  // ── Khi chọn loại đối tượng (update) → set hệ quy chiếu & quy tắc hiển thị; chỉnh sửa giữ tọa độ đã có, tự thêm dòng trống cho đủ số lượng ──
  useEffect(() => {
    if (!updateGeometryType) {
      updateForm.setFieldsValue({ coordinateSystem: undefined, displayRule: undefined });
      return;
    }
    updateForm.setFieldsValue({ coordinateSystem: 1, displayRule: 'Độ, phút, giây (DMS)' });
    const count = GEOMETRY_POINT_COUNT[updateGeometryType] ?? 1;
    setCoordinateList((prev) => {
      if (prev.length >= count) return prev;
      const added = Array.from({ length: count - prev.length }, () => ({ lat: null, lng: null }));
      return [...prev, ...added];
    });
  }, [updateGeometryType, updateForm]);

  // ── Update mode: load existing dry port into updateForm ──
  useEffect(() => {
    if (!formEditId) return;
    (async () => {
      try {
        const res = await api.get(`/v1/dry-ports/${formEditId}`);
        const data: DryPort = res.data?.data ?? res.data;

        const effectiveCoords = data.coordinates
          ? parseGisCoordinates({ geometryType: data.geometryType || 'POINT', coordinates: data.coordinates })
          : [];
        setCoordinateList(
          effectiveCoords.length > 0
            ? effectiveCoords.map((c) => ({ lat: c.latitude, lng: c.longitude }))
            : data.latitude != null && data.longitude != null
              ? [{ lat: data.latitude, lng: data.longitude }]
              : []
        );

        // Load existing attachments (giống cảng biển: map vào uploadFileList, không có originFileObj)
        try {
          const fileRes = await api.get(`/v1/documents/entity/dryport/${formEditId}`, { params: { page: 0, size: 50 } });
          const atts = fileRes.data?.data?.content || fileRes.data?.data || [];
          setUploadFileList((Array.isArray(atts) ? atts : []).map((a: any) => ({ uid: a.id, name: a.fileName, size: a.fileSize, status: 'done' })));
        } catch { setUploadFileList([]); }

        editCodeRef.current = data.dryPortCode;

        updateForm.setFieldsValue({
          orgUnitId: data.orgUnitId,
          dryPortCode: data.dryPortCode,
          dryPortName: data.dryPortName,
          operatingUnit: data.operatingUnit,
          region: data.region,
          provinceId: data.provinceId !== undefined && data.provinceId !== null
            ? VIETNAM_PROVINCES[data.provinceId - 1] ?? undefined
            : undefined,
          detailedLocation: data.detailedLocation,
          transportCorridor: data.transportCorridor,
          area: data.area,
          teuCapacity: data.teuCapacity,
          warehouseArea: data.warehouseArea,
          yardArea: data.yardArea,
          connectionMode: data.connectionMode,
          portStatus: data.portStatus !== undefined && data.portStatus !== null ? data.portStatus : 0,
          remarks: data.remarks,
          announcementTime: data.announcementTime ? dayjs(data.announcementTime) : undefined,
          announcementDecisionNumber: data.announcementDecisionNumber,
          announcementDecisionDate: data.announcementDecisionDate ? dayjs(data.announcementDecisionDate) : undefined,
          announcementOrg: data.announcementOrg,
          geometryType: data.geometryType || undefined,
          mapSymbolId: data.mapSymbolId,
          spatialId: data.spatialId,
          coordinateSystem: data.coordinateSystem,
          displayRule: (data.geometryType || data.coordinates) ? 'Độ, phút, giây (DMS)' : undefined,
        });
      } catch {
        toast.error('Không thể tải thông tin cảng cạn');
        setUpdateDrawerOpen(false);
        setFormEditId(undefined);
      }
    })();
  }, [formEditId, updateForm]);

  const handleFilterApply = useCallback(() => {
    setDebouncedSearch(search);
    setActiveTab('all');
    setPage(1);
  }, [search]);

  const handleFilterReset = useCallback(() => {
    // Reset về đơn vị quản lý mặc định (bắt buộc — giống Cảng biển)
    const defaultOrg = defaultOrgUnitId.current;
    setSearch('');
    setFilterProvince(undefined);
    setFilterRegion(undefined);
    setFilterStatus(undefined);
    setFilterUpdatedFrom(undefined);
    setFilterUpdatedTo(undefined);
    setFilterCode(undefined);
    setFilterTransportCorridor(undefined);
    setFilterOrgUnitId(defaultOrg === '__all__' ? undefined : defaultOrg);
    setActiveTab('all');
    setPage(1);
  }, []);

  const handleTabChange = useCallback((key: string) => { setActiveTab(key); setPage(1); }, []);

  const openDetailModal = useCallback(async (record: DryPort) => {
    setDetailModalOpen(true); setDetailRecord(record); setDetailFiles([]); setDetailLoading(true);
    try {
      const fresh = await dryPortCRUD.findById(record.id);
      setDetailRecord(fresh);
    } catch { /* keep current */ }
    try {
      const fileRes = await api.get(`/v1/documents/entity/dryport/${record.id}`, { params: { page: 0, size: 50 } });
      setDetailFiles(fileRes.data?.data?.content || fileRes.data?.data || []);
    } catch { setDetailFiles([]); }
    finally { setDetailLoading(false); }
  }, []);

  const openDeleteModal = useCallback((record: DryPort) => {
    setDeletingRecord(record); setDeleteConfirmText(''); setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingRecord) return;
    const expected = (deletingRecord.dryPortName || '').trim().toLowerCase();
    const input = deleteConfirmText.trim().toLowerCase();
    if (input !== expected && input !== 'xóa') {
      toast.error('Vui lòng nhập đúng tên cảng hoặc gõ "XÓA" để xác nhận');
      return;
    }
    try {
      await dryPortCRUD.delete(deletingRecord.id);
      toast.success('Đã xóa cảng cạn');
      setDeleteModalOpen(false); setDeletingRecord(null); setDeleteConfirmText('');
      void fetchData(); void fetchCounts(filterOrgUnitId);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Xóa thất bại'); }
  }, [deletingRecord, deleteConfirmText, fetchData, fetchCounts, filterOrgUnitId]);

  const openApproveModal = useCallback((record: DryPort) => {
    setApprovingRecord(record); setApproveModalOpen(true);
  }, []);

  const handleConfirmApprove = useCallback(async () => {
    if (!approvingRecord) return;
    try { await dryPortApproval.approve(approvingRecord.id); toast.success('Đã phê duyệt'); void fetchData(); void fetchCounts(filterOrgUnitId); }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại'); }
    finally { setApproveModalOpen(false); setApprovingRecord(null); }
  }, [approvingRecord, fetchData, fetchCounts, filterOrgUnitId]);

  const openRejectModal = useCallback((record: DryPort) => {
    setRejectingRecord(record); setRejectReason(''); setRejectError(''); setRejectModalOpen(true);
  }, []);

  const handleConfirmReject = useCallback(async () => {
    if (!rejectingRecord) return;
    const reason = rejectReason.trim();
    if (!reason) { setRejectError('Vui lòng nhập lý do từ chối'); return; }
    if (reason.length < 10) { setRejectError('Lý do từ chối phải có ít nhất 10 ký tự'); return; }
    try {
      await dryPortApproval.reject(rejectingRecord.id, reason);
      toast.success('Đã từ chối phê duyệt');
      setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); setRejectError('');
      void fetchData(); void fetchCounts(filterOrgUnitId);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Từ chối thất bại'); }
  }, [rejectingRecord, rejectReason, fetchData, fetchCounts, filterOrgUnitId]);

  const MANDATORY_FIELDS: { key: keyof DryPort; label: string }[] = [
    { key: 'orgUnitId', label: 'Đơn vị quản lý' },
    { key: 'dryPortName', label: 'Tên cảng cạn' },
    { key: 'provinceId', label: 'Địa điểm (Tỉnh/Thành Phố)' },
    { key: 'detailedLocation', label: 'Địa chỉ chi tiết' },
    { key: 'teuCapacity', label: 'Công suất (TEU)' },
    { key: 'portStatus', label: 'Tình trạng' },
  ];

  /* ── File upload handler (shared by both drawers) ── */
  const handleAddFile = (file: File): false => {
    if (file.size > MAX_FILE_SIZE) { toast.error('File vượt quá 20MB'); return false; }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) { toast.error('Định dạng không hỗ trợ'); return false; }
    if (uploadFileList.length >= MAX_FILE_COUNT) { toast.error('Tối đa 10 file'); return false; }
    setUploadFileList((prev) => [...prev, {
      uid: `-${Date.now()}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 9)}`,
      name: file.name,
      size: file.size,
      status: 'done',
      originFileObj: file,
    }]);
    return false;
  };

  /* ── GPS handlers ── */
  const addGpsPoint = () => { setCoordinateList((prev) => [...prev, { lat: null, lng: null }]); setGpsError(null); };

  const removeCoordinate = (index: number) => {
    setCoordinateList((prev) => prev.filter((_, i) => i !== index));
  };

  const updateGpsPoint = (index: number, field: 'lat' | 'lng', d: number | null, m: number | null, s: number | null) => {
    setCoordinateList((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: (d ?? 0) + (m ?? 0) / 60 + (s ?? 0) / 3600 };
      return next;
    });
  };

  const handleFormFailed = (errorInfo: any) => {
    setSubmitting(false);
    focusErrorTab(
      errorInfo,
      {
        general: ['orgUnitId', 'operatingUnit', 'dryPortCode', 'dryPortName', 'provinceId', 'detailedLocation', 'region', 'connectionMode', 'transportCorridor', 'teuCapacity', 'area', 'warehouseArea'],
        status: ['portStatus', 'remarks'],
        location: ['geometryType', 'mapSymbolId', 'coordinateSystem', 'displayRule'],
      },
      setCreateTabKey
    );
  };

  /* ── Save logic shared by create + update (payload giữ nguyên handleSave cũ) ── */
  const runSave = async (values: Record<string, any>, saveAction: SaveAction, isEdit: boolean, editId?: string) => {
    const dryPortName = String(values.dryPortName ?? '').trim();
    const orgUnitId = values.orgUnitId || undefined;
    const provinceName: string | undefined = values.provinceId;

    // ── Tên cảng cạn: luôn bắt buộc ──
    if (!dryPortName) {
      toast.error('Tên cảng cạn là bắt buộc');
      setSubmitting(false);
      return;
    }

    // ── Lưu và gửi phê duyệt / Lưu và phê duyệt: kiểm tra đủ 6 trường bắt buộc (BR-026-03) ──
    if (saveAction === 'SUBMIT' || saveAction === 'SAVE_AND_APPROVE') {
      const missing: string[] = [];
      if (!orgUnitId) missing.push('Đơn vị quản lý');
      if (!provinceName) missing.push('Địa điểm (Tỉnh/Thành Phố)');
      if (!values.detailedLocation?.trim()) missing.push('Địa điểm chi tiết');
      if (values.teuCapacity == null || Number.isNaN(Number(values.teuCapacity))) missing.push('Công suất khai thác');
      if (values.portStatus == null) missing.push('Tình trạng');
      if (missing.length > 0) {
        toast.error(`Vui lòng hoàn thiện thông tin trước khi lưu. Thiếu: ${missing.join(', ')}`);
        setSubmitting(false);
        return;
      }
    }

    // ── Validate GPS coordinates (chỉ bắt buộc khi đã chọn loại đối tượng) ──
    const manualCoords = coordinateList
      .filter((c) => c.lat != null && c.lng != null && !Number.isNaN(Number(c.lat)) && !Number.isNaN(Number(c.lng)))
      .map((c) => ({ latitude: Number(c.lat), longitude: Number(c.lng) }));

    if (values.geometryType) {
      const minCount = GEOMETRY_POINT_COUNT[values.geometryType] ?? 1;
      if (manualCoords.length < minCount) {
        toast.error(values.geometryType === 'POLYGON' ? 'Đối tượng vùng cần ít nhất 3 tọa độ hợp lệ' : values.geometryType === 'LINE' ? 'Đối tượng đường cần ít nhất 2 tọa độ hợp lệ' : 'Đối tượng điểm cần ít nhất 1 tọa độ hợp lệ');
        setSubmitting(false);
        return;
      }
    }

    setSubmitting(true);
    try {
      const actionMap: Partial<Record<SaveAction, string>> = { DRAFT: 'draft', SUBMIT: 'submit', SAVE_AND_APPROVE: 'approve' };
      const payload: Record<string, unknown> = {
        saveAction: actionMap[saveAction],
        dryPortCode: String(values.dryPortCode || '').trim() || undefined,
        dryPortName,
        orgUnitId,
        geometryType: values.geometryType || undefined,
        latitude: manualCoords.length > 0 ? manualCoords[0].latitude : undefined,
        longitude: manualCoords.length > 0 ? manualCoords[0].longitude : undefined,
        coordinates: buildCoordinatesWkt(values.geometryType, manualCoords),
        operatingUnit: values.operatingUnit || undefined,
        region: values.region || undefined,
        provinceId: provinceName ? VIETNAM_PROVINCES.indexOf(provinceName) + 1 : undefined,
        detailedLocation: values.detailedLocation || undefined,
        transportCorridor: values.transportCorridor || undefined,
        area: values.area !== undefined && values.area !== null && !Number.isNaN(Number(values.area)) ? Number(values.area) : undefined,
        teuCapacity: values.teuCapacity !== undefined && values.teuCapacity !== null && !Number.isNaN(Number(values.teuCapacity)) ? Number(values.teuCapacity) : undefined,
        warehouseArea: values.warehouseArea !== undefined && values.warehouseArea !== null && !Number.isNaN(Number(values.warehouseArea)) ? Number(values.warehouseArea) : undefined,
        yardArea: values.yardArea !== undefined && values.yardArea !== null && !Number.isNaN(Number(values.yardArea)) ? Number(values.yardArea) : undefined,
        connectionMode: values.connectionMode || undefined,
        portStatus: values.portStatus !== undefined && values.portStatus !== null ? Number(values.portStatus) : undefined,
        remarks: values.remarks || undefined,
        mapSymbolId: values.mapSymbolId || undefined,
        coordinateSystem: values.coordinateSystem !== undefined && values.coordinateSystem !== null ? Number(values.coordinateSystem) : undefined,
        displayRule: values.displayRule != null && !Number.isNaN(Number(values.displayRule)) ? Number(values.displayRule) : undefined,
        announcementTime: values.announcementTime
          ? (typeof values.announcementTime === 'string' ? values.announcementTime : values.announcementTime.toISOString())
          : undefined,
        announcementDecisionNumber: values.announcementDecisionNumber || undefined,
        announcementDecisionDate: values.announcementDecisionDate
          ? (typeof values.announcementDecisionDate === 'string' ? values.announcementDecisionDate : values.announcementDecisionDate.format('YYYY-MM-DD'))
          : undefined,
        announcementOrg: values.announcementOrg || undefined,
      };

      // Remove undefined fields
      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) delete payload[key];
      });

      let createdId: string | undefined;

      if (isEdit && editId) {
        await api.put('/v1/dry-ports', { ...payload, id: editId });
        createdId = editId;
      } else {
        const res = await api.post('/v1/dry-ports', payload);
        createdId = res.data?.data?.id ?? res.data?.id;
      }

      const successMsg =
        saveAction === 'DRAFT'
          ? 'Lưu tạm thành công'
          : saveAction === 'SAVE_AND_APPROVE'
            ? 'Lưu và phê duyệt thành công'
            : 'Cập nhật thành công';
      toast.success(successMsg);

      // Upload files sau khi lưu (giống cảng biển: upload từng file qua hệ thống documents)
      if (createdId && uploadFileList.length > 0) {
        let uploaded = 0;
        for (const f of uploadFileList) {
          if (!f.originFileObj) continue; // bỏ qua file đã tồn tại
          try {
            const formData = new FormData();
            formData.append('file', f.originFileObj as File);
            await api.post(`/v1/documents/upload/dryport/${createdId}`, formData, { headers: { 'Content-Type': undefined } });
            uploaded++;
          } catch { /* non-blocking */ }
        }
        if (uploaded > 0) toast.success(`Đã tải lên ${uploaded} tệp đính kèm`);
      }

      void fetchData();
      void fetchCounts(filterOrgUnitId);

      // Sau khi lưu thành công (Lưu tạm hoặc Lưu và phê duyệt): đóng form
      if (isEdit) {
        setUpdateDrawerOpen(false);
        setFormEditId(undefined);
        updateForm.resetFields();
      } else {
        setCreateDrawerOpen(false);
        createForm.resetFields();
      }
      setCoordinateList([]);
      setUploadFileList([]);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Có lỗi xảy ra, vui lòng thử lại';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateFinish = async (values: Record<string, unknown>) => {
    const saveAction: SaveAction = actionTypeRef.current === 'approve' ? 'SAVE_AND_APPROVE' : actionTypeRef.current === 'submit' ? 'SUBMIT' : 'DRAFT';
    await runSave(values, saveAction, false);
  };

  const handleUpdateFinish = async (values: Record<string, unknown>) => {
    const saveAction: SaveAction = actionTypeRef.current === 'update' ? 'UPDATE' : actionTypeRef.current === 'approve' ? 'SAVE_AND_APPROVE' : actionTypeRef.current === 'submit' ? 'SUBMIT' : 'DRAFT';
    await runSave(values, saveAction, true, formEditId);
  };

  const headerActions = useMemo(() => {
    const actions: any[] = [];
    if (hasPerm('dryport:create')) {
      actions.push({ key: 'create', label: 'Thêm mới', variant: 'primary' as const, icon: <PlusOutlined />, onClick: () => { setFormEditId(undefined); setCreateDrawerOpen(true); } });
    }
    return actions;
  }, [hasPerm]);

  // Giá trị sort theo cột hiển thị (map id → label) để click header cột nào cũng sort đúng thứ tự nhìn thấy
  const getSortValue = useCallback((r: any, field: string): string | number => {
    if (field === 'approvalStatus') return APPROVAL_STYLE_MAP[r.approvalStatus || '']?.label ?? r.approvalStatus ?? '';
    if (field === 'updatedBy') return userMap.get(r.updatedBy || '') ?? r.updatedBy ?? '';
    return r[field] ?? '';
  }, [userMap]);

  const columns = useMemo(() => {
    const base: any[] = [
      {
        key: 'sequenceNo', label: 'STT', width: 60, fixed: 'left' as const, align: 'center' as const,
        render: (_: unknown, __: DryPort, idx?: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{(page - 1) * pageSize + (idx ?? 0) + 1}</span>
      },
      {
        key: 'dryPortName', label: 'Tên/Mã Cảng cạn', dataIndex: 'dryPortName', width: 210, fixed: 'left' as const, sortable: true, sortOrder: sortField === 'dryPortName' ? sortOrder : undefined, ellipsis: false,
        render: (_: unknown, record: DryPort) => (
          <div>
            <a onClick={() => openDetailModal(record)} style={{ fontWeight: fontWeightBold, color: actionPrimary, cursor: 'pointer', display: 'block' }}>{record.dryPortName || '—'}</a>
            <span style={{ opacity: 0.85, fontSize: fontSizeMd }}>{record.dryPortCode}</span>
          </div>
        )
      },
      {
        key: 'orgUnitName', label: 'Đơn vị quản lý', dataIndex: 'orgUnitName', width: 260, sortable: true, sortOrder: sortField === 'orgUnitName' ? sortOrder : undefined,
        render: (v: string | null | undefined) => <span style={{ fontSize: fontSizeMd, color: textPrimary, fontWeight: fontWeightBold }}>{v || '—'}</span>
      },
      {
        key: 'operatingUnit', label: 'Đơn vị khai thác', dataIndex: 'operatingUnit', width: 220, sortable: true,
        render: (v: string | null | undefined) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span>
      },
      {
        key: 'region', label: 'Khu vực', dataIndex: 'region', width: 200, sortable: true,
        render: (v: string | null | undefined) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span>
      },
      {
        key: 'transportCorridor', label: 'Hành lang vận tải', dataIndex: 'transportCorridor', width: 220, sortable: true,
        render: (v: string | null | undefined) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span>
      },
      {
        key: 'approvalStatus', label: 'Trạng thái', dataIndex: 'approvalStatus', width: 260, sortable: true,
        render: (status: string) => {
          const s = APPROVAL_STYLE_MAP[status || ''] || { color: textTertiary, label: status || '—' };
          return <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: radiusPill, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${s.color}15`, color: s.color }}>{s.label}</span>;
        }
      },
    ];
    // Cột kiểm toán — chỉ Admin Cục (BR-018-05, giống bến cảng)
    if (isAuditViewer) {
      base.push(
        {
          key: 'updatedBy', label: 'Cán bộ cập nhật', width: 190, ellipsis: false, sortable: true,
          sortOrder: sortField === 'updatedBy' ? sortOrder : undefined,
          render: (_: unknown, record: DryPort) => {
            const name = userMap.get(record.updatedBy || '') || record.updatedBy || '—';
            const date = record.updatedAt || record.createdAt;
            return (
              <div style={{ lineHeight: '1.35' }}>
                <div style={{ fontWeight: fontWeightBold, color: textPrimary, fontSize: fontSizeMd, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                <div style={{ fontSize: fontSizeMd, color: textSecondary, whiteSpace: 'nowrap' }}>{date ? formatDate(date) : '—'}</div>
              </div>
            );
          }
        },
      );
    }
    return base;
  }, [page, pageSize, sortField, sortOrder, isAuditViewer, userMap]);

  const rowActions = useCallback((record: DryPort) => {
    const actions: { key: string; label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean }[] = [];
    const status = record.approvalStatus || '';
    const isDraft = status === 'DRAFT' || status === 'NHAP';
    const isPending = status === 'PENDING' || status === 'PENDING_APPROVAL';
    actions.push({ key: 'view', label: 'Chi tiết', icon: <EyeOutlined />, onClick: () => openDetailModal(record) });
    if (hasPerm('dryport:update')) actions.push({ key: 'edit', label: 'Chỉnh sửa', icon: <EditOutlined />, onClick: () => { setFormEditId(record.id); setEditingCode(record.dryPortCode); setEditingName(record.dryPortName); setUpdateDrawerOpen(true); } });
    // Xóa: chỉ trạng thái DRAFT/NHAP (giống cảng biển)
    if (hasPerm('dryport:delete') && isDraft) actions.push({ key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, onClick: () => openDeleteModal(record), danger: true });
    if (isDraft && hasPerm('dryport:approve')) actions.push({ key: 'approve', label: 'Phê duyệt', icon: <CheckCircleOutlined />, onClick: () => openApproveModal(record) });
    if (isPending && hasPerm('dryport:approve')) {
      actions.push({ key: 'approve', label: 'Phê duyệt', icon: <CheckCircleOutlined />, onClick: () => openApproveModal(record) });
      actions.push({ key: 'reject', label: 'Từ chối', icon: <CloseCircleOutlined />, onClick: () => openRejectModal(record), danger: true });
    }
    if (hasPerm('dryport:history')) actions.push({ key: 'history', label: 'Lịch sử', icon: <HistoryOutlined />, onClick: () => openHistory(record) });
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
        approvalStyleMap={APPROVAL_STYLE_MAP}
      />
    );
  };

  const closeCreateDrawer = useCallback(() => {
    setCreateDrawerOpen(false);
    createForm.resetFields();
    setCoordinateList([]);
    setUploadFileList([]);
    fetchData();
    fetchCounts(filterOrgUnitId);
  }, [fetchData, fetchCounts, filterOrgUnitId, createForm]);

  const closeUpdateDrawer = useCallback(() => {
    setUpdateDrawerOpen(false);
    setFormEditId(undefined);
    updateForm.resetFields();
    setCoordinateList([]);
    setUploadFileList([]);
    fetchData();
    fetchCounts(filterOrgUnitId);
  }, [fetchData, fetchCounts, filterOrgUnitId, updateForm]);

  /* ── Form tabs (5 tabs, shared by create + update drawers; fields giữ nguyên form cũ) ── */
  const buildFormTabs = (isEdit: boolean, geometryType: string | undefined) => ([
    {
      key: 'general',
      label: 'Thông tin chung',
      children: (
        <div style={{ paddingTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="orgUnitId" {...labelProps('Đơn vị quản lý')} required rules={[{ required: true, message: 'Đơn vị quản lý là bắt buộc' }]} style={{ marginBottom: spaceFormField }}>
                <OrgUnitTreeSelect organizations={organizations} placeholder="Chọn đơn vị quản lý..." loading={loadingOrgs} disabled={isEdit || !isSystemAdmin} showPath treeDefaultExpandAll={false} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="operatingUnit" {...labelProps('Đơn vị khai thác')} style={{ marginBottom: spaceFormField }}>
                <Input placeholder="Nhập đơn vị khai thác" maxLength={255} style={inputStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="dryPortCode" {...labelProps('Mã cảng cạn')} style={{ marginBottom: spaceFormField }} tooltip="Mã cảng cạn được sinh tự động, không thể chỉnh sửa">
                <Input disabled placeholder={codeLoading ? 'Đang sinh mã...' : 'Mã tự động'} style={{ ...inputStyle, color: textTertiary, cursor: 'not-allowed' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dryPortName" {...labelProps('Tên cảng cạn')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Tên cảng cạn không được để trống' }, { max: 255, message: 'Tên cảng cạn tối đa 255 ký tự' }]} validateStatus={atMax.dryPortName ? 'error' : undefined} help={atMax.dryPortName ? 'Đã đạt tối đa 255 ký tự' : undefined}>
                <Input placeholder="Nhập Tên cảng cạn" maxLength={255} style={inputStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="provinceId" {...labelProps('Địa điểm (Tỉnh/Thành Phố)')} required rules={[{ required: true, message: 'Địa điểm (Tỉnh/Thành phố) là bắt buộc' }]} style={{ marginBottom: spaceFormField }}>
                <Select showSearch placeholder="Chọn tỉnh/thành phố..." filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))} style={selectStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="detailedLocation" {...labelProps('Địa điểm chi tiết')} required rules={[{ required: true, message: 'Địa điểm chi tiết là bắt buộc' }]} style={{ marginBottom: spaceFormField }} validateStatus={atMax.detailedLocation ? 'error' : undefined} help={atMax.detailedLocation ? 'Đã đạt tối đa 500 ký tự' : undefined}>
                <Input placeholder="Nhập địa điểm chi tiết" maxLength={500} style={inputStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="region" {...labelProps('Khu vực')} style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Chọn khu vực..." allowClear options={REGION_OPTIONS} style={selectStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="connectionMode" {...labelProps('Phương thức kết nối giao thông với cảng')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.connectionMode ? 'error' : undefined} help={atMax.connectionMode ? 'Đã đạt tối đa 2000 ký tự' : undefined}>
                <Input placeholder="Nhập phương thức kết nối giao thông với cảng" maxLength={2000} style={inputStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="transportCorridor" {...labelProps('Hành lang vận tải')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.transportCorridor ? 'error' : undefined} help={atMax.transportCorridor ? 'Đã đạt tối đa 100 ký tự' : undefined}>
                <Input placeholder="Nhập hành lang vận tải" maxLength={100} style={inputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="teuCapacity" {...labelProps('Công suất khai thác')} required rules={[{ required: true, message: 'Công suất khai thác là bắt buộc' }]} style={{ marginBottom: spaceFormField }} validateStatus={atMax.teuCapacity ? 'error' : undefined} help={atMax.teuCapacity ? 'Đã đạt tối đa 20 ký tự' : undefined}>
                <InputNumber min={0} step={0.01} maxLength={20} placeholder="0" style={numberInputStyle} formatter={fmtInputNumber} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="area" {...labelProps('Tổng diện tích cảng (m2)')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.area ? 'error' : undefined} help={atMax.area ? 'Đã đạt tối đa 20 ký tự' : undefined}>
                <InputNumber min={0} step={0.01} maxLength={20} placeholder="0" style={numberInputStyle} formatter={fmtInputNumber} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="warehouseArea" {...labelProps('Diện tích kho (m2)')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.warehouseArea ? 'error' : undefined} help={atMax.warehouseArea ? 'Đã đạt tối đa 20 ký tự' : undefined}>
                <InputNumber min={0} step={0.01} maxLength={20} placeholder="0" style={numberInputStyle} formatter={fmtInputNumber} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="yardArea" {...labelProps('Diện tích bãi (m2)')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.yardArea ? 'error' : undefined} help={atMax.yardArea ? 'Đã đạt tối đa 20 ký tự' : undefined}>
                <InputNumber min={0} step={0.01} maxLength={20} placeholder="0" style={numberInputStyle} formatter={fmtInputNumber} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="portStatus" {...labelProps('Tình trạng')} required rules={[{ required: true, message: 'Tình trạng là bắt buộc' }]} style={{ marginBottom: spaceFormField }} initialValue={1}>
                <Select options={PORT_STATUS_OPTIONS} style={selectStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="remarks" {...labelProps('Ghi chú')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.remarks ? 'error' : undefined} help={atMax.remarks ? 'Đã đạt tối đa 2000 ký tự' : undefined}>
                <Input.TextArea placeholder="Nhập ghi chú" maxLength={2000} rows={3} style={{ borderRadius: radiusPill, resize: 'none' }} />
              </Form.Item>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'announcement',
      label: 'Thời điểm công bố đưa vào sử dụng',
      children: (
        <div style={{ paddingTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="announcementDecisionNumber" {...labelProps('Quyết định công bố số')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.announcementDecisionNumber ? 'error' : undefined} help={atMax.announcementDecisionNumber ? 'Đã đạt tối đa 20 ký tự' : undefined}>
                <Input placeholder="VD: Số 123/QĐ-BGTVT" maxLength={20} style={inputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="announcementDecisionDate" {...labelProps('Ngày ra quyết định công bố')} style={{ marginBottom: spaceFormField }}>
                <DatePicker placeholder="Chọn ngày..." format="DD/MM/YYYY" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="announcementOrg" {...labelProps('Đơn vị ra quyết định công bố')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.announcementOrg ? 'error' : undefined} help={atMax.announcementOrg ? 'Đã đạt tối đa 255 ký tự' : undefined}>
                <Input placeholder="Nhập đơn vị ra quyết định công bố" maxLength={255} style={inputStyle} />
              </Form.Item>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'location',
      label: 'Thông tin vị trí',
      children: (
        <div style={{ paddingTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="geometryType" {...labelProps('Loại đối tượng')} style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Chọn loại đối tượng" allowClear options={GEOMETRY_TYPE_OPTIONS} style={selectStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="mapSymbolId" {...labelProps('Biểu tượng')} style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Chọn biểu tượng bản đồ" allowClear showSearch optionFilterProp="label" disabled={!geometryType} style={selectStyle}>
                  {symbols.map((sym) => (
                    <Select.Option key={sym.id} value={sym.id} label={(sym as any).code ? `${sym.name} (${(sym as any).code})` : sym.name}>
                      <Space>
                        {sym.image && (
                          <img src={sym.image.startsWith('data:') ? sym.image : `data:image/png;base64,${sym.image}`} alt={sym.name} style={{ width: 20, height: 20, objectFit: 'contain' }} />
                        )}
                        <span>{(sym as any).code ? `${sym.name} (${(sym as any).code})` : sym.name}</span>
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="coordinateSystem" {...labelProps('Hệ quy chiếu')} style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Chọn hệ quy chiếu" disabled style={selectStyle} options={COORD_SYS_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="displayRule" {...labelProps('Quy tắc hiển thị')} style={{ marginBottom: spaceFormField }}>
                <Input placeholder="Chọn quy tắc hiển thị" maxLength={255} disabled style={{ ...inputStyle, color: '#8c8c8c', cursor: 'not-allowed' }} />
              </Form.Item>
            </Col>
          </Row>
          <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tọa độ GPS</span>
            </span>
            {coordinateList.length > 0 && (
              <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addGpsPoint} disabled={!geometryType} style={{ borderRadius: radiusPill }}>
                Thêm tọa độ
              </Button>
            )}
          </div>
          {coordinateList.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
              <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>Chưa có tọa độ nào.</span>
              <Button type="dashed" icon={<PlusOutlined />} onClick={addGpsPoint} disabled={!geometryType} style={{ borderRadius: radiusPill }}>Thêm tọa độ</Button>
            </div>
          ) : (
            <PagedTable dataSource={coordinateList.map((c, i) => ({ ...c, _idx: i }))} tableProps={{ scroll: { x: 820 } }}
              errorText={gpsError ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span>⚠</span><span>{gpsError}</span></span> : undefined}>
              <Table.Column title="Vĩ độ (N)" key="lat" render={(_: any, record: any) => { const dms = ddToDms(record.lat != null ? Number(record.lat) : null); return <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}><InputNumber value={dms.d} min={0} max={90} placeholder="Độ" onFocus={(e) => e.currentTarget.select()} onChange={(v) => updateGpsPoint(record._idx, 'lat', v != null ? Number(v) : null, dms.m, dms.s)} style={{ flex: 1 }} controls={false} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>°</span><InputNumber value={dms.m} min={0} max={59} placeholder="Phút" onFocus={(e) => e.currentTarget.select()} onChange={(v) => updateGpsPoint(record._idx, 'lat', dms.d, v != null ? Number(v) : null, dms.s)} style={{ flex: 1 }} controls={false} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>'</span><InputNumber value={dms.s} min={0} max={59.99} step={0.01} placeholder="Giây" formatter={fmtInputNumber} onFocus={(e) => e.currentTarget.select()} onChange={(v) => updateGpsPoint(record._idx, 'lat', dms.d, dms.m, v != null ? Number(v) : null)} style={{ flex: 1.2 }} controls={false} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, fontSize: fontSizeSm, color: textTertiary }}>"</span></Space.Compact>; }} onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
              <Table.Column title="Kinh độ (E)" key="lng" render={(_: any, record: any) => { const dms = ddToDms(record.lng != null ? Number(record.lng) : null); return <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}><InputNumber value={dms.d} min={0} max={180} placeholder="Độ" onFocus={(e) => e.currentTarget.select()} onChange={(v) => updateGpsPoint(record._idx, 'lng', v != null ? Number(v) : null, dms.m, dms.s)} style={{ flex: 1 }} controls={false} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>°</span><InputNumber value={dms.m} min={0} max={59} placeholder="Phút" onFocus={(e) => e.currentTarget.select()} onChange={(v) => updateGpsPoint(record._idx, 'lng', dms.d, v != null ? Number(v) : null, dms.s)} style={{ flex: 1 }} controls={false} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>'</span><InputNumber value={dms.s} min={0} max={59.99} step={0.01} placeholder="Giây" formatter={fmtInputNumber} onFocus={(e) => e.currentTarget.select()} onChange={(v) => updateGpsPoint(record._idx, 'lng', dms.d, dms.m, v != null ? Number(v) : null)} style={{ flex: 1.2 }} controls={false} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, fontSize: fontSizeSm, color: textTertiary }}>"</span></Space.Compact>; }} onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
              <Table.Column title="Thao tác" key="actions" width={80} align="center" render={(_: any, record: any) => <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => removeCoordinate(record._idx)} />} onHeaderCell={() => ({ style: { background: colors.bodyBg, padding: '12px 6px' } })} />
            </PagedTable>
          )}
          <Form.Item name="_gisCoordinates" style={{ marginBottom: 0 }}>
            <Input style={{ display: 'none' }} />
          </Form.Item>
        </div>
      ),
    },
    {
      key: 'files',
      label: 'File đính kèm',
      children: (
        <div style={{ paddingTop: 16 }}>
          <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>File đính kèm</span>
            {uploadFileList.length > 0 && (
              <Upload beforeUpload={handleAddFile} showUploadList={false} accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif" multiple>
                <Button type="dashed" size="small" icon={<PlusOutlined />} style={{ borderRadius: radiusPill }}>Thêm file</Button>
              </Upload>
            )}
          </div>
          {uploadFileList.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
              <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>Chưa có file đính kèm.</span>
              <Upload beforeUpload={handleAddFile} showUploadList={false} accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif" multiple>
                <Button type="dashed" icon={<UploadOutlined />} style={{ borderRadius: radiusPill }}>Chọn file</Button>
              </Upload>
            </div>
          ) : (
            <PagedTable
              dataSource={uploadFileList.map((f, i) => ({ ...f, _idx: i }))}
              tableProps={{ scroll: { x: 400 } }}
            >
              <Table.Column
                title="Tên file"
                key="name"
                dataIndex="name"
                render={(name: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}><FileOutlined style={{ marginRight: spaceSm, color: textTertiary }} />{name}</span>}
                onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })}
              />
              <Table.Column
                title=""
                key="actions"
                width={44}
                align="center"
                render={(_: any, record: any) => <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => setUploadFileList(uploadFileList.filter((x) => x.uid !== record.uid))} />}
                onHeaderCell={() => ({ style: { background: colors.bodyBg, padding: '12px 6px' } })}
              />
            </PagedTable>
          )}
          <div style={{ marginTop: spaceSm }}>
            <span style={uploadHintStyle}>Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF. Tối đa 10 file, mỗi file ≤20MB.</span>
          </div>
        </div>
      ),
    },
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
      <ScreenHeader breadcrumb={[{ label: 'Tài sản KCHTGT' }, { label: 'Quản lý cảng cạn' }]} actions={headerActions} />
      <FilterTableLayout
        filterCollapsed={filterCollapsed}
        onToggleCollapse={() => setFilterCollapsed(!filterCollapsed)}
        onFilterApply={handleFilterApply}
        onFilterReset={handleFilterReset}
        loading={isLoading}
        error={isError}
        onRetry={fetchData}
        filterContent={<>
          <div style={{ marginBottom: 12, marginTop: spaceMd }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
              Đơn vị quản lý
            </div>
            <OrgUnitTreeSelect
              organizations={organizations}
              placeholder="Chọn đơn vị..."
              allowClear
              showPath
              allLabel="Tất cả"
              treeDefaultExpandAll={false}
              value={filterOrgUnitId}
              onChange={(val) => { setFilterOrgUnitId(val); setPage(1); }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tên cảng cạn</div>
            <Input placeholder="Tìm theo mã, tên, địa chỉ..." allowClear
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onPressEnter={handleFilterApply}
              style={{ borderRadius: radiusPill, height: 40 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tình trạng</div>
            <Select placeholder="Chọn tình trạng" allowClear
              value={filterStatus}
              onChange={(val) => { setFilterStatus(val); setPage(1); }}
              options={PORT_STATUS_OPTIONS}
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
          </div>
          {filterCollapsed && (<>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Mã cảng cạn</div>
            <Input placeholder="Tìm theo mã cảng cạn" allowClear
              value={filterCode}
              onChange={(e) => { setFilterCode(e.target.value); setPage(1); }}
              onPressEnter={handleFilterApply}
              style={{ borderRadius: radiusPill, height: 40 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Khu vực</div>
            <Select placeholder="Chọn khu vực" allowClear
              value={filterRegion}
              onChange={(val) => { setFilterRegion(val); setPage(1); }}
              options={REGION_OPTIONS}
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Hành lang vận tải</div>
            <Input placeholder="Tìm theo hành lang vận tải" allowClear
              value={filterTransportCorridor}
              onChange={(e) => { setFilterTransportCorridor(e.target.value); setPage(1); }}
              onPressEnter={handleFilterApply}
              style={{ borderRadius: radiusPill, height: 40 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Địa điểm (Tỉnh/Thành Phố)</div>
            <Select placeholder="Chọn tỉnh/thành phố" allowClear showSearch
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              value={filterProvince}
              onChange={(val) => { setFilterProvince(val); setPage(1); }}
              options={VIETNAM_PROVINCES.map((p, i) => ({ value: i + 1, label: p }))}
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Ngày cập nhật</div>
            <DatePicker.RangePicker
              value={[filterUpdatedFrom ? dayjs(filterUpdatedFrom) : null, filterUpdatedTo ? dayjs(filterUpdatedTo) : null]}
              onChange={(dates) => {
                setFilterUpdatedFrom(dates?.[0] ? dates[0].format('YYYY-MM-DD 00:00:00') : undefined);
                setFilterUpdatedTo(dates?.[1] ? dates[1].format('YYYY-MM-DD 23:59:59') : undefined);
                setPage(1);
              }}
              format="DD/MM/YYYY"
              placeholder={['Từ ngày', 'Đến ngày']}
              style={{ width: '100%', borderRadius: radiusPill }} />
          </div>
          </>)}
        </>}
        statusTabs={TAB_STATUS_LIST.map(t => ({ ...t, count: tabCounts[t.key] ?? 0, active: t.key === activeTab }))}
        onStatusTabChange={handleTabChange}
      >
        {isError ? null : dataSource.length === 0 && !isLoading ? (
          <DataTable dataSource={[]} rowKey="id"
            emptyState={<div style={{ padding: '40px 0', textAlign: 'center' }}><div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>📭</div><div style={{ fontSize: fontSizeLg, color: textSecondary, marginBottom: 8 }}>{search || activeTab !== 'all' ? 'Không tìm thấy cảng cạn nào phù hợp' : 'Chưa có cảng cạn nào'}</div></div>}
          />
        ) : (
          <DataTable columns={columns} dataSource={[...dataSource].sort((a: any, b: any) => { if (!sortField) return 0; const aVal = getSortValue(a, sortField); const bVal = getSortValue(b, sortField); const cmp = typeof aVal === 'number' && typeof bVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal), 'vi'); return sortOrder === 'ascend' ? cmp : -cmp; })} rowKey="id" rowActions={rowActions} loading={false} scroll={{ x: 'max-content', y: 550 }}
            onSort={(key: string, order: 'asc' | 'desc') => { setSortField(key); setSortOrder(order === 'asc' ? 'ascend' : 'descend'); setPage(1); }} />
        )}
        <Pagination total={total} current={page} pageSize={pageSize} onChange={(p, ps) => { setPage(p); setPageSize(ps); }} />
      </FilterTableLayout>

      {/* Detail Drawer */}
      <Drawer {...drawerProps}
        title={
          <span style={drawerTitleStyle}>Chi tiết cảng cạn{detailRecord ? ` - ${detailRecord.dryPortName}` : ''}</span>
        }
        open={detailModalOpen} onClose={() => { setDetailModalOpen(false); setDetailRecord(null); }} extra={<Button type="text" onClick={() => { setDetailModalOpen(false); setDetailRecord(null); }} style={drawerCloseBtnStyle}>✕</Button>}
        styles={{ header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 }, body: { padding: '0 24px 12px 24px' } }}
        footer={null}
      >{renderDetailContent()}</Drawer>

      {/* Delete Modal */}
      <Modal maskStyle={{ background: 'rgba(0, 0, 0, 0.4)' }} title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Xác nhận xóa cảng cạn</span>}
        open={deleteModalOpen} onCancel={() => { setDeleteModalOpen(false); setDeletingRecord(null); setDeleteConfirmText(''); }}
        footer={[
          <Button key="cancel" onClick={() => { setDeleteModalOpen(false); setDeletingRecord(null); setDeleteConfirmText(''); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="delete" type="primary" danger onClick={handleConfirmDelete}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Xác nhận xóa</Button>,
        ]}
        width={480}>
        <div style={{ padding: '8px 0' }}>
          <Alert message="Hành động này không thể hoàn tác" type="warning" showIcon icon={<ExclamationCircleOutlined />}
            style={{ marginBottom: spaceFormField, borderRadius: radiusPill }} />
          <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>Vui lòng nhập <strong>tên cảng</strong> hoặc gõ <strong>"XÓA"</strong> để xác nhận xóa.</p>
          {deletingRecord && <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>Cảng cạn: <strong style={{ color: textPrimary }}>{deletingRecord.dryPortName}</strong></p>}
          <Input placeholder="Nhập tên cảng hoặc XÓA" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)}
            onPressEnter={handleConfirmDelete} style={{ borderRadius: radiusPill, height: 40 }} autoFocus />
        </div>
      </Modal>

      {/* Approve Modal */}
      <Modal maskStyle={{ background: 'rgba(0, 0, 0, 0.4)' }}
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Xác nhận phê duyệt</span>}
        open={approveModalOpen} onCancel={() => { setApproveModalOpen(false); setApprovingRecord(null); }}
        footer={[
          <Button key="cancel" onClick={() => { setApproveModalOpen(false); setApprovingRecord(null); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="approve" type="primary" onClick={handleConfirmApprove}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: statusOperational, borderColor: statusOperational }}>Xác nhận</Button>,
        ]}
        width={480}>
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary }}>
            Phê duyệt <strong>{approvingRecord?.dryPortCode} — {approvingRecord?.dryPortName}</strong>?
          </p>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal maskStyle={{ background: 'rgba(0, 0, 0, 0.4)' }} title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Từ chối phê duyệt</span>}
        open={rejectModalOpen} onCancel={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); }}
        footer={[
          <Button key="cancel" onClick={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="reject" type="primary" danger onClick={handleConfirmReject}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Xác nhận từ chối</Button>,
        ]}
        width={480}>
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>Vui lòng nhập lý do từ chối cho cảng cạn:</p>
          {rejectingRecord && <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}><strong style={{ color: textPrimary }}>{rejectingRecord.dryPortCode} — {rejectingRecord.dryPortName}</strong></p>}
          <Input.TextArea placeholder="Nhập lý do từ chối..." value={rejectReason}
            onChange={(e) => { setRejectReason(e.target.value); setRejectError(''); }}
            rows={3} style={{ borderRadius: 8, fontSize: fontSizeMd, borderColor: rejectError ? statusCritical : undefined }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            {rejectError ? <span style={{ color: statusCritical, fontSize: fontSizeMd }}>{rejectError}</span> : <span />}
            <span style={{ color: rejectReason.trim().length < 10 ? statusCritical : textTertiary, fontSize: fontSizeMd }}>
              {rejectReason.length}/10
            </span>
          </div>
        </div>
      </Modal>

      {/* ── History Drawer ──────────────────────────────────────── */}
      <Drawer
        {...drawerProps}
        size={880}
        mask
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Space size={spaceSm} style={{ alignItems: 'center' }}>
              <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
              <span style={drawerTitleStyle}>
                {historyMode === 'all' ? 'Tất cả lịch sử thay đổi — Cảng cạn' : (historyTarget ? `Lịch sử thay đổi — ${historyTarget.dryPortName}` : 'Lịch sử thay đổi')}
              </span>
              <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeLg - 1, fontWeight: fontWeightBold, background: `${colors.sidebarBg}15`, color: colors.sidebarBg, lineHeight: '20px' }}>Tổng cộng {historyFieldCount}</span>
            </Space>
          </div>
        }
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        extra={<Button type="text" onClick={() => setHistoryOpen(false)} style={drawerCloseBtnStyle}>✕</Button>}
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
                onChange={e => { const mode = e.target.value; setHistoryMode(mode); setHistoryLoading(true); setHistoryRecords([]); if (mode === 'all') { dryPortHistory.getAll({ page: 0, size: 500 }).then((d: any) => { setHistoryRecords(d.changeHistory || []); setHistoryEntityNames(d.entityNames || {}); }).catch(() => toast.error('Không thể tải lịch sử thay đổi')).finally(() => setHistoryLoading(false)); } else { dryPortHistory.getHistory(historyTarget?.id ?? '', { page: 0, size: 200 }).then((d: any) => { setHistoryRecords(d.changeHistory || []); }).catch(() => toast.error('Không thể tải lịch sử thay đổi')).finally(() => setHistoryLoading(false)); } }}>
                <Radio.Button value="current" style={{ fontWeight: fontWeightBold, color: historyMode !== 'current' ? textSecondary : actionPrimary }}>Bản ghi hiện tại </Radio.Button>
                <Radio.Button value="all" style={{ fontWeight: fontWeightBold, color: historyMode !== 'all' ? textSecondary : actionPrimary }}>Tất cả bản ghi </Radio.Button>
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
              {historyMode === 'all' && <Select placeholder="Chọn cảng cạn" allowClear showSearch value={historyEntityFilter || undefined}
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
          ) : renderDryPortHistoryTimeline(historyRecords) /* STALE_RENDER const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000); const sorted = [...historyRecords].sort((a: any, b: any) => new Date(b.changedAt || b.createdAt).getTime() - new Date(a.changedAt || a.createdAt).getTime()); const q = historySearch.toLowerCase().trim(); const groups: { tsSec: number; ts: string; actor: string; items: any[] }[] = []; for (const r of sorted) { if (q) { const fn = (r.fieldName || '').toLowerCase(); const ov = (r.oldValue || '').toLowerCase(); const nv = (r.newValue || '').toLowerCase(); const lb = historyFieldName(r.fieldName || '').toLowerCase(); const od = historyFieldValue(r.fieldName, r.oldValue, orgMap, symbolMap).toLowerCase(); const nd = historyFieldValue(r.fieldName, r.newValue, orgMap, symbolMap).toLowerCase(); if (!fn.includes(q) && !ov.includes(q) && !nv.includes(q) && !lb.includes(q) && !od.includes(q) && !nd.includes(q)) continue; } if (historyEntityFilter && r.entityId !== historyEntityFilter) continue; if (historyDateFrom || historyDateTo) { const cd = (r.changedAt || r.createdAt || '').substring(0, 16); if (historyDateFrom && cd < historyDateFrom.replace(' ', 'T')) continue; if (historyDateTo && cd > historyDateTo.replace(' ', 'T') + ':59') continue; } const ts = r.changedAt || r.createdAt || ''; const sec = ts ? toSec(ts) : 0; const prev = groups[groups.length - 1]; if (prev && prev.tsSec === sec && prev.actor === (r.changedBy || '')) prev.items.push(r); else groups.push({ tsSec: sec, ts, actor: r.changedBy || '', items: [r] }); } if (groups.length === 0) return (<div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}><HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} /><div style={{ color: textTertiary, fontSize: fontSizeMd }}>{q || historyDateFrom ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận'}</div></div>); const fmtTime = (ts: string) => { const d = new Date(ts); return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}  ·  ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`; }; if (historySearchRef.current === 'initial') { historySearchRef.current = ''; const init: Record<number, boolean> = {}; groups.forEach((_, i) => { init[i] = true; }); setTimeout(() => setHistoryExpanded(init), 0); } else if (q.length > 0 && historySearchRef.current !== q) { historySearchRef.current = q; const init: Record<number, boolean> = {}; groups.forEach((_, i) => { init[i] = true; }); setTimeout(() => setHistoryExpanded(init), 0); } else if (q.length === 0 && historySearchRef.current !== '') { historySearchRef.current = ''; const init: Record<number, boolean> = {}; groups.forEach((_, i) => { init[i] = false; }); setTimeout(() => setHistoryExpanded(init), 0); } return (<div>{groups.map((g, gi) => (<div key={gi} style={{ display: 'flex', gap: spaceSm, marginBottom: gi < groups.length - 1 ? spaceSm : 0 }}><div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24, flexShrink: 0 }}><div style={{ width: 24, height: 24, borderRadius: '50%', background: surfaceCard, border: `1px solid ${actionPrimary}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ClockCircleFilled style={{ color: actionPrimary, fontSize: 14 }} /></div>{gi < groups.length - 1 && <div style={{ width: 1, flex: 1, minHeight: 24, background: borderDefault, marginTop: 4 }} />}</div><div style={{ ...cardStyle, flex: 1, padding: `${spaceSm}px ${spaceFormField}px`, marginBottom: 0, borderRadius: radiusLg, boxShadow: shadowSm }}><div onClick={() => setHistoryExpanded(prev => ({ ...prev, [gi]: !prev[gi] }))} style={{ display: 'flex', alignItems: 'center', gap: spaceSm, cursor: 'pointer' }}><Text style={{ fontSize: fontSizeLg, color: textPrimary, fontWeight: fontWeightBold }}>{g.ts ? fmtTime(g.ts) : '—'}</Text>{g.actor && <Text style={{ fontSize: fontSizeMd, color: textSecondary }}>— {g.actor}</Text>}{(() => { const a = getActionLabel(g.items); return <Tag color={a.color} style={{ fontSize: 11, marginLeft: spaceSm, borderRadius: radiusPill }}>{a.label}</Tag>; })()}<span style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: actionPrimary, background: `${actionPrimary}12`, borderRadius: radiusPill, padding: '2px 10px', marginLeft: 'auto' }}>{g.items.length}</span>{historyExpanded[gi] === false ? <DownOutlined style={{ fontSize: 12, color: textTertiary }} /> : <UpOutlined style={{ fontSize: 12, color: textTertiary }} />}</div>{historyExpanded[gi] !== false && <><Divider style={{ margin: `${spaceSm}px 0`, borderColor: borderDefault }} /><table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody>{g.items.map((r: any, ri: number) => { const fn = r.fieldName || ''; const ov = r.oldValue !== undefined && r.oldValue != null ? historyFieldValue(fn, r.oldValue, orgMap, symbolMap) : null; const nv = r.newValue !== undefined && r.newValue != null ? historyFieldValue(fn, r.newValue, orgMap, symbolMap) : null; return (<tr key={r.id || ri}><td style={{ padding: '4px 8px 4px 0', fontSize: fontSizeMd, fontWeight: fontWeightMedium, color: textPrimary, whiteSpace: 'nowrap', verticalAlign: 'middle', width: 1 }}>{historyMode === 'all' ? <><Tag color="blue" style={{ marginRight: 4, fontSize: 10, cursor: 'pointer', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setHistoryEntityId(r.entityId); setHistoryEntityName(historyEntityNames[r.entityId] || ''); setHistoryMode('current'); setHistoryLoading(true); setHistoryRecords([]); historySearchRef.current = 'initial'; dryPortHistory.getHistory(r.entityId, { page: 0, size: 200 }).then((d: any) => setHistoryRecords(d.changeHistory || [])).catch(() => toast.error('Không thể tải lịch sử thay đổi')).finally(() => setHistoryLoading(false)); }} onClick={(e) => { e.stopPropagation(); setHistoryEntityId(r.entityId); setHistoryEntityName(historyEntityNames[r.entityId] || ''); setHistoryMode('current'); setHistoryLoading(true); setHistoryRecords([]); historySearchRef.current = 'initial'; dryPortHistory.getHistory(r.entityId, { page: 0, size: 200 }).then((d: any) => setHistoryRecords(d.changeHistory || [])).catch(() => toast.error('Không thể tải lịch sử thay đổi')).finally(() => setHistoryLoading(false)); }}>{historyEntityNames[r.entityId] || r.entityId?.substring(0,8)}</Tag> </> : null}{fn ? historyFieldName(fn) : '—'}</td><td style={{ padding: '4px 0', verticalAlign: 'middle' }}><Space size={4}>{ov ? <Text delete style={{ fontSize: fontSizeMd, color: statusCritical }}>{ov}</Text> : <span style={{ fontSize: fontSizeMd, color: textTertiary }}>—</span>}<ArrowRightOutlined style={{ fontSize: 10, color: textTertiary }} />{nv ? <Text strong style={{ fontSize: fontSizeMd, color: statusOperational }}>{nv}</Text> : <span style={{ fontSize: fontSizeMd, color: textTertiary }}>—</span>}</Space></td></tr>); })}</tbody></table></>}</div></div>))}</div>); })()}
        */}
        </div>
      </Drawer>

      {/* Create Drawer */}
      <Drawer
        {...drawerProps}
        title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>Thêm mới Cảng cạn</span>}
        open={createDrawerOpen}
        onClose={closeCreateDrawer}
        extra={<Button type="text" onClick={closeCreateDrawer} style={drawerCloseBtnStyle}>✕</Button>}
        footer={
          <div style={drawerFooterStyle}>
            <Button onClick={() => { actionTypeRef.current = 'draft'; setSubmitting(true); createForm.submit(); }} loading={submitting} disabled={submitting} style={outlineButtonStyle}>Lưu tạm</Button>
            {isSystemAdmin && (
              <Button type="primary" onClick={() => { actionTypeRef.current = 'approve'; setSubmitting(true); createForm.submit(); }} loading={submitting} disabled={submitting} style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}>Lưu và phê duyệt</Button>
            )}
          </div>
        }
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px' },
        }}
        afterOpenChange={async (open) => {
          if (open) {
            createForm.resetFields();
            setCoordinateList([]);
            setUploadFileList([]);
            setCreateTabKey('general');
            void autoFillOrgUnit();
            setCodeLoading(true);
            try {
              const res = await api.get('/v1/dry-ports/generate-code');
              const code: string = res.data?.data?.code ?? res.data?.data?.dryPortCode ?? '';
              if (code) createForm.setFieldsValue({ dryPortCode: code });
            } catch { /* backend tự sinh khi lưu */ }
            finally { setCodeLoading(false); }
          }
        }}
      >
        <style>{requiredMarkStyle}</style>
        <Form form={createForm} layout="vertical" onFinish={handleCreateFinish} onFinishFailed={handleFormFailed} scrollToFirstError initialValues={{ portStatus: 1 }}>
          <Tabs activeKey={createTabKey} onChange={setCreateTabKey}
            tabBarStyle={{ marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 1, background: surfaceCard }}
            items={buildFormTabs(false, createGeometryType)} />
        </Form>
      </Drawer>

      {/* Update Drawer */}
      <Drawer
        {...drawerProps}
        title={<span style={drawerTitleStyle}>Chỉnh sửa thông tin {editingCode && editingName ? `${editingCode} — ${editingName}` : 'Cảng cạn'}</span>}
        open={updateDrawerOpen}
        onClose={closeUpdateDrawer}
        extra={<Button type="text" onClick={closeUpdateDrawer} style={drawerCloseBtnStyle}>✕</Button>}
        footer={
          <div style={drawerFooterStyle}>
            <Button type="primary" onClick={() => { actionTypeRef.current = 'approve'; setSubmitting(true); updateForm.submit(); }} loading={submitting} disabled={submitting} style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}>Lưu và phê duyệt</Button>
          </div>
        }
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px' },
        }}
      >
        <style>{requiredMarkStyle}</style>
        <Form form={updateForm} layout="vertical" onFinish={handleUpdateFinish} onFinishFailed={handleFormFailed} scrollToFirstError initialValues={{ portStatus: 0 }}>
          <Tabs defaultActiveKey="general"
            tabBarStyle={{ marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 1, background: surfaceCard }}
            items={buildFormTabs(true, updateGeometryType)} />
        </Form>
      </Drawer>
    </div>
  );
}

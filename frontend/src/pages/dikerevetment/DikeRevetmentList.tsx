import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Button,
  Modal,
  Input,
  Select,
  TreeSelect,
  Space,
  Typography,
  Form,
  DatePicker,
  Drawer,
  Row,
  Col,
  Tabs,
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  HistoryOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import {
  dikeRevetmentCRUD,
  dikeRevetmentApproval,
} from '../../services/dikeRevetmentService';
import api from '../../services/api';
import type {
  DikeRevetmentResponse,
  DikeRevetmentType,
  CreateDikeRevetmentRequest,
  UpdateDikeRevetmentRequest,
  ApprovalStatus,
} from '../../types/dikeRevetment';
import { DIKE_REVETMENT_STATUS_LABELS } from '../../types/dikeRevetment';
import { organizationService } from '../../services/organizationService';
import type { Organization } from '../../services/organizationService';
import { portCRUD } from '../../services/portService';
import { VIETNAM_PROVINCE_OPTIONS } from '../../types/common';
import { ScreenHeader, DataTable, FilterTableLayout } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import toast, { message } from '../../components/ToastNotification';
import { symbolService } from '../../services/symbolService';
import type { Symbol as MapSymbol } from '../../services/symbolService';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../services/operatingOrganizationsData';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import DetailTable from '../../components/shared/DetailTable';
import ApprovalModal from '../../components/shared/ApprovalModal';
import InfrastructureAttachmentTab from '../../components/shared/InfrastructureAttachmentTab';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import { colors } from '../../themetokenchk';
import * as themeTokenChk from '../../themetokenchk';
import { usePermissionStore } from '../../store/permissionStore';
import { useAuthStore } from '../../store/authStore';
import { canEditApprovalRecord } from '../../utils/approvalEditPolicy';
import { formLabelProps as labelProps } from '../../components/shared/formLabel';
import { AppDrawer } from '../../components/shared/AppDrawer';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import {
  statusOperational,
  statusAttention,
  statusCritical,
  statusDraft,
  actionPrimary,
  textPrimary,
  textSecondary,
  textTertiary,
  fontSizeSm,
  fontSizeMd,
  fontSizeLg,
  fontWeightBold,
  fontWeightMedium,
  surfaceCard,
  borderDefault,
  radiusPill,
  spaceXs,
  spaceSm,
  spaceMd,
  spaceFormField,
  spaceXl,
  inputStyle,
  selectStyle,
  primaryButtonStyle,
  outlineButtonStyle,
  formFieldStyle,
  formRowGutter,
  drawerTitleStyle,
  drawerFooterStyle,
  requiredMarkStyle,
  filterLabelStyle,
  filterInputStyle,
  confirmModalBodyStyle,
  cellTitleStyle,
  cellSubtitleStyle,
  statusBadgeStyle,
} from '../../themetokenchk';

// ── Field name translation (lịch sử thay đổi) ───────────────────────

const FIELD_LABELS: Record<string, string> = {
  code: 'Mã đê kè',
  dikeRevetmentName: 'Tên đê kè',
  dikeRevetmentType: 'Loại kết cấu công trình',
  orgUnitId: 'Đơn vị quản lý',
  location: 'Địa điểm (Tỉnh/TP)',
  locationDetail: 'Địa điểm chi tiết',
  operatingUnitId: 'Đơn vị vận hành',
  length: 'Chiều dài',
  height: 'Chiều cao',
  crestElevation: 'Cao trình đỉnh',
  constructionDate: 'Thời điểm xây dựng',
  commissioningDate: 'Thời điểm đưa vào khai thác',
  lastMaintenanceYear: 'Năm bảo trì gần nhất',
  status: 'Tình trạng',
  note: 'Ghi chú',
  approvalStatus: 'Trạng thái phê duyệt',
  rejectionReason: 'Lý do từ chối',
};

const historyFieldName = (fn: string): string => FIELD_LABELS[fn] || fn;

// ── History value rendering (chuẩn /vts-system + /vts-operation-center): WKT/raw → DMS/đẹp ──
function formatCoordPointDms(xStr: string, yStr?: string): string {
  const x = Number(xStr);
  const y = yStr !== undefined && yStr !== '' ? Number(yStr) : NaN;
  const toDmsString = (val: number, isLat: boolean) => {
    if (isNaN(val)) return '';
    const abs = Math.abs(val);
    const d = Math.floor(abs);
    const minFloat = (abs - d) * 60;
    const m = Math.floor(minFloat);
    const s = Math.round((minFloat - m) * 60 * 10) / 10;
    const dir = isLat ? (val >= 0 ? 'N' : 'S') : (val >= 0 ? 'E' : 'W');
    return `${d}° ${m}' ${s.toFixed(1)}" ${dir}`;
  };
  if (!isNaN(x) && !isNaN(y)) {
    let lat = y;
    let lng = x;
    if (x < 35 && y > 50) { lat = x; lng = y; }
    return `${toDmsString(lat, true)}, ${toDmsString(lng, false)}`;
  }
  if (!isNaN(x)) return toDmsString(x, x <= 35 && x >= -35);
  return xStr;
}

function parseCoordinatesPoints(raw: string | null): { typeName?: string; points: Array<{ x: string; y: string; index: number }> } | null {
  if (!raw || raw === '—' || raw === 'Chưa có' || raw === '(null)' || raw === '(trống)') return null;
  const str = raw.trim();
  if (/^(Đường|Vùng|Điểm)\s+bản\s+đồ\s*\(\d+\s+điểm/i.test(str)) return { typeName: str, points: [] };
  let typeName = '';
  let inner = str;
  if (/^POINT\s*\(/i.test(str)) { typeName = 'Điểm'; inner = str.replace(/^POINT\s*\(/i, '').replace(/\)\s*$/, ''); }
  else if (/^LINESTRING\s*\(/i.test(str)) { typeName = 'Đường'; inner = str.replace(/^LINESTRING\s*\(/i, '').replace(/\)\s*$/, ''); }
  else if (/^LINE\s*\(/i.test(str)) { typeName = 'Đường'; inner = str.replace(/^LINE\s*\(/i, '').replace(/\)\s*$/, ''); }
  else if (/^POLYGON\s*\(\s*\(/i.test(str)) { typeName = 'Vùng'; inner = str.replace(/^POLYGON\s*\(\s*\(/i, '').replace(/\)\s*\)\s*$/, ''); }
  else if (/^MULTIPOINT\s*\(/i.test(str)) { typeName = 'Tập hợp điểm'; inner = str.replace(/^MULTIPOINT\s*\(/i, '').replace(/\)\s*$/, ''); }
  else if (str.startsWith('(') && str.endsWith(')')) { inner = str.slice(1, -1); }
  else { return null; }
  const pointStrings = inner.split(',').map((s) => s.trim()).filter(Boolean);
  if (pointStrings.length === 0) return null;
  const points = pointStrings.map((ps, idx) => {
    const clean = ps.replace(/[()]/g, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    return parts.length >= 2 ? { x: parts[0], y: parts[1], index: idx + 1 } : { x: clean, y: '', index: idx + 1 };
  });
  return { typeName, points };
}

function renderCoordinatesDisplay(val: string | null) {
  if (!val || val === '—' || val === 'Chưa có' || val === '(null)' || val === '(trống)') {
    return <span style={{ color: textTertiary }}>{val === 'Chưa có' ? 'Chưa có' : '—'}</span>;
  }
  const parsed = parseCoordinatesPoints(val);
  if (!parsed || parsed.points.length === 0) {
    return <span style={{ color: textPrimary }}>{parsed?.typeName || val}</span>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spaceXs, width: '100%' }}>
      {parsed.typeName && (
        <span style={{ fontSize: fontSizeSm, fontWeight: fontWeightBold, color: actionPrimary }}>
          {parsed.typeName} ({parsed.points.length} điểm)
        </span>
      )}
      {parsed.points.map((pt) => (
        <div key={pt.index} style={{ fontSize: fontSizeSm, color: textPrimary, lineHeight: 1.5 }}>
          {parsed.points.length > 1 && <span style={{ color: textSecondary, marginRight: spaceXs }}>#{pt.index}:</span>}
          <span>{formatCoordPointDms(pt.x, pt.y)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Constants ────────────────────────────────────────────────────────

// 7 trạng thái chuẩn (approval-2-level-spec.md 3.1/3.10) — nhãn bám ApprovalStatusBadge
// (nguồn duy nhất), KHÔNG dùng mã legacy PROPOSED/REJECTED cho tab hay filter.
const STATUS_TAB_LIST = [
  { key: '', label: 'Tất cả', color: actionPrimary },
  { key: 'DRAFT', label: DIKE_REVETMENT_STATUS_LABELS.DRAFT, color: statusDraft },
  { key: 'PENDING_APPROVAL', label: DIKE_REVETMENT_STATUS_LABELS.PENDING_APPROVAL, color: statusAttention },
  { key: 'APPROVED_LEVEL1', label: DIKE_REVETMENT_STATUS_LABELS.APPROVED_LEVEL1, color: '#0284C7' },
  { key: 'APPROVED', label: DIKE_REVETMENT_STATUS_LABELS.APPROVED, color: statusOperational },
  { key: 'REJECTED_LEVEL1', label: DIKE_REVETMENT_STATUS_LABELS.REJECTED_LEVEL1, color: statusCritical },
  { key: 'REJECTED_LEVEL2', label: DIKE_REVETMENT_STATUS_LABELS.REJECTED_LEVEL2, color: statusCritical },
];

const TAB_QUERY_MAP: Record<string, ApprovalStatus | undefined> = {
  '': undefined,
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED_LEVEL1: 'APPROVED_LEVEL1',
  APPROVED: 'APPROVED',
  REJECTED_LEVEL1: 'REJECTED_LEVEL1',
  REJECTED_LEVEL2: 'REJECTED_LEVEL2',
};

// Loại kết cấu công trình — khớp backend enum dike_revetment_type
const DIKE_REVETMENT_TYPE_OPTIONS = [
  { label: 'Đê chắn sóng', value: 'RIVER_DIKE' },
  { label: 'Đê chắn cát', value: 'SAND_DIKE' },
  { label: 'Kè hướng dòng', value: 'FLOW_GUIDE_REVETMENT' },
  { label: 'Kè bảo vệ bờ', value: 'BANK_PROTECTION_REVETMENT' },
  { label: 'Giao thông', value: 'TRAFFIC' },
  { label: 'Kè chắn sóng', value: 'WAVE_BREAK_REVETMENT' },
  { label: 'Kè chắn cát', value: 'SAND_BREAK_REVETMENT' },
];

const DIKE_REVETMENT_TYPE_MAP: Record<string, string> = {
  RIVER_DIKE: 'Đê sông',
  SAND_DIKE: 'Đê chắn cát',
  FLOW_GUIDE_REVETMENT: 'Kè hướng dòng',
  BANK_PROTECTION_REVETMENT: 'Kè bảo vệ bờ',
  TRAFFIC: 'Giao thông',
  WAVE_BREAK_REVETMENT: 'Kè chắn sóng',
  SAND_BREAK_REVETMENT: 'Kè chắn cát',
};

// Tình trạng hoạt động — khớp backend OperationalStatus (integer enum)
const OPERATIONAL_STATUS_OPTIONS = [
  { value: '1', label: 'Chưa khai thác/vận hành' },
  { value: '2', label: 'Đang khai thác/vận hành' },
  { value: '3', label: 'Dừng khai thác/vận hành' },
];

const OPERATIONAL_STATUS_STYLE_MAP: Record<string, { color: string; label: string }> = {
  '1': { color: statusAttention, label: 'Chưa khai thác/vận hành' },
  '2': { color: statusOperational, label: 'Đang khai thác/vận hành' },
  '3': { color: statusCritical, label: 'Dừng khai thác/vận hành' },
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try { return dayjs(dateStr).format('DD/MM/YYYY HH:mm:ss'); } catch { return dateStr; }
}

function formatDateOnly(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try { return dayjs(dateStr).format('DD/MM/YYYY'); } catch { return dateStr; }
}

function formatYear(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  if (/^\d{4}$/.test(dateStr)) return dateStr;
  try { return dayjs(dateStr).format('YYYY'); } catch { return dateStr; }
}

// ── WKT helpers (chuẩn GIS /port) ────────────────────────────────
function serializeVerticesToWkt(pts: { lng: number; lat: number }[], geomType: string): string {
  const validPts = pts.filter((p) => p && typeof p.lng === 'number' && typeof p.lat === 'number' && !isNaN(p.lng) && !isNaN(p.lat));
  if (validPts.length === 0) return '';
  const type = (geomType || 'POINT').toUpperCase();
  if (type === 'POINT') {
    if (validPts.length === 1) {
      return `POINT(${validPts[0].lng.toFixed(6)} ${validPts[0].lat.toFixed(6)})`;
    }
    const coords = validPts.map((p) => `(${p.lng.toFixed(6)} ${p.lat.toFixed(6)})`).join(',');
    return `MULTIPOINT(${coords})`;
  } else if (type === 'LINE') {
    const coords = validPts.map((p) => `${p.lng.toFixed(6)} ${p.lat.toFixed(6)}`).join(', ');
    return `LINESTRING(${coords})`;
  } else if (type === 'POLYGON') {
    if (validPts.length < 3) return '';
    const list = [...validPts];
    list.push(validPts[0]);
    const coords = list.map((p) => `${p.lng.toFixed(6)} ${p.lat.toFixed(6)}`).join(', ');
    return `POLYGON((${coords}))`;
  }
  return '';
}

// ── WKT parse — chuẩn /vts-operation-center: chấp nhận tiền tố SRID, khoảng trắng sau keyword,
//    dạng MULTIPOINT/POINT lẫn nhau và lowercase; tránh mất giá trị 'Thông tin vị trí' khi chỉnh sửa ──
function parseWktToVertices(wkt: string, geomType: string): { lng: number; lat: number }[] {
  if (!wkt) return [];
  try {
    const cleaned = String(wkt).trim().replace(/^SRID=\d+\s*;/i, '').trim();
    const upper = cleaned.toUpperCase();
    const isPolygon = upper.startsWith('POLYGON');
    const isLine = upper.startsWith('LINESTRING');
    const isPoint = upper.includes('POINT');
    const type = isPolygon ? 'POLYGON' : isLine ? 'LINE' : isPoint ? 'POINT' : (geomType || '').toUpperCase();
    const pairs = Array.from(cleaned.matchAll(/(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\s+(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g));
    if (pairs.length === 0) return [];
    const pts = pairs.map((m) => ({ lng: parseFloat(m[1]), lat: parseFloat(m[2]) }));
    if (type === 'POLYGON') {
      // Bỏ điểm đóng vòng trùng điểm đầu (chuẩn WKT)
      if (pts.length > 1 && pts[0].lng === pts[pts.length - 1].lng && pts[0].lat === pts[pts.length - 1].lat) {
        pts.pop();
      }
      return pts;
    }
    return pts;
  } catch (e) {
    console.warn('Sai định dạng WKT:', wkt, e);
  }
  return [];
}

const buildOrgTree = (nodes: Organization[]): any[] => {
  const map = new Map<string, any>();
  const roots: any[] = [];
  nodes.forEach((org) => {
    map.set(org.id, { title: org.name, value: org.id, parentId: org.parentId, children: [] });
  });
  nodes.forEach((org) => {
    const node = map.get(org.id);
    if (org.parentId && map.has(org.parentId)) {
      map.get(org.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
};

const tabBarStyle: React.CSSProperties = {
  marginBottom: 0,
  paddingTop: 0,
  position: 'sticky',
  top: 0,
  zIndex: 1,
  background: surfaceCard,
};



// ── Component ────────────────────────────────────────────────────────

/** Nhãn form khu GIS tab — copy y hệt màn chuẩn /vts-assist (gisLabel). */
const gisFormLabel = (text: string) => (
  <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '18px' }}>{text}</span>
);

/** Ô nhập DMS (Độ/Phút/Giây) cho bảng Tọa độ — copy y hệt VtsAssistDmsEditorCell (màn chuẩn /vts-assist). */
function DikeRevetmentDmsEditorCell({
  row,
  index,
  field,
  onUpdatePoint,
}: {
  row: { lat: number; lng: number };
  index: number;
  field: 'lat' | 'lng';
  onUpdatePoint: (index: number, field: 'lat' | 'lng', d: number, m: number, s: number) => void;
}) {
  const value = field === 'lat' ? row.lat : row.lng;
  const toDms = (dd: number): { d: number; m: number; s: number } => {
    if (dd == null || isNaN(dd)) return { d: 0, m: 0, s: 0 };
    const abs = Math.abs(dd);
    const d = Math.floor(abs);
    const m = Math.floor((abs - d) * 60);
    const s = parseFloat(((abs - d - m / 60) * 3600).toFixed(2));
    return { d, m, s };
  };
  const dms = toDms(value);
  const dMax = field === 'lat' ? 90 : 180;
  const sepStyle = (middle: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0 6px',
    background: colors.bodyBg,
    border: `1px solid ${borderDefault}`,
    borderLeft: 0,
    ...(middle ? { borderRight: 0 } : {}),
    fontSize: fontSizeSm,
    color: textTertiary,
    whiteSpace: 'nowrap' as const,
  });
  return (
    <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}>
      <InputNumber
        value={dms.d}
        min={0}
        max={dMax}
        precision={0}
        placeholder="Độ"
        controls={false}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(x) => onUpdatePoint(index, field, x ?? 0, dms.m, dms.s)}
        style={{ flex: 1, minWidth: 0, textAlign: 'center' }}
      />
      <span style={sepStyle(true)}>°</span>
      <InputNumber
        value={dms.m}
        min={0}
        max={59}
        precision={0}
        placeholder="Phút"
        controls={false}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(x) => onUpdatePoint(index, field, dms.d, x ?? 0, dms.s)}
        style={{ flex: 1, minWidth: 0, textAlign: 'center' }}
      />
      <span style={sepStyle(true)}>'</span>
      <InputNumber
        value={dms.s}
        min={0}
        max={59.9999}
        step={0.01}
        placeholder="Giây"
        controls={false}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(x) => onUpdatePoint(index, field, dms.d, dms.m, x ?? 0)}
        style={{ flex: 1.2, minWidth: 0, textAlign: 'center' }}
      />
      <span style={sepStyle(false)}>{'"'}</span>
    </Space.Compact>
  );
}

// Chuẩn /vts-operation-center (y hệt màn /vts-assist): đảm bảo đủ số tọa độ tối thiểu theo loại hình
// (POINT 1 / LINE 2 / POLYGON 3) — chuyển loại GIỮ điểm đã nhập, chỉ thêm/bớt theo mức tối thiểu.
function adjustGpsListForGeometry(list: { lat: number; lng: number }[], geom: string): { lat: number; lng: number }[] {
  const min = geom === 'POINT' ? 1 : geom === 'LINE' ? 2 : 3;
  let next = [...list];
  if (geom === 'POINT') next = next.slice(0, 1);
  while (next.length < min) next.push({ lat: NaN, lng: NaN });
  return next;
}

export default function DikeRevetmentList() {
  const hasPerm = usePermissionStore((s: any) => s.hasPermission);
  const currentUser = useAuthStore((s: any) => s.user);
  // Phê duyệt 2 cấp (M-1006): C1 = Cảng vụ/Chi cục, C2 = Cục — quyền theo cấp duyệt.
  const canApproveC1 = hasPerm('dikerevetment:approvec1') || hasPerm('dikerevetment:approve');
  const canApproveC2 = hasPerm('dikerevetment:approvec2') || hasPerm('dikerevetment:approve') || hasPerm('*');
  const canSubmitForApproval = hasPerm('dikerevetment:update');
  // Đơn vị cha/Cục (scope_all, admin) được chọn đơn vị con khi thêm mới; tài khoản thường bị khóa theo đơn vị của mình
  const isElevatedOrg = hasPerm('orgunit:scope_all') || hasPerm('*')
    || currentUser?.role === 'ROLE_SYSTEM_ADMIN' || currentUser?.role === 'ROLE_SUPER_ADMIN';

  // ── Filter state ─────────────────────────────────────────────────
  const [filterName, setFilterName] = useState('');
  const [filterCode, setFilterMa] = useState('');
  const [filterSeaportId, setFilterCangBienId] = useState<string | undefined>();
  const [filterLocation, setFilterLocation] = useState<string | undefined>();
  const [filterType, setFilterType] = useState<DikeRevetmentType | undefined>();
  const [filterStatusVal, setFilterStatusVal] = useState<string | undefined>();
  const [filterUnitId, setFilterUnitId] = useState<string | undefined>();
  const [filterCommissioningYear, setFilterCommissioningYear] = useState<string | undefined>();
  const [filterUpdatedRange, setFilterUpdatedRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('');

  // ── Pagination ──────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // ── Data ─────────────────────────────────────────────────────────
  const [dataSource, setDataSource] = useState<DikeRevetmentResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  // ── Organizations + Seaports ─────────────────────────────────────
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [seaports, setSeaports] = useState<{ id: string; portName?: string; portCode?: string }[]>([]);

  // ── GIS form state (chuẩn màn /port) ─────────────────────────────
  const [gpsCoordList, setGpsCoordList] = useState<Array<{ lat: number; lng: number }>>([]);
  const [symbols, setSymbols] = useState<MapSymbol[]>([]);
  const [uploadFileList, setUploadFileList] = useState<any[]>([]);
  // File đã lưu bị gỡ khỏi danh sách — chờ xóa thật khi Lưu (chuẩn /vts-operation-center)
  const [pendingDeletedAttachments, setPendingDeletedAttachments] = useState<{ id: string; fileName: string }[]>([]);
  const [gisMapOpen, setGisMapOpen] = useState(false);
  const [gisViewOpen, setGisViewOpen] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);

  const ddToDms = (dd: number): { d: number; m: number; s: number } => {
    if (dd == null || isNaN(dd)) return { d: 0, m: 0, s: 0 };
    const abs = Math.abs(dd);
    const d = Math.floor(abs);
    const m = Math.floor((abs - d) * 60);
    const s = parseFloat(((abs - d - m / 60) * 3600).toFixed(2));
    return { d, m, s };
  };
  const dmToDd = (d: number, m: number, s: number): number => d + m / 60 + s / 3600;

  const addGpsPoint = () => setGpsCoordList((p) => [...p, { lat: NaN, lng: NaN }]);
  const removeGpsPoint = (i: number) => setGpsCoordList(gpsCoordList.filter((_, idx) => idx !== i));
  const updateGpsPoint = (i: number, field: 'lat' | 'lng', d: number, m: number, s: number) => {
    const next = [...gpsCoordList];
    next[i] = { ...next[i], [field]: dmToDd(d, m, s) };
    setGpsCoordList(next);
  };

  // ── Drawer state ─────────────────────────────────────────────────
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DikeRevetmentResponse | null>(null);
  const [detailRecord, setDetailRecord] = useState<DikeRevetmentResponse | null>(null);
  const [isDetailMode, setIsDetailMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createForm] = Form.useForm();
  const createGeometryType = Form.useWatch('geometryType', createForm);
  // Chống race khi đóng/mở drawer nhanh trong lúc getById nạp chi tiết (chuẩn /vts-operation-center)
  const editOpenSeqRef = useRef(0);

  // ── GIS: auto-fill Hệ quy chiếu + Quy tắc hiển thị + đủ số điểm tối thiểu theo Loại đối tượng
  //    (copy y hệt màn chuẩn /vts-assist — effect thay cho onChange; chuyển loại GIỮ điểm đã nhập,
  //    chỉ thêm/bớt theo mức tối thiểu POINT=1 / LINE=2 / POLYGON=3) ──────────────────────────────
  useEffect(() => {
    if (!createGeometryType) {
      createForm.setFieldsValue({ coordinateSystem: undefined, displayRule: undefined });
      setGpsCoordList([]);
      return;
    }
    createForm.setFieldsValue({ coordinateSystem: 1, displayRule: 'Độ, phút, giây (DMS)' });
    setGpsCoordList((prev) => adjustGpsListForGeometry(prev, String(createGeometryType)));
  }, [createGeometryType, createForm]);
  const gisMinPoints = createGeometryType === 'POINT' ? 1 : createGeometryType === 'LINE' ? 2 : createGeometryType === 'POLYGON' ? 3 : 1;
  const gisShownRows = useMemo(
    () => (createGeometryType === 'POINT' ? gpsCoordList.slice(0, 1) : gpsCoordList).map((c, i) => ({ ...c, _idx: i })),
    [createGeometryType, gpsCoordList],
  );

  // ── File đính kèm (chuẩn InfrastructureAttachmentTab) ───────────────
  const handlePickAttachment = (file: File) => {
    if (file.size > 20 * 1024 * 1024) { message.error('File vượt quá 20MB'); return false; }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(ext)) {
      message.error('Định dạng không hỗ trợ'); return false;
    }
    if (uploadFileList.length >= 10) { message.error('Tối đa 10 tệp đính kèm'); return false; }
    const uid = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setUploadFileList((prev) => [...prev, { uid, name: file.name, status: 'done' as const, originFileObj: file }]);
    return false;
  };
  const handleRemoveAttachment = (id: string) => {
    const target = uploadFileList.find((f) => f.uid === id);
    if (!target) return;
    if (target.originFileObj || !target.attachmentId) {
      setUploadFileList((prev) => prev.filter((f) => f.uid !== id));
      return;
    }
    // File đã lưu: chỉ đưa vào hàng chờ — xóa thật khi Lưu qua endpoint entity
    // để backend ghi nhật ký 'Tài liệu đính kèm' (chuẩn /vts-operation-center).
    setPendingDeletedAttachments((prev) => [...prev, { id: target.attachmentId, fileName: target.name }]);
    setUploadFileList((prev) => prev.filter((f) => f.uid !== id));
    toast.success('Đã xóa tệp đính kèm');
  };
  const handleDownloadAttachment = async (id: string, fileName?: string) => {
    const target = uploadFileList.find((f) => f.uid === id);
    if (target?.originFileObj) {
      // File mới chưa lưu: tải blob cục bộ (chuẩn /vts-operation-center)
      const url = URL.createObjectURL(target.originFileObj);
      const a = document.createElement('a');
      a.href = url;
      a.download = target.name;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    // File đã lưu: tải qua endpoint entity — chuẩn /vts-operation-center
    const recordId = editingRecord?.id || detailRecord?.id;
    if (!recordId) return;
    try {
      await dikeRevetmentCRUD.downloadAttachment(recordId, id, fileName || target?.name);
    } catch {
      toast.error('Không thể tải xuống tệp đính kèm');
    }
  };
  const attachmentItems = uploadFileList.map((f) => ({
    id: f.uid,
    fileName: f.name,
    fileSize: f.originFileObj ? f.originFileObj.size : (f.fileSize ?? 0),
    uploadedByName: currentUser?.fullName || currentUser?.username || 'Cán bộ quản lý',
    uploadedDate: f.uploadedDate || new Date().toISOString(),
    filePath: f.filePath,
    file: f.originFileObj,
  }));
  const attachmentsEditable = !editingRecord || canEditApprovalRecord(editingRecord.approvalStatus, { hasPerm, resource: 'dikerevetment' });

  // ── GIS: chọn tọa độ trên bản đồ (chuẩn CHK — GisLocationSelector) ──
  const applyMapSelection = (val: any) => {
    if (!val) return;
    if (val.geometryType) createForm.setFieldValue('geometryType', val.geometryType);
    if (val.symbolId) createForm.setFieldValue('symbolId', val.symbolId);
    if (val.coordinates) {
      const pairs = String(val.coordinates).match(/-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?/g) || [];
      const pts = pairs
        .map((p) => { const [lng, lat] = p.split(/\s+/).map(Number); return { lng, lat }; })
        .filter((p) => !isNaN(p.lng) && !isNaN(p.lat));
      if (pts.length > 0) setGpsCoordList(pts);
    }
  };
  const [activeTabKey, setActiveTabKey] = useState('general');

  // ── Delete state ─────────────────────────────────────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<DikeRevetmentResponse | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // ── Approval state ──────────────────────────────────────────────
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submittingRecord, setSubmittingRecord] = useState<DikeRevetmentResponse | null>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvingRecord, setApprovingRecord] = useState<DikeRevetmentResponse | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRecord, setRejectingRecord] = useState<DikeRevetmentResponse | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // ── History state ────────────────────────────────────────────────
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<DikeRevetmentResponse | null>(null);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearchInput, setHistorySearchInput] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [historyPage, setHistoryPage] = useState(0);

  // ── Đơn vị vận hành: danh mục chung (chuẩn cctv/radar — /common/options/operating-organizations) ──
  const [operatingUnits, setOperatingUnits] = useState<Array<{ id: string; code: string; name: string }>>(DEFAULT_OPERATING_ORGANIZATIONS);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/common/options/operating-organizations');
        const data = res.data?.data;
        if (Array.isArray(data) && data.length > 0 && !cancelled) setOperatingUnits(data);
      } catch {
        // endpoint lỗi → giữ danh sách mặc định
      }
    })();
    return () => { cancelled = true; };
  }, []);
  const operatingUnitOptions = useMemo(() => operatingUnits.map((o) => ({ value: o.id, label: o.name })), [operatingUnits]);
  const operatingUnitNameById = (id?: string): string => {
    if (!id) return '—';
    return operatingUnits.find((o) => o.id === id)?.name || id;
  };

  // ── Init: organizations + users ──────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const resp = await organizationService.list({ pageSize: 1000 });
        setOrganizations(resp.data || []);
      } catch (err) {
        console.error('Failed to load organizations', err);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const list = await portCRUD.getOptions();
      setSeaports(list || []);
    })();
  }, []);

  // Load symbols for GIS tab (chuẩn /port)
  useEffect(() => {
    (async () => {
      try {
        const res = await symbolService.list({ page: 1, pageSize: 1000, status: 'active' });
        setSymbols(res.data || []);
      } catch (err) {
        console.error('Failed to load symbols', err);
      }
    })();
  }, []);

  // ── Data fetching ────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await dikeRevetmentCRUD.search({
        page: page - 1,
        size: pageSize,
        code: filterCode || undefined,
        keyword: filterName || undefined,
        seaportId: filterSeaportId,
        location: filterLocation,
        dikeRevetmentType: filterType,
        conditionStatus: filterStatusVal,
        approvalStatus: TAB_QUERY_MAP[activeTab],
        orgUnitId: filterUnitId,
        commissioningYear: filterCommissioningYear,
        updatedFrom: filterUpdatedRange?.[0] ? filterUpdatedRange[0].format('YYYY-MM-DD') : undefined,
        updatedTo: filterUpdatedRange?.[1] ? filterUpdatedRange[1].format('YYYY-MM-DD') : undefined,
      });
      setDataSource(res.items);
      setTotal(res.total);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, filterName, filterCode, filterSeaportId, filterLocation, filterType, filterStatusVal, filterUnitId, filterCommissioningYear, filterUpdatedRange, activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Tab counts — lấy tổng theo từng trạng thái
  const fetchTabCounts = useCallback(async () => {
    const statuses: (ApprovalStatus | undefined)[] = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED_LEVEL1', 'APPROVED', 'REJECTED_LEVEL1', 'REJECTED_LEVEL2'];
    const results = await Promise.allSettled(
      statuses.map((st) => dikeRevetmentCRUD.search({ page: 0, size: 1, approvalStatus: st })),
    );
    const counts: Record<string, number> = {};
    statuses.forEach((st, idx) => {
      if (results[idx].status === 'fulfilled') {
        counts[st as string] = (results[idx] as PromiseFulfilledResult<any>).value?.total || 0;
      } else {
        counts[st as string] = 0;
      }
    });
    setTabCounts(counts);
  }, []);

  useEffect(() => {
    fetchTabCounts();
  }, [fetchTabCounts]);

  const statusTabs = useMemo(() =>
    STATUS_TAB_LIST.map((tab) => ({
      ...tab,
      count: tab.key ? (tabCounts[tab.key] ?? 0) : total,
      active: activeTab === tab.key,
    })),
    [tabCounts, activeTab, total],
  );

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setPage(1);
  };

  const handleFilterApply = () => { setPage(1); fetchData(); };
  const handleFilterReset = () => {
    setFilterName('');
    setFilterMa('');
    setFilterCangBienId(undefined);
    setFilterLocation(undefined);
    setFilterType(undefined);
    setFilterStatusVal(undefined);
    setFilterUnitId(undefined);
    setFilterCommissioningYear(undefined);
    setFilterUpdatedRange(null);
    setActiveTab('');
    setPage(1);
  };

  // ── Drawer helpers ───────────────────────────────────────────────
  const openCreateDrawer = useCallback(() => {
    editOpenSeqRef.current += 1;
    setEditingRecord(null);
    setDetailRecord(null);
    setIsDetailMode(false);
    createForm.resetFields();
    createForm.setFieldsValue({
      status: '2',
    });
    setGpsCoordList([]);
    setUploadFileList([]);
    setPendingDeletedAttachments([]);
    setActiveTabKey('general');
    setDrawerVisible(true);
    // Auto-generate mã đê kè mới (chuẩn /port)
    setCodeLoading(true);
    (async () => {
      try {
        const res = await api.get('/v1/dike-revetment/generate-code');
        const code: string | undefined = res.data?.data?.code;
        if (code) {
          createForm.setFieldsValue({ code });
        }
      } catch {
        // không chặn mở form nếu sinh mã lỗi
      } finally {
        setCodeLoading(false);
      }
    })();
    // Mặc định đơn vị quản lý theo tài khoản; cha/Cục không bị khóa (được chọn đơn vị con)
    if (!isElevatedOrg) {
      (async () => {
        try {
          const res = await api.get('/users/me');
          const profile = res.data?.data ?? res.data;
          if (profile?.orgUnitId) {
            createForm.setFieldsValue({ orgUnitId: profile.orgUnitId });
          }
        } catch {
          // không chặn nếu không lấy được profile
        }
      })();
    }
  }, [createForm, isElevatedOrg]);

  const openEditDrawer = useCallback((record: DikeRevetmentResponse) => {
    editOpenSeqRef.current += 1;
    const seq = editOpenSeqRef.current;
    setEditingRecord(record);
    setDetailRecord(null);
    setIsDetailMode(false);
    createForm.setFieldsValue({
      dikeRevetmentType: record.dikeRevetmentType,
      location: record.location,
      locationDetail: record.locationDetail,
      dikeRevetmentName: record.dikeRevetmentName,
      seaportId: record.seaportId,
      operatingUnitId: record.operatingUnitId,
      constructionDate: record.constructionDate ? dayjs(record.constructionDate) : null,
      lastMaintenanceYear: record.lastMaintenanceYear ? dayjs(record.lastMaintenanceYear) : null,
      length: record.length,
      crestElevation: record.crestElevation,
      commissioningDate: record.commissioningDate ? dayjs(record.commissioningDate) : null,
      height: record.height,
      status: record.status,
      note: record.note,
      orgUnitId: record.orgUnitId,
      code: record.code,
      geometryType: record.geometryType,
      symbolId: record.symbolId,
    });
    setGpsCoordList(parseWktToVertices(record.coordinates || '', record.geometryType || ''));
    setPendingDeletedAttachments([]);
    setUploadFileList((record.attachments || []).map((a) => ({
      uid: a.id,
      name: a.fileName,
      status: 'done' as const,
      filePath: a.fileUrl,
      attachmentId: a.id,
      fileSize: a.fileSize,
      uploadedDate: a.uploadedDate,
    })));
    setActiveTabKey('general');
    setDrawerVisible(true);

    // Chuẩn /vts-operation-center: khi mở chỉnh sửa luôn getById để nạp lại đầy đủ GIS + file đính kèm
    (async () => {
      try {
        const detail = await dikeRevetmentCRUD.getById(record.id);
        if (editOpenSeqRef.current !== seq) return; // drawer đã đóng / mở bản ghi khác
        createForm.setFieldsValue({
          geometryType: detail.geometryType,
          symbolId: detail.symbolId,
        });
        setGpsCoordList(parseWktToVertices(detail.coordinates || '', detail.geometryType || ''));
        if (detail.attachments && detail.attachments.length > 0) {
          setUploadFileList(detail.attachments.map((a) => ({
            uid: a.id,
            name: a.fileName,
            status: 'done' as const,
            filePath: a.fileUrl,
            attachmentId: a.id,
            fileSize: a.fileSize,
            uploadedDate: a.uploadedDate,
          })));
        }
      } catch {
        // Hàng trong danh sách đã đủ — giữ nguyên giá trị đã nạp
      }
    })();
  }, [createForm]);

  const openDetailDrawer = useCallback(async (record: DikeRevetmentResponse) => {
    editOpenSeqRef.current += 1;
    setDetailRecord(record);
    setEditingRecord(null);
    setIsDetailMode(true);
    setActiveTabKey('basic');
    setDrawerVisible(true);
    try {
      const detail = await dikeRevetmentCRUD.getById(record.id);
      setDetailRecord(detail);
    } catch (err) {
      console.error('Failed to load detail', err);
    }
  }, []);

  const closeDrawer = () => {
    editOpenSeqRef.current += 1;
    setDrawerVisible(false);
    setEditingRecord(null);
    setDetailRecord(null);
    setPendingDeletedAttachments([]);
  };

  // ── Submit ───────────────────────────────────────────────────────
  const handleSubmit = async (action: 'draft' | 'submit' | 'approve') => {
    try {
      const values = await createForm.validateFields();
      setSubmitting(true);
      const coordinates = serializeVerticesToWkt(gpsCoordList, values.geometryType || '');
      const payload: CreateDikeRevetmentRequest = {
        dikeRevetmentType: values.dikeRevetmentType,
        location: values.location,
        locationDetail: values.locationDetail,
        dikeRevetmentName: values.dikeRevetmentName,
        seaportId: values.seaportId,
        operatingUnitId: values.operatingUnitId,
        constructionDate: values.constructionDate ? values.constructionDate.format('YYYY-MM-DD') : undefined,
        lastMaintenanceYear: values.lastMaintenanceYear ? values.lastMaintenanceYear.format('YYYY') : undefined,
        length: values.length,
        crestElevation: values.crestElevation,
        commissioningDate: values.commissioningDate ? values.commissioningDate.format('YYYY-MM-DD') : undefined,
        height: values.height,
        status: values.status,
        orgUnitId: values.orgUnitId,
        code: values.code,
        geometryType: values.geometryType,
        coordinates,
        symbolId: values.symbolId,
      };
      if (values.note !== undefined) {
        (payload as any).note = values.note;
      }

      // Chuẩn phê duyệt 2 cấp (approval-2-level-spec.md 3.2/3.9 + infrastructure-screen-template §3.6):
      // - draft  : Lưu tạm — tạo / giữ DRAFT.
      // - submit : Lưu và gửi phê duyệt — tạo/sửa xong gửi vào vòng 1 (PENDING_APPROVAL).
      // - approve: Lưu và phê duyệt — chỉ cấp có quyền duyệt; khi sửa hồ sơ Đã duyệt,
      //            backend giữ nguyên APPROVED và ghi bản cũ vào nhật ký (T12).
      let savedId: string | null = null;
      if (editingRecord) {
        await dikeRevetmentCRUD.update(editingRecord.id, payload as UpdateDikeRevetmentRequest);
        savedId = editingRecord.id;
      } else {
        const created = await dikeRevetmentCRUD.create(payload);
        savedId = created.id;
      }

      // ── Xử lý file đính kèm NGAY khi hồ sơ còn ở trạng thái cho phép sửa, TRƯỚC khi gửi/duyệt:
      //    chuẩn /vts-operation-center — sau khi vào vòng duyệt (PENDING_APPROVAL) backend khóa mọi thay đổi. ──
      if (savedId) {
        // Xóa file đã lưu đã đánh dấu — qua endpoint entity để ghi nhật ký 'Tài liệu đính kèm' (ATTACHMENT_DELETED)
        if (pendingDeletedAttachments.length > 0) {
          const deletionResults = await Promise.allSettled(
            pendingDeletedAttachments.map((d) => api.delete(`/v1/dike-revetment/${savedId}/attachments/${d.id}`)),
          );
          if (deletionResults.some((result) => result.status === 'rejected')) {
            toast.warning('Đã lưu thông tin nhưng một số tệp đính kèm chưa được xóa');
          }
        }
        // Tải file mới (chuẩn /port)
        if (uploadFileList.length > 0) {
          let uploaded = 0;
          for (const f of uploadFileList) {
            if (!f.originFileObj) continue; // skip existing attachments
            try {
              const formData = new FormData();
              formData.append('files', f.originFileObj as File);
              await api.post(`/v1/dike-revetment/${savedId}/attachments`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
              uploaded++;
            } catch { /* non-blocking */ }
          }
          if (uploaded > 0) toast.success(`Đã tải lên ${uploaded} tệp đính kèm`);
        }
      }

      if (editingRecord && savedId) {
        if (action === 'submit') {
          // Sửa hồ sơ DRAFT/REJECTED_LEVEL1/REJECTED_LEVEL2 rồi gửi (lại) duyệt → vòng 1.
          await dikeRevetmentApproval.submitForApproval(savedId);
          toast.success('Lưu và gửi phê duyệt đê kè thành công');
        } else if (action === 'approve') {
          toast.success('Lưu và phê duyệt đê kè thành công');
        } else {
          toast.success('Lưu tạm đê kè thành công');
        }
      } else if (savedId) {
        if (action === 'submit') {
          await dikeRevetmentApproval.submitForApproval(savedId);
          toast.success('Lưu và gửi phê duyệt đê kè thành công');
        } else if (action === 'approve') {
          // Tạo + duyệt thẳng: submit (đơn vị cấp Cục được vào thẳng Chờ Cục duyệt)
          // rồi duyệt cấp Cục để hồ sơ ĐÃ DUYỆT.
          const sent = await dikeRevetmentApproval.submitForApproval(savedId);
          if (sent?.approvalStatus === 'APPROVED_LEVEL1') {
            await dikeRevetmentApproval.approveC2(savedId);
          } else {
            await dikeRevetmentApproval.approveC1(savedId);
            await dikeRevetmentApproval.approveC2(savedId);
          }
          toast.success('Lưu và phê duyệt đê kè thành công');
        } else {
          toast.success('Lưu tạm đê kè thành công');
        }
      }

      setDrawerVisible(false);
      setEditingRecord(null);
      setUploadFileList([]);
      setPendingDeletedAttachments([]);
      fetchData();
      fetchTabCounts();
    } catch (err) {
      if ((err as any)?.errorFields) return; // validation errors handled by Form
      toast.error(err instanceof Error ? err.message : 'Lỗi lưu dữ liệu');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────
  const openDeleteModal = useCallback((record: DikeRevetmentResponse) => {
    setDeletingRecord(record);
    setDeleteConfirmText('');
    setDeleteModalOpen(true);
  }, []);

  const confirmDelete = async () => {
    if (!deletingRecord) return;
    const expected = deletingRecord.dikeRevetmentName || deletingRecord.code || '';
    const confirmText = deleteConfirmText.trim();
    if (confirmText.toUpperCase() !== 'XÓA' && confirmText.toLowerCase() !== expected.toLowerCase()) {
      message.error('Vui lòng nhập đúng tên công trình hoặc gõ XÓA để xác nhận');
      return;
    }
    try {
      await dikeRevetmentCRUD.delete(deletingRecord.id);
      toast.success('Xóa đê kè thành công');
      setDeleteModalOpen(false);
      setDeletingRecord(null);
      setDeleteConfirmText('');
      fetchData();
      fetchTabCounts();
    } catch (err) {
      // Lỗi đã được api.ts interceptor hiển thị — không toast trùng
      setDeleteModalOpen(false);
      setDeletingRecord(null);
    }
  };

  // ── Approval ────────────────────────────────────────────────────
  const openSubmitModal = useCallback((record: DikeRevetmentResponse) => {
    setSubmittingRecord(record);
    setSubmitModalOpen(true);
  }, []);

  const confirmSubmit = async () => {
    if (!submittingRecord) return;
    try {
      await dikeRevetmentApproval.submitForApproval(submittingRecord.id);
      toast.success('Đã gửi phê duyệt đê kè');
      setSubmitModalOpen(false);
      setSubmittingRecord(null);
      fetchData();
      fetchTabCounts();
    } catch (err) {
      // Lỗi đã được api.ts interceptor hiển thị — không toast trùng
      setSubmitModalOpen(false);
      setSubmittingRecord(null);
    }
  };

  const openApproveModal = useCallback((record: DikeRevetmentResponse) => {
    setApprovingRecord(record);
    setApproveModalOpen(true);
  }, []);

  const confirmApprove = async (content?: string) => {
    if (!approvingRecord) return;
    try {
      const note = content?.trim() || undefined;
      // Cấp duyệt theo trạng thái hồ sơ: PENDING_APPROVAL → C1 (Cảng vụ/Chi cục),
      // APPROVED_LEVEL1 → C2 (Cục).
      const isLevel2 = approvingRecord.approvalStatus === 'APPROVED_LEVEL1';
      if (isLevel2) {
        await dikeRevetmentApproval.approveC2(approvingRecord.id, note);
      } else {
        await dikeRevetmentApproval.approveC1(approvingRecord.id, note);
      }
      toast.success(isLevel2 ? 'Phê duyệt cấp Cục thành công' : 'Phê duyệt cấp Cảng vụ/Chi cục thành công');
      setApproveModalOpen(false);
      setApprovingRecord(null);
      fetchData();
      fetchTabCounts();
    } catch (err) {
      // Lỗi đã được api.ts interceptor hiển thị (showUniqueError) — không toast trùng
      setApproveModalOpen(false);
      setApprovingRecord(null);
    }
  };

  const openRejectModal = useCallback((record: DikeRevetmentResponse) => {
    setRejectingRecord(record);
    setRejectReason('');
    setRejectModalOpen(true);
  }, []);

  const confirmReject = async () => {
    if (!rejectingRecord) return;
    if (rejectReason.trim().length < 10) {
      message.error('Lý do từ chối phải có tối thiểu 10 ký tự');
      return;
    }
    try {
      // Cấp từ chối theo trạng thái hồ sơ: vòng 1 → REJECTED_LEVEL1, vòng 2 → REJECTED_LEVEL2.
      const isLevel2 = rejectingRecord.approvalStatus === 'APPROVED_LEVEL1';
      if (isLevel2) {
        await dikeRevetmentApproval.rejectC2(rejectingRecord.id, rejectReason.trim());
      } else {
        await dikeRevetmentApproval.rejectC1(rejectingRecord.id, rejectReason.trim());
      }
      toast.success(isLevel2 ? 'Đã từ chối cấp Cục' : 'Đã từ chối cấp Cảng vụ/Chi cục');
      setRejectModalOpen(false);
      setRejectingRecord(null);
      setRejectReason('');
      fetchData();
      fetchTabCounts();
    } catch (err) {
      // Lỗi đã được api.ts interceptor hiển thị — không toast trùng
      setRejectModalOpen(false);
      setRejectingRecord(null);
      setRejectReason('');
    }
  };

  // ── History ──────────────────────────────────────────────────────
  const openHistoryModal = useCallback(async (record: DikeRevetmentResponse) => {
    setHistoryTarget(record);
    setHistoryRecords([]);
    setHistorySearchInput('');
    setHistorySearch('');
    setHistoryFrom('');
    setHistoryTo('');
    setHistoryOpen(true);
    setHistoryLoading(false);
    setLoadingMoreHistory(false);
    setHasMoreHistory(true);
    setHistoryPage(0);
  }, []);

  const HISTORY_PAGE_SIZE = 20;

  const historyTimestamp = (item: any): string => item.approvedDate || item.changedAt || item.createdAt || '';
  const historyField = (item: any): string => item.changedField || item.fieldName || '';
  const historyOldValue = (item: any): string | null => item.previousValue ?? item.oldValue ?? null;
  const historyNewValue = (item: any): string | null => item.newValue ?? null;
  const historyActor = (item: any): string => { const raw = item?.approvedBy || item?.changedBy || ''; return raw || '—'; };
  // Render giá trị thay đổi đẹp như /vts-system: tọa độ → DMS, enum/trạng thái/biểu tượng → tên tiếng Việt
  const renderHistoryValue = (field: string, raw: string | null): React.ReactNode => {
    if (raw === null || raw === undefined || raw === '' || raw === '—' || raw === '(null)' || raw === '(trống)' || raw === 'null' || raw === 'Chưa có' || raw === 'Chua co') {
      return <span style={{ color: textTertiary }}>—</span>;
    }
    const norm = field.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
    if (norm.includes('toa do') || norm.includes('coordinates')) return renderCoordinatesDisplay(raw);
    if (norm.includes('phe duyet') || norm.includes('approval')) return DIKE_REVETMENT_STATUS_LABELS[raw] || raw;
    if (norm.includes('tinh trang') || norm === 'status' || norm.includes('conditionstatus')) {
      const st = OPERATIONAL_STATUS_STYLE_MAP[raw];
      return st ? st.label : raw;
    }
    if (norm.includes('loai ket cau') || (norm.includes('dike') && norm.includes('type'))) return (DIKE_REVETMENT_TYPE_MAP as Record<string, string>)[raw] || raw;
    if (norm.includes('geometry') || norm.includes('loai doi tuong')) {
      const m: Record<string, string> = { POINT: 'Đối tượng điểm', LINE: 'Đối tượng đường', POLYGON: 'Đối tượng vùng' };
      return m[String(raw).toUpperCase()] || raw;
    }
    if (norm.includes('symbol') || norm.includes('bieu tuong')) {
      const sym = symbols.find((s) => s.id === raw || s.code === raw || String(s.id) === String(raw));
      return sym ? (sym.code ? `${sym.name} (${sym.code})` : sym.name) : raw;
    }
    if (norm.includes('operatingunit') || norm.includes('don vi van hanh') || norm.includes('don vi khai thac')) {
      return operatingUnitNameById(raw);
    }
    if (String(raw).toLowerCase() === 'true') return 'Có';
    if (String(raw).toLowerCase() === 'false') return 'Không';
    return raw;
  };
  const resolveHistoryActionMeta = (item: any): { label: string; color: string; bg: string } => {
    const rawStatus = String(item?.status ?? item?.action ?? '').toUpperCase();
    const rawReason = String(item?.reason ?? item?.ghiChu ?? item?.note ?? '').toLowerCase();
    const level = Number(item?.approvalLevel || 0);

    if (rawStatus === 'CREATED' || rawStatus === 'CREATE' || rawReason.includes('tạo mới') || rawReason.includes('thêm mới') || rawReason.includes('tao moi') || rawReason.includes('them moi')) {
      return { label: 'Thêm mới', color: '#1BAF7A', bg: '#1BAF7A18' };
    }
    if (rawStatus === 'ATTACHMENT_UPLOADED' || rawReason.includes('tải lên') || rawReason.includes('tai len') || String(item?.changedField || '').includes('đính kèm')) {
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
      return { label: 'Phê duyệt cấp Cục', color: '#1BAF7A', bg: '#1BAF7A18' };
    }
    if (rawReason.includes('từ chối cấp cảng vụ') || rawReason.includes('tu choi cap cang vu')) {
      return { label: 'Từ chối cấp Cảng vụ', color: '#E34948', bg: '#E3494818' };
    }
    if (rawReason.includes('từ chối cấp cục') || rawReason.includes('tu choi cap cuc')) {
      return { label: 'Từ chối cấp Cục', color: '#E34948', bg: '#E3494818' };
    }
    if (rawStatus === 'REJECTED' || rawStatus === 'REJECT' || rawReason.includes('từ chối') || rawReason.includes('tu choi') || rawReason.includes('trả về') || rawReason.includes('tra ve')) {
      return { label: level === 1 ? 'Từ chối cấp Cảng vụ' : (level === 2 ? 'Từ chối cấp Cục' : 'Từ chối'), color: '#E34948', bg: '#E3494818' };
    }
    if (level === 1 || String(item?.approvalLevel || '').includes('LEVEL_1')) {
      return { label: 'Phê duyệt cấp Cảng vụ', color: '#13C2C2', bg: '#13C2C218' };
    }
    if (level === 2 || String(item?.approvalLevel || '').includes('LEVEL_2') || rawStatus === 'APPROVED' || rawStatus === 'APPROVE') {
      return { label: 'Phê duyệt cấp Cục', color: '#1BAF7A', bg: '#1BAF7A18' };
    }
    if (rawStatus === 'PROPOSED' || rawStatus === 'PENDING_APPROVAL' || rawReason.includes('gửi phê duyệt') || rawReason.includes('gui phe duyet') || rawReason.includes('chờ duyệt') || rawReason.includes('luu tam')) {
      return { label: 'Trình duyệt', color: '#EDA100', bg: '#EDA10018' };
    }
    if (rawStatus === 'DELETED' || rawStatus === 'SOFT_DELETE' || rawReason.includes('xóa mềm')) {
      return { label: 'Xóa mềm', color: '#E34948', bg: '#E3494818' };
    }
    return { label: 'Cập nhật', color: actionPrimary, bg: `${actionPrimary}18` };
  };

  useEffect(() => {
    if (!historyOpen || !historyTarget) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setHistoryLoading(true);
      setLoadingMoreHistory(false);
      setHasMoreHistory(true);
      setHistoryRecords([]);
      setHistoryPage(0);
      try {
        const hist = await dikeRevetmentApproval.getHistory(historyTarget.id, 0, HISTORY_PAGE_SIZE, {
          keyword: historySearch,
          fromDate: historyFrom,
          toDate: historyTo,
        });
        if (cancelled) return;
        const items = hist || [];
        setHistoryRecords(items);
        setHasMoreHistory(items.length === HISTORY_PAGE_SIZE);
      } catch (err) {
        if (!cancelled) toast.error(err instanceof Error ? err.message : 'Không tải được lịch sử');
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    }, historySearch.trim() ? 300 : 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [historyOpen, historyTarget, historySearch, historyFrom, historyTo]);

  const loadMoreHistory = async () => {
    if (!historyTarget || historyLoading || loadingMoreHistory || !hasMoreHistory) return;
    setLoadingMoreHistory(true);
    try {
      const nextPage = historyPage + 1;
      const hist = await dikeRevetmentApproval.getHistory(historyTarget.id, nextPage, HISTORY_PAGE_SIZE, {
        keyword: historySearch,
        fromDate: historyFrom,
        toDate: historyTo,
      });
      if (hist && hist.length > 0) setHistoryRecords((prev) => [...prev, ...hist]);
      setHistoryPage(nextPage);
      setHasMoreHistory((hist || []).length === HISTORY_PAGE_SIZE);
    } catch { /* ignore */ } finally { setLoadingMoreHistory(false); }
  };

  const handleHistoryScroll = (e: any) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 30) loadMoreHistory();
  };

  const renderHistoryTimeline = (records: any[]) => {
    if (!records || records.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
          <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
          <div style={{ color: textTertiary, fontSize: fontSizeMd }}>{historySearch || historyFrom || historyTo ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận'}</div>
        </div>
      );
    }
    const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000);
    const sorted = [...records].sort((a: any, b: any) => new Date(historyTimestamp(b) || 0).getTime() - new Date(historyTimestamp(a) || 0).getTime());

    const isUpdateAction = (status: string, reason?: string) => {
      const s = String(status || '').toUpperCase();
      const r = String(reason || '').toLowerCase();
      return s === 'UPDATED' || s === 'UPDATE' || s === 'EDIT' || s === 'ATTACHMENT_UPLOADED' || s === 'ATTACHMENT_DELETED'
        || r.includes('cập nhật') || r.includes('chỉnh sửa') || r.includes('tải lên') || r.includes('xóa tệp') || r.includes('xóa tài liệu');
    };

    // Gộp theo ĐÚNG giây + người thực hiện; các dòng UPDATED cùng lúc được gộp chung 1 nhóm
    const groups: { tsSec: number; ts: string; actor: string; status?: any; approvalLevel?: any; items: any[] }[] = [];
    for (const r of sorted) {
      const ts = historyTimestamp(r);
      const sec = ts ? toSec(ts) : 0;
      const prev = groups[groups.length - 1];
      const actor = historyActor(r);
      const isBothUpdate = prev && isUpdateAction(prev.status, prev.items[0]?.reason) && isUpdateAction(r.status, r.reason);
      const isSameGroup = prev && prev.tsSec === sec && prev.actor === actor && (prev.status === r.status || isBothUpdate);
      if (isSameGroup) {
        prev.items.push(r);
      } else {
        groups.push({ tsSec: sec, ts, actor, status: r.status, approvalLevel: r.approvalLevel, items: [r] });
      }
    }
    const fmtTime = (ts: string) => { const d = new Date(ts); return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`; };
    return (
      <div>
        {groups.map((g, gi) => {
          const rec0 = g.items[0] || {};
          const actionMeta = resolveHistoryActionMeta(rec0);
          const rawUnit = rec0.orgUnitName || rec0.unitName;
          const unitName = rawUnit && rawUnit !== '—' ? rawUnit : 'Cục Hàng hải Việt Nam';
          const changes = g.items
            .map((item) => ({ field: historyField(item) || '', oldValue: historyOldValue(item), newValue: historyNewValue(item) }))
            .filter((c: any) => c.field !== '' || (c.oldValue != null && c.oldValue !== '') || (c.newValue != null && c.newValue !== ''))
            .filter((c: any) => {
              const ov = c.oldValue != null ? String(c.oldValue).trim() : '';
              const nv = c.newValue != null ? String(c.newValue).trim() : '';
              if (ov === '' && nv === '') return false;
              if (ov !== '' && nv !== '' && ov === nv) return false;
              return true;
            });
          if (changes.length === 0) return null;
          const reasons = g.items.map((i: any) => i.reason || i.ghiChu || i.note).filter(Boolean);
          const renderHistoryContent = (field: string, val: string | null): React.ReactNode => {
            if (val === null || val === undefined || val === '' || val === '(null)' || val === '—') {
              return <span style={{ color: textTertiary }}>—</span>;
            }
            const nk = field.toLowerCase();
            if (nk.includes('toa do') || nk.includes('coordinates')) return renderCoordinatesDisplay(val);
            const str = String(val).trim();
            const sv = str.toUpperCase();
            if (sv.startsWith('POINT') || sv.startsWith('LINESTRING') || sv.startsWith('POLYGON') || sv.startsWith('MULTIPOINT')) {
              return renderCoordinatesDisplay(str);
            }
            if (str.includes(',') && str.length > 25) {
              const items = str.split(',').map((s) => s.trim()).filter(Boolean);
              if (items.length > 1) {
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
                    {items.map((item, idx) => (
                      <div key={idx} style={{ color: textPrimary, fontWeight: fontWeightMedium, lineHeight: '20px', wordBreak: 'break-word' }}>{item}</div>
                    ))}
                  </div>
                );
              }
            }
            return renderHistoryValue(field, val);
          };
          return (
            <div key={`${gi}-${g.ts}-${g.actor}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(310px, 0.38fr) minmax(0, 1fr)', gap: themeTokenChk.spaceLg, alignItems: 'start', marginBottom: gi < groups.length - 1 ? spaceMd : 0 }}>
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

              <div style={{ position: 'relative', minWidth: 0, background: themeTokenChk.surfacePage, borderRadius: themeTokenChk.radiusSm, padding: `${spaceMd}px ${themeTokenChk.spaceLg}px`, overflow: 'hidden', border: `1px solid ${borderDefault}` }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: spaceXs, background: `linear-gradient(180deg, ${actionMeta.color} 0%, ${actionMeta.color}40 100%)` }} />
                <Typography.Text style={{ display: 'block', color: colors.sidebarBg, fontSize: fontSizeMd, fontWeight: fontWeightBold, marginBottom: spaceSm }}>
                  Thông tin thay đổi:
                </Typography.Text>
                {changes.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: spaceSm }}>
                    {changes.map((c: any, ri: number) => (
                      <div key={`${c.field}-${ri}`} style={{ display: 'grid', gridTemplateColumns: '170px minmax(100px, 1fr) 24px minmax(100px, 1fr)', alignItems: 'flex-start', gap: spaceSm, fontSize: fontSizeMd, lineHeight: 1.6, padding: '3px 0' }}>
                        <div style={{ fontWeight: fontWeightMedium, color: textSecondary, overflowWrap: 'break-word' }}>{c.field ? `${historyFieldName(c.field)}:` : '—'}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, overflowWrap: 'break-word', color: textPrimary }}>
                          {renderHistoryContent(c.field, c.oldValue)}
                        </div>
                        <div style={{ color: textTertiary, textAlign: 'center', fontWeight: fontWeightBold, userSelect: 'none', paddingTop: 2 }}>→</div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, overflowWrap: 'break-word', color: textPrimary }}>
                          {renderHistoryContent(c.field, c.newValue)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : reasons.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: spaceXs }}>
                    {reasons.map((r: string, ri: number) => (
                      <div key={ri} style={{ fontSize: fontSizeMd, color: textPrimary }}>{r}</div>
                    ))}
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
  };

  // ── Columns & row actions ────────────────────────────────────────
  // Khớp 100% sheet QL đê kè — cột "Danh sách" = ✓, đúng thứ tự sheet:
  // Mã, Tên, Đơn vị QL, Cảng biển, Địa điểm, Loại kết cấu, Tình trạng,
  // Thời điểm khai thác, Ngày cập nhật, Cán bộ cập nhật, Trạng thái phê duyệt
  const columns = useMemo(() => [
    {
      key: 'sequenceNo',
      label: 'STT',
      width: 60,
      fixed: 'left' as const,
      align: 'center' as const,
      render: (_: any, __: any, index?: number) => (
        <span style={{ color: textSecondary, fontWeight: fontWeightMedium }}>{(index ?? 0) + 1}</span>
      ),
    },
    {
      key: 'codeAndName',
      label: <span>Tên/Mã đê kè</span>,
      dataIndex: 'dikeRevetmentName',
      width: 350,
      fixed: 'left' as const,
      render: (_: any, record: DikeRevetmentResponse) => (
        <div>
          <a
            title={record.dikeRevetmentName || ''}
            onClick={() => openDetailDrawer(record)}
            style={{ ...cellTitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {record.dikeRevetmentName || '—'}
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
      render: (val: string | undefined, record: DikeRevetmentResponse) => (
        <span
          title={val || record.orgUnitId || ''}
          style={{ fontWeight: fontWeightBold, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {val || record.orgUnitId || '—'}
        </span>
      ),
    },
    {
      key: 'seaportName',
      label: 'Thuộc cảng biển',
      dataIndex: 'seaportName',
      width: 170,
      render: (val: string | undefined, record: DikeRevetmentResponse) => val || record.seaportId || '',
    },
    {
      key: 'location',
      label: 'Địa điểm (Tỉnh/TP)',
      dataIndex: 'location',
      width: 190,
      render: (val: string) => val || '',
    },
    {
      key: 'dikeRevetmentType',
      label: 'Loại kết cấu công trình',
      dataIndex: 'dikeRevetmentType',
      width: 220,
      render: (val: string) => <span style={{ fontWeight: fontWeightMedium }}>{DIKE_REVETMENT_TYPE_MAP[val] || val || ''}</span>,
    },
    {
      key: 'status',
      label: 'Tình trạng',
      dataIndex: 'status',
      width: 220,
      render: (val: string) => {
        if (!val) return '';
        const st = OPERATIONAL_STATUS_STYLE_MAP[val];
        return st ? <span style={statusBadgeStyle(st.color)}>{st.label}</span> : val;
      },
    },
    {
      key: 'commissioningDate',
      label: 'Thời điểm đưa vào khai thác',
      dataIndex: 'commissioningDate',
      width: 250,
      render: (val: string) => formatYear(val),
    },
    {
      key: 'updatedBy',
      label: 'Cán bộ cập nhật',
      dataIndex: 'updatedByName',
      width: 210,
      render: (val: string, record: DikeRevetmentResponse) => (
        <div>
          <span title={val} style={{ ...cellTitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val || '—'}</span>
          <span style={{ ...cellSubtitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatDate(record.updatedAt)}</span>
        </div>
      ),
    },
    ...(isElevatedOrg ? [
      {
        key: 'submittedByName',
        label: 'Cán bộ gửi phê duyệt',
        dataIndex: 'submittedByName',
        width: 230,
        render: (val: string, record: DikeRevetmentResponse) => (
          <div>
            <span title={val} style={{ ...cellTitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val || '—'}</span>
            <span style={{ ...cellSubtitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatDate(record.submittedAt)}</span>
          </div>
        ),
      },
      {
        key: 'approvedByNameLevel1',
        label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục',
        dataIndex: 'approvedByNameLevel1',
        width: 260,
        render: (v: string, r: DikeRevetmentResponse) => (
          <div>
            <span title={v || r.approverLevel1 || ''} style={{ ...cellTitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || r.approverLevel1 || '—'}</span>
            <span style={{ ...cellSubtitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatDate(r.approvedDateLevel1)}</span>
          </div>
        ),
      },
      {
        key: 'approvedByNameLevel2',
        label: 'Cán bộ phê duyệt cấp Cục',
        dataIndex: 'approvedByNameLevel2',
        width: 240,
        render: (v: string, r: DikeRevetmentResponse) => (
          <div>
            <span title={v || r.approverLevel2 || ''} style={{ ...cellTitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || r.approverLevel2 || '—'}</span>
            <span style={{ ...cellSubtitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatDate(r.approvedDateLevel2)}</span>
          </div>
        ),
      },
    ] : []),
    {
      key: 'approvalStatus',
      label: 'Trạng thái phê duyệt',
      dataIndex: 'approvalStatus',
      width: 160,
      render: (status: string) => <ApprovalStatusBadge status={status} labelOverrides={DIKE_REVETMENT_STATUS_LABELS} />,
    },
  ], [openDetailDrawer, isElevatedOrg]);

  const rowActions = useCallback((record: DikeRevetmentResponse) => {
    const actions: any[] = [];
    const canRead = hasPerm('dikerevetment:read');
    const canUpdate = hasPerm('dikerevetment:update');
    const canDelete = hasPerm('dikerevetment:delete');
    const isDraft = record.approvalStatus === 'DRAFT';
    const isRejectedL1 = record.approvalStatus === 'REJECTED_LEVEL1';
    const isRejectedL2 = record.approvalStatus === 'REJECTED_LEVEL2';
    const isPendingC1 = record.approvalStatus === 'PENDING_APPROVAL';
    const isPendingC2 = record.approvalStatus === 'APPROVED_LEVEL1';

    if (canRead) {
      actions.push({
        key: 'detail',
        label: 'Xem chi tiết',
        icon: themeTokenChk.icons.view,
        onClick: () => openDetailDrawer(record),
      });
    }
    // Quy tắc 12 (approval-2-level-spec.md mục 3.9)
    if (canEditApprovalRecord(record.approvalStatus, { hasPerm, resource: 'dikerevetment' })) {
      actions.push({
        key: 'edit',
        label: 'Chỉnh sửa',
        icon: themeTokenChk.icons.edit,
        onClick: () => openEditDrawer(record),
      });
    }
    // Lịch sử thay đổi.
    if (canRead) {
      actions.push({
        key: 'history',
        label: 'Lịch sử',
        icon: themeTokenChk.icons.history,
        onClick: () => openHistoryModal(record),
      });
    }
    // Gửi duyệt: từ Lưu tạm hoặc sau khi bị trả về (sửa xong gửi lại vòng 1).
    if (canUpdate && (isDraft || isRejectedL1 || isRejectedL2)) {
      actions.push({
        key: 'submit',
        label: 'Gửi duyệt',
        icon: themeTokenChk.icons.submit,
        onClick: () => openSubmitModal(record),
      });
    }
    // Vòng 1 — Cảng vụ/Chi cục duyệt hồ sơ Chờ Cảng vụ duyệt.
    if (canApproveC1 && isPendingC1) {
      actions.push({
        key: 'approveC1',
        label: 'Phê duyệt',
        icon: themeTokenChk.icons.approve,
        onClick: () => openApproveModal(record),
      });
    }
    if (canApproveC1 && isPendingC1) {
      actions.push({
        key: 'rejectC1',
        label: 'Từ chối',
        icon: themeTokenChk.icons.reject,
        danger: true,
        onClick: () => openRejectModal(record),
      });
    }
    // Vòng 2 — Cục duyệt hồ sơ Chờ Cục duyệt.
    if (canApproveC2 && isPendingC2) {
      actions.push({
        key: 'approveC2',
        label: 'Phê duyệt',
        icon: themeTokenChk.icons.approve,
        onClick: () => openApproveModal(record),
      });
    }
    if (canApproveC2 && isPendingC2) {
      actions.push({
        key: 'rejectC2',
        label: 'Từ chối',
        icon: themeTokenChk.icons.reject,
        danger: true,
        onClick: () => openRejectModal(record),
      });
    }
    // Quy tắc 11 (approval-2-level-spec.md 3.6): chỉ xóa được hồ sơ Lưu tạm.
    if (canDelete && isDraft) {
      actions.push({
        key: 'delete',
        label: 'Xóa',
        icon: themeTokenChk.icons.delete,
        danger: true,
        onClick: () => openDeleteModal(record),
      });
    }
    return actions;
  }, [hasPerm, canApproveC1, canApproveC2, openDetailDrawer, openEditDrawer, openSubmitModal, openApproveModal, openRejectModal, openDeleteModal, openHistoryModal]);

  // ── Filter content (sidebar) ─────────────────────────────────────
  // Bộ lọc theo sheet QL đê kè: mặc định = Đơn vị quản lý + Tên đê kè (+ Trạng thái phê duyệt = StatusTabs),
  // nâng cao (ẩn/hiện) = Mã đê kè, Thuộc cảng biển, Địa điểm, Loại kết cấu, Tình trạng, Thời điểm khai thác, Ngày cập nhật
  const filterContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spaceMd }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: spaceXs, marginTop: spaceMd }}>
      <span style={filterLabelStyle}>Đơn vị quản lý</span>
      <TreeSelect
        placeholder="Tất cả"
        treeData={buildOrgTree(organizations)}
        showSearch
        treeNodeFilterProp="title"
        treeDefaultExpandAll
        value={filterUnitId}
        onChange={(val) => setFilterUnitId(val)}
        allowClear
        style={selectStyle}
      />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: spaceXs }}>
      <span style={filterLabelStyle}>Tên đê kè</span>
      <Input
        placeholder="Tìm theo tên đê kè"
        allowClear
        value={filterName}
        onChange={(e) => setFilterName(e.target.value)}
        onPressEnter={() => { setPage(1); fetchData(); }}
        style={filterInputStyle}
      />
    </div>

      {filterCollapsed && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spaceXs }}>
            <span style={filterLabelStyle}>Mã đê kè</span>
            <Input
              placeholder="Tìm theo mã đê kè"
              allowClear
              value={filterCode}
              onChange={(e) => setFilterMa(e.target.value)}
              onPressEnter={() => { setPage(1); fetchData(); }}
              style={filterInputStyle}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spaceXs }}>
            <span style={filterLabelStyle}>Thuộc cảng biển</span>
            <Select
              placeholder="Chọn cảng biển"
              options={seaports.map((p) => ({ value: p.id, label: p.portName || p.portCode || p.id }))}
              value={filterSeaportId}
              onChange={(val) => setFilterCangBienId(val)}
              allowClear
              showSearch
              optionFilterProp="label"
              style={selectStyle}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spaceXs }}>
            <span style={filterLabelStyle}>Địa điểm (Tỉnh/TP)</span>
            <Select
              placeholder="Chọn tỉnh/thành phố"
              options={VIETNAM_PROVINCE_OPTIONS.map((p) => ({ value: p.label, label: p.label }))}
              value={filterLocation}
              onChange={(val) => setFilterLocation(val)}
              allowClear
              showSearch
              optionFilterProp="label"
              style={selectStyle}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spaceXs }}>
            <span style={filterLabelStyle}>Loại kết cấu công trình</span>
            <Select
              placeholder="Chọn loại kết cấu"
              options={DIKE_REVETMENT_TYPE_OPTIONS}
              value={filterType}
              onChange={(val) => setFilterType(val)}
              allowClear
              style={selectStyle}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spaceXs }}>
            <span style={filterLabelStyle}>Tình trạng</span>
            <Select
              placeholder="Chọn tình trạng"
              options={OPERATIONAL_STATUS_OPTIONS}
              value={filterStatusVal}
              onChange={(val) => setFilterStatusVal(val)}
              allowClear
              style={selectStyle}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spaceXs }}>
            <span style={filterLabelStyle}>Thời điểm đưa vào khai thác</span>
            <DatePicker
              picker="year"
              placeholder="Chọn năm..."
              value={filterCommissioningYear ? dayjs(filterCommissioningYear) : null}
              onChange={(d) => setFilterCommissioningYear(d ? d.format('YYYY') : undefined)}
              style={selectStyle}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spaceXs }}>
            <span style={filterLabelStyle}>Ngày cập nhật</span>
            <DatePicker.RangePicker
              placeholder={['Từ ngày', 'Đến ngày']}
              value={filterUpdatedRange}
              onChange={(range) => setFilterUpdatedRange(range)}
              style={selectStyle}
            />
          </div>
        </>
      )}
    </div>
  );

  // ── Detail tabs (format chuẩn màn /beacon-stations) ───────────────
  // DetailRow + renderDetailRows + renderSectionHeader (chuẩn /vts-operation-center)
  type DetailRow = { label: string; value: React.ReactNode; fullWidth?: boolean };

  const renderDetailRows = (rows: DetailRow[], paddingTop = spaceMd) => (
    <div className="chk-detail-grid" style={{ paddingTop }}>
      {rows.map((row) => {
        // Trường full-width (Tên...) hoặc nội dung >= 100 ký tự → chiếm trọn bề ngang & wrap khi dài
        const textValue = typeof row.value === 'string' ? row.value : '';
        const isLong = row.fullWidth === true || textValue.length >= 100;
        return (
          <div key={row.label} className={isLong ? 'chk-detail-row chk-detail-row--full' : 'chk-detail-row'}>
            <span className="chk-detail-label">{row.label}</span>
            <span className="chk-detail-value" style={isLong ? { overflowWrap: 'anywhere', wordBreak: 'break-word' } : undefined}>{row.value}</span>
          </div>
        );
      })}
    </div>
  );

  // Section header chuẩn /vts-operation-center: divider + vạch accent + chữ in hoa
  const renderSectionHeader = (title: string) => (
    <div style={{ marginTop: 20, marginBottom: 12, borderTop: `1px solid ${borderDefault}`, paddingTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ display: 'inline-block', width: 4, height: 16, borderRadius: 2, backgroundColor: actionPrimary }} />
      <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
        {title}
      </span>
    </div>
  );

  const detailBasicRows: DetailRow[] = detailRecord ? [
    { label: 'Mã đê kè', value: detailRecord.code ?? '' },
    { label: 'Tên đê kè', value: detailRecord.dikeRevetmentName ?? '', fullWidth: true },
    { label: 'Đơn vị quản lý', value: detailRecord.orgUnitName || detailRecord.orgUnitId || '' },
    { label: 'Thuộc cảng biển', value: detailRecord.seaportName || detailRecord.seaportId || '' },
    { label: 'Đơn vị vận hành', value: operatingUnitNameById(detailRecord.operatingUnitId) },
    { label: 'Địa điểm (Tỉnh/TP)', value: detailRecord.location ?? '' },
    { label: 'Địa điểm chi tiết', value: detailRecord.locationDetail ?? '' },
    { label: 'Loại kết cấu công trình', value: detailRecord.dikeRevetmentType ? (DIKE_REVETMENT_TYPE_MAP[detailRecord.dikeRevetmentType] || detailRecord.dikeRevetmentType) : '' },
    {
      label: 'Tình trạng',
      value: detailRecord.status
        ? (() => {
            const st = OPERATIONAL_STATUS_STYLE_MAP[detailRecord.status];
            return st ? <span style={statusBadgeStyle(st.color)}>{st.label}</span> : detailRecord.status;
          })()
        : '',
    },
    { label: 'Ghi chú', value: detailRecord.note ?? '' },
  ] : [];

  const detailTechRows: DetailRow[] = detailRecord ? [
    { label: 'Chiều dài (m)', value: detailRecord.length != null ? String(detailRecord.length) : '' },
    { label: 'Chiều cao (m)', value: detailRecord.height != null ? String(detailRecord.height) : '' },
    { label: 'Cao trình đỉnh (m)', value: detailRecord.crestElevation != null ? String(detailRecord.crestElevation) : '' },
  ] : [];

  const detailTimeRows: DetailRow[] = detailRecord ? [
    { label: 'Thời điểm xây dựng', value: formatDateOnly(detailRecord.constructionDate) },
    { label: 'Thời điểm đưa vào khai thác', value: formatYear(detailRecord.commissioningDate) },
    { label: 'Năm bảo trì gần nhất', value: detailRecord.lastMaintenanceYear ?? '' },
  ] : [];





  const detailOperationRows: { key: string; code: string; name: string; startDate: string; endDate: string }[] = detailRecord
    ? (detailRecord.operationPlanCode || detailRecord.operationPlanName || detailRecord.operationStartDate || detailRecord.operationEndDate)
      ? [{
          key: 'operation',
          code: detailRecord.operationPlanCode ?? '—',
          name: detailRecord.operationPlanName ?? '—',
          startDate: detailRecord.operationStartDate ?? '—',
          endDate: detailRecord.operationEndDate ?? '—',
        }]
      : []
    : [];

  const detailMaintenanceRows: { key: string; code: string; name: string; startDate: string; endDate: string }[] = detailRecord
    ? (detailRecord.maintenancePlanCode || detailRecord.maintenancePlanName || detailRecord.maintenanceStartDate || detailRecord.maintenanceEndDate)
      ? [{
          key: 'maintenance',
          code: detailRecord.maintenancePlanCode ?? '—',
          name: detailRecord.maintenancePlanName ?? '—',
          startDate: detailRecord.maintenanceStartDate ?? '—',
          endDate: detailRecord.maintenanceEndDate ?? '—',
        }]
      : []
    : [];

  const detailIncidentRows: { key: string; code: string; name: string; type: string; location: string; time: string }[] = detailRecord
    ? (detailRecord.incidentCode || detailRecord.incidentType || detailRecord.incidentLocation || detailRecord.incidentTime)
      ? [{
          key: 'incident',
          code: detailRecord.incidentCode ?? '—',
          name: detailRecord.incidentName ?? '—',
          type: detailRecord.incidentType ?? '—',
          location: detailRecord.incidentLocation ?? '—',
          time: detailRecord.incidentTime ?? '—',
        }]
      : []
    : [];

  // Khung cuộn chuẩn CHK từng tab-pane Xem chi tiết (điều vàng 2 — copy từ màn DetailContent: paddingTop 3 + overflowY auto + maxHeight calc(100vh - 290px))
  const detailPaneScrollStyle: React.CSSProperties = {
    paddingTop: 3,
    overflowY: 'auto',
    maxHeight: 'calc(100vh - 290px)',
  };


  const detailTabItems = detailRecord
    ? [
        {
          key: 'basic',
          label: 'Thông tin cơ bản',
          children: (
            <div style={detailPaneScrollStyle}>
              {renderDetailRows(detailBasicRows)}
              {renderSectionHeader('Thông tin kỹ thuật')}
              {renderDetailRows(detailTechRows)}
              {renderSectionHeader('Thông tin thời gian')}
              {renderDetailRows(detailTimeRows)}
            </div>
          ),
        },
        {
          key: 'gis',
          label: 'Thông tin vị trí',
          children: (
            <div style={detailPaneScrollStyle}>
              <div className="chk-detail-grid" style={{ marginBottom: 12 }}>
                <div className="chk-detail-row">
                  <span className="chk-detail-label">Loại đối tượng</span>
                  <span className="chk-detail-value">{detailRecord.geometryType === 'LINE' ? 'Đối tượng đường' : detailRecord.geometryType === 'POLYGON' ? 'Đối tượng vùng' : 'Đối tượng điểm'}</span>
                </div>
                <div className="chk-detail-row">
                  <span className="chk-detail-label">Biểu tượng bản đồ</span>
                  <span className="chk-detail-value">
                    {(() => {
                      const symId = detailRecord.symbolId;
                      const sym = symbols.find((s) => s.id === symId || (symId && String(s.id) === String(symId)));
                      if (sym) {
                        const imgSrc = sym.image
                          ? (sym.image.startsWith('data:') || sym.image.startsWith('http') || sym.image.startsWith('/')
                              ? sym.image
                              : `data:image/png;base64,${sym.image}`)
                          : undefined;
                        return (
                          <Space size={8} align="center" style={{ display: 'inline-flex', alignItems: 'center' }}>
                            {imgSrc
                              ? <img src={imgSrc} alt={sym.name || ''} style={{ width: 20, height: 20, objectFit: 'contain', verticalAlign: 'middle', display: 'inline-block' }} />
                              : <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: actionPrimary }} />}
                            <span>{sym.code ? `${sym.name} (${sym.code})` : sym.name}</span>
                          </Space>
                        );
                      }
                      return (
                        <Space size={8} align="center" style={{ display: 'inline-flex', alignItems: 'center' }}>
                          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: actionPrimary }} />
                          <span>{symId ? `Biểu tượng (${symId})` : '—'}</span>
                        </Space>
                      );
                    })()}
                  </span>
                </div>
                <div className="chk-detail-row"><span className="chk-detail-label">Hệ quy chiếu</span><span className="chk-detail-value">WGS-84</span></div>
                <div className="chk-detail-row"><span className="chk-detail-label">Quy tắc hiển thị</span><span className="chk-detail-value">Độ, phút, giây (DMS)</span></div>
              </div>
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
                <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px' }}>Tọa độ GPS</span>
                <Button type="primary" icon={<EnvironmentOutlined />} onClick={() => setGisViewOpen(true)}
                  style={{ ...primaryButtonStyle, height: 32, fontSize: fontSizeSm, padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  Xem vị trí trên bản đồ
                </Button>
              </div>
              <DetailTable
                dataSource={(detailRecord.coordinates ? parseWktToVertices(detailRecord.coordinates, detailRecord.geometryType || '') : []).map((p, i) => ({ key: i, latitude: p.lat, longitude: p.lng }))}
                emptyText="Chưa có tọa độ GPS nào"
                rowKey={(r) => String(r.key)}
                columns={[
                  { title: 'STT', width: 60, align: 'center', render: (_v, _r, i) => i + 1 },
                  { title: 'Vĩ độ (Latitude - N)', key: 'lat', render: (_v, r) => { const dms = ddToDms(r.latitude); return `${dms.d}° ${dms.m}' ${dms.s}" N`; } },
                  { title: 'Kinh độ (Longitude - E)', key: 'lng', render: (_v, r) => { const dms = ddToDms(r.longitude); return `${dms.d}° ${dms.m}' ${dms.s}" E`; } },
                ]}
              />
            </div>
          ),
        },
        {
          key: 'files',
          label: 'File đính kèm',
          children: (
            <InfrastructureAttachmentTab
              attachments={(detailRecord.attachments || []).map((a) => ({
                id: a.id,
                fileName: a.fileName,
                filePath: a.filePath || a.fileUrl,
                fileSize: a.fileSize,
                uploadedBy: a.uploadedBy,
                uploadedByName: a.uploadedBy,
                uploadedDate: a.uploadedDate || a.uploadDate,
              }))}
              readonly
              onDownload={handleDownloadAttachment}
            />
          ),
        },
        {
          key: 'operation',
          label: 'Vận hành & bảo trì',
          children: (
            <div style={detailPaneScrollStyle}>
              <Tabs
                defaultActiveKey="operation"
                tabBarStyle={{ marginBottom: 8 }}
                items={[
                  {
                    key: 'operation',
                    label: 'Thông tin vận hành khai thác',
                    children: (
                      <DetailTable
                        dataSource={detailOperationRows}
                        emptyText="Chưa có dữ liệu kế hoạch vận hành khai thác"
                        rowKey="key"
                        columns={[
                          { title: 'STT', width: 50 },
                          { title: 'Mã kế hoạch', dataIndex: 'code' },
                          { title: 'Tên kế hoạch', dataIndex: 'name' },
                          { title: 'Ngày bắt đầu', dataIndex: 'startDate' },
                          { title: 'Ngày kết thúc', dataIndex: 'endDate' },
                        ]}
                      />
                    ),
                  },
                  {
                    key: 'maintenance',
                    label: 'Thông tin bảo trì',
                    children: (
                      <DetailTable
                        dataSource={detailMaintenanceRows}
                        emptyText="Chưa có dữ liệu kế hoạch bảo trì"
                        rowKey="key"
                        columns={[
                          { title: 'STT', width: 50 },
                          { title: 'Mã kế hoạch', dataIndex: 'code' },
                          { title: 'Tên kế hoạch', dataIndex: 'name' },
                          { title: 'Ngày bắt đầu', dataIndex: 'startDate' },
                          { title: 'Ngày kết thúc', dataIndex: 'endDate' },
                        ]}
                      />
                    ),
                  },
                  {
                    key: 'incident',
                    label: 'Thông tin sự cố',
                    children: (
                      <DetailTable
                        dataSource={detailIncidentRows}
                        emptyText="Chưa có dữ liệu sự cố"
                        rowKey="key"
                        columns={[
                          { title: 'STT', width: 50 },
                          { title: 'Mã sự cố', dataIndex: 'code' },
                          { title: 'Tên sự cố', dataIndex: 'name' },
                          { title: 'Loại sự cố', dataIndex: 'type' },
                          { title: 'Địa điểm', dataIndex: 'location' },
                          { title: 'Thời gian', dataIndex: 'time' },
                        ]}
                      />
                    ),
                  },
                ]}
              />
            </div>
          ),
        },
        {
          key: 'system',
          label: 'Xử lý & theo dõi',
          children: (
            <div style={detailPaneScrollStyle}>
              <div className="chk-detail-grid">
                {[
                  { key: 'updatedAt', label: 'Ngày cập nhật', value: detailRecord.updatedAt ? formatDate(detailRecord.updatedAt) : '—' },
                  { key: 'updatedBy', label: 'Cán bộ cập nhật', value: detailRecord.updatedByName || detailRecord.updatedBy || '—' },
                  { key: 'submittedAt', label: 'Ngày gửi phê duyệt', value: detailRecord.submittedAt ? formatDate(detailRecord.submittedAt) : '—' },
                  { key: 'submittedBy', label: 'Cán bộ gửi phê duyệt', value: detailRecord.submittedByName || '—' },
                  { key: 'approvalContentLevel1', label: 'Nội dung phê duyệt cấp Cảng vụ/Chi cục', value: detailRecord.approvalContentLevel1 || '—', fullWidth: true },
                  { key: 'approvedDateLevel1', label: 'Ngày phê duyệt cấp Cảng vụ/Chi cục', value: detailRecord.approvedDateLevel1 ? formatDate(detailRecord.approvedDateLevel1) : '—' },
                  { key: 'approvedByLevel1', label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục', value: detailRecord.approvedByNameLevel1 || detailRecord.approverLevel1 || '—' },
                  { key: 'approvalContentLevel2', label: 'Nội dung phê duyệt cấp Cục', value: detailRecord.approvalContentLevel2 || '—', fullWidth: true },
                  { key: 'approvedDateLevel2', label: 'Ngày phê duyệt cấp Cục', value: detailRecord.approvedDateLevel2 ? formatDate(detailRecord.approvedDateLevel2) : '—' },
                  { key: 'approvedByLevel2', label: 'Cán bộ phê duyệt cấp Cục', value: detailRecord.approvedByNameLevel2 || detailRecord.approverLevel2 || '—' },
                  { key: 'rejectionReason', label: 'Lý do từ chối', value: detailRecord.rejectionReason || '—', fullWidth: true },
                  { key: 'approvalStatus', label: 'Trạng thái', value: <ApprovalStatusBadge status={detailRecord.approvalStatus} labelOverrides={DIKE_REVETMENT_STATUS_LABELS} />, fullWidth: true },
                ].map((row: { key: string; label: string; value: React.ReactNode; fullWidth?: boolean }) => (
                  <div key={row.key} className={row.fullWidth ? 'chk-detail-row chk-detail-row--full' : 'chk-detail-row'}>
                    <span className="chk-detail-label">{row.label}</span>
                    <span className="chk-detail-value">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ),
        },
      ]
    : [];

  // ── JSX ─────────────────────────────────────────────────────────
  return (
    <ThemeTokenProvider tokens={themeTokenChk}>
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
      <ScreenHeader
        breadcrumb={[{ label: 'Quản lý KCHTGT' }, { label: 'Quản lý đê chắn sóng, đê chắn cát, kè hướng dòng, kè bảo vệ bờ' }]}
        actions={[{ key: 'create', label: 'Thêm mới', icon: <PlusOutlined />, variant: 'primary', onClick: openCreateDrawer }]}
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
          <DataTable
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            rowActions={rowActions}
            scroll={{ x: 'max-content' }}
            emptyState={<EmptyState description="Không có dữ liệu đê/kè nào phù hợp với bộ lọc" />}
          />
          <div style={{ height: 55, overflow: 'visible', marginBottom: spaceSm }}>
            <Pagination
              total={total}
              current={page}
              pageSize={pageSize}
              pageSizeOptions={[10, 20, 50, 100]}
              onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
            />
          </div>
        </div>
      </FilterTableLayout>

      {/* ── Create / Edit / Detail Drawer ─────────────────────────── */}
      <AppDrawer
        title={
          <span style={isDetailMode || editingRecord ? drawerTitleStyle : { ...drawerTitleStyle, fontSize: 16 }}>
            {isDetailMode
              ? `Chi tiết đê kè${detailRecord?.dikeRevetmentName ? ` — ${detailRecord.dikeRevetmentName}` : ''}`
              : editingRecord
                ? `Chỉnh sửa — ${editingRecord.dikeRevetmentName || ''}`
                : 'Thêm mới đê chắn sóng, đê chắn cát, kè hướng dòng, kè bảo vệ bờ'}
          </span>
        }
        open={drawerVisible}
        destroyOnHidden
        onClose={closeDrawer}
        footer={
          isDetailMode ? null : editingRecord ? (
            // Quy tắc 12 (approval-2-level-spec.md 3.9) — bộ nút chân form theo trạng thái hồ sơ.
            editingRecord.approvalStatus === 'APPROVED' ? (
              <div style={drawerFooterStyle}>
                <Button onClick={closeDrawer} style={outlineButtonStyle}>Hủy</Button>
                <Button type="primary" onClick={() => handleSubmit('approve')} loading={submitting}
                  style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}>
                  Lưu và phê duyệt
                </Button>
              </div>
            ) : (
              <div style={drawerFooterStyle}>
                <Button onClick={closeDrawer} style={outlineButtonStyle}>Hủy</Button>
                <Button onClick={() => handleSubmit('draft')} loading={submitting} style={outlineButtonStyle}>Lưu tạm</Button>
                {canSubmitForApproval && (
                  <Button type="primary" onClick={() => handleSubmit('submit')} loading={submitting} style={primaryButtonStyle}>
                    Lưu và gửi phê duyệt
                  </Button>
                )}
              </div>
            )
          ) : (
            <div style={drawerFooterStyle}>
              <Button onClick={() => handleSubmit('draft')} loading={submitting} style={outlineButtonStyle}>Lưu tạm</Button>
              {canSubmitForApproval && (
                <Button type="primary" onClick={() => handleSubmit('submit')} loading={submitting} style={primaryButtonStyle}>
                  Lưu và gửi phê duyệt
                </Button>
              )}
              {canApproveC2 && (
                <Button type="primary" onClick={() => handleSubmit('approve')} loading={submitting}
                  style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}>
                  Lưu và phê duyệt
                </Button>
              )}
            </div>
          )
        }
      >
        {isDetailMode && detailRecord ? (
          <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} tabBarStyle={tabBarStyle} items={detailTabItems} />
        ) : (
          <>
            <style>{requiredMarkStyle}</style>
            <Form form={createForm} layout="vertical" initialValues={{ status: '2' }}>
              <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} tabBarStyle={tabBarStyle}
                items={[
                  {
                    key: 'general',
                    label: 'Thông tin chung',
                    children: (
                      <div style={{ ...themeTokenChk.drawerFormScrollStyle, paddingTop: spaceMd }}>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="dikeRevetmentName" {...labelProps('Tên đê kè')} required style={formFieldStyle}
                              rules={[{ required: true, message: 'Vui lòng nhập tên đê kè' }]}>
                              <Input placeholder="Nhập tên đê kè..." maxLength={255} showCount style={inputStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="code" {...labelProps('Mã đê kè')} style={formFieldStyle}
                              tooltip="Mã đê kè được sinh tự động, không thể chỉnh sửa">
                              <Input disabled placeholder={codeLoading ? 'Đang sinh mã...' : 'Mã tự sinh'} maxLength={50}
                                style={{ ...inputStyle, color: textTertiary, cursor: 'not-allowed' }} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="dikeRevetmentType" {...labelProps('Loại kết cấu công trình')} required style={formFieldStyle}
                              rules={[{ required: true, message: 'Vui lòng chọn loại kết cấu công trình' }]}>
                              <Select placeholder="Chọn loại kết cấu công trình" options={DIKE_REVETMENT_TYPE_OPTIONS} style={selectStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="orgUnitId" {...labelProps('Đơn vị quản lý')} required style={formFieldStyle}
                              rules={[{ required: true, message: 'Vui lòng chọn đơn vị quản lý' }]}>
                              <TreeSelect placeholder="Chọn đơn vị quản lý" treeData={buildOrgTree(organizations)}
                                showSearch treeNodeFilterProp="title" treeDefaultExpandAll
                                disabled={!!editingRecord || !isElevatedOrg} style={selectStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="operatingUnitId" {...labelProps('Đơn vị vận hành')} style={formFieldStyle}>
                              <Select placeholder="Chọn đơn vị vận hành" allowClear showSearch optionFilterProp="label"
                                options={operatingUnitOptions} style={selectStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="seaportId" {...labelProps('Thuộc cảng biển')} style={formFieldStyle}>
                              <Select placeholder="Chọn cảng biển" allowClear showSearch optionFilterProp="label"
                                options={seaports.map((p) => ({ value: p.id, label: p.portName || p.portCode || p.id }))}
                                style={selectStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="location" {...labelProps('Địa điểm (Tỉnh/TP)')} required style={formFieldStyle}
                              rules={[{ required: true, message: 'Vui lòng chọn địa điểm (Tỉnh/TP)' }]}>
                              <Select placeholder="Chọn địa điểm (Tỉnh/TP)" allowClear showSearch optionFilterProp="label"
                                options={VIETNAM_PROVINCE_OPTIONS.map((p) => ({ value: p.label, label: p.label }))}
                                style={selectStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="locationDetail" {...labelProps('Địa điểm chi tiết')} style={formFieldStyle}>
                              <Input placeholder="Nhập địa điểm chi tiết..." maxLength={500} showCount style={inputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="status" {...labelProps('Tình trạng')} required style={formFieldStyle}
                              rules={[{ required: true, message: 'Vui lòng chọn tình trạng' }]}>
                              <Select placeholder="Chọn tình trạng" options={OPERATIONAL_STATUS_OPTIONS} style={selectStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="constructionDate" {...labelProps('Thời điểm xây dựng')} style={formFieldStyle}>
                              <DatePicker placeholder="Chọn ngày..." format="DD/MM/YYYY" style={{ width: '100%', ...selectStyle }} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="commissioningDate" {...labelProps('Thời điểm đưa vào khai thác')} style={formFieldStyle}>
                              <DatePicker picker="year" placeholder="Chọn năm..." format="YYYY" style={{ width: '100%', ...selectStyle }} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="lastMaintenanceYear" {...labelProps('Năm bảo trì gần nhất')} style={formFieldStyle}>
                              <DatePicker picker="year" placeholder="Chọn năm..." style={{ width: '100%', ...selectStyle }} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="length" {...labelProps('Chiều dài (m)')} required style={formFieldStyle}
                              rules={[{ required: true, message: 'Vui lòng nhập chiều dài' }]}>
                              <InputNumber min={0.01} max={99999} step={0.01} precision={2} placeholder="0" style={{ width: '100%', ...inputStyle }} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="height" {...labelProps('Chiều cao (m)')} style={formFieldStyle}>
                              <InputNumber min={0} max={99999} step={0.01} precision={2} placeholder="0" style={{ width: '100%', ...inputStyle }} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="crestElevation" {...labelProps('Cao trình đỉnh (m)')} style={formFieldStyle}>
                              <InputNumber min={0} max={99999} step={0.01} precision={2} placeholder="0" style={{ width: '100%', ...inputStyle }} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="note" {...labelProps('Ghi chú')} style={formFieldStyle}>
                              <Input placeholder="Nhập ghi chú..." maxLength={500} showCount style={inputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                      </div>
                    ),
                  },
                  {
                    key: 'gis',
                    label: 'Thông tin vị trí',
                    children: (
                      <div style={{ paddingTop: 16 }}>
                        <div style={themeTokenChk.drawerGisControlBoxStyle}>
                          <Row gutter={[24, 0]} style={{ height: 68, marginBottom: 8 }}>
                            <Col span={12}>
                              <Form.Item label={gisFormLabel('Loại đối tượng')} name="geometryType" style={{ marginBottom: 0 }}>
                                <Select
                                  placeholder="Chọn loại đối tượng"
                                  allowClear
                                  options={[
                                    { value: 'POINT', label: 'Đối tượng điểm' },
                                    { value: 'LINE', label: 'Đối tượng đường' },
                                    { value: 'POLYGON', label: 'Đối tượng vùng' },
                                  ]}
                                  style={{ ...selectStyle, height: 38 }}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item label={gisFormLabel('Biểu tượng')} name="symbolId" style={{ marginBottom: 0 }}>
                                <Select
                                  placeholder="Chọn biểu tượng bản đồ"
                                  allowClear
                                  showSearch
                                  optionFilterProp="label"
                                  disabled={!createGeometryType}
                                  style={{ ...selectStyle, height: 38 }}
                                >
                                  {symbols.map((sym) => (
                                    <Select.Option key={sym.id} value={sym.id} label={sym.code ? `${sym.name} (${sym.code})` : sym.name}>
                                      <Space size={6} style={{ display: 'inline-flex', alignItems: 'center' }}>
                                        {sym.image ? (
                                          <img
                                            src={sym.image.startsWith('data:') ? sym.image : `data:image/png;base64,${sym.image}`}
                                            alt={sym.name}
                                            style={{ width: 16, height: 16, objectFit: 'contain', verticalAlign: 'middle' }}
                                          />
                                        ) : (
                                          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: actionPrimary }} />
                                        )}
                                        <span>{sym.code ? `${sym.name} (${sym.code})` : sym.name}</span>
                                      </Space>
                                    </Select.Option>
                                  ))}
                                </Select>
                              </Form.Item>
                            </Col>
                          </Row>
                          <Row gutter={[24, 0]} style={{ height: 68, marginBottom: 8 }}>
                            <Col span={12}>
                              <Form.Item label={gisFormLabel('Hệ quy chiếu')} name="coordinateSystem" style={{ marginBottom: 0 }}>
                                <Select
                                  placeholder="Chọn hệ quy chiếu"
                                  options={[
                                    { value: 1, label: 'WGS-84' },
                                    { value: 2, label: 'VN-2000' },
                                  ]}
                                  style={{ ...selectStyle, height: 38 }}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item label={gisFormLabel('Quy tắc hiển thị')} name="displayRule" style={{ marginBottom: 0 }}>
                                <Input disabled style={{ ...themeTokenChk.readonlyInputStyle, borderRadius: radiusPill, height: 38 }} />
                              </Form.Item>
                            </Col>
                          </Row>
                          <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32, boxSizing: 'border-box' }}>
                            <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>
                              Tọa độ
                            </span>
                            <Space>
                              <Button
                                icon={<EnvironmentOutlined style={{ color: actionPrimary }} />}
                                onClick={() => setGisMapOpen(true)}
                                style={{ borderRadius: radiusPill, height: 32, padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: 6, borderColor: actionPrimary, color: actionPrimary }}
                              >
                                Chọn vị trí trên bản đồ
                              </Button>
                              {createGeometryType !== 'POINT' && gpsCoordList.length > 0 && (
                                <Button type="primary" icon={<PlusOutlined />} onClick={addGpsPoint} style={{ ...primaryButtonStyle, borderRadius: radiusPill, height: 32 }}>
                                  Thêm tọa độ
                                </Button>
                              )}
                            </Space>
                          </div>
                        </div>
                        <DetailTable
                          scrollY={themeTokenChk.DRAWER_TABLE_SCROLL_Y.withGisForm}
                          dataSource={gisShownRows}
                          emptyText="Chưa có tọa độ nào"
                          rowKey="_idx"
                          columns={[
                            {
                              title: 'STT',
                              key: 'stt',
                              width: 60,
                              align: 'center',
                              render: (_: any, __: any, i: number) => (
                                <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{i + 1}</span>
                              ),
                            },
                            {
                              title: 'Vĩ độ (N)',
                              key: 'lat',
                              render: (_: any, r: any) => <DikeRevetmentDmsEditorCell row={r} index={r._idx} field="lat" onUpdatePoint={updateGpsPoint} />,
                            },
                            {
                              title: 'Kinh độ (E)',
                              key: 'lng',
                              render: (_: any, r: any) => <DikeRevetmentDmsEditorCell row={r} index={r._idx} field="lng" onUpdatePoint={updateGpsPoint} />,
                            },
                            {
                              title: '',
                              key: 'actions',
                              width: 50,
                              align: 'center' as const,
                              render: (_: any, r: any) => {
                                if (createGeometryType === 'POINT') return null;
                                // Chỉ cho xóa khi còn trên số điểm tối thiểu (LINE 2 / POLYGON 3)
                                if (gpsCoordList.length <= gisMinPoints) return null;
                                return (
                                  <Button
                                    type="text"
                                    danger
                                    size="small"
                                    icon={<DeleteOutlined style={{ fontSize: 16 }} />}
                                    style={{ width: 32, height: 32, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                    onClick={() => removeGpsPoint(r._idx)}
                                    title="Xóa tọa độ"
                                  />
                                );
                              },
                            },
                          ]}
                        />
                      </div>
                    ),
                  },
                  {
                    key: 'files',
                    label: 'File đính kèm',
                    children: (
                      <div style={{ ...themeTokenChk.drawerFormScrollStyle, paddingTop: spaceMd }}>
                        <InfrastructureAttachmentTab
                          attachments={attachmentItems}
                          readonly={!attachmentsEditable}
                          onUpload={handlePickAttachment}
                          onDelete={(id) => { void handleRemoveAttachment(id); }}
                          onDownload={handleDownloadAttachment}
                        />
                      </div>
                    ),
                  },
                ]}
              />
            </Form>
          </>
        )}
      </AppDrawer>

      {/* ── GIS Map chooser (chuẩn CHK — GisLocationSelector) ──────────── */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EnvironmentOutlined style={{ color: actionPrimary }} />
            <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg, fontSize: fontSizeLg }}>Chọn vị trí & tọa độ trên bản đồ chuyên dụng</span>
          </div>
        }
        open={gisMapOpen}
        onCancel={() => setGisMapOpen(false)}
        destroyOnHidden
        width="90vw"
        style={{ top: 20, maxWidth: '1400px' }}
        footer={[
          <Button key="ok" type="primary"
            onClick={() => { setGisMapOpen(false); toast.success('Đã xác nhận vị trí từ bản đồ'); }}
            style={{ ...primaryButtonStyle, height: 36, borderRadius: radiusPill }}>
            Xác nhận tọa độ
          </Button>,
        ]}
      >
        <div style={{ padding: '8px 0' }}>
          <GisLocationSelector
            inline
            height={520}
            value={{
              geometryType: createGeometryType || 'LINE',
              coordinates: serializeVerticesToWkt(gpsCoordList, createGeometryType || 'LINE'),
              symbolId: createForm.getFieldValue('symbolId'),
            }}
            defaultGeometryType={(createGeometryType as any) || 'LINE'}
            onChange={applyMapSelection}
          />
        </div>
      </Modal>

      {/* ── GIS Map viewer — Xem chi tiết (GisLocationSelector disabled = quy tắc 12) ── */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EnvironmentOutlined style={{ color: actionPrimary }} />
            <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg, fontSize: fontSizeLg }}>Xem vị trí trên bản đồ chuyên dụng</span>
          </div>
        }
        open={gisViewOpen}
        onCancel={() => setGisViewOpen(false)}
        footer={null}
        destroyOnHidden
        width="90vw"
        style={{ top: 20, maxWidth: '1400px' }}
      >
        <div style={{ padding: '8px 0' }}>
          {detailRecord && (
            <GisLocationSelector
              inline={true}
              height={560}
              disabled={true}
              value={{
                geometryType: detailRecord.geometryType || 'POINT',
                coordinates: (() => {
                  const gt = detailRecord.geometryType || 'POINT';
                  // Chuẩn hóa WKT giống /vts-operation-center: bỏ tiền tố SRID (nếu có), parse rồi serialize lại đúng chuẩn selector
                  const raw = (detailRecord.coordinates || '').replace(/^SRID=\d+;/, '').trim();
                  const pts = raw ? parseWktToVertices(raw, gt) : [];
                  return pts.length > 0 ? serializeVerticesToWkt(pts, gt) : raw;
                })(),
                symbolId: detailRecord.symbolId,
              }}
              defaultGeometryType={(detailRecord.geometryType as any) || 'POINT'}
              onChange={() => { }}
            />
          )}
        </div>
      </Modal>

      {/* ── Delete Confirmation Modal ────────────────────────────── */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Xác nhận xóa đê kè</span>}
        open={deleteModalOpen}
        onCancel={() => { setDeleteModalOpen(false); setDeletingRecord(null); setDeleteConfirmText(''); }}
        footer={[
          <Button key="cancel" onClick={() => { setDeleteModalOpen(false); setDeletingRecord(null); setDeleteConfirmText(''); }}
            style={outlineButtonStyle}>Hủy</Button>,
          <Button key="delete" type="primary" danger onClick={confirmDelete}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Xác nhận xóa</Button>,
        ]}
        width={480}
      >
        <div style={confirmModalBodyStyle}>
          <p style={{ marginBottom: spaceFormField }}>
            Vui lòng nhập <strong>tên công trình</strong> hoặc gõ <strong>&quot;XÓA&quot;</strong> để xác nhận xóa.
          </p>
          {deletingRecord && (
            <p style={{ marginBottom: spaceFormField }}>
              Đê/kè: <strong style={{ color: textPrimary }}>{deletingRecord.dikeRevetmentName || deletingRecord.code}</strong>
            </p>
          )}
          <Input placeholder="Nhập tên đê kè hoặc XÓA" value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)} onPressEnter={confirmDelete}
            style={inputStyle} autoFocus />
        </div>
      </Modal>

      {/* ── Submit Approval Modal ────────────────────────────────── */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Gửi duyệt đê kè</span>}
        open={submitModalOpen}
        onCancel={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }}
        footer={[
          <Button key="cancel" onClick={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }}
            style={outlineButtonStyle}>Hủy</Button>,
          <Button key="submit" type="primary" onClick={confirmSubmit} style={primaryButtonStyle}>Gửi duyệt</Button>,
        ]}
        width={480}
      >
        <div style={confirmModalBodyStyle}>
          <p>Xác nhận gửi <strong>{submittingRecord?.dikeRevetmentName}</strong> để phê duyệt?</p>
        </div>
      </Modal>

      {/* ── Approve Modal (chuẩn CHK — ApprovalModal chung) ────────── */}
      <ApprovalModal
        visible={approveModalOpen}
        level={approvingRecord?.approvalStatus === 'APPROVED_LEVEL1' ? 'c2' : 'c1'}
        onConfirm={(content) => { if (approvingRecord) void confirmApprove(content); }}
        onCancel={() => { setApproveModalOpen(false); setApprovingRecord(null); }}
      />

      {/* ── Reject Modal ─────────────────────────────────────────── */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>{rejectingRecord?.approvalStatus === 'APPROVED_LEVEL1' ? 'Từ chối cấp Cục' : 'Từ chối cấp Cảng vụ/Chi cục'}</span>}
        open={rejectModalOpen}
        onCancel={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); }}
        footer={[
          <Button key="cancel" onClick={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); }}
            style={outlineButtonStyle}>Hủy</Button>,
          <Button key="reject" type="primary" danger onClick={confirmReject}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Xác nhận từ chối</Button>,
        ]}
        width={480}
      >
        <div style={confirmModalBodyStyle}>
          <p style={{ marginBottom: spaceFormField }}>
            Vui lòng nhập lý do từ chối cho <strong>{rejectingRecord?.dikeRevetmentName}</strong>:
          </p>
          <Input.TextArea placeholder="Nhập lý do từ chối (tối thiểu 10, tối đa 500 ký tự)..." value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)} rows={3} maxLength={500}
            styles={{ textarea: { borderRadius: radiusPill, minHeight: 40 } }} />
        </div>
      </Modal>

      {/* ── History drawer (chuẩn /vts-system — Drawer 960) ─────────── */}
      <Drawer
        width={960}
        placement="right"
        open={historyOpen}
        onClose={() => { setHistoryOpen(false); setHistoryTarget(null); setHistoryRecords([]); }}
        closable={false}
        extra={
          <Button type="text" aria-label="Đóng lịch sử thay đổi" onClick={() => { setHistoryOpen(false); setHistoryTarget(null); setHistoryRecords([]); }}
            style={themeTokenChk.drawerCloseBtnStyle}>✕</Button>
        }
        footer={null}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '12px 24px 12px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
        }}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Space size={spaceSm} style={{ alignItems: 'center' }}>
              <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
              <span style={themeTokenChk.drawerTitleStyle}>
                {historyTarget ? `Lịch sử thay đổi — ${historyTarget.dikeRevetmentName || historyTarget.code}` : 'Lịch sử thay đổi'}
              </span>
              <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: themeTokenChk.radiusSm, fontSize: fontSizeLg - 1, fontWeight: fontWeightBold, background: `${colors.sidebarBg}15`, color: colors.sidebarBg, lineHeight: '20px' }}>
                {/* Nhật ký nạp theo trang nên đây là số đã tải, không phải tổng. */}
                {`Đã tải ${historyRecords.length}`}
              </span>
            </Space>
          </div>
        }
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
              style={{ ...inputStyle, flex: 1 }}
            />
            <DatePicker.RangePicker
              value={[historyFrom ? dayjs(historyFrom) : null, historyTo ? dayjs(historyTo) : null]}
              onChange={(dates: any) => {
                if (!dates || dates.length === 0 || (!dates[0] && !dates[1])) {
                  setHistoryFrom('');
                  setHistoryTo('');
                } else {
                  setHistoryFrom(dates[0] ? dates[0].startOf('day').format('YYYY-MM-DDTHH:mm:ss') : '');
                  setHistoryTo(dates[1] ? dates[1].endOf('day').format('YYYY-MM-DDTHH:mm:ss') : '');
                }
              }}
              style={{ ...inputStyle, width: 280 }} />
            <Button type="primary" icon={<SearchOutlined />} loading={historyLoading}
              onClick={() => setHistorySearch(historySearchInput.trim())} style={primaryButtonStyle}>
              Tìm kiếm
            </Button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }} onScroll={handleHistoryScroll}>
          {historyLoading ? (
            <LoadingSkeleton rows={5} />
          ) : (
            <>
              {renderHistoryTimeline(historyRecords)}
              {loadingMoreHistory && <div style={{ textAlign: 'center', padding: `${spaceMd}px 0`, color: textTertiary, fontSize: fontSizeMd }}>Đang tải thêm...</div>}
            </>
          )}
        </div>
      </Drawer>
    </div>
    </ThemeTokenProvider>
  );
}

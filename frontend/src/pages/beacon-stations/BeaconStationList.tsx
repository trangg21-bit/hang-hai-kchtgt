import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Button,
  Modal,
  Input,
  InputNumber,
  Select,
  TreeSelect,
  Space,
  Typography,
  Checkbox,
  Form,
  DatePicker,
  Row,
  Col,
  Tabs,
  Drawer,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  HistoryOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';

// Kiểu file đính kèm đang chờ tải lên (file mới chọn từ máy)
type PendingUploadFile = {
  uid: string;
  name: string;
  size?: number;
  status?: 'done';
  originFileObj?: File;
  // Thông tin file đã lưu trên server (để hiển thị người tải + tải xuống)
  file?: any;
  contentType?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  uploadedByName?: string;
  uploadedDate?: string;
};
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
import { ScreenHeader, DataTable, SidebarFilterField } from '../../components/list-view';
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
import { formLabelProps as labelProps } from '../../components/shared/formLabel';
import { AppDrawer } from '../../components/shared/AppDrawer';
import ApprovalModal from '../../components/shared/ApprovalModal';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import DetailTable from '../../components/shared/DetailTable';
import InfrastructureAttachmentTab from '../../components/shared/InfrastructureAttachmentTab';
import { OrgUnitTreeSelect, normalizeSearchText } from '../../components/org-unit';
import { adjustCoordinateListForGeometry } from '../../utils/gisGeometry';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../services/operatingOrganizationsData';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import {
  actionPrimary, textPrimary, textSecondary, textTertiary,
  fontWeightBold, fontWeightMedium, fontSizeSm, fontSizeMd, fontSizeLg,
  radiusPill,
  radiusSm,
  spaceXs, spaceSm, spaceMd, spaceFormField, spaceLg,
  surfaceCard, surfacePage,
  statusOperational, statusDraft, statusCritical, statusAttention,
  drawerTitleStyle, drawerCloseBtnStyle, drawerTabBarStyle, drawerFormScrollStyle, drawerGisControlBoxStyle, readonlyInputStyle, selectStyle, textAreaStyle,
  borderDefault, statusBadgeStyle, cellTitleStyle, cellSubtitleStyle,
  inputStyle, colors, primaryButtonStyle, outlineButtonStyle, dangerButtonStyle,
  formFieldStyle,
  confirmModalBodyStyle,
  requiredMarkStyle,
  DRAWER_TABLE_SCROLL_Y,
  getRangePickerProps,
} from '../../themetokenchk';
import * as themeTokenChk from '../../themetokenchk';

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
  } catch {}
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
};

const STATUS_TAB_LIST = [
  { key: '', label: 'Tất cả', color: actionPrimary },
  { key: 'DRAFT', label: BEACON_APPROVAL_STATUS_LABELS.DRAFT, color: statusDraft },
  { key: 'PENDING_APPROVAL', label: BEACON_APPROVAL_STATUS_LABELS.PENDING_APPROVAL, color: statusAttention },
  { key: 'APPROVED_LEVEL1', label: BEACON_APPROVAL_STATUS_LABELS.APPROVED_LEVEL1, color: actionPrimary },
  { key: 'APPROVED', label: BEACON_APPROVAL_STATUS_LABELS.APPROVED, color: statusOperational },
  { key: 'REJECTED_LEVEL1', label: BEACON_APPROVAL_STATUS_LABELS.REJECTED_LEVEL1, color: statusCritical },
  { key: 'REJECTED_LEVEL2', label: BEACON_APPROVAL_STATUS_LABELS.REJECTED_LEVEL2, color: statusCritical },
];

const TAB_QUERY_MAP: Record<string, BeaconStatus | undefined> = {
  '': undefined,
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED_LEVEL1: 'APPROVED_LEVEL1',
  APPROVED: 'APPROVED',
  REJECTED_LEVEL1: 'REJECTED_LEVEL1',
  REJECTED_LEVEL2: 'REJECTED_LEVEL2',
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
  DELETED: { color: textTertiary, label: 'Đã xóa' },
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

const GEOMETRY_TYPE_OPTIONS = [
  { value: 'POINT', label: 'Đối tượng điểm' },
  { value: 'LINE', label: 'Đối tượng đường' },
  { value: 'POLYGON', label: 'Đối tượng vùng' },
];

const GEOMETRY_TYPE_MAP: Record<string, string> = { POINT: 'Đối tượng điểm', LINE: 'Đối tượng đường', POLYGON: 'Đối tượng vùng' };

const COORD_SYS_OPTIONS = [
  { value: 1, label: 'WGS-84' },
  { value: 2, label: 'VN-2000' },
];

const COORD_SYS_MAP: Record<number, string> = { 1: 'WGS-84', 2: 'VN-2000' };

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try { return dayjs(dateStr).format('DD/MM/YYYY HH:mm:ss'); } catch { return dateStr; }
}

const rangeValue = (from: string, to: string): [Dayjs | null, Dayjs | null] | null =>
  from || to ? [from ? dayjs(from) : null, to ? dayjs(to) : null] : null;

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
    || hasPerm('data:approvec2') || hasPerm('admin:all');

  // ── Filter state ─────────────────────────────────────────────────
  const [filterName, setFilterName] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterLightModel, setFilterLightModel] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterUnitId, setFilterUnitId] = useState<string | undefined>();
  const [filterSeaportId, setFilterSeaportId] = useState<string | undefined>();
  const [filterOperator, setFilterOperator] = useState('');
  const [filterProvinceId, setFilterProvinceId] = useState<string | undefined>();
  const [filterOperationalStatus, setFilterOperationalStatus] = useState<number | undefined>();
  const [filterCommissionedFrom, setFilterCommissionedFrom] = useState('');
  const [filterCommissionedTo, setFilterCommissionedTo] = useState('');
  const [filterUpdatedBy, setFilterUpdatedBy] = useState('');
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
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BeaconStation | null>(null);
  const [detailRecord, setDetailRecord] = useState<BeaconStation | null>(null);
  const [isDetailMode, setIsDetailMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createForm] = Form.useForm();
  const [activeTabKey, setActiveTabKey] = useState('general');
  const [uploadedFiles, setUploadedFiles] = useState<PendingUploadFile[]>([]);
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
  const [rejectForm] = Form.useForm();
  const [rejectLoading, setRejectLoading] = useState(false);
  const [approveNote, setApproveNote] = useState('');
  const [approveLevel, setApproveLevel] = useState<'c1' | 'c2'>('c1');

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

  // ── GIS map modal (Rule 12: disabled mode for view) ─────────────
  const [gisModalOpen, setGisModalOpen] = useState(false);

  // ── GIS form (port VtsOperationCenter): coordinateList rows + geometry type ──
  const [formMapOpen, setFormMapOpen] = useState(false);
  const [gisGeomType, setGisGeomType] = useState<string | undefined>();
  const [gisCoordList, setGisCoordList] = useState<{ latitude: number | null; longitude: number | null }[]>([{ latitude: null, longitude: null }]);

  // ── Load organizations (for unit TreeSelect in the form) ─────────
  useEffect(() => {
    const parentOrgUnits = (window.parent as any)?.kchtOrgUnits;
    if (parentOrgUnits && parentOrgUnits.length > 0) {
      setOrganizations(parentOrgUnits);
    } else {
      (async () => {
        try {
          const resp = await organizationService.list({ pageSize: 1000 });
          setOrganizations(resp.data || []);
        } catch (err) {
          console.error('Failed to load organizations', err);
        }
      })();
    }
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
  const fetchCounts = useCallback(async () => {
    try {
      const results = await Promise.allSettled(
        STATUS_TAB_LIST.map((tab) =>
          beaconStationCRUD.search({
            status: TAB_QUERY_MAP[tab.key],
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
  }, []);

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
        unitId: filterUnitId,
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

  useEffect(() => { void fetchData(); }, [fetchData]);
  useEffect(() => { void fetchCounts(); }, [fetchCounts]);

  // ── Filter handlers ─────────────────────────────────────────────
  const handleFilterApply = useCallback(() => { setPage(1); }, []);
  const handleFilterReset = useCallback(() => {
    setFilterName(''); setFilterCode(''); setFilterType(undefined);
    setFilterLightModel(''); setFilterStatus(undefined); setFilterUnitId(undefined); setFilterSeaportId(undefined);
    setFilterOperator(''); setFilterProvinceId(undefined); setFilterOperationalStatus(undefined);
    setFilterCommissionedFrom(''); setFilterCommissionedTo(''); setFilterUpdatedBy('');
    setFilterUpdatedFrom(''); setFilterUpdatedTo('');
    setActiveTab(''); setPage(1);
  }, []);
  const handleTabChange = useCallback((key: string) => { setActiveTab(key); setPage(1); }, []);

  // ── Drawer handlers ─────────────────────────────────────────────
  const openCreateDrawer = useCallback(() => {
    setEditingRecord(null); setIsDetailMode(false); setDetailRecord(null);
    createForm.resetFields();
    createForm.setFieldsValue({ operationalStatus: 1 });
    setActiveTabKey('general'); setUploadedFiles([]); setDrawerVisible(true);
    setGisGeomType(undefined); setGisCoordList([{ latitude: null, longitude: null }]); setFormMapOpen(false);
    (async () => {
      try {
        const code = await beaconStationCRUD.generateCode();
        if (code) createForm.setFieldsValue({ code });
      } catch (err) {
        console.error('Không thể sinh mã đèn biển tự động', err);
      }
      try {
        const me = await userService.getMe();
        if (me?.orgUnitId) createForm.setFieldsValue({ unitId: me.orgUnitId });
      } catch (err) {
        console.error('Không thể lấy đơn vị mặc định của tài khoản', err);
      }
    })();
  }, [createForm]);

  const openEditDrawer = useCallback((record: BeaconStation) => {
    setEditingRecord(record); setIsDetailMode(false); setDetailRecord(null);
    setActiveTabKey('general');
    setGisGeomType(record.geometryType || undefined);
    const seedCoords = record.coordinates ? parseWktToCoordinates(record.coordinates) : [];
    setGisCoordList(seedCoords.length > 0
      ? seedCoords
      : (record.latitude != null && record.longitude != null
          ? [{ latitude: record.latitude, longitude: record.longitude }]
          : [{ latitude: null, longitude: null }]));
    setFormMapOpen(false);

    createForm.setFieldsValue({
      code: record.code, name: record.name, type: record.type, unitId: record.unitId,
      lightRange: record.lightRange, towerColor: record.towerColor, location: record.location,
      shape: record.shape, structure: record.structure, towerHeight: record.towerHeight,
      lightHeight: record.lightHeight, geographicRange: record.geographicRange,
      backupLightModel: record.backupLightModel, powerSupply: record.powerSupply,
      staffCount: record.staffCount, stationArea: record.stationArea,
      primaryLightModel: record.primaryLightModel, area: record.area,
      lastRepairDate: record.lastRepairDate ? dayjs(record.lastRepairDate) : null,
      commissionedDate: record.commissionedDate ? dayjs(record.commissionedDate) : null,
      provinceId: record.provinceId != null ? String(record.provinceId) : undefined,
      seaportId: record.seaportId,
      operator: record.operator,
      detailedLocation: record.detailedLocation,
      operationalStatus: record.operationalStatus,
      region: record.region,
      identifyingFeature: record.identifyingFeature,
      note: record.note,
      geometryType: record.geometryType,
      mapSymbolId: record.mapSymbolId,
      coordinateSystem: record.coordinateSystem,
      displayRule: record.displayRule,
    });
    setUploadedFiles([]);
    beaconStationCRUD.listAttachments(record.id)
      .then((files) => setUploadedFiles(files.map((a: any) => ({
        uid: a.id, name: a.fileName || a.name, size: a.fileSize, status: 'done' as const,
        file: a.file, contentType: a.fileType || a.contentType, uploadedAt: a.uploadedAt, uploadedBy: a.uploadedBy,
      }))))
      .catch(() => setUploadedFiles([]));
    setDrawerVisible(true);
  }, [createForm]);

  const openDetailDrawer = useCallback(async (record: BeaconStation) => {
    setDetailRecord(record); setEditingRecord(record); setIsDetailMode(true); setActiveTabKey('general'); setDrawerVisible(true);
    setDetailFiles([]);
    try {
      const res = await beaconStationCRUD.findById(record.id);
      setDetailRecord(res);
    } catch { toast.error('Không thể tải thông tin chi tiết'); }
    try {
      const files = await beaconStationCRUD.listAttachments(record.id);
      setDetailFiles(files || []);
    } catch { setDetailFiles([]); }
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerVisible(false); setEditingRecord(null); setDetailRecord(null);
    setIsDetailMode(false); createForm.resetFields();
    setUploadedFiles([]);
    setDetailFiles([]);
  }, [createForm]);

  // ── File đính kèm ───────────────────────────────────────────────
  const handleBeforeUpload = useCallback((file: File): false => {
    if (file.size > 20 * 1024 * 1024) { toast.error('File vượt quá 20MB'); return false; }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(ext)) { toast.error('Định dạng không hỗ trợ'); return false; }
    if (uploadedFiles.length >= 10) { toast.error('Số lượng tệp đính kèm tối đa là 10 tệp'); return false; }
    const me = useAuthStore.getState().user as any;
    const uploaderName = me?.fullName || me?.username || 'Cán bộ quản lý';
    setUploadedFiles((p) => [...p, { uid: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`, name: file.name, size: file.size, status: 'done' as const, originFileObj: file, uploadedByName: uploaderName, uploadedDate: new Date().toISOString() }]);
    toast.success(`Đã thêm tệp ${file.name}`);
    return false;
  }, [uploadedFiles]);

  const removeUploadedFile = useCallback(async (uid: string) => {
    const target = uploadedFiles.find((f) => f.uid === uid);
    setUploadedFiles((p) => p.filter((f) => f.uid !== uid));
    if (target && !target.originFileObj && editingRecord) {
      try { await beaconStationCRUD.deleteAttachment(editingRecord.id, uid); } catch { /* ignore */ }
    }
  }, [uploadedFiles, editingRecord]);

  // Tải xuống file đính kèm (chuẩn /vts-operation-center): file mới → blob cục bộ;
  // file đã lưu → GET /beacon-stations/{id}/attachments/{attachmentId}/download (có auth)
  const handleDownloadAttachment = useCallback(async (attachmentId: string, name: string) => {
    const entityId = editingRecord?.id || detailRecord?.id;
    const saveBlob = (blob: Blob, fileName: string) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fileName || 'attachment';
      a.click();
      URL.revokeObjectURL(url);
    };
    if (!entityId) { toast.error('Không tìm thấy bản ghi để tải tệp đính kèm'); return; }
    const pending = uploadedFiles.find((x) => x.uid === attachmentId);
    if (pending?.originFileObj) {
      const blob = new Blob([pending.originFileObj], { type: pending.contentType || pending.originFileObj.type || 'application/octet-stream' });
      saveBlob(blob, name || pending.name || 'attachment');
      return;
    }
    try {
      const blob = await beaconStationCRUD.downloadAttachment(entityId, attachmentId);
      saveBlob(blob, name || 'attachment');
    } catch { toast.error('Không thể tải xuống tệp đính kèm'); }
  }, [editingRecord, detailRecord, uploadedFiles]);

  // ── History (chuẩn /vts-operation-center & /vts-system: Drawer + paging server) ──
  const openHistory = useCallback((r: BeaconStation) => {
    setHistoryTarget(r); setHistoryOpen(true);
    setHistorySearchInput(''); setHistorySearch(''); setHistoryFrom(''); setHistoryTo('');
    setHistoryRecords([]); setHistoryPage(0); setHasMoreHistory(false); setLoadingMoreHistory(false);
  }, []);

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
  const openApproveModal = useCallback((record: BeaconStation) => {
    const level: 'c1' | 'c2' = record.status === 'APPROVED_LEVEL1' ? 'c2' : 'c1';
    setApproveLevel(level);
    setApprovingRecord(record); setApproveNote(''); setApproveModalOpen(true);
  }, []);

  const confirmApprove = useCallback(async () => {
    if (!approvingRecord) return;
    const approverId = useAuthStore.getState().user?.userId || 'system';
    const isL2 = approvingRecord.status === 'APPROVED_LEVEL1';
    try {
      const note = (approveNote && approveNote !== 'Đã phê duyệt') ? approveNote : undefined;
      if (isL2) {
        await approval.approveL2(approvingRecord.id, approverId, note);
      } else {
        await approval.approveL1(approvingRecord.id, approverId, note);
      }
      toast.success('Đã phê duyệt');
      setApproveModalOpen(false); setApprovingRecord(null); setApproveNote('');
      closeDrawer(); void fetchData(); void fetchCounts();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại'); }
  }, [approvingRecord, approveNote, fetchData, fetchCounts, closeDrawer]);

  // ── Reject ──────────────────────────────────────────────────────
  const openRejectModal = useCallback((record: BeaconStation) => {
    setRejectingRecord(record); setRejectModalOpen(true);
  }, []);

  const handleReject = useCallback(async () => {
    if (!rejectingRecord) return;
    let reason: string;
    try {
      ({ reason } = await rejectForm.validateFields());
    } catch {
      return; // Form rules đã hiển thị lỗi inline
    }
    setRejectLoading(true);
    try {
      await approval.reject(rejectingRecord.id, String(reason || '').trim(), useAuthStore.getState().user?.userId || 'system');
      toast.success('Đã từ chối phê duyệt');
      setRejectModalOpen(false); setRejectingRecord(null);
      rejectForm.resetFields();
      closeDrawer(); void fetchData(); void fetchCounts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
    } finally {
      setRejectLoading(false);
    }
  }, [rejectingRecord, rejectForm, fetchData, fetchCounts, closeDrawer]);

  // ── Submit form (create / update) — action: draft | submit | approved ──
  const handleSubmit = useCallback(async (action: 'draft' | 'submit' | 'approved') => {
    setSubmitting(true);
    try {
      const values = await createForm.validateFields();

      // ── Tọa độ GIS từ coordinateList → WKT (chuẩn /vts-operation-center) ──
      const coordinatesWkt = serializeCoordinatesToWkt(gisCoordList, gisGeomType || 'POINT');

      const toDate = (v: any) => (v ? (dayjs.isDayjs(v) ? v.toISOString() : String(v)) : undefined);
      if (editingRecord) {
        const payload = {
          action,
          name: values.name, type: values.type, lightRange: values.lightRange,
          towerColor: values.towerColor, location: values.location, shape: values.shape,
          structure: values.structure, towerHeight: values.towerHeight, lightHeight: values.lightHeight,
          geographicRange: values.geographicRange, backupLightModel: values.backupLightModel,
          powerSupply: values.powerSupply, staffCount: values.staffCount, stationArea: values.stationArea,
          primaryLightModel: values.primaryLightModel, area: values.area,
          lastRepairDate: toDate(values.lastRepairDate), commissionedDate: toDate(values.commissionedDate),
          unitId: values.unitId,
          provinceId: values.provinceId != null ? Number(values.provinceId) : undefined,
          seaportId: values.seaportId,
          operator: values.operator,
          detailedLocation: values.detailedLocation,
          operationalStatus: values.operationalStatus,
          region: values.region,
          identifyingFeature: values.identifyingFeature,
          note: values.note,
          geometryType: values.geometryType,
          mapSymbolId: values.mapSymbolId,
          coordinateSystem: values.coordinateSystem != null ? Number(values.coordinateSystem) : undefined,
          displayRule: values.displayRule,
          coordinates: coordinatesWkt,
        };
        const updated = await beaconStationCRUD.update(editingRecord.id, payload);
        if (window.parent && (window.parent as any).kchtDetailCache) {
          (window.parent as any).kchtDetailCache[editingRecord.id] = updated;
        }
        const newFiles = uploadedFiles.filter((f) => f.originFileObj).map((f) => f.originFileObj as File);
        if (newFiles.length > 0) {
          try { await beaconStationCRUD.uploadAttachments(editingRecord.id, newFiles); } catch { /* ignore */ }
        }
        toast.success(action === 'submit' ? 'Đã cập nhật và gửi phê duyệt đèn biển' : action === 'approved' ? 'Đã cập nhật và phê duyệt đèn biển' : 'Đã cập nhật đèn biển');
      } else {
        const payload = {
          action,
          name: values.name, code: values.code, type: values.type, lightRange: values.lightRange,
          towerColor: values.towerColor, location: values.location, shape: values.shape,
          structure: values.structure, towerHeight: values.towerHeight, lightHeight: values.lightHeight,
          geographicRange: values.geographicRange, backupLightModel: values.backupLightModel,
          powerSupply: values.powerSupply, staffCount: values.staffCount, stationArea: values.stationArea,
          primaryLightModel: values.primaryLightModel, area: values.area,
          lastRepairDate: toDate(values.lastRepairDate), commissionedDate: toDate(values.commissionedDate),
          unitId: values.unitId,
          provinceId: values.provinceId != null ? Number(values.provinceId) : undefined,
          seaportId: values.seaportId,
          operator: values.operator,
          detailedLocation: values.detailedLocation,
          operationalStatus: values.operationalStatus,
          region: values.region,
          identifyingFeature: values.identifyingFeature,
          note: values.note,
          geometryType: values.geometryType,
          mapSymbolId: values.mapSymbolId,
          coordinateSystem: values.coordinateSystem != null ? Number(values.coordinateSystem) : undefined,
          displayRule: values.displayRule,
          coordinates: coordinatesWkt,
        };
        const created = await beaconStationCRUD.create(payload);
        const newFiles = uploadedFiles.filter((f) => f.originFileObj).map((f) => f.originFileObj as File);
        if (created.id && newFiles.length > 0) {
          try { await beaconStationCRUD.uploadAttachments(created.id, newFiles); } catch { /* ignore */ }
        }
        toast.success(action === 'submit' ? 'Đã gửi phê duyệt đèn biển' : action === 'approved' ? 'Đã phê duyệt đèn biển' : 'Đã lưu tạm đèn biển');
      }
      setDrawerVisible(false); setEditingRecord(null); setDetailRecord(null);
      setIsDetailMode(false); createForm.resetFields();
      void fetchData(); void fetchCounts();
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
      // validation error → antd shows field messages
    } finally {
      setSubmitting(false);
    }
  }, [editingRecord, createForm, fetchData, fetchCounts, uploadedFiles, gisCoordList, gisGeomType]);

  // ── Row actions (popup chuẩn themetokenchk — thứ tự: Xem chi tiết, Chỉnh sửa, Lịch sử,
  //  rồi nhóm Phê duyệt/Từ chối, cuối cùng Xóa) ──
  const rowActions = useCallback((record: BeaconStation) => {
    const st = record.status || '';
    const actions: any[] = [
      { key: 'view', label: 'Xem chi tiết', icon: themeTokenChk.icons.view, onClick: () => openDetailDrawer(record) },
    ];
    // Quy tắc 12 (approval-2-level-spec.md mục 3.9)
    if (canEditApprovalRecord(st, { hasPerm, resource: 'beaconstation', extraUpdatePerms: ['data:update', 'admin:manage'], extraApprovePerms: ['admin:manage'] })) {
      actions.push({ key: 'edit', label: 'Chỉnh sửa', icon: themeTokenChk.icons.edit, onClick: () => openEditDrawer(record) });
    }
    actions.push({ key: 'history', label: 'Lịch sử', icon: themeTokenChk.icons.history, onClick: () => openHistory(record) });
    // Nhóm phê duyệt / từ chối (đứng trước Xóa)
    if (st === 'DRAFT' || st === 'REJECTED_LEVEL1' || st === 'REJECTED_LEVEL2') {
      actions.push({ key: 'submit', label: 'Gửi phê duyệt', icon: themeTokenChk.icons.submit, onClick: () => openSubmitModal(record) });
    }
    if (st === 'PENDING_APPROVAL' || st === 'APPROVED_LEVEL1') {
      actions.push({ key: 'approve', label: 'Phê duyệt', icon: themeTokenChk.icons.approve, onClick: () => openApproveModal(record) });
      actions.push({ key: 'reject', label: 'Từ chối', icon: themeTokenChk.icons.reject, danger: true, onClick: () => openRejectModal(record) });
    }
    if (st === 'DRAFT') {
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
      render: (name: string, record: BeaconStation) => (
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
            {name || '—'}
          </a>
          <span style={{ ...cellSubtitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {record.code || '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'unitName', label: 'Đơn vị quản lý', dataIndex: 'unitName', width: 300,
      render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary, fontWeight: fontWeightBold }}>{v || '—'}</span>,
    },
    {
      key: 'seaportId', label: 'Thuộc cảng biển', dataIndex: 'seaportId', width: 220, ellipsis: true,
      render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{seaports.find((p) => p.id === v)?.portName || v || '—'}</span>,
    },
    {
      key: 'operator', label: 'Đơn vị vận hành', dataIndex: 'operator', width: 280, ellipsis: true,
      render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span>,
    },
    {
      key: 'provinceId', label: 'Địa điểm (Tỉnh/TP)', dataIndex: 'provinceId', width: 230,
      render: (v: number) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{getProvinceNameById(v != null ? Number(v) : undefined) || '—'}</span>,
    },
    {
      key: 'operationalStatus', label: 'Tình trạng', dataIndex: 'operationalStatus', width: 230,
      render: (v: number) => {
        const s = OPERATIONAL_STATUS_STYLE_MAP[v];
        return s
          ? <span style={statusBadgeStyle(s.color)}>{s.label}</span>
          : <span style={{ fontSize: fontSizeMd, color: textTertiary }}>—</span>;
      },
    },
    {
      key: 'type', label: 'Cấp trạm đèn', dataIndex: 'type', width: 150,
      render: (type: string) => {
        const opt = BEACON_LIGHT_TYPE_OPTIONS.find((o) => o.value === type);
        return <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{opt ? opt.label : (type || '—')}</span>;
      },
    },
    {
      key: 'updatedByName', label: 'Cán bộ cập nhật', dataIndex: 'updatedByName', width: 220,
      render: (_: any, record: BeaconStation) => {
        const name = record.updatedByName || '—';
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
              {record.updatedAt ? dayjs(record.updatedAt).format('DD/MM/YYYY HH:mm:ss') : '—'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'submittedByName', label: 'Cán bộ gửi phê duyệt', dataIndex: 'submittedByName', width: 220,
      render: (_: any, record: BeaconStation) => {
        const name = record.submittedByName || '—';
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
              {date ? dayjs(date).format('DD/MM/YYYY HH:mm:ss') : '—'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'approverLevel1Name', label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục', dataIndex: 'approverLevel1Name', width: 240,
      render: (_: any, record: BeaconStation) => {
        const name = record.approverLevel1Name || '—';
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
              {date ? dayjs(date).format('DD/MM/YYYY HH:mm:ss') : '—'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'approverLevel2Name', label: 'Cán bộ phê duyệt cấp Cục', dataIndex: 'approverLevel2Name', width: 220,
      render: (_: any, record: BeaconStation) => {
        const name = record.approverLevel2Name || '—';
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
              {date ? dayjs(date).format('DD/MM/YYYY HH:mm:ss') : '—'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'status', label: 'Trạng thái', dataIndex: 'status', width: 200,
      render: (status: string) => {
        const s = BEACON_STATUS_STYLE_MAP[status] || { color: textTertiary, label: status || '—' };
        return <span style={statusBadgeStyle(s.color)}>{s.label}</span>;
      },
    },
  ], [page, pageSize, openDetailDrawer, seaports]);

  const tableData = useMemo(
    () => dataSource.map((item, idx) => ({ ...item, _rowIndex: (page - 1) * pageSize + idx + 1 })),
    [dataSource, page, pageSize],
  );

  // ── Filter panel content (chuẩn FilterTableLayout + SidebarFilterField) ──
  const filterContent = (
    <>
      <SidebarFilterField label="Đơn vị quản lý" style={{ marginTop: spaceMd }}>
        <OrgUnitTreeSelect
          organizations={organizations}
          value={filterUnitId}
          onChange={(v) => { setFilterUnitId(v); setPage(1); }}
          placeholder="Tất cả"
          allowClear
          treeDefaultExpandAll={true}
          listHeight={256}
          style={{ ...selectStyle, width: '100%' }}
        />
      </SidebarFilterField>

      <SidebarFilterField label="Tên đèn biển">
        <Input placeholder="Nhập tên đèn biển" allowClear value={filterName}
          onChange={(e) => { setFilterName(e.target.value); setPage(1); }}
          onPressEnter={handleFilterApply} style={inputStyle} />
      </SidebarFilterField>

      {/* ── Bộ lọc nâng cao (ẩn, hiện khi bấm nút Filter) ── */}
      {filterCollapsed && (
        <>
          <SidebarFilterField label="Thuộc cảng biển">
            <Select placeholder="Tất cả cảng biển" allowClear value={filterSeaportId}
              onChange={(v) => { setFilterSeaportId(v); setPage(1); }}
              showSearch
              filterOption={(input, option) =>
                normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))
              }
              options={seaports.map((p) => ({ value: p.id, label: p.portCode ? `${p.portCode} - ${p.portName || ''}` : (p.portName || p.id) }))}
              style={{ ...selectStyle, width: '100%' }} />
          </SidebarFilterField>

          <SidebarFilterField label="Đơn vị vận hành">
            <Select placeholder="Tất cả đơn vị vận hành" allowClear showSearch optionFilterProp="label" value={filterOperator || undefined}
              onChange={(v) => { setFilterOperator(v || ''); setPage(1); }}
              options={OPERATOR_OPTIONS} style={{ ...selectStyle, width: '100%' }} />
          </SidebarFilterField>

          <SidebarFilterField label="Chủng loại đèn chính">
            <Input placeholder="Nhập chủng loại đèn chính" allowClear value={filterLightModel}
              onChange={(e) => { setFilterLightModel(e.target.value); setPage(1); }}
              onPressEnter={handleFilterApply} style={inputStyle} />
          </SidebarFilterField>

          <SidebarFilterField label="Mã đèn biển">
            <Input placeholder="Nhập mã đèn biển" allowClear value={filterCode}
              onChange={(e) => { setFilterCode(e.target.value); setPage(1); }}
              onPressEnter={handleFilterApply} style={inputStyle} />
          </SidebarFilterField>

          <SidebarFilterField label="Cấp trạm đèn">
            <Select placeholder="Tất cả" allowClear value={filterType}
              onChange={(v) => { setFilterType(v); setPage(1); }}
              options={BEACON_LIGHT_TYPE_OPTIONS} style={{ ...selectStyle, width: '100%' }} />
          </SidebarFilterField>

          <SidebarFilterField label="Thời điểm đưa vào sử dụng">
            <DatePicker.RangePicker
              {...getRangePickerProps({
                value: rangeValue(filterCommissionedFrom, filterCommissionedTo),
                onChange: (range: any) => { setFilterCommissionedFrom(range && range[0] ? range[0].format('YYYY-MM-DD') : ''); setFilterCommissionedTo(range && range[1] ? range[1].format('YYYY-MM-DD') : ''); setPage(1); },
              })}
            />
          </SidebarFilterField>

          <SidebarFilterField label="Tình trạng">
            <Select placeholder="Tất cả" allowClear value={filterOperationalStatus}
              onChange={(v) => { setFilterOperationalStatus(v); setPage(1); }}
              options={OPERATIONAL_STATUS_OPTIONS} style={{ ...selectStyle, width: '100%' }} />
          </SidebarFilterField>

          <SidebarFilterField label="Cán bộ cập nhật">
            <Select placeholder="Tất cả" allowClear showSearch optionFilterProp="label" value={filterUpdatedBy}
              onChange={(v) => { setFilterUpdatedBy(v ?? ''); setPage(1); }}
              options={userOptions} style={{ ...selectStyle, width: '100%' }} />
          </SidebarFilterField>

          <SidebarFilterField label="Ngày cập nhật">
            <DatePicker.RangePicker
              {...getRangePickerProps({
                value: rangeValue(filterUpdatedFrom, filterUpdatedTo),
                onChange: (range: any) => { setFilterUpdatedFrom(range && range[0] ? range[0].format('YYYY-MM-DD') : ''); setFilterUpdatedTo(range && range[1] ? range[1].format('YYYY-MM-DD') : ''); setPage(1); },
              })}
            />
          </SidebarFilterField>

          <SidebarFilterField label="Địa điểm (Tỉnh/Thành phố)">
            <Select placeholder="Tất cả tỉnh/thành phố" allowClear value={filterProvinceId}
              onChange={(v) => { setFilterProvinceId(v); setPage(1); }}
              showSearch
              filterOption={(input, option) =>
                normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))
              }
              options={VIETNAM_PROVINCE_OPTIONS} style={{ ...selectStyle, width: '100%' }} />
          </SidebarFilterField>
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

  const renderDetailRows = (rows: DetailRow[], paddingTop = 16) => (
    <div className="chk-detail-grid" style={{ paddingTop }}>
      {rows.map((row) => (
        <div key={row.label} className="chk-detail-row chk-detail-row--full">
          <span className="chk-detail-label">{row.label}</span>
          <span className="chk-detail-value">{row.value}</span>
        </div>
      ))}
    </div>
  );

  const renderDetailRowsTwoCol = (rows: DetailRow[]) => (
    <div className="chk-detail-grid" style={{ paddingTop: 4 }}>
      {rows.map((row) => (
        <div key={row.label} className={row.span ? 'chk-detail-row chk-detail-row--full' : 'chk-detail-row'}>
          <span className="chk-detail-label">{row.label}</span>
          <span className="chk-detail-value">{row.value}</span>
        </div>
      ))}
    </div>
  );

  // Tab 1 — Thông tin cơ bản
  const detailBasicRows: DetailRow[] = detailRecord
    ? [
        { label: 'Mã đèn biển', value: detailRecord.code || '—' },
        { label: 'Tên đèn biển', value: detailRecord.name || '—' },
        { label: 'Đơn vị quản lý', value: detailRecord.unitName || detailRecord.unitId || '—' },
        { label: 'Thuộc cảng biển', value: seaports.find((p) => p.id === detailRecord.seaportId)?.portName || detailRecord.seaportId || '—' },
        { label: 'Đơn vị vận hành', value: detailRecord.operator || '—' },
        { label: 'Địa điểm (Tỉnh/TP)', value: getProvinceNameById(detailRecord.provinceId != null ? Number(detailRecord.provinceId) : undefined) || '—' },
        { label: 'Địa điểm chi tiết', value: detailRecord.detailedLocation || '—', span: true },
        {
          label: 'Tình trạng',
          value: (() => {
            const s = detailRecord.operationalStatus != null ? OPERATIONAL_STATUS_STYLE_MAP[detailRecord.operationalStatus] : undefined;
            return s
              ? <span style={statusBadgeStyle(s.color)}>{s.label}</span>
              : '—';
          })(),
        },
      ]
    : [];

  // Tab 2 — Thông tin kỹ thuật đèn biển
  const detailTechnicalRows: DetailRow[] = detailRecord
    ? [
        { label: 'Chủng loại đèn chính', value: detailRecord.primaryLightModel || '—', span: true },
        { label: 'Chủng loại đèn dự phòng', value: detailRecord.backupLightModel || '—', span: true },
        {
          label: 'Cấp trạm đèn',
          value: BEACON_LIGHT_TYPE_OPTIONS.find((o) => o.value === detailRecord.type)?.label || detailRecord.type || '—',
        },
        { label: 'Địa bàn', value: detailRecord.region || '—', span: true },
        { label: 'Đặc điểm nhận dạng', value: detailRecord.identifyingFeature || '—', span: true },
        { label: 'Hình dạng', value: detailRecord.shape || '—', span: true },
        { label: 'Chiều cao tháp đèn (m)', value: detailRecord.towerHeight != null ? String(detailRecord.towerHeight) : '—' },
        { label: 'Chiều cao tâm sáng (m)', value: detailRecord.lightHeight != null ? String(detailRecord.lightHeight) : '—' },
        { label: 'Tầm hiệu lực địa lý', value: detailRecord.geographicRange || '—' },
        { label: 'Tầm hiệu lực ánh sáng', value: detailRecord.lightRange != null ? String(detailRecord.lightRange) : '—' },
        { label: 'Màu sắc tháp đèn', value: detailRecord.towerColor || '—', span: true },
        { label: 'Nguồn năng lượng', value: detailRecord.powerSupply || '—', span: true },
        { label: 'Thời điểm đưa vào sử dụng', value: formatDate(detailRecord.commissionedDate) },
        { label: 'Thời điểm sửa chữa gần nhất', value: formatDate(detailRecord.lastRepairDate) },
      ]
    : [];

  // Tab 3 — Thông tin nhà trạm
  const detailStationRows: DetailRow[] = detailRecord
    ? [
        { label: 'Địa điểm đặt trạm đèn', value: detailRecord.location || '—' },
        { label: 'Kết cấu', value: detailRecord.structure || '—' },
        { label: 'Diện tích (m²)', value: detailRecord.area != null ? String(detailRecord.area) : '—' },
        { label: 'Diện tích sử dụng trạm đèn (m²)', value: detailRecord.stationArea != null ? String(detailRecord.stationArea) : '—' },
        { label: 'Số lượng nhân sự bố trí', value: detailRecord.staffCount != null ? String(detailRecord.staffCount) : '—' },
        { label: 'Ghi chú', value: detailRecord.note || '—' },
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
        { label: 'Loại đối tượng (GIS)', value: GEOMETRY_TYPE_MAP[detailRecord.geometryType || ''] || detailRecord.geometryType || '—' },
        {
          label: 'Biểu tượng (GIS)',
          value: (() => {
            const sym = symbols.find((s) => s.id === detailRecord.mapSymbolId || s.code === detailRecord.mapSymbolId);
            if (!sym) return detailRecord.mapSymbolId || '—';
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
        { label: 'Hệ quy chiếu (GIS)', value: (detailRecord.coordinateSystem != null ? COORD_SYS_MAP[detailRecord.coordinateSystem] : undefined) || '—' },
        { label: 'Quy tắc hiển thị (GIS)', value: detailRecord.displayRule || '—' },
      ]
    : [];

  // Tab 'Xử lý & theo dõi' — chuẩn màn /cctv: 12 dòng chk-detail-grid
  // (Nội dung phê duyệt đặt trước Ngày/Cán bộ từng cấp; Lý do từ chối; dòng dài full-width)
  const detailHandlingRows: DetailRow[] = detailRecord
    ? [
        { label: 'Ngày cập nhật', value: formatDate(detailRecord.updatedAt) },
        { label: 'Cán bộ cập nhật', value: detailRecord.updatedByName || userOptions.find((u) => u.value === detailRecord.updatedBy)?.label || '—' },
        { label: 'Ngày gửi phê duyệt', value: formatDate(detailRecord.submittedAt) },
        { label: 'Cán bộ gửi phê duyệt', value: detailRecord.submittedByName || '—' },
        { label: 'Nội dung phê duyệt cấp Cảng vụ/Chi cục', value: detailRecord.approvalContentLevel1 || '—', span: true },
        { label: 'Ngày phê duyệt cấp Cảng vụ/Chi cục', value: formatDate(detailRecord.approvedDateLevel1) },
        { label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục', value: detailRecord.approverLevel1Name || '—' },
        { label: 'Nội dung phê duyệt cấp Cục', value: detailRecord.approvalContentLevel2 || '—', span: true },
        { label: 'Ngày phê duyệt cấp Cục', value: formatDate(detailRecord.approvedDateLevel2) },
        { label: 'Cán bộ phê duyệt cấp Cục', value: detailRecord.approverLevel2Name || '—' },
        { label: 'Lý do từ chối', value: detailRecord.rejectionReason || '—', span: true },
        {
          label: 'Trạng thái',
          value: <ApprovalStatusBadge status={detailRecord.status} labelOverrides={BEACON_APPROVAL_STATUS_LABELS} />,
          span: true,
        },
      ]
    : [];

  // ── GIS table DMS cell (port VtsOperationCenterForm) ────────────────
  const updateGisPoint = (i: number, field: 'lat' | 'lng', dVal: number | null, mVal: number | null, sVal: number | null) => {
    const d = dVal ?? 0;
    const m = mVal ?? 0;
    const s = sVal ?? 0;
    const dMax = field === 'lat' ? 90 : 180;
    const dClamped = Math.min(dMax, Math.max(0, d));
    const mClamped = Math.min(59, Math.max(0, m));
    const sClamped = Math.min(59.9999, Math.max(0, s));
    const decimal = dClamped + mClamped / 60 + sClamped / 3600;
    setGisCoordList((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field === 'lat' ? 'latitude' : 'longitude']: decimal };
      return next;
    });
  };

  const renderGisDmsCell = (i: number, field: 'lat' | 'lng', r: { latitude: number | null; longitude: number | null }) => {
    const v = field === 'lat' ? (r.latitude ?? 0) : (r.longitude ?? 0);
    const dms = ddToDms(v);
    const maxD = field === 'lat' ? 90 : 180;
    return (
      <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}>
        <InputNumber
          value={dms.d} min={0} max={maxD} precision={0} placeholder="Độ" controls={false}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(x) => updateGisPoint(i, field, x, dms.m, dms.s)}
          style={{ flex: 1, minWidth: 0, textAlign: 'center' }}
        />
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: colors.bodyBg, border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary, whiteSpace: 'nowrap' }}>°</span>
        <InputNumber
          value={dms.m} min={0} max={59} precision={0} placeholder="Phút" controls={false}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(x) => updateGisPoint(i, field, dms.d, x, dms.s)}
          style={{ flex: 1, minWidth: 0, textAlign: 'center' }}
        />
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: colors.bodyBg, border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary, whiteSpace: 'nowrap' }}>'</span>
        <InputNumber
          value={dms.s} min={0} max={59.9999} step={0.01} placeholder="Giây" controls={false}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(x) => updateGisPoint(i, field, dms.d, dms.m, x)}
          style={{ flex: 1.2, minWidth: 0, textAlign: 'center' }}
        />
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: colors.bodyBg, border: `1px solid ${borderDefault}`, borderLeft: 0, fontSize: fontSizeSm, color: textTertiary, whiteSpace: 'nowrap' }}>"</span>
      </Space.Compact>
    );
  };

  const detailTabItems = [
    {
      key: 'general',
      label: 'Thông tin chung',
      children: (
        <div style={drawerFormScrollStyle}>
          {renderDetailRowsTwoCol(detailBasicRows)}
        </div>
      ),
    },
    { key: 'technical', label: 'Thông tin kỹ thuật đèn biển', children: <div style={drawerFormScrollStyle}>{renderDetailRowsTwoCol(detailTechnicalRows)}</div> },
    { key: 'station', label: 'Thông tin nhà trạm', children: <div style={drawerFormScrollStyle}>{renderDetailRows(detailStationRows)}</div> },
    {
      key: 'gis',
      label: 'Thông tin vị trí',
      children: (
        <DetailTable
          scrollY={DRAWER_TABLE_SCROLL_Y.detailGis}
          dataSource={detailGisCoords}
          emptyText="Chưa có tọa độ GPS nào"
          headerNode={
            <>
              <div className="chk-detail-grid" style={{ marginBottom: 12 }}>
                {detailGisMetaRows.map((row) => (
                  <div key={row.label} className="chk-detail-row">
                    <span className="chk-detail-label">{row.label}</span>
                    <span className="chk-detail-value">{row.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
                <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px' }}>
                  Tọa độ GPS
                </span>
                <Button
                  type="primary"
                  icon={<EnvironmentOutlined />}
                  onClick={() => setGisModalOpen(true)}
                  style={{ ...primaryButtonStyle, height: 32, fontSize: fontSizeSm, padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  Xem vị trí trên bản đồ
                </Button>
              </div>
            </>
          }
          columns={[
            {
              title: 'STT', width: 60, align: 'center' as const,
              render: (_: any, __: any, i: number) => i + 1,
            },
            {
              title: 'Vĩ độ (N)', key: 'lat',
              render: (_: any, r: any) => {
                const dms = ddToDms(r.latitude);
                return `${dms.d}° ${dms.m}' ${dms.s}" N`;
              },
            },
            {
              title: 'Kinh độ (E)', key: 'lng',
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
      label: 'File đính kèm',
      children: (
        <div style={{ ...drawerFormScrollStyle, paddingTop: 3 }}>
          <InfrastructureAttachmentTab
            attachments={detailFiles}
            readonly={true}
            onDownload={(id, name) => void handleDownloadAttachment(id, name)}
            scrollY={DRAWER_TABLE_SCROLL_Y.detailView}
          />
        </div>
      ),
    },
    {
      key: 'ops',
      label: 'Vận hành & bảo trì',
      children: (
        // Chuẩn màn /vts-system: nested Tabs + DetailTable (component bảng con dùng chung cho Drawer chi tiết).
        // dataSource = [] vì bản ghi BeaconStation chưa trả danh sách kế hoạch/sự cố — khi backend bổ sung chỉ cần nạp mảng.
        <Tabs
          defaultActiveKey="operation"
          animated={false}
          tabBarStyle={{ marginTop: 0, marginBottom: 12 }}
          items={[
            {
              key: 'operation',
              label: 'Thông tin vận hành khai thác',
              children: (
                <DetailTable
                  scrollY="calc(100vh - 378px)"
                  dataSource={[]}
                  emptyText="Chưa có dữ liệu"
                  columns={[
                    {
                      title: 'STT', width: 60, align: 'center' as const,
                      render: (_: any, __: any, index: number) => index + 1,
                    },
                    {
                      title: 'Mã / Tên kế hoạch', width: 420,
                      render: (_: any, r: any) => (
                        <div>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: textPrimary }} title={r?.operationPlanCode}>
                            {r?.operationPlanCode || '—'}
                          </div>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: textSecondary }} title={r?.operationPlanName}>
                            {r?.operationPlanName || ''}
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: 'Ngày bắt đầu', width: 150, align: 'center' as const,
                      render: (_: any, r: any) => <span style={{ color: textPrimary }}>{formatDate(r?.operationStartDate)}</span>,
                    },
                    {
                      title: 'Ngày kết thúc', width: 150, align: 'center' as const,
                      render: (_: any, r: any) => <span style={{ color: textPrimary }}>{formatDate(r?.operationEndDate)}</span>,
                    },
                  ]}
                />
              ),
            },
            {
              key: 'maintenance',
              label: 'Thông tin bảo trì',
              children: (
                <DetailTable
                  scrollY="calc(100vh - 378px)"
                  dataSource={[]}
                  emptyText="Chưa có dữ liệu"
                  columns={[
                    {
                      title: 'STT', width: 60, align: 'center' as const,
                      render: (_: any, __: any, index: number) => index + 1,
                    },
                    {
                      title: 'Mã / Tên kế hoạch', width: 420,
                      render: (_: any, r: any) => (
                        <div>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: textPrimary }} title={r?.maintenancePlanCode}>
                            {r?.maintenancePlanCode || '—'}
                          </div>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: textSecondary }} title={r?.maintenancePlanName}>
                            {r?.maintenancePlanName || ''}
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: 'Ngày bắt đầu', width: 150, align: 'center' as const,
                      render: (_: any, r: any) => <span style={{ color: textPrimary }}>{formatDate(r?.maintenanceStartDate)}</span>,
                    },
                    {
                      title: 'Ngày kết thúc', width: 150, align: 'center' as const,
                      render: (_: any, r: any) => <span style={{ color: textPrimary }}>{formatDate(r?.maintenanceEndDate)}</span>,
                    },
                  ]}
                />
              ),
            },
            {
              key: 'incident',
              label: 'Thông tin sự cố',
              children: (
                <DetailTable
                  scrollY="calc(100vh - 378px)"
                  dataSource={[]}
                  emptyText="Chưa có dữ liệu"
                  columns={[
                    {
                      title: 'STT', width: 60, align: 'center' as const,
                      render: (_: any, __: any, index: number) => index + 1,
                    },
                    {
                      title: 'Mã / Tên sự cố', width: 420,
                      render: (_: any, r: any) => (
                        <div>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: textPrimary }} title={r?.incidentCode}>
                            {r?.incidentCode || '—'}
                          </div>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: textSecondary }} title={r?.incidentName}>
                            {r?.incidentName || ''}
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: 'Loại sự cố', width: 180,
                      render: (_: any, r: any) => <span style={{ color: textPrimary }}>{r?.incidentType || '—'}</span>,
                    },
                    {
                      title: 'Địa điểm', width: 220,
                      render: (_: any, r: any) => <span style={{ color: textPrimary }}>{r?.incidentLocation || '—'}</span>,
                    },
                    {
                      title: 'Thời gian', width: 150, align: 'center' as const,
                      render: (_: any, r: any) => <span style={{ color: textPrimary }}>{formatDate(r?.incidentTime)}</span>,
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      ),
    },
    {
      key: 'tracking',
      label: 'Xử lý & theo dõi',
      children: (
        <div style={drawerFormScrollStyle}>
          {renderDetailRowsTwoCol(detailHandlingRows)}
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

  const historyTimestamp = (item: any): string => item.approvedDate || item.changedAt || item.createdAt || '';
  const historyActorName = (item: any): string => item.changedByName || item.actor || item.changedBy || '—';

  const resolveHistoryActionMeta = (item: any): { label: string; color: string } => {
    const rawStatus = String(item?.status ?? item?.action ?? '').toUpperCase();
    const rawReason = String(item?.reason ?? '').toLowerCase();
    const rawLevel = String(item?.approvalLevel ?? item?.level ?? '').toUpperCase();
    if (rawStatus === 'CREATED' || rawStatus === 'CREATE' || rawReason.includes('tạo mới') || rawReason.includes('thêm mới') || rawReason.includes('tao moi')) return { label: 'Thêm mới', color: statusOperational };
    const isLevel1 = rawStatus.includes('LEVEL1') || rawStatus.includes('_L1') || rawLevel.includes('LEVEL1') || rawLevel === 'C1' || rawLevel === 'LEVEL_1' || rawLevel === '1';
    const isLevel2 = rawStatus.includes('LEVEL2') || rawStatus.includes('_L2') || rawLevel.includes('LEVEL2') || rawLevel === 'C2' || rawLevel === 'LEVEL_2' || rawLevel === '2';
    if (rawStatus === 'REJECTED_LEVEL1' || rawStatus === 'REJECTED_L1' || (rawStatus === 'REJECTED' && isLevel1)
      || rawReason.includes('từ chối cấp cảng vụ') || rawReason.includes('tu choi cap cang vu')) return { label: 'Từ chối cấp Cảng vụ/Chi cục', color: statusCritical };
    if (rawStatus === 'REJECTED_LEVEL2' || rawStatus === 'REJECTED_L2' || (rawStatus === 'REJECTED' && isLevel2)
      || rawReason.includes('từ chối cấp Cục') || rawReason.includes('tu choi cap cuc')) return { label: 'Từ chối cấp Cục', color: statusCritical };
    if (rawStatus === 'REJECTED' || rawStatus === 'REJECT' || rawReason.includes('từ chối') || rawReason.includes('tu choi')) return { label: 'Từ chối', color: statusCritical };
    if (rawStatus === 'APPROVED' || rawStatus === 'APPROVED_LEVEL2' || rawStatus === 'APPROVED_LEVEL1' || rawReason.includes('phê duyệt') || rawReason.includes('phe duyet')) {
      if (isLevel2) return { label: 'Phê duyệt cấp Cục', color: statusOperational };
      if (isLevel1) return { label: 'Phê duyệt cấp Cảng vụ/Chi cục', color: statusOperational };
      return { label: 'Phê duyệt', color: statusOperational };
    }
    if (rawStatus === 'PROPOSED' || rawStatus === 'PENDING_APPROVAL' || rawReason.includes('gửi phê duyệt') || rawReason.includes('gui phe duyet')) return { label: 'Gửi phê duyệt', color: statusAttention };
    if (rawStatus === 'DELETED' || rawStatus === 'SOFT_DELETE') return { label: 'Xóa mềm', color: statusCritical };
    return { label: 'Chỉnh sửa', color: actionPrimary };
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
      return formatDate(val);
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
      'status', 'isActive', 'unitId', 'submittedByName']);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
          <div style={{ color: textTertiary, fontSize: fontSizeMd }}>{historySearch || historyFrom || historyTo ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận'}</div>
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
        return <span style={{ color: textPrimary, fontWeight: fontWeightMedium }}>{historyGisTypeLabel(String(raw))}</span>;
      }
      if (isSymbol) {
        const sym = symbols.find((s: any) => s.id === raw || s.code === raw);
        return <span style={{ color: textPrimary, fontWeight: fontWeightMedium }}>{sym?.name || String(raw)}</span>;
      }
      // Map ID/giá trị số sang tên hiển thị (chuẩn /vts-operation-center) — không lộ UUID
      if (key === 'seaportid' || key === 'portid') {
        const p = seaports.find((x: any) => String(x.id) === String(raw));
        return <span style={{ color: textPrimary }}>{p ? (p.portName || p.portCode || '—') : '—'}</span>;
      }
      if (key === 'provinceid') {
        const num = Number(raw);
        const nm = Number.isFinite(num) ? getProvinceNameById(num) : null;
        return <span style={{ color: textPrimary }}>{nm || '—'}</span>;
      }
      if (key === 'operationalstatus') {
        const opt = OPERATIONAL_STATUS_STYLE_MAP[Number(raw)];
        return <span style={{ color: textPrimary }}>{opt?.label || String(raw)}</span>;
      }
      const txt = formatHistoryValue(field, raw);
      return <span title={String(txt)} style={{ minWidth: 0, color: textPrimary, overflowWrap: 'anywhere' }}>{txt}</span>;
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
    const fmtTime = (ts: string) => { const d = dayjs(ts); return `${d.format('HH:mm')} ${d.format('DD/MM/YYYY')}`; };
    return (
      <div>
        {groups.map((g, gi) => {
          const rec0 = g.items[0] || {};
          const actionMeta = resolveHistoryActionMeta(rec0);
          const unitName = rec0.orgUnitName && rec0.orgUnitName !== '—' ? rec0.orgUnitName : 'Cục Hàng hải Việt Nam';
          const allChanges = g.items.flatMap((item) => (item.changes && item.changes.length > 0 ? item.changes : []));
          // Chuẩn /vts-operation-center: bỏ hẳn nhóm log KHÔNG có nội dung thay đổi
          // (tránh hiện "log thừa" chỉ còn pill/thời gian mà không có khối Thông tin thay đổi)
          if (allChanges.length === 0) return null;
          return (
            <div
              key={`history-group-${g.ts}-${g.actor}`}
              style={{ display: 'grid', gridTemplateColumns: 'minmax(310px, 0.38fr) minmax(0, 1fr)', gap: spaceLg, alignItems: 'start', marginBottom: gi < groups.length - 1 ? spaceMd : 0 }}
            >
              <div style={{ minWidth: 0, paddingTop: spaceXs }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: spaceSm, marginBottom: spaceXs }}>
                  <Typography.Text style={{ display: 'block', fontSize: fontSizeLg - 1, color: textPrimary, fontWeight: fontWeightBold, lineHeight: 1.5, whiteSpace: 'nowrap' }}>
                    {g.ts ? fmtTime(g.ts) : '—'}
                  </Typography.Text>
                  <span style={{ flexShrink: 0 }}>
                    <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeSm + 1, fontWeight: fontWeightMedium, background: `${actionMeta.color}18`, color: actionMeta.color, whiteSpace: 'nowrap' }}>{actionMeta.label}</span>
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
              {allChanges.length > 0 && (
                <div style={{ position: 'relative', minWidth: 0, background: surfacePage, borderRadius: radiusSm, padding: `${spaceMd}px ${spaceLg}px`, overflow: 'hidden', border: `1px solid ${borderDefault}` }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: spaceXs, background: `linear-gradient(180deg, ${actionMeta.color} 0%, ${actionMeta.color}40 100%)` }} />
                  <Typography.Text style={{ display: 'block', color: colors.sidebarBg, fontSize: fontSizeMd, fontWeight: fontWeightBold, marginBottom: spaceSm }}>
                    {'Thông tin thay đổi:'}
                  </Typography.Text>
                  <div>
                    {allChanges.map((c: any, ri: number) => {
                      const fname = renderHistoryFieldLabel(c.field || '');
                      return (
                        <div key={`${g.ts}-${c.field}-${ri}`} style={{ display: 'grid', gridTemplateColumns: '170px minmax(100px, 1fr) 24px minmax(100px, 1fr)', alignItems: 'flex-start', gap: spaceSm, fontSize: fontSizeMd, lineHeight: 1.6, padding: '3px 0' }}>
                          <div style={{ fontWeight: fontWeightMedium, color: textSecondary, overflowWrap: 'break-word' }}>{fname ? `${fname}:` : '—'}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, overflowWrap: 'break-word' }}>{renderHistoryValueNode(c.field, c.oldValue)}</div>
                          <div style={{ color: textTertiary, textAlign: 'center', fontWeight: fontWeightBold, userSelect: 'none', paddingTop: 2 }}>→</div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, overflowWrap: 'break-word' }}>{renderHistoryValueNode(c.field, c.newValue)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }



  // ── JSX ─────────────────────────────────────────────────────────
  return (
    <ThemeTokenProvider tokens={themeTokenChk}>
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
      <ScreenHeader
        breadcrumb={[{ label: 'Quản lý hàng hải' }, { label: 'Quản lý Đèn biển và nhà trạm gắn với Đèn biển' }]}
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
          <style>{`.list-view-table .ant-table-cell { padding-block: 8.5px !important; }`}</style>
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

      {/* ── Create / Edit / Detail Drawer ─────────────────────────── */}
      <AppDrawer
        title={
          <span style={drawerTitleStyle}>
            {isDetailMode
              ? `Chi tiết đèn biển${detailRecord ? ` — ${detailRecord.name}` : ''}`
              : editingRecord
                ? `Chỉnh sửa — ${editingRecord.name || editingRecord.code}`
                : 'Thêm mới thông tin đèn biển và nhà trạm gắn với đèn biển'}
          </span>
        }
        open={drawerVisible}
        destroyOnHidden
        onClose={closeDrawer}
        footer={
          isDetailMode ? null : (
            <>
              {editingRecord && ['APPROVED', 'APPROVED_L2', 'APPROVED_LEVEL2', 'PUBLISHED'].includes(editingRecord.status) ? (
                // Bản Đã phê duyệt: chỉ cho "Lưu và phê duyệt" (chuẩn T12 — nút Sửa đã chặn nếu thiếu quyền duyệt C2)
                <Button type="primary" onClick={() => void handleSubmit('approved')} loading={submitting} style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}>
                  Lưu và phê duyệt
                </Button>
              ) : (
                <>
                  <Button onClick={() => void handleSubmit('draft')} loading={submitting} style={outlineButtonStyle}>
                    {editingRecord ? 'Cập nhật' : 'Lưu tạm'}
                  </Button>
                  <Button type="primary" onClick={() => void handleSubmit('submit')} loading={submitting} style={primaryButtonStyle}>
                    {editingRecord ? 'Cập nhật và gửi phê duyệt' : 'Lưu và gửi phê duyệt'}
                  </Button>
                  {canApproveDirect && (
                    <Button type="primary" onClick={() => void handleSubmit('approved')} loading={submitting} style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}>
                      Lưu và phê duyệt
                    </Button>
                  )}
                </>
              )}
            </>
          )
        }
      >
        {isDetailMode && detailRecord ? (
          <div className="chk-detail-tabs">
            <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} tabBarStyle={tabBarStyle} items={detailTabItems} />
          </div>
        ) : (
          <>
            <style>{requiredMarkStyle}</style>
            <Form form={createForm} layout="vertical" initialValues={{ operationalStatus: 1 }}>
              <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} tabBarStyle={drawerTabBarStyle}
                items={[
                  {
                    key: 'general',
                    label: 'Thông tin chung',
                    children: (
                      <div style={drawerFormScrollStyle}>
                        <Row gutter={[24, 0]}>
                          <Col span={12}>
                            <Form.Item name="code" {...labelProps('Mã đèn biển')} style={formFieldStyle}>
                              <Input placeholder="Mã tự sinh (DBNT-XXXXXX)" disabled style={readonlyInputStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="unitId" {...labelProps('Đơn vị quản lý')} required style={formFieldStyle}
                              rules={[{ required: true, message: 'Vui lòng chọn đơn vị quản lý' }]}>
                              <TreeSelect placeholder="Chọn đơn vị quản lý" treeData={buildOrgTree(organizations)}
                                showSearch treeNodeFilterProp="title" treeDefaultExpandAll disabled={!!editingRecord} style={selectStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={[24, 0]}>
                          <Col span={12}>
                            <Form.Item name="name" {...labelProps('Tên đèn biển')} required style={formFieldStyle}
                              rules={[{ required: true, message: 'Vui lòng nhập tên đèn biển' }]}>
                              <Input placeholder="Nhập tên đèn biển..." maxLength={200} showCount style={inputStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="detailedLocation" {...labelProps('Địa điểm chi tiết')} style={formFieldStyle}>
                              <Input placeholder="Nhập địa điểm chi tiết..." maxLength={500} showCount style={inputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={[24, 0]}>
                          <Col span={12}>
                            <Form.Item name="seaportId" {...labelProps('Thuộc cảng biển')} style={formFieldStyle}>
                              <Select placeholder="Chọn cảng biển..." allowClear showSearch optionFilterProp="label"
                                options={seaports.map((p) => ({ value: p.id, label: p.portName || p.portCode || p.id }))}
                                style={selectStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="operator" {...labelProps('Đơn vị vận hành')} style={formFieldStyle}>
                              <Select placeholder="Chọn đơn vị vận hành" allowClear showSearch optionFilterProp="label"
                                options={OPERATOR_OPTIONS} style={selectStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={[24, 0]}>
                          <Col span={12}>
                            <Form.Item name="provinceId" {...labelProps('Địa điểm Tỉnh/TP')} style={formFieldStyle}>
                              <Select placeholder="Chọn tỉnh/thành phố..." allowClear showSearch optionFilterProp="label"
                                options={VIETNAM_PROVINCE_OPTIONS} style={selectStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="operationalStatus" {...labelProps('Tình trạng')} style={formFieldStyle}>
                              <Select placeholder="Chọn tình trạng..." allowClear options={OPERATIONAL_STATUS_OPTIONS} style={selectStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                      </div>
                    ),
                  },
                  {
                    key: 'technical',
                    label: 'Thông tin kỹ thuật đèn biển',
                    children: (
                      <div style={drawerFormScrollStyle}>
                        <Row gutter={[24, 0]}>
                          <Col span={12}>
                            <Form.Item name="type" {...labelProps('Cấp trạm đèn')} required style={formFieldStyle}
                              rules={[{ required: true, message: 'Vui lòng chọn cấp trạm đèn' }]}>
                              <Select placeholder="Chọn cấp trạm đèn..." options={BEACON_LIGHT_TYPE_OPTIONS} style={selectStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="primaryLightModel" {...labelProps('Chủng loại đèn chính')} style={formFieldStyle}>
                              <Input placeholder="Nhập chủng loại đèn chính..." maxLength={100} showCount style={inputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={[24, 0]}>
                          <Col span={12}>
                            <Form.Item name="backupLightModel" {...labelProps('Chủng loại đèn dự phòng')} style={formFieldStyle}>
                              <Input placeholder="Nhập chủng loại đèn dự phòng..." maxLength={100} showCount style={inputStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="lightRange" {...labelProps('Tầm hiệu lực ánh sáng (hải lý)')} required style={formFieldStyle}
                              rules={[{ required: true, message: 'Vui lòng nhập tầm hiệu lực' }]}>
                              <InputNumber min={0.01} max={60} step={0.01} precision={2} placeholder="0" style={{ width: '100%', ...inputStyle }} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={[24, 0]}>
                          <Col span={12}>
                            <Form.Item name="region" {...labelProps('Địa bàn')} style={formFieldStyle}>
                              <Input placeholder="Nhập địa bàn..." maxLength={255} showCount style={inputStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="identifyingFeature" {...labelProps('Đặc điểm nhận dạng')} style={formFieldStyle}>
                              <Input placeholder="Nhập đặc điểm nhận dạng..." maxLength={500} showCount style={inputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={[24, 0]}>
                          <Col span={12}>
                            <Form.Item name="shape" {...labelProps('Hình dạng')} style={formFieldStyle}>
                              <Input placeholder="Nhập hình dạng..." maxLength={255} showCount style={inputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={[24, 0]}>
                          <Col span={12}>
                            <Form.Item name="towerHeight" {...labelProps('Chiều cao tháp đèn (m)')} style={formFieldStyle}>
                              <InputNumber min={0} max={99999} step={0.01} precision={2} placeholder="0" style={{ width: '100%', ...inputStyle }} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="lightHeight" {...labelProps('Chiều cao tâm sáng (m)')} style={formFieldStyle}>
                              <InputNumber min={0} max={99999} step={0.01} precision={2} placeholder="0" style={{ width: '100%', ...inputStyle }} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={[24, 0]}>
                          <Col span={12}>
                            <Form.Item name="towerColor" {...labelProps('Màu sắc tháp đèn')} required style={formFieldStyle}
                              rules={[{ required: true, message: 'Vui lòng nhập màu sắc tháp đèn' }]}>
                              <Input placeholder="Nhập màu sắc tháp đèn..." maxLength={50} showCount style={inputStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="powerSupply" {...labelProps('Nguồn năng lượng')} style={formFieldStyle}>
                              <Input placeholder="Nhập nguồn năng lượng..." maxLength={500} showCount style={inputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={[24, 0]}>
                          <Col span={12}>
                            <Form.Item name="geographicRange" {...labelProps('Tầm hiệu lực địa lý')} style={formFieldStyle}>
                              <Input placeholder="Nhập tầm hiệu lực địa lý..." maxLength={20} showCount style={inputStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="commissionedDate" {...labelProps('Thời điểm đưa vào sử dụng')} style={formFieldStyle}>
                              <DatePicker placeholder="Chọn ngày..." format="DD/MM/YYYY" style={{ ...selectStyle, width: '100%' }} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={[24, 0]}>
                          <Col span={12}>
                            <Form.Item name="lastRepairDate" {...labelProps('Thời điểm sửa chữa gần nhất')} style={formFieldStyle}>
                              <DatePicker placeholder="Chọn ngày..." format="DD/MM/YYYY" style={{ ...selectStyle, width: '100%' }} />
                            </Form.Item>
                          </Col>
                        </Row>
                      </div>
                    ),
                  },
                  {
                    key: 'station',
                    label: 'Thông tin nhà trạm',
                    children: (
                      <div style={drawerFormScrollStyle}>
                        <Row gutter={[24, 0]}>
                          <Col span={12}>
                            <Form.Item name="location" {...labelProps('Địa điểm đặt trạm đèn')} style={formFieldStyle}>
                              <Input placeholder="Nhập địa điểm đặt trạm đèn..." maxLength={1000} showCount style={inputStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="note" {...labelProps('Ghi chú')} style={formFieldStyle}>
                              <Input placeholder="Nhập ghi chú..." maxLength={1000} showCount style={inputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Form.Item name="structure" {...labelProps('Kết cấu')} style={formFieldStyle}>
                          <Input.TextArea rows={3} placeholder="Nhập kết cấu..." maxLength={2000} showCount style={textAreaStyle} />
                        </Form.Item>
                        <Row gutter={[24, 0]}>
                          <Col span={12}>
                            <Form.Item name="area" {...labelProps('Diện tích (m²)')} style={formFieldStyle}>
                              <InputNumber min={0} max={99999} step={0.01} precision={2} placeholder="0" style={{ width: '100%', ...inputStyle }} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="stationArea" {...labelProps('Diện tích sử dụng trạm đèn (m²)')} style={formFieldStyle}>
                              <InputNumber min={0} max={99999} step={0.01} precision={2} placeholder="0" style={{ width: '100%', ...inputStyle }} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={[24, 0]}>
                          <Col span={12}>
                            <Form.Item name="staffCount" {...labelProps('Số lượng nhân sự bố trí')} style={formFieldStyle}>
                              <InputNumber min={0} max={99999} step={1} precision={0} placeholder="0" style={{ width: '100%', ...inputStyle }} />
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
                        <div style={drawerGisControlBoxStyle}>
                        <Row gutter={[24, 0]} style={{ height: 68, marginBottom: 8 }}>
                          <Col span={12}>
                            <Form.Item label={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '18px' }}>Loại đối tượng</span>}
                              name="geometryType" style={{ marginBottom: 0 }}>
                              <Select placeholder="Chọn loại đối tượng" allowClear options={GEOMETRY_TYPE_OPTIONS}
                                onChange={(v) => {
                                  setGisGeomType(v || undefined);
                                  if (v) {
                                    createForm.setFieldsValue({ coordinateSystem: 1, displayRule: 'Độ, phút, giây (DMS)' });
                                    setGisCoordList((prev) => adjustCoordinateListForGeometry(prev, v));
                                  } else {
                                    createForm.setFieldsValue({ coordinateSystem: undefined, displayRule: undefined, mapSymbolId: undefined });
                                    setGisCoordList([{ latitude: null, longitude: null }]);
                                  }
                                }}
                                style={{ ...selectStyle, height: 38 }} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item label={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '18px' }}>Biểu tượng</span>}
                              name="mapSymbolId" style={{ marginBottom: 0 }}>
                              <Select placeholder="Chọn biểu tượng bản đồ" allowClear showSearch optionFilterProp="label" disabled={!gisGeomType} style={{ ...selectStyle, height: 38 }}>
                                {symbols.map((sym) => (
                                  <Select.Option key={sym.id} value={sym.id} label={sym.code ? `${sym.name} (${sym.code})` : sym.name}>
                                    <Space size={6} style={{ display: 'inline-flex', alignItems: 'center' }}>
                                      {sym.image ? (
                                        <img src={sym.image.startsWith('data:') ? sym.image : `data:image/png;base64,${sym.image}`} alt={sym.name} style={{ width: 16, height: 16, objectFit: 'contain', verticalAlign: 'middle' }} />
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
                            <Form.Item label={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '18px' }}>Hệ quy chiếu</span>}
                              name="coordinateSystem" style={{ marginBottom: 0 }}>
                              <Select
                                placeholder="Chọn hệ quy chiếu"
                                options={COORD_SYS_OPTIONS}
                                style={{ ...selectStyle, height: 38 }}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item label={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '18px' }}>Quy tắc hiển thị</span>}
                              name="displayRule" style={{ marginBottom: 0 }}>
                              <Input disabled style={{ ...readonlyInputStyle, borderRadius: radiusPill, height: 38 }} />
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
                              onClick={() => setFormMapOpen(true)}
                              style={{ borderRadius: radiusPill, height: 32, padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: 6, borderColor: actionPrimary, color: actionPrimary }}
                            >
                              Chọn vị trí trên bản đồ
                            </Button>
                            {gisGeomType && gisGeomType !== 'POINT' && gisCoordList.length > 0 && (
                              <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => setGisCoordList((p) => [...p, { latitude: null, longitude: null }])}
                                style={{ ...primaryButtonStyle, borderRadius: radiusPill, height: 32 }}
                              >
                                Thêm tọa độ
                              </Button>
                            )}
                          </Space>
                        </div>
                      </div>

                      <DetailTable
                        scrollY={DRAWER_TABLE_SCROLL_Y.withGisForm}
                        dataSource={(gisGeomType === 'POINT' ? gisCoordList.slice(0, 1) : gisCoordList).map((c, i) => ({ ...c, _idx: i }))}
                        emptyText="Chưa có tọa độ nào"
                        rowKey="_idx"
                        columns={[
                          {
                            title: 'STT', key: 'stt', width: 60, align: 'center' as const,
                            render: (_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{i + 1}</span>,
                          },
                          {
                            title: 'Vĩ độ (N)', key: 'lat',
                            render: (_: any, r: any) => renderGisDmsCell(r._idx, 'lat', r),
                          },
                          {
                            title: 'Kinh độ (E)', key: 'lng',
                            render: (_: any, r: any) => renderGisDmsCell(r._idx, 'lng', r),
                          },
                          {
                            title: '', key: 'actions', width: 50, align: 'center' as const,
                            render: (_: any, r: any) => {
                              const geom = (gisGeomType || 'POINT').toUpperCase();
                              if (geom === 'POINT') return null;
                              const minCount = geom.includes('LINE') ? 2 : (geom.includes('POLYGON') ? 3 : 1);
                              const canDelete = gisCoordList.length > minCount;
                              if (!canDelete) return null;
                              return (
                                <Button
                                  type="text" danger size="small" icon={<DeleteOutlined style={{ fontSize: 16 }} />}
                                  style={{ width: 32, height: 32, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                  onClick={() => setGisCoordList((p) => p.filter((_, idx) => idx !== r._idx))}
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
                      <div style={drawerFormScrollStyle}>
                        <InfrastructureAttachmentTab
                          attachments={uploadedFiles.map((f) => ({
                            id: f.uid,
                            fileName: f.name,
                            fileSize: f.size,
                            fileType: f.contentType,
                            uploadedBy: f.uploadedByName || (f.uploadedBy ? (userOptions.find((u) => u.value === f.uploadedBy)?.label) : undefined),
                            uploadedByName: f.uploadedByName || (f.uploadedBy ? (userOptions.find((u) => u.value === f.uploadedBy)?.label) : undefined) || 'Cán bộ quản lý',
                            uploadedDate: f.uploadedDate || f.uploadedAt,
                            createdAt: f.uploadedDate || f.uploadedAt,
                            file: f.originFileObj || f.file,
                          }))}
                          readonly={false}
                          onUpload={(file) => {
                            handleBeforeUpload(file);
                            return true;
                          }}
                          onDelete={(uid) => removeUploadedFile(uid)}
                          onDownload={(uid, name) => void handleDownloadAttachment(uid, name)}
                          scrollY={DRAWER_TABLE_SCROLL_Y.withDragger}
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

      {/* ── Submit Approval Modal ────────────────────────────────── */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Gửi duyệt đèn biển</span>}
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
          <p>Xác nhận gửi <strong>{submittingRecord?.name}</strong> để phê duyệt?</p>
        </div>
      </Modal>

      {/* ── Approve Modal (ApprovalModal CHK standard — Rule 9) ─────────── */}
      <ApprovalModal
        visible={approveModalOpen}
        level={approveLevel}
        loading={false}
        onConfirm={(text) => {
          setApproveNote(text);
          confirmApprove();
        }}
        onCancel={() => { setApproveModalOpen(false); setApprovingRecord(null); setApproveNote(''); }}
      />

      {/* ── Reject Modal ─────────────────────────────────────────── */}
      <Modal
        title={
          <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>
            Từ chối phê duyệt
          </span>
        }
        open={rejectModalOpen}
        onCancel={() => { setRejectModalOpen(false); setRejectingRecord(null); rejectForm.resetFields(); }}
        footer={null}
        width={480}
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="reason"
            label="Lý do từ chối"
            rules={[
              { required: true, message: 'Lý do từ chối không được để trống' },
              { min: 10, message: 'Lý do từ chối tối thiểu 10 ký tự' },
              { max: 500, message: 'Lý do từ chối tối đa 500 ký tự' },
            ]}
          >
            <Input.TextArea rows={4} placeholder="Nhập lý do từ chối..." style={{ borderRadius: radiusPill }} />
          </Form.Item>
          <Form.Item
            name="confirmed"
            valuePropName="checked"
            rules={[{ required: true, message: 'Bạn cần xác nhận hành động này' }]}
          >
            <Checkbox>
              <Typography.Text style={{ color: statusCritical }}>
                Tôi xác nhận từ chối đèn biển này
              </Typography.Text>
            </Checkbox>
          </Form.Item>
          <div style={{ textAlign: 'right', marginTop: spaceMd }}>
            <Button
              onClick={() => { setRejectModalOpen(false); setRejectingRecord(null); rejectForm.resetFields(); }}
              style={{ borderRadius: radiusPill, height: 40, marginRight: spaceSm }}
            >
              Hủy
            </Button>
            <Button type="primary" danger loading={rejectLoading} onClick={handleReject} style={pillStyle}>
              Từ chối
            </Button>
          </div>
        </Form>
      </Modal>

      {/* ── Chọn vị trí & tọa độ trên bản đồ (chuẩn VtsOperationCenter) ── */}
      <Modal
        title="Chọn vị trí trên bản đồ"
        open={formMapOpen}
        onCancel={() => setFormMapOpen(false)}
        destroyOnHidden
        width="90vw"
        style={{ top: 20, maxWidth: '1400px' }}
        footer={[
          <Button key="ok" type="primary" onClick={() => { setFormMapOpen(false); toast.success('Đã xác nhận vị trí từ bản đồ'); }} style={{ ...primaryButtonStyle, height: 36, borderRadius: radiusPill }}>Xác nhận tọa độ</Button>,
        ]}
      >
        <div style={{ padding: '8px 0' }}>
          <GisLocationSelector
            inline={true}
            height={560}
            value={{
              geometryType: gisGeomType || 'POINT',
              coordinates: serializeCoordinatesToWkt(gisCoordList, gisGeomType || 'POINT'),
              symbolId: createForm.getFieldValue('mapSymbolId'),
            }}
            defaultGeometryType={(gisGeomType as any) || 'POINT'}
            onChange={(val) => {
              if (!val) return;
              if (val.coordinates) {
                const pts = parseWktToCoordinates(val.coordinates);
                if (pts.length > 0) setGisCoordList(pts);
              }
              if (val.geometryType) {
                createForm.setFieldValue('geometryType', val.geometryType);
                setGisGeomType(val.geometryType);
              }
              if (val.symbolId) {
                createForm.setFieldValue('mapSymbolId', val.symbolId);
              }
            }}
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

      {/* ── Lịch sử thay đổi — Drawer chuẩn /vts-operation-center ── */}
      <Drawer
        size={960}
        placement="right"
        open={historyOpen}
        onClose={() => { setHistoryOpen(false); setHistoryTarget(null); setHistoryRecords([]); }}
        closable={false}
        extra={
          <Button type="text" aria-label="Đóng lịch sử thay đổi"
            onClick={() => { setHistoryOpen(false); setHistoryTarget(null); setHistoryRecords([]); }}
            style={drawerCloseBtnStyle}>
            ✕
          </Button>
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
              <span style={drawerTitleStyle}>
                {historyTarget ? `Lịch sử thay đổi — ${historyTarget.name}` : 'Lịch sử thay đổi'}
              </span>
              <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: radiusSm, fontSize: fontSizeLg - 1, fontWeight: fontWeightBold, background: `${colors.sidebarBg}15`, color: colors.sidebarBg, lineHeight: '20px' }}>
                {`Đã tải ${historyRecords.length}`}
              </span>
            </Space>
          </div>
        }
      >
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
              {...getRangePickerProps({
                value: (historyFrom && historyTo)
                  ? [dayjs(historyFrom), dayjs(historyTo)]
                  : (historyFrom ? [dayjs(historyFrom), null] : (historyTo ? [null, dayjs(historyTo)] : null)),
                onChange: (dates: any) => {
                  if (!dates || dates.length === 0 || (!dates[0] && !dates[1])) {
                    setHistoryFrom(''); setHistoryTo('');
                  } else {
                    setHistoryFrom(dates[0] ? dates[0].startOf('day').format('YYYY-MM-DDTHH:mm:ss') : '');
                    setHistoryTo(dates[1] ? dates[1].endOf('day').format('YYYY-MM-DDTHH:mm:ss') : '');
                  }
                },
              })}
              style={{ ...inputStyle, width: 280 }}
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              loading={historyLoading}
              onClick={() => setHistorySearch(historySearchInput.trim())}
              style={primaryButtonStyle}
            >
              Tìm kiếm
            </Button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }} onScroll={handleHistoryScroll}>
          {historyLoading && historyRecords.length === 0 ? (
            <LoadingSkeleton rows={5} />
          ) : (
            <>
              {renderHistoryTimeline(historyRecords)}
              {loadingMoreHistory && (
                <div style={{ padding: spaceMd, textAlign: 'center', color: textTertiary, fontSize: fontSizeMd }}>Đang tải thêm…</div>
              )}
            </>
          )}
        </div>
      </Drawer>

    </div>
    </ThemeTokenProvider>
  );
}

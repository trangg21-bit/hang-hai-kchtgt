// ── BuoyStationList — list screen + Drawers/Modals (chuẩn /services/buoy/BuoyListPage) ──
// Danh sách nhà trạm phao tiêu: filter + tabs trạng thái + client-side pagination
// + Drawer create/edit/detail/history + reject/delete/approve Modals.

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Button,
  Modal,
  Input,
  Alert,
  Space,
  Form,
  DatePicker,
  Select,
  Radio,
  Typography,
} from 'antd';
import type { UploadFile } from 'antd';
import {
  HistoryOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { usePermissionStore } from '../../store/permissionStore';
import { useAuthStore } from '../../store/authStore';
import { organizationService } from '../../services/organizationService';
import type { Organization } from '../../services/organizationService';
import { userService } from '../../services/userService';
import { portCRUD } from '../../services/portService';
import { symbolService } from '../../services/symbolService';
import type { Symbol as GisSymbol } from '../../services/symbolService';
import { lineObjectService } from '../../services/lineObjectService';
import { LineObject } from '../../types/lineObject';
import api from '../../services/api';
import {
  fetchBuoyStationList, fetchBuoyStationById, fetchBuoyStationHistory, fetchBuoyStationAllHistory,
  deleteBuoyStation, rejectBuoyStation, submitBuoyStationForApproval,
  approveBuoyStationL1, approveBuoyStationL2, fetchStationBuoys,
} from './api';
import { documentApi } from '../../app/document/api';
import { fetchBuoyById } from '../buoy/api';
import { buoyStatusBadge } from '../buoy/schema';
import BuoyDetailContent from '../buoy/BuoyDetailContent';
import type { Buoy } from '../buoy/types';
import { searchBuoys } from '../buoy/api';
import type { BuoyStationResponse, ChangeHistory, StationBuoySummary } from './types';
import {
  BUOY_TYPE_OPTIONS, APPROVAL_STYLE_MAP, TAB_STATUS_LIST, STATION_FIELD_MAP,
  COLOR_MAP, SHAPE_MAP, LIGHT_MAP, GEO_MAP, COORD_MAP,
} from './schema';
import { CONDITION_OPTIONS, CLASSIFICATION_OPTIONS, CLASSIFICATION_BUOY_OPTIONS } from '../buoy/schema';
import BuoyStationFormContent from './BuoyStationFormContent';
import type { ExistingFile, BuoyStationFormContentHandle } from './BuoyStationFormContent';
import BuoyStationDetailContent from './BuoyStationDetailContent';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../services/operatingOrganizationsData';
import { ScreenHeader, DataTable } from '../../components/list-view';
import type { DataTableColumn } from '../../components/list-view/DataTable';
import Pagination from '../../components/list-view/Pagination';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import toast from '../../components/ToastNotification';
import { VIETNAM_PROVINCES } from '../../types/common';
import {
  statusOperational,
  statusAttention,
  statusCritical,
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
  spaceMd,
  spaceSm,
  spaceXs,
  spaceXl,
  spaceFormField,
  radiusPill,
  drawerTitleStyle,
  primaryButtonStyle,
  outlineButtonStyle,
  requiredMarkStyle,
  drawerFooterStyle,
  icons,
  statusBadgeStyle,
  cellTitleStyle,
  cellSubtitleStyle,
  colors,
  getRangePickerProps,
  formatUserDisplayName,
  isUuidString,
} from '../../themetokenchk';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import { OrgUnitTreeSelect, resolveOrgLevel2Name } from '../../components/org-unit';
import { canEditApprovalRecord } from '../../utils/approvalEditPolicy';
import ApprovalModal from '../../components/shared/ApprovalModal';
import { AppDrawer } from '../../components/shared/AppDrawer';
import { DeleteConfirmModal } from '../../components/shared/DeleteConfirmModal';
import { formatHistoryNumber } from '../../utils/numFmt';
import { renderStandardHistoryCards, isBlankOrDash } from '../../utils/changeHistoryRenderer';

// ── Style badge Tình trạng (giống Quản lý phao tiêu) ─────────────────
const CONDITION_STYLE: Record<string, { color: string; label: string }> = {
  'Đang khai thác/vận hành': { color: statusOperational, label: 'Đang khai thác/vận hành' },
  'Chưa khai thác/vận hành': { color: statusAttention, label: 'Chưa khai thác/vận hành' },
  'Dừng khai thác/vận hành': { color: statusCritical, label: 'Dừng khai thác/vận hành' },
};

// Tập hợp id đơn vị con (subtree) của một đơn vị — bộ lọc Đơn vị quản lý theo chuẩn Cảng biển:
// chọn đơn vị cha → thấy cả dữ liệu của đơn vị con.
function collectOrgSubtreeIds(organizations: Organization[], orgUnitId: string): Set<string> {
  const childrenByParent = new Map<string, string[]>();
  organizations.forEach((o) => {
    if (o.parentId) {
      const arr = childrenByParent.get(o.parentId) ?? [];
      arr.push(o.id);
      childrenByParent.set(o.parentId, arr);
    }
  });
  const set = new Set<string>();
  const stack = [orgUnitId];
  while (stack.length) {
    const cur = stack.pop();
    if (!cur || set.has(cur)) continue;
    set.add(cur);
    const kids = childrenByParent.get(cur);
    if (kids) stack.push(...kids);
  }
  return set;
}

// ── Helpers ───────────────────────────────────────────────────────────

function fmt(d?: string) {
  if (!d) return '';
  try { return dayjs(d).format('DD/MM/YYYY HH:mm:ss'); } catch { return d; }
}

function ddToDms(dd: number): { d: number; m: number; s: number } {
  const abs = Math.abs(dd);
  const d = Math.floor(abs);
  const m = Math.floor((abs - d) * 60);
  const s = parseFloat(((abs - d - m / 60) * 3600).toFixed(2));
  return { d, m, s };
}

// ── Thứ tự hiển thị field trong lịch sử (theo thứ tự form — giống BuoyListPage) ──
const HISTORY_FIELD_ORDER = [
  'code', 'name', 'Tọa độ GIS', 'Loại đối tượng GIS', 'type', 'unitId', 'operatingOrgId',
  'Phao tiêu trực thuộc', 'portId', 'waterwayId', 'waterwayRouteId',
  'province', 'address', 'constructionDate', 'totalArea', 'usableArea', 'staffCount',
  'lastMaintenanceYear', 'note', 'description', 'color', 'shape', 'lightCharacteristic', 'range',
  'lastInspectionDate', 'nextInspectionDate', 'lastRepairDate', 'isActive',
  'objectType', 'coordinateSystem', 'displayFormat', 'status', 'approvalStatus', 'rejectionReason',
  'Tài liệu đính kèm',
];

const STATION_FIELD_LABEL_OVERRIDES: Record<string, string> = {
  'Tọa độ GIS': 'Tọa độ GPS',
  'Tọa độ GPS': 'Tọa độ GPS',
  'Loại đối tượng GIS': 'Loại đối tượng',
  'Loại đối tượng': 'Loại đối tượng',
  'Phao tiêu trực thuộc': 'Phao tiêu trực thuộc',
  'Tài liệu đính kèm': 'File đính kèm',
  'File đính kèm': 'File đính kèm',
  attachments: 'File đính kèm',
  objectType: 'Loại đối tượng',
  displayFormat: 'Quy tắc hiển thị',
  operatingOrgId: 'Đơn vị khai thác',
  constructionDate: 'Thời điểm xây dựng',
  usableArea: 'Diện tích sử dụng (m²)',
  lastMaintenanceYear: 'Năm bảo trì gần nhất',
  lastInspectionDate: 'Kiểm tra gần nhất',
  nextInspectionDate: 'Kiểm tra kế tiếp',
  status: 'Trạng thái',
  approvalStatus: 'Trạng thái',
  'Trạng thái': 'Trạng thái',
  'Trạng thái phê duyệt': 'Trạng thái',
};

const NUMERIC_HISTORY_FIELDS = new Set([
  'totalArea', 'usableArea', 'staffCount', 'lastMaintenanceYear', 'range',
  'Tổng diện tích', 'Diện tích SD', 'Diện tích sử dụng (m²)', 'Nhân sự', 'Năm BT gần nhất', 'Năm bảo trì gần nhất', 'Tầm xa',
]);

function stationFieldLabel(fn: string): string {
  return STATION_FIELD_LABEL_OVERRIDES[fn] || STATION_FIELD_MAP[fn] || fn;
}

// ── History helpers (chuẩn VTS CHK) ───────────────────────────────
function historyTimestamp(item: any): string {
  return item?.approvedDate || item?.changedAt || item?.createdAt || '';
}

function historyActor(item: any): string {
  const raw = item?.approvedBy || item?.changedBy || item?.performedBy || item?.actorName || '';
  return raw || '';
}

function historyField(item: any): string {
  return item?.fieldName || item?.changedField || '';
}

function historyOldValue(item: any): string | null {
  return item?.oldValue ?? item?.previousValue ?? null;
}

function historyNewValue(item: any): string | null {
  return item?.newValue ?? null;
}

export default function BuoyStationListPage() {
  const hasPerm = usePermissionStore((s: any) => s.hasPermission);
  const currentUser = useAuthStore((s) => s.user);

  const [managingUnitId, setManagingUnitId] = useState<string | undefined>();
  const defaultOrgUnitId = useRef<string | undefined>(undefined);
  const defaultOrgApplied = useRef(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const organizationsRef = useRef<Organization[]>([]);
  const stationBuoysRef = useRef<Record<string, { classifications: string[]; classificationBuoys: string[]; classificationMarks: string[] }>>({});
  const [filterName, setFilterName] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [filterProvince, setFilterProvince] = useState<string | undefined>();
  const [filterPortId, setFilterPortId] = useState<string | undefined>();
  const [filterWaterwayId, setFilterWaterwayId] = useState<string | undefined>();
  const [filterCondition, setFilterCondition] = useState<string | undefined>();
  const [filterClassification, setFilterClassification] = useState<string[] | undefined>();
  const [filterClassificationBuoy, setFilterClassificationBuoy] = useState<string[] | undefined>();
  const [filterClassificationMark, setFilterClassificationMark] = useState<string[] | undefined>();
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState<string | undefined>();
  const [filterUpdatedTo, setFilterUpdatedTo] = useState<string | undefined>();
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});

  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortField, setSortField] = useState<string>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend' | null>('descend');
  const [allData, setAllData] = useState<BuoyStationResponse[]>([]);
  const [dataSource, setDataSource] = useState<BuoyStationResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
  const [portMap, setPortMap] = useState<Map<string, string>>(new Map());
  const [waterwayMap, setWaterwayMap] = useState<Map<string, string>>(new Map());
  const [routeMap, setRouteMap] = useState<Map<string, string>>(new Map());
  const [symbols, setSymbols] = useState<GisSymbol[]>([]);
  const orgMap = useMemo(() => {
    const m = new Map<string, string>();
    organizations.forEach((o) => { m.set(o.id, o.name); });
    return m;
  }, [organizations]);

  // Tên đơn vị cấp 2 trong chuỗi phân cấp — cột Đơn vị quản lý (chuẩn Cảng biển).
  const orgLevel2Map = useMemo(() => {
    const map = new Map<string, string>();
    organizations.forEach((o) => {
      const name = resolveOrgLevel2Name(organizations, o.id);
      if (name) map.set(o.id, name);
    });
    return map;
  }, [organizations]);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
  const [stationBuoys, setStationBuoys] = useState<Record<string, { classifications: string[]; classificationBuoys: string[]; classificationMarks: string[] }>>({});
  const [viewBuoyOpen, setViewBuoyOpen] = useState(false);
  const [viewBuoyRecord, setViewBuoyRecord] = useState<Buoy | null>(null);
  const [viewBuoyFiles, setViewBuoyFiles] = useState<any[]>([]);

  // ── Detail Drawer ─────────────────────────────────────────────────
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<BuoyStationResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailFiles, setDetailFiles] = useState<any[]>([]);
  const [detailBuoys, setDetailBuoys] = useState<StationBuoySummary[]>([]);

  // ── Delete / Reject / Approve Modals ──────────────────────────────
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<BuoyStationResponse | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectingRecord, setRejectingRecord] = useState<BuoyStationResponse | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approveOpen, setApproveOpen] = useState(false);
  const [approvingRecord, setApprovingRecord] = useState<BuoyStationResponse | null>(null);
  const [approveLevel, setApproveLevel] = useState<'L1' | 'L2'>('L1');
  const [approvalContent, setApprovalContent] = useState('');
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submittingRecord, setSubmittingRecord] = useState<BuoyStationResponse | null>(null);

  // ── History Drawer ────────────────────────────────────────────────
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [historyRecord, setHistoryRecord] = useState<BuoyStationResponse | null>(null);
  const [historyData, setHistoryData] = useState<ChangeHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearchInput, setHistorySearchInput] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');
  const [historyMode, setHistoryMode] = useState<'current' | 'all'>('current');
  const [historyEntityNames, setHistoryEntityNames] = useState<Record<string, string>>({});
  const [historyEntityFilter, setHistoryEntityFilter] = useState('');
  const HISTORY_PAGE_SIZE = 10;
  const [historyPage, setHistoryPage] = useState(0);
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);

  const historyFieldCount = useMemo(() => historyData.length, [historyData]);

  // ── Create / Edit Drawer (Hợp nhất 1 Drawer chuẩn VTS CHK) ─────────
  const [createOpen, setCreateOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<BuoyStationResponse | null>(null);
  const [createForm] = Form.useForm();
  const [createUploaded, setCreateUploaded] = useState<UploadFile[]>([]);
  const [createExisting, setCreateExisting] = useState<ExistingFile[]>([]);
  const createFormRef = useRef<BuoyStationFormContentHandle>(null);

  // ── Load master data ──────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const r = await organizationService.list({ pageSize: 1000 });
        const data = r.data || [];
        setOrganizations(data);
        organizationsRef.current = data;
        // Đơn vị quản lý mặc định = đơn vị của user đang đăng nhập (giống BuoyListPage),
        // nếu không khớp hoặc user không có đơn vị thì lấy đơn vị đầu tiên
        if (data.length > 0 && !defaultOrgApplied.current) {
          defaultOrgApplied.current = true;
          try {
            const profileRes = await api.get('/users/me');
            const profile = profileRes.data?.data ?? profileRes.data;
            const userOrgId = profile?.orgUnitId;
            const match = userOrgId && data.find((o: any) => o.id === userOrgId);
            const defaultId = userOrgId ? (match ? userOrgId : data[0].id) : data[0].id;
            defaultOrgUnitId.current = defaultId;
            setManagingUnitId(defaultId);
            setFilterValues((prev) => ({ ...prev, managingUnitId: defaultId }));
          } catch {
            defaultOrgUnitId.current = data[0].id;
            setManagingUnitId(data[0].id);
            setFilterValues((prev) => ({ ...prev, managingUnitId: data[0].id }));
          }
        }
      } catch { /* */ }
    })();
    (async () => {
      try {
        const r = await userService.list({ pageSize: 1000 });
        const u = r.data || (r as any).content || [];
        const m = new Map<string, string>();
        u.forEach((x: any) => {
          const name = x.fullName || x.username || '';
          if (name && !isUuidString(name)) m.set(x.id, name);
        });
        setUserMap(m);
      } catch { /* */ }
    })();
    (async () => {
      try {
        const r = await portCRUD.findAll({ page: 1, size: 1000 });
        const m = new Map<string, string>();
        const list = r.data || (r as any).content || [];
        list.forEach((p: any) => { m.set(p.id, p.portName || p.name); });
        setPortMap(m);
      } catch { /* */ }
    })();
    symbolService.list({ page: 1, pageSize: 1000, status: 'active' })
      .then((r) => setSymbols(r.data || []))
      .catch(() => {});
    lineObjectService.list({ status: 'PUBLISHED', objectType: LineObject.ObjectType.WATERWAY, pageSize: 1000 })
      .then((r) => { const m = new Map<string, string>(); (r.data || []).forEach((l) => { m.set(l.id, l.name || l.code); }); setWaterwayMap(m); })
      .catch(() => {});
    lineObjectService.list({ status: 'PUBLISHED', objectType: LineObject.ObjectType.SHIPPING_ROUTE, pageSize: 1000 })
      .then((r) => { const m = new Map<string, string>(); (r.data || []).forEach((l) => { m.set(l.id, l.name || l.code); }); setRouteMap(m); })
      .catch(() => {});
  }, []);

  // ── Phân loại/Phân loại phao từ phao tiêu thuộc nhà trạm (CSV 34-35) ──
  useEffect(() => {
    (async () => {
      try {
        const buoys = await searchBuoys({});
        const m: Record<string, { classifications: string[]; classificationBuoys: string[]; classificationMarks: string[] }> = {};
        (buoys || []).forEach((b: any) => {
          if (!b.buoyStationId) return;
          if (!m[b.buoyStationId]) m[b.buoyStationId] = { classifications: [], classificationBuoys: [], classificationMarks: [] };
          const e = m[b.buoyStationId];
          if (b.classification && !e.classifications.includes(b.classification)) e.classifications.push(b.classification);
          if (b.classificationBuoy && !e.classificationBuoys.includes(b.classificationBuoy)) e.classificationBuoys.push(b.classificationBuoy);
          if (b.classificationMark && !e.classificationMarks.includes(b.classificationMark)) e.classificationMarks.push(b.classificationMark);
        });
        stationBuoysRef.current = m;
        setStationBuoys(m);
      } catch { /* */ }
    })();
  }, []);

  useEffect(() => {
    if (managingUnitId !== undefined && !initialLoadDone) {
      setInitialLoadDone(true);
    }
  }, [managingUnitId, initialLoadDone]);

  const symbolMap = useMemo(() => {
    const m = new Map<string, string>();
    symbols.forEach((s) => { m.set(s.id, s.name); });
    return m;
  }, [symbols]);
  const symbolImageMap = useMemo(() => {
    const m = new Map<string, string>();
    symbols.forEach((s) => { if (s.image) m.set(s.id, s.image); });
    return m;
  }, [symbols]);

  // ── Fetch list ────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true); setIsError(false);
    try {
      const res = await fetchBuoyStationList({
        name: filterName || undefined,
        code: filterCode || undefined,
        province: filterProvince || undefined,
        portId: filterPortId || undefined,
        updatedFrom: filterUpdatedFrom,
        updatedTo: filterUpdatedTo,
      });
      const all = res.content || [];
      // Lọc theo đơn vị quản lý (subtree — đơn vị cha thấy cả đơn vị con, chuẩn Cảng biển)
      const orgList = organizationsRef.current.length > 0 ? organizationsRef.current : organizations;
      const unitSubtree = managingUnitId ? collectOrgSubtreeIds(orgList, managingUnitId) : null;
      const scoped = unitSubtree ? all.filter((d) => d.unitId && unitSubtree.has(d.unitId)) : all;
      const counts: Record<string, number> = { all: scoped.length };
      TAB_STATUS_LIST.slice(1).forEach((t) => { counts[t.key] = scoped.filter((d) => d.status === t.key).length; });
      setTabCounts(counts);
      const sf = activeTab !== 'all' ? activeTab : undefined;
      let filtered = sf ? scoped.filter((d) => d.status === sf) : scoped;
      if (filterWaterwayId) filtered = filtered.filter((d) => d.waterwayId === filterWaterwayId);
      if (filterCondition) filtered = filtered.filter((d) => d.condition === filterCondition);
      const sBuoys = Object.keys(stationBuoysRef.current).length > 0 ? stationBuoysRef.current : stationBuoys;
      if (filterClassification && filterClassification.length) filtered = filtered.filter((d) => sBuoys[d.id]?.classifications?.some((c) => filterClassification.includes(c)));
      if (filterClassificationBuoy && filterClassificationBuoy.length) filtered = filtered.filter((d) => sBuoys[d.id]?.classificationBuoys?.some((c) => filterClassificationBuoy.includes(c)));
      if (filterClassificationMark && filterClassificationMark.length) filtered = filtered.filter((d) => sBuoys[d.id]?.classificationMarks?.some((c) => filterClassificationMark.includes(c)));
      setAllData(filtered); setTotal(filtered.length);
    } catch { setIsError(true); }
    finally { setIsLoading(false); }
  }, [filterName, filterCode, managingUnitId, filterProvince, filterPortId, filterWaterwayId, filterCondition, filterClassification, filterClassificationBuoy, filterClassificationMark, filterUpdatedFrom, filterUpdatedTo, activeTab]);

  useEffect(() => { if (initialLoadDone) void fetchData(); }, [fetchData, initialLoadDone]);

  // ── Client-side sort (tham khảo cơ chế sort của BuoyListPage) ─────
  const sortedAll = useMemo(() => {
    const arr = [...allData];
    if (!sortField) return arr;
    return arr.sort((a: any, b: any) => {
      let aVal: unknown; let bVal: unknown;
      if (sortField === 'classifications') {
        aVal = (stationBuoys[a.id]?.classifications || []).join(', ');
        bVal = (stationBuoys[b.id]?.classifications || []).join(', ');
      } else if (sortField === 'classificationBuoys') {
        aVal = (stationBuoys[a.id]?.classificationBuoys || []).join(', ');
        bVal = (stationBuoys[b.id]?.classificationBuoys || []).join(', ');
      } else if (sortField === 'classificationMarks') {
        aVal = (stationBuoys[a.id]?.classificationMarks || []).join(', ');
        bVal = (stationBuoys[b.id]?.classificationMarks || []).join(', ');
      } else if (sortField === 'unitId') {
        aVal = orgLevel2Map.get(a.unitId) ?? a.unitId ?? '';
        bVal = orgLevel2Map.get(b.unitId) ?? b.unitId ?? '';
      } else if (sortField === 'operatingOrgId') {
        aVal = DEFAULT_OPERATING_ORGANIZATIONS.find(o => o.id === a.operatingOrgId)?.name ?? a.operatingOrgId ?? '';
        bVal = DEFAULT_OPERATING_ORGANIZATIONS.find(o => o.id === b.operatingOrgId)?.name ?? b.operatingOrgId ?? '';
      } else if (sortField === 'portId') {
        aVal = portMap.get(a.portId) ?? a.portId ?? '';
        bVal = portMap.get(b.portId) ?? b.portId ?? '';
      } else if (sortField === 'waterwayId') {
        aVal = waterwayMap.get(a.waterwayId) ?? a.waterwayId ?? '';
        bVal = waterwayMap.get(b.waterwayId) ?? b.waterwayId ?? '';
      } else if (sortField === 'condition') {
        aVal = CONDITION_STYLE[a.condition || '']?.label ?? a.condition ?? '';
        bVal = CONDITION_STYLE[b.condition || '']?.label ?? b.condition ?? '';
      } else if (sortField === 'status') {
        aVal = APPROVAL_STYLE_MAP[a.status || '']?.label ?? a.status ?? '';
        bVal = APPROVAL_STYLE_MAP[b.status || '']?.label ?? b.status ?? '';
      } else if (sortField === 'updatedAt' || sortField === 'updatedBy' || sortField === 'updatedByName') {
        const at = a.updatedAt || a.createdAt;
        const bt = b.updatedAt || b.createdAt;
        aVal = at ? new Date(at).getTime() : 0;
        bVal = bt ? new Date(bt).getTime() : 0;
      } else if (sortField === 'sentApprovedDate') {
        aVal = a.sentApprovedDate ? new Date(a.sentApprovedDate).getTime() : 0;
        bVal = b.sentApprovedDate ? new Date(b.sentApprovedDate).getTime() : 0;
      } else if (sortField === 'level1ApprovedDate') {
        aVal = a.level1ApprovedDate ? new Date(a.level1ApprovedDate).getTime() : 0;
        bVal = b.level1ApprovedDate ? new Date(b.level1ApprovedDate).getTime() : 0;
      } else if (sortField === 'level2ApprovedDate') {
        aVal = a.level2ApprovedDate ? new Date(a.level2ApprovedDate).getTime() : 0;
        bVal = b.level2ApprovedDate ? new Date(b.level2ApprovedDate).getTime() : 0;
      } else {
        aVal = a[sortField] ?? '';
        bVal = b[sortField] ?? '';
      }
      const cmp = typeof aVal === 'number' && typeof bVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal), 'vi');
      return sortOrder === 'ascend' ? cmp : -cmp;
    });
  }, [allData, sortField, sortOrder, stationBuoys, orgLevel2Map, orgMap, portMap, waterwayMap]);

  useEffect(() => { setDataSource(sortedAll.slice((page - 1) * pageSize, page * pageSize)); }, [sortedAll, page, pageSize]);

  const handleSortChange = useCallback((key: string, order: 'asc' | 'desc') => {
    setSortField(key);
    setSortOrder(order === 'asc' ? 'ascend' : 'descend');
    setPage(1);
  }, []);

  const handleFilterApply = useCallback(() => {
    setManagingUnitId(filterValues.managingUnitId === '__all__' ? undefined : filterValues.managingUnitId || undefined);
    setFilterName((filterValues.name || '').trim());
    setFilterCode((filterValues.code || '').trim());
    setFilterProvince(filterValues.province || undefined);
    setFilterPortId(filterValues.portId || undefined);
    setFilterWaterwayId(filterValues.waterwayId || undefined);
    setFilterCondition(filterValues.condition || undefined);
    setFilterClassification(Array.isArray(filterValues.classification) && filterValues.classification.length > 0 ? filterValues.classification : undefined);
    setFilterClassificationBuoy(Array.isArray(filterValues.classificationBuoy) && filterValues.classificationBuoy.length > 0 ? filterValues.classificationBuoy : undefined);
    setFilterUpdatedFrom(filterValues.updatedFrom || undefined);
    setFilterUpdatedTo(filterValues.updatedTo || undefined);
    setPage(1);
    void fetchData();
  }, [filterValues, fetchData]);

  const handleFilterReset = useCallback(() => {
    const defaultOrg = defaultOrgUnitId.current === '__all__' ? undefined : defaultOrgUnitId.current;
    setFilterValues({ managingUnitId: defaultOrg });
    setManagingUnitId(defaultOrg);
    setFilterName('');
    setFilterCode('');
    setFilterProvince(undefined);
    setFilterPortId(undefined);
    setFilterWaterwayId(undefined); setFilterCondition(undefined);
    setFilterClassification(undefined); setFilterClassificationBuoy(undefined); setFilterClassificationMark(undefined);
    setFilterUpdatedFrom(undefined); setFilterUpdatedTo(undefined);
    setActiveTab('all'); setPage(1);
  }, []);

  // ── Detail ────────────────────────────────────────────────────────
  const openDetail = useCallback(async (r: BuoyStationResponse) => {
    setDetailOpen(true); setDetailRecord(r); setDetailLoading(true); setDetailFiles([]); setDetailBuoys([]);
    try {
      const f = await fetchBuoyStationById(r.id);
      setDetailRecord(f);
      try {
        const fr = await documentApi.listByEntity('buoy-station', f.id, { page: 1, size: 20 });
        setDetailFiles(fr.data || []);
      } catch { setDetailFiles([]); }
      try { setDetailBuoys(await fetchStationBuoys(f.id)); } catch { setDetailBuoys([]); }
    } catch { /* */ }
    finally { setDetailLoading(false); }
  }, []);

  const closeDetail = useCallback(() => { setDetailOpen(false); setDetailRecord(null); setDetailFiles([]); setDetailBuoys([]); }, []);

  const openBuoyDetail = useCallback(async (buoyId: string) => {
    setViewBuoyOpen(true);
    setViewBuoyFiles([]);
    setViewBuoyRecord(null);
    try {
      const b = await fetchBuoyById(buoyId);
      setViewBuoyRecord(b);
      try {
        const fr = await documentApi.listByEntity('buoy', buoyId, { page: 1, size: 20 });
        setViewBuoyFiles(fr.data || []);
      } catch { setViewBuoyFiles([]); }
    } catch { setViewBuoyRecord(null); }
  }, []);

  // ── History ───────────────────────────────────────────────────────
  const loadHistoryMode = useCallback(async (mode: 'current' | 'all', rec?: BuoyStationResponse | null) => {
    setHistoryLoading(true);
    const target = rec ?? historyRecord;
    try {
      if (mode === 'all') {
        const payload = await fetchBuoyStationAllHistory();
        setHistoryData(payload?.changeHistory || []);
        setHistoryEntityNames(payload?.entityNames || {});
      } else if (target) {
        const payload = await fetchBuoyStationHistory(target.id);
        setHistoryData(payload?.changeHistory || []);
      } else {
        setHistoryData([]);
      }
      setHistoryMode(mode);
      setHistoryPage(0);
      setLoadingMoreHistory(false);
    } catch { setHistoryData([]); }
    finally { setHistoryLoading(false); }
  }, [historyRecord]);

  const openHistoryDrawer = useCallback(async (r: BuoyStationResponse) => {
    setHistoryDrawerOpen(true);
    setHistoryRecord(r);
    setHistorySearchInput(''); setHistorySearch(''); setHistoryFrom(''); setHistoryTo(''); setHistoryEntityFilter('');
    setHistoryPage(0); setLoadingMoreHistory(false);
    await loadHistoryMode('current', r);
  }, [loadHistoryMode]);

  // ── Translate giá trị lịch sử ────────────────────────────────────
  const translateStationVal = useCallback((fn: string, val: string | null | undefined) => {
    if (!val || val === 'null' || val === '(null)') return '';
    if (fn === 'color') return COLOR_MAP[val] || val;
    if (fn === 'shape') return SHAPE_MAP[val] || val;
    if (fn === 'lightCharacteristic') return LIGHT_MAP[val] || val;
    if (fn === 'objectType') return GEO_MAP[val] || val;
    if (fn === 'coordinateSystem') return COORD_MAP[val] || val;
    if (fn === 'type') { const o = BUOY_TYPE_OPTIONS.find((x) => x.value === val); return o?.label || val; }
    if (fn === 'status') { const s = APPROVAL_STYLE_MAP[val]; return s?.label || val; }
    if (fn === 'approvalStatus') {
      const m: Record<string, string> = { DRAFT: 'Lưu tạm', PROPOSED: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', PENDING_APPROVAL: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', APPROVED_LEVEL1: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', APPROVED: 'Đã phê duyệt', REJECTED: 'Từ chối cấp Cảng vụ/Chi cục', REJECTED_LEVEL1: 'Từ chối cấp Cảng vụ/Chi cục', REJECTED_LEVEL2: 'Từ chối cấp cục' };
      return m[val] || val;
    }
    if (fn === 'approvalLevel') return val === 'LEVEL_1' ? 'Cấp Cảng vụ/Chi cục' : val === 'LEVEL_2' ? 'Cấp Cục' : val;
    if (fn === 'isActive') return val === 'true' ? 'Hoạt động' : 'Ngừng';
    if (fn === 'unitId' || fn === 'operatingOrgId') return orgMap.get(val) || val;
    if (fn === 'portId') return portMap.get(val) || val;
    if (fn === 'waterwayId') return waterwayMap.get(val) || val;
    if (fn === 'waterwayRouteId') return routeMap.get(val) || val;
    if (fn === 'icon') return symbolMap.get(val) || val;
    if (fn === 'sentApprovedBy' || fn === 'approvedBy' || fn === 'level1ApprovedBy' || fn === 'level2ApprovedBy' || fn === 'createdBy' || fn === 'updatedBy') return formatUserDisplayName(val, null, userMap);
    if (fn === 'constructionDate' || fn === 'lastInspectionDate' || fn === 'nextInspectionDate' || fn === 'lastRepairDate') {
      try { return dayjs(val).format('DD/MM/YYYY'); } catch { return val; }
    }
    if (fn === 'createdAt' || fn === 'updatedAt' || fn === 'sentApprovedDate' || fn === 'approvedDate' || fn === 'level1ApprovedDate' || fn === 'level2ApprovedDate') {
      try { return dayjs(val).format('DD/MM/YYYY HH:mm:ss'); } catch { return val; }
    }
    return val;
  }, [orgMap, portMap, waterwayMap, routeMap, symbolMap, userMap]);

  const actorName = useCallback((actor: string | undefined) => {
    if (!actor) return '';
    return formatUserDisplayName(actor, null, userMap);
  }, [userMap]);

  // ── Lịch sử: lọc client-side + cuộn vô hạn 10/trang (giữ NGUYÊN API fetchBuoyStationHistory — chỉ đổi render) ──
  const filteredHistory = useMemo(() => {
    const q = historySearch.toLowerCase().trim();
    return (Array.isArray(historyData) ? historyData : []).filter((r) => {
      if (q) {
        const fieldRaw = historyField(r);
        const fn = fieldRaw.toLowerCase();
        const ov = (historyOldValue(r) || '').toLowerCase();
        const nv = (historyNewValue(r) || '').toLowerCase();
        const label = stationFieldLabel(fieldRaw).toLowerCase();
        const tv = translateStationVal(fieldRaw, historyNewValue(r) || '').toLowerCase();
        if (!fn.includes(q) && !ov.includes(q) && !nv.includes(q) && !label.includes(q) && !tv.includes(q)) return false;
      }
      if (historyMode === 'all' && historyEntityFilter && r.entityId !== historyEntityFilter) return false;
      if (historyFrom || historyTo) {
        const cd = historyTimestamp(r).substring(0, 16);
        if (historyFrom && cd < historyFrom.replace(' ', 'T')) return false;
        if (historyTo && cd > historyTo.replace(' ', 'T') + ':59') return false;
      }
      return true;
    });
  }, [historyData, historySearch, historyFrom, historyTo, historyMode, historyEntityFilter, translateStationVal]);

  const visibleHistory = filteredHistory.slice(0, (historyPage + 1) * HISTORY_PAGE_SIZE);
  const canLoadMoreHistory = visibleHistory.length < filteredHistory.length;

  const loadMoreHistory = () => {    if (loadingMoreHistory || !canLoadMoreHistory) return;
    setLoadingMoreHistory(true);
    window.setTimeout(() => { setHistoryPage((p) => p + 1); setLoadingMoreHistory(false); }, 150);
  };

  const handleHistoryScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) loadMoreHistory();
  };

  const renderHistoryTimeline = (records: ChangeHistory[]) => {
    return renderStandardHistoryCards({
      records,
      fieldLabels: STATION_FIELD_LABEL_OVERRIDES,
      groupOrder: HISTORY_FIELD_ORDER,
      formatValue: (fn, raw) => {
        if ((fn === 'mapSymbolId' || fn === 'icon' || fn === 'Biểu tượng bản đồ' || fn === 'Biểu tượng') && raw && !isBlankOrDash(raw)) {
          const img = symbolImageMap.get(raw);
          const name = symbolMap.get(raw) || raw;
          return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {img ? <img src={img} alt="" style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 4 }} /> : null}
              {name}
            </span>
          );
        }
        const resolved = translateStationVal(fn, raw);
        if (NUMERIC_HISTORY_FIELDS.has(fn) && raw) {
          const t = String(raw).trim();
          if (/^-?\d+(\.\d+)?$/.test(t)) {
            return formatHistoryNumber(t);
          }
        }
        return isBlankOrDash(resolved) ? '' : resolved;
      },
      resolveUnitName: (rec) => {
        const uId = historyRecord?.unitId || rec.orgUnitId || (rec as any).unitId;
        const orgName = uId ? orgMap.get(uId) : undefined;
        return (orgName ? (orgName.split(' - ').pop() || orgName) : ((rec as any).orgUnitName || (rec as any).unitName)) || '';
      },
      emptyMessage: historySearch || historyFrom || historyTo ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận',
    });
  };

  // ── Delete / Approve / Reject handlers ────────────────────────────
  const openDelete = useCallback((r: BuoyStationResponse) => {
    setDeletingRecord(r);
    setDeleteOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deletingRecord) return;
    setDeleteLoading(true);
    try {
      await deleteBuoyStation(deletingRecord.id);
      toast.success('Đã xóa nhà trạm phao tiêu');
      setDeleteOpen(false);
      setDeletingRecord(null);
      setSortField('updatedAt');
      setSortOrder('descend');
      setPage(1);
      void fetchData();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Xóa thất bại');
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingRecord, fetchData]);

  const openSubmit = useCallback((r: BuoyStationResponse) => {
    setSubmittingRecord(r); setSubmitOpen(true);
  }, []);

  const handleConfirmSubmit = useCallback(async () => {
    if (!submittingRecord) return;
    try {
      await submitBuoyStationForApproval(submittingRecord.id);
      toast.success('Đã gửi phê duyệt');
      setSubmitOpen(false);
      setSubmittingRecord(null);
      setSortField('updatedAt');
      setSortOrder('descend');
      setPage(1);
      void fetchData();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Gửi thất bại'); }
  }, [submittingRecord, fetchData]);

  const openApprove = useCallback((r: BuoyStationResponse, level: 'L1' | 'L2') => {
    setApprovingRecord(r); setApproveLevel(level); setApprovalContent(''); setApproveOpen(true);
  }, []);

  const confirmApprove = useCallback(async (contentOverride?: string) => {
    if (!approvingRecord) return;
    const aid = currentUser?.userId;
    if (!aid) { toast.error('Không xác định được người dùng'); return; }
    try {
      const content = (contentOverride ?? approvalContent).trim() || undefined;
      if (approveLevel === 'L1') await approveBuoyStationL1(approvingRecord.id, aid, content);
      else await approveBuoyStationL2(approvingRecord.id, aid, content);
      toast.success(approveLevel === 'L1' ? 'Đã phê duyệt cấp 1' : 'Đã phê duyệt cấp 2 - Công bố');
      setApproveOpen(false);
      setApprovingRecord(null);
      setApprovalContent('');
      setSortField('updatedAt');
      setSortOrder('descend');
      setPage(1);
      void fetchData();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Thất bại'); }
  }, [approvingRecord, approveLevel, approvalContent, fetchData, currentUser]);

  const openReject = useCallback((r: BuoyStationResponse) => {
    setRejectingRecord(r); setRejectReason(''); setRejectOpen(true);
  }, []);

  const confirmReject = useCallback(async () => {
    if (!rejectingRecord) return;
    const rr = rejectReason.trim();
    if (!rr) { toast.error('Vui lòng nhập lý do từ chối'); return; }
    if (rr.length < 10) { toast.error('Lý do từ chối tối thiểu 10 ký tự'); return; }
    if (rr.length > 500) { toast.error('Lý do từ chối tối đa 500 ký tự'); return; }
    const aid = currentUser?.userId;
    if (!aid) { toast.error('Không xác định được người dùng'); return; }
    try {
      await rejectBuoyStation(rejectingRecord.id, rr, aid);
      toast.success('Đã từ chối phê duyệt');
      setRejectOpen(false);
      setRejectingRecord(null);
      setRejectReason('');
      setSortField('updatedAt');
      setSortOrder('descend');
      setPage(1);
      void fetchData();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Thất bại'); }
  }, [rejectingRecord, rejectReason, fetchData, currentUser]);

  // ── Create / Edit ─────────────────────────────────────────────────
  const openCreate = useCallback(() => {
    setEditRecord(null);
    setCreateUploaded([]);
    setCreateExisting([]);
    createForm.resetFields();
    setCreateOpen(true);
  }, [createForm]);

  const openEdit = useCallback(async (r: BuoyStationResponse) => {
    setEditRecord(r);
    setCreateUploaded([]);
    setCreateExisting([]);
    createForm.resetFields();
    setCreateOpen(true);
    try {
      const f = await fetchBuoyStationById(r.id);
      setEditRecord(f);
      try {
        const fr = await api.get(`/v1/documents/entity/buoy-station/${r.id}`, { params: { page: 0, size: 50 } });
        setCreateExisting(fr.data?.data?.content || fr.data?.data || []);
      } catch { setCreateExisting([]); }
    } catch { toast.error('Không thể tải thông tin'); }
  }, [createForm]);

  // ── Columns ───────────────────────────────────────────────────────
  const columns = useMemo<DataTableColumn[]>(() => [
    {
      key: 'seq', label: 'STT', width: 60, fixed: 'left' as const, align: 'center' as const,
      render: (_: unknown, __: BuoyStationResponse, idx?: number) => (
        <span style={{ fontSize: fontSizeMd }}>{(page - 1) * pageSize + (idx ?? 0) + 1}</span>
      ),
    },
    {
      key: 'name', label: 'Tên/Mã nhà trạm', dataIndex: 'name', width: 280, fixed: 'left' as const, ellipsis: false, sortable: true,
      render: (name: string, record: BuoyStationResponse) => (
        <div>
          <a title={name} onClick={() => void openDetail(record)} style={{ ...cellTitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</a>
          <span title={record.code} style={{ ...cellSubtitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.code || ''}</span>
        </div>
      ),
    },
    {
      key: 'unitId', label: 'Đơn vị quản lý', dataIndex: 'unitId', width: 260, ellipsis: true, sortable: true,
      render: (v: string) => {
        const level2 = v ? orgLevel2Map.get(v) : undefined;
        return <span style={{ fontWeight: fontWeightBold }}>{level2 || v || ''}</span>;
      },
    },
    {
      key: 'classifications', label: 'Phân loại', width: 140, ellipsis: true, sortable: true,
      render: (_: unknown, record: BuoyStationResponse) => {
        const arr = stationBuoys[record.id]?.classifications || [];
        return arr.length ? arr.join(', ') : '';
      },
    },
    {
      key: 'classificationBuoys', label: 'Phân loại phao', width: 170, ellipsis: true, sortable: true,
      render: (_: unknown, record: BuoyStationResponse) => {
        const arr = stationBuoys[record.id]?.classificationBuoys || [];
        return arr.length ? arr.join(', ') : '';
      },
    },
    {
      key: 'classificationMarks', label: 'Phân loại tiêu', width: 170, ellipsis: true, sortable: true,
      render: (_: unknown, record: BuoyStationResponse) => {
        const arr = stationBuoys[record.id]?.classificationMarks || [];
        return arr.length ? arr.join(', ') : '';
      },
    },
    {
      key: 'operatingOrgId', label: 'Đơn vị khai thác', dataIndex: 'operatingOrgId', width: 220, ellipsis: true, sortable: true,
      render: (v: string) => (v ? (DEFAULT_OPERATING_ORGANIZATIONS.find(o => o.id === v)?.name || v) : ''),
    },
    {
      key: 'portId', label: 'Thuộc cảng biển', dataIndex: 'portId', width: 220, ellipsis: true, sortable: true,
      render: (v: string) => (v ? (portMap.get(v) || v) : ''),
    },
    {
      key: 'waterwayId', label: 'Thuộc luồng hàng hải', dataIndex: 'waterwayId', width: 280, ellipsis: true, sortable: true,
      render: (v: string) => (v ? (waterwayMap.get(v) || v) : ''),
    },
    {
      key: 'province', label: 'Địa điểm (Tỉnh/Thành phố)', dataIndex: 'province', width: 250, sortable: true,
      render: (v: string) => (v || ''),
    },
    {
      key: 'condition', label: 'Tình trạng', dataIndex: 'condition', width: 230, sortable: true,
      render: (v: string) => { const s = v && CONDITION_STYLE[v]; return s ? <span style={statusBadgeStyle(s.color)}>{s.label}</span> : null; },
    },
    {
      key: 'status', label: 'Trạng thái', dataIndex: 'status', width: 260, sortable: true,
      render: (s: string) => {
        if (!s) return null;
        const m = APPROVAL_STYLE_MAP[s];
        return m ? <span style={statusBadgeStyle(m.color)}>{m.label}</span> : null;
      },
    },
    {
      key: 'updatedAt', label: 'Cán bộ cập nhật', dataIndex: 'updatedAt', width: 200, ellipsis: true, sortable: true,
      render: (v: string, record: BuoyStationResponse) => {
        const name = formatUserDisplayName((record as any).updatedBy, (record as any).updatedByName, userMap, (record as any).createdBy, (record as any).createdByName);
        const date = fmt(v);
        if (!name && !date) return '';
        return (
          <div>
            {name && <span style={{ fontWeight: fontWeightBold }}>{name}</span>}
            {name && date && <br />}
            {date && <span style={{ opacity: 0.85 }}>{date}</span>}
          </div>
        );
      },
    },
    {
      key: 'sentApprovedDate', label: 'Cán bộ gửi phê duyệt', dataIndex: 'sentApprovedDate', width: 210, ellipsis: true, sortable: true,
      render: (v: string, record: BuoyStationResponse) => {
        const name = record.sentApprovedBy != null ? actorName(record.sentApprovedBy) : '';
        const cleanName = (name === '—' || name === '-') ? '' : name;
        const date = v ? fmt(v) : '';
        const cleanDate = (date === '—' || date === '-') ? '' : date;
        if (!cleanName && !cleanDate) return '';
        return (
          <div>
            {cleanName && <span style={{ fontWeight: fontWeightBold }}>{cleanName}</span>}
            {cleanName && cleanDate && <br />}
            {cleanDate && <span style={{ opacity: 0.85 }}>{cleanDate}</span>}
          </div>
        );
      },
    },
    {
      key: 'level1ApprovedDate', label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục', dataIndex: 'level1ApprovedDate', width: 340, ellipsis: true, sortable: true,
      render: (v: string, record: BuoyStationResponse) => {
        const name = record.level1ApprovedBy != null ? actorName(record.level1ApprovedBy) : '';
        const cleanName = (name === '—' || name === '-') ? '' : name;
        const date = v ? fmt(v) : '';
        const cleanDate = (date === '—' || date === '-') ? '' : date;
        if (!cleanName && !cleanDate) return '';
        return (
          <div>
            {cleanName && <span style={{ fontWeight: fontWeightBold }}>{cleanName}</span>}
            {cleanName && cleanDate && <br />}
            {cleanDate && <span style={{ opacity: 0.85 }}>{cleanDate}</span>}
          </div>
        );
      },
    },
    {
      key: 'level2ApprovedDate', label: 'Cán bộ phê duyệt cấp Cục', dataIndex: 'level2ApprovedDate', width: 240, ellipsis: true, sortable: true,
      render: (v: string, record: BuoyStationResponse) => {
        const name = record.level2ApprovedBy != null ? actorName(record.level2ApprovedBy) : '';
        const cleanName = (name === '—' || name === '-') ? '' : name;
        const date = v ? fmt(v) : '';
        const cleanDate = (date === '—' || date === '-') ? '' : date;
        if (!cleanName && !cleanDate) return '';
        return (
          <div>
            {cleanName && <span style={{ fontWeight: fontWeightBold }}>{cleanName}</span>}
            {cleanName && cleanDate && <br />}
            {cleanDate && <span style={{ opacity: 0.85 }}>{cleanDate}</span>}
          </div>
        );
      },
    },
  ].map((col) => ({
    ...col,
    sortOrder: col.sortable ? ((col.key === sortField || col.dataIndex === sortField) ? sortOrder : null) : undefined,
  })), [page, pageSize, orgMap, orgLevel2Map, portMap, waterwayMap, actorName, openDetail, stationBuoys, sortField, sortOrder]);

  // ── rowActions callback (Port pattern) ──────────────────────────
  // Thứ tự: Xem chi tiết → Chỉnh sửa → Xem vị trí → Lịch sử → Phê duyệt/Từ chối → Xóa
  const rowActions = useCallback((r: BuoyStationResponse) => {
    const a: any[] = [];
    a.push({ key: 'view', label: 'Xem chi tiết', icon: icons.view, onClick: () => void openDetail(r) });
    // Quy tắc 12 (approval-2-level-spec.md mục 3.9)
    if (canEditApprovalRecord(r.status, { hasPerm, resource: 'buoystation', extraUpdatePerms: ['data:update', 'admin:manage'], extraApprovePerms: ['admin:manage'] })) a.push({ key: 'edit', label: 'Chỉnh sửa', icon: icons.edit, onClick: () => void openEdit(r) });
    if (r.latitude != null && r.longitude != null) a.push({ key: 'loc', label: 'Xem vị trí', icon: icons.location, onClick: () => window.open(`https://www.google.com/maps?q=${r.latitude},${r.longitude}`, '_blank') });
    // Lịch sử — luôn hiển thị khi có quyền
    a.push({ key: 'history', label: 'Lịch sử', icon: icons.history, onClick: () => void openHistoryDrawer(r) });
    // Phê duyệt / Từ chối — theo trạng thái
    if ((hasPerm('buoystation:create') || hasPerm('buoystation:update') || hasPerm('data:create') || hasPerm('data:update') || hasPerm('admin:manage')) && (r.status === 'DRAFT' || r.status === 'NHAP')) a.push({ key: 'submit', label: 'Gửi Cảng vụ phê duyệt', icon: icons.submit, onClick: () => openSubmit(r) });
    if ((hasPerm('buoystation:create') || hasPerm('buoystation:update') || hasPerm('data:create') || hasPerm('data:update') || hasPerm('admin:manage')) && (r.status === 'REJECTED' || r.status === 'REJECTED_L1' || r.status === 'REJECTED_L2')) a.push({ key: 'resubmit', label: 'Gửi lại phê duyệt', icon: icons.submit, onClick: () => openSubmit(r) });
    const canApproveL1 = hasPerm('buoystation:approvec1') || hasPerm('buoystation:approvel1') || hasPerm('data:approvec1') || hasPerm('data:approvel1') || hasPerm('admin:manage');
    const canApproveL2 = hasPerm('buoystation:approvec2') || hasPerm('buoystation:approvel2') || hasPerm('data:approvec2') || hasPerm('data:approvel2') || hasPerm('admin:manage');
    if (canApproveL1 && r.status === 'PENDING_APPROVAL') {
      a.push({ key: 'appL1', label: 'Cảng vụ phê duyệt', icon: icons.approve, onClick: () => openApprove(r, 'L1') });
      a.push({ key: 'rej', label: 'Từ chối', icon: icons.reject, onClick: () => openReject(r), danger: true });
    }
    if (canApproveL2 && r.status === 'APPROVED_L1') {
      a.push({ key: 'appL2', label: 'Cục phê duyệt', icon: icons.approve, onClick: () => openApprove(r, 'L2') });
      a.push({ key: 'rej', label: 'Từ chối', icon: icons.reject, onClick: () => openReject(r), danger: true });
    }
    // Xóa: chỉ trạng thái DRAFT/NHAP — luôn ở cuối cùng
    if ((hasPerm('buoystation:delete') || hasPerm('data:delete') || hasPerm('admin:manage')) && (r.status === 'DRAFT' || r.status === 'NHAP')) a.push({ key: 'del', label: 'Xóa', icon: icons.delete, onClick: () => openDelete(r), danger: true });
    return a;
  }, [hasPerm, openEdit, openDetail, openHistoryDrawer, openSubmit, openApprove, openReject, openDelete]);

  // ── Render ────────────────────────────────────────────────────────
  return (
    <ThemeTokenProvider tokens={themeTokenChk}>
    <div className="buoy-station-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <style>{`
        .range-single-panel .ant-picker-panel-container .ant-picker-panel:last-child { display: none !important; }

        /* ── Cỡ chữ 13.5px chuẩn toàn màn Nhà trạm Phao, tiêu & các popup/drawer con ── */
        .buoy-station-page-wrapper,
        .buoy-station-page-wrapper .ant-table,
        .buoy-station-page-wrapper .ant-table-cell,
        .buoy-station-page-wrapper .ant-table-thead > tr > th,
        .buoy-station-page-wrapper .ant-table-tbody > tr > td,
        .buoy-station-page-wrapper .ant-input,
        .buoy-station-page-wrapper .ant-select,
        .buoy-station-page-wrapper .ant-select-selection-item,
        .buoy-station-page-wrapper .ant-select-item-option-content,
        .buoy-station-page-wrapper .ant-picker,
        .buoy-station-page-wrapper .ant-picker-input > input,
        .buoy-station-page-wrapper .ant-btn,
        .buoy-station-page-wrapper .ant-pagination,
        .buoy-station-page-wrapper .ant-pagination-item,
        .buoy-station-page-wrapper .ant-pagination-total-text,
        .buoy-station-page-wrapper .ant-breadcrumb,
        .buoy-station-page-wrapper .ant-form-item-label > label,
        .buoy-station-drawer-scope,
        .buoy-station-drawer-scope .ant-drawer-content,
        .buoy-station-drawer-scope .ant-tabs-tab,
        .buoy-station-drawer-scope .chk-detail-label,
        .buoy-station-drawer-scope .chk-detail-value,
        .buoy-station-drawer-scope .ant-table,
        .buoy-station-drawer-scope .ant-table-cell,
        .buoy-station-drawer-scope .ant-table-thead > tr > th,
        .buoy-station-drawer-scope .ant-btn,
        .buoy-station-drawer-scope .ant-select,
        .buoy-station-drawer-scope .ant-input,
        .buoy-station-drawer-scope .ant-form-item-label > label,
        .buoy-station-modal-scope,
        .buoy-station-modal-scope .ant-modal-content,
        .buoy-station-modal-scope .ant-btn,
        .buoy-station-modal-scope .ant-input {
          font-size: 13.5px !important;
        }

        /* ── Responsive StatusTabs: Căn giữa khi đủ chỗ, thanh cuộn ngang khi tràn màn hình ── */
        .buoy-station-page-wrapper div:has(> button[aria-pressed]) {
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
        .buoy-station-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar {
          height: 6px !important;
          display: block !important;
        }
        .buoy-station-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-track {
          background: #f1f5f9 !important;
          border-radius: 999px !important;
        }
        .buoy-station-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb {
          background: #cbd5e1 !important;
          border-radius: 999px !important;
        }
        .buoy-station-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb:hover {
          background: #94a3b8 !important;
        }
        .buoy-station-page-wrapper div:has(> button[aria-pressed]) > button {
          flex-shrink: 0 !important;
        }
      `}</style>
      <ScreenHeader
        breadcrumb={[{ label: 'Báo hiệu hàng hải' }, { label: 'Nhà trạm Phao, tiêu' }]}
        actions={[{ key: 'create', label: 'Thêm mới', variant: 'primary' as const, icon: icons.create, onClick: openCreate }]}
      />
      <FilterTableLayout
        filterCollapsed={filterCollapsed}
        onToggleCollapse={() => setFilterCollapsed(!filterCollapsed)}
        hideFilterToggle={true}
        onFilterApply={handleFilterApply}
        onFilterReset={handleFilterReset}
        loading={isLoading}
        error={isError}
        onRetry={fetchData}
        filterContent={<>
          <div style={{ marginBottom: 12, marginTop: spaceMd }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Đơn vị quản lý</div>
            <OrgUnitTreeSelect
              organizations={organizations}
              placeholder="Chọn đơn vị..."
              allowClear
              showPath
              allLabel="Tất cả"
              treeDefaultExpandAll={false}
              value={filterValues.managingUnitId || undefined}
              onChange={(val) => setFilterValues((prev) => ({ ...prev, managingUnitId: val }))}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tên nhà trạm</div>
            <Input placeholder="Tìm theo tên nhà trạm..." allowClear
              value={filterValues.name || ''}
              onChange={(e) => setFilterValues((prev) => ({ ...prev, name: e.target.value }))}
              onPressEnter={handleFilterApply}
              style={{ borderRadius: radiusPill, height: 40 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Thuộc cảng biển</div>
            <Select placeholder="Chọn cảng biển" allowClear showSearch optionFilterProp="label"
              value={filterValues.portId || undefined}
              onChange={(val) => setFilterValues((prev) => ({ ...prev, portId: val }))}
              options={Array.from(portMap.entries()).map(([id, name]) => ({ value: id, label: name }))}
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Thuộc luồng hàng hải</div>
            <Select placeholder="Chọn luồng hàng hải" allowClear showSearch optionFilterProp="label"
              value={filterValues.waterwayId || undefined}
              onChange={(val) => setFilterValues((prev) => ({ ...prev, waterwayId: val }))}
              options={Array.from(waterwayMap.entries()).map(([id, name]) => ({ value: id, label: name }))}
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Mã nhà trạm</div>
            <Input placeholder="Tìm theo mã nhà trạm..." allowClear
              value={filterValues.code || ''}
              onChange={(e) => setFilterValues((prev) => ({ ...prev, code: e.target.value }))}
              onPressEnter={handleFilterApply}
              style={{ borderRadius: radiusPill, height: 40 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Phân loại</div>
            <Select mode="multiple" className="buoy-station-filter" placeholder="Tìm kiếm phân loại..." allowClear showSearch
              maxTagCount={2}
              maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}`}
              value={filterValues.classification || undefined}
              onChange={(val) => setFilterValues((prev) => ({ ...prev, classification: val }))}
              options={CLASSIFICATION_OPTIONS}
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Phân loại phao</div>
            <Select mode="multiple" className="buoy-station-filter" placeholder="Tìm kiếm phân loại phao..." allowClear showSearch
              maxTagCount={2}
              maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}`}
              value={filterValues.classificationBuoy || undefined}
              onChange={(val) => setFilterValues((prev) => ({ ...prev, classificationBuoy: val }))}
              options={CLASSIFICATION_BUOY_OPTIONS}
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Địa điểm (Tỉnh/Thành Phố)</div>
            <Select placeholder="Chọn tỉnh/thành phố" allowClear showSearch
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              value={filterValues.province || undefined}
              onChange={(val) => setFilterValues((prev) => ({ ...prev, province: val }))}
              options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))}
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Ngày cập nhật</div>
            <DatePicker.RangePicker className="range-single-panel" popupClassName="range-single-panel" format="DD/MM/YYYY"
              placeholder={['Từ ngày', 'Đến ngày']} allowClear
              value={[filterValues.updatedFrom ? dayjs(filterValues.updatedFrom) : null, filterValues.updatedTo ? dayjs(filterValues.updatedTo) : null]}
              onChange={(dates) => setFilterValues((prev) => ({
                ...prev,
                updatedFrom: dates?.[0] ? dates[0].format('YYYY-MM-DD 00:00:00') : undefined,
                updatedTo: dates?.[1] ? dates[1].format('YYYY-MM-DD 23:59:59') : undefined,
              }))}
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tình trạng</div>
            <Select placeholder="Tất cả" allowClear
              value={filterValues.condition || undefined}
              onChange={(val) => setFilterValues((prev) => ({ ...prev, condition: val }))}
              options={CONDITION_OPTIONS}
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
          </div>
        </>}
        statusTabs={TAB_STATUS_LIST.map((tab) => ({
          key: tab.key,
          label: tab.label,
          count: tabCounts[tab.key] ?? 0,
          color: tab.color,
          active: activeTab === tab.key,
        }))}
        onStatusTabChange={(key: string) => { setActiveTab(key); setPage(1); }}
      >
        {isError ? null : (
          <DataTable
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            rowActions={rowActions}
            loading={false}
            onSort={handleSortChange}
            scroll={{ x: 'max-content' }}
          />
        )}
        <Pagination total={total} current={page} pageSize={pageSize} onChange={(p, ps) => { setPage(p); setPageSize(ps); }} />
      </FilterTableLayout>

      {/* ── Detail Drawer ──────────────────────────────────────────── */}
      <AppDrawer
        width="min(1000px, 96vw)"
        rootClassName="buoy-station-drawer-scope"
        className="buoy-station-drawer-scope"
        title={<span style={drawerTitleStyle}>{detailRecord ? `Chi tiết thông tin nhà trạm quản lý vận hành phao, tiêu - ${detailRecord.name}` : 'Chi tiết thông tin nhà trạm quản lý vận hành phao, tiêu'}</span>}
        open={detailOpen}
        onClose={closeDetail}
        footer={null}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px' },
        }}
      >
        {detailLoading ? <LoadingSkeleton rows={6} /> : detailRecord ? (
          <BuoyStationDetailContent
            selectedRecord={detailRecord}
            orgUnits={organizations}
            portMap={portMap}
            userMap={userMap}
            detailFiles={detailFiles}
            detailBuoys={detailBuoys}
            onViewBuoy={openBuoyDetail}
            waterwayMap={waterwayMap}
            routeMap={routeMap}
            ddToDms={ddToDms}
            symbolMap={symbolMap}
            symbolImageMap={symbolImageMap}
          />
        ) : null}
      </AppDrawer>

      {/* ── Buoy Detail Drawer (nested — đè lên chi tiết nhà trạm) ── */}
      <AppDrawer
        width="min(950px, 96vw)"
        rootClassName="buoy-station-drawer-scope"
        className="buoy-station-drawer-scope"
        title={<span style={drawerTitleStyle}>{viewBuoyRecord ? `Chi tiết phao tiêu - ${viewBuoyRecord.name}` : 'Chi tiết phao tiêu'}</span>}
        open={viewBuoyOpen}
        onClose={() => setViewBuoyOpen(false)}
        footer={null}
        styles={{ header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 }, body: { padding: '0 24px 12px 24px' } }}
      >
        {viewBuoyRecord ? (
          <BuoyDetailContent
            selectedRecord={viewBuoyRecord}
            orgUnits={organizations}
            userMap={userMap}
            detailFiles={viewBuoyFiles}
            buoyStatusBadge={buoyStatusBadge}
            symbolMap={symbolMap}
            symbolImageMap={symbolImageMap}
            ddToDms={ddToDms}
          />
        ) : <LoadingSkeleton rows={6} />}
      </AppDrawer>

      {/* ── History Drawer ─────────────────────────────────────────── */}
      <AppDrawer
        width="min(880px, 96vw)"
        rootClassName="buoy-station-drawer-scope"
        className="buoy-station-drawer-scope"
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Space size={spaceSm} style={{ alignItems: 'center' }}>
              <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
              <span style={drawerTitleStyle}>
                {historyMode === 'all' ? 'Tất cả lịch sử thay đổi — Nhà trạm Phao, tiêu' : (historyRecord ? `Lịch sử thay đổi — ${historyRecord.name}` : 'Lịch sử thay đổi')}
              </span>
              <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeLg - 1, fontWeight: fontWeightBold, background: `${colors.sidebarBg}15`, color: colors.sidebarBg, lineHeight: '20px' }}>Tổng cộng {historyFieldCount}</span>
            </Space>
          </div>
        }
        open={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        footer={null}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '12px 24px 12px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
        }}
      >
        <style>{`.history-dt-popup .ant-picker-now-btn { color: ${actionPrimary} !important; }`}</style>
        {!historyLoading && (
          <div style={{ display: 'none' }}>
            <Radio.Group value={historyMode} size="middle" style={{ display: 'flex', width: '100%', borderBottom: `1px solid ${borderDefault}`, marginBottom: spaceMd }}
              onChange={(e) => void loadHistoryMode(e.target.value)}>
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
            {historyMode === 'all' && (
              <Select placeholder="Chọn nhà trạm" allowClear showSearch value={historyEntityFilter || undefined}
                onChange={(v) => { setHistoryEntityFilter(v || ''); setHistoryPage(0); }}
                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                style={{ width: 200, borderRadius: radiusPill, height: 40 }}
                options={Object.entries(historyEntityNames).map(([id, name]) => ({ value: id, label: name }))} />
            )}
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
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }} onScroll={handleHistoryScroll}>
          {historyLoading ? <LoadingSkeleton rows={5} /> : visibleHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
              <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
              <div style={{ color: textTertiary, fontSize: fontSizeMd }}>Chưa có thay đổi nào được ghi nhận</div>
            </div>
          ) : (<>
            {renderHistoryTimeline(visibleHistory)}
            {loadingMoreHistory && <div style={{ textAlign: 'center', padding: `${spaceMd}px 0`, color: textTertiary, fontSize: fontSizeMd }}>Đang tải thêm...</div>}
          </>)}
        </div>
      </AppDrawer>

      {/* ── Delete Modal ───────────────────────────────────────────── */}
      <DeleteConfirmModal
        open={deleteOpen}
        onCancel={() => {
          if (!deleteLoading) {
            setDeleteOpen(false);
            setDeletingRecord(null);
          }
        }}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        itemType="nhà trạm phao tiêu"
        itemName={deletingRecord?.name}
        itemCode={deletingRecord?.code}
      />

      {/* ── Submit Approval Modal ──────────────────────────────────── */}
      <Modal
        rootClassName="buoy-station-modal-scope"
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Xác nhận gửi Cảng vụ phê duyệt</span>}
        open={submitOpen}
        onCancel={() => { setSubmitOpen(false); setSubmittingRecord(null); }}
        footer={[
          <Button key="cancel" onClick={() => { setSubmitOpen(false); setSubmittingRecord(null); }} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="submit" type="primary" onClick={handleConfirmSubmit} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>Xác nhận</Button>,
        ]}
        width={480}
      >
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary }}>
            Gửi <strong>{submittingRecord?.code} — {submittingRecord?.name}</strong> để Cảng vụ phê duyệt?
          </p>
        </div>
      </Modal>

      {/* ── Approve Modal (chuẩn VTS CHK) ─────────────────────────── */}
      <ApprovalModal
        visible={approveOpen}
        level={approveLevel === 'L2' ? 'c2' : 'c1'}
        onConfirm={(content) => { if (approvingRecord) void confirmApprove(content); }}
        onCancel={() => { setApproveOpen(false); setApprovingRecord(null); setApprovalContent(''); }}
      />

      {/* ── Reject Modal ───────────────────────────────────────────── */}
      <Modal
        rootClassName="buoy-station-modal-scope"
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Từ chối phê duyệt</span>}
        open={rejectOpen}
        onCancel={() => { setRejectOpen(false); setRejectingRecord(null); }}
        width={480}
        footer={[
          <Button key="cancel" onClick={() => { setRejectOpen(false); setRejectingRecord(null); }} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="rej" type="primary" danger onClick={confirmReject} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Xác nhận từ chối</Button>,
        ]}
      >
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>Vui lòng nhập lý do từ chối cho nhà trạm phao tiêu:</p>
          {rejectingRecord && <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}><strong style={{ color: textPrimary }}>{rejectingRecord.name}</strong></p>}
          <Input.TextArea placeholder="Nhập lý do (tối thiểu 10, tối đa 500 ký tự)..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} maxLength={500} showCount style={{ borderRadius: 8, fontSize: fontSizeMd }} />
        </div>
      </Modal>

      {/* ── Create / Edit Drawer (Hợp nhất 1 Drawer chuẩn Cầu cảng / VTS CHK) ── */}
      <AppDrawer
        width="min(920px, 96vw)"
        rootClassName="buoy-station-drawer-scope"
        className="buoy-station-drawer-scope"
        title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>{editRecord ? `Chỉnh sửa thông tin nhà trạm quản lý vận hành phao, tiêu — ${editRecord.name || ''}` : 'Thêm mới thông tin nhà trạm quản lý vận hành phao, tiêu'}</span>}
        open={createOpen}
        destroyOnHidden
        onClose={() => { setCreateOpen(false); setCreateUploaded([]); setCreateExisting([]); createForm.resetFields(); }}
        afterOpenChange={(open) => { if (!open) { setEditRecord(null); } }}
        footer={
          <div style={drawerFooterStyle}>
            {(() => {
              const st = !editRecord ? 'DRAFT' : (editRecord.status ? String(editRecord.status).toUpperCase() : 'DRAFT');
              if (st === 'PUBLISHED' || st === 'APPROVED' || st === 'APPROVED_L2') {
                return (
                  <Button
                    htmlType="button"
                    type="primary"
                    onClick={() => createFormRef.current?.submit('APPROVED')}
                    style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}
                  >
                    Lưu và phê duyệt
                  </Button>
                );
              }
              if (st === 'REJECTED' || st === 'REJECTED_L1' || st === 'REJECTED_L2') {
                return (
                  <Button
                    htmlType="button"
                    type="primary"
                    onClick={() => createFormRef.current?.submit('SUBMIT')}
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
                    onClick={() => createFormRef.current?.submit('DRAFT')}
                    style={outlineButtonStyle}
                  >
                    Lưu tạm
                  </Button>
                  <Button
                    htmlType="button"
                    type="primary"
                    onClick={() => createFormRef.current?.submit('SUBMIT')}
                    style={primaryButtonStyle}
                  >
                    Lưu và gửi phê duyệt
                  </Button>
                  <Button
                    htmlType="button"
                    type="primary"
                    onClick={() => createFormRef.current?.submit('APPROVED')}
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
      >
        <style>{requiredMarkStyle}</style>
        <Form form={createForm} layout="vertical" scrollToFirstError>
          <BuoyStationFormContent
            ref={createFormRef}
            form={createForm}
            isEdit={!!editRecord}
            entityData={editRecord || undefined}
            uploadedFiles={createUploaded}
            setUploadedFiles={setCreateUploaded}
            existingFiles={createExisting}
            organizations={organizations}
            userMap={userMap}
            onFinish={() => {
              setCreateOpen(false);
              setCreateUploaded([]);
              setCreateExisting([]);
              createForm.resetFields();
              setSortField('updatedAt');
              setSortOrder('descend');
              setPage(1);
              void fetchData();
            }}
          />
        </Form>
      </AppDrawer>
    </div>
    </ThemeTokenProvider>
  );
}

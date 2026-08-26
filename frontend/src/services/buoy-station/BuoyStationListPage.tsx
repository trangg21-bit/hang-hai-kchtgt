// ── BuoyStationList — list screen + Drawers/Modals (chuẩn /services/buoy/BuoyListPage) ──
// Danh sách nhà trạm phao tiêu: filter + tabs trạng thái + client-side pagination
// + Drawer create/edit/detail/history + reject/delete/approve Modals.

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Button, Modal, Input, Alert, Space, Drawer, Form, DatePicker, Select, Radio, Typography,
} from 'antd';
import type { UploadFile } from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined,
  EyeOutlined, HistoryOutlined, ExclamationCircleOutlined, EnvironmentOutlined, SearchOutlined,
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
import { CONDITION_OPTIONS, CLASSIFICATION_OPTIONS, CLASSIFICATION_BUOY_OPTIONS, CLASSIFICATION_MARK_OPTIONS } from '../buoy/schema';
import BuoyStationFormContent from './BuoyStationFormContent';
import type { ExistingFile, BuoyStationFormContentHandle } from './BuoyStationFormContent';
import BuoyStationDetailContent from './BuoyStationDetailContent';
import { ScreenHeader, DataTable } from '../../components/list-view';
import type { DataTableColumn } from '../../components/list-view/DataTable';
import Pagination from '../../components/list-view/Pagination';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import toast from '../../components/ToastNotification';
import { VIETNAM_PROVINCES } from '../../types/common';
import {
  statusOperational, statusAttention, statusCritical, actionPrimary,
  textPrimary, textSecondary, textTertiary, borderDefault,
  fontSizeMd, fontSizeLg, fontWeightMedium, fontWeightBold,
  spaceMd, spaceSm, spaceXs, spaceXl, spaceFormField, radiusPill,
  drawerProps, drawerTitleStyle, drawerCloseBtnStyle, drawerFooterStyle,
  primaryButtonStyle, outlineButtonStyle, requiredMarkStyle,
  historyGroupGridStyle, historyTimeStyle, historyMetaRowStyle, historyInfoCardStyle,
  historyAccentBarStyle, historyInfoTitleStyle, historyCreateRowStyle, historyChangeRowStyle,
  historyFieldLabelStyle, historyOldValueStyle, historyNewValueStyle, historyArrowStyle,
  historyBadgeStyle,
} from '../../tokens';
import { colors } from '../../theme';
import { OrgUnitTreeSelect, resolveOrgLevel2Name } from '../../components/org-unit';
import { canEditApprovalRecord } from '../../utils/approvalEditPolicy';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import { APPROVAL_STATUS_OPTIONS } from '../../components/shared/ApprovalStatusBadge';

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
  if (!d) return '—';
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
  'code', 'name', 'type', 'unitId', 'operatingOrgId', 'portId', 'waterwayId', 'waterwayRouteId',
  'province', 'address', 'constructionDate', 'totalArea', 'usableArea', 'staffCount',
  'lastMaintenanceYear', 'note', 'description', 'color', 'shape', 'lightCharacteristic', 'range',
  'lastInspectionDate', 'nextInspectionDate', 'lastRepairDate', 'isActive',
  'objectType', 'coordinateSystem', 'displayFormat', 'status', 'approvalStatus', 'rejectionReason',
];

const STATION_FIELD_LABEL_OVERRIDES: Record<string, string> = {
  objectType: 'Loại đối tượng',
  displayFormat: 'Quy tắc hiển thị',
  operatingOrgId: 'Đơn vị khai thác',
  constructionDate: 'Thời điểm xây dựng',
  usableArea: 'Diện tích sử dụng (m²)',
  lastMaintenanceYear: 'Năm bảo trì gần nhất',
  lastInspectionDate: 'Kiểm tra gần nhất',
  nextInspectionDate: 'Kiểm tra kế tiếp',
};

function stationFieldLabel(fn: string): string {
  return STATION_FIELD_LABEL_OVERRIDES[fn] || STATION_FIELD_MAP[fn] || fn;
}

export default function BuoyStationListPage() {
  const hasPerm = usePermissionStore((s) => s.hasPermission);
  const currentUser = useAuthStore((s) => s.user);

  // ── Filters ───────────────────────────────────────────────────────
  const [managingUnitId, setManagingUnitId] = useState<string | undefined>();
  const defaultOrgUnitId = useRef<string | undefined>(undefined);
  const defaultOrgApplied = useRef(false);
  const [orgUnitReady, setOrgUnitReady] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [filterProvince, setFilterProvince] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
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
  const [deleteText, setDeleteText] = useState('');
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
  const [historySearch, setHistorySearch] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');
  const [historyMode, setHistoryMode] = useState<'current' | 'all'>('current');
  const [historyEntityNames, setHistoryEntityNames] = useState<Record<string, string>>({});
  const [historyEntityFilter, setHistoryEntityFilter] = useState('');

  const historyFieldCount = useMemo(() => historyData.length, [historyData]);

  // ── Create / Edit Drawers ─────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<BuoyStationResponse | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [createUploaded, setCreateUploaded] = useState<UploadFile[]>([]);
  const [editUploaded, setEditUploaded] = useState<UploadFile[]>([]);
  const [createExisting, setCreateExisting] = useState<ExistingFile[]>([]);
  const [editExisting, setEditExisting] = useState<ExistingFile[]>([]);
  const createFormRef = useRef<BuoyStationFormContentHandle>(null);
  const editFormRef = useRef<BuoyStationFormContentHandle>(null);

  // ── Load master data ──────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const r = await organizationService.list({ pageSize: 1000 });
        const data = r.data || [];
        setOrganizations(data);
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
        setOrgUnitReady(true);
      } catch { setOrgUnitReady(true); }
    })();
    (async () => {
      try {
        const r = await userService.list({ pageSize: 1000 });
        const u = r.data || (r as any).content || [];
        const m = new Map<string, string>();
        u.forEach((x: any) => { m.set(x.id, x.fullName || x.username || x.id); });
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
        setStationBuoys(m);
      } catch { /* */ }
    })();
  }, []);

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
        status: filterStatus || undefined,
        portId: filterPortId || undefined,
        updatedFrom: filterUpdatedFrom,
        updatedTo: filterUpdatedTo,
      });
      const all = res.content || [];
      // Lọc theo đơn vị quản lý (subtree — đơn vị cha thấy cả đơn vị con, chuẩn Cảng biển)
      const unitSubtree = managingUnitId ? collectOrgSubtreeIds(organizations, managingUnitId) : null;
      const scoped = unitSubtree ? all.filter((d) => d.unitId && unitSubtree.has(d.unitId)) : all;
      const counts: Record<string, number> = { all: scoped.length };
      TAB_STATUS_LIST.slice(1).forEach((t) => { counts[t.key] = scoped.filter((d) => d.status === t.key).length; });
      setTabCounts(counts);
      const sf = activeTab !== 'all' ? activeTab : undefined;
      let filtered = sf ? scoped.filter((d) => d.status === sf) : scoped;
      if (filterWaterwayId) filtered = filtered.filter((d) => d.waterwayId === filterWaterwayId);
      if (filterCondition) filtered = filtered.filter((d) => d.condition === filterCondition);
      if (filterClassification && filterClassification.length) filtered = filtered.filter((d) => stationBuoys[d.id]?.classifications?.some((c) => filterClassification.includes(c)));
      if (filterClassificationBuoy && filterClassificationBuoy.length) filtered = filtered.filter((d) => stationBuoys[d.id]?.classificationBuoys?.some((c) => filterClassificationBuoy.includes(c)));
      if (filterClassificationMark && filterClassificationMark.length) filtered = filtered.filter((d) => stationBuoys[d.id]?.classificationMarks?.some((c) => filterClassificationMark.includes(c)));
      setAllData(filtered); setTotal(filtered.length);
    } catch { setIsError(true); }
    finally { setIsLoading(false); }
  }, [filterName, filterCode, managingUnitId, organizations, filterProvince, filterStatus, filterPortId, filterWaterwayId, filterCondition, filterClassification, filterClassificationBuoy, filterClassificationMark, filterUpdatedFrom, filterUpdatedTo, activeTab, stationBuoys]);

  useEffect(() => { if (orgUnitReady) void fetchData(); }, [fetchData, orgUnitReady]);

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
        aVal = orgMap.get(a.operatingOrgId) ?? a.operatingOrgId ?? '';
        bVal = orgMap.get(b.operatingOrgId) ?? b.operatingOrgId ?? '';
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
    setFilterStatus(filterValues.status || undefined);
    setFilterPortId(filterValues.portId || undefined);
    setFilterWaterwayId(filterValues.waterwayId || undefined);
    setFilterCondition(filterValues.condition || undefined);
    setFilterClassification(Array.isArray(filterValues.classification) && filterValues.classification.length > 0 ? filterValues.classification : undefined);
    setFilterClassificationBuoy(Array.isArray(filterValues.classificationBuoy) && filterValues.classificationBuoy.length > 0 ? filterValues.classificationBuoy : undefined);
    setFilterClassificationMark(Array.isArray(filterValues.classificationMark) && filterValues.classificationMark.length > 0 ? filterValues.classificationMark : undefined);
    setFilterUpdatedFrom(filterValues.updatedFrom || undefined);
    setFilterUpdatedTo(filterValues.updatedTo || undefined);
    setPage(1);
  }, [filterValues]);

  const handleFilterReset = useCallback(() => {
    const defaultOrg = defaultOrgUnitId.current === '__all__' ? undefined : defaultOrgUnitId.current;
    setFilterValues({ managingUnitId: defaultOrg });
    setManagingUnitId(defaultOrg);
    setFilterName('');
    setFilterCode('');
    setFilterProvince(undefined);
    setFilterStatus(undefined); setFilterPortId(undefined);
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
    } catch { setHistoryData([]); }
    finally { setHistoryLoading(false); }
  }, [historyRecord]);

  const openHistoryDrawer = useCallback(async (r: BuoyStationResponse) => {
    setHistoryDrawerOpen(true);
    setHistoryRecord(r);
    setHistorySearch(''); setHistoryFrom(''); setHistoryTo(''); setHistoryEntityFilter('');
    await loadHistoryMode('current', r);
  }, [loadHistoryMode]);

  // ── Translate giá trị lịch sử ────────────────────────────────────
  const translateStationVal = useCallback((fn: string, val: string) => {
    if (!val || val === 'null' || val === '(null)') return '—';
    if (fn === 'color') return COLOR_MAP[val] || val;
    if (fn === 'shape') return SHAPE_MAP[val] || val;
    if (fn === 'lightCharacteristic') return LIGHT_MAP[val] || val;
    if (fn === 'objectType') return GEO_MAP[val] || val;
    if (fn === 'coordinateSystem') return COORD_MAP[val] || val;
    if (fn === 'type') { const o = BUOY_TYPE_OPTIONS.find((x) => x.value === val); return o?.label || val; }
    if (fn === 'status') { const s = APPROVAL_STYLE_MAP[val]; return s?.label || val; }
    if (fn === 'approvalStatus') {
      const m: Record<string, string> = { PROPOSED: 'Đề xuất', APPROVED_LEVEL1: 'Đã duyệt cấp 1', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối' };
      return m[val] || val;
    }
    if (fn === 'approvalLevel') return val === 'LEVEL_1' ? 'Cấp Cảng vụ/Chi cục' : val === 'LEVEL_2' ? 'Cấp Cục' : val;
    if (fn === 'isActive') return val === 'true' ? 'Hoạt động' : 'Ngừng';
    if (fn === 'unitId' || fn === 'operatingOrgId') return orgMap.get(val) || val;
    if (fn === 'portId') return portMap.get(val) || val;
    if (fn === 'waterwayId') return waterwayMap.get(val) || val;
    if (fn === 'waterwayRouteId') return routeMap.get(val) || val;
    if (fn === 'icon') return symbolMap.get(val) || val;
    if (fn === 'sentApprovedBy' || fn === 'approvedBy' || fn === 'level1ApprovedBy' || fn === 'level2ApprovedBy' || fn === 'createdBy' || fn === 'updatedBy') return userMap.get(val) || val;
    if (fn === 'constructionDate' || fn === 'lastInspectionDate' || fn === 'nextInspectionDate' || fn === 'lastRepairDate') {
      try { return dayjs(val).format('DD/MM/YYYY'); } catch { return val; }
    }
    if (fn === 'createdAt' || fn === 'updatedAt' || fn === 'sentApprovedDate' || fn === 'approvedDate' || fn === 'level1ApprovedDate' || fn === 'level2ApprovedDate') {
      try { return dayjs(val).format('DD/MM/YYYY HH:mm:ss'); } catch { return val; }
    }
    return val;
  }, [orgMap, portMap, waterwayMap, routeMap, symbolMap, userMap]);

  const actorName = useCallback((actor: string | undefined) => {
    if (!actor) return '—';
    return userMap.get(String(actor)) || actor;
  }, [userMap]);

  const renderHistoryTimeline = (records: ChangeHistory[]) => {
    const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000);
    const sorted = [...records].sort((a: any, b: any) =>
      new Date(b.changedAt || b.createdAt || 0).getTime() - new Date(a.changedAt || a.createdAt || 0).getTime());
    const q = historySearch.toLowerCase().trim();
    const groups: { tsSec: number; ts: string; actor: string; items: ChangeHistory[] }[] = [];
    for (const r of sorted) {
      if (q) {
        const fn = (r.fieldName || '').toLowerCase();
        const ov = (r.oldValue || '').toLowerCase();
        const nv = (r.newValue || '').toLowerCase();
        const label = stationFieldLabel(r.fieldName || '').toLowerCase();
        const tv = translateStationVal(r.fieldName || '', r.newValue || '').toLowerCase();
        if (!fn.includes(q) && !ov.includes(q) && !nv.includes(q) && !label.includes(q) && !tv.includes(q)) continue;
      }
      if (historyMode === 'all' && historyEntityFilter && r.entityId !== historyEntityFilter) continue;
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
        <div style={{ color: textTertiary, fontSize: fontSizeMd }}>
          {q || historyFrom || historyTo ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận'}
        </div>
      </div>
    );
    const fmt = (ts: string) => {
      const d = new Date(ts);
      return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    };
    return (
      <div>
        {groups.map((g, gi) => {
          const isCreate = g.items.every((i) => i.oldValue == null || i.oldValue === '(null)' || i.oldValue === '');
          const visibleItems = g.items.filter((i) => i.fieldName !== 'spatialId');
          return (
            <div key={`${g.tsSec}-${g.actor}`} style={{ ...historyGroupGridStyle, marginBottom: gi < groups.length - 1 ? spaceSm : 0 }}>
              <div style={{ minWidth: 0, paddingTop: spaceXs }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spaceSm }}>
                  <Typography.Text style={historyTimeStyle}>{g.ts ? fmt(g.ts) : '—'}</Typography.Text>
                  <span style={{ flexShrink: 0 }}>
                    {isCreate
                      ? <span style={historyBadgeStyle(statusOperational)}>Thêm mới</span>
                      : <span style={historyBadgeStyle(actionPrimary)}>Chỉnh sửa</span>}
                  </span>
                </div>
                <Typography.Text style={historyMetaRowStyle}>Người cập nhật: {actorName(g.actor)}</Typography.Text>
                {historyMode === 'all' && g.items[0]?.entityId ? (
                  <Typography.Text style={historyMetaRowStyle}>Nhà trạm: {historyEntityNames[g.items[0].entityId] || g.items[0].entityId}</Typography.Text>
                ) : (
                  <Typography.Text style={historyMetaRowStyle}>Đơn vị: {historyRecord && historyRecord.unitId ? (orgMap.get(historyRecord.unitId) || '—') : '—'}</Typography.Text>
                )}
              </div>
              <div style={historyInfoCardStyle}>
                <div style={historyAccentBarStyle(actionPrimary)} />
                <Typography.Text style={historyInfoTitleStyle}>
                  {isCreate ? 'Thông tin thêm mới:' : 'Thông tin thay đổi:'}
                </Typography.Text>
                {visibleItems.sort((a: any, b: any) => {
                  const ia = HISTORY_FIELD_ORDER.indexOf(a.fieldName || '');
                  const ib = HISTORY_FIELD_ORDER.indexOf(b.fieldName || '');
                  return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
                }).map((change, ri) => {
                  const fn = change.fieldName || '';
                  const formatHistoryValue = (raw: string | null) => {
                    if (raw === null || raw === '(null)' || raw === '') return null;
                    const t = raw.trim();
                    if (t.startsWith('[') && t.endsWith(']')) {
                      if (t === '[]') return 'Không có';
                      const parts = t.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean);
                      return `${parts.length} phần tử`;
                    }
                    if (/^-?\d+(\.\d+)?$/.test(t)) {
                      const n = Number(t);
                      return Number.isInteger(n) ? String(n) : t;
                    }
                    return translateStationVal(fn, raw);
                  };
                  const ov = formatHistoryValue(change.oldValue != null && change.oldValue !== 'null' ? String(change.oldValue) : null);
                  const nv = formatHistoryValue(change.newValue != null && change.newValue !== 'null' ? String(change.newValue) : null);
                  const key = change.id || `${fn}-${ri}`;
                  const renderCell = (rawVal: string | null) => {
                    if ((fn === 'mapSymbolId' || fn === 'icon') && rawVal && rawVal !== '(null)') {
                      const img = symbolImageMap.get(rawVal);
                      const name = symbolMap.get(rawVal) || rawVal;
                      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{img ? <img src={img} alt="" style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 4 }} /> : null}{name}</span>;
                    }
                    return null;
                  };
                  return isCreate ? (
                    <div key={key} style={{ ...historyCreateRowStyle, paddingTop: ri > 0 ? spaceXs : 0 }}>
                      <div style={historyFieldLabelStyle}>{fn ? `${stationFieldLabel(fn)}:` : '—'}</div>
                      <span title={nv ?? '—'} style={historyNewValueStyle}>{renderCell(change.newValue) ?? (nv ?? '—')}</span>
                    </div>
                  ) : (
                    <div key={key} style={{ ...historyChangeRowStyle, paddingTop: ri > 0 ? spaceXs : 0 }}>
                      <div style={historyFieldLabelStyle}>{fn ? `${stationFieldLabel(fn)}:` : '—'}</div>
                      <span title={ov ?? '—'} style={historyOldValueStyle}>{renderCell(change.oldValue) ?? (ov ?? '—')}</span>
                      <span style={historyArrowStyle}>→</span>
                      <span title={nv ?? '—'} style={historyNewValueStyle}>{renderCell(change.newValue) ?? (nv ?? '—')}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ── Delete / Approve / Reject handlers ────────────────────────────
  const openDelete = useCallback((r: BuoyStationResponse) => {
    setDeletingRecord(r); setDeleteText(''); setDeleteOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deletingRecord) return;
    const expected = (deletingRecord.name || 'XÓA').trim().toLowerCase();
    const input = deleteText.trim().toLowerCase();
    if (input !== expected && input !== 'xóa') {
      toast.error('Vui lòng nhập đúng tên nhà trạm phao tiêu hoặc gõ "XÓA" để xác nhận');
      return;
    }
    try {
      await deleteBuoyStation(deletingRecord.id);
      toast.success('Đã xóa nhà trạm phao tiêu');
      setDeleteOpen(false); setDeletingRecord(null); setDeleteText('');
      void fetchData();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Xóa thất bại'); }
  }, [deletingRecord, deleteText, fetchData]);

  const openSubmit = useCallback((r: BuoyStationResponse) => {
    setSubmittingRecord(r); setSubmitOpen(true);
  }, []);

  const handleConfirmSubmit = useCallback(async () => {
    if (!submittingRecord) return;
    try {
      await submitBuoyStationForApproval(submittingRecord.id);
      toast.success('Đã gửi phê duyệt');
      setSubmitOpen(false); setSubmittingRecord(null);
      void fetchData();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Gửi thất bại'); }
  }, [submittingRecord, fetchData]);

  const openApprove = useCallback((r: BuoyStationResponse, level: 'L1' | 'L2') => {
    setApprovingRecord(r); setApproveLevel(level); setApprovalContent(''); setApproveOpen(true);
  }, []);

  const confirmApprove = useCallback(async () => {
    if (!approvingRecord) return;
    const aid = currentUser?.userId;
    if (!aid) { toast.error('Không xác định được người dùng'); return; }
    try {
      const content = approvalContent.trim() || undefined;
      if (approveLevel === 'L1') await approveBuoyStationL1(approvingRecord.id, aid, content);
      else await approveBuoyStationL2(approvingRecord.id, aid, content);
      toast.success(approveLevel === 'L1' ? 'Đã phê duyệt cấp 1' : 'Đã phê duyệt cấp 2 - Công bố');
      setApproveOpen(false); setApprovingRecord(null); setApprovalContent('');
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
      setRejectOpen(false); setRejectingRecord(null); setRejectReason('');
      void fetchData();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Thất bại'); }
  }, [rejectingRecord, rejectReason, fetchData, currentUser]);

  // ── Create / Edit ─────────────────────────────────────────────────
  const openCreate = useCallback(() => { setCreateOpen(true); }, []);

  const openEdit = useCallback(async (r: BuoyStationResponse) => {
    setEditRecord(r); setEditOpen(true); setEditUploaded([]);
    try {
      const f = await fetchBuoyStationById(r.id);
      setEditRecord(f);
      try {
        const fr = await api.get(`/v1/documents/entity/buoy-station/${r.id}`, { params: { page: 0, size: 50 } });
        setEditExisting(fr.data?.data?.content || fr.data?.data || []);
      } catch { setEditExisting([]); }
    } catch { toast.error('Không thể tải thông tin'); }
  }, []);

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
          <Button type="link" onClick={() => void openDetail(record)} style={{ fontWeight: fontWeightBold, color: actionPrimary, cursor: 'pointer', display: 'block', padding: 0, height: 'auto' }}>{name}</Button>
          <span style={{ opacity: 0.85 }}>{record.code}</span>
        </div>
      ),
    },
    {
      key: 'unitId', label: 'Đơn vị quản lý', dataIndex: 'unitId', width: 260, ellipsis: true, sortable: true,
      render: (v: string) => {
        const level2 = v ? orgLevel2Map.get(v) : undefined;
        return <span style={{ fontWeight: fontWeightBold }}>{level2 || v || '—'}</span>;
      },
    },
    {
      key: 'classifications', label: 'Phân loại', width: 140, ellipsis: true, sortable: true,
      render: (_: unknown, record: BuoyStationResponse) => {
        const arr = stationBuoys[record.id]?.classifications || [];
        return arr.length ? arr.join(', ') : '—';
      },
    },
    {
      key: 'classificationBuoys', label: 'Phân loại phao', width: 170, ellipsis: true, sortable: true,
      render: (_: unknown, record: BuoyStationResponse) => {
        const arr = stationBuoys[record.id]?.classificationBuoys || [];
        return arr.length ? arr.join(', ') : '—';
      },
    },
    {
      key: 'classificationMarks', label: 'Phân loại tiêu', width: 170, ellipsis: true, sortable: true,
      render: (_: unknown, record: BuoyStationResponse) => {
        const arr = stationBuoys[record.id]?.classificationMarks || [];
        return arr.length ? arr.join(', ') : '—';
      },
    },
    {
      key: 'operatingOrgId', label: 'Đơn vị khai thác', dataIndex: 'operatingOrgId', width: 220, ellipsis: true, sortable: true,
      render: (v: string) => (v ? (orgMap.get(v) || v) : '—'),
    },
    {
      key: 'portId', label: 'Thuộc cảng biển', dataIndex: 'portId', width: 220, ellipsis: true, sortable: true,
      render: (v: string) => (v ? (portMap.get(v) || v) : '—'),
    },
    {
      key: 'waterwayId', label: 'Thuộc luồng hàng hải', dataIndex: 'waterwayId', width: 280, ellipsis: true, sortable: true,
      render: (v: string) => (v ? (waterwayMap.get(v) || v) : '—'),
    },
    {
      key: 'province', label: 'Địa điểm (Tỉnh/TP)', dataIndex: 'province', width: 200, sortable: true,
      render: (v: string) => (v || '—'),
    },
    {
      key: 'condition', label: 'Tình trạng', dataIndex: 'condition', width: 230, sortable: true,
      render: (v: string) => { const s = CONDITION_STYLE[v || ''] || { color: textTertiary, label: v || '—' }; return <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${s.color}15`, color: s.color }}>{s.label}</span>; },
    },
    {
      key: 'status', label: 'Trạng thái', dataIndex: 'status', width: 220, sortable: true,
      render: (s: string) => <ApprovalStatusBadge status={s} />,
    },
    {
      key: 'updatedAt', label: 'Cán bộ cập nhật', dataIndex: 'updatedAt', width: 200, ellipsis: true, sortable: true,
      render: (v: string, record: BuoyStationResponse) => (
        <div><span style={{ fontWeight: fontWeightBold }}>{record.updatedByName || record.createdByName || '—'}</span><br /><span style={{ opacity: 0.85 }}>{fmt(v)}</span></div>
      ),
    },
    {
      key: 'sentApprovedDate', label: 'Cán bộ gửi phê duyệt', dataIndex: 'sentApprovedDate', width: 210, ellipsis: true, sortable: true,
      render: (v: string, record: BuoyStationResponse) => (
        <div><span style={{ fontWeight: fontWeightBold }}>{record.sentApprovedBy != null ? actorName(record.sentApprovedBy) : '—'}</span><br /><span style={{ opacity: 0.85 }}>{fmt(v)}</span></div>
      ),
    },
    {
      key: 'level1ApprovedDate', label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục', dataIndex: 'level1ApprovedDate', width: 340, ellipsis: true, sortable: true,
      render: (v: string, record: BuoyStationResponse) => (
        <div><span style={{ fontWeight: fontWeightBold }}>{record.level1ApprovedBy != null ? actorName(record.level1ApprovedBy) : '—'}</span><br /><span style={{ opacity: 0.85 }}>{fmt(v)}</span></div>
      ),
    },
    {
      key: 'level2ApprovedDate', label: 'Cán bộ phê duyệt cấp Cục', dataIndex: 'level2ApprovedDate', width: 240, ellipsis: true, sortable: true,
      render: (v: string, record: BuoyStationResponse) => (
        <div><span style={{ fontWeight: fontWeightBold }}>{record.level2ApprovedBy != null ? actorName(record.level2ApprovedBy) : '—'}</span><br /><span style={{ opacity: 0.85 }}>{fmt(v)}</span></div>
      ),
    },
  ].map((col) => ({
    ...col,
    sortOrder: col.sortable && col.key === sortField ? sortOrder : undefined,
  })), [page, pageSize, orgMap, orgLevel2Map, portMap, waterwayMap, actorName, openDetail, stationBuoys, sortField, sortOrder]);

  const rowActions = useCallback((r: BuoyStationResponse) => {
    const a: any[] = [];
    a.push({ key: 'view', label: 'Chi tiết', icon: <EyeOutlined />, onClick: () => void openDetail(r) });
    // Quy tắc 12 (approval-2-level-spec.md mục 3.9)
    if (canEditApprovalRecord(r.status, { hasPerm, resource: 'buoystation', extraUpdatePerms: ['data:update', 'admin:manage'], extraApprovePerms: ['admin:manage'] })) a.push({ key: 'edit', label: 'Chỉnh sửa', icon: <EditOutlined />, onClick: () => void openEdit(r) });
    if (r.latitude != null && r.longitude != null) a.push({ key: 'loc', label: 'Xem vị trí', icon: <EnvironmentOutlined />, onClick: () => window.open(`https://www.google.com/maps?q=${r.latitude},${r.longitude}`, '_blank') });
    a.push({ key: 'history', label: 'Lịch sử', icon: <HistoryOutlined />, onClick: () => void openHistoryDrawer(r) });
    if ((hasPerm('buoystation:create') || hasPerm('buoystation:update') || hasPerm('data:create') || hasPerm('data:update') || hasPerm('admin:manage')) && (r.status === 'DRAFT' || r.status === 'REJECTED')) a.push({ key: 'submit', label: 'Gửi Cảng vụ phê duyệt', icon: <CheckCircleOutlined />, onClick: () => openSubmit(r) });
    const canApproveL1 = hasPerm('buoystation:approvec1') || hasPerm('buoystation:approvel1') || hasPerm('data:approvec1') || hasPerm('data:approvel1') || hasPerm('admin:manage');
    const canApproveL2 = hasPerm('buoystation:approvec2') || hasPerm('buoystation:approvel2') || hasPerm('data:approvec2') || hasPerm('data:approvel2') || hasPerm('admin:manage');
    if (canApproveL1 && r.status === 'PENDING_APPROVAL') {
      a.push({ key: 'appL1', label: 'Cảng vụ phê duyệt', icon: <CheckCircleOutlined />, onClick: () => openApprove(r, 'L1') });
      a.push({ key: 'rej', label: 'Từ chối', icon: <CloseCircleOutlined />, onClick: () => openReject(r), danger: true });
    }
    if (canApproveL2 && r.status === 'APPROVED_L1') {
      a.push({ key: 'appL2', label: 'Cục phê duyệt', icon: <CheckCircleOutlined />, onClick: () => openApprove(r, 'L2') });
      a.push({ key: 'rej', label: 'Từ chối', icon: <CloseCircleOutlined />, onClick: () => openReject(r), danger: true });
    }
    if ((hasPerm('buoystation:delete') || hasPerm('data:delete') || hasPerm('admin:manage')) && (r.status === 'DRAFT' || r.status === 'REJECTED')) a.push({ key: 'del', label: 'Xóa', icon: <DeleteOutlined />, onClick: () => openDelete(r), danger: true });
    return a;
  }, [hasPerm, openEdit, openDetail, openHistoryDrawer, openSubmit, openApprove, openReject, openDelete]);

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
      <style>{`.buoy-station-filter .ant-select-selector { border-radius: 999px !important; } .buoy-station-filter .ant-select-selection-item { border-radius: 999px !important; } .range-single-panel .ant-picker-panel-container .ant-picker-panel:last-child { display: none !important; }`}</style>
      <ScreenHeader
        breadcrumb={[{ label: 'Báo hiệu hàng hải' }, { label: 'Nhà trạm Phao, tiêu' }]}
        actions={[{ key: 'create', label: 'Thêm mới', variant: 'primary' as const, icon: <PlusOutlined />, onClick: openCreate }]}
      />
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
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Trạng thái</div>
            <Select placeholder="Tất cả" allowClear
              value={filterValues.status || undefined}
              onChange={(val) => setFilterValues((prev) => ({ ...prev, status: val }))}
              options={APPROVAL_STATUS_OPTIONS}
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
          </div>
          {filterCollapsed && (<>
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
              <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Phân loại tiêu</div>
              <Select mode="multiple" className="buoy-station-filter" placeholder="Tìm kiếm phân loại tiêu..." allowClear showSearch
                maxTagCount={2}
                maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}`}
                value={filterValues.classificationMark || undefined}
                onChange={(val) => setFilterValues((prev) => ({ ...prev, classificationMark: val }))}
                options={CLASSIFICATION_MARK_OPTIONS}
                style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Địa điểm</div>
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
          </>)}
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
        {isError ? null : !isLoading && dataSource.length === 0 ? (
          <DataTable dataSource={[]} rowKey="id"
            emptyState={
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>📭</div>
                <div style={{ fontSize: fontSizeLg, color: textSecondary, marginBottom: 8 }}>Không tìm thấy nhà trạm phao tiêu nào phù hợp</div>
              </div>
            }
          />
        ) : !isLoading && !isError && dataSource.length > 0 ? (
          <DataTable
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            rowActions={rowActions}
            loading={false}
            onSort={handleSortChange}
            scroll={{ x: 2700, y: 550 }}
          />
        ) : null}
        <Pagination total={total} current={page} pageSize={pageSize} onChange={(p, ps) => { setPage(p); setPageSize(ps); }} />
      </FilterTableLayout>

      {/* ── Detail Drawer ──────────────────────────────────────────── */}
      <Drawer
        {...drawerProps}
        size={1000}
        title={<span style={drawerTitleStyle}>{detailRecord ? `Chi tiết thông tin nhà trạm quản lý vận hành phao, tiêu - ${detailRecord.name}` : 'Chi tiết thông tin nhà trạm quản lý vận hành phao, tiêu'}</span>}
        open={detailOpen}
        onClose={closeDetail}
        extra={<Button type="text" onClick={closeDetail} style={drawerCloseBtnStyle}>✕</Button>}
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
      </Drawer>

      {/* ── Buoy Detail Drawer (nested — đè lên chi tiết nhà trạm) ── */}
      <Drawer
        {...drawerProps}
        size={950}
        title={<span style={drawerTitleStyle}>{viewBuoyRecord ? `Chi tiết phao tiêu - ${viewBuoyRecord.name}` : 'Chi tiết phao tiêu'}</span>}
        open={viewBuoyOpen}
        onClose={() => setViewBuoyOpen(false)}
        extra={<Button type="text" onClick={() => setViewBuoyOpen(false)} style={drawerCloseBtnStyle}>✕</Button>}
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
      </Drawer>

      {/* ── History Drawer ─────────────────────────────────────────── */}
      <Drawer
        {...drawerProps}
        size={880 as any}
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
        extra={<Button type="text" onClick={() => setHistoryDrawerOpen(false)} style={drawerCloseBtnStyle}>✕</Button>}
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
            <Input placeholder="Tìm kiếm nội dung thay đổi..." allowClear value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              style={{ flex: 1, borderRadius: radiusPill, height: 40 }} />
            {historyMode === 'all' && (
              <Select placeholder="Chọn nhà trạm" allowClear showSearch value={historyEntityFilter || undefined}
                onChange={(v) => setHistoryEntityFilter(v || '')}
                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                style={{ width: 200, borderRadius: radiusPill, height: 40 }}
                options={Object.entries(historyEntityNames).map(([id, name]) => ({ value: id, label: name }))} />
            )}
            <DatePicker placeholder="Từ ngày" popupClassName="history-dt-popup" value={historyFrom ? dayjs(historyFrom) : null}
              onChange={(d) => setHistoryFrom(d ? d.format('YYYY-MM-DD HH:mm') : '')}
              style={{ width: 170, borderRadius: radiusPill, height: 40 }} format="DD/MM/YYYY HH:mm" showTime={{ format: 'HH:mm' }} />
            <DatePicker placeholder="Đến ngày" popupClassName="history-dt-popup" value={historyTo ? dayjs(historyTo) : null}
              onChange={(d) => setHistoryTo(d ? d.format('YYYY-MM-DD HH:mm') : '')}
              style={{ width: 170, borderRadius: radiusPill, height: 40 }} format="DD/MM/YYYY HH:mm" showTime={{ format: 'HH:mm' }} />
            <Button type="primary" icon={<SearchOutlined />} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>Tìm kiếm</Button>
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {historyLoading ? <LoadingSkeleton rows={5} /> : historyData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
              <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
              <div style={{ color: textTertiary, fontSize: fontSizeMd }}>Chưa có thay đổi nào được ghi nhận</div>
            </div>
          ) : renderHistoryTimeline(historyData)}
        </div>
      </Drawer>

      {/* ── Delete Modal ───────────────────────────────────────────── */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Xác nhận xóa nhà trạm phao tiêu</span>}
        open={deleteOpen}
        onCancel={() => { setDeleteOpen(false); setDeletingRecord(null); setDeleteText(''); }}
        width={480}
        footer={[
          <Button key="cancel" onClick={() => { setDeleteOpen(false); setDeletingRecord(null); setDeleteText(''); }} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="del" type="primary" danger onClick={confirmDelete} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Xác nhận xóa</Button>,
        ]}
      >
        <div style={{ padding: '8px 0' }}>
          <Alert message="Hành động này không thể hoàn tác" type="warning" showIcon icon={<ExclamationCircleOutlined />} style={{ marginBottom: spaceFormField, borderRadius: radiusPill }} />
          <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>Vui lòng nhập <strong>tên nhà trạm</strong> hoặc gõ <strong>"XÓA"</strong> để xác nhận xóa.</p>
          {deletingRecord && <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>Nhà trạm: <strong style={{ color: textPrimary }}>{deletingRecord.name}</strong></p>}
          <Input placeholder="Nhập tên nhà trạm hoặc XÓA" value={deleteText} onChange={(e) => setDeleteText(e.target.value)} onPressEnter={confirmDelete} style={{ borderRadius: radiusPill, height: 40 }} autoFocus />
        </div>
      </Modal>

      {/* ── Submit Approval Modal ──────────────────────────────────── */}
      <Modal
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

      {/* ── Approve Modal ──────────────────────────────────────────── */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>{approveLevel === 'L1' ? 'Xác nhận Cảng vụ phê duyệt' : 'Xác nhận Cục phê duyệt'}</span>}
        open={approveOpen}
        onCancel={() => { setApproveOpen(false); setApprovingRecord(null); }}
        footer={[
          <Button key="cancel" onClick={() => { setApproveOpen(false); setApprovingRecord(null); }} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="approve" type="primary" onClick={confirmApprove} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: approveLevel === 'L1' ? statusAttention : statusOperational, borderColor: approveLevel === 'L1' ? statusAttention : statusOperational }}>Xác nhận</Button>,
        ]}
        width={480}
      >
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary }}>
            {approveLevel === 'L1' ? 'Cảng vụ' : 'Cục'} phê duyệt <strong>{approvingRecord?.code} — {approvingRecord?.name}</strong>?
          </p>
          <div style={{ marginTop: spaceMd }}>
            <div style={{ marginBottom: spaceXs, color: textSecondary, fontSize: fontSizeMd, fontWeight: fontWeightMedium }}>Nội dung phê duyệt</div>
            <Input.TextArea rows={3} placeholder="Nhập nội dung phê duyệt (không bắt buộc)..." value={approvalContent}
              onChange={(e) => setApprovalContent(e.target.value)}
              style={{ fontSize: fontSizeMd }} />
          </div>
        </div>
      </Modal>

      {/* ── Reject Modal ───────────────────────────────────────────── */}
      <Modal
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

      {/* ── Create Drawer ──────────────────────────────────────────── */}
      <Drawer
        {...drawerProps}
        title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>Thêm mới thông tin nhà trạm quản lý vận hành phao, tiêu</span>}
        open={createOpen}
        onClose={() => { setCreateOpen(false); setCreateUploaded([]); setCreateExisting([]); createForm.resetFields(); }}
        extra={<Button type="text" onClick={() => { setCreateOpen(false); setCreateUploaded([]); setCreateExisting([]); createForm.resetFields(); }} style={drawerCloseBtnStyle}>✕</Button>}
        footer={
          <div style={drawerFooterStyle}>
            <Button onClick={() => createFormRef.current?.submit('DRAFT')} style={outlineButtonStyle}>Lưu tạm</Button>
            <Button type="primary" onClick={() => createFormRef.current?.submit('SUBMIT')} style={primaryButtonStyle}>Lưu và gửi phê duyệt</Button>
            <Button type="primary" onClick={() => createFormRef.current?.submit('APPROVED')} style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}>Lưu và phê duyệt</Button>
          </div>
        }
      >
        <style>{requiredMarkStyle}</style>
        <Form form={createForm} layout="vertical" scrollToFirstError>
          <BuoyStationFormContent ref={createFormRef} form={createForm} isEdit={false} uploadedFiles={createUploaded} setUploadedFiles={setCreateUploaded} existingFiles={createExisting} organizations={organizations} onFinish={() => { setCreateOpen(false); setCreateUploaded([]); setCreateExisting([]); createForm.resetFields(); void fetchData(); }} />
        </Form>
      </Drawer>

      {/* ── Edit Drawer ────────────────────────────────────────────── */}
      <Drawer
        {...drawerProps}
        title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>Chỉnh sửa thông tin nhà trạm quản lý vận hành phao, tiêu — {editRecord ? editRecord.name : 'Nhà trạm quản lý vận hành phao, tiêu'}</span>}
        open={editOpen}
        onClose={() => { setEditOpen(false); setEditRecord(null); setEditUploaded([]); setEditExisting([]); editForm.resetFields(); }}
        extra={<Button type="text" onClick={() => { setEditOpen(false); setEditRecord(null); setEditUploaded([]); setEditExisting([]); editForm.resetFields(); }} style={drawerCloseBtnStyle}>✕</Button>}
        footer={
          <div style={drawerFooterStyle}>
            <Button type="primary" onClick={() => editFormRef.current?.submit('UPDATE')} style={primaryButtonStyle}>Cập nhật</Button>
          </div>
        }
      >
        <style>{requiredMarkStyle}</style>
        <Form form={editForm} layout="vertical" scrollToFirstError>
          <BuoyStationFormContent ref={editFormRef} form={editForm} isEdit entityData={editRecord} uploadedFiles={editUploaded} setUploadedFiles={setEditUploaded} existingFiles={editExisting} organizations={organizations} onFinish={() => { setEditOpen(false); setEditRecord(null); setEditUploaded([]); setEditExisting([]); editForm.resetFields(); void fetchData(); }} />
        </Form>
      </Drawer>
    </div>
  );
}

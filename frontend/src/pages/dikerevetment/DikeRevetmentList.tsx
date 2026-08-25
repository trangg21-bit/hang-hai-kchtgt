import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Button,
  Modal,
  Input,
  Select,
  TreeSelect,
  Drawer,
  Space,
  Typography,
  Form,
  DatePicker,
  Row,
  Col,
  Tabs,
  Table,
  InputNumber,
  Upload,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  HistoryOutlined,
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileOutlined,
  UploadOutlined,
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
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import { colors } from '../../theme';
import { usePermissionStore } from '../../store/permissionStore';
import { useAuthStore } from '../../store/authStore';
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
  radiusMd,
  radiusPill,
  spaceXs,
  spaceSm,
  spaceMd,
  spaceFormField,
  inputStyle,
  selectStyle,
  primaryButtonStyle,
  outlineButtonStyle,
  formFieldStyle,
  formRowGutter,
  drawerProps,
  drawerTitleStyle,
  drawerCloseBtnStyle,
  drawerFooterStyle,
  requiredMarkStyle,
  filterLabelStyle,
  filterInputStyle,
  confirmModalBodyStyle,
  detailRowStyle,
  detailLabelColStyle,
  detailValueStyle,
  historyBadgeStyle,
  historyMetaRowStyle,
  historyInfoCardStyle,
  historyAccentBarStyle,
  historyChangeRowStyle,
  historyCreateRowStyle,
  historyFieldLabelStyle,
  historyOldValueStyle,
  historyNewValueStyle,
  historyArrowStyle,
} from '../../tokens';

// ── Field name translation (lịch sử thay đổi) ───────────────────────

const FIELD_LABELS: Record<string, string> = {
  code: 'Mã đê kè',
  dikeRevetmentName: 'Tên đê kè',
  dikeRevetmentType: 'Loại kết cấu công trình',
  orgUnitId: 'Đơn vị quản lý',
  location: 'Địa điểm (Tỉnh/TP)',
  locationDetail: 'Địa điểm chi tiết',
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

// ── Constants ────────────────────────────────────────────────────────

const STATUS_TAB_LIST = [
  { key: '', label: 'Tất cả', color: actionPrimary },
  { key: 'PROPOSED', label: 'Nháp', color: statusDraft },
  { key: 'PENDING_APPROVAL', label: 'Chờ phê duyệt', color: statusAttention },
  { key: 'APPROVED', label: 'Đã phê duyệt', color: statusOperational },
  { key: 'REJECTED', label: 'Từ chối', color: statusCritical },
];

const TAB_QUERY_MAP: Record<string, ApprovalStatus | undefined> = {
  '': undefined,
  PROPOSED: 'PROPOSED',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
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

const GEOMETRY_POINT_COUNT: Record<string, number> = { POINT: 1, LINE: 2, POLYGON: 3 };

const APPROVAL_STATUS_MAP: Record<string, string> = {
  PROPOSED: 'Nháp',
  PENDING_APPROVAL: 'Chờ phê duyệt',
  APPROVED: 'Đã phê duyệt',
  REJECTED: 'Từ chối',
};

// History action colors — semantic tokens
const HISTORY_ACTION_COLOR: Record<string, string> = {
  TAO_MOI: statusOperational,
  CAP_NHAT: actionPrimary,
  GUI_DUYET: statusAttention,
  PHE_DUYET_C1: statusAttention,
  PHE_DUYET_C2: statusAttention,
  TU_CHOI: statusCritical,
  XOA_MEM: statusDraft,
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try { return dayjs(dateStr).format('DD/MM/YYYY HH:mm:ss'); } catch { return dateStr; }
}

function formatDateOnly(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try { return dayjs(dateStr).format('DD/MM/YYYY'); } catch { return dateStr; }
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

function parseWktToVertices(wkt: string, geomType: string): { lng: number; lat: number }[] {
  if (!wkt) return [];
  try {
    const type = (geomType || '').toUpperCase();
    if (type === 'POINT') {
      if (wkt.startsWith('MULTIPOINT(')) {
        const match = wkt.match(/MULTIPOINT\(([^)]+)\)/);
        if (match) {
          return match[1].split('),(').map((pt) => {
            const parts = pt.replace(/[()]/g, '').trim().split(/\s+/);
            return { lng: parseFloat(parts[0]), lat: parseFloat(parts[1]) };
          });
        }
      } else if (wkt.startsWith('POINT(')) {
        const match = wkt.match(/POINT\(([^)]+)\)/);
        if (match) {
          const parts = match[1].split(' ');
          return [{ lng: parseFloat(parts[0]), lat: parseFloat(parts[1]) }];
        }
      }
    } else if (type === 'LINE' && wkt.startsWith('LINESTRING(')) {
      const match = wkt.match(/LINESTRING\(([^)]+)\)/);
      if (match) {
        return match[1].split(',').map((pt) => {
          const parts = pt.trim().split(' ');
          return { lng: parseFloat(parts[0]), lat: parseFloat(parts[1]) };
        });
      }
    } else if (type === 'POLYGON' && wkt.startsWith('POLYGON((')) {
      const match = wkt.match(/POLYGON\(\(([^)]+)\)\)/);
      if (match) {
        const pts = match[1].split(',').map((pt) => {
          const parts = pt.trim().split(' ');
          return { lng: parseFloat(parts[0]), lat: parseFloat(parts[1]) };
        });
        if (pts.length > 1 && pts[0].lng === pts[pts.length - 1].lng && pts[0].lat === pts[pts.length - 1].lat) {
          pts.pop();
        }
        return pts;
      }
    }
  } catch (e) {
    console.warn('Sai định dạng WKT:', wkt, e);
  }
  return [];
}

const labelProps = (text: string) => ({
  label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

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

export default function DikeRevetmentList() {
  const hasPerm = usePermissionStore((s: any) => s.hasPermission);
  const currentUser = useAuthStore((s: any) => s.user);
  const canSubmitForApproval = hasPerm('dikerevetment:update') || hasPerm('dikerevetment:approve');
  // Đơn vị cha/Cục (scope_all, admin) được chọn đơn vị con khi thêm mới; tài khoản thường bị khóa theo đơn vị của mình
  const isElevatedOrg = hasPerm('orgunit:scope_all') || hasPerm('admin:all') || hasPerm('*')
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

  const addGpsPoint = () => setGpsCoordList([...gpsCoordList, { lat: NaN, lng: NaN }]);
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
  const [activeTabKey, setActiveTabKey] = useState('general');
  const [logOpen, setLogOpen] = useState(true);
  const [operationOpen, setOperationOpen] = useState(true);
  const [maintenanceOpen, setMaintenanceOpen] = useState(true);
  const [incidentOpen, setIncidentOpen] = useState(true);

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
  const [historySearch, setHistorySearch] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');

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
        status: filterStatusVal,
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
    const statuses: (ApprovalStatus | undefined)[] = ['PROPOSED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'];
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
      count: tab.key ? (tabCounts[tab.key] ?? 0) : dataSource.length,
      active: activeTab === tab.key,
    })),
    [tabCounts, activeTab, dataSource.length],
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
    setEditingRecord(null);
    setDetailRecord(null);
    setIsDetailMode(false);
    createForm.resetFields();
    setGpsCoordList([]);
    setUploadFileList([]);
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
    setEditingRecord(record);
    setDetailRecord(null);
    setIsDetailMode(false);
    createForm.setFieldsValue({
      dikeRevetmentType: record.dikeRevetmentType,
      location: record.location,
      locationDetail: record.locationDetail,
      dikeRevetmentName: record.dikeRevetmentName,
      seaportId: record.seaportId,
      donViVanHanhName: record.donViVanHanhName || record.donViVanHanhId || '',
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
    setUploadFileList((record.attachments || []).map((a) => ({ uid: a.id, name: a.fileName, status: 'done', filePath: a.fileUrl })));
    setActiveTabKey('general');
    setDrawerVisible(true);
  }, [createForm]);

  const openDetailDrawer = useCallback(async (record: DikeRevetmentResponse) => {
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
    setDrawerVisible(false);
    setEditingRecord(null);
    setDetailRecord(null);
  };

  // ── Submit ───────────────────────────────────────────────────────
  const handleSubmit = async (action: 'draft' | 'approve' | 'update') => {
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
        donViVanHanhName: values.donViVanHanhName,
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

      let savedId: string | null = null;
      if (editingRecord) {
        await dikeRevetmentCRUD.update(editingRecord.id, payload as UpdateDikeRevetmentRequest);
        savedId = editingRecord.id;
        toast.success('Cập nhật đê kè thành công');
      } else {
        const created = await dikeRevetmentCRUD.create(payload);
        savedId = created.id;
        if (action === 'approve') {
          await dikeRevetmentApproval.submitForApproval(created.id);
          toast.success('Tạo và gửi phê duyệt đê kè thành công');
        } else {
          toast.success('Lưu tạm đê kè thành công');
        }
      }

      // Upload files sau khi lưu thành công (chuẩn /port)
      if (savedId && uploadFileList.length > 0) {
        let uploaded = 0;
        for (const f of uploadFileList) {
          if (!f.originFileObj) continue; // skip existing attachments
          try {
            const formData = new FormData();
            formData.append('file', f.originFileObj as File);
            await api.post(`/v1/documents/upload/dike-revetment/${savedId}`, formData, { headers: { 'Content-Type': undefined } });
            uploaded++;
          } catch { /* non-blocking */ }
        }
        if (uploaded > 0) toast.success(`Đã tải lên ${uploaded} tệp đính kèm`);
      }

      setDrawerVisible(false);
      setEditingRecord(null);
      setUploadFileList([]);
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
    if (deleteConfirmText.trim() !== 'XÓA' && deleteConfirmText.trim() !== expected) {
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

  const confirmApprove = async () => {
    if (!approvingRecord) return;
    try {
      await dikeRevetmentApproval.approveL1(approvingRecord.id);
      toast.success('Phê duyệt thành công');
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
      await dikeRevetmentApproval.reject(rejectingRecord.id, rejectReason.trim());
      toast.success('Từ chối thành công');
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
    setHistorySearch('');
    setHistoryFrom('');
    setHistoryTo('');
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const hist = await dikeRevetmentApproval.getHistory(record.id);
      setHistoryRecords(hist || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không tải được lịch sử');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const formatHistoryValue = (fn: string, val: any): string => {
    if (val === null || val === undefined || val === '') return '—';
    if (fn === 'dikeRevetmentType') return DIKE_REVETMENT_TYPE_MAP[val] || val;
    if (fn === 'status') return OPERATIONAL_STATUS_STYLE_MAP[val]?.label || val;
    if (fn === 'approvalStatus') return APPROVAL_STATUS_MAP[val] || val;
    if (fn === 'length' || fn === 'height' || fn === 'crestElevation') return `${val} m`;
    return String(val);
  };

  const renderHistoryTimeline = (records: any[]) => {
    if (!records || records.length === 0) {
      return (
        <Typography.Text style={{ color: textTertiary, fontSize: fontSizeMd }}>Không có lịch sử thay đổi</Typography.Text>
      );
    }
    const filtered = records.filter((h: any) => {
      if (historySearch) {
        const haystack = `${h.fieldChanged || ''} ${h.oldValue || ''} ${h.newValue || ''} ${h.actionType || ''}`.toLowerCase();
        if (!haystack.includes(historySearch.toLowerCase())) return false;
      }
      if (historyFrom && h.changedAt && dayjs(h.changedAt).isBefore(dayjs(historyFrom))) return false;
      if (historyTo && h.changedAt && dayjs(h.changedAt).isAfter(dayjs(historyTo))) return false;
      return true;
    });
    if (filtered.length === 0) {
      return (
        <Typography.Text style={{ color: textTertiary, fontSize: fontSizeMd }}>Không có lịch sử thay đổi</Typography.Text>
      );
    }
    return filtered.map((h: any) => {
      const actionType: string = h.actionType || '';
      const badgeColor = HISTORY_ACTION_COLOR[actionType] || textTertiary;
      const actionLabel = APPROVAL_STATUS_MAP[actionType] || actionType;
      const isCreate = actionType === 'TAO_MOI';
      const isDelete = actionType === 'XOA_MEM';
      const isReject = actionType === 'TU_CHOI';
      const changeKey = h.id != null ? String(h.id) : `${h.changedAt ?? 'x'}-${h.actionType ?? 'x'}`;
      const changeItems = Array.isArray(h.changes) ? h.changes : [];

      return (
        <div key={changeKey} style={{ ...historyInfoCardStyle, marginBottom: spaceMd }}>
          <div style={historyAccentBarStyle(badgeColor)} />
          <div style={{ padding: spaceMd }}>
            <div style={historyMetaRowStyle}>
              <span style={historyBadgeStyle(badgeColor)}>{actionLabel}</span>
              <span style={{ marginLeft: 'auto', color: textTertiary, fontSize: fontSizeSm }}>
                {formatDate(h.changedAt)}
              </span>
            </div>
            {h.changedByName && (
              <div style={{ marginTop: spaceXs }}>
                <span style={{ color: textSecondary, fontSize: fontSizeSm }}>Người thực hiện: </span>
                <span style={{ color: textPrimary, fontSize: fontSizeSm, fontWeight: fontWeightMedium }}>{h.changedByName}</span>
              </div>
            )}
            <div style={{ marginTop: spaceSm }}>
              {isDelete ? (
                <div style={{ color: statusCritical, fontSize: fontSizeMd, fontWeight: fontWeightMedium }}>
                  Công trình đã bị xóa mềm
                </div>
              ) : isReject ? (
                <div style={historyChangeRowStyle}>
                  <div style={historyFieldLabelStyle}>Lý do từ chối:</div>
                  <span title={h.reason || h.note} style={historyNewValueStyle}>{h.reason || h.note || '—'}</span>
                </div>
              ) : changeItems.length > 0 ? (
                changeItems.map((chg: any) => {
                  const fn = chg.fieldChanged || '';
                  const ov = formatHistoryValue(fn, chg.oldValue);
                  const nv = formatHistoryValue(fn, chg.newValue);
                    return isCreate ? (
                    <div key={`${changeKey}-${chg.fieldChanged ?? 'v'}`} style={historyCreateRowStyle}>
                      <div style={historyFieldLabelStyle}>{fn ? `${historyFieldName(fn)}:` : '—'}</div>
                      <span title={nv} style={historyNewValueStyle}>{nv}</span>
                    </div>
                  ) : (
                    <div key={`${changeKey}-${chg.fieldChanged ?? 'v'}`} style={historyChangeRowStyle}>
                      <div style={historyFieldLabelStyle}>{fn ? `${historyFieldName(fn)}:` : '—'}</div>
                      <span title={ov} style={historyOldValueStyle}>{ov}</span>
                      <span style={historyArrowStyle}>→</span>
                      <span title={nv} style={historyNewValueStyle}>{nv}</span>
                    </div>
                  );
                })
              ) : (
                <div style={{ color: textSecondary, fontSize: fontSizeMd }}>{actionLabel}</div>
              )}
            </div>
          </div>
        </div>
      );
    });
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
      key: 'orgUnitName',
      label: 'Đơn vị quản lý',
      dataIndex: 'orgUnitName',
      width: 260,
      fixed: 'left' as const,
      render: (val: string | undefined, record: DikeRevetmentResponse) => val || record.orgUnitId || '',
    },
    {
      key: 'dikeRevetmentName',
      label: 'Tên đê kè',
      dataIndex: 'dikeRevetmentName',
      width: 250,
      fixed: 'left' as const,
      render: (val: string) => <span style={{ color: textPrimary, fontWeight: fontWeightMedium }}>{val || ''}</span>,
    },
    {
      key: 'code',
      label: 'Mã đê kè',
      dataIndex: 'code',
      width: 150,
      render: (val: string) => <span style={{ color: textPrimary, fontWeight: fontWeightMedium }}>{val || ''}</span>,
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
        return st ? <span style={historyBadgeStyle(st.color)}>{st.label}</span> : val;
      },
    },
    {
      key: 'commissioningDate',
      label: 'Thời điểm đưa vào khai thác',
      dataIndex: 'commissioningDate',
      width: 250,
      render: (val: string) => formatDateOnly(val),
    },
    {
      key: 'updatedAt',
      label: 'Ngày cập nhật',
      dataIndex: 'updatedAt',
      width: 160,
      render: (val: string) => formatDate(val),
    },
    {
      key: 'updatedBy',
      label: 'Cán bộ cập nhật',
      dataIndex: 'updatedByName',
      width: 160,
      render: (val: string) => val || '',
    },
    {
      key: 'approvalStatus',
      label: 'Trạng thái',
      dataIndex: 'approvalStatus',
      width: 160,
      render: (status: string) => <ApprovalStatusBadge status={status} />,
    },
  ], []);

  const rowActions = useCallback((record: DikeRevetmentResponse) => {
    const actions: any[] = [];
    const canRead = hasPerm('dikerevetment:read');
    const canUpdate = hasPerm('dikerevetment:update');
    const canDelete = hasPerm('dikerevetment:delete');
    const isProposed = record.approvalStatus === 'PROPOSED';
    const isPending = record.approvalStatus === 'PENDING_APPROVAL';
    const isRejected = record.approvalStatus === 'REJECTED';

    if (canRead) {
      actions.push({
        key: 'detail',
        label: 'Xem chi tiết',
        icon: <EyeOutlined />,
        onClick: () => openDetailDrawer(record),
      });
    }
    if (canUpdate) {
      actions.push({
        key: 'edit',
        label: 'Chỉnh sửa',
        icon: <EditOutlined />,
        onClick: () => openEditDrawer(record),
      });
    }
    if (canUpdate && (isProposed || isRejected)) {
      actions.push({
        key: 'submit',
        label: 'Gửi phê duyệt',
        icon: <SendOutlined />,
        onClick: () => openSubmitModal(record),
      });
    }
    if (canUpdate && isPending) {
      actions.push({
        key: 'approve',
        label: 'Phê duyệt',
        icon: <CheckCircleOutlined />,
        onClick: () => openApproveModal(record),
      });
    }
    if (canUpdate && isPending) {
      actions.push({
        key: 'reject',
        label: 'Từ chối',
        icon: <CloseCircleOutlined />,
        danger: true,
        onClick: () => openRejectModal(record),
      });
    }
    // F-046: chỉ xóa bản ghi PROPOSED (xóa mềm)
    if (canDelete && isProposed) {
      actions.push({
        key: 'delete',
        label: 'Xóa',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => openDeleteModal(record),
      });
    }
    if (canRead) {
      actions.push({
        key: 'history',
        label: 'Lịch sử',
        icon: <HistoryOutlined />,
        onClick: () => openHistoryModal(record),
      });
    }
    return actions;
  }, [hasPerm, openDetailDrawer, openEditDrawer, openSubmitModal, openApproveModal, openRejectModal, openDeleteModal, openHistoryModal]);

  // ── Filter content (sidebar) ─────────────────────────────────────
  // Bộ lọc theo sheet QL đê kè: mặc định = Đơn vị quản lý + Tên đê kè (+ Trạng thái phê duyệt = StatusTabs),
  // nâng cao (ẩn/hiện) = Mã đê kè, Thuộc cảng biển, Địa điểm, Loại kết cấu, Tình trạng, Thời điểm khai thác, Ngày cập nhật
  const filterContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spaceMd }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: spaceXs, marginTop: spaceMd }}>
      <span style={filterLabelStyle}>Tên đê kè</span>
        <Input
          placeholder="Nhập Tên đê kè..."
          allowClear
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          onPressEnter={() => { setPage(1); fetchData(); }}
          style={filterInputStyle}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spaceXs }}>
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

      {filterCollapsed && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spaceXs }}>
            <span style={filterLabelStyle}>Mã đê kè</span>
            <Input
              placeholder="Nhập Mã đê kè..."
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
              placeholder="Tất cả"
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
              placeholder="Tất cả"
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
              placeholder="Tất cả"
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
              placeholder="Tất cả"
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
              placeholder="Chọn năm"
              value={filterCommissioningYear ? dayjs(filterCommissioningYear) : null}
              onChange={(d) => setFilterCommissioningYear(d ? d.format('YYYY') : undefined)}
              style={selectStyle}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spaceXs }}>
            <span style={filterLabelStyle}>Ngày cập nhật</span>
            <DatePicker.RangePicker
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
  // DetailRow + renderDetailRows + renderToggleSection (▼/▶) + tabs riêng từng nhóm
  type DetailRow = { label: string; value: React.ReactNode };

  const renderDetailRows = (rows: DetailRow[], paddingTop = spaceMd) => (
    <div style={{ paddingTop, display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {rows.map((row) => (
        <div key={row.label} style={detailRowStyle}>
          <div style={detailLabelColStyle}>{row.label}:</div>
          <div style={detailValueStyle}>{row.value}</div>
        </div>
      ))}
    </div>
  );

  const renderToggleSection = (open: boolean, onToggle: () => void, title: string, rows: DetailRow[]) => (
    <div>
      <button
        type="button"
        onClick={onToggle}
        style={{ cursor: 'pointer', marginTop: spaceSm, padding: `0 0 0 ${spaceMd}px`, background: 'none', border: 'none', display: 'block', textAlign: 'left' }}
      >
        <span style={{ color: open ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>
          {open ? '▼' : '▶'} {title}
        </span>
      </button>
      {open && renderDetailRows(rows, spaceXs)}
    </div>
  );

  const detailBasicRows: DetailRow[] = detailRecord ? [
    { label: 'Mã đê kè', value: detailRecord.code ?? '' },
    { label: 'Tên đê kè', value: detailRecord.dikeRevetmentName ?? '' },
    { label: 'Đơn vị quản lý', value: detailRecord.orgUnitName || detailRecord.orgUnitId || '' },
    { label: 'Thuộc cảng biển', value: detailRecord.seaportName || detailRecord.seaportId || '' },
    { label: 'Đơn vị vận hành', value: detailRecord.donViVanHanhName || detailRecord.donViVanHanhId || '' },
    { label: 'Địa điểm (Tỉnh/TP)', value: detailRecord.location ?? '' },
    { label: 'Địa điểm chi tiết', value: detailRecord.locationDetail ?? '' },
    { label: 'Loại kết cấu công trình', value: detailRecord.dikeRevetmentType ? (DIKE_REVETMENT_TYPE_MAP[detailRecord.dikeRevetmentType] || detailRecord.dikeRevetmentType) : '' },
    { label: 'Tình trạng', value: detailRecord.status ? (OPERATIONAL_STATUS_STYLE_MAP[detailRecord.status]?.label || detailRecord.status) : '' },
    { label: 'Ghi chú', value: detailRecord.note ?? '' },
  ] : [];

  const detailTechnicalRows: DetailRow[] = detailRecord ? [
    { label: 'Chiều dài (m)', value: detailRecord.length != null ? String(detailRecord.length) : '' },
    { label: 'Chiều cao (m)', value: detailRecord.height != null ? String(detailRecord.height) : '' },
    { label: 'Cao trình đỉnh (m)', value: detailRecord.crestElevation != null ? String(detailRecord.crestElevation) : '' },
    { label: 'Thời điểm xây dựng', value: formatDateOnly(detailRecord.constructionDate) },
    { label: 'Thời điểm đưa vào khai thác', value: formatDateOnly(detailRecord.commissioningDate) },
    { label: 'Năm bảo trì gần nhất', value: detailRecord.lastMaintenanceYear ?? '' },
  ] : [];

  const detailGisRows: DetailRow[] = detailRecord ? [
    { label: 'Loại đối tượng', value: detailRecord.geometryType === 'POINT' ? 'Đối tượng điểm' : detailRecord.geometryType === 'LINE' ? 'Đối tượng đường' : detailRecord.geometryType === 'POLYGON' ? 'Đối tượng vùng' : '—' },
    {
      label: 'Biểu tượng bản đồ',
      value: detailRecord.symbolId
        ? (() => {
            const sym = symbols.find((s) => s.id === detailRecord.symbolId);
            return sym
              ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{sym.image ? <img src={sym.image.startsWith('data:') ? sym.image : `data:image/png;base64,${sym.image}`} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} /> : null}{sym.name}</span>
              : detailRecord.symbolId;
          })()
        : '—',
    },
    { label: 'Hệ quy chiếu', value: '—' },
    { label: 'Quy tắc hiển thị', value: (detailRecord.geometryType || detailRecord.coordinates) ? 'Độ, phút, giây (DMS)' : '—' },
  ] : [];

  const detailLogRows: DetailRow[] = detailRecord ? [
    { label: 'Ngày cập nhật', value: formatDate(detailRecord.updatedAt) },
    { label: 'Cán bộ cập nhật', value: detailRecord.updatedBy ?? '' },
    { label: 'Ngày gửi phê duyệt', value: formatDate(detailRecord.submittedAt) },
    { label: 'Cán bộ gửi phê duyệt', value: detailRecord.submittedByName ?? '' },
    { label: 'Ngày phê duyệt cấp Cảng vụ/Chi cục', value: formatDate(detailRecord.approvedDateLevel1) },
    { label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục', value: detailRecord.approvedByNameLevel1 || detailRecord.approverLevel1 || '' },
    { label: 'Nội dung phê duyệt', value: detailRecord.approvalNoteLevel1 ?? '' },
    { label: 'Ngày phê duyệt cấp Cục', value: formatDate(detailRecord.approvedDateLevel2) },
    { label: 'Cán bộ phê duyệt cấp Cục', value: detailRecord.approvedByNameLevel2 || detailRecord.approverLevel2 || '' },
    { label: 'Nội dung phê duyệt', value: detailRecord.approvalNoteLevel2 ?? '' },
    { label: 'Trạng thái (Trạng thái phê duyệt)', value: <ApprovalStatusBadge status={detailRecord.approvalStatus} /> },
  ] : [];

  const detailOperationRows: DetailRow[] = detailRecord ? [
    { label: 'Mã kế hoạch', value: detailRecord.operationPlanCode ?? '' },
    { label: 'Tên kế hoạch', value: detailRecord.operationPlanName ?? '' },
    { label: 'Ngày bắt đầu', value: detailRecord.operationStartDate ?? '' },
    { label: 'Ngày kết thúc', value: detailRecord.operationEndDate ?? '' },
  ] : [];

  const detailMaintenanceRows: DetailRow[] = detailRecord ? [
    { label: 'Mã kế hoạch', value: detailRecord.maintenancePlanCode ?? '' },
    { label: 'Tên kế hoạch', value: detailRecord.maintenancePlanName ?? '' },
    { label: 'Thời gian bắt đầu', value: detailRecord.maintenanceStartDate ?? '' },
    { label: 'Thời gian kết thúc', value: detailRecord.maintenanceEndDate ?? '' },
  ] : [];

  const detailIncidentRows: DetailRow[] = detailRecord ? [
    { label: 'Mã sự cố', value: detailRecord.incidentCode ?? '' },
    { label: 'Loại sự cố', value: detailRecord.incidentType ?? '' },
    { label: 'Địa điểm', value: detailRecord.incidentLocation ?? '' },
    { label: 'Thời gian', value: detailRecord.incidentTime ?? '' },
  ] : [];

  const detailTabItems = detailRecord
    ? [
        {
          key: 'basic',
          label: 'Thông tin cơ bản',
          children: (
            <>
              {renderDetailRows(detailBasicRows)}
              {renderToggleSection(logOpen, () => setLogOpen(!logOpen), 'Log cập nhật & phê duyệt', detailLogRows)}
            </>
          ),
        },
        { key: 'technical', label: 'Thông tin kỹ thuật & thời gian', children: renderDetailRows(detailTechnicalRows) },
        {
          key: 'gis',
          label: 'Tọa độ GIS',
          children: (
            <>
              {renderDetailRows(detailGisRows, spaceXs)}
              <div style={{ marginTop: spaceSm, padding: '0 12px' }}>
                <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tọa độ GPS</span>
                {(() => {
                  const pts = detailRecord ? parseWktToVertices(detailRecord.coordinates || '', detailRecord.geometryType || '') : [];
                  return pts.length === 0 ? (
                    <div style={{ marginTop: spaceXs, color: textTertiary, fontSize: fontSizeMd }}>Không có tọa độ</div>
                  ) : (
                    <Table className="list-view-table" dataSource={pts.map((p, i) => ({ ...p, key: i }))} pagination={false} size="middle" bordered style={{ marginTop: spaceXs }}>
                      <Table.Column title="STT" key="stt" width={60} align="center"
                        render={(_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{i + 1}</span>}
                        onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                      <Table.Column title="Vĩ độ (N)" key="lat" align="center"
                        render={(_: any, record: any) => {
                          const dms = ddToDms(record.lat);
                          return <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}><InputNumber value={dms.d} readOnly style={{ flex: 1, textAlign: 'center' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>°</span><InputNumber value={dms.m} readOnly style={{ flex: 1, textAlign: 'center' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>'</span><InputNumber value={dms.s} readOnly style={{ flex: 1.2, textAlign: 'center' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, fontSize: fontSizeSm, color: textTertiary }}>"</span></Space.Compact>;
                        }}
                        onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                      <Table.Column title="Kinh độ (E)" key="lng" align="center"
                        render={(_: any, record: any) => {
                          const dms = ddToDms(record.lng);
                          return <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}><InputNumber value={dms.d} readOnly style={{ flex: 1, textAlign: 'center' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>°</span><InputNumber value={dms.m} readOnly style={{ flex: 1, textAlign: 'center' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>'</span><InputNumber value={dms.s} readOnly style={{ flex: 1.2, textAlign: 'center' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, fontSize: fontSizeSm, color: textTertiary }}>"</span></Space.Compact>;
                        }}
                        onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                    </Table>
                  );
                })()}
              </div>
            </>
          ),
        },
        {
          key: 'files',
          label: 'File đính kèm',
          children: (
            <div style={{ paddingTop: 3 }}>
              <div style={{ marginBottom: spaceSm, padding: '10px 12px 0 12px' }}>
                <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>File đính kèm</span>
              </div>
              {(detailRecord.attachments || []).length === 0 ? (
                <span style={{ color: textTertiary, fontSize: fontSizeMd, paddingLeft: 12 }}>Không có tài liệu đính kèm</span>
              ) : (
                <Table className="list-view-table" dataSource={(detailRecord.attachments || []).map((a, i) => ({ ...a, key: a.id, _idx: i }))} pagination={false} size="middle" bordered style={{ marginLeft: 12, marginRight: 12 }}>
                  <Table.Column title="STT" key="stt" width={60} align="center"
                    render={(_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{i + 1}</span>}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                  <Table.Column title="Tên file" key="name" dataIndex="fileName" align="center"
                    render={(name: string) => <div style={{ textAlign: 'left', fontSize: fontSizeMd, color: textPrimary }}><FileOutlined style={{ marginRight: spaceSm, color: textTertiary }} />{name}</div>}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                </Table>
              )}
            </div>
          ),
        },
        {
          key: 'operation',
          label: 'Các thông tin khác',
          children: (
            <>
              {renderToggleSection(operationOpen, () => setOperationOpen(!operationOpen), 'Thông tin vận hành khai thác', detailOperationRows)}
              {renderToggleSection(maintenanceOpen, () => setMaintenanceOpen(!maintenanceOpen), 'Thông tin bảo trì', detailMaintenanceRows)}
              {renderToggleSection(incidentOpen, () => setIncidentOpen(!incidentOpen), 'Thông tin sự cố', detailIncidentRows)}
            </>
          ),
        },
      ]
    : [];

  // ── JSX ─────────────────────────────────────────────────────────
  return (
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
            scroll={{ x: 2320, y: 550 }}
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
      <Drawer
        {...drawerProps}
        title={
          <span style={isDetailMode || editingRecord ? drawerTitleStyle : { ...drawerTitleStyle, fontSize: 16 }}>
            {isDetailMode
              ? `Chi tiết đê kè${detailRecord?.dikeRevetmentName ? ` — ${detailRecord.dikeRevetmentName}` : ''}`
              : editingRecord
                ? `Chỉnh sửa — ${editingRecord.dikeRevetmentName || ''}`
                : 'Thêm mới đê kè'}
          </span>
        }
        open={drawerVisible}
        destroyOnHidden
        onClose={closeDrawer}
        extra={<Button type="text" onClick={closeDrawer} style={drawerCloseBtnStyle}>✕</Button>}
        footer={
          isDetailMode ? null : editingRecord ? (
            <div style={drawerFooterStyle}>
              <Button type="primary" onClick={() => handleSubmit('update')} loading={submitting} style={primaryButtonStyle}>
                Cập nhật
              </Button>
            </div>
          ) : (
            <div style={drawerFooterStyle}>
              <Button onClick={() => handleSubmit('draft')} loading={submitting} style={outlineButtonStyle}>Lưu tạm</Button>
              {canSubmitForApproval && (
                <Button type="primary" onClick={() => handleSubmit('approve')} loading={submitting} style={primaryButtonStyle}>
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
            <Form form={createForm} layout="vertical" initialValues={{}}>
              <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} tabBarStyle={tabBarStyle}
                items={[
                  {
                    key: 'general',
                    label: 'Thông tin chung',
                    children: (
                      <div style={{ paddingTop: spaceMd }}>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="code" {...labelProps('Mã đê kè')} style={formFieldStyle}
                              tooltip="Mã đê kè được sinh tự động, không thể chỉnh sửa">
                              <Input disabled placeholder={codeLoading ? 'Đang sinh mã...' : 'Mã tự động'} maxLength={50}
                                style={{ ...inputStyle, color: textTertiary, cursor: 'not-allowed' }} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="dikeRevetmentName" {...labelProps('Tên đê kè')} required style={formFieldStyle}
                              rules={[{ required: true, message: 'Vui lòng nhập tên đê kè' }]}>
                              <Input placeholder="Nhập Tên đê kè..." style={inputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="dikeRevetmentType" {...labelProps('Loại kết cấu công trình')} required style={formFieldStyle}
                              rules={[{ required: true, message: 'Vui lòng chọn loại kết cấu công trình' }]}>
                              <Select placeholder="Chọn loại kết cấu..." options={DIKE_REVETMENT_TYPE_OPTIONS} style={selectStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="status" {...labelProps('Tình trạng')} required style={formFieldStyle}
                              rules={[{ required: true, message: 'Vui lòng chọn tình trạng' }]}>
                              <Select placeholder="Chọn tình trạng..." options={OPERATIONAL_STATUS_OPTIONS} style={selectStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="orgUnitId" {...labelProps('Đơn vị quản lý')} required style={formFieldStyle}
                              rules={[{ required: true, message: 'Vui lòng chọn đơn vị quản lý' }]}>
                              <TreeSelect placeholder="Chọn đơn vị..." treeData={buildOrgTree(organizations)}
                                showSearch treeNodeFilterProp="title" treeDefaultExpandAll
                                disabled={!!editingRecord || !isElevatedOrg} style={selectStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="donViVanHanhName" {...labelProps('Đơn vị vận hành')} style={formFieldStyle}>
                              <Input placeholder="VD: Công ty Hoa tiêu Hàng hải" style={inputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="seaportId" {...labelProps('Thuộc cảng biển')} style={formFieldStyle}>
                              <Select placeholder="Chọn cảng biển..." allowClear showSearch optionFilterProp="label"
                                options={seaports.map((p) => ({ value: p.id, label: p.portName || p.portCode || p.id }))}
                                style={selectStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="location" {...labelProps('Địa điểm (Tỉnh/TP)')} required style={formFieldStyle}
                              rules={[{ required: true, message: 'Vui lòng nhập địa điểm' }]}>
                              <Input placeholder="VD: Hải Phòng" style={inputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="locationDetail" {...labelProps('Địa điểm chi tiết')} style={formFieldStyle}>
                              <Input placeholder="Nhập địa điểm chi tiết..." style={inputStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="constructionDate" {...labelProps('Thời điểm xây dựng')} style={formFieldStyle}>
                              <DatePicker placeholder="Chọn ngày" format="DD/MM/YYYY" style={{ width: '100%', ...selectStyle }} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="commissioningDate" {...labelProps('Thời điểm đưa vào khai thác')} style={formFieldStyle}>
                              <DatePicker placeholder="Chọn ngày" format="DD/MM/YYYY" style={{ width: '100%', ...selectStyle }} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="lastMaintenanceYear" {...labelProps('Năm bảo trì')} style={formFieldStyle}>
                              <DatePicker picker="year" placeholder="Chọn năm" style={{ width: '100%', ...selectStyle }} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={8}>
                            <Form.Item name="length" {...labelProps('Chiều dài (m)')} required style={formFieldStyle}
                              rules={[{ required: true, message: 'Vui lòng nhập chiều dài' }]}>
                              <InputNumber min={0.01} max={99999} step={0.01} precision={2} placeholder="VD: 850" style={{ width: '100%', ...inputStyle }} />
                            </Form.Item>
                          </Col>
                          <Col span={8}>
                            <Form.Item name="height" {...labelProps('Chiều cao (m)')} style={formFieldStyle}>
                              <InputNumber min={0} max={99999} step={0.01} precision={2} placeholder="VD: 12.5" style={{ width: '100%', ...inputStyle }} />
                            </Form.Item>
                          </Col>
                          <Col span={8}>
                            <Form.Item name="crestElevation" {...labelProps('Cao trình đỉnh (m)')} style={formFieldStyle}>
                              <InputNumber min={0} max={99999} step={0.01} precision={2} placeholder="VD: 5.2" style={{ width: '100%', ...inputStyle }} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Form.Item name="note" {...labelProps('Ghi chú')} style={formFieldStyle}>
                          <Input.TextArea placeholder="Nhập ghi chú..." rows={3} maxLength={500}
                            styles={{ textarea: { borderRadius: radiusPill, minHeight: 40 } }} />
                        </Form.Item>
                      </div>
                    ),
                  },
                  {
                    key: 'gis',
                    label: 'Tọa độ GIS',
                    children: (
                      <div style={{ paddingTop: spaceMd }}>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="geometryType" {...labelProps('Loại đối tượng')} style={formFieldStyle}>
                              <Select placeholder="Chọn loại đối tượng"
                                options={[
                                  { value: 'POINT', label: 'Đối tượng điểm' },
                                  { value: 'LINE', label: 'Đối tượng đường' },
                                  { value: 'POLYGON', label: 'Đối tượng vùng' },
                                ]} style={selectStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="symbolId" {...labelProps('Biểu tượng bản đồ')} style={formFieldStyle}>
                              <Select placeholder="Chọn biểu tượng hiển thị" allowClear showSearch optionFilterProp="label"
                                style={selectStyle}
                                disabled={!createGeometryType}
                                options={symbols.map((sym) => ({ value: sym.id, label: sym.code ? `${sym.name} (${sym.code})` : sym.name }))} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="coordinateSystem" {...labelProps('Hệ quy chiếu')} style={formFieldStyle}>
                              <Select placeholder="Chọn hệ quy chiếu" disabled style={selectStyle}
                                options={[{ value: 1, label: 'WGS-84' }, { value: 2, label: 'VN-2000' }]} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="displayRule" {...labelProps('Quy tắc hiển thị')} style={formFieldStyle}>
                              <Input placeholder="Chọn quy tắc hiển thị" maxLength={255} disabled
                                style={{ ...inputStyle, color: textTertiary, cursor: 'not-allowed' }} />
                            </Form.Item>
                          </Col>
                        </Row>
                        {/* GPS Coordinates (DMS) */}
                        <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>
                            <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tọa độ GPS{createGeometryType && <span style={{ color: statusCritical, marginLeft: 4, fontSize: fontSizeMd }}>*</span>}</span>
                          </span>
                          {gpsCoordList.length > 0 && (
                            <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addGpsPoint} style={{ borderRadius: radiusPill }}>
                              Thêm tọa độ
                            </Button>
                          )}
                        </div>
                        {gpsCoordList.length === 0 ? (
                          <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
                            <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>
                              Chưa có tọa độ nào.
                            </span>
                            <Button type="dashed" icon={<PlusOutlined />} onClick={addGpsPoint} style={{ borderRadius: radiusPill }}>Thêm tọa độ</Button>
                          </div>
                        ) : (
                          <Table className="list-view-table" dataSource={gpsCoordList.map((c, i) => ({ ...c, key: i, _idx: i }))}
                            pagination={false} size="middle" bordered scroll={{ x: 820 }}>
                            <Table.Column title="STT" key="stt" width={60} align="center"
                              render={(_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{i + 1}</span>}
                              onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                            <Table.Column title="Vĩ độ (N)" key="lat"
                              render={(_: any, record: any) => {
                                const dms = ddToDms(record.lat);
                                return <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}>
                                  <InputNumber value={dms.d} min={0} max={90} placeholder="Độ"
                                    onChange={(v) => updateGpsPoint(record._idx, 'lat', v ?? 0, dms.m, dms.s)}
                                    style={{ flex: 1 }} controls={false} />
                                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>°</span>
                                  <InputNumber value={dms.m} min={0} max={59} placeholder="Phút"
                                    onChange={(v) => updateGpsPoint(record._idx, 'lat', dms.d, v ?? 0, dms.s)}
                                    style={{ flex: 1 }} controls={false} />
                                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>'</span>
                                  <InputNumber value={dms.s} min={0} max={59.99} step={0.01} placeholder="Giây"
                                    onChange={(v) => updateGpsPoint(record._idx, 'lat', dms.d, dms.m, v ?? 0)}
                                    style={{ flex: 1.2 }} controls={false} />
                                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, fontSize: fontSizeSm, color: textTertiary }}>"</span>
                                </Space.Compact>;
                              }}
                              onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                            <Table.Column title="Kinh độ (E)" key="lng"
                              render={(_: any, record: any) => {
                                const dms = ddToDms(record.lng);
                                return <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}>
                                  <InputNumber value={dms.d} min={0} max={180} placeholder="Độ"
                                    onChange={(v) => updateGpsPoint(record._idx, 'lng', v ?? 0, dms.m, dms.s)}
                                    style={{ flex: 1 }} controls={false} />
                                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>°</span>
                                  <InputNumber value={dms.m} min={0} max={59} placeholder="Phút"
                                    onChange={(v) => updateGpsPoint(record._idx, 'lng', dms.d, v ?? 0, dms.s)}
                                    style={{ flex: 1 }} controls={false} />
                                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>'</span>
                                  <InputNumber value={dms.s} min={0} max={59.99} step={0.01} placeholder="Giây"
                                    onChange={(v) => updateGpsPoint(record._idx, 'lng', dms.d, dms.m, v ?? 0)}
                                    style={{ flex: 1.2 }} controls={false} />
                                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, fontSize: fontSizeSm, color: textTertiary }}>"</span>
                                </Space.Compact>;
                              }}
                              onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                            <Table.Column title="" key="actions" width={44} align="center"
                              render={(_: any, record: any) => <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => removeGpsPoint(record._idx)} />}
                              onHeaderCell={() => ({ style: { background: colors.bodyBg, padding: '12px 6px' } })} />
                          </Table>
                        )}
                      </div>
                    ),
                  },
                  {
                    key: 'files',
                    label: 'File đính kèm',
                    children: (
                      <div style={{ paddingTop: spaceMd }}>
                        <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>File đính kèm</span>
                          {uploadFileList.length > 0 && (
                            <Upload
                              beforeUpload={(file) => {
                                if (file.size > 20 * 1024 * 1024) { message.error('File vượt quá 20MB'); return false; }
                                const ext = file.name.split('.').pop()?.toLowerCase();
                                if (!ext || !['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(ext)) { message.error('Định dạng không hỗ trợ'); return false; }
                                if (uploadFileList.length >= 10) { message.error('Tối đa 10 file'); return false; }
                                setUploadFileList([...uploadFileList, { uid: `${Date.now()}`, name: file.name, status: 'done', originFileObj: file }]);
                                return false;
                              }}
                              showUploadList={false}
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif"
                              multiple
                            >
                              <Button type="dashed" size="small" icon={<PlusOutlined />} style={{ borderRadius: radiusPill }}>Thêm file</Button>
                            </Upload>
                          )}
                        </div>
                        {uploadFileList.length === 0 ? (
                          <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
                            <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>Chưa có file đính kèm.</span>
                            <Upload
                              beforeUpload={(file) => {
                                if (file.size > 20 * 1024 * 1024) { message.error('File vượt quá 20MB'); return false; }
                                const ext = file.name.split('.').pop()?.toLowerCase();
                                if (!ext || !['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(ext)) { message.error('Định dạng không hỗ trợ'); return false; }
                                if (uploadFileList.length >= 10) { message.error('Tối đa 10 file'); return false; }
                                setUploadFileList([...uploadFileList, { uid: `${Date.now()}`, name: file.name, status: 'done', originFileObj: file }]);
                                return false;
                              }}
                              showUploadList={false}
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif"
                              multiple
                            >
                              <Button type="dashed" icon={<UploadOutlined />} style={{ borderRadius: radiusPill }}>Chọn file</Button>
                            </Upload>
                          </div>
                        ) : (
                          <Table className="list-view-table" dataSource={uploadFileList.map((f, i) => ({ ...f, key: f.uid, _idx: i }))}
                            pagination={false} size="middle" bordered scroll={{ x: 400 }}>
                            <Table.Column title="STT" key="stt" width={60} align="center"
                              render={(_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{i + 1}</span>}
                              onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                            <Table.Column title="Tên file" key="name" dataIndex="name"
                              render={(name: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}><FileOutlined style={{ marginRight: spaceSm, color: textTertiary }} />{name}</span>}
                              onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                            <Table.Column title="" key="actions" width={44} align="center"
                              render={(_: any, record: any) => <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => setUploadFileList(uploadFileList.filter((x) => x.uid !== record.uid))} />}
                              onHeaderCell={() => ({ style: { background: colors.bodyBg, padding: '12px 6px' } })} />
                          </Table>
                        )}
                        <div style={{ marginTop: spaceSm }}>
                          <span style={{ color: textTertiary, fontSize: fontSizeSm }}>Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF. Tối đa 10 file, mỗi file ≤20MB.</span>
                        </div>
                      </div>
                    ),
                  },
                ]}
              />
            </Form>
          </>
        )}
      </Drawer>

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
          <Input placeholder="Nhập tên công trình hoặc XÓA" value={deleteConfirmText}
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

      {/* ── Approve Modal ─────────────────────────────────────────── */}
      <Modal
        title={
          <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>
            Phê duyệt
          </span>
        }
        open={approveModalOpen}
        onCancel={() => { setApproveModalOpen(false); setApprovingRecord(null); }}
        footer={[
          <Button key="cancel" onClick={() => { setApproveModalOpen(false); setApprovingRecord(null); }}
            style={outlineButtonStyle}>Hủy</Button>,
          <Button key="approve" type="primary" onClick={confirmApprove}
            style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}>
            Xác nhận phê duyệt
          </Button>,
        ]}
        width={480}
      >
        <div style={confirmModalBodyStyle}>
          <p>
            Phê duyệt <strong>{approvingRecord?.dikeRevetmentName}</strong>?
          </p>
        </div>
      </Modal>

      {/* ── Reject Modal ─────────────────────────────────────────── */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Từ chối phê duyệt</span>}
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

      {/* ── History Modal ────────────────────────────────────────── */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Lịch sử thay đổi</span>}
        open={historyOpen}
        onCancel={() => { setHistoryOpen(false); setHistoryTarget(null); setHistoryRecords([]); }}
        footer={null}
        width={720}
      >
        {historyTarget && (
          <p style={{ marginBottom: spaceFormField }}>
            <strong>Đê/kè:</strong> {historyTarget.code || ''} — {historyTarget.dikeRevetmentName}
          </p>
        )}
        <Space style={{ marginTop: spaceMd, marginBottom: spaceMd }} wrap>
          <Input placeholder="Tìm kiếm nội dung thay đổi..." allowClear value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)} style={{ width: 240, ...inputStyle }} />
          <DatePicker placeholder="Từ ngày" value={historyFrom ? dayjs(historyFrom) : null}
            onChange={(d) => setHistoryFrom(d ? d.format('YYYY-MM-DD HH:mm:ss') : '')}
            style={{ width: 170, ...selectStyle }} format="DD/MM/YYYY HH:mm:ss" showTime />
          <DatePicker placeholder="Đến ngày" value={historyTo ? dayjs(historyTo) : null}
            onChange={(d) => setHistoryTo(d ? d.format('YYYY-MM-DD HH:mm:ss') : '')}
            style={{ width: 170, ...selectStyle }} format="DD/MM/YYYY HH:mm:ss" showTime />
        </Space>
        <div style={{ maxHeight: 500, overflowY: 'auto', marginTop: spaceFormField }}>
          {historyLoading ? (
            <LoadingSkeleton rows={5} />
          ) : (
            renderHistoryTimeline(historyRecords)
          )}
        </div>
      </Modal>
    </div>
  );
}

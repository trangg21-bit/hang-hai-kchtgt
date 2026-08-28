import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Button,
  Tag,
  Modal,
  Input,
  Select,
  TreeSelect,
  Radio,
  Space,
  Typography,
  Checkbox,
  Form,
  DatePicker,
  Row,
  Col,
  Upload,
  Tabs,
  Table,
  Tooltip,
  Popconfirm,
  Descriptions,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  FileOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  HistoryOutlined,
  SendOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import type { UploadFile } from 'antd';
import type { RcFile } from 'antd/es/upload/interface';
import {
  beaconStationCRUD,
  approval,
  beaconHistory,
} from '../../services/beaconService';
import type { BeaconStation } from '../../types/beacon';
import {
  BEACON_STATUS_MAP,
  BEACON_LIGHT_TYPE_OPTIONS,
  BEACON_LIGHT_TYPE_MAP,
  BEACON_HISTORY_ACTION_MAP,
  type BeaconStatus,
  type BeaconLightType,
} from '../../types/beacon';
import { organizationService } from '../../services/organizationService';
import { userService } from '../../services/userService';
import type { Organization } from '../../services/organizationService';
import { ScreenHeader, DataTable } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast, { message } from '../../components/ToastNotification';
import FormField from '../../components/FormField';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import RejectionModal from '../../components/shared/RejectionModal';
import { colors } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import { VIETNAM_PROVINCE_OPTIONS, getProvinceNameById } from '../../types/common';
import { portCRUD } from '../../services/portService';
import { symbolService } from '../../services/symbolService';
import type { Symbol as MapSymbol } from '../../services/symbolService';
import { canEditApprovalRecord } from '../../utils/approvalEditPolicy';
import { formLabelProps as labelProps } from '../../components/shared/formLabel';
import { AppDrawer } from '../../components/shared/AppDrawer';
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
  fontSizeBreadcrumb,
  fontWeightBold,
  fontWeightMedium,
  radiusSm,
  radiusMd,
  radiusPill,
  fontSizeLg,
  surfaceCard,
  borderDefault,
  spaceXs,
  spaceSm,
  spaceMd,
  spaceXl,
  spaceFormField,
  badgeBaseStyle,
  uploadHintStyle,
  inputStyle,
  selectStyle,
  primaryButtonStyle,
  outlineButtonStyle,
  dangerButtonStyle,
  formFieldStyle,
  formRowGutter,
  drawerTitleStyle,
  requiredMarkStyle,
  filterLabelStyle,
  filterInputStyle,
  confirmModalBodyStyle,
  detailRowStyle,
  detailLabelColStyle,
  detailValueStyle,
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
} from '../../tokens';

// ── Field name translation ───────────────────────────────────────────

const FIELD_LABELS: Record<string, string> = {
  code: 'Mã đèn biển',
  name: 'Tên đèn biển',
  type: 'Cấp trạm đèn',
  unitId: 'Đơn vị quản lý',
  unitName: 'Tên đơn vị',
  latitude: 'Vĩ độ',
  longitude: 'Kinh độ',
  lightRange: 'Tầm hiệu lực ánh sáng',
  towerColor: 'Màu sắc bên ngoài của tháp đèn',
  location: 'Địa điểm đặt trạm đèn',
  shape: 'Hình dáng',
  structure: 'Kết cấu',
  towerHeight: 'Chiều cao tháp đèn',
  lightHeight: 'Chiều cao tâm sáng',
  geographicRange: 'Tầm hiệu lực địa lý',
  backupLightModel: 'Đèn dự phòng',
  powerSupply: 'Nguồn cung cấp',
  staffCount: 'Nhân sự bố trí',
  stationArea: 'Diện tích sử dụng trạm',
  primaryLightModel: 'Đèn chính',
  area: 'Diện tích',
  lastRepairDate: 'Thời điểm sửa chữa gần nhất',
  commissionedDate: 'Thời điểm đưa vào sử dụng',
  status: 'Trạng thái',
  approvalStatus: 'Trạng thái phê duyệt',
  rejectionReason: 'Lý do từ chối',
};

const historyFieldName = (fn: string): string => FIELD_LABELS[fn] || fn;

const pillStyle = { borderRadius: radiusPill, height: 40 };

// ── Constants ────────────────────────────────────────────────────────

const STATUS_TAB_LIST = [
  { key: '', label: 'Tất cả', color: actionPrimary },
  { key: 'DRAFT', label: 'Lưu tạm', color: statusDraft },
  { key: 'PENDING_APPROVAL', label: 'Chờ Cảng vụ duyệt', color: statusAttention },
  { key: 'APPROVED_LEVEL1', label: 'Chờ Cục duyệt', color: '#0284C7' },
  { key: 'APPROVED', label: 'Đã duyệt', color: statusOperational },
  { key: 'REJECTED', label: 'Từ chối', color: statusCritical },
];

const TAB_QUERY_MAP: Record<string, BeaconStatus | undefined> = {
  '': undefined,
  DRAFT: 'DRAFT',
  PROPOSED: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED_LEVEL1: 'APPROVED_LEVEL1',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

// Status badge config — semantic token colors (AGENTS.md: no hardcoded hex)
const BEACON_STATUS_STYLE_MAP: Record<string, { color: string; label: string }> = {
  DRAFT: { color: statusDraft, label: 'Lưu tạm' },
  PROPOSED: { color: statusAttention, label: 'Chờ Cảng vụ duyệt' },
  PENDING: { color: statusAttention, label: 'Chờ Cảng vụ duyệt' },
  PENDING_APPROVAL: { color: statusAttention, label: 'Chờ Cảng vụ duyệt' },
  APPROVED_LEVEL1: { color: '#0284C7', label: 'Chờ Cục duyệt' },
  APPROVED_LEVEL2: { color: statusOperational, label: 'Đã duyệt' },
  APPROVED: { color: statusOperational, label: 'Đã duyệt' },
  REJECTED: { color: statusCritical, label: 'Từ chối' },
  REJECTED_LEVEL1: { color: statusCritical, label: 'Cảng vụ trả về' },
  REJECTED_LEVEL2: { color: statusCritical, label: 'Cục trả về' },
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
  { value: 'POINT', label: 'Điểm' },
  { value: 'LINE', label: 'Đường' },
  { value: 'POLYGON', label: 'Vùng' },
];

const GEOMETRY_TYPE_MAP: Record<string, string> = { POINT: 'Điểm', LINE: 'Đường', POLYGON: 'Vùng' };

const COORD_SYS_OPTIONS = [
  { value: 1, label: 'WGS-84' },
  { value: 2, label: 'VN-2000' },
];

const COORD_SYS_MAP: Record<number, string> = { 1: 'WGS-84', 2: 'VN-2000' };

// History action colors — semantic tokens (BEACON_HISTORY_ACTION_MAP keeps AntD names; use tokens for the accent bar/badge)
const HISTORY_ACTION_COLOR: Record<string, string> = {
  CREATE: statusOperational,
  UPDATE: actionPrimary,
  APPROVE_L1: statusAttention,
  APPROVE_L2: statusAttention,
  REJECT: statusCritical,
  SOFT_DELETE: statusDraft,
};

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
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  // ── Filter state ─────────────────────────────────────────────────
  const [filterName, setFilterName] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>();
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
  const [error, setError] = useState<Error | null>(null);
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
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [detailFiles, setDetailFiles] = useState<any[]>([]);
  const [logOpen, setLogOpen] = useState(true);
  const [operationOpen, setOperationOpen] = useState(true);
  const [maintenanceOpen, setMaintenanceOpen] = useState(true);
  const [incidentOpen, setIncidentOpen] = useState(true);

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

  // ── History state ────────────────────────────────────────────────
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<BeaconStation | null>(null);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');
  const [historyMode, setHistoryMode] = useState<'current' | 'all'>('current');

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
        status: filterStatus || TAB_QUERY_MAP[activeTab],
        unitId: filterUnitId,
        seaportId: filterSeaportId,
        operator: filterOperator.trim() || undefined,
        provinceId: filterProvinceId,
        operationalStatus: filterOperationalStatus,
        commissionedFrom: filterCommissionedFrom,
        commissionedTo: filterCommissionedTo,
        updatedBy: filterUpdatedBy.trim() || undefined,
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
  }, [filterName, filterCode, filterType, filterStatus, filterUnitId, filterSeaportId, filterOperator, filterProvinceId, filterOperationalStatus, filterCommissionedFrom, filterCommissionedTo, filterUpdatedBy, filterUpdatedFrom, filterUpdatedTo, activeTab, page, pageSize]);

  useEffect(() => { void fetchData(); }, [fetchData]);
  useEffect(() => { void fetchCounts(); }, [fetchCounts]);

  // ── Filter handlers ─────────────────────────────────────────────
  const handleFilterApply = useCallback(() => { setPage(1); }, []);
  const handleFilterReset = useCallback(() => {
    setFilterName(''); setFilterCode(''); setFilterType(undefined);
    setFilterStatus(undefined); setFilterUnitId(undefined); setFilterSeaportId(undefined);
    setFilterOperator(''); setFilterProvinceId(undefined); setFilterOperationalStatus(undefined);
    setFilterCommissionedFrom(''); setFilterCommissionedTo(''); setFilterUpdatedBy('');
    setFilterUpdatedFrom(''); setFilterUpdatedTo('');
    setActiveTab(''); setPage(1);
  }, []);
  const handleTabChange = useCallback((key: string) => { setActiveTab(key); setPage(1); }, []);

  // ── Drawer handlers ─────────────────────────────────────────────
  const openCreateDrawer = useCallback(() => {
    setEditingRecord(null); setIsDetailMode(false); setDetailRecord(null);
    createForm.resetFields(); setActiveTabKey('general'); setUploadedFiles([]); setDrawerVisible(true);
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
      latitude: record.latitude,
      longitude: record.longitude,
    });
    setUploadedFiles([]);
    beaconStationCRUD.listAttachments(record.id)
      .then((files) => setUploadedFiles(files.map((a: any) => ({ uid: a.id, name: a.fileName || a.name, size: a.fileSize, status: 'done' as const }))))
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
  const handleBeforeUpload = useCallback((file: RcFile): false => {
    if (file.size > 20 * 1024 * 1024) { toast.error('File vượt quá 20MB'); return false; }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(ext)) { toast.error('Định dạng không hỗ trợ'); return false; }
    if (uploadedFiles.length >= 10) { toast.error('Tối đa 10 file'); return false; }
    setUploadedFiles((p) => [...p, { uid: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`, name: file.name, status: 'done' as const, originFileObj: file }]);
    return false;
  }, [uploadedFiles]);

  const removeUploadedFile = useCallback(async (uid: string) => {
    const target = uploadedFiles.find((f) => f.uid === uid);
    setUploadedFiles((p) => p.filter((f) => f.uid !== uid));
    if (target && !target.originFileObj && editingRecord) {
      try { await beaconStationCRUD.deleteAttachment(editingRecord.id, uid); } catch { /* ignore */ }
    }
  }, [uploadedFiles, editingRecord]);

  // ── History ─────────────────────────────────────────────────────
  const loadHistory = useCallback(async (mode: 'current' | 'all') => {
    setHistoryLoading(true);
    setHistoryRecords([]);
    try {
      const res = await beaconHistory.getHistory(
        mode === 'all'
          ? { type: 'BEACON_LIGHT' }
          : { type: 'BEACON_LIGHT', entityId: historyTarget?.id },
      );
      setHistoryRecords(res.data || []);
    } catch { toast.error('Không thể tải lịch sử'); } finally { setHistoryLoading(false); }
  }, [historyTarget]);

  const openHistory = useCallback(async (r: BeaconStation) => {
    setHistoryTarget(r); setHistoryOpen(true);
    setHistorySearch(''); setHistoryFrom(''); setHistoryTo(''); setHistoryMode('current');
    setHistoryLoading(true);
    setHistoryRecords([]);
    try {
      const res = await beaconHistory.getHistory({ type: 'BEACON_LIGHT', entityId: r.id });
      setHistoryRecords(res.data || []);
    } catch { toast.error('Không thể tải lịch sử'); } finally { setHistoryLoading(false); }
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
  const openApproveModal = useCallback((record: BeaconStation) => { setApprovingRecord(record); setApproveNote(''); setApproveModalOpen(true); }, []);

  const confirmApprove = useCallback(async () => {
    if (!approvingRecord) return;
    const approverId = useAuthStore.getState().user?.userId || 'system';
    const isL2 = approvingRecord.status === 'APPROVED_LEVEL1';
    try {
      if (isL2) {
        await approval.approveL2(approvingRecord.id, approverId, approveNote || undefined);
      } else {
        await approval.approveL1(approvingRecord.id, approverId, approveNote || undefined);
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

  // ── Submit form (create / update) ───────────────────────────────
  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      const values = await createForm.validateFields();
      const toDate = (v: any) => (v ? (dayjs.isDayjs(v) ? v.toISOString() : String(v)) : undefined);
      if (editingRecord) {
        const payload = {
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
          latitude: values.latitude != null ? Number(values.latitude) : undefined,
          longitude: values.longitude != null ? Number(values.longitude) : undefined,
        };
        const updated = await beaconStationCRUD.update(editingRecord.id, payload);
        if (window.parent && (window.parent as any).kchtDetailCache) {
          (window.parent as any).kchtDetailCache[editingRecord.id] = updated;
        }
        const newFiles = uploadedFiles.filter((f) => f.originFileObj).map((f) => f.originFileObj as File);
        if (newFiles.length > 0) {
          try { await beaconStationCRUD.uploadAttachments(editingRecord.id, newFiles); } catch { /* ignore */ }
        }
        toast.success('Đã cập nhật đèn biển');
      } else {
        const payload = {
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
          latitude: values.latitude != null ? Number(values.latitude) : undefined,
          longitude: values.longitude != null ? Number(values.longitude) : undefined,
        };
        const created = await beaconStationCRUD.create(payload);
        const newFiles = uploadedFiles.filter((f) => f.originFileObj).map((f) => f.originFileObj as File);
        if (created.id && newFiles.length > 0) {
          try { await beaconStationCRUD.uploadAttachments(created.id, newFiles); } catch { /* ignore */ }
        }
        toast.success('Đã tạo đèn biển');
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
  }, [editingRecord, createForm, fetchData, fetchCounts, uploadedFiles]);

  // ── Row actions (approval flow: DRAFT→submit; PENDING_APPROVAL→approve) ──
  const rowActions = useCallback((record: BeaconStation) => {
    const actions: any[] = [
      { key: 'view', label: 'Chi tiết', icon: <EyeOutlined />, onClick: () => openDetailDrawer(record) },
    ];
    const st = record.status || '';
    // Quy tắc 12 (approval-2-level-spec.md mục 3.9)
    if (canEditApprovalRecord(st, { hasPerm, resource: 'beaconstation', extraUpdatePerms: ['data:update', 'admin:manage'], extraApprovePerms: ['admin:manage'] })) {
      actions.push({ key: 'edit', label: 'Chỉnh sửa', icon: <EditOutlined />, onClick: () => openEditDrawer(record) });
    }
    if (st === 'DRAFT' || st === 'REJECTED' || st === 'REJECTED_LEVEL1') {
      actions.push({ key: 'submit', label: 'Gửi duyệt', icon: <SendOutlined />, onClick: () => openSubmitModal(record) });
    }
    if (st === 'PENDING_APPROVAL') {
      actions.push({ key: 'approve', label: 'Phê duyệt', icon: <CheckCircleOutlined />, onClick: () => openApproveModal(record) });
      actions.push({ key: 'reject', label: 'Từ chối', icon: <CloseCircleOutlined />, danger: true, onClick: () => openRejectModal(record) });
    }
    if (st === 'APPROVED_LEVEL1') {
      actions.push({ key: 'approve-c2', label: 'Phê duyệt', icon: <CheckCircleOutlined />, onClick: () => openApproveModal(record) });
      actions.push({ key: 'reject-c2', label: 'Từ chối', icon: <CloseCircleOutlined />, danger: true, onClick: () => openRejectModal(record) });
    }
    actions.push({ key: 'history', label: 'Lịch sử', icon: <HistoryOutlined />, onClick: () => openHistory(record) });
    if (st === 'DRAFT' || st === 'REJECTED') {
      actions.push({ key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, danger: true, onClick: () => openDeleteConfirm(record) });
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
      key: 'name', label: 'Tên/Mã đèn biển', dataIndex: 'name', width: 300, fixed: 'left' as const, ellipsis: false,
      render: (name: string, record: BeaconStation) => (
        <div style={{ minWidth: 0 }}>
          <button type="button" title={name}
            onClick={() => openDetailDrawer(record)}
            style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', font: 'inherit', fontWeight: fontWeightBold, color: actionPrimary, cursor: 'pointer', display: 'block', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {name || '—'}
          </button>
          <span style={{ opacity: 0.85, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.code || '—'}</span>
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
      key: 'provinceId', label: 'Địa điểm (Tỉnh/Thành phố)', dataIndex: 'provinceId', width: 230,
      render: (v: number) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{getProvinceNameById(v != null ? Number(v) : undefined) || '—'}</span>,
    },
    {
      key: 'type', label: 'Cấp trạm đèn', dataIndex: 'type', width: 150,
      render: (type: string) => {
        const opt = BEACON_LIGHT_TYPE_OPTIONS.find((o) => o.value === type);
        return <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{opt ? opt.label : (type || '—')}</span>;
      },
    },
    {
      key: 'updatedAt', label: 'Ngày cập nhật', dataIndex: 'updatedAt', width: 170,
      render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{formatDate(v)}</span>,
    },
    {
      key: 'operationalStatus', label: 'Tình trạng', dataIndex: 'operationalStatus', width: 230,
      render: (v: number) => {
        const s = OPERATIONAL_STATUS_STYLE_MAP[v];
        return s
          ? <span style={{ ...badgeBaseStyle, fontSize: fontSizeMd, padding: '2px 10px', display: 'inline-flex', background: `${s.color}15`, color: s.color }}>{s.label}</span>
          : <span style={{ fontSize: fontSizeMd, color: textTertiary }}>—</span>;
      },
    },
    {
      key: 'status', label: 'Trạng thái', dataIndex: 'status', width: 200,
      render: (status: string) => {
        const s = BEACON_STATUS_STYLE_MAP[status] || { color: textTertiary, label: status || '—' };
        return <span style={{ ...badgeBaseStyle, fontSize: fontSizeMd, padding: '2px 10px', display: 'inline-flex', background: `${s.color}15`, color: s.color }}>{s.label}</span>;
      },
    },
    {
      key: 'submittedByName', label: 'Cán bộ gửi phê duyệt', dataIndex: 'submittedByName', width: 170,
      render: (v: string, r: any) => <span>{v || '—'}{r.submittedAt ? ' · ' + formatDate(r.submittedAt) : ''}</span>,
    },
    {
      key: 'approverLevel1Name', label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục', dataIndex: 'approverLevel1Name', width: 190,
      render: (v: string, r: any) => <span>{v || '—'}{r.approvedDateLevel1 ? ' · ' + formatDate(r.approvedDateLevel1) : ''}</span>,
    },
    {
      key: 'approverLevel2Name', label: 'Cán bộ phê duyệt cấp Cục', dataIndex: 'approverLevel2Name', width: 170,
      render: (v: string, r: any) => <span>{v || '—'}{r.approvedDateLevel2 ? ' · ' + formatDate(r.approvedDateLevel2) : ''}</span>,
    },
  ], [page, pageSize, openDetailDrawer, seaports]);

  const tableData = useMemo(
    () => dataSource.map((item, idx) => ({ ...item, _rowIndex: (page - 1) * pageSize + idx + 1 })),
    [dataSource, page, pageSize],
  );

  // ── Filter panel content ────────────────────────────────────────
  const filterContent = (
    <>
      {/* ── Bộ lọc cơ bản (luôn hiển thị) ── */}
      <div style={{ marginBottom: spaceFormField, marginTop: spaceMd }}>
        <div style={{ ...filterLabelStyle, marginBottom: spaceSm }}>Đơn vị quản lý</div>
        <TreeSelect placeholder="Chọn đơn vị..." allowClear value={filterUnitId}
          onChange={(v) => { setFilterUnitId(v); setPage(1); }}
          treeData={buildOrgTree(organizations)} showSearch treeNodeFilterProp="title"
          treeDefaultExpandAll style={filterInputStyle} />
      </div>
      <div style={{ marginBottom: spaceFormField }}>
        <div style={{ ...filterLabelStyle, marginBottom: spaceSm }}>Tên đèn biển</div>
        <Input placeholder="Tìm theo tên..." allowClear value={filterName}
          onChange={(e) => { setFilterName(e.target.value); setPage(1); }}
          onPressEnter={handleFilterApply} style={filterInputStyle} />
      </div>
      <div style={{ marginBottom: spaceFormField }}>
        <div style={{ ...filterLabelStyle, marginBottom: spaceSm }}>Trạng thái</div>
        <Select placeholder="Chọn trạng thái" allowClear value={filterStatus}
          onChange={(v) => { setFilterStatus(v); setPage(1); }}
          options={STATUS_TAB_LIST.filter((t) => t.key).map((t) => ({ value: t.key, label: t.label }))}
          style={filterInputStyle} />
      </div>

      {/* ── Bộ lọc nâng cao (ẩn, hiện khi bấm nút Filter) ── */}
      {filterCollapsed && (
        <>
          <div style={{ marginBottom: spaceFormField }}>
            <div style={{ ...filterLabelStyle, marginBottom: spaceSm }}>Mã đèn biển</div>
            <Input placeholder="Tìm theo mã..." allowClear value={filterCode}
              onChange={(e) => { setFilterCode(e.target.value); setPage(1); }}
              onPressEnter={handleFilterApply} style={filterInputStyle} />
          </div>
          <div style={{ marginBottom: spaceFormField }}>
            <div style={{ ...filterLabelStyle, marginBottom: spaceSm }}>Thuộc cảng biển</div>
            <Select placeholder="Chọn cảng biển..." allowClear value={filterSeaportId}
              onChange={(v) => { setFilterSeaportId(v); setPage(1); }}
              showSearch optionFilterProp="label"
              options={seaports.map((p) => ({ value: p.id, label: p.portName || p.portCode || p.id }))}
              style={filterInputStyle} />
          </div>
          <div style={{ marginBottom: spaceFormField }}>
            <div style={{ ...filterLabelStyle, marginBottom: spaceSm }}>Đơn vị vận hành</div>
            <Input placeholder="Tìm theo đơn vị vận hành..." allowClear value={filterOperator}
              onChange={(e) => { setFilterOperator(e.target.value); setPage(1); }}
              onPressEnter={handleFilterApply} style={filterInputStyle} />
          </div>
          <div style={{ marginBottom: spaceFormField }}>
            <div style={{ ...filterLabelStyle, marginBottom: spaceSm }}>Địa điểm Tỉnh/TP</div>
            <Select placeholder="Chọn tỉnh/thành phố..." allowClear value={filterProvinceId}
              onChange={(v) => { setFilterProvinceId(v); setPage(1); }}
              showSearch optionFilterProp="label"
              options={VIETNAM_PROVINCE_OPTIONS} style={filterInputStyle} />
          </div>
          <div style={{ marginBottom: spaceFormField }}>
            <div style={{ ...filterLabelStyle, marginBottom: spaceSm }}>Tình trạng</div>
            <Select placeholder="Chọn tình trạng" allowClear value={filterOperationalStatus}
              onChange={(v) => { setFilterOperationalStatus(v); setPage(1); }}
              options={OPERATIONAL_STATUS_OPTIONS} style={filterInputStyle} />
          </div>
          <div style={{ marginBottom: spaceFormField }}>
            <div style={{ ...filterLabelStyle, marginBottom: spaceSm }}>Cấp trạm đèn</div>
            <Select placeholder="Chọn cấp trạm đèn" allowClear value={filterType}
              onChange={(v) => { setFilterType(v); setPage(1); }}
              options={BEACON_LIGHT_TYPE_OPTIONS} style={filterInputStyle} />
          </div>
          <div style={{ marginBottom: spaceFormField }}>
            <div style={{ ...filterLabelStyle, marginBottom: spaceSm }}>Thời điểm đưa vào sử dụng</div>
            <DatePicker.RangePicker placeholder={['Từ ngày', 'Đến ngày']} format="DD/MM/YYYY"
              value={rangeValue(filterCommissionedFrom, filterCommissionedTo)}
              onChange={(range) => { setFilterCommissionedFrom(range && range[0] ? range[0].format('YYYY-MM-DD') : ''); setFilterCommissionedTo(range && range[1] ? range[1].format('YYYY-MM-DD') : ''); setPage(1); }}
              style={filterInputStyle} />
          </div>
          <div style={{ marginBottom: spaceFormField }}>
            <div style={{ ...filterLabelStyle, marginBottom: spaceSm }}>Ngày cập nhật</div>
            <DatePicker.RangePicker placeholder={['Từ ngày', 'Đến ngày']} format="DD/MM/YYYY"
              value={rangeValue(filterUpdatedFrom, filterUpdatedTo)}
              onChange={(range) => { setFilterUpdatedFrom(range && range[0] ? range[0].format('YYYY-MM-DD') : ''); setFilterUpdatedTo(range && range[1] ? range[1].format('YYYY-MM-DD') : ''); setPage(1); }}
              style={filterInputStyle} />
          </div>
          <div style={{ marginBottom: spaceFormField }}>
            <div style={{ ...filterLabelStyle, marginBottom: spaceSm }}>Cán bộ cập nhật</div>
            <Select placeholder="Chọn cán bộ cập nhật" allowClear showSearch value={filterUpdatedBy || undefined}
              onChange={(v) => { setFilterUpdatedBy(v || ''); setPage(1); }}
              options={userOptions} filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              style={filterInputStyle} />
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
  // Nhóm thành 9 tab: 5 tab nội dung + log cập nhật + vận hành + bảo trì + sự cố
  type DetailRow = { label: string; value: React.ReactNode; span?: boolean };

  const renderDetailRows = (rows: DetailRow[], paddingTop = 16) => (
    <div style={{ paddingTop }}>
      {rows.map((row) => (
        <div key={row.label} style={{ ...detailRowStyle, gap: spaceFormField }}>
          <div style={detailLabelColStyle}>{row.label}</div>
          <div style={detailValueStyle}>{row.value}</div>
        </div>
      ))}
    </div>
  );

  const renderDetailRowsTwoCol = (rows: DetailRow[]) => (
    <div style={{ paddingTop: 4, display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {rows.map((row) => (
        <div key={row.label} style={{ ...detailRowStyle, gap: spaceFormField, gridColumn: row.span ? '1 / -1' : undefined }}>
          <div style={detailLabelColStyle}>{row.label}</div>
          <div style={detailValueStyle}>{row.value}</div>
        </div>
      ))}
    </div>
  );

  const renderToggleSection = (open: boolean, onToggle: () => void, title: string, rows: DetailRow[], twoCol = false) => (
    <div>
      <button type="button" style={{ cursor: 'pointer', marginTop: 10, paddingLeft: 12, background: 'none', border: 'none', font: 'inherit', textAlign: 'left', display: 'block', width: '100%' }}
        onClick={onToggle}>
        <span style={{ color: open ? '#1677ff' : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>
          {open ? '▼' : '▶'} {title}
        </span>
      </button>
      {open && (twoCol ? renderDetailRowsTwoCol(rows) : renderDetailRows(rows, 4))}
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
        { label: 'Địa điểm Tỉnh/TP', value: getProvinceNameById(detailRecord.provinceId != null ? Number(detailRecord.provinceId) : undefined) || '—' },
        { label: 'Địa điểm chi tiết', value: detailRecord.detailedLocation || '—' },
        {
          label: 'Tình trạng',
          value: (() => {
            const s = OPERATIONAL_STATUS_STYLE_MAP[detailRecord.operationalStatus];
            return s
              ? <span style={{ ...badgeBaseStyle, fontSize: fontSizeMd, padding: '2px 10px', display: 'inline-flex', background: `${s.color}15`, color: s.color }}>{s.label}</span>
              : '—';
          })(),
        },
        { label: 'Ngày cập nhật', value: formatDate(detailRecord.updatedAt) },
        { label: 'Cán bộ cập nhật', value: userOptions.find((u) => u.value === detailRecord.updatedBy)?.label || '—' },
      ]
    : [];

  // Tab 2 — Thông tin kỹ thuật đèn biển
  const detailTechnicalRows: DetailRow[] = detailRecord
    ? [
        { label: 'Chủng loại đèn chính', value: detailRecord.primaryLightModel || '—' },
        { label: 'Chủng loại đèn dự phòng', value: detailRecord.backupLightModel || '—' },
        {
          label: 'Cấp trạm đèn',
          value: BEACON_LIGHT_TYPE_OPTIONS.find((o) => o.value === detailRecord.type)?.label || detailRecord.type || '—',
        },
        { label: 'Địa bàn', value: detailRecord.region || '—' },
        { label: 'Đặc điểm nhận dạng', value: detailRecord.identifyingFeature || '—' },
        { label: 'Hình dạng', value: detailRecord.shape || '—' },
        { label: 'Chiều cao tháp đèn (m)', value: detailRecord.towerHeight != null ? String(detailRecord.towerHeight) : '—' },
        { label: 'Chiều cao tâm sáng (m)', value: detailRecord.lightHeight != null ? String(detailRecord.lightHeight) : '—' },
        { label: 'Tầm hiệu lực địa lý', value: detailRecord.geographicRange || '—' },
        { label: 'Tầm hiệu lực ánh sáng', value: detailRecord.lightRange != null ? String(detailRecord.lightRange) : '—' },
        { label: 'Màu sắc tháp đèn', value: detailRecord.towerColor || '—' },
        { label: 'Nguồn năng lượng', value: detailRecord.powerSupply || '—' },
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

  // Tab 4 — Thông tin vị trí (tọa độ GIS)
  const detailGisRows: DetailRow[] = detailRecord
    ? [
        { label: 'Loại đối tượng GIS', value: GEOMETRY_TYPE_MAP[detailRecord.geometryType || ''] || detailRecord.geometryType || '—' },
        { label: 'Biểu tượng GIS', value: symbols.find((s) => s.id === detailRecord.mapSymbolId)?.name || detailRecord.mapSymbolId || '—' },
        { label: 'Hệ quy chiếu GIS', value: COORD_SYS_MAP[detailRecord.coordinateSystem] || (detailRecord.coordinateSystem != null ? String(detailRecord.coordinateSystem) : '—') },
        { label: 'Quy tắc hiển thị GIS', value: detailRecord.displayRule || '—' },
        {
          label: 'Tọa độ GIS',
          value: detailRecord.latitude != null || detailRecord.longitude != null
            ? `Vĩ độ ${detailRecord.latitude != null ? detailRecord.latitude.toFixed(4) : '—'}, Kinh độ ${detailRecord.longitude != null ? detailRecord.longitude.toFixed(4) : '—'}`
            : '—',
        },
      ]
    : [];

  // Tab 6 — Thông tin log cập nhật (read-only)
  const detailLogRows: DetailRow[] = detailRecord
    ? [
        { label: 'Ngày gửi phê duyệt', value: formatDate(detailRecord.submittedAt) },
        { label: 'Cán bộ gửi phê duyệt', value: detailRecord.submittedByName || '—' },
        { label: 'Nội dung phê duyệt', value: detailRecord.approvalContentLevel1 || '—', span: true },
        { label: 'Ngày phê duyệt cấp Cảng vụ/Chi cục', value: formatDate(detailRecord.approvedDateLevel1) },
        { label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục', value: detailRecord.approverLevel1Name || '—' },
        { label: 'Nội dung phê duyệt', value: detailRecord.approvalContentLevel2 || '—', span: true },
        { label: 'Ngày phê duyệt cấp Cục', value: formatDate(detailRecord.approvedDateLevel2) },
        { label: 'Cán bộ phê duyệt cấp Cục', value: detailRecord.approverLevel2Name || '—' },
        {
          label: 'Trạng thái',
          value: (() => {
            const s = BEACON_STATUS_STYLE_MAP[detailRecord.status] || { color: textTertiary, label: detailRecord.status || '—' };
            return <span style={{ ...badgeBaseStyle, fontSize: fontSizeMd, padding: '2px 10px', display: 'inline-flex', background: `${s.color}15`, color: s.color }}>{s.label}</span>;
          })(),
          span: true,
        },
      ]
    : [];

  // Tab 7 — Thông tin vận hành khai thác (read-only)
  const detailOperationRows: DetailRow[] = detailRecord
    ? [
        { label: 'Mã kế hoạch vận hành', value: '—' },
        { label: 'Tên kế hoạch vận hành', value: '—' },
        { label: 'Ngày bắt đầu vận hành', value: '—' },
        { label: 'Ngày kết thúc vận hành', value: '—' },
      ]
    : [];

  // Tab 8 — Thông tin bảo trì (read-only)
  const detailMaintenanceRows: DetailRow[] = detailRecord
    ? [
        { label: 'Mã kế hoạch bảo trì', value: '—' },
        { label: 'Tên kế hoạch bảo trì', value: '—' },
        { label: 'Thời gian bắt đầu bảo trì', value: '—' },
        { label: 'Thời gian kết thúc bảo trì', value: '—' },
      ]
    : [];

  // Tab 9 — Thông tin sự cố (read-only)
  const detailIncidentRows: DetailRow[] = detailRecord
    ? [
        { label: 'Mã sự cố', value: '—' },
        { label: 'Loại sự cố', value: '—' },
        { label: 'Địa điểm sự cố', value: '—' },
        { label: 'Thời gian sự cố', value: '—' },
      ]
    : [];

  const detailTabItems = [
    {
      key: 'general',
      label: 'Thông tin chung',
      children: (
        <>
          {renderDetailRowsTwoCol(detailBasicRows)}
          {renderToggleSection(logOpen, () => setLogOpen(!logOpen), 'Thông tin phê duyệt', detailLogRows, true)}
        </>
      ),
    },
    { key: 'technical', label: 'Thông tin kỹ thuật đèn biển', children: renderDetailRowsTwoCol(detailTechnicalRows) },
    { key: 'station', label: 'Thông tin nhà trạm', children: renderDetailRows(detailStationRows) },
    { key: 'gis', label: 'Thông tin vị trí', children: renderDetailRows(detailGisRows) },
    {
      key: 'files',
      label: 'File đính kèm',
      children: (
        <div style={{ paddingTop: 3 }}>
          <div style={{ marginBottom: spaceSm, padding: '10px 12px 0 12px' }}>
            <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>File đính kèm</span>
          </div>
          {detailFiles.length === 0 ? (
            <span style={{ color: textTertiary, fontSize: fontSizeMd, paddingLeft: 12 }}>Không có tài liệu đính kèm</span>
          ) : (
            <Table className="list-view-table" dataSource={detailFiles.map((f, i) => ({ ...f, key: f.id, _idx: i }))} pagination={false} size="middle" bordered style={{ marginLeft: 12, marginRight: 12 }}>
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
      key: 'others',
      label: 'Các thông tin khác',
      children: (
        <div style={{ paddingTop: 6 }}>
          {renderToggleSection(operationOpen, () => setOperationOpen(!operationOpen), 'Thông tin vận hành khai thác', detailOperationRows)}
          {renderToggleSection(maintenanceOpen, () => setMaintenanceOpen(!maintenanceOpen), 'Thông tin bảo trì', detailMaintenanceRows)}
          {renderToggleSection(incidentOpen, () => setIncidentOpen(!incidentOpen), 'Thông tin sự cố', detailIncidentRows)}
        </div>
      ),
    },
  ];

  // ── History timeline render ─────────────────────────────────────
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

  const renderHistoryTimeline = (records: any[]) => {
    const q = historySearch.toLowerCase().trim();
    const fromMs = historyFrom ? dayjs(historyFrom).valueOf() : null;
    const toMs = historyTo ? dayjs(historyTo).valueOf() : null;
    const sorted = [...records].sort(
      (a, b) => new Date(b.changedAt || b.createdAt || 0).getTime() - new Date(a.changedAt || a.createdAt || 0).getTime(),
    );
    const groups: { ts: string; actor: string; items: any[] }[] = [];
    for (const r of sorted) {
      if (q) {
        const fn = (r.changedField || r.fieldName || '').toLowerCase();
        const ov = (r.previousValue || r.oldValue || '').toLowerCase();
        const nv = (r.newValue || '').toLowerCase();
        const reason = (r.reason || '').toLowerCase();
        if (!fn.includes(q) && !ov.includes(q) && !nv.includes(q) && !reason.includes(q)) continue;
      }
      const ts = r.changedAt || r.createdAt || '';
      const ms = ts ? new Date(ts).getTime() : 0;
      if (fromMs && ms < fromMs) continue;
      if (toMs && ms > toMs) continue;
      const prev = groups[groups.length - 1];
      if (prev && prev.ts === ts && prev.actor === (r.changedBy || '')) prev.items.push(r);
      else groups.push({ ts, actor: r.changedBy || '', items: [r] });
    }
    if (groups.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
          <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
          <div style={{ color: textTertiary, fontSize: fontSizeMd }}>
            {q || historyFrom || historyTo ? 'Không tìm thấy kết quả' : 'Chưa có thay đổi'}
          </div>
        </div>
      );
    }
    return groups.map((g) => {
      const actionType = g.items[0]?.actionType || 'UPDATE';
      const color = HISTORY_ACTION_COLOR[actionType] || actionPrimary;
      const actionLabel = BEACON_HISTORY_ACTION_MAP[actionType as keyof typeof BEACON_HISTORY_ACTION_MAP]?.label || actionType;
      const isCreate = actionType === 'CREATE';
      const ordered = g.items.map((r: any) => ({
        id: r.id || '',
        field: r.changedField || r.fieldName || '',
        oldValue: r.previousValue ?? r.oldValue ?? null,
        newValue: r.newValue ?? null,
        reason: r.reason ?? null,
      }));
      return (
        <div key={g.items[0]?.id || `${g.ts}-${g.actor}`} style={historyGroupGridStyle}>
          <div>
            <div style={historyTimeStyle}>{g.ts ? dayjs(g.ts).format('DD/MM/YYYY HH:mm:ss') : '—'}</div>
            <div style={{ marginTop: spaceXs }}>
              <span style={historyBadgeStyle(color)}>{actionLabel}</span>
            </div>
            <Typography.Text style={{ ...historyMetaRowStyle, marginTop: spaceXs }}>
              Người cập nhật: {g.actor || '—'}
            </Typography.Text>
          </div>
          <div style={historyInfoCardStyle}>
            <div style={historyAccentBarStyle(color)} />
            <Typography.Text style={historyInfoTitleStyle}>
              {isCreate ? 'Thông tin thêm mới:' : 'Thông tin thay đổi:'}
            </Typography.Text>
            {ordered.length > 0 ? (
              <div>
                {ordered.map((change) => {
                  const fn = change.field;
                  const changeKey = change.id || fn || 'row';
                  if (change.reason && change.reason !== '(null)') {
                    return (
                      <div key={changeKey} style={{ ...historyChangeRowStyle, paddingTop: 0 }}>
                        <div style={historyFieldLabelStyle}>Lý do từ chối:</div>
                        <span title={change.reason} style={historyNewValueStyle}>{change.reason}</span>
                      </div>
                    );
                  }
                  const ov = formatHistoryValue(fn, change.oldValue);
                  const nv = formatHistoryValue(fn, change.newValue);
                  return isCreate ? (
                    <div key={changeKey} style={historyCreateRowStyle}>
                      <div style={historyFieldLabelStyle}>{fn ? `${historyFieldName(fn)}:` : '—'}</div>
                      <span title={nv} style={historyNewValueStyle}>{nv}</span>
                    </div>
                  ) : (
                    <div key={changeKey} style={historyChangeRowStyle}>
                      <div style={historyFieldLabelStyle}>{fn ? `${historyFieldName(fn)}:` : '—'}</div>
                      <span title={ov} style={historyOldValueStyle}>{ov}</span>
                      <span style={historyArrowStyle}>→</span>
                      <span title={nv} style={historyNewValueStyle}>{nv}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Typography.Text style={{ color: textTertiary, fontSize: fontSizeMd }}>Không có thông tin chi tiết</Typography.Text>
            )}
          </div>
        </div>
      );
    });
  };

  // ── JSX ─────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
      <ScreenHeader
        breadcrumb={[{ label: 'Quản lý hàng hải' }, { label: 'Đèn biển và nhà trạm' }]}
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
            scroll={{ x: 'max-content', y: 540 }}
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
                : 'Thêm mới đèn biển'}
          </span>
        }
        open={drawerVisible}
        destroyOnHidden
        onClose={closeDrawer}
        footer={
          isDetailMode ? null : (
            <>
              <Button onClick={closeDrawer} style={outlineButtonStyle}>Hủy</Button>
              <Button type="primary" onClick={handleSubmit} loading={submitting} style={primaryButtonStyle}>
                {editingRecord ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </>
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
                      <div style={{ paddingTop: 16 }}>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="code" {...labelProps('Mã đèn biển')} required style={formFieldStyle}
                              rules={[{ required: true, message: 'Vui lòng nhập mã đèn biển' }]}>
                              <Input placeholder="VD: LH-HAIPHONG-001" disabled={!!editingRecord} style={inputStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="name" {...labelProps('Tên đèn biển')} required style={formFieldStyle}
                              rules={[{ required: true, message: 'Vui lòng nhập tên đèn biển' }]}>
                              <Input placeholder="VD: Đèn biển Hòn Dấu" style={inputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="unitId" {...labelProps('Đơn vị quản lý')} required style={formFieldStyle}
                              rules={[{ required: true, message: 'Vui lòng chọn đơn vị quản lý' }]}>
                              <TreeSelect placeholder="Chọn đơn vị..." treeData={buildOrgTree(organizations)}
                                showSearch treeNodeFilterProp="title" treeDefaultExpandAll style={selectStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="seaportId" {...labelProps('Thuộc cảng biển')} style={formFieldStyle}>
                              <Select placeholder="Chọn cảng biển..." allowClear showSearch optionFilterProp="label"
                                options={seaports.map((p) => ({ value: p.id, label: p.portName || p.portCode || p.id }))}
                                style={selectStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="operator" {...labelProps('Đơn vị vận hành')} style={formFieldStyle}>
                              <Input placeholder="Nhập đơn vị vận hành..." style={inputStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="provinceId" {...labelProps('Địa điểm Tỉnh/TP')} style={formFieldStyle}>
                              <Select placeholder="Chọn tỉnh/thành phố..." allowClear showSearch optionFilterProp="label"
                                options={VIETNAM_PROVINCE_OPTIONS} style={selectStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="detailedLocation" {...labelProps('Địa điểm chi tiết')} style={formFieldStyle}>
                              <Input placeholder="Nhập địa điểm chi tiết..." style={inputStyle} />
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
                      <div style={{ paddingTop: 16 }}>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="type" {...labelProps('Cấp trạm đèn')} required style={formFieldStyle}
                              rules={[{ required: true, message: 'Vui lòng chọn cấp trạm đèn' }]}>
                              <Select placeholder="Chọn cấp trạm..." options={BEACON_LIGHT_TYPE_OPTIONS} style={selectStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="primaryLightModel" {...labelProps('Đèn chính')} style={formFieldStyle}>
                              <Input placeholder="VD: VMS.RB-400" style={inputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="backupLightModel" {...labelProps('Đèn dự phòng')} style={formFieldStyle}>
                              <Input placeholder="VD: LED 200W" style={inputStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="region" {...labelProps('Địa bàn')} style={formFieldStyle}>
                              <Input placeholder="Nhập địa bàn..." style={inputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="identifyingFeature" {...labelProps('Đặc điểm nhận dạng')} style={formFieldStyle}>
                              <Input placeholder="Nhập đặc điểm nhận dạng..." style={inputStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="shape" {...labelProps('Hình dáng')} style={formFieldStyle}>
                              <Input placeholder="VD: Hình trụ tròn" style={inputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="towerHeight" {...labelProps('Chiều cao tháp (m)')} style={formFieldStyle}>
                              <Input type="number" placeholder="VD: 25.5" style={inputStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="lightHeight" {...labelProps('Chiều cao tâm sáng (m)')} style={formFieldStyle}>
                              <Input type="number" placeholder="VD: 20" style={inputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="geographicRange" {...labelProps('Tầm hiệu lực địa lý')} style={formFieldStyle}>
                              <Input placeholder="VD: 15 hải lý" style={inputStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="lightRange" {...labelProps('Tầm hiệu lực (hải lý)')} required style={formFieldStyle}
                              rules={[{ required: true, message: 'Vui lòng nhập tầm hiệu lực' }]}>
                              <Input type="number" min={0.01} max={60} step={0.01} placeholder="VD: 15" style={inputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="towerColor" {...labelProps('Màu sắc tháp đèn')} required style={formFieldStyle}
                              rules={[{ required: true, message: 'Vui lòng nhập màu sắc' }]}>
                              <Input placeholder="VD: Trắng, Đỏ" style={inputStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="powerSupply" {...labelProps('Nguồn cung cấp')} style={formFieldStyle}>
                              <Input placeholder="VD: Pin mặt trời" style={inputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="commissionedDate" {...labelProps('Đưa vào sử dụng')} style={formFieldStyle}>
                              <DatePicker placeholder="Chọn ngày..." format="DD/MM/YYYY" style={{ ...selectStyle, width: '100%' }} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="lastRepairDate" {...labelProps('Sửa chữa gần nhất')} style={formFieldStyle}>
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
                      <div style={{ paddingTop: 16 }}>
                        <Form.Item name="location" {...labelProps('Địa điểm')} style={formFieldStyle}>
                          <Input placeholder="Mô tả địa điểm..." style={inputStyle} />
                        </Form.Item>
                        <Form.Item name="structure" {...labelProps('Kết cấu')} style={formFieldStyle}>
                          <Input placeholder="VD: Bê tông cốt thép" style={inputStyle} />
                        </Form.Item>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="area" {...labelProps('Diện tích (m²)')} style={formFieldStyle}>
                              <Input type="number" placeholder="VD: 4466.7" style={inputStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="stationArea" {...labelProps('Diện tích trạm (m²)')} style={formFieldStyle}>
                              <Input type="number" placeholder="VD: 150.5" style={inputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="staffCount" {...labelProps('Nhân sự (người)')} style={formFieldStyle}>
                              <Input type="number" placeholder="VD: 3" style={inputStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="note" {...labelProps('Ghi chú')} style={formFieldStyle}>
                              <Input placeholder="Nhập ghi chú..." style={inputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                      </div>
                    ),
                  },
                  {
                    key: 'gis',
                    label: 'Thông tin vị trí (tọa độ GIS)',
                    children: (
                      <div style={{ paddingTop: 16 }}>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="geometryType" {...labelProps('Loại đối tượng GIS')} style={formFieldStyle}>
                              <Select placeholder="Chọn loại đối tượng..." allowClear options={GEOMETRY_TYPE_OPTIONS} style={selectStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="mapSymbolId" {...labelProps('Biểu tượng GIS')} style={formFieldStyle}>
                              <Select placeholder="Chọn biểu tượng..." allowClear showSearch optionFilterProp="label" style={selectStyle}>
                                {symbols.map((sym) => (
                                  <Select.Option key={sym.id} value={sym.id} label={sym.name}>
                                    <Space>
                                      {sym.image && <img src={sym.image.startsWith('data:') ? sym.image : `data:image/png;base64,${sym.image}`} alt={sym.name} style={{ width: 20, height: 20, objectFit: 'contain' }} />}
                                      <span>{sym.name}</span>
                                    </Space>
                                  </Select.Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="coordinateSystem" {...labelProps('Hệ quy chiếu GIS')} style={formFieldStyle}>
                              <Select placeholder="Chọn hệ quy chiếu..." allowClear options={COORD_SYS_OPTIONS} style={selectStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="displayRule" {...labelProps('Quy tắc hiển thị GIS')} style={formFieldStyle}>
                              <Input placeholder="Nhập quy tắc hiển thị..." style={inputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="latitude" {...labelProps('Vĩ độ')} style={formFieldStyle}>
                              <Input type="number" step="any" placeholder="VD: 20.6624" style={inputStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="longitude" {...labelProps('Kinh độ')} style={formFieldStyle}>
                              <Input type="number" step="any" placeholder="VD: 106.7435" style={inputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                      </div>
                    ),
                  },
                  {
                    key: 'files',
                    label: 'File đính kèm',
                    children: (
                      <div style={{ paddingTop: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spaceMd }}>
                          <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>File đính kèm</span>
                          {uploadedFiles.length > 0 && (
                            <Upload beforeUpload={handleBeforeUpload} showUploadList={false}
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif" multiple>
                              <Button icon={<PlusOutlined />} style={{ borderRadius: radiusPill }}>Thêm file</Button>
                            </Upload>
                          )}
                        </div>
                        {uploadedFiles.length === 0 ? (
                          <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
                            <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>Chưa có file đính kèm.</span>
                            <Upload beforeUpload={handleBeforeUpload} showUploadList={false}
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif" multiple>
                              <Button type="dashed" icon={<UploadOutlined />} style={{ borderRadius: radiusPill }}>Chọn file</Button>
                            </Upload>
                          </div>
                        ) : (
                          <Table className="list-view-table"
                            dataSource={uploadedFiles.map((f, i) => ({ ...f, key: f.uid, _idx: i, name: f.name }))}
                            pagination={false} size="middle" bordered scroll={{ x: 400 }}>
                            <Table.Column title="STT" key="stt" width={60} align="center"
                              render={(_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{i + 1}</span>}
                              onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                            <Table.Column title="Tên file" key="name" dataIndex="name"
                              render={(name: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}><FileOutlined style={{ marginRight: spaceSm, color: textTertiary }} />{name}</span>}
                              onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                            <Table.Column title="Thao tác" key="actions" width={80} align="center"
                              render={(_: any, record: any) => <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => removeUploadedFile(record.uid)} />}
                              onHeaderCell={() => ({ style: { background: colors.bodyBg, padding: '12px 6px' } })} />
                          </Table>
                        )}
                        <div style={{ marginTop: spaceSm }}>
                          <span style={uploadHintStyle}>Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF. Tối đa 10 file, mỗi file ≤20MB.</span>
                        </div>
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

      {/* ── Approve Modal ─────────────────────────────────────────── */}
      <Modal
        title={
          <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>
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
            Phê duyệt <strong>{approvingRecord?.name}</strong>?
          </p>
          <Input.TextArea placeholder="Nội dung phê duyệt (không bắt buộc)..." value={approveNote}
            onChange={(e) => setApproveNote(e.target.value)} rows={2} maxLength={500} showCount
            style={{ marginTop: spaceFormField }} />
        </div>
      </Modal>

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

      {/* ── History Modal ────────────────────────────────────────── */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Lịch sử thay đổi</span>}
        open={historyOpen}
        onCancel={() => { setHistoryOpen(false); setHistoryTarget(null); setHistoryRecords([]); }}
        footer={null}
        width={720}
      >
        {historyTarget && (
          <p style={{ marginBottom: spaceFormField }}>
            <strong>Đèn biển:</strong> {historyTarget.code} — {historyTarget.name}
          </p>
        )}
        <Radio.Group value={historyMode} onChange={(e) => loadHistory(e.target.value as 'current' | 'all')}>
          <Radio.Button value="current">Bản ghi hiện tại</Radio.Button>
          <Radio.Button value="all">Tất cả bản ghi</Radio.Button>
        </Radio.Group>
        <Space style={{ marginTop: spaceMd, marginBottom: spaceMd }} wrap>
          <Input placeholder="Tìm kiếm nội dung thay đổi..." allowClear value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)} style={{ width: 240, ...inputStyle }} />
          <DatePicker placeholder="Từ ngày" value={historyFrom ? dayjs(historyFrom) : null}
            onChange={(d) => setHistoryFrom(d ? d.format('YYYY-MM-DD HH:mm') : '')}
            style={{ width: 170, ...selectStyle }} format="DD/MM/YYYY HH:mm" showTime />
          <DatePicker placeholder="Đến ngày" value={historyTo ? dayjs(historyTo) : null}
            onChange={(d) => setHistoryTo(d ? d.format('YYYY-MM-DD HH:mm') : '')}
            style={{ width: 170, ...selectStyle }} format="DD/MM/YYYY HH:mm" showTime />
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

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Button,
  Modal,
  Input,
  Select,
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
  Tooltip,
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
} from '../../types/dikeRevetment';
import {
  DIKE_REVETMENT_STATUS_MAP,
  CONDITION_STATUS_OPTIONS,
  CONDITION_STATUS_MAP,
  DIKE_REVETMENT_TYPE_LABELS,
} from '../../types/dikeRevetment';
import { organizationService } from '../../services/organizationService';
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
import { OrgUnitTreeSelect, normalizeSearchText, type OrgUnitTreeOption } from '../../components/org-unit';
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
  spaceXl,
  spaceFormField,
  inputStyle,
  selectStyle,
  primaryButtonStyle,
  outlineButtonStyle,
  dangerButtonStyle,
  rejectReasonStyle,
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

// ── Constants ────────────────────────────────────────────────────────

const STATUS_TAB_LIST = [
  { key: '', label: 'Tất cả', color: actionPrimary },
  { key: 'DRAFT', label: 'Lưu tạm', color: statusDraft },
  { key: 'PENDING_APPROVAL', label: 'Chờ Cảng vụ duyệt', color: statusAttention },
  { key: 'APPROVED_LEVEL1', label: 'Chờ Cục duyệt', color: '#0284c7' },
  { key: 'REJECTED', label: 'Bị trả về', color: statusCritical },
  { key: 'APPROVED', label: 'Đã duyệt', color: statusOperational },
];

const TAB_QUERY_MAP: Record<string, string | undefined> = {
  '': undefined,
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED_LEVEL1: 'APPROVED_LEVEL1',
  REJECTED: 'REJECTED',
  APPROVED: 'APPROVED',
};

const DIKE_REVETMENT_TYPE_OPTIONS = [
  { label: 'Đê sông', value: 'RIVER_DIKE' },
  { label: 'Đê cát', value: 'SAND_DIKE' },
  { label: 'Kè hướng dòng', value: 'FLOW_GUIDE_REVETMENT' },
  { label: 'Kè bảo vệ bờ', value: 'BANK_PROTECTION_REVETMENT' },
  { label: 'Đê giao thông', value: 'TRAFFIC' },
  { label: 'Kè chắn sóng', value: 'WAVE_BREAK_REVETMENT' },
  { label: 'Kè chắn cát', value: 'SAND_BREAK_REVETMENT' },
];

const OPERATIONAL_STATUS_STYLE_MAP: Record<string, { color: string; label: string }> = {
  '1': { color: statusOperational, label: 'Đang khai thác' },
  '0': { color: statusCritical, label: 'Ngừng hoạt động' },
  '2': { color: statusAttention, label: 'Chưa hoạt động' },
  OPERATIONAL: { color: statusOperational, label: 'Đang khai thác' },
  STOPPED: { color: statusCritical, label: 'Ngừng hoạt động' },
  MAINTENANCE: { color: statusAttention, label: 'Bảo trì' },
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try { return dayjs(dateStr).format('DD/MM/YYYY HH:mm'); } catch { return dateStr; }
}

function formatDateOnly(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try { return dayjs(dateStr).format('DD/MM/YYYY'); } catch { return dateStr; }
}

function serializeVerticesToWkt(pts: { lng: number; lat: number }[], geomType: string): string {
  const validPts = pts.filter((p) => p && typeof p.lng === 'number' && typeof p.lat === 'number' && !isNaN(p.lng) && !isNaN(p.lat));
  if (validPts.length === 0) return '';
  const type = (geomType || 'LINE').toUpperCase();
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
  const currentUserId = useAuthStore((s: any) => s.user?.id || s.user?.userId);

  // ── Filter state ─────────────────────────────────────────────────
  const [filterName, setFilterName] = useState('');
  const [filterCode, setFilterMa] = useState('');
  const [filterSeaportId, setFilterCangBienId] = useState<string | undefined>();
  const [filterLocation, setFilterLocation] = useState<string | undefined>();
  const [filterType, setFilterType] = useState<DikeRevetmentType | undefined>();
  const [filterStatusVal, setFilterStatusVal] = useState<string | undefined>();
  const [filterUnitId, setFilterUnitId] = useState<string | undefined>();
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
  const [organizations, setOrganizations] = useState<OrgUnitTreeOption[]>([]);
  const [seaports, setSeaports] = useState<{ id: string; portName?: string; portCode?: string }[]>([]);

  // ── GIS form state ───────────────────────────────────────────────
  const [gpsCoordList, setGpsCoordList] = useState<Array<{ lat: number; lng: number }>>([]);
  const [symbols, setSymbols] = useState<MapSymbol[]>([]);
  const [uploadFileList, setUploadFileList] = useState<any[]>([]);

  const ddToDms = (dd: number): { d: number; m: number; s: number } => {
    if (dd == null || isNaN(dd)) return { d: 0, m: 0, s: 0 };
    const abs = Math.abs(dd);
    const d = Math.floor(abs);
    const m = Math.floor((abs - d) * 60);
    const s = parseFloat(((abs - d - m / 60) * 3600).toFixed(2));
    return { d, m, s };
  };
  const dmToDd = (d: number, m: number, s: number): number => d + m / 60 + s / 3600;

  // ── Drawer state ─────────────────────────────────────────────────
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DikeRevetmentResponse | null>(null);
  const [detailRecord, setDetailRecord] = useState<DikeRevetmentResponse | null>(null);
  const [isDetailMode, setIsDetailMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createForm] = Form.useForm();
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
  const [approvingLevel, setApprovingLevel] = useState<'C1' | 'C2'>('C1');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRecord, setRejectingRecord] = useState<DikeRevetmentResponse | null>(null);
  const [rejectingLevel, setRejectingLevel] = useState<'C1' | 'C2'>('C1');
  const [rejectReason, setRejectReason] = useState('');

  // ── History state ────────────────────────────────────────────────
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<DikeRevetmentResponse | null>(null);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');

  // ── Init: organizations + seaports + symbols ─────────────────────
  useEffect(() => {
    (async () => {
      try {
        const tree = await organizationService.getTree();
        setOrganizations(tree || []);
      } catch (err) {
        console.error('Failed to load organizations tree', err);
      }
      try {
        const list = await portCRUD.getOptions();
        setSeaports(list || []);
      } catch (err) {
        console.error('Failed to load seaports', err);
      }
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
      const res = await dikeRevetmentCRUD.searchPaged({
        page,
        size: pageSize,
        keyword: filterName.trim() || undefined,
        seaportId: filterSeaportId,
        dikeRevetmentType: filterType,
        conditionStatus: filterStatusVal,
        approvalStatus: TAB_QUERY_MAP[activeTab],
        orgUnitId: filterUnitId,
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
  }, [page, pageSize, filterName, filterSeaportId, filterType, filterStatusVal, filterUnitId, filterUpdatedRange, activeTab]);

  const fetchTabCounts = useCallback(async () => {
    try {
      const counts = await dikeRevetmentCRUD.getTabCounts(
        filterUnitId,
        filterName.trim() || undefined,
        filterStatusVal
      );
      setTabCounts(counts || {});
    } catch {
      /* silent */
    }
  }, [filterUnitId, filterName, filterStatusVal]);

  useEffect(() => { void fetchData(); }, [fetchData]);
  useEffect(() => { void fetchTabCounts(); }, [fetchTabCounts]);

  const statusTabs = useMemo(() =>
    STATUS_TAB_LIST.map((tab) => ({
      ...tab,
      count: tabCounts[tab.key] ?? 0,
      active: activeTab === tab.key,
    })),
    [tabCounts, activeTab],
  );

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setPage(1);
  };

  const handleFilterApply = () => { setPage(1); };
  const handleFilterReset = () => {
    setFilterName('');
    setFilterMa('');
    setFilterCangBienId(undefined);
    setFilterLocation(undefined);
    setFilterType(undefined);
    setFilterStatusVal(undefined);
    setFilterUnitId(undefined);
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
    createForm.setFieldsValue({ status: '1', dikeRevetmentType: 'WAVE_BREAK_REVETMENT', geometryType: 'LINE' });
    setGpsCoordList([]);
    setUploadFileList([]);
    setActiveTabKey('general');
    setDrawerVisible(true);
    dikeRevetmentCRUD.generateCode()
      .then((res) => {
        if (res.code) createForm.setFieldsValue({ code: res.code });
      })
      .catch(() => {});
  }, [createForm]);

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
      surfaceMaterial: record.surfaceMaterial,
      status: record.status || record.conditionStatus || '1',
      note: record.note,
      orgUnitId: record.orgUnitId,
      code: record.code,
      geometryType: record.geometryType || 'LINE',
      symbolId: record.symbolId,
    });
    setGpsCoordList(parseWktToVertices(record.coordinates || '', record.geometryType || 'LINE'));
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
    setGpsCoordList([]);
    setUploadFileList([]);
  };

  // ── Submit Form ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    try {
      const values = await createForm.validateFields();
      setSubmitting(true);
      const coordinates = serializeVerticesToWkt(gpsCoordList, values.geometryType || 'LINE');
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
        surfaceMaterial: values.surfaceMaterial,
        status: values.status,
        orgUnitId: values.orgUnitId,
        code: values.code,
        geometryType: values.geometryType,
        coordinates,
        symbolId: values.symbolId,
        note: values.note,
      };

      if (editingRecord) {
        await dikeRevetmentCRUD.update(editingRecord.id, payload as UpdateDikeRevetmentRequest);
        toast.success('Cập nhật đê kè thành công');
      } else {
        await dikeRevetmentCRUD.create(payload);
        toast.success('Tạo mới đê kè (Lưu tạm) thành công');
      }

      setDrawerVisible(false);
      setEditingRecord(null);
      setUploadFileList([]);
      void fetchData();
      void fetchTabCounts();
    } catch (err) {
      if ((err as any)?.errorFields) return;
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
    const expected = (deletingRecord.dikeRevetmentName || deletingRecord.code || '').trim().toLowerCase();
    const input = deleteConfirmText.trim().toLowerCase();
    if (input !== 'xóa' && input !== expected) {
      toast.error('Vui lòng nhập đúng tên công trình hoặc gõ XÓA để xác nhận');
      return;
    }
    try {
      await dikeRevetmentCRUD.delete(deletingRecord.id);
      toast.success('Xóa đê kè thành công');
      setDeleteModalOpen(false);
      setDeletingRecord(null);
      setDeleteConfirmText('');
      void fetchData();
      void fetchTabCounts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  };

  // ── Submit Approval ─────────────────────────────────────────────
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
      void fetchData();
      void fetchTabCounts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gửi duyệt thất bại');
    }
  };

  // ── Approve C1 / C2 ─────────────────────────────────────────────
  const openApproveModal = useCallback((record: DikeRevetmentResponse, level: 'C1' | 'C2') => {
    setApprovingRecord(record);
    setApprovingLevel(level);
    setApproveModalOpen(true);
  }, []);

  const confirmApprove = async () => {
    if (!approvingRecord) return;
    try {
      if (approvingLevel === 'C1') {
        await dikeRevetmentApproval.approveLevel1(approvingRecord.id);
        toast.success('Chi cục / Cảng vụ phê duyệt C1 thành công');
      } else {
        await dikeRevetmentApproval.approveLevel2(approvingRecord.id);
        toast.success('Cục Hàng hải phê duyệt C2 thành công (Đã duyệt chính thức)');
      }
      setApproveModalOpen(false);
      setApprovingRecord(null);
      void fetchData();
      void fetchTabCounts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
    }
  };

  // ── Reject C1 / C2 ─────────────────────────────────────────────
  const openRejectModal = useCallback((record: DikeRevetmentResponse, level: 'C1' | 'C2') => {
    setRejectingRecord(record);
    setRejectingLevel(level);
    setRejectReason('');
    setRejectModalOpen(true);
  }, []);

  const confirmReject = async () => {
    if (!rejectingRecord) return;
    if (rejectReason.trim().length < 10) {
      toast.error('Lý do từ chối phải có tối thiểu 10 ký tự');
      return;
    }
    try {
      if (rejectingLevel === 'C1') {
        await dikeRevetmentApproval.rejectLevel1(rejectingRecord.id, rejectReason.trim());
        toast.success('Đã từ chối C1 đê kè');
      } else {
        await dikeRevetmentApproval.rejectLevel2(rejectingRecord.id, rejectReason.trim());
        toast.success('Đã từ chối C2 đê kè');
      }
      setRejectModalOpen(false);
      setRejectingRecord(null);
      setRejectReason('');
      void fetchData();
      void fetchTabCounts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
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

  // ── Columns & row actions ────────────────────────────────────────
  const columns = useMemo(() => [
    {
      key: 'sequenceNo',
      label: 'STT',
      width: 60,
      fixed: 'left' as const,
      align: 'center' as const,
      render: (_: any, __: any, index: number) => (
        <span style={{ color: textSecondary, fontWeight: fontWeightMedium }}>{(page - 1) * pageSize + index + 1}</span>
      ),
    },
    {
      key: 'code',
      label: 'Mã đê kè',
      dataIndex: 'code',
      width: 150,
      fixed: 'left' as const,
      render: (val: string) => <span style={{ color: textPrimary, fontWeight: fontWeightMedium }}>{val || '—'}</span>,
    },
    {
      key: 'dikeRevetmentName',
      label: 'Tên đê kè',
      dataIndex: 'dikeRevetmentName',
      width: 250,
      ellipsis: false,
      render: (val: string, record: DikeRevetmentResponse) => (
        <Button
          type="link"
          onClick={() => openDetailDrawer(record)}
          style={{ padding: 0, height: 'auto', fontWeight: fontWeightBold, color: actionPrimary, textAlign: 'left', whiteSpace: 'normal' }}
        >
          {val || '—'}
        </Button>
      ),
    },
    {
      key: 'orgUnitName',
      label: 'Đơn vị quản lý',
      dataIndex: 'orgUnitName',
      width: 220,
      ellipsis: false,
      render: (val: string | undefined, record: DikeRevetmentResponse) => val || record.orgUnitId || '—',
    },
    {
      key: 'seaportName',
      label: 'Thuộc cảng biển',
      dataIndex: 'seaportName',
      width: 180,
      ellipsis: false,
      render: (val: string | undefined, record: DikeRevetmentResponse) => val || record.seaportId || '—',
    },
    {
      key: 'location',
      label: 'Địa điểm (Tỉnh/TP)',
      dataIndex: 'location',
      width: 180,
      render: (val: string) => val || '—',
    },
    {
      key: 'dikeRevetmentType',
      label: 'Loại kết cấu công trình',
      dataIndex: 'dikeRevetmentType',
      width: 200,
      render: (val: string) => <span style={{ fontWeight: fontWeightMedium }}>{DIKE_REVETMENT_TYPE_LABELS[val] || val || '—'}</span>,
    },
    {
      key: 'status',
      label: 'Tình trạng',
      dataIndex: 'status',
      width: 160,
      align: 'center' as const,
      render: (val: string) => {
        const st = OPERATIONAL_STATUS_STYLE_MAP[val || '1'];
        return st ? <span style={{ ...historyBadgeStyle(st.color), minWidth: 125, justifyContent: 'center' }}>{st.label}</span> : val;
      },
    },
    {
      key: 'commissioningDate',
      label: 'Thời điểm khai thác',
      dataIndex: 'commissioningDate',
      width: 160,
      align: 'center' as const,
      render: (val: string) => formatDateOnly(val),
    },
    {
      key: 'updatedAt',
      label: 'Ngày cập nhật',
      dataIndex: 'updatedAt',
      width: 160,
      align: 'center' as const,
      render: (val: string) => formatDate(val),
    },
    {
      key: 'updatedBy',
      label: 'Cán bộ cập nhật',
      dataIndex: 'updatedByName',
      width: 160,
      ellipsis: true,
      render: (val: string) => val || '—',
    },
    {
      key: 'approvalStatus',
      label: 'Trạng thái phê duyệt',
      dataIndex: 'approvalStatus',
      width: 180,
      align: 'center' as const,
      render: (status: string) => <ApprovalStatusBadge status={status || 'DRAFT'} />,
    },
  ], [page, pageSize, openDetailDrawer]);

  const rowActions = useCallback((record: DikeRevetmentResponse) => {
    const actions: any[] = [];
    const canRead = hasPerm('dikerevetment:read') || hasPerm('admin:all');
    const canUpdate = hasPerm('dikerevetment:update') || hasPerm('admin:all');
    const canDelete = hasPerm('dikerevetment:delete') || hasPerm('admin:all');
    const canApproveC1 = hasPerm('dikerevetment:approvec1') || hasPerm('admin:all');
    const canApproveC2 = hasPerm('dikerevetment:approvec2') || hasPerm('admin:all');

    const st = record.approvalStatus || 'DRAFT';
    const isDraftOrRejected = st === 'DRAFT' || st === 'REJECTED_LEVEL1' || st === 'REJECTED_LEVEL2' || st === 'REJECTED' || st === 'PROPOSED';
    const isPendingC1 = st === 'PENDING_APPROVAL';
    const isPendingC2 = st === 'APPROVED_LEVEL1';

    if (canRead) {
      actions.push({ key: 'detail', label: 'Xem chi tiết', icon: <EyeOutlined />, onClick: () => openDetailDrawer(record) });
    }
    if (canUpdate && isDraftOrRejected) {
      actions.push({ key: 'edit', label: 'Chỉnh sửa', icon: <EditOutlined />, onClick: () => openEditDrawer(record) });
      actions.push({ key: 'submit', label: 'Gửi phê duyệt', icon: <SendOutlined />, onClick: () => openSubmitModal(record) });
    }

    if (isPendingC1 && canApproveC1) {
      const isSelfCreated = currentUserId && record.createdBy && String(record.createdBy) === String(currentUserId);
      if (isSelfCreated) {
        actions.push({
          key: 'approvec1',
          label: (
            <Tooltip title="Bạn không thể tự phê duyệt bản ghi do chính mình tạo">
              <span style={{ color: textTertiary, cursor: 'not-allowed' }}>Phê duyệt C1</span>
            </Tooltip>
          ),
          icon: <CheckCircleOutlined style={{ color: textTertiary }} />,
          disabled: true,
        });
      } else {
        actions.push({ key: 'approvec1', label: 'Phê duyệt C1', icon: <CheckCircleOutlined />, onClick: () => openApproveModal(record, 'C1') });
      }
      actions.push({ key: 'rejectc1', label: 'Trả về C1', icon: <CloseCircleOutlined />, danger: true, onClick: () => openRejectModal(record, 'C1') });
    }

    if (isPendingC2 && canApproveC2) {
      const isSelfCreated = currentUserId && record.createdBy && String(record.createdBy) === String(currentUserId);
      if (isSelfCreated) {
        actions.push({
          key: 'approvec2',
          label: (
            <Tooltip title="Bạn không thể tự phê duyệt bản ghi do chính mình tạo">
              <span style={{ color: textTertiary, cursor: 'not-allowed' }}>Phê duyệt C2</span>
            </Tooltip>
          ),
          icon: <CheckCircleOutlined style={{ color: textTertiary }} />,
          disabled: true,
        });
      } else {
        actions.push({ key: 'approvec2', label: 'Phê duyệt C2', icon: <CheckCircleOutlined />, onClick: () => openApproveModal(record, 'C2') });
      }
      actions.push({ key: 'rejectc2', label: 'Trả về C2', icon: <CloseCircleOutlined />, danger: true, onClick: () => openRejectModal(record, 'C2') });
    }

    actions.push({ key: 'history', label: 'Lịch sử', icon: <HistoryOutlined />, onClick: () => openHistoryModal(record) });

    if (canDelete && isDraftOrRejected) {
      actions.push({ key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, danger: true, onClick: () => openDeleteModal(record) });
    }

    return actions;
  }, [hasPerm, currentUserId, openDetailDrawer, openEditDrawer, openSubmitModal, openApproveModal, openRejectModal, openDeleteModal, openHistoryModal]);

  // ── Filter content (sidebar) ─────────────────────────────────────
  const filterContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spaceFormField }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spaceXs, marginTop: spaceMd }}>
        <span style={filterLabelStyle}>Đơn vị quản lý</span>
        <OrgUnitTreeSelect
          organizations={organizations}
          placeholder="Tất cả"
          allowClear
          treeDefaultExpandAll
          listHeight={256}
          value={filterUnitId}
          onChange={(val) => {
            setFilterUnitId(val || undefined);
            setFilterCangBienId(undefined);
            setPage(1);
          }}
          style={filterInputStyle}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spaceXs }}>
        <span style={filterLabelStyle}>Tên đê kè</span>
        <Input
          placeholder="Nhập tên đê kè..."
          allowClear
          value={filterName}
          onChange={(e) => { setFilterName(e.target.value); setPage(1); }}
          onPressEnter={handleFilterApply}
          style={filterInputStyle}
        />
      </div>

      {filterCollapsed && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spaceXs }}>
            <span style={filterLabelStyle}>Thuộc cảng biển</span>
            <Select
              placeholder="Chọn cảng biển..."
              options={seaports.map((p) => ({ value: p.id, label: p.portName || p.portCode || p.id }))}
              value={filterSeaportId}
              onChange={(val) => { setFilterCangBienId(val); setPage(1); }}
              allowClear
              showSearch
              filterOption={(input, option) => normalizeSearchText(option?.label).includes(normalizeSearchText(input))}
              style={selectStyle}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spaceXs }}>
            <span style={filterLabelStyle}>Địa điểm (Tỉnh/TP)</span>
            <Select
              placeholder="Chọn tỉnh/thành phố..."
              options={VIETNAM_PROVINCE_OPTIONS.map((p) => ({ value: p.label, label: p.label }))}
              value={filterLocation}
              onChange={(val) => { setFilterLocation(val); setPage(1); }}
              allowClear
              showSearch
              filterOption={(input, option) => normalizeSearchText(option?.label).includes(normalizeSearchText(input))}
              style={selectStyle}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spaceXs }}>
            <span style={filterLabelStyle}>Loại kết cấu công trình</span>
            <Select
              placeholder="Chọn loại kết cấu..."
              options={DIKE_REVETMENT_TYPE_OPTIONS}
              value={filterType}
              onChange={(val) => { setFilterType(val); setPage(1); }}
              allowClear
              style={selectStyle}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spaceXs }}>
            <span style={filterLabelStyle}>Tình trạng</span>
            <Select
              placeholder="Chọn tình trạng..."
              options={CONDITION_STATUS_OPTIONS}
              value={filterStatusVal}
              onChange={(val) => { setFilterStatusVal(val); setPage(1); }}
              allowClear
              style={selectStyle}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spaceXs }}>
            <span style={filterLabelStyle}>Ngày cập nhật</span>
            <DatePicker.RangePicker
              value={filterUpdatedRange}
              onChange={(range) => { setFilterUpdatedRange(range); setPage(1); }}
              style={selectStyle}
            />
          </div>
        </>
      )}
    </div>
  );

  // ── Detail rows ──────────────────────────────────────────────────
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
    { label: 'Mã đê kè', value: detailRecord.code ?? '—' },
    { label: 'Tên đê kè', value: detailRecord.dikeRevetmentName ?? '—' },
    { label: 'Đơn vị quản lý', value: detailRecord.orgUnitName || detailRecord.orgUnitId || '—' },
    { label: 'Thuộc cảng biển', value: detailRecord.seaportName || detailRecord.seaportId || '—' },
    { label: 'Đơn vị vận hành', value: detailRecord.donViVanHanhName || detailRecord.donViVanHanhId || '—' },
    { label: 'Địa điểm (Tỉnh/TP)', value: detailRecord.location ?? '—' },
    { label: 'Địa điểm chi tiết', value: detailRecord.locationDetail ?? '—' },
    { label: 'Loại kết cấu công trình', value: detailRecord.dikeRevetmentType ? (DIKE_REVETMENT_TYPE_LABELS[detailRecord.dikeRevetmentType] || detailRecord.dikeRevetmentType) : '—' },
    { label: 'Tình trạng', value: detailRecord.status ? (OPERATIONAL_STATUS_STYLE_MAP[detailRecord.status]?.label || detailRecord.status) : '—' },
    { label: 'Ghi chú', value: detailRecord.note ?? '—' },
  ] : [];

  const detailTechnicalRows: DetailRow[] = detailRecord ? [
    { label: 'Chiều dài (m)', value: detailRecord.length != null ? Number(detailRecord.length).toLocaleString('vi-VN') : '—' },
    { label: 'Chiều cao (m)', value: detailRecord.height != null ? Number(detailRecord.height).toLocaleString('vi-VN') : '—' },
    { label: 'Cao trình đỉnh (m)', value: detailRecord.crestElevation != null ? Number(detailRecord.crestElevation).toLocaleString('vi-VN') : '—' },
    { label: 'Vật liệu bề mặt', value: detailRecord.surfaceMaterial ?? '—' },
    { label: 'Thời điểm xây dựng', value: formatDateOnly(detailRecord.constructionDate) },
    { label: 'Thời điểm đưa vào khai thác', value: formatDateOnly(detailRecord.commissioningDate) },
    { label: 'Năm bảo trì gần nhất', value: detailRecord.lastMaintenanceYear ?? '—' },
  ] : [];

  const detailGisRows: DetailRow[] = detailRecord ? [
    { label: 'Loại đối tượng', value: detailRecord.geometryType === 'POINT' ? 'Đối tượng điểm' : detailRecord.geometryType === 'LINE' ? 'Đối tượng đường' : detailRecord.geometryType === 'POLYGON' ? 'Đối tượng vùng' : '—' },
    { label: 'Quy tắc hiển thị', value: (detailRecord.geometryType || detailRecord.coordinates) ? 'Độ, phút, giây (DMS)' : '—' },
  ] : [];

  const detailLogRows: DetailRow[] = detailRecord ? [
    { label: 'Ngày cập nhật', value: formatDate(detailRecord.updatedAt) },
    { label: 'Cán bộ cập nhật', value: detailRecord.updatedByName || detailRecord.updatedBy || '—' },
    { label: 'Ngày phê duyệt cấp 1', value: formatDateOnly(detailRecord.approvedDateLevel1) },
    { label: 'Cán bộ phê duyệt cấp 1', value: detailRecord.approvedByNameLevel1 || detailRecord.approverLevel1 || '—' },
    { label: 'Ngày phê duyệt cấp 2', value: formatDateOnly(detailRecord.approvedDateLevel2) },
    { label: 'Cán bộ phê duyệt cấp 2', value: detailRecord.approvedByNameLevel2 || detailRecord.approverLevel2 || '—' },
    { label: 'Lý do từ chối (nếu có)', value: detailRecord.rejectionReason || '—' },
    { label: 'Trạng thái phê duyệt', value: <ApprovalStatusBadge status={detailRecord.approvalStatus} /> },
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
                  const pts = detailRecord ? parseWktToVertices(detailRecord.coordinates || '', detailRecord.geometryType || 'LINE') : [];
                  return pts.length === 0 ? (
                    <div style={{ marginTop: spaceXs, color: textTertiary, fontSize: fontSizeMd }}>Không có tọa độ</div>
                  ) : (
                    <Table className="list-view-table" dataSource={pts.map((p, i) => ({ ...p, key: i }))} pagination={false} size="middle" bordered style={{ marginTop: spaceXs }}>
                      <Table.Column title="STT" key="stt" width={60} align="center"
                        render={(_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{i + 1}</span>}
                        onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                      <Table.Column title="Vĩ độ (N)" key="lat" align="center"
                        render={(_: any, rec: any) => {
                          const dms = ddToDms(rec.lat);
                          return <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}><InputNumber value={dms.d} readOnly style={{ flex: 1, textAlign: 'center' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>°</span><InputNumber value={dms.m} readOnly style={{ flex: 1, textAlign: 'center' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>'</span><InputNumber value={dms.s} readOnly style={{ flex: 1.2, textAlign: 'center' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, fontSize: fontSizeSm, color: textTertiary }}>"</span></Space.Compact>;
                        }}
                        onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                      <Table.Column title="Kinh độ (E)" key="lng" align="center"
                        render={(_: any, rec: any) => {
                          const dms = ddToDms(rec.lng);
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
      ]
    : [];

  const renderHistoryTimeline = (records: any[]) => {
    if (!records || records.length === 0) {
      return (
        <Typography.Text style={{ color: textTertiary, fontSize: fontSizeMd }}>Không có lịch sử thay đổi</Typography.Text>
      );
    }
    const filtered = records.filter((h: any) => {
      if (historySearch) {
        const haystack = `${h.fieldChanged || ''} ${h.oldValue || ''} ${h.newValue || ''} ${h.actionType || ''} ${h.reason || ''}`.toLowerCase();
        if (!haystack.includes(historySearch.toLowerCase())) return false;
      }
      if (historyFrom && h.approvedDate && dayjs(h.approvedDate).isBefore(dayjs(historyFrom))) return false;
      if (historyTo && h.approvedDate && dayjs(h.approvedDate).isAfter(dayjs(historyTo))) return false;
      return true;
    });
    if (filtered.length === 0) {
      return (
        <Typography.Text style={{ color: textTertiary, fontSize: fontSizeMd }}>Không có lịch sử phù hợp</Typography.Text>
      );
    }
    return filtered.map((h: any, idx: number) => {
      const isReject = h.status === 'REJECTED';
      const isApprove = h.status === 'APPROVED';
      const badgeColor = isReject ? statusCritical : isApprove ? statusOperational : actionPrimary;
      const statusLabel = isReject ? 'Từ chối' : isApprove ? 'Phê duyệt' : (h.status || 'Thay đổi');

      return (
        <div key={h.id || idx} style={{ ...historyInfoCardStyle, marginBottom: spaceMd }}>
          <div style={historyAccentBarStyle(badgeColor)} />
          <div style={{ padding: spaceMd }}>
            <div style={historyMetaRowStyle}>
              <span style={historyBadgeStyle(badgeColor)}>{statusLabel}</span>
              <span style={{ marginLeft: 'auto', color: textTertiary, fontSize: fontSizeSm }}>
                {formatDate(h.approvedDate || h.createdAt)}
              </span>
            </div>
            {h.approvedBy && (
              <div style={{ marginTop: spaceXs }}>
                <span style={{ color: textSecondary, fontSize: fontSizeSm }}>Người thực hiện: </span>
                <span style={{ color: textPrimary, fontSize: fontSizeSm, fontWeight: fontWeightMedium }}>{h.approvedBy}</span>
              </div>
            )}
            {h.reason && (
              <div style={{ marginTop: spaceSm, ...historyChangeRowStyle }}>
                <div style={historyFieldLabelStyle}>Lý do / Nội dung:</div>
                <span style={historyNewValueStyle}>{h.reason}</span>
              </div>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
      <ScreenHeader
        breadcrumb={[{ label: 'Quản lý KCHTGT' }, { label: 'Đê kè hàng hải' }]}
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
          <style>{`.logs-pagination-compact .list-view-pagination { padding-top: 20px !important; padding-bottom: 0 !important; } .logs-pagination-compact .list-view-pagination button { width: 40px !important; height: 40px !important; } .logs-pagination-compact .list-view-pagination .ant-select { height: 40px !important; }`}</style>
          <DataTable
            fill
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            rowActions={rowActions}
            scroll={{ x: 'max-content', y: 400 }}
            emptyState={<EmptyState description="Không có dữ liệu đê kè nào phù hợp với bộ lọc" />}
          />
          <div className="logs-pagination-compact" style={{ height: 55, overflow: 'visible', marginBottom: 8 }}>
            <Pagination
              total={total}
              current={page}
              pageSize={pageSize}
              pageSizeOptions={[10, 20, 50]}
              onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
            />
          </div>
        </div>
      </FilterTableLayout>

      {/* ── Create / Edit / Detail Drawer ─────────────────────────── */}
      <Drawer
        {...drawerProps}
        size="50%"
        title={
          <span style={drawerTitleStyle}>
            {isDetailMode
              ? `Chi tiết đê kè${detailRecord ? ` — ${detailRecord.dikeRevetmentName}` : ''}`
              : editingRecord
                ? `Chỉnh sửa — ${editingRecord.dikeRevetmentName || editingRecord.code}`
                : 'Thêm mới đê kè'}
          </span>
        }
        open={drawerVisible}
        destroyOnHidden
        onClose={closeDrawer}
        extra={<Button type="text" onClick={closeDrawer} style={drawerCloseBtnStyle}>✕</Button>}
        footer={
          isDetailMode ? null : (
            <div style={drawerFooterStyle}>
              <Button onClick={closeDrawer} style={outlineButtonStyle}>Hủy</Button>
              <Button type="primary" onClick={handleSubmit} loading={submitting} style={primaryButtonStyle}>
                {editingRecord ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </div>
          )
        }
      >
        {isDetailMode && detailRecord ? (
          <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} tabBarStyle={tabBarStyle} items={detailTabItems} />
        ) : (
          <>
            <style>{requiredMarkStyle}</style>
            <Form form={createForm} layout="vertical" initialValues={{ status: '1', dikeRevetmentType: 'WAVE_BREAK_REVETMENT', geometryType: 'LINE' }}>
              <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} tabBarStyle={tabBarStyle}
                items={[
                  {
                    key: 'general',
                    label: 'Thông tin cơ bản',
                    children: (
                      <div style={{ paddingTop: 16 }}>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="code" {...labelProps('Mã đê kè')} style={formFieldStyle}>
                              <Input disabled placeholder="Mã tự sinh tự động" style={inputStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="dikeRevetmentName" {...labelProps('Tên đê kè')} required style={formFieldStyle}
                              rules={[{ required: true, message: 'Vui lòng nhập tên đê kè' }]}>
                              <Input placeholder="VD: Đê chắn sóng phía Bắc" style={inputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="orgUnitId" {...labelProps('Đơn vị quản lý')} style={formFieldStyle}>
                              <OrgUnitTreeSelect
                                organizations={organizations}
                                placeholder="Chọn đơn vị..."
                                allowClear
                                showSearch
                                onChange={() => createForm.setFieldValue('seaportId', undefined)}
                                style={selectStyle}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="seaportId" {...labelProps('Thuộc cảng biển')} style={formFieldStyle}>
                              <Select
                                placeholder="Chọn cảng biển..."
                                allowClear
                                showSearch
                                filterOption={(input, option) => normalizeSearchText(option?.label).includes(normalizeSearchText(input))}
                                options={seaports.map((p) => ({ value: p.id, label: p.portName || p.portCode || p.id }))}
                                style={selectStyle}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="dikeRevetmentType" {...labelProps('Loại kết cấu công trình')} required style={formFieldStyle}
                              rules={[{ required: true, message: 'Vui lòng chọn loại kết cấu' }]}>
                              <Select placeholder="Chọn loại kết cấu" options={DIKE_REVETMENT_TYPE_OPTIONS} style={selectStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="location" {...labelProps('Địa điểm (Tỉnh/TP)')} required style={formFieldStyle}
                              rules={[{ required: true, message: 'Vui lòng chọn địa điểm' }]}>
                              <Select
                                placeholder="Chọn tỉnh/thành phố..."
                                allowClear
                                showSearch
                                filterOption={(input, option) => normalizeSearchText(option?.label).includes(normalizeSearchText(input))}
                                options={VIETNAM_PROVINCE_OPTIONS.map((p) => ({ value: p.label, label: p.label }))}
                                style={selectStyle}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="status" {...labelProps('Tình trạng')} required style={formFieldStyle}
                              rules={[{ required: true, message: 'Vui lòng chọn tình trạng' }]}>
                              <Select placeholder="Chọn tình trạng" options={CONDITION_STATUS_OPTIONS} style={selectStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="surfaceMaterial" {...labelProps('Vật liệu bề mặt')} style={formFieldStyle}>
                              <Input placeholder="VD: Bê tông cốt thép" style={inputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Form.Item name="locationDetail" {...labelProps('Địa điểm chi tiết')} style={formFieldStyle}>
                          <Input.TextArea rows={2} placeholder="Nhập địa điểm chi tiết..." style={{ borderRadius: radiusPill }} />
                        </Form.Item>
                        <Form.Item name="note" {...labelProps('Ghi chú')} style={formFieldStyle}>
                          <Input.TextArea rows={3} maxLength={2000} placeholder="Nhập ghi chú..." showCount style={{ borderRadius: radiusPill }} />
                        </Form.Item>
                      </div>
                    ),
                  },
                  {
                    key: 'technical',
                    label: 'Thông tin kỹ thuật',
                    children: (
                      <div style={{ paddingTop: 16 }}>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="length" {...labelProps('Chiều dài (m)')} style={formFieldStyle}>
                              <InputNumber min={0} step={0.1} placeholder="Nhập chiều dài" style={{ ...selectStyle, width: '100%' }} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="height" {...labelProps('Chiều cao (m)')} style={formFieldStyle}>
                              <InputNumber min={0} step={0.1} placeholder="Nhập chiều cao" style={{ ...selectStyle, width: '100%' }} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="crestElevation" {...labelProps('Cao trình đỉnh (m)')} style={formFieldStyle}>
                              <InputNumber step={0.1} placeholder="Nhập cao trình đỉnh" style={{ ...selectStyle, width: '100%' }} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="commissioningDate" {...labelProps('Thời điểm đưa vào khai thác')} style={formFieldStyle}>
                              <DatePicker format="DD/MM/YYYY" placeholder="Chọn ngày khai thác" style={selectStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="constructionDate" {...labelProps('Thời điểm xây dựng')} style={formFieldStyle}>
                              <DatePicker format="DD/MM/YYYY" placeholder="Chọn ngày xây dựng" style={selectStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="lastMaintenanceYear" {...labelProps('Năm bảo trì gần nhất')} style={formFieldStyle}>
                              <DatePicker picker="year" placeholder="Chọn năm bảo trì" style={selectStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
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
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Xác nhận xóa đê kè</span>}
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
            Vui lòng nhập <strong>tên đê kè</strong> hoặc gõ <strong>"XÓA"</strong> để xác nhận xóa.
          </p>
          {deletingRecord && (
            <p style={{ marginBottom: spaceFormField }}>
              Đê kè: <strong style={{ color: textPrimary }}>{deletingRecord.dikeRevetmentName || deletingRecord.code}</strong>
            </p>
          )}
          <Input placeholder="Nhập tên đê kè hoặc XÓA" value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)} onPressEnter={confirmDelete}
            style={inputStyle} autoFocus />
        </div>
      </Modal>

      {/* ── Submit Approval Modal ────────────────────────────────── */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Gửi duyệt đê kè</span>}
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
          <p>
            Xác nhận gửi <strong>{submittingRecord?.dikeRevetmentName || submittingRecord?.code || ''}</strong> để phê duyệt?
          </p>
        </div>
      </Modal>

      {/* ── Approve Modal (C1 / C2) ───────────────────────────────── */}
      <Modal
        title={
          <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>
            Phê duyệt {approvingLevel === 'C1' ? 'Cấp 1 (Chi cục / Cảng vụ)' : 'Cấp 2 (Cục Hàng hải)'}
          </span>
        }
        open={approveModalOpen}
        onCancel={() => { setApproveModalOpen(false); setApprovingRecord(null); }}
        footer={[
          <Button key="cancel" onClick={() => { setApproveModalOpen(false); setApprovingRecord(null); }} style={outlineButtonStyle}>Hủy</Button>,
          <Button key="approve" type="primary" onClick={confirmApprove}
            style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}>
            Xác nhận phê duyệt
          </Button>,
        ]}
        width={480}
      >
        <div style={confirmModalBodyStyle}>
          <p>
            Xác nhận phê duyệt {approvingLevel === 'C1' ? 'cấp 1' : 'cấp 2 (chính thức)'} cho đê kè <strong>{approvingRecord?.dikeRevetmentName || approvingRecord?.code || ''}</strong>?
          </p>
        </div>
      </Modal>

      {/* ── Reject Modal (C1 / C2) ───────────────────────────────── */}
      <Modal
        title={
          <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>
            Từ chối phê duyệt {rejectingLevel === 'C1' ? 'Cấp 1' : 'Cấp 2'}
          </span>
        }
        open={rejectModalOpen}
        onCancel={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); }}
        footer={[
          <Button key="cancel" onClick={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); }}
            style={outlineButtonStyle}>Hủy</Button>,
          <Button key="reject" type="primary" danger onClick={confirmReject} style={dangerButtonStyle}>Xác nhận từ chối</Button>,
        ]}
        width={480}
      >
        <div style={confirmModalBodyStyle}>
          <p style={{ marginBottom: spaceFormField }}>
            Vui lòng nhập lý do từ chối cho <strong>{rejectingRecord?.dikeRevetmentName || rejectingRecord?.code || ''}</strong>:
          </p>
          <Input.TextArea placeholder="Nhập lý do từ chối (tối thiểu 10, tối đa 500 ký tự)..." value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)} rows={3} maxLength={500} showCount
            style={rejectReasonStyle} />
        </div>
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
            <strong>Đê kè:</strong> {historyTarget.code} — {historyTarget.dikeRevetmentName}
          </p>
        )}
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

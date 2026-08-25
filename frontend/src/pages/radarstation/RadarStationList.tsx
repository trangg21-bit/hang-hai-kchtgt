import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Button,
  Tag,
  Modal,
  Input,
  InputNumber,
  Select,
  Drawer,
  Space,
  Typography,
  Form,
  DatePicker,
  Row,
  Col,
  Upload,
  Tabs,
  Tooltip,
  Table,
} from 'antd';
import toast from '../../components/ToastNotification';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  HistoryOutlined,
  SendOutlined,
  UploadOutlined,
  FileOutlined,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import type { UploadFile } from 'antd';
import {
  radarStationCRUD,
  radarStationApproval,
  radarStationAttachment,
} from '../../services/radarStationService';
import type {
  RadarStationResponse,
  HistoryEntry,
  CreateRadarStationRequest,
} from '../../types/radarStation';
import {
  CONDITION_STATUS_OPTIONS,
  UNIT_OF_MEASURE_OPTIONS,
} from '../../types/radarStation';
import { organizationService } from '../../services/organizationService';
import { userService } from '../../services/userService';
import { vtsSystemCRUD } from '../../services/vtsSystemService';
import { ScreenHeader, DataTable } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import { OrgUnitTreeSelect, normalizeSearchText, type OrgUnitTreeOption } from '../../components/org-unit';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import { symbolService } from '../../services/symbolService';
import { usePermissionStore } from '../../store/permissionStore';
import { useAuthStore } from '../../store/authStore';
import { VIETNAM_PROVINCE_OPTIONS } from '../../types/common';
import { colors } from '../../theme';
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
  fontWeightBold,
  fontWeightMedium,
  radiusSm,
  radiusMd,
  radiusPill,
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
  historyGroupGridStyle,
  historyTimeStyle,
  historyMetaRowStyle,
  historyInfoCardStyle,
  historyAccentBarStyle,
  historyInfoTitleStyle,
  historyChangeRowStyle,
  historyFieldLabelStyle,
  historyNewValueStyle,
} from '../../tokens';

// ── Constants ────────────────────────────────────────────────────────

// Status tabs chuẩn 2 cấp M-1006
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

// Tình trạng hoạt động
const CONDITION_STATUS_STYLE_MAP: Record<string, { color: string; label: string }> = {
  '0': { color: statusCritical, label: 'Ngừng hoạt động' },
  '1': { color: statusOperational, label: 'Đang khai thác' },
  '2': { color: statusAttention, label: 'Chưa hoạt động' },
  OPERATIONAL: { color: statusOperational, label: 'Đang khai thác' },
  STOPPED: { color: statusCritical, label: 'Ngừng hoạt động' },
  MAINTENANCE: { color: statusAttention, label: 'Bảo trì' },
};

const APPROVAL_LEVEL_LABEL: Record<string, string> = {
  '0': 'Lưu tạm',
  '1': 'Cấp 1 (Cảng vụ)',
  '2': 'Cấp 2 (Cục Hàng hải)',
  LEVEL_0: 'Lưu tạm',
  LEVEL_1: 'Cấp 1 (Cảng vụ)',
  LEVEL_2: 'Cấp 2 (Cục Hàng hải)',
  C1: 'Cấp 1 (Cảng vụ)',
  C2: 'Cấp 2 (Cục Hàng hải)',
};

const getProvinceLabel = (provinceId?: string): string =>
  provinceId
    ? VIETNAM_PROVINCE_OPTIONS.find((o) => o.value === String(provinceId))?.label || provinceId
    : '—';

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return dayjs(dateStr).format('DD/MM/YYYY HH:mm');
  } catch {
    return dateStr;
  }
}

const rangeValue = (from: string, to: string): [Dayjs | null, Dayjs | null] | null =>
  from || to ? [from ? dayjs(from) : null, to ? dayjs(to) : null] : null;

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

export default function RadarStationList() {
  const hasPerm = usePermissionStore((s) => s.hasPermission);
  const currentUserId = useAuthStore((s) => s.user?.id || s.user?.userId);
  const isInIframe = window.self !== window.top;

  // ── Filter state ─────────────────────────────────────────────────
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterOrgUnitId, setFilterOrgUnitId] = useState<string | undefined>();
  const [filterSeaportId, setFilterSeaportId] = useState<string | undefined>();
  const [filterVtsSystemId, setFilterVtsSystemId] = useState<string | undefined>();
  const [filterVtsOperationCenterId, setFilterVtsOperationCenterId] = useState<string | undefined>();
  const [filterOperatingUnitId, setFilterOperatingUnitId] = useState<string | undefined>();
  const [filterProvinceId, setFilterProvinceId] = useState<string | undefined>();
  const [filterConditionStatus, setFilterConditionStatus] = useState<string | undefined>();
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<string | undefined>();
  const [filterUpdatedBy, setFilterUpdatedBy] = useState('');
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState('');
  const [filterUpdatedTo, setFilterUpdatedTo] = useState('');
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('');

  // ── Pagination ──────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // ── Data ─────────────────────────────────────────────────────────
  const [dataSource, setDataSource] = useState<RadarStationResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  // ── Dropdown data ───────────────────────────────────────────────
  const [orgOptions, setOrgOptions] = useState<OrgUnitTreeOption[]>([]);
  const [seaportOptions, setSeaportOptions] = useState<{ id: string; portCode?: string; portName?: string }[]>([]);
  const [vtsOptions, setVtsOptions] = useState<{ id: string; code?: string; systemName?: string }[]>([]);
  const [userOptions, setUserOptions] = useState<{ value: string; label: string }[]>([]);

  // ── Drawer state (create / edit / detail) ────────────────────────
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RadarStationResponse | null>(null);
  const [detailRecord, setDetailRecord] = useState<RadarStationResponse | null>(null);
  const [isDetailMode, setIsDetailMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createForm] = Form.useForm();
  const [activeTabKey, setActiveTabKey] = useState('general');
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [detailFiles, setDetailFiles] = useState<any[]>([]);
  const [previewCode, setPreviewCode] = useState('');

  // ── Delete state ─────────────────────────────────────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<RadarStationResponse | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // ── Approval state ──────────────────────────────────────────────
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submittingRecord, setSubmittingRecord] = useState<RadarStationResponse | null>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvingRecord, setApprovingRecord] = useState<RadarStationResponse | null>(null);
  const [approvingLevel, setApprovingLevel] = useState<'C1' | 'C2'>('C1');
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectTarget, setRejectTarget] = useState<RadarStationResponse | null>(null);
  const [rejectingLevel, setRejectingLevel] = useState<'C1' | 'C2'>('C1');

  // ── History state ────────────────────────────────────────────────
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<RadarStationResponse | null>(null);
  const [historyRecords, setHistoryRecords] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');
  const [logOpen, setLogOpen] = useState(false);
  const [kchtOpen, setKchtOpen] = useState(true);
  const [operationOpen, setOperationOpen] = useState(true);
  const [maintenanceOpen, setMaintenanceOpen] = useState(true);
  const [incidentOpen, setIncidentOpen] = useState(true);
  const [symbolOptions, setSymbolOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    symbolService.list({ pageSize: 200 })
      .then((res: any) => {
        const items = Array.isArray(res) ? res : (res as any)?.items || [];
        setSymbolOptions(items.map((s: any) => ({ value: s.id || s.code || '', label: s.name || s.code || s.id || '' })));
      })
      .catch(() => {});
  }, []);

  // ── Load dropdown data ───────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const orgs = await organizationService.getTree();
        setOrgOptions(orgs || []);
      } catch (err) {
        console.error('Không tải được cây đơn vị quản lý', err);
      }
      try {
        const ports = await vtsSystemCRUD.getScopedPortOptions();
        setSeaportOptions(ports || []);
      } catch (err) {
        console.error('Không tải được danh sách cảng biển', err);
      }
      try {
        const vts = await vtsSystemCRUD.list({ size: 500 });
        setVtsOptions(
          (vts.items || []).map((item) => ({
            id: item.id,
            code: item.code,
            systemName: item.systemName,
          })),
        );
      } catch (err) {
        console.error('Không tải được danh sách hệ thống VTS', err);
      }
      try {
        const resp = await userService.list({ pageSize: 1000 });
        const users = resp.data || (resp as any).content || [];
        setUserOptions(users.map((u: any) => ({ value: u.id, label: u.fullName || u.username || u.id })));
      } catch (err) {
        console.error('Không tải được danh sách cán bộ', err);
      }
    })();
  }, []);

  // ── Fetch tab counts ─────────────────────────────────────────────
  const fetchCounts = useCallback(async () => {
    try {
      const counts = await radarStationCRUD.getTabCounts(
        filterOrgUnitId,
        filterKeyword.trim() || undefined,
        filterConditionStatus
      );
      setTabCounts(counts || {});
    } catch {
      /* silent */
    }
  }, [filterOrgUnitId, filterKeyword, filterConditionStatus]);

  // ── Fetch main data ─────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await radarStationCRUD.searchPaged({
        keyword: filterKeyword.trim() || undefined,
        orgUnitId: filterOrgUnitId,
        seaportId: filterSeaportId,
        vtsSystemId: filterVtsSystemId,
        vtsOperationCenterId: filterVtsOperationCenterId,
        operatingUnitId: filterOperatingUnitId,
        provinceId: filterProvinceId,
        conditionStatus: filterConditionStatus,
        approvalStatus: filterApprovalStatus || TAB_QUERY_MAP[activeTab],
        updatedBy: filterUpdatedBy.trim() || undefined,
        updatedFrom: filterUpdatedFrom,
        updatedTo: filterUpdatedTo,
        page,
        size: pageSize,
      });
      setDataSource(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      console.error('Không thể tải danh sách trạm radar', err);
    } finally {
      setIsLoading(false);
    }
  }, [
    filterKeyword, filterOrgUnitId, filterSeaportId,
    filterVtsSystemId, filterVtsOperationCenterId, filterOperatingUnitId,
    filterProvinceId, filterConditionStatus, filterApprovalStatus,
    filterUpdatedBy, filterUpdatedFrom, filterUpdatedTo,
    activeTab, page, pageSize,
  ]);

  useEffect(() => { void fetchData(); }, [fetchData]);
  useEffect(() => { void fetchCounts(); }, [fetchCounts]);

  // ── Filter handlers ─────────────────────────────────────────────
  const handleFilterApply = useCallback(() => { setPage(1); }, []);
  const handleFilterReset = useCallback(() => {
    setFilterKeyword('');
    setFilterOrgUnitId(undefined);
    setFilterSeaportId(undefined);
    setFilterVtsSystemId(undefined);
    setFilterVtsOperationCenterId(undefined);
    setFilterOperatingUnitId(undefined);
    setFilterProvinceId(undefined);
    setFilterConditionStatus(undefined);
    setFilterApprovalStatus(undefined);
    setFilterUpdatedBy('');
    setFilterUpdatedFrom('');
    setFilterUpdatedTo('');
    setActiveTab('');
    setPage(1);
  }, []);
  const handleTabChange = useCallback((key: string) => { setActiveTab(key); setPage(1); }, []);

  // ── Drawer handlers ─────────────────────────────────────────────
  const openCreateDrawer = useCallback(() => {
    setEditingRecord(null);
    setIsDetailMode(false);
    setDetailRecord(null);
    createForm.resetFields();
    createForm.setFieldsValue({ conditionStatus: '1', quantity: 1 });
    setActiveTabKey('general');
    setUploadedFiles([]);
    setPreviewCode('');
    radarStationCRUD.generateCode()
      .then((r) => setPreviewCode(r.code || ''))
      .catch(() => setPreviewCode(''));
    setDrawerVisible(true);
  }, [createForm]);

  const openEditDrawer = useCallback((record: RadarStationResponse) => {
    setEditingRecord(record);
    setIsDetailMode(false);
    setDetailRecord(null);
    setActiveTabKey('general');
    createForm.setFieldsValue({
      stationName: record.stationName,
      location: record.location,
      orgUnitId: record.orgUnitId,
      seaportId: record.seaportId,
      vtsSystemId: record.vtsSystemId,
      vtsOperationCenterId: record.vtsOperationCenterId,
      operatingUnitId: record.operatingUnitId,
      provinceId: record.provinceId ? String(record.provinceId) : undefined,
      unitOfMeasure: record.unitOfMeasure,
      quantity: record.quantity,
      conditionStatus: record.conditionStatus || '1',
      stationType: record.stationType,
      towerHeight: record.towerHeight,
      radarRange: record.radarRange,
      coverage: record.coverage,
      emissionArea: record.emissionArea,
      source: record.source,
      note: record.note,
      longitude: record.longitude,
      latitude: record.latitude,
      geometryType: record.geometryType,
    });
    setUploadedFiles([]);
    radarStationAttachment.list(record.id)
      .then((files) => setUploadedFiles(files.map((a: any) => ({ uid: a.id, name: a.fileName || a.name, size: a.fileSize, status: 'done' as const }))))
      .catch(() => setUploadedFiles([]));
    setDrawerVisible(true);
  }, [createForm]);

  const openDetailDrawer = useCallback(async (record: RadarStationResponse) => {
    setDetailRecord(record);
    setEditingRecord(record);
    setIsDetailMode(true);
    setActiveTabKey('general');
    setDrawerVisible(true);
    setDetailFiles([]);
    try {
      const res = await radarStationCRUD.getById(record.id);
      setDetailRecord(res);
    } catch {
      toast.error('Không thể tải thông tin chi tiết');
    }
    try {
      const files = await radarStationAttachment.list(record.id);
      setDetailFiles(files || []);
    } catch {
      setDetailFiles([]);
    }
    setHistoryLoading(true);
    setHistoryRecords([]);
    try {
      const hist = await radarStationApproval.getHistory(record.id);
      setHistoryRecords(hist || []);
    } catch {
      /* ignore */
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerVisible(false);
    setEditingRecord(null);
    setDetailRecord(null);
    setIsDetailMode(false);
    createForm.resetFields();
    setUploadedFiles([]);
    setDetailFiles([]);
    if (isInIframe) {
      window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
    }
  }, [createForm, isInIframe]);

  // ── File đính kèm ───────────────────────────────────────────────
  const handleBeforeUpload = useCallback((file: File): false => {
    if (file.size > 20 * 1024 * 1024) { toast.error('File vượt quá 20MB'); return false; }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(ext)) { toast.error('Định dạng không hỗ trợ'); return false; }
    if (uploadedFiles.length >= 10) { toast.error('Tối đa 10 file'); return false; }
    setUploadedFiles((p) => [...p, { uid: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`, name: file.name, status: 'done' as const, originFileObj: file as any }]);
    return false;
  }, [uploadedFiles]);

  const removeUploadedFile = useCallback(async (uid: string) => {
    const target = uploadedFiles.find((f) => f.uid === uid);
    setUploadedFiles((p) => p.filter((f) => f.uid !== uid));
    if (target && !target.originFileObj && editingRecord) {
      try { await radarStationAttachment.delete(editingRecord.id, uid); } catch { /* ignore */ }
    }
  }, [uploadedFiles, editingRecord]);

  // ── History ─────────────────────────────────────────────────────
  const openHistory = useCallback(async (r: RadarStationResponse) => {
    setHistoryTarget(r);
    setHistoryOpen(true);
    setHistorySearch('');
    setHistoryFrom('');
    setHistoryTo('');
    setHistoryLoading(true);
    setHistoryRecords([]);
    try {
      const res = await radarStationApproval.getHistory(r.id);
      setHistoryRecords(res || []);
    } catch {
      toast.error('Không thể tải lịch sử');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // ── Delete handlers ─────────────────────────────────────────────
  const openDeleteConfirm = useCallback((record: RadarStationResponse) => {
    setDeletingRecord(record);
    setDeleteConfirmText('');
    setDeleteModalOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deletingRecord) return;
    const expectedText = (deletingRecord.stationName || 'XÓA').trim().toLowerCase();
    const input = deleteConfirmText.trim().toLowerCase();
    if (input !== expectedText && input !== 'xóa') {
      toast.error('Vui lòng nhập đúng tên trạm radar hoặc gõ "XÓA" để xác nhận');
      return;
    }
    try {
      await radarStationCRUD.delete(deletingRecord.id);
      toast.success('Đã xóa trạm radar');
      setDeleteModalOpen(false);
      setDeletingRecord(null);
      setDeleteConfirmText('');
      void fetchData();
      void fetchCounts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  }, [deletingRecord, deleteConfirmText, fetchData, fetchCounts]);

  // ── Submit approval ─────────────────────────────────────────────
  const openSubmitModal = useCallback((record: RadarStationResponse) => {
    setSubmittingRecord(record);
    setSubmitModalOpen(true);
  }, []);

  const confirmSubmit = useCallback(async () => {
    if (!submittingRecord) return;
    try {
      await radarStationApproval.submitForApproval(submittingRecord.id);
      toast.success('Đã gửi duyệt trạm radar');
      setSubmitModalOpen(false);
      setSubmittingRecord(null);
      void fetchData();
      void fetchCounts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gửi duyệt thất bại');
    }
  }, [submittingRecord, fetchData, fetchCounts]);

  // ── Approve (C1 / C2) ───────────────────────────────────────────
  const openApproveModal = useCallback((record: RadarStationResponse, level: 'C1' | 'C2') => {
    setApprovingRecord(record);
    setApprovingLevel(level);
    setApproveModalOpen(true);
  }, []);

  const closeApproveModal = useCallback(() => {
    setApproveModalOpen(false);
    setApprovingRecord(null);
  }, []);

  const confirmApprove = useCallback(async () => {
    if (!approvingRecord) return;
    try {
      if (approvingLevel === 'C1') {
        await radarStationApproval.approveLevel1(approvingRecord.id);
        toast.success('Chi cục / Cảng vụ phê duyệt C1 thành công');
      } else {
        await radarStationApproval.approveLevel2(approvingRecord.id);
        toast.success('Cục Hàng hải phê duyệt C2 thành công (Đã duyệt chính thức)');
      }
      setApproveModalOpen(false);
      setApprovingRecord(null);
      void fetchData();
      void fetchCounts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
    }
  }, [approvingRecord, approvingLevel, fetchData, fetchCounts]);

  // ── Reject (C1 / C2) ───────────────────────────────────────────
  const openRejectModal = useCallback((record: RadarStationResponse, level: 'C1' | 'C2') => {
    setRejectTarget(record);
    setRejectingLevel(level);
    setRejectReason('');
    setRejectModalVisible(true);
  }, []);

  const confirmReject = useCallback(async () => {
    if (!rejectTarget) return;
    const reason = rejectReason.trim();
    if (reason.length < 10) {
      toast.error('Lý do từ chối phải có ít nhất 10 ký tự');
      return;
    }
    try {
      if (rejectingLevel === 'C1') {
        await radarStationApproval.rejectLevel1(rejectTarget.id, reason);
        toast.success('Đã trả về C1 trạm radar');
      } else {
        await radarStationApproval.rejectLevel2(rejectTarget.id, reason);
        toast.success('Đã trả về C2 trạm radar');
      }
      setRejectModalVisible(false);
      setRejectTarget(null);
      setRejectReason('');
      void fetchData();
      void fetchCounts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
    }
  }, [rejectTarget, rejectingLevel, rejectReason, fetchData, fetchCounts]);

  // ── Submit form (create / update) ───────────────────────────────
  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      const values = await createForm.validateFields();
      const payload: CreateRadarStationRequest = {
        stationName: values.stationName?.trim(),
        location: values.location?.trim(),
        orgUnitId: values.orgUnitId || undefined,
        seaportId: values.seaportId || undefined,
        vtsSystemId: values.vtsSystemId || undefined,
        vtsOperationCenterId: values.vtsOperationCenterId || undefined,
        operatingUnitId: values.operatingUnitId || undefined,
        provinceId: values.provinceId ? String(values.provinceId) : undefined,
        unitOfMeasure: values.unitOfMeasure || undefined,
        quantity: values.quantity,
        conditionStatus: values.conditionStatus || '1',
        towerHeight: values.towerHeight,
        radarRange: values.radarRange,
        coverage: values.coverage?.trim() || undefined,
        emissionArea: values.emissionArea,
        stationType: values.stationType?.trim() || undefined,
        source: values.source?.trim() || undefined,
        note: values.note?.trim() || undefined,
        longitude: values.longitude != null ? Number(values.longitude) : undefined,
        latitude: values.latitude != null ? Number(values.latitude) : undefined,
        geometryType: values.geometryType || undefined,
        coordinates: values.coordinates || undefined,
      };
      if (editingRecord) {
        await radarStationCRUD.update(editingRecord.id, payload);
        const newFiles = uploadedFiles.filter((f) => f.originFileObj).map((f) => f.originFileObj as File);
        if (newFiles.length > 0) {
          await radarStationAttachment.upload(editingRecord.id, newFiles);
        }
        toast.success('Đã cập nhật trạm radar');
      } else {
        const created = await radarStationCRUD.create(payload);
        const newFiles = uploadedFiles.filter((f) => f.originFileObj).map((f) => f.originFileObj as File);
        if (created.id && newFiles.length > 0) {
          await radarStationAttachment.upload(created.id, newFiles);
        }
        toast.success('Đã tạo mới trạm radar (Lưu tạm)');
      }
      setDrawerVisible(false);
      setEditingRecord(null);
      setDetailRecord(null);
      setIsDetailMode(false);
      createForm.resetFields();
      void fetchData();
      void fetchCounts();
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }, [editingRecord, createForm, fetchData, fetchCounts, uploadedFiles]);

  // ── Row actions with 2-level approval & Anti-self-approval ────────
  const rowActions = useCallback((record: RadarStationResponse) => {
    const actions: any[] = [];
    if (hasPerm('radarstation:read') || hasPerm('admin:all')) {
      actions.push({ key: 'view', label: 'Chi tiết', icon: <EyeOutlined />, onClick: () => openDetailDrawer(record) });
    }
    const st = record.approvalStatus || record.status || '';
    const isDraftOrRejected = st === 'DRAFT' || st === 'REJECTED_LEVEL1' || st === 'REJECTED_LEVEL2' || st === 'REJECTED';

    if (isDraftOrRejected && (hasPerm('radarstation:update') || hasPerm('admin:all'))) {
      actions.push({ key: 'edit', label: 'Chỉnh sửa', icon: <EditOutlined />, onClick: () => openEditDrawer(record) });
      actions.push({ key: 'submit', label: 'Gửi duyệt', icon: <SendOutlined />, onClick: () => openSubmitModal(record) });
    }

    const isPendingC1 = st === 'PENDING_APPROVAL' || st === 'PROPOSED';
    const canApproveC1 = hasPerm('radarstation:approvec1') || hasPerm('admin:all');
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

    const isPendingC2 = st === 'APPROVED_LEVEL1';
    const canApproveC2 = hasPerm('radarstation:approvec2') || hasPerm('admin:all');
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

    actions.push({ key: 'history', label: 'Lịch sử', icon: <HistoryOutlined />, onClick: () => openHistory(record) });

    if (isDraftOrRejected && (hasPerm('radarstation:delete') || hasPerm('admin:all'))) {
      actions.push({ key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, danger: true, onClick: () => openDeleteConfirm(record) });
    }
    return actions;
  }, [hasPerm, currentUserId, openDetailDrawer, openEditDrawer, openSubmitModal, openApproveModal, openRejectModal, openHistory, openDeleteConfirm]);

  // ── Label helpers ───────────────────────────────────────────────
  const orgNameById = useCallback((orgUnitId?: string): string => {
    if (!orgUnitId) return '—';
    const org = orgOptions.find((o) => o.id === orgUnitId);
    return org ? (org.code ? `${org.code} - ${org.name}` : org.name) : orgUnitId;
  }, [orgOptions]);

  const seaportLabelById = useCallback((seaportId?: string): string => {
    if (!seaportId) return '—';
    const port = seaportOptions.find((p) => p.id === seaportId);
    return port ? (port.portCode ? `${port.portCode} - ${port.portName || ''}` : port.portName || seaportId) : seaportId;
  }, [seaportOptions]);

  const vtsLabelById = useCallback((vtsId?: string): string => {
    if (!vtsId) return '—';
    const vts = vtsOptions.find((v) => v.id === vtsId);
    return vts ? (vts.code ? `${vts.code} - ${vts.systemName || ''}` : vts.systemName || vtsId) : vtsId;
  }, [vtsOptions]);

  // ── Table columns ───────────────────────────────────────────────
  const columns: any[] = useMemo(() => [
    {
      key: 'sequenceNo', label: 'STT', width: 60, fixed: 'left' as const, align: 'center' as const,
      render: (_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd }}>{(page - 1) * pageSize + i + 1}</span>,
    },
    {
      key: 'code', label: 'Mã trạm radar', dataIndex: 'code', width: 150, fixed: 'left' as const,
      render: (code: string) => code
        ? <Tag color="cyan" style={{ borderRadius: radiusSm, fontSize: fontSizeSm }}>{code}</Tag>
        : <span style={{ color: textTertiary, fontSize: fontSizeMd }}>—</span>,
    },
    {
      key: 'stationName', label: 'Tên trạm radar', dataIndex: 'stationName', width: 220, ellipsis: false,
      render: (name: string, record: RadarStationResponse) => (
        <Button type="link" onClick={() => openDetailDrawer(record)}
          style={{ padding: 0, height: 'auto', fontWeight: fontWeightBold, color: actionPrimary, textAlign: 'left', whiteSpace: 'normal' }}>
          {name || '—'}
        </Button>
      ),
    },
    {
      key: 'stationType', label: 'Loại trạm', dataIndex: 'stationType', width: 130,
      render: (v: string) => v
        ? <Tag color="blue" style={{ borderRadius: radiusSm, fontSize: fontSizeSm }}>{v}</Tag>
        : <span style={{ color: textTertiary, fontSize: fontSizeMd }}>—</span>,
    },
    {
      key: 'orgUnitName', label: 'Đơn vị quản lý', dataIndex: 'orgUnitName', width: 200, ellipsis: false,
      render: (v: string | undefined, record: RadarStationResponse) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || orgNameById(record.orgUnitId)}</span>,
    },
    {
      key: 'seaportName', label: 'Thuộc cảng biển', dataIndex: 'seaportName', width: 180, ellipsis: false,
      render: (v: string | undefined, record: RadarStationResponse) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || seaportLabelById(record.seaportId)}</span>,
    },
    {
      key: 'vtsSystemName', label: 'Hệ thống VTS', dataIndex: 'vtsSystemName', width: 190, ellipsis: false,
      render: (v: string | undefined, record: RadarStationResponse) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || vtsLabelById(record.vtsSystemId)}</span>,
    },
    {
      key: 'vtsOperationCenterName', label: 'Trung tâm điều hành VTS', dataIndex: 'vtsOperationCenterName', width: 200, ellipsis: false,
      render: (v: string | undefined, record: RadarStationResponse) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || vtsLabelById(record.vtsOperationCenterId)}</span>,
    },
    {
      key: 'operatingUnitId', label: 'Đơn vị khai thác', dataIndex: 'operatingUnitId', width: 180, ellipsis: false,
      render: (v: string | undefined, record: RadarStationResponse) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v ? orgNameById(v) : '—'}</span>,
    },
    {
      key: 'provinceId', label: 'Địa điểm Tỉnh/TP', dataIndex: 'provinceId', width: 150,
      render: (v: string | undefined) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{getProvinceLabel(v)}</span>,
    },
    {
      key: 'unitOfMeasure', label: 'Đơn vị tính', dataIndex: 'unitOfMeasure', width: 110, align: 'center' as const,
      render: (v: string | undefined) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span>,
    },
    {
      key: 'quantity', label: 'Số lượng', dataIndex: 'quantity', width: 90, align: 'right' as const,
      render: (v: number | null | undefined) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v != null ? Number(v).toLocaleString('vi-VN') : '—'}</span>,
    },
    {
      key: 'conditionStatus', label: 'Tình trạng', dataIndex: 'conditionStatus', width: 160, align: 'center' as const,
      render: (v: string) => {
        const s = CONDITION_STATUS_STYLE_MAP[v];
        return s
          ? <span style={{ ...badgeBaseStyle, minWidth: 125, justifyContent: 'center', background: `${s.color}15`, color: s.color }}>{s.label}</span>
          : <span style={{ fontSize: fontSizeMd, color: textTertiary }}>—</span>;
      },
    },
    {
      key: 'updatedAt', label: 'Ngày cập nhật', dataIndex: 'updatedAt', width: 160, align: 'center' as const,
      render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{formatDate(v)}</span>,
    },
    {
      key: 'updatedBy', label: 'Cán bộ cập nhật', dataIndex: 'updatedBy', width: 180, ellipsis: true,
      render: (v: string | undefined) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{userOptions.find((u) => u.value === v)?.label || '—'}</span>,
    },
    {
      key: 'approvalStatus', label: 'Trạng thái phê duyệt', dataIndex: 'approvalStatus', width: 180, align: 'center' as const,
      render: (status: string, record: RadarStationResponse) => <ApprovalStatusBadge status={status || record.status || ''} />,
    },
  ], [page, pageSize, openDetailDrawer, orgNameById, seaportLabelById, vtsLabelById, userOptions]);

  const tableData = useMemo(
    () => dataSource.map((item, idx) => ({ ...item, _rowIndex: (page - 1) * pageSize + idx + 1 })),
    [dataSource, page, pageSize],
  );

  // ── Filter panel content ────────────────────────────────────────
  const filterContent = (
    <>
      <div style={{ marginBottom: spaceFormField, marginTop: 16 }}>
        <div style={{ ...filterLabelStyle, marginBottom: spaceXs }}>Đơn vị quản lý</div>
        <OrgUnitTreeSelect
          organizations={orgOptions}
          placeholder="Tất cả"
          allowClear
          treeDefaultExpandAll
          listHeight={256}
          value={filterOrgUnitId}
          onChange={(v) => {
            setFilterOrgUnitId(v || undefined);
            setFilterSeaportId(undefined);
            setFilterVtsSystemId(undefined);
            setFilterVtsOperationCenterId(undefined);
            setPage(1);
          }}
          style={filterInputStyle}
        />
      </div>
      <div style={{ marginBottom: spaceFormField }}>
        <div style={{ ...filterLabelStyle, marginBottom: spaceXs }}>Thuộc cảng biển</div>
        <Select
          placeholder="Chọn cảng biển..."
          allowClear
          value={filterSeaportId}
          onChange={(v) => { setFilterSeaportId(v); setPage(1); }}
          showSearch
          filterOption={(input, option) => normalizeSearchText(option?.label).includes(normalizeSearchText(input))}
          options={seaportOptions.map((p) => ({ value: p.id, label: p.portCode ? `${p.portCode} - ${p.portName || ''}` : p.portName || p.id }))}
          style={filterInputStyle}
        />
      </div>
      <div style={{ marginBottom: spaceFormField }}>
        <div style={{ ...filterLabelStyle, marginBottom: spaceXs }}>Tên / Mã trạm radar</div>
        <Input
          placeholder="Tìm theo tên, mã trạm radar..."
          allowClear
          value={filterKeyword}
          onChange={(e) => { setFilterKeyword(e.target.value); setPage(1); }}
          onPressEnter={handleFilterApply}
          style={filterInputStyle}
        />
      </div>

      {filterCollapsed && (
        <>
          <div style={{ marginBottom: spaceFormField }}>
            <div style={{ ...filterLabelStyle, marginBottom: spaceXs }}>Hệ thống VTS</div>
            <Select
              placeholder="Chọn hệ thống VTS"
              allowClear
              value={filterVtsSystemId}
              onChange={(v) => { setFilterVtsSystemId(v); setPage(1); }}
              showSearch
              filterOption={(input, option) => normalizeSearchText(option?.label).includes(normalizeSearchText(input))}
              options={vtsOptions.map((vts) => ({ value: vts.id, label: vts.code ? `${vts.code} - ${vts.systemName || ''}` : vts.systemName || vts.id }))}
              style={filterInputStyle}
            />
          </div>
          <div style={{ marginBottom: spaceFormField }}>
            <div style={{ ...filterLabelStyle, marginBottom: spaceXs }}>Trung tâm điều hành VTS</div>
            <Select
              placeholder="Chọn trung tâm điều hành VTS"
              allowClear
              value={filterVtsOperationCenterId}
              onChange={(v) => { setFilterVtsOperationCenterId(v); setPage(1); }}
              showSearch
              filterOption={(input, option) => normalizeSearchText(option?.label).includes(normalizeSearchText(input))}
              options={vtsOptions.map((vts) => ({ value: vts.id, label: vts.code ? `${vts.code} - ${vts.systemName || ''}` : vts.systemName || vts.id }))}
              style={filterInputStyle}
            />
          </div>
          <div style={{ marginBottom: spaceFormField }}>
            <div style={{ ...filterLabelStyle, marginBottom: spaceXs }}>Đơn vị khai thác</div>
            <Select
              placeholder="Chọn đơn vị khai thác"
              allowClear
              value={filterOperatingUnitId}
              onChange={(v) => { setFilterOperatingUnitId(v); setPage(1); }}
              showSearch
              filterOption={(input, option) => normalizeSearchText(option?.label).includes(normalizeSearchText(input))}
              options={orgOptions.map((org) => ({ value: org.id, label: org.code ? `${org.code} - ${org.name}` : org.name }))}
              style={filterInputStyle}
            />
          </div>
          <div style={{ marginBottom: spaceFormField }}>
            <div style={{ ...filterLabelStyle, marginBottom: spaceXs }}>Địa điểm Tỉnh/TP</div>
            <Select
              placeholder="Chọn tỉnh/thành phố..."
              allowClear
              value={filterProvinceId}
              onChange={(v) => { setFilterProvinceId(v); setPage(1); }}
              showSearch
              filterOption={(input, option) => normalizeSearchText(option?.label).includes(normalizeSearchText(input))}
              options={VIETNAM_PROVINCE_OPTIONS}
              style={filterInputStyle}
            />
          </div>
          <div style={{ marginBottom: spaceFormField }}>
            <div style={{ ...filterLabelStyle, marginBottom: spaceXs }}>Tình trạng</div>
            <Select
              placeholder="Chọn tình trạng"
              allowClear
              value={filterConditionStatus}
              onChange={(v) => { setFilterConditionStatus(v); setPage(1); }}
              options={CONDITION_STATUS_OPTIONS}
              style={filterInputStyle}
            />
          </div>
          <div style={{ marginBottom: spaceFormField }}>
            <div style={{ ...filterLabelStyle, marginBottom: spaceXs }}>Ngày cập nhật</div>
            <DatePicker.RangePicker
              placeholder={['Từ ngày', 'Đến ngày']}
              format="DD/MM/YYYY"
              value={rangeValue(filterUpdatedFrom, filterUpdatedTo)}
              onChange={(range) => {
                setFilterUpdatedFrom(range && range[0] ? range[0].format('YYYY-MM-DD') : '');
                setFilterUpdatedTo(range && range[1] ? range[1].format('YYYY-MM-DD') : '');
                setPage(1);
              }}
              style={filterInputStyle}
            />
          </div>
          <div style={{ marginBottom: spaceFormField }}>
            <div style={{ ...filterLabelStyle, marginBottom: spaceXs }}>Cán bộ cập nhật</div>
            <Select
              placeholder="Chọn cán bộ cập nhật"
              allowClear
              showSearch
              value={filterUpdatedBy || undefined}
              onChange={(v) => { setFilterUpdatedBy(v || ''); setPage(1); }}
              options={userOptions}
              filterOption={(input, option) => normalizeSearchText(option?.label).includes(normalizeSearchText(input))}
              style={filterInputStyle}
            />
          </div>
        </>
      )}
    </>
  );

  const statusTabs = STATUS_TAB_LIST.map((tab) => ({
    key: tab.key,
    label: tab.label,
    count: tabCounts[tab.key] ?? 0,
    color: tab.color,
    active: activeTab === tab.key,
  }));

  const headerActions = useMemo(
    () =>
      hasPerm('radarstation:create') || hasPerm('admin:all')
        ? [{ key: 'create', label: 'Thêm mới', variant: 'primary' as const, icon: <PlusOutlined />, onClick: openCreateDrawer }]
        : [],
    [hasPerm, openCreateDrawer],
  );

  // ── Detail rows ─────────────────────────────────────────────────
  type DetailRow = { label: string; value: React.ReactNode };

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

  const detailBasicRows: DetailRow[] = detailRecord
    ? [
        { label: 'Mã trạm radar', value: detailRecord.code || '—' },
        { label: 'Tên trạm radar', value: detailRecord.stationName || '—' },
        { label: 'Đơn vị quản lý', value: detailRecord.orgUnitName || orgNameById(detailRecord.orgUnitId) },
        { label: 'Thuộc cảng biển', value: detailRecord.seaportName || seaportLabelById(detailRecord.seaportId) },
        { label: 'Hệ thống VTS', value: detailRecord.vtsSystemName || vtsLabelById(detailRecord.vtsSystemId) },
        { label: 'Trung tâm điều hành VTS', value: detailRecord.vtsOperationCenterName || vtsLabelById(detailRecord.vtsOperationCenterId) },
        { label: 'Đơn vị khai thác', value: orgNameById(detailRecord.operatingUnitId) },
        { label: 'Địa điểm Tỉnh/TP', value: getProvinceLabel(detailRecord.provinceId) },
        { label: 'Địa điểm chi tiết', value: detailRecord.location || '—' },
        { label: 'Đơn vị tính', value: detailRecord.unitOfMeasure || '—' },
        { label: 'Số lượng', value: detailRecord.quantity != null ? String(detailRecord.quantity) : '—' },
        {
          label: 'Tình trạng',
          value: (() => {
            const s = CONDITION_STATUS_STYLE_MAP[detailRecord.conditionStatus || ''];
            return s
              ? <span style={{ ...badgeBaseStyle, background: `${s.color}15`, color: s.color }}>{s.label}</span>
              : '—';
          })(),
        },
        { label: 'Loại trạm', value: detailRecord.stationType || '—' },
      ]
    : [];

  const detailTechnicalRows: DetailRow[] = detailRecord
    ? [
        { label: 'Chiều cao tháp radar (m)', value: detailRecord.towerHeight != null ? Number(detailRecord.towerHeight).toLocaleString('vi-VN') : '—' },
        { label: 'Tầm hiệu lực radar', value: detailRecord.radarRange != null ? String(detailRecord.radarRange) : '—' },
        { label: 'Vùng phủ sóng', value: detailRecord.coverage || '—' },
        { label: 'Diện tích phát xạ (km²)', value: detailRecord.emissionArea != null ? Number(detailRecord.emissionArea).toLocaleString('vi-VN') : '—' },
        { label: 'Nguồn gốc', value: detailRecord.source || '—' },
        { label: 'Ghi chú', value: detailRecord.note || '—' },
      ]
    : [];

  const detailLocationRows: DetailRow[] = detailRecord
    ? [
        { label: 'Hệ quy chiếu (GIS)', value: 'WGS_84' },
        { label: 'Quy tắc hiển thị (GIS)', value: 'Độ/Phút/Giây' },
        { label: 'Tọa độ (GIS) — Kinh độ', value: detailRecord.longitude != null ? Number(detailRecord.longitude).toFixed(6) : '—' },
        { label: 'Tọa độ (GIS) — Vĩ độ', value: detailRecord.latitude != null ? Number(detailRecord.latitude).toFixed(6) : '—' },
      ]
    : [];

  const renderToggleSection = (open: boolean, onToggle: () => void, title: string, rows: DetailRow[]) => (
    <div>
      <button
        type="button"
        onClick={onToggle}
        style={{ cursor: 'pointer', marginTop: 10, padding: '0 0 0 12px', background: 'none', border: 'none', display: 'block', textAlign: 'left' }}
      >
        <span style={{ color: open ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>
          {open ? '▼' : '▶'} {title}
        </span>
      </button>
      {open && renderDetailRows(rows, 4)}
    </div>
  );

  const detailLogRows: DetailRow[] = detailRecord
    ? [
        { label: 'Ngày cập nhật', value: formatDate(detailRecord.updatedAt) },
        { label: 'Cán bộ cập nhật', value: userOptions.find((u) => u.value === detailRecord.updatedBy)?.label || '—' },
        { label: 'Ngày gửi phê duyệt', value: formatDate(detailRecord.submittedForApprovalAt) },
        { label: 'Cán bộ gửi phê duyệt', value: userOptions.find((u) => u.value === detailRecord.submittedForApprovalBy)?.label || '—' },
        { label: 'Ngày phê duyệt C1', value: formatDate(detailRecord.approvedDateLevel1) },
        { label: 'Cán bộ phê duyệt C1', value: userOptions.find((u) => u.value === detailRecord.approverLevel1)?.label || '—' },
        { label: 'Ngày phê duyệt C2', value: formatDate(detailRecord.approvedDateLevel2) },
        { label: 'Cán bộ phê duyệt C2', value: userOptions.find((u) => u.value === detailRecord.approverLevel2)?.label || '—' },
        { label: 'Lý do từ chối (nếu có)', value: detailRecord.rejectionReason || '—' },
        {
          label: 'Trạng thái phê duyệt',
          value: <ApprovalStatusBadge status={detailRecord.approvalStatus || detailRecord.status || ''} />,
        },
      ]
    : [];

  const detailKchtRows: DetailRow[] = [
    { label: 'Tên kết cấu hạ tầng', value: '—' },
    { label: 'Loại kết cấu hạ tầng', value: '—' },
  ];

  const detailOperationRows: DetailRow[] = [
    { label: 'Mã kế hoạch', value: '—' },
    { label: 'Tên kế hoạch', value: '—' },
    { label: 'Ngày bắt đầu', value: '—' },
    { label: 'Ngày kết thúc', value: '—' },
  ];

  const detailMaintenanceRows: DetailRow[] = [
    { label: 'Mã kế hoạch', value: '—' },
    { label: 'Tên kế hoạch', value: '—' },
    { label: 'Thời gian bắt đầu', value: '—' },
    { label: 'Thời gian kết thúc', value: '—' },
  ];

  const detailIncidentRows: DetailRow[] = [
    { label: 'Mã sự cố', value: '—' },
    { label: 'Loại sự cố', value: '—' },
    { label: 'Địa điểm', value: '—' },
    { label: 'Thời gian', value: '—' },
  ];

  const detailTabItems = [
    {
      key: 'general',
      label: 'Thông tin cơ bản',
      children: (
        <>
          {renderDetailRows(detailBasicRows)}
          {renderToggleSection(logOpen, () => setLogOpen(!logOpen), 'Thông tin log cập nhật', detailLogRows)}
        </>
      ),
    },
    {
      key: 'technical',
      label: 'Thông tin kỹ thuật',
      children: renderDetailRows(detailTechnicalRows),
    },
    {
      key: 'location',
      label: 'Thông tin vị trí & GIS',
      children: renderDetailRows(detailLocationRows),
    },
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
          {renderToggleSection(kchtOpen, () => setKchtOpen(!kchtOpen), 'Kết cấu hạ tầng thuộc trạm radar', detailKchtRows)}
          {renderToggleSection(operationOpen, () => setOperationOpen(!operationOpen), 'Thông tin vận hành khai thác', detailOperationRows)}
          {renderToggleSection(maintenanceOpen, () => setMaintenanceOpen(!maintenanceOpen), 'Thông tin bảo trì', detailMaintenanceRows)}
          {renderToggleSection(incidentOpen, () => setIncidentOpen(!incidentOpen), 'Thông tin sự cố', detailIncidentRows)}
        </div>
      ),
    },
  ];

  function renderHistoryTimeline(records: HistoryEntry[]) {
    const q = historySearch.toLowerCase().trim();
    const fromMs = historyFrom ? dayjs(historyFrom).valueOf() : null;
    const toMs = historyTo ? dayjs(historyTo).valueOf() : null;
    const sorted = [...records].sort(
      (a, b) => new Date(b.approvedDate || 0).getTime() - new Date(a.approvedDate || 0).getTime(),
    );
    const filtered = sorted.filter((r) => {
      const hay = `${r.approvedBy || ''} ${r.reason || ''} ${r.status || ''}`.toLowerCase();
      if (q && !hay.includes(q)) return false;
      const ms = r.approvedDate ? new Date(r.approvedDate).getTime() : 0;
      if (fromMs && ms < fromMs) return false;
      if (toMs && ms > toMs) return false;
      return true;
    });
    if (filtered.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
          <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
          <div style={{ color: textTertiary, fontSize: fontSizeMd }}>
            {q || historyFrom || historyTo ? 'Không tìm thấy kết quả' : 'Chưa có thay đổi'}
          </div>
        </div>
      );
    }
    return filtered.map((r, idx) => {
      const rejected = r.status === 'REJECTED' || r.status === 'REJECTED_LEVEL1' || r.status === 'REJECTED_LEVEL2';
      const color = rejected ? statusCritical : statusOperational;
      const actionLabel = rejected ? 'Từ chối' : 'Phê duyệt';
      const level = APPROVAL_LEVEL_LABEL[String(r.approvalLevel)] || '';
      return (
        <div key={r.id || `${r.approvedDate}-${idx}`} style={historyGroupGridStyle}>
          <div>
            <div style={historyTimeStyle}>{r.approvedDate ? dayjs(r.approvedDate).format('DD/MM/YYYY HH:mm') : '—'}</div>
            <div style={{ marginTop: spaceXs }}>
              <span style={historyBadgeStyle(color)}>{actionLabel}{level ? ` ${level}` : ''}</span>
            </div>
            <Typography.Text style={{ ...historyMetaRowStyle, marginTop: spaceXs }}>
              Người duyệt: {r.approvedBy || '—'}
            </Typography.Text>
          </div>
          <div style={historyInfoCardStyle}>
            <div style={historyAccentBarStyle(color)} />
            <Typography.Text style={historyInfoTitleStyle}>Thông tin phê duyệt:</Typography.Text>
            {r.reason && r.reason !== '(null)' ? (
              <div style={{ ...historyChangeRowStyle, paddingTop: 0 }}>
                <div style={historyFieldLabelStyle}>Nội dung / Lý do:</div>
                <span title={r.reason} style={historyNewValueStyle}>{r.reason}</span>
              </div>
            ) : (
              <Typography.Text style={{ color: textTertiary, fontSize: fontSizeMd }}>Không có ghi chú</Typography.Text>
            )}
          </div>
        </div>
      );
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
      <ScreenHeader
        breadcrumb={[{ label: 'KCHT hàng hải' }, { label: 'Trạm Radar' }]}
        actions={headerActions}
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
            dataSource={tableData}
            rowKey="id"
            rowActions={rowActions}
            scroll={{ x: 'max-content', y: 400 }}
            emptyState={<EmptyState description="Không có dữ liệu trạm radar nào phù hợp với bộ lọc" />}
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
              ? `Chi tiết trạm radar${detailRecord ? ` — ${detailRecord.stationName}` : ''}`
              : editingRecord
                ? `Chỉnh sửa — ${editingRecord.stationName || editingRecord.code}`
                : 'Thêm mới trạm radar'}
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
            <Form form={createForm} layout="vertical" initialValues={{ conditionStatus: '1', quantity: 1 }}>
              <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} tabBarStyle={tabBarStyle}
                items={[
                  {
                    key: 'general',
                    label: 'Thông tin cơ bản',
                    children: (
                      <div style={{ paddingTop: 16 }}>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item {...labelProps('Mã trạm radar')} style={formFieldStyle}>
                              <Input disabled value={editingRecord ? (editingRecord.code || '') : previewCode}
                                placeholder="Mã tự sinh tự động" style={inputStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="stationName" {...labelProps('Tên trạm radar')} required style={formFieldStyle}
                              rules={[{ required: true, message: 'Vui lòng nhập tên trạm radar' }]}>
                              <Input placeholder="VD: Trạm radar Hòn Dấu" style={inputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="orgUnitId" {...labelProps('Đơn vị quản lý')} style={formFieldStyle}>
                              <OrgUnitTreeSelect
                                organizations={orgOptions}
                                placeholder="Chọn đơn vị..."
                                allowClear
                                showSearch
                                onChange={() => {
                                  createForm.setFieldValue('seaportId', undefined);
                                  createForm.setFieldValue('vtsSystemId', undefined);
                                  createForm.setFieldValue('vtsOperationCenterId', undefined);
                                }}
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
                                options={seaportOptions.map((p) => ({ value: p.id, label: p.portCode ? `${p.portCode} - ${p.portName || ''}` : p.portName || p.id }))}
                                style={selectStyle}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="vtsSystemId" {...labelProps('Hệ thống VTS')} style={formFieldStyle}>
                              <Select
                                placeholder="Chọn hệ thống VTS"
                                allowClear
                                showSearch
                                filterOption={(input, option) => normalizeSearchText(option?.label).includes(normalizeSearchText(input))}
                                onChange={() => createForm.setFieldValue('vtsOperationCenterId', undefined)}
                                options={vtsOptions.map((vts) => ({ value: vts.id, label: vts.code ? `${vts.code} - ${vts.systemName || ''}` : vts.systemName || vts.id }))}
                                style={selectStyle}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="vtsOperationCenterId" {...labelProps('Trung tâm điều hành VTS')} style={formFieldStyle}>
                              <Select
                                placeholder="Chọn trung tâm điều hành VTS"
                                allowClear
                                showSearch
                                filterOption={(input, option) => normalizeSearchText(option?.label).includes(normalizeSearchText(input))}
                                options={vtsOptions.map((vts) => ({ value: vts.id, label: vts.code ? `${vts.code} - ${vts.systemName || ''}` : vts.systemName || vts.id }))}
                                style={selectStyle}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="operatingUnitId" {...labelProps('Đơn vị khai thác')} style={formFieldStyle}>
                              <OrgUnitTreeSelect
                                organizations={orgOptions}
                                placeholder="Chọn đơn vị khai thác"
                                allowClear
                                showSearch
                                style={selectStyle}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="provinceId" {...labelProps('Địa điểm Tỉnh/TP')} style={formFieldStyle}>
                              <Select
                                placeholder="Chọn tỉnh/thành phố..."
                                allowClear
                                showSearch
                                filterOption={(input, option) => normalizeSearchText(option?.label).includes(normalizeSearchText(input))}
                                options={VIETNAM_PROVINCE_OPTIONS}
                                style={selectStyle}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="unitOfMeasure" {...labelProps('Đơn vị tính')} style={formFieldStyle}>
                              <Select placeholder="Chọn đơn vị tính" allowClear options={UNIT_OF_MEASURE_OPTIONS} style={selectStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="quantity" {...labelProps('Số lượng')} required style={formFieldStyle}
                              rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}>
                              <InputNumber min={0} max={99999} step={1} placeholder="Nhập số lượng" style={{ ...selectStyle, width: '100%' }} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="conditionStatus" {...labelProps('Tình trạng')} required style={formFieldStyle}
                              rules={[{ required: true, message: 'Vui lòng chọn tình trạng' }]}>
                              <Select placeholder="Chọn tình trạng" options={CONDITION_STATUS_OPTIONS} style={selectStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="stationType" {...labelProps('Loại trạm')} style={formFieldStyle}>
                              <Input placeholder="VD: Radar X, Radar S" style={inputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
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
                            <Form.Item name="towerHeight" {...labelProps('Chiều cao tháp radar (m)')} style={formFieldStyle}>
                              <InputNumber min={0} step={0.1} placeholder="Nhập chiều cao tháp" style={{ ...selectStyle, width: '100%' }} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="radarRange" {...labelProps('Tầm hiệu lực radar')} style={formFieldStyle}>
                              <Input placeholder="Nhập tầm hiệu lực (tối đa 20 ký tự)" maxLength={20} style={inputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="coverage" {...labelProps('Vùng phủ sóng')} style={formFieldStyle}>
                              <Input placeholder="VD: Luồng vào cảng Hải Phòng" style={inputStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="emissionArea" {...labelProps('Diện tích phát xạ (km²)')} style={formFieldStyle}>
                              <InputNumber min={0} step={0.01} placeholder="Nhập diện tích phát xạ" style={{ ...selectStyle, width: '100%' }} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="source" {...labelProps('Nguồn gốc')} style={formFieldStyle}>
                              <Input placeholder="VD: Nhập khẩu - Nhật Bản" style={inputStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="longitude" {...labelProps('Kinh độ')} style={formFieldStyle}>
                              <Input type="number" step="any" placeholder="VD: 106.7435" style={inputStyle} />
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
                            <Form.Item name="geometryType" {...labelProps('Loại đối tượng (GIS)')} style={formFieldStyle}>
                              <Select
                                placeholder="Chọn loại đối tượng"
                                allowClear
                                options={[{ value: 'POINT', label: 'Điểm' }, { value: 'LINE', label: 'Đường' }, { value: 'POLYGON', label: 'Vùng' }]}
                                style={selectStyle}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Form.Item name="location" {...labelProps('Vị trí')} required style={formFieldStyle}
                          rules={[
                            { required: true, message: 'Vui lòng nhập vị trí' },
                            { max: 500, message: 'Vị trí tối đa 500 ký tự' },
                          ]}>
                          <Input.TextArea rows={2} placeholder="Mô tả vị trí đặt trạm radar..." style={{ borderRadius: radiusPill }} />
                        </Form.Item>
                        <Form.Item name="note" {...labelProps('Ghi chú')} style={formFieldStyle}>
                          <Input.TextArea rows={3} maxLength={2000} placeholder="Nhập ghi chú (tối đa 2000 ký tự)" showCount style={{ borderRadius: radiusPill }} />
                        </Form.Item>
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
                          <Upload beforeUpload={handleBeforeUpload} showUploadList={false}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif" multiple>
                            <Button icon={<PlusOutlined />} style={{ borderRadius: radiusPill }}>Thêm file</Button>
                          </Upload>
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
      </Drawer>

      {/* ── Delete Confirmation Modal ────────────────────────────── */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Xác nhận xóa trạm radar</span>}
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
            Vui lòng nhập <strong>tên trạm radar</strong> hoặc gõ <strong>"XÓA"</strong> để xác nhận xóa.
          </p>
          {deletingRecord && (
            <p style={{ marginBottom: spaceFormField }}>
              Trạm radar: <strong style={{ color: textPrimary }}>{deletingRecord.stationName || deletingRecord.code}</strong>
            </p>
          )}
          <Input placeholder="Nhập tên trạm radar hoặc XÓA" value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)} onPressEnter={confirmDelete}
            style={inputStyle} autoFocus />
        </div>
      </Modal>

      {/* ── Submit Approval Modal ────────────────────────────────── */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Gửi duyệt trạm radar</span>}
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
            Xác nhận gửi <strong>{submittingRecord?.stationName || submittingRecord?.code || ''}</strong> để phê duyệt?
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
        onCancel={closeApproveModal}
        footer={[
          <Button key="cancel" onClick={closeApproveModal} style={outlineButtonStyle}>Hủy</Button>,
          <Button key="approve" type="primary" onClick={confirmApprove}
            style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}>
            Xác nhận phê duyệt
          </Button>,
        ]}
        width={480}
      >
        <div style={confirmModalBodyStyle}>
          <p>
            Xác nhận phê duyệt {approvingLevel === 'C1' ? 'cấp 1' : 'cấp 2 (chính thức)'} cho trạm radar <strong>{approvingRecord?.stationName || approvingRecord?.code || ''}</strong>?
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
        open={rejectModalVisible}
        onCancel={() => { setRejectModalVisible(false); setRejectTarget(null); setRejectReason(''); }}
        footer={[
          <Button key="cancel" onClick={() => { setRejectModalVisible(false); setRejectTarget(null); setRejectReason(''); }}
            style={outlineButtonStyle}>Hủy</Button>,
          <Button key="reject" type="primary" danger onClick={confirmReject} style={dangerButtonStyle}>Xác nhận từ chối</Button>,
        ]}
        width={480}
      >
        <div style={confirmModalBodyStyle}>
          <p style={{ marginBottom: spaceFormField }}>
            Vui lòng nhập lý do từ chối cho <strong>{rejectTarget?.stationName || rejectTarget?.code || ''}</strong>:
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
            <strong>Trạm radar:</strong> {historyTarget.code} — {historyTarget.stationName}
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

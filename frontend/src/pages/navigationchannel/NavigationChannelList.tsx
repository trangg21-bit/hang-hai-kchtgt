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
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import {
  navigationChannelCRUD,
  navigationChannelApproval,
} from '../../services/navigationChannelService';
import type {
  NavigationChannelResponse,
  CreateNavigationChannelRequest,
  UpdateNavigationChannelRequest,
} from '../../types/navigationChannel';
import {
  CONDITION_STATUS_OPTIONS,
  CONDITION_STATUS_MAP,
} from '../../types/navigationChannel';
import { organizationService } from '../../services/organizationService';
import { portCRUD } from '../../services/portService';
import { ScreenHeader, DataTable, FilterTableLayout } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import toast from '../../components/ToastNotification';
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
  radiusPill,
  spaceXs,
  spaceSm,
  spaceMd,
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
  historyFieldLabelStyle,
  historyNewValueStyle,
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
  const coords = validPts.map((p) => `${p.lng.toFixed(6)} ${p.lat.toFixed(6)}`).join(', ');
  return `LINESTRING(${coords})`;
}

function parseWktToVertices(wkt: string): { lng: number; lat: number }[] {
  if (!wkt) return [];
  try {
    if (wkt.startsWith('LINESTRING(')) {
      const match = wkt.match(/LINESTRING\(([^)]+)\)/);
      if (match) {
        return match[1].split(',').map((pt) => {
          const parts = pt.trim().split(' ');
          return { lng: parseFloat(parts[0]), lat: parseFloat(parts[1]) };
        });
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

export default function NavigationChannelList() {
  const hasPerm = usePermissionStore((s: any) => s.hasPermission);
  const currentUserId = useAuthStore((s: any) => s.user?.id || s.user?.userId);

  // ── Filter state ─────────────────────────────────────────────────
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterOrgUnitId, setFilterOrgUnitId] = useState<string | undefined>();
  const [filterSeaportId, setFilterSeaportId] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<number | undefined>();
  const [filterUpdatedRange, setFilterUpdatedRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('');

  // ── Pagination ──────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // ── Data ─────────────────────────────────────────────────────────
  const [dataSource, setDataSource] = useState<NavigationChannelResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  // ── Organizations + Seaports + Symbols ───────────────────────────
  const [organizations, setOrganizations] = useState<OrgUnitTreeOption[]>([]);
  const [seaports, setSeaports] = useState<{ id: string; portName?: string; portCode?: string }[]>([]);
  const [symbols, setSymbols] = useState<MapSymbol[]>([]);
  const [gpsCoordList, setGpsCoordList] = useState<Array<{ lat: number; lng: number }>>([]);

  const ddToDms = (dd: number): { d: number; m: number; s: number } => {
    if (dd == null || isNaN(dd)) return { d: 0, m: 0, s: 0 };
    const abs = Math.abs(dd);
    const d = Math.floor(abs);
    const m = Math.floor((abs - d) * 60);
    const s = parseFloat(((abs - d - m / 60) * 3600).toFixed(2));
    return { d, m, s };
  };

  // ── Drawer state ─────────────────────────────────────────────────
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<NavigationChannelResponse | null>(null);
  const [detailRecord, setDetailRecord] = useState<NavigationChannelResponse | null>(null);
  const [isDetailMode, setIsDetailMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [activeTabKey, setActiveTabKey] = useState('general');

  // ── Delete state ─────────────────────────────────────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<NavigationChannelResponse | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // ── Approval state ──────────────────────────────────────────────
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submittingRecord, setSubmittingRecord] = useState<NavigationChannelResponse | null>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvingRecord, setApprovingRecord] = useState<NavigationChannelResponse | null>(null);
  const [approvingLevel, setApprovingLevel] = useState<'C1' | 'C2'>('C1');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRecord, setRejectingRecord] = useState<NavigationChannelResponse | null>(null);
  const [rejectingLevel, setRejectingLevel] = useState<'C1' | 'C2'>('C1');
  const [rejectReason, setRejectReason] = useState('');

  // ── History state ────────────────────────────────────────────────
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<NavigationChannelResponse | null>(null);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ── Init: options ────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const tree = await organizationService.getTree();
        setOrganizations(tree || []);
      } catch (err) {
        console.error('Failed to load org tree', err);
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
      const res = await navigationChannelCRUD.searchPaged({
        page,
        size: pageSize,
        keyword: filterKeyword.trim() || undefined,
        orgUnitId: filterOrgUnitId,
        seaportId: filterSeaportId,
        status: filterStatus,
        approvalStatus: TAB_QUERY_MAP[activeTab],
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
  }, [page, pageSize, filterKeyword, filterOrgUnitId, filterSeaportId, filterStatus, filterUpdatedRange, activeTab]);

  const fetchTabCounts = useCallback(async () => {
    try {
      const counts = await navigationChannelCRUD.getTabCounts(
        filterOrgUnitId,
        filterKeyword.trim() || undefined,
        filterStatus
      );
      setTabCounts(counts || {});
    } catch {
      /* silent */
    }
  }, [filterOrgUnitId, filterKeyword, filterStatus]);

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
    setFilterKeyword('');
    setFilterOrgUnitId(undefined);
    setFilterSeaportId(undefined);
    setFilterStatus(undefined);
    setFilterUpdatedRange(null);
    setActiveTab('');
    setPage(1);
  };

  // ── Drawer handlers ──────────────────────────────────────────────
  const openCreateDrawer = useCallback(() => {
    setEditingRecord(null);
    setDetailRecord(null);
    setIsDetailMode(false);
    form.resetFields();
    form.setFieldsValue({ status: 1, geometryType: 'LINE' });
    setGpsCoordList([]);
    setActiveTabKey('general');
    setDrawerVisible(true);
    navigationChannelCRUD.generateCode()
      .then((res) => {
        if (res.code) form.setFieldsValue({ channelCode: res.code });
      })
      .catch(() => {});
  }, [form]);

  const openEditDrawer = useCallback((record: NavigationChannelResponse) => {
    setEditingRecord(record);
    setDetailRecord(null);
    setIsDetailMode(false);
    form.setFieldsValue({
      channelName: record.channelName,
      channelCode: record.channelCode,
      stationAmountt: record.stationAmountt,
      latestStationRepairDate: record.latestStationRepairDate ? dayjs(record.latestStationRepairDate) : null,
      seaportId: record.seaportId,
      operatingUnitId: record.operatingUnitId,
      location: record.location,
      detailedLocation: record.detailedLocation,
      channelManagementStation: record.channelManagementStation,
      stationStaffAmount: record.stationStaffAmount,
      latestMaintenanceYear: record.latestMaintenanceYear,
      dredgingVolume: record.dredgingVolume,
      buoyAmount: record.buoyAmount,
      beaconAmount: record.beaconAmount,
      status: record.status ?? 1,
      clearanceHeight: record.clearanceHeight,
      stationArea: record.stationArea,
      note: record.note,
      orgUnitId: record.orgUnitId,
      geometryType: record.geometryType || 'LINE',
      symbolId: record.symbolId,
      registeredArea: record.registeredArea,
      operatingHours: record.operatingHours,
      recordedDate: record.recordedDate ? dayjs(record.recordedDate) : null,
      quantity: record.quantity,
      loadCapacity: record.loadCapacity,
    });
    setGpsCoordList(parseWktToVertices(record.coordinates || ''));
    setActiveTabKey('general');
    setDrawerVisible(true);
  }, [form]);

  const openDetailDrawer = useCallback(async (record: NavigationChannelResponse) => {
    setDetailRecord(record);
    setEditingRecord(null);
    setIsDetailMode(true);
    setActiveTabKey('basic');
    setDrawerVisible(true);
    try {
      const detail = await navigationChannelCRUD.getById(record.id);
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
  };

  // ── Form Submit ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const coordinates = serializeVerticesToWkt(gpsCoordList, values.geometryType || 'LINE');
      const payload: CreateNavigationChannelRequest = {
        channelName: values.channelName,
        channelCode: values.channelCode,
        stationAmountt: values.stationAmountt,
        latestStationRepairDate: values.latestStationRepairDate ? values.latestStationRepairDate.format('YYYY-MM-DD') : undefined,
        seaportId: values.seaportId,
        operatingUnitId: values.operatingUnitId,
        location: values.location,
        detailedLocation: values.detailedLocation,
        channelManagementStation: values.channelManagementStation,
        stationStaffAmount: values.stationStaffAmount,
        latestMaintenanceYear: values.latestMaintenanceYear,
        dredgingVolume: values.dredgingVolume,
        buoyAmount: values.buoyAmount,
        beaconAmount: values.beaconAmount,
        status: values.status,
        clearanceHeight: values.clearanceHeight,
        stationArea: values.stationArea,
        note: values.note,
        orgUnitId: values.orgUnitId,
        geometryType: values.geometryType,
        coordinates,
        symbolId: values.symbolId,
        registeredArea: values.registeredArea,
        operatingHours: values.operatingHours,
        recordedDate: values.recordedDate ? values.recordedDate.format('YYYY-MM-DD') : undefined,
        quantity: values.quantity,
        loadCapacity: values.loadCapacity,
      };

      if (editingRecord) {
        await navigationChannelCRUD.update(editingRecord.id, payload as UpdateNavigationChannelRequest);
        toast.success('Cập nhật luồng hàng hải thành công');
      } else {
        await navigationChannelCRUD.create(payload);
        toast.success('Tạo mới luồng hàng hải (Lưu tạm) thành công');
      }

      setDrawerVisible(false);
      setEditingRecord(null);
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
  const openDeleteModal = useCallback((record: NavigationChannelResponse) => {
    setDeletingRecord(record);
    setDeleteConfirmText('');
    setDeleteModalOpen(true);
  }, []);

  const confirmDelete = async () => {
    if (!deletingRecord) return;
    const expected = (deletingRecord.channelName || deletingRecord.channelCode || '').trim().toLowerCase();
    const input = deleteConfirmText.trim().toLowerCase();
    if (input !== 'xóa' && input !== expected) {
      toast.error('Vui lòng nhập đúng tên luồng hoặc gõ XÓA để xác nhận');
      return;
    }
    try {
      await navigationChannelCRUD.delete(deletingRecord.id);
      toast.success('Xóa luồng hàng hải thành công');
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
  const openSubmitModal = useCallback((record: NavigationChannelResponse) => {
    setSubmittingRecord(record);
    setSubmitModalOpen(true);
  }, []);

  const confirmSubmit = async () => {
    if (!submittingRecord) return;
    try {
      await navigationChannelApproval.submitForApproval(submittingRecord.id);
      toast.success('Đã gửi phê duyệt luồng hàng hải');
      setSubmitModalOpen(false);
      setSubmittingRecord(null);
      void fetchData();
      void fetchTabCounts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gửi duyệt thất bại');
    }
  };

  // ── Approve C1 / C2 ─────────────────────────────────────────────
  const openApproveModal = useCallback((record: NavigationChannelResponse, level: 'C1' | 'C2') => {
    setApprovingRecord(record);
    setApprovingLevel(level);
    setApproveModalOpen(true);
  }, []);

  const confirmApprove = async () => {
    if (!approvingRecord) return;
    try {
      if (approvingLevel === 'C1') {
        await navigationChannelApproval.approveLevel1(approvingRecord.id);
        toast.success('Chi cục / Cảng vụ phê duyệt C1 thành công');
      } else {
        await navigationChannelApproval.approveLevel2(approvingRecord.id);
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
  const openRejectModal = useCallback((record: NavigationChannelResponse, level: 'C1' | 'C2') => {
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
        await navigationChannelApproval.rejectLevel1(rejectingRecord.id, rejectReason.trim());
        toast.success('Đã từ chối C1 luồng hàng hải');
      } else {
        await navigationChannelApproval.rejectLevel2(rejectingRecord.id, rejectReason.trim());
        toast.success('Đã từ chối C2 luồng hàng hải');
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
  const openHistoryModal = useCallback(async (record: NavigationChannelResponse) => {
    setHistoryTarget(record);
    setHistoryRecords([]);
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const hist = await navigationChannelApproval.getHistory(record.id);
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
      key: 'channelCode',
      label: 'Mã luồng',
      dataIndex: 'channelCode',
      width: 150,
      fixed: 'left' as const,
      render: (val: string) => <span style={{ color: textPrimary, fontWeight: fontWeightMedium }}>{val || '—'}</span>,
    },
    {
      key: 'channelName',
      label: 'Tên tuyến luồng',
      dataIndex: 'channelName',
      width: 250,
      ellipsis: false,
      render: (val: string, record: NavigationChannelResponse) => (
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
      render: (val: string | undefined, record: NavigationChannelResponse) => val || record.orgUnitId || '—',
    },
    {
      key: 'seaportName',
      label: 'Thuộc cảng biển',
      dataIndex: 'seaportName',
      width: 180,
      ellipsis: false,
      render: (val: string | undefined, record: NavigationChannelResponse) => val || record.seaportId || '—',
    },
    {
      key: 'location',
      label: 'Vị trí địa lý',
      dataIndex: 'location',
      width: 160,
      render: (val: string) => val || '—',
    },
    {
      key: 'status',
      label: 'Tình trạng',
      dataIndex: 'status',
      width: 160,
      align: 'center' as const,
      render: (val: number) => {
        const st = CONDITION_STATUS_MAP[String(val ?? 1)];
        const color = val === 1 ? statusOperational : val === 0 ? statusCritical : statusAttention;
        return <span style={{ ...historyBadgeStyle(color), minWidth: 125, justifyContent: 'center' }}>{st?.label || 'Đang khai thác'}</span>;
      },
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

  const rowActions = useCallback((record: NavigationChannelResponse) => {
    const actions: any[] = [];
    const canRead = hasPerm('navigationchannel:read') || hasPerm('admin:all');
    const canUpdate = hasPerm('navigationchannel:update') || hasPerm('admin:all');
    const canDelete = hasPerm('navigationchannel:delete') || hasPerm('admin:all');
    const canApproveC1 = hasPerm('navigationchannel:approvec1') || hasPerm('admin:all');
    const canApproveC2 = hasPerm('navigationchannel:approvec2') || hasPerm('admin:all');

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

  // ── Filter sidebar ───────────────────────────────────────────────
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
          value={filterOrgUnitId}
          onChange={(val) => {
            setFilterOrgUnitId(val || undefined);
            setFilterSeaportId(undefined);
            setPage(1);
          }}
          style={filterInputStyle}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spaceXs }}>
        <span style={filterLabelStyle}>Tên tuyến luồng</span>
        <Input
          placeholder="Nhập tên tuyến luồng..."
          allowClear
          value={filterKeyword}
          onChange={(e) => { setFilterKeyword(e.target.value); setPage(1); }}
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
              onChange={(val) => { setFilterSeaportId(val); setPage(1); }}
              allowClear
              showSearch
              filterOption={(input, option) => normalizeSearchText(option?.label).includes(normalizeSearchText(input))}
              style={selectStyle}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spaceXs }}>
            <span style={filterLabelStyle}>Tình trạng</span>
            <Select
              placeholder="Chọn tình trạng..."
              options={CONDITION_STATUS_OPTIONS}
              value={filterStatus}
              onChange={(val) => { setFilterStatus(val); setPage(1); }}
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

  const detailBasicRows: DetailRow[] = detailRecord ? [
    { label: 'Mã luồng', value: detailRecord.channelCode ?? '—' },
    { label: 'Tên tuyến luồng', value: detailRecord.channelName ?? '—' },
    { label: 'Đơn vị quản lý', value: detailRecord.orgUnitName || detailRecord.orgUnitId || '—' },
    { label: 'Thuộc cảng biển', value: detailRecord.seaportName || detailRecord.seaportId || '—' },
    { label: 'Đơn vị vận hành', value: detailRecord.operatingUnitName || detailRecord.operatingUnitId || '—' },
    { label: 'Vị trí địa lý', value: detailRecord.location ?? '—' },
    { label: 'Địa điểm chi tiết', value: detailRecord.detailedLocation ?? '—' },
    { label: 'Trạm quản lý luồng', value: detailRecord.channelManagementStation ?? '—' },
    { label: 'Tình trạng', value: CONDITION_STATUS_MAP[String(detailRecord.status ?? 1)]?.label || 'Đang khai thác' },
    { label: 'Ghi chú', value: detailRecord.note ?? '—' },
  ] : [];

  const detailTechnicalRows: DetailRow[] = detailRecord ? [
    { label: 'Số lượng trạm quản lý', value: detailRecord.stationAmountt != null ? String(detailRecord.stationAmountt) : '—' },
    { label: 'Diện tích trạm (m²)', value: detailRecord.stationArea != null ? Number(detailRecord.stationArea).toLocaleString('vi-VN') : '—' },
    { label: 'Số lượng cán bộ trạm', value: detailRecord.stationStaffAmount != null ? String(detailRecord.stationStaffAmount) : '—' },
    { label: 'Khối lượng nạo vét (m³)', value: detailRecord.dredgingVolume != null ? Number(detailRecord.dredgingVolume).toLocaleString('vi-VN') : '—' },
    { label: 'Chiều cao tĩnh không (m)', value: detailRecord.clearanceHeight ?? '—' },
    { label: 'Số lượng phao', value: detailRecord.buoyAmount != null ? String(detailRecord.buoyAmount) : '—' },
    { label: 'Số lượng báo hiệu/tiêu', value: detailRecord.beaconAmount != null ? String(detailRecord.beaconAmount) : '—' },
    { label: 'Tải trọng thiết kế', value: detailRecord.loadCapacity ?? '—' },
    { label: 'Thời gian hoạt động', value: detailRecord.operatingHours ?? '—' },
  ] : [];

  const detailTabItems = detailRecord
    ? [
        { key: 'basic', label: 'Thông tin cơ bản', children: renderDetailRows(detailBasicRows) },
        { key: 'technical', label: 'Thông số kỹ thuật', children: renderDetailRows(detailTechnicalRows) },
        {
          key: 'gis',
          label: 'Tọa độ GIS',
          children: (
            <div style={{ padding: '12px 12px' }}>
              <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tọa độ GPS tuyến luồng</span>
              {(() => {
                const pts = detailRecord ? parseWktToVertices(detailRecord.coordinates || '') : [];
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
          ),
        },
      ]
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
      <ScreenHeader
        breadcrumb={[{ label: 'Quản lý KCHTGT' }, { label: 'Tuyến luồng hàng hải' }]}
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
            emptyState={<EmptyState description="Không có dữ liệu tuyến luồng nào phù hợp với bộ lọc" />}
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
              ? `Chi tiết tuyến luồng${detailRecord ? ` — ${detailRecord.channelName}` : ''}`
              : editingRecord
                ? `Chỉnh sửa — ${editingRecord.channelName || editingRecord.channelCode}`
                : 'Thêm mới tuyến luồng hàng hải'}
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
            <Form form={form} layout="vertical" initialValues={{ status: 1, geometryType: 'LINE' }}>
              <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} tabBarStyle={tabBarStyle}
                items={[
                  {
                    key: 'general',
                    label: 'Thông tin chung',
                    children: (
                      <div style={{ paddingTop: 16 }}>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="channelCode" {...labelProps('Mã luồng')} style={formFieldStyle}>
                              <Input disabled placeholder="Mã tự sinh tự động" style={inputStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="channelName" {...labelProps('Tên tuyến luồng')} required style={formFieldStyle}
                              rules={[{ required: true, message: 'Vui lòng nhập tên tuyến luồng' }]}>
                              <Input placeholder="VD: Tuyến luồng Hòn Gai - Cái Lân" style={inputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="orgUnitId" {...labelProps('Đơn vị quản lý')} required style={formFieldStyle}
                              rules={[{ required: true, message: 'Vui lòng chọn đơn vị quản lý' }]}>
                              <OrgUnitTreeSelect
                                organizations={organizations}
                                placeholder="Chọn đơn vị..."
                                allowClear
                                showSearch
                                onChange={() => form.setFieldValue('seaportId', undefined)}
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
                            <Form.Item name="status" {...labelProps('Tình trạng')} required style={formFieldStyle}
                              rules={[{ required: true, message: 'Vui lòng chọn tình trạng' }]}>
                              <Select placeholder="Chọn tình trạng" options={CONDITION_STATUS_OPTIONS} style={selectStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="location" {...labelProps('Vị trí địa lý')} style={formFieldStyle}>
                              <Input placeholder="VD: Hải Phòng - Quảng Ninh" style={inputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Form.Item name="detailedLocation" {...labelProps('Địa điểm chi tiết')} style={formFieldStyle}>
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
                    label: 'Thông số kỹ thuật',
                    children: (
                      <div style={{ paddingTop: 16 }}>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="stationAmountt" {...labelProps('Số lượng trạm')} style={formFieldStyle}>
                              <InputNumber min={0} placeholder="Nhập số lượng trạm" style={{ ...selectStyle, width: '100%' }} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="stationArea" {...labelProps('Diện tích trạm (m²)')} style={formFieldStyle}>
                              <InputNumber min={0} step={0.1} placeholder="Nhập diện tích" style={{ ...selectStyle, width: '100%' }} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="dredgingVolume" {...labelProps('Khối lượng nạo vét (m³)')} style={formFieldStyle}>
                              <InputNumber min={0} step={1} placeholder="Nhập khối lượng" style={{ ...selectStyle, width: '100%' }} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="clearanceHeight" {...labelProps('Chiều cao tĩnh không (m)')} style={formFieldStyle}>
                              <Input placeholder="VD: 55m" style={inputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="buoyAmount" {...labelProps('Số lượng phao')} style={formFieldStyle}>
                              <InputNumber min={0} placeholder="Số phao" style={{ ...selectStyle, width: '100%' }} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="beaconAmount" {...labelProps('Số lượng tiêu/báo hiệu')} style={formFieldStyle}>
                              <InputNumber min={0} placeholder="Số tiêu" style={{ ...selectStyle, width: '100%' }} />
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

      {/* ── Delete Modal ─────────────────────────────────────────── */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Xác nhận xóa tuyến luồng</span>}
        open={deleteModalOpen}
        onCancel={() => { setDeleteModalOpen(false); setDeletingRecord(null); setDeleteConfirmText(''); }}
        footer={[
          <Button key="cancel" onClick={() => { setDeleteModalOpen(false); setDeletingRecord(null); setDeleteConfirmText(''); }} style={outlineButtonStyle}>Hủy</Button>,
          <Button key="delete" type="primary" danger onClick={confirmDelete} style={dangerButtonStyle}>Xác nhận xóa</Button>,
        ]}
        width={480}
      >
        <div style={confirmModalBodyStyle}>
          <p style={{ marginBottom: spaceFormField }}>
            Vui lòng nhập <strong>tên tuyến luồng</strong> hoặc gõ <strong>"XÓA"</strong> để xác nhận xóa.
          </p>
          {deletingRecord && (
            <p style={{ marginBottom: spaceFormField }}>
              Tuyến luồng: <strong style={{ color: textPrimary }}>{deletingRecord.channelName || deletingRecord.channelCode}</strong>
            </p>
          )}
          <Input placeholder="Nhập tên tuyến luồng hoặc XÓA" value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)} onPressEnter={confirmDelete}
            style={inputStyle} autoFocus />
        </div>
      </Modal>

      {/* ── Submit Approval Modal ────────────────────────────────── */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Gửi duyệt tuyến luồng</span>}
        open={submitModalOpen}
        onCancel={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }}
        footer={[
          <Button key="cancel" onClick={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }} style={outlineButtonStyle}>Hủy</Button>,
          <Button key="submit" type="primary" onClick={confirmSubmit} style={primaryButtonStyle}>Gửi duyệt</Button>,
        ]}
        width={480}
      >
        <div style={confirmModalBodyStyle}>
          <p>
            Xác nhận gửi <strong>{submittingRecord?.channelName || submittingRecord?.channelCode || ''}</strong> để phê duyệt?
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
            Xác nhận phê duyệt {approvingLevel === 'C1' ? 'cấp 1' : 'cấp 2 (chính thức)'} cho tuyến luồng <strong>{approvingRecord?.channelName || approvingRecord?.channelCode || ''}</strong>?
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
          <Button key="cancel" onClick={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); }} style={outlineButtonStyle}>Hủy</Button>,
          <Button key="reject" type="primary" danger onClick={confirmReject} style={dangerButtonStyle}>Xác nhận từ chối</Button>,
        ]}
        width={480}
      >
        <div style={confirmModalBodyStyle}>
          <p style={{ marginBottom: spaceFormField }}>
            Vui lòng nhập lý do từ chối cho <strong>{rejectingRecord?.channelName || rejectingRecord?.channelCode || ''}</strong>:
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
            <strong>Tuyến luồng:</strong> {historyTarget.channelCode} — {historyTarget.channelName}
          </p>
        )}
        <div style={{ maxHeight: 500, overflowY: 'auto', marginTop: spaceFormField }}>
          {historyLoading ? (
            <LoadingSkeleton rows={5} />
          ) : historyRecords.length === 0 ? (
            <Typography.Text style={{ color: textTertiary, fontSize: fontSizeMd }}>Không có lịch sử thay đổi</Typography.Text>
          ) : (
            historyRecords.map((h: any, idx: number) => {
              const isReject = h.status === 'REJECTED';
              const isApprove = h.status === 'APPROVED';
              const badgeColor = isReject ? statusCritical : isApprove ? statusOperational : actionPrimary;
              return (
                <div key={h.id || idx} style={{ ...historyInfoCardStyle, marginBottom: spaceMd }}>
                  <div style={historyAccentBarStyle(badgeColor)} />
                  <div style={{ padding: spaceMd }}>
                    <div style={historyMetaRowStyle}>
                      <span style={historyBadgeStyle(badgeColor)}>{isReject ? 'Từ chối' : isApprove ? 'Phê duyệt' : (h.status || 'Thay đổi')}</span>
                      <span style={{ marginLeft: 'auto', color: textTertiary, fontSize: fontSizeSm }}>{formatDate(h.approvedDate || h.createdAt)}</span>
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
            })
          )}
        </div>
      </Modal>
    </div>
  );
}

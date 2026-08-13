import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { PERMISSIONS } from '../../constants/permissions';
import {
  Alert,
  Button,
  Space,
  Tag,
  Card,
  Row,
  Col,
  Input,
  Select,
  Tooltip,
  Spin,
  Modal,
  Form,
  InputNumber,
  Typography,
  Descriptions,
  Divider,
  Tabs,
  Upload,
  DatePicker,
  Radio,
  message,
  Drawer,
  Table,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SendOutlined,
  EyeOutlined,
  HistoryOutlined,
  ClockCircleOutlined,
  ClockCircleFilled,
  HourglassOutlined,
  ArrowRightOutlined,
  UploadOutlined,
  DownloadOutlined,
ExclamationCircleOutlined,
DownOutlined,
UpOutlined,
FileOutlined,
SearchOutlined,
FilterOutlined,
ReloadOutlined,
CompassOutlined,
EnvironmentOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  fetchCangBienList,
  deleteCangBien,
  approveCangBien,
  rejectCangBien,
  fetchCangBienById,
  updateCangBien,
} from './api';
import { trangThaiHoatDongBadge, trangThaiPheDuyetBadge, TRANG_THAI_HOAT_DONG_OPTIONS } from './schema';
import type { CangBienResponse } from './types';
import toast from '../../components/ToastNotification';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import { organizationService } from '../../services/organizationService';
import { documentApi } from '../../app/document/api';
import DocumentUploadModal from '../../app/document/DocumentUploadModal';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import api from '../../services/api';
import dayjs from 'dayjs';
import { symbolService } from '../symbolService';
import type { Symbol } from '../symbolService';
import { VIETNAM_PROVINCES } from '../../types/common';
import { ScreenHeader, StatusTabs, DataTable } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import PortFormContent from './PortFormContent';
import PortDetailContent from './PortDetailContent';
import {
  statusDraft,
  statusOperational,
  statusCritical,
  statusAttention,
  actionPrimary,
  textPrimary,
  textSecondary,
  textTertiary,
  borderDefault,
  spaceMd,
  spaceSm,
  fontSizeSm,
  fontSizeMd,
  fontSizeLg,
  fontSizeXl,
  fontWeightMedium,
  fontWeightBold,
  fontWeightNormal,
  cardStyle,
  spaceFormField,
  radiusPill,
  radiusSm,
  radiusMd,
  radiusLg,
  spaceXs,
  spaceLg,
  spaceXl,
  shadowSm,
  surfaceCard,
  surfacePage,
  dataSea1,
  metaStyle,
  drawerProps, drawerTitleStyle, drawerCloseBtnStyle, drawerFooterStyle,
  primaryButtonStyle, outlineButtonStyle, requiredMarkStyle,
  uploadAreaStyle, uploadHintStyle, uploadFileItemStyle,
} from '../../tokens';
import { usePermissionStore } from '../../store/permissionStore';
import { colors } from '../../theme';

const { confirm } = Modal;

// ── Helper: format date ─────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

// ── DMS conversion helpers ────────────────────────────────────────

function toDMS(dd: number): { d: number; m: number; s: number } {
  const abs = Math.abs(dd);
  const d = Math.floor(abs);
  const m = Math.floor((abs - d) * 60);
  const s = parseFloat(((abs - d - m / 60) * 3600).toFixed(2));
  return { d, m, s };
}

function fromDMS(d: number, m: number, s: number): number {
  return (d < 0 ? -1 : 1) * (Math.abs(d) + m / 60 + s / 3600);
}

function parseWktCoords(wkt: string): Array<{ lat: number; lng: number }> {
  if (!wkt) return [];
  const multi = wkt.match(/MULTIPOINT\s*\(([^)]+(?:\),[^)]+)*)\)/);
  if (multi) {
    return multi[1].split('),(').map(pt => {
      const [lng, lat] = pt.replace(/[()]/g, '').trim().split(/\s+/).map(Number);
      return { lat, lng };
    });
  }
  const point = wkt.match(/POINT\s*\(([-\d.]+)\s+([-\d.]+)\)/);
  if (point) return [{ lng: Number(point[1]), lat: Number(point[2]) }];
  return [];
}

// ── List Page ───────────────────────────────────────────────────────

export const translateFieldName = (fieldName: string): string => {
  const map: Record<string, string> = {
    // Port (Cảng biển)
    portCode: 'Mã cảng biển',
    portName: 'Tên cảng biển',
    province: 'Tỉnh/Thành phố',
    area: 'Diện tích (km²)',
    maxVesselCapacity: 'Khả năng tiếp nhận tàu',
    khaNangTiepNhan: 'Khả năng tiếp nhận tàu',
    portGroup: 'Nhóm cảng biển',
    portClass: 'Phân cấp cảng biển',
    detailedLocation: 'Địa điểm chi tiết',
    coordinateSystem: 'Hệ quy chiếu tọa độ',
    displayRule: 'Quy tắc hiển thị',
    waterAreaScope: 'Phạm vi vùng nước',
    totalBerths: 'Tổng số bến cảng',
    totalAnchoragesTransshipment: 'Tổng số khu neo đậu/chuyển tải',
    totalPublicChannels: 'Tổng số tuyến luồng công cộng',
    totalDedicatedChannels: 'Tổng số tuyến luồng chuyên dùng',
    totalPublicChannelLength: 'Tổng chiều dài luồng công cộng (km)',
    totalDedicatedChannelLength: 'Tổng chiều dài luồng chuyên dùng (km)',
    totalBuoysBeacons: 'Tổng số phao tiêu/báo hiệu',
    totalDikes: 'Tổng số đê kè',
    totalDikeLength: 'Tổng chiều dài đê kè (km)',
    totalLighthouses: 'Tổng số đèn biển/đăng tiêu',
    buoyBerthCount: 'Số lượng bến phao',
    anchorageCount: 'Số lượng khu neo đậu',
    transshipmentCount: 'Số lượng khu chuyển tải',
    otherWaterAreas: 'Các khu nước khác',
    remarks: 'Ghi chú',
    mapSymbolId: 'Biểu tượng bản đồ',
    geometryType: 'Loại hình học',
    // Berth (Bến cảng)
    berthCode: 'Mã bến cảng',
    berthName: 'Tên bến cảng',
    portId: 'Cảng biển chủ',
    waterway: 'Tuyến đường thủy',
    tuyenDuongThuy: 'Tuyến đường thủy',
    berthType: 'Loại bến',
    channelDepth: 'Độ sâu luồng (m)',
    doSauLuong: 'Độ sâu luồng (m)',
    operator: 'Đơn vị vận hành',
    operationalFunction: 'Công năng khai thác',
    totalArea: 'Tổng diện tích (ha)',
    designThroughput: 'Năng lực thiết kế',
    currentThroughput: 'Năng lực hiện tại',
    maxVesselSize: 'Cỡ tàu tối đa (DWT)',
    plannedThroughput: 'Năng lực quy hoạch',
    latestCargoVolume: 'Sản lượng hàng hóa gần nhất',
    openingAnnouncementDate: 'Ngày công bố mở',
    openingDecision: 'Quyết định mở',
    investmentAgreement: 'Thỏa thuận đầu tư',
    structureType: 'Loại kết cấu',
    provinceId: 'Mã tỉnh/thành',
    activityStatus: 'Trạng thái hoạt động',
    // Pier (Cầu cảng)
    pierCode: 'Mã cầu cảng',
    pierName: 'Tên cầu cảng',
    berthId: 'Bến cảng chủ',
    pierType: 'Loại cầu',
    loaiCau: 'Loại cầu',
    designLoad: 'Tải trọng thiết kế (tấn)',
    taiTrong: 'Tải trọng (tấn)',
    // DryPort (Cảng cạn)
    dryPortCode: 'Mã cảng cạn',
    dryPortName: 'Tên cảng cạn',
    viTri: 'Vị trí',
    dienTichDat: 'Diện tích đất (ha)',
    dienTichNuoc: 'Diện tích nước (ha)',
    nangLucThongQua: 'Năng lực thông qua',
    // WaterZone (Vùng nước)
    waterZoneCode: 'Mã vùng nước',
    waterZoneName: 'Tên vùng nước',
    viTriVungNuoc: 'Vị trí vùng nước',
    chieuDaiVungNuoc: 'Chiều dài vùng nước (m)',
    chieuRongVungNuoc: 'Chiều rộng vùng nước (m)',
    doSauVungNuoc: 'Độ sâu vùng nước (m)',
    // Common
    width: 'Chiều rộng (m)',
    length: 'Chiều dài (m)',
    operationalStatus: 'Trạng thái hoạt động',
    approvalStatus: 'Trạng thái phê duyệt',
    orgUnitId: 'Đơn vị quản lý',
    operationalCapacity: 'Công năng khai thác',
    bieuTuongId: 'Biểu tượng bản đồ',
    iconId: 'Biểu tượng bản đồ',
    lineSymbolId: 'Ký hiệu đường',
    fillSymbolId: 'Ký hiệu vùng',
    khongGianId: 'Vị trí không gian',
    spatialId: 'Vị trí không gian',
    // GIS
    constructionGrade: 'Phân cấp công trình',
    conditionStatus: 'Tình trạng',
    navigationChannelId: 'Thuộc luồng hàng hải',
    // Collections (fallback label)
    infrastructureList: 'Danh sách hạ tầng',
    attachments: 'File đính kèm',
    attachmentList: 'File đính kèm',
  };
  return map[fieldName] || fieldName;
};

const historyFieldLabels: Record<string, string> = {
  portCode: 'Mã cảng biển', portName: 'Tên cảng biển', province: 'Tỉnh/Thành phố',
  area: 'Diện tích (km²)', maxVesselCapacity: 'Khả năng tiếp nhận tàu',
  portGroup: 'Nhóm cảng biển', portClass: 'Phân cấp cảng biển',
  detailedLocation: 'Địa điểm chi tiết', coordinateSystem: 'Hệ quy chiếu tọa độ',
  displayRule: 'Quy tắc hiển thị', waterAreaScope: 'Phạm vi vùng nước',
  totalBerths: 'Tổng số bến cảng', totalAnchoragesTransshipment: 'Tổng số khu neo đậu/chuyển tải',
  totalPublicChannels: 'Tổng số tuyến luồng công cộng', totalDedicatedChannels: 'Tổng số tuyến luồng chuyên dùng',
  totalPublicChannelLength: 'Tổng chiều dài luồng công cộng (km)', totalDedicatedChannelLength: 'Tổng chiều dài luồng chuyên dùng (km)',
  totalBuoysBeacons: 'Tổng số phao tiêu/báo hiệu', totalDikes: 'Tổng số đê kè',
  totalDikeLength: 'Tổng chiều dài đê kè (km)', totalLighthouses: 'Tổng số đèn biển/đăng tiêu',
  buoyBerthCount: 'Số lượng bến phao', anchorageCount: 'Số lượng khu neo đậu',
  transshipmentCount: 'Số lượng khu chuyển tải', otherWaterAreas: 'Các khu nước khác',
  remarks: 'Ghi chú', mapSymbolId: 'Biểu tượng bản đồ', spatialId: 'Vị trí không gian',
  orgUnitId: 'Đơn vị quản lý', operationalStatus: 'Trạng thái hoạt động', approvalStatus: 'Trạng thái phê duyệt',
  'Lý do từ chối': 'Lý do từ chối', 'Trạng thái': 'Hành động',
};
function historyFieldName(fn: string): string { return historyFieldLabels[fn] || fn; }
function historyFieldValue(fn: string, val: string | null, orgMap?: Map<string, string>, symbolMap?: Map<string, string>): string {
  if (!val || val === '(null)' || val === 'null') return '(trống)';
  if (fn === 'orgUnitId' && orgMap) { const full = orgMap.get(val); return full ? full.split(' - ').pop() || full : val; }
  if (fn === 'mapSymbolId' && symbolMap) return symbolMap.get(val) || val;
  if (fn === 'approvalStatus') { const m: Record<string,string> = { DRAFT:'Nháp', PROPOSED:'Đề xuất', PENDING:'Chờ duyệt', CHO_PHE_DUYET:'Chờ phê duyệt', PENDING_APPROVAL:'Chờ phê duyệt', APPROVED:'Đã duyệt', DA_PHE_DUYET:'Đã phê duyệt', REJECTED:'Từ chối', TU_CHOI:'Từ chối' }; return m[val] || m[val?.toUpperCase()] || val; }
  if (fn === 'operationalStatus') {
    const m: Record<string,string> = { OPERATIONAL:'Đang hoạt động', SUSPENDED:'Tạm ngừng',
      HIEN_HANH:'Hiện hành', TAM_NGUNG:'Tạm ngừng', DANG_KHAI_THAC:'Đang khai thác', CHUA_KHAI_THAC:'Chưa khai thác', DUNG_KHAI_THAC:'Dừng khai thác' };
    return m[val] || val;
  }
  if (fn === 'portGroup') { try { return `Nhóm ${val}`; } catch { return val; } }
  if (fn === 'portClass') { const m: Record<string,string> = { '5':'Cấp đặc biệt', '1':'Cấp 1', '2':'Cấp 2', '3':'Cấp 3', '4':'Cấp 4' }; return m[val] || `Cấp ${val}`; }
  if (fn === 'changedAt' || fn === 'createdAt') { try { return dayjs(val).format('DD/MM/YYYY HH:mm'); } catch { return val; } }
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
    if (newStatus === 'PENDING') return { label: 'Gửi phê duyệt', color: 'orange' };
  }
  const nullCount = oldVals.filter(v => v === '(null)' || v === 'null').length;
  if (nullCount > items.length / 2) return { label: 'Tạo mới', color: 'blue' };
  return { label: 'Chỉnh sửa', color: 'blue' };
}

const labelProps = (text: string) => ({
  label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

export default function PortListPage() {
  const navigate = useNavigate();

  // ── Permission ──────────────────────────────────────────────────
  const hasPerm = usePermissionStore((s) => s.hasPermission);
  const canSubmitForApproval = hasPerm?.('admin:manage') || hasPerm?.(PERMISSIONS.PORT.APPROVE_C1) || hasPerm?.(PERMISSIONS.PORT.APPROVE_C2);

  // ── State ───────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [filterTinh, setFilterTinh] = useState('');
  const [filterOrgUnitId, setFilterOrgUnitId] = useState<string | undefined>();
  const [filterPortGroup, setFilterPortGroup] = useState<number | undefined>();
  const [filterPortClass, setFilterPortClass] = useState<number | undefined>();
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState<string | undefined>();
  const [filterUpdatedTo, setFilterUpdatedTo] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<string | undefined>();
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const defaultOrgUnitId = useRef<string | undefined>(undefined);
  const [orgUnitReady, setOrgUnitReady] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortField, setSortField] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend'>('descend');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [activeStatusTab, setActiveStatusTab] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<CangBienResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
  const [totalAll, setTotalAll] = useState(0);

  // Modals visibility
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [portSystemOpen, setPortSystemOpen] = useState(true);
  const [detailCollapsed, setDetailCollapsed] = useState<Record<string, boolean>>({});
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<CangBienResponse | null>(null);
  const [detailFiles, setDetailFiles] = useState<any[]>([]);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyExpanded, setHistoryExpanded] = useState<Record<number, boolean>>({});

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<CangBienResponse | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const historySearchRef = useRef('');
  const [historyDateFrom, setHistoryDateFrom] = useState<string>('');
  const [historyDateTo, setHistoryDateTo] = useState<string>('');
  const [historyMode, setHistoryMode] = useState<'current' | 'all'>('current');
  const [historyEntityNames, setHistoryEntityNames] = useState<Record<string, string>>({});
  const [historyEntityId, setHistoryEntityId] = useState('');
  const [historyEntityName, setHistoryEntityName] = useState('');
  const [historyEntityFilter, setHistoryEntityFilter] = useState('');

  // Reject modal
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<CangBienResponse | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  // Submit modal
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submittingRecord, setSubmittingRecord] = useState<CangBienResponse | null>(null);

  // Approve modal
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvingRecord, setApprovingRecord] = useState<CangBienResponse | null>(null);

  // Auto-generate port code for create modal
  const [portCodeLoading, setPortCodeLoading] = useState(false);
  const [createTabKey, setCreateTabKey] = useState('general');

  // Infrastructure list for create modal
  const [infraList, setInfraList] = useState<Array<{ stt: number; infraName: string; quantity: number | null }>>([]);
  const [uploadFileList, setUploadFileList] = useState<any[]>([]);
  // GPS coordinates for create modal (DMS per point, stored as decimal degrees)
  const [gpsCoordList, setGpsCoordList] = useState<Array<{ lat: number; lng: number }>>([]);

  // DMS ↔ DD conversion helpers
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
  const removeGpsPoint = (i: number) => {
    const next = gpsCoordList.filter((_, idx) => idx !== i);
    setGpsCoordList(next);
  };
  const updateGpsPoint = (i: number, field: 'lat' | 'lng', d: number, m: number, s: number) => {
    const next = [...gpsCoordList];
    next[i] = { ...next[i], [field]: dmToDd(d, m, s) };
    setGpsCoordList(next);
  };

  // Infra helpers
  const addInfra = () => setInfraList([...infraList, { stt: infraList.length + 1, infraName: '', quantity: null }]);
  const removeInfra = (i: number) => {
    const next = infraList.filter((_, idx) => idx !== i).map((item, idx) => ({ ...item, stt: idx + 1 }));
    setInfraList(next);
  };
  const updateInfraName = (i: number, val: string) => {
    const next = [...infraList];
    next[i] = { ...next[i], infraName: val };
    setInfraList(next);
  };
  const updateInfraQty = (i: number, val: number | null) => {
    const next = [...infraList];
    next[i] = { ...next[i], quantity: val };
    setInfraList(next);
  };

  // Debounce search 300ms (F-012 AC-012-02)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const [createForm] = Form.useForm();
  const [updateForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [actionType, setActionType] = useState<'draft' | 'submit' | 'approve'>('submit');
  const actionTypeRef = useRef<'draft' | 'submit' | 'approve'>('submit');
  const [orgUnits, setOrgUnits] = useState<any[]>([]);
  const [symbols, setSymbols] = useState<any[]>([]);

  const symbolMap = useMemo(() => {
    const map = new Map<string, string>();
    symbols.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [symbols]);

  const orgMap = useMemo(() => {
    const map = new Map<string, string>();
    orgUnits.forEach((o: any) => map.set(o.id, o.code ? `${o.code} - ${o.name}` : o.name));
    return map;
  }, [orgUnits]);

  const handleFilterApply = useCallback(() => {
    setSearch(filterValues.search || '');
    setFilterOrgUnitId(filterValues.orgUnitId === '__all__' ? undefined : filterValues.orgUnitId || undefined);
    setFilterPortClass(filterValues.portClass ? Number(filterValues.portClass) : undefined);
    setFilterPortGroup(filterValues.portGroup ? Number(filterValues.portGroup) : undefined);
    setFilterTinh(filterValues.province || '');
    setFilterUpdatedFrom(filterValues.updatedFrom || undefined);
    setFilterUpdatedTo(filterValues.updatedTo || undefined);
    setFilterApprovalStatus(filterValues.approvalStatus || undefined);
    setPage(1);
  }, [filterValues]);

  const handleFilterReset = useCallback(() => {
    const defaultOrg = defaultOrgUnitId.current;
    setFilterValues(defaultOrg ? { orgUnitId: defaultOrg } : {});
    setSearch('');
    setFilterOrgUnitId(defaultOrg || undefined);
    setFilterTinh('');
    setFilterPortGroup(undefined);
    setFilterPortClass(undefined);
    setFilterUpdatedFrom(undefined);
    setFilterUpdatedTo(undefined);
    setFilterStatus(undefined);
    setFilterApprovalStatus(undefined);
    setActiveStatusTab('');
    setPage(1);
  }, []);

  const closeUpdateModal = useCallback(() => {
    setUpdateModalVisible(false);
    setInfraList([]);
    setUploadFileList([]);
    if (window.self !== window.top) {
      window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
    }
  }, []);

  const closeDetailModal = useCallback(() => {
    setDetailModalVisible(false);
    if (window.self !== window.top) {
      window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
    }
  }, []);

  const [searchParams] = useSearchParams();
  const isIframeModal = (window.self !== window.top) && searchParams.has('action');
  const action = searchParams.get('action');
  const id = searchParams.get('id');

  // ── Iframe auto-load effect ─────────────────────────────────────
  useEffect(() => {
    if (id && (action === 'detail' || action === 'edit')) {
      (async () => {
        try {
          setIsLoading(true);
          const cached = (window.parent as any)?.kchtDetailCache?.[id];
          const data = cached || await fetchCangBienById(id);
          setSelectedRecord(data);
          if (action === 'detail') {
            const fileRes = await documentApi.listByEntity('port', id, { page: 1, size: 20 });
            setDetailFiles(fileRes.data || []);
            setDetailModalVisible(true);
          } else if (action === 'edit') {
            updateForm.setFieldsValue({
              id: data.id,
              portCode: data.portCode,
              portName: data.portName,
              province: data.province || undefined,
              orgUnitId: data.orgUnitId || undefined,
              portGroup: data.portGroup != null ? data.portGroup : undefined,
              geometryType: data.geometryType || 'POINT',
              mapSymbolId: data.mapSymbolId || undefined,
              detailedLocation: data.detailedLocation || undefined,
              portClass: data.portClass != null ? data.portClass : undefined,
              heQuyChieu: data.coordinateSystem != null ? data.coordinateSystem : undefined,
              quyTacHienThi: data.displayRule != null ? data.displayRule : undefined,
              phamViVungNuoc: data.waterAreaScope || undefined,
              tongSoBenCang: data.totalBerths != null ? data.totalBerths : undefined,
              tongSoKhuNeoDauChuyenTai: data.totalAnchoragesTransshipment != null ? data.totalAnchoragesTransshipment : undefined,
              tongSoTuyenLuongCongCong: data.totalPublicChannels != null ? data.totalPublicChannels : undefined,
              tongSoTuyenLuongChuyenDung: data.totalDedicatedChannels != null ? data.totalDedicatedChannels : undefined,
              tongChieuDaiLuongCongCong: data.totalPublicChannelLength != null ? data.totalPublicChannelLength : undefined,
              tongChieuDaiLuongChuyenDung: data.totalDedicatedChannelLength != null ? data.totalDedicatedChannelLength : undefined,
              tongSoPhaoTieuBaoHieu: data.totalBuoysBeacons != null ? data.totalBuoysBeacons : undefined,
              tongSoDeKe: data.totalDikes != null ? data.totalDikes : undefined,
              tongChieuDaiDeKe: data.totalDikeLength != null ? data.totalDikeLength : undefined,
              tongSoDenBienDangTieu: data.totalLighthouses != null ? data.totalLighthouses : undefined,
              quantityBenPhao: data.buoyBerthCount != null ? data.buoyBerthCount : undefined,
              quantityKhuNeoDau: data.anchorageCount != null ? data.anchorageCount : undefined,
              quantityKhuChuyenTai: data.transshipmentCount != null ? data.transshipmentCount : undefined,
              cacKhuNuocKhac: data.otherWaterAreas || undefined,
              coordinateSystem: data.coordinateSystem != null ? data.coordinateSystem : undefined,
              displayRule: 'Độ, phút, giây (DMS)',
              waterAreaScope: data.waterAreaScope || undefined,
              remarks: data.remarks || undefined,
            });
            // Load infrastructure & attachments for edit
            setInfraList(((data as any).infrastructureList || []).map((i: any) => ({ stt: i.stt, infraName: i.infraName, quantity: i.quantity })));
            // Load attachments via API
            try {
              const attRes = await documentApi.listByEntity('port', id, { page: 1, size: 20 });
              setUploadFileList((attRes.data || []).map((a: any) => ({ uid: a.id, name: a.fileName, size: a.fileSize, status: 'done' as const })));
            } catch { setUploadFileList([]); }
            // Parse coordinates from API response (coordinateList array, WKT string, or single lat/lng)
            const wktCoords: string = data.coordinates || '';
            const coordArr = data.coordinateList;
            const pts: Array<{ lat: number; lng: number }> = [];
            if (coordArr && Array.isArray(coordArr) && coordArr.length > 0) {
              pts.push(...coordArr.map((c: any) => ({ lat: c.latitude ?? c.lat, lng: c.longitude ?? c.lng })));
            } else if (wktCoords) {
              const multiMatch = wktCoords.match(/MULTIPOINT\s*\(([^)]+(?:\),[^)]+)*)\)/);
              if (multiMatch) {
                const rawPts = multiMatch[1].split('),(');
                pts.push(...rawPts.map((pt: string) => {
                  const parts = pt.replace(/[()]/g, '').trim().split(/\s+/);
                  return { lat: Number(parts[1]), lng: Number(parts[0]) };
                }));
              } else {
                const match = wktCoords.match(/POINT\s*\(([-\d.]+)\s+([-\d.]+)\)/);
                if (match) {
                  pts.push({ lat: Number(match[2]), lng: Number(match[1]) });
                }
              }
            } else if (data.latitude != null && data.longitude != null) {
              pts.push({ lat: Number(data.latitude), lng: Number(data.longitude) });
            }
            setGpsCoordList(pts);
            setUpdateModalVisible(true);
          }
        } catch (err) {
          console.error('Failed to auto-load details in iframe:', err);
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [action, id, updateForm]);

  const fetchSymbols = useCallback(async () => {
    try {
      const res = await symbolService.list({ page: 1, pageSize: 1000, status: 'active' });
      setSymbols(res.data);
    } catch (err) {
      console.error('Failed to load symbols', err);
    }
  }, []);

  useEffect(() => {
    const parentOrgUnits = (window.parent as any)?.kchtOrgUnits;
    const parentSymbols = (window.parent as any)?.kchtSymbols;

    if (parentOrgUnits && parentOrgUnits.length > 0) {
      setOrgUnits(parentOrgUnits);
      if (!filterOrgUnitId) {
        setFilterValues(prev => ({ ...prev, orgUnitId: parentOrgUnits[0].id }));
        setFilterOrgUnitId(parentOrgUnits[0].id);
      }
    }
    if (parentSymbols && parentSymbols.length > 0) {
      setSymbols(parentSymbols);
    }

    const needOrgUnits = (!parentOrgUnits || parentOrgUnits.length === 0);
    const needSymbols = (!parentSymbols || parentSymbols.length === 0);

    if (needSymbols) {
      void fetchSymbols();
    }
    if (needOrgUnits) {
      (async () => {
        try {
          const resp = await organizationService.list();
          setOrgUnits(resp.data || []);
          const data = resp.data || [];
          if (data.length > 0 && !filterOrgUnitId) {
            try {
              const profileRes = await api.get('/users/me');
              const profile = profileRes.data?.data ?? profileRes.data;
              const userOrgId = profile?.orgUnitId;
              const match = userOrgId && data.find((o: any) => o.id === userOrgId);
              const defaultId = match ? userOrgId : data[0].id;
              defaultOrgUnitId.current = defaultId;
              setFilterValues(prev => ({ ...prev, orgUnitId: defaultId }));
              setFilterOrgUnitId(defaultId);
            } catch {
              defaultOrgUnitId.current = data[0].id;
              setFilterValues(prev => ({ ...prev, orgUnitId: data[0].id }));
              setFilterOrgUnitId(data[0].id);
            }
          }
          setOrgUnitReady(true);
        } catch (err) {
          console.error('Failed to load org units', err);
          setOrgUnitReady(true);
        }
      })();
    }
  }, [fetchSymbols, isIframeModal, action]);

  const translateValue = useCallback(
    (fieldName: string, val: string | null): string => {
      if (!val || val === '(null)' || val === 'null') {
        return '(trống)';
      }
      // Symbol IDs
      if (['bieuTuongId', 'iconId', 'lineSymbolId', 'fillSymbolId', 'mapSymbolId'].includes(fieldName)) {
        const sym = symbols.find((s) => s.id === val);
        return sym ? (sym.code ? `${sym.name} (${sym.code})` : sym.name) : val;
      }
      // Spatial ID
      if (['khongGianId', 'spatialId'].includes(fieldName)) {
        return 'Có tọa độ bản đồ';
      }
      // Approval status
      if (fieldName === 'approvalStatus') {
        const approvalMap: Record<string, string> = {
          DRAFT: 'Nháp',
          CHO_PHE_DUYET: 'Chờ phê duyệt',
          PENDING: 'Chờ phê duyệt',
          PENDING_APPROVAL: 'Chờ phê duyệt',
          DUOC_PHE_DUYET: 'Được phê duyệt',
          APPROVED: 'Được phê duyệt',
          TU_CHOI: 'Từ chối',
          REJECTED: 'Từ chối',
        };
        return approvalMap[val.toUpperCase()] || val;
      }
      // Operational status
      if (fieldName === 'operationalStatus') {
        const statusMap: Record<string, string> = {
          HIEN_HANH: 'Hiện hành',
          TAM_NGUNG: 'Tạm ngừng',
          'HIỆN_HÀNH': 'Hiện hành',
          'TẠM_NGƯNG': 'Tạm ngừng',
          DANG_KHAI_THAC: 'Đang khai thác',
          CHUA_KHAI_THAC: 'Chưa khai thác',
          DUNG_KHAI_THAC: 'Dừng khai thác',
        };
        return statusMap[val.toUpperCase()] || val;
      }
      // Port classification (phanCap / portClass)
      if (fieldName === 'portClass' || fieldName === 'phanCap') {
        const classMap: Record<string, string> = {
          '5': 'Cấp đặc biệt',
          '1': 'Cấp 1',
          '2': 'Cấp 2',
          '3': 'Cấp 3',
          '4': 'Cấp 4',
        };
        return classMap[val] || `Cấp ${val}`;
      }
      // Port group
      if (fieldName === 'portGroup') {
        return `Nhóm ${val}`;
      }
      // Coordinate system
      if (fieldName === 'coordinateSystem') {
        const coordMap: Record<string, string> = { '1': 'WGS-84', '2': 'VN-2000' };
        return coordMap[val] || val;
      }
      // Display rule
      if (fieldName === 'displayRule') {
        const ruleMap: Record<string, string> = { '1': 'Mặc định', '2': 'Nổi bật', '3': 'Tối giản' };
        return ruleMap[val] || val;
      }
      // Collection fields — skip object reference display
      if (['infrastructureList', 'attachments', 'attachmentList'].includes(fieldName)) {
        if (val === '[]') return 'Không có';
        if (val.startsWith('[') && val.includes('@')) return 'Đã cập nhật';
        return 'Đã cập nhật';
      }
      // Boolean fields
      if (val === 'true') return 'Có';
      if (val === 'false') return 'Không';
      return val;
    },
    [symbols],
  );

  // Form watches
  const createGeometryType = Form.useWatch('geometryType', createForm);
  const updateGeometryType = Form.useWatch('geometryType', updateForm) || 'POINT';

  // Khi chọn loại đối tượng → tự set hệ quy chiếu & quy tắc hiển thị
  useEffect(() => { if (createGeometryType) createForm.setFieldsValue({ coordinateSystem: 1, displayRule: 'Độ, phút, giây (DMS)' }); }, [createGeometryType]);
  useEffect(() => { if (updateGeometryType && updateGeometryType !== 'POINT') updateForm.setFieldsValue({ coordinateSystem: 1, displayRule: 'Độ, phút, giây (DMS)' }); }, [updateGeometryType]);

  const handleCreateFinish = async (values: Record<string, unknown>) => {
    const portCode = String(values.portCode || '').trim();
    const portName = String(values.portName).trim();
    if (!portCode) { toast.error('Mã cảng chưa được sinh tự động. Vui lòng đóng và mở lại form.'); return; }
    if (!portName) { toast.error('Tên cảng biển là bắt buộc ngay cả khi lưu tạm'); return; }
    if (portName.length > 255) { toast.error('Tên cảng tối đa 255 ký tự'); return; }

    // BR-008-08: Validate công trình KCHT
    for (const infra of infraList) {
      const name = (infra.infraName || '').trim();
      if (!name) { toast.error('Tên công trình KCHT không được để trống'); return; }
      if (name.length > 500) { toast.error('Tên công trình KCHT không quá 500 ký tự'); return; }
      if (infra.quantity == null || Number(infra.quantity) <= 0) { toast.error('Số lượng công trình KCHT phải lớn hơn 0'); return; }
      if (Number(infra.quantity) > 5) { toast.error('Số lượng công trình KCHT không quá 5'); return; }
    }

    // Validate GPS coordinates (required for both draft and submit)
    const gpsComplete = gpsCoordList.filter(c => c.lat != null && c.lng != null && !isNaN(c.lat) && !isNaN(c.lng));
    if (gpsCoordList.length === 0 || gpsComplete.length === 0) {
      toast.error('Tọa độ GPS là bắt buộc. Vui lòng thêm ít nhất một tọa độ và nhập đầy đủ thông tin.');
      return;
    }
    // Check for incomplete entries (has some DMS fields but not all)
    for (let i = 0; i < gpsCoordList.length; i++) {
      const c = gpsCoordList[i];
      if (c.lat == null || c.lng == null || isNaN(c.lat) || isNaN(c.lng)) {
        toast.error(`Tọa độ thứ ${i + 1} chưa nhập đầy đủ thông tin Độ/Phút/Giây.`);
        return;
      }
    }

    // Validate required fields for submit
    const currentAction = actionTypeRef.current;
    if (currentAction === 'submit' || currentAction === 'approve') {
      if (!values.orgUnitId) { toast.error('Đơn vị quản lý là bắt buộc khi gửi phê duyệt'); return; }
      if (!values.province) { toast.error('Tỉnh/Thành phố là bắt buộc khi gửi phê duyệt'); return; }
      if (values.portClass == null || values.portClass === '') { toast.error('Phân cấp cảng biển là bắt buộc khi gửi phê duyệt'); return; }
    }

    setSubmitting(true);
    try {
      const coordinateList: Array<{ latitude: number; longitude: number }> = gpsCoordList
        .filter(c => c.lat != null && c.lng != null && !isNaN(c.lat) && !isNaN(c.lng))
        .map(c => ({ latitude: c.lat, longitude: c.lng }));

      // AC-008-09: Kiểm tra trùng tên cảng trong cùng tỉnh (warning, không chặn)
      if (portName && values.province) {
        try {
          const dupRes = await api.get('/v1/ports', {
            params: { portName, province: values.province, page: 1, size: 1 },
          });
          const dupData = dupRes.data?.data?.content ?? dupRes.data?.content ?? [];
          if (Array.isArray(dupData) && dupData.length > 0) {
            toast.warning('Tên cảng đã tồn tại. Bạn có chắc muốn tiếp tục?');
          }
        } catch {
          // non-blocking
        }
      }

      const payload = {
        portCode,
        portName,
        province: (values.province as string) || undefined,
        area: values.area as number | undefined,
        maxVesselCapacity: values.khaNangTiepNhan as number | undefined,
        operationalStatus: (values.operationalStatus as string) || undefined,
        approvalStatus: currentAction === 'draft' ? 'DRAFT' : 'APPROVED',
        orgUnitId: (values.orgUnitId as string) && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(values.orgUnitId as string) ? (values.orgUnitId as string) : undefined,
        portGroup: values.portGroup ? Number(values.portGroup) : undefined,
        mapSymbolId: (values.mapSymbolId as string) || undefined,
        geometryType: values.geometryType as string,
        detailedLocation: (values.detailedLocation as string) || undefined,
        portClass: values.portClass != null && !Number.isNaN(values.portClass as number)
          ? Number(values.portClass) : undefined,
        coordinateSystem: values.coordinateSystem != null && !Number.isNaN(values.coordinateSystem as number)
          ? Number(values.coordinateSystem) : undefined,
        displayRule: values.displayRule != null && !Number.isNaN(values.displayRule as number)
          ? Number(values.displayRule) : undefined,
        waterAreaScope: (values.waterAreaScope as string) || undefined,
        totalBerths: values.totalBerths != null && !Number.isNaN(values.totalBerths as number)
          ? Number(values.totalBerths) : undefined,
        totalAnchoragesTransshipment: values.totalAnchoragesTransshipment != null && !Number.isNaN(values.totalAnchoragesTransshipment as number)
          ? Number(values.totalAnchoragesTransshipment) : undefined,
        totalPublicChannels: values.totalPublicChannels != null && !Number.isNaN(values.totalPublicChannels as number)
          ? Number(values.totalPublicChannels) : undefined,
        totalDedicatedChannels: values.totalDedicatedChannels != null && !Number.isNaN(values.totalDedicatedChannels as number)
          ? Number(values.totalDedicatedChannels) : undefined,
        totalPublicChannelLength: values.totalPublicChannelLength != null && !Number.isNaN(values.totalPublicChannelLength as number)
          ? Number(values.totalPublicChannelLength) : undefined,
        totalDedicatedChannelLength: values.totalDedicatedChannelLength != null && !Number.isNaN(values.totalDedicatedChannelLength as number)
          ? Number(values.totalDedicatedChannelLength) : undefined,
        totalBuoysBeacons: values.totalBuoysBeacons != null && !Number.isNaN(values.totalBuoysBeacons as number)
          ? Number(values.totalBuoysBeacons) : undefined,
        totalDikes: values.totalDikes != null && !Number.isNaN(values.totalDikes as number)
          ? Number(values.totalDikes) : undefined,
        totalDikeLength: values.totalDikeLength != null && !Number.isNaN(values.totalDikeLength as number)
          ? Number(values.totalDikeLength) : undefined,
        totalLighthouses: values.totalLighthouses != null && !Number.isNaN(values.totalLighthouses as number)
          ? Number(values.totalLighthouses) : undefined,
        buoyBerthCount: values.buoyBerthCount != null && !Number.isNaN(values.buoyBerthCount as number)
          ? Number(values.buoyBerthCount) : undefined,
        anchorageCount: values.anchorageCount != null && !Number.isNaN(values.anchorageCount as number)
          ? Number(values.anchorageCount) : undefined,
        transshipmentCount: values.transshipmentCount != null && !Number.isNaN(values.transshipmentCount as number)
          ? Number(values.transshipmentCount) : undefined,
        otherWaterAreas: (values.otherWaterAreas as string) || undefined,
        coordinateList,
        infrastructureList: infraList
          .filter((inf) => inf.infraName?.trim())
          .map((inf) => ({ stt: inf.stt, infraName: inf.infraName.trim(), quantity: Number(inf.quantity) })),
        remarks: (values.remarks as string) || undefined,
        action: currentAction,
      };
      const createdPort = await import('./api').then((m) => m.createCangBien(payload));
      const createdPortId = createdPort?.id || (createdPort as any)?.portId;
      toast.success(currentAction === 'draft' ? 'Lưu tạm thành công' : 'Gửi phê duyệt thành công');
      createForm.resetFields();

      setInfraList([]);
      setGpsCoordList([]);
      setUploadFileList([]);
      setCreateModalVisible(false);

      // Upload files after port created successfully
      if (createdPortId && uploadFileList.length > 0) {
        let uploaded = 0;
        for (const f of uploadFileList) {
          if (!f.originFileObj) continue; // skip existing attachments
          try {
            const formData = new FormData();
            formData.append('file', f.originFileObj as File);
            await api.post(`/v1/documents/upload/port/${createdPortId}`, formData, { headers: { 'Content-Type': undefined } });
            uploaded++;
          } catch { /* non-blocking */ }
        }
        if (uploaded > 0) toast.success(`Đã tải lên ${uploaded} tệp đính kèm`);
      }

      fetchData();
      fetchTabCounts();
    } catch (err: unknown) {
      if (err instanceof Error) {
        const msg = err.message;
        if (msg.includes('mã cảng') || msg.includes('Ma cang') || msg.includes('Duplicate')) {
          toast.error('Mã cảng đã tồn tại. Vui lòng nhập mã khác.');
        } else {
          toast.error(msg);
        }
      } else {
        toast.error('Có lỗi xảy ra khi tạo mới');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormFailed = (errorInfo: any) => {
    errorInfo.errorFields.forEach((field: any) => {
      toast.error(`${field.errors.join(', ')}`);
    });
  };

  const handleUpdateFinish = async (values: Record<string, unknown>) => {
    if (!selectedRecord) return;
    setSubmitting(true);
    try {
      const n = (v: unknown): number | undefined =>
        v != null && !Number.isNaN(v as number) ? Number(v) : undefined;

      const coordinateList: Array<{ latitude: number; longitude: number }> = gpsCoordList
        .filter(c => c.lat != null && c.lng != null && !isNaN(c.lat) && !isNaN(c.lng))
        .map(c => ({ latitude: c.lat, longitude: c.lng }));

      const payload = {
        id: selectedRecord.id,
        portCode: (values.portCode as string) || undefined,
        portName: (values.portName as string) || undefined,
        province: (values.province as string) || undefined,
        area: values.area as number | undefined,
        maxVesselCapacity: values.khaNangTiepNhan as number | undefined,
        operationalStatus: (values.operationalStatus as string) || undefined,
        approvalStatus: selectedRecord.approvalStatus,
        orgUnitId: (values.orgUnitId as string) && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(values.orgUnitId as string) ? (values.orgUnitId as string) : undefined,
        portGroup: values.portGroup ? Number(values.portGroup) : undefined,
        mapSymbolId: (values.gisLocation as any)?.mapSymbolId || (values.mapSymbolId as string) || undefined,
        geometryType: values.geometryType as string,
        coordinates: (values.gisLocation as any)?.coordinates || undefined,
        detailedLocation: (values.detailedLocation as string) || undefined,
        portClass: values.portClass != null && !Number.isNaN(values.portClass as number)
          ? Number(values.portClass) : undefined,
        coordinateSystem: values.coordinateSystem != null && !Number.isNaN(values.coordinateSystem as number)
          ? Number(values.coordinateSystem) : undefined,
        displayRule: values.displayRule != null && !Number.isNaN(values.displayRule as number)
          ? Number(values.displayRule) : undefined,
        waterAreaScope: (values.waterAreaScope as string) || null,
        totalBerths: n(values.totalBerths),
        totalAnchoragesTransshipment: n(values.totalAnchoragesTransshipment),
        totalPublicChannels: n(values.totalPublicChannels),
        totalDedicatedChannels: n(values.totalDedicatedChannels),
        totalPublicChannelLength: n(values.totalPublicChannelLength),
        totalDedicatedChannelLength: n(values.totalDedicatedChannelLength),
        totalBuoysBeacons: n(values.totalBuoysBeacons),
        totalDikes: n(values.totalDikes),
        totalDikeLength: n(values.totalDikeLength),
        totalLighthouses: n(values.totalLighthouses),
        buoyBerthCount: n(values.buoyBerthCount),
        anchorageCount: n(values.anchorageCount),
        transshipmentCount: n(values.transshipmentCount),
        otherWaterAreas: (values.otherWaterAreas as string) || null,
        coordinateList,
        infrastructureList: infraList
          .filter((inf) => inf.infraName?.trim())
          .map((inf) => ({ stt: inf.stt, infraName: inf.infraName.trim(), quantity: Number(inf.quantity) })),
        remarks: (values.remarks as string) || undefined,
      };
      const res = await import('./api').then((m) => m.updateCangBien(payload));
      toast.success('Cập nhật thành công');
      if (window.parent && (window.parent as any).kchtDetailCache) {
        (window.parent as any).kchtDetailCache[selectedRecord.id] = res;
      }
      // Upload files after update
      // Upload files after port updated
      if (selectedRecord?.id && uploadFileList.length > 0) {
        let uploaded = 0;
        for (const f of uploadFileList) {
          if (!f.originFileObj) continue; // skip existing attachments
          try {
            const formData = new FormData();
            formData.append('file', f.originFileObj as File);
            await api.post(`/v1/documents/upload/port/${selectedRecord.id}`, formData, { headers: { 'Content-Type': undefined } });
            uploaded++;
          } catch { /* non-blocking */ }
        }
        if (uploaded > 0) toast.success(`Đã tải lên ${uploaded} tệp đính kèm`);
      }
      closeUpdateModal();
      if (!isIframeModal) {
        fetchData();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Cập nhật thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await fetchCangBienList({
        page: page - 1,
        size: pageSize,
        orgUnitId: filterOrgUnitId,
        search: debouncedSearch || undefined,
        province: filterTinh || undefined,
        operationalStatus: filterStatus,
        approvalStatus: filterApprovalStatus,
        portGroup: filterPortGroup,
        portClass: filterPortClass,
        updatedFrom: filterUpdatedFrom,
        updatedTo: filterUpdatedTo,
      });
      setDataSource(res.content || []);
      setTotal(res.totalElements ?? 0);
    } catch (err: unknown) {
      setIsError(true);
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách cảng biển';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearch, filterTinh, filterOrgUnitId, filterPortGroup, filterPortClass, filterUpdatedFrom, filterUpdatedTo, filterStatus, filterApprovalStatus]);

  const fetchTabCounts = useCallback(async () => {
    const statuses = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'];
    const counts: Record<string, number> = {};
    await Promise.all([
      ...statuses.map(async (status) => {
        try {
          const res = await fetchCangBienList({ approvalStatus: status, page: 0, size: 1, orgUnitId: filterOrgUnitId });
          counts[status] = res?.totalElements ?? 0;
        } catch { counts[status] = 0; }
      }),
      fetchCangBienList({ page: 0, size: 1, orgUnitId: filterOrgUnitId }).then(res => setTotalAll(res?.totalElements ?? 0)).catch(() => {}),
    ]);
    setTabCounts(counts);
  }, [filterOrgUnitId]);

  useEffect(() => { if (!isIframeModal && orgUnitReady) void fetchData(); }, [fetchData, isIframeModal, orgUnitReady]);
  useEffect(() => { if (!isIframeModal && orgUnitReady) void fetchTabCounts(); }, [fetchTabCounts, isIframeModal, orgUnitReady]);

  const handleDelete = useCallback(
    (record: CangBienResponse) => {
      setDeleteTarget(record);
      setDeleteConfirmText('');
    },
    [],
  );

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const expected = (deleteTarget.portName || '').trim().toLowerCase();
    const input = deleteConfirmText.trim().toLowerCase();
    if (input !== expected && input !== 'xóa') {
      toast.error('Vui lòng nhập đúng tên cảng hoặc gõ "XÓA" để xác nhận');
      return;
    }
    try {
      await deleteCangBien(deleteTarget.id);
      toast.success('Đã xóa thành công');
      setDeleteTarget(null);
      setDeleteConfirmText('');
      fetchData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Xóa thất bại');
    }
  };

  const handleApprove = useCallback(
    (record: CangBienResponse) => {
      setApprovingRecord(record);
      setApproveModalOpen(true);
    },
    [],
  );

  const handleConfirmApprove = useCallback(async () => {
    if (!approvingRecord) return;
    try {
      await approveCangBien(approvingRecord.id);
      toast.success('Phê duyệt thành công');
      setApproveModalOpen(false);
      setApprovingRecord(null);
      fetchData();
      fetchTabCounts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Phê duyệt thất bại';
      toast.error(msg);
    }
  }, [approvingRecord, fetchData, fetchTabCounts]);

  const handleSubmitDraft = useCallback(
    (record: CangBienResponse) => {
      setSubmittingRecord(record);
      setSubmitModalOpen(true);
    },
    [],
  );

  const handleConfirmSubmit = useCallback(async () => {
    if (!submittingRecord) return;
    setSubmitModalOpen(false);
    try {
      await updateCangBien({ id: submittingRecord.id, approvalStatus: 'PENDING' } as any);
      toast.success('Đã gửi phê duyệt');
      setSubmittingRecord(null);
      fetchData();
      fetchTabCounts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gửi phê duyệt thất bại';
      toast.error(msg);
    }
  }, [submittingRecord, fetchData, fetchTabCounts]);

  const handleReject = useCallback((record: CangBienResponse) => {
    setRejectTarget(record);
    setRejectReason('');
    setRejectError('');
    setRejectModalVisible(true);
  }, []);

  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason || rejectReason.trim().length < 10) {
      setRejectError('Lý do từ chối phải có ít nhất 10 ký tự');
      return;
    }
    try {
      await rejectCangBien(rejectTarget.id, rejectReason.trim());
      toast.success('Từ chối thành công');
      setRejectModalVisible(false);
      setRejectTarget(null);
      setRejectReason('');
      setRejectError('');
      fetchData();
      fetchTabCounts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
    }
  };

  const historyHandler = useCallback(async (record: CangBienResponse) => {
    try {
      setLoadingHistory(true);
      setSelectedRecord(record);
      setHistoryModalVisible(true);
      setHistorySearch('');
      historySearchRef.current = '';
      setHistoryDateFrom(dayjs().subtract(7, 'day').format('YYYY-MM-DD HH:mm'));
      setHistoryDateTo(dayjs().format('YYYY-MM-DD HH:mm'));
      setHistoryEntityId(record.id);
      const { fetchportHistory } = await import('./api');
      const histData = await fetchportHistory(record.id, { page: 0, size: 200 });
      setHistoryRecords(histData.changeHistory || []);
      setHistoryExpanded({});
    } catch (err) {
      toast.error('Không thể tải lịch sử thay đổi');
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const getPortGroupLabel = (val: number | null): string => {
    if (!val) return '—';
    return `Nhóm ${val}`;
  };

  // ── rowActions callback ──────────────────────────────────────────
  const rowActions = useCallback(
    (record: CangBienResponse) => {
      const actions: any[] = [
        {
          key: 'view',
          label: 'Chi tiết',
          icon: <EyeOutlined />,
          onClick: async () => {
            try {
              setIsLoading(true);
              const data = await fetchCangBienById(record.id);
              setSelectedRecord(data);
              const fileRes = await documentApi.listByEntity('port', record.id, { page: 1, size: 20 });
              setDetailFiles(fileRes.data || []);
              setDetailModalVisible(true);
            } catch (err) {
              toast.error('Không thể tải thông tin chi tiết cảng biển');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ];
      if (hasPerm?.(PERMISSIONS.PORT.HISTORY)) {
        actions.push({
          key: 'history',
          label: 'Lịch sử',
          icon: <HistoryOutlined />,
          onClick: () => historyHandler(record),
        });
      }
      const status = record.approvalStatus;
      // Chỉnh sửa: tất cả trạng thái
      if (hasPerm?.(PERMISSIONS.PORT.UPDATE)) {
        actions.push({
          key: 'edit',
          label: 'Chỉnh sửa',
          icon: <EditOutlined />,
          onClick: async () => {
            try {
              setIsLoading(true);
              const data = await fetchCangBienById(record.id);
              setSelectedRecord(data);
              updateForm.setFieldsValue({
                portCode: data.portCode,
                portName: data.portName,
                province: data.province || undefined,
                orgUnitId: data.orgUnitId || undefined,
                portGroup: data.portGroup != null ? data.portGroup : undefined,
                detailedLocation: data.detailedLocation || undefined,
                portClass: data.portClass,
                waterAreaScope: data.waterAreaScope || undefined,
                totalBerths: data.totalBerths,
                totalAnchoragesTransshipment: data.totalAnchoragesTransshipment,
                totalPublicChannels: data.totalPublicChannels,
                totalDedicatedChannels: data.totalDedicatedChannels,
                totalPublicChannelLength: data.totalPublicChannelLength,
                totalDedicatedChannelLength: data.totalDedicatedChannelLength,
                totalBuoysBeacons: data.totalBuoysBeacons,
                totalDikes: data.totalDikes,
                totalDikeLength: data.totalDikeLength,
                totalLighthouses: data.totalLighthouses,
                buoyBerthCount: data.buoyBerthCount,
                anchorageCount: data.anchorageCount,
                transshipmentCount: data.transshipmentCount,
                otherWaterAreas: data.otherWaterAreas || undefined,
                remarks: data.remarks || undefined,
                gisLocation: data.coordinates ? {
                  geometryType: data.geometryType || 'POINT',
                  coordinates: data.coordinates,
                  mapSymbolId: data.mapSymbolId,
                } : undefined,
                geometryType: data.geometryType || 'POINT',
                mapSymbolId: data.mapSymbolId,
                coordinateSystem: data.coordinateSystem,
                displayRule: 'Độ, phút, giây (DMS)',
              });
              // Load infrastructure & attachments for edit
              setInfraList(((data as any).infrastructureList || []).map((i: any) => ({ stt: i.stt, infraName: i.infraName, quantity: i.quantity })));
              try {
                const attRes = await documentApi.listByEntity('port', record.id, { page: 1, size: 20 });
                setUploadFileList((attRes.data || []).map((a: any) => ({ uid: a.id, name: a.fileName, size: a.fileSize, status: 'done' as const })));
              } catch { setUploadFileList([]); }
              // Parse coordinates from API response
              const wktCoords2: string = data.coordinates || '';
              const coordArr2 = data.coordinateList;
              const pts2: Array<{ lat: number; lng: number }> = [];
              if (coordArr2 && Array.isArray(coordArr2) && coordArr2.length > 0) {
                pts2.push(...coordArr2.map((c: any) => ({ lat: c.latitude ?? c.lat, lng: c.longitude ?? c.lng })));
              } else if (wktCoords2) {
                const multiMatch2 = wktCoords2.match(/MULTIPOINT\s*\(([^)]+(?:\),[^)]+)*)\)/);
                if (multiMatch2) {
                  const rawPts2 = multiMatch2[1].split('),(');
                  pts2.push(...rawPts2.map((pt: string) => {
                    const parts = pt.replace(/[()]/g, '').trim().split(/\s+/);
                    return { lat: Number(parts[1]), lng: Number(parts[0]) };
                  }));
                } else {
                  const match2 = wktCoords2.match(/POINT\s*\(([-\d.]+)\s+([-\d.]+)\)/);
                  if (match2) {
                    pts2.push({ lat: Number(match2[2]), lng: Number(match2[1]) });
                  }
                }
              } else if (data.latitude != null && data.longitude != null) {
                pts2.push({ lat: Number(data.latitude), lng: Number(data.longitude) });
              }
              setGpsCoordList(pts2);
              setUpdateModalVisible(true);
            } catch (err) {
              toast.error('Không thể tải thông tin chỉnh sửa cảng biển');
            } finally {
              setIsLoading(false);
            }
          },
        });
      }
      // DRAFT: Gửi phê duyệt
      if (status === 'DRAFT' && hasPerm?.(PERMISSIONS.PORT.UPDATE)) {
        actions.push({
          key: 'submit',
          label: 'Gửi phê duyệt',
          icon: <SendOutlined />,
          onClick: () => handleSubmitDraft(record),
        });
      }
      // CHO_PHE_DUYET / PENDING / PENDING_APPROVAL: Phê duyệt + Từ chối
      if ((status === 'CHO_PHE_DUYET' || status === 'PENDING' || status === 'PENDING_APPROVAL') && (hasPerm?.(PERMISSIONS.PORT.APPROVE_C1) || hasPerm?.(PERMISSIONS.PORT.APPROVE_C2))) {
        actions.push({
          key: 'approve',
          label: 'Phê duyệt',
          icon: <CheckCircleOutlined />,
          onClick: () => handleApprove(record),
        });
        actions.push({
          key: 'reject',
          label: 'Từ chối',
          icon: <CloseCircleOutlined />,
          danger: true,
          onClick: () => handleReject(record),
        });
      }
      // Xóa: tất cả trạng thái (kể cả PENDING)
      if (hasPerm?.(PERMISSIONS.PORT.DELETE)) {
        actions.push({
          key: 'delete',
          label: 'Xóa',
          icon: <DeleteOutlined />,
          danger: true,
          onClick: () => handleDelete(record),
        });
      }
      return actions;
    },
    [hasPerm, updateForm, handleApprove, handleDelete, handleReject, historyHandler, handleSubmitDraft],
  );

  // ── Columns (DataTable format) ───────────────────────────────────
  const columns = useMemo(
    () => [
      {
        key: 'sequenceNo',
        label: 'STT',
        width: 60,
        fixed: 'left' as const,
        type: 'mono' as const,
        align: 'center' as const,
        render: (_: unknown, __: CangBienResponse, idx: number) => (
          <span style={{ fontSize: fontSizeMd }}>{(page - 1) * pageSize + idx + 1}</span>
        ),
      },
      // Ẩn cột mã cảng theo yêu cầu
      // {
      //   key: 'portCode',
      //   label: 'Mã cảng',
      //   dataIndex: 'portCode',
      //   width: 160,
      //   render: (portCode: string) => <Tag color="cyan">{portCode}</Tag>,
      // },
      {
        key: 'orgUnitId',
        label: 'Đơn vị quản lý',
        dataIndex: 'orgUnitId',
        width: 260,
        fixed: 'left' as const,
        render: (_v: string | null, record: CangBienResponse) => record.orgUnitName || _v || '—',
      },
      {
        key: 'portName',
        label: 'Tên cảng biển',
        dataIndex: 'portName',
        width: 190,
        fixed: 'left' as const,
        render: (v: string, record: CangBienResponse) => (
          <a
            onClick={() => {
              setSelectedRecord(record);
              documentApi.listByEntity('port', record.id, { page: 1, size: 20 }).then(res => setDetailFiles(res.data || [])).catch(() => setDetailFiles([]));
              setDetailModalVisible(true);
            }}
            style={{ fontWeight: fontWeightBold, color: actionPrimary, cursor: 'pointer' }}
          >
            {v}
          </a>
        ),
      },
      {
        key: 'portGroup',
        label: 'Nhóm cảng biển',
        dataIndex: 'portGroup',
        width: 150,
        render: (v: number | null) => getPortGroupLabel(v),
      },
      {
        key: 'province',
        label: 'Địa điểm',
        dataIndex: 'province',
        width: 150,
        render: (v: string | null) => v || '—',
      },
      {
        key: 'portClass',
        label: 'Phân cấp cảng biển',
        dataIndex: 'portClass',
        width: 180,
        render: (v: number | null) => v != null ? (v === 5 ? 'Cấp đặc biệt' : `Cấp ${v}`) : '—',
      },
      {
        key: 'updatedAt',
        label: 'Ngày cập nhật',
        dataIndex: 'updatedAt',
        width: 160,
        sortable: true,
        sortOrder,
        render: (v: string | null) => (
          <span>{formatDate(v)}</span>
        ),
      },
      {
        key: 'updatedBy',
        label: 'Cán bộ cập nhật',
        dataIndex: 'updatedByName',
        width: 160,
        render: (v: string | null) => v || '—',
      },
      {
        key: 'approvalStatus',
        label: 'Trạng thái',
        dataIndex: 'approvalStatus',
        width: 160,
        render: (v: string) => {
          if (!v) return '—';
          const normV = String(v).toUpperCase();
          const directMap: Record<string, { color: string; label: string }> = {
            PROPOSED: { color: 'blue', label: 'Đề xuất' },
            PENDING_APPROVAL: { color: 'orange', label: 'Chờ phê duyệt' },
          };
          const badge = directMap[normV] || trangThaiPheDuyetBadge(v);
          let color = textTertiary;
          if (badge.color === 'green') color = statusOperational;
          else if (badge.color === 'red') color = statusCritical;
          else if (badge.color === 'orange') color = statusAttention;
          else if (badge.color === 'blue') color = actionPrimary;
          return (
            <span
              style={{
                display: 'inline-flex',
                padding: '2px 10px',
                borderRadius: 999,
                fontSize: fontSizeMd,
                fontWeight: fontWeightMedium,
                background: `${color}15`,
                color,
              }}
            >
              {badge.label}
            </span>
          );
        },
      },
    ],
    [page, pageSize, getPortGroupLabel, sortOrder],
  );

  // ── Form field style ─────────────────────────────────────────────
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
  const historyTabStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    borderRadius: 0,
    border: 'none',
    background: 'transparent',
    fontSize: fontSizeMd,
    padding: `0 ${spaceMd}px`,
  };

  // ── Render ───────────────────────────────────────────────────────
  return (
    <>
      {!isIframeModal && (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
          <ScreenHeader
            breadcrumb={[{ label: 'Tài sản KCHTGT' }, { label: 'Cảng biển' }]}
            actions={[
              hasPerm?.('Port:create')
                ? {
                    key: 'create',
                    label: 'Thêm mới',
                    icon: <PlusOutlined />,
                    variant: 'primary' as const,
                    onClick: () => setCreateModalVisible(true),
                  }
                : null,

            ].filter(Boolean)}
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
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
                  Đơn vị quản lý <span style={{ color: statusCritical }}>*</span>
                </div>
                <Select placeholder="Chọn đơn vị" allowClear showSearch optionFilterProp="label"
                  value={filterValues.orgUnitId || undefined}
                  onChange={(val) => setFilterValues((prev) => ({ ...prev, orgUnitId: val }))}
                  options={[{ label: 'Tất cả', value: '__all__' }, ...orgUnits.map((o) => ({ label: o.name, value: o.id }))]}
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tên cảng biển</div>
                <Input placeholder="Tìm theo tên cảng..." allowClear
                  value={filterValues.search || ''}
                  onChange={(e) => setFilterValues((prev) => ({ ...prev, search: e.target.value }))}
                  onPressEnter={handleFilterApply}
                  style={{ borderRadius: radiusPill, height: 40 }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Phân cấp</div>
                <Select placeholder="Chọn phân cấp" allowClear
                  value={filterValues.portClass || undefined}
                  onChange={(val) => setFilterValues((prev) => ({ ...prev, portClass: val }))}
                  options={[{ value: '5', label: 'Cấp đặc biệt' }, { value: '1', label: 'Cấp 1' }, { value: '2', label: 'Cấp 2' }, { value: '3', label: 'Cấp 3' }, { value: '4', label: 'Cấp 4' }]}
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
              </div>
              {filterCollapsed && (<>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Nhóm cảng biển</div>
                <Select placeholder="Chọn nhóm" allowClear
                  value={filterValues.portGroup || undefined}
                  onChange={(val) => setFilterValues((prev) => ({ ...prev, portGroup: val }))}
                  options={[{ value: '1', label: 'Nhóm 1' }, { value: '2', label: 'Nhóm 2' }, { value: '3', label: 'Nhóm 3' }, { value: '4', label: 'Nhóm 4' }, { value: '5', label: 'Nhóm 5' }]}
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
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Từ ngày - Đến ngày</div>
                <DatePicker.RangePicker showTime={{ format: 'HH:mm' }} format="DD/MM/YYYY HH:mm"
                  placeholder={['Chọn từ ngày', 'Chọn đến ngày']} allowClear className="port-range-picker"
                  value={[filterValues.updatedFrom ? dayjs(filterValues.updatedFrom) : null, filterValues.updatedTo ? dayjs(filterValues.updatedTo) : null]}
                  onChange={(dates) => setFilterValues((prev) => ({ ...prev, updatedFrom: dates?.[0] ? dates[0].format('YYYY-MM-DD HH:mm') : undefined, updatedTo: dates?.[1] ? dates[1].format('YYYY-MM-DD HH:mm') : undefined }))}
                  style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }} />
              </div>
              <style>{`.port-range-picker .ant-picker-cell-selected .ant-picker-cell-inner{background:${actionPrimary}!important}.port-range-picker .ant-picker-ok button{background:${actionPrimary}!important;border-color:${actionPrimary}!important;border-radius:${radiusPill}px!important}.port-range-picker .ant-picker-time-panel-cell-selected .ant-picker-time-panel-cell-inner{background:${actionPrimary}15!important;color:${actionPrimary}!important}.port-range-picker .ant-picker-today-btn{color:${actionPrimary}!important}`}</style>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Trạng thái</div>
                <Select placeholder="Tất cả" allowClear
                  value={filterValues.approvalStatus || undefined}
                  onChange={(val) => setFilterValues((prev) => ({ ...prev, approvalStatus: val }))}
                  options={[{ value: 'DRAFT', label: 'Nháp' }, { value: 'PENDING', label: 'Chờ phê duyệt' }, { value: 'APPROVED', label: 'Được phê duyệt' }, { value: 'REJECTED', label: 'Từ chối' }]}
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
              </div>
              </>)}
            </>}
            statusTabs={[
              { key: 'all', label: 'Tất cả', count: totalAll || 0, color: actionPrimary, active: !activeStatusTab },
              { key: 'DRAFT', label: 'Nháp', count: tabCounts['DRAFT'] ?? 0, color: statusDraft, active: activeStatusTab === 'DRAFT' },
              { key: 'PENDING', label: 'Chờ phê duyệt', count: tabCounts['PENDING'] ?? 0, color: statusAttention, active: activeStatusTab === 'PENDING' },
              { key: 'APPROVED', label: 'Được phê duyệt', count: tabCounts['APPROVED'] ?? 0, color: statusOperational, active: activeStatusTab === 'APPROVED' },
              { key: 'REJECTED', label: 'Từ chối', count: tabCounts['REJECTED'] ?? 0, color: statusCritical, active: activeStatusTab === 'REJECTED' },
            ]}
            onStatusTabChange={(key) => {
              setActiveStatusTab(key === 'all' ? '' : key);
              setFilterApprovalStatus(key === 'all' ? undefined : key);
              if (key === 'all') { setFilterStatus(undefined); setFilterTinh(undefined); setSearch(''); }
              setPage(1);
            }}
          >
            <style>{`.list-view-table .ant-table-cell { padding-block: 8.5px !important; }`}</style>
            {isError ? null : !isLoading && dataSource.length === 0 ? (
              <DataTable dataSource={[]} rowKey="id"
                emptyState={<div style={{ padding: '40px 0', textAlign: 'center' }}><div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>📭</div><div style={{ fontSize: fontSizeLg, color: textSecondary, marginBottom: 8 }}>{search || filterTinh || filterStatus ? 'Không tìm thấy cảng biển nào phù hợp' : 'Chưa có cảng biển nào'}</div></div>}
              />
            ) : !isLoading && !isError && dataSource.length > 0 ? (
              <DataTable columns={columns}
                dataSource={[...dataSource].sort((a: any, b: any) => { if (!sortField) return 0; const aVal = a[sortField] ?? ''; const bVal = b[sortField] ?? ''; const cmp = typeof aVal === 'number' && typeof bVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal), 'vi'); return sortOrder === 'ascend' ? cmp : -cmp; })}
                rowKey="id" rowActions={rowActions} loading={false}
                onSort={(key: string, order: 'asc' | 'desc') => { setSortField(key); setSortOrder(order === 'asc' ? 'ascend' : 'descend'); setPage(1); }}
                scroll={{ x: 1400, y: 550 }}
              />
            ) : null}
            <Pagination total={total} current={page} pageSize={pageSize}
              onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
            />
          </FilterTableLayout>
        </div>
      )}

      {/* ── Create Drawer ─────────────────────────────── */}
      {!isIframeModal && (
        <Drawer
          {...drawerProps}
          title={
            <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
              Thêm mới cảng biển
            </span>
          }
          open={createModalVisible}
          onClose={() => { setCreateModalVisible(false); setInfraList([]); setUploadFileList([]); }}
          extra={<Button type="text" onClick={() => { setCreateModalVisible(false); setInfraList([]); setUploadFileList([]); }} style={drawerCloseBtnStyle}>✕</Button>}
          footer={
            <div style={drawerFooterStyle}>
              <Button onClick={() => { actionTypeRef.current = 'draft'; setActionType('draft'); createForm.submit(); }} style={outlineButtonStyle}>Lưu tạm</Button>
              {canSubmitForApproval && <Button type="primary" onClick={() => { actionTypeRef.current = 'approve'; setActionType('approve'); createForm.submit(); }} loading={submitting} style={primaryButtonStyle}>Lưu và phê duyệt</Button>}
            </div>
          }
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '0 24px 12px 24px' },
          }}
          afterOpenChange={async (open) => {
            if (open) {
              // Reset toàn bộ trước khi mở form mới
              createForm.resetFields();
              setInfraList([]);
              setUploadFileList([]);
              setGpsCoordList([]);
              setCreateTabKey('general');
              // Auto-generate mã cảng mới
              setPortCodeLoading(true);
              try {
                const res = await api.get('/v1/ports/generate-code');
                const code: string | undefined = res.data?.data?.portCode;
                if (code) {
                  createForm.setFieldsValue({ portCode: code });
                }
              } catch {
                toast.error('Không thể tạo mã cảng. Vui lòng thử lại.');
              } finally {
                setPortCodeLoading(false);
              }
            }
          }}
        >
          <style>{requiredMarkStyle}</style>
          <Form
            form={createForm}
            layout="vertical"
            onFinish={handleCreateFinish}
            onFinishFailed={handleFormFailed}
            initialValues={{ approvalStatus: 'APPROVED' }}
          >
            <Tabs activeKey={createTabKey} onChange={setCreateTabKey} tabBarStyle={{ marginBottom: 0, paddingTop: 0 }} items={[
              {
                key: 'general', label: 'Thông tin chung',
                children: (<div style={{ paddingTop: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="orgUnitId"
                    {...labelProps('Đơn vị quản lý')}
                    required
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select
                              placeholder="Chọn đơn vị quản lý"
                              allowClear
                              showSearch
                              optionFilterProp="label"
                              options={orgUnits.map((o) => ({ label: o.name, value: o.id }))}
                              style={selectStyle}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="portGroup"
                            {...labelProps('Nhóm cảng biển')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select placeholder="Chọn nhóm cảng" allowClear style={selectStyle}
                              options={[
                                { value: 1, label: 'Nhóm 1' },
                                { value: 2, label: 'Nhóm 2' },
                                { value: 3, label: 'Nhóm 3' },
                                { value: 4, label: 'Nhóm 4' },
                                { value: 5, label: 'Nhóm 5' },
                              ]}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                            name="portCode"
                            {...labelProps('Mã cảng biển')}
                            required
                            style={{ marginBottom: spaceFormField }}
                            tooltip="Mã cảng được sinh tự động, không thể chỉnh sửa"
                          >
                            <Input
                              disabled
                              placeholder={portCodeLoading ? 'Đang sinh mã...' : 'Mã tự động'}
                              maxLength={50}
                              style={{ ...inputStyle, color: '#8c8c8c', cursor: 'not-allowed' }}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="portName"
                            {...labelProps('Tên cảng biển')}
                            style={{ marginBottom: spaceFormField }}
                            rules={[
                              { required: true, message: 'Tên cảng không được để trống' },
                              { max: 255, message: 'Tên cảng tối đa 255 ký tự' },
                            ]}
                          >
                            <Input placeholder="VD: Cảng biển Hải Phòng" maxLength={255} style={inputStyle}  />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="province"
                            {...labelProps('Địa điểm (Tỉnh/Thành phố)')}
                            required
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select
                              showSearch
                              placeholder="Chọn tỉnh/thành phố..."
                              filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                              }
                              options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))}
                              style={selectStyle}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                             name="detailedLocation"
                            {...labelProps('Địa điểm chi tiết')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input placeholder="VD: Xã Đình Vũ, Quận Hải An" maxLength={500} style={inputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                             name="portClass"
                            {...labelProps('Phân cấp cảng biển')}
                            required
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select placeholder="Chọn phân cấp" allowClear style={selectStyle}
                              options={[
                                { value: 5, label: 'Cấp đặc biệt' },
                                { value: 1, label: 'Cấp 1' },
                                { value: 2, label: 'Cấp 2' },
                                { value: 3, label: 'Cấp 3' },
                                { value: 4, label: 'Cấp 4' },
                              ]}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="waterAreaScope"
                            {...labelProps('Phạm vi vùng nước cảng biển')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input placeholder="Mô tả phạm vi vùng nước cảng biển" maxLength={2000} style={inputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="totalBerths"
                            {...labelProps('Tổng số bến cảng')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="totalAnchoragesTransshipment"
                            {...labelProps('Tổng số khu neo đậu, khu chuyển tải')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="totalPublicChannels"
                            {...labelProps('Tổng số tuyến luồng hàng hải công cộng')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="totalDedicatedChannels"
                            {...labelProps('Tổng số tuyến luồng hàng hải chuyên dùng')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="totalPublicChannelLength"
                            {...labelProps('Tổng chiều dài luồng HH công cộng (km)')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="totalDedicatedChannelLength"
                            {...labelProps('Tổng chiều dài luồng HH chuyên dùng (km)')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="totalBuoysBeacons"
                            {...labelProps('Tổng số phao tiêu, báo hiệu hàng hải')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="totalDikes"
                            {...labelProps('Tổng số đê, kè')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="totalDikeLength"
                            {...labelProps('Tổng chiều dài hệ thống đê, kè (km)')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="totalLighthouses"
                            {...labelProps('Tổng số đèn biển, đăng, tiêu độc lập')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="buoyBerthCount"
                            {...labelProps('Số lượng bến phao')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="anchorageCount"
                            {...labelProps('Số lượng khu neo đậu')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="transshipmentCount"
                            {...labelProps('Số lượng khu chuyển tải')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="otherWaterAreas"
                            {...labelProps('Các khu nước, vùng nước khác')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input placeholder="Mô tả" maxLength={2000}  style={inputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={24}>
                          <Form.Item
                            name="remarks"
                            {...labelProps('Ghi chú')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input.TextArea rows={3} placeholder="Ghi chú" maxLength={2000}
                              styles={{ textarea: { borderRadius: radiusPill, resize: 'none' } }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                </div>)
              },
              {
                key: 'gis', label: 'Thông tin vị trí',
                children: (<div style={{ paddingTop: 16 }}>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                             name="geometryType"
                            {...labelProps('Loại đối tượng')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select
                              placeholder="Chọn loại đối tượng"
                              options={[
                                { value: 'POINT', label: 'Đối tượng điểm' },
                                { value: 'LINE', label: 'Đối tượng đường' },
                                { value: 'POLYGON', label: 'Đối tượng vùng' },
                              ]}
                              style={selectStyle}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                             name="mapSymbolId"
                            {...labelProps('Biểu tượng bản đồ')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select
                              placeholder="Chọn biểu tượng hiển thị"
                              allowClear
                              showSearch
                              optionFilterProp="label"
                              disabled={!createGeometryType}
                              style={selectStyle}
                            >
                              {symbols.map((sym) => (
                                <Select.Option key={sym.id} value={sym.id} label={sym.code ? `${sym.name} (${sym.code})` : sym.name}>
                                  <Space>
                                    {sym.image && (
                                      <img
                                        src={
                                          sym.image.startsWith('data:')
                                            ? sym.image
                                            : `data:image/png;base64,${sym.image}`
                                        }
                                        alt={sym.name}
                                        style={{ width: 20, height: 20, objectFit: 'contain' }}
                                      />
                                    )}
                                    <span>
                                      {sym.code ? `${sym.name} (${sym.code})` : sym.name}
                                    </span>
                                  </Space>
                                </Select.Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                             name="coordinateSystem"
                            {...labelProps('Hệ quy chiếu')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select placeholder="Chọn hệ quy chiếu" disabled style={selectStyle}
                              options={[
                                { value: 1, label: 'WGS-84' },
                                { value: 2, label: 'VN-2000' },
                              ]}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                             name="displayRule"
                            {...labelProps('Quy tắc hiển thị')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input placeholder="VD: Hiển thị mặc định" maxLength={255} disabled style={{ ...inputStyle, color: '#8c8c8c', cursor: 'not-allowed' }} />
                          </Form.Item>
                        </Col>
                      </Row>
                      {/* GPS Coordinates (DMS) */}
                      <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>
                          <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tọa độ GPS</span>
                          <span style={{ color: colors.error, marginLeft: 4, fontSize: fontSizeMd }}>*</span>
                        </span>
                        {gpsCoordList.length > 0 && (
                          <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addGpsPoint} style={{ borderRadius: radiusPill }}>
                            Thêm tọa độ
                          </Button>
                        )}
                      </div>
                      {gpsCoordList.length === 0 ? (
                        <div style={{
                          padding: '32px 16px',
                          textAlign: 'center',
                          border: `1px dashed ${borderDefault}`,
                          borderRadius: radiusMd,
                          background: surfaceCard,
                        }}>
                          <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>
                            Chưa có tọa độ nào.
                          </span>
                          <Button type="dashed" icon={<PlusOutlined />} onClick={addGpsPoint} style={{ borderRadius: radiusPill }}>
                            Thêm tọa độ
                          </Button>
                        </div>
                      ) : (
                        <Table
                          className="list-view-table"
                          dataSource={gpsCoordList.map((c, i) => ({ ...c, key: i, _idx: i }))}
                          pagination={false}
                          size="middle"
                          bordered
                          scroll={{ x: 820 }}
                        >
                          <Table.Column
                            title="STT"
                            dataIndex="_idx"
                            key="stt"
                            width={60}
                            align="center"
                            render={(_: any, __: any, i: number) => (
                              <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{i + 1}</span>
                            )}
                            onHeaderCell={() => ({
                              style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' },
                            })}
                          />
                          <Table.Column
                            title="Vĩ độ (N)"
                            key="lat"
                            render={(_: any, record: any) => {
                              const dms = ddToDms(record.lat);
                              return (
                                <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}>
                                  <InputNumber value={dms.d} min={0} max={90} placeholder="Độ"
                                    onChange={(v) => updateGpsPoint(record._idx, 'lat', v ?? 0, dms.m, dms.s)}
                                    style={{ flex: 1 }} controls={false} />
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'center', padding: '0 6px',
                                    background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0,
                                    fontSize: fontSizeSm, color: textTertiary,
                                  }}>°</span>
                                  <InputNumber value={dms.m} min={0} max={59} placeholder="Phút"
                                    onChange={(v) => updateGpsPoint(record._idx, 'lat', dms.d, v ?? 0, dms.s)}
                                    style={{ flex: 1 }} controls={false} />
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'center', padding: '0 6px',
                                    background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0,
                                    fontSize: fontSizeSm, color: textTertiary,
                                  }}>'</span>
                                  <InputNumber value={dms.s} min={0} max={59.99} step={0.01} placeholder="Giây"
                                    onChange={(v) => updateGpsPoint(record._idx, 'lat', dms.d, dms.m, v ?? 0)}
                                    style={{ flex: 1.2 }} controls={false} />
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'center', padding: '0 6px',
                                    background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0,
                                    fontSize: fontSizeSm, color: textTertiary,
                                  }}>"</span>
                                </Space.Compact>
                              );
                            }}
                            onHeaderCell={() => ({
                              style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' },
                            })}
                          />
                          <Table.Column
                            title="Kinh độ (E)"
                            key="lng"
                            render={(_: any, record: any) => {
                              const dms = ddToDms(record.lng);
                              return (
                                <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}>
                                  <InputNumber value={dms.d} min={0} max={180} placeholder="Độ"
                                    onChange={(v) => updateGpsPoint(record._idx, 'lng', v ?? 0, dms.m, dms.s)}
                                    style={{ flex: 1 }} controls={false} />
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'center', padding: '0 6px',
                                    background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0,
                                    fontSize: fontSizeSm, color: textTertiary,
                                  }}>°</span>
                                  <InputNumber value={dms.m} min={0} max={59} placeholder="Phút"
                                    onChange={(v) => updateGpsPoint(record._idx, 'lng', dms.d, v ?? 0, dms.s)}
                                    style={{ flex: 1 }} controls={false} />
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'center', padding: '0 6px',
                                    background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0,
                                    fontSize: fontSizeSm, color: textTertiary,
                                  }}>'</span>
                                  <InputNumber value={dms.s} min={0} max={59.99} step={0.01} placeholder="Giây"
                                    onChange={(v) => updateGpsPoint(record._idx, 'lng', dms.d, dms.m, v ?? 0)}
                                    style={{ flex: 1.2 }} controls={false} />
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'center', padding: '0 6px',
                                    background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0,
                                    fontSize: fontSizeSm, color: textTertiary,
                                  }}>"</span>
                                </Space.Compact>
                              );
                            }}
                            onHeaderCell={() => ({
                              style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' },
                            })}
                          />
                          <Table.Column
                            title=""
                            key="actions"
                            width={44}
                            align="center"
                            render={(_: any, record: any) => (
                              <Button type="link" danger size="small" icon={<DeleteOutlined />}
                                onClick={() => removeGpsPoint(record._idx)} />
                            )}
                            onHeaderCell={() => ({
                              style: { background: colors.bodyBg, padding: '12px 6px' },
                            })}
                          />
                        </Table>
                      )}
                </div>)
              },
              {
                key: 'infra', label: 'Công trình KCHT',
                children: (<div style={{ paddingTop: 16 }}>
                      {/* Infra label + add button */}
                      <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Công trình KCHT</span>
                        {infraList.length > 0 && (
                          <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addInfra} style={{ borderRadius: radiusPill }}>
                            Thêm công trình
                          </Button>
                        )}
                      </div>
                      {infraList.length === 0 ? (
                        <div style={{
                          padding: '32px 16px', textAlign: 'center',
                          border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard,
                        }}>
                          <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>
                            Chưa có công trình nào.
                          </span>
                          <Button type="dashed" icon={<PlusOutlined />} onClick={addInfra} style={{ borderRadius: radiusPill }}>
                            Thêm công trình
                          </Button>
                        </div>
                      ) : (
                        <Table
                          className="list-view-table"
                          dataSource={infraList.map((inf, i) => ({ ...inf, key: i, _idx: i }))}
                          pagination={false}
                          size="middle"
                          bordered
                          scroll={{ x: 600 }}
                        >
                          <Table.Column
                            title="STT"
                            dataIndex="stt"
                            key="stt"
                            width={60}
                            align="center"
                            render={(val: number) => (
                              <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{val}</span>
                            )}
                            onHeaderCell={() => ({
                              style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' },
                            })}
                          />
                          <Table.Column
                            title="Tên Công Trình"
                            key="name"
                            align="center"
                            render={(_: any, record: any) => (
                              <Input
                                value={record.infraName}
                                onChange={(e) => updateInfraName(record._idx, e.target.value)}
                                placeholder="Nhập tên công trình"
                                maxLength={500}
                                showCount
                                style={{ borderRadius: radiusPill, height: 40 }}
                              />
                            )}
                            onHeaderCell={() => ({
                              style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' },
                            })}
                          />
                          <Table.Column
                            title="Số Lượng"
                            key="quantity"
                            width={100}
                            align="center"
                            render={(_: any, record: any) => {
                              const val = record.quantity;
                              return (
                                <div style={{ position: 'relative' }}>
                                  <InputNumber
                                    value={val}
                                    onChange={(v) => updateInfraQty(record._idx, v)}
                                    placeholder="1-5"
                                    min={0}
                                    max={5}
                                    style={{ width: '100%', borderRadius: radiusPill, paddingRight: 32 }}
                                  />
                                  <span style={{
                                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                                    fontSize: fontSizeSm, color: textTertiary, pointerEvents: 'none',
                                  }}>{val ?? 0}/5</span>
                                </div>
                              );
                            }}
                            onHeaderCell={() => ({
                              style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' },
                            })}
                          />
                          <Table.Column
                            title=""
                            key="actions"
                            width={44}
                            align="center"
                            render={(_: any, record: any) => (
                              <Button type="link" danger size="small" icon={<DeleteOutlined />}
                                onClick={() => removeInfra(record._idx)} />
                            )}
                            onHeaderCell={() => ({
                              style: { background: colors.bodyBg, padding: '12px 6px' },
                            })}
                          />
                        </Table>
                      )}
                </div>)
              },
              {
                key: 'files', label: 'File đính kèm',
                children: (<div style={{ paddingTop: 16 }}>
                      {/* File label + add button */}
                      <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>File đính kèm</span>
                        {uploadFileList.length > 0 && (
                          <Upload
                            beforeUpload={(file) => {
                              if (file.size > 20 * 1024 * 1024) { message.error('File vượt quá 20MB'); return false; }
                              const ext = file.name.split('.').pop()?.toLowerCase();
                              if (!ext || !['pdf','doc','docx','xls','xlsx','jpg','jpeg','png','tiff','tif'].includes(ext)) { message.error('Định dạng không hỗ trợ'); return false; }
                              if (uploadFileList.length >= 10) { message.error('Tối đa 10 file'); return false; }
                              setUploadFileList([...uploadFileList, { uid: `${Date.now()}`, name: file.name, status: 'done', originFileObj: file }]);
                              return false;
                            }}
                            showUploadList={false}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif"
                            multiple
                          >
                            <Button type="dashed" size="small" icon={<PlusOutlined />} style={{ borderRadius: radiusPill }}>
                              Thêm file
                            </Button>
                          </Upload>
                        )}
                      </div>
                      {uploadFileList.length === 0 ? (
                        <div style={{
                          padding: '32px 16px', textAlign: 'center',
                          border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard,
                        }}>
                          <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>
                            Chưa có file đính kèm.
                          </span>
                          <Upload
                            beforeUpload={(file) => {
                              if (file.size > 20 * 1024 * 1024) { message.error('File vượt quá 20MB'); return false; }
                              const ext = file.name.split('.').pop()?.toLowerCase();
                              if (!ext || !['pdf','doc','docx','xls','xlsx','jpg','jpeg','png','tiff','tif'].includes(ext)) { message.error('Định dạng không hỗ trợ'); return false; }
                              setUploadFileList([...uploadFileList, { uid: `${Date.now()}`, name: file.name, status: 'done', originFileObj: file }]);
                              return false;
                            }}
                            showUploadList={false}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif"
                            multiple
                          >
                            <Button type="dashed" icon={<UploadOutlined />} style={{ borderRadius: radiusPill }}>
                              Chọn file
                            </Button>
                          </Upload>
                        </div>
                      ) : (
                        <Table
                          className="list-view-table"
                          dataSource={uploadFileList.map((f, i) => ({ ...f, key: f.uid, _idx: i }))}
                          pagination={false}
                          size="middle"
                          bordered
                          scroll={{ x: 400 }}
                        >
                          <Table.Column
                            title="STT"
                            key="stt"
                            width={60}
                            align="center"
                            render={(_: any, __: any, i: number) => (
                              <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{i + 1}</span>
                            )}
                            onHeaderCell={() => ({
                              style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' },
                            })}
                          />
                          <Table.Column
                            title="Tên file"
                            key="name"
                            dataIndex="name"
                            render={(name: string) => (
                              <span style={{ fontSize: fontSizeMd, color: textPrimary }}>
                                <FileOutlined style={{ marginRight: spaceSm, color: textTertiary }} />
                                {name}
                              </span>
                            )}
                            onHeaderCell={() => ({
                              style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' },
                            })}
                          />
                          <Table.Column
                            title=""
                            key="actions"
                            width={44}
                            align="center"
                            render={(_: any, record: any) => (
                              <Button type="link" danger size="small" icon={<DeleteOutlined />}
                                onClick={() => setUploadFileList(uploadFileList.filter(x => x.uid !== record.uid))} />
                            )}
                            onHeaderCell={() => ({
                              style: { background: colors.bodyBg, padding: '12px 6px' },
                            })}
                          />
                        </Table>
                      )}
                      <div style={{ marginTop: spaceSm }}>
                        <span style={uploadHintStyle}>
                          Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF. Tối đa 10 file, mỗi file ≤20MB.
                        </span>
                      </div>
                </div>)
              }
            ]} />
          </Form>
        </Drawer>
      )}

      {/* ── Edit Drawer ──────────────────────────────────────────────── */}
      {!isIframeModal && (
        <Drawer
          {...drawerProps}
          title={
            <span style={drawerTitleStyle}>
              {selectedRecord
                ? `Chỉnh sửa — ${selectedRecord.portName}`
                : 'Chỉnh sửa cảng biển'}
            </span>
          }
          open={updateModalVisible}
          onClose={closeUpdateModal}
          extra={<Button type="text" onClick={closeUpdateModal} style={drawerCloseBtnStyle}>✕</Button>}
          footer={
            <div style={drawerFooterStyle}>
              <Button type="primary" htmlType="submit" loading={submitting} onClick={() => updateForm.submit()} style={primaryButtonStyle}>Cập nhật</Button>
            </div>
          }
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '0 24px 12px 24px' },
          }}
        >
          <style>{requiredMarkStyle}</style>
          <Form
            form={updateForm}
            layout="vertical"
            onFinish={handleUpdateFinish}
            onFinishFailed={handleFormFailed}
          >
            <Tabs
              defaultActiveKey="general"
              tabBarStyle={{ marginBottom: 0, paddingTop: 0 }}
              items={[
                {
                  key: 'general',
                  label: 'Thông tin chung',
                  children: (
                    <div style={{ paddingTop: 16 }}>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="orgUnitId"
                            {...labelProps('Đơn vị quản lý')}
                            required
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select
                              placeholder="Chọn đơn vị quản lý"
                              allowClear
                              showSearch
                              optionFilterProp="label"
                              options={orgUnits.map((o) => ({ label: o.name, value: o.id }))}
                              style={selectStyle}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="portGroup"
                            {...labelProps('Nhóm cảng biển')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select placeholder="Chọn nhóm cảng" allowClear style={selectStyle}
                              options={[
                                { value: 1, label: 'Nhóm 1' },
                                { value: 2, label: 'Nhóm 2' },
                                { value: 3, label: 'Nhóm 3' },
                                { value: 4, label: 'Nhóm 4' },
                                { value: 5, label: 'Nhóm 5' },
                              ]}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="portCode"
                            {...labelProps('Mã cảng biển')}
                            required
                            style={{ marginBottom: spaceFormField }}
                            tooltip="Mã cảng được sinh tự động, không thể chỉnh sửa"
                          >
                            <Input
                              disabled
                              placeholder="Mã tự động"
                              maxLength={50}
                              style={{ ...inputStyle, color: '#8c8c8c', cursor: 'not-allowed' }}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="portName"
                            {...labelProps('Tên cảng biển')}
                            style={{ marginBottom: spaceFormField }}
                            rules={[
                              { required: true, message: 'Tên cảng không được để trống' },
                              { max: 255, message: 'Tên cảng tối đa 255 ký tự' },
                            ]}
                          >
                            <Input placeholder="VD: Cảng biển Hải Phòng" maxLength={255} style={inputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="province"
                            {...labelProps('Địa điểm (Tỉnh/Thành phố)')}
                            required
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select
                              showSearch
                              placeholder="Chọn tỉnh/thành phố..."
                              filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                              }
                              options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))}
                              style={selectStyle}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="detailedLocation"
                            {...labelProps('Địa điểm chi tiết')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input placeholder="VD: Xã Đình Vũ, Quận Hải An" maxLength={500} style={inputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="portClass"
                            {...labelProps('Phân cấp cảng biển')}
                            required
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select placeholder="Chọn phân cấp" allowClear style={selectStyle}
                              options={[
                                { value: 5, label: 'Cấp đặc biệt' },
                                { value: 1, label: 'Cấp 1' },
                                { value: 2, label: 'Cấp 2' },
                                { value: 3, label: 'Cấp 3' },
                                { value: 4, label: 'Cấp 4' },
                              ]}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="waterAreaScope"
                            {...labelProps('Phạm vi vùng nước cảng biển')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input placeholder="Mô tả phạm vi vùng nước cảng biển" maxLength={2000} style={inputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="totalBerths"
                            {...labelProps('Tổng số bến cảng')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="totalAnchoragesTransshipment"
                            {...labelProps('Tổng số khu neo đậu, khu chuyển tải')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="totalPublicChannels"
                            {...labelProps('Tổng số tuyến luồng hàng hải công cộng')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="totalDedicatedChannels"
                            {...labelProps('Tổng số tuyến luồng hàng hải chuyên dùng')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="totalPublicChannelLength"
                            {...labelProps('Tổng chiều dài luồng HH công cộng (km)')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="totalDedicatedChannelLength"
                            {...labelProps('Tổng chiều dài luồng HH chuyên dùng (km)')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="totalBuoysBeacons"
                            {...labelProps('Tổng số phao tiêu, báo hiệu hàng hải')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="totalDikes"
                            {...labelProps('Tổng số đê, kè')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="totalDikeLength"
                            {...labelProps('Tổng chiều dài hệ thống đê, kè (km)')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="totalLighthouses"
                            {...labelProps('Tổng số đèn biển, đăng, tiêu độc lập')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="buoyBerthCount"
                            {...labelProps('Số lượng bến phao')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="anchorageCount"
                            {...labelProps('Số lượng khu neo đậu')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="transshipmentCount"
                            {...labelProps('Số lượng khu chuyển tải')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="otherWaterAreas"
                            {...labelProps('Các khu nước, vùng nước khác')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input placeholder="Mô tả" maxLength={2000} style={inputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={24}>
                          <Form.Item
                            name="remarks"
                            {...labelProps('Ghi chú')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input.TextArea rows={3} placeholder="Ghi chú" maxLength={2000}
                              styles={{ textarea: { borderRadius: radiusPill, resize: 'none' } }}
                            />
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
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item name="geometryType" {...labelProps('Loại đối tượng')} style={{ marginBottom: spaceFormField }}>
                            <Select style={selectStyle} options={[
                              { value: 'POINT', label: 'Đối tượng điểm' },
                              { value: 'LINE', label: 'Đối tượng đường' },
                              { value: 'POLYGON', label: 'Đối tượng vùng' },
                            ]} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="mapSymbolId" {...labelProps('Biểu tượng bản đồ')} style={{ marginBottom: spaceFormField }}>
                            <Select
                              placeholder="Chọn biểu tượng"
                              allowClear
                              showSearch
                              optionFilterProp="label"
                              disabled={!updateGeometryType}
                              style={selectStyle}
                            >
                              {symbols.map((sym) => (
                                <Select.Option key={sym.id} value={sym.id} label={sym.code ? `${sym.name} (${sym.code})` : sym.name}>
                                  <Space>
                                    {sym.image && (
                                      <img
                                        src={
                                          sym.image.startsWith('data:')
                                            ? sym.image
                                            : `data:image/png;base64,${sym.image}`
                                        }
                                        alt={sym.name}
                                        style={{ width: 20, height: 20, objectFit: 'contain' }}
                                      />
                                    )}
                                    <span>{sym.code ? `${sym.name} (${sym.code})` : sym.name}</span>
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
                            <Select style={selectStyle} disabled options={[
                              { value: 1, label: 'WGS-84' }, { value: 2, label: 'VN-2000' },
                            ]} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="displayRule" {...labelProps('Quy tắc hiển thị')} style={{ marginBottom: spaceFormField }}>
                            <Input placeholder="VD: display_rule_1" disabled style={{ ...inputStyle, color: '#8c8c8c', cursor: 'not-allowed' }} />
                          </Form.Item>
                        </Col>
                      </Row>
                      {/* GPS Coordinates (DMS) */}
                      <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>
                          <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tọa độ GPS</span>
                          <span style={{ color: colors.error, marginLeft: 4, fontSize: fontSizeMd }}>*</span>
                        </span>
                        {gpsCoordList.length > 0 && (
                          <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addGpsPoint} style={{ borderRadius: radiusPill }}>
                            Thêm tọa độ
                          </Button>
                        )}
                      </div>
                      {gpsCoordList.length === 0 ? (
                        <div style={{
                          padding: '32px 16px',
                          textAlign: 'center',
                          border: `1px dashed ${borderDefault}`,
                          borderRadius: radiusMd,
                          background: surfaceCard,
                        }}>
                          <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>
                            Chưa có tọa độ nào.
                          </span>
                          <Button type="dashed" icon={<PlusOutlined />} onClick={addGpsPoint} style={{ borderRadius: radiusPill }}>
                            Thêm tọa độ
                          </Button>
                        </div>
                      ) : (
                        <Table
                          className="list-view-table"
                          dataSource={gpsCoordList.map((c, i) => ({ ...c, key: i, _idx: i }))}
                          pagination={false}
                          size="middle"
                          bordered
                          scroll={{ x: 820 }}
                        >
                          <Table.Column
                            title="STT"
                            dataIndex="_idx"
                            key="stt"
                            width={60}
                            align="center"
                            render={(_: any, __: any, i: number) => (
                              <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{i + 1}</span>
                            )}
                            onHeaderCell={() => ({
                              style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' },
                            })}
                          />
                          <Table.Column
                            title="Vĩ độ (N)"
                            key="lat"
                            render={(_: any, record: any) => {
                              const dms = ddToDms(record.lat);
                              return (
                                <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}>
                                  <InputNumber value={dms.d} min={0} max={90} placeholder="Độ"
                                    onChange={(v) => updateGpsPoint(record._idx, 'lat', v ?? 0, dms.m, dms.s)}
                                    style={{ flex: 1 }} controls={false} />
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'center', padding: '0 6px',
                                    background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0,
                                    fontSize: fontSizeSm, color: textTertiary,
                                  }}>°</span>
                                  <InputNumber value={dms.m} min={0} max={59} placeholder="Phút"
                                    onChange={(v) => updateGpsPoint(record._idx, 'lat', dms.d, v ?? 0, dms.s)}
                                    style={{ flex: 1 }} controls={false} />
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'center', padding: '0 6px',
                                    background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0,
                                    fontSize: fontSizeSm, color: textTertiary,
                                  }}>'</span>
                                  <InputNumber value={dms.s} min={0} max={59.99} step={0.01} placeholder="Giây"
                                    onChange={(v) => updateGpsPoint(record._idx, 'lat', dms.d, dms.m, v ?? 0)}
                                    style={{ flex: 1.2 }} controls={false} />
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'center', padding: '0 6px',
                                    background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0,
                                    fontSize: fontSizeSm, color: textTertiary,
                                  }}>"</span>
                                </Space.Compact>
                              );
                            }}
                            onHeaderCell={() => ({
                              style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' },
                            })}
                          />
                          <Table.Column
                            title="Kinh độ (E)"
                            key="lng"
                            render={(_: any, record: any) => {
                              const dms = ddToDms(record.lng);
                              return (
                                <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}>
                                  <InputNumber value={dms.d} min={0} max={180} placeholder="Độ"
                                    onChange={(v) => updateGpsPoint(record._idx, 'lng', v ?? 0, dms.m, dms.s)}
                                    style={{ flex: 1 }} controls={false} />
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'center', padding: '0 6px',
                                    background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0,
                                    fontSize: fontSizeSm, color: textTertiary,
                                  }}>°</span>
                                  <InputNumber value={dms.m} min={0} max={59} placeholder="Phút"
                                    onChange={(v) => updateGpsPoint(record._idx, 'lng', dms.d, v ?? 0, dms.s)}
                                    style={{ flex: 1 }} controls={false} />
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'center', padding: '0 6px',
                                    background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0,
                                    fontSize: fontSizeSm, color: textTertiary,
                                  }}>'</span>
                                  <InputNumber value={dms.s} min={0} max={59.99} step={0.01} placeholder="Giây"
                                    onChange={(v) => updateGpsPoint(record._idx, 'lng', dms.d, dms.m, v ?? 0)}
                                    style={{ flex: 1.2 }} controls={false} />
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'center', padding: '0 6px',
                                    background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0,
                                    fontSize: fontSizeSm, color: textTertiary,
                                  }}>"</span>
                                </Space.Compact>
                              );
                            }}
                            onHeaderCell={() => ({
                              style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' },
                            })}
                          />
                          <Table.Column
                            title=""
                            key="actions"
                            width={44}
                            align="center"
                            render={(_: any, record: any) => (
                              <Button type="link" danger size="small" icon={<DeleteOutlined />}
                                onClick={() => removeGpsPoint(record._idx)} />
                            )}
                            onHeaderCell={() => ({
                              style: { background: colors.bodyBg, padding: '12px 6px' },
                            })}
                          />
                        </Table>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'infrastructure',
                  label: 'Kết cấu hạ tầng',
                  children: (
                    <div style={{ paddingTop: 16 }}>
                      {/* Infra label + add button */}
                      <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Kết cấu hạ tầng</span>
                        {infraList.length > 0 && (
                          <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addInfra} style={{ borderRadius: radiusPill }}>
                            Thêm công trình
                          </Button>
                        )}
                      </div>
                      {infraList.length === 0 ? (
                        <div style={{
                          padding: '32px 16px', textAlign: 'center',
                          border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard,
                        }}>
                          <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>
                            Chưa có công trình nào.
                          </span>
                          <Button type="dashed" icon={<PlusOutlined />} onClick={addInfra} style={{ borderRadius: radiusPill }}>
                            Thêm công trình
                          </Button>
                        </div>
                      ) : (
                        <Table
                          className="list-view-table"
                          dataSource={infraList.map((inf, i) => ({ ...inf, key: i, _idx: i }))}
                          pagination={false}
                          size="middle"
                          bordered
                          scroll={{ x: 600 }}
                        >
                          <Table.Column
                            title="STT"
                            dataIndex="stt"
                            key="stt"
                            width={60}
                            align="center"
                            render={(val: number) => (
                              <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{val}</span>
                            )}
                            onHeaderCell={() => ({
                              style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' },
                            })}
                          />
                          <Table.Column
                            title="Tên Công Trình"
                            key="name"
                            align="center"
                            render={(_: any, record: any) => (
                              <Input
                                value={record.infraName}
                                onChange={(e) => updateInfraName(record._idx, e.target.value)}
                                placeholder="Nhập tên công trình"
                                maxLength={500}
                                showCount
                                style={{ borderRadius: radiusPill, height: 40 }}
                              />
                            )}
                            onHeaderCell={() => ({
                              style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' },
                            })}
                          />
                          <Table.Column
                            title="Số Lượng"
                            key="quantity"
                            width={100}
                            align="center"
                            render={(_: any, record: any) => {
                              const val = record.quantity;
                              return (
                                <div style={{ position: 'relative' }}>
                                  <InputNumber
                                    value={val}
                                    onChange={(v) => updateInfraQty(record._idx, v)}
                                    placeholder="1-5"
                                    min={0}
                                    max={5}
                                    style={{ width: '100%', borderRadius: radiusPill, paddingRight: 32 }}
                                  />
                                  <span style={{
                                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                                    fontSize: fontSizeSm, color: textTertiary, pointerEvents: 'none',
                                  }}>{val ?? 0}/5</span>
                                </div>
                              );
                            }}
                            onHeaderCell={() => ({
                              style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' },
                            })}
                          />
                          <Table.Column
                            title=""
                            key="actions"
                            width={44}
                            align="center"
                            render={(_: any, record: any) => (
                              <Button type="link" danger size="small" icon={<DeleteOutlined />}
                                onClick={() => removeInfra(record._idx)} />
                            )}
                            onHeaderCell={() => ({
                              style: { background: colors.bodyBg, padding: '12px 6px' },
                            })}
                          />
                        </Table>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'attachments',
                  label: 'File đính kèm',
                  children: (
                    <div style={{ paddingTop: 16 }}>
                      {/* File label + add button */}
                      <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>File đính kèm</span>
                        {uploadFileList.length > 0 && (
                          <Upload
                            beforeUpload={(file) => {
                              if (file.size > 20 * 1024 * 1024) { message.error('File vượt quá 20MB'); return false; }
                              const ext = file.name.split('.').pop()?.toLowerCase();
                              if (!ext || !['pdf','doc','docx','xls','xlsx','jpg','jpeg','png','tiff','tif'].includes(ext)) { message.error('Định dạng không hỗ trợ'); return false; }
                              if (uploadFileList.length >= 10) { message.error('Tối đa 10 file'); return false; }
                              setUploadFileList([...uploadFileList, { uid: `${Date.now()}`, name: file.name, status: 'done', originFileObj: file }]);
                              return false;
                            }}
                            showUploadList={false}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif"
                            multiple
                          >
                            <Button type="dashed" size="small" icon={<PlusOutlined />} style={{ borderRadius: radiusPill }}>
                              Thêm file
                            </Button>
                          </Upload>
                        )}
                      </div>
                      {uploadFileList.length === 0 ? (
                        <div style={{
                          padding: '32px 16px', textAlign: 'center',
                          border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard,
                        }}>
                          <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>
                            Chưa có file đính kèm.
                          </span>
                          <Upload
                            beforeUpload={(file) => {
                              if (file.size > 20 * 1024 * 1024) { message.error('File vượt quá 20MB'); return false; }
                              const ext = file.name.split('.').pop()?.toLowerCase();
                              if (!ext || !['pdf','doc','docx','xls','xlsx','jpg','jpeg','png','tiff','tif'].includes(ext)) { message.error('Định dạng không hỗ trợ'); return false; }
                              setUploadFileList([...uploadFileList, { uid: `${Date.now()}`, name: file.name, status: 'done', originFileObj: file }]);
                              return false;
                            }}
                            showUploadList={false}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif"
                            multiple
                          >
                            <Button type="dashed" icon={<UploadOutlined />} style={{ borderRadius: radiusPill }}>
                              Chọn file
                            </Button>
                          </Upload>
                        </div>
                      ) : (
                        <Table
                          className="list-view-table"
                          dataSource={uploadFileList.map((f, i) => ({ ...f, key: f.uid, _idx: i }))}
                          pagination={false}
                          size="middle"
                          bordered
                          scroll={{ x: 400 }}
                        >
                          <Table.Column
                            title="STT"
                            key="stt"
                            width={60}
                            align="center"
                            render={(_: any, __: any, i: number) => (
                              <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{i + 1}</span>
                            )}
                            onHeaderCell={() => ({
                              style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' },
                            })}
                          />
                          <Table.Column
                            title="Tên file"
                            key="name"
                            dataIndex="name"
                            render={(name: string) => (
                              <span style={{ fontSize: fontSizeMd, color: textPrimary }}>
                                <FileOutlined style={{ marginRight: spaceSm, color: textTertiary }} />
                                {name}
                              </span>
                            )}
                            onHeaderCell={() => ({
                              style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' },
                            })}
                          />
                          <Table.Column
                            title=""
                            key="actions"
                            width={44}
                            align="center"
                            render={(_: any, record: any) => (
                              <Button type="link" danger size="small" icon={<DeleteOutlined />}
                                onClick={() => setUploadFileList(uploadFileList.filter(x => x.uid !== record.uid))} />
                            )}
                            onHeaderCell={() => ({
                              style: { background: colors.bodyBg, padding: '12px 6px' },
                            })}
                          />
                        </Table>
                      )}
                      <div style={{ marginTop: spaceSm }}>
                        <span style={uploadHintStyle}>
                          Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF. Tối đa 10 file, mỗi file ≤20MB.
                        </span>
                      </div>
                    </div>
                  ),
                },
              ]}
            />

          </Form>
        </Drawer>
      )}

      {/* ── Detail Drawer ──────────────────────────────────────────── */}
      {!isIframeModal && (
        <Drawer
          {...drawerProps}
          title={
            selectedRecord
              ? <span style={drawerTitleStyle}>Xem chi tiết cảng biển - {selectedRecord.portName}</span>
              : <span style={drawerTitleStyle}>Xem chi tiết cảng biển</span>
          }
          open={detailModalVisible}
          onClose={closeDetailModal}
          extra={<Button type="text" onClick={closeDetailModal} style={drawerCloseBtnStyle}>✕</Button>}
          footer={null}
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '0 24px 12px 24px' },
          }}
        >
          {selectedRecord && (
            <Tabs
              defaultActiveKey="general"
              tabBarStyle={{ marginBottom: 0, paddingTop: 0 }}
              items={[
                {
                  key: 'general', label: 'Thông tin chung',
                  children: (
                    <div style={{ paddingTop: 16 }}>
                      <style>{`.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; } .detail-row { display: flex; padding: 10px 12px; border-bottom: 1px solid ${borderDefault}; } .detail-label { width: 200px; flex-shrink: 0; color: ${colors.sidebarBg}; font-weight: ${fontWeightBold}; font-size: ${fontSizeMd}px; } .detail-label::after { content: ':'; margin-left: 2px; } .detail-value { color: ${textPrimary}; font-size: ${fontSizeMd}px; flex: 1; } .ant-tabs-nav{margin-bottom:0!important;padding-left:12px!important}`}</style>
                      <div className="detail-grid">
                      {[
                        ['Đơn vị quản lý', selectedRecord.orgUnitId ? (orgUnits.find((o) => o.id === selectedRecord.orgUnitId)?.name || '—') : '—'],
                        ['Nhóm cảng biển', selectedRecord.portGroup ? 'Nhóm ' + selectedRecord.portGroup : '—'],
                        ['Mã cảng biển', selectedRecord.portCode],
                        ['Tên cảng biển', selectedRecord.portName],
                        ['Địa điểm (Tỉnh/Thành phố)', selectedRecord.province || '—'],
                        ['Địa điểm chi tiết', selectedRecord.detailedLocation || '—'],
                        ['Phân cấp cảng biển', selectedRecord.portClass != null ? (selectedRecord.portClass === 5 ? 'Cấp đặc biệt' : `Cấp ${selectedRecord.portClass}`) : '—'],
                        ['Trạng thái phê duyệt', selectedRecord.approvalStatus ? (() => { const b = trangThaiPheDuyetBadge(selectedRecord.approvalStatus); let c = textTertiary; if (b.color === 'green') c = statusOperational; else if (b.color === 'red') c = statusCritical; else if (b.color === 'orange') c = statusAttention; else if (b.color === 'blue') c = actionPrimary; return <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${c}15`, color: c }}>{b.label}</span>; })() : '—'],
                        ['Phạm vi vùng nước cảng biển', selectedRecord.waterAreaScope || '—'],
                        ['Tổng số bến cảng', selectedRecord.totalBerths ?? '—'],
                        ['Tổng số khu neo đậu, khu chuyển tải', selectedRecord.totalAnchoragesTransshipment ?? '—'],
                        ['Tổng số tuyến luồng hàng hải công cộng', selectedRecord.totalPublicChannels ?? '—'],
                        ['Tổng số tuyến luồng hàng hải chuyên dùng', selectedRecord.totalDedicatedChannels ?? '—'],
                        ['Tổng chiều dài luồng HH công cộng (km)', selectedRecord.totalPublicChannelLength != null ? selectedRecord.totalPublicChannelLength.toFixed(2) : '—'],
                        ['Tổng chiều dài luồng HH chuyên dùng (km)', selectedRecord.totalDedicatedChannelLength != null ? selectedRecord.totalDedicatedChannelLength.toFixed(2) : '—'],
                        ['Tổng số phao tiêu, báo hiệu hàng hải', selectedRecord.totalBuoysBeacons ?? '—'],
                        ['Tổng số đê, kè', selectedRecord.totalDikes ?? '—'],
                        ['Tổng chiều dài hệ thống đê, kè (km)', selectedRecord.totalDikeLength != null ? selectedRecord.totalDikeLength.toFixed(2) : '—'],
                        ['Tổng số đèn biển, đăng, tiêu độc lập', selectedRecord.totalLighthouses ?? '—'],
                        ['Số lượng bến phao', selectedRecord.buoyBerthCount ?? '—'],
                        ['Số lượng khu neo đậu', selectedRecord.anchorageCount ?? '—'],
                        ['Số lượng khu chuyển tải', selectedRecord.transshipmentCount ?? '—'],
                        ['Các khu nước, vùng nước khác', selectedRecord.otherWaterAreas || '—'],
                        ['Ghi chú', selectedRecord.remarks || '—'],
                      ].map(([label, value], i) => (
                        <div key={i} className="detail-row">
                          <span className="detail-label">{label}</span>
                          <span className="detail-value">{value}</span>
                        </div>
                      ))}
                      </div>
                      <div style={{ cursor: 'pointer', marginTop: 10, paddingLeft: 12 }} onClick={() => setPortSystemOpen(!portSystemOpen)}>
                        <span style={{ color: portSystemOpen ? '#1677ff' : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{portSystemOpen ? '▼' : '▶'} Thông tin hệ thống</span>
                      </div>
                      {portSystemOpen && (
                        <div className="detail-grid" style={{ marginTop: 4 }}>
                          {[
                            ['Người tạo', selectedRecord.createdByName || selectedRecord.createdBy || '—'],
                            ['Ngày tạo', selectedRecord.createdAt ? new Date(selectedRecord.createdAt).toLocaleString('vi-VN') : '—'],
                            ['Người cập nhật', selectedRecord.updatedByName || selectedRecord.updatedBy || '—'],
                            ['Ngày cập nhật', selectedRecord.updatedAt ? new Date(selectedRecord.updatedAt).toLocaleString('vi-VN') : '—'],
                          ].map(([label, value], i) => (
                            <div key={i} className="detail-row">
                              <span className="detail-label">{label}</span>
                              <span className="detail-value">{value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'gis', label: 'Thông tin vị trí',
                  children: (
                    <div style={{ paddingTop: 16 }}>
                      <div className="detail-grid">
                      {[
                        ['Loại đối tượng', selectedRecord.geometryType === 'POINT' ? 'Đối tượng điểm' : selectedRecord.geometryType === 'LINE' ? 'Đối tượng đường' : selectedRecord.geometryType === 'POLYGON' ? 'Đối tượng vùng' : '—'],
                        ['Biểu tượng bản đồ', (() => { const sym = symbols.find((s) => s.id === selectedRecord.mapSymbolId); return sym ? <span style={{ display:'inline-flex',alignItems:'center',gap:8 }}>{sym.image ? <img src={sym.image} alt="" style={{ width:24,height:24,objectFit:'contain' }} /> : null}{sym.name}</span> : selectedRecord.mapSymbolId || '—'; })(),],
                        ['Hệ quy chiếu', selectedRecord.coordinateSystem === 1 ? 'WGS-84' : selectedRecord.coordinateSystem === 2 ? 'VN-2000' : '—'],
                        ['Quy tắc hiển thị', 'Độ, phút, giây (DMS)'],
                      ].map(([label, value], i) => (
                        <div key={i} className="detail-row">
                          <span className="detail-label">{label}</span>
                          <span className="detail-value">{value}</span>
                        </div>
                      ))}
                      </div>
                      {/* GPS Coordinates table */}
                      <div style={{ marginTop: spaceSm, padding: '0 12px' }}>
                        <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tọa độ GPS</span>
                        {(() => {
                          const wkt = (selectedRecord as any).coordinates || '';
                          const arr = (selectedRecord as any).coordinateList;
                          const pts: Array<{ lat: number; lng: number }> = [];
                          if (arr && Array.isArray(arr) && arr.length > 0) {
                            pts.push(...arr.map((c: any) => ({ lat: c.latitude ?? c.lat, lng: c.longitude ?? c.lng })));
                          } else if (wkt) {
                            const mm = wkt.match(/MULTIPOINT\s*\(([^)]+(?:\),[^)]+)*)\)/);
                            if (mm) {
                              mm[1].split('),(').forEach((pt: string) => {
                                const parts = pt.replace(/[()]/g, '').trim().split(/\s+/);
                                pts.push({ lat: Number(parts[1]), lng: Number(parts[0]) });
                              });
                            } else {
                              const m = wkt.match(/POINT\s*\(([-\d.]+)\s+([-\d.]+)\)/);
                              if (m) pts.push({ lat: Number(m[2]), lng: Number(m[1]) });
                            }
                          } else if (selectedRecord.latitude != null && selectedRecord.longitude != null) {
                            pts.push({ lat: selectedRecord.latitude, lng: selectedRecord.longitude });
                          }
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
                    </div>
                  ),
                },
                {
                  key: 'infra', label: 'Công trình KCHT',
                  children: (
                    <div style={{ paddingTop: 16 }}>
                      <div style={{ marginBottom: spaceSm, padding: '0 12px' }}>
                        <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Công trình KCHT</span>
                      </div>
                      {(!(selectedRecord as any).infrastructureList || (selectedRecord as any).infrastructureList.length === 0) ? (
                        <span style={{ color: textTertiary }}>Không có công trình KCHT</span>
                      ) : (
                        <Table className="list-view-table" dataSource={((selectedRecord as any).infrastructureList || []).map((i: any, idx: number) => ({ ...i, key: idx }))} pagination={false} size="middle" bordered style={{ marginLeft: 12, marginRight: 12 }}>
                          <Table.Column title="STT" dataIndex="stt" key="stt" width={60} align="center"
                            onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                          <Table.Column title="Tên Công Trình" dataIndex="infraName" key="name" align="center"
                            onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                          <Table.Column title="Số Lượng" dataIndex="quantity" key="qty" width={100} align="center"
                            onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                        </Table>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'files', label: 'File đính kèm',
                  children: (
                    <div style={{ paddingTop: 16 }}>
                      <div style={{ marginBottom: spaceSm, padding: '0 12px' }}>
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
              ]}
            />
          )}

        </Drawer>
        )}


      {/* ── History Modal ──────────────────────────────────────────── */}
      <Modal
        styles={{ mask: { background: 'rgba(0, 0, 0, 0.4)' }, body: { padding: spaceMd, maxHeight: '75vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' } }}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Space size={spaceSm}>
              <HistoryOutlined style={{ color: actionPrimary, fontSize: 20 }} />
              <span style={{ color: actionPrimary, fontWeight: fontWeightBold, fontSize: fontSizeXl }}>
                {historyMode === 'all' ? 'Tất cả lịch sử thay đổi — Cảng biển' : (selectedRecord ? `Lịch sử thay đổi — ${selectedRecord.portName}` : 'Lịch sử thay đổi')}
              </span>
            </Space>
          </div>
        }
        open={historyModalVisible} onCancel={() => setHistoryModalVisible(false)} footer={null} width={880}
        styles={{ body: { padding: spaceMd, maxHeight: '75vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' } }}>
        <div style={{ flexShrink: 0 }}>
        {!loadingHistory && (
          <div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceSm, alignItems: 'center' }}>
            <Radio.Group value={historyMode} size="middle" style={{ display: 'flex', width: '100%', borderBottom: `1px solid ${borderDefault}` }}
              onChange={async e => { const mode = e.target.value; setHistoryMode(mode); setLoadingHistory(true); setHistoryRecords([]); if (mode === 'all') { const { fetchPortAllHistory } = await import('./api'); fetchPortAllHistory({ page: 0, size: 500 }).then((d: any) => { setHistoryRecords(d.changeHistory || []); setHistoryEntityNames(d.entityNames || {}); }).catch(() => toast.error('Không thể tải lịch sử')).finally(() => setLoadingHistory(false)); } else { const { fetchportHistory } = await import('./api'); fetchportHistory(historyEntityId, { page: 0, size: 200 }).then((d: any) => { setHistoryRecords(d.changeHistory || []); }).catch(() => toast.error('Không thể tải lịch sử')).finally(() => setLoadingHistory(false)); } }}>
              <Radio.Button value="current" style={{ ...historyTabStyle, borderBottom: `2px solid ${historyMode === 'current' ? actionPrimary : 'transparent'}`, fontWeight: fontWeightBold, color: historyMode !== 'current' ? textSecondary : actionPrimary }}>Bản ghi hiện tại {historyMode === 'current' ? <Tag color="blue" style={{ borderRadius: radiusPill, fontSize: 11, marginLeft: 4 }}>{historyRecords.filter((r: any, i: number, arr: any[]) => { const s = Math.floor(new Date(r.changedAt || r.createdAt || 0).getTime()/1000); const a = r.changedBy || ''; return arr.findIndex((x: any) => Math.floor(new Date(x.changedAt || x.createdAt || 0).getTime()/1000) === s && (x.changedBy || '') === a) === i; }).length}</Tag> : <span style={{ marginLeft: 4 }}>...</span>}</Radio.Button>
              <Radio.Button value="all" style={{ ...historyTabStyle, borderBottom: `2px solid ${historyMode === 'all' ? actionPrimary : 'transparent'}`, fontWeight: fontWeightBold, color: historyMode !== 'all' ? textSecondary : actionPrimary }}>Tất cả bản ghi {historyMode === 'all' ? <Tag color="blue" style={{ borderRadius: radiusPill, fontSize: 11, marginLeft: 4 }}>{historyRecords.filter((r: any, i: number, arr: any[]) => { const s = Math.floor(new Date(r.changedAt || r.createdAt || 0).getTime()/1000); const a = r.changedBy || ''; return arr.findIndex((x: any) => Math.floor(new Date(x.changedAt || x.createdAt || 0).getTime()/1000) === s && (x.changedBy || '') === a) === i; }).length}</Tag> : <span style={{ marginLeft: 4 }}>...</span>}</Radio.Button>
            </Radio.Group>
          </div>
        )}
        {!loadingHistory && (
          <div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceMd }}>
            <Input.Search placeholder="Tìm kiếm nội dung thay đổi..." allowClear value={historySearch}
              onChange={e => setHistorySearch(e.target.value)} style={{ flex: 1, borderRadius: radiusPill, height: 40 }} />
            {historyMode === 'all' && <Select placeholder="Chọn cảng biển" allowClear showSearch value={historyEntityFilter || undefined}
              onChange={v => setHistoryEntityFilter(v || '')}
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              style={{ width: 200, borderRadius: radiusPill, height: 40 }}
              options={Object.entries(historyEntityNames).map(([id, name]) => ({ value: id, label: name }))} />}
            <DatePicker placeholder="Từ ngày" value={historyDateFrom ? dayjs(historyDateFrom) : null}
              onChange={d => setHistoryDateFrom(d ? d.format('YYYY-MM-DD HH:mm') : '')}
              style={{ width: 170, borderRadius: radiusPill, height: 40 }} format="DD/MM/YYYY HH:mm" showTime={{ format: 'HH:mm' }} />
            <DatePicker placeholder="Đến ngày" value={historyDateTo ? dayjs(historyDateTo) : null}
              onChange={d => setHistoryDateTo(d ? d.format('YYYY-MM-DD HH:mm') : '')}
              style={{ width: 170, borderRadius: radiusPill, height: 40 }} format="DD/MM/YYYY HH:mm" showTime={{ format: 'HH:mm' }} />
          </div>
        )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {loadingHistory ? <LoadingSkeleton rows={5} /> : historyRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}><HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} /><div style={{ color: textTertiary, fontSize: fontSizeMd }}>Chưa có thay đổi nào được ghi nhận</div></div>
        ) : (() => { const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000); const sorted = [...historyRecords].sort((a: any, b: any) => new Date(b.changedAt || b.createdAt).getTime() - new Date(a.changedAt || a.createdAt).getTime()); const q = historySearch.toLowerCase().trim(); const groups: { tsSec: number; ts: string; actor: string; items: any[] }[] = []; for (const r of sorted) { if (q) { const fn = (r.fieldName || '').toLowerCase(); const ov = (r.oldValue || '').toLowerCase(); const nv = (r.newValue || '').toLowerCase(); const lb = historyFieldName(r.fieldName || '').toLowerCase(); const od = historyFieldValue(r.fieldName, r.oldValue, orgMap, symbolMap).toLowerCase(); const nd = historyFieldValue(r.fieldName, r.newValue, orgMap, symbolMap).toLowerCase(); if (!fn.includes(q) && !ov.includes(q) && !nv.includes(q) && !lb.includes(q) && !od.includes(q) && !nd.includes(q)) continue; } if (historyEntityFilter && r.entityId !== historyEntityFilter) continue; if (historyDateFrom || historyDateTo) { const cd = (r.changedAt || r.createdAt || '').substring(0, 16); if (historyDateFrom && cd < historyDateFrom.replace(' ', 'T')) continue; if (historyDateTo && cd > historyDateTo.replace(' ', 'T') + ':59') continue; } const ts = r.changedAt || r.createdAt || ''; const sec = ts ? toSec(ts) : 0; const prev = groups[groups.length - 1]; if (prev && prev.tsSec === sec && prev.actor === (r.changedBy || '')) prev.items.push(r); else groups.push({ tsSec: sec, ts, actor: r.changedBy || '', items: [r] }); } if (groups.length === 0) return (<div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}><HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} /><div style={{ color: textTertiary, fontSize: fontSizeMd }}>{q || historyDateFrom || historyDateTo ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận'}</div></div>); const fmtTime = (ts: string) => { const d = new Date(ts); return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}  ·  ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`; }; if (historySearchRef.current === 'initial') { historySearchRef.current = ''; const init: Record<number, boolean> = {}; groups.forEach((_, i) => { init[i] = true; }); setTimeout(() => setHistoryExpanded(init), 0); } else if (q.length > 0 && historySearchRef.current !== q) { historySearchRef.current = q; const init: Record<number, boolean> = {}; groups.forEach((_, i) => { init[i] = true; }); setTimeout(() => setHistoryExpanded(init), 0); } else if (q.length === 0 && historySearchRef.current !== '') { historySearchRef.current = ''; const init: Record<number, boolean> = {}; groups.forEach((_, i) => { init[i] = false; }); setTimeout(() => setHistoryExpanded(init), 0); } return (<div>{groups.map((g, gi) => (<div key={gi} style={{ display: 'flex', gap: spaceSm, marginBottom: gi < groups.length - 1 ? spaceSm : 0 }}><div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24, flexShrink: 0 }}><div style={{ width: 24, height: 24, borderRadius: '50%', background: surfaceCard, border: `1px solid ${actionPrimary}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ClockCircleFilled style={{ color: actionPrimary, fontSize: 14 }} /></div>{gi < groups.length - 1 && (<div style={{ width: 1, flex: 1, minHeight: 24, background: borderDefault, marginTop: spaceXs }} />)}</div><div style={{ ...cardStyle, flex: 1, padding: `${spaceSm}px ${spaceFormField}px`, marginBottom: 0, borderRadius: radiusLg, boxShadow: shadowSm }}><div onClick={() => setHistoryExpanded(prev => ({ ...prev, [gi]: !prev[gi] }))} style={{ display: 'flex', alignItems: 'center', gap: spaceSm, cursor: 'pointer' }}><Typography.Text style={{ fontSize: fontSizeLg, color: textPrimary, fontWeight: fontWeightBold }}>{g.ts ? fmtTime(g.ts) : '—'}</Typography.Text>{g.actor && (<Typography.Text style={{ fontSize: fontSizeMd, color: textSecondary }}>— {g.actor}</Typography.Text>)}{(() => { const a = getActionLabel(g.items); return <Tag color={a.color} style={{ fontSize: 11, marginLeft: spaceSm, borderRadius: radiusPill }}>{a.label}</Tag>; })()}<span style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: actionPrimary, background: `${actionPrimary}12`, borderRadius: radiusPill, padding: '2px 10px', marginLeft: 'auto' }}>{g.items.length}</span>{historyExpanded[gi] === false ? (<DownOutlined style={{ fontSize: 12, color: textTertiary }} />) : (<UpOutlined style={{ fontSize: 12, color: textTertiary }} />)}</div>{historyExpanded[gi] !== false && (<><Divider style={{ margin: `${spaceSm}px 0`, borderColor: borderDefault }} /><table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody>{g.items.map((r: any, ri: number) => { const fn = r.fieldName || ''; const ov = r.oldValue !== undefined && r.oldValue != null ? historyFieldValue(fn, r.oldValue, orgMap, symbolMap) : null; const nv = r.newValue !== undefined && r.newValue != null ? historyFieldValue(fn, r.newValue, orgMap, symbolMap) : null; return (<tr key={r.id || ri}><td style={{ padding: `${spaceXs}px ${spaceSm}px ${spaceXs}px 0`, fontSize: fontSizeMd, fontWeight: fontWeightMedium, color: textPrimary, whiteSpace: 'nowrap', verticalAlign: 'middle', width: 1 }}>{historyMode === 'all' ? (<><Tag color="blue" style={{ marginRight: spaceXs, fontSize: fontSizeSm, cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setHistoryEntityId(r.entityId); setHistoryMode('current'); setLoadingHistory(true); setHistoryRecords([]); import('./api').then(m => m.fetchportHistory(r.entityId, { page: 0, size: 200 })).then((d: any) => setHistoryRecords(d.changeHistory || [])).catch(() => toast.error('Không thể tải lịch sử')).finally(() => setLoadingHistory(false)); }} onClick={async (e) => { e.stopPropagation(); setHistoryEntityId(r.entityId); setHistoryEntityName(historyEntityNames[r.entityId] || ''); setHistoryMode('current'); setLoadingHistory(true); setHistoryRecords([]); historySearchRef.current = 'initial'; const { fetchportHistory } = await import('./api'); fetchportHistory(r.entityId, { page: 0, size: 200 }).then((d: any) => setHistoryRecords(d.changeHistory || [])).catch(() => toast.error('Không thể tải lịch sử')).finally(() => setLoadingHistory(false)); }}>{historyEntityNames[r.entityId] || r.entityId?.substring(0,8)}</Tag> </>) : null}{fn ? historyFieldName(fn) : '—'}</td><td style={{ padding: `${spaceXs}px 0`, verticalAlign: 'middle' }}><Space size={spaceXs}>{ov ? (<Typography.Text delete style={{ fontSize: fontSizeMd, color: statusCritical }}>{ov}</Typography.Text>) : (<span style={{ fontSize: fontSizeMd, color: textTertiary }}>—</span>)}<ArrowRightOutlined style={{ fontSize: 10, cursor: 'pointer', color: textTertiary }} />{nv ? (<Typography.Text strong style={{ fontSize: fontSizeMd, color: statusOperational }}>{nv}</Typography.Text>) : (<span style={{ fontSize: fontSizeMd, color: textTertiary }}>—</span>)}</Space></td></tr>); })}</tbody></table></>)}</div></div>))}</div>); })()}
        </div>
      </Modal>

      {selectedRecord && (
        <DocumentUploadModal
          entityType="port"
          entityId={selectedRecord.id}
          open={uploadModalVisible}
          onCancel={() => setUploadModalVisible(false)}
        />
      )}

      {/* Approve Modal */}
      <Modal styles={{ mask: { background: 'rgba(0, 0, 0, 0.4)' } }}
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
            Phê duyệt <strong>{approvingRecord?.portCode} — {approvingRecord?.portName}</strong>?
          </p>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal styles={{ mask: { background: 'rgba(0, 0, 0, 0.4)' } }}
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Từ chối phê duyệt</span>}
        open={rejectModalVisible} onCancel={() => { setRejectModalVisible(false); setRejectTarget(null); setRejectReason(''); }}
        footer={[
          <Button key="cancel" onClick={() => { setRejectModalVisible(false); setRejectTarget(null); setRejectReason(''); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="reject" type="primary" danger onClick={handleConfirmReject}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Xác nhận từ chối</Button>,
        ]}
        width={480}>
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>Vui lòng nhập lý do từ chối cho cảng biển:</p>
          {rejectTarget && <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}><strong style={{ color: textPrimary }}>{rejectTarget.portCode} — {rejectTarget.portName}</strong></p>}
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

      {/* Submit Modal */}
      <Modal styles={{ mask: { background: 'rgba(0, 0, 0, 0.4)' } }}
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Xác nhận gửi phê duyệt</span>}
        open={submitModalOpen} onCancel={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }}
        footer={[
          <Button key="cancel" onClick={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="submit" type="primary" onClick={handleConfirmSubmit}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>Xác nhận</Button>,
        ]}
        width={480}>
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary }}>
            Gửi <strong>{submittingRecord?.portCode} — {submittingRecord?.portName}</strong> để phê duyệt?
          </p>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        title="Xác nhận xóa"
        open={!!deleteTarget}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteConfirmText('');
        }}
        okText="Xóa"
        okType="danger"
        cancelText="Hủy"
        onOk={handleDeleteConfirm}
      >
        <div style={{ marginBottom: 16 }}>
          <Typography.Text>
            Vui lòng nhập <strong>tên cảng</strong> hoặc gõ <strong>"XÓA"</strong> để xác nhận xóa cảng này.
          </Typography.Text>
        </div>
        <div style={{ marginBottom: 8 }}>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            {deleteTarget?.portName}
          </Typography.Text>
        </div>
        <Input
          placeholder="Nhập tên cảng hoặc XÓA"
          value={deleteConfirmText}
          onChange={(e) => setDeleteConfirmText(e.target.value)}
          onPressEnter={handleDeleteConfirm}
          style={{ borderRadius: radiusPill, height: 40 }}
        />
      </Modal>
    </>
  );
}

// ── BuoyListPage — list screen + all Drawers/Modals (T6, design §4.2) ─
// Port-shaped orchestrator: fetch + filters + tabs + client-side pagination (D-3)
// + 4 Drawers (create/edit/detail/history) + reject/delete/approve Modals
// + DocumentUploadModal. Handlers moved from the old routed BuoyList screen.

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Button, Modal, Input, Alert, Space, Drawer, Form, DatePicker, TreeSelect, Select, Typography, Radio,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined,
  EyeOutlined, HistoryOutlined, ExclamationCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { usePermissionStore } from '../../store/permissionStore';
import { useAuthStore } from '../../store/authStore';
import { organizationService } from '../../services/organizationService';
import type { Organization } from '../../services/organizationService';
import { symbolService } from '../../services/symbolService';
import type { Symbol as GisSymbol } from '../../services/symbolService';
import { userService } from '../../services/userService';
import {
  fetchBuoyById, searchBuoys, createBuoy, updateBuoy, deleteBuoy,
  submitBuoyForApproval, approveBuoyL1, approveBuoyL2, rejectBuoy, fetchBuoyHistory,
  fetchBuoyAllHistory,
  generateBuoyCode,
} from './api';
import { fetchBuoyStationList } from '../buoy-station/api';
import type { BuoyStationResponse } from '../buoy-station/types';
import {
  BUOY_TYPE_OPTIONS, BUOY_TYPE_MAP,
  COLOR_LABEL_MAP, SHAPE_LABEL_MAP, LIGHT_CHAR_LABEL_MAP, BUOY_FIELD_MAP,
  CONDITION_OPTIONS,
} from './schema';
import type { Buoy, ChangeHistory } from './types';
import { documentApi } from '../../app/document/api';
import DocumentUploadModal from '../../app/document/DocumentUploadModal';
import BuoyFormContent from './BuoyFormContent';
import BuoyDetailContent from './BuoyDetailContent';
import { ScreenHeader, DataTable } from '../../components/list-view';
import { VIETNAM_PROVINCES, VIETNAM_PROVINCE_OPTIONS } from '../../types/common';
import type { DataTableColumn } from '../../components/list-view/DataTable';
import Pagination from '../../components/list-view/Pagination';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import toast from '../../components/ToastNotification';
import api from '../../services/api';
import {
  statusOperational, statusCritical, actionPrimary, statusDraft, statusAttention,
  textPrimary, textSecondary, textTertiary, borderDefault,
  fontSizeMd, fontSizeLg, fontWeightMedium, fontWeightBold,
  spaceMd, spaceSm, spaceXs, spaceXl, spaceFormField, radiusPill,
  drawerProps, drawerTitleStyle, drawerCloseBtnStyle, drawerFooterStyle,
  primaryButtonStyle, outlineButtonStyle, requiredMarkStyle,
  historyBadgeStyle, historyGroupGridStyle, historyTimeStyle, historyMetaRowStyle,
  historyInfoCardStyle, historyAccentBarStyle, historyInfoTitleStyle,
  historyChangeRowStyle, historyCreateRowStyle, historyFieldLabelStyle,
  historyOldValueStyle, historyNewValueStyle, historyArrowStyle,
} from '../../tokens';
import { colors } from '../../theme';

// ── Helpers (moved verbatim from BuoyList.tsx / BuoyForm.tsx) ────────

function formatDateOnly(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return dayjs(dateStr).format('DD/MM/YYYY');
  } catch {
    return dateStr;
  }
}

// ── Nhãn tiếng Việt bổ sung cho các trường phao tiêu trong lịch sử thay đổi ──
// (BUOY_FIELD_MAP trong schema.ts không sửa vì là one-way-door — bổ sung local)
const EXTRA_HISTORY_FIELD_LABELS: Record<string, string> = {
  buoyStationId: 'Nhà trạm QLVH', locationDetail: 'Địa điểm chi tiết',
  condition: 'Tình trạng', structure: 'Kết cấu', area: 'Diện tích',
  bodyHeight: 'Chiều cao thân', diameter: 'Đường kính', beaconLight: 'Đèn hiệu',
  towerHeight: 'Chiều cao tháp', lightHeight: 'Chiều cao đèn', lightModel: 'Mẫu đèn',
  towerColor: 'Màu tháp', powerSupply: 'Nguồn cấp', range: 'Phạm vi(Hải lý)', commissionedDate: 'Ngày đưa vào khai thác',
  lastRepairDate: 'Ngày sửa chữa gần nhất', lightColor: 'Màu đèn', flashType: 'Kiểu chớp',
  period: 'Chu kỳ', classification: 'Phân loại', classificationBuoy: 'Phân loại phao',
  classificationMark: 'Phân loại tiêu', geometryType: 'Loại đối tượng',
  mapSymbolId: 'Biểu tượng',
  coordinateSystem: 'Hệ quy chiếu', displayRule: 'Quy tắc hiển thị',
  approvedBy: 'Người phê duyệt', approvedDate: 'Ngày phê duyệt',
  submittedForApprovalBy: 'Người gửi duyệt', submittedForApprovalAt: 'Ngày gửi duyệt',
  level1ApprovedBy: 'Người duyệt Cảng vụ', level1ApprovedDate: 'Ngày duyệt Cảng vụ',
  level2ApprovedBy: 'Người duyệt Cục', level2ApprovedDate: 'Ngày duyệt Cục',
  level1ApprovalContent: 'Nội dung phê duyệt Cảng vụ/Chi cục', level2ApprovalContent: 'Nội dung phê duyệt Cục',
  operationPlanCode: 'Mã kế hoạch vận hành', operationPlanName: 'Tên kế hoạch vận hành',
  operationStartDate: 'Ngày bắt đầu vận hành', operationEndDate: 'Ngày kết thúc vận hành',
  maintenancePlanCode: 'Mã kế hoạch bảo trì', maintenancePlanName: 'Tên kế hoạch bảo trì',
  maintenanceStartTime: 'Thời gian bắt đầu bảo trì', maintenanceEndTime: 'Thời gian kết thúc bảo trì',
  incidentCode: 'Mã sự cố', incidentType: 'Loại sự cố',
  incidentLocation: 'Địa điểm sự cố', incidentTime: 'Thời gian sự cố',
};

function historyFieldLabel(fn: string): string {
  return EXTRA_HISTORY_FIELD_LABELS[fn] || BUOY_FIELD_MAP[fn] || fn;
}

// ── Thứ tự hiển thị field trong lịch sử (theo thứ tự form tạo phao tiêu — giống BerthList) ──
const HISTORY_FIELD_ORDER = ['code', 'name', 'type', 'classification', 'classificationBuoy', 'classificationMark',
  'unitId', 'buoyStationId', 'provinceId', 'locationDetail', 'color', 'shape', 'structure', 'area',
  'bodyHeight', 'diameter', 'beaconLight', 'towerHeight', 'lightHeight', 'lightModel', 'towerColor',
  'powerSupply', 'range', 'lightCharacteristic', 'lightColor', 'flashType', 'period', 'commissionedDate',
  'lastRepairDate', 'condition', 'lastInspectionDate', 'nextInspectionDate', 'isActive',
  'geometryType', 'mapSymbolId', 'coordinateSystem', 'displayRule', 'status', 'approvalStatus', 'rejectionReason'];

// ── Bản đồ nhãn giá trị cho lịch sử (giống BerthList.historyFieldValue) ──
const GEOMETRY_TYPE_LABELS: Record<string, string> = { POINT: 'Đối tượng điểm', LINE: 'Đối tượng đường', POLYGON: 'Đối tượng vùng' };
const COORD_SYS_LABELS: Record<string, string> = { '1': 'WGS-84', '2': 'VN-2000' };
const APPROVAL_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp', PROPOSED: 'Chờ phê duyệt', PENDING_APPROVAL: 'Chờ Cảng vụ duyệt',
  APPROVED_LEVEL1: 'Chờ Cục duyệt', APPROVED_LEVEL2: 'Đã duyệt L2', APPROVED: 'Đã phê duyệt',
  REJECTED: 'Từ chối', UNDER_REVIEW: 'Đang xem xét',
};

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return dayjs(dateStr).format('DD/MM/YYYY HH:mm:ss');
  } catch {
    return dateStr;
  }
}

function parseGisCoordinateList(gisLocation: { geometryType?: string; coordinates?: string } | undefined | null): Array<{ latitude: number; longitude: number }> {
  const wkt = gisLocation?.coordinates;
  if (!wkt || typeof wkt !== 'string' || !wkt.trim()) return [];
  try {
    if (wkt.startsWith('LINESTRING(')) { const m = wkt.match(/LINESTRING\s*\(([^)]+)\)/); if (m) return m[1].split(',').map(p => { const [lng, lat] = p.trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude)); }
    if (wkt.startsWith('POLYGON((')) { const m = wkt.match(/POLYGON\s*\(\(([^)]+)\)\)/); if (m) { const pts = m[1].split(',').map(p => { const [lng, lat] = p.trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude)); if (pts.length > 1 && pts[0].longitude === pts[pts.length-1].longitude) pts.pop(); return pts; } }
    const mm = wkt.match(/MULTIPOINT\s*\(((?:\([^)]*\),?)+)/); if (mm) return mm[1].split('),(').map(p => { const [lng, lat] = p.replace(/[()]/g, '').trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude));
    const pm = wkt.match(/POINT\s*\(([\d.+-]+)\s+([\d.+-]+)\)/); if (pm) return [{ latitude: parseFloat(pm[2]), longitude: parseFloat(pm[1]) }];
  } catch { /* invalid */ }
  return [];
}

// Số lượng tọa độ mặc định tương ứng với từng loại đối tượng: điểm → 1, đường → 2, vùng → 3
const GEOMETRY_POINT_COUNT: Record<string, number> = { POINT: 1, LINE: 2, POLYGON: 3 };

// Tab trạng thái giống BerthList (key = giá trị field `status` của Buoy: DRAFT → PENDING_APPROVAL → APPROVED_L1 → PUBLISHED)
const TAB_STATUS_LIST = [
  { key: 'all', label: 'Tất cả', color: actionPrimary },
  { key: 'DRAFT', label: 'Nháp', color: statusDraft },
  { key: 'PENDING_APPROVAL', label: 'Chờ Cảng vụ duyệt', color: actionPrimary },
  { key: 'APPROVED_L1', label: 'Chờ Cục duyệt', color: statusAttention },
  { key: 'PUBLISHED', label: 'Đã phê duyệt', color: statusOperational },
  { key: 'REJECTED', label: 'Từ chối', color: statusCritical },
];

function buoyStatusBadge(status: string | null | undefined): { color: string; label: string } {
  const m: Record<string, { color: string; label: string }> = {
    DRAFT: { color: statusDraft, label: 'Nháp' },
    PENDING_APPROVAL: { color: actionPrimary, label: 'Chờ Cảng vụ duyệt' },
    APPROVED_L1: { color: statusAttention, label: 'Chờ Cục duyệt' },
    PUBLISHED: { color: statusOperational, label: 'Đã phê duyệt' },
    REJECTED: { color: statusCritical, label: 'Từ chối' },
    APPROVED_L2: { color: statusAttention, label: 'Đã duyệt L2' },
    DELETED: { color: textTertiary, label: 'Đã xóa' },
  };
  return m[status || ''] || { color: textTertiary, label: status || '—' };
}

// Style badge Tình trạng giống bến cảng (operationalStatus pill)
const CONDITION_STYLE: Record<string, { color: string; label: string }> = {
  'Đang khai thác/vận hành': { color: statusOperational, label: 'Đang khai thác/vận hành' },
  'Chưa khai thác/vận hành': { color: statusAttention, label: 'Chưa khai thác/vận hành' },
  'Dừng khai thác/vận hành': { color: statusCritical, label: 'Dừng khai thác/vận hành' },
};

// Map tab key → giá trị status lọc (giống BerthList TAB_QUERY_MAP; giá trị theo field `status` của Buoy)
const TAB_QUERY_MAP: Record<string, string | undefined> = {
  all: undefined, DRAFT: 'DRAFT', PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED_L1: 'APPROVED_L1', PUBLISHED: 'PUBLISHED', REJECTED: 'REJECTED',
};

function ddToDms(dd: number): { d: number; m: number; s: number } {
  if (dd == null || isNaN(dd)) return { d: 0, m: 0, s: 0 };
  const abs = Math.abs(dd);
  const d = Math.floor(abs);
  const m = Math.floor((abs - d) * 60);
  const s = parseFloat(((abs - d - m / 60) * 3600).toFixed(2));
  return { d, m, s };
}

// ── Component ────────────────────────────────────────────────────────

export default function BuoyListPage() {
  const hasPerm = usePermissionStore((s: any) => s.hasPermission);
  const currentUser = useAuthStore((s: any) => s.user);

  // ── Filter state ─────────────────────────────────────────────────
  const [managingUnitId, setManagingUnitId] = useState<string | undefined>();
  const defaultOrgUnitId = useRef<string | undefined>(undefined);
  const defaultOrgApplied = useRef(false);
  const [orgUnitReady, setOrgUnitReady] = useState(false);
  const [filterStationId, setFilterStationId] = useState<string | undefined>();

  // Bộ lọc thường (luôn hiển thị)
  const [filterQuery, setFilterQuery] = useState('');

  // Bộ lọc nâng cao (toggle)
  const [filterProvince, setFilterProvince] = useState('');
  const [filterCondition, setFilterCondition] = useState<string | undefined>();
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<string | undefined>();
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState<string | undefined>();
  const [filterUpdatedTo, setFilterUpdatedTo] = useState<string | undefined>();

  const [activeTab, setActiveTab] = useState('all');
  const [sortField, setSortField] = useState<string>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend' | null>('descend');
  const [filterCollapsed, setFilterCollapsed] = useState(false);

  // ── Pagination (client-side, D-3) ────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // ── Data ─────────────────────────────────────────────────────────
  const [allData, setAllData] = useState<Buoy[]>([]);
  const [dataSource, setDataSource] = useState<Buoy[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  // ── Organizations + Users for lookup ────────────────────────────
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
  const orgMap = useMemo(() => {
    const map = new Map<string, string>();
    organizations.forEach((o) => { map.set(o.id, o.name); });
    return map;
  }, [organizations]);

  // Cây đơn vị cho TreeSelect filter (dựng từ id/name/code/parentId)
  const orgTree = useMemo(() => {
    const nodeMap = new Map<string, any>();
    organizations.forEach((o) => {
      nodeMap.set(o.id, { value: o.id, title: o.name, children: [] as any[] });
    });
    const roots: any[] = [];
    organizations.forEach((o) => {
      const node = nodeMap.get(o.id);
      if (o.parentId && nodeMap.has(o.parentId)) nodeMap.get(o.parentId).children.push(node);
      else roots.push(node);
    });
    return roots;
  }, [organizations]);

  // ── Tab counts ──────────────────────────────────────────────────
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  // ── Create/Edit Drawers ─────────────────────────────────────────
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Buoy | null>(null);
  const [createForm] = Form.useForm();
  const [updateForm] = Form.useForm();
  const [createTabKey, setCreateTabKey] = useState('general');
  const [editTabKey, setEditTabKey] = useState('general');
  const [codeLoading, setCodeLoading] = useState(false);
  const [buoyStations, setBuoyStations] = useState<BuoyStationResponse[]>([]);
  const [loadingStations, setLoadingStations] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const actionTypeRef = useRef<'draft' | 'submit'>('submit');

  // ── Danh sách nhà trạm QLVH phao tiêu (SelectKcht — nguồn sinh mã {mã nhà trạm}-PT-{seq}) ──
  useEffect(() => {
    let cancelled = false;
    setLoadingStations(true);
    fetchBuoyStationList({})
      .then((res) => { if (!cancelled) setBuoyStations(res.content || []); })
      .catch(() => { if (!cancelled) toast.error('Không thể tải danh sách nhà trạm QLVH'); })
      .finally(() => { if (!cancelled) setLoadingStations(false); });
    return () => { cancelled = true; };
  }, []);

  // Chọn nhà trạm → sinh mã tự động {mã nhà trạm}-PT-{seq} (chỉ chế độ thêm mới)
  const handleStationChange = useCallback((stationId: string | undefined) => {
    setCodeLoading(true);
    generateBuoyCode(stationId)
      .then((code) => { createForm.setFieldsValue({ code }); })
      .catch(() => { toast.error('Không thể sinh mã tự động, vui lòng thử lại'); })
      .finally(() => { setCodeLoading(false); });
  }, [createForm]);
  const [uploadFileList, setUploadFileList] = useState<any[]>([]);
  const [symbols, setSymbols] = useState<GisSymbol[]>([]);
  const [createCoords, setCreateCoords] = useState<Array<{ lat: number | null; lng: number | null }>>([]);
  const [editCoords, setEditCoords] = useState<Array<{ lat: number | null; lng: number | null }>>([]);
  const createGeomType = Form.useWatch('geometryType', createForm);
  const editGeomType = Form.useWatch('geometryType', updateForm);

  // ── GIS: symbols + coordinate list (giống BerthForm tab Thông tin vị trí) ──
  useEffect(() => {
    symbolService.list({ page: 1, pageSize: 1000, status: 'active' })
      .then((r) => setSymbols(r.data || []))
      .catch(() => {});
  }, []);

  // Bản đồ tên + ảnh biểu tượng theo id (giống BerthList → BuoyDetailContent tab Thông tin vị trí)
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

  useEffect(() => {
    if (!createGeomType) return;
    createForm.setFieldsValue({ coordinateSystem: 1, displayRule: 'Độ, phút, giây (DMS)' });
    setCreateCoords(Array.from({ length: GEOMETRY_POINT_COUNT[createGeomType] ?? 1 }, () => ({ lat: null, lng: null })));
  }, [createGeomType, createForm]);

  useEffect(() => {
    if (!editGeomType) return;
    updateForm.setFieldsValue({ coordinateSystem: 1, displayRule: 'Độ, phút, giây (DMS)' });
    // Đồng bộ với chế độ thêm mới: thiếu bản ghi GPS thì tự thêm bản ghi trống cho đủ số lượng theo loại đối tượng
    const required = GEOMETRY_POINT_COUNT[editGeomType] ?? 1;
    setEditCoords((prev) => {
      if (prev.length >= required) return prev;
      const added = Array.from({ length: required - prev.length }, () => ({ lat: null, lng: null }));
      return [...prev, ...added];
    });
  }, [editGeomType, updateForm]);

  const updateCreateGps = useCallback((i: number, field: 'lat' | 'lng', d: number, m: number, s: number) => {
    // Chặn giá trị vượt ngưỡng khi gõ: độ ≤ 90/180, phút ≤ 59, giây ≤ 59.99 (tránh hiển thị mấy trăm)
    const dMax = field === 'lat' ? 90 : 180;
    const dClamped = Math.min(dMax, Math.max(0, d));
    const mClamped = Math.min(59, Math.max(0, m));
    const sClamped = Math.min(59.99, Math.max(0, s));
    const decimal = dClamped + mClamped / 60 + sClamped / 3600;
    setCreateCoords((p) => { const n = [...p]; n[i] = { ...n[i], [field]: decimal }; return n; });
  }, []);
  const addCreateGps = useCallback(() => setCreateCoords((p) => [...p, { lat: null, lng: null }]), []);
  const removeCreateGps = useCallback((i: number) => setCreateCoords((p) => (p.length <= 1 ? p : p.filter((_, idx) => idx !== i))), []);
  const updateEditGps = useCallback((i: number, field: 'lat' | 'lng', d: number, m: number, s: number) => {
    // Chặn giá trị vượt ngưỡng khi gõ: độ ≤ 90/180, phút ≤ 59, giây ≤ 59.99 (tránh hiển thị mấy trăm)
    const dMax = field === 'lat' ? 90 : 180;
    const dClamped = Math.min(dMax, Math.max(0, d));
    const mClamped = Math.min(59, Math.max(0, m));
    const sClamped = Math.min(59.99, Math.max(0, s));
    const decimal = dClamped + mClamped / 60 + sClamped / 3600;
    setEditCoords((p) => { const n = [...p]; n[i] = { ...n[i], [field]: decimal }; return n; });
  }, []);
  const addEditGps = useCallback(() => setEditCoords((p) => [...p, { lat: null, lng: null }]), []);
  const removeEditGps = useCallback((i: number) => setEditCoords((p) => (p.length <= 1 ? p : p.filter((_, idx) => idx !== i))), []);

  // ── Detail Drawer ───────────────────────────────────────────────
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<Buoy | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailFiles, setDetailFiles] = useState<any[]>([]);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);

  // ── Delete confirmation modal ───────────────────────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<Buoy | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // ── History Drawer ──────────────────────────────────────────────
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [historyRecord, setHistoryRecord] = useState<Buoy | null>(null);
  const [historyData, setHistoryData] = useState<ChangeHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');
  const [historyMode, setHistoryMode] = useState<'current' | 'all'>('current');
  const [historyEntityNames, setHistoryEntityNames] = useState<Record<string, string>>({});
  const [historyEntityFilter, setHistoryEntityFilter] = useState('');

  const historyGroupCount = useMemo(() => {
    const seen = new Set<string>();
    for (const r of historyData) {
      const s = Math.floor(new Date(r.changedAt || r.createdAt || 0).getTime() / 1000);
      seen.add(`${s}|${r.changedBy || ''}`);
    }
    return seen.size;
  }, [historyData]);

  // ── Submit approval modal ───────────────────────────────────────
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submittingRecord, setSubmittingRecord] = useState<Buoy | null>(null);

  // ── Reject modal ────────────────────────────────────────────────
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRecord, setRejectingRecord] = useState<Buoy | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // ── Approve modal ───────────────────────────────────────────────
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvingRecord, setApprovingRecord] = useState<Buoy | null>(null);
  const [approvalContent, setApprovalContent] = useState('');
  const [approvingLevel, setApprovingLevel] = useState<'L1' | 'L2'>('L1');

  // ── Load organizations + users ──────────────────────────────────
  // F-074: Đơn vị quản lý là bộ lọc bắt buộc (giống Cảng biển):
  // tự chọn mặc định = đơn vị của user đang đăng nhập, nếu không khớp thì lấy đơn vị đầu tiên
  useEffect(() => {
    (async () => {
      try {
        const resp = await organizationService.list({ pageSize: 1000 });
        const data = resp.data || [];
        setOrganizations(data);
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
          } catch {
            defaultOrgUnitId.current = data[0].id;
            setManagingUnitId(data[0].id);
          }
        }
        setOrgUnitReady(true);
      } catch (err) {
        console.error('Failed to load organizations', err);
        setOrgUnitReady(true);
      }
    })();
    (async () => {
      try {
        const resp = await userService.list({ pageSize: 1000 });
        const users = resp.data || (resp as any).content || [];
        const map = new Map<string, string>();
        users.forEach((u: any) => { map.set(u.id, u.fullName || u.username || u.id); });
        setUserMap(map);
      } catch (err) {
        console.error('Failed to load users', err);
      }
    })();
  }, []);

  // ── Fetch main data (client-side filter + paginate, D-3) ────────
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const all = await searchBuoys({
        name: filterQuery || undefined,
        code: filterQuery || undefined,
        condition: filterCondition || undefined,
        provinceId: filterProvince ? (Number(VIETNAM_PROVINCE_OPTIONS.find((o) => o.label === filterProvince)?.value) || undefined) : undefined,
        updatedFrom: filterUpdatedFrom,
        updatedTo: filterUpdatedTo,
      });
      const unitFiltered = managingUnitId ? all.filter((d) => d.unitId === managingUnitId) : all;
      const stationFiltered = filterStationId ? unitFiltered.filter((d) => d.buoyStationId === filterStationId) : unitFiltered;

      // Tab counts từ FULL dataset (không lọc theo tab đang chọn — giống BerthList fetchCounts)
      const counts: Record<string, number> = { all: stationFiltered.length };
      TAB_STATUS_LIST.slice(1).forEach((tab) => {
        counts[tab.key] = stationFiltered.filter((d) => d.status === tab.key).length;
      });
      setTabCounts(counts);

      // Lọc trạng thái hiệu dụng = bộ lọc nâng cao || tab đang chọn (giống BerthList: filterApprovalStatus || TAB_QUERY_MAP[activeTab])
      const effectiveStatus = filterApprovalStatus || TAB_QUERY_MAP[activeTab];
      const tabFiltered = effectiveStatus ? stationFiltered.filter((d) => d.status === effectiveStatus) : stationFiltered;
      setAllData(tabFiltered);
      setTotal(tabFiltered.length);

      const start = (page - 1) * pageSize;
      setDataSource(tabFiltered.slice(start, start + pageSize));
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [filterQuery, filterCondition, filterProvince, filterApprovalStatus, managingUnitId, filterStationId, filterUpdatedFrom, filterUpdatedTo, activeTab, page, pageSize]);

  useEffect(() => { if (orgUnitReady) void fetchData(); }, [fetchData, orgUnitReady]);

  // ── Filter handlers ─────────────────────────────────────────────

  const handleFilterApply = useCallback(() => {
    setPage(1);
  }, []);

  const handleFilterReset = useCallback(() => {
    // Reset về đơn vị quản lý mặc định (bắt buộc — giống Cảng biển)
    const defaultOrg = defaultOrgUnitId.current;
    setManagingUnitId(defaultOrg === '__all__' ? undefined : defaultOrg);
    setFilterStationId(undefined);
    setFilterQuery('');
    setFilterProvince('');
    setFilterCondition(undefined);
    setFilterApprovalStatus(undefined);
    setFilterUpdatedFrom(undefined);
    setFilterUpdatedTo(undefined);
    setActiveTab('all');
    setPage(1);
  }, []);

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key);
    setPage(1);
  }, []);

  const handleSortChange = useCallback((key: string, order: 'asc' | 'desc') => {
    setSortField(key);
    setSortOrder(order === 'asc' ? 'ascend' : 'descend');
    setPage(1);
  }, []);

  // ── Detail Drawer ───────────────────────────────────────────────

  const openDetailDrawer = useCallback(async (record: Buoy) => {
    setDetailDrawerOpen(true);
    setDetailRecord(record);
    setDetailLoading(true);
    setDetailFiles([]);
    try {
      const fresh = await fetchBuoyById(record.id);
      setDetailRecord(fresh);
      try {
        const fileRes = await documentApi.listByEntity('buoy', record.id, { page: 1, size: 20 });
        setDetailFiles(fileRes.data || []);
      } catch { setDetailFiles([]); }
    } catch {
      // keep initial data
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const closeDetailDrawer = useCallback(() => {
    setDetailDrawerOpen(false);
    setDetailRecord(null);
    setDetailFiles([]);
  }, []);

  // ── Create/Edit Drawers ─────────────────────────────────────────

  const openCreateDrawer = useCallback(() => {
    setCreateDrawerOpen(true);
    setCreateTabKey('general');
    setUploadFileList([]);
  }, []);

  const closeCreateDrawer = useCallback(() => {
    setCreateDrawerOpen(false);
    createForm.resetFields();
    setUploadFileList([]);
    setCreateCoords([]);
  }, [createForm]);

  const openEditDrawer = useCallback(async (record: Buoy) => {
    setEditDrawerOpen(true);
    setEditingRecord(record);
    setUploadFileList([]);
    updateForm.resetFields();
    try {
      const data = await fetchBuoyById(record.id);
      setEditingRecord(data);
      // Load existing attachments
      try {
        const fileRes = await documentApi.listByEntity('buoy', data.id, { page: 1, size: 50 });
        setUploadFileList((fileRes.data || []).map((a: any) => ({
          uid: a.id, name: a.fileName, size: a.fileSize, status: 'done' as const,
        })));
      } catch { setUploadFileList([]); }
      const loadedCoords = parseGisCoordinateList({ geometryType: data.geometryType, coordinates: data.coordinates });
      setEditCoords(loadedCoords.length > 0 ? loadedCoords.map((c) => ({ lat: c.latitude, lng: c.longitude })) : []);
      updateForm.setFieldsValue({
        code: data.code,
        name: data.name,
        unitId: data.unitId,
        description: data.description || undefined,
        isActive: data.isActive,
        color: data.color || undefined,
        shape: data.shape || undefined,
        lightCharacteristic: data.lightCharacteristic || undefined,
        range: data.range,
        buoyStationId: data.buoyStationId || undefined,
        classification: data.classification || undefined,
        classificationBuoy: data.classificationBuoy || undefined,
        classificationMark: data.classificationMark || undefined,
        provinceId: data.provinceId != null ? String(data.provinceId) : undefined,
        locationDetail: data.locationDetail || undefined,
        condition: data.condition || undefined,
        structure: data.structure || undefined,
        area: data.area,
        bodyHeight: data.bodyHeight,
        diameter: data.diameter,
        beaconLight: data.beaconLight || undefined,
        towerHeight: data.towerHeight,
        lightHeight: data.lightHeight,
        lightModel: data.lightModel || undefined,
        towerColor: data.towerColor || undefined,
        powerSupply: data.powerSupply || undefined,
        commissionedDate: data.commissionedDate ? dayjs(data.commissionedDate) : undefined,
        lastRepairDate: data.lastRepairDate ? dayjs(data.lastRepairDate) : undefined,
        lightColor: data.lightColor || undefined,
        flashType: data.flashType || undefined,
        period: data.period || undefined,
        geometryType: data.geometryType || undefined,
        mapSymbolId: data.mapSymbolId || undefined,
        coordinateSystem: data.coordinateSystem != null ? data.coordinateSystem : undefined,
        displayRule: data.displayRule || undefined,
      });
    } catch {
      toast.error('Không thể tải thông tin phao tiêu');
      setEditDrawerOpen(false);
      setEditingRecord(null);
    }
  }, [updateForm]);

  const closeEditDrawer = useCallback(() => {
    setEditDrawerOpen(false);
    setEditingRecord(null);
    updateForm.resetFields();
    setUploadFileList([]);
    setEditCoords([]);
  }, [updateForm]);

  // ── Upload helper (after save) ──────────────────────────────────

  const uploadFilesAfterSave = useCallback(async (savedId: string, files: any[]) => {
    let uploaded = 0;
    for (const fileItem of files) {
      const originFile = fileItem.originFileObj as File | undefined;
      if (!originFile) continue; // existing attachment (no originFileObj) — skip
      try {
        const formData = new FormData();
        formData.append('file', originFile);
        await api.post(`/v1/documents/upload/buoy/${savedId}`, formData, {
          headers: { 'Content-Type': undefined as any },
        });
        uploaded++;
      } catch { toast.error(`Tải lên tệp "${fileItem.name}" thất bại`); }
    }
    if (uploaded > 0) toast.success(`Đã tải lên ${uploaded} tệp đính kèm`);
  }, []);

  // ── Create save (design §4.3 — action draft/submit) ─────────────

  const handleCreateFinish = useCallback(async (values: Record<string, any>) => {
    const action = actionTypeRef.current;
    const code = String(values.code ?? '').trim();
    const name = String(values.name ?? '').trim();

    if (!code) { toast.error('Mã phao tiêu là bắt buộc'); return; }
    if (!name) { toast.error('Tên phao tiêu là bắt buộc'); return; }
    if (values.range == null || Number(values.range) <= 0 || Number(values.range) > 20) {
      toast.error('Phạm vi chiếu sáng phải trong khoảng (0, 20] hải lý'); return;
    }

    const manualCoords = createCoords
      .filter((c) => c.lat != null && c.lng != null && !Number.isNaN(Number(c.lat)) && !Number.isNaN(Number(c.lng)))
      .map((c) => ({ latitude: Number(c.lat), longitude: Number(c.lng) }));
    if (values.geometryType) {
      const requiredCoords = GEOMETRY_POINT_COUNT[values.geometryType as string] ?? 1;
      if (createCoords.length === 0 || manualCoords.length < requiredCoords) {
        toast.error(`Loại đối tượng đã chọn yêu cầu ít nhất ${requiredCoords} tọa độ GPS.`); return;
      }
    }
    if (manualCoords.length > 0) {
      if (manualCoords[0].latitude < -90 || manualCoords[0].latitude > 90) {
        toast.error('Vĩ độ phải từ -90° đến 90° (WGS84)'); return;
      }
      if (manualCoords[0].longitude < -180 || manualCoords[0].longitude > 180) {
        toast.error('Kinh độ phải từ -180° đến 180° (WGS84)'); return;
      }
    }
    if ((action === 'submit' || action === 'approved') && manualCoords.length === 0) {
      toast.error('Vui lòng thêm ít nhất một tọa độ GPS để gửi phê duyệt'); return;
    }

    // Kiểm tra trùng tên/mã phao tiêu (chặn lưu — không cho thêm mới trùng)
    try {
      const dupByName = await searchBuoys({ name });
      if (Array.isArray(dupByName) && dupByName.length > 0) {
        toast.error('Tên phao tiêu đã tồn tại. Không thể thêm mới phao tiêu trùng tên.');
        return;
      }
      const dupByCode = await searchBuoys({ code });
      if (Array.isArray(dupByCode) && dupByCode.length > 0) {
        toast.error('Mã phao tiêu đã tồn tại. Không thể thêm mới phao tiêu trùng mã.');
        return;
      }
    } catch {
      // non-blocking
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        action,
        name,
        range: values.range,
        color: values.color || undefined,
        shape: values.shape || undefined,
        lightCharacteristic: values.lightCharacteristic || undefined,
        description: values.description || undefined,
        unitId: values.unitId || undefined,
        buoyStationId: values.buoyStationId,
        classification: values.classification,
        classificationBuoy: values.classificationBuoy || undefined,
        classificationMark: values.classificationMark || undefined,
        provinceId: values.provinceId ? Number(values.provinceId) : undefined,
        locationDetail: values.locationDetail || undefined,
        condition: values.condition,
        structure: values.structure || undefined,
        area: values.area,
        bodyHeight: values.bodyHeight,
        diameter: values.diameter,
        beaconLight: values.beaconLight || undefined,
        towerHeight: values.towerHeight,
        lightHeight: values.lightHeight,
        lightModel: values.lightModel || undefined,
        towerColor: values.towerColor || undefined,
        powerSupply: values.powerSupply || undefined,
        commissionedDate: values.commissionedDate
          ? (typeof values.commissionedDate === 'string' ? values.commissionedDate : values.commissionedDate.format('YYYY-MM-DD'))
          : undefined,
        lastRepairDate: values.lastRepairDate
          ? (typeof values.lastRepairDate === 'string' ? values.lastRepairDate : values.lastRepairDate.format('YYYY-MM-DD'))
          : undefined,
        lightColor: values.lightColor || undefined,
        flashType: values.flashType || undefined,
        period: values.period || undefined,
        isActive: values.isActive !== undefined ? values.isActive : undefined,
      };
      if (manualCoords.length > 0) {
        payload.latitude = manualCoords[0].latitude;
        payload.longitude = manualCoords[0].longitude;
        payload.coordinates = manualCoords.length > 1
          ? `MULTIPOINT(${manualCoords.map((c) => `(${c.longitude} ${c.latitude})`).join(',')})`
          : `POINT(${manualCoords[0].longitude} ${manualCoords[0].latitude})`;
      }
      payload.geometryType = values.geometryType || undefined;
      payload.mapSymbolId = values.mapSymbolId || undefined;
      payload.coordinateSystem = values.coordinateSystem != null ? Number(values.coordinateSystem) : undefined;
      payload.displayRule = values.displayRule || undefined;
      Object.keys(payload).forEach((key) => { if (payload[key] === undefined) delete payload[key]; });
      payload.code = code;

      const res = await createBuoy(payload as any);
      const savedId = (res as any)?.id;
      toast.success(action === 'draft' ? 'Lưu nháp thành công' : action === 'approved' ? 'Lưu và phê duyệt thành công' : 'Gửi phê duyệt thành công');

      if (savedId && uploadFileList.length > 0) {
        await uploadFilesAfterSave(savedId, uploadFileList);
      }

      closeCreateDrawer();
      void fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  }, [createCoords, uploadFileList, uploadFilesAfterSave, closeCreateDrawer, fetchData]);

  // ── Edit save (design §4.3 — no action, no code) ────────────────

  const handleEditFinish = useCallback(async (values: Record<string, any>) => {
    if (!editingRecord) return;
    const name = String(values.name ?? '').trim();

    if (!name) { toast.error('Tên phao tiêu là bắt buộc'); return; }
    if (values.range == null || Number(values.range) <= 0 || Number(values.range) > 20) {
      toast.error('Phạm vi chiếu sáng phải trong khoảng (0, 20] hải lý'); return;
    }

    const manualCoords = editCoords
      .filter((c) => c.lat != null && c.lng != null && !Number.isNaN(Number(c.lat)) && !Number.isNaN(Number(c.lng)))
      .map((c) => ({ latitude: Number(c.lat), longitude: Number(c.lng) }));
    if (values.geometryType) {
      const requiredCoords = GEOMETRY_POINT_COUNT[values.geometryType as string] ?? 1;
      if (editCoords.length === 0 || manualCoords.length < requiredCoords) {
        toast.error(`Loại đối tượng đã chọn yêu cầu ít nhất ${requiredCoords} tọa độ GPS.`); return;
      }
    }
    if (manualCoords.length > 0) {
      if (manualCoords[0].latitude < -90 || manualCoords[0].latitude > 90) {
        toast.error('Vĩ độ phải từ -90° đến 90° (WGS84)'); return;
      }
      if (manualCoords[0].longitude < -180 || manualCoords[0].longitude > 180) {
        toast.error('Kinh độ phải từ -180° đến 180° (WGS84)'); return;
      }
    }

    // Kiểm tra trùng tên phao tiêu khi chỉnh sửa (chặn lưu — trừ chính bản ghi đang sửa)
    try {
      const dupByName = await searchBuoys({ name });
      const realDup = Array.isArray(dupByName) && dupByName.some((b: any) => b.id !== editingRecord.id);
      if (realDup) {
        toast.error('Tên phao tiêu đã tồn tại. Không thể cập nhật phao tiêu trùng tên.');
        return;
      }
    } catch {
      // non-blocking
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name,
        range: values.range,
        color: values.color || undefined,
        shape: values.shape || undefined,
        lightCharacteristic: values.lightCharacteristic || undefined,
        description: values.description || undefined,
        unitId: values.unitId || undefined,
        buoyStationId: values.buoyStationId,
        classification: values.classification,
        classificationBuoy: values.classificationBuoy || undefined,
        classificationMark: values.classificationMark || undefined,
        provinceId: values.provinceId ? Number(values.provinceId) : undefined,
        locationDetail: values.locationDetail || undefined,
        condition: values.condition,
        structure: values.structure || undefined,
        area: values.area,
        bodyHeight: values.bodyHeight,
        diameter: values.diameter,
        beaconLight: values.beaconLight || undefined,
        towerHeight: values.towerHeight,
        lightHeight: values.lightHeight,
        lightModel: values.lightModel || undefined,
        towerColor: values.towerColor || undefined,
        powerSupply: values.powerSupply || undefined,
        commissionedDate: values.commissionedDate
          ? (typeof values.commissionedDate === 'string' ? values.commissionedDate : values.commissionedDate.format('YYYY-MM-DD'))
          : undefined,
        lastRepairDate: values.lastRepairDate
          ? (typeof values.lastRepairDate === 'string' ? values.lastRepairDate : values.lastRepairDate.format('YYYY-MM-DD'))
          : undefined,
        lightColor: values.lightColor || undefined,
        flashType: values.flashType || undefined,
        period: values.period || undefined,
        isActive: values.isActive !== undefined ? values.isActive : undefined,
      };
      if (manualCoords.length > 0) {
        payload.latitude = manualCoords[0].latitude;
        payload.longitude = manualCoords[0].longitude;
        payload.coordinates = manualCoords.length > 1
          ? `MULTIPOINT(${manualCoords.map((c) => `(${c.longitude} ${c.latitude})`).join(',')})`
          : `POINT(${manualCoords[0].longitude} ${manualCoords[0].latitude})`;
      }
      payload.geometryType = values.geometryType || undefined;
      payload.mapSymbolId = values.mapSymbolId || undefined;
      payload.coordinateSystem = values.coordinateSystem != null ? Number(values.coordinateSystem) : undefined;
      payload.displayRule = values.displayRule || undefined;
      Object.keys(payload).forEach((key) => { if (payload[key] === undefined) delete payload[key]; });

      await updateBuoy(editingRecord.id, payload as any);
      toast.success('Lưu nháp thành công');

      if (uploadFileList.length > 0) {
        await uploadFilesAfterSave(editingRecord.id, uploadFileList);
      }

      closeEditDrawer();
      void fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  }, [editingRecord, editCoords, uploadFileList, uploadFilesAfterSave, closeEditDrawer, fetchData]);

  // ── History Drawer ──────────────────────────────────────────────

  const openHistoryDrawer = useCallback(async (record: Buoy) => {
    setHistoryDrawerOpen(true);
    setHistoryRecord(record);
    setHistoryLoading(true);
    setHistorySearch('');
    setHistoryFrom('');
    setHistoryTo('');
    setHistoryMode('current');
    setHistoryEntityNames({});
    setHistoryEntityFilter('');
    setHistoryData([]);
    try {
      const payload = await fetchBuoyHistory(record.id);
      setHistoryData(Array.isArray(payload?.changeHistory) ? payload.changeHistory : []);
    } catch {
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const loadHistoryMode = useCallback(async (mode: 'current' | 'all') => {
    setHistoryMode(mode);
    setHistoryLoading(true);
    setHistoryData([]);
    if (mode === 'all') {
      try {
        const payload = await fetchBuoyAllHistory();
        setHistoryData(Array.isArray(payload?.changeHistory) ? payload.changeHistory : []);
        setHistoryEntityNames(payload?.entityNames || {});
      } catch {
        toast.error('Không thể tải lịch sử');
      } finally {
        setHistoryLoading(false);
      }
    } else {
      try {
        if (historyRecord) {
          const payload = await fetchBuoyHistory(historyRecord.id);
          setHistoryData(Array.isArray(payload?.changeHistory) ? payload.changeHistory : []);
        }
      } catch {
        toast.error('Không thể tải lịch sử');
      } finally {
        setHistoryLoading(false);
      }
    }
  }, [historyRecord]);

  const translateBuoyVal = useCallback((fn: string, val: string) => {
    if (!val || val === 'null' || val === '(null)') return '—';
    if (fn === 'isActive') return val === 'true' ? 'Có' : 'Ngừng';
    if (fn === 'type') return BUOY_TYPE_OPTIONS.find((o) => o.value === val)?.label || val;
    if (fn === 'color') return COLOR_LABEL_MAP[val] || val;
    if (fn === 'shape') return SHAPE_LABEL_MAP[val] || val;
    if (fn === 'lightCharacteristic') return LIGHT_CHAR_LABEL_MAP[val] || val;
    if (fn === 'unitId') return orgMap.get(val) || val;
    if (fn === 'status') return buoyStatusBadge(val).label;
    if (fn === 'approvalStatus') return APPROVAL_STATUS_LABELS[val] || val;
    if (fn === 'geometryType') return GEOMETRY_TYPE_LABELS[val] || val;
    if (fn === 'provinceId') return VIETNAM_PROVINCE_OPTIONS.find((o) => o.value === val)?.label || val;
    if (fn === 'coordinateSystem') return COORD_SYS_LABELS[val] || val;
    if (fn === 'lastInspectionDate' || fn === 'nextInspectionDate') return formatDateOnly(val);
    return val;
  }, [orgMap]);

  const actorName = useCallback((actor: string | undefined) => {
    if (!actor) return '—';
    return userMap.get(String(actor)) || actor;
  }, [userMap]);

  // ── Timeline (design §5.3 — history*Style tokens, BuoyList grouping) ─

  const renderBuoyHistoryTimeline = (records: ChangeHistory[]) => {
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
        const label = historyFieldLabel(r.fieldName || '').toLowerCase();
        const tv = translateBuoyVal(r.fieldName || '', r.newValue || '').toLowerCase();
        if (!fn.includes(q) && !ov.includes(q) && !nv.includes(q) && !label.includes(q) && !tv.includes(q)) continue;
      }
      if (historyEntityFilter && r.entityId !== historyEntityFilter) continue;
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
          const barColor = actionPrimary;
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
                <Typography.Text style={historyMetaRowStyle}>
                  Người cập nhật: {actorName(g.actor)}
                </Typography.Text>
                <Typography.Text style={historyMetaRowStyle}>
                  Đơn vị: {historyRecord && historyRecord.unitId ? (orgMap.get(historyRecord.unitId) || '—') : '—'}
                </Typography.Text>
              </div>
              <div style={historyInfoCardStyle}>
                <div style={historyAccentBarStyle(barColor)} />
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
                    return translateBuoyVal(fn, raw);
                  };
                  const ov = formatHistoryValue(change.oldValue != null && change.oldValue !== 'null' ? String(change.oldValue) : null);
                  const nv = formatHistoryValue(change.newValue != null && change.newValue !== 'null' ? String(change.newValue) : null);
                  const key = change.id || `${fn}-${ri}`;
                  const renderCell = (rawVal: string | null) => {
                    if (fn === 'mapSymbolId' && rawVal && rawVal !== '(null)') {
                      const img = symbolImageMap.get(rawVal);
                      const name = symbolMap.get(rawVal) || rawVal;
                      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{img ? <img src={img} alt="" style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 4 }} /> : null}{name}</span>;
                    }
                    return null;
                  };
                  return isCreate ? (
                    <div key={key} style={{ ...historyCreateRowStyle, paddingTop: ri > 0 ? spaceXs : 0 }}>
                      <div style={historyFieldLabelStyle}>{fn ? `${historyFieldLabel(fn)}:` : '—'}</div>
                      <span title={nv ?? '—'} style={historyNewValueStyle}>{renderCell(change.newValue) ?? (nv ?? '—')}</span>
                    </div>
                  ) : (
                    <div key={key} style={{ ...historyChangeRowStyle, paddingTop: ri > 0 ? spaceXs : 0 }}>
                      <div style={historyFieldLabelStyle}>{fn ? `${historyFieldLabel(fn)}:` : '—'}</div>
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

  // ── Delete confirmation ─────────────────────────────────────────

  const openDeleteModal = useCallback((record: Buoy) => {
    setDeletingRecord(record);
    setDeleteConfirmText('');
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingRecord) return;
    const expectedText = (deletingRecord.name || 'XÓA').trim().toLowerCase();
    const input = deleteConfirmText.trim().toLowerCase();
    if (input !== expectedText && input !== 'xóa') {
      toast.error('Vui lòng nhập đúng tên phao tiêu hoặc gõ "XÓA" để xác nhận');
      return;
    }
    try {
      await deleteBuoy(deletingRecord.id);
      toast.success('Đã xóa phao tiêu');
      setDeleteModalOpen(false);
      setDeletingRecord(null);
      setDeleteConfirmText('');
      void fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  }, [deletingRecord, deleteConfirmText, fetchData]);

  // ── Approval handlers ───────────────────────────────────────────

  const openSubmitModal = useCallback((record: Buoy) => {
    setSubmittingRecord(record);
    setSubmitModalOpen(true);
  }, []);

  const handleConfirmSubmit = useCallback(async () => {
    if (!submittingRecord) return;
    try {
      await submitBuoyForApproval(submittingRecord.id);
      toast.success('Đã gửi phê duyệt phao tiêu');
      setSubmitModalOpen(false);
      setSubmittingRecord(null);
      void fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gửi phê duyệt thất bại');
    }
  }, [submittingRecord, fetchData]);

  const openApproveModal = useCallback((record: Buoy, level: 'L1' | 'L2') => {
    setApprovingRecord(record);
    setApprovingLevel(level);
    setApprovalContent('');
    setApproveModalOpen(true);
  }, []);

  const handleConfirmApprove = useCallback(async () => {
    if (!approvingRecord) return;
    const approverId = currentUser?.userId;
    if (!approverId) { toast.error('Không xác định được người dùng'); return; }
    try {
      const content = approvalContent.trim() || undefined;
      if (approvingLevel === 'L1') {
        await approveBuoyL1(approvingRecord.id, approverId, content);
        toast.success('Đã phê duyệt cấp 1');
      } else {
        await approveBuoyL2(approvingRecord.id, approverId, content);
        toast.success('Đã phê duyệt cấp 2 - Phao tiêu được công bố');
      }
      setApproveModalOpen(false);
      setApprovingRecord(null);
      setApprovalContent('');
      void fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
    }
  }, [approvingRecord, approvingLevel, approvalContent, currentUser, fetchData]);

  const openRejectModal = useCallback((record: Buoy) => {
    setRejectingRecord(record);
    setRejectReason('');
    setRejectModalOpen(true);
  }, []);

  const handleConfirmReject = useCallback(async () => {
    if (!rejectingRecord) return;
    const reason = rejectReason.trim();
    if (!reason) { toast.error('Vui lòng nhập lý do từ chối'); return; }
    if (reason.length < 10) { toast.error('Lý do từ chối tối thiểu 10 ký tự'); return; }
    if (reason.length > 500) { toast.error('Lý do từ chối tối đa 500 ký tự'); return; }
    const approverId = currentUser?.userId;
    if (!approverId) { toast.error('Không xác định được người dùng'); return; }
    try {
      await rejectBuoy(rejectingRecord.id, reason, approverId);
      toast.success('Đã từ chối phê duyệt');
      setRejectModalOpen(false);
      setRejectingRecord(null);
      setRejectReason('');
      void fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
    }
  }, [rejectingRecord, rejectReason, currentUser, fetchData]);

  // ── Header actions ──────────────────────────────────────────────

  const headerActions = useMemo(() => {
    const actions: any[] = [];
    if (hasPerm('data:read') || hasPerm('admin:manage')) {
      actions.push({
        key: 'create',
        label: 'Thêm mới',
        variant: 'primary' as const,
        icon: <PlusOutlined />,
        onClick: () => openCreateDrawer(),
      });
    }
    return actions;
  }, [hasPerm, openCreateDrawer]);

  // ── Table columns (moved from BuoyList.tsx) ─────────────────────

  const columns = useMemo<DataTableColumn[]>(() => [
    {
      key: 'sequenceNo',
      label: 'STT',
      width: 60,
      fixed: 'left' as const,
      align: 'center' as const,
      render: (_: unknown, __: Buoy, idx?: number) => (
        <span style={{ fontSize: fontSizeMd }}>
          {(page - 1) * pageSize + (idx ?? 0) + 1}
        </span>
      ),
    },
    {
      key: 'unitId',
      label: 'Đơn vị quản lý',
      dataIndex: 'unitId',
      width: 180,
      fixed: 'left' as const,
      render: (v: string) => (v ? (orgMap.get(v) || v) : '—'),
    },
    {
      key: 'name',
      label: 'Tên/Mã phao tiêu',
      dataIndex: 'name',
      width: 120,
      fixed: 'left' as const,
      sortable: true,
      render: (name: string, record: Buoy) => (
        <div>
          <a onClick={() => openDetailDrawer(record)} style={{ fontWeight: fontWeightBold, color: actionPrimary, cursor: 'pointer', display: 'block' }}>{name}</a>
          <span style={{ opacity: 0.85 }}>{record.code}</span>
        </div>
      ),
    },
    {
      key: 'buoyStationId',
      label: 'Thuộc nhà trạm QLVH phao, tiêu',
      dataIndex: 'buoyStationName',
      width: 170,
      render: (v: string, rec: Buoy) => (v || (rec?.buoyStationId ? (buoyStations.find((s) => s.id === rec.buoyStationId)?.name || '—') : '—')),
    },
    {
      key: 'provinceId',
      label: 'Địa điểm (Tỉnh/TP)',
      dataIndex: 'provinceId',
      width: 120,
      render: (v: number) => (v != null ? (VIETNAM_PROVINCE_OPTIONS.find((o) => o.value === String(v))?.label || String(v)) : '—'),
    },
    {
      key: 'condition',
      label: 'Tình trạng',
      dataIndex: 'condition',
      width: 120,
      render: (v: string) => {
        const s = CONDITION_STYLE[v || ''] || { color: textTertiary, label: v || '—' };
        return <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${s.color}15`, color: s.color }}>{s.label}</span>;
      },
    },
    {
      key: 'updatedAt',
      label: 'Cán bộ cập nhật',
      dataIndex: 'updatedBy',
      width: 120,
      sortable: true,
      render: (_v: string | null, record: Buoy) => (
        <div>
          <span style={{ fontWeight: fontWeightBold }}>{record.updatedBy != null ? (userMap.get(String(record.updatedBy)) || String(record.updatedBy)) : '—'}</span><br />
          <span style={{ opacity: 0.85 }}>{formatDateTime(record.updatedAt)}</span>
        </div>
      ),
    },
    {
      key: 'submittedForApprovalBy',
      label: 'Cán bộ gửi phê duyệt',
      dataIndex: 'submittedForApprovalBy',
      width: 140,
      sortable: true,
      render: (_v: string | null, record: Buoy) => (
        <div>
          <span style={{ fontWeight: fontWeightBold }}>{record.submittedForApprovalBy != null ? (userMap.get(String(record.submittedForApprovalBy)) || String(record.submittedForApprovalBy)) : '—'}</span><br />
          <span style={{ opacity: 0.85 }}>{formatDateTime(record.submittedForApprovalAt)}</span>
        </div>
      ),
    },
    {
      key: 'level1ApprovedBy',
      label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục',
      dataIndex: 'level1ApprovedBy',
      width: 200,
      sortable: true,
      render: (_v: string | null, record: Buoy) => (
        <div>
          <span style={{ fontWeight: fontWeightBold }}>{record.level1ApprovedBy != null ? (userMap.get(String(record.level1ApprovedBy)) || String(record.level1ApprovedBy)) : '—'}</span><br />
          <span style={{ opacity: 0.85 }}>{formatDateTime(record.level1ApprovedDate)}</span>
        </div>
      ),
    },
    {
      key: 'level2ApprovedBy',
      label: 'Cán bộ phê duyệt cấp Cục',
      dataIndex: 'level2ApprovedBy',
      width: 150,
      sortable: true,
      render: (_v: string | null, record: Buoy) => (
        <div>
          <span style={{ fontWeight: fontWeightBold }}>{record.level2ApprovedBy != null ? (userMap.get(String(record.level2ApprovedBy)) || String(record.level2ApprovedBy)) : '—'}</span><br />
          <span style={{ opacity: 0.85 }}>{formatDateTime(record.level2ApprovedDate)}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      dataIndex: 'status',
      width: 120,
      align: 'center' as const,
      render: (status: string | null | undefined) => {
        const b = buoyStatusBadge(status);
        return (
          <span style={{
            display: 'inline-flex',
            padding: '2px 10px',
            borderRadius: 999,
            fontSize: fontSizeMd,
            fontWeight: fontWeightMedium,
            background: `${b.color}15`,
            color: b.color,
          }}>
            {b.label}
          </span>
        );
      },
    },
  ].map((col) => ({
    ...col,
    sortOrder: col.sortable && col.key === sortField ? sortOrder : undefined,
  })), [page, pageSize, orgMap, userMap, buoyStations, openDetailDrawer, sortField, sortOrder]);

  // ── Row actions with RBAC (moved from BuoyList.tsx) ─────────────

  const rowActions = useCallback((record: Buoy) => {
    const actions: {
      key: string;
      label: string;
      icon?: React.ReactNode;
      onClick: () => void;
      danger?: boolean;
    }[] = [];

    actions.push({
      key: 'view',
      label: 'Chi tiết',
      icon: <EyeOutlined />,
      onClick: () => openDetailDrawer(record),
    });

    if (hasPerm('data:read') || hasPerm('admin:manage')) {
      actions.push({
        key: 'edit',
        label: 'Chỉnh sửa',
        icon: <EditOutlined />,
        onClick: () => openEditDrawer(record),
      });
    }

    if ((hasPerm('data:read') || hasPerm('admin:manage')) && (record.status === 'DRAFT' || record.status === 'REJECTED')) {
      actions.push({
        key: 'submit',
        label: 'Gửi Cảng vụ phê duyệt',
        icon: <CheckCircleOutlined />,
        onClick: () => openSubmitModal(record),
      });
    }

    const canApprove = hasPerm('admin:manage') || hasPerm('data:read');
    if (canApprove && record.status === 'PENDING_APPROVAL') {
      actions.push({
        key: 'approveL1',
        label: 'Cảng vụ phê duyệt',
        icon: <CheckCircleOutlined />,
        onClick: () => openApproveModal(record, 'L1'),
      });
      actions.push({
        key: 'reject',
        label: 'Từ chối',
        icon: <CloseCircleOutlined />,
        onClick: () => openRejectModal(record),
        danger: true,
      });
    }

    if (canApprove && record.status === 'APPROVED_L1') {
      actions.push({
        key: 'approveL2',
        label: 'Cục phê duyệt',
        icon: <CheckCircleOutlined />,
        onClick: () => openApproveModal(record, 'L2'),
      });
      actions.push({
        key: 'reject',
        label: 'Từ chối',
        icon: <CloseCircleOutlined />,
        onClick: () => openRejectModal(record),
        danger: true,
      });
    }

    const deletableStatuses = ['DRAFT', 'REJECTED'];
    if ((hasPerm('admin:manage') || hasPerm('data:read')) && deletableStatuses.includes(record.status || '')) {
      actions.push({
        key: 'delete',
        label: 'Xóa',
        icon: <DeleteOutlined />,
        onClick: () => openDeleteModal(record),
        danger: true,
      });
    }

    actions.push({
      key: 'history',
      label: 'Lịch sử',
      icon: <HistoryOutlined />,
      onClick: () => openHistoryDrawer(record),
    });

    return actions;
  }, [
    hasPerm, openDetailDrawer, openEditDrawer, openSubmitModal,
    openApproveModal, openRejectModal, openDeleteModal, openHistoryDrawer,
  ]);

  // ── JSX ─────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
      <style>{`.list-view-table .ant-table-thead > tr > th { white-space: normal !important; line-height: 1.4 !important; }`}</style>
      <ScreenHeader
        breadcrumb={[{ label: 'Báo hiệu hàng hải' }, { label: 'Quản lý phao tiêu' }]}
        actions={headerActions}
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
          {/* ── Bộ lọc thường (luôn hiển thị) ──────────────────────── */}
          <div style={{ marginBottom: 12, marginTop: spaceMd }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
              Đơn vị quản lý <span style={{ color: statusCritical }}>*</span>
            </div>
            <Select placeholder="Chọn đơn vị" allowClear showSearch optionFilterProp="label"
              value={managingUnitId} onChange={(v) => { setManagingUnitId(v); setPage(1); }}
              options={[{ label: 'Tất cả', value: '__all__' }, ...organizations.map((o) => ({ label: o.name, value: o.id }))]}
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Thuộc nhà trạm QLVH phao, tiêu</div>
            <Select placeholder="Chọn nhà trạm" allowClear showSearch optionFilterProp="label"
              value={filterStationId || undefined}
              onChange={(val) => { setFilterStationId(val); setPage(1); }}
              options={buoyStations.map((s) => ({ label: s.name, value: s.id }))}
              loading={loadingStations}
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tên hoặc mã phao tiêu</div>
            <Input placeholder="Nhập tên hoặc mã phao tiêu..." allowClear
              value={filterQuery}
              onChange={(e) => { setFilterQuery(e.target.value); setPage(1); }}
              style={{ borderRadius: radiusPill, height: 40 }} />
          </div>

          {/* ── Bộ lọc nâng cao (toggle) ────────────────────────────── */}
          {filterCollapsed && (<>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Địa điểm (Tỉnh/TP)</div>
            <Select placeholder="Chọn tỉnh/thành phố" allowClear showSearch
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              value={filterProvince || undefined} onChange={(v) => { setFilterProvince(v || ''); setPage(1); }}
              options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))}
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tình trạng</div>
            <Select placeholder="Chọn tình trạng" allowClear
              value={filterCondition || undefined}
              onChange={(v) => { setFilterCondition(v); setPage(1); }}
              options={CONDITION_OPTIONS}
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Trạng thái</div>
            <Select placeholder="Chọn trạng thái" allowClear
              value={filterApprovalStatus || undefined}
              onChange={(v) => { setFilterApprovalStatus(v); setPage(1); }}
              options={[
                { value: 'DRAFT', label: 'Nháp' },
                { value: 'PENDING_APPROVAL', label: 'Chờ Cảng vụ duyệt' },
                { value: 'APPROVED_L1', label: 'Chờ Cục duyệt' },
                { value: 'PUBLISHED', label: 'Đã phê duyệt' },
                { value: 'REJECTED', label: 'Từ chối' },
              ]}
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Ngày cập nhật</div>
            <DatePicker.RangePicker showTime={{ format: 'HH:mm' }} format="DD/MM/YYYY HH:mm"
              placeholder={['Từ ngày', 'Đến ngày']} allowClear
              value={[filterUpdatedFrom ? dayjs(filterUpdatedFrom) : null, filterUpdatedTo ? dayjs(filterUpdatedTo) : null]}
              onChange={(dates) => { setFilterUpdatedFrom(dates?.[0] ? dates[0].format('YYYY-MM-DD HH:mm') : undefined); setFilterUpdatedTo(dates?.[1] ? dates[1].format('YYYY-MM-DD HH:mm') : undefined); setPage(1); }}
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
        onStatusTabChange={handleTabChange}
      >
        {isError ? null : !isLoading && dataSource.length === 0 ? (
          <DataTable dataSource={[]} rowKey="id"
            emptyState={
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <div style={{ fontSize: fontSizeLg, color: textSecondary, marginBottom: 8 }}>Không tìm thấy phao tiêu nào phù hợp</div>
              </div>
            }
          />
        ) : !isLoading && !isError && dataSource.length > 0 ? (
          <DataTable
            columns={columns}
            dataSource={(() => {
              if (!sortField) return dataSource;
              if (sortField === 'sequenceNo') {
                const arr = [...dataSource];
                return sortOrder === 'descend' ? arr.reverse() : arr;
              }
              return [...dataSource].sort((a: any, b: any) => {
                const aVal = a[sortField] ?? '';
                const bVal = b[sortField] ?? '';
                const cmp = typeof aVal === 'number' && typeof bVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal), 'vi');
                return sortOrder === 'ascend' ? cmp : -cmp;
              });
            })()}
            rowKey="id"
            rowActions={rowActions}
            loading={false}
            onSort={handleSortChange}
            scroll={{ x: 2900, y: 'calc(100vh - 450px)' }}
          />
        ) : null}
        <Pagination
          total={total}
          current={page}
          pageSize={pageSize}
          onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
        />
      </FilterTableLayout>

      {/* ── Create Drawer ──────────────────────────────────────────── */}
      <Drawer
        {...drawerProps}
        title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>Thêm mới phao tiêu</span>}
        open={createDrawerOpen}
        onClose={closeCreateDrawer}
        extra={<Button type="text" onClick={closeCreateDrawer} style={drawerCloseBtnStyle}>✕</Button>}
        footer={
          <div style={drawerFooterStyle}>
            <Button onClick={() => { actionTypeRef.current = 'draft'; createForm.submit(); }} disabled={submitting} style={outlineButtonStyle}>Lưu tạm</Button>
            <Button type="primary" onClick={() => { actionTypeRef.current = 'submit'; createForm.submit(); }} loading={submitting} disabled={submitting} style={primaryButtonStyle}>Lưu và gửi phê duyệt</Button>
            <Button type="primary" onClick={() => { actionTypeRef.current = 'approved'; createForm.submit(); }} disabled={submitting} style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}>Lưu và phê duyệt</Button>
          </div>
        }
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px' },
        }}
        afterOpenChange={(open) => {
          if (open) {
            createForm.resetFields();
            setUploadFileList([]);
            setCreateTabKey('general');
            setCreateCoords([]);
            setCodeLoading(true);
            generateBuoyCode()
              .then((code) => { createForm.setFieldsValue({ code }); })
              .catch(() => { toast.error('Không thể sinh mã tự động, vui lòng thử lại'); })
              .finally(() => { setCodeLoading(false); });
          }
        }}
      >
        <style>{requiredMarkStyle}</style>
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateFinish}
          onFinishFailed={(e: any) => {
            const firstErr = e?.errorFields?.[0]?.name?.[0];
            if (['mapSymbolId', 'coordinateSystem', 'displayRule', 'geometryType'].includes(firstErr)) {
              setCreateTabKey('gis');
            } else if (['lightColor', 'flashType', 'period'].includes(firstErr)) {
              setCreateTabKey('light');
            } else {
              setCreateTabKey('general');
            }
          }}
        >
          <BuoyFormContent
            isEdit={false}
            codeLoading={codeLoading}
            activeTabKey={createTabKey}
            onTabChange={setCreateTabKey}
            orgUnits={organizations.map((o) => ({ id: o.id, name: o.name }))}
            buoyStations={buoyStations.map((s) => ({ id: s.id, name: s.name, code: s.code }))}
            loadingStations={loadingStations}
            onStationChange={handleStationChange}
            uploadFileList={uploadFileList}
            setUploadFileList={setUploadFileList}
            symbols={symbols}
            geometryType={createGeomType}
            gpsCoordList={createCoords}
            addGpsPoint={addCreateGps}
            removeGpsPoint={removeCreateGps}
            updateGpsPoint={updateCreateGps}
            ddToDms={ddToDms}
          />
        </Form>
      </Drawer>

      {/* ── Edit Drawer ────────────────────────────────────────────── */}
      <Drawer
        {...drawerProps}
        title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>Chỉnh sửa thông tin — {editingRecord ? editingRecord.name : 'Phao tiêu'}</span>}
        open={editDrawerOpen}
        onClose={closeEditDrawer}
        extra={<Button type="text" onClick={closeEditDrawer} style={drawerCloseBtnStyle}>✕</Button>}
        footer={
          <div style={drawerFooterStyle}>
            <Button type="primary" onClick={() => updateForm.submit()} loading={submitting} disabled={submitting} style={primaryButtonStyle}>Cập nhật</Button>
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
          onFinish={handleEditFinish}
          onFinishFailed={(e: any) => {
            if (e?.errorFields?.some((f: any) => ['mapSymbolId', 'coordinateSystem', 'displayRule', 'geometryType'].includes(f.name[0]))) {
              setEditTabKey('gis');
            }
          }}
        >
          <BuoyFormContent
            isEdit
            activeTabKey={editTabKey}
            onTabChange={setEditTabKey}
            buoyStations={buoyStations.map((s) => ({ id: s.id, name: s.name, code: s.code }))}
            loadingStations={loadingStations}
            orgUnits={organizations.map((o) => ({ id: o.id, name: o.name }))}
            uploadFileList={uploadFileList}
            setUploadFileList={setUploadFileList}
            symbols={symbols}
            geometryType={editGeomType}
            gpsCoordList={editCoords}
            addGpsPoint={addEditGps}
            removeGpsPoint={removeEditGps}
            updateGpsPoint={updateEditGps}
            ddToDms={ddToDms}
          />
        </Form>
      </Drawer>

      {/* ── Detail Drawer ──────────────────────────────────────────── */}
      <Drawer
        {...drawerProps}
        size={1000}
        title={<span style={drawerTitleStyle}>
          {detailRecord ? `Chi tiết phao tiêu - ${detailRecord.name}` : 'Chi tiết phao tiêu'}
        </span>}
        open={detailDrawerOpen}
        onClose={closeDetailDrawer}
        extra={
          <Button type="text" onClick={closeDetailDrawer} style={drawerCloseBtnStyle}>✕</Button>
        }
        footer={null}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px' },
        }}
      >
        {detailLoading ? <LoadingSkeleton rows={6} /> : detailRecord ? (
          <BuoyDetailContent
            selectedRecord={detailRecord}
            orgUnits={organizations.map((o) => ({ id: o.id, name: o.name }))}
            userMap={userMap}
            detailFiles={detailFiles}
            buoyStatusBadge={buoyStatusBadge}
            symbolMap={symbolMap}
            symbolImageMap={symbolImageMap}
            ddToDms={ddToDms}
          />
        ) : null}
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
                {historyMode === 'all' ? 'Tất cả lịch sử thay đổi — Phao tiêu' : (historyRecord ? `Lịch sử thay đổi — ${historyRecord.name}` : 'Lịch sử thay đổi')}
              </span>
              <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeLg - 1, fontWeight: fontWeightBold, background: `${colors.sidebarBg}15`, color: colors.sidebarBg, lineHeight: '20px' }}>Tổng cộng {historyGroupCount}</span>
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
              onChange={(e) => loadHistoryMode(e.target.value)}>
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
              <Select placeholder="Chọn phao tiêu" allowClear showSearch value={historyEntityFilter || undefined}
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
          ) : renderBuoyHistoryTimeline(historyData)}
        </div>
      </Drawer>

      {/* ── DocumentUploadModal (detail drawer) ────────────────────── */}
      {detailRecord && (
        <DocumentUploadModal
          entityType="buoy"
          entityId={detailRecord.id}
          open={uploadModalVisible}
          onCancel={() => setUploadModalVisible(false)}
        />
      )}

      {/* ── Submit Approval Modal ──────────────────────────────────── */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Xác nhận gửi Cảng vụ phê duyệt</span>}
        open={submitModalOpen}
        onCancel={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }}
        footer={[
          <Button key="cancel" onClick={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="submit" type="primary" onClick={handleConfirmSubmit}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>Xác nhận</Button>,
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
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>{approvingLevel === 'L1' ? 'Xác nhận Cảng vụ phê duyệt' : 'Xác nhận Cục phê duyệt'}</span>}
        open={approveModalOpen}
        onCancel={() => { setApproveModalOpen(false); setApprovingRecord(null); }}
        footer={[
          <Button key="cancel" onClick={() => { setApproveModalOpen(false); setApprovingRecord(null); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="approve" type="primary" onClick={handleConfirmApprove}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: approvingLevel === 'L1' ? statusAttention : statusOperational, borderColor: approvingLevel === 'L1' ? statusAttention : statusOperational }}>Xác nhận</Button>,
        ]}
        width={480}
      >
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary }}>
            {approvingLevel === 'L1' ? 'Cảng vụ' : 'Cục'} phê duyệt <strong>{approvingRecord?.code} — {approvingRecord?.name}</strong>?
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
        open={rejectModalOpen}
        onCancel={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); }}
        footer={[
          <Button key="cancel" onClick={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="reject" type="primary" danger onClick={handleConfirmReject}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Xác nhận từ chối</Button>,
        ]}
        width={480}
      >
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>
            Vui lòng nhập lý do từ chối cho phao tiêu:
          </p>
          {rejectingRecord && (
            <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>
              <strong style={{ color: textPrimary }}>{rejectingRecord.name}</strong>
            </p>
          )}
          <Input.TextArea
            placeholder="Nhập lý do từ chối (tối thiểu 10, tối đa 500 ký tự)..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            maxLength={500}
            showCount
            style={{ borderRadius: 8, fontSize: fontSizeMd }}
          />
        </div>
      </Modal>

      {/* ── Delete Confirmation Modal ──────────────────────────────── */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Xác nhận xóa phao tiêu</span>}
        open={deleteModalOpen}
        onCancel={() => { setDeleteModalOpen(false); setDeletingRecord(null); setDeleteConfirmText(''); }}
        footer={[
          <Button key="cancel" onClick={() => { setDeleteModalOpen(false); setDeletingRecord(null); setDeleteConfirmText(''); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="delete" type="primary" danger onClick={handleConfirmDelete}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Xác nhận xóa</Button>,
        ]}
        width={480}
      >
        <div style={{ padding: '8px 0' }}>
          <Alert message="Hành động này không thể hoàn tác" type="warning" showIcon icon={<ExclamationCircleOutlined />}
            style={{ marginBottom: spaceFormField, borderRadius: radiusPill }} />
          <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>
            Vui lòng nhập <strong>tên phao tiêu</strong> hoặc gõ <strong>"XÓA"</strong> để xác nhận xóa.
          </p>
          {deletingRecord && (
            <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>
              Phao tiêu: <strong style={{ color: textPrimary }}>{deletingRecord.name}</strong>
            </p>
          )}
          <Input
            placeholder="Nhập tên phao tiêu hoặc XÓA"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            onPressEnter={handleConfirmDelete}
            style={{ borderRadius: radiusPill, height: 40 }}
            autoFocus
          />
        </div>
      </Modal>
    </div>
  );
}

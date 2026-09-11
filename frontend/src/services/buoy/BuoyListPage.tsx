// ── BuoyListPage — list screen + all Drawers/Modals (T6, design §4.2) ─
// Port-shaped orchestrator: fetch + filters + tabs + client-side pagination (D-3)
// + 4 Drawers (create/edit/detail/history) + reject/delete/approve Modals
// + DocumentUploadModal. Handlers moved from the old routed BuoyList screen.

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Button,
  Modal,
  Input,
  Space,
  Form,
  DatePicker,
  Select,
  Typography,
  Radio,
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { usePermissionStore } from '../../store/permissionStore';
import { useAuthStore } from '../../store/authStore';
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
  BUOY_TYPE_OPTIONS,
  COLOR_LABEL_MAP, SHAPE_LABEL_MAP, LIGHT_CHAR_LABEL_MAP, BUOY_FIELD_MAP,
  CONDITION_OPTIONS, buoyStatusBadge, TAB_STATUS_LIST,
} from './schema';
import type { Buoy, ChangeHistory, CreateBuoyRequest } from './types';
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
import { normalizeSafeNumber } from '../../utils/numFmt';
import {
  statusOperational, statusCritical, actionPrimary, statusAttention,
  textPrimary, textSecondary, textTertiary, borderDefault,
  fontSizeMd, fontSizeLg, fontWeightMedium, fontWeightBold,
  spaceMd, spaceSm, spaceXs, spaceXl, spaceFormField, radiusPill,
  drawerTitleStyle, drawerFooterStyle,
  primaryButtonStyle, outlineButtonStyle, requiredMarkStyle,
  statusBadgeStyle, cellTitleStyle, cellSubtitleStyle, icons,
  fontSizeSm, getRangePickerProps,
  formatUserDisplayName, isUuidString,
} from '../../themetokenchk';
import { colors } from '../../themetokenchk';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import { FilterOrgUnitTreeSelect, useOrgUnitFilter } from '../../components/org-unit';
import { canEditApprovalRecord } from '../../utils/approvalEditPolicy';
import { approvalStatusLabel } from '../../components/shared/ApprovalStatusBadge';
import { formatHistoryNumber } from '../../utils/numFmt';
import { renderStandardHistoryCards, isBlankOrDash } from '../../utils/changeHistoryRenderer';
import ApprovalModal from '../../components/shared/ApprovalModal';
import { AppDrawer } from '../../components/shared/AppDrawer';
import { DeleteConfirmModal } from '../../components/shared/DeleteConfirmModal';

// ── Helpers (moved verbatim from BuoyList.tsx / BuoyForm.tsx) ────────

// Nhãn trường form — dùng cho phản hồi validate rõ ràng
const BUOY_FORM_FIELD_LABELS: Record<string, string> = {
  unitId: 'Đơn vị quản lý',
  buoyStationId: 'Thuộc nhà trạm quản lý vận hành phao, tiêu',
  classification: 'Phân loại',
  name: 'Tên phao, tiêu',
  lightHeight: 'Chiều cao tâm sáng',
  range: 'Phạm vi chiếu sáng',
  condition: 'Tình trạng',
  mapSymbolId: 'Biểu tượng',
  coordinateSystem: 'Hệ quy chiếu',
  displayRule: 'Quy tắc hiển thị',
  geometryType: 'Loại đối tượng',
};

/** Phản hồi khi validate form thất bại: toast liệt kê trường thiếu + tự cuộn tới lỗi đầu tiên.
 *  Trước đây lỗi nằm ở các trường dưới vùng cuộn của popup khiến bấm nút tưởng như không phản ứng. */
function showValidationFeedback(e: { errorFields?: { name?: (string | number)[]; errors?: string[] }[] }) {
  const fields = e?.errorFields ?? [];
  const names = fields.map((f) => String(f.name?.[0])).filter(Boolean);
  if (names.length > 0) {
    const labels = [...new Set(names.map((n) => BUOY_FORM_FIELD_LABELS[n] ?? n))];
    toast.error(`Vui lòng hoàn thiện các trường bắt buộc: ${labels.join(', ')}`);
  }
  requestAnimationFrame(() => {
    document.querySelector('.ant-drawer-open .ant-form-item-has-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

function formatDateOnly(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    return dayjs(dateStr).format('DD/MM/YYYY');
  } catch {
    return dateStr;
  }
}

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

// ── Nhãn tiếng Việt bổ sung cho các trường phao tiêu trong lịch sử thay đổi ──
// (BUOY_FIELD_MAP trong schema.ts không sửa vì là one-way-door — bổ sung local)
const EXTRA_HISTORY_FIELD_LABELS: Record<string, string> = {
  buoyStationId: 'Nhà trạm quản lý vận hành', locationDetail: 'Địa điểm chi tiết',
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
  'Tài liệu đính kèm': 'File đính kèm',
  'File đính kèm': 'File đính kèm',
  attachments: 'File đính kèm',
  'Tọa độ GIS': 'Tọa độ GPS',
  'Tọa độ GPS': 'Tọa độ GPS',
  'Loại đối tượng GIS': 'Loại đối tượng',
  'Loại đối tượng': 'Loại đối tượng',
  status: 'Trạng thái',
  approvalStatus: 'Trạng thái',
  'Trạng thái': 'Trạng thái',
  'Trạng thái phê duyệt': 'Trạng thái',
};

const NUMERIC_HISTORY_FIELDS = new Set([
  'area', 'bodyHeight', 'diameter', 'towerHeight', 'lightHeight', 'range', 'period',
  'Diện tích', 'Chiều cao thân', 'Đường kính', 'Chiều cao tháp', 'Chiều cao tâm sáng', 'Phạm vi(Hải lý)', 'Chu kỳ',
]);

function historyFieldLabel(fn: string): string {
  return EXTRA_HISTORY_FIELD_LABELS[fn] || BUOY_FIELD_MAP[fn] || fn;
}

// ── Thứ tự hiển thị field trong lịch sử (theo thứ tự form tạo phao tiêu — giống BerthList) ──
const HISTORY_FIELD_ORDER = ['code', 'name', 'type', 'classification', 'classificationBuoy', 'classificationMark',
  'unitId', 'buoyStationId', 'provinceId', 'locationDetail', 'color', 'shape', 'structure', 'area',
  'bodyHeight', 'diameter', 'beaconLight', 'towerHeight', 'lightHeight', 'lightModel', 'towerColor',
  'powerSupply', 'range', 'lightCharacteristic', 'lightColor', 'flashType', 'period', 'commissionedDate',
  'lastRepairDate', 'condition', 'lastInspectionDate', 'nextInspectionDate', 'isActive',
  'geometryType', 'Loại đối tượng GIS', 'Tọa độ GIS', 'Tọa độ GPS', 'Loại đối tượng', 'mapSymbolId', 'coordinateSystem', 'displayRule',
  'status', 'approvalStatus', 'rejectionReason', 'Tài liệu đính kèm', 'File đính kèm'];

// ── Bản đồ nhãn giá trị cho lịch sử (giống BerthList.historyFieldValue) ──
const GEOMETRY_TYPE_LABELS: Record<string, string> = { POINT: 'Đối tượng điểm', LINE: 'Đối tượng đường', POLYGON: 'Đối tượng vùng' };
const COORD_SYS_LABELS: Record<string, string> = { '1': 'WGS-84', '2': 'VN-2000' };

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
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
    if (wkt.startsWith('POLYGON((')) { const m = wkt.match(/POLYGON\s*\(\(([^)]+)\)\)/); if (m) { const pts = m[1].split(',').map(p => { const [lng, lat] = p.trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude)); if (pts.length > 1 && pts[0].longitude === pts[pts.length - 1].longitude) pts.pop(); return pts; } }
    const mm = wkt.match(/MULTIPOINT\s*\(((?:\([^)]*\),?)+)/); if (mm) return mm[1].split('),(').map(p => { const [lng, lat] = p.replace(/[()]/g, '').trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude));
    const pm = wkt.match(/POINT\s*\(([\d.+-]+)\s+([\d.+-]+)\)/); if (pm) return [{ latitude: parseFloat(pm[2]), longitude: parseFloat(pm[1]) }];
  } catch { /* invalid */ }
  return [];
}

// Số lượng tọa độ mặc định tương ứng với từng loại đối tượng: điểm → 1, đường → 2, vùng → 3
const GEOMETRY_POINT_COUNT: Record<string, number> = { POINT: 1, LINE: 2, POLYGON: 3 };

// Style badge Tình trạng giống bến cảng (operationalStatus pill)
const CONDITION_STYLE: Record<string, { color: string; label: string }> = {
  'Đang khai thác/vận hành': { color: statusOperational, label: 'Đang khai thác/vận hành' },
  'Chưa khai thác/vận hành': { color: statusAttention, label: 'Chưa khai thác/vận hành' },
  'Dừng khai thác/vận hành': { color: statusCritical, label: 'Dừng khai thác/vận hành' },
};

// Map tab key → giá trị status lọc (giống BerthList TAB_QUERY_MAP; giá trị theo field `status` của Buoy)
const TAB_QUERY_MAP: Record<string, string | undefined> = {
  all: undefined, DRAFT: 'DRAFT', PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED_L1: 'APPROVED_L1', PUBLISHED: 'PUBLISHED', REJECTED_L1: 'REJECTED_L1', REJECTED_L2: 'REJECTED_L2',
};

function ddToDms(dd: number | null | undefined): { d: number; m: number; s: number } {
  if (dd == null || isNaN(dd)) return { d: 0, m: 0, s: 0 };
  let abs = Math.abs(dd);
  let d = Math.floor(abs);
  let mFloat = (abs - d) * 60;
  if (mFloat > 59.999999999) { d += 1; mFloat = 0; }
  let m = Math.floor(mFloat);
  let sFloat = (mFloat - m) * 60;
  if (sFloat > 59.999999999) { m += 1; sFloat = 0; if (m >= 60) { m = 0; d += 1; } }
  let s = Math.round(sFloat * 100) / 100;
  if (s >= 60) { s = 0; m += 1; if (m >= 60) { m = 0; d += 1; } }
  return { d, m, s };
}

function normalizeHistoryKey(value: string): string {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');
}

// ── Component ────────────────────────────────────────────────────────

export default function BuoyListPage() {
  const hasPerm = usePermissionStore((s: any) => s.hasPermission);
  const currentUser = useAuthStore((s: any) => s.user);

  // ── Filter state ─────────────────────────────────────────────────

  const [filterStationId, setFilterStationId] = useState<string | undefined>();

  // Bộ lọc thường (luôn hiển thị)
  const [filterName, setFilterName] = useState('');
  const [filterCode, setFilterCode] = useState('');

  // Bộ lọc nâng cao (toggle)
  const [filterProvince, setFilterProvince] = useState('');
  const [filterCondition, setFilterCondition] = useState<string | undefined>();
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState<string | undefined>();
  const [filterUpdatedTo, setFilterUpdatedTo] = useState<string | undefined>();

  const {
    orgUnitId: managingUnitId,
    setOrgUnitId: setManagingUnitId,
    resetOrgUnit,
    organizations,
    orgLevel2Map,
    orgMap,
    isReady: orgUnitReady,
  } = useOrgUnitFilter();

  const [activeTab, setActiveTab] = useState('all');
  const [sortField, setSortField] = useState<string>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend' | null>('descend');
  const [filterCollapsed, setFilterCollapsed] = useState(false);

  // ── Pagination (client-side, D-3) ────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // ── Data ─────────────────────────────────────────────────────────
  const [dataSource, setDataSource] = useState<Buoy[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  // ── Organizations + Users for lookup ────────────────────────────
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());


  // ── Tab counts ──────────────────────────────────────────────────
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  // ── Create/Edit Drawers ─────────────────────────────────────────
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Buoy | null>(null);
  const [createForm] = Form.useForm();
  const [createTabKey, setCreateTabKey] = useState('general');
  const [codeLoading, setCodeLoading] = useState(false);
  const [buoyStations, setBuoyStations] = useState<BuoyStationResponse[]>([]);
  // Nhà trạm cho form Thêm mới / Chỉnh sửa — load theo Đơn vị quản lý đã chọn, chỉ nhà trạm Đã phê duyệt (PUBLISHED)
  const [createStations, setCreateStations] = useState<BuoyStationResponse[]>([]);
  const [loadingCreateStations, setLoadingCreateStations] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const actionTypeRef = useRef<'draft' | 'submit' | 'approved'>('submit');

  // ── Danh sách nhà trạm QLVH phao tiêu (SelectKcht — nguồn sinh mã {mã nhà trạm}-PT-{seq}) ──
  useEffect(() => {
    let cancelled = false;
    fetchBuoyStationList({})
      .then((res) => { if (!cancelled) setBuoyStations(res.content || []); })
      .catch(() => { if (!cancelled) toast.error('Không thể tải danh sách nhà trạm quản lý vận hành'); });
    return () => { cancelled = true; };
  }, []);

  // Chọn nhà trạm → sinh mã tự động {mã nhà trạm}-PT-{seq} (chỉ chế độ thêm mới)
  const handleStationChange = useCallback((stationId: string | undefined) => {
    if (!stationId) {
      // Bỏ chọn nhà trạm → xóa mã, không sinh mã dự phòng PT-xxxxxx
      createForm.setFieldsValue({ code: undefined });
      return;
    }
    setCodeLoading(true);
    generateBuoyCode(stationId)
      .then((code) => { createForm.setFieldsValue({ code }); })
      .catch(() => { toast.error('Không thể sinh mã tự động, vui lòng thử lại'); })
      .finally(() => { setCodeLoading(false); });
  }, [createForm]);

  // Đơn vị quản lý đang chọn trong form Thêm mới / Chỉnh sửa (pattern BerthForm: load Cảng biển theo orgUnit)
  const createUnitId = Form.useWatch('unitId', createForm);

  // Form Thêm mới / Chỉnh sửa: đổi Đơn vị quản lý → reset nhà trạm + mã (khi thêm mới), load nhà trạm thuộc đơn vị (chỉ Đã phê duyệt)
  useEffect(() => {
    let cancelled = false;
    if (createUnitId) {
      if (!editingRecord) {
        createForm.setFieldsValue({ buoyStationId: undefined, code: undefined });
      }
      setLoadingCreateStations(true);
      fetchBuoyStationList({ unitId: createUnitId, status: 'PUBLISHED' })
        .then((res) => {
          if (cancelled) return;
          let list = res.content || [];
          const curId = editingRecord?.buoyStationId;
          if (curId && !list.some((s) => s.id === curId)) {
            const cur = buoyStations.find((s) => s.id === curId);
            if (cur) list = [cur, ...list];
          }
          setCreateStations(list);
        })
        .catch(() => { if (!cancelled) setCreateStations([]); })
        .finally(() => { if (!cancelled) setLoadingCreateStations(false); });
    } else {
      setCreateStations([]);
    }
    return () => { cancelled = true; };
  }, [createUnitId, editingRecord, buoyStations, createForm]);

  const [uploadFileList, setUploadFileList] = useState<any[]>([]);
  const [pendingDeletedAttachmentIds, setPendingDeletedAttachmentIds] = useState<string[]>([]);
  const [symbols, setSymbols] = useState<GisSymbol[]>([]);
  const [createCoords, setCreateCoords] = useState<Array<{ latD: number | null; latM: number | null; latS: number | null; lngD: number | null; lngM: number | null; lngS: number | null }>>([]);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const createGeomType = Form.useWatch('geometryType', createForm);

  // ── GIS: symbols + coordinate list (giống BerthForm tab Thông tin vị trí) ──
  useEffect(() => {
    symbolService.list({ page: 1, pageSize: 1000, status: 'active' })
      .then((r) => setSymbols(r.data || []))
      .catch(() => { });
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
    if (!createGeomType) {
      createForm.setFieldsValue({ coordinateSystem: undefined, displayRule: undefined });
      setCreateCoords([]);
      return;
    }
    createForm.setFieldsValue({ coordinateSystem: 1, displayRule: 'Độ, phút, giây (DMS)' });
    // Đổi loại đối tượng GIỮ tọa độ đã nhập — chỉ thêm dòng trống cho đủ số lượng (chuẩn VTS CHK)
    const count = GEOMETRY_POINT_COUNT[createGeomType] ?? 1;
    setCreateCoords((prev) => {
      if (!prev || prev.length >= count) return prev;
      const added = Array.from({ length: count - prev.length }, () => ({ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }));
      return [...prev, ...added];
    });
  }, [createGeomType, createForm]);

  const updateCreateGps = useCallback((i: number, field: 'lat' | 'lng', d: number | null, m: number | null, s: number | null) => {
    // Chặn giá trị vượt ngưỡng khi gõ: độ ≤ 90/180, phút ≤ 59, giây ≤ 59.99 (tránh hiển thị mấy trăm)
    const dMax = field === 'lat' ? 90 : 180;
    const dClamped = Math.min(dMax, Math.max(0, d ?? 0));
    const mClamped = Math.min(59, Math.max(0, m ?? 0));
    const sClamped = Math.min(59.99, Math.max(0, s ?? 0));
    setCreateCoords((p) => {
      const n = [...p];
      n[i] = { ...n[i], [field === 'lat' ? 'latD' : 'lngD']: dClamped, [field === 'lat' ? 'latM' : 'lngM']: mClamped, [field === 'lat' ? 'latS' : 'lngS']: sClamped };
      return n;
    });
    setGpsError(null);
  }, []);
  const addCreateGps = useCallback(() => { setCreateCoords((p) => [...p, { latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }]); setGpsError(null); }, []);
  const removeCreateGps = useCallback((i: number) => { setCreateCoords((p) => (p.length <= 1 ? p : p.filter((_, idx) => idx !== i))); setGpsError(null); }, []);

  // ── Detail Drawer ───────────────────────────────────────────────
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<Buoy | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailFiles, setDetailFiles] = useState<any[]>([]);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);

  // ── Delete confirmation modal ───────────────────────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<Buoy | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── History Drawer ──────────────────────────────────────────────
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [historyRecord, setHistoryRecord] = useState<Buoy | null>(null);
  const [historyData, setHistoryData] = useState<ChangeHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearchInput, setHistorySearchInput] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');
  const [historyMode, setHistoryMode] = useState<'current' | 'all'>('current');
  const [historyEntityNames, setHistoryEntityNames] = useState<Record<string, string>>({});
  const [historyEntityFilter, setHistoryEntityFilter] = useState('');

  const historyFieldCount = useMemo(() => historyData.length, [historyData]);

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
  const [approvingLevel, setApprovingLevel] = useState<'L1' | 'L2'>('L1');

  // ── Load users ──────────────────────────────────
  useEffect(() => {
    (async () => {

      try {
        const resp = await userService.list({ pageSize: 1000 });
        const users = resp.data || (resp as any).content || [];
        const map = new Map<string, string>();
        users.forEach((u: any) => {
          const name = u.fullName || u.username || '';
          if (name && !isUuidString(name)) map.set(u.id, name);
        });
        setUserMap(map);
      } catch (err) {
        console.error('Failed to load users', err);
      }
    })();
  }, []);

  useEffect(() => {
    if (managingUnitId !== undefined && !initialLoadDone) {
      setInitialLoadDone(true);
    }
  }, [managingUnitId, initialLoadDone]);

  // ── Fetch main data (client-side filter + paginate, D-3) ────────
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const all = await searchBuoys({
        name: filterName || undefined,
        code: filterCode || undefined,
        condition: filterCondition || undefined,
        provinceId: filterProvince ? (Number(VIETNAM_PROVINCE_OPTIONS.find((o) => o.label === filterProvince)?.value) || undefined) : undefined,
        updatedFrom: filterUpdatedFrom,
        updatedTo: filterUpdatedTo,
      });
      // Lọc theo đơn vị quản lý (subtree — đơn vị cha thấy cả đơn vị con, chuẩn Cảng biển)
      const orgList = organizationsRef.current.length > 0 ? organizationsRef.current : organizations;
      const unitSubtree = managingUnitId ? collectOrgSubtreeIds(orgList, managingUnitId) : null;
      const unitFiltered = unitSubtree ? all.filter((d) => d.unitId && unitSubtree.has(d.unitId)) : all;
      const stationFiltered = filterStationId ? unitFiltered.filter((d) => d.buoyStationId === filterStationId) : unitFiltered;

      // Tab counts từ FULL dataset (không lọc theo tab đang chọn — giống BerthList fetchCounts)
      const counts: Record<string, number> = { all: stationFiltered.length };
      TAB_STATUS_LIST.slice(1).forEach((tab) => {
        counts[tab.key] = stationFiltered.filter((d) => d.status === tab.key).length;
      });
      setTabCounts(counts);

      // Lọc trạng thái theo tab đang chọn (bộ lọc nâng cao đã bỏ trạng thái — tab là nguồn duy nhất)
      const effectiveStatus = TAB_QUERY_MAP[activeTab];
      const tabFiltered = effectiveStatus ? stationFiltered.filter((d) => d.status === effectiveStatus) : stationFiltered;
      setTotal(tabFiltered.length);

      const start = (page - 1) * pageSize;
      setDataSource(tabFiltered.slice(start, start + pageSize));
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [filterName, filterCode, filterCondition, filterProvince, managingUnitId, filterStationId, filterUpdatedFrom, filterUpdatedTo, activeTab, page, pageSize]);

  useEffect(() => { if (initialLoadDone) void fetchData(); }, [fetchData, initialLoadDone]);

  // ── Filter handlers ─────────────────────────────────────────────

  const handleFilterApply = useCallback(() => {
    setPage(1);
    void fetchData();
  }, [fetchData]);

  const handleFilterReset = useCallback(() => {
    // Reset về đơn vị quản lý mặc định
    resetOrgUnit();
    setFilterStationId(undefined);
    setFilterName('');
    setFilterCode('');
    setFilterProvince('');
    setFilterCondition(undefined);
    setFilterUpdatedFrom(undefined);
    setFilterUpdatedTo(undefined);
    setActiveTab('all');
    setPage(1);
  }, [resetOrgUnit]);


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
    setEditingRecord(null);
    setCreateDrawerOpen(true);
    setCreateTabKey('general');
    setUploadFileList([]);
    setPendingDeletedAttachmentIds([]);
    setCreateCoords([]);
    createForm.resetFields();
    setCodeLoading(true);
    generateBuoyCode()
      .then((code) => { createForm.setFieldsValue({ code }); })
      .catch(() => { toast.error('Không thể sinh mã tự động, vui lòng thử lại'); })
      .finally(() => { setCodeLoading(false); });
  }, [createForm]);

  const closeCreateDrawer = useCallback(() => {
    setCreateDrawerOpen(false);
    createForm.resetFields();
    setUploadFileList([]);
    setPendingDeletedAttachmentIds([]);
    setCreateCoords([]);
  }, [createForm]);

  const handleDeleteAttachment = useCallback((uid: string) => {
    setPendingDeletedAttachmentIds((prev) => [...prev, uid]);
  }, []);

  const openEditDrawer = useCallback(async (record: Buoy) => {
    setEditingRecord(record);
    setCreateDrawerOpen(true);
    setUploadFileList([]);
    setPendingDeletedAttachmentIds([]);
    createForm.resetFields();
    setCreateTabKey('general');
    try {
      const data = await fetchBuoyById(record.id);
      setEditingRecord(data);
      // Load existing attachments
      try {
        const fileRes = await documentApi.listByEntity('buoy', data.id, { page: 1, size: 50 });
        setUploadFileList((fileRes.data || []).map((a: any) => ({
          uid: a.id, name: a.fileName, size: a.fileSize, status: 'done' as const,
          uploadedBy: a.uploadedBy, uploadedAt: a.uploadedAt,
        })));
      } catch { setUploadFileList([]); }
      const loadedCoords = parseGisCoordinateList({ geometryType: data.geometryType, coordinates: data.coordinates });
      setCreateCoords(loadedCoords.length > 0 ? loadedCoords.map((c) => {
        const latDms = ddToDms(c.latitude);
        const lngDms = ddToDms(c.longitude);
        return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
      }) : []);
      createForm.setFieldsValue({
        code: data.code,
        name: data.name,
        unitId: data.unitId,
        description: data.description || undefined,
        isActive: data.isActive,
        color: data.color || undefined,
        shape: data.shape || undefined,
        lightCharacteristic: data.lightCharacteristic || undefined,
        range: normalizeSafeNumber(data.range),
        buoyStationId: data.buoyStationId || undefined,
        classification: data.classification || undefined,
        classificationBuoy: data.classificationBuoy || undefined,
        classificationMark: data.classificationMark || undefined,
        provinceId: data.provinceId != null ? String(data.provinceId) : undefined,
        locationDetail: data.locationDetail || undefined,
        condition: data.condition || undefined,
        structure: data.structure || undefined,
        area: normalizeSafeNumber(data.area),
        bodyHeight: normalizeSafeNumber(data.bodyHeight),
        diameter: normalizeSafeNumber(data.diameter),
        beaconLight: data.beaconLight || undefined,
        towerHeight: normalizeSafeNumber(data.towerHeight),
        lightHeight: normalizeSafeNumber(data.lightHeight),
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
      setCreateDrawerOpen(false);
      setEditingRecord(null);
    }
  }, [createForm, ddToDms]);

  // ── Upload helper (after save) ──────────────────────────────────

  const uploadFilesAfterSave = useCallback(async (savedId: string, files: any[], skipHistory = false) => {
    let uploaded = 0;
    for (const fileItem of files) {
      const originFile = (fileItem.originFileObj || fileItem.file || (fileItem instanceof File ? fileItem : undefined)) as File | undefined;
      if (!originFile) continue; // existing attachment (no originFileObj) — skip
      try {
        const formData = new FormData();
        formData.append('file', originFile);
        await api.post(`/v1/documents/upload/buoy/${savedId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          params: { skipHistory },
        });
        uploaded++;
      } catch { toast.error(`Tải lên tệp "${fileItem.name || originFile.name}" thất bại`); }
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
    if (values.range == null || Number(values.range) <= 0) {
      toast.error('Phạm vi chiếu sáng phải lớn hơn 0 hải lý'); return;
    }

    const manualCoords = createCoords
      .filter((c) => (c.latD != null || c.latM != null || c.latS != null) && (c.lngD != null || c.lngM != null || c.lngS != null))
      .map((c) => ({ latitude: (c.latD ?? 0) + (c.latM ?? 0) / 60 + (c.latS ?? 0) / 3600, longitude: (c.lngD ?? 0) + (c.lngM ?? 0) / 60 + (c.lngS ?? 0) / 3600 }));
    if (manualCoords.length > 0) {
      if (manualCoords[0].latitude < -90 || manualCoords[0].latitude > 90) {
        toast.error('Vĩ độ phải từ -90° đến 90° (WGS84)'); return;
      }
      if (manualCoords[0].longitude < -180 || manualCoords[0].longitude > 180) {
        toast.error('Kinh độ phải từ -180° đến 180° (WGS84)'); return;
      }
    }

    if (values.geometryType) {
      const minCount = GEOMETRY_POINT_COUNT[values.geometryType] ?? 1;
      if (manualCoords.length < minCount) {
        toast.error(values.geometryType === 'POLYGON' ? 'Đối tượng vùng cần ít nhất 3 tọa độ hợp lệ' : values.geometryType === 'LINE' ? 'Đối tượng đường cần ít nhất 2 tọa độ hợp lệ' : 'Đối tượng điểm cần ít nhất 1 tọa độ hợp lệ');
        setCreateTabKey('gis');
        return;
      }
    }
    if ((values.geometryType || manualCoords.length > 0) && !values.mapSymbolId) {
      toast.error('Vui lòng chọn biểu tượng bản đồ');
      setCreateTabKey('gis');
      return;
    }
    if (manualCoords.length > 0 && !values.geometryType) {
      toast.error('Loại đối tượng là bắt buộc khi có tọa độ');
      setCreateTabKey('gis');
      return;
    }

    // Kiểm tra trùng mã / tên phao tiêu khi thêm mới (chặn lưu)
    try {
      const dupByCode = await searchBuoys({ code });
      if (Array.isArray(dupByCode) && dupByCode.length > 0) {
        toast.error('Mã phao tiêu đã tồn tại. Vui lòng tạo mã khác.');
        return;
      }
      const dupByName = await searchBuoys({ name });
      if (Array.isArray(dupByName) && dupByName.length > 0) {
        toast.error('Tên phao tiêu đã tồn tại. Vui lòng nhập tên khác.');
        return;
      }
    } catch {
      // non-blocking
    }

    setSubmitting(true);
    try {
      const toPayloadNumber = (v: unknown): number | undefined => {
        if (v == null || v === '') return undefined;
        const n = typeof v === 'number' ? v : Number(v);
        return isNaN(n) ? undefined : n;
      };
      const payload: CreateBuoyRequest = {
        code,
        name,
        unitId: values.unitId || undefined,
        description: values.description || undefined,
        color: values.color || undefined,
        shape: values.shape || undefined,
        lightCharacteristic: values.lightCharacteristic || undefined,
        range: toPayloadNumber(values.range),
        buoyStationId: values.buoyStationId || undefined,
        classification: values.classification || undefined,
        classificationBuoy: values.classificationBuoy || undefined,
        classificationMark: values.classificationMark || undefined,
        provinceId: values.provinceId != null ? Number(values.provinceId) : undefined,
        locationDetail: values.locationDetail || undefined,
        condition: values.condition || undefined,
        structure: values.structure || undefined,
        area: toPayloadNumber(values.area),
        bodyHeight: toPayloadNumber(values.bodyHeight),
        diameter: toPayloadNumber(values.diameter),
        beaconLight: values.beaconLight || undefined,
        towerHeight: toPayloadNumber(values.towerHeight),
        lightHeight: toPayloadNumber(values.lightHeight),
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
        isActive: values.isActive !== undefined ? values.isActive : true,
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
      Object.keys(payload).forEach((key) => { if ((payload as any)[key] === undefined) delete (payload as any)[key]; });
      payload.code = code;

      const res = await createBuoy(payload as any);
      const savedId = (res as any)?.id;
      toast.success(action === 'draft' ? 'Lưu nháp thành công' : action === 'approved' ? 'Lưu và phê duyệt thành công' : 'Gửi phê duyệt thành công');

      if (savedId && uploadFileList.length > 0) {
        await uploadFilesAfterSave(savedId, uploadFileList, true);
      }

      closeCreateDrawer();
      setSortField('updatedAt');
      setSortOrder('descend');
      setPage(1);
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
    if (values.range == null || Number(values.range) <= 0) {
      toast.error('Phạm vi chiếu sáng phải lớn hơn 0 hải lý'); return;
    }

    const manualCoords = createCoords
      .filter((c) => (c.latD != null || c.latM != null || c.latS != null) && (c.lngD != null || c.lngM != null || c.lngS != null))
      .map((c) => ({ latitude: (c.latD ?? 0) + (c.latM ?? 0) / 60 + (c.latS ?? 0) / 3600, longitude: (c.lngD ?? 0) + (c.lngM ?? 0) / 60 + (c.lngS ?? 0) / 3600 }));
    if (manualCoords.length > 0) {
      if (manualCoords[0].latitude < -90 || manualCoords[0].latitude > 90) {
        toast.error('Vĩ độ phải từ -90° đến 90° (WGS84)'); return;
      }
      if (manualCoords[0].longitude < -180 || manualCoords[0].longitude > 180) {
        toast.error('Kinh độ phải từ -180° đến 180° (WGS84)'); return;
      }
    }

    if (values.geometryType) {
      const minCount = GEOMETRY_POINT_COUNT[values.geometryType] ?? 1;
      if (manualCoords.length < minCount) {
        toast.error(values.geometryType === 'POLYGON' ? 'Đối tượng vùng cần ít nhất 3 tọa độ hợp lệ' : values.geometryType === 'LINE' ? 'Đối tượng đường cần ít nhất 2 tọa độ hợp lệ' : 'Đối tượng điểm cần ít nhất 1 tọa độ hợp lệ');
        setCreateTabKey('gis');
        return;
      }
    }
    if ((values.geometryType || manualCoords.length > 0) && !values.mapSymbolId) {
      toast.error('Vui lòng chọn biểu tượng bản đồ');
      setCreateTabKey('gis');
      return;
    }
    if (manualCoords.length > 0 && !values.geometryType) {
      toast.error('Loại đối tượng là bắt buộc khi có tọa độ');
      setCreateTabKey('gis');
      return;
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
      const toPayloadNumber = (v: unknown): number | undefined => {
        if (v == null || v === '') return undefined;
        const n = typeof v === 'number' ? v : Number(v);
        return isNaN(n) ? undefined : n;
      };
      const payload: Partial<CreateBuoyRequest> = {
        name,
        unitId: values.unitId || undefined,
        description: values.description || undefined,
        color: values.color || undefined,
        shape: values.shape || undefined,
        lightCharacteristic: values.lightCharacteristic || undefined,
        range: toPayloadNumber(values.range),
        buoyStationId: values.buoyStationId || undefined,
        classification: values.classification || undefined,
        classificationBuoy: values.classificationBuoy || undefined,
        classificationMark: values.classificationMark || undefined,
        provinceId: values.provinceId != null ? Number(values.provinceId) : undefined,
        locationDetail: values.locationDetail || undefined,
        condition: values.condition || undefined,
        structure: values.structure || undefined,
        area: toPayloadNumber(values.area),
        bodyHeight: toPayloadNumber(values.bodyHeight),
        diameter: toPayloadNumber(values.diameter),
        beaconLight: values.beaconLight || undefined,
        towerHeight: toPayloadNumber(values.towerHeight),
        lightHeight: toPayloadNumber(values.lightHeight),
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
        isActive: values.isActive !== undefined ? values.isActive : true,
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
      Object.keys(payload).forEach((key) => { if ((payload as any)[key] === undefined) delete (payload as any)[key]; });

      if (actionTypeRef.current) {
        (payload as any).action = actionTypeRef.current;
      }
      await updateBuoy(editingRecord.id, payload as any);
      toast.success(
        actionTypeRef.current === 'draft'
          ? 'Lưu tạm thành công'
          : actionTypeRef.current === 'approved'
          ? 'Lưu và phê duyệt thành công'
          : 'Lưu và gửi phê duyệt thành công'
      );

      const wasApproved = editingRecord.approvalStatus === 'APPROVED' || editingRecord.approvalStatus === 'APPROVED_LEVEL2' || (editingRecord as any).approvalStatus === 'APPROVED_L2' || (editingRecord as any).approvalStatus === 'PUBLISHED';

      if (pendingDeletedAttachmentIds.length > 0) {
        for (const attId of pendingDeletedAttachmentIds) {
          await api.delete(`/v1/documents/${attId}`, {
            params: { skipHistory: !wasApproved },
          }).catch(() => {});
        }
      }

      if (uploadFileList.length > 0) {
        await uploadFilesAfterSave(editingRecord.id, uploadFileList, !wasApproved);
      }

      closeCreateDrawer();
      setSortField('updatedAt');
      setSortOrder('descend');
      setPage(1);
      void fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  }, [editingRecord, createCoords, uploadFileList, pendingDeletedAttachmentIds, uploadFilesAfterSave, closeCreateDrawer, fetchData]);

  // ── History Drawer ──────────────────────────────────────────────

  const openHistoryDrawer = useCallback(async (record: Buoy) => {
    setHistoryDrawerOpen(true);
    setHistoryRecord(record);
    setHistoryLoading(true);
    setHistorySearchInput('');
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

  const stationMap = useMemo(() => {
    const map = new Map<string, string>();
    buoyStations.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [buoyStations]);

  const translateBuoyVal = useCallback((fn: string, val: string | null | undefined) => {
    if (!val || val === 'null' || val === '(null)') return '';
    if (fn === 'isActive') return val === 'true' ? 'Có' : 'Ngừng';
    if (fn === 'type') return BUOY_TYPE_OPTIONS.find((o) => o.value === val)?.label || val;
    if (fn === 'color') return COLOR_LABEL_MAP[val] || val;
    if (fn === 'shape') return SHAPE_LABEL_MAP[val] || val;
    if (fn === 'lightCharacteristic') return LIGHT_CHAR_LABEL_MAP[val] || val;
    if (fn === 'unitId') return orgMap.get(val) || val;
    if (fn === 'buoyStationId') return stationMap.get(val) || val;
    if (fn === 'status') return buoyStatusBadge(val).label;
    if (fn === 'approvalStatus') return approvalStatusLabel(val);
    if (fn === 'geometryType') return GEOMETRY_TYPE_LABELS[val] || val;
    if (fn === 'provinceId') return VIETNAM_PROVINCE_OPTIONS.find((o) => o.value === val)?.label || val;
    if (fn === 'coordinateSystem') return COORD_SYS_LABELS[val] || val;
    if (fn === 'lastInspectionDate' || fn === 'nextInspectionDate') return formatDateOnly(val);
    return val;
  }, [orgMap, stationMap]);

  const actorName = useCallback((actor: string | undefined) => {
    if (!actor) return '';
    return formatUserDisplayName(actor, null, userMap);
  }, [userMap]);

  // ── Timeline (design §5.3 — history*Style tokens, BuoyList grouping) ─

  const renderBuoyHistoryTimeline = (records: ChangeHistory[]) => {
    const safeRecords = Array.isArray(records) ? records : [];
    const q = historySearch.toLowerCase().trim();
    const filtered = safeRecords.filter((r) => {
      if (historyEntityFilter && r.refId !== historyEntityFilter) return false;
      if (historyFrom || historyTo) {
        const cd = (r.approvedDate || '').substring(0, 16);
        if (historyFrom && cd < historyFrom.replace(' ', 'T')) return false;
        if (historyTo && cd > historyTo.replace(' ', 'T') + ':59') return false;
      }
      if (q) {
        const fn = (r.changedField || '').toLowerCase();
        const ov = String(r.previousValue || '').toLowerCase();
        const nv = String(r.newValue || '').toLowerCase();
        const label = historyFieldLabel(r.changedField || '').toLowerCase();
        const tv = translateBuoyVal(r.changedField || '', String(r.newValue || '')).toLowerCase();
        if (!fn.includes(q) && !ov.includes(q) && !nv.includes(q) && !label.includes(q) && !tv.includes(q)) return false;
      }
      return true;
    });

    return renderStandardHistoryCards({
      records: filtered,
      fieldLabels: (fn) => historyFieldLabel(fn),
      groupOrder: HISTORY_FIELD_ORDER,
      formatValue: (fn, raw) => {
        if ((fn === 'mapSymbolId' || fn === 'Biểu tượng bản đồ' || fn === 'icon' || fn === 'Biểu tượng') && raw && !isBlankOrDash(raw)) {
          const img = symbolImageMap.get(raw);
          const name = symbolMap.get(raw) || raw;
          return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {img ? <img src={img} alt="" style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 4 }} /> : null}
              {name}
            </span>
          );
        }
        const resolved = translateBuoyVal(fn, raw ?? '');
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
      resolveActorName: (actor) => actorName(actor),
      emptyMessage: historySearch || historyFrom || historyTo ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận',
    });
  };

  // ── Delete confirmation ─────────────────────────────────────────

  const openDeleteModal = useCallback((record: Buoy) => {
    setDeletingRecord(record);
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingRecord) return;
    setDeleteLoading(true);
    try {
      await deleteBuoy(deletingRecord.id);
      toast.success('Đã xóa phao tiêu');
      setDeleteModalOpen(false);
      setDeletingRecord(null);
      setSortField('updatedAt');
      setSortOrder('descend');
      setPage(1);
      void fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingRecord, fetchData]);

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
      setSortField('updatedAt');
      setSortOrder('descend');
      setPage(1);
      void fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gửi phê duyệt thất bại');
    }
  }, [submittingRecord, fetchData]);

  const openApproveModal = useCallback((record: Buoy, level: 'L1' | 'L2') => {
    setApprovingRecord(record);
    setApprovingLevel(level);
    setApproveModalOpen(true);
  }, []);

  const handleConfirmApprove = useCallback(async (record: Buoy, level: 'L1' | 'L2', content?: string) => {
    const approverId = currentUser?.userId;
    if (!approverId) { toast.error('Không xác định được người dùng'); return; }
    try {
      const approveContent = content?.trim() || undefined;
      if (level === 'L1') {
        await approveBuoyL1(record.id, approverId, approveContent);
        toast.success('Đã phê duyệt cấp 1');
      } else {
        await approveBuoyL2(record.id, approverId, approveContent);
        toast.success('Đã phê duyệt cấp 2 - Phao tiêu được công bố');
      }
      setApproveModalOpen(false);
      setApprovingRecord(null);
      setSortField('updatedAt');
      setSortOrder('descend');
      setPage(1);
      void fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
    }
  }, [currentUser, fetchData]);

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
      setSortField('updatedAt');
      setSortOrder('descend');
      setPage(1);
      void fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
    }
  }, [rejectingRecord, rejectReason, currentUser, fetchData]);

  // ── Header actions ──────────────────────────────────────────────

  const headerActions = useMemo(() => {
    const actions: any[] = [];
    if (hasPerm('buoy:create') || hasPerm('buoy:manage') || hasPerm('data:create')) {
      actions.push({
        key: 'create',
        label: 'Thêm mới',
        variant: 'primary' as const,
        icon: icons.create,
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
      key: 'name',
      label: 'Tên/Mã phao tiêu',
      dataIndex: 'name',
      width: 220,
      fixed: 'left' as const,
      sortable: true,
      ellipsis: false,
      render: (name: string, record: Buoy) => (
        <div>
          <a
            title={name}
            onClick={() => openDetailDrawer(record)}
            style={{ ...cellTitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {name}
          </a>
          <span style={{ ...cellSubtitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {record.code || ''}
          </span>
        </div>
      ),
    },
    {
      key: 'unitId',
      label: 'Đơn vị quản lý',
      dataIndex: 'unitId',
      width: 260,
      sortable: true,
      render: (v: string) => {
        const level2 = v ? orgLevel2Map.get(v) : undefined;
        return <span style={{ fontWeight: fontWeightBold }}>{level2 || v || ''}</span>;
      },
    },
    {
      key: 'buoyStationId',
      label: 'Thuộc nhà trạm quản lý vận hành phao, tiêu',
      dataIndex: 'buoyStationName',
      width: 460,
      ellipsis: false,
      sortable: true,
      render: (v: string, rec: Buoy) => (v || (rec?.buoyStationId ? (buoyStations.find((s) => s.id === rec.buoyStationId)?.name || '') : '')),
    },
    {
      key: 'provinceId',
      label: 'Địa điểm (Tỉnh/Thành phố)',
      dataIndex: 'provinceId',
      width: 250,
      ellipsis: false,
      sortable: true,
      render: (v: number) => (v != null ? (VIETNAM_PROVINCE_OPTIONS.find((o) => o.value === String(v))?.label || String(v)) : ''),
    },
    {
      key: 'condition',
      label: 'Tình trạng',
      dataIndex: 'condition',
      width: 250,
      ellipsis: false,
      sortable: true,
      render: (v: string) => {
        if (!v) return '';
        const s = CONDITION_STYLE[v] || { color: textTertiary, label: v };
        return <span style={statusBadgeStyle(s.color)}>{s.label}</span>;
      },
    },
    {
      key: 'status',
      label: 'Trạng thái',
      dataIndex: 'status',
      width: 260,
      sortable: true,
      render: (status: string) => { const b = buoyStatusBadge(status); return <span style={statusBadgeStyle(b.color)}>{b.label}</span>; },
    },
    {
      key: 'updatedAt',
      label: 'Cán bộ cập nhật',
      dataIndex: 'updatedAt',
      width: 200,
      sortable: true,
      ellipsis: false,
      render: (v: string | null, record: Buoy) => {
        const name = formatUserDisplayName(record.updatedBy != null ? String(record.updatedBy) : undefined, (record as any).updatedByName, userMap, (record as any).createdBy, (record as any).createdByName);
        const cleanName = (name === '—' || name === '-') ? '' : name;
        const date = formatDateTime(v);
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
      key: 'submittedForApprovalAt',
      label: 'Cán bộ gửi phê duyệt',
      dataIndex: 'submittedForApprovalAt',
      width: 210,
      sortable: true,
      ellipsis: false,
      render: (v: string | null, record: Buoy) => {
        const name = formatUserDisplayName(record.submittedForApprovalBy, (record as any).submittedForApprovalByName, userMap);
        const cleanName = (name === '—' || name === '-') ? '' : name;
        const date = formatDateTime(v);
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
      key: 'level1ApprovedDate',
      label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục',
      dataIndex: 'level1ApprovedDate',
      width: 340,
      sortable: true,
      ellipsis: true,
      render: (v: string | null, record: Buoy) => {
        const name = formatUserDisplayName(record.level1ApprovedBy != null ? String(record.level1ApprovedBy) : undefined, (record as any).level1ApprovedByName, userMap);
        const cleanName = (name === '—' || name === '-') ? '' : name;
        const date = formatDateTime(v);
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
      key: 'level2ApprovedDate',
      label: 'Cán bộ phê duyệt cấp Cục',
      dataIndex: 'level2ApprovedDate',
      width: 240,
      sortable: true,
      ellipsis: true,
      render: (v: string | null, record: Buoy) => {
        const name = formatUserDisplayName(record.level2ApprovedBy != null ? String(record.level2ApprovedBy) : undefined, (record as any).level2ApprovedByName, userMap);
        const cleanName = (name === '—' || name === '-') ? '' : name;
        const date = formatDateTime(v);
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
  })), [page, pageSize, orgLevel2Map, userMap, buoyStations, openDetailDrawer, sortField, sortOrder]);

  // ── Row actions with RBAC (moved from BuoyList.tsx) ─────────────
  // Thứ tự: Xem chi tiết → Chỉnh sửa → Xem vị trí → Lịch sử → Phê duyệt/Từ chối → Xóa

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
      label: 'Xem chi tiết',
      icon: icons.view,
      onClick: () => openDetailDrawer(record),
    });

    // Quy tắc 12 (approval-2-level-spec.md mục 3.9)
    if (canEditApprovalRecord(record.status, { hasPerm, resource: 'buoy', extraUpdatePerms: ['buoy:manage', 'data:update'], extraApprovePerms: ['buoy:manage'] })) {
      actions.push({
        key: 'edit',
        label: 'Chỉnh sửa',
        icon: icons.edit,
        onClick: () => openEditDrawer(record),
      });
    }

    if (record.latitude != null && record.longitude != null) {
      actions.push({
        key: 'location',
        label: 'Xem vị trí',
        icon: icons.location,
        onClick: () => {
          window.open(`https://www.google.com/maps?q=${record.latitude},${record.longitude}`, '_blank');
        },
      });
    }

    // Lịch sử — luôn hiển thị khi có quyền
    actions.push({
      key: 'history',
      label: 'Lịch sử',
      icon: icons.history,
      onClick: () => openHistoryDrawer(record),
    });

    // Phê duyệt / Từ chối — theo trạng thái
    if ((hasPerm('buoy:update') || hasPerm('buoy:manage') || hasPerm('data:update') || hasPerm('data:read') || hasPerm('admin:manage')) && (record.status === 'DRAFT' || record.status === 'NHAP')) {
      actions.push({
        key: 'submit',
        label: 'Gửi Cảng vụ phê duyệt',
        icon: icons.submit,
        onClick: () => openSubmitModal(record),
      });
    }
    if ((hasPerm('buoy:update') || hasPerm('buoy:manage') || hasPerm('data:update') || hasPerm('data:read') || hasPerm('admin:manage')) && (record.status === 'REJECTED' || record.status === 'REJECTED_L1' || record.status === 'REJECTED_L2')) {
      actions.push({
        key: 'resubmit',
        label: 'Gửi lại phê duyệt',
        icon: icons.submit,
        onClick: () => openSubmitModal(record),
      });
    }

    const canApprove = hasPerm('buoy:approve') || hasPerm('buoy:approvec1') || hasPerm('buoy:approvec2') || hasPerm('data:approve');
    if (canApprove && record.status === 'PENDING_APPROVAL') {
      actions.push({
        key: 'approveL1',
        label: 'Cảng vụ phê duyệt',
        icon: icons.approve,
        onClick: () => openApproveModal(record, 'L1'),
      });
      actions.push({
        key: 'reject',
        label: 'Từ chối',
        icon: icons.reject,
        onClick: () => openRejectModal(record),
        danger: true,
      });
    }

    if (canApprove && record.status === 'APPROVED_L1') {
      actions.push({
        key: 'approveL2',
        label: 'Cục phê duyệt',
        icon: icons.approve,
        onClick: () => openApproveModal(record, 'L2'),
      });
      actions.push({
        key: 'reject',
        label: 'Từ chối',
        icon: icons.reject,
        onClick: () => openRejectModal(record),
        danger: true,
      });
    }

    // Xóa: chỉ trạng thái DRAFT/NHAP — luôn ở cuối cùng
    const deletableStatuses = ['DRAFT', 'NHAP'];
    if ((hasPerm('buoy:delete') || hasPerm('buoy:manage') || hasPerm('data:delete')) && deletableStatuses.includes(record.status || '')) {
      actions.push({
        key: 'delete',
        label: 'Xóa',
        icon: icons.delete,
        onClick: () => openDeleteModal(record),
        danger: true,
      });
    }

    return actions;
  }, [
    hasPerm, openDetailDrawer, openEditDrawer, openSubmitModal,
    openApproveModal, openRejectModal, openDeleteModal, openHistoryDrawer,
  ]);

  // ── JSX ─────────────────────────────────────────────────────────

  return (
    <ThemeTokenProvider tokens={themeTokenChk}>
    <div className="buoy-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <style>{`
        .range-single-panel .ant-picker-panel-container .ant-picker-panel:last-child { display: none !important; }

        /* ── Cỡ chữ 13.5px chuẩn toàn màn Quản lý Phao, tiêu & các popup/drawer con ── */
        .buoy-page-wrapper,
        .buoy-page-wrapper .ant-table,
        .buoy-page-wrapper .ant-table-cell,
        .buoy-page-wrapper .ant-table-thead > tr > th,
        .buoy-page-wrapper .ant-table-tbody > tr > td,
        .buoy-page-wrapper .ant-input,
        .buoy-page-wrapper .ant-select,
        .buoy-page-wrapper .ant-select-selection-item,
        .buoy-page-wrapper .ant-select-item-option-content,
        .buoy-page-wrapper .ant-picker,
        .buoy-page-wrapper .ant-picker-input > input,
        .buoy-page-wrapper .ant-btn,
        .buoy-page-wrapper .ant-pagination,
        .buoy-page-wrapper .ant-pagination-item,
        .buoy-page-wrapper .ant-pagination-total-text,
        .buoy-page-wrapper .ant-breadcrumb,
        .buoy-page-wrapper .ant-form-item-label > label,
        .buoy-drawer-scope,
        .buoy-drawer-scope .ant-drawer-content,
        .buoy-drawer-scope .ant-tabs-tab,
        .buoy-drawer-scope .chk-detail-label,
        .buoy-drawer-scope .chk-detail-value,
        .buoy-drawer-scope .ant-table,
        .buoy-drawer-scope .ant-table-cell,
        .buoy-drawer-scope .ant-table-thead > tr > th,
        .buoy-drawer-scope .ant-btn,
        .buoy-drawer-scope .ant-select,
        .buoy-drawer-scope .ant-input,
        .buoy-drawer-scope .ant-form-item-label > label,
        .buoy-modal-scope,
        .buoy-modal-scope .ant-modal-content,
        .buoy-modal-scope .ant-btn,
        .buoy-modal-scope .ant-input {
          font-size: 13.5px !important;
        }

        /* ── Responsive StatusTabs: Căn giữa khi đủ chỗ, thanh cuộn ngang khi tràn màn hình ── */
        .buoy-page-wrapper div:has(> button[aria-pressed]) {
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
        .buoy-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar {
          height: 6px !important;
          display: block !important;
        }
        .buoy-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-track {
          background: #f1f5f9 !important;
          border-radius: 999px !important;
        }
        .buoy-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb {
          background: #cbd5e1 !important;
          border-radius: 999px !important;
        }
        .buoy-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb:hover {
          background: #94a3b8 !important;
        }
        .buoy-page-wrapper div:has(> button[aria-pressed]) > button {
          flex-shrink: 0 !important;
        }
      `}</style>
      <ScreenHeader
        breadcrumb={[{ label: 'Báo hiệu hàng hải' }, { label: 'Quản lý Phao, tiêu' }]}
        actions={headerActions}
      />

      <FilterTableLayout
        hideFilterToggle={true}
        onFilterApply={handleFilterApply}
        onFilterReset={handleFilterReset}
        loading={isLoading}
        error={isError}
        onRetry={fetchData}
        filterContent={<>
          {/* ── Bộ lọc (hiển thị trực tiếp) ──────────────────────── */}
          <div style={{ marginBottom: 12, marginTop: spaceMd }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
              Đơn vị quản lý
            </div>
            <FilterOrgUnitTreeSelect
              organizations={organizations}
              placeholder="Tất cả"
              allowClear
              value={managingUnitId || undefined}
              onChange={(v) => { setManagingUnitId(v); setPage(1); }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tên Phao, tiêu</div>
            <Input placeholder="Tìm theo tên phao tiêu..." allowClear
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              onPressEnter={handleFilterApply}
              style={{ borderRadius: radiusPill, height: 40 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Thuộc nhà trạm quản lý vận hành phao, tiêu</div>
            <Select placeholder="Chọn nhà trạm" allowClear showSearch optionFilterProp="label"
              value={filterStationId || undefined}
              onChange={(val) => { setFilterStationId(val); setPage(1); }}
              options={buoyStations.map((s) => ({ label: s.name, value: s.id }))}
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Mã Phao, tiêu</div>
            <Input placeholder="Tìm theo mã phao tiêu..." allowClear
              value={filterCode}
              onChange={(e) => setFilterCode(e.target.value)}
              onPressEnter={handleFilterApply}
              style={{ borderRadius: radiusPill, height: 40 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Địa điểm (Tỉnh/Thành Phố)</div>
            <Select placeholder="Chọn tỉnh/thành phố" allowClear showSearch
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              value={filterProvince || undefined} onChange={(v) => { setFilterProvince(v || ''); setPage(1); }}
              options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))}
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Ngày cập nhật</div>
            <DatePicker.RangePicker className="range-single-panel" popupClassName="range-single-panel" format="DD/MM/YYYY"
              placeholder={['Từ ngày', 'Đến ngày']} allowClear
              value={[filterUpdatedFrom ? dayjs(filterUpdatedFrom) : null, filterUpdatedTo ? dayjs(filterUpdatedTo) : null]}
              onChange={(dates) => { setFilterUpdatedFrom(dates?.[0] ? dates[0].format('YYYY-MM-DD 00:00:00') : undefined); setFilterUpdatedTo(dates?.[1] ? dates[1].format('YYYY-MM-DD 23:59:59') : undefined); setPage(1); }}
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
        <DataTable
          columns={columns}
          dataSource={(() => {
            if (!sortField) return dataSource;
            if (sortField === 'sequenceNo') {
              const arr = [...dataSource];
              return sortOrder === 'descend' ? arr.reverse() : arr;
            }
            return [...dataSource].sort((a: any, b: any) => {
              const resolve = (r: any) => {
                if (sortField === 'unitId') return orgLevel2Map.get(r.unitId) ?? r.unitId ?? '';
                if (sortField === 'buoyStationId') return r.buoyStationName || (r.buoyStationId ? (buoyStations.find((s) => s.id === r.buoyStationId)?.name || '') : '') || '';
                if (sortField === 'provinceId') return (r.provinceId != null ? (VIETNAM_PROVINCE_OPTIONS.find((o) => o.value === String(r.provinceId))?.label || String(r.provinceId)) : '') || '';
                if (sortField === 'condition') return CONDITION_STYLE[r.condition || '']?.label ?? r.condition ?? '';
                if (sortField === 'status') return buoyStatusBadge(r.status).label;
                if (sortField === 'updatedAt' || sortField === 'updatedBy' || sortField === 'updatedByName') {
                  const t = r.updatedAt || r.createdAt;
                  return t ? new Date(t).getTime() : 0;
                }
                if (sortField === 'sentApprovedDate') return r.sentApprovedDate ? new Date(r.sentApprovedDate).getTime() : 0;
                if (sortField === 'level1ApprovedDate') return r.level1ApprovedDate ? new Date(r.level1ApprovedDate).getTime() : 0;
                if (sortField === 'level2ApprovedDate') return r.level2ApprovedDate ? new Date(r.level2ApprovedDate).getTime() : 0;
                return r[sortField] ?? '';
              };
              const aVal = resolve(a);
              const bVal = resolve(b);
              const cmp = typeof aVal === 'number' && typeof bVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal), 'vi');
              return sortOrder === 'ascend' ? cmp : -cmp;
            });
          })()}
          rowKey="id"
          rowActions={rowActions}
          loading={false}
          onSort={handleSortChange}
          scroll={{ x: 'max-content' }}
        />
        <Pagination
          total={total}
          current={page}
          pageSize={pageSize}
          onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
        />
      </FilterTableLayout>

      {/* ── Create / Edit Drawer (Hợp nhất 1 Drawer chuẩn Cầu cảng / VTS CHK) ── */}
      <AppDrawer
        width="min(920px, 96vw)"
        rootClassName="buoy-drawer-scope"
        className="buoy-drawer-scope"
        title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>{editingRecord ? `Chỉnh sửa thông tin phao, tiêu — ${editingRecord.name || ''}` : 'Thêm mới thông tin phao, tiêu'}</span>}
        open={createDrawerOpen}
        onClose={closeCreateDrawer}
        footer={
          <div style={drawerFooterStyle}>
            {(() => {
              const st = !editingRecord ? 'DRAFT' : (editingRecord.status ? String(editingRecord.status).toUpperCase() : 'DRAFT');
              if (st === 'PUBLISHED' || st === 'APPROVED' || st === 'APPROVED_L2') {
                return (
                  <Button
                    type="primary"
                    onClick={() => { actionTypeRef.current = 'approved'; createForm.submit(); }}
                    loading={submitting}
                    disabled={submitting}
                    style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}
                  >
                    Lưu và phê duyệt
                  </Button>
                );
              }
              if (st === 'REJECTED' || st === 'REJECTED_L1' || st === 'REJECTED_L2') {
                return (
                  <Button
                    type="primary"
                    onClick={() => { actionTypeRef.current = 'submit'; createForm.submit(); }}
                    loading={submitting}
                    disabled={submitting}
                    style={primaryButtonStyle}
                  >
                    Lưu và gửi phê duyệt
                  </Button>
                );
              }
              return (
                <>
                  <Button
                    onClick={() => { actionTypeRef.current = 'draft'; createForm.submit(); }}
                    disabled={submitting}
                    style={outlineButtonStyle}
                  >
                    Lưu tạm
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => { actionTypeRef.current = 'submit'; createForm.submit(); }}
                    loading={submitting}
                    disabled={submitting}
                    style={primaryButtonStyle}
                  >
                    Lưu và gửi phê duyệt
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => { actionTypeRef.current = 'approved'; createForm.submit(); }}
                    disabled={submitting}
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
        afterOpenChange={(open) => {
          if (!open) {
            setEditingRecord(null);
          }
        }}
      >
        <style>{requiredMarkStyle}</style>
        <Form
          form={createForm}
          layout="vertical"
          onFinish={(values) => {
            if (editingRecord) {
              return handleEditFinish(values);
            }
            return handleCreateFinish(values);
          }}
          onFinishFailed={(e: any) => {
            const firstErr = e?.errorFields?.[0]?.name?.[0];
            if (['mapSymbolId', 'coordinateSystem', 'displayRule', 'geometryType'].includes(firstErr)) {
              setCreateTabKey('gis');
            } else if (['lightColor', 'flashType', 'period'].includes(firstErr)) {
              setCreateTabKey('light');
            } else {
              setCreateTabKey('general');
            }
            showValidationFeedback(e);
          }}
        >
          <BuoyFormContent
            isEdit={!!editingRecord}
            currentStationId={editingRecord?.buoyStationId ?? null}
            codeLoading={codeLoading}
            activeTabKey={createTabKey}
            onTabChange={setCreateTabKey}
            orgUnits={organizations}
            selectedUnitId={createUnitId}
            buoyStations={createStations.map((s) => ({ id: s.id, name: s.name, code: s.code }))}
            loadingStations={loadingCreateStations}
            onStationChange={handleStationChange}
            uploadFileList={uploadFileList}
            setUploadFileList={setUploadFileList}
            symbols={symbols}
            userMap={userMap}
            geometryType={createGeomType}
            gpsCoordList={createCoords}
            gpsError={gpsError}
            addGpsPoint={addCreateGps}
            removeGpsPoint={removeCreateGps}
            updateGpsPoint={updateCreateGps}
            ddToDms={ddToDms}
            onDeleteAttachment={handleDeleteAttachment}
          />
        </Form>
      </AppDrawer>

      {/* ── Detail Drawer ──────────────────────────────────────────── */}
      <AppDrawer
        width="min(1000px, 96vw)"
        rootClassName="buoy-drawer-scope"
        className="buoy-drawer-scope"
        title={<span style={drawerTitleStyle}>
          {detailRecord ? `Chi tiết thông tin phao, tiêu - ${detailRecord.name}` : 'Chi tiết thông tin phao, tiêu'}
        </span>}
        open={detailDrawerOpen}
        onClose={closeDetailDrawer}
        footer={null}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px' },
        }}
      >
        {detailLoading ? <LoadingSkeleton rows={6} /> : detailRecord ? (
          <BuoyDetailContent
            selectedRecord={detailRecord}
            orgUnits={organizations}
            userMap={userMap}
            detailFiles={detailFiles}
            buoyStatusBadge={buoyStatusBadge}
            symbolMap={symbolMap}
            symbolImageMap={symbolImageMap}
            ddToDms={ddToDms}
          />
        ) : null}
      </AppDrawer>

      {/* ── History Drawer ─────────────────────────────────────────── */}
      <AppDrawer
        width="min(880px, 96vw)"
        rootClassName="buoy-drawer-scope"
        className="buoy-drawer-scope"
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Space size={spaceSm} style={{ alignItems: 'center' }}>
              <span style={{ color: colors.sidebarBg, fontSize: fontSizeLg, display: 'inline-flex', alignItems: 'center' }}>{icons.history}</span>
              <span style={drawerTitleStyle}>
                {historyMode === 'all' ? 'Tất cả lịch sử thay đổi — Phao tiêu' : (historyRecord ? `Lịch sử thay đổi — ${historyRecord.name}` : 'Lịch sử thay đổi')}
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
              onChange={(e) => loadHistoryMode(e.target.value)}>
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
              <Select placeholder="Chọn phao tiêu" allowClear showSearch value={historyEntityFilter || undefined}
                onChange={(v) => setHistoryEntityFilter(v || '')}
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
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {historyLoading ? <LoadingSkeleton rows={5} /> : historyData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
              <span style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd, display: 'inline-block' }}>{icons.history}</span>
              <div style={{ color: textTertiary, fontSize: fontSizeMd }}>Chưa có thay đổi nào được ghi nhận</div>
            </div>
          ) : renderBuoyHistoryTimeline(historyData)}
        </div>
      </AppDrawer>

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
        rootClassName="buoy-modal-scope"
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

      {/* ── Approve Modal (chuẩn VTS CHK) ─────────────────────────── */}
      <ApprovalModal
        visible={approveModalOpen}
        level={approvingLevel === 'L2' ? 'c2' : 'c1'}
        onConfirm={(content) => { if (approvingRecord) void handleConfirmApprove(approvingRecord, approvingLevel, content); }}
        onCancel={() => { setApproveModalOpen(false); setApprovingRecord(null); }}
      />

      {/* ── Reject Modal ───────────────────────────────────────────── */}
      <Modal
        rootClassName="buoy-modal-scope"
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
      <DeleteConfirmModal
        open={deleteModalOpen}
        onCancel={() => {
          if (!deleteLoading) {
            setDeleteModalOpen(false);
            setDeletingRecord(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        itemType="phao tiêu"
        itemName={deletingRecord?.name}
        itemCode={deletingRecord?.code}
      />
    </div>
    </ThemeTokenProvider>
  );
}

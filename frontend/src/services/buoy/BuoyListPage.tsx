// ── BuoyListPage — list screen + all Drawers/Modals (T6, design §4.2) ─
// Port-shaped orchestrator: fetch + filters + tabs + client-side pagination (D-3)
// + 4 Drawers (create/edit/detail/history) + reject/delete/approve Modals
// + DocumentUploadModal. Handlers moved from the old routed BuoyList screen.

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
  Typography,
  Radio,
} from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
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
  BUOY_TYPE_OPTIONS,
  COLOR_LABEL_MAP, SHAPE_LABEL_MAP, LIGHT_CHAR_LABEL_MAP, BUOY_FIELD_MAP,
  CONDITION_OPTIONS, buoyStatusBadge, TAB_STATUS_LIST,
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
  statusOperational, statusCritical, actionPrimary, statusAttention,
  textPrimary, textSecondary, textTertiary, borderDefault,
  fontSizeMd, fontSizeLg, fontWeightMedium, fontWeightBold,
  spaceMd, spaceSm, spaceXs, spaceXl, spaceFormField, radiusPill,
  drawerTitleStyle, drawerFooterStyle,
  primaryButtonStyle, outlineButtonStyle, requiredMarkStyle,
  historyGroupGridStyle, historyTimeStyle, historyMetaRowStyle,
  historyInfoCardStyle, historyAccentBarStyle, historyInfoTitleStyle,
  historyChangeRowStyle, historyCreateRowStyle, historyFieldLabelStyle,
  historyOldValueStyle, historyNewValueStyle, historyArrowStyle,
  statusBadgeStyle, cellTitleStyle, cellSubtitleStyle, icons,
  fontSizeSm,
} from '../../themetokenchk';
import { colors } from '../../themetokenchk';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import { OrgUnitTreeSelect, resolveOrgLevel2Name } from '../../components/org-unit';
import { canEditApprovalRecord } from '../../utils/approvalEditPolicy';
import { approvalStatusLabel } from '../../components/shared/ApprovalStatusBadge';
import ApprovalModal from '../../components/shared/ApprovalModal';
import { AppDrawer } from '../../components/shared/AppDrawer';

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
  if (!dateStr) return '—';
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

/** Badge thao tác cho lịch sử (chuẩn VTS CHK) — phân biệt Thêm mới / Cập nhật / Phê duyệt / Từ chối / Trình duyệt. */
function resolveBuoyHistoryActionMeta(group: { items: ChangeHistory[] }): { label: string; color: string; bg: string } {
  const items = group.items || [];
  if (items.every((i) => i.oldValue == null || i.oldValue === '(null)' || i.oldValue === 'null' || i.oldValue === '')) {
    return { label: 'Thêm mới', color: statusOperational, bg: `${statusOperational}18` };
  }
  const approvalChange = items.find((i) => {
    const k = normalizeHistoryKey(i.fieldName || '');
    return k === 'approvalstatus' || k === 'status';
  });
  if (approvalChange) {
    const nv = normalizeHistoryKey(String(approvalChange.newValue ?? ''));
    if (nv.includes('published') || nv.includes('approved_l2') || nv.includes('da duyet')) {
      return { label: 'Phê duyệt cấp Cục', color: statusOperational, bg: `${statusOperational}18` };
    }
    if (nv.includes('approved_l1') || nv.includes('cho cuc duyet') || nv.includes('cap 1')) {
      return { label: 'Phê duyệt cấp Cảng vụ', color: '#13C2C2', bg: '#13C2C218' };
    }
    if (nv.includes('rejected_l2') || nv.includes('tu choi cap cuc')) {
      return { label: 'Từ chối cấp Cục', color: statusCritical, bg: `${statusCritical}18` };
    }
    if (nv.includes('rejected') || nv.includes('tu choi') || nv.includes('tra ve')) {
      return { label: 'Từ chối cấp Cảng vụ', color: statusCritical, bg: `${statusCritical}18` };
    }
    if (nv.includes('pending') || nv.includes('proposed') || nv.includes('cho phe duyet') || nv.includes('luu tam') || nv.includes('draft')) {
      return { label: 'Trình duyệt', color: statusAttention, bg: `${statusAttention}18` };
    }
  }
  return { label: 'Cập nhật', color: actionPrimary, bg: `${actionPrimary}18` };
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
  const [filterName, setFilterName] = useState('');
  const [filterCode, setFilterCode] = useState('');

  // Bộ lọc nâng cao (toggle)
  const [filterProvince, setFilterProvince] = useState('');
  const [filterCondition, setFilterCondition] = useState<string | undefined>();
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

  // Tên đơn vị cấp 2 trong chuỗi phân cấp — cột Đơn vị quản lý (chuẩn Cảng biển).
  const orgLevel2Map = useMemo(() => {
    const map = new Map<string, string>();
    organizations.forEach((o) => {
      const name = resolveOrgLevel2Name(organizations, o.id);
      if (name) map.set(o.id, name);
    });
    return map;
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
  // Nhà trạm cho form Thêm mới / Chỉnh sửa — load theo Đơn vị quản lý đã chọn, chỉ nhà trạm Đã phê duyệt (PUBLISHED)
  const [createStations, setCreateStations] = useState<BuoyStationResponse[]>([]);
  const [editStations, setEditStations] = useState<BuoyStationResponse[]>([]);
  const [loadingCreateStations, setLoadingCreateStations] = useState(false);
  const [loadingEditStations, setLoadingEditStations] = useState(false);
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
  const editUnitId = Form.useWatch('unitId', updateForm);

  // Form Thêm mới: đổi Đơn vị quản lý → reset nhà trạm + mã, load nhà trạm thuộc đơn vị (chỉ Đã phê duyệt)
  useEffect(() => {
    let cancelled = false;
    if (createUnitId) {
      createForm.setFieldsValue({ buoyStationId: undefined, code: undefined });
      setLoadingCreateStations(true);
      fetchBuoyStationList({ unitId: createUnitId, status: 'PUBLISHED' })
        .then((res) => { if (!cancelled) setCreateStations(res.content || []); })
        .catch(() => { if (!cancelled) setCreateStations([]); })
        .finally(() => { if (!cancelled) setLoadingCreateStations(false); });
    } else {
      setCreateStations([]);
    }
    return () => { cancelled = true; };
  }, [createUnitId, createForm]);

  // Form Chỉnh sửa: load nhà trạm theo đơn vị của bản ghi (chỉ Đã phê duyệt); giữ nhà trạm hiện tại để hiển thị đúng label khi field bị khóa
  useEffect(() => {
    let cancelled = false;
    if (editUnitId) {
      // Đổi Đơn vị quản lý (phao chưa có nhà trạm) → reset nhà trạm đã chọn (pattern BerthForm)
      if (!editingRecord?.buoyStationId) updateForm.setFieldsValue({ buoyStationId: undefined });
      setLoadingEditStations(true);
      fetchBuoyStationList({ unitId: editUnitId, status: 'PUBLISHED' })
        .then((res) => {
          if (cancelled) return;
          let list = res.content || [];
          const curId = editingRecord?.buoyStationId;
          if (curId && !list.some((s) => s.id === curId)) {
            const cur = buoyStations.find((s) => s.id === curId);
            if (cur) list = [cur, ...list];
          }
          setEditStations(list);
        })
        .catch(() => { if (!cancelled) setEditStations([]); })
        .finally(() => { if (!cancelled) setLoadingEditStations(false); });
    } else {
      setEditStations([]);
    }
    return () => { cancelled = true; };
  }, [editUnitId, editingRecord?.buoyStationId, buoyStations, updateForm]);

  const [uploadFileList, setUploadFileList] = useState<any[]>([]);
  const [symbols, setSymbols] = useState<GisSymbol[]>([]);
  const [createCoords, setCreateCoords] = useState<Array<{ latD: number | null; latM: number | null; latS: number | null; lngD: number | null; lngM: number | null; lngS: number | null }>>([]);
  const [editCoords, setEditCoords] = useState<Array<{ latD: number | null; latM: number | null; latS: number | null; lngD: number | null; lngM: number | null; lngS: number | null }>>([]);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const createGeomType = Form.useWatch('geometryType', createForm);
  const editGeomType = Form.useWatch('geometryType', updateForm);

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

  useEffect(() => {
    if (!editGeomType) {
      updateForm.setFieldsValue({ coordinateSystem: undefined, displayRule: undefined });
      return;
    }
    updateForm.setFieldsValue({ coordinateSystem: 1, displayRule: 'Độ, phút, giây (DMS)' });
    // Đồng bộ với chế độ thêm mới: thiếu bản ghi GPS thì tự thêm bản ghi trống cho đủ số lượng theo loại đối tượng
    const required = GEOMETRY_POINT_COUNT[editGeomType] ?? 1;
    setEditCoords((prev) => {
      if (prev.length >= required) return prev;
      const added = Array.from({ length: required - prev.length }, () => ({ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }));
      return [...prev, ...added];
    });
  }, [editGeomType, updateForm]);

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
  const updateEditGps = useCallback((i: number, field: 'lat' | 'lng', d: number | null, m: number | null, s: number | null) => {
    // Chặn giá trị vượt ngưỡng khi gõ: độ ≤ 90/180, phút ≤ 59, giây ≤ 59.99 (tránh hiển thị mấy trăm)
    const dMax = field === 'lat' ? 90 : 180;
    const dClamped = Math.min(dMax, Math.max(0, d ?? 0));
    const mClamped = Math.min(59, Math.max(0, m ?? 0));
    const sClamped = Math.min(59.99, Math.max(0, s ?? 0));
    setEditCoords((p) => {
      const n = [...p];
      n[i] = { ...n[i], [field === 'lat' ? 'latD' : 'lngD']: dClamped, [field === 'lat' ? 'latM' : 'lngM']: mClamped, [field === 'lat' ? 'latS' : 'lngS']: sClamped };
      return n;
    });
    setGpsError(null);
  }, []);
  const addEditGps = useCallback(() => setEditCoords((p) => [...p, { latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }]), []);
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
        name: filterName || undefined,
        code: filterCode || undefined,
        condition: filterCondition || undefined,
        provinceId: filterProvince ? (Number(VIETNAM_PROVINCE_OPTIONS.find((o) => o.label === filterProvince)?.value) || undefined) : undefined,
        updatedFrom: filterUpdatedFrom,
        updatedTo: filterUpdatedTo,
      });
      // Lọc theo đơn vị quản lý (subtree — đơn vị cha thấy cả đơn vị con, chuẩn Cảng biển)
      const unitSubtree = managingUnitId ? collectOrgSubtreeIds(organizations, managingUnitId) : null;
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
  }, [filterName, filterCode, filterCondition, filterProvince, managingUnitId, organizations, filterStationId, filterUpdatedFrom, filterUpdatedTo, activeTab, page, pageSize]);

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
    setFilterName('');
    setFilterCode('');
    setFilterProvince('');
    setFilterCondition(undefined);
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
          uploadedBy: a.uploadedBy, uploadedAt: a.uploadedAt,
        })));
      } catch { setUploadFileList([]); }
      const loadedCoords = parseGisCoordinateList({ geometryType: data.geometryType, coordinates: data.coordinates });
      setEditCoords(loadedCoords.length > 0 ? loadedCoords.map((c) => {
        const latDms = ddToDms(c.latitude);
        const lngDms = ddToDms(c.longitude);
        return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
      }) : []);
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
        return;
      }
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
    if (values.range == null || Number(values.range) <= 0) {
      toast.error('Phạm vi chiếu sáng phải lớn hơn 0 hải lý'); return;
    }

    const manualCoords = editCoords
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
        return;
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

      if (actionTypeRef.current === 'approved') {
        (payload as any).action = 'approved';
      }
      await updateBuoy(editingRecord.id, payload as any);
      toast.success(actionTypeRef.current === 'approved' ? 'Lưu và phê duyệt thành công' : 'Cập nhật thành công');

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
  }, [editingRecord, editCoords, uploadFileList, uploadFilesAfterSave, closeEditDrawer, fetchData, currentUser]);

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
    if (fn === 'approvalStatus') return approvalStatusLabel(val);
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
    const safeRecords = Array.isArray(records) ? records : [];
    const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000);
    const sorted = [...safeRecords].sort((a: any, b: any) =>
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
        <span style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd, display: 'inline-block' }}>{icons.history}</span>
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
          const actionMeta = resolveBuoyHistoryActionMeta(g);
          const visibleItems = g.items.filter((i) => i.fieldName !== 'spatialId');
          const barColor = actionMeta.color;
          return (
            <div key={`${g.tsSec}-${g.actor}`} style={{ ...historyGroupGridStyle, marginBottom: gi < groups.length - 1 ? spaceSm : 0 }}>
              <div style={{ minWidth: 0, paddingTop: spaceXs }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spaceSm }}>
                  <Typography.Text style={historyTimeStyle}>{g.ts ? fmt(g.ts) : '—'}</Typography.Text>
                  <span style={{ flexShrink: 0 }}>
                    <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeSm + 1, fontWeight: fontWeightMedium, background: actionMeta.bg, color: actionMeta.color, whiteSpace: 'nowrap' }}>{actionMeta.label}</span>
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
            {record.code || '—'}
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
        return <span style={{ fontWeight: fontWeightBold }}>{level2 || v || '—'}</span>;
      },
    },
    {
      key: 'buoyStationId',
      label: 'Thuộc nhà trạm quản lý vận hành phao, tiêu',
      dataIndex: 'buoyStationName',
      width: 460,
      ellipsis: false,
      sortable: true,
      render: (v: string, rec: Buoy) => (v || (rec?.buoyStationId ? (buoyStations.find((s) => s.id === rec.buoyStationId)?.name || '—') : '—')),
    },
    {
      key: 'provinceId',
      label: 'Địa điểm (Tỉnh/Thành phố)',
      dataIndex: 'provinceId',
      width: 250,
      ellipsis: false,
      sortable: true,
      render: (v: number) => (v != null ? (VIETNAM_PROVINCE_OPTIONS.find((o) => o.value === String(v))?.label || String(v)) : '—'),
    },
    {
      key: 'condition',
      label: 'Tình trạng',
      dataIndex: 'condition',
      width: 250,
      ellipsis: false,
      sortable: true,
      render: (v: string) => {
        const s = CONDITION_STYLE[v || ''] || { color: textTertiary, label: v || '—' };
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
      render: (v: string | null, record: Buoy) => (
        <div>
          <span style={{ fontWeight: fontWeightBold }}>{record.updatedBy != null ? (userMap.get(String(record.updatedBy)) || String(record.updatedBy)) : '—'}</span><br />
          <span style={{ opacity: 0.85 }}>{formatDateTime(v)}</span>
        </div>
      ),
    },
    {
      key: 'submittedForApprovalAt',
      label: 'Cán bộ gửi phê duyệt',
      dataIndex: 'submittedForApprovalAt',
      width: 210,
      sortable: true,
      ellipsis: false,
      render: (v: string | null, record: Buoy) => (
        <div>
          <span style={{ fontWeight: fontWeightBold }}>{record.submittedForApprovalBy != null ? (userMap.get(String(record.submittedForApprovalBy)) || String(record.submittedForApprovalBy)) : '—'}</span><br />
          <span style={{ opacity: 0.85 }}>{formatDateTime(v)}</span>
        </div>
      ),
    },
    {
      key: 'level1ApprovedDate',
      label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục',
      dataIndex: 'level1ApprovedDate',
      width: 340,
      sortable: true,
      ellipsis: true,
      render: (v: string | null, record: Buoy) => (
        <div>
          <span style={{ fontWeight: fontWeightBold }}>{record.level1ApprovedBy != null ? (userMap.get(String(record.level1ApprovedBy)) || String(record.level1ApprovedBy)) : '—'}</span><br />
          <span style={{ opacity: 0.85 }}>{formatDateTime(v)}</span>
        </div>
      ),
    },
    {
      key: 'level2ApprovedDate',
      label: 'Cán bộ phê duyệt cấp Cục',
      dataIndex: 'level2ApprovedDate',
      width: 240,
      sortable: true,
      ellipsis: true,
      render: (v: string | null, record: Buoy) => (
        <div>
          <span style={{ fontWeight: fontWeightBold }}>{record.level2ApprovedBy != null ? (userMap.get(String(record.level2ApprovedBy)) || String(record.level2ApprovedBy)) : '—'}</span><br />
          <span style={{ opacity: 0.85 }}>{formatDateTime(v)}</span>
        </div>
      ),
    },
  ].map((col) => ({
    ...col,
    sortOrder: col.sortable && col.key === sortField ? sortOrder : undefined,
  })), [page, pageSize, orgLevel2Map, userMap, buoyStations, openDetailDrawer, sortField, sortOrder]);

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

    const deletableStatuses = ['DRAFT', 'REJECTED', 'REJECTED_L1', 'REJECTED_L2'];
    if ((hasPerm('buoy:delete') || hasPerm('buoy:manage') || hasPerm('data:delete')) && deletableStatuses.includes(record.status || '')) {
      actions.push({
        key: 'delete',
        label: 'Xóa',
        icon: icons.delete,
        onClick: () => openDeleteModal(record),
        danger: true,
      });
    }

    if ((hasPerm('buoy:update') || hasPerm('buoy:manage') || hasPerm('data:update') || hasPerm('data:read') || hasPerm('admin:manage')) && (record.status === 'DRAFT' || record.status === 'REJECTED' || record.status === 'REJECTED_L1' || record.status === 'REJECTED_L2')) {
      actions.push({
        key: 'submit',
        label: 'Gửi Cảng vụ phê duyệt',
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

    actions.push({
      key: 'history',
      label: 'Lịch sử',
      icon: icons.history,
      onClick: () => openHistoryDrawer(record),
    });

    return actions;
  }, [
    hasPerm, openDetailDrawer, openEditDrawer, openSubmitModal,
    openApproveModal, openRejectModal, openDeleteModal, openHistoryDrawer,
  ]);

  // ── JSX ─────────────────────────────────────────────────────────

  return (
    <ThemeTokenProvider tokens={themeTokenChk}>
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
      <style>{`.range-single-panel .ant-picker-panel-container .ant-picker-panel:last-child { display: none !important; }`}</style>
      <ScreenHeader
        breadcrumb={[{ label: 'Báo hiệu hàng hải' }, { label: 'Quản lý Phao, tiêu' }]}
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
              Đơn vị quản lý
            </div>
            <OrgUnitTreeSelect
              organizations={organizations}
              placeholder="Chọn đơn vị..."
              allowClear
              showPath
              allLabel="Tất cả"
              treeDefaultExpandAll={false}
              value={managingUnitId || undefined}
              onChange={(v) => { setManagingUnitId(v === '__all__' ? undefined : v); setPage(1); }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tên Phao, tiêu</div>
            <Input placeholder="Tìm theo tên phao tiêu..." allowClear
              value={filterName}
              onChange={(e) => { setFilterName(e.target.value); setPage(1); }}
              style={{ borderRadius: radiusPill, height: 40 }} />
          </div>

          {/* ── Bộ lọc nâng cao (toggle) ────────────────────────────── */}
          {filterCollapsed && (<>
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
                onChange={(e) => { setFilterCode(e.target.value); setPage(1); }}
                style={{ borderRadius: radiusPill, height: 40 }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Địa điểm (Tỉnh/TP)</div>
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

      {/* ── Create Drawer ──────────────────────────────────────────── */}
      <AppDrawer
        title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>Thêm mới thông tin phao, tiêu</span>}
        open={createDrawerOpen}
        onClose={closeCreateDrawer}
        footer={
          <>

          <Button onClick={() => { actionTypeRef.current = 'draft'; createForm.submit(); }} disabled={submitting} style={outlineButtonStyle}>Lưu tạm</Button>
            <Button type="primary" onClick={() => { actionTypeRef.current = 'submit'; createForm.submit(); }} loading={submitting} disabled={submitting} style={primaryButtonStyle}>Lưu và gửi phê duyệt</Button>
            <Button type="primary" onClick={() => { actionTypeRef.current = 'approved'; createForm.submit(); }} disabled={submitting} style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}>Lưu và phê duyệt</Button>
          </>
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
            showValidationFeedback(e);
          }}
        >
          <BuoyFormContent
            isEdit={false}
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
          />
        </Form>
      </AppDrawer>

      {/* ── Edit Drawer ────────────────────────────────────────────── */}
      <AppDrawer
        title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>Chỉnh sửa thông tin phao, tiêu — {editingRecord ? editingRecord.name : 'Phao, tiêu'}</span>}
        open={editDrawerOpen}
        onClose={closeEditDrawer}
        footer={
          <div style={drawerFooterStyle}>
            <Button type="primary" onClick={() => { actionTypeRef.current = 'approved'; updateForm.submit(); }} loading={submitting} disabled={submitting} style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}>Lưu và phê duyệt</Button>
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
            showValidationFeedback(e);
          }}
        >
          <BuoyFormContent
            isEdit
            currentStationId={editingRecord?.buoyStationId ?? null}
            selectedUnitId={editUnitId}
            activeTabKey={editTabKey}
            onTabChange={setEditTabKey}
            buoyStations={editStations.map((s) => ({ id: s.id, name: s.name, code: s.code }))}
            loadingStations={loadingEditStations}
            orgUnits={organizations}
            uploadFileList={uploadFileList}
            setUploadFileList={setUploadFileList}
            symbols={symbols}
            userMap={userMap}
            geometryType={editGeomType}
            gpsCoordList={editCoords}
            gpsError={gpsError}
            addGpsPoint={addEditGps}
            removeGpsPoint={removeEditGps}
            updateGpsPoint={updateEditGps}
            ddToDms={ddToDms}
          />
        </Form>
      </AppDrawer>

      {/* ── Detail Drawer ──────────────────────────────────────────── */}
      <AppDrawer
        size={1000}
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
        size={880 as any}
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
            <DatePicker placeholder="Từ ngày" classNames={{ popup: { root: 'history-dt-popup' } }} value={historyFrom ? dayjs(historyFrom) : null}
              onChange={(d) => setHistoryFrom(d ? d.format('YYYY-MM-DD HH:mm') : '')}
              style={{ width: 170, borderRadius: radiusPill, height: 40 }} format="DD/MM/YYYY HH:mm" showTime={{ format: 'HH:mm' }} />
            <DatePicker placeholder="Đến ngày" classNames={{ popup: { root: 'history-dt-popup' } }} value={historyTo ? dayjs(historyTo) : null}
              onChange={(d) => setHistoryTo(d ? d.format('YYYY-MM-DD HH:mm') : '')}
              style={{ width: 170, borderRadius: radiusPill, height: 40 }} format="DD/MM/YYYY HH:mm" showTime={{ format: 'HH:mm' }} />
            <Button type="primary" icon={icons.search} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>Tìm kiếm</Button>
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
    </ThemeTokenProvider>
  );
}

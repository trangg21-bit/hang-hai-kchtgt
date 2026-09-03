// ── BuoyStationList — list screen + Drawers/Modals (chuẩn /services/buoy/BuoyListPage) ──
// Danh sách nhà trạm phao tiêu: filter + tabs trạng thái + client-side pagination
// + Drawer create/edit/detail/history + reject/delete/approve Modals.

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
  Radio,
  Typography,
} from 'antd';
import type { UploadFile } from 'antd';
import {
  HistoryOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
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
import { CONDITION_OPTIONS, CLASSIFICATION_OPTIONS, CLASSIFICATION_BUOY_OPTIONS } from '../buoy/schema';
import BuoyStationFormContent from './BuoyStationFormContent';
import type { ExistingFile, BuoyStationFormContentHandle } from './BuoyStationFormContent';
import BuoyStationDetailContent from './BuoyStationDetailContent';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../services/operatingOrganizationsData';
import { ScreenHeader, DataTable } from '../../components/list-view';
import type { DataTableColumn } from '../../components/list-view/DataTable';
import Pagination from '../../components/list-view/Pagination';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import toast from '../../components/ToastNotification';
import { VIETNAM_PROVINCES } from '../../types/common';
import {
  statusOperational,
  statusAttention,
  statusCritical,
  statusDraft,
  actionPrimary,
  textPrimary,
  textSecondary,
  textTertiary,
  borderDefault,
  fontSizeMd,
  fontSizeLg,
  fontSizeSm,
  fontWeightMedium,
  fontWeightBold,
  spaceMd,
  spaceSm,
  spaceXs,
  spaceXl,
  spaceFormField,
  radiusPill,
  drawerTitleStyle,
  primaryButtonStyle,
  outlineButtonStyle,
  requiredMarkStyle,
  historyGroupGridStyle,
  historyTimeStyle,
  historyMetaRowStyle,
  historyInfoCardStyle,
  historyAccentBarStyle,
  historyInfoTitleStyle,
  historyCreateRowStyle,
  historyChangeRowStyle,
  historyFieldLabelStyle,
  historyOldValueStyle,
  historyNewValueStyle,
  historyArrowStyle,
  drawerFooterStyle,
  icons,
  statusBadgeStyle,
  cellTitleStyle,
  cellSubtitleStyle,
  colors,
  getRangePickerProps,
} from '../../themetokenchk';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import { OrgUnitTreeSelect, resolveOrgLevel2Name } from '../../components/org-unit';
import { canEditApprovalRecord } from '../../utils/approvalEditPolicy';
import ApprovalModal from '../../components/shared/ApprovalModal';
import { AppDrawer } from '../../components/shared/AppDrawer';

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

// ── History helpers (chuẩn VTS CHK) ───────────────────────────────
function historyTimestamp(item: any): string {
  return item?.changedAt || item?.createdAt || '';
}

function historyActor(item: any): string {
  const raw = item?.changedBy || item?.performedBy || item?.actorName || '';
  return raw || '—';
}

function historyField(item: any): string {
  return item?.fieldName || item?.changedField || '';
}

function historyOldValue(item: any): string | null {
  return item?.oldValue ?? item?.previousValue ?? null;
}

function historyNewValue(item: any): string | null {
  return item?.newValue ?? null;
}

function normalizeHistoryKey(value: string): string {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');
}

function historyChangeRows(item: any): Array<{ field: string; oldValue: string | null; newValue: string | null }> {
  return [{ field: historyField(item), oldValue: historyOldValue(item), newValue: historyNewValue(item) }];
}

/** Badge thao tác cho lịch sử (chuẩn VTS CHK): phân biệt Thêm mới / Cập nhật / Phê duyệt / Từ chối / Trình duyệt. */
function resolveHistoryActionMeta(group: any, changes: any[]): { label: string; color: string; bg: string } {
  const item = group.items?.[0] || {};
  const rawStatus = String(item.status ?? item.action ?? '').toUpperCase();
  const rawReason = String(item.reason ?? item.ghiChu ?? item.note ?? '').toLowerCase();
  const level = Number(item.approvalLevel || 0);

  if (rawStatus === 'CREATED' || rawStatus === 'CREATE' || rawReason.includes('tạo mới') || rawReason.includes('thêm mới') || rawReason.includes('tao moi') || rawReason.includes('them moi')) {
    return { label: 'Thêm mới', color: statusOperational, bg: `${statusOperational}18` };
  }

  // Tải lên / xóa tệp đính kèm
  if (rawStatus === 'ATTACHMENT_UPLOADED' || rawReason.includes('tải lên') || rawReason.includes('tai len') || item.changedField?.includes('đính kèm')) {
    return { label: 'Tải lên tệp', color: '#0284c7', bg: '#0284c718' };
  }
  if (rawStatus === 'ATTACHMENT_DELETED' || rawReason.includes('xóa tài liệu') || rawReason.includes('xóa tệp') || rawReason.includes('xoa tep')) {
    return { label: 'Xóa tệp', color: '#ea580c', bg: '#ea580c18' };
  }

  // Cập nhật thông tin
  if (rawStatus === 'UPDATED' || rawStatus === 'UPDATE' || rawStatus === 'EDIT' || rawReason.includes('cập nhật') || rawReason.includes('chỉnh sửa')) {
    return { label: 'Cập nhật', color: actionPrimary, bg: `${actionPrimary}18` };
  }

  // Ưu tiên lý do ghi sẵn cho hành động duyệt/từ chối (chuẩn VTS CHK)
  if (rawReason.includes('phê duyệt cấp cảng vụ') || rawReason.includes('phe duyet cap cang vu')) {
    return { label: 'Phê duyệt cấp Cảng vụ', color: '#13C2C2', bg: '#13C2C218' };
  }
  if (rawReason.includes('phê duyệt cấp cục') || rawReason.includes('phe duyet cap cuc')) {
    return { label: 'Phê duyệt cấp Cục', color: statusOperational, bg: `${statusOperational}18` };
  }
  if (rawReason.includes('từ chối cấp cảng vụ') || rawReason.includes('tu choi cap cang vu')) {
    return { label: 'Từ chối cấp Cảng vụ', color: statusCritical, bg: `${statusCritical}18` };
  }
  if (rawReason.includes('từ chối cấp cục') || rawReason.includes('tu choi cap cuc')) {
    return { label: 'Từ chối cấp Cục', color: statusCritical, bg: `${statusCritical}18` };
  }

  const approvalChange = changes.find((c: any) => {
    const k = normalizeHistoryKey(c.field);
    return k === 'approvalstatus' || k === 'trang thai phe duyet';
  });

  if (approvalChange) {
    const nv = normalizeHistoryKey(approvalChange.newValue || '');
    if (nv.includes('cang vu tra ve') || nv.includes('rejected_level1') || (nv.includes('tra ve') && nv.includes('cang vu'))) {
      return { label: 'Từ chối cấp Cảng vụ', color: statusCritical, bg: `${statusCritical}18` };
    }
    if (nv.includes('cuc tra ve') || nv.includes('rejected_level2') || (nv.includes('tra ve') && nv.includes('cuc'))) {
      return { label: 'Từ chối cấp Cục', color: statusCritical, bg: `${statusCritical}18` };
    }
    if (nv === 'cho cuc duyet' || nv.includes('da phe duyet cap 1') || nv.includes('approved_level1') || nv.includes('cuc duyet')) {
      return { label: 'Phê duyệt cấp Cảng vụ', color: '#13C2C2', bg: '#13C2C218' };
    }
    if (nv === 'da duyet' || nv.includes('da phe duyet') || nv.includes('approved')) {
      return { label: 'Phê duyệt cấp Cục', color: statusOperational, bg: `${statusOperational}18` };
    }
    if (nv.includes('tu choi') || nv.includes('rejected') || nv.includes('tra ve')) {
      return { label: 'Từ chối', color: statusCritical, bg: `${statusCritical}18` };
    }
    if (nv.includes('cho cang vu duyet') || nv.includes('cho phe duyet') || nv.includes('pending') || nv.includes('proposed') || nv.includes('luu tam') || nv.includes('nhap')) {
      return { label: 'Trình duyệt', color: statusAttention, bg: `${statusAttention}18` };
    }
  }

  if (level === 1 || String(item.approvalLevel).includes('LEVEL_1') || rawReason.includes('cấp 1') || rawReason.includes('cap 1') || rawStatus === 'UNDER_REVIEW') {
    if (rawStatus === 'REJECTED' || rawStatus === 'REJECT' || rawReason.includes('từ chối') || rawReason.includes('tu choi') || rawReason.includes('trả về') || rawReason.includes('tra ve')) {
      return { label: 'Từ chối cấp Cảng vụ', color: statusCritical, bg: `${statusCritical}18` };
    }
    return { label: 'Phê duyệt cấp Cảng vụ', color: '#13C2C2', bg: '#13C2C218' };
  }
  if (level === 2 || String(item.approvalLevel).includes('LEVEL_2') || rawReason.includes('cấp 2') || rawReason.includes('cap 2') || rawStatus === 'APPROVED' || rawStatus === 'APPROVE') {
    if (rawStatus === 'REJECTED' || rawStatus === 'REJECT' || rawReason.includes('từ chối') || rawReason.includes('tu choi') || rawReason.includes('trả về') || rawReason.includes('tra ve')) {
      return { label: 'Từ chối cấp Cục', color: statusCritical, bg: `${statusCritical}18` };
    }
    return { label: 'Phê duyệt cấp Cục', color: statusOperational, bg: `${statusOperational}18` };
  }
  if (rawStatus === 'REJECTED' || rawStatus === 'REJECT' || rawReason.includes('từ chối') || rawReason.includes('tu choi')) {
    return { label: 'Từ chối', color: statusCritical, bg: `${statusCritical}18` };
  }
  if (rawStatus === 'SUBMITTED' || rawStatus === 'PENDING' || rawReason.includes('trình duyệt') || rawReason.includes('trinh duyet')) {
    return { label: 'Trình duyệt', color: statusAttention, bg: `${statusAttention}18` };
  }
  if (rawStatus === 'DELETED' || rawStatus === 'DELETE' || rawStatus === 'SOFT_DELETE' || rawReason.includes('xóa') || rawReason.includes('xoa')) {
    return { label: 'Xóa', color: '#64748b', bg: '#64748b18' };
  }

  return { label: 'Cập nhật', color: actionPrimary, bg: `${actionPrimary}18` };
}

function renderHistoryValueTag(field: string, val: string | null) {
  if (val === null || val === undefined || val === '—') {
    return <span style={{ color: textTertiary }}>—</span>;
  }
  const normKey = normalizeHistoryKey(field);
  const normVal = normalizeHistoryKey(val);

  if (normKey === 'approvalstatus' || normKey === 'trang thai phe duyet' || normKey.includes('phe duyet') || normKey.includes('trang thai')) {
    if (normVal === 'da duyet' || normVal === 'da phe duyet' || normVal === 'approved' || normVal === 'approved_level2') {
      return (<span style={statusBadgeStyle(statusOperational)}>{val}</span>);
    }
    if (normVal === 'cho cuc duyet' || normVal === 'approved_level1' || normVal.includes('cap 1') || normVal.includes('cuc duyet')) {
      return (<span style={statusBadgeStyle('#0082fb')}>{val}</span>);
    }
    if (normVal === 'cho cang vu duyet' || normVal === 'cho phe duyet' || normVal === 'cho duyet' || normVal === 'pending' || normVal === 'pending_approval' || normVal === 'proposed' || normVal.includes('cang vu')) {
      return (<span style={statusBadgeStyle(statusAttention)}>{val}</span>);
    }
    if (normVal === 'tu choi' || normVal.includes('rejected') || normVal.includes('tra ve')) {
      return (<span style={statusBadgeStyle(statusCritical)}>{val}</span>);
    }
    return (<span style={statusBadgeStyle(statusDraft)}>{val}</span>);
  }

  if (normKey === 'conditionstatus' || normKey === 'tinh trang' || normKey.includes('tinh trang')) {
    if (normVal.includes('hoat dong tot') || normVal.includes('good') || normVal.includes('operational') || normVal.includes('hoat dong')) {
      return (<span style={statusBadgeStyle(statusOperational)}>{val}</span>);
    }
    if (normVal.includes('can bao duong') || normVal.includes('warning') || normVal.includes('maintenance') || normVal.includes('bao tri')) {
      return (<span style={statusBadgeStyle(statusAttention)}>{val}</span>);
    }
    if (normVal.includes('hong') || normVal.includes('ngung') || normVal.includes('dung') || normVal.includes('damaged') || normVal.includes('critical')) {
      return (<span style={statusBadgeStyle(statusCritical)}>{val}</span>);
    }
    if (normVal.includes('xay dung') || normVal.includes('under_construction')) {
      return (<span style={statusBadgeStyle(actionPrimary)}>{val}</span>);
    }
  }

  return <span title={val} style={{ minWidth: 0, color: textPrimary, fontWeight: fontWeightMedium, overflowWrap: 'anywhere' }}>{val}</span>;
}

export default function BuoyStationListPage() {
  const hasPerm = usePermissionStore((s: any) => s.hasPermission);
  const currentUser = useAuthStore((s) => s.user);

  // ── Filters ───────────────────────────────────────────────────────
  const [managingUnitId, setManagingUnitId] = useState<string | undefined>();
  const defaultOrgUnitId = useRef<string | undefined>(undefined);
  const defaultOrgApplied = useRef(false);
  const [orgUnitReady, setOrgUnitReady] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [filterProvince, setFilterProvince] = useState<string | undefined>();
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
  const [historySearchInput, setHistorySearchInput] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');
  const [historyMode, setHistoryMode] = useState<'current' | 'all'>('current');
  const [historyEntityNames, setHistoryEntityNames] = useState<Record<string, string>>({});
  const [historyEntityFilter, setHistoryEntityFilter] = useState('');
  const HISTORY_PAGE_SIZE = 10;
  const [historyPage, setHistoryPage] = useState(0);
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);

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
  }, [filterName, filterCode, managingUnitId, organizations, filterProvince, filterPortId, filterWaterwayId, filterCondition, filterClassification, filterClassificationBuoy, filterClassificationMark, filterUpdatedFrom, filterUpdatedTo, activeTab, stationBuoys]);

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
        aVal = DEFAULT_OPERATING_ORGANIZATIONS.find(o => o.id === a.operatingOrgId)?.name ?? a.operatingOrgId ?? '';
        bVal = DEFAULT_OPERATING_ORGANIZATIONS.find(o => o.id === b.operatingOrgId)?.name ?? b.operatingOrgId ?? '';
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
    setFilterPortId(undefined);
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
      setHistoryPage(0);
      setLoadingMoreHistory(false);
    } catch { setHistoryData([]); }
    finally { setHistoryLoading(false); }
  }, [historyRecord]);

  const openHistoryDrawer = useCallback(async (r: BuoyStationResponse) => {
    setHistoryDrawerOpen(true);
    setHistoryRecord(r);
    setHistorySearchInput(''); setHistorySearch(''); setHistoryFrom(''); setHistoryTo(''); setHistoryEntityFilter('');
    setHistoryPage(0); setLoadingMoreHistory(false);
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
      const m: Record<string, string> = { DRAFT: 'Lưu tạm', PROPOSED: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', PENDING_APPROVAL: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', APPROVED_LEVEL1: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', APPROVED: 'Đã phê duyệt', REJECTED: 'Từ chối cấp Cảng vụ/Chi cục', REJECTED_LEVEL1: 'Từ chối cấp Cảng vụ/Chi cục', REJECTED_LEVEL2: 'Từ chối cấp cục' };
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

  // ── Lịch sử: lọc client-side + cuộn vô hạn 10/trang (giữ NGUYÊN API fetchBuoyStationHistory — chỉ đổi render) ──
  const filteredHistory = useMemo(() => {
    const q = historySearch.toLowerCase().trim();
    return (Array.isArray(historyData) ? historyData : []).filter((r) => {
      if (q) {
        const fn = (r.fieldName || '').toLowerCase();
        const ov = (r.oldValue || '').toLowerCase();
        const nv = (r.newValue || '').toLowerCase();
        const label = stationFieldLabel(r.fieldName || '').toLowerCase();
        const tv = translateStationVal(r.fieldName || '', r.newValue || '').toLowerCase();
        if (!fn.includes(q) && !ov.includes(q) && !nv.includes(q) && !label.includes(q) && !tv.includes(q)) return false;
      }
      if (historyMode === 'all' && historyEntityFilter && r.entityId !== historyEntityFilter) return false;
      if (historyFrom || historyTo) {
        const cd = (r.changedAt || r.createdAt || '').substring(0, 16);
        if (historyFrom && cd < historyFrom.replace(' ', 'T')) return false;
        if (historyTo && cd > historyTo.replace(' ', 'T') + ':59') return false;
      }
      return true;
    });
  }, [historyData, historySearch, historyFrom, historyTo, historyMode, historyEntityFilter, translateStationVal]);

  const visibleHistory = filteredHistory.slice(0, (historyPage + 1) * HISTORY_PAGE_SIZE);
  const canLoadMoreHistory = visibleHistory.length < filteredHistory.length;

  const loadMoreHistory = () => {    if (loadingMoreHistory || !canLoadMoreHistory) return;
    setLoadingMoreHistory(true);
    window.setTimeout(() => { setHistoryPage((p) => p + 1); setLoadingMoreHistory(false); }, 150);
  };

  const handleHistoryScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) loadMoreHistory();
  };

  const renderHistoryTimeline = (records: ChangeHistory[]) => {
    const safeRecords = Array.isArray(records) ? records : [];
    const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000);
    const sorted = [...safeRecords].sort((a: any, b: any) =>
      new Date(historyTimestamp(b) || 0).getTime() - new Date(historyTimestamp(a) || 0).getTime());
    const q = historySearch.toLowerCase().trim();
    const groups: { tsSec: number; ts: string; actor: string; status?: any; approvalLevel?: any; items: any[] }[] = [];
    for (const r of sorted) {
      const ts = historyTimestamp(r);
      const sec = ts ? toSec(ts) : 0;
      const actor = historyActor(r);
      const prev = groups[groups.length - 1];
      if (prev && prev.tsSec === sec && prev.actor === actor && prev.status === (r as any).status && prev.approvalLevel === (r as any).approvalLevel) {
        prev.items.push(r);
      } else {
        groups.push({ tsSec: sec, ts, actor, status: (r as any).status, approvalLevel: (r as any).approvalLevel, items: [r] });
      }
    }
    if (groups.length === 0) return (
      <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
        <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
        <div style={{ color: textTertiary, fontSize: fontSizeMd }}>
          {q || historyFrom || historyTo ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận'}
        </div>
      </div>
    );
    const fmtTime = (ts: string) => {
      const d = new Date(ts);
      return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    };
    return (
      <div>
        {groups.map((g, gi) => {
          const changes = g.items.flatMap((item: any) => historyChangeRows(item)).sort((a: any, b: any) => {
            const ia = HISTORY_FIELD_ORDER.indexOf(a.field);
            const ib = HISTORY_FIELD_ORDER.indexOf(b.field);
            return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
          }).filter((c: any) => c.field !== 'spatialId');
          const isCreate = changes.every((c: any) => c.oldValue === null || c.oldValue === '(null)' || c.oldValue === '');
          const actionMeta = resolveHistoryActionMeta(g, changes);
          const barColor = actionMeta.color;
          const formatHistoryValue = (fn: string, raw: string | null) => {
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
          const validChanges = changes.filter((c: any) => {
            if (!c.field) return false;
            const ov = formatHistoryValue(c.field, c.oldValue);
            const nv = formatHistoryValue(c.field, c.newValue);
            if (ov == null && nv == null) return false;
            if (ov === nv) return false;
            return true;
          });
          const reasons = g.items.map((i: any) => i.reason || i.ghiChu || i.note).filter(Boolean);
          if (validChanges.length === 0 && reasons.length === 0) return null;
          return (
            <div key={gi} style={{ ...historyGroupGridStyle, marginBottom: gi < groups.length - 1 ? spaceSm : 0 }}>
              <div style={{ minWidth: 0, paddingTop: spaceXs }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spaceSm }}>
                  <Typography.Text style={historyTimeStyle}>
                    {g.ts ? fmtTime(g.ts) : '—'}
                  </Typography.Text>
                  <span style={{ flexShrink: 0 }}>
                    <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeSm + 1, fontWeight: fontWeightMedium, background: actionMeta.bg, color: actionMeta.color, whiteSpace: 'nowrap' }}>{actionMeta.label}</span>
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 0 }}>
                  <Typography.Text style={historyMetaRowStyle}>
                    Người cập nhật: {g.actor || '—'}
                  </Typography.Text>
                  <Typography.Text style={historyMetaRowStyle}>
                    {historyMode === 'all' && g.items[0]?.entityId
                      ? `Nhà trạm: ${historyEntityNames[g.items[0].entityId] || g.items[0].entityId}`
                      : `Đơn vị: ${historyRecord && historyRecord.unitId ? (orgMap.get(historyRecord.unitId) || '—') : '—'}`}
                  </Typography.Text>
                </div>
              </div>
              <div style={historyInfoCardStyle}>
                <div style={historyAccentBarStyle(barColor)} />
                <Typography.Text style={historyInfoTitleStyle}>
                  {isCreate ? 'Thông tin thêm mới:' : 'Thông tin thay đổi:'}
                </Typography.Text>
                {validChanges.length > 0 ? <div>{validChanges.map((change, ri: number) => {
                  const fn = change.field;
                  const ov = formatHistoryValue(fn, change.oldValue);
                  const nv = formatHistoryValue(fn, change.newValue);
                  const renderCell = (rawVal: string | null) => {
                    if ((fn === 'mapSymbolId' || fn === 'icon') && rawVal && rawVal !== '(null)') {
                      const img = symbolImageMap.get(rawVal);
                      const name = symbolMap.get(rawVal) || rawVal;
                      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{img ? <img src={img} alt="" style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 4 }} /> : null}{name}</span>;
                    }
                    return null;
                  };
                  const renderVal = (rawVal: string | null, fmtVal: string | null) => renderCell(rawVal) ?? (fmtVal != null ? renderHistoryValueTag(fn, fmtVal) : <span style={{ color: textTertiary }}>—</span>);
                  return isCreate ? (
                    <div key={`${fn}-${ri}`} style={{ ...historyCreateRowStyle, paddingTop: ri > 0 ? spaceXs : 0 }}>
                      <div style={historyFieldLabelStyle}>{fn ? `${stationFieldLabel(fn)}:` : '—'}</div>
                      <span title={nv ?? '—'} style={historyNewValueStyle}>{renderVal(change.newValue, nv)}</span>
                    </div>
                  ) : (
                    <div key={`${fn}-${ri}`} style={{ ...historyChangeRowStyle, paddingTop: ri > 0 ? spaceXs : 0 }}>
                      <div style={historyFieldLabelStyle}>{fn ? `${stationFieldLabel(fn)}:` : '—'}</div>
                      <span title={ov ?? '—'} style={historyOldValueStyle}>{renderVal(change.oldValue, ov)}</span>
                      <span style={historyArrowStyle}>→</span>
                      <span title={nv ?? '—'} style={historyNewValueStyle}>{renderVal(change.newValue, nv)}</span>
                    </div>
                  );
                })}</div> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: spaceXs }}>
                    {reasons.map((r: string, ri: number) => (
                      <div key={ri} style={{ fontSize: fontSizeMd, color: textPrimary }}>{r}</div>
                    ))}
                  </div>
                )}
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

  const confirmApprove = useCallback(async (contentOverride?: string) => {
    if (!approvingRecord) return;
    const aid = currentUser?.userId;
    if (!aid) { toast.error('Không xác định được người dùng'); return; }
    try {
      const content = (contentOverride ?? approvalContent).trim() || undefined;
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
          <a title={name} onClick={() => void openDetail(record)} style={{ ...cellTitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</a>
          <span title={record.code} style={{ ...cellSubtitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.code || '—'}</span>
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
      render: (v: string) => (v ? (DEFAULT_OPERATING_ORGANIZATIONS.find(o => o.id === v)?.name || v) : '—'),
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
      key: 'province', label: 'Địa điểm (Tỉnh/Thành phố)', dataIndex: 'province', width: 250, sortable: true,
      render: (v: string) => (v || '—'),
    },
    {
      key: 'condition', label: 'Tình trạng', dataIndex: 'condition', width: 230, sortable: true,
      render: (v: string) => { const s = CONDITION_STYLE[v || ''] || { color: textTertiary, label: v || '—' }; return <span style={statusBadgeStyle(s.color)}>{s.label}</span>; },
    },
    {
      key: 'status', label: 'Trạng thái', dataIndex: 'status', width: 260, sortable: true,
      render: (s: string) => {
        if (!s) return <span style={{ color: textTertiary }}>—</span>;
        const m = APPROVAL_STYLE_MAP[s] || { color: textTertiary, label: s };
        return <span style={statusBadgeStyle(m.color)}>{m.label}</span>;
      },
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

  // ── rowActions callback (Port pattern) ──────────────────────────
  // Thứ tự: Xem chi tiết → Chỉnh sửa → Xem vị trí → Lịch sử → Phê duyệt/Từ chối → Xóa
  const rowActions = useCallback((r: BuoyStationResponse) => {
    const a: any[] = [];
    a.push({ key: 'view', label: 'Xem chi tiết', icon: icons.view, onClick: () => void openDetail(r) });
    // Quy tắc 12 (approval-2-level-spec.md mục 3.9)
    if (canEditApprovalRecord(r.status, { hasPerm, resource: 'buoystation', extraUpdatePerms: ['data:update', 'admin:manage'], extraApprovePerms: ['admin:manage'] })) a.push({ key: 'edit', label: 'Chỉnh sửa', icon: icons.edit, onClick: () => void openEdit(r) });
    if (r.latitude != null && r.longitude != null) a.push({ key: 'loc', label: 'Xem vị trí', icon: icons.location, onClick: () => window.open(`https://www.google.com/maps?q=${r.latitude},${r.longitude}`, '_blank') });
    // Lịch sử — luôn hiển thị khi có quyền
    a.push({ key: 'history', label: 'Lịch sử', icon: icons.history, onClick: () => void openHistoryDrawer(r) });
    // Phê duyệt / Từ chối — theo trạng thái
    if ((hasPerm('buoystation:create') || hasPerm('buoystation:update') || hasPerm('data:create') || hasPerm('data:update') || hasPerm('admin:manage')) && (r.status === 'DRAFT' || r.status === 'REJECTED' || r.status === 'REJECTED_L1' || r.status === 'REJECTED_L2')) a.push({ key: 'submit', label: 'Gửi Cảng vụ phê duyệt', icon: icons.submit, onClick: () => openSubmit(r) });
    const canApproveL1 = hasPerm('buoystation:approvec1') || hasPerm('buoystation:approvel1') || hasPerm('data:approvec1') || hasPerm('data:approvel1') || hasPerm('admin:manage');
    const canApproveL2 = hasPerm('buoystation:approvec2') || hasPerm('buoystation:approvel2') || hasPerm('data:approvec2') || hasPerm('data:approvel2') || hasPerm('admin:manage');
    if (canApproveL1 && r.status === 'PENDING_APPROVAL') {
      a.push({ key: 'appL1', label: 'Cảng vụ phê duyệt', icon: icons.approve, onClick: () => openApprove(r, 'L1') });
      a.push({ key: 'rej', label: 'Từ chối', icon: icons.reject, onClick: () => openReject(r), danger: true });
    }
    if (canApproveL2 && r.status === 'APPROVED_L1') {
      a.push({ key: 'appL2', label: 'Cục phê duyệt', icon: icons.approve, onClick: () => openApprove(r, 'L2') });
      a.push({ key: 'rej', label: 'Từ chối', icon: icons.reject, onClick: () => openReject(r), danger: true });
    }
    // Xóa — luôn ở cuối cùng
    if ((hasPerm('buoystation:delete') || hasPerm('data:delete') || hasPerm('admin:manage')) && (r.status === 'DRAFT' || r.status === 'REJECTED' || r.status === 'REJECTED_L1' || r.status === 'REJECTED_L2')) a.push({ key: 'del', label: 'Xóa', icon: icons.delete, onClick: () => openDelete(r), danger: true });
    return a;
  }, [hasPerm, openEdit, openDetail, openHistoryDrawer, openSubmit, openApprove, openReject, openDelete]);

  // ── Render ────────────────────────────────────────────────────────
  return (
    <ThemeTokenProvider tokens={themeTokenChk}>
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
      <style>{`.buoy-station-filter .ant-select-selector { border-radius: 999px !important; } .buoy-station-filter .ant-select-selection-item { border-radius: 999px !important; } .range-single-panel .ant-picker-panel-container .ant-picker-panel:last-child { display: none !important; }`}</style>
      <ScreenHeader
        breadcrumb={[{ label: 'Báo hiệu hàng hải' }, { label: 'Nhà trạm Phao, tiêu' }]}
        actions={[{ key: 'create', label: 'Thêm mới', variant: 'primary' as const, icon: icons.create, onClick: openCreate }]}
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
        {isError ? null : (
          <DataTable
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            rowActions={rowActions}
            loading={false}
            onSort={handleSortChange}
            scroll={{ x: 'max-content' }}
          />
        )}
        <Pagination total={total} current={page} pageSize={pageSize} onChange={(p, ps) => { setPage(p); setPageSize(ps); }} />
      </FilterTableLayout>

      {/* ── Detail Drawer ──────────────────────────────────────────── */}
      <AppDrawer
        size={1000}
        title={<span style={drawerTitleStyle}>{detailRecord ? `Chi tiết thông tin nhà trạm quản lý vận hành phao, tiêu - ${detailRecord.name}` : 'Chi tiết thông tin nhà trạm quản lý vận hành phao, tiêu'}</span>}
        open={detailOpen}
        onClose={closeDetail}
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
      </AppDrawer>

      {/* ── Buoy Detail Drawer (nested — đè lên chi tiết nhà trạm) ── */}
      <AppDrawer
        size={950}
        title={<span style={drawerTitleStyle}>{viewBuoyRecord ? `Chi tiết phao tiêu - ${viewBuoyRecord.name}` : 'Chi tiết phao tiêu'}</span>}
        open={viewBuoyOpen}
        onClose={() => setViewBuoyOpen(false)}
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
      </AppDrawer>

      {/* ── History Drawer ─────────────────────────────────────────── */}
      <AppDrawer
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
              <Select placeholder="Chọn nhà trạm" allowClear showSearch value={historyEntityFilter || undefined}
                onChange={(v) => { setHistoryEntityFilter(v || ''); setHistoryPage(0); }}
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
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }} onScroll={handleHistoryScroll}>
          {historyLoading ? <LoadingSkeleton rows={5} /> : visibleHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
              <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
              <div style={{ color: textTertiary, fontSize: fontSizeMd }}>Chưa có thay đổi nào được ghi nhận</div>
            </div>
          ) : (<>
            {renderHistoryTimeline(visibleHistory)}
            {loadingMoreHistory && <div style={{ textAlign: 'center', padding: `${spaceMd}px 0`, color: textTertiary, fontSize: fontSizeMd }}>Đang tải thêm...</div>}
          </>)}
        </div>
      </AppDrawer>

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

      {/* ── Approve Modal (chuẩn VTS CHK) ─────────────────────────── */}
      <ApprovalModal
        visible={approveOpen}
        level={approveLevel === 'L2' ? 'c2' : 'c1'}
        onConfirm={(content) => { if (approvingRecord) void confirmApprove(content); }}
        onCancel={() => { setApproveOpen(false); setApprovingRecord(null); setApprovalContent(''); }}
      />

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
      <AppDrawer
        title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>Thêm mới thông tin nhà trạm quản lý vận hành phao, tiêu</span>}
        open={createOpen}
        onClose={() => { setCreateOpen(false); setCreateUploaded([]); setCreateExisting([]); createForm.resetFields(); }}
        footer={
          <>

          <Button onClick={() => createFormRef.current?.submit('DRAFT')} style={outlineButtonStyle}>Lưu tạm</Button>
            <Button type="primary" onClick={() => createFormRef.current?.submit('SUBMIT')} style={primaryButtonStyle}>Lưu và gửi phê duyệt</Button>
            <Button type="primary" onClick={() => createFormRef.current?.submit('APPROVED')} style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}>Lưu và phê duyệt</Button>
          </>
        }
      >
        <style>{requiredMarkStyle}</style>
        <Form form={createForm} layout="vertical" scrollToFirstError>
          <BuoyStationFormContent ref={createFormRef} form={createForm} isEdit={false} uploadedFiles={createUploaded} setUploadedFiles={setCreateUploaded} existingFiles={createExisting} organizations={organizations} userMap={userMap} onFinish={() => { setCreateOpen(false); setCreateUploaded([]); setCreateExisting([]); createForm.resetFields(); void fetchData(); }} />
        </Form>
      </AppDrawer>

      {/* ── Edit Drawer ────────────────────────────────────────────── */}
      <AppDrawer
        title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>Chỉnh sửa thông tin nhà trạm quản lý vận hành phao, tiêu — {editRecord ? editRecord.name : 'Nhà trạm quản lý vận hành phao, tiêu'}</span>}
        open={editOpen}
        onClose={() => { setEditOpen(false); setEditRecord(null); setEditUploaded([]); setEditExisting([]); editForm.resetFields(); }}
        footer={
          <div style={drawerFooterStyle}>
            <Button type="primary" onClick={() => editFormRef.current?.submit('APPROVED')} style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}>Lưu và phê duyệt</Button>
          </div>
        }
      >
        <style>{requiredMarkStyle}</style>
        <Form form={editForm} layout="vertical" scrollToFirstError>
          <BuoyStationFormContent ref={editFormRef} form={editForm} isEdit entityData={editRecord} uploadedFiles={editUploaded} setUploadedFiles={setEditUploaded} existingFiles={editExisting} organizations={organizations} userMap={userMap} onFinish={() => { setEditOpen(false); setEditRecord(null); setEditUploaded([]); setEditExisting([]); editForm.resetFields(); void fetchData(); }} />
        </Form>
      </AppDrawer>
    </div>
    </ThemeTokenProvider>
  );
}

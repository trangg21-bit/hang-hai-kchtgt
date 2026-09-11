import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Button, Modal, Input, Select, DatePicker,
  Drawer, Space, Typography, Form,
} from 'antd';
import {
  HistoryOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  buoyBerthCRUD,
  buoyBerthApproval,
  portCRUD,
  anchorageCRUD,
  stormShelterCRUD,
} from '../../services/portService';
import type { BuoyBerth } from '../../types/port';
import { canEditApprovalRecord, canDeleteApprovalRecord, normalizeApprovalStatus } from '../../utils/approvalEditPolicy';
import { organizationService } from '../../services/organizationService';
import { OrgUnitTreeSelect, resolveOrgLevel2Name } from '../../components/org-unit';
import { symbolService } from '../../services/symbolService';
import api from '../../services/api';
import { userService } from '../../services/userService';
import type { Organization } from '../../services/organizationService';
import { usePermissionStore } from '../../store/permissionStore';
import { useAuthStore } from '../../store/authStore';
import { VIETNAM_PROVINCES } from '../../types/common';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../services/operatingOrganizationsData';
import { ScreenHeader, DataTable, type ScreenHeaderAction } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import toast from '../../components/ToastNotification';
import { navigationChannelCRUD } from '../../services/navigationChannelService';
import { formatHistoryNumber } from '../../utils/numFmt';
import BuoyBerthForm from './BuoyBerthForm';
import BuoyBerthDetailContent from './BuoyBerthDetailContent';
import AnchorageDetailContent from '../anchorage/AnchorageDetailContent';
import StormShelterDetailContent from '../storm-shelter/StormShelterDetailContent';
import { AppDrawer } from '../../components/shared/AppDrawer';
import DeleteConfirmModal from '../../components/shared/DeleteConfirmModal';
import { BUOY_BERTH_CLASSIFICATION_OPTIONS } from './BuoyBerthForm';
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
  fontSizeLg,
  fontSizeSm,
  fontWeightMedium,
  fontWeightBold,
  radiusPill,
  spaceMd,
  spaceSm,
  spaceXs,
  spaceXl,
  spaceFormField,
  drawerProps, drawerTitleStyle, drawerCloseBtnStyle, drawerFooterStyle,
  primaryButtonStyle, outlineButtonStyle, requiredMarkStyle,
  icons, statusBadgeStyle,
  cellTitleStyle, cellSubtitleStyle, getRangePickerProps,
} from '../../themetokenchk';
import { colors } from '../../themetokenchk';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import ApprovalModal from '../../components/shared/ApprovalModal';
import { renderStandardHistoryCards, isBlankOrDash } from '../../utils/changeHistoryRenderer';

// ── Cỡ chữ 13.5px đồng bộ chuẩn VTS CHK (theo PortListPage / PierListPage) — override thay vì dùng
// fontSizeMd=13 import từ themetokenchk để mọi cell/table/input/button cao ngang nhau.
const fontSizeMd = 13.5;

// ── Constants ────────────────────────────────────────────────────────

const APPROVAL_STYLE_MAP: Record<string, { color: string; label: string }> = {
  NHAP: { color: statusDraft, label: 'Lưu tạm' },
  DRAFT: { color: statusDraft, label: 'Lưu tạm' },
  PROPOSED: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  PENDING_APPROVAL: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  APPROVED_LEVEL1: { color: statusAttention, label: 'Chờ phê duyệt cấp cục' },
  APPROVED: { color: statusOperational, label: 'Đã phê duyệt' },
  REJECTED: { color: statusCritical, label: 'Từ chối cấp Cảng vụ/Chi cục' },
  TU_CHOI: { color: statusCritical, label: 'Từ chối cấp Cảng vụ/Chi cục' },
  REJECTED_LEVEL1: { color: statusCritical, label: 'Từ chối cấp Cảng vụ/Chi cục' },
  REJECTED_LEVEL2: { color: statusCritical, label: 'Từ chối cấp cục' },
};

const TAB_STATUS_LIST = [
  { key: 'all', label: 'Tất cả', color: actionPrimary },
  { key: 'DRAFT', label: 'Lưu tạm', color: statusDraft },
  { key: 'PENDING_APPROVAL', label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', color: actionPrimary },
  { key: 'APPROVED_LEVEL1', label: 'Chờ phê duyệt cấp cục', color: statusAttention },
  { key: 'APPROVED', label: 'Đã phê duyệt', color: statusOperational },
  { key: 'REJECTED_LEVEL1', label: 'Từ chối cấp Cảng vụ/Chi cục', color: statusCritical },
  { key: 'REJECTED_LEVEL2', label: 'Từ chối cấp cục', color: statusCritical },
];

const TAB_QUERY_MAP: Record<string, string | undefined> = {
  all: undefined,
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED_LEVEL1: 'APPROVED_LEVEL1',
  APPROVED: 'APPROVED',
  REJECTED_LEVEL1: 'REJECTED_LEVEL1',
  REJECTED_LEVEL2: 'REJECTED_LEVEL2',
};

// ── Helper: format date ──────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try { return dayjs(dateStr).format('DD/MM/YYYY HH:mm:ss'); } catch { return dateStr; }
}

// ── History helpers ───────────────────────────────────────────────────

const histLabels: Record<string, string> = {
  securityLevel: 'Cấp bảo mật', buoyBerthCode: 'Mã bến phao', buoyBerthName: 'Tên bến phao', portId: 'Thuộc cảng biển',
  waterwayId: 'Thuộc luồng hàng hải',
  classification: 'Phân cấp công trình',
  provinceId: 'Tỉnh/Thành phố', detailedLocation: 'Địa điểm chi tiết', operationalStatus: 'Tình trạng hoạt động',
  conditionStatus: 'Tình trạng kỹ thuật',
  operatingOrgId: 'Đơn vị khai thác',
  currentWaterDepth: 'Độ sâu khu nước hiện tại', bottomElevationDesign: 'Cao độ đáy bến thiết kế',
  maxVesselDWT: 'Cỡ tàu khai thác theo công bố', plannedVesselDWT: 'Cỡ tàu khai thác theo quy hoạch',
  lastInspectionDate: 'Thời điểm đăng kiểm gần nhất', nextInspectionDate: 'Thời điểm đăng kiểm tiếp theo', operationExpiryDate: 'Thời hạn khai thác',
  designCapacity: 'Năng lực thông qua thiết kế',
  activeBuoyBerthCount: 'Số lượng bến phao đang khai thác', publishedBuoyBerthCount: 'Số lượng bến phao công bố',
  publishedBuoyBert: 'Số lượng bến phao công bố',
  underInvestmentBuoyBerthCount: 'Số lượng bến phao đang được thỏa thuận đầu tư xây dựng', cargoThroughput: 'Sản lượng hàng thông qua',
  openingAnnouncementDate: 'Ngày công bố', publicDecision: 'Quyết định công bố', investmentAgreement: 'Thỏa thuận đầu tư',
  mooringWaterAreaScope: 'Phạm vi khu nước neo buộc tàu',
  orgUnitId: 'Đơn vị quản lý', mapSymbolId: 'Biểu tượng', approvalStatus: 'Trạng thái',
  submittedForApprovalAt: 'Ngày gửi phê duyệt', submittedForApprovalBy: 'Người gửi phê duyệt',
  portAuthorityApprovedAt: 'Ngày duyệt Cảng vụ', portAuthorityApprovedBy: 'Người duyệt Cảng vụ',
  portAuthorityApprovalContent: 'Nội dung phê duyệt Cảng vụ',
  departmentApprovedAt: 'Ngày duyệt Cục', departmentApprovedBy: 'Người duyệt Cục',
  departmentApprovalContent: 'Nội dung phê duyệt Cục', rejectionReason: 'Lý do từ chối',
  coordinateSystem: 'Hệ quy chiếu', displayRule: 'Quy tắc hiển thị', spatialId: 'Vị trí không gian',
  'Trạng thái': 'Trạng thái',
  'Trạng thái phê duyệt': 'Trạng thái',
  'Tọa độ GIS': 'Tọa độ GPS',
  'Tọa độ GPS': 'Tọa độ GPS',
  'Loại đối tượng GIS': 'Loại đối tượng',
  'Loại đối tượng': 'Loại đối tượng',
  'Tài liệu đính kèm': 'File đính kèm',
  'File đính kèm': 'File đính kèm',
  attachments: 'File đính kèm',
};

const NUMERIC_HISTORY_FIELDS = new Set([
  'currentWaterDepth', 'bottomElevationDesign',
  'maxVesselDWT', 'plannedVesselDWT', 'designCapacity',
  'activeBuoyBerthCount', 'publishedBuoyBerthCount', 'publishedBuoyBert',
  'underInvestmentBuoyBerthCount', 'cargoThroughput',
  'Độ sâu khu nước hiện tại', 'Cao độ đáy bến thiết kế',
  'Cỡ tàu khai thác theo công bố', 'Cỡ tàu khai thác theo quy hoạch',
  'Năng lực thông qua thiết kế', 'Số lượng bến phao đang khai thác',
  'Số lượng bến phao công bố', 'Số lượng bến phao đang được thỏa thuận đầu tư xây dựng',
  'Sản lượng hàng thông qua',
]);

function normalizeHistoryKey(value: string): string {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');
}

function histField(fn: string): string {
  if (!fn) return '';
  const clean = fn.replace(/\.+$/, '').trim();
  const norm = normalizeHistoryKey(clean);
  if (norm.startsWith('publishedbuoybert') || norm.startsWith('publishedbuoy')) {
    return 'Số lượng bến phao công bố';
  }
  if (histLabels[clean]) return histLabels[clean];
  if (histLabels[fn]) return histLabels[fn];
  for (const [k, v] of Object.entries(histLabels)) {
    if (normalizeHistoryKey(k) === norm) return v;
  }
  return clean || fn;
}

function histVal(
  fn: string,
  val: string | null,
  orgMap?: Map<string, string>,
  symbolMap?: Map<string, string>,
  portMap?: Map<string, string>,
  waterwayMap?: Map<string, string>
): string {
  if (!val || val === '(null)' || val === 'null' || val === '-' || val === '—' || val === '–') return '';
  if (fn === 'operatingOrgId') {
    const org = DEFAULT_OPERATING_ORGANIZATIONS.find((o) => o.id === val);
    if (org) return org.name;
    if (orgMap) {
      const f = orgMap.get(val);
      if (f) return f.split(' - ').pop() || f;
    }
    return val;
  }
  if (fn === 'orgUnitId' && orgMap) {
    const f = orgMap.get(val);
    return f ? f.split(' - ').pop() || f : val;
  }
  if (fn === 'portId' && portMap) return portMap.get(val) || val;
  if (fn === 'waterwayId' && waterwayMap) return waterwayMap.get(val) || val;
  if (fn === 'mapSymbolId' && symbolMap) return symbolMap.get(val) || val;
  if (fn === 'approvalStatus') {
    const m: Record<string, string> = {
      NHAP: 'Lưu tạm', DRAFT: 'Lưu tạm',
      CHO_PHE_DUYET: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', CHO_PD_CAP_CUC: 'Chờ phê duyệt cấp cục',
      PENDING: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', PENDING_APPROVAL: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
      APPROVED_LEVEL1: 'Chờ phê duyệt cấp cục', APPROVED: 'Đã phê duyệt',
      APPROVED_LEVEL2: 'Đã duyệt (lịch sử)', DA_PHE_DUYET: 'Đã phê duyệt',
      REJECTED: 'Từ chối cấp Cảng vụ/Chi cục', TU_CHOI: 'Từ chối cấp Cảng vụ/Chi cục',
      REJECTED_LEVEL1: 'Từ chối cấp Cảng vụ/Chi cục', REJECTED_LEVEL2: 'Từ chối cấp cục',
    };
    return m[val?.toUpperCase()] || val;
  }
  if (fn === 'operationalStatus') {
    const m: Record<string, string> = {
      OPERATIONAL: 'Đang khai thác/vận hành', NOT_YET_OPERATIONAL: 'Chưa khai thác/vận hành',
      SUSPENDED: 'Dừng khai thác/vận hành', HIEN_HANH: 'Hiện hành', TAM_NGUNG: 'Tạm ngừng',
      DANG_KHAI_THAC: 'Đang khai thác/vận hành', CHUA_KHAI_THAC: 'Chưa khai thác/vận hành',
      DUNG_KHAI_THAC: 'Dừng khai thác/vận hành',
    };
    return m[val?.toUpperCase()] || val;
  }
  if (fn === 'provinceId' || fn === 'province') {
    const p = VIETNAM_PROVINCES[Number(val) - 1];
    return p || val;
  }
  if (fn === 'coordinateSystem') {
    const m: Record<string, string> = { '1': 'WGS-84', '2': 'VN-2000' };
    return m[val] || val;
  }
  if (fn.endsWith('At') || fn.endsWith('Date')) {
    try {
      let d = dayjs(val);
      if (!d.isValid()) {
        d = dayjs((val || '').replace(/\.\d+$/, ''));
      }
      return d.isValid() ? d.format('DD/MM/YYYY HH:mm') : val;
    } catch {
      return val;
    }
  }
  return val;
}


// ── Component ────────────────────────────────────────────────────────

export default function BuoyBerthList() {
  const hasPerm = usePermissionStore((s: any) => s.hasPermission);
  const userPermissions = useAuthStore((s: any) => s.user?.permissions) || [];
  const isAuditViewer = userPermissions.includes('admin:manage') || userPermissions.includes('admin:operation');
  // ── Filter state ─────────────────────────────────────────────────
  const [managingUnitId, setManagingUnitId] = useState<string | undefined>();
  const defaultOrgUnitId = useRef<string | undefined>(undefined);
  const defaultOrgApplied = useRef(false);
  const [orgUnitReady, setOrgUnitReady] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [filterPortId, setFilterPortId] = useState<string | undefined>();
  const [filterWaterwayId, setFilterWaterwayId] = useState<string | undefined>();
  const [filterProvince, setFilterProvince] = useState('');
  const [filterOperationalStatus, setFilterOperationalStatus] = useState<string | undefined>();
  const [filterClassification, setFilterClassification] = useState<string | undefined>();
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState<string | undefined>();
  const [filterUpdatedTo, setFilterUpdatedTo] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState('all');
  const [filterCollapsed, setFilterCollapsed] = useState(false);

  // ── Pagination ──────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // ── Data ─────────────────────────────────────────────────────────
  const [dataSource, setDataSource] = useState<BuoyBerth[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [, setError] = useState<Error | null>(null);
  const [sortField, setSortField] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend'>('descend');

  // ── Organizations + Users for lookup ────────────────────────────
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
  const [symbolMap, setSymbolMap] = useState<Map<string, string>>(new Map());
  const [symbolImageMap, setSymbolImageMap] = useState<Map<string, string>>(new Map());

  const orgMap = useMemo(() => {
    const map = new Map<string, string>();
    organizations.forEach((o) => {
      map.set(o.id, o.name);
    });
    return map;
  }, [organizations]);

  // ── Port options ─────────────────────────────────────────────────
  const [portOptions, setPortOptions] = useState<{ value: string; label: string }[]>([]);
  const portMap = useMemo(() => {
    const map = new Map<string, string>();
    portOptions.forEach((o) => {
      map.set(o.value, o.label);
    });
    return map;
  }, [portOptions]);

  // ── Waterway options (Thuộc luồng hàng hải) ──
  const [waterwayOptions, setWaterwayOptions] = useState<Array<{ value: string; label: string }>>([]);

  const waterwayMap = useMemo(() => {
    const map = new Map<string, string>();
    waterwayOptions.forEach((o) => { map.set(o.value, o.label); });
    return map;
  }, [waterwayOptions]);

  // ── Tab counts ──────────────────────────────────────────────────
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  // ── Drawer state ────────────────────────────────────────────────
  const [createDrawerVisible, setCreateDrawerVisible] = useState(false);
  const [editBuoyBerthId, setEditBuoyBerthId] = useState<string | undefined>();
  const [editBaseStatus, setEditBaseStatus] = useState<string | undefined>();
  const [createForm] = Form.useForm();
  const buoyBerthFormRef = useRef<any>(null);
  // ── Submit loading — nút được bấm mới hiện loading tròn (tham chiếu màn Cảng biển) ──
  const [submitting, setSubmitting] = useState(false);
  const [actionType, setActionType] = useState<'draft' | 'submit' | 'approve'>('draft');
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [detailRecord, setDetailRecord] = useState<BuoyBerth | null>(null);
  const [infrastructureList, setInfrastructureList] = useState<any[]>([]);
  const [infraDetail, setInfraDetail] = useState<{ type: string; record: any } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailFiles, setDetailFiles] = useState<any[]>([]);

  // ── Delete confirmation modal ───────────────────────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<BuoyBerth | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Reject modal ────────────────────────────────────────────────
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRecord, setRejectingRecord] = useState<BuoyBerth | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  // ── Submit/Approve modal ────────────────────────────────────────
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submittingRecord, setSubmittingRecord] = useState<BuoyBerth | null>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvingRecord, setApprovingRecord] = useState<BuoyBerth | null>(null);
  const [, setApprovalContent] = useState('');

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<BuoyBerth | null>(null);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilters, setHistoryFilters] = useState<{ keyword: string; fromDate?: string; toDate?: string }>({ keyword: '' });

  const filteredHistory = useMemo(() => {
    const q = (historyFilters.keyword || '').trim().toLowerCase();
    const from = historyFilters.fromDate || '';
    const to = historyFilters.toDate || '';
    return (Array.isArray(historyRecords) ? historyRecords : []).filter((r: any) => {
      if (q) {
        const fn = String(r?.fieldName || r?.changedField || '').toLowerCase();
        const label = histField(fn) || fn;
        const rawHits = [fn, label, r?.oldValue, r?.newValue, r?.previousValue, r?.value, r?.reason, r?.ghiChu, r?.note]
          .filter((v) => v !== null && v !== undefined)
          .map((v) => String(v).toLowerCase());
        const resolvedOld = histVal(fn, r?.oldValue ?? r?.previousValue, orgMap, symbolMap, portMap, waterwayMap);
        const resolvedNew = histVal(fn, r?.newValue, orgMap, symbolMap, portMap, waterwayMap);
        if (resolvedOld) rawHits.push(String(resolvedOld).toLowerCase());
        if (resolvedNew) rawHits.push(String(resolvedNew).toLowerCase());
        if (!rawHits.some((text) => text.includes(q))) return false;
      }
      if (from || to) {
        const ts = r?.changedAt || r?.createdAt || r?.approvedDate || '';
        const day = ts ? dayjs(ts).format('YYYY-MM-DD') : '';
        if (!day) return false;
        if (from && day < from) return false;
        if (to && day > to) return false;
      }
      return true;
    });
  }, [historyRecords, historyFilters, orgMap, symbolMap, portMap, waterwayMap]);
  const hasActiveHistoryFilter = !!(historyFilters.keyword?.trim() || historyFilters.fromDate || historyFilters.toDate);

  const openHistory = useCallback(async (r: BuoyBerth) => {
    setHistoryTarget(r); setHistoryOpen(true); setHistoryLoading(true); setHistoryRecords([]);
    setHistoryFilters({ keyword: '' });
    try {
      const res = await api.get(`/v1/buoy-berth/${r.id}/history`);
      const d = res.data?.data;
      const list = Array.isArray(d) ? d : (Array.isArray(d?.changeHistory) ? d.changeHistory : []);
      setHistoryRecords(list.filter((item: any) => (item.fieldName || item.changedField) !== 'CREATE'));
    } catch {
      toast.error('Không thể tải lịch sử');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const HISTORY_FIELD_ORDER = [
    'orgUnitId', 'portId', 'waterwayId', 'buoyBerthCode', 'buoyBerthName',
    'classification', 'provinceId', 'detailedLocation', 'operatingOrgId',
    'operationalStatus', 'conditionStatus', 'currentWaterDepth', 'bottomElevationDesign',
    'maxVesselDWT', 'plannedVesselDWT', 'lastInspectionDate', 'nextInspectionDate',
    'operationExpiryDate', 'designCapacity', 'activeBuoyBerthCount',
    'publishedBuoyBerthCount', 'underInvestmentBuoyBerthCount', 'cargoThroughput',
    'openingAnnouncementDate', 'publicDecision', 'investmentAgreement',
    'mooringWaterAreaScope', 'mapSymbolId', 'coordinateSystem', 'displayRule',
    'Tọa độ GPS', 'Tọa độ GIS', 'Loại đối tượng', 'Loại đối tượng GIS', 'Tài liệu đính kèm', 'File đính kèm',
    // Vietnamese aliases
    'Đơn vị quản lý', 'Cảng biển', 'Luồng hàng hải', 'Mã bến phao', 'Tên bến phao',
    'Phân loại', 'Địa điểm (Tỉnh/Thành Phố)', 'Địa điểm chi tiết', 'Đơn vị khai thác',
    'Tình trạng', 'Tình trạng kỹ thuật', 'Độ sâu khu nước hiện tại', 'Cao độ đáy bến thiết kế',
    'Cỡ tàu khai thác theo công bố', 'Cỡ tàu khai thác theo quy hoạch',
    'Thời điểm đăng kiểm gần nhất', 'Thời điểm đăng kiểm tiếp theo', 'Thời hạn khai thác',
    'Năng lực thông qua thiết kế', 'Số lượng bến phao đang khai thác',
    'Số lượng bến phao công bố', 'Số lượng bến phao đang được thỏa thuận đầu tư xây dựng',
    'Sản lượng hàng thông qua', 'Ngày công bố', 'Quyết định công bố', 'Thỏa thuận đầu tư',
    'Phạm vi khu nước neo buộc tàu', 'Biểu tượng', 'Hệ quy chiếu', 'Quy tắc hiển thị',
    'Trạng thái', 'Trạng thái phê duyệt',
  ];

  const renderBuoyBerthHistoryTimeline = (records: any[]) => {
    return renderStandardHistoryCards({
      records,
      fieldLabels: histLabels,
      groupOrder: HISTORY_FIELD_ORDER,
      formatValue: (fn, raw) => {
        if ((fn === 'mapSymbolId' || fn === 'Biểu tượng bản đồ' || fn === 'Biểu tượng') && raw && !isBlankOrDash(raw)) {
          const img = symbolImageMap.get(raw);
          const name = symbolMap.get(raw) || raw;
          return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {img ? <img src={img} alt="" style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 4 }} /> : null}
              {name}
            </span>
          );
        }
        const resolved = histVal(fn, raw, orgMap, symbolMap, portMap, waterwayMap);
        if (NUMERIC_HISTORY_FIELDS.has(fn) && raw) {
          const t = String(raw).trim();
          if (/^-?\d+(\.\d+)?$/.test(t)) {
            return formatHistoryNumber(t);
          }
        }
        return isBlankOrDash(resolved) ? '' : resolved;
      },
      resolveUnitName: (rec) => {
        const orgId = rec.orgUnitId || historyTarget?.orgUnitId;
        const orgName = orgId ? orgMap.get(orgId) : undefined;
        return (orgName ? (orgName.split(' - ').pop() || orgName) : (rec.orgUnitName || rec.unitName)) || '';
      },
      emptyMessage: hasActiveHistoryFilter ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận',
    });
  };

  // ── Load organizations ──────────────────────────────────────────
  useEffect(() => {
    const isIframe = window.self !== window.top;
    const parentOrgUnits = isIframe ? (window.parent as any)?.kchtOrgUnits : undefined;
    if (parentOrgUnits && parentOrgUnits.length > 0) {
      setOrganizations(parentOrgUnits);
      if (!defaultOrgApplied.current) {
        defaultOrgApplied.current = true;
        defaultOrgUnitId.current = parentOrgUnits[0].id;
        setManagingUnitId(parentOrgUnits[0].id);
      }
      setOrgUnitReady(true);
    } else {
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
              const defaultId = userOrgId ? (match ? userOrgId : data[0].id) : '__all__';
              defaultOrgUnitId.current = defaultId;
              setManagingUnitId(defaultId === '__all__' ? undefined : defaultId);
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
    }
    (async () => {
      try {
        const resp = await userService.list({ pageSize: 1000 });
        const users = resp.data || (resp as any).content || [];
        const map = new Map<string, string>();
        users.forEach((u: any) => { map.set(u.id, u.fullName || u.username || u.id); });
        setUserMap(map);
      } catch { console.error('Failed to load users'); }
    })();
    (async () => {
      try {
        const resp = await symbolService.list({ page: 1, pageSize: 1000, status: 'active' });
        const symbols = resp.data || (resp as any).content || [];
        const map = new Map<string, string>();
        const imgMap = new Map<string, string>();
        symbols.forEach((s: any) => { map.set(s.id, s.name); if (s.image) imgMap.set(s.id, s.image); });
        setSymbolMap(map);
        setSymbolImageMap(imgMap);
      } catch { console.error('Failed to load symbols'); }
    })();
    // ── Thuộc luồng hàng hải (cùng nguồn options như form và Quản lý cầu cảng) ──
    navigationChannelCRUD.search({ approvalStatus: 'APPROVED', page: 0, size: 1000 })
      .then(r => setWaterwayOptions((r.items || []).map(n => ({ value: n.id, label: n.channelName || n.channelCode || '' }))))
      .catch(() => {});
  }, []);

  // ── Load port options ──────────────────────────────────────────
  useEffect(() => {
    if (!orgUnitReady) return;
    (async () => {
      try {
        const params: any = { page: 1, pageSize: 1000 };
        if (managingUnitId && managingUnitId !== '__all__') params.orgUnitId = managingUnitId;
        const res = await portCRUD.search(params);
        setPortOptions((res.data || []).map((p: any) => ({ value: p.id, label: p.portName })));
      } catch { /* ignore */ }
    })();
  }, [managingUnitId, orgUnitReady]);

  // ── Fetch tab counts ────────────────────────────────────────────
  const fetchCounts = useCallback(async (orgId: string | undefined) => {
    try {
      const results = await Promise.allSettled(
        TAB_STATUS_LIST.map((tab) =>
          tab.key === 'all'
            ? buoyBerthCRUD.search({ orgUnitId: (orgId && orgId !== '__all__') ? orgId : undefined, page: 1, pageSize: 1 })
            : buoyBerthCRUD.search({ approvalStatus: TAB_QUERY_MAP[tab.key], orgUnitId: (orgId && orgId !== '__all__') ? orgId : undefined, page: 1, pageSize: 1 }),
        ),
      );
      const counts: Record<string, number> = {};
      results.forEach((result, idx) => {
        const tabKey = TAB_STATUS_LIST[idx]?.key || 'all';
        counts[tabKey] = result.status === 'fulfilled' ? result.value.total : 0;
      });
      setTabCounts(counts);
    } catch { /* silent */ }
  }, []);

  // ── Fetch main data ─────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true); setIsError(false); setError(null);
    try {
      const res = await buoyBerthCRUD.search({
        orgUnitId: (managingUnitId && managingUnitId !== '__all__') ? managingUnitId : undefined,
        buoyBerthName: filterName.trim() || undefined,
        buoyBerthCode: filterCode.trim() || undefined,
        portId: filterPortId,
        waterwayId: filterWaterwayId,
        classification: filterClassification,
        provinceId: filterProvince ? (VIETNAM_PROVINCES.indexOf(filterProvince) + 1) : undefined,
        operationalStatus: filterOperationalStatus,
        approvalStatus: TAB_QUERY_MAP[activeTab],
        updatedFrom: filterUpdatedFrom,
        updatedTo: filterUpdatedTo,
        page,
        pageSize,
      });
      setDataSource(res.data); setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách bến phao'));
    } finally { setIsLoading(false); }
  }, [managingUnitId, filterName, filterCode, filterPortId, filterWaterwayId,
    filterClassification,
    filterProvince, filterOperationalStatus,
    filterUpdatedFrom, filterUpdatedTo, activeTab, page, pageSize]);

  useEffect(() => { if (orgUnitReady) void fetchData(); }, [fetchData, orgUnitReady]);
  useEffect(() => { if (orgUnitReady) void fetchCounts(managingUnitId); }, [managingUnitId, fetchCounts, orgUnitReady]);

  // ── Filter handlers ─────────────────────────────────────────────
  const handleFilterApply = useCallback(() => {
    setPage(1);
  }, []);

  const handleFilterReset = useCallback(() => {
    const defaultOrg = defaultOrgUnitId.current;
    setManagingUnitId(defaultOrg === '__all__' ? undefined : defaultOrg);
    setFilterName(''); setFilterCode(''); setFilterPortId(undefined);
    setFilterWaterwayId(undefined); setFilterClassification(undefined);
    setFilterProvince('');
    setFilterOperationalStatus(undefined);
    setFilterUpdatedFrom(undefined); setFilterUpdatedTo(undefined);
    setActiveTab('all'); setPage(1);
  }, []);

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key); setPage(1);
  }, []);

  // ── Detail drawer ────────────────────────────────────────────────
  const openDetailDrawer = useCallback(async (record: BuoyBerth) => {
    setDetailDrawerVisible(true); setDetailRecord(record); setDetailFiles([]); setDetailLoading(true);
    try {
      const res = await api.get(`/v1/buoy-berth/${record.id}/attachments`, { params: { page: 0, size: 50 } });
      setDetailFiles(res.data?.data || []);
    } catch { setDetailFiles([]); }
    try {
      const fresh = await buoyBerthCRUD.findById(record.id);
      setDetailRecord(fresh);
    } catch { /* keep initial data */ }
    // ── Kết cấu hạ tầng thuộc bến phao: Khu neo đậu + Khu tránh, trú bão (buoyStationId = id bến phao) ──
    try {
      const [aRes, sRes] = await Promise.all([
        anchorageCRUD.search({ page: 1, pageSize: 1000, buoyStationId: record.id }),
        stormShelterCRUD.search({ page: 1, pageSize: 1000, buoyStationId: record.id }),
      ]);
      const list = [
        ...(aRes.data || []).map((x: any) => ({ id: x.id, infraName: x.anchorageName || x.name || '', infraType: 'ANCHORAGE' })),
        ...(sRes.data || []).map((x: any) => ({ id: x.id, infraName: x.stormShelterName || x.name || '', infraType: 'STORM_SHELTER' })),
      ];
      setInfrastructureList(list);
    } catch { setInfrastructureList([]); }
    finally { setDetailLoading(false); }
  }, []);

  // ── Kết cấu hạ tầng detail (giống bến cảng: mở drawer chi tiết KCHT) ──
  const openInfraDetail = useCallback(async (id: string) => {
    const item = infrastructureList.find(i => i.id === id);
    if (!item) return;
    try {
      if (item.infraType === 'ANCHORAGE') {
        const rec = await anchorageCRUD.findById(id);
        setInfraDetail({ type: 'ANCHORAGE', record: rec });
      } else {
        const rec = await stormShelterCRUD.findById(id);
        setInfraDetail({ type: 'STORM_SHELTER', record: rec });
      }
    } catch { /* noop */ }
  }, [infrastructureList]);

  // ── Delete confirmation ─────────────────────────────────────────
  const openDeleteModal = useCallback((record: BuoyBerth) => {
    setDeletingRecord(record);
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingRecord) return;
    setDeleteLoading(true);
    try {
      await buoyBerthCRUD.delete(deletingRecord.id);
      toast.success('Đã xóa bến phao');
      setDeleteModalOpen(false);
      setDeletingRecord(null);
      setSortField('updatedAt');
      setSortOrder('descend');
      setPage(1);
      void fetchData();
      void fetchCounts(managingUnitId);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingRecord, fetchData, fetchCounts, managingUnitId]);

  // ── Approval handlers ───────────────────────────────────────────
  const handleApprove = useCallback(async (record: BuoyBerth, content?: string) => {
    try {
      const st = normalizeApprovalStatus(record.approvalStatus);
      if (st === 'PENDING_APPROVAL') {
        await buoyBerthApproval.approveC1(record.id, content);
      } else {
        await buoyBerthApproval.approveC2(record.id, content);
      }
      toast.success(st === 'PENDING_APPROVAL' ? 'Đã phê duyệt cấp Cảng vụ/Chi cục' : 'Đã phê duyệt cấp Cục');
      setApproveModalOpen(false);
      setApprovingRecord(null);
      setApprovalContent('');
      setSortField('updatedAt');
      setSortOrder('descend');
      setPage(1);
      void fetchData();
      void fetchCounts(managingUnitId);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại'); }
  }, [fetchData, fetchCounts, managingUnitId]);

  const handleConfirmSubmit = useCallback(async () => {
    if (!submittingRecord) return;
    try {
      await buoyBerthCRUD.update({ id: submittingRecord.id, saveAction: 'SUBMIT' });
      toast.success('Đã gửi phê duyệt bến phao');
      setSubmitModalOpen(false);
      setSubmittingRecord(null);
      setSortField('updatedAt');
      setSortOrder('descend');
      setPage(1);
      void fetchData();
      void fetchCounts(managingUnitId);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Gửi phê duyệt thất bại'); }
  }, [submittingRecord, fetchData, fetchCounts, managingUnitId]);

  const openRejectModal = useCallback((record: BuoyBerth) => {
    setRejectingRecord(record); setRejectReason(''); setRejectError(''); setRejectModalOpen(true);
  }, []);

  const handleConfirmReject = useCallback(async () => {
    if (!rejectingRecord) return;
    const reason = rejectReason.trim();
    if (!reason) { setRejectError('Vui lòng nhập lý do từ chối'); return; }
    if (reason.length < 10) { setRejectError('Lý do từ chối tối thiểu 10 ký tự'); return; }
    if (reason.length > 500) { setRejectError('Lý do từ chối tối đa 500 ký tự'); return; }
    try {
      await buoyBerthApproval.rejectStage(rejectingRecord.id, reason);
      toast.success('Đã từ chối phê duyệt');
      setRejectModalOpen(false);
      setRejectingRecord(null);
      setRejectReason('');
      setRejectError('');
      setSortField('updatedAt');
      setSortOrder('descend');
      setPage(1);
      void fetchData();
      void fetchCounts(managingUnitId);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Từ chối thất bại'); }
  }, [rejectingRecord, rejectReason, fetchData, fetchCounts, managingUnitId]);

  // ── Header actions ──────────────────────────────────────────────
  const headerActions = useMemo(() => {
    const actions: ScreenHeaderAction[] = [];
    if (hasPerm('buoyberth:create')) {
      actions.push({
        key: 'create',
        label: 'Thêm mới',
        variant: 'primary',
        icon: icons.create,
        onClick: () => {
          setEditBuoyBerthId(undefined);
          setEditBaseStatus(undefined);
          setCreateDrawerVisible(true);
        },
      });
    }
    return actions;
  }, [hasPerm]);

  // ── Filter panel content ────────────────────────────────────────
  const filterContent = (
    <>
      <style>{`.buoy-berth-filter .ant-select-selector { border-radius: 999px !important; } .buoy-berth-filter .ant-select-content { flex-wrap: nowrap !important; overflow: hidden; } .buoy-berth-filter .ant-select-content-item { max-width: 45% !important; } .buoy-berth-filter .ant-select-selection-item { border-radius: 999px !important; }`}</style>
      {/* ── Cơ bản: ĐVQL + Tên + Tình trạng ──────────────────── */}
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
          value={managingUnitId}
          onChange={(v) => { setManagingUnitId(v); setPage(1); }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tên bến phao</div>
        <Input
          placeholder="Tìm theo tên bến phao"
          allowClear
          value={filterName}
          onChange={(e) => { setFilterName(e.target.value); setPage(1); }}
          onPressEnter={handleFilterApply}
          style={{ borderRadius: radiusPill, height: 40 }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tình trạng</div>
        <Select
          placeholder="Chọn tình trạng"
          allowClear
          value={filterOperationalStatus}
          onChange={(v) => { setFilterOperationalStatus(v); setPage(1); }}
          options={[
            { value: 'OPERATIONAL', label: 'Đang khai thác/vận hành' },
            { value: 'NOT_YET_OPERATIONAL', label: 'Chưa khai thác/vận hành' },
            { value: 'SUSPENDED', label: 'Dừng khai thác/vận hành' },
          ]}
          style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
        />
      </div>

      {/* ── Nâng cao: đúng các trường CSV đánh dấu Bộ lọc ───────── */}
      {filterCollapsed && (<>
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Mã bến phao</div>
          <Input
            placeholder="Tìm theo mã bến phao"
            allowClear
            value={filterCode}
            onChange={(e) => { setFilterCode(e.target.value); setPage(1); }}
            onPressEnter={handleFilterApply}
            style={{ borderRadius: radiusPill, height: 40 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Thuộc cảng biển</div>
          <Select
            placeholder="Chọn cảng biển"
            allowClear
            showSearch
            optionFilterProp="label"
            value={filterPortId}
            onChange={(v) => { setFilterPortId(v); setPage(1); }}
            options={portOptions}
            style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Thuộc luồng hàng hải</div>
          <Select
            placeholder="Chọn luồng hàng hải"
            allowClear
            showSearch
            optionFilterProp="label"
            value={filterWaterwayId}
            onChange={(v) => { setFilterWaterwayId(v); setPage(1); }}
            options={Array.from(waterwayMap.entries()).map(([id, name]) => ({ value: id, label: name }))}
            filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())}
            style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Phân cấp công trình</div>
          <Select
            placeholder="Chọn phân cấp công trình"
            allowClear
            showSearch
            optionFilterProp="label"
            value={filterClassification}
            onChange={(v) => { setFilterClassification(v); setPage(1); }}
            options={BUOY_BERTH_CLASSIFICATION_OPTIONS}
            style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Địa điểm (Tỉnh/Thành phố)</div>
          <Select
            placeholder="Chọn tỉnh/thành phố"
            allowClear
            showSearch
            filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            value={filterProvince || undefined}
            onChange={(v) => { setFilterProvince(v || ''); setPage(1); }}
            options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))}
            style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Ngày cập nhật</div>
          <DatePicker.RangePicker
            format="DD/MM/YYYY"
            placeholder={['Từ ngày', 'Đến ngày']}
            allowClear
            value={[filterUpdatedFrom ? dayjs(filterUpdatedFrom) : null, filterUpdatedTo ? dayjs(filterUpdatedTo) : null]}
            onChange={(dates) => {
              setFilterUpdatedFrom(dates?.[0] ? dates[0].format('YYYY-MM-DD 00:00:00') : undefined);
              setFilterUpdatedTo(dates?.[1] ? dates[1].format('YYYY-MM-DD 23:59:59') : undefined);
              setPage(1);
            }}
            style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
            {...getRangePickerProps({ width: '100%', borderRadius: radiusPill, height: 40 })}
          />
        </div>

      </>)}
    </>
  );

  // ── Status tabs config ──────────────────────────────────────────
  const statusTabs = TAB_STATUS_LIST.map((tab) => ({
    key: tab.key, label: tab.label, count: tabCounts[tab.key] ?? 0,
    color: tab.color, active: activeTab === tab.key,
  }));

  // ── rowActions callback (Port pattern) ──────────────────────────
  // Thứ tự: Xem chi tiết → Chỉnh sửa → Lịch sử → Phê duyệt/Từ chối → Xóa
  const rowActions = useCallback(
    (record: BuoyBerth) => {
      const actions: any[] = [
        { key: 'view', label: 'Xem chi tiết', icon: icons.view, onClick: () => openDetailDrawer(record) },
      ];
      const st = record.approvalStatus || '';
      const editable = canEditApprovalRecord(record.approvalStatus, { hasPerm, resource: 'buoyberth', extraApprovePerms: ['buoyberth:approve'] });
      if (editable) {
        actions.push({
          key: 'edit',
          label: 'Chỉnh sửa',
          icon: icons.edit,
          onClick: () => {
            setEditBuoyBerthId(record.id);
            setEditBaseStatus(record.approvalStatus);
            setCreateDrawerVisible(true);
          },
        });
      }
      if (['DRAFT', 'NHAP'].includes(st) && hasPerm('buoyberth:update')) {
        actions.push({ key: 'submit', label: 'Gửi Cảng vụ phê duyệt', icon: icons.submit, onClick: () => { setSubmittingRecord(record); setSubmitModalOpen(true); } });
      }
      if (['REJECTED_LEVEL1', 'REJECTED_LEVEL2'].includes(st) && hasPerm('buoyberth:update')) {
        actions.push({ key: 'resubmit', label: 'Gửi lại phê duyệt', icon: icons.submit, onClick: () => { setSubmittingRecord(record); setSubmitModalOpen(true); } });
      }
      if (hasPerm('buoyberth:history')) {
        actions.push({ key: 'history', label: 'Lịch sử', icon: icons.history, onClick: () => openHistory(record) });
      }
      if ((hasPerm('buoyberth:approvec1') || hasPerm('buoyberth:approve')) && st === 'PENDING_APPROVAL') {
        actions.push({
          key: 'approve_c1',
          label: 'Phê duyệt cấp Cảng vụ/Chi cục',
          icon: icons.approve,
          onClick: () => {
            setApprovingRecord(record);
            setApprovalContent('');
            setApproveModalOpen(true);
          },
        });
        actions.push({
          key: 'reject_c1',
          label: 'Từ chối cấp Cảng vụ/Chi cục',
          icon: icons.reject,
          danger: true,
          onClick: () => openRejectModal(record),
        });
      }
      if ((hasPerm('buoyberth:approvec2') || hasPerm('buoyberth:approve')) && st === 'APPROVED_LEVEL1') {
        actions.push({
          key: 'approve_c2',
          label: 'Phê duyệt cấp Cục',
          icon: icons.approve,
          onClick: () => {
            setApprovingRecord(record);
            setApprovalContent('');
            setApproveModalOpen(true);
          },
        });
        actions.push({
          key: 'reject_c2',
          label: 'Từ chối cấp Cục',
          icon: icons.reject,
          danger: true,
          onClick: () => openRejectModal(record),
        });
      }
      if (canDeleteApprovalRecord(record.approvalStatus, { hasPerm, resource: 'buoyberth' })) {
        actions.push({ key: 'delete', label: 'Xóa', icon: icons.delete, danger: true, onClick: () => openDeleteModal(record) });
      }
      return actions;
    },
    [hasPerm, openDetailDrawer, openHistory, openDeleteModal, openRejectModal],
  );

  // ── Table columns (đối chiếu đúng cột CSV) ─────────────────────
  const getSortValue = useCallback((r: any, field: string): string | number => {
    if (field === 'orgUnitId') return resolveOrgLevel2Name(organizations, r.orgUnitId) || orgMap.get(r.orgUnitId || '') || '';
    if (field === 'portId') return r.portName || portMap.get(r.portId) || portOptions.find(o => o.value === r.portId)?.label || r.portId || '';
    if (field === 'waterwayId') return waterwayMap.get(r.waterwayId) ?? r.waterwayId ?? '';
    if (field === 'provinceId') return r.provinceId ? VIETNAM_PROVINCES[r.provinceId - 1] ?? '' : '';
    if (field === 'classification') return BUOY_BERTH_CLASSIFICATION_OPTIONS.find(o => o.value === r.classification)?.label ?? r.classification ?? '';
    if (field === 'operationalStatus') {
      const m: Record<string, string> = {
        OPERATIONAL: 'Đang khai thác/vận hành',
        NOT_YET_OPERATIONAL: 'Chưa khai thác/vận hành',
        SUSPENDED: 'Dừng khai thác/vận hành',
      };
      return m[r.operationalStatus] || r.operationalStatus || '';
    }
    if (field === 'approvalStatus') return APPROVAL_STYLE_MAP[r.approvalStatus]?.label || r.approvalStatus || '';
    if (field === 'updatedAt' || field === 'updatedBy' || field === 'updatedByName') {
      const t = r.updatedAt || r.createdAt;
      return t ? new Date(t).getTime() : 0;
    }
    if (field === 'submittedForApprovalAt') return r.submittedForApprovalAt ? new Date(r.submittedForApprovalAt).getTime() : 0;
    if (field === 'portAuthorityApprovedAt') return r.portAuthorityApprovedAt ? new Date(r.portAuthorityApprovedAt).getTime() : 0;
    if (field === 'departmentApprovedAt') return r.departmentApprovedAt ? new Date(r.departmentApprovedAt).getTime() : 0;
    return r[field] ?? '';
  }, [organizations, orgMap, portOptions, portMap, waterwayMap]);

  const columns = useMemo(() => {
    const baseColumns: any[] = [
      {
        key: 'stt',
        label: 'STT',
        width: 60,
        fixed: 'left' as const,
        align: 'center' as const,
        render: (_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{(page - 1) * pageSize + i + 1}</span>,
      },
      {
        key: 'buoyBerthName',
        label: <span>Tên/Mã bến phao</span>,
        dataIndex: 'buoyBerthName',
        width: 220,
        fixed: 'left' as const,
        sortable: true,
        ellipsis: false,
        render: (v: string, record: BuoyBerth) => (
          <div>
            <a
              title={v || ''}
              onClick={() => openDetailDrawer(record)}
              style={{ ...cellTitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {v || ''}
            </a>
            {record.buoyBerthCode ? (
              <span style={{ ...cellSubtitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {record.buoyBerthCode}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        key: 'orgUnitId',
        label: 'Đơn vị quản lý',
        dataIndex: 'orgUnitId',
        width: 260,
        sortable: true,
        render: (_v: string | null, record: BuoyBerth) => (
          <span style={{ fontWeight: fontWeightBold }}>
            {resolveOrgLevel2Name(organizations, record.orgUnitId) || orgMap.get(record.orgUnitId || '') || record.orgUnitId || ''}
          </span>
        ),
      },
      {
        key: 'portId',
        label: 'Thuộc cảng biển',
        dataIndex: 'portId',
        width: 200,
        sortable: true,
        render: (v: string | null, record: BuoyBerth) => (record.portName || (v ? (portMap.get(v) || portOptions.find(o => o.value === v)?.label || v) : '')),
      },
      {
        key: 'waterwayId',
        label: 'Thuộc luồng hàng hải',
        dataIndex: 'waterwayId',
        width: 280,
        sortable: true,
        ellipsis: true,
        render: (v: string | null) => (v ? (waterwayMap.get(v) || v) : ''),
      },
      {
        key: 'provinceId',
        label: 'Địa điểm (Tỉnh/Thành phố)',
        dataIndex: 'provinceId',
        width: 250,
        sortable: true,
        render: (v: number | null) => (v ? (VIETNAM_PROVINCES[v - 1] || String(v)) : ''),
      },
      {
        key: 'classification',
        label: 'Phân cấp công trình',
        dataIndex: 'classification',
        width: 220,
        sortable: true,
        render: (v: string | null) => <span style={{ fontSize: fontSizeMd }}>{v ? (BUOY_BERTH_CLASSIFICATION_OPTIONS.find(o => o.value === v)?.label || v) : ''}</span>,
      },
      {
        key: 'operationalStatus',
        label: 'Tình trạng',
        dataIndex: 'operationalStatus',
        width: 190,
        sortable: true,
        render: (v: string | null) => {
          if (!v) return '';
          const m: Record<string, { color: string; label: string }> = {
            OPERATIONAL: { color: statusOperational, label: 'Đang khai thác/vận hành' },
            NOT_YET_OPERATIONAL: { color: statusAttention, label: 'Chưa khai thác/vận hành' },
            SUSPENDED: { color: statusCritical, label: 'Dừng khai thác/vận hành' },
          };
          const s = m[v] || { color: textTertiary, label: v };
          return <span style={statusBadgeStyle(s.color)}>{s.label}</span>;
        },
      },
      {
        key: 'approvalStatus',
        label: 'Trạng thái',
        dataIndex: 'approvalStatus',
        width: 260,
        sortable: true,
        render: (v: string | null) => {
          if (!v) return '';
          const s = APPROVAL_STYLE_MAP[v] || APPROVAL_STYLE_MAP[v.toUpperCase()];
          return s ? <span style={statusBadgeStyle(s.color)}>{s.label}</span> : null;
        },
      },
      {
        key: 'updatedAt',
        label: <span>Cán bộ cập nhật</span>,
        dataIndex: 'updatedAt',
        width: 200,
        sortable: true,
        render: (v: string | null, record: BuoyBerth) => {
          const name = userMap.get(record.updatedBy || '') || record.updatedBy || '';
          const date = formatDate(v);
          if (!name && !date) return '';
          return (
            <div>
              {name && <span style={{ fontWeight: fontWeightBold }}>{name}</span>}
              {name && date && <br />}
              {date && <span style={{ opacity: 0.85 }}>{date}</span>}
            </div>
          );
        },
      },
    ];

    // Audit columns — chỉ hiển thị cho Admin Cục / admin-operation (giống Bến cảng)
    const auditColumns: any[] = isAuditViewer ? [
      { key: 'submittedForApprovalAt', label: <span>Cán bộ gửi Phê duyệt</span>, dataIndex: 'submittedForApprovalAt', width: 210, sortable: true,
        render: (v: string | null, record: BuoyBerth) => {
          const name = userMap.get(record.submittedForApprovalBy || '') || record.submittedForApprovalBy || '';
          const date = formatDate(v);
          if (!name && !date) return '';
          return (
            <div>
              {name && <span style={{ fontWeight: fontWeightBold }}>{name}</span>}
              {name && date && <br />}
              {date && <span style={{ opacity: 0.85 }}>{date}</span>}
            </div>
          );
        } },
      { key: 'portAuthorityApprovedAt', label: <span>Cán bộ phê duyệt cấp Cảng vụ/Chi cục</span>, dataIndex: 'portAuthorityApprovedAt', width: 350, sortable: true,
        render: (v: string | null, record: BuoyBerth) => {
          const name = userMap.get(record.portAuthorityApprovedBy || '') || record.portAuthorityApprovedBy || '';
          const date = formatDate(v);
          if (!name && !date) return '';
          return (
            <div>
              {name && <span style={{ fontWeight: fontWeightBold }}>{name}</span>}
              {name && date && <br />}
              {date && <span style={{ opacity: 0.85 }}>{date}</span>}
            </div>
          );
        } },
      { key: 'departmentApprovedAt', label: <span>Cán bộ phê duyệt cấp Cục</span>, dataIndex: 'departmentApprovedAt', width: 260, sortable: true,
        render: (v: string | null, record: BuoyBerth) => {
          const name = userMap.get(record.departmentApprovedBy || '') || record.departmentApprovedBy || '';
          const date = formatDate(v);
          if (!name && !date) return '';
          return (
            <div>
              {name && <span style={{ fontWeight: fontWeightBold }}>{name}</span>}
              {name && date && <br />}
              {date && <span style={{ opacity: 0.85 }}>{date}</span>}
            </div>
          );
        } },
    ] : [];

    const tailColumns: any[] = [];

    const allColumns = [...baseColumns, ...tailColumns, ...auditColumns];
    return allColumns.map(col => ({
      ...col,
      sortOrder: col.sortable ? ((col.key === sortField || col.dataIndex === sortField) ? sortOrder : null) : undefined,
    }));
  }, [
    openDetailDrawer,
    organizations,
    orgMap,
    userMap,
    isAuditViewer,
    page,
    pageSize,
    portOptions,
    portMap,
    waterwayMap,
    sortField,
    sortOrder,
  ]);

  // ── Detail drawer content ────────────────────────────────────────
  const ddToDms = (dd: number): { d: number; m: number; s: number } => {
    if (dd == null || isNaN(dd)) return { d: 0, m: 0, s: 0 };
    const abs = Math.abs(dd);
    const d = Math.floor(abs);
    const m = Math.floor((abs - d) * 60);
    const s = parseFloat(((abs - d - m / 60) * 3600).toFixed(2));
    return { d, m, s };
  };

  const renderDetailContent = () => {
    if (!detailRecord) return null;
    if (detailLoading) return <LoadingSkeleton rows={6} />;
    return (
      <BuoyBerthDetailContent
        selectedRecord={detailRecord}
        orgMap={orgMap}
        organizations={organizations}
        symbolMap={symbolMap}
        symbolImageMap={symbolImageMap}
        portOptions={portOptions}
        waterwayOptions={waterwayOptions}
        waterwayMap={waterwayMap}
        userMap={userMap}
        detailFiles={detailFiles}
        ddToDms={ddToDms}
        approvalStyleMap={APPROVAL_STYLE_MAP}
        infrastructureList={infrastructureList}
        onViewInfraDetail={openInfraDetail}
        operationPlanList={(detailRecord as any)?.operationPlanList}
        maintenancePlanList={(detailRecord as any)?.maintenancePlanList}
        incidentList={(detailRecord as any)?.incidentList}
      />
    );
  };

  // ── JSX ─────────────────────────────────────────────────────────

  return (
    <ThemeTokenProvider tokens={{ ...themeTokenChk, fontSizeMd } as unknown as ThemeToken}>
    <div className="buoy-berth-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <style>{`
        .buoy-berth-page-wrapper,
        .buoy-berth-page-wrapper .ant-table,
        .buoy-berth-page-wrapper .ant-table-cell,
        .buoy-berth-page-wrapper .ant-table-thead > tr > th,
        .buoy-berth-page-wrapper .ant-table-tbody > tr > td,
        .buoy-berth-page-wrapper .ant-input,
        .buoy-berth-page-wrapper .ant-select,
        .buoy-berth-page-wrapper .ant-select-selection-item,
        .buoy-berth-page-wrapper .ant-select-item-option-content,
        .buoy-berth-page-wrapper .ant-picker,
        .buoy-berth-page-wrapper .ant-picker-input > input,
        .buoy-berth-page-wrapper .ant-btn,
        .buoy-berth-page-wrapper .ant-pagination,
        .buoy-berth-page-wrapper .ant-pagination-item,
        .buoy-berth-page-wrapper .ant-pagination-total-text,
        .buoy-berth-page-wrapper .ant-breadcrumb,
        .buoy-berth-page-wrapper .ant-form-item-label > label,
        .buoy-berth-page-wrapper .ant-tabs-tab,
        .buoy-berth-page-wrapper .buoy-berth-drawer-scope,
        .buoy-berth-page-wrapper .buoy-berth-drawer-scope .ant-drawer-content,
        .buoy-berth-page-wrapper .buoy-berth-drawer-scope .ant-tabs-tab,
        .buoy-berth-page-wrapper .buoy-berth-drawer-scope .ant-input,
        .buoy-berth-page-wrapper .buoy-berth-drawer-scope .ant-select,
        .buoy-berth-page-wrapper .buoy-berth-drawer-scope .ant-btn,
        .buoy-berth-page-wrapper .buoy-berth-drawer-scope .ant-table,
        .buoy-berth-page-wrapper .buoy-berth-drawer-scope .ant-table-cell,
        .buoy-berth-page-wrapper .buoy-berth-drawer-scope .ant-table-thead > tr > th,
        .buoy-berth-page-wrapper .buoy-berth-drawer-scope .ant-form-item-label > label {
          font-size: 13.5px !important;
        }
        /* ── Drawer tạo/sửa/chi tiết (antd Drawer render panel ở body portal, ngoài .buoy-berth-page-wrapper) ── */
        .buoy-berth-drawer-scope,
        .buoy-berth-drawer-scope .ant-drawer-content,
        .buoy-berth-drawer-scope .ant-tabs-tab,
        .buoy-berth-drawer-scope .ant-drawer-content .ant-form-item-label > label,
        .buoy-berth-drawer-scope .chk-detail-label,
        .buoy-berth-drawer-scope .chk-detail-value,
        .buoy-berth-drawer-scope .ant-table,
        .buoy-berth-drawer-scope .ant-table-cell,
        .buoy-berth-drawer-scope .ant-table-thead > tr > th,
        .buoy-berth-drawer-scope .ant-table-tbody > tr > td,
        .buoy-berth-drawer-scope .ant-input,
        .buoy-berth-drawer-scope .ant-select,
        .buoy-berth-drawer-scope .ant-btn {
          font-size: 13.5px !important;
        }
        .buoy-berth-page-wrapper div:has(> button[aria-pressed]) {
          display: flex !important;
          flex-wrap: nowrap !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          justify-content: safe center !important;
          align-items: center !important;
          scrollbar-width: thin !important;
          scrollbar-color: #cbd5e1 #f8fafc !important;
          padding: 2px 16px 6px 16px !important;
          gap: 20px !important;
        }
        .buoy-berth-page-wrapper div:has(> button[aria-pressed]) > button {
          white-space: nowrap !important;
          flex-shrink: 0 !important;
          cursor: pointer !important;
        }
        .buoy-berth-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar {
          height: 6px !important;
          display: block !important;
        }
        .buoy-berth-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-track {
          background: #f1f5f9 !important;
          border-radius: 999px !important;
        }
        .buoy-berth-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb {
          background: #cbd5e1 !important;
          border-radius: 999px !important;
        }
        .buoy-berth-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb:hover {
          background: #94a3b8 !important;
        }
        /* ── Responsive Drawers: Không tràn viền khi màn hình nhỏ / zoom cao (đồng bộ Cầu cảng / Cảng biển) ── */
        .buoy-berth-drawer-scope .ant-drawer-content-wrapper {
          max-width: 100vw !important;
        }
        @media (max-width: 1024px) {
          .buoy-berth-drawer-scope .chk-detail-grid {
            grid-template-columns: 1fr !important;
            column-gap: 0 !important;
          }
          .buoy-berth-drawer-scope .chk-detail-row--full {
            grid-column: 1 !important;
          }
        }
        @media (max-width: 640px) {
          .buoy-berth-drawer-scope .chk-detail-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 4px !important;
            padding: 8px 0 !important;
          }
          .buoy-berth-drawer-scope .chk-detail-label {
            width: 100% !important;
          }
          .buoy-berth-drawer-scope .chk-detail-value {
            width: 100% !important;
          }
        }
        /* Label dài (2 dòng) đủ chỗ, KHÔNG mất chữ, label 1 dòng nằm sát đỉnh:
           dành min-height cho khung .ant-form-item-label (chữ label con canh top bằng align-items:flex-start),
           không ép cao lên chính <label> để tránh chữ bị căn giữa lệch dòng trên/dưới. */
        .buoy-berth-drawer-scope .ant-form-item.cn-op-2line-label .ant-form-item-label {
          height: auto !important;
          min-height: 44px !important;
          align-items: flex-start !important;
        }
        .buoy-berth-drawer-scope .ant-form-item.cn-op-2line-label .ant-form-item-label > label {
          height: auto !important;
          white-space: normal !important;
          line-height: 1.45 !important;
          overflow-wrap: break-word;
        }
        .range-single-panel .ant-picker-panel-container .ant-picker-panel:last-child { display: none !important; }
      `}</style>
      <ScreenHeader
        breadcrumb={[{ label: 'Tài sản KCHTGT' }, { label: 'Quản lý bến phao' }]}
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
        <DataTable columns={columns}
          dataSource={[...dataSource].sort((a: any, b: any) => {
            if (!sortField) return 0;
            if (sortField === 'stt' || sortField === 'sequenceNo') {
              const arr = [...dataSource];
              return sortOrder === 'descend' ? (arr.reverse(), 0) : 0;
            }
            const aVal = getSortValue(a, sortField);
            const bVal = getSortValue(b, sortField);
            const cmp = typeof aVal === 'number' && typeof bVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal), 'vi');
            return sortOrder === 'ascend' ? cmp : -cmp;
          })}
          rowKey="id" rowActions={rowActions} loading={false}
          onSort={(key: string, order: 'asc' | 'desc') => { setSortField(key); setSortOrder(order === 'asc' ? 'ascend' : 'descend'); setPage(1); }}
          scroll={{ x: 'max-content' }}
        />
        <Pagination total={total} current={page} pageSize={pageSize}
          onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
        />
      </FilterTableLayout>

      {/* ── Create / Edit Drawer ────────────────────────────────────── */}
      <Drawer
        {...drawerProps}
        rootClassName="buoy-berth-drawer-scope"
        className="buoy-berth-drawer-scope"
        width="min(920px, 96vw)"
        title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>{editBuoyBerthId ? 'Chỉnh sửa thông tin Bến phao' : 'Thêm mới Bến phao'}</span>}
        open={createDrawerVisible}
        destroyOnHidden
        onClose={() => { setCreateDrawerVisible(false); createForm.resetFields(); }}
        afterOpenChange={(open) => { if (!open) { setEditBuoyBerthId(undefined); setEditBaseStatus(undefined); } }}
        extra={<Button type="text" onClick={() => { setCreateDrawerVisible(false); createForm.resetFields(); }} style={drawerCloseBtnStyle}>✕</Button>}
        footer={<div style={drawerFooterStyle}>{(() => {
          const st = !editBuoyBerthId ? 'DRAFT' : (editBaseStatus ? normalizeApprovalStatus(editBaseStatus) : 'DRAFT');
          if (st === 'APPROVED') {
            return (
              <Button
                htmlType="button"
                type="primary"
                onClick={() => { setActionType('approve'); buoyBerthFormRef.current?.submit('APPROVED'); }}
                loading={submitting && actionType === 'approve'}
                style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}
              >
                Lưu và phê duyệt
              </Button>
            );
          }
          if (st === 'REJECTED_LEVEL1' || st === 'REJECTED_LEVEL2') {
            return (
              <Button
                htmlType="button"
                type="primary"
                onClick={() => { setActionType('submit'); buoyBerthFormRef.current?.submit('SUBMIT'); }}
                loading={submitting && actionType === 'submit'}
                style={primaryButtonStyle}
              >
                Lưu và gửi phê duyệt
              </Button>
            );
          }
          // Lưu tạm hoặc tạo mới: 3 nút.
          return (
            <>
              <Button
                htmlType="button"
                onClick={() => { setActionType('draft'); buoyBerthFormRef.current?.submit('DRAFT'); }}
                loading={submitting && actionType === 'draft'}
                style={outlineButtonStyle}
              >
                Lưu tạm
              </Button>
              <Button
                htmlType="button"
                type="primary"
                onClick={() => { setActionType('submit'); buoyBerthFormRef.current?.submit('SUBMIT'); }}
                loading={submitting && actionType === 'submit'}
                style={primaryButtonStyle}
              >
                Lưu và gửi phê duyệt
              </Button>
              <Button
                htmlType="button"
                type="primary"
                onClick={() => { setActionType('approve'); buoyBerthFormRef.current?.submit('APPROVED'); }}
                loading={submitting && actionType === 'approve'}
                style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}
              >
                Lưu và phê duyệt
              </Button>
            </>
          );
        })()}</div>}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px' },
        }}
      >
        <Form form={createForm} layout="vertical">
          <style>{requiredMarkStyle}</style>
          <BuoyBerthForm
            ref={buoyBerthFormRef}
            form={createForm}
            id={editBuoyBerthId}
            onFinish={() => {
              setCreateDrawerVisible(false);
              setSortField('updatedAt');
              setSortOrder('descend');
              setPage(1);
              void fetchData();
              void fetchCounts(managingUnitId);
            }}
            onSubmittingChange={setSubmitting}
          />
        </Form>
      </Drawer>

      {/* ── Detail Drawer ──────────────────────────────────────────── */}
      <AppDrawer
        width={typeof window !== 'undefined' ? Math.min(1000, Math.floor(window.innerWidth * 0.95)) : 1000}
        style={{ maxWidth: '96vw' }}
        rootClassName="buoy-berth-drawer-scope"
        className="buoy-berth-drawer-scope"
        title={<span style={drawerTitleStyle}>Chi tiết bến phao{detailRecord ? ` - ${detailRecord.buoyBerthName}` : ''}</span>}
        open={detailDrawerVisible}
        onClose={() => { setDetailDrawerVisible(false); setDetailRecord(null); setInfrastructureList([]); }}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px', overflow: 'hidden' },
        }}
        footer={null}
      >
        {renderDetailContent()}
      </AppDrawer>

      {/* ── Kết cấu hạ tầng Detail Drawer (Khu neo đậu / Khu tránh, trú bão) — kích thước đồng bộ bằng Drawer cha ── */}
      <AppDrawer
        width={typeof window !== 'undefined' ? Math.min(1000, Math.floor(window.innerWidth * 0.95)) : 1000}
        style={{ maxWidth: '96vw' }}
        rootClassName="buoy-berth-drawer-scope"
        className="buoy-berth-drawer-scope"
        title={<span style={drawerTitleStyle}>
          {(() => {
            const typeLabel = infraDetail?.type === 'ANCHORAGE' ? 'Khu neo đậu' : infraDetail?.type === 'STORM_SHELTER' ? 'Khu tránh, trú bão' : '';
            const name = infraDetail?.record?.anchorageName || infraDetail?.record?.stormShelterName || '';
            return infraDetail ? `Chi tiết kết cấu hạ tầng - ${typeLabel}${name ? ` - ${name}` : ''}` : 'Chi tiết kết cấu hạ tầng';
          })()}
        </span>}
        open={!!infraDetail}
        onClose={() => setInfraDetail(null)}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px' },
        }}
        footer={null}
      >
        {infraDetail?.type === 'ANCHORAGE' && infraDetail.record ? (
          <AnchorageDetailContent
            selectedRecord={infraDetail.record}
            orgMap={orgMap}
            organizations={organizations}
            symbolMap={symbolMap}
            symbolImageMap={symbolImageMap}
            portOptions={portOptions}
            userMap={userMap}
            detailFiles={[]}
            ddToDms={ddToDms}
            approvalStyleMap={APPROVAL_STYLE_MAP}
          />
        ) : infraDetail?.type === 'STORM_SHELTER' && infraDetail.record ? (
          <StormShelterDetailContent
            selectedRecord={infraDetail.record}
            orgMap={orgMap}
            organizations={organizations}
            symbolMap={symbolMap}
            symbolImageMap={symbolImageMap}
            portOptions={portOptions}
            waterwayOptions={waterwayOptions}
            userMap={userMap}
            detailFiles={[]}
            ddToDms={ddToDms}
            approvalStyleMap={APPROVAL_STYLE_MAP}
          />
        ) : null}
      </AppDrawer>

      {/* ── Delete Confirmation Modal ────────────────────────────── */}
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
        itemType="bến phao"
        itemName={deletingRecord?.buoyBerthName}
        itemCode={deletingRecord?.buoyBerthCode}
      />

      {/* ── Reject Reason Modal ──────────────────────────────────── */}
      <Modal
        styles={{ mask: { background: 'rgba(0, 0, 0, 0.4)' } }}
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Từ chối phê duyệt</span>}
        open={rejectModalOpen}
        onCancel={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); setRejectError(''); }}
        footer={[
          <Button key="cancel" onClick={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); setRejectError(''); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="reject" type="primary" danger onClick={handleConfirmReject}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Xác nhận từ chối</Button>,
        ]}
        width={480}>
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>Vui lòng nhập lý do từ chối cho bến phao:</p>
          {rejectingRecord && (
            <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>
              <strong style={{ color: textPrimary }}>{rejectingRecord.buoyBerthCode} — {rejectingRecord.buoyBerthName}</strong>
            </p>
          )}
          <Input.TextArea placeholder="Nhập lý do từ chối (tối thiểu 10, tối đa 500 ký tự)..." value={rejectReason}
            onChange={(e) => { setRejectReason(e.target.value); setRejectError(''); }} rows={3} maxLength={500} showCount
            style={{ borderRadius: 8, fontSize: fontSizeMd, borderColor: rejectError ? statusCritical : undefined }} />
          {rejectError ? <div style={{ marginTop: 4 }}><span style={{ color: statusCritical, fontSize: fontSizeMd }}>{rejectError}</span></div> : null}
        </div>
      </Modal>

      {/* ── Submit Modal ──────────────────────────────────────────── */}
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
        width={480}>
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary }}>
            Gửi <strong>{submittingRecord?.buoyBerthCode} — {submittingRecord?.buoyBerthName}</strong> để Cảng vụ phê duyệt?
          </p>
        </div>
      </Modal>

      {/* ── Approve Modal (chuẩn VTS CHK) ─────────────────────────── */}
      <ApprovalModal
        visible={approveModalOpen}
        level={normalizeApprovalStatus(approvingRecord?.approvalStatus) === 'APPROVED_LEVEL1' ? 'c2' : 'c1'}
        onConfirm={(content) => { if (approvingRecord) handleApprove(approvingRecord, content); }}
        onCancel={() => { setApproveModalOpen(false); setApprovingRecord(null); }}
      />

      {/* ── History drawer (timeline theo chuẩn quản lý Cảng biển) ── */}
      <AppDrawer
        width="min(880px, 96vw)"
        rootClassName="buoy-berth-drawer-scope"
        className="buoy-berth-drawer-scope"
        mask
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Space size={spaceSm} style={{ alignItems: 'center' }}>
              <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
              <span style={drawerTitleStyle}>
                Lịch sử thay đổi — {historyTarget?.buoyBerthName || historyTarget?.buoyBerthCode || ''}
              </span>
              <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeLg - 1, fontWeight: fontWeightBold, background: `${colors.sidebarBg}15`, color: colors.sidebarBg, lineHeight: '20px' }}>
                Tổng cộng {Array.isArray(filteredHistory) ? filteredHistory.length : 0}
              </span>
            </Space>
          </div>
        }
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        footer={null}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '16px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
        }}>
        <style>{`.history-dt-popup .ant-picker-now-btn { color: ${actionPrimary} !important; }`}</style>
        <div style={{ flexShrink: 0 }}>
          {!historyLoading && (
            <div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceMd }}>
              <Input
                placeholder="Tìm kiếm nội dung thay đổi..."
                allowClear
                value={historyFilters.keyword || ''}
                onChange={(e) => setHistoryFilters((p) => ({ ...p, keyword: e.target.value }))}
                style={{ flex: 1, borderRadius: radiusPill, height: 40 }}
              />
              <DatePicker
                placeholder="Từ ngày"
                classNames={{ popup: { root: 'history-dt-popup' } }}
                value={historyFilters.fromDate ? dayjs(historyFilters.fromDate) : null}
                onChange={(d) => setHistoryFilters((p) => ({ ...p, fromDate: d ? d.format('YYYY-MM-DD') : '' }))}
                style={{ width: 140, borderRadius: radiusPill, height: 40 }} format="DD/MM/YYYY"
              />
              <DatePicker
                placeholder="Đến ngày"
                classNames={{ popup: { root: 'history-dt-popup' } }}
                value={historyFilters.toDate ? dayjs(historyFilters.toDate) : null}
                onChange={(d) => setHistoryFilters((p) => ({ ...p, toDate: d ? d.format('YYYY-MM-DD') : '' }))}
                style={{ width: 140, borderRadius: radiusPill, height: 40 }} format="DD/MM/YYYY"
              />
              <Button type="primary" icon={<SearchOutlined />} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}
                onClick={() => { /* Lọc real-time theo từng thao tác nhập/chọn — giống Cảng biển */ }}>
                Tìm kiếm
              </Button>
            </div>
          )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {historyLoading ? (
            <div style={{ padding: `${spaceMd}px 0` }}>
              <LoadingSkeleton rows={5} />
            </div>
          ) : historyRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
              <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
              <div style={{ color: textTertiary, fontSize: fontSizeMd }}>Chưa có thay đổi nào được ghi nhận</div>
            </div>
          ) : hasActiveHistoryFilter && filteredHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
              <SearchOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
              <div style={{ color: textTertiary, fontSize: fontSizeMd }}>Không tìm thấy kết quả phù hợp</div>
            </div>
          ) : (
            renderBuoyBerthHistoryTimeline(filteredHistory)
          )}
        </div>
      </AppDrawer>
    </div>
    </ThemeTokenProvider>
  );
}

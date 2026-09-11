/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Button, Modal, Input, Select, DatePicker,
  Drawer, Space, Typography, Form,
} from 'antd';
import {
  FileOutlined,
  HistoryOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { transferAreaCRUD, transferAreaApproval, portCRUD } from '../../services/portService';
import type { TransferArea } from '../../types/port';
import { AppDrawer } from '../../components/shared/AppDrawer';
import { organizationService } from '../../services/organizationService';
import { FilterOrgUnitTreeSelect, resolveOrgLevel2Name, resolveDefaultOrgUnitId } from '../../components/org-unit';
import { symbolService } from '../../services/symbolService';
import api from '../../services/api';
import { userService } from '../../services/userService';
import type { Organization } from '../../services/organizationService';
import { usePermissionStore } from '../../store/permissionStore';
import { VIETNAM_PROVINCES } from '../../types/common';
import { ScreenHeader, DataTable } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import toast from '../../components/ToastNotification';
import TransferAreaForm from './TransferAreaForm';
import TransferAreaDetailContent from './TransferAreaDetailContent';
import { ThemeTokenProvider, type ThemeToken } from '../../context/ThemeTokenContext';
import { canEditApprovalRecord, canDeleteApprovalRecord, normalizeApprovalStatus } from '../../utils/approvalEditPolicy';
import ApprovalModal from '../../components/shared/ApprovalModal';
import DeleteConfirmModal from '../../components/shared/DeleteConfirmModal';
import * as themeTokenChk from '../../themetokenchk';
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
import { formatHistoryNumber } from '../../utils/numFmt';
import { renderStandardHistoryCards, isBlankOrDash } from '../../utils/changeHistoryRenderer';

// ── Cỡ chữ 13.5px đồng bộ chuẩn VTS CHK (theo PierListPage / PortListPage) ──
const fontSizeMd = 13.5;

const APPROVAL_STYLE_MAP: Record<string, { color: string; label: string }> = {
  NHAP: { color: statusDraft, label: 'Lưu tạm' },
  DRAFT: { color: statusDraft, label: 'Lưu tạm' },
  PENDING: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  CHO_PHE_DUYET: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  PROPOSED: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  PENDING_APPROVAL: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  APPROVED_LEVEL1: { color: statusAttention, label: 'Chờ phê duyệt cấp cục' },
  APPROVED_LEVEL2: { color: statusOperational, label: 'Đã phê duyệt' },
  APPROVED: { color: statusOperational, label: 'Đã phê duyệt' },
  DA_PHE_DUYET: { color: statusOperational, label: 'Đã phê duyệt' },
  REJECTED: { color: statusCritical, label: 'Từ chối cấp Cảng vụ/Chi cục' },
  TU_CHOI: { color: statusCritical, label: 'Từ chối cấp Cảng vụ/Chi cục' },
  REJECTED_LEVEL1: { color: statusCritical, label: 'Từ chối cấp Cảng vụ/Chi cục' },
  REJECTED_LEVEL2: { color: statusCritical, label: 'Từ chối cấp cục' },
};

const OPERATIONAL_STYLE_MAP: Record<string, { color: string; label: string }> = {
  OPERATIONAL: { color: statusOperational, label: 'Đang khai thác/vận hành' },
  NOT_YET_OPERATIONAL: { color: statusAttention, label: 'Chưa khai thác/vận hành' },
  SUSPENDED: { color: statusCritical, label: 'Dừng khai thác/vận hành' },
  HIEN_HANH: { color: statusOperational, label: 'Hiện hành' },
  TAM_NGUNG: { color: statusCritical, label: 'Tạm ngừng' },
  DANG_KHAI_THAC: { color: statusOperational, label: 'Đang khai thác/vận hành' },
  CHUA_KHAI_THAC: { color: statusAttention, label: 'Chưa khai thác/vận hành' },
  DUNG_KHAI_THAC: { color: statusCritical, label: 'Dừng khai thác/vận hành' },
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

const OPERATIONAL_FUNCTIONS_OPTIONS = [
  { value: 'CONTAINER', label: 'Hàng Container' },
  { value: 'GENERAL_CARGO', label: 'Hàng tổng hợp (Bách hóa)' },
  { value: 'BULK_CARGO', label: 'Hàng chuyên dụng hàng rời, quặng' },
  { value: 'OIL_GAS', label: 'Hàng chuyên dụng xăng dầu, khí hóa lỏng' },
  { value: 'OTHER', label: 'Hàng chuyên dụng khác (dịch vụ, đóng, sửa chữa tàu...)' },
  { value: 'PASSENGER', label: 'Hành khách' },
];

const OPERATIONAL_FUNCTIONS_LABEL_MAP: Record<string, string> = {
  CONTAINER: 'Hàng Container',
  GENERAL_CARGO: 'Hàng tổng hợp (Bách hóa)',
  BULK_CARGO: 'Hàng chuyên dụng hàng rời, quặng',
  OIL_GAS: 'Hàng chuyên dụng xăng dầu, khí hóa lỏng',
  OTHER: 'Hàng chuyên dụng khác (dịch vụ, đóng, sửa chữa tàu...)',
  PASSENGER: 'Hành khách',
};

function formatOperationalFunctions(v?: string | null): string {
  if (!v) return '';
  const parts = v.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return '';
  return parts.map((code) => OPERATIONAL_FUNCTIONS_LABEL_MAP[code] || code).join(', ');
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '';
  try { return dayjs(d).format('DD/MM/YYYY HH:mm:ss'); } catch { return d; }
}

const EXCLUDED_CHANGE_FIELDS = new Set([
  'id',
  'createdAt',
  'updatedAt',
  'createdBy',
  'updatedBy',
  'submittedForApprovalAt',
  'submittedForApprovalBy',
  'portAuthorityApprovedAt',
  'portAuthorityApprovedBy',
  'departmentApprovedAt',
  'departmentApprovedBy',
  'portAuthorityApprovalContent',
  'departmentApprovalContent',
  'rejectionReason',
  'attachments',
  'spatialId',
  'Thời điểm gửi phê duyệt',
  'Người gửi phê duyệt',
  'Thời điểm Cảng vụ phê duyệt',
  'Cán bộ Cảng vụ phê duyệt',
  'Thời điểm Cục phê duyệt',
  'Cán bộ Cục phê duyệt',
  'Nội dung Cảng vụ phê duyệt',
  'Nội dung Cục phê duyệt',
  'Lý do từ chối',
  'Vị trí không gian',
]);

const NUMERIC_HISTORY_FIELDS = new Set([
  'area',
  'designWaterDepth',
  'currentWaterDepth',
  'bottomElevationDesign',
  'maxVesselDWT',
  'activeTransferCount',
  'publishedTransferCount',
  'underInvestmentTransferCount',
  'Diện tích (ha)',
  'Độ sâu thiết kế',
  'Độ sâu hiện tại',
  'Cao trình đáy thiết kế',
  'Trọng tải tàu lớn nhất (DWT)',
  'Số vị trí đang khai thác',
  'Số vị trí công bố',
  'Số vị trí thỏa thuận đầu tư',
]);

const histLabels: Record<string, string> = {
  transferAreaCode: 'Mã khu chuyển tải',
  transferAreaName: 'Tên khu chuyển tải',
  portId: 'Thuộc cảng biển',
  orgUnitId: 'Đơn vị quản lý',
  provinceId: 'Địa điểm (Tỉnh/Thành Phố)',
  province: 'Địa điểm (Tỉnh/Thành Phố)',
  detailedLocation: 'Địa điểm chi tiết',
  operationalFunctions: 'Công năng khai thác',
  operationalStatus: 'Tình trạng',
  approvalStatus: 'Trạng thái',
  shapeDescription: 'Hình dạng',
  area: 'Diện tích (ha)',
  designWaterDepth: 'Độ sâu thiết kế',
  currentWaterDepth: 'Độ sâu hiện tại',
  bottomElevationDesign: 'Cao trình đáy thiết kế',
  maxVesselDWT: 'Trọng tải tàu lớn nhất (DWT)',
  activeTransferCount: 'Số vị trí đang khai thác',
  publishedTransferCount: 'Số vị trí công bố',
  underInvestmentTransferCount: 'Số vị trí thỏa thuận đầu tư',
  remarks: 'Ghi chú',
  openingAnnouncementDate: 'Ngày công bố',
  publicDecision: 'Quyết định công bố',
  investmentAgreement: 'Thỏa thuận đầu tư',
  activityStartDate: 'Thời gian hoạt động từ',
  activityEndDate: 'Thời gian hoạt động đến',
  coordinateSystem: 'Hệ quy chiếu',
  displayRule: 'Quy tắc hiển thị',
  mapSymbolId: 'Biểu tượng',
  mooringWaterAreas: 'Phạm vi khu nước neo buộc tàu',
  'Khu nước neo buộc tàu': 'Phạm vi khu nước neo buộc tàu',
  'Phạm vi khu nước neo buộc tàu': 'Phạm vi khu nước neo buộc tàu',
  'Tọa độ GIS': 'Tọa độ GPS',
  'Tọa độ GPS': 'Tọa độ GPS',
  'Loại đối tượng GIS': 'Loại đối tượng',
  'Tài liệu đính kèm': 'File đính kèm',
  'File đính kèm': 'File đính kèm',
  attachments: 'File đính kèm',
  spatialId: 'Vị trí không gian',
  'Trạng thái': 'Trạng thái',
  submittedForApprovalAt: 'Thời điểm gửi phê duyệt',
  submittedForApprovalBy: 'Người gửi phê duyệt',
  portAuthorityApprovedAt: 'Thời điểm Cảng vụ phê duyệt',
  portAuthorityApprovedBy: 'Cán bộ Cảng vụ phê duyệt',
  departmentApprovedAt: 'Thời điểm Cục phê duyệt',
  departmentApprovedBy: 'Cán bộ Cục phê duyệt',
  portAuthorityApprovalContent: 'Nội dung Cảng vụ phê duyệt',
  departmentApprovalContent: 'Nội dung Cục phê duyệt',
  rejectionReason: 'Lý do từ chối',
  // Backward compatibility:
  'Cảng biển': 'Thuộc cảng biển',
  'Tỉnh/Thành phố': 'Địa điểm (Tỉnh/Thành Phố)',
  'Biểu tượng bản đồ': 'Biểu tượng',
};

function histField(fn: string): string { return histLabels[fn] || fn; }

function histVal(
  fn: string,
  val: string | null,
  orgMap?: Map<string, string>,
  symbolMap?: Map<string, string>,
  portMap?: Map<string, string>,
): string {
  if (!val || val === '(null)' || val === 'null' || val === '-' || val === '—' || val === '–') return '';
  const v = val.trim();
  if (fn === 'operationalFunctions') return formatOperationalFunctions(v);
  if ((fn === 'orgUnitId' || fn === 'Đơn vị quản lý') && orgMap) {
    const f = orgMap.get(v);
    return f ? f.split(' - ').pop() || f : v;
  }
  if ((fn === 'portId' || fn === 'Thuộc cảng biển' || fn === 'Cảng biển') && portMap) return portMap.get(v) || v;
  if ((fn === 'mapSymbolId' || fn === 'Biểu tượng' || fn === 'Biểu tượng bản đồ') && symbolMap) return symbolMap.get(v) || v;
  if (fn === 'approvalStatus' || fn === 'Trạng thái' || fn === 'Trạng thái phê duyệt') {
    const m: Record<string, string> = {
      DRAFT: 'Lưu tạm',
      PENDING: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
      PENDING_APPROVAL: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
      CHO_PHE_DUYET: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
      APPROVED_LEVEL1: 'Chờ phê duyệt cấp cục',
      APPROVED: 'Đã phê duyệt',
      DA_PHE_DUYET: 'Đã phê duyệt',
      APPROVED_LEVEL2: 'Đã phê duyệt',
      REJECTED: 'Từ chối cấp Cảng vụ/Chi cục',
      REJECTED_LEVEL1: 'Từ chối cấp Cảng vụ/Chi cục',
      REJECTED_LEVEL2: 'Từ chối cấp cục',
      TU_CHOI: 'Từ chối cấp Cảng vụ/Chi cục',
    };
    return m[v.toUpperCase()] || v;
  }
  if (fn === 'operationalStatus' || fn === 'Tình trạng' || fn === 'Tình trạng hoạt động') {
    const m: Record<string, string> = {
      OPERATIONAL: 'Đang khai thác/vận hành',
      NOT_YET_OPERATIONAL: 'Chưa khai thác/vận hành',
      SUSPENDED: 'Dừng khai thác/vận hành',
      HIEN_HANH: 'Hiện hành',
      TAM_NGUNG: 'Tạm ngừng',
      DANG_KHAI_THAC: 'Đang khai thác/vận hành',
      CHUA_KHAI_THAC: 'Chưa khai thác/vận hành',
      DUNG_KHAI_THAC: 'Dừng khai thác/vận hành',
    };
    return m[v.toUpperCase()] || v;
  }
  if (fn === 'provinceId' || fn === 'province' || fn === 'Địa điểm (Tỉnh/Thành Phố)' || fn === 'Địa điểm (Tỉnh/Thành phố)' || fn === 'Tỉnh/Thành phố') {
    const num = Number(v);
    if (!isNaN(num) && num >= 1 && num <= VIETNAM_PROVINCES.length) {
      return VIETNAM_PROVINCES[num - 1];
    }
    return v;
  }
  if (fn === 'geometryType' || fn === 'Loại đối tượng' || fn === 'Loại đối tượng GIS') {
    const m: Record<string, string> = {
      POINT: 'Điểm',
      LINE: 'Đường',
      POLYGON: 'Vùng',
    };
    return m[v.toUpperCase()] || v;
  }
  if (fn === 'coordinateSystem' || fn === 'Hệ quy chiếu') {
    const m: Record<string, string> = { '1': 'WGS-84', '2': 'VN-2000' };
    return m[v] || v;
  }
  if (fn.endsWith('At') || fn.endsWith('Date') || fn.includes('Thời điểm') || fn.includes('Ngày') || fn.includes('Thời gian')) {
    try {
      let d = dayjs(v);
      if (!d.isValid()) { d = dayjs(v.replace(/\.\d+$/, '')); }
      return d.isValid() ? (fn.includes('openingAnnouncementDate') || fn.includes('activityStartDate') || fn.includes('activityEndDate') || fn.includes('Ngày') || fn.includes('Thời gian') ? d.format('DD/MM/YYYY') : d.format('DD/MM/YYYY HH:mm')) : v;
    } catch { return v; }
  }
  return v;
}



export default function TransferAreaListPage() {
  const [searchParams] = useSearchParams();
  const linkedAction = searchParams.get('action');
  const linkedRecordId = searchParams.get('id');
  const isEmbeddedAction = window.self !== window.top
    && (linkedAction === 'detail' || linkedAction === 'edit')
    && !!linkedRecordId;

  const hasPerm = usePermissionStore((s: any) => s.hasPermission);
  const defaultOrgUnitRef = useRef<string | undefined>(undefined);
  const [orgUnit, setOrgUnit] = useState<string | undefined>(undefined);
  const [nameInput, setNameInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [filterPortId, setFilterPortId] = useState<string | undefined>();
  const [portOptions, setPortOptions] = useState<{ value: string; label: string }[]>([]);
  const [filterProvince, setFilterProvince] = useState<string | undefined>();
  const [filterOperationalStatus, setFilterOperationalStatus] = useState<string | undefined>();
  const [filterOperationalFunctions, setFilterOperationalFunctions] = useState<string | undefined>();
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState<string | undefined>();
  const [filterUpdatedTo, setFilterUpdatedTo] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState('all');
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<TransferArea[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [, setError] = useState<Error | null>(null);
  const [sortField, setSortField] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend'>('descend');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
  const [symbolMap, setSymbolMap] = useState<Map<string, string>>(new Map());
  const [symbolImageMap, setSymbolImageMap] = useState<Map<string, string>>(new Map());

  const orgMap = useMemo(() => {
    const m = new Map<string, string>();
    organizations.forEach(o => m.set(o.id, o.name));
    return m;
  }, [organizations]);

  const portMap = useMemo(() => {
    const m = new Map<string, string>();
    portOptions.forEach((o) => m.set(o.value, o.label));
    return m;
  }, [portOptions]);

  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
  const [createDrawerVisible, setCreateDrawerVisible] = useState(false);
  const [editTransferAreaId, setEditTransferAreaId] = useState<string | undefined>();
  const [editBaseStatus, setEditBaseStatus] = useState<string | undefined>();
  const [createForm] = Form.useForm();
  const transferAreaFormRef = useRef<any>(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [detailRecord, setDetailRecord] = useState<TransferArea | null>(null);
  const [detailFiles, setDetailFiles] = useState<any[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<TransferArea | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRecord, setRejectingRecord] = useState<TransferArea | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submittingRecord, setSubmittingRecord] = useState<TransferArea | null>(null);
  const [actionType, setActionType] = useState<'draft' | 'submit' | 'approve' | 'update'>('draft');
  const [submitting, setSubmitting] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvingRecord, setApprovingRecord] = useState<TransferArea | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<TransferArea | null>(null);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilters, setHistoryFilters] = useState<{ keyword: string; fromDate?: string; toDate?: string }>({ keyword: '' });

  const filteredHistory = useMemo(() => {
    const q = (historyFilters.keyword || '').trim().toLowerCase();
    const from = historyFilters.fromDate || '';
    const to = historyFilters.toDate || '';
    return (Array.isArray(historyRecords) ? historyRecords : []).filter((r: any) => {
      const fn = String(r?.fieldName || r?.changedField || '').trim();
      if (EXCLUDED_CHANGE_FIELDS.has(fn)) return false;
      if (q) {
        const label = histField(fn) || fn;
        const rawHits = [fn, label, r?.oldValue, r?.newValue, r?.previousValue, r?.value, r?.reason, r?.ghiChu, r?.note]
          .filter((v) => v !== null && v !== undefined)
          .map((v) => String(v).toLowerCase());
        const resolvedOld = histVal(fn, r?.oldValue, orgMap, symbolMap, portMap);
        const resolvedNew = histVal(fn, r?.newValue, orgMap, symbolMap, portMap);
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
  }, [historyRecords, historyFilters, orgMap, symbolMap, portMap]);

  const hasActiveHistoryFilter = !!(historyFilters.keyword?.trim() || historyFilters.fromDate || historyFilters.toDate);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const openHistory = useCallback(async (r: TransferArea) => {
    setHistoryTarget(r);
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryRecords([]);
    setHistoryFilters({ keyword: '' });
    try {
      const res = await api.get(`/v1/transfer-area/${r.id}/history`);
      const d = res.data?.data;
      setHistoryRecords(Array.isArray(d?.changeHistory) ? d.changeHistory.filter((row: any) => row.fieldName !== 'CREATE') : []);
    } catch {
      toast.error('Không thể tải lịch sử');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const HISTORY_FIELD_ORDER = [
    'orgUnitId', 'portId', 'transferAreaCode', 'transferAreaName', 'operationalFunctions',
    'operationalStatus', 'provinceId', 'province', 'detailedLocation', 'shapeDescription', 'area',
    'designWaterDepth', 'currentWaterDepth', 'bottomElevationDesign', 'maxVesselDWT',
    'activeTransferCount', 'publishedTransferCount', 'underInvestmentTransferCount',
    'remarks', 'openingAnnouncementDate', 'publicDecision', 'investmentAgreement',
    'activityStartDate', 'activityEndDate', 'coordinateSystem', 'displayRule', 'mapSymbolId',
    'Phạm vi khu nước neo buộc tàu', 'Khu nước neo buộc tàu', 'Tọa độ GPS', 'Tọa độ GIS', 'Loại đối tượng', 'Loại đối tượng GIS', 'Tài liệu đính kèm',
    // Vietnamese label aliases:
    'Đơn vị quản lý', 'Thuộc cảng biển', 'Cảng biển', 'Mã khu chuyển tải', 'Tên khu chuyển tải',
    'Công năng khai thác', 'Tình trạng', 'Địa điểm (Tỉnh/Thành Phố)', 'Tỉnh/Thành phố',
    'Địa điểm chi tiết', 'Hình dạng', 'Diện tích (ha)', 'Độ sâu thiết kế', 'Độ sâu hiện tại',
    'Cao trình đáy thiết kế', 'Trọng tải tàu lớn nhất (DWT)', 'Số vị trí đang khai thác',
    'Số vị trí công bố', 'Số vị trí thỏa thuận đầu tư', 'Ghi chú', 'Ngày công bố',
    'Quyết định công bố', 'Thỏa thuận đầu tư', 'Thời gian hoạt động từ', 'Thời gian hoạt động đến',
    'Hệ quy chiếu', 'Quy tắc hiển thị', 'Biểu tượng', 'Biểu tượng bản đồ',
  ];

  const renderTransferAreaHistoryTimeline = (records: any[]) => {
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
        if (fn === 'operationalFunctions' && raw) {
          return formatOperationalFunctions(raw);
        }
        const resolved = histVal(fn, raw, orgMap, symbolMap, portMap);
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

  useEffect(() => {
    (async () => {
      try {
        const r = await organizationService.list({ pageSize: 1000 });
        const data = r.data || [];
        setOrganizations(data);
        if (data.length > 0) {
          try {
            const p = await api.get('/users/me');
            const uOrgId = (p.data?.data ?? p.data)?.orgUnitId;
            const matchedOrgId = uOrgId ? (data.find((o: any) => o.id === uOrgId) ? uOrgId : data[0].id) : '__all__';
            setOrgUnit(matchedOrgId);
            defaultOrgUnitRef.current = matchedOrgId;
          } catch {
            setOrgUnit(data[0].id);
            defaultOrgUnitRef.current = data[0].id;
          }
        }
      } catch {
        /* ignore */
      }
    })();
    (async () => {
      try {
        const r = await userService.list({ pageSize: 1000 });
        const u = r.data || (r as any).content || [];
        const m = new Map<string, string>();
        u.forEach((x: any) => m.set(x.id, x.fullName || x.username || x.id));
        setUserMap(m);
      } catch {
        /* ignore */
      }
    })();
    (async () => {
      try {
        const r = await symbolService.list({ page: 1, pageSize: 1000, status: 'active' });
        const s = r.data || (r as any).content || [];
        const m = new Map<string, string>();
        const imgMap = new Map<string, string>();
        s.forEach((x: any) => {
          const imgUrl = x.image
            ? (x.image.startsWith('data:') || x.image.startsWith('http') ? x.image : `data:image/png;base64,${x.image}`)
            : '';
          if (x.id) {
            m.set(x.id, x.name);
            if (imgUrl) imgMap.set(x.id, imgUrl);
          }
          if (x.code) {
            m.set(x.code, x.name);
            if (imgUrl) imgMap.set(x.code, imgUrl);
          }
        });
        setSymbolMap(m);
        setSymbolImageMap(imgMap);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  useEffect(() => {
    if (orgUnit !== undefined && !initialLoadDone) {
      setInitialLoadDone(true);
    }
  }, [orgUnit, initialLoadDone]);

  useEffect(() => {
    (async () => {
      try {
        const p: any = { page: 1, pageSize: 1000 };
        if (orgUnit && orgUnit !== '__all__') p.orgUnitId = orgUnit;
        const r = await portCRUD.search(p);
        setPortOptions((r.data || []).map((x: any) => ({ value: x.id, label: x.portName })));
      } catch {
        /* ignore */
      }
    })();
  }, [orgUnit]);

  const fetchCounts = useCallback(async (oid: string | undefined) => {
    try {
      const rs = await Promise.allSettled(
        TAB_STATUS_LIST.map((t) =>
          t.key === 'all'
            ? transferAreaCRUD.search({
                orgUnitId: oid && oid !== '__all__' ? oid : undefined,
                page: 1,
                pageSize: 1,
              })
            : transferAreaCRUD.search({
                approvalStatus: TAB_QUERY_MAP[t.key],
                orgUnitId: oid && oid !== '__all__' ? oid : undefined,
                page: 1,
                pageSize: 1,
              }),
        ),
      );
      const c: Record<string, number> = {};
      let childSum = 0;
      rs.forEach((r, i) => {
        const k = TAB_STATUS_LIST[i]?.key || 'all';
        const count = r.status === 'fulfilled' ? r.value.total : 0;
        c[k] = count;
        if (k !== 'all') childSum += count;
      });
      c['all'] = childSum;
      setTabCounts(c);
    } catch {
      /* ignore */
    }
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setError(null);
    try {
      const provinceIdx = filterProvince ? VIETNAM_PROVINCES.indexOf(filterProvince) + 1 : undefined;
      const r = await transferAreaCRUD.search({
        orgUnitId: orgUnit && orgUnit !== '__all__' ? orgUnit : undefined,
        transferAreaName: nameInput.trim() || undefined,
        transferAreaCode: codeInput.trim() || undefined,
        portId: filterPortId || undefined,
        provinceId: provinceIdx && provinceIdx > 0 ? provinceIdx : undefined,
        operationalStatus: filterOperationalStatus,
        approvalStatus: TAB_QUERY_MAP[activeTab],
        operationalFunctions: filterOperationalFunctions || undefined,
        updatedFrom: filterUpdatedFrom,
        updatedTo: filterUpdatedTo,
        page,
        pageSize,
      });
      const mapped = (r.data || []).map((item: any) => ({
        ...item,
        province: item.province || (item.provinceId ? VIETNAM_PROVINCES[Number(item.provinceId) - 1] : '') || '',
      }));
      setDataSource(mapped);
      setTotal(r.total);
    } catch (ex: unknown) {
      setIsError(true);
      setError(ex instanceof Error ? ex : new Error('Không thể tải danh sách khu chuyển tải'));
    } finally {
      setIsLoading(false);
    }
  }, [
    orgUnit,
    nameInput,
    codeInput,
    filterPortId,
    filterProvince,
    filterOperationalStatus,
    activeTab,
    filterOperationalFunctions,
    filterUpdatedFrom,
    filterUpdatedTo,
    page,
    pageSize,
  ]);

  useEffect(() => {
    if (initialLoadDone) void fetchData();
  }, [fetchData, initialLoadDone]);

  useEffect(() => {
    void fetchCounts(orgUnit);
  }, [orgUnit, fetchCounts]);

  const handleFilterApply = useCallback(() => {
    setPage(1);
    void fetchData();
  }, [fetchData]);

  const handleFilterReset = useCallback(() => {
    const oid = defaultOrgUnitRef.current || '__all__';
    setOrgUnit(oid);
    setNameInput('');
    setCodeInput('');
    setFilterPortId(undefined);
    setFilterProvince(undefined);
    setFilterOperationalStatus(undefined);
    setFilterOperationalFunctions(undefined);
    setFilterUpdatedFrom(undefined);
    setFilterUpdatedTo(undefined);
    setActiveTab('all');
    setPage(1);
  }, []);

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key);
    setPage(1);
  }, []);

  const openDetailDrawer = useCallback(async (record: TransferArea) => {
    setDetailDrawerVisible(true);
    setDetailRecord(record);
    setDetailFiles([]);
    try {
      const r = await api.get(`/v1/transfer-area/${record.id}/attachments`);
      setDetailFiles(r.data?.data || []);
    } catch {
      setDetailFiles([]);
    }
    try {
      const fresh = await transferAreaCRUD.findById(record.id);
      setDetailRecord(fresh);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!isEmbeddedAction || !linkedRecordId) return;
    let cancelled = false;
    transferAreaCRUD.findById(linkedRecordId)
      .then((record) => {
        if (cancelled) return;
        if (linkedAction === 'detail') {
          void openDetailDrawer(record);
        } else {
          setEditTransferAreaId(linkedRecordId);
          setEditBaseStatus(record.approvalStatus);
          setCreateDrawerVisible(true);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) toast.error(error instanceof Error ? error.message : 'Không tải được chi tiết khu chuyển tải');
      });
    return () => { cancelled = true; };
  }, [isEmbeddedAction, linkedAction, linkedRecordId, openDetailDrawer]);

  const notifyEmbeddedActionClosed = useCallback(() => {
    if (isEmbeddedAction) {
      window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, window.location.origin);
    }
  }, [isEmbeddedAction]);

  const closeFormDrawer = useCallback(() => {
    setCreateDrawerVisible(false);
    createForm.resetFields();
    notifyEmbeddedActionClosed();
  }, [createForm, notifyEmbeddedActionClosed]);

  const closeDetailDrawer = useCallback(() => {
    setDetailDrawerVisible(false);
    setDetailRecord(null);
    notifyEmbeddedActionClosed();
  }, [notifyEmbeddedActionClosed]);

  const ddToDms = (dd: number): { d: number; m: number; s: number } => {
    if (dd == null || isNaN(dd)) return { d: 0, m: 0, s: 0 };
    const abs = Math.abs(dd);
    const d = Math.floor(abs);
    const m = Math.floor((abs - d) * 60);
    const s = parseFloat(((abs - d - m / 60) * 3600).toFixed(2));
    return { d, m, s };
  };

  const openDeleteModal = useCallback((record: TransferArea) => {
    setDeletingRecord(record);
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingRecord) return;
    setDeleteLoading(true);
    try {
      await transferAreaCRUD.delete(deletingRecord.id);
      toast.success('Đã xóa khu chuyển tải');
      setDeleteModalOpen(false);
      setDeletingRecord(null);
      setSortField('updatedAt');
      setSortOrder('descend');
      setPage(1);
      void fetchData();
      void fetchCounts(orgUnit);
    } catch (ex: unknown) {
      toast.error(ex instanceof Error ? ex.message : 'Xóa thất bại');
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingRecord, fetchData, fetchCounts, orgUnit]);

  const handleApprove = useCallback(async (record: TransferArea, content?: string) => {
    try {
      if (record.approvalStatus === 'APPROVED_LEVEL1') {
        await transferAreaApproval.approveC2(record.id, content);
      } else {
        await transferAreaApproval.approveC1(record.id, content);
      }
      toast.success(record.approvalStatus === 'APPROVED_LEVEL1' ? 'Đã phê duyệt cấp Cục' : 'Đã phê duyệt cấp Cảng vụ/Chi cục');
      setApproveModalOpen(false);
      setApprovingRecord(null);
      setSortField('updatedAt');
      setSortOrder('descend');
      setPage(1);
      void fetchData();
      void fetchCounts(orgUnit);
    } catch (ex: unknown) {
      toast.error(ex instanceof Error ? ex.message : 'Phê duyệt thất bại');
    }
  }, [fetchData, fetchCounts, orgUnit]);

  const handleSubmitApproval = useCallback((record: TransferArea) => {
    setSubmittingRecord(record);
    setSubmitModalOpen(true);
  }, []);

  const confirmSubmitApproval = useCallback(async () => {
    if (!submittingRecord) return;
    try {
      await transferAreaCRUD.update({ id: submittingRecord.id, saveAction: 'SUBMIT' } as any);
      toast.success('Đã gửi phê duyệt');
      setSubmitModalOpen(false);
      setSubmittingRecord(null);
      setSortField('updatedAt');
      setSortOrder('descend');
      setPage(1);
      void fetchData();
      void fetchCounts(orgUnit);
    } catch (ex: unknown) {
      toast.error(ex instanceof Error ? ex.message : 'Gửi thất bại');
    }
  }, [submittingRecord, fetchData, fetchCounts, orgUnit]);

  const openRejectModal = useCallback((record: TransferArea) => {
    setRejectingRecord(record);
    setRejectReason('');
    setRejectError('');
    setRejectModalOpen(true);
  }, []);

  const handleConfirmReject = useCallback(async () => {
    if (!rejectingRecord) return;
    if (!rejectReason || !rejectReason.trim()) {
      setRejectError('Vui lòng nhập lý do từ chối');
      return;
    }
    try {
      await transferAreaApproval.rejectStage(rejectingRecord.id, rejectReason.trim(), rejectingRecord.approvalStatus);
      toast.success('Từ chối thành công');
      setRejectModalOpen(false);
      setRejectingRecord(null);
      setRejectReason('');
      setRejectError('');
      setSortField('updatedAt');
      setSortOrder('descend');
      setPage(1);
      void fetchData();
      void fetchCounts(orgUnit);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
    }
  }, [rejectingRecord, rejectReason, fetchData, fetchCounts, orgUnit]);

  const headerActions = useMemo(() => {
    const actions: any[] = [];
    if (hasPerm('transferarea:create')) {
      actions.push({
        key: 'create',
        label: 'Thêm mới',
        icon: icons.create,
        variant: 'primary',
        onClick: () => {
          setEditTransferAreaId(undefined);
          setEditBaseStatus(undefined);
          createForm.resetFields();
          setCreateDrawerVisible(true);
        },
      });
    }
    return actions;
  }, [hasPerm, createForm]);

  const rowActions = useCallback(
    (record: TransferArea) => {
      const actions: any[] = [
        { key: 'view', label: 'Xem chi tiết', icon: icons.view, onClick: () => openDetailDrawer(record) },
      ];
      const st = record.approvalStatus || '';
      const editable = canEditApprovalRecord(record.approvalStatus, { hasPerm, resource: 'transferarea', extraApprovePerms: ['transferarea:approve'] });
      if (editable) {
        actions.push({
          key: 'edit',
          label: 'Chỉnh sửa',
          icon: icons.edit,
          onClick: () => {
            setEditTransferAreaId(record.id);
            setEditBaseStatus(record.approvalStatus);
            setCreateDrawerVisible(true);
          },
        });
      }
      if (['DRAFT', 'NHAP'].includes(st) && hasPerm('transferarea:update')) {
        actions.push({ key: 'submit', label: 'Gửi Cảng vụ phê duyệt', icon: icons.submit, onClick: () => handleSubmitApproval(record) });
      }
      if (['REJECTED_LEVEL1', 'REJECTED_LEVEL2'].includes(st) && hasPerm('transferarea:update')) {
        actions.push({ key: 'resubmit', label: 'Gửi lại phê duyệt', icon: icons.submit, onClick: () => handleSubmitApproval(record) });
      }
      if (hasPerm('transferarea:history')) {
        actions.push({ key: 'history', label: 'Lịch sử', icon: icons.history, onClick: () => openHistory(record) });
      }
      if (hasPerm('transferarea:approvec1') && st === 'PENDING_APPROVAL') {
        actions.push({
          key: 'approve_c1',
          label: 'Phê duyệt cấp Cảng vụ/Chi cục',
          icon: icons.approve,
          onClick: () => { setApprovingRecord(record); setApproveModalOpen(true); },
        });
        actions.push({
          key: 'reject_c1',
          label: 'Từ chối cấp Cảng vụ/Chi cục',
          icon: icons.reject,
          danger: true,
          onClick: () => openRejectModal(record),
        });
      }
      if (hasPerm('transferarea:approvec2') && st === 'APPROVED_LEVEL1') {
        actions.push({
          key: 'approve_c2',
          label: 'Phê duyệt cấp Cục',
          icon: icons.approve,
          onClick: () => { setApprovingRecord(record); setApproveModalOpen(true); },
        });
        actions.push({
          key: 'reject_c2',
          label: 'Từ chối cấp Cục',
          icon: icons.reject,
          danger: true,
          onClick: () => openRejectModal(record),
        });
      }
      if (canDeleteApprovalRecord(record.approvalStatus, { hasPerm, resource: 'transferarea', extraDeletePerms: ['pier:delete', 'port:delete'] })) {
        actions.push({
          key: 'delete',
          label: 'Xóa',
          icon: icons.delete,
          danger: true,
          onClick: () => openDeleteModal(record),
        });
      }
      return actions;
    },
    [hasPerm, openDetailDrawer, openHistory, handleSubmitApproval, openRejectModal, openDeleteModal]
  );

  const auditColumns = useMemo(() => {
    return [
      {
        label: 'Cán bộ gửi Phê duyệt',
        dataIndex: 'submittedForApprovalAt',
        key: 'submittedForApprovalAt',
        width: 230,
        sortable: true,
        render: (v: string | null, record: TransferArea) => {
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
        },
      },
      {
        label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục',
        dataIndex: 'portAuthorityApprovedAt',
        key: 'portAuthorityApprovedAt',
        width: 350,
        sortable: true,
        render: (v: string | null, record: TransferArea) => {
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
        },
      },
      {
        label: 'Cán bộ phê duyệt cấp Cục',
        dataIndex: 'departmentApprovedAt',
        key: 'departmentApprovedAt',
        width: 260,
        sortable: true,
        render: (v: string | null, record: TransferArea) => {
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
        },
      },
    ];
  }, [userMap]);

  const getSortValue = useCallback((r: any, field: string): string | number => {
    if (field === 'orgUnitId') return resolveOrgLevel2Name(organizations, r.orgUnitId) || orgMap.get(r.orgUnitId || '') || r.orgUnitName || '';
    if (field === 'transferAreaName') return r.transferAreaName ?? '';
    if (field === 'transferAreaCode') return r.transferAreaCode ?? '';
    if (field === 'portId') return portMap.get(r.portId) ?? r.portName ?? r.portId ?? '';
    if (field === 'province' || field === 'provinceId') return r.province || (r.provinceId ? VIETNAM_PROVINCES[Number(r.provinceId) - 1] : '') || '';
    if (field === 'operationalFunctions') return formatOperationalFunctions(r.operationalFunctions);
    if (field === 'operationalStatus') {
      return OPERATIONAL_STYLE_MAP[r.operationalStatus]?.label || r.operationalStatus || '';
    }
    if (field === 'updatedAt' || field === 'updatedBy' || field === 'updatedByName') {
      const t = r.updatedAt || r.createdAt;
      return t ? new Date(t).getTime() : 0;
    }
    if (field === 'submittedForApprovalAt') return r.submittedForApprovalAt ? new Date(r.submittedForApprovalAt).getTime() : 0;
    if (field === 'portAuthorityApprovedAt') return r.portAuthorityApprovedAt ? new Date(r.portAuthorityApprovedAt).getTime() : 0;
    if (field === 'departmentApprovedAt') return r.departmentApprovedAt ? new Date(r.departmentApprovedAt).getTime() : 0;
    return r[field] ?? '';
  }, [portMap, organizations, orgMap, userMap]);

  const columns = useMemo(() => {
    const baseColumns: any[] = [
      {
        label: 'STT',
        key: 'stt',
        width: 60,
        fixed: 'left' as const,
        align: 'center' as const,
        render: (_: any, __: any, i: number) => (
          <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{(page - 1) * pageSize + i + 1}</span>
        ),
      },
      {
        label: <span>Tên/Mã khu chuyển tải</span>,
        dataIndex: 'transferAreaName',
        key: 'transferAreaName',
        width: 240,
        fixed: 'left' as const,
        sortable: true,
        ellipsis: false,
        render: (v: string, record: TransferArea) => (
          <div>
            <a
              title={v || ''}
              onClick={(e) => {
                e.stopPropagation();
                openDetailDrawer(record);
              }}
              style={{ ...cellTitleStyle, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
            >
              {v || ''}
            </a>
            <span style={{ ...cellSubtitleStyle, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {record.transferAreaCode || ''}
            </span>
          </div>
        ),
      },
      {
        label: 'Đơn vị quản lý',
        dataIndex: 'orgUnitId',
        key: 'orgUnitId',
        width: 260,
        sortable: true,
        render: (v: string | null, r: TransferArea) => (
          <span style={{ fontWeight: fontWeightBold }}>
            {resolveOrgLevel2Name(organizations, r.orgUnitId) || orgMap.get(v || '') || ''}
          </span>
        ),
      },
      {
        label: 'Thuộc cảng biển',
        dataIndex: 'portId',
        key: 'portId',
        width: 200,
        sortable: true,
        render: (v: string) => (
          <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{portMap.get(v || '') || v || ''}</span>
        ),
      },
      {
        label: 'Địa điểm (Tỉnh/Thành phố)',
        dataIndex: 'province',
        key: 'province',
        width: 250,
        sortable: true,
        render: (v?: string, r?: any) => (
          <span style={{ fontSize: fontSizeMd, color: textPrimary }}>
            {v || (r?.provinceId ? VIETNAM_PROVINCES[Number(r.provinceId) - 1] : '') || ''}
          </span>
        ),
      },
      {
        label: 'Công năng khai thác',
        dataIndex: 'operationalFunctions',
        key: 'operationalFunctions',
        width: 240,
        ellipsis: true,
        sortable: true,
        render: (v?: string) => (
          <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{formatOperationalFunctions(v)}</span>
        ),
      },
      {
        label: 'Tình trạng',
        dataIndex: 'operationalStatus',
        key: 'operationalStatus',
        width: 240,
        ellipsis: false,
        sortable: true,
        render: (v: string) => {
          const b = v && OPERATIONAL_STYLE_MAP[v];
          return b ? <span style={statusBadgeStyle(b.color)}>{b.label}</span> : null;
        },
      },
      {
        label: 'Trạng thái',
        dataIndex: 'approvalStatus',
        key: 'approvalStatus',
        width: 320,
        ellipsis: false,
        sortable: true,
        render: (v: string) => {
          const s = v && (APPROVAL_STYLE_MAP[v] || APPROVAL_STYLE_MAP[v.toUpperCase()]);
          return s ? <span style={statusBadgeStyle(s.color)}>{s.label}</span> : null;
        },
      },
      {
        label: 'Cán bộ cập nhật',
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        width: 200,
        sortable: true,
        render: (v: string, record: TransferArea) => (
          <div>
            <span style={{ fontWeight: fontWeightBold }}>{userMap.get(record.updatedBy || '') || record.updatedBy || ''}</span>
            <br />
            <span style={{ opacity: 0.85 }}>{formatDate(v)}</span>
          </div>
        ),
      },
    ];

    const allColumns = [...baseColumns, ...auditColumns];
    return allColumns.map((col) => ({
      ...col,
      sortOrder: col.sortable ? ((col.key === sortField || col.dataIndex === sortField) ? sortOrder : null) : undefined,
    }));
  }, [
    page,
    pageSize,
    sortField,
    sortOrder,
    openDetailDrawer,
    organizations,
    orgMap,
    portMap,
    userMap,
    auditColumns,
  ]);

  const sortedDataSource = useMemo(() => {
    if (!sortField) return dataSource;
    if (sortField === 'stt') {
      return sortOrder === 'descend' ? [...dataSource].reverse() : [...dataSource];
    }
    return [...dataSource].sort((a, b) => {
      const av = getSortValue(a, sortField);
      const bv = getSortValue(b, sortField);
      const c = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av ?? '').localeCompare(String(bv ?? ''), 'vi');
      return sortOrder === 'ascend' ? c : -c;
    });
  }, [dataSource, sortField, sortOrder, getSortValue]);

  const filterContent = (
    <>
      <style>{`
        .transfer-area-filter .ant-select-selector { border-radius: 999px !important; }
        .transfer-area-filter .ant-select-content { flex-wrap: nowrap !important; overflow: hidden; }
        .transfer-area-filter .ant-select-content-item { max-width: 45% !important; }
        .transfer-area-filter .ant-select-selection-item { border-radius: 999px !important; }
      `}</style>
      <div style={{ marginBottom: 12, marginTop: spaceMd }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
          Đơn vị quản lý
        </div>
        <FilterOrgUnitTreeSelect
          organizations={organizations}
          placeholder="Tất cả"
          allowClear
          value={orgUnit}
          onChange={(v) => { setOrgUnit(v); setPage(1); }}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
          Tên khu chuyển tải
        </div>
        <Input
          style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
          placeholder="Tìm theo tên khu chuyển tải"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onPressEnter={handleFilterApply}
          allowClear
          prefix={<SearchOutlined style={{ color: textTertiary }} />}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
          Tình trạng
        </div>
        <Select
          style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
          placeholder="Chọn tình trạng"
          allowClear
          value={filterOperationalStatus}
          onChange={(v) => setFilterOperationalStatus(v)}
          options={[
            { value: 'OPERATIONAL', label: 'Đang khai thác/vận hành' },
            { value: 'NOT_YET_OPERATIONAL', label: 'Chưa khai thác/vận hành' },
            { value: 'SUSPENDED', label: 'Dừng khai thác/vận hành' },
          ]}
        />
      </div>
      {filterCollapsed && (
        <>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
              Thuộc cảng biển
            </div>
            <Select
              style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
              placeholder="Chọn cảng biển"
              allowClear
              showSearch
              value={filterPortId}
              onChange={(v) => setFilterPortId(v)}
              options={portOptions}
              filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
              Mã khu chuyển tải
            </div>
            <Input
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
              placeholder="Tìm theo mã khu chuyển tải"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              onPressEnter={handleFilterApply}
              allowClear
              prefix={<SearchOutlined style={{ color: textTertiary }} />}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
              Công năng khai thác
            </div>
            <Select
              className="transfer-area-filter"
              style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Chọn công năng khai thác"
              options={OPERATIONAL_FUNCTIONS_OPTIONS}
              value={filterOperationalFunctions}
              onChange={(v) => setFilterOperationalFunctions(v)}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
              Địa điểm (Tỉnh/Thành phố)
            </div>
            <Select
              style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
              placeholder="Chọn tỉnh/thành phố"
              allowClear
              showSearch
              value={filterProvince}
              onChange={(v) => setFilterProvince(v)}
              filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())}
              options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
              Ngày cập nhật
            </div>
            <DatePicker.RangePicker
              {...getRangePickerProps({ width: '100%', borderRadius: radiusPill, height: 40 })}
              allowClear
              value={[filterUpdatedFrom ? dayjs(filterUpdatedFrom) : null, filterUpdatedTo ? dayjs(filterUpdatedTo) : null]}
              onChange={(dates) => {
                setFilterUpdatedFrom(dates?.[0] ? dates[0].startOf('day').format('YYYY-MM-DD 00:00:00') : undefined);
                setFilterUpdatedTo(dates?.[1] ? dates[1].endOf('day').format('YYYY-MM-DD 23:59:59') : undefined);
                setPage(1);
              }}
            />
          </div>
        </>
      )}
    </>
  );

  return (
    <ThemeTokenProvider tokens={{ ...themeTokenChk, fontSizeMd: 13.5 } as unknown as ThemeToken}>
      <div className="transfer-area-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <style>{`
          .transfer-area-page-wrapper,
          .transfer-area-page-wrapper .ant-table,
          .transfer-area-page-wrapper .ant-table-cell,
          .transfer-area-page-wrapper .ant-table-thead > tr > th,
          .transfer-area-page-wrapper .ant-table-tbody > tr > td,
          .transfer-area-page-wrapper .ant-input,
          .transfer-area-page-wrapper .ant-select,
          .transfer-area-page-wrapper .ant-select-selection-item,
          .transfer-area-page-wrapper .ant-select-item-option-content,
          .transfer-area-page-wrapper .ant-picker,
          .transfer-area-page-wrapper .ant-picker-input > input,
          .transfer-area-page-wrapper .ant-btn,
          .transfer-area-page-wrapper .ant-pagination,
          .transfer-area-page-wrapper .ant-pagination-item,
          .transfer-area-page-wrapper .ant-pagination-total-text,
          .transfer-area-page-wrapper .ant-breadcrumb,
          .transfer-area-page-wrapper .ant-form-item-label > label,
          .transfer-area-page-wrapper .ant-tabs-tab,
          .transfer-area-page-wrapper .transfer-area-drawer-scope,
          .transfer-area-page-wrapper .transfer-area-drawer-scope .ant-drawer-content,
          .transfer-area-page-wrapper .transfer-area-drawer-scope .ant-tabs-tab,
          .transfer-area-page-wrapper .transfer-area-drawer-scope .ant-input,
          .transfer-area-page-wrapper .transfer-area-drawer-scope .ant-select,
          .transfer-area-page-wrapper .transfer-area-drawer-scope .ant-btn,
          .transfer-area-page-wrapper .transfer-area-drawer-scope .ant-table,
          .transfer-area-page-wrapper .transfer-area-drawer-scope .ant-table-cell,
          .transfer-area-page-wrapper .transfer-area-drawer-scope .ant-table-thead > tr > th,
          .transfer-area-page-wrapper .transfer-area-drawer-scope .ant-form-item-label > label {
            font-size: 13.5px !important;
          }
          /* ── Drawer tạo/sửa/chi tiết (antd Drawer render panel ở body portal, ngoài .transfer-area-page-wrapper) ── */
          .transfer-area-drawer-scope,
          .transfer-area-drawer-scope .ant-drawer-content,
          .transfer-area-drawer-scope .ant-tabs-tab,
          .transfer-area-drawer-scope .ant-drawer-content .ant-form-item-label > label,
          .transfer-area-drawer-scope .chk-detail-label,
          .transfer-area-drawer-scope .chk-detail-value,
          .transfer-area-drawer-scope .ant-table,
          .transfer-area-drawer-scope .ant-table-cell,
          .transfer-area-drawer-scope .ant-table-thead > tr > th,
          .transfer-area-drawer-scope .ant-table-tbody > tr > td,
          .transfer-area-drawer-scope .ant-input,
          .transfer-area-drawer-scope .ant-select,
          .transfer-area-drawer-scope .ant-btn {
            font-size: 13.5px !important;
          }
          .transfer-area-page-wrapper div:has(> button[aria-pressed]) {
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
          .transfer-area-page-wrapper div:has(> button[aria-pressed]) > button {
            white-space: nowrap !important;
            flex-shrink: 0 !important;
            cursor: pointer !important;
          }
          .transfer-area-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar {
            height: 6px !important;
            display: block !important;
          }
          .transfer-area-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-track {
            background: #f1f5f9 !important;
            border-radius: 999px !important;
          }
          .transfer-area-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb {
            background: #cbd5e1 !important;
            border-radius: 999px !important;
          }
          .transfer-area-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb:hover {
            background: #94a3b8 !important;
          }
          .transfer-area-drawer-scope .ant-drawer-content-wrapper {
            max-width: 100vw !important;
          }
          @media (max-width: 1024px) {
            .transfer-area-drawer-scope .chk-detail-grid {
              grid-template-columns: 1fr !important;
              column-gap: 0 !important;
            }
            .transfer-area-drawer-scope .chk-detail-row--full {
              grid-column: 1 !important;
            }
          }
          @media (max-width: 640px) {
            .transfer-area-drawer-scope .chk-detail-row {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 4px !important;
              padding: 8px 0 !important;
            }
            .transfer-area-drawer-scope .chk-detail-label {
              width: 100% !important;
            }
            .transfer-area-drawer-scope .chk-detail-value {
              width: 100% !important;
            }
          }
          .transfer-area-drawer-scope .ant-form-item.cn-op-2line-label .ant-form-item-label {
            height: auto !important;
            min-height: 44px !important;
            align-items: flex-start !important;
          }
          .transfer-area-drawer-scope .ant-form-item.cn-op-2line-label .ant-form-item-label > label {
            height: auto !important;
            white-space: normal !important;
            line-height: 1.45 !important;
            overflow-wrap: break-word;
          }
        `}</style>
        <ScreenHeader
          breadcrumb={[{ label: 'Tài sản KCHTGT' }, { label: 'Quản lý khu chuyển tải' }]}
          actions={headerActions}
        />
        <FilterTableLayout
          filterContent={filterContent}
          statusTabs={TAB_STATUS_LIST.map((t) => ({
            key: t.key,
            label: t.label,
            color: t.color,
            count: tabCounts[t.key] ?? 0,
            active: activeTab === t.key,
          }))}
          onStatusTabChange={handleTabChange}
          onFilterApply={handleFilterApply}
          onFilterReset={handleFilterReset}
          filterCollapsed={filterCollapsed}
          onToggleCollapse={() => setFilterCollapsed(!filterCollapsed)}
          loading={isLoading}
          error={isError}
          onRetry={() => void fetchData()}
        >
          <DataTable
            columns={columns}
            dataSource={sortedDataSource}
            rowKey="id"
            rowActions={rowActions}
            loading={false}
            onSort={(k: string, o: 'asc' | 'desc') => {
              setSortField(k);
              setSortOrder(o === 'asc' ? 'ascend' : 'descend');
              setPage(1);
            }}
            scroll={{ x: 'max-content' }}
          />
          <Pagination
            total={total}
            current={page}
            pageSize={pageSize}
            onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
          />
        </FilterTableLayout>

        {/* ── Single Create / Edit Drawer (Merged pattern from PierListPage) ── */}
        <Drawer
          {...drawerProps}
          rootClassName="transfer-area-drawer-scope"
          className="transfer-area-drawer-scope"
          size={1000}
          width="min(1000px, 96vw)"
          title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>{editTransferAreaId ? 'Chỉnh sửa thông tin Khu chuyển tải' : 'Thêm mới Khu chuyển tải'}</span>}
          open={createDrawerVisible}
          destroyOnClose
          onClose={closeFormDrawer}
          afterOpenChange={(open) => {
            if (!open) {
              setEditTransferAreaId(undefined);
              setEditBaseStatus(undefined);
            }
          }}
          extra={<Button type="text" onClick={closeFormDrawer} style={drawerCloseBtnStyle}>✕</Button>}
          footer={
            <div style={drawerFooterStyle}>
              {(() => {
                const st = !editTransferAreaId ? 'DRAFT' : (editBaseStatus ? normalizeApprovalStatus(editBaseStatus) : 'DRAFT');
                if (st === 'APPROVED') {
                  return (
                    <Button
                      htmlType="button"
                      type="primary"
                      onClick={() => { setActionType('approve'); transferAreaFormRef.current?.submit('APPROVED'); }}
                      loading={submitting && actionType === 'approve'}
                      style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}
                    >
                      Lưu và phê duyệt
                    </Button>
                  );
                }
                if (st === 'REJECTED_LEVEL1' || st === 'REJECTED_LEVEL2' || st.startsWith('REJECTED')) {
                  return (
                    <Button
                      htmlType="button"
                      type="primary"
                      onClick={() => { setActionType('submit'); transferAreaFormRef.current?.submit('SUBMIT'); }}
                      loading={submitting && actionType === 'submit'}
                      style={primaryButtonStyle}
                    >
                      Lưu và gửi phê duyệt
                    </Button>
                  );
                }
                return (
                  <>
                    <Button
                      htmlType="button"
                      onClick={() => { setActionType('draft'); transferAreaFormRef.current?.submit('DRAFT'); }}
                      loading={submitting && actionType === 'draft'}
                      style={outlineButtonStyle}
                    >
                      Lưu tạm
                    </Button>
                    <Button
                      htmlType="button"
                      type="primary"
                      onClick={() => { setActionType('submit'); transferAreaFormRef.current?.submit('SUBMIT'); }}
                      loading={submitting && actionType === 'submit'}
                      style={primaryButtonStyle}
                    >
                      Lưu và gửi phê duyệt
                    </Button>
                    <Button
                      htmlType="button"
                      type="primary"
                      onClick={() => { setActionType('approve'); transferAreaFormRef.current?.submit('APPROVED'); }}
                      loading={submitting && actionType === 'approve'}
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
        >
          <Form form={createForm} layout="vertical">
            <style>{requiredMarkStyle}</style>
            <TransferAreaForm
              ref={transferAreaFormRef}
              form={createForm}
              id={editTransferAreaId}
              onFinish={() => {
                closeFormDrawer();
                setSortField('updatedAt');
                setSortOrder('descend');
                setPage(1);
                void fetchData();
                void fetchCounts(orgUnit);
              }}
              onSubmittingChange={setSubmitting}
            />
          </Form>
        </Drawer>

        {/* ── Detail Drawer (1000px width matching Pier Detail) ── */}
        <Drawer
          {...drawerProps}
          rootClassName="transfer-area-drawer-scope"
          className="transfer-area-drawer-scope"
          size={1000}
          width="min(1000px, 96vw)"
          title={<span style={drawerTitleStyle}>Chi tiết khu chuyển tải{detailRecord ? ` - ${detailRecord.transferAreaName}` : ''}</span>}
          open={detailDrawerVisible}
          onClose={closeDetailDrawer}
          extra={<Button type="text" onClick={closeDetailDrawer} style={drawerCloseBtnStyle}>✕</Button>}
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '0 24px 12px 24px' },
          }}
          footer={null}
        >
          {detailRecord && (
            <TransferAreaDetailContent
              selectedRecord={detailRecord}
              orgMap={orgMap}
              organizations={organizations}
              symbolMap={symbolMap}
              symbolImageMap={symbolImageMap}
              portOptions={portOptions}
              portMap={portMap}
              userMap={userMap}
              detailFiles={detailFiles}
              ddToDms={ddToDms}
              approvalStyleMap={APPROVAL_STYLE_MAP}
              operationalStyleMap={OPERATIONAL_STYLE_MAP}
              operationPlanList={(detailRecord as any)?.operationPlanList}
              maintenancePlanList={(detailRecord as any)?.maintenancePlanList}
              incidentList={(detailRecord as any)?.incidentList}
            />
          )}
        </Drawer>

        {/* ── DeleteConfirmModal (Shared component) ── */}
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
          itemType="khu chuyển tải"
          itemName={deletingRecord?.transferAreaName}
          itemCode={deletingRecord?.transferAreaCode}
        />

        {/* ── Reject Modal ── */}
        <Modal
          styles={{ mask: { background: 'rgba(0, 0, 0, 0.4)' } }}
          title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Từ chối phê duyệt</span>}
          open={rejectModalOpen}
          onCancel={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); setRejectError(''); }}
          footer={[
            <Button
              key="cancel"
              onClick={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); setRejectError(''); }}
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}
            >
              Hủy
            </Button>,
            <Button
              key="reject"
              type="primary"
              danger
              onClick={handleConfirmReject}
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
            >
              Xác nhận từ chối
            </Button>,
          ]}
          width={480}
        >
          <div style={{ padding: '8px 0' }}>
            <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>Vui lòng nhập lý do từ chối cho khu chuyển tải:</p>
            {rejectingRecord && (
              <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>
                <strong style={{ color: textPrimary }}>{rejectingRecord.transferAreaCode} — {rejectingRecord.transferAreaName}</strong>
              </p>
            )}
            <Input.TextArea
              placeholder="Nhập lý do từ chối..."
              value={rejectReason}
              onChange={(e) => { setRejectReason(e.target.value); setRejectError(''); }}
              rows={3}
              maxLength={500}
              style={{ borderRadius: 8, fontSize: fontSizeMd, borderColor: rejectError ? statusCritical : undefined }}
            />
            {rejectError ? <div style={{ marginTop: 4 }}><span style={{ color: statusCritical, fontSize: fontSizeMd }}>{rejectError}</span></div> : null}
          </div>
        </Modal>

        {/* ── Submit Approval Modal ── */}
        <Modal
          styles={{ mask: { background: 'rgba(0, 0, 0, 0.4)' } }}
          title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Gửi phê duyệt</span>}
          open={submitModalOpen}
          onCancel={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }}
          footer={[
            <Button
              key="cancel"
              onClick={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }}
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}
            >
              Hủy
            </Button>,
            <Button
              key="submit"
              type="primary"
              onClick={confirmSubmitApproval}
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}
            >
              Xác nhận
            </Button>,
          ]}
          width={480}
        >
          <div style={{ padding: '8px 0' }}>
            <p style={{ fontSize: fontSizeMd, color: textPrimary }}>
              Xác nhận gửi phê duyệt khu chuyển tải <strong>{submittingRecord?.transferAreaName}</strong>?
            </p>
          </div>
        </Modal>

        {/* ── Approval Modal (Shared component) ── */}
        <ApprovalModal
          visible={approveModalOpen}
          level={approvingRecord?.approvalStatus === 'APPROVED_LEVEL1' ? 'c2' : 'c1'}
          onConfirm={(content) => { if (approvingRecord) handleApprove(approvingRecord, content); }}
          onCancel={() => { setApproveModalOpen(false); setApprovingRecord(null); }}
        />

        {/* ── History Drawer (Timeline matching Pier / Port standard) ── */}
        <AppDrawer
          width="min(880px, 96vw)"
          rootClassName="transfer-area-drawer-scope"
          className="transfer-area-drawer-scope"
          mask
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Space size={spaceSm} style={{ alignItems: 'center' }}>
                <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
                <span style={drawerTitleStyle}>
                  Lịch sử thay đổi — {historyTarget?.transferAreaName || historyTarget?.transferAreaCode || ''}
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
          }}
        >
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
                  style={{ width: 140, borderRadius: radiusPill, height: 40 }}
                  format="DD/MM/YYYY"
                />
                <DatePicker
                  placeholder="Đến ngày"
                  classNames={{ popup: { root: 'history-dt-popup' } }}
                  value={historyFilters.toDate ? dayjs(historyFilters.toDate) : null}
                  onChange={(d) => setHistoryFilters((p) => ({ ...p, toDate: d ? d.format('YYYY-MM-DD') : '' }))}
                  style={{ width: 140, borderRadius: radiusPill, height: 40 }}
                  format="DD/MM/YYYY"
                />
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}
                  onClick={() => {}}
                >
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
              renderTransferAreaHistoryTimeline(filteredHistory)
            )}
          </div>
        </AppDrawer>
      </div>
    </ThemeTokenProvider>
  );
}
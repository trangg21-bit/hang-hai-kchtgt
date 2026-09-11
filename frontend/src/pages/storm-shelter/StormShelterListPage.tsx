import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Button, Modal, Input, Select, DatePicker,
  Drawer, Space, Typography, Form,
} from 'antd';
import {
  HistoryOutlined,
  SearchOutlined,
  FileOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { stormShelterCRUD, stormShelterApproval, portCRUD, buoyBerthCRUD } from '../../services/portService';
import type { StormShelterArea } from '../../types/port';
import { AppDrawer } from '../../components/shared/AppDrawer';
import { organizationService } from '../../services/organizationService';
import { FilterOrgUnitTreeSelect, resolveOrgLevel2Name, resolveDefaultOrgUnitId } from '../../components/org-unit';
import { navigationChannelCRUD } from '../../services/navigationChannelService';
import { symbolService } from '../../services/symbolService';
import api from '../../services/api';
import { userService } from '../../services/userService';
import type { Organization } from '../../services/organizationService';
import { usePermissionStore } from '../../store/permissionStore';
import { useAuthStore } from '../../store/authStore';
import { VIETNAM_PROVINCES } from '../../types/common';
import { ScreenHeader, DataTable } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import toast from '../../components/ToastNotification';
import StormShelterForm, { STORM_SHELTER_CLASSIFICATION_OPTIONS } from './StormShelterForm';
import StormShelterDetailContent from './StormShelterDetailContent';
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

// Cỡ chữ 13.5px đồng bộ chuẩn VTS CHK toàn bộ cell/table/input/button
const fontSizeMd = 13.5;

const APPROVAL_STYLE_MAP: Record<string, { color: string; label: string }> = {
  NHAP: { color: statusDraft, label: 'Lưu tạm' }, DRAFT: { color: statusDraft, label: 'Lưu tạm' },
  PENDING: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  CHO_PHE_DUYET: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  PENDING_APPROVAL: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  PROPOSED: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
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
  'infrastructureList',
  'Danh sách hạ tầng',
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
  'activeStormShelterCount',
  'publishedStormShelterCount',
  'underInvestmentStormShelterCount',
  'Diện tích (ha)',
  'Độ sâu khu nước theo thiết kế (m)',
  'Độ sâu khu nước hiện tại (m)',
  'Cao độ đáy bến thiết kế',
  'Cỡ tàu lớn nhất (DWT)',
  'Số lượng khu đang khai thác',
  'Số lượng khu đã công bố',
  'Số lượng khu đang thỏa thuận đầu tư',
  // Backward compatibility aliases:
  'Độ sâu theo thiết kế (m)',
  'Độ sâu hiện tại (m)',
  'Cỡ tàu khai thác (DWT)',
  'Số khu đang khai thác',
  'Số khu đã công bố',
  'Số khu thỏa thuận đầu tư',
]);

const histLabels: Record<string, string> = {
  stormShelterCode: 'Mã khu tránh, trú bão',
  stormShelterName: 'Tên khu tránh, trú bão',
  portId: 'Thuộc cảng biển',
  orgUnitId: 'Đơn vị quản lý',
  navigationChannelId: 'Thuộc luồng hàng hải',
  buoyStationId: 'Thuộc bến phao',
  classification: 'Phân loại',
  provinceId: 'Địa điểm (Tỉnh/Thành Phố)',
  province: 'Địa điểm (Tỉnh/Thành Phố)',
  detailedLocation: 'Địa điểm chi tiết',
  operationalStatus: 'Tình trạng',
  approvalStatus: 'Trạng thái',
  shapeDescription: 'Hình dạng',
  area: 'Diện tích (ha)',
  designWaterDepth: 'Độ sâu khu nước theo thiết kế (m)',
  currentWaterDepth: 'Độ sâu khu nước hiện tại (m)',
  bottomElevationDesign: 'Cao độ đáy bến thiết kế',
  maxVesselDWT: 'Cỡ tàu lớn nhất (DWT)',
  activeStormShelterCount: 'Số lượng khu đang khai thác',
  publishedStormShelterCount: 'Số lượng khu đã công bố',
  underInvestmentStormShelterCount: 'Số lượng khu đang thỏa thuận đầu tư',
  remarks: 'Ghi chú',
  openingAnnouncementDate: 'Thời điểm công bố mở',
  publicDecision: 'Quyết định công bố',
  investmentAgreement: 'Thỏa thuận đầu tư xây dựng',
  mapSymbolId: 'Biểu tượng',
  coordinateSystem: 'Hệ quy chiếu',
  displayRule: 'Quy tắc hiển thị',
  spatialId: 'Vị trí không gian',
  'Trạng thái': 'Trạng thái',
  'Trạng thái phê duyệt': 'Trạng thái',
  'Tọa độ GIS': 'Tọa độ GPS',
  'Tọa độ GPS': 'Tọa độ GPS',
  'Loại đối tượng GIS': 'Loại đối tượng',
  'Loại đối tượng': 'Loại đối tượng',
  'Phạm vi khu nước neo buộc tàu': 'Phạm vi khu nước neo buộc tàu',
  'Khu nước neo buộc tàu': 'Phạm vi khu nước neo buộc tàu',
  'Danh sách khu nước neo buộc tàu': 'Phạm vi khu nước neo buộc tàu',
  'Tài liệu đính kèm': 'File đính kèm',
  'File đính kèm': 'File đính kèm',
  attachments: 'File đính kèm',
  infrastructureList: 'Danh sách hạ tầng',
  submittedForApprovalAt: 'Thời điểm gửi phê duyệt',
  submittedForApprovalBy: 'Người gửi phê duyệt',
  portAuthorityApprovedAt: 'Thời điểm Cảng vụ phê duyệt',
  portAuthorityApprovedBy: 'Cán bộ Cảng vụ phê duyệt',
  departmentApprovedAt: 'Thời điểm Cục phê duyệt',
  departmentApprovedBy: 'Cán bộ Cục phê duyệt',
  portAuthorityApprovalContent: 'Nội dung Cảng vụ phê duyệt',
  departmentApprovalContent: 'Nội dung Cục phê duyệt',
  rejectionReason: 'Lý do từ chối',
  // Backward compatibility aliases:
  'Cảng biển': 'Thuộc cảng biển',
  'Luồng hàng hải': 'Thuộc luồng hàng hải',
  'Bến phao': 'Thuộc bến phao',
  'Tỉnh/Thành phố': 'Địa điểm (Tỉnh/Thành Phố)',
  'Địa điểm (Tỉnh/Thành phố)': 'Địa điểm (Tỉnh/Thành Phố)',
  'Biểu tượng bản đồ': 'Biểu tượng',
};

function histField(fn: string): string { return histLabels[fn] || fn; }

function histVal(
  fn: string,
  val: string | null,
  orgMap?: Map<string, string>,
  symbolMap?: Map<string, string>,
  portMap?: Map<string, string>,
  buoyStationMap?: Map<string, string>,
  waterwayMap?: Map<string, string>,
): string {
  if (!val || val === '(null)' || val === 'null' || val === '-' || val === '—' || val === '–') return '';
  const v = val.trim();
  if ((fn === 'orgUnitId' || fn === 'Đơn vị quản lý') && orgMap) {
    const f = orgMap.get(v);
    return f ? f.split(' - ').pop() || f : v;
  }
  if ((fn === 'portId' || fn === 'Thuộc cảng biển' || fn === 'Cảng biển') && portMap) return portMap.get(v) || v;
  if ((fn === 'buoyStationId' || fn === 'Thuộc bến phao' || fn === 'Bến phao') && buoyStationMap) return buoyStationMap.get(v) || v;
  if ((fn === 'mapSymbolId' || fn === 'Biểu tượng' || fn === 'Biểu tượng bản đồ') && symbolMap) return symbolMap.get(v) || v;
  if ((fn === 'navigationChannelId' || fn === 'Thuộc luồng hàng hải' || fn === 'Luồng hàng hải') && waterwayMap) return waterwayMap.get(v) || v;
  if (fn === 'approvalStatus' || fn === 'Trạng thái' || fn === 'Trạng thái phê duyệt') {
    const m: Record<string, string> = {
      DRAFT: 'Lưu tạm',
      NHAP: 'Lưu tạm',
      PENDING: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
      PENDING_APPROVAL: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
      CHO_PHE_DUYET: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
      APPROVED_LEVEL1: 'Chờ phê duyệt cấp cục',
      APPROVED_LEVEL2: 'Đã phê duyệt',
      APPROVED: 'Đã phê duyệt',
      DA_PHE_DUYET: 'Đã phê duyệt',
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
  if (fn.endsWith('At') || fn.endsWith('Date') || fn.includes('Thời điểm') || fn.includes('Ngày')) {
    try {
      let d = dayjs(v);
      if (!d.isValid()) { d = dayjs(v.replace(/\.\d+$/, '')); }
      return d.isValid() ? (fn.includes('openingAnnouncementDate') || fn.includes('Thời điểm công bố') || fn.includes('Ngày') ? d.format('DD/MM/YYYY') : d.format('DD/MM/YYYY HH:mm')) : v;
    } catch { return v; }
  }
  return v;
}



export default function StormShelterListPage() {
  const hasPerm = usePermissionStore((s: any) => s.hasPermission);
  const userPermissions = useAuthStore((s) => s.user?.permissions) || [];
  const isAuditViewer = userPermissions.includes('admin:manage') || userPermissions.includes('admin:operation');
  const defaultOrgUnitRef = useRef<string | undefined>(undefined);

  const [orgUnit, setOrgUnit] = useState<string | undefined>(undefined);
  const [nameInput, setNameInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [filterPortId, setFilterPortId] = useState<string | undefined>();
  const [filterBuoyStationId, setFilterBuoyStationId] = useState<string | undefined>();
  const [filterNavigationChannelId, setFilterNavigationChannelId] = useState<string | undefined>();
  const [filterClassification, setFilterClassification] = useState<string | undefined>();
  const [filterProvince, setFilterProvince] = useState<string | undefined>();
  const [filterOperationalStatus, setFilterOperationalStatus] = useState<string | undefined>();
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState<string | undefined>();
  const [filterUpdatedTo, setFilterUpdatedTo] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState('all');
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [dataSource, setDataSource] = useState<StormShelterArea[]>([]);
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
  const [portOptions, setPortOptions] = useState<{ value: string; label: string }[]>([]);
  const [buoyStationOptions, setBuoyStationOptions] = useState<{ value: string; label: string }[]>([]);
  const [buoyStationMap, setBuoyStationMap] = useState<Map<string, string>>(new Map());
  const [waterwayOptions, setWaterwayOptions] = useState<{ value: string; label: string }[]>([]);
  const [waterwayMap, setWaterwayMap] = useState<Map<string, string>>(new Map());

  const portMap = useMemo(() => {
    const m = new Map<string, string>();
    portOptions.forEach((o) => m.set(o.value, o.label));
    return m;
  }, [portOptions]);

  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
  const [createDrawerVisible, setCreateDrawerVisible] = useState(false);
  const [editStormShelterId, setEditStormShelterId] = useState<string | undefined>();
  const [editBaseStatus, setEditBaseStatus] = useState<string | undefined>();
  const [createForm] = Form.useForm();
  const stormShelterFormRef = useRef<any>(null);

  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [detailRecord, setDetailRecord] = useState<StormShelterArea | null>(null);
  const [detailFiles, setDetailFiles] = useState<any[]>([]);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<StormShelterArea | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRecord, setRejectingRecord] = useState<StormShelterArea | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submittingRecord, setSubmittingRecord] = useState<StormShelterArea | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionType, setActionType] = useState<'draft' | 'submit' | 'approve'>('draft');

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvingRecord, setApprovingRecord] = useState<StormShelterArea | null>(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<StormShelterArea | null>(null);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilters, setHistoryFilters] = useState<{ keyword: string; fromDate?: string; toDate?: string }>({ keyword: '' });

  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Load master data
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
      } catch {}
    })();

    (async () => {
      try {
        const r = await userService.list({ pageSize: 1000 });
        const u = r.data || (r as any).content || [];
        const m = new Map<string, string>();
        u.forEach((x: any) => m.set(x.id, x.fullName || x.username || x.id));
        setUserMap(m);
      } catch {}
    })();

    (async () => {
      try {
        const r = await symbolService.list({ page: 1, pageSize: 1000, status: 'active' });
        const s = r.data || (r as any).content || [];
        const m = new Map<string, string>();
        const imgMap = new Map<string, string>();
        s.forEach((x: any) => {
          m.set(x.id, x.name);
          if (x.image) imgMap.set(x.id, x.image);
        });
        setSymbolMap(m);
        setSymbolImageMap(imgMap);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (orgUnit !== undefined && !initialLoadDone) {
      setInitialLoadDone(true);
    }
  }, [orgUnit, initialLoadDone]);

  // Luồng hàng hải (bộ lọc: chỉ lấy đã phê duyệt)
  useEffect(() => {
    navigationChannelCRUD.search({ approvalStatus: 'APPROVED', page: 0, size: 1000 })
      .then((r) => {
        const items = r.items || [];
        setWaterwayOptions(items.map(n => ({
          value: n.id,
          label: n.channelName || n.channelCode || '',
        })));
      })
      .catch(() => {});
  }, []);

  // Luồng hàng hải (map hiển thị tên bảng & lịch sử)
  useEffect(() => {
    navigationChannelCRUD.search({ page: 0, size: 1000 })
      .then((r) => {
        const m = new Map<string, string>();
        (r.items || []).forEach(n => { m.set(n.id, n.channelName || n.channelCode || ''); });
        setWaterwayMap(m);
      })
      .catch(() => {});
  }, []);

  // Cảng biển
  useEffect(() => {
    (async () => {
      try {
        const p: any = { page: 1, pageSize: 1000 };
        if (orgUnit && orgUnit !== '__all__') p.orgUnitId = orgUnit;
        const r = await portCRUD.search(p);
        setPortOptions((r.data || []).map((x: any) => ({ value: x.id, label: x.portName })));
      } catch {}
    })();
  }, [orgUnit]);

  // Bến phao (bộ lọc: chỉ lấy đã phê duyệt, lọc theo orgUnit và portId)
  useEffect(() => {
    (async () => {
      try {
        const params: any = { page: 1, pageSize: 1000, approvalStatus: 'APPROVED' };
        if (orgUnit && orgUnit !== '__all__') params.orgUnitId = orgUnit;
        if (filterPortId) params.portId = filterPortId;
        const r = await buoyBerthCRUD.search(params);
        setBuoyStationOptions((r.data || []).map((b: any) => ({
          value: b.id,
          label: b.buoyBerthName || b.buoyBerthCode || b.id,
        })));
      } catch {}
    })();
  }, [orgUnit, filterPortId]);

  // Bến phao (map hiển thị tên bảng & lịch sử)
  useEffect(() => {
    (async () => {
      try {
        const r = await buoyBerthCRUD.search({ page: 1, pageSize: 1000 });
        const m = new Map<string, string>();
        (r.data || []).forEach((b: any) => { m.set(b.id, b.buoyBerthName || b.buoyBerthCode || ''); });
        setBuoyStationMap(m);
      } catch {}
    })();
  }, []);

  const fetchCounts = useCallback(async (oid: string | undefined) => {
    try {
      const rs = await Promise.allSettled(
        TAB_STATUS_LIST.map(t =>
          t.key === 'all'
            ? stormShelterCRUD.search({ orgUnitId: (oid && oid !== '__all__') ? oid : undefined, page: 1, pageSize: 1 })
            : stormShelterCRUD.search({ approvalStatus: TAB_QUERY_MAP[t.key], orgUnitId: (oid && oid !== '__all__') ? oid : undefined, page: 1, pageSize: 1 })
        )
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
    } catch {}
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true); setIsError(false); setError(null);
    try {
      const r = await stormShelterCRUD.search({
        orgUnitId: (orgUnit && orgUnit !== '__all__') ? orgUnit : undefined,
        stormShelterName: nameInput.trim() || undefined,
        stormShelterCode: codeInput.trim() || undefined,
        portId: filterPortId,
        navigationChannelId: filterNavigationChannelId,
        buoyStationId: filterBuoyStationId,
        classification: filterClassification,
        provinceId: filterProvince ? (VIETNAM_PROVINCES.indexOf(filterProvince) + 1) : undefined,
        operationalStatus: filterOperationalStatus,
        approvalStatus: TAB_QUERY_MAP[activeTab],
        updatedFrom: filterUpdatedFrom,
        updatedTo: filterUpdatedTo,
        page, pageSize,
      });
      setDataSource(r.data); setTotal(r.total);
    } catch (ex: unknown) {
      setIsError(true); setError(ex instanceof Error ? ex : new Error('Không thể tải danh sách khu tránh, trú bão'));
    } finally {
      setIsLoading(false);
    }
  }, [
    orgUnit, nameInput, codeInput, filterPortId, filterNavigationChannelId,
    filterBuoyStationId, filterClassification, filterProvince, filterOperationalStatus,
    filterUpdatedFrom, filterUpdatedTo, activeTab, page, pageSize,
  ]);

  useEffect(() => { if (initialLoadDone) void fetchData(); }, [fetchData, initialLoadDone]);
  useEffect(() => { void fetchCounts(orgUnit); }, [orgUnit, fetchCounts]);

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
    setFilterBuoyStationId(undefined);
    setFilterNavigationChannelId(undefined);
    setFilterClassification(undefined);
    setFilterProvince(undefined);
    setFilterOperationalStatus(undefined);
    setFilterUpdatedFrom(undefined);
    setFilterUpdatedTo(undefined);
    setActiveTab('all');
    setPage(1);
  }, []);

  const handleTabChange = useCallback((key: string) => { setActiveTab(key); setPage(1); }, []);

  const openDetailDrawer = useCallback(async (record: StormShelterArea) => {
    setDetailDrawerVisible(true); setDetailRecord(record); setDetailFiles([]);
    try {
      const r = await api.get(`/v1/storm-shelter/${record.id}/attachments`);
      setDetailFiles(r.data?.data || []);
    } catch { setDetailFiles([]); }
    try {
      const fresh = await stormShelterCRUD.findById(record.id);
      setDetailRecord(fresh);
    } catch {}
  }, []);

  const closeDetailDrawer = useCallback(() => {
    setDetailDrawerVisible(false);
    setDetailRecord(null);
  }, []);

  const dd2dms = (dd: number) => {
    if (dd == null || isNaN(dd)) return { d: 0, m: 0, s: 0 };
    const a = Math.abs(dd);
    return {
      d: Math.floor(a),
      m: Math.floor((a - Math.floor(a)) * 60),
      s: +((a - Math.floor(a) - Math.floor((a - Math.floor(a)) * 60) / 60) * 3600).toFixed(2),
    };
  };

  const openDeleteModal = useCallback((record: StormShelterArea) => {
    setDeletingRecord(record);
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingRecord) return;
    setDeleteLoading(true);
    try {
      await stormShelterCRUD.delete(deletingRecord.id);
      toast.success('Đã xóa khu tránh, trú bão');
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

  const handleApprove = useCallback(async (record: StormShelterArea, content?: string) => {
    try {
      if (record.approvalStatus === 'PENDING_APPROVAL' || record.approvalStatus === 'PROPOSED' || record.approvalStatus === 'CHO_PHE_DUYET') {
        await stormShelterApproval.approveC1(record.id, content);
      } else {
        await stormShelterApproval.approveC2(record.id, content);
      }
      toast.success(record.approvalStatus === 'PENDING_APPROVAL' ? 'Đã phê duyệt cấp Cảng vụ/Chi cục' : 'Đã phê duyệt cấp Cục');
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

  const handleSubmitApproval = useCallback((record: StormShelterArea) => {
    setSubmittingRecord(record);
    setSubmitModalOpen(true);
  }, []);

  const confirmSubmitApproval = useCallback(async () => {
    if (!submittingRecord) return;
    try {
      await stormShelterCRUD.update({ id: submittingRecord.id, saveAction: 'SUBMIT' } as any);
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

  const openRejectModal = useCallback((record: StormShelterArea) => {
    setRejectingRecord(record); setRejectReason(''); setRejectError(''); setRejectModalOpen(true);
  }, []);

  const handleConfirmReject = useCallback(async () => {
    if (!rejectingRecord) return;
    const reason = rejectReason.trim();
    if (!reason) { setRejectError('Vui lòng nhập lý do từ chối'); return; }
    try {
      await stormShelterApproval.rejectStage(rejectingRecord.id, reason, rejectingRecord.approvalStatus);
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
    } catch (ex: unknown) {
      toast.error(ex instanceof Error ? ex.message : 'Từ chối thất bại');
    }
  }, [rejectingRecord, rejectReason, fetchData, fetchCounts, orgUnit]);

  const openHistory = useCallback(async (r: StormShelterArea) => {
    setHistoryTarget(r); setHistoryOpen(true); setHistoryLoading(true); setHistoryRecords([]);
    setHistoryFilters({ keyword: '' });
    try {
      const res = await api.get(`/v1/storm-shelter/${r.id}/history`);
      const d = res.data?.data;
      const list = Array.isArray(d?.changeHistory) ? d.changeHistory.filter((x: any) => x.fieldName !== 'CREATE') : [];
      setHistoryRecords(list);
    } catch {
      toast.error('Không thể tải lịch sử');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

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
        const resolvedOld = histVal(fn, r?.oldValue, orgMap, symbolMap, portMap, buoyStationMap, waterwayMap);
        const resolvedNew = histVal(fn, r?.newValue, orgMap, symbolMap, portMap, buoyStationMap, waterwayMap);
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
  }, [historyRecords, historyFilters, orgMap, symbolMap, portMap, buoyStationMap, waterwayMap]);

  const hasActiveHistoryFilter = !!(historyFilters.keyword?.trim() || historyFilters.fromDate || historyFilters.toDate);

  const HISTORY_FIELD_ORDER = [
    'orgUnitId', 'portId', 'stormShelterCode', 'stormShelterName', 'navigationChannelId',
    'buoyStationId', 'classification', 'provinceId', 'province', 'detailedLocation', 'operationalStatus', 'approvalStatus',
    'shapeDescription', 'area', 'designWaterDepth', 'currentWaterDepth', 'bottomElevationDesign',
    'maxVesselDWT', 'activeStormShelterCount', 'publishedStormShelterCount', 'underInvestmentStormShelterCount',
    'remarks', 'openingAnnouncementDate', 'publicDecision', 'investmentAgreement',
    'coordinateSystem', 'displayRule', 'mapSymbolId', 'spatialId',
    'Tọa độ GPS', 'Tọa độ GIS', 'Loại đối tượng', 'Loại đối tượng GIS', 'Phạm vi khu nước neo buộc tàu', 'Khu nước neo buộc tàu', 'Danh sách khu nước neo buộc tàu', 'Tài liệu đính kèm',
    // Vietnamese label aliases:
    'Đơn vị quản lý', 'Thuộc cảng biển', 'Cảng biển', 'Mã khu tránh, trú bão', 'Tên khu tránh, trú bão',
    'Thuộc luồng hàng hải', 'Luồng hàng hải', 'Thuộc bến phao', 'Bến phao', 'Phân loại',
    'Địa điểm (Tỉnh/Thành Phố)', 'Địa điểm (Tỉnh/Thành phố)', 'Tỉnh/Thành phố', 'Địa điểm chi tiết',
    'Tình trạng', 'Trạng thái', 'Hình dạng', 'Diện tích (ha)',
    'Độ sâu khu nước theo thiết kế (m)', 'Độ sâu theo thiết kế (m)',
    'Độ sâu khu nước hiện tại (m)', 'Độ sâu hiện tại (m)',
    'Cao độ đáy bến thiết kế', 'Cỡ tàu lớn nhất (DWT)', 'Cỡ tàu khai thác (DWT)',
    'Số lượng khu đang khai thác', 'Số khu đang khai thác',
    'Số lượng khu đã công bố', 'Số khu đã công bố',
    'Số lượng khu đang thỏa thuận đầu tư', 'Số khu thỏa thuận đầu tư',
    'Ghi chú', 'Thời điểm công bố mở', 'Quyết định công bố', 'Thỏa thuận đầu tư xây dựng',
    'Hệ quy chiếu', 'Quy tắc hiển thị', 'Biểu tượng', 'Biểu tượng bản đồ',
  ];

  const renderStormShelterHistoryTimeline = (records: any[]) => {
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
        const resolved = histVal(fn, raw, orgMap, symbolMap, portMap, buoyStationMap, waterwayMap);
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

  const filterContent = (
    <>
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
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tên khu tránh, trú bão</div>
        <Input
          style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
          placeholder="Tìm theo tên khu tránh, trú bão"
          value={nameInput}
          onChange={e => setNameInput(e.target.value)}
          onPressEnter={handleFilterApply}
          allowClear
          prefix={<SearchOutlined style={{ color: textTertiary }} />}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tình trạng</div>
        <Select
          style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
          placeholder="Chọn tình trạng"
          allowClear
          value={filterOperationalStatus}
          onChange={v => setFilterOperationalStatus(v)}
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
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Thuộc cảng biển</div>
            <Select
              style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
              placeholder="Chọn cảng biển"
              allowClear
              showSearch
              value={filterPortId}
              onChange={v => {
                setFilterPortId(v);
                setFilterBuoyStationId(undefined);
              }}
              options={portOptions}
              filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Thuộc luồng hàng hải</div>
            <Select
              style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
              placeholder="Chọn luồng hàng hải"
              allowClear
              showSearch
              value={filterNavigationChannelId}
              onChange={v => setFilterNavigationChannelId(v)}
              options={waterwayOptions}
              filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Thuộc bến phao</div>
            <Select
              style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
              placeholder="Chọn bến phao"
              allowClear
              showSearch
              value={filterBuoyStationId}
              onChange={v => setFilterBuoyStationId(v)}
              options={buoyStationOptions}
              filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Mã khu tránh, trú bão</div>
            <Input
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
              placeholder="Tìm theo mã khu tránh, trú bão"
              value={codeInput}
              onChange={e => setCodeInput(e.target.value)}
              onPressEnter={handleFilterApply}
              allowClear
              prefix={<SearchOutlined style={{ color: textTertiary }} />}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Phân loại</div>
            <Select
              style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
              placeholder="Chọn phân loại"
              allowClear
              showSearch
              value={filterClassification}
              onChange={v => setFilterClassification(v)}
              options={STORM_SHELTER_CLASSIFICATION_OPTIONS}
              filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Địa điểm (Tỉnh/Thành phố)</div>
            <Select
              style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
              placeholder="Chọn tỉnh/thành phố"
              allowClear
              showSearch
              value={filterProvince}
              onChange={v => setFilterProvince(v)}
              filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())}
              options={VIETNAM_PROVINCES.map(p => ({ value: p, label: p }))}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Ngày cập nhật</div>
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

  const rowActions = useCallback((record: StormShelterArea) => {
    const actions: any[] = [{ key: 'view', label: 'Xem chi tiết', icon: icons.view, onClick: () => openDetailDrawer(record) }];
    const st = record.approvalStatus || '';
    const editable = canEditApprovalRecord(record.approvalStatus, { hasPerm, resource: 'stormshelter', extraApprovePerms: ['stormshelter:approve'] });
    if (editable) {
      actions.push({
        key: 'edit', label: 'Chỉnh sửa', icon: icons.edit,
        onClick: () => { setEditStormShelterId(record.id); setEditBaseStatus(record.approvalStatus); setCreateDrawerVisible(true); },
      });
    }
    if (['DRAFT', 'NHAP'].includes(st) && hasPerm('stormshelter:update')) {
      actions.push({ key: 'submit', label: 'Gửi Cảng vụ phê duyệt', icon: icons.submit, onClick: () => handleSubmitApproval(record) });
    }
    if (['REJECTED_LEVEL1', 'REJECTED_LEVEL2'].includes(st) && hasPerm('stormshelter:update')) {
      actions.push({ key: 'resubmit', label: 'Gửi lại phê duyệt', icon: icons.submit, onClick: () => handleSubmitApproval(record) });
    }
    if (hasPerm('stormshelter:history')) {
      actions.push({ key: 'history', label: 'Lịch sử', icon: icons.history, onClick: () => openHistory(record) });
    }
    if (hasPerm('stormshelter:approvec1') && st === 'PENDING_APPROVAL') {
      actions.push({ key: 'approve_c1', label: 'Phê duyệt cấp Cảng vụ/Chi cục', icon: icons.approve, onClick: () => { setApprovingRecord(record); setApproveModalOpen(true); } });
      actions.push({ key: 'reject_c1', label: 'Từ chối cấp Cảng vụ/Chi cục', icon: icons.reject, danger: true, onClick: () => openRejectModal(record) });
    }
    if (hasPerm('stormshelter:approvec2') && st === 'APPROVED_LEVEL1') {
      actions.push({ key: 'approve_c2', label: 'Phê duyệt cấp Cục', icon: icons.approve, onClick: () => { setApprovingRecord(record); setApproveModalOpen(true); } });
      actions.push({ key: 'reject_c2', label: 'Từ chối cấp Cục', icon: icons.reject, danger: true, onClick: () => openRejectModal(record) });
    }
    if (canDeleteApprovalRecord(record.approvalStatus, { hasPerm, resource: 'stormshelter', extraDeletePerms: ['pier:delete', 'port:delete'] })) {
      actions.push({ key: 'delete', label: 'Xóa', icon: icons.delete, danger: true, onClick: () => openDeleteModal(record) });
    }
    return actions;
  }, [hasPerm, openDetailDrawer, openHistory, handleSubmitApproval, openRejectModal, openDeleteModal]);

  const auditColumns = useMemo(() => {
    if (!isAuditViewer) return [];
    return [
      {
        label: 'Cán bộ gửi Phê duyệt', dataIndex: 'submittedForApprovalAt', key: 'submittedForApprovalAt', width: 230, sortable: true,
        render: (v: string | null, record: StormShelterArea) => {
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
        label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục', dataIndex: 'portAuthorityApprovedAt', key: 'portAuthorityApprovedAt', width: 350, sortable: true,
        render: (v: string | null, record: StormShelterArea) => {
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
        label: 'Cán bộ phê duyệt cấp Cục', dataIndex: 'departmentApprovedAt', key: 'departmentApprovedAt', width: 260, sortable: true,
        render: (v: string | null, record: StormShelterArea) => {
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
  }, [isAuditViewer, userMap]);

  const getSortValue = useCallback((r: any, field: string): string | number => {
    if (field === 'orgUnitId') return resolveOrgLevel2Name(organizations, r.orgUnitId) || r.orgUnitName || orgMap.get(r.orgUnitId || '') || '';
    if (field === 'stormShelterName') return r.stormShelterName ?? '';
    if (field === 'stormShelterCode') return r.stormShelterCode ?? '';
    if (field === 'portId') return r.portName || portMap.get(r.portId) || r.portId || '';
    if (field === 'navigationChannelId') return (r as any).navigationChannelName || waterwayMap.get(r.navigationChannelId) || r.navigationChannelId || '';
    if (field === 'buoyStationId') return r.buoyStationName || buoyStationMap.get(r.buoyStationId) || r.buoyStationId || '';
    if (field === 'provinceId' || field === 'province') return r.provinceId ? (VIETNAM_PROVINCES[Number(r.provinceId) - 1] || '') : ((r as any).province || '');
    if (field === 'classification') return r.classification ?? '';
    if (field === 'operationalStatus') {
      return OPERATIONAL_STYLE_MAP[r.operationalStatus]?.label || r.operationalStatus || '';
    }
    if (field === 'approvalStatus') return (APPROVAL_STYLE_MAP[r.approvalStatus] || APPROVAL_STYLE_MAP[r.approvalStatus?.toUpperCase()])?.label || r.approvalStatus || '';
    if (field === 'updatedAt' || field === 'updatedBy' || field === 'updatedByName') {
      const t = r.updatedAt || r.createdAt;
      return t ? new Date(t).getTime() : 0;
    }
    if (field === 'submittedForApprovalAt') return r.submittedForApprovalAt ? new Date(r.submittedForApprovalAt).getTime() : 0;
    if (field === 'portAuthorityApprovedAt') return r.portAuthorityApprovedAt ? new Date(r.portAuthorityApprovedAt).getTime() : 0;
    if (field === 'departmentApprovedAt') return r.departmentApprovedAt ? new Date(r.departmentApprovedAt).getTime() : 0;
    return r[field] ?? '';
  }, [organizations, orgMap, portMap, buoyStationMap, waterwayMap, userMap]);

  const columns = useMemo(() => {
    const baseColumns: any[] = [
      {
        label: 'STT', key: 'stt', width: 60, fixed: 'left' as const, align: 'center' as const,
        render: (_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{(page - 1) * pageSize + i + 1}</span>,
      },
      {
        label: <span>Tên/Mã khu tránh, trú bão</span>, dataIndex: 'stormShelterName', key: 'stormShelterName', width: 220, fixed: 'left' as const, sortable: true, ellipsis: false,
        render: (v: string, record: StormShelterArea) => (
          <div>
            <a title={v || ''} onClick={(e) => { e.stopPropagation(); openDetailDrawer(record); }} style={{ ...cellTitleStyle, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}>{v || ''}</a>
            <span style={{ ...cellSubtitleStyle, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.stormShelterCode || ''}</span>
          </div>
        ),
      },
      {
        label: 'Đơn vị quản lý', dataIndex: 'orgUnitId', key: 'orgUnitId', width: 260, sortable: true,
        render: (v: string | null, r: StormShelterArea) => <span style={{ fontWeight: fontWeightBold }}>{resolveOrgLevel2Name(organizations, r.orgUnitId) || orgMap.get(v || '') || ''}</span>,
      },
      {
        label: 'Thuộc cảng biển', dataIndex: 'portId', key: 'portId', width: 200, sortable: true,
        render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{portMap.get(v || '') || v || ''}</span>,
      },
      {
        label: 'Thuộc luồng hàng hải', dataIndex: 'navigationChannelId', key: 'navigationChannelId', width: 280, ellipsis: true, sortable: true,
        render: (v?: string, r?: StormShelterArea) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{(r as any)?.navigationChannelName || (v ? (waterwayMap.get(v) || v) : '')}</span>,
      },
      {
        label: 'Thuộc bến phao', dataIndex: 'buoyStationId', key: 'buoyStationId', width: 220, sortable: true,
        render: (v: string, r: StormShelterArea) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{r.buoyStationName || (v ? buoyStationMap.get(v) || v : '')}</span>,
      },
      {
        label: 'Địa điểm (Tỉnh/Thành phố)', dataIndex: 'provinceId', key: 'provinceId', width: 230, sortable: true,
        render: (v?: number) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v ? (VIETNAM_PROVINCES[Number(v) - 1] || String(v)) : ''}</span>,
      },
      {
        label: 'Tình trạng', dataIndex: 'operationalStatus', key: 'operationalStatus', width: 240, ellipsis: false, sortable: true,
        render: (v: string) => { const b = v && OPERATIONAL_STYLE_MAP[v]; return b ? <span style={statusBadgeStyle(b.color)}>{b.label}</span> : null; },
      },
      {
        label: 'Trạng thái', dataIndex: 'approvalStatus', key: 'approvalStatus', width: 320, ellipsis: false, sortable: true,
        render: (v: string) => {
          const s = v && (APPROVAL_STYLE_MAP[v] || APPROVAL_STYLE_MAP[v.toUpperCase()]);
          return s ? <span style={statusBadgeStyle(s.color)}>{s.label}</span> : null;
        },
      },
      {
        label: 'Cán bộ cập nhật', dataIndex: 'updatedAt', key: 'updatedAt', width: 200, sortable: true,
        render: (v: string, record: StormShelterArea) => (
          <div>
            <span style={{ fontWeight: fontWeightBold }}>{userMap.get(record.updatedBy || '') || record.updatedBy || ''}</span><br />
            <span style={{ opacity: 0.85 }}>{formatDate(v)}</span>
          </div>
        ),
      },
    ];
    const tailColumns: any[] = [];
    const allColumns = [...baseColumns, ...tailColumns, ...auditColumns];
    return allColumns.map(col => ({ ...col, sortOrder: col.sortable ? ((col.key === sortField || col.dataIndex === sortField) ? sortOrder : null) : undefined }));
  }, [page, pageSize, organizations, orgMap, portMap, buoyStationMap, waterwayMap, userMap, auditColumns, sortField, sortOrder, openDetailDrawer]);

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

  const headerActions = useMemo(() => {
    const actions: Array<{ key: string; label: string; variant: 'primary' | 'outline' | 'subtle'; icon?: React.ReactNode; onClick: () => void }> = [];
    if (hasPerm('stormshelter:create')) {
      actions.push({
        key: 'create',
        label: 'Thêm mới',
        variant: 'primary',
        icon: icons.create,
        onClick: () => {
          setEditStormShelterId(undefined);
          setEditBaseStatus(undefined);
          createForm.resetFields();
          setCreateDrawerVisible(true);
        },
      });
    }
    return actions;
  }, [hasPerm, createForm]);

  return (
    <ThemeTokenProvider tokens={{ ...themeTokenChk, fontSizeMd } as unknown as ThemeToken}>
      <div className="storm-shelter-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <style>{`
          .storm-shelter-page-wrapper,
          .storm-shelter-page-wrapper .ant-table,
          .storm-shelter-page-wrapper .ant-table-cell,
          .storm-shelter-page-wrapper .ant-table-thead > tr > th,
          .storm-shelter-page-wrapper .ant-table-tbody > tr > td,
          .storm-shelter-page-wrapper .ant-input,
          .storm-shelter-page-wrapper .ant-select,
          .storm-shelter-page-wrapper .ant-select-selection-item,
          .storm-shelter-page-wrapper .ant-select-item-option-content,
          .storm-shelter-page-wrapper .ant-picker,
          .storm-shelter-page-wrapper .ant-picker-input > input,
          .storm-shelter-page-wrapper .ant-btn,
          .storm-shelter-page-wrapper .ant-pagination,
          .storm-shelter-page-wrapper .ant-pagination-item,
          .storm-shelter-page-wrapper .ant-pagination-total-text,
          .storm-shelter-page-wrapper .ant-breadcrumb,
          .storm-shelter-page-wrapper .ant-form-item-label > label,
          .storm-shelter-page-wrapper .ant-tabs-tab,
          .storm-shelter-page-wrapper .storm-shelter-drawer-scope,
          .storm-shelter-page-wrapper .storm-shelter-drawer-scope .ant-drawer-content,
          .storm-shelter-page-wrapper .storm-shelter-drawer-scope .ant-tabs-tab,
          .storm-shelter-page-wrapper .storm-shelter-drawer-scope .ant-input,
          .storm-shelter-page-wrapper .storm-shelter-drawer-scope .ant-select,
          .storm-shelter-page-wrapper .storm-shelter-drawer-scope .ant-btn,
          .storm-shelter-page-wrapper .storm-shelter-drawer-scope .ant-table,
          .storm-shelter-page-wrapper .storm-shelter-drawer-scope .ant-table-cell,
          .storm-shelter-page-wrapper .storm-shelter-drawer-scope .ant-table-thead > tr > th,
          .storm-shelter-page-wrapper .storm-shelter-drawer-scope .ant-form-item-label > label {
            font-size: 13.5px !important;
          }
          /* ── Drawer tạo/sửa/chi tiết ── */
          .storm-shelter-drawer-scope,
          .storm-shelter-drawer-scope .ant-drawer-content,
          .storm-shelter-drawer-scope .ant-tabs-tab,
          .storm-shelter-drawer-scope .ant-drawer-content .ant-form-item-label > label,
          .storm-shelter-drawer-scope .chk-detail-label,
          .storm-shelter-drawer-scope .chk-detail-value,
          .storm-shelter-drawer-scope .ant-table,
          .storm-shelter-drawer-scope .ant-table-cell,
          .storm-shelter-drawer-scope .ant-table-thead > tr > th,
          .storm-shelter-drawer-scope .ant-table-tbody > tr > td,
          .storm-shelter-drawer-scope .ant-input,
          .storm-shelter-drawer-scope .ant-select,
          .storm-shelter-drawer-scope .ant-btn {
            font-size: 13.5px !important;
          }
          .storm-shelter-page-wrapper div:has(> button[aria-pressed]) {
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
          .storm-shelter-page-wrapper div:has(> button[aria-pressed]) > button {
            white-space: nowrap !important;
            flex-shrink: 0 !important;
            cursor: pointer !important;
          }
          .storm-shelter-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar {
            height: 6px !important;
            display: block !important;
          }
          .storm-shelter-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-track {
            background: #f1f5f9 !important;
            border-radius: 999px !important;
          }
          .storm-shelter-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb {
            background: #cbd5e1 !important;
            border-radius: 999px !important;
          }
          .storm-shelter-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb:hover {
            background: #94a3b8 !important;
          }
          /* ── Responsive Drawers ── */
          .storm-shelter-drawer-scope .ant-drawer-content-wrapper {
            max-width: 100vw !important;
          }
          @media (max-width: 1024px) {
            .storm-shelter-drawer-scope .chk-detail-grid {
              grid-template-columns: 1fr !important;
              column-gap: 0 !important;
            }
            .storm-shelter-drawer-scope .chk-detail-row--full {
              grid-column: 1 !important;
            }
          }
          @media (max-width: 640px) {
            .storm-shelter-drawer-scope .chk-detail-row {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 4px !important;
              padding: 8px 0 !important;
            }
            .storm-shelter-drawer-scope .chk-detail-label {
              width: 100% !important;
            }
            .storm-shelter-drawer-scope .chk-detail-value {
              width: 100% !important;
            }
          }
          .storm-shelter-drawer-scope .ant-form-item.cn-op-2line-label .ant-form-item-label {
            height: auto !important;
            min-height: 44px !important;
            align-items: flex-start !important;
          }
          .storm-shelter-drawer-scope .ant-form-item.cn-op-2line-label .ant-form-item-label > label {
            height: auto !important;
            white-space: normal !important;
            line-height: 1.45 !important;
            overflow-wrap: break-word;
          }
        `}</style>
        <ScreenHeader
          breadcrumb={[{ label: 'Tài sản KCHTGT' }, { label: 'Quản lý khu tránh, trú bão' }]}
          actions={headerActions}
        />
        <FilterTableLayout
          filterContent={filterContent}
          statusTabs={TAB_STATUS_LIST.map(t => ({ key: t.key, label: t.label, color: t.color, count: tabCounts[t.key] ?? 0, active: activeTab === t.key }))}
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

        {/* ── Single Drawer: Thêm mới & Chỉnh sửa (chuẩn Pier/Anchorage) ── */}
        <Drawer
          {...drawerProps}
          rootClassName="storm-shelter-drawer-scope"
          className="storm-shelter-drawer-scope"
          size={1000}
          width="min(1000px, 96vw)"
          title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>{editStormShelterId ? 'Chỉnh sửa thông tin Khu tránh, trú bão' : 'Thêm mới Khu tránh, trú bão'}</span>}
          open={createDrawerVisible}
          destroyOnHidden
          onClose={() => { setCreateDrawerVisible(false); createForm.resetFields(); }}
          afterOpenChange={(open) => { if (!open) { setEditStormShelterId(undefined); setEditBaseStatus(undefined); } }}
          extra={<Button type="text" onClick={() => { setCreateDrawerVisible(false); createForm.resetFields(); }} style={drawerCloseBtnStyle}>✕</Button>}
          footer={<div style={drawerFooterStyle}>{(() => {
            const st = !editStormShelterId ? 'DRAFT' : (editBaseStatus ? normalizeApprovalStatus(editBaseStatus) : 'DRAFT');
            if (st === 'APPROVED') {
              return (
                <Button htmlType="button" type="primary" onClick={() => { setActionType('approve'); stormShelterFormRef.current?.submit('APPROVED'); }} loading={submitting && actionType === 'approve'} style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}>
                  Lưu và phê duyệt
                </Button>
              );
            }
            if (st === 'REJECTED_LEVEL1' || st === 'REJECTED_LEVEL2' || st.startsWith('REJECTED')) {
              return (
                <Button htmlType="button" type="primary" onClick={() => { setActionType('submit'); stormShelterFormRef.current?.submit('SUBMIT'); }} loading={submitting && actionType === 'submit'} style={primaryButtonStyle}>
                  Lưu và gửi phê duyệt
                </Button>
              );
            }
            return (
              <>
                <Button htmlType="button" onClick={() => { setActionType('draft'); stormShelterFormRef.current?.submit('DRAFT'); }} loading={submitting && actionType === 'draft'} style={outlineButtonStyle}>
                  Lưu tạm
                </Button>
                <Button htmlType="button" type="primary" onClick={() => { setActionType('submit'); stormShelterFormRef.current?.submit('SUBMIT'); }} loading={submitting && actionType === 'submit'} style={primaryButtonStyle}>
                  Lưu và gửi phê duyệt
                </Button>
                <Button htmlType="button" type="primary" onClick={() => { setActionType('approve'); stormShelterFormRef.current?.submit('APPROVED'); }} loading={submitting && actionType === 'approve'} style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}>
                  Lưu và phê duyệt
                </Button>
              </>
            );
          })()}</div>}
          styles={{ header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 }, body: { padding: '0 24px 12px 24px' } }}
        >
          <Form form={createForm} layout="vertical">
            <style>{requiredMarkStyle}</style>
            <StormShelterForm
              ref={stormShelterFormRef}
              form={createForm}
              id={editStormShelterId}
              onFinish={() => {
                setCreateDrawerVisible(false);
                createForm.resetFields();
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

        {/* ── Detail Drawer ── */}
        <Drawer
          {...drawerProps}
          rootClassName="storm-shelter-drawer-scope"
          className="storm-shelter-drawer-scope"
          size={1000}
          width="min(1000px, 96vw)"
          title={<span style={drawerTitleStyle}>Chi tiết khu tránh, trú bão{detailRecord ? ` - ${detailRecord.stormShelterName}` : ''}</span>}
          open={detailDrawerVisible}
          destroyOnClose
          onClose={closeDetailDrawer}
          extra={<Button type="text" onClick={closeDetailDrawer} style={drawerCloseBtnStyle}>✕</Button>}
          styles={{ header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 }, body: { padding: '0 24px 12px 24px' } }}
          footer={null}
        >
          {detailRecord && (
            <StormShelterDetailContent
              selectedRecord={detailRecord}
              orgMap={orgMap}
              organizations={organizations}
              symbolMap={symbolMap}
              symbolImageMap={symbolImageMap}
              portOptions={portOptions}
              portMap={portMap}
              buoyStationMap={buoyStationMap}
              waterwayOptions={waterwayOptions.length > 0 ? waterwayOptions : Array.from(waterwayMap.entries()).map(([id, name]) => ({ value: id, label: name }))}
              buoyStationOptions={buoyStationOptions.length > 0 ? buoyStationOptions : Array.from(buoyStationMap.entries()).map(([id, name]) => ({ value: id, label: name }))}
              userMap={userMap}
              detailFiles={detailFiles}
              ddToDms={dd2dms}
              approvalStyleMap={APPROVAL_STYLE_MAP}
              operationalStyleMap={OPERATIONAL_STYLE_MAP}
              operationPlanList={(detailRecord as any)?.operationPlanList}
              maintenancePlanList={(detailRecord as any)?.maintenancePlanList}
              incidentList={(detailRecord as any)?.incidentList}
            />
          )}
        </Drawer>

        {/* ── Modal Xóa (DeleteConfirmModal) ── */}
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
          itemType="khu tránh, trú bão"
          itemName={deletingRecord?.stormShelterName}
          itemCode={deletingRecord?.stormShelterCode}
        />

        {/* ── Modal Từ chối ── */}
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
          width={480}
        >
          <div style={{ padding: '8px 0' }}>
            <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>Vui lòng nhập lý do từ chối cho khu tránh, trú bão:</p>
            {rejectingRecord && <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}><strong style={{ color: textPrimary }}>{rejectingRecord.stormShelterCode} — {rejectingRecord.stormShelterName}</strong></p>}
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

        {/* ── Modal Gửi phê duyệt ── */}
        <Modal
          styles={{ mask: { background: 'rgba(0, 0, 0, 0.4)' } }}
          title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Gửi phê duyệt</span>}
          open={submitModalOpen}
          onCancel={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }}
          footer={[
            <Button key="cancel" onClick={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }}
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
            <Button key="submit" type="primary" onClick={confirmSubmitApproval}
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>Xác nhận</Button>,
          ]}
          width={480}
        >
          <div style={{ padding: '8px 0' }}>
            <p style={{ fontSize: fontSizeMd, color: textPrimary }}>
              Xác nhận gửi phê duyệt khu tránh, trú bão <strong>{submittingRecord?.stormShelterName}</strong>?
            </p>
          </div>
        </Modal>

        {/* ── Modal Phê duyệt 2 cấp (ApprovalModal) ── */}
        <ApprovalModal
          visible={approveModalOpen}
          level={approvingRecord?.approvalStatus === 'APPROVED_LEVEL1' || approvingRecord?.approvalStatus === 'APPROVED_LEVEL2' ? 'c2' : 'c1'}
          onConfirm={(content) => { if (approvingRecord) handleApprove(approvingRecord, content); }}
          onCancel={() => { setApproveModalOpen(false); setApprovingRecord(null); }}
        />

        {/* ── History Drawer ── */}
        <AppDrawer
          width="min(880px, 96vw)"
          rootClassName="storm-shelter-drawer-scope"
          className="storm-shelter-drawer-scope"
          mask
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Space size={spaceSm} style={{ alignItems: 'center' }}>
                <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
                <span style={drawerTitleStyle}>
                  Lịch sử thay đổi — {historyTarget?.stormShelterName || historyTarget?.stormShelterCode || ''}
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
              renderStormShelterHistoryTimeline(filteredHistory)
            )}
          </div>
        </AppDrawer>
      </div>
    </ThemeTokenProvider>
  );
}
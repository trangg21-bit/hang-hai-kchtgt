import {
    HistoryOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import {
    Button,
    DatePicker,
    Form,
    Input,
    Modal,
    Select,
    Space,
} from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DataTable, ScreenHeader } from '../../components/list-view';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import Pagination from '../../components/list-view/Pagination';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { OrgUnitTreeSelect, resolveDefaultOrgUnitId, resolveOrgLevel2Name } from '../../components/org-unit';
import { AppDrawer } from '../../components/shared/AppDrawer';
import ApprovalModal from '../../components/shared/ApprovalModal';
import DeleteConfirmModal from '../../components/shared/DeleteConfirmModal';
import toast from '../../components/ToastNotification';
import { formatOperationalFunction, OPERATIONAL_FUNCTION_OPTIONS } from '../../constants/operationalFunction';
import { ThemeTokenProvider, type ThemeToken } from '../../context/ThemeTokenContext';
import api from '../../services/api';
import { navigationChannelCRUD } from '../../services/navigationChannelService';
import type { Organization } from '../../services/organizationService';
import { organizationService } from '../../services/organizationService';
import { berthCRUD, pierApproval, pierCRUD, portCRUD, shipRepairYardCRUD } from '../../services/portService';
import { symbolService } from '../../services/symbolService';
import { userService } from '../../services/userService';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import { checkCanSaveAndApprove, isCucLevelUser } from '../../hooks/useKchtPermissions';
import * as themeTokenChk from '../../themetokenchk';
import {
    actionPrimary,
    borderDefault,
    cellSubtitleStyle,
    cellTitleStyle,
    colors,
    DRAWER_WIDTH,
    drawerFooterStyle,
    drawerTitleStyle,
    fontSizeLg,
    fontWeightBold,
    icons,
    outlineButtonStyle,
    primaryButtonStyle,
    radiusPill,
    requiredMarkStyle,
    spaceFormField,
    spaceMd,
    spaceSm,
    spaceXl,
    statusAttention,
    statusBadgeStyle,
    statusCritical,
    statusDraft,
    statusOperational,
    textPrimary,
    textSecondary,
    textTertiary,
} from '../../themetokenchk';
import { VIETNAM_PROVINCES } from '../../types/common';
import type { Pier } from '../../types/port';
import { canDeleteApprovalRecord, canEditApprovalRecord, normalizeApprovalStatus } from '../../utils/approvalEditPolicy';
import { countStandardHistoryCards, isBlankOrDash, renderStandardHistoryCards } from '../../utils/changeHistoryRenderer';
import { formatHistoryNumber } from '../../utils/numFmt';
import ShipRepairYardDetailContent from '../ship-repair-yard/ShipRepairYardDetailContent';
import PierDetailContent from './PierDetailContent';
import PierForm from './PierForm';

// ── Cỡ chữ 13.5px đồng bộ chuẩn VTS CHK (theo PortListPage) — override thay vì dùng
// fontSizeMd=13 import từ themetokenchk để mọi cell/table/input/button cao ngang nhau.
const fontSizeMd = 13.5;

const APPROVAL_STYLE_MAP: Record<string, { color: string; label: string }> = {
  DRAFT: { color: statusDraft, label: 'Lưu tạm' },
  PENDING_APPROVAL: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  APPROVED_LEVEL1: { color: statusAttention, label: 'Chờ phê duyệt cấp Cục' },
  APPROVED: { color: statusOperational, label: 'Đã phê duyệt' },
  REJECTED_LEVEL1: { color: statusCritical, label: 'Từ chối cấp Cảng vụ/Chi cục' },
  REJECTED_LEVEL2: { color: statusCritical, label: 'Từ chối cấp Cục' },
  DELETED: { color: statusCritical, label: 'Đã xóa' },
};
const OPERATIONAL_STYLE_MAP: Record<string, { color: string; label: string }> = {
  OPERATIONAL: { color: statusOperational, label: 'Đang khai thác/vận hành' },
  NOT_YET_OPERATIONAL: { color: statusAttention, label: 'Chưa khai thác/vận hành' },
  SUSPENDED: { color: statusCritical, label: 'Dừng khai thác/vận hành' },
};
const TAB_STATUS_LIST = [
  { key: 'all', label: 'Tất cả', color: actionPrimary },
  { key: 'DRAFT', label: 'Lưu tạm', color: statusDraft },
  { key: 'PENDING_APPROVAL', label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', color: actionPrimary },
  { key: 'APPROVED_LEVEL1', label: 'Chờ phê duyệt cấp Cục', color: statusAttention },
  { key: 'APPROVED', label: 'Đã phê duyệt', color: statusOperational },
  { key: 'REJECTED_LEVEL1', label: 'Từ chối cấp Cảng vụ/Chi cục', color: statusCritical },
  { key: 'REJECTED_LEVEL2', label: 'Từ chối cấp Cục', color: statusCritical },
  { key: 'DELETED', label: 'Đã xóa', color: statusCritical },
];
const TAB_QUERY_MAP: Record<string, string | undefined> = {
  all: undefined, DRAFT: 'DRAFT', PENDING_APPROVAL: 'PENDING_APPROVAL', APPROVED_LEVEL1: 'APPROVED_LEVEL1',
  APPROVED: 'APPROVED', REJECTED_LEVEL1: 'REJECTED_LEVEL1', REJECTED_LEVEL2: 'REJECTED_LEVEL2',
  DELETED: 'DELETED',
};

export const isDeletedPier = (record?: Pier | null): boolean => {
  if (!record) return false;
  return Boolean(record.deletedAt || record.deletedBy);
};

const STRUCTURE_TYPE_OPTIONS = [
  { value: 1, label: 'Kết cấu bệ cọc cao' }, { value: 2, label: 'Kết cấu cường từ' },
  { value: 3, label: 'Kết cấu trọng lực' }, { value: 4, label: 'Kết cấu khác' },
];
const CONSTRUCTION_GRADE_OPTIONS = [
  { value: 1, label: 'Cấp đặc biệt' }, { value: 2, label: 'Cấp 1' },
  { value: 3, label: 'Cấp 2' }, { value: 4, label: 'Cấp 3' }, { value: 5, label: 'Cấp 4' },
];

function formatDate(d: string | null | undefined): string {
  if (!d) return ''; try { return dayjs(d).format('DD/MM/YYYY HH:mm:ss'); } catch { return d; }
}

const histLabels: Record<string, string> = {
  pierCode: 'Mã cầu', pierName: 'Tên cầu', berthId: 'Bến cảng', portId: 'Cảng biển',
  length: 'Chiều dài', width: 'Chiều rộng', pierType: 'Loại cầu',
  operationalStatus: 'Tình trạng', approvalStatus: 'Trạng thái', orgUnitId: 'Đơn vị quản lý',
  designLoad: 'Tải trọng thiết kế', operationalFunction: 'Công năng khai thác',
  mapSymbolId: 'Biểu tượng bản đồ', navigationChannelId: 'Luồng hàng hải',
  province: 'Tỉnh/Thành phố', detailedLocation: 'Địa điểm chi tiết',
  constructionGrade: 'Cấp công trình', structureType: 'Loại kết cấu',
  conditionStatus: 'Tình trạng kỹ thuật', currentWaterDepth: 'Độ sâu hiện tại',
  designBedElevation: 'Cao độ đáy thiết kế', publishedVesselDWT: 'Trọng tải tàu công bố',
  maintenanceApprovalDate: 'Ngày duyệt bảo trì', safetyAssessmentDate: 'Ngày đánh giá an toàn',
  lastInspectionDate: 'Ngày kiểm tra gần nhất', operatingPierCount: 'Số cầu đang khai thác',
  publishedPierCount: 'Số cầu công bố', investmentAgreementPierCount: 'Số cầu thỏa thuận đầu tư',
  cargoThroughput: 'Sản lượng hàng hóa', receivesLargeVessel: 'Nhận tàu lớn',
  documentNumber: 'Số văn bản', documentDate: 'Ngày văn bản',
  openingAnnouncementDate: 'Ngày công bố mở', openingDecision: 'Quyết định mở',
  investmentAgreementDoc: 'Thỏa thuận đầu tư', waterAreaNeutralScope: 'Phạm vi khu nước',
  coordinateSystem: 'Hệ quy chiếu', displayRule: 'Quy tắc hiển thị',
  spatialId: 'Vị trí không gian', 'Trạng thái': 'Hành động',
  // Backend (chuẩn VTS CHK) writes these GIS/attachment rows with the literal Vietnamese
  // label as changedField; explicit key === label keeps histField / search / sort stable.
  'Tọa độ GIS': 'Tọa độ GIS',
  'Loại đối tượng GIS': 'Loại đối tượng GIS',
  'Tài liệu đính kèm': 'Tài liệu đính kèm',
};

const HISTORY_FIELD_ORDER = ['orgUnitId', 'portId', 'berthId', 'pierCode', 'pierName', 'pierType', 'length', 'width', 'designLoad', 'operationalFunction', 'operationalStatus', 'province', 'detailedLocation', 'coordinateSystem', 'displayRule', 'mapSymbolId', 'constructionGrade', 'structureType', 'conditionStatus', 'currentWaterDepth', 'designBedElevation', 'publishedVesselDWT', 'maintenanceApprovalDate', 'safetyAssessmentDate', 'lastInspectionDate', 'operatingPierCount', 'publishedPierCount', 'investmentAgreementPierCount', 'cargoThroughput', 'receivesLargeVessel', 'documentNumber', 'documentDate', 'openingAnnouncementDate', 'openingDecision', 'investmentAgreementDoc', 'waterAreaNeutralScope', 'navigationChannelId'];

export function normalizeHistoryKey(value: string): string {
  return (value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');
}

export function histField(fn: string): string {
  if (histLabels[fn]) return histLabels[fn];
  const targetKey = normalizeHistoryKey(fn);
  for (const [k, v] of Object.entries(histLabels)) {
    if (normalizeHistoryKey(k) === targetKey || normalizeHistoryKey(v) === targetKey) return v;
  }
  return fn;
}

export function histVal(
  fn: string,
  val: string | null,
  orgMap?: Map<string, string>,
  symbolMap?: Map<string, string>,
  portMap?: Map<string, string>,
  berthMap?: Map<string, string>,
  waterwayMap?: Map<string, string>
): string {
  if (!val || val === '(null)' || val === 'null' || val === '-' || val === '—' || val === '–') return '';
  const normKey = normalizeHistoryKey(fn);

  if (normKey === 'operationalfunction' || normKey === 'congnang' || normKey === 'congnangkhaithac' || normKey === 'cong nang' || normKey === 'cong nang khai thac') {
    return formatOperationalFunction(val, '');
  }
  if ((normKey === 'orgunitid' || normKey === 'donviquanly' || normKey === 'don vi quan ly' || normKey === 'don vi') && orgMap) {
    const f = orgMap.get(val);
    return f ? f.split(' - ').pop() || f : val;
  }
  if ((normKey === 'portid' || normKey === 'cangbien' || normKey === 'cang bien' || normKey === 'thuoc cang bien') && portMap) {
    return portMap.get(val) || val;
  }
  if ((normKey === 'berthid' || normKey === 'bencang' || normKey === 'ben cang' || normKey === 'thuoc ben cang') && berthMap) {
    return berthMap.get(val) || val;
  }
  if ((normKey === 'mapsymbolid' || normKey === 'bieutuong' || normKey === 'bieu tuong' || normKey === 'ky hieu ban do') && symbolMap) {
    return symbolMap.get(val) || val;
  }
  if ((normKey === 'navigationchannelid' || normKey === 'luonghanghai' || normKey === 'luong hang hai' || normKey === 'thuoc luong hang hai') && waterwayMap) {
    return waterwayMap.get(val) || val;
  }
  if (
    normKey === 'structuretype' ||
    normKey === 'structure_type' ||
    normKey === 'loaiketcau' ||
    normKey === 'loai ket cau' ||
    normKey === 'loai ket cau cau cang' ||
    normKey === 'loai ket cau ben cang'
  ) {
    const trimmedVal = val.trim();
    const opt = STRUCTURE_TYPE_OPTIONS.find((o) => o.value === Number(trimmedVal));
    if (opt) return opt.label;
    const m: Record<string, string> = {
      '1': 'Kết cấu bệ cọc cao',
      '2': 'Kết cấu cường từ',
      '3': 'Kết cấu trọng lực',
      '4': 'Kết cấu khác',
    };
    return m[trimmedVal] || val;
  }
  if (
    normKey === 'constructiongrade' ||
    normKey === 'construction_grade' ||
    normKey === 'phancapcongtrinh' ||
    normKey === 'phan cap cong trinh' ||
    normKey === 'cap cong trinh'
  ) {
    const trimmedVal = val.trim();
    const opt = CONSTRUCTION_GRADE_OPTIONS.find((o) => o.value === Number(trimmedVal));
    if (opt) return opt.label;
    const m: Record<string, string> = {
      '1': 'Cấp đặc biệt',
      '2': 'Cấp 1',
      '3': 'Cấp 2',
      '4': 'Cấp 3',
      '5': 'Cấp 4',
    };
    return m[trimmedVal] || val;
  }
  if (
    normKey === 'conditionstatus' ||
    normKey === 'condition_status' ||
    normKey === 'tinhtrangkythuat' ||
    normKey === 'tinh trang ky thuat' ||
    normKey === 'tinh trang hoat dong'
  ) {
    return themeTokenChk.getConditionStatusLabel(val);
  }
  if (
    normKey === 'approvalstatus' ||
    normKey === 'approval_status' ||
    normKey === 'trangthai' ||
    normKey === 'trang thai' ||
    normKey === 'trang thai phe duyet'
  ) {
    const m: Record<string, string> = {
      DRAFT: 'Lưu tạm',
      PENDING_APPROVAL: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
      APPROVED_LEVEL1: 'Chờ phê duyệt cấp Cục',
      APPROVED: 'Đã phê duyệt',
      REJECTED_LEVEL1: 'Từ chối cấp Cảng vụ/Chi cục',
      REJECTED_LEVEL2: 'Từ chối cấp Cục',
      ARCHIVED: 'Đã xóa',
    };
    return m[val?.toUpperCase()] || val;
  }
  if (
    normKey === 'operationalstatus' ||
    normKey === 'operational_status' ||
    normKey === 'tinhtrang' ||
    normKey === 'tinh trang' ||
    normKey === 'tinh trang khai thac'
  ) {
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
    return m[val?.toUpperCase()] || val;
  }
  if (
    normKey === 'piertype' ||
    normKey === 'pier_type' ||
    normKey === 'loaicau' ||
    normKey === 'loai cau' ||
    normKey === 'loai cau cang'
  ) {
    const m: Record<string, string> = {
      CONTAINER: 'Container',
      TONG_HOP: 'Tổng hợp',
      HANH_KHACH: 'Hành khách',
      CHUYEN_DUNG_XANG_DAU: 'Chuyên dùng xăng dầu',
      CHUYEN_DUNG_ROI_QUANG: 'Chuyên dùng rời/quặng',
      KHAC: 'Khác',
    };
    return m[val?.toUpperCase()] || val;
  }
  if (
    normKey === 'province' ||
    normKey === 'provinceid' ||
    normKey === 'province_id' ||
    normKey === 'tinh/thanh pho' ||
    normKey === 'tinh thanh pho'
  ) {
    const num = Number(val.trim());
    if (!isNaN(num) && VIETNAM_PROVINCES[num - 1]) return VIETNAM_PROVINCES[num - 1];
    return val;
  }
  if (
    normKey === 'coordinatesystem' ||
    normKey === 'coordinate_system' ||
    normKey === 'hequychieu' ||
    normKey === 'he quy chieu'
  ) {
    const m: Record<string, string> = { '1': 'WGS-84', '2': 'VN-2000' };
    return m[val.trim()] || val;
  }
  if (
    normKey === 'receiveslargevessel' ||
    normKey === 'receives_large_vessel' ||
    normKey === 'nhantau lon' ||
    normKey === 'tiep nhan tau lon'
  ) {
    return val === 'true' ? 'Có' : val === 'false' ? 'Không' : val;
  }
  if (normKey.endsWith('at') || normKey.endsWith('date') || normKey.includes('ngay')) {
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

export function formatPierHistoryValue(
  fn: string,
  raw: string | null,
  orgMap?: Map<string, string>,
  symbolMap?: Map<string, string>,
  portMap?: Map<string, string>,
  berthMap?: Map<string, string>,
  waterwayMap?: Map<string, string>
): string | null {
  if (raw === null || raw === '(null)' || raw === '') return null;
  const t = raw.trim();
  if (t.startsWith('[') && t.endsWith(']')) {
    if (t === '[]') return 'Không có';
    const parts = t.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean);
    return `${parts.length} hạng mục`;
  }
  if (fn === 'operationalFunction') {
    const mapped = formatOperationalFunction(raw, '');
    return mapped || null;
  }
  const mapped = histVal(fn, raw, orgMap, symbolMap, portMap, berthMap, waterwayMap);
  if (mapped !== raw && mapped !== '') {
    return mapped;
  }
  if (/^-?\d+(\.\d+)?$/.test(t) || t === '100000000000000000000' || t === '10000000000000000000' || t.includes('100.000.000.000.000.000.000') || t.includes('100,000,000,000,000,000,000')) {
    return formatHistoryNumber(t);
  }
  return mapped;
}

export default function PierListPage() {
  const [searchParams] = useSearchParams();
  const linkedAction = searchParams.get('action');
  const linkedRecordId = searchParams.get('id');
  const isEmbeddedAction = window.self !== window.top
    && (linkedAction === 'detail' || linkedAction === 'edit')
    && !!linkedRecordId;
  const currentUser = useAuthStore((s: any) => s.user);
  const hasPerm = usePermissionStore((s: any) => s.hasPermission);
  const isAdmin = hasPerm?.('*') || hasPerm?.('admin:all');
  const canSaveAndApprove = checkCanSaveAndApprove('pier', hasPerm, currentUser) || (isAdmin && isCucLevelUser(currentUser));
  const defaultOrgUnitRef = useRef<string | undefined>(undefined);
  const [orgUnit, setOrgUnit] = useState<string | undefined>(undefined);
  const [pierNameInput, setPierNameInput] = useState('');
  const [pierCodeInput, setPierCodeInput] = useState('');
  const [filterBerthId, setFilterBerthId] = useState<string | undefined>();
  const [filterPortId, setFilterPortId] = useState<string | undefined>();
  const [filterPierType, setFilterPierType] = useState<string | undefined>();
  const [filterProvince, setFilterProvince] = useState<string | undefined>();
  const [filterOperationalStatus, setFilterOperationalStatus] = useState<string | undefined>();
  const [filterWaterwayId, setFilterWaterwayId] = useState<string | undefined>();
  const [filterConstructionGrade, setFilterConstructionGrade] = useState<number | undefined>();
  const [filterStructureType, setFilterStructureType] = useState<number | undefined>();
  const [filterOperationalFunction, setFilterOperationalFunction] = useState<string | undefined>();
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState<string | undefined>();
  const [filterUpdatedTo, setFilterUpdatedTo] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState('all');
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<Pier[]>([]); const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false); const [isError, setIsError] = useState(false);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortDir, setSortDir] = useState<'asc' | 'desc' | undefined>(undefined);

  const sortOrderFor = useCallback((key: string): 'ascend' | 'descend' | null => {
    if (sortBy !== key || !sortDir) return null;
    return sortDir === 'asc' ? 'ascend' : 'descend';
  }, [sortBy, sortDir]);

  const handleSort = useCallback((field: string, direction: 'asc' | 'desc' | null) => {
    setSortBy(direction ? field : undefined);
    setSortDir(direction ?? undefined);
    setPage(1);
  }, []);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [rawUsers, setRawUsers] = useState<any[]>([]);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
  const [symbolMap, setSymbolMap] = useState<Map<string, string>>(new Map());
  const [symbolImageMap, setSymbolImageMap] = useState<Map<string, string>>(new Map());
  const orgMap = useMemo(() => { const m = new Map<string, string>(); organizations.forEach(o => m.set(o.id, o.name)); return m; }, [organizations]);
  const userOrgMap = useMemo(() => {
    const map = new Map<string, string>();
    rawUsers.forEach((u: any) => {
      const orgName = u.organizationName || u.orgUnitName || u.departmentName || (u.orgUnitId ? orgMap.get(u.orgUnitId) : undefined) || (u.organizationId ? orgMap.get(u.organizationId) : undefined);
      if (orgName) {
        if (u.id) {
          map.set(u.id, orgName);
          map.set(u.id.toLowerCase(), orgName);
        }
        if (u.username) {
          map.set(u.username, orgName);
          map.set(u.username.toLowerCase(), orgName);
        }
        if (u.fullName) {
          map.set(u.fullName, orgName);
          map.set(u.fullName.toLowerCase(), orgName);
        }
      }
    });
    return map;
  }, [rawUsers, orgMap]);
  const [berthOptions, setBerthOptions] = useState<{ value: string; label: string }[]>([]);
  const [waterwayMap, setWaterwayMap] = useState<Map<string, string>>(new Map());
  const [allPorts, setAllPorts] = useState<Array<{ id: string; portName?: string; portCode?: string; orgUnitId?: string }>>([]);
  const portMap = useMemo(() => {
    const m = new Map<string, string>();
    allPorts.forEach((o) => m.set(o.id, o.portName || o.portCode || o.id));
    return m;
  }, [allPorts]);
  const allPortOptions = useMemo(() => {
    return allPorts.map((p) => ({ value: p.id, label: p.portName || p.portCode || p.id }));
  }, [allPorts]);
  const portOptions = useMemo(() => {
    const filtered = (!orgUnit || orgUnit === '__all__')
      ? allPorts
      : allPorts.filter((p) => !p.orgUnitId || p.orgUnitId === orgUnit);
    return filtered.map((p) => ({ value: p.id, label: p.portName || p.portCode || p.id }));
  }, [allPorts, orgUnit]);
  const [historyBerthMap, setHistoryBerthMap] = useState<Map<string, string>>(new Map());
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
  const [createDrawerVisible, setCreateDrawerVisible] = useState(false);
  const [editPierId, setEditPierId] = useState<string | undefined>();
  const [editBaseStatus, setEditBaseStatus] = useState<string | undefined>();
  const [createForm] = Form.useForm();
  const pierFormRef = useRef<any>(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [detailRecord, setDetailRecord] = useState<Pier | null>(null);
  const [berthDetail, setBerthDetail] = useState<{ berthCode?: string; berthName?: string } | null>(null);
  const [detailFiles, setDetailFiles] = useState<any[]>([]);
  // ── Danh sách kết cấu hạ tầng thuộc cầu cảng (Cơ sở sửa chữa, đóng tàu) ──
  const [infrastructureList, setInfrastructureList] = useState<any[]>([]);
  const [infraDetail, setInfraDetail] = useState<{ type: string; record: any } | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<Pier | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRecord, setRejectingRecord] = useState<Pier | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submittingRecord, setSubmittingRecord] = useState<Pier | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionType, setActionType] = useState<'draft' | 'submit' | 'approve' | 'update'>('draft');
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvingRecord, setApprovingRecord] = useState<Pier | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<Pier | null>(null);
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
        const resolvedOld = histVal(fn, r?.oldValue, orgMap, symbolMap, portMap, historyBerthMap, waterwayMap);
        const resolvedNew = histVal(fn, r?.newValue, orgMap, symbolMap, portMap, historyBerthMap, waterwayMap);
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
  }, [historyRecords, historyFilters, orgMap, symbolMap, portMap, historyBerthMap, waterwayMap]);
  const hasActiveHistoryFilter = !!(historyFilters.keyword?.trim() || historyFilters.fromDate || historyFilters.toDate);

  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const appliedFiltersRef = useRef<{
    orgUnit?: string; search: string; pierName: string; pierCode: string; berthId?: string; portId?: string; pierType?: string;
    province?: string; operationalStatus?: string; approvalStatus?: string;
    waterwayId?: string; constructionGrade?: number; structureType?: number;
    operationalFunction?: string; updatedFrom?: string; updatedTo?: string;
  }>({ orgUnit: undefined, search: '', pierName: '', pierCode: '', berthId: undefined, portId: undefined, pierType: undefined, province: undefined, operationalStatus: undefined, approvalStatus: undefined, waterwayId: undefined, constructionGrade: undefined, structureType: undefined, operationalFunction: '', updatedFrom: undefined, updatedTo: undefined });

  const openHistory = useCallback(async (r: Pier) => {
    setHistoryTarget(r); setHistoryOpen(true); setHistoryLoading(true); setHistoryRecords([]);
    setHistoryFilters({ keyword: '' });
    try {
      const res = await api.get(`/v1/piers/${r.id}/history`);
      const d = res.data?.data; setHistoryRecords(Array.isArray(d?.changeHistory) ? d.changeHistory.filter((r: any) => r.fieldName !== 'CREATE') : []);
    } catch { toast.error('Không thể tải lịch sử'); } finally { setHistoryLoading(false); }
  }, []);

  const renderPierHistoryTimeline = (records: any[]) => {
    const q = (historyFilters.keyword || '').trim().toLowerCase();
    const from = historyFilters.fromDate || '';
    const to = historyFilters.toDate || '';
    const filtered = (Array.isArray(records) ? records : []).filter((r: any) => {
      if (q) {
        const fn = String(r?.changedField ?? r?.fieldName ?? '').toLowerCase();
        const rawOld = String(r?.previousValue ?? r?.oldValue ?? '').toLowerCase();
        const rawNew = String(r?.newValue ?? r?.value ?? '').toLowerCase();
        const label = histField(fn).toLowerCase();
        const resolvedOld = String(histVal(fn, r?.previousValue ?? r?.oldValue, orgMap, symbolMap, portMap, historyBerthMap, waterwayMap) || '').toLowerCase();
        const resolvedNew = String(histVal(fn, r?.newValue ?? r?.value, orgMap, symbolMap, portMap, historyBerthMap, waterwayMap) || '').toLowerCase();
        if (!fn.includes(q) && !rawOld.includes(q) && !rawNew.includes(q) && !label.includes(q) && !resolvedOld.includes(q) && !resolvedNew.includes(q)) return false;
      }
      if (from || to) {
        const ts = String(r?.changedAt ?? r?.createdAt ?? r?.approvedDate ?? '');
        if (from && ts.substring(0, 10) < from) return false;
        if (to && ts.substring(0, 10) > to) return false;
      }
      return true;
    });

    return renderStandardHistoryCards({
      records: filtered,
      fieldLabels: histLabels,
      groupOrder: HISTORY_FIELD_ORDER,
      formatValue: (fn, raw) => {
        if (fn === 'mapSymbolId' && raw && !isBlankOrDash(raw)) {
          const img = symbolImageMap.get(raw);
          const name = symbolMap.get(raw) || raw;
          return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {img ? <img src={img} alt="" style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 4 }} /> : null}
              {name}
            </span>
          );
        }
        const formatted = formatPierHistoryValue(fn, raw, orgMap, symbolMap, portMap, historyBerthMap, waterwayMap);
        return isBlankOrDash(formatted) ? '' : formatted;
      },
      resolveUnitName: (rec) => {
        const actor = String(
          rec.changedBy ||
          rec.changedByName ||
          rec.actor ||
          rec.userName ||
          rec.createdBy ||
          rec.approvedBy ||
          ''
        ).trim();
        const userUnit =
          userOrgMap.get(actor) ||
          userOrgMap.get(actor.toLowerCase()) ||
          rec.orgUnitName ||
          rec.unitName;
        if (userUnit) return userUnit.split(' - ').pop() || userUnit;
        const orgId = rec.orgUnitId;
        const orgName = orgId ? orgMap.get(orgId) : undefined;
        return (orgName ? (orgName.split(' - ').pop() || orgName) : (rec.orgUnitName || rec.unitName)) || '';
      },
      emptyMessage: hasActiveHistoryFilter ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận',
    });
  };

  const historyUpdateCount = useMemo(() => {
    return countStandardHistoryCards({
      records: filteredHistory,
      fieldLabels: histLabels,
      groupOrder: HISTORY_FIELD_ORDER,
      formatValue: (fn, raw) => {
        if (fn === 'mapSymbolId' && raw && !isBlankOrDash(raw)) {
          const img = symbolImageMap.get(raw);
          const name = symbolMap.get(raw) || raw;
          return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {img ? <img src={img} alt="" style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 4 }} /> : null}
              {name}
            </span>
          );
        }
        const formatted = formatPierHistoryValue(fn, raw, orgMap, symbolMap, portMap, historyBerthMap, waterwayMap);
        return isBlankOrDash(formatted) ? '' : formatted;
      },
      resolveUnitName: (rec) => {
        const actor = String(
          rec.changedBy ||
          rec.changedByName ||
          rec.actor ||
          rec.userName ||
          rec.createdBy ||
          rec.approvedBy ||
          ''
        ).trim();
        const userUnit =
          userOrgMap.get(actor) ||
          userOrgMap.get(actor.toLowerCase()) ||
          rec.orgUnitName ||
          rec.unitName;
        if (userUnit) return userUnit.split(' - ').pop() || userUnit;
        const orgId = rec.orgUnitId;
        const orgName = orgId ? orgMap.get(orgId) : undefined;
        return (orgName ? (orgName.split(' - ').pop() || orgName) : (rec.orgUnitName || rec.unitName)) || '';
      },
    });
  }, [filteredHistory, orgMap, symbolMap, portMap, historyBerthMap, waterwayMap, historyTarget, symbolImageMap, userOrgMap]);

  useEffect(() => {
    (async () => { try { const r = await organizationService.list({ pageSize: 1000 });
        const data = r.data || [];
        setOrganizations(data);
        if (data.length > 0) {
          const defaultId = resolveDefaultOrgUnitId(useAuthStore.getState().user, data);
          setOrgUnit(defaultId);
          defaultOrgUnitRef.current = defaultId;
          appliedFiltersRef.current = { ...appliedFiltersRef.current, orgUnit: defaultId };
          setPierNameInput('');
          setPierCodeInput('');
          setInitialLoadDone(true);
        } else {
          setInitialLoadDone(true);
        }
      } catch {
        setInitialLoadDone(true);
      } })();
    (async () => {
      try {
        const r = await userService.list({ pageSize: 1000 });
        const u = r.data || (r as any).content || [];
        setRawUsers(u);
        const m = new Map<string, string>();
        u.forEach((x: any) => m.set(x.id, x.fullName || x.username || x.id));
        setUserMap(m);
      } catch {}
    })();
    (async () => { try { const r = await symbolService.list({ page: 1, pageSize: 1000, status: 'active' }); const s = r.data || (r as any).content || []; const m = new Map<string, string>(); const imgMap = new Map<string, string>(); s.forEach((x: any) => { m.set(x.id, x.name); if (x.image) imgMap.set(x.id, x.image); }); setSymbolMap(m); setSymbolImageMap(imgMap); } catch {} })();
  }, []);

  useEffect(() => {
    (async () => { try { const params: any = { page: 1, pageSize: 1000 }; if (orgUnit && orgUnit !== '__all__') params.orgUnitId = orgUnit; if (filterPortId) params.portId = filterPortId; params.approvalStatus = 'APPROVED'; const r = await berthCRUD.search(params); setBerthOptions((r.data || []).map((b: any) => ({ value: b.id, label: b.berthName }))); } catch {} })();
  }, [orgUnit, filterPortId]);

  useEffect(() => {
    (async () => { try { const r = await berthCRUD.search({ page: 1, pageSize: 1000 }); const m = new Map<string, string>(); (r.data || []).forEach((b: any) => m.set(b.id, b.berthName)); setHistoryBerthMap(m); } catch {} })();
  }, []);

  useEffect(() => {
    navigationChannelCRUD.getOptions()
      .then((items) => {
        const m = new Map<string, string>();
        items.forEach(n => {
          const code = n.channelCode?.trim();
          const name = n.channelName?.trim();
          const label = code && name ? `${code} - ${name}` : (code || name || '');
          m.set(n.id, label);
        });
        setWaterwayMap(m);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    portCRUD.getOptions()
      .then((items) => setAllPorts(items || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (filterPortId && orgUnit && orgUnit !== '__all__') {
      const match = allPorts.find((p) => p.id === filterPortId);
      if (match && match.orgUnitId && match.orgUnitId !== orgUnit) {
        setFilterPortId(undefined);
      }
    }
  }, [orgUnit, filterPortId, allPorts]);

  const fetchCounts = useCallback(async (oid: string | undefined) => {
    try {
      const rs = await Promise.allSettled(TAB_STATUS_LIST.map(t => {
        if (t.key === 'all') {
          return pierCRUD.search({ orgUnitId: (oid && oid !== '__all__') ? oid : undefined, page: 1, pageSize: 1 });
        }
        if (t.key === 'DELETED') {
          return pierCRUD.search({ approvalStatus: 'DELETED', orgUnitId: (oid && oid !== '__all__') ? oid : undefined, page: 1, pageSize: 1 });
        }
        return pierCRUD.search({ approvalStatus: TAB_QUERY_MAP[t.key], orgUnitId: (oid && oid !== '__all__') ? oid : undefined, page: 1, pageSize: 1 });
      }));
      const c: Record<string, number> = {};
      rs.forEach((r, i) => {
        c[TAB_STATUS_LIST[i]?.key || 'all'] = r.status === 'fulfilled' ? r.value.total : 0;
      });
      const sumChildCounts = TAB_STATUS_LIST.filter((t) => t.key !== 'all').reduce((acc, t) => acc + (c[t.key] || 0), 0);
      c['all'] = sumChildCounts;
      setTabCounts(c);
    } catch {}
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true); setIsError(false);
    try {
      const r = await pierCRUD.search({
        orgUnitId: (orgUnit && orgUnit !== '__all__') ? orgUnit : undefined,
        pierName: pierNameInput.trim() || undefined,
        pierCode: pierCodeInput.trim() || undefined,
        berthId: filterBerthId,
        portId: filterPortId || undefined,
        pierType: filterPierType,
        province: filterProvince || undefined,
        status: filterOperationalStatus,
        approvalStatus: TAB_QUERY_MAP[activeTab],
        navigationChannelId: filterWaterwayId,
        constructionGrade: filterConstructionGrade,
        structureType: filterStructureType,
        operationalFunction: filterOperationalFunction || undefined,
        updatedFrom: filterUpdatedFrom,
        updatedTo: filterUpdatedTo,
        sortBy,
        sortDir,
        page, pageSize,
      });
      setDataSource(r.data); setTotal(r.total);
    } catch { setIsError(true); }
    finally { setIsLoading(false); }
  }, [orgUnit, pierNameInput, pierCodeInput, filterBerthId, filterPortId, filterPierType, filterProvince, filterOperationalStatus,
    filterWaterwayId, filterConstructionGrade, filterStructureType, filterOperationalFunction, filterUpdatedFrom, filterUpdatedTo,
    activeTab, page, pageSize, sortBy, sortDir]);

  useEffect(() => { if (initialLoadDone) void fetchData(); }, [fetchData, initialLoadDone]);
  useEffect(() => { void fetchCounts(orgUnit); }, [orgUnit, fetchCounts]);

  const handleFilterApply = useCallback(() => {
    setPierNameInput((prev) => prev.trim());
    setPierCodeInput((prev) => prev.trim());
    setPage(1);
    void fetchData();
    void fetchCounts(orgUnit);
  }, [fetchData, fetchCounts, orgUnit]);

  const handleFilterReset = useCallback(() => {
    const oid = defaultOrgUnitRef.current || '__all__';
    setOrgUnit(oid); setPierNameInput(''); setPierCodeInput('');
    setFilterPortId(undefined); setFilterBerthId(undefined); setFilterPierType(undefined);
    setFilterProvince(undefined); setFilterOperationalStatus(undefined);
    setFilterWaterwayId(undefined); setFilterConstructionGrade(undefined); setFilterStructureType(undefined);
    setFilterOperationalFunction(undefined); setFilterUpdatedFrom(undefined); setFilterUpdatedTo(undefined);
    setActiveTab('all'); setPage(1);
  }, []);
  const handleTabChange = useCallback((key: string) => { setActiveTab(key); setPage(1); }, []);

  const openDetailDrawer = useCallback(async (record: Pier) => {
    setDetailDrawerVisible(true); setDetailRecord(record); setDetailFiles([]); setBerthDetail(null); setInfrastructureList([]);
    try { const r = await api.get(`/v1/piers/${record.id}/attachments`); setDetailFiles(r.data?.data || []); } catch { setDetailFiles([]); }
    try { setDetailRecord(await pierCRUD.findById(record.id)); } catch {}
    if (record.berthId) { try { const b = await berthCRUD.findById(record.berthId); setBerthDetail(b); } catch { setBerthDetail(null); } }
    // ── Danh sách kết cấu hạ tầng thuộc cầu cảng: Cơ sở sửa chữa, đóng tàu (pierId) ──
    try {
      const r = await shipRepairYardCRUD.search({ page: 1, pageSize: 1000, pierId: record.id });
      setInfrastructureList((r.data || []).map((x: any) => ({ id: x.id, infraName: x.shipRepairYardName || x.name || '', infraType: 'COSO_SUACHUA' })));
    } catch { setInfrastructureList([]); }
  }, []);

  useEffect(() => {
    if (!isEmbeddedAction || !linkedRecordId) return;
    let cancelled = false;
    pierCRUD.findById(linkedRecordId)
      .then((record) => {
        if (cancelled) return;
        if (linkedAction === 'detail') {
          void openDetailDrawer(record);
        } else {
          setEditPierId(linkedRecordId);
          setEditBaseStatus(record.approvalStatus);
          setCreateDrawerVisible(true);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) toast.error(error instanceof Error ? error.message : 'Không tải được chi tiết cầu cảng');
      });
    return () => { cancelled = true; };
  }, [isEmbeddedAction, linkedAction, linkedRecordId, openDetailDrawer]);

  const notifyEmbeddedActionClosed = useCallback(() => {
    if (isEmbeddedAction) {
      window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
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
    setBerthDetail(null);
    notifyEmbeddedActionClosed();
  }, [notifyEmbeddedActionClosed]);

  // ── Chi tiết kết cấu hạ tầng (Cơ sở sửa chữa, đóng tàu) — drawer lồng 950 như bến phao ──
  const openInfraDetail = useCallback(async (id: string) => {
    try {
      const rec = await shipRepairYardCRUD.findById(id);
      setInfraDetail({ type: 'COSO_SUACHUA', record: rec });
    } catch { /* noop */ }
  }, []);

  const dd2dms = (dd: number) => { if (dd == null || isNaN(dd)) return { d: 0, m: 0, s: 0 }; const a = Math.abs(dd); return { d: Math.floor(a), m: Math.floor((a - Math.floor(a)) * 60), s: +((a - Math.floor(a) - Math.floor((a - Math.floor(a)) * 60) / 60) * 3600).toFixed(2) }; };

  const openDeleteModal = useCallback((record: Pier) => {
    setDeletingRecord(record);
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingRecord) return;
    setDeleteLoading(true);
    try {
      await pierCRUD.delete(deletingRecord.id);
      toast.success('Đã xóa cầu cảng');
      setDeleteModalOpen(false);
      setDeletingRecord(null);
      setPage(1);
      void fetchData();
      void fetchCounts(orgUnit);
    } catch (ex: unknown) {
      toast.error(ex instanceof Error ? ex.message : 'Xóa thất bại');
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingRecord, fetchData, fetchCounts, orgUnit]);

  const handleApprove = useCallback(async (record: Pier, content?: string) => {
    try {
      if (record.approvalStatus === 'PENDING_APPROVAL') {
        await pierApproval.approveC1(record.id, content);
      } else {
        await pierApproval.approveC2(record.id, content);
      }
      toast.success(record.approvalStatus === 'PENDING_APPROVAL' ? 'Đã phê duyệt cấp Cảng vụ/Chi cục' : 'Đã phê duyệt cấp Cục');
      setApproveModalOpen(false); setApprovingRecord(null); setPage(1); void fetchData(); void fetchCounts(orgUnit);
    }
    catch (ex: unknown) { toast.error(ex instanceof Error ? ex.message : 'Phê duyệt thất bại'); }
  }, [fetchData, fetchCounts, orgUnit]);

  const handleSubmitApproval = useCallback((record: Pier) => { setSubmittingRecord(record); setSubmitModalOpen(true); }, []);
  const confirmSubmitApproval = useCallback(async () => {
    if (!submittingRecord) return;
    try { await pierCRUD.update({ id: submittingRecord.id, saveAction: 'SUBMIT' } as any); toast.success('Đã gửi phê duyệt'); setSubmitModalOpen(false); setSubmittingRecord(null); setPage(1); void fetchData(); void fetchCounts(orgUnit); }
    catch (ex: unknown) { toast.error(ex instanceof Error ? ex.message : 'Gửi thất bại'); }
  }, [submittingRecord, fetchData, fetchCounts, orgUnit]);

  const openRejectModal = useCallback((record: Pier) => { setRejectingRecord(record); setRejectReason(''); setRejectError(''); setRejectModalOpen(true); }, []);
  const handleConfirmReject = useCallback(async () => {
    if (!rejectingRecord) return;
    if (!rejectReason || !rejectReason.trim()) {
      setRejectError('Vui lòng nhập lý do từ chối');
      return;
    }
    try {
      await pierApproval.rejectStage(rejectingRecord.id, rejectReason.trim());
      toast.success('Từ chối thành công');
      setRejectModalOpen(false);
      setRejectingRecord(null);
      setRejectReason('');
      setRejectError('');
      setPage(1);
      void fetchData(); void fetchCounts(orgUnit);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
    }
  }, [rejectingRecord, rejectReason, fetchData, fetchCounts, orgUnit]);

  const filterContent = (
    <>
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
          value={orgUnit}
          onChange={(v) => { setOrgUnit(v); setFilterPortId(undefined); setFilterBerthId(undefined); setPage(1); }}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tên cầu cảng</div>
        <Input style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }} placeholder="Tìm theo tên cầu cảng"
          value={pierNameInput} onChange={e => setPierNameInput(e.target.value)}
          onBlur={() => setPierNameInput(prev => prev.trim())}
          onPressEnter={handleFilterApply}
          allowClear prefix={<SearchOutlined style={{ color: textTertiary }} />} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tình trạng</div>
        <Select style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }} placeholder="Chọn tình trạng" allowClear
          value={filterOperationalStatus} onChange={v => setFilterOperationalStatus(v)}
          options={[{ value: 'OPERATIONAL', label: 'Đang khai thác/vận hành' }, { value: 'NOT_YET_OPERATIONAL', label: 'Chưa khai thác/vận hành' }, { value: 'SUSPENDED', label: 'Dừng khai thác/vận hành' }]} />
      </div>
      {filterCollapsed && (<>
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Thuộc cảng biển</div>
          <Select style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }} placeholder="Chọn cảng biển" allowClear
            value={filterPortId} onChange={v => { setFilterPortId(v); setFilterBerthId(undefined); }}
            options={portOptions} showSearch filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Thuộc bến cảng</div>
          <Select style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }} placeholder="Chọn bến cảng" allowClear
            value={filterBerthId} onChange={v => setFilterBerthId(v)}
            options={berthOptions} showSearch filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Thuộc luồng hàng hải</div>
          <Select style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }} placeholder="Chọn luồng hàng hải" allowClear showSearch
            value={filterWaterwayId} onChange={v => setFilterWaterwayId(v)}
            options={Array.from(waterwayMap.entries()).map(([id, name]) => ({ value: id, label: name }))}
            filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Mã cầu cảng</div>
          <Input style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }} placeholder="Tìm theo mã cầu cảng"
            value={pierCodeInput} onChange={e => setPierCodeInput(e.target.value)}
            onBlur={() => setPierCodeInput(prev => prev.trim())}
            onPressEnter={handleFilterApply}
            allowClear prefix={<SearchOutlined style={{ color: textTertiary }} />} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Phân cấp công trình</div>
          <Select style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }} placeholder="Chọn phân cấp" allowClear
            value={filterConstructionGrade} onChange={v => setFilterConstructionGrade(v)}
            options={CONSTRUCTION_GRADE_OPTIONS} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Loại kết cấu cầu cảng</div>
          <Select style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }} placeholder="Chọn loại kết cấu" allowClear
            value={filterStructureType} onChange={v => setFilterStructureType(v)}
            options={STRUCTURE_TYPE_OPTIONS} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Công năng khai thác</div>
          <Select style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }} allowClear showSearch optionFilterProp="label" placeholder="Chọn công năng khai thác"
            options={OPERATIONAL_FUNCTION_OPTIONS} value={filterOperationalFunction} onChange={v => setFilterOperationalFunction(v)} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Địa điểm (Tỉnh/Thành Phố)</div>
          <Select style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }} placeholder="Chọn tỉnh/thành phố" allowClear showSearch
            value={filterProvince} onChange={v => setFilterProvince(v)}
            filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())}
            options={VIETNAM_PROVINCES.map(p => ({ value: p, label: p }))} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Ngày cập nhật</div>
          <DatePicker.RangePicker
            format="DD/MM/YYYY"
            placeholder={['Từ ngày', 'Đến ngày']}
            allowClear
            classNames={{ popup: { root: 'chk-range-datepicker-popup' } }}
            classNames={{ popup: { root: 'chk-range-datepicker-popup' } }}
            value={[filterUpdatedFrom ? dayjs(filterUpdatedFrom) : null, filterUpdatedTo ? dayjs(filterUpdatedTo) : null]}
            onChange={(dates) => {
              setFilterUpdatedFrom(dates?.[0] ? dates[0].format('YYYY-MM-DD 00:00:00') : undefined);
              setFilterUpdatedTo(dates?.[1] ? dates[1].format('YYYY-MM-DD 23:59:59') : undefined);
              setPage(1);
            }}
            style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
          />
        </div>
      </>)}
    </>
  );

  // ── rowActions callback (Port pattern) ──────────────────────────
  // Thứ tự: Xem chi tiết → Chỉnh sửa → Lịch sử → Phê duyệt/Từ chối → Xóa
  const rowActions = useCallback((record: Pier) => {
    const actions: any[] = [{ key: 'view', label: 'Xem chi tiết', icon: icons.view, onClick: () => openDetailDrawer(record) }];
    if (isDeletedPier(record)) {
      const deletedActions: any[] = [
        { key: 'view', label: 'Xem chi tiết', icon: icons.view, onClick: () => openDetailDrawer(record) },
      ];
      if (hasPerm('pier:history')) {
        deletedActions.push({ key: 'history', label: 'Lịch sử', icon: icons.history, onClick: () => openHistory(record) });
      }
      return deletedActions;
    }
    const st = record.approvalStatus || '';
    const editable = canEditApprovalRecord(record.approvalStatus, { hasPerm, resource: 'pier' });
    if (editable) actions.push({ key: 'edit', label: 'Chỉnh sửa', icon: icons.edit, onClick: () => { setEditPierId(record.id); setEditBaseStatus(record.approvalStatus); setCreateDrawerVisible(true); } });
    if (['DRAFT','NHAP'].includes(st) && hasPerm('pier:update')) actions.push({ key: 'submit', label: 'Gửi Cảng vụ phê duyệt', icon: icons.submit, onClick: () => handleSubmitApproval(record) });
    if (['REJECTED_LEVEL1','REJECTED_LEVEL2'].includes(st) && hasPerm('pier:update')) actions.push({ key: 'resubmit', label: 'Gửi lại phê duyệt', icon: icons.submit, onClick: () => handleSubmitApproval(record) });
    if (hasPerm('pier:history')) actions.push({ key: 'history', label: 'Lịch sử', icon: icons.history, onClick: () => openHistory(record) });
    if (hasPerm('pier:approvec1') && st === 'PENDING_APPROVAL') {
      actions.push({ key: 'approve_c1', label: 'Phê duyệt cấp Cảng vụ/Chi cục', icon: icons.approve, onClick: () => { setApprovingRecord(record); setApproveModalOpen(true); } });
      actions.push({ key: 'reject_c1', label: 'Từ chối cấp Cảng vụ/Chi cục', icon: icons.reject, danger: true, onClick: () => openRejectModal(record) });
    }
    if (hasPerm('pier:approvec2') && st === 'APPROVED_LEVEL1') {
      actions.push({ key: 'approve_c2', label: 'Phê duyệt cấp Cục', icon: icons.approve, onClick: () => { setApprovingRecord(record); setApproveModalOpen(true); } });
      actions.push({ key: 'reject_c2', label: 'Từ chối cấp Cục', icon: icons.reject, danger: true, onClick: () => openRejectModal(record) });
    }
    if (canDeleteApprovalRecord(record.approvalStatus, { hasPerm, resource: 'pier', extraDeletePerms: ['port:delete', 'pier:delete'] }) || (['DRAFT','NHAP'].includes(st) && (hasPerm('pier:delete') || hasPerm('port:delete') || hasPerm('data:delete')))) actions.push({ key: 'delete', label: 'Xóa', icon: icons.delete, danger: true, onClick: () => openDeleteModal(record) });
    return actions;
  }, [hasPerm, openDetailDrawer, openHistory, handleSubmitApproval, openRejectModal, openDeleteModal]);

  const auditColumns = useMemo(() => {
    return [
      { label: 'Cán bộ gửi Phê duyệt', dataIndex: 'submittedForApprovalAt', key: 'submittedForApprovalAt', width: 230, sortable: true,
        render: (v: string | null, record: Pier) => {
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
      { label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục', dataIndex: 'portAuthorityApprovedAt', key: 'portAuthorityApprovedAt', width: 350, sortable: true,
        render: (v: string | null, record: Pier) => {
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
      { label: 'Cán bộ phê duyệt cấp Cục', dataIndex: 'departmentApprovedAt', key: 'departmentApprovedAt', width: 260, sortable: true,
        render: (v: string | null, record: Pier) => {
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
    ];
  }, [userMap]);

  const columns = useMemo(() => {
    const baseColumns: any[] = [
    { label: 'STT', key: 'stt', width: 60, fixed: 'left' as const, align: 'center' as const,
      render: (_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{(page - 1) * pageSize + i + 1}</span> },
    { label: <span>Tên/Mã cầu cảng</span>, dataIndex: 'pierName', key: 'pierName', width: 260, fixed: 'left' as const, sortable: true, ellipsis: false,
      render: (v: string, record: Pier) => (
        <div>
          <a title={v || ''} onClick={(e) => { e.stopPropagation(); openDetailDrawer(record); }} style={{ ...cellTitleStyle, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}>{v || ''}</a>
          <span style={{ ...cellSubtitleStyle, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.pierCode || ''}</span>
        </div>
      ) },
    { label: 'Đơn vị quản lý', dataIndex: 'orgUnitId', key: 'orgUnitId', width: 260, sortable: true,
      render: (v: string | null, r: Pier) => <span style={{ fontWeight: fontWeightBold }}>{resolveOrgLevel2Name(organizations, r.orgUnitId) || orgMap.get(v || '') || ''}</span> },
    { label: 'Loại kết cấu cầu cảng', dataIndex: 'structureType', key: 'structureType', width: 240,
      render: (v?: number) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v != null ? (STRUCTURE_TYPE_OPTIONS.find(o => o.value === v)?.label || v.toString()) : ''}</span> },
    { label: 'Thuộc cảng biển', dataIndex: 'portId', key: 'portId', width: 200,
      render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{portMap.get(v || '') || v || ''}</span> },
    { label: 'Thuộc bến cảng', dataIndex: 'berthName', key: 'berthName', width: 210,
      render: (v: string, r: Pier) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || r.tenBenCang || berthOptions.find(b => b.value === r.berthId)?.label || r.berthId || ''}</span> },
    { label: 'Thuộc luồng hàng hải', dataIndex: 'navigationChannelId', key: 'navigationChannelId', width: 280, ellipsis: true,
      render: (v?: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v ? (waterwayMap.get(v) || v) : ''}</span> },
    { label: 'Địa điểm (Tỉnh/Thành phố)', dataIndex: 'province', key: 'province', width: 250,
      render: (v?: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || ''}</span> },
    { label: 'Phân cấp công trình', dataIndex: 'constructionGrade', key: 'constructionGrade', width: 220,
      render: (v?: number) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v != null ? (CONSTRUCTION_GRADE_OPTIONS.find(o => o.value === v)?.label || v.toString()) : ''}</span> },
    { label: 'Công năng khai thác', dataIndex: 'operationalFunction', key: 'operationalFunction', width: 240, ellipsis: true,
      render: (v?: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{formatOperationalFunction(v, '')}</span> },
    { label: 'Tình trạng', dataIndex: 'operationalStatus', key: 'operationalStatus', width: 240, ellipsis: false,
      render: (v: string) => { const b = v && OPERATIONAL_STYLE_MAP[v]; return b ? <span style={statusBadgeStyle(b.color)}>{b.label}</span> : null; } },
    ];
    const tailColumns: any[] = [
      { label: 'Trạng thái', dataIndex: 'approvalStatus', key: 'approvalStatus', width: 260, ellipsis: false,
        render: (v: string, record: Pier) => {
          if (isDeletedPier(record)) {
            return <span style={statusBadgeStyle(statusCritical)}>Đã xóa</span>;
          }
          const s = v && (APPROVAL_STYLE_MAP[v] || APPROVAL_STYLE_MAP[v.toUpperCase()]);
          return s ? <span style={statusBadgeStyle(s.color)}>{s.label}</span> : null;
        } },
      { label: 'Cán bộ cập nhật', dataIndex: 'updatedAt', key: 'updatedAt', width: 190, sortable: true,
        render: (v: string, record: Pier) => (
          <div>
            <span style={{ fontWeight: fontWeightBold }}>{userMap.get(record.updatedBy || '') || record.updatedBy || ''}</span><br />
            <span style={{ opacity: 0.85 }}>{formatDate(v)}</span>
          </div>
        ) },
    ];
    const allColumns = [...baseColumns, ...tailColumns, ...auditColumns];
    return allColumns.map(col => ({
      ...col,
      sortOrder: col.sortable ? sortOrderFor(col.key) : undefined,
    }));
  }, [page, pageSize, organizations, orgMap, berthOptions, portMap, waterwayMap, userMap, auditColumns, sortOrderFor, openDetailDrawer]);

  const headerActions = useMemo(() => {
    const actions: Array<{ key: string; label: string; variant: 'primary' | 'outline' | 'subtle'; icon?: React.ReactNode; onClick: () => void }> = [];
    if (hasPerm('pier:create')) {
      actions.push({ key: 'create', label: 'Thêm mới', variant: 'primary', icon: icons.create, onClick: () => setCreateDrawerVisible(true) });
    }
    return actions;
  }, [hasPerm]);

  return (
    <ThemeTokenProvider tokens={{ ...themeTokenChk, fontSizeMd } as unknown as ThemeToken}>
    <div className="pier-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <style>{`
        .range-single-panel .ant-picker-panel-container .ant-picker-panel:last-child { display: none !important; }

        .pier-page-wrapper,
        .pier-page-wrapper .ant-table,
        .pier-page-wrapper .ant-table-cell,
        .pier-page-wrapper .ant-table-thead > tr > th,
        .pier-page-wrapper .ant-table-tbody > tr > td,
        .pier-page-wrapper .ant-input,
        .pier-page-wrapper .ant-select,
        .pier-page-wrapper .ant-select-selection-item,
        .pier-page-wrapper .ant-select-item-option-content,
        .pier-page-wrapper .ant-picker,
        .pier-page-wrapper .ant-picker-input > input,
        .pier-page-wrapper .ant-btn,
        .pier-page-wrapper .ant-pagination,
        .pier-page-wrapper .ant-pagination-item,
        .pier-page-wrapper .ant-pagination-total-text,
        .pier-page-wrapper .ant-breadcrumb,
        .pier-page-wrapper .ant-form-item-label > label,
        .pier-page-wrapper .ant-tabs-tab,
        .pier-page-wrapper .pier-drawer-scope,
        .pier-page-wrapper .pier-drawer-scope .ant-drawer-content,
        .pier-page-wrapper .pier-drawer-scope .ant-tabs-tab,
        .pier-page-wrapper .pier-drawer-scope .ant-input,
        .pier-page-wrapper .pier-drawer-scope .ant-select,
        .pier-page-wrapper .pier-drawer-scope .ant-btn,
        .pier-page-wrapper .pier-drawer-scope .ant-table,
        .pier-page-wrapper .pier-drawer-scope .ant-table-cell,
        .pier-page-wrapper .pier-drawer-scope .ant-table-thead > tr > th,
        .pier-page-wrapper .pier-drawer-scope .ant-form-item-label > label {
          font-size: 13.5px !important;
        }
        /* ── Drawer tạo/sửa/chi tiết (antd Drawer render panel ở body portal, ngoài .pier-page-wrapper) ── */
        .pier-drawer-scope,
        .pier-drawer-scope .ant-drawer-content,
        .pier-drawer-scope .ant-tabs-tab,
        .pier-drawer-scope .ant-drawer-content .ant-form-item-label > label,
        .pier-drawer-scope .chk-detail-label,
        .pier-drawer-scope .chk-detail-value,
        .pier-drawer-scope .ant-table,
        .pier-drawer-scope .ant-table-cell,
        .pier-drawer-scope .ant-table-thead > tr > th,
        .pier-drawer-scope .ant-table-tbody > tr > td,
        .pier-drawer-scope .ant-input,
        .pier-drawer-scope .ant-select,
        .pier-drawer-scope .ant-btn {
          font-size: 13.5px !important;
        }
        .pier-page-wrapper div:has(> button[aria-pressed]) {
          display: flex !important;
          flex-wrap: nowrap !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          justify-content: safe center !important;
          align-items: center !important;
          scrollbar-width: thin !important;
          scrollbar-color: #cbd5e1 #f8fafc !important;
          padding: 2px 8px 4px 8px !important;
          gap: clamp(6px, 1vw, 14px) !important;
        }
        .pier-page-wrapper div:has(> button[aria-pressed]) > button {
          white-space: nowrap !important;
          flex-shrink: 0 !important;
          cursor: pointer !important;
          padding: 4px 2px !important;
        }
        .pier-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar {
          height: 4px !important;
          display: block !important;
        }
        .pier-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-track {
          background: #f1f5f9 !important;
          border-radius: 999px !important;
        }
        .pier-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb {
          background: #cbd5e1 !important;
          border-radius: 999px !important;
        }
        .pier-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb:hover {
          background: #94a3b8 !important;
        }
        /* ── Responsive Drawers: Không tràn viền khi màn hình nhỏ / zoom cao (đồng bộ Cảng biển) ── */
        .pier-drawer-scope .ant-drawer-content-wrapper {
          max-width: 100vw !important;
        }
        @media (max-width: 1024px) {
          .pier-drawer-scope .chk-detail-grid {
            grid-template-columns: 1fr !important;
            column-gap: 0 !important;
          }
          .pier-drawer-scope .chk-detail-row--full {
            grid-column: 1 !important;
          }
        }
        @media (max-width: 640px) {
          .pier-drawer-scope .chk-detail-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 4px !important;
            padding: 8px 0 !important;
          }
          .pier-drawer-scope .chk-detail-label {
            width: 100% !important;
          }
          .pier-drawer-scope .chk-detail-value {
            width: 100% !important;
          }
        }
        /* Label dài (2 dòng) đủ chỗ, KHÔNG mất chữ, label 1 dòng nằm sát đỉnh:
           dành min-height cho khung .ant-form-item-label (chữ label con canh top bằng align-items:flex-start),
           không ép cao lên chính <label> để tránh chữ bị căn giữa lệch dòng trên/dưới. */
        .pier-drawer-scope .ant-form-item.cn-op-2line-label .ant-form-item-label {
          height: auto !important;
          min-height: 44px !important;
          align-items: flex-start !important;
        }
        .pier-drawer-scope .ant-form-item.cn-op-2line-label .ant-form-item-label > label {
          height: auto !important;
          white-space: normal !important;
          line-height: 1.45 !important;
          overflow-wrap: break-word;
        }
      `}</style>
      <ScreenHeader breadcrumb={[{ label: 'Tài sản KCHTGT' }, { label: 'Cầu cảng' }]}
        actions={headerActions} />
      <FilterTableLayout filterContent={filterContent}
        statusTabs={TAB_STATUS_LIST.map(t => ({ key: t.key, label: t.label, color: t.color, count: tabCounts[t.key] ?? 0, active: activeTab === t.key }))}
        onStatusTabChange={handleTabChange} onFilterApply={handleFilterApply} onFilterReset={handleFilterReset}
        filterCollapsed={filterCollapsed} onToggleCollapse={() => setFilterCollapsed(!filterCollapsed)}
        loading={isLoading} error={isError} onRetry={() => void fetchData()}>
        <DataTable
          columns={columns}
          dataSource={dataSource}
          rowKey="id"
          rowActions={rowActions}
          loading={false}
          onSort={handleSort}
          scroll={{ x: 'max-content' }}
        />
        <Pagination total={total} current={page} pageSize={pageSize} onChange={(p, ps) => { setPage(p); setPageSize(ps); }} />
      </FilterTableLayout>

      <AppDrawer rootClassName="pier-drawer-scope" className="pier-drawer-scope" width={DRAWER_WIDTH} title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>{editPierId ? 'Chỉnh sửa thông tin Cầu cảng' : 'Thêm mới Cầu cảng'}</span>} open={createDrawerVisible} destroyOnHidden
        onClose={closeFormDrawer}
        afterOpenChange={(open) => { if (!open) { setEditPierId(undefined); setEditBaseStatus(undefined); } }}
        footer={<div style={drawerFooterStyle}>{(() => {
          const st = !editPierId ? 'DRAFT' : (editBaseStatus ? normalizeApprovalStatus(editBaseStatus) : 'DRAFT');
          if (st === 'APPROVED') {
            return canSaveAndApprove ? <Button htmlType="button" type="primary" onClick={() => { setActionType('approve'); pierFormRef.current?.submit('APPROVED'); }} loading={submitting && actionType === 'approve'} style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}>Lưu và phê duyệt</Button> : null;
          }
          if (st === 'REJECTED_LEVEL1' || st === 'REJECTED_LEVEL2') {
            return <Button htmlType="button" type="primary" onClick={() => { setActionType('submit'); pierFormRef.current?.submit('SUBMIT'); }} loading={submitting && actionType === 'submit'} style={primaryButtonStyle}>Lưu và gửi phê duyệt</Button>;
          }
          // Lưu tạm hoặc tạo mới
          return <><Button htmlType="button" onClick={() => { setActionType('draft'); pierFormRef.current?.submit('DRAFT'); }} loading={submitting && actionType === 'draft'} style={outlineButtonStyle}>Lưu tạm</Button><Button htmlType="button" type="primary" onClick={() => { setActionType('submit'); pierFormRef.current?.submit('SUBMIT'); }} loading={submitting && actionType === 'submit'} style={primaryButtonStyle}>Lưu và gửi phê duyệt</Button>{canSaveAndApprove && <Button htmlType="button" type="primary" onClick={() => { setActionType('approve'); pierFormRef.current?.submit('APPROVED'); }} loading={submitting && actionType === 'approve'} style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}>Lưu và phê duyệt</Button>}</>;
        })()}</div>}
        styles={{ header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 }, body: { padding: '0 24px 12px 24px' } }}>
        <Form form={createForm} layout="vertical">
          <style>{requiredMarkStyle}</style>
          <PierForm ref={pierFormRef} form={createForm} id={editPierId} onFinish={() => { closeFormDrawer(); setSortBy(undefined); setSortDir(undefined); setPage(1); void fetchData(); void fetchCounts(orgUnit); }} onSubmittingChange={setSubmitting} />
        </Form>
      </AppDrawer>

      <AppDrawer rootClassName="pier-drawer-scope" className="pier-drawer-scope" width={DRAWER_WIDTH} title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>Chi tiết cầu cảng{detailRecord ? ` - ${detailRecord.pierName}` : ''}</span>} open={detailDrawerVisible}
        onClose={closeDetailDrawer}
        styles={{ header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 }, body: { padding: '0 24px 12px 24px' } }} footer={null}>
        {detailRecord && <PierDetailContent selectedRecord={detailRecord} orgMap={orgMap} portMap={portMap} berthOptions={berthOptions} symbolMap={symbolMap} symbolImageMap={symbolImageMap} detailFiles={detailFiles} ddToDms={dd2dms} approvalStyleMap={APPROVAL_STYLE_MAP} operationalStyleMap={OPERATIONAL_STYLE_MAP} userMap={userMap} waterwayMap={waterwayMap} berthDetail={berthDetail} organizations={organizations} infrastructureList={infrastructureList} onViewInfraDetail={openInfraDetail} operationPlanList={(detailRecord as any)?.operationPlanList} maintenancePlanList={(detailRecord as any)?.maintenancePlanList} incidentList={(detailRecord as any)?.incidentList} />}
      </AppDrawer>

      {/* ── Chi tiết kết cấu hạ tầng (Cơ sở sửa chữa, đóng tàu) — kích thước đồng bộ bằng Drawer cha ── */}
      <AppDrawer
        width={DRAWER_WIDTH}
        rootClassName="pier-drawer-scope"
        className="pier-drawer-scope"
        title={<span style={drawerTitleStyle}>Chi tiết kết cấu hạ tầng{infraDetail?.record ? ` - ${infraDetail.record.shipRepairYardName || ''}` : ''}</span>}
        open={!!infraDetail}
        onClose={() => setInfraDetail(null)}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px' },
        }}
        footer={null}
      >
        {infraDetail?.type === 'COSO_SUACHUA' && infraDetail.record ? (
          <ShipRepairYardDetailContent
            selectedRecord={infraDetail.record}
            orgMap={orgMap}
            organizations={organizations}
            symbolMap={symbolMap}
            symbolImageMap={symbolImageMap}
            portOptions={allPortOptions}
            userMap={userMap}
            detailFiles={[]}
            ddToDms={dd2dms}
            approvalStyleMap={APPROVAL_STYLE_MAP}
          />
        ) : null}
      </AppDrawer>

      {/* Xóa cầu cảng — giống Bến cảng (DeleteConfirmModal) */}
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
        itemType="cầu cảng"
        itemName={deletingRecord?.pierName}
        itemCode={deletingRecord?.pierCode}
      />

      <Modal styles={{ mask: { background: 'rgba(0, 0, 0, 0.4)' } }} title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Từ chối phê duyệt</span>}
        open={rejectModalOpen} onCancel={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); setRejectError(''); }}
        footer={[
          <Button key="cancel" onClick={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); setRejectError(''); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="reject" type="primary" danger onClick={handleConfirmReject}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Xác nhận từ chối</Button>,
        ]}
        width={480}>
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>Vui lòng nhập lý do từ chối cho cầu cảng:</p>
          {rejectingRecord && <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}><strong style={{ color: textPrimary }}>{rejectingRecord.pierCode} — {rejectingRecord.pierName}</strong></p>}
          <Input.TextArea placeholder="Nhập lý do từ chối..." value={rejectReason}
            onChange={(e) => { setRejectReason(e.target.value); setRejectError(''); }}
            rows={3} maxLength={500} style={{ borderRadius: 8, fontSize: fontSizeMd, borderColor: rejectError ? statusCritical : undefined }} />
          {rejectError ? <div style={{ marginTop: 4 }}><span style={{ color: statusCritical, fontSize: fontSizeMd }}>{rejectError}</span></div> : null}
        </div>
      </Modal>

      <Modal styles={{ mask: { background: 'rgba(0, 0, 0, 0.4)' } }}
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Gửi phê duyệt</span>}
        open={submitModalOpen} onCancel={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }}
        footer={[
          <Button key="cancel" onClick={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="submit" type="primary" onClick={confirmSubmitApproval}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>Xác nhận</Button>,
        ]}
        width={480}>
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary }}>
            Xác nhận gửi phê duyệt cầu cảng <strong>{submittingRecord?.pierName}</strong>?
          </p>
        </div>
      </Modal>

      {/* ── Approve Modal (chuẩn VTS CHK) ─────────────────────────── */}
      <ApprovalModal
        visible={approveModalOpen}
        level={approvingRecord?.approvalStatus === 'APPROVED_LEVEL1' ? 'c2' : 'c1'}
        onConfirm={(content) => { if (approvingRecord) handleApprove(approvingRecord, content); }}
        onCancel={() => { setApproveModalOpen(false); setApprovingRecord(null); }}
      />

      {/* ── History drawer (timeline theo chuẩn quản lý Cảng biển) ── */}
      <AppDrawer
        width={DRAWER_WIDTH}
        rootClassName="pier-drawer-scope"
        className="pier-drawer-scope"
        mask
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Space size={spaceSm} style={{ alignItems: 'center' }}>
              <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
              <span style={drawerTitleStyle}>
                Lịch sử thay đổi — {historyTarget?.pierName || historyTarget?.pierCode || ''}
              </span>
              <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeLg - 1, fontWeight: fontWeightBold, background: `${colors.sidebarBg}15`, color: colors.sidebarBg, lineHeight: '20px' }}>
                Tổng cộng {historyUpdateCount}
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
                onBlur={() => setHistoryFilters((p) => ({ ...p, keyword: (p.keyword || '').trim() }))}
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
          ) : hasActiveHistoryFilter && historyUpdateCount === 0 ? (
            <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
              <SearchOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
              <div style={{ color: textTertiary, fontSize: fontSizeMd }}>Không tìm thấy kết quả phù hợp</div>
            </div>
          ) : (
            renderPierHistoryTimeline(filteredHistory)
          )}
        </div>
      </AppDrawer>
    </div>
    </ThemeTokenProvider>
  );
}

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { PERMISSIONS } from '../../constants/permissions';
import {
  Alert,
  Button,
  Tag,
  Input,
  Select,
  Modal,
  Form,
  Typography,
  Descriptions,
  DatePicker,
} from 'antd';
import { OrgUnitTreeSelect, resolveOrgLevel2Name } from '../../components/org-unit';
import {
  PlusOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { berthCRUD, waterZoneCRUD, pierCRUD } from '../../services/portService';
import BerthDetailContent from '../../pages/port/BerthDetailContent';
import PierDetailContent from '../../pages/port/PierDetailContent';
import { userService } from '../../services/userService';
import { waterZoneApi } from '../../app/waterzone/api';
import { lineObjectService } from '../../services/lineObjectService';
import { LineObject } from '../../types/lineObject';
import {
  fetchCangBienList,
  deleteCangBien,
  approveCangBienC1,
  approveCangBienC2,

  rejectCangBien,
  fetchCangBienById,
  fetchportHistory,
} from './api';
import { portApproval } from '../portService';
import { trangThaiHoatDongBadge, trangThaiPheDuyetBadge } from './schema';
import type { CangBienResponse } from './types';
import toast from '../../components/ToastNotification';
import { organizationService } from '../../services/organizationService';
import { documentApi } from '../../app/document/api';
import DocumentUploadModal from '../../app/document/DocumentUploadModal';
import api from '../../services/api';
import dayjs from 'dayjs';
import { symbolService } from '../symbolService';
import { VIETNAM_PROVINCES } from '../../types/common';
import { ScreenHeader, DataTable, type ScreenHeaderAction } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
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
  fontSizeMd,
  fontSizeLg,
  fontWeightBold,
  spaceFormField,
  radiusPill,
  drawerTitleStyle,
  drawerFooterStyle,
  primaryButtonStyle,
  outlineButtonStyle,
  requiredMarkStyle,
  icons,
} from '../../themetokenchk';
import { usePermissionStore } from '../../store/permissionStore';
import { colors } from '../../themetokenchk';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import ApprovalModal from '../../components/shared/ApprovalModal';
import CommonHistoryDrawer from '../../components/shared/CommonHistoryDrawer';
import { canEditApprovalRecord } from '../../utils/approvalEditPolicy';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import { AppDrawer } from '../../components/shared/AppDrawer';
import PortForm from './PortForm';
import PortDetailContent from './PortDetailContent';

// ── Helper: format date ─────────────────────────────────────────────

// ── DMS conversion helpers ────────────────────────────────────────

// ── List Page ───────────────────────────────────────────────────────

// Số lượng tọa độ mặc định tương ứng với từng loại đối tượng: điểm → 1, đường → 2, vùng → 3
const GEOMETRY_POINT_COUNT: Record<string, number> = { POINT: 1, LINE: 2, POLYGON: 3 };

// Số bản ghi mỗi trang khi tải lịch sử thay đổi (server-side pagination — chuẩn VTS)
const HISTORY_PAGE_SIZE = 20;

const PORT_HISTORY_FIELD_LABELS: Record<string, string> = {
  portCode: 'Mã cảng biển',
  portName: 'Tên cảng biển',
  province: 'Địa điểm (Tỉnh/Thành Phố)',
  provinceId: 'Địa điểm (Tỉnh/Thành Phố)',
  area: 'Diện tích (km²)',
  maxVesselCapacity: 'Khả năng tiếp nhận tàu',
  portGroup: 'Nhóm cảng biển',
  portClass: 'Phân cấp cảng biển',
  coordinateSystem: 'Hệ quy chiếu tọa độ',
  displayRule: 'Quy tắc hiển thị',
  mapSymbolId: 'Biểu tượng',
  spatialId: 'Vị trí không gian',
  coordinates: 'Tọa độ GPS',
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
  geometryType: 'Loại hình học',
};

const PORT_APPROVAL_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Lưu tạm',
  PROPOSED: 'Chờ Cảng vụ duyệt',
  APPROVED_LEVEL1: 'Chờ Cục duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
};

const PORT_OPERATIONAL_STATUS_LABELS: Record<string, string> = {
  OPERATIONAL: 'Đang khai thác',
  NOT_YET_OPERATIONAL: 'Chưa khai thác',
  SUSPENDED: 'Dừng khai thác',
};

function resolvePortHistoryValue(field: string, val: unknown, orgMap: Map<string, string>, symbolMap: Map<string, string>): string | undefined {
  if (val === null || val === undefined || val === '') return undefined;
  const s = String(val);
  switch (field) {
    case 'orgUnitId': return orgMap.get(s) || s;
    case 'mapSymbolId': return symbolMap.get(s) || s;
    case 'spatialId': return '—';
    case 'portGroup': return s ? `Nhóm ${s}` : '—';
    case 'portClass': return s ? (s === '5' ? 'Cấp đặc biệt' : `Cấp ${s}`) : '—';
    case 'coordinateSystem': return s === '1' ? 'WGS-84' : s === '2' ? 'VN-2000' : s;
    case 'approvalStatus': return PORT_APPROVAL_STATUS_LABELS[s] || s;
    case 'operationalStatus': return PORT_OPERATIONAL_STATUS_LABELS[s] || s;
    default: return undefined;
  }
}

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
    mapSymbolId: 'Biểu tượng',
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
    bieuTuongId: 'Biểu tượng',
    iconId: 'Biểu tượng',
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

// 7 trạng thái chuẩn (approval-2-level-spec §3.1). Lưu ý APPROVED_LEVEL1 nghĩa là
// ĐÃ qua vòng 1, tức đang chờ Cục duyệt — trước đây bị gán nhầm thành "Chờ Cảng vụ
// duyệt". APPROVED_LEVEL2 / REJECTED / PROPOSED là giá trị legacy, chỉ giữ để đọc
// dữ liệu cũ chứ không phát sinh mới.
const APPROVAL_STYLE_MAP: Record<string, { color: string; label: string }> = {
  DRAFT: { color: statusDraft, label: 'Lưu tạm' },
  PENDING_APPROVAL: { color: statusAttention, label: 'Chờ Cảng vụ duyệt' },
  APPROVED_LEVEL1: { color: actionPrimary, label: 'Chờ Cục duyệt' },
  APPROVED: { color: statusOperational, label: 'Đã phê duyệt' },
  REJECTED_LEVEL1: { color: statusCritical, label: 'Cảng vụ trả về' },
  REJECTED_LEVEL2: { color: statusCritical, label: 'Cục trả về' },
  ARCHIVED: { color: statusDraft, label: 'Đã xóa (lịch sử)' },
  // ── legacy ──
  NHAP: { color: statusDraft, label: 'Lưu tạm' },
  PROPOSED: { color: statusAttention, label: 'Chờ Cảng vụ duyệt' },
  APPROVED_LEVEL2: { color: statusOperational, label: 'Đã duyệt' },
  DA_PHE_DUYET: { color: statusOperational, label: 'Đã duyệt' },
  REJECTED: { color: statusCritical, label: 'Từ chối' },
  TU_CHOI: { color: statusCritical, label: 'Từ chối' },
};

const STRUCTURE_TYPE_OPTIONS = [
  { value: 1, label: 'Bến nước' }, { value: 2, label: 'Bến bờ' },
  { value: 3, label: 'Bến phao' }, { value: 4, label: 'Khác' },
];

// Chi tiết vùng nước (Drawer lồng — tham chiếu WaterZoneListPage detail modal)
function WaterZoneDetailMini({ record, symbols, files, userMap }: { record: any; symbols: any[]; files: any[]; userMap: Map<string, string> }) {
  const sym = symbols.find((s: any) => s.id === record.bieuTuongId);
  return (
    <div style={{ paddingTop: 8 }}>
      <Descriptions bordered column={2} size="small" style={{ marginBottom: spaceMd }}>
        <Descriptions.Item label="Mã vùng nước"><Tag color="cyan">{record.waterZoneCode || '—'}</Tag></Descriptions.Item>
        <Descriptions.Item label="Tên vùng nước">{record.waterZoneName || '—'}</Descriptions.Item>
        <Descriptions.Item label="Cảng biển chủ">{record.tenCangBien || record.portId || '—'}</Descriptions.Item>
        <Descriptions.Item label="Loại vùng nước">{record.loaiVungNuoc || '—'}</Descriptions.Item>
        <Descriptions.Item label="Biểu tượng bản đồ">
          {sym?.image ? <img src={sym.image} alt={sym.name} style={{ width: 20, height: 20, objectFit: 'contain', marginRight: 8 }} /> : null}
          {sym?.name || record.bieuTuongId || '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Diện tích">{record.area != null ? `${Number(record.area).toFixed(2)} m²` : '—'}</Descriptions.Item>
        <Descriptions.Item label="Độ sâu tối đa">{record.doSauMax != null ? `${Number(record.doSauMax).toFixed(2)} m` : '—'}</Descriptions.Item>
        <Descriptions.Item label="Độ sâu TB">{record.doSauTrungBinh != null ? `${Number(record.doSauTrungBinh).toFixed(2)} m` : '—'}</Descriptions.Item>
        <Descriptions.Item label="Trạng thái hoạt động">
          {record.operationalStatus ? <Tag color={trangThaiHoatDongBadge(record.operationalStatus).color}>{trangThaiHoatDongBadge(record.operationalStatus).label}</Tag> : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái phê duyệt">
          {record.approvalStatus ? <Tag color={trangThaiPheDuyetBadge(record.approvalStatus).color}>{trangThaiPheDuyetBadge(record.approvalStatus).label}</Tag> : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Người tạo">{userMap.get(record.createdBy) || record.createdBy || '—'}</Descriptions.Item>
        <Descriptions.Item label="Ngày tạo">{record.createdAt ? new Date(record.createdAt).toLocaleString('vi-VN') : '—'}</Descriptions.Item>
        <Descriptions.Item label="Người cập nhật">{userMap.get(record.updatedBy) || record.updatedBy || '—'}</Descriptions.Item>
        <Descriptions.Item label="Ngày cập nhật">{record.updatedAt ? new Date(record.updatedAt).toLocaleString('vi-VN') : '—'}</Descriptions.Item>
      </Descriptions>
      <Typography.Text style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tài liệu đính kèm</Typography.Text>
      {files.length === 0 ? (
        <div style={{ color: textTertiary, fontSize: fontSizeMd, padding: `${spaceSm}px 0` }}>Không có tài liệu đính kèm</div>
      ) : (
        <div>
          {files.map((f: any) => (
            <div key={f.id} style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Typography.Text strong>{f.fileName}</Typography.Text>
                <br />
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {f.fileSize} bytes — {new Date(f.createdAt).toLocaleString('vi-VN')}
                </Typography.Text>
              </div>
              <Button type="link" icon={<DownloadOutlined />} onClick={() => window.open(documentApi.downloadUrl(f.minioKey), '_blank')} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PortListPage() {
  // ── Permission ──────────────────────────────────────────────────
  const hasPerm = usePermissionStore((s: any) => s.hasPermission);
  const canSubmitForApproval = hasPerm?.('port:update') || hasPerm?.('port:approve') || hasPerm?.('port:manage');

  // ── State ───────────────────────────────────────────────────────
  const [filterName, setFilterName] = useState('');
  const [filterCode, setFilterCode] = useState('');
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
  const [debouncedName, setDebouncedName] = useState('');
  const [debouncedCode, setDebouncedCode] = useState('');
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
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<CangBienResponse | null>(null);
  const [detailFiles, setDetailFiles] = useState<any[]>([]);

  // Kết cấu hạ tầng khác thuộc cảng biển (tab chi tiết)
  const [infraFilter, setInfraFilter] = useState<string | undefined>(undefined);
  const [infraPage, setInfraPage] = useState(1);
  const [infraPageSize, setInfraPageSize] = useState(20);
  const [otherInfra, setOtherInfra] = useState<Array<{ id: string; name: string; typeLabel: string; kchtType: 'berth' | 'waterzone' }>>([]);

  // Chi tiết KCHT khác — Drawer lồng (mở tại chỗ, không chuyển trang, tham chiếu BuoyStationList)
  const [kchtDetailOpen, setKchtDetailOpen] = useState(false);
  const [kchtDetailType, setKchtDetailType] = useState<'berth' | 'waterzone'>('berth');
  const [kchtDetailRecord, setKchtDetailRecord] = useState<any>(null);
  const [kchtDetailFiles, setKchtDetailFiles] = useState<any[]>([]);
  const [kchtDetailLoading, setKchtDetailLoading] = useState(false);
  const [pierDetailOpen, setPierDetailOpen] = useState(false);
  const [pierDetailRecord, setPierDetailRecord] = useState<any>(null);
  const [pierDetailFiles, setPierDetailFiles] = useState<any[]>([]);
  const [pierDetailLoading, setPierDetailLoading] = useState(false);

  const openPierDetail = useCallback(async (id: string) => {
    setPierDetailLoading(true); setPierDetailOpen(true); setPierDetailRecord(null);
    try {
      const [rec, fileRes] = await Promise.all([
        pierCRUD.findById(id),
        documentApi.listByEntity('pier', id, { page: 1, size: 20 }),
      ]);
      setPierDetailRecord(rec);
      setPierDetailFiles((fileRes as any)?.data || []);
    } catch { toast.error('Không thể tải chi tiết cầu cảng'); setPierDetailRecord(null); }
    finally { setPierDetailLoading(false); }
  }, []);

  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    (async () => {
      try {
        const resp = await userService.list({ pageSize: 1000 });
        const users: any[] = (resp as any)?.data || (Array.isArray(resp) ? resp : []);
        const map = new Map<string, string>();
        users.forEach((u: any) => map.set(u.id, u.fullName || u.username || u.id));
        setUserMap(map);
      } catch { /* silent — hiển thị raw id */ }
    })();
  }, []);

  const [waterwayMap, setWaterwayMap] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    lineObjectService.list({ status: 'PUBLISHED', objectType: LineObject.ObjectType.WATERWAY, pageSize: 1000 })
      .then((r: any) => { const m = new Map<string, string>(); (r.data || []).forEach((l: any) => { m.set(l.id, l.name || l.code); }); setWaterwayMap(m); })
      .catch(() => {});
  }, []);

  const openKchtDetail = useCallback(async (type: 'berth' | 'waterzone', id: string) => {
    setKchtDetailType(type);
    setKchtDetailLoading(true);
    setKchtDetailOpen(true);
    try {
      const [rec, fileRes] = await Promise.all([
        type === 'berth' ? berthCRUD.findById(id) : waterZoneApi.findById(id),
        documentApi.listByEntity(type === 'berth' ? 'berth' : 'water-zone', id, { page: 1, size: 20 }),
      ]);
      setKchtDetailRecord(rec);
      setKchtDetailFiles((fileRes as any)?.data || []);
    } catch {
      toast.error('Không thể tải chi tiết kết cấu hạ tầng');
      setKchtDetailRecord(null);
    } finally {
      setKchtDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedRecord?.id) { setOtherInfra([]); return; }
    let cancelled = false;
    Promise.allSettled([
      berthCRUD.search({ portId: selectedRecord.id, pageSize: 50 }),
      waterZoneCRUD.findAll({ portId: selectedRecord.id, size: 50 }),
    ]).then(([b, w]) => {
      if (cancelled) return;
      const rows: Array<{ id: string; name: string; typeLabel: string; kchtType: 'berth' | 'waterzone' }> = [];
      if (b.status === 'fulfilled') {
        rows.push(...(b.value.data || []).map((x: any) => ({
          id: x.id, name: x.berthName || x.berthCode || '—', typeLabel: 'Bến cảng',
          kchtType: 'berth' as const,
        })));
      }
      if (w.status === 'fulfilled') {
        rows.push(...(w.value.data || []).map((x: any) => ({
          id: x.id, name: x.waterZoneName || x.waterZoneCode || '—', typeLabel: 'Khu neo đậu',
          kchtType: 'waterzone' as const,
        })));
      }
      setOtherInfra(rows);
    });
    return () => { cancelled = true; };
  }, [selectedRecord?.id]);

  // ── History drawer state (chuẩn VTS: server-side lọc + phân trang) ──
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyFilters, setHistoryFilters] = useState<{ keyword: string; fromDate?: string; toDate?: string }>({ keyword: '' });

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<CangBienResponse | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Reject modal
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<CangBienResponse | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  // Approve modal
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvingRecord, setApprovingRecord] = useState<CangBienResponse | null>(null);

  // Auto-generate port code for create modal
  const [portCodeLoading, setPortCodeLoading] = useState(false);
  const [createTabKey, setCreateTabKey] = useState('general');

  // Infrastructure list for create modal
  const [infraList, setInfraList] = useState<Array<{ stt: number; infraName: string; quantity: number | null }>>([]);
  const [uploadFileList, setUploadFileList] = useState<any[]>([]);
  // GPS coordinates — 6 trường DMS riêng (latD/latM/latS/lngD/lngM/lngS — chuẩn VTS CHK)
  const [gpsCoordList, setGpsCoordList] = useState<Array<{ latD: number | null; latM: number | null; latS: number | null; lngD: number | null; lngM: number | null; lngS: number | null }>>([]);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsPage, setGpsPage] = useState(1);

  // DMS ↔ DD conversion helpers
  const ddToDms = (dd: number): { d: number | null; m: number | null; s: number | null } => {
    if (dd == null || isNaN(dd)) return { d: null, m: null, s: null };
    let abs = Math.abs(dd);
    let d = Math.floor(abs);
    let mFloat = (abs - d) * 60;
    if (mFloat > 59.999999999) { d += 1; mFloat = 0; }
    let m = Math.floor(mFloat);
    let sFloat = (mFloat - m) * 60;
    if (sFloat > 59.999999999) { m += 1; sFloat = 0; if (m >= 60) { m = 0; d += 1; } }
    let s = Math.round(sFloat * 100) / 100;
    if (s >= 60) { s = 0; m += 1; if (m >= 60) { m = 0; d += 1; } }
    return { d: d === 0 ? null : d, m: m === 0 ? null : m, s: s === 0 ? null : s };
  };
  const dmToDd = (d: number | null, m: number | null, s: number | null): number => (d ?? 0) + (m ?? 0) / 60 + (s ?? 0) / 3600;

  const addGpsPoint = () => { setGpsCoordList([...gpsCoordList, { latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }]); setGpsError(null); };
  const removeGpsPoint = (i: number) => {
    const next = gpsCoordList.filter((_, idx) => idx !== i);
    setGpsCoordList(next);
    setGpsError(null);
  };
  const updateGpsPoint = (i: number, field: 'lat' | 'lng', d: number | null, m: number | null, s: number | null) => {
    const next = [...gpsCoordList];
    next[i] = field === 'lat'
      ? { ...next[i], latD: d, latM: m, latS: s }
      : { ...next[i], lngD: d, lngM: m, lngS: s };
    setGpsCoordList(next);
    setGpsError(null);
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

  // Debounce search 300ms (F-012 AC-012-02) — tên và mã tách riêng
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedName(filterName);
      setDebouncedCode(filterCode);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [filterName, filterCode]);

  const [createForm] = Form.useForm();
  const [updateForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [actionType, setActionType] = useState<'draft' | 'submit' | 'approve'>('submit');
  const actionTypeRef = useRef<'draft' | 'submit' | 'approve'>('submit');
  const editActionRef = useRef<'draft' | 'approve'>('approve');
  const [orgUnits, setOrgUnits] = useState<any[]>([]);
  const [symbols, setSymbols] = useState<any[]>([]);

  // Tên đơn vị cấp 2 trong chuỗi phân cấp — dùng cho cột Đơn vị quản lý (giống chi tiết).
  const orgLevel2Map = useMemo(() => {
    const map = new Map<string, string>();
    orgUnits.forEach((o: any) => {
      const name = resolveOrgLevel2Name(orgUnits, o.id);
      if (name) map.set(o.id, name);
    });
    return map;
  }, [orgUnits]);

  const symbolMap = useMemo(() => {
    const map = new Map<string, string>();
    symbols.forEach((s: any) => map.set(s.id, s.name));
    return map;
  }, [symbols]);

  const orgMap = useMemo(() => {
    const map = new Map<string, string>();
    orgUnits.forEach((o: any) => map.set(o.id, o.code ? `${o.code} - ${o.name}` : o.name));
    return map;
  }, [orgUnits]);

  const handleFilterApply = useCallback(() => {
    setFilterName((filterValues.portName || '').trim());
    setFilterCode((filterValues.portCode || '').trim());
    setFilterOrgUnitId(filterValues.orgUnitId === '__all__' ? undefined : filterValues.orgUnitId || undefined);
    setFilterPortClass(filterValues.portClass ? Number(filterValues.portClass) : undefined);
    setFilterPortGroup(filterValues.portGroup ? Number(filterValues.portGroup) : undefined);
    setFilterTinh(filterValues.province || '');
    setFilterUpdatedFrom(filterValues.updatedFrom || undefined);
    setFilterUpdatedTo(filterValues.updatedTo || undefined);
    setPage(1);
  }, [filterValues]);

  const handleFilterReset = useCallback(() => {
    const defaultOrg = defaultOrgUnitId.current;
    setFilterValues(defaultOrg ? { orgUnitId: defaultOrg } : {});
    setFilterName('');
    setFilterCode('');
    setFilterOrgUnitId(defaultOrg === '__all__' ? undefined : defaultOrg || undefined);
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
    setGpsCoordList([]);
    updateForm.resetFields();
    if (window.self !== window.top) {
      window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
    }
  }, [updateForm]);

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
              geometryType: data.geometryType || undefined,
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
              displayRule: (data.geometryType || data.coordinates) ? 'Độ, phút, giây (DMS)' : undefined,
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
              const multiMatch = wktCoords.match(/MULTIPOINT\s*\(((?:\([^)]*\),?)+)\)/);
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
            setGpsCoordList(pts.map((p) => {
              const la = ddToDms(p.lat);
              const lo = ddToDms(p.lng);
              return { latD: la.d, latM: la.m, latS: la.s, lngD: lo.d, lngM: lo.m, lngS: lo.s };
            }));
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
              const defaultId = userOrgId ? (match ? userOrgId : data[0].id) : undefined;
              defaultOrgUnitId.current = defaultId;
              setFilterValues(prev => ({ ...prev, orgUnitId: defaultId }));
              setFilterOrgUnitId(defaultId === '__all__' ? undefined : defaultId);
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

  // Form watches
  const createGeometryType = Form.useWatch('geometryType', createForm);
  const updateGeometryType = Form.useWatch('geometryType', updateForm);

  /** true khi field đã đạt giới hạn — 'chars': đủ max ký tự; 'value': giá trị >= max. Bật viền đỏ + message bên dưới. */
  const useAtMax = (form: any, name: string, max: number, mode: 'chars' | 'value' = 'chars'): boolean => {
    const raw = Form.useWatch(name, form) ?? '';
    if (mode === 'value') {
      const n = typeof raw === 'number' ? raw : Number(raw ?? NaN);
      return !Number.isNaN(n) && n >= max;
    }
    const len = (typeof raw === 'string' ? raw : String(raw ?? '')).length;
    return len >= max;
  };
  const atMaxCreate = {
    portName: useAtMax(createForm, 'portName', 255), detailedLocation: useAtMax(createForm, 'detailedLocation', 500),
    waterAreaScope: useAtMax(createForm, 'waterAreaScope', 2000), otherWaterAreas: useAtMax(createForm, 'otherWaterAreas', 2000),
    remarks: useAtMax(createForm, 'remarks', 2000),
    totalBerths: useAtMax(createForm, 'totalBerths', 5), totalAnchoragesTransshipment: useAtMax(createForm, 'totalAnchoragesTransshipment', 5),
    totalPublicChannels: useAtMax(createForm, 'totalPublicChannels', 5), totalDedicatedChannels: useAtMax(createForm, 'totalDedicatedChannels', 5),
    totalPublicChannelLength: useAtMax(createForm, 'totalPublicChannelLength', 20), totalDedicatedChannelLength: useAtMax(createForm, 'totalDedicatedChannelLength', 20),
    totalBuoysBeacons: useAtMax(createForm, 'totalBuoysBeacons', 5), totalDikes: useAtMax(createForm, 'totalDikes', 5),
    totalDikeLength: useAtMax(createForm, 'totalDikeLength', 20), totalLighthouses: useAtMax(createForm, 'totalLighthouses', 5),
    buoyBerthCount: useAtMax(createForm, 'buoyBerthCount', 5), anchorageCount: useAtMax(createForm, 'anchorageCount', 5),
    transshipmentCount: useAtMax(createForm, 'transshipmentCount', 5),
  };
  const atMaxUpdate = {
    portName: useAtMax(updateForm, 'portName', 255), detailedLocation: useAtMax(updateForm, 'detailedLocation', 500),
    waterAreaScope: useAtMax(updateForm, 'waterAreaScope', 2000), otherWaterAreas: useAtMax(updateForm, 'otherWaterAreas', 2000),
    remarks: useAtMax(updateForm, 'remarks', 2000),
    totalBerths: useAtMax(updateForm, 'totalBerths', 5), totalAnchoragesTransshipment: useAtMax(updateForm, 'totalAnchoragesTransshipment', 5),
    totalPublicChannels: useAtMax(updateForm, 'totalPublicChannels', 5), totalDedicatedChannels: useAtMax(updateForm, 'totalDedicatedChannels', 5),
    totalPublicChannelLength: useAtMax(updateForm, 'totalPublicChannelLength', 20), totalDedicatedChannelLength: useAtMax(updateForm, 'totalDedicatedChannelLength', 20),
    totalBuoysBeacons: useAtMax(updateForm, 'totalBuoysBeacons', 5), totalDikes: useAtMax(updateForm, 'totalDikes', 5),
    totalDikeLength: useAtMax(updateForm, 'totalDikeLength', 20), totalLighthouses: useAtMax(updateForm, 'totalLighthouses', 5),
    buoyBerthCount: useAtMax(updateForm, 'buoyBerthCount', 5), anchorageCount: useAtMax(updateForm, 'anchorageCount', 5),
    transshipmentCount: useAtMax(updateForm, 'transshipmentCount', 5),
  };

  // Khi chọn loại đối tượng → tự set hệ quy chiếu & quy tắc hiển thị
  useEffect(() => {
    if (!createGeometryType) return;
    createForm.setFieldsValue({ coordinateSystem: 1, displayRule: 'Độ, phút, giây (DMS)' });
    // Form thêm mới: điểm → 1 tọa độ, đường → 2 tọa độ, vùng → 3 tọa độ
    const count = GEOMETRY_POINT_COUNT[createGeometryType] ?? 0;
    setGpsCoordList(Array.from({ length: count }, () => ({ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null })));
  }, [createGeometryType]);
  useEffect(() => {
    if (updateGeometryType) {
      updateForm.setFieldsValue({ coordinateSystem: 1, displayRule: 'Độ, phút, giây (DMS)' });
      // Chỉnh sửa: giữ tọa độ đã có, tự thêm dòng trống cho đủ số lượng theo loại đối tượng (điểm → 1, đường → 2, vùng → 3)
      const count = GEOMETRY_POINT_COUNT[updateGeometryType] ?? 1;
      setGpsCoordList((prev) => {
        if (prev.length >= count) return prev;
        const added = Array.from({ length: count - prev.length }, () => ({ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }));
        return [...prev, ...added];
      });
    }
  }, [updateGeometryType]);

  const handleCreateFinish = async (values: Record<string, unknown>) => {
    const portCode = String(values.portCode || '').trim();
    const portName = String(values.portName).trim();

    // BR-008-08: Validate công trình KCHT (chỉ cần tên HOẶC số lượng là đủ)
    for (const infra of infraList) {
      const name = (infra.infraName || '').trim();
      const qty = infra.quantity == null ? null : Number(infra.quantity);
      if (name.length > 500) { toast.error('Tên công trình KCHT không quá 500 ký tự'); return; }
      if (qty != null && qty > 5) { toast.error('Số lượng công trình KCHT không quá 5'); return; }
    }

    // Validate required fields for submit/approve — tọa độ GPS không bắt buộc khi gửi duyệt
    const currentAction = actionTypeRef.current;
    if (currentAction === 'submit' || currentAction === 'approve') {
      const fieldErrors: Array<{ name: Array<string | number>; errors: string[] }> = [];
      if (!values.orgUnitId) fieldErrors.push({ name: ['orgUnitId'], errors: ['Đơn vị quản lý là bắt buộc khi gửi phê duyệt'] });
      if (!values.province) fieldErrors.push({ name: ['province'], errors: ['Tỉnh/Thành phố là bắt buộc khi gửi phê duyệt'] });
      if (values.portClass == null || values.portClass === '') fieldErrors.push({ name: ['portClass'], errors: ['Phân cấp cảng biển là bắt buộc khi gửi phê duyệt'] });
      if (fieldErrors.length) { createForm.setFields(fieldErrors); return; }
    }

    if (values.geometryType) {
      const minCount = GEOMETRY_POINT_COUNT[values.geometryType as string] ?? 1;
      const validCount = gpsCoordList.filter(c => (c.latD != null || c.latM != null || c.latS != null) && (c.lngD != null || c.lngM != null || c.lngS != null)).length;
      if (validCount < minCount) {
        toast.error(values.geometryType === 'POLYGON' ? 'Đối tượng vùng cần ít nhất 3 tọa độ hợp lệ' : values.geometryType === 'LINE' ? 'Đối tượng đường cần ít nhất 2 tọa độ hợp lệ' : 'Đối tượng điểm cần ít nhất 1 tọa độ hợp lệ');
        return;
      }
    }

    if (values.geometryType) {
      const minCount = GEOMETRY_POINT_COUNT[values.geometryType as string] ?? 1;
      const validCount = gpsCoordList.filter(c => (c.latD != null || c.latM != null || c.latS != null) && (c.lngD != null || c.lngM != null || c.lngS != null)).length;
      if (validCount < minCount) {
        toast.error(values.geometryType === 'POLYGON' ? 'Đối tượng vùng cần ít nhất 3 tọa độ hợp lệ' : values.geometryType === 'LINE' ? 'Đối tượng đường cần ít nhất 2 tọa độ hợp lệ' : 'Đối tượng điểm cần ít nhất 1 tọa độ hợp lệ');
        return;
      }
    }

    setSubmitting(true);
    try {
      const coordinateList: Array<{ latitude: number; longitude: number }> = gpsCoordList
        .filter(c => (c.latD != null || c.latM != null || c.latS != null) && (c.lngD != null || c.lngM != null || c.lngS != null))
        .map(c => ({ latitude: dmToDd(c.latD, c.latM, c.latS), longitude: dmToDd(c.lngD, c.lngM, c.lngS) }));

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
        approvalStatus: currentAction === 'draft' ? 'DRAFT' : currentAction === 'submit' ? 'PENDING' : 'APPROVED',
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
          .filter((inf) => (inf.infraName || '').trim() || (inf.quantity != null && Number(inf.quantity) > 0))
          .map((inf, idx) => ({ stt: idx + 1, infraName: (inf.infraName || '').trim(), quantity: inf.quantity != null && Number(inf.quantity) > 0 ? Number(inf.quantity) : 1 })),
        remarks: (values.remarks as string) || undefined,
        action: currentAction,
      };
      const createdPort = await import('./api').then((m) => m.createCangBien(payload as any));
      const createdPortId = createdPort?.id || (createdPort as any)?.portId;
      toast.success(currentAction === 'draft' ? 'Lưu tạm thành công' : 'Lưu và phê duyệt thành công');
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

  const handleFormFailed = () => {
    // Lỗi validation được hiển thị trực tiếp viền đỏ + message dưới từng trường (AntD), không popup toast
  };

  const handleUpdateFinish = async (values: Record<string, unknown>) => {
    if (!selectedRecord) return;
    setSubmitting(true);
    try {
      const n = (v: unknown): number | undefined =>
        v != null && !Number.isNaN(v as number) ? Number(v) : undefined;

      const coordinateList: Array<{ latitude: number; longitude: number }> = gpsCoordList
        .filter(c => (c.latD != null || c.latM != null || c.latS != null) && (c.lngD != null || c.lngM != null || c.lngS != null))
        .map(c => ({ latitude: dmToDd(c.latD, c.latM, c.latS), longitude: dmToDd(c.lngD, c.lngM, c.lngS) }));

      const payload = {
        id: selectedRecord.id,
        portCode: (values.portCode as string) || undefined,
        portName: (values.portName as string) || undefined,
        province: (values.province as string) || undefined,
        area: values.area as number | undefined,
        maxVesselCapacity: values.khaNangTiepNhan as number | undefined,
        operationalStatus: (values.operationalStatus as string) || undefined,
        approvalStatus: editActionRef.current === 'draft' ? 'DRAFT' : 'APPROVED',
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
          .filter((inf) => (inf.infraName || '').trim() || (inf.quantity != null && Number(inf.quantity) > 0))
          .map((inf, idx) => ({ stt: idx + 1, infraName: (inf.infraName || '').trim(), quantity: inf.quantity != null && Number(inf.quantity) > 0 ? Number(inf.quantity) : 1 })),
        remarks: (values.remarks as string) || undefined,
      };
      const res = await import('./api').then((m) => m.updateCangBien(payload));
      toast.success(editActionRef.current === 'draft' ? 'Lưu tạm thành công' : 'Lưu và phê duyệt thành công');
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
        fetchTabCounts();
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
        portName: debouncedName || undefined,
        portCode: debouncedCode || undefined,
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
  }, [page, pageSize, debouncedName, debouncedCode, filterTinh, filterOrgUnitId, filterPortGroup, filterPortClass, filterUpdatedFrom, filterUpdatedTo, filterStatus, filterApprovalStatus]);

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
      fetchCangBienList({ page: 0, size: 1, orgUnitId: filterOrgUnitId }).then(res => setTotalAll(res?.totalElements ?? 0)).catch(() => { }),
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
      fetchTabCounts();
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

  const handleConfirmApprove = useCallback(async (content?: string) => {
    if (!approvingRecord) return;
    try {
      const st = approvingRecord.approvalStatus;
      if (st === 'DRAFT' || st === 'NHAP') {
        // Trạng thái Nháp → phê duyệt thẳng thành Đã phê duyệt (mô hình 2 trạng thái)
        await portApproval.approve(approvingRecord.id);
        toast.success('Đã phê duyệt');
      } else {
        // Vòng duyệt do trạng thái hiện tại quyết định: "Chờ Cảng vụ duyệt" là
        // vòng 1, "Chờ Cục duyệt" là vòng 2 (approval-2-level-spec §3.2).
        const isLevel2 = st === 'APPROVED_LEVEL1';
        if (isLevel2) {
          await approveCangBienC2(approvingRecord.id, content);
        } else {
          await approveCangBienC1(approvingRecord.id, content);
        }
        toast.success(isLevel2 ? 'Phê duyệt cấp Cục thành công' : 'Phê duyệt cấp Cảng vụ thành công');
      }
      setApproveModalOpen(false);
      setApprovingRecord(null);
      fetchData();
      fetchTabCounts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Phê duyệt thất bại';
      toast.error(msg);
    }
  }, [approvingRecord, fetchData, fetchTabCounts]);

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

  const handleViewHistory = useCallback((record: CangBienResponse) => {
    setSelectedRecord(record);
    setHistoryModalOpen(true);
    setHistoryRecords([]);
    setLoadingHistory(false);
    setLoadingMoreHistory(false);
    setHasMoreHistory(true);
    setHistoryFilters({ keyword: '' });
    setHistoryPage(0);
  }, []);

  const getPortGroupLabel = (val: number | null): string => {
    if (!val) return '—';
    return `Nhóm ${val}`;
  };

  // ── Detail drawer (giống BerthListPage.openDetailDrawer: mở ngay với dòng hiện tại,
  //    fetch dữ liệu mới ở nền — KHÔNG bật isLoading để tránh load lại/remount danh sách) ──
  const openDetail = useCallback(async (record: CangBienResponse) => {
    setSelectedRecord(record);
    setDetailModalVisible(true);
    try {
      const data = await fetchCangBienById(record.id);
      setSelectedRecord(data);
    } catch {
      toast.error('Không thể tải thông tin chi tiết cảng biển');
    }
    documentApi.listByEntity('port', record.id, { page: 1, size: 20 })
      .then((res) => setDetailFiles(res.data || []))
      .catch(() => setDetailFiles([]));
  }, []);

  // ── rowActions callback ──────────────────────────────────────────
  // Thứ tự: Xem chi tiết → Chỉnh sửa → Lịch sử → Phê duyệt/Từ chối → Xóa
  const rowActions = useCallback(
    (record: CangBienResponse) => {
      const actions: any[] = [
        {
          key: 'view',
          label: 'Xem chi tiết',
          icon: icons.view,
          onClick: () => openDetail(record),
        },
      ];
      const status = record.approvalStatus;
      // Chỉnh sửa — quy tắc 12 (approval-2-level-spec.md mục 3.9)
      if (canEditApprovalRecord(status, { hasPerm: (k: string) => !!hasPerm?.(k), resource: 'port' })) {
        actions.push({
          key: 'edit',
          label: 'Chỉnh sửa',
          icon: icons.edit,
          onClick: async () => {
            // Giống Bến cảng: mở modal NGAY với dòng hiện tại, fetch dữ liệu ở nền —
            // KHÔNG bật setIsLoading để tránh load lại/remount danh sách
            setSelectedRecord(record);
            setUpdateModalVisible(true);
            try {
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
                  geometryType: data.geometryType || undefined,
                  coordinates: data.coordinates,
                  mapSymbolId: data.mapSymbolId,
                } : undefined,
                geometryType: data.geometryType || undefined,
                mapSymbolId: data.mapSymbolId,
                coordinateSystem: data.coordinateSystem,
                displayRule: (data.geometryType || data.coordinates) ? 'Độ, phút, giây (DMS)' : undefined,
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
                const multiMatch2 = wktCoords2.match(/MULTIPOINT\s*\(((?:\([^)]*\),?)+)\)/);
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
              setGpsCoordList(pts2.map((p) => {
                const la = ddToDms(p.lat);
                const lo = ddToDms(p.lng);
                return { latD: la.d, latM: la.m, latS: la.s, lngD: lo.d, lngM: lo.m, lngS: lo.s };
              }));
            } catch (err) {
              toast.error('Không thể tải thông tin chỉnh sửa cảng biển');
              setUpdateModalVisible(false);
            }
          },
        });
      }
      // Lịch sử — luôn hiển thị khi có quyền
      if (hasPerm?.(PERMISSIONS.PORT.HISTORY)) {
        actions.push({
          key: 'history',
          label: 'Lịch sử',
          icon: icons.history,
          onClick: () => handleViewHistory(record),
        });
      }
      // Phê duyệt / Từ chối — theo trạng thái, hiển thị trước Xóa
      // Nháp (DRAFT/NHAP): phê duyệt thẳng thành Đã phê duyệt
      if ((status === 'DRAFT' || status === 'NHAP') && hasPerm?.('port:approve')) {
        actions.push({ key: 'approve', label: 'Phê duyệt', icon: icons.approve, onClick: () => handleApprove(record) });
      }
      // CHO_PHE_DUYET / PENDING / PENDING_APPROVAL: Phê duyệt + Từ chối
      if ((status === 'CHO_PHE_DUYET' || status === 'PENDING' || status === 'PENDING_APPROVAL') && hasPerm?.('port:approve')) {
        actions.push({
          key: 'approve',
          label: 'Phê duyệt',
          icon: icons.approve,
          onClick: () => handleApprove(record),
        });
        actions.push({
          key: 'reject',
          label: 'Từ chối',
          icon: icons.reject,
          danger: true,
          onClick: () => handleReject(record),
        });
      }
      // Xóa: chỉ trạng thái DRAFT/NHAP — luôn ở cuối cùng
      if (hasPerm?.(PERMISSIONS.PORT.DELETE) && (status === 'DRAFT' || status === 'NHAP')) {
        actions.push({
          key: 'delete',
          label: 'Xóa',
          icon: icons.delete,
          danger: true,
          onClick: () => handleDelete(record),
        });
      }
      return actions;
    },
    [hasPerm, updateForm, handleApprove, handleDelete, handleReject, handleViewHistory, openDetail],
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
        key: 'portName',
        label: 'Tên cảng biển',
        dataIndex: 'portName',
        width: 280,
        fixed: 'left' as const,
        ellipsis: false,
        sortable: true,
        sortOrder: sortField === 'portName' ? sortOrder : null,
        render: (v: string, record: CangBienResponse) => (
          <a
            onClick={() => openDetail(record)}
            style={{ fontWeight: fontWeightBold, color: 'inherit', cursor: 'pointer' }}
          >
            {v}
          </a>
        ),
      },
      {
        key: 'orgUnitId',
        label: 'Đơn vị quản lý',
        dataIndex: 'orgUnitId',
        width: 260,
        ellipsis: false,
        sortable: true,
        sortOrder: sortField === 'orgUnitId' ? sortOrder : null,
        render: (_v: string | null, record: CangBienResponse) => {
          const level2 = record.orgUnitId ? orgLevel2Map.get(record.orgUnitId) : undefined;
          return <span style={{ fontWeight: fontWeightBold }}>{level2 || record.orgUnitName || _v || '—'}</span>;
        },
      },
      {
        key: 'portGroup',
        label: 'Nhóm cảng biển',
        dataIndex: 'portGroup',
        width: 170,
        sortable: true,
        sortOrder: sortField === 'portGroup' ? sortOrder : null,
        render: (v: number | null) => getPortGroupLabel(v),
      },
      {
        key: 'portClass',
        label: 'Phân cấp cảng biển',
        dataIndex: 'portClass',
        width: 250,
        sortable: true,
        sortOrder: sortField === 'portClass' ? sortOrder : null,
        render: (v: number | null) => v != null ? (v === 5 ? 'Cấp đặc biệt' : `Cấp ${v}`) : '—',
      },
      {
        key: 'province',
        label: 'Địa điểm (Tỉnh/Thành phố)',
        dataIndex: 'province',
        width: 250,
        ellipsis: false,
        sortable: true,
        sortOrder: sortField === 'province' ? sortOrder : null,
        render: (v: string | null) => v || '—',
      },
      {
        key: 'approvalStatus',
        label: 'Trạng thái',
        dataIndex: 'approvalStatus',
        width: 170,
        sortable: true,
        sortOrder: sortField === 'approvalStatus' ? sortOrder : null,
        render: (v: string) => <ApprovalStatusBadge status={v} />,
      },
      {
        key: 'updatedBy',
        label: 'Cán bộ cập nhật',
        dataIndex: 'updatedByName',
        width: 190,
        ellipsis: false,
        sortable: true,
        sortOrder: sortField === 'updatedBy' ? sortOrder : null,
        render: (v: string | null, record: CangBienResponse) => {
          const name = v || record.updatedByName || (record as any).createdByName || '—';
          const date = record.updatedAt || (record as any).createdAt;
          return (
            <div style={{ lineHeight: '1.35' }}>
              <div style={{ fontWeight: fontWeightBold, color: '#0F172A', fontSize: fontSizeMd, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {name}
              </div>
              <div style={{ fontSize: fontSizeMd, color: textSecondary, whiteSpace: 'nowrap' }}>
                {date ? dayjs(date).format('DD/MM/YYYY HH:mm:ss') : '—'}
              </div>
            </div>
          );
        },
      },
    ],
    [page, pageSize, getPortGroupLabel, orgLevel2Map, sortField, sortOrder, openDetail],
  );

  // ── History drawer ──────────────────────────────────────────────

  useEffect(() => {
    if (!historyModalOpen || !selectedRecord) return;
    let cancelled = false;
    (async () => {
      setLoadingHistory(true);
      setLoadingMoreHistory(false);
      setHasMoreHistory(true);
      setHistoryRecords([]);
      setHistoryPage(0);
      try {
        const history = await fetchportHistory(selectedRecord.id, 0, HISTORY_PAGE_SIZE, {
          keyword: historyFilters.keyword || undefined,
          fromDate: historyFilters.fromDate || undefined,
          toDate: historyFilters.toDate || undefined,
        });
        if (cancelled) return;
        const items = (history || []).filter((r: any) => r && !['spatialId', 'infrastructureList', 'attachments'].includes(r.changedField));
        setHistoryRecords(items);
        setHasMoreHistory(items.length === HISTORY_PAGE_SIZE);
      } catch {
        if (!cancelled) toast.error('Không thể tải lịch sử');
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [historyModalOpen, selectedRecord?.id, historyFilters]);

  const loadMoreHistory = async () => {
    if (!selectedRecord || loadingHistory || loadingMoreHistory || !hasMoreHistory) return;
    setLoadingMoreHistory(true);
    try {
      const nextPage = historyPage + 1;
      const history = await fetchportHistory(selectedRecord.id, nextPage, HISTORY_PAGE_SIZE, {
        keyword: historyFilters.keyword || undefined,
        fromDate: historyFilters.fromDate || undefined,
        toDate: historyFilters.toDate || undefined,
      });
      if (history && history.length > 0) {
        const filteredMore = history.filter((r: any) => r && !['spatialId', 'infrastructureList', 'attachments'].includes(r.changedField));
        setHistoryRecords(prev => [...prev, ...filteredMore]);
        setHistoryPage(nextPage);
        setHasMoreHistory(history.length === HISTORY_PAGE_SIZE);
      } else {
        setHistoryPage(nextPage);
        setHasMoreHistory(false);
      }
    } catch { /* ignore */ }
    finally { setLoadingMoreHistory(false); }
  };

  // ── Render ───────────────────────────────────────────────────────
  return (
    <ThemeTokenProvider tokens={themeTokenChk}>
    <>
      {!isIframeModal && (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
          <ScreenHeader
            breadcrumb={[{ label: 'Tài sản KCHTGT' }, { label: 'Quản lý cảng biển' }]}
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

            ].filter((x) => x !== null) as ScreenHeaderAction[]}
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
                  Đơn vị quản lý
                </div>
                <OrgUnitTreeSelect
                  organizations={orgUnits}
                  placeholder="Chọn đơn vị..."
                  allowClear
                  showPath
                  allLabel="Tất cả"
                  treeDefaultExpandAll={false}
                  value={filterValues.orgUnitId || undefined}
                  onChange={(val) => setFilterValues((prev) => ({ ...prev, orgUnitId: val }))}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tên cảng biển</div>
                <Input placeholder="Tìm theo tên cảng biển..." allowClear
                  value={filterValues.portName || ''}
                  onChange={(e) => setFilterValues((prev) => ({ ...prev, portName: e.target.value }))}
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
                  <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Mã cảng biển</div>
                  <Input placeholder="Tìm theo mã cảng biển..." allowClear
                    value={filterValues.portCode || ''}
                    onChange={(e) => setFilterValues((prev) => ({ ...prev, portCode: e.target.value }))}
                    onPressEnter={handleFilterApply}
                    style={{ borderRadius: radiusPill, height: 40 }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Địa điểm (Tỉnh/Thành phố)</div>
                  <Select placeholder="Chọn tỉnh/thành phố" allowClear showSearch
                    filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                    value={filterValues.province || undefined}
                    onChange={(val) => setFilterValues((prev) => ({ ...prev, province: val }))}
                    options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))}
                    style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Ngày cập nhật</div>
                  <DatePicker.RangePicker format="DD/MM/YYYY"
                    placeholder={['Từ ngày', 'Đến ngày']} allowClear className="port-range-picker" classNames={{ popup: { root: 'range-single-panel' } }}
                    value={[filterValues.updatedFrom ? dayjs(filterValues.updatedFrom) : null, filterValues.updatedTo ? dayjs(filterValues.updatedTo) : null]}
                    onChange={(dates) => setFilterValues((prev) => ({ ...prev, updatedFrom: dates?.[0] ? dates[0].format('YYYY-MM-DD 00:00:00') : undefined, updatedTo: dates?.[1] ? dates[1].format('YYYY-MM-DD 23:59:59') : undefined }))}
                    style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }} />
                </div>
                <style>{`.port-range-picker .ant-picker-cell-selected .ant-picker-cell-inner{background:${actionPrimary}!important}.port-range-picker .ant-picker-ok button{background:${actionPrimary}!important;border-color:${actionPrimary}!important;border-radius:${radiusPill}px!important}.port-range-picker .ant-picker-time-panel-cell-selected .ant-picker-time-panel-cell-inner{background:${actionPrimary}15!important;color:${actionPrimary}!important}.port-range-picker .ant-picker-today-btn{color:${actionPrimary}!important}.range-single-panel .ant-picker-panel-container .ant-picker-panel:last-child{display:none!important}`}</style>
              </>)}
            </>}
            statusTabs={[
              { key: 'all', label: 'Tất cả', count: totalAll || 0, color: actionPrimary, active: !activeStatusTab },
              { key: 'DRAFT', label: 'Lưu tạm', count: tabCounts['DRAFT'] ?? 0, color: statusDraft, active: activeStatusTab === 'DRAFT' },
              { key: 'APPROVED', label: 'Đã phê duyệt', count: tabCounts['APPROVED'] ?? 0, color: statusOperational, active: activeStatusTab === 'APPROVED' },
            ]}
            onStatusTabChange={(key) => {
              setActiveStatusTab(key === 'all' ? '' : key);
              setFilterApprovalStatus(key === 'all' ? undefined : key);
              if (key === 'all') { setFilterStatus(undefined); setFilterTinh(''); setFilterName(''); setFilterCode(''); }
              setPage(1);
            }}
          >
            <DataTable columns={columns}
              dataSource={[...dataSource].sort((a: any, b: any) => {
                if (!sortField) return 0;
                const resolve = (r: any) => {
                  if (sortField === 'orgUnitId') return orgLevel2Map.get(r.orgUnitId) ?? r.orgUnitName ?? '';
                  if (sortField === 'updatedBy') return r.updatedByName ?? '';
                  if (sortField === 'approvalStatus') {
                    const rank: Record<string, number> = { DRAFT: 1, PROPOSED: 1, PENDING: 2, PENDING_APPROVAL: 2, APPROVED: 3, REJECTED: 4 };
                    return rank[String(r.approvalStatus || '').toUpperCase()] ?? 99;
                  }
                  return r[sortField] ?? '';
                };
                const aVal = resolve(a);
                const bVal = resolve(b);
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
        </div>
      )}

      {/* ── Create Drawer ─────────────────────────────── */}
      {!isIframeModal && (
        <AppDrawer
          title={
            <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
              Thêm mới cảng biển
            </span>
          }
          open={createModalVisible}
          onClose={() => { setCreateModalVisible(false); setInfraList([]); setUploadFileList([]); setGpsCoordList([]); createForm.resetFields(); }}
          footer={
            <div style={drawerFooterStyle}>
              <Button onClick={() => { actionTypeRef.current = 'draft'; setActionType('draft'); createForm.submit(); }} loading={submitting && actionType === 'draft'} style={outlineButtonStyle}>Lưu tạm</Button>
              {canSubmitForApproval && <Button type="primary" onClick={() => { actionTypeRef.current = 'approve'; setActionType('approve'); createForm.submit(); }} loading={submitting && actionType === 'approve'} style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}>Lưu và phê duyệt</Button>}
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
          <PortForm
            form={createForm}
            mode="create"
            geometryType={createGeometryType}
            atMax={atMaxCreate}
            activeTabKey={createTabKey}
            onTabChange={setCreateTabKey}
            portCodeLoading={portCodeLoading}
            orgUnits={orgUnits}
            symbols={symbols}
            gpsCoordList={gpsCoordList}
            gpsError={gpsError}
            gpsPage={gpsPage}
            onGpsPageChange={setGpsPage}
            addGpsPoint={addGpsPoint}
            removeGpsPoint={removeGpsPoint}
            updateGpsPoint={updateGpsPoint}
            infraList={infraList}
            addInfra={addInfra}
            removeInfra={removeInfra}
            updateInfraName={updateInfraName}
            updateInfraQty={updateInfraQty}
            uploadFileList={uploadFileList}
            setUploadFileList={setUploadFileList}
            onFinish={handleCreateFinish}
            onFinishFailed={handleFormFailed}
          />
        </AppDrawer>
      )}

      {/* ── Edit Drawer ──────────────────────────────────────────────── */}
      {(!isIframeModal || action === 'edit') && (
        <AppDrawer
          size={isIframeModal ? '100%' : 1000}
          mask={!isIframeModal}
          title={
            <span style={drawerTitleStyle}>
              {selectedRecord
                ? `Chỉnh sửa thông tin — ${selectedRecord.portName}`
                : 'Chỉnh sửa thông tin cảng biển'}
            </span>
          }
          open={updateModalVisible}
          onClose={closeUpdateModal}
          footer={
            <div style={drawerFooterStyle}>
              <Button htmlType="submit" loading={submitting} onClick={() => { editActionRef.current = 'draft'; updateForm.submit(); }} style={outlineButtonStyle}>Lưu tạm</Button>
              <Button type="primary" htmlType="submit" loading={submitting} onClick={() => { editActionRef.current = 'approve'; updateForm.submit(); }} style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}>Lưu và phê duyệt</Button>
            </div>
          }
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '0 24px 12px 24px' },
          }}
        >
          <style>{requiredMarkStyle}</style>
          <PortForm
            form={updateForm}
            mode="update"
            geometryType={updateGeometryType}
            atMax={atMaxUpdate}
            orgUnits={orgUnits}
            symbols={symbols}
            gpsCoordList={gpsCoordList}
            gpsError={gpsError}
            gpsPage={gpsPage}
            onGpsPageChange={setGpsPage}
            addGpsPoint={addGpsPoint}
            removeGpsPoint={removeGpsPoint}
            updateGpsPoint={updateGpsPoint}
            infraList={infraList}
            addInfra={addInfra}
            removeInfra={removeInfra}
            updateInfraName={updateInfraName}
            updateInfraQty={updateInfraQty}
            uploadFileList={uploadFileList}
            setUploadFileList={setUploadFileList}
            onFinish={handleUpdateFinish}
            onFinishFailed={handleFormFailed}
          />
        </AppDrawer>
      )}

      {/* ── Detail Drawer ──────────────────────────────────────────── */}
      {(!isIframeModal || action === 'detail') && (
        <AppDrawer
          size={isIframeModal ? '100%' : 1000}
          mask={!isIframeModal}
          title={
            selectedRecord
              ? <span style={drawerTitleStyle}>Chi tiết cảng biển - {selectedRecord.portName}</span>
              : <span style={drawerTitleStyle}>Chi tiết cảng biển</span>
          }
          open={detailModalVisible}
          onClose={closeDetailModal}
          footer={null}
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '0 24px 12px 24px' },
          }}
        >
          {selectedRecord && (
            <PortDetailContent
              selectedRecord={selectedRecord}
              orgLevel2Map={orgLevel2Map}
              userMap={userMap}
              symbols={symbols}
              detailFiles={detailFiles}
              otherInfra={otherInfra}
              infraFilter={infraFilter}
              setInfraFilter={setInfraFilter}
              infraPage={infraPage}
              setInfraPage={setInfraPage}
              infraPageSize={infraPageSize}
              setInfraPageSize={setInfraPageSize}
              openKchtDetail={openKchtDetail}
              ddToDms={ddToDms}
            />
          )}

        </AppDrawer>
      )}


      {/* ── Chi tiết KCHT khác (Drawer lồng — không chuyển trang) ── */}
      <AppDrawer
        size={isIframeModal ? '100%' : 950}
        mask={!isIframeModal}
        title={
          <span style={drawerTitleStyle}>
            {kchtDetailRecord
              ? `Chi tiết ${kchtDetailType === 'berth' ? 'bến cảng' : 'vùng nước'} - ${kchtDetailRecord.berthName || kchtDetailRecord.waterZoneName || ''}`
              : 'Chi tiết kết cấu hạ tầng'}
          </span>
        }
        open={kchtDetailOpen}
        onClose={() => setKchtDetailOpen(false)}
        footer={null}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px' },
        }}
      >
        {kchtDetailLoading ? (
          <div style={{ padding: 48, textAlign: 'center', color: textTertiary, fontSize: fontSizeMd }}>Đang tải chi tiết...</div>
        ) : kchtDetailRecord && kchtDetailType === 'berth' ? (
          <BerthDetailContent
            selectedRecord={kchtDetailRecord}
            orgMap={new Map((orgUnits || []).map((o: any) => [o.id, o.name]))}
            symbolMap={new Map((symbols || []).map((s: any) => [s.id, s.name]))}
            symbolImageMap={new Map((symbols || []).filter((s: any) => s.image).map((s: any) => [s.id, s.image]))}
            portOptions={selectedRecord ? [{ value: selectedRecord.id, label: selectedRecord.portName || selectedRecord.portCode }] : []}
            userMap={userMap}
            detailFiles={kchtDetailFiles}
            ddToDms={(dd: number) => { const r = ddToDms(dd); return { d: r.d ?? 0, m: r.m ?? 0, s: r.s ?? 0 }; }}
            approvalStyleMap={APPROVAL_STYLE_MAP}
            structureTypeOptions={STRUCTURE_TYPE_OPTIONS}
            waterwayMap={waterwayMap}
            onViewPierDetail={openPierDetail}
          />
        ) : kchtDetailRecord && kchtDetailType === 'waterzone' ? (
          <WaterZoneDetailMini record={kchtDetailRecord} symbols={symbols as any[]} files={kchtDetailFiles} userMap={userMap} />
        ) : null}
      </AppDrawer>

      {/* ── Pier Detail Drawer (sibling — tránh drawer lồng bị đẩy kích thước) ── */}
      <AppDrawer
        size={900}
        title={<span style={drawerTitleStyle}>Chi tiết cầu cảng{pierDetailRecord ? ` - ${pierDetailRecord.pierName || pierDetailRecord.pierCode || ''}` : ''}</span>}
        open={pierDetailOpen}
        onClose={() => setPierDetailOpen(false)}
        footer={null}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px' },
        }}
      >
        {pierDetailLoading ? (
          <div style={{ padding: 48, textAlign: 'center', color: textTertiary, fontSize: fontSizeMd }}>Đang tải chi tiết...</div>
        ) : pierDetailRecord ? (
          <PierDetailContent
            selectedRecord={pierDetailRecord}
            orgMap={new Map((orgUnits || []).map((o: any) => [o.id, o.name]))}
            organizations={orgUnits as any}
            portMap={new Map([[selectedRecord?.id ?? '', selectedRecord?.portName || '']])}
            berthOptions={kchtDetailRecord ? [{ value: kchtDetailRecord.id, label: kchtDetailRecord.berthName || kchtDetailRecord.berthCode || '' }] : []}
            symbolMap={new Map((symbols || []).map((s: any) => [s.id, s.name]))}
            symbolImageMap={new Map((symbols || []).filter((s: any) => s.image).map((s: any) => [s.id, s.image]))}
            detailFiles={pierDetailFiles}
            ddToDms={(dd: number) => { const r = ddToDms(dd); return { d: r.d ?? 0, m: r.m ?? 0, s: r.s ?? 0 }; }}
            approvalStyleMap={APPROVAL_STYLE_MAP}
            operationalStyleMap={{
              OPERATIONAL: { color: statusOperational, label: 'Đang khai thác/vận hành' },
              NOT_YET_OPERATIONAL: { color: statusAttention, label: 'Chưa khai thác/vận hành' },
              SUSPENDED: { color: statusCritical, label: 'Dừng khai thác/vận hành' },
            }}
            userMap={userMap}
            waterwayMap={waterwayMap}
          />
        ) : null}
      </AppDrawer>

      {/* ── History drawer (chuẩn VTS: server-side lọc + phân trang) ── */}
      <CommonHistoryDrawer
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        entityName={selectedRecord?.portName || selectedRecord?.portCode}
        records={historyRecords}
        loading={loadingHistory}
        serverFiltered
        onFilterChange={setHistoryFilters}
        onLoadMore={loadMoreHistory}
        loadingMore={loadingMoreHistory}
        fieldLabelMap={PORT_HISTORY_FIELD_LABELS}
        formatValue={(field, value) => resolvePortHistoryValue(field, value, orgMap, symbolMap)}
      />

      {selectedRecord && (
        <DocumentUploadModal
          entityType="port"
          entityId={selectedRecord.id}
          open={uploadModalVisible}
          onCancel={() => setUploadModalVisible(false)}
        />
      )}

      {/* Approve Modal (chuẩn VTS CHK) */}
      <ApprovalModal
        visible={approveModalOpen}
        level={approvingRecord?.approvalStatus === 'APPROVED_LEVEL1' ? 'c2' : 'c1'}
        onConfirm={(content) => { void handleConfirmApprove(content); }}
        onCancel={() => { setApproveModalOpen(false); setApprovingRecord(null); }}
      />

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

      {/* Delete confirmation modal */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Xác nhận xóa cảng biển</span>}
        open={!!deleteTarget}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteConfirmText('');
        }}
        footer={[
          <Button key="cancel" onClick={() => { setDeleteTarget(null); setDeleteConfirmText(''); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="delete" type="primary" danger onClick={handleDeleteConfirm}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Xác nhận xóa</Button>,
        ]}
        width={480}
      >
        <div style={{ padding: '8px 0' }}>
          <Alert message="Hành động này không thể hoàn tác" type="warning" showIcon icon={<ExclamationCircleOutlined />}
            style={{ marginBottom: spaceFormField, borderRadius: radiusPill }} />
          <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>
            Vui lòng nhập <strong>tên cảng</strong> hoặc gõ <strong>"XÓA"</strong> để xác nhận xóa.
          </p>
          {deleteTarget && (
            <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>
              Cảng: <strong style={{ color: textPrimary }}>{deleteTarget.portName}</strong>
            </p>
          )}
          <Input placeholder="Nhập tên cảng hoặc XÓA" value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)} onPressEnter={handleDeleteConfirm}
            style={{ borderRadius: radiusPill, height: 40 }} autoFocus />
        </div>
      </Modal>
    </>
    </ThemeTokenProvider>
  );
}

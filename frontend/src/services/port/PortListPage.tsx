import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
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
  message,
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
  FilterOutlined,
  FileOutlined,
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
import { ScreenHeader, FilterBar, StatusTabs, DataTable } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
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

const labelProps = (text: string) => ({
  label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

export default function PortListPage() {
  const navigate = useNavigate();

  // ── Permission ──────────────────────────────────────────────────
  const hasPerm = usePermissionStore((s) => s.hasPermission);
  const canSubmitForApproval = hasPerm?.('admin:manage') || hasPerm?.('Port:approve');

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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
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
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);
  const [historyVisibleCount, setHistoryVisibleCount] = useState(10);
  const [historySearch, setHistorySearch] = useState('');
  const historySearchRef = useRef('');
  const [historyDateFrom, setHistoryDateFrom] = useState<string>('');
  const [historyDateTo, setHistoryDateTo] = useState<string>('');

  // Reject modal
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<CangBienResponse | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Auto-generate port code for create modal
  const [portCodeLoading, setPortCodeLoading] = useState(false);
  const [createTabKey, setCreateTabKey] = useState('general');

  // Infrastructure list for create modal
  const [infraList, setInfraList] = useState<Array<{ stt: number; infraName: string; quantity: number | null }>>([]);
  const [uploadFileList, setUploadFileList] = useState<any[]>([]);

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
  const [orgUnits, setOrgUnits] = useState<any[]>([]);
  const [symbols, setSymbols] = useState<Symbol[]>([]);

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
              displayRule: data.displayRule != null ? data.displayRule : undefined,
              waterAreaScope: data.waterAreaScope || undefined,
              remarks: data.remarks || undefined,
              gisLocation: {
                geometryType: data.geometryType || 'POINT',
                coordinates: data.coordinates || '',
                mapSymbolId: data.mapSymbolId,
              },
            });
            // Load infrastructure & attachments for edit
            setInfraList(((data as any).infrastructureList || []).map((i: any) => ({ stt: i.stt, infraName: i.infraName, quantity: i.quantity })));
            setUploadFileList(((data as any).attachments || []).map((a: any) => ({ uid: a.id, name: a.fileName, size: a.fileSize, status: 'done' as const })));
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
        } catch (err) {
          console.error('Failed to load org units', err);
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
  const createGeometryType = Form.useWatch('geometryType', createForm) || 'POINT';
  const updateGeometryType = Form.useWatch('geometryType', updateForm) || 'POINT';

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
      if (infra.quantity == null || Number(infra.quantity) <= 0) { toast.error('Số lượng công trình KCHT phải lớn hơn 0'); return; }
    }

    // Validate required fields for submit
    if (actionType === 'submit') {
      if (!values.orgUnitId) { toast.error('Đơn vị quản lý là bắt buộc khi gửi phê duyệt'); return; }
      if (!values.province) { toast.error('Tỉnh/Thành phố là bắt buộc khi gửi phê duyệt'); return; }
      if (values.portClass == null || values.portClass === '') { toast.error('Phân cấp cảng biển là bắt buộc khi gửi phê duyệt'); return; }
      const gis = values.gisLocation as any;
      if (!gis?.coordinates || String(gis.coordinates).trim() === '') {
        toast.error('Tọa độ GPS là bắt buộc khi gửi phê duyệt. Vui lòng chọn vị trí trên bản đồ.');
        return;
      }
    }

    setSubmitting(true);
    try {
      // Parse tọa độ từ GIS location (hỗ trợ POINT và MULTIPOINT)
      let coordinateList: Array<{ latitude: number; longitude: number }> = [];
      const gisLocation = values.gisLocation as any;
      if (gisLocation?.coordinates) {
        const wkt = String(gisLocation.coordinates);
        // MULTIPOINT((lng1 lat1),(lng2 lat2),...)
        const multiMatch = wkt.match(/MULTIPOINT\s*\(([^)]+(?:\),[^)]+)*)/);
        if (multiMatch) {
          const pts = multiMatch[1].split('),(');
          coordinateList = pts.map((pt: string) => {
            const parts = pt.replace(/[()]/g, '').trim().split(/\s+/);
            return { latitude: Number(parts[1]), longitude: Number(parts[0]) };
          });
        } else {
          // POINT(lng lat)
          const match = wkt.match(/POINT\s*\(([-\d.]+)\s+([-\d.]+)\)/);
          if (match) {
            coordinateList = [{ latitude: Number(match[2]), longitude: Number(match[1]) }];
          }
        }
      }

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
        approvalStatus: actionType === 'draft' ? 'DRAFT' : actionType === 'approve' ? 'DA_PHE_DUYET' : 'CHO_PHE_DUYET',
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
        action: actionType,
      };
      const createdPort = await import('./api').then((m) => m.createCangBien(payload));
      const createdPortId = createdPort?.id || (createdPort as any)?.portId;
      toast.success(actionType === 'draft' ? 'Lưu tạm thành công' : 'Gửi phê duyệt thành công');
      createForm.resetFields();

      setInfraList([]);
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

      // Parse tọa độ từ GIS location (hỗ trợ POINT và MULTIPOINT)
      let coordinateList: Array<{ latitude: number; longitude: number }> = [];
      const gisLocation = values.gisLocation as any;
      if (gisLocation?.coordinates) {
        const wkt = String(gisLocation.coordinates);
        // MULTIPOINT((lng1 lat1),(lng2 lat2),...)
        const multiMatch = wkt.match(/MULTIPOINT\s*\(([^)]+(?:\),[^)]+)*)/);
        if (multiMatch) {
          const pts = multiMatch[1].split('),(');
          coordinateList = pts.map((pt: string) => {
            const parts = pt.replace(/[()]/g, '').trim().split(/\s+/);
            return { latitude: Number(parts[1]), longitude: Number(parts[0]) };
          });
        } else {
          // POINT(lng lat)
          const match = wkt.match(/POINT\s*\(([-\d.]+)\s+([-\d.]+)\)/);
          if (match) {
            coordinateList = [{ latitude: Number(match[2]), longitude: Number(match[1]) }];
          }
        }
      }

      const payload = {
        id: selectedRecord.id,
        portCode: (values.portCode as string) || undefined,
        portName: (values.portName as string) || undefined,
        province: (values.province as string) || undefined,
        area: values.area as number | undefined,
        maxVesselCapacity: values.khaNangTiepNhan as number | undefined,
        operationalStatus: (values.operationalStatus as string) || undefined,
        approvalStatus: 'CHO_PHE_DUYET',
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
      toast.success('Cập nhật thành công — chờ phê duyệt lại');
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
        sortBy: 'updatedAt',
        sortOrder: 'desc',
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
          const res = await fetchCangBienList({ approvalStatus: status, page: 0, size: 1 });
          counts[status] = res?.totalElements ?? 0;
        } catch { counts[status] = 0; }
      }),
      fetchCangBienList({ page: 0, size: 1 }).then(res => setTotalAll(res?.totalElements ?? 0)).catch(() => {}),
    ]);
    setTabCounts(counts);
  }, []);

  useEffect(() => { if (!isIframeModal) void fetchData(); }, [fetchData, isIframeModal]);
  useEffect(() => { if (!isIframeModal) void fetchTabCounts(); }, [fetchTabCounts, isIframeModal]);

  const handleDelete = useCallback(
    (record: CangBienResponse) => {
      setDeleteTarget(record);
      setDeleteConfirmText('');
    },
    [],
  );

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const expected = deleteTarget.portName || '';
    if (deleteConfirmText.trim() !== expected && deleteConfirmText.trim() !== 'XÓA') {
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
      confirm({
        title: 'Xác nhận phê duyệt',
        icon: <ExclamationCircleOutlined />,
        content: `Phê duyệt cảng biển "${record.portName}"?`,
        okText: 'Phê duyệt',
        cancelText: 'Hủy',
        onOk: async () => {
          try {
            await approveCangBien(record.id);
            toast.success('Phê duyệt thành công');
            fetchData();
            fetchTabCounts();
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Phê duyệt thất bại';
            toast.error(msg);
          }
        },
      });
    },
    [fetchData, fetchTabCounts],
  );

  const handleSubmitDraft = useCallback(
    async (record: CangBienResponse) => {
      try {
        await updateCangBien({ id: record.id, approvalStatus: 'PENDING' });
        toast.success('Đã gửi phê duyệt');
        fetchData();
        fetchTabCounts();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gửi phê duyệt thất bại';
        toast.error(msg);
      }
    },
    [fetchData, fetchTabCounts],
  );

  const handleReject = useCallback((record: CangBienResponse) => {
    setRejectTarget(record);
    setRejectReason('');
    setRejectModalVisible(true);
  }, []);

  const handleRejectConfirm = async () => {
    if (!rejectTarget) return;
    if (!rejectReason || rejectReason.trim().length < 10) {
      toast.error('Lý do từ chối tối thiểu 10 ký tự');
      return;
    }
    try {
      await rejectCangBien(rejectTarget.id, rejectReason.trim());
      toast.success('Từ chối thành công');
      setRejectModalVisible(false);
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
      setHistoryPage(1);
      setHistoryVisibleCount(10);
      setHistorySearch('');
      historySearchRef.current = '';
      setHistoryDateFrom('');
      setHistoryDateTo('');
      const { fetchportHistory } = await import('./api');
      const histData = await fetchportHistory(record.id, { page: 0, size: 200 });
      setHistoryRecords(histData.changeHistory || []);
      setHistoryExpanded({}); // will be re-initialized on next render
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
      const status = record.approvalStatus;
      // DRAFT: Gửi phê duyệt
      if (status === 'DRAFT' && hasPerm?.('Port:update')) {
        actions.push({
          key: 'submit',
          label: 'Gửi phê duyệt',
          icon: <SendOutlined />,
          onClick: () => handleSubmitDraft(record),
        });
      }
      // PENDING: Phê duyệt + Từ chối
      if (status === 'PENDING' && hasPerm?.('Port:approve')) {
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
      // Chỉnh sửa: tất cả trạng thái (kể cả PENDING)
      if (hasPerm?.('Port:update')) {
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
                displayRule: data.displayRule,
              });
              // Load infrastructure & attachments for edit
              setInfraList(((data as any).infrastructureList || []).map((i: any) => ({ stt: i.stt, infraName: i.infraName, quantity: i.quantity })));
              setUploadFileList(((data as any).attachments || []).map((a: any) => ({ uid: a.id, name: a.fileName, size: a.fileSize, status: 'done' as const })));
              setUpdateModalVisible(true);
            } catch (err) {
              toast.error('Không thể tải thông tin chỉnh sửa cảng biển');
            } finally {
              setIsLoading(false);
            }
          },
        });
      }
      // Xóa: tất cả trạng thái (kể cả PENDING)
      if (hasPerm?.('Port:delete')) {
        actions.push({
          key: 'delete',
          label: 'Xóa',
          icon: <DeleteOutlined />,
          danger: true,
          onClick: () => handleDelete(record),
        });
      }
      actions.push({
        key: 'history',
        label: 'Lịch sử',
        icon: <HistoryOutlined />,
        onClick: () => historyHandler(record),
      });
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
        width: 250,
        render: (_v: string | null, record: CangBienResponse) => record.orgUnitName || _v || '—',
      },
      {
        key: 'portName',
        label: 'Tên cảng biển',
        dataIndex: 'portName',
        width: 250,
      },
      {
        key: 'portGroup',
        label: 'Nhóm cảng biển',
        dataIndex: 'portGroup',
        width: 100,
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
        width: 150,
        render: (v: string | null) => (
          <span>{formatDate(v)}</span>
        ),
      },
      {
        key: 'updatedBy',
        label: 'Cán bộ cập nhật',
        dataIndex: 'updatedByName',
        width: 140,
        render: (v: string | null) => v || '—',
      },
      {
        key: 'approvalStatus',
        label: 'Trạng thái',
        dataIndex: 'approvalStatus',
        width: 160,
        render: (v: string) => {
          if (!v) return '—';
          const badge = trangThaiPheDuyetBadge(v);
          let color = textTertiary;
          if (badge.color === 'green') color = statusOperational;
          else if (badge.color === 'red') color = statusCritical;
          else if (badge.color === 'orange') color = statusAttention;
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
    [page, pageSize, getPortGroupLabel],
  );

  // ── Filter fields ────────────────────────────────────────────────
  const filterFields = useMemo(
    () => [
      {
        key: 'orgUnitId',
        type: 'select' as const,
        label: 'Đơn vị quản lý',
        placeholder: 'Chọn đơn vị',
        options: orgUnits.map((o) => ({ value: o.id, label: o.name })),
      },
      {
        key: 'search',
        type: 'search' as const,
        label: 'Tên cảng biển',
        placeholder: 'Tìm theo tên cảng...',
      },
      {
        key: 'portClass',
        type: 'select' as const,
        label: 'Phân cấp',
        placeholder: 'Chọn phân cấp',
        options: [
          { value: '5', label: 'Cấp đặc biệt' },
          { value: '1', label: 'Cấp 1' },
          { value: '2', label: 'Cấp 2' },
          { value: '3', label: 'Cấp 3' },
          { value: '4', label: 'Cấp 4' },
        ],
      },
      // Advanced filters (collapsible)
      ...(showAdvancedFilters ? [
        {
          key: 'portGroup',
          type: 'select' as const,
          label: 'Nhóm cảng biển',
          placeholder: 'Chọn nhóm',
          options: [
            { value: '1', label: 'Nhóm 1' },
            { value: '2', label: 'Nhóm 2' },
            { value: '3', label: 'Nhóm 3' },
            { value: '4', label: 'Nhóm 4' },
            { value: '5', label: 'Nhóm 5' },
          ],
        },
        {
          key: 'province',
          type: 'select' as const,
          label: 'Địa điểm',
          placeholder: 'Chọn tỉnh/thành phố',
          options: VIETNAM_PROVINCES.map((p) => ({ value: p, label: p })),
        },
        {
          key: 'updatedFrom',
          type: 'date' as const,
          label: 'Từ ngày',
          placeholder: 'Chọn ngày',
        },
        {
          key: 'updatedTo',
          type: 'date' as const,
          label: 'Đến ngày',
          placeholder: 'Chọn ngày',
        },
        {
          key: 'approvalStatus',
          type: 'select' as const,
          label: 'Trạng thái',
          placeholder: 'Tất cả',
          options: [
            { value: '', label: 'Tất cả' },
            { value: 'DRAFT', label: 'Nháp' },
            { value: 'PENDING', label: 'Chờ phê duyệt' },
            { value: 'APPROVED', label: 'Được phê duyệt' },
            { value: 'REJECTED', label: 'Từ chối' },
          ],
        },
      ] : []),
    ],
    [orgUnits, showAdvancedFilters],
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

  // ── Render ───────────────────────────────────────────────────────
  return (
    <>
      {!isIframeModal && (
        <>
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

          <FilterBar
            fields={filterFields}
            onSearch={(values) => {
              setSearch(values.search || '');
              setFilterOrgUnitId(values.orgUnitId || undefined);
              setFilterPortClass(values.portClass ? Number(values.portClass) : undefined);
              setFilterPortGroup(values.portGroup ? Number(values.portGroup) : undefined);
              setFilterTinh(values.province || '');
              setFilterUpdatedFrom(values.updatedFrom || undefined);
              setFilterUpdatedTo(values.updatedTo || undefined);
              setFilterApprovalStatus(values.approvalStatus || undefined);
              setPage(1);
            }}
            onReset={() => {
              setSearch('');
              setFilterOrgUnitId(undefined);
              setFilterTinh('');
              setFilterPortGroup(undefined);
              setFilterPortClass(undefined);
              setFilterUpdatedFrom(undefined);
              setFilterUpdatedTo(undefined);
              setFilterStatus(undefined);
              setFilterApprovalStatus(undefined);
              setActiveStatusTab('');
              setPage(1);
            }}
          />

          {/* StatusTabs + Filter toggle */}
          <div
            style={{
              ...cardStyle,
              marginBottom: 4,
              display: 'flex',
              alignItems: 'center',
              padding: '4px 16px',
            }}
          >
            <div style={{ flex: 1 }} />
            <StatusTabs
              tabs={[
                { key: 'all', label: 'Tất cả', count: totalAll || 0, color: actionPrimary, active: !activeStatusTab },
                { key: 'DRAFT', label: 'Nháp', count: tabCounts['DRAFT'] ?? 0, color: statusDraft, active: activeStatusTab === 'DRAFT' },
                { key: 'PENDING', label: 'Chờ phê duyệt', count: tabCounts['PENDING'] ?? 0, color: statusAttention, active: activeStatusTab === 'PENDING' },
                { key: 'APPROVED', label: 'Được phê duyệt', count: tabCounts['APPROVED'] ?? 0, color: statusOperational, active: activeStatusTab === 'APPROVED' },
                { key: 'REJECTED', label: 'Từ chối', count: tabCounts['REJECTED'] ?? 0, color: statusCritical, active: activeStatusTab === 'REJECTED' },
              ]}
              onChange={(key) => {
                setActiveStatusTab(key === 'all' ? '' : key);
                setFilterApprovalStatus(key === 'all' ? undefined : key);
                if (key === 'all') {
                  setFilterStatus(undefined);
                  setFilterTinh(undefined);
                  setSearch('');
                }
                setPage(1);
              }}
            />
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="link"
              size="small"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              icon={<FilterOutlined />}
              style={{ color: colors.primaryActive, fontWeight: 500, flexShrink: 0 }}
            >
              {showAdvancedFilters ? 'Thu gọn' : 'Bộ lọc nâng cao'}
            </Button>
            </div>
          </div>

          <div style={{ ...cardStyle, padding: '8px 16px' }}>
            <Spin spinning={isLoading}>
              {isError && (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <p>Đã xảy ra lỗi khi tải danh sách.</p>
                  <Button onClick={fetchData}>Thử lại</Button>
                </div>
              )}
              {!isLoading && !isError && dataSource.length === 0 && (
                <EmptyState
                  description={
                    search || filterTinh || filterStatus
                      ? 'Không tìm thấy cảng biển nào phù hợp'
                      : 'Chưa có cảng biển nào'
                  }
                />
              )}
              {!isLoading && !isError && dataSource.length > 0 && (
                <DataTable
                  columns={columns}
                  dataSource={dataSource}
                  rowKey="id"
                  rowActions={rowActions}
                  loading={false}
                  scroll={{ x: 1400, y: 'calc(100vh - 450px)' }}
                />
              )}
              <Pagination
                total={total}
                current={page}
                pageSize={pageSize}
                onChange={(p, ps) => {
                  setPage(p);
                  setPageSize(ps);
                }}
              />
            </Spin>
          </div>
        </>
      )}

      {/* ── Create Modal (Tabs layout) ─────────────────────────────── */}
      {!isIframeModal && (
        <Modal
          title={
            <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: 15 }}>
              Tạo mới Cảng biển
            </span>
          }
          open={createModalVisible}
          afterOpenChange={async (open) => {
            if (open) {
              // Reset toàn bộ trước khi mở form mới
              createForm.resetFields();
              setInfraList([]);
              setUploadFileList([]);
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
          onCancel={() => { setCreateModalVisible(false); setInfraList([]); setUploadFileList([]); }}
          footer={null}
          width={900}
          forceRender
        >
          <Form
            form={createForm}
            layout="vertical"
            onFinish={handleCreateFinish}
            onFinishFailed={handleFormFailed}
            initialValues={{ approvalStatus: 'CHO_PHE_DUYET' }}
          >
            <Tabs
              activeKey={createTabKey}
              onChange={(key) => setCreateTabKey(key)}
              items={[
                {
                  key: 'general',
                  label: 'Thông tin chung',
                  children: (
                    <>
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
                            name="portCode"
                            {...labelProps('Mã cảng')}
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
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="portName"
                            {...labelProps('Tên cảng')}
                            style={{ marginBottom: spaceFormField }}
                            rules={[
                              { required: true, message: 'Tên cảng không được để trống' },
                              { max: 255, message: 'Tên cảng tối đa 255 ký tự' },
                            ]}
                          >
                            <Input placeholder="VD: Cảng biển Hải Phòng" maxLength={255} style={inputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="province"
                            {...labelProps('Tỉnh/thành phố')}
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
                      </Row>
                      <Row gutter={16}>
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
                        <Col span={12}>
                          <Form.Item
                             name="portClass"
                            {...labelProps('Phân cấp')}
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
                      </Row>
                      <Row gutter={16}>
                        <Col span={24}>
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
                        <Col span={24}>
                          <Form.Item
                            name="remarks"
                            {...labelProps('Ghi chú')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input.TextArea rows={2} placeholder="Ghi chú" maxLength={2000} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </>
                  ),
                },
                {
                  key: 'stats',
                  label: 'Thống kê',
                  children: (
                    <>
                      <Row gutter={16}>
                        <Col span={24}>
                          <Form.Item
                            name="waterAreaScope"
                            {...labelProps('Phạm vi vùng nước')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input.TextArea rows={2} placeholder="Mô tả phạm vi vùng nước cảng biển" maxLength={2000} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="totalBerths"
                            {...labelProps('Tổng bến cảng')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="totalAnchoragesTransshipment"
                            {...labelProps('Tổng khu neo đậu, chuyển tải')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={6}>
                          <Form.Item
                            name="totalPublicChannels"
                            {...labelProps('Tuyến luồng công cộng')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="totalDedicatedChannels"
                            {...labelProps('Tuyến luồng chuyên dùng')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="totalPublicChannelLength"
                            {...labelProps('Dài luồng công cộng (m)')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="totalDedicatedChannelLength"
                            {...labelProps('Dài luồng chuyên dùng (m)')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={6}>
                          <Form.Item
                            name="totalBuoysBeacons"
                            {...labelProps('Phao tiêu báo hiệu')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="totalDikes"
                            {...labelProps('Tổng đê kè')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="totalDikeLength"
                            {...labelProps('Dài đê kè (m)')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="totalLighthouses"
                            {...labelProps('Đèn biển, đăng tiêu')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={6}>
                          <Form.Item
                            name="buoyBerthCount"
                            {...labelProps('Số bến phao')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="anchorageCount"
                            {...labelProps('Số khu neo đậu')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="transshipmentCount"
                            {...labelProps('Số khu chuyển tải')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="otherWaterAreas"
                            {...labelProps('Các khu nước khác')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input placeholder="Mô tả" maxLength={2000} style={inputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </>
                  ),
                },
                {
                  key: 'gis',
                  label: 'Vị trí',
                  children: (
                    <>
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
                            <Select placeholder="Chọn hệ quy chiếu" allowClear style={selectStyle}
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
                            <Input placeholder="VD: Hiển thị mặc định" maxLength={255} style={inputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={24}>
                          <Form.Item name="gisLocation" {...labelProps('Tọa độ GPS')} required style={{ marginBottom: spaceFormField }}>
                            <GisLocationSelector defaultGeometryType={createGeometryType} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </>
                  ),
                },

                {
                  key: 'infrastructure',
                  label: 'Kết cấu hạ tầng',
                  children: (
                    <>
                      {infraList.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 16 }}>
                          <Button type="dashed" icon={<PlusOutlined />} onClick={() => setInfraList([{ stt: 1, infraName: '', quantity: null }])}>Thêm công trình</Button>
                        </div>
                      ) : (
                        <>
                          {infraList.map((inf, idx) => (
                            <Row key={idx} gutter={12} align="middle" style={{ marginBottom: 8 }}>
                              <Col span={2}><Input value={inf.stt} disabled style={{ textAlign: 'center' }} /></Col>
                              <Col span={12}><Input value={inf.infraName} onChange={(e) => { const next = [...infraList]; next[idx] = { ...next[idx], infraName: e.target.value }; setInfraList(next); }} placeholder="Tên công trình" /></Col>
                              <Col span={6}><InputNumber value={inf.quantity} onChange={(v) => { const next = [...infraList]; next[idx] = { ...next[idx], quantity: v ?? null }; setInfraList(next); }} placeholder="Số lượng" min={1} style={{ width: '100%' }} /></Col>
                              <Col span={4}>
                                <Button type="link" danger icon={<DeleteOutlined />} onClick={() => { const next = infraList.filter((_, i) => i !== idx).map((item, i) => ({ ...item, stt: i + 1 })); setInfraList(next); }} />
                                {idx === infraList.length - 1 && (
                                  <Button type="link" icon={<PlusOutlined />} onClick={() => setInfraList([...infraList, { stt: infraList.length + 1, infraName: '', quantity: null }])} />
                                )}
                              </Col>
                            </Row>
                          ))}
                        </>
                      )}
                    </>
                  ),
                },
                {
                  key: 'attachments',
                  label: 'File đính kèm',
                  children: (
                    <>
                      <Upload
                        beforeUpload={(file) => {
                          if (file.size > 20 * 1024 * 1024) { message.error('File vượt quá 20MB'); return false; }
                          const ext = file.name.split('.').pop()?.toLowerCase();
                          if (!ext || !['pdf','doc','docx','xls','xlsx','jpg','jpeg','png','tiff','tif'].includes(ext)) { message.error('Định dạng không hỗ trợ'); return false; }
                          if (uploadFileList.length >= 10) { message.error('Tối đa 10 file'); return false; }
                          setUploadFileList([...uploadFileList, { uid: `${Date.now()}`, name: file.name, status: 'done', originFileObj: file }]);
                          return false;
                        }}
                        onRemove={(f) => setUploadFileList(uploadFileList.filter(x => x.uid !== f.uid))}
                        fileList={uploadFileList}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif"
                      >
                        <Button icon={<UploadOutlined />}>Chọn file (≤10 files, ≤20MB)</Button>
                      </Upload>
                    </>
                  ),
                },
              ]}
            />

            <Form.Item style={{ marginTop: 24, marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button
                  onClick={() => { setCreateModalVisible(false); setInfraList([]); setUploadFileList([]); }}
                  style={{
                    borderRadius: radiusPill,
                    height: 40,
                    fontSize: fontSizeMd,
                    borderColor: borderDefault,
                    color: textSecondary,
                  }}
                >
                  Hủy
                </Button>
                <Button
                  onClick={() => { setActionType('draft'); createForm.submit(); }}
                  style={{
                    borderRadius: radiusPill,
                    height: 40,
                    fontSize: fontSizeMd,
                    borderColor: borderDefault,
                    color: textSecondary,
                  }}
                >
                  Lưu tạm
                </Button>
                {canSubmitForApproval && (
                <Button
                  type="primary"
                  onClick={() => { setActionType('submit'); createForm.submit(); }}
                  loading={submitting}
                  style={{
                    borderRadius: radiusPill,
                    height: 40,
                    fontSize: fontSizeMd,
                  }}
                >
                  Gửi phê duyệt
                </Button>
                )}
                {canSubmitForApproval && (
                <Button
                  onClick={() => { setActionType('approve'); createForm.submit(); }}
                  loading={submitting}
                  style={{
                    borderRadius: radiusPill,
                    height: 40,
                    fontSize: fontSizeMd,
                    background: statusOperational,
                    borderColor: statusOperational,
                    color: surfaceCard,
                  }}
                >
                  Phê duyệt
                </Button>
                )}
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      )}

      {/* ── Edit Modal (Tabs layout) ───────────────────────────────── */}
      {(!isIframeModal || action === 'edit') && (
        <Modal
          title={
            isIframeModal
              ? null
              : <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: 15 }}>
                {selectedRecord
                  ? `Chỉnh sửa — ${selectedRecord.portName}`
                  : 'Chỉnh sửa cảng biển'}
              </span>
          }
          open={updateModalVisible}
          onCancel={closeUpdateModal}
          footer={null}
          width={isIframeModal ? '100%' : 900}
          mask={!isIframeModal}
          closable={!isIframeModal}
          style={
            isIframeModal
              ? { top: 0, margin: 0, padding: 0, maxWidth: 'none', height: '100%' }
              : undefined
          }
          styles={{
            body: isIframeModal
              ? { padding: '16px 24px', height: '100%', overflowY: 'auto' }
              : undefined,
          }}
          forceRender
        >
          <Form
            form={updateForm}
            layout="vertical"
            onFinish={handleUpdateFinish}
            onFinishFailed={handleFormFailed}
          >
            <Tabs
              defaultActiveKey="general"
              items={[
                {
                  key: 'general',
                  label: 'Thông tin chung',
                  children: (
                    <>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="orgUnitId"
                            {...labelProps('Đơn vị quản lý')}
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
                            name="portCode"
                            {...labelProps('Mã cảng')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input disabled aria-readonly="true" style={inputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="portName"
                            {...labelProps('Tên cảng')}
                            style={{ marginBottom: spaceFormField }}
                            rules={[{ max: 255, message: 'Tên cảng tối đa 255 ký tự' }]}
                          >
                            <Input placeholder="VD: Cảng biển Hải Phòng" maxLength={255} style={inputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="province"
                            {...labelProps('Tỉnh/thành phố')}
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
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="detailedLocation"
                            {...labelProps('Địa điểm chi tiết')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input placeholder="VD: Xã Đình Vũ, Quận Hải An" maxLength={500} style={inputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="portClass"
                            {...labelProps('Phân cấp')}
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
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            {...labelProps('Trạng thái phê duyệt')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input
                              disabled
                              value={
                                selectedRecord?.approvalStatus
                                  ? trangThaiPheDuyetBadge(selectedRecord.approvalStatus).label
                                  : '—'
                              }
                              aria-readonly="true"
                              style={inputStyle}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="remarks"
                            {...labelProps('Ghi chú')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input.TextArea rows={2} placeholder="Ghi chú" maxLength={2000} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </>
                  ),
                },
                {
                  key: 'stats',
                  label: 'Thống kê',
                  children: (
                    <>
                      <Row gutter={16}>
                        <Col span={24}>
                          <Form.Item
                            name="waterAreaScope"
                            {...labelProps('Phạm vi vùng nước')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input.TextArea rows={2} placeholder="Mô tả phạm vi vùng nước cảng biển" maxLength={2000} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="totalBerths"
                            {...labelProps('Tổng bến cảng')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="totalAnchoragesTransshipment"
                            {...labelProps('Tổng khu neo đậu, chuyển tải')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={6}>
                          <Form.Item
                            name="totalPublicChannels"
                            {...labelProps('Tuyến luồng công cộng')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="totalDedicatedChannels"
                            {...labelProps('Tuyến luồng chuyên dùng')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="totalPublicChannelLength"
                            {...labelProps('Dài luồng công cộng (m)')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="totalDedicatedChannelLength"
                            {...labelProps('Dài luồng chuyên dùng (m)')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={6}>
                          <Form.Item
                            name="totalBuoysBeacons"
                            {...labelProps('Phao tiêu báo hiệu')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="totalDikes"
                            {...labelProps('Tổng đê kè')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="totalDikeLength"
                            {...labelProps('Dài đê kè (m)')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="totalLighthouses"
                            {...labelProps('Đèn biển, đăng tiêu')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={6}>
                          <Form.Item
                            name="buoyBerthCount"
                            {...labelProps('Số bến phao')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="anchorageCount"
                            {...labelProps('Số khu neo đậu')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="transshipmentCount"
                            {...labelProps('Số khu chuyển tải')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="otherWaterAreas"
                            {...labelProps('Các khu nước khác')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input placeholder="Mô tả" maxLength={2000} style={inputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </>
                  ),
                },
                {
                  key: 'gis',
                  label: 'Vị trí',
                  children: (
                    <>
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
                          <Form.Item name="mapSymbolId" {...labelProps('Biểu tượng')} style={{ marginBottom: spaceFormField }}>
                            <Select
                              placeholder="Chọn biểu tượng"
                              allowClear
                              showSearch
                              optionFilterProp="label"
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
                            <Select style={selectStyle} options={[
                              { value: 1, label: 'WGS-84' }, { value: 2, label: 'VN-2000' },
                            ]} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="displayRule" {...labelProps('Quy tắc hiển thị')} style={{ marginBottom: spaceFormField }}>
                            <Input placeholder="VD: display_rule_1" style={inputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={24}>
                          <Form.Item name="gisLocation" style={{ marginBottom: spaceFormField }}>
                            <GisLocationSelector defaultGeometryType={updateGeometryType} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </>
                  ),
                },
                {
                  key: 'infrastructure',
                  label: 'Kết cấu hạ tầng',
                  children: (
                    <>
                      {infraList.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 16 }}>
                          <Button type="dashed" icon={<PlusOutlined />} onClick={() => setInfraList([{ stt: 1, infraName: '', quantity: null }])}>Thêm công trình</Button>
                        </div>
                      ) : (
                        <>
                          {infraList.map((inf, idx) => (
                            <Row key={idx} gutter={12} align="middle" style={{ marginBottom: 8 }}>
                              <Col span={2}><Input value={inf.stt} disabled style={{ textAlign: 'center' }} /></Col>
                              <Col span={12}><Input value={inf.infraName} onChange={(e) => { const next = [...infraList]; next[idx] = { ...next[idx], infraName: e.target.value }; setInfraList(next); }} placeholder="Tên công trình" /></Col>
                              <Col span={6}><InputNumber value={inf.quantity} onChange={(v) => { const next = [...infraList]; next[idx] = { ...next[idx], quantity: v ?? null }; setInfraList(next); }} placeholder="Số lượng" min={1} style={{ width: '100%' }} /></Col>
                              <Col span={4}>
                                <Button type="link" danger icon={<DeleteOutlined />} onClick={() => { const next = infraList.filter((_, i) => i !== idx).map((item, i) => ({ ...item, stt: i + 1 })); setInfraList(next); }} />
                                {idx === infraList.length - 1 && (
                                  <Button type="link" icon={<PlusOutlined />} onClick={() => setInfraList([...infraList, { stt: infraList.length + 1, infraName: '', quantity: null }])} />
                                )}
                              </Col>
                            </Row>
                          ))}
                        </>
                      )}
                    </>
                  ),
                },
                {
                  key: 'attachments',
                  label: 'File đính kèm',
                  children: (
                    <>
                      <Upload
                        beforeUpload={(file) => {
                          if (file.size > 20 * 1024 * 1024) { message.error('File vượt quá 20MB'); return false; }
                          const ext = file.name.split('.').pop()?.toLowerCase();
                          if (!ext || !['pdf','doc','docx','xls','xlsx','jpg','jpeg','png','tiff','tif'].includes(ext)) { message.error('Định dạng không hỗ trợ'); return false; }
                          if (uploadFileList.length >= 10) { message.error('Tối đa 10 file'); return false; }
                          setUploadFileList([...uploadFileList, { uid: `${Date.now()}`, name: file.name, status: 'done', originFileObj: file }]);
                          return false;
                        }}
                        onRemove={(f) => setUploadFileList(uploadFileList.filter(x => x.uid !== f.uid))}
                        fileList={uploadFileList}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif"
                      >
                        <Button icon={<UploadOutlined />}>Chọn file (≤10 files, ≤20MB)</Button>
                      </Upload>
                    </>
                  ),
                },
              ]}
            />

            <Form.Item style={{ marginTop: 24, marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button
                  onClick={closeUpdateModal}
                  style={{
                    borderRadius: radiusPill,
                    height: 40,
                    fontSize: fontSizeMd,
                    borderColor: borderDefault,
                    color: textSecondary,
                  }}
                >
                  Hủy
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  style={{
                    borderRadius: radiusPill,
                    height: 40,
                    fontSize: fontSizeMd,
                    background: actionPrimary,
                    borderColor: actionPrimary,
                  }}
                >
                  Cập nhật
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      )}

      {/* ── Detail Modal ───────────────────────────────────────────── */}
      {(!isIframeModal || action === 'detail') && (
        <Modal
          title={
            isIframeModal
              ? null
              : selectedRecord
                ? <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Chi tiết cảng biển: {selectedRecord.portName}</span>
                : <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Chi tiết cảng biển</span>
          }
          open={detailModalVisible}
          onCancel={closeDetailModal}
          footer={null}
          width={isIframeModal ? '100%' : 800}
          mask={!isIframeModal}
          closable={!isIframeModal}
          style={
            isIframeModal
              ? { top: 0, margin: 0, padding: 0, maxWidth: 'none', height: '100%' }
              : undefined
          }
          styles={{
            body: isIframeModal
              ? { padding: '16px 24px', height: '100%', overflowY: 'auto' }
              : { maxHeight: '70vh', overflowY: 'auto', padding: '16px 24px' },
          }}
        >
          {selectedRecord && (<>
            {(() => {
              const tg = (k: string) => setDetailCollapsed((p) => ({ ...p, [k]: !p[k] }));
              return (<>
                <Divider orientation="left" style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: colors.sidebarBg, cursor: 'pointer' }}
                  onClick={() => tg('general')}>
                  {detailCollapsed.general ? '▶' : '▼'} Thông tin chung
                </Divider>
                {!detailCollapsed.general && (
              <Descriptions bordered column={2} size="small" style={{ tableLayout: 'fixed' }} labelStyle={{ width: 180, whiteSpace: 'nowrap' }}>
                <Descriptions.Item label="Mã cảng">
                  <Tag color="cyan">{selectedRecord.portCode}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Tên cảng">{selectedRecord.portName}</Descriptions.Item>
                <Descriptions.Item label="Đơn vị quản lý">
                  {selectedRecord.orgUnitId
                    ? (orgUnits.find((o) => o.id === selectedRecord.orgUnitId)?.name || '—')
                    : '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Tỉnh/thành phố">{selectedRecord.province || '—'}</Descriptions.Item>
                <Descriptions.Item label="Địa điểm chi tiết">{selectedRecord.detailedLocation || '—'}</Descriptions.Item>
                <Descriptions.Item label="Phân cấp">{selectedRecord.portClass != null ? (selectedRecord.portClass === 5 ? 'Cấp đặc biệt' : `Cấp ${selectedRecord.portClass}`) : '—'}</Descriptions.Item>
                <Descriptions.Item label="Nhóm cảng biển">
                  {selectedRecord.portGroup ? 'Nhóm ' + selectedRecord.portGroup : '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Phê duyệt">
                  {selectedRecord.approvalStatus && (
                    <Tag color={trangThaiPheDuyetBadge(selectedRecord.approvalStatus).color}>
                      {trangThaiPheDuyetBadge(selectedRecord.approvalStatus).label}
                    </Tag>
                  )}
                </Descriptions.Item>
              </Descriptions>
            )}
            <Divider orientation="left" style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: colors.sidebarBg, cursor: 'pointer', marginTop: spaceMd }}
              onClick={() => tg('stats')}>
              {detailCollapsed.stats ? '▶' : '▼'} Thống kê tổng hợp
            </Divider>
            {!detailCollapsed.stats && (
              <Descriptions bordered column={2} size="small" style={{ tableLayout: 'fixed' }} labelStyle={{ width: 180, whiteSpace: 'nowrap' }}>
                <Descriptions.Item label="Phạm vi vùng nước">{selectedRecord.waterAreaScope || '—'}</Descriptions.Item>
                <Descriptions.Item label="Tổng số bến cảng">{selectedRecord.totalBerths ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Khu neo đậu, chuyển tải">{selectedRecord.totalAnchoragesTransshipment ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Tuyến luồng công cộng">
                  {selectedRecord.totalPublicChannels ?? '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Tuyến luồng chuyên dùng">
                  {selectedRecord.totalDedicatedChannels ?? '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Phao tiêu báo hiệu">{selectedRecord.totalBuoysBeacons ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Đê kè">
                  {selectedRecord.totalDikes ?? '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Đèn biển, đăng tiêu">{selectedRecord.totalLighthouses ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Bến phao">{selectedRecord.buoyBerthCount ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Khu neo đậu">{selectedRecord.anchorageCount ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Khu chuyển tải">{selectedRecord.transshipmentCount ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Các khu nước khác">{selectedRecord.otherWaterAreas || '—'}</Descriptions.Item>
                <Descriptions.Item label="Ghi chú" span={2}>{selectedRecord.remarks || '—'}</Descriptions.Item>
              </Descriptions>
            )}
            <Divider orientation="left" style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: colors.sidebarBg, cursor: 'pointer', marginTop: spaceMd }}
              onClick={() => tg('gis')}>
              {detailCollapsed.gis ? '▶' : '▼'} Thông tin địa lý & GIS
            </Divider>
            {!detailCollapsed.gis && (
              <Descriptions bordered column={2} size="small" style={{ tableLayout: 'fixed' }} labelStyle={{ width: 180, whiteSpace: 'nowrap' }}>
                <Descriptions.Item label="Vĩ độ">{selectedRecord.latitude != null ? selectedRecord.latitude.toFixed(6) : '—'}</Descriptions.Item>
                <Descriptions.Item label="Kinh độ">{selectedRecord.longitude != null ? selectedRecord.longitude.toFixed(6) : '—'}</Descriptions.Item>
                <Descriptions.Item label="Hệ quy chiếu">{selectedRecord.coordinateSystem ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Quy tắc hiển thị">{selectedRecord.displayRule ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Biểu tượng bản đồ" span={2}>
                  {selectedRecord.mapSymbolId ? (symbols.find((s) => s.id === selectedRecord.mapSymbolId)?.name || selectedRecord.mapSymbolId) : '—'}
                </Descriptions.Item>
              </Descriptions>
            )}
            <Divider orientation="left" style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: colors.sidebarBg, cursor: 'pointer', marginTop: spaceMd }}
              onClick={() => tg('files')}>
              {detailCollapsed.files ? '▶' : '▼'} Tài liệu đính kèm
            </Divider>
            {!detailCollapsed.files && (<>
                {detailFiles.length === 0 ? (
                  <span style={{ color: textTertiary }}>Không có tài liệu đính kèm</span>
                ) : (
                  detailFiles.map((f) => (
                    <div key={f.id} style={{ marginBottom: spaceSm }}>
                      <FileOutlined style={{ marginRight: 8, color: actionPrimary }} />
                      <a href={documentApi.downloadUrl(f.minioKey)} target="_blank" rel="noopener noreferrer"
                        style={{ color: actionPrimary, fontSize: fontSizeMd }}>
                        {f.fileName} ({(f.fileSize / 1024).toFixed(1)} KB)
                      </a>
                    </div>
                  ))
                )}
              </>
            )}
            <Divider orientation="left" style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: colors.sidebarBg, cursor: 'pointer', marginTop: spaceMd }}
              onClick={() => tg('system')}>
              {detailCollapsed.system ? '▶' : '▼'} Thông tin hệ thống
            </Divider>
            {!detailCollapsed.system && (
                <Descriptions bordered column={2} size="small" style={{ tableLayout: 'fixed' }} labelStyle={{ width: 180, whiteSpace: 'nowrap' }}>
                  <Descriptions.Item label="Người tạo">{selectedRecord.createdByName || selectedRecord.createdBy || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Ngày tạo">{selectedRecord.createdAt ? new Date(selectedRecord.createdAt).toLocaleString('vi-VN') : '—'}</Descriptions.Item>
                  <Descriptions.Item label="Cập nhật bởi">{selectedRecord.updatedByName || selectedRecord.updatedBy || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Ngày cập nhật">{selectedRecord.updatedAt ? new Date(selectedRecord.updatedAt).toLocaleString('vi-VN') : '—'}</Descriptions.Item>
                </Descriptions>
            )}
              </>);
            })()}

          <div style={{ marginTop: 24, textAlign: 'right' }}>
                <Space>
                  <Button
                    onClick={closeDetailModal}
                    style={{
                      borderRadius: radiusPill,
                      height: 40,
                      fontSize: fontSizeMd,
                      borderColor: borderDefault,
                      color: textSecondary,
                    }}
                  >
                    Đóng
                  </Button>
                  {hasPerm('port:update') && (
                    <Button
                      type="primary"
                      icon={<EditOutlined />}
                      onClick={() => {
                        closeDetailModal();
                        updateForm.setFieldsValue({
                          portCode: selectedRecord.portCode,
                          portName: selectedRecord.portName,
                          province: selectedRecord.province || undefined,
                          orgUnitId: selectedRecord.orgUnitId || undefined,
                          diaDiemChiTiet: selectedRecord.detailedLocation || undefined,
                          phanCap: selectedRecord.portClass,
                          phamViVungNuoc: selectedRecord.waterAreaScope || undefined,
                          tongSoBenCang: selectedRecord.tongSoBenCang,
                          tongSoKhuNeoDauChuyenTai: selectedRecord.tongSoKhuNeoDauChuyenTai,
                          tongSoTuyenLuongCongCong: selectedRecord.tongSoTuyenLuongCongCong,
                          tongSoTuyenLuongChuyenDung: selectedRecord.tongSoTuyenLuongChuyenDung,
                          tongChieuDaiLuongCongCong: selectedRecord.tongChieuDaiLuongCongCong,
                          tongChieuDaiLuongChuyenDung: selectedRecord.tongChieuDaiLuongChuyenDung,
                          tongSoPhaoTieuBaoHieu: selectedRecord.tongSoPhaoTieuBaoHieu,
                          tongSoDeKe: selectedRecord.tongSoDeKe,
                          tongChieuDaiDeKe: selectedRecord.tongChieuDaiDeKe,
                          tongSoDenBienDangTieu: selectedRecord.tongSoDenBienDangTieu,
                          quantityBenPhao: selectedRecord.quantityBenPhao,
                          quantityKhuNeoDau: selectedRecord.quantityKhuNeoDau,
                          quantityKhuChuyenTai: selectedRecord.quantityKhuChuyenTai,
                          cacKhuNuocKhac: selectedRecord.cacKhuNuocKhac || undefined,
                          remarks: selectedRecord.remarks || undefined,
                          gisLocation: {
                            geometryType: selectedRecord.geometryType || 'POINT',
                            coordinates: selectedRecord.coordinates || '',
                            mapSymbolId: selectedRecord.mapSymbolId,
                          },
                        });
                        setUpdateModalVisible(true);
                      }}
                      style={{
                        background: actionPrimary,
                        borderColor: actionPrimary,
                        borderRadius: radiusPill,
                        height: 40,
                        fontSize: fontSizeMd,
                      }}
                    >
                      Chỉnh sửa
                    </Button>
                  )}
                </Space>
              </div>
          </>)}
        </Modal>
      )}

      {/* ── History Modal ──────────────────────────────────────────── */}
      <Modal
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Space size={spaceSm}>
              <HistoryOutlined style={{ color: actionPrimary, fontSize: 20 }} />
              <span style={{ color: actionPrimary, fontWeight: fontWeightBold, fontSize: fontSizeXl }}>
                {selectedRecord
                  ? `Lịch sử thay đổi — ${selectedRecord.portName}`
                  : 'Lịch sử thay đổi'}
              </span>
            </Space>
          </div>
        }
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={null}
        width={880}
        styles={{ body: { padding: `${spaceMd}px`, maxHeight: '68vh', overflowY: 'auto' } }}
      >
        {!loadingHistory && (
          <div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceMd }}>
            <Input.Search
              placeholder="Tìm kiếm nội dung thay đổi..."
              allowClear
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              style={{ flex: 1 }}
            />
            <DatePicker
              placeholder="Từ ngày"
              value={historyDateFrom ? dayjs(historyDateFrom) : null}
              onChange={(d) => setHistoryDateFrom(d ? d.format('YYYY-MM-DD HH:mm') : '')}
              style={{ width: 180 }}
              format="DD/MM/YYYY HH:mm"
              showTime={{ format: 'HH:mm' }}
            />
            <DatePicker
              placeholder="Đến ngày"
              value={historyDateTo ? dayjs(historyDateTo) : null}
              onChange={(d) => setHistoryDateTo(d ? d.format('YYYY-MM-DD HH:mm') : '')}
              style={{ width: 180 }}
              format="DD/MM/YYYY HH:mm"
              showTime={{ format: 'HH:mm' }}
            />
          </div>
        )}
        {loadingHistory ? (
          <LoadingSkeleton rows={5} />
        ) : historyRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
            <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
            <div style={{ color: textTertiary, fontSize: fontSizeMd }}>Chưa có thay đổi nào được ghi nhận</div>
          </div>
            ) : (
          (() => {
            // Filter + group logic
            const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000);
            const sorted = [...historyRecords].sort((a: any, b: any) =>
              new Date(b.changedAt || b.createdAt).getTime() - new Date(a.changedAt || a.createdAt).getTime());
            const q = historySearch.toLowerCase().trim();

            const groups: { tsSec: number; ts: string; actor: string; items: any[] }[] = [];
            for (const r of sorted) {
              // Filter by search
              if (q) {
                const fn = (r.fieldName || r.fieldChanged || '').toLowerCase();
                const ov = (r.oldValue || '').toLowerCase();
                const nv = (r.newValue || '').toLowerCase();
                const label = translateFieldName(r.fieldName || r.fieldChanged).toLowerCase();
                const oldDisp = translateValue(r.fieldName || r.fieldChanged, r.oldValue).toLowerCase();
                const newDisp = translateValue(r.fieldName || r.fieldChanged, r.newValue).toLowerCase();
                if (!fn.includes(q) && !ov.includes(q) && !nv.includes(q)
                    && !label.includes(q) && !oldDisp.includes(q) && !newDisp.includes(q)) continue;
              }
              // Filter by date range
              if (historyDateFrom || historyDateTo) {
                const changedDate = (r.changedAt || r.createdAt || '').substring(0, 16); // YYYY-MM-DDTHH:mm
                if (historyDateFrom && changedDate < historyDateFrom.replace(' ', 'T')) continue;
                if (historyDateTo && changedDate > historyDateTo.replace(' ', 'T') + ':59') continue;
              }
              const ts = r.changedAt || r.createdAt || '';
              const sec = ts ? toSec(ts) : 0;
              const prev = groups[groups.length - 1];
              if (prev && prev.tsSec === sec && prev.actor === (r.changedBy || '')) prev.items.push(r);
              else groups.push({ tsSec: sec, ts, actor: r.changedBy || '', items: [r] });
            }

            if (groups.length === 0) {
              return (
                <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
                  <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
                  <div style={{ color: textTertiary, fontSize: fontSizeMd }}>
                    {q ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận'}
                  </div>
                </div>
              );
            }

            const fmtTime = (ts: string) => {
              const d = new Date(ts);
              return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}  ·  ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
            };

            // When searching: auto-expand all; when cleared: collapse all
            if (q.length > 0 && historySearchRef.current !== q) {
              historySearchRef.current = q;
              const init: Record<number, boolean> = {};
              groups.forEach((_, i) => { init[i] = true; });
              setTimeout(() => setHistoryExpanded(init), 0);
            } else if (q.length === 0 && historySearchRef.current !== '') {
              historySearchRef.current = '';
              const init: Record<number, boolean> = {};
              groups.forEach((_, i) => { init[i] = false; });
              setTimeout(() => setHistoryExpanded(init), 0);
            }

            // Lazy-load: show first N groups, load more on scroll
            const visibleGroups = groups.slice(0, historyVisibleCount);

            const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
              const el = e.currentTarget;
              if (el.scrollHeight - el.scrollTop - el.clientHeight < 80 && historyVisibleCount < groups.length) {
                setHistoryVisibleCount(prev => Math.min(prev + 10, groups.length));
              }
            };

            return (
          <div style={{ maxHeight: '62vh', overflowY: 'auto' }} onScroll={handleScroll}>
            {visibleGroups.map((g, gi) => (
              <div key={gi} style={{ display: 'flex', gap: spaceSm, marginBottom: gi < visibleGroups.length - 1 ? spaceSm : 0 }}>
                {/* Timeline column */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24, flexShrink: 0 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: surfaceCard,
                    border: `1px solid ${actionPrimary}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <ClockCircleFilled style={{ color: actionPrimary, fontSize: 14 }} />
                  </div>
                  {gi < groups.length - 1 && (
                    <div style={{ width: 1, flex: 1, minHeight: 24, background: borderDefault, marginTop: spaceXs }} />
                  )}
                </div>

                {/* Content card */}
                <div style={{
                  ...cardStyle, flex: 1, padding: `${spaceSm}px ${spaceFormField}px`, marginBottom: 0,
                  borderRadius: radiusLg,
                  boxShadow: shadowSm,
                }}>
                  {/* Header row — clickable to toggle */}
                  <div
                    onClick={() => setHistoryExpanded(prev => ({ ...prev, [gi]: !prev[gi] }))}
                    style={{ display: 'flex', alignItems: 'center', gap: spaceSm, cursor: 'pointer' }}
                  >
                    <Typography.Text style={{ fontSize: fontSizeLg, color: textPrimary, fontWeight: fontWeightBold }}>
                      {g.ts ? fmtTime(g.ts) : '—'}
                    </Typography.Text>
                    {g.actor && (
                      <Typography.Text style={{ fontSize: fontSizeMd, color: textSecondary }}>
                        — {g.actor}
                      </Typography.Text>
                    )}
                    <span style={{
                      fontSize: fontSizeMd, fontWeight: fontWeightBold, color: actionPrimary,
                      background: `${actionPrimary}12`, borderRadius: radiusPill,
                      padding: '2px 10px', marginLeft: 'auto',
                    }}>
                      {g.items.length}
                    </span>
                    {historyExpanded[gi] ? (
                      <UpOutlined style={{ fontSize: 12, color: textTertiary }} />
                    ) : (
                      <DownOutlined style={{ fontSize: 12, color: textTertiary }} />
                    )}
                  </div>

                  {/* Expandable body */}
                  {historyExpanded[gi] && (
                    <>
                      <Divider style={{ margin: `${spaceSm}px 0`, borderColor: borderDefault }} />

                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          {g.items.map((r: any, ri: number) => {
                            const fn = r.fieldName || r.fieldChanged;
                            const ov = r.oldValue !== undefined && r.oldValue != null
                              ? translateValue(fn, r.oldValue) : null;
                            const nv = r.newValue !== undefined && r.newValue != null
                              ? translateValue(fn, r.newValue) : null;
                            return (
                              <tr key={r.id || ri}>
                                <td style={{
                                  padding: `${spaceXs}px ${spaceSm}px ${spaceXs}px 0`,
                                  fontSize: fontSizeMd, fontWeight: fontWeightMedium, color: textPrimary,
                                  whiteSpace: 'nowrap', verticalAlign: 'middle', width: 1,
                                }}>
                                  {fn ? translateFieldName(fn) : '—'}
                                </td>
                                <td style={{ padding: `${spaceXs}px 0`, verticalAlign: 'middle' }}>
                                  <Space size={spaceXs}>
                                    {ov ? (
                                      <Typography.Text delete style={{ fontSize: fontSizeMd, color: statusCritical }}>
                                        {ov}
                                      </Typography.Text>
                                    ) : (
                                      <span style={{ fontSize: fontSizeMd, color: textTertiary }}>—</span>
                                    )}
                                    <ArrowRightOutlined style={{ fontSize: 10, color: textTertiary }} />
                                    {nv ? (
                                      <Typography.Text strong style={{ fontSize: fontSizeMd, color: statusOperational }}>
                                        {nv}
                                      </Typography.Text>
                                    ) : (
                                      <span style={{ fontSize: fontSizeMd, color: textTertiary }}>—</span>
                                    )}
                                  </Space>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {g.items[0]?.reason && (
                        <>
                          <Divider style={{ margin: `${spaceSm}px 0`, borderColor: borderDefault }} />
                          <Typography.Text style={{ fontSize: fontSizeSm, color: textTertiary, fontStyle: 'italic' }}>
                            "{g.items[0].reason}"
                          </Typography.Text>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
            );
          })()
        )}
      </Modal>

      {selectedRecord && (
        <DocumentUploadModal
          entityType="port"
          entityId={selectedRecord.id}
          open={uploadModalVisible}
          onCancel={() => setUploadModalVisible(false)}
        />
      )}

      {/* Reject modal */}
      <Modal
        title="Từ chối cảng biển"
        open={rejectModalVisible}
        onCancel={() => setRejectModalVisible(false)}
        onOk={handleRejectConfirm}
        okText="Xác nhận từ chối"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <p style={{ marginBottom: 12 }}>Nhập lý do từ chối (tối thiểu 10 ký tự):</p>
        <Input.TextArea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Nhập lý do từ chối..."
          rows={4}
          maxLength={500}
          showCount
        />
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

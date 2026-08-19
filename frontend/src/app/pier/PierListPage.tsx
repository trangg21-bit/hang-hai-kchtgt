import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  Select,
  Button,
  Space,
  Tag,
  Tooltip,
  Modal,
  Form,
  InputNumber,
  Typography,
  Popconfirm,
  Descriptions,
  Alert,
  Tabs,
  DatePicker,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  HistoryOutlined,
  DownloadOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ScreenHeader, FilterBar, StatusTabs } from '../../components/list-view';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import { VIETNAM_PROVINCE_OPTIONS } from '../../types/common';
import DataTable from '../../components/DataTable';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast, { modal } from '../../components/ToastNotification';
import {
  fetchCauCangList,
  fetchCauCangById,
  createCauCang,
  updateCauCang,
  deleteCauCang,
  approveCauCang,
  rejectCauCang,
  fetchBenCangOptions,
  fetchBenCangById,
  fetchCangBienOptions,
  fetchNavigationChannelOptions,
} from './api';
import { trangThaiHoatDongBadge, trangThaiPheDuyetBadge } from '../../services/port/schema';
import type { Pier, CauCangListQuery, BenCangOption, PortOption, NavigationChannelOption, LoaiCau } from './types';
import { LOAI_CAU_OPTIONS, translateLoaiCau } from './types';
import {
  textPrimary,
  textSecondary,
  textTertiary,
  actionPrimary,
  spaceMd,
  spaceLg,
  spaceSm,
  spaceFormField,
  radiusPill,
  radiusSm,
  radiusMd,
  radiusLg,
  surfaceCard,
  borderDefault,
  fontSizeSm,
  fontSizeMd,
  fontSizeLg,
  fontWeightMedium,
  fontWeightBold,
  statusOperational,
  statusAttention,
  statusCritical,
  statusDraft,
  cardStyle,
} from '../../tokens';
import { colors } from '../../theme';
import Pagination from '../../components/list-view/Pagination';
import { documentApi } from '../document/api';
import { symbolService } from '../../services/symbolService';
import type { Symbol } from '../../services/symbolService';
import { z } from 'zod';
import { cauCangCreateSchema, cauCangUpdateSchema } from './schema';
import DocumentUploadModal from '../document/DocumentUploadModal';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import UserResolver from '../../components/UserResolver';

export const translateFieldName = (fieldName: string): string => {
  const map: Record<string, string> = {
    portCode: 'Mã cảng biển',
    portName: 'Tên cảng biển',
    province: 'Tỉnh/Thành phố',
    latitude: 'Vĩ độ',
    longitude: 'Kinh độ',
    area: 'Diện tích (ha)',
    khaNangTiepNhan: 'Khả năng tiếp nhận',
    portGroup: 'Nhóm cảng biển',
    berthCode: 'Mã bến cảng',
    berthName: 'Tên bến cảng',
    portId: 'Cảng biển chủ',
    tuyenDuongThuy: 'Tuyến đường thủy',
    width: 'Chiều rộng (m)',
    berthType: 'Loại bến',
    doSauLuong: 'Độ sâu luồng (m)',
    pierCode: 'Mã cầu cảng',
    pierName: 'Tên cầu cảng',
    berthId: 'Bến cảng chủ',
    length: 'Chiều dài (m)',
    taiTrong: 'Tải trọng (tấn)',
    loaiCau: 'Loại cầu',
    dryPortCode: 'Mã cảng cạn',
    dryPortName: 'Tên cảng cạn',
    viTri: 'Vị trí',
    dienTichDat: 'Diện tích đất (ha)',
    dienTichNuoc: 'Diện tích nước (ha)',
    nangLucThongQua: 'Năng lực thông qua',
    waterZoneCode: 'Mã vùng nước',
    waterZoneName: 'Tên vùng nước',
    viTriVungNuoc: 'Vị trí vùng nước',
    chieuDaiVungNuoc: 'Chiều dài vùng nước (m)',
    chieuRongVungNuoc: 'Chiều rộng vùng nước (m)',
    doSauVungNuoc: 'Độ sâu vùng nước (m)',
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
  };
  return map[fieldName] || fieldName;
};

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  'OPERATIONAL': { color: 'green', label: 'Hiện hành' },
  'SUSPENDED': { color: 'gold', label: 'Tạm ngừng' },
};

const APPROVAL_MAP: Record<string, { color: string; label: string }> = {
  'PENDING': { color: 'gold', label: 'Chờ phê duyệt' },
  'APPROVED': { color: 'green', label: 'Được phê duyệt' },
  'REJECTED': { color: 'red', label: 'Từ chối' },
};

const CONG_NANG_KHAI_THAC_OPTIONS = [
  { label: 'Hàng Container', value: 'Hàng Container' },
  { label: 'Hàng tổng hợp (bách hóa)', value: 'Hàng tổng hợp (bách hóa)' },
  { label: 'Hàng chuyên dụng hàng rời, quặng', value: 'Hàng chuyên dụng hàng rời, quặng' },
  { label: 'Hàng chuyên dụng xăng dầu, khí hóa lỏng', value: 'Hàng chuyên dụng xăng dầu, khí hóa lỏng' },
  { label: 'Hàng chuyên dụng khác (dịch vụ, đóng, sửa chữa tàu ...)', value: 'Hàng chuyên dụng khác (dịch vụ, đóng, sửa chữa tàu ...)' },
  { label: 'Hành khách', value: 'Hành khách' }
];

const CONSTRUCTION_GRADE_OPTIONS = [
  { value: 1, label: 'Cấp I — Đặc biệt' },
  { value: 2, label: 'Cấp I' },
  { value: 3, label: 'Cấp II' },
  { value: 4, label: 'Cấp III' },
  { value: 5, label: 'Cấp IV' },
];

const CONDITION_STATUS_OPTIONS = [
  { value: 1, label: 'Sử dụng' },
  { value: 2, label: 'Sửa chữa' },
  { value: 3, label: 'Tạm ngừng khai thác' },
];

const RECEIVES_LARGE_VESSEL_OPTIONS = [
  { value: '0', label: 'Không' },
  { value: '1', label: 'Có' },
];

const PROVINCE_OPTIONS = [
  { value: 'Hải Phòng', label: 'Hải Phòng' },
  { value: 'TP. Hồ Chí Minh', label: 'TP. Hồ Chí Minh' },
  { value: 'Đà Nẵng', label: 'Đà Nẵng' },
  { value: 'Quảng Ninh', label: 'Quảng Ninh' },
  { value: 'Bà Rịa - Vũng Tàu', label: 'Bà Rịa - Vũng Tàu' },
  { value: 'Khánh Hòa', label: 'Khánh Hòa' },
];

export default function PierListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isIframeModal = (window.self !== window.top) && searchParams.has('action');

  const action = searchParams.get('action');
  const id = searchParams.get('id');

  const currentUser = useAuthStore((s) => s.user);
  const hasPermission = usePermissionStore((s) => s.hasPermission);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>();
  const [filterApproval, setFilterApproval] = useState<string>();
  const [filterBenCangId, setFilterBenCangId] = useState<string>();
  const [filterLoaiCau, setFilterLoaiCau] = useState<LoaiCau>();
  const [filterProvince, setFilterProvince] = useState<string>();
  const sortBy = 'createdAt';
  const sortOrder = 'desc';
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<Pier[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [benCangOptions, setBenCangOptions] = useState<BenCangOption[]>([]);
  const [portOptions, setPortOptions] = useState<PortOption[]>([]);
  const [navigationChannelOptions, setNavigationChannelOptions] = useState<NavigationChannelOption[]>([]);
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const actionTypeRef = useRef<'LUU_TAM' | 'LUU_VA_GUI_PHE_DUYET' | 'LUU_VA_PHE_DUYET'>('LUU_TAM');

  const fetchSymbols = useCallback(async () => {
    try {
      const res = await symbolService.list({ page: 1, pageSize: 1000, status: 'active' });
      setSymbols(res.data);
    } catch (err) {
      console.error('Failed to load symbols', err);
    }
  }, []);

  // Modals visibility
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Pier | null>(null);
  const [detailFiles, setDetailFiles] = useState<any[]>([]);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [editWarning, setEditWarning] = useState<string | null>(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<Pier | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const closeUpdateModal = useCallback(() => {
    setUpdateModalVisible(false);
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

  // Forms definition
  const [createForm] = Form.useForm();
  const [updateForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const createLoaiHinhHoc = Form.useWatch('loaiHinhHoc', createForm);
  const updateLoaiHinhHoc = Form.useWatch('loaiHinhHoc', updateForm);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const query: CauCangListQuery = {
        search: search || undefined,
        status: filterStatus as any,
        approvalStatus: filterApproval as any,
        berthId: filterBenCangId || undefined,
        loaiCau: filterLoaiCau,
        province: filterProvince || undefined,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
        page,
        pageSize,
      };
      const res = await fetchCauCangList(query);
      setDataSource(res.content);
      setTotal(res.totalElements);
    } catch (err: unknown) {
      console.error('Failed to fetch Pier list:', err);
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách cầu cảng'));
    } finally {
      setIsLoading(false);
    }
  }, [search, filterStatus, filterApproval, filterBenCangId, filterLoaiCau, filterProvince, sortBy, sortOrder, page, pageSize]);

  // ── Filter fields ────────────────────────────────────────────────
  const filterFields = useMemo(() => [
    {
      key: 'search',
      type: 'search' as const,
      label: 'Tìm kiếm',
      placeholder: 'Tìm theo mã, tên cầu cảng...',
    },
    {
      key: 'loaiCau',
      type: 'select' as const,
      label: 'Loại cầu',
      placeholder: 'Chọn loại cầu',
      options: LOAI_CAU_OPTIONS.map(o => ({ value: o.value as string, label: o.label })),
    },
    {
      key: 'province',
      type: 'select' as const,
      label: 'Địa điểm',
      placeholder: 'Chọn tỉnh/thành phố',
      options: VIETNAM_PROVINCE_OPTIONS.map(p => ({ value: p.value, label: p.label })),
    },
  ], []);

  const handleBenCangSearch = useCallback(async (searchText: string) => {
    try {
      const res = await fetchBenCangOptions({ size: 50, search: searchText || undefined });
      setBenCangOptions(res.content);
    } catch (err) {
      console.error('Failed to load Berth options:', err);
    }
  }, []);

  const fetchBerthsByPort = useCallback(async (portId?: string) => {
    try {
      const res = await fetchBenCangOptions({ size: 100, portId });
      setBenCangOptions(res.content);
    } catch (err) {
      console.error('Failed to load Berths by port:', err);
    }
  }, []);

  const handlePortSearch = useCallback(async (searchText: string) => {
    try {
      const res = await fetchCangBienOptions({ size: 50, search: searchText || undefined });
      setPortOptions(res.content);
    } catch (err) {
      console.error('Failed to load Port options:', err);
    }
  }, []);

  const handleCangBienSearch = useCallback(async (searchText: string) => {
    try {
      const res = await fetchCangBienOptions({ size: 50, search: searchText || undefined });
      setPortOptions(res.content);
    } catch (err) {
      console.error('Failed to load Port options:', err);
    }
  }, []);

  const handleNavChannelSearch = useCallback(async (searchText: string) => {
    try {
      const res = await fetchNavigationChannelOptions({ size: 50, search: searchText || undefined });
      setNavigationChannelOptions(res.content);
    } catch (err) {
      console.error('Failed to load NavChannel options:', err);
    }
  }, []);

  const handleNavigationChannelSearch = useCallback(async (searchText: string) => {
    try {
      const res = await fetchNavigationChannelOptions({ size: 50, search: searchText || undefined });
      setNavigationChannelOptions(res.content);
    } catch (err) {
      console.error('Failed to load NavigationChannel options:', err);
    }
  }, []);

  const fetchNavChannelsByPort = useCallback(async (portId?: string) => {
    try {
      const res = await fetchNavigationChannelOptions({ size: 100, portId });
      setNavigationChannelOptions(res.content);
    } catch (err) {
      console.error('Failed to load NavChannels by port:', err);
    }
  }, []);

  const translateValue = useCallback((fieldName: string, val: string | null): string => {
    if (!val || val === '(null)' || val === 'null') {
      return '(trống)';
    }
    if (['bieuTuongId', 'iconId', 'lineSymbolId', 'fillSymbolId'].includes(fieldName)) {
      const sym = symbols.find(s => s.id === val);
      return sym ? `${sym.name} (${sym.code})` : val;
    }
    if (['khongGianId', 'spatialId'].includes(fieldName)) {
      return 'Có tọa độ bản đồ';
    }
    if (fieldName === 'approvalStatus') {
      const approval = APPROVAL_MAP[val] || APPROVAL_MAP[val.toUpperCase()];
      return approval ? approval.label : val;
    }
    if (fieldName === 'operationalStatus') {
      const status = STATUS_MAP[val] || STATUS_MAP[val.toUpperCase()];
      return status ? status.label : val;
    }
    if (fieldName === 'loaiCau') {
      return translateLoaiCau(val as any);
    }
    return val;
  }, [symbols]);

  useEffect(() => {
    // 1. Try to use symbols cache from parent window
    const parentSymbols = (window.parent as any)?.kchtSymbols;
    if (parentSymbols && parentSymbols.length > 0) {
      setSymbols(parentSymbols);
    }

    // 2. Only fetch what is required:
    const needSymbols = !parentSymbols || parentSymbols.length === 0;

    if (needSymbols) {
      void fetchSymbols();
    }
  }, [fetchSymbols, isIframeModal, action]);
  useEffect(() => { if (!isIframeModal) void fetchData(); }, [fetchData, isIframeModal]);

  useEffect(() => {
    if (id && (action === 'detail' || action === 'edit')) {
      (async () => {
        try {
          setIsLoading(true);
          const cached = (window.parent as any)?.kchtDetailCache?.[id];
          const data = cached || await fetchCauCangById(id);
          setSelectedRecord(data);
          if (action === 'detail') {
            const fileRes = await documentApi.listByEntity('pier', id, { page: 1, size: 20 });
            setDetailFiles(fileRes.data || []);
            setDetailModalVisible(true);
          } else if (action === 'edit') {
            if (data.berthId) {
              setBenCangOptions([{ id: data.berthId, berthName: 'Đang tải...' }]);
            }
            updateForm.setFieldsValue({
              pierCode: data.pierCode,
              pierName: data.pierName,
              berthId: data.berthId,
              length: data.length,
              taiTrong: data.taiTrong,
              loaiCau: data.loaiCau,
              operationalCapacity: data.operationalCapacity ? data.operationalCapacity.split(',').map((s: string) => s.trim()) : [],
              operationalStatus: data.operationalStatus,
              bieuTuongId: data.bieuTuongId,
              loaiHinhHoc: data.loaiHinhHoc || 'LINE',
              gisLocation: {
                loaiHinhHoc: data.loaiHinhHoc || 'LINE',
                toaDo: data.toaDo || '',
                bieuTuongId: data.bieuTuongId
              }
            });
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

  useEffect(() => {
    if (selectedRecord && selectedRecord.berthId) {
      const exists = benCangOptions.some(o => o.id === selectedRecord.berthId);
      if (!exists) {
        fetchBenCangById(selectedRecord.berthId)
          .then((parentBerth) => {
            if (parentBerth) {
              setBenCangOptions(prev => [...prev, parentBerth]);
            }
          })
          .catch((err) => console.error("Error pre-fetching parent Berth:", err));
      }
    }
  }, [selectedRecord, benCangOptions]);

  const handleDelete = useCallback((record: Pier) => {
    let inputValue = '';
    modal.confirm({
      title: 'Xác nhận xóa cầu cảng',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Hành động này sẽ xóa cầu cảng khỏi danh sách hoạt động. Dữ liệu vẫn được lưu trữ để phục vụ kiểm toán.</p>
          <p><strong>Mã:</strong> {record.pierCode} | <strong>Tên:</strong> {record.pierName}</p>
          <p>Vui lòng nhập tên cầu cảng để xác nhận: <strong>{record.pierName}</strong></p>
          <Input placeholder="Nhập tên cầu cảng" onChange={(e) => { inputValue = e.target.value; }} />
        </div>
      ),
      okText: 'Xóa',
      okButtonProps: { danger: true, disabled: false },
      cancelText: 'Hủy',
      onOk: async () => {
        if (inputValue.trim() !== record.pierName) {
          toast.error('Tên cầu cảng không khớp');
          return Promise.reject();
        }
        try {
          await deleteCauCang(record.id);
          toast.success('Đã xóa cầu cảng');
          fetchData();
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
        }
      },
    });
  }, [fetchData]);

  const handleApprove = useCallback(
    async (record: Pier) => {
      try {
        await approveCauCang(record.id);
        toast.success('Đã phê duyệt cầu cảng');
        fetchData();
        if (detailModalVisible && selectedRecord?.id === record.id) {
          const updated = await fetchCauCangById(record.id);
          setSelectedRecord(updated);
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
      }
    },
    [fetchData, detailModalVisible, selectedRecord],
  );

  const handleReject = useCallback((record: Pier) => {
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
      await rejectCauCang(rejectTarget.id, rejectReason.trim());
      toast.success('Đã từ chối cầu cảng');
      setRejectModalVisible(false);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
    }
  };

  const handleCreateFinish = async (values: any, actionType: 'LUU_TAM' | 'LUU_VA_GUI_PHE_DUYET' | 'LUU_VA_PHE_DUYET') => {
    try {
      const formatDate = (d: any) => d?.format ? d.format('YYYY-MM-DD') : d || undefined;
      const formatMonth = (d: any) => d?.format ? d.format('YYYY-MM') : d || undefined;

      // Conditional ATHH validation
      if (values.receivesLargeVessel === '1') {
        if (!values.documentNumber) {
          toast.error('Số văn bản là bắt buộc khi tiếp nhận tàu có trọng tải lớn hơn');
          return;
        }
        if (!values.documentDate) {
          toast.error('Ngày văn bản là bắt buộc khi tiếp nhận tàu có trọng tải lớn hơn');
          return;
        }
      }

      const payload = {
        pierCode: values.pierCode,
        pierName: values.pierName,
        portId: values.portId || undefined,
        berthId: values.berthId,
        navigationChannelId: values.navigationChannelId || undefined,
        province: values.province || undefined,
        detailedLocation: values.detailedLocation || undefined,
        constructionGrade: values.constructionGrade ? Number(values.constructionGrade) : undefined,
        pierType: values.loaiCau || undefined,
        operationalFunction: values.operationalCapacity ? (Array.isArray(values.operationalCapacity) ? values.operationalCapacity.join(', ') : values.operationalCapacity) : undefined,
        conditionStatus: values.conditionStatus ? Number(values.conditionStatus) : undefined,
        length: values.length || undefined,
        width: values.width || undefined,
        currentWaterDepth: values.currentWaterDepth || undefined,
        designBedElevation: values.designBedElevation || undefined,
        publishedVesselDWT: values.publishedVesselDWT || undefined,
        maintenanceApprovalDate: formatMonth(values.maintenanceApprovalDate),
        safetyAssessmentDate: formatMonth(values.safetyAssessmentDate),
        lastInspectionDate: formatMonth(values.lastInspectionDate),
        operatingPierCount: values.operatingPierCount ? Number(values.operatingPierCount) : undefined,
        publishedPierCount: values.publishedPierCount ? Number(values.publishedPierCount) : undefined,
        investmentAgreementPierCount: values.investmentAgreementPierCount ? Number(values.investmentAgreementPierCount) : undefined,
        cargoThroughput: values.cargoThroughput ? Number(values.cargoThroughput) : undefined,
        receivesLargeVessel: values.receivesLargeVessel === '1',
        documentNumber: values.documentNumber || undefined,
        documentDate: formatDate(values.documentDate),
        openingAnnouncementDate: formatDate(values.openingAnnouncementDate),
        openingDecision: values.openingDecision || undefined,
        investmentAgreementDoc: values.investmentAgreementDoc || undefined,
        operationalStatus: 'OPERATIONAL',
        mapSymbolId: values.gisLocation?.bieuTuongId || values.bieuTuongId || undefined,
        geometryType: values.loaiHinhHoc || undefined,
        coordinates: values.gisLocation?.toaDo || undefined,
      };

      const parsed = cauCangCreateSchema.parse(payload);

      setSubmitting(true);
      await createCauCang(parsed, actionType);

      const successMsg = actionType === 'LUU_TAM' ? 'Lưu tạm cầu cảng thành công'
        : actionType === 'LUU_VA_GUI_PHE_DUYET' ? 'Đã gửi phê duyệt cầu cảng'
        : 'Tạo mới và phê duyệt cầu cảng thành công';
      toast.success(successMsg);
      setCreateModalVisible(false);
      createForm.resetFields();
      fetchData();
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        err.issues.forEach((e) => toast.error(e.message));
      } else if ((err as any).status === 409) {
        createForm.setFields([{ name: 'pierCode', errors: ['Mã cầu đã tồn tại.'] }]);
        toast.error('Mã cầu đã tồn tại');
      } else {
        toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra');
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

  const handleUpdateFinish = async (values: any) => {
    if (!selectedRecord) return;
    try {
      const parsed = cauCangUpdateSchema.parse({
        id: selectedRecord.id,
        pierName: values.pierName || undefined,
        berthId: values.berthId || undefined,
        length: values.length,
        taiTrong: values.taiTrong,
        loaiCau: values.loaiCau || undefined,
        operationalCapacity: values.operationalCapacity ? values.operationalCapacity.join(', ') : undefined,
        operationalStatus: values.operationalStatus,
        bieuTuongId: values.gisLocation?.bieuTuongId || values.bieuTuongId || null,
        loaiHinhHoc: values.loaiHinhHoc,
        toaDo: values.gisLocation?.toaDo,
      });

      setSubmitting(true);
      const res = await updateCauCang(parsed);
      toast.success('Cập nhật cầu cảng thành công');
      if (window.parent && (window.parent as any).kchtDetailCache) {
        (window.parent as any).kchtDetailCache[selectedRecord.id] = res;
      }
      closeUpdateModal();
      if (!isIframeModal) {
        fetchData();
      }
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        err.issues.forEach((e) => toast.error(e.message));
      } else {
        toast.error(err instanceof Error ? err.message : 'Cập nhật thất bại');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'stt', title: 'STT',
        width: 60,
        render: (_: unknown, __: Pier, idx: number) => page * pageSize + idx + 1,
      },
      {
        key: 'pierCode', title: 'Mã cầu',
        dataIndex: 'pierCode',
        width: 120,
        render: (pierCode: string) => <Tag color="cyan">{pierCode}</Tag>,
      },
      {
        key: 'pierName', title: 'Tên cầu',
        dataIndex: 'pierName',
        width: 250,
        ellipsis: true,
      },
      {
        key: 'berthName', title: 'Bến cảng chủ',
        dataIndex: 'tenBenCang',
        width: 180,
        render: (tenBenCang: string, record: Pier) => {
          return tenBenCang || record.berthId?.slice(0, 8) + '…';
        },
      },
      {
        key: 'length', title: 'Chiều dài (m)',
        dataIndex: 'length',
        width: 125,
        align: 'right' as const,
        render: (v: number | null) => v != null && v !== undefined ? v.toFixed(2) : '—',
      },
      {
        key: 'taiTrong', title: 'Tải trọng (tấn)',
        dataIndex: 'taiTrong',
        width: 125,
        align: 'right' as const,
        render: (v: number | null) => v != null && v !== undefined ? v.toFixed(2) : '—',
      },
      {
        key: 'loaiCau', title: 'Loại cầu',
        dataIndex: 'loaiCau',
        width: 120,
        ellipsis: true,
        render: (v: string) => translateLoaiCau(v),
      },
      {
        key: 'operationalStatus', title: 'Trạng thái HĐ',
        dataIndex: 'operationalStatus',
        width: 100,
        render: (v: string) => {
          const badge = trangThaiHoatDongBadge(v);
          return <Tag color={badge.color}>{badge.label}</Tag>;
        },
      },
      {
        key: 'approvalStatus', title: 'Phê duyệt',
        dataIndex: 'approvalStatus',
        width: 110,
        render: (v: string) => {
          const badge = trangThaiPheDuyetBadge(v);
          return <Tag color={badge.color}>{badge.label}</Tag>;
        },
      },
      {
        key: 'createdAt', title: 'Ngày tạo',
        dataIndex: 'createdAt',
        width: 140,
        render: (v: string) => v ? new Date(v).toLocaleDateString('vi-VN') : '—',
      },
      {
        key: 'actions', title: '',
        width: 240,
        fixed: 'right' as const,
        render: (_: unknown, record: Pier) => (
          <Space size="small">
            <Tooltip title="Xem chi tiết">
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    const data = await fetchCauCangById(record.id);
                    setSelectedRecord(data);
                    const fileRes = await documentApi.listByEntity('pier', record.id, { page: 1, size: 20 });
                    setDetailFiles(fileRes.data || []);
                    setDetailModalVisible(true);
                  } catch (err) {
                    toast.error('Không thể tải thông tin chi tiết cầu cảng');
                  } finally {
                    setIsLoading(false);
                  }
                }}
              />
            </Tooltip>
            <Tooltip title="Sửa">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    const data = await fetchCauCangById(record.id);
                    setSelectedRecord(data);
                    updateForm.setFieldsValue({
                      pierCode: data.pierCode,
                      pierName: data.pierName,
                      berthId: data.berthId,
                      length: data.length,
                      taiTrong: data.taiTrong,
                      loaiCau: data.loaiCau,
                      operationalCapacity: data.operationalCapacity ? data.operationalCapacity.split(',').map(s => s.trim()) : [],
                      operationalStatus: data.operationalStatus,
                      bieuTuongId: data.bieuTuongId,
                      loaiHinhHoc: data.loaiHinhHoc || 'LINE',
                      gisLocation: {
                        loaiHinhHoc: data.loaiHinhHoc || 'LINE',
                        toaDo: data.toaDo || '',
                        bieuTuongId: data.bieuTuongId
                      }
                    });
                    setUpdateModalVisible(true);
                    if (data.approvalStatus === 'PENDING') {
                      setEditWarning('Cầu cảng đang trong quá trình phê duyệt. Sau khi cập nhật, trạng thái phê duyệt sẽ quay về Chờ phê duyệt.');
                    } else {
                      setEditWarning(null);
                    }
                  } catch (err) {
                    toast.error('Không thể tải thông tin cầu cảng');
                  } finally {
                    setIsLoading(false);
                  }
                }}
              />
            </Tooltip>
            <Tooltip title="Lịch sử">
              <Button
                type="link"
                size="small"
                icon={<HistoryOutlined />}
                onClick={async () => {
                  try {
                    setLoadingHistory(true);
                    setSelectedRecord(record);
                    setHistoryModalVisible(true);
                    const { fetchpierHistory } = await import('./api');
                    const histData = await fetchpierHistory(record.id);
                    setHistoryRecords(histData?.changeHistory || []);
                  } catch (err) {
                    toast.error('Không thể tải lịch sử thay đổi');
                  } finally {
                    setLoadingHistory(false);
                  }
                }}
              />
            </Tooltip>
            {record.approvalStatus === 'PENDING' && (
              <>
                <Tooltip title="Phê duyệt">
                  <Popconfirm
                    title="Phê duyệt cầu cảng?"
                    okText="Phê duyệt"
                    cancelText="Hủy"
                    onConfirm={() => handleApprove(record)}
                  >
                    <Button type="link" size="small" icon={<CheckCircleOutlined />} />
                  </Popconfirm>
                </Tooltip>
                <Tooltip title="Từ chối">
                  <Popconfirm
                    title="Từ chối cầu cảng?"
                    description="Bạn sẽ cần nhập lý do từ chối."
                    okText="Từ chối"
                    cancelText="Hủy"
                    onConfirm={() => handleReject(record)}
                  >
                    <Button type="link" size="small" danger icon={<CloseCircleOutlined />} />
                  </Popconfirm>
                </Tooltip>
              </>
            )}
            <Tooltip title="Xóa">
              <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [page, pageSize, benCangOptions, handleApprove, handleReject, handleDelete, navigate],
  );

  return (
    <>
      {!isIframeModal && (
        <>
          <ScreenHeader
            breadcrumb={[{ label: 'Tài sản KCHTGT' }, { label: 'Quản lý cầu cảng' }]}
            actions={[
              {
                key: 'create',
                label: 'Tạo mới',
                icon: <PlusOutlined />,
                variant: 'primary' as const,
                onClick: () => { createForm.resetFields(); setCreateModalVisible(true); },
              },
            ]}
          />
          <FilterBar
            fields={filterFields}
            onSearch={(values) => {
              setSearch(values.search || '');
              setFilterLoaiCau(values.loaiCau || undefined);
              setFilterProvince(values.province || '');
              setPage(0);
            }}
            onReset={() => {
              setSearch('');
              setFilterLoaiCau(undefined);
              setFilterProvince('');
              setFilterStatus(undefined);
              setFilterApproval(undefined);
              setFilterBenCangId(undefined);
              setPage(0);
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
            <StatusTabs
              tabs={[
                { key: '', label: 'Tất cả', count: 0, color: textSecondary, active: !filterApproval },
                { key: 'PENDING', label: 'Chờ phê duyệt', count: 0, color: '#faad14', active: filterApproval === 'PENDING' },
                { key: 'APPROVED', label: 'Đã phê duyệt', count: 0, color: '#1677ff', active: filterApproval === 'APPROVED' },
                { key: 'REJECTED', label: 'Từ chối', count: 0, color: '#ff4d4f', active: filterApproval === 'REJECTED' },
              ]}
              onChange={(key) => { setFilterApproval(key || undefined); setPage(0); }}
            />
          </div>

      <Card>
        {isLoading && <LoadingSkeleton rows={8} type="table" />}
        {isError && (
          <ErrorState
            message={error?.message || 'Không thể tải danh sách cầu cảng'}
            onRetry={() => { setPage(0); fetchData(); }}
          />
        )}
        {!isLoading && !isError && dataSource.length === 0 && (
          <EmptyState
            description={search || filterStatus || filterApproval || filterBenCangId ? 'Không tìm thấy' : 'Chưa có cầu cảng nào'}
          />
        )}
        {!isLoading && !isError && dataSource.length > 0 && (
          <DataTable<Pier>
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            scroll={{ x: 1600 }}
            pagination={{
              current: page + 1,
              pageSize,
              total,
              onChange: (p) => setPage(p - 1),
              showSizeChanger: true,
              showTotal: (total: number, range: [number, number]) => `Hiển thị ${range[0]}-${range[1]} của ${total} kết quả`,
              pageSizeOptions: ['10', '20', '50'],
            }}
          />
        )}
      </Card>
        </>
      )}

      {/* Create Modal — redesigned with 7 Collapse groups (F-020) */}
      {!isIframeModal && (
        <Modal
          title="Tạo mới Cầu cảng"
          open={createModalVisible}
          onCancel={() => setCreateModalVisible(false)}
          footer={null}
          width={1100}
          styles={{ body: { maxHeight: '80vh', overflowY: 'auto', padding: '16px 24px' } }}
        >
          <Form
            form={createForm}
            layout="vertical"
            onFinish={(values) => handleCreateFinish(values, actionTypeRef.current)}
            onFinishFailed={handleFormFailed}
            initialValues={{ operationalStatus: 'OPERATIONAL', conditionStatus: 1, receivesLargeVessel: '0' }}
          >
            <Tabs
              defaultActiveKey="basic"
              tabBarStyle={{ marginBottom: 16, paddingLeft: 16, paddingRight: 16 }}
              style={{ border: 'none', background: surfaceCard, borderRadius: 0 }}
              items={[
                // ── Group A: Thông tin cơ bản ──────────────────────────────────
                {
                  key: 'basic',
                  label: <span style={{ fontWeight: 600, fontSize: 15, color: textPrimary }}>Thông tin cơ bản</span>,
                  children: (
                    <div style={{ padding: `0 ${spaceMd}px ${spaceMd}px ${spaceMd}px` }}>
                      <Row gutter={24}>
                        <Col span={12}>
                          <Form.Item style={{ marginBottom: spaceFormField }} label="Đơn vị quản lý" name="orgUnitId">
                            <Select
                              disabled
                              style={{ borderRadius: radiusPill, height: 40 }}
                              placeholder="Đơn vị của bạn"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item style={{ marginBottom: spaceFormField }} label="Thuộc cảng biển" name="portId">
                            <Select
                              placeholder="Chọn cảng biển"
                              showSearch
                              filterOption={false}
                              onOpenChange={(open) => { if (open && portOptions.length === 0) handlePortSearch(''); }}
                              onSearch={handlePortSearch}
                              onSelect={(val) => { fetchBerthsByPort(val); fetchNavChannelsByPort(val); }}
                              onClear={() => { setBenCangOptions([]); setNavigationChannelOptions([]); }}
                              allowClear
                              style={{ borderRadius: radiusPill, height: 40 }}
                              options={portOptions.map((o) => ({ label: o.portName, value: o.id }))}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={24}>
                        <Col span={12}>
                          <Form.Item
                            style={{ marginBottom: spaceFormField }}
                            label="Thuộc bến cảng *"
                            name="berthId"
                            rules={[{ required: true, message: 'Vui lòng chọn bến cảng chủ' }]}
                          >
                            <Select
                              placeholder="Chọn bến cảng"
                              showSearch
                              filterOption={false}
                              onOpenChange={(open) => { if (open && benCangOptions.length === 0) handleBenCangSearch(''); }}
                              onSearch={handleBenCangSearch}
                              style={{ borderRadius: radiusPill, height: 40 }}
                              options={benCangOptions.map((o) => ({ label: o.berthName, value: o.id }))}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item style={{ marginBottom: spaceFormField }} label="Thuộc luồng hàng hải" name="navigationChannelId">
                            <Select
                              placeholder="Chọn luồng hàng hải"
                              showSearch
                              filterOption={false}
                              onOpenChange={(open) => { if (open && navigationChannelOptions.length === 0) handleNavigationChannelSearch(''); }}
                              onSearch={handleNavigationChannelSearch}
                              allowClear
                              style={{ borderRadius: radiusPill, height: 40 }}
                              options={navigationChannelOptions.map((o) => ({ label: o.channelName, value: o.id }))}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={24}>
                        <Col span={12}>
                          <Form.Item
                            style={{ marginBottom: spaceFormField }}
                            label="Mã cầu cảng *"
                            name="pierCode"
                            rules={[{ required: true, message: 'Mã cầu không được để trống' }, { max: 50, message: 'Mã cầu tối đa 50 ký tự' }]}
                          >
                            <Input placeholder="VD: CC-HAIPHONG-001" maxLength={50} style={{ borderRadius: radiusPill, height: 40 }} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            style={{ marginBottom: spaceFormField }}
                            label="Tên cầu cảng *"
                            name="pierName"
                            rules={[{ required: true, message: 'Tên cầu không được để trống' }, { max: 255, message: 'Tên cầu tối đa 255 ký tự' }]}
                          >
                            <Input placeholder="VD: Cầu cảng Hải Phòng" maxLength={255} style={{ borderRadius: radiusPill, height: 40 }} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={24}>
                        <Col span={12}>
                          <Form.Item style={{ marginBottom: spaceFormField }} label="Địa điểm (Tỉnh/TP)" name="province">
                            <Select
                              placeholder="Chọn tỉnh/thành phố"
                              showSearch
                              allowClear
                              style={{ borderRadius: radiusPill, height: 40 }}
                              options={VIETNAM_PROVINCE_OPTIONS}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item style={{ marginBottom: spaceFormField }} label="Địa điểm chi tiết" name="detailedLocation">
                            <Input.TextArea
                              placeholder="Nhập địa điểm chi tiết"
                              maxLength={500}
                              rows={1}
                              style={{ borderRadius: radiusSm, minHeight: 40 }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={24}>
                        <Col span={8}>
                          <Form.Item style={{ marginBottom: spaceFormField }} label="Phân cấp công trình" name="constructionGrade">
                            <Select
                              placeholder="Chọn cấp"
                              allowClear
                              style={{ borderRadius: radiusPill, height: 40 }}
                              options={CONSTRUCTION_GRADE_OPTIONS}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item style={{ marginBottom: spaceFormField }} label="Loại kết cấu" name="loaiCau">
                            <Select
                              placeholder="Chọn loại kết cấu"
                              allowClear
                              style={{ borderRadius: radiusPill, height: 40 }}
                              options={LOAI_CAU_OPTIONS}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item style={{ marginBottom: spaceFormField }} label="Tình trạng" name="conditionStatus">
                            <Select
                              style={{ borderRadius: radiusPill, height: 40 }}
                              options={CONDITION_STATUS_OPTIONS}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={24}>
                        <Col span={24}>
                          <Form.Item style={{ marginBottom: spaceFormField }} label="Công năng khai thác" name="operationalCapacity">
                            <Select
                              mode="multiple"
                              placeholder="Chọn công năng khai thác"
                              allowClear
                              style={{ borderRadius: radiusPill, minHeight: 40 }}
                              options={CONG_NANG_KHAI_THAC_OPTIONS}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  ),
                },

                // ── Group B: Thông số kỹ thuật ─────────────────────────────────
                {
                  key: 'technical',
                  label: <span style={{ fontWeight: 600, fontSize: 15, color: textPrimary }}>Thông số kỹ thuật</span>,
                  children: (
                    <div style={{ padding: `0 ${spaceMd}px ${spaceMd}px ${spaceMd}px` }}>
                      <Row gutter={24}>
                        <Col span={12}>
                          <Form.Item
                            style={{ marginBottom: spaceFormField }}
                            label={<span>Chiều dài (m) <span style={{ color: '#ff4d4f' }}>*</span></span>}
                            name="length"
                            rules={[{ required: true, message: 'Chiều dài là bắt buộc' }]}
                          >
                            <InputNumber min={0} step={0.01} precision={2} placeholder="VD: 150.00" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            style={{ marginBottom: spaceFormField }}
                            label={<span>Chiều rộng (m) <span style={{ color: '#ff4d4f' }}>*</span></span>}
                            name="width"
                            rules={[{ required: true, message: 'Chiều rộng là bắt buộc' }]}
                          >
                            <InputNumber min={0} step={0.01} precision={2} placeholder="VD: 25.00" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={24}>
                        <Col span={8}>
                          <Form.Item style={{ marginBottom: spaceFormField }} label="Độ sâu khu nước hiện tại" name="currentWaterDepth">
                            <Input placeholder="VD: -12.5m" maxLength={20} style={{ borderRadius: radiusPill, height: 40 }} />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item style={{ marginBottom: spaceFormField }} label="Cao độ đáy bến thiết kế" name="designBedElevation">
                            <Input placeholder="VD: -15.0m" maxLength={20} style={{ borderRadius: radiusPill, height: 40 }} />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item style={{ marginBottom: spaceFormField }} label="Cỡ tàu khai thác (DWT)" name="publishedVesselDWT">
                            <Input placeholder="VD: 50,000 DWT" maxLength={20} style={{ borderRadius: radiusPill, height: 40 }} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  ),
                },

                // ── Group C: Thời điểm & kiểm định ────────────────────────────
                {
                  key: 'timing',
                  label: <span style={{ fontWeight: 600, fontSize: 15, color: textPrimary }}>Thời điểm & kiểm định</span>,
                  children: (
                    <div style={{ padding: `0 ${spaceMd}px ${spaceMd}px ${spaceMd}px` }}>
                      <Row gutter={24}>
                        <Col span={8}>
                          <Form.Item style={{ marginBottom: spaceFormField }} label="Thời điểm phê duyệt quy trình bảo trì" name="maintenanceApprovalDate">
                            <DatePicker picker="month" placeholder="MM/YYYY" format="MM/YYYY" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item style={{ marginBottom: spaceFormField }} label="Thời điểm chấp thuận hồ sơ ĐG ATCT" name="safetyAssessmentDate">
                            <DatePicker picker="month" placeholder="MM/YYYY" format="MM/YYYY" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item style={{ marginBottom: spaceFormField }} label="Thời điểm kiểm định gần nhất" name="lastInspectionDate">
                            <DatePicker picker="month" placeholder="MM/YYYY" format="MM/YYYY" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  ),
                },

                // ── Group D: Số lượng & sản lượng ─────────────────────────────
                {
                  key: 'quantities',
                  label: <span style={{ fontWeight: 600, fontSize: 15, color: textPrimary }}>Số lượng & sản lượng</span>,
                  children: (
                    <div style={{ padding: `0 ${spaceMd}px ${spaceMd}px ${spaceMd}px` }}>
                      <Row gutter={24}>
                        <Col span={6}>
                          <Form.Item style={{ marginBottom: spaceFormField }} label="Số lượng CC đang khai thác" name="operatingPierCount">
                            <InputNumber min={0} max={99999} placeholder="0" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item style={{ marginBottom: spaceFormField }} label="Số lượng CC đã công bố" name="publishedPierCount">
                            <InputNumber min={0} max={99999} placeholder="0" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item style={{ marginBottom: spaceFormField }} label="Số lượng CC đang TƯĐT XD" name="investmentAgreementPierCount">
                            <InputNumber min={0} max={99999} placeholder="0" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item style={{ marginBottom: spaceFormField }} label="Sản lượng hàng thông qua" name="cargoThroughput">
                            <InputNumber min={0} placeholder="0" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  ),
                },

                // ── Group E: Phương án bảo đảm ATHH ──────────────────────────
                {
                  key: 'athh',
                  label: <span style={{ fontWeight: 600, fontSize: 15, color: textPrimary }}>Phương án bảo đảm ATHH</span>,
                  children: (
                    <div style={{ padding: `0 ${spaceMd}px ${spaceMd}px ${spaceMd}px` }}>
                      <Row gutter={24}>
                        <Col span={8}>
                          <Form.Item
                            style={{ marginBottom: spaceFormField }}
                            label="Tiếp nhận tàu có TT lớn hơn QĐ CB"
                            name="receivesLargeVessel"
                          >
                            <Select
                              style={{ borderRadius: radiusPill, height: 40 }}
                              options={RECEIVES_LARGE_VESSEL_OPTIONS}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            style={{ marginBottom: spaceFormField }}
                            label="Số văn bản"
                            name="documentNumber"
                            dependencies={['receivesLargeVessel']}
                            rules={[
                              ({ getFieldValue }: any) => ({
                                validator(_: any, value: any) {
                                  if (getFieldValue('receivesLargeVessel') === '1' && !value) {
                                    return Promise.reject(new Error('Vui lòng nhập số văn bản'));
                                  }
                                  return Promise.resolve();
                                },
                              }),
                            ]}
                          >
                            <Input placeholder="Nhập số văn bản" maxLength={100} style={{ borderRadius: radiusPill, height: 40 }} />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            style={{ marginBottom: spaceFormField }}
                            label="Ngày văn bản"
                            name="documentDate"
                            dependencies={['receivesLargeVessel']}
                            rules={[
                              ({ getFieldValue }: any) => ({
                                validator(_: any, value: any) {
                                  if (getFieldValue('receivesLargeVessel') === '1' && !value) {
                                    return Promise.reject(new Error('Vui lòng chọn ngày văn bản'));
                                  }
                                  return Promise.resolve();
                                },
                              }),
                            ]}
                          >
                            <DatePicker placeholder="Chọn ngày" format="DD/MM/YYYY" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  ),
                },

                // ── Group F: Công bố mở, đưa vào SD ──────────────────────────
                {
                  key: 'announcement',
                  label: <span style={{ fontWeight: 600, fontSize: 15, color: textPrimary }}>Công bố mở, đưa vào sử dụng</span>,
                  children: (
                    <div style={{ padding: `0 ${spaceMd}px ${spaceMd}px ${spaceMd}px` }}>
                      <Row gutter={24}>
                        <Col span={8}>
                          <Form.Item style={{ marginBottom: spaceFormField }} label="Thời điểm công bố mở, đưa vào SD" name="openingAnnouncementDate">
                            <DatePicker placeholder="Chọn ngày" format="DD/MM/YYYY" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item style={{ marginBottom: spaceFormField }} label="Quyết định công bố / VB cho phép KT" name="openingDecision">
                            <Input.TextArea placeholder="Nhập số quyết định/văn bản" maxLength={200} rows={1} style={{ borderRadius: radiusSm, minHeight: 40 }} />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item style={{ marginBottom: spaceFormField }} label="Văn bản thỏa thuận đầu tư XD" name="investmentAgreementDoc">
                            <Input.TextArea placeholder="Nhập văn bản thỏa thuận" maxLength={2000} rows={1} style={{ borderRadius: radiusSm, minHeight: 40 }} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  ),
                },

                // ── Group G: GIS & File ─────────────────────────────────────
                {
                  key: 'gis',
                  label: <span style={{ fontWeight: 600, fontSize: 15, color: textPrimary }}>GIS</span>,
                  children: (
                    <div style={{ padding: `0 ${spaceMd}px ${spaceMd}px ${spaceMd}px` }}>
                      <Row gutter={24}>
                        <Col span={12}>
                          <Form.Item style={{ marginBottom: spaceFormField }} label="Loại đối tượng" name="loaiHinhHoc">
                            <Select placeholder="Chọn loại đối tượng" allowClear style={{ borderRadius: radiusPill, height: 40 }}
                              options={[{ value: 'POINT', label: 'Đối tượng điểm' }, { value: 'LINE', label: 'Đối tượng đường' }, { value: 'POLYGON', label: 'Đối tượng vùng' }]} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item style={{ marginBottom: spaceFormField }} name="bieuTuongId" label="Biểu tượng bản đồ">
                            <Select placeholder="Chọn biểu tượng" allowClear showSearch optionFilterProp="label" style={{ borderRadius: radiusPill, height: 40 }}>
                              {symbols.map((sym) => (<Select.Option key={sym.id} value={sym.id} label={`${sym.name} (${sym.code})`}><Space>{sym.hinhAnh && <img src={sym.hinhAnh.startsWith('data:') ? sym.hinhAnh : `data:image/png;base64,${sym.hinhAnh}`} alt={sym.name} style={{ width: 20, height: 20, objectFit: 'contain' }} />}<span>{sym.name} ({sym.code})</span></Space></Select.Option>))}
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={24}>
                        <Col span={12}>
                          <Form.Item style={{ marginBottom: spaceFormField }} label="Hệ quy chiếu">
                            <Input value="WGS_84" disabled style={{ borderRadius: radiusPill, height: 40, color: textTertiary }} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item style={{ marginBottom: spaceFormField }} label="Quy tắc hiển thị">
                            <Input value="Độ/Phút/Giây" disabled style={{ borderRadius: radiusPill, height: 40, color: textTertiary }} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={24}>
                        <Col span={24}>
                          <Form.Item style={{ marginBottom: 0 }}>
                            <Form.Item name="gisLocation" style={{ marginBottom: 0 }}>
                              <GisLocationSelector defaultGeometryType={createLoaiHinhHoc} />
                            </Form.Item>
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  ),
                },
              ]}
            />

            {/* ── Footer: 4 action buttons ──────────────────────────────────── */}
            <div
              style={{
                padding: `${spaceMd}px ${spaceLg}px`,
                borderTop: `1px solid ${borderDefault}`,
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: spaceSm,
                background: surfaceCard,
              }}
            >
              <Button
                style={{ borderRadius: radiusPill, height: 40, color: textSecondary, borderColor: borderDefault }}
                onClick={() => setCreateModalVisible(false)}
              >
                Hủy
              </Button>
              <Button
                style={{ borderRadius: radiusPill, height: 40, color: textSecondary, borderColor: borderDefault }}
                loading={submitting}
                onClick={() => {
                  createForm.validateFields()
                    .then((values) => { void handleCreateFinish(values, 'LUU_TAM'); })
                    .catch(() => {});
                }}
              >
                Lưu tạm
              </Button>
              <Button
                type="primary"
                style={{ borderRadius: radiusPill, height: 40, background: actionPrimary, borderColor: actionPrimary }}
                loading={submitting}
                onClick={() => {
                  createForm.validateFields()
                    .then((values) => { void handleCreateFinish(values, 'LUU_VA_GUI_PHE_DUYET'); })
                    .catch(() => {});
                }}
              >
                Lưu và gửi phê duyệt
              </Button>
              {(currentUser?.role?.includes('ADMIN') || hasPermission('data:approve')) && (
                <Button
                  type="primary"
                  style={{ borderRadius: radiusPill, height: 40, background: actionPrimary, borderColor: actionPrimary }}
                  loading={submitting}
                  onClick={() => {
                    createForm.validateFields()
                      .then((values) => { void handleCreateFinish(values, 'LUU_VA_PHE_DUYET'); })
                      .catch(() => {});
                  }}
                >
                  Lưu và phê duyệt
                </Button>
              )}
            </div>
          </Form>
        </Modal>
      )}

      {/* Edit Modal */}
      {(!isIframeModal || action === 'edit') && (
        <Modal
        title={isIframeModal ? null : (selectedRecord ? `Chỉnh sửa: ${selectedRecord.pierCode} — ${selectedRecord.pierName}` : 'Chỉnh sửa cầu cảng')}
        open={updateModalVisible}
        onCancel={closeUpdateModal}
        footer={null}
        width={isIframeModal ? '100%' : 800}
        mask={!isIframeModal}
        closable={!isIframeModal}
        style={isIframeModal ? { top: 0, margin: 0, padding: 0, maxWidth: 'none', height: '100%' } : undefined}
        styles={{
          body: isIframeModal ? { padding: '16px 24px', height: '100%', overflowY: 'auto' } : undefined
        }}
      >
        <Form form={updateForm} layout="vertical" onFinish={handleUpdateFinish} onFinishFailed={handleFormFailed}>
          {editWarning && <Alert type="warning" message={editWarning} showIcon style={{ marginBottom: 16 }} />}
          <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>
            Thông tin chung
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Mã cầu" name="pierCode">
                <Input disabled aria-readonly="true" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Tên cầu *"
                name="pierName"
                rules={[{ required: true, message: 'Tên cầu không được để trống' }, { max: 255, message: 'Tên cầu tối đa 255 ký tự' }]}
              >
                <Input placeholder="VD: Cầu cảng Hải Phòng" maxLength={255} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="Bến cảng chủ *"
                name="berthId"
                rules={[{ required: true, message: 'Vui lòng chọn bến cảng chủ' }]}
              >
                <Select
                  placeholder="Chọn bến cảng chủ"
                  showSearch
                  filterOption={false}
                  onSearch={handleBenCangSearch}
                  onOpenChange={(open) => {
                    if (open && benCangOptions.length <= 1) {
                      void handleBenCangSearch('');
                    }
                  }}
                  options={benCangOptions.map(o => ({ label: o.berthName, value: o.id }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Loại cầu" name="loaiCau">
                <Select placeholder="Chọn loại cầu cảng" allowClear options={LOAI_CAU_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Thông số kỹ thuật
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Chiều dài (m)" name="length">
                <InputNumber min={0} step={0.01} precision={2} placeholder="VD: 150.00" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Tải trọng (tấn)" name="taiTrong">
                <InputNumber min={0} step={0.01} precision={2} placeholder="VD: 5000.00" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item label="Công năng khai thác" name="operationalCapacity">
                <Select
                  mode="multiple"
                  placeholder="Chọn công năng khai thác"
                  allowClear
                  options={CONG_NANG_KHAI_THAC_OPTIONS}
                />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Trạng thái
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Trạng thái hoạt động" name="operationalStatus">
                <Select placeholder="Chọn trạng thái" options={Object.entries(STATUS_MAP).map(([v, { label }]) => ({ value: v, label }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Trạng thái phê duyệt">
                <Input disabled value={selectedRecord?.approvalStatus ? trangThaiPheDuyetBadge(selectedRecord.approvalStatus).label : '—'} aria-readonly="true" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item name="bieuTuongId" label="Biểu tượng bản đồ">
                <Select placeholder="Chọn biểu tượng hiển thị" allowClear showSearch optionFilterProp="label">
                  {symbols.map((sym) => (
                    <Select.Option key={sym.id} value={sym.id} label={`${sym.name} (${sym.code})`}>
                      <Space>
                        {sym.hinhAnh && (
                          <img
                            src={sym.hinhAnh.startsWith('data:') ? sym.hinhAnh : `data:image/png;base64,${sym.hinhAnh}`}
                            alt={sym.name}
                            style={{ width: 20, height: 20, objectFit: 'contain' }}
                          />
                        )}
                        <span>{sym.name} ({sym.code})</span>
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Vị trí không gian (GIS)
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Loại đối tượng" name="loaiHinhHoc" rules={[{ required: true, message: 'Loại đối tượng không được để trống' }]}>
                <Select placeholder="Chọn loại đối tượng" options={[
                  { value: 'POINT', label: 'Đối tượng điểm' },
                  { value: 'LINE', label: 'Đối tượng đường' },
                  { value: 'POLYGON', label: 'Đối tượng vùng' }
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item name="gisLocation">
                <GisLocationSelector defaultGeometryType={updateLoaiHinhHoc} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 24, marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={closeUpdateModal}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>Cập nhật</Button>
            </Space>
          </Form.Item>
        </Form>
        </Modal>
      )}

      {/* Detail Modal */}
      {(!isIframeModal || action === 'detail') && (
        <Modal
        title={isIframeModal ? null : (selectedRecord ? `Chi tiết cầu cảng: ${selectedRecord.pierCode} — ${selectedRecord.pierName}` : 'Chi tiết cầu cảng')}
        open={detailModalVisible}
        onCancel={closeDetailModal}
        footer={null}
        width={isIframeModal ? '100%' : 800}
        mask={!isIframeModal}
        closable={!isIframeModal}
        style={isIframeModal ? { top: 0, margin: 0, padding: 0, maxWidth: 'none', height: '100%' } : undefined}
        styles={{
          body: isIframeModal ? { padding: '16px 24px', height: '100%', overflowY: 'auto' } : undefined
        }}
      >
        {selectedRecord && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={16}>
                <Card title="Thông tin chung" size="small" style={{ height: '100%' }}>
                  <Row gutter={[12, 12]}>
                    <Col span={12}>
                      <Typography.Text strong>Mã cầu:</Typography.Text>
                      <br />
                      <Tag color="cyan">{selectedRecord.pierCode}</Tag>
                    </Col>
                    <Col span={12}>
                      <Typography.Text strong>Tên cầu:</Typography.Text>
                      <br />
                      <Typography.Text>{selectedRecord.pierName}</Typography.Text>
                    </Col>
                    <Col span={12} style={{ marginTop: 8 }}>
                      <Typography.Text strong>Bến cảng chủ:</Typography.Text>
                      <br />
                      <Typography.Text>
                        {selectedRecord.tenBenCang || selectedRecord.berthId}
                      </Typography.Text>
                    </Col>
                    <Col span={12} style={{ marginTop: 8 }}>
                      <Typography.Text strong>Loại cầu:</Typography.Text>
                      <br />
                      <Typography.Text>{translateLoaiCau(selectedRecord.loaiCau)}</Typography.Text>
                    </Col>
                    <Col span={12} style={{ marginTop: 8 }}>
                      <Typography.Text strong>Biểu tượng bản đồ:</Typography.Text>
                      <br />
                      <Space>
                        {(() => {
                          const sym = symbols.find(s => s.id === selectedRecord.bieuTuongId);
                          if (sym && sym.hinhAnh) {
                            return (
                              <img
                                src={sym.hinhAnh.startsWith('data:') ? sym.hinhAnh : `data:image/png;base64,${sym.hinhAnh}`}
                                alt={sym.name}
                                style={{ width: 20, height: 20, objectFit: 'contain' }}
                              />
                            );
                          }
                          return null;
                        })()}
                        <Typography.Text>
                          {translateValue('bieuTuongId', selectedRecord.bieuTuongId)}
                        </Typography.Text>
                      </Space>
                    </Col>
                  </Row>
                </Card>
              </Col>
              <Col span={8}>
                <Card title="Thông số kỹ thuật" size="small" style={{ height: '100%' }}>
                  <Typography.Text strong>Chiều dài:</Typography.Text> {selectedRecord.length != null ? `${selectedRecord.length.toFixed(2)} m` : '—'}
                  <br />
                  <Typography.Text strong style={{ marginTop: 8, display: 'inline-block' }}>Tải trọng:</Typography.Text> {selectedRecord.taiTrong != null ? `${selectedRecord.taiTrong.toFixed(2)} tấn` : '—'}
                </Card>
              </Col>
              <Col span={16}>
                <Card title="Trạng thái" size="small" style={{ height: '100%' }}>
                  <Row gutter={[12, 12]}>
                    <Col span={12}>
                      <Typography.Text strong>Hoạt động:</Typography.Text>
                      <br />
                      {selectedRecord.operationalStatus && (
                        <Tag color={trangThaiHoatDongBadge(selectedRecord.operationalStatus).color}>
                          {trangThaiHoatDongBadge(selectedRecord.operationalStatus).label}
                        </Tag>
                      )}
                    </Col>
                    <Col span={12}>
                      <Typography.Text strong>Phê duyệt:</Typography.Text>
                      <br />
                      {selectedRecord.approvalStatus && (
                        <Tag color={trangThaiPheDuyetBadge(selectedRecord.approvalStatus).color}>
                          {trangThaiPheDuyetBadge(selectedRecord.approvalStatus).label}
                        </Tag>
                      )}
                    </Col>
                  </Row>
                </Card>
              </Col>
              <Col span={24}>
                <Card title="Công năng khai thác" size="small">
                  {selectedRecord.operationalCapacity ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {selectedRecord.operationalCapacity.split(',').map(s => s.trim()).filter(Boolean).map(c => (
                        <Tag color="blue" key={c}>{c}</Tag>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: '#bfbfbf' }}>Chưa chọn công năng khai thác</span>
                  )}
                </Card>
              </Col>
              <Col span={24}>
                <Card title="Tài liệu đính kèm" size="small">
                  {detailFiles.length === 0 ? (
                    <span style={{ color: '#bfbfbf' }}>Không có tài liệu đính kèm</span>
                  ) : (
                    <div>
                      {detailFiles.map((f) => (
                        <div key={f.id} style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <Typography.Text strong>{f.fileName}</Typography.Text>
                            <br />
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                              {f.fileSize} bytes — {new Date(f.createdAt).toLocaleString('vi-VN')}
                            </Typography.Text>
                          </div>
                          <Button
                            type="link"
                            icon={<DownloadOutlined />}
                            onClick={() => window.open(documentApi.downloadUrl(f.minioKey), '_blank')}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </Col>
              <Col span={24}>
                <Card title="Thông tin hệ thống" size="small">
                  <Descriptions bordered column={2} size="small">
                    <Descriptions.Item label="Người tạo"><UserResolver userId={selectedRecord.createdBy} /></Descriptions.Item>
                    <Descriptions.Item label="Ngày tạo">{selectedRecord.createdAt ? new Date(selectedRecord.createdAt).toLocaleString('vi-VN') : '—'}</Descriptions.Item>
                    <Descriptions.Item label="Cập nhật bởi"><UserResolver userId={selectedRecord.updatedBy} /></Descriptions.Item>
                    <Descriptions.Item label="Ngày cập nhật">{selectedRecord.updatedAt ? new Date(selectedRecord.updatedAt).toLocaleString('vi-VN') : '—'}</Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>

            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <Space>
                {selectedRecord.approvalStatus === 'PENDING' && (
                  <>
                    <Popconfirm
                      title="Phê duyệt cầu cảng?"
                      okText="Phê duyệt"
                      cancelText="Hủy"
                      onConfirm={() => handleApprove(selectedRecord)}
                    >
                      <Button type="primary" icon={<CheckCircleOutlined />}>Phê duyệt</Button>
                    </Popconfirm>
                    <Button
                      danger
                      icon={<CloseCircleOutlined />}
                      onClick={() => handleReject(selectedRecord)}
                    >
                      Từ chối
                    </Button>
                  </>
                )}
                 <Button icon={<UploadOutlined />} onClick={() => { setDetailModalVisible(false); setUploadModalVisible(true); }}>
                  Upload Giấy tờ
                </Button>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setDetailModalVisible(false);
                    updateForm.setFieldsValue({
                      pierCode: selectedRecord.pierCode,
                      pierName: selectedRecord.pierName,
                      berthId: selectedRecord.berthId,
                      length: selectedRecord.length,
                      taiTrong: selectedRecord.taiTrong,
                      loaiCau: selectedRecord.loaiCau,
                      operationalCapacity: selectedRecord.operationalCapacity ? selectedRecord.operationalCapacity.split(',').map(s => s.trim()) : [],
                      operationalStatus: selectedRecord.operationalStatus,
                      bieuTuongId: selectedRecord.bieuTuongId,
                      loaiHinhHoc: selectedRecord.loaiHinhHoc || 'LINE',
                      gisLocation: {
                        loaiHinhHoc: selectedRecord.loaiHinhHoc || 'LINE',
                        toaDo: selectedRecord.toaDo || '',
                        bieuTuongId: selectedRecord.bieuTuongId
                      }
                    });
                    setUpdateModalVisible(true);
                    if (selectedRecord.approvalStatus === 'PENDING') {
                      setEditWarning('Cầu cảng đang trong quá trình phê duyệt. Sau khi cập nhật, trạng thái phê duyệt sẽ quay về Chờ phê duyệt.');
                    } else {
                      setEditWarning(null);
                    }
                  }}
                >
                  Chỉnh sửa
                </Button>
                <Button onClick={closeDetailModal}>Đóng</Button>
              </Space>
            </div>
          </div>
        )}
        </Modal>
      )}

      {/* Reject Modal */}
      <Modal
        title="Từ chối cầu cảng"
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

      {/* Upload Giấy tờ Modal */}
      {selectedRecord && (
        <DocumentUploadModal
          entityType="pier"
          entityId={selectedRecord.id}
          open={uploadModalVisible}
          onCancel={() => setUploadModalVisible(false)}
        />
      )}

      {/* History Modal */}
      <Modal
        title={selectedRecord ? `Lịch sử thay đổi: ${selectedRecord.pierCode} — ${selectedRecord.pierName}` : 'Lịch sử thay đổi'}
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setHistoryModalVisible(false)}>
            Đóng
          </Button>
        ]}
        width={700}
      >
        {loadingHistory ? (
          <LoadingSkeleton rows={5} />
        ) : historyRecords.length === 0 ? (
          <EmptyState description="Chưa có thay đổi nào được ghi nhận." />
        ) : (
          <div style={{ borderLeft: '2px solid #f0f0f0', paddingLeft: 24, marginLeft: 8, marginTop: 16, maxHeight: '60vh', overflowY: 'auto' }}>
            {historyRecords
              .sort((a, b) => new Date(b.changedAt || b.createdAt).getTime() - new Date(a.changedAt || a.createdAt).getTime())
              .map((record: any, idx: number) => {
                return (
                  <div key={record.id || idx} style={{ position: 'relative', marginBottom: 24, paddingBottom: 12, borderBottom: idx < historyRecords.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                    {/* Timeline dot */}
                    <div style={{ position: 'absolute', left: -29, top: 4, width: 12, height: 12, borderRadius: '50%', background: '#1890ff', border: '2px solid #fff', boxShadow: '0 0 0 2px #1890ff' }} />
                    
                    {/* Timestamp */}
                    <div style={{ marginBottom: 4 }}>
                      <Typography.Text strong>
                        {record.changedAt || record.createdAt ? new Date(record.changedAt || record.createdAt).toLocaleString('vi-VN') : '—'}
                      </Typography.Text>
                    </div>

                    {/* Actor */}
                    {(record.changedBy || record.actor) && (
                      <div style={{ marginBottom: 4 }}>
                        <Typography.Text type="secondary">Người thực hiện: </Typography.Text>
                        <Typography.Text strong>{record.changedBy || record.actor}</Typography.Text>
                      </div>
                    )}

                    {/* Field change */}
                    {(record.fieldName || record.fieldChanged) && (
                      <div style={{ marginBottom: 4 }}>
                        <Typography.Text type="secondary">Trường thay đổi: </Typography.Text>
                        <Typography.Text strong>{translateFieldName(record.fieldName || record.fieldChanged)}</Typography.Text>
                      </div>
                    )}

                    {/* Old/New value */}
                    {record.oldValue !== undefined && record.oldValue != null && (
                      <div style={{ marginBottom: 2 }}>
                        <Typography.Text type="secondary" style={{ textDecoration: 'line-through', color: '#ff4d4f' }}>
                          cũ: {translateValue(record.fieldName || record.fieldChanged, record.oldValue)}
                        </Typography.Text>
                      </div>
                    )}
                    {record.newValue !== undefined && record.newValue != null && (
                      <div>
                        <Typography.Text type="secondary">mới: </Typography.Text>
                        <Typography.Text style={{ color: '#52c41a', fontWeight: 500 }}>
                          {translateValue(record.fieldName || record.fieldChanged, record.newValue)}
                        </Typography.Text>
                      </div>
                    )}

                    {/* Reason */}
                    {record.reason && (
                      <div style={{ marginTop: 8, padding: 8, background: '#fff2f0', borderRadius: 4 }}>
                        <Typography.Text type="secondary">Lý do: </Typography.Text>
                        <Typography.Text>{record.reason}</Typography.Text>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </Modal>
    </>
  );
}

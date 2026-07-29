import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Button,
  Space,
  Tag,
  Card,
  Row,
  Col,
  Input,
  Select,
  Spin,
  Modal,
  Form,
  InputNumber,
  Typography,
  Descriptions,
  Tabs,
  Upload,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  HistoryOutlined,
  UploadOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import {
  fetchCangBienList,
  deleteCangBien,
  approveCangBien,
  rejectCangBien,
  fetchCangBienById,
  fetchPortStatusCounts,
} from './api';
import { trangThaiPheDuyetBadge } from './schema';
import type { CangBienResponse } from './types';
import toast from '../../components/ToastNotification';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import { organizationService } from '../../services/organizationService';
import { documentApi } from '../../app/document/api';
import DocumentUploadModal from '../../app/document/DocumentUploadModal';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import { symbolService } from '../symbolService';
import type { Symbol } from '../symbolService';
import { VIETNAM_PROVINCES } from '../../types/common';
import { PORT_STATUS_MAP } from '../../types/port';
import type { PortStatusValue } from '../../types/port';
import { ScreenHeader, FilterBar, StatusTabs, DataTable } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import {
  statusOperational,
  statusDraft,
  statusCritical,
  statusAttention,
  actionPrimary,
  textSecondary,
  textTertiary,
  borderDefault,
  fontSizeMd,
  fontWeightMedium,
  fontWeightBold,
  cardStyle,
  spaceFormField,
  radiusPill,
  surfaceCard,
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

// ── PortStatus badge renderer ────────────────────────────────────────

function renderPortStatusBadge(status: string | null | undefined): React.ReactNode {
  if (!status) return <span style={{ color: textTertiary }}>—</span>;
  const s = PORT_STATUS_MAP[status as PortStatusValue];
  if (!s) return <Tag>{status}</Tag>;
  return (
    <span style={{
      display: 'inline-flex', padding: '2px 10px', borderRadius: 999,
      fontSize: fontSizeMd, fontWeight: fontWeightMedium,
      background: `${s.color}15`, color: s.color,
    }}>
      {s.label}
    </span>
  );
}

// ── List Page ───────────────────────────────────────────────────────

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

const labelProps = (text: string) => ({
  label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

export default function PortListPage() {

  // ── Permission ──────────────────────────────────────────────────
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  // ── State ───────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [filterTinh, setFilterTinh] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [activeStatusTab, setActiveStatusTab] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<CangBienResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  // Modals visibility
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<CangBienResponse | null>(null);
  const [detailFiles, setDetailFiles] = useState<any[]>([]);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [createForm] = Form.useForm();
  const [updateForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [orgUnits, setOrgUnits] = useState<any[]>([]);
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectTarget, setRejectTarget] = useState<CangBienResponse | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CangBienResponse | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [coords, setCoords] = useState<Array<{ latitude: number | null; longitude: number | null }>>([]);
  const [infras, setInfras] = useState<Array<{ stt: number | null; name: string; qty: number | null }>>([]);
  const [fileList, setFileList] = useState<any[]>([]);
  const addCoord = () => setCoords([...coords, { latitude: null, longitude: null }]);
  const removeCoord = (idx: number) => setCoords(coords.filter((_, i) => i !== idx));
  const updateCoord = (idx: number, field: 'latitude' | 'longitude', value: number | null) => {
    const updated = [...coords]; updated[idx] = { ...updated[idx], [field]: value }; setCoords(updated);
  };
  const addInfra = () => setInfras([...infras, { stt: null, name: '', qty: null }]);
  const removeInfra = (idx: number) => setInfras(infras.filter((_, i) => i !== idx));
  const updateInfra = (idx: number, field: 'stt' | 'name' | 'qty', value: any) => {
    const updated = [...infras]; updated[idx] = { ...updated[idx], [field]: value }; setInfras(updated);
  };

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
              khaNangTiepNhan: data.khaNangTiepNhan != null ? data.khaNangTiepNhan : undefined,
              orgUnitId: data.orgUnitId || undefined,
              portGroup: data.portGroup != null ? data.portGroup : undefined,
              bieuTuongId: data.bieuTuongId || undefined,
              diaDiemChiTiet: data.diaDiemChiTiet || undefined,
              phanCap: data.phanCap != null ? data.phanCap : undefined,
              heQuyChieu: data.heQuyChieu != null ? data.heQuyChieu : undefined,
              quyTacHienThi: data.quyTacHienThi != null ? data.quyTacHienThi : undefined,
              phamViVungNuoc: data.phamViVungNuoc || undefined,
              tongSoBenCang: data.tongSoBenCang != null ? data.tongSoBenCang : undefined,
              tongSoKhuNeoDauChuyenTai: data.tongSoKhuNeoDauChuyenTai != null ? data.tongSoKhuNeoDauChuyenTai : undefined,
              tongSoTuyenLuongCongCong: data.tongSoTuyenLuongCongCong != null ? data.tongSoTuyenLuongCongCong : undefined,
              tongSoTuyenLuongChuyenDung: data.tongSoTuyenLuongChuyenDung != null ? data.tongSoTuyenLuongChuyenDung : undefined,
              tongChieuDaiLuongCongCong: data.tongChieuDaiLuongCongCong != null ? data.tongChieuDaiLuongCongCong : undefined,
              tongChieuDaiLuongChuyenDung: data.tongChieuDaiLuongChuyenDung != null ? data.tongChieuDaiLuongChuyenDung : undefined,
              tongSoPhaoTieuBaoHieu: data.tongSoPhaoTieuBaoHieu != null ? data.tongSoPhaoTieuBaoHieu : undefined,
              tongSoDeKe: data.tongSoDeKe != null ? data.tongSoDeKe : undefined,
              tongChieuDaiDeKe: data.tongChieuDaiDeKe != null ? data.tongChieuDaiDeKe : undefined,
              tongSoDenBienDangTieu: data.tongSoDenBienDangTieu != null ? data.tongSoDenBienDangTieu : undefined,
              quantityBenPhao: data.quantityBenPhao != null ? data.quantityBenPhao : undefined,
              quantityKhuNeoDau: data.quantityKhuNeoDau != null ? data.quantityKhuNeoDau : undefined,
              quantityKhuChuyenTai: data.quantityKhuChuyenTai != null ? data.quantityKhuChuyenTai : undefined,
              cacKhuNuocKhac: data.cacKhuNuocKhac || undefined,
              remarks: data.remarks || undefined,
              gisLocation: {
                loaiHinhHoc: data.loaiHinhHoc || 'POINT',
                toaDo: data.toaDo || '',
                bieuTuongId: data.bieuTuongId,
              },
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

  const fetchSymbols = useCallback(async () => {
    try {
      const res = await symbolService.list({ page: 1, pageSize: 1000, status: 'active' });
      setSymbols(res.data);
    } catch (err) {
      console.error('Failed to load symbols', err);
    }
  }, []);

  const fetchStatusCounts = useCallback(async () => {
    try {
      const counts = await fetchPortStatusCounts();
      setStatusCounts(counts);
    } catch (err) {
      console.error('Failed to load status counts', err);
    }
  }, []);

  useEffect(() => {
    void fetchStatusCounts();
  }, [fetchStatusCounts]);

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
      if (['bieuTuongId', 'iconId', 'lineSymbolId', 'fillSymbolId'].includes(fieldName)) {
          const sym = symbols.find((s) => s.id === val);
          return sym ? `${sym.name} (${(sym as any).code || ''})` : val;
      }
      if (['khongGianId', 'spatialId'].includes(fieldName)) {
        return 'Có tọa độ bản đồ';
      }
      if (fieldName === 'approvalStatus') {
        const approvalMap: Record<string, string> = {
          CHO_PHE_DUYET: 'Chờ phê duyệt',
          DA_PHE_DUYET: 'Đã phê duyệt',
          TU_CHOI: 'Từ chối',
        };
        return approvalMap[val.toUpperCase()] || val;
      }
      if (fieldName === 'operationalStatus') {
        const statusMap: Record<string, string> = {
          HIEN_HANH: 'Hiện hành',
          TAM_NGUNG: 'Tạm ngừng',
          'HIỆN_HÀNH': 'Hiện hành',
          'TẠM_NGƯNG': 'Tạm ngừng',
        };
        return statusMap[val.toUpperCase()] || val;
      }
      return val;
    },
    [symbols],
  );

  // Form watches
  const createLoaiHinhHoc = Form.useWatch('loaiHinhHoc', createForm) || 'POINT';
  const updateLoaiHinhHoc = Form.useWatch('loaiHinhHoc', updateForm) || 'POINT';

  const handleCreateFinish = async (values: Record<string, unknown>) => {
    const portCode = String(values.portCode).trim();
    const portName = String(values.portName).trim();
    const isDraft = (values.action as string) === 'draft';

    if (!isDraft && (!portCode || portCode === '')) { toast.error('Mã cảng không được để trống'); return; }
    if (portCode.length > 50) { toast.error('Mã cảng tối đa 50 ký tự'); return; }
    if (!portName) { toast.error('Tên cảng không được để trống'); return; }
    if (portName.length > 255) { toast.error('Tên cảng tối đa 255 ký tự'); return; }

    const area = values.area as number;
    if (!isDraft && (area === undefined || area === null || area <= 0)) {
      toast.error('Diện tích phải lớn hơn 0');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        action: (values.action as string) || 'submit',
        portName,
        province: (values.province as string) || undefined,
        area,
        khaNangTiepNhan: values.khaNangTiepNhan as number | undefined,
        operationalStatus: (values.operationalStatus as string) || undefined,
        approvalStatus: (values.approvalStatus as string) || 'CHO_PHE_DUYET',
        orgUnitId: (values.orgUnitId as string) || undefined,
        portGroup: values.portGroup ? Number(values.portGroup) : undefined,
        bieuTuongId: (values.gisLocation as any)?.bieuTuongId || (values.bieuTuongId as string) || undefined,
        loaiHinhHoc: values.loaiHinhHoc as string,
        toaDo: (values.gisLocation as any)?.toaDo || undefined,
        diaDiemChiTiet: (values.diaDiemChiTiet as string) || undefined,
        portClass: values.phanCap != null && !Number.isNaN(values.phanCap as number)
          ? Number(values.phanCap) : undefined,
        heQuyChieu: values.heQuyChieu != null && !Number.isNaN(values.heQuyChieu as number)
          ? Number(values.heQuyChieu) : undefined,
        quyTacHienThi: values.quyTacHienThi != null && !Number.isNaN(values.quyTacHienThi as number)
          ? Number(values.quyTacHienThi) : undefined,
        phamViVungNuoc: (values.phamViVungNuoc as string) || undefined,
        tongSoBenCang: values.tongSoBenCang != null && !Number.isNaN(values.tongSoBenCang as number)
          ? Number(values.tongSoBenCang) : undefined,
        tongSoKhuNeoDauChuyenTai: values.tongSoKhuNeoDauChuyenTai != null && !Number.isNaN(values.tongSoKhuNeoDauChuyenTai as number)
          ? Number(values.tongSoKhuNeoDauChuyenTai) : undefined,
        tongSoTuyenLuongCongCong: values.tongSoTuyenLuongCongCong != null && !Number.isNaN(values.tongSoTuyenLuongCongCong as number)
          ? Number(values.tongSoTuyenLuongCongCong) : undefined,
        tongSoTuyenLuongChuyenDung: values.tongSoTuyenLuongChuyenDung != null && !Number.isNaN(values.tongSoTuyenLuongChuyenDung as number)
          ? Number(values.tongSoTuyenLuongChuyenDung) : undefined,
        tongChieuDaiLuongCongCong: values.tongChieuDaiLuongCongCong != null && !Number.isNaN(values.tongChieuDaiLuongCongCong as number)
          ? Number(values.tongChieuDaiLuongCongCong) : undefined,
        tongChieuDaiLuongChuyenDung: values.tongChieuDaiLuongChuyenDung != null && !Number.isNaN(values.tongChieuDaiLuongChuyenDung as number)
          ? Number(values.tongChieuDaiLuongChuyenDung) : undefined,
        tongSoPhaoTieuBaoHieu: values.tongSoPhaoTieuBaoHieu != null && !Number.isNaN(values.tongSoPhaoTieuBaoHieu as number)
          ? Number(values.tongSoPhaoTieuBaoHieu) : undefined,
        tongSoDeKe: values.tongSoDeKe != null && !Number.isNaN(values.tongSoDeKe as number)
          ? Number(values.tongSoDeKe) : undefined,
        tongChieuDaiDeKe: values.tongChieuDaiDeKe != null && !Number.isNaN(values.tongChieuDaiDeKe as number)
          ? Number(values.tongChieuDaiDeKe) : undefined,
        tongSoDenBienDangTieu: values.tongSoDenBienDangTieu != null && !Number.isNaN(values.tongSoDenBienDangTieu as number)
          ? Number(values.tongSoDenBienDangTieu) : undefined,
        quantityBenPhao: values.quantityBenPhao != null && !Number.isNaN(values.quantityBenPhao as number)
          ? Number(values.quantityBenPhao) : undefined,
        quantityKhuNeoDau: values.quantityKhuNeoDau != null && !Number.isNaN(values.quantityKhuNeoDau as number)
          ? Number(values.quantityKhuNeoDau) : undefined,
        quantityKhuChuyenTai: values.quantityKhuChuyenTai != null && !Number.isNaN(values.quantityKhuChuyenTai as number)
          ? Number(values.quantityKhuChuyenTai) : undefined,
        cacKhuNuocKhac: (values.cacKhuNuocKhac as string) || undefined,
        remarks: (values.remarks as string) || undefined,
        waterAreaScope: (values.waterAreaScope as string) || undefined,
        coordinateSystem: values.coordinateSystem != null ? Number(values.coordinateSystem) : undefined,
        displayRule: values.displayRule != null && !Number.isNaN(values.displayRule as number)
          ? Number(values.displayRule) : undefined,
        portCoordinates: coords.filter(c => c.latitude != null && c.longitude != null).map((c, i) => ({
          latitude: c.latitude!, longitude: c.longitude!, sortOrder: i
        })),
        portInfrastructures: infras.filter(i => i.name && i.qty).map(i => ({
          sequenceNumber: i.stt || 0, infrastructureName: i.name, quantity: i.qty!
        })),
      };
      const result = await import('./api').then((m) => m.createCangBien(payload as any));
      const code = (result as any)?.portCode || '';
      toast.success(isDraft ? `Đã lưu tạm ${code}` : `Tạo mới thành công ${code} — chờ phê duyệt`);
      // Upload files after successful creation
      if (fileList.length > 0 && (result as any)?.id) {
        const portId = (result as any).id;
        const { uploadAttachment } = await import('./api');
        for (const file of fileList) {
          try { await uploadAttachment(portId, file); } catch { /* ignore */ }
        }
      }
      setCoords([]);
      setInfras([]);
      setFileList([]);
      setCreateModalVisible(false);
      fetchData();
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

  const handleCreateDraft = useCallback(() => {
    createForm.setFieldsValue({ action: 'draft' });
    createForm.submit();
  }, [createForm]);

  const handleFormFailed = (errorInfo: any) => {
    errorInfo.errorFields.forEach((field: any) => {
      toast.error(`${field.errors.join(', ')}`);
    });
  };

  const handleUpdateFinish = async (values: Record<string, unknown>) => {
    if (!selectedRecord) return;
    const area = values.area as number;
    if (area !== undefined && area != null && !Number.isNaN(area) && area <= 0) {
      toast.error('Diện tích phải lớn hơn 0');
      return;
    }

    setSubmitting(true);
    try {
      const n = (v: unknown): number | undefined =>
        v != null && !Number.isNaN(v as number) ? Number(v) : undefined;

      const payload = {
        id: selectedRecord.id,
        portName: (values.portName as string) || undefined,
        province: (values.province as string) || undefined,
        area: values.area as number | undefined,
        khaNangTiepNhan: values.khaNangTiepNhan as number | undefined,
        operationalStatus: (values.operationalStatus as string) || undefined,
        orgUnitId: (values.orgUnitId as string) || undefined,
        portGroup: values.portGroup ? Number(values.portGroup) : undefined,
        bieuTuongId: (values.gisLocation as any)?.bieuTuongId || (values.bieuTuongId as string) || null,
        loaiHinhHoc: values.loaiHinhHoc as string,
        toaDo: (values.gisLocation as any)?.toaDo || undefined,
        diaDiemChiTiet: (values.diaDiemChiTiet as string) || undefined,
        portClass: n(values.phanCap),
        heQuyChieu: n(values.heQuyChieu),
        quyTacHienThi: n(values.quyTacHienThi),
        phamViVungNuoc: (values.phamViVungNuoc as string) || undefined,
        tongSoBenCang: n(values.tongSoBenCang),
        tongSoKhuNeoDauChuyenTai: n(values.tongSoKhuNeoDauChuyenTai),
        tongSoTuyenLuongCongCong: n(values.tongSoTuyenLuongCongCong),
        tongSoTuyenLuongChuyenDung: n(values.tongSoTuyenLuongChuyenDung),
        tongChieuDaiLuongCongCong: n(values.tongChieuDaiLuongCongCong),
        tongChieuDaiLuongChuyenDung: n(values.tongChieuDaiLuongChuyenDung),
        tongSoPhaoTieuBaoHieu: n(values.tongSoPhaoTieuBaoHieu),
        tongSoDeKe: n(values.tongSoDeKe),
        tongChieuDaiDeKe: n(values.tongChieuDaiDeKe),
        tongSoDenBienDangTieu: n(values.tongSoDenBienDangTieu),
        quantityBenPhao: n(values.quantityBenPhao),
        quantityKhuNeoDau: n(values.quantityKhuNeoDau),
        quantityKhuChuyenTai: n(values.quantityKhuChuyenTai),
        cacKhuNuocKhac: (values.cacKhuNuocKhac as string) || undefined,
        remarks: (values.remarks as string) || undefined,
      };
      const res = await import('./api').then((m) => m.updateCangBien(payload));
      toast.success('Cập nhật thành công');
      if (window.parent && (window.parent as any).kchtDetailCache) {
        (window.parent as any).kchtDetailCache[selectedRecord.id] = res;
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
        search: search || undefined,
        province: filterTinh || undefined,
        portStatus: filterStatus,
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
  }, [page, pageSize, search, filterTinh, filterStatus]);

  useEffect(() => { if (!isIframeModal) void fetchData(); }, [fetchData, isIframeModal]);

  const handleDelete = useCallback((record: CangBienResponse) => {
    setDeleteTarget(record);
    setDeleteConfirmText('');
    setDeleteModalVisible(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    if (deleteConfirmText !== deleteTarget.portName) {
      toast.error('Tên cảng biển không khớp, vui lòng thử lại');
      return;
    }
    try {
      await deleteCangBien(deleteTarget.id);
      toast.success('Xóa thành công');
      setDeleteModalVisible(false);
      setDeleteTarget(null);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  }, [deleteTarget, deleteConfirmText, fetchData]);

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
            fetchStatusCounts();
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Phê duyệt thất bại';
            toast.error(msg);
          }
        },
      });
    },
    [fetchData, fetchStatusCounts],
  );

  const handleReject = useCallback(async () => {
    if (!rejectTarget) return;
    if (rejectReason.trim().length < 10) {
      toast.warning('Lý do từ chối tối thiểu 10 ký tự');
      return;
    }
    try {
      await rejectCangBien(rejectTarget.id, rejectReason.trim());
      toast.success('Từ chối thành công');
      setRejectModalVisible(false);
      setRejectReason('');
      setRejectTarget(null);
      fetchData();
      fetchStatusCounts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
    }
  }, [rejectTarget, rejectReason, fetchData, fetchStatusCounts]);

  const historyHandler = useCallback(async (record: CangBienResponse) => {
    try {
      setLoadingHistory(true);
      setSelectedRecord(record);
      setHistoryModalVisible(true);
      const { fetchportHistory } = await import('./api');
      const histData = await fetchportHistory(record.id, { page: 0, size: 200 });
      setHistoryRecords(histData.changeHistory || []);
    } catch (err) {
      toast.error('Không thể tải lịch sử thay đổi');
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // ── rowActions callback ──────────────────────────────────────────
  const rowActions = useCallback(
    (record: CangBienResponse) => {
      const actions: any[] = [
        {
          key: 'view',
          label: 'Xem chi tiết',
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
      if (hasPerm?.('Port:update'))
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
                id: data.id,
                portCode: data.portCode,
                portName: data.portName,
                province: data.province || undefined,
                  khaNangTiepNhan: data.khaNangTiepNhan != null ? data.khaNangTiepNhan : undefined,
                  orgUnitId: data.orgUnitId || undefined,
                portGroup: data.portGroup != null ? data.portGroup : undefined,
                bieuTuongId: data.bieuTuongId || undefined,
                diaDiemChiTiet: data.diaDiemChiTiet || undefined,
                phanCap: data.phanCap != null ? data.phanCap : undefined,
                heQuyChieu: data.heQuyChieu != null ? data.heQuyChieu : undefined,
                quyTacHienThi: data.quyTacHienThi != null ? data.quyTacHienThi : undefined,
                phamViVungNuoc: data.phamViVungNuoc || undefined,
                tongSoBenCang: data.tongSoBenCang != null ? data.tongSoBenCang : undefined,
                tongSoKhuNeoDauChuyenTai: data.tongSoKhuNeoDauChuyenTai != null ? data.tongSoKhuNeoDauChuyenTai : undefined,
                tongSoTuyenLuongCongCong: data.tongSoTuyenLuongCongCong != null ? data.tongSoTuyenLuongCongCong : undefined,
                tongSoTuyenLuongChuyenDung: data.tongSoTuyenLuongChuyenDung != null ? data.tongSoTuyenLuongChuyenDung : undefined,
                tongChieuDaiLuongCongCong: data.tongChieuDaiLuongCongCong != null ? data.tongChieuDaiLuongCongCong : undefined,
                tongChieuDaiLuongChuyenDung: data.tongChieuDaiLuongChuyenDung != null ? data.tongChieuDaiLuongChuyenDung : undefined,
                tongSoPhaoTieuBaoHieu: data.tongSoPhaoTieuBaoHieu != null ? data.tongSoPhaoTieuBaoHieu : undefined,
                tongSoDeKe: data.tongSoDeKe != null ? data.tongSoDeKe : undefined,
                tongChieuDaiDeKe: data.tongChieuDaiDeKe != null ? data.tongChieuDaiDeKe : undefined,
                tongSoDenBienDangTieu: data.tongSoDenBienDangTieu != null ? data.tongSoDenBienDangTieu : undefined,
                quantityBenPhao: data.quantityBenPhao != null ? data.quantityBenPhao : undefined,
                quantityKhuNeoDau: data.quantityKhuNeoDau != null ? data.quantityKhuNeoDau : undefined,
                quantityKhuChuyenTai: data.quantityKhuChuyenTai != null ? data.quantityKhuChuyenTai : undefined,
                cacKhuNuocKhac: data.cacKhuNuocKhac || undefined,
                remarks: data.remarks || undefined,
                gisLocation: {
                  loaiHinhHoc: data.loaiHinhHoc || 'POINT',
                  toaDo: data.toaDo || '',
                  bieuTuongId: data.bieuTuongId,
                },
              });
              setUpdateModalVisible(true);
            } catch (err) {
              toast.error('Không thể tải thông tin chỉnh sửa cảng biển');
            } finally {
              setIsLoading(false);
            }
          },
        });
      if (hasPerm?.('Port:approve') && record.portStatus === 'CHO_PHE_DUYET') {
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
          onClick: () => { setRejectTarget(record); setRejectReason(''); setRejectModalVisible(true); },
        });
      }
      if (hasPerm?.('Port:delete'))
        actions.push({
          key: 'delete',
          label: 'Xóa',
          icon: <DeleteOutlined />,
          danger: true,
          onClick: () => handleDelete(record),
        });
      actions.push({
        key: 'history',
        label: 'Lịch sử',
        icon: <HistoryOutlined />,
        onClick: () => historyHandler(record),
      });
      return actions;
    },
    [hasPerm, updateForm, handleApprove, handleDelete, historyHandler, setRejectTarget, setRejectReason, setRejectModalVisible],
  );

  // ── Columns (DataTable format) ───────────────────────────────────
  const columns: any = useMemo(
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
      {
        key: 'portCode',
        label: 'Mã cảng',
        dataIndex: 'portCode',
        width: 160,
        render: (portCode: string) => <Tag color="cyan">{portCode}</Tag>,
      },
      {
        key: 'portName',
        label: 'Tên cảng',
        dataIndex: 'portName',
        width: 250,
        ellipsis: true,
      },
      {
        key: 'province',
        label: 'Tỉnh/TP',
        dataIndex: 'province',
        width: 150,
        render: (v: string | null) => v || '—',
      },
      {
        key: 'portStatus',
        label: 'Trạng thái',
        dataIndex: 'portStatus',
        width: 160,
        render: (v: string | null) => renderPortStatusBadge(v),
      },
      {
        key: 'updatedAt',
        label: 'Ngày cập nhật',
        dataIndex: 'updatedAt',
        width: 180,
        render: (v: string | null) => formatDate(v),
      },
    ],
    [page, pageSize],
  );

  // ── Filter fields ────────────────────────────────────────────────
  const filterFields = useMemo(
    () => [
      {
        key: 'search',
        type: 'search' as const,
        label: 'Tìm kiếm',
        placeholder: 'Tìm theo mã, tên cảng biển...',
      },
      {
        key: 'province',
        type: 'select' as const,
        label: 'Tỉnh/Thành phố',
        placeholder: 'Chọn tỉnh/thành phố',
        options: VIETNAM_PROVINCES.map((p) => ({ value: p, label: p })),
      },
    ],
    [],
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
                    onClick: () => {
                      if (createForm.resetFields) createForm.resetFields();
                      createForm.setFieldsValue({ approvalStatus: 'CHO_PHE_DUYET' });
                      setCreateModalVisible(true);
                      setCoords([]);
                      setInfras([]);
                      setFileList([]);
                      // Backend sẽ tự động sinh mã cảng
                    },
                  }
                : null,
            ].filter(Boolean) as any}
          />

          <FilterBar
            fields={filterFields}
            onSearch={(values) => {
              setSearch(values.search || '');
              setFilterTinh(values.province || '');
              setFilterStatus(values.operationalStatus || undefined);
              setActiveStatusTab(values.portStatus || '');
              setPage(1);
            }}
            onReset={() => {
              setSearch('');
              setFilterTinh('');
              setFilterStatus(undefined);
              setActiveStatusTab('');
              setPage(1);
            }}
          />

          <div
            style={{
              ...cardStyle,
              marginBottom: 4,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '8px 16px',
            }}
          >
            <StatusTabs
              tabs={[
                { key: 'all', label: 'Tất cả', count: total || 0, color: actionPrimary, active: !activeStatusTab },
                { key: 'NHAP', label: 'Nháp', count: statusCounts.NHAP || 0, color: statusDraft, active: activeStatusTab === 'NHAP' },
                { key: 'CHO_PHE_DUYET', label: 'Chờ duyệt', count: statusCounts.CHO_PHE_DUYET || 0, color: statusAttention, active: activeStatusTab === 'CHO_PHE_DUYET' },
                { key: 'DA_PHE_DUYET', label: 'Đã duyệt', count: statusCounts.DA_PHE_DUYET || 0, color: statusOperational, active: activeStatusTab === 'DA_PHE_DUYET' },
                { key: 'TU_CHOI', label: 'Từ chối', count: statusCounts.TU_CHOI || 0, color: statusCritical, active: activeStatusTab === 'TU_CHOI' },
                { key: 'TAM_NGUNG', label: 'Tạm ngừng', count: statusCounts.TAM_NGUNG || 0, color: statusAttention, active: activeStatusTab === 'TAM_NGUNG' },
              ]}
              onChange={(key) => {
                setActiveStatusTab(key === 'all' ? '' : key);
                setFilterStatus(key === 'all' ? undefined : key);
                setPage(1);
              }}
            />
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
                  scroll={{ x: 1400 }}
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
          onCancel={() => { setCreateModalVisible(false); setCoords([]); setInfras([]); setFileList([]); }}
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
            <Form.Item name="action" hidden><Input /></Form.Item>
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
                            rules={[
                              { max: 20, message: 'Mã cảng tối đa 20 ký tự' },
                            ]}
                          >
                            <Input
                              placeholder="Nhập mã hoặc để trống để tự sinh"
                              maxLength={20}
                              style={inputStyle}
                              onBlur={async (e) => {
                                const code = e.target.value.trim();
                                if (!code) return;
                                try {
                                  const res = await fetchCangBienList({ portCode: code, size: 1 });
                                  if (res.content?.length > 0) {
                                    toast.warning(`Mã cảng "${code}" đã tồn tại`);
                                  }
                                } catch {}
                              }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="portName"
                            {...labelProps('Tên cảng *')}
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
                            name="area"
                            {...labelProps('Diện tích (km²)')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={0.01} precision={2} placeholder="VD: 23.50" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="portGroup"
                            {...labelProps('Nhóm cảng biển')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={1} step={1} precision={0} placeholder="VD: 1" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="diaDiemChiTiet"
                            {...labelProps('Địa điểm chi tiết')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input placeholder="VD: Xã Đình Vũ, Quận Hải An" maxLength={500} style={inputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="phanCap"
                            {...labelProps('Phân cấp')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={1} step={1} precision={0} placeholder="VD: 1" style={numberInputStyle} />
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
                      <Row gutter={16}>
                        <Col span={24}>
                          <Form.Item name="waterAreaScope" {...labelProps('Phạm vi vùng nước')} style={{ marginBottom: spaceFormField }}>
                            <Input.TextArea rows={2} placeholder="Mô tả phạm vi vùng nước" maxLength={2000} />
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
                        <Col span={12}>
                          <Form.Item
                            name="phamViVungNuoc"
                            {...labelProps('Phạm vi vùng nước')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input.TextArea rows={2} placeholder="Mô tả phạm vi vùng nước cảng biển" maxLength={2000} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="tongSoBenCang"
                            {...labelProps('Tổng bến cảng')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="tongSoKhuNeoDauChuyenTai"
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
                            name="tongSoTuyenLuongCongCong"
                            {...labelProps('Tuyến luồng công cộng')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="tongSoTuyenLuongChuyenDung"
                            {...labelProps('Tuyến luồng chuyên dùng')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="tongChieuDaiLuongCongCong"
                            {...labelProps('Dài luồng công cộng (m)')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="tongChieuDaiLuongChuyenDung"
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
                            name="tongSoPhaoTieuBaoHieu"
                            {...labelProps('Phao tiêu báo hiệu')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="tongSoDeKe"
                            {...labelProps('Tổng đê kè')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="tongChieuDaiDeKe"
                            {...labelProps('Dài đê kè (m)')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="tongSoDenBienDangTieu"
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
                            name="quantityBenPhao"
                            {...labelProps('Số bến phao')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="quantityKhuNeoDau"
                            {...labelProps('Số khu neo đậu')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="quantityKhuChuyenTai"
                            {...labelProps('Số khu chuyển tải')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="cacKhuNuocKhac"
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
                  label: 'GIS',
                  children: (
                    <>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item name="coordinateSystem" {...labelProps('Hệ quy chiếu')} style={{ marginBottom: spaceFormField }}>
                            <Select placeholder="WGS-84" options={[
                              { value: 1, label: 'WGS-84' }, { value: 2, label: 'VN-2000' }, { value: 3, label: 'Khác' }
                            ]} style={selectStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="displayRule" {...labelProps('Quy tắc hiển thị')} style={{ marginBottom: spaceFormField }}>
                            <InputNumber min={0} step={1} placeholder="VD: 1" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </>
                  ),
                },
                {
                  key: 'location',
                  label: 'Vị trí',
                  children: (
                    <>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="loaiHinhHoc"
                            {...labelProps('Loại đối tượng *')}
                            style={{ marginBottom: spaceFormField }}
                            rules={[{ required: true, message: 'Loại đối tượng không được để trống' }]}
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
                            name="bieuTuongId"
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
                                  <Select.Option key={sym.id} value={sym.id} label={`${sym.name} (${(sym as any).code || ''})`}>
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
                                      {sym.name} ({(sym as any).code || ''})
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
                            name="heQuyChieu"
                            {...labelProps('Hệ quy chiếu')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber
                              min={0}
                              step={1}
                              precision={0}
                              placeholder="4326"
                              style={numberInputStyle}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="quyTacHienThi"
                            {...labelProps('Quy tắc hiển thị')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={24}>
                          <Form.Item
                            name="toaDo"
                            {...labelProps('Tọa độ (WKT)')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input placeholder="VD: POINT(106.7 20.9)" style={inputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={24}>
                          <Form.Item name="gisLocation" style={{ marginBottom: spaceFormField }}>
                            <GisLocationSelector defaultGeometryType={createLoaiHinhHoc} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </>
                   ),
                 },
                {
                  key: 'gps',
                  label: 'Tọa độ GPS',
                  children: (
                    <>
                      {coords.map((coord, idx) => (
                        <Row key={idx} gutter={8} style={{ marginBottom: 8 }}>
                          <Col span={10}>
                            <InputNumber placeholder="Vĩ độ" value={coord.latitude} min={-90} max={90} step={0.000001}
                              onChange={(v) => updateCoord(idx, 'latitude', v)} style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                          </Col>
                          <Col span={10}>
                            <InputNumber placeholder="Kinh độ" value={coord.longitude} min={-180} max={180} step={0.000001}
                              onChange={(v) => updateCoord(idx, 'longitude', v)} style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                          </Col>
                          <Col span={4}>
                            <Button danger icon={<DeleteOutlined />} onClick={() => removeCoord(idx)}
                              style={{ borderRadius: radiusPill, height: 40 }} />
                          </Col>
                        </Row>
                      ))}
                      <Button type="dashed" icon={<PlusOutlined />} onClick={addCoord} block
                        style={{ borderRadius: radiusPill, height: 40 }}>
                        Thêm tọa độ
                      </Button>
                    </>
                  ),
                },
                {
                  key: 'infra',
                  label: 'Công trình KCHT',
                  children: (
                    <>
                      {infras.map((infra, idx) => (
                        <Row key={idx} gutter={8} style={{ marginBottom: 8 }}>
                          <Col span={4}><InputNumber placeholder="STT" value={infra.stt} min={1}
                            onChange={(v) => updateInfra(idx, 'stt', v)} style={{ width: '100%', borderRadius: radiusPill, height: 40 }} /></Col>
                          <Col span={10}><Input placeholder="Tên công trình" value={infra.name}
                            onChange={(e) => updateInfra(idx, 'name', e.target.value)} style={{ borderRadius: radiusPill, height: 40 }} /></Col>
                          <Col span={6}><InputNumber placeholder="Số lượng" value={infra.qty} min={1}
                            onChange={(v) => updateInfra(idx, 'qty', v)} style={{ width: '100%', borderRadius: radiusPill, height: 40 }} /></Col>
                          <Col span={4}><Button danger icon={<DeleteOutlined />} onClick={() => removeInfra(idx)}
                            style={{ borderRadius: radiusPill, height: 40 }} /></Col>
                        </Row>
                      ))}
                      <Button type="dashed" icon={<PlusOutlined />} onClick={addInfra} block
                        style={{ borderRadius: radiusPill, height: 40 }}>
                        Thêm công trình
                      </Button>
                    </>
                  ),
                },
                {
                  key: 'attachments',
                  label: 'File đính kèm',
                  children: (
                    <>
                      <Upload
                        multiple
                        showUploadList={{ showDownloadIcon: true, showRemoveIcon: true }}
                        beforeUpload={(file) => {
                          const isValidType = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/jpeg', 'image/png', 'image/tiff'].includes(file.type);
                          if (!isValidType) { toast.error('Định dạng không hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF'); return Upload.LIST_IGNORE; }
                          if (file.size > 20 * 1024 * 1024) { toast.error('File tối đa 20MB'); return Upload.LIST_IGNORE; }
                          if (fileList.length >= 10) { toast.error('Tối đa 10 file'); return Upload.LIST_IGNORE; }
                          setFileList([...fileList, file]);
                          return false; // prevent auto-upload
                        }}
                        onRemove={(file) => { setFileList(fileList.filter(f => f.uid !== file.uid)); }}
                        fileList={fileList}
                      >
                        <Button icon={<UploadOutlined />} style={{ borderRadius: radiusPill, height: 40 }}>
                          Chọn file (PDF, DOC, XLS, JPG, PNG, TIFF, &le;20MB, &le;10 files)
                        </Button>
                      </Upload>
                    </>
                  ),
                },
              ]}
             />

            <Form.Item style={{ marginTop: 24, marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button
                  onClick={() => setCreateModalVisible(false)}
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
                <Button onClick={() => handleCreateDraft()} style={{ borderRadius: radiusPill, height: 40 }}>
                  Lưu tạm
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  onClick={() => { createForm.setFieldsValue({ action: 'submit' }); }}
                  style={{
                    borderRadius: radiusPill,
                    height: 40,
                    fontSize: fontSizeMd,
                    background: actionPrimary,
                    borderColor: actionPrimary,
                  }}
                >
                  Tạo cảng biển
                </Button>
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
              : selectedRecord
                ? `Chỉnh sửa: ${selectedRecord.portCode} — ${selectedRecord.portName}`
                : 'Chỉnh sửa cảng biển'
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
                            name="area"
                            {...labelProps('Diện tích (km²)')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={0.01} precision={2} placeholder="VD: 23.50" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="portGroup"
                            {...labelProps('Nhóm cảng biển')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={1} step={1} precision={0} placeholder="VD: 1" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="diaDiemChiTiet"
                            {...labelProps('Địa điểm chi tiết')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input placeholder="VD: Xã Đình Vũ, Quận Hải An" maxLength={500} style={inputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="phanCap"
                            {...labelProps('Phân cấp')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={1} step={1} precision={0} placeholder="VD: 1" style={numberInputStyle} />
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
                        <Col span={12}>
                          <Form.Item
                            name="phamViVungNuoc"
                            {...labelProps('Phạm vi vùng nước')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input.TextArea rows={2} placeholder="Mô tả phạm vi vùng nước cảng biển" maxLength={2000} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="tongSoBenCang"
                            {...labelProps('Tổng bến cảng')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="tongSoKhuNeoDauChuyenTai"
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
                            name="tongSoTuyenLuongCongCong"
                            {...labelProps('Tuyến luồng công cộng')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="tongSoTuyenLuongChuyenDung"
                            {...labelProps('Tuyến luồng chuyên dùng')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="tongChieuDaiLuongCongCong"
                            {...labelProps('Dài luồng công cộng (m)')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="tongChieuDaiLuongChuyenDung"
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
                            name="tongSoPhaoTieuBaoHieu"
                            {...labelProps('Phao tiêu báo hiệu')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="tongSoDeKe"
                            {...labelProps('Tổng đê kè')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="tongChieuDaiDeKe"
                            {...labelProps('Dài đê kè (m)')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="tongSoDenBienDangTieu"
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
                            name="quantityBenPhao"
                            {...labelProps('Số bến phao')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="quantityKhuNeoDau"
                            {...labelProps('Số khu neo đậu')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="quantityKhuChuyenTai"
                            {...labelProps('Số khu chuyển tải')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="cacKhuNuocKhac"
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
                            name="loaiHinhHoc"
                            {...labelProps('Loại đối tượng *')}
                            style={{ marginBottom: spaceFormField }}
                            rules={[{ required: true, message: 'Loại đối tượng không được để trống' }]}
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
                            name="bieuTuongId"
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
                                  <Select.Option key={sym.id} value={sym.id} label={`${sym.name} (${(sym as any).code || ''})`}>
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
                                      {sym.name} ({(sym as any).code || ''})
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
                            name="heQuyChieu"
                            {...labelProps('Hệ quy chiếu')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber
                              min={0}
                              step={1}
                              precision={0}
                              placeholder="4326"
                              style={numberInputStyle}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="quyTacHienThi"
                            {...labelProps('Quy tắc hiển thị')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={24}>
                          <Form.Item
                            name="toaDo"
                            {...labelProps('Tọa độ (WKT)')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input placeholder="VD: POINT(106.7 20.9)" style={inputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={24}>
                          <Form.Item name="gisLocation" style={{ marginBottom: spaceFormField }}>
                            <GisLocationSelector defaultGeometryType={updateLoaiHinhHoc} />
                          </Form.Item>
                        </Col>
                      </Row>
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
                ? `Chi tiết cảng biển: ${selectedRecord.portCode} — ${selectedRecord.portName}`
                : 'Chi tiết cảng biển'
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
              : undefined,
          }}
        >
          {selectedRecord && (
            <div>
              <Row gutter={[16, 16]}>
                <Col span={16}>
                  <Card title="Thông tin chung" size="small" style={{ height: '100%' }}>
                    <Row gutter={[12, 12]}>
                      <Col span={12}>
                        <Typography.Text strong>Mã cảng:</Typography.Text>
                        <br />
                        <Tag color="cyan">{selectedRecord.portCode}</Tag>
                      </Col>
                      <Col span={12}>
                        <Typography.Text strong>Tên cảng:</Typography.Text>
                        <br />
                        <Typography.Text>{selectedRecord.portName}</Typography.Text>
                      </Col>
                      <Col span={12} style={{ marginTop: 8 }}>
                        <Typography.Text strong>Đơn vị quản lý:</Typography.Text>
                        <br />
                        <Typography.Text>
                          {selectedRecord.orgUnitId
                            ? (orgUnits.find((o) => o.id === selectedRecord.orgUnitId)?.name ||
                                selectedRecord.orgUnitId)
                            : '—'}
                        </Typography.Text>
                      </Col>
                      <Col span={12} style={{ marginTop: 8 }}>
                        <Typography.Text strong>Tỉnh/thành phố:</Typography.Text>
                        <br />
                        <Typography.Text>{selectedRecord.province || '—'}</Typography.Text>
                      </Col>
                      <Col span={12} style={{ marginTop: 8 }}>
                        <Typography.Text strong>Địa điểm chi tiết:</Typography.Text>
                        <br />
                        <Typography.Text>{selectedRecord.diaDiemChiTiet || '—'}</Typography.Text>
                      </Col>
                      <Col span={12} style={{ marginTop: 8 }}>
                        <Typography.Text strong>Phân cấp:</Typography.Text>
                        <br />
                        <Typography.Text>{selectedRecord.phanCap ?? '—'}</Typography.Text>
                      </Col>
                      <Col span={12} style={{ marginTop: 8 }}>
                        <Typography.Text strong>Nhóm cảng biển:</Typography.Text>
                        <br />
                        <Typography.Text>
                          {selectedRecord.portGroup
                            ? 'Nhóm ' + selectedRecord.portGroup
                            : '—'}
                        </Typography.Text>
                      </Col>
                    </Row>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card title="Thông số" size="small" style={{ height: '100%' }}>
                    <Typography.Text strong style={{ marginTop: 8, display: 'block' }}>
                      Phê duyệt:
                    </Typography.Text>
                    {selectedRecord.approvalStatus && (
                      <Tag color={trangThaiPheDuyetBadge(selectedRecord.approvalStatus).color}>
                        {trangThaiPheDuyetBadge(selectedRecord.approvalStatus).label}
                      </Tag>
                    )}
                  </Card>
                </Col>
                <Col span={24}>
                  <Card title="Thống kê tổng hợp" size="small">
                    <Row gutter={[12, 12]}>
                      <Col span={8}>
                        <Typography.Text strong>Phạm vi vùng nước:</Typography.Text>
                        <br />
                        <Typography.Text>{selectedRecord.phamViVungNuoc || '—'}</Typography.Text>
                      </Col>
                      <Col span={4}>
                        <Typography.Text strong>Tổng số bến cảng:</Typography.Text>
                        <br />
                        <Typography.Text>{selectedRecord.tongSoBenCang ?? '—'}</Typography.Text>
                      </Col>
                      <Col span={4}>
                        <Typography.Text strong>Khu neo đậu, chuyển tải:</Typography.Text>
                        <br />
                        <Typography.Text>
                          {selectedRecord.tongSoKhuNeoDauChuyenTai ?? '—'}
                        </Typography.Text>
                      </Col>
                    </Row>
                    <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
                      <Col span={6}>
                        <Typography.Text strong>Tuyến luồng công cộng:</Typography.Text>
                        <br />
                        <Typography.Text>
                          {selectedRecord.tongSoTuyenLuongCongCong ?? '—'} (
                          {selectedRecord.tongChieuDaiLuongCongCong != null
                            ? selectedRecord.tongChieuDaiLuongCongCong + 'm'
                            : '—'}
                          )
                        </Typography.Text>
                      </Col>
                      <Col span={6}>
                        <Typography.Text strong>Tuyến luồng chuyên dùng:</Typography.Text>
                        <br />
                        <Typography.Text>
                          {selectedRecord.tongSoTuyenLuongChuyenDung ?? '—'} (
                          {selectedRecord.tongChieuDaiLuongChuyenDung != null
                            ? selectedRecord.tongChieuDaiLuongChuyenDung + 'm'
                            : '—'}
                          )
                        </Typography.Text>
                      </Col>
                      <Col span={6}>
                        <Typography.Text strong>Phao tiêu báo hiệu:</Typography.Text>
                        <br />
                        <Typography.Text>
                          {selectedRecord.tongSoPhaoTieuBaoHieu ?? '—'}
                        </Typography.Text>
                      </Col>
                      <Col span={6}>
                        <Typography.Text strong>Đê kè:</Typography.Text>
                        <br />
                        <Typography.Text>
                          {selectedRecord.tongSoDeKe ?? '—'} (
                          {selectedRecord.tongChieuDaiDeKe != null
                            ? selectedRecord.tongChieuDaiDeKe + 'm'
                            : '—'}
                          )
                        </Typography.Text>
                      </Col>
                    </Row>
                    <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
                      <Col span={4}>
                        <Typography.Text strong>Đèn biển, đăng tiêu:</Typography.Text>
                        <br />
                        <Typography.Text>
                          {selectedRecord.tongSoDenBienDangTieu ?? '—'}
                        </Typography.Text>
                      </Col>
                      <Col span={4}>
                        <Typography.Text strong>Bến phao:</Typography.Text>
                        <br />
                        <Typography.Text>{selectedRecord.quantityBenPhao ?? '—'}</Typography.Text>
                      </Col>
                      <Col span={4}>
                        <Typography.Text strong>Khu neo đậu:</Typography.Text>
                        <br />
                        <Typography.Text>{selectedRecord.quantityKhuNeoDau ?? '—'}</Typography.Text>
                      </Col>
                      <Col span={4}>
                        <Typography.Text strong>Khu chuyển tải:</Typography.Text>
                        <br />
                        <Typography.Text>{selectedRecord.quantityKhuChuyenTai ?? '—'}</Typography.Text>
                      </Col>
                      <Col span={8}>
                        <Typography.Text strong>Các khu nước khác:</Typography.Text>
                        <br />
                        <Typography.Text>{selectedRecord.cacKhuNuocKhac || '—'}</Typography.Text>
                      </Col>
                    </Row>
                    <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
                      <Col span={24}>
                        <Typography.Text strong>Ghi chú:</Typography.Text>
                        <br />
                        <Typography.Text>{selectedRecord.remarks || '—'}</Typography.Text>
                      </Col>
                    </Row>
                  </Card>
                </Col>
                <Col span={16}>
                  <Card title="Thông tin địa lý & GIS" size="small" style={{ height: '100%' }}>
                    <Row gutter={[12, 12]}>
                      <Col span={8}>
                        <Typography.Text strong>Vĩ độ:</Typography.Text>
                        <br />
                        <Typography.Text>
                          {selectedRecord.latitude != null
                            ? selectedRecord.latitude.toFixed(6)
                            : '—'}
                        </Typography.Text>
                      </Col>
                      <Col span={8}>
                        <Typography.Text strong>Kinh độ:</Typography.Text>
                        <br />
                        <Typography.Text>
                          {selectedRecord.longitude != null
                            ? selectedRecord.longitude.toFixed(6)
                            : '—'}
                        </Typography.Text>
                      </Col>
                      <Col span={4}>
                        <Typography.Text strong>Hệ quy chiếu:</Typography.Text>
                        <br />
                        <Typography.Text>{selectedRecord.heQuyChieu ?? '—'}</Typography.Text>
                      </Col>
                      <Col span={4}>
                        <Typography.Text strong>Quy tắc hiển thị:</Typography.Text>
                        <br />
                        <Typography.Text>{selectedRecord.quyTacHienThi ?? '—'}</Typography.Text>
                      </Col>
                    </Row>
                    <Row gutter={[12, 12]} style={{ marginTop: 8 }}>
                      <Col span={24}>
                        <Typography.Text strong>Biểu tượng bản đồ:</Typography.Text>
                        <br />
                        <Typography.Text>
                          {selectedRecord.bieuTuongId
                            ? (symbols.find((s) => s.id === selectedRecord.bieuTuongId)?.name ||
                                selectedRecord.bieuTuongId)
                            : '—'}
                        </Typography.Text>
                      </Col>
                    </Row>
                  </Card>
                </Col>
                <Col span={24}>
                  <Card title="Tài liệu đính kèm" size="small">
                    {detailFiles.length === 0 ? (
                      <span style={{ color: textTertiary }}>Không có tài liệu đính kèm</span>
                    ) : (
                      <div>
                        {detailFiles.map((f) => (
                          <div
                            key={f.id}
                            style={{
                              marginBottom: 8,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div>
                              <Typography.Text strong>{f.fileName}</Typography.Text>
                              <br />
                              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                {f.fileSize} bytes —{' '}
                                {new Date(f.createdAt).toLocaleString('vi-VN')}
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
                      <Descriptions.Item label="Người tạo">
                        {selectedRecord.createdBy || '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Ngày tạo">
                        {selectedRecord.createdAt
                          ? new Date(selectedRecord.createdAt).toLocaleString('vi-VN')
                          : '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Cập nhật bởi">
                        {selectedRecord.updatedBy || '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Ngày cập nhật">
                        {selectedRecord.updatedAt
                          ? new Date(selectedRecord.updatedAt).toLocaleString('vi-VN')
                          : '—'}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>
              </Row>

              <div style={{ marginTop: 24, textAlign: 'right' }}>
                <Space>
                  <Button
                    icon={<UploadOutlined />}
                    onClick={() => {
                      setDetailModalVisible(false);
                      setUploadModalVisible(true);
                    }}
                    style={{
                      borderRadius: radiusPill,
                      height: 40,
                      fontSize: fontSizeMd,
                      borderColor: borderDefault,
                      color: textSecondary,
                    }}
                  >
                                    <div style={{ marginTop: 24, textAlign: 'right' }}>
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
                </div>
                  </Button>
                </Space>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* ── History Modal ──────────────────────────────────────────── */}
      <Modal
        title={
          selectedRecord
            ? `Lịch sử thay đổi: ${selectedRecord.portCode} — ${selectedRecord.portName}`
            : 'Lịch sử thay đổi'
        }
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={[
          <Button
            key="close"
            onClick={() => setHistoryModalVisible(false)}
            style={{
              borderRadius: radiusPill,
              height: 40,
              fontSize: fontSizeMd,
              borderColor: borderDefault,
              color: textSecondary,
            }}
          >
            Đóng
          </Button>,
        ]}
        width={700}
      >
        {loadingHistory ? (
          <LoadingSkeleton rows={5} />
        ) : historyRecords.length === 0 ? (
          <EmptyState description="Chưa có thay đổi nào được ghi nhận." />
        ) : (
          <div
            style={{
              borderLeft: `2px solid ${borderDefault}`,
              paddingLeft: 24,
              marginLeft: 8,
              marginTop: 16,
              maxHeight: '60vh',
              overflowY: 'auto',
            }}
          >
            {historyRecords
              .sort(
                (a, b) =>
                  new Date(b.changedAt || b.createdAt).getTime() -
                  new Date(a.changedAt || a.createdAt).getTime(),
              )
              .map((record: any, idx: number) => {
                return (
                  <div
                    key={record.id || idx}
                    style={{
                      position: 'relative',
                      marginBottom: 24,
                      paddingBottom: 12,
                      borderBottom:
                        idx < historyRecords.length - 1
                          ? `1px solid ${borderDefault}`
                          : 'none',
                    }}
                  >
                    {/* Timeline dot */}
                    <div
                      style={{
                        position: 'absolute',
                        left: -29,
                        top: 4,
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: actionPrimary,
                        border: `2px solid ${surfaceCard}`,
                        boxShadow: `0 0 0 2px ${actionPrimary}`,
                      }}
                    />

                    {/* Timestamp */}
                    <div style={{ marginBottom: 4 }}>
                      <Typography.Text strong>
                        {record.changedAt || record.createdAt
                          ? new Date(record.changedAt || record.createdAt).toLocaleString(
                              'vi-VN',
                            )
                          : '—'}
                      </Typography.Text>
                      {record.actionType && (
                        <Tag color="blue" style={{ marginLeft: 8 }}>
                          {record.actionType}
                        </Tag>
                      )}
                    </div>

                    {/* Actor */}
                    {record.changedBy && (
                      <div style={{ marginBottom: 4 }}>
                        <Typography.Text type="secondary">
                          Người thực hiện:{' '}
                        </Typography.Text>
                        <Typography.Text strong>{record.changedBy}</Typography.Text>
                      </div>
                    )}

                    {/* Field change */}
                    {(record.fieldName || record.fieldChanged) && (
                      <div style={{ marginBottom: 4 }}>
                        <Typography.Text type="secondary">
                          Trường thay đổi:{' '}
                        </Typography.Text>
                        <Typography.Text strong>
                          {translateFieldName(record.fieldName || record.fieldChanged)}
                        </Typography.Text>
                      </div>
                    )}

                    {/* Old/New value */}
                    {record.oldValue !== undefined && record.oldValue != null && (
                      <div style={{ marginBottom: 2 }}>
                        <Typography.Text
                          type="secondary"
                          style={{ textDecoration: 'line-through', color: statusCritical }}
                        >
                          cũ:{' '}
                          {translateValue(
                            record.fieldName || record.fieldChanged,
                            record.oldValue,
                          )}
                        </Typography.Text>
                      </div>
                    )}
                    {record.newValue !== undefined && record.newValue != null && (
                      <div>
                        <Typography.Text type="secondary">mới: </Typography.Text>
                        <Typography.Text style={{ color: statusOperational, fontWeight: fontWeightMedium }}>
                          {translateValue(
                            record.fieldName || record.fieldChanged,
                            record.newValue,
                          )}
                        </Typography.Text>
                      </div>
                    )}

                    {/* Reason */}
                    {record.reason && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: 8,
                          background: `${textTertiary}18`,
                          borderRadius: 4,
                        }}
                      >
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

      {/* ── Reject Modal ── */}
      <Modal
        title={rejectTarget ? `Từ chối cảng biển: ${rejectTarget.portCode} — ${rejectTarget.portName}` : 'Từ chối'}
        open={rejectModalVisible}
        onCancel={() => { setRejectModalVisible(false); setRejectReason(''); setRejectTarget(null); }}
        onOk={handleReject}
        okText="Xác nhận từ chối"
        cancelText="Hủy"
        okButtonProps={{ danger: true, disabled: rejectReason.trim().length < 10 }}
      >
        <div style={{ marginBottom: 12 }}>
          <Typography.Text>Lý do từ chối (tối thiểu 10 ký tự):</Typography.Text>
        </div>
        <Input.TextArea
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Nhập lý do từ chối..."
          maxLength={500}
          showCount
        />
        {rejectReason.trim().length > 0 && rejectReason.trim().length < 10 && (
          <Typography.Text type="danger" style={{ fontSize: 13 }}>
            Lý do từ chối tối thiểu 10 ký tự
          </Typography.Text>
        )}
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal
        title="Xác nhận xóa"
        open={deleteModalVisible}
        onCancel={() => { setDeleteModalVisible(false); setDeleteTarget(null); setDeleteConfirmText(''); }}
        onOk={handleDeleteConfirm}
        okText="Xóa"
        okType="danger"
        cancelText="Hủy"
        okButtonProps={{ disabled: deleteConfirmText !== deleteTarget?.portName }}
      >
        <p>Vui lòng nhập <strong>{deleteTarget?.portName}</strong> để xác nhận xóa cảng biển này.</p>
        <Input
          placeholder="Nhập tên cảng biển"
          value={deleteConfirmText}
          onChange={(e) => setDeleteConfirmText(e.target.value)}
          style={{ marginTop: 8 }}
        />
      </Modal>

      {selectedRecord && (
        <DocumentUploadModal
          entityType="port"
          entityId={selectedRecord.id}
          open={uploadModalVisible}
          onCancel={() => setUploadModalVisible(false)}
        />
      )}
    </>
  );
}

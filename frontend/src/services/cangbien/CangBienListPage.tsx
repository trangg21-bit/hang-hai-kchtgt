import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
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
  Tabs,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  HistoryOutlined,
  UploadOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  fetchCangBienList,
  deleteCangBien,
  approveCangBien,
  rejectCangBien,
  fetchCangBienById,
} from './api';
import { trangThaiHoatDongBadge, trangThaiPheDuyetBadge, TRANG_THAI_HOAT_DONG_OPTIONS } from './schema';
import type { CangBienResponse } from './types';
import toast from '../../components/ToastNotification';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import { organizationService } from '../../services/organizationService';
import { giayToApi } from '../../app/giayto/api';
import GiayToUploadModal from '../../app/giayto/GiayToUploadModal';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import { symbolService } from '../symbolService';
import type { Symbol } from '../symbolService';
import { VIETNAM_PROVINCES } from '../../types/common';
import { ScreenHeader, FilterBar, StatusTabs, DataTable } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import {
  statusOperational,
  statusCritical,
  statusAttention,
  actionPrimary,
  textSecondary,
  textTertiary,
  borderDefault,
  spaceMd,
  spaceSm,
  fontSizeSm,
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

// ── List Page ───────────────────────────────────────────────────────

export const translateFieldName = (fieldName: string): string => {
  const map: Record<string, string> = {
    maCang: 'Mã cảng biển',
    tenCang: 'Tên cảng biển',
    tinhThanhPho: 'Tỉnh/Thành phố',
    viDo: 'Vĩ độ',
    kinhDo: 'Kinh độ',
    dienTich: 'Diện tích (ha)',
    khaNangTiepNhan: 'Khả năng tiếp nhận',
    nhomCangBien: 'Nhóm cảng biển',
    maBen: 'Mã bến cảng',
    tenBen: 'Tên bến cảng',
    cangBienId: 'Cảng biển chủ',
    tuyenDuongThuy: 'Tuyến đường thủy',
    chieuRong: 'Chiều rộng (m)',
    loaiBen: 'Loại bến',
    doSauLuong: 'Độ sâu luồng (m)',
    maCau: 'Mã cầu cảng',
    tenCau: 'Tên cầu cảng',
    benCangId: 'Bến cảng chủ',
    chieuDai: 'Chiều dài (m)',
    taiTrong: 'Tải trọng (tấn)',
    loaiCau: 'Loại cầu',
    maCangCan: 'Mã cảng cạn',
    tenCangCan: 'Tên cảng cạn',
    viTri: 'Vị trí',
    dienTichDat: 'Diện tích đất (ha)',
    dienTichNuoc: 'Diện tích nước (ha)',
    nangLucThongQua: 'Năng lực thông qua',
    maVungNuoc: 'Mã vùng nước',
    tenVungNuoc: 'Tên vùng nước',
    viTriVungNuoc: 'Vị trí vùng nước',
    chieuDaiVungNuoc: 'Chiều dài vùng nước (m)',
    chieuRongVungNuoc: 'Chiều rộng vùng nước (m)',
    doSauVungNuoc: 'Độ sâu vùng nước (m)',
    trangThaiHoatDong: 'Trạng thái hoạt động',
    trangThaiPheDuyet: 'Trạng thái phê duyệt',
    orgUnitId: 'Đơn vị quản lý',
    congNangKhaiThac: 'Công năng khai thác',
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

export default function CangBienListPage() {
  const navigate = useNavigate();

  // ── Permission ──────────────────────────────────────────────────
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  // ── State ───────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [filterTinh, setFilterTinh] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<string | undefined>();
  const [activeStatusTab, setActiveStatusTab] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<CangBienResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

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
            const fileRes = await giayToApi.listByEntity('cang-bien', id, { page: 1, size: 20 });
            setDetailFiles(fileRes.data || []);
            setDetailModalVisible(true);
          } else if (action === 'edit') {
            updateForm.setFieldsValue({
              id: data.id,
              maCang: data.maCang,
              tenCang: data.tenCang,
              tinhThanhPho: data.tinhThanhPho || undefined,
              dienTich: data.dienTich != null ? data.dienTich : undefined,
              khaNangTiepNhan: data.khaNangTiepNhan != null ? data.khaNangTiepNhan : undefined,
              trangThaiHoatDong: data.trangThaiHoatDong || undefined,
              orgUnitId: data.orgUnitId || undefined,
              nhomCangBien: data.nhomCangBien != null ? data.nhomCangBien : undefined,
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
              soLuongBenPhao: data.soLuongBenPhao != null ? data.soLuongBenPhao : undefined,
              soLuongKhuNeoDau: data.soLuongKhuNeoDau != null ? data.soLuongKhuNeoDau : undefined,
              soLuongKhuChuyenTai: data.soLuongKhuChuyenTai != null ? data.soLuongKhuChuyenTai : undefined,
              cacKhuNuocKhac: data.cacKhuNuocKhac || undefined,
              ghiChu: data.ghiChu || undefined,
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
        return sym ? `${sym.name} (${sym.code})` : val;
      }
      if (['khongGianId', 'spatialId'].includes(fieldName)) {
        return 'Có tọa độ bản đồ';
      }
      if (fieldName === 'trangThaiPheDuyet') {
        const approvalMap: Record<string, string> = {
          CHO_PHE_DUYET: 'Chờ phê duyệt',
          DUOC_PHE_DUYET: 'Được phê duyệt',
          TU_CHOI: 'Từ chối',
        };
        return approvalMap[val.toUpperCase()] || val;
      }
      if (fieldName === 'trangThaiHoatDong') {
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
    const maCang = String(values.maCang).trim();
    const tenCang = String(values.tenCang).trim();
    if (!maCang) { toast.error('Mã cảng không được để trống'); return; }
    if (maCang.length > 50) { toast.error('Mã cảng tối đa 50 ký tự'); return; }
    if (!tenCang) { toast.error('Tên cảng không được để trống'); return; }
    if (tenCang.length > 255) { toast.error('Tên cảng tối đa 255 ký tự'); return; }

    const dienTich = values.dienTich as number;
    if (dienTich === undefined || dienTich === null || dienTich <= 0) {
      toast.error('Diện tích phải lớn hơn 0');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        maCang,
        tenCang,
        tinhThanhPho: (values.tinhThanhPho as string) || undefined,
        dienTich,
        khaNangTiepNhan: values.khaNangTiepNhan as number | undefined,
        trangThaiHoatDong: (values.trangThaiHoatDong as string) || undefined,
        trangThaiPheDuyet: (values.trangThaiPheDuyet as string) || 'CHO_PHE_DUYET',
        orgUnitId: (values.orgUnitId as string) || undefined,
        nhomCangBien: values.nhomCangBien ? Number(values.nhomCangBien) : undefined,
        bieuTuongId: (values.bieuTuongId as string) || undefined,
        diaDiemChiTiet: (values.diaDiemChiTiet as string) || undefined,
        phanCap: values.phanCap != null && !Number.isNaN(values.phanCap as number)
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
        soLuongBenPhao: values.soLuongBenPhao != null && !Number.isNaN(values.soLuongBenPhao as number)
          ? Number(values.soLuongBenPhao) : undefined,
        soLuongKhuNeoDau: values.soLuongKhuNeoDau != null && !Number.isNaN(values.soLuongKhuNeoDau as number)
          ? Number(values.soLuongKhuNeoDau) : undefined,
        soLuongKhuChuyenTai: values.soLuongKhuChuyenTai != null && !Number.isNaN(values.soLuongKhuChuyenTai as number)
          ? Number(values.soLuongKhuChuyenTai) : undefined,
        cacKhuNuocKhac: (values.cacKhuNuocKhac as string) || undefined,
        ghiChu: (values.ghiChu as string) || undefined,
      };
      await import('./api').then((m) => m.createCangBien(payload));
      toast.success('Tạo mới thành công — chờ phê duyệt');
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

  const handleFormFailed = (errorInfo: any) => {
    errorInfo.errorFields.forEach((field: any) => {
      toast.error(`${field.errors.join(', ')}`);
    });
  };

  const handleUpdateFinish = async (values: Record<string, unknown>) => {
    if (!selectedRecord) return;
    const dienTich = values.dienTich as number;
    if (dienTich !== undefined && dienTich != null && !Number.isNaN(dienTich) && dienTich <= 0) {
      toast.error('Diện tích phải lớn hơn 0');
      return;
    }

    setSubmitting(true);
    try {
      const n = (v: unknown): number | undefined =>
        v != null && !Number.isNaN(v as number) ? Number(v) : undefined;

      const payload = {
        id: selectedRecord.id,
        tenCang: (values.tenCang as string) || undefined,
        tinhThanhPho: (values.tinhThanhPho as string) || undefined,
        dienTich: values.dienTich as number | undefined,
        khaNangTiepNhan: values.khaNangTiepNhan as number | undefined,
        trangThaiHoatDong: (values.trangThaiHoatDong as string) || undefined,
        orgUnitId: (values.orgUnitId as string) || undefined,
        nhomCangBien: values.nhomCangBien ? Number(values.nhomCangBien) : undefined,
        bieuTuongId: (values.bieuTuongId as string) || null,
        diaDiemChiTiet: (values.diaDiemChiTiet as string) || undefined,
        phanCap: n(values.phanCap),
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
        soLuongBenPhao: n(values.soLuongBenPhao),
        soLuongKhuNeoDau: n(values.soLuongKhuNeoDau),
        soLuongKhuChuyenTai: n(values.soLuongKhuChuyenTai),
        cacKhuNuocKhac: (values.cacKhuNuocKhac as string) || undefined,
        ghiChu: (values.ghiChu as string) || undefined,
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
        tinhThanhPho: filterTinh || undefined,
        trangThaiHoatDong: filterStatus,
        trangThaiPheDuyet: filterApprovalStatus,
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
  }, [page, pageSize, search, filterTinh, filterStatus, filterApprovalStatus]);

  useEffect(() => { if (!isIframeModal) void fetchData(); }, [fetchData, isIframeModal]);

  const handleDelete = useCallback(
    async (record: CangBienResponse) => {
      confirm({
        title: 'Xác nhận xóa',
        icon: <ExclamationCircleOutlined />,
        content: `Bạn có chắc muốn xóa cảng biển "${record.tenCang}"?`,
        okText: 'Xóa',
        okType: 'danger',
        cancelText: 'Hủy',
        onOk: async () => {
          try {
            await deleteCangBien(record.id);
            toast.success('Xóa thành công');
            fetchData();
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Xóa thất bại';
            toast.error(msg);
          }
        },
      });
    },
    [fetchData],
  );

  const handleApprove = useCallback(
    (record: CangBienResponse) => {
      confirm({
        title: 'Xác nhận phê duyệt',
        icon: <ExclamationCircleOutlined />,
        content: `Phê duyệt cảng biển "${record.tenCang}"?`,
        okText: 'Phê duyệt',
        cancelText: 'Hủy',
        onOk: async () => {
          try {
            await approveCangBien(record.id);
            toast.success('Phê duyệt thành công');
            fetchData();
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Phê duyệt thất bại';
            toast.error(msg);
          }
        },
      });
    },
    [fetchData],
  );

  const handleReject = useCallback(
    async (record: CangBienResponse) => {
      const reason = window.prompt('Lý do từ chối (tối thiểu 10 ký tự):', '');
      if (reason === null || reason.length < 10) {
        if (reason != null) toast.error('Lý do từ chối tối thiểu 10 ký tự');
        return;
      }
      try {
        await rejectCangBien(record.id, reason);
        toast.success('Từ chối thành công');
        fetchData();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Từ chối thất bại';
        toast.error(msg);
      }
    },
    [fetchData],
  );

  const historyHandler = useCallback(async (record: CangBienResponse) => {
    try {
      setLoadingHistory(true);
      setSelectedRecord(record);
      setHistoryModalVisible(true);
      const { fetchCangBienHistory } = await import('./api');
      const histData = await fetchCangBienHistory(record.id, { page: 0, size: 200 });
      setHistoryRecords(histData.changeHistory || []);
    } catch (err) {
      toast.error('Không thể tải lịch sử thay đổi');
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const getOrgUnitName = useCallback(
    (orgUnitId: string | null): string => {
      if (!orgUnitId) return '—';
      const unit = orgUnits.find((o) => o.id === orgUnitId);
      return unit ? unit.name : orgUnitId.substring(0, 8) + '…';
    },
    [orgUnits],
  );

  const getNhomCangBienLabel = (val: number | null): string => {
    if (!val) return '—';
    return `Nhóm ${val}`;
  };

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
              const fileRes = await giayToApi.listByEntity('cang-bien', record.id, { page: 1, size: 20 });
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
      if (hasPerm?.('cangbien:update'))
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
                maCang: data.maCang,
                tenCang: data.tenCang,
                tinhThanhPho: data.tinhThanhPho || undefined,
                dienTich: data.dienTich != null ? data.dienTich : undefined,
                khaNangTiepNhan: data.khaNangTiepNhan != null ? data.khaNangTiepNhan : undefined,
                trangThaiHoatDong: data.trangThaiHoatDong || undefined,
                orgUnitId: data.orgUnitId || undefined,
                nhomCangBien: data.nhomCangBien != null ? data.nhomCangBien : undefined,
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
                soLuongBenPhao: data.soLuongBenPhao != null ? data.soLuongBenPhao : undefined,
                soLuongKhuNeoDau: data.soLuongKhuNeoDau != null ? data.soLuongKhuNeoDau : undefined,
                soLuongKhuChuyenTai: data.soLuongKhuChuyenTai != null ? data.soLuongKhuChuyenTai : undefined,
                cacKhuNuocKhac: data.cacKhuNuocKhac || undefined,
                ghiChu: data.ghiChu || undefined,
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
      if (hasPerm?.('cangbien:approve'))
        actions.push({
          key: 'approve',
          label: 'Phê duyệt',
          icon: <CheckCircleOutlined />,
          onClick: () => handleApprove(record),
        });
      if (hasPerm?.('cangbien:delete'))
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
    [hasPerm, updateForm, handleApprove, handleDelete, historyHandler],
  );

  // ── Columns (DataTable format) ───────────────────────────────────
  const columns = useMemo(
    () => [
      {
        key: 'stt',
        label: 'STT',
        width: 60,
        type: 'mono' as const,
        align: 'center' as const,
        render: (_: unknown, __: CangBienResponse, idx: number) => (
          <span style={{ fontSize: fontSizeMd }}>{(page - 1) * pageSize + idx + 1}</span>
        ),
      },
      {
        key: 'maCang',
        label: 'Mã cảng',
        dataIndex: 'maCang',
        width: 160,
        render: (maCang: string) => <Tag color="cyan">{maCang}</Tag>,
      },
      {
        key: 'tenCang',
        label: 'Tên cảng',
        dataIndex: 'tenCang',
        width: 250,
      },
      {
        key: 'orgUnitId',
        label: 'Đơn vị QL',
        dataIndex: 'orgUnitId',
        width: 180,
        render: (v: string | null) => getOrgUnitName(v),
      },
      {
        key: 'tinhThanhPho',
        label: 'Tỉnh/TP',
        dataIndex: 'tinhThanhPho',
        width: 150,
        render: (v: string | null) => v || '—',
      },
      {
        key: 'nhomCangBien',
        label: 'Nhóm CB',
        dataIndex: 'nhomCangBien',
        width: 100,
        render: (v: number | null) => getNhomCangBienLabel(v),
      },
      {
        key: 'dienTich',
        label: 'Diện tích (ha)',
        dataIndex: 'dienTich',
        width: 120,
        align: 'right' as const,
        render: (v: number | null) => (v != null ? v.toFixed(2) + ' ha' : '—'),
      },
      {
        key: 'trangThaiHoatDong',
        label: 'Trạng thái HĐ',
        dataIndex: 'trangThaiHoatDong',
        width: 140,
        render: (v: string) => {
          if (!v) return '—';
          const badge = trangThaiHoatDongBadge(v);
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
      {
        key: 'trangThaiPheDuyet',
        label: 'Phê duyệt',
        dataIndex: 'trangThaiPheDuyet',
        width: 140,
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
    [page, pageSize, getOrgUnitName, getNhomCangBienLabel],
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
        key: 'tinhThanhPho',
        type: 'select' as const,
        label: 'Tỉnh/TP',
        placeholder: 'Chọn tỉnh/thành phố',
        options: VIETNAM_PROVINCES.map((p) => ({ value: p, label: p })),
      },
      {
        key: 'trangThaiHoatDong',
        type: 'select' as const,
        label: 'Trạng thái HĐ',
        placeholder: 'Chọn trạng thái',
        options: TRANG_THAI_HOAT_DONG_OPTIONS,
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
              hasPerm?.('cangbien:create')
                ? {
                    key: 'create',
                    label: 'Thêm mới',
                    icon: <PlusOutlined />,
                    variant: 'primary' as const,
                    onClick: () => {
                      if (createForm.resetFields) createForm.resetFields();
                      createForm.setFieldsValue({ trangThaiPheDuyet: 'CHO_PHE_DUYET' });
                      setCreateModalVisible(true);
                    },
                  }
                : null,
              {
                key: 'export',
                label: 'Xuất Excel',
                icon: <DownloadOutlined />,
                variant: 'subtle' as const,
                onClick: () => {},
              },
            ].filter(Boolean)}
          />

          <FilterBar
            fields={filterFields}
            onSearch={(values) => {
              setSearch(values.search || '');
              setFilterTinh(values.tinhThanhPho || '');
              setFilterStatus(values.trangThaiHoatDong || undefined);
              setActiveStatusTab(values.trangThaiHoatDong || '');
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
                {
                  key: 'all',
                  label: 'Tất cả',
                  count: total || 0,
                  color: actionPrimary,
                  active: !activeStatusTab,
                },
                {
                  key: 'HIEN_HANH',
                  label: 'Hiện hành',
                  count: 0,
                  color: statusOperational,
                  active: activeStatusTab === 'HIEN_HANH',
                },
                {
                  key: 'TAM_NGUNG',
                  label: 'Tạm ngừng',
                  count: 0,
                  color: statusCritical,
                  active: activeStatusTab === 'TAM_NGUNG',
                },
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
                  ctaText={
                    !search && !filterTinh && !filterStatus
                      ? 'Tạo cảng biển đầu tiên'
                      : undefined
                  }
                  onCta={
                    !search && !filterTinh && !filterStatus
                      ? () => {
                          createForm.resetFields();
                          createForm.setFieldsValue({ trangThaiPheDuyet: 'CHO_PHE_DUYET' });
                          setCreateModalVisible(true);
                        }
                      : undefined
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
          onCancel={() => setCreateModalVisible(false)}
          footer={null}
          width={900}
          forceRender
        >
          <Form
            form={createForm}
            layout="vertical"
            onFinish={handleCreateFinish}
            onFinishFailed={handleFormFailed}
            initialValues={{ trangThaiPheDuyet: 'CHO_PHE_DUYET' }}
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
                            name="maCang"
                            {...labelProps('Mã cảng *')}
                            style={{ marginBottom: spaceFormField }}
                            rules={[
                              { required: true, message: 'Mã cảng không được để trống' },
                              { max: 50, message: 'Mã cảng tối đa 50 ký tự' },
                            ]}
                          >
                            <Input placeholder="VD: CB-HAIPHONG-001" maxLength={50} style={inputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="tenCang"
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
                            name="tinhThanhPho"
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
                            name="nhomCangBien"
                            {...labelProps('Nhóm cảng biển')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select
                              placeholder="Chọn nhóm cảng biển"
                              allowClear
                              options={[
                                { label: 'Nhóm 1', value: 1 },
                                { label: 'Nhóm 2', value: 2 },
                                { label: 'Nhóm 3', value: 3 },
                                { label: 'Nhóm 4', value: 4 },
                                { label: 'Nhóm 5', value: 5 },
                              ]}
                              style={selectStyle}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="dienTich"
                            {...labelProps('Diện tích (m²) *')}
                            style={{ marginBottom: spaceFormField }}
                            rules={[{ required: true, message: 'Diện tích phải lớn hơn 0' }]}
                          >
                            <InputNumber
                              min={0.01}
                              step={0.01}
                              precision={2}
                              placeholder="VD: 100.00"
                              style={numberInputStyle}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="khaNangTiepNhan"
                            {...labelProps('Khả năng tiếp nhận')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber
                              step={0.01}
                              precision={2}
                              placeholder="VD: 500000"
                              style={numberInputStyle}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="trangThaiHoatDong"
                            {...labelProps('Trạng thái hoạt động')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select
                              placeholder="Chọn trạng thái"
                              options={TRANG_THAI_HOAT_DONG_OPTIONS}
                              style={selectStyle}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={24}>
                          <Form.Item
                            name="ghiChu"
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
                            name="soLuongBenPhao"
                            {...labelProps('Số bến phao')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="soLuongKhuNeoDau"
                            {...labelProps('Số khu neo đậu')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="soLuongKhuChuyenTai"
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
                                <Select.Option key={sym.id} value={sym.id} label={`${sym.name} (${sym.code})`}>
                                  <Space>
                                    {sym.hinhAnh && (
                                      <img
                                        src={
                                          sym.hinhAnh.startsWith('data:')
                                            ? sym.hinhAnh
                                            : `data:image/png;base64,${sym.hinhAnh}`
                                        }
                                        alt={sym.name}
                                        style={{ width: 20, height: 20, objectFit: 'contain' }}
                                      />
                                    )}
                                    <span>
                                      {sym.name} ({sym.code})
                                    </span>
                                  </Space>
                                </Select.Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={8}>
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
                        <Col span={8}>
                          <Form.Item
                            name="quyTacHienThi"
                            {...labelProps('Quy tắc hiển thị')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
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
                ? `Chỉnh sửa: ${selectedRecord.maCang} — ${selectedRecord.tenCang}`
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
                            name="maCang"
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
                            name="tenCang"
                            {...labelProps('Tên cảng')}
                            style={{ marginBottom: spaceFormField }}
                            rules={[{ max: 255, message: 'Tên cảng tối đa 255 ký tự' }]}
                          >
                            <Input placeholder="VD: Cảng biển Hải Phòng" maxLength={255} style={inputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="tinhThanhPho"
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
                            name="nhomCangBien"
                            {...labelProps('Nhóm cảng biển')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select
                              placeholder="Chọn nhóm cảng biển"
                              allowClear
                              options={[
                                { label: 'Nhóm 1', value: 1 },
                                { label: 'Nhóm 2', value: 2 },
                                { label: 'Nhóm 3', value: 3 },
                                { label: 'Nhóm 4', value: 4 },
                                { label: 'Nhóm 5', value: 5 },
                              ]}
                              style={selectStyle}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="dienTich"
                            {...labelProps('Diện tích (m²)')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber
                              min={0.01}
                              step={0.01}
                              precision={2}
                              placeholder="VD: 100.00"
                              style={numberInputStyle}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="khaNangTiepNhan"
                            {...labelProps('Khả năng tiếp nhận')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber
                              step={0.01}
                              precision={2}
                              placeholder="VD: 500000"
                              style={numberInputStyle}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="trangThaiHoatDong"
                            {...labelProps('Trạng thái hoạt động')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select
                              placeholder="Chọn trạng thái"
                              options={TRANG_THAI_HOAT_DONG_OPTIONS}
                              style={selectStyle}
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
                                selectedRecord?.trangThaiPheDuyet
                                  ? trangThaiPheDuyetBadge(selectedRecord.trangThaiPheDuyet).label
                                  : '—'
                              }
                              aria-readonly="true"
                              style={inputStyle}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="ghiChu"
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
                            name="soLuongBenPhao"
                            {...labelProps('Số bến phao')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="soLuongKhuNeoDau"
                            {...labelProps('Số khu neo đậu')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="soLuongKhuChuyenTai"
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
                                <Select.Option key={sym.id} value={sym.id} label={`${sym.name} (${sym.code})`}>
                                  <Space>
                                    {sym.hinhAnh && (
                                      <img
                                        src={
                                          sym.hinhAnh.startsWith('data:')
                                            ? sym.hinhAnh
                                            : `data:image/png;base64,${sym.hinhAnh}`
                                        }
                                        alt={sym.name}
                                        style={{ width: 20, height: 20, objectFit: 'contain' }}
                                      />
                                    )}
                                    <span>
                                      {sym.name} ({sym.code})
                                    </span>
                                  </Space>
                                </Select.Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={8}>
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
                        <Col span={8}>
                          <Form.Item
                            name="quyTacHienThi"
                            {...labelProps('Quy tắc hiển thị')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
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
                ? `Chi tiết cảng biển: ${selectedRecord.maCang} — ${selectedRecord.tenCang}`
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
                        <Tag color="cyan">{selectedRecord.maCang}</Tag>
                      </Col>
                      <Col span={12}>
                        <Typography.Text strong>Tên cảng:</Typography.Text>
                        <br />
                        <Typography.Text>{selectedRecord.tenCang}</Typography.Text>
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
                        <Typography.Text>{selectedRecord.tinhThanhPho || '—'}</Typography.Text>
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
                          {selectedRecord.nhomCangBien
                            ? 'Nhóm ' + selectedRecord.nhomCangBien
                            : '—'}
                        </Typography.Text>
                      </Col>
                    </Row>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card title="Thông số" size="small" style={{ height: '100%' }}>
                    <Typography.Text strong>Diện tích (m²):</Typography.Text>
                    <br />
                    <Typography.Text>
                      {selectedRecord.dienTich != null
                        ? selectedRecord.dienTich.toFixed(2)
                        : '—'}
                    </Typography.Text>
                    <br />
                    <Typography.Text strong style={{ marginTop: 8, display: 'block' }}>
                      Khả năng tiếp nhận:
                    </Typography.Text>
                    <Typography.Text>
                      {selectedRecord.khaNangTiepNhan != null
                        ? selectedRecord.khaNangTiepNhan.toFixed(2)
                        : '—'}
                    </Typography.Text>
                    <br />
                    <Typography.Text strong style={{ marginTop: 8, display: 'block' }}>
                      Trạng thái HĐ:
                    </Typography.Text>
                    {selectedRecord.trangThaiHoatDong && (
                      <Tag color={trangThaiHoatDongBadge(selectedRecord.trangThaiHoatDong).color}>
                        {trangThaiHoatDongBadge(selectedRecord.trangThaiHoatDong).label}
                      </Tag>
                    )}
                    <br />
                    <Typography.Text strong style={{ marginTop: 8, display: 'block' }}>
                      Phê duyệt:
                    </Typography.Text>
                    {selectedRecord.trangThaiPheDuyet && (
                      <Tag color={trangThaiPheDuyetBadge(selectedRecord.trangThaiPheDuyet).color}>
                        {trangThaiPheDuyetBadge(selectedRecord.trangThaiPheDuyet).label}
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
                        <Typography.Text>{selectedRecord.soLuongBenPhao ?? '—'}</Typography.Text>
                      </Col>
                      <Col span={4}>
                        <Typography.Text strong>Khu neo đậu:</Typography.Text>
                        <br />
                        <Typography.Text>{selectedRecord.soLuongKhuNeoDau ?? '—'}</Typography.Text>
                      </Col>
                      <Col span={4}>
                        <Typography.Text strong>Khu chuyển tải:</Typography.Text>
                        <br />
                        <Typography.Text>{selectedRecord.soLuongKhuChuyenTai ?? '—'}</Typography.Text>
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
                        <Typography.Text>{selectedRecord.ghiChu || '—'}</Typography.Text>
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
                          {selectedRecord.viDo != null
                            ? selectedRecord.viDo.toFixed(6)
                            : '—'}
                        </Typography.Text>
                      </Col>
                      <Col span={8}>
                        <Typography.Text strong>Kinh độ:</Typography.Text>
                        <br />
                        <Typography.Text>
                          {selectedRecord.kinhDo != null
                            ? selectedRecord.kinhDo.toFixed(6)
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
                              onClick={() => window.open(giayToApi.downloadUrl(f.minioKey), '_blank')}
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
                    Upload Giấy tờ
                  </Button>
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => {
                      setDetailModalVisible(false);
                      updateForm.setFieldsValue({
                        id: selectedRecord.id,
                        maCang: selectedRecord.maCang,
                        tenCang: selectedRecord.tenCang,
                        tinhThanhPho: selectedRecord.tinhThanhPho || undefined,
                        viDo:
                          selectedRecord.viDo != null ? selectedRecord.viDo : undefined,
                        kinhDo:
                          selectedRecord.kinhDo != null ? selectedRecord.kinhDo : undefined,
                        dienTich:
                          selectedRecord.dienTich != null
                            ? selectedRecord.dienTich
                            : undefined,
                        khaNangTiepNhan:
                          selectedRecord.khaNangTiepNhan != null
                            ? selectedRecord.khaNangTiepNhan
                            : undefined,
                        trangThaiHoatDong: selectedRecord.trangThaiHoatDong || undefined,
                        orgUnitId: selectedRecord.orgUnitId || undefined,
                        nhomCangBien:
                          selectedRecord.nhomCangBien != null
                            ? selectedRecord.nhomCangBien
                            : undefined,
                        bieuTuongId: selectedRecord.bieuTuongId || undefined,
                        diaDiemChiTiet: selectedRecord.diaDiemChiTiet || undefined,
                        phanCap:
                          selectedRecord.phanCap != null
                            ? selectedRecord.phanCap
                            : undefined,
                        heQuyChieu:
                          selectedRecord.heQuyChieu != null
                            ? selectedRecord.heQuyChieu
                            : undefined,
                        quyTacHienThi:
                          selectedRecord.quyTacHienThi != null
                            ? selectedRecord.quyTacHienThi
                            : undefined,
                        phamViVungNuoc: selectedRecord.phamViVungNuoc || undefined,
                        tongSoBenCang:
                          selectedRecord.tongSoBenCang != null
                            ? selectedRecord.tongSoBenCang
                            : undefined,
                        tongSoKhuNeoDauChuyenTai:
                          selectedRecord.tongSoKhuNeoDauChuyenTai != null
                            ? selectedRecord.tongSoKhuNeoDauChuyenTai
                            : undefined,
                        tongSoTuyenLuongCongCong:
                          selectedRecord.tongSoTuyenLuongCongCong != null
                            ? selectedRecord.tongSoTuyenLuongCongCong
                            : undefined,
                        tongSoTuyenLuongChuyenDung:
                          selectedRecord.tongSoTuyenLuongChuyenDung != null
                            ? selectedRecord.tongSoTuyenLuongChuyenDung
                            : undefined,
                        tongChieuDaiLuongCongCong:
                          selectedRecord.tongChieuDaiLuongCongCong != null
                            ? selectedRecord.tongChieuDaiLuongCongCong
                            : undefined,
                        tongChieuDaiLuongChuyenDung:
                          selectedRecord.tongChieuDaiLuongChuyenDung != null
                            ? selectedRecord.tongChieuDaiLuongChuyenDung
                            : undefined,
                        tongSoPhaoTieuBaoHieu:
                          selectedRecord.tongSoPhaoTieuBaoHieu != null
                            ? selectedRecord.tongSoPhaoTieuBaoHieu
                            : undefined,
                        tongSoDeKe:
                          selectedRecord.tongSoDeKe != null
                            ? selectedRecord.tongSoDeKe
                            : undefined,
                        tongChieuDaiDeKe:
                          selectedRecord.tongChieuDaiDeKe != null
                            ? selectedRecord.tongChieuDaiDeKe
                            : undefined,
                        tongSoDenBienDangTieu:
                          selectedRecord.tongSoDenBienDangTieu != null
                            ? selectedRecord.tongSoDenBienDangTieu
                            : undefined,
                        soLuongBenPhao:
                          selectedRecord.soLuongBenPhao != null
                            ? selectedRecord.soLuongBenPhao
                            : undefined,
                        soLuongKhuNeoDau:
                          selectedRecord.soLuongKhuNeoDau != null
                            ? selectedRecord.soLuongKhuNeoDau
                            : undefined,
                        soLuongKhuChuyenTai:
                          selectedRecord.soLuongKhuChuyenTai != null
                            ? selectedRecord.soLuongKhuChuyenTai
                            : undefined,
                        cacKhuNuocKhac: selectedRecord.cacKhuNuocKhac || undefined,
                        ghiChu: selectedRecord.ghiChu || undefined,
                        gisLocation: {
                          loaiHinhHoc: selectedRecord.loaiHinhHoc || 'POINT',
                          toaDo: selectedRecord.toaDo || '',
                          bieuTuongId: selectedRecord.bieuTuongId,
                        },
                      });
                      setUpdateModalVisible(true);
                    }}
                    style={{
                      borderRadius: radiusPill,
                      height: 40,
                      fontSize: fontSizeMd,
                      background: actionPrimary,
                      borderColor: actionPrimary,
                    }}
                  >
                    Chỉnh sửa
                  </Button>
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
            ? `Lịch sử thay đổi: ${selectedRecord.maCang} — ${selectedRecord.tenCang}`
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

      {selectedRecord && (
        <GiayToUploadModal
          entityType="cang-bien"
          entityId={selectedRecord.id}
          open={uploadModalVisible}
          onCancel={() => setUploadModalVisible(false)}
        />
      )}
    </>
  );
}

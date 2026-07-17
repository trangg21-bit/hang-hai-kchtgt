import { useState, useCallback, useEffect, useRef } from 'react';
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
  Popconfirm,
  Table,
  Spin,
  Modal,
  Form,
  InputNumber,
  Typography,
  Descriptions,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  HistoryOutlined,
  UploadOutlined,
  DownloadOutlined,
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

export default function CangBienListPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filterMaCang, setFilterMaCang] = useState('');
  const [filterTenCang, setFilterTenCang] = useState('');
  const [filterTinhThanhPho, setFilterTinhThanhPho] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<CangBienResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modals Visibility
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

  const fetchSymbols = useCallback(async () => {
    try {
      const res = await symbolService.list({ page: 1, pageSize: 1000, status: 'active' });
      setSymbols(res.data);
    } catch (err) {
      console.error('Failed to load symbols', err);
    }
  }, []);

  useEffect(() => {
    // 1. Try to use caches from parent window to avoid duplicate API calls
    const parentOrgUnits = (window.parent as any)?.kchtOrgUnits;
    const parentSymbols = (window.parent as any)?.kchtSymbols;

    if (parentOrgUnits && parentOrgUnits.length > 0) {
      setOrgUnits(parentOrgUnits);
    }
    if (parentSymbols && parentSymbols.length > 0) {
      setSymbols(parentSymbols);
    }

    // 2. Only fetch what is actually required:
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
    if (fieldName === 'trangThaiPheDuyet') {
      const approvalMap: Record<string, string> = {
        'CHO_PHE_DUYET': 'Chờ phê duyệt',
        'DUOC_PHE_DUYET': 'Được phê duyệt',
        'TU_CHOI': 'Từ chối',
      };
      return approvalMap[val.toUpperCase()] || val;
    }
    if (fieldName === 'trangThaiHoatDong') {
      const statusMap: Record<string, string> = {
        'HIEN_HANH': 'Hiện hành',
        'TAM_NGUNG': 'Tạm ngừng',
        'HIỆN_HÀNH': 'Hiện hành',
        'TẠM_NGƯNG': 'Tạm ngừng',
      };
      return statusMap[val.toUpperCase()] || val;
    }
    return val;
  }, [symbols]);

  // Form Watches
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
      toast.error('Diện tích phải lớn hơn 0'); return;
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
        // Extended fields
        diaDiemChiTiet: (values.diaDiemChiTiet as string) || undefined,
        phanCap: values.phanCap != null && !Number.isNaN(values.phanCap as number)
          ? Number(values.phanCap) : undefined,
        heQuyChieu: values.heQuyChieu != null && !Number.isNaN(values.heQuyChieu as number)
          ? Number(values.heQuyChieu) : undefined,
        quyTacHienThi: values.quyTacHienThi != null && !Number.isNaN(values.quyTacHienThi as number)
          ? Number(values.quyTacHienThi) : undefined,
        // zobjDataSub fields
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
      await import('./api').then(m => m.createCangBien(payload));
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
        // Extended fields
        diaDiemChiTiet: (values.diaDiemChiTiet as string) || undefined,
        phanCap: n(values.phanCap),
        heQuyChieu: n(values.heQuyChieu),
        quyTacHienThi: n(values.quyTacHienThi),
        // zobjDataSub fields
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
      const res = await import('./api').then(m => m.updateCangBien(payload));
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
        maCang: filterMaCang || undefined,
        tenCang: filterTenCang || undefined,
        tinhThanhPho: filterTinhThanhPho || undefined,
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
  }, [page, pageSize, search, filterMaCang, filterTenCang, filterTinhThanhPho, filterStatus, filterApprovalStatus]);

  useEffect(() => { if (!isIframeModal) void fetchData(); }, [fetchData, isIframeModal]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  // Debounced search
  const handleSearchInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setPage(1);
    }, 500);
  }, []);

  const handleDelete = useCallback(
    async (record: CangBienResponse) => {
      try {
        await deleteCangBien(record.id);
        toast.success('Xóa thành công');
        fetchData();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Xóa thất bại';
        toast.error(msg);
      }
    },
    [fetchData],
  );

  const handleApprove = useCallback(
    async (record: CangBienResponse) => {
      try {
        await approveCangBien(record.id);
        toast.success('Phê duyệt thành công');
        fetchData();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Phê duyệt thất bại';
        toast.error(msg);
      }
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

  const getOrgUnitName = useCallback((orgUnitId: string | null): string => {
    if (!orgUnitId) return '—';
    const unit = orgUnits.find(o => o.id === orgUnitId);
    return unit ? unit.name : orgUnitId.substring(0, 8) + '…';
  }, [orgUnits]);

  const getNhomCangBienLabel = (val: number | null): string => {
    if (!val) return '—';
    return `Nhóm ${val}`;
  };

  const columns: ColumnsType<CangBienResponse> = [
    {
      title: 'STT',
      width: 60,
      render: (_: unknown, __: CangBienResponse, idx: number) =>
        (page - 1) * pageSize + idx + 1,
    },
    {
      title: 'Mã cảng',
      dataIndex: 'maCang',
      width: 160,
      render: (maCang: string) => <Tag color="cyan">{maCang}</Tag>,
    },
    {
      title: 'Tên cảng',
      dataIndex: 'tenCang',
      width: 250,
      ellipsis: true,
    },
    {
      title: 'Đơn vị QL',
      dataIndex: 'orgUnitId',
      width: 180,
      ellipsis: true,
      render: (v: string | null) => getOrgUnitName(v),
    },
    {
      title: 'Tỉnh/TP',
      dataIndex: 'tinhThanhPho',
      width: 150,
      ellipsis: true,
      render: (v: string | null) => v || '—',
    },
    {
      title: 'Nhóm CB',
      dataIndex: 'nhomCangBien',
      width: 120,
      render: (v: number | null) => {
        if (!v) return '—';
        const roman = v === 1 ? 'I' : v === 2 ? 'II' : v === 3 ? 'III' : v === 4 ? 'IV' : 'V';
        return <Tag>{`Nhóm ${v}`}</Tag>;
      },
    },
    {
      title: 'Diện tích (m²)',
      dataIndex: 'dienTich',
      width: 140,
      align: 'right' as const,
      render: (v: number | null) => (v != null ? v.toFixed(2) : '—'),
    },
    {
      title: 'Khả năng tiếp nhận',
      dataIndex: 'khaNangTiepNhan',
      width: 150,
      align: 'right' as const,
      render: (v: number | null) => (v != null ? v.toFixed(2) : '—'),
    },
    {
      title: 'Trạng thái HĐ',
      dataIndex: 'trangThaiHoatDong',
      width: 130,
      render: (status: string | null) => {
        const b = status ? trangThaiHoatDongBadge(status) : { color: 'default', label: '—' };
        return <Tag color={b.color}>{b.label}</Tag>;
      },
    },
    {
      title: 'Phê duyệt',
      dataIndex: 'trangThaiPheDuyet',
      width: 140,
      render: (status: string | null) => {
        const b = status ? trangThaiPheDuyetBadge(status) : { color: 'default', label: '—' };
        return <Tag color={b.color}>{b.label}</Tag>;
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      width: 150,
      render: (v: string | null) => formatDate(v),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 320,
      fixed: 'right' as const,
      render: (_: unknown, record: CangBienResponse) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={async () => {
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
              }}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={async () => {
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
                  });
                  setUpdateModalVisible(true);
                } catch (err) {
                  toast.error('Không thể tải thông tin chỉnh sửa cảng biển');
                } finally {
                  setIsLoading(false);
                }
              }}
            />
          </Tooltip>
          {record.trangThaiPheDuyet === 'CHO_PHE_DUYET' && (
            <>
              <Tooltip title="Phê duyệt">
                <Popconfirm
                  title="Phê duyệt cảng biển?"
                  okText="Phê duyệt"
                  cancelText="Hủy"
                  onConfirm={() => handleApprove(record)}
                >
                  <Button type="link" size="small" icon={<CheckCircleOutlined />} />
                </Popconfirm>
              </Tooltip>
              <Tooltip title="Từ chối">
                <Popconfirm
                  title="Từ chối cảng biển?"
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
            <Popconfirm
              title="Xác nhận xóa"
              description={`Bạn có chắc muốn xóa cảng biển "${record.tenCang}"?`}
              okText="Xóa"
              okType="danger"
              cancelText="Hủy"
              onConfirm={() => handleDelete(record)}
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
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
                  const { fetchCangBienHistory } = await import('./api');
                  const histData = await fetchCangBienHistory(record.id, { page: 0, size: 200 });
                  setHistoryRecords(histData.changeHistory || []);
                } catch (err) {
                  toast.error('Không thể tải lịch sử thay đổi');
                } finally {
                  setLoadingHistory(false);
                }
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      {!isIframeModal && (
        <>
          <Card style={{ marginBottom: 16 }} ref={searchRef}>
        <Row gutter={[12, 12]} align="middle" justify="space-between">
          <Col xs={24} md={16}>
            <Space wrap>
              <Input.Search
                placeholder="Tìm theo tên, mã..."
                allowClear
                style={{ width: 300 }}
                prefix={<SearchOutlined />}
                onSearch={handleSearch}
                onChange={handleSearchInput}
                aria-label="Tìm kiếm cảng biển"
              />
              <Input
                placeholder="Lọc theo mã"
                allowClear
                style={{ width: 160 }}
                value={filterMaCang}
                onChange={(e) => { setFilterMaCang(e.target.value); setPage(1); }}
                aria-label="Lọc theo mã cảng"
              />
              <Input
                placeholder="Lọc theo tên"
                allowClear
                style={{ width: 180 }}
                value={filterTenCang}
                onChange={(e) => { setFilterTenCang(e.target.value); setPage(1); }}
                aria-label="Lọc theo tên cảng"
              />
              <Input
                placeholder="Lọc theo tỉnh/thành"
                allowClear
                style={{ width: 180 }}
                value={filterTinhThanhPho}
                onChange={(e) => { setFilterTinhThanhPho(e.target.value); setPage(1); }}
                aria-label="Lọc theo tỉnh thành"
              />
              <Select
                placeholder="Trạng thái hoạt động"
                allowClear
                style={{ width: 180 }}
                value={filterStatus}
                onChange={(val) => { setFilterStatus(val); setPage(1); }}
                options={[
                  { label: 'Hiện hành', value: 'HIEN_HANH' },
                  { label: 'Tạm ngừng', value: 'TAM_NGUNG' },
                ]}
                aria-label="Lọc theo trạng thái hoạt động"
              />
              <Select
                placeholder="Trạng thái phê duyệt"
                allowClear
                style={{ width: 180 }}
                value={filterApprovalStatus}
                onChange={(val) => { setFilterApprovalStatus(val); setPage(1); }}
                options={[
                  { label: 'Chờ phê duyệt', value: 'CHO_PHE_DUYET' },
                  { label: 'Được phê duyệt', value: 'DUOC_PHE_DUYET' },
                  { label: 'Từ chối', value: 'TU_CHOI' },
                ]}
                aria-label="Lọc theo trạng thái phê duyệt"
              />
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Space>
              <Tooltip title="Tải lại">
                <Button icon={<ReloadOutlined />} onClick={fetchData} aria-label="Tải lại danh sách" />
              </Tooltip>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  createForm.resetFields();
                  createForm.setFieldsValue({ trangThaiPheDuyet: 'CHO_PHE_DUYET' });
                  setCreateModalVisible(true);
                }}
                aria-label="Tạo mới cảng biển"
              >
                Tạo cảng biển
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>
 
      <Card>
        <Spin spinning={isLoading} description="Đang tải...">
          {isError && (
            <div>
              <p>Đã xảy ra lỗi khi tải danh sách.</p>
              <Button onClick={fetchData}>Thử lại</Button>
            </div>
          )}
          {!isLoading && !isError && dataSource.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <p>
                {search || filterMaCang || filterTenCang
                  ? 'Không tìm thấy kết quả phù hợp.'
                  : 'Chưa có cảng biển nào.'}
              </p>
              {!search && !filterMaCang && !filterTenCang && (
                <Button
                  type="primary"
                  onClick={() => {
                    createForm.resetFields();
                    createForm.setFieldsValue({ trangThaiPheDuyet: 'CHO_PHE_DUYET' });
                    setCreateModalVisible(true);
                  }}
                >
                  Tạo cảng biển đầu tiên
                </Button>
              )}
            </div>
          )}
          {!isLoading && !isError && dataSource.length > 0 && (
            <Table<CangBienResponse>
              columns={columns}
              dataSource={dataSource}
              rowKey="id"
              scroll={{ x: 1600 }}
              pagination={{
                current: page,
                pageSize,
                total,
                onChange: (p, sz) => {
                  setPage(p);
                  if (sz) setPageSize(sz);
                },
                showSizeChanger: true,
                showTotal: (t) => `Tổng ${t} cảng biển`,
                pageSizeOptions: ['20', '50', '100'],
              }}
              aria-label="Bảng danh sách cảng biển"
            />
          )}
        </Spin>
      </Card>
        </>
      )}

      {/* Create Modal */}
      {!isIframeModal && (
        <Modal
        title="Tạo mới Cảng biển"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={900}
        forceRender
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreateFinish} onFinishFailed={handleFormFailed} initialValues={{ trangThaiPheDuyet: 'CHO_PHE_DUYET' }}>
          {/* ── Section 1: Thông tin chung ── */}
          <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>
            Thông tin chung
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Đơn vị quản lý" name="orgUnitId">
                <Select
                  placeholder="Chọn đơn vị quản lý"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={orgUnits.map(o => ({ label: o.name, value: o.id }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Mã cảng *"
                name="maCang"
                rules={[{ required: true, message: 'Mã cảng không được để trống' }, { max: 50, message: 'Mã cảng tối đa 50 ký tự' }]}
              >
                <Input placeholder="VD: CB-HAIPHONG-001" maxLength={50} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="Tên cảng *"
                name="tenCang"
                rules={[{ required: true, message: 'Tên cảng không được để trống' }, { max: 255, message: 'Tên cảng tối đa 255 ký tự' }]}
              >
                <Input placeholder="VD: Cảng biển Hải Phòng" maxLength={255} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Tỉnh/thành phố" name="tinhThanhPho" rules={[{ required: false }]}>
                <Select
                  showSearch
                  placeholder="Chọn tỉnh/thành phố..."
                  filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                  options={VIETNAM_PROVINCES.map(p => ({ value: p, label: p }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Địa điểm chi tiết" name="diaDiemChiTiet">
                <Input placeholder="VD: Xã Đình Vũ, Quận Hải An" maxLength={500} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Phân cấp" name="phanCap">
                <InputNumber min={1} step={1} precision={0} placeholder="VD: 1" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Nhóm cảng biển" name="nhomCangBien">
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
                />
              </Form.Item>
            </Col>
          </Row>

          {/* ── Section 2: Thông số ── */}
          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Thông số
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Diện tích (m²) *" name="dienTich" rules={[{ required: true, message: 'Diện tích phải lớn hơn 0' }]}>
                <InputNumber min={0.01} step={0.01} precision={2} placeholder="VD: 100.00" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Khả năng tiếp nhận" name="khaNangTiepNhan">
                <InputNumber step={0.01} precision={2} placeholder="VD: 500000" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Trạng thái hoạt động" name="trangThaiHoatDong">
                <Select placeholder="Chọn trạng thái" options={TRANG_THAI_HOAT_DONG_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>

          {/* ── Section 3: Thống kê tổng hợp ── */}
          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Thống kê tổng hợp
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Phạm vi vùng nước" name="phamViVungNuoc">
                <Input.TextArea rows={2} placeholder="Mô tả phạm vi vùng nước cảng biển" maxLength={2000} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Tổng số bến cảng" name="tongSoBenCang">
                <InputNumber min={0} step={1} precision={0} placeholder="0" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Tổng số khu neo đậu, chuyển tải" name="tongSoKhuNeoDauChuyenTai">
                <InputNumber min={0} step={1} precision={0} placeholder="0" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={6}>
              <Form.Item label="Tổng số tuyến luồng công cộng" name="tongSoTuyenLuongCongCong">
                <InputNumber min={0} step={1} precision={0} placeholder="0" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Tổng số tuyến luồng chuyên dùng" name="tongSoTuyenLuongChuyenDung">
                <InputNumber min={0} step={1} precision={0} placeholder="0" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Tổng chiều dài luồng công cộng (m)" name="tongChieuDaiLuongCongCong">
                <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Tổng chiều dài luồng chuyên dùng (m)" name="tongChieuDaiLuongChuyenDung">
                <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={6}>
              <Form.Item label="Tổng số phao tiêu báo hiệu" name="tongSoPhaoTieuBaoHieu">
                <InputNumber min={0} step={1} precision={0} placeholder="0" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Tổng số đê kè" name="tongSoDeKe">
                <InputNumber min={0} step={1} precision={0} placeholder="0" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Tổng chiều dài đê kè (m)" name="tongChieuDaiDeKe">
                <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Tổng số đèn biển, đăng tiêu" name="tongSoDenBienDangTieu">
                <InputNumber min={0} step={1} precision={0} placeholder="0" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={6}>
              <Form.Item label="Số lượng bến phao" name="soLuongBenPhao">
                <InputNumber min={0} step={1} precision={0} placeholder="0" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Số lượng khu neo đậu" name="soLuongKhuNeoDau">
                <InputNumber min={0} step={1} precision={0} placeholder="0" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Số lượng khu chuyển tải" name="soLuongKhuChuyenTai">
                <InputNumber min={0} step={1} precision={0} placeholder="0" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Các khu nước khác" name="cacKhuNuocKhac">
                <Input placeholder="Mô tả" maxLength={2000} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item label="Ghi chú" name="ghiChu">
                <Input.TextArea rows={2} placeholder="Ghi chú" maxLength={2000} />
              </Form.Item>
            </Col>
          </Row>

          {/* ── Section 4: Vị trí (GIS) ── */}
          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Vị trí (GIS)
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Loại đối tượng *" name="loaiHinhHoc" rules={[{ required: true, message: 'Loại đối tượng không được để trống' }]}>
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
                <GisLocationSelector defaultGeometryType={createLoaiHinhHoc} />
              </Form.Item>
            </Col>
          </Row>
          <Card size="small" style={{ marginBottom: 16, backgroundColor: '#fffbe6', borderColor: '#ffe58f' }}>
              <Typography.Text type="warning">⚠️ Vĩ độ và kinh độ phải được cung cấp cùng nhau hoặc để trống cùng nhau.</Typography.Text>
            </Card>
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item label="Loại đối tượng" name="loaiHinhHoc">
                <Select placeholder="Chọn loại" allowClear options={[
                  { label: 'Điểm (POINT)', value: 'POINT' },
                  { label: 'Đường (LINE)', value: 'LINE' },
                  { label: 'Vùng (POLYGON)', value: 'POLYGON' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={8}>
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
            <Col span={4}>
              <Form.Item label="Hệ quy chiếu" name="heQuyChieu">
                <InputNumber min={0} step={1} precision={0} placeholder="4326" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="Quy tắc hiển thị" name="quyTacHienThi">
                <InputNumber min={0} step={1} precision={0} placeholder="0" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item label="Tọa độ (WKT)" name="toaDo">
                <Input placeholder="VD: POINT(106.7 20.9)" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 24, marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCreateModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>Tạo cảng biển</Button>
            </Space>
          </Form.Item>
        </Form>
        </Modal>
      )}

      {/* Edit Modal */}
      {(!isIframeModal || action === 'edit') && (
        <Modal
        title={isIframeModal ? null : (selectedRecord ? `Chỉnh sửa: ${selectedRecord.maCang} — ${selectedRecord.tenCang}` : 'Chỉnh sửa cảng biển')}
        open={updateModalVisible}
        onCancel={closeUpdateModal}
        footer={null}
        width={isIframeModal ? '100%' : 900}
        mask={!isIframeModal}
        closable={!isIframeModal}
        style={isIframeModal ? { top: 0, margin: 0, padding: 0, maxWidth: 'none', height: '100%' } : undefined}
        styles={{
          body: isIframeModal ? { padding: '16px 24px', height: '100%', overflowY: 'auto' } : undefined
        }}
        forceRender
      >
        <Form form={updateForm} layout="vertical" onFinish={handleUpdateFinish} onFinishFailed={handleFormFailed}>
          {/* ── Section 1: Thông tin chung ── */}
          <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>
            Thông tin chung
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Đơn vị quản lý" name="orgUnitId">
                <Select
                  placeholder="Chọn đơn vị quản lý"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={orgUnits.map(o => ({ label: o.name, value: o.id }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Mã cảng" name="maCang">
                <Input disabled aria-readonly="true" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="Tên cảng"
                name="tenCang"
                rules={[{ max: 255, message: 'Tên cảng tối đa 255 ký tự' }]}
              >
                <Input placeholder="VD: Cảng biển Hải Phòng" maxLength={255} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Tỉnh/thành phố" name="tinhThanhPho" rules={[{ required: false }]}>
                <Select
                  showSearch
                  placeholder="Chọn tỉnh/thành phố..."
                  filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                  options={VIETNAM_PROVINCES.map(p => ({ value: p, label: p }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Địa điểm chi tiết" name="diaDiemChiTiet">
                <Input placeholder="VD: Xã Đình Vũ, Quận Hải An" maxLength={500} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Phân cấp" name="phanCap">
                <InputNumber min={1} step={1} precision={0} placeholder="VD: 1" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Nhóm cảng biển" name="nhomCangBien">
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
                />
              </Form.Item>
            </Col>
          </Row>

          {/* ── Section 2: Thông số ── */}
          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Thông số
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Diện tích (m²)" name="dienTich">
                <InputNumber min={0.01} step={0.01} precision={2} placeholder="VD: 100.00" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Khả năng tiếp nhận" name="khaNangTiepNhan">
                <InputNumber step={0.01} precision={2} placeholder="VD: 500000" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Trạng thái hoạt động" name="trangThaiHoatDong">
                <Select placeholder="Chọn trạng thái" options={TRANG_THAI_HOAT_DONG_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Trạng thái phê duyệt">
                <Input disabled value={selectedRecord?.trangThaiPheDuyet ? trangThaiPheDuyetBadge(selectedRecord.trangThaiPheDuyet).label : '—'} aria-readonly="true" />
              </Form.Item>
            </Col>
          </Row>

          {/* ── Section 3: Thống kê tổng hợp ── */}
          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Thống kê tổng hợp
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Phạm vi vùng nước" name="phamViVungNuoc">
                <Input.TextArea rows={2} placeholder="Mô tả phạm vi vùng nước cảng biển" maxLength={2000} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Tổng số bến cảng" name="tongSoBenCang">
                <InputNumber min={0} step={1} precision={0} placeholder="0" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Tổng số khu neo đậu, chuyển tải" name="tongSoKhuNeoDauChuyenTai">
                <InputNumber min={0} step={1} precision={0} placeholder="0" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={6}>
              <Form.Item label="Tổng số tuyến luồng công cộng" name="tongSoTuyenLuongCongCong">
                <InputNumber min={0} step={1} precision={0} placeholder="0" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Tổng số tuyến luồng chuyên dùng" name="tongSoTuyenLuongChuyenDung">
                <InputNumber min={0} step={1} precision={0} placeholder="0" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Tổng chiều dài luồng công cộng (m)" name="tongChieuDaiLuongCongCong">
                <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Tổng chiều dài luồng chuyên dùng (m)" name="tongChieuDaiLuongChuyenDung">
                <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={6}>
              <Form.Item label="Tổng số phao tiêu báo hiệu" name="tongSoPhaoTieuBaoHieu">
                <InputNumber min={0} step={1} precision={0} placeholder="0" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Tổng số đê kè" name="tongSoDeKe">
                <InputNumber min={0} step={1} precision={0} placeholder="0" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Tổng chiều dài đê kè (m)" name="tongChieuDaiDeKe">
                <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Tổng số đèn biển, đăng tiêu" name="tongSoDenBienDangTieu">
                <InputNumber min={0} step={1} precision={0} placeholder="0" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={6}>
              <Form.Item label="Số lượng bến phao" name="soLuongBenPhao">
                <InputNumber min={0} step={1} precision={0} placeholder="0" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Số lượng khu neo đậu" name="soLuongKhuNeoDau">
                <InputNumber min={0} step={1} precision={0} placeholder="0" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Số lượng khu chuyển tải" name="soLuongKhuChuyenTai">
                <InputNumber min={0} step={1} precision={0} placeholder="0" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Các khu nước khác" name="cacKhuNuocKhac">
                <Input placeholder="Mô tả" maxLength={2000} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item label="Ghi chú" name="ghiChu">
                <Input.TextArea rows={2} placeholder="Ghi chú" maxLength={2000} />
              </Form.Item>
            </Col>
          </Row>

          {/* ── Section 4: Vị trí (GIS) ── */}
          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Vị trí (GIS)
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Loại đối tượng *" name="loaiHinhHoc" rules={[{ required: true, message: 'Loại đối tượng không được để trống' }]}>
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
          <Card size="small" style={{ marginBottom: 16, backgroundColor: '#fffbe6', borderColor: '#ffe58f' }}>
              <Typography.Text type="warning">
                ⚠️ Vĩ độ và kinh độ phải được cung cấp cùng nhau hoặc để trống cùng nhau.
              </Typography.Text>
            </Card>
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item label="Loại đối tượng" name="loaiHinhHoc">
                <Select placeholder="Chọn loại" allowClear options={[
                  { label: 'Điểm (POINT)', value: 'POINT' },
                  { label: 'Đường (LINE)', value: 'LINE' },
                  { label: 'Vùng (POLYGON)', value: 'POLYGON' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={8}>
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
            <Col span={4}>
              <Form.Item label="Hệ quy chiếu" name="heQuyChieu">
                <InputNumber min={0} step={1} precision={0} placeholder="4326" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="Quy tắc hiển thị" name="quyTacHienThi">
                <InputNumber min={0} step={1} precision={0} placeholder="0" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item label="Tọa độ (WKT)" name="toaDo">
                <Input placeholder="VD: POINT(106.7 20.9)" />
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
        title={isIframeModal ? null : (selectedRecord ? `Chi tiết cảng biển: ${selectedRecord.maCang} — ${selectedRecord.tenCang}` : 'Chi tiết cảng biển')}
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
                          ? (orgUnits.find(o => o.id === selectedRecord.orgUnitId)?.name || selectedRecord.orgUnitId) 
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
                  <Typography.Text>{selectedRecord.dienTich != null ? selectedRecord.dienTich.toFixed(2) : '—'}</Typography.Text>
                  <br />
                  <Typography.Text strong style={{ marginTop: 8, display: 'block' }}>Khả năng tiếp nhận:</Typography.Text>
                  <Typography.Text>{selectedRecord.khaNangTiepNhan != null ? selectedRecord.khaNangTiepNhan.toFixed(2) : '—'}</Typography.Text>
                  <br />
                  <Typography.Text strong style={{ marginTop: 8, display: 'block' }}>Trạng thái HĐ:</Typography.Text>
                  {selectedRecord.trangThaiHoatDong && (
                    <Tag color={trangThaiHoatDongBadge(selectedRecord.trangThaiHoatDong).color}>
                      {trangThaiHoatDongBadge(selectedRecord.trangThaiHoatDong).label}
                    </Tag>
                  )}
                  <br />
                  <Typography.Text strong style={{ marginTop: 8, display: 'block' }}>Phê duyệt:</Typography.Text>
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
                    <Col span={8}><Typography.Text strong>Phạm vi vùng nước:</Typography.Text><br /><Typography.Text>{selectedRecord.phamViVungNuoc || '—'}</Typography.Text></Col>
                    <Col span={4}><Typography.Text strong>Tổng số bến cảng:</Typography.Text><br /><Typography.Text>{selectedRecord.tongSoBenCang ?? '—'}</Typography.Text></Col>
                    <Col span={4}><Typography.Text strong>Khu neo đậu, chuyển tải:</Typography.Text><br /><Typography.Text>{selectedRecord.tongSoKhuNeoDauChuyenTai ?? '—'}</Typography.Text></Col>
                  </Row>
                  <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
                    <Col span={6}><Typography.Text strong>Tuyến luồng công cộng:</Typography.Text><br /><Typography.Text>{selectedRecord.tongSoTuyenLuongCongCong ?? '—'} ({selectedRecord.tongChieuDaiLuongCongCong != null ? selectedRecord.tongChieuDaiLuongCongCong + 'm' : '—'})</Typography.Text></Col>
                    <Col span={6}><Typography.Text strong>Tuyến luồng chuyên dùng:</Typography.Text><br /><Typography.Text>{selectedRecord.tongSoTuyenLuongChuyenDung ?? '—'} ({selectedRecord.tongChieuDaiLuongChuyenDung != null ? selectedRecord.tongChieuDaiLuongChuyenDung + 'm' : '—'})</Typography.Text></Col>
                    <Col span={6}><Typography.Text strong>Phao tiêu báo hiệu:</Typography.Text><br /><Typography.Text>{selectedRecord.tongSoPhaoTieuBaoHieu ?? '—'}</Typography.Text></Col>
                    <Col span={6}><Typography.Text strong>Đê kè:</Typography.Text><br /><Typography.Text>{selectedRecord.tongSoDeKe ?? '—'} ({selectedRecord.tongChieuDaiDeKe != null ? selectedRecord.tongChieuDaiDeKe + 'm' : '—'})</Typography.Text></Col>
                  </Row>
                  <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
                    <Col span={4}><Typography.Text strong>Đèn biển, đăng tiêu:</Typography.Text><br /><Typography.Text>{selectedRecord.tongSoDenBienDangTieu ?? '—'}</Typography.Text></Col>
                    <Col span={4}><Typography.Text strong>Bến phao:</Typography.Text><br /><Typography.Text>{selectedRecord.soLuongBenPhao ?? '—'}</Typography.Text></Col>
                    <Col span={4}><Typography.Text strong>Khu neo đậu:</Typography.Text><br /><Typography.Text>{selectedRecord.soLuongKhuNeoDau ?? '—'}</Typography.Text></Col>
                    <Col span={4}><Typography.Text strong>Khu chuyển tải:</Typography.Text><br /><Typography.Text>{selectedRecord.soLuongKhuChuyenTai ?? '—'}</Typography.Text></Col>
                    <Col span={8}><Typography.Text strong>Các khu nước khác:</Typography.Text><br /><Typography.Text>{selectedRecord.cacKhuNuocKhac || '—'}</Typography.Text></Col>
                  </Row>
                  <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
                    <Col span={24}><Typography.Text strong>Ghi chú:</Typography.Text><br /><Typography.Text>{selectedRecord.ghiChu || '—'}</Typography.Text></Col>
                  </Row>
                </Card>
              </Col>
              <Col span={16}>
                <Card title="Thông tin địa lý & GIS" size="small" style={{ height: '100%' }}>
                  <Row gutter={[12, 12]}>
                    <Col span={8}>
                      <Typography.Text strong>Vĩ độ:</Typography.Text>
                      <br />
                      <Typography.Text>{selectedRecord.viDo != null ? selectedRecord.viDo.toFixed(6) : '—'}</Typography.Text>
                    </Col>
                    <Col span={8}>
                      <Typography.Text strong>Kinh độ:</Typography.Text>
                      <br />
                      <Typography.Text>{selectedRecord.kinhDo != null ? selectedRecord.kinhDo.toFixed(6) : '—'}</Typography.Text>
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
                          ? (symbols.find(s => s.id === selectedRecord.bieuTuongId)?.name || selectedRecord.bieuTuongId)
                          : '—'}
                      </Typography.Text>
                    </Col>
                  </Row>
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
                    <Descriptions.Item label="Người tạo">{selectedRecord.createdBy || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Ngày tạo">{selectedRecord.createdAt ? new Date(selectedRecord.createdAt).toLocaleString('vi-VN') : '—'}</Descriptions.Item>
                    <Descriptions.Item label="Cập nhật bởi">{selectedRecord.updatedBy || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Ngày cập nhật">{selectedRecord.updatedAt ? new Date(selectedRecord.updatedAt).toLocaleString('vi-VN') : '—'}</Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>
 
            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <Space>
                <Button icon={<UploadOutlined />} onClick={() => { setDetailModalVisible(false); setUploadModalVisible(true); }}>
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
                      viDo: selectedRecord.viDo != null ? selectedRecord.viDo : undefined,
                      kinhDo: selectedRecord.kinhDo != null ? selectedRecord.kinhDo : undefined,
                      dienTich: selectedRecord.dienTich != null ? selectedRecord.dienTich : undefined,
                      khaNangTiepNhan: selectedRecord.khaNangTiepNhan != null ? selectedRecord.khaNangTiepNhan : undefined,
                      trangThaiHoatDong: selectedRecord.trangThaiHoatDong || undefined,
                      orgUnitId: selectedRecord.orgUnitId || undefined,
                      nhomCangBien: selectedRecord.nhomCangBien != null ? selectedRecord.nhomCangBien : undefined,
                      bieuTuongId: selectedRecord.bieuTuongId || undefined,
                      diaDiemChiTiet: selectedRecord.diaDiemChiTiet || undefined,
                      phanCap: selectedRecord.phanCap != null ? selectedRecord.phanCap : undefined,
                      heQuyChieu: selectedRecord.heQuyChieu != null ? selectedRecord.heQuyChieu : undefined,
                      quyTacHienThi: selectedRecord.quyTacHienThi != null ? selectedRecord.quyTacHienThi : undefined,
                      phamViVungNuoc: selectedRecord.phamViVungNuoc || undefined,
                      tongSoBenCang: selectedRecord.tongSoBenCang != null ? selectedRecord.tongSoBenCang : undefined,
                      tongSoKhuNeoDauChuyenTai: selectedRecord.tongSoKhuNeoDauChuyenTai != null ? selectedRecord.tongSoKhuNeoDauChuyenTai : undefined,
                      tongSoTuyenLuongCongCong: selectedRecord.tongSoTuyenLuongCongCong != null ? selectedRecord.tongSoTuyenLuongCongCong : undefined,
                      tongSoTuyenLuongChuyenDung: selectedRecord.tongSoTuyenLuongChuyenDung != null ? selectedRecord.tongSoTuyenLuongChuyenDung : undefined,
                      tongChieuDaiLuongCongCong: selectedRecord.tongChieuDaiLuongCongCong != null ? selectedRecord.tongChieuDaiLuongCongCong : undefined,
                      tongChieuDaiLuongChuyenDung: selectedRecord.tongChieuDaiLuongChuyenDung != null ? selectedRecord.tongChieuDaiLuongChuyenDung : undefined,
                      tongSoPhaoTieuBaoHieu: selectedRecord.tongSoPhaoTieuBaoHieu != null ? selectedRecord.tongSoPhaoTieuBaoHieu : undefined,
                      tongSoDeKe: selectedRecord.tongSoDeKe != null ? selectedRecord.tongSoDeKe : undefined,
                      tongChieuDaiDeKe: selectedRecord.tongChieuDaiDeKe != null ? selectedRecord.tongChieuDaiDeKe : undefined,
                      tongSoDenBienDangTieu: selectedRecord.tongSoDenBienDangTieu != null ? selectedRecord.tongSoDenBienDangTieu : undefined,
                      soLuongBenPhao: selectedRecord.soLuongBenPhao != null ? selectedRecord.soLuongBenPhao : undefined,
                      soLuongKhuNeoDau: selectedRecord.soLuongKhuNeoDau != null ? selectedRecord.soLuongKhuNeoDau : undefined,
                      soLuongKhuChuyenTai: selectedRecord.soLuongKhuChuyenTai != null ? selectedRecord.soLuongKhuChuyenTai : undefined,
                      cacKhuNuocKhac: selectedRecord.cacKhuNuocKhac || undefined,
                      ghiChu: selectedRecord.ghiChu || undefined,
                    });
                    setUpdateModalVisible(true);
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

      {/* History Modal */}
      <Modal
        title={selectedRecord ? `Lịch sử thay đổi: ${selectedRecord.maCang} — ${selectedRecord.tenCang}` : 'Lịch sử thay đổi'}
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
                      {record.actionType && (
                        <Tag color="blue" style={{ marginLeft: 8 }}>{record.actionType}</Tag>
                      )}
                    </div>

                    {/* Actor */}
                    {record.changedBy && (
                      <div style={{ marginBottom: 4 }}>
                        <Typography.Text type="secondary">Người thực hiện: </Typography.Text>
                        <Typography.Text strong>{record.changedBy}</Typography.Text>
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

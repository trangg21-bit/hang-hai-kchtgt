import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Button,
  Space,
  Tag,
  Popconfirm,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Row,
  Col,
  Card,
  Descriptions,
  Typography,
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
  SendOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import {
  statusOperational, statusAttention, statusCritical, statusDraft,
  textSecondary, textTertiary,
  actionPrimary,
  borderDefault,
  spaceMd, spaceSm, spaceFormField, spaceLg,
  fontSizeSm, fontSizeMd, fontWeightMedium,
  radiusPill, cardStyle,
} from '../../tokens';
import { berthCRUD, berthApproval, portCRUD } from '../../services/portService';
import type { Berth } from '../../types/port';
import { PORT_STATUS_MAP } from '../../types/port';
import { ScreenHeader, FilterBar, DataTable, Pagination } from '../../components/list-view';
import type { DataTableColumn } from '../../components/list-view/DataTable';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';
import { documentApi } from '../document/api';
import { organizationService } from '../../services/organizationService';
import dayjs from 'dayjs';

// ── Berth type options ─────────────────────────────────────────────
const LOAI_BEN_OPTIONS = [
  { label: 'Bến Container', value: 'BEN_CONTAINER' },
  { label: 'Bến tổng hợp', value: 'BEN_TONG_HOP' },
  { label: 'Bến chuyên dụng', value: 'BEN_CHUYEN_DUNG' },
  { label: 'Bến hành khách', value: 'BEN_HANH_KHACH' },
  { label: 'Bến phao', value: 'BEN_PHAO' },
  { label: 'Bến thủy nội địa', value: 'BEN_THUY_NOI_DIA' },
];

const PORT_STATUS_OPTIONS = [
  { label: 'Nháp', value: 'NHAP' },
  { label: 'Chờ phê duyệt', value: 'CHO_PHE_DUYET' },
  { label: 'Đã phê duyệt', value: 'DA_PHE_DUYET' },
  { label: 'Từ chối', value: 'TU_CHOI' },
  { label: 'Tạm ngừng', value: 'TAM_NGUNG' },
];

// ── Status pill style using tokens ─────────────────────────────────
const statusPillStyle = (status: string): React.CSSProperties => {
  const colorMap: Record<string, string> = {
    NHAP: statusDraft,
    CHO_PHE_DUYET: statusAttention,
    DA_PHE_DUYET: statusOperational,
    TU_CHOI: statusCritical,
    TAM_NGUNG: statusAttention,
  };
  const color = colorMap[status] || textSecondary;
  return {
    display: 'inline-flex',
    padding: '2px 10px',
    borderRadius: radiusPill,
    fontSize: fontSizeSm,
    fontWeight: fontWeightMedium,
    background: `${color}18`,
    color,
  };
};

// ── Field name translation for history ─────────────────────────────
const translateFieldName = (fieldName: string): string => {
  const map: Record<string, string> = {
    berthCode: 'Mã bến cảng',
    berthName: 'Tên bến cảng',
    portId: 'Cảng biển chủ',
    tuyenDuongThuy: 'Tuyến đường thủy',
    waterway: 'Tuyến đường thủy',
    length: 'Chiều dài (m)',
    width: 'Chiều rộng (m)',
    berthType: 'Loại bến',
    doSauLuong: 'Độ sâu luồng (m)',
    channelDepth: 'Độ sâu luồng (m)',
    portStatus: 'Trạng thái',
    operationalStatus: 'Trạng thái hoạt động',
    approvalStatus: 'Trạng thái phê duyệt',
    orgUnitId: 'Đơn vị quản lý',
    bieuTuongId: 'Biểu tượng bản đồ',
    location: 'Địa điểm',
    diaDiemChiTiet: 'Địa điểm chi tiết',
    heQuyChieu: 'Hệ quy chiếu',
    quyTacHienThi: 'Quy tắc hiển thị',
    donViKhaiThac: 'Đơn vị khai thác',
    tongDienTich: 'Tổng diện tích',
    nangLucThongQuaThietKe: 'NL thông qua (thiết kế)',
    nangLucThongQuaHienTrang: 'NL thông qua (hiện trạng)',
    coTauTiepNhanLonNhat: 'Cỡ tàu tiếp nhận lớn nhất',
    quyHoachNangLucThongQua: 'Quy hoạch NL thông qua',
    sanLuongHangHoaNamGanNhat: 'Sản lượng hàng hóa (năm gần nhất)',
    thoiDiemCongBoMo: 'Thời điểm công bố mở',
    quyetDinhCongBo: 'Quyết định công bố',
    vanBanThoaThuanDauTu: 'Văn bản thỏa thuận đầu tư',
    structureType: 'Loại kết cấu',
    latitude: 'Vĩ độ',
    longitude: 'Kinh độ',
    tenCangBien: 'Cảng biển',
  };
  return map[fieldName] || fieldName;
};

// ── Main component ─────────────────────────────────────────────────
export default function BerthListPage() {
  // ── List state ──
  const [search, setSearch] = useState('');
  const [filterPortStatus, setFilterPortStatus] = useState<string | undefined>();
  const [filterPortId, setFilterPortId] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<Berth[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // ── Reference data ──
  const [portOptions, setPortOptions] = useState<{ value: string; label: string }[]>([]);
  const [orgUnits, setOrgUnits] = useState<any[]>([]);

  // ── Modals ──
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const [selectedRecord, setSelectedRecord] = useState<Berth | null>(null);
  const [detailFiles, setDetailFiles] = useState<any[]>([]);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyFilterType, setHistoryFilterType] = useState<string>('all');
  const [childPiers, setChildPiers] = useState(0);
  const [rejectReason, setRejectReason] = useState('');
  const [deleteConfirmed, setDeleteConfirmed] = useState('');

  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // ── Load reference data ──
  useEffect(() => {
    (async () => {
      try {
        const [portRes, orgResp] = await Promise.all([
          portCRUD.search({ page: 1, pageSize: 1000 }),
          organizationService.list(),
        ]);
        setPortOptions((portRes.data || []).map((p: any) => ({ value: p.id, label: p.portName || '' })));
        setOrgUnits(orgResp.data || []);
      } catch { /* ignore */ }
    })();
  }, []);

  // ── Fetch list ──
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await berthCRUD.search({
        page,
        pageSize,
        search: search || undefined,
        portStatus: filterPortStatus,
        portId: filterPortId,
      });
      setDataSource(res.data);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách bến cảng'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, filterPortStatus, filterPortId]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  // ── Filter handlers ──
  const handleFilterSearch = useCallback((values: Record<string, any>) => {
    setSearch(values.search || '');
    setFilterPortStatus(values.portStatus || undefined);
    setFilterPortId(values.portId || undefined);
    setPage(1);
  }, []);

  const handleFilterReset = useCallback(() => {
    setSearch('');
    setFilterPortStatus(undefined);
    setFilterPortId(undefined);
    setPage(1);
  }, []);

  // ── Delete ──
  const handleDelete = useCallback(async (record: Berth) => {
    try {
      await berthCRUD.delete(record.id);
      toast.success('Đã xóa bến cảng');
      setDeleteModalVisible(false);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  }, [fetchData]);

  const openDeleteConfirm = useCallback(async (record: Berth) => {
    try {
      setSelectedRecord(record);
      setDeleteConfirmed('');
      const children = await berthCRUD.getChildren(record.id);
      setChildPiers(children.piers || 0);
      setDeleteModalVisible(true);
    } catch {
      toast.error('Không thể kiểm tra dữ liệu liên quan');
    }
  }, []);

  // ── Approval ──
  const handleApprove = useCallback(async (record: Berth) => {
    try {
      await berthApproval.approve(record.id);
      toast.success('Đã phê duyệt bến cảng');
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
    }
  }, [fetchData]);

  const handleReject = useCallback(async () => {
    if (!selectedRecord) return;
    if (rejectReason.trim().length < 10) {
      toast.warning('Lý do từ chối tối thiểu 10 ký tự');
      return;
    }
    try {
      await berthApproval.reject(selectedRecord.id, rejectReason.trim());
      toast.success('Đã từ chối bến cảng');
      setRejectModalVisible(false);
      setRejectReason('');
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
    }
  }, [selectedRecord, rejectReason, fetchData]);

  // ── Submit for approval ──
  const handleSubmitApproval = useCallback(async (record: Berth) => {
    try {
      await berthApproval.approve(record.id);
      toast.success('Đã gửi duyệt');
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || 'Gửi duyệt thất bại');
    }
  }, [fetchData]);

  // ── Create ──
  const handleCreateFinish = async (values: any) => {
    setSubmitting(true);
    try {
      const payload: Record<string, any> = {
        action: values.action || 'draft',
        berthCode: values.berthCode,
        berthName: values.berthName,
        portId: values.portId,
        waterway: values.waterway || undefined,
        length: values.length ?? undefined,
        width: values.width ?? undefined,
        berthType: values.berthType || undefined,
        channelDepth: values.channelDepth ?? undefined,
        latitude: values.latitude ?? undefined,
        longitude: values.longitude ?? undefined,
        orgUnitId: values.orgUnitId || undefined,
        operator: values.operator || undefined,
        location: values.location || undefined,
        locationCode: values.locationCode || undefined,
        detailedLocation: values.detailedLocation || undefined,
        coordinateSystem: values.coordinateSystem ?? undefined,
        displayRule: values.displayRule ?? undefined,
        totalArea: values.totalArea ?? undefined,
        designThroughput: values.designThroughput ?? undefined,
        currentThroughput: values.currentThroughput ?? undefined,
        maxVesselSize: values.maxVesselSize ?? undefined,
        plannedThroughput: values.plannedThroughput ?? undefined,
        latestCargoVolume: values.latestCargoVolume ?? undefined,
        openingAnnouncementDate: values.openingAnnouncementDate
          ? dayjs(values.openingAnnouncementDate).toISOString()
          : undefined,
        openingDecision: values.openingDecision || undefined,
        investmentAgreement: values.investmentAgreement || undefined,
        structureType: values.structureType ?? undefined,
        bieuTuongId: values.bieuTuongId || undefined,
        loaiHinhHoc: values.loaiHinhHoc || undefined,
        toaDo: values.toaDo || undefined,
      };
      await berthCRUD.create(payload as any);
      toast.success('Tạo mới bến cảng thành công');
      setCreateModalVisible(false);
      createForm.resetFields();
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Edit ──
  const handleEditFinish = async (values: any) => {
    if (!selectedRecord) return;
    setSubmitting(true);
    try {
      const payload: Record<string, any> = {
        id: selectedRecord.id,
        berthName: values.berthName || undefined,
        portId: values.portId || undefined,
        waterway: values.waterway || undefined,
        length: values.length ?? undefined,
        width: values.width ?? undefined,
        berthType: values.berthType || undefined,
        channelDepth: values.channelDepth ?? undefined,
        latitude: values.latitude ?? undefined,
        longitude: values.longitude ?? undefined,
        orgUnitId: values.orgUnitId || undefined,
        operator: values.operator || undefined,
        location: values.location || undefined,
        locationCode: values.locationCode || undefined,
        detailedLocation: values.detailedLocation || undefined,
        coordinateSystem: values.coordinateSystem ?? undefined,
        displayRule: values.displayRule ?? undefined,
        totalArea: values.totalArea ?? undefined,
        designThroughput: values.designThroughput ?? undefined,
        currentThroughput: values.currentThroughput ?? undefined,
        maxVesselSize: values.maxVesselSize ?? undefined,
        plannedThroughput: values.plannedThroughput ?? undefined,
        latestCargoVolume: values.latestCargoVolume ?? undefined,
        openingAnnouncementDate: values.openingAnnouncementDate
          ? dayjs(values.openingAnnouncementDate).toISOString()
          : undefined,
        openingDecision: values.openingDecision || undefined,
        investmentAgreement: values.investmentAgreement || undefined,
        structureType: values.structureType ?? undefined,
        bieuTuongId: values.bieuTuongId || undefined,
        loaiHinhHoc: values.loaiHinhHoc || undefined,
        toaDo: values.toaDo || undefined,
      };
      await berthCRUD.update(payload as any);
      toast.success('Cập nhật bến cảng thành công');
      setEditModalVisible(false);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Cập nhật thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Open create modal with auto-generated code ──
  const openCreateModal = useCallback(async () => {
    createForm.resetFields();
    setCreateModalVisible(true);
    try {
      const code = await berthCRUD.generateCode();
      createForm.setFieldsValue({ berthCode: code });
    } catch { /* ignore - user can type manually */ }
  }, [createForm]);

  // ── Open edit modal ──
  const openEditModal = useCallback(async (record: Berth) => {
    try {
      setIsLoading(true);
      const data = await berthCRUD.findById(record.id);
      setSelectedRecord(data);
      editForm.setFieldsValue({
        berthCode: data.berthCode,
        berthName: data.berthName,
        portId: data.portId,
        waterway: data.waterway || data.tuyenDuongThuy,
        latitude: data.latitude,
        longitude: data.longitude,
        length: data.length,
        width: data.width,
        berthType: data.berthType,
        channelDepth: data.channelDepth || data.doSauLuong,
        orgUnitId: data.orgUnitId,
        operator: data.operator || data.donViKhaiThac,
        location: data.location,
        locationCode: data.locationCode,
        detailedLocation: data.detailedLocation || data.diaDiemChiTiet,
        coordinateSystem: data.coordinateSystem || data.heQuyChieu,
        displayRule: data.displayRule || data.quyTacHienThi,
        totalArea: data.totalArea || data.tongDienTich,
        designThroughput: data.designThroughput || data.nangLucThongQuaThietKe,
        currentThroughput: data.currentThroughput || data.nangLucThongQuaHienTrang,
        maxVesselSize: data.maxVesselSize || data.coTauTiepNhanLonNhat,
        plannedThroughput: data.plannedThroughput || data.quyHoachNangLucThongQua,
        latestCargoVolume: data.latestCargoVolume || data.sanLuongHangHoaNamGanNhat,
        openingAnnouncementDate: data.openingAnnouncementDate
          ? dayjs(data.openingAnnouncementDate)
          : data.thoiDiemCongBoMo
            ? dayjs(data.thoiDiemCongBoMo)
            : undefined,
        openingDecision: data.openingDecision || data.quyetDinhCongBo,
        investmentAgreement: data.investmentAgreement || data.vanBanThoaThuanDauTu,
        structureType: data.structureType,
        bieuTuongId: data.bieuTuongId,
        loaiHinhHoc: data.loaiHinhHoc || 'POINT',
        toaDo: data.toaDo || '',
      });
      setEditModalVisible(true);
    } catch {
      toast.error('Không thể tải thông tin bến cảng');
    } finally {
      setIsLoading(false);
    }
  }, [editForm]);

  // ── Open detail modal ──
  const openDetailModal = useCallback(async (record: Berth) => {
    try {
      setIsLoading(true);
      const data = await berthCRUD.findById(record.id);
      setSelectedRecord(data);
      try {
        const fileRes = await documentApi.listByEntity('berth', record.id, { page: 1, size: 20 });
        setDetailFiles(fileRes.data || []);
      } catch { /* ignore */ }
      setDetailModalVisible(true);
    } catch {
      toast.error('Không thể tải thông tin chi tiết');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Open history modal ──
  const openHistoryModal = useCallback(async (record: Berth) => {
    try {
      setLoadingHistory(true);
      setSelectedRecord(record);
      setHistoryFilterType('all');
      setHistoryModalVisible(true);
      const { fetchBerthHistory } = await import('./api');
      const histData = await fetchBerthHistory(record.id);
      // Combine changeHistory and approvalLog with eventType
      const changeHistory = (histData.changeHistory || []).map((r: any) => ({
        ...r,
        eventType: 'Cập nhật',
      }));
      const approvalLog = (histData.approvalLog || []).map((r: any) => ({
        ...r,
        eventType: r.decision === 'APPROVE' ? 'Phê duyệt' : 'Từ chối',
        fieldName: r.decision === 'APPROVE' ? 'Phê duyệt' : 'Từ chối',
        changedBy: r.decidedBy,
        changedAt: r.decidedAt,
        oldValue: '',
        newValue: r.decision === 'APPROVE' ? 'Đã phê duyệt' : 'Đã từ chối',
        reason: r.reason || '',
      }));
      const combined = [...changeHistory, ...approvalLog].sort(
        (a, b) => new Date(b.changedAt || b.createdAt).getTime() - new Date(a.changedAt || a.createdAt).getTime()
      );
      setHistoryRecords(combined);
    } catch {
      toast.error('Không thể tải lịch sử thay đổi');
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // ── Row actions ──
  const rowActions = useCallback((record: Berth) => {
    const isNhap = record.portStatus === 'NHAP' || record.approvalStatus === 'NHAP' || record.approvalStatus === 'DRAFT';
    const isChoDuyet = record.portStatus === 'CHO_PHE_DUYET' || record.approvalStatus === 'CHO_PHE_DUYET' || record.approvalStatus === 'PENDING_APPROVAL';
    const actions: { key: string; label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean }[] = [];

    actions.push({ key: 'view', label: 'Xem chi tiết', icon: <EyeOutlined />, onClick: () => openDetailModal(record) });
    actions.push({ key: 'edit', label: 'Sửa', icon: <EditOutlined />, onClick: () => openEditModal(record) });

    if (isNhap) {
      actions.push({ key: 'submit', label: 'Gửi duyệt', icon: <SendOutlined />, onClick: () => handleSubmitApproval(record) });
      actions.push({ key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, onClick: () => openDeleteConfirm(record), danger: true });
    }

    if (isChoDuyet) {
      actions.push({ key: 'approve', label: 'Phê duyệt', icon: <CheckCircleOutlined />, onClick: () => handleApprove(record) });
      actions.push({ key: 'reject', label: 'Từ chối', icon: <CloseCircleOutlined />, onClick: () => { setSelectedRecord(record); setRejectReason(''); setRejectModalVisible(true); }, danger: true });
    }

    actions.push({ key: 'history', label: 'Lịch sử', icon: <HistoryOutlined />, onClick: () => openHistoryModal(record) });

    return actions;
  }, [openDetailModal, openEditModal, handleSubmitApproval, openDeleteConfirm, handleApprove, openHistoryModal]);

  // ── Columns ──
  const columns: DataTableColumn[] = useMemo(() => [
    {
      key: 'stt',
      label: 'STT',
      width: 60,
      type: 'mono',
      align: 'center',
      render: (_: unknown, __: Berth, idx?: number) => <span>{(page - 1) * pageSize + (idx || 0) + 1}</span>,
    },
    {
      key: 'berthCode',
      label: 'Mã bến',
      dataIndex: 'berthCode',
      width: 140,
      render: (code: string) => <Tag color="cyan">{code}</Tag>,
    },
    {
      key: 'berthName',
      label: 'Tên bến',
      dataIndex: 'berthName',
    },
    {
      key: 'tenCangBien',
      label: 'Cảng mẹ',
      dataIndex: 'tenCangBien',
      width: 180,
      render: (v: string) => v || '—',
    },
    {
      key: 'latitude',
      label: 'Vĩ độ',
      dataIndex: 'latitude',
      width: 110,
      align: 'right',
      render: (v?: number) => (v != null ? v.toFixed(6) : '—'),
    },
    {
      key: 'longitude',
      label: 'Kinh độ',
      dataIndex: 'longitude',
      width: 110,
      align: 'right',
      render: (v?: number) => (v != null ? v.toFixed(6) : '—'),
    },
    {
      key: 'portStatus',
      label: 'Trạng thái',
      dataIndex: 'portStatus',
      width: 150,
      align: 'center',
      render: (status?: string) => {
        if (!status || status === 'DA_XOA') return <span style={{ color: textTertiary }}>—</span>;
        const entry = PORT_STATUS_MAP[status] || { label: status };
        return <span style={statusPillStyle(status)}>{entry.label}</span>;
      },
    },
    {
      key: 'updatedAt',
      label: 'Ngày cập nhật',
      dataIndex: 'updatedAt',
      width: 140,
      render: (v?: string) => v ? new Date(v).toLocaleDateString('vi-VN') : '—',
    },
  ], [page, pageSize]);

  // ── Filter fields ──
  const filterFields = useMemo(() => [
    { key: 'search', type: 'search' as const, label: 'Tìm kiếm', placeholder: 'Tìm theo mã, tên bến, tên cảng mẹ...' },
    { key: 'portStatus', type: 'select' as const, label: 'Trạng thái', placeholder: 'Chọn trạng thái', options: PORT_STATUS_OPTIONS },
    { key: 'portId', type: 'select' as const, label: 'Cảng mẹ', placeholder: 'Chọn cảng biển', options: portOptions },
  ], [portOptions]);

  // ── Header actions ──
  const headerActions = useMemo(() => [
    { key: 'create', label: 'Tạo bến cảng', variant: 'primary' as const, icon: <PlusOutlined />, onClick: openCreateModal },
  ], [openCreateModal]);

  // ── Render ──
  const renderContent = () => {
    if (isLoading) return <LoadingSkeleton rows={8} />;
    if (isError) return <ErrorState message={error?.message || 'Không thể tải danh sách bến cảng'} onRetry={fetchData} />;
    if (dataSource.length === 0) {
      if (search || filterPortStatus || filterPortId) return <EmptyState description="Không tìm thấy bến cảng nào phù hợp" />;
      return <EmptyState description="Chưa có bến cảng nào" />;
    }
    return (
      <div style={{ overflowX: 'auto' }}>
        <DataTable columns={columns} dataSource={dataSource} rowKey="id" rowActions={rowActions} scroll={{ x: 1200 }} />
        <Pagination
          total={total}
          current={page}
          pageSize={pageSize}
          onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
        />
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100%', marginTop: -8 }}>
      <ScreenHeader breadcrumb={[{ label: 'Quản lý bến cảng' }]} actions={headerActions} />
      <FilterBar fields={filterFields} onSearch={handleFilterSearch} onReset={handleFilterReset} />
      <div style={{ ...cardStyle, padding: '8px 16px' }}>
        {renderContent()}
      </div>

      {/* ──────────────────── CREATE MODAL ──────────────────── */}
      <Modal
        title="Tạo mới bến cảng"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={800}
        forceRender
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto', padding: '16px 24px' } }}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreateFinish} style={{ marginTop: 8 }}>
          {/* Section 1: Thông tin chung */}
          <Card title="1. Thông tin chung" size="small" style={{ marginBottom: spaceMd }}>
            <Row gutter={spaceLg}>
              <Col span={12}>
                <Form.Item label="Mã bến" name="berthCode" style={{ marginBottom: spaceFormField }}
                  rules={[{ required: true, message: 'Mã bến không được để trống' }]}>
                  <Input placeholder="Tự động sinh" style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Tên bến" name="berthName" style={{ marginBottom: spaceFormField }}
                  rules={[{ required: true, message: 'Tên bến không được để trống' }]}>
                  <Input placeholder="VD: Bến cảng Hải Phòng" style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={spaceLg}>
              <Col span={12}>
                <Form.Item label="Cảng mẹ" name="portId" style={{ marginBottom: spaceFormField }}
                  rules={[{ required: true, message: 'Vui lòng chọn cảng mẹ' }]}>
                  <Select
                    showSearch
                    placeholder="Chọn cảng biển chủ"
                    options={portOptions}
                    style={{ borderRadius: radiusPill, height: 40 }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Tuyến đường thủy" name="waterway" style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="VD: Tuyến sông Bạch Đằng" style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={spaceLg}>
              <Col span={12}>
                <Form.Item label="Loại bến" name="berthType" style={{ marginBottom: spaceFormField }}>
                  <Select placeholder="Chọn loại bến" options={LOAI_BEN_OPTIONS} style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Loại kết cấu" name="structureType" style={{ marginBottom: spaceFormField }}>
                  <InputNumber min={0} step={1} precision={0} placeholder="VD: 1" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Section 2: Kỹ thuật */}
          <Card title="2. Kỹ thuật" size="small" style={{ marginBottom: spaceMd }}>
            <Row gutter={spaceLg}>
              <Col span={8}>
                <Form.Item label="Chiều dài (m)" name="length" style={{ marginBottom: spaceFormField }}>
                  <InputNumber min={0} step={0.01} precision={2} placeholder="VD: 200.00" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Chiều rộng (m)" name="width" style={{ marginBottom: spaceFormField }}>
                  <InputNumber min={0} step={0.01} precision={2} placeholder="VD: 30.00" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Độ sâu luồng (m)" name="channelDepth" style={{ marginBottom: spaceFormField }}>
                  <InputNumber min={0} step={0.01} precision={2} placeholder="VD: 12.50" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Section 3: Tọa độ */}
          <Card title="3. Tọa độ" size="small" style={{ marginBottom: spaceMd }}>
            <Row gutter={spaceLg}>
              <Col span={12}>
                <Form.Item label="Vĩ độ" name="latitude" style={{ marginBottom: spaceFormField }}>
                  <InputNumber min={-90} max={90} step={0.000001} placeholder="VD: 20.866070" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Kinh độ" name="longitude" style={{ marginBottom: spaceFormField }}>
                  <InputNumber min={-180} max={180} step={0.000001} placeholder="VD: 106.688810" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Section 4: Đơn vị khai thác */}
          <Card title="4. Đơn vị khai thác" size="small" style={{ marginBottom: spaceMd }}>
            <Row gutter={spaceLg}>
              <Col span={12}>
                <Form.Item label="Đơn vị khai thác" name="operator" style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="VD: Công ty CP Cảng Hải Phòng" style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Đơn vị quản lý" name="orgUnitId" style={{ marginBottom: spaceFormField }}>
                  <Select
                    allowClear
                    showSearch
                    placeholder="Chọn đơn vị quản lý"
                    optionFilterProp="label"
                    options={orgUnits.map(o => ({ label: o.name, value: o.id }))}
                    style={{ borderRadius: radiusPill, height: 40 }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Section 5: Thông tin mở rộng */}
          <Card title="5. Thông tin mở rộng" size="small" style={{ marginBottom: spaceMd }}>
            <Row gutter={spaceLg}>
              <Col span={12}>
                <Form.Item label="Mã vị trí" name="locationCode" style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Mã vị trí" style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Địa điểm chi tiết" name="detailedLocation" style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="VD: Số 1 đường Lê Thánh Tông" style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={spaceLg}>
              <Col span={12}>
                <Form.Item label="Hệ quy chiếu" name="coordinateSystem" style={{ marginBottom: spaceFormField }}>
                  <InputNumber min={0} step={1} precision={0} placeholder="VD: 4326" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Quy tắc hiển thị" name="displayRule" style={{ marginBottom: spaceFormField }}>
                  <InputNumber min={0} step={1} precision={0} placeholder="VD: 1" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Section 6: Năng lực */}
          <Card title="6. Năng lực" size="small" style={{ marginBottom: spaceMd }}>
            <Row gutter={spaceLg}>
              <Col span={8}>
                <Form.Item label="Tổng diện tích (ha)" name="totalArea" style={{ marginBottom: spaceFormField }}>
                  <InputNumber min={0} step={0.0001} precision={4} style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="NL thông qua (TK)" name="designThroughput" style={{ marginBottom: spaceFormField }}>
                  <InputNumber min={0} step={0.0001} precision={4} style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="NL thông qua (HT)" name="currentThroughput" style={{ marginBottom: spaceFormField }}>
                  <InputNumber min={0} step={0.0001} precision={4} style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={spaceLg}>
              <Col span={8}>
                <Form.Item label="Cỡ tàu lớn nhất (DWT)" name="maxVesselSize" style={{ marginBottom: spaceFormField }}>
                  <InputNumber min={0} step={0.0001} precision={4} style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Quy hoạch NL" name="plannedThroughput" style={{ marginBottom: spaceFormField }}>
                  <InputNumber min={0} step={0.0001} precision={4} style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="SL hàng hóa (gần nhất)" name="latestCargoVolume" style={{ marginBottom: spaceFormField }}>
                  <InputNumber min={0} step={0.0001} precision={4} style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Section 7: Công bố mở */}
          <Card title="7. Công bố mở" size="small" style={{ marginBottom: spaceMd }}>
            <Row gutter={spaceLg}>
              <Col span={12}>
                <Form.Item label="Ngày công bố" name="openingAnnouncementDate" style={{ marginBottom: spaceFormField }}>
                  <DatePicker showTime style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Quyết định công bố" name="openingDecision" style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="VD: 1234/QĐ-BGTVT" style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={spaceLg}>
              <Col span={24}>
                <Form.Item label="Văn bản thỏa thuận đầu tư" name="investmentAgreement" style={{ marginBottom: spaceFormField }}>
                  <Input.TextArea placeholder="VD: Thỏa thuận đầu tư số..." maxLength={2000} rows={3} style={{ borderRadius: 4 }} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Form.Item style={{ marginTop: spaceLg, marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCreateModalVisible(false)} style={{ borderRadius: radiusPill, height: 40 }}>
                Hủy
              </Button>
              <Button htmlType="submit" name="action" value="draft" loading={submitting}
                style={{ borderRadius: radiusPill, height: 40, borderColor: borderDefault, color: textSecondary }}>
                Lưu tạm
              </Button>
              <Button type="primary" htmlType="submit" name="action" value="submit" loading={submitting}
                style={{ borderRadius: radiusPill, height: 40 }}>
                Gửi phê duyệt
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* ──────────────────── EDIT MODAL ──────────────────── */}
      <Modal
        title={selectedRecord ? `Chỉnh sửa: ${selectedRecord.berthCode} — ${selectedRecord.berthName}` : 'Chỉnh sửa bến cảng'}
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={800}
        forceRender
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto', padding: '16px 24px' } }}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditFinish} style={{ marginTop: 8 }}>
          <Card title="1. Thông tin chung" size="small" style={{ marginBottom: spaceMd }}>
            <Row gutter={spaceLg}>
              <Col span={12}>
                <Form.Item label="Mã bến" name="berthCode" style={{ marginBottom: spaceFormField }}>
                  <Input disabled aria-readonly="true" style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Tên bến" name="berthName" style={{ marginBottom: spaceFormField }}
                  rules={[{ required: true, message: 'Tên bến không được để trống' }]}>
                  <Input placeholder="VD: Bến cảng Hải Phòng" style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={spaceLg}>
              <Col span={12}>
                <Form.Item label="Cảng mẹ" name="portId" style={{ marginBottom: spaceFormField }}
                  rules={[{ required: true, message: 'Vui lòng chọn cảng mẹ' }]}>
                  <Select showSearch placeholder="Chọn cảng biển chủ" options={portOptions}
                    style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Tuyến đường thủy" name="waterway" style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="VD: Tuyến sông Bạch Đằng" style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="2. Kỹ thuật" size="small" style={{ marginBottom: spaceMd }}>
            <Row gutter={spaceLg}>
              <Col span={8}>
                <Form.Item label="Chiều dài (m)" name="length" style={{ marginBottom: spaceFormField }}>
                  <InputNumber min={0} step={0.01} precision={2} style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Chiều rộng (m)" name="width" style={{ marginBottom: spaceFormField }}>
                  <InputNumber min={0} step={0.01} precision={2} style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Độ sâu luồng (m)" name="channelDepth" style={{ marginBottom: spaceFormField }}>
                  <InputNumber min={0} step={0.01} precision={2} style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="3. Tọa độ" size="small" style={{ marginBottom: spaceMd }}>
            <Row gutter={spaceLg}>
              <Col span={12}>
                <Form.Item label="Vĩ độ" name="latitude" style={{ marginBottom: spaceFormField }}>
                  <InputNumber min={-90} max={90} step={0.000001} style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Kinh độ" name="longitude" style={{ marginBottom: spaceFormField }}>
                  <InputNumber min={-180} max={180} step={0.000001} style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="4. Đơn vị khai thác" size="small" style={{ marginBottom: spaceMd }}>
            <Row gutter={spaceLg}>
              <Col span={12}>
                <Form.Item label="Đơn vị khai thác" name="operator" style={{ marginBottom: spaceFormField }}>
                  <Input style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Đơn vị quản lý" name="orgUnitId" style={{ marginBottom: spaceFormField }}>
                  <Select allowClear showSearch placeholder="Chọn đơn vị quản lý"
                    optionFilterProp="label"
                    options={orgUnits.map(o => ({ label: o.name, value: o.id }))}
                    style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="5. Thông tin mở rộng" size="small" style={{ marginBottom: spaceMd }}>
            <Row gutter={spaceLg}>
              <Col span={12}>
                <Form.Item label="Mã vị trí" name="locationCode" style={{ marginBottom: spaceFormField }}>
                  <Input style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Địa điểm chi tiết" name="detailedLocation" style={{ marginBottom: spaceFormField }}>
                  <Input style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="6. Năng lực" size="small" style={{ marginBottom: spaceMd }}>
            <Row gutter={spaceLg}>
              <Col span={8}>
                <Form.Item label="Tổng diện tích (ha)" name="totalArea" style={{ marginBottom: spaceFormField }}>
                  <InputNumber min={0} step={0.0001} precision={4} style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="NL thông qua (TK)" name="designThroughput" style={{ marginBottom: spaceFormField }}>
                  <InputNumber min={0} step={0.0001} precision={4} style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="NL thông qua (HT)" name="currentThroughput" style={{ marginBottom: spaceFormField }}>
                  <InputNumber min={0} step={0.0001} precision={4} style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={spaceLg}>
              <Col span={8}>
                <Form.Item label="Cỡ tàu lớn nhất (DWT)" name="maxVesselSize" style={{ marginBottom: spaceFormField }}>
                  <InputNumber min={0} step={0.0001} precision={4} style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Quy hoạch NL" name="plannedThroughput" style={{ marginBottom: spaceFormField }}>
                  <InputNumber min={0} step={0.0001} precision={4} style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="SL hàng hóa (gần nhất)" name="latestCargoVolume" style={{ marginBottom: spaceFormField }}>
                  <InputNumber min={0} step={0.0001} precision={4} style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="7. Công bố mở" size="small" style={{ marginBottom: spaceMd }}>
            <Row gutter={spaceLg}>
              <Col span={12}>
                <Form.Item label="Ngày công bố" name="openingAnnouncementDate" style={{ marginBottom: spaceFormField }}>
                  <DatePicker showTime style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Quyết định công bố" name="openingDecision" style={{ marginBottom: spaceFormField }}>
                  <Input style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={spaceLg}>
              <Col span={24}>
                <Form.Item label="Văn bản thỏa thuận đầu tư" name="investmentAgreement" style={{ marginBottom: spaceFormField }}>
                  <Input.TextArea rows={3} maxLength={2000} style={{ borderRadius: 4 }} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Form.Item style={{ marginTop: spaceLg, marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setEditModalVisible(false)} style={{ borderRadius: radiusPill, height: 40 }}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={submitting} style={{ borderRadius: radiusPill, height: 40 }}>
                Cập nhật
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* ──────────────────── DETAIL MODAL ──────────────────── */}
      <Modal
        title={selectedRecord ? `Chi tiết bến cảng: ${selectedRecord.berthCode} — ${selectedRecord.berthName}` : 'Chi tiết bến cảng'}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedRecord && (
          <div>
            <Row gutter={[spaceMd, spaceMd]}>
              <Col span={24}>
                <Card title="Thông tin chung" size="small">
                  <Descriptions bordered column={2} size="small">
                    <Descriptions.Item label="Mã bến">
                      <Tag color="cyan">{selectedRecord.berthCode}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Tên bến">{selectedRecord.berthName || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Cảng mẹ">
                      {selectedRecord.tenCangBien || selectedRecord.portId?.slice(0, 8) + '…' || '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Tuyến đường thủy">
                      {selectedRecord.waterway || selectedRecord.tuyenDuongThuy || '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Loại bến">
                      {selectedRecord.berthType || '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Loại kết cấu">
                      {selectedRecord.structureType != null ? selectedRecord.structureType : '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Đơn vị khai thác">
                      {selectedRecord.operator || selectedRecord.donViKhaiThac || '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                      {selectedRecord.portStatus ? (
                        <span style={statusPillStyle(selectedRecord.portStatus)}>
                          {(PORT_STATUS_MAP[selectedRecord.portStatus] || { label: selectedRecord.portStatus }).label}
                        </span>
                      ) : '—'}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              <Col span={24}>
                <Card title="Kỹ thuật & Tọa độ" size="small">
                  <Descriptions bordered column={2} size="small">
                    <Descriptions.Item label="Chiều dài (m)">
                      {selectedRecord.length != null ? `${selectedRecord.length.toFixed(2)}` : '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Chiều rộng (m)">
                      {selectedRecord.width != null ? `${selectedRecord.width.toFixed(2)}` : '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Độ sâu luồng (m)">
                      {(selectedRecord.channelDepth || selectedRecord.doSauLuong) != null
                        ? `${(selectedRecord.channelDepth || selectedRecord.doSauLuong)?.toFixed(2)}` : '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Vĩ độ">
                      {selectedRecord.latitude != null ? selectedRecord.latitude.toFixed(6) : '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Kinh độ">
                      {selectedRecord.longitude != null ? selectedRecord.longitude.toFixed(6) : '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Hệ quy chiếu">
                      {selectedRecord.coordinateSystem || selectedRecord.heQuyChieu != null
                        ? (selectedRecord.coordinateSystem || selectedRecord.heQuyChieu) : '—'}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              <Col span={24}>
                <Card title="Năng lực" size="small">
                  <Descriptions bordered column={3} size="small">
                    <Descriptions.Item label="Tổng diện tích (ha)">
                      {(selectedRecord.totalArea || selectedRecord.tongDienTich) != null
                        ? (selectedRecord.totalArea || selectedRecord.tongDienTich)?.toFixed(4) : '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="NL thông qua (TK)">
                      {(selectedRecord.designThroughput || selectedRecord.nangLucThongQuaThietKe) != null
                        ? (selectedRecord.designThroughput || selectedRecord.nangLucThongQuaThietKe)?.toFixed(4) : '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="NL thông qua (HT)">
                      {(selectedRecord.currentThroughput || selectedRecord.nangLucThongQuaHienTrang) != null
                        ? (selectedRecord.currentThroughput || selectedRecord.nangLucThongQuaHienTrang)?.toFixed(4) : '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Cỡ tàu lớn nhất (DWT)">
                      {(selectedRecord.maxVesselSize || selectedRecord.coTauTiepNhanLonNhat) != null
                        ? (selectedRecord.maxVesselSize || selectedRecord.coTauTiepNhanLonNhat)?.toLocaleString('vi-VN') : '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Quy hoạch NL">
                      {(selectedRecord.plannedThroughput || selectedRecord.quyHoachNangLucThongQua) != null
                        ? (selectedRecord.plannedThroughput || selectedRecord.quyHoachNangLucThongQua)?.toLocaleString('vi-VN') : '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="SL hàng hóa (gần nhất)">
                      {(selectedRecord.latestCargoVolume || selectedRecord.sanLuongHangHoaNamGanNhat) != null
                        ? (selectedRecord.latestCargoVolume || selectedRecord.sanLuongHangHoaNamGanNhat)?.toLocaleString('vi-VN') : '—'}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              <Col span={24}>
                <Card title="Công bố mở" size="small">
                  <Descriptions bordered column={2} size="small">
                    <Descriptions.Item label="Ngày công bố">
                      {selectedRecord.openingAnnouncementDate || selectedRecord.thoiDiemCongBoMo
                        ? new Date(selectedRecord.openingAnnouncementDate || selectedRecord.thoiDiemCongBoMo!).toLocaleString('vi-VN') : '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Quyết định công bố">
                      {selectedRecord.openingDecision || selectedRecord.quyetDinhCongBo || '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Văn bản thỏa thuận đầu tư" span={2}>
                      {selectedRecord.investmentAgreement || selectedRecord.vanBanThoaThuanDauTu || '—'}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              <Col span={24}>
                <Card title="Tài liệu đính kèm" size="small">
                  {detailFiles.length === 0 ? (
                    <span style={{ color: textTertiary, fontSize: fontSizeMd }}>Không có tài liệu đính kèm</span>
                  ) : (
                    <div>
                      {detailFiles.map((f: any) => (
                        <div key={f.id} style={{ marginBottom: spaceSm, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <Typography.Text strong>{f.fileName}</Typography.Text>
                            <br />
                            <Typography.Text type="secondary" style={{ fontSize: fontSizeSm }}>
                              {f.fileSize} bytes — {f.createdAt ? new Date(f.createdAt).toLocaleString('vi-VN') : ''}
                            </Typography.Text>
                          </div>
                          <Button type="link" icon={<FileExcelOutlined />}
                            onClick={() => window.open(documentApi.downloadUrl?.(f.minioKey) || '#', '_blank')} />
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
                    <Descriptions.Item label="Ngày tạo">
                      {selectedRecord.createdAt ? new Date(selectedRecord.createdAt).toLocaleString('vi-VN') : '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Cập nhật bởi">{selectedRecord.updatedBy || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Ngày cập nhật">
                      {selectedRecord.updatedAt ? new Date(selectedRecord.updatedAt).toLocaleString('vi-VN') : '—'}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>
            <div style={{ marginTop: spaceLg, textAlign: 'right' }}>
              <Space>
                {(selectedRecord.portStatus === 'CHO_PHE_DUYET' ||
                  selectedRecord.approvalStatus === 'CHO_PHE_DUYET' ||
                  selectedRecord.approvalStatus === 'PENDING_APPROVAL') && (
                  <>
                    <Popconfirm title="Phê duyệt bến cảng?" okText="Phê duyệt" cancelText="Hủy"
                      onConfirm={() => { handleApprove(selectedRecord); setDetailModalVisible(false); }}>
                      <Button type="primary" icon={<CheckCircleOutlined />}
                        style={{ borderRadius: radiusPill, height: 40 }}>
                        Phê duyệt
                      </Button>
                    </Popconfirm>
                    <Button danger icon={<CloseCircleOutlined />}
                      style={{ borderRadius: radiusPill, height: 40 }}
                      onClick={() => { setRejectModalVisible(true); setDetailModalVisible(false); }}>
                      Từ chối
                    </Button>
                  </>
                )}
                <Button icon={<UploadOutlined />} style={{ borderRadius: radiusPill, height: 40 }}
                  onClick={() => { setUploadModalVisible(true); }}>
                  Upload Giấy tờ
                </Button>
                <Button type="primary" icon={<EditOutlined />} style={{ borderRadius: radiusPill, height: 40 }}
                  onClick={() => { setDetailModalVisible(false); openEditModal(selectedRecord); }}>
                  Chỉnh sửa
                </Button>
                <Button onClick={() => setDetailModalVisible(false)}
                  style={{ borderRadius: radiusPill, height: 40 }}>
                  Đóng
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Modal>

      {/* ──────────────────── HISTORY MODAL ──────────────────── */}
      <Modal
        title={selectedRecord ? `Lịch sử thay đổi: ${selectedRecord.berthCode} — ${selectedRecord.berthName}` : 'Lịch sử thay đổi'}
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={[<Button key="close" onClick={() => setHistoryModalVisible(false)} style={{ borderRadius: radiusPill, height: 40 }}>Đóng</Button>]}
        width={800}
      >
        {loadingHistory ? (
          <LoadingSkeleton rows={5} />
        ) : historyRecords.length === 0 ? (
          <EmptyState description="Chưa có thay đổi nào được ghi nhận." />
        ) : (
          <>
            <div style={{ marginBottom: spaceMd }}>
              <Select
                value={historyFilterType}
                onChange={setHistoryFilterType}
                style={{ width: 200, borderRadius: radiusPill }}
                options={[
                  { value: 'all', label: 'Tất cả' },
                  { value: 'Cập nhật', label: 'Cập nhật' },
                  { value: 'Phê duyệt', label: 'Phê duyệt' },
                  { value: 'Từ chối', label: 'Từ chối' },
                ]}
              />
            </div>
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {historyRecords
              .filter((r: any) => historyFilterType === 'all' || r.eventType === historyFilterType)
              .map((record: any, idx: number) => (
              <div key={record.id || idx} style={{
                padding: spaceMd, marginBottom: spaceSm,
                borderLeft: `3px solid ${actionPrimary}80`,
                background: `${actionPrimary}08`,
                borderRadius: 4,
              }}>
                {record.changedAt && (
                  <div style={{ marginBottom: 4 }}>
                    <Typography.Text style={{ fontSize: fontSizeSm, color: textTertiary }}>
                      {new Date(record.changedAt).toLocaleString('vi-VN')}
                    </Typography.Text>
                  </div>
                )}
                {record.changedBy && (
                  <div style={{ marginBottom: 4 }}>
                    <Typography.Text type="secondary">Người thực hiện: </Typography.Text>
                    <Typography.Text strong>{record.changedBy}</Typography.Text>
                  </div>
                )}
                {record.fieldName && (
                  <div style={{ marginBottom: 4 }}>
                    <Typography.Text type="secondary">Trường: </Typography.Text>
                    <Typography.Text strong>{translateFieldName(record.fieldName)}</Typography.Text>
                  </div>
                )}
                {(record.oldValue != null && record.oldValue !== '') && (
                  <div style={{ marginBottom: 2 }}>
                    <Typography.Text style={{ color: statusCritical, textDecoration: 'line-through', fontSize: fontSizeSm }}>
                      {record.oldValue}
                    </Typography.Text>
                  </div>
                )}
                {(record.newValue != null && record.newValue !== '') && (
                  <div>
                    <Typography.Text style={{ color: statusOperational, fontWeight: fontWeightMedium, fontSize: fontSizeSm }}>
                      {record.newValue}
                    </Typography.Text>
                  </div>
                )}
                {record.reason && (
                  <div style={{ marginTop: spaceSm, padding: spaceSm, background: `${textTertiary}15`, borderRadius: 4 }}>
                    <Typography.Text type="secondary">Lý do: </Typography.Text>
                    <Typography.Text>{record.reason}</Typography.Text>
                  </div>
                )}
              </div>
              ))}
            </div>
          </>
        )}
      </Modal>

      {/* ──────────────────── REJECT MODAL ──────────────────── */}
      <Modal
        title="Từ chối bến cảng"
        open={rejectModalVisible}
        onCancel={() => { setRejectModalVisible(false); setRejectReason(''); }}
        onOk={handleReject}
        okText="Xác nhận từ chối"
        cancelText="Hủy"
        okButtonProps={{ danger: true, disabled: rejectReason.trim().length < 10 }}
      >
        <div style={{ marginBottom: spaceMd }}>
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
          <Typography.Text type="danger" style={{ fontSize: fontSizeSm }}>
            Lý do từ chối tối thiểu 10 ký tự
          </Typography.Text>
        )}
      </Modal>

      {/* ──────────────────── DELETE CONFIRM MODAL ──────────────────── */}
      <Modal
        title="Xác nhận xóa bến cảng"
        open={deleteModalVisible}
        onCancel={() => { setDeleteModalVisible(false); setDeleteConfirmed(''); }}
        onOk={() => selectedRecord && handleDelete(selectedRecord)}
        okText="Xóa"
        cancelText="Hủy"
        okButtonProps={{ danger: true, disabled: deleteConfirmed !== 'XÁC NHẬN' }}
      >
        {selectedRecord && (
          <div>
            <p>Bạn có chắc chắn muốn xóa bến cảng <strong>{selectedRecord.berthCode} — {selectedRecord.berthName}</strong>?</p>
            {childPiers > 0 && (
              <div style={{ padding: spaceMd, background: `${statusAttention}15`, borderRadius: 4, marginTop: spaceSm }}>
                <Typography.Text strong style={{ color: statusAttention }}>
                  ⚠ Cảnh báo: Bến cảng này có {childPiers} cầu cảng liên quan.
                </Typography.Text>
                <br />
                <Typography.Text style={{ color: textSecondary, fontSize: fontSizeSm }}>
                  Vui lòng xử lý các cầu cảng trước khi xóa bến cảng.
                </Typography.Text>
              </div>
            )}
            <div style={{ marginTop: spaceMd }}>
              <Typography.Text type="secondary">Gõ <strong>XÁC NHẬN</strong> để xóa:</Typography.Text>
              <Input
                placeholder="Gõ XÁC NHẬN"
                value={deleteConfirmed}
                onChange={(e) => setDeleteConfirmed(e.target.value)}
                style={{ marginTop: spaceSm, borderRadius: radiusPill, height: 40 }}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* ──────────────────── UPLOAD MODAL ──────────────────── */}
      {selectedRecord && (
        <Modal
          title="Upload giấy tờ cho bến cảng"
          open={uploadModalVisible}
          onCancel={() => setUploadModalVisible(false)}
          footer={null}
          width={500}
        >
          <div style={{ padding: spaceMd }}>
            <Typography.Text>Tính năng đang phát triển. Vui lòng sử dụng upload qua API.</Typography.Text>
          </div>
        </Modal>
      )}
    </div>
  );
}

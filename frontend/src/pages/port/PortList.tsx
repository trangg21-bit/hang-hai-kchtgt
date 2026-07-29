import { useState, useCallback, useEffect, useMemo } from 'react';
import { Button, Space, Tag, Modal, Form, Select, Input, InputNumber, Row, Col, Typography } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileExcelOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import {
  portCRUD,
  portApproval,
} from '../../services/portService';
import type { Port } from '../../types/port';
import { PORT_STATUS_MAP } from '../../types/port';
import type { PortStatusValue } from '../../types/port';
import { ScreenHeader, FilterBar, DataTable, StatusTabs } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';
import {
  statusOperational,
  statusAttention,
  statusCritical,
  statusDraft,
  actionPrimary,
  cardStyle,
  textPrimary,
  textSecondary,
  textTertiary,
  fontSizeMd,
  fontSizeSm,
  fontWeightMedium,
  fontWeightBold,
  spaceFormField,
  radiusPill,
  borderDefault,
} from '../../tokens';
import { VIETNAM_PROVINCES } from '../../types/common';

// ── Badge-style renderer for portStatus ─────────────────────────────

function renderPortStatus(status: string | null | undefined): React.ReactNode {
  if (!status) return <span style={{ color: textTertiary }}>—</span>;
  const s = PORT_STATUS_MAP[status as PortStatusValue];
  if (!s) return <span style={{ color: textTertiary }}>{status}</span>;
  return (
    <span
      style={{
        display: 'inline-flex',
        padding: '2px 10px',
        borderRadius: 999,
        fontSize: fontSizeMd,
        fontWeight: fontWeightMedium,
        background: `${s.color}15`,
        color: s.color,
      }}
    >
      {s.label}
    </span>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'NHAP': return statusDraft;
    case 'CHO_PHE_DUYET': return statusAttention;
    case 'DA_PHE_DUYET': return statusOperational;
    case 'TU_CHOI': return statusCritical;
    case 'TAM_NGUNG': return statusAttention;
    default: return textTertiary;
  }
}

const labelProps = (text: string) => ({
  label: <span style={{ color: textPrimary, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

const inputStyle: React.CSSProperties = {
  borderRadius: radiusPill,
  height: 40,
};

const numberInputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: radiusPill,
  height: 40,
};

const selectStyle: React.CSSProperties = {
  borderRadius: radiusPill,
  height: 40,
};

export default function PortList() {
  const [search, setSearch] = useState('');
  const [filterProvince, setFilterProvince] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [activeStatusTab, setActiveStatusTab] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<Port[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Modal states
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Port | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [createForm] = Form.useForm();
  const [updateForm] = Form.useForm();

  const [createCoords, setCreateCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [updateCoords, setUpdateCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [createInfras, setCreateInfras] = useState<Array<{ sequenceNumber: number; infrastructureName: string; quantity: number }>>([]);
  const [updateInfras, setUpdateInfras] = useState<Array<{ sequenceNumber: number; infrastructureName: string; quantity: number }>>([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await portCRUD.search({
        page,
        pageSize,
        portCode: search || undefined,
        portName: search || undefined,
        province: filterProvince || undefined,
        portStatus: filterStatus,
      });
      setDataSource(res.data.map((item: any) => ({
        ...item,
        operationalStatus: item.operationalStatus || undefined,
        approvalStatus: item.approvalStatus || undefined,
      })));
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách cảng biển'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, filterProvince, filterStatus]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const openCreateModal = useCallback(async () => {
    createForm.resetFields();
    setCreateCoords([]);
    setCreateInfras([]);
    setCreateModalVisible(true);
  }, [createForm]);

  const handleSearch = useCallback((values: Record<string, any>) => {
    setSearch(values.search || '');
    setFilterProvince(values.province || '');
    setPage(1);
  }, []);

  const handleFilterReset = useCallback(() => {
    setSearch('');
    setFilterProvince('');
    setFilterStatus(undefined);
    setActiveStatusTab('');
    setPage(1);
  }, []);

  const handleStatusTabChange = useCallback((key: string) => {
    setActiveStatusTab(key);
    setFilterStatus(key === 'all' ? undefined : key);
    setPage(1);
  }, []);

  const handleCreate = useCallback(async () => {
    try {
      const values = await createForm.validateFields();
      if (createCoords.length === 0) {
        toast.error('Vui lòng thêm ít nhất 1 tọa độ GPS');
        return;
      }
      for (const c of createCoords) {
        if (c.latitude < -90 || c.latitude > 90) { toast.error('Vĩ độ phải từ -90 đến 90'); return; }
        if (c.longitude < -180 || c.longitude > 180) { toast.error('Kinh độ phải từ -180 đến 180'); return; }
      }
      setSubmitting(true);
      const payload: any = {
        portName: values.portName,
        province: values.province || undefined,
        area: values.area ?? 0,
        action: 'submit',
        orgUnitId: values.orgUnitId || undefined,
        managingUnitId: values.managingUnitId || undefined,
        portGroup: values.portGroup ? Number(values.portGroup) : undefined,
        detailedLocation: values.detailedLocation || undefined,
        portClass: values.portClass != null ? Number(values.portClass) : undefined,
        waterAreaScope: values.waterAreaScope || undefined,
        totalBerths: values.totalBerths != null ? Number(values.totalBerths) : null,
        totalAnchoragesTransshipment: values.totalAnchoragesTransshipment != null ? Number(values.totalAnchoragesTransshipment) : null,
        totalPublicChannels: values.totalPublicChannels != null ? Number(values.totalPublicChannels) : null,
        totalDedicatedChannels: values.totalDedicatedChannels != null ? Number(values.totalDedicatedChannels) : null,
        totalPublicChannelsLength: values.totalPublicChannelsLength != null ? Number(values.totalPublicChannelsLength) : null,
        totalDedicatedChannelsLength: values.totalDedicatedChannelsLength != null ? Number(values.totalDedicatedChannelsLength) : null,
        totalBuoysBeacons: values.totalBuoysBeacons != null ? Number(values.totalBuoysBeacons) : null,
        totalDikes: values.totalDikes != null ? Number(values.totalDikes) : null,
        totalDikeLength: values.totalDikeLength != null ? Number(values.totalDikeLength) : null,
        totalLighthouses: values.totalLighthouses != null ? Number(values.totalLighthouses) : null,
        buoyBerthCount: values.buoyBerthCount != null ? Number(values.buoyBerthCount) : null,
        anchorageCount: values.anchorageCount != null ? Number(values.anchorageCount) : null,
        transshipmentCount: values.transshipmentCount != null ? Number(values.transshipmentCount) : null,
        otherWaterAreas: values.otherWaterAreas || undefined,
        remarks: values.remarks || undefined,
        notes: values.notes || undefined,
        portCoordinates: createCoords.map((c, idx) => ({ ...c, sortOrder: idx + 1 })),
        portInfrastructures: createInfras.map((c, idx) => ({ ...c, sequenceNumber: idx + 1 })),
      };
      await portCRUD.create(payload as any);
      toast.success('Tạo cảng biển thành công');
      setCreateModalVisible(false);
      fetchData();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) {
        // validation
      } else {
        toast.error(err instanceof Error ? err.message : 'Tạo cảng biển thất bại');
      }
    } finally {
      setSubmitting(false);
    }
  }, [createForm, createCoords, createInfras, fetchData]);

  const openUpdateModal = useCallback(async (record: Port) => {
    updateForm.resetFields();
    setSelectedRecord(record);
    updateForm.setFieldsValue({
      portName: record.portName,
      province: record.province || undefined,
      area: record.area ?? undefined,
      orgUnitId: record.orgUnitId || undefined,
      managingUnitId: record.managingUnitId || undefined,
      portGroup: record.portGroup ?? undefined,
      detailedLocation: record.detailedLocation || record.diaDiemChiTiet || undefined,
      portClass: record.portClass ?? record.phanCap ?? undefined,
      waterAreaScope: record.waterAreaScope || record.phamViVungNuoc || undefined,
      totalBerths: record.totalBerth ?? record.tongSoBenCang ?? undefined,
      totalAnchoragesTransshipment: record.totalAnchorageTransshipment ?? record.tongSoKhuNeoDauChuyenTai ?? undefined,
      totalPublicChannels: record.totalPublicChannel ?? record.tongSoTuyenLuongCongCong ?? undefined,
      totalDedicatedChannels: record.totalDedicatedChannel ?? record.tongSoTuyenLuongChuyenDung ?? undefined,
      totalPublicChannelsLength: record.totalPublicChannelLength ?? record.tongChieuDaiLuongCongCong ?? undefined,
      totalDedicatedChannelsLength: record.totalDedicatedChannelLength ?? record.tongChieuDaiLuongChuyenDung ?? undefined,
      totalBuoysBeacons: record.totalBeaconMarker ?? record.tongSoPhaoTieuBaoHieu ?? undefined,
      totalDikes: record.totalDikeRevetment ?? record.tongSoDeKe ?? undefined,
      totalDikeLength: record.totalDikeRevetmentLength ?? record.tongChieuDaiDeKe ?? undefined,
      totalLighthouses: record.totalLighthouseBeacon ?? record.tongSoDenBienDangTieu ?? undefined,
      buoyBerthCount: record.buoyBerthCount ?? record.quantityBenPhao ?? undefined,
      anchorageCount: record.anchorageCount ?? record.quantityKhuNeoDau ?? undefined,
      transshipmentCount: record.transshipmentCount ?? record.quantityKhuChuyenTai ?? undefined,
      otherWaterAreas: record.otherWaterAreas || record.cacKhuNuocKhac || undefined,
      remarks: record.remarks || undefined,
      notes: record.notes || undefined,
    });
    if (record.portCoordinates) {
      setUpdateCoords(record.portCoordinates.map(c => ({ latitude: c.latitude, longitude: c.longitude })));
    } else {
      setUpdateCoords([]);
    }
    if (record.portInfrastructures) {
      setUpdateInfras(record.portInfrastructures.map(c => ({
        sequenceNumber: c.sequenceNumber,
        infrastructureName: c.infrastructureName,
        quantity: c.quantity,
      })));
    } else {
      setUpdateInfras([]);
    }
    setUpdateModalVisible(true);
  }, [updateForm]);

  const handleUpdate = useCallback(async () => {
    if (!selectedRecord) return;
    try {
      const values = await updateForm.validateFields();
      setSubmitting(true);
      const payload: any = {
        id: selectedRecord.id,
        portName: values.portName || undefined,
        province: values.province || undefined,
        area: values.area != null ? Number(values.area) : undefined,
        orgUnitId: values.orgUnitId || undefined,
        managingUnitId: values.managingUnitId || undefined,
        portGroup: values.portGroup ? Number(values.portGroup) : undefined,
        detailedLocation: values.detailedLocation || undefined,
        portClass: values.portClass != null ? Number(values.portClass) : undefined,
        waterAreaScope: values.waterAreaScope || undefined,
        totalBerths: values.totalBerths != null ? Number(values.totalBerths) : null,
        totalAnchoragesTransshipment: values.totalAnchoragesTransshipment != null ? Number(values.totalAnchoragesTransshipment) : null,
        totalPublicChannels: values.totalPublicChannels != null ? Number(values.totalPublicChannels) : null,
        totalDedicatedChannels: values.totalDedicatedChannels != null ? Number(values.totalDedicatedChannels) : null,
        totalPublicChannelsLength: values.totalPublicChannelsLength != null ? Number(values.totalPublicChannelsLength) : null,
        totalDedicatedChannelsLength: values.totalDedicatedChannelsLength != null ? Number(values.totalDedicatedChannelsLength) : null,
        totalBuoysBeacons: values.totalBuoysBeacons != null ? Number(values.totalBuoysBeacons) : null,
        totalDikes: values.totalDikes != null ? Number(values.totalDikes) : null,
        totalDikeLength: values.totalDikeLength != null ? Number(values.totalDikeLength) : null,
        totalLighthouses: values.totalLighthouses != null ? Number(values.totalLighthouses) : null,
        buoyBerthCount: values.buoyBerthCount != null ? Number(values.buoyBerthCount) : null,
        anchorageCount: values.anchorageCount != null ? Number(values.anchorageCount) : null,
        transshipmentCount: values.transshipmentCount != null ? Number(values.transshipmentCount) : null,
        otherWaterAreas: values.otherWaterAreas || undefined,
        remarks: values.remarks || undefined,
        notes: values.notes || undefined,
        portCoordinates: updateCoords.map((c, idx) => ({ ...c, sortOrder: idx + 1 })),
        portInfrastructures: updateInfras.map((c, idx) => ({ ...c, sequenceNumber: idx + 1 })),
      };
      await portCRUD.update(payload as any);
      toast.success('Cập nhật cảng biển thành công');
      setUpdateModalVisible(false);
      fetchData();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) {
        // validation
      } else {
        toast.error(err instanceof Error ? err.message : 'Cập nhật thất bại');
      }
    } finally {
      setSubmitting(false);
    }
  }, [selectedRecord, updateForm, updateCoords, updateInfras, fetchData]);

  const handleDelete = useCallback(async (record: Port) => {
    try {
      const children = await portCRUD.getChildren(record.id);
      if (children.berths > 0 || children.waterZones > 0) {
        toast.error(`Cảng này có ${children.berths} bến cảng và ${children.waterZones} vùng nước liên kết, không thể xóa`);
        return;
      }
    } catch {
      // allow
    }
    Modal.confirm({
      title: 'Xác nhận xóa cảng biển',
      content: (
        <div>
          <p>Bạn có chắc muốn xóa cảng biển <strong>{record.portName}</strong> (mã: {record.portCode})?</p>
          <p style={{ color: textTertiary, fontSize: fontSizeSm }}>Dữ liệu sẽ được xóa mềm (soft-delete).</p>
        </div>
      ),
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await portCRUD.delete(record.id);
          toast.success('Đã xóa thành công');
          fetchData();
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
        }
      },
    });
  }, [fetchData]);

  const handleApprove = useCallback(async (record: Port) => {
    Modal.confirm({
      title: 'Xác nhận phê duyệt',
      content: `Phê duyệt cảng biển "${record.portName}"?`,
      okText: 'Phê duyệt',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await portApproval.approve(record.id);
          toast.success('Phê duyệt thành công');
          fetchData();
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
        }
      },
    });
  }, [fetchData]);

  const handleReject = useCallback(async (record: Port) => {
    const reason = window.prompt('Lý do từ chối (tối thiểu 10 ký tự):', '');
    if (reason === null) return;
    if (reason.length < 10) { toast.error('Lý do từ chối tối thiểu 10 ký tự'); return; }
    try {
      await portApproval.reject(record.id, reason);
      toast.success('Đã từ chối');
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
    }
  }, [fetchData]);

  const handleSubmitApproval = useCallback(async (record: Port) => {
    try {
      await portApproval.approve(record.id);
      toast.success('Đã gửi duyệt cảng biển');
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gửi duyệt thất bại');
    }
  }, [fetchData]);

  const openDetailModal = useCallback(async (record: Port) => {
    setSelectedRecord(record);
    setDetailModalVisible(true);
  }, []);

  // Column render helpers
  const renderSTT = useCallback((_: any, __: any, idx: number) => (
    <span style={{ fontSize: fontSizeMd }}>{(page - 1) * pageSize + (idx as number) + 1}</span>
  ), [page, pageSize]);

  const renderDate = useCallback((v: string) => v
    ? <span style={{ color: textSecondary }}>{new Date(v).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
    : '—', []);

  const filterFields = useMemo(() => [
    { key: 'search', type: 'search' as const, label: 'Tìm kiếm', placeholder: 'Tìm theo mã, tên cảng...' },
    { key: 'province', type: 'select' as const, label: 'Tỉnh/Thành phố', placeholder: 'Chọn tỉnh/thành phố', options: VIETNAM_PROVINCES.map(p => ({ value: p, label: p })) },
  ], []);

  const headerActions = useMemo(() => [
    {
      key: 'create', label: 'Tạo mới', variant: 'primary' as const,
      icon: <PlusOutlined />, onClick: openCreateModal,
    },
    {
      key: 'export', label: 'Xuất Excel', variant: 'subtle' as const,
      icon: <FileExcelOutlined style={{ color: statusOperational }} />,
      borderColor: `${statusOperational}80`, color: statusOperational,
      onClick: () => {},
    },
  ], [openCreateModal]);

  const columns: any = useMemo(() => [
    { key: 'sequenceNo', label: 'STT', width: 60, type: 'mono' as const, align: 'center' as const, render: renderSTT },
    { key: 'portCode', label: 'Mã cảng', dataIndex: 'portCode', width: 140, render: (portCode: string) => <Tag color="cyan">{portCode}</Tag> },
    { key: 'portName', label: 'Tên', dataIndex: 'portName', ellipsis: true },
    { key: 'province', label: 'Tỉnh/TP', dataIndex: 'province', width: 150, render: (v: string) => v || '—' },
    { key: 'latitude', label: 'Vĩ độ', width: 120, render: (_: any, record: Port) => {
      const lat = (record as any).latitude;
      return <span style={{ color: textSecondary, fontFamily: 'monospace' }}>{lat != null ? (lat >= 0 ? `+${lat.toFixed(6)}` : lat.toFixed(6)) : '—'}</span>;
    }},
    { key: 'longitude', label: 'Kinh độ', width: 120, render: (_: any, record: Port) => {
      const lng = (record as any).longitude;
      return <span style={{ color: textSecondary, fontFamily: 'monospace' }}>{lng != null ? (lng >= 0 ? `+${lng.toFixed(6)}` : lng.toFixed(6)) : '—'}</span>;
    }},
    { key: 'area', label: 'Diện tích', dataIndex: 'area', width: 100, render: (v: number) => v != null ? <span style={{ color: textSecondary }}>{v.toFixed(2)}</span> : '—' },
    { key: 'portStatus', label: 'Trạng thái', dataIndex: 'portStatus', width: 150, align: 'center' as const, render: (status: string) => renderPortStatus(status) },
    { key: 'createdAt', label: 'Ngày tạo', dataIndex: 'createdAt', width: 160, align: 'center' as const, render: renderDate },
  ], [renderSTT, renderDate]);

  const rowActions = useCallback((record: Port) => {
    const actions: { key: string; label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean }[] = [];
    const status = record.portStatus || '';
    actions.push({ key: 'view', label: 'Xem chi tiết', icon: <EyeOutlined />, onClick: () => openDetailModal(record) });
    if (status !== 'DA_XOA') actions.push({ key: 'edit', label: 'Sửa', icon: <EditOutlined />, onClick: () => openUpdateModal(record) });
    if (status === 'NHAP') {
      actions.push({ key: 'submit', label: 'Gửi duyệt', icon: <SendOutlined />, onClick: () => handleSubmitApproval(record) });
      actions.push({ key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, danger: true, onClick: () => handleDelete(record) });
    }
    if (status === 'CHO_PHE_DUYET') {
      actions.push({ key: 'approve', label: 'Phê duyệt', icon: <CheckCircleOutlined />, onClick: () => handleApprove(record) });
      actions.push({ key: 'reject', label: 'Từ chối', icon: <CloseCircleOutlined />, danger: true, onClick: () => handleReject(record) });
    }
    return actions;
  }, [openDetailModal, openUpdateModal, handleSubmitApproval, handleDelete, handleApprove, handleReject]);

  const statusTabs = useMemo(() => [
    { key: 'all', label: 'Tất cả', count: total, color: actionPrimary, active: activeStatusTab === '' },
    { key: 'NHAP', label: 'Nháp', count: 0, color: getStatusColor('NHAP'), active: activeStatusTab === 'NHAP' },
    { key: 'CHO_PHE_DUYET', label: 'Chờ duyệt', count: 0, color: getStatusColor('CHO_PHE_DUYET'), active: activeStatusTab === 'CHO_PHE_DUYET' },
    { key: 'DA_PHE_DUYET', label: 'Đã duyệt', count: 0, color: getStatusColor('DA_PHE_DUYET'), active: activeStatusTab === 'DA_PHE_DUYET' },
    { key: 'TU_CHOI', label: 'Từ chối', count: 0, color: getStatusColor('TU_CHOI'), active: activeStatusTab === 'TU_CHOI' },
    { key: 'TAM_NGUNG', label: 'Tạm ngừng', count: 0, color: getStatusColor('TAM_NGUNG'), active: activeStatusTab === 'TAM_NGUNG' },
  ], [total, activeStatusTab]);

  const renderContent = () => {
    if (isLoading) return <LoadingSkeleton rows={8} />;
    if (isError) return <ErrorState message={error?.message || 'Không thể tải danh sách cảng biển'} onRetry={fetchData} />;
    if (dataSource.length === 0) {
      if (search || filterProvince || filterStatus) return <EmptyState description="Không tìm thấy cảng biển nào phù hợp" />;
      return <EmptyState description="Chưa có cảng biển nào" />;
    }
    return (
      <div style={{ overflowX: 'auto' }}>
        <DataTable columns={columns} dataSource={dataSource} rowKey="id" rowActions={rowActions} scroll={{ x: 1300 }} />
        <Pagination total={total} current={page} pageSize={pageSize} onChange={(p, ps) => { setPage(p); setPageSize(ps); }} />
      </div>
    );
  };

  const renderCoordinateSubForm = (
    coords: Array<{ latitude: number; longitude: number }>,
    setCoords: React.Dispatch<React.SetStateAction<Array<{ latitude: number; longitude: number }>>>,
  ) => (
    <div style={{ marginBottom: spaceFormField }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ color: textPrimary, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tọa độ GPS</span>
        <Button size="small" onClick={() => setCoords([...coords, { latitude: 0, longitude: 0 }])}
          style={{ borderRadius: radiusPill, height: 32, fontSize: fontSizeSm }}>+ Thêm</Button>
      </div>
      {coords.length === 0 && <span style={{ color: textTertiary, fontSize: fontSizeSm }}>Chưa có tọa độ</span>}
      {coords.map((c, idx) => (
        <Row key={idx} gutter={8} style={{ marginBottom: 4 }} align="middle">
          <Col flex="20px"><span style={{ color: textTertiary, fontSize: fontSizeSm }}>{idx + 1}.</span></Col>
          <Col flex="1 1 200px">
            <InputNumber value={c.latitude} onChange={(val) => {
              const n = [...coords]; n[idx] = { ...n[idx], latitude: val ?? 0 }; setCoords(n);
            }} placeholder="Vĩ độ" min={-90} max={90} step={0.000001} style={numberInputStyle} size="small" />
          </Col>
          <Col flex="1 1 200px">
            <InputNumber value={c.longitude} onChange={(val) => {
              const n = [...coords]; n[idx] = { ...n[idx], longitude: val ?? 0 }; setCoords(n);
            }} placeholder="Kinh độ" min={-180} max={180} step={0.000001} style={numberInputStyle} size="small" />
          </Col>
          <Col flex="60px">
            <Button danger size="small" onClick={() => setCoords(coords.filter((_, i) => i !== idx))}
              style={{ borderRadius: radiusPill, height: 32, fontSize: fontSizeSm }}>Xóa</Button>
          </Col>
        </Row>
      ))}
    </div>
  );

  const renderInfrastructureSubForm = (
    infras: Array<{ sequenceNumber: number; infrastructureName: string; quantity: number }>,
    setInfras: React.Dispatch<React.SetStateAction<Array<{ sequenceNumber: number; infrastructureName: string; quantity: number }>>>,
  ) => (
    <div style={{ marginBottom: spaceFormField }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ color: textPrimary, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Công trình KCHT</span>
        <Button size="small" onClick={() => setInfras([...infras, { sequenceNumber: infras.length + 1, infrastructureName: '', quantity: 1 }])}
          style={{ borderRadius: radiusPill, height: 32, fontSize: fontSizeSm }}>+ Thêm</Button>
      </div>
      {infras.length === 0 && <span style={{ color: textTertiary, fontSize: fontSizeSm }}>Chưa có công trình</span>}
      {infras.map((inf, idx) => (
        <Row key={idx} gutter={8} style={{ marginBottom: 4 }} align="middle">
          <Col flex="20px"><span style={{ color: textTertiary, fontSize: fontSizeSm }}>{idx + 1}.</span></Col>
          <Col flex="1 1 250px">
            <Input value={inf.infrastructureName} onChange={(e) => {
              const n = [...infras]; n[idx] = { ...n[idx], infrastructureName: e.target.value }; setInfras(n);
            }} placeholder="Tên công trình" style={inputStyle} size="small" />
          </Col>
          <Col flex="0 0 120px">
            <InputNumber value={inf.quantity} onChange={(val) => {
              const n = [...infras]; n[idx] = { ...n[idx], quantity: val ?? 1 }; setInfras(n);
            }} placeholder="SL" min={1} style={numberInputStyle} size="small" />
          </Col>
          <Col flex="60px">
            <Button danger size="small" onClick={() => setInfras(infras.filter((_, i) => i !== idx))}
              style={{ borderRadius: radiusPill, height: 32, fontSize: fontSizeSm }}>Xóa</Button>
          </Col>
        </Row>
      ))}
    </div>
  );

  return (
    <div style={{ minHeight: '100%', marginTop: -8 }}>
      <ScreenHeader breadcrumb={[{ label: 'Quản lý cảng biển' }]} actions={headerActions} />
      <FilterBar fields={filterFields} onSearch={handleSearch} onReset={handleFilterReset} />
      <div style={{ ...cardStyle, marginBottom: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '8px 16px' }}>
        <StatusTabs tabs={statusTabs} onChange={handleStatusTabChange} />
      </div>
      <div style={{ ...cardStyle, padding: '8px 16px' }}>{renderContent()}</div>

      {/* Create Modal */}
      <Modal
        title={<span style={{ color: textPrimary, fontWeight: fontWeightBold, fontSize: 15 }}>Tạo mới Cảng biển</span>}
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={900}
        forceRender
      >
        <Form form={createForm} layout="vertical">
          <Typography.Text strong style={{ display: 'block', marginBottom: 8, color: textPrimary }}>1. Thông tin chung</Typography.Text>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="managingUnitId" {...labelProps('Đơn vị quản lý')} style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Chọn đơn vị quản lý" allowClear style={selectStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="portGroup" {...labelProps('Nhóm cảng biển')} style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Chọn nhóm" allowClear options={[{ label: 'Nhóm 1', value: 1 }, { label: 'Nhóm 2', value: 2 }, { label: 'Nhóm 3', value: 3 }]} style={selectStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="portName" {...labelProps('Tên cảng *')} style={{ marginBottom: spaceFormField }}
                rules={[{ required: true, message: 'Tên cảng không được để trống' }, { max: 255 }]}>
                <Input placeholder="VD: Cảng biển Hải Phòng" maxLength={255} style={inputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="province" {...labelProps('Tỉnh/TP')} style={{ marginBottom: spaceFormField }}>
                <Select showSearch placeholder="Chọn tỉnh/thành phố..."
                  filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                  options={VIETNAM_PROVINCES.map(p => ({ value: p, label: p }))} style={selectStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="detailedLocation" {...labelProps('Địa điểm chi tiết')} style={{ marginBottom: spaceFormField }}>
                <Input placeholder="VD: Xã Đình Vũ, Quận Hải An" maxLength={500} style={inputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="portClass" {...labelProps('Phân cấp')} style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Chọn phân cấp" allowClear
                  options={[{ label: 'Loại I', value: 1 }, { label: 'Loại II', value: 2 }, { label: 'Loại III', value: 3 }]}
                  style={selectStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="waterAreaScope" {...labelProps('Phạm vi vùng nước')} style={{ marginBottom: spaceFormField }}>
                <Input.TextArea rows={2} placeholder="Mô tả phạm vi vùng nước" maxLength={2000} style={{ borderRadius: radiusPill }} />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Text strong style={{ display: 'block', marginBottom: 8, marginTop: 16, color: textPrimary }}>2. Chỉ số tổng hợp</Typography.Text>
          <Row gutter={16}>
            <Col span={6}><Form.Item name="totalBerths" {...labelProps('Tổng số bến')} style={{ marginBottom: spaceFormField }}>
              <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
            <Col span={6}><Form.Item name="totalAnchoragesTransshipment" {...labelProps('Khu neo đậu/chuyển tải')} style={{ marginBottom: spaceFormField }}>
              <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
            <Col span={6}><Form.Item name="totalPublicChannels" {...labelProps('Luồng công cộng')} style={{ marginBottom: spaceFormField }}>
              <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
            <Col span={6}><Form.Item name="totalDedicatedChannels" {...labelProps('Luồng chuyên dùng')} style={{ marginBottom: spaceFormField }}>
              <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}><Form.Item name="totalPublicChannelsLength" {...labelProps('Dài luồng CC (m)')} style={{ marginBottom: spaceFormField }}>
              <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
            <Col span={6}><Form.Item name="totalDedicatedChannelsLength" {...labelProps('Dài luồng CD (m)')} style={{ marginBottom: spaceFormField }}>
              <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
            <Col span={6}><Form.Item name="totalBuoysBeacons" {...labelProps('Phao tiêu/báo hiệu')} style={{ marginBottom: spaceFormField }}>
              <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
            <Col span={6}><Form.Item name="totalDikes" {...labelProps('Đê/kè')} style={{ marginBottom: spaceFormField }}>
              <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}><Form.Item name="totalDikeLength" {...labelProps('Dài đê/kè (m)')} style={{ marginBottom: spaceFormField }}>
              <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
            <Col span={6}><Form.Item name="totalLighthouses" {...labelProps('Đèn biển/đăng/tiêu')} style={{ marginBottom: spaceFormField }}>
              <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
            <Col span={6}><Form.Item name="buoyBerthCount" {...labelProps('Bến phao')} style={{ marginBottom: spaceFormField }}>
              <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
            <Col span={6}><Form.Item name="anchorageCount" {...labelProps('Khu neo đậu')} style={{ marginBottom: spaceFormField }}>
              <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}><Form.Item name="transshipmentCount" {...labelProps('Khu chuyển tải')} style={{ marginBottom: spaceFormField }}>
              <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
            <Col span={6}><Form.Item name="otherWaterAreas" {...labelProps('Khu nước khác')} style={{ marginBottom: spaceFormField }}>
              <Input placeholder="Mô tả" maxLength={2000} style={inputStyle} /></Form.Item></Col>
            <Col span={6}><Form.Item name="area" {...labelProps('Diện tích')} style={{ marginBottom: spaceFormField }}>
              <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
            <Col span={6}><Form.Item name="maxVesselCapacity" {...labelProps('Sức chứa (DWT)')} style={{ marginBottom: spaceFormField }}>
              <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
          </Row>

          <Typography.Text strong style={{ display: 'block', marginBottom: 8, marginTop: 16, color: textPrimary }}>3. Thông tin GIS</Typography.Text>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="loaiHinhHoc" {...labelProps('Loại đối tượng')} style={{ marginBottom: spaceFormField }}>
              <Select placeholder="Chọn loại" allowClear
                options={[{ value: 'POINT', label: 'Điểm' }, { value: 'LINE', label: 'Đường' }, { value: 'POLYGON', label: 'Vùng' }]}
                style={selectStyle} /></Form.Item></Col>
            <Col span={8}><Form.Item name="coordinateSystem" {...labelProps('Hệ quy chiếu')} style={{ marginBottom: spaceFormField }}>
              <InputNumber min={0} step={1} precision={0} placeholder="4326" style={numberInputStyle} /></Form.Item></Col>
            <Col span={8}><Form.Item name="displayRule" {...labelProps('Quy tắc hiển thị')} style={{ marginBottom: spaceFormField }}>
              <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
          </Row>

          <Typography.Text strong style={{ display: 'block', marginBottom: 8, marginTop: 16, color: textPrimary }}>4. Tọa độ GPS</Typography.Text>
          {renderCoordinateSubForm(createCoords, setCreateCoords)}

          <Typography.Text strong style={{ display: 'block', marginBottom: 8, marginTop: 16, color: textPrimary }}>5. Công trình KCHT</Typography.Text>
          {renderInfrastructureSubForm(createInfras, setCreateInfras)}

          <Typography.Text strong style={{ display: 'block', marginBottom: 8, marginTop: 16, color: textPrimary }}>6. Ghi chú</Typography.Text>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="notes" style={{ marginBottom: spaceFormField }}>
                <Input.TextArea rows={2} placeholder="Ghi chú" maxLength={2000} style={{ borderRadius: radiusPill }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="remarks" style={{ marginBottom: spaceFormField }}>
                <Input.TextArea rows={2} placeholder="Nhận xét / đánh giá" maxLength={2000} style={{ borderRadius: radiusPill }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 24, marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCreateModalVisible(false)}
                style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={submitting} onClick={handleCreate}
                style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>
                Tạo mới & Gửi duyệt
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Update Modal */}
      <Modal
        title={selectedRecord ? `Chỉnh sửa: ${selectedRecord.portCode} — ${selectedRecord.portName}` : 'Chỉnh sửa cảng biển'}
        open={updateModalVisible}
        onCancel={() => setUpdateModalVisible(false)}
        footer={null}
        width={900}
        forceRender
      >
        <Form form={updateForm} layout="vertical" onFinish={handleUpdate}>
          <Typography.Text strong style={{ display: 'block', marginBottom: 8, color: textPrimary }}>1. Thông tin chung</Typography.Text>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="managingUnitId" {...labelProps('Đơn vị quản lý')} style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Chọn đơn vị quản lý" allowClear style={selectStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="portGroup" {...labelProps('Nhóm cảng biển')} style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Chọn nhóm" allowClear options={[{ label: 'Nhóm 1', value: 1 }, { label: 'Nhóm 2', value: 2 }, { label: 'Nhóm 3', value: 3 }]} style={selectStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="portName" {...labelProps('Tên cảng')} style={{ marginBottom: spaceFormField }}
                rules={[{ required: true, message: 'Tên cảng không được để trống' }, { max: 255 }]}>
                <Input placeholder="VD: Cảng biển Hải Phòng" maxLength={255} style={inputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="province" {...labelProps('Tỉnh/TP')} style={{ marginBottom: spaceFormField }}>
                <Select showSearch placeholder="Chọn tỉnh/thành phố..."
                  filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                  options={VIETNAM_PROVINCES.map(p => ({ value: p, label: p }))} style={selectStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="detailedLocation" {...labelProps('Địa điểm chi tiết')} style={{ marginBottom: spaceFormField }}>
                <Input placeholder="VD: Xã Đình Vũ, Quận Hải An" maxLength={500} style={inputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="portClass" {...labelProps('Phân cấp')} style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Chọn phân cấp" allowClear
                  options={[{ label: 'Loại I', value: 1 }, { label: 'Loại II', value: 2 }, { label: 'Loại III', value: 3 }]}
                  style={selectStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="waterAreaScope" {...labelProps('Phạm vi vùng nước')} style={{ marginBottom: spaceFormField }}>
                <Input.TextArea rows={2} placeholder="Mô tả phạm vi vùng nước" maxLength={2000} style={{ borderRadius: radiusPill }} />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Text strong style={{ display: 'block', marginBottom: 8, marginTop: 16, color: textPrimary }}>2. Chỉ số tổng hợp</Typography.Text>
          <Row gutter={16}>
            <Col span={6}><Form.Item name="totalBerths" {...labelProps('Tổng số bến')} style={{ marginBottom: spaceFormField }}>
              <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
            <Col span={6}><Form.Item name="totalAnchoragesTransshipment" {...labelProps('Khu neo đậu/chuyển tải')} style={{ marginBottom: spaceFormField }}>
              <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
            <Col span={6}><Form.Item name="totalPublicChannels" {...labelProps('Luồng công cộng')} style={{ marginBottom: spaceFormField }}>
              <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
            <Col span={6}><Form.Item name="totalDedicatedChannels" {...labelProps('Luồng chuyên dùng')} style={{ marginBottom: spaceFormField }}>
              <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}><Form.Item name="totalPublicChannelsLength" {...labelProps('Dài luồng CC (m)')} style={{ marginBottom: spaceFormField }}>
              <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
            <Col span={6}><Form.Item name="totalDedicatedChannelsLength" {...labelProps('Dài luồng CD (m)')} style={{ marginBottom: spaceFormField }}>
              <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
            <Col span={6}><Form.Item name="totalBuoysBeacons" {...labelProps('Phao tiêu/báo hiệu')} style={{ marginBottom: spaceFormField }}>
              <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
            <Col span={6}><Form.Item name="totalDikes" {...labelProps('Đê/kè')} style={{ marginBottom: spaceFormField }}>
              <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}><Form.Item name="totalDikeLength" {...labelProps('Dài đê/kè (m)')} style={{ marginBottom: spaceFormField }}>
              <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
            <Col span={6}><Form.Item name="totalLighthouses" {...labelProps('Đèn biển/đăng/tiêu')} style={{ marginBottom: spaceFormField }}>
              <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
            <Col span={6}><Form.Item name="buoyBerthCount" {...labelProps('Bến phao')} style={{ marginBottom: spaceFormField }}>
              <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
            <Col span={6}><Form.Item name="anchorageCount" {...labelProps('Khu neo đậu')} style={{ marginBottom: spaceFormField }}>
              <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}><Form.Item name="transshipmentCount" {...labelProps('Khu chuyển tải')} style={{ marginBottom: spaceFormField }}>
              <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
            <Col span={6}><Form.Item name="otherWaterAreas" {...labelProps('Khu nước khác')} style={{ marginBottom: spaceFormField }}>
              <Input placeholder="Mô tả" maxLength={2000} style={inputStyle} /></Form.Item></Col>
            <Col span={6}><Form.Item name="area" {...labelProps('Diện tích')} style={{ marginBottom: spaceFormField }}>
              <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
            <Col span={6}><Form.Item name="maxVesselCapacity" {...labelProps('Sức chứa (DWT)')} style={{ marginBottom: spaceFormField }}>
              <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
          </Row>

          <Typography.Text strong style={{ display: 'block', marginBottom: 8, marginTop: 16, color: textPrimary }}>3. Thông tin GIS</Typography.Text>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="loaiHinhHoc" {...labelProps('Loại đối tượng')} style={{ marginBottom: spaceFormField }}>
              <Select placeholder="Chọn loại" allowClear
                options={[{ value: 'POINT', label: 'Điểm' }, { value: 'LINE', label: 'Đường' }, { value: 'POLYGON', label: 'Vùng' }]}
                style={selectStyle} /></Form.Item></Col>
            <Col span={8}><Form.Item name="coordinateSystem" {...labelProps('Hệ quy chiếu')} style={{ marginBottom: spaceFormField }}>
              <InputNumber min={0} step={1} precision={0} placeholder="4326" style={numberInputStyle} /></Form.Item></Col>
            <Col span={8}><Form.Item name="displayRule" {...labelProps('Quy tắc hiển thị')} style={{ marginBottom: spaceFormField }}>
              <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
          </Row>

          <Typography.Text strong style={{ display: 'block', marginBottom: 8, marginTop: 16, color: textPrimary }}>4. Tọa độ GPS</Typography.Text>
          {renderCoordinateSubForm(updateCoords, setUpdateCoords)}

          <Typography.Text strong style={{ display: 'block', marginBottom: 8, marginTop: 16, color: textPrimary }}>5. Công trình KCHT</Typography.Text>
          {renderInfrastructureSubForm(updateInfras, setUpdateInfras)}

          <Typography.Text strong style={{ display: 'block', marginBottom: 8, marginTop: 16, color: textPrimary }}>6. Ghi chú</Typography.Text>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="notes" style={{ marginBottom: spaceFormField }}>
                <Input.TextArea rows={2} placeholder="Ghi chú" maxLength={2000} style={{ borderRadius: radiusPill }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="remarks" style={{ marginBottom: spaceFormField }}>
                <Input.TextArea rows={2} placeholder="Nhận xét / đánh giá" maxLength={2000} style={{ borderRadius: radiusPill }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 24, marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setUpdateModalVisible(false)}
                style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={submitting}
                style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>
                Cập nhật
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title={selectedRecord ? `Chi tiết cảng: ${selectedRecord.portCode} — ${selectedRecord.portName}` : 'Chi tiết cảng biển'}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>
            Đóng
          </Button>,
        ]}
        width={800}
      >
        {selectedRecord && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ color: textTertiary, fontSize: fontSizeSm }}>Trạng thái: </span>
                  {renderPortStatus(selectedRecord.portStatus)}
                </div>
              </Col>
              <Col span={12}>
                <Typography.Text strong>Mã cảng:</Typography.Text><br />
                <Tag color="cyan">{selectedRecord.portCode}</Tag>
              </Col>
              <Col span={12}>
                <Typography.Text strong>Tên cảng:</Typography.Text><br />
                <Typography.Text>{selectedRecord.portName}</Typography.Text>
              </Col>
              <Col span={12}>
                <Typography.Text strong>Tỉnh/Thành phố:</Typography.Text><br />
                <Typography.Text>{selectedRecord.province || '—'}</Typography.Text>
              </Col>
              <Col span={12}>
                <Typography.Text strong>Diện tích:</Typography.Text><br />
                <Typography.Text>{selectedRecord.area != null ? `${selectedRecord.area.toFixed(2)} km²` : '—'}</Typography.Text>
              </Col>
              <Col span={24}>
                <Typography.Text strong>Ghi chú:</Typography.Text><br />
                <Typography.Text>{selectedRecord.notes || selectedRecord.remarks || '—'}</Typography.Text>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
}

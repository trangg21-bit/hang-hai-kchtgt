import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Space
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import {
  fetchCospasSarsatList,
  createCospasSarsat,
  updateCospasSarsat,
  deleteCospasSarsat,
  submitCospasSarsat,
  approveCospasSarsatL1,
  approveCospasSarsatL2,
  rejectCospasSarsat,
} from '../../services/station/api';
import type {
  CoastalStationCospasSarsatRequest,
  CoastalStationCospasSarsatResponse,
} from '../../services/station/types';
import { colors } from '../../theme';
import { fontWeightBold, fontSizeMd, fontSizeLg, radiusPill, spaceFormField } from '../../tokens';
import { ScreenHeader, FilterBar, DataTable, Pagination } from '../../components/list-view';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import { usePermissionStore } from '../../store/permissionStore';
import toast, { message, modal } from '../../components/ToastNotification';

const { confirm } = modal;

const labelProps = (text: string) => ({
  label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

export default function CospasSarsatStationList() {
  const [dataSource, setDataSource] = useState<CoastalStationCospasSarsatResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchText, setSearchText] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CoastalStationCospasSarsatResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // Phê duyệt 2 cấp
  const [rejectingItem, setRejectingItem] = useState<CoastalStationCospasSarsatResponse | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approving, setApproving] = useState(false);

  const hasPerm = usePermissionStore((s: any) => s.hasPermission);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchCospasSarsatList({ keyword: searchText ? searchText.trim() : undefined });
      setDataSource(list);
    } catch (err: any) {
      message.error(err.message || 'Không thể tải danh sách đài Cospas-Sarsat');
    } finally {
      setLoading(false);
    }
  }, [searchText]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pagedData = useMemo(
    () => dataSource.slice((page - 1) * pageSize, page * pageSize),
    [dataSource, page, pageSize],
  );

  const handleOpenModal = useCallback((record?: CoastalStationCospasSarsatResponse) => {
    if (record) {
      setEditingItem(record);
      form.setFieldsValue({
        stationCode: record.stationCode,
        stationName: record.stationName,
        frequency: record.frequency,
        coverageArea: record.coverageArea,
        beaconProtocol: record.beaconProtocol,
        emergencyChannel: record.emergencyChannel,
        antennaType: record.antennaType,
        locationAddress: record.locationAddress,
        contactPerson: record.contactPerson,
        contactPhone: record.contactPhone,
        signalRange: record.signalRange,
        operatingMode: record.operatingMode,
      });
    } else {
      setEditingItem(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  }, [form]);

  const handleCancel = useCallback(() => {
    setIsModalOpen(false);
    form.resetFields();
  }, [form]);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const payload = values as CoastalStationCospasSarsatRequest;

      if (editingItem) {
        await updateCospasSarsat(editingItem.id, payload);
        toast.success('Cập nhật đài Cospas-Sarsat thành công!');
      } else {
        await createCospasSarsat(payload);
        toast.success('Tạo mới đài Cospas-Sarsat thành công!');
      }

      setIsModalOpen(false);
      form.resetFields();
      loadData();
    } catch (err: any) {
      if (err.errorFields) return;
      toast.error(err.message || 'Lỗi khi lưu thông tin đài Cospas-Sarsat');
    } finally {
      setSubmitting(false);
    }
  }, [form, editingItem, loadData]);

  const confirmDelete = useCallback((record: CoastalStationCospasSarsatResponse) => {
    confirm({
      title: 'Xác nhận xóa đài Cospas-Sarsat',
      icon: <ExclamationCircleOutlined />,
      content: `Bạn có chắc chắn muốn xóa đài "${record.stationName}"? Hành động này không thể hoàn tác.`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await deleteCospasSarsat(record.id);
          toast.success('Xóa đài thành công!');
          loadData();
        } catch (err: any) {
          toast.error(err.message || 'Lỗi khi xóa đài Cospas-Sarsat');
        }
      },
    });
  }, [loadData]);

  // --- Phê duyệt 2 cấp (docs/conventions/approval-2-level-spec.md) ---
  const handleSubmitApproval = useCallback(async (record: CoastalStationCospasSarsatResponse) => {
    try {
      await submitCospasSarsat(record.id);
      toast.success('Đã gửi phê duyệt');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Không gửi được phê duyệt');
    }
  }, [loadData]);

  const handleApprove = useCallback(async (record: CoastalStationCospasSarsatResponse) => {
    try {
      if (record.approvalStatus === 'APPROVED_LEVEL1') {
        await approveCospasSarsatL2(record.id);
        toast.success('Đã phê duyệt cấp Cục — hồ sơ có hiệu lực');
      } else {
        await approveCospasSarsatL1(record.id);
        toast.success('Đã phê duyệt cấp Cảng vụ/Chi cục — chuyển Cục duyệt');
      }
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Không phê duyệt được');
    }
  }, [loadData]);

  const confirmReject = useCallback(async () => {
    if (!rejectingItem) return;
    if (rejectReason.trim().length < 10) {
      message.error('Lý do từ chối phải có tối thiểu 10 ký tự');
      return;
    }
    setApproving(true);
    try {
      await rejectCospasSarsat(rejectingItem.id, rejectReason.trim());
      toast.success('Đã từ chối hồ sơ');
      setRejectingItem(null);
      setRejectReason('');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Không từ chối được hồ sơ');
    } finally {
      setApproving(false);
    }
  }, [rejectingItem, rejectReason, loadData]);

  const rowActions = useCallback((record: CoastalStationCospasSarsatResponse) => {
    const actions: { key: string; label: string; icon?: ReactNode; onClick: () => void; danger?: boolean; }[] = [];
    const st = record.approvalStatus || 'DRAFT';
    const isDraftOrReturned = st === 'DRAFT' || st === 'REJECTED_LEVEL1' || st === 'REJECTED_LEVEL2';
    const isPendingC1 = st === 'PENDING_APPROVAL';
    const isPendingC2 = st === 'APPROVED_LEVEL1';
    const canApproveC1 = hasPerm('coastalstationcospassarsat:approvec1') || hasPerm('coastalstationcospassarsat:approve');
    const canApproveC2 = hasPerm('coastalstationcospassarsat:approvec2') || hasPerm('coastalstationcospassarsat:approve');

    if (hasPerm('coastalstationcospassarsat:update')) {
      actions.push({ key: 'edit', label: 'Sửa', icon: <EditOutlined />, onClick: () => handleOpenModal(record) });
    }
    if (isDraftOrReturned && hasPerm('coastalstationcospassarsat:update')) {
      actions.push({ key: 'submit', label: 'Gửi phê duyệt', icon: <SendOutlined />, onClick: () => handleSubmitApproval(record) });
    }
    if ((isPendingC1 && canApproveC1) || (isPendingC2 && canApproveC2)) {
      actions.push({
        key: 'approve',
        label: isPendingC2 ? 'Phê duyệt (Cục)' : 'Phê duyệt (Cảng vụ/Chi cục)',
        icon: <CheckCircleOutlined />,
        onClick: () => handleApprove(record),
      });
      actions.push({
        key: 'reject',
        label: 'Từ chối',
        icon: <CloseCircleOutlined />,
        onClick: () => { setRejectingItem(record); setRejectReason(''); },
        danger: true,
      });
    }
    // Chỉ xóa được hồ sơ ở trạng thái Lưu tạm (quy tắc 11 — xóa mềm)
    if (st === 'DRAFT' && hasPerm('coastalstationcospassarsat:delete')) {
      actions.push({ key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, onClick: () => confirmDelete(record), danger: true });
    }
    return actions;
  }, [hasPerm, handleOpenModal, confirmDelete, handleSubmitApproval, handleApprove]);

  const columns = useMemo(() => [
    {
      key: 'sequenceNo', label: 'STT', width: 60, type: 'mono' as const, align: 'center' as const,
      render: (_: unknown, __: unknown, idx: number) => (
        <span style={{ fontSize: fontSizeMd }}>{(page - 1) * pageSize + idx + 1}</span>
      ),
    },
    { key: 'stationCode', label: 'Mã đài', dataIndex: 'stationCode' },
    { key: 'stationName', label: 'Tên đài Cospas-Sarsat', dataIndex: 'stationName' },
    { key: 'frequency', label: 'Tần số', dataIndex: 'frequency' },
    { key: 'coverageArea', label: 'Vùng phủ sóng', dataIndex: 'coverageArea' },
    { key: 'beaconProtocol', label: 'Giao thức phao báo', dataIndex: 'beaconProtocol' },
    { key: 'emergencyChannel', label: 'Kênh khẩn cấp', dataIndex: 'emergencyChannel' },
    { key: 'locationAddress', label: 'Địa chỉ lắp đặt', dataIndex: 'locationAddress' },
    { key: 'contactPerson', label: 'Người liên hệ', dataIndex: 'contactPerson' },
    {
      key: 'approvalStatus', label: 'Trạng thái phê duyệt', dataIndex: 'approvalStatus',
      render: (st: string) => <ApprovalStatusBadge status={st || 'DRAFT'} />,
    },
  ], [page, pageSize]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <ScreenHeader
        breadcrumb={[{ label: 'Quản lý nhà trạm' }, { label: 'Đài Cospas-Sarsat' }]}
        actions={[
          ...(hasPerm('coastalstationcospassarsat:create') ? [{
            key: 'create',
            label: 'Thêm đài Cospas-Sarsat',
            variant: 'primary' as const,
            onClick: () => handleOpenModal(),
          }] : []),
        ]}
      />

      <FilterBar
        fields={[
          { key: 'search', type: 'search', label: 'Tìm kiếm', placeholder: 'Mã đài, tên đài...' },
        ]}
        onSearch={(values: Record<string, any>) => { setSearchText(values.search || ''); setPage(1); }}
        onReset={() => { setSearchText(''); setPage(1); }}
      />

      <DataTable
        columns={columns}
        data={pagedData}
        rowKey="id"
        loading={loading}
        actions={rowActions}
      />

      <Pagination
        current={page}
        pageSize={pageSize}
        total={dataSource.length}
        onChange={(p: number, ps: number) => { setPage(p); setPageSize(ps); }}
      />

      <Modal
        title={
          <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>
            {editingItem ? 'Chỉnh sửa đài Cospas-Sarsat' : 'Thêm mới đài Cospas-Sarsat'}
          </span>
        }
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleCancel}
        confirmLoading={submitting}
        okText="Lưu"
        cancelText="Hủy"
        width={700}
        okButtonProps={{ style: { borderRadius: radiusPill, height: 40 } }}
        cancelButtonProps={{ style: { borderRadius: radiusPill, height: 40 } }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Space size="large" style={{ display: 'flex', width: '100%' }}>
            <Form.Item name="stationCode" {...labelProps('Mã đài')} rules={[{ required: true, message: 'Vui lòng nhập mã đài' }]} style={{ width: 300, marginBottom: spaceFormField }}>
              <Input placeholder="Ví dụ: COSPAS-HAIPHONG-01" style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>
            <Form.Item name="stationName" {...labelProps('Tên đài Cospas-Sarsat')} rules={[{ required: true, message: 'Vui lòng nhập tên đài' }]} style={{ width: 300, marginBottom: spaceFormField }}>
              <Input placeholder="Nhập tên đài..." style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>
          </Space>

          <Space size="large" style={{ display: 'flex', width: '100%' }}>
            <Form.Item name="frequency" {...labelProps('Tần số hoạt động')} style={{ width: 300, marginBottom: spaceFormField }}>
              <Input placeholder="Ví dụ: 406 MHz" style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>
            <Form.Item name="beaconProtocol" {...labelProps('Giao thức phao báo')} style={{ width: 300, marginBottom: spaceFormField }}>
              <Input placeholder="Ví dụ: EPIRB, ELT, PLB..." style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>
          </Space>

          <Space size="large" style={{ display: 'flex', width: '100%' }}>
            <Form.Item name="emergencyChannel" {...labelProps('Kênh liên lạc khẩn cấp')} style={{ width: 300, marginBottom: spaceFormField }}>
              <Input placeholder="Nhập kênh khẩn cấp..." style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>
            <Form.Item name="antennaType" {...labelProps('Loại ăng-ten')} style={{ width: 300, marginBottom: spaceFormField }}>
              <Input placeholder="Nhập loại ăng-ten..." style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>
          </Space>

          <Space size="large" style={{ display: 'flex', width: '100%' }}>
            <Form.Item name="signalRange" {...labelProps('Bán kính thu phát (m)')} style={{ width: 300, marginBottom: spaceFormField }}>
              <InputNumber min={0} style={{ width: '100%', borderRadius: radiusPill, height: 40, paddingTop: 4 }} />
            </Form.Item>
            <Form.Item name="operatingMode" {...labelProps('Chế độ vận hành')} style={{ width: 300, marginBottom: spaceFormField }}>
              <Input placeholder="Ví dụ: Tự động, Bán tự động..." style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>
          </Space>

          <Form.Item name="coverageArea" {...labelProps('Vùng phủ sóng')} style={{ marginBottom: spaceFormField }}>
            <Input placeholder="Nhập vùng phủ sóng..." style={{ borderRadius: radiusPill, height: 40 }} />
          </Form.Item>

          <Form.Item name="locationAddress" {...labelProps('Địa chỉ lắp đặt đài')} style={{ marginBottom: spaceFormField }}>
            <Input placeholder="Nhập địa chỉ vị trí đài..." style={{ borderRadius: radiusPill, height: 40 }} />
          </Form.Item>

          <Space size="large" style={{ display: 'flex', width: '100%' }}>
            <Form.Item name="contactPerson" {...labelProps('Người liên hệ trực đài')} style={{ width: 300, marginBottom: spaceFormField }}>
              <Input placeholder="Nhập họ tên người phụ trách..." style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>
            <Form.Item name="contactPhone" {...labelProps('Số điện thoại đài')} style={{ width: 300, marginBottom: spaceFormField }}>
              <Input placeholder="Nhập số điện thoại..." style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>

      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Từ chối phê duyệt</span>}
        open={!!rejectingItem}
        onOk={confirmReject}
        onCancel={() => { setRejectingItem(null); setRejectReason(''); }}
        confirmLoading={approving}
        okText="Từ chối"
        okType="danger"
        cancelText="Hủy"
        okButtonProps={{ style: { borderRadius: radiusPill, height: 40 } }}
        cancelButtonProps={{ style: { borderRadius: radiusPill, height: 40 } }}
      >
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 8, fontSize: fontSizeMd }}>
            Nhập lý do từ chối hồ sơ <strong>{rejectingItem?.stationName}</strong> (tối thiểu 10 ký tự):
          </div>
          <Input.TextArea
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Nhập lý do từ chối..."
          />
        </div>
      </Modal>
    </div>
  );
}

import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
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
  FileExcelOutlined,
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import {
  fetchCoastalVTSList,
  createCoastalVTS,
  updateCoastalVTS,
  deleteCoastalVTS,
  submitCoastalVTS,
  approveCoastalVTSL1,
  approveCoastalVTSL2,
  rejectCoastalVTS,
} from '../../services/station/api';
import type { CoastalStationVTSResponse, CoastalStationVTSRequest } from '../../services/station/types';
import { colors } from '../../theme';
import { fontWeightBold, fontSizeMd, fontSizeLg, radiusPill, spaceFormField } from '../../tokens';
import { ScreenHeader, FilterBar, DataTable, Pagination } from '../../components/list-view';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import { usePermissionStore } from '../../store/permissionStore';
import toast, { message, modal } from '../../components/ToastNotification';
import { canEditApprovalRecord } from '../../utils/approvalEditPolicy';
import { formLabelProps as labelProps } from '../../components/shared/formLabel';

const { confirm } = modal;

export default function CoastalStationList() {
  const [dataSource, setDataSource] = useState<CoastalStationVTSResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchText, setSearchText] = useState('');

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CoastalStationVTSResponse | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  
  // Phe duyet 2 cap
  const [rejectingItem, setRejectingItem] = useState<CoastalStationVTSResponse | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approving, setApproving] = useState(false);

  const [searchParams] = useSearchParams();
  const isIframeModal = (window.self !== window.top) && searchParams.has('action');

  const action = searchParams.get('action');
  const id = searchParams.get('id');

  const hasPerm = usePermissionStore((s) => s.hasPermission);

  useEffect(() => {
    if (id && (action === 'detail' || action === 'edit')) {
      (async () => {
        try {
          setLoading(true);
          const cached = (window.parent as any)?.kchtDetailCache?.[id];
          const data = cached || await api.get(`/v1/stations/coastal/${id}`).then(r => r.data);
          setIsReadOnly(action === 'detail');
          
          const formatted = {
            ...data,
            stationCode: data.stationCode || data.code,
            stationName: data.stationName || data.name,
          };
          
          handleOpenModal(formatted);
        } catch (err: any) {
          message.error(err.message || 'Lỗi khi tải thông tin chi tiết đài duyên hải');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [action, id]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchCoastalVTSList({
        page: page - 1,
        size: pageSize,
        keyword: searchText ? searchText.trim() : undefined,
      });
      setDataSource(res.content || []);
      setTotal(res.totalElements || 0);
    } catch (err: any) {
      message.error(err.message || 'Không thể tải danh sách đài duyên hải');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchText]);

  useEffect(() => {
    if (isIframeModal) return;
    loadData();
  }, [loadData, isIframeModal]);

  const handleOpenModal = useCallback((record?: CoastalStationVTSResponse) => {
    if (record) {
      setEditingItem(record);
      form.setFieldsValue({
        stationCode: record.stationCode,
        stationName: record.stationName,
        latitude: record.latitude,
        longitude: record.longitude,
        frequencyBand: record.frequencyBand,
        transmitPower: record.transmitPower,
        equipmentType: record.equipmentType,
        locationAddress: record.locationAddress,
        contactPerson: record.contactPerson,
        contactPhone: record.contactPhone,
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
    if (window.self !== window.top) {
      window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
    }
  }, [form]);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const payload: CoastalStationVTSRequest = {
        status: editingItem?.status || 'ACTIVE',
        ...values,
      };

      if (editingItem) {
        const res = await updateCoastalVTS(editingItem.id, payload);
        if (window.parent && (window.parent as any).kchtDetailCache) {
          (window.parent as any).kchtDetailCache[editingItem.id] = res;
        }
        toast.success('Cập nhật đài duyên hải thành công!');
      } else {
        await createCoastalVTS(payload);
        toast.success('Tạo mới đài duyên hải thành công!');
      }

      setIsModalOpen(false);
      form.resetFields();
      loadData();
    } catch (err: any) {
      if (err.errorFields) return;
      toast.error(err.message || 'Lỗi khi lưu thông tin đài duyên hải');
    } finally {
      setSubmitting(false);
    }
  }, [form, editingItem, loadData]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteCoastalVTS(id);
      toast.success('Xóa đài thành công!');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi xóa đài duyên hải');
    }
  }, [loadData]);

  const confirmDelete = useCallback((record: CoastalStationVTSResponse) => {
    confirm({
      title: 'Xác nhận xóa đài duyên hải',
      icon: <ExclamationCircleOutlined />,
      content: `Bạn có chắc chắn muốn xóa đài "${record.stationName}"? Hành động này không thể hoàn tác.`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => handleDelete(record.id)
    });
  }, [handleDelete]);

  const handleFilterSearch = useCallback((values: Record<string, any>) => {
    setSearchText(values.search || '');
    setPage(1);
  }, []);

  const handleFilterReset = useCallback(() => {
    setSearchText('');
    setPage(1);
  }, []);

  const handlePageChange = useCallback((p: number, ps: number) => {
    setPage(p);
    setPageSize(ps);
  }, []);

  // --- Phê duyệt 2 cấp (docs/conventions/approval-2-level-spec.md) ---
  const handleSubmitApproval = useCallback(async (record: CoastalStationVTSResponse) => {
    try {
      await submitCoastalVTS(record.id);
      toast.success('Đã gửi phê duyệt');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Không gửi được phê duyệt');
    }
  }, [loadData]);

  const handleApprove = useCallback(async (record: CoastalStationVTSResponse) => {
    try {
      if (record.approvalStatus === 'APPROVED_LEVEL1') {
        await approveCoastalVTSL2(record.id);
        toast.success('Đã phê duyệt cấp Cục — hồ sơ có hiệu lực');
      } else {
        await approveCoastalVTSL1(record.id);
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
      await rejectCoastalVTS(rejectingItem.id, rejectReason.trim());
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

  const rowActions = useCallback((record: CoastalStationVTSResponse) => {
    const actions: { key: string; label: string; icon?: ReactNode; onClick: () => void; danger?: boolean; }[] = [];
    const st = record.approvalStatus || 'DRAFT';
    const isDraftOrReturned = st === 'DRAFT' || st === 'REJECTED_LEVEL1' || st === 'REJECTED_LEVEL2';
    const isPendingC1 = st === 'PENDING_APPROVAL';
    const isPendingC2 = st === 'APPROVED_LEVEL1';
    const canApproveC1 = hasPerm('coastalstation:approvec1') || hasPerm('coastalstation:approve');
    const canApproveC2 = hasPerm('coastalstation:approvec2') || hasPerm('coastalstation:approve');

    // Quy tắc 12 (approval-2-level-spec.md mục 3.9)
    if (canEditApprovalRecord(st, { hasPerm, resource: 'coastalstation' })) {
      actions.push({ key: 'edit', label: 'Sửa', icon: <EditOutlined />, onClick: () => handleOpenModal(record) });
    }
    if (isDraftOrReturned && hasPerm('coastalstation:update')) {
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
    if (st === 'DRAFT' && hasPerm('coastalstation:delete')) {
      actions.push({ key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, onClick: () => confirmDelete(record), danger: true });
    }
    return actions;
  }, [hasPerm, handleOpenModal, confirmDelete, handleSubmitApproval, handleApprove]);

  const columns = useMemo(() => [
    { key: 'sequenceNo', label: 'STT', width: 60, type: 'mono' as const, align: 'center' as const, render: (_: unknown, __: unknown, idx: number) => <span style={{ fontSize: fontSizeMd }}>{(page - 1) * pageSize + idx + 1}</span> },
    { key: 'stationCode', label: 'Mã đài', dataIndex: 'stationCode' },
    { key: 'stationName', label: 'Tên đài duyên hải / VTS', dataIndex: 'stationName' },
    { key: 'frequencyBand', label: 'Dải tần số', dataIndex: 'frequencyBand' },
    { key: 'transmitPower', label: 'Công suất (W)', dataIndex: 'transmitPower' },
    { key: 'locationAddress', label: 'Địa chỉ lắp đặt', dataIndex: 'locationAddress' },
    { key: 'contactPerson', label: 'Người liên hệ', dataIndex: 'contactPerson' },
    { key: 'contactPhone', label: 'Số điện thoại', dataIndex: 'contactPhone' },
    { key: 'status', label: 'Trạng thái', dataIndex: 'status', render: (status: string) => (
      <span style={{ color: status === 'ACTIVE' ? 'green' : 'orange' }}>
        {status === 'ACTIVE' ? 'Hoạt động' : 'Tạm dừng'}
      </span>
    )},
    { key: 'approvalStatus', label: 'Trạng thái phê duyệt', dataIndex: 'approvalStatus',
      render: (st: string) => <ApprovalStatusBadge status={st || 'DRAFT'} /> },
  ], [page, pageSize]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {!isIframeModal && (
        <ScreenHeader
          breadcrumb={[{ label: 'Quản lý nhà trạm' }, { label: 'Đài duyên hải VTS' }]}
          actions={[
            ...(hasPerm('coastalstation:create') ? [{
              key: 'create',
              label: 'Thêm đài duyên hải',
              variant: 'primary' as const,
              onClick: () => handleOpenModal()
            }] : []),
            {
              key: 'export',
              label: 'Xuất Excel',
              variant: 'subtle' as const,
              icon: <FileExcelOutlined />,
              onClick: () => {}
            }
          ]}
        />
      )}

      {!isIframeModal && (
        <FilterBar
          fields={[
            { key: 'search', type: 'search', label: 'Tìm kiếm', placeholder: 'Mã đài, tên đài...' }
          ]}
          onSearch={handleFilterSearch}
          onReset={handleFilterReset}
        />
      )}

      <DataTable
        columns={columns}
        data={dataSource}
        rowKey="id"
        loading={loading}
        actions={rowActions}
      />

      <Pagination
        current={page}
        pageSize={pageSize}
        total={total}
        onChange={handlePageChange}
      />

      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>{isReadOnly ? 'Chi tiết đài duyên hải' : (editingItem ? 'Chỉnh sửa đài duyên hải' : 'Thêm mới đài duyên hải / VTS')}</span>}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleCancel}
        confirmLoading={submitting}
        okText="Lưu"
        cancelText="Hủy"
        width={700}
        okButtonProps={{ style: { borderRadius: radiusPill, height: 40, display: isReadOnly ? 'none' : 'inline-block' } }}
        cancelButtonProps={{ style: { borderRadius: radiusPill, height: 40 } }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }} disabled={isReadOnly}>
          <Space size="large" style={{ display: 'flex', width: '100%' }}>
            <Form.Item name="stationCode" {...labelProps('Mã đài')} rules={[{ required: true, message: 'Vui lòng nhập mã đài' }]} style={{ width: 300, marginBottom: spaceFormField }}>
              <Input placeholder="Ví dụ: DDH-HAIPHONG-01" style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>
            <Form.Item name="stationName" {...labelProps('Tên đài duyên hải / VTS')} rules={[{ required: true, message: 'Vui lòng nhập tên đài' }]} style={{ width: 300, marginBottom: spaceFormField }}>
              <Input placeholder="Nhập tên đài..." style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>
          </Space>

          <Space size="large" style={{ display: 'flex', width: '100%' }}>
            <Form.Item name="latitude" {...labelProps('Vĩ độ (Lat)')} rules={[{ required: true, message: 'Vui lòng nhập vĩ độ' }]} style={{ width: 300, marginBottom: spaceFormField }}>
              <InputNumber min={-90} max={90} precision={6} style={{ width: '100%', borderRadius: radiusPill, height: 40, paddingTop: 4 }} placeholder="Ví dụ: 20.8415" />
            </Form.Item>
            <Form.Item name="longitude" {...labelProps('Kinh độ (Long)')} rules={[{ required: true, message: 'Vui lòng nhập kinh độ' }]} style={{ width: 300, marginBottom: spaceFormField }}>
              <InputNumber min={-180} max={180} precision={6} style={{ width: '100%', borderRadius: radiusPill, height: 40, paddingTop: 4 }} placeholder="Ví dụ: 106.6912" />
            </Form.Item>
          </Space>

          <Space size="large" style={{ display: 'flex', width: '100%' }}>
            <Form.Item name="frequencyBand" {...labelProps('Dải tần hoạt động')} style={{ width: 300, marginBottom: spaceFormField }}>
              <Input placeholder="Ví dụ: MF, HF, VHF..." style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>
            <Form.Item name="transmitPower" {...labelProps('Công suất phát (W)')} style={{ width: 300, marginBottom: spaceFormField }}>
              <InputNumber style={{ width: '100%', borderRadius: radiusPill, height: 40, paddingTop: 4 }} min={0} />
            </Form.Item>
          </Space>

          <Form.Item name="equipmentType" {...labelProps('Loại thiết bị lắp đặt')} style={{ marginBottom: spaceFormField }}>
            <Input placeholder="Ví dụ: VHF Transceiver, HF Transmitter..." style={{ borderRadius: radiusPill, height: 40 }} />
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

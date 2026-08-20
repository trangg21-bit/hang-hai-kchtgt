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
  FileExcelOutlined
} from '@ant-design/icons';
import {
  fetchCoastalVTSList,
  createCoastalVTS,
  updateCoastalVTS,
  deleteCoastalVTS,
} from '../../services/station/api';
import type { CoastalStationVTSResponse, CoastalStationVTSRequest } from '../../services/station/types';
import { colors } from '../../theme';
import { fontWeightBold, fontSizeMd, fontSizeLg, radiusPill, spaceFormField } from '../../tokens';
import { ScreenHeader, FilterBar, DataTable, Pagination } from '../../components/list-view';
import { usePermissionStore } from '../../store/permissionStore';
import toast, { message, modal } from '../../components/ToastNotification';

const { confirm } = modal;

const labelProps = (text: string) => ({ label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span> });

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

  const rowActions = useCallback((record: CoastalStationVTSResponse) => {
    const actions: { key: string; label: string; icon?: ReactNode; onClick: () => void; danger?: boolean; }[] = [];
    if (hasPerm('coastalstation:update')) {
      actions.push({ key: 'edit', label: 'Sửa', icon: <EditOutlined />, onClick: () => handleOpenModal(record) });
    }
    if (hasPerm('coastalstation:delete')) {
      actions.push({ key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, onClick: () => confirmDelete(record), danger: true });
    }
    return actions;
  }, [hasPerm, handleOpenModal, confirmDelete]);

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
    </div>
  );
}

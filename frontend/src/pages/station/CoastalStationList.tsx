import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import {
  Table,
  Button,
  Card,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  fetchCoastalVTSList,
  createCoastalVTS,
  updateCoastalVTS,
  deleteCoastalVTS,
} from '../../services/station/api';
import type { CoastalStationVTSResponse, CoastalStationVTSRequest } from '../../services/station/types';

export default function CoastalStationList() {
  const [dataSource, setDataSource] = useState<CoastalStationVTSResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState('');

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CoastalStationVTSResponse | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [form] = Form.useForm();
  
  const [searchParams] = useSearchParams();
  const isIframeModal = (window.self !== window.top) && searchParams.has('action');

  const action = searchParams.get('action');
  const id = searchParams.get('id');

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

  const handleOpenModal = (record?: CoastalStationVTSResponse) => {
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
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
    if (window.self !== window.top) {
      window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload: CoastalStationVTSRequest = {
        status: editingItem?.status || 'ACTIVE',
        ...values,
      };

      if (editingItem) {
        const res = await updateCoastalVTS(editingItem.id, payload);
        if (window.parent && (window.parent as any).kchtDetailCache) {
          (window.parent as any).kchtDetailCache[editingItem.id] = res;
        }
        message.success('Cập nhật đài duyên hải thành công!');
      } else {
        await createCoastalVTS(payload);
        message.success('Tạo mới đài duyên hải thành công!');
      }

      setIsModalOpen(false);
      form.resetFields();
      loadData();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi lưu thông tin đài duyên hải');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCoastalVTS(id);
      message.success('Xóa đài thành công!');
      loadData();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi xóa đài duyên hải');
    }
  };

  const columns = [
    {
      title: 'Mã đài duyên hải',
      dataIndex: 'stationCode',
      key: 'stationCode',
    },
    {
      title: 'Tên đài duyên hải / VTS',
      dataIndex: 'stationName',
      key: 'stationName',
    },
    {
      title: 'Dải tần số (Frequency)',
      dataIndex: 'frequencyBand',
      key: 'frequencyBand',
    },
    {
      title: 'Công suất phát (W)',
      dataIndex: 'transmitPower',
      key: 'transmitPower',
    },
    {
      title: 'Địa chỉ lắp đặt',
      dataIndex: 'locationAddress',
      key: 'locationAddress',
    },
    {
      title: 'Người liên hệ',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'contactPhone',
      key: 'contactPhone',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'success' : 'warning'}>
          {status === 'ACTIVE' ? 'Hoạt động' : 'Tạm dừng'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: CoastalStationVTSResponse) => (
        <Space size="middle">
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleOpenModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa đài duyên hải này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Tooltip title="Xóa">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Danh sách đài duyên hải và hệ thống thông tin VTS"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
          >
            Thêm đài duyên hải
          </Button>
        </Space>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Tìm kiếm theo mã đài, tên đài..."
          allowClear
          onSearch={(value) => {
            setSearchText(value);
            setPage(1);
          }}
          style={{ width: 300 }}
        />
      </div>

      <Table
        dataSource={dataSource}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: total,
          onChange: (p, s) => {
            setPage(p);
            setPageSize(s);
          },
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} bản ghi`,
        }}
      />

      <Modal
        title={isReadOnly ? 'Chi tiết đài duyên hải' : (editingItem ? 'Chỉnh sửa đài duyên hải' : 'Thêm mới đài duyên hải / VTS')}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleCancel}
        okText="Lưu"
        cancelText="Hủy"
        width={700}
        footer={isReadOnly ? [
          <Button key="close" type="primary" onClick={handleCancel}>Đóng</Button>
        ] : undefined}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }} disabled={isReadOnly}>
          <Space size="large" style={{ display: 'flex', width: '100%' }}>
            <Form.Item
              name="stationCode"
              label="Mã đài"
              rules={[{ required: true, message: 'Vui lòng nhập mã đài' }]}
              style={{ width: 300 }}
            >
              <Input placeholder="Ví dụ: DDH-HAIPHONG-01" />
            </Form.Item>

            <Form.Item
              name="stationName"
              label="Tên đài duyên hải / VTS"
              rules={[{ required: true, message: 'Vui lòng nhập tên đài' }]}
              style={{ width: 300 }}
            >
              <Input placeholder="Nhập tên đài..." />
            </Form.Item>
          </Space>

          <Space size="large" style={{ display: 'flex', width: '100%' }}>
            <Form.Item
              name="latitude"
              label="Vĩ độ (Lat)"
              rules={[{ required: true, message: 'Vui lòng nhập vĩ độ' }]}
              style={{ width: 300 }}
            >
              <InputNumber
                min={-90}
                max={90}
                precision={6}
                style={{ width: '100%' }}
                placeholder="Ví dụ: 20.8415"
              />
            </Form.Item>

            <Form.Item
              name="longitude"
              label="Kinh độ (Long)"
              rules={[{ required: true, message: 'Vui lòng nhập kinh độ' }]}
              style={{ width: 300 }}
            >
              <InputNumber
                min={-180}
                max={180}
                precision={6}
                style={{ width: '100%' }}
                placeholder="Ví dụ: 106.6912"
              />
            </Form.Item>
          </Space>

          <Space size="large" style={{ display: 'flex', width: '100%' }}>
            <Form.Item name="frequencyBand" label="Dải tần hoạt động" style={{ width: 300 }}>
              <Input placeholder="Ví dụ: MF, HF, VHF..." />
            </Form.Item>

            <Form.Item name="transmitPower" label="Công suất phát (W)" style={{ width: 300 }}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Space>

          <Form.Item name="equipmentType" label="Loại thiết bị lắp đặt">
            <Input placeholder="Ví dụ: VHF Transceiver, HF Transmitter..." />
          </Form.Item>

          <Form.Item name="locationAddress" label="Địa chỉ lắp đặt đài">
            <Input placeholder="Nhập địa chỉ vị trí đài..." />
          </Form.Item>

          <Space size="large" style={{ display: 'flex', width: '100%' }}>
            <Form.Item name="contactPerson" label="Người liên hệ trực đài" style={{ width: 300 }}>
              <Input placeholder="Nhập họ tên người phụ trách..." />
            </Form.Item>

            <Form.Item name="contactPhone" label="Số điện thoại đài" style={{ width: 300 }}>
              <Input placeholder="Nhập số điện thoại..." />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </Card>
  );
}

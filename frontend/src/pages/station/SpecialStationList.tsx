import { useState, useEffect, useCallback } from 'react';
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
  fetchInmarsatList,
  createInmarsat,
  updateInmarsat,
  deleteInmarsat,
} from '../../services/station/api';
import type { CoastalStationInmarsatResponse, CoastalStationInmarsatRequest } from '../../services/station/types';

export default function SpecialStationList() {
  const [dataSource, setDataSource] = useState<CoastalStationInmarsatResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CoastalStationInmarsatResponse | null>(null);
  const [form] = Form.useForm();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchInmarsatList({
        page: page - 1,
        size: pageSize,
      });
      setDataSource(res.content || []);
      setTotal(res.totalElements || 0);
    } catch (err: any) {
      message.error(err.message || 'Không thể tải danh sách đài vệ tinh Inmarsat');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenModal = (record?: CoastalStationInmarsatResponse) => {
    if (record) {
      setEditingItem(record);
      form.setFieldsValue({
        stationCode: record.stationCode,
        stationName: record.stationName,
        latitude: record.latitude,
        longitude: record.longitude,
        equipmentType: record.equipmentType,
        satelliteName: record.satelliteName,
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
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload: CoastalStationInmarsatRequest = {
        status: editingItem?.status || 'ACTIVE',
        ...values,
      };

      if (editingItem) {
        await updateInmarsat(editingItem.id, payload);
        message.success('Cập nhật đài Inmarsat thành công!');
      } else {
        await createInmarsat(payload);
        message.success('Tạo mới đài Inmarsat thành công!');
      }

      setIsModalOpen(false);
      form.resetFields();
      loadData();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi lưu thông tin đài vệ tinh');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteInmarsat(id);
      message.success('Xóa đài vệ tinh thành công!');
      loadData();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi xóa đài');
    }
  };

  const columns = [
    {
      title: 'Mã đài',
      dataIndex: 'stationCode',
      key: 'stationCode',
    },
    {
      title: 'Tên đài Inmarsat',
      dataIndex: 'stationName',
      key: 'stationName',
    },
    {
      title: 'Vệ tinh kết nối',
      dataIndex: 'satelliteName',
      key: 'satelliteName',
    },
    {
      title: 'Thiết bị trạm mặt đất',
      dataIndex: 'equipmentType',
      key: 'equipmentType',
    },
    {
      title: 'Địa chỉ lắp đặt',
      dataIndex: 'locationAddress',
      key: 'locationAddress',
    },
    {
      title: 'Người phụ trách',
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
      render: (_: any, record: CoastalStationInmarsatResponse) => (
        <Space size="middle">
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleOpenModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa đài Inmarsat này?"
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
      title="Quản lý trạm thông tin vệ tinh Inmarsat"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
          >
            Thêm đài Inmarsat
          </Button>
        </Space>
      }
    >
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
        }}
      />

      <Modal
        title={editingItem ? 'Chỉnh sửa đài vệ tinh' : 'Thêm mới đài vệ tinh Inmarsat'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleCancel}
        okText="Lưu"
        cancelText="Hủy"
        width={700}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Space size="large" style={{ display: 'flex', width: '100%' }}>
            <Form.Item
              name="stationCode"
              label="Mã đài"
              rules={[{ required: true, message: 'Vui lòng nhập mã đài' }]}
              style={{ width: 300 }}
            >
              <Input placeholder="Ví dụ: IM-HAIPHONG-01" />
            </Form.Item>

            <Form.Item
              name="stationName"
              label="Tên đài Inmarsat"
              rules={[{ required: true, message: 'Vui lòng nhập tên đài' }]}
              style={{ width: 300 }}
            >
              <Input placeholder="Nhập tên đài vệ tinh..." />
            </Form.Item>
          </Space>

          <Space size="large" style={{ display: 'flex', width: '100%' }}>
            <Form.Item
              name="latitude"
              label="Vĩ độ (Lat)"
              rules={[{ required: true, message: 'Vui lòng nhập vĩ độ' }]}
              style={{ width: 300 }}
            >
              <InputNumber style={{ width: '100%' }} placeholder="Ví dụ: 20.8415" />
            </Form.Item>

            <Form.Item
              name="longitude"
              label="Kinh độ (Long)"
              rules={[{ required: true, message: 'Vui lòng nhập kinh độ' }]}
              style={{ width: 300 }}
            >
              <InputNumber style={{ width: '100%' }} placeholder="Ví dụ: 106.6912" />
            </Form.Item>
          </Space>

          <Space size="large" style={{ display: 'flex', width: '100%' }}>
            <Form.Item
              name="satelliteName"
              label="Vệ tinh liên kết"
              rules={[{ required: true, message: 'Vui lòng nhập tên vệ tinh' }]}
              style={{ width: 300 }}
            >
              <Input placeholder="Ví dụ: Inmarsat-4 F1, Inmarsat-5..." />
            </Form.Item>

            <Form.Item name="equipmentType" label="Loại anten / máy thu phát vệ tinh" style={{ width: 300 }}>
              <Input placeholder="Ví dụ: Inmarsat-C, FleetBroadband..." />
            </Form.Item>
          </Space>

          <Form.Item name="locationAddress" label="Địa chỉ lắp đặt đài">
            <Input placeholder="Nhập địa chỉ vị trí đài..." />
          </Form.Item>

          <Space size="large" style={{ display: 'flex', width: '100%' }}>
            <Form.Item name="contactPerson" label="Người phụ trách trạm" style={{ width: 300 }}>
              <Input placeholder="Nhập họ tên..." />
            </Form.Item>

            <Form.Item name="contactPhone" label="Số điện thoại liên hệ" style={{ width: 300 }}>
              <Input placeholder="Nhập số điện thoại..." />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </Card>
  );
}

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
  DatePicker,
  Switch,
  message,
  Popconfirm,
  Tooltip,
  Select,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  fetchNhaTramDenList,
  createNhaTramDen,
  updateNhaTramDen,
  deleteNhaTramDen,
} from '../../services/nhatram/api';
import { colors } from '../../theme';
import { fontWeightBold, fontSizeLg } from '../../tokens';
import type { NhaTramDenResponse, CreateNhaTramDenRequest } from '../../services/nhatram/types';
import dayjs from 'dayjs';
import GisLocationSelector from '../../components/gis/GisLocationSelector';

export default function NhaTramDenList() {
  const [dataSource, setDataSource] = useState<NhaTramDenResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter states
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>(undefined);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NhaTramDenResponse | null>(null);
  const [form] = Form.useForm();

  const watchLoaiHinhHoc = Form.useWatch('loaiHinhHoc', form) || 'POINT';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchNhaTramDenList({
        page: page - 1,
        size: pageSize,
        name: filterKeyword ? filterKeyword.trim() : undefined,
        type: filterType || undefined,
      });
      setDataSource(res.content || []);
      setTotal(res.totalElements || 0);
    } catch (err: any) {
      message.error(err.message || 'Không thể tải danh sách nhà trạm đèn biển');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filterKeyword, filterType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenModal = (record?: NhaTramDenResponse) => {
    if (record) {
      setEditingItem(record);
      form.setFieldsValue({
        code: record.code,
        name: record.name,
        type: record.type,
        lightRange: record.lightRange,
        lightColor: record.lightColor,
        lightCharacteristic: record.lightCharacteristic,
        range: record.range,
        description: record.description,
        lastMaintenanceDate: record.lastMaintenanceDate ? dayjs(record.lastMaintenanceDate) : null,
        nextMaintenanceDate: record.nextMaintenanceDate ? dayjs(record.nextMaintenanceDate) : null,
        isActive: record.isActive,
        loaiHinhHoc: record.loaiHinhHoc || 'POINT',
        gisLocation: {
          loaiHinhHoc: record.loaiHinhHoc || 'POINT',
          toaDo: record.toaDo || '',
          bieuTuongId: record.bieuTuongId
        }
      });
    } else {
      setEditingItem(null);
      form.resetFields();
      form.setFieldsValue({ loaiHinhHoc: 'POINT' });
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
      const payload: CreateNhaTramDenRequest = {
        unitId: editingItem?.unitId || '00000000-0000-0000-0000-000000000000',
        status: editingItem?.status || 'DRAFT',
        ...values,
        lastMaintenanceDate: values.lastMaintenanceDate ? values.lastMaintenanceDate.format('YYYY-MM-DD') : '',
        nextMaintenanceDate: values.nextMaintenanceDate ? values.nextMaintenanceDate.format('YYYY-MM-DD') : '',
        bieuTuongId: values.gisLocation?.bieuTuongId || undefined,
        loaiHinhHoc: values.loaiHinhHoc,
        toaDo: values.gisLocation?.toaDo,
      };

      if (editingItem) {
        await updateNhaTramDen(editingItem.id, payload);
        message.success('Cập nhật nhà trạm đèn biển thành công!');
      } else {
        await createNhaTramDen(payload);
        message.success('Tạo mới nhà trạm đèn biển thành công!');
      }

      setIsModalOpen(false);
      form.resetFields();
      loadData();
    } catch (err: any) {
      message.error(err.message || 'Có lỗi xảy ra khi lưu nhà trạm');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNhaTramDen(id);
      message.success('Xóa nhà trạm thành công!');
      loadData();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi xóa nhà trạm');
    }
  };

  const columns = [
    {
      title: 'Mã trạm',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Tên nhà trạm',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Loại đèn biển',
      dataIndex: 'type',
      key: 'type',
      render: (val: string) => {
        if (val === 'LIGHTHOUSE') return 'Hải đăng';
        if (val === 'BEACON_LIGHT') return 'Đèn báo';
        if (val === 'BEACON_MARK') return 'Cọc tiêu';
        return val || 'Chưa xác định';
      }
    },
    {
      title: 'Trạng thái hoạt động',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (val: boolean) => (
        <Tag color={val ? 'success' : 'default'}>
          {val ? 'Hoạt động' : 'Tạm dừng'}
        </Tag>
      )
    },
    {
      title: 'Trạng thái phê duyệt',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => {
        if (val === 'DRAFT') return <Tag color="orange">Chờ phê duyệt</Tag>;
        if (val === 'APPROVED_L1') return <Tag color="blue">Đã phê duyệt Cấp 1</Tag>;
        if (val === 'APPROVED_L2') return <Tag color="blue">Đã phê duyệt Cấp 2</Tag>;
        if (val === 'PUBLISHED') return <Tag color="green">Được phê duyệt</Tag>;
        if (val === 'DELETED') return <Tag color="red">Đã xóa</Tag>;
        return <Tag color="orange">Chờ phê duyệt</Tag>;
      }
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: NhaTramDenResponse) => (
        <Space size="middle">
          <Tooltip title="Chỉnh sửa">
            <Button
              type="primary"
              shape="circle"
              icon={<EditOutlined />}
              onClick={() => handleOpenModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa nhà trạm này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Tooltip title="Xóa">
              <Button type="primary" danger shape="circle" icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Danh sách Nhà trạm đèn biển"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
          Thêm mới
        </Button>
      }
    >
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Tìm theo tên nhà trạm..."
          value={filterKeyword}
          onChange={(e) => setFilterKeyword(e.target.value)}
          style={{ width: 250 }}
        />
        <Select
          placeholder="Lọc theo loại..."
          allowClear
          value={filterType}
          onChange={(val) => setFilterType(val)}
          style={{ width: 200 }}
        >
          <Select.Option value="LIGHTHOUSE">Hải đăng</Select.Option>
          <Select.Option value="BEACON_LIGHT">Đèn báo</Select.Option>
          <Select.Option value="BEACON_MARK">Cọc tiêu</Select.Option>
        </Select>
        <Button icon={<ReloadOutlined />} onClick={loadData}>Tải lại</Button>
      </Space>

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
          showTotal: (totalCount) => `Tổng ${totalCount} nhà trạm`,
          locale: { items_per_page: '/ trang' },
        }}
      />

      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>{editingItem ? 'Chỉnh sửa thông tin nhà trạm' : 'Thêm mới nhà trạm đèn biển'}</span>}
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
              name="code"
              label="Mã nhà trạm"
              rules={[{ required: true, message: 'Vui lòng nhập mã trạm' }]}
              style={{ width: 300 }}
            >
              <Input placeholder="Ví dụ: TDB-HAIPHONG-01" disabled={!!editingItem} />
            </Form.Item>

            <Form.Item
              name="name"
              label="Tên nhà trạm"
              rules={[{ required: true, message: 'Vui lòng nhập tên trạm' }]}
              style={{ width: 300 }}
            >
              <Input placeholder="Nhập tên nhà trạm..." />
            </Form.Item>
          </Space>

          <Space size="large" style={{ display: 'flex', width: '100%' }}>
            <Form.Item
              name="type"
              label="Loại đèn biển"
              rules={[{ required: true, message: 'Vui lòng chọn loại đèn biển' }]}
              style={{ width: 300 }}
            >
              <Select placeholder="Chọn loại đèn biển..." disabled={!!editingItem}>
                <Select.Option value="LIGHTHOUSE">Hải đăng</Select.Option>
                <Select.Option value="BEACON_LIGHT">Đèn báo</Select.Option>
                <Select.Option value="BEACON_MARK">Cọc tiêu</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="lightColor" label="Màu ánh sáng" style={{ width: 300 }}>
              <Input placeholder="Ví dụ: Trắng, Đỏ, Xanh..." />
            </Form.Item>
          </Space>

          <Space size="large" style={{ display: 'flex', width: '100%' }}>
            <Form.Item name="loaiHinhHoc" label="Loại đối tượng" rules={[{ required: true }]} style={{ width: 300 }}>
              <Select placeholder="Chọn loại đối tượng" options={[
                { value: 'POINT', label: 'Đối tượng điểm' },
                { value: 'LINE', label: 'Đối tượng đường' },
                { value: 'POLYGON', label: 'Đối tượng vùng' }
              ]} />
            </Form.Item>
          </Space>

          <Form.Item name="gisLocation">
            <GisLocationSelector defaultGeometryType={watchLoaiHinhHoc} />
          </Form.Item>

          <Space size="large" style={{ display: 'flex', width: '100%' }}>
            <Form.Item
              name="lightRange"
              label="Tầm hiệu lực ánh sáng (Hải lý)"
              rules={[
                { type: 'number', min: 0.01, max: 60.0, message: 'Tầm hiệu lực phải từ 0.01 đến 60.0 hải lý' }
              ]}
              style={{ width: 300 }}
            >
              <InputNumber style={{ width: '100%' }} min={0.01} max={60} step={0.1} placeholder="Ví dụ: 15.5" />
            </Form.Item>

            <Form.Item
              name="range"
              label="Tầm hiệu lực nhìn địa lý (Hải lý)"
              rules={[
                { type: 'number', min: 0.01, max: 100.0, message: 'Tầm nhìn địa lý phải từ 0.01 đến 100.0 hải lý' }
              ]}
              style={{ width: 300 }}
            >
              <InputNumber style={{ width: '100%' }} min={0.01} max={100} step={0.1} placeholder="Ví dụ: 20.0" />
            </Form.Item>
          </Space>

          <Form.Item name="lightCharacteristic" label="Đặc tính ánh sáng (Chớp sáng)">
            <Input placeholder="Ví dụ: Chớp đơn chu kỳ 5 giây, Chớp nhóm 3..." />
          </Form.Item>

          <Space size="large" style={{ display: 'flex', width: '100%' }}>
            <Form.Item name="lastMaintenanceDate" label="Ngày bảo trì gần nhất" style={{ width: 300 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="nextMaintenanceDate" label="Ngày bảo trì tiếp theo" style={{ width: 300 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <Form.Item name="isActive" label="Trạng thái hoạt động" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Tạm dừng" />
          </Form.Item>

          <Form.Item name="description" label="Ghi chú thêm">
            <Input.TextArea placeholder="Nhập ghi chú hoặc mô tả thêm..." rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

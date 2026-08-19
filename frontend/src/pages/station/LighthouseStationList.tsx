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
  Popconfirm,
  Tooltip,
  Select,
} from 'antd';
import { message } from '../../components/ToastNotification';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  fetchLighthouseStationList,
  createLighthouseStation,
  updateLighthouseStation,
  deleteLighthouseStation,
} from '../../services/station/beacon/api';
import type { LighthouseStationResponse, CreateLighthouseStationRequest } from '../../services/station/beacon/types';
import dayjs from 'dayjs';
import GisLocationSelector from '../../components/gis/GisLocationSelector';

import { useSearchParams } from 'react-router-dom';
import { colors } from '../../theme';
import { fontWeightBold, fontSizeLg } from '../../tokens';

export default function LighthouseStationList() {
  const [dataSource, setDataSource] = useState<LighthouseStationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Filter states
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>(undefined);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LighthouseStationResponse | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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
          const data = cached || await fetchLighthouseStationById(id);
          setIsReadOnly(action === 'detail');
          handleOpenModal(data);
        } catch (err: any) {
          message.error(err.message || 'Lỗi khi tải thông tin chi tiết nhà trạm');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [action, id]);

  const watchLoaiHinhHoc = Form.useWatch('loaiHinhHoc', form) || 'POINT';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchLighthouseStationList({
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
    if (isIframeModal) return;
    loadData();
  }, [loadData, isIframeModal]);

  const handleOpenModal = (record?: LighthouseStationResponse) => {
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
          toaDo: record.toaDo || '',}
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
    if (window.self !== window.top) {
      window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();
      const payload: CreateLighthouseStationRequest = {
        unitId: editingItem?.unitId || '00000000-0000-0000-0000-000000000000',
        status: editingItem?.status || 'DRAFT',
        ...values,
        lastMaintenanceDate: values.lastMaintenanceDate ? values.lastMaintenanceDate.format('YYYY-MM-DD') : '',
        nextMaintenanceDate: values.nextMaintenanceDate ? values.nextMaintenanceDate.format('YYYY-MM-DD') : '',
        loaiHinhHoc: values.loaiHinhHoc,
        toaDo: values.gisLocation?.toaDo,
      };

      if (editingItem) {
        await updateLighthouseStation(editingItem.id, payload);
        message.success('Cập nhật nhà trạm đèn biển thành công!');
      } else {
        await createLighthouseStation(payload);
        message.success('Tạo mới nhà trạm đèn biển thành công!');
      }

      setIsModalOpen(false);
      form.resetFields();
      loadData();
    } catch (err: any) {
      message.error(err.message || 'Có lỗi xảy ra khi lưu nhà trạm');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLighthouseStation(id);
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
      render: (_: any, record: LighthouseStationResponse) => (
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
    <>
      {!isIframeModal && (
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
              placeholder="Tất cả"
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
        </Card>
      )}

      <Modal
        title={isIframeModal ? null : (<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>{isReadOnly ? 'Chi tiết nhà trạm đèn biển' : (editingItem ? 'Chỉnh sửa thông tin nhà trạm' : 'Thêm mới nhà trạm đèn biển')}</span>)}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleCancel}
        okText="Lưu"
        cancelText="Hủy"
        width={isIframeModal ? '100%' : 700}
        mask={!isIframeModal}
        closable={!isIframeModal}
        style={isIframeModal ? { top: 0, margin: 0, padding: 0, maxWidth: 'none', height: '100vh' } : undefined}
        styles={isIframeModal ? { body: { padding: '16px 24px', overflowY: 'auto', maxHeight: 'calc(100vh - 110px)' } } : undefined}
        footer={isReadOnly ? [
          <Button key="close" type="primary" onClick={handleCancel}>Đóng</Button>
        ] : (isIframeModal ? [
          <Button key="cancel" onClick={handleCancel}>Hủy</Button>,
          <Button key="submit" type="primary" onClick={handleSubmit} loading={submitting}>Lưu</Button>
        ] : undefined)}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16, maxHeight: '60vh', overflowY: 'auto', paddingRight: 12 }} disabled={isReadOnly}>
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
    </>
  );
}

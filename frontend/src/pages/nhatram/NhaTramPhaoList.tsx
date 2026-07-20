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
  fetchNhaTramPhaoList,
  createNhaTramPhao,
  updateNhaTramPhao,
  deleteNhaTramPhao,
} from '../../services/nhatram/api';
import type { NhaTramPhaoResponse, CreateNhaTramPhaoRequest } from '../../services/nhatram/types';
import dayjs from 'dayjs';
import GisLocationSelector from '../../components/gis/GisLocationSelector';

import { useSearchParams } from 'react-router-dom';
import { fetchNhaTramPhaoById } from '../../services/nhatram/api';
import { colors } from '../../theme';
import { fontWeightBold, fontSizeLg } from '../../tokens';

export default function NhaTramPhaoList() {
  const [dataSource, setDataSource] = useState<NhaTramPhaoResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Filter states
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>(undefined);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NhaTramPhaoResponse | null>(null);
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
          const data = cached || await fetchNhaTramPhaoById(id);
          setIsReadOnly(action === 'detail');
          handleOpenModal(data);
        } catch (err: any) {
          message.error(err.message || 'Lỗi khi tải thông tin chi tiết nhà trạm phao');
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
      const res = await fetchNhaTramPhaoList({
        page: page - 1,
        size: pageSize,
        name: filterKeyword ? filterKeyword.trim() : undefined,
        type: filterType || undefined,
      });
      setDataSource(res.content || []);
      setTotal(res.totalElements || 0);
    } catch (err: any) {
      message.error(err.message || 'Không thể tải danh sách nhà trạm phao tiêu');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filterKeyword, filterType]);

  useEffect(() => {
    if (isIframeModal) return;
    loadData();
  }, [loadData, isIframeModal]);

  const handleOpenModal = (record?: NhaTramPhaoResponse) => {
    if (record) {
      setEditingItem(record);
      form.setFieldsValue({
        code: record.code,
        name: record.name,
        type: record.type,
        color: record.color,
        shape: record.shape,
        lightCharacteristic: record.lightCharacteristic,
        range: record.range,
        description: record.description,
        lastInspectionDate: record.lastInspectionDate ? dayjs(record.lastInspectionDate) : null,
        nextInspectionDate: record.nextInspectionDate ? dayjs(record.nextInspectionDate) : null,
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
    if (window.self !== window.top) {
      window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();
      const payload: CreateNhaTramPhaoRequest = {
        unitId: editingItem?.unitId || '00000000-0000-0000-0000-000000000000',
        status: editingItem?.status || 'DRAFT',
        ...values,
        lastInspectionDate: values.lastInspectionDate ? values.lastInspectionDate.format('YYYY-MM-DD') : '',
        nextInspectionDate: values.nextInspectionDate ? values.nextInspectionDate.format('YYYY-MM-DD') : '',
        bieuTuongId: values.gisLocation?.bieuTuongId || undefined,
        loaiHinhHoc: values.loaiHinhHoc,
        toaDo: values.gisLocation?.toaDo,
      };

      if (editingItem) {
        await updateNhaTramPhao(editingItem.id, payload);
        message.success('Cập nhật nhà trạm phao tiêu thành công!');
      } else {
        await createNhaTramPhao(payload);
        message.success('Tạo mới nhà trạm phao tiêu thành công!');
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
      await deleteNhaTramPhao(id);
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
      title: 'Tên nhà trạm phao',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Loại phao tiêu',
      dataIndex: 'type',
      key: 'type',
      render: (val: string) => {
        if (val === 'CARDINAL') return 'Phao hướng (Cardinal)';
        if (val === 'SECTOR') return 'Phao phân khu (Sector)';
        if (val === 'SPECIAL') return 'Phao đặc biệt (Special)';
        if (val === 'SAFE_WATER') return 'Phao vùng nước an toàn (Safe water)';
        if (val === 'ISOLATED_DANGER') return 'Phao nguy hiểm cô lập (Isolated danger)';
        return val || 'Chưa xác định';
      }
    },
    {
      title: 'Vĩ độ (Lat)',
      dataIndex: 'latitude',
      key: 'latitude',
    },
    {
      title: 'Kinh độ (Long)',
      dataIndex: 'longitude',
      key: 'longitude',
    },
    {
      title: 'Tầm nhìn xa (Hải lý)',
      dataIndex: 'range',
      key: 'range',
    },
    {
      title: 'Màu sắc phao',
      dataIndex: 'color',
      key: 'color',
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
      render: (_: any, record: NhaTramPhaoResponse) => (
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
            title="Bạn có chắc chắn muốn xóa nhà trạm phao này?"
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
          title="Danh sách Nhà trạm phao tiêu"
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
              <Select.Option value="CARDINAL">Phao hướng (Cardinal)</Select.Option>
              <Select.Option value="SECTOR">Phao phân khu (Sector)</Select.Option>
              <Select.Option value="SPECIAL">Phao đặc biệt (Special)</Select.Option>
              <Select.Option value="SAFE_WATER">Phao vùng nước an toàn (Safe water)</Select.Option>
              <Select.Option value="ISOLATED_DANGER">Phao nguy hiểm cô lập (Isolated danger)</Select.Option>
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
        title={isIframeModal ? null : (<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>{isReadOnly ? 'Chi tiết nhà trạm phao tiêu' : (editingItem ? 'Chỉnh sửa thông tin nhà trạm phao' : 'Thêm mới nhà trạm phao tiêu')}</span>)}
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
              <Input placeholder="Ví dụ: TP-HAIPHONG-01" disabled={!!editingItem} />
            </Form.Item>

            <Form.Item
              name="name"
              label="Tên nhà trạm phao"
              rules={[{ required: true, message: 'Vui lòng nhập tên trạm' }]}
              style={{ width: 300 }}
            >
              <Input placeholder="Nhập tên nhà trạm phao..." />
            </Form.Item>
          </Space>

          <Space size="large" style={{ display: 'flex', width: '100%' }}>
            <Form.Item
              name="type"
              label="Loại phao tiêu"
              rules={[{ required: true, message: 'Vui lòng chọn loại phao tiêu' }]}
              style={{ width: 300 }}
            >
              <Select placeholder="Chọn loại phao tiêu..." disabled={!!editingItem}>
                <Select.Option value="CARDINAL">Phao hướng (Cardinal)</Select.Option>
                <Select.Option value="SECTOR">Phao phân khu (Sector)</Select.Option>
                <Select.Option value="SPECIAL">Phao đặc biệt (Special)</Select.Option>
                <Select.Option value="SAFE_WATER">Phao vùng nước an toàn (Safe water)</Select.Option>
                <Select.Option value="ISOLATED_DANGER">Phao nguy hiểm cô lập (Isolated danger)</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="range"
              label="Tầm nhìn xa (Hải lý)"
              rules={[
                { required: true, message: 'Vui lòng nhập tầm nhìn xa' },
                { type: 'number', min: 0.01, max: 100.0, message: 'Tầm nhìn xa phải từ 0.01 đến 100.0 hải lý' }
              ]}
              style={{ width: 300 }}
            >
              <InputNumber style={{ width: '100%' }} min={0.01} max={100} step={0.1} placeholder="Ví dụ: 10.0" />
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
            <Form.Item name="color" label="Màu sắc phao" style={{ width: 300 }}>
              <Input placeholder="Ví dụ: Đỏ - Trắng xen kẽ, Vàng..." />
            </Form.Item>

            <Form.Item name="shape" label="Hình dáng thiết kế" style={{ width: 300 }}>
              <Input placeholder="Ví dụ: Hình trụ tròn, Hình nón..." />
            </Form.Item>
          </Space>

          <Form.Item name="lightCharacteristic" label="Đặc tính ánh sáng đèn chớp trên phao">
            <Input placeholder="Ví dụ: Chớp đơn chu kỳ 4 giây..." />
          </Form.Item>

          <Space size="large" style={{ display: 'flex', width: '100%' }}>
            <Form.Item name="lastInspectionDate" label="Ngày kiểm tra gần nhất" style={{ width: 300 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="nextInspectionDate" label="Ngày kiểm tra tiếp theo" style={{ width: 300 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <Form.Item name="isActive" label="Trạng thái hoạt động" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Tạm dừng" />
          </Form.Item>

          <Form.Item name="description" label="Ghi chú thiết bị">
            <Input.TextArea placeholder="Mô tả hiện trạng thiết bị..." rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

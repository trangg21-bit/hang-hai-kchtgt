import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Card,
  Space,
  Modal,
  Form,
  Input,
  DatePicker,
  message,
  Popconfirm,
  Tooltip,
  Select,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  fetchVanBanList,
  createVanBan,
  updateVanBan,
  deleteVanBan,
} from '../../services/document/api';
import type { VanBanPhapLyResponse, VanBanPhapLyCreateRequest } from '../../services/document/types';
import { colors } from '../../theme';
import { fontWeightBold, fontSizeLg } from '../../tokens';
import dayjs from 'dayjs';

export default function LegalDocumentList() {
  const [dataSource, setDataSource] = useState<VanBanPhapLyResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Filter states
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterCoQuan, setFilterCoQuan] = useState('');
  const [filterLoai, setFilterLoai] = useState<string | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VanBanPhapLyResponse | null>(null);
  const [form] = Form.useForm();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchVanBanList({
        page: page - 1,
        size: pageSize,
        keyword: filterKeyword ? filterKeyword.trim() : undefined,
        issuingAuthority: filterCoQuan ? filterCoQuan.trim() : undefined,
        type: filterLoai || undefined,
        status: filterStatus || undefined,
      });
      setDataSource(res.content || []);
      setTotal(res.totalElements || 0);
    } catch (err: any) {
      message.error(err.message || 'Không thể tải danh sách văn bản pháp lý');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filterKeyword, filterCoQuan, filterLoai, filterStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenModal = (record?: VanBanPhapLyResponse) => {
    if (record) {
      setEditingItem(record);
      form.setFieldsValue({
        soHieu: record.soHieu,
        tenVanBan: record.tenVanBan,
        loaiVanBan: record.loaiVanBan,
        nguoiKy: record.nguoiKy,
        ngayBanHanh: record.ngayBanHanh ? dayjs(record.ngayBanHanh) : null,
        ngayCoHieuLuc: record.ngayCoHieuLuc ? dayjs(record.ngayCoHieuLuc) : null,
        coQuanBanHanh: record.coQuanBanHanh,
        tinhTrangHieuLuc: record.tinhTrangHieuLuc,
        moTa: record.moTa,
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
      const payload: VanBanPhapLyCreateRequest = {
        ...values,
        ngayBanHanh: values.ngayBanHanh ? values.ngayBanHanh.toISOString() : '',
        ngayCoHieuLuc: values.ngayCoHieuLuc ? values.ngayCoHieuLuc.toISOString() : '',
      };

      if (editingItem) {
        await updateVanBan(editingItem.id, payload);
        message.success('Cập nhật văn bản pháp lý thành công!');
      } else {
        await createVanBan(payload);
        message.success('Tạo văn bản pháp lý thành công!');
      }

      setIsModalOpen(false);
      form.resetFields();
      loadData();
    } catch (err: any) {
      message.error(err.message || 'Có lỗi xảy ra khi lưu văn bản');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteVanBan(id);
      message.success('Xóa văn bản pháp lý thành công!');
      loadData();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi xóa văn bản');
    }
  };

  const columns = [
    {
      title: 'Số hiệu văn bản',
      dataIndex: 'soHieu',
      key: 'soHieu',
    },
    {
      title: 'Tên văn bản pháp lý',
      dataIndex: 'tenVanBan',
      key: 'tenVanBan',
    },
    {
      title: 'Loại văn bản',
      dataIndex: 'loaiVanBan',
      key: 'loaiVanBan',
      render: (val: string) => {
        if (val === 'DECISION') return 'Quyết định';
        if (val === 'CIRCULAR') return 'Thông tư';
        if (val === 'DECREE') return 'Nghị định';
        if (val === 'LAW') return 'Luật';
        return val || '';
      }
    },
    {
      title: 'Cơ quan ban hành',
      dataIndex: 'coQuanBanHanh',
      key: 'coQuanBanHanh',
    },
    {
      title: 'Người ký',
      dataIndex: 'nguoiKy',
      key: 'nguoiKy',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'tinhTrangHieuLuc',
      key: 'tinhTrangHieuLuc',
      render: (val: string) => {
        if (val === 'EFFECTIVE') return 'Còn hiệu lực';
        if (val === 'EXPIRING_SOON') return 'Sắp hết hiệu lực';
        if (val === 'EXPIRED') return 'Đã hết hiệu lực';
        return val || '';
      }
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: VanBanPhapLyResponse) => (
        <Space size="middle">
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleOpenModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa văn bản này?"
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
      title="Danh sách văn bản pháp lý"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
          >
            Tạo văn bản
          </Button>
        </Space>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Tìm theo tên/tóm tắt..."
            value={filterKeyword}
            onChange={(e) => {
              setFilterKeyword(e.target.value);
              setPage(1);
            }}
            style={{ width: 180 }}
          />
          <Input
            placeholder="Cơ quan ban hành..."
            value={filterCoQuan}
            onChange={(e) => {
              setFilterCoQuan(e.target.value);
              setPage(1);
            }}
            style={{ width: 150 }}
          />
          <Select
            placeholder="Loại văn bản"
            value={filterLoai}
            onChange={(val) => {
              setFilterLoai(val);
              setPage(1);
            }}
            style={{ width: 140 }}
            allowClear
            options={[
              { label: 'Quyết định', value: 'DECISION' },
              { label: 'Thông tư', value: 'CIRCULAR' },
              { label: 'Nghị định', value: 'DECREE' },
              { label: 'Luật', value: 'LAW' },
            ]}
          />
          <Select
            placeholder="Trạng thái hiệu lực"
            value={filterStatus}
            onChange={(val) => {
              setFilterStatus(val);
              setPage(1);
            }}
            style={{ width: 160 }}
            allowClear
            options={[
              { label: 'Còn hiệu lực', value: 'EFFECTIVE' },
              { label: 'Sắp hết hiệu lực', value: 'EXPIRING_SOON' },
              { label: 'Đã hết hiệu lực', value: 'EXPIRED' },
            ]}
          />
          <Button
            onClick={() => {
              setFilterKeyword('');
              setFilterCoQuan('');
              setFilterLoai(undefined);
              setFilterStatus(undefined);
              setPage(1);
            }}
          >
            Xóa bộ lọc
          </Button>
        </Space>
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
        }}
      />

      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>{editingItem ? 'Chỉnh sửa văn bản pháp lý' : 'Thêm mới văn bản pháp lý'}</span>}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleCancel}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="soHieu"
            label="Số hiệu văn bản"
            rules={[{ required: true, message: 'Vui lòng nhập số hiệu' }]}
          >
            <Input placeholder="Ví dụ: QĐ-BGTVT-2026-01" />
          </Form.Item>

          <Form.Item
            name="tenVanBan"
            label="Tên văn bản"
            rules={[{ required: true, message: 'Vui lòng nhập tên văn bản' }]}
          >
            <Input placeholder="Nhập tiêu đề văn bản..." />
          </Form.Item>

          <Form.Item
            name="loaiVanBan"
            label="Loại văn bản"
            rules={[{ required: true, message: 'Vui lòng chọn loại văn bản' }]}
          >
            <Select placeholder="Chọn loại văn bản...">
              <Select.Option value="DECISION">Quyết định</Select.Option>
              <Select.Option value="CIRCULAR">Thông tư</Select.Option>
              <Select.Option value="DECREE">Nghị định</Select.Option>
              <Select.Option value="LAW">Luật</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="coQuanBanHanh"
            label="Cơ quan ban hành"
            rules={[{ required: true, message: 'Vui lòng nhập cơ quan ban hành' }]}
          >
            <Input placeholder="Bộ Giao thông vận tải, Cục Hàng hải..." />
          </Form.Item>

          <Form.Item
            name="nguoiKy"
            label="Người ký"
            rules={[{ required: true, message: 'Vui lòng nhập người ký' }]}
          >
            <Input placeholder="Nhập họ và tên người ký..." />
          </Form.Item>

          <Form.Item name="ngayBanHanh" label="Ngày ban hành">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="ngayCoHieuLuc" label="Ngày có hiệu lực">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="tinhTrangHieuLuc" label="Trạng thái hiệu lực" initialValue="EFFECTIVE">
            <Select placeholder="Chọn trạng thái hiệu lực...">
              <Select.Option value="EFFECTIVE">Còn hiệu lực</Select.Option>
              <Select.Option value="EXPIRING_SOON">Sắp hết hiệu lực</Select.Option>
              <Select.Option value="EXPIRED">Đã hết hiệu lực</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="moTa" label="Mô tả tóm tắt nội dung">
            <Input.TextArea placeholder="Tóm tắt nội dung văn bản..." rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

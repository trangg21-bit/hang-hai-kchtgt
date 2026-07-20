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
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  fetchQuyHoachList,
  createQuyHoach,
  updateQuyHoach,
  deleteQuyHoach,
} from '../../services/vanban/api';
import type { QuyHoachBenCangResponse, QuyHoachBenCangCreateRequest } from '../../services/vanban/types';
import dayjs from 'dayjs';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme';
import { fontWeightBold, fontSizeLg } from '../../tokens';

export default function QuyHoachList() {
  const currentUser = useAuthStore((s) => s.user);
  const [dataSource, setDataSource] = useState<QuyHoachBenCangResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Filter states
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<QuyHoachBenCangResponse | null>(null);
  const [form] = Form.useForm();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchQuyHoachList({
        page: page - 1,
        size: pageSize,
        keyword: filterKeyword ? filterKeyword.trim() : undefined,
        status: filterStatus || undefined,
      });
      setDataSource(res.content || []);
      setTotal(res.totalElements || 0);
    } catch (err: any) {
      message.error(err.message || 'Không thể tải danh sách hồ sơ quy hoạch');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filterKeyword, filterStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenModal = (record?: QuyHoachBenCangResponse) => {
    if (record) {
      setEditingItem(record);
      form.setFieldsValue({
        tenDoAn: record.tenDoAn,
        coQuanPheDuyet: record.coQuanPheDuyet,
        ngayPheDuyet: record.ngayPheDuyet ? dayjs(record.ngayPheDuyet) : null,
        phamViApDung: record.phamViApDung,
        tiLeBanDo: record.tiLeBanDo,
        tinhTrang: record.tinhTrang,
        duongDanFile: record.duongDanFile,
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
      const payload: QuyHoachBenCangCreateRequest = {
        ...values,
        ngayPheDuyet: values.ngayPheDuyet ? values.ngayPheDuyet.format('YYYY-MM-DD') : undefined,
        nguoiTao: currentUser?.username || 'unknown',
      };

      if (editingItem) {
        await updateQuyHoach(editingItem.id, payload);
        message.success('Cập nhật hồ sơ quy hoạch thành công!');
      } else {
        await createQuyHoach(payload);
        message.success('Tạo mới hồ sơ quy hoạch thành công!');
      }

      setIsModalOpen(false);
      form.resetFields();
      loadData();
    } catch (err: any) {
      message.error(err.message || 'Có lỗi xảy ra khi lưu quy hoạch');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteQuyHoach(id);
      message.success('Xóa hồ sơ quy hoạch thành công!');
      loadData();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi xóa quy hoạch');
    }
  };

  const columns = [
    {
      title: 'Tên đồ án quy hoạch',
      dataIndex: 'tenDoAn',
      key: 'tenDoAn',
    },
    {
      title: 'Cơ quan phê duyệt',
      dataIndex: 'coQuanPheDuyet',
      key: 'coQuanPheDuyet',
    },
    {
      title: 'Ngày phê duyệt',
      dataIndex: 'ngayPheDuyet',
      key: 'ngayPheDuyet',
      render: (val: string) => val ? dayjs(val).format('DD/MM/YYYY') : '',
    },
    {
      title: 'Phạm vi áp dụng',
      dataIndex: 'phamViApDung',
      key: 'phamViApDung',
      ellipsis: true,
    },
    {
      title: 'Tỉ lệ bản đồ',
      dataIndex: 'tiLeBanDo',
      key: 'tiLeBanDo',
    },
    {
      title: 'Tình trạng quy hoạch',
      dataIndex: 'tinhTrang',
      key: 'tinhTrang',
      render: (val: string) => {
        if (val === 'HIEN_HANH') return 'Hiện hành';
        if (val === 'DA_THAY_THE') return 'Đã thay thế';
        if (val === 'LICH_SU') return 'Lịch sử';
        return val || '';
      }
    },
    {
      title: 'Người lập',
      dataIndex: 'nguoiTao',
      key: 'nguoiTao',
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: QuyHoachBenCangResponse) => (
        <Space size="middle">
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleOpenModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa hồ sơ này?"
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
      title="Danh sách quy hoạch bến cảng hàng hải"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
          >
            Tạo quy hoạch
          </Button>
        </Space>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Tìm theo tên đồ án..."
            value={filterKeyword}
            onChange={(e) => {
              setFilterKeyword(e.target.value);
              setPage(1);
            }}
            style={{ width: 250 }}
          />
          <Select
            placeholder="Tình trạng quy hoạch"
            value={filterStatus}
            onChange={(val) => {
              setFilterStatus(val);
              setPage(1);
            }}
            style={{ width: 200 }}
            allowClear
            options={[
              { label: 'Hiện hành', value: 'HIEN_HANH' },
              { label: 'Đã thay thế', value: 'DA_THAY_THE' },
              { label: 'Lịch sử', value: 'LICH_SU' },
            ]}
          />
          <Button
            onClick={() => {
              setFilterKeyword('');
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
          showTotal: (totalCount) => `Tổng ${totalCount} quy hoạch`,
          locale: { items_per_page: '/ trang' },
        }}
      />

      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>{editingItem ? 'Chỉnh sửa hồ sơ quy hoạch' : 'Tạo mới hồ sơ quy hoạch'}</span>}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleCancel}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="tenDoAn"
            label="Tên đồ án quy hoạch"
            rules={[{ required: true, message: 'Vui lòng nhập tên đồ án quy hoạch' }]}
          >
            <Input placeholder="Ví dụ: Quy hoạch chi tiết nhóm cảng biển số 1..." />
          </Form.Item>

          <Form.Item
            name="coQuanPheDuyet"
            label="Cơ quan phê duyệt"
            rules={[{ required: true, message: 'Vui lòng nhập cơ quan phê duyệt' }]}
          >
            <Input placeholder="Ví dụ: Thủ tướng Chính phủ, Bộ Giao thông vận tải..." />
          </Form.Item>

          <Form.Item
            name="ngayPheDuyet"
            label="Ngày phê duyệt"
            rules={[{ required: true, message: 'Vui lòng chọn ngày phê duyệt' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="phamViApDung" label="Phạm vi áp dụng">
            <Input.TextArea placeholder="Mô tả phạm vi áp dụng..." rows={2} />
          </Form.Item>

          <Form.Item name="tiLeBanDo" label="Tỉ lệ bản đồ">
            <Input placeholder="Ví dụ: 1/5000, 1/10000..." />
          </Form.Item>

          <Form.Item
            name="tinhTrang"
            label="Tình trạng quy hoạch"
            rules={[{ required: true, message: 'Vui lòng chọn tình trạng quy hoạch' }]}
          >
            <Select placeholder="Chọn tình trạng quy hoạch...">
              <Select.Option value="HIEN_HANH">Hiện hành</Select.Option>
              <Select.Option value="DA_THAY_THE">Đã thay thế</Select.Option>
              <Select.Option value="LICH_SU">Lịch sử</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="duongDanFile" label="Đường dẫn file tài liệu">
            <Input placeholder="Đường dẫn lưu file đính kèm..." />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

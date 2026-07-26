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
  fetchIncidentList,
  createSuCo,
  updateSuCo,
  deleteSuCo,
} from '../../services/document/api';
import type { SuCoResponse, SuCoCreateRequest } from '../../services/document/types';
import dayjs from 'dayjs';
import { colors } from '../../theme';
import { fontWeightBold, fontSizeLg } from '../../tokens';

export default function IncidentList() {
  const [dataSource, setDataSource] = useState<SuCoResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Filter states
  const [filterViTri, setFilterViTri] = useState('');

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SuCoResponse | null>(null);
  const [form] = Form.useForm();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchIncidentList({
        page: page - 1,
        size: pageSize,
        viTri: filterViTri ? filterViTri.trim() : undefined,
      });
      setDataSource(res.content || []);
      setTotal(res.totalElements || 0);
    } catch (err: any) {
      message.error(err.message || 'Không thể tải danh sách hồ sơ sự cố');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filterViTri]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenModal = (record?: SuCoResponse) => {
    if (record) {
      setEditingItem(record);
      form.setFieldsValue({
        thoiGianPhatHien: record.thoiGianPhatHien ? dayjs(record.thoiGianPhatHien) : null,
        viTri: record.viTri,
        mucDoNghiemTrong: record.mucDoNghiemTrong,
        tinhTrangXuLy: record.tinhTrangXuLy,
        nguoiBaoCao: record.nguoiBaoCao,
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
      const payload: SuCoCreateRequest = {
        ...values,
        thoiGianPhatHien: values.thoiGianPhatHien ? values.thoiGianPhatHien.toISOString() : undefined,
      };

      if (editingItem) {
        await updateSuCo(editingItem.id, payload);
        message.success('Cập nhật hồ sơ sự cố thành công!');
      } else {
        await createSuCo(payload);
        message.success('Tạo mới hồ sơ sự cố thành công!');
      }

      setIsModalOpen(false);
      form.resetFields();
      loadData();
    } catch (err: any) {
      message.error(err.message || 'Có lỗi xảy ra khi lưu sự cố');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSuCo(id);
      message.success('Xóa hồ sơ sự cố thành công!');
      loadData();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi xóa sự cố');
    }
  };

  const columns = [
    {
      title: 'Thời gian phát hiện',
      dataIndex: 'thoiGianPhatHien',
      key: 'thoiGianPhatHien',
      render: (val: string) => val ? dayjs(val).format('DD/MM/YYYY HH:mm') : '',
    },
    {
      title: 'Vị trí/Địa điểm xảy ra',
      dataIndex: 'viTri',
      key: 'viTri',
    },
    {
      title: 'Mức độ nghiêm trọng',
      dataIndex: 'mucDoNghiemTrong',
      key: 'mucDoNghiemTrong',
      render: (val: string) => {
        if (val === 'NHE') return 'Nhẹ';
        if (val === 'TRUNG_BINH') return 'Trung bình';
        if (val === 'NGHIEM_TRONG') return 'Nghiêm trọng';
        if (val === 'CUC_NGIEM_TRONG') return 'Cực kỳ nghiêm trọng';
        return val || '';
      }
    },
    {
      title: 'Tình trạng xử lý',
      dataIndex: 'tinhTrangXuLy',
      key: 'tinhTrangXuLy',
      render: (val: string) => {
        if (val === 'TIEP_NHAN') return 'Tiếp nhận';
        if (val === 'DANG_XU_LY') return 'Đang xử lý';
        if (val === 'DA_XU_LY') return 'Đã xử lý';
        if (val === 'DA_DONG') return 'Đã đóng';
        return val || '';
      }
    },
    {
      title: 'Người báo cáo',
      dataIndex: 'nguoiBaoCao',
      key: 'nguoiBaoCao',
    },
    {
      title: 'Mô tả',
      dataIndex: 'moTa',
      key: 'moTa',
      ellipsis: true,
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: SuCoResponse) => (
        <Space size="middle">
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleOpenModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa sự cố này?"
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
      title="Danh sách hồ sơ sự cố hàng hải"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
          >
            Ghi nhận sự cố
          </Button>
        </Space>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Tìm theo vị trí sự cố..."
            value={filterViTri}
            onChange={(e) => {
              setFilterViTri(e.target.value);
              setPage(1);
            }}
            style={{ width: 300 }}
          />
          <Button
            onClick={() => {
              setFilterViTri('');
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
          showTotal: (totalCount) => `Tổng ${totalCount} sự cố`,
          locale: { items_per_page: '/ trang' },
        }}
      />

      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>{editingItem ? 'Chỉnh sửa hồ sơ sự cố' : 'Ghi nhận hồ sơ sự cố mới'}</span>}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleCancel}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="viTri"
            label="Vị trí/Địa điểm xảy ra"
            rules={[{ required: true, message: 'Vui lòng nhập vị trí' }]}
          >
            <Input placeholder="Tọa độ hoặc lý trình luồng hàng hải..." />
          </Form.Item>

          <Form.Item
            name="thoiGianPhatHien"
            label="Thời gian phát hiện"
            rules={[{ required: true, message: 'Vui lòng chọn thời gian phát hiện' }]}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="mucDoNghiemTrong"
            label="Mức độ nghiêm trọng"
            rules={[{ required: true, message: 'Vui lòng chọn mức độ nghiêm trọng' }]}
          >
            <Select placeholder="Chọn mức độ nghiêm trọng...">
              <Select.Option value="NHE">Nhẹ</Select.Option>
              <Select.Option value="TRUNG_BINH">Trung bình</Select.Option>
              <Select.Option value="NGHIEM_TRONG">Nghiêm trọng</Select.Option>
              <Select.Option value="CUC_NGIEM_TRONG">Cực kỳ nghiêm trọng</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="tinhTrangXuLy"
            label="Tình trạng xử lý"
            rules={[{ required: true, message: 'Vui lòng chọn tình trạng xử lý' }]}
          >
            <Select placeholder="Chọn tình trạng xử lý...">
              <Select.Option value="TIEP_NHAN">Tiếp nhận</Select.Option>
              <Select.Option value="DANG_XU_LY">Đang xử lý</Select.Option>
              <Select.Option value="DA_XU_LY">Đã xử lý</Select.Option>
              <Select.Option value="DA_DONG">Đã đóng</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="nguoiBaoCao"
            label="Người báo cáo"
            rules={[{ required: true, message: 'Vui lòng nhập người báo cáo' }]}
          >
            <Input placeholder="Nhập họ và tên người báo cáo..." />
          </Form.Item>

          <Form.Item name="moTa" label="Mô tả chi tiết">
            <Input.TextArea placeholder="Mô tả diễn biến chi tiết sự việc..." rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

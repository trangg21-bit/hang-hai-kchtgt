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
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import {
  fetchYeuCauGiamList,
  createYeuCauGiam,
  updateYeuCauGiam,
  deleteYeuCauGiam,
  fetchTaiSanKCHTList,
  approveYeuCauGiam,
  rejectYeuCauGiam,
} from '../../services/assetmovement/api';
import type { YeuCauGiamTaiSanResponse, YeuCauGiamTaiSanRequest } from '../../services/assetmovement/types';
import { colors } from '../../theme';
import { fontWeightBold, fontSizeLg } from '../../tokens';

export default function AssetDecreaseList() {
  const [dataSource, setDataSource] = useState<YeuCauGiamTaiSanResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<YeuCauGiamTaiSanResponse | null>(null);
  const [form] = Form.useForm();

  // Danh sách tài sản KCHT
  const [taiSanList, setTaiSanList] = useState<any[]>([]);

  // States phê duyệt/từ chối
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchYeuCauGiamList({
        page: page - 1,
        size: pageSize,
      });
      setDataSource(res.content || []);
      setTotal(res.totalElements || 0);
    } catch (err: any) {
      message.error(err.message || 'Không thể tải danh sách yêu cầu giảm');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  const loadTaiSanList = async () => {
    try {
      const res = await fetchTaiSanKCHTList({ page: 0, size: 200 });
      setTaiSanList(res.content || []);
    } catch (err: any) {
      console.error('Không thể tải danh sách tài sản', err);
    }
  };

  useEffect(() => {
    loadData();
    loadTaiSanList();
  }, [loadData]);

  const handleOpenModal = (record?: YeuCauGiamTaiSanResponse) => {
    if (record) {
      setEditingItem(record);
      form.setFieldsValue({
        taiSanId: record.taiSanId,
        lyDo: record.lyDo,
        nguyenNhanGiam: record.nguyenNhanGiam,
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
      const payload: YeuCauGiamTaiSanRequest = {
        taiSanId: values.taiSanId,
        lyDo: values.lyDo,
        nguyenNhanGiam: values.nguyenNhanGiam,
        tenTaiSan: '',
        soLuong: 1,
        donViTinh: 'Cái',
      };

      if (editingItem) {
        await updateYeuCauGiam(editingItem.id, payload);
        message.success('Cập nhật yêu cầu giảm tài sản thành công!');
      } else {
        await createYeuCauGiam(payload);
        message.success('Tạo mới yêu cầu giảm tài sản thành công!');
      }

      setIsModalOpen(false);
      form.resetFields();
      loadData();
    } catch (err: any) {
      message.error(err.message || 'Có lỗi xảy ra khi lưu dữ liệu');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteYeuCauGiam(id);
      message.success('Xóa yêu cầu thành công!');
      loadData();
    } catch (err: any) {
      message.error(err.message || 'Không thể xóa yêu cầu');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveYeuCauGiam(id);
      message.success('Đã phê duyệt yêu cầu giảm tài sản!');
      loadData();
    } catch (err: any) {
      message.error(err.message || 'Có lỗi xảy ra khi phê duyệt');
    }
  };

  const handleOpenRejectModal = (id: string) => {
    setRejectingId(id);
    setRejectRemarks('');
    setIsRejectModalOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectingId) return;
    try {
      await rejectYeuCauGiam(rejectingId, rejectRemarks);
      message.success('Đã từ chối yêu cầu giảm tài sản!');
      setIsRejectModalOpen(false);
      loadData();
    } catch (err: any) {
      message.error(err.message || 'Có lỗi xảy ra khi từ chối');
    }
  };

  const getStatusTag = (status: string) => {
    const s = status ? status.toUpperCase() : 'PENDING';
    if (s === 'APPROVED' || s === 'DA_PHE_DUYET') return <Tag color="success">Đã phê duyệt</Tag>;
    if (s === 'REJECTED' || s === 'TU_CHOI') return <Tag color="error">Từ chối</Tag>;
    return <Tag color="warning">Chờ duyệt</Tag>;
  };

  const getNguyenNhanLabel = (val: string) => {
    switch (val) {
      case 'GIAI_THE': return 'Giải thể';
      case 'HU_HONG': return 'Hư hỏng';
      case 'PHA_BO': return 'Phá bỏ';
      case 'HET_HAN_SU_DUNG': return 'Hết hạn sử dụng';
      default: return val || 'Khác';
    }
  };

  const columns = [
    {
      title: 'Tên tài sản',
      dataIndex: 'tenTaiSan',
      key: 'tenTaiSan',
    },
    {
      title: 'Đơn vị tính',
      dataIndex: 'donViTinh',
      key: 'donViTinh',
    },
    {
      title: 'Lý do giảm',
      dataIndex: 'lyDo',
      key: 'lyDo',
    },
    {
      title: 'Nguyên nhân giảm',
      dataIndex: 'nguyenNhanGiam',
      key: 'nguyenNhanGiam',
      render: (val: string) => getNguyenNhanLabel(val),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      key: 'trangThai',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Người tạo',
      dataIndex: 'createdByName',
      key: 'createdByName',
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: YeuCauGiamTaiSanResponse) => {
        const isPending = !record.trangThai || record.trangThai === 'CHO_PHE_DUYET' || record.trangThai === 'PENDING';
        return (
          <Space size="middle">
            {isPending && (
              <>
                <Tooltip title="Phê duyệt">
                  <Popconfirm
                    title="Bạn có chắc chắn muốn phê duyệt yêu cầu này?"
                    onConfirm={() => handleApprove(record.id)}
                    okText="Đồng ý"
                    cancelText="Hủy"
                  >
                    <Button
                      type="text"
                      style={{ color: '#52c41a' }}
                      icon={<CheckOutlined />}
                    />
                  </Popconfirm>
                </Tooltip>
                <Tooltip title="Từ chối">
                  <Button
                    type="text"
                    danger
                    icon={<CloseOutlined />}
                    onClick={() => handleOpenRejectModal(record.id)}
                  />
                </Tooltip>
                <Tooltip title="Chỉnh sửa">
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => handleOpenModal(record)}
                  />
                </Tooltip>
              </>
            )}
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa yêu cầu này?"
              onConfirm={() => handleDelete(record.id)}
              okText="Có"
              cancelText="Không"
            >
              <Tooltip title="Xóa">
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <Card
      title="Danh sách Yêu cầu Giảm Tài sản KCHT"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
          >
            Tạo yêu cầu
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
          showTotal: (totalCount) => `Tổng ${totalCount} yêu cầu giảm`,
          locale: { items_per_page: '/ trang' },
        }}
      />

      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>{editingItem ? 'Cập nhật yêu cầu giảm tài sản' : 'Tạo mới yêu cầu giảm tài sản'}</span>}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleCancel}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="taiSanId"
            label="Chọn tài sản KCHT cần giảm"
            rules={[{ required: true, message: 'Vui lòng chọn tài sản KCHT' }]}
          >
            <Select
              placeholder="Chọn tài sản..."
              showSearch
              optionFilterProp="children"
            >
              {taiSanList.map(ts => (
                <Select.Option key={ts.id} value={ts.id}>
                  [{ts.maTaiSan}] {ts.tenTaiSan}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="nguyenNhanGiam"
            label="Nguyên nhân giảm"
            rules={[{ required: true, message: 'Vui lòng chọn nguyên nhân giảm' }]}
          >
            <Select placeholder="Chọn nguyên nhân giảm...">
              <Select.Option value="GIAI_THE">Giải thể</Select.Option>
              <Select.Option value="HU_HONG">Hư hỏng</Select.Option>
              <Select.Option value="PHA_BO">Phá bỏ</Select.Option>
              <Select.Option value="HET_HAN_SU_DUNG">Hết hạn sử dụng</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="lyDo"
            label="Lý do chi tiết"
            rules={[{ required: true, message: 'Vui lòng nhập lý do' }]}
          >
            <Input.TextArea placeholder="Nhập lý do chi tiết..." rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Từ chối phê duyệt yêu cầu giảm</span>}
        open={isRejectModalOpen}
        onOk={handleRejectConfirm}
        onCancel={() => setIsRejectModalOpen(false)}
        okText="Xác nhận từ chối"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 8 }}>Vui lòng nhập lý do từ chối:</div>
          <Input.TextArea
            rows={4}
            value={rejectRemarks}
            onChange={e => setRejectRemarks(e.target.value)}
            placeholder="Nhập lý do từ chối..."
          />
        </div>
      </Modal>
    </Card>
  );
}

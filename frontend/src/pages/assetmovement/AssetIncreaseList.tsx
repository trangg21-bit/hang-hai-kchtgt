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
  fetchYeuCauTangList,
  createYeuCauTang,
  updateYeuCauTang,
  deleteYeuCauTang,
  fetchTaiSanKCHTList,
  approveYeuCauTang,
  rejectYeuCauTang,
} from '../../services/assetmovement/api';
import type { YeuCauTangTaiSanResponse, YeuCauTangTaiSanRequest } from '../../services/assetmovement/types';

export default function AssetIncreaseList() {
  const [dataSource, setDataSource] = useState<YeuCauTangTaiSanResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<YeuCauTangTaiSanResponse | null>(null);
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
      const res = await fetchYeuCauTangList({
        page: page - 1,
        size: pageSize,
      });
      setDataSource(res.content || []);
      setTotal(res.totalElements || 0);
    } catch (err: any) {
      message.error(err.message || 'Không thể tải danh sách yêu cầu tăng');
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

  const handleOpenModal = (record?: YeuCauTangTaiSanResponse) => {
    if (record) {
      setEditingItem(record);
      form.setFieldsValue({
        taiSanId: record.taiSanId,
        lyDo: record.lyDo,
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
      const payload: YeuCauTangTaiSanRequest = {
        taiSanId: values.taiSanId,
        lyDo: values.lyDo,
        tenTaiSan: '',
        soLuong: 1,
        donViTinh: 'Cái',
        maSoTang: '',
      };

      if (editingItem) {
        await updateYeuCauTang(editingItem.id, payload);
        message.success('Cập nhật yêu cầu tăng tài sản thành công!');
      } else {
        await createYeuCauTang(payload);
        message.success('Tạo mới yêu cầu tăng tài sản thành công!');
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
      await deleteYeuCauTang(id);
      message.success('Xóa yêu cầu thành công!');
      loadData();
    } catch (err: any) {
      message.error(err.message || 'Không thể xóa yêu cầu');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveYeuCauTang(id);
      message.success('Đã phê duyệt yêu cầu tăng tài sản!');
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
      await rejectYeuCauTang(rejectingId, rejectRemarks);
      message.success('Đã từ chối yêu cầu tăng tài sản!');
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

  const columns = [
    {
      title: 'Mã tài sản',
      dataIndex: 'maSoTang',
      key: 'maSoTang',
    },
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
      title: 'Lý do tăng',
      dataIndex: 'lyDo',
      key: 'lyDo',
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
      render: (_: any, record: YeuCauTangTaiSanResponse) => {
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
      title="Danh sách Yêu cầu Tăng Tài sản KCHT"
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
          showTotal: (totalCount) => `Tổng ${totalCount} yêu cầu tăng`,
          locale: { items_per_page: '/ trang' },
        }}
      />

      <Modal
        title={editingItem ? 'Cập nhật yêu cầu tăng tài sản' : 'Tạo mới yêu cầu tăng tài sản'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleCancel}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="taiSanId"
            label="Chọn tài sản KCHT"
            rules={[{ required: true, message: 'Vui lòng chọn tài sản KCHT' }]}
          >
            <Select
              placeholder="Chọn tài sản cần yêu cầu tăng..."
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
            name="lyDo"
            label="Lý do tăng"
            rules={[{ required: true, message: 'Vui lòng nhập lý do' }]}
          >
            <Input.TextArea placeholder="Nhập lý do tăng tài sản..." rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Từ chối phê duyệt yêu cầu tăng"
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

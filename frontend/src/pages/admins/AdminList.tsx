import { useState, useCallback } from 'react';
import {
  Button,
  Space,
  Tag,
  Card,
  Row,
  Col,
  Typography,
  Input,
  Select,
  Tooltip,
  Badge,
  Modal,
  Form,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { adminService } from '../../services/adminService';
import type { Admin, CreateAdminPayload, UpdateAdminPayload } from '../../services/adminService';
import { usePermissionStore } from '../../store/permissionStore';
import DataTable from '../../components/DataTable';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  active: { color: 'green', label: 'Hoạt động' },
  locked: { color: 'red', label: 'Đã khóa' },
  inactive: { color: 'default', label: 'Không hoạt động' },
};

export default function AdminList() {
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterRoleId, setFilterRoleId] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dataSource, setDataSource] = useState<Admin[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchAdmins = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await adminService.list({ page, pageSize, search: search || undefined, status: filterStatus, roleId: filterRoleId });
      setDataSource(res.data);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách quản trị viên'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, filterStatus, filterRoleId]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleTableChange = useCallback((pag: { current?: number; pageSize?: number }) => {
    setPage(pag.current || 1);
    setPageSize(pag.pageSize || 10);
  }, []);

  // ---- Modal handlers ----
  const openCreateModal = useCallback(() => {
    setEditingAdmin(null);
    form.resetFields();
    setModalOpen(true);
  }, [form]);

  const openEditModal = useCallback(
    (admin: Admin) => {
      setEditingAdmin(admin);
      form.setFieldsValue({
        fullName: admin.fullName,
        email: admin.email,
        phone: admin.phone,
        roleId: admin.roleId,
      });
      setModalOpen(true);
    },
    [form],
  );

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (editingAdmin) {
        const payload: UpdateAdminPayload = {
          fullName: values.fullName,
          email: values.email,
          phone: values.phone,
          roleId: values.roleId,
        };
        await adminService.update(editingAdmin.id, payload);
        toast.success('Đã cập nhật quản trị viên');
      } else {
        const payload: CreateAdminPayload = {
          username: values.username,
          fullName: values.fullName,
          email: values.email,
          phone: values.phone,
          password: values.password,
          roleId: values.roleId,
        };
        await adminService.create(payload);
        toast.success('Đã tạo quản trị viên mới');
      }
      setModalOpen(false);
      fetchAdmins();
    } catch {
      // validation error — antd shows errors inline
    } finally {
      setSubmitting(false);
    }
  }, [editingAdmin, form, fetchAdmins]);

  const handleDelete = useCallback(
    (admin: Admin) => {
      Modal.confirm({
        title: 'Xác nhận xóa quản trị viên',
        icon: <ExclamationCircleOutlined />,
        content: `Bạn có chắc chắn muốn xóa "${admin.fullName || admin.username}"? Hành động này không thể hoàn tác.`,
        okText: 'Xóa',
        okType: 'danger',
        cancelText: 'Hủy',
        onOk: async () => {
          try {
            await adminService.delete(admin.id);
            toast.success('Đã xóa quản trị viên');
            fetchAdmins();
          } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
          }
        },
      });
    },
    [fetchAdmins],
  );

  const columns = [
    { title: '#', width: 60, render: (_, __, idx: number) => (page - 1) * pageSize + idx + 1 },
    {
      title: 'Họ và tên',
      dataIndex: 'fullName',
      ellipsis: true,
      render: (text: string, record: Admin) => (
        <Space>
          <Badge status={record.status === 'active' ? 'success' : record.status === 'locked' ? 'error' : 'default'} />
          <Typography.Text strong>{text}</Typography.Text>
        </Space>
      ),
    },
    { title: 'Tên đăng nhập', dataIndex: 'username', ellipsis: true },
    { title: 'Email', dataIndex: 'email', ellipsis: true },
    {
      title: 'Vai trò',
      dataIndex: 'roleName',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 120,
      render: (status: string) => {
        const s = STATUS_MAP[status] || { color: 'default', label: status };
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    {
      title: 'Đăng nhập cuối',
      dataIndex: 'lastLoginAt',
      width: 180,
      render: (text?: string) => text ? dayjs(text).format('DD/MM/YYYY HH:mm') : <Typography.Text type="secondary">Chưa đăng nhập</Typography.Text>,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 180,
      fixed: 'right' as const,
      render: (_: unknown, record: Admin) => (
        <Space size="small">
          <Tooltip title="Nhật ký hoạt động">
            <Button
              type="link"
              size="small"
              icon={<FileTextOutlined />}
              onClick={() => { /* audit page — read-only navigation */ }}
            />
          </Tooltip>
          {hasPerm('admin.edit') && (
            <Tooltip title="Sửa">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => openEditModal(record)}
              />
            </Tooltip>
          )}
          {hasPerm('admin.delete') && (
            <Tooltip title="Xóa">
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle" justify="space-between">
          <Col xs={24} md={16}>
            <Space wrap>
              <Input.Search
                placeholder="Tìm theo tên, email, username..."
                allowClear
                style={{ width: 260 }}
                prefix={<SearchOutlined />}
                onSearch={handleSearch}
              />
              <Select
                placeholder="Vai trò"
                allowClear
                style={{ width: 200 }}
                value={filterRoleId}
                onChange={(val) => {
                  setFilterRoleId(val);
                  setPage(1);
                }}
                options={[
                  { value: 'system-admin', label: 'System Admin' },
                  { value: 'admin', label: 'Admin' },
                  { value: 'operator', label: 'Operator' },
                ]}
              />
              <Select
                placeholder="Trạng thái"
                allowClear
                style={{ width: 150 }}
                value={filterStatus}
                onChange={(val) => {
                  setFilterStatus(val);
                  setPage(1);
                }}
                options={[
                  { value: 'active', label: 'Hoạt động' },
                  { value: 'locked', label: 'Đã khóa' },
                  { value: 'inactive', label: 'Không hoạt động' },
                ]}
              />
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Space>
              <Tooltip title="Tải lại">
                <Button icon={<ReloadOutlined />} onClick={fetchAdmins} />
              </Tooltip>
              {hasPerm('admin.create') && (
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                  Thêm admin
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        {isLoading && <LoadingSkeleton rows={8} type="table" />}
        {isError && (
          <ErrorState
            message={error?.message || 'Không thể tải danh sách quản trị viên'}
            onRetry={fetchAdmins}
          />
        )}
        {!isLoading && !isError && dataSource.length === 0 && (
          <EmptyState
            description={search || filterStatus ? 'Không tìm thấy admin' : 'Chưa có quản trị viên nào'}
            ctaText="Thêm admin đầu tiên"
            onCta={openCreateModal}
          />
        )}
        {!isLoading && !isError && dataSource.length > 0 && (
          <DataTable<Admin>
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            scroll={{ x: 1200 }}
            onChange={handleTableChange}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: (p) => setPage(p),
              showSizeChanger: true,
              showTotal: (t) => `Tổng ${t} quản trị viên`,
              pageSizeOptions: ['10', '20', '50'],
            }}
          />
        )}
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        title={editingAdmin ? 'Sửa quản trị viên' : 'Thêm quản trị viên mới'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
        confirmLoading={submitting}
        okText={editingAdmin ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
        width={600}
        maskClosable={false}
      >
        <Spin spinning={submitting}>
          <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
            {!editingAdmin && (
              <>
                <Form.Item
                  name="username"
                  label="Tên đăng nhập"
                  rules={[
                    { required: true, message: 'Vui lòng nhập tên đăng nhập' },
                    { min: 4, message: 'Tối thiểu 4 ký tự' },
                    { pattern: /^[a-z0-9_]+$/, message: 'Chỉ chứa chữ thường, số và dấu gạch dưới' },
                  ]}
                >
                  <Input placeholder="vd: nguyenvana" autoComplete="off" />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Mật khẩu"
                  rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu' },
                    { min: 6, message: 'Tối thiểu 6 ký tự' },
                    {
                      pattern: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).+$/,
                      message: 'Phải có ít nhất 1 chữ hoa, 1 chữ thường và 1 số',
                    },
                  ]}
                >
                  <Input.Password placeholder="Ít nhất 6 ký tự" autoComplete="new-password" />
                </Form.Item>
              </>
            )}

            <Form.Item
              name="fullName"
              label="Họ và tên"
              rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
            >
              <Input placeholder="Nguyễn Văn A" />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: 'Vui lòng nhập email' },
                    { type: 'email', message: 'Email không hợp lệ' },
                  ]}
                >
                  <Input placeholder="email@example.com" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="phone"
                  label="Số điện thoại"
                  rules={[{ pattern: /^0\d{9,10}$/, message: 'Số điện thoại không hợp lệ (10-11 số)' }]}
                >
                  <Input placeholder="0901234567" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="roleId"
              label="Vai trò"
              rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
            >
              <Select
                placeholder="Chọn vai trò"
                options={[
                  { value: 'system-admin', label: 'System Admin' },
                  { value: 'admin', label: 'Admin' },
                  { value: 'operator', label: 'Operator' },
                ]}
              />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </>
  );
}

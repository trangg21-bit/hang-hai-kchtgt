import { useState, useCallback } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Modal,
  Form,
  Typography,
  Tooltip,
  Badge,
  Card,
  Row,
  Col,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  KeyOutlined,
  SearchOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useToggleLockUser,
  useResetPassword,
} from '../hooks/useUsers';
import { useRoles } from '../hooks/useRoles';
import { usePermissionStore } from '../store/permissionStore';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import type { User, CreateUserPayload, UpdateUserPayload } from '../types/user';

const { confirm } = Modal;

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  active: { color: 'green', label: 'Hoạt động' },
  locked: { color: 'red', label: 'Đã khóa' },
  inactive: { color: 'default', label: 'Không hoạt động' },
};

export default function UsersPage() {
  // Filters
  const [search, setSearch] = useState('');
  const [filterRoleId, setFilterRoleId] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend' | null>(null);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // Permissions
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  // Queries
  const { data, isLoading, isError, error, refetch } = useUsers({
    page,
    pageSize,
    search: search || undefined,
    roleId: filterRoleId,
    status: filterStatus,
    sortField,
    sortOrder,
  });

  const { data: rolesData } = useRoles();

  // Mutations
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const toggleLock = useToggleLockUser();
  const resetPassword = useResetPassword();

  // ---- Handlers ----
  const openCreateModal = useCallback(() => {
    setEditingUser(null);
    form.resetFields();
    setModalOpen(true);
  }, [form]);

  const openEditModal = useCallback(
    (user: User) => {
      setEditingUser(user);
      form.setFieldsValue({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        roleId: user.roleId,
        status: user.status,
      });
      setModalOpen(true);
    },
    [form],
  );

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (editingUser) {
        const payload: UpdateUserPayload = {
          fullName: values.fullName,
          email: values.email,
          phone: values.phone,
          roleId: values.roleId,
        };
        await updateUser.mutateAsync({ id: editingUser.id, payload });
      } else {
        const payload: CreateUserPayload = {
          username: values.username,
          fullName: values.fullName,
          email: values.email,
          phone: values.phone,
          password: values.password,
          roleId: values.roleId,
        };
        await createUser.mutateAsync(payload);
      }
      setModalOpen(false);
    } catch {
      // validation error — do nothing, antd shows errors inline
    } finally {
      setSubmitting(false);
    }
  }, [editingUser, form, createUser, updateUser]);

  const handleDelete = useCallback(
    (user: User) => {
      confirm({
        title: 'Xác nhận xóa người dùng',
        icon: <ExclamationCircleOutlined />,
        content: `Bạn có chắc chắn muốn xóa người dùng "${user.fullName}"? Hành động này không thể hoàn tác.`,
        okText: 'Xóa',
        okType: 'danger',
        cancelText: 'Hủy',
        onOk: () => deleteUser.mutateAsync(user.id),
      });
    },
    [deleteUser],
  );

  const handleToggleLock = useCallback(
    (user: User) => {
      const willBeLocked = user.status !== 'locked';
      confirm({
        title: willBeLocked ? 'Xác nhận khóa tài khoản' : 'Xác nhận mở khóa tài khoản',
        icon: <ExclamationCircleOutlined />,
        content: willBeLocked
          ? `Tài khoản "${user.fullName}" sẽ bị khóa và không thể đăng nhập. Tiếp tục?`
          : `Tài khoản "${user.fullName}" sẽ được mở khóa. Tiếp tục?`,
        okText: willBeLocked ? 'Khóa' : 'Mở khóa',
        okType: willBeLocked ? 'danger' : 'primary',
        cancelText: 'Hủy',
        onOk: () => toggleLock.mutateAsync(user.id),
      });
    },
    [toggleLock],
  );

  const handleResetPassword = useCallback(
    (user: User) => {
      confirm({
        title: 'Xác nhận đặt lại mật khẩu',
        icon: <ExclamationCircleOutlined />,
        content: `Mật khẩu của "${user.fullName}" sẽ được đặt lại thành mật khẩu ngẫu nhiên. Tiếp tục?`,
        okText: 'Đặt lại',
        cancelText: 'Hủy',
        onOk: () => resetPassword.mutateAsync(user.id),
      });
    },
    [resetPassword],
  );

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleTableChange = useCallback(
    (
      pag: { current?: number; pageSize?: number },
      _filters: any,
      sorter: any
    ) => {
      setPage(pag.current || 1);
      setPageSize(pag.pageSize || 10);
      if (sorter && sorter.field) {
        setSortField(sorter.field);
        setSortOrder(sorter.order || null);
      } else {
        setSortField(undefined);
        setSortOrder(null);
      }
    },
    []
  );

  // ---- Columns ----
  const columns: ColumnsType<User> = [
    {
      title: '#',
      width: 60,
      render: (_, __, idx) => (page - 1) * pageSize + idx + 1,
    },
    {
      title: 'Họ và tên',
      dataIndex: 'fullName',
      sorter: true,
      sortOrder: sortField === 'fullName' ? sortOrder : null,
      render: (text: string, record: User) => (
        <Space>
          <Badge
            status={record.status === 'active' ? 'success' : record.status === 'locked' ? 'error' : 'default'}
          />
          <Typography.Text strong>{text}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Tên đăng nhập',
      dataIndex: 'username',
      ellipsis: true,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      ellipsis: true,
    },
    {
      title: 'Vai trò',
      dataIndex: 'roleName',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (status: string) => {
        const s = STATUS_MAP[status] || { color: 'default', label: status };
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    {
      title: 'Đăng nhập cuối',
      dataIndex: 'lastLoginAt',
      render: (text: string) =>
        text ? dayjs(text).format('DD/MM/YYYY HH:mm') : <Typography.Text type="secondary">Chưa đăng nhập</Typography.Text>,
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_: unknown, record: User) => (
        <Space size="small">
          {hasPerm('user.edit') && (
            <Tooltip title="Sửa">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => openEditModal(record)}
              />
            </Tooltip>
          )}

          {hasPerm('user.lock') && (
            <Tooltip title={record.status === 'locked' ? 'Mở khóa' : 'Khóa'}>
              <Button
                type="link"
                size="small"
                danger={record.status !== 'locked'}
                icon={record.status === 'locked' ? <UnlockOutlined /> : <LockOutlined />}
                onClick={() => handleToggleLock(record)}
              />
            </Tooltip>
          )}

          {hasPerm('user.reset_password') && (
            <Tooltip title="Reset mật khẩu">
              <Button
                type="link"
                size="small"
                icon={<KeyOutlined />}
                onClick={() => handleResetPassword(record)}
              />
            </Tooltip>
          )}

          {hasPerm('user.delete') && (
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

  // ---- Render States ----
  const renderContent = () => {
    if (isLoading) return <LoadingSkeleton rows={8} />;
    if (isError)
      return (
        <ErrorState
          message={error?.message || 'Không thể tải danh sách người dùng'}
          onRetry={() => refetch()}
        />
      );
    if (!data || data.data.length === 0) {
      // If filters active, show "no results"
      if (search || filterRoleId || filterStatus) {
        return (
          <EmptyState
            description="Không tìm thấy người dùng nào phù hợp"
            ctaText="Xóa bộ lọc"
            onCta={() => {
              setSearch('');
              setFilterRoleId(undefined);
              setFilterStatus(undefined);
              setPage(1);
            }}
          />
        );
      }
      return (
        <EmptyState
          description="Chưa có người dùng nào"
          ctaText="Thêm người dùng đầu tiên"
          onCta={openCreateModal}
        />
      );
    }

    return (
      <Table<User>
        columns={columns}
        dataSource={data.data}
        rowKey="id"
        onChange={handleTableChange}
        loading={deleteUser.isPending || toggleLock.isPending}
        sticky={{ offsetHeader: 0 }}
        scroll={{ x: 1000 }}
      onRow={() => ({
        style: {
          cursor: 'pointer',
        },
      })}
        pagination={{
          current: page,
          pageSize,
          total: data.total,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} / ${total} người dùng`,
        }}
      />
    );
  };

  return (
    <>
      {/* Header & Filters */}
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
                options={rolesData?.map((r) => ({
                  value: r.code,
                  label: r.name,
                }))}
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
                <Button icon={<ReloadOutlined />} onClick={() => refetch()} />
              </Tooltip>
              {hasPerm('user.create') && (
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                  Thêm người dùng
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>{renderContent()}</Card>

      {/* Create / Edit Modal */}
      <Modal
        title={editingUser ? 'Sửa người dùng' : 'Thêm người dùng mới'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
        confirmLoading={submitting}
        okText={editingUser ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
        width={600}
        mask={{ closable: false }}
      >
        <Spin spinning={submitting}>
          <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
            {!editingUser && (
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
                  <Input name="username" placeholder="vd: nguyenvana" autoComplete="off" />
                </Form.Item>
 
                <Form.Item
                  name="password"
                  label="Mật khẩu"
                  rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu' },
                    { min: 8, message: 'Tối thiểu 8 ký tự' },
                    {
                      pattern: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).+$/,
                      message: 'Phải có ít nhất 1 chữ hoa, 1 chữ thường và 1 số',
                    },
                  ]}
                >
                  <Input.Password name="password" placeholder="Ít nhất 8 ký tự" autoComplete="new-password" />
                </Form.Item>
              </>
            )}
 
            <Form.Item
              name="fullName"
              label="Họ và tên"
              rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
            >
              <Input name="fullName" placeholder="Nguyễn Văn A" />
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
                  <Input name="email" placeholder="email@example.com" />
                </Form.Item>
              </Col>
 
              <Col xs={24} md={12}>
                <Form.Item
                  name="phone"
                  label="Số điện thoại"
                  rules={[{ pattern: /^0\d{9,10}$/, message: 'Số điện thoại không hợp lệ (10-11 số)' }]}
                >
                  <Input name="phone" placeholder="0901234567" />
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
                options={rolesData?.map((r) => ({
                  value: r.code,
                  label: r.name,
                }))}
              />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </>
  );
}

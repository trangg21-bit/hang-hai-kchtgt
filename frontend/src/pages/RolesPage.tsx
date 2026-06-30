import { useState, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Tag,
  Modal,
  Form,
  Typography,
  Tooltip,
  Tree,
  Spin,
  Row,
  Col,
  message,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  SafetyOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  useRoles,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
} from '../hooks/useRoles';
import { usePermissions } from '../hooks/usePermissions';
import { usePermissionStore } from '../store/permissionStore';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import type { Role, CreateRolePayload, UpdateRolePayload } from '../types/role';
import type { TreeProps } from 'antd';
import { ALL_PERMISSIONS } from '../services/mockData';

const { confirm } = Modal;

/** Look up Vietnamese display name for a permission key. */
function getPermissionName(key: string): string {
  const perm = ALL_PERMISSIONS.find((p) => p.key === key);
  return perm ? perm.name : key;
}

export default function RolesPage() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [form] = Form.useForm();
  const hasPerm = usePermissionStore((s) => s.hasPermission);
  const { tree, allGroupKeys } = usePermissions();

  // Query
  const { data: rolesData, isLoading, isError, error, refetch } = useRoles({
    page,
    pageSize,
    search: search || undefined,
  });

  const roles = rolesData?.data || [];
  const total = rolesData?.total || 0;

  // Mutations
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();

  // ---- Handlers ----
  const openCreateModal = useCallback(() => {
    setEditingRole(null);
    setCheckedKeys([]);
    form.resetFields();
    form.setFieldsValue({ permissions: [] });
    setModalOpen(true);
  }, [form]);

  const openEditModal = useCallback(
    (role: Role) => {
      setEditingRole(role);
      setCheckedKeys(role.permissions);
      form.setFieldsValue({
        name: role.name,
        code: role.code,
        description: role.description,
        permissions: role.permissions,
      });
      setModalOpen(true);
    },
    [form],
  );

  const handleTreeCheck: TreeProps['onCheck'] = useCallback(
    (checked) => {
      const keys = Array.isArray(checked) ? checked : checked.checked;
      const mapped = keys.map(String);
      setCheckedKeys(mapped);
      form.setFieldsValue({ permissions: mapped });
    },
    [form],
  );

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const actualPermissions = checkedKeys.filter((k) => !allGroupKeys.includes(k));

      if (editingRole) {
        const payload: UpdateRolePayload = {
          name: values.name,
          code: values.code,
          description: values.description,
          permissions: actualPermissions,
        };
        await updateRole.mutateAsync({ id: editingRole.id, payload });
      } else {
        const payload: CreateRolePayload = {
          name: values.name,
          code: values.code,
          description: values.description,
          permissions: actualPermissions,
        };
        await createRole.mutateAsync(payload);
      }
      setModalOpen(false);
    } catch {
      // validation error
    } finally {
      setSubmitting(false);
    }
  }, [editingRole, form, checkedKeys, allGroupKeys, createRole, updateRole]);

  const handleDelete = useCallback(
    (role: Role) => {
      if (role.userCount > 0) {
        message.warning(`Vai trò "${role.name}" đang có ${role.userCount} người dùng. Vui lòng chuyển người dùng sang vai trò khác trước khi xóa.`);
        return;
      }

      confirm({
        title: 'Xác nhận xóa vai trò',
        icon: <ExclamationCircleOutlined />,
        content: `Bạn có chắc chắn muốn xóa vai trò "${role.name}"? Hành động này không thể hoàn tác.`,
        okText: 'Xóa',
        okType: 'danger',
        cancelText: 'Hủy',
        onOk: () => deleteRole.mutateAsync(role.id),
      });
    },
    [deleteRole],
  );

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleTableChange = useCallback(
    (pag: { current?: number; pageSize?: number }) => {
      setPage(pag.current || 1);
      setPageSize(pag.pageSize || 5);
    },
    []
  );

  // ---- Permission count display ----
  const getCheckedCount = () => {
    // Only count leaf (permission) keys, not group keys
    return checkedKeys.filter((k) => !allGroupKeys.includes(k)).length;
  };

  // ---- Render ----
  const renderContent = () => {
    if (isLoading) return <LoadingSkeleton rows={4} />;
    if (isError)
      return (
        <ErrorState
          message={error?.message || 'Không thể tải danh sách vai trò'}
          onRetry={() => refetch()}
        />
      );
    if (!roles || roles.length === 0) {
      if (search) {
        return (
          <EmptyState
            description="Không tìm thấy vai trò nào"
            ctaText="Xóa tìm kiếm"
            onCta={() => setSearch('')}
          />
        );
      }
      return (
        <EmptyState
          description="Chưa có vai trò nào"
          ctaText="Tạo vai trò đầu tiên"
          onCta={openCreateModal}
        />
      );
    }

    return (
      <Table<Role>
        columns={columns}
        dataSource={roles}
        rowKey="id"
        pagination={{
          current: page,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          showTotal: (t) => `Tổng ${t} vai trò`,
          pageSizeOptions: ['5', '10', '20', '50']
        }}
        onChange={handleTableChange}
        scroll={{ x: 800 }}
      />
    );
  };

  // ---- Columns ----
  const columns: ColumnsType<Role> = [
    {
      title: 'Tên vai trò',
      dataIndex: 'name',
      render: (text: string, record: Role) => (
        <Space>
          <SafetyOutlined style={{ color: '#1677ff' }} />
          <Typography.Text strong>{text}</Typography.Text>
          {record.id === 'role-001' && <Tag color="volcano">Hệ thống</Tag>}
        </Space>
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      ellipsis: true,
    },
    {
      title: 'Quyền hạn',
      dataIndex: 'permissions',
      render: (perms: string[]) => (
        <Tooltip
          title={
            <ul style={{ paddingLeft: 16, margin: 0 }}>
              {perms.map((p) => (
                <li key={p}>{getPermissionName(p)}</li>
              ))}
            </ul>
          }
        >
          <Tag color="blue">{perms.length} quyền</Tag>
        </Tooltip>
      ),
    },
    {
      title: 'Số người dùng',
      dataIndex: 'userCount',
      align: 'center',
      render: (count: number) => (
        <Tag color={count > 0 ? 'green' : 'default'}>{count}</Tag>
      ),
    },
    {
      title: 'Cập nhật cuối',
      dataIndex: 'updatedAt',
      render: (text: string) => dayjs(text).format('DD/MM/YYYY'),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: Role) => (
        <Space size="small">
          {hasPerm('role.edit') && (
            <Tooltip title="Sửa">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => openEditModal(record)}
              />
            </Tooltip>
          )}
          {hasPerm('role.delete') && record.id !== 'role-001' && (
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
      {/* Header & Search */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle" justify="space-between">
          <Col>
            <Input.Search
              placeholder="Tìm vai trò..."
              allowClear
              style={{ width: 300 }}
              prefix={<SearchOutlined />}
              onSearch={handleSearch}
            />
          </Col>
          <Col>
            <Space>
              <Tooltip title="Tải lại">
                <Button icon={<ReloadOutlined />} onClick={() => refetch()} />
              </Tooltip>
              {hasPerm('role.create') && (
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                  Tạo vai trò
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
        title={editingRole ? 'Sửa vai trò' : 'Tạo vai trò mới'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
        confirmLoading={submitting}
        okText={editingRole ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
        width={700}
        mask={{ closable: false }}
      >
        <Spin spinning={submitting}>
          <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item
              name="name"
              label="Tên vai trò"
              rules={[{ required: true, message: 'Vui lòng nhập tên vai trò' }]}
            >
              <Input placeholder="vd: Quản trị viên" />
            </Form.Item>

            <Form.Item
              name="code"
              label="Mã vai trò"
              rules={[
                { required: true, message: 'Vui lòng nhập mã vai trò' },
                { pattern: /^[a-zA-Z0-9_]+$/, message: 'Chỉ chứa chữ, số và dấu gạch dưới' },
              ]}
            >
              <Input placeholder="vd: senior_admin" />
            </Form.Item>

            <Form.Item
              name="description"
              label="Mô tả"
              rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
            >
              <Input.TextArea rows={2} placeholder="Mô tả ngắn gọn về vai trò" />
            </Form.Item>

            <Form.Item
              name="permissions"
              label="Phân quyền"
              rules={[
                {
                  validator: (_: unknown, value: string[]) => {
                    if (!value || value.length === 0) {
                      return Promise.reject(
                        new Error('Vui lòng chọn ít nhất một quyền cho vai trò'),
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Card
                size="small"
                title={
                  <Space>
                    <KeyOutlined />
                    <span>Danh sách quyền</span>
                    <Tag>{getCheckedCount()} quyền đã chọn</Tag>
                  </Space>
                }
                style={{ borderColor: '#d9d9d9' }}
              >
                <Tree
                  checkable
                  defaultExpandAll
                  checkedKeys={checkedKeys}
                  onCheck={handleTreeCheck}
                  treeData={tree}
                  style={{ maxHeight: 320, overflow: 'auto' }}
                />
              </Card>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </>
  );
}

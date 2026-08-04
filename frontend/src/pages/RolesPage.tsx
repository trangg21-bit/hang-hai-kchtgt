import { useState, useCallback, useMemo } from 'react';
import {
  Button,
  Tag,
  Modal,
  Form,
  Input,
  Typography,
  Tree,
  Spin,
  Card,
  Space,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import type { TreeProps } from 'antd';
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
import { ScreenHeader, FilterBar, DataTable } from '../components/list-view';
import Pagination from '../components/list-view/Pagination';
import type { Role, CreateRolePayload, UpdateRolePayload } from '../types/role';
import { actionPrimary, textSecondary, textPrimary, fontSizeMd, fontSizeLg, fontWeightMedium, fontWeightBold, cardStyle, radiusMd, radiusPill, borderDefault, spaceFormField, statusOperational, statusCritical } from '../tokens';
import { colors } from '../theme';
import toast from '../components/ToastNotification';

const { confirm } = Modal;

const labelProps = (text: string) => ({ label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span> });

export default function RolesPage() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [checkedPermissionKeys, setCheckedPermissionKeys] = useState<string[]>([]);
  const [menuSearch, setMenuSearch] = useState('');
  const [permissionSearch, setPermissionSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [form] = Form.useForm();
  const hasPerm = usePermissionStore((s) => s.hasPermission);
  const { tree, apiPermissions, isLoading: permissionsLoading, isError: permissionsError } = usePermissions();
  const filteredTree = useMemo(() => {
    const keyword = menuSearch.trim().toLowerCase();
    if (!keyword) return tree;
    const filter = (nodes: typeof tree): typeof tree => nodes.flatMap((node) => {
      const children = filter(node.children || []);
      const matches = node.title.toLowerCase().includes(keyword) || node.key.toLowerCase().includes(keyword);
      return matches || children.length ? [{ ...node, children }] : [];
    });
    return filter(tree);
  }, [tree, menuSearch]);
  const expandedMenuKeys = useMemo(() => {
    const keys = (nodes: typeof tree): string[] => nodes.flatMap((node) => [node.key, ...keys(node.children || [])]);
    return keys(filteredTree);
  }, [filteredTree]);
  const parentByKey = useMemo(() => {
    const parents: Record<string, string> = {};
    const visit = (nodes: typeof tree) => nodes.forEach((node) => {
      (node.children || []).forEach((child) => {
        parents[child.key] = node.key;
      });
      visit(node.children || []);
    });
    visit(tree);
    return parents;
  }, [tree]);
  const filteredApiPermissions = useMemo(() => {
    const keyword = permissionSearch.trim().toLowerCase();
    return apiPermissions
      .filter((permission) => !keyword
        || permission.key.toLowerCase().includes(keyword)
        || permission.name.toLowerCase().includes(keyword)
        || permission.group.toLowerCase().includes(keyword))
      .map((permission) => ({
        key: permission.key,
        title: `${permission.name} (${permission.key})`,
      }));
  }, [apiPermissions, permissionSearch]);

  const { data: rolesData, isLoading, isError, error, refetch } = useRoles({
    page,
    pageSize,
    search: search || undefined,
  });

  const roles = rolesData?.data || [];
  const total = rolesData?.total || 0;

  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();

  const openCreateModal = useCallback(() => {
    setEditingRole(null);
    setCheckedKeys([]);
    setCheckedPermissionKeys([]);
    setMenuSearch('');
    setPermissionSearch('');
    form.resetFields();
    form.setFieldsValue({ menuCodes: [], permissions: [] });
    setModalOpen(true);
  }, [form]);

  const openEditModal = useCallback(
    (role: Role) => {
      setEditingRole(role);
      setCheckedKeys(role.menuCodes ?? []);
      setCheckedPermissionKeys(role.permissions ?? []);
      setMenuSearch('');
      setPermissionSearch('');
      form.setFieldsValue({
        name: role.name,
        code: role.code,
        description: role.description,
        menuCodes: role.menuCodes ?? [],
        permissions: role.permissions ?? [],
      });
      setModalOpen(true);
    },
    [form],
  );

  const handleTreeCheck: TreeProps['onCheck'] = useCallback(
    (checked) => {
      const keys = Array.isArray(checked) ? checked : checked.checked;
      const selected = new Set(keys.map(String));
      keys.map(String).forEach((key) => {
        let parent = parentByKey[key];
        while (parent) {
          selected.add(parent);
          parent = parentByKey[parent];
        }
      });
      const mapped = Array.from(selected);
      setCheckedKeys(mapped);
      form.setFieldsValue({ menuCodes: mapped });
    },
    [form, parentByKey],
  );

  const handleApiPermissionCheck: TreeProps['onCheck'] = useCallback(
    (checked) => {
      const keys = (Array.isArray(checked) ? checked : checked.checked).map(String);
      setCheckedPermissionKeys(keys);
      form.setFieldsValue({ permissions: keys });
    },
    [form],
  );

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const actualMenuCodes = checkedKeys;
      const actualPermissions = checkedPermissionKeys;

      if (editingRole) {
        const payload: UpdateRolePayload = {
          name: values.name,
          code: values.code,
          description: values.description,
          permissions: actualPermissions,
          menuCodes: actualMenuCodes,
        };
        await updateRole.mutateAsync({ id: editingRole.id, payload });
      } else {
        const payload: CreateRolePayload = {
          name: values.name,
          code: values.code,
          description: values.description,
          permissions: actualPermissions,
          menuCodes: actualMenuCodes,
        };
        await createRole.mutateAsync(payload);
      }
      setModalOpen(false);
    } catch (err: any) {
      if (err.errorFields) return;
      const msg = err.response?.data?.message || err.message || 'Lỗi hệ thống';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }, [editingRole, form, checkedKeys, checkedPermissionKeys, createRole, updateRole]);

  const handleDelete = useCallback(
    (role: Role) => {
      if (role.userCount > 0) {
        toast.warning(`Vai trò "${role.name}" đang có ${role.userCount} người dùng. Vui lòng chuyển người dùng sang vai trò khác trước khi xóa.`);
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

  const handleFilterSearch = useCallback((values: Record<string, any>) => {
    setSearch(values.search || '');
    setPage(1);
  }, []);

  const handleFilterReset = useCallback(() => {
    setSearch('');
    setPage(1);
  }, []);

  const handlePageChange = useCallback((p: number, ps: number) => {
    setPage(p);
    setPageSize(ps);
  }, []);

  const getCheckedCount = () => checkedKeys.length + checkedPermissionKeys.length;

  // ---- Row actions ----
  const rowActions = useCallback((record: Role) => {
    const actions: {
      key: string; label: string;
      icon?: React.ReactNode; onClick: () => void; danger?: boolean;
    }[] = [];
    if (hasPerm('role.edit')) actions.push({ key: 'edit', label: 'Sửa', icon: <EditOutlined />, onClick: () => openEditModal(record) });
    if (hasPerm('role.delete') && record.id !== 'role-001') actions.push({ key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, onClick: () => handleDelete(record), danger: true });
    return actions;
  }, [hasPerm, openEditModal, handleDelete]);

  // ---- Columns ----
  const columns = useMemo(() => [
    { key: 'sequenceNo', label: 'STT', width: 60, type: 'mono' as const, align: 'center' as const, render: (_: unknown, __: unknown, idx: number) => <span style={{ fontSize: fontSizeMd }}>{(page - 1) * pageSize + idx + 1}</span> },
    { key: 'name', label: 'Tên vai trò', dataIndex: 'name', width: 220, align: 'left' as const, render: (text: string, record: Role) => (
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Typography.Text strong>{text}</Typography.Text>
        {record.id === 'role-001' && <Tag color="volcano">Hệ thống</Tag>}
      </span>
    ) },
    { key: 'description', label: 'Mô tả', dataIndex: 'description', width: 260, align: 'left' as const, render: (text?: string) => text ? <Typography.Text>{text}</Typography.Text> : <Typography.Text type="secondary">—</Typography.Text> },
    { key: 'permissions', label: 'Chức năng', dataIndex: 'menuCodes', width: 130, align: 'center' as const, render: (_: string[], record: Role) => {
      const count = (record.menuCodes?.length ?? 0) || record.permissions.length;
      return <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 8, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${actionPrimary}15`, color: actionPrimary }}>{count} chức năng</span>;
    } },
    { key: 'userCount', label: 'Người dùng', dataIndex: 'userCount', width: 120, align: 'center' as const, render: (count: number) => (
      <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 8, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: count > 0 ? `${statusOperational}15` : `${textSecondary}15`, color: count > 0 ? statusOperational : textSecondary }}>{count}</span>
    ) },
    { key: 'updatedAt', label: 'Cập nhật cuối', dataIndex: 'updatedAt', width: 140, align: 'center' as const, render: (text: string) => text ? <span>{dayjs(text).format('DD/MM/YYYY')}</span> : <Typography.Text type="secondary">—</Typography.Text> },
  ], [page, pageSize]);

  // ---- Filter fields ----
  const filterFields = useMemo(() => [
    { key: 'search', type: 'search' as const, label: 'Tìm kiếm', placeholder: 'Tìm theo tên, mô tả...' },
  ], []);

  // ---- Header actions ----
  const headerActions = useMemo(() => {
    const actions: any[] = [];
    if (hasPerm('role.create')) actions.push({ key: 'create', label: 'Tạo vai trò', variant: 'primary' as const, icon: <PlusOutlined />, onClick: openCreateModal });
    return actions;
  }, [hasPerm, openCreateModal]);

  const renderContent = () => {
    if (isLoading) return <LoadingSkeleton rows={6} />;
    if (isError) return <ErrorState message={error?.message || 'Không thể tải danh sách vai trò'} onRetry={() => refetch()} />;
    if (roles.length === 0) {
      if (search) return <EmptyState description="Không tìm thấy vai trò nào phù hợp" />;
      return <EmptyState description="Chưa có vai trò nào" />;
    }
    return (
      <div style={{ overflowX: 'auto' }}>
        <DataTable columns={columns} dataSource={roles} rowKey="id" rowActions={rowActions} scroll={{ x: 930 }} />
        <Pagination total={total} current={page} pageSize={pageSize} onChange={handlePageChange} />
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100%', marginTop: -8 }}>
      <ScreenHeader breadcrumb={[{ label: 'Quản trị hệ thống' }, { label: 'Phân quyền' }]} actions={headerActions} />
      <FilterBar fields={filterFields} onSearch={handleFilterSearch} onReset={handleFilterReset} />
      <div style={{ ...cardStyle, padding: '8px 16px', marginBottom: 4 }}>
        {renderContent()}
      </div>

      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>{editingRole ? 'Sửa vai trò' : 'Tạo vai trò mới'}</span>}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
        confirmLoading={submitting}
        width={700}
        mask={{ closable: false }}
        footer={[
          <Button key="cancel" onClick={() => setModalOpen(false)} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="ok" type="primary" onClick={handleSubmit} loading={submitting} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>{editingRole ? 'Cập nhật' : 'Tạo mới'}</Button>,
        ]}
      >
        <Spin spinning={submitting}>
          <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item name="name" {...labelProps('Tên vai trò')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng nhập tên vai trò' }]}>
              <Input placeholder="vd: Quản trị viên" style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>
            <Form.Item name="code" {...labelProps('Mã vai trò')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng nhập mã vai trò' }, { pattern: /^[a-zA-Z0-9_]+$/, message: 'Chỉ chứa chữ, số và dấu gạch dưới' }]}>
              <Input placeholder="vd: senior_admin" style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>
            <Form.Item
              name="menuCodes"
              {...labelProps('Phân quyền')}
              style={{ marginBottom: spaceFormField }}
              rules={[{
                validator: (_: unknown, value: string[]) => {
                  if ((!value || value.length === 0) && checkedPermissionKeys.length === 0) return Promise.reject(new Error('Vui lòng chọn ít nhất một quyền cho vai trò'));
                  return Promise.resolve();
                },
              }]}
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
                style={{ borderColor: borderDefault }}
              >
                <Spin spinning={permissionsLoading} tip="Đang tải danh sách quyền...">
                  {permissionsError ? (
                    <Typography.Text type="danger">Không thể tải danh sách quyền từ hệ thống.</Typography.Text>
                  ) : (
                    <>
                      <Input
                        allowClear
                        value={menuSearch}
                        onChange={(event) => setMenuSearch(event.target.value)}
                        placeholder="Tìm tên chức năng"
                        style={{ borderRadius: radiusPill, height: 40, marginBottom: 8 }}
                      />
                      <Tree
                        checkable
                        expandedKeys={expandedMenuKeys}
                        autoExpandParent
                        checkedKeys={checkedKeys}
                        onCheck={handleTreeCheck}
                        treeData={filteredTree}
                        style={{ maxHeight: 320, overflow: 'auto' }}
                      />
                      <Typography.Text strong style={{ display: 'block', margin: '16px 0 8px' }}>
                        Quyền thao tác API
                      </Typography.Text>
                      <Input
                        allowClear
                        value={permissionSearch}
                        onChange={(event) => setPermissionSearch(event.target.value)}
                        placeholder="Tìm theo mã hoặc tên quyền"
                        style={{ borderRadius: radiusPill, height: 40, marginBottom: 8 }}
                      />
                      <Tree
                        checkable
                        checkedKeys={checkedPermissionKeys}
                        onCheck={handleApiPermissionCheck}
                        treeData={filteredApiPermissions}
                        selectable={false}
                        style={{ maxHeight: 240, overflow: 'auto' }}
                      />
                    </>
                  )}
                </Spin>
              </Card>
            </Form.Item>
            <Form.Item name="description" {...labelProps('Mô tả')} style={{ marginBottom: 0 }} rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}>
              <Input.TextArea rows={2} placeholder="Mô tả ngắn gọn về vai trò" />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </div>
  );
}


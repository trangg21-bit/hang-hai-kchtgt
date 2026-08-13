import { useState, useCallback, useMemo, useDeferredValue } from 'react';
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
  Drawer,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  useRoles,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
} from '../hooks/useRoles';
import { getVisiblePermissionKeys, mergePermissionKeys, usePermissions } from '../hooks/usePermissions';
import { usePermissionStore } from '../store/permissionStore';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { ScreenHeader, DataTable } from '../components/list-view';
import FilterTableLayout, { type StatusTab } from '../components/list-view/FilterTableLayout';
import Pagination from '../components/list-view/Pagination';
import type { Role, CreateRolePayload, UpdateRolePayload } from '../types/role';
import { actionPrimary, textSecondary, fontSizeMd, fontWeightMedium, fontWeightBold, radiusPill, borderDefault, spaceFormField, statusOperational, drawerProps, drawerTitleStyle, drawerCloseBtnStyle, drawerFooterStyle, primaryButtonStyle, outlineButtonStyle } from '../tokens';
import { colors } from '../theme';
import toast from '../components/ToastNotification';

const { confirm } = Modal;

const labelProps = (text: string) => ({ label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span> });

export default function RolesPage() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [menuSearch, setMenuSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [form] = Form.useForm();
  const hasPerm = usePermissionStore((s) => s.hasPermission);
  const { tree, isLoading: permissionsLoading, isError: permissionsError } = usePermissions();
  const deferredMenuSearch = useDeferredValue(menuSearch);

  const filteredTree = useMemo(() => {
    const keyword = deferredMenuSearch.trim().toLowerCase();
    if (!keyword) return tree;
    const filter = (nodes: typeof tree): typeof tree => nodes.flatMap((node) => {
      const children = filter(node.children || []);
      const matches = node.title.toLowerCase().includes(keyword) || node.key.toLowerCase().includes(keyword);
      return matches || children.length ? [{ ...node, children }] : [];
    });
    return filter(tree);
  }, [tree, deferredMenuSearch]);

  const [userExpandedKeys, setUserExpandedKeys] = useState<string[] | null>(null);

  const autoExpandedKeys = useMemo(() => {
    if (!modalOpen) return [];
    const keys = (nodes: typeof tree): string[] => nodes.flatMap((node) => [node.key, ...keys(node.children || [])]);
    return keys(filteredTree);
  }, [filteredTree, modalOpen]);

  const effectiveExpandedKeys = userExpandedKeys ?? autoExpandedKeys;

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
    setMenuSearch('');
    setUserExpandedKeys(null);
    setModalOpen(true);
    setTimeout(() => {
      form.resetFields();
      form.setFieldsValue({ menuCodes: [], permissions: [] });
    }, 0);
  }, [form]);

  const openEditModal = useCallback(
    (role: Role) => {
      const activePerms = (role.permissions && role.permissions.length > 0) ? role.permissions : (role.menuCodes ?? []);
      setEditingRole(role);
      setCheckedKeys(activePerms);
      setMenuSearch('');
      setUserExpandedKeys(null);
      setModalOpen(true);
      setTimeout(() => {
        form.setFieldsValue({
          name: role.name,
          code: role.code,
          description: role.description,
          menuCodes: activePerms,
          permissions: activePerms,
        });
      }, 0);
    },
    [form],
  );

  const leafKeysSet = useMemo(() => {
    const set = new Set<string>();
    const visit = (nodes: typeof tree) => {
      nodes.forEach((node) => {
        if (!node.children || node.children.length === 0) {
          set.add(node.key);
        } else {
          visit(node.children);
        }
      });
    };
    visit(tree);
    return set;
  }, [tree]);

  const selectedLeafCount = useMemo(() => {
    return checkedKeys.filter((k) => leafKeysSet.has(k)).length;
  }, [checkedKeys, leafKeysSet]);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const selectedPerms = checkedKeys.filter((k) => !k.startsWith('group_'));
      if (selectedPerms.length === 0) {
        toast.error('Vui lòng chọn ít nhất một quyền cho vai trò');
        return;
      }

      if (editingRole) {
        const payload: UpdateRolePayload = {
          name: values.name,
          code: values.code,
          description: values.description,
          permissions: selectedPerms,
          menuCodes: selectedPerms,
        };
        await updateRole.mutateAsync({ id: editingRole.id, payload });
      } else {
        const payload: CreateRolePayload = {
          name: values.name,
          code: values.code,
          description: values.description,
          permissions: selectedPerms,
          menuCodes: selectedPerms,
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
  }, [editingRole, form, checkedKeys, createRole, updateRole]);

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

  const handleFilterSearch = useCallback((values: Record<string, string | undefined>) => {
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
    { key: 'sequenceNo', label: 'STT', width: 60, type: 'mono' as const, align: 'center' as const, fixed: 'left' as const, render: (_: unknown, __: unknown, idx: number) => <span style={{ fontSize: fontSizeMd }}>{(page - 1) * pageSize + idx + 1}</span> },
    { key: 'nameCode', label: 'Mã – Tên vai trò', dataIndex: 'name', width: 280, align: 'left' as const, render: (text: string, record: Role) => (
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Typography.Text strong>{record.code} – {text}</Typography.Text>
        {record.id === 'role-001' && <Tag color="volcano" style={{ borderRadius: radiusPill }}>Hệ thống</Tag>}
      </span>
    ) },
    { key: 'description', label: 'Mô tả', dataIndex: 'description', width: 260, align: 'left' as const, render: (text?: string) => text ? <Typography.Text>{text}</Typography.Text> : <Typography.Text type="secondary">—</Typography.Text> },
    { key: 'permissions', label: 'Chức năng', dataIndex: 'menuCodes', width: 140, align: 'center' as const, render: (_: string[], record: Role) => {
      const count = (record.menuCodes?.length ?? 0) || record.permissions.length;
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px',
          border: `1px solid ${actionPrimary}40`, borderRadius: radiusPill,
          fontSize: fontSizeMd, fontWeight: fontWeightMedium,
          background: `${actionPrimary}15`, color: actionPrimary, whiteSpace: 'nowrap'
        }}>
          {count} chức năng
        </span>
      );
    } },
    { key: 'userCount', label: 'Người dùng', dataIndex: 'userCount', width: 120, align: 'center' as const, render: (count: number) => {
      const color = count > 0 ? statusOperational : textSecondary;
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px',
          border: `1px solid ${color}40`, borderRadius: radiusPill,
          fontSize: fontSizeMd, fontWeight: fontWeightMedium,
          background: `${color}15`, color, whiteSpace: 'nowrap'
        }}>
          {count}
        </span>
      );
    } },
    { key: 'updatedAt', label: 'Cập nhật cuối', dataIndex: 'updatedAt', width: 150, align: 'center' as const, render: (text: string) => text ? <span>{dayjs(text).format('DD/MM/YYYY')}</span> : <Typography.Text type="secondary">—</Typography.Text> },
  ], [page, pageSize]);

  // ---- Filter content ----
  const filterContent = (
    <>
      <div style={{ marginBottom: 12, marginTop: 16 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: 4 }}>Tìm kiếm</div>
        <Input
          placeholder="Tìm theo tên, mô tả..."
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onPressEnter={() => { handleFilterSearch({ search }); }}
          style={{ borderRadius: radiusPill, height: 40 }}
        />
      </div>
    </>
  );

  const statusTabs: StatusTab[] = [];

  // ---- Header actions ----
  const headerActions = useMemo(() => {
    const actions: Array<{ key: string; label: string; variant?: string; icon?: React.ReactNode; onClick: () => void }> = [];
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
      <>
        <style>{`.list-view-table .ant-table-cell { padding-block: 9px !important; }`}</style>
        <DataTable columns={columns} dataSource={roles} rowKey="id" rowActions={rowActions} scroll={{ x: 1400, y: 'calc(100vh - 350px)' }} />
        <Pagination total={total} current={page} pageSize={pageSize} onChange={handlePageChange} />
      </>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
      <ScreenHeader breadcrumb={[{ label: 'Quản trị hệ thống' }, { label: 'Phân quyền' }]} actions={headerActions} />
      <FilterTableLayout
        filterCollapsed={filterCollapsed}
        onToggleCollapse={() => setFilterCollapsed(!filterCollapsed)}
        onFilterApply={handleFilterSearch}
        onFilterReset={handleFilterReset}
        loading={isLoading}
        error={isError}
        onRetry={() => refetch()}
        filterContent={filterContent}
        statusTabs={statusTabs}
        onStatusTabChange={() => {}}
      >
        {renderContent()}
      </FilterTableLayout>

      <Drawer
        {...drawerProps}
        title={<span style={drawerTitleStyle}>{editingRole ? 'Sửa vai trò' : 'Tạo vai trò mới'}</span>}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        extra={<Button type="text" onClick={() => setModalOpen(false)} style={drawerCloseBtnStyle}>✕</Button>}
        footer={
          <div style={drawerFooterStyle}>
            <Button onClick={() => setModalOpen(false)} style={outlineButtonStyle}>Hủy</Button>
            <Button type="primary" onClick={handleSubmit} loading={submitting} style={primaryButtonStyle}>{editingRole ? 'Cập nhật' : 'Tạo mới'}</Button>
          </div>
        }
      >
        <Spin spinning={submitting}>
          <Form form={form} layout="vertical" style={{ marginTop: 16 }}
            labelCol={{ style: { padding: 0, marginBottom: 4 } }}
          >
            <Form.Item name="name" {...labelProps('Tên vai trò')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng nhập tên vai trò' }]}>
              <Input placeholder="vd: Quản trị viên" style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>
            <Form.Item name="code" {...labelProps('Mã vai trò')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng nhập mã vai trò' }, { pattern: /^[a-zA-Z0-9_]+$/, message: 'Chỉ chứa chữ, số và dấu gạch dưới' }]}>
              <Input placeholder="vd: senior_admin" style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>
            <Form.Item {...labelProps('Phân quyền')} style={{ marginBottom: spaceFormField }}>
              <Card
                size="small"
                title={
                  <Space>
                    <KeyOutlined />
                    <span>Danh sách quyền</span>
                    <Tag color="blue">{selectedLeafCount} quyền đã chọn</Tag>
                  </Space>
                }
                style={{ borderColor: borderDefault }}
              >
                <Spin spinning={permissionsLoading} description="Đang tải danh sách quyền...">
                  {permissionsError ? (
                    <Typography.Text type="danger">Không thể tải danh sách quyền từ hệ thống.</Typography.Text>
                  ) : (
                    <>
                      <Input
                        allowClear
                        value={menuSearch}
                        onChange={(event) => {
                          setMenuSearch(event.target.value);
                          setUserExpandedKeys(null);
                        }}
                        placeholder="Tìm tên chức năng"
                        style={{ borderRadius: radiusPill, height: 40, marginBottom: 8 }}
                      />
                      <Tree
                        checkable
                        expandedKeys={effectiveExpandedKeys}
                        onExpand={(keys) => setUserExpandedKeys(keys as string[])}
                        checkedKeys={getVisiblePermissionKeys(checkedKeys, filteredTree)}
                        onCheck={(checked) => {
                          const keys = Array.isArray(checked) ? checked : checked.checked;
                          const merged = mergePermissionKeys(checkedKeys, keys.map(String), filteredTree);
                          setCheckedKeys(merged);
                          form.setFieldsValue({ menuCodes: merged, permissions: merged });
                        }}
                        treeData={filteredTree}
                        style={{ maxHeight: 420, overflow: 'auto' }}
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
      </Drawer>
    </div>
  );
}

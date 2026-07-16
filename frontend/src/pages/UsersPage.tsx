import { useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { Typography, Tooltip, Modal, Form, Input, Select, Row, Col, Spin, Button } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, LockOutlined, UnlockOutlined, KeyOutlined, ExclamationCircleOutlined, FileExcelOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, useToggleLockUser, useResetPassword } from '../hooks/useUsers';
import { useRoles } from '../hooks/useRoles';
import { usePermissionStore } from '../store/permissionStore';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { ScreenHeader, FilterBar, StatusTabs, DataTable } from '../components/list-view';
import Pagination from '../components/list-view/Pagination';
import type { User, CreateUserPayload, UpdateUserPayload } from '../types/user';
import { organizationService } from '../services/organizationService';
import { statusOperational, statusCritical, statusDraft, actionPrimary, textSecondary, fontSizeMd, fontSizeLg, fontWeightMedium, fontWeightBold, cardStyle, dataSea1, radiusPill, borderDefault, spaceFormField } from '../tokens';
import { colors } from '../theme';
const { confirm } = Modal;

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  active: { color: 'green', label: 'Hoạt động' },
  locked: { color: 'red', label: 'Đã khóa' },
  inactive: { color: 'default', label: 'Không hoạt động' },
};

function getRoleTagClass(roleId: string): string {
  switch (roleId) {
    case 'ROLE_SYSTEM_ADMIN': return 'role-tag--admin';
    case 'ROLE_ADMIN': return 'role-tag--org-admin';
    case 'ROLE_MANAGER': return 'role-tag--manager';
    case 'ROLE_VIEWER': return 'role-tag--viewer';
    default: return 'role-tag--user';
  }
}

const labelProps = (text: string) => ({ label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span> });

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [filterRoleId, setFilterRoleId] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend' | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const resp = await organizationService.list({ pageSize: 1000 });
        setOrganizations(resp.data || []);
      } catch (err) { console.error('Failed to load organizations', err); }
    })();
  }, []);

  const hasPerm = usePermissionStore((s) => s.hasPermission);

  const { data, isLoading, isError, error, refetch } = useUsers({
    page, pageSize, search: search || undefined,
    roleId: filterRoleId, status: filterStatus, sortField, sortOrder,
  });

  const { data: rolesData } = useRoles();
  const { data: dataActive } = useUsers({ page: 1, pageSize: 1, status: 'active' });
  const { data: dataLocked } = useUsers({ page: 1, pageSize: 1, status: 'locked' });
  const { data: dataInactive } = useUsers({ page: 1, pageSize: 1, status: 'inactive' });
  const totalAll = (dataActive?.total || 0) + (dataLocked?.total || 0) + (dataInactive?.total || 0);
  const countActive = dataActive?.total || 0;
  const countLocked = dataLocked?.total || 0;
  const countInactive = dataInactive?.total || 0;

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const toggleLock = useToggleLockUser();
  const resetPassword = useResetPassword();

  const openCreateModal = useCallback(() => { setEditingUser(null); form.resetFields(); setModalOpen(true); }, [form]);

  const openEditModal = useCallback((user: User) => {
    setEditingUser(user);
    form.setFieldsValue({ fullName: user.fullName, email: user.email, phone: user.phone, roleId: user.roleId, orgUnitId: user.orgUnitId, status: user.status });
    setModalOpen(true);
  }, [form]);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      if (editingUser) {
        const payload: UpdateUserPayload = { fullName: values.fullName, email: values.email, phone: values.phone, roleId: values.roleId, orgUnitId: values.orgUnitId };
        await updateUser.mutateAsync({ id: editingUser.id, payload });
      } else {
        const payload: CreateUserPayload = { username: values.username, fullName: values.fullName, email: values.email, phone: values.phone, password: values.password, roleId: values.roleId, orgUnitId: values.orgUnitId };
        await createUser.mutateAsync(payload);
      }
      setModalOpen(false);
    } catch {} finally { setSubmitting(false); }
  }, [editingUser, form, createUser, updateUser]);

  const handleDelete = useCallback((user: User) => {
    confirm({ title: 'Xác nhận xóa người dùng', icon: <ExclamationCircleOutlined />, content: `Bạn có chắc chắn muốn xóa người dùng "${user.fullName}"? Hành động này không thể hoàn tác.`, okText: 'Xóa', okType: 'danger', cancelText: 'Hủy', onOk: () => deleteUser.mutateAsync(user.id) });
  }, [deleteUser]);

  const handleToggleLock = useCallback((user: User) => {
    const willBeLocked = user.status !== 'locked';
    confirm({ title: willBeLocked ? 'Xác nhận khóa tài khoản' : 'Xác nhận mở khóa tài khoản', icon: <ExclamationCircleOutlined />, content: willBeLocked ? `Tài khoản "${user.fullName}" sẽ bị khóa và không thể đăng nhập. Tiếp tục?` : `Tài khoản "${user.fullName}" sẽ được mở khóa. Tiếp tục?`, okText: willBeLocked ? 'Khóa' : 'Mở khóa', okType: willBeLocked ? 'danger' : 'primary', cancelText: 'Hủy', onOk: () => toggleLock.mutateAsync(user.id) });
  }, [toggleLock]);

  const handleResetPassword = useCallback((user: User) => {
    confirm({ title: 'Xác nhận đặt lại mật khẩu', icon: <ExclamationCircleOutlined />, content: `Mật khẩu của "${user.fullName}" sẽ được đặt lại thành mật khẩu ngẫu nhiên. Tiếp tục?`, okText: 'Đặt lại', cancelText: 'Hủy', onOk: () => resetPassword.mutateAsync(user.id) });
  }, [resetPassword]);

  const handleFilterSearch = useCallback((values: Record<string, any>) => {
    setSearch(values.search || ''); setFilterRoleId(values.roleId || undefined); setFilterStatus(values.status || undefined); setPage(1);
  }, []);

  const handleFilterReset = useCallback(() => { setSearch(''); setFilterRoleId(undefined); setFilterStatus(undefined); setPage(1); }, []);

  const handleTabChange = useCallback((key: string) => { setFilterStatus(key === 'all' ? undefined : key); setPage(1); }, []);

  const handleSort = useCallback((key: string, order: 'asc' | 'desc') => { setSortField(key); setSortOrder(order === 'asc' ? 'ascend' : 'descend'); }, []);

  const handlePageChange = useCallback((p: number, ps: number) => { setPage(p); setPageSize(ps); }, []);

  const rowActions = useCallback((record: User) => {
    const actions: {
      key: string; label: string; icon?: ReactNode;
      onClick: () => void; danger?: boolean;
    }[] = [];
    if (hasPerm('user.edit')) actions.push({ key: 'edit', label: 'Sửa', icon: <EditOutlined />, onClick: () => openEditModal(record) });
    if (hasPerm('user.lock')) actions.push({ key: 'lock', label: record.status === 'locked' ? 'Mở khóa' : 'Khóa', icon: record.status === 'locked' ? <UnlockOutlined /> : <LockOutlined />, onClick: () => handleToggleLock(record) });
    if (hasPerm('user.reset_password')) actions.push({ key: 'reset-password', label: 'Reset mật khẩu', icon: <KeyOutlined />, onClick: () => handleResetPassword(record) });
    if (hasPerm('user.delete')) actions.push({ key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, onClick: () => handleDelete(record), danger: true });
    return actions;
  }, [hasPerm, openEditModal, handleToggleLock, handleResetPassword, handleDelete]);

  const columns = useMemo(() => [
    { key: 'stt', label: 'STT', width: 60, type: 'mono' as const, align: 'center' as const, render: (_: unknown, __: unknown, idx: number) => <span style={{ fontSize: fontSizeMd }}>{(page - 1) * pageSize + idx + 1}</span> },
    { key: 'fullName', label: 'Họ và tên', dataIndex: 'fullName', width: 200, sortable: true, sorter: true, align: 'left' as const, sortOrder: sortField === 'fullName' ? sortOrder : null, render: (text: string) => <Typography.Text strong>{text}</Typography.Text> },
    { key: 'username', label: 'Tên đăng nhập', dataIndex: 'username', width: 150, sortable: true, align: 'left' as const, sortOrder: sortField === 'username' ? sortOrder : null },
    { key: 'email', label: 'Email', dataIndex: 'email', width: 200, sortable: true, align: 'left' as const, sortOrder: sortField === 'email' ? sortOrder : null },
    { key: 'roleName', label: 'Vai trò', dataIndex: 'roleName', width: 180, sortable: true, align: 'center' as const, sortOrder: sortField === 'roleName' ? sortOrder : null, render: (text: string, record: User) => {
      const variant = getRoleTagClass(record.roleId);
      if (variant !== 'role-tag--user') {
        return <span className={`role-tag ${variant}`}>{text}</span>;
      }
      return (
        <span style={{
          display: 'inline-flex', fontSize: fontSizeMd, fontWeight: fontWeightMedium,
          padding: '2px 10px', borderRadius: 8,
          background: `${dataSea1}15`, color: dataSea1,
        }}>{text}</span>
      );
    } },
    { key: 'orgUnitName', label: 'Đơn vị', dataIndex: 'orgUnitName', width: 200, sortable: true, align: 'left' as const, sortOrder: sortField === 'orgUnitName' ? sortOrder : null, render: (text: string) => text ? <Typography.Text>{text}</Typography.Text> : <Typography.Text type="secondary">—</Typography.Text> },
    { key: 'lastLoginAt', label: 'Đăng nhập cuối', dataIndex: 'lastLoginAt', width: 170, sortable: true, align: 'center' as const, sortOrder: sortField === 'lastLoginAt' ? sortOrder : null, render: (text: string) => text ? <span>{dayjs(text).format('DD/MM/YYYY HH:mm')}</span> : <Typography.Text type="secondary">Chưa đăng nhập</Typography.Text> },
    { key: 'status', label: 'Trạng thái', dataIndex: 'status', width: 140, sortable: true, align: 'center' as const, sortOrder: sortField === 'status' ? sortOrder : null, render: (status: string) => { const isActive = status === 'active'; const isLocked = status === 'locked'; const color = isActive ? actionPrimary : isLocked ? statusCritical : statusDraft; const label = STATUS_MAP[status]?.label || status; return ( <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: 8, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${color}15`, color }}> {label} </span> ); } },
  ], [page, pageSize, sortField, sortOrder]);

  const renderContent = () => {
    if (isLoading) return <LoadingSkeleton rows={8} />;
    if (isError) return <ErrorState message={error?.message || 'Không thể tải danh sách người dùng'} onRetry={() => refetch()} />;
    const tableData = data?.data || [];
    if (tableData.length === 0) {
      if (search || filterRoleId || filterStatus) return <EmptyState description="Không tìm thấy người dùng nào phù hợp" />;
      return <EmptyState description="Chưa có người dùng nào" ctaText="Thêm người dùng đầu tiên" onCta={openCreateModal} />;
    }
    return <div style={{ overflowX: 'auto' }}><DataTable columns={columns} dataSource={tableData} rowKey="id" rowActions={rowActions} loading={deleteUser.isPending || toggleLock.isPending} scroll={{ x: 1200 }} onSort={handleSort} /><Pagination total={data?.total || 0} current={page} pageSize={pageSize} onChange={handlePageChange} /></div>;
  };


  const filterFields = useMemo(() => [
    { key: 'search', type: 'search' as const, label: 'Tìm kiếm', placeholder: 'Tìm theo tên, email, username...' },
    { key: 'roleId', type: 'select' as const, label: 'Vai trò', placeholder: 'Chọn vai trò', options: rolesData?.map((r: any) => ({ value: r.code, label: r.name })) || [] },
    { key: 'status', type: 'select' as const, label: 'Trạng thái', placeholder: 'Chọn trạng thái', options: [{ value: 'active', label: 'Hoạt động' }, { value: 'locked', label: 'Đã khóa' }, { value: 'inactive', label: 'Không hoạt động' }] },
  ], [rolesData]);

  const headerActions = useMemo(() => {
    const actions: any[] = [];
    if (hasPerm('user.create')) actions.push({ key: 'create', label: 'Thêm mới', variant: 'primary' as const, icon: <PlusOutlined />, onClick: openCreateModal });
    actions.push({ key: 'export', label: '', variant: 'subtle' as const, icon: <FileExcelOutlined style={{ color: statusOperational }} />, borderColor: `${statusOperational}80`, color: statusOperational, onClick: () => {} });
    return actions;
  }, [hasPerm, openCreateModal, statusOperational]);

  return (
    <div style={{ minHeight: '100%', marginTop: -8 }}>
      <ScreenHeader breadcrumb={[{ label: 'Quản trị hệ thống' }, { label: 'Quản lý người dùng' }]} actions={headerActions} />
      <FilterBar fields={filterFields} onSearch={handleFilterSearch} onReset={handleFilterReset} />
      <div style={{ ...cardStyle, marginBottom: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '8px 16px' }}>
        <StatusTabs
          tabs={[
            { key: 'all', label: 'Tất cả', count: totalAll, color: textSecondary, active: !filterStatus },
            { key: 'active', label: 'Hoạt động', count: countActive, color: actionPrimary, active: filterStatus === 'active' },
            { key: 'locked', label: 'Đã khóa', count: countLocked, color: statusCritical, active: filterStatus === 'locked' },
            { key: 'inactive', label: 'Không hoạt động', count: countInactive, color: statusDraft, active: filterStatus === 'inactive' },
          ]}
          onChange={handleTabChange}
        />
      </div>
      <div style={{ ...cardStyle, padding: '8px 16px' }}>
        {renderContent()}
      </div>

      <Modal title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>{editingUser ? 'Sửa người dùng' : 'Thêm mới người dùng'}</span>} open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)} destroyOnHidden confirmLoading={submitting} width={600} maskClosable={false}
        footer={[
          <Button key="cancel" onClick={() => setModalOpen(false)} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="ok" type="primary" onClick={handleSubmit} loading={submitting} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>{editingUser ? 'Cập nhật' : 'Tạo mới'}</Button>,
        ]}
      >
        <Spin spinning={submitting}>
          <Form form={form} layout="vertical" style={{ marginTop: 16 }}
            labelCol={{ style: { padding: 0, marginBottom: 4 } }}
          >
            {!editingUser && (<>
              <Form.Item name="username" {...labelProps('Tên đăng nhập')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }, { min: 4, message: 'Tối thiểu 4 ký tự' }, { pattern: /^[a-z0-9_]+$/, message: 'Chỉ chứa chữ thường, số và dấu gạch dưới' }]}><Input placeholder="vd: nguyenvana" autoComplete="off" style={{ borderRadius: radiusPill, height: 40 }} /></Form.Item>
              <Form.Item name="password" {...labelProps('Mật khẩu')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }, { min: 8, message: 'Tối thiểu 8 ký tự' }, { pattern: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).+$/, message: 'Phải có ít nhất 1 chữ hoa, 1 chữ thường và 1 số' }]}><Input.Password placeholder="Ít nhất 8 ký tự" autoComplete="new-password" style={{ borderRadius: radiusPill, height: 40 }} /></Form.Item>
            </>)}
            <Form.Item name="fullName" {...labelProps('Họ và tên')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}><Input placeholder="Nguyễn Văn A" style={{ borderRadius: radiusPill, height: 40 }} /></Form.Item>
            <Row gutter={16}>
              <Col xs={24} md={12}><Form.Item name="email" {...labelProps('Email')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng nhập email' }, { type: 'email', message: 'Email không hợp lệ' }]}><Input placeholder="email@example.com" style={{ borderRadius: radiusPill, height: 40 }} /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="phone" {...labelProps('Số điện thoại')} style={{ marginBottom: spaceFormField }} rules={[{ pattern: /^0\d{9,10}$/, message: 'Số điện thoại không hợp lệ (10-11 số)' }]}><Input placeholder="0901234567" style={{ borderRadius: radiusPill, height: 40 }} /></Form.Item></Col>
            </Row>
            <Form.Item name="roleId" {...labelProps('Vai trò')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}><Select placeholder="Chọn vai trò" options={rolesData?.map((r: any) => ({ value: r.code, label: r.name }))} style={{ borderRadius: radiusPill, height: 40 }} /></Form.Item>
            <Form.Item name="orgUnitId" {...labelProps('Đơn vị trực thuộc')} style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn đơn vị trực thuộc" allowClear showSearch filterOption={(input: string, option: any) => (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())} options={organizations.map((org: any) => ({ value: org.id, label: org.code ? `${org.code} - ${org.name}` : org.name }))} style={{ borderRadius: radiusPill, height: 40 }} /></Form.Item>
          </Form>
        </Spin>
      </Modal>
    </div>
  );
}
